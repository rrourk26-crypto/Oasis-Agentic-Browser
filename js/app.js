/* ===========================================================
   LM Studio Chat — core app (chat, history, connection,
   settings dialog, sending messages). Split out of the
   original single-file page; behavior is unchanged.
   =========================================================== */
(function () {
  "use strict";

  /* ---------- Links shown in the sidebar ----------
     These are the starting links. You can change, add or remove them from the
     expanded sidebar ("Add or edit links"); your version is saved in this browser. */
  const ICONS = {
    oasis: '<circle cx="12" cy="8.5" r="3.5"/><path d="M12 2v1M4.5 5l.8.8M19.5 5l-.8.8M3 16c3-2 6-2 9 0s6 2 9 0M3 20.5c3-2 6-2 9 0s6 2 9 0"/>',
    jellyfin: '<path d="M5 12a7 7 0 0 1 14 0z"/><path d="M8 12v6M12 12v8.5M16 12v6"/>',
    youtube: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10 9.5v5l4.5-2.5z"/>',
    facebook: '<path d="M15 3.5h-2a4 4 0 0 0-4 4V10H6.5v3.5H9V21h3.5v-7.5H15l.5-3.5h-3V8a1 1 0 0 1 1-1H15z"/>',
    wikipedia: '<path d="M2.5 6.5l4.5 11.5L12 8.5l5 9.5 4.5-11.5"/>',
    gmail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6.5L20.5 7"/>',
    gemini: '<path d="M12 2.5c.6 5.2 4.3 9 9.5 9.5-5.2.6-8.9 4.3-9.5 9.5-.6-5.2-4.3-8.9-9.5-9.5C7.7 11.5 11.4 7.7 12 2.5z"/>',
    claude: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/>',
    chatgpt: '<path d="M12 3.5c4.7 0 8.5 3.3 8.5 7.5s-3.8 7.5-8.5 7.5c-1 0-2-.1-2.9-.4L4.5 20l1.2-3.6C4.3 15.2 3.5 13.2 3.5 11c0-4.2 3.8-7.5 8.5-7.5z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
    home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9M10 19v-5h4v5"/>',
    folder: '<path d="M3.5 7.5a2 2 0 0 1 2-2H10l2 2.5h6.5a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
    music: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
    film: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M8 4.5v15M16 4.5v15M3.5 9.5H8M3.5 14.5H8M16 9.5h4.5M16 14.5h4.5"/>',
    game: '<rect x="2.5" y="7" width="19" height="10.5" rx="5"/><path d="M7.5 10.5V14M5.8 12.2h3.4M15.5 11.5h.01M18 13.5h.01"/>',
    book: '<path d="M5 4.5h11a2.5 2.5 0 0 1 2.5 2.5v13H7.5A2.5 2.5 0 0 1 5 17.5z"/><path d="M5 17.5A2.5 2.5 0 0 1 7.5 15h11"/>',
    cart: '<circle cx="9" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/><path d="M3 4h2.5l2 11h10.5l2-8H6.5"/>',
    camera: '<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    cloud: '<path d="M7 18a4.5 4.5 0 0 1-.6-8.9A6 6 0 0 1 18 10.5 3.8 3.8 0 0 1 17.5 18z"/>',
    news: '<rect x="4" y="4.5" width="16" height="15" rx="2.5"/><path d="M8 9h8M8 12.5h8M8 16h5"/>',
    code: '<path d="M8.5 8l-4.5 4 4.5 4M15.5 8l4.5 4-4.5 4M13.5 5.5l-3 13"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    server: '<rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/><path d="M7 7h.01M7 17h.01"/>'
  };
  const DEFAULT_LINKS = [
    { name: "Oasis", url: "https://oasis.myguyinthechair.com/", icon: "oasis" },
    { name: "YouTube", url: "https://www.youtube.com/", icon: "youtube" },
    { name: "Wikipedia", url: "https://www.wikipedia.org/", icon: "wikipedia" },
    { name: "Gmail", url: "https://mail.google.com/", icon: "gmail" },
    { name: "Gemini", url: "https://gemini.google.com/", icon: "gemini" },
    { name: "Claude", url: "https://claude.ai/", icon: "claude" },
    { name: "ChatGPT", url: "https://chatgpt.com/", icon: "chatgpt" }
  ];

  const CHIPS = [
    ["Craft a story", "Write a short story about "],
    ["Study for a test", "Help me study for a test on "],
    ["Write an analysis", "Write an analysis of "],
    ["Take a quiz", "Quiz me on "],
    ["Write a speech", "Write a short speech about "],
    ["Rewrite a classic", "Rewrite a classic story as if it happened today: "],
    ["Make a packing list", "Make a packing list for "],
    ["Invent a product", "Help me invent a new product that solves "]
  ];

  const FACTS = [
    "Smelling chocolate can help you relax",
    "Honey found in ancient Egyptian tombs is still edible",
    "Octopuses have three hearts",
    "Bananas are berries, but strawberries are not",
    "A day on Venus is longer than its year",
    "Sharks existed before trees did",
    "Wombat droppings are cube-shaped",
    "Sound travels about four times faster in water than in air",
    "Your stomach lining replaces itself every few days",
    "There are more trees on Earth than stars in the Milky Way, by some estimates"
  ];

  /* ---------- Storage (safe if blocked) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  const defaults = { name: "Guest", baseUrl: "http://localhost:1234/v1", apiKey: "", system: "", temperature: 0.7, model: "", imageGen: true, realImages: true, webSearch: true, commands: true, winApps: true, proactive: true, proactiveMins: 5, proactiveMax: 2, apMaxSteps: 30, autoApply: false, compact: true, memoryEnabled: true, memory: "", pexelsKey: "", pixabayKey: "", tmdbKey: "", youtubeKey: "", nasaKey: "" };
  let settings = Object.assign({}, defaults, store.get("lmchat.settings", {}));
  // The starting name is now "Guest". If this browser still has the old starting name saved, switch it once.
  if (!store.get("lmchat.guestDefault", false)) {
    if (settings.name === "Robby") { settings.name = "Guest"; store.set("lmchat.settings", settings); }
    store.set("lmchat.guestDefault", true);
  }
  let chats = [];              // loaded from IndexedDB at startup (see initStorage below)
  let chatsReady = false;      // saving is held off until the stored chats have loaded
  let dbOK = false;            // true when IndexedDB is working; otherwise we fall back to localStorage
  const CHAT_LIMIT = 1000;     // newest chats kept (was 200 when chats lived in localStorage)
  let currentId = null;
  let attachments = [];
  let streaming = false;
  let activeSend = null;      // the reply currently being generated (if any)
  let interrupting = false;   // true for a tick while we stop a reply to send a new message
  const cancelledReplies = new WeakSet();
  let internalSend = null, compacting = false, nextChatAuto = false, connState = "";
  const ap = { state: "idle", status: "", chatId: null, steps: 0, timer: null, lastSig: "", pendingMsg: null, planAsked: false };
  const pa = { last: Date.now(), lastSpoke: 0, unanswered: 0, jit: 1, lastCheck: 0 };
  const workZips = new Map();   // chat id -> { name, zip, large } : the zip you attached (loaded back from IndexedDB on demand)

  const $ = (id) => document.getElementById(id);
  const main = $("main"), input = $("input"), sendBtn = $("send"), msgs = $("messages");

  /* ---------- Helpers ---------- */
  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function baseUrl() { return (settings.baseUrl || defaults.baseUrl).trim().replace(/\/+$/, ""); }
  function headers() {
    const h = { "Content-Type": "application/json" };
    if (settings.apiKey) h.Authorization = "Bearer " + settings.apiKey;
    return h;
  }
  function currentChat() { return chats.find((c) => c.id === currentId) || null; }
  function saveChats() {
    if (!chatsReady) return;   // never overwrite stored chats before they have been loaded
    let list = chats;
    if (list.length > CHAT_LIMIT) list = chats.slice().sort((a, b) => b.updated - a.updated).slice(0, CHAT_LIMIT);
    if (dbOK) {
      window.OasisDB.saveChats(list).catch((e) => console.warn("Could not save chats to IndexedDB:", e));
      return;
    }
    // Fallback (IndexedDB unavailable): the old localStorage behaviour.
    list = list.slice(0, 200);
    try { localStorage.setItem("lmchat.chats", JSON.stringify(list)); return; } catch (e) {}
    // Storage is full (usually pasted images). Keep the newest chat intact and drop image data
    // from older ones so the text of every conversation still saves and can be recalled.
    const slim = list.map((c, i) => i === 0 ? c : Object.assign({}, c, { messages: c.messages.map((m) => {
      if (!Array.isArray(m.content)) return m;
      const txt = m.content.filter((x) => x && x.type === "text").map((x) => x.text).join("\n");
      return Object.assign({}, m, { content: txt || m.display || "[image]" });
    }) }));
    try { localStorage.setItem("lmchat.chats", JSON.stringify(slim)); } catch (e) {}
  }

  // Load chats from IndexedDB (copying over any old localStorage chats the first time).
  async function initStorage() {
    try {
      if (!window.OasisDB) throw new Error("storage module missing");
      chats = await window.OasisDB.loadChats();
      dbOK = true;
      window.OasisDB.pruneZips(chats.map((c) => c.id)).catch(() => {});
      window.OasisDB.requestPersistence();
    } catch (e) {
      console.warn("IndexedDB unavailable, using localStorage for chats:", e);
      dbOK = false;
      chats = store.get("lmchat.chats", []);
    }
    chatsReady = true;
  }
  // Make sure the last changes are written when the window is hidden or closed.
  window.addEventListener("pagehide", () => saveChats());
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") saveChats(); });

  // ---- Attached zips: kept in IndexedDB so they survive restarts ----
  const zipLoads = new Map();   // chat id -> promise while a saved zip is being loaded back
  function persistZip(chatId, a) {
    if (!dbOK) return;
    (async () => {
      const blob = a.file || await a.zip.generateAsync({ type: "blob", compression: "DEFLATE" });
      await window.OasisDB.putZip(chatId, a.name, a.large, blob);
    })().catch((e) => console.warn("Could not keep the zip for later:", e));
  }
  function forgetZip(chatId) {
    workZips.delete(chatId);
    if (dbOK) window.OasisDB.deleteZip(chatId).catch(() => {});
  }
  // Bring a chat's saved zip back into memory (no-op if it's already loaded or the chat has none).
  function ensureZip(chatId) {
    if (workZips.has(chatId)) return Promise.resolve(true);
    if (!dbOK || typeof JSZip === "undefined") return Promise.resolve(false);
    if (zipLoads.has(chatId)) return zipLoads.get(chatId);
    const p = (async () => {
      try {
        const rec = await window.OasisDB.getZip(chatId);
        if (!rec || !rec.blob) return false;
        const zip = await JSZip.loadAsync(rec.blob);
        if (!workZips.has(chatId)) workZips.set(chatId, Object.assign({ name: rec.name, zip, large: rec.large }, zipInfo(zip)));
        return true;
      } catch (e) { console.warn("Could not reload the saved zip:", e); return false; }
      finally { zipLoads.delete(chatId); }
    })();
    zipLoads.set(chatId, p);
    return p;
  }
  function ago(ts) {
    const m = Math.round((Date.now() - ts) / 60000);
    if (m < 1) return "Just now"; if (m < 60) return m + " min ago";
    const h = Math.round(m / 60); if (h < 24) return h + " hr ago";
    const d = Math.round(h / 24); return d === 1 ? "Yesterday" : d + " days ago";
  }

  /* ---------- Small markdown renderer ---------- */
  function md(src) {
    // Pollinations image URLs can be returned twice by some models: once as
    // the Markdown image source and again as a plain URL.  The Markdown
    // version is rendered as the image, so hide the duplicate raw URL from
    // the visible chat text.
    // The AI sometimes writes a relative link to a built-in app (apps/chess/index.html). Make it a real, clickable link.
    src = String(src || "").replace(/\]\(\s*(?:\.\/)?(?:\/)?((?:apps\/[^)\s]+|tv\.html))\s*\)/g, (m, p) => "](" + appUrl(p) + ")");
    let cleanedSrc = String(src || "").replace(/https?:\/\/image\.pollinations\.ai\/prompt\/[^\s<>'"`]+/gi, (url, offset, whole) => {
      const before = whole.slice(Math.max(0, offset - 2), offset);
      return before === "](" ? url : "";
    });

    const blocks = [];
    // Fenced code blocks get their own copy button (like ChatGPT/Claude),
    // separate from the "Copy" button that copies the whole message below.
    let s = cleanedSrc.replace(/```([\w+-]*)\n?([\s\S]*?)(```|$)/g, (m, lang, code) => {
      blocks.push(
        '<div class="code-block">' +
          '<div class="code-block-head"><span class="code-block-lang">' + esc(lang || "code") + '</span>' +
          '<button type="button" class="code-copy-btn">Copy code</button></div>' +
          '<pre><code>' + esc(code.replace(/\n$/, "")) + '</code></pre>' +
        '</div>'
      );
      return "\u0000" + (blocks.length - 1) + "\u0000";
    });
    s = esc(s);
    const inline = (t) => {
      const stashed = [];
      const stash = (html) => { stashed.push(html); return "\u0001" + (stashed.length - 1) + "\u0001"; };
      let out = t
        .replace(/`([^`\n]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>")
        .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>")
        .replace(/!\[([^\]]*)\]\((https?:\/\/(?:[^()\s]|\([^()\s]*\))+)\)/g, (m, alt, url) => stash('<img class="chat-gen-image" src="' + (blobForUrl.get(url.replace(/&amp;/g, "&")) || url) + '" data-src="' + url + '" alt="' + alt + '" title="Click to open image">'))
        // file:// links let the AI link to a locally installed app (like
        // Mystic Realm) as well as ordinary http(s) links.
        .replace(/\[([^\]]+)\]\(((?:https?|file):\/\/(?:[^()\s]|\([^()\s]*\))+)\)/g, (m, label, url) => stash('<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + label + '</a>'))
        // Auto-link any bare URL the model just typed as plain text (not
        // wrapped in the [text](url) syntax handled above), so a link
        // always shows up as a clickable link, not just text.
        .replace(/https?:\/\/[^\s<>()"']+/g, (m) => {
          const url = m.replace(/[.,!?;:]+$/, "");
          const trail = m.slice(url.length);
          return stash('<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a>') + trail;
        });
      return out.replace(/\u0001(\d+)\u0001/g, (m, i) => stashed[+i]);
    };
    const out = [];
    s.split(/\n{2,}/).forEach((para) => {
      const lines = para.split("\n");
      if (lines.every((l) => /^\s*[-*•]\s+/.test(l))) {
        out.push("<ul>" + lines.map((l) => "<li>" + inline(l.replace(/^\s*[-*•]\s+/, "")) + "</li>").join("") + "</ul>");
      } else if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
        out.push("<ol>" + lines.map((l) => "<li>" + inline(l.replace(/^\s*\d+[.)]\s+/, "")) + "</li>").join("") + "</ol>");
      } else if (/^#{1,3}\s/.test(para)) {
        lines.forEach((l) => {
          const h = l.match(/^(#{1,3})\s+(.*)$/);
          out.push(h ? "<h" + h[1].length + ">" + inline(h[2]) + "</h" + h[1].length + ">" : "<p>" + inline(l) + "</p>");
        });
      } else if (/^\u0000\d+\u0000$/.test(para.trim())) {
        out.push(para.trim());
      } else {
        out.push("<p>" + lines.map(inline).join("<br>") + "</p>");
      }
    });
    return out.join("").replace(/\u0000(\d+)\u0000/g, (m, i) => blocks[+i]);
  }

  /* ---------- AI image generation ----------
     The model is told (via a system prompt) that it can put
     [[image: a description]] in its reply to have an image made. We turn
     that into a real image URL (Pollinations' free, keyless text-to-image
     endpoint — https://image.pollinations.ai) once the reply is complete,
     then render it with the ![alt](url) support added to md() above. */
  const IMAGE_TAG_RE = /\[\[image:\s*([^\]]+?)\]\]/gi;
  const PHOTO_TAG_RE = /\[\[photo:\s*([^\]]+?)\]\]/gi;
  const SEARCH_TAG_RE = /\[\[search:\s*([^\]]+?)\]\]/gi;
  const VIDEO_TAG_RE = /\[\[video:\s*([^\]]+?)\]\]/gi;
  const WIKI_TAG_RE = /\[\[wiki:\s*([^\]]+?)\]\]/gi;
  const NASA_TAG_RE = /\[\[nasa:\s*([^\]]+?)\]\]/gi;
  const ANIME_TAG_RE = /\[\[anime:\s*([^\]]+?)\]\]/gi;
  const WEATHER_TAG_RE = /\[\[weather:\s*([^\]]+?)\]\]/gi;
  const COUNTRY_TAG_RE = /\[\[country:\s*([^\]]+?)\]\]/gi;
  const CURRENCY_TAG_RE = /\[\[currency:\s*([^\]]+?)\]\]/gi;
  const PLACE_TAG_RE = /\[\[place:\s*([^\]]+?)\]\]/gi;
  const REMEMBER_TAG_RE = /\[\[remember:\s*([^\]]+?)\]\]/gi;
  const APP_TAG_RE = /\[\[\s*(?:app|open|tool|link|launch|play|game|start|go|win|windows|winapp|native)\s*:\s*["'“”]?([^\]]+?)["'“”]?\s*\]\]/gi;

  /* ---------- Local apps installed in this browser ----------
     Apps here are NOT on the sidebar/toolbar — the only way to them is a
     typed URL or the AI opening one via the [[app: id]] tag below. Add more
     apps by giving them a folder under apps/ and an entry here. */
  const INSTALLED_APPS = {
    "mystic-realm": { path: "apps/mystic-realm/index.html", label: "Mystic Realm", emoji: "🔮" },
    "tarot": { path: "apps/mystic-realm/tarot/index.html", label: "Mystic Tarot", emoji: "🔮" },
    "horoscope": { path: "apps/mystic-realm/horoscope/index.html", label: "Horoscope", emoji: "♈" },
    "numerology": { path: "apps/mystic-realm/numerology/index.html", label: "Numerology", emoji: "🔢" },
    "dreams": { path: "apps/mystic-realm/dreams/index.html", label: "Dream Interpreter", emoji: "🌙" },
    "iching": { path: "apps/mystic-realm/iching/index.html", label: "I Ching", emoji: "☯️" },
    "astrolabe": { path: "apps/mystic-realm/astrolabe/index.html", label: "Astrolabe", emoji: "🪐" },
    "astragalomancy": { path: "apps/mystic-realm/astragalomancy/index.html", label: "Astragalomancy", emoji: "🎲" },
    "eightball": { path: "apps/mystic-realm/eightball/index.html", label: "Magic 8-Ball", emoji: "🎱" },
    "journal": { path: "apps/mystic-realm/journal/index.html", label: "Reading Journal", emoji: "📔" },
    "sitting": { path: "apps/mystic-realm/selene/index.html", label: "Private Sitting", emoji: "🕯️" },
    "lobby": { path: "apps/lobby/index.html", label: "The Lobby", emoji: "💬" },
    "maze": { path: "apps/maze-madness/index.html", label: "Maze Madness", emoji: "🌀" },
    "chess": { path: "apps/chess/index.html", label: "Chess", emoji: "♟️" },
    "tv": { path: "tv.html", label: "Live TV", emoji: "📺" },
    "slots": { path: "apps/blaze-reels/index.html", label: "Blaze Reels (slot machine)", emoji: "🎰" }
  };

  /* Build a link to a local app that survives chat-markdown parsing: new URL()
     leaves ( and ) alone, which would cut a [label](url) link short when the
     install folder is named like "oasis-ready-v11 (1)". */
  const APP_ALIASES = {
    "mysticrealm": "mystic-realm", "mystic": "mystic-realm", "mysticrealms": "mystic-realm",
    "tarotreading": "tarot", "mystictarot": "tarot", "tarotcards": "tarot",
    "dailyhoroscope": "horoscope", "astrology": "astrolabe", "birthchart": "astrolabe",
    "dream": "dreams", "dreaminterpreter": "dreams", "iching": "iching", "ching": "iching",
    "8ball": "eightball", "magic8ball": "eightball", "magiceightball": "eightball",
    "readingjournal": "journal", "privatesitting": "sitting",
    "thelobby": "lobby", "chatroom": "lobby",
    "mazemadness": "maze", "mazegame": "maze",
    "chessgame": "chess", "lmstudiochess": "chess", "playchess": "chess",
    "livetv": "tv", "television": "tv", "watchtv": "tv", "iptv": "tv", "channels": "tv", "tvhtml": "tv",
    "slot": "slots", "slotmachine": "slots", "slotmachines": "slots", "blazereels": "slots", "blaze": "slots",
    "reels": "slots", "casino": "slots", "slotgame": "slots", "gamblingslots": "slots"
  };
  const norm = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  function findInstalledApp(raw) {
    const k = String(raw || "").toLowerCase().trim();
    if (INSTALLED_APPS[k]) return INSTALLED_APPS[k];
    const n = norm(k);
    if (!n) return null;
    if (APP_ALIASES[n] && INSTALLED_APPS[APP_ALIASES[n]]) return INSTALLED_APPS[APP_ALIASES[n]];
    for (const id of Object.keys(INSTALLED_APPS)) {
      if (norm(id) === n || norm(INSTALLED_APPS[id].label) === n) return INSTALLED_APPS[id];
    }
    // Local models don't always copy the id exactly ("chess game", "the Live TV page", "apps/chess/index.html").
    // Take the longest known name that appears inside what they wrote.
    let best = null, bestLen = 0;
    const consider = (key, target) => { const kk = norm(key); if (kk.length >= 2 && n.includes(kk) && kk.length > bestLen && INSTALLED_APPS[target]) { best = INSTALLED_APPS[target]; bestLen = kk.length; } };
    Object.keys(INSTALLED_APPS).forEach((id) => { consider(id, id); consider(INSTALLED_APPS[id].label, id); });
    Object.keys(APP_ALIASES).forEach((a) => consider(a, APP_ALIASES[a]));
    // "Mystic Realm — Horoscope" contains both names; the longer one is the hub, but the person means the specific app.
    if (best && best === INSTALLED_APPS["mystic-realm"]) {
      let spec = null, specLen = 0;
      const consider2 = (key, target) => { const kk = norm(key); if (target !== "mystic-realm" && kk.length >= 3 && n.includes(kk) && kk.length > specLen && INSTALLED_APPS[target]) { spec = INSTALLED_APPS[target]; specLen = kk.length; } };
      Object.keys(INSTALLED_APPS).forEach((id) => { consider2(id, id); consider2(INSTALLED_APPS[id].label, id); });
      Object.keys(APP_ALIASES).forEach((a) => consider2(a, APP_ALIASES[a]));
      if (spec) best = spec;
    }
    return best;
  }

  /* Exact-name match only (id, label or a known alias) — used where a wrong guess would open the wrong thing. */
  function strictInstalledApp(raw) {
    const n = norm(raw); if (!n) return null;
    if (APP_ALIASES[n] && INSTALLED_APPS[APP_ALIASES[n]]) return INSTALLED_APPS[APP_ALIASES[n]];
    for (const id of Object.keys(INSTALLED_APPS)) {
      if (norm(id) === n || norm(INSTALLED_APPS[id].label) === n) return INSTALLED_APPS[id];
    }
    return null;
  }
  /* The user plainly asked to open/play/start one app ("lets play chess"). Local models sometimes forget the
     [[app: …]] tag, so the app still opens from what the user said. Only exact app names count. */
  function appFromUserRequest(text) {
    let t = String(text || "").trim().replace(/[.!?]+$/g, "").trim();
    if (!t || t.length > 90 || /\n/.test(t)) return null;
    t = t.replace(/^(?:(?:hey|hi|ok|okay|so|please|pls|can you|could you|would you|will you|can we|could we|let's|lets|let us|i want to|i wanna|i'd like to|id like to|i would like to|i feel like|take me to|bring up|pull up|fire up)\s+)+/i, "");
    const m = t.match(/^(?:open|launch|start|play|run|load|go to|show me|show)\s+(?:up\s+)?(?:the\s+|a\s+|my\s+|some\s+|a game of\s+|game of\s+)?(.{2,40}?)(?:\s+(?:app|game|please|pls|for me|now|with me|against me|against the ai|vs the ai|again))*$/i);
    return m ? strictInstalledApp(m[1]) : null;
  }

  /* "link me chess", "give me a link to the horoscope", "link it here": the person wants a clickable link in the chat,
     NOT a tab opened for them. "Open chess" still opens it. */
  function wantsLinkOnly(text) {
    const t = String(text || "").toLowerCase();
    if (/\b(open|launch|start|play)\b/.test(t) && !/\blink/.test(t)) return false;
    return /\blink\s+(me|it|them|that|those|these|us)\b/.test(t) || /\b(a |the )?links?\s+(to|for)\b/.test(t) ||
           /\bgive me (a |the )?links?\b/.test(t) || /\bsend me (a |the )?links?\b/.test(t) || /\bjust (a |the )?links?\b/.test(t) || /\blink it here\b/.test(t);
  }
  function appFromLinkRequest(text) {
    const t = String(text || "").trim().replace(/[.!?]+$/g, "").trim();
    const m = t.match(/(?:link me(?: to| the| a link to)?|give me (?:a )?link (?:to|for)|send me (?:a )?link (?:to|for)|(?:a )?link (?:to|for)|link)\s+(?:to\s+)?(?:the\s+|my\s+)?(.{2,40}?)(?:\s+(?:app|game|please|pls|here|now))*$/i);
    return m ? strictInstalledApp(m[1]) : null;
  }

  /* "open powershell" / "open cmd": returns which shell to open, or null. */
  function terminalFromUserRequest(text) {
    let t = String(text || "").trim().replace(/[.!?]+$/g, "").trim();
    if (!t || t.length > 60) return null;
    t = t.replace(/^(?:(?:hey|hi|ok|okay|so|please|pls|can you|could you|would you|will you|can we|let's|lets|i want to|i wanna|i'd like to|id like to|i need to|take me to|bring up|pull up|fire up)\s+)+/i, "");
    const m = t.match(/^(?:open|launch|start|run|bring up|show)\s+(?:up\s+)?(?:a\s+|the\s+|my\s+|new\s+)?(power\s?shell|cmd|command prompt|terminal|console|shell)(?:\s+(?:window|please|pls|for me|now|again))*$/i);
    if (!m) return null;
    return /^(cmd|command prompt)$/i.test(m[1]) ? "cmd" : "powershell";
  }

  /* Things on the left toolbar the AI may open too. "click" ones press the real toolbar button. */
  const TOOLBAR_ITEMS = {
    codelab: { label: "Code Lab", emoji: "💻", names: ["codelab", "code", "codeeditor", "editor", "onecompiler"], url: "https://onecompiler.com/python" },
    element: { label: "Oasis Chat (Element)", emoji: "💬", names: ["element", "oasiselement", "oasischat", "elementchat", "chatroom", "matrix"], url: "https://app.element.io/#/room/#oasis-lobby:matrix.org" },
    history: { label: "Chat history", emoji: "🕘", names: ["history", "chathistory", "oldchats", "pastchats"], click: "showHistory" },
    settings: { label: "Settings", emoji: "⚙️", names: ["settings", "setting", "preferences", "options", "config"], click: "openSettings" }
  };
  function findToolbarItem(raw) {
    const n = norm(raw); if (!n) return null;
    for (const id of Object.keys(TOOLBAR_ITEMS)) { const t = TOOLBAR_ITEMS[id]; if (norm(id) === n || norm(t.label) === n || t.names.includes(n)) return t; }
    return null;
  }
  function findSidebarLink(raw) {
    const n = norm(raw); if (!n || typeof links === "undefined") return null;
    let hit = links.find((l) => norm(l.name) === n);
    if (!hit) hit = links.find((l) => { const ln = norm(l.name); return ln.length >= 3 && (n.includes(ln) || ln.includes(n)); });
    return hit || null;
  }
  function toolbarPrompt() {
    let t = "\n\nTOOLBAR — the user's left toolbar has these too, and you can open them with the same kind of tag: " +
      "[[tool: codelab]] (Code Lab, an online code editor), [[tool: element]] (Oasis Chat room in Element), " +
      "[[tool: history]] (the chat history list), [[tool: settings]] (the settings window).";
    t += "\nYou can also open a well-known website or any web address in a new tab: [[link: youtube]], [[link: google]], [[link: https://example.com]].";
    if (typeof links !== "undefined" && links.length) {
      t += "\nThe user's own website links on the toolbar (open one in a new tab with [[link: name]]): " +
        links.slice(0, 30).map((l) => l.name).join(", ") + ".";
    }
    return t;
  }
  function appUrl(path) {
    return new URL(path, location.href).href.replace(/\(/g, "%28").replace(/\)/g, "%29");
  }

  /* Open a link in a new browser tab. Links the AI opens arrive after the
     reply has finished streaming, so the page has no fresh click for the
     browser to count as permission and window.open() can be silently refused.
     The browser shell's own bridge doesn't need a click, so use it first and
     fall back to window.open() (plain browsers, or an older shell). */
  function openInNewTab(url) {
    try {
      if (window.oasisProject && typeof window.oasisProject.openTab === "function") {
        window.oasisProject.openTab(String(url));
        return true;
      }
    } catch (e) {}
    try { window.open(url, "_blank"); return true; } catch (e) {}
    return false;
  }

  /* ---------- Well-known websites the AI may open in a NEW OASIS TAB ----------
     (the user's own sidebar links are checked first; this only adds a few famous names and plain web addresses). */
  const WEB_SITES = {
    google: ["Google", "https://www.google.com/"], youtube: ["YouTube", "https://www.youtube.com/"],
    wikipedia: ["Wikipedia", "https://www.wikipedia.org/"], github: ["GitHub", "https://github.com/"],
    reddit: ["Reddit", "https://www.reddit.com/"], duckduckgo: ["DuckDuckGo", "https://duckduckgo.com/"]
  };
  function webTarget(raw) {
    const t = String(raw || "").trim().replace(/^["'“”]|["'“”]$/g, "");
    if (/^https?:\/\/[^\s<>"]+$/i.test(t)) { let host = t; try { host = new URL(t).hostname; } catch (e) { return null; } return { label: host, url: t }; }
    const n = norm(t.replace(/\.com$/i, ""));
    return WEB_SITES[n] ? { label: WEB_SITES[n][0], url: WEB_SITES[n][1] } : null;
  }

  /* ---------- Native Windows apps & utilities: [[win: name]] ----------
     Opens real Windows programs (Task Manager, Device Manager, Settings pages, File Explorer, ...) OUTSIDE the browser.
     The page only sends a registry id (js/windows-apps.js); the main process (windows-launcher.js) owns the real commands,
     and asks Yes/Cancel itself for anything that changes the system. Oasis apps and websites keep using new tabs. */
  const WIN_VERB_RE = /^\[\[\s*(win|windows|winapp|native)\s*:/i;
  const OPEN_VERB_RE = /^(?:(?:hey|hi|ok|okay|so|please|pls|can you|could you|would you|will you|can we|could we|let's|lets|let us|i want to|i wanna|i'd like to|id like to|i would like to|i need to|take me to)\s+)*(?:open|launch|start|run|show|bring up|pull up|fire up|display|go to|load|view|check|see|look at)\b/i;
  const winApi = () => { const a = projApi(); return a && typeof a.winLaunch === "function" ? a : null; };
  const winOn = () => platformName() === "win32" && !!winApi() && settings.winApps !== false && !!window.OasisWin;
  function winPrompt() {
    const W = window.OasisWin;
    return "WINDOWS TOOLS — this is a Windows computer and you can open its built-in apps and utilities for the user. Put a tag on its own line: [[win: name]] " +
      "using a name or id from the lists below. It opens the real Windows program on the user's desktop, OUTSIDE the browser (never a browser tab and never a link), " +
      "so write one whenever the user asks to open, launch or show a Windows tool, for example \"open Task Manager\" -> [[win: task-manager]]. " +
      "Never write commands for these and never say you can't open Windows tools. Oasis's own apps, websites and links are different: they keep using [[app: …]] / [[link: …]] and open in a new Oasis tab.\n" +
      "OPEN THESE (ids):\n" + W.promptList() + "\n" +
      "File Explorer can open a drive or folder: [[win: D drive]], [[win: downloads folder]], [[win: desktop]], [[win: C:\\Users\\Name\\Projects]], or just [[win: file-explorer]].\n" +
      "READ-ONLY INFORMATION (the app runs it and shows the result in the chat for you; use it for questions about the user's computer): " + W.ids("query").join(", ") + ". " +
      "Example: user asks \"what CPU do I have?\" -> [[win: q-cpu]]. Then explain the shown result briefly in your next message if they ask.\n" +
      "TOOLS THAT CHANGE THINGS (the user is shown a Yes/Cancel question first, so just write the tag and wait): registry-editor, system-configuration, " + W.ids("window").join(", ") + ".\n" +
      "Rules: at most 2 [[win: …]] tags per reply unless the user named more; only when they actually asked (describing a tool in words needs no tag); " +
      "if a request could mean several tools (\"open performance\" could be Task Manager, Resource Monitor or Performance Monitor), ask which one instead of guessing.";
  }
  async function winRun(target) {
    const W = window.OasisWin, e = W && W.BY_ID[target.id];
    let res; try { res = await winApi().winLaunch({ id: target.id, arg: target.arg || "" }); } catch (err) { res = { error: err.message }; }
    return winText(e, res);
  }
  function winText(e, res) {
    const label = e ? e.label : "that tool";
    if (!res || res.error) return "🪟 Couldn't open " + label + ": " + ((res && res.error) || "no answer from the app");
    if (res.cancelled) return "🪟 Cancelled — I didn't run " + label + ".";
    if (res.query) return "🪟 **" + label + "**\n\n```\n" + String(res.output || "").replace(/`{3}/g, "ˋˋˋ") + "\n```" + (res.truncated ? "\n_(output was cut off)_" : "");
    return "🪟 Opened " + label + (res.desc && res.desc !== label ? " — " + res.desc : "") + ".";
  }
  /* The user plainly asked ("open task manager", "what CPU do I have?") but the model wrote no tag. Only exact names count, and
     launching needs an open-style verb so ordinary chat that merely contains a word like "services" never starts anything. */
  async function directFromUserRequest(userText) {
    const t = String(userText || "").trim();
    if (!t || t.length > 120 || /\n/.test(t)) return null;
    const hasVerb = OPEN_VERB_RE.test(t), W = window.OasisWin;
    if (hasVerb && W) {
      const web = webTarget(W.cleanBoth(t).bare);
      if (web) { const u = web.url; if (openInNewTab(u)) return "🌐 [" + web.label + " — opened in a new tab](" + u + ")"; }
    }
    if (!winOn()) return null;
    const r = W.resolve(t, { strict: true });
    if (!r) return null;
    if (r.ambiguous) return hasVerb ? "🪟 Do you mean " + W.joinOr(r.ambiguous.map(W.labelOf)) + "?" : null;
    const e = W.BY_ID[r.id];
    if (e && e.kind !== "query" && !hasVerb) return null;
    return winRun(r);
  }

  /* ---------- Friendly status text while a reply is still streaming ----------
     While the model is typing, its raw [[image: ...]] / [[search: ...]] / etc.
     tags are visible in the streamed text until the whole reply finishes and
     processReplyTags() turns them into the real result. That's confusing to
     look at, so for on-screen display only (never the saved/underlying text)
     we swap a finished tag for a short status line, and swap a tag that's
     still being typed out for a plain "thinking" indicator, the moment "[["
     appears. The real tag text is untouched in memory, so processReplyTags()
     still sees and handles it normally once streaming ends. */
  const STREAM_TAG_LABELS = {
    image: "🎨 Creating image…",
    photo: "🖼️ Finding a photo…",
    search: "🔍 Searching…",
    video: "🎬 Finding a video…",
    wiki: "📖 Looking up Wikipedia…",
    nasa: "🚀 Looking up NASA data…",
    anime: "📺 Looking up anime info…",
    weather: "🌤️ Checking the weather…",
    country: "🌍 Looking up country info…",
    currency: "💱 Converting currency…",
    place: "📍 Looking up a place…",
    remember: "",
    plan: "", edit: "", find: "", continue: "", done: "", waiting: "", silent: "",
    app: "✨ Opening the app…",
    open: "✨ Opening…",
    tool: "✨ Opening…",
    link: "✨ Opening…",
    launch: "✨ Opening…",
    play: "✨ Opening…",
    game: "✨ Opening…",
    start: "✨ Opening…",
    go: "✨ Opening…",
    win: "🪟 Opening on Windows…",
    windows: "🪟 Opening on Windows…",
    winapp: "🪟 Opening on Windows…",
    native: "🪟 Opening on Windows…"
  };
  const STREAM_TAG_NAMES = Object.keys(STREAM_TAG_LABELS);
  const STREAM_CLOSED_TAG_RE = new RegExp("\\[\\[(" + STREAM_TAG_NAMES.join("|") + "):\\s*[^\\]]*?\\]\\]", "gi");
  function maskStreamingTags(text) {
    if (!text) return text;
    let out = text.replace(/\[\[plan\]\][\s\S]*?(\[\[\/plan\]\]|$)/gi, "📋 _updating the plan…_")
      .replace(/\[\[edit:\s*([^\]\n]*)\]\][\s\S]*?(\[\[\/edit\]\]|$)/gi, (m, p) => "✏️ _editing " + p.trim() + "…_")
      .replace(/\[\[(continue|done|waiting|silent)\]\]/gi, "")
      .replace(/\[\[find:[^\]]*\]\]/gi, "🔎 _searching…_");
    out = out.replace(STREAM_CLOSED_TAG_RE, (m, tag) => STREAM_TAG_LABELS[tag.toLowerCase()] || "");
    // A tag still being typed out has no closing "]]" yet — as soon as "[["
    // shows up and what follows could be the start of a known tag name, hide
    // it behind a plain "thinking" indicator rather than let the partial tag
    // text (and the prompt/query inside it) render character by character.
    const openIdx = out.lastIndexOf("[[");
    if (openIdx !== -1 && out.indexOf("]]", openIdx) === -1) {
      const word = out.slice(openIdx + 2).split(":")[0].toLowerCase();
      if (STREAM_TAG_NAMES.some((name) => name.startsWith(word))) {
        out = out.slice(0, openIdx) + "…";
      }
    }
    return out;
  }

  const IMAGE_SYSTEM_PROMPT =
    "You can generate an image. To do this, put a tag on its own line, exactly like this: " +
    "[[image: a detailed description of the picture to draw]] — with nothing else on that line. " +
    "Write the description in English, be specific and visual (subject, setting, style, lighting). " +
    "Use this only when the user actually asks you to draw/create/generate/make/show a picture or image. " +
    "The tag will be replaced with the real generated image automatically, so never claim you can't make images.";

  const REAL_IMAGE_SYSTEM_PROMPT =
    "You can show an existing image from the internet as well as generate new art. For real-world visual " +
    "subjects, named people, places, landmarks, animals, objects, movies, television shows, games, books, " +
    "historical subjects, vehicles, products, and other recognizable things, you may use a real image when " +
    "it would materially help the conversation. To do this, put a tag on its own line exactly like this: " +
    "[[photo: a precise search phrase]] — with nothing else on that line. For example, when explaining " +
    "Stargate SG-1, use [[photo: Stargate SG-1 TV series]] if an image would help. Use [[image: ...]] when " +
    "the user asks for something invented, artistic, imagined, or when a generated illustration is more " +
    "appropriate. You decide which is better. Do not add an image to every ordinary answer. If a real-image " +
    "lookup fails, the app can automatically fall back to generated art when image generation is enabled. " +
    "Never claim you cannot show images just because you do not have a direct image URL.";

  const SEARCH_SYSTEM_PROMPT =
    "You can search the internet. When the user asks you to search, look up, Google, or find current/live " +
    "information online, put a tag on its own line, exactly like this: [[search: the exact search query]] " +
    "— with nothing else on that line. This automatically opens the search results for the user in a new " +
    "browser tab. Only use it when the user actually wants a web search done, not for things you already know. " +
    "You do not automatically know today's date, the current time, or events after your own training — you " +
    "have no built-in clock. If the user asks what today's date or the current time is, or asks about " +
    "anything recent/current, use [[search: current date and time]] or a similarly specific query to find out " +
    "rather than guessing. This is a real capability the app gives you: never tell the user you can't search " +
    "the internet, don't have real-time access, or can't find current information — you can, via this tag.";

  const TOOL_API_SYSTEM_PROMPT =
    "You also have structured web-data tools provided by the app. Use them when they materially help answer the user's request. " +
    "For YouTube videos, use [[video: precise search query]]. For Wikipedia facts or biographies, use [[wiki: topic]]. " +
    "For NASA space imagery/data, use [[nasa: precise topic]]. For anime information or artwork, use [[anime: title or character]]. " +
    "For weather, use [[weather: city, state/country]]. For country facts, use [[country: country name]]. " +
    "For currency conversion/rates, use [[currency: amount currency to currency]], such as [[currency: 100 USD to EUR]]. " +
    "For a geographic place/map lookup, use [[place: exact place name]]. Use the existing [[photo: ...]] tag for a real image, " +
    "and [[image: ...]] only for generated art. Do not use these tags for every answer. Only use the most relevant tool when needed. " +
    "All of these are real abilities this app gives you right now — never tell the user you can't look something up, show a picture, " +
    "check the weather, convert currency, or do any of the above; use the matching tag instead of saying you can't.";

  const APPS_SYSTEM_PROMPT =
    "This browser has local apps installed. None of them are on the sidebar or toolbar, so the only way " +
    "the user reaches them is you opening one. To open an app (or one specific section of it), put a tag " +
    "on its own line, exactly like this: [[app: id]] — with nothing else on that line, using the exact id " +
    "from the list below. This opens that app/section directly in a new browser tab and also gives the " +
    "user a clickable link to it. Never invent an id that isn't listed. If the user just says the name of " +
    "a reading or the app generally (e.g. \"open tarot\", \"do my horoscope\", \"open mystic realm\"), open " +
    "the specific section they named rather than only the general hub, so it lands them exactly where " +
    "they meant. IMPORTANT: a tag opens the app the moment you write it, so only write one when the user asks " +
    "to open, start or use that app (at most 2 per reply unless they name more). If they ask what apps you " +
    "have, or ask you to list or describe them, write the names in plain words with a short description, " +
    "NEVER a tag, then ask which one to open.\n\n" +
    "MYSTIC REALM — a divination app. Sections, each its own tag:\n" +
    "[[app: mystic-realm]] the general hub/home page for the whole app.\n" +
    "[[app: tarot]] Tarot card readings (several spreads).\n" +
    "[[app: horoscope]] daily Horoscope.\n" +
    "[[app: numerology]] Numerology.\n" +
    "[[app: dreams]] Dream interpreter.\n" +
    "[[app: iching]] I Ching reading.\n" +
    "[[app: astrolabe]] astrology birth chart.\n" +
    "[[app: astragalomancy]] Astragalomancy (dice divination).\n" +
    "[[app: eightball]] Magic 8-Ball.\n" +
    "[[app: journal]] the user's saved reading history/journal.\n" +
    "[[app: sitting]] a private one-on-one sitting/conversation with a chosen reader.\n" +
    "Mystic Realm has exactly four reader characters: Amelia, Gwen, Anja, and Eliza. There is no character " +
    "called Madame Selene in this app — she was removed — so never mention her, describe her, or list her " +
    "as one of the readers; if asked who gives the readings, name only Amelia, Gwen, Anja, and Eliza. " +
    "Every Mystic Realm reading uses this same browser's AI connection (the address/model set in " +
    "Settings), so it works automatically with whatever is configured here.\n\n" +
    "THE LOBBY — [[app: lobby]] — a multi-character group chat room the user can talk with or watch chat " +
    "among themselves. It also uses this same browser's AI connection automatically; there's no separate " +
    "connection setup for it anymore.\n\n" +
    "MAZE MADNESS — [[app: maze]] — a fullscreen maze game, no AI involved. Open it when asked to play a " +
    "maze game.\n\n" +
    "CHESS — [[app: chess]] — a chess board where the user plays White against the AI model. It has its own " +
    "chat and personality picker. Open it when the user wants to play chess, practise chess, or have a chess " +
    "teacher.\n\n" +
    "LIVE TV — [[app: tv]] — a live TV player with thousands of free channels. Open it when the user wants to " +
    "watch TV, live TV, a channel, sports or the news on TV.\n\n" +
    "BLAZE REELS — [[app: slots]] — a slot machine game with play credits only (no real money). Open it when " +
    "the user wants to play slots, a slot machine or a casino-style game.";

  const MEMORY_SYSTEM_PROMPT =
    "You have a persistent memory that carries over between separate conversations with this user. " +
    "Whenever the user shares something worth remembering long-term (their name, preferences, ongoing " +
    "projects, important facts about their life), save it by putting a tag on its own line: " +
    "[[remember: the short fact to remember]] — one tag per fact, written in third person, e.g. " +
    "[[remember: User's name is Alex]]. Only save durable facts, not one-off chat details. The tag is " +
    "stripped out before the user sees your reply, so it never appears to them.";

  // encodeURIComponent leaves ( ) ' ! * alone, and a ")" in the AI's description used to end the
  // markdown image link early, leaving the rest of the address showing as text. Encode them too,
  // and keep very long descriptions to a length the image server accepts.
  function cleanImagePrompt(prompt) {
    let t = String(prompt || "").replace(/\s+/g, " ").trim();
    if (t.length > 700) { t = t.slice(0, 700); const i = t.lastIndexOf(" "); if (i > 400) t = t.slice(0, i); }
    return t;
  }
  function pollinationsImageUrl(prompt) {
    const seed = Math.floor(Math.random() * 1e9);
    const enc = encodeURIComponent(cleanImagePrompt(prompt)).replace(/[!'()*~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
    return "https://image.pollinations.ai/prompt/" + enc + "?width=1024&height=1024&nologo=true&seed=" + seed;
  }
  const imageAlt = (t) => cleanImagePrompt(t).replace(/[\[\]]/g, " ").slice(0, 400);

  // Pollinations anonymous accounts allow only one generation in the queue at
  // a time. Keep all image-generation requests in a single browser-side queue
  // so asking for several images never creates simultaneous requests.
  let pollinationsQueue = Promise.resolve();
  // Pictures already downloaded this session (real address -> blob: address). The chat shows the blob so the
  // picture is NOT requested a second time (the free server only allows about one request every 15 seconds,
  // and that second request was a common reason images came out broken). Saved chats keep the real address.
  const blobForUrl = new Map();
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  function generatePollinationsImage(prompt) {
    const job = pollinationsQueue.then(async () => {
      const url = pollinationsImageUrl(prompt);
      let lastError = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const ctl = new AbortController();
          const timer = setTimeout(() => ctl.abort(), 150000);   // generation can be slow, but never hang forever
          let r;
          try { r = await fetch(url, { signal: ctl.signal }); }
          finally { clearTimeout(timer); }
          if (r.ok) {
            const blob = await r.blob();   // read it fully before freeing the queue slot
            if (blob.size > 0 && (!blob.type || /^image\//i.test(blob.type))) {
              try { blobForUrl.set(url, URL.createObjectURL(blob)); } catch (e) {}
              return url;
            }
            lastError = new Error("The image server did not return a picture");
            await wait(3000);
            continue;
          }
          if (r.status === 429 || r.status === 502 || r.status === 503 || r.status === 504) {
            const ra = Number(r.headers.get("retry-after"));
            await wait(Math.min(20000, ra > 0 ? ra * 1000 : 2500 * (attempt + 1)));
            lastError = new Error("The image server is busy (HTTP " + r.status + ")");
            continue;
          }
          lastError = new Error("Image server returned HTTP " + r.status);
          break;
        } catch (e) {
          lastError = e;
          await wait(Math.min(8000, 800 * Math.pow(2, attempt)));
        }
      }
      throw lastError || new Error("Image generation failed");
    });
    // Keep the queue alive after an individual failure so later images still run.
    pollinationsQueue = job.catch(() => null);
    return job;
  }

  // Looks up a real, already-existing photo for `query` using free, keyless
  // public APIs (tried in order). Returns { url, source } or null if nothing
  // usable was found — callers fall back to a generated image in that case.
  function isUnreliableImageHost(url) {
    try { const host = new URL(url).hostname.toLowerCase(); return host === "fandom.com" || host.endsWith(".fandom.com") || host === "wikia.com" || host.endsWith(".wikia.com"); }
    catch (e) { return false; }
  }

  // Loads the picture for real (like the chat will) and only accepts it if it opens and is big enough.
  // Many "found" image addresses are dead, blocked or not pictures at all.
  function imageLoads(url, ms) {
    return new Promise((resolve) => {
      let done = false;
      const img = new Image();
      const finish = (ok) => { if (done) return; done = true; clearTimeout(t); img.onload = img.onerror = null; resolve(ok); };
      const t = setTimeout(() => finish(false), ms || 9000);
      img.onload = () => finish(img.naturalWidth >= 150 && img.naturalHeight >= 100);
      img.onerror = () => finish(false);
      try { img.referrerPolicy = "no-referrer"; } catch (e) {}
      img.src = url;
    });
  }
  const queryWords = (q) => String(q || "").toLowerCase().match(/[a-z0-9]{3,}/g) || [];

  async function findRealPhotoUrl(query) {
    const q = query.trim();
    if (!q) return null;
    const words = queryWords(q);
    const sources = [];

    // Wikipedia: the best match for named people, places, animals, objects and things.
    sources.push(async () => {
      const j = await apiJson("https://en.wikipedia.org/w/api.php?action=query&origin=*&format=json&redirects=1&generator=search&gsrlimit=5&gsrsearch=" +
        encodeURIComponent(q) + "&prop=pageimages&piprop=thumbnail&pithumbsize=900");
      const pages = j && j.query && j.query.pages ? Object.values(j.query.pages) : [];
      return pages.filter((p) => p.thumbnail && p.thumbnail.source).sort((x, y) => (x.index || 99) - (y.index || 99)).map((p) => ({
        url: p.thumbnail.source, source: "https://en.wikipedia.org/?curid=" + p.pageid, credit: "Wikipedia — " + p.title }));
    });

    // TV artwork: only when the show's name really matches what was asked for.
    sources.push(async () => {
      const j = await apiJson("https://api.tvmaze.com/search/shows?q=" + encodeURIComponent(q));
      return (j || []).map((x) => x && x.show).filter((x) => x && x.image && (x.image.original || x.image.medium)).filter((x) => {
        const nw = queryWords(x.name); return nw.length && nw.every((w) => words.includes(w));
      }).slice(0, 2).map((x) => ({ url: x.image.original || x.image.medium, source: x.url || "https://www.tvmaze.com/", credit: "Image: TVMaze — " + (x.name || q) }));
    });

    // TMDB (optional free key): movies, TV, actors.
    if (settings.tmdbKey) sources.push(async () => {
      const j = await apiJson("https://api.themoviedb.org/3/search/multi?query=" + encodeURIComponent(q) + "&include_adult=false&page=1&language=en-US",
        { headers: { Authorization: "Bearer " + settings.tmdbKey, accept: "application/json" } });
      return ((j && j.results) || []).filter((x) => x && (x.media_type === "tv" || x.media_type === "movie" || x.media_type === "person") &&
        (x.poster_path || x.backdrop_path || x.profile_path)).slice(0, 2).map((x) => ({
          url: "https://image.tmdb.org/t/p/w780" + (x.poster_path || x.backdrop_path || x.profile_path),
          source: "https://www.themoviedb.org/" + x.media_type + "/" + x.id, credit: "Image/data from TMDB: " + (x.name || x.title || q) }));
    });

    // Wikimedia Commons: millions of openly licensed photos. Ask for a sized thumbnail (originals can be huge or not pictures).
    sources.push(async () => {
      const j = await apiJson("https://commons.wikimedia.org/w/api.php?origin=*&format=json&action=query&generator=search&gsrnamespace=6&gsrlimit=8&gsrsearch=" +
        encodeURIComponent(q) + "&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=1000");
      const pages = j && j.query && j.query.pages ? Object.values(j.query.pages) : [];
      return pages.filter((p) => p.imageinfo && p.imageinfo[0] && /^image\/(jpeg|png|webp|gif)$/i.test(p.imageinfo[0].mime || "") && (p.imageinfo[0].thumburl || p.imageinfo[0].url))
        .sort((x, y) => (x.index || 99) - (y.index || 99)).slice(0, 4).map((p) => {
          const info = p.imageinfo[0], meta = info.extmetadata || {};
          const author = meta.Artist && meta.Artist.value ? meta.Artist.value.replace(/<[^>]+>/g, "") : "";
          return { url: info.thumburl || info.url, source: info.descriptionurl || ("https://commons.wikimedia.org/wiki/Special:MediaSearch?search=" + encodeURIComponent(q)),
            credit: "Wikimedia Commons" + (author ? " — " + author : "") };
        });
    });

    // Openverse: openly licensed / public-domain media. Its own proxied thumbnail is the most reliable address.
    sources.push(async () => {
      const j = await apiJson("https://api.openverse.org/v1/images/?page_size=10&q=" + encodeURIComponent(q));
      return ((j && j.results) || []).filter((x) => x && (x.thumbnail || x.url) && !isUnreliableImageHost(x.url || x.thumbnail)).slice(0, 4).map((x) => ({
        url: x.thumbnail || x.url, source: x.foreign_landing_url || x.url, credit: (x.title ? x.title + " — " : "") + "Openverse" }));
    });

    // Optional Pexels key (free; attribution required).
    if (settings.pexelsKey) sources.push(async () => {
      const j = await apiJson("https://api.pexels.com/v1/search?query=" + encodeURIComponent(q) + "&per_page=6", { headers: { Authorization: settings.pexelsKey } });
      return ((j && j.photos) || []).filter((x) => x && x.src).slice(0, 3).map((x) => ({
        url: x.src.large2x || x.src.large || x.src.medium, source: x.url, credit: "Photo by " + (x.photographer || "Pexels") + " on Pexels" }));
    });

    // Optional Pixabay key.
    if (settings.pixabayKey) sources.push(async () => {
      const j = await apiJson("https://pixabay.com/api/?key=" + encodeURIComponent(settings.pixabayKey) + "&q=" + encodeURIComponent(q) + "&image_type=photo&per_page=6&safesearch=true");
      return ((j && j.hits) || []).filter((x) => x && (x.webformatURL || x.largeImageURL)).slice(0, 3).map((x) => ({
        url: x.webformatURL || x.largeImageURL, source: x.pageURL || "https://pixabay.com/", credit: "Image from Pixabay" }));
    });

    for (const get of sources) {
      let cands = [];
      try { cands = (await get()) || []; } catch (e) { cands = []; }
      for (const c of cands) {
        if (!c.url || isUnreliableImageHost(c.url)) continue;
        if (await imageLoads(c.url)) return c;
      }
    }
    return null;
  }

  async function apiJson(url, options={}) {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 12000);
    try { const r = await fetch(url, Object.assign({ signal: ctl.signal }, options)); if (!r.ok) return null; return await r.json(); }
    catch (e) { return null; }
    finally { clearTimeout(timer); }
  }

  async function findYouTube(query) {
    if (!settings.youtubeKey) return null;
    const j = await apiJson("https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=3&q=" + encodeURIComponent(query) + "&key=" + encodeURIComponent(settings.youtubeKey));
    const hit = j && j.items && j.items[0];
    if (!hit || !hit.id || !hit.id.videoId) return null;
    return { id: hit.id.videoId, title: hit.snippet.title, channel: hit.snippet.channelTitle, url: "https://www.youtube.com/watch?v=" + hit.id.videoId };
  }

  async function findWikipedia(query) {
    const j = await apiJson("https://en.wikipedia.org/w/api.php?action=query&origin=*&format=json&generator=search&gsrsearch=" + encodeURIComponent(query) + "&gsrlimit=1&prop=extracts|pageimages&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=700");
    const pages = j && j.query && j.query.pages;
    const hit = pages && Object.values(pages)[0];
    if (!hit) return null;
    return { title: hit.title, extract: hit.extract || "", image: hit.thumbnail && hit.thumbnail.source, url: "https://en.wikipedia.org/?curid=" + hit.pageid };
  }

  async function findNASA(query) {
    const key = settings.nasaKey || "DEMO_KEY";
    const j = await apiJson("https://images-api.nasa.gov/search?q=" + encodeURIComponent(query) + "&media_type=image&page_size=3");
    const item = j && j.collection && j.collection.items && j.collection.items[0];
    if (!item) return null;
    const data = item.data && item.data[0], links = item.links || [];
    return { title: data && data.title || query, description: data && data.description || "", image: links[0] && links[0].href, url: data && data.nasa_id ? "https://images.nasa.gov/details/" + data.nasa_id : "https://images.nasa.gov/" };
  }

  async function findAnime(query) {
    const j = await apiJson("https://api.jikan.moe/v4/anime?q=" + encodeURIComponent(query) + "&limit=1");
    const hit = j && j.data && j.data[0];
    if (!hit) return null;
    return { title: hit.title, synopsis: hit.synopsis || "", image: hit.images && hit.images.jpg && hit.images.jpg.large_image_url, url: hit.url };
  }

  async function findWeather(query) {
    const g = await apiJson("https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(query) + "&count=1&language=en&format=json");
    const loc = g && g.results && g.results[0];
    if (!loc) return null;
    const w = await apiJson("https://api.open-meteo.com/v1/forecast?latitude=" + loc.latitude + "&longitude=" + loc.longitude + "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph");
    if (!w || !w.current) return null;
    const c=w.current;
    return { location: [loc.name,loc.admin1,loc.country].filter(Boolean).join(", "), temp:c.temperature_2m, feels:c.apparent_temperature, humidity:c.relative_humidity_2m, wind:c.wind_speed_10m, code:c.weather_code };
  }

  async function findCountry(query) {
    const j = await apiJson("https://restcountries.com/v3.1/name/" + encodeURIComponent(query) + "?fields=name,capital,region,population,flags,currencies,languages");
    const hit = j && j[0]; if (!hit) return null;
    return hit;
  }

  async function findCurrency(query) {
    const m = query.match(/([0-9][0-9.,]*)\s*([A-Za-z]{3})\s*(?:to|in|into|->|→|=)\s*([A-Za-z]{3})/i);
    if (!m) return null;
    const amount=Number(m[1].replace(/,/g,"")), from=m[2].toUpperCase(), to=m[3].toUpperCase();
    const j=await apiJson("https://api.frankfurter.app/latest?amount="+amount+"&from="+from+"&to="+to);
    if (!j || !j.rates || j.rates[to] == null) return null;
    return { amount, from, to, result:j.rates[to], date:j.date };
  }

  async function findPlace(query) {
    const j=await apiJson("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q="+encodeURIComponent(query), {headers:{"Accept":"application/json"}});
    const hit=j && j[0]; if(!hit) return null;
    return { name:hit.display_name, lat:hit.lat, lon:hit.lon, type:hit.type };
  }

  // Turns [[image: ...]] tags into generated images, [[photo: ...]] tags into
  // a real looked-up photo (or a generated fallback), [[search: ...]] tags
  // into an opened browser tab + link, and [[remember: ...]] tags into saved
  // memory notes (stripped from what the user sees).
  async function processReplyTags(reply, userText, chat) {
    if (!reply.content) return [];
    // A tag wrapped in a code block or backticks used to open the tab but show raw, unclickable text. Unwrap it first.
    reply.content = reply.content
      .replace(/```[\w+-]*[ \t]*\n?\s*(\[\[[^\]\n]{1,200}\]\])\s*\n?```/g, "$1")
      .replace(/`(\[\[[^\]\n]{1,200}\]\])`/g, "$1");
    if (chat) await extractEditTags(reply, chat);
    const held = extractFileTags(reply);
    // Anything inside the model's <think>…</think> is its private reasoning. Tags in there must not open apps or
    // make images, so set those blocks aside while tags are processed and put them back afterwards.
    reply.content = reply.content.replace(/<(think|thinking|reasoning)>[\s\S]*?(?:<\/\1>|$)/gi, (blk) => { held.push(blk); return "\uE000" + (held.length - 1) + "\uE000"; });
    extractRunTags(reply);
    if (chat) extractControlTags(reply, chat);
    const reads = extractReadTags(reply); extractFindTags(reply, reads);
    try { await processReplyTagsInner(reply, userText); }
    finally { reply.content = reply.content.replace(/\uE000(\d+)\uE000/g, (m, i) => held[+i] !== undefined ? held[+i] : m); }
    return reads;
  }
  async function processReplyTagsInner(reply, userText) {
    if (!reply.content) return;
    if (settings.imageGen) {
      const imageMatches = [...reply.content.matchAll(IMAGE_TAG_RE)];
      // IMPORTANT: process generated images sequentially. Pollinations'
      // anonymous tier has a max queue size of one.
      for (const m of imageMatches) {
        if (cancelledReplies.has(reply)) return;
        const prompt = m[1].trim();
        let url = null;
        try {
          url = await generatePollinationsImage(prompt);
        } catch (e) {}
        if (url) {
          reply.content = reply.content.replace(m[0], () => "![" + imageAlt(prompt) + "](" + url + ")");
        } else {
          reply.content = reply.content.replace(m[0], () => '_(the image could not be made right now — the image service did not answer. Ask again in a moment.)_');
        }
      }
    }
    if (cancelledReplies.has(reply)) return;
    if (settings.realImages || settings.imageGen) {
      const matches = [...reply.content.matchAll(PHOTO_TAG_RE)];
      for (const m of matches) {
        if (cancelledReplies.has(reply)) return;
        const query = m[1].trim();
        let found = null;
        if (settings.realImages) { try { found = await findRealPhotoUrl(query); } catch (e) {} }
        let url = found && found.url;
        if (!url && settings.imageGen) {
          try { url = await generatePollinationsImage(query); } catch (e) { url = null; }
        }
        if (url) {
          const credit = found && found.credit ? "\n\n_" + found.credit + (found.source ? " — [source](" + found.source + ")" : "") + "_" : "";
          reply.content = reply.content.replace(m[0], () => "![" + imageAlt(query) + "](" + url + ")" + credit);
        } else {
          reply.content = reply.content.replace(m[0], '_(couldn\'t find a photo of "' + query + '")_');
        }
      }
    }
    if (cancelledReplies.has(reply)) return;
    reply.content = reply.content.replace(VIDEO_TAG_RE, (m, q) => "[[__video_pending__:" + q.trim().replace(/\]/g, "") + "]]" );
    for (const m of [...reply.content.matchAll(/\[\[__video_pending__:\s*([^\]]+?)\]\]/gi)]) {
      const q=m[1].trim(); const hit=await findYouTube(q);
      const html=hit ? "🎬 ["+hit.title+"]("+hit.url+") — "+hit.channel : "_(YouTube search unavailable. Add a YouTube API key in Settings.)_";
      reply.content=reply.content.replace(m[0],html);
    }
    if (cancelledReplies.has(reply)) return;
    for (const m of [...reply.content.matchAll(WIKI_TAG_RE)]) {
      const q=m[1].trim(), hit=await findWikipedia(q);
      const html=hit ? (hit.image ? "!["+hit.title+"]("+hit.image+")\n\n" : "") + "**"+hit.title+"**\n\n" + hit.extract + "\n\n[Wikipedia source]("+hit.url+")" : "_(Wikipedia lookup failed.)_";
      reply.content=reply.content.replace(m[0],html);
    }
    if (cancelledReplies.has(reply)) return;
    for (const m of [...reply.content.matchAll(NASA_TAG_RE)]) {
      const q=m[1].trim(), hit=await findNASA(q);
      const html=hit ? (hit.image ? "!["+hit.title+"]("+hit.image+")\n\n" : "") + "**NASA: "+hit.title+"**\n\n" + (hit.description||"") + "\n\n[NASA source]("+hit.url+")" : "_(NASA lookup failed.)_";
      reply.content=reply.content.replace(m[0],html);
    }
    if (cancelledReplies.has(reply)) return;
    for (const m of [...reply.content.matchAll(ANIME_TAG_RE)]) {
      const q=m[1].trim(), hit=await findAnime(q);
      const html=hit ? (hit.image ? "!["+hit.title+"]("+hit.image+")\n\n" : "") + "**"+hit.title+"**\n\n"+(hit.synopsis||"")+"\n\n[Jikan/MAL source]("+hit.url+")" : "_(Anime lookup failed.)_";
      reply.content=reply.content.replace(m[0],html);
    }
    if (cancelledReplies.has(reply)) return;
    for (const m of [...reply.content.matchAll(WEATHER_TAG_RE)]) {
      const q=m[1].trim(), hit=await findWeather(q);
      const html=hit ? "🌤️ **"+hit.location+"**: "+hit.temp+"°F, feels like "+hit.feels+"°F, humidity "+hit.humidity+"%, wind "+hit.wind+" mph." : "_(Weather lookup failed.)_";
      reply.content=reply.content.replace(m[0],html);
    }
    if (cancelledReplies.has(reply)) return;
    for (const m of [...reply.content.matchAll(COUNTRY_TAG_RE)]) {
      const q=m[1].trim(), hit=await findCountry(q);
      const currency=hit && hit.currencies ? Object.keys(hit.currencies).join(", ") : "";
      const langs=hit && hit.languages ? Object.values(hit.languages).join(", ") : "";
      const html=hit ? (hit.flags && hit.flags.png ? "![Flag of "+(hit.name?.common||q)+"]("+hit.flags.png+")\n\n" : "") + "**"+(hit.name?.common||q)+"**\n\nCapital: "+((hit.capital||[]).join(", ")||"N/A")+" · Region: "+(hit.region||"N/A")+" · Population: "+(hit.population||"N/A").toLocaleString()+" · Currency: "+currency+" · Languages: "+langs : "_(Country lookup failed.)_";
      reply.content=reply.content.replace(m[0],html);
    }
    if (cancelledReplies.has(reply)) return;
    for (const m of [...reply.content.matchAll(CURRENCY_TAG_RE)]) {
      const q=m[1].trim(), hit=await findCurrency(q);
      const html=hit ? "💱 **"+hit.amount+" "+hit.from+" = "+hit.result.toFixed(2)+" "+hit.to+"** (rate date: "+hit.date+")" : "_(Currency lookup failed. Use a format such as `100 USD to EUR`.)_";
      reply.content=reply.content.replace(m[0],html);
    }
    if (cancelledReplies.has(reply)) return;
    for (const m of [...reply.content.matchAll(PLACE_TAG_RE)]) {
      const q=m[1].trim(), hit=await findPlace(q);
      const html=hit ? "📍 **"+hit.name+"**\n\n[Open in OpenStreetMap](https://www.openstreetmap.org/?mlat="+encodeURIComponent(hit.lat)+"&mlon="+encodeURIComponent(hit.lon)+"#map=15/"+encodeURIComponent(hit.lat)+"/"+encodeURIComponent(hit.lon)+")" : "_(Place lookup failed.)_";
      reply.content=reply.content.replace(m[0],html);
    }
    if (cancelledReplies.has(reply)) return;
    if (settings.webSearch) {
      // Default to opening the results as a new tab (a "pop up"). If the
      // user's own message asked for a link instead, just show the link
      // and leave opening it up to them.
      const justLink = /\blinks?\b/i.test(userText || "");
      reply.content = reply.content.replace(SEARCH_TAG_RE, (m, q) => {
        const query = q.trim();
        const url = "https://duckduckgo.com/?q=" + encodeURIComponent(query);
        if (justLink) return "🔍 [Search: " + query + "](" + url + ")";
        openInNewTab(url);
        return "🔍 [Search: " + query + " — opened in a new tab](" + url + ")";
      });
    }
    if (cancelledReplies.has(reply)) return;
    // Odd shapes some models write: [app: chess] (one bracket) and [[chess]] (no verb). Treat them as the normal tag.
    reply.content = reply.content.replace(/(^|[^\[])\[\s*(app|open|launch|tool|win)\s*:\s*([^\[\]\n]{1,60}?)\s*\](?![\](\[])/gi, (m, pre, v, id) => pre + "[[" + (/^win$/i.test(v) ? "win" : "app") + ": " + id + "]]");
    reply.content = reply.content.replace(/\[\[\s*([^\]:\[\n]{2,40}?)\s*\]\]/g, (m, id) => { const a = strictInstalledApp(id); return a ? "[[app: " + id.trim() + "]]" : m; });
    // A reply with many app tags is a list, not a request: show clickable links but open nothing.
    const MAX_AUTO_OPEN = 3;
    const appTagCount = (reply.content.match(APP_TAG_RE) || []).length;
    const listOnly = appTagCount > MAX_AUTO_OPEN;
    const openedNow = new Set();   // never open the same thing twice from one reply
    const linkOnly = wantsLinkOnly(userText);   // "link me ..." -> show links, open nothing
    const openOnce = (u) => { if (openedNow.has(u)) return false; openedNow.add(u); if (!linkOnly) openInNewTab(u); return true; };
    // Windows tools: resolve and launch first (async), then the synchronous replace below drops in their result text.
    const winDone = new Map(), winUsed = new Set(), winSeen = new Set();
    if (window.OasisWin) {
      const W = window.OasisWin;
      for (const tm of [...reply.content.matchAll(APP_TAG_RE)]) {
        if (winDone.has(tm[0])) continue;
        const winVerb = WIN_VERB_RE.test(tm[0]), idRaw = tm[1].trim();
        // Oasis apps and toolbar items keep their exact names (so "settings" is still Oasis's own settings window).
        if (!winVerb && (strictInstalledApp(idRaw) || findToolbarItem(idRaw))) continue;
        const r = W.resolve(idRaw, { strict: !winVerb });
        if (!r) continue;
        if (!winOn()) { winDone.set(tm[0], "🪟 _(Windows tools only work in the Windows version of Oasis, with “Windows tools” turned on in Settings.)_"); continue; }
        if (r.ambiguous) { winDone.set(tm[0], "🪟 Do you mean " + W.joinOr(r.ambiguous.map(W.labelOf)) + "?"); continue; }
        const key = r.id + "|" + (r.arg || ""), label = W.labelOf(r.id);
        if (listOnly || linkOnly) { winDone.set(tm[0], "🪟 " + label); continue; }
        if (winSeen.has(key)) { winDone.set(tm[0], ""); continue; }
        winSeen.add(key);
        winDone.set(tm[0], await winRun(r));
        if (cancelledReplies.has(reply)) return;
      }
    }
    reply.content = reply.content.replace(APP_TAG_RE, (m, id) => {
      if (winDone.has(m)) { if (winUsed.has(m)) return ""; winUsed.add(m); return winDone.get(m); }
      const app = findInstalledApp(id);
      if (!app) {
        const tool = findToolbarItem(id);
        if (tool) {
          if (listOnly) return tool.emoji + " " + tool.label;
          if (tool.url) { if (!openOnce(tool.url)) return ""; return tool.emoji + " [" + tool.label + " — opened in a new tab](" + tool.url + ")"; }
          const btn = $(tool.click); if (btn) setTimeout(() => btn.click(), 50);
          return tool.emoji + " " + tool.label + " — opened";
        }
        const lk = findSidebarLink(id);
        if (lk) {
          if (listOnly) return "🌐 [" + lk.name + "](" + lk.url + ")";
          if (!openOnce(lk.url)) return "";
          return "🌐 [" + lk.name + " — opened in a new tab](" + lk.url + ")";
        }
        const web = webTarget(id);
        if (web) {
          if (listOnly) return "🌐 [" + web.label + "](" + web.url + ")";
          if (!openOnce(web.url)) return "";
          return "🌐 [" + web.label + " — opened in a new tab](" + web.url + ")";
        }
        return '_(There is no app, tool or link called "' + id.trim() + '" here.)_';
      }
      const url = appUrl(app.path);
      if (listOnly) return app.emoji + " [" + app.label + "](" + url + ")";
      if (!openOnce(url)) return "";
      return app.emoji + " [" + app.label + " — opened in a new tab](" + url + ")";
    });
    // The user asked to open/play an app but the model wrote no tag: open it anyway.
    if (!appTagCount) {
      const asked = linkOnly ? appFromLinkRequest(userText) : appFromUserRequest(userText);
      if (asked) {
        const url = appUrl(asked.path);
        if (!reply.content.includes(url) && openOnce(url)) {
          reply.content = reply.content.replace(/\s+$/, "") + "\n\n" + asked.emoji + " [" + asked.label + " — opened in a new tab](" + url + ")";
        }
      } else if (!linkOnly) {
        // Not an Oasis app: maybe a website or a Windows tool the user asked for by name.
        const extra = await directFromUserRequest(userText);
        if (extra && !cancelledReplies.has(reply)) reply.content = reply.content.replace(/\s+$/, "") + "\n\n" + extra;
      }
    }
    if (linkOnly) reply.content = reply.content.replace(/ — opened in a new tab\]/g, "]");
    // "open powershell": the window is empty and you asked for it, so open it right away instead of asking again.
    const termShell = terminalFromUserRequest(userText);
    if (termShell && platformName() === "win32" && settings.commands !== false) {
      const tapi = projApi();
      if (tapi && typeof tapi.terminalOpen === "function") {
        if (reply.runs) { reply.runs = reply.runs.filter((r) => !(r.kind === "terminal" && !r.cmd)); if (!reply.runs.length) delete reply.runs; }
        reply.content = reply.content.replace(/🖥️ _proposed opening[^\n]*_/g, "").replace(/\[{1,2}\/?terminal[^\]\n]*\]{1,2}/gi, "");
        let tres; try { tres = await tapi.terminalOpen({ shell: termShell, command: "" }); } catch (e) { tres = { error: e.message }; }
        reply.content = reply.content.replace(/\s+$/, "") + "\n\n🖥️ " + (tres && tres.ok ? "Opened " + shellLabel(termShell) + " in " + (tres.cwd || "your folder") + "." : "Couldn't open " + shellLabel(termShell) + ": " + ((tres && tres.error) || "unknown error"));
      }
    }
    if (settings.memoryEnabled) {
      let learned = [];
      reply.content = reply.content.replace(REMEMBER_TAG_RE, (m, fact) => { learned.push(fact.trim()); return ""; });
      if (learned.length) {
        const existing = settings.memory ? settings.memory.split("\n").filter(Boolean) : [];
        learned.forEach((f) => { if (f && !existing.includes(f)) existing.push(f); });
        settings.memory = existing.slice(-200).join("\n");
        store.set("lmchat.settings", settings);
      }
      reply.content = reply.content.replace(/\n{3,}/g, "\n\n").trim();
    }
  }

  // Past-conversation recall. Every time you send a message the model is given (1) a short index of
  // your recent chats (titles + when), and (2) the most relevant passages from ALL saved chats,
  // found by weighted keyword matching (rarer words count more, title matches count extra).
  const STOPWORDS = new Set(["the","and","but","are","was","were","for","with","that","this","you","your","what","does","did","can","could","would","about","have","has","had","just","like","how","when","where","why","who","which","there","their","them","they","then","than","into","from","been","will","also","some","any","get","got","not","its","too","very","really","hello","hey","thanks","thank","please","okay","yeah","yes","tell","say","said","know","want","need","let","give","make","here","now"]);
  function tokenize(s) { return (s || "").toLowerCase().match(/[a-z0-9']{3,}/g) || []; }
  function recallText(m) {
    if (m.hidden) return "";
    const t = typeof m.content === "string" ? m.content : (m.display || "[image/attachment]");
    return String(t).replace(/!\[[^\]]*\]\([^)]*\)/g, "[image]").replace(/\[\[[^\]]*\]\]/g, "").replace(/\s+/g, " ").trim();
  }
  function findRelevantPastExcerpt(queryText, excludeId) {
    const others = chats.filter((c) => c.id !== excludeId && c.messages && c.messages.length);
    if (!others.length) return null;
    const newest = others.slice().sort((a, b) => b.updated - a.updated);
    const out = ["Your saved past conversations with this user, newest first:\n" +
      newest.slice(0, 15).map((c) => { const lm = c.messages[c.messages.length - 1]; const snip = lm ? recallText(lm).slice(0, 90) : ""; return '- "' + c.title + '" (' + ago(c.updated) + ")" + (snip ? " — ended with: " + snip : ""); }).join("\n")];

    const q = [...new Set(tokenize(queryText).filter((t) => !STOPWORDS.has(t)))];
    const asksRecall = /\b(remember|recall|earlier|before|last time|previous|previously|yesterday|we (talked|discussed|chatted|spoke)|did i (say|tell|mention|ask)|you (said|told|mentioned)|old chat|past chat|our (last|previous) (chat|conversation)|(last|previous|recent|other) (chats?|conversations?)|what (did|were) we)\b/i.test(queryText || "");

    const docs = others.map((c) => {
      const per = c.messages.map((m) => new Set(tokenize(recallText(m))));
      const all = new Set(); per.forEach((st) => st.forEach((t) => all.add(t)));
      return { c, per, all, title: new Set(tokenize(c.title)) };
    });
    const idf = (t) => Math.log(1 + docs.length / (1 + docs.filter((d) => d.all.has(t)).length));
    const need = Math.min(2, q.length);
    const hits = docs.map((d) => {
      const matched = q.filter((t) => d.all.has(t));
      if (!q.length || matched.length < need) return null;
      let score = 0; matched.forEach((t) => { score += idf(t) * (d.title.has(t) ? 2 : 1); });
      let best = 0, bestScore = -1;
      d.per.forEach((st, i) => { let x = 0; q.forEach((t) => { if (st.has(t)) x += idf(t); }); if (x > bestScore) { bestScore = x; best = i; } });
      return { d, score, best };
    }).filter(Boolean).sort((a, b) => b.score - a.score || b.d.c.updated - a.d.c.updated).slice(0, 3);

    const show = (c, from, to, label) => label + ' "' + c.title + '" (' + ago(c.updated) + "):\n" +
      c.messages.slice(from, to).map((m) => (m.role === "user" ? "User: " : "You: ") + recallText(m).slice(0, 500)).join("\n");

    hits.forEach((h) => { const n = h.d.c.messages.length; out.push(show(h.d.c, Math.max(0, h.best - 1), Math.min(n, h.best + 3), "Relevant passage from")); });
    if (asksRecall) {   // asking about earlier chats: always include how the newest ones ended
      const seen = new Set(hits.map((h) => h.d.c.id));
      newest.filter((c) => !seen.has(c.id)).slice(0, 3).forEach((c, i) =>
        out.push(show(c, Math.max(0, c.messages.length - (i === 0 ? 8 : 4)), c.messages.length, "End of")));
    }
    return out.join("\n\n").slice(0, 5500);
  }

  /* ---------- Sidebar ---------- */
  const linksEl = $("links");
  const svgWrap = (key) => '<svg viewBox="0 0 24 24">' + (ICONS[key] || ICONS.globe) + '</svg>';
  let links = (() => {
    const saved = store.get("lmchat.links", null);
    return Array.isArray(saved) ? saved.filter((l) => l && l.url) : DEFAULT_LINKS.map((l) => Object.assign({}, l));
  })();
  function renderLinks() {
    linksEl.innerHTML = "";
    links.forEach((l) => {
      const a = document.createElement("a");
      a.className = "rail-item";
      a.href = l.url; a.target = "_blank"; a.rel = "noopener noreferrer"; a.title = l.name;
      a.innerHTML = svgWrap(l.icon);
      const sp = document.createElement("span"); sp.textContent = l.name; a.appendChild(sp);
      linksEl.appendChild(a);
    });
  }
  renderLinks();

  /* ---------- Add / edit / remove links ---------- */
  const linksDlg = $("linksDlg"), lkList = $("lkList"), lkMsg = $("lkMsg");
  let draft = [];
  function normalizeUrl(raw) {
    let u = (raw || "").trim();
    if (!u) return "";
    if (!/^https?:\/\//i.test(u)) u = (/^(localhost|\d{1,3}(\.\d{1,3}){3})(:|\/|$)/i.test(u) ? "http://" : "https://") + u;
    if (/\s/.test(u)) return "";
    try {
      const x = new URL(u);
      const hostOk = /^[\w.-]+$/.test(x.hostname) || x.hostname.charAt(0) === "[";
      return /^https?:$/.test(x.protocol) && hostOk ? x.href : "";
    } catch (e) { return ""; }
  }
  function closePickers() { lkList.querySelectorAll(".lk-picker").forEach((p) => p.remove()); }
  function addRow(l) {
    const row = document.createElement("div");
    row.className = "lk-row";
    row._icon = l.icon || "globe";
    const ic = document.createElement("button");
    ic.type = "button"; ic.className = "lk-ic"; ic.title = "Change icon"; ic.setAttribute("aria-label", "Change icon");
    ic.innerHTML = svgWrap(row._icon);
    const name = document.createElement("input");
    name.className = "lk-name"; name.placeholder = "Name"; name.value = l.name || ""; name.autocomplete = "off"; name.setAttribute("aria-label", "Link name");
    const url = document.createElement("input");
    url.className = "lk-url"; url.placeholder = "https://example.com"; url.value = l.url || ""; url.autocomplete = "off"; url.spellcheck = false; url.setAttribute("aria-label", "Link address");
    const x = document.createElement("button");
    x.type = "button"; x.className = "lk-x"; x.title = "Remove this link"; x.setAttribute("aria-label", "Remove this link"); x.textContent = "×";
    x.onclick = () => { row.remove(); lkMsg.textContent = ""; };
    ic.onclick = () => {
      const open = row.nextElementSibling && row.nextElementSibling.classList.contains("lk-picker");
      closePickers();
      if (open) return;
      const pk = document.createElement("div"); pk.className = "lk-picker";
      Object.keys(ICONS).forEach((k) => {
        const b = document.createElement("button");
        b.type = "button"; b.title = k; b.setAttribute("aria-label", k); b.innerHTML = svgWrap(k);
        if (k === row._icon) b.classList.add("sel");
        b.onclick = () => { row._icon = k; ic.innerHTML = svgWrap(k); pk.remove(); };
        pk.appendChild(b);
      });
      row.after(pk);
      pk.scrollIntoView({ block: "nearest" });
    };
    row.append(ic, name, url, x);
    lkList.appendChild(row);
    return row;
  }
  function fillRows(list) { lkList.innerHTML = ""; lkMsg.textContent = ""; list.forEach(addRow); }
  function openLinksEditor() {
    fillRows(links);
    if (!links.length) addRow({});
    linksDlg.showModal();
  }
  $("editLinks").onclick = openLinksEditor;
  $("lkAdd").onclick = () => {
    closePickers();
    const r = addRow({});
    r.querySelector(".lk-name").focus();
    r.scrollIntoView({ block: "nearest" });
  };
  $("lkReset").onclick = () => { fillRows(DEFAULT_LINKS); };
  $("lkCancel").onclick = () => linksDlg.close();
  $("lkClose").onclick = () => linksDlg.close();
  $("lkSave").onclick = () => {
    const out = [];
    for (const row of lkList.querySelectorAll(".lk-row")) {
      const n = row.querySelector(".lk-name").value.trim();
      const raw = row.querySelector(".lk-url").value.trim();
      if (!n && !raw) continue;                       // empty row: ignore
      const u = normalizeUrl(raw);
      if (!u) { lkMsg.textContent = raw ? "“" + raw + "” doesn’t look like a web address." : "Add a web address for “" + n + "”."; row.querySelector(".lk-url").focus(); return; }
      out.push({ name: n || new URL(u).hostname.replace(/^www\./, ""), url: u, icon: row._icon });
    }
    links = out;
    store.set("lmchat.links", links);
    renderLinks();
    linksDlg.close();
  };

  $("toggleRail").onclick = () => {
    const open = $("rail").classList.toggle("open");
    $("toggleRail").title = open ? "Collapse sidebar" : "Expand sidebar";
    store.set("lmchat.railOpen", open);
  };
  if (store.get("lmchat.railOpen", false)) $("rail").classList.add("open");

  /* Purple logo: hide / show the whole toolbar (remembered between visits) */
  function setRailHidden(hidden) {
    document.body.classList.toggle("rail-hidden", hidden);
    const b = $("logoBtn");
    b.title = hidden ? "Show toolbar" : "Hide toolbar";
    b.setAttribute("aria-label", b.title);
    b.setAttribute("aria-expanded", String(!hidden));
    if (hidden) $("history").classList.remove("open");
  }
  $("logoBtn").onclick = () => {
    const hidden = !document.body.classList.contains("rail-hidden");
    setRailHidden(hidden);
    store.set("lmchat.railHidden", hidden);
  };
  setRailHidden(!!store.get("lmchat.railHidden", false));

  /* ---------- Chips ---------- */
  CHIPS.forEach(([label, prompt]) => {
    const b = document.createElement("button");
    b.className = "chip"; b.textContent = label;
    b.onclick = () => { input.value = prompt; autosize(); input.focus(); input.setSelectionRange(prompt.length, prompt.length); };
    $("chips").appendChild(b);
  });

  /* ---------- Rendering ---------- */
  function updateHeader() {
    $("greeting").textContent = "Nice to see you, " + (settings.name || "friend") + ". What’s new?";
    $("avatar").textContent = (settings.name || "?").trim().charAt(0).toUpperCase() || "?";
    $("cardUrl").textContent = baseUrl();
  }

  function setMode() {
    const c = currentChat();
    main.classList.toggle("home", !c || c.messages.length === 0);
  }

  function addMessageEl(m, opts) {
    if (m.hidden) return null;   // automatic nudges from the app are not shown
    const wrap = document.createElement("div");
    wrap.__m = m;
    wrap.className = "msg " + m.role;
    const body = document.createElement("div");
    body.className = "body";
    if (m.role === "user") {
      // Render attached images as visible thumbnails in the chat. Image data is
      // already stored in the message content for LM Studio, so this also works
      // when an older conversation is reopened.
      const parts = Array.isArray(m.content) ? m.content : [];
      const textPart = parts.find((p) => p && p.type === "text" && typeof p.text === "string");
      if (textPart && textPart.text) {
        const textEl = document.createElement("div");
        textEl.textContent = textPart.text;
        body.appendChild(textEl);
      } else if (!parts.some((p) => p && p.type === "image_url")) {
        body.textContent = m.display || m.content || "";
      }
      parts.filter((p) => p && p.type === "image_url" && p.image_url && p.image_url.url).forEach((p) => {
        const img = document.createElement("img");
        img.className = "chat-image";
        img.src = p.image_url.url;
        img.alt = "Attached image";
        img.title = "Click to open image";
        img.addEventListener("click", () => window.open(p.image_url.url, "_blank"));
        body.appendChild(img);
      });
      if (parts.some((p) => p && p.type === "image_url") && m.display) {
        const names = m.display.split("\n").filter((x) => /^🖼️ /.test(x));
        names.forEach((name) => {
          const label = document.createElement("span");
          label.className = "chat-image-name";
          label.textContent = name.replace(/^🖼️\s*/, "");
          body.appendChild(label);
        });
      }
    } else body.innerHTML = m.content ? md(maskStreamingTags(m.content)) : '<span class="thinking"><i></i><i></i><i></i></span>';
    if (m.role === "assistant" && m.persona) {
      const tag = document.createElement("div");
      tag.className = "who"; tag.textContent = (m.persona.emoji ? m.persona.emoji + " " : "") + m.persona.name;
      wrap.appendChild(tag);
    }
    if (m.role === "assistant" && (m.proactive || m.auto)) {
      const nt = document.createElement("div");
      nt.className = "who note"; nt.textContent = m.proactive ? "💭 spoke up on its own" : "⚙ autopilot";
      wrap.appendChild(nt);
    }
    wrap.appendChild(body);
    if (m.role === "assistant") {
      const act = document.createElement("div");
      act.className = "actions";
      const copy = document.createElement("button");
      copy.textContent = "Copy";
      copy.onclick = () => {
        try { navigator.clipboard.writeText(m.content); copy.textContent = "Copied"; setTimeout(() => (copy.textContent = "Copy"), 1200); } catch (e) {}
      };
      act.appendChild(copy);
      wrap.appendChild(act);
      refreshReplyExtras(m, wrap);
    }
    msgs.appendChild(wrap);
    if (!opts || !opts.quiet) msgs.scrollTop = msgs.scrollHeight;
    return body;
  }
  /* A picture that fails to load: wait, then try again a couple of times (the free image server is often busy),
     then fall back to generated art for real photos, then to a plain note. Errors don't bubble, so listen while capturing. */
  msgs.addEventListener("error", async (e) => {
    const img = e.target;
    if (!img || img.tagName !== "IMG" || !img.classList.contains("chat-gen-image")) return;
    const tries = Number(img.dataset.tries || 0);
    const real = (img.dataset.src || "").replace(/&amp;/g, "&");
    const isGen = /^https?:\/\/image\.pollinations\.ai\//i.test(real);
    if (isGen && tries < 2) {
      img.dataset.tries = String(tries + 1);
      await wait(5000 * (tries + 1));
      img.src = real + (real.includes("?") ? "&" : "?") + "retry=" + (tries + 1) + "_" + Date.now();
      return;
    }
    if (!isGen && !img.dataset.fellback && settings.imageGen && img.alt) {
      img.dataset.fellback = "1";
      try { const u = await generatePollinationsImage(img.alt); img.src = blobForUrl.get(u) || u; img.dataset.src = u; img.dataset.tries = "0"; return; } catch (err) {}
    }
    img.alt = "Image could not be loaded — click to try opening it";
    img.classList.add("chat-img-failed");
  }, true);
  msgs.addEventListener("click", (e) => {
    if (e.target && e.target.classList && e.target.classList.contains("chat-gen-image")) {
      const real = (e.target.dataset && e.target.dataset.src ? e.target.dataset.src.replace(/&amp;/g, "&") : e.target.src);
      if (!openInNewTab(real)) window.open(real, "_blank");
    }
    const codeBtn = e.target.closest && e.target.closest(".code-copy-btn");
    if (codeBtn) {
      const codeEl = codeBtn.closest(".code-block").querySelector("code");
      const text = codeEl ? codeEl.textContent : "";
      navigator.clipboard.writeText(text).then(() => {
        codeBtn.textContent = "Copied"; codeBtn.classList.add("copied");
        setTimeout(() => { codeBtn.textContent = "Copy code"; codeBtn.classList.remove("copied"); }, 1200);
      }).catch(() => {});
    }
  });

  function renderChat() {
    msgs.innerHTML = "";
    const c = currentChat();
    if (c) c.messages.forEach((m, i) => {
      if (c.summary && i === c.summary.upto && i > 0) {
        const dv = document.createElement("div"); dv.className = "sum-divider";
        dv.textContent = "↑ Older messages above were summarized for the AI so this chat can keep going. Nothing was deleted.";
        msgs.appendChild(dv);
      }
      addMessageEl(m, { quiet: true });
    });
    setMode();
    msgs.scrollTop = msgs.scrollHeight;
    renderHistory(); renderRecent(); renderWorkBar();
  }

  function renderHistory() {
    const list = $("histList");
    list.innerHTML = "";
    if (!chats.length) { list.innerHTML = '<div class="empty">No chats yet. Send a message to start one.</div>'; return; }
    chats.slice().sort((a, b) => b.updated - a.updated).forEach((c) => {
      const row = document.createElement("div");
      row.className = "hist-item" + (c.id === currentId ? " active" : "");
      const t = document.createElement("button"); t.className = "t"; t.textContent = c.title;
      t.onclick = () => { openChat(c.id); $("history").classList.remove("open"); };
      const x = document.createElement("button"); x.className = "x"; x.textContent = "✕"; x.title = "Delete chat";
      x.onclick = () => {
        chats = chats.filter((z) => z.id !== c.id); saveChats(); forgetZip(c.id);
        if (currentId === c.id) { stopGeneration(); currentId = null; }
        renderChat();
      };
      row.append(t, x); list.appendChild(row);
    });
  }

  function renderRecent() {
    const box = $("recentList");
    box.innerHTML = "";
    const recent = chats.slice().sort((a, b) => b.updated - a.updated).slice(0, 2);
    if (!recent.length) { box.innerHTML = '<h3>No chats yet</h3><p>Your recent conversations will show up here so you can pick up where you left off.</p>'; return; }
    recent.forEach((c) => {
      const b = document.createElement("button"); b.className = "recent";
      b.innerHTML = '<span class="ic"><svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-3.8A8 8 0 1 1 20 12z"/></svg></span><div><b></b><small></small></div>';
      b.querySelector("b").textContent = c.title;
      b.querySelector("small").textContent = ago(c.updated);
      b.onclick = () => openChat(c.id);
      box.appendChild(b);
    });
  }

  function openChat(id) { stopGeneration(); apOnChatSwitch(); currentId = id; renderChat(); input.focus(); ensureZip(id); }
  function newChat() { stopGeneration(); apOnChatSwitch(); currentId = null; renderChat(); input.focus(); }
  $("newChat").onclick = newChat;
  $("showHistory").onclick = () => $("history").classList.toggle("open");
  $("closeHistory").onclick = () => $("history").classList.remove("open");

  /* ---------- Connection ---------- */
  function setStatus(state, text) {
    connState = state;
    ["statusDot", "cardDot"].forEach((id) => { $(id).className = "dot " + (state || ""); });
    $("statusText").textContent = text; $("cardStatus").textContent = text;
  }

  async function checkConnection(quiet) {
    if (!quiet) setStatus("", "Checking LM Studio…");
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 5000);
    try {
      const r = await fetch(baseUrl() + "/models", { headers: headers(), signal: ctl.signal });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const data = await r.json();
      const ids = (data.data || []).map((m) => m.id).filter((id) => !/embed/i.test(id));
      fillModels(ids);
      setStatus("ok", ids.length ? "Connected · " + ids.length + (ids.length === 1 ? " model" : " models") : "Connected · no model loaded");
      return { ok: true, count: ids.length };
    } catch (e) {
      setStatus("bad", "LM Studio not reachable");
      return { ok: false, error: e.name === "AbortError" ? "Timed out after 5 seconds" : e.message };
    } finally { clearTimeout(timer); }
  }

  function fillModels(ids) {
    const sel = $("setModel");
    sel.innerHTML = "";
    const auto = document.createElement("option"); auto.value = ""; auto.textContent = "Auto"; sel.appendChild(auto);
    ids.forEach((id) => { const o = document.createElement("option"); o.value = id; o.textContent = id; sel.appendChild(o); });
    sel.value = ids.includes(settings.model) ? settings.model : "";
  }
  $("setModel").onchange = (e) => {
    settings.model = e.target.value;
    store.set("lmchat.settings", settings);
  };
  $("refreshModels").onclick = async () => {
    const b = $("refreshModels");
    b.classList.add("spin");
    await checkConnection();
    setTimeout(() => b.classList.remove("spin"), 400);
  };
  // Re-fetch models quietly when you switch back to this tab (e.g. after loading a model in LM Studio)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !streaming) checkConnection(true);
  });
  $("statusBtn").onclick = openSettings;
  $("cardSettings").onclick = openSettings;

  /* ---------- Settings dialog ---------- */
  const dlg = $("settings");
  function openSettings() {
    $("setName").value = settings.name; $("setUrl").value = settings.baseUrl; $("setKey").value = settings.apiKey;
    $("setSystem").value = settings.system; $("setTemp").value = settings.temperature; $("tempVal").textContent = settings.temperature;
    $("testResult").textContent = "";
    $("setModel").value = settings.model || "";
    $("setImageGen").checked = settings.imageGen !== false;
    $("setRealImages").checked = settings.realImages !== false;
    $("setWebSearch").checked = settings.webSearch !== false;
    $("setCommands").checked = settings.commands !== false;
    $("setWinApps").checked = settings.winApps !== false;
    $("setProactive").checked = settings.proactive !== false;
    $("setProactiveMins").value = settings.proactiveMins || 5;
    $("setProactiveMax").value = settings.proactiveMax || 2;
    $("setApMaxSteps").value = settings.apMaxSteps || 30;
    $("setAutoApply").checked = !!settings.autoApply;
    $("setCompact").checked = settings.compact !== false;
    $("setMemoryEnabled").checked = settings.memoryEnabled !== false;
    $("setMemory").value = settings.memory || "";
    $("setPexelsKey").value = settings.pexelsKey || "";
    $("setPixabayKey").value = settings.pixabayKey || "";
    $("setTmdbKey").value = settings.tmdbKey || "";
    $("setYoutubeKey").value = settings.youtubeKey || "";
    $("setNasaKey").value = settings.nasaKey || "";
    dlg.showModal();
    // Let personas.js know the dialog is open so it can sync the persona picker
    // with whatever system prompt just got loaded into the textarea.
    document.dispatchEvent(new CustomEvent("lmchat:settingsOpen"));
  }
  $("openSettings").onclick = openSettings;
  $("avatar").onclick = openSettings;
  $("cancelSettings").onclick = () => dlg.close();
  $("setTemp").oninput = (e) => { $("tempVal").textContent = e.target.value; };
  function readForm() {
    return {
      name: $("setName").value.trim() || defaults.name,
      baseUrl: $("setUrl").value.trim() || defaults.baseUrl,
      apiKey: $("setKey").value.trim(),
      system: $("setSystem").value.trim(),
      temperature: parseFloat($("setTemp").value),
      model: $("setModel").value,
      imageGen: $("setImageGen").checked,
      realImages: $("setRealImages").checked,
      webSearch: $("setWebSearch").checked,
      commands: $("setCommands").checked,
      winApps: $("setWinApps").checked,
      proactive: $("setProactive").checked,
      proactiveMins: Math.max(1, parseInt($("setProactiveMins").value, 10) || 5),
      proactiveMax: Math.max(1, parseInt($("setProactiveMax").value, 10) || 2),
      apMaxSteps: Math.max(1, parseInt($("setApMaxSteps").value, 10) || 30),
      autoApply: $("setAutoApply").checked,
      compact: $("setCompact").checked,
      memoryEnabled: $("setMemoryEnabled").checked,
      memory: $("setMemory").value.trim(),
      pexelsKey: $("setPexelsKey").value.trim(),
      pixabayKey: $("setPixabayKey").value.trim(),
      tmdbKey: $("setTmdbKey").value.trim(),
      youtubeKey: $("setYoutubeKey").value.trim(),
      nasaKey: $("setNasaKey").value.trim()
    };
  }
  $("memoryClear").onclick = () => { $("setMemory").value = ""; };
  $("testBtn").onclick = async () => {
    const prev = settings;
    settings = Object.assign({}, settings, readForm());
    $("testResult").style.color = "";
    $("testResult").textContent = "Testing…";
    const r = await checkConnection();
    $("testResult").style.color = r.ok ? "var(--ok)" : "var(--bad)";
    $("testResult").textContent = r.ok ? "Connected. Found " + r.count + " model(s)." : "Could not connect: " + r.error + ". Check that the server is running and CORS is on.";
    settings = prev;
  };
  $("settingsForm").addEventListener("submit", () => {
    settings = Object.assign({}, settings, readForm());
    store.set("lmchat.settings", settings);
    updateHeader(); checkConnection(); renderWorkBar();
  });

  /* ---------- Composer ---------- */
  function autosize() { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 200) + "px"; }
  input.addEventListener("input", autosize);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); }
  });
  // Button: stop when the box is empty; send (and cut the current reply off) when you've typed something.
  sendBtn.onclick = () => {
    const typed = input.value.trim() || attachments.length;
    if (streaming && !typed) { stopGeneration(); apPause("Paused because you stopped it. Press Resume to carry on."); } else send();
  };
  input.addEventListener("input", () => syncSendBtn());

  function syncSendBtn() {
    const typed = !!(input.value.trim() || attachments.length);
    const asStop = streaming && !typed;
    sendBtn.classList.toggle("interrupt", streaming && typed);
    sendBtn.title = asStop ? "Stop" : (streaming ? "Send now (stops the current reply)" : "Send");
    sendBtn.innerHTML = asStop
      ? '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2.5"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M12 19V6M6 11.5l6-6 6 6"/></svg>';
  }
  function setStreaming(on) {
    streaming = on;
    sendBtn.classList.toggle("stop", on);   // voice.js watches this class
    syncSendBtn();
  }
  // Stops the reply that is being written right now (keeps whatever it already wrote).
  function stopGeneration() {
    const cur = activeSend;
    if (!cur) return false;
    cancelledReplies.add(cur.reply);
    if (!cur.reply.content) cur.reply.content = "(Stopped.)";
    activeSend = null;
    cur.ctl.abort();
    document.dispatchEvent(new Event("lmchat:stopped"));
    setStreaming(false);
    scrollNotice.classList.remove("show");
    return true;
  }

  /* ---------- Attaching files: documents, spreadsheets, images, archives, text ---------- */
  // File-type knowledge lives in js/file-extract.js. If that file ever failed to load, this small stand-in keeps basic attaching working.
  const X = window.OasisExtract || {
    classify: (n, t) => /\.zip$/i.test(n) ? "zip" : /^image\//.test(t || "") ? "image" : "text",
    isDoc: () => false, isImage: () => false, isArchive: () => false, label: (k) => k, extOf: (n) => (String(n).split(".").pop() || "").toLowerCase(),
    looksLikeText: () => true, decodeText: (b) => new TextDecoder().decode(b), toBytes: async (d) => new Uint8Array(await d.arrayBuffer()),
    openArchive: async (f) => ({ zip: await JSZip.loadAsync(f), converted: false }),
    extract: async () => ({ ok: false, error: "document reader not loaded" }), imageToDataUrl: async () => { throw new Error("image reader not loaded"); },
    renderPdfPages: async () => []
  };
  const IMG_DIRECT = /^image\/(png|jpe?g|webp|gif)$/i;

  $("attachBtn").onclick = () => $("fileInput").click();
  $("fileInput").onchange = async (e) => { const files = Array.from(e.target.files || []); e.target.value = ""; await addFiles(files); };

  async function addFiles(fileList) {
    for (const f of Array.from(fileList || [])) {
      const busy = { name: f.name, kind: "text", text: "", busy: true };   // shows "Reading…" while big files are processed
      attachments.push(busy); renderAttachments();
      try { await addOneFile(f); }
      catch (err) { alert("Couldn't read " + f.name + (err && err.message ? ": " + err.message : ".")); }
      const i = attachments.indexOf(busy); if (i >= 0) attachments.splice(i, 1);
      renderAttachments();
    }
  }

  async function addOneFile(f) {
    const kind = X.classify(f.name, f.type);
    if (kind === "zip" || kind === "tar" || /zip/.test(f.type)) {
      if (f.size > 100 * 1024 * 1024) { alert(f.name + " is larger than 100 MB."); return; }
      let a;
      try { a = await readZipAttachment(f); } catch (err) { alert("Couldn't open " + f.name + " as a zip/tar archive."); return; }
      attachments.push(a); (a.images || []).forEach((im) => attachments.push(im));
      return;
    }
    if (kind === "image" || (kind === "unknown" && /^image\//.test(f.type))) {
      if (f.size > 10 * 1024 * 1024) { alert(f.name + " is larger than 10 MB. Choose a smaller image."); return; }
      let dataUrl;
      if (IMG_DIRECT.test(f.type)) {
        dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(f); });
      } else dataUrl = (await X.imageToDataUrl(f, f.name, { maxSide: 2048 })).dataUrl;   // bmp, avif, ico… become a JPEG the model accepts
      attachments.push({ name: f.name, type: f.type, kind: "image", dataUrl });
      return;
    }
    if (kind === "imageOther") { alert(f.name + " is an image format this app can't display (HEIC, TIFF, PSD, RAW…). Convert it to PNG or JPG first."); return; }
    if (X.isDoc(f.name)) { await addDocument(f); return; }
    if (kind === "binary") { alert(f.name + " is a binary file (audio, video, font, program, database…), which can't be read as text."); return; }
    // Plain text, or an unknown type: use it if it really is text.
    if (f.size > 5 * 1024 * 1024) { alert(f.name + " is larger than 5 MB. Attach a smaller file or put it in a zip."); return; }
    const bytes = new Uint8Array(await f.arrayBuffer());
    if (kind === "unknown" && !X.looksLikeText(bytes)) { alert("Oasis can't read ." + (X.extOf(f.name) || "this") + " files. Convert it to text, PDF, Word, Excel, PowerPoint or an image."); return; }
    const txt = X.decodeText(bytes);
    if (typeof JSZip !== "undefined" && txt.length > await lmContextChars()) {
      // Too long for the model to see at once: let it read the file in parts.
      const z = new JSZip(); z.file(f.name, txt);
      attachments.push({ name: f.name, type: f.type, kind: "zip", zip: z, large: true,
        text: "File \"" + f.name + "\" is " + txt.length + " characters, too long to show at once. Read it in parts with [[read: " + f.name + "#1]], then #2, #3 and so on." });
    } else attachments.push({ name: f.name, type: f.type, kind: "text", text: txt });
  }

  async function addDocument(f) {
    if (f.size > 60 * 1024 * 1024) { alert(f.name + " is larger than 60 MB."); return; }
    const r = await X.extract(f.name, f);
    if (!r.ok) { alert("Couldn't read " + f.name + " (" + (r.label || "document") + "): " + r.error); return; }
    if (r.kind === "pdf" && r.scanned) { await addScannedPdf(f, r); return; }
    if (!r.text.trim()) { alert(f.name + " has no readable text in it."); return; }
    const info = "(Text extracted from " + r.label + " \"" + f.name + "\"" + (r.pages ? ", " + r.pages + " pages" : "") + ")\n";
    if (typeof JSZip !== "undefined" && r.text.length > await lmContextChars()) {
      const key = f.name + ".txt", z = new JSZip(); z.file(key, info + r.text);
      attachments.push({ name: f.name, type: f.type, kind: "zip", zip: z, large: true,
        text: "The text of " + r.label + " \"" + f.name + "\" is " + r.text.length + " characters, too long to show at once. Read it in parts with [[read: " + key + "#1]], then #2, #3 and so on." });
    } else attachments.push({ name: f.name, type: f.type, kind: "text", text: info + r.text });
  }

  // A scanned PDF has no text layer. A vision model can still read it from page pictures.
  async function addScannedPdf(f, r) {
    const vision = await lmVision();
    if (vision === false || typeof JSZip === "undefined") {
      attachments.push({ name: f.name, type: f.type, kind: "text", text: "PDF \"" + f.name + "\" (" + r.pages + " pages) is a scan with no text layer, and the loaded model can't view images. Tell the user to load a vision model, or to paste the text." });
      return;
    }
    const bytes = await X.toBytes(f);
    const pages = await X.renderPdfPages(bytes, 1, 4);
    const z = new JSZip(); z.file(f.name, bytes);
    attachments.push({ name: f.name, type: f.type, kind: "zip", zip: z, large: true, file: null,
      text: "PDF \"" + f.name + "\" (" + r.pages + " pages) is a scan with no text layer. Pages 1-" + pages.length + " are attached as images." +
        (r.pages > pages.length ? " To see more, write [[read: " + f.name + "#p" + (pages.length + 1) + "]] (4 pages at a time)." : "") });
    pages.forEach((pg) => attachments.push({ name: f.name + " (page " + pg.page + ")", type: "image/jpeg", kind: "image", dataUrl: pg.dataUrl, fromZip: true }));
  }

  // Drag files onto the window, or paste them (Ctrl+V) into the message box.
  (function () {
    const hasFiles = (e) => e.dataTransfer && Array.from(e.dataTransfer.types || []).includes("Files");
    ["dragenter", "dragover"].forEach((ev) => document.addEventListener(ev, (e) => { if (!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = "copy"; document.body.classList.add("dropping"); }));
    document.addEventListener("dragleave", (e) => { if (!e.relatedTarget) document.body.classList.remove("dropping"); });
    document.addEventListener("drop", (e) => {
      document.body.classList.remove("dropping");
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    });
    input.addEventListener("paste", (e) => {
      const fs = e.clipboardData && e.clipboardData.files;
      if (fs && fs.length) { e.preventDefault(); addFiles(fs); }
    });
  })();

  /* ---------- Zip in / zip out ---------- */
  const ZIP_TEXT_BUDGET = 12000;   // max characters of file contents sent to the model per zip (raise it if your model has a big context)
  const ZIP_FILE_MAX = 12000;       // single files longer than this are listed but not shown
  const ZIP_AUTO_IMAGES = 6;        // images from a zip attached automatically (the model can ask for others with [[read:]])

  // Ask LM Studio about the loaded model: how big its context is, and whether it can see images.
  let modelInfoCache = { t: 0, m: null };
  async function lmModelInfo() {
    if (Date.now() - modelInfoCache.t < 8000) return modelInfoCache.m;
    let m = null;
    try {
      const r = await fetch(new URL(baseUrl()).origin + "/api/v0/models", { headers: headers() });
      const list = ((await r.json()).data || []).filter((x) => x.state === "loaded");
      m = list.find((x) => settings.model && x.id === settings.model) || list[0] || null;
    } catch (e) {}
    modelInfoCache = { t: Date.now(), m };
    return m;
  }
  async function lmContextChars() {
    const m = await lmModelInfo();
    const ctx = m && (m.loaded_context_length || m.max_context_length);
    if (ctx) return Math.max(6000, Math.min(300000, Math.round((ctx - 9000) * 2.5)));
    return 12000;
  }
  // true = the model can see images, false = it can't, null = unknown (not LM Studio, or nothing loaded)
  async function lmVision() {
    const m = await lmModelInfo();
    if (!m) return null;
    if (m.type === "vlm" || m.vision === true || (Array.isArray(m.capabilities) && m.capabilities.some((c) => /vision|image/i.test(String(c))))) return true;
    return m.type ? false : null;
  }

  const kb = (n) => n >= 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB";
  const zipEntrySize = (z) => { try { return (z._data && z._data.uncompressedSize) || 0; } catch (e) { return 0; } };
  function zipInfo(zip) {
    const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
    return { hasImages: names.some((n) => X.isImage(n)), hasDocs: names.some((n) => X.isDoc(n)) };
  }
  const docCache = new WeakMap();   // zip -> Map(name -> extracted document), so each document is only parsed once
  async function cachedExtract(cache, cacheKey, name, getBytes) {
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    const r = await X.extract(name, await getBytes());
    cache.set(cacheKey, r);
    return r;
  }
  const docHeader = (r) => "(Text extracted from " + r.label + (r.pages ? ", " + r.pages + " pages" : "") + "; the original can't be edited as text)\n";

  async function readZipAttachment(f) {
    if (typeof JSZip === "undefined") throw new Error("JSZip missing");
    const budget = await lmContextChars();
    const opened = await X.openArchive(f, f.name);   // zip, jar, apk… or tar / tar.gz / gz
    const zip = opened.zip;
    const entries = Object.values(zip.files).filter((z) => !z.dir && !/^__MACOSX\//.test(z.name) && !/(^|\/)(node_modules|\.git)\//.test(z.name) && !/(^|\/)(\.DS_Store|Thumbs\.db)$/.test(z.name));
    const cache = new Map(); docCache.set(zip, cache);
    const texts = [], docs = [], imgs = [], notes = new Map(); let total = 0;
    for (const z of entries) {
      const kind = X.classify(z.name), size = zipEntrySize(z);
      if (kind === "image") { imgs.push(z); continue; }
      if (X.isDoc(z.name)) { docs.push(z); continue; }
      if (kind === "text" || (kind === "unknown" && size <= 2 * 1024 * 1024)) {
        if (size > 8 * 1024 * 1024) { notes.set(z.name, "(" + kb(size) + ", too big to show)"); continue; }
        const bytes = await z.async("uint8array");
        if (kind === "unknown" && !X.looksLikeText(bytes)) continue;
        const t = X.decodeText(bytes);
        if (t.includes("\u0000")) continue;
        texts.push({ name: z.name, t }); total += t.length;
      }
      else if (kind === "zip" || kind === "tar") notes.set(z.name, "(an archive inside the zip; [[read: path]] lists what is in it)");
      else if (kind === "imageOther") notes.set(z.name, "(image in a format that can't be displayed)");
    }
    // Documents (PDF, Word, Excel, PowerPoint…) become text, as long as there is still room.
    for (const z of docs) {
      const size = zipEntrySize(z), lab = X.label(X.classify(z.name));
      if (total > budget || size > 25 * 1024 * 1024) { notes.set(z.name, "(" + lab + ", " + kb(size) + "; not shown yet, use [[read: path]])"); continue; }
      const r = await cachedExtract(cache, z.name, z.name, () => z.async("uint8array"));
      if (!r.ok) { notes.set(z.name, "(couldn't read this " + lab + ": " + r.error + ")"); continue; }
      if (r.scanned || !r.text.trim()) { notes.set(z.name, r.scanned ? "(scanned PDF with no text; [[read: path]] shows its pages as images)" : "(no readable text)"); continue; }
      texts.push({ name: z.name, t: docHeader(r) + r.text }); total += r.text.length;
    }
    const large = total > budget;
    const vision = await lmVision();
    const images = [];
    if (!large && vision === true) {
      for (const z of imgs) {
        if (images.length >= ZIP_AUTO_IMAGES) break;
        if (zipEntrySize(z) > 15 * 1024 * 1024) continue;
        try {
          const r = await X.imageToDataUrl(await z.async("uint8array"), z.name);
          images.push({ name: z.name, type: "image/jpeg", kind: "image", dataUrl: r.dataUrl, fromZip: true });
          notes.set(z.name, "(image " + r.width + "×" + r.height + ", attached to this message so you can see it)");
        } catch (e) { notes.set(z.name, "(image that couldn't be decoded)"); }
      }
    }
    imgs.forEach((z) => { if (!notes.has(z.name)) notes.set(z.name, vision === false ? "(image; the loaded model can't view images)" : "(image, " + kb(zipEntrySize(z)) + "; use [[read: path]] to view it)"); });

    const sizes = new Map(texts.map((x) => [x.name, x.t.length]));
    const line = (z) => z.name + (large && sizes.has(z.name) ? " (" + sizes.get(z.name) + " chars)" : "") + (notes.has(z.name) ? " " + notes.get(z.name) : "");
    const tree = entries.slice(0, 600).map(line).join("\n");
    const extras = (imgs.length || docs.length) ? " PDF, Word, Excel, PowerPoint and similar files are given to you as extracted text" + (imgs.length ? "; images can be viewed with [[read: path]] when the model supports vision" : "") + "." : "";
    const base = { name: f.name, type: "application/zip", kind: "zip", zip, file: opened.converted ? null : f, large, images };
    if (large) {   // project mode: send only the file list; the model asks for files with [[read: path]]
      return Object.assign(base, { text: "ZIP archive \"" + f.name + "\" with " + entries.length + " files (~" + total + " characters of text). It is too big to show at once, so this is only the FILE LIST. Use [[read: path]] to look at files." + extras + "\n\nFILE LIST:\n" + tree });
    }
    const imgNote = images.length ? " " + images.length + " image(s) are attached to this message." + (imgs.length > images.length ? " Other images can be viewed with [[read: path]]." : "") : "";
    return Object.assign(base, { text: "ZIP archive \"" + f.name + "\" with " + entries.length + " files. The contents of text files and documents are below." + extras + imgNote + "\n\nFILE LIST:\n" + tree +
      "\n\nFILE CONTENTS:\n" + texts.map((x) => "=== " + x.name + " ===\n" + x.t).join("\n\n") });
  }

  const READ_SYSTEM_PROMPT =
    "This project zip is too big to show at once; you only have its file list. To look at files write [[read: path/to/file]] " +
    "(at most 4 per reply; very long files come in parts: [[read: path#2]] is part 2). The app sends the contents back automatically and you continue. Read only what you need, " +
    "never guess a file's contents. When you have what you need, make changes with [[file:]] blocks (complete files). " +
    "If you need to read files first, reply with just a short note and the [[read:]] tags. " +
    "To search for text across the zip use [[find: some text]] (file names and lines inside files).";
  const READ_TAG_RE = /\[\[read:\s*([^\]\n]+?)\s*\]\]/gi;
  function extractReadTags(reply) {
    const paths = [];
    reply.content = reply.content.replace(READ_TAG_RE, (m, p) => { p = p.trim(); if (paths.length < 4) paths.push(p); return "📂 _reading " + p + "…_"; });
    return paths;
  }
  function parseReadPath(p0) {
    let p = p0, part = 0, page = 0, m;
    if ((m = /^(.*)#p(\d+)$/i.exec(p0))) { p = m[1].trim(); page = +m[2]; }          // name.pdf#p5 = scanned PDF, pages from 5
    else if ((m = /^(.*)#(\d+)$/.exec(p0))) { p = m[1].trim(); part = +m[2]; }       // name#2 = part 2 of a long file
    return { p, part, page };
  }
  function addTextPart(st, title, t, part, per, budget, key) {
    t = slicePart(key, t, part, per);
    if (st.used + t.length > budget) { st.parts.push("=== " + title + " ===\n(skipped: no room this round, ask for it again next round)"); return; }
    st.used += t.length; st.parts.push("=== " + title + " ===\n" + t);
  }
  // Read one file (from the zip or the project folder) for the model: images come back as pictures, documents as text.
  async function readEntry(st, key, getBytes, cache, cacheKey, o) {
    const kind = X.classify(key);
    if (kind === "image" || kind === "imageOther") {
      const vision = await lmVision();
      if (kind === "imageOther") { st.parts.push("=== " + key + " ===\n(an image format that can't be displayed)"); return; }
      if (vision === false) { st.parts.push("=== " + key + " ===\n(an image, but the loaded model can't view images; suggest the user loads a vision model)"); return; }
      if (st.images.length >= 4) { st.parts.push("=== " + key + " ===\n(skipped: at most 4 images per round, ask for it again next round)"); return; }
      try {
        const r = await X.imageToDataUrl(await getBytes(), key);
        st.images.push({ name: key, dataUrl: r.dataUrl });
        st.parts.push("=== " + key + " ===\n(image " + r.width + "×" + r.height + ", attached below)");
      } catch (e) { st.parts.push("=== " + key + " ===\n(couldn't decode this image)"); }
      return;
    }
    if (X.isDoc(key)) {
      const r = await cachedExtract(cache, cacheKey, key, getBytes);
      if (!r.ok) { st.parts.push("=== " + key + " ===\n(couldn't read this " + (r.label || "document") + ": " + r.error + ")"); return; }
      if (r.kind === "pdf" && (r.scanned || o.page)) {
        const vision = await lmVision();
        if (vision !== false) {
          if (st.images.length >= 4) { st.parts.push("=== " + key + " ===\n(skipped: at most 4 images per round, ask again next round)"); return; }
          const start = o.page || 1;
          try {
            const pages = await X.renderPdfPages(await getBytes(), start, 4 - st.images.length);
            pages.forEach((pg) => st.images.push({ name: key + " (page " + pg.page + ")", dataUrl: pg.dataUrl }));
            const last = pages.length ? pages[pages.length - 1].page : start;
            st.parts.push("=== " + key + " ===\n(PDF with " + r.pages + " pages; pages " + start + "-" + last + " attached below as images" + (last < r.pages ? "; next: [[read: " + key + "#p" + (last + 1) + "]]" : "") + ")");
          } catch (e) { st.parts.push("=== " + key + " ===\n(couldn't draw the PDF pages: " + e.message + ")"); }
          return;
        }
        if (r.scanned) { st.parts.push("=== " + key + " ===\n(a scanned PDF with no text layer, and the loaded model can't view images)"); return; }
      }
      addTextPart(st, key, docHeader(r) + r.text, o.part, o.per, o.budget, key);
      return;
    }
    if (kind === "zip" || kind === "tar") {
      try {
        const inner = await X.openArchive(new Blob([await getBytes()]), key);
        const names = Object.keys(inner.zip.files).filter((n) => !inner.zip.files[n].dir);
        st.parts.push("=== " + key + " (archive with " + names.length + " files) ===\n" + names.slice(0, 300).join("\n") + (names.length > 300 ? "\n…" : ""));
      } catch (e) { st.parts.push("=== " + key + " ===\n(couldn't open this archive)"); }
      return;
    }
    const bytes = await getBytes();
    if (kind !== "text" && !X.looksLikeText(bytes)) { st.parts.push("=== " + key + " ===\n(binary file, " + kb(bytes.length) + ", can't show)"); return; }
    const t = X.decodeText(bytes);
    if (t.includes("\u0000")) { st.parts.push("=== " + key + " ===\n(binary file, can't show)"); return; }
    addTextPart(st, key, t, o.part, o.per, o.budget, key);
  }
  // Returns { text, images }: the text for the model, plus any pictures to show it.
  async function readFilesTextBase(chat, paths) {
    await ensureZip(chat.id);
    if (project && !workZips.has(chat.id)) return readProjectFiles(paths);
    const base = workZips.get(chat.id); if (!base) return { text: "(The original zip is no longer loaded. Ask the user to attach it again.)", images: [] };
    const budget = await lmContextChars(), per = Math.max(3000, Math.round(budget / 3));
    const names = Object.keys(base.zip.files).filter((n) => !base.zip.files[n].dir);
    const edits = {}; chat.messages.forEach((x) => (x.files || []).forEach((f) => { edits[f.path] = f.content; }));
    let cache = docCache.get(base.zip); if (!cache) { cache = new Map(); docCache.set(base.zip, cache); }
    const st = { used: 0, parts: [], images: [] };
    for (const p0 of paths) {
      const { p, part, page } = parseReadPath(p0);
      const key = names.find((n) => n === p) || names.find((n) => n.endsWith("/" + p)) || names.find((n) => n.toLowerCase() === p.toLowerCase()) || (p in edits ? p : null);
      if (!key) { st.parts.push("=== " + p + " ===\n(not found in the zip)"); continue; }
      if (key in edits) { addTextPart(st, key + " (your edited version)", edits[key], part, per, budget, key); continue; }
      await readEntry(st, key, () => base.zip.files[key].async("uint8array"), cache, key, { part, page, per, budget });
    }
    return { text: st.parts.join("\n\n"), images: st.images };
  }
  let readRounds = 0;
  function autoContinueReads(paths, chat) {
    if (currentId !== chat.id || streaming) return;
    if (readRounds >= (autoOn(chat) ? 25 : 8)) {
      const last = chat.messages[chat.messages.length - 1];
      if (last) last.content += "\n\n_(Paused after 8 file-reading rounds. Say \"continue\" to keep going.)_";
      saveChats(); renderChat(); return;
    }
    readRounds++;
    readFilesText(chat, paths).then((res) => {
      const text = typeof res === "string" ? res : res.text, imgs = (res && res.images) || [];
      attachments = [{ name: "requested files (" + paths.length + ")", kind: "text", text, fileRead: true }]
        .concat(imgs.map((im) => ({ name: im.name, type: "image/jpeg", kind: "image", dataUrl: im.dataUrl, fileRead: true })));
      renderAttachments();
      input.value = "Here are the files you asked for (round " + readRounds + "). Continue.";
      autosize(); send();
    });
  }

  const FILE_RETURN_SYSTEM_PROMPT =
    "The user can attach files or a .zip, and this app can give them back a downloadable zip. When they ask you to " +
    "change, fix, add or create files, return EACH changed or new file COMPLETE (never partial, never \"rest unchanged\") " +
    "in exactly this format, with the path relative to the zip root:\n[[file: path/to/file.ext]]\n(full file contents)\n[[/file]]\n" +
    "To delete a file write [[delete: path/to/file.ext]]. Only include files that actually change. Do not wrap the contents in " +
    "markdown fences. Never say you can't make zips: the app builds the zip from your tags. Explain the changes briefly outside the tags.";

  const FILE_TAG_RE = /\[\[file:\s*([^\]\n]+?)\s*\]\]\n?([\s\S]*?)\n?\[\[\/file\]\]/gi;
  const DELETE_TAG_RE = /\[\[delete:\s*([^\]\n]+?)\s*\]\]/gi;
  // Pulls [[file:]] blocks out of a reply (so other tag handling can't touch code inside them) and
  // returns the text to put back afterwards.
  function extractFileTags(reply) {
    const held = [], files = [], dels = [];
    const clean = (p) => p.replace(/\\/g, "/").split("/").filter((x) => x && x !== "." && x !== "..").join("/");
    reply.content = reply.content.replace(FILE_TAG_RE, (m, path, body) => {
      body = body.replace(/^```[\w+-]*\n/, "").replace(/\n```\s*$/, "");
      path = clean(path); if (!path) return m;
      files.push({ path, content: body });
      held.push("**📄 " + path + "**\n```" + (path.split(".").pop() || "").toLowerCase() + "\n" + body + "\n```");
      return "\uE000" + (held.length - 1) + "\uE000";
    });
    reply.content = reply.content.replace(DELETE_TAG_RE, (m, p) => { p = clean(p); if (!p) return m; dels.push(p); return "🗑️ _removed " + p + "_"; });
    if (files.length || dels.length) { reply.files = files; reply.deleted = dels; }
    return held;
  }

  async function downloadZipFor(m) {
    const chat = currentChat();
    if (!chat || typeof JSZip === "undefined") return;
    await ensureZip(chat.id);
    const base = workZips.get(chat.id);
    const out = new JSZip();
    if (base) for (const z of Object.values(base.zip.files)) { if (!z.dir) out.file(z.name, await z.async("uint8array")); }
    chat.messages.slice(0, chat.messages.indexOf(m) + 1).forEach((x) => {
      (x.files || []).forEach((f) => out.file(f.path, f.content));
      (x.deleted || []).forEach((p) => out.remove(p));
    });
    const blob = await out.generateAsync({ type: "blob", compression: "DEFLATE" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = base ? base.name.replace(/\.(zip|tar\.gz|tgz|tar|gz)$/i, "") + "-modified.zip" : "modified-files.zip";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 8000);
  }


  /* ---------- Project folder mode (real files on disk, changes shown as diffs) ---------- */
  let project = null;   // { root, name, files:[{path,size}] } while a folder is open
  const projApi = () => window.oasisProject || null;
  const hasProjectApi = () => !!projApi();
  function setProject(p) {
    if (!p || !project || project.root !== p.root) projDocCache.clear();
    project = p;
    const b = $("projectBtn");
    if (b) { b.classList.toggle("on", !!p); b.title = p ? "Project: " + p.name + " (click to close)" : "Open a project folder"; }
    store.set("lmchat.projectRoot", p ? p.root : null);
  }
  async function toggleProject() {
    if (!hasProjectApi()) { alert("Project folders only work inside the Oasis Electron app (the folder bridge was not found)."); return; }
    if (project) { if (confirm("Close project \"" + project.name + "\"?")) setProject(null); return; }
    const p = await projApi().projectPick(); if (p) setProject(p);
  }
  async function refreshProject() { if (project && hasProjectApi()) { const p = await projApi().projectOpen(project.root); if (p) setProject(p); } }
  async function initProject() {
    const b = $("projectBtn"); if (b) b.onclick = toggleProject;
    const root = store.get("lmchat.projectRoot", null);
    if (root && hasProjectApi()) { const p = await projApi().projectOpen(root); if (p) setProject(p); }
  }
  async function projectPrompt() {
    const budget = await lmContextChars();
    let list = "", n = 0;
    for (const f of project.files) { const line = f.path + " (" + f.size + " B)\n"; if (list.length + line.length > budget / 3) break; list += line; n++; }
    return "The user opened a real project folder \"" + project.name + "\" (" + project.files.length + " files). You can only see the file list below. " +
      "To look at files write [[read: path/to/file]] (max 4 per reply; very long files come in parts: [[read: path#2]] is part 2). The app sends the contents back automatically and you continue. PDF, Word, Excel, PowerPoint and similar files come back as extracted text (you cannot edit those as text), and images are shown to you if the model can see images. " +
      "Read only what you need and never guess a file's contents. To change or create a file write [[file: path/to/file]] then the COMPLETE new contents then [[/file]] " +
      "(never partial; no markdown fences inside); to delete write [[delete: path]]. Nothing is written until the user approves each change as a diff, so make small, focused changes " +
      "and keep everything else in the file exactly as it was. Explain briefly outside the tags. " + FIND_HINT + "\n\nFILES" + (n < project.files.length ? " (first " + n + " shown)" : "") + ":\n" + list;
  }
  function slicePart(key, t, part, per) {
    if (t.length <= per) return t;
    const k = Math.ceil(t.length / per), n = Math.min(Math.max(part || 1, 1), k);
    return t.slice((n - 1) * per, n * per) + "\n...[part " + n + " of " + k + (n < k ? "; read the next with [[read: " + key + "#" + (n + 1) + "]]" : "") + "]";
  }
  const projDocCache = new Map();   // "path:size" -> extracted document (cleared when the project changes)
  async function readProjectFiles(paths) {
    const budget = await lmContextChars(), per = Math.max(3000, Math.round(budget / 3));
    const st = { used: 0, parts: [], images: [] };
    for (const p0 of paths) {
      const { p, part, page } = parseReadPath(p0);
      const hit = project.files.find((f) => f.path === p) || project.files.find((f) => f.path.endsWith("/" + p));
      const key = hit ? hit.path : p;
      const kind = X.classify(key);
      if (kind === "image" || kind === "imageOther" || kind === "zip" || kind === "tar" || X.isDoc(key)) {
        const r = await projApi().projectReadBin(key);
        if (!r || r.missing || r.error) { st.parts.push("=== " + key + " ===\n(" + (r && r.error ? r.error : "not found in the project") + ")"); continue; }
        await readEntry(st, key, () => X.toBytes(r.data), projDocCache, key + ":" + (r.size || 0), { part, page, per, budget });
        continue;
      }
      const r = await projApi().projectRead(key);
      if (!r || r.missing || r.error) { st.parts.push("=== " + key + " ===\n(" + (r && r.error ? r.error : "not found in the project") + ")"); continue; }
      addTextPart(st, key, r.text, part, per, budget, key);
    }
    return { text: st.parts.join("\n\n"), images: st.images };
  }

  function lineDiff(aText, bText) {
    const a = aText.split(/\r?\n/), b = bText.split(/\r?\n/);
    let pre = 0; while (pre < a.length && pre < b.length && a[pre] === b[pre]) pre++;
    let suf = 0; while (suf < a.length - pre && suf < b.length - pre && a[a.length - 1 - suf] === b[b.length - 1 - suf]) suf++;
    const am = a.slice(pre, a.length - suf), bm = b.slice(pre, b.length - suf);
    const out = a.slice(0, pre).map((s) => ({ t: " ", s }));
    if (am.length * bm.length > 2500000) { am.forEach((s) => out.push({ t: "-", s })); bm.forEach((s) => out.push({ t: "+", s })); }
    else {
      const n = am.length, m = bm.length, w = m + 1, L = new Uint16Array((n + 1) * w);
      for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
        L[i * w + j] = am[i] === bm[j] ? L[(i + 1) * w + j + 1] + 1 : Math.max(L[(i + 1) * w + j], L[i * w + j + 1]);
      let i = 0, j = 0;
      while (i < n && j < m) {
        if (am[i] === bm[j]) { out.push({ t: " ", s: am[i] }); i++; j++; }
        else if (L[(i + 1) * w + j] >= L[i * w + j + 1]) out.push({ t: "-", s: am[i++] });
        else out.push({ t: "+", s: bm[j++] });
      }
      while (i < n) out.push({ t: "-", s: am[i++] });
      while (j < m) out.push({ t: "+", s: bm[j++] });
    }
    a.slice(a.length - suf).forEach((s) => out.push({ t: " ", s }));
    return out;
  }
  function diffEl(lines) {
    const pre = document.createElement("pre"); pre.className = "diff-pre";
    const row = (text, cls) => { const d = document.createElement("div"); d.className = "d-row " + cls; d.textContent = text; return d; };
    const keep = new Array(lines.length).fill(false);
    lines.forEach((l, i) => { if (l.t !== " ") for (let k = Math.max(0, i - 2); k <= Math.min(lines.length - 1, i + 2); k++) keep[k] = true; });
    let shown = 0, gap = false;
    for (let i = 0; i < lines.length; i++) {
      if (!keep[i]) { gap = true; continue; }
      if (gap && shown) pre.appendChild(row("…", "d-gap"));
      gap = false;
      if (++shown > 400) { pre.appendChild(row("… (diff truncated)", "d-gap")); break; }
      pre.appendChild(row(lines[i].t + " " + lines[i].s, lines[i].t === "+" ? "d-add" : lines[i].t === "-" ? "d-del" : ""));
    }
    if (!shown) pre.appendChild(row("(no changes)", "d-gap"));
    return pre;
  }
  async function applyChange(m, it) {
    const api = projApi(); let r;
    if (it.del) r = await api.projectDelete(it.path);
    else {
      const cur = await api.projectRead(it.path); let data = it.content;
      if (cur && cur.text && cur.text.includes("\r\n") && !data.includes("\r\n")) data = data.replace(/\n/g, "\r\n");   // keep Windows line endings
      r = await api.projectWrite(it.path, data);
    }
    m.status = m.status || {};
    m.status[it.path] = r && r.ok ? "applied" : "failed: " + ((r && r.error) || "unknown error");
  }
  function renderDiffCards(m, box) {
    box.innerHTML = "";
    m.status = m.status || {};
    const api = projApi();
    const same = !!project && project.root === m.project;
    const items = (m.files || []).map((f) => ({ path: f.path, content: f.content, del: false })).concat((m.deleted || []).map((p) => ({ path: p, del: true })));
    const open = items.filter((it) => !m.status[it.path]);
    const apply = (it) => applyChange(m, it);
    const finish = async () => { saveChats(); await refreshProject(); renderDiffCards(m, box); apDecisionCheck(m); };
    if (same && open.length > 1) {
      const bar = document.createElement("div"); bar.className = "diff-bar";
      const all = document.createElement("button"); all.textContent = "Apply all (" + open.length + ")";
      all.onclick = async () => { all.disabled = true; for (const it of open) await apply(it); await finish(); };
      const none = document.createElement("button"); none.textContent = "Reject all";
      none.onclick = () => { open.forEach((it) => { m.status[it.path] = "rejected"; }); saveChats(); renderDiffCards(m, box); apDecisionCheck(m); };
      bar.append(all, none); box.appendChild(bar);
    }
    items.forEach((it) => {
      const card = document.createElement("div"); card.className = "diff-card";
      const head = document.createElement("div"); head.className = "diff-head";
      const name = document.createElement("b"); name.textContent = (it.del ? "🗑️ " : "") + it.path; head.appendChild(name);
      const st = m.status[it.path];
      if (st) {
        const tag = document.createElement("span"); tag.className = "diff-tag" + (st === "applied" ? " ok" : "");
        tag.textContent = st === "applied" ? "✓ applied (old copy saved in .oasis-backup)" : st; head.appendChild(tag);
      } else if (same) {
        const no = document.createElement("button"); no.textContent = "Reject";
        no.onclick = () => { m.status[it.path] = "rejected"; saveChats(); renderDiffCards(m, box); apDecisionCheck(m); };
        const ok = document.createElement("button"); ok.textContent = "Apply"; ok.className = "diff-apply";
        ok.onclick = async () => { ok.disabled = true; await apply(it); await finish(); };
        head.append(no, ok);
      }
      card.appendChild(head);
      if (!st) {
        const note = document.createElement("div"); note.className = "diff-note"; card.appendChild(note);
        if (!same) note.textContent = "Open the project folder this was made for to apply it.";
        else if (it.del) note.textContent = "This file will be deleted.";
        else {
          note.textContent = "Loading diff…";
          api.projectRead(it.path).then((cur) => {
            note.remove();
            const tag = document.createElement("span"); tag.className = "diff-tag"; tag.textContent = cur && cur.missing ? "new file" : "modified"; head.insertBefore(tag, head.children[1] || null);
            card.appendChild(diffEl(lineDiff(cur && cur.text !== undefined ? cur.text : "", it.content)));
          });
        }
      }
      box.appendChild(card);
    });
  }
  // Extras under an assistant reply: diff cards (project mode) or the Download-zip button (zip mode),
  // plus command cards when the AI proposed something to run.
  function refreshReplyExtras(m, wrap) {
    const old = wrap.querySelector(".extras"); if (old) old.remove();
    const hasFiles = !!(m.files && (m.files.length || (m.deleted || []).length));
    const hasRuns = !!(m.runs && m.runs.length);
    if (!hasFiles && !hasRuns) return;
    const box = document.createElement("div"); box.className = "extras";
    if (hasFiles) {
      if (m.project && hasProjectApi()) { const fb = document.createElement("div"); box.appendChild(fb); renderDiffCards(m, fb); }
      else {
        const dl = document.createElement("button");
        dl.textContent = "⬇ Download zip (" + (m.files.length + (m.deleted || []).length) + " changed)";
        dl.onclick = () => downloadZipFor(m).catch(() => alert("Couldn't build the zip."));
        box.appendChild(dl);
      }
    }
    if (hasRuns) {
      const rb = document.createElement("div"); rb.className = "run-box"; rb.dataset.first = m.runs[0].id;
      box.appendChild(rb); renderRunCards(m, rb);
    }
    wrap.insertBefore(box, wrap.querySelector(".actions"));
  }

  /* ---------- Running commands (you approve every one) ----------
     The AI can propose a command in a [[run]] block, or a visible PowerShell / Command Prompt window in a
     [[terminal]] block. Nothing happens until you click the button on the card, and the card shows the exact
     command. For [[run]], the output goes back to the AI automatically so it can fix its own mistakes. */
  const RUN_TAG_RE = /\[{1,2}run(?::\s*(cmd|powershell|sh))?\s*\]{1,2}\n?([\s\S]*?)\n?\[{1,2}\/run\]{1,2}/gi;
  const TERM_TAG_RE = /\[{1,2}terminal(?::\s*(cmd|powershell))?\s*\]{1,2}\n?([\s\S]*?)\n?\[{1,2}\/terminal\]{1,2}/gi;
  const MAX_RUN_CMD = 4000;
  const liveRuns = new Set();   // run ids that are executing right now
  const platformName = () => (projApi() && projApi().platform) || "";
  function execOn() { const a = projApi(); return !!(a && typeof a.projectRun === "function" && settings.commands !== false); }
  function shellLabel(sh) { return sh === "powershell" ? "PowerShell" : sh === "cmd" ? "Command Prompt" : "shell"; }
  function execPrompt() {
    const win = platformName() === "win32";
    let t = "";
    if (project) {
      t += "You can propose a command to run on the user's computer, inside their project folder \"" + project.name + "\". Write it like this:\n[[run]]\nthe command\n[[/run]]\n" +
        "The user sees the exact command on a card and must click Run every time; nothing runs otherwise. If they run it, its output and exit code are sent back to you automatically, " +
        "so you can read errors and fix them. Use it for things like running tests, a build, `node --check file.js`, or listing files. " +
        "Rules: one short command per block (chain with && if needed), at most 3 blocks per reply, it runs with no keyboard input and is stopped after 2 minutes, so never start " +
        "servers, watchers or anything that waits for input. Make file changes with [[file:]] blocks, not with shell redirection. Never propose anything destructive " +
        "(deleting files, formatting, git reset --hard, uninstalling) or installing software unless the user asked for it. Never put passwords or keys in a command. " +
        (win ? "On this Windows computer [[run]] uses Command Prompt (cmd) syntax; for PowerShell syntax write [[run: powershell]] instead. " : "[[run]] uses the sh shell on this computer. ") +
        "After proposing a command, stop and wait for the output; do not guess what it will print.";
    }
    if (win) {
      t += (t ? "\n\n" : "") + "You can also open a real PowerShell or Command Prompt window for the user, in their project folder (or their home folder if none is open), with a command typed in: " +
        "[[terminal: powershell]]\n[[/terminal]] opens an empty PowerShell window (use [[terminal: cmd]] for Command Prompt). To also type something into it, put the real command between the tags, for example [[terminal: powershell]]\nGet-Date\n[[/terminal]]. Never write the word \"command\" as the command. " +
        "Use this for things that keep running or need typing, like `npm start` or a dev server. The user must click Open on the card, and you do not see what happens in that window.";
    }
    return t;
  }
  function extractRunTags(reply) {
    if (!execOn()) return;
    const win = platformName() === "win32", runs = [];
    const take = (kind, m, shell, body) => {
      body = body.replace(/^```[\w+-]*\n/, "").replace(/\n```\s*$/, "").trim();
      if (kind === "terminal" && /^(the )?command( here)?$|^\.\.\.$|^<[^>]*>$/i.test(body)) body = "";   // a copied placeholder, not a real command
      if (kind === "run" && !body) return m;
      if (body.length > MAX_RUN_CMD) return "_(a command that was too long to run was skipped)_";
      if (runs.length >= 4) return "_(extra command skipped; at most 4 per reply)_";
      if (kind === "terminal" && !win) return "_(terminal windows are only available on Windows)_";
      shell = win ? (shell === "powershell" ? "powershell" : (kind === "terminal" && !shell ? "powershell" : "cmd")) : "sh";
      runs.push({ id: "r" + Date.now().toString(36) + runs.length + Math.random().toString(36).slice(2, 5), kind, shell, cmd: body, status: "pending" });
      return kind === "run" ? "▶ _proposed a command — approve it on the card below_" : "🖥️ _proposed opening a " + shellLabel(shell) + " window — approve it on the card below_";
    };
    reply.content = reply.content
      .replace(RUN_TAG_RE, (m, sh, body) => take("run", m, sh && sh.toLowerCase(), body))
      .replace(TERM_TAG_RE, (m, sh, body) => take("terminal", m, sh && sh.toLowerCase(), body));
    if (runs.length) reply.runs = runs;
  }
  function rerenderRuns(m) {
    if (!m.runs || !m.runs.length) return;
    const b = msgs.querySelector('.run-box[data-first="' + m.runs[0].id + '"]');
    if (b) renderRunCards(m, b);
  }
  function renderRunCards(m, box) {
    box.innerHTML = "";
    const api = projApi();
    const same = !!project && !!m.project && project.root === m.project;
    const folder = (m.project || (project && project.root) || "").split(/[\\/]/).filter(Boolean).pop() || "your home folder";
    (m.runs || []).forEach((r) => {
      if (r.status === "running" && !liveRuns.has(r.id)) { r.status = "interrupted"; }   // app was closed mid-run
      const card = document.createElement("div"); card.className = "diff-card run-card";
      const head = document.createElement("div"); head.className = "diff-head";
      const name = document.createElement("b");
      name.textContent = r.kind === "run" ? "▶ Run in " + folder + "  (" + shellLabel(r.shell) + ")" : "🖥️ Open " + shellLabel(r.shell) + " window";
      head.appendChild(name);
      const tag = (txt, ok) => { const t = document.createElement("span"); t.className = "diff-tag" + (ok === true ? " ok" : ok === false ? " bad" : ""); t.textContent = txt; head.appendChild(t); };
      const btn = (label, cls, fn) => { const b = document.createElement("button"); b.textContent = label; if (cls) b.className = cls; b.onclick = fn; head.appendChild(b); return b; };
      card.appendChild(head);
      const pre = document.createElement("pre"); pre.className = "run-cmd"; pre.textContent = r.cmd || "(just open the window)"; card.appendChild(pre);
      const note = (txt) => { const d = document.createElement("div"); d.className = "diff-note"; d.textContent = txt; card.appendChild(d); };

      if (r.status === "pending") {
        if (r.kind === "run" && !same) note("Open the project folder this was made for (folder button next to the message box) to run it.");
        else {
          btn("Skip", "", () => { r.status = "skipped"; saveChats(); rerenderRuns(m); maybeSendRunOutput(m); });
          btn(r.kind === "run" ? "Run" : "Open", "diff-apply", (ev) => { ev.currentTarget.disabled = true; runCommand(m, r); });
          note(r.kind === "run" ? "Runs on your computer with your permissions, inside the project folder. It is stopped after 2 minutes." : "Opens a separate window on your computer. You will not be able to send its output back automatically.");
        }
      } else if (r.status === "running") {
        tag("running…");
        btn("Stop", "", () => { if (api && api.projectRunCancel) api.projectRunCancel(r.id); });
      } else if (r.status === "skipped") tag("skipped");
      else if (r.status === "interrupted") tag("interrupted (the app was closed while it ran)", false);
      else if (r.status === "opened") tag("✓ window opened", true);
      else if (r.status === "error") { tag("couldn't run", false); note(r.error || "unknown error"); }
      else if (r.status === "done") {
        const secs = r.ms != null ? (r.ms / 1000).toFixed(1) + " s" : "";
        if (r.timedOut) tag("stopped after 2 minutes", false);
        else if (r.cancelled) tag("stopped by you", false);
        else tag("exit code " + r.exitCode + (secs ? " · " + secs : ""), r.exitCode === 0);
        const out = document.createElement("pre"); out.className = "run-out"; out.textContent = (r.output || "").trim() || "(no output)"; card.appendChild(out);
        if (r.sent) note("Output sent to the AI.");
        else { const row = document.createElement("div"); row.className = "diff-note"; const b = document.createElement("button"); b.textContent = "Send output to the AI"; b.onclick = () => { const chat = currentChat(); if (chat) sendRunOutputs(chat, m, true); }; row.appendChild(b); card.appendChild(row); }
      }
      box.appendChild(card);
    });
  }
  async function runCommand(m, r) {
    const api = projApi(); if (!api) return;
    if (r.kind === "terminal") {
      let res; try { res = await api.terminalOpen({ shell: r.shell, command: r.cmd }); } catch (e) { res = { error: e.message }; }
      if (res && res.ok) r.status = "opened"; else { r.status = "error"; r.error = (res && res.error) || "couldn't open the window"; }
      saveChats(); rerenderRuns(m); return;
    }
    r.status = "running"; liveRuns.add(r.id); rerenderRuns(m);
    let res; try { res = await api.projectRun({ id: r.id, shell: r.shell, command: r.cmd }); } catch (e) { res = { error: e.message }; }
    liveRuns.delete(r.id);
    if (!res || res.error) { r.status = "error"; r.error = (res && res.error) || "no answer from the app"; }
    else {
      r.status = "done"; r.exitCode = res.exitCode; r.timedOut = !!res.timedOut; r.cancelled = !!res.cancelled; r.ms = res.ms;
      r.output = String(res.output || "").slice(-40000);   // keep saved chats small
    }
    saveChats(); rerenderRuns(m);
    maybeSendRunOutput(m);
  }
  // When every command in a reply has been decided (run or skipped), send all the output back in one message.
  function maybeSendRunOutput(m) {
    const runs = (m.runs || []).filter((r) => r.kind === "run");
    if (runs.some((r) => r.status === "pending" || r.status === "running")) return;
    if (!runs.some((r) => (r.status === "done" || r.status === "error") && !r.sent)) return;
    const chat = currentChat();
    if (!chat || !chat.messages.includes(m) || streaming || input.value.trim() || attachments.length) return;   // the card keeps a "Send output" button
    sendRunOutputs(chat, m, false);
  }
  async function sendRunOutputs(chat, m, manual) {
    if (streaming) { alert("Wait for the AI to finish replying, then press the button again."); return; }
    const runs = (m.runs || []).filter((r) => r.kind === "run");
    const todo = runs.filter((r) => (r.status === "done" || r.status === "error") && !r.sent);
    if (!todo.length) return;
    const budget = await lmContextChars(), cap = Math.min(12000, Math.max(3000, Math.round(budget / 4)));
    const trim = (t) => t.length <= cap ? t : t.slice(0, Math.round(cap * 0.25)) + "\n…[middle left out]…\n" + t.slice(-Math.round(cap * 0.75));
    const parts = runs.filter((r) => r.status === "done" || r.status === "error" || r.status === "skipped").map((r) => {
      if (r.status === "skipped") return "$ " + r.cmd + "\n(the user chose not to run this one)";
      if (r.status === "error") return "$ " + r.cmd + "\n(it could not be started: " + (r.error || "unknown error") + ")";
      const how = r.timedOut ? "stopped after 2 minutes" : r.cancelled ? "stopped by the user" : "exit code " + r.exitCode;
      return "$ " + r.cmd + "\n[" + how + (r.ms != null ? ", " + (r.ms / 1000).toFixed(1) + " s" : "") + "]\n" + (trim((r.output || "").trim()) || "(no output)");
    });
    runs.forEach((r) => { if (todo.includes(r)) r.sent = true; });
    saveChats(); rerenderRuns(m);
    attachments = [{ name: "command output", kind: "text", text: parts.join("\n\n"), runOutput: true }];
    renderAttachments();
    input.value = "I ran " + (todo.length > 1 ? "the commands" : "the command") + " you proposed. The output is attached. Continue (if something failed, fix it).";
    autosize(); send();
  }

  function renderAttachments() { syncSendBtn();
    const box = $("attached"); box.innerHTML = "";
    attachments.forEach((a, i) => {
      const c = document.createElement("span"); c.className = "file-chip";
      c.append(a.busy ? "⏳ Reading " + a.name + "…" : a.kind === "image" ? "🖼️ " + a.name : a.name);
      if (a.busy) { box.appendChild(c); return; }
      const x = document.createElement("button"); x.textContent = "×"; x.setAttribute("aria-label", "Remove " + a.name);
      x.onclick = () => { attachments.splice(i, 1); renderAttachments(); };
      c.appendChild(x); box.appendChild(c);
    });
  }

  /* ---------- Persistent webcam / screen share vision feed ---------- */
  (function () {
    const oldDlg = $("camDlg");
    const feed = $("visionFeed");
    const video = $("feedVideo");
    const canvas = $("camCanvas");
    const title = $("visionFeedTitle");
    const status = $("visionFeedStatus");
    const modeLabel = $("visionFeedMode");
    const overlay = $("visionFeedOverlay");
    const autoWatch = $("visionAutoWatch");
    const attachBtn = $("visionCapture");
    const minBtn = $("visionFeedMin");
    const closeBtn = $("visionFeedClose");
    const head = $("visionFeedHead");
    if (!feed || !video) return;

    let stream = null;
    let mode = null;
    let latestFrame = null;
    let watchTimer = null;
    let watchBusy = false;

    // Exposed for send(): the latest frame is attached transiently to the
    // next LM Studio vision request, without bloating saved chat history.
    window.lmchatGetLiveVisionFrame = function () {
      if (!stream || !video.videoWidth || !video.videoHeight) return null;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
      latestFrame = canvas.toDataURL("image/jpeg", 0.72);
      return latestFrame;
    };

    function stopStream() {
      if (watchTimer) { clearInterval(watchTimer); watchTimer = null; }
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        stream = null;
      }
      video.srcObject = null;
      latestFrame = null;
      feed.hidden = true;
      feed.classList.remove("minimized");
      if (autoWatch) autoWatch.checked = false;
      status.textContent = "AI sees latest frame";
    }

    function showFeed(kind) {
      mode = kind;
      title.textContent = kind === "webcam" ? "Live Webcam" : "Live Screen";
      modeLabel.textContent = kind === "webcam" ? "WEBCAM" : "SCREEN";
      status.textContent = "AI sees latest frame";
      overlay.textContent = kind === "webcam" ? "Starting webcam…" : "Choose a screen, window, or tab…";
      feed.hidden = false;
      if (oldDlg && oldDlg.open) oldDlg.close();
    }

    async function openFeed(kind) {
      if (stream) stopStream();
      showFeed(kind);
      try {
        stream = kind === "webcam"
          ? await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
          : await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        video.srcObject = stream;
        await video.play().catch(() => {});
        overlay.style.display = "none";
        const track = stream.getVideoTracks()[0];
        if (track) track.addEventListener("ended", stopStream);
      } catch (err) {
        overlay.style.display = "grid";
        overlay.textContent = kind === "webcam"
          ? "Webcam access was cancelled or blocked."
          : "Screen sharing was cancelled.";
        stream = null;
      }
    }

    function captureStill() {
      const frame = window.lmchatGetLiveVisionFrame && window.lmchatGetLiveVisionFrame();
      if (!frame) return;
      attachments.push({
        name: (mode === "webcam" ? "Webcam" : "Screen") + " snapshot.jpg",
        type: "image/jpeg", kind: "image", dataUrl: frame
      });
      renderAttachments();
    }

    function startAutoWatch() {
      if (watchTimer) clearInterval(watchTimer);
      if (!autoWatch.checked || !stream) return;
      // Optional autonomous vision: periodically asks the same vision model
      // what changed, but only when the user enables "AI Watch".
      watchTimer = setInterval(async () => {
        if (watchBusy || !stream || !video.videoWidth) return;
        watchBusy = true;
        try {
          const frame = window.lmchatGetLiveVisionFrame();
          if (!frame) return;
          // Store only the latest observation for the next chat turn.
          window.lmchatLiveVisionObservation = frame;
          status.textContent = "AI Watch: frame ready";
        } finally {
          watchBusy = false;
        }
      }, 1500);
    }

    autoWatch.addEventListener("change", startAutoWatch);
    attachBtn.onclick = captureStill;
    minBtn.onclick = () => feed.classList.toggle("minimized");
    closeBtn.onclick = stopStream;

    $("camBtn").onclick = () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("This browser can't access the webcam."); return;
      }
      openFeed("webcam");
    };
    $("screenBtn").onclick = () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        alert("This browser can't share the screen."); return;
      }
      openFeed("screen");
    };

    // Drag the floating feed without changing the actual shared source.
    let drag = null;
    head.addEventListener("pointerdown", e => {
      if (e.target.closest("button")) return;
      const r = feed.getBoundingClientRect();
      drag = {x:e.clientX,y:e.clientY,left:r.left,top:r.top};
      head.setPointerCapture(e.pointerId);
    });
    head.addEventListener("pointermove", e => {
      if (!drag || feed.classList.contains("minimized") === false && !feed.querySelector(".vision-feed-body")) return;
      const x = Math.max(4, Math.min(window.innerWidth-feed.offsetWidth-4, drag.left + e.clientX-drag.x));
      const y = Math.max(4, Math.min(window.innerHeight-feed.offsetHeight-4, drag.top + e.clientY-drag.y));
      feed.style.left = x+"px"; feed.style.top = y+"px";
      feed.style.right = "auto"; feed.style.bottom = "auto";
    });
    head.addEventListener("pointerup", () => { drag = null; });

    // If an old dialog is still reachable from stale markup, keep it harmless.
    if (oldDlg) {
      oldDlg.addEventListener("cancel", e => { e.preventDefault(); });
    }
  })();

  /* ---------- Streaming scroll behavior ---------- */
  let followStream = true;
  const scrollNotice = $("scrollNotice");

  function isAtBottom() {
    return msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 48;
  }

  function updateScrollState() {
    if (isAtBottom()) {
      followStream = true;
      scrollNotice.classList.remove("show");
    } else if (streaming) {
      followStream = false;
      scrollNotice.classList.add("show");
    }
  }

  msgs.addEventListener("scroll", updateScrollState, { passive: true });
  scrollNotice.onclick = () => {
    followStream = true;
    msgs.scrollTo({ top: msgs.scrollHeight, behavior: "smooth" });
    scrollNotice.classList.remove("show");
  };

  /* ---------- Sending ---------- */
  async function send() {
    if (interrupting || compacting) return;
    const internal = internalSend; internalSend = null;   // set by sendInternal(): a hidden message from the app itself
    if (!internal && !input.value.trim() && !attachments.length) return;
    if (currentId && !workZips.has(currentId)) await ensureZip(currentId);   // bring back this chat's saved zip
    if (internal && (streaming || interrupting || compacting || input.value.trim() || attachments.length)) return;
    if (streaming) {
      // New message while the AI is still replying: stop it (its partial reply is kept), then send.
      interrupting = true;
      stopGeneration();
      await new Promise((r) => setTimeout(r, 0));
      interrupting = false;
    }
    const text = internal ? internal.text : input.value.trim();
    if (!text && !attachments.length) return;
    if (attachments.some((a) => a.busy)) return;   // a file is still being read
    if (!attachments.some((a) => a.fileRead)) readRounds = 0;   // a real message from you restarts the round count
    if (!internal && !attachments.some((a) => a.fileRead || a.runOutput)) noteUserSent();   // you spoke: restart autopilot's step count and the quiet timer

    let chat = currentChat();
    if (!chat) {
      chat = { id: "c" + Date.now(), title: (text || attachments[0].name).slice(0, 48), messages: [], updated: Date.now(), autoWork: nextChatAuto };
      chats.unshift(chat); currentId = chat.id;
    }
    await makeRoom(chat);   // very long chat: summarize the oldest part first (nothing is deleted)
    if (internal && (streaming || input.value.trim() || attachments.length)) return;

    let content = text, display = text;
    const imageAttachments = attachments.filter((a) => a.kind === "image");
    const textAttachments = attachments.filter((a) => a.kind !== "image");
    if (textAttachments.length) {
      content += textAttachments.map((a) => "\n\nAttached file: " + a.name + "\n```\n" + a.text + "\n```").join("");
      display += (text ? "\n\n" : "") + textAttachments.map((a) => "📎 " + a.name).join("\n");
    }
    if (imageAttachments.length) {
      display += ((display ? "\n\n" : "") + imageAttachments.map((a) => "🖼️ " + a.name).join("\n"));
      const parts = [];
      if (content) parts.push({ type: "text", text: content });
      imageAttachments.forEach((a) => parts.push({ type: "image_url", image_url: { url: a.dataUrl } }));
      content = parts;
    }
    chat.messages.push({ role: "user", content, display, fileRead: attachments.some((a) => a.fileRead), runOutput: attachments.some((a) => a.runOutput), shownOnce: attachments.some((a) => a.fromZip && a.kind === "image"), hidden: internal ? true : undefined, proactive: internal && internal.proactive ? true : undefined });
    attachments.filter((a) => a.zip).forEach((a) => { workZips.set(chat.id, Object.assign({ name: a.name, zip: a.zip, large: a.large }, zipInfo(a.zip))); persistZip(chat.id, a); });
    input.value = ""; autosize(); attachments = []; renderAttachments();

    const reply = { role: "assistant", content: "" };
    const who = window.lmchatActiveCharacter && window.lmchatActiveCharacter();   // set by personas.js
    if (who) reply.persona = who;
    if (project) reply.project = project.root;
    if (internal && internal.proactive) reply.proactive = true;
    if (internal && internal.auto) reply.auto = true;
    if (autoOn(chat) && !(internal && internal.proactive)) { ap.chatId = chat.id; ap.state = "working"; if (!internal) apSay("Working…"); }
    chat.messages.push(reply);
    chat.updated = Date.now();
    setMode();
    const lastUser = chat.messages[chat.messages.length - 2];
    addMessageEl(lastUser);
    const body = addMessageEl(reply);
    $("history").classList.remove("open");

    const buildPayload = async () => {
    const sumUpto = (chat.summary && chat.summary.upto) || 0;
    const lastIdx = chat.messages.length - 2;
    const payload = chat.messages.slice(0, -1).map((m, i) => i < sumUpto ? null : ({ role: m.role, content: payloadContent(m, i, lastIdx) })).filter(Boolean);

    // If a webcam/screen feed is active, give the vision model the current
    // frame automatically with this turn. The frame is NOT saved in chat
    // history, so storage does not fill up with video frames.
    const liveFrame = window.lmchatGetLiveVisionFrame && window.lmchatGetLiveVisionFrame();
    if (liveFrame && payload.length) {
      const last = payload[payload.length - 1];
      if (Array.isArray(last.content)) {
        last.content = last.content.concat([{ type: "image_url", image_url: { url: liveFrame } }]);
      } else {
        last.content = [
          { type: "text", text: String(last.content || "") + "\n\n[Live vision frame: this is the current webcam/screen feed.]"},
          { type: "image_url", image_url: { url: liveFrame } }
        ];
      }
    }
    if (settings.memoryEnabled) {
      const excerpt = findRelevantPastExcerpt(internal ? "" : text, chat.id);
      if (excerpt) payload.unshift({ role: "system", content: "Recall from this user's saved past conversations. You CAN see these. Use them when the user refers to earlier chats or when relevant (don't claim you have no memory of past chats); otherwise ignore them.\n\n" + excerpt });
      if (settings.memory) payload.unshift({ role: "system", content: "Long-term memory notes about this user (saved from earlier chats):\n" + settings.memory });
      payload.unshift({ role: "system", content: MEMORY_SYSTEM_PROMPT });
    }
    if (textAttachments.length || workZips.has(chat.id) || chat.messages.some((m) => m.role === "user" && /📎/.test(m.display || ""))) payload.unshift({ role: "system", content: FILE_RETURN_SYSTEM_PROMPT });
    if (project || workZips.has(chat.id)) payload.unshift({ role: "system", content: EDIT_SYSTEM_PROMPT });
    if (chat.summary && chat.summary.text) payload.unshift({ role: "system", content: SUMMARY_PREFIX + chat.summary.text });
    if (chat.plan) payload.unshift({ role: "system", content: "YOUR CURRENT PLAN for this chat (kept by the app and re-sent every turn; rewrite it with [[plan]]...[[/plan]] when it changes):\n" + chat.plan });
    if (chat.autoWork) payload.unshift({ role: "system", content: AUTOPILOT_PROMPT });
    if (project) payload.unshift({ role: "system", content: await projectPrompt() });
    if (execOn()) payload.unshift({ role: "system", content: execPrompt() });
    if (workZips.has(chat.id) && workZips.get(chat.id).large) payload.unshift({ role: "system", content: READ_SYSTEM_PROMPT });
    const zi = workZips.get(chat.id);
    if (zi && (zi.hasImages || zi.hasDocs)) {
      const vis = await lmVision();
      payload.unshift({ role: "system", content: "This zip also holds " + [zi.hasDocs && "documents (PDF, Word, Excel, PowerPoint…)", zi.hasImages && "images"].filter(Boolean).join(" and ") + ". " +
        "Documents are given to you as extracted plain text; you can read them but cannot edit them as text, so describe changes in words or write a new text/CSV file. " +
        "To look at a file you have not been shown, write [[read: path]] (at most 4 per reply)." +
        (zi.hasImages ? (vis === false ? " The loaded model cannot see images: say so if an image matters, and suggest loading a vision model." : " Images are shown to you once to save space; read one again if you need to look at it again.") : "") });
    }
    if (settings.webSearch) payload.unshift({ role: "system", content: SEARCH_SYSTEM_PROMPT });
    payload.unshift({ role: "system", content: APPS_SYSTEM_PROMPT + toolbarPrompt() + (winOn() ? "\n\n" + winPrompt() : "") });
    payload.unshift({ role: "system", content: TOOL_API_SYSTEM_PROMPT });
    if (settings.realImages) payload.unshift({ role: "system", content: REAL_IMAGE_SYSTEM_PROMPT });
    if (settings.imageGen) payload.unshift({ role: "system", content: IMAGE_SYSTEM_PROMPT });
    if (settings.system) payload.unshift({ role: "system", content: settings.system });
    return payload;
    };
    let payload = await buildPayload();

    followStream = isAtBottom();
    scrollNotice.classList.remove("show");
    const mine = { ctl: new AbortController(), reply };
    activeSend = mine;
    setStreaming(true);
    let raf = 0;
    const paint = () => {
      raf = 0;
      body.innerHTML = md(maskStreamingTags(reply.content)) || '<span class="thinking"><i></i><i></i><i></i></span>';
      if (activeSend !== mine) return;   // stopped or replaced: don't touch scrolling
      if (followStream) msgs.scrollTop = msgs.scrollHeight;
      else scrollNotice.classList.add("show");
    };

    let wantRead = null;
    try {
      const post = () => {
        const bodyObj = { messages: payload, temperature: settings.temperature, stream: true };
        if (settings.model) bodyObj.model = settings.model;
        return fetch(baseUrl() + "/chat/completions", { method: "POST", headers: headers(), body: JSON.stringify(bodyObj), signal: mine.ctl.signal });
      };
      let r = await post();
      if (!r.ok) {
        let detail = ""; try { detail = (await r.clone().json()).error.message || ""; } catch (e) {}
        if (r.status === 400 && /context|token|length|exceed|too (long|large)|n_ctx|overflow/i.test(detail) && settings.compact !== false && !reply.proactive) {
          // The chat is longer than the model can hold: summarize more of it and try once more.
          body.innerHTML = '<span class="thinking"><i></i><i></i><i></i></span> <em>The chat is longer than the model can hold, so I am summarizing the older part…</em>';
          await makeRoom(chat, { force: true });
          payload = await buildPayload();
          r = await post();
          if (!r.ok) { detail = ""; try { detail = (await r.json()).error.message || ""; } catch (e) {} throw new Error("Server replied " + r.status + (detail ? ": " + detail : "")); }
        } else throw new Error("Server replied " + r.status + (detail ? ": " + detail : ""));
      }
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop();
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const d = t.slice(5).trim();
          if (d === "[DONE]") continue;
          try {
            const j = JSON.parse(d);
            const piece = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content;
            if (piece) { reply.content += piece; if (!raf) raf = requestAnimationFrame(paint); }
          } catch (e) {}
        }
      }
      if (!reply.content) reply.content = textAttachments.length ? "(The model returned an empty reply. The attached files probably did not fit in its context window. In LM Studio, reload the model with a bigger Context Length, or attach a smaller zip or fewer files.)" : "(The model returned an empty reply.)";
      else if (reply.proactive) cleanProactive(reply);
      else wantRead = await processReplyTags(reply, text, chat);
    } catch (e) {
      if (e.name === "AbortError") {
        if (!reply.content) reply.content = "(Stopped.)";
      } else {
        reply.failed = true;
        const msg = "Could not reach LM Studio at " + baseUrl() + ". Start the server in the Developer tab, load a model, and turn on Enable CORS. (" + e.message + ")";
        reply.content = reply.content ? reply.content + "\n\n" + msg : msg;
        body.classList.add("err");
        setStatus("bad", "LM Studio not reachable");
      }
    } finally {
      if (raf) cancelAnimationFrame(raf);
      paint();
      if (reply.files || reply.deleted || reply.runs) { const w = body.parentElement; if (w) refreshReplyExtras(reply, w); }
      const wasCurrent = activeSend === mine;
      if (wasCurrent) {   // only reset the UI if a newer reply hasn't taken over
        activeSend = null; setStreaming(false);
        scrollNotice.classList.remove("show");
        input.focus();
      }
      if (reply.proactive && (cancelledReplies.has(reply) || reply.failed || /^\((The model returned|Stopped)/.test(reply.content || ""))) reply.dropMe = true;
      if (reply.dropMe) dropReply(chat, reply); else chat.updated = Date.now();
      saveChats(); renderHistory(); renderRecent();
      if (wasCurrent && wantRead && wantRead.length && !cancelledReplies.has(reply)) {
        if (autoOn(chat)) { ap.chatId = chat.id; ap.state = "working"; apSay("Reading files…"); }
        setTimeout(() => autoContinueReads(wantRead, chat), 0);
      } else if (wasCurrent && reply.dropMe && reply.auto && autoOn(chat)) {
        ap.state = reply.ap === "done" ? "done" : "idle"; apSay(reply.ap === "done" ? "✅ Finished." : "");
      } else if (wasCurrent && !cancelledReplies.has(reply) && !reply.dropMe) afterReply(chat, reply);
      renderWorkBar();
    }
  }

  /* ===========================================================
     AUTOPILOT, LONG-CHAT MEMORY, EDIT BLOCKS, PROJECT SEARCH,
     AND SPEAKING UP ON ITS OWN
     =========================================================== */

  const AUTOPILOT_PROMPT =
    "AUTOPILOT IS ON for this chat. You work like a teammate who keeps going on a long job without being told to continue. " +
    "The app looks after your memory: it keeps your PLAN and a summary of old messages and re-sends them every turn, so a long project never makes you lose the thread.\n" +
    "How to work:\n" +
    "1. If there is no plan yet and the job needs more than one step, first write one:\n[[plan]]\n- [ ] first step\n- [ ] second step\n[[/plan]]\n(3-12 short concrete steps; you may add steps later).\n" +
    "2. Each turn do ONE small step (read files, make a focused change, or propose one command), then rewrite the WHOLE plan with finished steps marked [x] and any new steps you discovered. Never delete finished steps. Under a line 'Notes:' at the end keep decisions, file names and gotchas worth remembering.\n" +
    "3. While [ ] steps remain, the app automatically tells you to continue. When EVERYTHING is finished write [[done]] with a short summary.\n" +
    "4. Only when you are truly blocked or need a decision from the user, ask ONE clear question and end the reply with [[waiting]].\n" +
    "5. Do not ask permission for small steps and do not repeat yourself. If something failed twice, try a different approach or ask.\n" +
    "6. Keep chat text short; the real work goes into files.";
  const AP_CONTINUE = "Continue with the next step of your plan. Do one small step, then update the plan with [[plan]]. If everything is finished write [[done]]; if you need me, ask one clear question and end with [[waiting]].";
  const PLAN_NUDGE = "You have not written a plan yet. If my request needs more than one step, write a plan now with [[plan]]...[[/plan]] and start on the first step. If it was a simple question you already fully answered, reply with just [[done]].";
  const PLAN_WORDS = /\b(build|make|create|add|fix|write|implement|update|improve|refactor|change|continue|keep working|project|finish|set up|convert|redesign|debug|port|rewrite)\b/i;
  const EDIT_SYSTEM_PROMPT =
    "For a SMALL change inside a LONG file (over about 150 lines) do NOT rewrite the whole file. Use edit blocks instead:\n" +
    "[[edit: path/to/file]]\n<<<<<<< SEARCH\nthe exact lines currently in the file (enough to be unique)\n=======\nthe new lines\n>>>>>>> REPLACE\n[[/edit]]\n" +
    "You may put several SEARCH/REPLACE blocks in one [[edit]]. The SEARCH text must match the current file exactly, so read the file first if you are not sure. " +
    "Use [[file:]] with the COMPLETE file for new files, short files, or when most of the file changes.";
  const FIND_HINT = "To search a big project use [[find: some text]] (it looks in file names AND inside files and shows the matching lines; [[find: src/ui/]] lists a folder). Use it instead of guessing which file holds something.";
  const SUMMARY_PREFIX = "SUMMARY OF THE EARLIER PART OF THIS CHAT (the old messages are no longer sent, but nothing was lost; this is your memory of them. Files on disk are the truth; re-read them with [[read:]] when you need exact contents):\n";
  const SUMMARY_PROMPT =
    "You are the memory of an AI assistant working with a user on a long project. Compress the conversation into notes the assistant will use INSTEAD of the original messages. " +
    "Keep: what the user wants (goals, requirements, rules and preferences they stated), decisions and why, the current state of the work, files created/changed/deleted (paths and what changed), " +
    "commands run and their important results, errors found and how they were fixed, anything unfinished or unresolved, and names/numbers/settings that matter. " +
    "Drop greetings, repetition and file contents (files are on disk). Write compact plain bullet points, under about 600 words. If PREVIOUS NOTES are given, merge them: keep everything still true and important and update what changed. Output only the notes.";

  /* ---------- Work bar (status, plan, pause / resume) ---------- */
  const workBar = document.createElement("div");
  workBar.id = "workBar"; workBar.hidden = true;
  workBar.innerHTML = '<span id="wbText"></span><span class="grow"></span><button type="button" id="wbPlan">📋 Plan</button><button type="button" id="wbResume" hidden>Resume</button><button type="button" id="wbPause" hidden>Pause</button>';
  const planPanel = document.createElement("div");
  planPanel.id = "planPanel"; planPanel.hidden = true;
  planPanel.innerHTML = '<textarea id="planText" rows="9" placeholder="The AI writes its plan here as it works. You can edit it too."></textarea><div class="pp-row"><span>The AI re-reads this plan every turn, so it never loses track of a long project. Use [ ] for to-do and [x] for done.</span><button type="button" id="planSave">Save</button><button type="button" id="planClear">Clear</button></div>';
  (function () { const comp = $("composer"); comp.parentNode.insertBefore(workBar, comp); comp.parentNode.insertBefore(planPanel, comp); })();

  const autoOn = (c) => !!(c && c.autoWork);
  const planOpen = (c) => !!(c && c.plan && /\[ \]/.test(c.plan));
  function planCounts(p) { return { done: (p.match(/\[[xX]\]/g) || []).length, open: (p.match(/\[ \]/g) || []).length }; }
  function apSay(text) { ap.status = text || ""; renderWorkBar(); }
  function renderWorkBar() {
    const c = currentChat();
    const on = c ? !!c.autoWork : nextChatAuto;
    const ab = $("autoBtn"); if (ab) { ab.classList.toggle("on", on); ab.setAttribute("aria-pressed", String(on)); }
    const tb = $("talkBtn"); if (tb) { const t = settings.proactive !== false; tb.classList.toggle("on", t); tb.setAttribute("aria-pressed", String(t)); tb.title = t ? "The AI may speak up when you're quiet (click to turn off)" : "The AI stays quiet until you write (click to let it speak up)"; }
    const mine = !!c && ap.chatId === c.id && !!ap.status;
    const hasPlan = !!(c && c.plan);
    let text = "";
    if (c && c.autoWork) text = mine ? ap.status : "Autopilot is on. Give it a job and it keeps going on its own.";
    else if (mine) text = ap.status;
    else if (hasPlan) { const k = planCounts(c.plan); text = "Plan: " + k.done + " done, " + k.open + " to do"; }
    workBar.hidden = !(text || hasPlan);
    $("wbText").textContent = text;
    $("wbPlan").hidden = !hasPlan && !(c && c.autoWork);
    const here = !!c && ap.chatId === c.id;
    $("wbPause").hidden = !(c && c.autoWork && here && ap.state === "working");
    $("wbResume").hidden = !(c && c.autoWork && here && (ap.state === "paused" || ap.state === "capped"));
    if (planPanel.hidden === false && !hasPlan && !(c && c.autoWork)) planPanel.hidden = true;
  }
  $("wbPlan").onclick = () => { const c = currentChat(); if (!c) return; planPanel.hidden = !planPanel.hidden; if (!planPanel.hidden) $("planText").value = c.plan || ""; };
  $("planSave").onclick = () => { const c = currentChat(); if (!c) return; c.plan = $("planText").value.trim(); saveChats(); planPanel.hidden = true; renderWorkBar(); };
  $("planClear").onclick = () => { const c = currentChat(); if (!c) return; c.plan = ""; $("planText").value = ""; saveChats(); renderWorkBar(); };
  $("wbPause").onclick = () => { if (streaming) stopGeneration(); apPause("Paused. Press Resume to carry on."); };
  $("wbResume").onclick = () => { const c = currentChat(); if (!c) return; ap.steps = 0; ap.lastSig = ""; apContinue(c, ""); };

  /* ---------- Autopilot ---------- */
  function apReset() { clearTimeout(ap.timer); ap.timer = null; ap.steps = 0; ap.lastSig = ""; ap.pendingMsg = null; ap.planAsked = false; }
  function noteUserSent() { apReset(); ap.state = "idle"; ap.status = ""; pa.unanswered = 0; pa.last = Date.now(); }
  function apPause(msg) {
    const c = currentChat(); clearTimeout(ap.timer); ap.timer = null;
    if (autoOn(c)) { ap.state = "paused"; ap.chatId = c.id; apSay(msg || "Paused. Press Resume to carry on."); }
  }
  function apOnChatSwitch() {
    clearTimeout(ap.timer); ap.timer = null;
    if (ap.state === "working") { ap.state = "paused"; ap.status = "Paused because you left this chat. Press Resume to carry on."; }
  }
  function sendInternal(text, flags) {
    if (streaming || interrupting || compacting || input.value.trim() || attachments.length) return false;
    internalSend = Object.assign({ text }, flags || {});
    send();
    return true;
  }
  function apContinue(chat, note, kind) {
    clearTimeout(ap.timer); ap.timer = null;
    if (!autoOn(chat)) return;
    if (ap.steps >= Math.max(1, +settings.apMaxSteps || 30)) { ap.state = "capped"; ap.chatId = chat.id; apSay("Paused after " + ap.steps + " steps so it never runs forever. Press Resume to keep going."); return; }
    ap.steps++; ap.state = "working"; ap.chatId = chat.id;
    apSay("Working… step " + ap.steps);
    let tries = 0;
    const fire = () => {
      ap.timer = null;
      if (!autoOn(chat) || ap.state !== "working") return;
      if (currentId !== chat.id) { ap.state = "paused"; apSay("Paused while you're in another chat. Come back and press Resume."); return; }
      if (streaming || compacting || input.value.trim() || attachments.length || interrupting) {
        if (++tries > 90) { ap.state = "paused"; apSay("Paused (you were busy). Press Resume to carry on."); return; }
        ap.timer = setTimeout(fire, 2000); return;
      }
      const text = kind === "plan" ? PLAN_NUDGE : (note ? note + " " : "") + AP_CONTINUE;
      if (!sendInternal(text, { auto: true })) ap.timer = setTimeout(fire, 2000);
    };
    ap.timer = setTimeout(fire, 1200);
  }
  function apAfterReply(chat, reply) {
    if (!autoOn(chat) || reply.proactive) return;
    clearTimeout(ap.timer); ap.timer = null; ap.chatId = chat.id;
    const text = reply.content || "";
    if (reply.failed || /^\((Stopped|The model returned an empty reply)/.test(text)) { ap.state = "paused"; apSay("Paused: the last reply had a problem. Press Resume to try again."); return; }
    const sig = text.length + ":" + text.replace(/\s+/g, " ").trim().slice(0, 300);
    if (sig === ap.lastSig) { ap.state = "paused"; apSay("Paused: the AI started repeating itself. Tell it what to do differently, or press Resume."); return; }
    ap.lastSig = sig;
    if (reply.ap === "done") { ap.state = "done"; apSay("✅ Finished."); return; }
    if (reply.ap === "waiting" || (!reply.ap && /\?\s*$/.test(text.trim()))) { ap.state = "waiting"; apSay("Waiting for your answer. Autopilot carries on after you reply."); return; }
    const hasFiles = !!(reply.files && reply.files.length) || !!(reply.deleted && reply.deleted.length);
    if (hasFiles && project && reply.project === project.root) {
      if (settings.autoApply) {
        ap.state = "working"; apSay("Applying file changes…");
        applyReplyChanges(reply).then((note) => { const c2 = currentChat(); if (c2 === chat) apContinue(chat, note); });
        return;
      }
      ap.pendingMsg = reply; ap.state = "waiting";
      apSay("Waiting for you to apply or reject the file changes above. Autopilot carries on after that.");
      return;
    }
    if ((reply.runs || []).some((r) => r.kind === "run" && (r.status === "pending" || r.status === "running"))) {
      ap.state = "waiting"; apSay("Waiting for you to approve the command above (Run or Skip).");
      return;
    }
    if (reply.ap === "continue" || planOpen(chat)) { apContinue(chat, ""); return; }
    if (!chat.plan && !ap.planAsked && (project || workZips.has(chat.id) || PLAN_WORDS.test(lastUserText(chat)))) {
      ap.planAsked = true; apContinue(chat, "", "plan"); return;
    }
    ap.state = "idle"; apSay(chat.plan ? "Nothing left on the plan." : "");
  }
  function lastUserText(chat) {
    for (let i = chat.messages.length - 1; i >= 0; i--) { const m = chat.messages[i]; if (m.role === "user" && !m.hidden) return String(m.display || (typeof m.content === "string" ? m.content : "")); }
    return "";
  }
  async function applyReplyChanges(m) {
    const items = (m.files || []).map((f) => ({ path: f.path, content: f.content, del: false })).concat((m.deleted || []).map((p) => ({ path: p, del: true })));
    for (const it of items) { if (!(m.status && m.status[it.path])) { try { await applyChange(m, it); } catch (e) { m.status = m.status || {}; m.status[it.path] = "failed: " + e.message; } } }
    saveChats(); await refreshProject();
    const w = [...msgs.querySelectorAll(".msg.assistant")].find((x) => x.__m === m); if (w) refreshReplyExtras(m, w);
    return statusNote(m, items.map((i) => i.path));
  }
  function statusNote(m, paths) {
    const pick = (re) => paths.filter((p) => re.test((m.status && m.status[p]) || "")).join(", ") || "none";
    return "Status of your file changes: applied: " + pick(/^applied$/) + "; rejected by the user: " + pick(/^rejected$/) + "; failed: " + pick(/^failed/) + ". (Old copies are in .oasis-backup.)";
  }
  function apDecisionCheck(m) {
    if (ap.pendingMsg !== m) return;
    const paths = (m.files || []).map((f) => f.path).concat(m.deleted || []);
    if (paths.some((p) => !(m.status && m.status[p]))) return;
    const chat = currentChat();
    if (!chat || !autoOn(chat) || chat.messages[chat.messages.length - 1] !== m) { ap.pendingMsg = null; return; }
    if ((m.runs || []).some((r) => r.kind === "run" && (r.status === "pending" || r.status === "running"))) return;
    ap.pendingMsg = null;
    apContinue(chat, statusNote(m, paths));
  }
  $("autoBtn").onclick = () => {
    const c = currentChat();
    if (c) {
      c.autoWork = !c.autoWork; saveChats();
      ap.chatId = c.id; ap.state = "idle"; ap.status = ""; clearTimeout(ap.timer); ap.timer = null;
      if (c.autoWork && planOpen(c) && !streaming) { ap.steps = 0; apContinue(c, "Autopilot was just turned on."); }
    } else nextChatAuto = !nextChatAuto;
    renderWorkBar();
  };
  $("talkBtn").onclick = () => { settings.proactive = settings.proactive === false; store.set("lmchat.settings", settings); pa.unanswered = 0; pa.last = Date.now(); renderWorkBar(); };

  /* ---------- Plan / control tags in replies ---------- */
  function extractControlTags(reply, chat) {
    let c = reply.content;
    const take = (m, body) => { body = String(body || "").replace(/^```[\w+-]*\n/, "").replace(/\n```\s*$/, "").trim(); if (body) chat.plan = body.slice(0, 8000); return "📋 _plan updated_"; };
    c = c.replace(/\[\[plan\]\]\n?([\s\S]*?)\n?\[\[\/plan\]\]/gi, take).replace(/\[\[plan\]\]\n?([\s\S]*)$/i, take);
    c = c.replace(/\[\[(continue|done|waiting)\]\]/gi, (m, t) => { reply.ap = t.toLowerCase(); return ""; });
    reply.content = c.replace(/\n{3,}/g, "\n\n").trim();
    if (!reply.content && reply.auto) reply.dropMe = true;
  }
  function cleanProactive(reply) {
    let t = String(reply.content || "").replace(/<(think|thinking|reasoning)>[\s\S]*?(?:<\/\1>|$)/gi, "");
    const silent = /\[\[silent\]\]/i.test(t);
    t = t.replace(/\[\[[\s\S]*?\]\]/g, "").replace(/\n{3,}/g, "\n\n").trim();
    reply.content = t;
    if (silent || !t || /^\((Stopped|The model returned)/.test(t)) reply.dropMe = true;
  }
  function dropReply(chat, reply) {
    const i = chat.messages.indexOf(reply); if (i < 0) return;
    const prev = chat.messages[i - 1], two = !!(prev && prev.hidden);
    chat.messages.splice(two ? i - 1 : i, two ? 2 : 1);
    if (reply.proactive) pa.unanswered = Math.max(0, pa.unanswered - 1);
    const w = [...msgs.querySelectorAll(".msg")].find((x) => x.__m === reply); if (w) w.remove();
    if (!chat.messages.length && /^💭/.test(chat.title)) { chats = chats.filter((c) => c !== chat); if (currentId === chat.id) { currentId = null; if (!streaming) renderChat(); } }
    setMode();
  }

  /* ---------- Edit blocks: change a few lines of a huge file ---------- */
  const EDIT_TAG_RE = /\[\[edit:\s*([^\]\n]+?)\s*\]\]\n?([\s\S]*?)\n?\[\[\/edit\]\]/gi;
  const EDIT_BLOCK_RE = /<{3,}[ \t]*SEARCH[^\n]*\n([\s\S]*?)\n?={3,}[ \t]*\n([\s\S]*?)\n?>{3,}[ \t]*REPLACE/g;
  const cleanRel = (p) => String(p).replace(/\\/g, "/").split("/").filter((x) => x && x !== "." && x !== "..").join("/");
  async function currentTextOf(chat, path) {
    if (project && !workZips.has(chat.id)) {
      const hit = project.files.find((f) => f.path === path) || project.files.find((f) => f.path.endsWith("/" + path));
      const p = hit ? hit.path : path;
      const r = await projApi().projectRead(p);
      if (!r || r.missing || r.error) return null;
      return { path: p, text: r.text };
    }
    await ensureZip(chat.id);
    const base = workZips.get(chat.id); if (!base) return null;
    const names = Object.keys(base.zip.files).filter((n) => !base.zip.files[n].dir);
    const key = names.find((n) => n === path) || names.find((n) => n.endsWith("/" + path)) || path;
    let edited = null; chat.messages.forEach((x) => (x.files || []).forEach((f) => { if (f.path === key) edited = f.content; }));
    if (edited !== null) return { path: key, text: edited };
    if (!base.zip.files[key]) return null;
    try { return { path: key, text: await base.zip.files[key].async("string") }; } catch (e) { return null; }
  }
  function applyEditBlocks(orig, blocks) {
    const crlf = orig.includes("\r\n"); let t = crlf ? orig.replace(/\r\n/g, "\n") : orig;
    for (let i = 0; i < blocks.length; i++) {
      const s = blocks[i].s.replace(/\r\n/g, "\n"), r = blocks[i].r.replace(/\r\n/g, "\n"), n = "block " + (i + 1);
      if (!s.trim()) return { error: n + " has an empty SEARCH part (use [[file:]] to create or replace a whole file)" };
      const count = t.split(s).length - 1;
      if (count === 1) { const idx = t.indexOf(s); t = t.slice(0, idx) + r + t.slice(idx + s.length); continue; }
      if (count > 1) return { error: n + " matches " + count + " places; include more surrounding lines so it is unique" };
      const tl = t.split("\n"), sl = s.replace(/^\n+|\n+$/g, "").split("\n").map((x) => x.trim()), found = [];
      for (let a = 0; a + sl.length <= tl.length; a++) { let ok = true; for (let b = 0; b < sl.length; b++) if (tl[a + b].trim() !== sl[b]) { ok = false; break; } if (ok) found.push(a); }
      if (found.length !== 1) return { error: n + (found.length > 1 ? " matches " + found.length + " places; include more surrounding lines" : ": the SEARCH text was not found (it must match the current file exactly; read the file again with [[read:]])") };
      tl.splice(found[0], sl.length, ...(r === "" ? [] : r.replace(/\n$/, "").split("\n")));
      t = tl.join("\n");
    }
    return { text: crlf ? t.replace(/\n/g, "\r\n") : t };
  }
  // Turns every [[edit:]] block into a normal [[file:]] block holding the full new text, so the
  // usual diff cards, Apply buttons and zip download work unchanged.
  async function extractEditTags(reply, chat) {
    if (!/\[\[edit:/i.test(reply.content)) return;
    const local = new Map(), jobs = [];
    reply.content.replace(EDIT_TAG_RE, (m, path, body) => { jobs.push({ m, path: cleanRel(path), body }); return m; });
    for (const j of jobs) {
      const blocks = []; j.body.replace(EDIT_BLOCK_RE, (x, s, r) => { blocks.push({ s, r }); return x; });
      let out;
      if (!j.path || !blocks.length) out = "⚠️ _edit not applied: no SEARCH/REPLACE block found_";
      else {
        let cur = null;
        const known = [...local.keys()].find((k) => k === j.path || k.endsWith("/" + j.path));
        if (known) cur = { path: known, text: local.get(known) }; else { try { cur = await currentTextOf(chat, j.path); } catch (e) { cur = null; } }
        if (!cur) out = "⚠️ _edit to " + j.path + " not applied: that file was not found. Use [[file:]] to create it._";
        else {
          const res = applyEditBlocks(cur.text, blocks);
          if (res.error) out = "⚠️ _edit to " + cur.path + " not applied: " + res.error + "_";
          else { local.set(cur.path, res.text); out = "[[file: " + cur.path + "]]\n" + res.text + "\n[[/file]]"; }
        }
      }
      reply.content = reply.content.replace(j.m, () => out);
    }
  }

  /* ---------- [[find: text]] : search names and contents of a big project ---------- */
  const FIND_TAG_RE = /\[\[find:\s*([^\]\n]+?)\s*\]\]/gi;
  const TEXTY_RE = /\.(js|mjs|cjs|jsx|ts|tsx|json|html?|css|scss|less|md|txt|py|java|kt|c|cc|cpp|h|hpp|cs|go|rs|rb|php|sh|bat|cmd|ps1|yml|yaml|toml|xml|sql|vue|svelte|ini|cfg|csv|lua|swift|dart|gd|r)$/i;
  function extractFindTags(reply, list) {
    reply.content = reply.content.replace(FIND_TAG_RE, (m, q) => { q = q.trim(); if (list.length < 4) list.push("?find:" + q); return "🔎 _searching for " + q + "…_"; });
  }
  async function runFind(chat, q) {
    const ql = q.toLowerCase(); let names, getText;
    if (project && !workZips.has(chat.id)) {
      names = project.files.map((f) => ({ path: f.path, size: f.size }));
      getText = async (p) => { const r = await projApi().projectRead(p); return r && typeof r.text === "string" ? r.text : null; };
    } else {
      await ensureZip(chat.id); const base = workZips.get(chat.id);
      if (!base) return "=== find: " + q + " ===\n(there is no project folder or zip to search)";
      names = Object.keys(base.zip.files).filter((n) => !base.zip.files[n].dir).map((n) => ({ path: n, size: zipEntrySize(base.zip.files[n]) }));
      getText = async (p) => { try { return await base.zip.files[p].async("string"); } catch (e) { return null; } };
    }
    const byName = names.filter((f) => f.path.toLowerCase().includes(ql));
    const cand = names.filter((f) => TEXTY_RE.test(f.path) && f.size < 600000).slice(0, 2000), hits = [];
    for (let i = 0; i < cand.length && hits.length < 60; i += 8) {
      const batch = cand.slice(i, i + 8), texts = await Promise.all(batch.map((f) => getText(f.path)));
      texts.forEach((t, k) => { if (!t) return; const lines = t.split(/\r?\n/); for (let n = 0; n < lines.length && hits.length < 60; n++) if (lines[n].toLowerCase().includes(ql)) hits.push(batch[k].path + ":" + (n + 1) + ": " + lines[n].trim().slice(0, 180)); });
    }
    const cap = Math.max(4000, Math.round((await lmContextChars()) / 4));
    let out = "=== find: " + q + " ===\nFile names containing it (" + byName.length + "):\n" + (byName.slice(0, 50).map((f) => f.path + " (" + f.size + " B)").join("\n") || "(none)") + (byName.length > 50 ? "\n…and " + (byName.length - 50) + " more" : "") +
      "\n\nLines containing it (" + (hits.length >= 60 ? "first 60" : hits.length) + "):\n" + (hits.join("\n") || "(none)");
    return out.length > cap ? out.slice(0, cap) + "\n…[cut]" : out;
  }
  async function readFilesText(chat, paths) {
    const finds = paths.filter((p) => p.startsWith("?find:")), rest = paths.filter((p) => !p.startsWith("?find:"));
    let res = rest.length ? await readFilesTextBase(chat, rest) : { text: "", images: [] };
    if (typeof res === "string") res = { text: res, images: [] };
    if (finds.length) { const out = []; for (const f of finds) { try { out.push(await runFind(chat, f.slice(6))); } catch (e) { out.push("=== find: " + f.slice(6) + " ===\n(search failed: " + e.message + ")"); } } res = { text: out.join("\n\n") + (res.text ? "\n\n" + res.text : ""), images: res.images || [] }; }
    return res;
  }

  /* ---------- Long chats: summarize old messages, lose nothing ---------- */
  async function ctxBudget() {
    const m = await lmModelInfo();
    return (m && (m.loaded_context_length || m.max_context_length)) ? await lmContextChars() : 40000;
  }
  function slimFiles(m) {
    let c = typeof m.content === "string" ? m.content : "";
    (m.files || []).forEach((f) => {
      const ext = (f.path.split(".").pop() || "").toLowerCase();
      const blk = "**📄 " + f.path + "**\n```" + ext + "\n" + f.content + "\n```";
      c = c.split(blk).join("📄 " + f.path + " (" + f.content.length + " chars; the contents are left out to save space, use [[read: " + f.path + "]] to see the current file)");
    });
    return c;
  }
  function payloadContent(m, i, lastIdx) {
    if (m.fileRead && i < lastIdx) return "(File contents sent earlier were left out to save space. Use [[read: path]] to see them again.)";
    if (m.runOutput && i < lastIdx) return "(The output of an earlier command was left out to save space. Propose the command again if you need to see it.)";
    if (m.shownOnce && i < lastIdx && Array.isArray(m.content)) return m.content.filter((c) => c && c.type === "text").map((c) => c.text).join("\n") + "\n\n(The images from the zip were shown earlier and left out to save space. Use [[read: path]] to see one again.)";
    if (m.role === "assistant" && m.files && m.files.length && i < lastIdx - 1) return slimFiles(m);
    return m.content;
  }
  function contentChars(c) {
    if (Array.isArray(c)) return c.reduce((n, p) => n + (p && p.type === "text" ? (p.text || "").length : 1500), 0);
    return String(c || "").length;
  }
  function transcriptOf(list) {
    const cut = (t, n) => t.length <= n ? t : t.slice(0, Math.round(n * 0.65)) + " …[cut]… " + t.slice(-Math.round(n * 0.3));
    return list.map((m) => {
      if (m.role === "user") {
        if (m.hidden) return m.proactive ? "" : "(the app asked the AI to continue its plan)";
        const t = typeof m.content === "string" ? m.content : (m.display || "");
        return "USER: " + cut(t.replace(/\s+/g, " "), 1200);
      }
      let t = slimFiles(m).replace(/\[\[[^\]\n]*\]\]/g, "").replace(/\s+/g, " ").trim();
      const runs = (m.runs || []).filter((r) => r.kind === "run").map((r) => " [ran: " + r.cmd.slice(0, 120) + " -> " + (r.status === "done" ? "exit " + r.exitCode + (r.exitCode ? ", " + String(r.output || "").trim().slice(-200).replace(/\s+/g, " ") : "") : r.status) + "]").join("");
      const files = (m.files || []).map((f) => f.path).concat((m.deleted || []).map((p) => "deleted " + p));
      const st = m.status ? Object.keys(m.status).map((p) => p + "=" + m.status[p]).join(", ") : "";
      return "AI: " + cut(t, 1500) + (files.length ? " [files: " + files.join(", ") + (st ? " | " + st : "") + "]" : "") + runs;
    }).filter(Boolean).join("\n");
  }
  async function summarizeStep(prev, text) {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 240000);
    try {
      const body = { messages: [{ role: "system", content: SUMMARY_PROMPT }, { role: "user", content: (prev ? "PREVIOUS NOTES:\n" + prev + "\n\n" : "") + "NEW MESSAGES TO FOLD IN:\n" + text + "\n\nWrite the updated notes now." }], temperature: 0.2, stream: false, max_tokens: 1600 };
      if (settings.model) body.model = settings.model;
      const r = await fetch(baseUrl() + "/chat/completions", { method: "POST", headers: headers(), body: JSON.stringify(body), signal: ctl.signal });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      let t = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || "";
      t = t.replace(/<(think|thinking|reasoning)>[\s\S]*?(?:<\/\1>|$)/gi, "").trim();
      if (!t) throw new Error("empty summary");
      return t;
    } finally { clearTimeout(timer); }
  }
  function mechanicalSummary(prev, text) {
    const lines = text.split("\n").map((l) => l.slice(0, 220));
    return ((prev ? prev + "\n" : "") + lines.join("\n")).slice(-7000);
  }
  async function makeRoom(chat, opts) {
    opts = opts || {};
    if (settings.compact === false || compacting) return;
    const list = chat.messages; if (list.length < 6) return;
    const budget = await ctxBudget();
    const from = (chat.summary && chat.summary.upto) || 0;
    const lastIdx = list.length;
    const sizes = list.map((m, i) => i < from ? 0 : contentChars(payloadContent(m, i, lastIdx)));
    const total = sizes.reduce((a, b) => a + b, 0) + (chat.summary ? chat.summary.text.length : 0);
    const limit = budget * (opts.force ? 0.2 : 0.45);
    if (total <= limit) return;
    const keepTarget = budget * (opts.force ? 0.1 : 0.22);
    let acc = 0, cut = list.length;
    for (let i = list.length - 1; i > from; i--) { acc += sizes[i]; if (acc > keepTarget) break; cut = i; }
    const cutMax = list.length - 2;
    cut = Math.min(cut, cutMax);
    while (cut < cutMax && list[cut].role !== "user") cut++;
    while (cut > from && (!list[cut] || list[cut].role !== "user")) cut--;
    if (cut <= from) return;
    compacting = true; const oldStatus = ap.status;
    const bar = $("wbText"); workBar.hidden = false; if (bar) bar.textContent = "Summarizing older messages so this chat can keep going…";
    try {
      const old = list.slice(from, cut), tr = transcriptOf(old), chunkMax = Math.max(6000, Math.round(budget * 0.3));
      const chunks = []; let curChunk = "";
      tr.split("\n").forEach((line) => { if (curChunk.length + line.length > chunkMax && curChunk) { chunks.push(curChunk); curChunk = ""; } curChunk += (curChunk ? "\n" : "") + line.slice(0, chunkMax); });
      if (curChunk) chunks.push(curChunk);
      let notes = chat.summary ? chat.summary.text : "";
      for (const ch of chunks) { try { notes = await summarizeStep(notes, ch); } catch (e) { notes = mechanicalSummary(notes, ch); } }
      chat.summary = { text: notes.slice(0, 12000), upto: cut, at: Date.now() };
      saveChats();
      if (currentId === chat.id && !streaming) renderChat();
    } finally { compacting = false; ap.status = oldStatus; renderWorkBar(); }
  }

  /* ---------- Speaking up on its own ---------- */
  function noteActivity() { pa.last = Date.now(); }
  ["keydown", "pointerdown", "wheel", "touchstart"].forEach((ev) => document.addEventListener(ev, noteActivity, true));
  let lastMove = 0;
  document.addEventListener("mousemove", () => { const n = Date.now(); if (n - lastMove > 4000) { lastMove = n; pa.last = n; } }, true);
  function proactivePrompt(chat, away, fresh) {
    return "[Automatic note from the app, not written by the user.] The user has been quiet for about " + away + " minute" + (away === 1 ? "" : "s") + " (busy or away). You may speak up first, like a friendly collaborator sitting next to them. " +
      "Pick ONE: ask a genuine question about what they are working on, their plans or something they said earlier; comment on something in this chat or project; offer a useful idea or the next step you would suggest; or follow up on something left unfinished. " +
      (fresh ? "There is no active conversation yet: greet them warmly and ask what they would like to do, or about their projects (you can see your memory notes and a list of their recent chats). " : "") +
      "Rules: 1-3 short sentences, natural and warm, in your usual personality. Do not repeat anything you already said unprompted in this chat. Do not propose file changes, commands, apps or images and do not use any [[tags]]. Do not mention this note, timers or being idle. " +
      (pa.unanswered ? "You already spoke up " + pa.unanswered + " time(s) without an answer, so keep it very light or stay silent. " : "") +
      "If you truly have nothing worth saying, reply with exactly [[silent]].";
  }
  function proactiveTick() {
    if (settings.proactive === false || !chatsReady) return;
    if (connState !== "ok") { if (Date.now() - pa.lastCheck > 120000) { pa.lastCheck = Date.now(); checkConnection(true); } return; }   // server was down: look again now and then
    if (streaming || interrupting || compacting || ap.timer) return;
    if (input.value.trim() || attachments.length || document.querySelector("dialog[open]")) return;
    if (($("liveBtn") && $("liveBtn").getAttribute("aria-pressed") === "true") || ($("micBtn") && $("micBtn").getAttribute("aria-pressed") === "true")) return;
    const maxRow = Math.max(1, +settings.proactiveMax || 2);
    if (pa.unanswered >= maxRow) return;
    const mins = Math.max(1, +settings.proactiveMins || 5);
    const wait = mins * 60000 * (1 + pa.unanswered * 0.8) * pa.jit;
    if (Date.now() - Math.max(pa.last, pa.lastSpoke) < wait) return;
    fireProactive();
  }
  function fireProactive() {
    let chat = currentChat(), fresh = false;
    if (!chat) {
      const recent = chats.slice().sort((a, b) => b.updated - a.updated)[0];
      if (recent && Date.now() - recent.updated < 3 * 86400000) { openChat(recent.id); chat = recent; }
      else { chat = { id: "c" + Date.now(), title: "💭 Check-in", messages: [], updated: Date.now(), autoWork: nextChatAuto }; chats.unshift(chat); currentId = chat.id; fresh = true; renderChat(); }
    }
    const away = Math.max(1, Math.round((Date.now() - pa.last) / 60000));
    pa.lastSpoke = Date.now(); pa.jit = 0.85 + Math.random() * 0.35;
    if (sendInternal(proactivePrompt(chat, away, fresh), { proactive: true })) pa.unanswered++;
    else if (fresh && !chat.messages.length) { chats = chats.filter((c) => c !== chat); currentId = null; renderChat(); }
  }
  function notifyProactive(reply) {
    pa.lastSpoke = Date.now();
    if (document.visibilityState === "visible" && document.hasFocus()) return;
    try { const n = new Notification("Oasis", { body: String(reply.content || "").replace(/[*_`#]/g, "").slice(0, 140) }); n.onclick = () => { try { window.focus(); } catch (e) {} }; } catch (e) {}
  }
  function afterReply(chat, reply) {
    if (reply.proactive) { notifyProactive(reply); return; }
    apAfterReply(chat, reply);
  }
  setInterval(proactiveTick, 20000);
  function initAuto() { renderWorkBar(); }

  /* ---------- Daily fact ---------- */
  const fact = FACTS[Math.floor(Date.now() / 86400000) % FACTS.length];
  $("factText").textContent = fact;
  $("factMore").onclick = () => { input.value = "Tell me more about this fact: " + fact; autosize(); send(); };

  /* ---------- Init ---------- */
  updateHeader(); checkConnection(); input.focus();
  initStorage().then(() => { renderChat(); initProject(); initAuto(); });
})();
