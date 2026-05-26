// Renderer state management — mirrors the Tauri desktop's reduce function

import type {
  IncomingEvent,
  Settings,
  SessionInfo,
  PlanStep,
  McpSpecInfo,
  SkillInfo,
  MemoryEntryInfo,
  JobInfo,
} from "../shared/protocol.js";

// Re-export for component convenience
export type { PlanStep };

// ─── Assistant message segments ───

export type AssistantSegment =
  | { kind: "text"; text: string }
  | { kind: "reasoning"; text: string }
  | {
      kind: "tool";
      callId: string;
      name: string;
      args: string;
      startedAt: number;
      result?: string;
      ok?: boolean;
      durationMs?: number;
    };

export type ChatMessage =
  | { kind: "user"; text: string; turn: number }
  | { kind: "assistant"; turn: number; segments: AssistantSegment[]; pending: boolean }
  | { kind: "status"; text: string }
  | { kind: "error"; message: string; id: string; recoverable?: boolean };

export type PendingConfirm = {
  id: number;
  kind: "run_command" | "run_background";
  command: string;
};

export type PendingChoice = {
  id: number;
  question: string;
  options: { id: string; title: string; summary?: string }[];
  allowCustom: boolean;
};

export type PendingPathAccess = {
  id: number;
  path: string;
  intent: string;
  toolName: string;
  sandboxRoot: string;
  allowPrefix: string;
};

export type PendingPlan = {
  id: number;
  plan: string;
  summary?: string;
  steps?: PlanStep[];
};

export type ActivePlan = {
  plan: string;
  summary?: string;
  steps: PlanStep[];
  completedStepIds: string[];
};

export type PendingCheckpoint = {
  id: number;
  stepId: string;
  title?: string;
  result: string;
  notes?: string;
  completed: number;
  total: number;
};

export type PendingRevision = {
  id: number;
  reason: string;
  remainingSteps: PlanStep[];
  summary?: string;
};

export type UsageStats = {
  totalCostUsd: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  cacheHitTokens: number;
  cacheMissTokens: number;
  reservedTokens: number;
};

// ─── Full state ───

export type State = {
  ready: boolean;
  needsSetup: boolean;
  busy: boolean;
  model?: string;
  currentSession?: string;
  messages: ChatMessage[];
  pendingConfirms: PendingConfirm[];
  pendingChoices: PendingChoice[];
  pendingPathAccess: PendingPathAccess[];
  pendingPlans: PendingPlan[];
  pendingCheckpoints: PendingCheckpoint[];
  pendingRevisions: PendingRevision[];
  activePlan: ActivePlan | null;
  usage: UsageStats;
  sessions: SessionInfo[];
  settings: Settings | null;
  balance: { currency: string; total: number; isAvailable: boolean } | null;
  mcpSpecs: McpSpecInfo[];
  skills: SkillInfo[];
  memory: MemoryEntryInfo[];
  jobs: JobInfo[];
  retryText?: string;
  retryNonce: number;
  contextFiles: ContextFile[];
  contextTokens: ContextTokens;
};

export type ContextFile = {
  path: string;
  status: "read" | "modified";
  toolName: string;
  turn: number;
};

export type ContextTokens = {
  systemTokens: number;
  historyTokens: number;
  toolTokens: number;
};

// ─── Initial state ───

function zeroUsage(): UsageStats {
  return {
    totalCostUsd: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    cacheHitTokens: 0,
    cacheMissTokens: 0,
    reservedTokens: 0,
  };
}

export const initialState: State = {
  ready: false,
  needsSetup: false,
  busy: false,
  messages: [],
  pendingConfirms: [],
  pendingChoices: [],
  pendingPathAccess: [],
  pendingPlans: [],
  pendingCheckpoints: [],
  pendingRevisions: [],
  activePlan: null,
  usage: zeroUsage(),
  sessions: [],
  settings: null,
  balance: null,
  mcpSpecs: [],
  skills: [],
  memory: [],
  jobs: [],
  retryNonce: 0,
  contextFiles: [],
  contextTokens: { systemTokens: 0, historyTokens: 0, toolTokens: 0 },
};

// ─── Actions ───

export type Action =
  | { t: "send_user"; text: string }
  | { t: "incoming"; event: IncomingEvent }
  | { t: "resolve_confirm"; id: number }
  | { t: "resolve_choice"; id: number }
  | { t: "resolve_path_access"; id: number }
  | { t: "resolve_plan"; id: number; approved: boolean }
  | { t: "resolve_checkpoint"; id: number }
  | { t: "resolve_revision"; id: number }
  | { t: "dismiss_plan" }
  | { t: "dismiss_error"; id: string }
  | { t: "clear" }
  | { t: "undo_last" }
  | { t: "regenerate"; turn: number }
  | { t: "rpc_exit"; code: number | null };

