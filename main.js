const { app, BrowserWindow, ipcMain, session, desktopCapturer, Menu, clipboard, shell, dialog } = require("electron");
const path = require("path");
const crypto = require("crypto");

// Electron ships with NO default right-click menu at all (in the main window
// chrome or inside <webview> guest pages), so we build a normal one by hand.
// pageContext=true means "contents" is an actual page (a webview guest, or
// the shell itself navigating) so page-level items (back/forward/reload,
// open link/image in a new tab) make sense; pageContext=false is used for
// the app's own chrome (address bar, AI panel, tab strip) where only text
// editing items make sense — the tab strip's own right-click menu is built
// entirely in the renderer (browser.html) instead.
function showContextMenu(ownerWin, contents, params, pageContext) {
  const hasSelection = Boolean(params.selectionText && params.selectionText.trim().length);
  const isLink = Boolean(params.linkURL);
  const isImage = params.mediaType === "image";
  const flags = params.editFlags || {};
  const template = [];

  if (params.isEditable) {
    template.push(
      { label: "Undo", role: "undo", enabled: !!flags.canUndo },
      { label: "Redo", role: "redo", enabled: !!flags.canRedo },
      { type: "separator" },
      { label: "Cut", role: "cut", enabled: !!flags.canCut },
      { label: "Copy", role: "copy", enabled: !!flags.canCopy },
      { label: "Paste", role: "paste", enabled: !!flags.canPaste },
      { label: "Select All", role: "selectAll", enabled: !!flags.canSelectAll }
    );
  } else if (hasSelection) {
    template.push(
      { label: "Copy", click: () => clipboard.writeText(params.selectionText) },
      { label: "Select All", click: () => contents.selectAll() }
    );
  }

  if (pageContext && isLink) {
    if (template.length) template.push({ type: "separator" });
    template.push(
      { label: "Open Link in New Tab", click: () => ownerWin && !ownerWin.isDestroyed() && ownerWin.webContents.send("oasis-open-in-tab", params.linkURL) },
      { label: "Copy Link Address", click: () => clipboard.writeText(params.linkURL) }
    );
  }

  if (pageContext && isImage) {
    if (template.length) template.push({ type: "separator" });
    template.push(
      { label: "Open Image in New Tab", click: () => ownerWin && !ownerWin.isDestroyed() && ownerWin.webContents.send("oasis-open-in-tab", params.srcURL) },
      { label: "Copy Image", click: () => { try { contents.copyImageAt(params.x, params.y); } catch (e) {} } },
      { label: "Copy Image Address", click: () => clipboard.writeText(params.srcURL) },
      { label: "Save Image As…", click: () => { try { contents.downloadURL(params.srcURL); } catch (e) {} } }
    );
  }

  if (pageContext && !template.length) {
    template.push(
      { label: "Back", click: () => ownerWin && !ownerWin.isDestroyed() && ownerWin.webContents.send("oasis-context-nav", "back") },
      { label: "Forward", click: () => ownerWin && !ownerWin.isDestroyed() && ownerWin.webContents.send("oasis-context-nav", "forward") },
      { label: "Reload", click: () => ownerWin && !ownerWin.isDestroyed() && ownerWin.webContents.send("oasis-context-nav", "reload") },
      { type: "separator" },
      { label: "Copy Page URL", click: () => clipboard.writeText(contents.getURL ? contents.getURL() : "") }
    );
  }

  if (!template.length) return;

  template.push({ type: "separator" }, { label: "Inspect", click: () => { try { contents.inspectElement(params.x, params.y); } catch (e) {} } });

  Menu.buildFromTemplate(template).popup({ window: ownerWin || undefined });
}

// Every session partition we hand out (the shared persistent one, plus one
// fresh in-memory partition per InPrivate window) gets its own download
// listener so the Downloads panel in whichever window owns that partition
// hears about it.
const trackedPartitions = new Set();
function wireDownloadsForPartition(partitionName, ownerWin) {
  if (trackedPartitions.has(partitionName)) return;
  trackedPartitions.add(partitionName);
  const ses = session.fromPartition(partitionName);
  ses.on("will-download", (_event, item) => {
    const id = crypto.randomUUID();
    const send = (payload) => {
      if (ownerWin && !ownerWin.isDestroyed()) ownerWin.webContents.send("oasis-download-update", { id, ...payload });
    };
    try { item.setSaveDialogOptions({ defaultPath: item.getFilename() }); } catch (e) {}
    send({ filename: item.getFilename(), url: item.getURL(), state: "progressing", receivedBytes: 0, totalBytes: item.getTotalBytes() });
    item.on("updated", (_e, state) => {
      send({ filename: item.getFilename(), url: item.getURL(), state, receivedBytes: item.getReceivedBytes(), totalBytes: item.getTotalBytes() });
    });
    item.once("done", (_e, state) => {
      send({ filename: item.getFilename(), url: item.getURL(), state, path: item.getSavePath(), receivedBytes: item.getReceivedBytes(), totalBytes: item.getTotalBytes() });
    });
  });
}

