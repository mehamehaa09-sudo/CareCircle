import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock, Loader2, Send } from 'lucide-react';

interface CheckinResponse {
  alert_triggered: boolean;
  report: string | null;
}

interface BackendAlert {
  user_id: string;
  flag_type: string;
  handoff_report: string;
  created_at: string;
  resolved: boolean;
}

const API_BASE_URL = 'http://localhost:5000';

export const HealthCheckinView: React.FC = () => {
  const [userId, setUserId] = useState('user-elderly-1');
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [mood, setMood] = useState('');
  const [medsTaken, setMedsTaken] = useState(false);
  const [alerts, setAlerts] = useState<BackendAlert[]>([]);
  const [result, setResult] = useState<CheckinResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = async () => {
    setIsLoadingAlerts(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts/${encodeURIComponent(userId)}`);
      if (!response.ok) throw new Error('Unable to load past alerts.');
      const data: BackendAlert[] = await response.json();
      setAlerts(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load past alerts.');
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  useEffect(() => {
    void loadAlerts();
  }, []);

  const submitCheckin = async () => {
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          bp_systolic: Number(bpSystolic),
          bp_diastolic: Number(bpDiastolic),
          mood,
          meds_taken: medsTaken,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to submit check-in.');

      setResult(data as CheckinResponse);
      await loadAlerts();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to submit check-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitCheckin();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-200/90 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center flex-shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-amber-800">CareCircle health check-in</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-amber-950 tracking-tight mt-1">Share how you are feeling</h1>
            <p className="text-sm text-amber-900/80 mt-1">Your check-in is compared with your personal baseline and sent through the caregiver alert pipeline.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border-2 border-yellow-300 shadow-xs p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-amber-950">New check-in</h2>
            <p className="text-xs text-amber-900/70 mt-1">All readings are used only for this local CareCircle demo.</p>
          </div>

          <div>
            <label htmlFor="checkin-user-id" className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1.5">User ID</label>
            <input id="checkin-user-id" type="text" required value={userId} onChange={(event) => setUserId(event.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-yellow-300 bg-amber-50/40 text-amber-950 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="checkin-systolic" className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1.5">BP systolic</label>
              <input id="checkin-systolic" type="number" min="1" required value={bpSystolic} onChange={(event) => setBpSystolic(event.target.value)} placeholder="145" className="w-full px-3 py-2.5 rounded-xl border border-yellow-300 bg-amber-50/40 text-amber-950 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none" />
            </div>
            <div>
              <label htmlFor="checkin-diastolic" className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1.5">BP diastolic</label>
              <input id="checkin-diastolic" type="number" min="1" required value={bpDiastolic} onChange={(event) => setBpDiastolic(event.target.value)} placeholder="88" className="w-full px-3 py-2.5 rounded-xl border border-yellow-300 bg-amber-50/40 text-amber-950 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none" />
            </div>
          </div>

          <div>
            <label htmlFor="checkin-mood" className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1.5">Mood</label>
            <input id="checkin-mood" type="text" required value={mood} onChange={(event) => setMood(event.target.value)} placeholder="e.g. feeling well, tired, dizzy" className="w-full px-3 py-2.5 rounded-xl border border-yellow-300 bg-amber-50/40 text-amber-950 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none" />
          </div>

          <label className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50/70 border border-yellow-200 text-sm font-semibold text-amber-950 cursor-pointer">
            <input type="checkbox" checked={medsTaken} onChange={(event) => setMedsTaken(event.target.checked)} className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500" />
            Medication taken today
          </label>

          <button type="button" onClick={() => void submitCheckin()} disabled={isSubmitting} className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-amber-950 font-bold shadow-md shadow-amber-400/30 flex items-center justify-center gap-2 transition-colors">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {isSubmitting ? 'Checking...' : 'Submit check-in'}
          </button>

          {error && <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</div>}
        </form>

        <div className="space-y-6">
          {result && (
            <div className={`rounded-3xl border-2 p-5 shadow-sm ${result.alert_triggered ? 'border-red-300 bg-red-50' : 'border-emerald-300 bg-emerald-50'}`}>
              <div className="flex items-center gap-3">
                {result.alert_triggered ? <AlertTriangle className="w-6 h-6 text-red-600" /> : <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
                <h2 className={`text-lg font-bold ${result.alert_triggered ? 'text-red-950' : 'text-emerald-950'}`}>
                  {result.alert_triggered ? 'Caregiver alert triggered' : 'No issues detected'}
                </h2>
              </div>
              {result.alert_triggered && result.report && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-red-950">{result.report}</p>}
            </div>
          )}

          <section className="bg-white rounded-3xl border-2 border-yellow-300 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-yellow-100 bg-amber-50/50">
              <h2 className="text-lg font-bold text-amber-950">Past backend alerts</h2>
              <p className="text-xs text-amber-900/70 mt-1">Most recent alerts for {userId}</p>
            </div>
            <div className="p-5 space-y-3">
              {isLoadingAlerts ? (
                <div className="flex items-center gap-2 text-sm text-amber-800"><Loader2 className="w-4 h-4 animate-spin" /> Loading alerts...</div>
              ) : alerts.length === 0 ? (
                <p className="text-sm text-amber-900/70">No saved alerts yet.</p>
              ) : (
                alerts.map((alert) => (
                  <article key={`${alert.created_at}-${alert.flag_type}`} className="rounded-2xl border border-yellow-200 bg-amber-50/40 p-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-red-800"><AlertTriangle className="w-3.5 h-3.5" /> {alert.flag_type}</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800"><Clock className="w-3.5 h-3.5" /> {new Date(alert.created_at).toLocaleString()}</span>
                    </div>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-amber-950">{alert.handoff_report}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};