"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/components/locale-provider";
import { formatMessage } from "@/lib/i18n";
import { filterChannelTags, getPopularChannelTags } from "@/lib/channels/tags";

interface ChannelTagBrowserProps {
  channelStats: Record<string, number>;
  onSelect: (tagId: string) => void;
  labels: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    popular: string;
    all: string;
    empty: string;
    listeners: string;
  };
  customChannels?: Array<{ id: string; label: string; prompt: string }>;
}

export function ChannelTagBrowser({ channelStats, onSelect, labels, customChannels = [] }: ChannelTagBrowserProps) {
  const { locale } = useI18n();
  const [query, setQuery] = useState("");
  const popular = useMemo(() => getPopularChannelTags(10, channelStats), [channelStats]);
  const filtered = useMemo(() => filterChannelTags(query, locale), [locale, query]);

  return (
    <div className="signal-panel rounded-[28px] p-5 sm:p-6">
      <div className="mb-4 text-center sm:text-left">
        <h3 className="display-font text-xl text-white sm:text-2xl">{labels.title}</h3>
        <p className="mt-2 text-sm leading-6 text-white/55">{labels.subtitle}</p>
      </div>

      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={labels.searchPlaceholder}
          className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--cyan)]/30"
        />
      </div>

      {!query ? (
        <div className="mt-4">
          <p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-white/38">{labels.popular}</p>
          <div className="flex flex-wrap gap-2">
            {popular.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => onSelect(tag.id)}
                className="rounded-full border border-[var(--gold)]/20 bg-[var(--gold)]/8 px-3 py-1.5 text-xs text-[var(--gold)] transition hover:bg-[var(--gold)]/14"
              >
                {tag.label[locale]}
                <span className="ml-1.5 text-[10px] text-[var(--gold)]/70">
                  {formatMessage(labels.listeners, { count: channelStats[tag.id] ?? 0 })}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Пользовательские каналы */}
      {customChannels.length > 0 && (
        <div className="mt-5">
          <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-white/38">ТВОИ КАНАЛЫ</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {customChannels.map((channel, index) => (
              <motion.button
                key={channel.id}
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onSelect(channel.id)}
                className="rounded-2xl border border-violet-400/20 bg-violet-400/5 px-4 py-3 text-left transition hover:border-violet-400/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white/90">{channel.label}</span>
                  <span className="text-[10px] text-violet-400/70">ТВОЙ</span>
                </div>
                <p className="mt-1 text-xs text-white/50 line-clamp-2">{channel.prompt}</p>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-white/38">{labels.all}</p>
        {filtered.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {filtered.map((tag, index) => (
              <motion.button
                key={tag.id}
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onSelect(tag.id)}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:border-[var(--cyan)]/25 hover:bg-[var(--cyan)]/5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-white/88">{tag.label[locale]}</span>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-white/40">
                    {tag.meshNode}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/45">{tag.prompt[locale]}</p>
                <p className="mt-2 text-[10px] text-[var(--cyan)]/65">
                  {formatMessage(labels.listeners, { count: channelStats[tag.id] ?? 0 })}
                </p>
              </motion.button>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-6 text-center text-sm text-white/45">{labels.empty}</p>
        )}
      </div>
    </div>
  );
}
