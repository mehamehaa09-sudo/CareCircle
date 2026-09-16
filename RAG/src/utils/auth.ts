import { Medication, MedicineForm, FoodInstruction, DurationType } from '../types';

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: string;
  conditions: string[];
}

const API_BASE_URL = 'http://localhost:5000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Unable to complete the request.');
  }
  return data as T;
}

function normalizeMedication(
  data: Partial<Medication> & {
    id?: number | string;
    times?: Array<Partial<Medication['times'][number]>>;
  }
): Medication {
  return {
    id: String(data.id),
    name: String(data.name || ''),
    dosage: String(data.dosage || ''),
    form: (data.form || 'tablet') as MedicineForm,
    instructions: (data.instructions || 'anytime') as FoodInstruction,
    durationType: (data.durationType || 'always') as DurationType,
    durationDays: data.durationDays,
    startDate: String(data.startDate || ''),
    endDate: data.endDate,
    times: (data.times || []).map((time, index) => ({
      id: String(time.id ?? `time-${index}`),
      time: String(time.time || ''),
      label: String(time.label || 'Custom'),
    })),
    notes: data.notes,
    color: String(data.color || '#2563eb'),
    createdAt: String(data.createdAt || new Date().toISOString()),
  };
}

export async function fetchMyMedications(): Promise<Medication[]> {
  const medications = await request<Array<Partial<Medication> & { id?: number | string }>>('/api/me/medications');
  return medications.map(normalizeMedication);
}

export async function createMyMedication(medication: Medication): Promise<Medication> {
  const response = await request<Partial<Medication> & { id?: number | string }>('/api/me/medications', {
    method: 'POST',
    body: JSON.stringify({
      name: medication.name,
      dosage: medication.dosage,
      form: medication.form,
      instructions: medication.instructions,
      durationType: medication.durationType,
      durationDays: medication.durationDays,
      startDate: medication.startDate,
      endDate: medication.endDate,
      times: medication.times,
      notes: medication.notes,
      color: medication.color,
    }),
  });
  return normalizeMedication(response);
}

export function deleteMyMedication(id: string): Promise<{ success: boolean }> {
  return request(`/api/me/medications/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    credentials: 'include',
  });
  if (response.status === 401) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Unable to restore your session.');
  return data.user as AuthUser;
}

export function login(username: string, password: string): Promise<{ user: AuthUser }> {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function register(payload: {
  name: string;
  username: string;
  password: string;
  role: 'elderly' | 'caretaker';
  conditions: string[];
}): Promise<{ user: AuthUser }> {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function logout(): Promise<{ success: boolean }> {
  return request('/api/auth/logout', { method: 'POST' });
}
