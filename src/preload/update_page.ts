import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  locale: ipcRenderer.sendSync('get_locale'),
  updateOffer: () => ipcRenderer.invoke('update_offer'),
  answerUpdate: (answer) => ipcRenderer.invoke('update_answer', answer),
  onUpdateOffer: (callback) => {
    const listener = (_event, offer) => callback(offer);
    ipcRenderer.on('update_offer_changed', listener);
    return () => ipcRenderer.off('update_offer_changed', listener);
  },
  fitHeight: (height) => ipcRenderer.invoke('fit_window_height', height),
});
