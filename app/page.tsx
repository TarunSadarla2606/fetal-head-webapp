import Link from 'next/link';
import {
  ArrowRight,
  ExternalLink,
  MapPin,
  Activity,
  AlertCircle,
  Upload,
  BarChart2,
  FileText,
  Cpu,
  Shield,
  Eye,
  ClipboardList,
  CheckCircle2,
  Github,
  Linkedin,
  Mail,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col bg-[#0b0f1a] text-slate-200 min-h-screen">

      {/* ─── NAV ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-5 sm:px-8 h-14 border-b border-slate-800/80 bg-[#0b0f1a]/95 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-[#0891b2] flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold leading-none">F</span>
          </div>
          <div>
            <span className="text-slate-100 font-semibold text-sm tracking-tight">FetalScan AI</span>
            <span className="hidden sm:inline text-[10px] text-slate-600 border-l border-slate-700/60 ml-3 pl-3 uppercase tracking-wider">
              Research Use Only
            </span>
          </div>
        </div>
        <nav className="flex items-center gap-5">
          <a href="#problem" className="hidden md:block text-xs text-slate-400 hover:text-slate-200 transition-colors">Clinical Problem</a>
          <a href="#how" className="hidden md:block text-xs text-slate-400 hover:text-slate-200 transition-colors">How It Works</a>
          <a href="#validation" className="hidden md:block text-xs text-slate-400 hover:text-slate-200 transition-colors">Validation</a>
          <a
            href="https://github.com/TarunSadarla2606/fetal-head-clinical-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Github className="w-3.5 h-3.5" /> GitHub
          </a>
          <Link
            href="/app"
            data-testid="cta-open-demo-nav"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#0891b2] hover:bg-[#0e7490] text-white rounded transition-colors"
          >
            Try Demo <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </nav>
      </header>

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="w-full max-w-5xl mx-auto px-5 sm:px-8 pt-16 sm:pt-20 lg:pt-28 pb-12 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider bg-[#0891b2]/10 border border-[#0891b2]/30 text-[#22d3ee] rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee] animate-pulse" />
          Live on Hugging Face Spaces
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-100 leading-tight tracking-tight mb-6">
          Fetal Head Biometry AI &mdash;{' '}
          <span className="text-[#22d3ee]">
            From Ultrasound to Signed Clinical Report
          </span>{' '}
          in 60 Seconds
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mb-9 leading-relaxed">
          A research-grade AI pipeline built for real clinical workflows.
          ISUOG-validated, FHIR-ready, deployable on edge hardware.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-14">
          <Link
            href="/app"
            data-testid="cta-open-demo-hero"
            className="flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-[#0891b2] hover:bg-[#0e7490] text-white rounded-lg transition-colors shadow-lg shadow-[#0891b2]/20"
          >
            Try Live Demo <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://github.com/TarunSadarla2606/fetal-head-clinical-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 text-sm font-semibold border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-slate-100 rounded-lg transition-colors"
          >
            <Github className="w-4 h-4" /> View on GitHub
          </a>
        </div>

        {/* Metric strip */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-slate-800/60 rounded-xl overflow-hidden border border-slate-800/60">
          {[
            { value: '97.75%',    label: 'Dice · HC18 validation' },
            { value: '1.65 mm',   label: 'Mean absolute HC error' },
            { value: 'ISUOG ✓',  label: 'Passes ±3 mm threshold' },
            { value: '4 Variants', label: 'Static + cine · baseline + edge' },
            { value: 'FHIR R4',   label: '+ DICOM SR exports' },
            { value: '178 Tests', label: 'Playwright E2E passing' },
          ].map((m) => (
            <div key={m.value} className="bg-[#0f1623] px-4 py-4 flex flex-col items-center text-center">
              <span className="text-base sm:text-lg font-bold text-[#22d3ee] tracking-tight">{m.value}</span>
              <span className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5 leading-snug">{m.label}</span>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-slate-600 mt-5">
          Demonstration only &middot; Not cleared for clinical diagnosis &middot; RUO
        </p>
      </section>

      {/* ─── CLINICAL PROBLEM ─────────────────────────────────────────────── */}
      <section id="problem" className="border-y border-slate-800/80 bg-[#0f1623]">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16 lg:py-20">
          <div className="text-center mb-12">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#22d3ee] mb-3">Why This Matters</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-100 tracking-tight">
              The access gap in prenatal care is a solvable engineering problem
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <MapPin className="w-6 h-6 text-[#0891b2]" />,
                stat: '35%',
                headline: 'of US counties are maternity care deserts',
                body: '2.3 million women lack access to specialist prenatal care. Fetal biometry is performed by general sonographers without specialist oversight.',
              },
              {
                icon: <Activity className="w-6 h-6 text-amber-400" />,
                stat: '3–5 mm',
                headline: 'inter-sonographer HC variability in routine scans',
                body: 'Near the ISUOG ±3 mm clinical acceptance threshold. AI-assisted measurement delivers consistent, auditable results regardless of operator experience.',
              },
              {
                icon: <AlertCircle className="w-6 h-6 text-red-400" />,
                stat: '30–50%',
                headline: 'CHD detection at community centres vs 90% at specialist sites',
                body: 'Structured reporting with quantitative biometry and explainable AI narrows the quality gap between community and specialist prenatal scans.',
              },
            ].map((c) => (
              <div key={c.stat} className="bg-[#0b0f1a] border border-slate-800 rounded-xl p-6">
                <div className="mb-4">{c.icon}</div>
                <div className="text-4xl font-black text-slate-100 tracking-tight mb-1.5">{c.stat}</div>
                <div className="text-sm font-semibold text-slate-300 mb-2 leading-snug">{c.headline}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{c.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how" className="max-w-5xl mx-auto px-5 sm:px-8 py-16 lg:py-20 w-full">
        <div className="text-center mb-12">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#22d3ee] mb-3">End-to-End Pipeline</p>
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-100 tracking-tight">
            From image to signed report &mdash; no manual steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              icon: <Upload className="w-7 h-7 text-[#0891b2]" />,
              title: 'Upload ultrasound frame',
              body: 'Drop a JPEG / PNG frame or connect via REST API. A Residual U-Net with deep supervision segments the fetal skull boundary in real time with GradCAM++ overlay.',
            },
            {
              step: '02',
              icon: <BarChart2 className="w-7 h-7 text-[#0891b2]" />,
              title: 'Automated HC → gestational age',
              body: 'Predicted boundary is fitted to a Ramanujan-approximated ellipse for HC. GA estimated via Hadlock 1984 polynomial and cross-checked against LMP with ACOG/ISUOG discordance flagging.',
            },
            {
              step: '03',
              icon: <FileText className="w-7 h-7 text-[#0891b2]" />,
              title: 'One-click clinical report',
              body: 'AIUM/ACR-style PDF · FHIR R4 DiagnosticReport · DICOM Comprehensive SR — all generated automatically. Ready for EHR ingestion, PACS upload, or clinical sign-off.',
            },
          ].map((s, i) => (
            <div key={s.step} className="relative bg-[#0f1623] border border-slate-800 rounded-xl p-6">
              <div className="text-[10px] font-bold text-[#0891b2] tracking-[0.2em] uppercase mb-4">Step {s.step}</div>
              <div className="mb-4">{s.icon}</div>
              <div className="text-sm font-semibold text-slate-100 mb-2">{s.title}</div>
              <div className="text-xs text-slate-500 leading-relaxed">{s.body}</div>
              {i < 2 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 items-center justify-center rounded-full bg-[#0b0f1a] border border-slate-700">
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── WHAT MAKES THIS DIFFERENT ────────────────────────────────────── */}
      <section className="border-y border-slate-800/80 bg-[#0f1623]">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16 lg:py-20">
          <div className="text-center mb-12">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#22d3ee] mb-3">Engineering Depth</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-100 tracking-tight">
              Built for clinical deployment, not academic benchmarks
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                icon: <Cpu className="w-5 h-5 text-[#0891b2]" />,
                badge: 'Edge Deployment',
                title: 'Model Compression for Cart-Side Tablets',
                body: 'Phase 4a achieves 43.7% parameter reduction via Hybrid Crossover structured pruning + knowledge distillation recovery. 4.57 M params, 16.56 GMACs — deployable on cart-side hardware without cloud dependency. Statistically equivalent to baseline (Wilcoxon p = 0.10).',
              },
              {
                icon: <Shield className="w-5 h-5 text-amber-400" />,
                badge: 'Clinical Safety',
                title: 'Uncertainty Quantification Before Reporting',
                body: 'MC-Dropout inference produces per-pixel confidence intervals. Out-of-distribution detection flags inputs outside the HC18 training distribution before a report is generated — not after the clinician has already acted.',
              },
              {
                icon: <Eye className="w-5 h-5 text-emerald-400" />,
                badge: 'Explainability',
                title: 'GradCAM++ — Not a Black Box',
                body: 'Gradient-weighted class activation maps overlay the image with exactly which skull regions drove the boundary prediction. Clinicians can validate the AI decision before signing off, satisfying IEC 62304 traceability requirements.',
              },
              {
                icon: <ClipboardList className="w-5 h-5 text-purple-400" />,
                badge: 'Clinical Governance',
                title: 'Full Audit Trail',
                body: 'Every sign-off logged with actor name, timestamp, IP address, and user-agent. DRAFT watermark removed only on authenticated sign-off. VerifyingObserverSequence populated in DICOM SR, PreliminaryFlag flipped FINAL.',
              },
            ].map((f) => (
              <div key={f.title} className="bg-[#0b0f1a] border border-slate-800 rounded-xl p-5 flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-slate-800/60 flex items-center justify-center">
                  {f.icon}
                </div>
                <div className="min-w-0">
                  <span className="inline-block text-[9px] font-semibold uppercase tracking-wider text-slate-500 border border-slate-700 rounded px-1.5 py-0.5 mb-2">
                    {f.badge}
                  </span>
                  <div className="text-sm font-semibold text-slate-100 mb-1.5">{f.title}</div>
                  <div className="text-xs text-slate-500 leading-relaxed">{f.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VALIDATION ───────────────────────────────────────────────────── */}
      <section id="validation" className="max-w-5xl mx-auto px-5 sm:px-8 py-16 lg:py-20 w-full">
        <div className="text-center mb-10">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#22d3ee] mb-3">Reproducible Results</p>
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-100 tracking-tight">
            Technical validation
          </h2>
        </div>

        <div className="space-y-3">
          <details className="group bg-[#0f1623] border border-slate-800 rounded-xl overflow-hidden">
            <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-sm font-semibold text-slate-200 hover:text-slate-100 list-none [&::-webkit-details-marker]:hidden">
              Segmentation accuracy — HC18 held-out test set (199 images)
              <svg className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-5 pb-5 pt-1 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { m: 'Dice',            v: '97.75%',    note: 'Phase 0 baseline' },
                  { m: 'HC MAE',          v: '1.65 mm',   note: 'vs ISUOG ±3 mm limit' },
                  { m: 'HC MAE Phase 4a', v: '1.76 mm',   note: 'compressed — within ISUOG' },
                  { m: 'Dataset',         v: '1,334 / 199', note: 'train / held-out test' },
                ].map((r) => (
                  <div key={r.m} className="bg-slate-800/40 rounded-lg p-3">
                    <div className="text-[9px] uppercase tracking-wider text-slate-500 mb-1">{r.m}</div>
                    <div className="text-base font-bold text-slate-100">{r.v}</div>
                    <div className="text-[9px] text-slate-600 mt-0.5">{r.note}</div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-600">
                Source: HC18 Grand Challenge, Radboud University Medical Centre, Netherlands.
                Baseline architecture: Residual U-Net with deep supervision.
              </p>
            </div>
          </details>

          <details className="group bg-[#0f1623] border border-slate-800 rounded-xl overflow-hidden">
            <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-sm font-semibold text-slate-200 hover:text-slate-100 list-none [&::-webkit-details-marker]:hidden">
              Model compression — Phase 4a (single-frame) vs baseline
              <svg className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-5 pb-5 pt-1 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { m: 'Parameters',   v: '−43.7%',          note: '8.11M → 4.57M' },
                  { m: 'GMACs',        v: '−23.3%',          note: '21.58 → 16.56' },
                  { m: 'Method',       v: 'Hybrid Crossover', note: 'Pruning + KD recovery' },
                  { m: 'Significance', v: 'p = 0.10',         note: 'Wilcoxon rank-sum, n.s.' },
                ].map((r) => (
                  <div key={r.m} className="bg-slate-800/40 rounded-lg p-3">
                    <div className="text-[9px] uppercase tracking-wider text-slate-500 mb-1">{r.m}</div>
                    <div className="text-base font-bold text-slate-100">{r.v}</div>
                    <div className="text-[9px] text-slate-600 mt-0.5">{r.note}</div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-600">
                Phase 4b (cine-loop compressed): 5.20 M params · statistically equivalent to Phase 2 baseline (p = 0.10).
              </p>
            </div>
          </details>

          <details className="group bg-[#0f1623] border border-slate-800 rounded-xl overflow-hidden">
            <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-sm font-semibold text-slate-200 hover:text-slate-100 list-none [&::-webkit-details-marker]:hidden">
              Clinical standards compliance
              <svg className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-5 pb-5 pt-2">
              <ul className="space-y-2">
                {[
                  'ISUOG Practice Guidelines 2010 — all four model variants pass the ±3 mm inter-observer HC threshold on the held-out test set',
                  'Hadlock 1984 (AJR 143:97-100) — gestational age estimation polynomial + growth chart reference curve with population ±2 SD band',
                  'FHIR R4 — DiagnosticReport (LOINC 42148-7), HC Observation (11779-6), BPD (11820-2), GA (18185-9); status flips preliminary → final on sign-off',
                  'DICOM Comprehensive SR — SOP Class 1.2.840.10008.5.1.4.1.1.88.33; VerifyingObserverSequence populated on sign-off; ingests into DCMTK / Weasis / OHIF',
                  'AIUM/ACR report structure — Patient · Exam · Indication · Technical Parameters · Biometric Findings · Impression · Interpretation · Validation · Sign-off · Regulatory',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </div>

        <div className="text-center mt-6">
          <a
            href="https://github.com/TarunSadarla2606/fetal-head-clinical-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[#22d3ee] hover:text-[#0891b2] transition-colors"
          >
            Full metrics, training code &amp; eval scripts on GitHub <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </section>

      {/* ─── STACK ────────────────────────────────────────────────────────── */}
      <section className="border-y border-slate-800/80 bg-[#0f1623]">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-6 text-center">Built with</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'PyTorch', 'FastAPI', 'Next.js 15', 'FHIR R4',
              'DICOM SR', 'Docker', 'Hugging Face Spaces', 'Vercel',
              'ReportLab', 'Playwright', 'Tailwind CSS', 'TypeScript',
            ].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800/60 border border-slate-700/60 text-slate-300 rounded-lg"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ABOUT / CTA ──────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16 lg:py-20 w-full text-center">
        <div className="w-14 h-14 rounded-full bg-[#0891b2]/10 border border-[#0891b2]/30 flex items-center justify-center mx-auto mb-5">
          <span className="text-xl font-bold text-[#0891b2]">TS</span>
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-1.5">Tarun Sadarla</h2>
        <p className="text-sm text-slate-400 mb-1">
          MS Artificial Intelligence (Biomedical) &middot; University of North Texas, 2026
        </p>
        <p className="text-xs text-slate-500 mb-8 max-w-lg mx-auto leading-relaxed">
          Open to roles in medical imaging AI &mdash; clinical decision support,
          ML infrastructure, and AI at the point of care.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <a
            href="https://linkedin.com/in/tarunsadarla"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold border border-slate-700 hover:border-[#0891b2] hover:text-[#22d3ee] text-slate-400 rounded-lg transition-colors"
          >
            <Linkedin className="w-3.5 h-3.5" /> LinkedIn
          </a>
          <a
            href="https://github.com/TarunSadarla2606"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold border border-slate-700 hover:border-[#0891b2] hover:text-[#22d3ee] text-slate-400 rounded-lg transition-colors"
          >
            <Github className="w-3.5 h-3.5" /> GitHub
          </a>
          <a
            href="mailto:tarun@example.com"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold border border-slate-700 hover:border-[#0891b2] hover:text-[#22d3ee] text-slate-400 rounded-lg transition-colors"
          >
            <Mail className="w-3.5 h-3.5" /> Email
          </a>
        </div>

        <Link
          href="/app"
          data-testid="cta-open-demo-footer"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-[#0891b2] hover:bg-[#0e7490] text-white rounded-lg transition-colors shadow-lg shadow-[#0891b2]/20"
        >
          Try the Live Demo <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="px-5 sm:px-8 py-5 border-t border-slate-800/80 bg-[#0f1623] text-center text-[10px] text-slate-600">
        FetalScan AI &middot; Demonstration build &middot; Research use only &middot; Not cleared for clinical diagnosis
        <span className="mx-2">&middot;</span>
        <a
          href="https://github.com/TarunSadarla2606/fetal-head-clinical-ai"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-slate-400 transition-colors"
        >
          Source on GitHub
        </a>
      </footer>

      {/* Mobile-only Try Demo FAB */}
      <Link
        href="/app"
        data-testid="mobile-fab-demo"
        className="fixed bottom-6 right-6 z-50 flex md:hidden items-center gap-2 px-5 py-3.5 text-sm font-bold bg-[#0891b2] hover:bg-[#0e7490] text-white rounded-full shadow-xl shadow-black/50 active:scale-95 transition-all"
      >
        Try Demo <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
