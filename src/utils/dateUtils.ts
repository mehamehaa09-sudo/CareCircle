import { Medication } from '../types';

export function formatDateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(isoStr: string): Date {
  const [y, m, d] = isoStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDaysToISO(isoStr: string, days: number): string {
  const d = parseISODate(isoStr);
  d.setDate(d.getDate() + days);
  return formatDateToISO(d);
}

export function formatHumanDate(isoStr: string): string {
  const d = parseISODate(isoStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatFullHumanDate(isoStr: string): string {
  const d = parseISODate(isoStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime12h(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const period = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${period}`;
}

/**
 * Check if a medication is scheduled on a given date (YYYY-MM-DD)
 */
export function isMedicationActiveOnDate(med: Medication, targetDateISO: string): boolean {
  if (targetDateISO < med.startDate) {
    return false;
  }
  if (med.durationType === 'always') {
    return true;
  }
  if (med.endDate) {
    return targetDateISO <= med.endDate;
  }
  if (med.durationDays) {
    const calculatedEnd = addDaysToISO(med.startDate, med.durationDays - 1);
    return targetDateISO <= calculatedEnd;
  }
  return true;
}

/**
 * Calculate the remaining days for a medication from today
 */
export function getRemainingDays(med: Medication, todayISO: string): { text: string; isExpiringSoon: boolean; isExpired: boolean; diffDays: number } {
  if (med.durationType === 'always') {
    return { text: 'Ongoing (Always)', isExpiringSoon: false, isExpired: false, diffDays: 9999 };
  }

  const end = med.endDate || (med.durationDays ? addDaysToISO(med.startDate, med.durationDays - 1) : med.startDate);
  const today = parseISODate(todayISO);
  const endDate = parseISODate(end);

  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `Completed ${Math.abs(diffDays)}d ago`, isExpiringSoon: false, isExpired: true, diffDays };
  }
  if (diffDays === 0) {
    return { text: 'Last day today!', isExpiringSoon: true, isExpired: false, diffDays: 0 };
  }
  if (diffDays === 1) {
    return { text: '1 day left', isExpiringSoon: true, isExpired: false, diffDays: 1 };
  }
  return {
    text: `${diffDays} days left`,
    isExpiringSoon: diffDays <= 3,
    isExpired: false,
    diffDays,
  };
}

export interface CalendarDay {
  date: Date;
  dateISO: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

/**
 * Generate 35-42 calendar cells for a month view
 */
export function getMonthCalendarDays(year: number, monthIndex: number, todayISO: string): CalendarDay[] {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon ...
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const days: CalendarDay[] = [];

  // Previous month trailing days
  const prevMonthLastDate = new Date(year, monthIndex, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDate - i;
    const d = new Date(year, monthIndex - 1, dayNum);
    const iso = formatDateToISO(d);
    days.push({
      date: d,
      dateISO: iso,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: iso === todayISO,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, monthIndex, d);
    const iso = formatDateToISO(dateObj);
    days.push({
      date: dateObj,
      dateISO: iso,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: iso === todayISO,
    });
  }

  // Next month leading days to complete full grid
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    const dateObj = new Date(year, monthIndex + 1, d);
    const iso = formatDateToISO(dateObj);
    days.push({
      date: dateObj,
      dateISO: iso,
      dayNumber: d,
      isCurrentMonth: false,
      isToday: iso === todayISO,
    });
  }

  return days;
}

export interface EarlyDoseCheckResult {
  isTooEarly: boolean;
  minutesUntilAllowed: number;
  earliestAllowedTimeStr: string;
  earliestAllowedFormatted: string;
  scheduledFormatted: string;
  reason?: string;
}

/**
 * Checks whether a dose is being marked taken more than 15 minutes before its scheduled time.
 * For example, if scheduled for 21:00 (9:00 PM), it is locked until 20:45 (8:45 PM).
 */
export function checkIsDoseTooEarly(
  dateISO: string,
  scheduledTime: string,
  maxMinutesEarlyAllowed: number = 15,
  currentDate: Date = new Date()
): EarlyDoseCheckResult {
  const todayISO = formatDateToISO(currentDate);

  // If the selected date is in the future (e.g. tomorrow)
  if (dateISO > todayISO) {
    return {
      isTooEarly: true,
      minutesUntilAllowed: 9999,
      earliestAllowedTimeStr: scheduledTime,
      earliestAllowedFormatted: formatTime12h(scheduledTime),
      scheduledFormatted: formatTime12h(scheduledTime),
      reason: `Scheduled for future date (${dateISO}). Cannot take future medications in advance.`,
    };
  }

  // If the selected date is in the past (e.g. yesterday), it is not too early (it is past due)
  if (dateISO < todayISO) {
    return {
      isTooEarly: false,
      minutesUntilAllowed: 0,
      earliestAllowedTimeStr: scheduledTime,
      earliestAllowedFormatted: formatTime12h(scheduledTime),
      scheduledFormatted: formatTime12h(scheduledTime),
    };
  }

  // Same date comparison
  const [schedH, schedM] = scheduledTime.split(':').map(Number);
  const scheduledMinutes = (isNaN(schedH) ? 0 : schedH) * 60 + (isNaN(schedM) ? 0 : schedM);
  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

  // Earliest allowed time is (scheduledMinutes - maxMinutesEarlyAllowed)
  const earliestAllowedMinutes = scheduledMinutes - maxMinutesEarlyAllowed;

  if (currentMinutes < earliestAllowedMinutes) {
    const minutesRemaining = earliestAllowedMinutes - currentMinutes;

    const safeAllowedMins = Math.max(0, earliestAllowedMinutes);
    const unlockH = Math.floor(safeAllowedMins / 60);
    const unlockM = safeAllowedMins % 60;
    const unlockTimeStr = `${String(unlockH).padStart(2, '0')}:${String(unlockM).padStart(2, '0')}`;
    const unlockFormatted = formatTime12h(unlockTimeStr);
    const scheduledFormatted = formatTime12h(scheduledTime);

    return {
      isTooEarly: true,
      minutesUntilAllowed: minutesRemaining,
      earliestAllowedTimeStr: unlockTimeStr,
      earliestAllowedFormatted: unlockFormatted,
      scheduledFormatted,
      reason: `Too early to take. Available starting at ${unlockFormatted} (15 minutes before ${scheduledFormatted}).`,
    };
  }

  return {
    isTooEarly: false,
    minutesUntilAllowed: 0,
    earliestAllowedTimeStr: scheduledTime,
    earliestAllowedFormatted: formatTime12h(scheduledTime),
    scheduledFormatted: formatTime12h(scheduledTime),
  };
}

