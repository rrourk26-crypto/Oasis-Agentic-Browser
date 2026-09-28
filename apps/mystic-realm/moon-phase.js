/* ============================================================
   Moon phase — simple reusable synodic-month approximation.
   Good enough for a "what's the Moon doing right now" widget;
   Astrolabe's own engine.js does the precise ephemeris version
   for chart work.
   ============================================================ */
(function (g) {
  'use strict';

  const SYNODIC_MONTH = 29.530588861; // days
  // A known new moon: 2000-01-06 18:14 UTC
  const KNOWN_NEW_MOON_UTC = Date.UTC(2000, 0, 6, 18, 14, 0);

  const PHASES = [
    { name: 'New Moon', emoji: '🌑' },
    { name: 'Waxing Crescent', emoji: '🌒' },
    { name: 'First Quarter', emoji: '🌓' },
    { name: 'Waxing Gibbous', emoji: '🌔' },
    { name: 'Full Moon', emoji: '🌕' },
    { name: 'Waning Gibbous', emoji: '🌖' },
    { name: 'Last Quarter', emoji: '🌗' },
    { name: 'Waning Crescent', emoji: '🌘' },
  ];

  /** getMoonPhase(date?) -> {name, emoji, age, illumination, cyclePercent} */
  function getMoonPhase(date) {
    const d = date instanceof Date ? date : new Date();
    const daysSince = (d.getTime() - KNOWN_NEW_MOON_UTC) / 86400000;
    let age = daysSince % SYNODIC_MONTH;
    if (age < 0) age += SYNODIC_MONTH;
    const cyclePercent = age / SYNODIC_MONTH; // 0..1, 0 = new, 0.5 = full
    const illumination = (1 - Math.cos(2 * Math.PI * cyclePercent)) / 2; // 0..1
    const idx = Math.floor(((age + SYNODIC_MONTH / 16) % SYNODIC_MONTH) / (SYNODIC_MONTH / 8)) % 8;
    const phase = PHASES[idx];
    return {
      name: phase.name,
      emoji: phase.emoji,
      age,
      illumination,
      illuminationPct: Math.round(illumination * 100),
      cyclePercent,
      waxing: cyclePercent < 0.5,
    };
  }

  g.MysticMoonPhase = { getMoonPhase };
})(typeof window !== 'undefined' ? window : globalThis);
