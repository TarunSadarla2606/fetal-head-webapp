'use client';

import { useState, useCallback, useEffect } from 'react';
import WorklistSidebar from './WorklistSidebar';
import StudyViewer from './StudyViewer';
import AIFindingsPanel from './AIFindingsPanel';
import ReportsTab from './ReportsTab';
import type { Study, SavedReport, ModelVariant } from '@/lib/types';
import { runInference, listDemoSubjects, getApiHealth, API_BASE } from '@/lib/api';
import { INITIAL_STUDIES, DEMO_STUDY_IDS, getDemoFindings, getDemoOverlayImage } from '@/lib/demo-data';

export default function WorkstationView() {
  const [studies, setStudies] = useState<Study[]>(INITIAL_STUDIES);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_STUDIES[0].id);
  const [model, setModel] = useState<ModelVariant>('phase0');
  const [pixelSpacing, setPixelSpacing] = useState(0.2);
  const [threshold, setThreshold] = useState(0.5);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'live' | 'no-models' | 'offline'>('checking');
  const [apiModelCount, setApiModelCount] = useState(0);

  const selectedStudy = studies.find(s => s.id === selectedId) ?? studies[0]!;
  const isDemo = DEMO_STUDY_IDS.has(selectedStudy.id);

  // Check API health on mount — drives the header status badge
  useEffect(() => {
    getApiHealth().then(health => {
      if (!health) { setApiStatus('offline'); return; }
      setApiModelCount(health.models_available.length);
      setApiStatus(health.models_available.length > 0 ? 'live' : 'no-models');
    });
  }, []);

  // On mount: fetch real demo images from HF Space, replacing synthetic SVGs
  useEffect(() => {
    async function loadDemoImages() {
      const files = await listDemoSubjects();
      if (files.length === 0) return;
      const demoIds = ['demo-001', 'demo-002', 'demo-003'];
      for (let i = 0; i < Math.min(files.length, demoIds.length); i++) {
        const filename = files[i];
        const demoId = demoIds[i];
        try {
          const res = await fetch(`${API_BASE}/demo/${encodeURIComponent(filename)}`);
          if (!res.ok) continue;
          const blob = await res.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target!.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          setStudies(prev =>
            prev.map(s =>
              s.id === demoId ? { ...s, imageDataUrl: dataUrl, demoImagePath: filename } : s
            )
          );
        } catch {
          // keep synthetic SVG fallback
        }
      }
    }
    loadDemoImages();
  }, []);

  const handleImageLoad = useCallback((studyId: string, imageDataUrl: string) => {
    setStudies(prev =>
      prev.map(s =>
        s.id === studyId ? { ...s, imageDataUrl, status: 'pending', findings: undefined } : s
      )
    );
  }, []);

  const handleAnalyze = useCallback(
    async (file: File | null) => {
      setStudies(prev =>
        prev.map(s => (s.id === selectedId ? { ...s, status: 'analyzing' } : s))
      );

      if (DEMO_STUDY_IDS.has(selectedId)) {
        // Try real inference using the actual HF Space demo image
        if (selectedStudy.demoImagePath) {
          try {
            const res = await fetch(`${API_BASE}/demo/${encodeURIComponent(selectedStudy.demoImagePath)}`);
            if (res.ok) {
              const blob = await res.blob();
              const imageFile = new File([blob], selectedStudy.demoImagePath, { type: blob.type });
              const findings = await runInference({
                image: imageFile,
                pixelSpacingMm: pixelSpacing,
                threshold,
                modelVariant: model,
              });
              setStudies(prev =>
                prev.map(s =>
                  s.id === selectedId ? { ...s, status: 'done', findings } : s
                )
              );
              return;
            }
          } catch {
            // fall through to pre-baked
          }
        }

        // Pre-baked fallback (used when HF Space is cold / unavailable)
        await new Promise(resolve => setTimeout(resolve, 1600));
        const findings = getDemoFindings(selectedId);
        const overlayImg = getDemoOverlayImage(selectedId);
        setStudies(prev =>
          prev.map(s =>
            s.id === selectedId
              ? {
                  ...s,
                  status: findings ? 'done' : 'error',
                  findings,
                  imageDataUrl: findings ? overlayImg : s.imageDataUrl,
                }
              : s
          )
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
        setStudies(prev =>
          prev.map(s => (s.id === selectedId ? { ...s, status: 'done', findings } : s))
        );
      } catch (err) {
        console.error(err);
        setStudies(prev =>
          prev.map(s => (s.id === selectedId ? { ...s, status: 'error' } : s))
        );
      }
    },
    [selectedId, selectedStudy, pixelSpacing, threshold, model]
  );

  const handleSaveReport = useCallback(
    (report: Omit<SavedReport, 'id' | 'analyzedAt'>) => {
      const saved: SavedReport = {
        ...report,
        id: crypto.randomUUID(),
        analyzedAt: new Date().toISOString(),
      };
      try {
        const existing = JSON.parse(
          localStorage.getItem('fetalscan_reports') ?? '[]'
        ) as SavedReport[];
        localStorage.setItem('fetalscan_reports', JSON.stringify([saved, ...existing]));
      } catch {
        // localStorage unavailable
      }
      setReportsOpen(true);
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
        <WorklistSidebar studies={studies} selectedId={selectedId} onSelect={setSelectedId} />
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
          isDemo={isDemo}
        />
        <AIFindingsPanel study={selectedStudy} model={model} onSaveReport={handleSaveReport} />
      </div>

      <ReportsTab isOpen={reportsOpen} onToggle={() => setReportsOpen(o => !o)} />
    </div>
  );
}
