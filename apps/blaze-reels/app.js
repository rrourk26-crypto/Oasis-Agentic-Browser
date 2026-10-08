(() => {
'use strict';

/* ---------- Game data ---------- */
const SYMBOLS = {
  cherry:  { name: 'Cherry',       pay: 6 },
  bell:    { name: 'Bell',         pay: 10 },
  bar:     { name: 'Bar',          pay: 12 },
  bar2:    { name: 'Double Bar',   pay: 20 },
  bar3:    { name: 'Triple Bar',   pay: 30 },
  gem:     { name: 'Amber Gem',    pay: 50 },
  diamond: { name: 'Diamond',      pay: 65 },
  seven:   { name: 'Flaming Seven',pay: 125 },
  wild:    { name: 'Wild',         pay: 300 },
  liberty: { name: 'Liberty Bell', pay: 0 }
};
const IMG = id => `images/${id}.png`;

const STRIPS = [
  ["liberty","bell","bar","bell","bar3","cherry","bell","bar","cherry","gem","diamond","wild","bar2","bar","cherry","wild","bar3","bar","bell","seven","bar2","bell","bar2","seven","cherry","bar3","bar","bell","cherry","liberty","cherry","gem","bar3","bar2","diamond","bar2","cherry","diamond","gem","bar","seven"],
  ["bar2","bell","cherry","bar","diamond","cherry","bar3","seven","bell","bar2","bell","bar","cherry","wild","bar3","bar2","bar3","bar2","liberty","bar","diamond","bar","diamond","bell","seven","cherry","bar2","gem","bar3","bell","cherry","gem","bar","gem","wild","bar","bell","cherry","liberty","cherry","seven"],
  ["bar3","bell","bar","cherry","wild","diamond","bell","seven","bar","bell","seven","bar2","bar3","bar","bar3","bar2","bell","liberty","cherry","bar","cherry","bar2","bell","gem","bar2","cherry","diamond","liberty","cherry","bar","diamond","bar3","wild","gem","bar2","bell","cherry","gem","seven","bar","cherry"]
];

// rows: top=0, middle=1, bottom=2. One row index per reel.
const LINES = [[0,0,0],[1,1,1],[2,2,2],[0,1,2],[2,1,0]];
const BET_STEPS = [1, 2, 5, 10, 25, 50];   // credits per line
const FREE_SPINS_AWARD = 8;
const FREE_MULT = 2;
const START_CREDITS = 1000;

/* ---------- Pure game logic ---------- */
function evaluate(grid) {
  // grid[row][reel] -> symbol id. Returns line wins in units of "bet per line".
  const wins = [];
  LINES.forEach((rows, li) => {
    const s = rows.map((r, c) => grid[r][c]);
    const base = s.find(x => x !== 'wild' && x !== 'liberty');
    let sym = null, mult = 0, len = 3;
    if (s.every(x => x === 'wild')) { sym = 'wild'; mult = SYMBOLS.wild.pay; }
    else if (base && s.every(x => x === 'wild' || x === base)) { sym = base; mult = SYMBOLS[base].pay; }
    else if ((s[0] === 'cherry' || s[0] === 'wild') && (s[1] === 'cherry' || s[1] === 'wild') && s.slice(0, 2).includes('cherry')) {
      sym = 'cherry'; mult = 1; len = 2;
    }
    if (mult > 0) wins.push({ line: li, rows, sym, mult, len });
  });
  const scatterCells = [];
  grid.forEach((row, r) => row.forEach((id, c) => { if (id === 'liberty') scatterCells.push([r, c]); }));
  return { wins, scatterCells };
}
/* ---------- Scratch ticket math (pure) ---------- */
// [total prize in ticket prices, chances per million]. Overall odds and return are computed from this table.
const TICKET_ODDS = [[1,110000],[2,65000],[3,30000],[5,20000],[10,10000],[20,3500],[50,900],[100,350],[1000,15]];
const SHOWN = [1,2,3,4,5,10,20,25,50,100,200,250,500,1000];     // prize amounts that can appear on a cell
const BONUS = [10, 50];                                          // Hot bonus / Hotter bonus
const DUDS = ['cherry','bell','bar','bar2','bar3','gem','diamond'];
function ticketStats() {
  const win = TICKET_ODDS.reduce((a, [, w]) => a + w, 0) / 1e6, rtp = TICKET_ODDS.reduce((a, [t, w]) => a + t * w, 0) / 1e6;
  return { win, oneIn: 1 / win, rtp, top: TICKET_ODDS[TICKET_ODDS.length - 1][0] };
}
function planFor(T, rnd) {
  const opts = [];
  if (SHOWN.includes(T)) opts.push({ cells: [[T, 1]] });
  [2, 3, 5, 7].forEach(m => { if (T % m === 0 && SHOWN.includes(T / m)) opts.push({ cells: [[T / m, m]] }); });
  SHOWN.forEach(a => { const b = T - a; if (a <= b && SHOWN.includes(b)) opts.push({ cells: [[a, 1], [b, 1]] }); });
  BONUS.forEach((v, i) => { if (T === v) opts.push({ cells: [], bonus: i }); });
  return opts[rnd(opts.length)];
}
function makeTicketData(u, rnd) {       // u = ticket price in credits, rnd(n) -> integer in [0, n)
  let r = rnd(1000000), T = 0;
  for (const [t, w] of TICKET_ODDS) { if (r < w) { T = t; break; } r -= w; }
  const plan = T ? planFor(T, rnd) : { cells: [] };
  const idx = [...Array(12).keys()];
  for (let i = 11; i > 0; i--) { const k = rnd(i + 1); [idx[i], idx[k]] = [idx[k], idx[i]]; }
  const cells = Array.from({ length: 12 }, () => ({ sym: DUDS[rnd(DUDS.length)], amt: SHOWN[rnd(SHOWN.length)], mult: 1, hit: false }));
  plan.cells.forEach(([a, m], k) => { cells[idx[k]] = { sym: m > 1 ? 'mult' : 'seven', amt: a, mult: m, hit: true }; });
  return { u, T, won: T * u, cells, bonus: plan.bonus == null ? -1 : plan.bonus };
}
function analyze() {
  // Exact odds: enumerate every combination of reel stops (41 x 41 x 41). Units = bet per line (total bet = 5 units).
  const n = STRIPS.map(s => s.length), total = n[0] * n[1] * n[2];
  let pay = 0, bonus = 0, hit = 0;
  for (let a = 0; a < n[0]; a++) for (let b = 0; b < n[1]; b++) for (let c = 0; c < n[2]; c++) {
    const st = [a, b, c];
    const grid = [0, 1, 2].map(r => [0, 1, 2].map(k => STRIPS[k][((st[k] - 1 + r) % n[k] + n[k]) % n[k]]));
    const res = evaluate(grid), m = res.wins.reduce((s, w) => s + w.mult, 0), sc = res.scatterCells.length >= 3;
    pay += m + (sc ? 2 * LINES.length : 0);
    if (sc) bonus++;
    if (m > 0 || sc) hit++;
  }
  const P = pay / total, q = bonus / total;
  const spins = FREE_SPINS_AWARD / (1 - FREE_SPINS_AWARD * q);          // expected free spins per bonus, with retriggers
  const rtp = (P + q * spins * FREE_MULT * P) / LINES.length;
  return { rtp, hit: hit / total, bonusOdds: bonus ? total / bonus : Infinity, combos: total };
}
if (typeof module !== 'undefined') { module.exports = { evaluate, analyze, makeTicketData, ticketStats, BONUS, SYMBOLS, STRIPS, LINES }; }
if (typeof document === 'undefined') return;

/* ---------- DOM ---------- */
const $ = id => document.getElementById(id);
const el = {
  status: $('status'), balance: $('balance'), win: $('win'), bet: $('bet'), betSub: $('betSub'),
  fsBox: $('fsBox'), fs: $('fs'), spin: $('spin'), autoBtns: [...document.querySelectorAll('[data-auto]')], autoNote: $('autoNote'), statsBtn: $('statsBtn'), odds: $('odds'), maxBet: $('maxBet'),
  betUp: $('betUp'), betDown: $('betDown'), payBtn: $('payBtn'), sound: $('sound'), broke: $('broke'), brokeText: $('brokeText'), vol: $('vol'),
  banner: $('banner'), lines: $('lines'), guides: $('guides'), tags: $('tags'), linesBtn: $('linesBtn'), win_: $('window'), pay: $('pay'), paygrid: $('paygrid')
};
const reels = [...document.querySelectorAll('.reel')];
const strips = reels.map(r => r.querySelector('.strip'));

/* ---------- State ---------- */
const state = {
  balance: START_CREDITS, betIdx: 2, free: 0, freeWin: 0,
  spinning: false, reelSnd: null, rate: 1, refillAt: 0, autoLeft: 0, autoMode: 0, sound: true, volume: 0.8, showLines: true, timer: null, cycleTimer: null
};
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

function save() {
  try { localStorage.setItem('blaze-reels', JSON.stringify({ b: state.balance, i: state.betIdx, s: state.sound, l: state.showLines, v: state.volume, r: state.refillAt })); } catch (e) {}
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem('blaze-reels') || 'null');
    if (d) {
      if (Number.isFinite(d.b) && d.b >= 0) state.balance = Math.floor(d.b);
      if (Number.isInteger(d.i) && d.i >= 0 && d.i < BET_STEPS.length) state.betIdx = d.i;
      if (typeof d.s === 'boolean') state.sound = d.s;
      if (typeof d.l === 'boolean') state.showLines = d.l;
      if (Number.isFinite(d.v) && d.v >= 0 && d.v <= 1) state.volume = d.v;
      if (Number.isFinite(d.r) && d.r > 0) state.refillAt = d.r;
    }
  } catch (e) {}
}

