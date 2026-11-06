import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

const api = {
  locale: ipcRenderer.sendSync('get_locale'),
  updateOffer: () => ipcRenderer.invoke('update_offer'),
  answerUpdate: (answer: string) => ipcRenderer.invoke('update_answer', answer),
  onUpdateOffer: (callback: (...args: any[]) => any) => {
    const listener = (_event: IpcRendererEvent, offer: any) => callback(offer);
    ipcRenderer.on('update_offer_changed', listener);
    return () => ipcRenderer.off('update_offer_changed', listener);
  },
  fitHeight: (height: number) => ipcRenderer.invoke('fit_window_height', height),
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type UpdateApi = typeof api;
