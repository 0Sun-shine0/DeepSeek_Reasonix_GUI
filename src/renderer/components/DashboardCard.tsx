// DashboardCard — project overview when a folder is opened

import { useState, useEffect } from "react";
import { useT, type TFunction } from "../locale.js";

type GitEntry = { path: string; kind: string };

type Props = { workspaceDir: string; onStartTask: () => void; };

export function DashboardCard({ workspaceDir, onStartTask }: Props) {
  const { t } = useT();
  const [gitEntries, setGitEntries] = useState<GitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!workspaceDir) return;
    setLoading(true);
    window.electronAPI.gitStatus(workspaceDir).then((entries) => { setGitEntries(entries ?? []); setLoading(false); }).catch(() => { setGitEntries([]); setLoading(false); });
  }, [workspaceDir]);
  const name = workspaceDir.split(/[/\\]/).pop() || workspaceDir;
  const added = gitEntries.filter((e) => e.kind === "added").length;
  const modified = gitEntries.filter((e) => e.kind === "modified").length;
  const deleted = gitEntries.filter((e) => e.kind === "deleted").length;
  const untracked = gitEntries.filter((e) => e.kind === "untracked").length;
  const total = gitEntries.length;
  const greeting = getGreeting(t);
  return (
    <div className="dashboard-card">
      <div className="dashboard-header"><span className="dashboard-icon">📁</span><div className="dashboard-title-area"><span className="dashboard-project-name">{name}</span><span className="dashboard-path">{workspaceDir}</span></div></div>
      <div className="dashboard-greeting">🐋 {greeting}</div>
      {!loading && gitEntries.length > 0 && (<div className="dashboard-git">
        <div className="dashboard-git-title">{t("dashboard_git_title")}</div>
        <div className="dashboard-git-stats">
          {modified > 0 && <GitStat label={t("dashboard_git_modified")} count={modified} color="var(--yellow)" />}
          {added > 0 && <GitStat label={t("dashboard_git_added")} count={added} color="var(--green)" />}
          {deleted > 0 && <GitStat label={t("dashboard_git_deleted")} count={deleted} color="var(--red)" />}
          {untracked > 0 && <GitStat label={t("dashboard_git_untracked")} count={untracked} color="var(--fg-dim)" />}
        </div>
        {total > 0 && (<div className="dashboard-git-files">{gitEntries.slice(0, 10).map((e, i) => (<div key={i} className={`dashboard-git-file ${e.kind}`}><span className="git-file-kind">{kindIcon(e.kind)}</span><span className="git-file-path">{e.path}</span></div>))}{total > 10 && <div className="dashboard-git-more">{t("dashboard_git_more")} {total - 10}</div>}</div>)}
      </div>)}
      <div className="dashboard-actions"><button className="dashboard-action-btn primary" onClick={onStartTask}>{t("dashboard_start")}</button></div>
    </div>
  );
}

function GitStat({ label, count, color }: { label: string; count: number; color: string }) {
  return <div className="git-stat"><span className="git-stat-dot" style={{ backgroundColor: color }} /><span className="git-stat-label">{label}</span><span className="git-stat-count">{count}</span></div>;
}

function kindIcon(kind: string): string { switch (kind) { case "added": return "A"; case "modified": return "M"; case "deleted": return "D"; case "untracked": return "?"; case "renamed": return "R"; default: return "•"; } }

function getGreeting(t: TFunction): string {
  const h = new Date().getHours();
  if (h < 6) return t("dashboard_greeting_night");
  if (h < 12) return t("dashboard_greeting_morning");
  if (h < 18) return t("dashboard_greeting_afternoon");
  return t("dashboard_greeting_evening");
}
