/* ============================================================
   MYSTIC TAROT — MYSTIC PERSONA THEME
   Choose the mystic first. The choice becomes the visual theme,
   card back, and AI reader persona for the rest of the app.
============================================================ */
(function(){
  'use strict';

  const STORAGE_KEY = 'mysticTarot_personaTheme';

  /* Character voice/prompt text lives in the shared
     mystic-persona-prompts.js (loaded before this file). Falls back
     to this copy if that file didn't load for some reason. */
  const FALLBACK_VOICES = {
    amelia: 'Warm, nurturing, and deeply intuitive. Speak gently, with genuine compassion, favoring reassurance and emotional insight over drama. Use mystical imagery sparingly and make the reading feel personal and reassuring.',
    gwendolyn: 'Mysterious, elegant, and deeply spiritual. Speak in measured, almost poetic language, treating the reading as a quiet ritual. Favor moonlight, intuition, symbolism, and the unseen without claiming supernatural certainty.',
    anja: 'Direct, sharp, and perceptive, with a darker enigmatic edge. State impressions plainly and let the querent consider them. Keep the tone controlled, intelligent, and slightly shadowed rather than sweet.',
    elizabeth: 'Playful, unconventional, blunt, and unpredictable. Use wit and light teasing when appropriate, while keeping the reading thoughtful. The delivery should feel lively and surprising rather than solemn.'
  };
  const VOICES = window.MysticPersonaPrompts || FALLBACK_VOICES;

  const PERSONAS = {
    amelia: {
      name: 'Amelia', emoji: '🔮', back: '../selene/characters/back-amelia.jpg', front: '../selene/characters/front-amelia.png',
      trait: 'Warm, compassionate, intuitive',
      voice: VOICES.amelia || FALLBACK_VOICES.amelia,
      colors: { accent:'#d8a7ff', accent2:'#6d3f9e', glow:'rgba(216,167,255,.30)', bg1:'rgba(58,24,72,.88)', bg2:'rgba(116,57,132,.78)' }
    },
    gwendolyn: {
      name: 'Gwenny', emoji: '🌙', back: '../selene/characters/back-gwendolyn.jpg', front: '../selene/characters/front-gwendolyn.png',
      trait: 'Mysterious, elegant, deeply spiritual',
      voice: VOICES.gwendolyn || FALLBACK_VOICES.gwendolyn,
      colors: { accent:'#bba7ff', accent2:'#4b3c91', glow:'rgba(187,167,255,.30)', bg1:'rgba(28,24,72,.90)', bg2:'rgba(65,55,130,.78)' }
    },
    anja: {
      name: 'Anja', emoji: '🕯️', back: '../selene/characters/back-anja.jpg', front: '../selene/characters/front-anja.png',
      trait: 'Direct, perceptive, darker and enigmatic',
      voice: VOICES.anja || FALLBACK_VOICES.anja,
      colors: { accent:'#e8a0b7', accent2:'#7a243f', glow:'rgba(232,160,183,.28)', bg1:'rgba(50,10,28,.90)', bg2:'rgba(122,36,63,.78)' }
    },
    elizabeth: {
      name: 'Eliza', emoji: '🃏', back: '../selene/characters/back-elizabeth.jpg', front: '../selene/characters/front-elizabeth.png',
      trait: 'Playful, unconventional, unpredictable',
      voice: VOICES.elizabeth || FALLBACK_VOICES.elizabeth,
      colors: { accent:'#ffd36e', accent2:'#8b5b1f', glow:'rgba(255,211,110,.30)', bg1:'rgba(54,34,12,.90)', bg2:'rgba(139,91,31,.78)' }
    }
  };

  function getPersona(){
    try { return PERSONAS[localStorage.getItem(STORAGE_KEY)] || null; } catch(e){ return null; }
  }

  function getPersonaKey(){
    try { return localStorage.getItem(STORAGE_KEY) || ''; } catch(e){ return ''; }
  }

  function applyTheme(persona){
    if(!persona) return;
    const root = document.documentElement;
    root.style.setProperty('--mystic-accent', persona.colors.accent);
    root.style.setProperty('--mystic-accent-2', persona.colors.accent2);
    root.style.setProperty('--mystic-glow', persona.colors.glow);
    root.style.setProperty('--mystic-bg-1', persona.colors.bg1);
    root.style.setProperty('--mystic-bg-2', persona.colors.bg2);
    document.body.dataset.mysticPersona = persona.name.toLowerCase();

    document.querySelectorAll('.card-back, .deck-card').forEach(el => {
      el.style.backgroundImage = `url("${persona.back}")`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundColor = '#1c0f28';
    });

    document.querySelectorAll('[data-mystic-name]').forEach(el => el.textContent = persona.name);
    document.querySelectorAll('[data-mystic-emoji]').forEach(el => el.textContent = persona.emoji);
    document.querySelectorAll('[data-mystic-trait]').forEach(el => el.textContent = persona.trait);
  }

  function savePersona(key){
    if(!PERSONAS[key]) return null;
    try { localStorage.setItem(STORAGE_KEY, key); } catch(e){}
    applyTheme(PERSONAS[key]);
    return PERSONAS[key];
  }

  function injectStyles(){
    if(document.getElementById('mystic-persona-theme-css')) return;
    const style = document.createElement('style');
    style.id = 'mystic-persona-theme-css';
    style.textContent = `
      :root{--mystic-accent:#ffd700;--mystic-accent-2:#9d2048;--mystic-glow:rgba(255,215,0,.25);--mystic-bg-1:rgba(28,15,40,.9);--mystic-bg-2:rgba(157,32,72,.78)}
      .mystic-theme-badge{display:inline-flex;align-items:center;gap:8px;margin:8px 0 16px;padding:7px 13px;border:1px solid var(--mystic-accent);border-radius:999px;color:var(--mystic-accent);background:rgba(0,0,0,.28);font-size:.78em;letter-spacing:.08em;text-transform:uppercase;box-shadow:0 0 18px var(--mystic-glow)}
      .mystic-change-btn{position:fixed;right:18px;top:18px;z-index:900;background:rgba(20,10,30,.86);color:var(--mystic-accent);border:1px solid var(--mystic-accent);border-radius:999px;padding:9px 14px;font-family:inherit;font-weight:bold;cursor:pointer;box-shadow:0 0 16px var(--mystic-glow)}
      .mystic-change-btn:hover{transform:translateY(-1px);background:var(--mystic-bg-1)}
      .mystic-modal-overlay{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;padding:22px;background:rgba(4,1,10,.82);backdrop-filter:blur(10px)}
      .mystic-modal{width:min(980px,100%);max-height:92vh;overflow:auto;padding:30px;border:2px solid var(--mystic-accent);border-radius:20px;background:radial-gradient(circle at 50% 0%,rgba(141,92,255,.18),transparent 48%),rgba(15,7,24,.97);box-shadow:0 30px 100px rgba(0,0,0,.75),0 0 45px var(--mystic-glow);text-align:center}
      .mystic-modal h2{margin:0;color:var(--mystic-accent);font-size:2.2em;text-shadow:0 0 18px var(--mystic-glow)}
      .mystic-modal p{color:#cfc1db;margin:10px auto 24px;max-width:700px;line-height:1.6}
      .mystic-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
      .mystic-option{border:1px solid rgba(255,255,255,.18);border-radius:14px;background:rgba(28,15,40,.78);padding:10px;color:white;cursor:pointer;transition:.25s transform,.25s border-color,.25s box-shadow,.25s opacity,.25s filter}
      .mystic-option:hover{transform:translateY(-5px);border-color:var(--mystic-accent);box-shadow:0 0 28px var(--mystic-glow)}
      .mystic-flip{width:100%;aspect-ratio:3/4;margin-bottom:10px;perspective:1200px;border-radius:9px}
      .mystic-flip-inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .8s cubic-bezier(.4,.2,.2,1)}
      .mystic-option.is-chosen .mystic-flip-inner{transform:rotateY(180deg)}
      .mystic-face{position:absolute;inset:0;backface-visibility:hidden;border-radius:9px;overflow:hidden}
      .mystic-face img{display:block;width:100%;height:100%;object-fit:cover;border-radius:9px}
      .mystic-face--front{transform:rotateY(180deg)}
      .mystic-option strong{display:block;color:#fff;font-size:1.05em;margin-bottom:4px}
      .mystic-option span{display:block;color:#b9a9c8;font-size:.78em;line-height:1.45}
      .mystic-option.is-chosen{transform:translateY(-5px);border-color:var(--mystic-accent);box-shadow:0 0 34px var(--mystic-glow)}
      .mystic-option.is-waiting{pointer-events:none;opacity:.32;filter:grayscale(.5);transform:none}
      .mystic-modal-note{font-size:.75em!important;color:#8f819c!important;margin:18px auto 0!important}
      .mystic-modal-overlay[hidden]{display:none}
      @media(max-width:760px){.mystic-grid{grid-template-columns:repeat(2,1fr)}.mystic-modal{padding:20px}.mystic-modal h2{font-size:1.7em}.mystic-change-btn{top:10px;right:10px}}
    `;
    document.head.appendChild(style);
  }

  function addBadge(persona){
    if(!persona || document.querySelector('.mystic-theme-badge')) return;
    const target = document.querySelector('h1');
    if(!target) return;
    const badge = document.createElement('div');
    badge.className = 'mystic-theme-badge';
    badge.innerHTML = `<span>${persona.emoji}</span><span>Reading with <strong>${persona.name}</strong></span>`;
    target.insertAdjacentElement('afterend', badge);
  }

  function addChangeButton(){
    if(document.body.dataset.mysticIndex === 'true' || document.querySelector('.mystic-change-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'mystic-change-btn';
    btn.type = 'button';
    btn.textContent = '✦ Change Mystic';
    btn.onclick = () => window.MysticPersonaTheme.openPicker(false);
    document.body.appendChild(btn);
  }

  function openPicker(force){
    injectStyles();
    let overlay = document.getElementById('mysticPersonaOverlay');
    if(!overlay){
      overlay = document.createElement('div');
      overlay.id = 'mysticPersonaOverlay';
      overlay.className = 'mystic-modal-overlay';
      overlay.innerHTML = `
        <div class="mystic-modal" role="dialog" aria-modal="true" aria-labelledby="mysticPickerTitle">
          <h2 id="mysticPickerTitle">Choose Your Mystic</h2>
          <p>Pick a card to choose the character who sets the tone for the entire Mystic Tarot experience. Their card back, visual theme, and AI reading voice will follow you through every spread.</p>
          <div class="mystic-grid">
            ${Object.entries(PERSONAS).map(([key,p]) => `
              <button class="mystic-option" type="button" data-persona="${key}">
                <div class="mystic-flip">
                  <div class="mystic-flip-inner">
                    <div class="mystic-face mystic-face--back"><img src="${p.back}" alt="${p.name} card back"></div>
                    <div class="mystic-face mystic-face--front"><img src="${p.front}" alt="${p.name}"></div>
                  </div>
                </div>
                <strong>${p.emoji} ${p.name}</strong>
                <span>${p.trait}</span>
              </button>`).join('')}
          </div>
          <p class="mystic-modal-note">You can change your mystic later with “Change Mystic.”</p>
        </div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', e => {
        if(overlay.dataset.choosing === 'true') return;
        const btn = e.target.closest('.mystic-option');
        if(!btn) return;
        const key = btn.dataset.persona;
        const persona = savePersona(key);
        if(!persona) return;
        overlay.dataset.choosing = 'true';
        overlay.querySelectorAll('.mystic-option').forEach(opt => {
          opt.classList.add(opt === btn ? 'is-chosen' : 'is-waiting');
        });
        setTimeout(() => {
          overlay.hidden = true;
          document.body.classList.remove('mystic-picker-open');
          overlay.dataset.choosing = '';
          overlay.querySelectorAll('.mystic-option').forEach(opt => opt.classList.remove('is-chosen', 'is-waiting'));
          addBadge(persona);
          addChangeButton();
          if(window.dispatchEvent) window.dispatchEvent(new CustomEvent('mysticPersonaChanged',{detail:{persona,key}}));
        }, 1300);
      });
    }
    overlay.hidden = false;
    document.body.classList.add('mystic-picker-open');
  }

  function observeCardBacks(){
    const persona = getPersona();
    if(!persona || !document.body || window.__mysticPersonaObserver) return;
    const observer = new MutationObserver(mutations => {
      let added = false;
      for(const mutation of mutations){
        if(mutation.addedNodes && mutation.addedNodes.length){ added = true; break; }
      }
      if(added) applyTheme(persona);
    });
    observer.observe(document.body, {childList:true, subtree:true});
    window.__mysticPersonaObserver = observer;
  }

  function init(){
    injectStyles();
    const persona = getPersona();
    if(persona) { applyTheme(persona); addBadge(persona); observeCardBacks(); }
    const isIndex = /\/tarot\/?$/i.test(location.pathname) || /\/tarot\/index\.html$/i.test(location.pathname);
    document.body.dataset.mysticIndex = isIndex ? 'true' : 'false';
    if(isIndex){
      if(!persona) openPicker(true);
      else addChangeButton();
    } else {
      addChangeButton();
    }
  }

  window.MysticPersonaTheme = { PERSONAS, STORAGE_KEY, getPersona, getPersonaKey, savePersona, applyTheme, openPicker };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
