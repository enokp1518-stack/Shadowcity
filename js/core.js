'use strict';
window.G = {
  version: '1.1.0',
  DEV_PAYPAL: '',
  DEV_DONATE_URL: '',
  scene: null, camera: null, renderer: null, clock: null,
  settings: { quality: 'hd', shadows: true, sound: true, sens: 1.0, removeAds: false, outfit: 0x2f9bff, upscale: true, fps: false },
  state: { screen: 'menu', mode: 'story', time: 9.0, paused: false, fps: 60, resScale: 1, lastCrime: -99, wasted: false, kills: 0, achievements: [], sirenOn: false },
  stats: { kills: 0, headshots: 0, carsEntered: 0, racesWon: 0, captures: 0, waves: 0, bosses: 0, earned: 0, stunts: 0, distance: 0 },
  player: null,
  npcs: [], cars: [], pickups: [], projectiles: [], effects: [],
  cam: { yaw: 0, pitch: 0.32, dist: 6.5 },
  ui: {}, sfx: {}, world: null, combat: null, eco: null, yt: null, modes: null, vehicles: null
};

window.U = {
  rand: (a, b) => a + Math.random() * (b - a),
  randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: (a) => a[Math.floor(Math.random() * a.length)],
  clamp: (v, a, b) => v < a ? a : v > b ? b : v,
  lerp: (a, b, t) => a + (b - a) * t,
  d2: (ax, az, bx, bz) => { const dx = ax - bx, dz = az - bz; return dx * dx + dz * dz; },
  fmt: (n) => '$' + Math.floor(n).toLocaleString('fr-FR'),
  fmtSubs: (n) => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : '' + Math.floor(n)
};

G.V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0);

G.input = {
  move: { x: 0, y: 0 },
  keys: {},
  look: { x: 0, y: 0 },
  fire: false, aim: false, sprint: false,
  pressed: {}
};
G.input.pulse = function (k) { if (this.pressed[k]) { this.pressed[k] = false; return true; } return false; };

(function bindKeyboard() {
  const I = G.input;
  addEventListener('keydown', (e) => {
    if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    I.keys[e.code] = true;
    if (G.state.screen !== 'play') return;
    if (e.code === 'Tab') G.ui.togglePhone();
    if (e.code === 'KeyE') I.pressed.action = true;
    if (e.code === 'Space') I.pressed.jump = true;
    if (e.code === 'KeyQ' || e.code === 'KeyR') I.pressed.weapon = true;
    if (e.code === 'KeyT') G.yt.toggleRecord();
    if (e.code === 'Escape') G.ui.togglePause();
    if (e.code === 'KeyH') G.eco.useMedkit();
    if (e.code === 'KeyM' && G.radio) G.radio.next();
    if (e.code === 'KeyP') G.ui.togglePhoto();
  });
  addEventListener('keyup', (e) => { I.keys[e.code] = false; });
})();

(function bindMouse() {
  const I = G.input;
  const cv = document.getElementById('game');
  cv.addEventListener('click', () => {
    if (G.state.screen === 'play' && !('ontouchstart' in window) && document.pointerLockElement !== cv) cv.requestPointerLock();
    G.sfx.ensure();
  });
  addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === cv) {
      I.look.x += e.movementX * 0.0022 * G.settings.sens;
      I.look.y += e.movementY * 0.0022 * G.settings.sens;
    }
  });
  addEventListener('mousedown', (e) => {
    if (G.state.screen !== 'play' || document.pointerLockElement !== cv) return;
    if (e.button === 0) I.fire = true;
    if (e.button === 2) I.aim = true;
  });
  addEventListener('mouseup', (e) => {
    if (e.button === 0) I.fire = false;
    if (e.button === 2) I.aim = false;
  });
  addEventListener('contextmenu', (e) => e.preventDefault());
  addEventListener('wheel', (e) => { if (G.state.screen === 'play') I.pressed.weapon = true; });
})();

