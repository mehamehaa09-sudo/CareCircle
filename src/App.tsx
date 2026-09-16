import React, { useState, useEffect, useRef } from 'react';
import {
  Medication,
  DoseLog,
  DoseStatus,
  ActiveAlarm,
  AudioSettings,
  UserProfile,
  CaretakerNudge,
  WellnessCheckin,
  WellnessPatternAlert,
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
  loadWellnessCheckins,
  saveWellnessCheckins,
  defaultElderlyProfile,
  defaultCaretakerProfile,
} from './utils/storage';
import {
  formatDateToISO,
  isMedicationActiveOnDate,
  formatTime12h,
} from './utils/dateUtils';
import {
  startContinuousAlarm,
  stopContinuousAlarm,
  playTone,
} from './utils/audioAlarm';
import { Header } from './components/Header';
import { CalendarView } from './components/CalendarView';
import { TodaySchedule } from './components/TodaySchedule';
import { MedicationList } from './components/MedicationList';
import { AddMedicationModal } from './components/AddMedicationModal';
import { AlarmAlertModal } from './components/AlarmAlertModal';
import { AudioSettingsModal } from './components/AudioSettingsModal';
import { LoginView } from './components/LoginView';
import { ElderlyView } from './components/ElderlyView';
import { CaretakerView } from './components/CaretakerView';
import { CallModal } from './components/CallModal';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { HealthQuestionView } from './components/HealthQuestionView';
import { PrescriptionCheckerView } from './components/PrescriptionCheckerView';

