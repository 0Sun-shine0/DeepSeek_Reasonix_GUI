// Composer — bottom input bar

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { useT } from "../locale.js";
import { AtPicker } from "./AtPicker.js";
import type { ContextFile } from "../state.js";

type Props = {
  busy: boolean;
  onSend: (text: string) => void;
  onAbort: () => void;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onOpenFolder: () => void;
  sidebarVisible: boolean;
  injectedText: string | null;
  onConsumeInjected: () => void;
  contextFiles?: ContextFile[];
  workspaceDir?: string | null;
};

export function Composer({
  busy, onSend, onAbort, onToggleSidebar, onOpenSettings, onOpenFolder,
  sidebarVisible, injectedText, onConsumeInjected, contextFiles, workspaceDir,
}: Props) {
  const { t } = useT();
  const [text, setText] = useState("");
  const [showAtPicker, setShowAtPicker] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [gitFiles, setGitFiles] = useState<{ path: string; kind: string }[]>([]);

  // Detect @ trigger
  useEffect(() => {
    const lastAt = text.lastIndexOf("@", inputRef.current?.selectionStart ?? text.length);
    if (lastAt >= 0 && (lastAt === 0 || text[lastAt - 1] === " " || text[lastAt - 1] === "\n")) {
      const afterAt = text.slice(lastAt + 1);
      if (!afterAt.includes(" ") && !afterAt.includes("\n") && afterAt.length < 40) {
        setShowAtPicker(true);
        if (workspaceDir) window.electronAPI.gitStatus(workspaceDir).then(setGitFiles).catch(() => setGitFiles([]));
        return;
      }
    }
    setShowAtPicker(false);
  }, [text, workspaceDir]);

  useEffect(() => { inputRef.current?.focus(); }, [busy, inputRef]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [busy]);

  useEffect(() => {
    if (injectedText) {
      setText((prev) => prev + injectedText);
      onConsumeInjected();
      inputRef.current?.focus();
    }
  }, [injectedText, onConsumeInjected]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && busy) {
      e.preventDefault();
      onAbort();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (busy) {
        onAbort();
      } else {
        handleSend();
      }
    }
  };

  const autoResize = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  return (
    <div className="composer">
      <div className="composer-toolbar">
        <button
          className="composer-btn"
          title={sidebarVisible ? t("composer_sidebar") : t("composer_sidebar")}
          onClick={onToggleSidebar}
        >
          ☰
        </button>
        <button className="composer-btn" title={t("composer_open_folder")} onClick={onOpenFolder}>
          📂
        </button>
        <button className="composer-btn" title={t("composer_settings")} onClick={onOpenSettings}>
          ⚙
        </button>
      </div>
      <div className="composer-input-wrap">
        <textarea
          ref={inputRef}
          className="composer-input"
          placeholder={busy ? t("composer_busy") : t("composer_placeholder")}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            autoResize();
          }}
          onKeyDown={handleKeyDown}
          disabled={busy}
          rows={1}
        />
        {busy ? (
          <button className="composer-send abort" onClick={onAbort}>
            {t("composer_stop")}
          </button>
        ) : (
          <button className="composer-send" onClick={handleSend} disabled={!text.trim()}>
            {t("composer_send")}
          </button>
        )}
      </div>
      {showAtPicker && (
        <AtPicker
          contextFiles={contextFiles ?? []}
          workspaceDir={workspaceDir ?? null}
          gitFiles={gitFiles}
          onSelect={(item) => {
            // Find the @ position and replace with the path reference
            const lastAt = text.lastIndexOf("@");
            if (lastAt >= 0) {
              const before = text.slice(0, lastAt);
              setText(before + `@${item.path} `);
            }
          }}
          onClose={() => setShowAtPicker(false)}
        />
      )}
    </div>
  );
}
