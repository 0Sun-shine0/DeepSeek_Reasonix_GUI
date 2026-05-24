// CommandPalette — Cmd+K command menu with fuzzy matching

import { useState, useCallback, useEffect, useRef, type KeyboardEvent } from "react";
import { useT } from "../locale.js";

export type Command = { id: string; title: string; shortcut?: string; category?: string; action: () => void; };

type Props = { commands: Command[]; onClose: () => void; };

export function CommandPalette({ commands, onClose }: Props) {
  const { t } = useT();
  const [query, setQuery] = useState("");
  const [selIdx, setSelIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setSelIdx(0); }, [query]);

  const filtered = query.trim() ? commands.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()) || c.category?.toLowerCase().includes(query.toLowerCase())) : commands;

  const execute = useCallback((cmd: Command) => { cmd.action(); onClose(); }, [onClose]);

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[selIdx]) execute(filtered[selIdx]); }
    else if (e.key === "Escape") { onClose(); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal palette-modal" onClick={(e) => e.stopPropagation()}>
        <input ref={inputRef} className="palette-input" placeholder={t("palette_placeholder")} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKey} />
        <div className="palette-list">
          {filtered.map((cmd, i) => (<div key={cmd.id} className={`palette-item ${i === selIdx ? "selected" : ""}`} onMouseEnter={() => setSelIdx(i)} onClick={() => execute(cmd)}><div className="palette-item-left"><span className="palette-item-title">{cmd.title}</span>{cmd.category && <span className="palette-item-cat">{cmd.category}</span>}</div>{cmd.shortcut && <span className="palette-item-shortcut">{cmd.shortcut}</span>}</div>))}
          {filtered.length === 0 && <div className="palette-empty">{t("palette_empty")}</div>}
        </div>
        <div className="palette-footer"><span>{t("palette_footer_nav")}</span><span>{t("palette_footer_exec")}</span><span>{t("palette_footer_esc")}</span></div>
      </div>
    </div>
  );
}
