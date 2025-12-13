const {
  app,
  BrowserWindow,
  screen,
  globalShortcut,
  ipcMain,
} = require("electron");
const path = require("path");

let mainWindow = null;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } =
    primaryDisplay.workAreaSize;

  const windowWidth = 900;
  const windowHeight = 600;

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    frame: false, // Frameless window - no native title bar
    transparent: true, // Allows transparency
    hasShadow: false, // No native shadow
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
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

  mainWindow.loadFile("index.html");

  // Register global shortcuts for window movement
  const moveIncrement = 50;

  globalShortcut.register("Alt+Up", () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x, Math.max(0, y - moveIncrement));
  });

  globalShortcut.register("Alt+Down", () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x, y + moveIncrement);
  });

  globalShortcut.register("Alt+Left", () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(Math.max(0, x - moveIncrement), y);
  });

  globalShortcut.register("Alt+Right", () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x + moveIncrement, y);
  });

  // Toggle visibility with Cmd/Ctrl+Shift+H
  globalShortcut.register("CommandOrControl+Shift+H", () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}

// IPC handlers for window controls
ipcMain.on("window-minimize", () => {
  mainWindow?.minimize();
});

ipcMain.on("window-close", () => {
  mainWindow?.close();
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
