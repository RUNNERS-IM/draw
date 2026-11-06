console.log('[DRAW]: Extended toolbar page preloading...');

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  locale: ipcRenderer.sendSync('get_locale'),

  // Renderer -> Main
  invokeCloseApp: () => ipcRenderer.invoke('close_app'),
  invokeDrawMode: () => ipcRenderer.invoke('toggle_draw_or_pointer_window'),
  onToolbarDirection: (callback) => ipcRenderer.on('toolbar_direction', (_event, isReversed) => callback(isReversed)),
  getConfiguration: () => ipcRenderer.invoke('get_extended_window_configuration'),
});