// ─── Reducer ───

let _errSeq = 0;
function nextErrorId(): string {
  _errSeq += 1;
  return `err-${Date.now().toString(36)}-${_errSeq}`;
}

function nextMessageTurn(msgs: ChatMessage[]): number {
  return (
    msgs.reduce((max, m) => {
      if (m.kind === "user" || m.kind === "assistant") return Math.max(max, m.turn);
      return max;
    }, 0) + 1
  );
}

export function reducer(state: State, action: Action): State {
  switch (action.t) {
    case "send_user": {
      const turn = nextMessageTurn(state.messages);
      return {
        ...state,
        busy: true,
        messages: [...state.messages, { kind: "user", text: action.text, turn }],
      };
    }

    case "rpc_exit":
      return {
        ...state,
        ready: false,
        busy: false,
        messages: [
          ...state.messages,
          {
            kind: "error",
            message: `Reasonix exited (code ${action.code ?? "?"})`,
            id: nextErrorId(),
          },
        ],
      };

    case "incoming":
      return applyIncoming(state, action.event);

    case "resolve_confirm":
      return { ...state, pendingConfirms: state.pendingConfirms.filter((c) => c.id !== action.id) };

    case "resolve_choice":
      return { ...state, pendingChoices: state.pendingChoices.filter((c) => c.id !== action.id) };

    case "resolve_path_access":
      return { ...state, pendingPathAccess: state.pendingPathAccess.filter((p) => p.id !== action.id) };

    case "resolve_plan": {
      const removed = state.pendingPlans.find((p) => p.id === action.id);
      let activePlan = state.activePlan;
      if (removed && action.approved) {
        activePlan = {
          plan: removed.plan,
          summary: removed.summary,
          steps: removed.steps ?? [],
          completedStepIds: [],
        };
      }
      return {
        ...state,
        pendingPlans: state.pendingPlans.filter((p) => p.id !== action.id),
        activePlan,
      };
    }

    case "resolve_checkpoint":
      return {
        ...state,
        pendingCheckpoints: state.pendingCheckpoints.filter((c) => c.id !== action.id),
      };

    case "resolve_revision":
      return {
        ...state,
        pendingRevisions: state.pendingRevisions.filter((r) => r.id !== action.id),
      };

    case "dismiss_plan":
      return { ...state, activePlan: null };

    case "dismiss_error":
      return {
        ...state,
        messages: state.messages.filter((m) => !(m.kind === "error" && m.id === action.id)),
      };

    case "clear":
      return {
        ...initialState,
        ready: state.ready,
        needsSetup: state.needsSetup,
        settings: state.settings,
        sessions: state.sessions,
        balance: state.balance,
        mcpSpecs: state.mcpSpecs,
        skills: state.skills,
        memory: state.memory,
      };

    case "undo_last": {
      const msgs = [...state.messages];
      let lastUser = -1;
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].kind === "user") { lastUser = i; break; }
      }
      if (lastUser >= 0) msgs.splice(lastUser);
      return { ...state, messages: msgs, busy: false };
    }

    case "regenerate": {
      const msgs = state.messages.filter((m) => m.kind !== "user" || m.turn < action.turn);
      return { ...state, messages: msgs, busy: false };
    }

    default:
      return state;
  }
}

// ─── Incoming event handler ───

