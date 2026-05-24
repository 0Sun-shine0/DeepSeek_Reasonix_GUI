// ApprovalCard — shell command confirmation

import type { PendingConfirm } from "../state.js";
import { useT } from "../locale.js";

type Props = { confirm: PendingConfirm; onAllow: () => void; onAlwaysAllow: () => void; onDeny: () => void; };

export function ApprovalCard({ confirm, onAllow, onAlwaysAllow, onDeny }: Props) {
  const { t } = useT();
  const prefix = extractCommandPrefix(confirm.command);
  return (
    <div className="approval-card">
      <div className="approval-header">
        <span className="approval-icon">⚠</span>
        <span className="approval-title">{t("approval_shell_title")}</span>
        <span className="approval-kind">{confirm.kind}</span>
      </div>
      <pre className="approval-command">{confirm.command}</pre>
      <div className="approval-actions">
        <button className="approval-btn deny" onClick={onDeny}>{t("approval_deny")}</button>
        {prefix && <button className="approval-btn" style={{ background: "var(--yellow)", color: "var(--bg)" }} onClick={onAlwaysAllow}>{t("approval_allow_always")} {prefix}</button>}
        <button className="approval-btn allow" onClick={onAllow}>{t("approval_run_once")}</button>
      </div>
    </div>
  );
}

function extractCommandPrefix(cmd: string): string | null { const parts = cmd.trim().split(/\s+/); return parts.length === 0 ? null : parts[0]; }
