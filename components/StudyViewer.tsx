'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import type { Study, ModelVariant } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Upload, Play, Loader2 } from 'lucide-react';

const MODEL_OPTIONS: { value: ModelVariant; label: string }[] = [
  { value: 'phase0', label: 'Phase 0 (GA detection)' },
  { value: 'phase2', label: 'Phase 2 (Segmentation)' },
  { value: 'phase4a', label: 'Phase 4a (Refined HC)' },
  { value: 'phase4b', label: 'Phase 4b (Full pipeline)' },
];

interface Props {
  study: Study;
  model: ModelVariant;
  onModelChange: (m: ModelVariant) => void;
  pixelSpacing: number;
  onPixelSpacingChange: (v: number) => void;
  threshold: number;
  onThresholdChange: (v: number) => void;
  onImageLoad: (studyId: string, dataUrl: string) => void;
  onAnalyze: (file: File) => void;
}

export default function StudyViewer({
  study,
  model,
  onModelChange,
  pixelSpacing,
  onPixelSpacingChange,
  threshold,
  onThresholdChange,
  onImageLoad,
  onAnalyze,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const src = study.findings?.overlay_b64
      ? `data:image/png;base64,${study.findings.overlay_b64}`
      : study.imageDataUrl ?? null;

    if (!src) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
    };
    img.src = src;
  }, [study.imageDataUrl, study.findings?.overlay_b64]);

  const loadFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      setCurrentFile(file);
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result;
        if (typeof result === 'string') onImageLoad(study.id, result);
      };
      reader.readAsDataURL(file);
    },
    [study.id, onImageLoad]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) loadFile(file);
    },
    [loadFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadFile(file);
    },
    [loadFile]
  );

  const isAnalyzing = study.status === 'analyzing';
  const canRun = currentFile != null && !isAnalyzing;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
      <div className="flex flex-wrap items-center gap-2 px-3 py-1.5 bg-slate-900 border-b border-slate-800 shrink-0">
        <select
          value={model}
          onChange={e => onModelChange(e.target.value as ModelVariant)}
          className="text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#0D7680]"
        >
          {MODEL_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-1 text-xs text-slate-500">
          px spacing
          <input
            type="number"
            value={pixelSpacing}
            min={0.01}
            max={2}
            step={0.01}
            onChange={e => onPixelSpacingChange(Number(e.target.value))}
            className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0D7680]"
          />
          mm/px
        </label>

        <label className="flex items-center gap-1 text-xs text-slate-500">
          threshold
          <input
            type="number"
            value={threshold}
            min={0.1}
            max={0.9}
            step={0.05}
            onChange={e => onThresholdChange(Number(e.target.value))}
            className="w-14 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0D7680]"
          />
        </label>

        <button
          onClick={() => {
            if (currentFile && !isAnalyzing) onAnalyze(currentFile);
          }}
          disabled={!canRun}
          className={cn(
            'ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors',
            canRun
              ? 'bg-[#0D7680] hover:bg-[#0a5f67] text-white'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          )}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing…
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" /> Run AI
            </>
          )}
        </button>
      </div>

      <div
        className="flex-1 overflow-auto flex items-center justify-center p-4 relative"
        onDrop={handleDrop}
        onDragOver={e => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
      >
        {study.imageDataUrl ? (
          <>
            <canvas ref={canvasRef} className="block max-w-full max-h-full" />
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-4 right-4 flex items-center gap-1 px-2 py-1.5 text-xs bg-slate-800/80 border border-slate-700 rounded hover:bg-slate-700 transition-colors text-slate-400"
            >
              <Upload className="w-3 h-3" /> Replace
            </button>
          </>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className={cn(
              'flex flex-col items-center gap-3 px-12 py-14 border-2 border-dashed rounded-xl transition-colors',
              isDragging
                ? 'border-[#0D7680] text-slate-300'
                : 'border-slate-700 text-slate-600 hover:border-[#0D7680] hover:text-slate-400'
            )}
          >
            <Upload className="w-10 h-10" />
            <div className="text-sm text-center">
              <p className="font-medium">Upload ultrasound image</p>
              <p className="text-xs mt-1">Drop here or click to browse · JPEG / PNG</p>
            </div>
          </button>
        )}

        {isDragging && study.imageDataUrl && (
          <div className="absolute inset-0 bg-[#0D7680]/10 border-2 border-[#0D7680] rounded pointer-events-none flex items-center justify-center">
            <span className="text-[#0D7680] font-semibold text-sm">Drop to replace</span>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
