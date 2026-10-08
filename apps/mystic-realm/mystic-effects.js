/* Mystic Realm shared interaction effects */
(function(){
  'use strict';
  const SOUND_ROOT = (document.currentScript && document.currentScript.src)
    ? document.currentScript.src.substring(0, document.currentScript.src.lastIndexOf('/') + 1)
    : '';
  const clickAudio = new Audio(SOUND_ROOT + 'sounds/card click sparckle effect.mp3');
  const shuffleAudio = new Audio(SOUND_ROOT + 'sounds/card shuffle effect.mp3');
  clickAudio.preload = 'auto'; shuffleAudio.preload = 'auto';
  clickAudio.volume = 0.34; shuffleAudio.volume = 0.46;

  const SOUND_KEY = 'mysticTarot_soundsEnabled';
  let enabled = true;
  try {
    const saved = localStorage.getItem(SOUND_KEY);
    if(saved === '0') enabled = false;
    if(saved === '1') enabled = true;
  } catch(e){}

  let audioReady = false;
  function play(a){
    if(!enabled || !audioReady) return;
    try {
      a.currentTime=0;
      const p=a.play();
      if(p&&p.catch) p.catch(()=>{});
    } catch(e){}
  }
  function light(){ play(clickAudio); }
  function flip(){ play(clickAudio); }
  function shuffle(){ play(shuffleAudio); }
  function arm(){ audioReady=true; }
  ['pointerdown','touchstart','keydown'].forEach(ev=>window.addEventListener(ev, arm, {once:true, passive:true}));

  function isShuffle(el){
    if(!el) return false;
    const s=((el.id||'')+' '+(typeof el.className==='string'?el.className:'')+' '+(el.textContent||'')).toLowerCase();
    return /shuffle|reshuffle|mix cards|shuffle cards|deck-wrap|decklabel|deck label/.test(s) || !!el.closest?.('.deck-wrap,.shuffle-btn,.shuffle-button,[data-action="shuffle"],[data-shuffle]');
  }

  function updateSoundButton(){
    const btn=document.getElementById('mystic-sound-toggle');
    if(!btn) return;
    btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    btn.title=enabled ? 'Sounds on — click to turn off' : 'Sounds off — click to turn on';
    btn.innerHTML=enabled ? '🔊 <span>Sounds</span>' : '🔇 <span>Muted</span>';
    btn.classList.toggle('muted', !enabled);
  }

  function setEnabled(value){
    enabled=!!value;
    try{ localStorage.setItem(SOUND_KEY, enabled ? '1' : '0'); }catch(e){}
    updateSoundButton();
    // Give the user immediate feedback only when turning sounds back on.
    if(enabled){ arm(); light(); }
  }

  // A quiet card sound when the pointer first enters a Tarot card.
  // Use the light click sound (not the full shuffle effect) so hovering
  // around a card doesn't sound like reshuffling the whole deck,
  // throttled per card so moving around a card does not become noisy.
  const hoverTimes = new WeakMap();
  document.addEventListener('pointerover', function(e){
    const card=e.target && e.target.closest && e.target.closest('.card,.tarot-card,.reading-card,.draw-card');
    if(!card) return;
    if(e.relatedTarget && card.contains(e.relatedTarget)) return;
    const now=Date.now();
    const last=hoverTimes.get(card) || 0;
    if(now-last < 220) return;
    hoverTimes.set(card, now);
    arm();
    light();
  }, true);

  document.addEventListener('click', function(e){
    const toggle=e.target && e.target.closest && e.target.closest('#mystic-sound-toggle');
    if(toggle){
      e.preventDefault();
      arm();
      setEnabled(!enabled);
      return;
    }

    const el=e.target && e.target.closest && e.target.closest('button,a,[role="button"],input[type="button"],input[type="submit"],select,.deck-wrap,.shuffle-btn,.shuffle-button,[data-action="shuffle"],[data-shuffle]');
    if(!el) return;
    arm();
    if(el.matches && el.matches('.home-mystic-card')) flip();
    else if(isShuffle(el)) shuffle(); else light();
  }, true);

  function addSoundToggle(){
    if(document.getElementById('mystic-sound-toggle')) return;
    const btn=document.createElement('button');
    btn.id='mystic-sound-toggle';
    btn.type='button';
    btn.setAttribute('aria-label','Toggle Mystic Realm sounds');
    btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    document.body.appendChild(btn);
    updateSoundButton();
  }


  // A small, reusable completion sound for pages that explicitly finish an action.
  window.MysticEffects = {
    click: function(){ arm(); light(); },
    flip: function(){ arm(); flip(); },
    shuffle: function(){ arm(); shuffle(); },
    complete: function(){
      arm();
      try {
        const C=window.AudioContext||window.webkitAudioContext;
        if(!C) return;
        const c=new C(), o=c.createOscillator(), g=c.createGain();
        o.type='sine'; o.frequency.setValueAtTime(660,c.currentTime);
        o.frequency.exponentialRampToValueAtTime(990,c.currentTime+0.16);
        g.gain.setValueAtTime(0.0001,c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.055,c.currentTime+0.025);
        g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+0.32);
        o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime+0.34);
        setTimeout(()=>{try{c.close()}catch(e){}},500);
      }catch(e){}
    }
  };

  // Mobile-friendly / desktop-friendly "there is more below" indicator.
  function setupScrollHint(){
    if(document.getElementById('mystic-scroll-hint')) return;
    const hint=document.createElement('div');
    hint.id='mystic-scroll-hint';
    hint.innerHTML='<span class="mystic-scroll-arrow">↓</span><span>Scroll for more</span>';
    document.body.appendChild(hint);
    function refresh(){
      const canScroll=document.documentElement.scrollHeight > window.innerHeight + 48;
      const nearBottom=window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 70;
      hint.classList.toggle('show', canScroll && !nearBottom);
    }
    window.addEventListener('scroll', refresh, {passive:true});
    window.addEventListener('resize', refresh, {passive:true});
    if(window.ResizeObserver){ new ResizeObserver(refresh).observe(document.body); }
    setTimeout(refresh,250); setTimeout(refresh,1000);
  }
  function addStyles(){
    if(document.getElementById('mystic-effects-style')) return;
    const s=document.createElement('style'); s.id='mystic-effects-style';
    s.textContent=`
      #mystic-scroll-hint{position:fixed;z-index:9999;left:50%;bottom:14px;transform:translate(-50%,12px);display:flex;align-items:center;gap:7px;padding:7px 12px;border:1px solid rgba(255,255,255,.16);border-radius:999px;background:rgba(18,18,28,.82);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:rgba(255,255,255,.88);font:600 11px/1.1 system-ui,sans-serif;letter-spacing:.03em;opacity:0;pointer-events:none;transition:opacity .25s ease,transform .25s ease;box-shadow:0 5px 20px rgba(0,0,0,.22)}
      #mystic-scroll-hint.show{opacity:.92;transform:translate(-50%,0)}
      .mystic-scroll-arrow{font-size:18px;line-height:10px;animation:mystic-bounce 1.25s ease-in-out infinite}
      @keyframes mystic-bounce{0%,100%{transform:translateY(-1px);opacity:.65}50%{transform:translateY(4px);opacity:1}}
      @media(max-width:600px){#mystic-scroll-hint{bottom:10px;font-size:10px;padding:6px 10px}.mystic-scroll-arrow{font-size:17px}}
      #mystic-sound-toggle{position:fixed;z-index:9998;right:12px;bottom:12px;display:flex;align-items:center;gap:5px;padding:7px 10px;border:1px solid rgba(255,255,255,.16);border-radius:999px;background:rgba(18,18,28,.82);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:rgba(255,255,255,.9);font:600 10px/1 system-ui,sans-serif;letter-spacing:.02em;cursor:pointer;box-shadow:0 5px 20px rgba(0,0,0,.22);transition:opacity .2s,transform .2s,background .2s;opacity:.82}
      #mystic-sound-toggle:hover{opacity:1;transform:translateY(-1px)}
      #mystic-sound-toggle.muted{opacity:.62}
      @media(max-width:600px){#mystic-sound-toggle{right:8px;bottom:8px;padding:7px 9px;font-size:9px}}

    `;
    document.head.appendChild(s);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{addStyles();addSoundToggle();setupScrollHint()},{once:true});
  else {addStyles();addSoundToggle();setupScrollHint();}
})();
