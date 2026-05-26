// Sidebar — session list, MCP, skills, files, context

import { useState, useEffect, useRef, useCallback } from "react";
import type { SessionInfo, McpSpecInfo, SkillInfo, MemoryEntryInfo } from "../../shared/protocol.js";
import { FileTree } from "./FileTree.js";
import { ContextPanel } from "./ContextPanel.js";
import { StatsTab } from "./StatsTab.js";
import type { ContextFile, ContextTokens, UsageStats } from "../state.js";
import { useT } from "../locale.js";

type Props = {
  sessions: SessionInfo[];
  currentSession?: string;
  mcpSpecs: McpSpecInfo[];
  skills: SkillInfo[];
  memory: MemoryEntryInfo[];
  workspaceDir: string | null;
  contextFiles: ContextFile[];
  contextTokens: ContextTokens;
  usage: UsageStats;
  onSelectSession: (name: string) => void;
  onNewChat: () => void;
  onDeleteSession: (name: string) => void;
  onRenameSession: (oldName: string, newTitle: string) => void;
  onSelectFile: (path: string) => void;
  onAddMcp: (spec: string) => void;
  onRemoveMcp: (spec: string) => void;
  onRemoveSkill: (name: string) => void;
  onRemoveMemory: (name: string, scope: "project" | "global") => void;
  onToggle: () => void;
};

