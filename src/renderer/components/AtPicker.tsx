// AtPicker — @-symbol context picker popup for the composer

import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import type { ContextFile } from "../state.js";
import { shortPath, baseName } from "../utils.js";

type PickerItem = { label: string; path: string; icon: string; meta?: string };

type Props = {
  contextFiles: ContextFile[];
  workspaceDir: string | null;
  gitFiles: { path: string; kind: string }[];
  onSelect: (item: PickerItem) => void;
  onClose: () => void;
};

export function AtPicker({ contextFiles, workspaceDir, gitFiles, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [selIdx, setSelIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const sources = buildSources(contextFiles, workspaceDir, gitFiles);
  const allItems = sources.flatMap((s) => s.items);
  const filtered = query.trim()
    ? allItems.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()) || i.path.toLowerCase().includes(query.toLowerCase()))
    : allItems;

  useEffect(() => { setSelIdx(0); }, [query]);

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[selIdx]) { onSelect(filtered[selIdx]); onClose(); } }
    else if (e.key === "Escape") { onClose(); }
  };

  return (
    <div className="at-picker-overlay" onClick={onClose}>
      <div className="at-picker" onClick={(e) => e.stopPropagation()}>
        <input ref={inputRef} className="at-picker-input" placeholder="@file, @folder..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKey} />
        <div className="at-picker-list">
          {filtered.map((item, i) => (
            <div key={i} className={`at-picker-item ${i === selIdx ? "selected" : ""}`}
              onMouseEnter={() => setSelIdx(i)} onClick={() => { onSelect(item); onClose(); }}>
              <span className="at-picker-icon">{item.icon}</span>
              <span className="at-picker-label">{item.label}</span>
              <span className="at-picker-path">{shortPath(item.path)}</span>
            </div>
          ))}
          {filtered.length === 0 && <div className="at-picker-empty">No matches</div>}
        </div>
        <div className="at-picker-footer">↑↓ Navigate · ↵ Select · Esc Close</div>
      </div>
    </div>
  );
}

function buildSources(contextFiles: ContextFile[], workspaceDir: string | null, gitFiles: { path: string; kind: string }[]): { type: string; items: PickerItem[] }[] {
  const sources: { type: string; items: PickerItem[] }[] = [];
  if (contextFiles.length > 0) {
    sources.push({
      type: "context",
      items: contextFiles.map((cf) => ({ label: baseName(cf.path), path: cf.path, icon: cf.status === "modified" ? "✏️" : "📖", meta: "in context" })),
    });
  }
  if (gitFiles.length > 0) {
    sources.push({
      type: "git",
      items: gitFiles.map((g) => ({ label: baseName(g.path), path: g.path, icon: gitIcon(g.kind), meta: g.kind })),
    });
  }
  if (workspaceDir) {
    sources.push({
      type: "file",
      items: [{ label: "📁 Workspace", path: workspaceDir, icon: "📂", meta: "root" }],
    });
  }
  return sources;
}

function gitIcon(kind: string): string {
  switch (kind) { case "modified": return "M"; case "added": return "A"; case "deleted": return "D"; case "untracked": return "?"; default: return "•"; }
}
