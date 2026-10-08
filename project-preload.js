// Loaded into browser tabs. Exposes the project-folder bridge ONLY to this app's own local pages
// (file://), never to websites you browse in other tabs.
const { contextBridge, ipcRenderer } = require("electron");
if (location.protocol === "file:") {
  contextBridge.exposeInMainWorld("oasisProject", {
    projectPick: () => ipcRenderer.invoke("project-pick"),
    projectOpen: (root) => ipcRenderer.invoke("project-open", root),
    projectRead: (rel) => ipcRenderer.invoke("project-read", rel),
    projectReadBin: (rel) => ipcRenderer.invoke("project-read-bin", rel),
    projectWrite: (rel, content) => ipcRenderer.invoke("project-write", rel, content),
    projectDelete: (rel) => ipcRenderer.invoke("project-delete", rel),
    // Ask the browser shell to open a link as a new tab. Works even when the
    // request comes from the AI after a reply finishes (no fresh click).
    openTab: (url) => {
      try { ipcRenderer.sendToHost("oasis-open-tab", String(url)); } catch (e) {}      // inside a browser tab
      try { ipcRenderer.send("oasis-open-tab-fallback", String(url)); } catch (e) {}   // inside a popped-out window
    },
    // Running commands: only the Home page itself is allowed to use these (main.js checks again).
    platform: process.platform,
    projectRun: (req) => ipcRenderer.invoke("project-run", req),
    projectRunCancel: (id) => ipcRenderer.invoke("project-run-cancel", id),
    terminalOpen: (req) => ipcRenderer.invoke("terminal-open", req),
    // Native Windows apps/utilities by registry id (see js/windows-apps.js). Home page only (main.js checks again).
    winLaunch: (req) => ipcRenderer.invoke("win-launch", req)
  });
}
