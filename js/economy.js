'use strict';
(function () {
  const E = {};
  G.eco = E;

  E.businesses = [
    { id: 'wash', name: 'Lavage Auto Splash', price: 6000, income: 220, pos: null, loc: { i: 1, j: 2, dx: -16, dz: 16 }, desc: 'Un lavage rapide, un revenu propre.' },
    { id: 'gas', name: 'Station Shadow Fuel', price: 12000, income: 420, loc: { i: 7, j: 1, dx: 14, dz: 14 }, desc: 'Tout le monde passe par ici.' },
    { id: 'pizza', name: 'Pizzeria Bella Mafia', price: 18000, income: 600, loc: { i: 2, j: 8, dx: -14, dz: -14 }, desc: 'Les gangsters adorent la 4 fromages.' },
    { id: 'garage', name: 'Garage Turbo', price: 30000, income: 1000, loc: { i: 8, j: 2, dx: -14, dz: 14 }, desc: 'Tuning, réparations, business.' },
    { id: 'club', name: 'Club Néon', price: 70000, income: 2400, loc: { i: 7, j: 6, dx: 14, dz: -14 }, desc: 'La boîte la plus chaude de la ville.' },
    { id: 'casino', name: 'Casino Lucky Main', price: 250000, income: 9000, loc: { i: 8, j: 8, dx: -14, dz: -14 }, desc: 'La maison gagne toujours. Vous êtes la maison.' }
  ];

  E.PETS = {
    dog: { name: '🐕 Chien Fidèle', price: 5000, desc: 'Aimante l\'argent : les billets volent vers vous.', bonus: 'aimant à billets' },
    falcon: { name: '🦅 Faucon Radar', price: 15000, desc: 'Repère les ennemis et la police sur la minimap.', bonus: 'radar ennemis' },
    panther: { name: '🐆 Panthère Noire', price: 40000, desc: 'Attaque vos ennemis proches (15 dégâts).', bonus: 'attaque (15 dmg)' },
    dragon: { name: '🐉 Bébé Dragon', price: 120000, desc: 'Crache des boules de feu (30 dmg) toutes les 4s.', bonus: 'boule de feu (30 dmg)' },
    robotcat: { name: '🤖 Chat-Robot', price: 0, desc: 'Cadeau des 100K abonnés. +10% sur tous les revenus.', bonus: '+10% revenus', unlock: '100K abonnés' }
  };

  E.ARTIFACTS = {
    fury: { name: 'Amulette de Furie', price: 20000, desc: '+15% dégâts.', dmg: 0.15 },
    zephyr: { name: 'Bottes de Zéphyr', price: 18000, desc: '+12% vitesse.', speed: 0.12 },
    phoenix: { name: 'Plume du Phénix', price: 35000, desc: 'Régénère 1,5 PV/s.', regen: 1.5 },
    midas: { name: 'Pièce de Midas', price: 50000, desc: '+20% sur tous les revenus.', money: 0.2 },
    ghost: { name: 'Éclat Fantôme', price: 30000, desc: 'La police vous remarque 30% moins.', stealth: 0.3 },
    void: { name: 'Pierre du Vide', price: 90000, desc: '+25% dégâts, mais -10 PV max.', dmg: 0.25, hpPenalty: 10 }
  };

  E.petsOwned = [];
  E.activePet = null;
  E.petObj = null;
  E.petAtkCd = 0;
  E.artifactsOwned = [];
  E.equipped = [];

  E.hasPet = (id) => E.activePet === id;

  E.bonuses = function () {
    const b = { dmg: 1, speed: 1, money: 1, regen: 0, luck: 0, stealth: 0 };
    for (const id of E.equipped) {
      const a = E.ARTIFACTS[id];
      if (!a) continue;
      if (a.dmg) b.dmg += a.dmg;
      if (a.speed) b.speed += a.speed;
      if (a.regen) b.regen += a.regen;
      if (a.money) b.money += a.money;
      if (a.stealth) b.stealth += a.stealth;
    }
    if (E.activePet === 'robotcat') b.money += 0.1;
    if (G.yt && G.yt.perks.includes('sponsor')) b.money += 0.5;
    return b;
  };

  E.earn = function (amount, silent) {
    const b = E.bonuses();
    const total = Math.floor(amount * b.money);
    G.player.money += total;
    G.stats.earned += total;
    if (!silent) G.sfx.cash();
    return total;
  };

  E.spend = function (amount) {
    const p = G.player;
    if (p.money < amount) { G.ui.toast('Fonds insuffisants !', 'warn'); G.sfx.deny(); return false; }
    p.money -= amount;
    return true;
  };

  E.buyWeapon = function (id) {
    const w = G.combat.WEAPONS[id], p = G.player;
    if (!w || p.weapons[id]) return;
    if (w.exclusive && w.unlock) { G.ui.toast('Arme exclusive : ' + w.unlock, 'warn'); G.sfx.deny(); return; }
    if (!E.spend(w.price)) return;
    G.combat.giveWeapon(id, true);
    G.ui.toast('🔫 ' + w.name + ' achetée !', 'money');
    G.sfx.buy();
  };

  E.buyAmmo = function (id) {
    const w = G.combat.WEAPONS[id], p = G.player;
    const slot = p.weapons[id];
    if (!w || !slot || w.type === 'melee') return;
    if (!E.spend(w.ammoPrice)) return;
    slot.reserve += w.ammoPack;
    G.ui.toast('📦 +'+w.ammoPack+' munitions ' + w.name, 'money');
    G.sfx.buy();
  };

  E.buyMedkit = function () {
    if (!E.spend(150)) return;
    G.player.medkits++;
    G.ui.toast('🧪 Medkit acheté (Touche H / bouton Santé)', 'money');
    G.sfx.buy();
  };

  E.useMedkit = function () {
    const p = G.player;
    if (p.medkits <= 0) { G.ui.toast('Aucun medkit !', 'warn'); return; }
    if (p.hp >= p.maxHp) return;
    p.medkits--;
    p.hp = Math.min(p.maxHp, p.hp + 50);
    G.sfx.cash();
    G.ui.toast('🧪 +50 PV');
  };

  E.buyPet = function (id) {
    const pet = E.PETS[id];
    if (E.petsOwned.includes(id)) return;
    if (pet.unlock) { G.ui.toast('Animal exclusif : ' + pet.unlock, 'warn'); G.sfx.deny(); return; }
    if (!E.spend(pet.price)) return;
    E.petsOwned.push(id);
    E.setPet(id);
    G.ui.toast(pet.name + ' vous suit désormais !', 'money');
    G.sfx.buy();
  };

  E.setPet = function (id) {
    E.activePet = id;
    E.refreshPet();
    G.sfx.ui();
  };

  E.refreshPet = function () {
    if (E.petObj) { G.scene.remove(E.petObj); E.petObj = null; }
    if (!E.activePet || !E.petsOwned.includes(E.activePet)) { E.activePet = null; return; }
    const colors = { dog: 0xc49a6c, falcon: 0x8a6f4d, panther: 0x1a1a1e, dragon: 0xc23a2f, robotcat: 0x9ab0c8 };
    const scales = { dog: 0.55, falcon: 0.4, panther: 0.65, dragon: 0.6, robotcat: 0.5 };
    E.petObj = G.makeHumanoid(colors[E.activePet] || 0xffffff, scales[E.activePet] || 0.5);
    G.scene.add(E.petObj);
  };

  E.buyArtifact = function (id) {
    const a = E.ARTIFACTS[id];
    if (E.artifactsOwned.includes(id)) return;
    if (!E.spend(a.price)) return;
    E.artifactsOwned.push(id);
    G.ui.toast('🔮 ' + a.name + ' acquis !', 'money');
    G.sfx.buy();
    if (id === 'void') { G.player.maxHp = Math.max(50, G.player.maxHp - a.hpPenalty); G.player.hp = Math.min(G.player.hp, G.player.maxHp); }
  };

  E.toggleArtifact = function (id) {
    const i = E.equipped.indexOf(id);
    if (i >= 0) E.equipped.splice(i, 1);
    else {
      if (E.equipped.length >= 3) { G.ui.toast('Maximum 3 artefacts équipés', 'warn'); G.sfx.deny(); return; }
      E.equipped.push(id);
    }
    G.sfx.ui();
  };

  E.buyBusiness = function (id) {
    const b = E.businesses.find(x => x.id === id);
    if (!b || b.owned) return;
    if (!E.spend(b.price)) return;
    b.owned = true; b.stored = 0;
    G.ui.toast('🏢 ' + b.name + ' vous appartient ! Revenu : ' + U.fmt(b.income) + '/min', 'money');
    G.sfx.buy();
    G.addXP(100);
    if (G.yt.recording) G.yt.addEvent(60, 'Nouvel empire en vue !');
  };

  E.collect = function (id) {
    const b = E.businesses.find(x => x.id === id);
    if (!b || !b.owned || b.stored < 1) return;
    const amount = E.earn(b.stored, true);
    b.stored = 0;
    G.ui.toast('💰 ' + U.fmt(amount) + ' encaissés (' + b.name + ')', 'money');
    G.sfx.cash();
  };

  E.collectAll = function () {
    let total = 0;
    for (const b of E.businesses) if (b.owned && b.stored >= 1) { total += b.stored; b.stored = 0; }
    if (total >= 1) {
      const amount = E.earn(total, true);
      G.ui.toast('💰 ' + U.fmt(amount) + ' encaissés (tous vos business)', 'money');
      G.sfx.cash();
    } else G.ui.toast('Rien à encaisser pour le moment', 'warn');
  };

  E.update = function (dt) {
    const b = E.bonuses();
    for (const biz of E.businesses) {
      if (!biz.owned) continue;
      biz.stored = Math.min(biz.income * 120, biz.stored + biz.income / 60 * b.money * dt);
    }
    if (G.yt.subs > 0) G.player.money += G.yt.subs * 0.002 / 60 * dt * b.money;

    if (E.petObj && E.activePet && !G.player.inCar) {
      const t = G.player.pos;
      const target = E.activePet === 'falcon'
        ? { x: t.x + Math.cos(G.state.time * 40) * 3, z: t.z + Math.sin(G.state.time * 40) * 3, y: 5 }
        : { x: t.x - Math.sin(G.player.obj.rotation.y) * 1.8, z: t.z - Math.cos(G.player.obj.rotation.y) * 1.8, y: 0 };
      E.petObj.position.x = U.lerp(E.petObj.position.x, target.x, dt * 4);
      E.petObj.position.z = U.lerp(E.petObj.position.z, target.z, dt * 4);
      E.petObj.position.y = U.lerp(E.petObj.position.y, target.y || 0, dt * 4);
      E.petObj.rotation.y = G.player.obj.rotation.y;

      E.petAtkCd -= dt;
      if (E.petAtkCd <= 0 && (E.activePet === 'panther' || E.activePet === 'dragon')) {
        for (const n of G.npcs) {
          if (n.dead) continue;
          if (U.d2(n.obj.position.x, n.obj.position.z, t.x, t.z) < 196) {
            E.petAtkCd = 4;
            if (E.activePet === 'dragon') {
              G.combat.explode(G.V3(n.obj.position.x, 1, n.obj.position.z), 3, 30, true);
            } else {
              G.damageNPC(n, 15, false);
              G.sfx.melee();
            }
            break;
          }
        }
      }
    }

    for (const d of G.world.districts) {
      if (d.owned) G.player.money += d.income / 60 * b.money * dt;
    }
  };

  E.initLocations = function () {
    for (const b of E.businesses) {
      const c = G.world.cellCenter(b.loc.i, b.loc.j);
      b.x = c.x + b.loc.dx; b.z = c.z + b.loc.dz;
      G.world.makeMarker(b.x, b.z, b.owned ? 0x2fd46e : 0xffd23e, 'biz_' + b.id);
      G.world.addStaticBlip(b.x, b.z, 0xffd23e, b.name);
    }
  };
})();
