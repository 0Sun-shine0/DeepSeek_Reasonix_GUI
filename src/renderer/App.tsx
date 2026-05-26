// Root App component — layout, reducer, event subscription

import { useReducer, useEffect, useRef, useCallback, useState } from "react";
import { reducer, initialState, type ChatMessage } from "./state.js";
import { useT } from "./locale.js";

function exportMarkdown(messages: ChatMessage[], sessionName?: string): string {
  const lines: string[] = [`# Reasonix — ${sessionName ?? "Chat"}\n`];
  for (const msg of messages) {
    switch (msg.kind) {
      case "user":
        lines.push(`### 🧑 You\n${msg.text}\n`);
        break;
      case "assistant":
        lines.push(`### 🐋 Reasonix\n`);
        for (const seg of msg.segments) {
          if (seg.kind === "text") lines.push(seg.text + "\n");
          else if (seg.kind === "reasoning") lines.push(`<details><summary>Thinking</summary>\n\n\`\`\`\n${seg.text}\n\`\`\`\n</details>\n`);
          else if (seg.kind === "tool") lines.push(`- 🔧 \`${seg.name}\` (${seg.ok ? "✅" : "❌"})\n`);
        }
        break;
      case "error":
        lines.push(`> ⚠ ${msg.message}\n`);
        break;
    }
  }
  return lines.join("\n");
}
import { onEvent, onExit, onResize, onFullscreen, sendCommand } from "./protocol.js";
import type { IncomingEvent, SettingsEvent } from "../shared/protocol.js";
import { Composer } from "./components/Composer.js";
import { Thread } from "./components/Thread.js";
import { Sidebar } from "./components/Sidebar.js";
import { StatusBar } from "./components/StatusBar.js";
import { ApprovalCard } from "./components/ApprovalCard.js";
import { PlanCard } from "./components/PlanCard.js";
import { CheckpointCard } from "./components/CheckpointCard.js";
import { RevisionCard } from "./components/RevisionCard.js";
import { ChoiceCard } from "./components/ChoiceCard.js";
import { SettingsModal } from "./components/SettingsModal.js";
import { SetupScreen } from "./components/SetupScreen.js";
import { CommandPalette, type Command } from "./components/CommandPalette.js";
import { DashboardCard } from "./components/DashboardCard.js";
import { JobsPopover } from "./components/JobsPopover.js";

