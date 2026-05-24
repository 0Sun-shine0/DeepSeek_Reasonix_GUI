// CheckpointCard — step completion checkpoint with result summary

import type { PendingCheckpoint } from "../state.js";
import { useT } from "../locale.js";

type Props = { checkpoint: PendingCheckpoint; onContinue: () => void; onStop: () => void; onRevise?: () => void; };

export function CheckpointCard({ checkpoint, onContinue, onStop, onRevise }: Props) {
  const { t } = useT();
  return (
    <div className="approval-card checkpoint-card">
      <div className="approval-header">
        <span className="approval-icon">✅</span>
        <span className="approval-title">{checkpoint.title ?? checkpoint.stepId} — {t("checkpoint_title")}</span>
      </div>
      <div className="checkpoint-progress-bar">
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${checkpoint.total > 0 ? (checkpoint.completed / checkpoint.total) * 100 : 0}%` }} /></div>
        <span className="progress-text">{checkpoint.completed}/{checkpoint.total} {t("plan_steps")}</span>
      </div>
      <div className="checkpoint-result-block">
        <div className="checkpoint-result-label">Result</div>
        <div className="checkpoint-result">{checkpoint.result}</div>
        {checkpoint.notes && <div className="checkpoint-notes">💡 {checkpoint.notes}</div>}
      </div>
      <div className="approval-actions">
        <button className="approval-btn deny" onClick={onStop}>{t("checkpoint_stop")}</button>
        {onRevise && <button className="approval-btn" style={{ background: "var(--yellow)", color: "var(--bg)" }} onClick={onRevise}>{t("checkpoint_revise")}</button>}
        <button className="approval-btn allow" onClick={onContinue}>{t("checkpoint_continue")}</button>
      </div>
    </div>
  );
}
