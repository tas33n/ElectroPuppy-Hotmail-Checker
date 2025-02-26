const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.send('open-file-dialog'),
  onFileContent: (callback) => ipcRenderer.on('file-content', callback),
  onProcessStatus: (callback) => ipcRenderer.on("process-status", (_, status) => callback(status)),
  startProcess: (concurrentValue) => ipcRenderer.invoke("start-process", concurrentValue),
  stopProcess: () => ipcRenderer.send('stop-process'),
  checkEmail: async (credentials, sessionIndex) => await ipcRenderer.invoke('check-email', credentials, sessionIndex),
  saveResults: (results) => ipcRenderer.invoke('save-results', results),
  togglePreview: (isPreviewOn) => ipcRenderer.send('toggle-preview', isPreviewOn),
  onThemeChanged: (callback) => ipcRenderer.on('theme-changed', callback),
  setTheme: (theme) => ipcRenderer.send('theme-changed', theme),
  openDonationDialog: () => ipcRenderer.send('open-donation-window')
});