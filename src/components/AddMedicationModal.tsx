import React, { useState } from 'react';
import { X, Plus, Trash2, Clock, Calendar, Pill, Check, Sparkles } from 'lucide-react';
import { Medication, MedicineForm, FoodInstruction, DurationType, MedicationScheduleTime } from '../types';
import { formatDateToISO, addDaysToISO, formatTime12h, formatHumanDate } from '../utils/dateUtils';

interface AddMedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMedication: (med: Medication) => void;
}

const QUICK_MEDICINE_SUGGESTIONS = [
  { name: 'Dolo 650', dosage: '650 mg', form: 'tablet' as MedicineForm, inst: 'after_food' as FoodInstruction, label: 'Morning Dolo 650' },
  { name: 'Night Painkiller', dosage: '1 tablet', form: 'tablet' as MedicineForm, inst: 'after_food' as FoodInstruction, label: 'Night Painkiller' },
  { name: 'Paracetamol', dosage: '500 mg', form: 'tablet' as MedicineForm, inst: 'after_food' as FoodInstruction, label: 'Paracetamol 500mg' },
  { name: 'Vitamin D3 & Calcium', dosage: '1 capsule', form: 'capsule' as MedicineForm, inst: 'after_food' as FoodInstruction, label: 'Vitamin D3' },
  { name: 'Amoxicillin Antibiotic', dosage: '500 mg', form: 'capsule' as MedicineForm, inst: 'after_food' as FoodInstruction, label: 'Antibiotic' },
  { name: 'Pantoprazole (Antacid)', dosage: '40 mg', form: 'tablet' as MedicineForm, inst: 'before_food' as FoodInstruction, label: 'Pantoprazole' },
  { name: 'Cough Relief Syrup', dosage: '10 ml', form: 'syrup' as MedicineForm, inst: 'after_food' as FoodInstruction, label: 'Cough Syrup' },
];

