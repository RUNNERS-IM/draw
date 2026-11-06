import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pencil, MousePointer2, PanelLeft, Trash2, LogIn, RefreshCw, Info, Download, Settings, CircleHelp, Power } from 'lucide-react';
import { MenuHead, MenuItem, MenuSeparator, MenuSwitch } from '../../runners-account/runners-menu';
import { t } from '../../shared/i18n';
import './panel.css';

const icon = (Icon) => <Icon strokeWidth={1.5} />;
const api = window.electronAPI;

// 메뉴 막대 아이콘을 누르면 뜨는 패널. 줄 값은 runners-menu.css(글자 13 · 줄 32 · 폭 300)를 그대로 쓴다.
const Panel = () => {
  const [state, setState] = useState(null);
  const root = useRef(null);

  useEffect(() => {
    api.getPanelState().then(setState);
    api.onPanelState(setState);
  }, []);

  useEffect(() => {
    const node = root.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(() => api.fitHeight(Math.ceil(node.getBoundingClientRect().height)));
    observer.observe(node);
    return () => observer.disconnect();
  });

  if (!state) return null;

  const run = (name) => () => api.panelAction(name);

  return (
    <main className="panel" ref={root}>
      <MenuHead name="Draw" sub={state.version} />
      <MenuSwitch
        icon={icon(LogIn)}
        label={t('panel.login')}
        checked={state.launchOnLogin}
        onChange={(value) => { setState({ ...state, launchOnLogin: value }); api.setLaunchOnLogin(value); }}
      />
      <MenuSwitch
        icon={icon(RefreshCw)}
        label={t('panel.autoUpdate')}
        checked={state.autoCheckUpdates}
        onChange={(value) => { setState({ ...state, autoCheckUpdates: value }); api.setAutoCheckUpdates(value); }}
      />
      <MenuSeparator />
      <div className="panel-status">
        <span className={`panel-dot${state.drawing ? ' on' : ''}`} />
        {state.drawing ? t('panel.statusDrawing') : t('panel.statusPointer')}
      </div>
      <MenuSeparator />
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
      <MenuItem icon={icon(Trash2)} label={t('panel.clear')} trailing={state.keys.clear} onSelect={run('clear')} />
      <MenuSeparator />
      <MenuItem icon={icon(Info)} label={t('panel.about')} onSelect={run('about')} />
      <MenuItem icon={icon(Download)} label={t('panel.checkUpdate')} onSelect={run('check_update')} />
      <MenuItem icon={icon(Settings)} label={t('panel.settings')} trailing={state.keys.settings} onSelect={run('settings')} />
      <MenuItem icon={icon(CircleHelp)} label={t('panel.help')} onSelect={run('help')} />
      <MenuSeparator />
      <MenuItem icon={icon(Power)} label={t('panel.quit')} trailing={state.keys.quit} onSelect={run('quit')} />
    </main>
  );
};

createRoot(document.getElementById('root')).render(<Panel />);