(function bindTouch() {
  const I = G.input;
  const joy = document.getElementById('joy'), knob = document.getElementById('joyKnob');
  let joyId = null, lookId = null, lookLast = null;
  const isDesktop = !('ontouchstart' in window);
  if (isDesktop) return;

  function joyStart(t) { joyId = t.identifier; joyMove(t); }
  function joyMove(t) {
    const r = joy.getBoundingClientRect();
    let dx = t.clientX - (r.left + r.width / 2), dy = t.clientY - (r.top + r.height / 2);
    const max = r.width / 2, d = Math.hypot(dx, dy);
    if (d > max) { dx = dx / d * max; dy = dy / d * max; }
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    I.move.x = dx / max; I.move.y = -dy / max;
    I.sprint = Math.hypot(I.move.x, I.move.y) > 0.85;
  }
  function joyEnd() { joyId = null; I.move.x = 0; I.move.y = 0; I.sprint = false; knob.style.transform = 'translate(-50%,-50%)'; }

  joy.addEventListener('touchstart', (e) => { e.preventDefault(); for (const t of e.changedTouches) if (joyId === null) joyStart(t); }, { passive: false });
  joy.addEventListener('touchmove', (e) => { e.preventDefault(); for (const t of e.changedTouches) if (t.identifier === joyId) joyMove(t); }, { passive: false });
  joy.addEventListener('touchend', (e) => { for (const t of e.changedTouches) if (t.identifier === joyId) joyEnd(); });

  const lookZone = document.getElementById('game');
  lookZone.addEventListener('touchstart', (e) => {
    for (const t of e.changedTouches) {
      if (t.clientX > innerWidth * 0.4 && lookId === null) { lookId = t.identifier; lookLast = { x: t.clientX, y: t.clientY }; }
    }
  }, { passive: true });
  lookZone.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === lookId && lookLast) {
        I.look.x += (t.clientX - lookLast.x) * 0.005 * G.settings.sens;
        I.look.y += (t.clientY - lookLast.y) * 0.005 * G.settings.sens;
        lookLast = { x: t.clientX, y: t.clientY };
      }
    }
  }, { passive: true });
  lookZone.addEventListener('touchend', (e) => { for (const t of e.changedTouches) if (t.identifier === lookId) { lookId = null; lookLast = null; } });

  function hold(id, on, off) {
    const el = document.getElementById(id);
    el.addEventListener('touchstart', (e) => { e.preventDefault(); on(); }, { passive: false });
    if (off) el.addEventListener('touchend', (e) => { e.preventDefault(); off(); }, { passive: false });
  }
  hold('btnFire', () => { I.fire = true; G.sfx.ensure(); }, () => { I.fire = false; });
  hold('btnAim', () => { I.aim = true; }, () => { I.aim = false; });
  hold('btnJump', () => { I.pressed.jump = true; I.jumpHeld = true; }, () => { I.jumpHeld = false; });
  hold('btnEnter', () => { I.pressed.action = true; });
  hold('btnWeapon', () => { I.pressed.weapon = true; });
  hold('btnPhone', () => { G.ui.togglePhone(); });
})();

