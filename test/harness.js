'use strict';
const path = require('path');

global.window = global;
global.performance = global.performance || { now: () => Date.now() };
global.innerWidth = 1280; global.innerHeight = 720;
global.devicePixelRatio = 2;
global.addEventListener = () => {};
global.removeEventListener = () => {};
global.requestAnimationFrame = () => 0;
global.confirm = () => false;
global.location = { reload: () => {} };
global.setTimeout = (fn) => { fn(); return 0; };
global.clearTimeout = () => {};
const store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; }
};
global['ontouchstart' in window ? 'x' : 'ontouchstart'] = undefined;

function fakeCtx() {
  return new Proxy({}, {
    get(t, k) {
      if (k === 'canvas') return {};
      if (!(k in t)) t[k] = (...a) => undefined;
      return t[k];
    },
    set(t, k, v) { t[k] = v; return true; }
  });
}
const elements = {};
function fakeEl(id) {
  if (elements[id]) return elements[id];
  const el = {
    id, style: {}, dataset: {}, children: [], disabled: false,
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    addEventListener() {}, removeEventListener() {},
    appendChild(c) { c._parent = this; this.children.push(c); },
    remove() { const p = this._parent; if (p) { const i = p.children.indexOf(this); if (i >= 0) p.children.splice(i, 1); } },
    closest: () => null,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 120, height: 120 }),
    getContext: () => fakeCtx(),
    get firstChild() { return this.children[0] || null; },
    set innerHTML(v) { this._html = v; this.children = []; },
    get innerHTML() { return this._html || ''; },
    set textContent(v) { this._txt = v; },
    get textContent() { return this._txt || ''; },
    set width(v) { this._w = v; }, get width() { return this._w || 220; },
    set height(v) { this._h = v; }, get height() { return this._h || 220; },
    set onclick(v) { this._onclick = v; }
  };
  elements[id] = el;
  return el;
}
global.document = {
  getElementById: (id) => fakeEl(id),
  createElement: (tag) => fakeEl('el_' + tag + '_' + Math.random()),
  addEventListener() {},
  pointerLockElement: null,
  hidden: false
};

const THREE = require(path.join(__dirname, '..', 'js', 'three.min.js'));
global.THREE = THREE;

function load(f) { require(path.join(__dirname, '..', 'js', f)); }
load('core.js');
load('world.js');
load('characters.js');
load('vehicles.js');
load('combat.js');
load('economy.js');
load('cartel.js');
load('modes.js');
load('ui.js');

G.renderer = { setPixelRatio() {}, shadowMap: { enabled: false }, setSize() {} };
G.scene = new THREE.Scene();
G.camera = new THREE.PerspectiveCamera(70, 1.7, 0.1, 2000);

G.world.build();
G.initPlayer();
G.combat.initPlayerCombat();
G.eco.initLocations();
G.vehicles.spawnParked(20);
G.vehicles.spawnTraffic(8);
for (let k = 0; k < 8; k++) G.spawnPed();
for (const d of G.world.districts) {
  const c = G.world.cellCenter(d.cells[0], d.cells[1]);
  G.spawnGang(d.id, c.x, c.z, false);
}
G.state.screen = 'play';

const dt = 1 / 60;
function frames(n, fn) {
  for (let i = 0; i < n; i++) {
    if (fn) fn(i);
    G.updatePlayer(dt);
    G.updateNPCs(dt);
    G.vehicles.update(dt);
    G.combat.update(dt);
    G.combat.updateProjectiles(dt);
    G.eco.update(dt);
    G.cartel.update(dt);
    G.modes.update(dt);
    G.world.updateEnvironment(dt);
  }
}

console.log('--- t1: marche + tir + pickups');
G.player.money = 100000;
G.combat.giveWeapon('pistol', true);
G.input.keys['KeyW'] = true;
frames(120);
G.input.keys['KeyW'] = false;
G.input.fire = true;
frames(40);
G.input.fire = false;
console.log('pos', G.player.pos.x.toFixed(1), G.player.pos.z.toFixed(1), 'money', G.player.money, 'wanted', G.player.wanted);

console.log('--- t2: voiture');
const car = G.cars.find(c => !c.wrecked);
G.player.pos.set(-58.5, 0, 61);
car.obj.position.set(-58.5, 0, 61);
car.yaw = 0; car.obj.rotation.y = 0;
G.enterCar();
if (!G.player.inCar) throw new Error('enterCar failed');
G.input.keys['KeyW'] = true;
frames(200);
const sp = G.player.inCar ? G.player.inCar.speed : -99;
G.input.keys['KeyW'] = false;
console.log('car speed', sp.toFixed(1), 'pos', car.obj.position.x.toFixed(0), car.obj.position.z.toFixed(0));
if (sp < 5) throw new Error('car does not accelerate, speed=' + sp);
G.enterCar();
if (G.player.inCar) throw new Error('exitCar failed');

