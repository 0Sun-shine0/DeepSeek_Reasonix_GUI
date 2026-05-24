// SymbolOutline — parse a file and show top-level symbols (functions, classes, interfaces)

import { useState, useEffect } from "react";

type Symbol = { name: string; kind: string; line: number };

type Props = { filePath: string; content: string; onJump: (line: number) => void };

export function SymbolOutline({ filePath, content, onJump }: Props) {
  const [symbols, setSymbols] = useState<Symbol[]>([]);

  useEffect(() => {
    const ext = filePath.split(".").pop()?.toLowerCase();
    if (ext === "ts" || ext === "tsx" || ext === "js" || ext === "jsx") {
      setSymbols(parseTS(content));
    } else if (ext === "py") {
      setSymbols(parsePython(content));
    } else {
      setSymbols([]);
    }
  }, [filePath, content]);

  if (symbols.length === 0) return <div className="sidebar-empty">No symbols found</div>;

  return (
    <div className="symbol-outline">
      {symbols.map((s, i) => (
        <div key={i} className="symbol-item" onClick={() => onJump(s.line)} title={`Jump to line ${s.line}`}>
          <span className={`symbol-icon symbol-${s.kind}`}>{iconFor(s.kind)}</span>
          <span className="symbol-name">{s.name}</span>
          <span className="symbol-line">:{s.line}</span>
        </div>
      ))}
    </div>
  );
}

function iconFor(kind: string): string {
  switch (kind) {
    case "function": case "method": return "ƒ";
    case "class": return "C";
    case "interface": return "I";
    case "type": return "T";
    case "enum": return "E";
    case "variable": case "const": return "v";
    default: return "•";
  }
}

function parseTS(code: string): Symbol[] {
  const syms: Symbol[] = [];
  const re = /(?:export\s+)?(?:async\s+)?(?:function|class|interface|enum|type|const|let|var)\s+(\w+)/gm;
  let m: RegExpExecArray | null;
  let lastIdx = 0;
  while ((m = re.exec(code)) !== null) {
    const kind = m[0].includes("function") ? "function"
      : m[0].includes("class") ? "class"
      : m[0].includes("interface") ? "interface"
      : m[0].includes("enum") ? "enum"
      : m[0].includes("type") ? "type" : "variable";
    syms.push({ name: m[1], kind, line: lineNumber(code, m.index) });
    lastIdx = m.index;
  }
  return syms;
}

function parsePython(code: string): Symbol[] {
  const syms: Symbol[] = [];
  const re = /^\s*(?:def|class)\s+(\w+)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    syms.push({ name: m[1], kind: m[0].includes("class") ? "class" : "function", line: lineNumber(code, m.index) });
  }
  return syms;
}

function lineNumber(code: string, pos: number): number {
  return code.slice(0, pos).split("\n").length;
}
