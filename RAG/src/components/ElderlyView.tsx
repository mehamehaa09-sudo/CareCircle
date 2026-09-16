import React, { useState } from 'react';
import {
  Medication,
  DoseLog,
  DoseStatus,
  UserProfile,
  CaretakerNudge,
  ActiveAlarm,
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
  Sparkles,
  Heart,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Info,
  Lock,
  RotateCcw,
} from 'lucide-react';
import { playSeniorNudgeSound } from '../utils/audioAlarm';

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
  nudges: CaretakerNudge[];
  onDismissNudge: (id: string) => void;
  onOpenCallModal: () => void;
}

export const ElderlyView: React.FC<ElderlyViewProps> = ({
  userProfile,
  medications,
  doseLogs,
  selectedDateISO,
  onSelectDate,
  onUpdateDoseStatus,
  nudges,
  onDismissNudge,
  onOpenCallModal,
}) => {
  const todayISO = formatDateToISO(new Date());
  const isToday = selectedDateISO === todayISO;

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

  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMins = String(now.getMinutes()).padStart(2, '0');
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

  const handleDateChange = (offset: number) => {
    const [y, m, d] = selectedDateISO.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + offset);
    onSelectDate(formatDateToISO(date));
  };

  const getGreeting = () => {
    const hr = now.getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
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
                      Reminder from {nudge.senderName}
                    </span>
                    <span className="text-xs text-amber-800">Just now</span>
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
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-sm shadow-sm transition-all"
              >
                I Got It, Thanks!
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Senior Hero Greeting Card in Butter Yellow */}
      <div className="bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-200/90 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-200/80 border border-amber-300/80 text-amber-900 text-xs font-semibold mb-2">
              <Heart className="w-3.5 h-3.5 fill-amber-700 text-amber-700" />
              <span>Circle: {userProfile.circleCode} • Connected to {userProfile.caretakerName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-amber-950 tracking-tight">
              {getGreeting()}, {userProfile.elderlyName}!
            </h1>
            <p className="text-amber-900/80 text-sm sm:text-base mt-1">
              {isToday ? (
                totalDoses === 0 ? (
                  "You have no medicines scheduled for today."
                ) : takenDoses === totalDoses ? (
                  "Wonderful! You have taken all your scheduled medicines for today!"
                ) : (
                  `You have taken ${takenDoses} of ${totalDoses} medicines today.`
                )
              ) : (
                `Viewing schedule for ${selectedDateISO}`
              )}
            </p>
          </div>

          {/* Quick Caretaker Reach Button */}
          <div className="flex items-center space-x-2">
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
                <div className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Contact</div>
                <div>Call {userProfile.caretakerName}</div>
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
            className="p-2.5 rounded-xl bg-white/80 hover:bg-white text-amber-950 border border-amber-300 font-bold flex items-center space-x-1 text-sm shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Yesterday</span>
          </button>

          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-amber-700" />
            <span className="font-extrabold text-amber-950 text-base sm:text-lg">
              {new Date(selectedDateISO + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            {isToday && (
              <span className="bg-amber-400 text-amber-950 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                TODAY
              </span>
            )}
          </div>

          <button
            type="button"
            id="btn-elderly-next-day"
            onClick={() => handleDateChange(1)}
            className="p-2.5 rounded-xl bg-white/80 hover:bg-white text-amber-950 border border-amber-300 font-bold flex items-center space-x-1 text-sm shadow-xs"
          >
            <span className="hidden sm:inline">Tomorrow</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Prominent "NEXT MEDICINE DUE" Banner for Elderly */}
      {isToday && nextPendingDose && (() => {
        const nextEarlyCheck = checkIsDoseTooEarly(selectedDateISO, nextPendingDose.time);

        return (
          <div className="bg-yellow-100/90 border-3 border-amber-400 rounded-3xl p-6 sm:p-7 shadow-md shadow-amber-400/20 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-amber-950 uppercase tracking-wider">
                    Next Medicine Due
                  </span>
                  <span className="font-bold text-amber-900 text-sm flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>{formatTime12h(nextPendingDose.time)} ({nextPendingDose.label})</span>
                  </span>
                  {nextPendingDose.isPastDue && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 flex items-center space-x-1 animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      <span>Untaken</span>
                    </span>
                  )}
                  {nextEarlyCheck.isTooEarly && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-200/90 text-amber-950 border border-amber-400 flex items-center space-x-1">
                      <Lock className="w-3 h-3 text-amber-800" />
                      <span>Locked until {nextEarlyCheck.earliestAllowedFormatted}</span>
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-amber-950">
                  {nextPendingDose.med.name}
                </h2>

                <p className="text-base text-amber-900 font-semibold">
                  Dose: <span className="font-bold text-amber-950">{nextPendingDose.med.dosage}</span> •{' '}
                  {nextPendingDose.med.instructions.replace('_', ' ').toUpperCase()}
                </p>

                {nextPendingDose.med.notes && (
                  <div className="text-xs sm:text-sm text-amber-800 bg-amber-200/60 px-3.5 py-1.5 rounded-xl inline-block">
                    💡 Note: {nextPendingDose.med.notes}
                  </div>
                )}

                {/* Safety notice when dose is locked because it is more than 15 mins before due */}
                {nextEarlyCheck.isTooEarly && (
                  <div className="text-xs sm:text-sm text-amber-950 bg-amber-200/90 border border-amber-400 px-3.5 py-2 rounded-xl flex items-center space-x-2 font-medium mt-1">
                    <Lock className="w-4 h-4 text-amber-800 shrink-0" />
                    <span>
                      <strong>Scheduled for {nextEarlyCheck.scheduledFormatted}:</strong> For your safety, you cannot mark this medicine taken early. It unlocks at <strong>{nextEarlyCheck.earliestAllowedFormatted}</strong> (15 mins before due time).
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
                    <span>Available at {nextEarlyCheck.earliestAllowedFormatted}</span>
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
                    <span>I Took My Medicine</span>
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
            {isToday ? "Today's Prescribed Medicines" : `Medicines for ${selectedDateISO}`}
          </h3>
          <span className="text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full">
            {takenDoses} of {totalDoses} Done
          </span>
        </div>

        {allDoses.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-yellow-200 p-8 text-center text-amber-900">
            <Info className="w-10 h-10 text-amber-500 mx-auto mb-2" />
            <p className="font-bold text-lg">No medicines scheduled for this day.</p>
            <p className="text-sm text-amber-800/80 mt-1">
              Your caretaker ({userProfile.caretakerName}) can add or schedule new prescriptions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {allDoses.map((dose, idx) => {
              const isTaken = dose.status === 'taken';
              const isSkipped = dose.status === 'skipped';
              const isPending = dose.status === 'pending';
              const doseEarlyCheck = checkIsDoseTooEarly(selectedDateISO, dose.time);

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
                            ⏰ {formatTime12h(dose.time)} ({dose.label})
                          </span>
                          <span>•</span>
                          <span className="capitalize text-slate-700">
                            {dose.med.instructions.replace('_', ' ')}
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
                              <span>Taken {dose.takenAt ? `at ${new Date(dose.takenAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Confirmed'}</span>
                            </span>
                          )}
                          {dose.isPastDue && (
                            <span className="inline-flex items-center space-x-1 text-xs font-bold text-red-800 bg-red-100 px-3 py-1 rounded-full border border-red-200 animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                              <span>Untaken - Scheduled time has passed</span>
                            </span>
                          )}
                          {!isTaken && doseEarlyCheck.isTooEarly && (
                            <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-3 py-1 rounded-full">
                              <Lock className="w-3.5 h-3.5 text-amber-800" />
                              <span>Locked until {doseEarlyCheck.earliestAllowedFormatted} (15 mins before due)</span>
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
                            <span>Available at {doseEarlyCheck.earliestAllowedFormatted}</span>
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
                            <span>I Took It</span>
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
                          title="Undo: Mark this medicine as not taken"
                          className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 hover:text-amber-950 font-bold text-xs sm:text-sm border border-amber-300 flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          <RotateCcw className="w-4 h-4 text-amber-800" />
                          <span>Undo</span>
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
