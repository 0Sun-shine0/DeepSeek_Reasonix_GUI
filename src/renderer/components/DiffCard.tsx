// DiffCard — renders edit_file / multi_edit / write_file results as a visual diff with per-hunk accept/reject

import { useState, useMemo } from "react";
import { useT } from "../locale.js";

type Props = {
  toolName: string;
  args: string;
  result?: string;
  ok?: boolean;
};

type HunkState = "pending" | "accepted" | "rejected";

type DiffHunk = {
  id: string;
  path: string;
  header: string;
  dels: DiffLine[];
  adds: DiffLine[];
  state: HunkState;
};

type DiffLine = {
  type: "add" | "del" | "header" | "context";
  text: string;
  oldNum?: number;
  newNum?: number;
};

export function DiffCard({ toolName, args, result, ok }: Props) {
  const { t } = useT();
  const [viewMode, setViewMode] = useState<"unified" | "raw">("unified");
  const [hunks, setHunks] = useState<DiffHunk[]>(() => parseDiffHunks(result));
  const files = extractFilePaths(toolName, args);
  const isDiffable = hunks.length > 0;

  const acceptAll = () => setHunks((hs) => hs.map((h) => ({ ...h, state: "accepted" as const })));
  const rejectAll = () => setHunks((hs) => hs.map((h) => ({ ...h, state: "rejected" as const })));
  const acceptHunk = (id: string) => setHunks((hs) => hs.map((h) => h.id === id ? { ...h, state: "accepted" } : h));
  const rejectHunk = (id: string) => setHunks((hs) => hs.map((h) => h.id === id ? { ...h, state: "rejected" } : h));

  const accepted = hunks.filter((h) => h.state === "accepted").length;
  const total = hunks.length;

  return (
    <div className={`diff-card ${ok === false ? "fail" : ok === true ? "ok" : ""}`}>
      <div className="diff-header">
        <span className="diff-file-icon">{ok === false ? "❌" : "📝"}</span>
        <span className="diff-file-path">{files.length > 0 ? files.join(", ") : toolName}</span>
        {isDiffable && total > 1 && (
          <span className="diff-stats" style={{ marginLeft: "auto" }}>
            <span className="add">{accepted}</span>/<span className="del">{total}</span>
          </span>
        )}
        {result != null && (
          <button className="md-code-copy" onClick={() => setViewMode(viewMode === "unified" ? "raw" : "unified")}>
            {viewMode === "unified" ? t("diff_raw") : t("diff_diff")}
          </button>
        )}
      </div>

      {/* Batch actions */}
      {isDiffable && total > 1 && hunks.some((h) => h.state === "pending") && (
        <div className="diff-batch-actions">
          <button className="approval-btn allow" style={{ fontSize: "10px", padding: "2px 8px" }} onClick={acceptAll}>✓ Accept all ({total})</button>
          <button className="approval-btn deny" style={{ fontSize: "10px", padding: "2px 8px" }} onClick={rejectAll}>✕ Reject all</button>
        </div>
      )}

      {viewMode === "unified" && isDiffable ? (
        <div className="diff-body">
          {hunks.map((hunk) => (
            <div key={hunk.id} className={`diff-hunk hunk-${hunk.state}`}>
              <div className="diff-hunk-header">
                <span className="diff-hunk-path">{hunk.header}</span>
                {hunk.state === "pending" && (
                  <div className="diff-hunk-actions">
                    <button className="approval-btn allow" style={{ fontSize: "10px", padding: "1px 6px" }} onClick={() => acceptHunk(hunk.id)}>✓</button>
                    <button className="approval-btn deny" style={{ fontSize: "10px", padding: "1px 6px" }} onClick={() => rejectHunk(hunk.id)}>✕</button>
                  </div>
                )}
                {hunk.state === "accepted" && <span className="diff-hunk-status accepted">✓ Applied</span>}
                {hunk.state === "rejected" && <span className="diff-hunk-status rejected">✕ Skipped</span>}
              </div>
              {hunk.state !== "rejected" && (
                <div className="diff-hunk-lines">
                  {hunk.dels.map((line, i) => (
                    <div key={`del-${i}`} className={`diff-line del ${hunk.state === "accepted" ? "faded" : ""}`}>
                      <span className="diff-line-num">{line.oldNum ?? ""}</span>
                      <span className="diff-line-content">-{line.text}</span>
                    </div>
                  ))}
                  {hunk.adds.map((line, i) => (
                    <div key={`add-${i}`} className={`diff-line add ${hunk.state === "accepted" ? "faded" : ""}`}>
                      <span className="diff-line-num">{line.newNum ?? ""}</span>
                      <span className="diff-line-content">+{line.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="diff-body">
          <div className="diff-line header-line">
            <span className="diff-line-content" style={{ color: "var(--fg-dim)", fontStyle: "italic" }}>
              {result ?? "No result yet"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Parse tool result into diff hunks ───

function parseDiffHunks(result?: string): DiffHunk[] {
  if (!result) return [];
  try {
    const parsed = JSON.parse(result);
    if (!Array.isArray(parsed)) return [];
    const hunks: DiffHunk[] = [];
    let hunkIdx = 0;
    for (const item of parsed) {
      if (item.search && item.replace) {
        const searchLines = item.search.split("\n");
        const replaceLines = item.replace.split("\n");
        hunks.push({
          id: `${item.path ?? "file"}-${hunkIdx++}`,
          path: item.path ?? "",
          header: item.path ? `${item.path} — ${item.status ?? "modified"}` : "edit",
          dels: searchLines.map((t: string, i: number) => ({ type: "del" as const, text: t, oldNum: hunkIdx * 100 + i + 1 })),
          adds: replaceLines.map((t: string, i: number) => ({ type: "add" as const, text: t, newNum: hunkIdx * 100 + i + 1 })),
          state: "pending",
        });
      }
    }
    return hunks;
  } catch {
    return [];
  }
}

// ─── Extract file paths ───

function extractFilePaths(toolName: string, args: string): string[] {
  try {
    const parsed = JSON.parse(args);
    const paths: string[] = [];
    if (typeof parsed.path === "string") paths.push(parsed.path);
    if (toolName === "multi_edit" && Array.isArray(parsed.edits)) {
      for (const edit of parsed.edits) {
        if (typeof edit.path === "string" && !paths.includes(edit.path)) paths.push(edit.path);
      }
    }
    return paths;
  } catch { return []; }
}
