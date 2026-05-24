// TerminalPanel — integrated terminal emulator using xterm.js

import { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

type Props = {
  workspaceDir: string | null;
  onClose: () => void;
};

// Simple preset commands
const PRESETS = ["npm install", "npm run dev", "npm run build", "git status", "git diff", "ls"];

export function TerminalPanel({ workspaceDir, onClose }: Props) {
  const termRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!termRef.current) return;
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      theme: {
        background: "#1a1b26",
        foreground: "#c0caf5",
        cursor: "#7aa2f7",
        selectionBackground: "#3b4261",
        black: "#1a1b26",
        red: "#f7768e",
        green: "#9ece6a",
        yellow: "#e0af68",
        blue: "#7aa2f7",
        magenta: "#bb9af7",
        cyan: "#7dcfff",
        white: "#c0caf5",
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(termRef.current);
    fit.fit();
    terminalRef.current = term;
    fitRef.current = fit;

    term.writeln("🐋 Reasonix Terminal");
    term.writeln("Type a command and press Enter. Ctrl+C to cancel. Type 'exit' to close.");
    term.writeln("");

    if (workspaceDir) {
      term.writeln(`📁 ${workspaceDir}`);
    }
    term.writeln("");
    term.write("$ ");

    let cmdBuffer = "";

    const handleKey = ({ key, domEvent }: { key: string; domEvent: KeyboardEvent }) => {
      const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

      if (domEvent.key === "Enter") {
        term.writeln("");
        const cmd = cmdBuffer.trim();
        if (cmd === "exit" || cmd === "quit") {
          onClose();
          return;
        }
        if (cmd) {
          executeCommand(term, cmd, workspaceDir);
        } else {
          term.write("$ ");
        }
        cmdBuffer = "";
      } else if (domEvent.key === "Backspace") {
        if (cmdBuffer.length > 0) {
          cmdBuffer = cmdBuffer.slice(0, -1);
          term.write("\b \b");
        }
      } else if (domEvent.ctrlKey && domEvent.key === "c") {
        term.write("^C");
        term.writeln("");
        cmdBuffer = "";
        term.write("$ ");
      } else if (printable && key.length === 1) {
        cmdBuffer += key;
        term.write(key);
      }
    };

    term.onKey(handleKey);

    const handleResize = () => { try { fitRef.current?.fit(); } catch { /* */ } };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      term.dispose();
    };
  }, [workspaceDir, onClose]);

  // Preset button clicks
  const runPreset = (cmd: string) => {
    const term = terminalRef.current;
    if (!term) return;
    term.writeln(`$ ${cmd}`);
    executeCommand(term, cmd, workspaceDir);
  };

  return (
    <div className="terminal-panel">
      <div className="terminal-presets">
        {PRESETS.map((cmd) => (
          <button key={cmd} className="terminal-preset-btn" onClick={() => runPreset(cmd)}>
            {cmd}
          </button>
        ))}
        <button className="terminal-close-btn" onClick={onClose}>✕</button>
      </div>
      <div ref={termRef} className="terminal-xterm" />
    </div>
  );
}

function executeCommand(term: Terminal, cmd: string, workspaceDir: string | null) {
  // Use the existing run_command mechanism via window.electronAPI
  // For now, just display that the command would be sent
  term.writeln(`\x1b[33m[sending to agent: ${cmd}]\x1b[0m`);
  term.write("$ ");

  // In the future, we can spawn a real pty
  // For now, commands are dispatched through the agent's run_command tool
}
