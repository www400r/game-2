// ===== Pixel Gunner — зомби-апокалипсис =====
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = 480, H = 800;

// ---------- Уровни ----------
const DIFF = ['Лёгкий', 'Средний', 'Сложный', 'Очень сложный', 'АД'];
const LEVELS = Array.from({ length: 20 }, (_, i) => ({
  d: i * 4 / 19,                                   // «градус сложности» 0..4
  n: 12 + i * 2,                                   // зомби на уровне
  every: Math.max(18, 56 - i * 2),                 // как часто появляются
  bs: 2.6 + i * 0.1,                               // скорость плевков
  rate: 1 + i * 0.075,                             // частота очередей
  boss: Math.round(30 + i * 5.3),                  // здоровье босса
  mix: i < 3 ? ['grunt'] : i < 7 ? ['grunt', 'grunt', 'aimer'] : i < 12 ? ['grunt', 'aimer', 'runner', 'heavy'] : ['aimer', 'aimer', 'runner', 'heavy', 'grunt']
}));
// Локации: имя, земля, дорога, разметка, бордюр, декор, палитра декора, оттенок, пятна
const THEMES = [
  ['Пригород', '#24472b', '#2e353f', 'dash', '#9aa0a6', 'roof', ['#b5483a', '#3a6ea5', '#8a6a3b', '#6b4a8a', '#4a8a6b'], 'rgba(0,0,25,0)', '#5a1515'],
  ['Школьный двор', '#3b6b3a', '#6b6b72', 'dash', '#d0d0d0', 'roof', ['#a0522d', '#c0703a', '#8a4a2a'], 'rgba(0,0,0,0)', '#5a1515'],
  ['Парк', '#2f6f3a', '#8a7a5a', 'none', '#6a5a3a', 'tree', ['#1d5a2a', '#2f8a3f'], 'rgba(0,20,0,.08)', '#5a1515'],
  ['Кладбище', '#2a3a2e', '#3a3a40', 'none', '#555', 'stone', ['#8a8f98'], 'rgba(30,0,60,.28)', '#2a0f3a'],
  ['Рынок', '#6b5a3a', '#4a4038', 'dash', '#8a7a5a', 'box', ['#d33', '#3a8ad3', '#e0b030', '#3aa05a'], 'rgba(0,0,0,0)', '#5a1515'],
  ['Заправка', '#3a3d42', '#26282c', 'dash', '#aaa', 'box', ['#d33', '#eee', '#fc3'], 'rgba(255,150,0,.1)', '#5a1515'],
  ['Больница', '#5d7a85', '#9aa7ad', 'dash', '#e8eef0', 'roof', ['#e8eef0', '#d0dde2', '#c0d0d8'], 'rgba(0,40,60,.15)', '#7a1a1a'],
  ['Склады', '#4a4a44', '#3a3a38', 'dash', '#777', 'box', ['#6a6a60', '#4a6a4a', '#7a5a3a'], 'rgba(0,0,0,.05)', '#5a1515'],
  ['Железная дорога', '#3b4a2f', '#4a4036', 'rail', '#2a2a2a', 'tree', ['#1d4a22', '#2f7a3a'], 'rgba(0,0,0,.05)', '#5a1515'],
  ['Порт', '#1f4f7a', '#5a5a60', 'dash', '#999', 'box', ['#c0392b', '#2980b9', '#27ae60', '#f39c12'], 'rgba(0,30,60,.15)', '#5a1515'],
  ['Лес', '#17381f', '#3a2f22', 'none', '#2a2015', 'tree', ['#0f2f18', '#1f5a2c'], 'rgba(0,10,20,.32)', '#4a1010'],
  ['Пустыня', '#c9a56a', '#3a3a3a', 'dash', '#888', 'stone', ['#8a7a5a'], 'rgba(255,160,0,.14)', '#6a2a10'],
  ['Мост', '#2b5f8a', '#6a6e75', 'dash', '#aaa', 'stone', ['#9aa0a6'], 'rgba(0,40,80,.15)', '#5a1515'],
  ['Промзона', '#3a3030', '#2a2a2e', 'dash', '#666', 'box', ['#7a4a2a', '#555', '#9a3a2a'], 'rgba(80,60,0,.18)', '#3a5a10'],
  ['Стройка', '#6b5a3a', '#54483a', 'dash', '#aa9a6a', 'box', ['#f1c40f', '#e67e22'], 'rgba(0,0,0,0)', '#5a1515'],
  ['Аэропорт', '#4a5a4a', '#2b2b30', 'dash', '#ccc', 'roof', ['#9aa7b0', '#7e8c96', '#b0bcc4'], 'rgba(0,0,30,.1)', '#5a1515'],
  ['Военная база', '#3a4a2a', '#4a4a3a', 'dash', '#5a5a3a', 'box', ['#4a5a3a', '#5a6a45', '#3a4a2a'], 'rgba(0,40,0,.14)', '#5a1515'],
  ['Лаборатория', '#20303a', '#aab6bd', 'grid', '#5de0ff', 'box', ['#2de0c0', '#9b30ff'], 'rgba(0,255,200,.10)', '#3a8a1a'],
  ['Центр города', '#2a2a33', '#1f1f26', 'dash', '#777', 'roof', ['#4a5a70', '#5a6a80', '#3a4a5a'], 'rgba(20,0,60,.22)', '#5a1515'],
  ['Логово зомби', '#3a0f0f', '#2a1010', 'dash', '#7a2a10', 'roof', ['#7a1a1a', '#a52a10', '#5a0f0f'], 'rgba(255,60,0,.22)', '#ff6a00']
].map(([n, g, r, m, cb, d, pal, t, sp]) => ({ n, g, r, m, cb, d, pal, t, sp }));
const PRAISE = ['Отлично!', 'Так держать!', 'Зомби в шоке!', 'Ты машина!', 'Чистая работа!'];

