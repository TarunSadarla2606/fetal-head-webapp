'use client';

import { useState, useCallback } from 'react';
import WorklistSidebar from './WorklistSidebar';
import StudyViewer from './StudyViewer';
import AIFindingsPanel from './AIFindingsPanel';
import ReportsTab from './ReportsTab';
import type { Study, SavedReport, ModelVariant } from '@/lib/types';
import { runInference } from '@/lib/api';
import { INITIAL_STUDIES, DEMO_STUDY_IDS, getDemoFindings, getDemoOverlayImage } from '@/lib/demo-data';

export default function WorkstationView() {
  const [studies, setStudies] = useState<Study[]>(INITIAL_STUDIES);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_STUDIES[0].id);
  const [model, setModel] = useState<ModelVariant>('phase0');
  const [pixelSpacing, setPixelSpacing] = useState(0.2);
  const [threshold, setThreshold] = useState(0.5);
  const [reportsOpen, setReportsOpen] = useState(false);

  const selectedStudy = studies.find(s => s.id === selectedId) ?? studies[0]!;
  const isDemo = DEMO_STUDY_IDS.has(selectedStudy.id);

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
    [selectedId, pixelSpacing, threshold, model]
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
        <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded uppercase tracking-wider">
          Demo
        </span>
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