const perLine = () => BET_STEPS[state.betIdx];
const totalBet = () => perLine() * LINES.length;
const fmt = n => Math.round(n).toLocaleString('en-US');

/* ---------- Sound (synthesised, no files) ---------- */
let actx = null;
function audio() {
  if (!state.sound) return null;
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) { return null; }
  return actx;
}
function tone(freq, dur, type = 'sine', vol = 0.08, delay = 0, slideTo) {
  vol *= state.volume; if (vol <= 0) return;
  const a = audio(); if (!a) return;
  const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
/* Recorded clips (sounds/ folder). Long ones are cut off with a short fade. */
const CLIPS = { reels: 'sounds/reels.mp3', stop: 'sounds/stop.mp3', click: 'sounds/click.mp3', coins: 'sounds/coins.mp3', coin: 'sounds/coin.mp3' };
Object.values(CLIPS).forEach(src => { try { new Audio(src).preload = 'auto'; } catch (e) {} });
function fadeOut(a, ms = 150) {
  if (!a) return;
  const v = a.volume, t0 = performance.now();
  const id = setInterval(() => {
    const p = Math.min(1, (performance.now() - t0) / ms);
    a.volume = Math.max(0, v * (1 - p));
    if (p >= 1) { clearInterval(id); a.pause(); }
  }, 20);
}
function play(name, vol = 1, maxMs) {
  const v = Math.min(1, vol * state.volume);
  if (!state.sound || v <= 0) return null;
  try {
    const a = new Audio(CLIPS[name]); a.volume = v;
    a.play().catch(() => {});
    if (maxMs) setTimeout(() => fadeOut(a, 250), Math.max(0, maxMs - 250));   // cut long clips short
    return a;
  } catch (e) { return null; }
}
const sfx = {
  start() { state.reelSnd = play('reels', 0.7); },                 // stopped by fadeOut when the reels land
  stop()  { play('stop', 0.8); },
  win()   { play('coin', 0.8); },
  big()   { play('coins', 0.8, 3200); [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.3, 'square', 0.04, i * 0.08)); },
  bonus() { [330, 440, 554, 659, 880].forEach((f, i) => tone(f, 0.35, 'triangle', 0.09, i * 0.11)); }
};

