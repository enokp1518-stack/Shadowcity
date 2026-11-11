'use strict';
(function () {
  const M = {};
  G.modes = M;

  G.yt = {
    recording: false, points: 0, sessionT: 0, subs: 0, views: 0, videos: 0, perks: [],
    live: false, liveT: 0, livePts: 0,
    toggleRecord() {
      if (G.state.screen !== 'play') return;
      if (!this.recording) {
        this.recording = true; this.points = 0; this.sessionT = 0;
        G.ui.toast('🎥 Enregistrement démarré — fais des trucs légendaires !');
        G.sfx.ui();
      } else this.publish();
    },
    addEvent(pts, label) {
      this.points += pts;
      if (this.live) this.livePts += pts;
      if (label) G.ui.toast('🎥 +' + pts + ' pts : ' + label);
    },
    startLive() {
      if (G.state.screen !== 'play') return;
      if (this.recording) { G.ui.toast('Arrête d\'abord l\'enregistrement !', 'warn'); G.sfx.deny(); return; }
      if (this.live) return;
      this.live = true; this.liveT = 0; this.livePts = 0;
      G.ui.toast('🔴 EN DIRECT ! Les actions légendaires rapportent — stoppe le live depuis le téléphone (onglet YouTubeur)');
      G.sfx.ui();
    },
    stopLive() {
      if (!this.live) return;
      this.live = false;
      const subsGain = Math.floor(this.livePts * U.rand(0.5, 1) + this.liveT * U.rand(0.5, 2));
      const views = Math.floor(this.livePts * 30 + this.liveT * 8);
      const money = Math.floor(this.liveT * (15 + this.subs * 0.002));
      this.views += views;
      this.subs += subsGain;
      this.videos++;
      G.eco.earn(money, true);
      G.ui.toast('📺 Live terminé ! +' + U.fmtSubs(views) + ' vues, +' + U.fmtSubs(subsGain) + ' abonnés, +' + U.fmt(money), 'money');
      G.sfx.levelup();
      G.addXP(40);
      this.liveT = 0; this.livePts = 0;
      this.checkPerks();
    },
    publish() {
      if (!this.recording) return;
      this.recording = false;
      if (this.sessionT < 8 || this.points <= 0) {
        G.ui.toast('Vidéo trop courte ou ennuyeuse — rien de publié', 'warn');
        return;
      }
      const b = G.eco.bonuses();
      const views = Math.floor(this.points * U.rand(25, 70) * (1 + this.subs / 50000));
      const subsGain = Math.floor(views * U.rand(0.02, 0.06) * (this.perks.includes('diamond') ? 2 : 1));
      const money = Math.floor(views * 0.012 * b.money);
      this.views += views;
      this.subs += subsGain;
      this.videos++;
      G.eco.earn(money, true);
      G.ui.toast('📺 Vidéo publiée ! +' + U.fmtSubs(views) + ' vues, +' + U.fmtSubs(subsGain) + ' abonnés, +' + U.fmt(money), 'money');
      G.sfx.levelup();
      G.addXP(30);
      this.checkPerks();
    },
    checkPerks() {
      const s = this.subs;
      const give = (key, cond, msg, fn) => {
        if (cond && !this.perks.includes(key)) {
          this.perks.push(key);
          G.ui.toast('🏆 PALIER YOUTUBE : ' + msg, 'money');
          G.sfx.levelup();
          if (fn) fn();
        }
      };
      give('sponsor', s >= 10000, 'Sponsoring ! +50% de revenus', null);
      give('robotcat', s >= 100000, 'Chat-Robot offert ! Équipe-le dans le téléphone', () => {
        if (!G.eco.petsOwned.includes('robotcat')) { G.eco.petsOwned.push('robotcat'); G.eco.setPet('robotcat'); }
      });
      give('goldenak', s >= 1000000, 'AK Dorée débloquée !', () => G.combat.giveWeapon('goldenak', true));
      give('diamond', s >= 10000000, 'Bouton de Diamant ! Revenus x2, +100 armure', () => { G.player.armor += 100; });
    },
    update(dt) {
      if (this.recording) this.sessionT += dt;
      if (this.live) {
        this.liveT += dt;
        this.livePts += dt * (3 + this.subs * 0.0004);
        if (Math.random() < dt / 20) {
          const don = Math.floor(50 + this.subs * 0.01 * U.rand(20, 100));
          G.eco.earn(don, true);
          G.ui.toast('💰 Don de live : +' + U.fmt(don), 'money');
          G.sfx.cash();
        }
      }
    }
  };

  M.missionIdx = 0;
  M.stageIdx = 0;

  const nearPos = (x, z, r) => Math.sqrt(U.d2(G.player.pos.x, G.player.pos.z, x, z)) < (r || 5);

  M.missions = [
    {
      title: 'Bienvenue à Shadow City',
      stages: [
        { text: 'Rejoins le marqueur jaune (Arsene\'s Guns)', pos: () => G.world.specialLocations.find(l => l.id === 'gunshop'), done: () => nearPos(G.world.specialLocations.find(l => l.id === 'gunshop').x, G.world.specialLocations.find(l => l.id === 'gunshop').z) }
      ],
      reward: 2000, xp: 50
    },
    {
      title: 'Équipe-toi',
      stages: [
        { text: 'Achete une arme chez Arsene (📱 > Armurerie ou sur place)', done: () => Object.keys(G.player.weapons).length > 1 }
      ],
      reward: 500, xp: 50
    },
    {
      title: 'Une bagnole',
      stages: [
        { text: 'Vole n\'importe quelle voiture (bouton 🚗 / E)', done: () => G.stats.carsEntered >= 1 }
      ],
      reward: 500, xp: 50
    },
    {
      title: 'Livraison express',
      stages: [
        { text: 'Livraison aux Docks — suis le marqueur', pos: () => G.world.specialLocations.find(l => l.id === 'arena'), done: () => nearPos(G.world.specialLocations.find(l => l.id === 'arena').x, G.world.specialLocations.find(l => l.id === 'arena').z, 8) }
      ],
      reward: 1500, xp: 80
    },
    {
      title: 'Guet-apens',
      stages: [
        {
          text: 'Élimine les 4 Vipères embusquées !',
          onEnter() {
            const c = G.world.cellCenter(2, 6);
            M.missionThugs = [];
            for (let k = 0; k < 4; k++) M.missionThugs.push(G.spawnGang('residential', c.x + U.rand(-10, 10), c.z + U.rand(-10, 10), false));
            M.missionThugs.forEach(t => t.aggro = true);
          },
          done: () => (M.missionThugs || []).every(t => t.dead)
        }
      ],
      reward: 2500, xp: 120
    },
    {
      title: 'Course de rue',
      stages: [
        { text: 'Gagne une course (marqueur cyan, en voiture)', done: () => G.stats.racesWon >= 1 }
      ],
      reward: 5000, xp: 150
    },
    {
      title: 'Territoire',
      stages: [
        { text: 'Capture 1 quartier (📱 > Guerre des gangs)', done: () => G.stats.captures >= 1 }
      ],
      reward: 8000, xp: 200
    },
    {
      title: 'Vague mortelle',
      stages: [
        { text: 'Survis à 3 vagues à l\'Arène des Bêtes (Docks)', done: () => G.stats.waves >= 3 }
      ],
      reward: 10000, xp: 250
    },
    {
      title: 'Le Rift',
      stages: [
        { text: 'Vaincs le Golem du Rift (Zone Industrielle)', done: () => G.stats.bosses >= 1 }
      ],
      reward: 25000, xp: 400
    },
    {
      title: 'Roi de Shadow City',
      stages: [
        { text: 'Atteins 100K abonnés ET possède le Casino', done: () => G.yt.subs >= 100000 && G.eco.businesses.find(b => b.id === 'casino').owned }
      ],
      reward: 100000, xp: 1000
    }
  ];

  M.storyMarker = null;

  M.updateStory = function () {
    if (M.missionIdx >= M.missions.length) {
      G.ui.setMission('Shadow City est à vous 👑', 'Tous les contrats terminés. Continue ta légende !');
      M.storyMarker = null;
      return;
    }
    const m = M.missions[M.missionIdx];
    const st = m.stages[M.stageIdx];
    if (st.onEnter && !st._entered) { st._entered = true; st.onEnter(); }
    let pos = null;
    if (st.pos) pos = st.pos();
    M.storyMarker = pos;
    G.ui.setMission(m.title, st.text);
    if (st.done()) {
      G.eco.earn(m.reward, true);
      G.addXP(m.xp);
      G.sfx.levelup();
      G.ui.toast('✅ Contrat réussi : ' + m.title + ' (+' + U.fmt(m.reward) + ')', 'money');
      if (G.yt.recording) G.yt.addEvent(80, 'Contrat réussi en direct !');
      M.stageIdx++;
      st._entered = false;
      if (M.stageIdx >= m.stages.length) { M.stageIdx = 0; M.missionIdx++; G.save(true); }
    }
  };

  M.war = { active: false, district: null, needed: 0, kills: 0 };
  M.startWar = function (districtId) {
    const d = G.world.districts.find(x => x.id === districtId);
    if (!d || d.owned) { G.ui.toast('Territoire déjà capturé', 'warn'); return; }
    M.war = { active: true, district: d, needed: 5 + G.player.level * 2, kills: 0 };
    const c = G.world.cellCenter(Math.floor((d.cells[0] + d.cells[2]) / 2), Math.floor((d.cells[1] + d.cells[3]) / 2));
    for (let k = 0; k < M.war.needed; k++) {
      const g = G.spawnGang(d.id, c.x + U.rand(-25, 25), c.z + U.rand(-25, 25), true);
      g.aggro = true;
    }
    G.ui.toast('⚔️ Guerre des gangs : ' + d.name + ' — élimine ' + M.war.needed + ' ' + d.gangName + ' !', 'warn');
    G.sfx.alarm();
  };
  M.updateWar = function () {
    if (!M.war.active) return;
    G.ui.setMission('⚔️ Guerre : ' + M.war.district.name, 'Éliminations : ' + M.war.kills + ' / ' + M.war.needed);
    if (M.war.kills >= M.war.needed) {
      M.war.district.owned = true;
      G.stats.captures++;
      M.war.active = false;
      G.eco.earn(5000, true);
      G.addXP(200);
      G.ui.toast('🏳️ Territoire capturé : ' + M.war.district.name + ' ! Revenu passif activé.', 'money');
      G.sfx.levelup();
      if (G.yt.recording) G.yt.addEvent(300, 'Guerre de territoires en DIRECT !');
      if (G.world.districts.every(d => d.owned)) {
        G.combat.giveWeapon('reaper');
        G.ui.toast('★ FAUCHEUSE ÉCARLATE débloquée — la ville entière est à vous !', 'money');
      }
    }
  };

  M.survival = { active: false, wave: 0, alive: 0, breakT: 0 };
  M.startSurvival = function () {
    const a = G.world.specialLocations.find(l => l.id === 'arena');
    if (!nearPos(a.x, a.z, 10)) { G.ui.toast('Va à l\'Arène des Bêtes (Docks) pour commencer', 'warn'); return; }
    M.survival = { active: true, wave: 0, alive: 0, breakT: 1.5 };
    G.ui.toast('🩸 Survie lancée ! Tiens le plus de vagues possible.', 'warn');
  };
  M.updateSurvival = function (dt) {
    const S = M.survival;
    if (!S.active) return;
    const a = G.world.specialLocations.find(l => l.id === 'arena');
    G.ui.setMission('🩸 Survie — Vague ' + S.wave, 'Ennemis restants : ' + S.alive);
    if (nearPos(a.x, a.z, 60) === false) {
      S.active = false;
      G.ui.toast('Survie terminée — vague ' + S.wave, 'warn');
      return;
    }
    if (S.alive <= 0) {
      S.breakT -= dt;
      if (S.breakT <= 0) {
        if (S.wave > 0) {
          const reward = S.wave * 250;
          G.eco.earn(reward, true);
          G.stats.waves = Math.max(G.stats.waves, S.wave);
          G.ui.toast('✅ Vague ' + S.wave + ' terminée ! +' + U.fmt(reward), 'money');
          if (S.wave % 3 === 0) { G.player.armor += 25; G.ui.toast('🛡️ +25 armure'); }
          if (G.yt.recording) G.yt.addEvent(120, 'Vague ' + S.wave + ' en survie !');
        }
        S.wave++;
        S.breakT = 6;
        const n = 3 + S.wave * 2;
        S.alive = n;
        for (let k = 0; k < n; k++) {
          const kind = S.wave >= 3 && k % 4 === 0 ? 'brute' : S.wave >= 2 && k % 3 === 0 ? 'spitter' : 'hellhound';
          G.spawnCreature(kind, a.x + U.rand(-20, 20), a.z + U.rand(-20, 20), 1 + S.wave * 0.08);
        }
        G.ui.toast('⚠️ Vague ' + S.wave + ' — ' + n + ' créatures !', 'warn');
      }
    }
  };

  M.race = { active: false };
  M.RACES = [
    { name: 'Circuit Downtown', cps: [[5, 3], [5, 6], [3, 6], [3, 3], [5, 3]], reward: 6000 },
    { name: 'Boucle Neon', cps: [[7, 8], [9, 8], [9, 6], [7, 6], [7, 8]], reward: 8000 },
    { name: 'Grand Prix Docks', cps: [[1, 3], [1, 0], [4, 0], [4, 3], [1, 3]], reward: 10000 }
  ];
  M.startRace = function (idx) {
    const p = G.player;
    if (!p.inCar) { G.ui.toast('Monte dans une voiture d\'abord !', 'warn'); return; }
    const R = M.RACES[idx];
    const cps = R.cps.map(c => ({ x: G.world.roadCoord(c[0]), z: G.world.roadCoord(c[1]) }));
    M.race = { active: true, cps, cp: 0, time: 0, reward: R.reward, name: R.name, racers: [], total: cps.length };
    const start = cps[0];
    for (let k = 0; k < 3; k++) {
      const car = G.vehicles.makeCar(k === 0 ? 'sport' : 'muscle', start.x + (k - 1) * 4, start.z - 6, 0, [0xff2d95, 0x00e5ff, 0x7cff4d][k]);
      car.driver = 'race';
      car.race = { cp: 0, finished: false, time: 0 };
      M.race.racers.push(car);
    }
    G.ui.toast('🏁 Course : ' + R.name + ' — passe par les anneaux cyan !', 'warn');
    G.sfx.alarm();
  };
  M.updateRace = function (dt) {
    const R = M.race;
    if (!R.active) return;
    R.time += dt;
    const p = G.player;
    const cp = R.cps[R.cp];
    G.ui.setMission('🏁 ' + R.name, 'Checkpoint ' + (R.cp + 1) + '/' + R.total + ' — ' + R.time.toFixed(1) + 's');
    for (const car of R.racers) {
      if (car.race.finished) continue;
      const target = R.cps[car.race.cp];
      const dx = target.x - car.obj.position.x, dz = target.z - car.obj.position.z;
      const d = Math.hypot(dx, dz);
      if (d < 9) {
        car.race.cp++;
        if (car.race.cp >= R.total) { car.race.finished = true; car.race.time = R.time; }
      } else {
        const want = Math.atan2(dx, dz);
        let dy = want - car.yaw;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        car.yaw += U.clamp(dy, -2 * dt, 2 * dt);
        const playerProgress = R.cp / R.total;
        const aiProgress = car.race.cp / R.total;
        const rubber = U.clamp(0.8 + (playerProgress - aiProgress) * 0.5, 0.7, 1.05);
        car.speed = U.lerp(car.speed, car.def.max * rubber, dt);
        const nx = car.obj.position.x + Math.sin(car.yaw) * car.speed * dt;
        const nz = car.obj.position.z + Math.cos(car.yaw) * car.speed * dt;
        const [cx, cz] = G.world.collideCircle(nx, nz, 1.7);
        car.obj.position.x = cx; car.obj.position.z = cz;
        car.obj.rotation.y = car.yaw;
        for (const w of car.wheels) w.rotation.x += car.speed * dt * 2.4;
      }
    }
    if (p.inCar && Math.sqrt(U.d2(p.pos.x, p.pos.z, cp.x, cp.z)) < 10) {
      R.cp++;
      G.sfx.ui();
      if (R.cp >= R.total) {
        R.active = false;
        let rank = 1;
        for (const car of R.racers) if (car.race.finished) rank++;
        const gains = [R.reward, Math.floor(R.reward * 0.5), Math.floor(R.reward * 0.2), 500];
        const gain = gains[Math.min(rank - 1, 3)];
        G.eco.earn(gain, true);
        G.addXP(100);
        if (rank === 1) { G.stats.racesWon++; G.ui.toast('🏆 1er ! +' + U.fmt(gain), 'money'); }
        else G.ui.toast('Arrivé ' + rank + 'e. +' + U.fmt(gain), 'money');
        if (G.yt.recording) G.yt.addEvent(rank === 1 ? 250 : 100, rank === 1 ? 'VICTOIRE en course !' : 'Course épique !');
        for (const car of R.racers) { car.driver = 'ai'; car.race = null; car.ai = { axis: 'x', dir: 1, laneOff: 3.5, turnT: 5 }; }
      }
    }
  };

  M.taxi = { active: false };
  M.startTaxi = function () {
    const p = G.player;
    if (!p.inCar || p.inCar.type !== 'taxi') { G.ui.toast("Prends un taxi d'abord ! (🚖)", 'warn'); return; }
    const px = G.world.roadCoord(U.randi(0, G.world.GRID)), pz = G.world.roadCoord(U.randi(0, G.world.GRID));
    M.taxi = { active: true, state: 'pickup', px, pz, dx: 0, dz: 0, startDist: 0 };
    G.ui.toast('🚕 Course taxi : va chercher le client (marqueur jaune)');
    G.sfx.ui();
  };
  M.updateTaxi = function () {
    const T = M.taxi;
    if (!T.active) return;
    const p = G.player;
    if (!p.inCar || p.inCar.type !== 'taxi') {
      T.active = false;
      M.storyMarker = null;
      G.ui.toast('Course taxi annulée — tu as quitté le taxi', 'warn');
      return;
    }
    if (T.state === 'pickup') {
      G.ui.setMission('🚕 Taxi — récupérer le client', Math.floor(Math.sqrt(U.d2(p.pos.x, p.pos.z, T.px, T.pz))) + ' m');
      M.storyMarker = { x: T.px, z: T.pz };
      if (Math.sqrt(U.d2(p.pos.x, p.pos.z, T.px, T.pz)) < 8) {
        T.state = 'dropoff'; T.dx = G.world.roadCoord(U.randi(0, G.world.GRID)); T.dz = G.world.roadCoord(U.randi(0, G.world.GRID));
        T.startDist = Math.sqrt(U.d2(p.pos.x, p.pos.z, T.dx, T.dz));
        G.ui.toast('🧍 Client à bord ! Direction la destination (marqueur jaune).');
        G.sfx.ui();
      }
    } else {
      G.ui.setMission('🚕 Taxi — déposer le client', Math.floor(Math.sqrt(U.d2(p.pos.x, p.pos.z, T.dx, T.dz))) + ' m');
      M.storyMarker = { x: T.dx, z: T.dz };
      if (Math.sqrt(U.d2(p.pos.x, p.pos.z, T.dx, T.dz)) < 8) {
        const fare = Math.floor(100 + T.startDist * 0.5);
        G.eco.earn(fare, true);
        G.addXP(20);
        G.ui.toast('🚕 Course terminée ! +' + U.fmt(fare), 'money');
        G.sfx.cash();
        if (G.yt.recording) G.yt.addEvent(40, 'Course de taxi réussie !');
        T.active = false;
        M.storyMarker = null;
      }
    }
  };

  M.rift = { active: false };
  M.enterRift = function () {
    if (M.rift.active) return;
    const r = G.world.specialLocations.find(l => l.id === 'rift');
    if (!nearPos(r.x, r.z, 10)) return;
    M.rift.active = true;
    M.boss = G.spawnBoss(r.x + 10, r.z + 10);
    G.ui.toast('🌀 Le Golem du Rift apparaît !', 'warn');
    G.sfx.alarm();
    G.cam.shake = 0.8;
  };
  M.updateRift = function () {};

  M.onBossDead = function () {
    M.rift.active = false;
    G.stats.bosses++;
    G.eco.earn(30000, true);
    G.combat.giveWeapon('voidcannon', true);
    G.ui.toast('★ CANON DU VIDE récupéré ! +30 000$', 'money');
    if (G.yt.recording) G.yt.addEvent(600, 'BOSS DU RIFT vaincu en live !!');
  };
  M.setMode = function (mode) {
    G.state.mode = mode;
    if (mode === 'survival') {
      const a = G.world.specialLocations.find(l => l.id === 'arena');
      G.player.pos.set(a.x + 8, 0, a.z + 8);
      setTimeout(() => M.startSurvival(), 800);
    } else if (mode === 'rift') {
      const r = G.world.specialLocations.find(l => l.id === 'rift');
      G.player.pos.set(r.x + 6, 0, r.z + 6);
    } else if (mode === 'race') {
      const r = G.world.specialLocations.find(l => l.id === 'race1');
      G.player.pos.set(r.x + 4, 0, r.z + 6);
      const car = G.vehicles.makeCar('sport', r.x, r.z, 0, 0xffd23e);
      setTimeout(() => { if (!G.player.inCar) { G.enterCarAt(car); } }, 300);
    } else if (mode === 'war') {
      setTimeout(() => G.ui.openPhone('war'), 600);
    }
  };

  G.enterCarAt = function (car) {
    if (G.player.inCar || car.wrecked) return;
    G.player.inCar = car;
    car.driver = 'player';
    car.ai = null;
    G.sfx.engine(true);
  };

  M.update = function (dt) {
    if (G.state.screen !== 'play' || G.state.paused || G.state.wasted) return;
    M.updateStory();
    M.updateWar();
    M.updateSurvival(dt);
    M.updateRace(dt);
    M.updateTaxi();
    M.enterRift();
    M.updateRift(dt);
    G.yt.update(dt);
  };
})();
