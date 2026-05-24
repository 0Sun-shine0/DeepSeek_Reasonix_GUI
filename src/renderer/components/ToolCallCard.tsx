// ToolCallCard — displays tool calls with semantic rendering per tool type

import { useState } from "react";
import type { AssistantSegment } from "../state.js";
import { DiffCard } from "./DiffCard.js";
import { useT, type TFunction } from "../locale.js";

type Props = { tool: Extract<AssistantSegment, { kind: "tool" }>; };

export function ToolCallCard({ tool }: Props) {
  const { t } = useT();
  const [expanded, setExpanded] = useState(false);
  const duration = tool.durationMs != null ? `${(tool.durationMs / 1000).toFixed(1)}s` : null;
  const okIcon = tool.ok === undefined ? "⏳" : tool.ok ? "✅" : "❌";
  const path = parsePath(tool.args);
  const label = toolLabel(tool.name, path);
  return (
    <div className={`tool-call ${tool.ok === true ? "ok" : tool.ok === false ? "fail" : ""}`}>
      <div className="tool-header" onClick={() => setExpanded(!expanded)}><span className="tool-icon">{okIcon}</span><span className="tool-name">{label}</span>{duration && <span className="tool-duration">{duration}</span>}<span className="tool-expand">{expanded ? "▾" : "▸"}</span></div>
      {expanded && <div className="tool-body">{renderToolBody(tool, t)}</div>}
    </div>
  );
}

function toolLabel(name: string, path: string | null): string {
  if (path) return `${name}: ${shortPath(path)}`;
  if (name === "search_content") return `search_content: grep`;
  if (name === "run_command" || name === "run_background") return name;
  return name;
}

function renderToolBody(tool: Props["tool"], t: TFunction) {
  if (EDIT_TOOLS.has(tool.name) && tool.args) return <DiffCard toolName={tool.name} args={tool.args} result={tool.result} ok={tool.ok} />;
  if (READ_TOOLS.has(tool.name) && tool.result) return <ReadPreview result={tool.result} toolName={tool.name} t={t} />;
  if (tool.name === "search_content" && tool.result) return <SearchResults result={tool.result} t={t} />;
  if (SHELL_TOOLS.has(tool.name)) return <ShellResult tool={tool} />;
  return (<>{tool.args && <div className="tool-section"><div className="tool-section-title">{t("tool_args")}</div><pre className="tool-pre">{formatJson(tool.args)}</pre></div>}{tool.result !== undefined && <div className="tool-section"><div className="tool-section-title">{t("tool_result")}</div><pre className="tool-pre">{truncate(tool.result, 5000)}</pre></div>}</>);
}

function ReadPreview({ result, toolName, t }: { result: string; toolName: string; t: TFunction }) {
  const [expanded, setExpanded] = useState(false);
  const lines = result.split("\n");
  const preview = lines.slice(0, 20).join("\n");
  const over = lines.length > 20;
  return (<div className="semantic-preview"><div className="semantic-preview-header"><span>{lines.length} {t("tool_lines")}</span>{over && <button className="md-code-copy" onClick={() => setExpanded(!expanded)}>{expanded ? t("tool_collapse") : `${t("tool_show_all")} ${lines.length} ${t("tool_lines")}`}</button>}</div><pre className={`semantic-preview-code ${toolName === "get_symbols" || toolName === "find_in_code" ? "" : "code-block"}`}>{expanded ? result : preview}{!expanded && over && <span className="semantic-preview-ellipsis">…</span>}</pre></div>);
}

function SearchResults({ result, t }: { result: string; t: TFunction }) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const lines = result.split("\n").filter(Boolean);
  const parsed = lines.slice(0, 30).map((line) => { const m = line.match(/^(.+?):(\d+):\s*(.*)$/); if (m) return { path: m[1], lineNo: m[2], content: m[3] }; return { path: "", lineNo: "", content: line }; });
  const handleCopy = (path: string, idx: number) => { if (!path) return; navigator.clipboard.writeText(path).then(() => { setCopiedIdx(idx); setTimeout(() => setCopiedIdx(null), 1500); }); };
  return (<div className="semantic-search"><div className="semantic-search-header">{lines.length} {t("tool_results")} {lines.length > 30 ? `(${t("tool_showing_first")} 30)` : ""}</div><div className="semantic-search-list">{parsed.map((r, i) => (<div key={i} className={`semantic-search-item ${copiedIdx === i ? "copied" : ""}`} onClick={() => handleCopy(r.path, i)} title={t("tool_search_click")}><span className="search-path">{shortPath(r.path)}</span>{r.lineNo && <span className="search-line">:{r.lineNo}</span>}<span className="search-content">{r.content}</span>{copiedIdx === i && <span className="search-copied">✓ Copied</span>}</div>))}</div>{lines.length === 0 && <div className="popover-empty">{t("tool_no_matches")}</div>}</div>);
}

function ShellResult({ tool }: Props) {
  return (<div className="semantic-shell"><div className="semantic-shell-cmd"><span className="shell-prefix">$</span><code>{parseShellCmd(tool.args)}</code></div>{tool.result !== undefined && <pre className="semantic-shell-out">{truncate(tool.result, 3000)}</pre>}{tool.ok !== undefined && <span className={`job-exit-code ${tool.ok ? "ok" : "fail"}`}>exit {tool.ok ? "0" : "≠0"}</span>}</div>);
}

function parsePath(args: string): string | null { try { const a = JSON.parse(args); return typeof a.path === "string" ? a.path : null; } catch { return null; } }
function parseShellCmd(args: string): string { try { const a = JSON.parse(args); return (a.command && typeof a.command === "string") ? a.command : JSON.stringify(a); } catch { return args; } }
function shortPath(p: string): string { const parts = p.replace(/\\/g, "/").split("/"); return parts.length <= 2 ? p : `.../${parts.slice(-2).join("/")}`; }
function formatJson(raw: string): string { try { return JSON.stringify(JSON.parse(raw), null, 2); } catch { return raw; } }
function truncate(text: string, max: number): string { if (text.length <= max) return text; return text.slice(0, max) + `\n... (${text.length - max} more chars)`; }

const EDIT_TOOLS = new Set(["edit_file", "multi_edit", "write_file"]);
const READ_TOOLS = new Set(["read_file", "get_symbols", "find_in_code"]);
const SHELL_TOOLS = new Set(["run_command", "run_background"]);
