/* ===========================================================
   LM Studio Chat — wallpapers add-on
   Bundled pack (wallpapers/), your own images (kept in this
   browser), and modes: default look / pick one / random on
   each visit / shuffle every N minutes. Runs on its own —
   removing this file just leaves the default background.
   =========================================================== */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const wall = $("wall"), main = $("main"), dlg = $("wallDlg");
  if (!wall || !main || !dlg || !$("wallMode")) return;

  const PACK = (window.LMCHAT_WALLPAPERS || []).map(([f, group, label]) => ({ id: "p:" + f, group, label, full: "wallpapers/" + f + ".webp", thumb: "wallpapers/thumbs/" + f + ".jpg" }));

  /* ---------- Settings (own key) ---------- */
  const KEY = "lmchat.wall";
  const cfg = { mode: "off", id: "", every: 15, dim: 35 };
  try { Object.assign(cfg, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {} };

  /* ---------- Your own images: IndexedDB (localStorage is too small for photos) ---------- */
  let mine = [];   // { id: "u:…", label, full (object URL), thumb (object URL), blob }
  const dbp = new Promise((res) => {
    try {
      const rq = indexedDB.open("lmchat", 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore("wallpapers", { keyPath: "key" });
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => res(null);
    } catch (e) { res(null); }
  });
  const tx = async (mode, fn) => {
    const db = await dbp; if (!db) return null;
    return new Promise((res) => {
      const t = db.transaction("wallpapers", mode), st = t.objectStore("wallpapers");
      const rq = fn(st); t.oncomplete = () => res(rq ? rq.result : true); t.onerror = t.onabort = () => res(null);
    });
  };
  function addMine(rec) {
    const url = URL.createObjectURL(rec.blob);
    mine.push({ id: "u:" + rec.key, key: rec.key, label: rec.name, full: url, thumb: url });
  }
  async function loadMine() { const all = await tx("readonly", (s) => s.getAll()); (all || []).forEach(addMine); }

  async function shrink(file) {   // keep stored images a sensible size
    try {
      const bmp = await createImageBitmap(file);
      const k = Math.min(1, 1920 / Math.max(bmp.width, bmp.height));
      const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
      return await new Promise((res) => c.toBlob((b) => res(b || file), "image/jpeg", 0.86));
    } catch (e) { return file; }
  }
  async function addFiles(files) {
    let n = 0;
    for (const f of files) {
      if (!f.type.startsWith("image/")) continue;
      const rec = { key: "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: f.name.replace(/\.[^.]+$/, "") || "My image", blob: await shrink(f) };
      if (await tx("readwrite", (s) => s.put(rec))) { addMine(rec); n++; cfg.id = "u:" + rec.key; }
    }
    if (!n) { alert("Couldn't save that image. Your browser may be blocking storage for this page."); return; }
    if (cfg.mode === "off") cfg.mode = "pick";
    save(); sync(); apply(); paint(find(cfg.id)); renderGallery();
  }

  const all = () => mine.concat(PACK);
  const find = (id) => all().find((w) => w.id === id) || null;
  const random = () => { const l = all().filter((w) => w.id !== cfg.id); return l.length ? l[Math.floor(Math.random() * l.length)] : all()[0]; };

  /* ---------- Painting the background (cross-fades between images) ---------- */
  let shown = "";
  function paint(w) {
    if (!w) { wall.innerHTML = ""; shown = ""; return; }
    if (shown === w.id) return;
    shown = w.id;
    const im = new Image();
    im.onload = () => {
      if (shown !== w.id) return;
      const old = Array.from(wall.children);
      const el = document.createElement("div"); el.className = "wl"; el.style.backgroundImage = 'url("' + w.full + '")';
      wall.appendChild(el);
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("in")));
      setTimeout(() => old.forEach((o) => o.remove()), 1000);
    };
    im.src = w.full;
  }
  wall.style.setProperty("--wdim", cfg.dim / 100);

  let timer = 0;
  function apply(fromUser) {
    clearInterval(timer);
    wall.style.setProperty("--wdim", cfg.dim / 100);
    if (cfg.mode === "off") { paint(null); return; }
    if (cfg.mode === "pick") { paint(find(cfg.id) || PACK[0] || null); return; }
    if (cfg.mode === "random" || cfg.mode === "timed") {
      if (fromUser || !shown) { const w = random(); if (w) { cfg.id = w.id; save(); paint(w); } }
      if (cfg.mode === "timed") timer = setInterval(() => { const w = random(); if (w) { cfg.id = w.id; save(); paint(w); renderGallery(); } }, Math.max(1, cfg.every) * 60000);
    }
  }

  /* ---------- Settings controls ---------- */
  const modeEl = $("wallMode"), everyEl = $("wallEvery"), dimEl = $("wallDim");
  function sync() {
    modeEl.value = cfg.mode; everyEl.value = String(cfg.every); dimEl.value = cfg.dim; $("wallDimVal").textContent = cfg.dim + "%";
    $("wallEveryRow").style.display = cfg.mode === "timed" ? "" : "none";
  }
  modeEl.onchange = () => { cfg.mode = modeEl.value; save(); sync(); apply(true); };
  everyEl.onchange = () => { cfg.every = parseInt(everyEl.value, 10) || 15; save(); apply(); };
  dimEl.oninput = () => { cfg.dim = parseInt(dimEl.value, 10) || 0; $("wallDimVal").textContent = cfg.dim + "%"; wall.style.setProperty("--wdim", cfg.dim / 100); save(); };

  /* ---------- Gallery ---------- */
  function tile(w, deletable) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "wt" + (cfg.mode !== "off" && cfg.id === w.id ? " sel" : ""); b.title = w.label;
    const img = document.createElement("img"); img.src = w.thumb; img.alt = w.label; img.loading = "lazy"; b.appendChild(img);
    b.onclick = () => { cfg.id = w.id; if (cfg.mode === "off" || cfg.mode === "random") cfg.mode = "pick"; save(); sync(); apply(); paint(w); renderGallery(); };
    if (deletable) {
      const x = document.createElement("span"); x.className = "del"; x.textContent = "✕"; x.title = "Remove this image";
      x.onclick = async (e) => {
        e.stopPropagation();
        if (!window.confirm("Remove “" + w.label + "” from your images?")) return;
        await tx("readwrite", (s) => s.delete(w.key)); URL.revokeObjectURL(w.full);
        mine = mine.filter((m) => m.id !== w.id);
        if (cfg.id === w.id) { cfg.id = ""; if (cfg.mode === "pick") { cfg.mode = "off"; } sync(); save(); apply(true); }
        renderGallery();
      };
      b.appendChild(x);
    }
    return b;
  }
  function section(title, nodes) {
    const box = $("wallScroll");
    const h = document.createElement("h3"); h.textContent = title; box.appendChild(h);
    const g = document.createElement("div"); g.className = "wgrid"; nodes.forEach((n) => g.appendChild(n)); box.appendChild(g);
  }
  function renderGallery() {
    const box = $("wallScroll"), top = box.scrollTop;
    box.innerHTML = "";
    const add = document.createElement("button"); add.type = "button"; add.className = "wt add"; add.textContent = "+ Add my image";
    add.onclick = () => $("wallFile").click();
    section("My images", [add].concat(mine.map((w) => tile(w, true))));
    const groups = [];
    PACK.forEach((w) => { let g = groups.find((x) => x.name === w.group); if (!g) groups.push(g = { name: w.group, items: [] }); g.items.push(w); });
    groups.forEach((g) => section(g.name, g.items.map((w) => tile(w, false))));
    box.scrollTop = top;
  }
  $("wallBrowse").onclick = () => { renderGallery(); dlg.showModal(); };
  $("wallClose").onclick = () => dlg.close();
  $("wallAdd").onclick = () => $("wallFile").click();
  $("wallFile").onchange = async (e) => { const f = Array.from(e.target.files); e.target.value = ""; if (f.length) await addFiles(f); };

  /* ---------- Start ---------- */
  sync();
  loadMine().then(() => apply());
})();
