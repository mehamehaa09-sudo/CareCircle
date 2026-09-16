import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, ShieldAlert, X } from 'lucide-react';
import { UserProfile } from '../types';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  userProfile,
}) => {
  const [callState, setCallState] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const targetName =
    userProfile.role === 'elderly'
      ? userProfile.caretakerName
      : userProfile.elderlyName;
  const phoneNumber = userProfile.emergencyPhone || '+1 (555) 234-5678';

  useEffect(() => {
    if (!isOpen) {
      setCallState('ringing');
      setCallSeconds(0);
      return;
    }

    // Auto-connect after 2.5 seconds to simulate answer
    const ringTimer = setTimeout(() => {
      setCallState('connected');
    }, 2500);

    return () => clearTimeout(ringTimer);
  }, [isOpen]);

  useEffect(() => {
    if (callState !== 'connected') return;
    const interval = setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callState]);

  if (!isOpen) return null;

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallState('ended');
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-slate-900 border-2 border-yellow-400 text-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl relative text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Pulse avatar */}
        <div className="relative inline-block my-4">
          <div
            className={`w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black text-3xl flex items-center justify-center shadow-lg shadow-amber-400/30 ${
              callState === 'ringing' ? 'animate-bounce' : 'animate-pulse-subtle'
            }`}
          >
            {targetName.charAt(0)}
          </div>
        </div>

        <h3 className="text-2xl font-black text-white">{targetName}</h3>
        <p className="text-xs text-amber-300 font-mono mt-1">{phoneNumber}</p>

        {/* Call status */}
        <div className="mt-4 py-2 px-4 rounded-full bg-slate-800/80 inline-block text-xs font-semibold">
          {callState === 'ringing' && (
            <span className="text-yellow-400 animate-pulse">Ringing CareCircle Line...</span>
          )}
          {callState === 'connected' && (
            <span className="text-emerald-400">Connected • {formatSeconds(callSeconds)}</span>
          )}
          {callState === 'ended' && <span className="text-red-400">Call Ended</span>}
        </div>

        {callState === 'connected' && (
          <p className="text-xs text-slate-300 mt-3 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700">
            "{userProfile.role === 'elderly' ? 'Hi Grandpa! I see your call. Did you need help with your medicine?' : 'Hello! Grandpa here, I hear you loud and clear!'}"
          </p>
        )}

        {/* Call controls */}
        <div className="mt-8 flex items-center justify-center space-x-4">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3.5 rounded-full border transition-all ${
              isMuted
                ? 'bg-red-500/20 border-red-500 text-red-400'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* End Call Button */}
          <button
            type="button"
            id="btn-end-call"
            onClick={handleEndCall}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-600/40 transition-transform active:scale-95"
          >
            <PhoneOff className="w-7 h-7" />
          </button>

          <button
            type="button"
            className="p-3.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
