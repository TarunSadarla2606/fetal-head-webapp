'use client';

/**
 * Agentic reliability verdict — the system's judgement on its own output.
 *
 * Runs automatically once a real finding exists. That is deliberate: a check
 * you have to remember to click is not an abstention mechanism, it is an
 * optional extra. The cost is bounded because the agent only re-runs inference
 * when the reliability signal is genuinely borderline.
 */

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, ShieldAlert, Wrench } from 'lucide-react';
import type { EscalationResponse } from '@/lib/types';
import { escalateFinding } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Props {
  findingId: string;
}

const STYLES: Record<
  EscalationResponse['badge_color'],
  { border: string; bg: string; text: string; dot: string }
> = {
  green: {
    border: 'border-emerald-600/40',
    bg: 'bg-emerald-950/30',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
  },
  amber: {
    border: 'border-amber-600/40',
    bg: 'bg-amber-950/30',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
  },
  red: {
    border: 'border-red-600/40',
    bg: 'bg-red-950/30',
    text: 'text-red-300',
    dot: 'bg-red-400',
  },
};

const LABEL: Record<EscalationResponse['decision'], string> = {
  ACCEPT: 'ACCEPT',
  RE_CHECK: 'RE-CHECKING',
  FLAG_FOR_REVIEW: 'FLAG FOR REVIEW',
};

const ICON: Record<EscalationResponse['decision'], typeof CheckCircle2> = {
  ACCEPT: CheckCircle2,
  RE_CHECK: RefreshCw,
  FLAG_FOR_REVIEW: ShieldAlert,
};

function fmt(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2);
  return String(value);
}

export default function EscalationBadge({ findingId }: Props) {
  const [result, setResult] = useState<EscalationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await escalateFinding(findingId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reliability check failed.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [findingId]);

  useEffect(() => {
    void run();
  }, [run]);

  if (loading) {
    return (
      <div
        data-testid="escalation-loading"
        className="flex items-center gap-2 p-2.5 rounded border border-slate-700 bg-[#0f1623] text-[10px] text-slate-400"
      >
        <Loader2 className="w-3 h-3 animate-spin text-[#0D7680]" />
        Assessing measurement reliability…
      </div>
    );
  }

  if (error) {
    return (
      <p
        data-testid="escalation-error"
        className="p-2.5 rounded border border-slate-700 bg-[#0f1623] text-[10px] text-slate-500"
      >
        Reliability check unavailable — {error}
      </p>
    );
  }

  if (!result) return null;

  const s = STYLES[result.badge_color];
  const Icon = ICON[result.decision];

  return (
    <div
      data-testid="escalation-badge"
      data-decision={result.decision}
      className={cn('rounded border p-2.5 space-y-2', s.border, s.bg)}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn('w-3.5 h-3.5 shrink-0', s.text)} />
        <span className={cn('text-[11px] font-semibold tracking-wide', s.text)}>
          {LABEL[result.decision]}
        </span>
        <span className="ml-auto text-[9px] uppercase tracking-wider text-slate-500">
          Reliability check
        </span>
      </div>

      {/* The model's phrasing when available, the rule-based rationale when not.
          The verdict never depends on the model, so neither does this panel. */}
      <p data-testid="escalation-explanation" className="text-[10.5px] text-slate-300 leading-relaxed">
        {result.justification ?? result.rationale}
      </p>

      {!result.used_llm && result.justification_error && (
        <p data-testid="escalation-llm-note" className="text-[9px] text-slate-500 italic">
          Plain-language summary unavailable ({result.justification_error}); the rule-based
          reasoning is shown instead.
        </p>
      )}

      {result.tool_calls.length > 0 && (
        <div
          data-testid="escalation-tools"
          className="flex items-start gap-1.5 text-[9px] text-slate-400 leading-snug"
        >
          <Wrench className="w-2.5 h-2.5 shrink-0 mt-0.5 text-[#0D7680]" />
          <span>
            Agent invoked {result.tool_calls.length} tool
            {result.tool_calls.length === 1 ? '' : 's'}:{' '}
            {result.tool_calls.map((c) => c.tool).join(', ')}
          </span>
        </div>
      )}

      <button
        type="button"
        data-testid="escalation-evidence-toggle"
        onClick={() => setShowEvidence((v) => !v)}
        className="text-[9px] text-slate-500 hover:text-slate-300 underline underline-offset-2"
      >
        {showEvidence ? 'Hide' : 'Show'} evidence and thresholds
      </button>

      {showEvidence && (
        <div data-testid="escalation-evidence" className="space-y-2 pt-0.5">
          <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px]">
            {Object.entries(result.signals).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <dt className="text-slate-500">{k}</dt>
                <dd className="text-slate-300 font-mono">{fmt(v)}</dd>
              </div>
            ))}
          </dl>

          {result.tool_calls.map((call, i) => (
            <div key={i} className="rounded border border-slate-700/60 p-1.5 space-y-1">
              <p className="text-[9px] font-semibold text-slate-300">{call.tool}</p>
              <p className="text-[9px] text-slate-500 italic leading-snug">{call.reason}</p>
              {call.error ? (
                <p className="text-[9px] text-red-400 font-mono">{call.error}</p>
              ) : (
                <dl className="grid grid-cols-2 gap-x-3 text-[9px]">
                  {Object.entries(call.result).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2">
                      <dt className="text-slate-500">{k}</dt>
                      <dd className="text-slate-300 font-mono">{fmt(v)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          ))}

          <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px] pt-0.5 border-t border-slate-700/60">
            {Object.entries(result.thresholds).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <dt className="text-slate-500">{k}</dt>
                <dd className="text-slate-400 font-mono">{fmt(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <p className="text-[8.5px] text-slate-600 leading-tight pt-0.5 border-t border-slate-700/40">
        {result.disclaimer}
      </p>
    </div>
  );
}
