/* =====================================================================
   MYSTIC TAROT — AI INTERPRETATION MODULE
   Drop this one file (ai-settings.js) next to your tarot pages and add
   <script src="ai-settings.js"></script> before </body>.

   Connects to any OpenAI-compatible local server (LM Studio, etc.).
   The connection (API URL / key / model) is configured once from the
   AI Settings panel on the main screen (index.html) and shared across
   every app via localStorage — this file just reads it and auto-
   generates an AI interpretation right after cards are drawn.
===================================================================== */

(function () {
  "use strict";

  const STORAGE_KEY = "mysticTarotAI_settings";

  /* AI connection comes from the shared mystic-ai-config.js (loaded
     before this file). The values below are only a fallback in case
     that file failed to load for some reason. */
  const FALLBACK_CONFIG = { apiBase: "https://ollama.myguyinthechair.com/v1", model: "dolphin3:latest", apiKey: "" };
  const AI_CONFIG = window.MysticAIConfig || FALLBACK_CONFIG;
  const HARDWIRED_API_BASE = AI_CONFIG.apiBase;
  const HARDWIRED_MODEL = AI_CONFIG.model;
  const HARDWIRED_API_KEY = AI_CONFIG.apiKey;

  const DEFAULT_SYSTEM_PROMPT =
    "You are a warm, perceptive tarot reader speaking directly to the " +
    "querent. You will be given the name of a spread and the cards drawn " +
    "for each position (card name, orientation, and its traditional " +
    "meaning). Write a flowing, cohesive interpretation that weaves the " +
    "cards together into one narrative for this specific spread — don't " +
    "just restate each card's dictionary meaning one by one. Notice " +
    "connections, tensions, and themes across the positions. Keep a " +
    "mystical but grounded tone. Respond in 2-4 short paragraphs, plain " +
    "text (no markdown headers, no bullet lists).";

  const DEFAULTS = {
    apiBase: HARDWIRED_API_BASE,
    apiKey: HARDWIRED_API_KEY,
    model: HARDWIRED_MODEL,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    enabled: true,
  };

  function loadSettings() {
    // Connection is hardwired — always use the fixed endpoint/model,
    // ignoring anything that may still be in localStorage.
    return { ...DEFAULTS };
  }

  let settings = loadSettings();

  /* -------------------------------------------------------------
     STYLES (just the interpretation box shown after a reading —
     the connection settings themselves live on the main screen)
  ------------------------------------------------------------- */
  const style = document.createElement("style");
  style.textContent = `
    .ai-interp-box{
      max-width:700px; margin:20px auto 40px; padding:26px 30px;
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
      font-size:0.82em;
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
        <button type="button" class="ai-mini-btn" id="aiReinterpretBtn">🔄 Re-interpret</button>
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

  function buildUserPrompt(spreadTitle, cards) {
    const lines = cards.map((c, i) => {
      const cleanName = c.cardName.replace(/\.jpg$/i, "").replace(/_/g, " ");
      const orientation = c.reversed ? "Reversed" : "Upright";
      const meaning = c.meaning || "";
      const pos = c.position ? c.position + " — " : "";
      return `${i + 1}. ${pos}${cleanName} (${orientation}): ${meaning}`;
    });
    return (
      `Spread: ${spreadTitle}\n\nCards drawn:\n` +
      lines.join("\n") +
      `\n\nPlease give your interpretation of this reading as a whole.`
    );
  }

  async function interpretSpread(spreadTitle, cards) {
    settings = loadSettings();

    let historyId = null;
    if (window.ReadingHistory) {
      historyId = ReadingHistory.record(spreadTitle, cards);
    }

    if (!settings.enabled) return;

    const el = ensureBox();
    el.classList.add("show");
    setTimeout(() => el.classList.add("revealed"), 30);
    const bodyEl = el.querySelector(".ai-interp-body");
    el.querySelector("#aiReinterpretBtn").onclick = () => interpretSpread(spreadTitle, cards);

    if (!settings.apiBase || !settings.model) {
      bodyEl.innerHTML = `<div class="ai-interp-error">The AI server is not reachable right now.</div>`;
      return;
    }

    const persona = window.MysticPersonaTheme && window.MysticPersonaTheme.getPersona
      ? window.MysticPersonaTheme.getPersona()
      : null;

    const titleEl = el.querySelector(".ai-interp-title");
    if (titleEl) titleEl.textContent = persona ? `${persona.emoji} ${persona.name}'s Reading` : "🔮 Your Reading";

    bodyEl.innerHTML = `<div class="ai-interp-loading">${
      persona ? `${persona.emoji} ${persona.name} is reading the cards...` : "🔮 The cards are speaking..."
    }</div>`;

    const personaContext = persona
      ? `You are ${persona.name}, the chosen Mystic Tarot character. The entire app is themed around this character. Stay in this character's voice for the reading. ${persona.voice} Never claim real supernatural powers or certainty.`
      : "Use the default Mystic Tarot reader voice.";

    const messages = [
      { role: "system", content: (settings.systemPrompt || DEFAULT_SYSTEM_PROMPT) + "\n\n" + personaContext },
      { role: "user", content: buildUserPrompt(spreadTitle, cards) },
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

      const data = await res.json();
      let text = data?.choices?.[0]?.message?.content || "";
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

  window.AITarot = {
    interpretSpread,
    clear: clearInterpretation,
  };
})();
