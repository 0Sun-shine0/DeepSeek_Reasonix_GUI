// StatusBar — bottom bar with model, cost, token info + whale + jobs

import type { UsageStats } from "../state.js";
import type { JobInfo } from "../../shared/protocol.js";
import { Whale } from "./Whale.js";
import { useT } from "../locale.js";

type Props = {
  model?: string;
  ready: boolean;
  busy: boolean;
  usage: UsageStats;
  balance: { currency: string; total: number; isAvailable: boolean } | null;
  runningJobs: number;
  gitBranch?: string;
  onToggleJobs: () => void;
  onCommitMessage?: () => void;
};

export function StatusBar({ model, ready, busy, usage, balance, runningJobs, gitBranch, onToggleJobs, onCommitMessage }: Props) {
  const { t } = useT();
  const costStr = usage.totalCostUsd > 0 ? `$${usage.totalCostUsd.toFixed(4)}` : "$0.00";
  const cacheHitRate =
    usage.cacheHitTokens + usage.cacheMissTokens > 0
      ? ((usage.cacheHitTokens / (usage.cacheHitTokens + usage.cacheMissTokens)) * 100).toFixed(0)
      : null;

  const whaleState = !ready ? "error" : busy ? "busy" : "idle";

  return (
    <div className="statusbar">
      <div className="statusbar-left">
        <span className="status-whale">
          <Whale state={whaleState} size={28} />
        </span>
        <span className="status-model">{model ?? "reasonix"}</span>
        {busy && <span className="status-busy">{t("status_working")}</span>}
        {gitBranch && (
          <span className="status-git-branch" title={`Branch: ${gitBranch}`}>
            ⎇ {gitBranch}
          </span>
        )}
        {onCommitMessage && (
          <button className="status-commit-btn" onClick={onCommitMessage} title="Generate commit message">✍️</button>
        )}
      </div>
      <div className="statusbar-right">
        {runningJobs > 0 && (
          <span className="status-item status-jobs" onClick={onToggleJobs} title={t("jobs_title")}>
            🔄 {runningJobs}
          </span>
        )}
        {cacheHitRate && (
          <span className="status-item" title={t("status_cache_hit")}>
            🎯 {cacheHitRate}%
          </span>
        )}
        <span className="status-item" title={t("status_prompt")}>
          📥 {fmt(usage.totalPromptTokens)}
        </span>
        <span className="status-item" title={t("status_completion")}>
          📤 {fmt(usage.totalCompletionTokens)}
        </span>
        <span className="status-item status-cost" title={t("status_cost")}>
          💰 {costStr}
        </span>
        {balance?.isAvailable && (
          <span className="status-item" title={t("status_balance")}>
            🏦 {balance.currency} {balance.total.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
