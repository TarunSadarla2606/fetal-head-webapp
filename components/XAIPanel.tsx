'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, Brain, Activity, ShieldAlert } from 'lucide-react';
import { gradcamUrl, uncertaintyUrl, getOodReport } from '@/lib/api';
import type { OodReport } from '@/lib/types';

interface Props {
  findingId: string;
}

function ImageSection({
  title,
  description,
  src,
  icon,
}: {
  title: string;
  description: string;
  src: string;
  icon: React.ReactNode;
}) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  // Re-mount on src change so the spinner resets when the finding_id changes
  useEffect(() => { setStatus('loading'); }, [src]);

  return (
    <div className="flex flex-col bg-[#0b0f1a] border border-slate-800 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#0f1623] border-b border-slate-800">
        {icon}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-slate-200 leading-tight">{title}</p>
          <p className="text-[9px] text-slate-500 leading-tight">{description}</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-2 min-h-[180px] bg-black/20">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-[#0D7680]" />
            <span className="text-[10px]">Computing…</span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-2 text-red-400 text-center px-3">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-[10px]">Failed to load. The finding may have expired.</span>
          </div>
        )}
        {/* Always rendered (hidden until loaded) so onLoad fires */}
        <img
          src={src}
          alt={title}
          className={`max-w-full max-h-full block ${status === 'ok' ? '' : 'hidden'}`}
          onLoad={() => setStatus('ok')}
          onError={() => setStatus('error')}
        />
      </div>
    </div>
  );
}

function OodSection({ findingId }: { findingId: string }) {
  const [report, setReport] = useState<OodReport | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setReport(null);
    getOodReport(findingId).then(r => {
      if (cancelled) return;
      if (r) { setReport(r); setStatus('ok'); }
      else { setStatus('error'); }
    });
    return () => { cancelled = true; };
  }, [findingId]);

  const flagColor = !report
    ? 'text-slate-400'
    : report.ood_flag
      ? 'text-amber-400'
      : 'text-emerald-400';

  return (
    <div className="flex flex-col bg-[#0b0f1a] border border-slate-800 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#0f1623] border-b border-slate-800">
        <ShieldAlert className="w-4 h-4 text-rose-400" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-slate-200 leading-tight">OOD Reasoning</p>
          <p className="text-[9px] text-slate-500 leading-tight">Out-of-distribution checks and image stats</p>
        </div>
      </div>
      <div className="flex-1 p-3 overflow-y-auto text-xs space-y-3 min-h-[180px]">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-2 text-slate-500 py-6">
            <Loader2 className="w-5 h-5 animate-spin text-[#0D7680]" />
            <span className="text-[10px]">Analysing…</span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-2 text-red-400 py-6 text-center">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-[10px]">Could not fetch OOD report.</span>
          </div>
        )}
        {report && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Status</span>
              <span data-testid="ood-status" className={`text-[10px] font-semibold uppercase tracking-wider ${flagColor}`}>
                {report.ood_flag ? 'OOD detected' : 'In distribution'}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>OOD score</span>
                <span className="text-slate-300">{Math.round(report.score * 100)}%</span>
              </div>
              <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.round(report.score * 100)}%`,
                    backgroundColor: report.ood_flag ? '#f59e0b' : '#10b981',
                  }}
                />
              </div>
            </div>
            {report.reasons.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Reasons</p>
                <ul className="space-y-1.5">
                  {report.reasons.map((r, i) => (
                    <li key={i} className="text-[11px] leading-snug text-slate-300">
                      <span className="text-amber-400/80 font-mono text-[10px]">{r.category}</span>
                      <span className="text-slate-400"> · </span>
                      <span>{r.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.reasons.length === 0 && (
              <p className="text-[11px] text-slate-500 italic">No OOD signals detected. Image looks like a typical fetal-head ultrasound.</p>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Image stats</p>
              <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-slate-400">
                {Object.entries(report.stats).map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span>{k}</span>
                    <span className="text-slate-300 font-mono">{v.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function XAIPanel({ findingId }: Props) {
  return (
    <div data-testid="xai-panel" className="flex-1 overflow-auto p-3 grid grid-cols-1 md:grid-cols-3 gap-3 min-h-0 bg-[#0b0f1a]">
      <ImageSection
        title="GradCAM++"
        description="Regions that drove the segmentation"
        src={gradcamUrl(findingId)}
        icon={<Brain className="w-4 h-4 text-[#0D7680]" />}
      />
      <ImageSection
        title="Uncertainty"
        description="Pixel-wise prediction variance (MC sampling)"
        src={uncertaintyUrl(findingId)}
        icon={<Activity className="w-4 h-4 text-amber-400" />}
      />
      <OodSection findingId={findingId} />
    </div>
  );
}
