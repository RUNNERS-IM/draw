import { useEffect, useState, type ReactNode } from 'react'
import { Brush, CircleUser, Info, Settings as SettingsIcon, type LucideIcon } from 'lucide-react'
import '../../../runners-account/runners-window.css'
import './Settings.scss'
import ShortcutRecorder from './ShortcutRecorder'
import ColorPicker from './ColorPicker'
import AccountTab from './AccountTab'
import AboutTab from './AboutTab'
import { useTranslation } from 'react-i18next'
import {
  createApplicationColorList,
  timeStep,
  laserTimeMin,
  laserTimeMax,
  fadeDisappearAfterMin,
  fadeDisappearAfterMax,
  fadeOutDurationTimeMsMin,
  fadeOutDurationTimeMsMax,
  toolbarColorIds
} from '../../app_page/components/constants'

import {
  IoRefreshCircleOutline,
  IoCloseCircleOutline,
  IoChevronDown,
  IoChevronForward
} from 'react-icons/io5'
import { HiSwitchHorizontal } from 'react-icons/hi'
import { FaPlus, FaMinus } from 'react-icons/fa'

// 첫 판(그리기만)에 없는 설정. 코드는 두고 화면에서만 뺀다.
const HIDDEN_FEATURES = false

// 설정 창 하나에 탭 넷(2026-11-08 창 통일 1C · 3A). 위 도구 막대 탭은 Split 설정 창과 같은 모양이다.
type Tab = 'draw' | 'general' | 'account' | 'about'

const TABS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: 'draw', label: 'settings.tabDraw', Icon: Brush },
  { id: 'general', label: 'settings.tabGeneral', Icon: SettingsIcon },
  { id: 'account', label: 'settings.tabAccount', Icon: CircleUser },
  { id: 'about', label: 'settings.tabAbout', Icon: Info }
]

const isTab = (value: unknown): value is Tab => TABS.some((tab) => tab.id === value)

// 작은 회색 제목과 그 아래 흰 카드 한 장. 제목이 없으면 카드만 둔다.
const Group = ({ title, children }: { title?: string; children: ReactNode }) => (
  <section className="settings-group">
    {title && <h2 className="settings-group-title">{title}</h2>}
    <div className="settings-section">{children}</div>
  </section>
)

// 메뉴 막대 아이콘을 끄기 전에 묻는 창. Split 설정 창의 같은 알림과 같은 글 · 같은 단추 차례다.
const HideTrayAlert = ({
  onCancel,
  onConfirm
}: {
  onCancel: () => void
  onConfirm: () => void
}) => {
  const { t } = useTranslation()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="alert-backdrop" role="presentation">
      <div
        className="alert"
        role="alertdialog"
        aria-modal="true"
        aria-label={t('settings.hideTrayTitle')}
      >
        <img className="alert-icon" src="../assets/icon.png" alt="" draggable={false} />
        <div className="alert-message">{t('settings.hideTrayTitle')}</div>
        <div className="alert-informative">{t('settings.hideTrayDetail')}</div>
        <div className="alert-buttons">
          <button className="rw-button" onClick={onCancel}>
            {t('settings.cancel')}
          </button>
          <button className="rw-button default" onClick={onConfirm} autoFocus>
            {t('settings.ok')}
          </button>
        </div>
      </div>
    </div>
  )
}

const ShortcutRow = ({
  title,
  description,
  shortcut,
  onCheck,
  onChange,
  onReset,
  onRemove
}: {
  title: string
  description: string
  shortcut: any
  onCheck: (...args: any[]) => any
  onChange: (...args: any[]) => any
  onReset: (...args: any[]) => any
  onRemove: (...args: any[]) => any
}) => {
  const { t } = useTranslation()
  const canReset = !!shortcut.init && shortcut.init !== shortcut.accelerator
  const canRemove = (shortcut.accelerator || shortcut.init) && shortcut.accelerator !== '[NULL]'

  return (
    <div className="settings-item">
      <div className="settings-item-info">
        <div className="settings-item-title">{title}</div>
        <div className="settings-item-description">{description}</div>
      </div>

      <div className="settings-item-control">
        {canReset && (
          <IoRefreshCircleOutline
            className="icon"
            title={t('settings.resetDefault')}
            onClick={onReset}
          />
        )}
        {canRemove && (
          <IoCloseCircleOutline
            className="icon"
            title={t('settings.removeShortcut')}
            onClick={onRemove}
          />
        )}

        <ShortcutRecorder
          accelerator={shortcut.accelerator}
          onCheck={onCheck}
          onChange={onChange}
        />
      </div>
    </div>
  )
}

