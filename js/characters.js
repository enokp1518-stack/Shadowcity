'use strict';
(function () {

  const SKINS = [0xf2c99b, 0xd9a066, 0xb07b4f, 0x8a5a3b, 0xf5d7b0, 0xc98e63];
  const HAIRS = [0x1b1b1b, 0x3d2b1f, 0x6b4423, 0x8a8a8a, 0xd9b34a, 0x7a3b2e, 0x2f4a8a];
  const faceCache = {};
  const hexCss = (h) => '#' + h.toString(16).padStart(6, '0');

  G.faceTex = function (mood, open, skin, hair) {
    const key = mood + '|' + (open ? 1 : 0) + '|' + skin + '|' + hair;
    if (faceCache[key]) return faceCache[key];
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = hexCss(skin); x.fillRect(0, 0, 128, 128);
    if (hair !== null) {
      x.fillStyle = hexCss(hair);
      x.fillRect(0, 0, 128, 20);
      x.fillRect(0, 0, 9, 62); x.fillRect(119, 0, 9, 62);
    }
    if (mood === 'shady') {
      x.fillStyle = '#0a0a0c'; x.fillRect(13, 45, 102, 23);
      x.fillStyle = 'rgba(255,255,255,0.28)'; x.fillRect(20, 49, 26, 5);
    } else {
      const big = mood === 'scared';
      const ew = big ? 27 : 20, eh = big ? 21 : 14;
      x.fillStyle = '#ffffff';
      x.fillRect(28 - ew / 2, 54 - eh / 2, ew, eh);
      x.fillRect(100 - ew / 2, 54 - eh / 2, ew, eh);
      x.fillStyle = '#14161c';
      const pw = mood === 'angry' ? 5 : 7;
      x.fillRect(28 - pw / 2, 54 - pw / 2, pw, pw + 3);
      x.fillRect(100 - pw / 2, 54 - pw / 2, pw, pw + 3);
      if (hair !== null) {
        x.fillStyle = hexCss(hair);
        if (mood === 'angry') {
          x.save(); x.translate(28, 40); x.rotate(0.38); x.fillRect(-15, -3, 30, 6); x.restore();
          x.save(); x.translate(100, 40); x.rotate(-0.38); x.fillRect(-15, -3, 30, 6); x.restore();
        } else if (mood === 'scared') {
          x.fillRect(14, 29, 28, 5); x.fillRect(86, 29, 28, 5);
        } else {
          x.fillRect(16, 37, 24, 5); x.fillRect(88, 37, 24, 5);
        }
      }
    }
    if (open) {
      x.fillStyle = '#5a2d24';
      x.beginPath(); x.ellipse(64, 94, 14, 11, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#8a4646'; x.fillRect(58, 99, 12, 4);
    } else if (mood === 'happy') {
      x.strokeStyle = '#5a2d24'; x.lineWidth = 5;
      x.beginPath(); x.arc(64, 86, 15, 0.12 * Math.PI, 0.88 * Math.PI); x.stroke();
    } else if (mood === 'angry') {
      x.fillStyle = '#5a2d24'; x.fillRect(47, 93, 34, 6);
      x.fillStyle = '#ffffff';
      for (let k = 0; k < 4; k++) x.fillRect(50 + k * 8, 93, 5, 4);
    } else {
      x.fillStyle = '#5a2d24'; x.fillRect(50, 94, 28, 4);
    }
    const t = new THREE.CanvasTexture(c);
    faceCache[key] = t;
    return t;
  };

  G.makeHumanoid = function (color, scale, opts) {
    const o = opts || {};
    const skin = o.skin || U.pick(SKINS);
    const hair = o.hair !== undefined ? o.hair : U.pick(HAIRS);
    const mood = o.mood || 'neutral';
    const g = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color });
    const skinMat = new THREE.MeshLambertMaterial({ color: skin });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.4), mat);
    body.position.y = 1.15; body.castShadow = true;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), skinMat);
    head.position.y = 1.82; head.castShadow = true;
    const faceMat = new THREE.MeshLambertMaterial({ map: G.faceTex(mood, false, skin, hair) });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), faceMat);
    face.position.z = 0.216;
    head.add(face);
    if (hair !== null) {
      const hm = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.13, 0.46), new THREE.MeshLambertMaterial({ color: hair }));
      hm.position.y = 0.24;
      head.add(hm);
    }
    function limb(w, ulen, llen, px, py, matl, endColor, endW) {
      const pivot = new THREE.Group();
      pivot.position.set(px, py, 0);
      const upper = new THREE.Mesh(new THREE.BoxGeometry(w, ulen, w), matl);
      upper.position.y = -ulen / 2 + 0.05;
      upper.castShadow = true;
      pivot.add(upper);
      const joint = new THREE.Group();
      joint.position.y = -ulen + 0.05;
      const lower = new THREE.Mesh(new THREE.BoxGeometry(w * 0.85, llen, w * 0.85), matl);
      lower.position.y = -llen / 2 + 0.02;
      lower.castShadow = true;
      joint.add(lower);
      if (endColor !== null) {
        const end = new THREE.Mesh(new THREE.BoxGeometry(w * (endW || 1.05), 0.15, w * 1.5), new THREE.MeshLambertMaterial({ color: endColor }));
        end.position.y = -llen - 0.03;
        joint.add(end);
      }
      pivot.add(joint);
      pivot.userData.joint = joint;
      return pivot;
    }
    const skinHex = o.skin || 0xd9a066;
    const lArm = limb(0.2, 0.4, 0.38, -0.46, 1.5, mat, o.hands === false ? null : skinHex);
    const rArm = limb(0.2, 0.4, 0.38, 0.46, 1.5, mat, o.hands === false ? null : skinHex);
    const lLeg = limb(0.24, 0.4, 0.42, -0.18, 0.75, new THREE.MeshLambertMaterial({ color: 0x2a2f3a }), o.feet === false ? null : 0x14161a, 1.2);
    const rLeg = limb(0.24, 0.4, 0.42, 0.18, 0.75, new THREE.MeshLambertMaterial({ color: 0x2a2f3a }), o.feet === false ? null : 0x14161a, 1.2);
    g.add(body, head, lArm, rArm, lLeg, rLeg);
    if (scale) g.scale.setScalar(scale);
    g.userData.anim = { lArm, rArm, lLeg, rLeg, head, body };
    g.userData.mat = mat;
    g.userData.face = { mat: faceMat, mood, open: false, skin, hair };
    return g;
  };

  G.setFace = function (h, mood) {
    const f = h.userData.face;
    if (!f || f.mood === mood) return;
    f.mood = mood;
    f.mat.map = G.faceTex(mood, f.open, f.skin, f.hair);
  };

  G.setFaceOpen = function (h, open) {
    const f = h.userData.face;
    if (!f || f.open === open) return;
    f.open = open;
    f.mat.map = G.faceTex(f.mood, open, f.skin, f.hair);
  };

  function animWalk(h, moving, t, run) {
    const a = h.userData.anim;
    const amp = moving ? (run ? 0.9 : 0.55) : 0.06;
    const s = Math.sin(t * (run ? 11 : 7));
    a.lLeg.rotation.x = s * amp;
    a.rLeg.rotation.x = -s * amp;
    a.lArm.rotation.x = -s * amp * 0.8;
    a.rArm.rotation.x = s * amp * 0.8;
    const bend = moving ? (run ? 1.15 : 0.7) : 0.1;
    a.lLeg.userData.joint.rotation.x = Math.max(0, -s) * bend;
    a.rLeg.userData.joint.rotation.x = Math.max(0, s) * bend;
    const eb = moving ? (run ? 0.85 : 0.5) : 0.22;
    a.lArm.userData.joint.rotation.x = -Math.max(0, s) * eb - 0.12;
    a.rArm.userData.joint.rotation.x = Math.max(0, -s) * eb - 0.12;
    a.body.position.y = 1.15 + (moving ? Math.abs(s) * 0.05 : 0);
    a.body.scale.y = moving ? 1 : 1 + Math.sin(t * 2.2) * 0.012;
  }

  function initPlayer() {
    const obj = G.makeHumanoid(0x2f9bff);
    G.scene.add(obj);
    G.player = {
      obj, pos: new THREE.Vector3(G.world.cellCenter(4, 5).x, 0, G.world.cellCenter(4, 5).z + 20),
      vel: new THREE.Vector3(), yaw: 0, onGround: true,
      hp: 100, maxHp: 100, armor: 0, money: 500, xp: 0, level: 1,
      weapons: { fists: { owned: true, ammo: Infinity, reserve: Infinity } },
      cur: 'fists', reloadT: 0, fireT: 0,
      inCar: null, aiming: false, sprint: false, animT: 0,
      medkits: 3
    };
    G.player.pos.x += 0;
  }

  G.initPlayer = initPlayer;

  G.playerSpeedBonus = function () {
    let b = 1;
    if (G.eco) b *= G.eco.bonuses().speed;
    return b;
  };

  G.updatePlayer = function (dt) {
    const p = G.player, I = G.input;
    if (p.inCar) { p.obj.visible = false; return; }
    p.obj.visible = true;

    let mx = I.move.x, my = I.move.y;
    if (I.keys['KeyW'] || I.keys['ArrowUp']) my += 1;
    if (I.keys['KeyS'] || I.keys['ArrowDown']) my -= 1;
    if (I.keys['KeyA'] || I.keys['ArrowLeft']) mx -= 1;
    if (I.keys['KeyD'] || I.keys['ArrowRight']) mx += 1;
    const sprint = I.sprint || I.keys['ShiftLeft'];
    p.aiming = I.aim;

    const mag = Math.hypot(mx, my);
    let speed = 0;
    if (mag > 0.1) {
      const run = sprint && !p.aiming;
      speed = (p.aiming ? 2.6 : run ? 8.5 : 5) * G.playerSpeedBonus();
      const cy = G.cam.yaw;
      const wx = (mx * Math.cos(cy) - my * Math.sin(cy)) / Math.max(mag, 1);
      const wz = (mx * Math.sin(cy) + my * Math.cos(cy)) / Math.max(mag, 1);
      p.vel.x = U.lerp(p.vel.x, wx * speed, 0.3);
      p.vel.z = U.lerp(p.vel.z, wz * speed, 0.3);
      p.yaw = Math.atan2(wx, wz);
    } else {
      p.vel.x *= 0.8; p.vel.z *= 0.8;
    }

    p.vel.y -= 26 * dt;
    if (I.pulse('jump') && p.onGround) { p.vel.y = G.eco.equipped.includes('ninja') ? 12.5 : 9.5; p.onGround = false; G.sfx.melee(); }

    let nx = p.pos.x + p.vel.x * dt, nz = p.pos.z + p.vel.z * dt;
    [nx, nz] = G.world.collideCircle(nx, nz, 0.45);
    p.pos.x = nx; p.pos.z = nz;
    p.pos.y += p.vel.y * dt;
    if (p.pos.y <= 0) { p.pos.y = 0; p.vel.y = 0; p.onGround = true; }

    p.obj.position.copy(p.pos);
    if (mag > 0.1 || !p.aiming) {
      const targetYaw = p.aiming ? G.cam.yaw + Math.PI : p.yaw;
      let d = targetYaw - p.obj.rotation.y;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      p.obj.rotation.y += d * 0.25;
    }
    p.animT += dt;
    animWalk(p.obj, mag > 0.1, p.animT, sprint);
    if (p.aiming) {
      p.obj.userData.anim.rArm.rotation.x = -Math.PI / 2;
      p.obj.userData.anim.rArm.userData.joint.rotation.x = -0.08;
    }

    G.stats.distance += Math.hypot(p.vel.x, p.vel.z) * dt;

    for (let i = G.pickups.length - 1; i >= 0; i--) {
      const pk = G.pickups[i];
      pk.obj.rotation.y += dt * 3;
      const d2 = U.d2(p.pos.x, p.pos.z, pk.obj.position.x, pk.obj.position.z);
      if (d2 < 144 && pk.magnet) {
        pk.obj.position.x = U.lerp(pk.obj.position.x, p.pos.x, 0.15);
        pk.obj.position.z = U.lerp(pk.obj.position.z, p.pos.z, 0.15);
      }
      if (d2 < 2.5) {
        G.eco.earn(pk.amount);
        G.scene.remove(pk.obj);
        G.pickups.splice(i, 1);
      }
    }
  };

  const GANG_COLORS = { Crimson: 0xd22c2c, Wolves: 0x9a7a4f, Vipers: 0x2f9e44, Kings: 0xae3ec9, Ghosts: 0xdfe6f0, COPS: 0x2f6bff };

  function baseNPC(type, x, z, color, opts) {
    const obj = G.makeHumanoid(color, 0, opts);
    obj.position.set(x, 0, z);
    G.scene.add(obj);
    const npc = {
      obj, type, hp: 40, maxHp: 40, dead: false, deadT: 0,
      state: 'wander', target: null, shootCd: U.rand(0.5, 2), aiT: U.rand(0, 0.3),
      home: { x, z }, wanderT: 0, wx: x, wz: z, aggro: false, speed: 2,
      warTag: false, survival: false, animT: U.rand(0, 9)
    };
    G.npcs.push(npc);
    return npc;
  }

  G.spawnPed = function () {
    const pt = G.world.randRoadPoint();
    const n = baseNPC('ped', pt.x, pt.z, U.pick([0xcc8866, 0x6688cc, 0x88bb66, 0xbb6688, 0x999999, 0xddaa55]), { mood: U.pick(['neutral', 'happy']) });
    n.hp = n.maxHp = 30;
    return n;
  };

  G.spawnGang = function (districtId, nearX, nearZ, warTag) {
    const d = G.world.districts.find(x => x.id === districtId);
    const n = baseNPC('gang', nearX + U.rand(-14, 14), nearZ + U.rand(-14, 14), GANG_COLORS[d.gang], { mood: 'shady' });
    n.hp = n.maxHp = 55 + G.player.level * 6;
    n.speed = 4.2; n.gang = d.gang; n.district = districtId; n.warTag = !!warTag;
    n.dmg = 6 + G.player.level;
    return n;
  };

  G.spawnCop = function (nearX, nearZ) {
    const ang = U.rand(0, Math.PI * 2), r = U.rand(55, 80);
    let x = U.clamp(nearX + Math.cos(ang) * r, G.world.ORIGIN + 8, -G.world.ORIGIN - 8);
    let z = U.clamp(nearZ + Math.sin(ang) * r, G.world.ORIGIN + 8, -G.world.ORIGIN - 8);
    const swat = G.player.wanted >= 4;
    const n = baseNPC('cop', x, z, swat ? 0x1a2a5a : GANG_COLORS.COPS, { mood: 'neutral', hair: 0x1b1b1b });
    n.hp = n.maxHp = swat ? 150 : 80;
    n.speed = swat ? 6.2 : 5.5;
    n.dmg = swat ? 13 : 8;
    n.shootCd = 1;
    if (swat) n.obj.userData.mat.color.setHex(0x1a2a5a);
    return n;
  };

  const CREATURES = {
    hellhound: { hp: 45, speed: 8.5, dmg: 8, scale: 0.8, color: 0x331a1a, name: 'Chien de l’enfer' },
    brute: { hp: 220, speed: 3, dmg: 24, scale: 1.5, color: 0x4a5a3a, name: 'Brute mutante' },
    spitter: { hp: 60, speed: 4, dmg: 10, scale: 1, color: 0x6a2d8f, name: 'Cracheur', ranged: true }
  };
  G.CREATURES = CREATURES;

  G.spawnCreature = function (kind, x, z, hpMul) {
    const def = CREATURES[kind];
    const obj = G.makeHumanoid(def.color, def.scale, { mood: 'angry', hair: null, skin: def.color });
    obj.position.set(x, 0, z);
    G.scene.add(obj);
    const n = {
      obj, type: 'creature', kind, hp: def.hp * (hpMul || 1), maxHp: def.hp * (hpMul || 1),
      dead: false, deadT: 0, speed: def.speed, dmg: def.dmg, ranged: def.ranged,
      state: 'chase', shootCd: 1.5, aiT: 0, animT: U.rand(0, 9), survival: true, warTag: false
    };
    G.npcs.push(n);
    return n;
  };

  G.spawnBoss = function (x, z) {
    const obj = G.makeHumanoid(0x1a0a2a, 3.2, { mood: 'angry', hair: null, skin: 0x1a0a2a });
    obj.position.set(x, 0, z);
    G.scene.add(obj);
    const n = {
      obj, type: 'boss', kind: 'golem', hp: 1800 + G.player.level * 100, maxHp: 1800 + G.player.level * 100,
      dead: false, deadT: 0, speed: 3.4, dmg: 34, state: 'chase', shootCd: 3, slamCd: 3, aiT: 0,
      animT: 0, boss: true, survival: false
    };
    G.npcs.push(n);
    return n;
  };

  G.damageNPC = function (npc, dmg, headshot) {
    if (npc.dead) return;
    npc.hp -= dmg;
    if (G.eco && G.eco.equipped.includes('vampire')) {
      const p = G.player;
      p.hp = Math.min(p.maxHp, p.hp + dmg * 0.1);
    }
    npc.aggro = true;
    npc.state = 'chase';
    G.sfx.hit();
    if (npc.hp <= 0) {
      npc.dead = true; npc.deadT = 0;
      npc.obj.rotation.z = Math.PI / 2;
      npc.obj.position.y = 0.4;
      G.stats.kills++;
      if (headshot) G.stats.headshots++;
      G.addXP(npc.boss ? 500 : npc.type === 'creature' ? 25 : npc.type === 'cop' ? 40 : 20);
      G.state.kills++;
      if (G.yt.recording) G.yt.addEvent(headshot ? 25 : 10, headshot ? 'Headshot !' : 'Élimination');
      if (npc.type === 'ped') G.combat.crime(npc.obj.position, 1);
      if (npc.type === 'cop') G.combat.crime(npc.obj.position, 1.2);
      if (!npc.survival && !npc.warTag && Math.random() < 0.6) G.spawnPickup(npc.obj.position.x, npc.obj.position.z, U.randi(20, 80));
      if (npc.warTag && G.modes.war.active) G.modes.war.kills++;
      if (npc.survival && G.modes.survival.active) G.modes.survival.alive--;
      if (npc.boss) G.modes.onBossDead(npc);
      if (G.eco.bonuses().luck > 0 && Math.random() < 0.08 + G.eco.bonuses().luck * 0.08) {
        const arts = G.eco.ARTIFACTS;
        const a = U.pick(Object.keys(arts));
        if (!G.eco.artifactsOwned.includes(a)) {
          G.eco.artifactsOwned.push(a);
          G.ui.toast('🔮 Artefact trouvé : ' + arts[a].name, 'money');
        }
      }
    }
  };

  G.spawnPickup = function (x, z, amount) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshBasicMaterial({ color: 0x2fd46e }));
    m.position.set(x, 0.6, z);
    G.scene.add(m);
    G.pickups.push({ obj: m, amount, magnet: G.eco.hasPet('dog') || G.eco.hasPet('robotcat') });
  };

  function npcShoot(npc) {
    const p = G.player.pos;
    const d = Math.sqrt(U.d2(npc.obj.position.x, npc.obj.position.z, p.x, p.z));
    if (d < 34) {
      const acc = npc.type === 'cop' ? 0.55 : 0.45;
      if (Math.random() < acc) G.combat.hurtPlayer(npc.dmg);
      G.sfx.shot();
      tracerFX(npc.obj.position, G.player.pos);
    }
  }

  function tracerFX(from, to) {
    const g = new THREE.BufferGeometry().setFromPoints([
      G.V3(from.x, from.y + 1.4, from.z), G.V3(to.x, to.y + 1, to.z)
    ]);
    const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffee88, transparent: true, opacity: 0.8 }));
    G.scene.add(line);
    G.effects.push({ obj: line, ttl: 0.07 });
  }
  G.tracerFX = tracerFX;

  function moveNPC(npc, tx, tz, speed, dt) {
    if (npc.frozen) speed *= 0.6;
    const dx = tx - npc.obj.position.x, dz = tz - npc.obj.position.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.5) return 0;
    let nx = npc.obj.position.x + dx / d * speed * dt;
    let nz = npc.obj.position.z + dz / d * speed * dt;
    [nx, nz] = G.world.collideCircle(nx, nz, 0.45);
    npc.obj.position.x = nx; npc.obj.position.z = nz;
    npc.obj.rotation.y = Math.atan2(dx, dz);
    npc.animT += dt;
    animWalk(npc.obj, true, npc.animT, speed > 4);
    return d;
  }

  G.updateNPCs = function (dt) {
    const p = G.player;
    const wanted = G.player.wanted || 0;
    let copCount = 0;
    for (const n of G.npcs) if (n.type === 'cop' && !n.dead) copCount++;

    for (let i = G.npcs.length - 1; i >= 0; i--) {
      const n = G.npcs[i];
      if (n.dead) {
        n.deadT += dt;
        if (n.deadT > 6) {
          G.scene.remove(n.obj);
          G.npcs.splice(i, 1);
        }
        continue;
      }
      const npos = n.obj.position;
      const pd = Math.sqrt(U.d2(npos.x, npos.z, p.pos.x, p.pos.z));
      if (pd > 170 && !n.boss && !n.warTag && !n.survival) { G.scene.remove(n.obj); G.npcs.splice(i, 1); continue; }
      if (pd > 90 && !n.boss && !n.warTag && !n.survival) continue;

      n.aiT -= dt;
      n.shootCd -= dt;

      if (n.burnT > 0) {
        n.burnT -= dt;
        n.hp -= 9 * dt;
        if (n.hp <= 0) { G.damageNPC(n, 1, false); continue; }
      }
      n.frozen = G.eco.equipped.includes('frost') && pd < 12;

      if (n.type === 'cop') {
        const m = wanted > 0 ? 'angry' : 'neutral';
        if (n.faceMood !== m) { n.faceMood = m; G.setFace(n.obj, m); }
      } else if (n.type === 'ped') {
        const m = n.state === 'flee' ? 'scared' : (n.faceMood || 'neutral');
        if (n.faceMood !== m) { n.faceMood = m; G.setFace(n.obj, m); }
      } else if (n.type === 'gang') {
        const m = (n.aggro || (G.modes.war.active && n.warTag)) ? 'angry' : 'shady';
        if (n.faceMood !== m) { n.faceMood = m; G.setFace(n.obj, m); }
      }

      if (n.type === 'ped') {
        if (G.state.lastShotAt && performance.now() - G.state.lastShotAt < 3000 && pd < 30) n.state = 'flee';
        if (n.state === 'flee') {
          if (moveNPC(n, npos.x * 2 - p.pos.x, npos.z * 2 - p.pos.z, 5, dt) < 1) n.state = 'wander';
        } else {
          n.wanderT -= dt;
          if (n.wanderT <= 0) {
            n.wanderT = U.rand(3, 7);
            const c = G.world.cellCenter(U.randi(0, G.world.GRID - 1), U.randi(0, G.world.GRID - 1));
            n.wx = c.x + U.rand(-22, 22); n.wz = c.z + U.rand(-22, 22);
          }
          moveNPC(n, n.wx, n.wz, 1.6, dt);
        }
      } else if (n.type === 'gang') {
        const hostile = n.aggro || (G.modes.war.active && n.warTag);
        if (hostile) {
          if (pd > 11) moveNPC(n, p.pos.x, p.pos.z, n.speed, dt);
          else if (n.shootCd <= 0) { n.shootCd = U.rand(0.9, 1.6); npcShoot(n); }
          if (pd < 2.2 && n.shootCd <= 0) { n.shootCd = 1; G.combat.hurtPlayer(n.dmg * 0.7); }
        } else {
          n.wanderT -= dt;
          if (n.wanderT <= 0) {
            n.wanderT = U.rand(4, 8);
            n.wx = n.home.x + U.rand(-15, 15); n.wz = n.home.z + U.rand(-15, 15);
          }
          moveNPC(n, n.wx, n.wz, 1.8, dt);
        }
      } else if (n.type === 'cop') {
        if (wanted > 0) {
          if (pd > 10) moveNPC(n, p.pos.x, p.pos.z, n.speed, dt);
          else if (n.shootCd <= 0) { n.shootCd = U.rand(0.7, 1.3); npcShoot(n); }
          if (pd < 2.4 && !p.inCar) {
            n.arrestT = (n.arrestT || 0) + dt;
            if (n.arrestT > 1.5) { n.arrestT = 0; G.combat.busted(); }
          } else n.arrestT = 0;
        } else {
          moveNPC(n, n.home.x, n.home.z, 3, dt);
          if (pd > 100) { G.scene.remove(n.obj); G.npcs.splice(i, 1); continue; }
        }
      } else if (n.type === 'creature') {
        const def = CREATURES[n.kind];
        if (def.ranged && pd < 24 && pd > 8) {
          if (n.shootCd <= 0) {
            n.shootCd = 2.2;
            G.combat.hurtPlayer(n.dmg);
            G.sfx.shot();
            tracerFX(npos, G.player.pos);
          }
          moveNPC(n, p.pos.x, p.pos.z, n.speed * 0.5, dt);
        } else if (pd > 1.7) {
          moveNPC(n, p.pos.x, p.pos.z, n.speed, dt);
        } else if (n.shootCd <= 0) {
          n.shootCd = 1.4;
          G.combat.hurtPlayer(n.dmg);
        }
      } else if (n.type === 'boss') {
        if (pd > 5) moveNPC(n, p.pos.x, p.pos.z, n.speed, dt);
        n.slamCd -= dt;
        if (pd < 7 && n.slamCd <= 0) {
          n.slamCd = 3;
          G.combat.hurtPlayer(30);
          G.cam.shake = 0.6;
          G.sfx.explode();
          G.combat.shockwave(npos, 7);
        }
        if (n.shootCd <= 0) {
          n.shootCd = 4.5;
          for (let k = 0; k < 2; k++) G.spawnCreature('hellhound', npos.x + U.rand(-6, 6), npos.z + U.rand(-6, 6), 0.8);
          G.ui.toast('Le Golem invoque des chiens de l\'enfer !', 'warn');
        }
      }
    }

    if (wanted > 0 && copCount < Math.min(8, wanted * 2) && Math.random() < 0.03) {
      G.spawnCop(p.pos.x, p.pos.z);
    }

    let pedCount = 0, gangByDistrict = {};
    for (const n of G.npcs) {
      if (n.dead) continue;
      if (n.type === 'ped') pedCount++;
      if (n.type === 'gang' && !n.warTag) gangByDistrict[n.district] = (gangByDistrict[n.district] || 0) + 1;
    }
    if (pedCount < 14 && Math.random() < 0.1) G.spawnPed();
    for (const d of G.world.districts) {
      if ((gangByDistrict[d.id] || 0) < 2 && Math.random() < 0.02) {
        const c = G.world.cellCenter(U.randi(d.cells[0], d.cells[2]), U.randi(d.cells[1], d.cells[3]));
        G.spawnGang(d.id, c.x, c.z, false);
      }
    }
  };
})();
