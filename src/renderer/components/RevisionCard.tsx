// RevisionCard — plan revision proposal with before/after comparison

import type { PendingRevision, PlanStep } from "../state.js";
import { useT } from "../locale.js";

type Props = { revision: PendingRevision; onAccept: () => void; onReject: () => void; currentSteps?: PlanStep[]; };

export function RevisionCard({ revision, onAccept, onReject, currentSteps }: Props) {
  const { t } = useT();
  return (
    <div className="approval-card revision-card">
      <div className="approval-header">
        <span className="approval-icon">🔀</span>
        <div className="revision-header-info">
          <span className="approval-title">{t("revision_title")}</span>
          {revision.summary && <span className="revision-summary">{revision.summary}</span>}
        </div>
      </div>
      <div className="revision-reason-block">
        <span className="revision-reason-label">{t("revision_why")}</span>
        <span className="revision-reason">{revision.reason}</span>
      </div>
      {currentSteps && currentSteps.length > 0 && (
        <div className="revision-compare">
          <div className="revision-col old"><div className="revision-col-title">{t("revision_current")}</div>{currentSteps.map((s) => <div key={s.id} className="revision-step old">{s.title}</div>)}</div>
          <div className="revision-arrow">→</div>
          <div className="revision-col new"><div className="revision-col-title">{t("revision_revised")}</div>{revision.remainingSteps.map((s) => <div key={s.id} className="revision-step new">{s.title}</div>)}</div>
        </div>
      )}
      <div className="approval-actions">
        <button className="approval-btn deny" onClick={onReject}>{t("revision_reject")}</button>
        <button className="approval-btn allow" onClick={onAccept}>{t("revision_accept")}</button>
      </div>
    </div>
  );
}
