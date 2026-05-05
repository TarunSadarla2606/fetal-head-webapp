'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Loader2, CheckCircle2, AlertTriangle, Image as ImageIcon, Sparkles, Save } from 'lucide-react';
import type { Study, CompareResult } from '@/lib/types';
import { cn } from '@/lib/utils';
import { gradcamUrl } from '@/lib/api';

const LABEL: Record<string, string> = {
  phase0:  'Standard · Single Frame',
  phase2:  'Standard · Cine Loop',
  phase4a: 'Express · Single Frame',
  phase4b: 'Express · Cine Loop',
};

type CellMode = 'overlay' | 'gradcam';

function CompareCell({ study, result }: { study: Study; result: CompareResult }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<CellMode>('overlay');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || result.status !== 'done' || mode !== 'overlay') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const src = result.findings?.overlay_b64
      ? `data:image/png;base64,${result.findings.overlay_b64}`
      : study.imageDataUrl ?? null;
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
    };
    img.src = src;
  }, [result.status, result.findings?.overlay_b64, study.imageDataUrl, mode]);

  const f = result.findings;
  const hasFindingId = !!f?.finding_id;

  return (
    <div className="flex flex-col bg-[#0b0f1a] border border-slate-800 rounded-lg overflow-hidden min-h-0">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#0f1623] border-b border-slate-800 shrink-0">
        <span className="text-[11px] font-semibold text-slate-300 truncate">{LABEL[result.variant]}</span>

        {/* Overlay ↔ Grad-CAM toggle (only when finding_id is available) */}
        {result.status === 'done' && hasFindingId && (
          <div className="flex items-center bg-slate-800 rounded p-0.5 ml-1">
            <button
              onClick={() => setMode('overlay')}
              title="Predicted skull boundary overlay"
              className={cn(
                'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors',
                mode === 'overlay' ? 'bg-[#0D7680] text-white' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <ImageIcon className="w-3 h-3" /> Overlay
            </button>
            <button
              onClick={() => setMode('gradcam')}
              title="Grad-CAM++ explanation — boundary attention heatmap"
              className={cn(
                'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors',
                mode === 'gradcam' ? 'bg-[#0D7680] text-white' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Sparkles className="w-3 h-3" /> Grad-CAM
            </button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-1">
          {result.status === 'analyzing' && (
            <Loader2 className="w-3.5 h-3.5 text-[#0D7680] animate-spin" />
          )}
          {result.status === 'done' && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              {f?.elapsed_ms.toFixed(0)} ms
            </span>
          )}
          {result.status === 'error' && (
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-2 overflow-hidden min-h-0">
        {result.status === 'analyzing' && (
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <div className="w-7 h-7 border-2 border-[#0D7680] border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px]">Running inference…</span>
          </div>
        )}
        {result.status === 'error' && (
          <div className="text-center text-xs text-red-400 p-3">
            <AlertTriangle className="w-5 h-5 mx-auto mb-2 opacity-70" />
            {result.error}
          </div>
        )}
        {result.status === 'done' && mode === 'overlay' && (
          <canvas ref={canvasRef} className="max-w-full max-h-full block" />
        )}
        {result.status === 'done' && mode === 'gradcam' && hasFindingId && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={gradcamUrl(f!.finding_id)}
            alt="Grad-CAM++ overlay"
            className="max-w-full max-h-full block"
          />
        )}
      </div>

      {f && (
        <div className="shrink-0 px-3 py-2 border-t border-slate-800 grid grid-cols-3 text-center gap-1">
          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-wide">HC</p>
            <p className="text-base font-bold text-slate-100 leading-tight">
              {f.hc_mm != null ? f.hc_mm.toFixed(1) : '—'}
            </p>
            <p className="text-[9px] text-slate-500">mm</p>
          </div>
          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-wide">Gest. Age</p>
            <p className="text-base font-bold text-slate-100 leading-tight">{f.ga_str ?? '—'}</p>
          </div>
          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-wide">Reliability</p>
            <p className="text-base font-bold leading-tight" style={{ color: f.confidence_color }}>
              {Math.round(f.reliability * 100)}%
            </p>
            <p className="text-[9px]" style={{ color: f.confidence_color }}>{f.confidence_label}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// 2 selected → 2 cols × 1 row; 3 → 3 cols × 1 row; 4 → 2 cols × 2 rows.
function gridLayout(n: number): { cols: string; rows: string } {
  if (n <= 2) return { cols: 'repeat(2, minmax(0, 1fr))', rows: '1fr' };
  if (n === 3) return { cols: 'repeat(3, minmax(0, 1fr))', rows: '1fr' };
  return { cols: 'repeat(2, minmax(0, 1fr))', rows: '1fr 1fr' };
}

export default function CompareView({
  study,
  results,
  onClose,
  onSaveCombined,
}: {
  study: Study;
  results: CompareResult[];
  onClose: () => void;
  onSaveCombined?: () => void;
}) {
  const allDone = results.every(r => r.status !== 'analyzing');
  const doneCount = results.filter(r => r.status === 'done' && r.findings).length;
  const canSaveCombined = allDone && doneCount >= 2;
  const layout = gridLayout(results.length);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0b0f1a]">
      <div className="flex items-center gap-3 px-4 py-2 bg-[#0f1623] border-b border-slate-800 shrink-0">
        <span className="text-sm font-semibold text-slate-200">Model Comparison</span>
        <span className="text-xs text-slate-500 border-l border-slate-700/60 pl-3">{study.patientName}</span>
        <span className="text-[10px] text-slate-500 border-l border-slate-700/60 pl-3">
          {results.length} model{results.length !== 1 ? 's' : ''}
        </span>
        {allDone && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400">
            <CheckCircle2 className="w-3 h-3" /> All complete
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {onSaveCombined && (
            <button
              onClick={onSaveCombined}
              disabled={!canSaveCombined}
              title={
                !allDone
                  ? 'Wait for all model inferences to finish'
                  : doneCount < 2
                    ? 'Need at least 2 successful results to combine'
                    : `Generate a combined PDF from ${doneCount} models`
              }
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition-colors',
                canSaveCombined
                  ? 'bg-[#0D7680] hover:bg-[#0a5f67] text-white'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed',
              )}
            >
              <Save className="w-3.5 h-3.5" /> Save Combined Report
            </button>
          )}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Back to Single Model
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-auto p-3 grid gap-3"
        style={{ gridTemplateColumns: layout.cols, gridTemplateRows: layout.rows }}
      >
        {results.map(r => (
          <CompareCell key={r.variant} study={study} result={r} />
        ))}
      </div>
    </div>
  );
}
