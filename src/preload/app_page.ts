console.log('[DRAW]: Main page preloading...');

import { contextBridge, ipcRenderer } from 'electron';

const api = {
  locale: ipcRenderer.sendSync('get_locale'),

  // Renderer -> Main
  invokeCloseApp:              () => ipcRenderer.invoke('close_app'),
  invokePointerMode:           () => ipcRenderer.invoke('toggle_draw_or_pointer_window'),
  invokeOpenSettings:          () => ipcRenderer.invoke('open_settings'),
  invokeMakeScreenshot:        () => ipcRenderer.invoke('make_screenshot'),
  invokeRequestZoomStart:      () => ipcRenderer.invoke('request_zoom_start'),
  invokeCaptureZoomImage:      () => ipcRenderer.invoke('capture_zoom_image'),
  invokeRejectZoomStart:       () => ipcRenderer.invoke('reject_zoom_start'),
  invokeExitZoom:              () => ipcRenderer.invoke('exit_zoom'),
  invokeOpenNotification:      (info: unknown) => ipcRenderer.invoke('open_notification', info),
  invokeGetSettings:           () => ipcRenderer.invoke('get_settings'),
  invokeSetSettings:           (settings: unknown) => ipcRenderer.invoke('set_settings', settings),
  invokeCommitToolbarPosition: (position: unknown) => ipcRenderer.invoke('commit_toolbar_position', position),

  // Main -> Renderer
  onTestAction:            (callback: (...args: any[]) => any) => { ipcRenderer.on('test_action', (_event, action) => callback(action)); },
  onResetScreen:           (callback: (...args: any[]) => any) => { ipcRenderer.on('reset_screen', () => callback()); },
  onToggleToolbar:         (callback: (...args: any[]) => any) => { ipcRenderer.on('toggle_toolbar', () => callback()); },
  onToggleWhiteboard:      (callback: (...args: any[]) => any) => { ipcRenderer.on('toggle_whiteboard', () => callback()); },
  onRefreshSettings:       (callback: (...args: any[]) => any) => { ipcRenderer.on('refresh_settings', (_event, newSettings) => callback(newSettings)); },
  onUpdateToolbarPosition: (callback: (...args: any[]) => any) => { ipcRenderer.on('update_toolbar_position', (_event, newSettings) => callback(newSettings)); },
  onScreenshotFlash:       (callback: (...args: any[]) => any) => { ipcRenderer.on('screenshot_flash', () => callback()); },
  onShowNotification:      (callback: (...args: any[]) => any) => { ipcRenderer.on('show_notification', (_event, data) => callback(data)); },
  onPrepareZoomCapture:    (callback: (...args: any[]) => any) => { ipcRenderer.on('prepare_zoom_capture', () => callback()); },
  onShowZoom:              (callback: (...args: any[]) => any) => { ipcRenderer.on('show_zoom', (_event, info) => callback(info)); },
  onRequestExitZoom:       (callback: (...args: any[]) => any) => { ipcRenderer.on('request_exit_zoom', () => callback()); },
  onStopZoom:              (callback: (...args: any[]) => any) => { ipcRenderer.on('stop_zoom', () => callback()); },
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type AppApi = typeof api;
