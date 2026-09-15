import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Medication,
  DoseLog,
  DoseStatus,
  ActiveAlarm,
  AudioSettings,
  UserProfile,
  CaretakerNudge,
  MissedDoseAlert,
} from './types';
import {
  loadMedications,
  saveMedications,
  loadDoseLogs,
  saveDoseLogs,
  loadAudioSettings,
  saveAudioSettings,
  loadCurrentProfile,
  saveCurrentProfile,
  loadNudges,
  saveNudges,
  loadDismissedAlertIds,
  saveDismissedAlertIds,
  defaultElderlyProfile,
  defaultCaretakerProfile,
} from './utils/storage';
import {
  formatDateToISO,
  isMedicationActiveOnDate,
  formatTime12h,
  checkIsDoseTooEarly,
} from './utils/dateUtils';
import {
  startContinuousAlarm,
  stopContinuousAlarm,
  playCaretakerAlertSound,
  playSeniorNudgeSound,
} from './utils/audioAlarm';
import { Header } from './components/Header';
import { LoginView } from './components/LoginView';
import { ElderlyView } from './components/ElderlyView';
import { CaretakerView } from './components/CaretakerView';
import { AddMedicationModal } from './components/AddMedicationModal';
import { AlarmAlertModal } from './components/AlarmAlertModal';
import { AudioSettingsModal } from './components/AudioSettingsModal';
import { CallModal } from './components/CallModal';
import { HealthCheckinView } from './components/HealthCheckinView';