/* ---------- Rendering ---------- */
function cellHTML(id) { return `<div class="cell" data-id="${id}"><img src="${IMG(id)}" alt="${SYMBOLS[id].name}" draggable="false"></div>`; }
function symAt(c, i) { const s = STRIPS[c]; return s[((i % s.length) + s.length) % s.length]; }
function renderStatic(c, ids) {
  strips[c].style.transform = 'translateY(0)';
  strips[c].style.height = '';
  strips[c].innerHTML = ids.map(cellHTML).join('');
}
function gridToIds(stops) {
  return stops.map((stop, c) => [0, 1, 2].map(r => symAt(c, stop - 1 + r)));
}
function currentIds(c) { return [...strips[c].querySelectorAll('.cell')].slice(0, 3).map(n => n.dataset.id); }

function setBalance(v) { state.balance = Math.max(0, Math.round(v)); el.balance.textContent = fmt(state.balance); save(); }
function countUp(node, from, to, ms, done) {
  if (reduceMotion || to === from) { node.textContent = fmt(to); done && done(); return; }
  const t0 = performance.now();
  (function tick(now) {
    const p = Math.min(1, (now - t0) / ms);
    node.textContent = fmt(from + (to - from) * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick); else done && done();
  })(t0);
}
function say(text, hot) { el.status.textContent = text; el.status.classList.toggle('hot', !!hot); }
function updateUI() {
  el.balance.textContent = fmt(state.balance);
  el.bet.textContent = fmt(totalBet());
  el.betSub.textContent = `${fmt(perLine())} per line, ${LINES.length} lines`;
  el.fsBox.hidden = state.free <= 0;
  el.fs.textContent = state.free;
  const lock = state.spinning || state.free > 0;
  el.betUp.disabled = lock || state.betIdx >= BET_STEPS.length - 1;
  el.betDown.disabled = lock || state.betIdx <= 0;
  el.maxBet.disabled = lock;
  el.spin.textContent = state.spinning ? 'Stop' : (state.free > 0 ? 'Free spin' : 'Spin');
  el.spin.disabled = state.free > 0 && !state.spinning;
  checkBroke();
  el.sound.textContent = state.sound ? 'Sound on' : 'Sound off';
  el.sound.setAttribute('aria-pressed', String(state.sound));
  el.autoBtns.forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.auto === state.autoMode)));
  el.autoNote.textContent = state.autoMode ? `${state.autoLeft} spin${state.autoLeft === 1 ? '' : 's'} left` : '';
  el.vol.value = Math.round(state.volume * 100); el.vol.disabled = !state.sound;
  el.linesBtn.textContent = state.showLines ? 'Pay lines on' : 'Pay lines off';
  el.linesBtn.setAttribute('aria-pressed', String(state.showLines));
  el.win_.classList.toggle('nolines', !state.showLines);
}

/* ---------- Out of funds: free credits every hour ---------- */
const MIN_BET = BET_STEPS[0] * LINES.length;
const REFILL_MS = 3600000, REFILL_CREDITS = 1000;
const isBroke = () => state.balance < MIN_BET && !state.spinning && state.free === 0;
function checkBroke() {
  const broke = isBroke();
  if (broke && !state.refillAt) { state.refillAt = Date.now() + REFILL_MS; save(); }
  if (!broke && state.refillAt && state.balance >= MIN_BET) { state.refillAt = 0; save(); }
  el.broke.hidden = !broke;
  tickRefill();
}
function tickRefill() {
  if (!state.refillAt) return;
  const left = state.refillAt - Date.now();
  if (left <= 0) {
    if (state.spinning || state.free > 0) return;
    state.refillAt = 0; setBalance(state.balance + REFILL_CREDITS);
    say(`Your free ${fmt(REFILL_CREDITS)} credits have arrived.`, true); play('coins', 0.8, 2500); updateUI();
    return;
  }
  const s = Math.ceil(left / 1000), p = n => String(n).padStart(2, '0');
  el.brokeText.textContent = `Free ${fmt(REFILL_CREDITS)} credits in ${p(Math.floor(s / 60))}:${p(s % 60)}`;
}
setInterval(tickRefill, 1000);

/* ---------- Random numbers (crypto-grade, unbiased) ---------- */
function randInt(n) {
  const lim = Math.floor(4294967296 / n) * n, buf = new Uint32Array(1);
  do { crypto.getRandomValues(buf); } while (buf[0] >= lim);
  return buf[0] % n;
}

