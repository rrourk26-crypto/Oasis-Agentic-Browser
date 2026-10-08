/* ===========================================================
   Oasis storage — IndexedDB for chats and attached zips.

   Why: localStorage holds about 5 MB and only strings, so long chats,
   pasted images and attached zips either didn't fit or vanished when
   the app closed. IndexedDB holds hundreds of MB, stores files (Blobs)
   directly, and survives restarts.

   What lives here:
     chats  - one record per conversation (so saving only rewrites the
              chats that actually changed)
     zips   - the original .zip you attached to a chat, kept as a Blob
     meta   - small bookkeeping flags (e.g. "old chats were imported")

   Settings and other small preferences stay in localStorage on purpose:
   Lobby and Mystic Realm read "lmchat.settings" from there directly.

   Exposed as window.OasisDB. If IndexedDB is unavailable the app falls
   back to its old localStorage behaviour (see js/app.js).
   =========================================================== */
(function () {
  "use strict";

  const DB_NAME = "oasis-store";
  const DB_VERSION = 1;
  const OLD_CHATS_KEY = "lmchat.chats";   // where chats used to live (localStorage)

  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") { reject(new Error("IndexedDB is not available")); return; }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("chats")) db.createObjectStore("chats", { keyPath: "id" });
        if (!db.objectStoreNames.contains("zips")) db.createObjectStore("zips", { keyPath: "id" });
        if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "k" });
      };
      req.onsuccess = () => {
        const db = req.result;
        db.onversionchange = () => { db.close(); dbPromise = null; };
        resolve(db);
      };
      req.onerror = () => reject(req.error || new Error("Could not open IndexedDB"));
      req.onblocked = () => reject(new Error("IndexedDB open was blocked"));
    });
    dbPromise.catch(() => { dbPromise = null; });   // allow a retry next time
    return dbPromise;
  }

  // Run fn(transaction) and resolve once the transaction has fully committed.
  function run(stores, mode, fn) {
    return open().then((db) => new Promise((resolve, reject) => {
      const t = db.transaction(stores, mode);
      const box = { value: undefined };
      t.oncomplete = () => resolve(box.value);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error || new Error("Transaction aborted"));
      fn(t, box);
    }));
  }

  function getAll(store) {
    return run(store, "readonly", (t, box) => {
      const r = t.objectStore(store).getAll();
      r.onsuccess = () => { box.value = r.result; };
    });
  }
  function getOne(store, key) {
    return run(store, "readonly", (t, box) => {
      const r = t.objectStore(store).get(key);
      r.onsuccess = () => { box.value = r.result; };
    });
  }
  function getAllKeys(store) {
    return run(store, "readonly", (t, box) => {
      const r = t.objectStore(store).getAllKeys();
      r.onsuccess = () => { box.value = r.result; };
    });
  }
  function putOne(store, rec) { return run(store, "readwrite", (t) => { t.objectStore(store).put(rec); }); }
  function deleteOne(store, key) { return run(store, "readwrite", (t) => { t.objectStore(store).delete(key); }); }

  /* ---------- Chats ---------- */

  // A cheap fingerprint of a chat, so a save only writes chats that changed.
  function fingerprint(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return str.length + ":" + (h >>> 0);
  }

  const saved = new Map();          // chat id -> fingerprint of what is stored in the database
  let chain = Promise.resolve();    // saves run one after another, never overlapping

  function doSaveChats(list) {
    const toWrite = [];
    const keep = new Set();
    for (const c of list) {
      if (!c || !c.id) continue;
      keep.add(c.id);
      const fp = fingerprint(JSON.stringify(c));
      if (saved.get(c.id) !== fp) toWrite.push({ chat: c, fp });
    }
    const toDelete = [];
    for (const id of saved.keys()) if (!keep.has(id)) toDelete.push(id);
    if (!toWrite.length && !toDelete.length) return Promise.resolve();

    return run("chats", "readwrite", (t) => {
      const os = t.objectStore("chats");
      for (const w of toWrite) {
        try { os.put(w.chat); }
        catch (e) { os.put(JSON.parse(JSON.stringify(w.chat))); }   // plain-data fallback
      }
      for (const id of toDelete) os.delete(id);
    }).then(() => {
      for (const w of toWrite) saved.set(w.chat.id, w.fp);
      for (const id of toDelete) saved.delete(id);
    });
  }

  // Save the chat list. Only changed chats are written; chats no longer in the list are deleted.
  function saveChats(list) {
    const snapshot = Array.isArray(list) ? list.slice() : [];
    const next = chain.catch(() => {}).then(() => doSaveChats(snapshot));
    chain = next;
    return next;
  }

  async function getMeta(k) { const r = await getOne("meta", k); return r ? r.v : undefined; }
  function setMeta(k, v) { return putOne("meta", { k, v }); }

  // Load every chat (newest first). The first time, chats found in the old
  // localStorage location are copied in, checked, and only then removed.
  async function loadChats() {
    let recs = await getAll("chats");
    const migrated = await getMeta("chatsMigrated");

    if (!migrated) {
      let old = null;
      try { old = JSON.parse(localStorage.getItem(OLD_CHATS_KEY) || "null"); } catch (e) { old = null; }
      if (Array.isArray(old) && old.length) {
        const have = new Set(recs.map((c) => c.id));
        const missing = old.filter((c) => c && c.id && !have.has(c.id));
        if (missing.length) {
          await run("chats", "readwrite", (t) => { const os = t.objectStore("chats"); missing.forEach((c) => os.put(c)); });
        }
        recs = await getAll("chats");
        const stored = new Set(recs.map((c) => c.id));
        const allThere = old.every((c) => !c || !c.id || stored.has(c.id));
        if (allThere) {
          try { localStorage.removeItem(OLD_CHATS_KEY); } catch (e) {}   // frees the old 5 MB space
          await setMeta("chatsMigrated", Date.now());
        }
        // if something didn't copy, the old copy is left alone and we try again next launch
      } else {
        await setMeta("chatsMigrated", Date.now());
      }
    }

    recs.sort((a, b) => (b.updated || 0) - (a.updated || 0));
    saved.clear();
    for (const c of recs) saved.set(c.id, fingerprint(JSON.stringify(c)));
    return recs;
  }

  /* ---------- Attached zips ---------- */

  function putZip(id, name, large, blob) { return putOne("zips", { id, name, large: !!large, blob, stored: Date.now() }); }
  function getZip(id) { return getOne("zips", id); }
  function deleteZip(id) { return deleteOne("zips", id); }

  // Remove saved zips whose chat no longer exists.
  async function pruneZips(chatIds) {
    const keep = new Set(chatIds);
    const keys = await getAllKeys("zips");
    const drop = keys.filter((k) => !keep.has(k));
    if (!drop.length) return 0;
    await run("zips", "readwrite", (t) => { const os = t.objectStore("zips"); drop.forEach((k) => os.delete(k)); });
    return drop.length;
  }

  /* ---------- Misc ---------- */

  // Ask the browser not to evict our data when disk space gets low.
  function requestPersistence() {
    try { if (navigator.storage && navigator.storage.persist) return navigator.storage.persist().catch(() => false); } catch (e) {}
    return Promise.resolve(false);
  }
  function usage() {
    try { if (navigator.storage && navigator.storage.estimate) return navigator.storage.estimate(); } catch (e) {}
    return Promise.resolve(null);
  }

  window.OasisDB = { open, loadChats, saveChats, putZip, getZip, deleteZip, pruneZips, requestPersistence, usage };
})();
