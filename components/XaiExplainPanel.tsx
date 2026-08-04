'use client';

/**
 * Interrogate the saliency map.
 *
 * A heatmap says where the model looked; the next question is always whether
 * that is an anatomical reason or an artifact. The backend answers from the
 * measured attribution — how concentrated the focus is, and how much of it
 * lands on the predicted skull versus off in the background — so this panel
 * shows those measurements alongside the prose. An explanation of a picture
 * that you cannot check against numbers is just confident narration.
 */

import { useState } from 'react';
import { AlertTriangle, Loader2, MessageCircleQuestion, Send } from 'lucide-react';
import type { XaiAskResponse } from '@/lib/types';
import { askAboutXai } from '@/lib/api';

interface Props {
  findingId: string;
}

const SUGGESTIONS = [
  'Why did the model focus where it did?',
  'Does this look anatomically plausible or like an artifact?',
  'Is the focus concentrated or spread out?',
];

function pct(v: number | null | undefined): string {
  return v === null || v === undefined ? '—' : `${v.toFixed(1)}%`;
}

/** The three numbers that answer "real reason or artifact?" — shown as a bar. */
function SkullDistribution({ summary }: { summary: XaiAskResponse['summary'] }) {
  if (!summary.mask_available) {
    return (
      <p className="text-[9px] text-slate-500 italic">
        No segmentation mask was available, so attribution could not be related to the
        predicted skull.
      </p>
    );
  }
  const bands = [
    { label: 'On skull boundary', value: summary.on_boundary_pct ?? 0, color: 'bg-emerald-500' },
    { label: 'Inside head', value: summary.inside_head_pct ?? 0, color: 'bg-sky-500' },
    { label: 'Outside head', value: summary.outside_head_pct ?? 0, color: 'bg-amber-500' },
  ];
  return (
    <div className="space-y-1" data-testid="xai-skull-distribution">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
        Where the attribution falls
      </p>
      <div className="flex h-2 rounded overflow-hidden bg-slate-800">
        {bands.map((b) => (
          <div key={b.label} className={b.color} style={{ width: `${b.value}%` }} />
        ))}
      </div>
      <dl className="grid grid-cols-3 gap-1 text-[9px]">
        {bands.map((b) => (
          <div key={b.label} className="flex flex-col">
            <dt className="text-slate-500 leading-tight">{b.label}</dt>
            <dd className="text-slate-300 font-mono">{pct(b.value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function XaiExplainPanel({ findingId }: Props) {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<XaiAskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      setResult(await askAboutXai(findingId, trimmed));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not reach the explanation service. The finding may have expired.',
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      data-testid="xai-explain-panel"
      className="rounded border border-slate-700 bg-[#0f1623] p-3 space-y-2"
    >
      <div className="flex items-center gap-1.5">
        <MessageCircleQuestion className="w-3.5 h-3.5 text-[#0D7680]" />
        <h3 className="text-[11px] font-semibold text-slate-200">Ask about this attribution</h3>
      </div>

      <div className="flex gap-1.5">
        <input
          data-testid="xai-ask-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !loading) void ask(question);
          }}
          placeholder="Why did the model focus there?"
          className="flex-1 bg-[#0b0f1a] border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#0D7680]"
        />
        <button
          type="button"
          data-testid="xai-ask-submit"
          disabled={loading || question.trim().length === 0}
          onClick={() => void ask(question)}
          className="px-2 rounded bg-[#0D7680] text-white disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Ask"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            data-testid="xai-ask-suggestion"
            onClick={() => {
              setQuestion(s);
              void ask(s);
            }}
            className="text-[9px] px-1.5 py-0.5 rounded border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600"
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <p data-testid="xai-ask-error" className="text-[10px] text-red-400">
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-2 pt-1">
          {!result.grounded && (
            <div
              data-testid="xai-ungrounded-banner"
              className="flex items-start gap-1.5 p-1.5 rounded border border-amber-600/40 bg-amber-950/30"
            >
              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-amber-400" />
              <span className="text-[9px] text-amber-200/90 leading-snug">
                No attribution could be computed for this finding, so no explanation was
                generated.
              </span>
            </div>
          )}

          <p
            data-testid="xai-ask-answer"
            className="text-[11px] text-slate-200 leading-relaxed whitespace-pre-line"
          >
            {result.answer}
          </p>

          {!result.used_llm && result.llm_error && (
            <p data-testid="xai-ask-llm-error" className="text-[9px] text-amber-400/80 italic">
              Reason: {result.llm_error}
            </p>
          )}

          {result.grounded && (
            <div
              data-testid="xai-attribution-summary"
              className="space-y-2 pt-1.5 border-t border-slate-700/60"
            >
              <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                Measurements this answer is grounded in
              </p>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px]">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Focus</dt>
                  <dd className="text-slate-300">{result.summary.concentration_label ?? '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Peak region</dt>
                  <dd className="text-slate-300">{result.summary.peak_region ?? '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Area above 50% peak</dt>
                  <dd className="text-slate-300 font-mono">
                    {pct(result.summary.focused_area_pct)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Method</dt>
                  <dd className="text-slate-300">{result.summary.method ?? '—'}</dd>
                </div>
              </dl>
              <SkullDistribution summary={result.summary} />
            </div>
          )}

          <p className="text-[8.5px] text-slate-600 leading-tight pt-0.5 border-t border-slate-700/40">
            {result.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
