// Electron IPC handlers — renderer ↔ main process ↔ reasonix

import { ipcMain, dialog, shell } from "electron";
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import { join, basename, relative } from "path";
import { validateWorkspaceDir, validateNotepadName, validatePathAbsolute, validatePathWithinWorkspace, validateSearchQuery } from "./validators.js";
import { exec } from "child_process";
import { sendToReasonix } from "./rpc.js";
import type { IncomingEvent, OutgoingCommand } from "../shared/protocol.js";
import { buildIndex, searchIndex, type IndexEntry } from "./indexer.js";

// Cache the index per workspace to avoid rebuilding on every search
let indexCache: IndexEntry[] | null = null;
let indexCacheWorkspace: string | null = null;

export type FileTreeEntry = {
  name: string;
  path: string;
  kind: "file" | "dir";
  children?: FileTreeEntry[];
};

function listDirectoryTree(root: string, maxDepth: number = 4, depth: number = 0): FileTreeEntry[] {
  if (depth > maxDepth) return [];

  const SKIP = new Set(["node_modules", ".git", "dist", "build", "out", "target", ".next", ".cache", "__pycache__", ".venv", "coverage"]);

  try {
    const entries = readdirSync(root);
    const result: FileTreeEntry[] = [];

    for (const name of entries) {
      if (name.startsWith(".") && name !== ".env" && name !== ".env.example") continue;
      if (SKIP.has(name)) continue;

      const fullPath = join(root, name);
      try {
        const st = statSync(fullPath);
        if (st.isDirectory()) {
          const children = depth < maxDepth - 1 ? listDirectoryTree(fullPath, maxDepth, depth + 1) : [];
          result.push({ name, path: fullPath, kind: "dir", children });
        } else if (st.isFile()) {
          result.push({ name, path: fullPath, kind: "file" });
        }
      } catch {
        // Permission error — skip
      }
    }


    // Sort: dirs first, then alphabetical
    result.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return result;
  } catch {
    return [];
  }
}

export function registerIpcHandlers() {
  // Renderer sends a command to reasonix
  ipcMain.on("reasonix:send", (_event, cmd: OutgoingCommand) => {
    sendToReasonix(cmd);
  });

  // Renderer requests a file open dialog
  ipcMain.handle("dialog:openDirectory", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    return result.canceled ? null : result.filePaths[0] ?? null;
  });

  // Renderer requests a directory tree listing
  ipcMain.handle("fs:listDirectory", async (_event, dirPath: string) => {
    if (!validatePathAbsolute(dirPath)) return [];
    return listDirectoryTree(dirPath);
  });

  // Renderer requests git status
  ipcMain.handle("git:status", async (_event, dirPath: string) => {
    if (!validatePathAbsolute(dirPath)) return [];
    return getGitStatus(dirPath);
  });

  // Open URL in system browser
  ipcMain.handle("shell:openExternal", async (_event, url: string) => {
    await shell.openExternal(url);
  });

  // Scan .reasonix/rules/ for glob-scoped rules
  ipcMain.handle("rules:getMatching", async (_event, filePath: string, workspaceDir: string) => {
    if (!validateWorkspaceDir(workspaceDir) || !validatePathWithinWorkspace(filePath, workspaceDir)) return [];
    return getMatchingRules(workspaceDir, filePath);
  });

  // Git branch name
  ipcMain.handle("git:branch", async (_event, dirPath: string) => {
    if (!validatePathAbsolute(dirPath)) return null;
    return getGitBranch(dirPath);
  });

  // Notepads CRUD
  ipcMain.handle("notepads:list", async (_event, workspaceDir: string) => {
    if (!validateWorkspaceDir(workspaceDir)) return [];
    return listNotepads(workspaceDir);
  });
  ipcMain.handle("notepads:read", async (_event, workspaceDir: string, name: string) => {
    if (!validateWorkspaceDir(workspaceDir) || !validateNotepadName(name)) return null;
    return readNotepad(workspaceDir, name);
  });
  ipcMain.handle("notepads:write", async (_event, workspaceDir: string, name: string, content: string) => {
    if (!validateWorkspaceDir(workspaceDir) || !validateNotepadName(name)) return;
    writeNotepad(workspaceDir, name, content);
  });
  ipcMain.handle("notepads:delete", async (_event, workspaceDir: string, name: string) => {
    if (!validateWorkspaceDir(workspaceDir) || !validateNotepadName(name)) return;
    deleteNotepad(workspaceDir, name);
  });

  // Codebase indexing with cache
  ipcMain.handle("index:build", async (_event, workspaceDir: string) => {
    if (!validateWorkspaceDir(workspaceDir)) return [];
    indexCache = await buildIndex(workspaceDir);
    indexCacheWorkspace = workspaceDir;
    return indexCache;
  });
  ipcMain.handle("index:search", async (_event, workspaceDir: string, query: string) => {
    if (!validateWorkspaceDir(workspaceDir) || !validateSearchQuery(query)) return [];
    if (indexCacheWorkspace !== workspaceDir || !indexCache) {
      indexCache = await buildIndex(workspaceDir);
      indexCacheWorkspace = workspaceDir;
    }
    return searchIndex(indexCache, query);
  });
  ipcMain.on("index:clear", () => { indexCache = null; indexCacheWorkspace = null; });
}

