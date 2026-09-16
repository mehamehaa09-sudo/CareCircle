import { SoundTone } from '../types';

let audioCtx: AudioContext | null = null;
let alarmIntervalId: number | null = null;
let isAlarmRunning = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a single chime / tone pattern
 */
export function playTone(tone: SoundTone = 'chime', volume: number = 0.8) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(Math.max(0.01, Math.min(volume, 1)), now);
    gainNode.connect(ctx.destination);

    if (tone === 'chime') {
      // Pleasant multi-frequency chime chord (C5, E5, G5, C6)
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        noteGain.gain.setValueAtTime(0, now + idx * 0.12);
        noteGain.gain.linearRampToValueAtTime(0.35, now + idx * 0.12 + 0.04);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 1.2);

        osc.connect(noteGain);
        noteGain.connect(gainNode);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 1.25);
      });
    } else if (tone === 'gentle-bell') {
      // Tibetan / meditation bell with rich overtones
      const baseFreq = 440;
      const harmonics = [1, 2.76, 5.4, 8.93];
      const gains = [0.5, 0.25, 0.12, 0.06];

      harmonics.forEach((harmonic, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * harmonic, now);

        noteGain.gain.setValueAtTime(gains[idx], now);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

        osc.connect(noteGain);
        noteGain.connect(gainNode);

        osc.start(now);
        osc.stop(now + 2.05);
      });
    } else if (tone === 'marimba') {
      // Warm marimba arpeggio (G4, B4, D5, G5)
      const freqs = [392.0, 493.88, 587.33, 783.99];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        noteGain.gain.setValueAtTime(0.4, now + idx * 0.1);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.45);

        osc.connect(noteGain);
        noteGain.connect(gainNode);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.5);
      });
    } else if (tone === 'zen-pulse') {
      // Deep calming harmonic wash
      const freqs = [329.63, 493.88, 659.25];
      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        noteGain.gain.setValueAtTime(0.01, now);
        noteGain.gain.linearRampToValueAtTime(0.3, now + 0.3);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

        osc.connect(noteGain);
        noteGain.connect(gainNode);

        osc.start(now);
        osc.stop(now + 1.85);
      });
    } else {
      // Digital double-beep reminder
      [0, 0.18].forEach((delay) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now + delay);

        noteGain.gain.setValueAtTime(0.18, now + delay);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.1);

        osc.connect(noteGain);
        noteGain.connect(gainNode);

        osc.start(now + delay);
        osc.stop(now + delay + 0.12);
      });
    }
  } catch (err) {
    console.warn('Audio play error:', err);
  }
}

/**
 * Start repeating alarm chime until manually stopped
 */
export function startContinuousAlarm(tone: SoundTone = 'chime', volume: number = 0.8) {
  if (isAlarmRunning) return;
  isAlarmRunning = true;

  // Play immediately
  playTone(tone, volume);

  // Repeat every 2.8 seconds
  alarmIntervalId = window.setInterval(() => {
    if (isAlarmRunning) {
      playTone(tone, volume);
    }
  }, 2800);
}

/**
 * Stop repeating alarm
 */
export function stopContinuousAlarm() {
  isAlarmRunning = false;
  if (alarmIntervalId !== null) {
    clearInterval(alarmIntervalId);
    alarmIntervalId = null;
  }
}

export function isAlarmActive(): boolean {
  return isAlarmRunning;
}

/**
 * Urgent two-tone alert for Caretaker when an elderly person misses medication
 */
export function playCaretakerAlertSound(volume: number = 0.9) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(Math.max(0.01, Math.min(volume, 1)), now);
    gainNode.connect(ctx.destination);

    // Urgent rising warning chime: A4 -> E5 -> A5 with repeat
    [0, 0.22, 0.44].forEach((timeOffset, i) => {
      const freqs = [440, 659.25, 880];
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freqs[i], now + timeOffset);

      noteGain.gain.setValueAtTime(0, now + timeOffset);
      noteGain.gain.linearRampToValueAtTime(0.4, now + timeOffset + 0.03);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + timeOffset + 0.35);

      osc.connect(noteGain);
      noteGain.connect(gainNode);

      osc.start(now + timeOffset);
      osc.stop(now + timeOffset + 0.38);
    });
  } catch (e) {
    console.warn('Audio alert error:', e);
  }
}

/**
 * Gentle warm reminder chime played on Senior's view when Caregiver nudges
 */
export function playSeniorNudgeSound(volume: number = 0.85) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.connect(ctx.destination);

    // Sweet harp-like arpeggio (C5, G5, E5, C6)
    const freqs = [523.25, 783.99, 659.25, 1046.5];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);

      noteGain.gain.setValueAtTime(0, now + idx * 0.15);
      noteGain.gain.linearRampToValueAtTime(0.35, now + idx * 0.15 + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 0.8);

      osc.connect(noteGain);
      noteGain.connect(gainNode);

      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 0.85);
    });
  } catch (e) {
    console.warn('Senior nudge sound error:', e);
  }
}
