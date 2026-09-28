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

  const defaults = { name: "Guest", baseUrl: "http://localhost:1234/v1", apiKey: "", system: "", temperature: 0.7, model: "", imageGen: true, realImages: true, webSearch: true, memoryEnabled: true, memory: "", pexelsKey: "", pixabayKey: "", tmdbKey: "", youtubeKey: "", nasaKey: "" };
  let settings = Object.assign({}, defaults, store.get("lmchat.settings", {}));
  // The starting name is now "Guest". If this browser still has the old starting name saved, switch it once.
  if (!store.get("lmchat.guestDefault", false)) {
    if (settings.name === "Robby") { settings.name = "Guest"; store.set("lmchat.settings", settings); }
    store.set("lmchat.guestDefault", true);
  }
  let chats = store.get("lmchat.chats", []);
  let currentId = null;
  let attachments = [];
  let streaming = false;
  let abortCtl = null;

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
  function saveChats() { store.set("lmchat.chats", chats.slice(0, 60)); }
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
        .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>")
        .replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, (m, alt, url) => stash('<img class="chat-gen-image" src="' + url + '" alt="' + alt + '" title="Click to open image">'))
        // file:// links let the AI link to a locally installed app (like
        // Mystic Realm) as well as ordinary http(s) links.
        .replace(/\[([^\]]+)\]\(((?:https?|file):\/\/[^)\s]+)\)/g, (m, label, url) => stash('<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + label + '</a>'))
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
  const APP_TAG_RE = /\[\[app:\s*([^\]]+?)\]\]/gi;

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
    "maze": { path: "apps/maze-madness/index.html", label: "Maze Madness", emoji: "🌀" }
  };

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
    app: "🔮 Opening the app…"
  };
  const STREAM_TAG_NAMES = Object.keys(STREAM_TAG_LABELS);
  const STREAM_CLOSED_TAG_RE = new RegExp("\\[\\[(" + STREAM_TAG_NAMES.join("|") + "):\\s*[^\\]]*?\\]\\]", "gi");
  function maskStreamingTags(text) {
    if (!text) return text;
    let out = text.replace(STREAM_CLOSED_TAG_RE, (m, tag) => STREAM_TAG_LABELS[tag.toLowerCase()] || "");
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
    "they meant.\n\n" +
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
    "maze game.";

  const MEMORY_SYSTEM_PROMPT =
    "You have a persistent memory that carries over between separate conversations with this user. " +
    "Whenever the user shares something worth remembering long-term (their name, preferences, ongoing " +
    "projects, important facts about their life), save it by putting a tag on its own line: " +
    "[[remember: the short fact to remember]] — one tag per fact, written in third person, e.g. " +
    "[[remember: User's name is Alex]]. Only save durable facts, not one-off chat details. The tag is " +
    "stripped out before the user sees your reply, so it never appears to them.";

  function pollinationsImageUrl(prompt) {
    const seed = Math.floor(Math.random() * 1e9);
    return "https://image.pollinations.ai/prompt/" + encodeURIComponent(prompt.trim()) +
      "?width=1024&height=1024&nologo=true&seed=" + seed;
  }

  // Pollinations anonymous accounts allow only one generation in the queue at
  // a time. Keep all image-generation requests in a single browser-side queue
  // so asking for several images never creates simultaneous requests.
  let pollinationsQueue = Promise.resolve();
  function generatePollinationsImage(prompt) {
    const job = pollinationsQueue.then(async () => {
      const url = pollinationsImageUrl(prompt);
      let lastError = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const r = await fetch(url, { cache: "force-cache" });
          if (r.ok) {
            // Read the response completely before releasing the queue slot.
            // This is what prevents the next image from hitting the anonymous
            // Pollinations max-1 queue while this image is still generating.
            await r.blob();
            return url;
          }
          if (r.status === 429) {
            const wait = Math.min(12000, 1200 * Math.pow(2, attempt));
            await new Promise(resolve => setTimeout(resolve, wait));
            lastError = new Error("Pollinations queue is busy");
            continue;
          }
          lastError = new Error("Pollinations returned HTTP " + r.status);
          break;
        } catch (e) {
          lastError = e;
          await new Promise(resolve => setTimeout(resolve, Math.min(8000, 800 * Math.pow(2, attempt))));
        }
      }
      throw lastError || new Error("Pollinations image generation failed");
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

  async function findRealPhotoUrl(query) {
    const q = query.trim();
    if (!q) return null;

    // Keyless TV-show artwork, especially useful for named series.
    try {
      const r = await fetch("https://api.tvmaze.com/search/shows?q=" + encodeURIComponent(q));
      if (r.ok) {
        const j = await r.json();
        const hit = (j || []).map(x => x && x.show).find(x => x && x.image && (x.image.original || x.image.medium));
        if (hit) return { url: hit.image.original || hit.image.medium, source: hit.url || "https://www.tvmaze.com/", credit: "Image: TVMaze — " + (hit.name || q) };
      }
    } catch (e) {}

    // TMDB is especially useful for movies, TV shows, actors and characters.
    // It is optional because it requires a free developer key and is intended
    // for non-commercial use with attribution.
    if (settings.tmdbKey) {
      try {
        const r = await fetch("https://api.themoviedb.org/3/search/multi?query=" +
          encodeURIComponent(q) + "&include_adult=false&page=1&language=en-US",
          { headers: { Authorization: "Bearer " + settings.tmdbKey, accept: "application/json" } });
        if (r.ok) {
          const j = await r.json();
          const hit = (j.results || []).find((x) =>
            x && (x.media_type === "tv" || x.media_type === "movie" || x.media_type === "person") &&
            (x.poster_path || x.backdrop_path || x.profile_path)
          );
          if (hit) {
            const path = hit.poster_path || hit.backdrop_path || hit.profile_path;
            return {
              url: "https://image.tmdb.org/t/p/w780" + path,
              source: "https://www.themoviedb.org/" + hit.media_type + "/" + hit.id,
              credit: "Image/data from TMDB: " + (hit.name || hit.title || q)
            };
          }
        }
      } catch (e) {}
    }

    // Openverse is keyless and aggregates openly licensed / public-domain media.
    try {
      const r = await fetch("https://api.openverse.org/v1/images/?page_size=8&q=" + encodeURIComponent(q));
      if (r.ok) {
        const j = await r.json();
        const results = Array.isArray(j.results) ? j.results : [];
        const hit = results.find((x) => x && (x.url || x.thumbnail) && !isUnreliableImageHost(x.url || x.thumbnail));
        if (hit) return {
          url: hit.url || hit.thumbnail,
          source: hit.foreign_landing_url || hit.url,
          credit: (hit.title ? hit.title + " — " : "") + "Openverse"
        };
      }
    } catch (e) {}

    // Wikimedia Commons is also keyless and excellent for named subjects.
    try {
      const r = await fetch("https://commons.wikimedia.org/w/api.php?origin=*&format=json&action=query" +
        "&generator=search&gsrnamespace=6&gsrlimit=6&gsrsearch=" + encodeURIComponent(q) +
        "&prop=imageinfo&iiprop=url|extmetadata");
      if (r.ok) {
        const j = await r.json();
        const pages = j && j.query && j.query.pages;
        const hit = pages && Object.values(pages).find((p) => p.imageinfo && p.imageinfo[0] && p.imageinfo[0].url && !isUnreliableImageHost(p.imageinfo[0].url));
        if (hit) {
          const info = hit.imageinfo[0], meta = info.extmetadata || {};
          const author = meta.Artist && meta.Artist.value ? meta.Artist.value.replace(/<[^>]+>/g, "") : "";
          return {
            url: info.url,
            source: "https://commons.wikimedia.org/wiki/Special:MediaSearch?search=" + encodeURIComponent(q),
            credit: "Wikimedia Commons" + (author ? " — " + author : "")
          };
        }
      }
    } catch (e) {}

    // Optional Pexels key. Free API, with attribution requirements.
    if (settings.pexelsKey) {
      try {
        const r = await fetch("https://api.pexels.com/v1/search?query=" + encodeURIComponent(q) + "&per_page=6",
          { headers: { Authorization: settings.pexelsKey } });
        if (r.ok) {
          const j = await r.json();
          const hit = (j.photos || []).find((x) => x && x.src && (x.src.large2x || x.src.large || x.src.medium) && !isUnreliableImageHost(x.src.large2x || x.src.large || x.src.medium));
          if (hit) return {
            url: hit.src.large2x || hit.src.large || hit.src.medium,
            source: hit.url,
            credit: "Photo by " + (hit.photographer || "Pexels") + " on Pexels"
          };
        }
      } catch (e) {}
    }

    // Optional Pixabay key. Returned URLs are suitable for temporary display;
    // Pixabay's terms require caching/downloading for permanent reuse.
    if (settings.pixabayKey) {
      try {
        const r = await fetch("https://pixabay.com/api/?key=" + encodeURIComponent(settings.pixabayKey) +
          "&q=" + encodeURIComponent(q) + "&image_type=photo&per_page=6&safesearch=true");
        if (r.ok) {
          const j = await r.json();
          const hit = (j.hits || []).find((x) => x && (x.largeImageURL || x.webformatURL) && !isUnreliableImageHost(x.largeImageURL || x.webformatURL));
          if (hit) return {
            url: hit.webformatURL || hit.largeImageURL,
            source: hit.pageURL || "https://pixabay.com/",
            credit: "Image from Pixabay"
          };
        }
      } catch (e) {}
    }

    return null;
  }

  async function apiJson(url, options={}) { try { const r = await fetch(url, options); if (!r.ok) return null; return await r.json(); } catch (e) { return null; } }

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
    const m = query.match(/([0-9.]+)\\s*([A-Za-z]{3})\\s*(?:to|in|into|->)\\s*([A-Za-z]{3})/i);
    if (!m) return null;
    const amount=Number(m[1]), from=m[2].toUpperCase(), to=m[3].toUpperCase();
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
  async function processReplyTags(reply, userText) {
    if (!reply.content) return;
    if (settings.imageGen) {
      const imageMatches = [...reply.content.matchAll(IMAGE_TAG_RE)];
      // IMPORTANT: process generated images sequentially. Pollinations'
      // anonymous tier has a max queue size of one.
      for (const m of imageMatches) {
        const prompt = m[1].trim();
        let url = null;
        try {
          url = await generatePollinationsImage(prompt);
        } catch (e) {}
        if (url) {
          reply.content = reply.content.replace(m[0], "![" + prompt + "](" + url + ")");
        } else {
          reply.content = reply.content.replace(m[0], '_(image generation is temporarily busy; please try again in a moment)_');
        }
      }
    }
    if (settings.realImages) {
      const matches = [...reply.content.matchAll(PHOTO_TAG_RE)];
      for (const m of matches) {
        const query = m[1].trim();
        let found = null;
        try { found = await findRealPhotoUrl(query); } catch (e) {}
        let url = found && found.url;
        if (!url && settings.imageGen) {
          try { url = await generatePollinationsImage(query); } catch (e) { url = null; }
        }
        if (url) {
          const credit = found && found.credit ? "\n\n_" + found.credit + (found.source ? " — [source](" + found.source + ")" : "") + "_" : "";
          reply.content = reply.content.replace(m[0], "![" + query + "](" + url + ")" + credit);
        } else {
          reply.content = reply.content.replace(m[0], '_(couldn\'t find a photo of "' + query + '")_');
        }
      }
    }
    reply.content = reply.content.replace(VIDEO_TAG_RE, (m, q) => "[[__video_pending__:" + q.trim().replace(/\]/g, "") + "]]" );
    for (const m of [...reply.content.matchAll(/\[\[__video_pending__:\s*([^\]]+?)\]\]/gi)]) {
      const q=m[1].trim(); const hit=await findYouTube(q);
      const html=hit ? "🎬 ["+hit.title+"]("+hit.url+") — "+hit.channel : "_(YouTube search unavailable. Add a YouTube API key in Settings.)_";
      reply.content=reply.content.replace(m[0],html);
    }
    for (const m of [...reply.content.matchAll(WIKI_TAG_RE)]) {
      const q=m[1].trim(), hit=await findWikipedia(q);
      const html=hit ? (hit.image ? "!["+hit.title+"]("+hit.image+")\n\n" : "") + "**"+hit.title+"**\n\n" + hit.extract + "\n\n[Wikipedia source]("+hit.url+")" : "_(Wikipedia lookup failed.)_";
      reply.content=reply.content.replace(m[0],html);
    }
    for (const m of [...reply.content.matchAll(NASA_TAG_RE)]) {
      const q=m[1].trim(), hit=await findNASA(q);
      const html=hit ? (hit.image ? "!["+hit.title+"]("+hit.image+")\n\n" : "") + "**NASA: "+hit.title+"**\n\n" + (hit.description||"") + "\n\n[NASA source]("+hit.url+")" : "_(NASA lookup failed.)_";
      reply.content=reply.content.replace(m[0],html);
    }
    for (const m of [...reply.content.matchAll(ANIME_TAG_RE)]) {
      const q=m[1].trim(), hit=await findAnime(q);
      const html=hit ? (hit.image ? "!["+hit.title+"]("+hit.image+")\n\n" : "") + "**"+hit.title+"**\n\n"+(hit.synopsis||"")+"\n\n[Jikan/MAL source]("+hit.url+")" : "_(Anime lookup failed.)_";
      reply.content=reply.content.replace(m[0],html);
    }
    for (const m of [...reply.content.matchAll(WEATHER_TAG_RE)]) {
      const q=m[1].trim(), hit=await findWeather(q);
      const html=hit ? "🌤️ **"+hit.location+"**: "+hit.temp+"°F, feels like "+hit.feels+"°F, humidity "+hit.humidity+"%, wind "+hit.wind+" mph." : "_(Weather lookup failed.)_";
      reply.content=reply.content.replace(m[0],html);
    }
    for (const m of [...reply.content.matchAll(COUNTRY_TAG_RE)]) {
      const q=m[1].trim(), hit=await findCountry(q);
      const currency=hit && hit.currencies ? Object.keys(hit.currencies).join(", ") : "";
      const langs=hit && hit.languages ? Object.values(hit.languages).join(", ") : "";
      const html=hit ? (hit.flags && hit.flags.png ? "![Flag of "+(hit.name?.common||q)+"]("+hit.flags.png+")\n\n" : "") + "**"+(hit.name?.common||q)+"**\n\nCapital: "+((hit.capital||[]).join(", ")||"N/A")+" · Region: "+(hit.region||"N/A")+" · Population: "+(hit.population||"N/A").toLocaleString()+" · Currency: "+currency+" · Languages: "+langs : "_(Country lookup failed.)_";
      reply.content=reply.content.replace(m[0],html);
    }
    for (const m of [...reply.content.matchAll(CURRENCY_TAG_RE)]) {
      const q=m[1].trim(), hit=await findCurrency(q);
      const html=hit ? "💱 **"+hit.amount+" "+hit.from+" = "+hit.result.toFixed(2)+" "+hit.to+"** (rate date: "+hit.date+")" : "_(Currency lookup failed. Use a format such as `100 USD to EUR`.)_";
      reply.content=reply.content.replace(m[0],html);
    }
    for (const m of [...reply.content.matchAll(PLACE_TAG_RE)]) {
      const q=m[1].trim(), hit=await findPlace(q);
      const html=hit ? "📍 **"+hit.name+"**\n\n[Open in OpenStreetMap](https://www.openstreetmap.org/?mlat="+encodeURIComponent(hit.lat)+"&mlon="+encodeURIComponent(hit.lon)+"#map=15/"+encodeURIComponent(hit.lat)+"/"+encodeURIComponent(hit.lon)+")" : "_(Place lookup failed.)_";
      reply.content=reply.content.replace(m[0],html);
    }
    if (settings.webSearch) {
      // Default to opening the results as a new tab (a "pop up"). If the
      // user's own message asked for a link instead, just show the link
      // and leave opening it up to them.
      const justLink = /\blinks?\b/i.test(userText || "");
      reply.content = reply.content.replace(SEARCH_TAG_RE, (m, q) => {
        const query = q.trim();
        const url = "https://duckduckgo.com/?q=" + encodeURIComponent(query);
        if (justLink) return "🔍 [Search: " + query + "](" + url + ")";
        try { window.open(url, "_blank", "noopener"); } catch (e) {}
        return "🔍 [Search: " + query + " — opened in a new tab](" + url + ")";
      });
    }
    reply.content = reply.content.replace(APP_TAG_RE, (m, id) => {
      const app = INSTALLED_APPS[id.trim().toLowerCase()];
      if (!app) return "";
      const url = new URL(app.path, location.href).href;
      try { window.open(url, "_blank", "noopener"); } catch (e) {}
      return app.emoji + " [" + app.label + " — opened in a new tab](" + url + ")";
    });
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

  // Lightweight local "recall" of past chats: scores every other saved chat
  // by keyword overlap with the user's new message and returns a short
  // excerpt from the best match, so the model can be reminded of relevant
  // earlier conversations without re-sending the whole history every time.
  const STOPWORDS = new Set(["the","a","an","and","or","but","is","are","was","were","be","to","of","in","on","for","with","that","this","it","i","you","me","my","your","what","do","does","did","can","could","would","about","have","has","had","so","just","like","how","when"]);
  function tokenize(s) { return (s || "").toLowerCase().match(/[a-z0-9']{3,}/g) || []; }
  function findRelevantPastExcerpt(queryText, excludeId) {
    const qTokens = tokenize(queryText).filter((t) => !STOPWORDS.has(t));
    if (!qTokens.length) return null;
    let best = null, bestScore = 0;
    chats.forEach((c) => {
      if (c.id === excludeId || !c.messages.length) return;
      const text = c.messages.map((m) => (typeof m.content === "string" ? m.content : (m.display || ""))).join(" ").toLowerCase();
      let score = 0;
      qTokens.forEach((t) => { if (text.includes(t)) score++; });
      if (score > bestScore) { bestScore = score; best = c; }
    });
    if (!best || bestScore < 2) return null;
    const excerpt = best.messages.slice(-6).map((m) => {
      const t = typeof m.content === "string" ? m.content : (m.display || "[image/attachment]");
      return (m.role === "user" ? "User: " : "You: ") + String(t).slice(0, 400);
    }).join("\n");
    return 'From an earlier conversation titled "' + best.title + '":\n' + excerpt.slice(0, 1500);
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
    const wrap = document.createElement("div");
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
    }
    msgs.appendChild(wrap);
    if (!opts || !opts.quiet) msgs.scrollTop = msgs.scrollHeight;
    return body;
  }
  msgs.addEventListener("click", (e) => {
    if (e.target && e.target.classList && e.target.classList.contains("chat-gen-image")) window.open(e.target.src, "_blank");
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
    if (c) c.messages.forEach((m) => addMessageEl(m, { quiet: true }));
    setMode();
    msgs.scrollTop = msgs.scrollHeight;
    renderHistory(); renderRecent();
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
        chats = chats.filter((z) => z.id !== c.id); saveChats();
        if (currentId === c.id) currentId = null;
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

  function openChat(id) { if (streaming) return; currentId = id; renderChat(); input.focus(); }
  function newChat() { if (streaming) return; currentId = null; renderChat(); input.focus(); }
  $("newChat").onclick = newChat;
  $("showHistory").onclick = () => $("history").classList.toggle("open");
  $("closeHistory").onclick = () => $("history").classList.remove("open");

  /* ---------- Connection ---------- */
  function setStatus(state, text) {
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
    updateHeader(); checkConnection();
  });

  /* ---------- Composer ---------- */
  function autosize() { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 200) + "px"; }
  input.addEventListener("input", autosize);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (!streaming) send(); }
  });
  sendBtn.onclick = () => { streaming ? abortCtl && abortCtl.abort() : send(); };

  function setStreaming(on) {
    streaming = on;
    sendBtn.classList.toggle("stop", on);
    sendBtn.title = on ? "Stop" : "Send";
    sendBtn.innerHTML = on
      ? '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2.5"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M12 19V6M6 11.5l6-6 6 6"/></svg>';
  }

  $("attachBtn").onclick = () => $("fileInput").click();
  $("fileInput").onchange = async (e) => {
    for (const f of e.target.files) {
      const isImage = f.type.startsWith("image/");
      const maxSize = isImage ? 10 * 1024 * 1024 : 200 * 1024;
      if (f.size > maxSize) {
        alert(isImage
          ? f.name + " is larger than 10 MB. Choose a smaller image."
          : f.name + " is larger than 200 KB. Attach a smaller text file.");
        continue;
      }
      try {
        if (isImage) {
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(f);
          });
          attachments.push({ name: f.name, type: f.type, kind: "image", dataUrl });
        } else {
          attachments.push({ name: f.name, type: f.type, kind: "text", text: await f.text() });
        }
      } catch (err) {}
    }
    e.target.value = ""; renderAttachments();
  };
  function renderAttachments() {
    const box = $("attached"); box.innerHTML = "";
    attachments.forEach((a, i) => {
      const c = document.createElement("span"); c.className = "file-chip";
      c.append(a.kind === "image" ? "🖼️ " + a.name : a.name);
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
    const text = input.value.trim();
    if (!text && !attachments.length) return;

    let chat = currentChat();
    if (!chat) {
      chat = { id: "c" + Date.now(), title: (text || attachments[0].name).slice(0, 48), messages: [], updated: Date.now() };
      chats.unshift(chat); currentId = chat.id;
    }

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
    chat.messages.push({ role: "user", content, display });
    input.value = ""; autosize(); attachments = []; renderAttachments();

    const reply = { role: "assistant", content: "" };
    const who = window.lmchatActiveCharacter && window.lmchatActiveCharacter();   // set by personas.js
    if (who) reply.persona = who;
    chat.messages.push(reply);
    chat.updated = Date.now();
    setMode();
    const lastUser = chat.messages[chat.messages.length - 2];
    addMessageEl(lastUser);
    const body = addMessageEl(reply);
    $("history").classList.remove("open");

    const payload = chat.messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));

    // If a webcam/screen feed is active, give the vision model the current
    // frame automatically with this turn. The frame is NOT saved in chat
    // history, so localStorage does not fill up with video frames.
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
      const excerpt = findRelevantPastExcerpt(text, chat.id);
      if (excerpt) payload.unshift({ role: "system", content: "Here is possibly-relevant context recalled from a past conversation with this user. Use it only if it's actually relevant; otherwise ignore it.\n\n" + excerpt });
      if (settings.memory) payload.unshift({ role: "system", content: "Long-term memory notes about this user (saved from earlier chats):\n" + settings.memory });
      payload.unshift({ role: "system", content: MEMORY_SYSTEM_PROMPT });
    }
    if (settings.webSearch) payload.unshift({ role: "system", content: SEARCH_SYSTEM_PROMPT });
    payload.unshift({ role: "system", content: APPS_SYSTEM_PROMPT });
    payload.unshift({ role: "system", content: TOOL_API_SYSTEM_PROMPT });
    if (settings.realImages) payload.unshift({ role: "system", content: REAL_IMAGE_SYSTEM_PROMPT });
    if (settings.imageGen) payload.unshift({ role: "system", content: IMAGE_SYSTEM_PROMPT });
    if (settings.system) payload.unshift({ role: "system", content: settings.system });

    followStream = isAtBottom();
    scrollNotice.classList.remove("show");
    setStreaming(true);
    abortCtl = new AbortController();
    let raf = 0;
    const paint = () => {
      raf = 0;
      body.innerHTML = md(maskStreamingTags(reply.content)) || '<span class="thinking"><i></i><i></i><i></i></span>';
      body.querySelectorAll("img.chat-gen-image").forEach((img) => {
        img.addEventListener("error", async () => {
          if (img.dataset.failed) return;
          img.dataset.failed = "1";
          // Do not immediately create another anonymous Pollinations request.
          // Route the retry through the same one-at-a-time queue.
          if (settings.imageGen) {
            try {
              const retryUrl = await generatePollinationsImage(img.alt || "the requested subject");
              img.src = retryUrl;
              return;
            } catch (e) {}
          }
          img.alt = "Image could not be loaded";
        }, { once: true });
      });
      if (followStream) msgs.scrollTop = msgs.scrollHeight;
      else scrollNotice.classList.add("show");
    };

    try {
      const bodyObj = { messages: payload, temperature: settings.temperature, stream: true };
      if (settings.model) bodyObj.model = settings.model;
      const r = await fetch(baseUrl() + "/chat/completions", { method: "POST", headers: headers(), body: JSON.stringify(bodyObj), signal: abortCtl.signal });
      if (!r.ok) {
        let detail = ""; try { detail = (await r.json()).error.message || ""; } catch (e) {}
        throw new Error("Server replied " + r.status + (detail ? ": " + detail : ""));
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
      if (!reply.content) reply.content = "(The model returned an empty reply.)";
      else await processReplyTags(reply, text);
    } catch (e) {
      if (e.name === "AbortError") {
        if (!reply.content) reply.content = "(Stopped.)";
      } else {
        const msg = "Could not reach LM Studio at " + baseUrl() + ". Start the server in the Developer tab, load a model, and turn on Enable CORS. (" + e.message + ")";
        reply.content = reply.content ? reply.content + "\n\n" + msg : msg;
        body.classList.add("err");
        setStatus("bad", "LM Studio not reachable");
      }
    } finally {
      if (raf) cancelAnimationFrame(raf);
      paint();
      setStreaming(false); abortCtl = null;
      scrollNotice.classList.remove("show");
      chat.updated = Date.now();
      saveChats(); renderHistory(); renderRecent();
      input.focus();
    }
  }

  /* ---------- Daily fact ---------- */
  const fact = FACTS[Math.floor(Date.now() / 86400000) % FACTS.length];
  $("factText").textContent = fact;
  $("factMore").onclick = () => { input.value = "Tell me more about this fact: " + fact; autosize(); send(); };

  /* ---------- Init ---------- */
  updateHeader(); renderChat(); checkConnection(); input.focus();
})();
