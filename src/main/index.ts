// Electron main process entry — spawns reasonix desktop child, bridges NDJSON ↔ renderer

import { app, BrowserWindow } from "electron";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { registerIpcHandlers } from "./ipc.js";
import { spawnReasonix, killReasonix, sendToReasonix } from "./rpc.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: "Reasonix",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // In dev, load from Vite dev server. In production, load built files.
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, "../../dist/index.html"));
  }

  mainWindow.on("enter-full-screen", () => {
    mainWindow?.webContents.send("reasonix:fullscreen", true);
  });

  mainWindow.on("leave-full-screen", () => {
    mainWindow?.webContents.send("reasonix:fullscreen", false);
  });

  mainWindow.on("resize", () => {
    mainWindow?.webContents.send("reasonix:resize");
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  // 1. Register IPC handlers so the renderer can talk to us
  registerIpcHandlers();

  // 2. Spawn reasonix desktop child process
  const onEvent = (event: unknown) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("reasonix:event", event);
    }
  };

  const onExit = (code: number | null) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("reasonix:exit", code);
    }
  };

  try {
    spawnReasonix(onEvent, onExit);
    console.log("[main] reasonix desktop spawned");
  } catch (err) {
    console.error("[main] failed to spawn reasonix:", err);
  }

  // 3. Create window
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  killReasonix();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  killReasonix();
});

// Expose for IPC handlers
export function getMainWindow() {
  return mainWindow;
}

export { sendToReasonix };
