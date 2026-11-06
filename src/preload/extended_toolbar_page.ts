console.log('[DRAW]: Extended toolbar page preloading...');

import { contextBridge, ipcRenderer } from 'electron';

const api = {
  locale: ipcRenderer.sendSync('get_locale'),

  // Renderer -> Main
  invokeCloseApp: () => ipcRenderer.invoke('close_app'),
  invokeDrawMode: () => ipcRenderer.invoke('toggle_draw_or_pointer_window'),
  onToolbarDirection: (callback: (...args: any[]) => any) => ipcRenderer.on('toolbar_direction', (_event, isReversed) => callback(isReversed)),
  getConfiguration: () => ipcRenderer.invoke('get_extended_window_configuration'),
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ExtendedToolbarApi = typeof api;
