'use client';

import { useState } from 'react';
import type { Study, SavedReport, ModelVariant, InferResponse } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  FileText,
  FlaskConical,
  Save,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  X,
  FlaskRound,
  CheckSquare,
} from 'lucide-react';
import {
  type DemoScenario,
  SCENARIO_INFO,
  getScenarioPatient,
} from '@/lib/demo-scenarios';

function reliabilityTier(value: number): { label: string; color: string; tier: 'high' | 'medium' | 'low' } {
  if (value >= 0.85) return { label: 'HIGH', color: '#10b981', tier: 'high' };
  if (value >= 0.70) return { label: 'MEDIUM', color: '#f59e0b', tier: 'medium' };
  return { label: 'LOW', color: '#ef4444', tier: 'low' };
}

interface Props {
  study: Study;
  model: ModelVariant;
  onSaveReport: (r: Omit<SavedReport, 'id' | 'analyzedAt'>) => void;
}

interface ReportFormState {
  // Mode toggle
  reportMode: 'template' | 'llm';
  // Pre-filled from study
  patientName: string;
  studyDate: string;
  // User-entered clinical fields
  referringPhysician: string;
  patientId: string;
  patientDob: string;
  lmp: string;
  orderingFacility: string;
  sonographerName: string;
  clinicalIndication: string;
  usApproach: 'transabdominal' | 'transvaginal';
  imageQuality: 'optimal' | 'suboptimal' | 'limited';
  // v3.1: optional secondary biometric + fetal lie
  fetalPresentation: 'cephalic' | 'breech' | 'transverse' | 'not_assessed';
  bpdMm: string; // text input — parsed to number on submit; empty string allowed
  priorBiometry: string; // free-text prior measurement summary
}

