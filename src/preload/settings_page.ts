console.log('[DRAW]: Settings page preloading...')

import { contextBridge, ipcRenderer } from 'electron'
const { platform } = process

// 로그인 창의 세 함수는 실패하면 SignInProblem 코드를 메시지로 던져야 한다. 메인은 그 코드를 값으로 돌려준다.
const attempt = async (channel: string, ...args: unknown[]) => {
  const problem = await ipcRenderer.invoke(channel, ...args)
  if (problem) {
    throw new Error(problem)
  }
}

const api = {
  locale: ipcRenderer.sendSync('get_locale'),

  // Renderer -> Main
  getConfiguration: () => ipcRenderer.invoke('get_configuration'),
  setShortcut: (key: string, value: unknown) => ipcRenderer.invoke('set_shortcut', key, value),
  canRegisterShortcut: (accelerator: string) =>
    ipcRenderer.invoke('can_register_shortcut', accelerator),
  setLaunchOnLogin: (value: unknown) => ipcRenderer.invoke('set_launch_on_login', value),
  setAutoCheckUpdates: (value: unknown) => ipcRenderer.invoke('set_auto_check_updates', value),
  checkUpdate: () => ipcRenderer.invoke('check_update'),
  // 메인이 실제로 바꾼 값(아이콘이 지금 보이는가)을 돌려준다.
  setShowTrayIcon: (value: boolean): Promise<boolean> =>
    ipcRenderer.invoke('set_show_tray_icon', value),
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

  accountEmail: (): Promise<string | null> => ipcRenderer.invoke('account_email'),
  signIn: (mode: string, email: string, password: string, code?: string) =>
    attempt('account_sign_in', mode, email, password, code),
  sendCode: (purpose: string, email: string) => attempt('account_send_code', purpose, email),
  resetPassword: (email: string, code: string, password: string) =>
    attempt('account_reset_password', email, code, password),
  signOut: () => ipcRenderer.invoke('account_sign_out'),
  onAccountChanged: (callback: (email: string | null) => void) => {
    const listener = (_event: unknown, email: string | null) => callback(email)
    ipcRenderer.on('account_changed', listener)
    return () => {
      ipcRenderer.removeListener('account_changed', listener)
    }
  },

  usageConsent: (): Promise<'unasked' | 'granted' | 'denied'> =>
    ipcRenderer.invoke('usage_consent'),
  setUsageConsent: (granted: boolean) => ipcRenderer.invoke('set_usage_consent', granted),

  // 정보 탭(kit RunnersAbout)이 쓰는 값.
  getVersion: (): Promise<string> => ipcRenderer.invoke('get_app_version'),
  openExternal: (url: string) => ipcRenderer.invoke('open_external', url),
  // 이미 열린 설정 창에 다른 탭을 열라고 할 때(예: 앱 메뉴의 「Draw 정보」).
  onOpenTab: (callback: (tab: string) => void) => {
    const listener = (_event: unknown, tab: string) => callback(tab)
    ipcRenderer.on('open_settings_tab', listener)
    return () => {
      ipcRenderer.removeListener('open_settings_tab', listener)
    }
  },

  isMac: platform === 'darwin'
}

contextBridge.exposeInMainWorld('electronAPI', api)

export type SettingsApi = typeof api
