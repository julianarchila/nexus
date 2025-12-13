import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

import type {
  AppVersions,
  AudioSource,
  SaveAudioResult,
  SaveDialogResult,
  ScreenPermissionResult,
} from "../shared/types";
import { IPC_CHANNELS } from "../shared/types";

// Custom API exposed to renderer
const api = {
  /**
   * Window controls
   */
  window: {
    minimize: (): void => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
    maximize: (): void => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
    close: (): void => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),
  },

  /**
   * Audio capture functionality
   */
  audio: {
    getSources: (): Promise<AudioSource[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.AUDIO_GET_SOURCES),

    checkScreenPermission: (): Promise<ScreenPermissionResult> =>
      ipcRenderer.invoke(IPC_CHANNELS.AUDIO_CHECK_SCREEN_PERMISSION),

    requestMicrophonePermission: (): Promise<{ granted: boolean }> =>
      ipcRenderer.invoke(IPC_CHANNELS.AUDIO_REQUEST_MIC_PERMISSION),

    saveFile: (buffer: string, filename: string): Promise<SaveAudioResult> =>
      ipcRenderer.invoke(IPC_CHANNELS.AUDIO_SAVE_FILE, { buffer, filename }),

    showSaveDialog: (defaultName: string): Promise<SaveDialogResult> =>
      ipcRenderer.invoke(IPC_CHANNELS.AUDIO_SHOW_SAVE_DIALOG, { defaultName }),

    saveToPath: (buffer: string, filePath: string): Promise<SaveAudioResult> =>
      ipcRenderer.invoke(IPC_CHANNELS.AUDIO_SAVE_TO_PATH, { buffer, filePath }),
  },

  /**
   * App information
   */
  app: {
    getVersions: (): Promise<AppVersions> =>
      ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSIONS),

    getPath: (
      name:
        | "home"
        | "appData"
        | "userData"
        | "cache"
        | "temp"
        | "desktop"
        | "documents"
        | "downloads"
        | "music"
        | "pictures"
        | "videos"
        | "logs",
    ): Promise<string> => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_PATH, name),
  },
};

// Type for the API exposed to renderer
export type ElectronAPI = typeof api;

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error("Failed to expose API:", error);
  }
} else {
  window.electron = electronAPI;
  window.api = api;
}
