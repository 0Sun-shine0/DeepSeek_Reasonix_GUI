// PlanCard — flowchart-style plan visualization with step cards + connectors

import type { PendingPlan, ActivePlan, PlanStep } from "../state.js";
import { useT } from "../locale.js";

// ─── Pending plan approval card ───

type PlanProps = { plan: PendingPlan; onApprove: () => void; onReject: () => void; };

export function PlanCard({ plan, onApprove, onReject }: PlanProps) {
  const { t } = useT();
  const steps = plan.steps ?? [];
  return (
    <div className="approval-card plan-card">
      <div className="plan-approve-header">
        <span className="approval-icon">📋</span>
        <div className="plan-approve-info">
          <span className="plan-approve-title">{t("plan_approve_title")}</span>
          {plan.summary && <span className="plan-approve-summary">{plan.summary}</span>}
        </div>
        <span className="plan-step-count">{steps.length} {t("plan_steps")}</span>
      </div>
      <div className="plan-description">{plan.plan}</div>
      {steps.length > 0 && (
        <div className="plan-flowchart">
          {steps.map((step, i) => (
            <div key={step.id} className="plan-flow-step-wrap">
              {i > 0 && <div className="plan-flow-connector" />}
              <StepCard step={step} index={i} status="waiting" />
            </div>
          ))}
        </div>
      )}
      <div className="approval-actions">
        <button className="approval-btn deny" onClick={onReject}>{t("plan_reject")}</button>
        <button className="approval-btn allow" onClick={onApprove}>{t("plan_approve")}</button>
      </div>
    </div>
  );
}

// ─── Active plan banner ───

type BannerProps = { plan: ActivePlan; onDismiss: () => void; };

export function PlanBanner({ plan, onDismiss }: BannerProps) {
  const { t } = useT();
  const steps = plan.steps;
  const doneIds = new Set(plan.completedStepIds);
  const done = doneIds.size;
  const total = steps.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  let activeIdx = -1;
  for (let i = 0; i < steps.length; i++) { if (!doneIds.has(steps[i].id)) { activeIdx = i; break; } }

  return (
    <div className="plan-banner">
      <div className="plan-banner-header">
        <div className="plan-banner-title-row">
          <span className="plan-banner-icon">📋</span>
          <span className="plan-banner-title">{plan.summary ?? t("plan_active")}</span>
          <span className="plan-banner-counter">{done}/{total}</span>
        </div>
        <button className="plan-banner-dismiss" onClick={onDismiss} title="Dismiss plan">✕</button>
      </div>
      {total > 0 && (<>
        <div className="plan-banner-progress"><div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div><span className="progress-text">{pct}%</span></div>
        <div className="plan-flowchart plan-flowchart-banner">
          {steps.map((step, i) => {
            const st = doneIds.has(step.id) ? "done" as const : i === activeIdx ? "active" as const : "waiting" as const;
            return (<div key={step.id} className="plan-flow-step-wrap">{i > 0 && <div className={`plan-flow-connector ${st === "done" ? "done" : ""}`} />}<StepCard step={step} index={i} status={st} /></div>);
          })}
        </div>
      </>)}
    </div>
  );
}

// ─── Step card ───

type StepStatus = "waiting" | "active" | "done" | "failed";
const STATUS_ICON: Record<StepStatus, string> = { waiting: "○", active: "◉", done: "✓", failed: "✕" };
const RISK_COLOR: Record<string, string> = { high: "#f7768e", med: "#e0af68", low: "#9ece6a" };

function StepCard({ step, index, status }: { step: PlanStep; index: number; status: StepStatus }) {
  const { t } = useT();
  const statusKey = `plan_step_${status}` as const;
  return (
    <div className={`step-card status-${status}`}>
      <div className="step-card-left">
        <span className={`step-status-icon status-${status}`}>{STATUS_ICON[status]}</span>
        {step.risk && step.risk !== "low" && <span className="step-risk-dot" style={{ backgroundColor: RISK_COLOR[step.risk] ?? RISK_COLOR.low }} title={`Risk: ${step.risk}`} />}
      </div>
      <div className="step-card-body">
        <div className="step-card-header">
          <span className="step-card-num">{t("plan_step_label")} {index + 1}</span>
          <span className={`step-card-status status-${status}`}>{t(statusKey)}</span>
        </div>
        <div className="step-card-title">{step.title}</div>
        <div className="step-card-action">{step.action}</div>
        {step.risk && step.risk !== "low" && <span className={`risk-badge ${step.risk}`}>{step.risk === "high" ? t("plan_high_risk") : t("plan_med_risk")}</span>}
      </div>
    </div>
  );
}
