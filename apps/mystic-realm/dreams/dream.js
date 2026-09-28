/* =====================================================================
   DREAM INTERPRETER — SYMBOLISM ENGINE + AI INTERPRETATION
   Optionally weaves in a randomly drawn tarot card and/or the
   dreamer's zodiac sign for extra flavor.

   The AI connection (API URL / key / model) is configured once from
   the AI Settings panel on the main screen (index.html) and shared
   across every app via localStorage — this file just reads it.
===================================================================== */

(function () {
  "use strict";

  const STORAGE_KEY = "mysticTarotAI_settings";

  /* -------------------------------------------------------------
     TAROT CARD MEANINGS (same deck & meanings used by Mystic Tarot)
  ------------------------------------------------------------- */
const CARD_MEANINGS = {
  "The Fool.jpg": {
    upright: "New beginnings, innocence, spontaneity, free spirit. A journey is beginning.",
    reversed: "Recklessness, risk-taking, holding back, missed opportunities."
  },
  "The Magician.jpg": {
    upright: "Manifestation, resourcefulness, power, inspired action. You have the tools you need.",
    reversed: "Manipulation, poor planning, untapped talents, illusion."
  },
  "The High Priestess.jpg": {
    upright: "Intuition, sacred knowledge, divine feminine, the subconscious mind.",
    reversed: "Secrets, disconnected from intuition, withdrawal and silence."
  },
  "The Empress.jpg": {
    upright: "Femininity, beauty, nature, nurturing, abundance, creativity.",
    reversed: "Creative block, dependence on others, lack of growth."
  },
  "The Emperor.jpg": {
    upright: "Authority, establishment, structure, father figure, stability.",
    reversed: "Domination, excessive control, rigidity, inflexibility."
  },
  "The Hierophant.jpg": {
    upright: "Spiritual wisdom, tradition, conformity, morality, institutions.",
    reversed: "Personal beliefs, freedom, challenging the status quo."
  },
  "The Lovers.jpg": {
    upright: "Love, harmony, relationships, values alignment, choices.",
    reversed: "Imbalance, misalignment of values, disharmony in relationships."
  },
  "The Chariot.jpg": {
    upright: "Control, willpower, success, action, determination, victory.",
    reversed: "Lack of control, lack of direction, aggression, opposition."
  },
  "strength.jpg": {
    upright: "Strength, courage, patience, control, compassion, inner power.",
    reversed: "Self-doubt, weakness, insecurity, lack of confidence."
  },
  "The Hermit.jpg": {
    upright: "Soul-searching, introspection, inner guidance, solitude, wisdom.",
    reversed: "Isolation, loneliness, withdrawal from others, lost your way."
  },
  "The Wheel of Fortune.jpg": {
    upright: "Good luck, karma, life cycles, destiny, turning point.",
    reversed: "Bad luck, resistance to change, breaking cycles."
  },
  "Justice.jpg": {
    upright: "Justice, fairness, truth, cause and effect, law and order.",
    reversed: "Unfairness, lack of accountability, dishonesty, injustice."
  },
  "The Hanged Man.jpg": {
    upright: "Pause, surrender, letting go, new perspectives, sacrifice.",
    reversed: "Delays, resistance, stalling, indecision, unable to let go."
  },
  "Death.jpg": {
    upright: "Endings, change, transformation, transition, letting go of the past.",
    reversed: "Resistance to change, fear of change, repeating negative patterns."
  },
  "Temperance.jpg": {
    upright: "Balance, moderation, patience, purpose, finding meaning.",
    reversed: "Imbalance, excess, self-healing, re-alignment needed."
  },
  "The Devil.jpg": {
    upright: "Shadow self, attachment, addiction, restriction, sexuality.",
    reversed: "Releasing limiting beliefs, exploring dark thoughts, detachment."
  },
  "The Tower.jpg": {
    upright: "Sudden change, upheaval, chaos, revelation, awakening.",
    reversed: "Personal transformation, fear of change, averting disaster."
  },
  "The Star.jpg": {
    upright: "Hope, faith, purpose, renewal, spirituality, inspiration.",
    reversed: "Lack of faith, despair, self-trust, disconnection."
  },
  "The Moon.jpg": {
    upright: "Illusion, fear, anxiety, subconscious, intuition, dreams.",
    reversed: "Release of fear, repressed emotion, inner confusion clearing."
  },
  "The Sun.jpg": {
    upright: "Positivity, fun, warmth, success, vitality, joy, confidence.",
    reversed: "Inner child, feeling down, overly optimistic, unrealistic."
  },
  "Judgement.jpg": {
    upright: "Judgement, rebirth, inner calling, absolution, self-evaluation.",
    reversed: "Self-doubt, inner critic, ignoring the call, lack of self-awareness."
  },
  "The World.jpg": {
    upright: "Completion, accomplishment, travel, fulfillment, unity.",
    reversed: "Seeking closure, incomplete, lack of closure, short-cuts."
  },
  "Ace of Wands.jpg": {
    upright: "Inspiration, new opportunities, growth, potential in creative ventures.",
    reversed: "Emerging ideas, lack of direction, delays, creative blocks."
  },
  "Two of Wands.jpg": {
    upright: "Future planning, progress, decisions, discovery, personal power.",
    reversed: "Fear of unknown, lack of planning, bad planning, playing it safe."
  },
  "Three of Wands.jpg": {
    upright: "Progress, expansion, foresight, overseas opportunities, leadership.",
    reversed: "Playing it safe, lack of foresight, unexpected delays."
  },
  "Four of Wands.jpg": {
    upright: "Celebration, joy, harmony, relaxation, homecoming, community.",
    reversed: "Personal celebration, inner harmony, conflict with others."
  },
  "Five of Wands.jpg": {
    upright: "Conflict, disagreements, competition, tension, diversity of ideas.",
    reversed: "Inner conflict, avoiding conflict, end of conflict, compromise."
  },
  "Six of Wands.jpg": {
    upright: "Success, public recognition, progress, self-confidence, victory.",
    reversed: "Private achievement, personal success, fall from grace, egotism."
  },
  "Seven of Wands.jpg": {
    upright: "Challenge, competition, protection, perseverance, standing your ground.",
    reversed: "Exhaustion, giving up, overwhelmed, feeling defeated."
  },
  "Eight of Wands.jpg": {
    upright: "Movement, fast-paced change, action, alignment, air travel, rapid progress.",
    reversed: "Delays, frustration, resisting change, internal alignment needed."
  },
  "Nine of Wands.jpg": {
    upright: "Resilience, courage, persistence, test of faith, boundaries.",
    reversed: "Inner resources, struggle, overwhelm, defensive, paranoia."
  },
  "Ten of Wands.jpg": {
    upright: "Burden, extra responsibility, hard work, completion, stress.",
    reversed: "Doing it all, delegating, release, letting go of burdens."
  },
  "Page of Wands.jpg": {
    upright: "Inspiration, ideas, discovery, new opportunities, free spirit, enthusiasm.",
    reversed: "Newly-formed ideas, redirecting energy, self-limiting beliefs."
  },
  "Knight of Wands.jpg": {
    upright: "Energy, passion, adventure, impulsiveness, inspired action.",
    reversed: "Passion project, haste, scattered energy, delays, frustration."
  },
  "Queen of Wands.jpg": {
    upright: "Courage, confidence, independence, social butterfly, determination.",
    reversed: "Self-respect, self-confidence, introverted, re-establish confidence."
  },
  "King of Wands.jpg": {
    upright: "Natural-born leader, vision, entrepreneur, honor, boldness.",
    reversed: "Impulsiveness, haste, ruthless, high expectations, arrogance."
  },
  "Ace of Cups.jpg": {
    upright: "Love, new relationships, compassion, creativity, emotional awakening.",
    reversed: "Self-love, intuition, repressed emotions, blocked creativity."
  },
  "Two of Cups.jpg": {
    upright: "Unified love, partnership, mutual attraction, connection, relationships.",
    reversed: "Self-love, break-ups, disharmony, imbalance in relationships."
  },
  "Three of Cups.jpg": {
    upright: "Celebration, friendship, creativity, collaboration, community.",
    reversed: "Independence, alone time, hardcore partying, 'three's a crowd'."
  },
  "Four of Cups.jpg": {
    upright: "Meditation, contemplation, apathy, reevaluation, missing opportunities.",
    reversed: "Retreat, withdrawal, checking in for alignment, self-awareness."
  },
  "Five of Cups.jpg": {
    upright: "Regret, failure, disappointment, pessimism, loss, grief.",
    reversed: "Personal setbacks, self-forgiveness, moving on, acceptance."
  },
  "Six of Cups.jpg": {
    upright: "Revisiting the past, childhood memories, innocence, joy, nostalgia.",
    reversed: "Living in past, forgiveness, lacking playfulness, moving forward."
  },
  "Seven of Cups.jpg": {
    upright: "Opportunities, choices, wishful thinking, illusion, fantasy.",
    reversed: "Alignment, personal values, overwhelmed by choices, clarity."
  },
  "Eight of Cups.jpg": {
    upright: "Disappointment, abandonment, withdrawal, escapism, moving on.",
    reversed: "Trying one more time, indecision, aimless drifting, confusion."
  },
  "Nine of Cups.jpg": {
    upright: "Contentment, satisfaction, gratitude, wish come true, emotional stability.",
    reversed: "Inner happiness, materialism, dissatisfaction, indulgence."
  },
  "Ten of Cups.jpg": {
    upright: "Divine love, blissful relationships, harmony, alignment, family happiness.",
    reversed: "Disconnection, misaligned values, struggling relationships."
  },
  "Page of Cups.jpg": {
    upright: "Creative opportunities, curiosity, possibility, intuitive messages.",
    reversed: "New ideas, doubting intuition, creative blocks, inner child."
  },
  "Knight of Cups.jpg": {
    upright: "Creativity, romance, charm, imagination, beauty, following your heart.",
    reversed: "Overactive imagination, unrealistic, jealous, moodiness."
  },
  "Queen of Cups.jpg": {
    upright: "Compassion, warmth, kindness, intuition, healer, counselor.",
    reversed: "Inner feelings, self-care, self-love, co-dependency."
  },
  "King of Cups.jpg": {
    upright: "Emotionally balanced, compassionate, diplomatic, caring, tolerant.",
    reversed: "Self-compassion, inner feelings, moodiness, emotional manipulation."
  },
  "Ace of Swords.jpg": {
    upright: "Breakthroughs, new ideas, mental clarity, success, raw power of the mind.",
    reversed: "Inner clarity, re-thinking ideas, clouded judgment, confusion."
  },
  "Two of Swords.jpg": {
    upright: "Difficult decisions, weighing options, stalemate, avoidance, denial.",
    reversed: "Indecision, confusion, information overload, sticking your head in sand."
  },
  "Three of Swords.jpg": {
    upright: "Heartbreak, emotional pain, sorrow, grief, hurt, trauma.",
    reversed: "Negative self-talk, releasing pain, optimism, forgiveness."
  },
  "Four of Swords.jpg": {
    upright: "Rest, relaxation, meditation, contemplation, recuperation.",
    reversed: "Exhaustion, burn-out, deep contemplation, stagnation."
  },
  "Five of Swords.jpg": {
    upright: "Conflict, disagreements, competition, defeat, winning at all costs.",
    reversed: "Reconciliation, making amends, past resentment, open communication."
  },
  "Six of Swords.jpg": {
    upright: "Transition, change, rite of passage, releasing baggage, moving forward.",
    reversed: "Personal transition, resistance to change, unfinished business."
  },
  "Seven of Swords.jpg": {
    upright: "Betrayal, deception, getting away with something, stealth, strategy.",
    reversed: "Imposter syndrome, self-deceit, keeping secrets, coming clean."
  },
  "Eight of Swords.jpg": {
    upright: "Negative thoughts, self-imposed restriction, imprisonment, victim mentality.",
    reversed: "Self-limiting beliefs, inner critic, releasing negative thoughts, freedom."
  },
  "Nine of Swords.jpg": {
    upright: "Anxiety, worry, fear, depression, nightmares, mental anguish.",
    reversed: "Inner turmoil, deep-seated fears, secrets, releasing worry."
  },
  "Ten of Swords.jpg": {
    upright: "Painful endings, deep wounds, betrayal, loss, rock bottom, crisis.",
    reversed: "Recovery, regeneration, resisting an inevitable end, things can only get better."
  },
  "Page of Swords.jpg": {
    upright: "New ideas, curiosity, thirst for knowledge, new ways of communicating.",
    reversed: "Self-expression, all talk and no action, haphazard action, speaking out."
  },
  "Knight of Swords.jpg": {
    upright: "Ambitious, action-oriented, driven to succeed, fast-thinking, assertive.",
    reversed: "Restless, unfocused, impulsive, burn-out, reckless behavior."
  },
  "Queen of Swords.jpg": {
    upright: "Independent, unbiased judgment, clear boundaries, direct communication.",
    reversed: "Overly-emotional, easily influenced, bitchy, cold-hearted, bitter."
  },
  "King of Swords.jpg": {
    upright: "Mental clarity, intellectual power, authority, truth, clear thinking.",
    reversed: "Quiet power, inner truth, misuse of power, manipulation."
  },
  "Ace of Pentacles.jpg": {
    upright: "New financial opportunity, prosperity, abundance, manifestation.",
    reversed: "Lost opportunity, missed chance, lack of planning, scarcity mindset."
  },
  "Two of Pentacles.jpg": {
    upright: "Multiple priorities, time management, prioritization, adaptability.",
    reversed: "Over-committed, disorganization, overwhelmed, re-prioritizing."
  },
  "Three of Pentacles.jpg": {
    upright: "Teamwork, collaboration, learning, implementation, building.",
    reversed: "Disharmony, misalignment, working alone, lack of teamwork."
  },
  "Four of Pentacles.jpg": {
    upright: "Saving money, security, conservatism, scarcity, control, holding on.",
    reversed: "Over-spending, greed, self-protection, financial insecurity."
  },
  "Five of Pentacles.jpg": {
    upright: "Financial loss, poverty, lack mindset, isolation, worry, hardship.",
    reversed: "Recovery from financial loss, spiritual poverty, positive changes coming."
  },
  "Six of Pentacles.jpg": {
    upright: "Giving, receiving, sharing wealth, generosity, charity, fairness.",
    reversed: "Self-care, unpaid debts, one-sided charity, strings attached."
  },
  "Seven of Pentacles.jpg": {
    upright: "Long-term view, sustainable results, perseverance, investment, patience.",
    reversed: "Lack of long-term vision, limited success, impatience, procrastination."
  },
  "Eight of Pentacles.jpg": {
    upright: "Apprenticeship, repetitive tasks, mastery, skill development, dedication.",
    reversed: "Self-development, perfectionism, misdirected activity, uninspired work."
  },
  "Nine of Pentacles.jpg": {
    upright: "Abundance, luxury, self-sufficiency, financial independence, success.",
    reversed: "Self-worth, over-investment in work, hustling, material instability."
  },
  "Ten of Pentacles.jpg": {
    upright: "Wealth, financial security, family, long-term success, legacy, contribution.",
    reversed: "Financial failure, loneliness, loss, broken family relationships."
  },
  "Page of Pentacles.jpg": {
    upright: "Manifestation, financial opportunity, skill development, new job, ambitious.",
    reversed: "Lack of progress, procrastination, learn from failure, new ideas."
  },
  "Knight of Pentacles.jpg": {
    upright: "Hard work, productivity, routine, conservatism, methodical, efficient.",
    reversed: "Self-discipline, boredom, feeling 'stuck', perfectionism, laziness."
  },
  "Queen of Pentacles.jpg": {
    upright: "Nurturing, practical, providing financially, down-to-earth, luxury, comfort.",
    reversed: "Financial independence, self-care, work-home conflict, jealousy."
  },
  "King of Pentacles.jpg": {
    upright: "Wealth, business, leadership, security, discipline, abundance, provider.",
    reversed: "Financially inept, obsessed with wealth, greed, materialistic."
  }
};

  /* -------------------------------------------------------------
     ZODIAC SIGNS (for the optional astrology connection)
  ------------------------------------------------------------- */
  const ZODIAC_SIGNS = [
    { key: "aries", name: "Aries", symbol: "♈" },
    { key: "taurus", name: "Taurus", symbol: "♉" },
    { key: "gemini", name: "Gemini", symbol: "♊" },
    { key: "cancer", name: "Cancer", symbol: "♋" },
    { key: "leo", name: "Leo", symbol: "♌" },
    { key: "virgo", name: "Virgo", symbol: "♍" },
    { key: "libra", name: "Libra", symbol: "♎" },
    { key: "scorpio", name: "Scorpio", symbol: "♏" },
    { key: "sagittarius", name: "Sagittarius", symbol: "♐" },
    { key: "capricorn", name: "Capricorn", symbol: "♑" },
    { key: "aquarius", name: "Aquarius", symbol: "♒" },
    { key: "pisces", name: "Pisces", symbol: "♓" },
  ];

  const CARD_FILES = Object.keys(CARD_MEANINGS);

  // The original tarot deck's "Queen of Wands" image is oddly named —
  // map it here so this feature's card art still renders correctly,
  // without touching the tarot app itself.
  const IMAGE_FILE_OVERRIDES = {
    "Queen of Wands.jpg": "waqu.jpg",
  };

  function drawRandomCard() {
    const file = CARD_FILES[Math.floor(Math.random() * CARD_FILES.length)];
    const reversed = Math.random() < 0.35;
    const meaningObj = CARD_MEANINGS[file];
    const meaning = reversed ? meaningObj.reversed : meaningObj.upright;
    const cleanName = file.replace(/\.jpg$/i, "");
    const imageFile = IMAGE_FILE_OVERRIDES[file] || file;
    return { file: imageFile, name: cleanName, reversed, meaning };
  }

  /* -------------------------------------------------------------
     AI SETTINGS (shared with Mystic Tarot, Madame Selene,
     Celestial Horoscope & Numerology)
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
    "You are a warm, perceptive dream interpreter speaking directly to " +
    "the dreamer. You will be given a description of their dream, and " +
    "optionally a tarot card that was randomly drawn to reflect the " +
    "dream's energy, and/or the dreamer's zodiac sign. Interpret the " +
    "symbolism in the dream itself first and foremost — the setting, " +
    "objects, colors, and events described. If a tarot card is given, " +
    "weave it in as a lens that adds another layer of meaning, rather " +
    "than repeating its dictionary definition. If a zodiac sign is " +
    "given, note briefly how the dream might resonate with that sign's " +
    "nature. Keep a mystical but grounded tone. Respond in 3-5 short " +
    "paragraphs, plain text (no markdown headers, no bullet lists).";

  function buildUserPrompt(dreamText, card, zodiac) {
    let prompt = `Dream description:\n${dreamText.trim()}\n`;
    if (card) {
      const orientation = card.reversed ? "Reversed" : "Upright";
      prompt += `\nTarot card drawn for this dream: ${card.name} (${orientation}) — ${card.meaning}\n`;
    }
    if (zodiac) {
      prompt += `\nDreamer's zodiac sign: ${zodiac}\n`;
    }
    prompt += `\nPlease interpret this dream.`;
    return prompt;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  async function interpretDream(dreamText, card, zodiac) {
    const bodyEl = document.getElementById("readingBody");
    const box = document.getElementById("readingBox");
    box.classList.add("show");
    setTimeout(() => box.classList.add("revealed"), 30);

    const settings = loadAISettings();
    if (!settings.apiBase || !settings.model) {
      bodyEl.innerHTML = `<div class="reading-error">The AI server is not reachable right now.</div>`;
      return;
    }

    bodyEl.innerHTML = `<div class="reading-loading">🌙 Drifting into your dream...</div>`;

    const messages = [
      { role: "system", content: DEFAULT_SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(dreamText, card, zodiac) },
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
        const snippet = dreamText.trim().slice(0, 60) + (dreamText.trim().length > 60 ? "…" : "");
        const details = [];
        if (card) {
          const orientation = card.reversed ? "Reversed" : "Upright";
          details.push({ text: `Tarot card: ${card.name} (${orientation})` });
        }
        if (zodiac) details.push({ text: `Zodiac sign: ${zodiac}` });
        const historyId = ReadingHistory.record("Dream: " + snippet, details, "Dream Interpreter");
        ReadingHistory.updateAI(historyId, text);
      }
    } catch (e) {
      bodyEl.innerHTML = `<div class="reading-error">Couldn't reach the AI (${escapeHtml(
        e.message
      )}). Make sure the Ollama server is running and reachable, then hit Reinterpret.</div>`;
    }
  }

  window.DreamMystic = {
    ZODIAC_SIGNS,
    drawRandomCard,
    interpretDream,
  };
})();
