import { useState, useEffect } from "react";
import { BsClaude } from "react-icons/bs";
import { subscribeTokens, TokenStats } from "../lib/tokenStore";
import { AVAILABLE_MODELS, ModelId } from "../lib/claude";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export default function StatusBar({ model }: { model: ModelId }) {
  const modelLabel = AVAILABLE_MODELS.find((m) => m.id === model)?.label ?? model;
  const [stats, setStats] = useState<TokenStats>({
    totalInput: 0,
    totalOutput: 0,
    liveInput: 0,
    liveOutput: 0,
    active: false,
  });

  useEffect(() => subscribeTokens(setStats), []);

  const total = stats.totalInput + stats.totalOutput;

  return (
    <div className="flex items-center justify-end border-t border-white/[0.04] bg-neutral-900/40 px-3 pb-0.5 h-[30px] shrink-0 text-[11px] leading-none gap-2">
      {/* Tokens */}
      <div className="px-2.5 py-1.5 rounded-md hover:bg-white/[0.04]">
        {stats.active ? (
          <div className="flex items-center gap-1.5 text-blue-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
            <span>~{formatTokens(stats.liveInput)} tokens in-flight</span>
          </div>
        ) : total > 0 ? (
          <div className="flex items-center gap-1.5 text-neutral-500">
            <span className="text-neutral-300">{formatTokens(total)}</span>
            <span>tokens</span>
            <span className="text-neutral-700 mx-0.5">·</span>
            <span>{formatTokens(stats.totalInput)} in</span>
            <span className="text-neutral-700">/</span>
            <span>{formatTokens(stats.totalOutput)} out</span>
          </div>
        ) : (
          <span className="text-neutral-600">No tokens used</span>
        )}
      </div>

      {/* Model + Logo */}
      <div className="flex items-center gap-1.5 text-neutral-500 px-2.5 py-1.5 rounded-md hover:bg-white/[0.04]">
        <span>{modelLabel}</span>
        <BsClaude size={12} />
      </div>
    </div>
  );
}
