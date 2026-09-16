export type MedicineForm = 'tablet' | 'capsule' | 'syrup' | 'injection' | 'drops' | 'inhaler' | 'other';

export type FoodInstruction = 'after_food' | 'before_food' | 'with_food' | 'empty_stomach' | 'anytime';

export type DurationType = 'always' | 'fixed_days';

export interface MedicationScheduleTime {
  id: string;
  time: string; // "HH:MM" 24hr format, e.g. "08:00"
  label: string; // e.g. "Morning", "Afternoon", "Evening", "Night", "Custom"
}

export interface Medication {
  id: string;
  name: string;
  dosage: string; // e.g. "650mg", "1 tablet", "10ml"
  form: MedicineForm;
  instructions: FoodInstruction;
  durationType: DurationType;
  durationDays?: number; // e.g. 5, 7, 14, 30, 60, etc.
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD (calculated if durationType === 'fixed_days')
  times: MedicationScheduleTime[];
  notes?: string;
  color: string; // CSS color string or color key
  createdAt: string;
}

export type DoseStatus = 'pending' | 'taken' | 'skipped';

export interface DoseLog {
  id: string; // `${medicationId}_${date}_${time}`
  medicationId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  label: string;
  status: DoseStatus;
  takenAt?: string;
}

export interface ActiveAlarm {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  instructions: FoodInstruction;
  time: string;
  label: string;
  color: string;
  triggeredAt: number;
}

export type SoundTone = 'chime' | 'gentle-bell' | 'marimba' | 'zen-pulse' | 'digital';

export interface AudioSettings {
  enabled: boolean;
  volume: number; // 0 to 1
  tone: SoundTone;
  alarmMutedUntil?: number; // timestamp to suppress temporary re-triggers
}

export type UserRole = 'elderly' | 'caretaker';
export type ManagedCondition = 'hypertension' | 'diabetes' | 'both' | 'none';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  circleCode: string;
  elderlyName: string;
  caretakerName: string;
  emergencyPhone?: string;
  condition: ManagedCondition;
}

export interface MissedDoseAlert {
  id: string; // `${medicationId}_${date}_${time}`
  medicationId: string;
  medicationName: string;
  dosage: string;
  date: string;
  scheduledTime: string;
  label: string;
  scheduledLabel?: string;
  minutesLate?: number;
  notifiedAt?: number;
  detectedAt?: number;
  elderlyName?: string;
  dismissed?: boolean;
}

export interface CaretakerNudge {
  id: string;
  senderName: string;
  targetName?: string;
  message: string;
  timestamp?: number;
  sentAt?: number;
  medicationName?: string;
  acknowledged?: boolean;
}
