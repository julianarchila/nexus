/**
 * IPC Channel names - shared between main and preload
 * This ensures type safety and prevents typos in channel names
 */
export const IPC_CHANNELS = {
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
  APP_GET_PATH: "app:get-path",

  // Session management (for future WebSocket integration)
  SESSION_START: "session:start",
  SESSION_END: "session:end",
  SESSION_STATUS: "session:status",

  // WebSocket (for future real-time features)
  WS_CONNECT: "ws:connect",
  WS_DISCONNECT: "ws:disconnect",
  WS_SEND: "ws:send",
  WS_STATUS: "ws:status",
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

/**
 * Audio source returned by desktopCapturer
 */
export interface AudioSource {
  id: string;
  name: string;
}

/**
 * Permission status for macOS screen recording
 */
export interface ScreenPermissionResult {
  status: "granted" | "denied" | "not-determined" | "restricted" | "unknown";
}

/**
 * Result of saving an audio file
 */
export interface SaveAudioResult {
  success: boolean;
  path?: string;
  error?: string;
}

/**
 * Dialog result from showing save dialog
 */
export interface SaveDialogResult {
  canceled: boolean;
  filePath?: string;
}

/**
 * App version info
 */
export interface AppVersions {
  node: string;
  chrome: string;
  electron: string;
}
