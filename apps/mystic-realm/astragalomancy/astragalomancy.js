/* =====================================================================
   MYSTIC REALM — ASTRAGALOMANCY (DICE DIVINATION)
   Wires up the 3D dice roller (dice.js) and sends the result of each
   cast to the AI for a reading, in the currently chosen fortune
   teller's voice. Connection and voice text both come from the two
   shared config files (mystic-ai-config.js / mystic-persona-prompts.js).
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
    "You are performing an astragalomancy reading — an ancient form of " +
    "divination using dice (from the Greek astragaloi, or knucklebones), " +
    "where the fall and combination of the dice cast are read as a sign. " +
    "You will be given which dice were cast and the number each one " +
    "landed on. Do not explain what astragalomancy is — the querent " +
    "already knows. Instead, read the actual numbers: notice their sum, " +
    "any doubles or repeats, how high or low they fell, and the " +
    "relationship between them, and weave that into a short, evocative " +
    "omen or message for the querent. Keep a mystical but grounded tone. " +
    "Respond in 2-3 short paragraphs, plain text (no markdown headers, " +
    "no bullet lists).";

  function loadSettings() {
    return { apiBase: HARDWIRED_API_BASE, apiKey: HARDWIRED_API_KEY, model: HARDWIRED_MODEL };
  }

  function currentPersona() {
    const p = window.MysticAppTheme && window.MysticAppTheme.getPersona ? window.MysticAppTheme.getPersona() : null;
    if (!p) return null;
    const key = window.MysticAppTheme.getKey ? window.MysticAppTheme.getKey() : "";
    return { name: p.name, emoji: p.emoji, voice: VOICES[key] || FALLBACK_VOICES[key] || "" };
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function buildUserPrompt(notation) {
    const perDie = notation.set.map((d, i) => `${d}: ${notation.result[i]}`).join(", ");
    let line = `Cast: ${notation.set.join(" + ")}\nResults — ${perDie}`;
    if (notation.constant) line += `\nModifier: ${notation.constant >= 0 ? "+" : ""}${notation.constant}`;
    line += `\nTotal: ${notation.resultTotal}`;
    return line + `\n\nPlease give your reading of this casting.`;
  }

  async function interpretCast(notation) {
    const bodyEl = document.getElementById("readingBody");
    const box = document.getElementById("readingBox");
    box.classList.add("show");
    setTimeout(() => box.classList.add("revealed"), 30);

    const settings = loadSettings();
    if (!settings.apiBase || !settings.model) {
      bodyEl.innerHTML = `<div class="reading-error">The AI server is not reachable right now.</div>`;
      return;
    }

    const persona = currentPersona();
    bodyEl.innerHTML = `<div class="reading-loading">${
      persona ? `${persona.emoji} ${persona.name} is reading the bones...` : "🎲 The bones are settling..."
    }</div>`;

    const personaContext = persona
      ? `You are ${persona.name}, the chosen Mystic Realm fortune teller. Stay in this character's voice for the reading. ${persona.voice} Never claim real supernatural powers or certainty.`
      : "Use a warm, mystical fortune-teller voice.";

    const messages = [
      { role: "system", content: DEFAULT_SYSTEM_PROMPT + "\n\n" + personaContext },
      { role: "user", content: buildUserPrompt(notation) },
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
          temperature: 0.9,
          max_tokens: 600,
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

      if (window.ReadingHistory && text) {
        const title = "Astragalomancy: " + notation.set.join(" + ") + " = " + notation.resultTotal;
        const details = [{ text: notation.resultString }];
        const historyId = ReadingHistory.record(title, details, "Astragalomancy");
        ReadingHistory.updateAI(historyId, text);
      }
    } catch (e) {
      bodyEl.innerHTML = `<div class="reading-error">Couldn't reach the AI (${escapeHtml(
        e.message
      )}). Make sure the Ollama server is running and reachable, then hit Read Again.</div>`;
    }
  }

  window.Astragalomancy = { interpretCast };
})();
