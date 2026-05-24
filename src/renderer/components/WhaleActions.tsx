// WhaleActions — contextual quick-action suggestions powered by 🐋

import { useState } from "react";
import { Whale } from "./Whale.js";
import { useT, type TFunction } from "../locale.js";

export type QuickAction = { id: string; emoji: string; label: string; prompt: string; };

type Props = { actions: QuickAction[]; onAction: (prompt: string) => void; onDismiss: () => void; };

export function WhaleActions({ actions, onAction, onDismiss }: Props) {
  const { t } = useT();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="whale-actions-card">
      <div className="whale-actions-header"><Whale state="idle" size={36} /><div className="whale-actions-prompt"><span className="whale-actions-title">{t("whale_title")}</span><span className="whale-actions-sub">{t("whale_sub")}</span></div><button className="msg-action-btn" onClick={() => { setDismissed(true); onDismiss(); }} title="Dismiss">✕</button></div>
      <div className="whale-actions-list">{actions.map((a) => (<button key={a.id} className="whale-action-btn" onClick={() => onAction(a.prompt)}><span className="whale-action-emoji">{a.emoji}</span><span className="whale-action-label">{a.label}</span></button>))}</div>
    </div>
  );
}

export function buildActions(toolNames: string[], t: TFunction): QuickAction[] {
  const names = new Set(toolNames);
  const actions: QuickAction[] = [];
  if (names.has("read_file") || names.has("search_content")) {
    actions.push({ id: "explain", emoji: "📖", label: t("whale_explain"), prompt: t("whale_explain_prompt") });
    actions.push({ id: "improve", emoji: "🔧", label: t("whale_improve"), prompt: t("whale_improve_prompt") });
  }
  if (names.has("edit_file") || names.has("write_file") || names.has("multi_edit")) {
    actions.push({ id: "review", emoji: "🔍", label: t("whale_review"), prompt: t("whale_review_prompt") });
    actions.push({ id: "test", emoji: "🧪", label: t("whale_test"), prompt: t("whale_test_prompt") });
  }
  if (names.has("run_command") || names.has("run_background")) {
    actions.push({ id: "fix", emoji: "🩹", label: t("whale_fix"), prompt: t("whale_fix_prompt") });
  }
  if (actions.length < 3) {
    actions.push({ id: "next", emoji: "🚀", label: t("whale_next"), prompt: t("whale_next_prompt") });
    actions.push({ id: "summarize", emoji: "📋", label: t("whale_summarize"), prompt: t("whale_summarize_prompt") });
  }
  return actions.slice(0, 5);
}
