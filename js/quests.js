'use strict';
(function () {
  const Q = {};
  G.quests = Q;

  Q.active = null;
  Q.offer = null;
  Q.giver = null;
  Q.spawnT = 25;
  Q.done = 0;

  Q.districtName = () => U.pick(G.world.districts).name;

  Q.makeQuest = function () {
    const types = ['delivery', 'hunt', 'upgrade', 'farm', 'heal'];
    const type = U.pick(types);
    if (type === 'delivery') {
      const d = U.pick(G.world.districts);
      const t = G.jobs.roadTarget ? G.jobs.roadTarget() : { x: G.player.pos.x + 30, z: G.player.pos.z + 30 };
      return { type, title: '📦 Colis pour ' + d.name, desc: 'Dépose ce colis à ' + d.name + ' pour moi, s\'il te plaît.', x: t.x, z: t.z, reward: 600, xp: 60 };
    }
    if (type === 'hunt') {
      const d = U.pick(G.world.districts.filter(x => !x.owned)) || G.world.districts[0];
      return { type, title: '⚔️ Règlement de comptes', desc: 'Élimine 3 membres des ' + d.gangName + ' qui me font du chantage.', district: d.id, need: 3, reward: 900, xp: 90 };
    }
    if (type === 'upgrade') {
      const owned = G.eco.businesses.filter(b => b.owned);
      if (owned.length === 0) return { type: 'delivery', title: '📦 Colis pour Downtown', desc: 'Dépose ce colis à Downtown pour moi, s\'il te plaît.', x: G.world.cellCenter(4, 4).x, z: G.world.cellCenter(4, 4).z, reward: 600, xp: 60 };
      const b = U.pick(owned);
      const lvl = Math.min(3, (b.level || 1) + 1);
      return { type, title: '🏗️ Travaux urbains', desc: 'Améliore « ' + b.name + ' » au niveau ' + lvl + '. La ville compte sur toi !', biz: b.id, level: lvl, reward: 2500, xp: 150 };
    }
    if (type === 'farm') {
      const veg = U.pick(Object.keys(G.cartel.VEG));
      const need = U.randi(2, 4);
      return { type, title: '🥬 La soupe du quartier', desc: 'Récolte ' + need + ' × ' + G.cartel.VEG[veg].name + ' à ton potager (légal, promis).', veg, need, reward: 700, xp: 70 };
    }
    return { type: 'heal', title: '🩹 Urgence !', desc: 'Un habitant est blessé non loin — amène-toi et soigne-le.', reward: 500, xp: 50 };
  };

  Q.accept = function () {
    if (!Q.offer) return;
    const o = Q.offer;
    Q.active = o;
    Q.offer = null;
    if (o.type === 'hunt') {
      const d = G.world.districts.find(x => x.id === o.district);
      const c = G.world.cellCenter(Math.floor((d.cells[0] + d.cells[2]) / 2), Math.floor((d.cells[1] + d.cells[3]) / 2));
      o.npcs = [];
      for (let k = 0; k < o.need; k++) {
        const g = G.spawnGang(d.id, c.x + U.rand(-15, 15), c.z + U.rand(-15, 15), true);
        g.aggro = true;
        o.npcs.push(g);
      }
    }
    if (o.type === 'heal') {
      const t = G.jobs.roadTarget ? G.jobs.roadTarget() : { x: G.player.pos.x + 20, z: G.player.pos.z + 20 };
      o.x = t.x; o.z = t.z;
      const n = G.spawnPed();
      n.obj.position.set(t.x, 0, t.z);
      n.wx = t.x; n.wz = t.z; n.wanderT = 9999;
      n.obj.userData.injured = true;
      o.npc = n;
    }
    if (o.type === 'farm') o.startQty = G.cartel.veg[o.veg] ? G.cartel.veg[o.veg].qty : 0;
    G.ui.toast('✅ Quête acceptée : ' + o.title, 'money');
    G.sfx.ui();
  };

  Q.decline = function () {
    if (!Q.offer) return;
    Q.clearGiver();
    Q.offer = null;
    Q.spawnT = 30;
    G.ui.toast('Quête refusée', 'warn');
    G.sfx.deny();
  };

  Q.clearGiver = function () {
    if (Q.giver) Q.giver.obj.userData.questGiver = false;
    Q.giver = null;
  };

  Q.complete = function () {
    const o = Q.active;
    G.eco.earn(o.reward, true);
    G.addXP(o.xp);
    Q.done++;
    G.ui.toast('🌟 Quête réussie : ' + o.title + ' → +' + U.fmt(o.reward) + ' + ' + o.xp + ' XP', 'money');
    G.sfx.levelup();
    if (G.yt.recording || G.yt.live) G.yt.addEvent(80, 'Bonne action filmée — le chat adore !');
    if (o.npc && !o.npc.dead) o.npc.obj.userData.injured = false;
    Q.active = null;
    Q.spawnT = 50;
    G.modes.storyMarker = null;
  };

  Q.update = function (dt) {
    if (G.state.screen !== 'play' || G.state.wasted) return;

    if (Q.giver && (Q.giver.dead || U.d2(Q.giver.obj.position.x, Q.giver.obj.position.z, G.player.pos.x, G.player.pos.z) > 4900)) {
      if (Q.offer) { Q.offer = null; Q.spawnT = 30; }
      Q.clearGiver();
    }

    Q.spawnT -= dt;
    if (!Q.offer && !Q.active && Q.spawnT <= 0) {
      let best = null, bd = 1600;
      for (const n of G.npcs) {
        if (n.dead || n.type !== 'ped' || n.obj.userData.injured) continue;
        const d = U.d2(n.obj.position.x, n.obj.position.z, G.player.pos.x, G.player.pos.z);
        if (d < bd) { bd = d; best = n; }
      }
      if (best) {
        Q.giver = best;
        best.obj.userData.questGiver = true;
        Q.offer = Q.makeQuest();
        Q.offer.t = 90;
        G.ui.toast('💬 Un habitant a une requête pour toi ! (📱 > Quêtes)', 'warn');
      } else Q.spawnT = 10;
    }

    if (Q.offer) {
      Q.offer.t -= dt;
      if (Q.offer.t <= 0) {
        Q.offer = null;
        Q.clearGiver();
        Q.spawnT = 40;
        G.ui.toast('💬 L\'habitant est parti (quête expirée)', 'warn');
      }
    }

    const o = Q.active;
    if (!o) return;
    if (o.type === 'delivery') {
      if (!G.jobs.active) G.modes.storyMarker = { x: o.x, z: o.z };
      G.ui.setMission('❓ ' + o.title, Math.floor(Math.sqrt(U.d2(G.player.pos.x, G.player.pos.z, o.x, o.z))) + ' m');
      if (Math.sqrt(U.d2(G.player.pos.x, G.player.pos.z, o.x, o.z)) < 7) Q.complete();
    } else if (o.type === 'hunt') {
      const alive = o.npcs.filter(n => !n.dead).length;
      G.ui.setMission('❓ ' + o.title, 'Gangsters restants : ' + alive + '/' + o.need);
      if (alive === 0) Q.complete();
    } else if (o.type === 'upgrade') {
      const b = G.eco.businesses.find(x => x.id === o.biz);
      G.ui.setMission('❓ ' + o.title, b.name + ' — niveau ' + (b.level || 1) + ' / ' + o.level);
      if ((b.level || 1) >= o.level) Q.complete();
    } else if (o.type === 'farm') {
      const have = G.cartel.veg[o.veg] ? G.cartel.veg[o.veg].qty : 0;
      G.ui.setMission('❓ ' + o.title, G.cartel.VEG[o.veg].name + ' récolté : ' + have + ' / ' + (o.startQty + o.need));
      if (have >= o.startQty + o.need) Q.complete();
    } else if (o.type === 'heal') {
      if (!o.npc || o.npc.dead) { Q.complete(); return; }
      if (!G.jobs.active) G.modes.storyMarker = { x: o.npc.obj.position.x, z: o.npc.obj.position.z };
      G.ui.setMission('❓ ' + o.title, 'Soigne le blessé — ' + Math.floor(Math.sqrt(U.d2(G.player.pos.x, G.player.pos.z, o.npc.obj.position.x, o.npc.obj.position.z))) + ' m');
      if (U.d2(G.player.pos.x, G.player.pos.z, o.npc.obj.position.x, o.npc.obj.position.z) < 49) Q.complete();
    }
  };

  Q.reset = function () {
    Q.clearGiver();
    for (const n of G.npcs) if (n.obj.userData.injured) n.obj.userData.injured = false;
    Q.active = null; Q.offer = null; Q.spawnT = 25; Q.done = 0;
    G.modes.storyMarker = null;
  };
})();
