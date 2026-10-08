/* =====================================================================
   MYSTIC REALM — MAGIC 8 BALL AI COMMENTARY
   The 8 Ball itself never sees the querent's question (they think it
   silently, same as the classic toy) — this module just takes the
   classic printed answer that came up and, when AI Reading is turned
   on, asks the currently chosen Mystic to add a short in-character
   remark on top of it. Connection and voice text both come from the
   shared config files (mystic-ai-config.js / mystic-persona-prompts.js),
   same pattern as astragalomancy.js and iching-ai.js.
===================================================================== */

(function () {
  "use strict";

  /* AI connection comes from the shared ../mystic-ai-config.js (loaded
     before this file). The values below are only a fallback in case
     that file failed to load for some reason. */
  const FALLBACK_CONFIG = { apiBase: "https://ollama.myguyinthechair.com/v1", model: "dolphin3:latest", apiKey: "" };
  const AI_CONFIG = window.MysticAIConfig || FALLBACK_CONFIG;
  const HARDWIRED_API_BASE = AI_CONFIG.apiBase;
  const HARDWIRED_MODEL = AI_CONFIG.model;
  const HARDWIRED_API_KEY = AI_CONFIG.apiKey;

  /* Character voice/prompt text lives in the shared
     ../mystic-persona-prompts.js (loaded before this file). */
  const FALLBACK_VOICES = {
    amelia: "Warm, nurturing, and deeply intuitive.",
    gwendolyn: "Mysterious, elegant, and deeply spiritual.",
    anja: "Direct, sharp, and perceptive, with a darker enigmatic edge.",
    elizabeth: "Playful, unconventional, blunt, and unpredictable."
  };
  const VOICES = window.MysticPersonaPrompts || FALLBACK_VOICES;

  const DEFAULT_SYSTEM_PROMPT =
    "You are commenting on a classic Magic 8 Ball reading. The querent " +
    "silently thought of a yes/no question and shook the ball; you will " +
    "only be told which classic printed answer came up (e.g. \"It is " +
    "certain\", \"Reply hazy, try again\"). You do not know the querent's " +
    "actual question, so never invent specifics about it. Write one " +
    "short, mystical, in-character remark (1-2 sentences) that expands " +
    "on that exact answer and stays consistent with what it means — " +
    "never contradict or soften it. Keep a playful but grounded tone. " +
    "Plain text only, no markdown, no bullet lists. Never claim real " +
    "supernatural powers or certainty.";

  function loadSettings() {
    return { apiBase: HARDWIRED_API_BASE, apiKey: HARDWIRED_API_KEY, model: HARDWIRED_MODEL };
  }

  /* The site-wide chosen Mystic (name/emoji/colors) comes from the
     shared ../theme-boot.js, which exposes window.MysticAppTheme.
     That object doesn't carry the voice text, so we pair it with the
     key + VOICES lookup above — same pattern used by
     astragalomancy.js, numerology.js, and iching-ai.js. */
  function currentPersona() {
    const p = window.MysticAppTheme && window.MysticAppTheme.getPersona
      ? window.MysticAppTheme.getPersona()
      : null;
    if (!p) return null;
    const key = window.MysticAppTheme.getKey ? window.MysticAppTheme.getKey() : "";
    return { name: p.name, emoji: p.emoji, voice: VOICES[key] || FALLBACK_VOICES[key] || "" };
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  async function interpretAnswer(answerText) {
    let historyId = null;
    if (window.ReadingHistory) {
      historyId = ReadingHistory.record("Magic 8 Ball", [{ text: answerText }], "Magic 8 Ball");
    }

    const box = document.getElementById("readingBox");
    const bodyEl = document.getElementById("readingBody");
    const titleEl = document.getElementById("readingTitle");
    if (!box || !bodyEl) return;

    box.classList.add("show");
    setTimeout(() => box.classList.add("revealed"), 30);

    const settings = loadSettings();
    if (!settings.apiBase || !settings.model) {
      bodyEl.innerHTML = `<div class="reading-error">The AI server is not reachable right now.</div>`;
      return;
    }

    const persona = currentPersona();
    if (titleEl) titleEl.textContent = persona ? `${persona.emoji} ${persona.name}'s Reading` : "🎱 Your Reading";

    bodyEl.innerHTML = `<div class="reading-loading">${
      persona ? `${persona.emoji} ${persona.name} is reading the ball...` : "🎱 The ball is still swirling..."
    }</div>`;

    const personaContext = persona
      ? `You are ${persona.name}, the chosen Mystic Realm fortune teller. Stay in this character's voice for the reading. ${persona.voice} Never claim real supernatural powers or certainty.`
      : "Use a warm, playful, mystical fortune-teller voice.";

    const messages = [
      { role: "system", content: DEFAULT_SYSTEM_PROMPT + "\n\n" + personaContext },
      { role: "user", content: `The Magic 8 Ball's answer: "${answerText}"\n\nPlease give your reading on this.` },
    ];

    const headers = { "Content-Type": "application/json", Accept: "application/json" };
    if (settings.apiKey) headers.Authorization = "Bearer " + settings.apiKey;

    try {
      const res = await fetch(settings.apiBase + "/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: settings.model,
          messages,
          stream: false,
          temperature: 0.85,
          max_tokens: 300,
        }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error("HTTP " + res.status + (t ? ": " + t : ""));
      }

      const data = await res.json();
      let text = data?.choices?.[0]?.message?.content || "";
      text = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
      text = text.replace(/<think>[\s\S]*$/gi, "").trim();

      bodyEl.textContent = text || "(The AI returned an empty response.)";
      if (window.ReadingHistory && historyId && text) {
        ReadingHistory.updateAI(historyId, text);
      }
    } catch (e) {
      bodyEl.innerHTML = `<div class="reading-error">Couldn't reach the AI (${escapeHtml(
        e.message
      )}). Make sure the Ollama server is running and reachable, then hit Re-comment.</div>`;
    }
  }

  function clear() {
    const box = document.getElementById("readingBox");
    if (!box) return;
    box.classList.remove("show", "revealed");
    const bodyEl = document.getElementById("readingBody");
    if (bodyEl) bodyEl.innerHTML = "";
  }

  window.EightBallAI = { interpretAnswer, clear };
})();