export function Sidebar({
  sessions, currentSession, mcpSpecs, skills, memory, workspaceDir,
  contextFiles, contextTokens, usage,
  onSelectSession, onNewChat, onDeleteSession, onRenameSession, onSelectFile,
  onAddMcp, onRemoveMcp, onRemoveSkill, onRemoveMemory, onToggle,
}: Props) {
  const { t } = useT();
  const [tab, setTab] = useState<"files" | "context" | "sessions" | "mcp" | "skills" | "memory" | "notepads" | "stats">("files");
  const [starred, setStarred] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("reasonix-starred") ?? "[]"); } catch { return []; }
  });
  const [sessionQuery, setSessionQuery] = useState("");
  const toggleStar = (name: string) => {
    setStarred((prev) => {
      const next = prev.includes(name) ? prev.filter((s) => s !== name) : [name, ...prev];
      localStorage.setItem("reasonix-starred", JSON.stringify(next));
      return next;
    });
  };

  const filteredSessions = sessionQuery.trim()
    ? sessions.filter((s) =>
        (s.summary ?? s.name).toLowerCase().includes(sessionQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(sessionQuery.toLowerCase()))
    : sessions;
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem("reasonix-sidebar-width");
    return saved ? Number(saved) : 280;
  });

  const resizing = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    resizing.current = true;
    startX.current = e.clientX;
    startW.current = width;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [width]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizing.current) return;
      const delta = e.clientX - startX.current;
      const next = Math.max(180, Math.min(window.innerWidth * 0.5, startW.current + delta));
      setWidth(next);
    };
    const onUp = () => {
      if (resizing.current) {
        resizing.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        localStorage.setItem("reasonix-sidebar-width", String(width));
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [width]);

  return (
    <div className="sidebar" style={{ width: `${width}px`, minWidth: "180px" }}>
      <div className="sidebar-header">
        <span className="sidebar-title">Reasonix</span>
        <button className="sidebar-close" onClick={onToggle}>
          ✕
        </button>
      </div>

      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${tab === "files" ? "active" : ""}`}
          onClick={() => setTab("files")}
        >
          {t("sidebar_tab_files")}
        </button>
        <button
          className={`sidebar-tab ${tab === "context" ? "active" : ""}`}
          onClick={() => setTab("context")}
        >
          {t("sidebar_tab_context")}
        </button>
        <button
          className={`sidebar-tab ${tab === "sessions" ? "active" : ""}`}
          onClick={() => setTab("sessions")}
        >
          {t("sidebar_tab_sessions")}
        </button>
        <button
          className={`sidebar-tab ${tab === "mcp" ? "active" : ""}`}
          onClick={() => setTab("mcp")}
        >
          {t("sidebar_tab_mcp")}
        </button>
        <button
          className={`sidebar-tab ${tab === "skills" ? "active" : ""}`}
          onClick={() => setTab("skills")}
        >
          {t("sidebar_tab_skills")}
        </button>
        <button
          className={`sidebar-tab ${tab === "memory" ? "active" : ""}`}
          onClick={() => setTab("memory")}
        >
          {t("sidebar_tab_memory")}
        </button>
        <button
          className={`sidebar-tab ${tab === "notepads" ? "active" : ""}`}
          onClick={() => setTab("notepads")}
        >
          📝 Notepads
        </button>
        <button
          className={`sidebar-tab ${tab === "stats" ? "active" : ""}`}
          onClick={() => setTab("stats")}
        >
          📊 Stats
        </button>
      </div>

      <div className="sidebar-body">
        {tab === "files" && (
          <div className="sidebar-section">
            <FileTree
              rootPath={workspaceDir}
              onSelectFile={onSelectFile}
            />
          </div>
        )}
        {tab === "context" && (
          <ContextPanel
            contextFiles={contextFiles}
            contextTokens={contextTokens}
            usage={usage}
          />
        )}
        {tab === "sessions" && (
          <div className="sidebar-section">
            <button className="sidebar-new-btn" onClick={onNewChat}>
              {t("sidebar_new_chat")}
            </button>
            <input
              className="session-search"
              type="text"
              placeholder="🔍 Search sessions..."
              value={sessionQuery}
              onChange={(e) => setSessionQuery(e.target.value)}
            />
            <div className="sidebar-list">
              {filteredSessions.map((s) => (
                <SessionItem
                  key={s.name}
                  session={s}
                  isActive={s.name === currentSession}
                  onSelect={() => onSelectSession(s.name)}
                  onDelete={() => onDeleteSession(s.name)}
                  onRename={(title) => onRenameSession(s.name, title)}
                  starred={starred.includes(s.name)}
                  onToggleStar={() => toggleStar(s.name)}
                />
              ))}
              {filteredSessions.length === 0 && (
                <div className="sidebar-empty">{sessionQuery ? "No matching sessions" : t("sidebar_no_sessions")}</div>
              )}
            </div>
          </div>
        )}

        {tab === "mcp" && (
          <McpTab mcpSpecs={mcpSpecs} onAdd={onAddMcp} onRemove={onRemoveMcp} />
        )}

        {tab === "skills" && (
          <SkillsTab skills={skills} onRemove={onRemoveSkill} />
        )}

        {tab === "memory" && (
          <MemoryTab memory={memory} onRemove={onRemoveMemory} />
        )}

        {tab === "notepads" && (
          <NotepadsTab workspaceDir={workspaceDir} />
        )}
        {tab === "stats" && (
          <StatsTab
            usage={usage}
            messageCount={sessions.reduce((sum, s) => sum + s.messageCount, 0)}
            toolCalls={[]}
          />
        )}
      </div>
      <div className="sidebar-resize-handle" onMouseDown={onMouseDown} />
    </div>
  );
}

// ─── Sub-components for management tabs ───

function McpTab({ mcpSpecs, onAdd, onRemove }: {
  mcpSpecs: SidebarMcpSpecInfo[];
  onAdd: (spec: string) => void;
  onRemove: (spec: string) => void;
}) {
  const { t } = useT();
  const [showAdd, setShowAdd] = useState(false);
  const [specText, setSpecText] = useState("");

  return (
    <div className="sidebar-section">
      <button className="sidebar-new-btn" onClick={() => setShowAdd(!showAdd)}>
        {t("sidebar_mcp_add")}
      </button>
      {showAdd && (
        <div className="sidebar-add-form">
          <textarea
            className="sidebar-add-input"
            placeholder={`{\n  "name": "my-server",\n  "transport": "stdio",\n  "command": "npx",\n  "args": ["-y", "@modelcontextprotocol/server-filesystem"]\n}`}
            value={specText}
            onChange={(e) => setSpecText(e.target.value)}
            rows={5}
          />
          <div className="sidebar-add-actions">
            <button className="approval-btn deny" onClick={() => setShowAdd(false)}>{t("settings_cancel")}</button>
            <button className="approval-btn allow" onClick={() => { if (specText.trim()) { onAdd(specText.trim()); setSpecText(""); setShowAdd(false); } }}>{t("misc_confirm")}</button>
          </div>
        </div>
      )}
      <div className="sidebar-list">
        {mcpSpecs.map((mcp, i) => (
          <div key={i} className="sidebar-item">
            <div className="sidebar-item-main">
              <span className="sidebar-item-name">{mcp.name ?? mcp.raw}</span>
              <span className="sidebar-item-meta">
                {mcp.status} · {mcp.toolCount ?? 0} {t("misc_tools_unit")}
              </span>
            </div>
            <button className="sidebar-item-delete" style={{ opacity: 1 }} onClick={() => onRemove(mcp.raw)}>🗑</button>
          </div>
        ))}
        {mcpSpecs.length === 0 && !showAdd && (
          <div className="sidebar-empty">{t("sidebar_mcp_empty")}</div>
        )}
      </div>
    </div>
  );
}

function SkillsTab({ skills, onRemove }: {
  skills: SidebarSkillInfo[];
  onRemove: (name: string) => void;
}) {
  const { t } = useT();
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  return (
    <div className="sidebar-section">
      <div className="sidebar-list">
        {skills.map((sk, i) => (
          <div key={i}>
            <div className="sidebar-item" onClick={() => setExpandedSkill(expandedSkill === sk.name ? null : sk.name)}>
              <div className="sidebar-item-main">
                <span className="sidebar-item-name">{sk.name}</span>
                <span className="sidebar-item-meta">
                  {sk.runAs} · {sk.scope} · {sk.description}
                </span>
              </div>
              <button className="sidebar-item-delete" style={{ opacity: 1 }} onClick={(e) => { e.stopPropagation(); onRemove(sk.name); }}>🗑</button>
            </div>
            {expandedSkill === sk.name && (
              <div className="skill-detail">
                <div className="skill-detail-label">Path: {sk.path}</div>
              </div>
            )}
          </div>
        ))}
        {skills.length === 0 && (
          <div className="sidebar-empty">{t("sidebar_skills_empty")}</div>
        )}
      </div>
    </div>
  );
}

function MemoryTab({ memory, onRemove }: {
  memory: SidebarMemoryInfo[];
  onRemove: (name: string, scope: "project" | "global") => void;
}) {
  const { t } = useT();
  return (
    <div className="sidebar-section">
      <div className="sidebar-list">
        {memory.map((m, i) => (
          <div key={i} className="sidebar-item">
            <div className="sidebar-item-main">
              <span className="sidebar-item-name">{m.name}</span>
              <span className="sidebar-item-meta">
                {m.scope} · {m.description}
              </span>
            </div>
            <button className="sidebar-item-delete" style={{ opacity: 1 }} onClick={() => onRemove(m.name, m.scope)}>🗑</button>
          </div>
        ))}
        {memory.length === 0 && (
          <div className="sidebar-empty">{t("sidebar_memory_empty")}</div>
        )}
      </div>
    </div>
  );
}

// ─── Session item with rename ───

function SessionItem({ session, isActive, onSelect, onDelete, onRename, starred, onToggleStar }: {
  session: SessionInfo;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
  starred: boolean;
  onToggleStar: () => void;
}) {
  const { t } = useT();
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(session.summary ?? session.name);

  if (renaming) {
    return (
      <div className="sidebar-rename-form">
        <input
          className="sidebar-rename-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { onRename(title); setRenaming(false); }
            if (e.key === "Escape") setRenaming(false);
          }}
          placeholder={t("misc_rename_placeholder")}
          autoFocus
        />
        <button className="approval-btn allow" style={{ fontSize: "10px", padding: "2px 6px" }} onClick={() => { onRename(title); setRenaming(false); }}>✓</button>
        <button className="approval-btn deny" style={{ fontSize: "10px", padding: "2px 6px" }} onClick={() => setRenaming(false)}>✕</button>
      </div>
    );
  }

  return (
    <div className={`sidebar-item ${isActive ? "active" : ""}`} onClick={onSelect}>
      <button className={`sidebar-star-btn ${starred ? "starred" : ""}`} onClick={(e) => { e.stopPropagation(); onToggleStar(); }} title={starred ? "Unstar" : "Star"}>{starred ? "⭐" : "☆"}</button>
      <div className="sidebar-item-main">
        <span className="sidebar-item-name">{session.summary ?? session.name}</span>
        <span className="sidebar-item-meta">
          {session.messageCount} {t("misc_msg_unit")} · {session.mtime}
        </span>
      </div>
      <button className="sidebar-item-delete" style={{ opacity: 1, marginRight: 2 }} onClick={(e) => { e.stopPropagation(); setTitle(session.summary ?? session.name); setRenaming(true); }} title={t("sidebar_rename")}>✏️</button>
      <button className="sidebar-item-delete" onClick={(e) => { e.stopPropagation(); onDelete(); }} title={t("sidebar_delete")}>🗑</button>
    </div>
  );
}

// ─── Notepads Tab ───

function NotepadsTab({ workspaceDir }: { workspaceDir: string | null }) {
  const [entries, setEntries] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const refresh = () => {
    if (!workspaceDir) return;
    window.electronAPI.notepadList(workspaceDir).then(setEntries).catch(() => setEntries([]));
  };

  useEffect(() => { refresh(); }, [workspaceDir]);

  const load = (name: string) => {
    if (!workspaceDir) return;
    window.electronAPI.notepadRead(workspaceDir, name).then((c) => { setSelected(name); setContent(c ?? ""); }).catch(() => {});
  };

  const save = () => {
    if (!workspaceDir || !selected) return;
    window.electronAPI.notepadWrite(workspaceDir, selected, content).then(refresh);
  };

  const del = (name: string) => {
    if (!workspaceDir) return;
    window.electronAPI.notepadDelete(workspaceDir, name).then(() => { setSelected(null); setContent(""); refresh(); });
  };

  const create = () => {
    if (!workspaceDir || !newName.trim()) return;
    window.electronAPI.notepadWrite(workspaceDir, newName.trim(), "").then(() => { setNewName(""); setCreating(false); setSelected(newName.trim()); setContent(""); refresh(); });
  };

  return (
    <div className="sidebar-section">
      {!selected ? (
        <>
          {creating ? (
            <div className="sidebar-add-form">
              <input className="sidebar-add-input" placeholder="notepad name..." value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") create(); if (e.key === "Escape") setCreating(false); }} autoFocus />
              <div className="sidebar-add-actions"><button className="approval-btn deny" onClick={() => setCreating(false)}>Cancel</button><button className="approval-btn allow" onClick={create}>Create</button></div>
            </div>
          ) : (
            <button className="sidebar-new-btn" onClick={() => setCreating(true)}>+ New Notepad</button>
          )}
          <div className="sidebar-list">
            {entries.map((name) => (
              <div key={name} className="sidebar-item" onClick={() => load(name)}>
                <span className="sidebar-item-name">{name}</span>
                <button className="sidebar-item-delete" style={{ opacity: 1 }} onClick={(e) => { e.stopPropagation(); del(name); }}>🗑</button>
              </div>
            ))}
            {entries.length === 0 && !creating && <div className="sidebar-empty">No notepads yet</div>}
          </div>
        </>
      ) : (
        <div className="notepad-editor">
          <div className="notepad-editor-header">
            <button className="composer-btn" onClick={() => setSelected(null)}>← Back</button>
            <span className="notepad-editor-title">{selected}</span>
            <button className="approval-btn allow" style={{ fontSize: "10px", padding: "2px 8px" }} onClick={save}>Save</button>
          </div>
          <textarea className="notepad-editor-text" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your notepad in Markdown..." />
        </div>
      )}
    </div>
  );
}

// Type aliases to avoid naming conflicts
type SidebarMcpSpecInfo = McpSpecInfo;
type SidebarSkillInfo = SkillInfo;
type SidebarMemoryInfo = MemoryEntryInfo;
