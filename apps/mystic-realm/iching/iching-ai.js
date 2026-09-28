/* =====================================================================
   MYSTIC I CHING — AI INTERPRETATION MODULE
   Same pattern as ai-settings.js (the tarot app's AI module): drop this
   file next to your I Ching page and add
   <script src="iching-ai.js"></script> before </body>.

   Connects to the same OpenAI-compatible server the tarot app uses.
   The connection (API URL / key / model) comes from the shared
   mystic-ai-config.js, loaded before this file — this module just
   reads it and generates an AI reading right after a hexagram is cast.
===================================================================== */

(function () {
  "use strict";

  /* AI connection comes from the shared mystic-ai-config.js (loaded
     before this file, same as the tarot app). The values below are
     only a fallback in case that file failed to load for some reason. */
  const FALLBACK_CONFIG = { apiBase: "https://ollama.myguyinthechair.com/v1", model: "dolphin3:latest", apiKey: "" };
  const AI_CONFIG = window.MysticAIConfig || FALLBACK_CONFIG;
  const HARDWIRED_API_BASE = AI_CONFIG.apiBase;
  const HARDWIRED_MODEL = AI_CONFIG.model;
  const HARDWIRED_API_KEY = AI_CONFIG.apiKey;

  const DEFAULT_SYSTEM_PROMPT =
    "You are a warm, perceptive I Ching oracle reader speaking directly to the " +
    "querent. You will be given the hexagram cast: its number and name, all six " +
    "lines from bottom to top marked yang (solid) or yin (broken) with any " +
    "changing lines noted, and — when lines are changing — the resulting " +
    "hexagram. Write a flowing, cohesive interpretation of the cast as a whole " +
    "for this specific reading, weaving together the primary hexagram's " +
    "meaning, the significance of any changing lines, and the direction " +
    "indicated by the resulting hexagram if there is one. Don't just restate " +
    "each line one by one. Keep a mystical but grounded tone. Respond in 2-4 " +
    "short paragraphs, plain text (no markdown headers, no bullet lists). " +
    "Never claim real supernatural powers or certainty.";

  const settings = {
    apiBase: HARDWIRED_API_BASE,
    apiKey: HARDWIRED_API_KEY,
    model: HARDWIRED_MODEL,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    enabled: true,
  };

  /* Character voice/prompt text lives in the shared
     ../mystic-persona-prompts.js (loaded before this file). */
  const FALLBACK_VOICES = {
    amelia: "Warm, nurturing, and deeply intuitive.",
    gwendolyn: "Mysterious, elegant, and deeply spiritual.",
    anja: "Direct, sharp, and perceptive, with a darker enigmatic edge.",
    elizabeth: "Playful, unconventional, blunt, and unpredictable."
  };
  const VOICES = window.MysticPersonaPrompts || FALLBACK_VOICES;

  /* The site-wide chosen Mystic (name/emoji/colors) comes from the
     shared ../theme-boot.js, which exposes window.MysticAppTheme.
     That object doesn't carry the voice text, so we pair it with the
     key + VOICES lookup above — same pattern used by
     astragalomancy.js and numerology.js. */
  function currentPersona() {
    const p = window.MysticAppTheme && window.MysticAppTheme.getPersona
      ? window.MysticAppTheme.getPersona()
      : null;
    if (!p) return null;
    const key = window.MysticAppTheme.getKey ? window.MysticAppTheme.getKey() : "";
    return { name: p.name, emoji: p.emoji, voice: VOICES[key] || FALLBACK_VOICES[key] || "" };
  }

  /* -------------------------------------------------------------
     STYLES (same look as the tarot app's AI interpretation box)
  ------------------------------------------------------------- */
  const style = document.createElement("style");
  style.textContent = `
    .ai-interp-box{
      max-width:560px; margin:20px auto 40px; padding:26px 30px;
      background:rgba(28, 15, 40,0.7); border:2px solid rgba(255,215,0,0.4);
      border-radius:12px; text-align:left; opacity:0; transform:translateY(20px);
      transition:opacity .6s ease, transform .6s ease; display:none;
    }
    .ai-interp-box.show{ display:block; }
    .ai-interp-box.revealed{ opacity:1; transform:translateY(0); }
    .ai-interp-box h2{
      text-align:center; color:#ffd700; font-size:1.5em; margin:0 0 16px;
      text-shadow:1px 1px 2px rgba(0,0,0,0.6);
    }
    .ai-interp-body{
      color:#e6e6e6; line-height:1.8; font-size:1.05em; white-space:pre-wrap;
    }
    .ai-interp-loading{
      color:#b8c4cc; font-style:italic; text-align:center;
    }
    .ai-interp-error{
      color:#ff8080; text-align:center;
    }
    .ai-interp-error a{ color:#ffd700; }
    .ai-interp-footer{
      margin-top:18px; text-align:center;
    }
    .ai-mini-btn{
      background:transparent; border:1px solid rgba(255,215,0,0.4);
      color:#ffd700; padding:6px 14px; border-radius:6px; cursor:pointer;
      font-family:inherit; font-size:0.82em;
    }
    .ai-mini-btn:hover{ background:rgba(255,215,0,0.1); }

    @media (max-width:768px){
      .ai-interp-box{ padding:20px 18px; }
    }
  `;
  document.head.appendChild(style);

  /* -------------------------------------------------------------
     INTERPRETATION BOX (inserted once per page, after readingSection)
  ------------------------------------------------------------- */
  let box = null;

  function ensureBox() {
    if (box) return box;
    box = document.createElement("div");
    box.className = "ai-interp-box";
    box.innerHTML = `
      <h2 class="ai-interp-title">🔮 Your Reading</h2>
      <div class="ai-interp-body"></div>
      <div class="ai-interp-footer">
        <button type="button" class="ai-mini-btn" id="ichingReinterpretBtn">🔄 Re-interpret</button>
      </div>
    `;
    const anchor = document.getElementById("readingSection");
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(box, anchor.nextSibling);
    } else {
      document.body.appendChild(box);
    }
    return box;
  }

  function lineLabel(idx) {
    if (idx === 0) return "1 (bottom)";
    if (idx === 5) return "6 (top)";
    return String(idx + 1);
  }

  function buildUserPrompt(castTitle, data) {
    const lineDescs = data.lines.map((l, idx) => {
      const type = l.solid ? "Yang (solid)" : "Yin (broken)";
      const changeNote = l.changing ? ", changing" : "";
      return `Line ${lineLabel(idx)}: ${type}${changeNote}`;
    });

    let text =
      `Cast: ${castTitle}\n\n` +
      `Primary hexagram: ${data.primaryNumber}. ${data.primaryName}\n` +
      `Traditional note: ${data.primaryNote}\n\n` +
      `Lines (bottom to top):\n${lineDescs.join("\n")}\n`;

    if (data.hasChanging) {
      text +=
        `\nChanging lines transform this into hexagram ${data.resultNumber}. ${data.resultName}\n` +
        `Traditional note: ${data.resultNote}\n`;
    } else {
      text += `\nNo changing lines — the hexagram stands as cast.\n`;
    }

    text += `\nPlease give your interpretation of this cast as a whole, as guidance for the querent's question.`;
    return text;
  }

  function summaryForHistory(castTitle, data) {
    let s = `${data.primaryNumber}. ${data.primaryName}`;
    if (data.hasChanging) s += ` → ${data.resultNumber}. ${data.resultName}`;
    return s;
  }

  async function interpretCast(castTitle, data) {
    let historyId = null;
    if (window.ReadingHistory) {
      historyId = ReadingHistory.record(castTitle, [{ text: summaryForHistory(castTitle, data) }], "I Ching");
    }

    if (!settings.enabled) return;

    const el = ensureBox();
    el.classList.add("show");
    setTimeout(() => el.classList.add("revealed"), 30);
    const bodyEl = el.querySelector(".ai-interp-body");
    el.querySelector("#ichingReinterpretBtn").onclick = () => interpretCast(castTitle, data);

    if (!settings.apiBase || !settings.model) {
      bodyEl.innerHTML = `<div class="ai-interp-error">The AI server is not reachable right now.</div>`;
      return;
    }

    const persona = currentPersona();

    const titleEl = el.querySelector(".ai-interp-title");
    if (titleEl) titleEl.textContent = persona ? `${persona.emoji} ${persona.name}'s Reading` : "🔮 Your Reading";

    bodyEl.innerHTML = `<div class="ai-interp-loading">${
      persona ? `${persona.emoji} ${persona.name} is reading the hexagram...` : "🔮 The lines are speaking..."
    }</div>`;

    const personaContext = persona
      ? `You are ${persona.name}, the chosen Mystic character. The entire app is themed around this character. Stay in this character's voice for the reading. ${persona.voice} Never claim real supernatural powers or certainty.`
      : "Use the default Mystic Oracle reader voice.";

    const messages = [
      { role: "system", content: (settings.systemPrompt || DEFAULT_SYSTEM_PROMPT) + "\n\n" + personaContext },
      { role: "user", content: buildUserPrompt(castTitle, data) },
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
          max_tokens: 700,
        }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error("HTTP " + res.status + (t ? ": " + t : ""));
      }

      const data2 = await res.json();
      let text = data2?.choices?.[0]?.message?.content || "";
      text = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
      text = text.replace(/<think>[\s\S]*$/gi, "").trim();

      bodyEl.textContent = text || "(The AI returned an empty response.)";
      if (window.ReadingHistory && historyId && text) {
        ReadingHistory.updateAI(historyId, text);
      }
    } catch (e) {
      bodyEl.innerHTML = `<div class="ai-interp-error">Couldn't reach the AI (${escapeHtml(
        e.message
      )}). Make sure the Ollama server is running and reachable, then hit Re-interpret.</div>`;
    }
  }

  function clearInterpretation() {
    if (box) {
      box.classList.remove("show", "revealed");
      box.querySelector(".ai-interp-body").innerHTML = "";
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  window.IChingAI = {
    interpretCast,
    clear: clearInterpretation,
  };
})();
