/* =====================================================================
   MYSTIC REALM — READING HISTORY MODULE
   Saves every reading/sitting/interpretation (details + AI text, if
   any) to localStorage so it can be browsed later from the main page.
   Shared across every app (Mystic Tarot, Madame Selene, Celestial
   Horoscope, Numerology, Dream Interpreter, Astragalomancy, I Ching)
   via the optional "app" argument to record() — defaults to
   "Mystic Tarot" for backward compatibility with existing saved
   readings.
===================================================================== */

(function () {
  "use strict";

  const KEY = "mysticTarotAI_readings";

  function loadAll() {
    try {
      const raw = localStorage.getItem(KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function saveAll(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {
      /* storage full or unavailable — fail silently */
    }
  }

  function record(spreadTitle, cards, app) {
    const list = loadAll();
    const entry = {
      id: Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
      timestamp: Date.now(),
      app: app || "Mystic Tarot",
      spreadTitle: spreadTitle,
      cards: cards, // tarot: [{position, cardName, reversed, meaning}] — other apps: [{text}]
      aiText: null,
    };
    list.unshift(entry);
    saveAll(list);
    return entry.id;
  }

  function updateAI(id, aiText) {
    const list = loadAll();
    const idx = list.findIndex((r) => r.id === id);
    if (idx > -1) {
      list[idx].aiText = aiText;
      saveAll(list);
    }
  }

  function updateNote(id, note) {
    const list = loadAll();
    const idx = list.findIndex((r) => r.id === id);
    if (idx > -1) {
      list[idx].note = note;
      saveAll(list);
    }
  }

  function activeDates() {
    // Set of "YYYY-M-D" local-date strings that have at least one entry —
    // the raw material for streak calculations.
    const days = new Set();
    loadAll().forEach((r) => {
      if (!r.timestamp) return;
      const d = new Date(r.timestamp);
      days.add(d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate());
    });
    return days;
  }

  function deleteOne(id) {
    const list = loadAll().filter((r) => r.id !== id);
    saveAll(list);
  }

  function clearAll() {
    saveAll([]);
  }

  function deleteWhere(predicate) {
    const list = loadAll().filter((r) => !predicate(r));
    saveAll(list);
  }

  window.ReadingHistory = {
    loadAll,
    record,
    updateAI,
    updateNote,
    deleteOne,
    clearAll,
    deleteWhere,
    activeDates,
  };
})();
