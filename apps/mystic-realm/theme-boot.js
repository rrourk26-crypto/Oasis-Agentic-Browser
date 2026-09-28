/* Shared Mystic persona theme. The home-screen choice controls the experience. */
(function(){
  'use strict';
  // Remove the blue tap/focus highlight box that appears when tapping or clicking elements
  (function(){
    const style=document.createElement('style');
    style.textContent='* { -webkit-tap-highlight-color: transparent !important; -webkit-tap-highlight-color: rgba(0,0,0,0) !important; } '
      + '*:focus, *:active, *:focus-visible { outline: none !important; box-shadow: none !important; } '
      + 'button, a, input, select, textarea, [tabindex] { -webkit-tap-highlight-color: transparent !important; }';
    (document.head||document.documentElement).appendChild(style);
  })();
  const KEY='mysticTarot_personaTheme';
  const P={
    amelia:{name:'Amelia',emoji:'🔮',trait:'Warm, compassionate, intuitive',back:'characters/back-amelia.jpg',colors:{accent:'#d8a7ff',accent2:'#6d3f9e',glow:'rgba(216,167,255,.30)',bg1:'rgba(58,24,72,.88)',bg2:'rgba(116,57,132,.78)'}},
    gwendolyn:{name:'Gwenny',emoji:'🌙',trait:'Mysterious, elegant, deeply spiritual',back:'characters/back-gwendolyn.jpg',colors:{accent:'#bba7ff',accent2:'#4b3c91',glow:'rgba(187,167,255,.30)',bg1:'rgba(28,24,72,.90)',bg2:'rgba(65,55,130,.78)'}},
    anja:{name:'Anja',emoji:'🕯️',trait:'Direct, perceptive, darker and enigmatic',back:'characters/back-anja.jpg',colors:{accent:'#e8a0b7',accent2:'#7a243f',glow:'rgba(232,160,183,.28)',bg1:'rgba(50,10,28,.90)',bg2:'rgba(122,36,63,.78)'}},
    elizabeth:{name:'Eliza',emoji:'🃏',trait:'Playful, unconventional, unpredictable',back:'characters/back-elizabeth.jpg',colors:{accent:'#ffd36e',accent2:'#8b5b1f',glow:'rgba(255,211,110,.30)',bg1:'rgba(54,34,12,.90)',bg2:'rgba(139,91,31,.78)'}}
  };
  const key=()=>{try{return localStorage.getItem(KEY)||''}catch(e){return ''}};
  const persona=()=>P[key()]||null;
  function apply(){const p=persona();if(!p)return;const r=document.documentElement;r.style.setProperty('--mystic-accent',p.colors.accent);r.style.setProperty('--mystic-accent-2',p.colors.accent2);r.style.setProperty('--mystic-glow',p.colors.glow);r.style.setProperty('--mystic-bg-1',p.colors.bg1);r.style.setProperty('--mystic-bg-2',p.colors.bg2);document.body.dataset.mysticPersona=key();document.querySelectorAll('.card-back').forEach(el=>{let src=p.back;if(location.pathname.indexOf('/tarot/')===-1&&location.pathname.indexOf('/selene/')===-1)src='selene/'+src;el.style.backgroundImage=`url("${src}")`;el.style.backgroundSize='cover';el.style.backgroundPosition='center';});document.querySelectorAll('[data-mystic-name]').forEach(e=>e.textContent=p.name);document.querySelectorAll('[data-mystic-emoji]').forEach(e=>e.textContent=p.emoji);}
  window.MysticAppTheme={KEY,PERSONAS:P,getPersona:persona,getKey:key,apply};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
})();
