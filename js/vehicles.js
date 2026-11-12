'use strict';
(function () {
  const V = {};
  G.vehicles = V;

  V.TYPES = {
    sedan: { name: 'Berline', max: 26, acc: 13, grip: 2.1, hp: 110, price: 4000, color: 0x8899aa },
    compact: { name: 'Poussin', max: 22, acc: 11, grip: 2.3, hp: 90, price: 2500, color: 0xd9a012 },
    muscle: { name: 'Vipère S', max: 38, acc: 22, grip: 2.5, hp: 120, price: 28000, color: 0xb5443c },
    sport: { name: 'Fulgura GT', max: 46, acc: 27, grip: 2.9, hp: 95, price: 65000, color: 0xffd23e },
    taxi: { name: 'Taxi', max: 27, acc: 13, grip: 2.2, hp: 110, price: 6000, color: 0xf5c518 },
    van: { name: 'Fourgon', max: 21, acc: 9, grip: 1.8, hp: 180, price: 9000, color: 0x9aa5b1 },
    truck: { name: 'Camion', max: 18, acc: 7, grip: 1.5, hp: 260, price: 15000, color: 0x5a6472 },
    police: { name: 'Interceptor', max: 36, acc: 22, grip: 2.7, hp: 140, price: 0, color: 0x2244cc },
    moto: { name: 'Moto Foudre', max: 52, acc: 30, grip: 3.2, hp: 60, price: 35000, color: 0x00e5ff, bike: true },
    super: { name: 'Hyperion X', max: 60, acc: 32, grip: 3.0, hp: 90, price: 150000, color: 0xff3355 },
    suv: { name: 'Barbarian 4x4', max: 30, acc: 15, grip: 2.4, hp: 200, price: 32000, color: 0x3c5a44, rad: 2.0 },
    pickup: { name: 'Pickup Rusty', max: 30, acc: 14, grip: 2.2, hp: 170, price: 14000, color: 0x8a6f4d, rad: 1.9 },
    limo: { name: 'Limousine Or', max: 28, acc: 10, grip: 1.9, hp: 220, price: 80000, color: 0x1a1a1e, w: 2.4, l: 8.5, rad: 3.2 },
    bus: { name: 'Bus Cityliner', max: 22, acc: 6, grip: 1.6, hp: 400, price: 25000, color: 0x2d6a8f, w: 2.6, l: 9.5, rad: 3.6 },
    garbage: { name: 'Camion Poubelles', max: 20, acc: 7, grip: 1.6, hp: 300, price: 18000, color: 0x3c7a44, w: 2.6, l: 7.5, rad: 3.0 },
    ambulance: { name: 'Ambulance', max: 32, acc: 16, grip: 2.3, hp: 180, price: 0, color: 0xf5f5f5, rad: 1.9 }
  };

  V.makeCar = function (typeKey, x, z, yaw, color) {
    const def = V.TYPES[typeKey];
    const g = new THREE.Group();
    const c = color !== undefined ? color : def.color;
    const bodyMat = new THREE.MeshPhongMaterial({ color: c, shininess: 80, specular: 0x555566 });
    const glassMat = new THREE.MeshPhongMaterial({ color: 0x0e1a2c, shininess: 130, specular: 0x9db8ff });
    const bumperMat = new THREE.MeshPhongMaterial({ color: 0x1c2026, shininess: 40, specular: 0x333338 });
    const wheels = [];
    const wg = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 10);
    const wm = new THREE.MeshPhongMaterial({ color: 0x14161a, shininess: 30, specular: 0x444444 });
    const rimMat = new THREE.MeshPhongMaterial({ color: 0xc9d2dd, shininess: 120, specular: 0xffffff });
    if (def.bike) {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 2.2), bodyMat);
      body.position.y = 0.8; body.castShadow = true;
      const tank = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.35, 0.9), bodyMat);
      tank.position.set(0, 1.05, 0.3);
      const bar = new THREE.Mesh(new THREE.BoxGeometry(1, 0.08, 0.08), new THREE.MeshLambertMaterial({ color: 0x22262e }));
      bar.position.set(0, 1.25, 1);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.8), bumperMat);
      seat.position.set(0, 1.05, -0.5);
      g.add(body, tank, bar, seat);
      for (const wz of [0.95, -0.95]) {
        const w = new THREE.Mesh(wg, wm);
        w.rotation.z = Math.PI / 2;
        w.position.set(0, 0.38, wz);
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.32, 8), rimMat);
        w.add(rim);
        g.add(w);
        wheels.push(w);
      }
    } else {
      const bw = def.w || 2.2, bl = def.l || 4.6;
      const body = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.65, bl), bodyMat);
      body.position.y = 0.62; body.castShadow = true;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.86, 0.55, bl * 0.45), glassMat);
      cabin.position.set(0, 1.18, -0.25);
      const nose = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.9, 0.3, 0.9), bodyMat);
      nose.position.set(0, 0.55, bl / 2 + 0.2);
      const bumpF = new THREE.Mesh(new THREE.BoxGeometry(bw * 1.02, 0.22, 0.3), bumperMat);
      bumpF.position.set(0, 0.42, bl / 2 + 0.12);
      const bumpR = new THREE.Mesh(new THREE.BoxGeometry(bw * 1.02, 0.22, 0.3), bumperMat);
      bumpR.position.set(0, 0.42, -bl / 2 - 0.12);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.7, 0.06, bl * 0.4), bodyMat);
      roof.position.set(0, 1.48, -0.25);
      g.add(body, cabin, nose, bumpF, bumpR, roof);
      const wxo = bw / 2 - 0.1, wzf = bl / 2 - 1.1;
      for (const [wx, wz] of [[-wxo, wzf], [wxo, wzf], [-wxo, -wzf], [wxo, -wzf]]) {
        const w = new THREE.Mesh(wg, wm);
        w.rotation.z = Math.PI / 2;
        w.position.set(wx, 0.38, wz);
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.32, 8), rimMat);
        w.add(rim);
        g.add(w);
        wheels.push(w);
      }
    }
    const lw = (def.w || 2.2) * 0.75, ln = (def.l || 4.6) / 2 + 0.02;
    const hl = new THREE.Mesh(new THREE.BoxGeometry(lw, 0.15, 0.1), new THREE.MeshBasicMaterial({ color: 0xfff2b0 }));
    hl.position.set(0, 0.62, ln);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(lw, 0.15, 0.1), new THREE.MeshBasicMaterial({ color: 0x881818 }));
    tl.position.set(0, 0.62, -ln);
    const rev = new THREE.Mesh(new THREE.BoxGeometry(lw * 0.4, 0.12, 0.1), new THREE.MeshBasicMaterial({ color: 0xf2f5f8 }));
    rev.position.set(0, 0.45, -ln - 0.01);
    rev.visible = false;
    g.add(hl, tl, rev);
    if (typeKey === 'taxi') {
      const sign = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.34),
        new THREE.MeshBasicMaterial({ color: 0xffd23e }));
      sign.position.set(0, 1.62, -0.25);
      g.add(sign);
    }
    if (typeKey === 'bus') {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry((def.w || 2.2) + 0.02, 0.4, (def.l || 4.6) * 0.8),
        new THREE.MeshBasicMaterial({ color: 0xf2f5f8 }));
      stripe.position.set(0, 1.05, 0);
      g.add(stripe);
      const dest = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.26, 0.1),
        new THREE.MeshBasicMaterial({ color: 0xffb020 }));
      dest.position.set(0, 1.75, (def.l || 4.6) / 2 + 0.01);
      g.add(dest);
    }
    if (typeKey === 'police') {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry((def.w || 2.2) + 0.02, 0.28, (def.l || 4.6) * 0.55),
        new THREE.MeshBasicMaterial({ color: 0xf2f5f8 }));
      stripe.position.set(0, 0.62, 0);
      g.add(stripe);
    }
    if (typeKey === 'sport' || typeKey === 'super') {
      const wing = new THREE.Mesh(new THREE.BoxGeometry((def.w || 2.2) * 0.9, 0.07, 0.42), bodyMat);
      wing.position.set(0, 1.18, -(def.l || 4.6) / 2 - 0.12);
      const wL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.12), bumperMat);
      wL.position.set(-(def.w || 2.2) * 0.32, 1.02, -(def.l || 4.6) / 2 - 0.12);
      const wR = wL.clone(); wR.position.x = (def.w || 2.2) * 0.32;
      g.add(wing, wL, wR);
    }
    let lightbar = null;
    if (typeKey === 'police') {
      const barBase = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.09, 0.34), bumperMat);
      barBase.position.set(0, 1.56, -0.25);
      const lr = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.3), new THREE.MeshBasicMaterial({ color: 0xff3333 }));
      lr.position.set(-0.28, 1.66, -0.25);
      const lb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.3), new THREE.MeshBasicMaterial({ color: 0x4466ff }));
      lb.position.set(0.28, 1.66, -0.25);
      g.add(barBase, lr, lb);
      lightbar = { r: lr, b: lb };
    }
    g.position.set(x, 0, z);
    g.rotation.y = yaw || 0;
    G.scene.add(g);
    const car = {
      obj: g, type: typeKey, def, hp: def.hp, maxHp: def.hp, speed: 0, yaw: yaw || 0, rad: def.rad || (def.bike ? 0.9 : 1.7),
      driver: null, wheels, bodyMat, wrecked: false, colorHex: c, lightbar, tail: tl, rev,
      ai: null, race: null, burnT: 0, exhT: 0, hornT: U.rand(3, 12), skidT: 0
    };
    G.cars.push(car);
    return car;
  };

  V.spawnParked = function (n) {
    for (let k = 0; k < n; k++) {
      const pt = G.world.randRoadPoint();
      const type = U.pick(['sedan', 'compact', 'sedan', 'taxi', 'van', 'muscle', 'truck', 'sport', 'moto', 'suv', 'pickup', 'super', 'limo', 'bus']);
      const col = U.pick([0x8899aa, 0xb5443c, 0x2d6a8f, 0x3c7a44, 0xd9a012, 0x777777, 0x25282e, 0xae3ec9]);
      V.makeCar(type, pt.x, pt.z, U.rand(0, Math.PI * 2), col);
    }
  };

  V.spawnTraffic = function (n) {
    for (let k = 0; k < n; k++) {
      const i = U.randi(0, G.world.GRID);
      const axis = Math.random() < 0.5 ? 'x' : 'z';
      const dir = U.pick([-1, 1]);
      const lane = 3.5 * dir * (axis === 'x' ? 1 : -1);
      const t = U.rand(G.world.ORIGIN + 20, -G.world.ORIGIN - 20);
      const x = axis === 'x' ? t : G.world.roadCoord(i) + lane;
      const z = axis === 'x' ? G.world.roadCoord(i) + lane : t;
      const wanted = Math.random() < (G.player.wanted >= 3 ? 0.3 : 0.08);
      const type = wanted ? 'police' : (Math.random() < 0.06 ? 'bus' : U.pick(['sedan', 'compact', 'taxi', 'van', 'truck']));
      const car = V.makeCar(type, x, z, axis === 'x' ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (dir > 0 ? 0 : Math.PI), wanted ? 0x2244cc : undefined);
      car.driver = 'ai';
      car.ai = { axis, dir, laneOff: lane, turnT: U.rand(4, 10) };
    }
  };

  V.nearestCar = function (x, z, maxD) {
    let best = null, bd = maxD * maxD;
    for (const c of G.cars) {
      if (c.wrecked) continue;
      const d = U.d2(x, z, c.obj.position.x, c.obj.position.z);
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  };

  G.enterCar = function () {
    const p = G.player;
    if (p.inCar) {
      const car = p.inCar;
      const side = new THREE.Vector3(Math.cos(car.yaw), 0, -Math.sin(car.yaw)).multiplyScalar((car.rad || 1.7) + 0.6);
      p.pos.set(car.obj.position.x + side.x, 0, car.obj.position.z + side.z);
      [p.pos.x, p.pos.z] = G.world.collideCircle(p.pos.x, p.pos.z, 0.45);
      p.inCar = null; car.driver = null;
      car.speed *= 0.2;
      G.sfx.engine(false);
      G.input.pressed.jump = false;
      return;
    }
    const car = V.nearestCar(p.pos.x, p.pos.z, 3.8);
    if (!car) return;
    if (car.driver === 'ai') {
      G.combat.crime(car.obj.position, car.type === 'police' ? 1.5 : 0.6);
      G.ui.toast(car.type === 'police' ? '🚨 Véhicule de police volé !' : '🚗 Véhicule volé');
    }
    p.inCar = car;
    car.driver = 'player';
    car.ai = null;
    G.input.pressed.jump = false;
    G.stats.carsEntered++;
    G.sfx.ensure();
    G.sfx.engine(true);
    if (G.yt.recording) G.yt.addEvent(5, null);
  };

  V.updatePlayerCar = function (car, dt) {
    const I = G.input, p = G.player;
    let throttle = I.move.y;
    if (I.keys['KeyW'] || I.keys['ArrowUp']) throttle += 1;
    if (I.keys['KeyS'] || I.keys['ArrowDown']) throttle -= 1;
    let steer = I.move.x;
    if (I.keys['KeyA'] || I.keys['ArrowLeft']) steer -= 1;
    if (I.keys['KeyD'] || I.keys['ArrowRight']) steer += 1;
    const brake = I.keys['Space'] || I.pressed.brake;
    const wet = G.world.rain && G.world.rain.active;
    const maxSp = wet ? car.def.max * 0.85 : car.def.max;
    const gripBase = wet ? car.def.grip * 0.65 : car.def.grip;
    const nitro = (I.keys['ShiftLeft'] || I.keys['ShiftRight']) && car.speed > 4;
    car.nitro = !!nitro;
    if (nitro) {
      car.speed += car.def.acc * 0.9 * dt;
      car.speed = Math.min(car.speed, maxSp * 1.35);
      car.exhT -= dt;
      if (car.exhT <= 0) {
        car.exhT = 0.06;
        const nl = (car.def.l || 4.6) / 2 + 0.35;
        G.spawnBurst(car.obj.position.x - Math.sin(car.yaw) * nl, 0.45, car.obj.position.z - Math.cos(car.yaw) * nl, 0xff9040, 1);
      }
    }

    if (brake) car.speed *= 1 - 2.2 * dt;
    car.speed += throttle * car.def.acc * dt;
    car.speed *= 1 - 0.35 * dt;
    car.speed = U.clamp(car.speed, -maxSp * 0.4, maxSp);

    if (Math.abs(car.speed) > 0.4) {
      const grip = brake ? gripBase * 1.6 : gripBase;
      car.yaw -= steer * grip * dt * Math.sign(car.speed) * Math.min(1, Math.abs(car.speed) / 10);
      if (wet && Math.abs(car.speed) > 14 && Math.random() < dt * 1.5) car.yaw += U.rand(-0.08, 0.08);
    }

    const fx = Math.sin(car.yaw), fz = Math.cos(car.yaw);
    let nx = car.obj.position.x + fx * car.speed * dt;
    let nz = car.obj.position.z + fz * car.speed * dt;
    const [cx, cz] = G.world.collideCircle(nx, nz, car.rad || 1.7);
    if (cx !== nx || cz !== nz) {
      const impact = Math.abs(car.speed);
      if (impact > 9) {
        V.damageCar(car, impact * 1.1, false);
        G.cam.shake = Math.min(0.5, impact * 0.02);
        G.sfx.melee();
      }
      car.speed *= -0.3;
    }
    car.obj.position.x = cx; car.obj.position.z = cz;
    car.obj.rotation.y = car.yaw;

    for (let w = 0; w < car.wheels.length; w++) {
      car.wheels[w].rotation.x += car.speed * dt * 2.4;
      if (w < 2) car.wheels[w].rotation.y = -steer * 0.4;
    }
    p.pos.set(car.obj.position.x, 0, car.obj.position.z);
    G.stats.distance += Math.abs(car.speed) * dt;
    if (Math.abs(car.speed) > car.def.max * 0.85 && Math.random() < dt * 2) {
      G.stats.stunts += dt;
      if (G.yt.recording && Math.random() < dt * 0.5) G.yt.addEvent(40, '🏎️ Slides à fond !');
    }
    G.sfx.setEngine(car.speed);
    if (car.tail) car.tail.material.color.setHex(brake ? 0xff4444 : 0x881818);
    if (car.rev) car.rev.visible = car.speed < -1;
    car.skidT -= dt;
    if (brake && Math.abs(car.speed) > 8 && car.skidT <= 0) {
      car.skidT = 0.05;
      const el2 = (car.def.l || 4.6) / 2 - 0.5;
      const bx = car.obj.position.x - fx * el2, bz = car.obj.position.z - fz * el2;
      const sx = fz * 0.8, sz = -fx * 0.8;
      for (const sd of [-1, 1]) {
        const mk = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.9),
          new THREE.MeshBasicMaterial({ color: 0x0c0e12, transparent: true, opacity: 0.55, depthWrite: false }));
        mk.rotation.x = -Math.PI / 2;
        mk.rotation.z = -car.yaw;
        mk.position.set(bx + sx * sd, 0.05, bz + sz * sd);
        G.scene.add(mk);
        G.effects.push({ obj: mk, ttl: 6 });
      }
    }
    car.exhT -= dt;
    if (throttle > 0.1 && car.exhT <= 0) {
      car.exhT = 0.16;
      const el = (car.def.l || 4.6) / 2 + 0.3;
      G.spawnBurst(car.obj.position.x - fx * el, 0.45, car.obj.position.z - fz * el, 0x5a6068, 1);
    }
    if (car.hp < car.maxHp * 0.3) {
      car.dmgT = (car.dmgT || 0) - dt;
      if (car.dmgT <= 0) {
        car.dmgT = 0.28;
        G.spawnBurst(car.obj.position.x + fx * 1.4, 0.9, car.obj.position.z + fz * 1.4, car.hp < car.maxHp * 0.15 ? 0x2a2c30 : 0x6a7078, 1);
      }
    }

    for (const n of G.npcs) {
      if (n.dead) continue;
      if (U.d2(n.obj.position.x, n.obj.position.z, car.obj.position.x, car.obj.position.z) < 6) {
        if (Math.abs(car.speed) > 8) {
          G.damageNPC(n, Math.abs(car.speed) * 2.2, false);
          car.speed *= 0.85;
          G.combat.crime(car.obj.position, n.type === 'cop' ? 1.2 : 0.7);
        }
      }
    }
  };

  V.damageCar = function (car, dmg, byPlayer) {
    if (car.wrecked) return;
    car.hp -= dmg;
    if (car.hp <= 0) {
      car.wrecked = true;
      car.speed = 0;
      car.bodyMat.color.setHex(0x151515);
      car.obj.traverse(o => { if (o.material && o.material.color && o !== car.obj) { } });
      G.combat.explode(car.obj.position.clone().add(G.V3(0, 1, 0)), 6, 60, byPlayer);
      if (G.player.inCar === car) {
        G.combat.hurtPlayer(45);
        G.player.inCar = null;
        G.player.pos.set(car.obj.position.x + 3, 0, car.obj.position.z);
        G.sfx.engine(false);
      }
      if (car.driver === 'ai') car.driver = null;
    }
  };

  V.updateTraffic = function (car, dt) {
    const ai = car.ai;
    if (!ai) return;
    const target = 9 + (car.type === 'truck' ? -2 : 2);
    let ahead = false;
    const fx = ai.axis === 'x' ? ai.dir : 0, fz = ai.axis === 'x' ? 0 : ai.dir;
    const px = car.obj.position.x, pz = car.obj.position.z;
    for (const o of G.cars) {
      if (o === car) continue;
      const relx = o.obj.position.x - px, relz = o.obj.position.z - pz;
      const along = relx * fx + relz * fz, side = Math.abs(relx * fz - relz * fx);
      if (along > 1 && along < 9 && side < 2.5) { ahead = true; break; }
    }
    if (!ahead && G.player.inCar) {
      const relx = G.player.inCar.obj.position.x - px, relz = G.player.inCar.obj.position.z - pz;
      const along = relx * fx + relz * fz, side = Math.abs(relx * fz - relz * fx);
      if (along > 1 && along < 9 && side < 2.5) ahead = true;
    }
    car.speed = U.lerp(car.speed, ahead ? 0 : target, dt * 2);

    ai.turnT -= dt;
    const nearI = Math.abs((px - G.world.ORIGIN) % G.world.CELL) < 1.2 || Math.abs((pz - G.world.ORIGIN) % G.world.CELL) < 1.2;
    if (ai.turnT <= 0 && nearI) {
      ai.turnT = U.rand(3, 8);
      if (Math.random() < 0.4) {
        ai.axis = ai.axis === 'x' ? 'z' : 'x';
        ai.dir = U.pick([-1, 1]);
      }
    }
    ai.laneOff = 3.5 * ai.dir * (ai.axis === 'x' ? 1 : -1);

    let tx, tz;
    if (ai.axis === 'x') {
      tx = px + fx * 10;
      tz = Math.round((pz - G.world.ORIGIN - ai.laneOff) / G.world.CELL) * G.world.CELL + G.world.ORIGIN + ai.laneOff;
      tz = U.lerp(pz, tz, dt * 3);
    } else {
      tz = pz + fz * 10;
      tx = Math.round((px - G.world.ORIGIN - ai.laneOff) / G.world.CELL) * G.world.CELL + G.world.ORIGIN + ai.laneOff;
      tx = U.lerp(px, tx, dt * 3);
    }
    const dx = tx - px, dz = tz - pz;
    if (Math.hypot(dx, dz) > 0.1) car.yaw = Math.atan2(dx, dz);
    car.obj.position.x += fx * car.speed * dt + (tx - px) * dt * 2;
    car.obj.position.z += fz * car.speed * dt + (tz - pz) * dt * 2;
    car.obj.rotation.y = car.yaw;
    for (const w of car.wheels) w.rotation.x += car.speed * dt * 2.4;

    car.hornT -= dt;
    if (car.hornT <= 0) {
      car.hornT = U.rand(6, 18);
      const pd = U.d2(px, pz, G.player.pos.x, G.player.pos.z);
      if (pd < 900 && (ahead || Math.random() < 0.35)) G.sfx.horn();
    }

    if (U.d2(px, pz, G.player.pos.x, G.player.pos.z) > 240 * 240) {
      G.scene.remove(car.obj);
      G.cars.splice(G.cars.indexOf(car), 1);
    }
  };

  V._hl = null; V._hlCar = null;
  function ensureHeadlights(car) {
    if (V._hlCar === car) return;
    if (V._hl) { V._hl.parent.remove(V._hl); V._hl.target.parent.remove(V._hl.target); V._hl = null; V._hlCar = null; }
    if (!car || car.wrecked) return;
    const sp = new THREE.SpotLight(0xfff2cc, 0, 60, 0.5, 0.5, 1.2);
    sp.position.set(0, 1, 2);
    sp.target.position.set(0, 0, 24);
    car.obj.add(sp);
    car.obj.add(sp.target);
    V._hl = sp; V._hlCar = car;
  }

  V.heli = null;
  V.updateHeli = function (dt) {
    const wanted = G.player.wanted || 0;
    if (!V.heli && wanted >= 4) {
      const g = new THREE.Group();
      const hm = new THREE.MeshPhongMaterial({ color: 0x2244cc, shininess: 80, specular: 0x555566 });
      const dm = new THREE.MeshLambertMaterial({ color: 0x14161a });
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.7, 5), hm);
      const glass = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1, 1.2), new THREE.MeshPhongMaterial({ color: 0x0e1a2c, shininess: 130, specular: 0x9db8ff }));
      glass.position.set(0, 0.2, 2.4);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 3.6), hm);
      tail.position.set(0, 0.35, -4);
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.8), hm);
      fin.position.set(0, 0.9, -5.4);
      const rotor = new THREE.Mesh(new THREE.BoxGeometry(10, 0.06, 0.45), dm);
      rotor.position.y = 1.15;
      const trotor = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.6, 0.2), dm);
      trotor.position.set(0.3, 0.6, -5.4);
      const skidL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 3.6), dm);
      skidL.position.set(-1, -1.1, 0);
      const skidR = skidL.clone(); skidR.position.x = 1;
      const spot = new THREE.SpotLight(0xfffbe8, 0, 90, 0.3, 0.45, 1.1);
      spot.position.set(0, -0.9, 0);
      spot.target.position.set(0, -45, 0);
      g.add(body, glass, tail, fin, rotor, trotor, skidL, skidR, spot, spot.target);
      g.position.set(G.player.pos.x + 60, 36, G.player.pos.z + 60);
      G.scene.add(g);
      V.heli = { obj: g, rotor, trotor, spot, a: 0 };
      G.ui.toast('🚁 Hélicoptère de police en approche !');
    }
    if (V.heli) {
      if (wanted < 3) {
        G.scene.remove(V.heli.obj);
        V.heli = null;
        return;
      }
      const h = V.heli;
      h.a += dt * 0.45;
      const pp = G.player.pos;
      h.obj.position.set(pp.x + Math.cos(h.a) * 26, 34, pp.z + Math.sin(h.a) * 26);
      h.obj.rotation.y = -h.a;
      h.rotor.rotation.y += dt * 32;
      h.trotor.rotation.x += dt * 40;
      h.spot.intensity = G.world.nightFactor() > 0.2 ? 5 : 2;
    }
  };

  V.update = function (dt) {
    for (let i = G.cars.length - 1; i >= 0; i--) {
      const car = G.cars[i];
      if (car.wrecked) {
        car.burnT += dt;
        car.exhT -= dt;
        if (car.tail) car.tail.material.color.setHex(Math.floor(performance.now() / 450) % 2 ? 0xffb020 : 0x553a10);
        if (car.rev) car.rev.material.color.setHex(Math.floor(performance.now() / 450) % 2 ? 0xffb020 : 0x553a10);
        if (car.exhT <= 0) {
          car.exhT = 0.22;
          G.spawnBurst(car.obj.position.x, 1.2 + Math.min(2, car.burnT * 0.3), car.obj.position.z, car.burnT < 8 ? 0x2a2a2a : 0x555a60, 1);
        }
        if (car.burnT > 25) { G.scene.remove(car.obj); G.cars.splice(i, 1); }
        continue;
      }
      if (car.driver === 'player') V.updatePlayerCar(car, dt);
      else if (car.driver === 'ai') V.updateTraffic(car, dt);
    }
    const ph = Math.floor(performance.now() / 140) % 2;
    for (const c of G.cars) {
      if (!c.lightbar || c.wrecked) continue;
      c.lightbar.r.material.color.setHex(ph ? 0xff3333 : 0x551111);
      c.lightbar.b.material.color.setHex(ph ? 0x111144 : 0x4466ff);
    }
    V.updateHeli(dt);
    ensureHeadlights(G.player.inCar && !G.player.inCar.wrecked ? G.player.inCar : null);
    if (V._hl) V._hl.intensity = G.world.nightFactor() * 2.5;
    let traffic = 0;
    for (const c of G.cars) if (c.driver === 'ai') traffic++;
    if (traffic < 12 && Math.random() < 0.05) V.spawnTraffic(1);
  };
})();
