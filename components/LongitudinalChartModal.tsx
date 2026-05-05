'use client';

// Longitudinal growth chart — overlays a patient's HC measurements across
// multiple studies on the Hadlock 1984 reference curve. Self-contained SVG
// (no chart-lib dependency); the same curve is also drawn server-side in
// the PDF (app/report.py:_hc_growth_chart_b64) so the visualisation is
// consistent across surfaces.

import { useEffect, useState } from 'react';
import { TrendingUp, X, AlertTriangle } from 'lucide-react';
import type { ApiReport } from '@/lib/types';
import { listReportsForPatient } from '@/lib/api';

interface Props {
  patientId: string;
  patientName: string;
  highlightReportId?: string;          // current/selected report — drawn red
  onClose: () => void;
}

// Inverse Hadlock 1984 polynomial — same form used server-side. Returns GA
// in weeks for a given HC in mm.
function hadlockGa(hcMm: number): number {
  const x = hcMm / 10;
  const ga = 8.96 + 0.540 * x - 0.0040 * x * x + 0.000399 * x * x * x;
  return Math.max(10, Math.min(42, ga));
}

// Build the Hadlock reference curve as a series of (ga, hc) points
function buildReferenceCurve(): Array<{ ga: number; hc: number; sd2: number }> {
  const out: Array<{ ga: number; hc: number; sd2: number }> = [];
  for (let hc = 60; hc <= 380; hc += 4) {
    const ga = hadlockGa(hc);
    const sd2 = Math.max(8.0, hc * 0.04);   // matches server-side approximation
    out.push({ ga, hc, sd2 });
  }
  return out;
}

const REF_CURVE = buildReferenceCurve();

// Chart geometry
const W = 640;
const H = 360;
const PAD_L = 56;
const PAD_R = 24;
const PAD_T = 24;
const PAD_B = 44;
const X_MIN = 10;       // weeks
const X_MAX = 42;
const Y_MIN = 50;       // mm
const Y_MAX = 400;

const xScale = (ga: number) =>
  PAD_L + ((ga - X_MIN) / (X_MAX - X_MIN)) * (W - PAD_L - PAD_R);
const yScale = (hc: number) =>
  PAD_T + (1 - (hc - Y_MIN) / (Y_MAX - Y_MIN)) * (H - PAD_T - PAD_B);

