/* ============================================================
   Mystic Diary — private, freeform journal entries with a PIN
   lock and audio/video attachments. Lives entirely separate
   from ReadingHistory (readings stay auto-recorded as before);
   this is only for what someone writes/records themselves.

   Storage:
   - Entries (text + attached audio/video Blobs) live in
     IndexedDB ("mysticDiaryDB"), since Blobs stored there don't
     need base64 encoding and the quota is far larger than
     localStorage's ~5-10MB.
   - The PIN is a *casual* lock, not encryption — it hides the
     section from casual glances, it does not secure the data
     (anyone with devtools access to this browser profile can
     still read it). We say so in the UI; nothing here should
     imply otherwise.
   ============================================================ */
(function (g) {
  'use strict';

  const DB_NAME = 'mysticDiaryDB';
  const DB_VERSION = 1;
  const STORE = 'entries';
  const PIN_KEY = 'mysticDiary_pinHash';
  const UNLOCK_KEY = 'mysticDiary_unlockedSession';

  const supported = typeof indexedDB !== 'undefined';

  // ---------------- IndexedDB plumbing ----------------
  let dbPromise = null;
  function openDb() {
    if (!supported) return Promise.reject(new Error('IndexedDB is not available in this browser/context.'));
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('Failed to open diary database.'));
    });
    return dbPromise;
  }

  function tx(mode) {
    return openDb().then((db) => db.transaction(STORE, mode).objectStore(STORE));
  }

  function reqToPromise(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('Diary storage error.'));
    });
  }

  function makeId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  // ---------------- entries ----------------
  /** addEntry({title, text, media:[{blob, type, mime, name}]}) -> Promise<id> */
  async function addEntry({ title, text, media }) {
    const store = await tx('readwrite');
    const entry = {
      id: makeId(),
      timestamp: Date.now(),
      title: title || '',
      text: text || '',
      media: (media || []).map((m) => ({
        id: makeId(),
        type: m.type,           // 'audio' | 'video'
        mime: m.mime || m.blob.type,
        name: m.name || '',
        blob: m.blob,
        thumbnail: m.thumbnail || null, // small dataURL: video frame grab, or a waveform snapshot for audio
      })),
    };
    await reqToPromise(store.add(entry));
    return entry.id;
  }

  async function updateEntry(id, patch) {
    const store = await tx('readwrite');
    const existing = await reqToPromise(store.get(id));
    if (!existing) return;
    Object.assign(existing, patch);
    await reqToPromise(store.put(existing));
  }

  async function deleteEntry(id) {
    const store = await tx('readwrite');
    await reqToPromise(store.delete(id));
  }

  async function listEntries() {
    const store = await tx('readonly');
    const all = await reqToPromise(store.getAll());
    return all.sort((a, b) => b.timestamp - a.timestamp);
  }

  async function clearAll() {
    const store = await tx('readwrite');
    await reqToPromise(store.clear());
  }

  // ---------------- casual PIN lock (not encryption — see note above) ----------------
  function simpleHash(str) {
    // Not cryptographic — just enough to avoid storing the PIN in plain text
    // for a casual "keep siblings out" style lock. Works in any context
    // (no dependence on Web Crypto / secure-context restrictions).
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16);
  }

  function hasPin() {
    try { return !!localStorage.getItem(PIN_KEY); } catch (e) { return false; }
  }
  function setPin(pin) {
    try { localStorage.setItem(PIN_KEY, simpleHash(String(pin))); return true; } catch (e) { return false; }
  }
  function verifyPin(pin) {
    try { return localStorage.getItem(PIN_KEY) === simpleHash(String(pin)); } catch (e) { return false; }
  }
  function clearPin() {
    try { localStorage.removeItem(PIN_KEY); } catch (e) { /* noop */ }
  }

  function isUnlockedThisSession() {
    try { return sessionStorage.getItem(UNLOCK_KEY) === '1'; } catch (e) { return true; }
  }
  function unlockSession() {
    try { sessionStorage.setItem(UNLOCK_KEY, '1'); } catch (e) { /* noop */ }
  }
  function lockSession() {
    try { sessionStorage.removeItem(UNLOCK_KEY); } catch (e) { /* noop */ }
  }

  g.MysticDiary = {
    supported,
    addEntry, updateEntry, deleteEntry, listEntries, clearAll,
    hasPin, setPin, verifyPin, clearPin,
    isUnlockedThisSession, unlockSession, lockSession,
  };
})(typeof window !== 'undefined' ? window : globalThis);
