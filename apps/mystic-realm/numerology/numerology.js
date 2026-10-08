/* =====================================================================
   NUMEROLOGY — CALCULATION ENGINE + AI INTERPRETATION
   Classic Pythagorean numerology. Master numbers 11, 22, 33 are kept
   whenever they appear, instead of being reduced further.

   The AI connection (API URL / key / model) is configured once from
   the AI Settings panel on the main screen (index.html) and shared
   across every app via localStorage — this file just reads it.
===================================================================== */

(function () {
  "use strict";

  const STORAGE_KEY = "mysticTarotAI_settings";
  const MASTER_NUMBERS = [11, 22, 33];

  /* -------------------------------------------------------------
     LETTER VALUES (Pythagorean system)
  ------------------------------------------------------------- */
  const LETTER_VALUES = {
    a: 1, j: 1, s: 1,
    b: 2, k: 2, t: 2,
    c: 3, l: 3, u: 3,
    d: 4, m: 4, v: 4,
    e: 5, n: 5, w: 5,
    f: 6, o: 6, x: 6,
    g: 7, p: 7, y: 7,
    h: 8, q: 8, z: 8,
    i: 9, r: 9,
  };

  const VOWELS = new Set(["a", "e", "i", "o", "u"]);

  /* -------------------------------------------------------------
     MEANINGS — short archetypal blurbs for each number
  ------------------------------------------------------------- */
  const MEANINGS = {
    1: "Leadership, independence, and the courage to go first.",
    2: "Partnership, diplomacy, and sensitivity to others.",
    3: "Creativity, self-expression, and joy.",
    4: "Stability, structure, and steady hard work.",
    5: "Freedom, change, and a taste for adventure.",
    6: "Responsibility, nurturing, and harmony at home.",
    7: "Introspection, analysis, and a spiritual streak.",
    8: "Ambition, authority, and material success.",
    9: "Compassion, idealism, and a humanitarian streak.",
    11: "Master Number — heightened intuition and inspiration.",
    22: "Master Number — the Master Builder; big dreams made real.",
    33: "Master Number — the Master Teacher; selfless compassion.",
  };

  const NUMBER_LABELS = {
    lifePath: "Life Path Number",
    expression: "Expression (Destiny) Number",
    soulUrge: "Soul Urge Number",
    personality: "Personality Number",
    birthday: "Birthday Number",
    maturity: "Maturity Number",
  };

  const NUMBER_HINTS = {
    lifePath: "The path you're walking this lifetime.",
    expression: "Your natural talents and how you show them to the world.",
    soulUrge: "What your heart truly wants.",
    personality: "The first impression you make on others.",
    birthday: "A special talent you were born carrying.",
    maturity: "Who you're growing into in the second half of life.",
  };

  /* -------------------------------------------------------------
     CORE MATH
  ------------------------------------------------------------- */
  function sumDigits(n) {
    return String(Math.abs(n))
      .split("")
      .reduce((a, d) => a + (parseInt(d, 10) || 0), 0);
  }

  function reduceNumber(n) {
    let num = n;
    while (num > 9 && !MASTER_NUMBERS.includes(num)) {
      num = sumDigits(num);
    }
    return num;
  }

  function calculateLifePath(month, day, year) {
    const total = sumDigits(month) + sumDigits(day) + sumDigits(year);
    return reduceNumber(total);
  }

  function calculateBirthdayNumber(day) {
    return reduceNumber(day);
  }

  function wordsOf(fullName) {
    return fullName
      .toLowerCase()
      .replace(/[^a-z\s'-]/g, "")
      .split(/\s+/)
      .filter(Boolean);
  }

  // Y counts as a vowel only when a word has no other vowel in it —
  // a common simplification used by casual numerology calculators.
  function isVowelInWord(letter, word) {
    if (VOWELS.has(letter)) return true;
    if (letter === "y") {
      const hasOtherVowel = [...word].some((c) => VOWELS.has(c));
      return !hasOtherVowel;
    }
    return false;
  }

  function letterSum(fullName, filterFn) {
    const words = wordsOf(fullName);
    let total = 0;
    words.forEach((word) => {
      [...word].forEach((letter) => {
        if (!LETTER_VALUES[letter]) return;
        if (filterFn(letter, word)) total += LETTER_VALUES[letter];
      });
    });
    return total;
  }

  function calculateExpression(fullName) {
    return reduceNumber(letterSum(fullName, () => true));
  }

  function calculateSoulUrge(fullName) {
    return reduceNumber(letterSum(fullName, (letter, word) => isVowelInWord(letter, word)));
  }

  function calculatePersonality(fullName) {
    return reduceNumber(letterSum(fullName, (letter, word) => !isVowelInWord(letter, word)));
  }

  function calculateMaturity(lifePath, expression) {
    return reduceNumber(lifePath + expression);
  }

  function calculateAll(fullName, month, day, year) {
    const lifePath = calculateLifePath(month, day, year);
    const expression = calculateExpression(fullName);
    const soulUrge = calculateSoulUrge(fullName);
    const personality = calculatePersonality(fullName);
    const birthday = calculateBirthdayNumber(day);
    const maturity = calculateMaturity(lifePath, expression);
    return { lifePath, expression, soulUrge, personality, birthday, maturity };
  }

  /* -------------------------------------------------------------
     AI SETTINGS (shared with Mystic Tarot, Madame Selene & Horoscope)
  ------------------------------------------------------------- */
  /* AI connection comes from the shared ../mystic-ai-config.js (loaded
     before this file). The values below are only a fallback in case
     that file failed to load for some reason. */
  const FALLBACK_CONFIG = { apiBase: "https://ollama.myguyinthechair.com/v1", model: "dolphin3:latest", apiKey: "" };
  const AI_CONFIG = window.MysticAIConfig || FALLBACK_CONFIG;
  const HARDWIRED_API_BASE = AI_CONFIG.apiBase;
  const HARDWIRED_MODEL = AI_CONFIG.model;
  const HARDWIRED_API_KEY = AI_CONFIG.apiKey;

  function loadAISettings() {
    return { apiBase: HARDWIRED_API_BASE, apiKey: HARDWIRED_API_KEY, model: HARDWIRED_MODEL };
  }

  const DEFAULT_SYSTEM_PROMPT =
    "You are a warm, insightful numerologist speaking directly to the " +
    "querent. You will be given their core numerology numbers (Life " +
    "Path, Expression, Soul Urge, Personality, Birthday, and Maturity), " +
    "each with its traditional meaning. Write a flowing, cohesive " +
    "reading that weaves the numbers together into one narrative — " +
    "don't just restate each number's dictionary meaning one by one. " +
    "Notice where the numbers reinforce each other and where they " +
    "create interesting tension. Keep a mystical but grounded tone. " +
    "Respond in 3-5 short paragraphs, plain text (no markdown headers, " +
    "no bullet lists).";

  function buildUserPrompt(name, numbers) {
    const lines = Object.keys(NUMBER_LABELS).map((key) => {
      const val = numbers[key];
      return `${NUMBER_LABELS[key]}: ${val} — ${MEANINGS[val] || ""}`;
    });
    return (
      `Querent's name: ${name || "not given"}.\n\nNumerology numbers:\n` +
      lines.join("\n") +
      `\n\nPlease give a cohesive reading weaving these together.`
    );
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  async function interpretNumbers(name, numbers) {
    const bodyEl = document.getElementById("readingBody");
    const box = document.getElementById("readingBox");
    box.classList.add("show");
    setTimeout(() => box.classList.add("revealed"), 30);

    const settings = loadAISettings();
    if (!settings.apiBase || !settings.model) {
      bodyEl.innerHTML = `<div class="reading-error">The AI server is not reachable right now.</div>`;
      return;
    }

    const persona = (window.MysticPersonaTheme && window.MysticPersonaTheme.getPersona && window.MysticPersonaTheme.getPersona())
      || (window.MysticAppTheme && window.MysticAppTheme.getPersona && window.MysticAppTheme.getPersona())
      || null;
    bodyEl.innerHTML = `<div class="reading-loading">${
      persona ? `${persona.emoji} ${persona.name} is studying your numbers...` : "🔮 The numbers are aligning..."
    }</div>`;

    const messages = [
      { role: "system", content: DEFAULT_SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(name, numbers) },
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

      if (window.ReadingHistory && text) {
        const title = "Numerology Reading" + (name ? " for " + name : "");
        const details = Object.keys(NUMBER_LABELS).map((key) => ({
          text: `${NUMBER_LABELS[key]}: ${numbers[key]}`,
        }));
        const historyId = ReadingHistory.record(title, details, "Numerology");
        ReadingHistory.updateAI(historyId, text);
      }
    } catch (e) {
      bodyEl.innerHTML = `<div class="reading-error">Couldn't reach the AI (${escapeHtml(
        e.message
      )}). Make sure the Ollama server is running and reachable, then hit Read Again.</div>`;
    }
  }

  /* -------------------------------------------------------------
     RENDERING
  ------------------------------------------------------------- */
  function renderNumberCards(numbers) {
    const grid = document.getElementById("numbersGrid");
    grid.innerHTML = Object.keys(NUMBER_LABELS)
      .map((key) => {
        const val = numbers[key];
        return `
          <div class="number-card">
            <div class="number-big">${val}</div>
            <div class="number-title">${NUMBER_LABELS[key]}</div>
            <div class="number-hint">${NUMBER_HINTS[key]}</div>
            <div class="number-meaning">${MEANINGS[val] || ""}</div>
          </div>
        `;
      })
      .join("");
    grid.style.display = "grid";
  }

  window.Numerology = {
    calculateAll,
    renderNumberCards,
    interpretNumbers,
  };
})();
