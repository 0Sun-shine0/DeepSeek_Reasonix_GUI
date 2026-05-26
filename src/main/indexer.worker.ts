// Worker thread for building codebase index asynchronously
import { parentPort, workerData } from "worker_threads";
import { readdir, stat } from "fs/promises";
import { join } from "path";
import type { IndexEntry } from "./indexer.js";

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "out", "target", ".next", ".cache", "__pycache__", ".venv", "coverage", ".reasonix"]);
const MAX_FILES = 5000;

async function walk(root: string, dir: string, entries: IndexEntry[]) {
  if (entries.length >= MAX_FILES) return;
  let items: string[];
  try { items = await readdir(dir); } catch { return; }
  for (const name of items) {
    if (name.startsWith(".") && name !== ".gitignore") continue;
    const full = join(dir, name);
    let st;
    try { st = await stat(full); } catch { continue; }
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      await walk(root, full, entries);
    } else if (st.isFile()) {
      const rel = full.slice(root.length + 1).replace(/\\/g, "/");
      const ext = name.includes(".") ? name.split(".").pop()?.toLowerCase() ?? "" : "";
      entries.push({ path: rel, size: st.size, mtime: st.mtimeMs, ext });
    }
  }
}

async function main() {
  const root: string = (workerData as { root?: string } | undefined)?.root ?? process.cwd();
  const entries: IndexEntry[] = [];
  await walk(root, root, entries);
  parentPort?.postMessage({ success: true, entries });
}

main().catch((err) => {
  parentPort?.postMessage({ success: false, error: String(err) });
});
