import { app, BrowserWindow } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import isDev from 'electron-is-dev'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
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

app.whenReady().then(createWindow)

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