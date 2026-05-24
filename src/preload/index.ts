// Preload script — exposes a safe API to the renderer via contextBridge

import { contextBridge, ipcRenderer } from "electron";
import type { IncomingEvent, OutgoingCommand } from "../shared/protocol.js";

const api = {
  /** Send a command to the reasonix backend */
  sendCommand: (cmd: OutgoingCommand) => {
    ipcRenderer.send("reasonix:send", cmd);
  },

  /** Listen for events from the reasonix backend */
  onEvent: (callback: (event: IncomingEvent) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: IncomingEvent) => {
      callback(data);
    };
    ipcRenderer.on("reasonix:event", handler);
    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener("reasonix:event", handler);
    };
  },

  /** Listen for backend exit */
  onExit: (callback: (code: number | null) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, code: number | null) => {
      callback(code);
    };
    ipcRenderer.on("reasonix:exit", handler);
    return () => {
      ipcRenderer.removeListener("reasonix:exit", handler);
    };
  },

  /** Listen for window resize events */
  onResize: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on("reasonix:resize", handler);
    return () => {
      ipcRenderer.removeListener("reasonix:resize", handler);
    };
  },

  /** Listen for fullscreen changes */
  onFullscreen: (callback: (isFullscreen: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, isFullscreen: boolean) => {
      callback(isFullscreen);
    };
    ipcRenderer.on("reasonix:fullscreen", handler);
    return () => {
      ipcRenderer.removeListener("reasonix:fullscreen", handler);
    };
  },

  /** Open a directory picker dialog */
  openDirectory: (): Promise<string | null> => {
    return ipcRenderer.invoke("dialog:openDirectory");
  },

  /** List directory tree */
  listDirectory: (dirPath: string): Promise<unknown[]> => {
    return ipcRenderer.invoke("fs:listDirectory", dirPath);
  },

  /** Get git status for a directory */
  gitStatus: (dirPath: string): Promise<{ path: string; kind: string }[]> => {
    return ipcRenderer.invoke("git:status", dirPath);
  },

  /** Open URL in system browser */
  openExternal: (url: string): Promise<void> => {
    return ipcRenderer.invoke("shell:openExternal", url);
  },

  /** Get matching rules for a file path */
  getMatchingRules: (filePath: string, workspaceDir: string): Promise<import("../main/ipc").RuleEntry[]> => {
    return ipcRenderer.invoke("rules:getMatching", filePath, workspaceDir);
  },

  /** Get current git branch */
  gitBranch: (dirPath: string): Promise<string | null> => {
    return ipcRenderer.invoke("git:branch", dirPath);
  },

  /** Notepads */
  notepadList: (ws: string): Promise<string[]> => ipcRenderer.invoke("notepads:list", ws),
  notepadRead: (ws: string, name: string): Promise<string | null> => ipcRenderer.invoke("notepads:read", ws, name),
  notepadWrite: (ws: string, name: string, content: string): Promise<void> => ipcRenderer.invoke("notepads:write", ws, name, content),
  notepadDelete: (ws: string, name: string): Promise<void> => ipcRenderer.invoke("notepads:delete", ws, name),
};

contextBridge.exposeInMainWorld("electronAPI", api);

// Type declaration for the renderer
export type ElectronAPI = typeof api;