// ---------- Звук (синтез, без файлов) ----------
let ac = null, master = null, muted = false;
try { muted = localStorage.getItem('muted') === '1'; } catch (e) {}
function initAudio() {
  if (!ac) {
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(ac.destination);
    } catch (e) { ac = null; return; }
  }
  if (ac.state === 'suspended') ac.resume();
}
function setMuted(m) {
  muted = m; if (master) master.gain.value = m ? 0 : 0.5;
  try { localStorage.setItem('muted', m ? '1' : '0'); } catch (e) {}
}
function tone(f, d, type = 'square', v = 0.1, t = 0, to) {
  if (!ac) return;
  const s = ac.currentTime + t, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, s);
  if (to) o.frequency.exponentialRampToValueAtTime(to, s + d);
  g.gain.setValueAtTime(v, s); g.gain.exponentialRampToValueAtTime(0.001, s + d);
  o.connect(g); g.connect(master); o.start(s); o.stop(s + d + 0.02);
}
let noiseBuf = null;
function noise(d, v = 0.15, t = 0) {
  if (!ac) return;
  if (!noiseBuf) {
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const a = noiseBuf.getChannelData(0);
    for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
  }
  const s = ac.currentTime + t, n = ac.createBufferSource(), g = ac.createGain();
  n.buffer = noiseBuf; g.gain.setValueAtTime(v, s); g.gain.exponentialRampToValueAtTime(0.001, s + d);
  n.connect(g); g.connect(master); n.start(s); n.stop(s + d);
}
const SFX = {
  shoot: () => tone(700, 0.07, 'square', 0.04, 0, 200),
  spit:  () => tone(150, 0.08, 'sawtooth', 0.03, 0, 80),
  hit:   () => tone(220, 0.06, 'square', 0.06, 0, 120),
  die:   () => { noise(0.18, 0.12); tone(180, 0.2, 'sawtooth', 0.08, 0, 50); },
  boom:  () => { noise(0.8, 0.3); tone(120, 0.8, 'sawtooth', 0.15, 0, 30); },
  hurt:  () => { noise(0.25, 0.2); tone(260, 0.3, 'sawtooth', 0.12, 0, 60); },
  pick:  () => { tone(660, 0.09, 'square', 0.08); tone(990, 0.14, 'square', 0.08, 0.09); },
  crate: () => noise(0.2, 0.12),
  start: () => { tone(440, 0.1, 'square', 0.07); tone(660, 0.15, 'square', 0.07, 0.1); },
  win:   () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'square', 0.09, i * 0.13)); [1047, 1319, 1568].forEach(f => tone(f, 0.6, 'triangle', 0.08, 0.55)); },
  lose:  () => { [330, 262, 208].forEach((f, i) => tone(f, 0.2, 'square', 0.11, 0.25 + i * 0.26)); tone(110, 0.7, 'sawtooth', 0.1, 1.05, 55); }   // ту-ту-ту...
};
const sfx = n => SFX[n] && SFX[n]();
function buzz(style) {   // вибро-отклик (Capacitor Haptics на iPhone, иначе navigator.vibrate)
  try { const Hp = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Haptics; if (Hp) Hp.impact({ style }); else if (navigator.vibrate) navigator.vibrate(style === 'HEAVY' ? 60 : 15); } catch (e) {}
}

// Музыка: тёмный минорный луп (Am - F - C - G)
const CH = [[110, [220, 262, 330]], [87.3, [175, 220, 262]], [131, [262, 330, 392]], [98, [196, 247, 294]]];
let mStep = 0, mNext = 0;
function musicTick() {
  if (!ac || muted) return;
  if (!(state === 'play' || state === 'menu' || state === 'intro')) { mNext = 0; return; }
  if (mNext < ac.currentTime) mNext = ac.currentTime + 0.05;
  const dur = 60 / (state === 'play' ? 118 + LEVELS[li].d * 10 : 90) / 2;
  while (mNext < ac.currentTime + 0.2) {
    const [root, ar] = CH[(mStep >> 3) & 3], t = mNext - ac.currentTime;
    if (mStep % 2 === 0) tone(root, dur * 1.6, 'sawtooth', 0.07, t);
    tone(ar[mStep % 3] * (mStep % 4 === 3 ? 2 : 1), dur * 0.9, 'triangle', 0.05, t);
    if (state === 'play' && mStep % 4 === 0) noise(0.05, 0.04, t);
    mNext += dur; mStep++;
  }
}
setInterval(musicTick, 60);

