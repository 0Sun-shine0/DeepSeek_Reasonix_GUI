// Codebase indexer — scans workspace files and builds a searchable index

import { Worker } from 'worker_threads';
import { join } from 'path';
export type IndexEntry = { path: string; size: number; mtime: number; ext: string; };

export async function buildIndex(workspaceDir: string): Promise<IndexEntry[]> {
  return new Promise<IndexEntry[]>((resolve) => {
    try {
      const worker = new Worker(new URL('./indexer.worker.ts', import.meta.url), {
        workerData: { root: workspaceDir },
      } as any);

      const timeout = setTimeout(() => {
        try { worker.terminate(); } catch {}
        resolve([]);
      }, 30_000);

      worker.on('message', (msg: any) => {
        clearTimeout(timeout);
        if (msg && msg.success && Array.isArray(msg.entries)) {
          resolve(msg.entries as IndexEntry[]);
        } else {
          resolve([]);
        }
      });

      worker.on('error', () => { clearTimeout(timeout); resolve([]); });
      worker.on('exit', () => { /* noop */ });
    } catch {
      // Fallback: return empty index on failure
      resolve([]);
    }
  });
}

export function searchIndex(entries: IndexEntry[], query: string): IndexEntry[] {
  const q = query.toLowerCase();
  return entries.filter((e) => e.path.toLowerCase().includes(q)).slice(0, 50);
}
