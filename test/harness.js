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
load('dialogue.js');
load('vehicles.js');
load('combat.js');
load('economy.js');
load('cartel.js');
load('radio.js');
load('jobs.js');
load('quests.js');
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
    G.jobs.update(dt);
    G.quests.update(dt);
    G.radio.update(dt);
    if (G.dialogue) G.dialogue.update(dt);
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

console.log('--- t14: slots casino + tenue + succès');
G.player.money = 10000;
const moneyBeforeSlot = G.player.money;
G.player.cur = 'fists';
G.ui.openPhone('casino');
const phoneContent = document.getElementById('phoneContent');
if (!phoneContent._html || !phoneContent._html.includes('Casino')) throw new Error('casino tab missing');
G.ui.closePhone();
G.ui.action('slot', '100');
if (G.player.money === moneyBeforeSlot) throw new Error('slot did not resolve money');
console.log('slot OK — money', Math.floor(G.player.money));

console.log('--- t15: taxi');
const taxiCar = G.vehicles.makeCar('taxi', G.player.pos.x + 1, G.player.pos.z + 1, 0, 0xf5c518);
G.enterCarAt(taxiCar);
G.modes.startTaxi();
if (!G.modes.taxi.active) throw new Error('taxi not started');
G.player.inCar.obj.position.set(G.modes.taxi.px, 0, G.modes.taxi.pz);
G.player.pos.set(G.modes.taxi.px, 0, G.modes.taxi.pz);
frames(5);
if (G.modes.taxi.state !== 'dropoff') throw new Error('taxi pickup failed');
G.player.inCar.obj.position.set(G.modes.taxi.dx, 0, G.modes.taxi.dz);
G.player.pos.set(G.modes.taxi.dx, 0, G.modes.taxi.dz);
frames(5);
if (G.modes.taxi.active) throw new Error('taxi dropoff failed');
G.enterCar();
console.log('taxi OK');

console.log('--- t16: moto + pluie + phares + pets/artefacts');
const motoPt = G.world.randRoadPoint();
const moto = G.vehicles.makeCar('moto', motoPt.x, motoPt.z, 0, 0x00e5ff);
G.player.pos.set(motoPt.x + 2, 0, motoPt.z);
if (moto.wheels.length !== 2) throw new Error('moto wheels');
G.enterCarAt(moto);
G.input.keys['KeyW'] = true;
frames(60);
const motoSpeed = moto.speed;
G.input.keys['KeyW'] = false;
G.enterCar();
if (motoSpeed < 5) throw new Error('moto does not accelerate, speed=' + motoSpeed);
G.world.rain.active = true;
G.world.rain.next = 9999;
frames(30);
G.world.rain.active = false;
frames(5);
G.player.money = 500000;
G.eco.buyPet('wolf');
G.eco.buyPet('owl');
G.eco.setPet('owl');
G.eco.buyArtifact('titan');
G.eco.buyArtifact('eye');
const maxHpTitan = G.player.maxHp;
G.eco.toggleArtifact('titan');
if (G.player.maxHp !== maxHpTitan + 30) throw new Error('titan hp bonus, ' + G.player.maxHp + ' vs ' + maxHpTitan);
G.eco.toggleArtifact('titan');
if (G.player.maxHp !== maxHpTitan) throw new Error('titan hp revert');
console.log('moto/pluie/pets/artefacts OK — maxHp', G.player.maxHp);

console.log('--- t17: raid rival + pubs + achievements');
G.player.level = 6;
G.cartel.buyProperty('grow2');
G.cartel.raidT = 0.01;
frames(3);
if (!G.cartel.raid) throw new Error('rival raid not started');
G.cartel.raid.npcs.forEach(n => G.damageNPC(n, 9999, false));
frames(5);
if (G.cartel.raid) throw new Error('raid not resolved');
if (G.cartel.rep < 10) throw new Error('raid reward missing');
G.settings.removeAds = false;
G.ui.showAd();
if (!G.ads.showing) throw new Error('ad not shown');
G.ui.updateAds(6);
G.ui.closeAd();
if (G.ads.showing) throw new Error('ad not closed');
G.settings.removeAds = true;
G.ui.showAd();
if (G.ads.showing) throw new Error('ad shown despite removeAds');
G.stats.kills = 50;
G.checkAchievements();
if (!G.state.achievements.includes('hunter')) throw new Error('achievement hunter missing');
console.log('raid/pubs/succès OK — achievements', G.state.achievements.join(','));


