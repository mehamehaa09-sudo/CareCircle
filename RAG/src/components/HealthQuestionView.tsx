import React, { useState } from 'react';
import { BookOpen, HelpCircle, Loader2, Send } from 'lucide-react';
import { ManagedCondition } from '../types';

interface Citation {
  id: number;
  source: string;
  document: string;
  page: number | null;
  section: string | null;
  chunk_id?: string;
}

interface HealthAnswer {
  answer: string;
  citations: Citation[];
  model: string;
}

const API_BASE_URL = 'http://localhost:5000';

interface HealthQuestionViewProps {
  condition: ManagedCondition;
}

export const HealthQuestionView: React.FC<HealthQuestionViewProps> = ({ condition }) => {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<HealthAnswer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setError('Enter a health question first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/health-question`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmedQuestion, condition }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to answer that question.');
      setResult(data as HealthAnswer);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to answer that question.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-200/90 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-amber-800">CareCircle health library</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-amber-950 tracking-tight mt-1">Ask a health question</h1>
            <p className="text-sm text-amber-900/80 mt-1">Get an evidence-grounded answer from the available diabetes and hypertension sources.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border-2 border-yellow-300 shadow-xs p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-amber-950">Your question</h2>
            <p className="text-xs text-amber-900/70 mt-1">Try questions about blood pressure, sodium, HbA1c, or hypoglycemia.</p>
          </div>
          <textarea
            aria-label="Health question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="e.g. What is HbA1c?"
            rows={6}
            className="w-full px-3 py-3 rounded-xl border border-yellow-300 bg-amber-50/40 text-amber-950 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none resize-y"
          />
          <button type="submit" disabled={isLoading} className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-amber-950 font-bold shadow-md shadow-amber-400/30 flex items-center justify-center gap-2 transition-colors">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {isLoading ? 'Finding an answer...' : 'Ask question'}
          </button>
          {error && <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</div>}
          <p className="text-[11px] leading-relaxed text-amber-900/70">This information is for educational purposes and does not replace professional medical advice.</p>
        </form>

        <div className="space-y-6">
          {result ? (
            <section className="bg-white rounded-3xl border-2 border-yellow-300 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-yellow-100 bg-amber-50/50 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-700" />
                <h2 className="text-lg font-bold text-amber-950">Evidence-grounded answer</h2>
              </div>
              <div className="p-5 space-y-5">
                <p className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-amber-950">{result.answer}</p>
                <div className="border-t border-yellow-100 pt-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-900 mb-3">Citations</h3>
                  <div className="space-y-2">
                    {result.citations.map((citation) => (
                      <div key={`${citation.id}-${citation.chunk_id || citation.source}`} className="rounded-xl border border-yellow-200 bg-amber-50/50 p-3 text-xs text-amber-950">
                        <div className="font-bold">[{citation.id}] {citation.document}</div>
                        <div className="mt-1 text-amber-900/80">
                          {citation.page !== null ? `Page ${citation.page}` : 'Web source'}
                          {citation.section ? ` • ${citation.section}` : ''}
                        </div>
                        <div className="mt-1 break-words text-amber-800">{citation.source}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-amber-900/70">Source model: {result.model}</p>
              </div>
            </section>
          ) : (
            <div className="bg-white rounded-3xl border-2 border-yellow-200 p-8 text-center text-amber-900/70">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-amber-500" />
              <p className="text-sm font-semibold">Your cited answer will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};