'use client';

import { useState } from 'react';
import { Film, Layers } from 'lucide-react';
import type { InferResponse } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * Per-frame HC stability trace.
 *
 * The consensus HC is a single number; this shows how much it moved frame to
 * frame, which is exactly what `reliability` is derived from. A flat trace is
 * the visible form of a high reliability score.
 */
function HcStabilityChart({
  values,
  consensus,
  stdMm,
}: {
  values: (number | null)[];
  consensus: number | null;
  stdMm?: number;
}) {
  const pts = values
    .map((v, i) => ({ v, i }))
    .filter((p): p is { v: number; i: number } => p.v != null);
  if (pts.length < 2) return null;

  const W = 640;
  const H = 120;
  const PAD_L = 46;
  const PAD_B = 18;
  const measured = pts.map(p => p.v);
  const lo = Math.min(...measured, consensus ?? Infinity);
  const hi = Math.max(...measured, consensus ?? -Infinity);
  const span = hi - lo < 0.05 ? 1 : hi - lo;
  const mid = (lo + hi) / 2;
  const top = mid + span / 2;
  const bot = mid - span / 2;

  const yFor = (v: number) => (H - PAD_B) - ((v - bot) / span) * (H - PAD_B - 8);
  const xFor = (i: number) =>
    PAD_L + (values.length < 2 ? 0 : (i / (values.length - 1)) * (W - PAD_L - 8));

  const path = pts
    .map((p, k) => `${k === 0 ? 'M' : 'L'}${xFor(p.i).toFixed(1)},${yFor(p.v).toFixed(1)}`)
    .join(' ');
  const spread = Math.max(...measured) - Math.min(...measured);

  return (
    <div data-testid="cine-hc-sparkline" className="w-full max-w-3xl space-y-1">
      <div className="flex justify-between items-baseline text-[10px]">
        <span className="font-semibold uppercase tracking-wider text-slate-500">
          HC per frame
        </span>
        <span className="font-mono text-slate-400">
          spread {spread.toFixed(1)} mm
          {stdMm != null && stdMm > 0 && ` · σ ${stdMm.toFixed(2)} mm`}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full block rounded border border-slate-800 bg-[#0b0f1a]"
        role="img"
        aria-label={`Head circumference per frame across the cine loop, spread ${spread.toFixed(1)} millimetres`}
      >
        {/* y-axis extremes */}
        <text x={4} y={yFor(top) + 4} className="fill-slate-600" fontSize="9" fontFamily="monospace">
          {top.toFixed(1)}
        </text>
        <text x={4} y={yFor(bot) + 4} className="fill-slate-600" fontSize="9" fontFamily="monospace">
          {bot.toFixed(1)}
        </text>

        {consensus != null && (
          <>
            <line
              x1={PAD_L}
              x2={W - 8}
              y1={yFor(consensus)}
              y2={yFor(consensus)}
              stroke="#dc2626"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
            <text
              x={W - 10}
              y={yFor(consensus) - 4}
              textAnchor="end"
              className="fill-red-400"
              fontSize="9"
              fontFamily="monospace"
            >
              consensus {consensus.toFixed(1)}
            </text>
          </>
        )}

        <path d={path} fill="none" stroke="#0D7680" strokeWidth={2} strokeLinejoin="round" />
        {pts.map(p => (
          <circle key={p.i} cx={xFor(p.i)} cy={yFor(p.v)} r={2.5} fill="#5cd5dc" />
        ))}

        <text x={PAD_L} y={H - 4} className="fill-slate-600" fontSize="9">
          frame 1
        </text>
        <text x={W - 8} y={H - 4} textAnchor="end" className="fill-slate-600" fontSize="9">
          frame {values.length}
        </text>
      </svg>
    </div>
  );
}

/**
 * Central cine-loop view — the animated loop at full panel width.
 *
 * Rendered as a third viewer tab alongside Image View and XAI Explanations,
 * so the animation gets the centre of the screen rather than a 288 px sidebar.
 */
export default function CineView({ findings }: { findings: InferResponse }) {
  const overlayGif = findings.cine_overlay_gif;
  const loopGif = findings.cine_loop_gif;
  const [view, setView] = useState<'overlay' | 'raw'>('overlay');

  // If only one animation arrived, pin to it rather than offering a dead tab.
  const canToggle = Boolean(overlayGif && loopGif);
  const showing = canToggle ? view : overlayGif ? 'overlay' : 'raw';
  const src = showing === 'overlay' ? overlayGif : loopGif;

  return (
    <div
      data-testid="cine-view"
      className="flex-1 overflow-auto flex flex-col items-center gap-4 p-5"
    >
      {/* View switcher */}
      <div className="flex items-center gap-3 shrink-0">
        {canToggle ? (
          <div className="flex rounded overflow-hidden border border-slate-700">
            {(
              [
                ['overlay', 'Segmentation Overlay', <Layers key="l" className="w-3 h-3" />],
                ['raw', 'Raw Cine Loop', <Film key="f" className="w-3 h-3" />],
              ] as const
            ).map(([mode, label, icon]) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                data-testid={`cine-view-${mode}`}
                aria-pressed={showing === mode}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold transition-colors',
                  showing === mode
                    ? 'bg-[#0D7680] text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-[11px] font-semibold text-slate-400">
            {showing === 'overlay' ? 'Segmentation Overlay' : 'Raw Cine Loop'}
          </span>
        )}
        {findings.cine_frame_count && (
          <span className="text-[10px] text-slate-500 font-mono">
            {findings.cine_frame_count} frames · Pseudo-LDDM v2
          </span>
        )}
      </div>

      {/* The animation, as large as the panel allows */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        data-testid="cine-gif"
        src={src ?? undefined}
        alt={
          showing === 'overlay'
            ? 'Predicted segmentation contour animated across the cine-loop frames'
            : 'Raw synthesised cine-loop with no prediction drawn on it'
        }
        className="max-w-full w-auto rounded border border-slate-700 bg-black"
        style={{ imageRendering: 'auto', maxHeight: '58vh' }}
      />

      <p className="text-[11px] text-slate-400 text-center max-w-2xl leading-relaxed shrink-0">
        {showing === 'overlay' ? (
          <>
            Segmentation overlay across the clip. Each frame is labelled with its position in
            the loop and its own HC; the{' '}
            <span className="text-amber-400 font-semibold">amber frame</span> is the one measured
            in Image View.
          </>
        ) : (
          <>
            The synthesised loop exactly as the temporal model received it — no prediction drawn.
            Compare against the overlay to judge the boundary independently.
          </>
        )}
      </p>

      {findings.cine_per_frame_hc && (
        <HcStabilityChart
          values={findings.cine_per_frame_hc}
          consensus={findings.hc_mm}
          stdMm={findings.hc_std_mm}
        />
      )}
    </div>
  );
}
