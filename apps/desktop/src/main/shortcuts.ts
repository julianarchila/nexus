import type { BrowserWindow } from "electron";
import { globalShortcut } from "electron";

const MOVE_INCREMENT = 50;

export function registerGlobalShortcuts(
  getWindow: () => BrowserWindow | null,
): void {
  const moveWindow = (dx: number, dy: number) => {
    const win = getWindow();
    if (!win) return;
    const [x, y] = win.getPosition();
    win.setPosition(Math.max(0, x + dx), Math.max(0, y + dy));
  };

  globalShortcut.register("Alt+Up", () => moveWindow(0, -MOVE_INCREMENT));
  globalShortcut.register("Alt+Down", () => moveWindow(0, MOVE_INCREMENT));
  globalShortcut.register("Alt+Left", () => moveWindow(-MOVE_INCREMENT, 0));
  globalShortcut.register("Alt+Right", () => moveWindow(MOVE_INCREMENT, 0));

  globalShortcut.register("CommandOrControl+Shift+H", () => {
    const win = getWindow();
    if (win?.isVisible()) {
      win.hide();
    } else {
      win?.show();
    }
  });
}
