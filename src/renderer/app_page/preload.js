console.log('[DRAW]: Main page preloading...');

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
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
  invokeOpenNotification:      (info) => ipcRenderer.invoke('open_notification', info),
  invokeGetSettings:           () => ipcRenderer.invoke('get_settings'),
  invokeSetSettings:           (settings) => ipcRenderer.invoke('set_settings', settings),
  invokeCommitToolbarPosition: (position) => ipcRenderer.invoke('commit_toolbar_position', position),

  // Main -> Renderer
  onTestAction:            (callback) => { ipcRenderer.on('test_action', (_event, action) => callback(action)); },
  onResetScreen:           (callback) => { ipcRenderer.on('reset_screen', () => callback()); },
  onToggleToolbar:         (callback) => { ipcRenderer.on('toggle_toolbar', () => callback()); },
  onToggleWhiteboard:      (callback) => { ipcRenderer.on('toggle_whiteboard', () => callback()); },
  onRefreshSettings:       (callback) => { ipcRenderer.on('refresh_settings', (_event, newSettings) => callback(newSettings)); },
  onUpdateToolbarPosition: (callback) => { ipcRenderer.on('update_toolbar_position', (_event, newSettings) => callback(newSettings)); },
  onScreenshotFlash:       (callback) => { ipcRenderer.on('screenshot_flash', () => callback()); },
  onShowNotification:      (callback) => { ipcRenderer.on('show_notification', (_event, data) => callback(data)); },
  onPrepareZoomCapture:    (callback) => { ipcRenderer.on('prepare_zoom_capture', () => callback()); },
  onShowZoom:              (callback) => { ipcRenderer.on('show_zoom', (_event, info) => callback(info)); },
  onRequestExitZoom:       (callback) => { ipcRenderer.on('request_exit_zoom', () => callback()); },
  onStopZoom:              (callback) => { ipcRenderer.on('stop_zoom', () => callback()); },
});
