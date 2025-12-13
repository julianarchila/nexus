import {
  app,
  desktopCapturer,
  dialog,
  ipcMain,
  systemPreferences,
} from "electron";
import * as fs from "node:fs";
import * as path from "node:path";

import { getMainWindow } from "./index";
import type {
  AudioSource,
  SaveAudioResult,
  SaveDialogResult,
  ScreenPermissionResult,
} from "../shared/types";
import { IPC_CHANNELS } from "../shared/types";

/**
 * Register all IPC handlers for main process
 */
export function registerIpcHandlers(): void {
  registerWindowHandlers();
  registerAudioHandlers();
  registerAppHandlers();
}

/**
 * Window control handlers
 */
function registerWindowHandlers(): void {
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    getMainWindow()?.minimize();
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    const window = getMainWindow();
    if (window?.isMaximized()) {
      window.unmaximize();
    } else {
      window?.maximize();
    }
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => {
    getMainWindow()?.close();
  });
}

/**
 * Audio capture handlers
 */
function registerAudioHandlers(): void {
  // Get available audio sources (screens for system audio capture)
  ipcMain.handle(
    IPC_CHANNELS.AUDIO_GET_SOURCES,
    async (): Promise<AudioSource[]> => {
      try {
        const sources = await desktopCapturer.getSources({
          types: ["screen"],
          fetchWindowIcons: false,
        });
        return sources.map((source) => ({
          id: source.id,
          name: source.name,
        }));
      } catch (error) {
        console.error("Error getting audio sources:", error);
        throw error;
      }
    },
  );

  // Check screen recording permission on macOS
  ipcMain.handle(
    IPC_CHANNELS.AUDIO_CHECK_SCREEN_PERMISSION,
    async (): Promise<ScreenPermissionResult> => {
      if (process.platform !== "darwin") {
        return { status: "granted" };
      }

      const status = systemPreferences.getMediaAccessStatus("screen");
      return { status };
    },
  );

  // Request microphone permission on macOS
  ipcMain.handle(
    IPC_CHANNELS.AUDIO_REQUEST_MIC_PERMISSION,
    async (): Promise<{ granted: boolean }> => {
      if (process.platform !== "darwin") {
        return { granted: true };
      }

      const granted = await systemPreferences.askForMediaAccess("microphone");
      return { granted };
    },
  );

  // Save audio file to downloads folder
  ipcMain.handle(
    IPC_CHANNELS.AUDIO_SAVE_FILE,
    async (
      _event,
      { buffer, filename }: { buffer: string; filename: string },
    ): Promise<SaveAudioResult> => {
      try {
        const downloadsPath = app.getPath("downloads");
        const filePath = path.join(downloadsPath, filename);

        // Convert base64 to buffer and write
        const audioBuffer = Buffer.from(buffer, "base64");
        fs.writeFileSync(filePath, audioBuffer);

        console.log(`Audio saved to: ${filePath}`);
        return { success: true, path: filePath };
      } catch (error) {
        console.error("Error saving audio file:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  );

  // Show save dialog for audio file
  ipcMain.handle(
    IPC_CHANNELS.AUDIO_SHOW_SAVE_DIALOG,
    async (
      _event,
      { defaultName }: { defaultName: string },
    ): Promise<SaveDialogResult> => {
      const mainWindow = getMainWindow();
      if (!mainWindow) {
        return { canceled: true };
      }

      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: path.join(app.getPath("downloads"), defaultName),
        filters: [{ name: "Audio", extensions: ["webm", "wav"] }],
      });
      return result;
    },
  );

  // Save audio to custom path
  ipcMain.handle(
    IPC_CHANNELS.AUDIO_SAVE_TO_PATH,
    async (
      _event,
      { buffer, filePath }: { buffer: string; filePath: string },
    ): Promise<SaveAudioResult> => {
      try {
        const audioBuffer = Buffer.from(buffer, "base64");
        fs.writeFileSync(filePath, audioBuffer);
        console.log(`Audio saved to: ${filePath}`);
        return { success: true, path: filePath };
      } catch (error) {
        console.error("Error saving audio file:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  );
}

/**
 * App info handlers
 */
function registerAppHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSIONS, () => {
    return {
      node: process.versions.node,
      chrome: process.versions.chrome,
      electron: process.versions.electron,
    };
  });

  ipcMain.handle(
    IPC_CHANNELS.APP_GET_PATH,
    (_event, name: Parameters<typeof app.getPath>[0]) => {
      return app.getPath(name);
    },
  );
}