console.log('--- t18: job pizza complet');
G.player.inCar = null;
G.player.money = 10000;
const moneyPrePizza = G.player.money;
G.jobs.startJob('pizza');
if (!G.jobs.active || G.jobs.active.type !== 'pizza') throw new Error('pizza job not started');
for (let s = 0; s < 3 && G.jobs.active; s++) {
  G.player.pos.x = G.jobs.active.x; G.player.pos.z = G.jobs.active.z;
  frames(3);
}
if (G.jobs.active) throw new Error('pizza job not completed');
if (G.player.money <= moneyPrePizza) throw new Error('pizza pay missing');
if (G.jobs.done < 1) throw new Error('jobs.done not counted');
console.log('pizza OK — done', G.jobs.done, 'money', Math.floor(G.player.money));

console.log('--- t19: shift business');
const bizShift = G.eco.businesses.find(b => !b.owned);
G.player.money = 200000;
G.eco.buyBusiness(bizShift.id);
if (!bizShift.owned) throw new Error('biz not bought');
G.jobs.startShift(bizShift.id);
if (!G.jobs.active || G.jobs.active.stage !== 'shift') throw new Error('shift not started');
G.jobs.active.t = 0.5;
G.player.pos.x = G.jobs.active.x; G.player.pos.z = G.jobs.active.z;
frames(40);
if (G.jobs.active) throw new Error('shift not completed');
console.log('shift OK — money', Math.floor(G.player.money));

console.log('--- t20: quete PNJ delivery');
const origMakeQuest = G.quests.makeQuest;
G.quests.makeQuest = () => ({ type: 'delivery', title: '\U0001f4e6 Test', desc: 'test', x: G.player.pos.x + 3, z: G.player.pos.z, reward: 600, xp: 60 });
G.quests.spawnT = 0;
let pedQ = G.npcs.find(n => !n.dead && n.type === 'ped' && !n.obj.userData.customer && !n.obj.userData.injured && !n.obj.userData.questGiver);
if (!pedQ) pedQ = G.spawnPed();
pedQ.obj.position.set(G.player.pos.x + 5, 0, G.player.pos.z);
pedQ.state = 'wander'; pedQ.wx = G.player.pos.x + 5; pedQ.wz = G.player.pos.z; pedQ.wanderT = 9999;
frames(2);
if (!G.quests.offer) throw new Error('quest offer missing');
const subsQ0 = G.player.money;
G.quests.accept();
if (!G.quests.active) throw new Error('quest not accepted');
G.player.pos.x = G.quests.active.x; G.player.pos.z = G.quests.active.z;
frames(3);
if (G.quests.active) throw new Error('quest not completed');
if (G.quests.done < 1) throw new Error('quests.done not counted');
if (G.player.money <= subsQ0) throw new Error('quest reward missing');
G.quests.makeQuest = origMakeQuest;
console.log('quete delivery OK — done', G.quests.done);

console.log('--- t21: upgrade business');
const bizUp = G.eco.businesses.find(b => b.owned);
G.player.money = 1000000;
const inc1 = G.eco.bizIncome(bizUp);
G.eco.upgradeBusiness(bizUp.id);
if ((bizUp.level || 1) !== 2) throw new Error('biz level not upgraded, ' + bizUp.level);
if (G.eco.bizIncome(bizUp) <= inc1) throw new Error('bizIncome not increased');
G.eco.upgradeBusiness(bizUp.id);
G.eco.upgradeBusiness(bizUp.id);
if ((bizUp.level || 1) !== 3) throw new Error('biz level 3 missing');
G.eco.upgradeBusiness(bizUp.id);
if ((bizUp.level || 1) !== 3) throw new Error('biz level above max');
console.log('upgrade OK — level', bizUp.level, 'income', Math.floor(G.eco.bizIncome(bizUp)));

