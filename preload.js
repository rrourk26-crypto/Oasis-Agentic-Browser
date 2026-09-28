const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("oasisElectron", {
  captureBrowser: () => ipcRenderer.invoke("capture-browser"),
  captureWebView: (id) => ipcRenderer.invoke("capture-webview", id),
  captureSource: () => ipcRenderer.invoke("capture-source"),
  onOpenInTab: (callback) => ipcRenderer.on("oasis-open-in-tab", (_event, url) => callback(url)),
  onContextNav: (callback) => ipcRenderer.on("oasis-context-nav", (_event, action) => callback(action)),
  toggleFullscreen: () => ipcRenderer.invoke("toggle-fullscreen"),
  openDownloadsFolder: () => ipcRenderer.invoke("open-downloads-folder"),
  openPath: (path) => ipcRenderer.invoke("open-path", path),
  showItemInFolder: (path) => ipcRenderer.invoke("show-item-in-folder", path),
  showAbout: () => ipcRenderer.invoke("show-about"),
  newWindow: () => ipcRenderer.invoke("new-window"),
  newPrivateWindow: () => ipcRenderer.invoke("new-private-window"),
  closeWindow: () => ipcRenderer.invoke("close-window"),
  clearBrowsingData: (partition, opts) => ipcRenderer.invoke("clear-browsing-data", partition, opts),
  onDownloadUpdate: (callback) => ipcRenderer.on("oasis-download-update", (_event, data) => callback(data))
});
