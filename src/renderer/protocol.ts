// Renderer-side bridge — typesafe wrapper around window.electronAPI

import type { IncomingEvent, OutgoingCommand } from "../shared/protocol.js";

const api = window.electronAPI;

export function sendCommand(cmd: OutgoingCommand) {
  api.sendCommand(cmd);
}

export function onEvent(callback: (event: IncomingEvent) => void): () => void {
  return api.onEvent(callback);
}

export function onExit(callback: (code: number | null) => void): () => void {
  return api.onExit(callback);
}

export function onResize(callback: () => void): () => void {
  return api.onResize(callback);
}

export function onFullscreen(callback: (isFullscreen: boolean) => void): () => void {
  return api.onFullscreen(callback);
}

export function openDirectory(): Promise<string | null> {
  return api.openDirectory();
}

export type FileTreeEntry = {
  name: string;
  path: string;
  kind: "file" | "dir";
  children?: FileTreeEntry[];
};

export function listDirectory(dirPath: string): Promise<FileTreeEntry[]> {
  return api.listDirectory(dirPath) as Promise<FileTreeEntry[]>;
}