const SFX = {
  ctx: null, master: null, engOsc: null, engGain: null,
  ensure() {
    if (!G.settings.sound) return null;
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.4;
        this.master.connect(this.ctx.destination);
      } catch (e) { return null; }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  tone(f, dur, type, vol, slide) {
    const c = this.ensure(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square'; o.frequency.value = f;
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), c.currentTime + dur);
    g.gain.value = vol || 0.15;
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(this.master);
    o.start(); o.stop(c.currentTime + dur);
  },
  noise(dur, vol, freq) {
    const c = this.ensure(); if (!c) return;
    const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 1500; f.Q.value = 0.7;
    const g = c.createGain(); g.gain.value = vol || 0.3;
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start();
  },
  shot(loud) { this.noise(0.11, loud ? 0.5 : 0.3, 1600); this.tone(180, 0.07, 'sawtooth', 0.15, -120); },
  melee() { this.noise(0.08, 0.25, 500); },
  hit() { this.tone(220, 0.06, 'square', 0.12, -80); },
  step() { this.noise(0.05, 0.05, 900); },
  horn() { this.tone(310, 0.25, 'square', 0.1); this.tone(370, 0.25, 'square', 0.08); },
  thunder() { this.noise(1.4, 0.4, 120); this.noise(0.9, 0.28, 60); },
  rainLoop(on) {
    const c = this.ensure();
    if (!c) return;
    if (on && !this.rainSrc) {
      const n = Math.floor(c.sampleRate * 2), buf = c.createBuffer(1, n, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      this.rainSrc = c.createBufferSource();
      this.rainSrc.buffer = buf; this.rainSrc.loop = true;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
      this.rainGain = c.createGain(); this.rainGain.gain.value = 0.045;
      this.rainSrc.connect(f); f.connect(this.rainGain); this.rainGain.connect(this.master);
      this.rainSrc.start();
    } else if (!on && this.rainSrc) {
      try { this.rainSrc.stop(); } catch (e) {}
      this.rainSrc = null;
    }
  },
  voice(pitch) {
    const c = this.ensure(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'square'; o.frequency.value = Math.max(60, Math.min(900, pitch));
    g.gain.value = 0.04;
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.07);
    o.connect(g); g.connect(this.master);
    o.start(); o.stop(c.currentTime + 0.07);
  },
  cash() { this.tone(880, 0.09, 'sine', 0.2); this.tone(1320, 0.14, 'sine', 0.18); },
  ui() { this.tone(660, 0.05, 'sine', 0.1); },
  buy() { this.tone(520, 0.08, 'sine', 0.15); this.tone(780, 0.12, 'sine', 0.15); },
  deny() { this.tone(160, 0.15, 'sawtooth', 0.15, -40); },
  explode() { this.noise(0.6, 0.7, 300); this.tone(60, 0.5, 'sawtooth', 0.3, -30); },
  levelup() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.15, 'sine', 0.2), i * 90)); },
  alarm() { this.tone(440, 0.3, 'square', 0.1, 220); },
  siren(on) {
    const c = this.ensure();
    if (!c) return;
    if (on && !this.sirOsc) {
      this.sirOsc = c.createOscillator(); this.sirGain = c.createGain();
      this.sirLfo = c.createOscillator(); const lfoGain = c.createGain();
      this.sirOsc.type = 'sine'; this.sirOsc.frequency.value = 700;
      this.sirLfo.frequency.value = 1.1; lfoGain.gain.value = 200;
      this.sirLfo.connect(lfoGain); lfoGain.connect(this.sirOsc.frequency);
      this.sirGain.gain.value = 0.02;
      this.sirOsc.connect(this.sirGain); this.sirGain.connect(this.master);
      this.sirOsc.start(); this.sirLfo.start();
    } else if (!on && this.sirOsc) {
      try { this.sirOsc.stop(); this.sirLfo.stop(); } catch (e) {}
      this.sirOsc = null; this.sirLfo = null;
    }
  },
  engine(on) {
    const c = this.ensure();
    if (!c) return;
    if (on && !this.engOsc) {
      this.engOsc = c.createOscillator(); this.engGain = c.createGain();
      this.engOsc.type = 'sawtooth'; this.engOsc.frequency.value = 60;
      this.engGain.gain.value = 0.05;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400;
      this.engOsc.connect(f); f.connect(this.engGain); this.engGain.connect(this.master);
      this.engOsc.start();
    } else if (!on && this.engOsc) {
      this.engOsc.stop(); this.engOsc = null; this.engGain = null;
    }
  },
  setEngine(speed) { if (this.engOsc) { this.engOsc.frequency.value = 55 + Math.abs(speed) * 3.2; this.engGain.gain.value = 0.035 + Math.min(0.04, Math.abs(speed) * 0.002); } }
};
G.sfx = SFX;

G.newGame = function () {
  const p = G.player;
  p.money = 500; p.xp = 0; p.level = 1; p.maxHp = 100; p.hp = 100; p.armor = 0;
  p.weapons = { fists: { owned: true, ammo: Infinity, reserve: Infinity } };
  p.cur = 'fists'; p.wanted = 0; p.medkits = 3; p.inCar = null; p.reloadT = 0; p.fireT = 0;
  const c0 = G.world.cellCenter(4, 5);
  p.pos.set(c0.x, 0, c0.z + 20); p.vel.set(0, 0, 0);
  for (const k in G.stats) G.stats[k] = 0;
  G.yt.recording = false; G.yt.subs = 0; G.yt.views = 0; G.yt.videos = 0; G.yt.perks = [];
  G.yt.live = false; G.yt.liveT = 0; G.yt.livePts = 0;
  G.eco.petsOwned = []; G.eco.activePet = null; G.eco.refreshPet();
  G.eco.artifactsOwned = []; G.eco.equipped = [];
  G.eco.businesses.forEach(b => { b.owned = false; b.stored = 0; b.level = 1; });
  G.world.districts.forEach(d => d.owned = false);
  G.cartel.reset();
  if (G.jobs) { G.jobs.active = null; G.jobs.done = 0; }
  if (G.quests) G.quests.reset();
  if (G.radio) { G.radio.station = -1; if (G.radio.resetHeard) G.radio.resetHeard(); }
  G.modes.missionIdx = 0; G.modes.stageIdx = 0;
  G.modes.war = { active: false, district: null, needed: 0, kills: 0 };
  G.modes.survival = { active: false, wave: 0, alive: 0, breakT: 0 };
  G.modes.race = { active: false };
  G.modes.rift = { active: false };
  G.modes.taxi = { active: false };
  G.modes.storyMarker = null;
  G.modes.missions.forEach(m => m.stages.forEach(s => { s._entered = false; }));
  for (let i = G.npcs.length - 1; i >= 0; i--) {
    if (G.npcs[i].warTag || G.npcs[i].survival) { G.scene.remove(G.npcs[i].obj); G.npcs.splice(i, 1); }
  }
  G.state.lastCrime = -99;
  G.state.kills = 0;
  G.ads.t = 0;
  G.sfx.siren(false);
  G.state.sirenOn = false;
};