export default function App() {
  const [medications, setMedications] = useState<Medication[]>(() => loadMedications());
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>(() => loadDoseLogs());
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => loadAudioSettings());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => loadCurrentProfile());
  const [nudges, setNudges] = useState<CaretakerNudge[]>(() => loadNudges());
  const [wellnessCheckins, setWellnessCheckins] = useState<WellnessCheckin[]>(() => loadWellnessCheckins());
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>(() => loadDismissedAlertIds());
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [caretakerTab, setCaretakerTab] = useState<'overview' | 'medications' | 'calendar'>('overview');

  const todayISO = formatDateToISO(new Date());
  const [selectedDateISO, setSelectedDateISO] = useState<string>(todayISO);
  const [activeView, setActiveView] = useState<'dashboard' | 'health-question' | 'prescription-checker'>('dashboard');

  // Modals & Alarms
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarm | null>(null);

  // Snoozed alarms tracking
  const [snoozedAlarms, setSnoozedAlarms] = useState<Array<{ alarm: ActiveAlarm; fireAt: number }>>([]);

  // To prevent repeated triggers while still allowing multiple doses in one minute
  const firedMinutesRef = useRef<Set<string>>(new Set());

  // Save changes to storage
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
    saveCurrentProfile(userProfile);
  }, [userProfile]);

  useEffect(() => {
    saveNudges(nudges);
  }, [nudges]);

  useEffect(() => {
    saveDismissedAlertIds(dismissedAlertIds);
  }, [dismissedAlertIds]);

  useEffect(() => {
    saveWellnessCheckins(wellnessCheckins);
  }, [wellnessCheckins]);

  const handleLogin = (profile: UserProfile) => {
    setUserProfile(profile);
    setSelectedDateISO(formatDateToISO(new Date()));
  };

  const handleSwitchRole = () => {
    setUserProfile((prev) => {
      const current = prev ?? defaultElderlyProfile;
      return current.role === 'elderly' ? defaultCaretakerProfile : defaultElderlyProfile;
    });
  };

  const handleLogout = () => {
    setUserProfile(null);
    setIsCallModalOpen(false);
    setIsVoiceAssistantOpen(false);
  };

  const handleSendNudge = (medicationName?: string, customMessage?: string) => {
    const senderName = userProfile?.caretakerName || 'Caregiver';
    const message = customMessage || `Please check on ${medicationName || 'your medication'} soon.`;
    setNudges((prev) => [{
      id: `nudge_${Date.now()}`,
      senderName,
      message,
      timestamp: Date.now(),
      medicationName,
      acknowledged: false,
    }, ...prev]);
  };

  const handleDismissNudge = (id: string) => {
    setNudges((prev) => prev.filter((nudge) => nudge.id !== id));
  };

  const handleWellnessCheckin = (checkin: WellnessCheckin) => {
    setWellnessCheckins((prev) => [checkin, ...prev]);
  };

  const wellnessAlerts = (() => {
    const symptomMap = new Map<string, { id: string; symptom: string; occurrences: number; firstReportedOn: string; latestReportedOn: string; severity: 'low' | 'medium' | 'high' }>();

    for (const checkin of wellnessCheckins) {
      if (!checkin.symptoms?.length) continue;
      for (const symptom of checkin.symptoms) {
        const key = symptom.toLowerCase();
        const existing = symptomMap.get(key);
        const hitDate = checkin.date || formatDateToISO(new Date(checkin.createdAt));
        if (existing) {
          existing.occurrences += 1;
          existing.latestReportedOn = hitDate;
        } else {
          symptomMap.set(key, {
            id: `alert_${key}`,
            symptom,
            occurrences: 1,
            firstReportedOn: hitDate,
            latestReportedOn: hitDate,
            severity: 'medium',
          });
        }
      }
    }

    return Array.from(symptomMap.values())
      .filter((alert) => alert.occurrences >= 2)
      .map((alert) => ({
        id: alert.id,
        symptom: alert.symptom,
        occurrences: alert.occurrences,
        firstReportedOn: alert.firstReportedOn,
        latestReportedOn: alert.latestReportedOn,
        severity: alert.severity,
      }));
  })();

  // Medication Dose Alarm Monitoring Loop
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const nowTimestamp = now.getTime();
      const currentTodayISO = formatDateToISO(now);

      // Check snoozed alarms first
      const dueSnoozed = snoozedAlarms.filter((s) => nowTimestamp >= s.fireAt);
      if (dueSnoozed.length > 0) {
        const nextSnooze = dueSnoozed[0];
        setSnoozedAlarms((prev) => prev.filter((s) => s !== nextSnooze));
        triggerAlarmModal(nextSnooze.alarm);
        return;
      }

      // Check scheduled medications for today
      const activeToday = medications.filter((m) => isMedicationActiveOnDate(m, currentTodayISO));

      for (const med of activeToday) {
        for (const t of med.times) {
          if (t.time === `${currentHours}:${currentMinutes}`) {
            // Check if dose has already been taken
            const doseId = `${med.id}_${currentTodayISO}_${t.time}`;
            const log = doseLogs.find((l) => l.id === doseId);

            if ((!log || log.status === 'pending') && !firedMinutesRef.current.has(doseId)) {
              firedMinutesRef.current.add(doseId);

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
    };

    const interval = setInterval(checkAlarms, 2000);
    return () => clearInterval(interval);
  }, [medications, doseLogs, snoozedAlarms, audioSettings]);

  // Clean old fired minutes at midnight or after 60 records
  useEffect(() => {
    if (firedMinutesRef.current.size > 120) {
      firedMinutesRef.current.clear();
    }
  }, []);

  const triggerAlarmModal = (alarm: ActiveAlarm) => {
    setActiveAlarm(alarm);

    if (audioSettings.enabled) {
      startContinuousAlarm(audioSettings.tone, audioSettings.volume);
    }

    // Trigger browser notification if supported and granted
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

  // Test Alarm Sound manual trigger
  const handleTriggerTestAlarm = () => {
    const med = medications[0] || {
      id: 'test-med',
      name: 'Dolo 650 (Test Sample)',
      dosage: '650 mg',
      instructions: 'after_food',
      color: '#3b82f6',
    };

    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');

    const testAlarm: ActiveAlarm = {
      id: `test_alarm_${Date.now()}`,
      medicationId: med.id,
      medicationName: med.name,
      dosage: med.dosage,
      instructions: med.instructions,
      time: `${h}:${m}`,
      label: 'Scheduled Time',
      color: med.color || '#3b82f6',
      triggeredAt: Date.now(),
    };

    triggerAlarmModal(testAlarm);
  };

  const handleTriggerAlarmForMed = (med: Medication, time: string, label: string) => {
    const alarm: ActiveAlarm = {
      id: `alarm_med_${Date.now()}`,
      medicationId: med.id,
      medicationName: med.name,
      dosage: med.dosage,
      instructions: med.instructions,
      time,
      label,
      color: med.color,
      triggeredAt: Date.now(),
    };
    triggerAlarmModal(alarm);
  };

  // Medication handlers
  const handleAddMedication = (newMed: Medication) => {
    setMedications((prev) => [newMed, ...prev]);
  };

  const handleRemoveMedication = (id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
    // Also remove from any active alarm if current
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

    // If active alarm is for this dose, close it
    if (activeAlarm && activeAlarm.medicationId === medicationId && activeAlarm.time === time) {
      stopContinuousAlarm();
      setActiveAlarm(null);
    }
  };

  const handleTakeNowFromAlarm = (medicationId: string, time: string, label: string) => {
    handleUpdateDoseStatus(medicationId, formatDateToISO(new Date()), time, label, 'taken');
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

  if (!userProfile) {
    return <LoginView onLogin={handleLogin} />;
  }

  const innerApp = (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Header
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenAudioSettings={() => setIsAudioSettingsOpen(true)}
        onTriggerTestAlarm={handleTriggerTestAlarm}
        audioSettings={audioSettings}
        userProfile={userProfile}
        onSwitchRole={handleSwitchRole}
        onLogout={handleLogout}
        missedDoseCount={0}
        onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
        onOpenHealthQuestion={() => setIsVoiceAssistantOpen(true)}
        onOpenPrescriptionChecker={() => setIsAddModalOpen(true)}
        activeView={activeView}
        onNavigate={setActiveView}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeView === 'health-question' ? (
          <HealthQuestionView />
        ) : activeView === 'prescription-checker' ? (
          <PrescriptionCheckerView />
        ) : userProfile.role === 'elderly' ? (
          <ElderlyView
            userProfile={userProfile}
            medications={medications}
            doseLogs={doseLogs}
            selectedDateISO={selectedDateISO}
            onSelectDate={setSelectedDateISO}
            onUpdateDoseStatus={handleUpdateDoseStatus}
            onTriggerAlarmForMed={handleTriggerAlarmForMed}
            onRemoveMedication={handleRemoveMedication}
            nudges={nudges}
            onDismissNudge={handleDismissNudge}
            onOpenCallModal={() => setIsCallModalOpen(true)}
            onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
            wellnessCheckins={wellnessCheckins}
            onWellnessCheckin={handleWellnessCheckin}
          />
        ) : (
          <CaretakerView
            userProfile={userProfile}
            medications={medications}
            doseLogs={doseLogs}
            selectedDateISO={selectedDateISO}
            onSelectDate={setSelectedDateISO}
            onUpdateDoseStatus={handleUpdateDoseStatus}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onRemoveMedication={handleRemoveMedication}
            onTriggerAlarmForMed={handleTriggerAlarmForMed}
            onSendNudge={handleSendNudge}
            onOpenCallModal={() => setIsCallModalOpen(true)}
            onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
            onSimulateMissedDose={handleTriggerTestAlarm}
            dismissedAlertIds={dismissedAlertIds}
            onDismissAlertId={(id) => setDismissedAlertIds((prev) => [...prev, id])}
            caretakerTab={caretakerTab}
            setCaretakerTab={setCaretakerTab}
            wellnessCheckins={wellnessCheckins}
            wellnessAlerts={wellnessAlerts}
          />
        )}
      </main>

      <AlarmAlertModal
        alarm={activeAlarm}
        onDismiss={handleDismissAlarm}
        onTakeNow={handleTakeNowFromAlarm}
        onSnooze={handleSnoozeAlarm}
      />

      <AddMedicationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddMedication={handleAddMedication}
      />

      <AudioSettingsModal
        isOpen={isAudioSettingsOpen}
        onClose={() => setIsAudioSettingsOpen(false)}
        audioSettings={audioSettings}
        onSaveAudioSettings={(settings) => setAudioSettings(settings)}
      />

      <CallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        userProfile={userProfile}
      />

      <VoiceAssistantModal
        isOpen={isVoiceAssistantOpen}
        onClose={() => setIsVoiceAssistantOpen(false)}
        userProfile={userProfile}
        medications={medications}
        todayDoses={doseLogs.filter((log) => log.date === todayISO)}
        onUpdateDoseStatus={(doseId, status) => {
          const target = doseLogs.find((log) => log.id === doseId);
          if (target) {
            handleUpdateDoseStatus(target.medicationId, target.date, target.time, target.label, status);
          }
        }}
        onInitiateCall={() => setIsCallModalOpen(true)}
      />
    </div>
  );

  return innerApp;
}
