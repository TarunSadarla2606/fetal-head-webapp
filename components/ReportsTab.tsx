'use client';

import { useState } from 'react';
import type { ApiReport } from '@/lib/types';
import { reportPdfUrl } from '@/lib/api';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  FileSignature,
  FileText,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  reports: ApiReport[];
  loading: boolean;
  error: string | null;
  onSign: (reportId: string, signedBy: string, note: string | undefined) => Promise<void> | void;
  onRefresh: () => void;
  currentStudyName: string;
}

interface SignDialogState {
  reportId: string;
  patientName: string;
  signedBy: string;
  note: string;
  submitting: boolean;
  error: string | null;
}

export default function ReportsTab({
  isOpen,
  onToggle,
  reports,
  loading,
  error,
  onSign,
  onRefresh,
  currentStudyName,
}: Props) {
  const [dialog, setDialog] = useState<SignDialogState | null>(null);

  const submitSign = async () => {
    if (!dialog) return;
    if (!dialog.signedBy.trim()) {
      setDialog({ ...dialog, error: 'Clinician name is required' });
      return;
    }
    setDialog({ ...dialog, submitting: true, error: null });
    try {
      await onSign(dialog.reportId, dialog.signedBy.trim(), dialog.note.trim() || undefined);
      setDialog(null);
    } catch (err) {
      setDialog({
        ...dialog,
        submitting: false,
        error: err instanceof Error ? err.message : 'Sign-off failed',
      });
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
        {currentStudyName && (
          <span className="text-[10px] text-slate-600 normal-case font-normal ml-1">
            · {currentStudyName}
          </span>
        )}
        <span className="ml-auto flex items-center gap-2">
          {isOpen && (
            <button
              data-testid="reports-refresh"
              onClick={(e) => { e.stopPropagation(); onRefresh(); }}
              className="p-0.5 text-slate-600 hover:text-slate-300"
              title="Refresh"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-slate-800 max-h-56 overflow-y-auto">
          {error && (
            <div
              data-testid="reports-error"
              className="flex items-start gap-2 px-4 py-2 text-[11px] bg-red-950/40 border-b border-red-900/60 text-red-400"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {loading && reports.length === 0 ? (
            <p className="px-4 py-6 text-xs text-slate-600 text-center">Loading reports…</p>
          ) : reports.length === 0 ? (
            <p className="px-4 py-6 text-xs text-slate-600 text-center">
              No reports yet for this study.
            </p>
          ) : (
            <table className="w-full text-xs" data-testid="reports-table">
              <thead>
                <tr className="border-b border-slate-800 text-slate-600">
                  <th className="px-4 py-1.5 text-left font-medium">Patient</th>
                  <th className="px-2 py-1.5 text-left font-medium">Date</th>
                  <th className="px-2 py-1.5 text-right font-medium">HC</th>
                  <th className="px-2 py-1.5 text-right font-medium">GA</th>
                  <th className="px-2 py-1.5 text-right font-medium">Model</th>
                  <th className="px-2 py-1.5 text-center font-medium">Status</th>
                  <th className="px-2 py-1.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reports.map((r) => (
                  <ReportRow
                    key={r.id}
                    report={r}
                    onRequestSign={() =>
                      setDialog({
                        reportId: r.id,
                        patientName: r.patient_name,
                        signedBy: '',
                        note: '',
                        submitting: false,
                        error: null,
                      })
                    }
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {dialog && (
        <SignOffDialog
          state={dialog}
          onChange={setDialog}
          onCancel={() => setDialog(null)}
          onSubmit={submitSign}
        />
      )}
    </div>
  );
}

function ReportRow({
  report,
  onRequestSign,
}: {
  report: ApiReport;
  onRequestSign: () => void;
}) {
  const isSigned = report.is_signed;
  return (
    <tr className="hover:bg-slate-800/40" data-testid="report-row" data-signed={isSigned ? '1' : '0'}>
      <td className="px-4 py-2 text-slate-300">{report.patient_name}</td>
      <td className="px-2 py-2 text-slate-500">{report.study_date}</td>
      <td className="px-2 py-2 text-right text-slate-200">
        {report.hc_mm != null ? `${report.hc_mm.toFixed(1)} mm` : '—'}
      </td>
      <td className="px-2 py-2 text-right text-slate-200">{report.ga_str ?? '—'}</td>
      <td className="px-2 py-2 text-right text-slate-600">{report.model}</td>
      <td className="px-2 py-2 text-center">
        {isSigned ? (
          <span
            data-testid="badge-signed"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400"
            title={`Signed by ${report.signed_by ?? ''} at ${report.signed_at ?? ''}`}
          >
            <ShieldCheck className="w-3 h-3" />
            Signed
          </span>
        ) : (
          <span
            data-testid="badge-draft"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold bg-amber-500/10 border border-amber-500/30 rounded text-amber-400"
            title="Unsigned — PDF carries a DRAFT watermark"
          >
            DRAFT
          </span>
        )}
      </td>
      <td className="px-2 py-2 text-right whitespace-nowrap">
        <a
          href={reportPdfUrl(report.id)}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="report-pdf-link"
          className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 mr-2"
          title="Download PDF"
        >
          <Download className="w-3 h-3" /> PDF
        </a>
        {!isSigned && (
          <button
            onClick={onRequestSign}
            data-testid="report-sign-button"
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-[#0D7680]/15 hover:bg-[#0D7680]/30 border border-[#0D7680]/40 text-[#5cd5dc] rounded"
          >
            <FileSignature className="w-3 h-3" /> Sign
          </button>
        )}
      </td>
    </tr>
  );
}

function SignOffDialog({
  state,
  onChange,
  onCancel,
  onSubmit,
}: {
  state: SignDialogState;
  onChange: (s: SignDialogState) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div
      data-testid="signoff-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-[420px] bg-[#0f1623] border border-slate-700 rounded-lg shadow-xl">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
          <FileSignature className="w-4 h-4 text-[#0D7680]" />
          <h3 className="text-sm font-semibold text-slate-200">Clinical Sign-off</h3>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-[11px] text-slate-500 leading-snug">
            Signing finalises the report for{' '}
            <span className="text-slate-300 font-medium">{state.patientName}</span>. The DRAFT
            watermark will be removed and an audit entry will be recorded with your IP and
            user-agent.
          </p>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Clinician
            </label>
            <input
              type="text"
              data-testid="signoff-clinician"
              value={state.signedBy}
              onChange={(e) => onChange({ ...state, signedBy: e.target.value, error: null })}
              placeholder="Dr. Jane Doe, MD"
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0D7680]"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Verification note (clinical)
            </label>
            <textarea
              data-testid="signoff-note"
              value={state.note}
              onChange={(e) =>
                onChange({ ...state, note: e.target.value.slice(0, 300) })
              }
              rows={3}
              maxLength={300}
              placeholder="e.g. HC boundary confirmed at outer calvarium margin. No measurement artifact identified."
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0D7680] resize-none"
            />
            <p className="mt-1 text-[9px] text-slate-600 text-right">
              {state.note.length}/300 characters
            </p>
          </div>
          {state.error && (
            <p data-testid="signoff-error" className="text-[11px] text-red-400">
              {state.error}
            </p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-800">
          <button
            onClick={onCancel}
            disabled={state.submitting}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={state.submitting || !state.signedBy.trim()}
            data-testid="signoff-submit"
            className="px-3 py-1.5 text-xs font-semibold bg-[#0D7680] hover:bg-[#0a5f67] disabled:opacity-50 text-white rounded"
          >
            {state.submitting ? 'Signing…' : 'Sign report'}
          </button>
        </div>
      </div>
    </div>
  );
}
