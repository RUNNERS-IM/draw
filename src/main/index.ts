import { pageUrl, preloadPath } from './pages';
import { app, nativeImage, Tray, Menu, BrowserWindow, screen, globalShortcut, shell, ipcMain, nativeTheme, systemPreferences, desktopCapturer, autoUpdater, dialog, clipboard } from 'electron';
import Store from 'electron-store';
import { isDeepStrictEqual } from 'util';
import fs from 'fs';
import path from 'path';
import { getPointerToolbarOffset, isToolbarReversed } from '../shared/toolbarPosition';
import { t, setLocale, currentLocale } from '../shared/i18n';
import { startUpdates, checkNow } from './updates';
import { runTestShots } from './testShots';

const isDevelopment = process.env.NODE_ENV === 'development'
const isDebugLoggingEnabled = process.env.DRAW_DEBUG === '1'
const isLoggingEnabled = isDevelopment || isDebugLoggingEnabled

const isMac = process.platform === 'darwin'
const isLinux = process.platform === 'linux'
const isWin = process.platform === 'win32'

const KEY_SHOW_HIDE_APP        = 'CmdOrCtrl+Shift+A'
const KEY_SHOW_HIDE_TOOLBAR    = 'CmdOrCtrl+T'
const KEY_CLEAR_DESK           = 'CmdOrCtrl+K'
const KEY_SETTINGS             = 'CmdOrCtrl+,'
const KEY_Q                    = 'CmdOrCtrl+Q'
const KEY_NULL                 = '[NULL]'

// 첫 판은 그리기만 한다. 화이트보드 · 화면 저장 · 확대는 코드만 두고 단축키를 비워 꺼 둔다.
const KEY_SHOW_HIDE_WHITEBOARD = KEY_NULL
const KEY_MAKE_SCREENSHOT      = KEY_NULL
const KEY_START_ZOOM           = KEY_NULL

const EXTENDED_TOOLBAR_WINDOW_MARGIN = 10
const EXTENDED_TOOLBAR_WINDOW_PADDING = 5
const EXTENDED_TOOLBAR_MODE_SWITCHER_WIDTH = 44
const EXTENDED_TOOLBAR_MODE_SWITCHER_HEIGHT = 56
const EXTENDED_TOOLBAR_SLIDER_SIZE = 17

// Reserve an arrow slot on both sides so flipping it never moves the native window or icon.
const EXTENDED_TOOLBAR_HORIZONTAL_WINDOW_SIZE = {
  width: EXTENDED_TOOLBAR_WINDOW_MARGIN + EXTENDED_TOOLBAR_MODE_SWITCHER_WIDTH + 2 * EXTENDED_TOOLBAR_SLIDER_SIZE + EXTENDED_TOOLBAR_WINDOW_PADDING,
  height: EXTENDED_TOOLBAR_WINDOW_MARGIN + EXTENDED_TOOLBAR_MODE_SWITCHER_HEIGHT + EXTENDED_TOOLBAR_WINDOW_PADDING,
}
const EXTENDED_TOOLBAR_VERTICAL_WINDOW_SIZE = {
  width: EXTENDED_TOOLBAR_WINDOW_MARGIN + EXTENDED_TOOLBAR_MODE_SWITCHER_WIDTH + EXTENDED_TOOLBAR_WINDOW_PADDING,
  height: EXTENDED_TOOLBAR_WINDOW_MARGIN + EXTENDED_TOOLBAR_MODE_SWITCHER_HEIGHT + 2 * EXTENDED_TOOLBAR_SLIDER_SIZE + EXTENDED_TOOLBAR_WINDOW_PADDING,
}

const PANEL_WIDTH = 300
const PANEL_GAP = 4
const PANEL_BLUR_GUARD_MS = 300
const PANEL_REOPEN_GUARD_MS = 300
const HELP_URL = 'https://github.com/RUNNERS-IM/draw/issues'
// 「로그인할 때 열기」를 처음 한 번 켰다는 표시 파일(앱 데이터 폴더).
const LAUNCH_ON_LOGIN_APPLIED = 'open-at-login-default'

const ABOUT_WIDTH = 520
const ABOUT_HEIGHT = 560

let lastShortcutTime = 0;
const throttleDelay = 250;
const updateStoreDelay = 300;

const schema = {
  show_whiteboard: {
    type: 'boolean',
    default: false
  },
  whiteboard_color: {
    type: 'string',
    default: 'white'
  },
  whiteboard_layout: {
    type: 'object',
    default: {
      x: 10,
      y: 10,
      width: 80,
      height: 80,
    }
  },
  whiteboard_opacity: {
    type: 'number',
    default: 100
  },
  whiteboard_style: {
    type: 'string',
    default: 'dots'
  },
  whiteboard_spacing: {
    type: 'number',
    default: 40
  },
  show_tool_bar: {
    type: 'boolean',
    default: true
  },
  disable_toolbar_in_pointer_mode: {
    type: 'boolean',
    default: false
  },
  tool_bar_orientation: {
    type: 'string',
    enum: ['horizontal', 'vertical'],
    default: 'vertical'
  },
  tool_bar_x: {
    type: 'number',
    default: 16
  },
  tool_bar_y: {
    type: 'number',
    default: 120
  },
  tool_bar_active_tool: {
    type: 'string',
    default: 'pen'
  },
  tool_bar_active_color_index: {
    type: 'number',
    default: 1
  },
  tool_bar_color_palette: {
    type: 'object',
    default: {
      color_1: '#529BE0',
      color_2: '#E05252',
      color_3: '#52E06C',
      color_4: '#E0A552',
      color_5: '#FFFFFF',
      color_6: '#1E1E1E',
    }
  },
  tool_bar_active_weight_index: {
    type: 'number',
    default: 2
  },
  tool_bar_default_brush: {
    type: 'string',
    default: 'pen'
  },
  tool_bar_default_figure: {
    type: 'string',
    default: 'arrow'
  },
  tool_bar_collapsed: {
    type: 'boolean',
    default: false
  },
  active_monitor_id: { // show on what monitor we renderED draw window last time
    type: 'number',
  },
  show_drawing_border: {
    type: 'boolean',
    default: true
  },
  cute_cursor_mode: {
    type: 'string',
    enum: ['permanent', 'fade', 'dot', 'hidden'],
    default: 'permanent'
  },
  pen_smoothing: {
    type: 'boolean',
    default: true
  },
  app_icon_color: {
    type: 'string',
    default: 'default'
  },
  launch_on_login: {
    type: 'boolean',
    default: false
  },
  auto_check_updates: {
    type: 'boolean',
    default: true
  },
  update_checked_at: {
    type: 'number',
    default: 0
  },
  update_later_on: {
    type: 'string',
    default: ''
  },
  key_binding_show_hide_app: {
    type: 'string',
    default: KEY_SHOW_HIDE_APP
  },
  key_binding_show_hide_toolbar: {
    type: 'string',
    default: KEY_SHOW_HIDE_TOOLBAR
  },
  key_binding_show_hide_whiteboard: {
    type: 'string',
    default: KEY_SHOW_HIDE_WHITEBOARD
  },
  key_binding_clear_desk: {
    type: 'string',
    default: KEY_CLEAR_DESK
  },
  fade_disappear_after_ms: {
    type: 'number',
    default: 1500
  },
  fade_out_duration_time_ms: {
    type: 'number',
    default: 1000
  },
  laser_time: {
    type: 'number',
    default: 2000
  },
  swap_colors_indexes: {
    type: 'array',
    default: [1, 2]
  },
  starts_hidden: {
    type: 'boolean',
    default: false
  },
  clear_drawings_on_hide: {
    type: 'boolean',
    default: false
  },
  drawing_monitor: {
    type: 'object',
    default: {
      mode: 'auto', // auto | fixed
      display_id: null,
      label: null,
    }
  },
  screenshot_directory: {
    type: 'string',
    default: path.join(app.getPath('pictures'), 'draw'),
  },
};

