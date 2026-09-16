import React, { useEffect } from 'react';
import { Bell, Check, Clock, Volume2, VolumeX, AlertTriangle, Pill } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ActiveAlarm } from '../types';
import { formatTime12h } from '../utils/dateUtils';
import { stopContinuousAlarm } from '../utils/audioAlarm';

interface AlarmAlertModalProps {
  alarm: ActiveAlarm | null;
  onDismiss: () => void;
  onTakeNow: (medicationId: string, time: string, label: string) => void;
  onSnooze: (alarm: ActiveAlarm, minutes: number) => void;
}

export const AlarmAlertModal: React.FC<AlarmAlertModalProps> = ({
  alarm,
  onDismiss,
  onTakeNow,
  onSnooze,
}) => {
  if (!alarm) return null;

  const handleTake = () => {
    stopContinuousAlarm();
    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {}
    onTakeNow(alarm.medicationId, alarm.time, alarm.label);
  };

  const handleSnooze = () => {
    stopContinuousAlarm();
    onSnooze(alarm, 5);
  };

  const handleDismiss = () => {
    stopContinuousAlarm();
    onDismiss();
  };

  const getFoodInstructionText = (inst: string) => {
    switch (inst) {
      case 'after_food':
        return 'Take after food / meal';
      case 'before_food':
        return 'Take before meal (Empty stomach)';
      case 'with_food':
        return 'Take with food';
      case 'empty_stomach':
        return 'Take on empty stomach';
      default:
        return 'Take with a glass of water';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-amber-400 overflow-hidden ring-4 ring-amber-400/20">
        {/* Animated Alarm Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-6 text-white text-center relative overflow-hidden">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-3 shadow-inner ring-4 ring-white/30 animate-bounce">
            <Bell className="w-8 h-8 text-white" />
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-black/20 text-xs font-bold uppercase tracking-wider mb-2">
            Medication Reminder Alarm
          </div>
          <h2 className="text-2xl font-black tracking-tight">Time for your Medicine!</h2>
          <p className="text-xs text-white/80 mt-1">
            Audio alarm is currently ringing
          </p>
        </div>

        {/* Medicine Details */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-center space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {alarm.label} Dose • {formatTime12h(alarm.time)}
            </div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {alarm.medicationName}
            </h3>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold">
              <Pill className="w-3.5 h-3.5" />
              <span>Dosage: {alarm.dosage}</span>
            </div>

            <div className="text-xs font-semibold text-amber-800 bg-amber-50 py-1.5 px-3 rounded-lg border border-amber-200">
              💡 {getFoodInstructionText(alarm.instructions)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            {/* Take Now Primary Action */}
            <button
              id="btn-alarm-take-now"
              onClick={handleTake}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-base shadow-md flex items-center justify-center space-x-2 transition-all"
            >
              <Check className="w-5 h-5" />
              <span>Take Medicine Now</span>
            </button>

            {/* Snooze & Dismiss Row */}
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-alarm-snooze"
                onClick={handleSnooze}
                className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Clock className="w-4 h-4" />
                <span>Snooze 5 mins</span>
              </button>

              <button
                id="btn-alarm-dismiss"
                onClick={handleDismiss}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <VolumeX className="w-4 h-4" />
                <span>Stop Alarm</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