G.recalcMaxHp = function () {
  const p = G.player; if (!p) return;
  let hp = 100 + (p.level - 1) * 10;
  if (G.eco) {
    if (G.eco.equipped.includes('titan')) hp += 30;
    if (G.eco.equipped.includes('void')) hp -= 10;
  }
  p.maxHp = Math.max(50, hp);
  p.hp = Math.min(p.hp, p.maxHp);
};

G.addXP = function (n) {
  const p = G.player; if (!p) return;
  if (G.eco && G.eco.activePet === 'owl') n = Math.floor(n * 1.2);
  else if (G.eco && G.eco.activePet === 'turtle') n = Math.floor(n * 1.1);
  p.xp += n;
  const lvl = Math.floor(Math.sqrt(p.xp / 80)) + 1;
  if (lvl > p.level) {
    p.level = lvl;
    G.recalcMaxHp();
    p.hp = p.maxHp;
    G.ui.toast('⭐ Niveau ' + lvl + ' atteint ! PV max +10', 'money');
    G.sfx.levelup();
  }
};

G.ads = { t: 0, showing: false };

G.ACHIEVEMENTS = [
  { id: 'blood', name: 'Premier sang', desc: 'Première élimination', cond: s => s.kills >= 1, reward: 200 },
  { id: 'hunter', name: 'Chasseur de la ville', desc: '50 éliminations', cond: s => s.kills >= 50, reward: 2000 },
  { id: 'rich', name: 'Nouveau riche', desc: '100 000$ gagnés au total', cond: s => s.earned >= 100000, reward: 5000 },
  { id: 'wheels', name: 'As du volant', desc: '50 véhicules volés', cond: s => s.carsEntered >= 50, reward: 3000 },
  { id: 'racer', name: 'Roi du bitume', desc: '5 courses gagnées', cond: s => s.racesWon >= 5, reward: 5000 },
  { id: 'warlord', name: 'Seigneur de guerre', desc: '5 territoires capturés', cond: s => s.captures >= 5, reward: 20000 },
  { id: 'slayer', name: 'Tueur de bêtes', desc: '10 vagues de survie', cond: s => s.waves >= 10, reward: 10000 },
  { id: 'gods', name: 'Tueur de dieux', desc: 'Vaincre le Golem du Rift', cond: s => s.bosses >= 1, reward: 10000 },
  { id: 'veteran', name: 'Vétéran', desc: 'Atteindre le niveau 10', cond: () => G.player.level >= 10, reward: 10000 },
  { id: 'tycoon', name: 'Magnat', desc: 'Posséder les 6 business', cond: () => G.eco.businesses.every(b => b.owned), reward: 25000 },
  { id: 'cartel', name: 'Baron de la poudre', desc: '100 de réputation cartel', cond: () => G.cartel.rep >= 100, reward: 8000 },
  { id: 'star', name: 'Star de ShadowTV', desc: '100 000 abonnés', cond: () => G.yt.subs >= 100000, reward: 15000 },
  { id: 'worker', name: 'Travailleur', desc: '5 jobs terminés', cond: () => G.jobs && G.jobs.done >= 5, reward: 3000 },
  { id: 'helper', name: 'Bon samaritain', desc: '5 quêtes de PNJ terminées', cond: () => G.quests && G.quests.done >= 5, reward: 4000 },
  { id: 'farmer', name: 'Marâcher', desc: '50 légumes vendus', cond: () => G.cartel && (G.cartel.vegSold || 0) >= 50, reward: 5000 },
  { id: 'radio', name: 'Mélomane', desc: 'Écouter toutes les stations de radio', cond: () => G.radio && G.radio.heard >= 4, reward: 2000 }
];

