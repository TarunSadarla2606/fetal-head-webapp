'use client';

import { useState } from 'react';
import { CheckCircle2, CheckSquare, FileText, FlaskRound, Save, Sparkles, X } from 'lucide-react';
import type { CompareResult, CreateCombinedReportPayload, FetalPresentation } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  type DemoScenario,
  type ScenarioPatientFields,
  SCENARIO_INFO,
  getScenarioPatient,
} from '@/lib/demo-scenarios';

// Form state mirrors the patient/exam fields plus the report-mode toggle.
// Read-only per-model findings come from `results` and are not part of the
// editable form state — they're shown as autofilled cards above the form.
interface CombinedFormState extends ScenarioPatientFields {
  reportMode: 'template' | 'llm';
  patientName: string;     // pre-filled from study
  studyDate: string;       // pre-filled from study
}

const VARIANT_LABEL: Record<string, string> = {
  phase0: 'Standard · Single Frame',
  phase2: 'Standard · Cine Loop',
  phase4a: 'Express · Single Frame',
  phase4b: 'Express · Cine Loop',
};

interface Props {
  // All compare cells (only the 'done' ones contribute findings to the report)
  results: CompareResult[];
  patientName: string;          // initial value from the study
  studyDate: string;            // initial value from the study
  pixelSpacingMm: number;       // shared spacing used for all models
  pixelSpacingSource: 'DICOM' | 'CSV' | 'USER';
  onSubmit: (payload: CreateCombinedReportPayload) => Promise<void> | void;
  onClose: () => void;
}

const EMPTY_PATIENT: ScenarioPatientFields = {
  patientName: '',
  patientId: '',
  patientDob: '',
  lmp: '',
  referringPhysician: '',
  orderingFacility: '',
  sonographerName: '',
  clinicalIndication: '',
  usApproach: 'transabdominal',
  imageQuality: 'optimal',
  fetalPresentation: 'cephalic',
  bpdMm: '',
  priorBiometry: '',
};

