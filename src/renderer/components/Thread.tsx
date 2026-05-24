// Thread — message list with virtual scroll + smart auto-scroll + whale quick actions

import { useEffect, useRef, useCallback, useState } from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import type { ChatMessage, ActivePlan } from "../state.js";
import { MessageCard } from "./MessageCard.js";
import { PlanBanner } from "./PlanCard.js";
import { WhaleActions, buildActions } from "./WhaleActions.js";
import { useT } from "../locale.js";

type Props = {
  messages: ChatMessage[];
  activePlan: ActivePlan | null;
  busy: boolean;
  onDismissPlan: () => void;
  onDismissError: (id: string) => void;
  onCopyMessage: (message: ChatMessage) => void;
  onRetry: () => void;
  onEditResend: (text: string) => void;
  onQuickAction: (prompt: string) => void;
  onFixError?: (errorMsg: string) => void;
  onExport?: () => void;
  onUndo?: () => void;
  onRegenerate?: () => void;
};

const FOLD_THRESHOLD = 50;

export function Thread({
  messages, activePlan, busy, onDismissPlan, onDismissError,
  onCopyMessage, onRetry, onEditResend, onQuickAction, onFixError, onExport, onUndo, onRegenerate,
}: Props) {
  const virtRef = useRef<VirtuosoHandle>(null);
  const userScrolledUp = useRef(false);
  const [folded, setFolded] = useState(false);

  // Smart auto-scroll: only jump to bottom if user hasn't scrolled up
  useEffect(() => {
    if (!userScrolledUp.current) {
      virtRef.current?.scrollToIndex({ index: "LAST", behavior: "smooth" });
    }
  }, [messages]);

  // Auto-fold very long conversations
  useEffect(() => {
    if (messages.length > FOLD_THRESHOLD && !folded) setFolded(true);
  }, [messages.length, folded]);

  const handleScroll = useCallback(() => {
    // If at bottom, reset user-scrolled-up flag
    // Virtuoso doesn't expose scroll position easily; approximate
    userScrolledUp.current = false;
  }, []);

  // Last assistant for whale actions
  const lastAssistant = [...messages].reverse().find((m) => m.kind === "assistant");
  const showActions =
    !busy && lastAssistant && !lastAssistant.pending &&
    lastAssistant.segments.some((s) => s.kind === "tool");
  const toolNames = lastAssistant
    ? lastAssistant.segments.filter((s) => s.kind === "tool").map((s) => s.name)
    : [];
  const { t } = useT();
  const actions = showActions ? buildActions(toolNames, t) : [];

  // Fold: show first 20 + last 30
  const visible = !folded || messages.length <= FOLD_THRESHOLD
    ? messages
    : [...messages.slice(0, 20), { kind: "fold" as const, count: messages.length - 50 }, ...messages.slice(-30)];

  const renderItem = (_index: number, msg: ChatMessage | FoldMarker) => {
    if (msg.kind === "fold") {
      return (
        <div className="thread-fold" onClick={() => { setFolded(false); userScrolledUp.current = false; }}>
          <span>📜 {msg.count} messages folded — click to expand</span>
        </div>
      );
    }
    return (
      <MessageCard
        message={msg}
        onDismissError={onDismissError}
        onCopyMessage={onCopyMessage}
        onRetry={onRetry}
        onEditResend={onEditResend}
        onRegenerate={onRegenerate}
        onFixError={onFixError}
      />
    );
  };

  return (
    <div className="thread">
      {messages.length > 0 && onExport && (
        <div className="thread-toolbar">
          <button className="thread-export-btn" onClick={onExport} title="Export as Markdown">📥 Export</button>
          {onUndo && <button className="thread-export-btn" onClick={onUndo} title="Undo last message">↩ Undo</button>}
        </div>
      )}
      {activePlan && <PlanBanner plan={activePlan} onDismiss={onDismissPlan} />}
      <Virtuoso
        ref={virtRef}
        className="thread-virtuoso"
        data={visible}
        itemContent={renderItem}
        followOutput="smooth"
        atBottomStateChange={(atBottom) => { userScrolledUp.current = !atBottom; }}
        components={{
          Footer: () => showActions ? (
            <WhaleActions actions={actions} onAction={onQuickAction} onDismiss={() => {}} />
          ) : null,
        }}
      />
    </div>
  );
}

type FoldMarker = { kind: "fold"; count: number };