export default function App() {
  // Authentication & Profile State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = loadCurrentProfile();
    // Default to Elderly profile initially so the app is instantly usable, or null if logged out
    return saved || defaultElderlyProfile;
  });

  // Core Medication State
  const [medications, setMedications] = useState<Medication[]>(() => loadMedications());
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>(() => loadDoseLogs());
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => loadAudioSettings());

  // Date Selection
  const todayISO = formatDateToISO(new Date());
  const [selectedDateISO, setSelectedDateISO] = useState<string>(todayISO);

  // Caretaker Tab selection
  const [caretakerTab, setCaretakerTab] = useState<'overview' | 'medications' | 'calendar'>('overview');
  const [activeView, setActiveView] = useState<'dashboard' | 'checkin'>('dashboard');

  // Nudges & Alerts between Senior & Caretaker
  const [nudges, setNudges] = useState<CaretakerNudge[]>(() => loadNudges());
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>(() => loadDismissedAlertIds());

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarm | null>(null);

  // Snoozed alarms tracking
  const [snoozedAlarms, setSnoozedAlarms] = useState<Array<{ alarm: ActiveAlarm; fireAt: number }>>([]);

  // Fired minutes prevention tracker
  const firedMinutesRef = useRef<Set<string>>(new Set());
  // Fired caretaker missed alert tracker
  const alertedMissedDoseKeysRef = useRef<Set<string>>(new Set());

  // Persist State Changes
  useEffect(() => {
    saveCurrentProfile(userProfile);
  }, [userProfile]);

  useEffect(() => {
    saveMedications(medications);
  }, [medications]);

  useEffect(() => {
    saveDoseLogs(doseLogs);
  }, [doseLogs]);

  useEffect(() => {
    saveAudioSettings(audioSettings);
  }, [audioSettings]);

  useEffect(() => {
    saveNudges(nudges);
  }, [nudges]);

  useEffect(() => {
    saveDismissedAlertIds(dismissedAlertIds);
  }, [dismissedAlertIds]);

  // Compute Missed Doses for Caretaker Notification
  const getActiveMissedDoses = useCallback((): MissedDoseAlert[] => {
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    const activeToday = medications.filter((m) => isMedicationActiveOnDate(m, todayISO));
    const missedList: MissedDoseAlert[] = [];

    activeToday.forEach((med) => {
      med.times.forEach((t) => {
        const doseKey = `${med.id}_${todayISO}_${t.time}`;
        const log = doseLogs.find((l) => l.id === doseKey);
        const status = log ? log.status : 'pending';

        // Dose is missed if time has passed and senior hasn't marked it taken
        if (status === 'pending' && t.time < currentTimeStr) {
          const alertId = `missed_${doseKey}`;
          if (!dismissedAlertIds.includes(alertId)) {
            missedList.push({
              id: alertId,
              medicationId: med.id,
              medicationName: med.name,
              dosage: med.dosage,
              scheduledTime: t.time,
              label: t.label,
              scheduledLabel: t.label,
              date: todayISO,
              detectedAt: Date.now(),
              elderlyName: userProfile?.elderlyName || 'Grandpa Robert',
              dismissed: false,
            });
          }
        }
      });
    });

    return missedList;
  }, [medications, todayISO, doseLogs, dismissedAlertIds, userProfile]);

  const missedDoses = getActiveMissedDoses();

  // Watchdog Loop: Handles alarms for Senior AND Missed Dose Alerts for Caretaker
  useEffect(() => {
    const checkLoop = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentMinuteKey = `${currentHours}:${currentMinutes}`;
      const nowTimestamp = now.getTime();
      const currentTodayISO = formatDateToISO(now);

      // 1. Check snoozed alarms
      const dueSnoozed = snoozedAlarms.filter((s) => nowTimestamp >= s.fireAt);
      if (dueSnoozed.length > 0) {
        const nextSnooze = dueSnoozed[0];
        setSnoozedAlarms((prev) => prev.filter((s) => s !== nextSnooze));
        triggerAlarmModal(nextSnooze.alarm);
        return;
      }

      // 2. Check scheduled medication alarms for Senior
      if (!firedMinutesRef.current.has(currentMinuteKey)) {
        const activeToday = medications.filter((m) => isMedicationActiveOnDate(m, currentTodayISO));

        for (const med of activeToday) {
          for (const t of med.times) {
            if (t.time === currentMinuteKey) {
              const doseId = `${med.id}_${currentTodayISO}_${t.time}`;
              const log = doseLogs.find((l) => l.id === doseId);

              if (!log || log.status === 'pending') {
                firedMinutesRef.current.add(currentMinuteKey);

                const newAlarm: ActiveAlarm = {
                  id: `alarm_${Date.now()}`,
                  medicationId: med.id,
                  medicationName: med.name,
                  dosage: med.dosage,
                  instructions: med.instructions,
                  time: t.time,
                  label: t.label,
                  color: med.color,
                  triggeredAt: Date.now(),
                };

                triggerAlarmModal(newAlarm);
                return;
              }
            }
          }
        }
      }

      // 3. Caretaker Notification Check:
      // If user is currently in Caretaker role, notify immediately when a missed dose is detected!
      if (userProfile?.role === 'caretaker') {
        const currentMissed = getActiveMissedDoses();
        for (const alert of currentMissed) {
          if (!alertedMissedDoseKeysRef.current.has(alert.id)) {
            alertedMissedDoseKeysRef.current.add(alert.id);

            // Play specialized Caretaker audio alert
            if (audioSettings.enabled) {
              playCaretakerAlertSound();
            }

            // Browser notification
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              try {
                new Notification(`⚠️ CareCircle Alert: Missed Dose!`, {
                  body: `${alert.elderlyName} has NOT taken ${alert.medicationName} (${alert.dosage}) scheduled for ${formatTime12h(alert.scheduledTime)}.`,
                  icon: '/favicon.ico',
                });
              } catch (e) {
                console.error('Notification error:', e);
              }
            }
          }
        }
      }
    };

    const interval = setInterval(checkLoop, 2500);
    return () => clearInterval(interval);
  }, [medications, doseLogs, snoozedAlarms, audioSettings, userProfile, getActiveMissedDoses]);

  // Trigger Senior Alarm Modal & Audio
  const triggerAlarmModal = (alarm: ActiveAlarm) => {
    setActiveAlarm(alarm);

    if (audioSettings.enabled) {
      startContinuousAlarm(audioSettings.tone, audioSettings.volume);
    }

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(`Time for Medicine: ${alarm.medicationName}`, {
          body: `Dose: ${alarm.dosage} (${alarm.label} at ${formatTime12h(alarm.time)})`,
          icon: '/favicon.ico',
        });
      } catch (e) {
        console.error('Notification error:', e);
      }
    }
  };

  // Simulate Missed Dose (for testing caretaker notification instantly)
  const handleSimulateMissedDose = () => {
    const med = medications[0];
    if (!med) return;

    // Set a dose earlier in the day
    const pastTime = '08:00';
    const doseKey = `${med.id}_${todayISO}_${pastTime}`;

    // Ensure it is pending in doseLogs
    setDoseLogs((prev) => {
      const filtered = prev.filter((l) => l.id !== doseKey);
      return [
        ...filtered,
        {
          id: doseKey,
          medicationId: med.id,
          date: todayISO,
          time: pastTime,
          label: 'Morning',
          status: 'pending',
        },
      ];
    });

    // Remove from dismissed alert list if it was dismissed before
    const alertId = `missed_${doseKey}`;
    setDismissedAlertIds((prev) => prev.filter((id) => id !== alertId));
    alertedMissedDoseKeysRef.current.delete(alertId);

    // Play Caretaker alert sound
    if (audioSettings.enabled) {
      playCaretakerAlertSound();
    }
  };

  // Caretaker sending a Nudge to the Senior
  const handleSendNudge = (medicationName?: string, customMessage?: string) => {
    const newNudge: CaretakerNudge = {
      id: `nudge_${Date.now()}`,
      senderName: userProfile?.caretakerName || 'Sarah (Caretaker)',
      targetName: userProfile?.elderlyName || 'Grandpa Robert',
      message:
        customMessage ||
        (medicationName
          ? `Gentle reminder to take your ${medicationName} dose with a glass of water.`
          : 'Checking in on you! Please take your scheduled medicine today.'),
      sentAt: Date.now(),
      medicationName,
      acknowledged: false,
    };

    setNudges((prev) => [newNudge, ...prev]);

    // Play senior nudge chime
    if (audioSettings.enabled) {
      playSeniorNudgeSound();
    }
  };

  const handleDismissNudge = (id: string) => {
    setNudges((prev) => prev.filter((n) => n.id !== id));
  };

  const handleDismissAlertId = (alertId: string) => {
    setDismissedAlertIds((prev) => [...prev, alertId]);
  };

  // Medication handlers
  const handleAddMedication = (newMed: Medication) => {
    setMedications((prev) => [newMed, ...prev]);
  };

  const handleRemoveMedication = (id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
    if (activeAlarm?.medicationId === id) {
      stopContinuousAlarm();
      setActiveAlarm(null);
    }
  };

  // Dose status log handlers
  const handleUpdateDoseStatus = (
    medicationId: string,
    dateISO: string,
    time: string,
    label: string,
    status: DoseStatus
  ) => {
    // Safety requirement: For elderly users, prevent marking a dose as taken more than 15 mins before due time
    if (status === 'taken' && userProfile?.role === 'elderly') {
      const earlyCheck = checkIsDoseTooEarly(dateISO, time);
      if (earlyCheck.isTooEarly) {
        console.warn(`[CareCircle] Prevented early dose logging: ${earlyCheck.reason}`);
        return;
      }
    }

    const doseId = `${medicationId}_${dateISO}_${time}`;

    setDoseLogs((prev) => {
      const existingIdx = prev.findIndex((l) => l.id === doseId);
      const newEntry: DoseLog = {
        id: doseId,
        medicationId,
        date: dateISO,
        time,
        label,
        status,
        takenAt: status === 'taken' ? new Date().toISOString() : undefined,
      };

      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = newEntry;
        return copy;
      } else {
        return [...prev, newEntry];
      }
    });

    // If active alarm is for this dose, stop it
    if (activeAlarm && activeAlarm.medicationId === medicationId && activeAlarm.time === time) {
      stopContinuousAlarm();
      setActiveAlarm(null);
    }
  };

  const handleTakeNowFromAlarm = (medicationId: string, time: string, label: string) => {
    handleUpdateDoseStatus(medicationId, todayISO, time, label, 'taken');
    stopContinuousAlarm();
    setActiveAlarm(null);
  };

  const handleSnoozeAlarm = (alarm: ActiveAlarm, minutes: number = 5) => {
    stopContinuousAlarm();
    setActiveAlarm(null);
    const fireAt = Date.now() + minutes * 60 * 1000;
    setSnoozedAlarms((prev) => [...prev, { alarm, fireAt }]);
  };

  const handleDismissAlarm = () => {
    stopContinuousAlarm();
    setActiveAlarm(null);
  };

  // Profile management & Role switching
  const handleLogin = (profile: UserProfile) => {
    setUserProfile(profile);
  };

  const handleSwitchRole = () => {
    if (!userProfile) return;
    const newRole = userProfile.role === 'elderly' ? 'caretaker' : 'elderly';
    const updated: UserProfile = {
      ...userProfile,
      role: newRole,
      name: newRole === 'elderly' ? userProfile.elderlyName : userProfile.caretakerName,
    };
    setUserProfile(updated);
  };

  const handleLogout = () => {
    setUserProfile(null);
  };

  // If no user is logged in, show the Login / Role Selection Screen
  if (!userProfile) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-amber-50/40 text-amber-950 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Application Header */}
      <Header
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenAudioSettings={() => setIsAudioSettingsOpen(true)}
        audioSettings={audioSettings}
        userProfile={userProfile}
        onSwitchRole={handleSwitchRole}
        onLogout={handleLogout}
        missedDoseCount={missedDoses.length}
        activeView={activeView}
        onNavigate={setActiveView}
      />

      {/* Main Content: Conditional Role-Based Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {activeView === 'checkin' ? (
          <HealthCheckinView />
        ) : userProfile.role === 'elderly' ? (
          /* Elderly Person View */
          <ElderlyView
            userProfile={userProfile}
            medications={medications}
            doseLogs={doseLogs}
            selectedDateISO={selectedDateISO}
            onSelectDate={(iso) => setSelectedDateISO(iso)}
            onUpdateDoseStatus={handleUpdateDoseStatus}
            nudges={nudges}
            onDismissNudge={handleDismissNudge}
            onOpenCallModal={() => setIsCallModalOpen(true)}
          />
        ) : (
          /* Caretaker View */
          <CaretakerView
            userProfile={userProfile}
            medications={medications}
            doseLogs={doseLogs}
            selectedDateISO={selectedDateISO}
            onSelectDate={(iso) => setSelectedDateISO(iso)}
            onUpdateDoseStatus={handleUpdateDoseStatus}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onRemoveMedication={handleRemoveMedication}
            onSendNudge={handleSendNudge}
            onOpenCallModal={() => setIsCallModalOpen(true)}
            onSimulateMissedDose={handleSimulateMissedDose}
            dismissedAlertIds={dismissedAlertIds}
            onDismissAlertId={handleDismissAlertId}
            caretakerTab={caretakerTab}
            setCaretakerTab={setCaretakerTab}
          />
        )}
      </main>

      {/* Active Alarm / Reminder Alert Modal Overlay */}
      <AlarmAlertModal
        alarm={activeAlarm}
        onDismiss={handleDismissAlarm}
        onTakeNow={handleTakeNowFromAlarm}
        onSnooze={handleSnoozeAlarm}
      />

      {/* Add Medication Dialog Modal */}
      <AddMedicationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddMedication={handleAddMedication}
      />

      {/* Sound Settings & Chime Tone Selector Modal */}
      <AudioSettingsModal
        isOpen={isAudioSettingsOpen}
        onClose={() => setIsAudioSettingsOpen(false)}
        audioSettings={audioSettings}
        onSaveAudioSettings={(settings) => setAudioSettings(settings)}
      />

      {/* Direct Call Simulation Modal */}
      <CallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        userProfile={userProfile}
      />
    </div>
  );
}