console.log('--- t2b: hitscan direct');
const target = G.spawnGang('downtown', G.player.pos.x, G.player.pos.z + 8, false);
target.aggro = false;
target.obj.position.set(G.player.pos.x, 0, G.player.pos.z + 8);
target.home = { x: G.player.pos.x, z: G.player.pos.z + 8 };
target.wx = target.home.x; target.wz = target.home.z; target.wanderT = 99;
G.camera.position.set(G.player.pos.x, 1.7, G.player.pos.z - 2);
G.camera.lookAt(target.obj.position.x, 1.2, target.obj.position.z);
const hpBefore = target.hp;
G.combat.giveWeapon('rifle', true);
G.player.cur = 'rifle';
G.player.weapons.rifle.ammo = 30;
G.combat.fire();
console.log('gang hp', hpBefore, '->', target.hp, 'dead?', target.dead);
if (target.hp >= hpBefore) throw new Error('hitscan missed');

console.log('--- t3: combat gang + war');
G.modes.startWar('docks');
const enemies = G.npcs.filter(n => n.warTag && !n.dead);
console.log('war enemies', enemies.length);
enemies.forEach(e => G.damageNPC(e, 9999, false));
frames(10);
console.log('docks owned:', G.world.districts.find(d => d.id === 'docks').owned, 'captures', G.stats.captures);

console.log('--- t4: survie');
const savedMax = G.player.maxHp;
G.player.maxHp = 1000000; G.player.hp = 1000000;
const a = G.world.specialLocations.find(l => l.id === 'arena');
G.player.pos.set(a.x + 5, 0, a.z + 5);
G.modes.startSurvival();
frames(600);
G.npcs.filter(n => n.survival && !n.dead).forEach(n => G.damageNPC(n, 9999, false));
frames(500);
G.player.maxHp = savedMax; G.player.hp = savedMax;
console.log('wave', G.modes.survival.wave, 'stats.waves', G.stats.waves);
if (G.stats.waves < 1) throw new Error('survival waves did not progress');

console.log('--- t5: course');
const car2 = G.cars.find(c => !c.wrecked && c !== car);
car2.obj.position.set(G.player.pos.x + 1, 0, G.player.pos.z + 1);
G.enterCar();
G.modes.startRace(0);
frames(30);
console.log('race active', G.modes.race.active, 'cp', G.modes.race.cp);
const racer = G.modes.race.racers[0];
for (let k = 0; k < G.modes.race.total; k++) {
  const cp = G.modes.race.cps[G.modes.race.cp];
  G.player.inCar.obj.position.set(cp.x, 0, cp.z);
  frames(5);
}
console.log('race finished, active:', G.modes.race.active, 'racesWon', G.stats.racesWon);
G.enterCar();
if (G.player.inCar) throw new Error('still in car after race exit');

console.log('--- t6: youtube');
G.yt.toggleRecord();
G.yt.addEvent(500, 'test');
G.yt.sessionT = 30;
G.yt.toggleRecord();
console.log('subs', G.yt.subs, 'videos', G.yt.videos);
G.yt.subs = 1000000;
G.yt.checkPerks();
console.log('perks', G.yt.perks.join(','), 'has goldenak', !!G.player.weapons.goldenak);

console.log('--- t7: eco');
G.player.money = 1000000;
G.eco.buyBusiness('casino');
G.eco.businesses.find(b => b.id === 'casino').stored = 5000;
G.eco.collectAll();
G.eco.buyPet('dog');
G.eco.buyArtifact('fury');
G.eco.toggleArtifact('fury');
console.log('biz owned', G.eco.businesses.filter(b => b.owned).length, 'pet', G.eco.activePet, 'equipped', G.eco.equipped);

