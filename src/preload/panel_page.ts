import { contextBridge, ipcRenderer } from 'electron'

const api = {
  locale: ipcRenderer.sendSync('get_locale'),
  getPanelState: () => ipcRenderer.invoke('panel_state'),
  panelAction: (name: string) => ipcRenderer.invoke('panel_action', name),
  fitHeight: (height: number) => ipcRenderer.invoke('fit_window_height', height),
  onPanelState: (callback: (...args: any[]) => any) => {
    ipcRenderer.on('panel_state_changed', (_event, state) => callback(state))
  }
}

contextBridge.exposeInMainWorld('electronAPI', api)

export type PanelApi = typeof api