// rawLog('[STORE PATH]:', app.getPath('userData') + '/config.json');
const store = new Store<Record<string, any>>({
  schema: schema as any
});

store.onDidChange('show_tool_bar', () => {
  updateExternalToolbarVisibility()
  updateContextMenu()
})
store.onDidChange('show_whiteboard', () => {
  updateContextMenu()
})

if (isLoggingEnabled) {
  rawLog('Initial store: ', store.store)

  store.onDidAnyChange((newStore, oldStore) => {
    const storeDiff = Object.fromEntries(
      Object.entries(newStore).filter(([key, value]) => !isDeepStrictEqual(value, oldStore?.[key]))
    )

    rawLog('Updated store: ', storeDiff)
  })
}

let tray: Tray
let mainWindow: BrowserWindow
let extendedToolbarWindow: BrowserWindow
let aboutWindow: BrowserWindow | null = null
let settingsWindow: BrowserWindow | null = null
let panelWindow: BrowserWindow
let panelOpenedAt = 0
let panelClosedAt = 0

let isQuitting = false
let startAsHidden = false
let drawingMode = false
let zoomMode = false
let zoomModeStarting = false

let extendedToolbarPositionStoreTimeout: ReturnType<typeof setTimeout> | null = null

const iconSrc = {
  WHITE:           path.resolve(__dirname, '../renderer/assets/trayIconWhite.png'),
  BLACK:           path.resolve(__dirname, '../renderer/assets/trayIconBlack.png'),
  DARWIN_TEMPLATE: path.resolve(__dirname, '../renderer/assets/trayIconTemplate@2x.png'),
}

function getTrayIconPath() {
  if (isMac) return iconSrc.DARWIN_TEMPLATE

  const appIconColor = store.get('app_icon_color')

  if (appIconColor === 'white') return iconSrc.WHITE
  if (appIconColor === 'black') return iconSrc.BLACK

  if (isWin && nativeTheme.shouldUseDarkColors) return iconSrc.WHITE
  if (isWin) return iconSrc.BLACK

  if (isLinux) return iconSrc.WHITE

  return iconSrc.BLACK
}

function updateContextMenu() {
  rawLog('Updating context menu...')

  if (!tray) return;

  const key_show_hide_app        = store.get('key_binding_show_hide_app')
  const key_show_hide_toolbar    = store.get('key_binding_show_hide_toolbar')
  const key_clear_desk           = store.get('key_binding_clear_desk')

  const accelForTray = (accel: string) => {
    if (!accel) return undefined;
    if (accel === KEY_NULL) return undefined;

    if (isLinux) return undefined; // Disable tray menu accelerators on Linux

    return accel
  };

  const withAccelHint = (label: string, accel: string) => {
    if (!accel) return label;
    if (accel === KEY_NULL) return label;

    if (isLinux) {
      return `${label} (${normalizeAcceleratorForUI(accel)})`;
    }

    return label;
  }

  sendPanelState()

  // 맥은 메뉴 막대 패널을 쓴다. 윈도우 · 리눅스는 패널을 옮기기 전까지 기본 메뉴를 쓴다.
  if (isMac) return;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: withAccelHint(t('menu.toggleDraw'), key_show_hide_app),
      accelerator: accelForTray(key_show_hide_app),
      click: toggleDrawOrPointerMode
    },
    {
      label: withAccelHint(t('menu.toolbar'), key_show_hide_toolbar),
      accelerator: accelForTray(key_show_hide_toolbar),
      click: toggleToolbar
    },
    {
      label: withAccelHint(t('menu.clear'), key_clear_desk),
      accelerator: accelForTray(key_clear_desk),
      click: resetScreen
    },
    { type: 'separator' },
    {
      label: withAccelHint(t('panel.settings'), KEY_SETTINGS),
      accelerator: accelForTray(KEY_SETTINGS),
      click: showSettingsWindow
    },
    { type: 'separator' },
    {
      label: t('panel.about'),
      click: showAboutWindow
    },
    {
      label: withAccelHint(t('panel.quit'), KEY_Q),
      accelerator: accelForTray(KEY_Q),
      click: quitApp
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function registerTrayActions() {
  nativeTheme.on('updated', () => {
    if (!tray) return;

    tray.setImage(getTrayIconPath())
  })

  if (isMac) {
    tray.on('click', togglePanel)
    tray.on('right-click', togglePanel)
  }

  if (isWin || isLinux) {
    tray.on('click', () => {
      toggleDrawOrPointerMode()
    })
  }
}

function createPanelWindow() {
  panelWindow = new BrowserWindow({
    type: isMac ? 'panel' : undefined, // 맥 패널 창: 눌러도 맨 앞 앱이 바뀌지 않는다
    width: PANEL_WIDTH,
    height: 480,
    useContentSize: true,
    show: false,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: true,
    roundedCorners: true,
    title: 'Draw',
    vibrancy: 'menu',
    visualEffectState: 'active',
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: false,
      backgroundThrottling: false,
      preload: preloadPath('panel_page'),
    }
  })

  panelWindow.setAlwaysOnTop(true, 'pop-up-menu')
  panelWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true, skipTransformProcessType: true })
  panelWindow.loadURL(pageUrl('panel_page'))

  panelWindow.on('blur', () => {
    rawLog('Panel blur', Date.now() - panelOpenedAt)

    // 패널을 여는 클릭이 곧바로 포커스 잃음을 보내는 일이 있어 잠깐은 무시한다.
    if (Date.now() - panelOpenedAt < PANEL_BLUR_GUARD_MS) return;

    hidePanel()
  })

  panelWindow.on('closed', () => {
    panelWindow = null!
  })
}

function placePanelUnderTray() {
  const [width, height] = panelWindow.getSize()
  const icon = tray.getBounds()
  const display = screen.getDisplayNearestPoint({ x: icon.x, y: icon.y })
  const area = display.workArea
  const x = Math.round(icon.x + icon.width / 2 - width / 2)
  const y = icon.y + icon.height + PANEL_GAP

  panelWindow.setPosition(
    Math.min(Math.max(x, area.x + PANEL_GAP), area.x + area.width - width - PANEL_GAP),
    Math.min(Math.max(y, area.y), area.y + area.height - height),
    false
  )
}

function togglePanel() {
  if (!panelWindow) return;

  if (panelWindow.isVisible()) {
    hidePanel()
    return
  }

  // 패널이 열려 있을 때 아이콘을 누르면 먼저 포커스를 잃어 닫히므로, 그 클릭으로 다시 열지 않는다.
  if (Date.now() - panelClosedAt < PANEL_REOPEN_GUARD_MS) return;

  showPanel()
}

function showPanel() {
  // 클릭 모드로 돌아올 때 앱을 숨기므로(releaseFocusBack), 먼저 숨김을 풀어야 패널이 보인다.
  if (isMac && app.isHidden()) {
    app.show()
  }

  sendPanelState()
  placePanelUnderTray()
  panelOpenedAt = Date.now()
  panelWindow.show()
  panelWindow.focus()
}

function hidePanel() {
  if (!panelWindow || !panelWindow.isVisible()) return;

  panelClosedAt = Date.now()
  panelWindow.hide()

  // 그리는 중이었다면 키 입력이 다시 그림판으로 가게 한다.
  if (drawingMode && mainWindow) {
    mainWindow.focus()
  }
}

