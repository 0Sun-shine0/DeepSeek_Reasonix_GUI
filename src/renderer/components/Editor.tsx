// Editor — Monaco-based code viewer with Cmd+K inline AI editing

import { useState, useRef, useEffect } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

type Props = {
  filePath: string;
  content: string;
  language?: string;
  visible: boolean;
  onClose: () => void;
  onInlineEdit?: (selectedText: string, instruction: string) => void;
};

export function CodeEditor({ filePath, content, language, visible, onClose, onInlineEdit }: Props) {
  const [inlinePrompt, setInlinePrompt] = useState("");
  const [showInline, setShowInline] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleMount: OnMount = (ed) => {
    editorRef.current = ed;
    // Cmd+K inline editing
    ed.addAction({
      id: "inline-ai-edit",
      label: "AI Edit (Cmd+K)",
      keybindings: [2048 | 46], // Cmd+K
      run: (e) => {
        const sel = e.getModel()?.getValueInRange(e.getSelection() ?? e.getModel()!.getFullModelRange()) ?? "";
        setSelectedText(sel);
        setShowInline(true);
      },
    });
  };

  const handleInlineSubmit = () => {
    if (inlinePrompt.trim() && onInlineEdit) {
      onInlineEdit(selectedText, inlinePrompt.trim());
      setInlinePrompt("");
      setShowInline(false);
    }
  };

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && showInline) { setShowInline(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showInline]);

  if (!visible) return null;

  const lang = language ?? detectLanguage(filePath);

  return (
    <div className="editor-panel">
      <div className="editor-header">
        <span className="editor-path">📄 {filePath}</span>
        <button className="editor-close" onClick={onClose}>✕</button>
      </div>
      <div className="editor-body">
        <Editor
          height="100%"
          language={lang}
          value={content}
          theme="vs-dark"
          onMount={handleMount}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: "on",
          }}
        />
      </div>
      {showInline && (
        <div className="editor-inline">
          <div className="editor-inline-header">
            <span>🔧 AI Edit — {truncate(selectedText, 50)}</span>
            <button className="editor-close" onClick={() => setShowInline(false)}>✕</button>
          </div>
          <textarea
            className="editor-inline-input"
            placeholder="Describe the change you want..."
            value={inlinePrompt}
            onChange={(e) => setInlinePrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleInlineSubmit(); } }}
            autoFocus
            rows={2}
          />
          <div className="editor-inline-actions">
            <button className="approval-btn deny" onClick={() => setShowInline(false)}>Cancel</button>
            <button className="approval-btn allow" onClick={handleInlineSubmit}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

function detectLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = { ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript", py: "python", rs: "rust", go: "go", java: "java", css: "css", html: "html", json: "json", md: "markdown", yaml: "yaml", yml: "yaml", toml: "ini", sql: "sql", sh: "shell", bash: "shell" };
  return map[ext ?? ""] ?? "plaintext";
}

function truncate(s: string, n: number): string { return s.length > n ? s.slice(0, n) + "..." : s; }
