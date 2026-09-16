import React, { useState } from 'react';
import { ArrowRight, LockKeyhole, UserRound } from 'lucide-react';
import { Logo } from './Logo';
import { AuthUser, login } from '../utils/auth';

interface LoginViewProps {
  onAuthenticated: (user: AuthUser) => void;
  onShowRegister: () => void;
  initialError?: string | null;
}

export const LoginView: React.FC<LoginViewProps> = ({ onAuthenticated, onShowRegister, initialError }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(initialError || null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError('Enter your username and password.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await login(username.trim(), password);
      onAuthenticated(response.user);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to log in.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-yellow-50/70 to-amber-100/50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex justify-center mb-4"><Logo size="xl" showSubtitle={false} /></div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-amber-950 tracking-tight">Welcome back</h1>
          <p className="mt-2 text-base text-amber-900/80">Sign in to your private CareCircle.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border-2 border-yellow-200 shadow-xl shadow-amber-900/5 p-6 sm:p-8 space-y-4">
          <div>
            <label htmlFor="login-username" className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1.5">Username</label>
            <div className="relative"><UserRound className="w-4 h-4 text-amber-500 absolute left-3.5 top-3" /><input id="login-username" type="text" autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-yellow-300 bg-amber-50/40 text-amber-950 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none" /></div>
          </div>
          <div>
            <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1.5">Password</label>
            <div className="relative"><LockKeyhole className="w-4 h-4 text-amber-500 absolute left-3.5 top-3" /><input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-yellow-300 bg-amber-50/40 text-amber-950 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none" /></div>
          </div>
          {error && <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</div>}
          <button type="submit" disabled={isLoading} className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-amber-950 font-bold text-base shadow-md shadow-amber-400/30 flex items-center justify-center gap-2 transition-colors">
            {isLoading ? 'Signing in...' : 'Login'} {!isLoading && <ArrowRight className="w-5 h-5" />}
          </button>
          <p className="text-center text-sm text-amber-900/80">Don't have an account? <button type="button" onClick={onShowRegister} className="font-bold text-amber-700 hover:text-amber-950 underline">Create one</button></p>
        </form>
      </div>
    </div>
  );
};
