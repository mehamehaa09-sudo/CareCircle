import React, { useState } from 'react';
import { FileText, HelpCircle, Mic, ScanLine } from 'lucide-react';

interface HealthToolsTabsProps {
  onOpenQuestion: () => void;
  onOpenPrescription: () => void;
}

type HealthToolTab = 'question' | 'prescription';

export const HealthToolsTabs: React.FC<HealthToolsTabsProps> = ({
  onOpenQuestion,
  onOpenPrescription,
}) => {
  const [activeTab, setActiveTab] = useState<HealthToolTab>('question');

  return (
    <section className="mb-6 overflow-hidden rounded-3xl border-2 border-yellow-200 bg-white shadow-sm">
      <div className="flex border-b border-yellow-200 bg-amber-50/70 p-2" role="tablist" aria-label="CareCircle health tools">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'question'}
          onClick={() => setActiveTab('question')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold transition-colors ${
            activeTab === 'question'
              ? 'bg-amber-500 text-amber-950 shadow-sm'
              : 'text-amber-900 hover:bg-amber-100'
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          Ask a question
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'prescription'}
          onClick={() => setActiveTab('prescription')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold transition-colors ${
            activeTab === 'prescription'
              ? 'bg-amber-500 text-amber-950 shadow-sm'
              : 'text-amber-900 hover:bg-amber-100'
          }`}
        >
          <FileText className="h-4 w-4" />
          Prescription
        </button>
      </div>

      <div className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
        {activeTab === 'question' ? (
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-amber-950">Ask CareCircle</h2>
              <p className="mt-1 text-sm text-amber-900/70">Ask your health question through Poppy and hear the answer aloud.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <ScanLine className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-amber-950">Prescription tools</h2>
              <p className="mt-1 text-sm text-amber-900/70">Add a prescription or scan one using the existing medication workflow.</p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={activeTab === 'question' ? onOpenQuestion : onOpenPrescription}
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-amber-950 shadow-sm transition-colors hover:bg-amber-600 sm:w-auto"
        >
          {activeTab === 'question' ? <Mic className="h-4 w-4" /> : <ScanLine className="h-4 w-4" />}
          {activeTab === 'question' ? 'Open voice assistant' : 'Open prescription'}
        </button>
      </div>
    </section>
  );
};