const Settings = (config: any) => {
  const { t } = useTranslation()
  const [showDrawingBorder, setShowDrawingBorder] = useState(config.show_drawing_border)
  const [cuteCursorMode, setCuteCursorMode] = useState(config.cute_cursor_mode)
  const [penSmoothing, setPenSmoothing] = useState(config.pen_smoothing)
  const [appIconColor, setAppIconColor] = useState(config.app_icon_color)
  const [fadeDisappearAfterMs, setFadeDisappearAfterMs] = useState(config.fade_disappear_after_ms)
  const [fadeOutDurationTimeMs, setFadeOutDurationTimeMs] = useState(
    config.fade_out_duration_time_ms
  )
  const [laserTimeMs, setLaserTimeMs] = useState(config.laser_time)
  const [launchOnLogin, setLaunchOnLogin] = useState(config.launch_on_login)
  const [autoCheckUpdates, setAutoCheckUpdates] = useState(config.auto_check_updates)
  const [startsHidden, setStartsHidden] = useState(config.starts_hidden)
  const [clearDrawingsOnHide, setClearDrawingsOnHide] = useState(config.clear_drawings_on_hide)
  const [disableToolbarInPointerMode, setDisableToolbarInPointerMode] = useState(
    config.disable_toolbar_in_pointer_mode
  )
  const [toolbarOrientation, setToolbarOrientation] = useState(config.tool_bar_orientation)
  const [screenshotDirectory, setScreenshotDirectory] = useState({
    path: config.screenshot_directory,
    isDefault: config.screenshot_directory_is_default
  })

  const [showHideApp, setShowHideApp] = useState({
    accelerator: config.key_binding_show_hide_app,
    init: config.key_binding_show_hide_app_default
  })
  const [showHideToolbar, setShowHideToolbar] = useState({
    accelerator: config.key_binding_show_hide_toolbar,
    init: config.key_binding_show_hide_toolbar_default
  })
  const [showHideWhiteboard, setShowHideWhiteboard] = useState({
    accelerator: config.key_binding_show_hide_whiteboard,
    init: config.key_binding_show_hide_whiteboard_default
  })
  const [clearDesk, setClearDesk] = useState({
    accelerator: config.key_binding_clear_desk,
    init: config.key_binding_clear_desk_default
  })

  const [mainColor, setMainColor] = useState(config.swap_colors_indexes[0])
  const [secondaryColor, setSecondaryColor] = useState(config.swap_colors_indexes[1])
  const [drawingMonitor, setDrawingMonitor] = useState(config.drawing_monitor)
  const [toolbarColorPalette, setToolbarColorPalette] = useState(config.tool_bar_color_palette)
  const [editingColorId, setEditingColorId] = useState<any>(null)

  const colorList = createApplicationColorList(toolbarColorPalette)
  const mainColorInfo = colorList[mainColor]
  const secondaryColorInfo = colorList[secondaryColor]

  const [activeTab, setActiveTab] = useState<Tab>(isTab(config.open_tab) ? config.open_tab : 'draw')
  const [showTrayIcon, setShowTrayIcon] = useState(config.show_tray_icon)
  const [confirmHideTray, setConfirmHideTray] = useState(false)

  const displays = config.displays || []
  const isMac = config.is_mac

  const resetToOriginals = () => {
    window.electronAPI.resetToOriginals()
  }

  const selectTab = (tab: Tab) => {
    setEditingColorId(null)
    setActiveTab(tab)
  }

  // 이미 열린 창에 다른 탭을 열라고 할 때(앱 메뉴의 「Draw 정보」, 아이콘을 숨긴 채 Draw 를 다시 열 때).
  useEffect(
    () =>
      window.electronAPI.onOpenTab((tab) => {
        if (isTab(tab)) {
          setEditingColorId(null)
          setActiveTab(tab)
        }
      }),
    []
  )

  const saveToolbarColor = (colorId: string, color: string) => {
    setToolbarColorPalette({ ...toolbarColorPalette, [colorId]: color })
    setEditingColorId(null)

    window.electronAPI.setToolbarColor(colorId, color)
  }

  const canRegisterShortcut = async (accelerator: string) => {
    return await window.electronAPI.canRegisterShortcut(accelerator)
  }

  const applyShortcut = (key: string, accelerator: string) => {
    window.electronAPI.setShortcut(key, accelerator)

    switch (key) {
      case 'key_binding_show_hide_app':
        setShowHideApp({ ...showHideApp, accelerator })
        break
      case 'key_binding_show_hide_toolbar':
        setShowHideToolbar({ ...showHideToolbar, accelerator })
        break
      case 'key_binding_show_hide_whiteboard':
        setShowHideWhiteboard({ ...showHideWhiteboard, accelerator })
        break
      case 'key_binding_clear_desk':
        setClearDesk({ ...clearDesk, accelerator })
        break
    }
  }

  const resetShortcut = (key: string) => {
    window.electronAPI.setShortcut(key, null)

    switch (key) {
      case 'key_binding_show_hide_app':
        setShowHideApp({ ...showHideApp, accelerator: showHideApp.init })
        break
      case 'key_binding_show_hide_toolbar':
        setShowHideToolbar({ ...showHideToolbar, accelerator: showHideToolbar.init })
        break
      case 'key_binding_show_hide_whiteboard':
        setShowHideWhiteboard({ ...showHideWhiteboard, accelerator: showHideWhiteboard.init })
        break
      case 'key_binding_clear_desk':
        setClearDesk({ ...clearDesk, accelerator: clearDesk.init })
        break
    }
  }

  const removeShortcut = (key: string) => {
    window.electronAPI.setShortcut(key, '[NULL]')

    switch (key) {
      case 'key_binding_show_hide_app':
        setShowHideApp({ ...showHideApp, accelerator: '[NULL]' })
        break
      case 'key_binding_show_hide_toolbar':
        setShowHideToolbar({ ...showHideToolbar, accelerator: '[NULL]' })
        break
      case 'key_binding_show_hide_whiteboard':
        setShowHideWhiteboard({ ...showHideWhiteboard, accelerator: '[NULL]' })
        break
      case 'key_binding_clear_desk':
        setClearDesk({ ...clearDesk, accelerator: '[NULL]' })
        break
    }
  }

  const toggleDrawingBorder = () => {
    const nextState = !showDrawingBorder
    setShowDrawingBorder(nextState)

    window.electronAPI.setShowDrawingBorder(nextState)
  }

  const selectCuteCursorMode = (event: any) => {
    const mode = event.target.value
    setCuteCursorMode(mode)

    window.electronAPI.setCuteCursorMode(mode)
  }

  const togglePenSmoothing = () => {
    const nextState = !penSmoothing
    setPenSmoothing(nextState)

    window.electronAPI.setPenSmoothing(nextState)
  }

  const toggleLaunch = () => {
    const nextState = !launchOnLogin
    setLaunchOnLogin(nextState)

    window.electronAPI.setLaunchOnLogin(nextState)
  }

  const toggleAutoCheckUpdates = () => {
    const nextState = !autoCheckUpdates
    setAutoCheckUpdates(nextState)

    window.electronAPI.setAutoCheckUpdates(nextState)
  }

  const applyShowTrayIcon = async (value: boolean) => {
    setConfirmHideTray(false)
    setShowTrayIcon(value)
    setShowTrayIcon(await window.electronAPI.setShowTrayIcon(value))
  }

  const toggleShowTrayIcon = () => {
    if (showTrayIcon) {
      setConfirmHideTray(true)
      return
    }

    void applyShowTrayIcon(true)
  }

  const checkUpdate = () => {
    window.electronAPI.checkUpdate()
  }

  const toggleStartsHidden = () => {
    const nextState = !startsHidden
    setStartsHidden(nextState)

    window.electronAPI.setStartsHidden(nextState)
  }

  const toggleClearDrawingsOnHide = () => {
    const nextState = !clearDrawingsOnHide
    setClearDrawingsOnHide(nextState)

    window.electronAPI.setClearDrawingsOnHide(nextState)
  }

  const toggleDisableToolbarInPointerMode = () => {
    const nextState = !disableToolbarInPointerMode
    setDisableToolbarInPointerMode(nextState)

    window.electronAPI.setDisableToolbarInPointerMode(nextState)
  }

  const selectAppIconColor = (event: any) => {
    const iconColor = event.target.value
    setAppIconColor(iconColor)

    window.electronAPI.setAppIconColor(iconColor)
  }

  const selectToolbarOrientation = (event: any) => {
    const orientation = event.target.value
    setToolbarOrientation(orientation)

    window.electronAPI.setToolbarOrientation(orientation)
  }

  const applyLaserTime = (value: any) => {
    const newLaserTimeMs = Math.min(laserTimeMax, Math.max(laserTimeMin, Number(value)))

    if (newLaserTimeMs === laserTimeMs) {
      return
    }

    setLaserTimeMs(newLaserTimeMs)
    window.electronAPI.setLaserTimeMs(newLaserTimeMs)
  }

  const applyFadeDisappearAfter = (value: any) => {
    const ms = Math.min(fadeDisappearAfterMax, Math.max(fadeDisappearAfterMin, Number(value)))

    if (ms === fadeDisappearAfterMs) {
      return
    }

    setFadeDisappearAfterMs(ms)
    window.electronAPI.setFadeDisappearAfterMs(ms)
  }

  const applyFadeOutDurationTimeMs = (value: any) => {
    const ms = Math.min(fadeOutDurationTimeMsMax, Math.max(fadeOutDurationTimeMsMin, Number(value)))

    if (ms === fadeOutDurationTimeMs) {
      return
    }

    setFadeOutDurationTimeMs(ms)
    window.electronAPI.setFadeOutDurationTimeMs(ms)
  }

  const nextMainColor = () => {
    const nextColor = (mainColor + 1) % colorList.length
    setMainColor(nextColor)

    window.electronAPI.setSwapColors([nextColor, secondaryColor])
  }

  const nextSecondaryColor = () => {
    const nextColor = (secondaryColor + 1) % colorList.length
    setSecondaryColor(nextColor)

    window.electronAPI.setSwapColors([mainColor, nextColor])
  }

  const selectDrawingMonitor = (event: any) => {
    const value = event.target.value
    let newMonitor = {
      mode: 'auto',
      display_id: null,
      label: null
    }

    const display = displays.find((display: Electron.Display) => display.id === value)
    if (display) {
      newMonitor = {
        mode: 'fixed',
        display_id: value,
        label: display.label
      }
    }

    setDrawingMonitor(newMonitor)
    window.electronAPI.setDrawingMonitor(newMonitor)
  }

  const resetScreenshotDirectory = async () => {
    const directory = await window.electronAPI.resetScreenshotDirectory()
    if (!directory) {
      return
    }

    const { path, isDefault } = directory
    setScreenshotDirectory({ path, isDefault })
  }

  const chooseScreenshotDirectory = async () => {
    const directory = await window.electronAPI.chooseScreenshotDirectory()
    if (!directory) {
      return
    }

    const { path, isDefault } = directory
    setScreenshotDirectory({ path, isDefault })
  }

  const openScreenshotDirectory = () => {
    window.electronAPI.openScreenshotDirectory()
  }

  const tabLabel = t(TABS.find((tab) => tab.id === activeTab)!.label)

  return (
    <div className="settings-window">
      {isMac && <header className="settings-titlebar">{tabLabel}</header>}

      <nav className="settings-toolbar" role="tablist" aria-label={t('settings.title')}>
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            className={`settings-toolbar-item ${activeTab === id ? 'selected' : ''}`}
            onClick={() => selectTab(id)}
          >
            <Icon size={22} strokeWidth={1.5} aria-hidden />
            <span>{t(label)}</span>
          </button>
        ))}
      </nav>

      <main className={`settings-scroll settings-scroll--${activeTab}`}>
        {activeTab === 'draw' && (
          <>
            <Group title={t('settings.tabShortcuts')}>
              <ShortcutRow
                title={t('settings.showHideApp')}
                description={t('settings.showHideAppDesc')}
                shortcut={showHideApp}
                onCheck={canRegisterShortcut}
                onChange={(acc: any) => applyShortcut('key_binding_show_hide_app', acc)}
                onReset={() => resetShortcut('key_binding_show_hide_app')}
                onRemove={() => removeShortcut('key_binding_show_hide_app')}
              />

              <ShortcutRow
                title={t('settings.showHideToolbar')}
                description={t('settings.showHideToolbarDesc')}
                shortcut={showHideToolbar}
                onCheck={canRegisterShortcut}
                onChange={(acc: any) => applyShortcut('key_binding_show_hide_toolbar', acc)}
                onReset={() => resetShortcut('key_binding_show_hide_toolbar')}
                onRemove={() => removeShortcut('key_binding_show_hide_toolbar')}
              />

              {HIDDEN_FEATURES && (
                <ShortcutRow
                  title={t('settings.showHideWhiteboard')}
                  description={t('settings.showHideWhiteboardDesc')}
                  shortcut={showHideWhiteboard}
                  onCheck={canRegisterShortcut}
                  onChange={(acc: any) => applyShortcut('key_binding_show_hide_whiteboard', acc)}
                  onReset={() => resetShortcut('key_binding_show_hide_whiteboard')}
                  onRemove={() => removeShortcut('key_binding_show_hide_whiteboard')}
                />
              )}

              <ShortcutRow
                title={t('settings.clearDesk')}
                description={t('settings.clearDeskDesc')}
                shortcut={clearDesk}
                onCheck={canRegisterShortcut}
                onChange={(acc: any) => applyShortcut('key_binding_clear_desk', acc)}
                onReset={() => resetShortcut('key_binding_clear_desk')}
                onRemove={() => removeShortcut('key_binding_clear_desk')}
              />

              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">{t('settings.colorSwap')}</div>
                  <div className="settings-item-description">{t('settings.colorSwapDesc')}</div>
                </div>

                <div className="settings-item-control">
                  <div className="color-swatches">
                    <button
                      type="button"
                      onClick={nextMainColor}
                      className={`color-swatch ${mainColorInfo.isRainbow ? 'color-rainbow' : ''}`}
                      style={{ backgroundColor: mainColorInfo.color }}
                      title={mainColorInfo.title}
                    />

                    <HiSwitchHorizontal className="icon icon--disabled" />

                    <button
                      type="button"
                      onClick={nextSecondaryColor}
                      className={`color-swatch ${secondaryColorInfo.isRainbow ? 'color-rainbow' : ''}`}
                      style={{ backgroundColor: secondaryColorInfo.color }}
                      title={secondaryColorInfo.title}
                    />
                  </div>
                </div>
              </div>
            </Group>

            <Group title={t('settings.tabAppearance')}>
              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">{t('settings.toolbarColors')}</div>
                </div>

                <div className="settings-item-control">
                  <ul className="toolbar-colors-control">
                    {toolbarColorIds.map((colorId) => {
                      const color = toolbarColorPalette[colorId]
                      const colorTitle = colorList.find(
                        (colorInfo) => colorInfo.id === colorId
                      )!.title
                      const isEditing = editingColorId === colorId

                      return (
                        <li
                          key={colorId}
                          className={`toolbar-color-slot-anchor ${isEditing ? 'active' : ''}`}
                        >
                          <button
                            type="button"
                            className="toolbar-color-slot"
                            style={{ backgroundColor: color }}
                            onClick={() => setEditingColorId(isEditing ? null : colorId)}
                            title={colorTitle}
                          />

                          {isEditing && (
                            <ColorPicker
                              initialColor={color}
                              onCancel={() => setEditingColorId(null)}
                              onSave={(nextColor: string) => saveToolbarColor(colorId, nextColor)}
                            />
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>

              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">{t('settings.hideBorder')}</div>
                </div>

                <div className="settings-item-control">
                  <div
                    className={`toggle ${showDrawingBorder ? '' : 'active'}`}
                    onClick={toggleDrawingBorder}
                  />
                </div>
              </div>

              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">{t('settings.cuteCursor')}</div>
                </div>

                <div className="settings-item-control">
                  <div className="selectbar-container">
                    <select
                      className="selectbar"
                      value={cuteCursorMode}
                      onChange={selectCuteCursorMode}
                    >
                      <option value="permanent">{t('settings.cursorPermanent')}</option>
                      <option value="fade">{t('settings.cursorFade')}</option>
                      <option value="dot">{t('settings.cursorDot')}</option>
                      <option value="hidden">{t('settings.cursorHidden')}</option>
                    </select>

                    <div className="selectbar-arrow">
                      <IoChevronDown className="icon" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">{t('settings.hideExtended')}</div>
                </div>

                <div className="settings-item-control">
                  <div
                    className={`toggle ${disableToolbarInPointerMode ? 'active' : ''}`}
                    onClick={toggleDisableToolbarInPointerMode}
                  />
                </div>
              </div>

              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">{t('settings.smooth')}</div>
                  <div className="settings-item-description">{t('settings.smoothDesc')}</div>
                </div>

                <div className="settings-item-control">
                  <div
                    className={`toggle ${penSmoothing ? 'active' : ''}`}
                    onClick={togglePenSmoothing}
                  />
                </div>
              </div>

              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">{t('settings.clearOnHide')}</div>
                </div>

                <div className="settings-item-control">
                  <div
                    className={`toggle ${clearDrawingsOnHide ? 'active' : ''}`}
                    onClick={toggleClearDrawingsOnHide}
                  />
                </div>
              </div>

              {HIDDEN_FEATURES && (
                <div className="settings-item">
                  <div className="settings-item-info">
                    <div className="settings-item-title">{t('settings.fadeDelay')}</div>
                    <div className="settings-item-description">{t('settings.fadeDelayDesc')}</div>
                  </div>

                  <div className="settings-item-control">
                    <div className="stepper-container">
                      <div
                        className="stepper-button"
                        onClick={() => applyFadeDisappearAfter(fadeDisappearAfterMs - timeStep)}
                      >
                        <FaMinus className="stepper-button--icon" />
                      </div>
                      <div className="stepper-value">{fadeDisappearAfterMs / 1000}s</div>
                      <div
                        className="stepper-button"
                        onClick={() => applyFadeDisappearAfter(fadeDisappearAfterMs + timeStep)}
                      >
                        <FaPlus className="stepper-button--icon" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {HIDDEN_FEATURES && (
                <div className="settings-item--nested">
                  <div className="settings-item">
                    <div className="settings-item--forward">
                      <IoChevronForward className="icon" />
                    </div>

                    <div className="settings-item-info">
                      <div className="settings-item-title">{t('settings.fadeDuration')}</div>
                      <div className="settings-item-description">
                        {t('settings.fadeDurationDesc')}
                      </div>
                    </div>

                    <div className="settings-item-control">
                      <div className="stepper-container">
                        <div
                          className="stepper-button"
                          onClick={() =>
                            applyFadeOutDurationTimeMs(fadeOutDurationTimeMs - timeStep)
                          }
                        >
                          <FaMinus className="stepper-button--icon" />
                        </div>
                        <div className="stepper-value">{fadeOutDurationTimeMs / 1000}s</div>
                        <div
                          className="stepper-button"
                          onClick={() =>
                            applyFadeOutDurationTimeMs(fadeOutDurationTimeMs + timeStep)
                          }
                        >
                          <FaPlus className="stepper-button--icon" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {HIDDEN_FEATURES && (
                <div className="settings-item">
                  <div className="settings-item-info">
                    <div className="settings-item-title">{t('settings.laserDuration')}</div>
                    <div className="settings-item-description">
                      {t('settings.laserDurationDesc')}
                    </div>
                  </div>

                  <div className="settings-item-control">
                    <div className="stepper-container">
                      <div
                        className="stepper-button"
                        onClick={() => applyLaserTime(laserTimeMs - timeStep)}
                      >
                        <FaMinus className="stepper-button--icon" />
                      </div>
                      <div className="stepper-value">{laserTimeMs / 1000}s</div>
                      <div
                        className="stepper-button"
                        onClick={() => applyLaserTime(laserTimeMs + timeStep)}
                      >
                        <FaPlus className="stepper-button--icon" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Group>
          </>
        )}

        {activeTab === 'general' && (
          <>
            <Group title={t('settings.groupBehavior')}>
              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">{t('settings.launchOnLogin')}</div>
                </div>

                <div className="settings-item-control">
                  <div
                    className={`toggle ${launchOnLogin ? 'active' : ''}`}
                    onClick={toggleLaunch}
                  />
                </div>
              </div>

              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">{t('settings.autoUpdate')}</div>
                </div>

                <div className="settings-item-control">
                  <button className="button" onClick={checkUpdate}>
                    {t('settings.checkUpdate')}
                  </button>
                  <div
                    className={`toggle ${autoCheckUpdates ? 'active' : ''}`}
                    onClick={toggleAutoCheckUpdates}
                  />
                </div>
              </div>

              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">{t('settings.showTrayIcon')}</div>
                </div>

                <div className="settings-item-control">
                  <div
                    className={`toggle ${showTrayIcon ? 'active' : ''}`}
                    onClick={toggleShowTrayIcon}
                  />
                </div>
              </div>
            </Group>

            <Group title="Draw">
              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">{t('settings.lockMonitor')}</div>
                </div>

                <div className="settings-item-control">
                  <div className="selectbar-container">
                    <select
                      className="selectbar"
                      value={drawingMonitor.display_id || 'auto'}
                      onChange={selectDrawingMonitor}
                    >
                      <option value="auto">{t('settings.monitorAuto')}</option>
                      {displays.map((display: Electron.Display) => (
                        <option key={display.id} value={display.id}>
                          {display.label}
                        </option>
                      ))}

                      {drawingMonitor.mode === 'fixed' &&
                        !displays.find(
                          (display: Electron.Display) => display.id === drawingMonitor.display_id
                        ) && (
                          <option disabled value={drawingMonitor.display_id}>
                            {drawingMonitor.label} ({t('settings.disconnected')})
                          </option>
                        )}
                    </select>

                    <div className="selectbar-arrow">
                      <IoChevronDown className="icon" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">{t('settings.startsHidden')}</div>
                </div>

                <div className="settings-item-control">
                  <div
                    className={`toggle ${startsHidden ? 'active' : ''}`}
                    onClick={toggleStartsHidden}
                  />
                </div>
              </div>

              {HIDDEN_FEATURES && (
                <div className="settings-item">
                  <div className="settings-item-info">
                    <div className="settings-item-title">{t('settings.appIconColor')}</div>
                  </div>

                  <div className="settings-item-control">
                    <div className="selectbar-container">
                      <select
                        className="selectbar"
                        value={appIconColor}
                        onChange={selectAppIconColor}
                      >
                        <option value="default">{t('settings.iconDefault')}</option>
                        <option value="white">{t('settings.iconWhite')}</option>
                        <option value="black">{t('settings.iconBlack')}</option>
                      </select>

                      <div className="selectbar-arrow">
                        <IoChevronDown className="icon" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {HIDDEN_FEATURES && (
                <div className="settings-item">
                  <div className="settings-item-info">
                    <div className="settings-item-title">{t('settings.orientation')}</div>
                  </div>

                  <div className="settings-item-control">
                    <div className="selectbar-container">
                      <select
                        className="selectbar"
                        value={toolbarOrientation}
                        onChange={selectToolbarOrientation}
                      >
                        <option value="horizontal">{t('settings.horizontal')}</option>
                        <option value="vertical">{t('settings.vertical')}</option>
                      </select>

                      <div className="selectbar-arrow">
                        <IoChevronDown className="icon" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {HIDDEN_FEATURES && (
                <div className="settings-item">
                  <div className="settings-item-info">
                    <div className="settings-item-title">{t('settings.saveShots')}</div>
                    <div className="settings-item-description" title={screenshotDirectory.path}>
                      {screenshotDirectory.path}
                    </div>
                  </div>

                  <div className="settings-item-control">
                    {!screenshotDirectory.isDefault && (
                      <IoRefreshCircleOutline
                        className="icon"
                        title={t('settings.resetDefault')}
                        onClick={resetScreenshotDirectory}
                      />
                    )}
                    <div className="buttons-group">
                      <button className="button" onClick={openScreenshotDirectory}>
                        {t('settings.open')}
                      </button>
                      <button className="button" onClick={chooseScreenshotDirectory}>
                        {t('settings.choose')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">{t('settings.resetAll')}</div>
                </div>

                <div className="settings-item-control">
                  <button className="button" onClick={resetToOriginals}>
                    {t('settings.resetAllButton')}
                  </button>
                </div>
              </div>
            </Group>
          </>
        )}

        {activeTab === 'account' && <AccountTab />}

        {activeTab === 'about' && <AboutTab />}
      </main>

      {confirmHideTray && (
        <HideTrayAlert
          onCancel={() => setConfirmHideTray(false)}
          onConfirm={() => void applyShowTrayIcon(false)}
        />
      )}
    </div>
  )
}

export default Settings
