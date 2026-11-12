'use strict';
(function () {
  const J = {};
  G.jobs = J;

  J.JOBS = {
    pizza: { name: '🍕 Livreur de Pizza', steps: 3, pay: 450, desc: 'Livre 3 pizzas à travers la ville. Vite, avant que ce soit froid !' },
    courier: { name: '📦 Coursier Express', steps: 4, pay: 550, desc: 'Livre 4 colis prioritaires aux quatre coins de Shadow City.' },
    garbage: { name: '🗑️ Éboueur Municipal', steps: 5, pay: 600, vehicle: 'garbage', desc: 'Collecte 5 points de ramassage avec le camion poubelles.' },
    bus: { name: '🚌 Chauffeur de Bus', steps: 4, pay: 750, vehicle: 'bus', desc: 'Dessers 4 arrêts de bus avec le Cityliner.' },
    medic: { name: '🚑 Paramédical', steps: 3, pay: 850, vehicle: 'ambulance', injured: true, desc: "Secours 3 blessés dans la ville avec l'ambulance." }
  };

  J.active = null;
  J.done = 0;

  J.roadTarget = function () {
    const i = U.randi(0, G.world.GRID), axis = Math.random() < 0.5;
    const t = U.rand(G.world.ORIGIN + 15, -G.world.ORIGIN - 15);
    return axis ? { x: G.world.roadCoord(i), z: t } : { x: t, z: G.world.roadCoord(i) };
  };

  J.startJob = function (type) {
    if (G.state.screen !== 'play') return;
    if (J.active) { G.ui.toast('Tu as déjà un job en cours ! (📱 > Jobs pour annuler)', 'warn'); G.sfx.deny(); return; }
    if (G.modes.taxi.active) { G.ui.toast("Termine ta course de taxi d'abord", 'warn'); G.sfx.deny(); return; }
    const def = J.JOBS[type];
    if (!def) return;
    if (def.vehicle) {
      const car = G.vehicles.makeCar(def.vehicle, 0, 0, 0);
      const pt = G.world.randRoadPoint();
      car.obj.position.set(pt.x, 0, pt.z);
      J.active = { type, def, stage: 'vehicle', car, step: 0, total: def.steps };
      G.ui.toast(def.name + ' : va chercher le véhicule de service !', 'warn');
    } else {
      const t = J.roadTarget();
      J.active = { type, def, stage: 'go', step: 0, total: def.steps, x: t.x, z: t.z };
      G.ui.toast(def.name + ' : suis le marqueur jaune ! (' + def.steps + ' étapes)', 'warn');
    }
    G.sfx.ui();
  };

  J.startShift = function (bizId) {
    const b = G.eco.businesses.find(x => x.id === bizId);
    if (!b || !b.owned) return;
    if (J.active) { G.ui.toast('Tu as déjà un job en cours !', 'warn'); G.sfx.deny(); return; }
    J.active = { type: 'shift', def: { name: '💼 Shift — ' + b.name, steps: 1, pay: Math.floor(G.eco.bizIncome(b) * 1.5) }, stage: 'shift', step: 0, total: 1, t: 20, biz: b, x: b.x, z: b.z };
    G.ui.toast('💼 Travail à ' + b.name + ' : reste sur place 20s !', 'warn');
    G.sfx.ui();
  };

  J.cancel = function () {
    if (!J.active) return;
    if (J.active.car && G.player.inCar !== J.active.car) G.scene.remove(J.active.car.obj);
    if (G.player.inCar === J.active.car) G.enterCar();
    for (const n of G.npcs) if (n.obj.userData.injured) n.obj.userData.injured = false;
    J.active = null;
    G.modes.storyMarker = null;
    G.ui.toast('Job annulé', 'warn');
    G.sfx.deny();
  };

  J.complete = function () {
    const a = J.active;
    if (!a) return;
    const pay = a.def.pay + G.player.level * 25;
    G.eco.earn(pay, true);
    G.addXP(40 + a.total * 10);
    G.ui.toast('✅ Job terminé : ' + a.def.name + ' → +' + U.fmt(pay), 'money');
    G.sfx.levelup();
    if (G.yt.recording || G.yt.live) G.yt.addEvent(60, 'Journée de boulot filmée !');
    J.done++;
    J.active = null;
    G.modes.storyMarker = null;
  };

  J.nextStep = function () {
    const a = J.active;
    a.step++;
    if (a.step >= a.total) { J.complete(); return; }
    const t = J.roadTarget();
    a.x = t.x; a.z = t.z;
    if (a.def.injured) J.spawnInjured(t);
    G.sfx.ui();
  };

  J.spawnInjured = function (t) {
    const n = G.spawnPed();
    n.obj.position.set(t.x, 0, t.z);
    n.state = 'wander'; n.wx = t.x; n.wz = t.z; n.wanderT = 9999;
    n.obj.userData.injured = true;
    J.active.injuredNpc = n;
  };

  J.update = function (dt) {
    const a = J.active;
    if (!a) return;
    if (G.state.wasted) { J.active = null; G.modes.storyMarker = null; return; }
    const p = G.player;

    if (a.stage === 'vehicle') {
      G.ui.setMission(a.def.name, 'Récupère le véhicule de service (marqueur jaune)');
      G.modes.storyMarker = { x: a.car.obj.position.x, z: a.car.obj.position.z };
      if (p.inCar === a.car) {
        a.stage = 'go';
        const t = J.roadTarget();
        a.x = t.x; a.z = t.z;
        if (a.def.injured) J.spawnInjured(t);
        G.ui.toast('Parfait ! Suis le marqueur jaune.', 'money');
      }
      return;
    }

    if (a.stage === 'shift') {
      a.t -= dt;
      G.ui.setMission(a.def.name, 'Travaille ! ' + Math.ceil(a.t) + 's restantes (reste sur place)');
      G.modes.storyMarker = { x: a.x, z: a.z };
      if (Math.sqrt(U.d2(p.pos.x, p.pos.z, a.x, a.z)) > 10) {
        J.active = null;
        G.modes.storyMarker = null;
        G.ui.toast('Shift raté — tu es parti trop loin !', 'warn');
        return;
      }
      if (a.t <= 0) J.complete();
      return;
    }

    G.modes.storyMarker = { x: a.x, z: a.z };
    const label = a.def.injured ? 'Soigne le blessé' : a.type === 'garbage' ? 'Point de collecte' : a.type === 'bus' ? 'Arrêt de bus' : 'Point de livraison';
    G.ui.setMission(a.def.name, label + ' (' + (a.step + 1) + '/' + a.total + ') — ' + Math.floor(Math.sqrt(U.d2(p.pos.x, p.pos.z, a.x, a.z))) + ' m');
    if (a.def.vehicle && p.inCar !== a.car) {
      G.ui.setMission(a.def.name, 'Reviens au volant du véhicule de service !');
      return;
    }
    if (Math.sqrt(U.d2(p.pos.x, p.pos.z, a.x, a.z)) < 7) {
      if (a.def.injured && a.injuredNpc && !a.injuredNpc.dead) {
        a.injuredNpc.obj.userData.injured = false;
        a.injuredNpc.obj.userData.customer = false;
      }
      G.sfx.cash();
      J.nextStep();
    }
  };
})();
