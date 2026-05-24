// Shared protocol types — mirrors reasonix desktop/src/protocol.ts

// ─── Incoming events (reasonix → renderer) ───

export type ReadyEvent = { type: "$ready" };
export type ProtocolErrorEvent = { type: "$error"; message: string };
export type TurnCompleteEvent = { type: "$turn_complete" };
export type NeedsSetupEvent = {
  type: "$needs_setup";
  reason: "no_api_key";
};

export type ConfirmRequiredEvent = {
  type: "$confirm_required";
  id: number;
  kind: "run_command" | "run_background";
  command: string;
  prompt?: ApprovalPrompt;
};

export type PathAccessRequiredEvent = {
  type: "$path_access_required";
  id: number;
  path: string;
  intent: "read" | "write";
  toolName: string;
  sandboxRoot: string;
  allowPrefix: string;
  prompt?: ApprovalPrompt;
};

export type ChoiceOption = {
  id: string;
  title: string;
  summary?: string;
};

export type ChoiceRequiredEvent = {
  type: "$choice_required";
  id: number;
  question: string;
  options: ChoiceOption[];
  allowCustom: boolean;
};

export type PlanStep = {
  id: string;
  title: string;
  action: string;
  risk?: "low" | "med" | "high";
};

export type PlanRequiredEvent = {
  type: "$plan_required";
  id: number;
  plan: string;
  steps?: PlanStep[];
  summary?: string;
};

export type CheckpointRequiredEvent = {
  type: "$checkpoint_required";
  id: number;
  stepId: string;
  title?: string;
  result: string;
  notes?: string;
  completed: number;
  total: number;
};

export type RevisionRequiredEvent = {
  type: "$revision_required";
  id: number;
  reason: string;
  remainingSteps: PlanStep[];
  summary?: string;
};

export type StepCompletedEvent = {
  type: "$step_completed";
  stepId: string;
  title?: string;
  result: string;
  notes?: string;
};

export type PlanClearedEvent = { type: "$plan_cleared" };

export type SessionInfo = {
  name: string;
  messageCount: number;
  mtime: string;
  summary?: string;
};

export type SessionsEvent = {
  type: "$sessions";
  items: SessionInfo[];
};

export type Settings = {
  reasoningEffort: "high" | "max";
  editMode: "review" | "auto" | "yolo";
  budgetUsd: number | null;
  baseUrl?: string;
  apiKeyPrefix?: string;
  apiKey?: string;
  workspaceDir: string;
  recentWorkspaces: string[];
  model: string;
  preset: "flash" | "pro";
  editor?: string;
  webSearchEngine?: string;
  subagentModels?: Record<string, "flash" | "pro">;
  version: string;
};

export type SettingsEvent = { type: "$settings" } & Settings;

export type McpSpecInfo = {
  raw: string;
  name: string | null;
  transport: "stdio" | "sse" | "streamable-http";
  summary: string;
  parseError?: string;
  status: string;
  statusReason?: string;
  toolCount?: number;
};

export type McpSpecsEvent = {
  type: "$mcp_specs";
  specs: McpSpecInfo[];
  bridged: boolean;
};

export type SkillInfo = {
  name: string;
  description: string;
  scope: "project" | "global" | "builtin";
  path: string;
  runAs: "inline" | "subagent";
  model?: string;
};

export type SkillsEvent = {
  type: "$skills";
  items: SkillInfo[];
};

export type MemoryEntryInfo = {
  name: string;
  scope: "project" | "global";
  description: string;
};

export type MemoryEvent = {
  type: "$memory";
  entries: MemoryEntryInfo[];
};

export type JobInfo = {
  id: number;
  tabId: string;
  sessionLabel: string;
  command: string;
  pid: number | null;
  running: boolean;
  exitCode: number | null;
  startedAt: number;
  outputTail: string;
  spawnError?: string;
};

export type JobsEvent = {
  type: "$jobs";
  items: JobInfo[];
};

export type CtxBreakdownEvent = {
  type: "$ctx_breakdown";
  reservedTokens: number;
  logTokens?: number;
};

export type BalanceEvent = {
  type: "$balance";
  currency: string;
  total: number;
  isAvailable: boolean;
};

export type RetryResultEvent = { type: "$retry_result"; text: string };

export type LoadedSegment =
  | { kind: "text"; text: string }
  | { kind: "reasoning"; text: string }
  | { kind: "tool"; callId: string; name: string; args: string; result?: string; ok?: boolean };

export type LoadedMessage =
  | { kind: "user"; text: string }
  | { kind: "assistant"; turn: number; segments: LoadedSegment[]; pending: false };

export type SessionLoadedEvent = {
  type: "$session_loaded";
  name: string;
  messages: LoadedMessage[];
  carryover: {
    totalCostUsd: number;
    cacheHitTokens: number;
    cacheMissTokens: number;
  };
};

export type SessionEmptyEvent = {
  type: "$session_empty";
  name: string;
  sizeBytes: number;
};

// ─── Stream events ───

export type UserMessageEvent = {
  type: "user.message";
  id: number;
  ts: string;
  turn: number;
  text: string;
};

export type ModelTurnStartedEvent = {
  type: "model.turn.started";
  id: number;
  ts: string;
  turn: number;
  model: string;
  reasoningEffort: "high" | "max";
  prefixHash: string;
};

