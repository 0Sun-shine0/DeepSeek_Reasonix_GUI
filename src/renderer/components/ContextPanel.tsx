// ContextPanel — token usage bar + context files list

import type { ContextFile, ContextTokens, UsageStats } from "../state.js";
import { useT } from "../locale.js";

type Props = { contextFiles: ContextFile[]; contextTokens: ContextTokens; usage: UsageStats; };

export function ContextPanel({ contextFiles, contextTokens, usage }: Props) {
  const { t } = useT();
  const total = contextTokens.systemTokens + contextTokens.historyTokens + contextTokens.toolTokens + (usage.reservedTokens ?? 0);

  return (
    <div className="sidebar-section">
      <div className="ctx-section"><div className="ctx-section-title">{t("ctx_token_usage")}</div>
        {total > 0 && (
          <div className="ctx-bar-wrap">
            <div className="ctx-bar"><div className="ctx-bar-seg system" style={{ flex: contextTokens.systemTokens || 0.1 }} title={`${t("ctx_token_system")}: ${fmt(contextTokens.systemTokens)}`} /><div className="ctx-bar-seg history" style={{ flex: contextTokens.historyTokens || 0.1 }} title={`${t("ctx_token_history")}: ${fmt(contextTokens.historyTokens)}`} /><div className="ctx-bar-seg tools" style={{ flex: contextTokens.toolTokens || 0.1 }} title={`${t("ctx_token_tools")}: ${fmt(contextTokens.toolTokens)}`} /></div>
            <div className="ctx-legend">
              <span className="ctx-legend-item"><span className="ctx-dot system" />{t("ctx_token_system")} {fmt(contextTokens.systemTokens)}</span>
              <span className="ctx-legend-item"><span className="ctx-dot history" />{t("ctx_token_history")} {fmt(contextTokens.historyTokens)}</span>
              <span className="ctx-legend-item"><span className="ctx-dot tools" />{t("ctx_token_tools")} {fmt(contextTokens.toolTokens)}</span>
            </div>
            <div className="ctx-total">{t("ctx_token_total")}: {fmt(total)}</div>
          </div>
        )}
      </div>

      {contextFiles.length > 0 && (
        <div className="ctx-section">
          <div className="ctx-section-title">{t("ctx_in_context")} ({contextFiles.length})</div>
          <div className="ctx-files">
            {contextFiles.map((cf, i) => (<div key={i} className={`ctx-file ${cf.status === "modified" ? "modified" : "read"}`} title={cf.path}><span className="ctx-file-icon">{cf.status === "modified" ? "✏️" : "📖"}</span><span className="ctx-file-path">{cfPath(cf.path)}</span></div>))}
          </div>
        </div>
      )}

      {contextFiles.length === 0 && (<div className="sidebar-empty">{t("ctx_no_files")}</div>)}
    </div>
  );
}

function cfPath(p: string): string { const s = p.replace(/\\/g, "/").split("/"); return s.length <= 2 ? p : `.../${s.slice(-2).join("/")}`; }
function fmt(n: number): string { if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`; if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`; return String(n); }
