/* ============================================================
   Streaks — how many days in a row you've done SOMETHING across
   the Mystic Realm (any app that calls ReadingHistory.record()).
   Requires tarot/reading-history.js to be loaded first.
   ============================================================ */
(function (g) {
  'use strict';

  function dayKey(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

  /** compute() -> {current, longest, activeToday, activeYesterday, totalDays} */
  function compute() {
    if (!g.ReadingHistory || typeof g.ReadingHistory.activeDates !== 'function') {
      return { current: 0, longest: 0, activeToday: false, activeYesterday: false, totalDays: 0 };
    }
    const days = g.ReadingHistory.activeDates(); // Set of "Y-M-D" strings
    const totalDays = days.size;
    if (!totalDays) return { current: 0, longest: 0, activeToday: false, activeYesterday: false, totalDays: 0 };

    const today = new Date();
    const activeToday = days.has(dayKey(today));
    const activeYesterday = days.has(dayKey(addDays(today, -1)));

    // Current streak: walk backwards from today (or yesterday, if today has
    // no entry yet) counting consecutive active days.
    let current = 0;
    let cursor = activeToday ? today : (activeYesterday ? addDays(today, -1) : null);
    if (cursor) {
      while (days.has(dayKey(cursor))) {
        current++;
        cursor = addDays(cursor, -1);
      }
    }

    // Longest streak ever: sort all active days, count consecutive runs.
    const sorted = Array.from(days).map((k) => {
      const [y, m, d] = k.split('-').map(Number);
      return new Date(y, m - 1, d).getTime();
    }).sort((a, b) => a - b);
    let longest = 1, run = 1;
    for (let i = 1; i < sorted.length; i++) {
      const diffDays = Math.round((sorted[i] - sorted[i - 1]) / 86400000);
      if (diffDays === 1) { run++; } else { run = 1; }
      if (run > longest) longest = run;
    }
    if (!sorted.length) longest = 0;

    return { current, longest: Math.max(longest, current), activeToday, activeYesterday, totalDays };
  }

  g.MysticStreaks = { compute };
})(typeof window !== 'undefined' ? window : globalThis);