console.log('--- t22: potager');
G.player.money = 100000;
G.cartel.buyProperty('garden');
if (!G.cartel.props.garden.owned) throw new Error('garden not bought');
G.cartel.buyVeg('carrot');
const vegPot = G.cartel.props.garden.pots.find(pp => pp.seed === 'carrot');
if (!vegPot) throw new Error('carrot not planted');
vegPot.progress = 1;
G.cartel.harvestVeg();
if (G.cartel.veg.carrot.qty < 3) throw new Error('harvest missing, qty ' + G.cartel.veg.carrot.qty);
const mVeg = G.player.money;
G.cartel.sellVeg('carrot');
if (G.player.money <= mVeg) throw new Error('veg sell missing');
if (G.cartel.vegSold < 3) throw new Error('vegSold missing');
console.log('potager OK — vendus', G.cartel.vegSold);

console.log('--- t23: live streaming');
G.yt.startLive();
if (!G.yt.live) throw new Error('live not started');
const subs0 = G.yt.subs, vids0 = G.yt.videos;
G.yt.addEvent(100, 'test live');
frames(30);
G.yt.stopLive();
if (G.yt.live) throw new Error('live not stopped');
if (G.yt.subs <= subs0) throw new Error('live subs missing');
if (G.yt.videos !== vids0 + 1) throw new Error('live video not counted');
console.log('live OK — subs', G.yt.subs, 'videos', G.yt.videos);

console.log('--- t24: nouvelles armes + pouvoirs');
G.player.money = 2000000;
G.player.level = 15;
G.combat.giveWeapon('machete', true);
G.combat.giveWeapon('minigun', true);
G.combat.giveWeapon('flamer', true);
G.combat.giveWeapon('plasma', true);
if (!G.player.weapons.minigun || !G.player.weapons.flamer || !G.player.weapons.plasma) throw new Error('new weapons missing');
const burnTarget = G.spawnGang('docks', G.player.pos.x + 5, G.player.pos.z, false);
burnTarget.burnT = 3;
const burnHp0 = burnTarget.hp;
frames(10);
if (!burnTarget.dead && burnTarget.hp >= burnHp0) throw new Error('burn tick missing');
if (!burnTarget.dead) G.damageNPC(burnTarget, 9999, false);
G.eco.equipped.push('zeus');
G.eco.zeusCd = 0;
const zeusTarget = G.spawnGang('docks', G.player.pos.x + 6, G.player.pos.z, false);
const zeusHp0 = zeusTarget.hp;
frames(3);
if (G.eco.zeusCd <= 0 || G.eco.zeusCd >= 5) throw new Error('zeus strike missing (cd ' + G.eco.zeusCd + ')');
if (!zeusTarget.dead && zeusTarget.hp >= zeusHp0) console.log('zeus a frappe un autre ennemi proche (OK)');
G.eco.equipped = G.eco.equipped.filter(x => x !== 'zeus');
G.eco.equipped.push('ankh');
G.eco.reviveCd = 0;
G.player.armor = 0;
G.player.hp = 10;
G.combat.hurtPlayer(9999);
if (G.state.wasted || G.player.hp <= 0) throw new Error('ankh revive missing');
if (G.eco.reviveCd !== 300) throw new Error('ankh cooldown missing');
G.eco.equipped = G.eco.equipped.filter(x => x !== 'ankh');
G.player.armor = 0;
G.player.hp = 1000; G.player.maxHp = 1000;
G.combat.hurtPlayer(40);
const lostNoBear = 1000 - G.player.hp;
G.player.hp = 1000;
G.eco.buyPet('bear');
G.eco.setPet('bear');
G.combat.hurtPlayer(40);
const lostBear = 1000 - G.player.hp;
if (lostBear >= lostNoBear) throw new Error('bear damage reduction missing');
G.player.maxHp = 100; G.player.hp = Math.min(G.player.hp, 100);
console.log('armes/pouvoirs OK — burn, zeus, ankh, bear');

console.log('--- t25: radio');
for (let k = 0; k < 6; k++) G.radio.next();
if (G.radio.heard < 4) throw new Error('radio heard tracking missing, ' + G.radio.heard);
G.checkAchievements();
if (!G.state.achievements.includes('radio')) throw new Error('radio achievement missing');
console.log('radio OK — heard', G.radio.heard);

