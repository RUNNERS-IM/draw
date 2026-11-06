console.log('[DRAW]: Settings page preloading...')

import { contextBridge, ipcRenderer } from 'electron'
const { platform } = process

const api = {
  locale: ipcRenderer.sendSync('get_locale'),

  // Renderer -> Main
  getConfiguration: () => ipcRenderer.invoke('get_configuration'),
  setShortcut: (key: string, value: unknown) => ipcRenderer.invoke('set_shortcut', key, value),
  canRegisterShortcut: (accelerator: string) =>
    ipcRenderer.invoke('can_register_shortcut', accelerator),
  setLaunchOnLogin: (value: unknown) => ipcRenderer.invoke('set_launch_on_login', value),
  setAutoCheckUpdates: (value: unknown) => ipcRenderer.invoke('set_auto_check_updates', value),
  setStartsHidden: (value: unknown) => ipcRenderer.invoke('set_starts_hidden', value),
  setClearDrawingsOnHide: (value: unknown) =>
    ipcRenderer.invoke('set_clear_drawings_on_hide', value),
  resetToOriginals: () => ipcRenderer.invoke('reset_to_originals'),
  setShowDrawingBorder: (value: unknown) => ipcRenderer.invoke('set_show_drawing_border', value),
  setCuteCursorMode: (value: unknown) => ipcRenderer.invoke('set_cute_cursor_mode', value),
  setPenSmoothing: (value: unknown) => ipcRenderer.invoke('set_pen_smoothing', value),
  setLaserTimeMs: (value: unknown) => ipcRenderer.invoke('set_laser_time', value),
  setAppIconColor: (value: unknown) => ipcRenderer.invoke('set_app_icon_color', value),
  setSwapColors: (value: unknown) => ipcRenderer.invoke('set_swap_colors', value),
  setToolbarColor: (colorId: string, value: unknown) =>
    ipcRenderer.invoke('set_toolbar_color', colorId, value),
  setDrawingMonitor: (value: unknown) => ipcRenderer.invoke('set_drawing_monitor', value),
  setDisableToolbarInPointerMode: (value: unknown) =>
    ipcRenderer.invoke('set_disable_toolbar_in_pointer_mode', value),
  setToolbarOrientation: (value: unknown) => ipcRenderer.invoke('set_toolbar_orientation', value),
  setFadeDisappearAfterMs: (value: unknown) =>
    ipcRenderer.invoke('set_fade_disappear_after_ms', value),
  setFadeOutDurationTimeMs: (value: unknown) =>
    ipcRenderer.invoke('set_fade_out_duration_time_ms', value),
  chooseScreenshotDirectory: () => ipcRenderer.invoke('choose_screenshot_directory'),
  resetScreenshotDirectory: () => ipcRenderer.invoke('reset_screenshot_directory'),
  openScreenshotDirectory: () => ipcRenderer.invoke('open_screenshot_directory'),

  isMac: platform === 'darwin'
}

contextBridge.exposeInMainWorld('electronAPI', api)

export type SettingsApi = typeof api