function applyIncoming(state: State, ev: IncomingEvent): State {
  switch (ev.type) {
    case "$ready":
      return { ...state, ready: true, needsSetup: false };

    case "$needs_setup":
      return { ...state, needsSetup: true, ready: false };

    case "$turn_complete":
      return {
        ...state,
        busy: false,
        pendingConfirms: [],
        pendingChoices: [],
        pendingPathAccess: [],
        pendingPlans: [],
        pendingCheckpoints: [],
        pendingRevisions: [],
      };

    case "$confirm_required":
      return {
        ...state,
        pendingConfirms: [
          ...state.pendingConfirms,
          { id: ev.id, kind: ev.kind, command: ev.command },
        ],
      };

    case "$choice_required":
      return {
        ...state,
        pendingChoices: [
          ...state.pendingChoices,
          { id: ev.id, question: ev.question, options: ev.options, allowCustom: ev.allowCustom },
        ],
      };

    case "$plan_required":
      return {
        ...state,
        pendingPlans: [
          ...state.pendingPlans,
          { id: ev.id, plan: ev.plan, summary: ev.summary, steps: ev.steps as PlanStep[] | undefined },
        ],
      };

    case "$checkpoint_required":
      return {
        ...state,
        pendingCheckpoints: [
          ...state.pendingCheckpoints,
          {
            id: ev.id,
            stepId: ev.stepId,
            title: ev.title,
            result: ev.result,
            notes: ev.notes,
            completed: ev.completed,
            total: ev.total,
          },
        ],
      };

    case "$revision_required":
      return {
        ...state,
        pendingRevisions: [
          ...state.pendingRevisions,
          { id: ev.id, reason: ev.reason, remainingSteps: ev.remainingSteps as PlanStep[], summary: ev.summary },
        ],
      };

    case "$step_completed": {
      if (!state.activePlan) return state;
      const stepIds = new Set(state.activePlan.completedStepIds);
      stepIds.add(ev.stepId);
      return {
        ...state,
        activePlan: { ...state.activePlan, completedStepIds: [...stepIds] },
      };
    }

    case "$plan_cleared":
      return { ...state, activePlan: null };

    case "$sessions":
      return { ...state, sessions: ev.items };

    case "$settings": {
      const { type: _settingsType, ...clean } = ev;
      return { ...state, settings: clean };
    }

    case "$balance":
      return { ...state, balance: { currency: ev.currency, total: ev.total, isAvailable: ev.isAvailable } };

    case "$mcp_specs":
      return { ...state, mcpSpecs: ev.specs };

    case "$skills":
      return { ...state, skills: ev.items };

    case "$memory":
      return { ...state, memory: ev.entries };

    case "$path_access_required":
      return {
        ...state,
        pendingPathAccess: [
          ...state.pendingPathAccess,
          {
            id: ev.id,
            path: ev.path,
            intent: ev.intent,
            toolName: ev.toolName,
            sandboxRoot: ev.sandboxRoot,
            allowPrefix: ev.allowPrefix,
          },
        ],
      };

    case "$jobs":
      return { ...state, jobs: ev.items };

    case "$retry_result":
      return { ...state, retryText: ev.text, retryNonce: state.retryNonce + 1 };

    case "$session_empty":
      return { ...state, currentSession: ev.name, messages: [], busy: false, activePlan: null };

    case "$session_loaded": {
      let turnCounter = 0;
      const restored: ChatMessage[] = (ev.messages ?? []).map((m) => {
        if (m.kind === "user") {
          turnCounter += 1;
          return { kind: "user", text: m.text, turn: turnCounter };
        }
        if (m.kind === "assistant") {
          return {
            kind: "assistant",
            turn: m.turn,
            pending: false,
            segments: (m.segments ?? []).map((seg) => {
              if (seg.kind === "tool") {
                return {
                  kind: "tool" as const,
                  callId: seg.callId,
                  name: seg.name,
                  args: seg.args,
                  startedAt: Date.now(),
                  result: seg.result,
                  ok: seg.ok,
                };
              }
              return seg;
            }),
          };
        }
        return { kind: "status", text: "" };
      });

      return {
        ...state,
        currentSession: ev.name,
        messages: restored,
        usage: {
          totalCostUsd: ev.carryover?.totalCostUsd ?? 0,
          totalPromptTokens: 0,
          totalCompletionTokens: 0,
          cacheHitTokens: ev.carryover?.cacheHitTokens ?? 0,
          cacheMissTokens: ev.carryover?.cacheMissTokens ?? 0,
          reservedTokens: 0,
        },
      };
    }

    case "$ctx_breakdown":
      return {
        ...state,
        usage: { ...state.usage, reservedTokens: ev.reservedTokens },
      };

    case "user.message": {
      const turn = ev.turn > 0 ? ev.turn : nextMessageTurn(state.messages);
      return {
        ...state,
        busy: true,
        messages: [...state.messages, { kind: "user", text: ev.text, turn }],
      };
    }

    case "model.turn.started":
      return {
        ...state,
        model: ev.model,
        messages: [
          ...state.messages,
          { kind: "assistant", turn: ev.turn, segments: [], pending: true },
        ],
      };

    case "model.delta": {
      const channel = ev.channel === "tool_args" ? "text" : ev.channel;
      return {
        ...state,
        messages: state.messages.map((m) => {
          if (m.kind !== "assistant" || m.turn !== ev.turn) return m;
          const segments = appendTextSegment(m.segments, channel as "text" | "reasoning", ev.text);
          return { ...m, segments };
        }),
      };
    }

    case "model.final": {
      return {
        ...state,
        usage: {
          ...state.usage,
          totalPromptTokens: state.usage.totalPromptTokens + (ev.usage?.prompt_tokens ?? 0),
          totalCompletionTokens: state.usage.totalCompletionTokens + (ev.usage?.completion_tokens ?? 0),
          totalCostUsd: state.usage.totalCostUsd + (ev.costUsd ?? 0),
          cacheHitTokens: state.usage.cacheHitTokens + (ev.usage?.prompt_cache_hit_tokens ?? 0),
          cacheMissTokens: state.usage.cacheMissTokens + (ev.usage?.prompt_cache_miss_tokens ?? 0),
        },
        messages: state.messages.map((m) => {
          if (m.kind !== "assistant" || m.turn !== ev.turn) return m;
          return { ...m, pending: false };
        }),
      };
    }

    case "tool.preparing":
      return {
        ...state,
        messages: state.messages.map((m) => {
          if (m.kind !== "assistant" || m.turn !== ev.turn) return m;
          if (m.segments.some((s) => s.kind === "tool" && s.callId === ev.callId)) return m;
          return {
            ...m,
            segments: [
              ...m.segments,
              { kind: "tool" as const, callId: ev.callId, name: ev.name, args: "", startedAt: Date.now() },
            ],
          };
        }),
      };

    case "tool.intent": {
      const newFiles = extractContextFiles(ev.name, ev.args, ev.turn);
      return {
        ...state,
        contextFiles: mergeContextFiles(state.contextFiles, newFiles),
        messages: state.messages.map((m) => {
          if (m.kind !== "assistant" || m.turn !== ev.turn) return m;
          return {
            ...m,
            segments: m.segments.map((s) => {
              if (s.kind === "tool" && s.callId === ev.callId) {
                return { ...s, args: ev.args };
              }
              return s;
            }),
          };
        }),
      };
    }

    case "tool.result":
      return {
        ...state,
        messages: state.messages.map((m) => {
          if (m.kind !== "assistant" || m.turn !== ev.turn) return m;
          return {
            ...m,
            segments: m.segments.map((s) => {
              if (s.kind === "tool" && s.callId === ev.callId) {
                return {
                  ...s,
                  result: ev.output,
                  ok: ev.ok,
                  durationMs: Date.now() - s.startedAt,
                };
              }
              return s;
            }),
          };
        }),
      };

    case "status":
      return {
        ...state,
        messages: [...state.messages, { kind: "status", text: ev.text }],
      };

    case "error":
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            kind: "error",
            message: ev.message,
            id: nextErrorId(),
            recoverable: ev.recoverable,
          },
        ],
      };

    case "$error":
      return {
        ...state,
        busy: false,
        messages: [
          ...state.messages,
          { kind: "error", message: ev.message, id: nextErrorId() },
        ],
      };

    default:
      return state;
  }
}

