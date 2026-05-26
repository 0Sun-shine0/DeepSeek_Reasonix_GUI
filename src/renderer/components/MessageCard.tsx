// MessageCard — renders a single chat message with hover actions

import { useState, useCallback } from "react";
import type { ChatMessage } from "../state.js";
import { ToolCallCard } from "./ToolCallCard.js";
import { Markdown } from "./Markdown.js";
import { useT } from "../locale.js";

type Props = {
  message: ChatMessage;
  onDismissError: (id: string) => void;
  onCopyMessage: (message: ChatMessage) => void;
  onRetry: () => void;
  onEditResend: (text: string) => void;
  onRegenerate?: () => void;
  onDebate?: () => void;
  onFixError?: (errorMsg: string) => void;
};

export function MessageCard({ message, onDismissError, onCopyMessage, onRetry, onEditResend, onRegenerate, onDebate, onFixError }: Props) {
  const { t } = useT();
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [showReasoning, setShowReasoning] = useState(false);

  const handleCopy = useCallback(() => { onCopyMessage(message); }, [message, onCopyMessage]);
  const handleEditStart = useCallback(() => {
    if (message.kind === "user") { setEditText(message.text); setEditing(true); }
  }, [message]);
  const handleEditSend = useCallback(() => {
    if (editText.trim()) onEditResend(editText.trim());
    setEditing(false);
  }, [editText, onEditResend]);

  const actionButtons = (
    <div className="msg-actions">
      <button className="msg-action-btn" onClick={handleCopy} title={t("msg_copy")}>📋</button>
      {message.kind === "user" && (
        <button className="msg-action-btn" onClick={handleEditStart} title={t("msg_edit")}>✏️</button>
      )}
      {message.kind === "assistant" && !message.pending && (
        <button className="msg-action-btn" onClick={onRetry} title={t("msg_retry")}>🔄</button>
      )}
      {onRegenerate && (
        <button className="msg-action-btn" onClick={onRegenerate} title="Regenerate response">♻️</button>
      )}
      {onDebate && (
        <button className="msg-action-btn" onClick={onDebate} title="Debate this response">⚔️</button>
      )}
    </div>
  );

  switch (message.kind) {
    case "user":
      return (
        <div className="msg msg-user" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
          <div className="msg-role-row">
            <span className="msg-role">{t("msg_you")}</span>
            {hovered && actionButtons}
          </div>
          <div className="msg-content">
            {editing ? (
              <div className="msg-edit-wrap">
                <textarea className="msg-edit-input" value={editText} onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSend(); } if (e.key === "Escape") setEditing(false); }}
                  autoFocus rows={3} />
                <div className="msg-edit-actions">
                  <button className="approval-btn deny" onClick={() => setEditing(false)}>{t("msg_edit_cancel")}</button>
                  <button className="approval-btn allow" onClick={handleEditSend}>{t("msg_edit_resend")}</button>
                </div>
              </div>
            ) : (<Markdown>{message.text}</Markdown>)}
          </div>
        </div>
      );
    case "assistant":
      return (
        <div className={`msg msg-assistant ${message.pending ? "pending" : ""}`} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
          <div className="msg-role-row">
            <span className="msg-role">{t("msg_reasonix")}</span>
            {hovered && !message.pending && actionButtons}
          </div>
          <div className="msg-content">
            {message.segments.map((seg, i) => {
              if (seg.kind === "text") return (<div key={i} className="seg-text"><Markdown>{seg.text}</Markdown></div>);
              if (seg.kind === "reasoning") return (
                <div key={i} className="seg-reasoning">
                  <div className="seg-reasoning-header" onClick={() => setShowReasoning(!showReasoning)}>
                    <span>{showReasoning ? "▾" : "▸"} 🧠 {t("msg_thinking")} ({countReasoningSteps(seg.text)})</span>
                  </div>
                  {showReasoning && <pre className="seg-reasoning-body">{seg.text}</pre>}
                </div>
              );
              return <ToolCallCard key={i} tool={seg} />;
            })}
            {message.pending && <span className="cursor-blink">▌</span>}
          </div>
        </div>
      );
    case "status":
      return (<div className="msg msg-status"><span className="msg-status-text">{message.text}</span></div>);
    case "error":
      return (
        <div className="msg msg-error">
          <span className="msg-error-text">{t("msg_error_prefix")} {message.message}</span>
          <div className="msg-error-actions">
            {onFixError && <button className="msg-error-fix" onClick={() => onFixError(message.message)}>🔧 AI Fix</button>}
            {message.recoverable !== false && <button className="msg-error-dismiss" onClick={() => onDismissError(message.id)}>✕</button>}
          </div>
        </div>
      );
    default:
      return null;
  }
}

function countReasoningSteps(text: string): string {
  const words = text.trim().split(/\s+/).length;
  return `${words} words`;
}
