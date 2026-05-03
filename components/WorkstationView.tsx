'use client';

import { useState, useCallback } from 'react';
import WorklistSidebar from './WorklistSidebar';
import StudyViewer from './StudyViewer';
import AIFindingsPanel from './AIFindingsPanel';
import ReportsTab from './ReportsTab';
import type { Study, SavedReport, ModelVariant } from '@/lib/types';
import { runInference } from '@/lib/api';

const INITIAL_STUDIES: Study[] = [
  { id: 'study-001', patientName: 'Patient A', studyDate: '2026-05-03', status: 'pending' },
  { id: 'study-002', patientName: 'Patient B', studyDate: '2026-05-02', status: 'pending' },
  { id: 'study-003', patientName: 'Patient C', studyDate: '2026-05-01', status: 'pending' },
];

export default function WorkstationView() {
  const [studies, setStudies] = useState<Study[]>(INITIAL_STUDIES);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_STUDIES[0].id);
  const [model, setModel] = useState<ModelVariant>('phase0');
  const [pixelSpacing, setPixelSpacing] = useState(0.2);
  const [threshold, setThreshold] = useState(0.5);
  const [reportsOpen, setReportsOpen] = useState(false);

  const selectedStudy = studies.find(s => s.id === selectedId) ?? studies[0]!;

  const handleImageLoad = useCallback((studyId: string, imageDataUrl: string) => {
    setStudies(prev =>
      prev.map(s =>
        s.id === studyId ? { ...s, imageDataUrl, status: 'pending', findings: undefined } : s
      )
    );
  }, []);

  const handleAnalyze = useCallback(
    async (file: File) => {
      setStudies(prev =>
        prev.map(s => (s.id === selectedId ? { ...s, status: 'analyzing' } : s))
      );
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
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950">
      <header className="flex items-center justify-between px-4 h-11 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[#0D7680] font-bold text-base tracking-tight">FetalScan AI</span>
          <span className="text-xs text-slate-500 hidden sm:block">Fetal HC Measurement</span>
        </div>
        <span className="ruo-badge">⚠ Research Use Only</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <WorklistSidebar
          studies={studies}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
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
        />
        <AIFindingsPanel
          study={selectedStudy}
          model={model}
          onSaveReport={handleSaveReport}
        />
      </div>

      <ReportsTab isOpen={reportsOpen} onToggle={() => setReportsOpen(o => !o)} />
    </div>
  );
}