function getPanelState() {
  return {
    version: app.getVersion(),
    drawing: drawingMode,
    showToolbar: store.get('show_tool_bar'),
    launchOnLogin: store.get('launch_on_login'),
    autoCheckUpdates: store.get('auto_check_updates'),
    keys: {
      draw: normalizeKeyForPanel(store.get('key_binding_show_hide_app')),
      toolbar: normalizeKeyForPanel(store.get('key_binding_show_hide_toolbar')),
      clear: normalizeKeyForPanel(store.get('key_binding_clear_desk')),
      settings: normalizeKeyForPanel(KEY_SETTINGS),
      quit: normalizeKeyForPanel(KEY_Q),
    },
  }
}

function normalizeKeyForPanel(accelerator: string) {
  if (!accelerator || accelerator === KEY_NULL) return undefined;

  if (!isMac) return accelerator.replace('CmdOrCtrl', 'Ctrl');

  return accelerator
    .replace('CmdOrCtrl', '⌘')
    .replace('Command', '⌘')
    .replace('Shift', '⇧')
    .replace('Alt', '⌥')
    .replace('Control', '⌃')
    .replaceAll('+', '')
}

function sendPanelState() {
  if (!panelWindow || panelWindow.isDestroyed()) return;

  panelWindow.webContents.send('panel_state_changed', getPanelState())
}

const panelActions = {
  toggle_draw: () => toggleDrawOrPointerMode(),
  toggle_toolbar: () => toggleToolbar(),
  clear: () => resetScreen(),
  about: () => showAboutWindow(),
  check_update: () => checkNow(),
  settings: () => showSettingsWindow(),
  help: () => shell.openExternal(HELP_URL),
  quit: () => quitApp(),
}

function createMainWindow() {
  const currentDisplay = getLockedMonitor() || getActiveMonitor() || getUnderCursorMonitor()

  if (store.get('active_monitor_id') !== currentDisplay.id) {
    store.set('active_monitor_id', currentDisplay.id)
  }

  let { x: displayX, y: displayY, width: displayWidth, height: displayHeight } = currentDisplay.workArea

  let isResizable = false
  let hasDevTools = false

  if (isDevelopment) {
    displayWidth = 500
    displayHeight = 500
    isResizable = true
    hasDevTools = true
  }

  mainWindow = new BrowserWindow({
    show: false,
    x: displayX,
    y: displayY,
    width: displayWidth,
    height: displayHeight,
    transparent: true,
    backgroundColor: '#00000000', // 8-symbol ARGB
    resizable: isResizable,
    minimizable: false,
    maximizable: false,
    frame: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    opacity: 0.9999999, // Fix transparency rendering artifacts
    autoHideMenuBar: true,
    webPreferences: {
      devTools: hasDevTools,
      nodeIntegration: false,
      preload: preloadPath('app_page'),
    }
  })

  mainWindow.loadURL(pageUrl('app_page'));
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setAlwaysOnTop(true)

  mainWindow.on('close', function (event) {
    rawLog('Main window: on close')

    if (isQuitting) return;

    event.preventDefault();

    hideApp()
  })

  mainWindow.on('closed', function () {
    mainWindow = null!

    app.quit()
  })

  mainWindow.webContents.setVisualZoomLevelLimits(1, 1);
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if ((input.control || input.meta) && ['+', '=', '-', '0', 'numadd', 'numsub'].includes(input.key.toLowerCase())) {
      event.preventDefault();
    }
  });
  mainWindow.webContents.on('did-start-loading', () => {
    zoomModeStarting = false
    zoomMode = false

    updateContextMenu()
  })

  rawLog('Main Window:', currentDisplay.workArea)
}

function createExtendedToolbarWindow() {
  let hasDevTools = false

  if (isDevelopment) {
    hasDevTools = true
  }

  extendedToolbarWindow = new BrowserWindow({
    show: false,
    ...getExtendedToolbarWindowSize(),
    transparent: true,
    backgroundColor: '#00000000', // 8-symbol ARGB
    resizable: false,
    minimizable: false,
    maximizable: false,
    frame: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    opacity: 0.9999999, // Fix transparency rendering artifacts
    autoHideMenuBar: true,
    webPreferences: {
      devTools: hasDevTools,
      nodeIntegration: false,
      preload: preloadPath('extended_toolbar_page'),
    }
  })

  extendedToolbarWindow.loadURL(pageUrl('extended_toolbar_page'))
  extendedToolbarWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  extendedToolbarWindow.setAlwaysOnTop(true)

  extendedToolbarWindow.on('close', function (event) {
    rawLog('Extended toolbar window: on close')

    if (isQuitting) return;

    event.preventDefault();

    hideApp()
  })

  extendedToolbarWindow.on('closed', () => {
    if (extendedToolbarPositionStoreTimeout) {
      clearTimeout(extendedToolbarPositionStoreTimeout)
      extendedToolbarPositionStoreTimeout = null
    }

    extendedToolbarWindow = null!

    app.quit()
  })

  extendedToolbarWindow.on('moved', () => {
    updateExtendedToolbarDirection()
    scheduleStoreToolbarPositionFromExtendedWindow()
  })

  extendedToolbarWindow.webContents.once('did-finish-load', () => {
    if (startAsHidden) return;

    enablePointerMode()
  })

  extendedToolbarWindow.webContents.setVisualZoomLevelLimits(1, 1);
  extendedToolbarWindow.webContents.on('before-input-event', (event, input) => {
    if ((input.control || input.meta) && ['+', '=', '-', '0', 'numadd', 'numsub'].includes(input.key.toLowerCase())) {
      event.preventDefault();
    }
  });
}

function showAboutWindow() {
  if (zoomModeStarting) return

  withThrottle(() => {
    if (aboutWindow) {
      aboutWindow.focus();
    } else {
      createAboutWindow();
    }

    if (drawingMode) {
      enablePointerMode()
    }
  });
}

function createAboutWindow() {
  let hasDevTools = false

  if (isDevelopment) {
    hasDevTools = true
  }

  aboutWindow = new BrowserWindow({
    show: false,
    width: ABOUT_WIDTH,
    height: ABOUT_HEIGHT,
    useContentSize: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    title: t('about.title'),
    vibrancy: 'under-window',
    visualEffectState: 'active',
    backgroundColor: '#00000000',
    webPreferences: {
      devTools: hasDevTools,
      nodeIntegration: false,
      preload: preloadPath('about_page'),
    }
  })
  aboutWindow.center();
  aboutWindow.on('page-title-updated', (event) => event.preventDefault())

  aboutWindow.loadURL(pageUrl('about_page'))


  aboutWindow.on('closed', () => {
    aboutWindow = null
  })

  aboutWindow.webContents.on('did-finish-load', () => {
    aboutWindow?.center()
    if (isMac) app.focus({ steal: true })
    aboutWindow?.show()
    aboutWindow?.focus()
  })

  aboutWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);

    return { action: "deny" };
  })

  aboutWindow.webContents.setVisualZoomLevelLimits(1, 1);
  aboutWindow.webContents.on('before-input-event', (event, input) => {
    if ((input.control || input.meta) && ['+', '=', '-', '0', 'numadd', 'numsub'].includes(input.key.toLowerCase())) {
      event.preventDefault();
    }
  });
}

function showSettingsWindow() {
  if (zoomModeStarting) return

  withThrottle(() => {
    if (settingsWindow) {
      settingsWindow.focus();
    } else {
      createSettingsWindow();
    }

    if (drawingMode) {
      enablePointerMode()
    }
  });
}

