'use strict';
(function () {
  const C = {};
  G.combat = C;

  C.WEAPONS = {
    fists: { name: 'Poings', type: 'melee', dmg: 12, rate: 0.45, range: 1.9, price: 0, desc: 'Vos poings. Gratuits mais courageux.' },
    bat: { name: 'Batte cloutée', type: 'melee', dmg: 30, rate: 0.6, range: 2.4, price: 800, desc: 'Classique des rues.' },
    katana: { name: 'Katana Néon', type: 'melee', dmg: 55, rate: 0.5, range: 2.8, price: 12000, desc: 'Lame tranchante, élégance mortelle.' },
    machete: { name: 'Machette Biker', type: 'melee', dmg: 40, rate: 0.55, range: 2.5, price: 4500, desc: 'Brute, efficace, sans chichis.' },
    pistol: { name: 'P-9', type: 'gun', dmg: 22, rate: 0.28, mag: 12, reload: 1.1, range: 65, spread: 0.014, price: 1500, ammoPack: 60, ammoPrice: 75, desc: 'Fiable, discret, efficace.' },
    smg: { name: 'Spectre SMG', type: 'gun', dmg: 14, rate: 0.09, mag: 32, reload: 1.6, range: 55, spread: 0.032, price: 6500, ammoPack: 150, ammoPrice: 120, desc: 'Cadence infernale.' },
    shotgun: { name: 'Brise-Nez', type: 'gun', dmg: 11, pellets: 8, rate: 0.85, mag: 6, reload: 2, range: 24, spread: 0.07, price: 9500, ammoPack: 40, ammoPrice: 100, desc: 'Courte portée, gros dégâts.' },
    rifle: { name: 'AK-Neon', type: 'gun', dmg: 26, rate: 0.13, mag: 30, reload: 1.9, range: 85, spread: 0.02, price: 18000, ammoPack: 120, ammoPrice: 150, desc: 'Le fusil d\'assaut du quartier.' },
    sniper: { name: 'Longvue', type: 'gun', dmg: 95, rate: 1.4, mag: 5, reload: 2.4, range: 220, spread: 0.001, price: 35000, ammoPack: 20, ammoPrice: 120, scope: true, desc: 'Un tir, un souvenir.' },
    rpg: { name: 'Guerrier RPG', type: 'launcher', dmg: 150, rate: 1.9, mag: 1, reload: 2.4, range: 130, price: 60000, ammoPack: 6, ammoPrice: 500, rocket: true, desc: 'Démolition contrôlée. Enfin, presque.' },
    gl6: { name: 'Lance-Grenades GL-6', type: 'launcher', dmg: 90, rate: 1.4, mag: 4, reload: 2.6, range: 90, price: 40000, ammoPack: 8, ammoPrice: 300, rocket: true, desc: 'Explosions en rafale, à couvrir.' },
    minigun: { name: 'Minigun Béhémoth', type: 'gun', dmg: 10, rate: 0.06, mag: 150, reload: 4.5, range: 55, spread: 0.07, price: 120000, ammoPack: 300, ammoPrice: 400, desc: '300 cartouches de pur chaos.' },
    flamer: { name: 'Lance-Flammes Inferno', type: 'gun', dmg: 8, rate: 0.05, mag: 120, reload: 3, range: 15, spread: 0.1, price: 65000, ammoPack: 240, ammoPrice: 150, burn: true, desc: 'Enflamme tout ce que ça touche.' },
    plasma: { name: '★ Fusil Plasma', type: 'gun', dmg: 70, rate: 0.5, mag: 10, reload: 2.2, range: 120, spread: 0.008, price: 300000, ammoPack: 30, ammoPrice: 450, exclusive: true, unlock: 'Niveau 15', desc: 'Technologie du Rift. Fond l\'acier.' },
    reaper: { name: '★ Faucheuse Écarlate', type: 'gun', dmg: 32, pellets: 6, rate: 0.5, mag: 10, reload: 1.8, range: 30, spread: 0.05, price: 0, ammoPack: 40, ammoPrice: 200, exclusive: true, desc: 'Trophée des gangs. Fauche tout à courte portée.', unlock: 'Capturez les 5 territoires' },
    railx: { name: '★ Rail-X', type: 'gun', dmg: 150, rate: 1.2, mag: 4, reload: 2.2, range: 260, spread: 0, price: 120000, ammoPack: 12, ammoPrice: 250, exclusive: true, desc: 'Canon électromagnétique. Transperce tout.', unlock: 'Niveau 10' },
    goldenak: { name: '★ AK Dorée', type: 'gun', dmg: 42, rate: 0.1, mag: 45, reload: 1.8, range: 95, spread: 0.016, price: 0, ammoPack: 150, ammoPrice: 200, exclusive: true, desc: 'L\'arme des stars de YouTube.', unlock: '1M d\'abonnés' },
    dragonsbreath: { name: '★ Souffle du Dragon', type: 'gun', dmg: 14, pellets: 10, rate: 0.75, mag: 8, reload: 2, range: 28, spread: 0.06, price: 250000, ammoPack: 48, ammoPrice: 250, exclusive: true, desc: 'Un fusil à pompe enflammé de légende.', unlock: 'Casino — roll high' },
    voidcannon: { name: '★ Canon du Vide', type: 'launcher', dmg: 220, rate: 2.2, mag: 1, reload: 2.6, range: 140, price: 0, ammoPack: 5, ammoPrice: 600, rocket: true, exclusive: true, desc: 'Déchire la réalité elle-même.', unlock: 'Vaincre le Golem du Rift' }
  };

  C.initPlayerCombat = function () {
    G.player.wanted = 0;
  };

  C.curWeapon = () => C.WEAPONS[G.player.cur];

  C.cycleWeapon = function () {
    const p = G.player;
    const owned = Object.keys(p.weapons).filter(k => p.weapons[k].owned);
    const idx = owned.indexOf(p.cur);
    p.cur = owned[(idx + 1) % owned.length];
    p.reloadT = 0;
    G.ui.toast('🔫 ' + C.WEAPONS[p.cur].name);
    G.sfx.ui();
  };

  C.giveWeapon = function (id, silent) {
    const p = G.player, w = C.WEAPONS[id];
    if (!w) return;
    if (!p.weapons[id]) p.weapons[id] = { owned: true, ammo: w.mag || 0, reserve: (w.ammoPack || 0) };
    else p.weapons[id].owned = true;
    p.cur = id;
    if (!silent) { G.ui.toast('🔫 Nouvelle arme : ' + w.name, 'money'); G.sfx.buy(); }
  };

  function camDir() {
    const d = G.V3();
    G.camera.getWorldDirection(d);
    return d;
  }

  function spreadDir(dir, spread) {
    const d = dir.clone();
    d.x += U.rand(-spread, spread);
    d.y += U.rand(-spread, spread);
    d.z += U.rand(-spread, spread);
    return d.normalize();
  }

  C.fire = function () {
    const p = G.player;
    const w = C.curWeapon();
    const slot = p.weapons[p.cur];
    if (p.fireT > 0 || p.reloadT > 0) return;
    if (w.type !== 'melee' && slot.ammo <= 0) {
      if (slot.reserve > 0) { p.reloadT = w.reload; }
      else { G.sfx.deny(); p.fireT = 0.4; }
      return;
    }
    p.fireT = w.rate;
    const dir = camDir();
    const origin = G.camera.position.clone().add(dir.clone().multiplyScalar(1.2));

    if (w.type === 'melee') {
      G.sfx.melee();
      const total = w.dmg * G.eco.bonuses().dmg;
      let hitAny = false;
      for (const n of G.npcs) {
        if (n.dead) continue;
        const d = Math.sqrt(U.d2(n.obj.position.x, n.obj.position.z, p.pos.x, p.pos.z));
        if (d < w.range) {
          const to = G.V3(n.obj.position.x - p.pos.x, 0, n.obj.position.z - p.pos.z).normalize();
          const f = G.V3(Math.sin(p.obj.rotation.y), 0, Math.cos(p.obj.rotation.y));
          if (to.dot(f) > 0.3) { G.damageNPC(n, total, false); hitAny = true; }
        }
      }
      if (hitAny && G.yt.recording) G.yt.addEvent(8, 'Combat au corps à corps !');
      return;
    }

    slot.ammo--;
    G.sfx.shot(w.type === 'launcher');
    G.state.lastShotAt = performance.now();

    if (w.rocket) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff8830 }));
      mesh.position.copy(origin);
      G.scene.add(mesh);
      G.projectiles.push({ obj: mesh, dir: dir.clone(), speed: 55, ttl: 3, dmg: w.dmg * G.eco.bonuses().dmg, radius: p.cur === 'voidcannon' ? 10 : 6 });
      return;
    }

    const pellets = w.pellets || 1;
    const eyeBonus = G.eco.equipped.includes('eye') ? 0.7 : 1;
    for (let k = 0; k < pellets; k++) {
      const d = spreadDir(dir, (p.aiming ? 0.4 : 1) * (w.spread || 0.01) * eyeBonus);
      C.hitscan(origin, d, w.range, w.dmg * G.eco.bonuses().dmg, p.pos);
    }
    G.cam.shake = Math.min(0.3, G.cam.shake + 0.05);
  };

  C.hitscan = function (origin, dir, range, dmg, fromPos) {
    let bestT = range, bestNpc = null, bestCar = null, headshot = false;

    const blockT = G.world.rayBlocked(origin, dir, range);
    if (blockT !== null) bestT = blockT;

    for (const n of G.npcs) {
      if (n.dead) continue;
      const c = G.V3(n.obj.position.x, n.obj.position.y + 1.2 * (n.obj.scale.x || 1), n.obj.position.z);
      const toC = c.clone().sub(origin);
      const t = toC.dot(dir);
      if (t < 0 || t > bestT) continue;
      const perp = toC.sub(dir.clone().multiplyScalar(t)).length();
      const rad = 0.85 * (n.obj.scale.x || 1);
      if (perp < rad) {
        bestT = t; bestNpc = n; bestCar = null;
        headshot = perp < rad * 0.35;
      }
    }
    for (const car of G.cars) {
      if (car.wrecked) continue;
      const c = car.obj.position.clone().add(G.V3(0, 0.8, 0));
      const toC = c.clone().sub(origin);
      const t = toC.dot(dir);
      if (t < 0 || t > bestT) continue;
      const perp = toC.sub(dir.clone().multiplyScalar(t)).length();
      if (perp < 1.6) { bestT = t; bestCar = car; bestNpc = null; }
    }

    const end = origin.clone().add(dir.clone().multiplyScalar(bestT));
    const g = new THREE.BufferGeometry().setFromPoints([origin.clone(), end]);
    const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xfff0a0, transparent: true, opacity: 0.7 }));
    G.scene.add(line);
    G.effects.push({ obj: line, ttl: 0.05 });

    if (bestNpc) {
      G.damageNPC(bestNpc, headshot ? dmg * 2 : dmg, headshot);
      if (C.curWeapon().burn && !bestNpc.dead) bestNpc.burnT = 3;
    } else if (bestCar) {
      G.vehicles.damageCar(bestCar, dmg * 0.7, true);
    }
  };

  C.updateProjectiles = function (dt) {
    for (let i = G.projectiles.length - 1; i >= 0; i--) {
      const pr = G.projectiles[i];
      pr.ttl -= dt;
      pr.obj.position.add(pr.dir.clone().multiplyScalar(pr.speed * dt));
      const p = pr.obj.position;
      let boom = pr.ttl <= 0 || p.y <= 0.2;
      const blockT = G.world.rayBlocked(pr.obj.position.clone().add(pr.dir.clone().multiplyScalar(-0.5)), pr.dir, pr.speed * dt + 0.6);
      if (blockT !== null) boom = true;
      if (!boom) {
        for (const n of G.npcs) {
          if (!n.dead && U.d2(n.obj.position.x, n.obj.position.z, p.x, p.z) < 2.2) { boom = true; break; }
        }
      }
      if (boom) {
        C.explode(p.clone(), pr.radius, pr.dmg, true);
        G.scene.remove(pr.obj);
        G.projectiles.splice(i, 1);
      }
    }
  };

  C.explode = function (pos, radius, dmg, byPlayer) {
    G.sfx.explode();
    const s = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xffa030, transparent: true, opacity: 0.9 }));
    s.position.copy(pos);
    G.scene.add(s);
    G.effects.push({ obj: s, ttl: 0.4, grow: radius });

    for (const n of G.npcs) {
      if (n.dead) continue;
      const d = Math.sqrt(U.d2(n.obj.position.x, n.obj.position.z, pos.x, pos.z));
      if (d < radius) G.damageNPC(n, dmg * (1 - d / radius), false);
    }
    for (const car of G.cars) {
      if (car.wrecked) continue;
      const d = Math.sqrt(U.d2(car.obj.position.x, car.obj.position.z, pos.x, pos.z));
      if (d < radius + 1) G.vehicles.damageCar(car, dmg * (1 - d / radius), byPlayer);
    }
    const pd = Math.sqrt(U.d2(G.player.pos.x, G.player.pos.z, pos.x, pos.z));
    if (pd < radius) C.hurtPlayer(dmg * 0.5 * (1 - pd / radius));
    G.cam.shake = Math.min(0.8, G.cam.shake + 0.4);
    if (G.yt.recording) G.yt.addEvent(30, '💥 Explosion filmée !');
  };

  C.shockwave = function (pos, radius) {
    const r = new THREE.Mesh(new THREE.RingGeometry(0.5, 1, 24),
      new THREE.MeshBasicMaterial({ color: 0xffaa40, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
    r.rotation.x = -Math.PI / 2;
    r.position.set(pos.x, 0.3, pos.z);
    G.scene.add(r);
    G.effects.push({ obj: r, ttl: 0.5, grow: radius });
  };

  C.crime = function (pos, amount) {
    if (G.state.wasted) return;
    let witness = false;
    for (const n of G.npcs) {
      if (!n.dead && (n.type === 'ped' || n.type === 'cop') &&
        U.d2(n.obj.position.x, n.obj.position.z, pos.x, pos.z) < 900) { witness = true; break; }
    }
    if (!witness) return;
    const now = performance.now() / 1000;
    if (now - G.state.lastCrime > 8) {
      G.player.wanted = Math.min(5, G.player.wanted + Math.ceil(amount));
      G.sfx.alarm();
      G.ui.toast('🚨 Recherché ! Niveau ' + G.player.wanted, 'warn');
    }
    G.state.lastCrime = now;
  };

  C.hurtPlayer = function (dmg) {
    const p = G.player;
    if (G.state.wasted) return;
    if (dmg > 0 && G.eco.hasPet('bear')) dmg *= 0.75;
    if (p.armor > 0) {
      const absorbed = Math.min(p.armor, dmg * 0.6);
      p.armor -= absorbed;
      dmg -= absorbed;
    }
    p.hp -= dmg;
    G.ui.flash();
    if (p.hp <= 0) {
      if (G.eco.equipped.includes('ankh') && G.eco.reviveCd <= 0) {
        G.eco.reviveCd = 300;
        p.hp = p.maxHp * 0.5;
        G.ui.toast('☥ ANKH : RÉSURRECTION ! Tu te relèves du cercle des morts.', 'money');
        G.sfx.levelup();
        G.cam.shake = 0.8;
        return;
      }
      C.wasted();
    }
  };

  C.cleanupEventNPCs = function () {
    for (let i = G.npcs.length - 1; i >= 0; i--) {
      const n = G.npcs[i];
      if (n.warTag || n.survival) { G.scene.remove(n.obj); G.npcs.splice(i, 1); }
    }
  };

  C.busted = function () {
    if (G.state.wasted) return;
    const p = G.player;
    G.state.wasted = true;
    G.ui.bigMsg('ATTRAPÉ 🚔', false);
    G.sfx.alarm();
    C.cleanupEventNPCs();
    if (G.modes.survival.active) G.modes.survival.active = false;
    if (G.modes.race.active) G.modes.race.active = false;
    if (G.modes.war.active) G.modes.war.active = false;
    setTimeout(() => {
      const loss = Math.min(2000, Math.floor(p.money * 0.15));
      p.money -= loss;
      p.wanted = 0;
      p.hp = p.maxHp * 0.8;
      if (p.inCar) { p.inCar.driver = null; p.inCar = null; G.sfx.engine(false); }
      const c = G.world.cellCenter(4, 4);
      p.pos.set(c.x + 18, 0, c.z + 18);
      G.state.wasted = false;
      G.ui.hideBig();
      G.ui.toast('Commissariat central : ' + U.fmt(loss) + " d'amende");
    }, 2200);
  };

  C.wasted = function () {
    const p = G.player;
    G.state.wasted = true;
    p.hp = 0;
    G.ui.bigMsg('ÉLIMINÉ', false);
    C.cleanupEventNPCs();
    if (G.modes.survival.active) G.modes.survival.active = false;
    if (G.modes.race.active) G.modes.race.active = false;
    if (G.modes.war.active) G.modes.war.active = false;
    setTimeout(() => {
      p.money = Math.max(0, p.money - 200);
      p.hp = p.maxHp * 0.6;
      p.wanted = 0;
      if (p.inCar) { p.inCar.driver = null; p.inCar = null; G.sfx.engine(false); }
      const c = G.world.cellCenter(4, 5);
      p.pos.set(c.x + 20, 0, c.z + 20);
      G.state.wasted = false;
      G.ui.hideBig();
      G.ui.toast('Hôpital central : -200$ de frais');
    }, 2500);
  };

  C.update = function (dt) {
    const p = G.player;
    p.fireT -= dt;
    if (p.reloadT > 0) {
      p.reloadT -= dt;
      if (p.reloadT <= 0) {
        const slot = p.weapons[p.cur], w = C.WEAPONS[p.cur];
        const need = w.mag - slot.ammo;
        const take = Math.min(need, slot.reserve);
        slot.ammo += take; slot.reserve -= take;
      }
    }
    if (G.input.fire && G.state.screen === 'play' && !G.state.paused) C.fire();
    if (G.input.pulse('weapon')) C.cycleWeapon();

    for (let i = G.effects.length - 1; i >= 0; i--) {
      const e = G.effects[i];
      e.ttl -= dt;
      if (e.grow) {
        const s = 1 + (1 - Math.max(e.ttl, 0) / 0.5) * e.grow;
        e.obj.scale.setScalar(s);
        if (e.obj.material) e.obj.material.opacity = Math.max(0, e.ttl * 2);
      }
      if (e.ttl <= 0) {
        G.scene.remove(e.obj);
        if (e.obj.geometry) e.obj.geometry.dispose();
        G.effects.splice(i, 1);
      }
    }

    const regen = G.eco.bonuses().regen;
    if (regen > 0 && p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + regen * dt);

    if (p.wanted > 0) {
      const now = performance.now() / 1000;
      if (now - G.state.lastCrime > 22) {
        p.wanted--;
        G.state.lastCrime = now;
        if (p.wanted === 0) G.ui.toast('Vous avez semé la police 😎');
      }
    }

    let copNear = false;
    for (const n of G.npcs) {
      if (n.type === 'cop' && !n.dead &&
        U.d2(n.obj.position.x, n.obj.position.z, p.pos.x, p.pos.z) < 3600) { copNear = true; break; }
    }
    const sirenOn = p.wanted > 0 && copNear;
    if (sirenOn !== G.state.sirenOn) {
      G.state.sirenOn = sirenOn;
      G.sfx.siren(sirenOn);
    }
  };
})();
