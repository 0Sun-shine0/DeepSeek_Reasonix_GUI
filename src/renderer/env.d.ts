/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    sendCommand: (cmd: import("../shared/protocol").OutgoingCommand) => void;
    onEvent: (cb: (event: import("../shared/protocol").IncomingEvent) => void) => () => void;
    onExit: (cb: (code: number | null) => void) => () => void;
    onResize: (cb: () => void) => () => void;
    onFullscreen: (cb: (isFullscreen: boolean) => void) => () => void;
    openDirectory: () => Promise<string | null>;
    listDirectory: (dirPath: string) => Promise<import("../main/ipc").FileTreeEntry[]>;
    gitStatus: (dirPath: string) => Promise<{ path: string; kind: string }[]>;
    openExternal: (url: string) => Promise<void>;
    gitBranch: (dirPath: string) => Promise<string | null>;
    getMatchingRules: (filePath: string, workspaceDir: string) => Promise<import("../main/ipc").RuleEntry[]>;
    notepadList: (ws: string) => Promise<string[]>;
    notepadRead: (ws: string, name: string) => Promise<string | null>;
    notepadWrite: (ws: string, name: string, content: string) => Promise<void>;
    notepadDelete: (ws: string, name: string) => Promise<void>;
  };
}
