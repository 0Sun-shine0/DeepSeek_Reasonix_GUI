// Composer — bottom input bar

import { useState, useRef, useEffect, useCallback, type KeyboardEvent, type DragEvent, type ClipboardEvent } from "react";
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
  const [showTemplates, setShowTemplates] = useState(false);
  const [dragOver, setDragOver] = useState(false);

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

  // Drag-drop files
  const handleDragOver = useCallback((e: DragEvent) => { e.preventDefault(); setDragOver(true); }, []);
  const handleDragLeave = useCallback(() => setDragOver(false), []);
  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const paths = Array.from(e.dataTransfer.files).map((f: any) => f.path).filter(Boolean);
    if (paths.length > 0) setText((prev) => prev + "\n@" + paths.join(" @"));
  }, []);

  // Image paste
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = () => { setText((prev) => prev + "\n[Image attached]"); inputRef.current?.focus(); };
          reader.readAsDataURL(blob);
        }
        return;
      }
    }
  }, []);

  // Prompt templates
  const templates = [
    { label: "🎯 Code Review", text: "Please review the following code for bugs, security issues, and style problems:" },
    { label: "🧪 Write Tests", text: "Write comprehensive unit tests for the following code:" },
    { label: "📝 Document", text: "Write clear JSDoc documentation for the following code:" },
    { label: "🔄 Refactor", text: "Refactor the following code to improve readability and maintainability:" },
    { label: "🐛 Debug", text: "I'm encountering the following error. Help me debug it:" },
    { label: "📊 Explain", text: "Explain the following code in detail, line by line:" },
    { label: "⚡ Optimize", text: "Optimize the following code for performance:" },
    { label: "🔐 Security Audit", text: "Perform a security audit on the following code:" },
  ];

  useEffect(() => {
    if (injectedText) {
      setText((prev) => prev + injectedText);
      onConsumeInjected();
      inputRef.current?.focus();
    }
  }, [injectedText, onConsumeInjected]);

  const handleSend = () => {
    if (busy) return;
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
      <div className="composer-toolbar" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
        <button className="composer-btn" title={sidebarVisible ? t("composer_sidebar") : t("composer_sidebar")} onClick={onToggleSidebar}>☰</button>
        <div style={{ position: "relative" }}>
          <button className="composer-btn" title="Prompt templates" onClick={() => setShowTemplates(!showTemplates)}>📋</button>
          {showTemplates && (
            <div className="template-dropdown" onClick={(e) => e.stopPropagation()}>
              {templates.map((tpl, i) => (
                <div key={i} className="template-item" onClick={() => { setText((p) => p ? `${tpl.text}\n${p}` : tpl.text); setShowTemplates(false); inputRef.current?.focus(); }}>{tpl.label}</div>
              ))}
            </div>
          )}
        </div>
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
          onChange={(e) => { setText(e.target.value); autoResize(); }}
          onPaste={handlePaste}
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
