import type { ElectronAPI } from "@electron-toolkit/preload";

import type {
  AppVersions,
  AudioSource,
  SaveAudioResult,
  SaveDialogResult,
  ScreenPermissionResult,
} from "./types";

/**
 * Custom API exposed to renderer via preload
 */
export interface NexusAPI {
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };
  audio: {
    getSources: () => Promise<AudioSource[]>;
    checkScreenPermission: () => Promise<ScreenPermissionResult>;
    requestMicrophonePermission: () => Promise<{ granted: boolean }>;
    saveFile: (buffer: string, filename: string) => Promise<SaveAudioResult>;
    showSaveDialog: (defaultName: string) => Promise<SaveDialogResult>;
    saveToPath: (buffer: string, filePath: string) => Promise<SaveAudioResult>;
  };
  app: {
    getVersions: () => Promise<AppVersions>;
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
    ) => Promise<string>;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: NexusAPI;
  }
}
