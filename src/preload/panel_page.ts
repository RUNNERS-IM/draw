import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  locale: ipcRenderer.sendSync('get_locale'),
  getPanelState: () => ipcRenderer.invoke('panel_state'),
  panelAction: (name) => ipcRenderer.invoke('panel_action', name),
  setLaunchOnLogin: (value) => ipcRenderer.invoke('set_launch_on_login', value),
  setAutoCheckUpdates: (value) => ipcRenderer.invoke('set_auto_check_updates', value),
  fitHeight: (height) => ipcRenderer.invoke('fit_window_height', height),
  onPanelState: (callback) => {
    ipcRenderer.on('panel_state_changed', (_event, state) => callback(state));
  },
});
