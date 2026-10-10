const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
let dashboard, buddyWindow;
function createDashboard() {
  if (dashboard && !dashboard.isDestroyed()) { dashboard.show(); dashboard.focus(); return; }
  dashboard = new BrowserWindow({ width: 1120, height: 820, minWidth: 850, minHeight: 650, title: 'Focus Friend', backgroundColor: '#f7f4ff', show: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false } });
  dashboard.loadFile('index.html');
  dashboard.on('closed', () => { dashboard = null; });
}
function createBuddy() {
  const display = screen.getPrimaryDisplay().workArea;
  buddyWindow = new BrowserWindow({ width: 150, height: 160,
    x: display.x + 18, y: display.y + display.height - 178,
    frame: false, transparent: true, backgroundColor: '#00000000', resizable: false,
    alwaysOnTop: true, skipTaskbar: true, hasShadow: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false } });
  buddyWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  buddyWindow.loadFile('buddy.html');
}
app.whenReady().then(() => { createBuddy(); app.on('activate', () => { if (!buddyWindow || buddyWindow.isDestroyed()) createBuddy(); }); });
ipcMain.on('buddy:update', (_event, data) => { if (buddyWindow && !buddyWindow.isDestroyed()) buddyWindow.webContents.send('buddy:state', data); });
ipcMain.on('buddy:open-dashboard', () => createDashboard());
ipcMain.on('buddy:close', () => { if (buddyWindow && !buddyWindow.isDestroyed()) buddyWindow.hide(); });
ipcMain.on('buddy:move', (_event, { x, y }) => { if (buddyWindow && !buddyWindow.isDestroyed()) buddyWindow.setPosition(Math.round(x), Math.round(y)); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
