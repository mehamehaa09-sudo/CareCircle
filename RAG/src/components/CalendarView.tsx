import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Clock } from 'lucide-react';
import { Medication, DoseLog } from '../types';
import {
  formatDateToISO,
  parseISODate,
  getMonthCalendarDays,
  isMedicationActiveOnDate,
  formatHumanDate,
} from '../utils/dateUtils';

interface CalendarViewProps {
  selectedDateISO: string;
  onSelectDate: (dateISO: string) => void;
  medications: Medication[];
  doseLogs: DoseLog[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDateISO,
  onSelectDate,
  medications,
  doseLogs,
}) => {
  const selectedDateObj = parseISODate(selectedDateISO);
  const [currentYear, setCurrentYear] = useState<number>(selectedDateObj.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(selectedDateObj.getMonth());

  const todayISO = formatDateToISO(new Date());

  const calendarDays = getMonthCalendarDays(currentYear, currentMonth, todayISO);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    onSelectDate(todayISO);
  };

  // Helper to compute stats for a specific day
  const getDayStats = (dateISO: string) => {
    // find medications active on this day
    const activeMeds = medications.filter((m) => isMedicationActiveOnDate(m, dateISO));
    const totalDoses = activeMeds.reduce((acc, m) => acc + m.times.length, 0);

    if (totalDoses === 0) return { total: 0, taken: 0, isAllTaken: false };

    const logsForDay = doseLogs.filter((l) => l.date === dateISO && l.status === 'taken');
    const taken = logsForDay.length;
    const isAllTaken = totalDoses > 0 && taken >= totalDoses;

    return { total: totalDoses, taken, isAllTaken };
  };

  // 7-day strip around selected date for ultra-fast day navigation
  const getWeekDaysStrip = () => {
    const strip = [];
    const base = parseISODate(selectedDateISO);
    for (let offset = -3; offset <= 3; offset++) {
      const d = new Date(base);
      d.setDate(d.getDate() + offset);
      const iso = formatDateToISO(d);
      strip.push({
        iso,
        date: d,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        isToday: iso === todayISO,
        isSelected: iso === selectedDateISO,
        stats: getDayStats(iso),
      });
    }
    return strip;
  };

  const weekStrip = getWeekDaysStrip();
  const selectedStats = getDayStats(selectedDateISO);

  return (
    <div className="bg-white rounded-3xl border-2 border-yellow-300 shadow-xs overflow-hidden">
      {/* 7-Day Quick Strip for mobile and instant navigation */}
      <div className="p-3.5 bg-amber-50/70 border-b border-yellow-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-950">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Select Day: {formatHumanDate(selectedDateISO)}</span>
            {selectedDateISO === todayISO && (
              <span className="bg-amber-400 text-amber-950 text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
                Today
              </span>
            )}
          </div>
          {selectedDateISO !== todayISO && (
            <button
              onClick={handleJumpToToday}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors"
            >
              Return to Today
            </button>
          )}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {weekStrip.map((item) => {
            return (
              <button
                key={item.iso}
                onClick={() => {
                  onSelectDate(item.iso);
                  setCurrentYear(item.date.getFullYear());
                  setCurrentMonth(item.date.getMonth());
                }}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
                  item.isSelected
                    ? 'bg-amber-400 text-amber-950 font-bold shadow-xs scale-102 border-2 border-amber-500'
                    : 'bg-white hover:bg-amber-100/50 text-slate-700 border border-yellow-200'
                }`}
              >
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                  item.isSelected ? 'text-amber-950' : 'text-slate-400'
                }`}>
                  {item.dayName}
                </span>
                <span className="text-sm sm:text-base font-extrabold my-0.5">
                  {item.dayNumber}
                </span>
                {item.stats.total > 0 && (
                  <div className="flex items-center space-x-0.5">
                    {item.stats.isAllTaken ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Month Calendar Header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-amber-600" />
            <h2 className="text-base sm:text-lg font-bold text-amber-950">
              {monthNames[currentMonth]} {currentYear}
            </h2>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              className="p-1.5 rounded-lg border border-yellow-300 text-amber-900 hover:bg-amber-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleJumpToToday}
              className="px-2.5 py-1 rounded-lg border border-yellow-300 text-xs font-bold text-amber-900 hover:bg-amber-50 transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              aria-label="Next Month"
              className="p-1.5 rounded-lg border border-yellow-300 text-amber-900 hover:bg-amber-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-amber-900/60 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid Cells */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((cell) => {
            const isSelected = cell.dateISO === selectedDateISO;
            const stats = getDayStats(cell.dateISO);

            return (
              <button
                key={cell.dateISO}
                onClick={() => onSelectDate(cell.dateISO)}
                className={`min-h-[44px] sm:min-h-[50px] p-1 rounded-xl flex flex-col items-center justify-between text-xs transition-all relative ${
                  isSelected
                    ? 'bg-amber-400 text-amber-950 font-bold shadow-xs border-2 border-amber-500'
                    : cell.isCurrentMonth
                    ? 'bg-amber-50/40 hover:bg-amber-100/60 text-slate-800'
                    : 'text-slate-300 hover:text-slate-500'
                } ${cell.isToday && !isSelected ? 'border-2 border-amber-400 font-bold bg-amber-50' : 'border border-yellow-100'}`}
              >
                <div className="w-full flex items-center justify-between px-1">
                  <span className={`text-[11px] sm:text-xs ${cell.isToday && !isSelected ? 'text-amber-800 font-bold' : ''}`}>
                    {cell.dayNumber}
                  </span>
                  {cell.isToday && (
                    <span className={`text-[9px] font-bold ${isSelected ? 'text-amber-950' : 'text-amber-600'}`}>
                      •
                    </span>
                  )}
                </div>

                {/* Dose indicator pills */}
                {stats.total > 0 && (
                  <div className="w-full px-1 mt-1 flex items-center justify-center">
                    {stats.isAllTaken ? (
                      <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-bold leading-none ${
                        isSelected ? 'bg-amber-950 text-amber-200' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        ✓ {stats.taken}/{stats.total}
                      </span>
                    ) : (
                      <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-medium leading-none ${
                        isSelected ? 'bg-amber-500 text-amber-950' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {stats.taken}/{stats.total}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Date Adherence Summary Bar */}
        <div className="mt-4 pt-4 border-t border-yellow-200 flex flex-wrap items-center justify-between text-xs text-amber-950 gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-amber-950">
              {formatHumanDate(selectedDateISO)}
            </span>
            <span>•</span>
            <span className="text-amber-900">
              {selectedStats.total === 0
                ? 'No medications scheduled'
                : `${selectedStats.taken} of ${selectedStats.total} doses taken`}
            </span>
          </div>

          {selectedStats.total > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-24 h-2.5 bg-amber-100 rounded-full overflow-hidden border border-yellow-300">
                <div
                  className={`h-full transition-all duration-300 ${
                    selectedStats.isAllTaken ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.round((selectedStats.taken / selectedStats.total) * 100))}%`,
                  }}
                />
              </div>
              <span className="font-bold text-amber-950">
                {Math.round((selectedStats.taken / selectedStats.total) * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
