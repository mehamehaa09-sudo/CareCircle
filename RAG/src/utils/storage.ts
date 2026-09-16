import { Medication, DoseLog, AudioSettings } from '../types';
import { formatDateToISO, addDaysToISO } from './dateUtils';

const MEDS_KEY = 'med_planner_medications_v1';
const LOGS_KEY = 'med_planner_logs_v1';
const AUDIO_KEY = 'med_planner_audio_settings_v1';

export function getInitialMedications(): Medication[] {
  const today = formatDateToISO(new Date());

  return [
    {
      id: 'med-dolo-650',
      name: 'Dolo 650',
      dosage: '650 mg (1 tablet)',
      form: 'tablet',
      instructions: 'after_food',
      durationType: 'fixed_days',
      durationDays: 5,
      startDate: today,
      endDate: addDaysToISO(today, 4),
      times: [
        { id: 't1', time: '08:00', label: 'Morning' },
        { id: 't2', time: '14:00', label: 'Afternoon' },
        { id: 't3', time: '20:30', label: 'Night' },
      ],
      notes: 'For fever and body ache relief. Drink plenty of warm water.',
      color: '#3b82f6', // Blue
      createdAt: new Date().toISOString(),
    },
    {
      id: 'med-painkiller',
      name: 'Night Painkiller',
      dosage: '1 tablet',
      form: 'tablet',
      instructions: 'after_food',
      durationType: 'fixed_days',
      durationDays: 7,
      startDate: today,
      endDate: addDaysToISO(today, 6),
      times: [
        { id: 't4', time: '21:30', label: 'Night' },
      ],
      notes: 'Take before going to bed with milk or warm water.',
      color: '#8b5cf6', // Violet
      createdAt: new Date().toISOString(),
    },
    {
      id: 'med-multivitamin',
      name: 'Daily Multivitamin & Zinc',
      dosage: '1 capsule',
      form: 'capsule',
      instructions: 'after_food',
      durationType: 'always',
      startDate: today,
      times: [
        { id: 't5', time: '09:00', label: 'Morning' },
      ],
      notes: 'Daily nutritional supplement with breakfast.',
      color: '#10b981', // Emerald
      createdAt: new Date().toISOString(),
    },
  ];
}

export function loadMedications(): Medication[] {
  try {
    const raw = localStorage.getItem(MEDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse stored medications:', e);
  }
  return getInitialMedications();
}

export function loadDoseLogs(): DoseLog[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load dose logs:', e);
  }
  return [];
}

export function saveDoseLogs(logs: DoseLog[]): void {
  try {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save dose logs:', e);
  }
}

export const defaultAudioSettings: AudioSettings = {
  enabled: true,
  volume: 0.8,
  tone: 'chime',
};

export function loadAudioSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(AUDIO_KEY);
    if (raw) {
      return { ...defaultAudioSettings, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load audio settings:', e);
  }
  return defaultAudioSettings;
}

export function saveAudioSettings(settings: AudioSettings): void {
  try {
    localStorage.setItem(AUDIO_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save audio settings:', e);
  }
}

const PROFILE_KEY = 'carecircle_current_user_v1';
const NUDGES_KEY = 'carecircle_nudges_v1';
const DISMISSED_ALERTS_KEY = 'carecircle_dismissed_alerts_v1';

export const defaultElderlyProfile: import('../types').UserProfile = {
  id: 'user-elderly-1',
  name: 'Grandpa Robert',
  role: 'elderly',
  circleCode: 'CARE-7721',
  elderlyName: 'Grandpa Robert',
  caretakerName: 'Sarah (Daughter)',
  emergencyPhone: '+1 (555) 234-5678',
  condition: 'both',
};

export const defaultCaretakerProfile: import('../types').UserProfile = {
  id: 'user-caretaker-1',
  name: 'Sarah (Caregiver)',
  role: 'caretaker',
  circleCode: 'CARE-7721',
  elderlyName: 'Grandpa Robert',
  caretakerName: 'Sarah (Daughter)',
  emergencyPhone: '+1 (555) 234-5678',
  condition: 'both',
};

export function loadCurrentProfile(): import('../types').UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const profile = JSON.parse(raw);
      return { ...profile, condition: profile.condition || 'both' };
    }
  } catch (e) {
    console.error('Failed to load user profile:', e);
  }
  return null;
}

export function saveCurrentProfile(profile: import('../types').UserProfile | null): void {
  try {
    if (profile) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(PROFILE_KEY);
    }
  } catch (e) {
    console.error('Failed to save user profile:', e);
  }
}

export function loadNudges(): import('../types').CaretakerNudge[] {
  try {
    const raw = localStorage.getItem(NUDGES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load nudges:', e);
  }
  return [];
}

export function saveNudges(nudges: import('../types').CaretakerNudge[]): void {
  try {
    localStorage.setItem(NUDGES_KEY, JSON.stringify(nudges));
  } catch (e) {
    console.error('Failed to save nudges:', e);
  }
}

export function loadDismissedAlertIds(): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_ALERTS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load dismissed alerts:', e);
  }
  return [];
}

export function saveDismissedAlertIds(ids: string[]): void {
  try {
    localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error('Failed to save dismissed alerts:', e);
  }
}

