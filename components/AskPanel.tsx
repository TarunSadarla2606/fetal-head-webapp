'use client';

import { useState } from 'react';
import { Send, Loader2, AlertTriangle, BookOpen, ShieldAlert, ChevronDown } from 'lucide-react';
import { askAboutFinding } from '@/lib/api';
import type { AskResponse } from '@/lib/types';
import { cn } from '@/lib/utils';

const SUGGESTIONS = [
  'Is this HC normal for the gestational age?',
  'How reliable is this measurement?',
  'How was the gestational age calculated?',
  'What does the Dice score mean?',
];

/**
 * One retrieved reference chunk, collapsed by default.
 *
 * The chunk text is shown verbatim because the point of the feature is that
 * an answer can be checked against its evidence — a citation label alone
 * would just be a claim about sourcing.
 */
function ChunkCard({ chunk, cited }: { chunk: AskResponse['chunks'][number]; cited: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      data-testid="ask-chunk"
      data-cited={cited}
      className={cn(
        'rounded border text-left',
        cited ? 'border-[#0D7680]/50 bg-[#0D7680]/5' : 'border-slate-800 bg-[#0b0f1a]',
      )}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-2 px-2.5 py-2 text-left"
      >
        <ChevronDown
          className={cn('w-3 h-3 mt-0.5 shrink-0 text-slate-500 transition-transform',
            open && 'rotate-180')}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] text-slate-300 leading-snug">{chunk.heading}</span>
          <span className="block text-[9px] text-slate-500 font-mono mt-0.5">
            {chunk.source_file} · score {chunk.score.toFixed(3)}
            {cited && <span className="text-[#5cd5dc]"> · cited</span>}
            {chunk.provisional && <span className="text-amber-400"> · provisional</span>}
          </span>
        </span>
      </button>
      {open && (
        <div className="px-2.5 pb-2.5 space-y-1.5">
          {chunk.source_note && (
            <p className="text-[9px] text-slate-500 italic">{chunk.source_note}</p>
          )}
          <p className="text-[10px] text-slate-400 leading-relaxed whitespace-pre-line">
            {chunk.text}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * "Ask about this result" — retrieval-grounded Q&A.
 *
 * Every answer arrives with the reference chunks it was grounded in, so the
 * user can read the evidence rather than trusting the prose.
 */
export default function AskPanel({ findingId }: { findingId: string }) {
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || status === 'loading') return;
    setStatus('loading');
    setError(null);
    setResult(null);
    try {
      setResult(await askAboutFinding(findingId, trimmed));
      setStatus('ok');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
      setStatus('error');
    }
  };

  return (
    <div data-testid="ask-panel" className="flex-1 overflow-auto p-5">
      <div className="max-w-3xl mx-auto space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#0D7680]" />
            Ask about this result
          </h2>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Answers are generated only from this system&apos;s curated reference material plus
            this measurement&apos;s numbers, and cite the sections they use. Questions outside
            that material are declined rather than answered from memory.
          </p>
        </div>

        <form
          onSubmit={e => { e.preventDefault(); submit(question); }}
          className="flex gap-2"
        >
          <input
            data-testid="ask-input"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="e.g. How reliable is this measurement?"
            className="flex-1 bg-[#0b0f1a] border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#0D7680]"
          />
          <button
            type="submit"
            data-testid="ask-submit"
            disabled={!question.trim() || status === 'loading'}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#0D7680] hover:bg-[#0a5f67] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            {status === 'loading'
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Asking…</>
              : <><Send className="w-3.5 h-3.5" /> Ask</>}
          </button>
        </form>

        {status === 'idle' && (
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                data-testid="ask-suggestion"
                onClick={() => { setQuestion(s); submit(s); }}
                className="px-2 py-1 text-[10px] text-slate-400 border border-slate-700 rounded hover:text-slate-200 hover:border-slate-500 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {status === 'error' && (
          <div
            data-testid="ask-error"
            className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-900/60 rounded text-red-400 text-xs"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Could not answer</p>
              <p className="mt-1 text-red-400/80 break-words">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            {!result.grounded && (
              <div
                data-testid="ask-ungrounded-banner"
                className="flex items-start gap-2 p-2.5 rounded border border-slate-700 bg-slate-800/40 text-slate-300 text-[11px]"
              >
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" />
                <span>
                  No reference in the knowledge base covers this question, so it was declined
                  rather than answered from the model&apos;s own knowledge.
                </span>
              </div>
            )}

            {result.any_provisional && (
              <div
                data-testid="ask-provisional-banner"
                className="flex items-start gap-2 p-2.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-200 text-[11px]"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  This answer rests on reference sections still marked provisional — their
                  text has not been verified against the primary guideline.
                </span>
              </div>
            )}

            <div
              data-testid="ask-answer"
              className="p-3 rounded border border-slate-700 bg-[#0f1623] text-[12px] text-slate-200 leading-relaxed whitespace-pre-line"
            >
              {result.answer}
            </div>

            {!result.used_llm && result.grounded && (
              <p data-testid="ask-fallback-note" className="text-[10px] text-amber-400/80 italic">
                Generated answer unavailable — the retrieved reference sections are shown
                below and can be read directly.
              </p>
            )}

            {result.chunks.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                  Reference material supplied to the model ({result.chunks.length})
                </p>
                {result.chunks.map(c => (
                  <ChunkCard
                    key={c.citation}
                    chunk={c}
                    cited={result.citations.includes(c.citation)}
                  />
                ))}
              </div>
            )}

            <p className="text-[10px] text-slate-600 leading-snug border-t border-slate-800 pt-2">
              {result.disclaimer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