// ─── Glob Rules Scanner ───

export type RuleEntry = { name: string; globs: string[]; content: string; alwaysApply: boolean; };

function getMatchingRules(workspaceDir: string, filePath: string): RuleEntry[] {
  const rulesDir = join(workspaceDir, ".reasonix", "rules");
  if (!existsSync(rulesDir)) {
    try { mkdirSync(rulesDir, { recursive: true }); } catch { /* ok */ }
    return [];
  }

  const relativePath = relative(workspaceDir, filePath).replace(/\\/g, "/");
  const entries: RuleEntry[] = [];

  try {
    for (const entry of readdirSync(rulesDir)) {
      if (!entry.endsWith(".md")) continue;
      const content = readFileSync(join(rulesDir, entry), "utf-8");
      const parsed = parseRuleFrontmatter(content, entry.replace(".md", ""));
      if (!parsed) continue;
      // Check if this rule matches the file
      if (parsed.alwaysApply || parsed.globs.length === 0 || parsed.globs.some((g) => matchGlob(g, relativePath))) {
        entries.push(parsed);
      }
    }
  } catch { /* ignore scan errors */ }

  return entries;
}

function parseRuleFrontmatter(content: string, name: string): RuleEntry | null {
  // Parse simple YAML-like frontmatter between --- markers
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  const body = match ? match[2].trim() : content;
  const frontmatter = match ? match[1] : "";

  const globs: string[] = [];
  let alwaysApply = false;

  for (const line of frontmatter.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("globs:")) {
      const val = trimmed.slice(6).trim();
      // Support array syntax: globs: [src/api/**, src/utils/**]
      if (val.startsWith("[") && val.endsWith("]")) {
        globs.push(...val.slice(1, -1).split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, "")));
      } else {
        globs.push(val);
      }
    }
    if (trimmed.startsWith("alwaysApply:") && trimmed.includes("true")) {
      alwaysApply = true;
    }
  }

  return { name, globs, content: body, alwaysApply };
}

function getGitBranch(root: string): Promise<string | null> {
  return new Promise((resolve) => {
    exec("git rev-parse --abbrev-ref HEAD", { cwd: root, timeout: 5000 }, (err, stdout) => {
      if (err) { resolve(null); return; }
      const b = stdout.trim();
      resolve(b || null);
    });
  });
}

// ─── Notepads ───

function notepadsDir(workspaceDir: string): string {
  const dir = join(workspaceDir, ".reasonix", "notepads");
  if (!existsSync(dir)) { try { mkdirSync(dir, { recursive: true }); } catch { /* ok */ } }
  return dir;
}

function listNotepads(workspaceDir: string): string[] {
  try {
    return readdirSync(notepadsDir(workspaceDir)).filter((f) => f.endsWith(".md")).map((f) => f.replace(".md", ""));
  } catch { return []; }
}

function readNotepad(workspaceDir: string, name: string): string | null {
  try {
    return readFileSync(join(notepadsDir(workspaceDir), `${safeName(name)}.md`), "utf-8");
  } catch { return null; }
}

function writeNotepad(workspaceDir: string, name: string, content: string): void {
  mkdirSync(notepadsDir(workspaceDir), { recursive: true });
  writeFileSync(join(notepadsDir(workspaceDir), `${safeName(name)}.md`), content, "utf-8");
}

function deleteNotepad(workspaceDir: string, name: string): void {
  const path = join(notepadsDir(workspaceDir), `${safeName(name)}.md`);
  if (existsSync(path)) { try { unlinkSync(path); } catch { /* ok */ } }
}

function safeName(name: string): string { return name.replace(/[^a-zA-Z0-9_\-.]/g, "_"); }

// workspace validation moved to validators.ts

function matchGlob(pattern: string, path: string): boolean {
  // Simple glob matching: convert ** to .* and * to [^/]*
  const reStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "§§")
    .replace(/\*/g, "[^/]*")
    .replace(/§§/g, ".*");
  try {
    return new RegExp(`^${reStr}$`).test(path);
  } catch {
    return path.includes(pattern.replace(/\*\*/g, ""));
  }
}

function getGitStatus(root: string): Promise<{ path: string; kind: string }[]> {
  return new Promise((resolve) => {
    exec("git status --porcelain", { cwd: root, timeout: 10000 }, (err, stdout) => {
      if (err) { resolve([]); return; }
      const entries: { path: string; kind: string }[] = [];
      for (const line of stdout.split("\n")) {
        if (line.length < 3) continue;
        const x = line[0];
        const y = line[1];
        const filePath = line.slice(3).trim();
        if (!filePath) continue;
        let kind = "modified";
        if (x === "?" && y === "?") kind = "untracked";
        else if (x === "A" || y === "A") kind = "added";
        else if (x === "D" || y === "D") kind = "deleted";
        else if (x === "R" || y === "R") kind = "renamed";
        entries.push({ path: filePath, kind });
      }
      resolve(entries);
    });
  });
}
