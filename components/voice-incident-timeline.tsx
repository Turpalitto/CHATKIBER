"use client";

import { useI18n } from "@/components/locale-provider";
import { VoiceIncidentEvent } from "@/lib/types";

interface VoiceIncidentTimelineProps {
  incidents: VoiceIncidentEvent[];
}

export function VoiceIncidentTimeline({ incidents }: VoiceIncidentTimelineProps) {
  const { m } = useI18n();
  const recent = incidents.slice(-6).reverse();

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-white/35">{m.voice.incident.title}</div>
      {recent.length === 0 ? (
        <div className="text-sm text-white/40">{m.voice.incident.empty}</div>
      ) : (
        <div className="space-y-3">
          {recent.map((incident, index) => (
            <div key={`${incident.createdAt}-${index}`} className="flex gap-3">
              <div className={`mt-1 h-2.5 w-2.5 rounded-full ${incident.level === "critical" ? "bg-red-300" : incident.level === "warn" ? "bg-orange-300" : "bg-cyan-300"}`} />
              <div className="flex-1">
                <div className="text-xs uppercase tracking-[0.18em] text-white/34">
                  {new Date(incident.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </div>
                <div className="mt-1 text-sm text-white">{incident.title}</div>
                <div className="mt-1 text-sm leading-6 text-white/55">{incident.details}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