console.log('--- t7b: cartel');
G.player.money = 1000000;
G.cartel.buyProperty('grow1');
if (!G.cartel.props.grow1.owned) throw new Error('grow1 not bought');
G.cartel.buySeed('amnesia');
if (!G.cartel.props.grow1.pots.some(pp => pp.seed)) throw new Error('seed not planted');
G.cartel.props.grow1.pots.forEach(pp => { if (pp.seed) { pp.progress = 1; pp.water = 1; } });
G.cartel.harvest();
if (G.cartel.products.amnesia.qty <= 0) throw new Error('harvest failed');
G.cartel.buyProperty('lab1');
G.cartel.reagent = 10;
G.cartel.startBatch('crystal');
if (!G.cartel.props.lab1.batch) throw new Error('batch not started');
G.cartel.props.lab1.batch.progress = 0.9999;
frames(3);
if (G.cartel.products.crystal.qty <= 0) throw new Error('lab production failed');
const ped = G.spawnPed();
ped.obj.position.set(G.player.pos.x + 2, 0, G.player.pos.z + 2);
ped.obj.userData.customer = true;
const dirtyBefore = G.cartel.dirty;
G.cartel.sellNearby();
if (G.cartel.dirty <= dirtyBefore) throw new Error('street sale failed');
G.cartel.hireDealer('downtown');
G.cartel.supplyDealer(0);
if (G.cartel.dealers[0].stock <= 0) throw new Error('dealer supply failed');
const cleanBefore = G.player.money;
G.cartel.launder(1000);
if (G.player.money <= cleanBefore) throw new Error('launder failed');
G.cartel.rollContract();
G.cartel.products[G.cartel.contract.product].qty += 50;
G.cartel.deliverContract();
if (G.cartel.contract !== null) throw new Error('contract delivery failed');
G.cartel.products.amnesia.qty += 20;
G.cartel.launchConvoy();
if (!G.cartel.convoy) throw new Error('convoy not launched');
G.cartel.convoy.t = 0.01;
frames(3);
if (G.cartel.convoy) throw new Error('convoy never resolved');
G.save(true);
const dd2 = G.loadSave();
G.applySave(dd2);
if (!G.cartel.props.grow1.owned) throw new Error('cartel save/load failed');
console.log('cartel OK — dirty', Math.floor(G.cartel.dirty), 'amnesia', G.cartel.products.amnesia.qty, 'crystal', G.cartel.products.crystal.qty, 'dealers', G.cartel.dealers.length, 'rep', G.cartel.rep);

console.log('--- t8: rift boss');
const r = G.world.specialLocations.find(l => l.id === 'rift');
G.player.pos.set(r.x + 5, 0, r.z + 5);
frames(5);
if (!G.modes.boss) throw new Error('boss not spawned');
G.damageNPC(G.modes.boss, 99999, true);
frames(10);
console.log('bosses', G.stats.bosses, 'voidcannon', !!G.player.weapons.voidcannon);

console.log('--- t9: save/load');
G.save(true);
const d = G.loadSave();
if (!G.applySave(d)) throw new Error('applySave failed');
console.log('save/load OK, money', G.player.money);

console.log('--- t10: degats joueur + wasted');
G.combat.hurtPlayer(9999);
frames(200);
console.log('wasted flow OK, hp', G.player.hp.toFixed(0), 'wanted', G.player.wanted);

console.log('--- t11: long free roam stress');
G.input.keys['KeyW'] = true;
G.input.fire = true;
frames(900);
G.input.fire = false; G.input.keys['KeyW'] = false;
console.log('npcs', G.npcs.length, 'cars', G.cars.length, 'fps-loop stable');

console.log('--- t12: nouvelle partie (reset)');
G.newGame();
if (G.player.money !== 500) throw new Error('newGame money');
if (G.yt.subs !== 0 || G.cartel.dirty !== 0) throw new Error('newGame yt/cartel');
if (G.cartel.props.grow1.owned) throw new Error('newGame cartel props');
if (G.eco.businesses.some(b => b.owned)) throw new Error('newGame businesses');
if (G.world.districts.some(d => d.owned)) throw new Error('newGame districts');
if (G.player.weapons.pistol) throw new Error('newGame weapons');
frames(120);
console.log('newGame OK — mission', G.modes.missions[G.modes.missionIdx].title);

console.log('--- t13: arrestation (busted)');
G.newGame();
const cop = G.spawnCop(G.player.pos.x, G.player.pos.z);
cop.obj.position.set(G.player.pos.x + 1, 0, G.player.pos.z);
G.player.wanted = 2;
const moneyBeforeBust = G.player.money;
frames(200);
if (G.player.wanted !== 0) throw new Error('busted failed, wanted=' + G.player.wanted);
if (G.player.money >= moneyBeforeBust) throw new Error('busted amende manquante');
console.log('busted OK — amende', moneyBeforeBust - G.player.money, 'wanted', G.player.wanted);

console.log('\nALL TESTS PASSED');
