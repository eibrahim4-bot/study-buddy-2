const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('focusFriend', {
  updateBuddy: (state) => ipcRenderer.send('buddy:update', state),
  openDashboard: () => ipcRenderer.send('buddy:open-dashboard'),
  closeBuddy: () => ipcRenderer.send('buddy:close'),
  onBuddyState: (callback) => ipcRenderer.on('buddy:state', (_event, state) => callback(state))
});
