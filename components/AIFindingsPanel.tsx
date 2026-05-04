'use client';

import type { Study, SavedReport, ModelVariant } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Brain, TrendingUp, AlertTriangle, Save, CheckCircle2, FlaskConical } from 'lucide-react';

interface Props {
  study: Study;
  model: ModelVariant;
  onSaveReport: (r: Omit<SavedReport, 'id' | 'analyzedAt'>) => void;
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#0b0f1a] rounded-lg p-3 space-y-0.5 border border-slate-800/60">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-slate-100 leading-tight">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function ReliabilityBar({ value, label, color }: { value: number; label: string; color: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">Reliability</span>
        <span style={{ color }} className="font-semibold">{label} ({pct}%)</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return ''; }
}

export default function AIFindingsPanel({ study, model, onSaveReport }: Props) {
  const f = study.findings;
  const isSynthetic = study.isSynthetic === true;

  return (
    <aside className="w-72 shrink-0 bg-[#0f1623] border-l border-slate-800/80 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800/60">
        <Brain className="w-4 h-4 text-[#0D7680]" />
        <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">AI Findings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div>
          <p className="text-xs text-slate-500">Study</p>
          <p className="text-sm font-semibold text-slate-200">{study.patientName}</p>
          <p className="text-xs text-slate-500">{study.studyDate}</p>
        </div>

        {study.status === 'pending' && !f && (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-slate-600">
            <TrendingUp className="w-8 h-8 opacity-30" />
            <p className="text-xs leading-relaxed">
              Press <span className="text-[#0D7680] font-medium">Run AI</span> to measure fetal head circumference.
            </p>
          </div>
        )}

        {study.status === 'analyzing' && (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="w-9 h-9 border-2 border-[#0D7680] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Running biometry…</p>
          </div>
        )}

        {study.status === 'error' && (
          <div className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-900/60 rounded text-red-400 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Analysis failed</p>
              <p className="mt-1 text-red-400/80 break-words" data-testid="analysis-error-message">
                {study.errorMessage ?? 'Check backend connectivity and retry.'}
              </p>
              {(model === 'phase2' || model === 'phase4b') && (
                <p className="mt-2 text-amber-400/80 italic">
                  Hint: {model} is a temporal (cine-loop) model and expects 16-frame input.
                  Single-frame demo subjects only work with phase0 and phase4a.
                </p>
              )}
            </div>
          </div>
        )}

        {f && study.status === 'done' && !isSynthetic && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 text-[11px] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>AI Analysis Complete</span>
            {study.analyzedAt && (
              <span className="ml-auto text-emerald-500/70 font-normal">
                {formatTime(study.analyzedAt)}
              </span>
            )}
          </div>
        )}

        {f && study.status === 'done' && isSynthetic && (
          <div
            data-testid="synthetic-fallback-banner"
            className="flex items-start gap-2 p-2.5 bg-amber-500/10 border border-amber-500/40 rounded text-amber-300 text-[11px]"
          >
            <FlaskConical className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-semibold uppercase tracking-wider">Synthetic Demo Result</p>
              <p className="mt-0.5 text-amber-300/80 leading-snug">
                Backend inference unavailable. Values below are pre-baked demo numbers, not from the model.
              </p>
              {study.analyzedAt && (
                <p className="mt-1 text-amber-400/60 font-normal">{formatTime(study.analyzedAt)}</p>
              )}
            </div>
          </div>
        )}

        {f && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Metric
                label="HC"
                value={f.hc_mm != null ? `${f.hc_mm.toFixed(1)} mm` : 'N/A'}
                sub={f.hc_std_mm > 0 ? `± ${f.hc_std_mm.toFixed(1)} mm` : undefined}
              />
              <Metric
                label="Gest. Age"
                value={f.ga_str ?? 'N/A'}
                sub={f.trimester !== 'Unknown' ? f.trimester : undefined}
              />
            </div>

            <ReliabilityBar value={f.reliability} label={f.confidence_label} color={f.confidence_color} />

            {f.ood_flag && (
              <div className="flex items-start gap-2 p-2.5 bg-yellow-950/40 border border-yellow-900/60 rounded text-yellow-400 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Out-of-distribution image</p>
                  {f.ood_reasons.length > 0 && (
                    <ul className="mt-1 space-y-0.5 list-disc list-inside">
                      {f.ood_reasons.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            )}

            <div className={cn('text-[10px] text-slate-600 flex justify-between')}>
              <span>Model: {model}{isSynthetic ? ' · synthetic' : ''}</span>
              <span>{f.elapsed_ms.toFixed(0)} ms</span>
            </div>

            {f.hc_mm != null && !isSynthetic && (
              <button
                onClick={() =>
                  onSaveReport({
                    patientName: study.patientName,
                    studyDate: study.studyDate,
                    hcMm: f.hc_mm ?? 0,
                    gaStr: f.ga_str ?? '',
                    gaWeeks: f.ga_weeks ?? 0,
                    trimester: f.trimester,
                    reliability: f.reliability,
                    confidenceLabel: f.confidence_label,
                    model,
                  })
                }
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold bg-[#0D7680] hover:bg-[#0a5f67] text-white rounded transition-colors"
              >
                <Save className="w-3.5 h-3.5" /> Save to Reports
              </button>
            )}
          </>
        )}
      </div>

      <div className="px-3 py-2 border-t border-slate-800/60 text-[10px] text-slate-600">
        For demonstration purposes only
      </div>
    </aside>
  );
}
