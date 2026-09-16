import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { Logo } from './Logo';
import { HeartHandshake, User, ShieldCheck, ArrowRight, Sparkles, Phone, Lock, BellRing } from 'lucide-react';
import { defaultElderlyProfile, defaultCaretakerProfile } from '../utils/storage';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { CareCircleMascot } from './CareCircleMascot';

interface LoginViewProps {
  onLogin: (profile: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const { t } = useLanguage();
  const [showPoppyWelcome, setShowPoppyWelcome] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>('elderly');
  const [elderlyName, setElderlyName] = useState('Grandpa Robert');
  const [caretakerName, setCaretakerName] = useState('Sarah (Daughter)');
  const [circleCode, setCircleCode] = useState('CARE-7721');
  const [phone, setPhone] = useState('+1 (555) 234-5678');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const profile: UserProfile = {
      id: selectedRole === 'elderly' ? 'user-elderly-1' : 'user-caretaker-1',
      name: selectedRole === 'elderly' ? elderlyName : caretakerName,
      role: selectedRole,
      circleCode: circleCode.trim() || 'CARE-7721',
      elderlyName: elderlyName.trim() || 'Grandpa Robert',
      caretakerName: caretakerName.trim() || 'Sarah (Daughter)',
      emergencyPhone: phone,
    };
    onLogin(profile);
  };

  const handleQuickLogin = (role: UserRole) => {
    if (role === 'elderly') {
      onLogin({
        ...defaultElderlyProfile,
        elderlyName,
        caretakerName,
        circleCode,
      });
    } else {
      onLogin({
        ...defaultCaretakerProfile,
        elderlyName,
        caretakerName,
        circleCode,
      });
    }
  };

  const greeting = new Date().getHours() < 12 ? 'Good morning!' : new Date().getHours() < 17 ? 'Good afternoon!' : 'Good evening!';

