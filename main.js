const { app, BrowserWindow, ipcMain, session, desktopCapturer, Menu, clipboard, shell, dialog, screen } = require("electron");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const { spawn, execFile } = require("child_process");
const { fileURLToPath } = require("url");
const winLauncher = require("./windows-launcher.js");

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

  if (params.isEditable && params.misspelledWord) {
    const sugg = (params.dictionarySuggestions || []).slice(0, 6);
    sugg.forEach((w) => template.push({ label: w, click: () => { try { contents.replaceMisspelling(w); } catch (e) {} } }));
    if (!sugg.length) template.push({ label: "No spelling suggestions", enabled: false });
    template.push(
      { label: "Add \"" + params.misspelledWord + "\" to dictionary", click: () => { try { contents.session.addWordToSpellCheckerDictionary(params.misspelledWord); } catch (e) {} } },
      { type: "separator" }
    );
  }
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

// ---- Pop-out windows: a tab dragged off the tab strip becomes its own window ----
// Same session partition as the browser, so chats, settings and logins carry over.
function allowedPopupUrl(url) {
  if (/^https?:\/\//i.test(url)) return true;
  try {
    if (!/^file:/i.test(url)) return false;
    const u = new URL(url); u.search = ""; u.hash = "";
    const p = path.resolve(fileURLToPath(u));
    return p.toLowerCase().startsWith(path.resolve(__dirname).toLowerCase() + path.sep);
  } catch (e) { return false; }
}
function allowedPartition(p) { return p === "persist:oasis" || /^oasis-private-[0-9a-f]+$/.test(p); }
function openPopupWindow(url, partition, pos) {
  if (!allowedPopupUrl(url) || !allowedPartition(partition)) return null;
  const opts = {
    width: 1100, height: 760, minWidth: 420, minHeight: 320, autoHideMenuBar: true,
    backgroundColor: "#090c12", title: (pos && pos.title) || "Oasis",
    webPreferences: { partition, preload: path.join(__dirname, "project-preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true }
  };
  if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
    try {
      const d = screen.getDisplayNearestPoint({ x: Math.round(pos.x), y: Math.round(pos.y) }).workArea;
      opts.x = Math.max(d.x, Math.min(Math.round(pos.x) - 120, d.x + d.width - 300));
      opts.y = Math.max(d.y, Math.min(Math.round(pos.y) - 20, d.y + d.height - 200));
    } catch (e) {}
  }
  const win = new BrowserWindow(opts);
  win.__oasisPopupPartition = partition;
  win.setMenu(null);
  win.webContents.setWindowOpenHandler((d) => { openPopupWindow(d.url, partition, null); return { action: "deny" }; });
  win.webContents.on("context-menu", (_e, params) => showContextMenu(win, win.webContents, params, false));
  win.loadURL(url);
  return win;
}
function setupSpellcheck(partition) {
  try {
    const ses = session.fromPartition(partition);
    ses.setSpellCheckerEnabled(true);
    const avail = ses.availableSpellCheckerLanguages || [];
    const loc = app.getLocale();
    const pick = avail.includes(loc) ? loc : (avail.includes("en-US") ? "en-US" : null);
    if (pick) ses.setSpellCheckerLanguages([pick]);
  } catch (e) {}
}

// ---- Screen sharing. Electron has no built-in "choose a screen" dialog, so without this handler every
// getDisplayMedia() call (the screen button, or a website asking to share) fails with "Not supported".
// The person always picks what to share in our own small dialog; nothing is ever captured silently.
let capturePickerOpen = null;
function pickCaptureSource(parent, sources) {
  return new Promise((resolve) => {
    // Already choosing? Bring that dialog forward instead of stacking a second one.
    if (capturePickerOpen && !capturePickerOpen.isDestroyed()) { try { capturePickerOpen.focus(); } catch (e) {} return resolve(null); }
    const dlg = new BrowserWindow({
      width: 780, height: 580, minWidth: 520, minHeight: 380, parent: parent || undefined, modal: Boolean(parent),
      autoHideMenuBar: true, backgroundColor: "#0b101c", title: "Share your screen", minimizable: false, maximizable: false,
      webPreferences: { preload: path.join(__dirname, "picker-preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true }
    });
    dlg.setMenu(null);
    capturePickerOpen = dlg;
    let settled = false;
    const finish = (value) => {
      if (settled) return; settled = true;
      if (capturePickerOpen === dlg) capturePickerOpen = null;
      ipcMain.removeListener("picker-choose", onChoose); ipcMain.removeListener("picker-cancel", onCancel);
      try { if (!dlg.isDestroyed()) dlg.destroy(); } catch (e) {}
      resolve(value);
    };
    const mine = (e) => !dlg.isDestroyed() && e.sender === dlg.webContents;
    const onChoose = (e, id) => { if (mine(e)) finish(sources.find((s) => s.id === id) || null); };
    const onCancel = (e) => { if (mine(e)) finish(null); };
    ipcMain.on("picker-choose", onChoose); ipcMain.on("picker-cancel", onCancel);
    dlg.on("closed", () => finish(null));
    dlg.webContents.on("did-finish-load", () => {
      if (dlg.isDestroyed()) return;
      dlg.webContents.send("picker-sources", sources.map((s) => ({
        id: s.id, name: s.name, screen: /^screen:/.test(s.id),
        thumb: s.thumbnail && !s.thumbnail.isEmpty() ? s.thumbnail.toDataURL() : ""
      })));
    });
    dlg.loadFile(path.join(__dirname, "picker.html")).catch(() => finish(null));
  });
}
function setupDisplayCapture(partition) {
  try {
    const ses = session.fromPartition(partition);
    ses.setDisplayMediaRequestHandler(async (request, callback) => {
      try {
        // Never let a stuck screen-capture query leave the button doing nothing: give up after 10 seconds.
        let sources = [];
        try {
          sources = await Promise.race([
            desktopCapturer.getSources({ types: ["screen", "window"], thumbnailSize: { width: 320, height: 200 }, fetchWindowIcons: false }),
            new Promise((resolve) => setTimeout(() => resolve([]), 10000))
          ]);
        } catch (e) { sources = []; }
        let parent = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0] || null;
        if (parent && parent.__isCapturePicker) parent = null;
        const choice = await pickCaptureSource(parent, sources);
        if (!choice) return callback({});          // cancelled: the page sees a normal "cancelled" error
        callback({ video: choice });
      } catch (e) { try { callback({}); } catch (x) {} }
    });
  } catch (e) {}
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
  setupSpellcheck(partition);
  setupDisplayCapture(partition);

  win.loadFile(path.join(__dirname, "browser.html"), { query: { partition, private: isPrivate ? "1" : "0" } });

  win.webContents.on("context-menu", (_event, params) => showContextMenu(win, win.webContents, params, false));

  // Electron no longer supports the <webview> "new-window" DOM event, so any
  // link/window.open inside a webview (YouTube, search results, etc.) falls
  // back to Electron's own default: a brand new OS-level window. Intercept it
  // at the webContents level for every webview that attaches to this window,
  // deny the popup, and tell the renderer to open it as a tab instead.
  win.webContents.on("will-attach-webview", (_event, webPreferences) => {
    webPreferences.preload = path.join(__dirname, "project-preload.js");
    webPreferences.spellcheck = true;
    webPreferences.contextIsolation = true;
    webPreferences.nodeIntegration = false;
  });
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

  // ---- Project folder access. Everything is confined to the one folder you pick. ----
  let projectRoot = null;
  // Only the app's own local pages (file://) may use the project bridge, never a website.
  const handleProject = (name, fn) => ipcMain.handle(name, (e, ...a) => {
    if (!String(e.sender.getURL()).startsWith("file:")) throw new Error("not allowed");
    return fn(e, ...a);
  });
  const SKIP_DIRS = new Set(["node_modules", ".git", ".oasis-backup", "dist", "build", "out", ".next", "__pycache__", ".venv", "venv", ".idea", ".vscode"]);
  function scanProject(root) {
    const files = [];
    (function walk(dir, depth) {
      if (depth > 12 || files.length >= 20000) return;
      let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
      for (const e of ents) {
        if (files.length >= 20000) return;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(full, depth + 1); }
        else if (e.isFile()) { let size = 0; try { size = fs.statSync(full).size; } catch (x) {} files.push({ path: path.relative(root, full).split(path.sep).join("/"), size }); }
      }
    })(root, 0);
    return files;
  }
  function inRoot(rel) {
    if (!projectRoot) throw new Error("No project folder is open");
    const abs = path.resolve(projectRoot, String(rel || ""));
    if (abs !== projectRoot && !abs.startsWith(projectRoot + path.sep)) throw new Error("Path is outside the project folder");
    return abs;
  }
  function isProtected(rel) { return /(^|[\\/])(\.git|\.oasis-backup)([\\/]|$)/.test(String(rel)); }
  function backupFile(abs) {   // every overwrite/delete first copies the old file into .oasis-backup/<time>/
    if (!fs.existsSync(abs)) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const dest = path.join(projectRoot, ".oasis-backup", stamp, path.relative(projectRoot, abs));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(abs, dest);
  }
  const projectInfo = () => ({ root: projectRoot, name: path.basename(projectRoot), files: scanProject(projectRoot) });
  handleProject("project-pick", async () => {
    const r = await dialog.showOpenDialog({ properties: ["openDirectory"], title: "Choose your project folder" });
    if (r.canceled || !r.filePaths[0]) return null;
    projectRoot = path.resolve(r.filePaths[0]);
    return projectInfo();
  });
  handleProject("project-open", (_e, root) => {
    try { if (!root || !fs.statSync(root).isDirectory()) return null; } catch (e) { return null; }
    projectRoot = path.resolve(root);
    return projectInfo();
  });
  handleProject("project-read", (_e, rel) => {
    try {
      const abs = inRoot(rel);
      if (!fs.existsSync(abs)) return { missing: true };
      if (fs.statSync(abs).size > 5 * 1024 * 1024) return { error: "file is larger than 5 MB" };
      const buf = fs.readFileSync(abs);
      if (buf.subarray(0, 8000).includes(0)) return { error: "binary file, can't show" };
      return { text: buf.toString("utf8") };
    } catch (e) { return { error: e.message }; }
  });
  // Binary files (images, PDF, Word, Excel, ...) are sent to the app as raw bytes; the app turns them into text or a picture.
  handleProject("project-read-bin", (_e, rel) => {
    try {
      const abs = inRoot(rel);
      if (!fs.existsSync(abs)) return { missing: true };
      const size = fs.statSync(abs).size;
      if (size > 60 * 1024 * 1024) return { error: "file is larger than 60 MB" };
      return { data: new Uint8Array(fs.readFileSync(abs)), size };
    } catch (e) { return { error: e.message }; }
  });
  handleProject("project-write", (_e, rel, content) => {
    try {
      if (isProtected(rel)) return { error: "that folder is protected" };
      const abs = inRoot(rel); backupFile(abs);
      fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, String(content), "utf8");
      return { ok: true };
    } catch (e) { return { error: e.message }; }
  });
  handleProject("project-delete", (_e, rel) => {
    try {
      if (isProtected(rel)) return { error: "that folder is protected" };
      const abs = inRoot(rel); if (!fs.existsSync(abs)) return { ok: true };
      backupFile(abs); fs.rmSync(abs); return { ok: true };
    } catch (e) { return { error: e.message }; }
  });

  // ---- Running commands. This is the riskiest bridge, so it is much tighter than the file bridge: ----
  //  * only the Home page itself (index.html) may call it, never another local page or a website;
  //  * commands always run inside the open project folder;
  //  * the Home page only calls it after you click Run on a card that shows the exact command.
  const homePage = path.resolve(__dirname, "index.html");
  function isHomePage(e) {
    try {
      const u = new URL(e.sender.getURL());
      if (u.protocol !== "file:") return false;
      u.search = ""; u.hash = "";
      const p = path.resolve(fileURLToPath(u));
      return process.platform === "win32" ? p.toLowerCase() === homePage.toLowerCase() : p === homePage;
    } catch (err) { return false; }
  }
  const isWin = process.platform === "win32";
  const MAX_CMD = 4000, RUN_TIMEOUT_MS = 120000;
  const stripAnsi = (t) => t.replace(/\x1b\[[0-?]*[ -\/]*[@-~]/g, "").replace(/\x1b\][^\x07\x1b]*(\x07|\x1b\\)/g, "").replace(/\r(?!\n)/g, "\n");
  const psEncode = (script) => Buffer.from(script, "utf16le").toString("base64");
  const running = new Map();   // id -> { child, cancelled }
  function killTree(child) {
    if (!child || !child.pid) return;
    try {
      if (isWin) execFile("taskkill", ["/pid", String(child.pid), "/T", "/F"], () => {});
      else process.kill(-child.pid, "SIGKILL");
    } catch (e) { try { child.kill("SIGKILL"); } catch (x) {} }
  }
  function projectDirOrNull() { try { return projectRoot && fs.statSync(projectRoot).isDirectory() ? projectRoot : null; } catch (e) { return null; } }

  ipcMain.handle("project-run", (e, req) => new Promise((resolve) => {
    if (!isHomePage(e)) return resolve({ error: "not allowed" });
    const id = String((req && req.id) || ""), command = String((req && req.command) || "").replace(/\r\n/g, "\n").trim();
    const cwd = projectDirOrNull();
    if (!id || !command) return resolve({ error: "empty command" });
    if (command.length > MAX_CMD) return resolve({ error: "command is too long" });
    if (!cwd) return resolve({ error: "No project folder is open" });
    if (running.has(id)) return resolve({ error: "already running" });
    const shell = isWin ? (req.shell === "powershell" ? "powershell" : "cmd") : "sh";
    const opts = {
      cwd, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],   // no keyboard input: a prompt gets end-of-input instead of hanging
      env: Object.assign({}, process.env, { NO_COLOR: "1", FORCE_COLOR: "0", TERM: "dumb", PYTHONIOENCODING: "utf-8" })
    };
    let child;
    try {
      if (isWin && shell === "powershell") {
        child = spawn("powershell.exe", ["-NoLogo", "-NoProfile", "-NonInteractive", "-EncodedCommand",
          psEncode("[Console]::OutputEncoding=[System.Text.Encoding]::UTF8\n" + command)], opts);
      } else if (isWin) {
        const oneLine = command.split("\n").map((l) => l.trim()).filter(Boolean).join(" && ");   // cmd /c only runs the first line
        child = spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", '"chcp 65001>nul & ' + oneLine + '"'], Object.assign({ windowsVerbatimArguments: true }, opts));
      } else {
        child = spawn("/bin/sh", ["-c", command], Object.assign({ detached: true }, opts));
      }
    } catch (err) { return resolve({ error: err.message }); }

    const rec = { child, cancelled: false, timedOut: false };
    running.set(id, rec);
    const HEAD = 20000, TAIL = 60000;   // keep the start and the end of very long output
    let head = "", tail = "", omitted = 0;
    const push = (t) => {
      t = stripAnsi(t);
      if (head.length < HEAD) { const room = HEAD - head.length; head += t.slice(0, room); t = t.slice(room); }
      if (t) { tail += t; if (tail.length > TAIL) { omitted += tail.length - TAIL; tail = tail.slice(-TAIL); } }
    };
    child.stdout.setEncoding("utf8"); child.stderr.setEncoding("utf8");
    child.stdout.on("data", push); child.stderr.on("data", push);
    const t0 = Date.now();
    let done = false;
    const finish = (extra) => {
      if (done) return; done = true;
      clearTimeout(timer); running.delete(id);
      resolve(Object.assign({ output: head + (omitted ? "\n…[" + omitted + " characters omitted]…\n" : "") + tail,
        ms: Date.now() - t0, cancelled: rec.cancelled, timedOut: rec.timedOut, shell }, extra));
    };
    const timer = setTimeout(() => { rec.timedOut = true; killTree(child); setTimeout(() => finish({ exitCode: null }), 3000); }, RUN_TIMEOUT_MS);
    child.on("error", (err) => finish({ error: err.message }));
    child.on("close", (code, signal) => finish({ exitCode: code, signal: signal || null }));
  }));
  ipcMain.handle("project-run-cancel", (e, id) => {
    if (!isHomePage(e)) return false;
    const r = running.get(String(id));
    if (r) { r.cancelled = true; killTree(r.child); setTimeout(() => { const x = running.get(String(id)); if (x === r) { try { r.child.emit("close", null, "SIGKILL"); } catch (err) {} } }, 3000); }
    return !!r;
  });
  app.on("before-quit", () => { for (const r of running.values()) killTree(r.child); });

  // Opens a real PowerShell / Command Prompt window (Windows) in the project folder, with the command typed in.
  // What happens in that window is not sent back to the AI.
  ipcMain.handle("terminal-open", (e, req) => {
    if (!isHomePage(e)) return { error: "not allowed" };
    if (!isWin) return { error: "Terminal windows are only set up for Windows." };
    const shell = req && req.shell === "cmd" ? "cmd" : "powershell";
    const command = String((req && req.command) || "").replace(/\r\n/g, "\n").trim();
    if (command.length > MAX_CMD) return { error: "command is too long" };
    const cwd = projectDirOrNull() || os.homedir();
    try {
      let exe, args;
      if (shell === "powershell") {
        const script = "Set-Location -LiteralPath '" + cwd.replace(/'/g, "''") + "'" + (command ? "\n" + command : "");
        exe = "powershell.exe"; args = ["-NoLogo", "-NoExit", "-EncodedCommand", psEncode(script)];
      } else {
        // A small script file avoids every quoting problem with cmd; it only holds what the card showed you.
        const file = path.join(os.tmpdir(), "oasis-terminal-" + crypto.randomBytes(4).toString("hex") + ".cmd");
        fs.writeFileSync(file, "@echo off\r\ntitle Oasis\r\ncd /d \"" + cwd + "\"\r\n@echo on\r\n" + command.split("\n").join("\r\n") + "\r\n", "utf8");
        exe = "cmd.exe"; args = ["/k", file];
      }
      const child = spawn(process.env.ComSpec || "cmd.exe", ["/d", "/c", "start", "", "/D", cwd, exe].concat(args), { detached: true, stdio: "ignore", windowsHide: true });
      child.on("error", () => {});
      child.unref();
      return { ok: true, cwd };
    } catch (err) { return { error: err.message }; }
  });

  // ---- Native Windows apps & utilities (Task Manager, Device Manager, Settings pages, File Explorer, ...). ----
  // Separate from "project-run" above: the page can only send an id from js/windows-apps.js (and, for File Explorer,
  // one drive / known folder / existing folder). The id is turned into a fixed command in windows-launcher.js.
  // Tools that change things (regedit, msconfig, sfc, DISM, chkdsk, ipconfig /release ...) always show a native
  // Yes/Cancel dialog from here, so a page cannot skip the question.
  ipcMain.handle("win-launch", async (e, req) => {
    if (!isHomePage(e)) return { error: "not allowed" };
    if (!req || typeof req !== "object") return { error: "bad request" };
    const host = e.sender.hostWebContents || e.sender;
    const parent = BrowserWindow.fromWebContents(host) || BrowserWindow.getFocusedWindow() || undefined;
    return winLauncher.handleRequest({ id: String(req.id || ""), arg: req.arg == null ? "" : String(req.arg) }, {
      app, cwd: projectDirOrNull() || os.homedir(),
      confirm: async (text, label) => {
        const r = await dialog.showMessageBox(parent, {
          type: "warning", buttons: ["Yes, run it", "Cancel"], defaultId: 1, cancelId: 1, noLink: true,
          title: "Oasis - " + label, message: String(label), detail: String(text) + "\n\nThe AI asked for this. Nothing happens unless you choose Yes."
        });
        return r.response === 0;
      }
    });
  });

  ipcMain.handle("show-item-in-folder", (_event, targetPath) => { try { shell.showItemInFolder(targetPath); return true; } catch (e) { return false; } });

  // Tab dragged off the tab strip -> its own window. Only the browser shell itself may ask for this.
  ipcMain.handle("popout-tab", (e, req) => {
    const owner = BrowserWindow.fromWebContents(e.sender);
    if (!owner || e.sender !== owner.webContents || !req) return { error: "not allowed" };
    const w = openPopupWindow(String(req.url || ""), String(req.partition || ""), { x: req.x, y: req.y, title: String(req.title || "").slice(0, 120) });
    return w ? { ok: true } : { error: "that page can't be opened in its own window" };
  });
  // A popped-out window has no tab strip, so links the AI opens from it open as more pop-outs.
  ipcMain.on("oasis-open-tab-fallback", (e, url) => {
    if (e.sender.hostWebContents) return;   // inside a tab: the browser shell handles it
    const w = BrowserWindow.fromWebContents(e.sender);
    if (w && w.__oasisPopupPartition) openPopupWindow(String(url || ""), w.__oasisPopupPartition, null);
  });
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
