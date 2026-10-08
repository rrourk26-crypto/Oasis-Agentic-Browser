/* ============================================================
   MYSTIC REALM — AI CONNECTION CONFIG
   ------------------------------------------------------------
   One place to point every reading (Tarot, Numerology, Horoscope,
   Dream Interpreter, Astrolabe, I Ching, Astragalomancy, and the
   Mystic's sittings) at an OpenAI-compatible chat-completions
   server. Everything else in the app reads window.MysticAIConfig
   from here — nothing else needs to change.

   THIS NOW FOLLOWS THE OASIS BROWSER'S OWN AI SETTINGS instead of
   a fixed server: Mystic Realm reads the exact same "lmchat.settings"
   entry the browser's Settings panel (Home page -> Settings) saves
   to localStorage, and uses whatever address/model/key is set
   there. Since Mystic Realm's pages run inside the browser on the
   same storage partition as the Home page, this just works — open
   the browser's Settings, point it at your server (local by
   default), and Mystic Realm follows automatically. No separate
   setup, and nothing here needs editing by hand.

   If that setting can't be read for some reason (storage blocked,
   running the app standalone outside the browser, etc.), this
   falls back to a local LM Studio-style server on this machine —
   the same local-first default the browser itself starts with.
============================================================ */
(function () {
  "use strict";

  // Must match the key + shape used by the Oasis browser's own chat
  // (see js/app.js: `store.get("lmchat.settings", {})`).
  const OASIS_SETTINGS_KEY = "lmchat.settings";
  const LOCAL_FALLBACK = { baseUrl: "http://localhost:1234/v1", apiKey: "", model: "" };

  function readBrowserAISettings() {
    try {
      const raw = localStorage.getItem(OASIS_SETTINGS_KEY);
      if (!raw) return LOCAL_FALLBACK;
      const parsed = JSON.parse(raw) || {};
      return {
        baseUrl: (typeof parsed.baseUrl === "string" && parsed.baseUrl.trim()) || LOCAL_FALLBACK.baseUrl,
        apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
        model: typeof parsed.model === "string" ? parsed.model : ""
      };
    } catch (e) {
      return LOCAL_FALLBACK;
    }
  }

  const s = readBrowserAISettings();

  window.MysticAIConfig = {
    apiBase: s.baseUrl.trim().replace(/\/+$/, ""),
    // Some of Mystic Realm's readers refuse to run if the model name is
    // blank (they treat it as "no AI configured"). The browser itself
    // treats a blank model as "use whatever's loaded" and simply omits
    // the field — so mirror that here with a harmless placeholder that
    // local OpenAI-compatible servers (LM Studio, Ollama, etc.) ignore
    // when only one model is loaded, rather than showing an error.
    model: s.model || "local-model",
    apiKey: s.apiKey
  };
})();