// ---------- Пиксельные спрайты ----------
const HUM = ['..HHHH..', '.HHSSHH.', '..SSSS..', '.BBBBBB.', 'BBBBBBBB', 'SBBBBBBS', '.BBBBBB.', '.LL..LL.', '.LL..LL.', 'LLL..LLL'];
const ZOM = ['..HHHH..', '.HSSSSH.', '.SESSES.', '..SMMS..', 'SSBBBBSS', 'S.BBBB.S', '..BBBB..', '..BBBB..', '..LL.LL.', '..LL.LL.'];
function mk(spr, pal, sc) {
  const c = document.createElement('canvas');
  c.width = 8 * sc; c.height = 10 * sc;
  const g = c.getContext('2d');
  spr.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x * sc, y * sc, sc, sc); } }));
  return c;
}
const zp = (S, B, L, H = '#1d2412') => ({ H, S, E: '#ff3030', M: '#2b1a1a', B, L });
const TYPES = {
  player: { sc: 3, hp: 1, img: mk(HUM, { H: '#243b8f', S: '#f1c27d', B: '#3d7bff', L: '#1c2b5a' }, 3) },
  grunt:  { sc: 4, hp: 1, img: mk(ZOM, zp('#7fb069', '#a33a3a', '#3b2f4a'), 4) },           // обычный зомби
  aimer:  { sc: 4, hp: 2, img: mk(ZOM, zp('#b4e05c', '#4e8a3a', '#22304a', '#3d5c14'), 4) }, // плевальщик
  runner: { sc: 3, hp: 1, img: mk(ZOM, zp('#9ab86a', '#e0b030', '#4a3d0a'), 3) },           // быстрый
  heavy:  { sc: 5, hp: 6, img: mk(ZOM, zp('#6f8f7a', '#5b4b8a', '#2a2a3a', '#222'), 5) },   // здоровяк
  boss:   { sc: 9, hp: 1, img: mk(ZOM, zp('#5f9f50', '#6a1b9a', '#2a0a3a', '#111'), 9) }    // король зомби
};

// ---------- Состояние ----------
let state = 'menu';   // menu | intro | play | levelup | over | win
let li = 0, score = 0, levelStartScore = 0, lives = 3, deaths = 0, shake = 0, scroll = 0, praise = '';
let best = 0;
try { best = +localStorage.getItem('best') || 0; } catch (e) {}
let player = { x: W / 2, y: H - 100, cd: 0 }, bullets = [], enemies = [], eBullets = [], drops = [], particles = [], covers = [], conf = [];
let spawned = 0, spawnT = 0, invuln = 0, bossSpawned = false, bossRef = null;
let saved = 0, fresh = false;
try { saved = +localStorage.getItem('lvl') || 0; } catch (e) {}
function saveLvl(n) { saved = Math.max(saved, n); try { localStorage.setItem('lvl', saved); } catch (e) {} }
let buff = { rapid: 0, triple: 0, shield: 0 }, combo = 0, comboT = 0, lvStars = [];
try { lvStars = JSON.parse(localStorage.getItem('stars') || '[]'); } catch (e) {}
const keys = {};
const ptrs = {};
const FIRE = { x: W - 70, y: H - 95, r: 54 };
const MUTE = { x: W - 26, y: 66, r: 18 };
const PAUSE = { x: 26, y: 66, r: 18 };

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const hash = i => { const x = Math.sin(i * 127.1) * 43758.5453; return x - Math.floor(x); };
function overlap(a, b) { return Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2; }
function boom(x, y, color, n = 14) {
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = rnd(1, 4); particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 28, color }); }
}
function celebrate(n) {
  conf = Array.from({ length: n }, () => ({ x: rnd(0, W), y: rnd(-H, 0), vx: rnd(-1, 1), vy: rnd(1.5, 4), c: pick(['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#ff9f1c', '#fff']), s: rnd(5, 9) }));
}

function startLevel() {
  player = { x: W / 2, y: H - 100, cd: 0 };
  bullets = []; enemies = []; eBullets = []; drops = []; particles = []; conf = [];
  spawned = 0; spawnT = 0; invuln = 90; bossSpawned = false; bossRef = null;
  covers = [70, 190, 300, 410].map(cx => ({ x: cx + rnd(-25, 25), y: rnd(330, 560), w: 64, h: 34, hp: 14, max: 14 }));
  lives = 3; state = 'play'; sfx('start'); buff = { rapid: 0, triple: 0, shield: 0 }; combo = 0; comboT = 0;
}

function makeEnemy(type, x) {
  const t = TYPES[type], L = LEVELS[li];
  return { type, x, bx: x, y: type === 'boss' ? -90 : -40, t: 0, w: t.sc * 8 - 4, h: t.sc * 10 - 4,
    hp: type === 'boss' ? L.boss : t.hp, maxHp: type === 'boss' ? L.boss : t.hp,
    cd: rnd(30, 90) / L.rate, shots: 0, bt: 0, hid: false, settled: false };
}
function fire(e, ang, spd) { eBullets.push({ x: e.x, y: e.y + e.h / 2, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, w: 8, h: 8 }); }
function burst(e, n, pause, gap, fn) {   // очередь из n плевков
  if (e.shots > 0) {
    if (--e.bt <= 0) { fn(); sfx('spit'); e.shots--; e.bt = gap; if (e.shots === 0) e.cd = pause; }
  } else if (--e.cd <= 0 && e.y > 0) { e.shots = n; e.bt = 0; }
}
const blockedAt = (x, y) => covers.some(c => overlap({ x, y: y + 2, w: 18, h: 26 }, c));
const aimAt = e => Math.atan2(player.y - e.y, player.x - e.x);

