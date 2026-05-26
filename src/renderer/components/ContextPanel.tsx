// ContextPanel — token usage bar + context files list

import type { ContextFile, ContextTokens, UsageStats } from "../state.js";
import { useT } from "../locale.js";
import { shortPath, fmtNum } from "../utils.js";

type Props = { contextFiles: ContextFile[]; contextTokens: ContextTokens; usage: UsageStats; };

export function ContextPanel({ contextFiles, contextTokens, usage }: Props) {
  const { t } = useT();
  const total = contextTokens.systemTokens + contextTokens.historyTokens + contextTokens.toolTokens + (usage.reservedTokens ?? 0);
  const MODEL_LIMIT = 128_000; // approximate for deepseek
  const usageRatio = total / MODEL_LIMIT;
  const warning = usageRatio > 0.85 ? "red" : usageRatio > 0.65 ? "yellow" : null;

  return (
    <div className="sidebar-section">
      <div className="ctx-section"><div className="ctx-section-title">{t("ctx_token_usage")}</div>
        {total > 0 && (
          <div className="ctx-bar-wrap">
            <div className="ctx-bar"><div className="ctx-bar-seg system" style={{ flex: contextTokens.systemTokens || 0.1 }} title={`${t("ctx_token_system")}: ${fmtNum(contextTokens.systemTokens)}`} /><div className="ctx-bar-seg history" style={{ flex: contextTokens.historyTokens || 0.1 }} title={`${t("ctx_token_history")}: ${fmtNum(contextTokens.historyTokens)}`} /><div className="ctx-bar-seg tools" style={{ flex: contextTokens.toolTokens || 0.1 }} title={`${t("ctx_token_tools")}: ${fmtNum(contextTokens.toolTokens)}`} /></div>
            <div className="ctx-legend">
              <span className="ctx-legend-item"><span className="ctx-dot system" />{t("ctx_token_system")} {fmtNum(contextTokens.systemTokens)}</span>
              <span className="ctx-legend-item"><span className="ctx-dot history" />{t("ctx_token_history")} {fmtNum(contextTokens.historyTokens)}</span>
              <span className="ctx-legend-item"><span className="ctx-dot tools" />{t("ctx_token_tools")} {fmtNum(contextTokens.toolTokens)}</span>
            </div>
            <div className="ctx-total">{t("ctx_token_total")}: {fmtNum(total)}</div>
            {warning && (
              <div className={`ctx-warning ctx-warning-${warning}`}>
                {warning === "red" ? "⚠️ Approaching context limit — consider compacting history" : "⚡ Context filling up"}
              </div>
            )}
          </div>
        )}
      </div>

      {contextFiles.length > 0 && (
        <div className="ctx-section">
          <div className="ctx-section-title">{t("ctx_in_context")} ({contextFiles.length})</div>
          <div className="ctx-files">
            {contextFiles.map((cf, i) => (<div key={i} className={`ctx-file ${cf.status === "modified" ? "modified" : "read"}`} title={cf.path}><span className="ctx-file-icon">{cf.status === "modified" ? "✏️" : "📖"}</span><span className="ctx-file-path">{shortPath(cf.path)}</span></div>))}
          </div>
        </div>
      )}

      {contextFiles.length === 0 && (<div className="sidebar-empty">{t("ctx_no_files")}</div>)}
    </div>
  );
}
