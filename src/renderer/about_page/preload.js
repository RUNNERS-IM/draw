const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  locale: ipcRenderer.sendSync('get_locale'),
  getVersion: () => ipcRenderer.invoke('get_app_version'),
  openExternal: (url) => ipcRenderer.invoke('open_external', url),
  fitHeight: (height) => ipcRenderer.invoke('fit_window_height', height),
  closeWindow: () => ipcRenderer.invoke('close_window'),
});
