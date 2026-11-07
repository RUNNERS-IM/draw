// GitHub 릴리스(RUNNERS-IM/draw)에서 새 판을 찾는다. 하루 한 번, 켠 지 1분 뒤부터 확인한다.
// 내려받은 뒤에 묻기 때문에 「지금 설치」는 바로 재시작한다. 묻지 않고 깔지 않는다. 다른 RUNNERS 앱과 같은 규칙이다.
// 창의 답 받기와 새 소식 줄은 kit 부품을 쓴다. 확인 흐름은 kit 의 createUpdates 가 electron-updater 의 autoUpdater 를
// 타입에서 받지 못해 아직 여기에 있다(kit 쪽을 고친 뒤 옮긴다).
import { app, BrowserWindow, dialog, ipcMain, powerMonitor } from 'electron'
import { autoUpdater } from 'electron-updater'
import { currentLocale, t } from '../shared/i18n'
import { pageUrl, preloadPath } from './pages'
import { releaseNoteLines } from './runners/release-notes'
import { createUpdateWindow } from './runners/update-window'

const FIRST_CHECK_MS = 60_000
const CHECK_EVERY_MS = 24 * 60 * 60 * 1000
const TICK_MS = 60 * 60 * 1000
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
      vibrancy: 'menu',
      visualEffectState: 'active',
      backgroundColor: '#00000000',
      webPreferences: { preload: preloadPath('update_page'), nodeIntegration: false }
    })
    window.loadURL(pageUrl('update_page'))
    return window
  }
})

export const askUpdate = updateWindow.askUpdate

let busy = false
let store: StoreLike
let beforeInstall = () => {}

export function startUpdates(options: { store: StoreLike; beforeInstall: () => void }) {
  store = options.store
  beforeInstall = options.beforeInstall

  ipcMain.handle('update_offer', () => updateWindow.offer())
  ipcMain.handle('update_answer', (_event, value) => {
    updateWindow.answer(value)
    return null
  })

  if (!app.isPackaged) {
    return
  }

  autoUpdater.autoDownload = false
  autoUpdater.fullChangelog = false
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.on('error', (error) => console.error('update:', error))

  setTimeout(() => {
    checkIfDue()
    setInterval(checkIfDue, TICK_MS)
  }, FIRST_CHECK_MS)
  powerMonitor.on('resume', () => setTimeout(checkIfDue, FIRST_CHECK_MS))
}

function checkIfDue() {
  if (Date.now() - store.get('update_checked_at') < CHECK_EVERY_MS) {
    return
  }
  check(false)
}

export function checkNow() {
  check(true)
}

async function check(asked: boolean) {
  if (busy || (!asked && !store.get('auto_check_updates'))) {
    return
  }
  busy = true

  try {
    if (!app.isPackaged) {
      throw new Error('development build')
    }

    const result = await autoUpdater.checkForUpdates()
    store.set('update_checked_at', Date.now())

    if (!result?.isUpdateAvailable) {
      if (asked) {
        await tell(t('update.latest'))
      }
      return
    }

    if (!asked && store.get('update_later_on') === today()) {
      return
    }

    const version = result.updateInfo.version
    const language = currentLocale() === 'ko' ? 'ko' : 'en'
    const notes = releaseNoteLines(result.updateInfo.releaseNotes, language)
    const answer = asked
      ? await askWhileDownloading(version, notes)
      : await askAfterDownload(version, notes)

    if (answer !== 'install') {
      store.set('update_later_on', today())
      return
    }

    beforeInstall()
    autoUpdater.quitAndInstall(true, true)
  } catch (error) {
    if (asked) {
      await tell(
        t('update.failed', { error: error instanceof Error ? error.message : String(error) })
      )
    }
  } finally {
    busy = false
  }
}

async function askAfterDownload(version: string, notes: string[] | null) {
  await autoUpdater.downloadUpdate()
  return askUpdate({ version, notes, downloading: false, percent: 100 }, false).answer
}

async function askWhileDownloading(version: string, notes: string[] | null) {
  const prompt = askUpdate({ version, notes, downloading: true, percent: 0 }, true)
  const progress = (info: { percent: number }) => prompt.set({ percent: info.percent })
  autoUpdater.on('download-progress', progress)

  let done = false
  let failed = null
  const download = autoUpdater
    .downloadUpdate()
    .then(() => {
      done = true
      prompt.set({ downloading: false, percent: 100 })
    })
    .catch((error) => {
      failed = error
      prompt.close()
    })
    .finally(() => autoUpdater.off('download-progress', progress))

  const first = await prompt.answer
  if (failed) {
    throw failed
  }
  if (first === 'install' || done) {
    return first
  }

  await download
  if (failed) {
    throw failed
  }

  return askUpdate({ version, notes, downloading: false, percent: 100 }, false).answer
}

async function tell(message: string) {
  app.focus({ steal: true })
  await dialog.showMessageBox({ type: 'info', message, buttons: ['OK'] })
}

function today() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
