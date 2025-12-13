"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
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
const api = {
  /**
   * Window controls
   */
  window: {
    minimize: () => electron.ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
    maximize: () => electron.ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
    close: () => electron.ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE)
  },
  /**
   * Audio capture functionality
   */
  audio: {
    getSources: () => electron.ipcRenderer.invoke(IPC_CHANNELS.AUDIO_GET_SOURCES),
    checkScreenPermission: () => electron.ipcRenderer.invoke(IPC_CHANNELS.AUDIO_CHECK_SCREEN_PERMISSION),
    requestMicrophonePermission: () => electron.ipcRenderer.invoke(IPC_CHANNELS.AUDIO_REQUEST_MIC_PERMISSION),
    saveFile: (buffer, filename) => electron.ipcRenderer.invoke(IPC_CHANNELS.AUDIO_SAVE_FILE, { buffer, filename }),
    showSaveDialog: (defaultName) => electron.ipcRenderer.invoke(IPC_CHANNELS.AUDIO_SHOW_SAVE_DIALOG, { defaultName }),
    saveToPath: (buffer, filePath) => electron.ipcRenderer.invoke(IPC_CHANNELS.AUDIO_SAVE_TO_PATH, { buffer, filePath })
  },
  /**
   * App information
   */
  app: {
    getVersions: () => electron.ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSIONS),
    getPath: (name) => electron.ipcRenderer.invoke(IPC_CHANNELS.APP_GET_PATH, name)
  }
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error("Failed to expose API:", error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}
