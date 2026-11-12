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
  const lightGlows = [];

  function wallPattern(x, style) {
    if (style === 'brick') {
      x.fillStyle = '#8f8378';
      x.fillRect(0, 0, 128, 128);
      const cols = ['#9c4a32', '#8a3f2c', '#a3543a', '#7c3826', '#94462f'];
      for (let r = 0; r < 8; r++) {
        const off = (r % 2) * 16;
        for (let k = -1; k < 5; k++) {
          x.fillStyle = cols[((r * 3 + k) % cols.length + cols.length) % cols.length];
          x.fillRect(k * 32 + off, r * 16 + 2, 30, 12);
        }
      }
      for (let k = 0; k < 14; k++) {
        const px = Math.random() * 128, py = Math.random() * 128, pr = 3 + Math.random() * 9;
        x.fillStyle = Math.random() < 0.5 ? 'rgba(30,26,24,0.28)' : 'rgba(20,18,22,0.2)';
        for (const [ox, oy] of [[0, 0], [-128, 0], [0, -128], [-128, -128]]) {
          x.beginPath(); x.arc(px + ox, py + oy, pr, 0, Math.PI * 2); x.fill();
        }
      }
      for (let k = 0; k < 10; k++) {
        const px = Math.random() * 128, py = Math.random() * 128, pr = 2 + Math.random() * 6;
        x.fillStyle = Math.random() < 0.5 ? 'rgba(74,107,58,0.5)' : 'rgba(58,87,46,0.45)';
        for (const [ox, oy] of [[0, 0], [-128, 0], [0, -128], [-128, -128]]) {
          x.beginPath(); x.arc(px + ox, py + oy, pr, 0, Math.PI * 2); x.fill();
        }
      }
    } else {
      x.fillStyle = '#2b2e33';
      x.fillRect(0, 0, 128, 128);
      for (let k = 0; k < 420; k++) {
        const px = Math.random() * 128, py = Math.random() * 128;
        x.fillStyle = Math.random() < 0.5 ? 'rgba(58,62,68,0.5)' : 'rgba(22,24,27,0.5)';
        x.fillRect(px, py, 1 + Math.random() * 2, 1 + Math.random() * 2);
      }
      for (let k = 0; k < 8; k++) {
        const px = Math.random() * 128, py = Math.random() * 128, pr = 8 + Math.random() * 20;
        x.fillStyle = 'rgba(12,13,15,0.18)';
        for (const [ox, oy] of [[0, 0], [-128, 0], [0, -128], [-128, -128]]) {
          x.beginPath(); x.arc(px + ox, py + oy, pr, 0, Math.PI * 2); x.fill();
        }
      }
    }
  }

  function windowTexture(litColor, wallStyle) {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const x = c.getContext('2d');
    wallPattern(x, wallStyle);
    for (let r = 0; r < 8; r++) for (let col = 0; col < 6; col++) {
      const lit = Math.random() < 0.4;
      x.fillStyle = lit ? litColor : 'rgba(10,16,30,0.9)';
      x.fillRect(6 + col * 20, 5 + r * 15, 13, 9);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }

  function pavingTex() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#3a4048'; x.fillRect(0, 0, 256, 256);
    x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 2;
    for (let i = 0; i <= 256; i += 32) {
      x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke();
      x.beginPath(); x.moveTo(0, i); x.lineTo(256, i); x.stroke();
    }
    x.fillStyle = 'rgba(255,255,255,0.06)';
    for (let k = 0; k < 500; k++) x.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    x.fillStyle = 'rgba(0,0,0,0.12)';
    for (let k = 0; k < 300; k++) x.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(8, 8);
    return t;
  }

  function grassTex() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#3d5a34'; x.fillRect(0, 0, 256, 256);
    for (let k = 0; k < 1400; k++) {
      x.fillStyle = Math.random() < 0.5 ? 'rgba(90,150,60,0.5)' : 'rgba(40,80,40,0.5)';
      x.fillRect(Math.random() * 256, Math.random() * 256, 2, 4);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(10, 10);
    return t;
  }

  function buildMaterials() {
    W.mats = {};
    W.mats.asphalt = new THREE.MeshLambertMaterial({ color: 0x1c2026 });
    W.mats.sidewalk = new THREE.MeshLambertMaterial({ map: pavingTex() });
    W.mats.grass = new THREE.MeshLambertMaterial({ map: grassTex() });
    W.mats.dark = new THREE.MeshLambertMaterial({ color: 0x22262e });
    W.mats.metal = new THREE.MeshLambertMaterial({ color: 0x5a6472 });
    W.mats.trunk = new THREE.MeshLambertMaterial({ color: 0x4a3626 });
    W.mats.leaf = new THREE.MeshLambertMaterial({ color: 0x2d6a34 });
    W.mats.glass = new THREE.MeshLambertMaterial({ color: 0x1c2a4a, emissive: 0x22406a, emissiveIntensity: 0.4 });
    W.buildingMats = [];
    const variants = [
      ['#ffd98a', 'brick'], ['#c9f0ff', 'concrete'], ['#ffe9b8', 'brick'],
      ['#d0ffd8', 'concrete'], ['#ffc9e8', 'brick'], ['#fff3c9', 'concrete']
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
    x.fillStyle = 'rgba(255,255,255,0.05)';
    for (let k = 0; k < 9000; k++) x.fillRect(Math.random() * res, Math.random() * res, 2, 2);
    x.fillStyle = 'rgba(0,0,0,0.16)';
    for (let k = 0; k < 6000; k++) x.fillRect(Math.random() * res, Math.random() * res, 2, 2);
    x.fillStyle = 'rgba(0,0,0,0.3)';
    for (let k = 0; k < 45; k++) {
      x.beginPath();
      x.ellipse(Math.random() * res, Math.random() * res, 8 + Math.random() * 20, 5 + Math.random() * 10, Math.random() * 3, 0, Math.PI * 2);
      x.fill();
    }
    x.fillStyle = '#1a1e24';
    for (let k = 0; k < 30; k++) {
      x.beginPath();
      x.arc(Math.random() * res, Math.random() * res, 2.5 * px, 0, Math.PI * 2);
      x.fill();
    }
    x.strokeStyle = 'rgba(255,255,255,0.22)';
    x.lineWidth = Math.max(1, 0.25 * px);
    for (let i = 0; i <= W.GRID; i++) {
      const rp = W.roadCoord(i);
      for (const off of [-W.ROAD / 2 + 0.9, W.ROAD / 2 - 0.9]) {
        const q = w2c(rp + off);
        x.beginPath(); x.moveTo(q, 0); x.lineTo(q, res); x.stroke();
        x.beginPath(); x.moveTo(0, q); x.lineTo(res, q); x.stroke();
      }
    }
    x.fillStyle = 'rgba(255,200,40,0.55)';
    for (let i = 0; i <= W.GRID; i++) {
      const rp = W.roadCoord(i);
      for (let t = W.ORIGIN + 4; t < -W.ORIGIN - 4; t += 7) {
        let nearI = false;
        for (let j = 0; j <= W.GRID; j++) if (Math.abs(t - W.roadCoord(j)) < W.ROAD / 2 + 1.5) nearI = true;
        if (nearI) continue;
        x.fillRect(w2c(rp - 0.2), w2c(t), 0.4 * px, 3.2 * px);
        x.fillRect(w2c(t), w2c(rp - 0.2), 3.2 * px, 0.4 * px);
      }
    }
    x.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i <= W.GRID; i++) for (let j = 0; j <= W.GRID; j++) {
      const ix = W.roadCoord(i), iz = W.roadCoord(j);
      for (const [ox, oz, w, h] of [[-5, -6.6, 3.4, 1.4], [5, -6.6, 3.4, 1.4], [-5, 6.6, 3.4, 1.4], [5, 6.6, 3.4, 1.4], [-6.6, -5, 1.4, 3.4], [-6.6, 5, 1.4, 3.4], [6.6, -5, 1.4, 3.4], [6.6, 5, 1.4, 3.4]]) {
        x.fillRect(w2c(ix + ox - w / 2), w2c(iz + oz - h / 2), w * px, h * px);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8;
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
    if (h > 12 && Math.random() < 0.6) {
      const ac = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 1.6), W.mats.metal);
      ac.position.set(x + U.rand(-w / 4, w / 4), h + 0.75, z + U.rand(-d / 4, d / 4));
      ac.castShadow = true;
      G.scene.add(ac);
    }
    if (h > 16 && Math.random() < 0.45) {
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4, 6), W.mats.metal);
      const ax = x + U.rand(-w / 4, w / 4), az = z + U.rand(-d / 4, d / 4);
      ant.position.set(ax, h + 2.3, az);
      G.scene.add(ant);
      const bc = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 5),
        new THREE.MeshBasicMaterial({ color: 0xff2222, transparent: true }));
      bc.position.set(ax, h + 4.4, az);
      G.scene.add(bc);
      W.beacons.push(bc);
    }
    if (h > 9 && h <= 16 && Math.random() < 0.35) {
      const wt = new THREE.Group();
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 2, 10), W.mats.trunk);
      tank.position.y = 3;
      const cap = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.8, 10), W.mats.dark);
      cap.position.y = 4.4;
      wt.add(tank, cap);
      wt.position.set(x + U.rand(-w / 5, w / 5), h + 0.3, z + U.rand(-d / 5, d / 5));
      G.scene.add(wt);
    }
    W.addCollider(x - w / 2, z - d / 2, x + w / 2, z + d / 2, h);
    return m;
  }

  const adCache = {};
  function adTex(i) {
    if (adCache[i]) return adCache[i];
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const x = c.getContext('2d');
    const ads = [
      ['#e0315b', 'SHADOW COLA', '#ffe066'],
      ['#0b7285', 'NEON FM 103', '#a5f3fc'],
      ['#2b2f3a', "ARSENE'S GUNS", '#ffd23e'],
      ['#5f3dc4', 'CITY RACE GP', '#d0bfff']
    ];
    const ad = ads[i % ads.length];
    x.fillStyle = ad[0]; x.fillRect(0, 0, 256, 128);
    x.fillStyle = ad[2]; x.font = 'bold 26px sans-serif'; x.textAlign = 'center';
    x.fillText(ad[1], 128, 74);
    x.strokeStyle = ad[2]; x.lineWidth = 6; x.strokeRect(8, 8, 240, 112);
    const t = new THREE.CanvasTexture(c);
    adCache[i] = t;
    return t;
  }

  function billboard(x, y, z, ry) {
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4, 0.4), W.mats.metal);
    pole.position.set(x, y + 2, z);
    const t = adTex(U.randi(0, 3));
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.5), new THREE.MeshLambertMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.25 }));
    panel.position.set(x, y + 5.5, z);
    panel.rotation.y = ry;
    G.scene.add(pole, panel);
  }

  function neonGroundGlow(x, z, col) {
    const gp = new THREE.Mesh(new THREE.PlaneGeometry(7, 12),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false }));
    gp.rotation.x = -Math.PI / 2;
    gp.position.set(x, 0.34, z);
    G.scene.add(gp);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.4, 7, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    cone.position.set(x, 3.8, z);
    G.scene.add(cone);
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
    glowMats.push({ isSign: true, m, flicker: Math.random() < 0.3 });
  }

  function buildBlock(i, j) {
    const cc = W.cellCenter(i, j);
    const dist = W.districtOf(i, j);
    const slabMat = dist.id === 'residential' ? W.mats.grass : W.mats.sidewalk;
    const sw = new THREE.Mesh(new THREE.BoxGeometry(W.BLOCK, 0.3, W.BLOCK), slabMat);
    sw.position.set(cc.x, 0.15, cc.z);
    sw.receiveShadow = true;
    G.scene.add(sw);

    const M = W.buildingMats;
    if (dist.id === 'downtown') {
      const n = U.randi(1, 2);
      for (let k = 0; k < n; k++) {
        const w = U.rand(14, 20), d = U.rand(14, 20), h = U.rand(45, 120);
        const bx = cc.x + U.rand(-10, 10), bz = cc.z + U.rand(-10, 10);
        const b = addBuilding(bx, bz, w, h, d, Math.random() < 0.5 ? W.mats.glass : U.pick(M));
        for (let f = 0; f < 2; f++) {
          const sw2 = U.rand(3, 5);
          const front = new THREE.Mesh(new THREE.PlaneGeometry(sw2, 2.4),
            new THREE.MeshLambertMaterial({ color: 0xfff4d6, emissive: U.pick([0xffb84d, 0x74e8ff, 0xff8fab, 0xb3ff8a]), emissiveIntensity: 0.5 }));
          const side = U.pick([-1, 1]);
          front.position.set(side > 0 ? bx + w / 2 + 0.06 : bx - w / 2 - 0.06, 1.6, bz + U.rand(-d / 3, d / 3));
          front.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
          G.scene.add(front);
          glowMats.push({ isSign: true, m: front, shop: true });
        }
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
          const sx = cc.x + ox + U.pick([-1, 1]) * (w / 2 + 0.2);
          neonSign(sx, U.rand(6, h - 3), cc.z, Math.PI / 2, col, U.rand(2, 5), U.rand(1.5, 4));
          neonGroundGlow(sx + (sx > cc.x ? -1.4 : 1.4), cc.z, col);
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
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.38, 2.6, 7), W.mats.trunk);
        trunk.position.y = 1.3;
        const lc = U.pick([0x2d6a34, 0x3d7a3a, 0x557a2e, 0x2a6e4a]);
        const lmat = new THREE.MeshLambertMaterial({ color: lc });
        const s1 = new THREE.Mesh(new THREE.SphereGeometry(1.9, 8, 6), lmat);
        s1.position.y = 3.6; s1.castShadow = true;
        const s2 = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 6), lmat);
        s2.position.set(U.rand(-0.7, 0.7), 4.7, U.rand(-0.7, 0.7));
        const s3 = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 6), lmat);
        s3.position.set(U.rand(-0.9, 0.9), 4.4, U.rand(-0.9, 0.9));
        tr.add(trunk, s1, s2, s3);
        tr.position.set(tx, 0.3, tz);
        G.scene.add(tr);
        W.colliders.push({ x: tx, z: tz, r: 0.5 });
      }
      for (let k = 0; k < 8; k++) {
        const gx = cc.x + U.rand(-21, 21), gz = cc.z + U.rand(-21, 21);
        const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.32, U.rand(0.5, 0.9), 5), W.mats.leaf);
        tuft.position.set(gx, 0.55, gz);
        tuft.rotation.z = U.rand(-0.25, 0.25);
        G.scene.add(tuft);
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

  function makeLightGlow(x, y, z) {
    try {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const x2 = c.getContext('2d');
      const grd = x2.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, 'rgba(255,220,140,0.9)');
      grd.addColorStop(1, 'rgba(255,200,100,0)');
      x2.fillStyle = grd; x2.fillRect(0, 0, 64, 64);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, opacity: 0 }));
      sp.scale.set(4.5, 4.5, 1);
      sp.position.set(x, y, z);
      G.scene.add(sp);
      lightGlows.push(sp);
      return sp;
    } catch (e) { return null; }
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
      bulb.userData.glow = makeLightGlow(bulb.position.x, bulb.position.y, bulb.position.z);
      G.scene.add(bulb);
    }
  }

  W.rain = { active: false, next: U.rand(90, 240) };
  function buildSmokestacks() {
    W.smokes = [];
    const smokeGeo = new THREE.SphereGeometry(1.6, 8, 6);
    for (let k = 0; k < 5; k++) {
      const cell = W.cellCenter(6 + U.randi(0, 3), U.randi(0, 3));
      const chim = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 7, 8), W.mats.dark);
      chim.position.set(cell.x + U.rand(-10, 10), 3.5, cell.z + U.rand(-10, 10));
      G.scene.add(chim);
      for (let m = 0; m < 3; m++) {
        const puff = new THREE.Mesh(smokeGeo, new THREE.MeshLambertMaterial({ color: 0x9aa0a8, transparent: true, opacity: 0.3 }));
        puff.position.set(chim.position.x, 8, chim.position.z);
        puff.userData.smokeT = m * 2.2;
        G.scene.add(puff);
        W.smokes.push(puff);
      }
    }
  }

  function buildTrafficLights() {
    W.trafficLights = [];
    const mats = {
      redOn: new THREE.MeshBasicMaterial({ color: 0xff2222 }), redOff: new THREE.MeshBasicMaterial({ color: 0x3a1010 }),
      greenOn: new THREE.MeshBasicMaterial({ color: 0x2fd46e }), greenOff: new THREE.MeshBasicMaterial({ color: 0x103a1c })
    };
    for (let k = 0; k < 10; k++) {
      const ix = W.roadCoord(U.randi(1, W.GRID - 1)), iz = W.roadCoord(U.randi(1, W.GRID - 1));
      const corner = U.pick([[7.5, 7.5], [-7.5, 7.5], [7.5, -7.5], [-7.5, -7.5]]);
      const tx = ix + corner[0], tz = iz + corner[1];
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5.2, 6), W.mats.metal);
      pole.position.set(tx, 2.6, tz);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.3, 0.4), W.mats.dark);
      head.position.set(tx, 5.2, tz);
      const rl = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), mats.redOn);
      rl.position.set(tx, 5.6, tz + 0.22);
      const gl = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), mats.greenOff);
      gl.position.set(tx, 4.9, tz + 0.22);
      G.scene.add(pole, head, rl, gl);
      W.trafficLights.push({ rl, gl, mats });
    }
  }

  const STREET_NAMES = ['Neon', 'Crimson', 'Shadow', 'Viper', 'Ghost', 'Rift', 'Midnight', 'Chrome', 'Titan', 'Onyx'];
  const signTexCache = {};
  function signTex(name) {
    if (signTexCache[name]) return signTexCache[name];
    const c = document.createElement('canvas'); c.width = 128; c.height = 32;
    const x = c.getContext('2d');
    x.fillStyle = '#1c3a5e'; x.fillRect(0, 0, 128, 32);
    x.strokeStyle = '#e8eef2'; x.lineWidth = 2; x.strokeRect(2, 2, 124, 28);
    x.fillStyle = '#e8eef2'; x.font = 'bold 16px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(name, 64, 17);
    const t = new THREE.CanvasTexture(c);
    signTexCache[name] = t;
    return t;
  }
  function streetSign(x, z) {
    const name = (Math.random() < 0.5 ? 'RUE ' : 'AV. ') + U.pick(STREET_NAMES);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6), W.mats.metal);
    pole.position.set(x, 1.3, z);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.42), new THREE.MeshBasicMaterial({ map: signTex(name), transparent: false }));
    plate.position.set(x, 2.55, z + 0.07);
    const plate2 = plate.clone();
    plate2.rotation.y = Math.PI;
    plate2.position.z = z - 0.07;
    G.scene.add(pole, plate, plate2);
  }

  function buildProps() {
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.26, 2.2, 6);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5a3d28 });
    const leafGeo = new THREE.ConeGeometry(1.5, 2.6, 8);
    const leafMatA = new THREE.MeshLambertMaterial({ color: 0x2f6b33 });
    const leafMatB = new THREE.MeshLambertMaterial({ color: 0x3d7a3a });
    const crateGeo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
    const crateMat = new THREE.MeshLambertMaterial({ color: 0x8a6a42 });
    const barrelGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 10);
    const barrelMat = new THREE.MeshLambertMaterial({ color: 0x9a3b2e });
    const binGeo = new THREE.CylinderGeometry(0.4, 0.34, 1, 8);
    const binMat = new THREE.MeshLambertMaterial({ color: 0x2e4a2e });
    const hydGeo = new THREE.CylinderGeometry(0.16, 0.2, 0.7, 8);
    const hydMat = new THREE.MeshLambertMaterial({ color: 0xd22c2c });
    const benchGeo = new THREE.BoxGeometry(1.8, 0.12, 0.5);
    const benchMat = new THREE.MeshLambertMaterial({ color: 0x6a4a2f });
    const legGeo = new THREE.BoxGeometry(0.12, 0.45, 0.5);
    for (let i = 0; i < W.GRID; i++) for (let j = 0; j < W.GRID; j++) {
      if (Math.random() > 0.45) continue;
      const cc = W.cellCenter(i, j);
      const dist = W.districtOf(i, j);
      const ox = U.rand(-W.BLOCK / 2 + 4, W.BLOCK / 2 - 4);
      const oz = U.rand(-W.BLOCK / 2 + 4, W.BLOCK / 2 - 4);
      const px2 = cc.x + ox, pz2 = cc.z + oz;
      if (dist.id === 'residential') {
        if (Math.random() < 0.3) {
          const mp = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), W.mats.trunk);
          mp.position.set(px2, 0.55, pz2);
          const mb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.35), new THREE.MeshLambertMaterial({ color: 0x2271cc }));
          mb.position.set(px2, 1.2, pz2);
          G.scene.add(mp, mb);
        } else {
          const tr = new THREE.Mesh(trunkGeo, trunkMat);
          tr.position.set(px2, 1.1, pz2); tr.castShadow = true;
          G.scene.add(tr);
          const lf = new THREE.Mesh(leafGeo, Math.random() < 0.5 ? leafMatA : leafMatB);
          lf.position.set(px2, 3.2, pz2); lf.castShadow = true;
          G.scene.add(lf);
          W.addCollider(px2 - 0.3, pz2 - 0.3, px2 + 0.3, pz2 + 0.3, 2);
        }
      } else if (dist.id === 'docks' && Math.random() < 0.5) {
        const cont = new THREE.Mesh(new THREE.BoxGeometry(5, 2.4, 2.3), new THREE.MeshLambertMaterial({ color: U.pick([0xe03131, 0x1971c2, 0x2f9e44, 0xe8590c]) }));
        cont.position.set(px2, 1.2, pz2); cont.castShadow = true; cont.rotation.y = U.rand(0, 3);
        G.scene.add(cont);
        W.addCollider(px2 - 2.4, pz2 - 2.4, px2 + 2.4, pz2 + 2.4, 2.4);
      } else if (dist.id === 'industrial' || dist.id === 'docks') {
        if (Math.random() < 0.3) {
          const cn = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.75, 8), new THREE.MeshLambertMaterial({ color: 0xff7b1c }));
          cn.position.set(px2, 0.68, pz2);
          const cb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.6), new THREE.MeshLambertMaterial({ color: 0xff7b1c }));
          cb.position.set(px2, 0.33, pz2);
          const band = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.12, 8), new THREE.MeshLambertMaterial({ color: 0xf2f5f8 }));
          band.position.set(px2, 0.52, pz2);
          G.scene.add(cn, cb, band);
          continue;
        }
        const m = new THREE.Mesh(Math.random() < 0.5 ? crateGeo : barrelGeo, Math.random() < 0.5 ? crateMat : barrelMat);
        m.position.set(px2, 0.7, pz2); m.castShadow = true; m.rotation.y = U.rand(0, 3);
        G.scene.add(m);
        W.addCollider(px2 - 0.5, pz2 - 0.5, px2 + 0.5, pz2 + 0.5, 1.4);
      } else {
        const r = Math.random();
        if (dist.id === 'downtown' && r < 0.18) {
          const base = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 0.7, 14), W.mats.sidewalk);
          base.position.set(px2, 0.55, pz2);
          const water = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.5, 14), new THREE.MeshPhongMaterial({ color: 0x2a8fd8, transparent: true, opacity: 0.75, shininess: 120 }));
          water.position.set(px2, 0.9, pz2);
          const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.3, 1.6, 8), W.mats.metal);
          jet.position.set(px2, 1.8, pz2);
          G.scene.add(base, water, jet);
          W.fountains.push(water);
          W.addCollider(px2 - 2.6, pz2 - 2.6, px2 + 2.6, pz2 + 2.6, 1);
        } else if (dist.id === 'downtown' && r < 0.32) {
          const pole2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3, 0.15), W.mats.metal);
          pole2.position.set(px2, 1.5, pz2);
          const roof2 = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.15, 1.4), W.mats.dark);
          roof2.position.set(px2 + 1.5, 3, pz2);
          const seat2 = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 0.5), benchMat);
          seat2.position.set(px2 + 1.2, 0.6, pz2);
          G.scene.add(pole2, roof2, seat2);
        } else if (r < 0.55) {
          const b = new THREE.Mesh(binGeo, binMat);
          b.position.set(px2, 0.5, pz2); b.castShadow = true;
          G.scene.add(b);
        } else if (r < 0.75) {
          const h = new THREE.Mesh(hydGeo, hydMat);
          h.position.set(px2, 0.35, pz2); h.castShadow = true;
          G.scene.add(h);
        } else {
          const b = new THREE.Mesh(benchGeo, benchMat);
          b.position.set(px2, 0.5, pz2); b.castShadow = true;
          G.scene.add(b);
          const l1 = new THREE.Mesh(legGeo, benchMat); l1.position.set(px2 - 0.7, 0.25, pz2);
          const l2 = new THREE.Mesh(legGeo, benchMat); l2.position.set(px2 + 0.7, 0.25, pz2);
          G.scene.add(l1); G.scene.add(l2);
        }
      }
    }
  }

  function buildSunGlow() {
    try {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const x = c.getContext('2d');
      const grd = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      grd.addColorStop(0, 'rgba(255,230,160,0.9)');
      grd.addColorStop(0.4, 'rgba(255,180,90,0.35)');
      grd.addColorStop(1, 'rgba(255,150,60,0)');
      x.fillStyle = grd; x.fillRect(0, 0, 128, 128);
      W.sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, fog: false }));
      W.sunGlow.scale.set(220, 220, 1);
      G.scene.add(W.sunGlow);
    } catch (e) { W.sunGlow = null; }
  }

  function buildMoonGlow() {
    try {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const x = c.getContext('2d');
      for (let k = 5; k >= 0; k--) {
        x.fillStyle = k > 2 ? 'rgba(210,225,255,' + (0.16 * (6 - k) / 3).toFixed(3) + ')' : 'rgba(150,180,255,' + (0.14 * (3 - k) / 3).toFixed(3) + ')';
        x.beginPath(); x.arc(64, 64, 14 + k * 9, 0, Math.PI * 2); x.fill();
      }
      W.moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, fog: false }));
      W.moonGlow.scale.set(160, 160, 1);
      G.scene.add(W.moonGlow);
    } catch (e) { W.moonGlow = null; }
  }

  function buildFireflies() {
    const N = 42;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const base = [];
    for (let k = 0; k < N; k++) {
      const cc = W.cellCenter(U.randi(0, 4), U.randi(6, 9));
      const b = { x: cc.x + U.rand(-20, 20), y: U.rand(0.5, 3), z: cc.z + U.rand(-20, 20), ph: U.rand(0, 6.28), sp: U.rand(0.5, 1.3) };
      pos[k * 3] = b.x; pos[k * 3 + 1] = b.y; pos[k * 3 + 2] = b.z;
      base.push(b);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    W.fireflies = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xd4ff7a, size: 0.28, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    W.fireflies.userData.base = base;
    W.fireflies.frustumCulled = false;
    G.scene.add(W.fireflies);
  }

  W.fountains = [];
  W.beacons = [];

  W.fogFar = 420;
  let rainPts = null, rainGeo = null;

  function buildMonument() {
    const cc = W.cellCenter(4, 4);
    const g = new THREE.Group();
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(7, 1.4, 7), W.mats.dark);
    plinth.position.y = 1;
    const step2 = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1, 4.6), W.mats.metal);
    step2.position.y = 2.2;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 1.3, 20, 4), W.mats.sidewalk);
    shaft.position.y = 12.7;
    shaft.rotation.y = Math.PI / 4;
    shaft.castShadow = true;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.78, 2.4, 4), W.mats.metal);
    tip.position.y = 23.9;
    tip.rotation.y = Math.PI / 4;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 2.4, 170, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x8ab8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = 108;
    g.add(plinth, step2, shaft, tip, beam);
    g.position.set(cc.x + 6, 0.3, cc.z + 6);
    G.scene.add(g);
    W.monumentBeam = beam;
    W.addCollider(cc.x + 2, cc.z + 2, cc.x + 10, cc.z + 10, 24);
  }

  function buildCranes() {
    W.cranes = [];
    for (const [ci, cj] of [[1, 1], [7, 1]]) {
      const cc = W.cellCenter(ci, cj);
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(4, 1.2, 4), W.mats.metal);
      base.position.y = 0.9;
      const tower = new THREE.Mesh(new THREE.BoxGeometry(1.4, 26, 1.4), W.mats.metal);
      tower.position.y = 14;
      tower.castShadow = true;
      const arm = new THREE.Group();
      const beam = new THREE.Mesh(new THREE.BoxGeometry(24, 0.9, 1.1), W.mats.metal);
      beam.position.x = 9;
      const counter = new THREE.Mesh(new THREE.BoxGeometry(4, 1.4, 1.6), W.mats.dark);
      counter.position.x = -4.5;
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 6, 4), W.mats.dark);
      cable.position.set(18, -3.5, 0);
      const hook = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.6), new THREE.MeshLambertMaterial({ color: 0xd9a012 }));
      hook.position.set(18, -7, 0);
      arm.add(beam, counter, cable, hook);
      arm.position.y = 26.5;
      g.add(base, tower, arm);
      g.position.set(cc.x + 12, 0, cc.z + 12);
      G.scene.add(g);
      W.cranes.push({ arm, g });
      W.addCollider(cc.x + 10, cc.z + 10, cc.x + 14, cc.z + 14, 26);
    }
  }

  function buildPuddles() {
    W.puddles = [];
    const geo = new THREE.CircleGeometry(1, 12);
    for (let k = 0; k < 26; k++) {
      const pt = W.randRoadPoint();
      const pm = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x3a5a8a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      pm.rotation.x = -Math.PI / 2;
      pm.scale.set(U.rand(1.2, 2.6), U.rand(0.8, 1.8), 1);
      pm.position.set(pt.x + U.rand(-2, 2), 0.045, pt.z + U.rand(-2, 2));
      G.scene.add(pm);
      W.puddles.push(pm);
    }
  }

  function buildFoodTrucks() {
    for (let k = 0; k < 4; k++) {
      const i = 4 + U.randi(0, 2), j = 4 + U.randi(0, 2);
      const cc = W.cellCenter(i, j);
      const x = cc.x + U.rand(-14, 14), z = cc.z + U.rand(-14, 14);
      const g = new THREE.Group();
      const bodyCol = U.pick([0xe8590c, 0x1971c2, 0x2f9e44, 0xae3ec9]);
      const body = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.3, 2.1), new THREE.MeshLambertMaterial({ color: bodyCol }));
      body.position.y = 1.35;
      body.castShadow = true;
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 2), new THREE.MeshLambertMaterial({ color: 0xdfE6f0 }));
      cab.position.set(2.6, 1, 0);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.15, 2.3), W.mats.dark);
      roof.position.y = 2.55;
      const cv = document.createElement('canvas');
      cv.width = 256; cv.height = 64;
      const cx = cv.getContext('2d');
      cx.fillStyle = '#111418'; cx.fillRect(0, 0, 256, 64);
      cx.fillStyle = '#ffd23e'; cx.font = 'bold 30px Arial'; cx.textAlign = 'center';
      cx.fillText(U.pick(['HOT DOG', 'TACOS', 'BURGER', 'RAMEN']), 128, 44);
      const menuTex = new THREE.CanvasTexture(cv);
      const menu = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8),
        new THREE.MeshBasicMaterial({ map: menuTex, side: THREE.DoubleSide }));
      menu.position.set(-0.3, 2.95, 0);
      const awning = new THREE.Mesh(new THREE.BoxGeometry(3, 0.08, 1.2), new THREE.MeshLambertMaterial({ color: 0xf2f5f8 }));
      awning.position.set(-0.3, 2.5, 1.5);
      awning.rotation.x = 0.35;
      g.add(body, cab, roof, menu, awning);
      for (const wx of [-1.5, 1.5]) {
        const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 10), W.mats.dark);
        wh.rotation.x = Math.PI / 2;
        wh.position.set(wx, 0.42, 1.05);
        g.add(wh);
        const wh2 = wh.clone();
        wh2.position.z = -1.05;
        g.add(wh2);
      }
      g.position.set(x, 0, z);
      g.rotation.y = U.rand(0, Math.PI * 2);
      G.scene.add(g);
      W.addCollider(x - 2.5, z - 2.5, x + 2.5, z + 2.5, 2.6);
    }
  }

  function buildBanners() {
    for (let k = 0; k < 10; k++) {
      const i = 4 + U.randi(0, 2), j = 4 + U.randi(0, 2);
      const cc = W.cellCenter(i, j);
      const side = U.randi(0, 4);
      const off = W.BLOCK / 2 + 0.35;
      let x = cc.x, z = cc.z, ry = 0;
      if (side === 0) { x += off; ry = -Math.PI / 2; }
      else if (side === 1) { x -= off; ry = Math.PI / 2; }
      else if (side === 2) { z += off; ry = Math.PI; }
      else { z -= off; ry = 0; }
      const hgt = U.rand(4.5, 8);
      const t = adTex(U.randi(0, 3));
      const b = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 1.6), new THREE.MeshLambertMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.35, side: THREE.DoubleSide }));
      b.position.set(x, hgt, z);
      b.rotation.y = ry;
      b.rotation.z = U.rand(-0.06, 0.06);
      G.scene.add(b);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.7, 5), W.mats.metal);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(x, hgt + 0.95, z);
      bar.rotation.y = ry;
      G.scene.add(bar);
    }
  }

  function buildPigeons() {
    W.pigeons = [];
    const geo = new THREE.SphereGeometry(0.13, 6, 5);
    const mat = new THREE.MeshLambertMaterial({ color: 0x8b93a1 });
    for (let k = 0; k < 14; k++) {
      const pt = W.randRoadPoint();
      const f = new THREE.Mesh(geo, mat);
      f.scale.set(1, 0.8, 1.35);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.07, 5, 4), mat);
      head.position.set(0, 0.1, 0.12);
      f.add(head);
      f.position.set(pt.x + U.rand(-3, 3), 0.14, pt.z + U.rand(-3, 3));
      f.userData.wt = U.rand(0, 3);
      f.userData.fly = 0;
      G.scene.add(f);
      W.pigeons.push(f);
    }
  }

  function buildSteamVents() {
    W.steam = [];
    const puffGeo = new THREE.SphereGeometry(0.7, 7, 5);
    for (let k = 0; k < 6; k++) {
      const pt = W.randRoadPoint();
      const grate = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 1.1), W.mats.dark);
      grate.position.set(pt.x, 0.07, pt.z);
      G.scene.add(grate);
      for (let m = 0; m < 2; m++) {
        const puff = new THREE.Mesh(puffGeo, new THREE.MeshBasicMaterial({ color: 0xd8dee6, transparent: true, opacity: 0.28, depthWrite: false }));
        puff.position.set(pt.x, 0.6, pt.z);
        puff.userData.steamT = m * 1.6 + U.rand(0, 0.8);
        G.scene.add(puff);
        W.steam.push(puff);
      }
    }
  }

  function buildBlimp() {
    const g = new THREE.Group();
    const env = new THREE.Mesh(new THREE.SphereGeometry(12, 20, 14),
      new THREE.MeshLambertMaterial({ color: 0x9aa3ad }));
    env.scale.set(1, 0.45, 0.45);
    env.castShadow = true;
    const stripe = new THREE.Mesh(new THREE.SphereGeometry(12.05, 20, 14),
      new THREE.MeshBasicMaterial({ color: 0x2f9bff, transparent: true, opacity: 0.85 }));
    stripe.scale.set(1, 0.16, 0.46);
    const gondola = new THREE.Mesh(new THREE.BoxGeometry(5, 1.6, 2), W.mats.dark);
    gondola.position.y = -6;
    const finT = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.4, 4), W.mats.metal);
    finT.position.set(-11, 1.6, 0);
    const finS = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 3), W.mats.metal);
    finS.position.set(-11, 0, 0);
    finS.rotation.z = Math.PI / 2;
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 64;
    const cx = cv.getContext('2d');
    cx.fillStyle = '#0b1622'; cx.fillRect(0, 0, 256, 64);
    cx.fillStyle = '#39c8ff'; cx.font = 'bold 34px Arial'; cx.textAlign = 'center';
    cx.fillText('SHADOW CITY', 128, 44);
    const signTex = new THREE.CanvasTexture(cv);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.5),
      new THREE.MeshBasicMaterial({ map: signTex, transparent: true, side: THREE.DoubleSide }));
    sign.position.y = -0.5;
    g.add(env, stripe, gondola, finT, finS, sign);
    g.position.set(0, 90, -250);
    G.scene.add(g);
    W.blimp = { g, a: 0 };
  }

  function buildAirliner() {
    const g = new THREE.Group();
    const fus = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 26, 10),
      new THREE.MeshLambertMaterial({ color: 0xe8ecf2 }));
    fus.rotation.z = Math.PI / 2;
    const nose = new THREE.Mesh(new THREE.SphereGeometry(1.6, 10, 8),
      new THREE.MeshLambertMaterial({ color: 0xe8ecf2 }));
    nose.position.x = 13;
    const tailC = new THREE.Mesh(new THREE.SphereGeometry(1.6, 10, 8),
      new THREE.MeshLambertMaterial({ color: 0xdde3ea }));
    tailC.position.x = -13;
    const wing = new THREE.Mesh(new THREE.BoxGeometry(6, 0.35, 24), W.mats.metal);
    wing.position.x = 1;
    const tail = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 10), W.mats.metal);
    tail.position.x = -12;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(3.4, 6, 0.3), new THREE.MeshLambertMaterial({ color: 0x2f6fd8 }));
    fin.position.set(-12.5, 3.4, 0);
    const engMat = new THREE.MeshLambertMaterial({ color: 0x8b939c });
    for (const ex of [-6, 6]) {
      const e1 = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 3, 8), engMat);
      e1.rotation.z = Math.PI / 2;
      e1.position.set(0, -1, ex);
      g.add(e1);
    }
    const trailMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false });
    const trail = new THREE.Mesh(new THREE.BoxGeometry(30, 0.12, 0.12), trailMat);
    trail.position.x = -28;
    const trail2 = new THREE.Mesh(new THREE.BoxGeometry(30, 0.12, 0.12), trailMat);
    trail2.position.set(-26, 0, 12);
    const trail3 = new THREE.Mesh(new THREE.BoxGeometry(30, 0.12, 0.12), trailMat);
    trail3.position.set(-26, 0, -12);
    g.add(fus, nose, tailC, wing, tail, fin, trail, trail2, trail3);
    const from = new THREE.Vector3(U.rand(-900, 900), 230, 950);
    const to = new THREE.Vector3(U.rand(-900, 900), 230, -950);
    g.position.copy(from);
    g.lookAt(to);
    G.scene.add(g);
    W.plane = { g, from, to, t: 0, dur: from.distanceTo(to) / 60 };
  }

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
    buildProps();
    for (let i = 0; i < W.GRID; i++) for (let j = 0; j < W.GRID; j++) {
      if (Math.random() < 0.55) {
        const cc = W.cellCenter(i, j);
        streetSign(cc.x + W.BLOCK / 2 + 1.1, cc.z - W.BLOCK / 2 - 1.1);
      }
    }
    buildSmokestacks();
    buildCranes();
    buildMonument();
    buildBlimp();
    buildAirliner();
    buildTrafficLights();
    buildSunGlow();
    buildMoonGlow();
    buildStars();
    buildFireflies();
    buildPuddles();
    buildSteamVents();
    buildBanners();
    buildFoodTrucks();
    buildPigeons();
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

    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x2a6fd8) },
        bottomColor: { value: new THREE.Color(0xbfd8f2) },
        offset: { value: 140 },
        expo: { value: 0.55 }
      },
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 topColor; uniform vec3 bottomColor; uniform float offset; uniform float expo; varying vec3 vP; void main(){ float h = normalize(vP + vec3(0.0, offset, 0.0)).y; gl_FragColor = vec4(mix(bottomColor, topColor, pow(max(h, 0.0), expo)), 1.0); }',
      side: THREE.BackSide, depthWrite: false, fog: false
    });
    W.skyDome = new THREE.Mesh(new THREE.SphereGeometry(1500, 24, 12), skyMat);
    G.scene.add(W.skyDome);

    W.birds = [];
    const birdGeo = new THREE.BufferGeometry();
    birdGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, -0.6, 0.12, -0.25, 0.6, 0.12, -0.25]), 3));
    const birdMat = new THREE.MeshBasicMaterial({ color: 0x1c2026, side: THREE.DoubleSide });
    for (let k = 0; k < 7; k++) {
      const b = new THREE.Mesh(birdGeo, birdMat);
      b.userData.flight = { r: U.rand(70, 180), a: U.rand(0, 6.28), h: U.rand(45, 85), s: U.rand(0.12, 0.3), cx: U.rand(-220, 220), cz: U.rand(-220, 220), ph: U.rand(0, 6.28) };
      G.scene.add(b);
      W.birds.push(b);
    }
  };

  W.applyFogDistance = function () {
    const q = G.settings.quality;
    if (q === 'perf') W.fogFar = 260;
    else if (q === 'hd') W.fogFar = 420;
    else W.fogFar = 620;
  };

  const daySky = new THREE.Color(0x7ec0ee), duskSky = new THREE.Color(0xff8a5a), nightSky = new THREE.Color(0x070b18);
  const tmpC = new THREE.Color(), tmpC2 = new THREE.Color();
  W.skyTop = new THREE.Color(); W.skyBottom = new THREE.Color(); W.skyWhite = new THREE.Color(0xffffff);

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
      G.sfx.rainLoop(R.active);
    }
    if (W.puddles) {
      const po = R.active ? 0.26 + Math.sin(performance.now() / 1000 * 0.8) * 0.05 : 0;
      for (const pd of W.puddles) pd.material.opacity = po;
    }
    if (R.active) {
      tmpC.multiplyScalar(0.55);
      if (Math.random() < dt * 0.06 && G.ui.lightning) {
        G.ui.lightning();
        setTimeout(() => G.sfx.thunder(), U.randi(200, 900));
      }
    }
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
      if (m.isSign) m.m.material.opacity = m.flicker && Math.random() < 0.05 ? 0.15 : 0.25 + nf * 0.65;
      else m.emissiveIntensity = nf * 0.9;
    }
    if (stars) stars.material.opacity = nf * (0.72 + Math.sin(performance.now() / 1000 * 1.7) * 0.18);
    for (const g of lightGlows) g.material.opacity = nf * 0.75;

    if (W.sunDisc) {
      W.sunDisc.position.copy(sun.position).normalize().multiplyScalar(1300);
      W.sunDisc.visible = elev > -0.12;
      W.moonDisc.position.set(-sun.position.x, -sun.position.y, -sun.position.z).normalize().multiplyScalar(1300);
      W.moonDisc.visible = elev < 0.12;
    }
    if (W.sunGlow) {
      W.sunGlow.position.copy(sun.position).normalize().multiplyScalar(1250);
      W.sunGlow.material.opacity = Math.max(0.08, Math.max(0, elev) * 0.9);
      W.sunGlow.visible = elev > -0.1;
    }
    if (W.moonGlow) {
      W.moonGlow.position.set(-sun.position.x, -sun.position.y, -sun.position.z).normalize().multiplyScalar(1250);
      W.moonGlow.material.opacity = Math.max(0, Math.min(0.8, -elev)) * 0.85;
      W.moonGlow.visible = elev < 0.1;
    }
    if (W.fireflies) {
      W.fireflies.material.opacity = nf * 0.95;
      const fa = W.fireflies.geometry.attributes.position.array;
      const fb = W.fireflies.userData.base, ft = performance.now() / 1000;
      for (let k = 0; k < fb.length; k++) {
        fa[k * 3] = fb[k].x + Math.sin(ft * fb[k].sp + fb[k].ph) * 1.6;
        fa[k * 3 + 1] = fb[k].y + Math.sin(ft * fb[k].sp * 1.4 + fb[k].ph * 2) * 0.7;
        fa[k * 3 + 2] = fb[k].z + Math.cos(ft * fb[k].sp * 0.8 + fb[k].ph) * 1.6;
      }
      W.fireflies.geometry.attributes.position.needsUpdate = true;
    }
    if (W.skyDome) {
      W.skyDome.position.copy(G.camera.position);
      W.skyTop.copy(tmpC).multiplyScalar(0.55);
      W.skyBottom.copy(tmpC).lerp(W.skyWhite, 0.4);
      W.skyDome.material.uniforms.topColor.value.copy(W.skyTop);
      W.skyDome.material.uniforms.bottomColor.value.copy(W.skyBottom);
    }
    if (W.birds) {
      const bt = performance.now() / 1000;
      for (const b of W.birds) {
        const f = b.userData.flight;
        f.a += f.s * dt;
        b.position.set(f.cx + Math.cos(f.a) * f.r, f.h + Math.sin(bt * 0.7 + f.ph) * 4, f.cz + Math.sin(f.a) * f.r);
        b.rotation.y = -f.a;
        b.rotation.z = Math.sin(bt * 9 + f.ph) * 0.55;
      }
    }
    if (W.smokes) {
      for (const sm of W.smokes) {
        sm.userData.smokeT = (sm.userData.smokeT + dt * 0.85) % 6;
        const k = sm.userData.smokeT;
        sm.position.y = 8 + k * 2.4;
        sm.scale.setScalar(0.6 + k * 0.35);
        sm.material.opacity = 0.32 * (1 - k / 6);
      }
    }
    if (G.sfx.cricketVol) {
      const pc = G.player && G.player.pos ? W.districtAt(G.player.pos.x, G.player.pos.z) : 'downtown';
      G.sfx.cricketVol(nf * (pc === 'residential' ? 1 : 0.25));
      if (nf > 0.15) G.sfx.crickets(true);
    }
    if (W.fireworksT === undefined) W.fireworksT = 0;
    W.fireworksT -= dt;
    if (nf > 0.6 && W.fireworksT <= 0) {
      W.fireworksT = U.rand(4, 9);
      const nc = W.cellCenter(7, 7);
      const fx = nc.x + U.rand(-30, 30), fz = nc.z + U.rand(-30, 30);
      G.sfx.explode();
      const col = U.pick([0xff5a8a, 0x5ad0ff, 0xffd23e, 0x9a6aff, 0x6aff8a]);
      G.spawnBurst(fx, U.rand(38, 52), fz, col, 14);
      G.spawnBurst(fx, U.rand(36, 50), fz, 0xffffff, 6);
      const flash = new THREE.PointLight(col, 8, 60);
      flash.position.set(fx, 44, fz);
      G.scene.add(flash);
      G.effects.push({ obj: flash, ttl: 0.25, light: true });
    }
    if (W.pigeons) {
      const pp = G.player ? G.player.pos : null;
      const pt2 = performance.now() / 1000;
      for (const pg of W.pigeons) {
        if (pg.userData.fly > 0) {
          pg.userData.fly -= dt;
          pg.position.y = 0.14 + Math.sin((2 - pg.userData.fly) * 4) * 0.4 + (2 - pg.userData.fly) * 2.2;
          if (pg.userData.fly <= 0) {
            pg.position.set(pp.x + U.rand(-25, 25), 0.14, pp.z + U.rand(-25, 25));
            pg.scale.y = 0.8;
          }
        } else if (pp) {
          const pd2 = U.d2(pg.position.x, pg.position.z, pp.x, pp.z);
          if (pd2 < 20) {
            pg.userData.fly = 2;
            pg.scale.y = 1;
            pg.rotation.y = Math.atan2(pp.x - pg.position.x, pp.z - pg.position.z);
          } else {
            pg.userData.wt -= dt;
            if (pg.userData.wt <= 0) { pg.userData.wt = U.rand(1.5, 4); pg.rotation.y = U.rand(0, Math.PI * 2); }
            pg.position.x += Math.sin(pg.rotation.y) * dt * 0.5;
            pg.position.z += Math.cos(pg.rotation.y) * dt * 0.5;
            pg.position.y = 0.14 + Math.abs(Math.sin(pt2 * 6 + pg.userData.wt)) * 0.03;
          }
        }
      }
    }
    if (W.steam) {
      for (const sp of W.steam) {
        sp.userData.steamT = (sp.userData.steamT + dt * 0.7) % 3.2;
        const k = sp.userData.steamT;
        sp.position.y = 0.6 + k * 1.5;
        sp.scale.setScalar(0.5 + k * 0.5);
        sp.material.opacity = 0.28 * (1 - k / 3.2);
      }
    }
    if (W.monumentBeam) W.monumentBeam.material.opacity = nf * 0.16;
    if (nf > 0.5 && Math.random() < dt * 0.05) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 7),
        new THREE.MeshBasicMaterial({ color: 0xeaf4ff, transparent: true, opacity: 0.9, fog: false }));
      const a = U.rand(0, Math.PI * 2);
      st.position.set(Math.cos(a) * 500, U.rand(160, 320), Math.sin(a) * 500);
      st.lookAt(G.camera.position.x, st.position.y - 40, G.camera.position.z);
      G.scene.add(st);
      const dv = G.V3(G.camera.position.x - st.position.x, -40, G.camera.position.z - st.position.z).normalize().multiplyScalar(90);
      G.effects.push({ obj: st, ttl: 0.9, vel: dv });
    }
    if (W.cranes) {
      const ct = performance.now() / 1000;
      for (const cr of W.cranes) cr.arm.rotation.y = Math.sin(ct * 0.12) * 1.8;
    }
    if (W.blimp) {
      W.blimp.a += dt * 0.02;
      W.blimp.g.position.set(Math.cos(W.blimp.a) * 250, 90 + Math.sin(W.blimp.a * 2.3) * 6, Math.sin(W.blimp.a) * 250);
      W.blimp.g.rotation.y = -W.blimp.a - Math.PI / 2;
      W.blimp.g.rotation.z = Math.sin(W.blimp.a * 2.3) * 0.06;
    }
    if (W.plane) {
      W.plane.t += dt;
      if (W.plane.t > W.plane.dur + 20) {
        W.plane.from.set(U.rand(-900, 900), 230, 950);
        W.plane.to.set(U.rand(-900, 900), 230, -950);
        W.plane.t = 0;
        W.plane.dur = W.plane.from.distanceTo(W.plane.to) / 60;
        W.plane.g.position.copy(W.plane.from);
        W.plane.g.lookAt(W.plane.to);
      } else if (W.plane.t < W.plane.dur) {
        const k = W.plane.t / W.plane.dur;
        W.plane.g.position.lerpVectors(W.plane.from, W.plane.to, k);
      }
    }
    if (W.beacons) {
      const bt2 = performance.now() / 1000;
      for (const bc of W.beacons) bc.material.opacity = Math.sin(bt2 * 3 + bc.position.x) > 0 ? 0.9 : 0.12;
    }
    if (W.trafficLights) {
      const cyc = (performance.now() / 1000) % 10;
      const green = cyc < 4.5;
      for (const tl of W.trafficLights) {
        tl.rl.material = green ? tl.mats.redOff : tl.mats.redOn;
        tl.gl.material = green ? tl.mats.greenOn : tl.mats.greenOff;
      }
    }
    if (W.fountains.length) {
      const ft = performance.now() / 1000;
      for (const w of W.fountains) w.position.y = 0.9 + Math.sin(ft * 2.4) * 0.05;
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
