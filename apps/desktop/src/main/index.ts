import { app, BrowserWindow, globalShortcut } from "electron";
import { electronApp, optimizer } from "@electron-toolkit/utils";

import { registerIpcHandlers } from "./ipc";
import { registerGlobalShortcuts } from "./shortcuts";
import { createWindow } from "./window";

let mainWindow: BrowserWindow | null = null;

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.nexus.copilot");

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  registerIpcHandlers();
  mainWindow = createWindow();
  registerGlobalShortcuts(getMainWindow);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