export default function LongitudinalChartModal({
  patientId,
  patientName,
  highlightReportId,
  onClose,
}: Props) {
  const [reports, setReports] = useState<ApiReport[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listReportsForPatient(patientId)
      .then(rs => {
        if (!cancelled) setReports(rs);
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Load failed');
      });
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  // Pre-compute SVG path strings for the mean curve + ±2 SD band
  const meanPath = REF_CURVE.map(
    (p, i) => `${i === 0 ? 'M' : 'L'}${xScale(p.ga).toFixed(1)},${yScale(p.hc).toFixed(1)}`,
  ).join(' ');

  const upperPath = REF_CURVE.map(p => `${xScale(p.ga).toFixed(1)},${yScale(p.hc + p.sd2).toFixed(1)}`);
  const lowerPath = REF_CURVE.map(p => `${xScale(p.ga).toFixed(1)},${yScale(p.hc - p.sd2).toFixed(1)}`);
  const bandPath = `M${upperPath.join(' L')} L${lowerPath.reverse().join(' L')} Z`;

  // Patient points — only those with hc_mm + ga_weeks
  const points =
    reports
      ?.filter(r => r.hc_mm != null && r.ga_weeks != null)
      .map(r => ({
        id: r.id,
        ga: r.ga_weeks!,
        hc: r.hc_mm!,
        date: r.study_date,
        isCurrent: r.id === highlightReportId,
      })) ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-[760px] max-h-[92vh] bg-[#0f1623] border border-slate-700 rounded-lg shadow-2xl flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 shrink-0">
          <TrendingUp className="w-4 h-4 text-[#0D7680]" />
          <h3 className="text-sm font-semibold text-slate-200">
            Longitudinal Growth Chart — {patientName}
          </h3>
          <span className="text-[10px] text-slate-500 border-l border-slate-700/60 pl-2">
            patient ID {patientId}
          </span>
          {reports && (
            <span className="text-[10px] text-slate-500 border-l border-slate-700/60 pl-2">
              {points.length} measurement{points.length !== 1 ? 's' : ''}
            </span>
          )}
          <button onClick={onClose} className="ml-auto text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}
          {!reports && !error && (
            <p className="text-xs text-slate-500">Loading reports for this patient…</p>
          )}

          {reports && (
            <>
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" aria-label="HC growth chart">
                {/* axes */}
                <rect x={PAD_L} y={PAD_T} width={W - PAD_L - PAD_R} height={H - PAD_T - PAD_B} fill="#0b0f1a" stroke="#334155" strokeWidth={0.5} />
                {/* gridlines + ticks (X) */}
                {[14, 18, 22, 26, 30, 34, 38].map(ga => (
                  <g key={`x-${ga}`}>
                    <line x1={xScale(ga)} y1={PAD_T} x2={xScale(ga)} y2={H - PAD_B} stroke="#1e293b" strokeWidth={0.5} />
                    <text x={xScale(ga)} y={H - PAD_B + 14} fill="#94a3b8" fontSize="10" textAnchor="middle">{ga}</text>
                  </g>
                ))}
                {/* gridlines + ticks (Y) */}
                {[100, 150, 200, 250, 300, 350].map(hc => (
                  <g key={`y-${hc}`}>
                    <line x1={PAD_L} y1={yScale(hc)} x2={W - PAD_R} y2={yScale(hc)} stroke="#1e293b" strokeWidth={0.5} />
                    <text x={PAD_L - 6} y={yScale(hc) + 3} fill="#94a3b8" fontSize="10" textAnchor="end">{hc}</text>
                  </g>
                ))}

                {/* axis labels */}
                <text x={(W + PAD_L - PAD_R) / 2} y={H - 8} fill="#94a3b8" fontSize="11" textAnchor="middle">
                  Gestational age (weeks)
                </text>
                <text
                  x={-((H + PAD_T - PAD_B) / 2)}
                  y={16}
                  fill="#94a3b8"
                  fontSize="11"
                  textAnchor="middle"
                  transform="rotate(-90)"
                >
                  Head circumference (mm)
                </text>

                {/* ±2 SD band */}
                <path d={bandPath} fill="#0D7680" fillOpacity={0.18} />
                {/* mean curve */}
                <path d={meanPath} stroke="#0D7680" strokeWidth={1.6} fill="none" />

                {/* patient points + connecting segments */}
                {points.length >= 2 && (
                  <polyline
                    points={points
                      .map(p => `${xScale(p.ga).toFixed(1)},${yScale(p.hc).toFixed(1)}`)
                      .join(' ')}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth={1}
                    strokeDasharray="3 2"
                  />
                )}
                {points.map(p => (
                  <g key={p.id}>
                    <circle
                      cx={xScale(p.ga)}
                      cy={yScale(p.hc)}
                      r={p.isCurrent ? 7 : 5}
                      fill={p.isCurrent ? '#dc2626' : '#94a3b8'}
                      stroke="#0f1623"
                      strokeWidth={1.5}
                    >
                      <title>
                        {p.date}: HC {p.hc.toFixed(1)} mm @ GA {p.ga.toFixed(1)} wk
                      </title>
                    </circle>
                  </g>
                ))}

                {/* legend */}
                <g transform={`translate(${PAD_L + 8}, ${PAD_T + 8})`}>
                  <rect width={170} height={70} fill="#0b0f1a" stroke="#334155" strokeWidth={0.5} fillOpacity={0.85} />
                  <line x1={8} y1={14} x2={26} y2={14} stroke="#0D7680" strokeWidth={1.6} />
                  <text x={32} y={17} fill="#cbd5e1" fontSize="10">Hadlock 1984 mean</text>
                  <rect x={8} y={22} width={18} height={8} fill="#0D7680" fillOpacity={0.18} />
                  <text x={32} y={29} fill="#cbd5e1" fontSize="10">Population ±2 SD</text>
                  <circle cx={17} cy={42} r={4} fill="#dc2626" />
                  <text x={32} y={45} fill="#cbd5e1" fontSize="10">Current study</text>
                  <circle cx={17} cy={56} r={4} fill="#94a3b8" />
                  <text x={32} y={59} fill="#cbd5e1" fontSize="10">Prior studies</text>
                </g>
              </svg>

              {points.length === 0 && (
                <p className="text-[11px] text-slate-500 italic">
                  No HC measurements available for this patient yet. The chart shows
                  the Hadlock 1984 reference curve only.
                </p>
              )}

              {points.length > 0 && (
                <table className="w-full text-xs" data-testid="longitudinal-table">
                  <thead className="text-slate-500 border-b border-slate-800">
                    <tr>
                      <th className="text-left py-1">Study Date</th>
                      <th className="text-right py-1">HC (mm)</th>
                      <th className="text-right py-1">GA (weeks)</th>
                      <th className="text-left py-1 pl-3">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {points.map(p => (
                      <tr key={p.id} className={p.isCurrent ? 'text-red-300' : 'text-slate-300'}>
                        <td className="py-1 font-mono">{p.date}</td>
                        <td className="text-right py-1 font-mono">{p.hc.toFixed(1)}</td>
                        <td className="text-right py-1 font-mono">{p.ga.toFixed(2)}</td>
                        <td className="py-1 pl-3 text-[10px]">
                          {p.isCurrent ? 'CURRENT' : 'prior'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <p className="text-[10px] text-slate-500 leading-tight">
                <b>Reference:</b> Hadlock FP et al., AJR 1984;143:97–100. ±2 SD band approximated
                as ±4% of the mean HC at each GA — for a clinical-grade product the Chitty 1994 /
                Hadlock 1991 tabulated SDs would replace this.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
