'use client';

import type { Study } from '@/lib/types';
import { cn } from '@/lib/utils';
import { User, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const statusIcon = {
  pending: <Clock className="w-3.5 h-3.5 text-slate-500" />,
  analyzing: <Loader2 className="w-3.5 h-3.5 text-[#0D7680] animate-spin" />,
  done: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
  error: <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
};

interface Props {
  studies: Study[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function WorklistSidebar({ studies, selectedId, onSelect }: Props) {
  return (
    <aside className="w-60 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-800">
        <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          Worklist
        </h2>
      </div>
      <ul className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
        {studies.map(study => (
          <li key={study.id}>
            <button
              onClick={() => onSelect(study.id)}
              className={cn(
                'w-full text-left px-3 py-2.5 flex items-start gap-2.5 hover:bg-slate-800/60 transition-colors',
                selectedId === study.id &&
                  'bg-[#0D7680]/10 border-l-2 border-[#0D7680] pl-[10px]'
              )}
            >
              <User className="w-3.5 h-3.5 mt-0.5 text-slate-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-medium text-slate-200 truncate">
                    {study.patientName}
                  </span>
                  {statusIcon[study.status]}
                </div>
                <span className="text-xs text-slate-500">{study.studyDate}</span>
                {study.findings?.hc_mm != null && (
                  <p className="text-xs text-[#0D7680] font-medium mt-0.5">
                    HC {study.findings.hc_mm.toFixed(1)} mm
                  </p>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