function createWindow(opts = {}) {
  const isPrivate = Boolean(opts.isPrivate);
  const partition = isPrivate ? "oasis-private-" + crypto.randomBytes(4).toString("hex") : "persist:oasis";

  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 980,
    minHeight: 620,
    backgroundColor: isPrivate ? "#120a1c" : "#090c12",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true
    }
  });

  wireDownloadsForPartition(partition, win);

  win.loadFile(path.join(__dirname, "browser.html"), { query: { partition, private: isPrivate ? "1" : "0" } });

  win.webContents.on("context-menu", (_event, params) => showContextMenu(win, win.webContents, params, false));

  // Electron no longer supports the <webview> "new-window" DOM event, so any
  // link/window.open inside a webview (YouTube, search results, etc.) falls
  // back to Electron's own default: a brand new OS-level window. Intercept it
  // at the webContents level for every webview that attaches to this window,
  // deny the popup, and tell the renderer to open it as a tab instead.
  win.webContents.on("did-attach-webview", (_event, contents) => {
    contents.setWindowOpenHandler((details) => {
      if (win && !win.isDestroyed()) win.webContents.send("oasis-open-in-tab", details.url);
      return { action: "deny" };
    });

    // Right-click menu (Copy/Paste, Copy Link, Save Image, Back/Forward…)
    // for the actual page content loaded inside every tab.
    contents.on("context-menu", (_e, params) => showContextMenu(win, contents, params, true));
  });

  return win;
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ["media", "geolocation", "notifications", "fullscreen", "clipboard-read", "clipboard-sanitized-write"];
    callback(allowed.includes(permission));
  });

  ipcMain.handle("capture-browser", async (event) => {
    const w = BrowserWindow.fromWebContents(event.sender);
    if (!w) return null;
    const image = await w.webContents.capturePage();
    return image.toDataURL();
  });

  ipcMain.handle("capture-webview", async (_event, webContentsId) => {
    try {
      const wc = require("electron").webContents.fromId(Number(webContentsId));
      if (!wc) return null;
      const image = await wc.capturePage();
      return image.toDataURL();
    } catch (e) { return null; }
  });

  ipcMain.handle("capture-source", async () => {
    const sources = await desktopCapturer.getSources({ types: ["screen", "window"] });
    const source = sources.find(s => s.name === "Oasis AI Workspace") || sources[0];
    return source ? { id: source.id, name: source.name } : null;
  });

  ipcMain.handle("toggle-fullscreen", (event) => {
    const w = BrowserWindow.fromWebContents(event.sender);
    if (!w) return false;
    w.setFullScreen(!w.isFullScreen());
    return w.isFullScreen();
  });

  ipcMain.handle("open-downloads-folder", () => shell.openPath(app.getPath("downloads")));
  ipcMain.handle("open-path", (_event, targetPath) => shell.openPath(targetPath));
  ipcMain.handle("show-item-in-folder", (_event, targetPath) => { try { shell.showItemInFolder(targetPath); return true; } catch (e) { return false; } });

  ipcMain.handle("new-window", () => { createWindow({ isPrivate: false }); return true; });
  ipcMain.handle("new-private-window", () => { createWindow({ isPrivate: true }); return true; });
  ipcMain.handle("close-window", (event) => { const w = BrowserWindow.fromWebContents(event.sender); if (w) w.close(); return true; });

  ipcMain.handle("clear-browsing-data", async (_event, partitionName, opts = {}) => {
    try {
      const ses = session.fromPartition(partitionName || "persist:oasis");
      if (opts.cache !== false) await ses.clearCache();
      const dataTypes = [];
      if (opts.cookies !== false) dataTypes.push("cookies", "localstorage", "serviceworkers", "cachestorage", "indexdb", "websql", "shadercache");
      if (dataTypes.length) await ses.clearStorageData({ storages: dataTypes });
      return true;
    } catch (e) { return false; }
  });

  ipcMain.handle("show-about", (event) => {
    const w = BrowserWindow.fromWebContents(event.sender);
    if (!w) return;
    dialog.showMessageBox(w, {
      type: "info",
      title: "About Oasis",
      message: "Oasis AI Workspace",
      detail:
        "Created by Merlin.\n\n" +
        "A free, local-first AI workspace — your chats, tabs, and data stay on this device.\n\n" +
        "Free to use. Free to modify.\n\n" +
        "Questions, comments, or feedback? Visit Oasis, our community and support hub, from the Tools menu.\n\n" +
        `Version ${app.getVersion()}`
    });
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
