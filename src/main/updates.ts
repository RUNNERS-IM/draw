// GitHub 릴리스(RUNNERS-IM/draw)에서 새 판을 찾는다. 확인 · 받기 · 깔기 흐름은 kit 의 createUpdates 를 쓴다.
// 자동 업데이트가 켜져 있으면(기본) 새 판을 받아 두었다가 맥 입력이 10분 없을 때나 앱을 끌 때 깔고,
// 다음에 열 때 한 번 「업데이트했습니다」 창을 띄운다(runners-wiki 2026-11-19 결정 1A 2A). 끄면 받은 뒤 창으로 묻는다.
import { app, BrowserWindow, dialog, ipcMain, powerMonitor } from 'electron'
import { autoUpdater } from 'electron-updater'
import { currentLocale, t } from '../shared/i18n'
import { pageUrl, preloadPath } from './pages'
import { createUpdateWindow } from './runners/update-window'
import { createUpdates, type UpdateSettings } from './runners/updates'

const UPDATE_WIDTH = 400

type StoreLike = { get: (key: string) => any; set: (key: string, value: unknown) => void }

const updateWindow = createUpdateWindow({
  channel: 'update_offer_changed',
  focusApp: () => app.focus({ steal: true }),
  create: () => {
    const window = new BrowserWindow({
      width: UPDATE_WIDTH,
      height: 200,
      useContentSize: true,
      show: false,
      frame: false,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      hasShadow: true,
      roundedCorners: true,
      alwaysOnTop: true,
      title: 'Draw',
      webPreferences: { preload: preloadPath('update_page'), nodeIntegration: false }
    })
    window.loadURL(pageUrl('update_page'))
    return window
  }
})

export const askUpdate = updateWindow.askUpdate

let updates: ReturnType<typeof createUpdates> | null = null

export function startUpdates(options: { store: StoreLike; beforeInstall: () => void }) {
  const { store } = options

  ipcMain.handle('update_offer', () => updateWindow.offer())
  ipcMain.handle('update_answer', (_event, value) => {
    updateWindow.answer(value)
    return null
  })

  updates = createUpdates({
    isPackaged: app.isPackaged,
    autoUpdater,
    onResume: (listener) => powerMonitor.on('resume', listener),
    readSettings: () => ({
      autoUpdate: store.get('auto_check_updates'),
      updateLaterOn: store.get('update_later_on'),
      updateCheckedAt: store.get('update_checked_at'),
      updateReady: store.get('update_ready')
    }),
    writeSettings: (change: UpdateSettings) => {
      if (change.updateLaterOn !== undefined) {
        store.set('update_later_on', change.updateLaterOn ?? '')
      }
      if (change.updateCheckedAt !== undefined) {
        store.set('update_checked_at', change.updateCheckedAt)
      }
      if (change.updateReady !== undefined) {
        store.set('update_ready', change.updateReady)
      }
    },
    locale: currentLocale,
    t,
    askUpdate,
    appVersion: () => app.getVersion(),
    idleSeconds: () => powerMonitor.getSystemIdleTime(),
    beforeInstall: options.beforeInstall,
    tell
  })
  updates.start()
}

export function checkNow() {
  void updates?.checkNow()
}

async function tell(message: string) {
  app.focus({ steal: true })
  await dialog.showMessageBox({ type: 'info', message, buttons: ['OK'] })
}
