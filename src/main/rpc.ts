// Spawns and manages the reasonix desktop child process via NDJSON over stdin/stdout

import { spawn, ChildProcess } from "child_process";
import { createInterface } from "readline";
import type { IncomingEvent, OutgoingCommand } from "../shared/protocol.js";

let child: ChildProcess | null = null;
let onEvent: ((event: IncomingEvent) => void) | null = null;
let onExit: ((code: number | null) => void) | null = null;

export function spawnReasonix(
  eventCb: (event: IncomingEvent) => void,
  exitCb: (code: number | null) => void,
) {
  if (child) return; // already running

  onEvent = eventCb;
  onExit = exitCb;

  // Try to find the reasonix CLI.
  // Priority: REASONIX_CLI env var → system `reasonix` → npx reasonix
  const cli = process.env.REASONIX_CLI ?? "npx";
  const args =
    process.env.REASONIX_CLI
      ? ["desktop"]
      : ["-y", "reasonix@latest", "desktop"];

  console.log(`[rpc] spawning: ${cli} ${args.join(" ")}`);

  child = spawn(cli, args, {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env },
    shell: process.platform === "win32",
  });

  // Read NDJSON lines from stdout
  const stdoutLines = createInterface({ input: child.stdout! });
  stdoutLines.on("line", (line: string) => {
    if (!line.trim()) return;
    try {
      const event = JSON.parse(line) as IncomingEvent;
      onEvent?.(event);
    } catch {
      // Non-JSON lines (e.g., startup banners) — log and ignore
      console.log("[rpc stdout]", line);
    }
  });

  // Forward stderr
  const stderrLines = createInterface({ input: child.stderr! });
  stderrLines.on("line", (line: string) => {
    console.log("[rpc stderr]", line);
  });

  child.on("exit", (code) => {
    console.log(`[rpc] reasonix exited with code ${code}`);
    child = null;
    onExit?.(code);
  });

  child.on("error", (err) => {
    console.error(`[rpc] spawn error: ${err.message}`);
    child = null;
  });
}

export function sendToReasonix(cmd: OutgoingCommand) {
  if (!child?.stdin) {
    console.error("[rpc] cannot send — child not running");
    return;
  }
  const line = JSON.stringify(cmd);
  child.stdin.write(line + "\n");
}

export function killReasonix() {
  if (!child) return;
  console.log("[rpc] killing reasonix child...");
  // Close stdin first (graceful shutdown signal)
  child.stdin?.end();
  // Give it a moment, then force kill
  setTimeout(() => {
    if (child && !child.killed) {
      child.kill("SIGTERM");
      setTimeout(() => {
        if (child && !child.killed) {
          child.kill("SIGKILL");
        }
      }, 3000);
    }
  }, 500);
}
