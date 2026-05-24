// FileTree — directory listing with icons

import { useState, useEffect } from "react";
import { useT } from "../locale.js";

type FileEntry = { name: string; path: string; kind: "file" | "dir"; children?: FileEntry[]; };

type Props = { rootPath: string | null; onSelectFile: (path: string) => void; };

export function FileTree({ rootPath, onSelectFile }: Props) {
  const { t } = useT();
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);

  useEffect(() => { if (!rootPath) { setEntries([]); return; } setLoading(true); window.electronAPI.listDirectory(rootPath).then((raw) => { const cast = raw as unknown as FileEntry[]; setEntries(cast ?? []); setLoading(false); }).catch(() => { setEntries([]); setLoading(false); }); }, [rootPath]);

  useEffect(() => { const handler = (e: KeyboardEvent) => { if (e.key === "j" || e.key === "ArrowDown") { e.preventDefault(); setFocusedIdx((i) => Math.min(i + 1, entries.length - 1)); } else if (e.key === "k" || e.key === "ArrowUp") { e.preventDefault(); setFocusedIdx((i) => Math.max(i - 1, 0)); } else if (e.key === "Enter" && focusedIdx >= 0 && entries[focusedIdx]) { onSelectFile(entries[focusedIdx].path); } }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, [entries, focusedIdx, onSelectFile]);

  if (!rootPath) return <div className="sidebar-empty">{t("sidebar_no_files")}</div>;
  if (loading) return <div className="sidebar-empty">{t("sidebar_loading")}</div>;
  if (entries.length === 0) return <div className="sidebar-empty">{t("sidebar_empty_dir")}</div>;

  const dirs = entries.filter((e) => e.kind === "dir");
  const files = entries.filter((e) => e.kind !== "dir");

  return (
    <div className="file-tree">
      {[...dirs, ...files].map((e, i) => (
        <div key={e.path} className={`file-tree-item ${i === focusedIdx ? "focused" : ""}`} onClick={() => onSelectFile(e.path)} title={e.path}>
          <span className="file-tree-icon">{e.kind === "dir" ? "📁" : icon(e.name)}</span>
          <span className="file-tree-name">{e.name}</span>
        </div>
      ))}
    </div>
  );
}

function icon(name: string): string { const ext = name.split(".").pop()?.toLowerCase(); const map: Record<string, string> = { ts: "🔷", tsx: "⚛️", js: "🟨", jsx: "⚛️", json: "{ }", css: "🎨", html: "🌐", md: "📝", py: "🐍", rs: "🦀", go: "🔵", java: "☕", yml: "⚙", yaml: "⚙", toml: "⚙", gitignore: "🙈", svg: "🖼", png: "🖼", jpg: "🖼" }; return map[ext ?? ""] ?? "📄"; }