function hurt() {
  if (buff.shield > 0) { buff.shield = 0; invuln = 60; sfx('crate'); boom(player.x, player.y, '#5de0ff', 18); return; }
  combo = 0; buzz('HEAVY');
  lives--; invuln = 110; shake = 12;
  boom(player.x, player.y, '#3d7bff', 26); sfx('hurt');
  if (lives <= 0) { deaths++; state = 'over'; sfx('lose'); }
}

// ---------- Логика ----------
function update() {
  scroll += 0.8;
  if (shake > 0) shake--;
  if (state === 'levelup' || state === 'win') conf.forEach(c => { c.x += c.vx + Math.sin(c.y / 30); c.y += c.vy; if (c.y > H) c.y = -10; });
  if (state !== 'play') return;
  const L = LEVELS[li];

  for (const k in buff) if (buff[k] > 0) buff[k]--;
  if (comboT > 0 && --comboT === 0) combo = 0;
  let dx = 0, dy = 0;
  if (keys.ArrowLeft || keys.KeyA) dx -= 4.2;
  if (keys.ArrowRight || keys.KeyD) dx += 4.2;
  if (keys.ArrowUp || keys.KeyW) dy -= 4.2;
  if (keys.ArrowDown || keys.KeyS) dy += 4.2;
  const mp = Object.values(ptrs).find(p => p.role === 'move');
  if (mp) {
    const vx = mp.x - player.x, vy = mp.y - 70 - player.y, d = Math.hypot(vx, vy);
    if (d > 4) { const s2 = Math.min(d * 0.3, 7); dx += vx / d * s2; dy += vy / d * s2; }
  }
  if (!blockedAt(player.x + dx, player.y)) player.x += dx;
  if (!blockedAt(player.x, player.y + dy)) player.y += dy;
  player.x = Math.max(16, Math.min(W - 16, player.x));
  player.y = Math.max(60, Math.min(H - 30, player.y));

  const firing = keys.Space || keys.KeyJ || keys.KeyK || Object.values(ptrs).some(p => p.role === 'fire');
  if (player.cd > 0) player.cd--;
  if (firing && player.cd <= 0) {
    const shot = vx => bullets.push({ x: player.x + 9, y: player.y - 22, w: 5, h: 14, vx });
    shot(0); if (buff.triple > 0) { shot(-2.5); shot(2.5); }
    player.cd = buff.rapid > 0 ? 5 : 9; sfx('shoot');
  }
  bullets.forEach(b => { b.y -= 12; b.x += b.vx || 0; });
  bullets = bullets.filter(b => b.y > -20);

  if (spawned < L.n) {
    if (++spawnT >= L.every) { spawnT = 0; spawned++; enemies.push(makeEnemy(pick(L.mix), rnd(40, W - 40))); }
  } else if (!bossSpawned && enemies.length === 0) {
    bossSpawned = true; bossRef = makeEnemy('boss', W / 2); enemies.push(bossRef);
  }

  enemies.forEach(e => {
    e.t++;
    const burstN = 3 + Math.floor(L.d / 2);
    if (e.type === 'grunt') {
      e.y += 1 + L.d * 0.2; e.x = e.bx + Math.sin(e.t / 30) * 40;
      burst(e, burstN, rnd(90, 150) / L.rate, 6, () => fire(e, Math.PI / 2, L.bs));
    } else if (e.type === 'aimer') {
      if (!e.settled) { e.y += 1.6; if (e.y >= 110 + (e.bx % 90)) e.settled = true; } else e.x += Math.sin(e.t / 40) * 1.2;
      burst(e, burstN, rnd(100, 160) / L.rate, 6, () => fire(e, aimAt(e), L.bs));
      e.hid = e.settled && e.shots === 0 && e.cd > 25;
    } else if (e.type === 'runner') {
      e.y += 3 + L.d * 0.3; e.x += Math.sign(player.x - e.x) * 1.4;
    } else if (e.type === 'heavy') {
      if (!e.settled) { e.y += 0.7; if (e.y >= 150) e.settled = true; } else e.x += Math.sin(e.t / 60) * 0.8;
      burst(e, 2, rnd(110, 160) / L.rate, 12, () => { const a = aimAt(e); [-0.3, 0, 0.3].forEach(d => fire(e, a + d, L.bs * 0.9)); });
      e.hid = e.settled && e.shots === 0 && e.cd > 25;
    } else if (e.type === 'boss') {
      if (e.y < 120) e.y += 1; else e.x = W / 2 + Math.sin(e.t / 70) * 170;
      const angry = e.hp < e.maxHp / 2 ? 1.5 : 1;
      burst(e, 5 + Math.round(L.d), rnd(60, 90) / (L.rate * angry), 5, () => fire(e, aimAt(e), L.bs * 1.1));
      if (e.y >= 120 && e.t % Math.floor(95 / (L.rate * angry)) === 0) {
        const n = 8 + Math.round(L.d * 2), off = rnd(0, 6.28);
        for (let i = 0; i < n; i++) fire(e, off + i * 6.28 / n, L.bs * 0.8);
        sfx('crate');
      }
    }
  });
  eBullets.forEach(b => { b.x += b.vx; b.y += b.vy; });
  eBullets = eBullets.filter(b => b.y < H + 20 && b.y > -40 && b.x > -20 && b.x < W + 20);
  enemies = enemies.filter(e => e.y < H + 60);
  eBullets = eBullets.filter(b => {
    const c = covers.find(c => overlap(b, c));
    if (c) { c.hp--; boom(b.x, b.y, '#c9a46a', 3); return false; }
    return true;
  });
  covers = covers.filter(c => { if (c.hp <= 0) { boom(c.x, c.y, '#8a6a3b', 20); sfx('crate'); return false; } return true; });

  bullets.forEach(b => enemies.forEach(e => {
    if (!b.dead && e.hp > 0 && overlap(b, e)) {
      if (e.hid) { b.dead = true; boom(b.x, b.y, '#c9a46a', 3); return; }
      b.dead = true; e.hp--;
      if (e.hp <= 0) {
        combo++; comboT = 120; score += (e.type === 'boss' ? 200 : 10) * Math.min(5, 1 + Math.floor(combo / 5));
        if (e.type === 'boss') buzz('HEAVY');
        boom(e.x, e.y, '#8fd45a', e.type === 'boss' ? 60 : 14); boom(e.x, e.y, '#b03030', e.type === 'boss' ? 30 : 6);
        sfx(e.type === 'boss' ? 'boom' : 'die');
        if (e.type !== 'boss' && Math.random() < 0.1) drops.push({ x: e.x, y: e.y, w: 18, h: 18, k: pick(['heal', 'rapid', 'triple', 'shield']) });
      } else { boom(b.x, b.y, '#b4e05c', 3); sfx('hit'); }
    }
  }));
  bullets = bullets.filter(b => !b.dead);
  enemies = enemies.filter(e => e.hp > 0);

  const hb = { x: player.x, y: player.y + 2, w: 10, h: 14 };
  if (invuln > 0) invuln--;
  else if (eBullets.some(b => overlap(b, hb))) { eBullets = eBullets.filter(b => !overlap(b, hb)); hurt(); }
  else if (enemies.some(e => e.type !== 'boss' && overlap(e, hb))) { enemies = enemies.filter(e => !overlap(e, hb)); hurt(); }

  drops.forEach(d => d.y += 1.5);
  drops = drops.filter(d => { if (overlap(d, hb)) { if (d.k === 'heal') lives = Math.min(5, lives + 1); else buff[d.k] = 600; sfx('pick'); buzz('LIGHT'); return false; } return d.y < H + 20; });
  particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
  particles = particles.filter(p => p.life > 0);

  if (state === 'play' && bossSpawned && enemies.length === 0) {
    score += 100;
    if (score > best) { best = score; try { localStorage.setItem('best', best); } catch (e) {} }
    praise = pick(PRAISE);
    lvStars[li] = Math.max(lvStars[li] || 0, deaths === 0 ? 3 : deaths < 3 ? 2 : 1);
    try { localStorage.setItem('stars', JSON.stringify(lvStars)); } catch (e) {}
    saveLvl(Math.min(li + 1, LEVELS.length - 1));
    state = li >= LEVELS.length - 1 ? 'win' : 'levelup';
    celebrate(state === 'win' ? 260 : 140); sfx('win');
  }
}

