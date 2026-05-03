'use client';

import type { Study, SavedReport, ModelVariant } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Brain, TrendingUp, AlertTriangle, Save } from 'lucide-react';

interface Props {
  study: Study;
  model: ModelVariant;
  onSaveReport: (r: Omit<SavedReport, 'id' | 'analyzedAt'>) => void;
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-slate-950 rounded p-3 space-y-0.5">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-slate-100 leading-tight">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function ReliabilityBar({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">Reliability</span>
        <span style={{ color }} className="font-semibold">
          {label} ({pct}%)
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function AIFindingsPanel({ study, model, onSaveReport }: Props) {
  const f = study.findings;

  return (
    <aside className="w-72 shrink-0 bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800">
        <Brain className="w-4 h-4 text-[#0D7680]" />
        <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          AI Findings
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div>
          <p className="text-xs text-slate-500">Patient</p>
          <p className="text-sm font-semibold text-slate-200">{study.patientName}</p>
          <p className="text-xs text-slate-500">{study.studyDate}</p>
        </div>

        {study.status === 'pending' && !f && (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-slate-600">
            <TrendingUp className="w-8 h-8 opacity-30" />
            <p className="text-xs leading-relaxed">
              Upload an image and press{' '}
              <span className="text-[#0D7680]">Run AI</span> to see findings.
            </p>
          </div>
        )}

        {study.status === 'analyzing' && (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="w-8 h-8 border-2 border-[#0D7680] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500">Running inference…</p>
          </div>
        )}

        {study.status === 'error' && (
          <div className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-900/60 rounded text-red-400 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Analysis failed. Check backend connectivity and retry.</p>
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

            <ReliabilityBar
              value={f.reliability}
              label={f.confidence_label}
              color={f.confidence_color}
            />

            {f.ood_flag && (
              <div className="flex items-start gap-2 p-2.5 bg-yellow-950/40 border border-yellow-900/60 rounded text-yellow-400 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Out-of-distribution image</p>
                  {f.ood_reasons.length > 0 && (
                    <ul className="mt-1 space-y-0.5 list-disc list-inside">
                      {f.ood_reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            <div className={cn('text-[10px] text-slate-600 flex justify-between')}>
              <span>Model: {model}</span>
              <span>{f.elapsed_ms.toFixed(0)} ms</span>
            </div>

            {f.hc_mm != null && (
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
                <Save className="w-3.5 h-3.5" /> Save Report
              </button>
            )}
          </>
        )}
      </div>

      <div className="px-3 py-2 border-t border-slate-800 text-[10px] text-yellow-700">
        ⚠ Research Use Only — not for clinical decisions
      </div>
    </aside>
  );
}
