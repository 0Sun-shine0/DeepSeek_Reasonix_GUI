// JobsPopover — popover panel showing running/ended background jobs

import { useT } from "../locale.js";
import type { JobInfo } from "../../shared/protocol.js";

type Props = { jobs: JobInfo[]; onClose: () => void; };

export function JobsPopover({ jobs, onClose }: Props) {
  const { t } = useT();
  const running = jobs.filter((j) => j.running);
  const done = jobs.filter((j) => !j.running);
  return (
    <div className="modal-overlay jobs-overlay" onClick={onClose}>
      <div className="popover jobs-popover" onClick={(e) => e.stopPropagation()}>
        <div className="popover-header"><span className="popover-title">{running.length > 0 ? "🔄" : "📋"} {t("jobs_title")}</span><span className="popover-count">{running.length} {t("jobs_count")} · {done.length}</span><button className="popover-close" onClick={onClose}>✕</button></div>
        <div className="popover-body">
          {jobs.length === 0 && <div className="popover-empty">{t("jobs_empty")}</div>}
          {jobs.map((job) => (
            <div key={job.id} className={`job-item ${job.running ? "running" : "exited"}`}>
              <div className="job-item-top"><span className={`job-status-dot ${job.running ? "running" : job.exitCode === 0 ? "exited" : "failed"}`} /><span className="job-command">{truncateCmd(job.command, 60)}</span>{job.startedAt > 0 && <span className="job-duration">{formatDuration(Date.now() - job.startedAt)}</span>}</div>
              {job.outputTail && <div className="job-output">{job.outputTail}</div>}
              {job.spawnError && <div className="job-output" style={{ color: "var(--red)" }}>{job.spawnError}</div>}
              {!job.running && job.exitCode != null && <span className={`job-exit-code ${job.exitCode === 0 ? "ok" : "fail"}`}>{t("jobs_exit")} {job.exitCode}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function truncateCmd(cmd: string, max: number): string { return cmd.length > max ? cmd.slice(0, max) + "..." : cmd; }
function formatDuration(ms: number): string { if (ms < 0) return "just now"; if (ms < 1000) return `${ms}ms`; if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`; return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`; }