// ---------- Отрисовка ----------
const vig = (() => {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), gr = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,25,.6)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H); return c;
})();
function drawScene(T) {
  ctx.fillStyle = T.g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = T.r; ctx.fillRect(64, 0, 352, H);
  ctx.fillStyle = T.cb; ctx.fillRect(60, 0, 4, H); ctx.fillRect(416, 0, 4, H);
  if (T.m === 'dash') { ctx.fillStyle = '#e8c547'; for (let d = -(scroll % 80); d < H; d += 80) ctx.fillRect(238, d, 4, 40); }
  else if (T.m === 'rail') {
    ctx.fillStyle = '#5a4630'; for (let d = -(scroll % 28); d < H; d += 28) ctx.fillRect(110, d, 260, 8);
    ctx.fillStyle = '#b8b8b8'; ctx.fillRect(160, 0, 4, H); ctx.fillRect(316, 0, 4, H);
  } else if (T.m === 'grid') {
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    for (let d = -(scroll % 88); d < H; d += 88) ctx.fillRect(64, d, 352, 2);
    for (let x = 152; x < 416; x += 88) ctx.fillRect(x, 0, 2, H);
  }
  const base = Math.floor(scroll / 220);
  for (let idx = base + 1, y; (y = scroll - idx * 220) < H; idx--) {
    const r1 = hash(idx), r2 = hash(idx + 99), r3 = hash(idx + 7);
    ctx.fillStyle = T.sp; ctx.fillRect(90 + r1 * 300, y + 60, 14, 8); ctx.fillRect(100 + r1 * 300, y + 66, 6, 6);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(100 + r2 * 280, y + 140, 18, 3); ctx.fillRect(108 + r2 * 280, y + 143, 3, 12);
    [[2, r1, 0], [430, r2, 1]].forEach(([hx, r, k]) => {
      const col = T.pal[Math.floor(r * T.pal.length)];
      if (T.d === 'roof') {
        const hh = 70 + r * 30, top = y + 20;
        ctx.fillStyle = '#1a1410'; ctx.fillRect(hx - 2, top - 2, 52, hh + 4);
        ctx.fillStyle = col; ctx.fillRect(hx, top, 48, hh);
        ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(hx, top, 48, 8); ctx.fillRect(hx + 22, top, 4, hh);
        ctx.fillStyle = '#2a2a2a'; ctx.fillRect(hx + (k ? 6 : 32), top + 14, 10, 10);
      } else if (T.d === 'tree') {
        [30, 130].forEach(o => { const tx = hx + 24 + (r3 - 0.5) * 20; ctx.fillStyle = T.pal[0]; ctx.fillRect(tx - 16, y + o, 32, 32); ctx.fillStyle = T.pal[1]; ctx.fillRect(tx - 10, y + o + 5, 14, 14); });
      } else if (T.d === 'stone') {
        [20, 80, 140, 190].forEach((o, j) => { const sx = hx + 8 + ((j * 37 + r * 50) % 30); ctx.fillStyle = T.pal[0]; ctx.fillRect(sx, y + o, 14, 20); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(sx, y + o + 14, 14, 6); });
      } else {
        const hh = 60 + r * 50, top = y + 25;
        ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(hx - 2, top - 2, 52, hh + 4);
        ctx.fillStyle = col; ctx.fillRect(hx, top, 48, hh);
        ctx.fillStyle = 'rgba(0,0,0,.22)'; for (let q = 6; q < 48; q += 10) ctx.fillRect(hx + q, top, 3, hh);
      }
    });
  }
  if (T.t) { ctx.fillStyle = T.t; ctx.fillRect(0, 0, W, H); }
}

