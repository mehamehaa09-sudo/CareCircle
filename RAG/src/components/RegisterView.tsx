import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, LockKeyhole, UserRound } from 'lucide-react';
import { Logo } from './Logo';
import { AuthUser, login, register } from '../utils/auth';

interface RegisterViewProps {
  onAuthenticated: (user: AuthUser) => void;
  onShowLogin: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onAuthenticated, onShowLogin }) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [diabetes, setDiabetes] = useState(false);
  const [hypertension, setHypertension] = useState(false);
  const [none, setNone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleNone = (checked: boolean) => {
    setNone(checked);
    if (checked) {
      setDiabetes(false);
      setHypertension(false);
    }
  };

  const toggleCondition = (setter: (value: boolean) => void, checked: boolean) => {
    setter(checked);
    if (checked) setNone(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !username.trim() || !password) {
      setError('Complete all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const conditions = none ? ['none'] : [
      ...(diabetes ? ['diabetes'] : []),
      ...(hypertension ? ['hypertension'] : []),
    ];
    if (!conditions.length) {
      setError('Select diabetes, high blood pressure, or None / Not sure.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await register({ name: name.trim(), username: username.trim(), password, role: 'elderly', conditions });
      const response = await login(username.trim(), password);
      onAuthenticated(response.user);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create your account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-yellow-50/70 to-amber-100/50 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full mx-auto">
        <div className="text-center mb-6"><div className="inline-flex justify-center mb-3"><Logo size="lg" showSubtitle={false} /></div><h1 className="text-3xl font-extrabold text-amber-950 tracking-tight">Create your CareCircle</h1><p className="mt-2 text-sm text-amber-900/80">Set up your private patient account.</p></div>
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border-2 border-yellow-200 shadow-xl shadow-amber-900/5 p-6 sm:p-8 space-y-4">
          <div><label htmlFor="register-name" className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1.5">Name</label><div className="relative"><UserRound className="w-4 h-4 text-amber-500 absolute left-3.5 top-3" /><input id="register-name" type="text" required value={name} onChange={(event) => setName(event.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-yellow-300 bg-amber-50/40 text-amber-950 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none" /></div></div>
          <div><label htmlFor="register-username" className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1.5">Username</label><input id="register-username" type="text" autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-yellow-300 bg-amber-50/40 text-amber-950 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label htmlFor="register-password" className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1.5">Password</label><div className="relative"><LockKeyhole className="w-4 h-4 text-amber-500 absolute left-3.5 top-3" /><input id="register-password" type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-yellow-300 bg-amber-50/40 text-amber-950 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none" /></div></div><div><label htmlFor="register-confirm-password" className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1.5">Confirm Password</label><input id="register-confirm-password" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-yellow-300 bg-amber-50/40 text-amber-950 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none" /></div></div>
          <fieldset className="space-y-2"><legend className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-2">Health conditions</legend><label className="flex items-center gap-3 rounded-xl border border-yellow-200 bg-amber-50/40 p-3 text-sm font-semibold text-amber-950"><input type="checkbox" checked={diabetes} onChange={(event) => toggleCondition(setDiabetes, event.target.checked)} className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500" />Diabetes</label><label className="flex items-center gap-3 rounded-xl border border-yellow-200 bg-amber-50/40 p-3 text-sm font-semibold text-amber-950"><input type="checkbox" checked={hypertension} onChange={(event) => toggleCondition(setHypertension, event.target.checked)} className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500" />High Blood Pressure</label><label className="flex items-center gap-3 rounded-xl border border-yellow-200 bg-amber-50/40 p-3 text-sm font-semibold text-amber-950"><input type="checkbox" checked={none} onChange={(event) => toggleNone(event.target.checked)} className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500" />None / Not sure</label></fieldset>
          {error && <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</div>}
          <button type="submit" disabled={isLoading} className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-amber-950 font-bold text-base shadow-md shadow-amber-400/30 flex items-center justify-center gap-2 transition-colors">{isLoading ? 'Creating account...' : 'Create account'}{!isLoading && <ArrowRight className="w-5 h-5" />}</button>
          <button type="button" onClick={onShowLogin} className="w-full py-2 text-sm font-bold text-amber-700 hover:text-amber-950 inline-flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" />Already have an account? Login</button>
        </form>
      </div>
    </div>
  );
};
