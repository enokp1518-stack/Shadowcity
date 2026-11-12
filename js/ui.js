'use strict';
(function () {
  const UI = {};
  G.ui = UI;
  const $ = (id) => document.getElementById(id);

  let toastCount = 0;
  UI.toast = function (msg, cls) {
    const box = $('toasts');
    const t = document.createElement('div');
    t.className = 'toast' + (cls ? ' ' + cls : '');
    t.textContent = msg;
    box.appendChild(t);
    toastCount++;
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; }, 2600);
    setTimeout(() => { t.remove(); toastCount--; }, 3100);
    while (box.children.length > 4) box.firstChild.remove();
  };

  UI.lightning = function () {
    const v = $('vignette');
    v.style.boxShadow = 'inset 0 0 260px rgba(220,230,255,.95)';
    setTimeout(() => { v.style.boxShadow = 'inset 0 0 120px rgba(0,0,0,.55)'; }, 120);
  };

  UI.flash = function () {
    $('vignette').style.boxShadow = 'inset 0 0 160px rgba(255,0,40,.75)';
    setTimeout(() => { $('vignette').style.boxShadow = 'inset 0 0 120px rgba(0,0,0,.55)'; }, 180);
  };

  UI.bigMsg = function (txt, money) {
    const b = $('bigMsg');
    b.textContent = txt;
    b.className = money ? 'money' : '';
    b.classList.remove('hidden');
  };
  UI.hideBig = () => $('bigMsg').classList.add('hidden');

  UI.setMission = function (title, text) {
    $('missionTitle').textContent = title;
    $('missionText').textContent = text;
  };

  let curTab = 'missions';
  const TABS = [
    ['missions', '📋 Contrats'], ['map', '🗺️ Carte'], ['guns', '🔫 Armurerie'],
    ['pets', '🐾 Animaux'], ['arts', '🔮 Artefacts'], ['biz', '🏢 Business'], ['jobs', '💼 Jobs'], ['quests', '❓ Quêtes'], ['cartel', '📦 Cartel'],
    ['yt', '📺 YouTube'], ['war', '⚔️ Gangs'], ['race', '🏁 Courses'], ['casino', '🎰 Casino'],
    ['settings', '⚙️ Réglages']
  ];

  const ADS = [
    { e: '🌃', t: 'Shadow City: Origins', d: 'Le prequel arrive bientôt...' },
    { e: '🚗', t: 'Turbo Garage', d: 'Tuning et nitro pour ta caisse !' },
    { e: '🍔', t: 'Burger Néon', d: 'Le nouveau Double Void Burger.' },
    { e: '💎', t: 'Gem Rush', d: 'Le jeu de puzzle n°1 de la ville !' },
    { e: '🛡️', t: 'ShadowGuard', d: "Assurance : couvre tes dégâts de voiture." }
  ];

  UI.showAd = function () {
    if (G.settings.removeAds || G.ads.showing) return;
    G.ads.showing = true;
    G.ads.t = 0;
    G.ads.skipT = 5;
    G.state.paused = true;
    const ad = U.pick(ADS);
    $('adContent').innerHTML = `<div class="adEmoji">${ad.e}</div><div class="adTitle">${ad.t}</div><div class="adText">${ad.d}</div>`;
    const skip = $('adSkip');
    skip.disabled = true;
    skip.textContent = 'Passer dans 5s...';
    $('adOverlay').classList.remove('hidden');
    G.sfx.ui();
  };

  UI.closeAd = function () {
    if (!G.ads.showing) return;
    G.ads.showing = false;
    G.ads.t = 0;
    $('adOverlay').classList.add('hidden');
    if ($('phone').classList.contains('hidden') && $('pause').classList.contains('hidden')) G.state.paused = false;
    G.sfx.ui();
  };

  UI.updateAds = function (dt) {
    if (!G.ads.showing) return;
    G.ads.skipT -= dt;
    const skip = $('adSkip');
    if (G.ads.skipT > 0) skip.textContent = 'Passer dans ' + Math.ceil(G.ads.skipT) + 's...';
    else if (skip.disabled) { skip.disabled = false; skip.textContent = 'Passer la pub ⏭'; }
  };

  $('adSkip').addEventListener('click', () => UI.closeAd());
  $('adRemove').addEventListener('click', () => { $('payOverlay').classList.remove('hidden'); G.sfx.ui(); });
  $('payCancel').addEventListener('click', () => { $('payOverlay').classList.add('hidden'); G.sfx.ui(); });
  $('payConfirm').addEventListener('click', () => {
    G.settings.removeAds = true;
    G.save(true);
    $('payOverlay').classList.add('hidden');
    UI.closeAd();
    G.ui.toast('✨ Pubs supprimées ! Merci pour ton soutien 💛', 'money');
    G.sfx.levelup();
  });

  UI.togglePhone = function () {
    if (G.state.screen !== 'play') return;
    if ($('phone').classList.contains('hidden')) UI.openPhone();
    else UI.closePhone();
  };
  UI.openPhone = function (tab) {
    if (G.state.screen !== 'play') return;
    $('phone').classList.remove('hidden');
    G.state.paused = true;
    if (tab) curTab = tab;
    UI.refreshPhone();
    G.sfx.ui();
  };
  UI.closePhone = function () {
    $('phone').classList.add('hidden');
    G.state.paused = false;
    G.sfx.ui();
  };

  function row(name, desc, btnLabel, action, opts) {
    opts = opts || {};
    return `<div class="row"><div class="info"><div class="name">${opts.ex ? '<span class="ex">' + name + '</span>' : name}</div><div class="desc">${desc}</div></div><button data-a="${action}" ${opts.dis ? 'disabled' : ''} class="${opts.cls || ''}">${btnLabel}</button></div>`;
  }

  function row2(name, desc, b1, b2, opts) {
    opts = opts || {};
    return `<div class="row"><div class="info"><div class="name">${opts.ex ? '<span class="ex">' + name + '</span>' : name}</div><div class="desc">${desc}</div></div><div style="display:flex;gap:5px"><button data-a="${b1.a}" ${b1.dis ? 'disabled' : ''} class="${b1.cls || ''}">${b1.l}</button>${b2 ? `<button data-a="${b2.a}" ${b2.dis ? 'disabled' : ''} class="${b2.cls || ''}">${b2.l}</button>` : ''}</div></div>`;
  }

  UI.refreshPhone = function () {
    const tabsEl = $('phoneTabs');
    tabsEl.innerHTML = TABS.map(t => `<button data-tab="${t[0]}" class="${t[0] === curTab ? 'on' : ''}">${t[1]}</button>`).join('');
    const c = $('phoneContent');
    const p = G.player;
    const money = `<div class="secTitle">Solde : ${U.fmt(p.money)} — Niv. ${p.level} — ${U.fmtSubs(G.yt.subs)} abonnés</div>`;

    if (curTab === 'missions') {
      let html = money;
      const idx = G.modes.missionIdx;
      if (idx < G.modes.missions.length) {
        const m = G.modes.missions[idx];
        html += `<div class="secTitle">Contrat actuel</div>`;
        html += row('📋 ' + m.title, m.stages[G.modes.stageIdx].text, 'En cours', 'noop', { dis: true, cls: 'green' });
      } else html += row('👑 Légende urbaine', 'Tous les contrats sont terminés !', 'Fini', 'noop', { dis: true, cls: 'gold' });
      html += `<div class="secTitle">Actions rapides</div>`;
      html += row('🧪 Medkit (' + p.medkits + ')', 'Restaure 50 PV immédiatement — 150$', 'Acheter', 'medkit');
      html += row('🎥 Caméra', G.yt.recording ? 'Enregistrement en cours... (' + Math.floor(G.yt.sessionT) + 's, ' + G.yt.points + ' pts)' : 'Filme tes exploits et publie pour gagner des abonnés', G.yt.recording ? 'Stop & publier' : 'Démarrer REC', 'record', { cls: G.yt.recording ? 'red' : '' });
      html += `<div class="secTitle">Statistiques</div>`;
      const inTaxi = p.inCar && p.inCar.type === 'taxi';
      html += row('🚚 Mission taxi', inTaxi ? 'Démarre une course : récupère un client et dépose-le' : "Nécessite d'être au volant d'un taxi", 'Démarrer', 'taxi', { dis: !inTaxi, cls: inTaxi ? 'gold' : '' });
      html += `<div class="secTitle">Succès (${G.state.achievements.length}/${G.ACHIEVEMENTS.length})</div>`;
      for (const a of G.ACHIEVEMENTS) {
        const done = G.state.achievements.includes(a.id);
        html += row((done ? '🏆 ' : '🔒 ') + a.name, a.desc + ' — Récompense : ' + U.fmt(a.reward), done ? '✓' : 'À faire', 'noop', { dis: true, cls: done ? 'gold' : '' });
      }
      c.innerHTML = html;
    }

    if (curTab === 'map') {
      let html = money + '<div class="secTitle">Quartiers & territoires</div>';
      for (const d of G.world.districts) {
        html += row((d.owned ? '🏳️' : '⚔️') + ' ' + d.name,
          d.owned ? 'Capturé — revenu passif actif' : 'Contrôlé par ' + d.gangName,
          d.owned ? 'Capitale' : 'Attaquer', 'war:' + d.id, { cls: d.owned ? '' : 'red' });
      }
      html += '<div class="secTitle">Lieux importants</div>';
      for (const l of G.world.specialLocations) {
        const d = Math.sqrt(U.d2(p.pos.x, p.pos.z, l.x, l.z));
        html += `<div class="row"><div class="info"><div class="name">${l.name}</div><div class="desc">À ${Math.floor(d)} m</div></div></div>`;
      }
      c.innerHTML = html;
    }

    if (curTab === 'guns') {
      let html = money + '<div class="secTitle">Arsenal d\'Arsene</div>';
      for (const id in G.combat.WEAPONS) {
        const w = G.combat.WEAPONS[id];
        const owned = p.weapons[id];
        if (owned) {
          const isCur = p.cur === id;
          html += row2((w.exclusive ? '★ ' : '') + w.name, w.desc + ' — Munitions : ' + slotAmmo(id) + ' / ' + slotReserve(id),
            { l: isCur ? '✓ En main' : 'Équiper', a: 'equip:' + id, dis: isCur, cls: isCur ? 'green' : '' },
            w.type === 'melee' ? null : { l: '+ Mun ' + U.fmt(w.ammoPrice), a: 'ammo:' + id, cls: 'gold' },
            { ex: w.exclusive });
        } else {
          html += row(w.name, w.desc + (w.unlock ? ' — 🔒 ' + w.unlock : ''), U.fmt(w.price), 'buygun:' + id, { ex: w.exclusive, dis: !!w.unlock });
        }
      }
      c.innerHTML = html;
    }

    if (curTab === 'pets') {
      let html = money + '<div class="secTitle">Compagnons (1 actif)</div>';
      for (const id in E_PETS()) {
        const pet = E_PETS()[id];
        const owned = G.eco.petsOwned.includes(id);
        const active = G.eco.activePet === id;
        if (owned) html += row(pet.name, pet.desc + ' — Bonus : ' + pet.bonus, active ? '✓ Actif' : 'Activer', 'setpet:' + id, { dis: active, cls: 'green' });
        else html += row(pet.name, pet.desc + (pet.unlock ? ' — 🔒 ' + pet.unlock : ''), pet.price ? U.fmt(pet.price) : 'Exclusif', 'buypet:' + id, { dis: !!pet.unlock });
      }
      c.innerHTML = html;
    }

    if (curTab === 'arts') {
      let html = money + `<div class="secTitle">Équipés (${G.eco.equipped.length}/3) — touche pour équiper</div>`;
      for (const id in G.eco.ARTIFACTS) {
        const a = G.eco.ARTIFACTS[id];
        const owned = G.eco.artifactsOwned.includes(id);
        const eq = G.eco.equipped.includes(id);
        if (owned) html += row(a.name, a.desc, eq ? '✓ Équipé' : 'Équiper', 'art:' + id, { cls: eq ? 'green' : '' });
        else html += row(a.name, a.desc, U.fmt(a.price), 'buyart:' + id);
      }
      c.innerHTML = html;
    }

    if (curTab === 'biz') {
      let html = money + '<div class="secTitle">Empire commercial</div>';
      for (const b of G.eco.businesses) {
        if (b.owned) {
          const lvl = b.level || 1;
          const upCost = Math.floor(b.price * 0.6 * lvl);
          html += row2('🏢 ' + b.name + ' (Niv. ' + lvl + '/3)', `Revenu : ${U.fmt(G.eco.bizIncome(b))}/min — En caisse : ${U.fmt(b.stored)}`,
            { l: 'Encaisser', a: 'collect:' + b.id, dis: b.stored < 1, cls: 'green' },
            lvl >= 3 ? null : { l: '🔧 Améliorer ' + U.fmt(upCost), a: 'upgradebiz:' + b.id, cls: 'gold' });
        } else {
          html += row('🏢 ' + b.name, b.desc + ` — Revenu : ${U.fmt(b.income)}/min`, U.fmt(b.price), 'buybiz:' + b.id);
        }
      }
      html += row('💰 Tout encaisser', 'Récupère la caisse de tous tes business', 'Collecter', 'collectall', { cls: 'gold' });
      c.innerHTML = html;
    }

    if (curTab === 'jobs') {
      let html = money + '<div class="secTitle">Petits boulots</div>';
      for (const id in G.jobs.JOBS) {
        const j = G.jobs.JOBS[id];
        const isActive = G.jobs.active && G.jobs.active.type === id;
        html += row(j.name, j.desc + ' — Paie : ' + U.fmt(j.pay) + ' + bonus de niveau', isActive ? 'En cours' : 'Démarrer', 'job:' + id, { dis: !!G.jobs.active, cls: isActive ? 'green' : 'gold' });
      }
      html += '<div class="secTitle">Shifts dans tes business</div>';
      const owned = G.eco.businesses.filter(b => b.owned);
      if (owned.length === 0) html += row('💼 Aucun business', 'Achète un business (onglet Business) pour y travailler', '—', 'noop', { dis: true });
      else for (const b of owned) html += row('💼 ' + b.name, 'Shift de 20s sur place — Paie : ' + U.fmt(Math.floor(G.eco.bizIncome(b) * 1.5)), 'Travailler', 'workshift:' + b.id, { dis: !!G.jobs.active, cls: 'gold' });
      if (G.jobs.active) html += row('⏹ Job en cours : ' + G.jobs.active.def.name, 'Étape ' + (G.jobs.active.step + 1) + '/' + G.jobs.active.total + (G.jobs.active.stage === 'vehicle' ? ' — va chercher le véhicule' : G.jobs.active.stage === 'shift' ? ' — reste sur place' : ''), 'Annuler', 'canceljob', { cls: 'red' });
      html += `<div class="row"><div class="info"><div class="desc">Jobs terminés : ${G.jobs.done}</div></div></div>`;
      c.innerHTML = html;
    }

    if (curTab === 'quests') {
      let html = money + '<div class="secTitle">Requêtes des habitants</div>';
      if (G.quests.active) {
        const o = G.quests.active;
        html += row('❓ ' + o.title, o.desc + ' — Récompense : ' + U.fmt(o.reward) + ' + ' + o.xp + ' XP', 'En cours', 'noop', { dis: true, cls: 'green' });
      } else if (G.quests.offer) {
        const o = G.quests.offer;
        html += row('💬 ' + o.title, o.desc + ' — Récompense : ' + U.fmt(o.reward) + ' + ' + o.xp + ' XP — expire dans ' + Math.ceil(o.t) + 's', 'Accepter', 'questaccept', { cls: 'gold' });
        html += row('🙊 Tu préfères ignorer ?', 'L\'habitant repartira et reviendra plus tard', 'Refuser', 'questdecline', { cls: 'red' });
      } else {
        html += row("💬 Personne pour l'instant", 'Promène-toi en ville : un habitant (point violet sur la minimap) aura une requête', '—', 'noop', { dis: true });
      }
      html += `<div class="row"><div class="info"><div class="desc">Quêtes réussies : ${G.quests.done}</div></div></div>`;
      c.innerHTML = html;
    }

    if (curTab === 'cartel') {
      c.innerHTML = money + G.cartel.ui();
    }

    if (curTab === 'yt') {
      const s = G.yt.subs;
      let html = money;
      html += `<div class="secTitle">Chaîne "ShadowTV" — ${U.fmtSubs(s)} abonnés • ${U.fmtSubs(G.yt.views)} vues • ${G.yt.videos} vidéos</div>`;
      html += row('🎥 Caméra', G.yt.recording ? `REC... ${Math.floor(G.yt.sessionT)}s — ${G.yt.points} points de contenu` : 'Filme kills, courses, guerres et explosions pour du contenu', G.yt.recording ? 'Stop & publier' : 'Démarrer REC', 'record', { cls: G.yt.recording ? 'red' : '' });
      html += row('🔴 Live ShadowTV', G.yt.live ? `EN DIRECT — ${Math.floor(G.yt.liveT)}s • ${Math.floor(G.yt.livePts)} pts d'audience • dons en temps réel` : 'Lance un live : dons + abonnés en temps réel, tes exploits boostent l\'audience', G.yt.live ? 'Stop le live' : 'Démarrer le live', 'live', { cls: G.yt.live ? 'red' : 'gold' });
      html += `<div class="secTitle">Paliers</div>`;
      html += row('🤝 Sponsoring', '+50% de revenus', s >= 10000 ? '✓ 10K' : '10K abonnés', 'noop', { dis: true, cls: s >= 10000 ? 'green' : '' });
      html += row('🤖 Chat-Robot', 'Animal offert + +10% revenus', s >= 100000 ? '✓ 100K' : '100K abonnés', 'noop', { dis: true, cls: s >= 100000 ? 'green' : '' });
      html += row('★ AK Dorée', 'Arme exclusive des stars', s >= 1000000 ? '✓ 1M' : '1M abonnés', 'noop', { dis: true, cls: s >= 1000000 ? 'green' : '' });
      html += row('💎 Bouton de Diamant', 'Revenus x2 + 100 armure', s >= 10000000 ? '✓ 10M' : '10M abonnés', 'noop', { dis: true, cls: s >= 10000000 ? 'green' : '' });
      html += `<div class="secTitle">Revenu passif</div>`;
      html += `<div class="row"><div class="info"><div class="desc">Publicité : ${U.fmt(s * 0.002)}/min grâce à tes abonnés</div></div></div>`;
      c.innerHTML = html;
    }

    if (curTab === 'war') {
      let html = money + '<div class="secTitle">Guerre des gangs</div>';
      for (const d of G.world.districts) {
        html += row((d.owned ? '🏳️ ' : '⚔️ ') + d.name,
          d.owned ? 'Territoire capturé — revenu passif' : `Contrôlé par ${d.gangName} — capture pour revenu passif`,
          d.owned ? 'Conquis' : 'Attaquer', 'war:' + d.id, { cls: d.owned ? '' : 'red', dis: d.owned });
      }
      html += `<div class="secTitle">Police</div>`;
      html += row('🚨 Niveau de recherche : ' + p.wanted, 'Sème la police ou soudoie-la', 'Soudoyer ' + U.fmt(300 * p.wanted), 'bribe', { dis: p.wanted <= 0 });
      c.innerHTML = html;
    }

    if (curTab === 'race') {
      let html = money + '<div class="secTitle">Courses de rue (en voiture !)</div>';
      M_RACES().forEach((r, i) => {
        html += row('🏁 ' + r.name, `${r.cps.length} checkpoints — 1er : ${U.fmt(r.reward)}`, 'Participer', 'race:' + i, { cls: 'gold' });
      });
      c.innerHTML = html;
    }

    if (curTab === 'casino') {
      let html = money + '<div class="secTitle">🎰 Casino Lucky Main — Machines à sous</div>';
      html += `<div id="slotRow" class="slotRow"><span>🍒</span><span>🍋</span><span>🔔</span></div>`;
      html += row('Mise 100$', 'Petite mise, gros rêves', 'Jouer', 'slot:100');
      html += row('Mise 500$', 'Pour les joueurs sérieux', 'Jouer', 'slot:500', { cls: 'gold' });
      html += row('Mise 1000$', 'High roller only', 'Jouer', 'slot:1000', { cls: 'red' });
      html += `<div class="row"><div class="info"><div class="desc">Gains : 7️⃣×3 ×20 • ⭐×3 ×10 • 🔔×3 ×6 • 🍋×3 ×4 • 🍒×3 ×3 • paire ×1,5</div></div></div>`;
      c.innerHTML = html;
    }

    if (curTab === 'settings') {
      const s = G.settings;
      let html = '<div class="secTitle">Graphismes</div>';
      html += row('🖥️ Qualité', 'Perf (fluide) • HD • Ultra 4K (mobiles puissants)', { perf: 'Perf', hd: 'HD', ultra: 'Ultra 4K' }[s.quality], 'quality', { cls: 'gold' });
      html += row('🌗 Ombres', 'Ombres dynamiques (Plus beau, plus gourmand)', s.shadows ? 'ON' : 'OFF', 'shadows', { cls: s.shadows ? 'green' : '' });
      html += row('📽️ SC-Upscale (DLSS)', 'Rendu intelligent : résolution interne adaptative + netteté/contraste améliorés — fluide et beau', s.upscale ? 'ON' : 'OFF', 'upscale', { cls: s.upscale ? 'green' : '' });
      html += row('📈 Compteur FPS', 'Affiche les performances en temps réel', s.fps ? 'ON' : 'OFF', 'fps', { cls: s.fps ? 'green' : '' });
      html += row('📷 Mode photo', 'Masque l’interface pour de superbes captures — touche P', G.state.photoMode ? 'Quitter' : 'Activer', 'photo', { cls: 'gold' });
      html += '<div class="secTitle">Audio & contrôles</div>';
      html += row('🔊 Son', 'Effets sonores', s.sound ? 'ON' : 'OFF', 'sound', { cls: s.sound ? 'green' : '' });
      html += row('🖱️ Sensibilité', 'Caméra / visée : ' + s.sens.toFixed(1) + 'x', '+ / −', 'sens');
      html += row('👕 Tenue', 'Change la couleur de ta tenue', 'Changer', 'outfit', { cls: 'gold' });
      html += row('📻 Radio', 'Shadow FM • Boom Bap 103 • Nuit Étoilée • Voltage Rock — touche M (en voiture)', 'Station suivante', 'radio', { cls: 'gold' });
      html += '<div class="secTitle">💳 Portefeuille créateur</div>';
      html += row('⭐ Premium — 5€', 'Supprime toutes les pubs pour toujours — paiement PayPal', 'Payer 5€', 'paypal5', { cls: 'gold' });
      if (G.settings.removeAds) html += row('✅ Premium actif', 'Merci pour ton soutien !', '—', 'noop', { dis: true, cls: 'green' });
      else html += row("🔓 J'ai payé — Activer", 'Après ton paiement PayPal, active ton Premium ici', 'Activer', 'premiumUnlock', { cls: 'green' });
      html += row('💛 Soutenir le dev', 'Don libre — merci !', 'Donner', 'paypaldon', { cls: 'gold' });
      html += '<div class="secTitle">Sauvegarde</div>';
      html += row('💾 Sauvegarder', 'Ta progression est stockée sur cet appareil', 'Sauvegarder', 'save', { cls: 'green' });
      html += row('🗑️ Nouvelle partie', 'Efface la sauvegarde et recommence à zéro', 'Tout effacer', 'wipe', { cls: 'red' });
      c.innerHTML = html;
    }
  };

  function E_PETS() { return G.eco.PETS; }
  function M_RACES() { return G.modes.RACES; }
  function slotAmmo(id) { const s = G.player.weapons[id]; return s ? (s.ammo === Infinity ? '∞' : s.ammo) : 0; }
  function slotReserve(id) { const s = G.player.weapons[id]; return s ? (s.reserve === Infinity ? '∞' : s.reserve) : 0; }

  $('phoneTabs').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    curTab = b.dataset.tab;
    UI.refreshPhone();
    G.sfx.ui();
  });
  $('phoneContent').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-a]');
    if (!b || b.disabled) return;
    const parts = b.dataset.a.split(':');
    phoneAction(parts[0], parts[1], parts[2]);
  });
  $('phoneClose').addEventListener('click', () => UI.closePhone());

  function phoneAction(act, arg, arg2) {
    G.sfx.ui();
    if (act === 'cx') {
      G.cartel.action(arg, arg2);
      UI.refreshPhone();
      return;
    }
    switch (act) {
      case 'medkit': G.eco.buyMedkit(); break;
      case 'record': G.yt.toggleRecord(); break;
      case 'buygun': G.eco.buyWeapon(arg); break;
      case 'equip': G.player.cur = arg; G.player.reloadT = 0; G.ui.toast('🔫 ' + G.combat.WEAPONS[arg].name + ' en main'); break;
      case 'ammo': G.eco.buyAmmo(arg); break;
      case 'buypet': G.eco.buyPet(arg); break;
      case 'setpet': G.eco.setPet(arg); break;
      case 'buyart': G.eco.buyArtifact(arg); break;
      case 'art': G.eco.toggleArtifact(arg); break;
      case 'buybiz': G.eco.buyBusiness(arg); break;
      case 'collect': G.eco.collect(arg); break;
      case 'collectall': G.eco.collectAll(); break;
      case 'job': G.closePhoneAfter(() => G.jobs.startJob(arg)); break;
      case 'canceljob': G.jobs.cancel(); break;
      case 'workshift': G.closePhoneAfter(() => G.jobs.startShift(arg)); break;
      case 'questaccept': G.quests.accept(); break;
      case 'questdecline': G.quests.decline(); break;
      case 'radio': G.radio.next(); break;
      case 'upgradebiz': G.eco.upgradeBusiness(arg); break;
      case 'live': if (G.yt.live) G.yt.stopLive(); else G.closePhoneAfter(() => G.yt.startLive()); break;
      case 'paypal5':
        if (G.DEV_DONATE_URL) { if (window.open) window.open(G.DEV_DONATE_URL, '_blank'); G.ui.toast("Page de paiement ouverte — reviens ici et appuie sur « J'ai payé »"); break; }
        if (!G.DEV_PAYPAL) { G.ui.toast('Le créateur doit configurer son lien de paiement (voir README)', 'warn'); G.sfx.deny(); break; }
        if (window.open) window.open('https://paypal.me/' + G.DEV_PAYPAL + '/5', '_blank');
        G.ui.toast("Paiement PayPal ouvert — reviens ici et appuie sur « J'ai payé »");
        break;
      case 'paypaldon':
        if (G.DEV_DONATE_URL) { if (window.open) window.open(G.DEV_DONATE_URL, '_blank'); break; }
        if (!G.DEV_PAYPAL) { G.ui.toast('Le créateur doit configurer son lien de paiement (voir README)', 'warn'); G.sfx.deny(); break; }
        if (window.open) window.open('https://paypal.me/' + G.DEV_PAYPAL, '_blank');
        break;
      case 'premiumUnlock':
        G.settings.removeAds = true;
        G.save(true);
        G.ui.toast('⭐ Premium activé — plus aucune pub !', 'money');
        G.sfx.levelup();
        break;
      case 'war': G.closePhoneAfter(() => G.modes.startWar(arg)); break;
      case 'race': G.closePhoneAfter(() => G.modes.startRace(parseInt(arg))); break;
      case 'bribe':
        if (G.player.wanted > 0 && G.eco.spend(300 * G.player.wanted)) {
          G.player.wanted = 0;
          G.ui.toast('💵 Police soudoyée — recherche annulée', 'money');
        }
        break;
      case 'taxi': G.closePhoneAfter(() => G.modes.startTaxi()); break;
      case 'outfit': {
        const OUTFITS = [0x2f9bff, 0xff2d95, 0x7cff4d, 0xffd23e, 0xae3ec9, 0xff5a3c, 0x111418];
        const cur = OUTFITS.indexOf(G.settings.outfit);
        G.settings.outfit = OUTFITS[(cur + 1) % OUTFITS.length];
        G.player.obj.userData.mat.color.setHex(G.settings.outfit);
        G.save(true);
        G.ui.toast('👕 Nouvelle tenue !');
        break;
      }
      case 'slot': {
        const bet = parseInt(arg);
        if (!G.eco.spend(bet)) break;
        const SYM = ['🍒', '🍋', '🔔', '⭐', '7️⃣'];
        const r = [U.pick(SYM), U.pick(SYM), U.pick(SYM)];
        let mult = 0;
        if (r[0] === r[1] && r[1] === r[2]) mult = r[2] === '7️⃣' ? 20 : r[2] === '⭐' ? 10 : r[2] === '🔔' ? 6 : r[2] === '🍋' ? 4 : 3;
        else if (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]) mult = 1.5;
        if (mult > 0) {
          const gain = Math.floor(bet * mult);
          G.player.money += gain;
          G.ui.toast(r.join(' ') + ' → GAIN +' + U.fmt(gain) + ' !', 'money');
          G.sfx.levelup();
        } else {
          G.ui.toast(r.join(' ') + ' → Perdu... Retente ta chance !', 'warn');
          G.sfx.deny();
        }
        break;
      }
      case 'save': G.save(); break;
      case 'wipe':
        if (confirm('Effacer définitivement la sauvegarde ?')) {
          G.wipeSave();
          location.reload();
        }
        break;
      case 'quality': {
        const order = ['perf', 'hd', 'ultra'];
        G.settings.quality = order[(order.indexOf(G.settings.quality) + 1) % 3];
        G.ui.applySettings();
        break;
      }
      case 'shadows': G.settings.shadows = !G.settings.shadows; G.ui.applySettings(); break;
      case 'upscale': G.settings.upscale = !G.settings.upscale; G.ui.applySettings(); break;
      case 'fps': G.settings.fps = !G.settings.fps; UI.refreshPhone(); break;
      case 'photo': UI.togglePhoto(); UI.refreshPhone(); break;
      case 'sound': G.settings.sound = !G.settings.sound; if (!G.settings.sound) G.sfx.engine(false); break;
      case 'sens': {
        const steps = [0.5, 0.75, 1, 1.5, 2];
        G.settings.sens = steps[(steps.indexOf(G.settings.sens) + 1) % steps.length] || 1;
        break;
      }
    }
    UI.refreshPhone();
  }

  G.ui.action = phoneAction;

  G.closePhoneAfter = function (fn) {
    UI.closePhone();
    setTimeout(fn, 100);
  };

  UI.togglePause = function () {
    if (G.state.screen !== 'play') return;
    if (!$('phone').classList.contains('hidden')) { UI.closePhone(); return; }
    const p = $('pause');
    if (p.classList.contains('hidden')) {
      p.classList.remove('hidden');
      G.state.paused = true;
    } else {
      p.classList.add('hidden');
      G.state.paused = false;
    }
    G.sfx.ui();
  };

  $('pause').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const a = b.dataset.p;
    if (a === 'resume') UI.togglePause();
    if (a === 'save') G.save();
    if (a === 'settings') { UI.togglePause(); UI.openPhone('settings'); }
    if (a === 'quit') location.reload();
  });

  UI.applySettings = function () {
    const s = G.settings, r = G.renderer;
    if (!r) return;
    const dpr = window.devicePixelRatio || 1;
    let base = 1;
    if (s.quality === 'hd') base = Math.min(dpr, 1.6);
    if (s.quality === 'ultra') base = Math.min(dpr, 3);
    const up = s.upscale && s.quality !== 'perf';
    r.setPixelRatio(base * G.state.resScale * (up ? 0.7 : 1));
    if (r.domElement && r.domElement.style) r.domElement.style.filter = up ? 'contrast(1.06) saturate(1.12)' : 'none';
    r.shadowMap.enabled = s.shadows;
    if (G.world && G.world.sun) {
      G.world.sun.castShadow = s.shadows;
      if (s.shadows) {
        G.world.sun.shadow.mapSize.set(s.quality === 'ultra' ? 2048 : 1024, s.quality === 'ultra' ? 2048 : 1024);
        G.world.sun.shadow.camera.left = -80; G.world.sun.shadow.camera.right = 80;
        G.world.sun.shadow.camera.top = 80; G.world.sun.shadow.camera.bottom = -80;
        G.world.sun.shadow.camera.far = 400;
      }
    }
    if (G.world && G.world.applyFogDistance) G.world.applyFogDistance();
    G.save(true);
  };

  const mm = document.getElementById('minimap');
  const mmCtx = mm.getContext('2d');

  UI.drawMinimap = function () {
    const S = mm.width, half = S / 2;
    const view = 260;
    const p = G.player;
    const scale = S / view;
    const ctx = mmCtx;
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = '#12161f';
    ctx.fillRect(0, 0, S, S);

    ctx.save();
    ctx.translate(half, half);
    ctx.scale(scale, scale);
    ctx.translate(-p.pos.x, -p.pos.z);

    for (const d of G.world.districts) {
      const x0 = G.world.ORIGIN + d.cells[0] * G.world.CELL;
      const z0 = G.world.ORIGIN + d.cells[1] * G.world.CELL;
      const w = (d.cells[2] - d.cells[0] + 1) * G.world.CELL;
      const h = (d.cells[3] - d.cells[1] + 1) * G.world.CELL;
      ctx.fillStyle = d.owned ? 'rgba(47,212,110,0.25)' : d.color + '44';
      ctx.fillRect(x0, z0, w, h);
    }
    ctx.strokeStyle = 'rgba(200,220,255,0.35)';
    ctx.lineWidth = 12;
    for (let i = 0; i <= G.world.GRID; i++) {
      const c = G.world.roadCoord(i);
      ctx.beginPath(); ctx.moveTo(c, G.world.ORIGIN); ctx.lineTo(c, -G.world.ORIGIN); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(G.world.ORIGIN, c); ctx.lineTo(-G.world.ORIGIN, c); ctx.stroke();
    }

    for (const b of G.world.blips) {
      ctx.fillStyle = '#' + b.color.toString(16).padStart(6, '0');
      ctx.beginPath(); ctx.arc(b.x, b.z, 9, 0, Math.PI * 2); ctx.fill();
    }
    for (const c of G.cars) {
      if (c.wrecked) continue;
      ctx.fillStyle = c.type === 'police' ? '#4d8dff' : '#9aa4b2';
      ctx.beginPath(); ctx.arc(c.obj.position.x, c.obj.position.z, 5, 0, Math.PI * 2); ctx.fill();
    }
    for (const bz of G.eco.businesses) {
      if (!bz.owned || bz.x === undefined) continue;
      ctx.fillStyle = '#2fd46e';
      ctx.beginPath(); ctx.arc(bz.x, bz.z, 8, 0, Math.PI * 2); ctx.fill();
    }
    const sm = G.modes.storyMarker;
    if (sm) {
      ctx.fillStyle = '#ffd23e';
      ctx.beginPath(); ctx.arc(sm.x, sm.z, 12, 0, Math.PI * 2); ctx.fill();
    }
    for (const n of G.npcs) {
      if (n.dead) continue;
      if (n.type === 'cop' || (G.eco.hasPet('falcon') && (n.type === 'creature' || n.aggro || n.warTag))) {
        ctx.fillStyle = n.type === 'cop' ? '#4d8dff' : '#ff4d4d';
        ctx.beginPath(); ctx.arc(n.obj.position.x, n.obj.position.z, 6, 0, Math.PI * 2); ctx.fill();
      }
      if (n.type === 'ped' && n.obj.userData.customer) {
        ctx.fillStyle = '#ffd23e';
        ctx.beginPath(); ctx.arc(n.obj.position.x, n.obj.position.z, 7, 0, Math.PI * 2); ctx.fill();
      }
      if (n.type === 'ped' && n.obj.userData.questGiver) {
        ctx.fillStyle = '#c04dff';
        ctx.beginPath(); ctx.arc(n.obj.position.x, n.obj.position.z, 8, 0, Math.PI * 2); ctx.fill();
      }
      if (n.type === 'ped' && n.obj.userData.injured) {
        ctx.fillStyle = '#ff4d6d';
        ctx.fillRect(n.obj.position.x - 6, n.obj.position.z - 2, 12, 4);
        ctx.fillRect(n.obj.position.x - 2, n.obj.position.z - 6, 4, 12);
      }
    }
    ctx.restore();

    ctx.save();
    ctx.translate(half, half);
    ctx.rotate(G.player.inCar ? G.player.inCar.yaw + Math.PI : G.cam.yaw + Math.PI);
    ctx.fillStyle = '#7dffb0';
    ctx.beginPath();
    ctx.moveTo(0, -9); ctx.lineTo(6, 7); ctx.lineTo(-6, 7);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(120,200,255,.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, S - 2, S - 2);
  };

  UI.togglePhoto = function () {
    G.state.photoMode = !G.state.photoMode;
    if (document.body && document.body.classList) document.body.classList.toggle('photo', G.state.photoMode);
    G.ui.toast(G.state.photoMode ? '📷 Mode photo : interface masquée (P pour sortir)' : '📷 Mode photo désactivé');
  };

  UI.updateHUD = function () {
    const p = G.player;
    if (document.body && document.body.classList) document.body.classList.toggle('lowhp', p.hp < 30 && !G.state.wasted);
    const fb = $('fpsBox');
    if (fb) {
      const show = G.settings.fps && !G.state.photoMode;
      if (show) {
        fb.classList.remove('hidden');
        fb.textContent = Math.round(G.state.fps || 0) + ' FPS';
      } else fb.classList.add('hidden');
    }
    $('hpFill').style.width = U.clamp(p.hp / p.maxHp * 100, 0, 100) + '%';
    $('apFill').style.width = U.clamp(p.armor / 100 * 100, 0, 100) + '%';
    $('money').textContent = U.fmt(p.money);
    $('level').textContent = 'Niv. ' + p.level + ' — ⭐ ' + U.fmtSubs(G.yt.subs) + ' abonnés';
    let stars = '';
    for (let i = 0; i < 5; i++) stars += i < p.wanted ? '★' : '☆';
    $('stars').textContent = stars;

    const w = G.combat.WEAPONS[p.cur], slot = p.weapons[p.cur];
    $('weaponName').textContent = w.name;
    if (w.type === 'melee') $('weaponAmmo').textContent = '';
    else if (p.reloadT > 0) $('weaponAmmo').textContent = 'Recharge...';
    else $('weaponAmmo').textContent = (slot.ammo === Infinity ? '' : slot.ammo) + ' / ' + (slot.reserve === Infinity ? '∞' : slot.reserve);

    if (p.inCar) {
      $('speedo').classList.remove('hidden');
      $('speedo').textContent = Math.abs(Math.round(p.inCar.speed * 3.6)) + ' km/h';
    } else $('speedo').classList.add('hidden');

    $('crosshair').classList.toggle('hidden', !p.aiming);
    $('recDot').classList.toggle('hidden', !G.yt.recording);
    $('subCounter').classList.toggle('hidden', !G.yt.recording);
    if (G.yt.recording) $('subCounter').textContent = '🎬 ' + G.yt.points + ' pts • ' + Math.floor(G.yt.sessionT) + 's';

    const sm = G.modes.storyMarker;
    if (sm) {
      $('objectiveDist').classList.remove('hidden');
      $('objectiveDist').textContent = '🎯 ' + Math.floor(Math.sqrt(U.d2(p.pos.x, p.pos.z, sm.x, sm.z))) + ' m';
    } else $('objectiveDist').classList.add('hidden');

    UI.drawMinimap();
  };
})();