function text(str, y, size, color = '#fff', align = 'center', x = W / 2) {
  ctx.fillStyle = color; ctx.font = `bold ${size}px monospace`; ctx.textAlign = align; ctx.fillText(str, x, y);
}
function sprite(type, x, y) { const img = TYPES[type].img; ctx.drawImage(img, Math.round(x - img.width / 2), Math.round(y - img.height / 2)); }

function draw() {
  ctx.save();
  if (shake > 0) ctx.translate(rnd(-1, 1) * shake * 0.6, rnd(-1, 1) * shake * 0.6);
  drawScene(THEMES[li]);
  if (state !== 'menu') {
    covers.forEach(c => {
      const k = c.hp / c.max;
      ctx.fillStyle = '#4d3a1c'; ctx.fillRect(c.x - c.w / 2, c.y - c.h / 2, c.w, c.h);
      ctx.fillStyle = k > 0.5 ? '#8a6a3b' : '#6b5230'; ctx.fillRect(c.x - c.w / 2 + 4, c.y - c.h / 2 + 4, c.w - 8, c.h - 8);
      ctx.fillStyle = '#a98450'; ctx.fillRect(c.x - c.w / 2 + 4, c.y - c.h / 2 + 4, c.w - 8, 6);
      if (k <= 0.5) { ctx.fillStyle = '#2b1f0e'; ctx.fillRect(c.x - 12, c.y - 8, 4, 18); ctx.fillRect(c.x + 8, c.y - 12, 4, 14); }
    });
    const DC = { heal: '#e22', rapid: '#ffd23a', triple: '#4da3ff', shield: '#5de0ff' }, DL = { heal: '+', rapid: '»', triple: '≡', shield: 'O' };
    drops.forEach(d => { ctx.fillStyle = '#fff'; ctx.fillRect(d.x - 10, d.y - 10, 20, 20); ctx.fillStyle = DC[d.k]; ctx.fillRect(d.x - 8, d.y - 8, 16, 16); text(DL[d.k], d.y + 6, 16, '#fff', 'center', d.x); });
    enemies.forEach(e => {
      const bob = Math.round(Math.sin(e.t / 7)) * 2;                           // зомби шатается
      const rubble = () => { ctx.fillStyle = '#555b63'; ctx.fillRect(e.x - 24, e.y + 4, 48, 20); ctx.fillStyle = '#8b929b'; ctx.fillRect(e.x - 24, e.y + 4, 48, 6); };
      const cover = e.type === 'aimer' || e.type === 'heavy';
      if (e.hid) { sprite(e.type, e.x, e.y + 16); rubble(); }
      else { if (cover) rubble(); sprite(e.type, e.x, e.y + bob); }
      if (e.hp > 1 && e.type !== 'boss') { ctx.fillStyle = '#000'; ctx.fillRect(e.x - 14, e.y - e.h / 2 - 8, 28, 4); ctx.fillStyle = '#f33'; ctx.fillRect(e.x - 14, e.y - e.h / 2 - 8, 28 * e.hp / e.maxHp, 4); }
    });
    if (state !== 'over' && invuln % 10 < 6) { sprite('player', player.x, player.y); ctx.fillStyle = '#222'; ctx.fillRect(player.x + 7, player.y - 18, 5, 14); }
    if (buff.shield > 0 && state !== 'over') { ctx.strokeStyle = 'rgba(93,224,255,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(player.x, player.y, 26, 0, 6.29); ctx.stroke(); }
    bullets.forEach(b => { ctx.fillStyle = 'rgba(255,225,77,.3)'; ctx.fillRect(b.x - 4, b.y - 9, 9, 18); ctx.fillStyle = '#ffe14d'; ctx.fillRect(b.x - 2, b.y - 7, b.w, b.h); });
    eBullets.forEach(b => {                                                    // ядовитые плевки
      const x = Math.round(b.x), y = Math.round(b.y);
      ctx.fillStyle = 'rgba(120,255,60,.35)'; ctx.fillRect(x - 7, y - 7, 14, 14);
      ctx.fillStyle = '#7dff3a'; ctx.fillRect(x - 4, y - 4, 8, 8); ctx.fillStyle = '#eaffc0'; ctx.fillRect(x - 2, y - 2, 4, 4);
    });
    particles.forEach(p => { ctx.globalAlpha = p.life / 28; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 4, 4); });
    ctx.globalAlpha = 1;
    ctx.drawImage(vig, 0, 0);

    if (state === 'play') {
      const down = Object.values(ptrs).some(p => p.role === 'fire') || keys.Space;
      ctx.fillStyle = down ? 'rgba(255,60,60,.75)' : 'rgba(255,60,60,.35)';
      ctx.beginPath(); ctx.arc(FIRE.x, FIRE.y, FIRE.r, 0, 6.29); ctx.fill();
      text('ОГОНЬ', FIRE.y + 6, 18, '#fff', 'center', FIRE.x);
    }
    text('Счёт ' + score, 26, 16, '#fff', 'left', 10);
    text((li + 1) + '. ' + THEMES[li].n, 26, 16, '#ffd166', 'center');
    text('♥'.repeat(Math.max(lives, 0)), 26, 18, '#ff4d4d', 'right', W - 10);
    const bm = Math.min(5, 1 + Math.floor(combo / 5));
    if (bm > 1) text('КОМБО x' + bm, 78, 18, '#ffca3a');
    [['rapid', '#ffd23a', '»'], ['triple', '#4da3ff', '≡'], ['shield', '#5de0ff', 'O']].forEach(([k, c, l], i) => { if (buff[k] > 0) { ctx.fillStyle = c; ctx.fillRect(10, 96 + i * 22, 60 * buff[k] / 600, 8); text(l, 104 + i * 22, 14, c, 'left', 76); } });
    if (bossRef && bossRef.hp > 0) { ctx.fillStyle = '#000'; ctx.fillRect(60, 40, 360, 10); ctx.fillStyle = '#9b30ff'; ctx.fillRect(60, 40, 360 * bossRef.hp / bossRef.maxHp, 10); }
  } else ctx.drawImage(vig, 0, 0);
  ctx.restore();

  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.arc(MUTE.x, MUTE.y, MUTE.r, 0, 6.29); ctx.fill();
  text(muted ? '×' : '♪', MUTE.y + 7, 20, '#fff', 'center', MUTE.x);
  if (state === 'play') { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.arc(PAUSE.x, PAUSE.y, PAUSE.r, 0, 6.29); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(PAUSE.x - 6, PAUSE.y - 7, 4, 14); ctx.fillRect(PAUSE.x + 2, PAUSE.y - 7, 4, 14); }

  if (state === 'menu') { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, W, H); }
  else if (state === 'over') { ctx.fillStyle = 'rgba(110,0,0,.65)'; ctx.fillRect(0, 0, W, H); }
  else if (state !== 'play') { ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, H); }

  conf.forEach(c => { ctx.fillStyle = c.c; ctx.fillRect(c.x, c.y, c.s, c.s * 0.6); });
  const pulse = Math.sin(scroll / 6) * 3;
  if (state === 'menu') {
    text('PIXEL GUNNER', 270, 40, '#8fd45a');
    text('Зомби-апокалипсис. 20 локаций.', 320, 16, '#fff');
    text('Рекорд: ' + best, 355, 18, '#9fb3ff');
    text(saved > 0 ? 'Продолжить: уровень ' + (Math.min(saved, 19) + 1) : 'Нажми, чтобы начать', 450, 22);
    text('▶ Выбор уровня', 650, 18, '#ff9f7a');
    text('ПК: WASD — идти, пробел — стрелять', 510, 14, '#ccc');
    text('Телефон: палец — идти, кнопка ОГОНЬ — стрелять', 532, 14, '#ccc');
    text('Прячься за ящиками, они держат плевки', 554, 14, '#ccc');
    text('Зомби плюются очередями и прячутся за обломками', 576, 14, '#ccc');
    text('M — звук вкл/выкл', 598, 14, '#ccc');
  } else if (state === 'intro') {
    text('Уровень ' + (li + 1) + ' / ' + LEVELS.length, 320, 32, '#ffd166');
    text(THEMES[li].n, 372, 30);
    text(DIFF[Math.round(LEVELS[li].d)], 410, 18, '#ff9f7a');
    text('Нажми, чтобы начать', 460, 18, '#ccc');
  } else if (state === 'levelup' || state === 'win') {
    const stars = deaths === 0 ? '★★★' : deaths < 3 ? '★★☆' : '★☆☆';
    text(state === 'win' ? 'ПОБЕДА!' : 'УРОВЕНЬ ПРОЙДЕН!', 300, 36 + pulse, '#ffd166');
    text(state === 'win' ? 'Город спасён, зомби повержены!' : praise, 350, 20, '#7dff7d');
    text(stars, 410, 44, '#ffca3a');
    text('Счёт: ' + score + (state === 'win' ? '   Рекорд: ' + best : ''), 460, 18);
    text(state === 'win' ? 'Нажми, чтобы сыграть заново' : 'Нажми, чтобы продолжить', 520, 18, '#ccc');
  } else if (state === 'pause') {
    text('ПАУЗА', 340, 40, '#ffd166'); text('Нажми, чтобы продолжить', 400, 18, '#ccc'); text('Выйти в меню', 640, 18, '#ff9f7a');
  } else if (state === 'select') {
    text('ВЫБОР УРОВНЯ', 70, 28, '#ffd166');
    for (let k = 0; k < 20; k++) {
      const x = 40 + (k % 4) * 108, y = 110 + Math.floor(k / 4) * 120, open = k <= saved;
      ctx.fillStyle = open ? THEMES[k].g : '#222'; ctx.fillRect(x, y, 96, 100);
      ctx.fillStyle = open ? THEMES[k].r : '#333'; ctx.fillRect(x + 12, y, 72, 100);
      text(open ? String(k + 1) : '🔒', y + 50, 30, '#fff', 'center', x + 48);
      if (open) text('★'.repeat(lvStars[k] || 0) + '☆'.repeat(3 - (lvStars[k] || 0)), y + 88, 14, '#ffca3a', 'center', x + 48);
    }
    text('Назад', 760, 20, '#ff9f7a');
  } else if (state === 'over') {
    text('ЗОМБИ ПОБЕДИЛИ', 330, 38, '#ff6b6b');
    text('Попыток на этом уровне: ' + deaths, 380, 16);
    text('Нажми, чтобы попробовать ещё', 450, 18, '#ddd');
  }
}