export type ModelDeltaEvent = {
  type: "model.delta";
  id: number;
  ts: string;
  turn: number;
  channel: "content" | "reasoning" | "tool_args";
  text: string;
};

export type Usage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  prompt_cache_hit_tokens?: number;
  prompt_cache_miss_tokens?: number;
};

export type ModelFinalEvent = {
  type: "model.final";
  id: number;
  ts: string;
  turn: number;
  content: string;
  reasoningContent?: string;
  usage?: Usage;
  costUsd?: number;
};

export type ToolPreparingEvent = {
  type: "tool.preparing";
  id: number;
  ts: string;
  turn: number;
  callId: string;
  name: string;
};

export type ToolIntentEvent = {
  type: "tool.intent";
  id: number;
  ts: string;
  turn: number;
  callId: string;
  name: string;
  args: string;
};

export type ToolResultEvent = {
  type: "tool.result";
  id: number;
  ts: string;
  turn: number;
  callId: string;
  ok: boolean;
  output: string;
};

export type StatusEvent = {
  type: "status";
  id: number;
  ts: string;
  turn: number;
  text: string;
};

export type KernelErrorEvent = {
  type: "error";
  id: number;
  ts: string;
  turn: number;
  message: string;
  recoverable: boolean;
};

// ─── Union ───

export type IncomingEvent =
  | ReadyEvent
  | ProtocolErrorEvent
  | TurnCompleteEvent
  | ConfirmRequiredEvent
  | PathAccessRequiredEvent
  | ChoiceRequiredEvent
  | PlanRequiredEvent
  | CheckpointRequiredEvent
  | RevisionRequiredEvent
  | StepCompletedEvent
  | PlanClearedEvent
  | SessionsEvent
  | SessionLoadedEvent
  | SessionEmptyEvent
  | NeedsSetupEvent
  | SettingsEvent
  | McpSpecsEvent
  | SkillsEvent
  | MemoryEvent
  | JobsEvent
  | CtxBreakdownEvent
  | BalanceEvent
  | RetryResultEvent
  | UserMessageEvent
  | ModelTurnStartedEvent
  | ModelDeltaEvent
  | ModelFinalEvent
  | ToolPreparingEvent
  | ToolIntentEvent
  | ToolResultEvent
  | StatusEvent
  | KernelErrorEvent;

// ─── Outgoing commands (renderer → reasonix) ───

export type ConfirmationChoice =
  | { type: "deny"; denyContext?: string }
  | { type: "run_once" }
  | { type: "always_allow"; prefix: string };

export type ChoiceVerdict =
  | { type: "pick"; optionId: string }
  | { type: "text"; text: string }
  | { type: "cancel" };

export type PlanVerdict =
  | { type: "approve"; feedback?: string }
  | { type: "refine"; feedback?: string }
  | { type: "cancel"; feedback?: string };

export type CheckpointVerdict =
  | { type: "continue" }
  | { type: "revise"; feedback?: string }
  | { type: "stop" };

export type RevisionVerdict =
  | { type: "accepted" }
  | { type: "rejected" }
  | { type: "cancelled" };

export type SettingsPatch = {
  model?: string;
  apiKey?: string;
  reasoningEffort?: "high" | "max";
  editMode?: "review" | "auto" | "yolo";
  budgetUsd?: number | null;
  baseUrl?: string;
  workspaceDir?: string;
  preset?: "flash" | "pro";
  editor?: string;
  webSearchEngine?: string;
  subagentModels?: Record<string, "flash" | "pro">;
};

export type OutgoingCommand =
  | { cmd: "user_input"; text: string }
  | { cmd: "abort" }
  | { cmd: "confirm_response"; id: number; response: ConfirmationChoice }
  | { cmd: "choice_response"; id: number; response: ChoiceVerdict }
  | { cmd: "plan_response"; id: number; response: PlanVerdict }
  | { cmd: "checkpoint_response"; id: number; response: CheckpointVerdict }
  | { cmd: "revision_response"; id: number; response: RevisionVerdict }
  | { cmd: "session_list" }
  | { cmd: "session_delete"; name: string }
  | { cmd: "session_load"; name: string }
  | { cmd: "session_rename"; name: string; title: string }
  | { cmd: "new_chat" }
  | { cmd: "setup_save_key"; key: string }
  | { cmd: "settings_get" }
  | { cmd: "settings_save" } & SettingsPatch
  | { cmd: "mcp_specs_get" }
  | { cmd: "mcp_specs_add"; spec: string }
  | { cmd: "mcp_specs_remove"; spec: string }
  | { cmd: "skills_get" }
  | { cmd: "skill_run"; name: string; args?: string }
  | { cmd: "memory_get" }
  | { cmd: "jobs_list" }
  | { cmd: "jobs_stop"; jobId: number }
  | { cmd: "jobs_stop_all" }
  | { cmd: "compact_history" }
  | { cmd: "retry" }
  | { cmd: "btw"; text: string };

// ─── Approval prompt (from @reasonix/core-utils) ───

export type ApprovalPrompt = {
  kind: string;
  action: string;
  tone: string;
  rule?: string;
  message?: string;
};
