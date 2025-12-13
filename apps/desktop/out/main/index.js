"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const utils = require("@electron-toolkit/utils");
const fs = require("node:fs");
const path = require("node:path");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const fs__namespace = /* @__PURE__ */ _interopNamespaceDefault(fs);
const path__namespace = /* @__PURE__ */ _interopNamespaceDefault(path);
const IPC_CHANNELS = {
  // Window controls
  WINDOW_MINIMIZE: "window:minimize",
  WINDOW_MAXIMIZE: "window:maximize",
  WINDOW_CLOSE: "window:close",
  // Audio capture
  AUDIO_GET_SOURCES: "audio:get-sources",
  AUDIO_CHECK_SCREEN_PERMISSION: "audio:check-screen-permission",
  AUDIO_REQUEST_MIC_PERMISSION: "audio:request-mic-permission",
  AUDIO_SAVE_FILE: "audio:save-file",
  AUDIO_SHOW_SAVE_DIALOG: "audio:show-save-dialog",
  AUDIO_SAVE_TO_PATH: "audio:save-to-path",
  // App info
  APP_GET_VERSIONS: "app:get-versions",
  APP_GET_PATH: "app:get-path"
};
function registerIpcHandlers() {
  registerWindowHandlers();
  registerAudioHandlers();
  registerAppHandlers();
}
function registerWindowHandlers() {
  electron.ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    getMainWindow()?.minimize();
  });
  electron.ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    const window = getMainWindow();
    if (window?.isMaximized()) {
      window.unmaximize();
    } else {
      window?.maximize();
    }
  });
  electron.ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => {
    getMainWindow()?.close();
  });
}
function registerAudioHandlers() {
  electron.ipcMain.handle(
    IPC_CHANNELS.AUDIO_GET_SOURCES,
    async () => {
      try {
        const sources = await electron.desktopCapturer.getSources({
          types: ["screen"],
          fetchWindowIcons: false
        });
        return sources.map((source) => ({
          id: source.id,
          name: source.name
        }));
      } catch (error) {
        console.error("Error getting audio sources:", error);
        throw error;
      }
    }
  );
  electron.ipcMain.handle(
    IPC_CHANNELS.AUDIO_CHECK_SCREEN_PERMISSION,
    async () => {
      if (process.platform !== "darwin") {
        return { status: "granted" };
      }
      const status = electron.systemPreferences.getMediaAccessStatus("screen");
      return { status };
    }
  );
  electron.ipcMain.handle(
    IPC_CHANNELS.AUDIO_REQUEST_MIC_PERMISSION,
    async () => {
      if (process.platform !== "darwin") {
        return { granted: true };
      }
      const granted = await electron.systemPreferences.askForMediaAccess("microphone");
      return { granted };
    }
  );
  electron.ipcMain.handle(
    IPC_CHANNELS.AUDIO_SAVE_FILE,
    async (_event, { buffer, filename }) => {
      try {
        const downloadsPath = electron.app.getPath("downloads");
        const filePath = path__namespace.join(downloadsPath, filename);
        const audioBuffer = Buffer.from(buffer, "base64");
        fs__namespace.writeFileSync(filePath, audioBuffer);
        console.log(`Audio saved to: ${filePath}`);
        return { success: true, path: filePath };
      } catch (error) {
        console.error("Error saving audio file:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    }
  );
  electron.ipcMain.handle(
    IPC_CHANNELS.AUDIO_SHOW_SAVE_DIALOG,
    async (_event, { defaultName }) => {
      const mainWindow2 = getMainWindow();
      if (!mainWindow2) {
        return { canceled: true };
      }
      const result = await electron.dialog.showSaveDialog(mainWindow2, {
        defaultPath: path__namespace.join(electron.app.getPath("downloads"), defaultName),
        filters: [{ name: "Audio", extensions: ["webm", "wav"] }]
      });
      return result;
    }
  );
  electron.ipcMain.handle(
    IPC_CHANNELS.AUDIO_SAVE_TO_PATH,
    async (_event, { buffer, filePath }) => {
      try {
        const audioBuffer = Buffer.from(buffer, "base64");
        fs__namespace.writeFileSync(filePath, audioBuffer);
        console.log(`Audio saved to: ${filePath}`);
        return { success: true, path: filePath };
      } catch (error) {
        console.error("Error saving audio file:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    }
  );
}
function registerAppHandlers() {
  electron.ipcMain.handle(IPC_CHANNELS.APP_GET_VERSIONS, () => {
    return {
      node: process.versions.node,
      chrome: process.versions.chrome,
      electron: process.versions.electron
    };
  });
  electron.ipcMain.handle(
    IPC_CHANNELS.APP_GET_PATH,
    (_event, name) => {
      return electron.app.getPath(name);
    }
  );
}
const MOVE_INCREMENT = 50;
function registerGlobalShortcuts(getWindow) {
  const moveWindow = (dx, dy) => {
    const win = getWindow();
    if (!win) return;
    const [x, y] = win.getPosition();
    win.setPosition(Math.max(0, x + dx), Math.max(0, y + dy));
  };
  electron.globalShortcut.register("Alt+Up", () => moveWindow(0, -MOVE_INCREMENT));
  electron.globalShortcut.register("Alt+Down", () => moveWindow(0, MOVE_INCREMENT));
  electron.globalShortcut.register("Alt+Left", () => moveWindow(-MOVE_INCREMENT, 0));
  electron.globalShortcut.register("Alt+Right", () => moveWindow(MOVE_INCREMENT, 0));
  electron.globalShortcut.register("CommandOrControl+Shift+H", () => {
    const win = getWindow();
    if (win?.isVisible()) {
      win.hide();
    } else {
      win?.show();
    }
  });
}
function createWindow() {
  const primaryDisplay = electron.screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workAreaSize;
  const windowWidth = 900;
  const windowHeight = 600;
  const mainWindow2 = new electron.BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    frame: false,
    // Frameless window - no native title bar
    transparent: true,
    // Allows transparency
    hasShadow: false,
    // No native shadow
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
      sandbox: false
    },
    backgroundColor: "#00000000"
    // Fully transparent background
  });
  mainWindow2.setResizable(false);
  mainWindow2.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  if (process.platform === "win32") {
    mainWindow2.setSkipTaskbar(true);
  }
  const x = Math.floor((screenWidth - windowWidth) / 2);
  mainWindow2.setPosition(x, 50);
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow2.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow2.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  return mainWindow2;
}
let mainWindow = null;
function getMainWindow() {
  return mainWindow;
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.nexus.copilot");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  registerIpcHandlers();
  mainWindow = createWindow();
  registerGlobalShortcuts(getMainWindow);
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("will-quit", () => {
  electron.globalShortcut.unregisterAll();
});
exports.getMainWindow = getMainWindow;
