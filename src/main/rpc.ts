// Spawns and manages the reasonix desktop child process via NDJSON over stdin/stdout

import { spawn, type ChildProcess } from "child_process";
import { createInterface } from "readline";
import type { IncomingEvent, OutgoingCommand } from "../shared/protocol.js";

export class ReasonixProcess {
  private child: ChildProcess | null = null;
  private onEvent: ((event: IncomingEvent) => void) | null = null;
  private onExit: ((code: number | null) => void) | null = null;

  constructor(
    eventCb: (event: IncomingEvent) => void,
    exitCb: (code: number | null) => void,
  ) {
    this.onEvent = eventCb;
    this.onExit = exitCb;
    this.start();
  }

  private start() {
    const cli = process.env.REASONIX_CLI ?? "npx";
    const args = process.env.REASONIX_CLI
      ? ["desktop"]
      : ["-y", "reasonix@latest", "desktop"];

    console.log(`[rpc] spawning: ${cli} ${args.join(" ")}`);

    this.child = spawn(cli, args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
      shell: process.platform === "win32",
    });

    const stdoutLines = createInterface({ input: this.child.stdout! });
    stdoutLines.on("line", (line: string) => {
      if (!line.trim()) return;
      try {
        const event = JSON.parse(line) as IncomingEvent;
        this.onEvent?.(event);
      } catch {
        console.log("[rpc stdout]", line);
      }
    });

    const stderrLines = createInterface({ input: this.child.stderr! });
    stderrLines.on("line", (line: string) => console.log("[rpc stderr]", line));

    this.child.on("exit", (code) => {
      console.log(`[rpc] reasonix exited with code ${code}`);
      this.child = null;
      this.onExit?.(code);
    });

    this.child.on("error", (err) => {
      console.error(`[rpc] spawn error: ${err.message}`);
      this.child = null;
    });
  }

  send(cmd: OutgoingCommand) {
    if (!this.child?.stdin) {
      console.error("[rpc] cannot send — child not running");
      return;
    }
    this.child.stdin.write(JSON.stringify(cmd) + "\n");
  }

  kill() {
    if (!this.child) return;
    console.log("[rpc] killing reasonix child...");
    this.child.stdin?.end();
    setTimeout(() => {
      if (this.child && !this.child.killed) {
        this.child.kill("SIGTERM");
        setTimeout(() => {
          if (this.child && !this.child.killed) this.child.kill("SIGKILL");
        }, 3000);
      }
    }, 500);
  }
}

// Legacy re-exports for index.ts compatibility
let _instance: ReasonixProcess | null = null;

export function spawnReasonix(
  eventCb: (event: IncomingEvent) => void,
  exitCb: (code: number | null) => void,
) {
  if (_instance) return;
  _instance = new ReasonixProcess(eventCb, exitCb);
}

export function sendToReasonix(cmd: OutgoingCommand) {
  _instance?.send(cmd);
}

export function killReasonix() {
  _instance?.kill();
  _instance = null;
}
