'use strict';
(function () {
  const $ = (id) => document.getElementById(id);

  function initRenderer() {
    const canvas = $('game');
    G.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    G.renderer.setSize(innerWidth, innerHeight);
    G.renderer.outputEncoding = THREE.sRGBEncoding;
    if (THREE.ACESFilmicToneMapping !== undefined) {
      G.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      G.renderer.toneMappingExposure = 1.06;
    }
    G.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    G.clock = new THREE.Clock();
  }

  function populate() {
    G.vehicles.spawnParked(34);
    G.vehicles.spawnTraffic(12);
    for (let k = 0; k < 14; k++) G.spawnPed();
    for (const d of G.world.districts) {
      const c = G.world.cellCenter(U.randi(d.cells[0], d.cells[2]), U.randi(d.cells[1], d.cells[3]));
      G.spawnGang(d.id, c.x, c.z, false);
      G.spawnGang(d.id, c.x + 10, c.z + 6, false);
    }
  }

  let menuAngle = 0;
  function updateCamera(dt) {
    const cam = G.cam, p = G.player;
    if (G.state.screen === 'menu') {
      menuAngle += dt * 0.08;
      G.camera.position.set(Math.cos(menuAngle) * 180, 90, Math.sin(menuAngle) * 180);
      G.camera.lookAt(0, 25, 0);
      return;
    }
    cam.yaw -= G.input.look.x;
    cam.pitch = U.clamp(cam.pitch + G.input.look.y, -0.5, 1.2);
    G.input.look.x = 0; G.input.look.y = 0;

    const target = p.inCar
      ? G.V3(p.inCar.obj.position.x, 2.2, p.inCar.obj.position.z)
      : G.V3(p.pos.x, p.pos.y + 1.7, p.pos.z);
    const dist = p.inCar ? 9.5 : (p.aiming ? 2.6 : 6.5);
    const cp = Math.cos(cam.pitch);
    const dir = G.V3(Math.sin(cam.yaw) * cp, Math.sin(cam.pitch), Math.cos(cam.yaw) * cp);
    const desired = target.clone().sub(dir.clone().multiplyScalar(dist));
    if (desired.y < 0.6) desired.y = 0.6;
    if (cam.shake > 0) {
      desired.x += U.rand(-1, 1) * cam.shake;
      desired.y += U.rand(-1, 1) * cam.shake * 0.5;
      cam.shake = Math.max(0, cam.shake - dt * 2);
    }
    G.camera.position.lerp(desired, 0.35);
    G.camera.lookAt(target);
    const fovT = p.inCar ? 70 + Math.min(14, Math.abs(p.inCar.speed) * 0.45) + (p.inCar.nitro ? 9 : 0) : 70;
    if (Math.abs(G.camera.fov - fovT) > 0.3) {
      G.camera.fov = U.lerp(G.camera.fov, fovT, 0.08);
      G.camera.updateProjectionMatrix();
    }
  }

  function nearestSpecial() {
    const p = G.player;
    let best = null, bd = 25;
    for (const l of G.world.specialLocations) {
      const d = U.d2(p.pos.x, p.pos.z, l.x, l.z);
      if (d < bd) { bd = d; best = l; }
    }
    for (const b of G.eco.businesses) {
      const d = U.d2(p.pos.x, p.pos.z, b.x, b.z);
      if (d < bd) { bd = d; best = { id: '_biz', biz: b }; }
    }
    return best;
  }

  function handleInteraction() {
    if (!G.input.pulse('action')) return;
    const p = G.player;
    if (p.inCar) { G.enterCar(); return; }
    for (const pr of G.cartel.PROPERTIES) {
      if (U.d2(p.pos.x, p.pos.z, pr.x, pr.z) < 64) { G.ui.openPhone('cartel'); return; }
    }
    const sp = nearestSpecial();
    if (sp) {
      if (sp.id === 'gunshop') { G.ui.openPhone('guns'); return; }
      if (sp.id === 'petshop') { G.ui.openPhone('pets'); return; }
      if (sp.id === 'artifact') { G.ui.openPhone('arts'); return; }
      if (sp.id === 'arena') { G.modes.startSurvival(); return; }
      if (sp.id === 'rift') { return; }
      if (sp.id && sp.id.startsWith('race')) { G.ui.openPhone('race'); return; }
      if (sp.id === '_biz') { G.ui.openPhone('biz'); return; }
    }
    G.enterCar();
  }

  let storyMarkerMesh = null, raceRing = null;

  function createHelpers() {
    storyMarkerMesh = G.world.makeMarker(0, 0, 0xffd23e, 'story');
    storyMarkerMesh.obj.visible = false;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(6, 0.5, 10, 32),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.8 }));
    ring.rotation.x = Math.PI / 2;
    ring.visible = false;
    G.scene.add(ring);
    raceRing = ring;
  }

  function updateHelpers(dt) {
    const t = performance.now() / 1000;
    for (const k in G.world.markers) {
      const m = G.world.markers[k];
      m.obj.children[0].rotation.y = t;
      m.obj.children[1].rotation.y = -t * 0.5;
    }
    const sm = G.modes.storyMarker;
    if (sm) {
      storyMarkerMesh.obj.visible = true;
      storyMarkerMesh.obj.position.set(sm.x, 0, sm.z);
    } else storyMarkerMesh.obj.visible = false;

    const R = G.modes.race;
    if (R.active) {
      const cp = R.cps[R.cp];
      raceRing.visible = true;
      raceRing.position.set(cp.x, 2.5, cp.z);
      raceRing.rotation.z = t;
    } else raceRing.visible = false;
  }

  let fpsAcc = 0, fpsN = 0, adaptT = 0, autosaveT = 0, achT = 0;

  function adaptiveRes(dt) {
    fpsAcc += dt; fpsN++;
    adaptT += dt;
    if (adaptT > 3) {
      const fps = fpsN / fpsAcc;
      G.state.fps = fps;
      fpsAcc = 0; fpsN = 0; adaptT = 0;
      const minS = G.settings.upscale ? 0.45 : 0.55;
      if (fps < 26 && G.state.resScale > minS) {
        G.state.resScale = Math.max(minS, G.state.resScale - 0.15);
        G.ui.applySettings();
      } else if (fps > 55 && G.state.resScale < 1) {
        G.state.resScale = Math.min(1, G.state.resScale + 0.1);
        G.ui.applySettings();
      }
    }
  }

  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(G.clock.getDelta(), 0.05);
    if (G.state.screen === 'play' && !G.state.paused && !G.state.wasted) {
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
      handleInteraction();
      updateHelpers(dt);
      G.ui.updateHUD();
      adaptiveRes(dt);
      autosaveT += dt;
      if (autosaveT > 120) { autosaveT = 0; G.save(true); }
      achT += dt;
      if (achT > 5) { achT = 0; G.checkAchievements(); }
      if (!G.settings.removeAds) {
        G.ads.t += dt;
        if (G.ads.t >= 600) G.ui.showAd();
      }
      G.ui.updateAds(dt);
    } else if (G.state.screen === 'play') {
      G.world.updateEnvironment(dt * 0.2);
    }
    updateCamera(dt);
    G.renderer.render(G.scene, G.camera);
  }

  function buildMenu() {
    const box = $('menuBtns');
    const save = G.loadSave();
    box.innerHTML = '';
    const add = (label, fn, small) => {
      const b = document.createElement('button');
      b.textContent = label;
      if (small) b.className = 'small';
      b.onclick = () => { G.sfx.ensure(); G.sfx.ui(); fn(); };
      box.appendChild(b);
    };
    if (save) add('▶ CONTINUER', () => startGame('story', save));
    add('🃏 NOUVELLE PARTIE — HISTOIRE', () => { G.wipeSave(); startGame('story'); });
    add('🌆 FREE ROAM', () => { G.wipeSave(); startGame('free'); }, true);
    add('⚔️ GUERRE DES GANGS', () => { G.wipeSave(); startGame('war'); }, true);
    add('🩸 SURVIE — Arène des Bêtes', () => { G.wipeSave(); startGame('survival'); }, true);
    add('🏁 MODE COURSE', () => { G.wipeSave(); startGame('race'); }, true);
    add('🌀 RIFT — Boss Golem', () => { G.wipeSave(); startGame('rift'); }, true);
    $('menuHint').textContent = ('ontouchstart' in window)
      ? '📱 Mobile : joystick à gauche, glisse à droite pour la caméra, 📱 = téléphone (contrats, achats, modes).'
      : '⌨️ PC : WASD/ZQSD, clic pour capturer la souris, clic gauche tir, droit viser, E voiture, T recorder, TAB téléphone, H medkit, Espace saut.';
    const TIPS = [
      'Vole une voiture avec E pour traverser la ville à toute vitesse.',
      'Les ARTÉFACTS donnent des pouvoirs : cherche la boutique 🔮.',
      'Achète des businesses dans le téléphone 📱 pour un revenu passif.',
      'La radio 📻 change de station avec M en voiture.',
      'Plante, récolte, vends : les clients fidèles de ton cartel paient plus.',
      'Un medkit (H) sauve une vie. Pense à en acheter.',
      'Le mode photo (P) cache l’interface pour de superbes captures.',
      'Garde un œil sur la minimap : les points bleus sont la police.',
      'Les headshots rapportent plus d’XP.',
      'Monte en niveau pour débloquer le Fusil Plasma ★.'
    ];
    const oldTip = $('menuBox').querySelector('.menuTip');
    if (oldTip && oldTip.remove) oldTip.remove();
    const oldVer = $('menuBox').querySelector('.menuVersion');
    if (oldVer && oldVer.remove) oldVer.remove();
    const tip = document.createElement('div');
    tip.className = 'menuTip';
    tip.textContent = '💡 Astuce : ' + U.pick(TIPS);
    $('menuBox').appendChild(tip);
    const ver = document.createElement('div');
    ver.className = 'menuVersion';
    ver.textContent = 'Shadow City v' + G.version + ' — Beauté Ultime';
    $('menuBox').appendChild(ver);
  }

  function startGame(mode, save) {
    if (!save) { G.wipeSave(); G.newGame(); }
    G.state.screen = 'play';
    G.state.mode = mode;
    $('menu').classList.add('hidden');
    $('hud').classList.remove('hidden');
    if ('ontouchstart' in window) $('touch').classList.remove('hidden');
    if (save) G.applySave(save);
    G.modes.setMode(mode);
    G.ui.toast('Bienvenue à SHADOW CITY 🌃');
    G.ui.toast('Ouvre ton 📱 pour les contrats, achats et modes !');
    G.save(true);
  }

  addEventListener('resize', () => {
    G.camera.aspect = innerWidth / innerHeight;
    G.camera.updateProjectionMatrix();
    G.renderer.setSize(innerWidth, innerHeight);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && G.state.screen === 'play') {
      G.save(true);
      G.state.paused = true;
      $('pause').classList.remove('hidden');
    }
  });

  initRenderer();
  G.scene = new THREE.Scene();
  G.camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 2000);
  G.world.build();
  G.initPlayer();
  G.combat.initPlayerCombat();
  G.eco.initLocations();
  G.cartel.init();
  populate();
  createHelpers();
  G.ui.applySettings();
  buildMenu();
  loop();
})();
