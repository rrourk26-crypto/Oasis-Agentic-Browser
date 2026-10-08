/* ===========================================================
   LM Studio Chat — voice add-on
   Dictation (mic), read-aloud (TTS) and hands-free live chat.
   Runs independently and only watches the page, so the core
   app is unaffected if this file is removed.
   =========================================================== */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const synth = window.speechSynthesis;
  const hasTTS = !!(synth && window.SpeechSynthesisUtterance);
  const LANG = navigator.language || "en-US";
  const SILENCE_MS = 1500;   // live chat: how long you pause before your message is sent

  const input = $("input"), sendBtn = $("send"), msgs = $("messages");
  const speakBtn = $("speakBtn"), micBtn = $("micBtn"), liveBtn = $("liveBtn");
  const bar = $("liveBar"), orb = $("liveOrb"), liveStateEl = $("liveState"), liveHintEl = $("liveHint"), liveEnd = $("liveEnd");
  const toastEl = $("voiceToast");
  if (!input || !sendBtn || !msgs || !speakBtn || !micBtn || !liveBtn || !bar) return;   // page structure changed: do nothing

  /* ---------- Saved voice settings (own key, separate from chat settings) ---------- */
  const KEY = "lmchat.voice";
  const cfg = { voice: "", rate: 1, auto: false };
  try { Object.assign(cfg, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {}
  cfg.rate = Number(cfg.rate) || 1;
  function saveCfg() { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {} }

  const ICON = {
    on: '<svg viewBox="0 0 24 24"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
    off: '<svg viewBox="0 0 24 24"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>'
  };

  let toastTimer = 0;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove("show"), 5000);
  }
  function streaming() { return sendBtn.classList.contains("stop"); }
  function setInput(v) { input.value = v; input.dispatchEvent(new Event("input", { bubbles: true })); }
  function recError(code) {
    switch (code) {
      case "not-allowed": case "service-not-allowed": return "Microphone access is blocked. Allow it in the address bar (the page must be on https or localhost).";
      case "audio-capture": return "No microphone was found.";
      case "network": return "Speech recognition couldn't reach its online service. Check your connection.";
      case "language-not-supported": return "This browser can't recognise speech in your language.";
      default: return "";
    }
  }

  /* ================================================================
     Read aloud (text to speech)
     ================================================================ */
  let ttsGen = 0;          // bumps on every cancel so late callbacks from old speech are ignored
  let pending = 0;         // utterances queued and not finished
  let session = null;      // the reply currently being read while it streams in
  let manualBtn = null;    // the "Listen" button currently reading
  let unlocked = false;
  const keep = new Set();  // keeps utterances referenced (some browsers drop them mid-speech otherwise)

  function unlockTTS() {   // some mobile browsers only allow speech that was started once from a tap
    if (unlocked || !hasTTS) return;
    unlocked = true;
    try { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; synth.speak(u); } catch (e) {}
  }

  function plain(el) {     // readable text of a rendered message: no code blocks, links, markdown marks or emoji
    let out = "";
    (function walk(n) {
      if (n.nodeType === 3) { out += n.nodeValue; return; }
      if (n.nodeType !== 1) return;
      const t = n.tagName;
      if (t === "PRE") { out += "\n"; return; }
      if (t === "BR") { out += "\n"; return; }
      if (n.classList.contains("thinking")) return;
      const block = t === "P" || t === "LI" || t === "UL" || t === "OL" || /^H[1-6]$/.test(t);
      if (block) out += "\n";
      for (const c of n.childNodes) walk(c);
      if (block) out += "\n";
    })(el);
    return out
      .replace(/<think>[\s\S]*?(<\/think>|$)/gi, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/[*`]+/g, "")
      .replace(/^[ \t]*#{1,6}[ \t]+/gm, "")
      .replace(/\p{Extended_Pictographic}/gu, "")
      .replace(/[ \t]+/g, " ")
      .replace(/ ?\n ?/g, "\n")
      .replace(/\n{2,}/g, "\n");
  }

  const NOT_END = /\s(?:mr|mrs|ms|dr|prof|st|vs|no|e\.g|i\.e|\d{1,2})$/i;
  function safeEnd(t) {    // index just after the last finished sentence or line
    let end = 0, m;
    const re = /[.!?…]+["'”’)\]]*(?=\s)|\n/g;
    while ((m = re.exec(t))) {
      if (m[0] !== "\n" && NOT_END.test(" " + t.slice(Math.max(0, m.index - 8), m.index))) continue;
      end = m.index + m[0].length;
    }
    return end;
  }

  function pieces(text) {  // split into chunks short enough for every browser to speak reliably
    const out = [];
    text.split(/\n+/).forEach((line) => {
      line = line.trim();
      if (!/[\p{L}\p{N}]/u.test(line)) return;
      if (line.length <= 220) { out.push(line); return; }
      let buf = "";
      (line.match(/[^.!?…]+[.!?…]*["'”’)\]]*\s*/g) || [line]).forEach((s) => {
        if (buf && (buf + s).length > 220) { out.push(buf.trim()); buf = ""; }
        buf += s;
        while (buf.length > 260) {
          let i = buf.lastIndexOf(" ", 240); if (i < 60) i = 240;
          out.push(buf.slice(0, i).trim()); buf = buf.slice(i);
        }
      });
      if (buf.trim()) out.push(buf.trim());
    });
    return out;
  }

  function pickVoice() {
    if (!cfg.voice) return null;
    return synth.getVoices().find((v) => v.voiceURI === cfg.voice) || null;
  }

  function enqueue(text) {
    const g = ttsGen;
    const list = pieces(text);
    const alt = window.LMChatTTS && window.LMChatTTS.active();   // neural voice engine picked in Settings (tts-engines.js)
    if (alt) {
      list.forEach((p) => {
        pending++;
        alt.speak(p, {
          rate: cfg.rate,
          start: () => { if (g === ttsGen && liveOn) setLive("speaking", "Tap the orb to interrupt"); },
          error: toast,
          end: () => { if (g !== ttsGen) return; pending = Math.max(0, pending - 1); checkDrained(); }
        });
      });
      return;
    }
    list.forEach((p) => {
      const u = new SpeechSynthesisUtterance(p);
      const v = pickVoice();
      if (v) { u.voice = v; u.lang = v.lang; }
      u.rate = cfg.rate;
      pending++; keep.add(u);
      u.onstart = () => { if (g === ttsGen && liveOn) setLive("speaking", "Tap the orb to interrupt"); };
      const fin = () => { keep.delete(u); if (g !== ttsGen) return; pending = Math.max(0, pending - 1); checkDrained(); };
      u.onend = fin; u.onerror = fin;
      synth.speak(u);
    });
    if (list.length) {     // safety net: if the browser never starts speaking, don't leave live chat waiting forever
      setTimeout(() => {
        if (g === ttsGen && pending > 0 && !synth.speaking && !synth.pending) { pending = 0; checkDrained(); }
      }, 6000);
    }
  }

  function cancelSpeech() {
    ttsGen++; pending = 0;
    if (window.LMChatTTS) window.LMChatTTS.cancel();
    if (hasTTS) { try { synth.cancel(); } catch (e) {} }
    if (manualBtn) { manualBtn.textContent = "Listen"; manualBtn = null; }
  }

  function dropSession() { if (session) { session.mo.disconnect(); session = null; } }

  function checkDrained() {
    if (pending > 0) return;
    if (manualBtn) { manualBtn.textContent = "Listen"; manualBtn = null; return; }
    if (session && session.ended) {
      dropSession();
      if (liveOn) setTimeout(listen, 350);
    }
  }

  function pump() {        // speak whatever sentences of the streaming reply are finished
    const s = session; if (!s) return;
    const t = plain(s.body).replace(/\s+$/, "");
    if (s.spoken > t.length) s.spoken = t.length;
    const end = s.ended ? t.length : safeEnd(t);
    if (end > s.spoken) { const chunk = t.slice(s.spoken, end); s.spoken = end; enqueue(chunk); }
  }

  /* Watch the send button: it switches to "stop" while a reply streams and back when it is done. */
  let wasStreaming = false, lastBody = null, userStopped = false;
  new MutationObserver(() => {
    const now = streaming();
    if (now === wasStreaming) return;
    wasStreaming = now;
    now ? onStreamStart() : onStreamEnd();
  }).observe(sendBtn, { attributes: true, attributeFilter: ["class"] });

  sendBtn.addEventListener("click", () => {
    if (streaming()) { userStopped = true; cancelSpeech(); dropSession(); }
    if (dictating) stopDictation(true);
  }, true);
  document.addEventListener("lmchat:stopped", () => { userStopped = true; cancelSpeech(); dropSession(); });

  function onStreamStart() {
    cancelSpeech(); dropSession(); userStopped = false;
    if (liveOn) stopLiveRec();
    const bodies = msgs.querySelectorAll(".msg.assistant .body");
    lastBody = bodies[bodies.length - 1] || null;
    if (!lastBody || !hasTTS || !(cfg.auto || liveOn)) return;
    session = { body: lastBody, spoken: 0, ended: false, mo: new MutationObserver(pump) };
    session.mo.observe(lastBody, { childList: true, characterData: true, subtree: true });
    if (liveOn) setLive("thinking");
  }

  function onStreamEnd() {
    const body = lastBody; lastBody = null;
    const err = !!body && body.classList.contains("err");
    const txt = body ? (body.textContent || "").trim() : "";
    const skip = userStopped || err || txt === "(Stopped.)" || txt === "(The model returned an empty reply.)";
    if (skip) {
      dropSession(); cancelSpeech(); userStopped = false;
      if (liveOn) { err ? endLive("Live chat stopped: couldn't reach LM Studio.") : listen(); }
      return;
    }
    if (session) { session.ended = true; pump(); checkDrained(); }
    else if (liveOn) listen();
  }

  /* ---------- "Listen" button on each reply ---------- */
  function decorate(wrap) {
    if (!hasTTS || !wrap.classList || !wrap.classList.contains("assistant")) return;
    const act = wrap.querySelector(".actions");
    if (!act || act.querySelector(".listen")) return;
    const b = document.createElement("button");
    b.type = "button"; b.className = "listen"; b.textContent = "Listen";
    b.onclick = () => toggleListen(b, wrap);
    act.appendChild(b);
  }
  function toggleListen(btn, wrap) {
    if (liveOn) { toast("Live chat is reading replies right now."); return; }
    if (manualBtn === btn) { cancelSpeech(); return; }
    cancelSpeech(); dropSession(); unlockTTS();
    const text = plain(wrap.querySelector(".body")).trim();
    if (!/[\p{L}\p{N}]/u.test(text)) { toast("There's nothing here to read aloud."); return; }
    manualBtn = btn; btn.textContent = "Stop";
    setTimeout(() => { if (manualBtn === btn) enqueue(text); }, 70);
  }
  new MutationObserver((recs) => {
    recs.forEach((r) => r.addedNodes.forEach((n) => { if (n.nodeType === 1) decorate(n); }));
  }).observe(msgs, { childList: true });
  msgs.querySelectorAll(".msg.assistant").forEach(decorate);

  /* ---------- Auto-read toggle ---------- */
  function setAuto(on, init) {
    cfg.auto = !!on; saveCfg();
    speakBtn.classList.toggle("on", cfg.auto);
    speakBtn.setAttribute("aria-pressed", String(cfg.auto));
    speakBtn.title = cfg.auto ? "Reading replies aloud (click to turn off)" : "Read replies aloud";
    speakBtn.innerHTML = cfg.auto ? ICON.on : ICON.off;
    $("setAuto").checked = cfg.auto;
    if (init) return;
    if (cfg.auto) unlockTTS();
    else if (!liveOn && session) { cancelSpeech(); dropSession(); }
  }
  speakBtn.onclick = () => {
    if (!hasTTS) { toast("This browser can't read text aloud."); return; }
    setAuto(!cfg.auto);
  };

  /* ---------- Voice settings (in the Settings dialog) ---------- */
  function fillVoices() {
    if (!hasTTS) return;
    const vs = synth.getVoices(); if (!vs.length) return;
    const sel = $("setVoice");
    const lang = LANG.slice(0, 2).toLowerCase();
    const first = (v) => (v.lang || "").toLowerCase().startsWith(lang) ? 0 : 1;
    sel.innerHTML = "";
    const d = document.createElement("option"); d.value = ""; d.textContent = "System default"; sel.appendChild(d);
    vs.slice().sort((a, b) => first(a) - first(b) || a.name.localeCompare(b.name)).forEach((v) => {
      const o = document.createElement("option");
      o.value = v.voiceURI; o.textContent = v.name + " (" + v.lang + ")" + (v.localService ? "" : " · online");
      sel.appendChild(o);
    });
    sel.value = vs.some((v) => v.voiceURI === cfg.voice) ? cfg.voice : "";
  }
  $("setVoice").onchange = (e) => { cfg.voice = e.target.value; saveCfg(); };
  $("setRate").oninput = (e) => { cfg.rate = parseFloat(e.target.value) || 1; $("rateVal").textContent = cfg.rate.toFixed(2) + "×"; saveCfg(); };
  $("setAuto").onchange = (e) => setAuto(e.target.checked);
  $("voiceTest").onclick = () => {
    if (!hasTTS) { toast("This browser can't read text aloud."); return; }
    unlockTTS(); cancelSpeech();
    setTimeout(() => enqueue("Hi! This is how I sound when I read your replies aloud."), 80);
  };

  /* ================================================================
     Mic: dictate into the message box
     ================================================================ */
  let dictRec = null, dictating = false;
  function setDictating(on) {
    dictating = on;
    micBtn.classList.toggle("rec", on);
    micBtn.setAttribute("aria-pressed", String(on));
    micBtn.title = on ? "Stop dictation" : "Dictate a message";
  }
  function startDictation() {
    if (!SR) { toast("Voice input isn't supported in this browser. Try Chrome or Edge."); return; }
    if (liveOn) return;
    const r = new SR();
    r.lang = LANG; r.continuous = true; r.interimResults = true;
    const base = input.value.replace(/\s+$/, "");
    r.onresult = (e) => {
      if (r !== dictRec) return;
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setInput((base ? base + " " : "") + t.trim());
    };
    r.onerror = (e) => { const m = recError(e.error); if (m) toast(m); };
    r.onend = () => { if (r !== dictRec) return; dictRec = null; setDictating(false); input.focus(); };
    dictRec = r;
    try { r.start(); setDictating(true); } catch (e) { dictRec = null; }
  }
  function stopDictation(discard) {
    const r = dictRec; if (!r) return;
    if (discard) { dictRec = null; setDictating(false); try { r.abort(); } catch (e) {} }
    else { try { r.stop(); } catch (e) {} }
  }
  micBtn.onclick = () => (dictating ? stopDictation() : startDictation());
  input.addEventListener("input", (e) => { if (e.isTrusted && dictating) stopDictation(true); });   // typing takes over
  input.addEventListener("keydown", (e) => { if (dictating && e.key === "Enter" && !e.shiftKey) stopDictation(true); });

  /* ================================================================
     Live chat: listen, send, read the reply, listen again
     ================================================================ */
  let liveOn = false, liveState = "idle", liveRec = null, liveLatest = "", liveTimer = 0, liveFails = 0;

  function setLive(state, hint) {
    liveState = state;
    bar.dataset.state = state;
    liveStateEl.textContent = { listening: "Listening…", thinking: "Thinking…", speaking: "Speaking…" }[state] || "";
    if (hint !== undefined) liveHintEl.textContent = hint;
    orb.title = { listening: "Tap to send now", thinking: "Tap to stop", speaking: "Tap to interrupt" }[state] || "";
  }

  function startLive() {
    if (!SR) { toast("Live chat needs voice input, which this browser doesn't support. Try Chrome or Edge."); return; }
    if (!hasTTS) { toast("Live chat needs read-aloud, which this browser doesn't support."); return; }
    if (streaming()) { toast("Wait for the current reply to finish first."); return; }
    stopDictation(true); unlockTTS(); cancelSpeech(); dropSession();
    liveOn = true; liveFails = 0;
    bar.classList.add("on"); liveBtn.classList.add("on"); liveBtn.setAttribute("aria-pressed", "true");
    micBtn.disabled = true;
    listen();
  }

  function endLive(msg) {
    liveOn = false;
    stopLiveRec();
    cancelSpeech(); dropSession();
    bar.classList.remove("on"); liveBtn.classList.remove("on"); liveBtn.setAttribute("aria-pressed", "false");
    micBtn.disabled = false; liveState = "idle";
    if (msg) toast(msg);
  }

  function stopLiveRec() {
    clearTimeout(liveTimer);
    const r = liveRec; liveRec = null; liveLatest = "";
    if (r) { try { r.abort(); } catch (e) {} }
  }

  function listen() {
    if (!liveOn || liveRec) return;
    if (streaming() || pending > 0 || session) return;   // still busy with a reply: it will call listen() when done
    const r = new SR();
    r.lang = LANG; r.continuous = true; r.interimResults = true;
    let fatal = "";
    liveLatest = "";
    r.onresult = (e) => {
      if (r !== liveRec) return;
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      liveLatest = t.trim();
      if (liveLatest) {
        liveFails = 0; liveHintEl.textContent = liveLatest;
        clearTimeout(liveTimer); liveTimer = setTimeout(() => finishTurn(r), SILENCE_MS);
      }
    };
    r.onerror = (e) => { const m = recError(e.error); if (m) fatal = m; };
    r.onend = () => {
      if (r !== liveRec) return;
      liveRec = null; clearTimeout(liveTimer);
      if (fatal) { endLive(fatal); return; }
      turnEnded();
    };
    liveRec = r;
    setLive("listening", "Speak when you're ready. I'll reply when you pause.");
    try { r.start(); } catch (e) { liveRec = null; endLive("Couldn't start the microphone."); }
  }

  function finishTurn(r) {   // you stopped talking: close the mic and send what was heard
    if (r !== liveRec) return;
    try { r.stop(); } catch (e) {}
    setTimeout(() => { if (liveRec === r) { liveRec = null; try { r.abort(); } catch (e) {} turnEnded(); } }, 2000);
  }

  function turnEnded() {
    if (!liveOn) return;
    const text = liveLatest.trim(); liveLatest = "";
    if (text) { submitLive(text); return; }
    if (++liveFails > 6) { endLive("Live chat ended: no speech heard."); return; }
    setTimeout(listen, 300);
  }

  function submitLive(text) {
    if (streaming()) return;
    setLive("thinking", text);
    setInput(text);
    sendBtn.click();
    setTimeout(() => { if (liveOn && liveState === "thinking" && !streaming() && !session && !liveRec && pending === 0) listen(); }, 900);
  }

  function interrupt() {
    cancelSpeech(); dropSession();
    if (streaming()) { userStopped = true; sendBtn.click(); }   // stopping the reply also returns to listening
    else listen();
  }

  orb.onclick = () => {
    if (!liveOn) return;
    if (liveState === "listening") { if (liveLatest && liveRec) finishTurn(liveRec); }
    else if (liveState === "speaking") interrupt();
    else if (liveState === "thinking" && streaming()) sendBtn.click();
  };
  liveEnd.onclick = () => endLive();
  liveBtn.onclick = () => (liveOn ? endLive() : startLive());

  /* ---------- Init ---------- */
  if (!hasTTS) speakBtn.style.display = "none";
  if (!SR) { micBtn.style.opacity = ".5"; liveBtn.style.opacity = ".5"; micBtn.title = liveBtn.title = "Voice input isn't supported in this browser"; }
  $("setRate").value = cfg.rate; $("rateVal").textContent = cfg.rate.toFixed(2) + "×";
  setAuto(cfg.auto, true);
  fillVoices();
  if (hasTTS) { try { synth.addEventListener("voiceschanged", fillVoices); } catch (e) { synth.onvoiceschanged = fillVoices; } }
  window.addEventListener("pagehide", () => { try { synth && synth.cancel(); } catch (e) {} });
})();
