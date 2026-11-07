import type { ComponentType } from 'react'
import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Pencil, MousePointer2, PanelLeft, Trash2, Settings, CircleHelp, Power } from 'lucide-react'
import { MenuHead, MenuItem, MenuSeparator } from '../../runners-account/runners-menu'
import { useTranslation } from 'react-i18next'
import './panel.css'
import { applyTextDirection } from '../i18n'

applyTextDirection()

const icon = (Icon: ComponentType<any>) => <Icon strokeWidth={1.5} />
const api = window.electronAPI

// 메뉴 막대 아이콘을 누르면 뜨는 패널. 줄 값은 runners-menu.css(글자 13 · 줄 32 · 폭 300)를 그대로 쓴다.
// 맨 위는 그리기 시작 · 끝내기, 켬/끔 스위치는 설정 › 일반에만 둔다(2026-11-08 창 통일 2A).
const Panel = () => {
  const { t } = useTranslation()
  const [state, setState] = useState<any>(null)
  const root = useRef<any>(null)

  useEffect(() => {
    api.getPanelState().then(setState)
    api.onPanelState(setState)
  }, [])

  useEffect(() => {
    const node = root.current
    if (!node) {
      return undefined
    }
    const observer = new ResizeObserver(() =>
      api.fitHeight(Math.ceil(node.getBoundingClientRect().height))
    )
    observer.observe(node)
    return () => observer.disconnect()
  })

  if (!state) {
    return null
  }

  const run = (name: string) => () => api.panelAction(name)

  return (
    <main className="panel" ref={root}>
      <MenuHead name="Draw" sub={state.version} />
      <MenuItem
        icon={state.drawing ? icon(MousePointer2) : icon(Pencil)}
        label={state.drawing ? t('panel.stopDrawing') : t('panel.startDrawing')}
        trailing={state.keys.draw}
        onSelect={run('toggle_draw')}
      />
      <MenuItem
        icon={icon(PanelLeft)}
        label={state.showToolbar ? t('panel.hideToolbar') : t('panel.showToolbar')}
        trailing={state.keys.toolbar}
        onSelect={run('toggle_toolbar')}
      />
      <MenuItem
        icon={icon(Trash2)}
        label={t('panel.clear')}
        trailing={state.keys.clear}
        onSelect={run('clear')}
      />
      <MenuSeparator />
      <MenuItem
        icon={icon(Settings)}
        label={t('panel.settings')}
        trailing={state.keys.settings}
        onSelect={run('settings')}
      />
      <MenuItem icon={icon(CircleHelp)} label={t('panel.help')} onSelect={run('help')} />
      <MenuSeparator />
      <MenuItem
        icon={icon(Power)}
        label={t('panel.quit')}
        trailing={state.keys.quit}
        onSelect={run('quit')}
      />
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<Panel />)