/* ---------- Spin animation ---------- */
const easeOut = t => { const c1 = 0.2, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

function spinReel(c, stop, prevIds, reelIdx) {
  return new Promise(resolve => {
    const travel = 14 + reelIdx * 7;           // cells scrolled past
    const total = travel + 4;                   // + 3 result cells + 1 buffer below
    const ids = prevIds.slice();
    for (let k = 3; k < total; k++) {
      // result rows land at travel..travel+2; everything before continues the strip
      ids.push(symAt(c, stop - 1 + (k - travel)));
    }
    // make sure the three result rows are exact
    for (let r = 0; r < 3; r++) ids[travel + r] = symAt(c, stop - 1 + r);
    strips[c].innerHTML = ids.map(cellHTML).join('');
    strips[c].style.height = (total * 100 / 3) + '%';     // reel shows 3 cells
    reels[c].classList.add('moving');
    const dur = (reduceMotion ? 450 : 1000) + reelIdx * (reduceMotion ? 120 : 420);
    const shift = travel / total;                          // fraction of strip height
    let elapsed = 0, last = performance.now() + reelIdx * 0; // reels all start together
    (function frame(now) {
      elapsed += (now - last) * state.rate; last = now;
      const t = Math.min(1, elapsed / dur);
      const p = easeOut(t);
      strips[c].style.transform = `translateY(${(-shift * p * 100).toFixed(3)}%)`;
      if (t > 0.72) reels[c].classList.remove('moving');
      if (t < 1) requestAnimationFrame(frame);
      else {
        reels[c].classList.remove('moving');
        renderStatic(c, ids.slice(travel, travel + 3));
        sfx.stop();
        resolve();
      }
    })(last);
  });
}

/* ---------- Win presentation ---------- */
function clearWinFx() {
  clearTimeout(state.cycleTimer);
  el.lines.innerHTML = '';
  el.win_.classList.remove('has-win');
  document.querySelectorAll('.cell.win,.cell.dim').forEach(n => n.classList.remove('win', 'dim'));
}
function cellNode(r, c) { return strips[c].children[r]; }
function showCells(cells, others) {
  document.querySelectorAll('.cell').forEach(n => n.classList.remove('win', 'dim'));
  if (others) document.querySelectorAll('.cell').forEach(n => n.classList.add('dim'));
  cells.forEach(([r, c]) => { const n = cellNode(r, c); if (n) { n.classList.remove('dim'); n.classList.add('win'); } });
}
function drawLines(wins, activeLine) {
  el.lines.innerHTML = wins.map(w => {
    const pts = [[0, w.rows[0]], ...w.rows.map((r, c) => [c + .5, r]), [3, w.rows[2]]]
      .map(([x, r]) => `${(x * 100).toFixed(0)},${r * 100 + 50}`).join(' ');
    const on = activeLine == null || activeLine === w.line;
    return `<polyline class="${on ? 'on' : ''}" points="${pts}"/>`;
  }).join('');
}
function winCells(w) { return w.rows.slice(0, w.len).map((r, c) => [r, c]); }

function presentWins(res) {
  const { wins, scatterCells } = res;
  const all = [];
  wins.forEach(w => winCells(w).forEach(x => all.push(x)));
  if (scatterCells.length >= 3) scatterCells.forEach(x => all.push(x));
  if (!all.length) return;
  showCells(all, true);
  drawLines(wins, null);
  if (wins.length) el.win_.classList.add('has-win');
  if (wins.length > 1) {
    let i = 0;
    const cycle = () => {
      const w = wins[i % wins.length];
      showCells(winCells(w), true);
      drawLines(wins, w.line);
      i++;
      state.cycleTimer = setTimeout(cycle, 1000);
    };
    state.cycleTimer = setTimeout(cycle, 1300);
  }
}

function banner(html, ms) {
  return new Promise(res => {
    el.banner.innerHTML = html; el.banner.hidden = false;
    setTimeout(() => { el.banner.hidden = true; res(); }, reduceMotion ? ms * 0.6 : ms);
  });
}

/* ---------- Main spin ---------- */
async function spin() {
  if (state.spinning) { state.rate = 3.2; return; }          // press again = stop faster
  if (document.querySelector('dialog[open]') && (state.autoLeft > 0 || state.free > 0)) { state.timer = setTimeout(spin, 800); return; }   // wait while a window is open
  const isFree = state.free > 0;
  let bet = totalBet(), lowered = '';
  if (!isFree && state.balance < bet) {                      // drop the bet to what you can afford instead of refusing
    let i = state.betIdx;
    while (i > 0 && BET_STEPS[i] * LINES.length > state.balance) i--;
    if (BET_STEPS[i] * LINES.length > state.balance) {
      say('Out of funds \u2014 try a scratch ticket or wait for your free credits.');
      state.autoLeft = 0; state.autoMode = 0; updateUI();
      return;
    }
    state.betIdx = i; bet = totalBet(); save(); lowered = `Bet lowered to ${fmt(bet)} to fit your credits.`;
  }
  clearTimeout(state.timer);
  clearWinFx();
  state.spinning = true; state.rate = 1;
  if (!isFree && state.autoLeft > 0) state.autoLeft--;
  el.win.textContent = '0';
  if (isFree) { state.free--; } else { setBalance(state.balance - bet); }
  say(isFree ? `Free spin (${state.free} left after this one)` : (lowered || 'Good luck.'));
  updateUI();
  sfx.start();

  const stops = STRIPS.map(s => randInt(s.length));
  const ids = gridToIds(stops);                                 // ids[reel][row]
  const grid = [0, 1, 2].map(r => [0, 1, 2].map(c => ids[c][r]));  // grid[row][reel]
  const prev = [0, 1, 2].map(currentIds);
  await Promise.all(reels.map((_, c) => spinReel(c, stops[c], prev[c], c)));
  fadeOut(state.reelSnd, 150); state.reelSnd = null;                 // cut the reel noise once they've stopped

  const res = evaluate(grid);
  let pay = res.wins.reduce((a, w) => a + w.mult * perLine(), 0);
  const scatter = res.scatterCells.length >= 3;
  if (scatter) pay += bet * 2;
  if (isFree) pay *= FREE_MULT;
  state.spinning = false; state.rate = 1;
  const tierBefore = tierFor(stats.wagered);
  recordSpin(isFree ? 0 : bet, pay, isFree, scatter);
  const tierNow = tierFor(stats.wagered);

  presentWins(res);
  if (pay > 0) {
    const from = 0;
    sfx[pay >= bet * 15 ? 'big' : 'win'](res.wins.length);
    const before = state.balance;
    countUp(el.win, from, pay, 700);
    countUp(el.balance, before, before + pay, 700, () => setBalance(before + pay));
    state.balance = before + pay; save();
    if (isFree) state.freeWin += pay;
    const names = res.wins.map(w => `${SYMBOLS[w.sym].name}${w.len === 2 ? ' ×2' : ''}`).join(', ');
    say(`You won ${fmt(pay)}${names ? ' — ' + names : ''}`, true);
  } else {
    say(isFree ? 'No win this spin.' : 'No win. Spin again.');
  }

  if (scatter) {
    sfx.bonus();
    state.free += FREE_SPINS_AWARD;
    if (!isFree) state.freeWin = pay;
    updateUI();
    await banner(`${FREE_SPINS_AWARD} free spins<small>Wins pay ${FREE_MULT}×</small>`, 1900);
  } else if (pay >= bet * 15) {
    updateUI();
    await banner(`Big win<small>${fmt(pay)} credits</small>`, 1500);
  }

  if (tierNow !== tierBefore) { updateUI(); await banner(`${cap(tierNow)} tier unlocked<small>Your player card has been upgraded</small>`, 2000); }
  updateUI();

  if (state.free > 0) {
    state.timer = setTimeout(spin, pay > 0 ? 2000 : 1100);
  } else {
    if (isFree) {                                              // just finished the last free spin
      await banner(`Free spins complete<small>Total won: ${fmt(state.freeWin)}</small>`, 2000);
      state.freeWin = 0; updateUI();
    }
    if (state.autoLeft > 0) state.timer = setTimeout(spin, pay > 0 ? 1800 : 700);
    else { state.autoMode = 0; updateUI(); }
  }
}

/* ---------- Controls ---------- */
el.spin.addEventListener('click', spin);
el.betUp.addEventListener('click', () => { if (state.betIdx < BET_STEPS.length - 1) { state.betIdx++; save(); updateUI(); } });
el.betDown.addEventListener('click', () => { if (state.betIdx > 0) { state.betIdx--; save(); updateUI(); } });
el.maxBet.addEventListener('click', () => {
  let i = BET_STEPS.length - 1;
  while (i > 0 && BET_STEPS[i] * LINES.length > state.balance) i--;
  state.betIdx = i; save(); updateUI();
});
el.autoBtns.forEach(b => b.addEventListener('click', () => {
  const n = +b.dataset.auto, idle = !state.spinning && state.free === 0;
  state.autoMode = n; state.autoLeft = n;
  if (idle) clearTimeout(state.timer);
  updateUI();
  if (n > 0 && idle) spin();
}));
el.sound.addEventListener('click', () => { state.sound = !state.sound; save(); updateUI(); if (!state.sound) { fadeOut(state.reelSnd, 80); state.reelSnd = null; } });
el.vol.addEventListener('input', () => {
  state.volume = el.vol.value / 100; save();
  if (state.reelSnd) state.reelSnd.volume = Math.min(1, 0.7 * state.volume);     // adjust a spin already in progress
});
el.vol.addEventListener('change', () => play('click', 0.45, 600));               // sample the new level
let oddsCache = null;
const odds = () => oddsCache || (oddsCache = analyze());
el.payBtn.addEventListener('click', () => {
  const o = odds();
  el.odds.textContent = `Theoretical return: ${(o.rtp * 100).toFixed(1)}% over the long run. About ${(o.hit * 100).toFixed(0)}% of spins win something, and free spins land roughly 1 in ${Math.round(o.bonusOdds)} spins. Every spin is random and independent \u2014 the machine has no memory and no hot or cold streaks.`;
  el.pay.showModal();
});
el.statsBtn.addEventListener('click', openStats);
document.addEventListener('click', e => {                         // button press sound (Spin has its own)
  const b = e.target.closest('button');
  if (b && b.id !== 'spin' && !b.disabled) play('click', 0.45, 600);
});
// Space spins unless you're typing or a window is open. A focused slider or button (e.g. after
// changing volume or bet) used to swallow the key, so those count as "not typing" too.
const spaceSpins = e => e.code === 'Space' && !document.querySelector('dialog[open]') &&
  (e.target === document.body || (e.target.tagName === 'INPUT' && e.target.type === 'range') || (e.target.tagName === 'BUTTON' && e.target.id !== 'spin'));
document.addEventListener('keydown', e => { if (spaceSpins(e)) { e.preventDefault(); if (!e.repeat) spin(); } });
document.addEventListener('keyup', e => { if (spaceSpins(e)) e.preventDefault(); });   // stop the focused button's own click

/* ---------- Scratch tickets ---------- */
const sc = {};
['scratchDlg','scNote','ticket','tgrid','tfoil','bx0','bx1','scResult','scReveal','buy1','buy5','scClose','scratchLink','brokeScratch']
  .forEach(id => { sc[id] = $(id); });
let tk = null, scratching = false, lastPt = null;
const PENDING = 'blaze-pending';

function scRefresh() {
  const active = tk && !tk.done, o = ticketStats();
  sc.scNote.textContent = `You have ${fmt(state.balance)} credits. Odds of winning about 1 in ${o.oneIn.toFixed(1)}, return about ${(o.rtp * 100).toFixed(0)}%. Top prize ${fmt(o.top)}\u00d7 the ticket price.`;
  sc.buy1.disabled = active || state.balance < 1;
  sc.buy5.disabled = active || state.balance < 5;
  sc.scReveal.hidden = !active;
}
function paintFoil() {
  const cv = sc.tfoil, r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1;
  cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
  const x = cv.getContext('2d'); x.scale(d, d);
  const g = x.createLinearGradient(0, 0, r.width, r.height);
  g.addColorStop(0, '#c9c9c9'); g.addColorStop(.5, '#f2f2f2'); g.addColorStop(1, '#b4b4b4');
  x.fillStyle = g; x.fillRect(0, 0, r.width, r.height);
  x.strokeStyle = 'rgba(110,110,110,.35)'; x.lineWidth = 2;
  for (let i = -r.height; i < r.width; i += 14) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + r.height, r.height); x.stroke(); }
  x.fillStyle = 'rgba(80,80,80,.65)'; x.font = '800 18px sans-serif'; x.textAlign = 'center'; x.fillText('SCRATCH HERE', r.width / 2, r.height / 2);
  sc.tfoil.style.opacity = 1; sc.tfoil.style.pointerEvents = 'auto';
}
function buyTicket(price) {
  if ((tk && !tk.done) || state.balance < price) return;
  setBalance(state.balance - price);
  tk = makeTicketData(price, randInt);
  try { localStorage.setItem(PENDING, String(tk.won)); } catch (e) {}   // paid out next load if the tab closes mid-ticket
  sc.tgrid.innerHTML = tk.cells.map(c => `<div class="tc" data-hit="${c.hit ? 1 : 0}">${c.sym === 'mult' ? `<b class="mult">${c.mult}X</b>` : `<img src="images/${c.sym}.png" alt="">`}<span>${fmt(c.amt * price)}</span></div>`).join('');
  [0, 1].forEach(i => { const b = $('bx' + i); b.textContent = tk.bonus === i ? `WIN ${fmt(BONUS[i] * price)}` : '\u2014'; b.parentNode.classList.remove('hit'); });
  sc.scResult.textContent = '';
  sc.ticket.hidden = false; paintFoil(); updateUI(); scRefresh();
}
function finishTicket() {
  if (!tk || tk.done) return;
  tk.done = true;
  sc.tfoil.style.opacity = 0; sc.tfoil.style.pointerEvents = 'none';
  sc.tgrid.querySelectorAll('.tc[data-hit="1"]').forEach(n => n.classList.add('hit'));
  if (tk.bonus >= 0) $('bx' + tk.bonus).parentNode.classList.add('hit');
  try { localStorage.removeItem(PENDING); } catch (e) {}
  if (tk.won > 0) {
    setBalance(state.balance + tk.won);
    sc.scResult.textContent = `You won ${fmt(tk.won)} credit${tk.won === 1 ? '' : 's'}!`;
    if (tk.T >= 20) sfx.big(); else sfx.win();
  } else { sc.scResult.textContent = 'No win this time.'; tone(180, 0.3, 'sine', 0.08, 0, 90); }
  updateUI(); scRefresh();
}
function scratchAt(e) {
  const r = sc.tfoil.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, c = sc.tfoil.getContext('2d');
  c.globalCompositeOperation = 'destination-out'; c.lineCap = 'round'; c.lineWidth = 34;
  c.beginPath(); c.moveTo(lastPt ? lastPt[0] : x, lastPt ? lastPt[1] : y); c.lineTo(x, y); c.stroke(); lastPt = [x, y];
}
function clearedFraction() {
  const cv = sc.tfoil, d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  let n = 0, t = 0;
  for (let i = 3; i < d.length; i += 148) { t++; if (d[i] < 128) n++; }
  return n / t;
}
sc.tfoil.addEventListener('pointerdown', e => { if (!tk || tk.done) return; scratching = true; lastPt = null; sc.tfoil.setPointerCapture(e.pointerId); scratchAt(e); });
sc.tfoil.addEventListener('pointermove', e => { if (scratching) scratchAt(e); });
['pointerup', 'pointercancel'].forEach(t => sc.tfoil.addEventListener(t, () => {
  if (!scratching) return; scratching = false; lastPt = null;
  if (clearedFraction() > 0.55) finishTicket();             // enough scratched: reveal the rest
}));
function openScratch() { if (sc.scratchDlg.open) return; scRefresh(); sc.scratchDlg.showModal(); }
sc.buy1.addEventListener('click', () => buyTicket(1));
sc.buy5.addEventListener('click', () => buyTicket(5));
sc.scReveal.addEventListener('click', finishTicket);
sc.scClose.addEventListener('click', () => sc.scratchDlg.close());
sc.scratchDlg.addEventListener('close', () => { finishTicket(); tk = null; sc.ticket.hidden = true; sc.scResult.textContent = ''; });
sc.scratchLink.addEventListener('click', openScratch);
sc.brokeScratch.addEventListener('click', openScratch);
/* ---------- Pay line guides ---------- */
const LINE_COLORS = ['#ff5a4d', '#4dd2ff', '#7dff6a', '#ffd23f', '#d98cff'];
function buildGuides() {
  el.guides.innerHTML = LINES.map((rows, i) => {
    const pts = [[0, rows[0]], ...rows.map((r, c) => [c + .5, r]), [3, rows[2]]]
      .map(([x, r]) => `${(x * 100).toFixed(0)},${r * 100 + 50}`).join(' ');
    return `<polyline points="${pts}" stroke="${LINE_COLORS[i]}"/>`;
  }).join('');
  // number tags sit where each line is unambiguous: lines 1-3 on the left, 4-5 on the right
  const tag = (i, side, row) => `<span class="tag ${side}" style="top:${(row * 100 + 50) / 3}%;background:${LINE_COLORS[i]}">${i + 1}</span>`;
  el.tags.innerHTML = LINES.map((rows, i) => i < 3 ? tag(i, 'l', rows[0]) : tag(i, 'r', rows[2])).join('');
}
el.linesBtn.addEventListener('click', () => { state.showLines = !state.showLines; save(); updateUI(); });

