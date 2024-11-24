import { contextBridge, ipcRenderer } from 'electron';
const fs = require('fs').promises;

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: async (filePath) => {
    try {
      const buffer = await fs.readFile(filePath);
      return buffer.buffer; // Convert Buffer to ArrayBuffer
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  },
  showOpenDialog: async (options) => {
    return ipcRenderer.invoke('dialog:showOpenDialog', options);
  }
});