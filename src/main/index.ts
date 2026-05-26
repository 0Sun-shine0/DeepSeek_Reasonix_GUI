// Electron main process entry — spawns reasonix desktop child, bridges NDJSON ↔ renderer

import { app, BrowserWindow, Tray, Menu, globalShortcut, screen, nativeImage } from "electron";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { registerIpcHandlers } from "./ipc.js";
import { spawnReasonix, killReasonix, sendToReasonix } from "./rpc.js";
import { readFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

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

  mainWindow.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ─── System Tray ───

function createTray() {
  // Create a simple 16x16 tray icon (colored square with "R")
  const { nativeImage } = require("electron");
  const img = nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAQklEQVR42mNgGAWjYBSMgiEAAAAAA//8DAz+AgYaYGBgYIAAAJ0wMDCwMDAwMBsYGDkYGBjYGRgYOBgYGLgYGBh4mBgYeBgYGHkYGBgAgJICAKA="
  );
  tray = new Tray(img.resize({ width: 16, height: 16 }));
  tray.setToolTip("Reasonix");

  const contextMenu = Menu.buildFromTemplate([
    { label: "Show / Hide", click: () => toggleWindow() },
    { label: "New Chat", click: () => { showWindow(); mainWindow?.webContents.send("reasonix:new-chat"); } },
    { type: "separator" },
    { label: "Quit", click: () => { isQuitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(contextMenu);
  tray.on("click", () => toggleWindow());
}

function toggleWindow() {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    showWindow();
  }
}

function showWindow() {
  if (!mainWindow) return;
  mainWindow.show();
  mainWindow.focus();
}

// ─── Global Shortcut ───

function registerGlobalShortcut() {
  const ret = globalShortcut.register("Alt+Space", () => {
    toggleWindow();
  });
  if (!ret) console.log("[main] global shortcut registration failed");
}

app.whenReady().then(async () => {
  // 1. Register IPC handlers
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

  // 4. System tray
  createTray();

  // 5. Global shortcut
  registerGlobalShortcut();

  // 6. Auto-launch (configurable via settings)
  if (process.env.REASONIX_AUTO_LAUNCH === "1") {
    app.setLoginItemSettings({ openAtLogin: true });
  }

  // 7. Auto-updater check
  startAutoUpdate();

  // macOS: re-show on dock click
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      showWindow();
    }
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  isQuitting = true;
  killReasonix();
});

// Expose
export function getMainWindow() { return mainWindow; }
export { sendToReasonix };

// IPC: auto-launch toggle
import { ipcMain } from "electron";
ipcMain.on("app:setAutoLaunch", (_event, enable: boolean) => {
  app.setLoginItemSettings({ openAtLogin: enable });
});
ipcMain.handle("app:getAutoLaunch", () => {
  return app.getLoginItemSettings().openAtLogin;
});

// ─── Auto-updater ───
import { autoUpdater } from "electron-updater";

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Auto-updater events are registered here; check is triggered in the main
// app.whenReady block below via the existing spawn + ready flow.
function startAutoUpdate() {
  try { autoUpdater.checkForUpdatesAndNotify().catch(() => {}); } catch {}
}

autoUpdater.on("update-available", () => {
  mainWindow?.webContents.send("reasonix:update-available");
});

autoUpdater.on("download-progress", (progress) => {
  mainWindow?.webContents.send("reasonix:update-progress", progress.percent);
});

autoUpdater.on("update-downloaded", () => {
  mainWindow?.webContents.send("reasonix:update-downloaded");
});
