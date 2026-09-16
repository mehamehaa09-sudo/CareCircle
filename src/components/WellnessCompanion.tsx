import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Heart, Send, Sparkles, X } from 'lucide-react';
import { WellnessCheckin } from '../types';
import { getTimedQuestion, extractWellnessSignals } from '../utils/wellness';
import { formatDateToISO } from '../utils/dateUtils';
import poppyMascot from '../assets/poppy-mascot.png';

interface WellnessCompanionProps {
  name: string;
  checkins: WellnessCheckin[];
  journeyHint?: string;
  onSubmit: (checkin: WellnessCheckin) => void;
}

export const WellnessCompanion: React.FC<WellnessCompanionProps> = ({ name, checkins, journeyHint, onSubmit }) => {
  const [response, setResponse] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [clock, setClock] = useState(() => new Date());
  const question = useMemo(() => getTimedQuestion(clock), [clock]);
  const today = formatDateToISO(clock);
  const answeredThisSlot = checkins.some((checkin) => checkin.date === today && checkin.checkinSlot === question.slot);

  useEffect(() => {
    setIsOpen(!answeredThisSlot);
  }, [answeredThisSlot, question.slot]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const submit = () => {
    const trimmed = response.trim();
    if (!trimmed) return;
    const signals = extractWellnessSignals(trimmed);
    onSubmit({
      id: `wellness_${Date.now()}`,
      date: today,
      createdAt: new Date().toISOString(),
      questionId: question.id,
      checkinSlot: question.slot,
      question: question.text,
      response: trimmed,
      symptoms: signals.symptoms,
      severity: signals.severity,
    });
    setResponse('');
    setIsOpen(false);
  };

  return (
    <aside className="poppy-guide" aria-label="Poppy, your care companion">
      {isOpen && (
        <section className="poppy-chat" aria-live="polite">
          <button type="button" className="poppy-close" onClick={() => setIsOpen(false)} aria-label="Close Poppy for now"><X className="w-4 h-4" /></button>
          <div className="flex items-start gap-3 pr-5">
            <div className="mascot-orbit mascot-orbit-small" aria-hidden="true"><img src={poppyMascot} alt="" /></div>
            <div>
              <span className="wellness-name"><Sparkles className="w-3.5 h-3.5" /> Poppy</span>
              <p className="text-base sm:text-lg font-extrabold text-slate-900 mt-2">{question.text}</p>
              <p className="text-sm text-slate-600 mt-1">{question.helper}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <label className="sr-only" htmlFor="wellness-response">Your answer for Poppy</label>
            <input id="wellness-response" value={response} onChange={(event) => setResponse(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submit(); }} placeholder="Tell Poppy..." className="wellness-input" autoFocus />
            <button type="button" onClick={submit} disabled={!response.trim()} className="wellness-submit" aria-label="Send answer to Poppy"><Send className="w-4 h-4" /></button>
          </div>
        </section>
      )}
      {!isOpen && <div className="poppy-speech">{answeredThisSlot ? <><Check className="w-4 h-4" /> Thanks for checking in!</> : journeyHint || `Hello, ${name}! I’m here when you need me.`}</div>}
      <button type="button" className="poppy-launcher" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} aria-label="Talk with Poppy">
        <div className="mascot-orbit" aria-hidden="true"><img src={poppyMascot} alt="" /><div className="mascot-heart">♥</div></div>
        <span className="poppy-label">Poppy <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></span>
      </button>
    </aside>
  );
};