// Scenario logic lives in lib/demo-scenarios.ts (shared with the combined
// modal). buildScenarioForm just merges the scenario patient fields into
// the existing ReportFormState shape.
function buildScenarioForm(s: DemoScenario, base: ReportFormState): ReportFormState {
  return { ...base, ...getScenarioPatient(s) };
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

function ReliabilityBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tier = reliabilityTier(value);
  return (
    <div data-testid="reliability-bar" data-tier={tier.tier} className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">Reliability</span>
        <span style={{ color: tier.color }} className="font-semibold">{tier.label} ({pct}%)</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: tier.color }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-slate-600">
        <span className="text-red-400/70">&lt;70 LOW</span>
        <span className="text-amber-400/70">70–85 MED</span>
        <span className="text-emerald-400/70">≥85 HIGH</span>
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

function ReportFormModal({
  initial,
  findings,
  modelVariant,
  onSubmit,
  onClose,
}: {
  initial: ReportFormState;
  findings?: InferResponse;
  modelVariant: ModelVariant;
  onSubmit: (s: ReportFormState) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ReportFormState>(initial);
  const [demoScenario, setDemoScenario] = useState<DemoScenario | null>(null);
  const set = (k: keyof ReportFormState, v: string) => setForm(f => ({ ...f, [k]: v }));

  const applyScenario = (s: DemoScenario) => {
    setForm(buildScenarioForm(s, initial));
    setDemoScenario(s);
  };
  const exitDemoMode = () => {
    setForm(initial);
    setDemoScenario(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-[600px] max-h-[90vh] bg-[#0f1623] border border-slate-700 rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 shrink-0">
          <FileText className="w-4 h-4 text-[#0D7680]" />
          <h3 className="text-sm font-semibold text-slate-200">Generate Clinical Report</h3>
          {demoScenario && (
            <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-amber-500/15 border border-amber-500/40 text-amber-300 rounded">
              Demo Mode · {demoScenario}
            </span>
          )}
          <button onClick={onClose} className="ml-auto text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* ── Mode Toggle ─────────────────────────────────────── */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Report Mode</p>
            <div className="flex gap-2">
              <button
                onClick={() => set('reportMode', 'template')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-xs font-semibold border transition-colors',
                  form.reportMode === 'template'
                    ? 'bg-slate-700 border-slate-500 text-slate-100'
                    : 'border-slate-700 text-slate-500 hover:text-slate-300'
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                Automated Template
              </button>
              <button
                onClick={() => set('reportMode', 'llm')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-xs font-semibold border transition-colors',
                  form.reportMode === 'llm'
                    ? 'bg-[#0D7680]/20 border-[#0D7680]/60 text-[#5cd5dc]'
                    : 'border-slate-700 text-slate-500 hover:text-slate-300'
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI-Authored (Claude Haiku)
              </button>
            </div>
            <p className="text-[10px] text-slate-600 mt-1">
              {form.reportMode === 'llm'
                ? 'Narrative paragraphs generated by Claude Haiku. Requires API key on server.'
                : 'Rule-based template with trimester-aware clinical language. Always available.'}
            </p>
          </div>

          {/* ── Demo Mode (scenario presets) ─────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                Demo Mode
              </p>
              {demoScenario && (
                <button
                  onClick={exitDemoMode}
                  className="flex items-center gap-1 text-[10px] text-amber-400/80 hover:text-amber-300 font-semibold"
                >
                  <X className="w-3 h-3" /> Exit Demo Mode
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['A', 'B', 'C'] as DemoScenario[]).map(s => {
                const info = SCENARIO_INFO[s];
                const active = demoScenario === s;
                return (
                  <button
                    key={s}
                    onClick={() => applyScenario(s)}
                    className={cn(
                      'flex flex-col items-start gap-0.5 p-2 rounded text-left border transition-colors',
                      active
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-200'
                        : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    )}
                  >
                    <div className="flex items-center gap-1 text-xs font-semibold">
                      <FlaskRound className="w-3 h-3" /> {info.title}
                    </div>
                    <span className="text-[10px] leading-tight opacity-80">{info.subtitle}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-600 mt-1">
              {demoScenario
                ? 'Fields below auto-filled with realistic clinical data — still editable.'
                : 'Pick a scenario to auto-fill the form with realistic clinical context.'}
            </p>
          </div>

          {/* ── AI Analysis Results (read-only autofill) ─────────── */}
          {findings && findings.hc_mm != null && (
            <div className="bg-emerald-500/5 border border-emerald-500/30 rounded p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-emerald-400">
                <CheckSquare className="w-3 h-3" /> AI Analysis Results · auto-filled
              </div>
              <div className="grid grid-cols-4 gap-2">
                <ReadOnlyField label="HC (mm)"      value={findings.hc_mm.toFixed(1)} />
                <ReadOnlyField label="GA"           value={findings.ga_str ?? '—'} />
                <ReadOnlyField label="Confidence"   value={findings.confidence_label} />
                <ReadOnlyField label="Reliability"  value={`${Math.round(findings.reliability * 100)}%`} />
              </div>
              <p className="text-[9px] text-slate-500 leading-tight">
                Source model: <span className="font-semibold text-slate-300">{modelVariant}</span> ·
                Elapsed {findings.elapsed_ms.toFixed(0)} ms · trimester {findings.trimester}
              </p>
            </div>
          )}

          {/* ── Patient Information ──────────────────────────────── */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Patient Information</p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Patient Name *" value={form.patientName} onChange={v => set('patientName', v)} />
              <Field label="Patient ID / MRN" value={form.patientId} onChange={v => set('patientId', v)} placeholder="Optional" />
              <Field label="Date of Birth" value={form.patientDob} onChange={v => set('patientDob', v)} placeholder="YYYY-MM-DD" />
              <Field label="Exam Date *" value={form.studyDate} onChange={v => set('studyDate', v)} />
              <Field
                label="LMP (Last Menstrual Period)"
                value={form.lmp}
                onChange={v => set('lmp', v)}
                placeholder="YYYY-MM-DD — for GA cross-check"
                className="col-span-2"
              />
            </div>
          </div>

          {/* ── Referral Information ─────────────────────────────── */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Referral Information</p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Referring Physician" value={form.referringPhysician} onChange={v => set('referringPhysician', v)} placeholder="Dr. Jane Smith" />
              <Field label="Ordering Facility" value={form.orderingFacility} onChange={v => set('orderingFacility', v)} placeholder="Optional" />
              <Field label="Sonographer" value={form.sonographerName} onChange={v => set('sonographerName', v)} placeholder="Optional" />
            </div>
          </div>

          {/* ── Clinical Indication ──────────────────────────────── */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Clinical Indication</p>
            <textarea
              value={form.clinicalIndication}
              onChange={e => set('clinicalIndication', e.target.value)}
              rows={2}
              placeholder="e.g. Routine gestational dating at 13 weeks"
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0D7680] resize-none"
            />
          </div>

          {/* ── Technical Parameters ─────────────────────────────── */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Technical Parameters</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 font-semibold">US Approach</label>
                <select
                  value={form.usApproach}
                  onChange={e => set('usApproach', e.target.value as 'transabdominal' | 'transvaginal')}
                  className="mt-1 w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0D7680]"
                >
                  <option value="transabdominal">Transabdominal</option>
                  <option value="transvaginal">Transvaginal</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-semibold">Image Quality</label>
                <select
                  value={form.imageQuality}
                  onChange={e => set('imageQuality', e.target.value as 'optimal' | 'suboptimal' | 'limited')}
                  className="mt-1 w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0D7680]"
                >
                  <option value="optimal">Optimal</option>
                  <option value="suboptimal">Suboptimal</option>
                  <option value="limited">Limited</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-semibold">Fetal Lie / Presentation</label>
                <select
                  value={form.fetalPresentation}
                  onChange={e => set('fetalPresentation', e.target.value as ReportFormState['fetalPresentation'])}
                  className="mt-1 w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0D7680]"
                >
                  <option value="not_assessed">Not assessed</option>
                  <option value="cephalic">Cephalic</option>
                  <option value="breech">Breech</option>
                  <option value="transverse">Transverse</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-semibold">
                  BPD (mm) — optional
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.bpdMm}
                  onChange={e => set('bpdMm', e.target.value)}
                  placeholder="e.g. 58.4"
                  className="mt-1 w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0D7680]"
                />
              </div>
              <div className="col-span-3">
                <label className="text-[10px] text-slate-500 font-semibold">
                  Prior biometry — optional
                </label>
                <input
                  type="text"
                  value={form.priorBiometry}
                  onChange={e => set('priorBiometry', e.target.value)}
                  placeholder="e.g. HC 198 mm @ 2024-12-01 (22w 3d)"
                  className="mt-1 w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0D7680]"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-800 shrink-0">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200">
            Cancel
          </button>
          <button
            onClick={() => onSubmit(form)}
            disabled={!form.patientName.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-[#0D7680] hover:bg-[#0a5f67] disabled:opacity-50 text-white rounded"
          >
            <Save className="w-3.5 h-3.5" />
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-[10px] text-slate-500 font-semibold">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0D7680]"
      />
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">{label}</p>
      <p className="text-xs font-mono font-semibold text-slate-100 mt-0.5">{value}</p>
    </div>
  );
}

function QualityBadge({
  label,
  score,
  blur,
}: {
  label: 'poor' | 'suboptimal' | 'good' | 'excellent';
  score: number;
  blur: number;
}) {
  const palette: Record<typeof label, { bg: string; border: string; text: string }> = {
    excellent: { bg: 'bg-emerald-500/10',  border: 'border-emerald-500/40', text: 'text-emerald-300' },
    good:      { bg: 'bg-teal-500/10',     border: 'border-teal-500/40',    text: 'text-teal-300' },
    suboptimal:{ bg: 'bg-amber-500/10',    border: 'border-amber-500/40',   text: 'text-amber-300' },
    poor:      { bg: 'bg-red-500/10',      border: 'border-red-500/40',     text: 'text-red-300' },
  };
  const c = palette[label];
  return (
    <div
      data-testid="quality-badge"
      data-quality-label={label}
      className={cn('flex items-start gap-2 p-2.5 rounded border', c.bg, c.border, c.text)}
      title={`Composite quality score (blur + contrast + brightness + resolution). Raw Laplacian variance: ${blur.toFixed(0)}.`}
    >
      <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider">
          Image quality · {label}
        </p>
        <p className="text-[10px] opacity-80 leading-tight mt-0.5">
          Score {score.toFixed(2)} (0–1) · Laplacian var. {blur.toFixed(0)}
        </p>
      </div>
    </div>
  );
}

export default function AIFindingsPanel({ study, model, onSaveReport }: Props) {
  const f = study.findings;
  const isSynthetic = study.isSynthetic === true;
  const [showForm, setShowForm] = useState(false);

  const handleOpenForm = () => setShowForm(true);

  const handleSubmit = (form: ReportFormState) => {
    if (!f) return;
    onSaveReport({
      patientName: form.patientName || study.patientName,
      studyDate: form.studyDate || study.studyDate,
      hcMm: f.hc_mm ?? 0,
      gaStr: f.ga_str ?? '',
      gaWeeks: f.ga_weeks ?? 0,
      trimester: f.trimester,
      reliability: f.reliability,
      confidenceLabel: f.confidence_label,
      model,
      referringPhysician: form.referringPhysician || undefined,
      patientId: form.patientId || undefined,
      patientDob: form.patientDob || undefined,
      lmp: form.lmp || undefined,
      orderingFacility: form.orderingFacility || undefined,
      sonographerName: form.sonographerName || undefined,
      clinicalIndication: form.clinicalIndication || undefined,
      usApproach: form.usApproach,
      imageQuality: form.imageQuality,
      reportMode: form.reportMode,
      fetalPresentation: form.fetalPresentation,
      bpdMm: form.bpdMm.trim() ? Number(form.bpdMm) : undefined,
      priorBiometry: form.priorBiometry.trim() || undefined,
    });
    setShowForm(false);
  };

  const formInitial: ReportFormState = {
    reportMode: 'template',
    patientName: study.patientName,
    studyDate: study.studyDate,
    referringPhysician: '',
    patientId: '',
    patientDob: '',
    lmp: '',
    orderingFacility: '',
    sonographerName: '',
    clinicalIndication: '',
    usApproach: 'transabdominal',
    imageQuality: 'optimal',
    fetalPresentation: 'not_assessed',
    bpdMm: '',
    priorBiometry: '',
  };

  return (
    <>
      <aside className="w-72 shrink-0 bg-[#0f1623] border-l border-slate-800/80 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800/60">
          <Brain className="w-4 h-4 text-[#0D7680]" />
          <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">AI Findings</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {f?.validation?.quality_label && (
            <QualityBadge
              label={f.validation.quality_label}
              score={f.validation.quality_score ?? 0}
              blur={f.validation.blur_score ?? 0}
            />
          )}
          {f && f.ood_flag && (
            <div
              data-testid="ood-banner"
              className="flex items-start gap-2 p-2.5 rounded border border-amber-500/50 bg-amber-500/10 text-amber-200"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider">Out-of-distribution warning</p>
                <p className="text-[11px] mt-0.5 text-amber-200/80 leading-snug">
                  Input did not pass all distribution checks. Treat the result with caution and review the XAI tab.
                </p>
              </div>
            </div>
          )}

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
                  Backend inference unavailable. Values below are pre-baked demo numbers.
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

              {study.isDemo && study.hcReferenceMm != null && f.hc_mm != null && !isSynthetic && (
                <div className="rounded border border-slate-700/60 bg-slate-800/40 px-3 py-2 space-y-1">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                    HC18 Dataset Validation
                  </p>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-400">Reference</span>
                    <span className="font-mono text-slate-200">{study.hcReferenceMm.toFixed(1)} mm</span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-400">AI prediction</span>
                    <span className="font-mono text-slate-200">{f.hc_mm.toFixed(1)} mm</span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs border-t border-slate-700/50 pt-1 mt-1">
                    <span className="text-slate-400">Δ deviation</span>
                    <span className={cn(
                      'font-mono font-semibold',
                      Math.abs(f.hc_mm - study.hcReferenceMm) <= 3
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    )}>
                      {(f.hc_mm - study.hcReferenceMm > 0 ? '+' : '')}
                      {(f.hc_mm - study.hcReferenceMm).toFixed(1)} mm
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-600 leading-tight pt-0.5">
                    ISUOG threshold ±3 mm ·{' '}
                    {Math.abs(f.hc_mm - study.hcReferenceMm) <= 3
                      ? '✓ within threshold'
                      : '⚠ exceeds threshold'}
                  </p>
                </div>
              )}

              <ReliabilityBar value={f.reliability} />

              <div className={cn('text-[10px] text-slate-600 flex justify-between')}>
                <span>Model: {model}{isSynthetic ? ' · synthetic' : ''}</span>
                <span>{f.elapsed_ms.toFixed(0)} ms</span>
              </div>

              {f.hc_mm != null && !isSynthetic && (
                <button
                  onClick={handleOpenForm}
                  data-testid="open-report-form"
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

      {showForm && (
        <ReportFormModal
          initial={formInitial}
          findings={f ?? undefined}
          modelVariant={model}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  );
}