function createSettingsWindow() {
  rawLog('Creating settings window...')

  let hasDevTools = false

  if (isDevelopment) {
    hasDevTools = true
  }

  settingsWindow = new BrowserWindow({
    show: false,
    width: 800,
    height: 560,
    useContentSize: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    title: t('settings.title'),
    webPreferences: {
      devTools: hasDevTools,
      nodeIntegration: false,
      preload: preloadPath('settings_page'),
    }
  })
  settingsWindow.center();

  settingsWindow.loadURL(pageUrl('settings_page'))


  settingsWindow.on('closed', () => {
    settingsWindow = null
  })

  settingsWindow.webContents.on('did-finish-load', () => {
    if (isMac) app.focus({ steal: true })
    settingsWindow?.show()
    settingsWindow?.focus()
  })

  settingsWindow.webContents.setVisualZoomLevelLimits(1, 1);
  settingsWindow.webContents.on('before-input-event', (event, input) => {
    if ((input.control || input.meta) && ['+', '=', '-', '0', 'numadd', 'numsub'].includes(input.key.toLowerCase())) {
      event.preventDefault();
    }
  });
}

// Must be before "app.whenReady()"
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0); // return is forbidden in this context
}

app.on('second-instance', () => {
  if (!mainWindow) return

  enableDrawMode()
});

app.commandLine.appendSwitch('disable-pinch');

app.whenReady().then(() => {
  setLocale(testLanguage() || app.getPreferredSystemLanguages()[0] || app.getLocale())

  hideDock()

  startAsHiddenCheck()

  applyLaunchOnLoginDefault()

  logDisplays()

  createMainWindow()
  createExtendedToolbarWindow()
  createPanelWindow()

  tray = new Tray(getTrayIconPath())
  updateContextMenu()
  registerTrayActions()

  startUpdates({ store, beforeInstall: () => { isQuitting = true; flushExtendedToolbarPosition() } })

  if (DRAW_TEST_BUILD && process.env.DRAW_TEST_SHOTS) {
    runTestShots({
      dir: process.env.DRAW_TEST_SHOTS,
      enableDrawMode,
      enablePointerMode,
      showPanel,
      hidePanel,
      showAboutWindow,
      showSettingsWindow,
      getWindows: () => ({ mainWindow, extendedToolbarWindow, panelWindow, aboutWindow, settingsWindow }),
      isDrawing: () => drawingMode,
      quit: quitApp,
    })
  }

  registerGlobalShortcuts()

  setApplicationName()

  screen.on('display-added', handleDisplayChange)
  screen.on('display-removed', handleDisplayChange)
  screen.on('display-metrics-changed', handleDisplayChange)
})

app.on('before-quit', () => {
  isQuitting = true;
  flushExtendedToolbarPosition()
});

autoUpdater.on('before-quit-for-update', () => {
  isQuitting = true;
  flushExtendedToolbarPosition()
});

app.on('will-quit', () => {
  rawLog('Will quit app... (Unregister all shortcuts)')

  unRegisterGlobalShortcuts()
});

app.on('window-all-closed', () => {
  rawLog('All windows closed.')

  app.quit()
})

function testLanguage() {
  return DRAW_TEST_BUILD ? process.env.DRAW_TEST_LANG : undefined
}

function startAsHiddenCheck() {
  if (safeWasOpenedAtLogin()) {
    startAsHidden = true
    return
  }

  if (store.get('starts_hidden')) {
    startAsHidden = true
    return
  }
}

function hideDock() {
  if (isMac) {
    app.dock?.hide();
  }
}

ipcMain.on('get_locale', (event) => {
  event.returnValue = currentLocale()
});

ipcMain.handle('panel_state', () => getPanelState());

ipcMain.handle('panel_action', (_event, name) => {
  hidePanel()
  panelActions[name as keyof typeof panelActions]?.()

  return null
});

ipcMain.handle('fit_window_height', (event, height) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (!window) return null

  const [width] = window.getContentSize()
  window.setContentSize(width, height)

  return null
});

ipcMain.handle('close_window', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close()

  return null
});

// https 주소만 연다. 잘못된 값이 다른 프로그램을 띄우지 못하게 한다.
ipcMain.handle('open_external', (_event, url) => {
  try {
    if (new URL(url).protocol === 'https:') shell.openExternal(url)
  } catch {
    rawLog('Bad url:', url)
  }

  return null
});

ipcMain.handle('set_auto_check_updates', (_event, value) => {
  store.set('auto_check_updates', value)

  return null
});

ipcMain.handle('get_app_version', () => {
  return app.getVersion();
});

ipcMain.handle('get_settings', () => {
  return {
    show_whiteboard: store.get('show_whiteboard'),
    whiteboard_color: store.get('whiteboard_color'),
    whiteboard_layout: store.get('whiteboard_layout'),
    whiteboard_opacity: store.get('whiteboard_opacity'),
    whiteboard_style: store.get('whiteboard_style'),
    whiteboard_spacing: store.get('whiteboard_spacing'),
    show_tool_bar: store.get('show_tool_bar'),
    tool_bar_orientation: store.get('tool_bar_orientation'),
    show_drawing_border: store.get('show_drawing_border'),
    cute_cursor_mode: store.get('cute_cursor_mode'),
    pen_smoothing: store.get('pen_smoothing'),
    tool_bar_x: store.get('tool_bar_x'),
    tool_bar_y: store.get('tool_bar_y'),
    tool_bar_active_tool: store.get('tool_bar_active_tool'),
    tool_bar_active_color_index: store.get('tool_bar_active_color_index'),
    tool_bar_color_palette: store.get('tool_bar_color_palette'),
    tool_bar_active_weight_index: store.get('tool_bar_active_weight_index'),
    tool_bar_default_brush: store.get('tool_bar_default_brush'),
    tool_bar_default_figure: store.get('tool_bar_default_figure'),
    tool_bar_collapsed: store.get('tool_bar_collapsed'),
    swap_colors_indexes: store.get('swap_colors_indexes'),
    fade_disappear_after_ms: store.get('fade_disappear_after_ms'),
    fade_out_duration_time_ms: store.get('fade_out_duration_time_ms'),
    laser_time: store.get('laser_time'),
    clear_drawings_on_hide: store.get('clear_drawings_on_hide'),

    key_binding_show_hide_toolbar:    normalizeAcceleratorForUI(store.get('key_binding_show_hide_toolbar')),
    key_binding_show_hide_whiteboard: normalizeAcceleratorForUI(store.get('key_binding_show_hide_whiteboard')),
    key_binding_clear_desk:           normalizeAcceleratorForUI(store.get('key_binding_clear_desk')),
    key_binding_open_settings:        normalizeAcceleratorForUI(KEY_SETTINGS),
    key_binding_make_screenshot:      normalizeAcceleratorForUI(KEY_MAKE_SCREENSHOT),
    key_binding_start_zoom:           normalizeAcceleratorForUI(KEY_START_ZOOM),
  };
});

ipcMain.handle('set_settings', (_event, newSettings) => {
  rawLog('Updating settings from Renderer:')

  store.set({ ...store.store, ...newSettings })

  return null
});

ipcMain.handle('commit_toolbar_position', (_event, position) => {
  rawLog('Committing toolbar position from Renderer:')

  store.set({
    tool_bar_x: position.tool_bar_x,
    tool_bar_y: position.tool_bar_y,
  })

  return null
});

ipcMain.handle('close_app', () => {
  hideApp();

  return null
});

ipcMain.handle('toggle_draw_or_pointer_window', () => {
  toggleDrawOrPointerMode()

  return null
});

ipcMain.handle('open_settings', () => {
  showSettingsWindow()

  return null
});

ipcMain.handle('make_screenshot', () => {
  makeScreenshot()

  return null
});

ipcMain.handle('request_zoom_start', () => {
  startZoomMode()

  return null
});

