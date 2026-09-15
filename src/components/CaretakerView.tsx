import React, { useState } from 'react';
import {
  Medication,
  DoseLog,
  DoseStatus,
  UserProfile,
  MissedDoseAlert,
  CaretakerNudge,
  ActiveAlarm,
} from '../types';
import {
  formatDateToISO,
  formatTime12h,
  isMedicationActiveOnDate,
} from '../utils/dateUtils';
import {
  AlertTriangle,
  Bell,
  BellRing,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Heart,
  Phone,
  Plus,
  Send,
  Sparkles,
  User,
  Volume2,
  X,
  TrendingUp,
  ShieldAlert,
  Pill,
} from 'lucide-react';
import { CalendarView } from './CalendarView';
import { MedicationList } from './MedicationList';

interface CaretakerViewProps {
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
  onOpenAddModal: () => void;
  onRemoveMedication: (id: string) => void;
  onSendNudge: (medicationName?: string, customMessage?: string) => void;
  onOpenCallModal: () => void;
  onSimulateMissedDose: () => void;
  dismissedAlertIds: string[];
  onDismissAlertId: (id: string) => void;
  caretakerTab: 'overview' | 'medications' | 'calendar';
  setCaretakerTab: (tab: 'overview' | 'medications' | 'calendar') => void;
}

