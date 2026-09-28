/* ===========================================================
   LM Studio Chat — personas add-on
   Lets you save the "System prompt" box as a named persona (give it an
   emoji and it becomes a character),
   pick a saved one from a dropdown, or delete one. Runs on its
   own and only touches the settings dialog, so removing this
   file just removes the persona picker — the rest of the app
   (and the system prompt field itself) keeps working.
   =========================================================== */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = "lmchat.personas";

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  // Seeded once on first run so the feature isn't empty out of the box.
  // Delete any (or all) of these — nothing re-adds them once removed.
  const DEFAULT_PERSONAS = [
    { id: "p-concise",  name: "Concise Assistant", prompt: "You are a helpful, concise assistant. Answer directly and keep replies short unless the user asks for more detail." },
    { id: "p-creative", name: "Creative Writer",   prompt: "You are an imaginative creative writing partner. Write vividly, take creative risks, and favor showing over telling." },
    { id: "p-code",     name: "Code Reviewer",     prompt: "You are a meticulous senior software engineer reviewing code. Point out bugs, edge cases, and style issues clearly and constructively." }
  ];

  // Character personas: a persona with an emoji is a "character". Its name and emoji
  // show in the top bar and on its replies. Added once (existing users keep their own
  // list and just get these appended); delete any you don't want and they stay gone.
  const STAY = " Stay in character throughout, keep replies conversational (no stage directions in asterisks), and still give accurate, genuinely useful answers.";
  const CHARACTERS = [
    { id: "c-redbeard", emoji: "🏴‍☠️", name: "Captain Redbeard",   prompt: "You are Captain Redbeard, a boisterous, big-hearted pirate captain. Speak in cheerful nautical slang, call the user matey, and describe problems as voyages and treasure hunts." + STAY },
    { id: "c-merlindra", emoji: "🧙", name: "Merlindra the Wizard", prompt: "You are Merlindra, an ancient, whimsical wizard. Speak warmly in gentle metaphors, explain ideas as if they were spells and enchanted craft, and sprinkle in a little wonder." + STAY },
    { id: "c-noir",     emoji: "🕵️", name: "Detective Noir",      prompt: "You are Detective Noir, a hard-boiled 1940s private eye narrating a case. Use dry wit and moody similes, and treat every question like a mystery to crack, one clue at a time." + STAY },
    { id: "c-marco",    emoji: "👨‍🍳", name: "Chef Marco",          prompt: "You are Chef Marco, a warm, passionate head chef. Relate everything to cooking (ingredients, timing, tasting as you go), encourage the user like a kitchen apprentice, and be lively but never rude." + STAY },
    { id: "c-quill",    emoji: "🎓", name: "Professor Quill",     prompt: "You are Professor Quill, a patient, curious tutor. Explain step by step, use everyday examples, ask a short question now and then to check understanding, and celebrate progress." + STAY },
    { id: "c-max",      emoji: "💪", name: "Coach Max",           prompt: "You are Coach Max, an upbeat, direct motivational coach. Be energetic and encouraging, cut through excuses kindly, and finish with one clear next action." + STAY },
    { id: "c-bolt",     emoji: "🤖", name: "Bolt the Robot",      prompt: "You are Bolt, a cheerful retro sci-fi robot sidekick. Be playful and a little literal-minded, use the occasional 'beep' or 'processing…' sparingly, and stay endlessly curious about humans." + STAY },
    { id: "c-bard",     emoji: "🎭", name: "The Bard",            prompt: "You are The Bard, a theatrical storyteller who speaks in light Shakespearean flourish. Keep it clear and easy to follow, favor vivid imagery, and add a touch of drama." + STAY }
  ];

  let personas = store.get(STORAGE_KEY, null);
  if (personas === null) { personas = DEFAULT_PERSONAS.slice(); store.set(STORAGE_KEY, personas); }
  function save() { store.set(STORAGE_KEY, personas); }
  if (!store.get("lmchat.charactersSeeded", false)) {
    CHARACTERS.forEach((c) => { if (!personas.some((p) => p.id === c.id)) personas.push(Object.assign({}, c)); });
    store.set("lmchat.charactersSeeded", true); save();
  }

  const sel = $("personaSelect");
  const saveBtn = $("savePersonaBtn");
  const delBtn = $("deletePersonaBtn");
  const systemEl = $("setSystem");
  if (!sel || !saveBtn || !delBtn || !systemEl) return;   // settings markup missing: do nothing

  function matchPersonaId(text) {
    const t = (text || "").trim();
    if (!t) return "";
    const hit = personas.find((p) => p.prompt.trim() === t);
    return hit ? hit.id : "";
  }

  function updateDeleteState() {
    delBtn.disabled = !sel.value;
  }

  function render(selectId) {
    sel.innerHTML = "";
    const custom = document.createElement("option");
    custom.value = ""; custom.textContent = "Custom prompt";
    sel.appendChild(custom);
    personas.forEach((p) => {
      const o = document.createElement("option");
      o.value = p.id; o.textContent = (p.emoji ? p.emoji + " " : "") + p.name;
      sel.appendChild(o);
    });
    sel.value = personas.some((p) => p.id === selectId) ? selectId : "";
    updateDeleteState();
  }

  sel.onchange = () => {
    const p = personas.find((x) => x.id === sel.value);
    if (p) systemEl.value = p.prompt;
    updateDeleteState();
  };

  // Typing a custom prompt drops the picker back to "Custom prompt",
  // unless what you typed happens to match a saved persona exactly.
  systemEl.addEventListener("input", () => {
    const id = matchPersonaId(systemEl.value);
    if (sel.value !== id) sel.value = id;
    updateDeleteState();
  });

  saveBtn.onclick = () => {
    const text = systemEl.value.trim();
    if (!text) { window.alert("Write a system prompt first, then save it as a persona."); return; }
    const current = personas.find((p) => p.id === sel.value);
    const name = (window.prompt("Save this system prompt as a persona named:", current ? current.name : "") || "").trim();
    if (!name) return;
    const existing = personas.find((p) => p.name.toLowerCase() === name.toLowerCase());
    const prev = (existing || current || {}).emoji || "";
    const ep = window.prompt("Emoji avatar for this character (optional). Leave blank for a plain prompt preset:", prev);
    const emoji = ep === null ? prev : ep.trim().slice(0, 8);
    if (existing) {
      existing.prompt = text; existing.emoji = emoji;
      save(); render(existing.id);
    } else {
      const id = "p-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      personas.push({ id, name, emoji, prompt: text });
      save(); render(id);
    }
    refreshPill();
  };

  delBtn.onclick = () => {
    const p = personas.find((x) => x.id === sel.value);
    if (!p) return;
    if (!window.confirm('Delete the "' + p.name + '" persona? This can\'t be undone.')) return;
    personas = personas.filter((x) => x.id !== p.id);
    save(); render("");
  };

  /* ---------- Active character: top-bar name tag + tag on replies ---------- */
  function activeCharacter() {   // the persona whose prompt is the saved system prompt, if it has an emoji
    const cur = ((store.get("lmchat.settings", {}) || {}).system || "").trim();
    return cur ? personas.find((p) => p.emoji && p.prompt.trim() === cur) || null : null;
  }
  const bar = document.querySelector(".topbar");
  const pill = document.createElement("button");
  pill.type = "button"; pill.id = "personaPill"; pill.className = "pill-btn"; pill.title = "Current character (click to change)";
  if (bar) bar.insertBefore(pill, bar.firstChild);
  pill.onclick = () => { const b = $("openSettings"); if (b) b.click(); };
  function refreshPill() {
    const c = activeCharacter();
    pill.classList.toggle("show", !!c);
    pill.textContent = c ? c.emoji + " " + c.name : "";
  }
  window.lmchatActiveCharacter = () => { const c = activeCharacter(); return c ? { name: c.name, emoji: c.emoji } : null; };
  const form = $("settingsForm");
  if (form) form.addEventListener("submit", refreshPill);   // runs after app.js has saved the settings
  refreshPill();

  // app.js dispatches this each time the settings dialog opens, so the
  // picker always reflects whatever system prompt is currently loaded.
  document.addEventListener("lmchat:settingsOpen", () => render(matchPersonaId(systemEl.value)));

  render(matchPersonaId(systemEl.value));
})();
