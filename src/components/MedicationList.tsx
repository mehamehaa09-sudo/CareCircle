import React, { useState } from 'react';
import {
  Trash2,
  Clock,
  Calendar,
  AlertCircle,
  Plus,
  CheckCircle2,
  Pill,
  Info
} from 'lucide-react';
import { Medication, FoodInstruction } from '../types';
import { getRemainingDays, formatDateToISO } from '../utils/dateUtils';
import { useLanguage } from '../context/LanguageContext';

interface MedicationListProps {
  medications: Medication[];
  onRemoveMedication: (id: string) => void;
  onOpenAddModal: () => void;
  onTriggerAlarmForMed?: (med: Medication, time: string, label: string) => void;
}

export const MedicationList: React.FC<MedicationListProps> = ({
  medications,
  onRemoveMedication,
  onOpenAddModal,
  onTriggerAlarmForMed,
}) => {
  const { t, formatLocalizedDate, formatLocalizedTime } = useLanguage();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const todayISO = formatDateToISO(new Date());

  const getFoodInstructionText = (inst: FoodInstruction): string => {
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

  const getRemainingDaysText = (med: Medication): string => {
    if (med.durationType === 'always') return t('continuousOngoing');
    const remaining = getRemainingDays(med, todayISO);
    if (remaining.isExpired) return t('completedAgo');
    if (remaining.diffDays === 0) return t('lastDayToday');
    if (remaining.diffDays === 1) return t('oneDayLeft');
    return t('daysLeft', { days: remaining.diffDays });
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-yellow-300 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-yellow-100 flex items-center justify-between bg-amber-50/50">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-amber-950">{t('allConfiguredMeds')}</h2>
          <p className="text-xs sm:text-sm text-amber-900/80 mt-0.5">
            {t('managePrescriptions')}
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addMedicine')}</span>
        </button>
      </div>

      {/* List */}
      <div className="p-4 sm:p-6 space-y-4">
        {medications.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <Pill className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-amber-950 mb-1">{t('noMedsAdded')}</h3>
            <p className="text-xs sm:text-sm text-amber-900/70 max-w-sm mx-auto mb-4">
              {t('noMedsAddedDesc')}
            </p>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs font-bold shadow-xs cursor-pointer"
            >
              <span>+ {t('addMedicine')}</span>
            </button>
          </div>
        ) : (
          medications.map((med) => {
            const remaining = getRemainingDays(med, todayISO);

            return (
              <div
                key={med.id}
                className="p-5 rounded-2xl border-2 border-yellow-200 bg-amber-50/30 hover:bg-white hover:border-amber-400 transition-all shadow-2xs"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left: Info */}
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-amber-950 tracking-tight">
                        {med.name}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-200 text-amber-950 border border-yellow-300">
                        {med.dosage}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-white text-amber-900 border border-yellow-200 capitalize">
                        {med.form}
                      </span>
                      {med.durationType === 'always' ? (
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {t('continuousOngoing')}
                        </span>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                          remaining.isExpired
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : remaining.isExpiringSoon
                            ? 'bg-amber-200 text-amber-950 border-amber-300'
                            : 'bg-yellow-100 text-yellow-900 border-yellow-300'
                        }`}>
                          {getRemainingDaysText(med)} ({med.durationDays} Days)
                        </span>
                      )}
                    </div>

                    {/* Schedule times & Food instructions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-amber-900 pt-1">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <span className="font-bold text-amber-950">{t('scheduledTimings')}: </span>
                          <span>
                            {med.times
                              .map((tItem) => `${formatLocalizedTime(tItem.time)} (${getScheduleLabelName(tItem.label)})`)
                              .join(', ')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <span className="font-bold text-amber-950">{t('startDate')}: </span>
                          <span>{formatLocalizedDate(med.startDate + 'T00:00:00', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          {med.endDate && (
                            <span> → {formatLocalizedDate(med.endDate + 'T00:00:00', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-amber-900 flex items-center space-x-1.5 pt-0.5">
                      <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        <span className="font-bold text-amber-950">{t('foodInstruction')}: </span>
                        {getFoodInstructionText(med.instructions)}
                      </span>
                    </div>

                    {med.notes && (
                      <p className="text-xs text-amber-900/80 italic bg-white p-2.5 rounded-xl border border-yellow-200 mt-1">
                        {t('specialNotes')}: "{med.notes}"
                      </p>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center space-x-2 shrink-0 self-end md:self-start">
                    {/* Delete Confirmation */}
                    {confirmDeleteId === med.id ? (
                      <div className="flex items-center space-x-1 bg-red-50 p-1 rounded-xl border border-red-200">
                        <button
                          onClick={() => {
                            onRemoveMedication(med.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          {t('deleteConfirm')}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 rounded-lg text-slate-600 hover:bg-slate-200 text-xs transition-colors cursor-pointer"
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(med.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors cursor-pointer"
                        title={t('delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
