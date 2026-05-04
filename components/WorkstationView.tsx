'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import WorklistSidebar from './WorklistSidebar';
import StudyViewer from './StudyViewer';
import AIFindingsPanel from './AIFindingsPanel';
import CompareView from './CompareView';
import ReportsTab from './ReportsTab';
import type {
  ApiReport,
  CompareResult,
  CreateReportPayload,
  ModelVariant,
  SavedReport,
  Study,
} from '@/lib/types';
import {
  API_BASE,
  createReport,
  getApiHealth,
  listDemoSubjects,
  listReportsForStudy,
  runInference,
  signReport,
} from '@/lib/api';
import { INITIAL_STUDIES, getDemoFindings, getDemoOverlayImage, PLACEHOLDER_SVG_URL } from '@/lib/demo-data';

const ALL_VARIANTS: ModelVariant[] = ['phase0', 'phase2', 'phase4a', 'phase4b'];
const VARIANT_LABEL: Record<ModelVariant, string> = {
  phase0:  'Standard · Single Frame',
  phase2:  'Standard · Cine Loop',
  phase4a: 'Express · Single Frame',
  phase4b: 'Express · Cine Loop',
};

export default function WorkstationView() {
  const [studies, setStudies] = useState<Study[]>(INITIAL_STUDIES);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_STUDIES[0].id);
  const [model, setModel] = useState<ModelVariant>('phase0');
  const [pixelSpacing, setPixelSpacing] = useState(0.2);
  const [threshold, setThreshold] = useState(0.5);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'live' | 'no-models' | 'offline'>('checking');
  const [apiModelCount, setApiModelCount] = useState(0);
  const [compareResults, setCompareResults] = useState<CompareResult[] | null>(null);
  const currentFileRef = useRef<File | null>(null);

  const selectedStudy = studies.find(s => s.id === selectedId) ?? studies[0]!;

  // Check API health on mount — drives the header status badge
  useEffect(() => {
    getApiHealth().then(health => {
      if (!health) { setApiStatus('offline'); return; }
      setApiModelCount(health.models_available.length);
      setApiStatus(health.models_available.length > 0 ? 'live' : 'no-models');
    });
  }, []);

  // On mount: fetch all demo subjects from the API and create studies dynamically.
  // Falls back to INITIAL_STUDIES (synthetic SVGs) when the API is offline.
  useEffect(() => {
    async function loadDemoStudies() {
      const files = await listDemoSubjects();
      if (files.length === 0) return;

      const today = new Date();
      const newStudies: Study[] = files.map((filename, i) => ({
        id: `demo-${String(i + 1).padStart(3, '0')}`,
        patientName: `Demo Subject ${i + 1}`,
        studyDate: new Date(today.getTime() - i * 86400000).toISOString().split('T')[0],
        status: 'pending' as const,
        imageDataUrl: PLACEHOLDER_SVG_URL,
        isDemo: true,
        demoImagePath: filename,
      }));

      setStudies(newStudies);
      setSelectedId(newStudies[0].id);

      // Load actual images asynchronously so the worklist populates progressively
      for (const study of newStudies) {
        try {
          const res = await fetch(`${API_BASE}/demo/${encodeURIComponent(study.demoImagePath!)}`);
          if (!res.ok) continue;
          const blob = await res.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target!.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          setStudies(prev =>
            prev.map(s => s.id === study.id ? { ...s, imageDataUrl: dataUrl } : s)
          );
        } catch {
          // keep placeholder for this study
        }
      }
    }
    loadDemoStudies();
  }, []);

  const handleImageLoad = useCallback((studyId: string, imageDataUrl: string) => {
    setStudies(prev =>
      prev.map(s =>
        s.id === studyId ? { ...s, imageDataUrl, status: 'pending', findings: undefined, errorMessage: undefined, isSynthetic: false } : s
      )
    );
  }, []);

  const handleFileChange = useCallback((file: File | null) => {
    currentFileRef.current = file;
  }, []);

  const handleAnalyze = useCallback(
    async (file: File | null) => {
      setCompareResults(null);
      setStudies(prev =>
        prev.map(s => (s.id === selectedId ? { ...s, status: 'analyzing', errorMessage: undefined, isSynthetic: false } : s))
      );

      if (selectedStudy.isDemo) {
        let lastError: string | undefined;

        // Try real inference via the API
        if (selectedStudy.demoImagePath) {
          try {
            const imgRes = await fetch(`${API_BASE}/demo/${encodeURIComponent(selectedStudy.demoImagePath)}`);
            if (!imgRes.ok) {
              lastError = `Could not fetch demo image (${imgRes.status})`;
            } else {
              const blob = await imgRes.blob();
              const imageFile = new File([blob], selectedStudy.demoImagePath, { type: blob.type });
              const findings = await runInference({
                image: imageFile,
                pixelSpacingMm: pixelSpacing,
                threshold,
                modelVariant: model,
              });
              const overlayDataUrl = findings.overlay_b64
                ? `data:image/png;base64,${findings.overlay_b64}`
                : undefined;
              setStudies(prev =>
                prev.map(s =>
                  s.id === selectedId
                    ? {
                        ...s,
                        status: 'done',
                        findings,
                        analyzedAt: new Date().toISOString(),
                        errorMessage: undefined,
                        isSynthetic: false,
                        ...(overlayDataUrl ? { imageDataUrl: overlayDataUrl } : {}),
                      }
                    : s
                )
              );
              return;
            }
          } catch (err) {
            lastError = err instanceof Error ? err.message : 'Inference failed';
          }
        }

        // Pre-baked fallback: mark isSynthetic=true so the UI clearly shows fabricated values.
        await new Promise(resolve => setTimeout(resolve, 1600));
        const findings = getDemoFindings(selectedId);
        setStudies(prev =>
          prev.map(s => {
            if (s.id !== selectedId) return s;
            const overlayImg = !s.demoImagePath ? getDemoOverlayImage(selectedId) : undefined;
            if (findings) {
              return {
                ...s,
                status: 'done',
                findings,
                analyzedAt: new Date().toISOString(),
                errorMessage: undefined,
                isSynthetic: true,
                ...(overlayImg ? { imageDataUrl: overlayImg } : {}),
              };
            }
            return { ...s, status: 'error', errorMessage: lastError, isSynthetic: false };
          })
        );
        return;
      }

      if (!file) return;
      try {
        const findings = await runInference({
          image: file,
          pixelSpacingMm: pixelSpacing,
          threshold,
          modelVariant: model,
        });
        const overlayDataUrl = findings.overlay_b64
          ? `data:image/png;base64,${findings.overlay_b64}`
          : undefined;
        setStudies(prev =>
          prev.map(s =>
            s.id === selectedId
              ? {
                  ...s,
                  status: 'done',
                  findings,
                  analyzedAt: new Date().toISOString(),
                  errorMessage: undefined,
                  isSynthetic: false,
                  ...(overlayDataUrl ? { imageDataUrl: overlayDataUrl } : {}),
                }
              : s
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Inference failed';
        console.error(err);
        setStudies(prev =>
          prev.map(s => (s.id === selectedId ? { ...s, status: 'error', errorMessage: message } : s))
        );
      }
    },
    [selectedId, selectedStudy, pixelSpacing, threshold, model]
  );

  const handleCompareAll = useCallback(async () => {
    // Initialise all four slots to 'analyzing'
    setCompareResults(
      ALL_VARIANTS.map(v => ({ variant: v, label: VARIANT_LABEL[v], status: 'analyzing' }))
    );

    // Resolve the image file once — fetch from API for demo, use uploaded file otherwise
    let imageFile: File | null = null;
    if (selectedStudy.isDemo && selectedStudy.demoImagePath) {
      try {
        const res = await fetch(`${API_BASE}/demo/${encodeURIComponent(selectedStudy.demoImagePath)}`);
        if (res.ok) {
          const blob = await res.blob();
          imageFile = new File([blob], selectedStudy.demoImagePath, { type: blob.type });
        }
      } catch { /* leave null */ }
    } else {
      imageFile = currentFileRef.current;
    }

    if (!imageFile) {
      setCompareResults(
        ALL_VARIANTS.map(v => ({ variant: v, label: VARIANT_LABEL[v], status: 'error', error: 'Could not load image' }))
      );
      return;
    }

    const file = imageFile;
    // Fire all 4 in parallel; update each slot as it completes
    await Promise.all(
      ALL_VARIANTS.map(async variant => {
        try {
          const findings = await runInference({
            image: file,
            pixelSpacingMm: pixelSpacing,
            threshold,
            modelVariant: variant,
          });
          setCompareResults(prev =>
            prev!.map(r => r.variant === variant ? { ...r, status: 'done', findings } : r)
          );
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Inference failed';
          setCompareResults(prev =>
            prev!.map(r => r.variant === variant ? { ...r, status: 'error', error } : r)
          );
        }
      })
    );
  }, [selectedStudy, pixelSpacing, threshold]);

  // Refetches the currently-selected study's reports from the API.
  // Triggered when the panel opens or after a create / sign mutation.
  const refreshReports = useCallback(async () => {
    if (!selectedStudy) return;
    setReportsLoading(true);
    setReportsError(null);
    try {
      const fetched = await listReportsForStudy(selectedStudy.id);
      setReports(fetched);
    } catch (err) {
      setReportsError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setReportsLoading(false);
    }
  }, [selectedStudy]);

  // Open the panel and refresh whenever the tab toggles open or the study
  // selection changes while the panel is already open.
  useEffect(() => {
    if (reportsOpen) refreshReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportsOpen, selectedStudy?.id]);

  const handleSaveReport = useCallback(
    async (report: Omit<SavedReport, 'id' | 'analyzedAt'>) => {
      if (!selectedStudy) return;
      const payload: CreateReportPayload = {
        finding_id: selectedStudy.findings?.finding_id || undefined,
        patient_name: report.patientName,
        study_date: report.studyDate,
        model: report.model,
        pixel_spacing_mm: pixelSpacing,
        pixel_spacing_dicom_derived: false,
        hc_mm: report.hcMm,
        ga_str: report.gaStr,
        ga_weeks: report.gaWeeks,
        trimester: report.trimester,
        reliability: report.reliability,
        confidence_label: report.confidenceLabel,
        referring_physician: report.referringPhysician,
        patient_id: report.patientId,
        patient_dob: report.patientDob,
        lmp: report.lmp,
        ordering_facility: report.orderingFacility,
        sonographer_name: report.sonographerName,
        clinical_indication: report.clinicalIndication,
        us_approach: report.usApproach,
        image_quality: report.imageQuality,
        report_mode: report.reportMode ?? 'template',
        fetal_presentation: report.fetalPresentation,
        bpd_mm: report.bpdMm,
      };
      try {
        const created = await createReport(selectedStudy.id, payload);
        setReports(prev => [created, ...prev]);
        setReportsOpen(true);
      } catch (err) {
        setReportsError(err instanceof Error ? err.message : 'Failed to save report');
        setReportsOpen(true);
      }
    },
    [selectedStudy, pixelSpacing]
  );

  const handleSignReport = useCallback(
    async (reportId: string, signedBy: string, note: string | undefined) => {
      try {
        const signed = await signReport(reportId, {
          signed_by: signedBy,
          signoff_note: note || undefined,
        });
        setReports(prev => prev.map(r => (r.id === reportId ? signed : r)));
      } catch (err) {
        setReportsError(err instanceof Error ? err.message : 'Failed to sign report');
      }
    },
    []
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0b0f1a]">
      <header className="flex items-center justify-between px-5 h-12 bg-[#0f1623] border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#0D7680] flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold leading-none">F</span>
            </div>
            <span className="text-slate-100 font-semibold text-sm tracking-tight">FetalScan AI</span>
          </div>
          <span className="hidden sm:block text-xs text-slate-600 border-l border-slate-700/60 pl-3">
            Fetal Head Circumference · Clinical Biometry
          </span>
        </div>
        <div className="flex items-center gap-2">
          {apiStatus === 'checking' && (
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-700/40 border border-slate-600/30 text-slate-400 rounded uppercase tracking-wider">
              API…
            </span>
          )}
          {apiStatus === 'live' && (
            <span data-testid="api-status-live" className="px-2 py-0.5 text-[10px] font-semibold bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded uppercase tracking-wider">
              API Live · {apiModelCount} model{apiModelCount !== 1 ? 's' : ''}
            </span>
          )}
          {apiStatus === 'no-models' && (
            <span data-testid="api-status-no-models" className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded uppercase tracking-wider">
              API · No models loaded
            </span>
          )}
          {apiStatus === 'offline' && (
            <span data-testid="api-status-offline" className="px-2 py-0.5 text-[10px] font-semibold bg-red-500/10 border border-red-500/30 text-red-400 rounded uppercase tracking-wider">
              API Offline · Demo mode
            </span>
          )}
          <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded uppercase tracking-wider">
            Demo
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <WorklistSidebar studies={studies} selectedId={selectedId} onSelect={id => { setSelectedId(id); setCompareResults(null); }} />

        {compareResults !== null ? (
          <CompareView
            study={selectedStudy}
            results={compareResults}
            onClose={() => setCompareResults(null)}
          />
        ) : (
          <>
            <StudyViewer
              study={selectedStudy}
              model={model}
              onModelChange={setModel}
              pixelSpacing={pixelSpacing}
              onPixelSpacingChange={setPixelSpacing}
              threshold={threshold}
              onThresholdChange={setThreshold}
              onImageLoad={handleImageLoad}
              onAnalyze={handleAnalyze}
              onCompareAll={handleCompareAll}
              onFileChange={handleFileChange}
              isDemo={selectedStudy.isDemo ?? false}
            />
            <AIFindingsPanel study={selectedStudy} model={model} onSaveReport={handleSaveReport} />
          </>
        )}
      </div>

      <ReportsTab
        isOpen={reportsOpen}
        onToggle={() => setReportsOpen(o => !o)}
        reports={reports}
        loading={reportsLoading}
        error={reportsError}
        onSign={handleSignReport}
        onRefresh={refreshReports}
        currentStudyName={selectedStudy?.patientName ?? ''}
      />
    </div>
  );
}
