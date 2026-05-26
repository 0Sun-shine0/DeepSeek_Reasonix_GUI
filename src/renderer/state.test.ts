// Tests for state reducer — pure function, ideal for unit testing
import { describe, it, expect } from "vitest";

// Minimal inline replica of the reducer to avoid importing 600+ lines
// Tests the reducer logic directly on the pure function

import { reducer, initialState, type State, type Action } from "./state.js";

describe("reducer", () => {
  it("send_user: adds user message and sets busy", () => {
    const state = reducer(initialState, { t: "send_user", text: "hello" });
    expect(state.busy).toBe(true);
    expect(state.messages.length).toBe(1);
    expect(state.messages[0].kind).toBe("user");
    expect((state.messages[0] as any).text).toBe("hello");
  });

  it("send_user: queues when already busy", () => {
    const busyState: State = { ...initialState, busy: true };
    // The reducer doesn't enforce queuing — that's in App.tsx handleSend.
    // But reducer should still add message:
    const state = reducer(busyState, { t: "send_user", text: "hello2" });
    expect(state.messages.length).toBe(1);
  });

  it("dismiss_error: removes error message", () => {
    const withError: State = {
      ...initialState,
      messages: [{ kind: "error", message: "test error", id: "e1" }],
    };
    const state = reducer(withError, { t: "dismiss_error", id: "e1" });
    expect(state.messages.length).toBe(0);
  });

  it("clear: resets messages but keeps settings", () => {
    const withSettings: State = {
      ...initialState,
      settings: { reasoningEffort: "max", editMode: "auto", budgetUsd: 5, workspaceDir: "/test", recentWorkspaces: [], model: "deepseek-v4", preset: "pro", version: "1.0" },
      messages: [{ kind: "user", text: "hi", turn: 1 }],
      ready: true,
    };
    const state = reducer(withSettings, { t: "clear" });
    expect(state.messages.length).toBe(0);
    expect(state.ready).toBe(true);
    expect(state.settings?.model).toBe("deepseek-v4");
  });

  it("rpc_exit: marks not ready and appends error", () => {
    const state = reducer({ ...initialState, ready: true, busy: true }, { t: "rpc_exit", code: 1 });
    expect(state.ready).toBe(false);
    expect(state.busy).toBe(false);
    expect(state.messages.some((m) => m.kind === "error")).toBe(true);
  });

  it("undo_last: removes last user+assistant pair", () => {
    const state: State = {
      ...initialState,
      busy: true,
      messages: [
        { kind: "user", text: "q1", turn: 1 },
        { kind: "assistant", turn: 1, segments: [{ kind: "text", text: "a1" }], pending: false },
        { kind: "user", text: "q2", turn: 2 },
        { kind: "assistant", turn: 2, segments: [], pending: true },
      ],
    };
    const result = reducer(state, { t: "undo_last" });
    expect(result.busy).toBe(false);
    expect(result.messages.length).toBe(2); // only first pair remains
    expect((result.messages[0] as any).text).toBe("q1");
  });

  it("regenerate: removes messages from turn onward", () => {
    const state: State = {
      ...initialState,
      messages: [
        { kind: "user", text: "q1", turn: 1 },
        { kind: "assistant", turn: 1, segments: [], pending: false },
        { kind: "user", text: "q2", turn: 2 },
      ],
    };
    const result = reducer(state, { t: "regenerate", turn: 2 });
    expect(result.messages.length).toBe(2); // keeps turn 1 only
    expect(result.busy).toBe(false);
  });

  it("$ready event: sets ready and clears needsSetup", () => {
    const state = reducer({ ...initialState, needsSetup: true }, {
      t: "incoming",
      event: { type: "$ready" },
    } as Action);
    expect(state.ready).toBe(true);
    expect(state.needsSetup).toBe(false);
  });

  it("$turn_complete: clears busy and pending queues", () => {
    const state: State = {
      ...initialState,
      busy: true,
      pendingConfirms: [{ id: 1, kind: "run_command", command: "ls" }],
      pendingChoices: [{ id: 2, question: "?", options: [], allowCustom: false }],
      pendingPlans: [{ id: 3, plan: "p", summary: "s" }],
      pendingCheckpoints: [{ id: 4, stepId: "s1", title: "t", result: "r", completed: 1, total: 3 }],
      pendingRevisions: [{ id: 5, reason: "r", remainingSteps: [] }],
    };
    const result = reducer(state, {
      t: "incoming",
      event: { type: "$turn_complete" },
    } as Action);
    expect(result.busy).toBe(false);
    expect(result.pendingConfirms.length).toBe(0);
    expect(result.pendingChoices.length).toBe(0);
    expect(result.pendingPlans.length).toBe(0);
    expect(result.pendingCheckpoints.length).toBe(0);
    expect(result.pendingRevisions.length).toBe(0);
  });
});
