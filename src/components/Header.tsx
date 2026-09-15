import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  Volume2,
  Plus,
  Clock,
  LogOut,
  Repeat,
  AlertTriangle,
  User,
  HeartHandshake,
  PhoneCall,
} from 'lucide-react';
import { AudioSettings, UserProfile } from '../types';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenAudioSettings: () => void;
  audioSettings: AudioSettings;
  userProfile: UserProfile;
  onSwitchRole: () => void;
  onLogout: () => void;
  missedDoseCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddModal,
  onOpenAudioSettings,
  audioSettings,
  userProfile,
  onSwitchRole,
  onLogout,
  missedDoseCount,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeFormatted = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const dateFormatted = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const isElderly = userProfile.role === 'elderly';

  return (
    <header className="bg-amber-50/95 backdrop-blur-md border-b-2 border-yellow-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Clock */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Logo size="md" showSubtitle={false} />

            <div className="hidden md:flex flex-col border-l border-yellow-300 pl-3">
              <div className="flex items-center space-x-1.5 text-xs text-amber-900 font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>{dateFormatted}</span>
                <span>•</span>
                <span className="tabular-nums font-bold text-amber-950">{timeFormatted}</span>
              </div>
              <div className="text-[10px] text-amber-700 font-mono">
                Circle Code: {userProfile.circleCode}
              </div>
            </div>
          </div>

          {/* Center / Role Badge & Quick Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Active User Indicator */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white border border-yellow-300 shadow-2xs">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                  isElderly ? 'bg-amber-200 text-amber-950' : 'bg-amber-400 text-amber-950'
                }`}
              >
                {isElderly ? <User className="w-3.5 h-3.5" /> : <HeartHandshake className="w-3.5 h-3.5" />}
              </div>
              <div className="text-left leading-tight hidden sm:block">
                <div className="text-xs font-extrabold text-amber-950">
                  {userProfile.name}
                </div>
                <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
                  {isElderly ? 'Elderly View' : 'Caretaker View'}
                </div>
              </div>
            </div>

            {/* Switch Role Button */}
            <button
              type="button"
              id="btn-switch-role"
              onClick={onSwitchRole}
              title={`Switch to ${isElderly ? 'Caretaker' : 'Elderly'} View`}
              className="relative inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-200/80 hover:bg-amber-300 text-amber-950 text-xs font-bold border border-amber-400/80 transition-all cursor-pointer shadow-2xs"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                Switch to {isElderly ? 'Caretaker' : 'Elderly'}
              </span>
              <span className="sm:hidden">Switch</span>

              {/* Missed dose warning badge on switch button if caretaker */}
              {isElderly && missedDoseCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 text-white text-[9px] font-bold items-center justify-center">
                    {missedDoseCount}
                  </span>
                </span>
              )}
            </button>
            {/* Language Switcher */}
            <LanguageSwitcher />
            {/* Audio Settings Modal Trigger */}
            <button
              type="button"
              id="btn-sound-settings-header"
              onClick={onOpenAudioSettings}
              title={audioSettings.enabled ? `Sound: ON (${audioSettings.tone})` : 'Sound: Muted'}
              className={`p-2 rounded-xl border transition-all ${
                audioSettings.enabled
                  ? 'border-yellow-300 bg-white text-amber-950 hover:bg-amber-100/50'
                  : 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
              }`}
            >
              {audioSettings.enabled ? <Volume2 className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>

            {/* Logout / Switch Profile */}
            <button
              type="button"
              id="btn-logout"
              onClick={onLogout}
              title="Sign Out / Switch Profile"
              className="p-2 rounded-xl border border-yellow-300 bg-white hover:bg-amber-100/50 text-amber-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
