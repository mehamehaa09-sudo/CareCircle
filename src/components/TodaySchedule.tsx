import React from 'react';
import {
  Check,
  Clock,
  Pill,
  AlertCircle,
  RotateCcw,
  Volume2,
  Calendar,
  Sparkles,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Medication, DoseLog, DoseStatus } from '../types';
import {
  formatDateToISO,
  formatHumanDate,
  formatFullHumanDate,
  formatTime12h,
  isMedicationActiveOnDate,
  getRemainingDays,
} from '../utils/dateUtils';

interface ScheduledDoseItem {
  id: string; // dose log key: `${medicationId}_${date}_${time}`
  medication: Medication;
  time: string;
  label: string;
  log?: DoseLog;
  status: DoseStatus;
  isPastDue: boolean;
  isNextUpcoming: boolean;
}

interface TodayScheduleProps {
  selectedDateISO: string;
  medications: Medication[];
  doseLogs: DoseLog[];
  onUpdateDoseStatus: (medicationId: string, dateISO: string, time: string, label: string, status: DoseStatus) => void;
  onTriggerAlarmForMed: (med: Medication, time: string, label: string) => void;
  onOpenAddModal: () => void;
}

export const TodaySchedule: React.FC<TodayScheduleProps> = ({
  selectedDateISO,
  medications,
  doseLogs,
  onUpdateDoseStatus,
  onTriggerAlarmForMed,
  onOpenAddModal,
}) => {
  const todayISO = formatDateToISO(new Date());
  const isToday = selectedDateISO === todayISO;

  // Current time in HH:MM format
  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;

  // Find all medications active on this date
  const activeMeds = medications.filter((m) => isMedicationActiveOnDate(m, selectedDateISO));

  // Flatten out all scheduled dose instances
  const doses: ScheduledDoseItem[] = [];

  activeMeds.forEach((med) => {
    med.times.forEach((t) => {
      const doseId = `${med.id}_${selectedDateISO}_${t.time}`;
      const log = doseLogs.find((l) => l.id === doseId);
      const status: DoseStatus = log ? log.status : 'pending';

      const isPastDue = isToday && status === 'pending' && t.time < currentTimeStr;

      doses.push({
        id: doseId,
        medication: med,
        time: t.time,
        label: t.label,
        log,
        status,
        isPastDue,
        isNextUpcoming: false,
      });
    });
  });

  // Sort doses chronologically by time
  doses.sort((a, b) => a.time.localeCompare(b.time));

  // If today, identify the next upcoming pending dose
  if (isToday) {
    const nextPending = doses.find((d) => d.status === 'pending' && d.time >= currentTimeStr);
    if (nextPending) {
      nextPending.isNextUpcoming = true;
    } else {
      // If none in the future today, check if any pending is past due
      const firstPending = doses.find((d) => d.status === 'pending');
      if (firstPending) firstPending.isNextUpcoming = true;
    }
  }

  const handleTakeMedicine = (dose: ScheduledDoseItem) => {
    onUpdateDoseStatus(dose.medication.id, selectedDateISO, dose.time, dose.label, 'taken');

    // Fire celebratory confetti!
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#3b82f6', '#10b981', '#6366f1'],
      });
    } catch (e) {
      // ignore in environments where canvas may be limited
    }
  };

  const getFoodInstructionBadge = (inst: string) => {
    switch (inst) {
      case 'after_food':
        return { label: 'After meal', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'before_food':
        return { label: 'Before meal (Empty stomach)', bg: 'bg-rose-50 text-rose-800 border-rose-200' };
      case 'with_food':
        return { label: 'With food', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'empty_stomach':
        return { label: 'Empty stomach', bg: 'bg-purple-50 text-purple-800 border-purple-200' };
      default:
        return { label: 'Anytime', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const totalDoses = doses.length;
  const takenCount = doses.filter((d) => d.status === 'taken').length;
  const pendingCount = doses.filter((d) => d.status === 'pending').length;

  return (
    <div className="bg-white rounded-3xl border-2 border-yellow-300 shadow-xs overflow-hidden">
      {/* Header section */}
      <div className="p-4 sm:p-5 border-b border-yellow-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/50">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg sm:text-xl font-bold text-amber-950">
              {isToday ? "Today's Medication Doses" : `Schedule for ${formatHumanDate(selectedDateISO)}`}
            </h2>
            {isToday && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-amber-950 border border-amber-500">
                Live
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-amber-900/80 mt-0.5">
            {formatFullHumanDate(selectedDateISO)} • {totalDoses} doses planned
          </p>
        </div>

        {/* Adherence quick pills */}
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300">
            ✓ {takenCount} Taken
          </span>
          <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-950 text-xs font-bold border border-yellow-300">
            ⏳ {pendingCount} Remaining
          </span>
        </div>
      </div>

      {/* Doses List */}
      <div className="p-4 sm:p-6 space-y-3.5">
        {doses.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <Pill className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-amber-950 mb-1">No Medications Scheduled</h3>
            <p className="text-xs sm:text-sm text-amber-900/70 max-w-sm mx-auto mb-4">
              There are no active medicines set for this date. You can add a medication or select another date from the calendar.
            </p>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs font-bold shadow-xs cursor-pointer"
            >
              <span>+ Add Medication</span>
            </button>
          </div>
        ) : (
          doses.map((dose) => {
            const foodBadge = getFoodInstructionBadge(dose.medication.instructions);
            const remaining = getRemainingDays(dose.medication, selectedDateISO);

            return (
              <div
                key={dose.id}
                className={`p-4 rounded-2xl border-2 transition-all relative ${
                  dose.status === 'taken'
                    ? 'bg-emerald-50/60 border-emerald-300'
                    : dose.isNextUpcoming
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30 shadow-xs'
                    : dose.isPastDue
                    ? 'bg-rose-50/60 border-rose-300'
                    : 'bg-white border-yellow-200 hover:border-amber-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Timing badge & Medicine details */}
                  <div className="flex items-start space-x-3.5">
                    {/* Time slot badge */}
                    <div className="flex flex-col items-center justify-center min-w-[70px] py-1.5 px-2 rounded-xl bg-amber-100/70 border border-yellow-300 text-center">
                      <span className="text-xs font-extrabold text-amber-950 tracking-tight">
                        {formatTime12h(dose.time)}
                      </span>
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                        {dose.label}
                      </span>
                    </div>

                    {/* Medicine details */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="text-base font-bold text-amber-950 tracking-tight">
                          {dose.medication.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-yellow-300">
                          {dose.medication.dosage}
                        </span>

                        {dose.isNextUpcoming && dose.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-extrabold bg-amber-500 text-amber-950 animate-pulse border border-amber-600">
                            Next Due
                          </span>
                        )}

                        {dose.isPastDue && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                            <AlertCircle className="w-3 h-3" />
                            <span>Past Due</span>
                          </span>
                        )}
                      </div>

                      {/* Instructions & duration badges */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className={`px-2 py-0.5 rounded-md font-semibold border ${foodBadge.bg}`}>
                          {foodBadge.label}
                        </span>

                        <span className="px-2 py-0.5 rounded-md bg-white text-amber-950 border border-yellow-200 font-semibold">
                          {remaining.text}
                        </span>

                        {dose.medication.notes && (
                          <span className="text-amber-900/80 italic text-xs truncate max-w-xs">
                            "{dose.medication.notes}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions & Status controls */}
                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    {/* Trigger alarm simulation for this dose */}
                    <button
                      onClick={() => onTriggerAlarmForMed(dose.medication, dose.time, dose.label)}
                      title="Trigger medication reminder alarm for this dose now"
                      className="p-2 rounded-xl text-amber-700 hover:text-amber-950 hover:bg-amber-100 border border-yellow-200 transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    {dose.status === 'taken' ? (
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300">
                          <Check className="w-3.5 h-3.5" />
                          <span>Taken</span>
                        </span>
                        <button
                          onClick={() => onUpdateDoseStatus(dose.medication.id, selectedDateISO, dose.time, dose.label, 'pending')}
                          title="Undo taken status"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : dose.status === 'skipped' ? (
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium">
                          Skipped
                        </span>
                        <button
                          onClick={() => onUpdateDoseStatus(dose.medication.id, selectedDateISO, dose.time, dose.label, 'pending')}
                          title="Undo skip status"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onUpdateDoseStatus(dose.medication.id, selectedDateISO, dose.time, dose.label, 'skipped')}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-amber-900 hover:text-amber-950 hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          Skip
                        </button>

                        <button
                          id={`btn-take-${dose.id}`}
                          onClick={() => handleTakeMedicine(dose)}
                          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Take Medicine</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