/* ---------- Stats & tiers ---------- */
const TIER_AT = { silver: 2500, platinum: 10000 };           // lifetime credits wagered
const tierFor = w => w >= TIER_AT.platinum ? 'platinum' : w >= TIER_AT.silver ? 'silver' : 'bronze';
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
let stats = { spins: 0, wagered: 0, won: 0, best: 0, bonuses: 0, last: [] };
try { const d = JSON.parse(localStorage.getItem('blaze-stats') || 'null'); if (d && Array.isArray(d.last)) stats = Object.assign(stats, d); } catch (e) {}
function recordSpin(bet, pay, isFree, bonus) {
  stats.spins++; stats.wagered += bet; stats.won += pay; if (pay > stats.best) stats.best = pay; if (bonus) stats.bonuses++;
  stats.last.unshift({ n: stats.spins, bet, pay, free: isFree }); stats.last.length = Math.min(stats.last.length, 10);
  try { localStorage.setItem('blaze-stats', JSON.stringify(stats)); } catch (e) {}
}
function openStats() {
  const o = odds(), act = stats.wagered ? (stats.won / stats.wagered * 100).toFixed(1) + '%' : '\u2014';
  const cells = [['Spins', fmt(stats.spins)], ['Tier', cap(tierFor(stats.wagered))], ['Total wagered', fmt(stats.wagered)], ['Total won', fmt(stats.won)],
    ['Net', (stats.won - stats.wagered >= 0 ? '+' : '\u2212') + fmt(Math.abs(stats.won - stats.wagered))], ['Biggest win', fmt(stats.best)],
    ['Your return', act], ['Machine return', (o.rtp * 100).toFixed(1) + '%'], ['Bonuses won', fmt(stats.bonuses)]];
  $('stGrid').innerHTML = cells.map(([l, v]) => `<div class="readout"><span class="label">${l}</span><span class="value">${v}</span></div>`).join('');
  $('stLast').innerHTML = stats.last.length ? stats.last.map(r =>
    `<li><span class="m">#${fmt(r.n)}${r.free ? ' free' : ''}</span><span class="m">bet ${fmt(r.bet)}</span><span class="${r.pay ? 'w' : 'm'}">${r.pay ? '+' + fmt(r.pay) : 'no win'}</span></li>`).join('')
    : '<li><span class="m">No spins yet.</span></li>';
  $('statsDlg').showModal();
}

