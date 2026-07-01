"use client";

import { useI18n } from "@/components/locale-provider";
import { formatMessage } from "@/lib/i18n";
import { WitnessReport } from "@/lib/types";

interface WitnessReportPanelProps {
  report: WitnessReport;
  onClose: () => void;
}

export function WitnessReportPanel({ report, onClose }: WitnessReportPanelProps) {
  const { m } = useI18n();
  const w = m.witness;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/55 p-4 backdrop-blur-sm sm:items-center">
      <div className="signal-panel w-full max-w-md rounded-[24px] p-5 sm:p-6">
        <p className="text-[10px] font-medium text-cyan-100/45">{w.eyebrow}</p>
        <h3 className="display-font mt-2 text-xl text-white">{w.title}</h3>
        <p className="mt-4 text-sm leading-6 text-white/68">{report.insight}</p>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/60">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-white/35">{w.you}</div>
            <div className="mt-1 text-white/85">{report.selfMessages}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-white/35">{w.peer}</div>
            <div className="mt-1 text-white/85">{report.peerMessages}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-white/35">{w.questions}</div>
            <div className="mt-1 text-white/85">{Math.round(report.questionRatio * 100)}%</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-white/35">{w.pauses}</div>
            <div className="mt-1 text-white/85">{report.longPauseCount}</div>
          </div>
        </div>

        <p className="mt-4 text-sm text-white/55">
          {formatMessage(w.balance, { value: w.balances[report.balance] })}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/75"
        >
          {w.close}
        </button>
      </div>
    </div>
  );
}