export const CaretakerView: React.FC<CaretakerViewProps> = ({
  userProfile,
  medications,
  doseLogs,
  selectedDateISO,
  onSelectDate,
  onUpdateDoseStatus,
  onOpenAddModal,
  onRemoveMedication,
  onSendNudge,
  onOpenCallModal,
  onSimulateMissedDose,
  dismissedAlertIds,
  onDismissAlertId,
  caretakerTab,
  setCaretakerTab,
}) => {
  const todayISO = formatDateToISO(new Date());
  const isToday = selectedDateISO === todayISO;

  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMins = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMins}`;

  // Find missed / untaken doses for today
  const activeTodayMeds = medications.filter((m) => isMedicationActiveOnDate(m, todayISO));

  interface MissedItem {
    id: string;
    med: Medication;
    time: string;
    label: string;
    minutesLate: number;
  }

  const missedDoses: MissedItem[] = [];
  let totalDosesToday = 0;
  let takenDosesToday = 0;

  activeTodayMeds.forEach((med) => {
    med.times.forEach((t) => {
      totalDosesToday++;
      const doseId = `${med.id}_${todayISO}_${t.time}`;
      const log = doseLogs.find((l) => l.id === doseId);

      if (log?.status === 'taken') {
        takenDosesToday++;
      } else {
        // Check if time has passed
        if (currentTimeStr > t.time || log?.status === 'skipped') {
          // Calculate approx minutes late
          const [schH, schM] = t.time.split(':').map(Number);
          const [curH, curM] = currentTimeStr.split(':').map(Number);
          const diffMinutes = Math.max(1, (curH * 60 + curM) - (schH * 60 + schM));

          missedDoses.push({
            id: doseId,
            med,
            time: t.time,
            label: t.label,
            minutesLate: diffMinutes,
          });
        }
      }
    });
  });

  const adherenceRate = totalDosesToday > 0 ? Math.round((takenDosesToday / totalDosesToday) * 100) : 100;
  const activeMissedAlerts = missedDoses.filter((m) => !dismissedAlertIds.includes(m.id));

  // Custom nudge text state
  const [quickNudgeMessage, setQuickNudgeMessage] = useState('');
  const [isCustomNudgeOpen, setIsCustomNudgeOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ============================================================ */}
      {/* 🚨 CRITICAL REQUIREMENT: CARETAKER MISSED DOSE NOTIFICATION  */}
      {/* ============================================================ */}
      {activeMissedAlerts.length > 0 ? (
        <div className="bg-gradient-to-r from-red-500 via-amber-500 to-red-600 rounded-3xl p-1 shadow-xl shadow-red-500/20 animate-pulse-subtle">
          <div className="bg-white rounded-[22px] p-5 sm:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-red-100 pb-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 animate-bounce">
                  <BellRing className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-red-600 text-white text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                      ⚠️ URGENT NOTIFICATION
                    </span>
                    <span className="text-xs font-semibold text-red-700">
                      {activeMissedAlerts.length} Medicine{activeMissedAlerts.length > 1 ? 's' : ''} NOT Taken!
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                    {userProfile.elderlyName} has NOT taken scheduled medication!
                  </h2>
                </div>
              </div>

              {/* Call Senior button */}
              <button
                type="button"
                id="btn-caretaker-call-senior-urgent"
                onClick={onOpenCallModal}
                className="w-full md:w-auto px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-extrabold text-sm shadow-md flex items-center justify-center space-x-2"
              >
                <Phone className="w-4 h-4" />
                <span>Call {userProfile.elderlyName}</span>
              </button>
            </div>

            {/* List of missed doses with 1-click nudge & confirmation */}
            <div className="divide-y divide-red-100 mt-3">
              {activeMissedAlerts.map((missed) => (
                <div
                  key={missed.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-lg text-slate-900">
                        {missed.med.name}
                      </span>
                      <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                        {missed.med.dosage}
                      </span>
                      <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        {missed.minutesLate} mins overdue
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600">
                      Scheduled for <strong className="text-slate-900">{formatTime12h(missed.time)} ({missed.label})</strong> •{' '}
                      <span className="capitalize">{missed.med.instructions.replace('_', ' ')}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Send Nudge */}
                    <button
                      type="button"
                      id={`btn-nudge-for-${missed.med.id}`}
                      onClick={() => onSendNudge(missed.med.name)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-xs shadow-xs flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Nudge to Senior</span>
                    </button>

                    {/* Mark Taken by Caregiver */}
                    <button
                      type="button"
                      id={`btn-caregiver-mark-taken-${missed.id}`}
                      onClick={() =>
                        onUpdateDoseStatus(
                          missed.med.id,
                          todayISO,
                          missed.time,
                          missed.label,
                          'taken'
                        )
                      }
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Taken</span>
                    </button>

                    {/* Acknowledge / Dismiss */}
                    <button
                      type="button"
                      id={`btn-dismiss-alert-${missed.id}`}
                      onClick={() => onDismissAlertId(missed.id)}
                      title="Dismiss notification for this dose"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Status All Clear Banner */
        <div className="bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-200 border-2 border-yellow-300 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-300 text-amber-950 flex items-center justify-center flex-shrink-0 shadow-xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                  All Clear
                </span>
                <span className="text-xs text-amber-900 font-semibold">
                  Live Missed-Dose Monitor Active
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-amber-950 mt-0.5">
                No Missed Medicines for {userProfile.elderlyName}
              </h2>
              <p className="text-xs text-amber-900/80">
                You will be alerted immediately if a medicine is overdue or untaken.
              </p>
            </div>
          </div>

          {/* Test / Simulate Missed Dose Button */}
          <button
            type="button"
            id="btn-simulate-missed-dose"
            onClick={onSimulateMissedDose}
            className="px-4 py-2.5 rounded-xl bg-amber-300 hover:bg-amber-400 text-amber-950 font-bold text-xs border border-amber-400/80 shadow-xs flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-900" />
            <span>⚡ Test: Simulate Missed Dose</span>
          </button>
        </div>
      )}

      {/* Senior Circle Summary Card & Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Connected Person Profile */}
        <div className="bg-white rounded-2xl border border-yellow-200 p-4 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Elderly In Care
            </div>
            <div className="text-base font-extrabold text-slate-900">
              {userProfile.elderlyName}
            </div>
            <div className="text-xs text-amber-700 font-semibold">Circle: {userProfile.circleCode}</div>
          </div>
        </div>

        {/* Adherence Rate */}
        <div className="bg-white rounded-2xl border border-yellow-200 p-4 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Today's Adherence
            </div>
            <div className="text-xl font-extrabold text-slate-900">
              {adherenceRate}%
            </div>
            <div className="text-xs text-slate-500">
              {takenDosesToday} of {totalDosesToday} doses taken
            </div>
          </div>
        </div>

        {/* Active Prescriptions */}
        <div className="bg-white rounded-2xl border border-yellow-200 p-4 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Prescriptions
            </div>
            <div className="text-xl font-extrabold text-slate-900">
              {medications.length} Active
            </div>
            <div className="text-xs text-slate-500">Daily scheduled items</div>
          </div>
        </div>

        {/* Quick Nudge Trigger */}
        <div className="bg-white rounded-2xl border border-yellow-200 p-4 shadow-xs flex flex-col justify-center">
          <button
            type="button"
            id="btn-quick-nudge-open"
            onClick={() => setIsCustomNudgeOpen(!isCustomNudgeOpen)}
            className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-xs shadow-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Custom Nudge</span>
          </button>
        </div>
      </div>

      {/* Custom Nudge Input Drawer */}
      {isCustomNudgeOpen && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={quickNudgeMessage}
            onChange={(e) => setQuickNudgeMessage(e.target.value)}
            placeholder={`Type a gentle reminder message for ${userProfile.elderlyName}...`}
            className="flex-1 px-4 py-2 rounded-xl border border-amber-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            type="button"
            id="btn-send-custom-nudge-submit"
            onClick={() => {
              if (quickNudgeMessage.trim()) {
                onSendNudge(undefined, quickNudgeMessage.trim());
                setQuickNudgeMessage('');
                setIsCustomNudgeOpen(false);
              }
            }}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-sm shadow-xs"
          >
            Send Now
          </button>
        </div>
      )}

      {/* Caretaker Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-yellow-200 pb-3">
        <div className="flex space-x-2">
          <button
            type="button"
            id="tab-caretaker-schedule"
            onClick={() => setCaretakerTab('overview')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              caretakerTab === 'overview'
                ? 'bg-amber-400 text-amber-950 shadow-xs'
                : 'bg-white text-slate-700 hover:bg-amber-100/50'
            }`}
          >
            Daily Adherence & Calendar
          </button>
          <button
            type="button"
            id="tab-caretaker-medications"
            onClick={() => setCaretakerTab('medications')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              caretakerTab === 'medications'
                ? 'bg-amber-400 text-amber-950 shadow-xs'
                : 'bg-white text-slate-700 hover:bg-amber-100/50'
            }`}
          >
            Manage Prescriptions ({medications.length})
          </button>
        </div>

        {/* Caretaker Add Medicine Button */}
        <button
          type="button"
          id="btn-caretaker-add-med"
          onClick={onOpenAddModal}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-xs sm:text-sm shadow-xs flex items-center space-x-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Medicine</span>
        </button>
      </div>

      {/* Tab Content */}
      {caretakerTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Calendar on Left */}
          <div className="lg:col-span-5">
            <CalendarView
              selectedDateISO={selectedDateISO}
              onSelectDate={(iso) => onSelectDate(iso)}
              medications={medications}
              doseLogs={doseLogs}
            />
          </div>

          {/* Schedule List on Right */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl border border-yellow-200 p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {userProfile.elderlyName}'s Schedule
                  </h3>
                  <p className="text-xs text-slate-500">
                    {new Date(selectedDateISO + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                  {selectedDateISO === todayISO ? 'Today' : selectedDateISO}
                </span>
              </div>

              {/* Schedule cards */}
              {activeTodayMeds.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  <p className="font-semibold text-sm">No medications active for this date.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeTodayMeds.map((med) =>
                    med.times.map((t) => {
                      const doseId = `${med.id}_${selectedDateISO}_${t.time}`;
                      const log = doseLogs.find((l) => l.id === doseId);
                      const status: DoseStatus = log ? log.status : 'pending';
                      const isPast = selectedDateISO === todayISO && currentTimeStr > t.time && status === 'pending';

                      return (
                        <div
                          key={doseId}
                          className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            status === 'taken'
                              ? 'bg-emerald-50/50 border-emerald-200'
                              : isPast
                              ? 'bg-red-50/60 border-red-200'
                              : 'bg-slate-50/80 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                                status === 'taken'
                                  ? 'bg-emerald-200 text-emerald-900'
                                  : isPast
                                  ? 'bg-red-200 text-red-900'
                                  : 'bg-amber-200 text-amber-950'
                              }`}
                            >
                              {status === 'taken' ? '✓' : '!'}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-900">{med.name}</span>
                                <span className="text-xs text-slate-500 font-medium">({med.dosage})</span>
                              </div>
                              <div className="text-xs text-slate-600">
                                <span>{formatTime12h(t.time)} ({t.label})</span> •{' '}
                                <span className="capitalize">{med.instructions.replace('_', ' ')}</span>
                              </div>
                            </div>
                          </div>

                          {/* Status and Action */}
                          <div className="flex items-center space-x-2">
                            {status === 'taken' ? (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                                Taken {log?.takenAt ? `at ${new Date(log.takenAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Confirmed'}
                              </span>
                            ) : isPast ? (
                              <span className="text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-full border border-red-200 animate-pulse">
                                Overdue (Missed)
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                                Upcoming
                              </span>
                            )}

                            {/* Caretaker quick mark toggle */}
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateDoseStatus(
                                  med.id,
                                  selectedDateISO,
                                  t.time,
                                  t.label,
                                  status === 'taken' ? 'pending' : 'taken'
                                )
                              }
                              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer"
                            >
                              {status === 'taken' ? 'Mark Pending' : 'Mark Taken'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Prescriptions Management */
        <div className="max-w-4xl mx-auto">
          <MedicationList
            medications={medications}
            onRemoveMedication={onRemoveMedication}
            onOpenAddModal={onOpenAddModal}
          />
        </div>
      )}
    </div>
  );
};
