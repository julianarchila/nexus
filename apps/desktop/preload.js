const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
})
