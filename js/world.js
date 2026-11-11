'use strict';
(function () {
  const W = {};
  G.world = W;

  W.GRID = 10; W.ROAD = 14; W.BLOCK = 48; W.CELL = 62;
  W.SPAN = W.GRID * W.CELL;
  W.ORIGIN = -W.SPAN / 2;
  W.HASH = 32;

  W.districts = [
    { id: 'downtown', name: 'Downtown', gang: 'Ghosts', gangName: 'Les Fantômes', color: '#8d99ae', cells: [4, 4, 5, 5], owned: false, income: 500 },
    { id: 'docks', name: 'Les Docks', gang: 'Crimson', gangName: 'Crimson', color: '#e03131', cells: [0, 0, 3, 3], owned: false, income: 300 },
    { id: 'industrial', name: 'Zone Industrielle', gang: 'Wolves', gangName: 'Iron Wolves', color: '#b08d57', cells: [6, 0, 9, 3], owned: false, income: 300 },
    { id: 'residential', name: 'Green Heights', gang: 'Vipers', gangName: 'Les Vipères', color: '#2f9e44', cells: [0, 6, 3, 9], owned: false, income: 300 },
    { id: 'neon', name: 'Neon Strip', gang: 'Kings', gangName: 'Neon Kings', color: '#ae3ec9', cells: [6, 6, 9, 9], owned: false, income: 300 }
  ];

  W.districtOf = function (i, j) {
    if (i >= 4 && i <= 5 && j >= 4 && j <= 5) return W.districts[0];
    if (i < 5 && j < 5) return W.districts[1];
    if (i >= 5 && j < 5) return W.districts[2];
    if (i < 5 && j >= 5) return W.districts[3];
    return W.districts[4];
  };
  W.districtAt = function (x, z) {
    const i = U.clamp(Math.floor((x - W.ORIGIN) / W.CELL), 0, W.GRID - 1);
    const j = U.clamp(Math.floor((z - W.ORIGIN) / W.CELL), 0, W.GRID - 1);
    return W.districtOf(i, j);
  };

  W.cellCenter = (i, j) => ({ x: W.ORIGIN + i * W.CELL + W.CELL / 2, z: W.ORIGIN + j * W.CELL + W.CELL / 2 });
  W.roadCoord = (i) => W.ORIGIN + i * W.CELL;
  W.inWorld = (x, z) => x > W.ORIGIN + 4 && x < -W.ORIGIN - 4 && z > W.ORIGIN + 4 && z < -W.ORIGIN - 4;
  W.randRoadPoint = function () {
    const i = U.randi(0, W.GRID), axis = Math.random() < 0.5;
    const lane = U.pick([-3.5, 3.5]);
    const t = U.rand(W.ORIGIN + 10, -W.ORIGIN - 10);
    return axis ? { x: W.roadCoord(i) + lane, z: t } : { x: t, z: W.roadCoord(i) + lane };
  };

  W.colliders = [];
  W._hash = new Map();
  W._qid = 0;
  W.addCollider = function (x0, z0, x1, z1, y1) {
    const b = { x0, z0, x1, z1, y0: 0, y1: y1 === undefined ? 30 : y1, q: -1 };
    W.colliders.push(b);
    const c0 = Math.floor(x0 / W.HASH), c1 = Math.floor(x1 / W.HASH);
    const d0 = Math.floor(z0 / W.HASH), d1 = Math.floor(z1 / W.HASH);
    for (let cx = c0; cx <= c1; cx++) for (let cz = d0; cz <= d1; cz++) {
      const k = cx + ',' + cz;
      if (!W._hash.has(k)) W._hash.set(k, []);
      W._hash.get(k).push(b);
    }
  };
  W.query = function (x, z, r) {
    W._qid++;
    const out = [];
    const c0 = Math.floor((x - r) / W.HASH), c1 = Math.floor((x + r) / W.HASH);
    const d0 = Math.floor((z - r) / W.HASH), d1 = Math.floor((z + r) / W.HASH);
    for (let cx = c0; cx <= c1; cx++) for (let cz = d0; cz <= d1; cz++) {
      const arr = W._hash.get(cx + ',' + cz);
      if (arr) for (const b of arr) if (b.q !== W._qid) { b.q = W._qid; out.push(b); }
    }
    return out;
  };
  W.collideCircle = function (px, pz, r) {
    const list = W.query(px, pz, r + 1);
    for (const b of list) {
      const cx = U.clamp(px, b.x0, b.x1), cz = U.clamp(pz, b.z0, b.z1);
      let dx = px - cx, dz = pz - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        if (d2 < 1e-6) {
          const l = px - b.x0, rr = b.x1 - px, t = pz - b.z0, bo = b.z1 - pz;
          const m = Math.min(l, rr, t, bo);
          if (m === l) px = b.x0 - r; else if (m === rr) px = b.x1 + r;
          else if (m === t) pz = b.z0 - r; else pz = b.z1 + r;
        } else {
          const d = Math.sqrt(d2);
          px = cx + dx / d * r; pz = cz + dz / d * r;
        }
      }
    }
    const lim = W.SPAN / 2 - 3;
    px = U.clamp(px, -lim, lim); pz = U.clamp(pz, -lim, lim);
    return [px, pz];
  };
  W.rayBlocked = function (o, d, maxT) {
    let best = maxT;
    const steps = Math.ceil(maxT / 8);
    for (let s = 1; s <= steps; s++) {
      const t = s * 8;
      const px = o.x + d.x * t, pz = o.z + d.z * t;
      const list = W.query(px, pz, 1);
      for (const b of list) {
        if (b.q === -W._qid - 1) continue;
        b.q = -W._qid - 1;
        const hit = W.rayAABB(o, d, b);
        if (hit !== null && hit < best) best = hit;
      }
    }
    return best < maxT ? best : null;
  };
  W.rayAABB = function (o, d, b) {
    let tmin = 0, tmax = 1e9;
    const mins = [b.x0, b.y0, b.z0], maxs = [b.x1, b.y1, b.z1];
    const oo = [o.x, o.y, o.z], dd = [d.x, d.y, d.z];
    for (let i = 0; i < 3; i++) {
      if (Math.abs(dd[i]) < 1e-8) { if (oo[i] < mins[i] || oo[i] > maxs[i]) return null; }
      else {
        let t1 = (mins[i] - oo[i]) / dd[i], t2 = (maxs[i] - oo[i]) / dd[i];
        if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
        tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
        if (tmin > tmax) return null;
      }
    }
    return tmin > 0.1 ? tmin : null;
  };

  W.markers = {};
  W.blips = [];
  W.addStaticBlip = (x, z, color, label) => W.blips.push({ x, z, color, label, static: true });

  W.makeMarker = function (x, z, color, label) {
    const g = new THREE.Group();
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 0.25, 24),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, depthWrite: false })
    );
    disc.position.y = 0.15;
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.9, 16, 10, 1, true),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide })
    );
    beam.position.y = 8;
    g.add(disc, beam);
    g.position.set(x, 0, z);
    G.scene.add(g);
    const m = { obj: g, x, z, label, color, active: true };
    W.markers[label] = m;
    return m;
  };

  W.nightFactor = function () {
    const t = G.state.time;
    return U.clamp(Math.max((19.5 - t) / 1.5, (t - 5.5) / 1.5, 0), 0, 1);
  };

  let sun, hemi, skyColor, fog, glowMats = [], stars;

  function windowTexture(litColor, wallColor) {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = wallColor; x.fillRect(0, 0, 128, 128);
    for (let r = 0; r < 8; r++) for (let col = 0; col < 6; col++) {
      const lit = Math.random() < 0.4;
      x.fillStyle = lit ? litColor : 'rgba(10,16,30,0.9)';
      x.fillRect(6 + col * 20, 5 + r * 15, 13, 9);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }

  function buildMaterials() {
    W.mats = {};
    W.mats.asphalt = new THREE.MeshLambertMaterial({ color: 0x1c2026 });
    W.mats.sidewalk = new THREE.MeshLambertMaterial({ color: 0x3a4048 });
    W.mats.dark = new THREE.MeshLambertMaterial({ color: 0x22262e });
    W.mats.metal = new THREE.MeshLambertMaterial({ color: 0x5a6472 });
    W.mats.trunk = new THREE.MeshLambertMaterial({ color: 0x4a3626 });
    W.mats.leaf = new THREE.MeshLambertMaterial({ color: 0x2d6a34 });
    W.mats.glass = new THREE.MeshLambertMaterial({ color: 0x1c2a4a, emissive: 0x22406a, emissiveIntensity: 0.4 });
    W.buildingMats = [];
    const variants = [
      ['#ffd98a', '#2a2d33'], ['#c9f0ff', '#24282f'], ['#ffe9b8', '#31262a'],
      ['#d0ffd8', '#262b26'], ['#ffc9e8', '#2b2433'], ['#fff3c9', '#1f232b']
    ];
    for (const [lit, wall] of variants) {
      const tex = windowTexture(lit, wall);
      W.buildingMats.push(new THREE.MeshLambertMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0 }));
    }
    glowMats = W.buildingMats;
  }

  function buildGround() {
    const res = 2048, c = document.createElement('canvas');
    c.width = c.height = res;
    const x = c.getContext('2d');
    const px = res / W.SPAN;
    const w2c = (v) => (v + W.SPAN / 2) * px;
    x.fillStyle = '#23272e'; x.fillRect(0, 0, res, res);
    for (let i = 0; i < W.GRID; i++) for (let j = 0; j < W.GRID; j++) {
      const cc = W.cellCenter(i, j);
      x.fillStyle = '#31363e';
      x.fillRect(w2c(cc.x - W.BLOCK / 2), w2c(cc.z - W.BLOCK / 2), W.BLOCK * px, W.BLOCK * px);
    }
    x.strokeStyle = '#20242b'; x.lineWidth = W.ROAD * px;
    for (let i = 0; i <= W.GRID; i++) {
      const p = w2c(W.roadCoord(i));
      x.beginPath(); x.moveTo(p, 0); x.lineTo(p, res); x.stroke();
      x.beginPath(); x.moveTo(0, p); x.lineTo(res, p); x.stroke();
    }
    x.strokeStyle = 'rgba(255,210,62,0.5)'; x.lineWidth = Math.max(1, 0.35 * px);
    x.setLineDash([4 * px, 4 * px]);
    for (let i = 0; i <= W.GRID; i++) {
      const p = w2c(W.roadCoord(i));
      x.beginPath(); x.moveTo(p, 0); x.lineTo(p, res); x.stroke();
      x.beginPath(); x.moveTo(0, p); x.lineTo(res, p); x.stroke();
    }
    x.setLineDash([]);
    x.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i <= W.GRID; i++) for (let j = 0; j <= W.GRID; j++) {
      const ix = W.roadCoord(i), iz = W.roadCoord(j);
      for (const [ox, oz, w, h] of [[-5, -6.6, 3.4, 1.4], [5, -6.6, 3.4, 1.4], [-5, 6.6, 3.4, 1.4], [5, 6.6, 3.4, 1.4], [-6.6, -5, 1.4, 3.4], [-6.6, 5, 1.4, 3.4], [6.6, -5, 1.4, 3.4], [6.6, 5, 1.4, 3.4]]) {
        x.fillRect(w2c(ix + ox - w / 2), w2c(iz + oz - h / 2), w * px, h * px);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(W.SPAN, W.SPAN), new THREE.MeshLambertMaterial({ map: tex }));
    ground.rotation.x = -Math.PI / 2;
    G.scene.add(ground);
    const outer = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshLambertMaterial({ color: 0x10141c }));
    outer.rotation.x = -Math.PI / 2;
    outer.position.y = -0.2;
    G.scene.add(outer);
  }

  function addBuilding(x, z, w, h, d, mat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, h / 2 + 0.3, z);
    m.castShadow = m.receiveShadow = true;
    G.scene.add(m);
    W.addCollider(x - w / 2, z - d / 2, x + w / 2, z + d / 2, h);
    return m;
  }

  function neonSign(x, y, z, ry, color, w, h) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 }));
    m.position.set(x, y, z); m.rotation.y = ry;
    G.scene.add(m);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, h + 0.3, 0.15), W.mats.dark);
    frame.position.set(x - Math.sin(ry) * 0.1, y, z - Math.cos(ry) * 0.1);
    frame.rotation.y = ry;
    G.scene.add(frame);
    glowMats.push({ isSign: true, m });
  }

  function buildBlock(i, j) {
    const cc = W.cellCenter(i, j);
    const dist = W.districtOf(i, j);
    const sw = new THREE.Mesh(new THREE.BoxGeometry(W.BLOCK, 0.3, W.BLOCK), W.mats.sidewalk);
    sw.position.set(cc.x, 0.15, cc.z);
    sw.receiveShadow = true;
    G.scene.add(sw);

    const M = W.buildingMats;
    if (dist.id === 'downtown') {
      const n = U.randi(1, 2);
      for (let k = 0; k < n; k++) {
        const w = U.rand(14, 20), d = U.rand(14, 20), h = U.rand(45, 120);
        const b = addBuilding(cc.x + U.rand(-10, 10), cc.z + U.rand(-10, 10), w, h, d, Math.random() < 0.5 ? W.mats.glass : U.pick(M));
        if (Math.random() < 0.6) {
          const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 8), W.mats.metal);
          ant.position.set(b.position.x, h + 4.3, b.position.z);
          G.scene.add(ant);
          const tip = new THREE.Mesh(new THREE.SphereGeometry(0.35), new THREE.MeshBasicMaterial({ color: 0xff3355 }));
          tip.position.set(b.position.x, h + 8.4, b.position.z);
          G.scene.add(tip);
        }
      }
    } else if (dist.id === 'neon') {
      const n = U.randi(2, 3);
      for (let k = 0; k < n; k++) {
        const w = U.rand(10, 15), d = U.rand(10, 15), h = U.rand(14, 38);
        const ox = (k - 1) * 14 + U.rand(-2, 2);
        addBuilding(cc.x + ox, cc.z + U.rand(-8, 8), w, h, d, U.pick(M));
        if (Math.random() < 0.7) {
          const col = U.pick([0xff2d95, 0x00e5ff, 0xffd23e, 0x7cff4d, 0xae3ec9]);
          neonSign(cc.x + ox + U.pick([-1, 1]) * (w / 2 + 0.2), U.rand(6, h - 3), cc.z, Math.PI / 2, col, U.rand(2, 5), U.rand(1.5, 4));
        }
      }
    } else if (dist.id === 'residential') {
      const n = U.randi(3, 4);
      for (let k = 0; k < n; k++) {
        const w = U.rand(8, 13), d = U.rand(8, 13), h = U.rand(7, 18);
        addBuilding(cc.x + U.rand(-14, 14), cc.z + U.rand(-14, 14), w, h, d, U.pick(M));
      }
      for (let k = 0; k < 3; k++) {
        const tx = cc.x + U.rand(-19, 19), tz = cc.z + U.rand(-19, 19);
        const tr = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2.5), W.mats.trunk);
        trunk.position.y = 1.25;
        const c1 = new THREE.Mesh(new THREE.ConeGeometry(2.2, 4, 7), W.mats.leaf);
        c1.position.y = 4.2;
        tr.add(trunk, c1);
        tr.position.set(tx, 0.3, tz);
        G.scene.add(tr);
      }
    } else if (dist.id === 'industrial') {
      const w = U.rand(24, 34), d = U.rand(18, 26), h = U.rand(8, 15);
      addBuilding(cc.x, cc.z - 6, w, h, d, U.pick(M));
      for (let k = 0; k < U.randi(2, 4); k++) {
        const col = new THREE.Mesh(new THREE.BoxGeometry(6, 2.6, 2.6),
          new THREE.MeshLambertMaterial({ color: U.pick([0xb5443c, 0x2d6a8f, 0x8f7a2d, 0x3c7a44]) }));
        col.position.set(cc.x + U.rand(-16, 16), 1.6, cc.z + U.rand(12, 20));
        col.castShadow = true;
        G.scene.add(col);
        W.addCollider(col.position.x - 3, col.position.z - 1.3, col.position.x + 3, col.position.z + 1.3, 2.6);
      }
    } else {
      const w = U.rand(20, 30), d = U.rand(16, 24), h = U.rand(6, 11);
      addBuilding(cc.x, cc.z, w, h, d, U.pick(M));
      if (Math.random() < 0.5) {
        const crane = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.BoxGeometry(1, 22, 1), W.mats.metal);
        pole.position.y = 11;
        const arm = new THREE.Mesh(new THREE.BoxGeometry(16, 0.8, 0.8), W.mats.metal);
        arm.position.set(5, 21, 0);
        crane.add(pole, arm);
        crane.position.set(cc.x + 16, 0, cc.z + 16);
        G.scene.add(crane);
      }
    }
  }

  function buildStreetlights() {
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7, 6);
    const bulbGeo = new THREE.SphereGeometry(0.35, 8, 6);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd98a });
    for (let i = 0; i <= W.GRID; i += 2) for (let j = 0; j <= W.GRID; j += 2) {
      const x = W.roadCoord(i) + 7.6, z = W.roadCoord(j) + 7.6;
      const pole = new THREE.Mesh(poleGeo, W.mats.dark);
      pole.position.set(x, 3.5, z);
      G.scene.add(pole);
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(x, 7.1, z);
      bulb.userData.streetlight = true;
      G.scene.add(bulb);
    }
  }

  W.rain = { active: false, next: U.rand(90, 240) };
  W.fogFar = 420;
  let rainPts = null, rainGeo = null;

  function buildRain() {
    const N = 900;
    rainGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = U.rand(-60, 60); pos[i * 3 + 1] = U.rand(0, 40); pos[i * 3 + 2] = U.rand(-60, 60);
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    rainPts = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: 0x9fc8ff, size: 0.14, transparent: true, opacity: 0, depthWrite: false }));
    rainPts.visible = false;
    rainPts.frustumCulled = false;
    G.scene.add(rainPts);
  }

  function buildStars() {
    const geo = new THREE.BufferGeometry();
    const pos = [];
    for (let i = 0; i < 600; i++) {
      const a = U.rand(0, Math.PI * 2), e = U.rand(0.15, 1.4), r = 1400;
      pos.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    stars = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xcfe4ff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0 }));
    G.scene.add(stars);
  }

  W.specialLocations = [];

  W.build = function () {
    buildMaterials();
    buildGround();
    for (let i = 0; i < W.GRID; i++) for (let j = 0; j < W.GRID; j++) buildBlock(i, j);
    buildStreetlights();
    buildStars();
    buildRain();

    W.sunDisc = new THREE.Mesh(new THREE.SphereGeometry(22, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xffdf8a, fog: false }));
    G.scene.add(W.sunDisc);
    W.moonDisc = new THREE.Mesh(new THREE.SphereGeometry(13, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xdfe8ff, fog: false }));
    G.scene.add(W.moonDisc);
    W.clouds = [];
    const cGeo = new THREE.BoxGeometry(46, 4, 26);
    const cMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    W.cloudMat = cMat;
    for (let k = 0; k < 14; k++) {
      const cl = new THREE.Mesh(cGeo, cMat);
      cl.position.set(U.rand(-700, 700), U.rand(110, 170), U.rand(-700, 700));
      cl.userData.speed = U.rand(1.5, 4);
      G.scene.add(cl);
      W.clouds.push(cl);
    }

    const L = W.specialLocations;
    const put = (i, j, dx, dz) => { const c = W.cellCenter(i, j); return { x: c.x + dx, z: c.z + dz }; };
    const gunPos = put(4, 4, -16, -16);
    L.push({ id: 'gunshop', name: "Arsene's Guns", x: gunPos.x, z: gunPos.z, color: 0xffd23e });
    const petPos = put(2, 7, 14, 14);
    L.push({ id: 'petshop', name: 'Pet Paradise', x: petPos.x, z: petPos.z, color: 0x7cff4d });
    const artPos = put(8, 7, -14, 14);
    L.push({ id: 'artifact', name: 'Reliques du Vide', x: artPos.x, z: artPos.z, color: 0xae3ec9 });
    const arenaPos = put(1, 1, 0, 0);
    L.push({ id: 'arena', name: 'Arène des Bêtes', x: arenaPos.x, z: arenaPos.z, color: 0xff5a3c });
    const riftPos = put(9, 0, 0, 0);
    L.push({ id: 'rift', name: 'Le Rift', x: riftPos.x, z: riftPos.z, color: 0x8a2be2 });
    L.push({ id: 'race1', name: 'Course Downtown', x: put(5, 3, 0, 0).x, z: put(5, 3, 0, 0).z, color: 0x00e5ff });
    L.push({ id: 'race2', name: 'Course Neon', x: put(7, 8, 0, 0).x, z: put(7, 8, 0, 0).z, color: 0x00e5ff });
    L.push({ id: 'race3', name: 'Course Docks', x: put(1, 3, 0, 0).x, z: put(1, 3, 0, 0).z, color: 0x00e5ff });

    for (const loc of L) {
      W.makeMarker(loc.x, loc.z, loc.color, loc.id);
      W.addStaticBlip(loc.x, loc.z, loc.color, loc.name);
    }
    W.sun = sun = new THREE.DirectionalLight(0xffffff, 1.1);
    G.scene.add(sun);
    W.hemi = hemi = new THREE.HemisphereLight(0x9fc3ff, 0x30281e, 0.7);
    G.scene.add(hemi);
    skyColor = new THREE.Color(0x7ec0ee);
    G.scene.background = skyColor;
    fog = new THREE.Fog(0x7ec0ee, 120, 420);
    G.scene.fog = fog;
  };

  W.applyFogDistance = function () {
    const q = G.settings.quality;
    if (q === 'perf') W.fogFar = 260;
    else if (q === 'hd') W.fogFar = 420;
    else W.fogFar = 620;
  };

  const daySky = new THREE.Color(0x7ec0ee), duskSky = new THREE.Color(0xff8a5a), nightSky = new THREE.Color(0x070b18);
  const tmpC = new THREE.Color(), tmpC2 = new THREE.Color();

  W.updateEnvironment = function (dt) {
    G.state.time = (G.state.time + dt / 60) % 24;
    const t = G.state.time, nf = W.nightFactor();
    const ang = (t - 6) / 12 * Math.PI;
    const elev = Math.sin(ang);
    sun.position.set(Math.cos(ang) * 300, Math.max(elev, -0.3) * 300, 120);
    sun.intensity = Math.max(0, elev) * 1.15 + 0.05;
    sun.color.setHSL(0.12, 0.5, U.clamp(0.5 + elev * 0.5, 0.5, 0.85));
    hemi.intensity = 0.25 + Math.max(0, elev) * 0.55;

    const dayF = U.clamp(elev * 2.2, 0, 1);
    tmpC.copy(nightSky).lerp(daySky, dayF);
    if (elev < 0.25 && elev > -0.1) tmpC2.copy(duskSky), tmpC.lerp(tmpC2, U.clamp((0.25 - Math.abs(elev - 0.08)) * 2, 0, 1));
    const R = W.rain;
    R.next -= dt;
    if (R.next <= 0) {
      R.active = !R.active;
      R.next = R.active ? U.rand(60, 150) : U.rand(120, 300);
      if (G.state.screen === 'play') G.ui.toast(R.active ? '🌧️ La pluie s\'abat sur Shadow City...' : '☀️ Le ciel se dégage.');
    }
    if (R.active) tmpC.multiplyScalar(0.55);
    skyColor.copy(tmpC);
    fog.color.copy(tmpC);
    fog.far = W.fogFar * (R.active ? 0.5 : 1);
    fog.near = fog.far * 0.28;

    if (rainPts) {
      rainPts.visible = R.active;
      const targetOp = R.active ? 0.55 : 0;
      rainPts.material.opacity += (targetOp - rainPts.material.opacity) * Math.min(1, dt * 2);
      if (R.active) {
        const pp = G.player.pos;
        rainPts.position.set(pp.x, 0, pp.z);
        const arr = rainGeo.attributes.position.array;
        for (let i = 0; i < arr.length; i += 3) {
          arr[i + 1] -= 38 * dt;
          if (arr[i + 1] < 0) { arr[i + 1] = U.rand(30, 40); arr[i] = U.rand(-60, 60); arr[i + 2] = U.rand(-60, 60); }
        }
        rainGeo.attributes.position.needsUpdate = true;
      }
    }

    const glow = nf;
    for (const m of glowMats) {
      if (m.isSign) m.m.material.opacity = 0.25 + nf * 0.65;
      else m.emissiveIntensity = nf * 0.9;
    }
    if (stars) stars.material.opacity = nf * 0.9;

    if (W.sunDisc) {
      W.sunDisc.position.copy(sun.position).normalize().multiplyScalar(1300);
      W.sunDisc.visible = elev > -0.12;
      W.moonDisc.position.set(-sun.position.x, -sun.position.y, -sun.position.z).normalize().multiplyScalar(1300);
      W.moonDisc.visible = elev < 0.12;
    }
    if (W.clouds) {
      W.cloudMat.opacity = (W.rain.active ? 0.85 : 0.5) - nf * 0.32;
      for (const cl of W.clouds) {
        cl.position.x += cl.userData.speed * dt;
        if (cl.position.x > 760) cl.position.x = -760;
      }
    }
  };
})();