// ---------- Ввод ----------
function advance() {
  if (state === 'menu' || state === 'win') { li = state === 'menu' && !fresh ? Math.min(saved, LEVELS.length - 1) : 0; fresh = false; score = 0; deaths = 0; levelStartScore = 0; state = 'intro'; }
  else if (state === 'intro') startLevel();
  else if (state === 'pause') state = 'play';
  else if (state === 'levelup') { li++; saveLvl(li); deaths = 0; levelStartScore = score; state = 'intro'; conf = []; }
  else if (state === 'over') { score = levelStartScore; startLevel(); }
}
window.addEventListener('keydown', e => {
  initAudio(); keys[e.code] = true;
  if (e.code === 'KeyM' && !e.repeat) setMuted(!muted);
  if ((e.code === 'KeyP' || e.code === 'Escape') && !e.repeat) { if (state === 'play') state = 'pause'; else if (state === 'pause') state = 'play'; }
  if (!e.repeat && (e.code === 'Space' || e.code === 'Enter')) advance();
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
});
window.addEventListener('keyup', e => keys[e.code] = false);
function pos(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
}
canvas.addEventListener('pointerdown', e => {
  initAudio();
  const p = pos(e);
  if (Math.hypot(p.x - MUTE.x, p.y - MUTE.y) < MUTE.r + 8) { setMuted(!muted); return; }
  if (state === 'menu' && p.y > 620) { state = 'select'; return; }
  if (state === 'pause' && p.y > 600) { state = 'menu'; return; }
  if (state === 'play' && Math.hypot(p.x - PAUSE.x, p.y - PAUSE.y) < PAUSE.r + 10) { state = 'pause'; return; }
  if (state === 'select') {
    if (p.y > 720) state = 'menu';
    else {
      const cx = (p.x - 40) % 108, cy = (p.y - 110) % 120, k = Math.floor((p.x - 40) / 108) + 4 * Math.floor((p.y - 110) / 120);
      if (p.x >= 40 && p.y >= 110 && cx < 96 && cy < 100 && k >= 0 && k < 20 && k <= saved) { li = k; score = 0; deaths = 0; levelStartScore = 0; state = 'intro'; }
    }
    return;
  }
  const onBtn = Math.hypot(p.x - FIRE.x, p.y - FIRE.y) < FIRE.r + 14;
  ptrs[e.pointerId] = { role: onBtn && state === 'play' ? 'fire' : 'move', x: p.x, y: p.y };
  advance();
});
canvas.addEventListener('pointermove', e => { const q = ptrs[e.pointerId]; if (q) { const p = pos(e); q.x = p.x; q.y = p.y; } });
const release = e => { delete ptrs[e.pointerId]; };
window.addEventListener('pointerup', release);
window.addEventListener('pointercancel', release);

function loop() { update(); draw(); requestAnimationFrame(loop); }
loop();

// Звук и игра ставятся на паузу, когда приложение уходит в фон
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (state === 'play') state = 'pause'; Object.keys(ptrs).forEach(k => delete ptrs[k]); if (ac) ac.suspend(); }
  else if (ac) ac.resume();
});
