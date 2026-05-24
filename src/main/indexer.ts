// Codebase indexer — scans workspace files and builds a searchable index

import { readdirSync, statSync } from "fs";
import { join } from "path";

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "out", "target", ".next", ".cache", "__pycache__", ".venv", "coverage", ".reasonix"]);
const MAX_FILES = 5000;

export type IndexEntry = { path: string; size: number; mtime: number; ext: string; };

export function buildIndex(workspaceDir: string): IndexEntry[] {
  const entries: IndexEntry[] = [];
  walk(workspaceDir, workspaceDir, entries);
  return entries;
}

function walk(root: string, dir: string, entries: IndexEntry[]) {
  if (entries.length >= MAX_FILES) return;
  let items: string[];
  try { items = readdirSync(dir); } catch { return; }
  for (const name of items) {
    if (name.startsWith(".") && name !== ".gitignore") continue;
    const full = join(dir, name);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      walk(root, full, entries);
    } else if (st.isFile()) {
      const rel = full.slice(root.length + 1).replace(/\\/g, "/");
      const ext = name.includes(".") ? name.split(".").pop()?.toLowerCase() ?? "" : "";
      entries.push({ path: rel, size: st.size, mtime: st.mtimeMs, ext });
    }
  }
}

export function searchIndex(entries: IndexEntry[], query: string): IndexEntry[] {
  const q = query.toLowerCase();
  return entries.filter((e) => e.path.toLowerCase().includes(q)).slice(0, 50);
}