const READ_TOOLS = new Set(["read_file", "get_symbols", "find_in_code"]);
const MODIFY_TOOLS = new Set(["edit_file", "write_file", "multi_edit"]);

function extractContextFiles(name: string, args: string, turn: number): ContextFile[] {
  try {
    const parsed = JSON.parse(args);
    const files: ContextFile[] = [];

    if (READ_TOOLS.has(name) && typeof parsed.path === "string") {
      files.push({ path: parsed.path, status: "read", toolName: name, turn });
    }
    if (MODIFY_TOOLS.has(name) && typeof parsed.path === "string") {
      files.push({ path: parsed.path, status: "modified", toolName: name, turn });
    }
    if (name === "multi_edit" && Array.isArray(parsed.edits)) {
      for (const e of parsed.edits) {
        if (typeof e.path === "string") {
          files.push({ path: e.path, status: "modified", toolName: name, turn });
        }
      }
    }
    return files;
  } catch {
    return [];
  }
}

function mergeContextFiles(existing: ContextFile[], adds: ContextFile[]): ContextFile[] {
  const byPath = new Map<string, ContextFile>();
  for (const f of existing) byPath.set(f.path, f);
  for (const f of adds) {
    const prev = byPath.get(f.path);
    // Modified beats read
    if (!prev || (f.status === "modified" && prev.status === "read")) {
      byPath.set(f.path, f);
    }
  }
  return [...byPath.values()];
}

function appendTextSegment(
  segments: AssistantSegment[],
  kind: "text" | "reasoning",
  text: string,
): AssistantSegment[] {
  const last = segments[segments.length - 1];
  if (last && last.kind === kind) {
    return [...segments.slice(0, -1), { ...last, text: last.text + text }];
  }
  return [...segments, { kind, text }];
}