G.checkAchievements = function () {
  const done = G.state.achievements;
  for (const a of G.ACHIEVEMENTS) {
    if (done.includes(a.id)) continue;
    if (a.cond(G.stats)) {
      done.push(a.id);
      G.player.money += a.reward;
      G.ui.toast('🏆 Succès : ' + a.name + ' (+' + U.fmt(a.reward) + ') — ' + a.desc, 'money');
      G.sfx.levelup();
    }
  }
};

G.saveData = function () {
  const p = G.player;
  return {
    v: G.version,
    money: p.money, xp: p.xp, level: p.level, hp: p.hp,
    weapons: p.weapons, cur: p.cur,
    businesses: G.eco.businesses.map(b => ({ id: b.id, owned: b.owned, stored: Math.floor(b.stored), level: b.level || 1 })),
    districts: G.world.districts.map(d => ({ id: d.id, owned: d.owned })),
    pets: G.eco.petsOwned, pet: G.eco.activePet,
    artifacts: G.eco.artifactsOwned, equipped: G.eco.equipped,
    yt: { subs: G.yt.subs, views: G.yt.views, videos: G.yt.videos, perks: G.yt.perks },
    cartel: G.cartel.serialize(),
    jobs: { done: G.jobs ? G.jobs.done : 0 },
    quests: { done: G.quests ? G.quests.done : 0 },
    missions: G.modes.missionIdx,
    stats: G.stats,
    settings: G.settings,
    achievements: G.state.achievements,
    time: G.state.time
  };
};
G.save = function (silent) {
  try {
    localStorage.setItem('shadowcity_v1', JSON.stringify(G.saveData()));
    if (!silent) G.ui.toast('💾 Partie sauvegardée');
  } catch (e) { if (!silent) G.ui.toast('Sauvegarde impossible', 'warn'); }
};
G.loadSave = function () {
  try { return JSON.parse(localStorage.getItem('shadowcity_v1')); } catch (e) { return null; }
};
G.applySave = function (d) {
  if (!d) return false;
  const p = G.player;
  p.money = d.money || 500; p.xp = d.xp || 0;
  p.level = d.level || 1; p.maxHp = 100 + (p.level - 1) * 10; p.hp = d.hp || p.maxHp;
  if (d.weapons) for (const k in d.weapons) if (G.combat.WEAPONS[k]) p.weapons[k] = d.weapons[k];
  p.cur = d.cur || 'fists';
  if (d.businesses) d.businesses.forEach(s => { const b = G.eco.businesses.find(x => x.id === s.id); if (b) { b.owned = s.owned; b.stored = s.stored || 0; b.level = s.level || 1; } });
  if (d.districts) d.districts.forEach(s => { const dd = G.world.districts.find(x => x.id === s.id); if (dd) dd.owned = s.owned; });
  G.eco.petsOwned = d.pets || []; G.eco.activePet = d.pet || null;
  G.eco.artifactsOwned = d.artifacts || []; G.eco.equipped = (d.equipped || []).slice(0, 3);
  if (d.yt) { G.yt.subs = d.yt.subs || 0; G.yt.views = d.yt.views || 0; G.yt.videos = d.yt.videos || 0; G.yt.perks = d.yt.perks || []; }
  if (d.jobs && G.jobs) G.jobs.done = d.jobs.done || 0;
  if (d.quests && G.quests) G.quests.done = d.quests.done || 0;
  G.cartel.deserialize(d.cartel);
  G.modes.missionIdx = d.missions || 0;
  G.modes.stageIdx = 0;
  G.modes.missions.forEach(m => m.stages.forEach(s => { s._entered = false; }));
  if (d.stats) Object.assign(G.stats, d.stats);
  if (d.settings) Object.assign(G.settings, d.settings);
  G.state.achievements = d.achievements || [];
  if (G.player.obj) G.player.obj.userData.mat.color.setHex(G.settings.outfit);
  G.state.time = d.time || 9;
  G.eco.refreshPet();
  G.recalcMaxHp();
  p.hp = Math.min(p.hp, p.maxHp);
  return true;
};
G.hasSave = () => !!localStorage.getItem('shadowcity_v1');
G.wipeSave = () => localStorage.removeItem('shadowcity_v1');
