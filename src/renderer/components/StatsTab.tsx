// StatsTab — usage statistics panel with cost trend + tool breakdown

import { useState } from "react";
import type { UsageStats } from "../state.js";
import { fmtNum } from "../utils.js";

type Props = { usage: UsageStats; messageCount: number; toolCalls: { name: string; count: number }[] };

export function StatsTab({ usage, messageCount, toolCalls }: Props) {
  // Simulate 7-day cost history from localStorage
  const [history] = useState<{ day: string; cost: number }[]>(() => {
    try { return JSON.parse(localStorage.getItem("reasonix-cost-history") ?? "[]"); } catch { return []; }
  });

  const maxCost = Math.max(0.01, ...history.map((h) => h.cost));
  const sortedTools = [...toolCalls].sort((a, b) => b.count - a.count);

  return (
    <div className="sidebar-section">
      <div className="ctx-section">
        <div className="ctx-section-title">📊 Usage Stats</div>
        <div className="stats-grid">
          <div className="stats-cell"><span className="stats-value">{fmtNum(messageCount)}</span><span className="stats-label">Messages</span></div>
          <div className="stats-cell"><span className="stats-value">${usage.totalCostUsd.toFixed(3)}</span><span className="stats-label">Total Cost</span></div>
          <div className="stats-cell"><span className="stats-value">{fmtNum(usage.totalPromptTokens)}</span><span className="stats-label">Prompt Tokens</span></div>
          <div className="stats-cell"><span className="stats-value">{fmtNum(usage.totalCompletionTokens)}</span><span className="stats-label">Completion</span></div>
        </div>
      </div>

      {history.length > 0 && (
        <div className="ctx-section">
          <div className="ctx-section-title">📈 Cost Trend (7d)</div>
          <div className="cost-chart">
            {history.map((h, i) => (
              <div key={i} className="cost-bar-wrap" title={`${h.day}: $${h.cost.toFixed(3)}`}>
                <div className="cost-bar" style={{ height: `${(h.cost / maxCost) * 100}%` }} />
                <span className="cost-bar-label">{h.day.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {sortedTools.length > 0 && (
        <div className="ctx-section">
          <div className="ctx-section-title">🔧 Top Tools</div>
          <div className="tool-stats-list">
            {sortedTools.slice(0, 8).map((t, i) => (
              <div key={i} className="tool-stat-item">
                <span className="tool-stat-name">{t.name}</span>
                <span className="tool-stat-count">{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length === 0 && sortedTools.length === 0 && (
        <div className="sidebar-empty">No usage data yet. Start chatting!</div>
      )}
    </div>
  );
}