/* ---------- Player card ---------- */
const TIERS = { bronze: 'images/card-bronze.webp', silver: 'images/card-silver.webp', platinum: 'images/card-platinum.webp' };
const pc = {};
['card','cardForm','pcard','pBg','pPhoto','pPh','pName','pId','pBank','inName','inId','inBank','inPhoto','rmPhoto','cardClose','bankHint','tierNote','restartBtn','cardBtn','cardLink','cardGo']
  .forEach(id => { pc[id] = $(id); });
let profile = null, draft = null;
try { const d = JSON.parse(localStorage.getItem('blaze-profile') || 'null'); if (d && typeof d === 'object') profile = d; } catch (e) {}
const saveProfile = () => { try { localStorage.setItem('blaze-profile', JSON.stringify(profile)); } catch (e) {} };

function drawAvatar() {
  pc.cardBtn.textContent = '';
  if (profile && profile.photo) { const im = document.createElement('img'); im.src = profile.photo; im.alt = ''; pc.cardBtn.appendChild(im); }
  else pc.cardBtn.textContent = ((profile && profile.name) || '?').charAt(0).toUpperCase();
  pc.cardBtn.title = profile ? `${profile.name} \u2014 player card` : 'Player card';
}
function drawCard() {
  pc.pcard.className = 'pcard tier-' + draft.tier;
  pc.pBg.src = TIERS[draft.tier];
  pc.pName.textContent = draft.name || 'Your name';
  pc.pName.classList.toggle('empty', !draft.name);
  pc.pId.textContent = draft.id || 'Auto';
  pc.pBank.textContent = fmt(draft.start || 0);
  pc.pPhoto.hidden = !draft.photo;
  if (draft.photo) pc.pPhoto.src = draft.photo;
  pc.pPh.hidden = !!draft.photo;
  pc.rmPhoto.hidden = !draft.photo;
}
function openCard() {
  if (pc.card.open) return;
  draft = Object.assign({ name: '', id: '', tier: 'bronze', start: START_CREDITS, photo: '' }, profile || {});
  pc.inName.value = draft.name; pc.inId.value = draft.id; pc.inBank.value = draft.start;
  draft.tier = tierFor(stats.wagered);
  const nxt = draft.tier === 'bronze' ? ['Silver', TIER_AT.silver] : draft.tier === 'silver' ? ['Platinum', TIER_AT.platinum] : null;
  pc.tierNote.textContent = `${cap(draft.tier)} member` + (nxt ? ` \u00b7 wager ${fmt(nxt[1] - stats.wagered)} more to reach ${nxt[0]}` : ' \u00b7 top tier');
  const locked = state.spinning || state.free > 0;
  pc.inBank.disabled = locked;
  pc.bankHint.textContent = locked ? 'Bank can\u2019t change during a spin or free spins.'
    : profile ? 'Changing the starting bank resets your credits to that amount.' : 'The credits you start with. You can change it any time.';
  pc.cardClose.hidden = !profile;
  pc.restartBtn.hidden = !profile; pc.restartBtn.disabled = state.spinning || state.free > 0; pc.restartBtn.textContent = 'Restart game';
  pc.cardGo.textContent = profile ? 'Save card' : 'Start playing';
  drawCard();
  pc.card.showModal();
}
pc.inName.addEventListener('input', () => { draft.name = pc.inName.value; drawCard(); });
pc.inId.addEventListener('input', () => { draft.id = pc.inId.value; drawCard(); });
pc.inBank.addEventListener('input', () => { draft.start = Math.round(Number(pc.inBank.value)) || 0; drawCard(); });
pc.rmPhoto.addEventListener('click', () => { draft.photo = ''; drawCard(); });
pc.inPhoto.addEventListener('change', () => {
  const f = pc.inPhoto.files[0]; if (!f) return;
  const url = URL.createObjectURL(f), img = new Image();
  img.onload = () => {
    const S = 360, cv = document.createElement('canvas'), m = Math.min(img.width, img.height);
    cv.width = cv.height = S;
    cv.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, S, S);
    draft.photo = cv.toDataURL('image/jpeg', 0.85); URL.revokeObjectURL(url); drawCard();
  };
  img.onerror = () => { URL.revokeObjectURL(url); pc.bankHint.textContent = 'That file could not be read as an image.'; };
  img.src = url; pc.inPhoto.value = '';
});
pc.cardForm.addEventListener('submit', e => {
  e.preventDefault();
  const first = !profile, locked = state.spinning || state.free > 0;
  const prev = profile ? profile.start : null;
  const typed = Math.min(1000000, Math.max(5, Math.round(Number(pc.inBank.value)) || START_CREDITS));
  const start = locked && profile ? profile.start : typed;
  profile = {
    name: (draft.name || '').trim().slice(0, 16) || 'Player',
    id: (draft.id || '').trim().slice(0, 10) || (profile && profile.id) || String(Math.floor(100000 + Math.random() * 900000)),
    tier: draft.tier, start, photo: draft.photo || ''
  };
  saveProfile(); drawAvatar();
  if (!locked && (first || start !== prev)) {
    setBalance(start);
    let i = BET_STEPS.length - 1;
    while (i > 0 && BET_STEPS[i] * LINES.length > state.balance) i--;
    if (state.betIdx > i) state.betIdx = i;
    save();
    say(`Welcome, ${profile.name}. Bank: ${fmt(start)}.`);
  }
  updateUI(); pc.card.close();
});
pc.cardClose.addEventListener('click', () => pc.card.close());
let restartArm = 0;
pc.restartBtn.addEventListener('click', () => {
  if (state.spinning || state.free > 0) return;
  if (!restartArm) {                                         // first tap arms it, second tap confirms
    pc.restartBtn.textContent = 'Tap again: reset credits, stats and tier';
    restartArm = setTimeout(() => { restartArm = 0; pc.restartBtn.textContent = 'Restart game'; }, 4000);
    return;
  }
  clearTimeout(restartArm); restartArm = 0;
  const start = profile ? profile.start : START_CREDITS;
  stats = { spins: 0, wagered: 0, won: 0, best: 0, bonuses: 0, last: [] };
  try { localStorage.setItem('blaze-stats', JSON.stringify(stats)); } catch (e) {}
  clearTimeout(state.timer); clearWinFx(); el.win.textContent = '0';
  state.refillAt = 0; state.autoLeft = 0; state.autoMode = 0;
  setBalance(start);
  let i = BET_STEPS.length - 1;
  while (i > 0 && BET_STEPS[i] * LINES.length > state.balance) i--;
  state.betIdx = Math.min(state.betIdx, i); save();
  say(`Fresh start. Bank: ${fmt(start)}.`); updateUI(); pc.card.close();
});
pc.card.addEventListener('cancel', e => { if (!profile) e.preventDefault(); });   // first run: card must be filled in
pc.cardBtn.addEventListener('click', openCard);
pc.cardLink.addEventListener('click', openCard);

