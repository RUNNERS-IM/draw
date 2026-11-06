import { contextBridge, ipcRenderer } from 'electron'

const api = {
  locale: ipcRenderer.sendSync('get_locale'),
  getVersion: () => ipcRenderer.invoke('get_app_version'),
  openExternal: (url: string) => ipcRenderer.invoke('open_external', url),
  fitHeight: (height: number) => ipcRenderer.invoke('fit_window_height', height),
  closeWindow: () => ipcRenderer.invoke('close_window')
}

contextBridge.exposeInMainWorld('electronAPI', api)

export type AboutApi = typeof api