ipcMain.handle('capture_zoom_image', () => {
  captureZoomImage()

  return null
});

ipcMain.handle('reject_zoom_start', () => {
  zoomModeStarting = false

  return null
});

ipcMain.handle('exit_zoom', () => {
  exitZoomMode()
  updateContextMenu()

  return null
});

ipcMain.handle('open_notification', (_event, info) => {
  if (info.action === 'open_screenshot') {
    enablePointerMode()

    const screenshotDirectory = store.get('screenshot_directory')
    const filePath = path.join(screenshotDirectory, info.data)

    if (fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath)
    } else {
      shell.openPath(screenshotDirectory)
    }

    return null
  }

  if (info.action === 'open_security_preferences') {
    enablePointerMode()

    if (isMac) {
      shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
    }

    return null
  }
});

ipcMain.handle('reset_to_originals', () => {
  resetApp();

  return null
});

ipcMain.handle('get_extended_window_configuration', () => {
  rawLog('Getting extended window configuration...')

  return {
    tool_bar_orientation: store.get('tool_bar_orientation'),
    isReversed: getExtendedToolbarDirection(),
  };
});

ipcMain.handle('get_configuration', () => {
  rawLog('Getting configuration...')

  return {
    app_version:                              app.getVersion(),

    show_drawing_border:                      store.get('show_drawing_border'),
    cute_cursor_mode:                         store.get('cute_cursor_mode'),
    pen_smoothing:                            store.get('pen_smoothing'),
    tool_bar_color_palette:                   store.get('tool_bar_color_palette'),
    swap_colors_indexes:                      store.get('swap_colors_indexes'),
    fade_disappear_after_ms:                  store.get('fade_disappear_after_ms'),
    fade_out_duration_time_ms:                store.get('fade_out_duration_time_ms'),
    laser_time:                               store.get('laser_time'),

    displays:                                 getAllDisplaysInfo(),
    drawing_monitor:                          store.get('drawing_monitor'),
    app_icon_color:                           store.get('app_icon_color'),
    launch_on_login:                          store.get('launch_on_login'),
    auto_check_updates:                       store.get('auto_check_updates'),
    starts_hidden:                            store.get('starts_hidden'),
    clear_drawings_on_hide:                   store.get('clear_drawings_on_hide'),
    disable_toolbar_in_pointer_mode:          store.get('disable_toolbar_in_pointer_mode'),
    tool_bar_orientation:                     store.get('tool_bar_orientation'),

    screenshot_directory:                     store.get('screenshot_directory'),
    screenshot_directory_is_default:          store.get('screenshot_directory') === schema.screenshot_directory.default,

    key_binding_show_hide_app:                normalizeAcceleratorForUI(store.get('key_binding_show_hide_app')),
    key_binding_show_hide_app_default:        normalizeAcceleratorForUI(schema.key_binding_show_hide_app.default),

    key_binding_show_hide_toolbar:            normalizeAcceleratorForUI(store.get('key_binding_show_hide_toolbar')),
    key_binding_show_hide_toolbar_default:    normalizeAcceleratorForUI(schema.key_binding_show_hide_toolbar.default),

    key_binding_show_hide_whiteboard:         normalizeAcceleratorForUI(store.get('key_binding_show_hide_whiteboard')),
    key_binding_show_hide_whiteboard_default: normalizeAcceleratorForUI(schema.key_binding_show_hide_whiteboard.default),

    key_binding_clear_desk:                   normalizeAcceleratorForUI(store.get('key_binding_clear_desk')),
    key_binding_clear_desk_default:           normalizeAcceleratorForUI(schema.key_binding_clear_desk.default),
  };
});

ipcMain.handle('choose_screenshot_directory', async () => {
  const screenshotDirectory = store.get('screenshot_directory')
  const fallbackDirrectory = app.getPath('pictures')
  const dialogOptions: Electron.OpenDialogOptions = {
    title: 'Choose screenshot folder',
    buttonLabel: 'Choose',
    properties: isMac ? ['openDirectory', 'createDirectory'] : ['openDirectory'],
  }

  if (fs.existsSync(screenshotDirectory)) {
    dialogOptions.defaultPath = screenshotDirectory
  } else if (fs.existsSync(fallbackDirrectory)) {
    dialogOptions.defaultPath = fallbackDirrectory
  }

  try {
    const result = await dialog.showOpenDialog(settingsWindow!, dialogOptions)
    if (result.canceled) return null

    const selectedDirectory = result.filePaths[0]

    store.set('screenshot_directory', selectedDirectory)

    return {
      path: selectedDirectory,
      isDefault: selectedDirectory === schema.screenshot_directory.default,
    }
  } catch (error) {
    dialog.showErrorBox('Unable to select screenshot folder', (error as Error).message)
    return null
  }
});

ipcMain.handle('reset_screenshot_directory', () => {
  store.reset('screenshot_directory')

  return {
    path: store.get('screenshot_directory'),
    isDefault: true,
  }
});

ipcMain.handle('open_screenshot_directory', async () => {
  try {
    const screenshotDirectory = store.get('screenshot_directory')
    await fs.promises.mkdir(screenshotDirectory, { recursive: true })

    shell.openPath(screenshotDirectory)
  } catch (error) {
    dialog.showErrorBox('Unable to open screenshot folder', (error as Error).message)
  }

  return null
});

ipcMain.handle('can_register_shortcut', async (_event, value) => {
  rawLog('Checking shortcut registration:', value)

  const accelerator = deNormalizeAcceleratorFromUI(value)

  const shortcutsInUse = [
    store.get('key_binding_show_hide_app'),
    store.get('key_binding_show_hide_toolbar'),
    store.get('key_binding_show_hide_whiteboard'),
    store.get('key_binding_clear_desk'),
    KEY_MAKE_SCREENSHOT,
    KEY_START_ZOOM,
  ].filter(s => s && s !== KEY_NULL)

  if (shortcutsInUse.includes(accelerator)) {
    return false;
  }

  if (globalShortcut.isRegistered(accelerator)) {
    return false;
  }

  try {
    const success = globalShortcut.register(accelerator, () => {});
    if (success) {
      globalShortcut.unregister(accelerator);
    }

    return success;
  } catch {
    return false;
  }
});

ipcMain.handle('set_shortcut', (_event, key, value) => {
  rawLog('Setting shortcut:', key, value)
  const accelerator = deNormalizeAcceleratorFromUI(value)

  unRegisterGlobalShortcuts()

  if (accelerator) {
    store.set(key, accelerator)
  } else {
    store.delete(key)
  }

  registerGlobalShortcuts();
  updateContextMenu()

  mainWindow.reload()

  return null
});

ipcMain.handle('set_launch_on_login', (_event, value) => {
  rawLog('Setting launch on login:', value)

  safeSetLoginItemSettings({ openAtLogin: value });

  store.set('launch_on_login', value)

  return null;
});

ipcMain.handle('set_starts_hidden', (_event, value) => {
  rawLog('Setting starts hidden:', value)

  store.set('starts_hidden', value)

  return null;
});

ipcMain.handle('set_clear_drawings_on_hide', (_event, value) => {
  rawLog('Setting clear drawings on hide:', value)

  store.set('clear_drawings_on_hide', value)

  refreshSettingsInRenderer();

  return null;
});

ipcMain.handle('set_show_drawing_border', (_event, value) => {
  rawLog('Setting drawing border:', value)

  store.set('show_drawing_border', value)

  refreshSettingsInRenderer();

  return null;
});

ipcMain.handle('set_cute_cursor_mode', (_event, value) => {
  rawLog('Setting cute cursor mode:', value)

  store.set('cute_cursor_mode', value)

  refreshSettingsInRenderer();

  return null;
});