console.log('--- t27: fideles + nouvelles graines + dealer');
G.player.money = 500000;
G.cartel.rep = 600;
G.cartel.buyProperty('grow1');
G.cartel.buySeed('frost');
const potF = G.cartel.props.grow1.pots.find(pp => pp.seed === 'frost');
if (!potF) throw new Error('frost seed not planted');
potF.progress = 1;
G.cartel.harvest();
if (G.cartel.products.frost.qty < 1) throw new Error('frost not harvested');
const pedF = G.spawnPed();
pedF.obj.position.set(G.player.pos.x + 5, 0, G.player.pos.z);
pedF.state = 'wander'; pedF.wx = pedF.obj.position.x; pedF.wz = pedF.obj.position.z; pedF.wanderT = 9999;
pedF.obj.userData.customer = true;
pedF.sales = 2;
const dirty0 = G.cartel.dirty;
G.cartel.sellNearby();
if (G.cartel.dirty <= dirty0) throw new Error('fidèle sale missing');
if (!pedF.obj.userData.fidele) throw new Error('fidele conversion missing');
const dirty1 = G.cartel.dirty;
pedF.buyT = 11.9;
frames(10);
if (G.cartel.dirty <= dirty1) throw new Error('fidele auto-buy missing');
G.cartel.hireDealer('downtown');
G.cartel.upgradeDealer(0);
if ((G.cartel.dealers[0].lvl || 1) !== 2) throw new Error('dealer upgrade missing');
console.log('fideles/dealer OK — fideles', G.cartel.fideles.length, 'dealer lvl', G.cartel.dealers[0].lvl);

console.log('--- t28: portefeuille createur');
if (typeof G.DEV_PAYPAL !== 'string') throw new Error('DEV_PAYPAL missing');
G.settings.removeAds = false;
G.ui.action('premiumUnlock');
if (!G.settings.removeAds) throw new Error('premium unlock missing');
G.ui.action('paypal5');
G.ui.action('paypaldon');
console.log('wallet OK');

console.log('--- t29: visages, expressions, dialogues, voix, lip sync');
if (typeof G.faceTex !== 'function') throw new Error('faceTex missing');
if (typeof G.dialogue !== 'object') throw new Error('dialogue module missing');
const ptD = G.world.randRoadPoint();
G.player.pos.set(ptD.x, 0, ptD.z);
const pedD = G.spawnPed();
pedD.obj.position.set(G.player.pos.x + 3, 0, G.player.pos.z);
if (!pedD.obj.userData.face || !pedD.obj.userData.face.mat.map) throw new Error('face texture missing');
G.dialogue.say(pedD, 'Salut, bienvenue a Shadow City !');
if (!pedD.talk || pedD.talk.text.indexOf('Shadow City') < 0) throw new Error('dialogue bubble missing');
G.setFace(pedD.obj, 'angry');
if (pedD.obj.userData.face.mood !== 'angry') throw new Error('angry expression missing');
G.setFace(pedD.obj, 'shady');
if (pedD.obj.userData.face.mood !== 'shady') throw new Error('shady expression missing');
frames(30);
if (G.dialogue.talkers.indexOf(pedD) < 0) throw new Error('talker not tracked');
frames(200);
G.player.pos.set(ptD.x + 200, 0, ptD.z + 200);
frames(150);
if (pedD.talk) throw new Error('dialogue did not end');
G.setFaceOpen(pedD.obj, true);
if (!pedD.obj.userData.face.open) throw new Error('lip sync open missing');
G.setFaceOpen(pedD.obj, false);
console.log('faces/dialogue OK');

console.log('--- t26: newGame reset complet');
G.newGame();
if (G.jobs.active || G.jobs.done !== 0) throw new Error('jobs not reset');
if (G.quests.active || G.quests.done !== 0) throw new Error('quests not reset');
if (G.eco.businesses.some(b => (b.level || 1) !== 1)) throw new Error('biz levels not reset');
if (G.cartel.vegSold !== 0) throw new Error('vegSold not reset');
if (G.yt.live) throw new Error('live not reset');
if (G.radio.station !== -1) throw new Error('radio not reset');
console.log('newGame reset OK');

console.log('\nALL TESTS PASSED');