export const AddMedicationModal: React.FC<AddMedicationModalProps> = ({
  isOpen,
  onClose,
  onAddMedication,
}) => {
  const todayISO = formatDateToISO(new Date());

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('1 tablet');
  const [form, setForm] = useState<MedicineForm>('tablet');
  const [instructions, setInstructions] = useState<FoodInstruction>('after_food');
  const [durationType, setDurationType] = useState<DurationType>('fixed_days');
  const [durationDays, setDurationDays] = useState<number>(30); // Default 30 days as user requested
  const [startDate, setStartDate] = useState<string>(todayISO);
  const [notes, setNotes] = useState('');
  const [times, setTimes] = useState<MedicationScheduleTime[]>([
    { id: 't1', time: '08:00', label: 'Morning' },
    { id: 't2', time: '21:00', label: 'Night' },
  ]);

  if (!isOpen) return null;

  // Preset time templates
  const handleApplyPresetTimes = (preset: 'morning' | 'morning_night' | 'thrice' | 'four_times') => {
    if (preset === 'morning') {
      setTimes([{ id: 't1', time: '08:00', label: 'Morning' }]);
    } else if (preset === 'morning_night') {
      setTimes([
        { id: 't1', time: '08:00', label: 'Morning' },
        { id: 't2', time: '21:00', label: 'Night' },
      ]);
    } else if (preset === 'thrice') {
      setTimes([
        { id: 't1', time: '08:00', label: 'Morning' },
        { id: 't2', time: '13:30', label: 'Afternoon' },
        { id: 't3', time: '20:30', label: 'Night' },
      ]);
    } else if (preset === 'four_times') {
      setTimes([
        { id: 't1', time: '07:00', label: 'Morning' },
        { id: 't2', time: '12:00', label: 'Noon' },
        { id: 't3', time: '17:00', label: 'Evening' },
        { id: 't4', time: '22:00', label: 'Night' },
      ]);
    }
  };

  const handleAddTimeSlot = () => {
    const newId = 't_' + Date.now();
    setTimes((prev) => [...prev, { id: newId, time: '12:00', label: 'Custom' }]);
  };

  const handleRemoveTimeSlot = (id: string) => {
    if (times.length <= 1) return;
    setTimes((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateTime = (id: string, newTime: string) => {
    setTimes((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        // Auto-assign appropriate label based on hour
        const hour = parseInt(newTime.split(':')[0], 10);
        let label = 'Custom';
        if (hour >= 5 && hour < 12) label = 'Morning';
        else if (hour >= 12 && hour < 17) label = 'Afternoon';
        else if (hour >= 17 && hour < 21) label = 'Evening';
        else label = 'Night';

        return { ...t, time: newTime, label };
      })
    );
  };

  const handleApplySuggestion = (sug: typeof QUICK_MEDICINE_SUGGESTIONS[0]) => {
    setName(sug.name);
    setDosage(sug.dosage);
    setForm(sug.form);
    setInstructions(sug.inst);
  };

  const calculatedEndDate =
    durationType === 'fixed_days' && durationDays
      ? addDaysToISO(startDate, durationDays - 1)
      : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newMed: Medication = {
      id: 'med_' + Date.now(),
      name: name.trim(),
      dosage: dosage.trim() || '1 dose',
      form,
      instructions,
      durationType,
      durationDays: durationType === 'fixed_days' ? durationDays : undefined,
      startDate,
      endDate: calculatedEndDate,
      times,
      notes: notes.trim() || undefined,
      color: '#2563eb',
      createdAt: new Date().toISOString(),
    };

    onAddMedication(newMed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-amber-950/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-yellow-300 overflow-hidden animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-yellow-100 flex items-center justify-between bg-amber-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-amber-950 flex items-center justify-center font-bold shadow-xs">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-amber-950">Add New Medication</h2>
              <p className="text-xs text-amber-800/80">Set medicine name, dosage, schedule timings and duration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-amber-700 hover:text-amber-950 hover:bg-amber-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Examples */}
          <div>
            <label className="block text-xs font-semibold text-amber-900 mb-1.5">
              Quick Suggestions (Click to fill):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_MEDICINE_SUGGESTIONS.map((sug) => (
                <button
                  type="button"
                  key={sug.label}
                  onClick={() => handleApplySuggestion(sug)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 hover:bg-amber-200 hover:text-amber-950 hover:border-amber-400 text-amber-900 border border-yellow-200 transition-all"
                >
                  + {sug.label}
                </button>
              ))}
            </div>
          </div>

          {/* Medicine Name & Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="input-med-name" className="block text-xs font-bold text-amber-950 mb-1">
                Medicine Name *
              </label>
              <input
                id="input-med-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dolo 650, Night Painkiller, Vitamin C"
                className="w-full px-3 py-2 rounded-xl border border-yellow-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-sm font-medium bg-amber-50/20"
              />
            </div>

            <div>
              <label htmlFor="input-med-form" className="block text-xs font-bold text-amber-950 mb-1">
                Form
              </label>
              <select
                id="input-med-form"
                value={form}
                onChange={(e) => setForm(e.target.value as MedicineForm)}
                className="w-full px-3 py-2 rounded-xl border border-yellow-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm font-medium"
              >
                <option value="tablet">Tablet / Pill</option>
                <option value="capsule">Capsule</option>
                <option value="syrup">Syrup (liquid)</option>
                <option value="drops">Drops</option>
                <option value="inhaler">Inhaler</option>
                <option value="injection">Injection</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Dosage & Food Guidelines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-dosage" className="block text-xs font-bold text-amber-950 mb-1">
                Dosage
              </label>
              <input
                id="input-dosage"
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 650 mg, 1 tablet, 5 ml"
                className="w-full px-3 py-2 rounded-xl border border-yellow-300 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm font-medium bg-amber-50/20"
              />
            </div>

            <div>
              <label htmlFor="input-instructions" className="block text-xs font-bold text-amber-950 mb-1">
                Intake Instructions
              </label>
              <select
                id="input-instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value as FoodInstruction)}
                className="w-full px-3 py-2 rounded-xl border border-yellow-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm font-medium"
              >
                <option value="after_food">After Food (Post-meal)</option>
                <option value="before_food">Before Food (Empty stomach)</option>
                <option value="with_food">With Food</option>
                <option value="empty_stomach">Empty Stomach (Morning)</option>
                <option value="anytime">Anytime</option>
              </select>
            </div>
          </div>

          {/* Duration Section (30 days / less / more / Always) */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-yellow-300 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-amber-950">
                Course Duration (Days or Always) *
              </label>
              <span className="text-[11px] text-amber-900 font-semibold">
                {durationType === 'always'
                  ? 'Active indefinitely'
                  : `${durationDays} Days Course (until ${calculatedEndDate ? formatHumanDate(calculatedEndDate) : ''})`}
              </span>
            </div>

            {/* Duration Type Quick Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setDurationType('fixed_days');
                  setDurationDays(5);
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                  durationType === 'fixed_days' && durationDays === 5
                    ? 'bg-amber-500 text-amber-950 border-amber-500 shadow-2xs font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-100/50'
                }`}
              >
                5 Days
              </button>

              <button
                type="button"
                onClick={() => {
                  setDurationType('fixed_days');
                  setDurationDays(7);
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                  durationType === 'fixed_days' && durationDays === 7
                    ? 'bg-amber-500 text-amber-950 border-amber-500 shadow-2xs font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-100/50'
                }`}
              >
                7 Days
              </button>

              <button
                type="button"
                onClick={() => {
                  setDurationType('fixed_days');
                  setDurationDays(14);
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                  durationType === 'fixed_days' && durationDays === 14
                    ? 'bg-amber-500 text-amber-950 border-amber-500 shadow-2xs font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-100/50'
                }`}
              >
                14 Days
              </button>

              <button
                type="button"
                onClick={() => {
                  setDurationType('fixed_days');
                  setDurationDays(30);
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                  durationType === 'fixed_days' && durationDays === 30
                    ? 'bg-amber-500 text-amber-950 border-amber-500 shadow-2xs font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-100/50'
                }`}
              >
                30 Days
              </button>

              <button
                type="button"
                onClick={() => setDurationType('always')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                  durationType === 'always'
                    ? 'bg-amber-500 text-amber-950 border-amber-500 shadow-2xs font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-100/50'
                }`}
              >
                Always (Ongoing)
              </button>
            </div>

            {/* Custom Days Input if fixed_days is selected */}
            {durationType === 'fixed_days' && (
              <div className="flex items-center space-x-3 pt-1">
                <span className="text-xs font-semibold text-amber-900 whitespace-nowrap">
                  Custom Days:
                </span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-24 px-3 py-1 rounded-lg border border-yellow-300 bg-white text-sm font-semibold text-amber-950"
                />
                <span className="text-xs text-amber-900/80">
                  Calculated End Date: <strong className="text-amber-950">{calculatedEndDate ? formatHumanDate(calculatedEndDate) : ''}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="input-start-date" className="block text-xs font-bold text-amber-950 mb-1">
              Start Date
            </label>
            <input
              id="input-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full sm:w-60 px-3 py-2 rounded-xl border border-yellow-300 bg-amber-50/20 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm font-medium"
            />
          </div>

          {/* Timings / Schedule Calculation */}
          <div className="p-4 rounded-2xl border border-yellow-300 bg-amber-50/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-amber-950">
                  Dose Timings (Alarms Trigger at these Times) *
                </label>
                <p className="text-[11px] text-amber-800/80">
                  Audio alarm and senior prompts trigger automatically at these times
                </p>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => handleApplyPresetTimes('morning')}
                  className="px-2 py-0.5 rounded text-[11px] bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium"
                >
                  1x (Morning)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetTimes('morning_night')}
                  className="px-2 py-0.5 rounded text-[11px] bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium"
                >
                  2x (Morn & Night)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetTimes('thrice')}
                  className="px-2 py-0.5 rounded text-[11px] bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium"
                >
                  3x (Morn, Aft, Night)
                </button>
              </div>
            </div>

            {/* List of Time Slots */}
            <div className="space-y-2">
              {times.map((t, idx) => (
                <div key={t.id} className="flex items-center space-x-2 bg-white p-2.5 rounded-xl border border-yellow-200">
                  <span className="text-xs font-bold text-amber-700 w-6 text-center">
                    #{idx + 1}
                  </span>

                  <input
                    type="time"
                    required
                    value={t.time}
                    onChange={(e) => handleUpdateTime(t.id, e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-yellow-300 bg-amber-50/30 text-sm font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />

                  <span className="text-xs font-semibold text-amber-900 bg-amber-50 px-2 py-1 rounded-md border border-yellow-200">
                    {formatTime12h(t.time)}
                  </span>

                  <span className="text-xs font-medium text-amber-800 px-2">
                    {t.label}
                  </span>

                  <div className="flex-1" />

                  {times.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTimeSlot(t.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Remove time slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddTimeSlot}
              className="inline-flex items-center space-x-1 text-xs font-bold text-amber-700 hover:text-amber-900 pt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Dose Timing</span>
            </button>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="input-notes" className="block text-xs font-bold text-amber-950 mb-1">
              Instructions or Doctor Notes (Optional)
            </label>
            <input
              id="input-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Take with warm water, avoid milk, take 30 mins before sleep"
              className="w-full px-3 py-2 rounded-xl border border-yellow-300 bg-amber-50/20 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm font-medium"
            />
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-yellow-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-yellow-300 text-xs sm:text-sm font-semibold text-amber-900 hover:bg-amber-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-save-new-medication"
              type="submit"
              className="inline-flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-amber-950 text-xs sm:text-sm font-bold shadow-md shadow-amber-400/30 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Medication</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