ipcMain.handle('set_pen_smoothing', (_event, value) => {
  rawLog('Setting pen smoothing:', value)

  store.set('pen_smoothing', value)

  refreshSettingsInRenderer();

  return null;
});

ipcMain.handle('set_swap_colors', (_event, value) => {
  rawLog('Setting swap colors:', value)

  store.set('swap_colors_indexes', value)

  refreshSettingsInRenderer();

  return null;
});

ipcMain.handle('set_toolbar_color', (_event, colorId, normalizedColor) => {
  rawLog('Setting toolbar color:', colorId, normalizedColor)

  store.set(`tool_bar_color_palette.${colorId}`, normalizedColor)

  refreshSettingsInRenderer();

  return null
});

ipcMain.handle('set_fade_disappear_after_ms', (_event, value) => {
  rawLog('Setting fade disappear after:', value)

  store.set('fade_disappear_after_ms', value)

  mainWindow.reload()

  return null
});

ipcMain.handle('set_fade_out_duration_time_ms', (_event, value) => {
  rawLog('Setting fade out duration time:', value)

  store.set('fade_out_duration_time_ms', value)

  mainWindow.reload()

  return null
});

ipcMain.handle('set_laser_time', (_event, value) => {
  rawLog('Setting laser time:', value)

  store.set('laser_time', value)

  mainWindow.reload()

  return null
});

ipcMain.handle('set_app_icon_color', (_event, value) => {
  rawLog('Setting app icon color:', value)

  store.set('app_icon_color', value)

  tray.setImage(getTrayIconPath())
  return null;
});

ipcMain.handle('set_drawing_monitor', (_event, value) => {
  rawLog('Setting drawing monitor:', value)

  store.set('drawing_monitor', value)

  return null
});

ipcMain.handle('set_disable_toolbar_in_pointer_mode', (_event, value) => {
  rawLog('Setting disable toolbar in pointer mode:', value)

  store.set('disable_toolbar_in_pointer_mode', value)

  updateExternalToolbarVisibility()

  return null
});

ipcMain.handle('set_toolbar_orientation', (_event, value) => {
  rawLog('Setting toolbar orientation:', value)

  flushExtendedToolbarPosition()
  const currentDisplay = getLockedMonitor() || getUnderToolbarMonitor() || getActiveMonitor() || getUnderCursorMonitor()
  store.set('tool_bar_orientation', value)

  const { width, height } = getExtendedToolbarWindowSize()
  extendedToolbarWindow.setSize(width, height)
  updateExtendedToolbarWindowPosition(currentDisplay)

  mainWindow.reload()
  extendedToolbarWindow.reload()

  return null
});

function refreshSettingsInRenderer() {
  mainWindow.webContents.send('refresh_settings', {
    whiteboard_color:        store.get('whiteboard_color'),
    whiteboard_layout:       store.get('whiteboard_layout'),
    whiteboard_opacity:      store.get('whiteboard_opacity'),
    whiteboard_style:        store.get('whiteboard_style'),
    whiteboard_spacing:      store.get('whiteboard_spacing'),
    show_drawing_border:     store.get('show_drawing_border'),
    cute_cursor_mode:        store.get('cute_cursor_mode'),
    pen_smoothing:           store.get('pen_smoothing'),
    tool_bar_color_palette:  store.get('tool_bar_color_palette'),
    swap_colors_indexes:     store.get('swap_colors_indexes'),
    clear_drawings_on_hide:  store.get('clear_drawings_on_hide'),
  })
}

function updateToolbarPositionInRenderer() {
  mainWindow.webContents.send('update_toolbar_position', {
    tool_bar_x:          store.get('tool_bar_x'),
    tool_bar_y:          store.get('tool_bar_y'),
  })
}

function registerGlobalShortcuts() {
  rawLog('REGISTER global shortcuts...')

  const keyApp = store.get('key_binding_show_hide_app')
  safeRegisterGlobalShortcut(keyApp, toggleDrawOrPointerMode)
}

function unRegisterGlobalShortcuts() {
  rawLog('UNREGISTER global shortcuts...')

  globalShortcut.unregisterAll();
}

function withThrottle(callback: (...args: any[]) => any) {
  rawLog('withThrottle called...')

  const now = Date.now();
  if (now < lastShortcutTime + throttleDelay) return;
  lastShortcutTime = now;

  callback();
}

function toggleDrawOrPointerMode() {
  if (zoomModeStarting) return

  if (zoomMode) {
    exitZoomMode()
    updateContextMenu()
    return
  }

  withThrottle(() => {
    rawLog('Toggling draw mode...')

    if (drawingMode) {
      enablePointerMode()
    } else {
      enableDrawMode()
    }
  });
}

function enableDrawMode() {
  if (zoomModeStarting) return

  rawLog('Enable drawing mode...')

  exitZoomMode()
  flushExtendedToolbarPosition()

  showMainWindow()
  hideWindow(extendedToolbarWindow)

  drawingMode = true
  updateContextMenu()
}

function enablePointerMode() {
  if (zoomModeStarting) return

  rawLog('Enable pointer mode...')

  exitZoomMode()
  resetScreenOnHide()

  showExtendedToolbarWindow()
  hideWindow(mainWindow)

  drawingMode = false
  updateContextMenu()

  releaseFocusBack()
}

function hideApp() {
  if (zoomModeStarting) return

  rawLog('Hiding app...')

  exitZoomMode()
  resetScreenOnHide()

  hideWindow(mainWindow)
  hideWindow(extendedToolbarWindow)

  drawingMode = false
  updateContextMenu()

  releaseFocusBack()
}

function resetScreenOnHide() {
  if (store.get('clear_drawings_on_hide')) {
    sendResetScreen();
  }
}

function handleDisplayChange() {
  store.delete('active_monitor_id')
  hideApp()
}

function updateExternalToolbarVisibility() {
  if (drawingMode) return;

  if (store.get('disable_toolbar_in_pointer_mode')) {
    hideWindow(extendedToolbarWindow)
    return
  }

  if (store.get('show_tool_bar')) {
    showExtendedToolbarWindow()
  } else {
    hideWindow(extendedToolbarWindow)
  }
}

function toggleToolbar() {
  withThrottle(() => {
    rawLog('Toggling toolbar...')

    store.set('show_tool_bar', !store.get('show_tool_bar'));
    mainWindow.webContents.send('toggle_toolbar') // Roundtrip request ...
  });
}

function resetApp() {
  if (zoomModeStarting) return

  withThrottle(() => {
    rawLog('Resetting app to original settings...')

    unRegisterGlobalShortcuts()

    store.clear()

    registerGlobalShortcuts()

    if (safeIsOpenAtLogin()) {
      safeSetLoginItemSettings({ openAtLogin: false });
    }

    tray.setImage(getTrayIconPath())

    const { width, height } = getExtendedToolbarWindowSize()
    extendedToolbarWindow.setSize(width, height)

    enablePointerMode()

    mainWindow.reload()
    extendedToolbarWindow.reload()

    if (settingsWindow) {
      settingsWindow.reload()
    }
  })
}

function resetScreen() {
  withThrottle(sendResetScreen);
}

function sendResetScreen() {
  rawLog('Resetting screen...')

  mainWindow.webContents.send('reset_screen');
}

function startZoomMode() {
  if (zoomMode || zoomModeStarting) return

  if (!drawingMode) {
    enableDrawMode()
  }

  zoomModeStarting = true
  mainWindow.webContents.send('prepare_zoom_capture')
}