export default function CombinedReportFormModal({
  results,
  patientName,
  studyDate,
  pixelSpacingMm,
  pixelSpacingSource,
  onSubmit,
  onClose,
}: Props) {
  const doneResults = results.filter(r => r.status === 'done' && r.findings);

  const initial: CombinedFormState = {
    ...EMPTY_PATIENT,
    patientName,
    studyDate,
    reportMode: 'template',
  };

  const [form, setForm] = useState<CombinedFormState>(initial);
  const [demoScenario, setDemoScenario] = useState<DemoScenario | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof CombinedFormState>(k: K, v: CombinedFormState[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const applyScenario = (s: DemoScenario) => {
    setForm({ ...initial, ...getScenarioPatient(s), reportMode: form.reportMode });
    setDemoScenario(s);
  };
  const exitDemoMode = () => {
    setForm(initial);
    setDemoScenario(null);
  };

  const handleSubmit = async () => {
    if (!form.patientName.trim()) {
      setError('Patient name is required');
      return;
    }
    if (doneResults.length < 2) {
      setError('Need at least 2 successful model results to generate a combined report');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const payload: CreateCombinedReportPayload = {
        findings: doneResults.map(r => ({
          model: r.variant,
          finding_id: r.findings!.finding_id,
          hc_mm: r.findings!.hc_mm ?? undefined,
          ga_str: r.findings!.ga_str ?? undefined,
          ga_weeks: r.findings!.ga_weeks ?? undefined,
          trimester: r.findings!.trimester,
          reliability: r.findings!.reliability,
          confidence_label: r.findings!.confidence_label,
          elapsed_ms: r.findings!.elapsed_ms,
        })),
        patient_name: form.patientName,
        study_date: form.studyDate,
        pixel_spacing_mm: pixelSpacingMm,
        pixel_spacing_source: pixelSpacingSource,
        pixel_spacing_dicom_derived: pixelSpacingSource === 'DICOM',
        referring_physician: form.referringPhysician || undefined,
        patient_id: form.patientId || undefined,
        patient_dob: form.patientDob || undefined,
        lmp: form.lmp || undefined,
        ordering_facility: form.orderingFacility || undefined,
        sonographer_name: form.sonographerName || undefined,
        clinical_indication: form.clinicalIndication || undefined,
        us_approach: form.usApproach,
        image_quality: form.imageQuality,
        report_mode: form.reportMode,
        fetal_presentation: form.fetalPresentation as FetalPresentation,
        bpd_mm: form.bpdMm.trim() ? Number(form.bpdMm) : undefined,
        prior_biometry: form.priorBiometry || undefined,
      };
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate combined report');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-[680px] max-h-[92vh] bg-[#0f1623] border border-slate-700 rounded-lg shadow-2xl flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 shrink-0">
          <FileText className="w-4 h-4 text-[#0D7680]" />
          <h3 className="text-sm font-semibold text-slate-200">
            Generate Combined Clinical Report
          </h3>
          <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-[#0D7680]/15 border border-[#0D7680]/40 text-[#5cd5dc] rounded">
            {doneResults.length} models
          </span>
          {demoScenario && (
            <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-amber-500/15 border border-amber-500/40 text-amber-300 rounded">
              Demo · {demoScenario}
            </span>
          )}
          <button onClick={onClose} className="ml-auto text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Mode toggle */}
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
              Same options as single-model. AI-Authored writes the consensus
              narrative once for all models combined.
            </p>
          </div>

          {/* Demo Mode */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Demo Mode</p>
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
          </div>

          {/* Per-model autofilled findings */}
          <div className="bg-emerald-500/5 border border-emerald-500/30 rounded p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-emerald-400">
              <CheckSquare className="w-3 h-3" /> Per-Model AI Results · auto-filled
            </div>
            <div className="grid grid-cols-2 gap-2">
              {doneResults.map(r => {
                const f = r.findings!;
                return (
                  <div key={r.variant} className="bg-[#0b0f1a] border border-slate-800 rounded p-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-300">
                        {VARIANT_LABEL[r.variant] ?? r.variant}
                      </span>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-center">
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase">HC</p>
                        <p className="text-xs font-mono font-semibold text-slate-100">
                          {f.hc_mm != null ? f.hc_mm.toFixed(1) : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase">GA</p>
                        <p className="text-xs font-mono font-semibold text-slate-100">{f.ga_str ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase">Conf.</p>
                        <p className="text-[10px] font-semibold" style={{ color: f.confidence_color }}>
                          {f.confidence_label}
                        </p>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-600">
                      Reliability {Math.round(f.reliability * 100)}% · {f.elapsed_ms.toFixed(0)} ms
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="text-[9px] text-slate-500 leading-tight">
              Server computes consensus HC (mean ± std) across these models and re-derives
              gestational age from the consensus HC via Hadlock 1984.
            </p>
          </div>

          {/* Patient Information */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Patient Information</p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Patient Name *" value={form.patientName} onChange={v => set('patientName', v)} />
              <Field label="Patient ID / MRN" value={form.patientId} onChange={v => set('patientId', v)} placeholder="Optional" />
              <Field label="Date of Birth" value={form.patientDob} onChange={v => set('patientDob', v)} placeholder="YYYY-MM-DD" />
              <Field label="Exam Date *" value={form.studyDate} onChange={v => set('studyDate', v)} />
              <Field label="LMP" value={form.lmp} onChange={v => set('lmp', v)} placeholder="YYYY-MM-DD" className="col-span-2" />
            </div>
          </div>

          {/* Referral */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Referral</p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Referring Physician" value={form.referringPhysician} onChange={v => set('referringPhysician', v)} />
              <Field label="Ordering Facility" value={form.orderingFacility} onChange={v => set('orderingFacility', v)} />
              <Field label="Sonographer" value={form.sonographerName} onChange={v => set('sonographerName', v)} />
            </div>
          </div>

          {/* Clinical indication */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Clinical Indication</p>
            <textarea
              value={form.clinicalIndication}
              onChange={e => set('clinicalIndication', e.target.value)}
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0D7680] resize-none"
            />
          </div>

          {/* Technical params */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Technical Parameters</p>
            <div className="grid grid-cols-2 gap-2">
              <SelectField label="US Approach" value={form.usApproach} onChange={v => set('usApproach', v as CombinedFormState['usApproach'])}
                options={[['transabdominal','Transabdominal'],['transvaginal','Transvaginal']]} />
              <SelectField label="Image Quality" value={form.imageQuality} onChange={v => set('imageQuality', v as CombinedFormState['imageQuality'])}
                options={[['optimal','Optimal'],['suboptimal','Suboptimal'],['limited','Limited']]} />
              <SelectField label="Fetal Presentation" value={form.fetalPresentation} onChange={v => set('fetalPresentation', v as CombinedFormState['fetalPresentation'])}
                options={[['cephalic','Cephalic'],['breech','Breech'],['transverse','Transverse'],['not_assessed','Not assessed']]} />
              <div>
                <label className="text-[10px] text-slate-500 font-semibold">BPD (mm) — optional</label>
                <input type="number" step="0.1" min="0" value={form.bpdMm}
                  onChange={e => set('bpdMm', e.target.value)}
                  className="mt-1 w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0D7680]"
                />
              </div>
              <Field className="col-span-2" label="Prior biometry — optional" value={form.priorBiometry} onChange={v => set('priorBiometry', v)} placeholder="e.g. HC 198 mm @ 2024-12-01" />
            </div>
          </div>
        </div>

        {error && (
          <div className="px-4 py-2 text-[11px] bg-red-950/40 border-t border-red-900/60 text-red-400">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-800 shrink-0">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.patientName.trim() || doneResults.length < 2}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-[#0D7680] hover:bg-[#0a5f67] disabled:opacity-50 text-white rounded"
          >
            <Save className="w-3.5 h-3.5" />
            {submitting ? 'Generating…' : 'Generate Combined Report'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, className,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
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

function SelectField({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div>
      <label className="text-[10px] text-slate-500 font-semibold">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="mt-1 w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0D7680]"
      >
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
