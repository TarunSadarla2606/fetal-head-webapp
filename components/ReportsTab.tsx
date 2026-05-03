'use client';

import { useState, useEffect } from 'react';
import type { SavedReport } from '@/lib/types';
import { FileText, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onToggle: () => void;
}

export default function ReportsTab({ isOpen, onToggle }: Props) {
  const [reports, setReports] = useState<SavedReport[]>([]);

  useEffect(() => {
    try {
      setReports(JSON.parse(localStorage.getItem('fetalscan_reports') ?? '[]'));
    } catch {
      // ignore
    }
  }, [isOpen]);

  const deleteReport = (id: string) => {
    const updated = reports.filter(r => r.id !== id);
    setReports(updated);
    try {
      localStorage.setItem('fetalscan_reports', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  return (
    <div className="shrink-0 bg-slate-900 border-t border-slate-800">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors"
      >
        <FileText className="w-3.5 h-3.5" />
        <span className="font-semibold uppercase tracking-widest">Reports</span>
        {reports.length > 0 && (
          <span className="ml-0.5 px-1.5 py-0.5 bg-[#0D7680] text-white rounded-full text-[10px] font-bold leading-none">
            {reports.length}
          </span>
        )}
        <span className="ml-auto">
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5" />
          )}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-slate-800 max-h-44 overflow-y-auto">
          {reports.length === 0 ? (
            <p className="px-4 py-6 text-xs text-slate-600 text-center">No saved reports yet.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-600">
                  <th className="px-4 py-1.5 text-left font-medium">Patient</th>
                  <th className="px-2 py-1.5 text-left font-medium">Date</th>
                  <th className="px-2 py-1.5 text-right font-medium">HC</th>
                  <th className="px-2 py-1.5 text-right font-medium">GA</th>
                  <th className="px-2 py-1.5 text-right font-medium">Reliability</th>
                  <th className="px-2 py-1.5 text-right font-medium">Model</th>
                  <th className="px-2 py-1.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reports.map(r => (
                  <tr key={r.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-2 text-slate-300">{r.patientName}</td>
                    <td className="px-2 py-2 text-slate-500">{r.studyDate}</td>
                    <td className="px-2 py-2 text-right text-slate-200">{r.hcMm.toFixed(1)} mm</td>
                    <td className="px-2 py-2 text-right text-slate-200">{r.gaStr || '—'}</td>
                    <td className="px-2 py-2 text-right text-slate-500">
                      {r.confidenceLabel} ({Math.round(r.reliability * 100)}%)
                    </td>
                    <td className="px-2 py-2 text-right text-slate-600">{r.model}</td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => deleteReport(r.id)}
                        className="text-slate-700 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
