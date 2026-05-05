import Link from 'next/link';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  FileText,
  Layers,
  Lock,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col bg-[#0b0f1a] text-slate-200 min-h-screen">
      {/* ── Top nav ─────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 h-14 border-b border-slate-800/80 bg-[#0f1623]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#0D7680] flex items-center justify-center">
            <span className="text-white text-sm font-bold leading-none">F</span>
          </div>
          <div>
            <div className="text-slate-100 font-semibold text-sm tracking-tight">FetalScan AI</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Clinical biometry · Research use only</div>
          </div>
        </div>
        <nav className="flex items-center gap-6 text-xs text-slate-400">
          <a href="#features" className="hover:text-slate-200">Features</a>
          <a href="#models" className="hover:text-slate-200">Models</a>
          <a href="#exports" className="hover:text-slate-200">Exports</a>
          <a href="#compliance" className="hover:text-slate-200">Compliance</a>
          <Link
            href="/app"
            data-testid="cta-open-demo-nav"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#0D7680] hover:bg-[#0a5f67] text-white rounded transition-colors"
          >
            Open Demo <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="px-8 py-16 lg:py-24 flex flex-col items-center text-center max-w-5xl mx-auto">
        <span className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider bg-[#0D7680]/15 border border-[#0D7680]/40 text-[#5cd5dc] rounded-full mb-6">
          AI-assisted fetal biometry · multi-model ensemble · structured reports
        </span>
        <h1 className="text-4xl lg:text-5xl font-bold text-slate-100 leading-tight tracking-tight mb-5">
          Clinically-grade fetal head circumference
          <br />
          measurement with explainable AI
        </h1>
        <p className="text-base lg:text-lg text-slate-400 max-w-2xl mb-8 leading-relaxed">
          Four model variants — static and cine, baseline and compressed — with Grad-CAM
          explanations, multi-reader consensus reports, and FHIR / DICOM SR exports for
          PACS integration. Built around the HC18 cohort and ISUOG ±3 mm clinical
          tolerance.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            data-testid="cta-open-demo-hero"
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#0D7680] hover:bg-[#0a5f67] text-white rounded-lg transition-colors"
          >
            Open Demo <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#features"
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border border-slate-700 hover:border-slate-500 text-slate-300 rounded-lg transition-colors"
          >
            See features
          </a>
        </div>
        <p className="text-[10px] text-slate-600 mt-8">
          Demonstration only. Not cleared for clinical diagnosis. RUO.
        </p>
      </section>

      {/* ── Headline metrics ────────────────────────────────────────────── */}
      <section className="px-8 py-12 border-y border-slate-800/80 bg-[#0f1623]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { v: '97.75%', l: 'Reported Dice (HC18 199-image cohort)' },
            { v: '1.65 mm', l: 'Mean absolute HC error · within ISUOG ±3 mm' },
            { v: '4 variants', l: 'Static + cine · baseline + compressed' },
            { v: '−43.7%', l: 'Parameter reduction in compressed variants' },
          ].map((m) => (
            <div key={m.l}>
              <div className="text-2xl lg:text-3xl font-bold text-[#5cd5dc] tracking-tight">{m.v}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1.5 leading-snug">{m.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="px-8 py-16 max-w-6xl mx-auto">
        <h2 className="text-2xl lg:text-3xl font-bold text-slate-100 mb-2 tracking-tight">What it does</h2>
        <p className="text-sm text-slate-500 mb-10">
          End-to-end clinical-AI workflow from ultrasound frame to signed structured report.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: <Brain className="w-5 h-5 text-[#0D7680]" />,
              title: 'Skull segmentation + HC measurement',
              body: 'Residual U-Net with deep supervision (Phase 0). Predicted boundary fitted to a Ramanujan-approximated ellipse for HC; Hadlock 1984 for gestational age.',
            },
            {
              icon: <Sparkles className="w-5 h-5 text-[#0D7680]" />,
              title: 'Explainability built-in',
              body: 'Grad-CAM++ overlays show which image regions drove the boundary prediction. MC-dropout uncertainty heatmaps for noisy inputs.',
            },
            {
              icon: <Layers className="w-5 h-5 text-[#0D7680]" />,
              title: 'Multi-model consensus',
              body: 'Run 2–4 variants in parallel on the same image. Combined PDF report with per-model column + consensus, Inter-Model Agreement section, and outlier flags.',
            },
            {
              icon: <FileText className="w-5 h-5 text-[#0D7680]" />,
              title: 'AIUM/ACR-style structured reports',
              body: 'PDF with Patient · Indication · Technical Parameters · Biometric Findings · Growth chart · Impression · Interpretation · Validation · Sign-off · Regulatory.',
            },
            {
              icon: <TrendingUp className="w-5 h-5 text-[#0D7680]" />,
              title: 'Longitudinal growth chart',
              body: 'Patient HC plotted on the Hadlock 1984 reference curve with population ±2 SD band. Multi-visit trends across studies via patient-id matching.',
            },
            {
              icon: <Lock className="w-5 h-5 text-[#0D7680]" />,
              title: 'Sign-off + audit log',
              body: 'DRAFT watermark on unsigned PDFs, removed on sign-off. Append-only audit log with actor IP / user-agent. Verifying-observer block populated in DICOM SR.',
            },
          ].map((f) => (
            <div key={f.title} className="bg-[#0f1623] border border-slate-800 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">{f.icon}</div>
              <div className="text-sm font-semibold text-slate-100 mb-1.5">{f.title}</div>
              <div className="text-xs text-slate-500 leading-relaxed">{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Models ──────────────────────────────────────────────────────── */}
      <section id="models" className="px-8 py-16 border-y border-slate-800/80 bg-[#0f1623]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-100 mb-2 tracking-tight">Four model variants</h2>
          <p className="text-sm text-slate-500 mb-8">
            Pick the model that fits your acquisition mode and deployment footprint.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { tag: 'Phase 0', title: 'Standard · Single Frame', desc: 'Residual U-Net with deep supervision. Production-grade baseline. 8.11 M params · 21.58 GMACs · 97.75 % Dice · 1.65 mm MAE.' },
              { tag: 'Phase 4a', title: 'Express · Single Frame', desc: '−43.7 % parameter reduction via Hybrid Crossover pruning + KD recovery. 4.57 M params · 16.56 GMACs · 97.64 % Dice · 1.76 mm MAE.' },
              { tag: 'Phase 2', title: 'Standard · Cine Loop', desc: '2-D U-Net encoder + temporal self-attention (8 heads, 256-dim) over 16 cine frames. Smooths through transient artefacts.' },
              { tag: 'Phase 4b', title: 'Express · Cine Loop', desc: 'Compressed backbone + TAM preserved. 5.20 M params · 41.6 % smaller. Statistically equivalent to baseline (Wilcoxon p=0.10).' },
            ].map((m) => (
              <div key={m.title} className="bg-[#0b0f1a] border border-slate-800 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-[#0D7680]/15 border border-[#0D7680]/40 text-[#5cd5dc] rounded">
                    {m.tag}
                  </span>
                  <div className="text-sm font-semibold text-slate-100">{m.title}</div>
                </div>
                <div className="text-xs text-slate-500 leading-relaxed">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Exports / interoperability ──────────────────────────────────── */}
      <section id="exports" className="px-8 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl lg:text-3xl font-bold text-slate-100 mb-2 tracking-tight">Hospital interoperability</h2>
        <p className="text-sm text-slate-500 mb-8">
          Three machine-readable export formats next to every PDF — drop into any FHIR
          server or PACS without re-typing the measurement.
        </p>
        <div className="space-y-4">
          {[
            {
              title: 'FHIR R4 Bundle',
              body: 'DiagnosticReport (LOINC 42148-7) + Patient + one Observation per measurement: HC (LOINC 11779-6), BPD (11820-2), GA (18185-9). Status flips preliminary → final on sign-off.',
            },
            {
              title: 'DICOM Comprehensive SR (.dcm)',
              body: 'SOP Class 1.2.840.10008.5.1.4.1.1.88.33. TID 5000-style content tree. Sign-off populates VerifyingObserverSequence and flips PreliminaryFlag → FINAL. Ingests cleanly into DCMTK / Weasis / OHIF.',
            },
            {
              title: 'Mock C-STORE upload',
              body: 'POST /cstore receives any DICOM SR over HTTP, validates the DICM magic, and audit-logs SOP UIDs + patient identifiers + IP / user-agent — interoperability testing without a full DIMSE peer.',
            },
          ].map((e) => (
            <div key={e.title} className="bg-[#0f1623] border border-slate-800 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-slate-100 mb-0.5">{e.title}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{e.body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Compliance ──────────────────────────────────────────────────── */}
      <section id="compliance" className="px-8 py-16 border-y border-slate-800/80 bg-[#0f1623]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-100 mb-2 tracking-tight">Compliance & validation</h2>
          <p className="text-sm text-slate-500 mb-8">
            Every report ships with the references and disclosures clinicians and
            procurement reviewers actually look for.
          </p>
          <ul className="text-xs text-slate-400 space-y-2 leading-relaxed list-disc pl-5">
            <li>HC18 (Radboud UMC, Netherlands) — 1334-image training set / 199-image held-out validation.</li>
            <li>ISUOG Practice Guidelines 2010 — ±3 mm inter-observer HC threshold passed by all four variants.</li>
            <li>Hadlock 1984 (AJR 143:97-100) for gestational-age estimation; Naegele&apos;s rule for EDD; ACOG/ISUOG &gt;14 d discordance flag.</li>
            <li>AIUM/ACR-style structured PDF: Patient · Exam · Indication · Technical Parameters · Biometric Findings · Impression · Interpretation · Validation · Sign-off · Regulatory.</li>
            <li>Sign-off audit log captures actor name + IP + user-agent; signed reports re-rendered without DRAFT watermark.</li>
            <li><b>RUO — research use only.</b> Not cleared for clinical diagnosis. Demonstration only.</li>
          </ul>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section className="px-8 py-16 max-w-4xl mx-auto text-center">
        <h2 className="text-2xl lg:text-3xl font-bold text-slate-100 mb-3 tracking-tight">Open the demo</h2>
        <p className="text-sm text-slate-500 mb-6">
          Pick a demo subject from the worklist, run the AI, and download the PDF / FHIR / DICOM exports.
        </p>
        <Link
          href="/app"
          data-testid="cta-open-demo-footer"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#0D7680] hover:bg-[#0a5f67] text-white rounded-lg transition-colors"
        >
          Open Demo <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="px-8 py-6 border-t border-slate-800/80 bg-[#0f1623] text-center text-[11px] text-slate-600">
        FetalScan AI · Demonstration build · Research use only · Not cleared for clinical diagnosis
      </footer>
    </div>
  );
}