  if (showPoppyWelcome) return (
    <main className="min-h-screen overflow-hidden grid place-items-center p-6 bg-gradient-to-br from-amber-50 via-yellow-100 to-orange-100">
      <div className="grid md:grid-cols-2 items-center gap-8 max-w-5xl w-full">
        <section>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-amber-200 text-xs font-extrabold text-amber-800"><Sparkles className="w-4 h-4" /> Your CareCircle companion</span>
          <h1 className="mt-5 text-5xl sm:text-7xl font-black tracking-tight leading-[.92] text-amber-950">{greeting}<br /><span className="text-amber-600">I’m Poppy.</span></h1>
          <p className="mt-5 max-w-md text-lg font-medium leading-relaxed text-amber-900">I’ll help your family care for today—one medicine, one check-in, and one gentle reminder at a time.</p>
          <button type="button" onClick={() => setShowPoppyWelcome(false)} className="mt-7 inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold shadow-xl shadow-amber-600/25">Let’s begin <ArrowRight className="w-5 h-5" /></button>
        </section>
        <section className="relative grid place-items-center animate-pulse-subtle">
          <div className="absolute top-0 left-0 bg-white border-2 border-amber-200 rounded-2xl rounded-bl-sm px-4 py-3 text-sm font-bold text-amber-900 shadow-lg">Ready to make today a good day? ♥</div>
          <CareCircleMascot size="lg" className="w-80 h-80 sm:w-96 sm:h-96" />
        </section>
      </div>
    </main>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-yellow-50/70 to-amber-100/50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Decorative Warm Butter Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-yellow-200/40 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-300/20 rounded-full blur-2xl pointer-events-none -z-10"></div>

      <div className="max-w-xl w-full mx-auto">
        {/* Language Selector at the top right */}
        <div className="flex justify-end mb-4">
          <LanguageSelector />
        </div>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex justify-center mb-4">
            <Logo size="xl" showSubtitle={false} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-amber-950 tracking-tight">
            {t('welcomeTitle')}
          </h1>
          <p className="mt-2 text-base text-amber-900/80 max-w-md mx-auto">
            {t('welcomeSubtitle')}
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-3xl border-2 border-yellow-200 shadow-xl shadow-amber-900/5 p-6 sm:p-8">
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-3">
              {t('step1Role')}
            </label>

            {/* Role Switcher Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Elderly Card */}
              <button
                type="button"
                id="btn-select-role-elderly"
                onClick={() => setSelectedRole('elderly')}
                className={`p-5 rounded-2xl border-2 text-left transition-all relative cursor-pointer ${
                  selectedRole === 'elderly'
                    ? 'border-amber-400 bg-amber-50/80 shadow-md ring-2 ring-amber-300/60'
                    : 'border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/30'
                }`}
              >
                {selectedRole === 'elderly' && (
                  <span className="absolute top-3 right-3 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-200"></span>
                )}
                <div className="w-12 h-12 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center mb-3">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-amber-950 text-base">{t('elderlyPerson')}</h3>
                <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">
                  {t('elderlyDesc')}
                </p>
                <div className="mt-3 inline-flex items-center text-xs font-semibold text-amber-700">
                  <span>{t('elderlyBadge')}</span>
                </div>
              </button>

              {/* Caretaker Card */}
              <button
                type="button"
                id="btn-select-role-caretaker"
                onClick={() => setSelectedRole('caretaker')}
                className={`p-5 rounded-2xl border-2 text-left transition-all relative cursor-pointer ${
                  selectedRole === 'caretaker'
                    ? 'border-amber-400 bg-amber-50/80 shadow-md ring-2 ring-amber-300/60'
                    : 'border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/30'
                }`}
              >
                {selectedRole === 'caretaker' && (
                  <span className="absolute top-3 right-3 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-200"></span>
                )}
                <div className="w-12 h-12 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center mb-3">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-amber-950 text-base">{t('caretakerPerson')}</h3>
                <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">
                  {t('caretakerDesc')}
                </p>
                <div className="mt-3 inline-flex items-center space-x-1 text-xs font-semibold text-amber-700">
                  <BellRing className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t('missedDoseAlerts')}</span>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1.5">
                {selectedRole === 'elderly' ? t('yourNameElderly') : t('yourNameCaretaker')}
              </label>
              <input
                type="text"
                value={selectedRole === 'elderly' ? elderlyName : caretakerName}
                onChange={(e) =>
                  selectedRole === 'elderly'
                    ? setElderlyName(e.target.value)
                    : setCaretakerName(e.target.value)
                }
                required
                className="w-full px-4 py-2.5 rounded-xl border border-yellow-300 bg-amber-50/40 text-amber-950 font-medium focus:ring-2 focus:ring-amber-400 focus:bg-white focus:outline-none transition-all"
                placeholder={selectedRole === 'elderly' ? 'e.g. Grandpa Robert' : 'e.g. Sarah Vance'}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1.5">
                  {t('circleCodeLabel')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-amber-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={circleCode}
                    onChange={(e) => setCircleCode(e.target.value.toUpperCase())}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-yellow-300 bg-amber-50/40 text-amber-950 font-mono font-semibold uppercase tracking-wider focus:ring-2 focus:ring-amber-400 focus:bg-white focus:outline-none"
                    placeholder="CARE-7721"
                  />
                </div>
                <p className="text-[11px] text-amber-800/70 mt-1">{t('circleCodeHelper')}</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1.5">
                  {t('emergencyPhoneLabel')}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-amber-500 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-yellow-300 bg-amber-50/40 text-amber-950 font-medium focus:ring-2 focus:ring-amber-400 focus:bg-white focus:outline-none"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <p className="text-[11px] text-amber-800/70 mt-1">{t('emergencyPhoneHelper')}</p>
              </div>
            </div>

            {/* Keep logged in check */}
            <div className="pt-2 flex items-center justify-between">
              <label className="flex items-center space-x-2 text-xs font-medium text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepLoggedIn}
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                />
                <span>{t('stayLoggedIn')}</span>
              </label>
              <span className="text-[11px] text-amber-700 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('encryptedCircle')}</span>
              </span>
            </div>

            {/* Enter Button */}
            <div className="pt-4">
              <button
                type="submit"
                id="btn-login-submit"
                className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-amber-950 font-bold text-base shadow-md shadow-amber-400/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <span>
                  {t('enterAs', { name: selectedRole === 'elderly' ? elderlyName : caretakerName })}
                </span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Quick Demo Switchers */}
          <div className="mt-6 pt-6 border-t border-yellow-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-amber-800/80 font-medium">{t('quickDemo')}</span>
            <div className="flex space-x-2 w-full sm:w-auto">
              <button
                type="button"
                id="btn-quick-grandpa"
                onClick={() => handleQuickLogin('elderly')}
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-amber-100/70 hover:bg-amber-200 text-amber-900 text-xs font-semibold border border-amber-300/70 transition-colors cursor-pointer"
              >
                {t('quickGrandpa')}
              </button>
              <button
                type="button"
                id="btn-quick-caretaker"
                onClick={() => handleQuickLogin('caretaker')}
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-semibold border border-amber-400/80 transition-colors cursor-pointer"
              >
                {t('quickCaretaker')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
