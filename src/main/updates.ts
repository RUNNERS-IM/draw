// GitHub 릴리스(RUNNERS-IM/draw)에서 새 판을 찾는다. 하루 한 번, 켠 지 1분 뒤부터 확인한다.
// 내려받은 뒤에 묻기 때문에 「지금 설치」는 바로 재시작한다. 묻지 않고 깔지 않는다. 다른 RUNNERS 앱과 같은 규칙이다.
import { app, BrowserWindow, dialog, ipcMain, powerMonitor } from 'electron';
import { autoUpdater } from 'electron-updater';
import { currentLocale, t } from '../shared/i18n';
import { pageUrl, preloadPath } from './pages';
import { releaseNoteLines } from './releaseNotes';

const FIRST_CHECK_MS = 60_000;
const CHECK_EVERY_MS = 24 * 60 * 60 * 1000;
const TICK_MS = 60 * 60 * 1000;
const UPDATE_WIDTH = 400;
const UPDATE_GUARD_MS = 1000;

let busy = false;
let store = null;
let beforeInstall = () => {};
let current = null;

export function startUpdates(options) {
  store = options.store;
  beforeInstall = options.beforeInstall;

  ipcMain.handle('update_offer', () => current?.offer ?? null);
  ipcMain.handle('update_answer', (_event, value) => {
    current?.answer(value);
    return null;
  });

  if (!app.isPackaged) return;

  autoUpdater.autoDownload = false;
  autoUpdater.fullChangelog = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.on('error', (error) => console.error('update:', error));

  setTimeout(() => {
    checkIfDue();
    setInterval(checkIfDue, TICK_MS);
  }, FIRST_CHECK_MS);
  powerMonitor.on('resume', () => setTimeout(checkIfDue, FIRST_CHECK_MS));
}

function checkIfDue() {
  if (Date.now() - store.get('update_checked_at') < CHECK_EVERY_MS) return;
  check(false);
}

export function checkNow() {
  check(true);
}

async function check(asked) {
  if (busy || (!asked && !store.get('auto_check_updates'))) return;
  busy = true;

  try {
    if (!app.isPackaged) {
      throw new Error('development build');
    }

      const result = await autoUpdater.checkForUpdates();
    store.set('update_checked_at', Date.now());

    if (!result?.isUpdateAvailable) {
      if (asked) await tell(t('update.latest'));
      return;
    }

    if (!asked && store.get('update_later_on') === today()) return;

    const version = result.updateInfo.version;
    const notes = releaseNoteLines(result.updateInfo.releaseNotes, currentLocale());
    const answer = asked ? await askWhileDownloading(version, notes) : await askAfterDownload(version, notes);

    if (answer !== 'install') {
      store.set('update_later_on', today());
      return;
    }

    beforeInstall();
    autoUpdater.quitAndInstall(true, true);
  } catch (error) {
    if (asked) await tell(t('update.failed', { error: error instanceof Error ? error.message : String(error) }));
  } finally {
    busy = false;
  }
}

async function askAfterDownload(version, notes) {
  await autoUpdater.downloadUpdate();
  return askUpdate({ version, notes, downloading: false, percent: 100 }, false).answer;
}

async function askWhileDownloading(version, notes) {
  const prompt = askUpdate({ version, notes, downloading: true, percent: 0 }, true);
  const progress = (info) => prompt.set({ percent: info.percent });
  autoUpdater.on('download-progress', progress);

  let done = false;
  let failed = null;
  const download = autoUpdater
    .downloadUpdate()
    .then(() => {
      done = true;
      prompt.set({ downloading: false, percent: 100 });
    })
    .catch((error) => {
      failed = error;
      prompt.close();
    })
    .finally(() => autoUpdater.off('download-progress', progress));

  const first = await prompt.answer;
  if (failed) throw failed;
  if (first === 'install' || done) return first;

  await download;
  if (failed) throw failed;

  return askUpdate({ version, notes, downloading: false, percent: 100 }, false).answer;
}

// 업데이트 질문 창. 닫으면 「나중에」다. focus 가 false 면 포커스를 뺏지 않아, 다른 앱에서 치던 Enter 가 설치로 눌리지 않는다.
export function askUpdate(offer, focus) {
  if (current && !current.window.isDestroyed()) current.window.close();

  let resolve;
  const answerPromise = new Promise((done) => {
    resolve = done;
  });

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
    webPreferences: { preload: preloadPath('update_page'), nodeIntegration: false },
  });

  const entry = { window, offer: { ...offer }, answer: () => {} };
  let answered = false;
  let shownAt = Number.POSITIVE_INFINITY;

  entry.answer = (value) => {
    if (Date.now() - shownAt < UPDATE_GUARD_MS) return;
    if (answered || (value === 'install' && entry.offer.downloading)) return;
    answered = true;
    resolve(value);
    if (value === 'later' && !window.isDestroyed()) window.close();
  };
  current = entry;

  window.once('ready-to-show', () => {
    window.center();
    shownAt = Date.now();
    if (!focus) {
      window.showInactive();
      return;
    }
    app.focus({ steal: true });
    window.show();
    window.focus();
  });
  window.on('closed', () => {
    if (current === entry) current = null;
    if (!answered) {
      answered = true;
      resolve('later');
    }
  });
  window.loadURL(pageUrl('update_page'));

  return {
    window,
    answer: answerPromise,
    set: (change) => {
      if (entry.offer.downloading && change.downloading === false) shownAt = Date.now();
      entry.offer = { ...entry.offer, ...change };
      if (!window.isDestroyed()) window.webContents.send('update_offer_changed', entry.offer);
    },
    close: () => {
      if (!window.isDestroyed()) window.close();
    },
  };
}

async function tell(message) {
  app.focus({ steal: true });
  await dialog.showMessageBox({ type: 'info', message, buttons: ['OK'] });
}

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
