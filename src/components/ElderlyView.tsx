import React, { useState, useEffect } from 'react';
import {
  Medication,
  DoseLog,
  DoseStatus,
  UserProfile,
  CaretakerNudge,
  ActiveAlarm,
  FoodInstruction,
} from '../types';
import {
  formatTime12h,
  formatDateToISO,
  isMedicationActiveOnDate,
  checkIsDoseTooEarly,
} from '../utils/dateUtils';
import {
  CheckCircle2,
  Clock,
  Phone,
  Heart,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Info,
  Lock,
  RotateCcw,
  Mic,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { playSeniorNudgeSound } from '../utils/audioAlarm';
import { useLanguage } from '../context/LanguageContext';
import { CareCircleMascot } from './CareCircleMascot';
import { WellnessCheckin } from '../types';
import { WellnessCompanion } from './WellnessCompanion';

interface ElderlyViewProps {
  userProfile: UserProfile;
  medications: Medication[];
  doseLogs: DoseLog[];
  selectedDateISO: string;
  onSelectDate: (iso: string) => void;
  onUpdateDoseStatus: (
    medicationId: string,
    dateISO: string,
    time: string,
    label: string,
    status: DoseStatus
  ) => void;
  onTriggerAlarmForMed: (med: Medication, time: string, label: string) => void;
  onRemoveMedication: (id: string) => void;
  nudges: CaretakerNudge[];
  onDismissNudge: (id: string) => void;
  onOpenCallModal: () => void;
  onOpenVoiceAssistant?: () => void;
  wellnessCheckins: WellnessCheckin[];
  onWellnessCheckin: (checkin: WellnessCheckin) => void;
}

export const ElderlyView: React.FC<ElderlyViewProps> = ({
  userProfile,
  medications,
  doseLogs,
  selectedDateISO,
  onSelectDate,
  onUpdateDoseStatus,
  onTriggerAlarmForMed,
  onRemoveMedication,
  nudges,
  onDismissNudge,
  onOpenCallModal,
  onOpenVoiceAssistant,
  wellnessCheckins,
  onWellnessCheckin,
}) => {
  const { t, formatLocalizedDate, formatLocalizedTime } = useLanguage();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [confirmDeleteMedId, setConfirmDeleteMedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const todayISO = formatDateToISO(currentTime);
  const isToday = selectedDateISO === todayISO;

  // Helpers for localized instructions and schedule labels
  const getFoodInstructionName = (inst: FoodInstruction): string => {
    switch (inst) {
      case 'after_food': return t('afterFood');
      case 'before_food': return t('beforeFood');
      case 'with_food': return t('withFood');
      case 'empty_stomach': return t('emptyStomach');
      case 'anytime': return t('anytime');
      default: return inst;
    }
  };

  const getScheduleLabelName = (label: string): string => {
    const l = label.toLowerCase();
    if (l.includes('morning')) return t('morning');
    if (l.includes('afternoon')) return t('afternoon');
    if (l.includes('evening')) return t('evening');
    if (l.includes('night')) return t('night');
    if (l.includes('custom')) return t('custom');
    return label;
  };

  // Filter medications active for this date
  const activeMeds = medications.filter((m) => isMedicationActiveOnDate(m, selectedDateISO));

  // Flatten all scheduled doses
  interface DoseSlot {
    med: Medication;
    time: string;
    label: string;
    status: DoseStatus;
    takenAt?: string;
    isPastDue: boolean;
  }

  const currentHours = String(currentTime.getHours()).padStart(2, '0');
  const currentMins = String(currentTime.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMins}`;

  const allDoses: DoseSlot[] = [];
  activeMeds.forEach((med) => {
    med.times.forEach((t) => {
      const log = doseLogs.find((l) => l.id === `${med.id}_${selectedDateISO}_${t.time}`);
      const status: DoseStatus = log ? log.status : 'pending';
      const isPastDue = isToday && status === 'pending' && currentTimeStr > t.time;

      allDoses.push({
        med,
        time: t.time,
        label: t.label,
        status,
        takenAt: log?.takenAt,
        isPastDue,
      });
    });
  });

  // Sort chronologically
  allDoses.sort((a, b) => a.time.localeCompare(b.time));

  // Find next pending dose
  const nextPendingDose = isToday
    ? allDoses.find((d) => d.status === 'pending')
    : null;

  const totalDoses = allDoses.length;
  const takenDoses = allDoses.filter((d) => d.status === 'taken').length;
  const missedCount = allDoses.filter((d) => d.isPastDue).length;
  const journeyHint = nextPendingDose ? `Your next medicine is ${nextPendingDose.med.name} at ${formatLocalizedTime(nextPendingDose.time)}.` : 'I can help you keep track of today’s care routine.';

  const handleDateChange = (offset: number) => {
    const [y, m, d] = selectedDateISO.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + offset);
    onSelectDate(formatDateToISO(date));
  };

  const getGreeting = () => {
    const hr = currentTime.getHours();
    if (hr < 12) return t('goodMorning');
    if (hr < 17) return t('goodAfternoon');
    return t('goodEvening');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Caretaker Reminder Nudges (High-Priority Friendly Banner) */}
      {nudges.length > 0 && (
        <div className="space-y-3">
          {nudges.map((nudge) => (
            <div
              key={nudge.id}
              className="bg-amber-100/90 border-2 border-amber-400 rounded-3xl p-5 shadow-lg shadow-amber-300/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse-subtle"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Heart className="w-6 h-6 fill-amber-950 text-amber-950" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full">
                      {t('reminderFrom', { sender: nudge.senderName })}
                    </span>
                    <span className="text-xs text-amber-800">{t('justNow')}</span>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-amber-950 mt-1">
                    "{nudge.message}"
                  </p>
                </div>
              </div>
              <button
                type="button"
                id={`btn-dismiss-nudge-${nudge.id}`}
                onClick={() => onDismissNudge(nudge.id)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-sm shadow-sm transition-all cursor-pointer"
              >
                {t('dismiss')}
              </button>
            </div>
          ))}
        </div>
      )}
      <WellnessCompanion name={userProfile.elderlyName} checkins={wellnessCheckins} journeyHint={journeyHint} onSubmit={onWellnessCheckin} />

      {/* Senior Hero Greeting Card in Butter Yellow */}
      <div className="bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-200/90 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="grid grid-cols-[7rem_minmax(0,1fr)] sm:grid-cols-[10rem_minmax(0,1fr)_auto] items-center gap-3 sm:gap-5">
          <CareCircleMascot size="lg" speaking className="self-end" />
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-200/80 border border-amber-300/80 text-amber-900 text-xs font-semibold mb-2">
              <Heart className="w-3.5 h-3.5 fill-amber-700 text-amber-700" />
              <span>{t('circleCode')}: {userProfile.circleCode} • {userProfile.caretakerName}</span>
            </div>
            <span className="inline-block px-2.5 py-1 rounded-lg rounded-bl-sm bg-white text-[10px] font-extrabold uppercase tracking-wider text-amber-700 mb-1">Poppy says hello</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-amber-950 tracking-tight">
              {getGreeting()}, {userProfile.elderlyName}!
            </h1>
            <p className="text-amber-900/80 text-sm sm:text-base mt-1">
              {isToday ? (
                totalDoses === 0 ? (
                  t('noMedsToday')
                ) : takenDoses === totalDoses ? (
                  t('allMedsTaken')
                ) : (
                  t('dosesTakenCount', { taken: takenDoses, total: totalDoses })
                )
              ) : (
                t('viewingScheduleFor', { date: formatLocalizedDate(selectedDateISO + 'T00:00:00') })
              )}
            </p>
          </div>

          {/* Quick Actions: Call Caretaker & AI Voice Assistant */}
          <div className="col-span-2 sm:col-span-1 flex flex-wrap items-center gap-2.5">
            {onOpenVoiceAssistant && (
              <button
                type="button"
                id="btn-elderly-voice-assistant"
                onClick={onOpenVoiceAssistant}
                className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:from-amber-500 hover:to-yellow-500 border-2 border-amber-400 text-amber-950 font-extrabold text-sm sm:text-base shadow-sm flex items-center space-x-2.5 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-amber-950 text-amber-300 flex items-center justify-center">
                  <Mic className="w-4 h-4 animate-pulse" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-amber-900 tracking-wider flex items-center space-x-1">
                    <span>{t('voiceAssistant')}</span>
                    <Sparkles className="w-2.5 h-2.5 text-amber-800" />
                  </div>
                  <div>{t('tapToSpeak')}</div>
                </div>
              </button>
            )}

            <button
              type="button"
              id="btn-elderly-call-caretaker"
              onClick={onOpenCallModal}
              className="px-5 py-3.5 rounded-2xl bg-white hover:bg-amber-50 border-2 border-amber-300 text-amber-950 font-bold text-sm sm:text-base shadow-sm flex items-center space-x-2.5 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">
                  {t('emergencyContact')}
                </div>
                <div>{t('callSenior', { senior: userProfile.caretakerName })}</div>
              </div>
            </button>
          </div>
        </div>

        {/* Date Selector for Seniors */}
        <div className="mt-6 pt-5 border-t border-amber-300/60 flex items-center justify-between">
          <button
            type="button"
            id="btn-elderly-prev-day"
            onClick={() => handleDateChange(-1)}
            className="p-2.5 rounded-xl bg-white/80 hover:bg-white text-amber-950 border border-amber-300 font-bold flex items-center space-x-1 text-sm shadow-xs cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t('yesterday')}</span>
          </button>

          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-amber-700" />
            <span className="font-extrabold text-amber-950 text-base sm:text-lg">
              {formatLocalizedDate(selectedDateISO + 'T00:00:00', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            {isToday && (
              <span className="bg-amber-400 text-amber-950 text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                {t('today')}
              </span>
            )}
          </div>

          <button
            type="button"
            id="btn-elderly-next-day"
            onClick={() => handleDateChange(1)}
            className="p-2.5 rounded-xl bg-white/80 hover:bg-white text-amber-950 border border-amber-300 font-bold flex items-center space-x-1 text-sm shadow-xs cursor-pointer"
          >
            <span className="hidden sm:inline">{t('tomorrow')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Prominent "NEXT MEDICINE DUE" Banner for Elderly */}
      {isToday && nextPendingDose && (() => {
        const nextEarlyCheck = checkIsDoseTooEarly(selectedDateISO, nextPendingDose.time, 15, currentTime);

        return (
          <div className="bg-yellow-100/90 border-3 border-amber-400 rounded-3xl p-6 sm:p-7 shadow-md shadow-amber-400/20 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-amber-950 uppercase tracking-wider">
                    {t('nextMedDue')}
                  </span>
                  <span className="font-bold text-amber-900 text-sm flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>{formatLocalizedTime(nextPendingDose.time)} ({getScheduleLabelName(nextPendingDose.label)})</span>
                  </span>
                  {nextPendingDose.isPastDue && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 flex items-center space-x-1 animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      <span>{t('overdue')}</span>
                    </span>
                  )}
                  {nextEarlyCheck.isTooEarly && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-200/90 text-amber-950 border border-amber-400 flex items-center space-x-1">
                      <Lock className="w-3 h-3 text-amber-800" />
                      <span>{t('lockedUntil', { time: nextEarlyCheck.earliestAllowedFormatted })}</span>
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-amber-950">
                  {nextPendingDose.med.name}
                </h2>

                <p className="text-base text-amber-900 font-semibold">
                  {t('dosage', { dosage: nextPendingDose.med.dosage })} •{' '}
                  {getFoodInstructionName(nextPendingDose.med.instructions)}
                </p>

                {nextPendingDose.med.notes && (
                  <div className="text-xs sm:text-sm text-amber-800 bg-amber-200/60 px-3.5 py-1.5 rounded-xl inline-block">
                    💡 {nextPendingDose.med.notes}
                  </div>
                )}

                {/* Safety notice when dose is locked because it is more than 15 mins before due */}
                {nextEarlyCheck.isTooEarly && (
                  <div className="text-xs sm:text-sm text-amber-950 bg-amber-200/90 border border-amber-400 px-3.5 py-2 rounded-xl flex items-center space-x-2 font-medium mt-1">
                    <Lock className="w-4 h-4 text-amber-800 shrink-0" />
                    <span>
                      {t('lockedDesc', { time: nextEarlyCheck.scheduledFormatted })}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons for Next Dose */}
              <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                {nextEarlyCheck.isTooEarly ? (
                  <button
                    type="button"
                    disabled
                    id="btn-take-next-med-locked"
                    title={nextEarlyCheck.reason}
                    className="w-full md:w-auto px-6 py-4 rounded-2xl bg-amber-200/80 text-amber-900/60 font-extrabold text-base sm:text-lg border-2 border-amber-300 flex items-center justify-center space-x-2.5 cursor-not-allowed opacity-85 shadow-none"
                  >
                    <Lock className="w-6 h-6 text-amber-800/70" />
                    <span>{t('lockedUntil', { time: nextEarlyCheck.earliestAllowedFormatted })}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    id="btn-take-next-med"
                    onClick={() =>
                      onUpdateDoseStatus(
                        nextPendingDose.med.id,
                        selectedDateISO,
                        nextPendingDose.time,
                        nextPendingDose.label,
                        'taken'
                      )
                    }
                    className="w-full md:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-lg sm:text-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-3 transition-transform hover:scale-[1.02] cursor-pointer"
                  >
                    <CheckCircle2 className="w-7 h-7" />
                    <span>{t('takeMedicine')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Medicine List - Senior Friendly Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg sm:text-xl font-extrabold text-amber-950">
            {isToday ? t('scheduleForToday') : t('viewingScheduleFor', { date: selectedDateISO })}
          </h3>
          <span className="text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full">
            {t('dosesTakenCount', { taken: takenDoses, total: totalDoses })}
          </span>
        </div>

        {allDoses.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-yellow-200 p-8 text-center text-amber-900">
            <Info className="w-10 h-10 text-amber-500 mx-auto mb-2" />
            <p className="font-bold text-lg">{t('noMedsToday')}</p>
            <p className="text-sm text-amber-800/80 mt-1">
              {t('noMedsDesc')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {allDoses.map((dose, idx) => {
              const isTaken = dose.status === 'taken';
              const isSkipped = dose.status === 'skipped';
              const isPending = dose.status === 'pending';
              const doseEarlyCheck = checkIsDoseTooEarly(selectedDateISO, dose.time, 15, currentTime);

              return (
                <div
                  key={`${dose.med.id}-${dose.time}-${idx}`}
                  className={`rounded-3xl border-2 p-5 sm:p-6 transition-all ${
                    isTaken
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : dose.isPastDue
                      ? 'bg-red-50/70 border-red-300 shadow-sm'
                      : 'bg-white border-yellow-300 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Medicine details */}
                    <div className="flex items-start space-x-4">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl font-bold shadow-xs ${
                          isTaken
                            ? 'bg-emerald-200 text-emerald-900'
                            : dose.isPastDue
                            ? 'bg-red-200 text-red-900'
                            : 'bg-amber-200 text-amber-950'
                        }`}
                      >
                        {isTaken ? (
                          <CheckCircle2 className="w-8 h-8 text-emerald-700" />
                        ) : dose.isPastDue ? (
                          <AlertTriangle className="w-7 h-7 text-red-700" />
                        ) : (
                          <Clock className="w-7 h-7 text-amber-800" />
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                            {dose.med.name}
                          </h4>
                          <span className="text-sm font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                            {dose.med.dosage}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm text-slate-600 font-medium">
                          <span className="font-bold text-amber-900">
                            ⏰ {formatLocalizedTime(dose.time)} ({getScheduleLabelName(dose.label)})
                          </span>
                          <span>•</span>
                          <span className="capitalize text-slate-700">
                            {getFoodInstructionName(dose.med.instructions)}
                          </span>
                          {dose.med.notes && (
                            <>
                              <span>•</span>
                              <span className="text-amber-800 font-semibold">{dose.med.notes}</span>
                            </>
                          )}
                        </div>

                        {/* Status badge & Locked indicator */}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {isTaken && (
                            <span className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-100 px-3.5 py-1 rounded-full border border-emerald-300">
                              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                              <span>{t('taken')} {dose.takenAt ? `(${new Date(dose.takenAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })})` : ''}</span>
                            </span>
                          )}
                          {dose.isPastDue && (
                            <span className="inline-flex items-center space-x-1 text-xs font-bold text-red-800 bg-red-100 px-3 py-1 rounded-full border border-red-200 animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                              <span>{t('overdue')}</span>
                            </span>
                          )}
                          {!isTaken && doseEarlyCheck.isTooEarly && (
                            <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-3 py-1 rounded-full">
                              <Lock className="w-3.5 h-3.5 text-amber-800" />
                              <span>{t('lockedUntil', { time: doseEarlyCheck.earliestAllowedFormatted })}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons: I Took It (or Locked), and Undo */}
                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                      {/* Taking or Undo */}
                      {!isTaken ? (
                        doseEarlyCheck.isTooEarly ? (
                          <button
                            type="button"
                            disabled
                            id={`btn-take-dose-locked-${dose.med.id}-${dose.time}`}
                            title={doseEarlyCheck.reason}
                            className="px-5 py-3 rounded-2xl bg-amber-100/80 text-amber-900/60 font-bold text-xs sm:text-sm border border-amber-300 flex items-center space-x-2 cursor-not-allowed opacity-80"
                          >
                            <Lock className="w-4 h-4 text-amber-800/70" />
                            <span>{t('lockedUntil', { time: doseEarlyCheck.earliestAllowedFormatted })}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            id={`btn-take-dose-${dose.med.id}-${dose.time}`}
                            onClick={() =>
                              onUpdateDoseStatus(
                                dose.med.id,
                                selectedDateISO,
                                dose.time,
                                dose.label,
                                'taken'
                              )
                            }
                            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-base shadow-md flex items-center space-x-2 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            <span>{t('iTookIt')}</span>
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          id={`btn-undo-dose-${dose.med.id}-${dose.time}`}
                          onClick={() =>
                            onUpdateDoseStatus(
                              dose.med.id,
                              selectedDateISO,
                              dose.time,
                              dose.label,
                              'pending'
                            )
                          }
                          title={t('undo')}
                          className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 hover:text-amber-950 font-bold text-xs sm:text-sm border border-amber-300 flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          <RotateCcw className="w-4 h-4 text-amber-800" />
                          <span>{t('undo')}</span>
                        </button>
                      )}
                      {/* Delete Medication Option */}
                      {confirmDeleteMedId === dose.med.id ? (
                        <div className="flex items-center space-x-1.5 bg-red-50 p-1.5 rounded-xl border border-red-200 animate-in fade-in">
                          <span className="text-xs font-bold text-red-700 px-1">{t('deleteConfirm')}</span>
                          <button
                            type="button"
                            id={`btn-confirm-delete-${dose.med.id}`}
                            onClick={() => {
                              onRemoveMedication(dose.med.id);
                              setConfirmDeleteMedId(null);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            {t('delete')}
                          </button>
                          <button
                            type="button"
                            id={`btn-cancel-delete-${dose.med.id}`}
                            onClick={() => setConfirmDeleteMedId(null)}
                            className="px-2 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 text-xs font-medium transition-colors cursor-pointer"
                          >
                            {t('cancel')}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          id={`btn-delete-med-${dose.med.id}`}
                          onClick={() => setConfirmDeleteMedId(dose.med.id)}
                          className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                          title={`${t('delete')} ${dose.med.name}`}
                          aria-label={`${t('delete')} ${dose.med.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
