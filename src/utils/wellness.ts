import { WellnessCheckin, WellnessPatternAlert, WellnessSeverity } from '../types';
import { formatDateToISO } from './dateUtils';

export type CheckinSlot = 'morning' | 'afternoon' | 'evening';

const timedQuestions: Record<CheckinSlot, Array<{ id: string; text: string; helper: string }>> = {
  morning: [
    { id: 'sleep', text: 'Good morning! How was your sleep last night?', helper: 'You can tell me about rest, pain, or anything that bothered you overnight.' },
    { id: 'morning-comfort', text: 'Good morning! How is your body feeling as you start the day?', helper: 'A few words are enough—Poppy is listening.' },
  ],
  afternoon: [
    { id: 'water', text: 'Hello! Have you had some water and a meal today?', helper: 'Tell me how your day is going so far.' },
    { id: 'energy', text: 'How is your energy feeling this afternoon?', helper: 'It is okay to say if you feel tired or uncomfortable.' },
  ],
  evening: [
    { id: 'walk', text: 'Good evening! Did you get a little walk or stretch today?', helper: 'Even a few gentle steps count. Tell me how it felt.' },
    { id: 'evening-mood', text: 'Before the evening ends, how are you feeling today?', helper: 'Share anything you would like your caregiver to know.' },
  ],
};

const symptomMatchers: Array<[string, RegExp]> = [
  ['knee pain', /\bknee\b/],
  ['joint pain', /\b(joint|arthritis)\b/],
  ['headache', /\b(headache|head pain|migraine)\b/],
  ['back pain', /\b(backache|back pain)\b/],
  ['chest discomfort', /\b(chest pain|chest pressure|chest discomfort)\b/],
  ['breathing difficulty', /\b(shortness of breath|trouble breathing|breathless|cannot breathe)\b/],
  ['dizziness', /\b(dizzy|dizziness|lightheaded)\b/],
  ['fever', /\b(fever|temperature|chills)\b/],
  ['stomach discomfort', /\b(stomach ache|stomach pain|nausea|vomit|diarrhea)\b/],
];

export function extractWellnessSignals(response: string): { symptoms: string[]; severity: WellnessSeverity } {
  const normalized = response.toLowerCase();
  const symptoms = symptomMatchers.filter(([, pattern]) => pattern.test(normalized)).map(([symptom]) => symptom);
  const highRisk = /\b(severe|worst|faint|collapsed|cannot breathe|chest pain|emergency)\b/.test(normalized);
  const mediumRisk = /\b(pain|hurt|aching|unwell|bad|dizzy|fever)\b/.test(normalized) || symptoms.length > 0;
  return { symptoms, severity: highRisk ? 'high' : mediumRisk ? 'medium' : 'low' };
}

export function getCurrentCheckinSlot(date = new Date()): CheckinSlot {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export function getTimedQuestion(date = new Date()) {
  const slot = getCurrentCheckinSlot(date);
  const dayNumber = Math.floor(date.getTime() / 86_400_000);
  const choices = timedQuestions[slot];
  return { ...choices[dayNumber % choices.length], slot };
}

export function getWellnessPatternAlerts(checkins: WellnessCheckin[]): WellnessPatternAlert[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 6);
  const cutoffISO = formatDateToISO(cutoff);
  const symptomDates = new Map<string, { dates: Set<string>; severity: WellnessSeverity }>();

  checkins.filter((checkin) => checkin.date >= cutoffISO).forEach((checkin) => {
    checkin.symptoms.forEach((symptom) => {
      const current = symptomDates.get(symptom) || { dates: new Set<string>(), severity: 'low' as WellnessSeverity };
      current.dates.add(checkin.date);
      if (checkin.severity === 'high' || (checkin.severity === 'medium' && current.severity === 'low')) current.severity = checkin.severity;
      symptomDates.set(symptom, current);
    });
  });

  return [...symptomDates.entries()]
    .filter(([, value]) => value.dates.size >= 3)
    .map(([symptom, value]) => {
      const dates = [...value.dates].sort();
      return {
        id: `wellness_${symptom.replace(/\s+/g, '_')}`,
        symptom,
        occurrences: dates.length,
        firstReportedOn: dates[0],
        latestReportedOn: dates[dates.length - 1],
        severity: value.severity,
      };
    });
}
