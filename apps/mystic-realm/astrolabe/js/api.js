/* ============================================================
   API — AI-woven readings, wired to the shared Mystic Realm AI
   ------------------------------------------------------------
   Connection (server URL / model / key) comes from the shared
   ../mystic-ai-config.js, loaded before this file — same pattern
   as astragalomancy.js, iching-ai.js, eightball-ai.js, and the
   tarot app's ai-settings.js. Nothing here is user-configurable;
   the offline "Compose" readings still work with no AI at all.
   ============================================================ */
(function (g) {
  'use strict';

  /* AI connection comes from the shared ../mystic-ai-config.js. The
     values below are only a fallback in case that file failed to load. */
  const FALLBACK_CONFIG = { apiBase: 'https://ollama.myguyinthechair.com/v1', model: 'dolphin3:latest', apiKey: '' };
  const AI_CONFIG = g.MysticAIConfig || FALLBACK_CONFIG;
  const HARDWIRED_API_BASE = AI_CONFIG.apiBase;
  const HARDWIRED_MODEL = AI_CONFIG.model;
  const HARDWIRED_API_KEY = AI_CONFIG.apiKey;

  function getSettings() { return { apiBase: HARDWIRED_API_BASE, apiKey: HARDWIRED_API_KEY, model: HARDWIRED_MODEL }; }
  function hasKey() { return !!(HARDWIRED_API_BASE && HARDWIRED_MODEL); }
  function currentModel() { return HARDWIRED_MODEL; }
  function providerLabel() { return 'the Mystic Realm AI'; }

  // ---------------- prompt construction ----------------
  const STYLE_VOICE = {
    hellenistic: `Work as a Hellenistic astrologer in the tradition of Vettius Valens and Dorotheus: whole-sign houses, the seven traditional planets as primary agents, sect (day/night) as a first sorting principle, essential dignity as planetary condition, benefics and malefics, the Lots of Fortune and Spirit, and concrete life-topics rather than psychology. You may note where modern outer planets stand, but treat them as background weather. Speak of what planets *do* and *signify*, not what someone "is like inside."`,
    modern: `Work as a skilled modern psychological astrologer: planets as inner drives and archetypes, signs as styles of expression, houses as arenas of life, aspects as inner dialogues. Use the full ten planets plus the nodes. Growth-oriented, non-deterministic language — the chart describes weather and terrain, not fate.`,
    blended: `Blend Hellenistic technique with modern insight: use sect, dignity, whole-sign topics and the lots to judge planetary *condition and concrete topic*, then translate what that means psychologically in modern language. Let the two traditions check each other, and say when they disagree.`,
  };

  /* Character voice/prompt text lives in the shared
     ../mystic-persona-prompts.js (loaded before this file). */
  const FALLBACK_VOICES = {
    amelia: 'Warm, nurturing, and deeply intuitive.',
    gwendolyn: 'Mysterious, elegant, and deeply spiritual.',
    anja: 'Direct, sharp, and perceptive, with a darker enigmatic edge.',
    elizabeth: 'Playful, unconventional, blunt, and unpredictable.',
  };
  const VOICES = g.MysticPersonaPrompts || FALLBACK_VOICES;

  function personaVoiceNote() {
    try {
      const key = g.MysticAppTheme && g.MysticAppTheme.getKey ? g.MysticAppTheme.getKey() : '';
      const persona = g.MysticAppTheme && g.MysticAppTheme.getPersona ? g.MysticAppTheme.getPersona() : null;
      const voice = key && VOICES[key] ? VOICES[key] : (FALLBACK_VOICES[key] || '');
      if (!persona || !voice) return '';
      return `\n\nNarrator: you are speaking as ${persona.name}, one of the resident Mystic Realm fortune-tellers. Personality: ${voice} Let this personality color your word choice and asides, but never at the expense of the astrological rigor above — the technique and the data still rule what you say, this only shapes how you say it.`;
    } catch (e) { return ''; }
  }

  function buildSystem(style) {
    return `You are the resident astrologer inside "Astrolabe", a chart application. The user sees a chart wheel; you receive the exact computed chart data.

${STYLE_VOICE[style] || STYLE_VOICE.blended}${personaVoiceNote()}

Rules:
- Ground EVERY claim in the data provided. Cite the placement you are reading (e.g. "with Mars in Cancer in the 10th…"). Never invent positions, aspects, or dates not present in the data.
- Weigh what is genuinely loudest in this chart (angular planets, tight aspects, dignified/debilitated planets, sect) rather than walking mechanically through every placement.
- Be specific and vivid, never generic horoscope-column filler. It should feel like this exact chart, not any chart.
- Warm, literate, direct voice. No bullet-point spam; write flowing prose in short sections.
- Format in Markdown: "## " section headings, occasional **bold** for placements. 400-800 words unless asked otherwise.
- Astrology here is a reflective, symbolic language. Do not make medical, legal, or financial predictions; never predict death, disaster, or diagnosis. If the data invites that, reframe toward reflection and agency.`;
  }

  // people saved without a birth time: the chart is a noon stand-in
  const tkNote = person => person && person.timeKnown === false
    ? `\nNOTE: ${person.name}'s birth time is unknown — their chart is cast for noon. Do not use the Ascendant, houses, sect, or lots for them; treat the Moon's degree as approximate (it may even change sign across the day) and briefly say so.`
    : '';

  function buildPrompt(kind, ctx) {
    const I = g.Interpret;
    let p = '';
    if (kind === 'natal') {
      p = `Write a natal chart reading${ctx.person ? ` for ${ctx.person.name}` : ''}.${tkNote(ctx.person)}\n\n${I.chartToText(ctx.chart, 'Natal chart')}\n\nAspects:\n${I.aspectsToText(ctx.aspects)}${ctx.patterns && ctx.patterns.length ? `\n\nPatterns: ${ctx.patterns.map(x => `${x.name} (${x.members.join(', ')})`).join('; ')}` : ''}`;
    } else if (kind === 'sky') {
      p = `Write a reading of the sky at this moment — a "world weather" reading of the current astrology, addressed to anyone alive under this sky. Emphasize the Moon's condition, the day's applying aspects, anything stationing or newly retrograde, and the slow outer-planet weather.\n\n${I.chartToText(ctx.chart, 'The sky now')}\n\nAspects:\n${I.aspectsToText(ctx.aspects)}`;
    } else if (kind === 'synastry') {
      const la = ctx.personA ? ctx.personA.name : 'Person A', lb = ctx.personB ? ctx.personB.name : 'Person B';
      p = `Write a synastry (relationship) reading for ${la} and ${lb}. Consider each person's own chart briefly, then the contacts between them. Be honest about frictions as well as gifts; frictions are workable material, not verdicts.${tkNote(ctx.personA)}${tkNote(ctx.personB)}\n\n${I.chartToText(ctx.chart, `${la}'s chart`)}\n\n${I.chartToText(ctx.chartB, `${lb}'s chart`)}\n\nCross-aspects (${la}'s planet → ${lb}'s planet):\n${I.aspectsToText(ctx.crossAspects, [la, lb])}`;
    } else if (kind === 'transits') {
      const la = ctx.person ? ctx.person.name : 'the native';
      p = `Write a transit reading for ${la}: how the current sky is activating the natal chart. Focus on the tightest transit-to-natal contacts, slow transits (Jupiter outward), and what houses of the natal chart are being lit up.${tkNote(ctx.person)}\n\n${I.chartToText(ctx.chart, `${la}'s natal chart`)}\n\n${I.chartToText(ctx.chartB, 'The sky now (transits)')}\n\nContacts (natal planet first, transiting planet second):\n${I.aspectsToText(ctx.crossAspects, ['natal', 'transiting'])}`;
    } else if (kind === 'period') {
      if (ctx.person) {
        p = `Write a personal astrological forecast for ${ctx.person.name} covering ${ctx.from.toDateString()} through ${ctx.to.toDateString()}. The events marked "natal" are transiting planets perfecting aspects to ${ctx.person.name}'s birth chart — these are the spine of the forecast; read them against the natal placements they touch (house, dignity, natal aspects). Use the general sky events (ingresses, stations, lunations) as backdrop. Weave everything into a narrative arc — what opens, peaks, and closes — citing dates for the turning points, rather than a date-by-date list.${tkNote(ctx.person)}\n\n${I.chartToText(ctx.chart, `${ctx.person.name}'s natal chart`)}\n\nEvents in this window:\n${I.eventsToText(ctx.events)}`;
      } else {
        p = `Write an "astrological weather forecast" for the period ${ctx.from.toDateString()} through ${ctx.to.toDateString()}. Weave the listed events into a narrative arc of the period — what themes open, peak, and close — rather than a date-by-date list. Mention specific dates for the most important moments.\n\nEvents in this window:\n${I.eventsToText(ctx.events)}\n\nSky at the period's start:\n${I.chartToText(ctx.chart, 'Start of period')}`;
      }
    }
    return p;
  }

  // ---------------- data-only context block for chart Q&A ----------------
  function contextText(kind, ctx) {
    const I = g.Interpret;
    if (kind === 'natal')
      return `${I.chartToText(ctx.chart, `Natal chart${ctx.person ? ` of ${ctx.person.name}` : ''}`)}\n\nAspects:\n${I.aspectsToText(ctx.aspects)}${ctx.patterns && ctx.patterns.length ? `\nPatterns: ${ctx.patterns.map(x => `${x.name} (${x.members.join(', ')})`).join('; ')}` : ''}${tkNote(ctx.person)}`;
    if (kind === 'sky')
      return `${I.chartToText(ctx.chart, 'The sky at the chosen moment')}\n\nAspects:\n${I.aspectsToText(ctx.aspects)}`;
    if (kind === 'transits')
      return `${I.chartToText(ctx.chart, `${ctx.person ? ctx.person.name + '’s' : 'The'} natal chart`)}\n\n${I.chartToText(ctx.chartB, 'The sky at the chosen moment (transits)')}\n\nContacts (natal planet first, transiting second):\n${I.aspectsToText(ctx.crossAspects, ['natal', 'transiting'])}${tkNote(ctx.person)}`;
    if (kind === 'synastry')
      return `${I.chartToText(ctx.chart, `${ctx.personA.name}'s chart`)}\n\n${I.chartToText(ctx.chartB, `${ctx.personB.name}'s chart`)}\n\nCross-aspects (${ctx.personA.name}'s planet first, ${ctx.personB.name}'s second):\n${I.aspectsToText(ctx.crossAspects, [ctx.personA.name, ctx.personB.name])}${tkNote(ctx.personA)}${tkNote(ctx.personB)}`;
    if (kind === 'period')
      return `Period: ${ctx.from.toDateString()} — ${ctx.to.toDateString()}${ctx.person ? ` (personal context for ${ctx.person.name}; events marked "natal" touch their birth chart)` : ''}\n\n${I.chartToText(ctx.chart, ctx.person ? `${ctx.person.name}'s natal chart` : 'Sky at the period start')}\n\nEvents in the window:\n${I.eventsToText(ctx.events)}${tkNote(ctx.person)}`;
    return '';
  }

  // ---------------- markdown-lite renderer for the reading pane ----------------
  function mdToHtml(md) {
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const lines = esc(md).split('\n');
    let html = '', inList = false;
    for (const line of lines) {
      const t = line.trim();
      const fmt = s => s
        .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>');
      if (t.startsWith('### ')) { if (inList) { html += '</ul>'; inList = false; } html += `<h3>${fmt(t.slice(4))}</h3>`; }
      else if (t.startsWith('## ')) { if (inList) { html += '</ul>'; inList = false; } html += `<h3>${fmt(t.slice(3))}</h3>`; }
      else if (t.startsWith('# ')) { if (inList) { html += '</ul>'; inList = false; } html += `<h3>${fmt(t.slice(2))}</h3>`; }
      else if (t.startsWith('- ') || t.startsWith('* ')) { if (!inList) { html += '<ul>'; inList = true; } html += `<li>${fmt(t.slice(2))}</li>`; }
      else if (t === '') { if (inList) { html += '</ul>'; inList = false; } }
      else { if (inList) { html += '</ul>'; inList = false; } html += `<p>${fmt(t)}</p>`; }
    }
    if (inList) html += '</ul>';
    return html;
  }

  // ---------------- streaming core ----------------
  // Talks to the hardwired OpenAI-compatible server (Ollama by default) via
  // its /chat/completions endpoint, same wire format as the rest of the app.
  async function readSSE(res, onData) {
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (line.startsWith('data:')) {
          const payload = line.slice(5).trim();
          if (payload) onData(payload);
        }
      }
    }
  }

  async function streamCompletion({ system, messages, onDelta, onDone, onError }) {
    const s = getSettings();
    if (!s.apiBase || !s.model) { onError('The AI server is not reachable right now.'); return; }
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (s.apiKey) headers.Authorization = 'Bearer ' + s.apiKey;

    try {
      const res = await fetch(s.apiBase + '/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: s.model,
          stream: true,
          temperature: 0.85,
          max_tokens: 4000,
          messages: [{ role: 'system', content: system }].concat(messages),
        }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        onError('Request failed (HTTP ' + res.status + (t ? ': ' + t.slice(0, 160) : '') + ')');
        return;
      }
      // Some OpenAI-compatible servers ignore `stream` and return one JSON
      // object instead of an event-stream; handle both.
      const ctype = res.headers.get('content-type') || '';
      let full = '';
      if (ctype.includes('text/event-stream')) {
        await readSSE(res, data => {
          if (data === '[DONE]') return;
          let j; try { j = JSON.parse(data); } catch { return; }
          const ch = j.choices && j.choices[0];
          if (!ch) return;
          const delta = (ch.delta && ch.delta.content) || '';
          if (delta) { full += delta; onDelta(full); }
        });
      } else {
        const data = await res.json();
        full = data?.choices?.[0]?.message?.content || '';
        full = full.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<think>[\s\S]*$/gi, '').trim();
        onDelta(full);
      }
      onDone(full);
    } catch (err) {
      onError('Couldn\'t reach the AI (' + (err && err.message ? err.message : err) + '). Make sure the AI server is running and reachable.');
    }
  }

  /**
   * streamReading({kind, style, ctx, onDelta(fullText), onDone(fullText), onError(msg)})
   */
  function streamReading(opts) {
    return streamCompletion({
      system: buildSystem(opts.style),
      messages: [{ role: 'user', content: buildPrompt(opts.kind, opts.ctx) }],
      onDelta: opts.onDelta, onDone: opts.onDone, onError: opts.onError,
    });
  }

  /**
   * streamAsk({question, history: [{q,a}], ctxText, style, onDelta, onDone, onError})
   * ctxText: the chart-context block the conversation is pinned to (from contextText()).
   */
  function streamAsk(opts) {
    const system = buildSystem(opts.style) + `

You are now answering direct questions about the chart context supplied in the first message. Answer the question actually asked — directly and concretely, grounded strictly in that data, citing the placements you are reading (usually 120–350 words unless the question needs more). If the chart context genuinely cannot address the question, say so and name what could (a birth time, a different reading type, a longer period). Never predict death, diagnosis, disaster, or guaranteed outcomes; where a question reaches for certainty, read the pressures and openings the chart actually shows and hand the agency back to the asker.`;
    const messages = [];
    const h = opts.history || [];
    if (h.length) {
      messages.push({ role: 'user', content: `Chart context:\n${opts.ctxText}\n\nQuestion: ${h[0].q}` });
      messages.push({ role: 'assistant', content: h[0].a });
      for (let i = 1; i < h.length; i++) {
        messages.push({ role: 'user', content: h[i].q });
        messages.push({ role: 'assistant', content: h[i].a });
      }
      messages.push({ role: 'user', content: opts.question });
    } else {
      messages.push({ role: 'user', content: `Chart context:\n${opts.ctxText}\n\nQuestion: ${opts.question}` });
    }
    return streamCompletion({ system, messages, onDelta: opts.onDelta, onDone: opts.onDone, onError: opts.onError });
  }

  g.Api = { getSettings, hasKey, currentModel, providerLabel, streamReading, streamAsk, contextText, mdToHtml };
})(typeof window !== 'undefined' ? window : globalThis);
