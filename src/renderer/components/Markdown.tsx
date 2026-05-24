// Markdown.tsx — renders GFM markdown with syntax-highlighted code blocks

import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// @ts-expect-error — type defs for prism style path are missing
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism/index.js";

type Props = {
  children: string;
};

export function Markdown({ children }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children: codeChildren, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const raw = String(codeChildren).replace(/\n$/, "");
          const inline = !match && !raw.includes("\n");

          if (inline) {
            return (
              <code className="md-inline-code" {...props}>
                {raw}
              </code>
            );
          }

          const language = match?.[1] ?? "";

          return (
            <CodeBlock language={language} code={raw} />
          );
        },
        pre({ children }) {
          return <>{children}</>;
        },
        // Style tables
        table({ children }) {
          return <div className="md-table-wrap"><table className="md-table">{children}</table></div>;
        },
        // Style links to open externally
        a({ href, children }) {
          const handleClick = (e: React.MouseEvent) => {
            e.preventDefault();
            if (href) {
              window.electronAPI.openExternal?.(href);
            }
          };
          return (
            <a className="md-link" href={href} onClick={handleClick} rel="noreferrer">
              {children}
            </a>
          );
        },
        blockquote({ children }) {
          return <blockquote className="md-blockquote">{children}</blockquote>;
        },
        ul({ children }) {
          return <ul className="md-list">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="md-list">{children}</ol>;
        },
        hr() {
          return <hr className="md-hr" />;
        },
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

// ─── Code block with header + copy button ───

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className="md-code-block">
      <div className="md-code-header">
        <span className="md-code-lang">{language || "code"}</span>
        <button className="md-code-copy" onClick={handleCopy}>
          {copied ? "✓ Copied!" : "📋 Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: "0 0 6px 6px",
          fontSize: "13px",
          lineHeight: "1.5",
        }}
        showLineNumbers={code.split("\n").length > 3}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
