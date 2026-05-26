// utils.ts — shared renderer helpers, eliminate duplication across components

/** Shorten a path for display: keep last 2 segments */
export function shortPath(p: string): string {
  const parts = p.replace(/\\/g, "/").split("/");
  return parts.length <= 2 ? p : `.../${parts.slice(-2).join("/")}`;
}

/** Extract filename from a path */
export function baseName(p: string): string {
  const parts = p.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] ?? p;
}

/** Format large numbers: 1_500_000 → "1.5M", 1500 → "1.5K" */
export function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Truncate string with ellipsis */
export function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "..." : s;
}

/** Detect programming language from file extension */
export function detectLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
    py: "python", rs: "rust", go: "go", java: "java",
    css: "css", html: "html", json: "json", md: "markdown",
    yaml: "yaml", yml: "yaml", toml: "ini", sql: "sql",
    sh: "shell", bash: "shell",
  };
  return map[ext ?? ""] ?? "plaintext";
}

/** File type → emoji icon */
export function fileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: "🔷", tsx: "⚛️", js: "🟨", jsx: "⚛️", json: "{ }", css: "🎨",
    html: "🌐", md: "📝", py: "🐍", rs: "🦀", go: "🔵", java: "☕",
    yml: "⚙", yaml: "⚙", toml: "⚙", gitignore: "🙈", svg: "🖼",
    png: "🖼", jpg: "🖼", lock: "🔒",
  };
  return map[ext ?? ""] ?? "📄";
}

/** Parse JSON safely, return fallback on error */
export function safeJsonParse<T>(raw: string, fallback: T): T {
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

/** Format JSON string for display */
export function formatJson(raw: string): string {
  try { return JSON.stringify(JSON.parse(raw), null, 2); } catch { return raw; }
}