/* ---------- Paytable + boot ---------- */
function buildPaytable() {
  const order = ['wild', 'seven', 'diamond', 'gem', 'bar3', 'bar2', 'bar', 'bell', 'cherry', 'liberty'];
  el.paygrid.innerHTML = order.map(id => {
    const s = SYMBOLS[id];
    const text = id === 'liberty' ? `<b>${FREE_SPINS_AWARD}</b><span>free spins</span>` : `<b>${s.pay}&times;</b><span>${s.name}</span>`;
    return `<div class="pay"><img src="${IMG(id)}" alt="">${id === 'liberty' ? `<div><b>${FREE_SPINS_AWARD} spins</b><span>${s.name}, 3 anywhere</span></div>` : `<div><b>${s.pay}&times;</b><span>${s.name}</span></div>`}</div>`;
  }).join('');
}

load();
try {                                                       // a ticket left unfinished by a closed tab still pays
  const p = Number(localStorage.getItem(PENDING));
  if (p > 0) { state.balance += p; save(); }
  localStorage.removeItem(PENDING);
} catch (e) {}
buildPaytable();
buildGuides();
[0, 1, 2].forEach(c => renderStatic(c, [symAt(c, 5), symAt(c, 6), symAt(c, 7)]));
updateUI();
drawAvatar();
if (!profile) openCard();
})();
