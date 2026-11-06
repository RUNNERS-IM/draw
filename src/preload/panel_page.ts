import { contextBridge, ipcRenderer } from 'electron';

const api = {
  locale: ipcRenderer.sendSync('get_locale'),
  getPanelState: () => ipcRenderer.invoke('panel_state'),
  panelAction: (name: string) => ipcRenderer.invoke('panel_action', name),
  setLaunchOnLogin: (value: unknown) => ipcRenderer.invoke('set_launch_on_login', value),
  setAutoCheckUpdates: (value: unknown) => ipcRenderer.invoke('set_auto_check_updates', value),
  fitHeight: (height: number) => ipcRenderer.invoke('fit_window_height', height),
  onPanelState: (callback: (...args: any[]) => any) => {
    ipcRenderer.on('panel_state_changed', (_event, state) => callback(state));
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type PanelApi = typeof api;
