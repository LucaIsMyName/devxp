import { ipcMain, dialog } from 'electron';

const registerFileHandlers = () => {
  ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Database Files', extensions: ['db', 'sqlite', 'sqlite3', 'sql'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    return result;
  });
};

module.exports = { registerFileHandlers };