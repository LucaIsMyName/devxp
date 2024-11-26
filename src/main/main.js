import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import isDev from 'electron-is-dev'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    // titleBarStyle: "hidden", // Creates a modern hidden title bar with traffic lights
    // vibrancy: 'light',
    // visualEffectState: 'active', // Controls when vibrancy effect is applied
    // backgroundColor: '#00000000', // T
    // transparent: true,
    // frame: false, // Remove default window frame
    // trafficLightPosition: { x: 20, y: 20 }, // Posit
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true,
      contextIsolation: false,

    }
  });

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    },
  })

  if (isDev) {
    // In development, try port 5174 first (Vite's fallback port)
    try {
      await mainWindow.loadURL('http://localhost:5174')
      mainWindow.webContents.openDevTools()
    } catch (e) {
      console.error('Failed to load on port 5174, trying 5173...', e)
      try {
        await mainWindow.loadURL('http://localhost:5173')
        mainWindow.webContents.openDevTools()
      } catch (e) {
        console.error('Failed to load development server', e)
      }
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.commandLine.appendSwitch('enable-features', 'WebviewTag');
app.whenReady().then(createWindow)

ipcMain.handle('dialog:showOpenDialog', async (event, options) => {
  const result = await dialog.showOpenDialog(options);
  return result;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})