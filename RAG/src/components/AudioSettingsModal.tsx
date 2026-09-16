import React, { useState } from 'react';
import { X, Volume2, VolumeX, Bell, Play, Check, AlertCircle } from 'lucide-react';
import { AudioSettings, SoundTone } from '../types';
import { playTone } from '../utils/audioAlarm';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioSettings: AudioSettings;
  onSaveAudioSettings: (settings: AudioSettings) => void;
}

const TONES: Array<{ id: SoundTone; label: string; desc: string }> = [
  { id: 'chime', label: 'Harmonic Chime', desc: 'Melodic 4-note ascending crystal chime' },
  { id: 'gentle-bell', label: 'Meditation Bell', desc: 'Tibetan singing bowl with deep rich harmonic decay' },
  { id: 'marimba', label: 'Acoustic Marimba', desc: 'Warm acoustic wooden bar arpeggio' },
  { id: 'zen-pulse', label: 'Zen Ambient Pulse', desc: 'Soothing low-frequency warm wash' },
  { id: 'digital', label: 'Digital Reminder', desc: 'Modern electronic reminder double beep' },
];

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  isOpen,
  onClose,
  audioSettings,
  onSaveAudioSettings,
}) => {
  const [enabled, setEnabled] = useState(audioSettings.enabled);
  const [volume, setVolume] = useState(audioSettings.volume);
  const [selectedTone, setSelectedTone] = useState<SoundTone>(audioSettings.tone);
  const [notificationStatus, setNotificationStatus] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  if (!isOpen) return null;

  const handleTestTone = (tone: SoundTone) => {
    playTone(tone, volume);
  };

  const handleRequestNotification = async () => {
    if (typeof Notification !== 'undefined') {
      try {
        const perm = await Notification.requestPermission();
        setNotificationStatus(perm);
      } catch (e) {
        console.error('Notification permission error:', e);
      }
    }
  };

  const handleSave = () => {
    onSaveAudioSettings({
      enabled,
      volume,
      tone: selectedTone,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-amber-950/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-yellow-300 overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-yellow-100 flex items-center justify-between bg-amber-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-amber-950 flex items-center justify-center font-bold shadow-xs">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-amber-950">Sound & Alarm Reminders</h2>
              <p className="text-xs text-amber-900/80">Configure reminder sounds, tones and volume</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-1.5 rounded-lg text-amber-700 hover:text-amber-950 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 space-y-5">
          {/* Master Enable/Disable */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/60 border border-yellow-200">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${enabled ? 'bg-amber-400 text-amber-950' : 'bg-slate-200 text-slate-500'}`}>
                {enabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-950">Sound Alarm Triggers</h4>
                <p className="text-xs text-amber-900/70">Play sound when medication time arrives</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Volume Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-950">
              <span>Alarm Volume</span>
              <span className="text-amber-700 font-extrabold">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={volume}
              disabled={!enabled}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
            />
          </div>

          {/* Tones Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-amber-950">
              Alarm Sound Tone (Click play icon to preview)
            </label>
            <div className="space-y-1.5">
              {TONES.map((tone) => {
                const isSelected = selectedTone === tone.id;
                return (
                  <div
                    key={tone.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-400'
                        : 'border-yellow-200 hover:border-amber-300 bg-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedTone(tone.id)}
                      className="flex-1 text-left cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-bold ${isSelected ? 'text-amber-950' : 'text-slate-800'}`}>
                          {tone.label}
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-amber-900/70">{tone.desc}</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTestTone(tone.id)}
                      title={`Play ${tone.label} sample`}
                      className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-500 hover:text-amber-950 text-amber-900 transition-colors ml-2 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* System Notifications Option */}
          <div className="pt-2 border-t border-yellow-100">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-amber-950">Browser Notifications</span>
              </div>
              {notificationStatus === 'granted' ? (
                <span className="text-emerald-700 font-bold flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Enabled</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestNotification}
                  className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 font-bold border border-yellow-300 hover:bg-amber-200 cursor-pointer"
                >
                  Enable Notifications
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-yellow-100 flex items-center justify-end space-x-2 bg-amber-50/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Save Sound Settings
          </button>
        </div>
      </div>
    </div>
  );
};