export function App() {
  const { t, locale, setLocale } = useT();
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPalette, setShowPalette] = useState(false);
  const [showJobs, setShowJobs] = useState(false);
  const [gitBranch, setGitBranch] = useState<string | undefined>();
  const [injectedText, setInjectedText] = useState<string | null>(null);
  const [fontScale, setFontScale] = useState(() => Number(localStorage.getItem("reasonix-font-scale") || "100"));
  const [theme, setTheme] = useState<string>(
    () => localStorage.getItem("reasonix-theme") || "dark"
  );

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem("reasonix-theme", next);
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  }, []);

  // Subscribe to reasonix events
  useEffect(() => {
    const unsubEvent = onEvent((event: IncomingEvent) => {
      dispatch({ t: "incoming", event });
    });

    const unsubExit = onExit((code) => {
      dispatch({ t: "rpc_exit", code });
    });

    // Request initial data once ready
    const checkReady = onEvent((event) => {
      if (event.type === "$ready") {
        sendCommand({ cmd: "session_list" });
        sendCommand({ cmd: "settings_get" });
        sendCommand({ cmd: "mcp_specs_get" });
        sendCommand({ cmd: "skills_get" });
        sendCommand({ cmd: "memory_get" });
      }
      if (event.type === "$settings" && "workspaceDir" in event) {
        const ws = (event as SettingsEvent).workspaceDir;
        if (ws) window.electronAPI.gitBranch(ws).then((b) => setGitBranch(b ?? undefined)).catch(() => setGitBranch(undefined));
      }
    });

    return () => {
      unsubEvent();
      unsubExit();
      checkReady();
    };
  }, []);

  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const unsubResize = onResize(() => {
      forceUpdate((n) => n + 1);
    });
    const unsubFs = onFullscreen(() => {
      forceUpdate((n) => n + 1);
    });
    return () => {
      unsubResize();
      unsubFs();
    };
  }, []);

  // Send queued user messages when !busy
  const queuedSends = useRef<string[]>([]);

  const handleSend = useCallback(
    (text: string) => {
      if (state.busy) {
        queuedSends.current.push(text);
        return;
      }
      dispatch({ t: "send_user", text });
      sendCommand({ cmd: "user_input", text });
    },
    [state.busy],
  );

  // Drain queued sends when busy becomes false
  useEffect(() => {
    if (!state.busy && queuedSends.current.length > 0) {
      const next = queuedSends.current.shift()!;
      sendCommand({ cmd: "user_input", text: next });
    }
  }, [state.busy]);

  // Font zoom
  useEffect(() => {
    document.documentElement.style.setProperty("--font-scale", String(fontScale / 100));
    localStorage.setItem("reasonix-font-scale", String(fontScale));
  }, [fontScale]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        setFontScale((s) => Math.min(s + 10, 150));
        return;
      }
      if (mod && e.key === "-") {
        e.preventDefault();
        setFontScale((s) => Math.max(s - 10, 70));
        return;
      }
      if (mod && e.key === "k") {
        e.preventDefault();
        setShowPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleAbort = useCallback(() => {
    sendCommand({ cmd: "abort" });
  }, []);

  // Setup screen
  if (state.needsSetup) {
    return <SetupScreen />;
  }

  return (
    <div className="app">
      <div className="app-body">
        {showSidebar && (
          <Sidebar
            sessions={state.sessions}
            currentSession={state.currentSession}
            mcpSpecs={state.mcpSpecs}
            skills={state.skills}
            memory={state.memory}
            workspaceDir={state.settings?.workspaceDir ?? null}
            contextFiles={state.contextFiles}
            contextTokens={state.contextTokens}
            usage={state.usage}
            onSelectSession={(name) => sendCommand({ cmd: "session_load", name })}
            onNewChat={() => sendCommand({ cmd: "new_chat" })}
            onDeleteSession={(name) => sendCommand({ cmd: "session_delete", name })}
            onRenameSession={(oldName, title) => sendCommand({ cmd: "session_rename", name: oldName, title })}
            onSelectFile={(path) => { setInjectedText(`@${path} `); }}
            onAddMcp={(spec) => sendCommand({ cmd: "mcp_specs_add", spec })}
            onRemoveMcp={(spec) => sendCommand({ cmd: "mcp_specs_remove", spec })}
            onRemoveSkill={(name) => {
              sendCommand({ cmd: "user_input", text: `/skill forget ${name}` });
            }}
            onRemoveMemory={(name, scope) => {
              sendCommand({ cmd: "user_input", text: `/memory forget ${name} --scope ${scope}` });
            }}
            onToggle={() => setShowSidebar(false)}
          />
        )}

        <div className="app-main">
          {/* Approval cards overlay */}
          <div className="approval-overlay">
            {state.pendingConfirms.map((c) => (
              <ApprovalCard
                key={c.id}
                confirm={c}
                onAllow={() => {
                  sendCommand({ cmd: "confirm_response", id: c.id, response: { type: "run_once" } });
                  dispatch({ t: "resolve_confirm", id: c.id });
                }}
                onAlwaysAllow={() => {
                  const prefix = c.command.trim().split(/\s+/)[0] || c.command;
                  sendCommand({ cmd: "confirm_response", id: c.id, response: { type: "always_allow", prefix } });
                  dispatch({ t: "resolve_confirm", id: c.id });
                }}
                onDeny={() => {
                  sendCommand({ cmd: "confirm_response", id: c.id, response: { type: "deny" } });
                  dispatch({ t: "resolve_confirm", id: c.id });
                }}
              />
            ))}
            {state.pendingPathAccess.map((p) => (
              <div key={p.id} className="approval-card path-access-card">
                <div className="approval-header">
                  <span className="approval-icon">📂</span>
                  <span className="approval-title">Allow file access?</span>
                </div>
                <div className="path-access-body">
                  <p><strong>{p.toolName}</strong> wants to <em>{p.intent}</em>:</p>
                  <code className="path-access-path">{p.path}</code>
                  <p className="path-access-hint">
                    Sandbox root: <code>{p.sandboxRoot}</code>
                    <br />Allow prefix: <code>{p.allowPrefix}</code>
                  </p>
                </div>
                <div className="approval-actions">
                  <button className="approval-btn deny" onClick={() => {
                    sendCommand({ cmd: "confirm_response", id: p.id, response: { type: "deny" } });
                    dispatch({ t: "resolve_path_access", id: p.id });
                  }}>✕ Deny</button>
                  <button className="approval-btn allow" onClick={() => {
                    sendCommand({ cmd: "confirm_response", id: p.id, response: { type: "run_once" } });
                    dispatch({ t: "resolve_path_access", id: p.id });
                  }}>✓ Allow once</button>
                </div>
              </div>
            ))}
            {state.pendingPlans.map((p) => (
              <PlanCard
                key={p.id}
                plan={p}
                onApprove={() => {
                  sendCommand({ cmd: "plan_response", id: p.id, response: { type: "approve" } });
                  dispatch({ t: "resolve_plan", id: p.id, approved: true });
                }}
                onReject={() => {
                  sendCommand({ cmd: "plan_response", id: p.id, response: { type: "cancel" } });
                  dispatch({ t: "resolve_plan", id: p.id, approved: false });
                }}
              />
            ))}
            {state.pendingChoices.map((c) => (
              <ChoiceCard
                key={c.id}
                choice={c}
                onPick={(optionId) => {
                  sendCommand({ cmd: "choice_response", id: c.id, response: { type: "pick", optionId } });
                  dispatch({ t: "resolve_choice", id: c.id });
                }}
                onPickText={(text) => {
                  sendCommand({ cmd: "choice_response", id: c.id, response: { type: "text", text } });
                  dispatch({ t: "resolve_choice", id: c.id });
                }}
                onCancel={() => {
                  sendCommand({ cmd: "choice_response", id: c.id, response: { type: "cancel" } });
                  dispatch({ t: "resolve_choice", id: c.id });
                }}
              />
            ))}
            {state.pendingCheckpoints.map((c) => (
              <CheckpointCard
                key={c.id}
                checkpoint={c}
                onContinue={() => {
                  sendCommand({ cmd: "checkpoint_response", id: c.id, response: { type: "continue" } });
                  dispatch({ t: "resolve_checkpoint", id: c.id });
                }}
                onStop={() => {
                  sendCommand({ cmd: "checkpoint_response", id: c.id, response: { type: "stop" } });
                  dispatch({ t: "resolve_checkpoint", id: c.id });
                }}
              />
            ))}
            {state.pendingRevisions.map((r) => (
              <RevisionCard
                key={r.id}
                revision={r}
                currentSteps={state.activePlan?.steps}
                onAccept={() => {
                  sendCommand({ cmd: "revision_response", id: r.id, response: { type: "accepted" } });
                  dispatch({ t: "resolve_revision", id: r.id });
                }}
                onReject={() => {
                  sendCommand({ cmd: "revision_response", id: r.id, response: { type: "rejected" } });
                  dispatch({ t: "resolve_revision", id: r.id });
                }}
              />
            ))}
          </div>

          {/* Message thread or dashboard */}
          {state.messages.filter((m) => m.kind === "user" || m.kind === "assistant").length === 0 &&
           state.settings?.workspaceDir ? (
            <div className="thread">
              <div className="thread-messages">
                <DashboardCard
                  workspaceDir={state.settings.workspaceDir}
                  onStartTask={() => {
                    // Focus the composer
                    const ta = document.querySelector(".composer-input") as HTMLTextAreaElement | null;
                    ta?.focus();
                  }}
                />
              </div>
            </div>
          ) : (
            <Thread
              messages={state.messages}
              activePlan={state.activePlan}
              busy={state.busy}
              onDismissPlan={() => dispatch({ t: "dismiss_plan" })}
              onDismissError={(id) => dispatch({ t: "dismiss_error", id })}
              onCopyMessage={(msg) => {
                const text = extractMessageText(msg);
                navigator.clipboard.writeText(text);
              }}
              onRetry={() => sendCommand({ cmd: "retry" })}
              onEditResend={(text) => {
              sendCommand({ cmd: "user_input", text });
            }}
              onQuickAction={(prompt) => {
                dispatch({ t: "send_user", text: prompt });
                sendCommand({ cmd: "user_input", text: prompt });
              }}
              onFixError={(errorMsg) => {
                const text = `Fix this error: ${errorMsg}`;
                dispatch({ t: "send_user", text });
                sendCommand({ cmd: "user_input", text });
              }}
              onUndo={() => dispatch({ t: "undo_last" })}
              onDebate={() => {
                const debatePrompt = "Critique the above response. Point out any errors, missing edge cases, alternative approaches, or improvements.";
                dispatch({ t: "send_user", text: debatePrompt });
                sendCommand({ cmd: "user_input", text: debatePrompt });
              }}
              onRegenerate={() => {
                // Find last assistant turn and regenerate
                const lastAsst = [...state.messages].reverse().find((m) => m.kind === "assistant");
                if (lastAsst) {
                  dispatch({ t: "regenerate", turn: lastAsst.turn ?? 0 });
                  sendCommand({ cmd: "retry" });
                }
              }}
              onExport={() => {
                const md = exportMarkdown(state.messages, state.currentSession);
                const blob = new Blob([md], { type: "text/markdown" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `reasonix-${state.currentSession ?? "chat"}.md`;
                a.click();
                URL.revokeObjectURL(url);
              }}
          />
          )}

          {/* Composer */}
          <Composer
            busy={state.busy}
            onSend={handleSend}
            onAbort={handleAbort}
            onToggleSidebar={() => setShowSidebar((s) => !s)}
            onOpenSettings={() => setShowSettings(true)}
            contextFiles={state.contextFiles}
            workspaceDir={state.settings?.workspaceDir ?? null}
            onOpenFolder={async () => {
              const dir = await window.electronAPI.openDirectory();
              if (dir) {
                sendCommand({ cmd: "settings_save", workspaceDir: dir });
                setTimeout(() => {
                  sendCommand({ cmd: "new_chat" });
                }, 200);
              }
            }}
            sidebarVisible={showSidebar}
            injectedText={injectedText}
            onConsumeInjected={() => setInjectedText(null)}
          />
        </div>
      </div>

      {/* Status bar */}
      <StatusBar
        model={state.model}
        ready={state.ready}
        busy={state.busy}
        usage={state.usage}
        balance={state.balance}
        runningJobs={state.jobs.filter((j) => j.running).length}
        gitBranch={gitBranch}
        onToggleJobs={() => setShowJobs((s) => !s)}
        onCommitMessage={() => sendCommand({ cmd: "user_input", text: "Generate a concise commit message for all staged changes based on the git diff." })}
      />

      {/* Settings modal */}
      {showSettings && state.settings && (
        <SettingsModal
          settings={state.settings}
          onClose={() => setShowSettings(false)}
          onSave={(patch) => {
            sendCommand({ cmd: "settings_save", ...patch });
          }}
          onOpenDirectory={async () => {
            const dir = await window.electronAPI.openDirectory();
            return dir;
          }}
        />
      )}

      {/* Jobs popover */}
      {showJobs && (
        <JobsPopover
          jobs={state.jobs}
          onClose={() => setShowJobs(false)}
        />
      )}

      {/* Command palette */}
      {showPalette && (
        <CommandPalette
          commands={paletteCommands({
            onNewChat: () => sendCommand({ cmd: "new_chat" }),
            onOpenFolder: async () => {
              const dir = await window.electronAPI.openDirectory();
              if (dir) {
                sendCommand({ cmd: "settings_save", workspaceDir: dir });
                setTimeout(() => {
                  sendCommand({ cmd: "new_chat" });
                }, 200);
              }
            },
            onOpenSettings: () => setShowSettings(true),
            onToggleSidebar: () => setShowSidebar((s) => !s),
            onToggleTheme: toggleTheme,
            onToggleLocale: () => setLocale(locale === "zh" ? "en" : "zh"),
            onAbort: () => sendCommand({ cmd: "abort" }),
            onRetry: () => sendCommand({ cmd: "retry" }),
            onCompactHistory: () => sendCommand({ cmd: "compact_history" }),
            onSessionList: () => sendCommand({ cmd: "session_list" }),
            onClear: () => dispatch({ t: "clear" }),
          })}
          onClose={() => setShowPalette(false)}
        />
      )}
    </div>
  );
}

function extractMessageText(msg: ChatMessage): string {
  switch (msg.kind) {
    case "user":
      return msg.text;
    case "assistant":
      return msg.segments
        .filter((s) => s.kind === "text")
        .map((s) => s.text)
        .join("\n");
    default:
      return "";
  }
}

function paletteCommands(opts: {
  onNewChat: () => void;
  onOpenFolder: () => void;
  onOpenSettings: () => void;
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
  onToggleLocale: () => void;
  onAbort: () => void;
  onRetry: () => void;
  onCompactHistory: () => void;
  onSessionList: () => void;
  onClear: () => void;
}): Command[] {
  return [
    { id: "new-chat", title: "New Chat", shortcut: "⌘N", category: "Session", action: opts.onNewChat },
    { id: "open-folder", title: "Open Folder", shortcut: "⌘O", category: "Workspace", action: opts.onOpenFolder },
    { id: "settings", title: "Settings", shortcut: "⌘,", category: "Preferences", action: opts.onOpenSettings },
    { id: "toggle-theme", title: "Toggle Theme", category: "View", action: opts.onToggleTheme },
    { id: "toggle-locale", title: "切换语言 / Switch Language", category: "View", action: opts.onToggleLocale },
    { id: "toggle-sidebar", title: "Toggle Sidebar", shortcut: "⌘B", category: "View", action: opts.onToggleSidebar },
    { id: "abort", title: "Abort Agent", shortcut: "Esc", category: "Agent", action: opts.onAbort },
    { id: "retry", title: "Retry Last Message", shortcut: "⌘R", category: "Agent", action: opts.onRetry },
    { id: "compact", title: "Compact History", category: "Agent", action: opts.onCompactHistory },
    { id: "sessions", title: "List Sessions", category: "Session", action: opts.onSessionList },
    { id: "clear", title: "Clear Messages", category: "View", action: opts.onClear },
  ];
}


