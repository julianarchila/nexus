window.addEventListener('DOMContentLoaded', () => {
  // Set version info
  const versions = window.electronAPI.versions
  document.getElementById('node-version').textContent = versions.node
  document.getElementById('chrome-version').textContent = versions.chrome
  document.getElementById('electron-version').textContent = versions.electron

  // Window control buttons
  document.getElementById('btn-minimize').addEventListener('click', () => {
    window.electronAPI.minimizeWindow()
  })

  document.getElementById('btn-close').addEventListener('click', () => {
    window.electronAPI.closeWindow()
  })
})