function getInitialZoomPoint() {
  const cursor = screen.getCursorScreenPoint()
  const windowBounds = mainWindow.getBounds()

  return {
    x: Math.max(0, Math.min(windowBounds.width, cursor.x - windowBounds.x)),
    y: Math.max(0, Math.min(windowBounds.height, cursor.y - windowBounds.y)),
  }
}

async function captureZoomImage() {
  if (!zoomModeStarting) return

  try {
    const image = await captureMainWindowImage()

    const imageDataUrl = image.toDataURL()
    const initialZoomPoint = getInitialZoomPoint()

    if (!zoomModeStarting) return

    zoomModeStarting = false
    zoomMode = true
    updateContextMenu()

    mainWindow.webContents.send('show_zoom', {
      imageDataUrl: imageDataUrl,
      initialZoomPoint: initialZoomPoint,
    })
  } catch (error) {
    if (!zoomModeStarting && !zoomMode) return

    zoomModeStarting = false
    zoomMode = false
    updateContextMenu()

    mainWindow.webContents.send('stop_zoom')

    sendNotification({
      title: 'Zoom capture failed',
      body: (error as Error).message,
      button_label: isMac ? 'Settings' : null,
      button_action: isMac ? 'open_security_preferences' : null,
      button_data: null,
    })
  }
}

function exitZoomMode() {
  if (!zoomMode) return

  zoomMode = false
  mainWindow.webContents.send('stop_zoom')
}

function quitApp() {
  withThrottle(() => {
    rawLog('Quitting app...')

    app.quit();
  });
}

function screenshotTimecode4(date: Date) {
  let value = date.getHours() * 3600 +
              date.getMinutes() * 60 +
              date.getSeconds(); // 0..86399

  let code = '';
  for (let i = 0; i < 4; i++) {
    code = String.fromCharCode(97 + (value % 26)) + code;
    value = Math.floor(value / 26);
  }

  return code;
}

function screenshotFilename(withUniqSuffix = false) {
  const date = new Date()

  const yyyy = date.getFullYear();
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = (date.getDate()).toString().padStart(2, '0');

  const code = screenshotTimecode4(date);
  const suffix = withUniqSuffix ? `-${Date.now()}` : '';

  return `DRWPN-${yyyy}${mm}${dd}-${code}${suffix}.png`;
}

async function captureDisplayImage(display: Electron.Display) {
  if (isMac) {
    const status = systemPreferences.getMediaAccessStatus('screen')

    if (status !== 'granted') {
      // NOTE: Adds an app to Screen & System Audio Recording list
      try {
        await desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: { width: 1, height: 1 },
        })
      } catch (_) {}

      throw new Error('Screen Recording permission is not granted.')
    }
  }

  const thumbnailSize = {
    width: Math.round(display.size.width * (display.scaleFactor || 1)),
    height: Math.round(display.size.height * (display.scaleFactor || 1)),
  }

  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize,
  })

  if (sources.length === 0) {
    throw new Error('No screen sources available for capture.')
  }

  const source =
    sources.find(item => String(item.display_id ?? '') === String(display.id)) ||
    sources.find(item => {
      const { width, height } = item.thumbnail.getSize()
      return width === thumbnailSize.width && height === thumbnailSize.height
    }) ||
    sources[0]

  const image = source.thumbnail

  if (!image || image.isEmpty()) {
    throw new Error('Could not capture the screen.')
  }

  return image
}

async function captureMainWindowImage() {
  const currentDisplay = getLockedMonitor() || getActiveMonitor() || getUnderCursorMonitor()
  const image = await captureDisplayImage(currentDisplay)

  const imageSize = image.getSize()
  const windowBounds = mainWindow.getBounds()

  const scale = imageSize.width / currentDisplay.bounds.width

  const cropX = Math.round((windowBounds.x - currentDisplay.bounds.x) * scale)
  const cropY = Math.round((windowBounds.y - currentDisplay.bounds.y) * scale)

  const cropWidth  = Math.round(windowBounds.width * scale)
  const cropHeight = Math.round(windowBounds.height * scale)

  return image.crop({
    x: cropX,
    y: cropY,
    width: cropWidth,
    height: cropHeight,
  })
}

async function makeScreenshot() {
  if (zoomMode || zoomModeStarting) return

  if (!drawingMode) {
    enableDrawMode()
  }

  try {
    rawLog('Exporting as PNG...')

    const currentDisplay = getLockedMonitor() || getActiveMonitor() || getUnderCursorMonitor()
    const image = await captureDisplayImage(currentDisplay)
    const imagePng = image.toPNG()

    const screenshotDirectory = store.get('screenshot_directory')
    await fs.promises.mkdir(screenshotDirectory, { recursive: true })

    let screenshotName = screenshotFilename()
    let savePath = path.join(screenshotDirectory, screenshotName)

    if (fs.existsSync(savePath)) {
      screenshotName = screenshotFilename(true)
      savePath = path.join(screenshotDirectory, screenshotName)
    }

    mainWindow.webContents.send('screenshot_flash')

    await fs.promises.writeFile(savePath, imagePng)

    try {
      clipboard.writeImage(nativeImage.createFromBuffer(imagePng))
    } catch (_) {}

    sendNotification({
      title: `Click to open ${isMac ? 'in Finder' : 'folder'}`,
      body: savePath,
      button_label: 'Open',
      button_action: 'open_screenshot',
      button_data: screenshotName,
    });
  } catch (error) {
    sendNotification({
      title: 'Image export failed',
      body: (error as Error).message,
      button_label: isMac ? 'Settings' : null,
      button_action: isMac ? 'open_security_preferences' : null,
      button_data: null,
    });
  }
}

function sendNotification(data: Record<string, unknown>) {
  mainWindow.webContents.send('show_notification', data);
}

function hideWindow(targetWindow: Electron.BrowserWindow) {
  targetWindow.setOpacity(0)
  try {
    targetWindow.hide()
  } finally {
    targetWindow.setOpacity(1)
  }
}

function showWindow(targetWindow: Electron.BrowserWindow, { inactive = false } = {}) {
  targetWindow.setOpacity(0)

  try {
    if (inactive) {
      targetWindow.showInactive()
    } else {
      targetWindow.show()
    }
    targetWindow.moveTop()
  } finally {
    targetWindow.setOpacity(1)
  }
}

function releaseFocusBack() {
  if (!isMac) return;

  if (settingsWindow) {
    settingsWindow.focus()
    return
  }

  if (aboutWindow) {
    aboutWindow.focus()
    return
  }

  app.hide()
}

function storeToolbarPositionFromExtendedWindow() {
  const currentDisplay = getLockedMonitor() || getUnderToolbarMonitor()
  if (!currentDisplay) return;

  const { x: displayX, y: displayY } = currentDisplay.workArea
  const { x: extToolBarX, y: extToolBarY } = extendedToolbarWindow.getBounds()

  const offset = getPointerToolbarOffset(store.get('tool_bar_orientation'), EXTENDED_TOOLBAR_WINDOW_MARGIN)
  const toolBarX = extToolBarX - displayX + offset.x
  const toolBarY = extToolBarY - displayY + offset.y

  rawLog(`Update Toolbar: display: ${currentDisplay.id}, toolBarX: ${toolBarX}, toolBarY: ${toolBarY}`)

  store.set({
    tool_bar_x: toolBarX,
    tool_bar_y: toolBarY,
  });

  updateMainWindowPosition(currentDisplay)
}

function flushExtendedToolbarPosition() {
  if (!extendedToolbarPositionStoreTimeout) return;

  clearTimeout(extendedToolbarPositionStoreTimeout)
  extendedToolbarPositionStoreTimeout = null

  storeToolbarPositionFromExtendedWindow()
}

