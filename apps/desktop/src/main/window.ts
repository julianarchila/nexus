import { BrowserWindow, screen } from "electron";
import { join } from "node:path";
import { is } from "@electron-toolkit/utils";

export function createWindow(): BrowserWindow {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workAreaSize;

  const windowWidth = 900;
  const windowHeight = 600;

  const mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    frame: false, // Frameless window - no native title bar
    transparent: true, // Allows transparency
    hasShadow: false, // No native shadow
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
      sandbox: false,
    },
    backgroundColor: "#00000000", // Fully transparent background
  });

  // Essential settings
  mainWindow.setResizable(false);
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Windows specific
  if (process.platform === "win32") {
    mainWindow.setSkipTaskbar(true);
  }

  // Center window horizontally at top of screen
  const x = Math.floor((screenWidth - windowWidth) / 2);
  mainWindow.setPosition(x, 50);

  // HMR for renderer based on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  return mainWindow;
}