function scheduleStoreToolbarPositionFromExtendedWindow() {
  if (extendedToolbarPositionStoreTimeout) {
    clearTimeout(extendedToolbarPositionStoreTimeout)
  }

  extendedToolbarPositionStoreTimeout = setTimeout(() => {
    extendedToolbarPositionStoreTimeout = null
    storeToolbarPositionFromExtendedWindow()
  }, updateStoreDelay)
}

// - Enable Draw Mode (Click by Main Button or from Tray)
function showMainWindow() {
  if (isMac && app.isHidden()) {
    app.show()
  }

  const currentDisplay = getLockedMonitor() || getUnderToolbarMonitor() || getUnderCursorMonitor()

  updateMainWindowPosition(currentDisplay)

  showWindow(mainWindow)
}

function updateMainWindowPosition(display: Electron.Display) {
  if (store.get('active_monitor_id') === display.id) {
    updateToolbarPositionInRenderer()
    return
  }

  mainWindow.setBounds(display.workArea)

  if (isDevelopment) {
    mainWindow.setBounds({
      width: 500,
      height: 500
    })
  }

  mainWindow.reload()

  store.set('active_monitor_id', display.id)
}

// - Cold Start
// - Enable Toolbar from Tray
// - Enable Pointer Mode (Click by Main Button or from Tray)
function showExtendedToolbarWindow() {
  if (store.get('disable_toolbar_in_pointer_mode')) return;
  if (!store.get('show_tool_bar')) return;

  const currentDisplay = getLockedMonitor() || getActiveMonitor() || getUnderCursorMonitor()

  updateExtendedToolbarWindowPosition(currentDisplay)

  showWindow(extendedToolbarWindow, { inactive: true })
}

function getExtendedToolbarWindowSize() {
  if (store.get('tool_bar_orientation') === 'vertical') {
    return EXTENDED_TOOLBAR_VERTICAL_WINDOW_SIZE
  }

  return EXTENDED_TOOLBAR_HORIZONTAL_WINDOW_SIZE
}

function getExtendedToolbarDirection() {
  const display = getLockedMonitor() || getUnderToolbarMonitor() || getActiveMonitor() || getUnderCursorMonitor()
  const orientation = store.get('tool_bar_orientation')
  const offset = getPointerToolbarOffset(orientation, EXTENDED_TOOLBAR_WINDOW_MARGIN)
  const bounds = extendedToolbarWindow.getBounds()
  return isToolbarReversed({
    x: bounds.x - display.workArea.x + offset.x,
    y: bounds.y - display.workArea.y + offset.y,
  }, display.workArea, orientation)
}

function updateExtendedToolbarDirection() {
  extendedToolbarWindow.webContents.send('toolbar_direction', getExtendedToolbarDirection())
}

function updateExtendedToolbarWindowPosition(display: Electron.Display) {
  const { x: displayX, y: displayY } = display.workArea
  const offset = getPointerToolbarOffset(store.get('tool_bar_orientation'), EXTENDED_TOOLBAR_WINDOW_MARGIN)

  extendedToolbarWindow.setBounds({
    x: displayX + store.get('tool_bar_x') - offset.x,
    y: displayY + store.get('tool_bar_y') - offset.y,
  })
  updateExtendedToolbarDirection()
}

function getLockedMonitor() {
  const drawingMonitorOptions = store.get('drawing_monitor')

  if (drawingMonitorOptions.mode === 'fixed') {
    return screen.getAllDisplays().find(display => String(display.id) === drawingMonitorOptions.display_id)
  }

  return null
}

function getActiveMonitor() {
  const activeMonitorId = store.get('active_monitor_id')

  return screen.getAllDisplays().find(display => display.id === activeMonitorId)
}

function getUnderCursorMonitor() {
  return screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
}

function getUnderToolbarMonitor() {
  if (!extendedToolbarWindow.isVisible()) {
    return null
  }

  return screen.getDisplayMatching(extendedToolbarWindow.getBounds())
}

function getAllDisplaysInfo() {
  const allDisplays = screen.getAllDisplays()

  return allDisplays.map(display => {
    const displayName = display.label || `Display ${display.id}`
    const resolution = `${display.size.width}x${display.size.height}`

    return {
      id: String(display.id),
      label: `${displayName} (${resolution})`,
    }
  })
}

function logDisplays() {
  const displays = screen.getAllDisplays()
  const primaryDisplayId = screen.getPrimaryDisplay().id

  rawLog(`Connected displays: ${displays.length}`)

  displays.forEach((display, index) => {
    rawLog(`Display ${index + 1}:`, {
      id: display.id,
      label: display.label,
      primary: display.id === primaryDisplayId,
      internal: display.internal,
      size: display.size,
      bounds: display.bounds,
      workArea: display.workArea,
      scaleFactor: display.scaleFactor,
      rotation: display.rotation,
      displayFrequency: display.displayFrequency,
    })
  })
}

function normalizeAcceleratorForUI(value: string) {
  if (!value) return value;

  const target = (isMac) ? 'Meta' : 'Control';
  return value.replace('CmdOrCtrl', target);
}

function deNormalizeAcceleratorFromUI(value: string) {
  if (!value) return value;

  const target = (isMac) ? 'Meta' : 'Control';
  return value.replace(target, 'CmdOrCtrl');
}

function safeRegisterGlobalShortcut(accelerator: string, callback: (...args: any[]) => any) {
  if (!accelerator || accelerator === KEY_NULL) {
    return
  }

  try {
    if (globalShortcut.isRegistered(accelerator)) {
      rawLog('Global shortcut already registered:', accelerator);
      return
    }

    const success = globalShortcut.register(accelerator, callback);
    if (!success) {
      rawLog('Failed to register global shortcut:', accelerator);
    }
  } catch (error) {
    rawLog('Error registering global shortcut:', accelerator, error);
  }
}

function setApplicationName() {
  if (isWin) {
    app.setAppUserModelId('im.runners.draw');
  }
}

function safeWasOpenedAtLogin() {
  if (isLinux) return false; // Linux не підтримує login items

  try {
    return !!app.getLoginItemSettings().wasOpenedAtLogin;
  } catch (error) {
    return false;
  }
}

function safeIsOpenAtLogin() {
  if (isLinux) return false;

  try {
    return !!app.getLoginItemSettings().openAtLogin
  } catch (error) {
    return false
  }
}

// 직접 받는 판은 맥마다 처음 한 번 「로그인할 때 열기」를 스스로 켠다. 표시 파일을 남겨, 그 뒤에 사람이 끄면 다시 켜지 않는다.
// 시험판은 지운 뒤에도 로그인 항목이 남으면 안 되므로 켜지 않는다.
function applyLaunchOnLoginDefault() {
  if (isLinux || !app.isPackaged || DRAW_TEST_BUILD) return;

  const marker = path.join(app.getPath('userData'), LAUNCH_ON_LOGIN_APPLIED);
  if (fs.existsSync(marker)) return;

  safeSetLoginItemSettings({ openAtLogin: true });
  store.set('launch_on_login', true)
  try {
    fs.writeFileSync(marker, '');
  } catch (error) {}
}

function safeSetLoginItemSettings(settings: Electron.Settings) {
  if (isLinux) return;

  try {
    app.setLoginItemSettings(settings)
  } catch (error) {}
}

function rawLog(message: string, ...args: unknown[]) {
  if (!isLoggingEnabled) { return }

  console.log(message, ...args);
}

process.on('uncaughtException', (error) => {
  console.log('[DRAW:FATAL] uncaughtException', error)
  app.quit();
})

process.on('unhandledRejection', (reason) => {
  console.log('[DRAW:FATAL] unhandledRejection', reason)
  app.quit();
})
