'use strict';
(function () {
  const C = {};
  G.cartel = C;

  C.SEEDS = {
    amnesia: { name: '🌱 Amnésia', price: 300, growTime: 240, yield: 8, base: 45, rep: 0, desc: 'Classique rentable, pousse vite.' },
    ogkush: { name: '🌱 OG Kush', price: 700, growTime: 300, yield: 10, base: 75, rep: 50, desc: 'Meilleur rendement, clientèle fidèle.' },
    purp: { name: '🌱 Purp Néon', price: 1800, growTime: 360, yield: 12, base: 130, rep: 150, desc: 'La variété signature de Shadow City.' },
    haze: { name: '🌫 Néon Haze', price: 3500, growTime: 420, yield: 14, base: 200, rep: 300, desc: 'Ultra puissante, rendement massif.' },
    frost: { name: '❄️ Frost Bleu', price: 6000, growTime: 480, yield: 16, base: 280, rep: 500, desc: 'La variété mythique des docks.' }
  };
  C.RECIPES = {
    crystal: { name: '⚗️ Crystal Néon', weed: 'amnesia', weedQty: 8, reagent: 1, time: 180, qty: 6, base: 380, rep: 0, desc: 'Le produit phare des labos.' },
    powder: { name: '⚗️ Poudre Étoile', weed: 'ogkush', weedQty: 12, reagent: 2, time: 240, qty: 6, base: 560, rep: 100, desc: 'Haut de gamme, marge énorme.' },
    juice: { name: '⚗️ Néon Juice', weed: 'amnesia', weedQty: 5, reagent: 1, time: 120, qty: 4, base: 220, rep: 50, desc: 'Production rapide, vente facile.' },
    purmix: { name: '🧪 Néon Pur', weed: 'crystal', weedQty: 4, reagent: 3, time: 300, qty: 4, base: 950, rep: 250, desc: 'Mélange Schedule 2 — qualité légendaire.', mix: true },
    elixir: { name: '🧪 Élixir Fantôme', weed: 'purp', weedQty: 10, reagent: 2, time: 240, qty: 6, base: 1200, rep: 300, desc: 'Le produit dont tout le monde parle en secret.' },
    nova: { name: '💫 Nova Cristal', weed: 'frost', weedQty: 8, reagent: 3, time: 360, qty: 8, base: 1800, rep: 500, desc: 'Le Graal des laboratoires — prix astronomique.', mix: true }
  };
  C.PROPERTIES = [
    { id: 'grow1', name: '🏡 Grow House — Docks', price: 25000, type: 'grow', pots: 6, loc: { i: 2, j: 1, dx: 12, dz: -12 }, desc: '6 pots de culture.' },
    { id: 'grow2', name: '🏡 Grow Deluxe — Green Heights', price: 60000, type: 'grow', pots: 12, loc: { i: 1, j: 8, dx: 12, dz: 12 }, desc: '12 pots, production sérieuse.' },
    { id: 'lab1', name: '⚗️ Labo Clandestin — Zone Ind.', price: 90000, type: 'lab', loc: { i: 8, j: 1, dx: -12, dz: -12 }, desc: 'Transforme la récolte en produits premium.' },
    { id: 'stash', name: '📦 Planque — Downtown', price: 40000, type: 'stash', loc: { i: 4, j: 4, dx: 16, dz: 16 }, desc: '+100 de stockage, raids deux fois moins violents.' },
    { id: 'garden', name: '🥬 Potager — Green Heights', price: 15000, type: 'garden', pots: 6, loc: { i: 2, j: 7, dx: 14, dz: -14 }, desc: 'Culture légale de légumes — argent propre !' }
  ];

  C.dirty = 0;
  C.heat = 0;
  C.rep = 0;
  C.reagent = 0;
  C.props = {};
  C.products = {};
  C.dealers = [];
  C.contract = null;
  C.convoy = null;
  C.laundered = 0;
  C.customers = [];
  C.fideles = [];
  C.plantGroups = {};
  C.raid = null;
  C.raidT = 480;
  C.vegSold = 0;

  C.VEG = {
    carrot: { name: '🥕 Carotte', seed: 60, time: 100, sell: 150 },
    tomato: { name: '🍅 Tomate', seed: 100, time: 140, sell: 260 },
    corn: { name: '🌽 Maïs Doré', seed: 180, time: 180, sell: 480 },
    pumpkin: { name: '🎃 Citrouille', seed: 300, time: 240, sell: 850 }
  };
  C.veg = {};
  for (const id in C.VEG) C.veg[id] = { qty: 0 };

  for (const id in C.SEEDS) C.products[id] = { qty: 0, quality: 1 };
  for (const id in C.RECIPES) C.products[id] = { qty: 0, quality: 1 };
  for (const p of C.PROPERTIES) C.props[p.id] = { owned: false, pots: [], batch: null };

  C.storageCap = () => 50 + (C.props.stash.owned ? 100 : 0);
  C.stored = function () {
    let n = 0;
    for (const id in C.products) n += C.products[id].qty;
    for (const d of C.dealers) n += d.stock;
    return n;
  };

  C.init = function () {
    for (const p of C.PROPERTIES) {
      const cc = G.world.cellCenter(p.loc.i, p.loc.j);
      p.x = cc.x + p.loc.dx; p.z = cc.z + p.loc.dz;
      G.world.makeMarker(p.x, p.z, 0x8a2be2, 'cartel_' + p.id);
      G.world.addStaticBlip(p.x, p.z, 0x8a2be2, p.name);
      if (p.type === 'grow' || p.type === 'garden') C.buildPots3D(p);
    }
  };

  C.buildPots3D = function (prop) {
    const g = new THREE.Group();
    const potGeo = new THREE.CylinderGeometry(0.5, 0.4, 0.5, 8);
    const potMat = new THREE.MeshLambertMaterial({ color: 0x7a4a2a });
    const plantGeo = new THREE.ConeGeometry(0.45, 1.2, 7);
    const pots = [];
    for (let k = 0; k < prop.pots; k++) {
      const pot = new THREE.Mesh(potGeo, potMat);
      pot.position.set((k % 4) * 1.6 - 2.4, 0.25, Math.floor(k / 4) * 1.6 - 0.8);
      g.add(pot);
      const plant = new THREE.Mesh(plantGeo, new THREE.MeshLambertMaterial({ color: 0x2d8a34 }));
      plant.position.set(pot.position.x, 1, pot.position.z);
      plant.scale.setScalar(0.01);
      plant.visible = false;
      g.add(plant);
      pots.push(plant);
    }
    g.position.set(prop.x, 0, prop.z);
    G.scene.add(g);
    C.plantGroups[prop.id] = pots;
  };

  C.buyProperty = function (id) {
    const p = C.PROPERTIES.find(x => x.id === id);
    const st = C.props[id];
    if (!p || st.owned) return;
    if (!G.eco.spend(p.price)) return;
    st.owned = true;
    if (p.type === 'grow' || p.type === 'garden') for (let k = 0; k < p.pots; k++) st.pots.push({ seed: null, progress: 0, water: 1, quality: 1 });
    G.ui.toast('🔑 ' + p.name + ' acheté !', 'money');
    G.sfx.buy();
    G.addXP(80);
  };

  C.buySeed = function (id) {
    const s = C.SEEDS[id];
    if (!s) return;
    if (C.rep < s.rep) { G.ui.toast('🔒 Réputation ' + s.rep + ' requise', 'warn'); G.sfx.deny(); return; }
    if (!G.eco.spend(s.price)) return;
    let pot = null;
    for (const pid of ['grow1', 'grow2']) {
      if (!C.props[pid].owned) continue;
      pot = C.props[pid].pots.find(pp => !pp.seed);
      if (pot) break;
    }
    if (!pot) { G.ui.toast('Aucun pot libre !', 'warn'); G.player.money += s.price; G.sfx.deny(); return; }
    pot.seed = id; pot.progress = 0; pot.water = 1; pot.quality = 1;
    G.ui.toast(s.name + ' plantée !', 'money');
    G.sfx.buy();
  };

  C.buyVeg = function (id) {
    const v = C.VEG[id];
    const garden = C.props.garden;
    if (!garden.owned) { G.ui.toast('Achète le potager d\'abord !', 'warn'); G.sfx.deny(); return; }
    const pot = garden.pots.find(pp => !pp.seed);
    if (!pot) { G.ui.toast('Aucun pot libre au potager !', 'warn'); G.sfx.deny(); return; }
    if (!G.eco.spend(v.seed)) return;
    pot.seed = id; pot.progress = 0; pot.water = 1; pot.quality = 1;
    G.ui.toast(v.name + ' planté au potager !', 'money');
    G.sfx.buy();
  };

  C.harvestVeg = function () {
    const garden = C.props.garden;
    if (!garden.owned) return;
    let total = 0;
    for (const pot of garden.pots) {
      if (pot.seed && pot.progress >= 1) {
        C.veg[pot.seed].qty += 3;
        pot.seed = null; pot.progress = 0; pot.quality = 1;
        total += 3;
      }
    }
    if (total > 0) {
      G.ui.toast('🥕 Récolte potager : +' + total + ' légumes', 'money');
      G.sfx.cash();
    } else { G.ui.toast('Rien à récolter au potager', 'warn'); G.sfx.deny(); }
  };

  C.sellVeg = function (id) {
    const v = C.VEG[id];
    const inv = C.veg[id];
    if (!inv || inv.qty <= 0) { G.ui.toast('Aucun ' + v.name + ' en stock', 'warn'); G.sfx.deny(); return; }
    const n = inv.qty;
    const gain = Math.floor(v.sell * n * U.rand(0.9, 1.1));
    inv.qty = 0;
    C.vegSold += n;
    G.eco.earn(gain);
    G.addXP(15);
    G.ui.toast('🌽 Vente de légumes : +' + U.fmt(gain) + ' (argent propre)', 'money');
    G.sfx.cash();
  };

  C.waterAll = function () {
    let n = 0;
    for (const id in C.props) for (const pot of C.props[id].pots) {
      if (pot.seed && pot.water < 1) { pot.water = 1; n++; }
    }
    G.ui.toast(n ? '💧 ' + n + ' pots arrosés' : 'Rien à arroser', n ? 'money' : 'warn');
  };

  C.harvest = function () {
    let total = 0;
    for (const id in C.props) {
      const prop = C.PROPERTIES.find(p => p.id === id);
      if (prop.type !== 'grow') continue;
      for (const pot of C.props[id].pots) {
        if (pot.seed && pot.progress >= 1) {
          const s = C.SEEDS[pot.seed];
          const prod = C.products[pot.seed];
          const q = U.clamp(pot.quality, 0.4, 1.5);
          prod.quality = prod.qty > 0 ? (prod.quality * prod.qty + q * s.yield) / (prod.qty + s.yield) : q;
          prod.qty = Math.min(C.storageCap(), prod.qty + s.yield);
          pot.seed = null; pot.progress = 0; pot.quality = 1;
          total += s.yield;
        }
      }
    }
    if (total > 0) {
      G.ui.toast('🌾 Récolte : ' + total + ' unités (stock ' + C.stored() + '/' + C.storageCap() + ')', 'money');
      G.sfx.cash();
      if (G.yt.recording) G.yt.addEvent(40, 'Récolte secrète filmée !');
    } else { G.ui.toast('Rien à récolter', 'warn'); G.sfx.deny(); }
  };

  C.startBatch = function (id) {
    const r = C.RECIPES[id];
    const lab = C.props.lab1;
    if (!lab.owned) { G.ui.toast('Achète d\'abord un labo !', 'warn'); G.sfx.deny(); return; }
    if (C.rep < r.rep) { G.ui.toast('🔒 Réputation ' + r.rep + ' requise', 'warn'); G.sfx.deny(); return; }
    if (lab.batch) { G.ui.toast('Le labo est déjà occupé', 'warn'); G.sfx.deny(); return; }
    if (C.products[r.weed].qty < r.weedQty) { G.ui.toast('Il faut ' + r.weedQty + ' × ' + C.SEEDS[r.weed].name, 'warn'); G.sfx.deny(); return; }
    if (C.reagent < r.reagent) { G.ui.toast('Il faut ' + r.reagent + ' réactif (Boutique)', 'warn'); G.sfx.deny(); return; }
    if (C.stored() + r.qty > C.storageCap()) { G.ui.toast('Stockage plein !', 'warn'); G.sfx.deny(); return; }
    C.products[r.weed].qty -= r.weedQty;
    C.reagent -= r.reagent;
    lab.batch = { recipe: id, progress: 0, quality: C.products[r.weed].quality };
    G.ui.toast(r.name + ' : production lancée', 'money');
    G.sfx.buy();
  };

  C.buyReagent = function () {
    if (!G.eco.spend(500)) return;
    C.reagent += 3;
    G.ui.toast('🧪 +3 réactifs', 'money');
  };

  C.demand = function () {
    const d = G.world.districtAt(G.player.pos.x, G.player.pos.z);
    const owned = d.owned ? 1.15 : 1;
    return owned * (0.9 + 0.4 * Math.sin(G.state.time * 1.7 + d.name.length));
  };

  C.sellNearby = function () {
    const p = G.player;
    const cust = C.nearestCustomer(14);
    if (!cust) { G.ui.toast('Aucun client à proximité — cherche les blips 💰', 'warn'); G.sfx.deny(); return; }
    let bestId = null, bestVal = 0;
    for (const id in C.products) {
      const pr = C.products[id];
      if (pr.qty <= 0) continue;
      const base = C.SEEDS[id] ? C.SEEDS[id].base : C.RECIPES[id].base;
      const val = base * pr.quality * C.demand();
      if (val > bestVal) { bestVal = val; bestId = id; }
    }
    if (!bestId) { G.ui.toast('Tu n\'as rien à vendre !', 'warn'); G.sfx.deny(); return; }
    const amount = Math.floor(bestVal * U.rand(0.9, 1.15));
    C.products[bestId].qty--;
    C.dirty += amount;
    C.heat = Math.min(100, C.heat + 6);
    cust.sales = (cust.sales || 0) + 1;
    G.sfx.cash();
    G.ui.toast('🤫 Vente : ' + (C.SEEDS[bestId] || C.RECIPES[bestId]).name + ' → +' + U.fmt(amount) + ' (argent sale) • Heat ' + Math.floor(C.heat) + '%', 'money');
    G.addXP(5);
    if (G.yt.recording) G.yt.addEvent(15, 'Transaction filmée (contenu exclusif !)');
    if (Math.random() < C.heat / 400) {
      G.combat.crime(p.pos, 1);
      G.ui.toast('👀 Un voisin a tout vu...', 'warn');
    }
    if (cust.sales >= 3 && !cust.obj.userData.fidele) {
      cust.obj.userData.fidele = true;
      C.fideles.push(cust);
      G.ui.toast('💜 Client fidèle conquis ! Il achète tout seul quand tu passes (prix premium)');
      G.addXP(25);
    }
  };

  C.nearestCustomer = function (maxD) {
    let best = null, bd = maxD * maxD;
    for (const n of G.npcs) {
      if (n.dead || n.type !== 'ped' || !n.obj.userData.customer) continue;
      const d = U.d2(n.obj.position.x, n.obj.position.z, G.player.pos.x, G.player.pos.z);
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  };

  C.upgradeDealer = function (idx) {
    const d = C.dealers[idx];
    if (!d) return;
    const lvl = d.lvl || 1;
    if (lvl >= 3) { G.ui.toast('Dealer déjà au niveau max !', 'warn'); G.sfx.deny(); return; }
    if (!G.eco.spend(15000 * lvl)) return;
    d.lvl = lvl + 1;
    G.ui.toast('🕵️ Dealer niveau ' + d.lvl + ' ! Vente : ' + (2 * d.lvl) + ' u/min', 'money');
    G.sfx.buy();
  };

  C.hireDealer = function (districtId) {
    if (C.dealers.find(d => d.district === districtId)) return;
    if (!G.eco.spend(8000)) return;
    C.dealers.push({ district: districtId, stock: 0 });
    G.ui.toast('🕵️ Dealer recruté : ' + G.world.districts.find(d => d.id === districtId).name, 'money');
    G.sfx.buy();
  };

  C.supplyDealer = function (idx) {
    const d = C.dealers[idx];
    if (!d) return;
    let bestId = null, bestQ = 0;
    for (const id in C.products) {
      if (C.products[id].qty > 0 && C.products[id].quality > bestQ) { bestQ = C.products[id].quality; bestId = id; }
    }
    if (!bestId) { G.ui.toast('Stock vide !', 'warn'); G.sfx.deny(); return; }
    const n = Math.min(10, C.products[bestId].qty);
    C.products[bestId].qty -= n;
    d.stock += n;
    G.ui.toast('📦 ' + n + ' unités fournies au dealer (' + G.world.districts.find(x => x.id === d.district).name + ')', 'money');
  };

  C.launder = function (amount) {
    const ownedBiz = G.eco.businesses.filter(b => b.owned).length;
    if (ownedBiz === 0) { G.ui.toast('Il faut un business pour blanchir !', 'warn'); G.sfx.deny(); return; }
    const cap = Math.max(0, ownedBiz * 2000 - C.laundered);
    amount = Math.min(amount, C.dirty, cap);
    if (amount < 1) { G.ui.toast('Capacité de blanchiment épuisée (2 000$/min par business)', 'warn'); G.sfx.deny(); return; }
    C.dirty -= amount;
    C.laundered += amount;
    G.eco.earn(amount * 0.85, true);
    G.ui.toast('🧼 ' + U.fmt(amount) + ' blanchis → ' + U.fmt(amount * 0.85) + ' propres', 'money');
    G.sfx.cash();
  };

  C.rollContract = function () {
    const pool = Object.keys(C.products).filter(id => (C.SEEDS[id] || C.RECIPES[id]).base >= 40);
    const id = U.pick(pool);
    const def = C.SEEDS[id] || C.RECIPES[id];
    const qty = U.randi(5, 12);
    C.contract = {
      product: id, qty, delivered: 0,
      reward: Math.floor(def.base * qty * 1.6),
      deadline: 300 + qty * 20, t: 0
    };
    G.ui.toast('📜 Contrat : ' + qty + ' × ' + def.name + ' → ' + U.fmt(C.contract.reward), 'warn');
  };

  C.deliverContract = function () {
    const ct = C.contract;
    if (!ct) return;
    const have = C.products[ct.product].qty;
    const n = Math.min(have, ct.qty - ct.delivered);
    if (n <= 0) { G.ui.toast('Pas la bonne marchandise !', 'warn'); G.sfx.deny(); return; }
    C.products[ct.product].qty -= n;
    ct.delivered += n;
    if (ct.delivered >= ct.qty) {
      C.dirty += ct.reward;
      C.rep += 15;
      G.ui.toast('📜 Contrat honoré ! +' + U.fmt(ct.reward) + ' • Réputation ' + C.rep, 'money');
      G.sfx.levelup();
      G.addXP(60);
      C.contract = null;
    } else G.ui.toast('📜 ' + ct.delivered + '/' + ct.qty + ' livrés', 'money');
  };

  C.launchConvoy = function () {
    if (C.convoy) { G.ui.toast('Convoi déjà en route !', 'warn'); return; }
    let total = 0;
    for (const id in C.products) total += C.products[id].qty;
    if (total < 15) { G.ui.toast('Il faut au moins 15 unités pour un convoi', 'warn'); G.sfx.deny(); return; }
    let value = 0, need = 15;
    for (const id in C.products) {
      if (need <= 0) break;
      const take = Math.min(C.products[id].qty, need);
      if (take <= 0) continue;
      const base = C.SEEDS[id] ? C.SEEDS[id].base : C.RECIPES[id].base;
      value += take * base * C.products[id].quality;
      C.products[id].qty -= take;
      need -= take;
    }
    C.convoy = { value: value * 1.5, t: 45, risk: 0.25 + C.heat / 300 };
    G.ui.toast('🚚 Convoi lancé — retour dans 45s (risque de contrôle : ' + Math.floor(C.convoy.risk * 100) + '%)', 'warn');
  };

  C.update = function (dt) {
    const spd = G.eco.equipped.includes('chronos') ? 1.3 : 1;
    for (const id in C.props) {
      const st = C.props[id];
      const prop = C.PROPERTIES.find(p => p.id === id);
      if (prop.type === 'grow') {
        for (let k = 0; k < st.pots.length; k++) {
          const pot = st.pots[k];
          if (!pot.seed) continue;
          if (pot.water > 0) {
            pot.water -= dt / 150;
            pot.progress = Math.min(1, pot.progress + dt / C.SEEDS[pot.seed].growTime * spd);
          } else {
            pot.quality = Math.max(0.4, pot.quality - dt * 0.004);
            pot.progress = Math.min(1, pot.progress + dt / C.SEEDS[pot.seed].growTime * 0.15 * spd);
          }
          const plant = C.plantGroups[id] && C.plantGroups[id][k];
          if (plant) {
            plant.visible = true;
            plant.scale.setScalar(0.2 + pot.progress * 0.9);
            plant.material.color.setHex(pot.water > 0 ? 0x2d8a34 : 0x6a6a2a);
          }
        }
      }
      if (prop.type === 'garden') {
        for (let k = 0; k < st.pots.length; k++) {
          const pot = st.pots[k];
          if (!pot.seed) continue;
          pot.progress = Math.min(1, pot.progress + dt / C.VEG[pot.seed].time * spd);
          const plant = C.plantGroups[id] && C.plantGroups[id][k];
          if (plant) {
            plant.visible = true;
            plant.scale.setScalar(0.2 + pot.progress * 0.7);
            plant.material.color.setHex(pot.progress >= 1 ? 0xe07820 : 0x3da53a);
          }
        }
      }
      if (prop.type === 'lab' && st.batch) {
        st.batch.progress += dt / C.RECIPES[st.batch.recipe].time * spd;
        if (st.batch.progress >= 1) {
          const r = C.RECIPES[st.batch.recipe];
          const prod = C.products[st.batch.recipe];
          const q = U.clamp(st.batch.quality * 1.1 + 0.1, 0.4, 1.6);
          prod.quality = prod.qty > 0 ? (prod.quality * prod.qty + q * r.qty) / (prod.qty + r.qty) : q;
          prod.qty += r.qty;
          G.ui.toast('⚗️ Production terminée : ' + r.qty + ' × ' + r.name, 'money');
          G.sfx.cash();
          st.batch = null;
        }
      }
    }

    C.heat = Math.max(0, C.heat - dt * 0.35);
    C.laundered = Math.max(0, C.laundered - dt * 33.3);

    for (let i = C.fideles.length - 1; i >= 0; i--) {
      const f = C.fideles[i];
      if (f.dead || U.d2(f.obj.position.x, f.obj.position.z, G.player.pos.x, G.player.pos.z) > 6400) {
        f.obj.userData.fidele = false;
        C.fideles.splice(i, 1);
        continue;
      }
      f.buyT = (f.buyT || 0) + dt;
      if (f.buyT >= 12) {
        f.buyT = 0;
        if (U.d2(f.obj.position.x, f.obj.position.z, G.player.pos.x, G.player.pos.z) < 625) {
          let bestId = null, bestVal = 0;
          for (const id in C.products) {
            const pr = C.products[id];
            if (pr.qty <= 0) continue;
            const base = C.SEEDS[id] ? C.SEEDS[id].base : C.RECIPES[id].base;
            const val = base * pr.quality * 1.3;
            if (val > bestVal) { bestVal = val; bestId = id; }
          }
          if (bestId) {
            const amount = Math.floor(bestVal * C.demand() * U.rand(0.95, 1.2));
            C.products[bestId].qty--;
            C.dirty += amount;
            G.ui.toast('💜 Client fidèle : achat auto de ' + (C.SEEDS[bestId] || C.RECIPES[bestId]).name + ' → +' + U.fmt(amount), 'money');
            G.sfx.cash();
          }
        }
      }
    }

    for (const d of C.dealers) {
      d.timer = (d.timer || 0) + dt;
      if (d.timer >= 60 && d.stock > 0) {
        d.timer = 0;
        const n = Math.min(d.stock, 2 * (d.lvl || 1));
        d.stock -= n;
        let sum = 0, count = 0;
        for (const id in C.products) {
          sum += (C.SEEDS[id] ? C.SEEDS[id].base : C.RECIPES[id].base);
          count++;
        }
        C.dirty += n * (sum / count) * 0.85;
        C.heat = Math.min(100, C.heat + 2);
      }
    }

    if (C.contract) {
      C.contract.t += dt;
      if (C.contract.t >= C.contract.deadline) {
        C.rep = Math.max(0, C.rep - 10);
        G.ui.toast('📜 Contrat échoué ! -10 réputation', 'warn');
        C.contract = null;
      }
    } else if (Math.random() < dt / 90) C.rollContract();

    if (C.convoy) {
      C.convoy.t -= dt;
      if (C.convoy.t <= 0) {
        if (Math.random() < C.convoy.risk) {
          G.player.wanted = Math.min(5, G.player.wanted + 2);
          G.ui.toast('🚨 Convoi intercepté ! Marchandise saisie, +2 étoiles', 'warn');
          G.sfx.alarm();
        } else {
          C.dirty += C.convoy.value;
          G.ui.toast('🚚 Convoi réussi ! +' + U.fmt(C.convoy.value) + ' (argent sale)', 'money');
          G.sfx.cash();
          if (G.yt.recording) G.yt.addEvent(100, 'Convoi légendaire !');
        }
        C.convoy = null;
      }
    }

    const growOwned = C.PROPERTIES.some(p => p.type === 'grow' && C.props[p.id].owned);
    if (!C.raid && growOwned) {
      C.raidT -= dt;
      if (C.raidT <= 0) C.startRivalRaid();
    }
    if (C.raid) {
      C.raid.t -= dt;
      const alive = C.raid.npcs.filter(n => !n.dead);
      if (alive.length === 0) {
        C.rep += 10;
        G.ui.toast('⚔️ Raid rival repoussé ! +10 réputation cartel', 'money');
        G.sfx.levelup();
        C.raid = null; C.raidT = 480;
      } else if (C.raid.t <= 0) {
        let lost = 0;
        for (const id in C.products) { const l = Math.floor(C.products[id].qty * 0.3); C.products[id].qty -= l; lost += l; }
        G.ui.toast('💀 Raid rival réussi : -30% de tes produits (' + lost + ' unités saisis)', 'warn');
        G.sfx.alarm();
        C.raid = null; C.raidT = 480;
      } else if (C.raid.t < 30 && !C.raid.warned) {
        C.raid.warned = true;
        G.ui.toast('⏳ Plus que 30s pour défendre ton grow house !', 'warn');
      }
    }

    if (C.heat > 85 && Math.random() < dt / 60) {
      const mult = C.props.stash.owned ? 0.5 : 1;
      let lost = 0;
      for (const id in C.products) {
        const l = Math.floor(C.products[id].qty * 0.3 * mult);
        C.products[id].qty -= l;
        lost += l;
      }
      G.combat.crime(G.player.pos, 2);
      G.ui.toast('🚨 RAIDE ! La police a saisi ' + lost + ' unités', 'warn');
      G.sfx.alarm();
    }

    for (const n of G.npcs) if (n.obj.userData.customer) n.obj.userData.customer = false;
    C.customers = [];
    let assigned = 0;
    for (const n of G.npcs) {
      if (assigned >= 3) break;
      if (n.dead || n.type !== 'ped') continue;
      if (U.d2(n.obj.position.x, n.obj.position.z, G.player.pos.x, G.player.pos.z) < 6400) {
        n.obj.userData.customer = true;
        C.customers.push(n);
        assigned++;
      }
    }
  };

  C.startRivalRaid = function () {
    const grow = C.PROPERTIES.find(p => p.type === 'grow' && C.props[p.id].owned);
    if (!grow) return;
    const n = 3 + Math.floor(G.player.level / 3);
    const npcs = [];
    for (let k = 0; k < n; k++) {
      const g = G.spawnGang('industrial', grow.x + U.rand(-8, 8), grow.z + U.rand(-8, 8), true);
      g.aggro = true;
      g.obj.userData.rival = true;
      npcs.push(g);
    }
    C.raid = { npcs, t: 90, x: grow.x, z: grow.z };
    G.ui.toast('🚨 RAID RIVAL : ta grow house est attaquée ! Défends-la (90s) !', 'warn');
    G.sfx.alarm();
    if (G.yt.recording) G.yt.addEvent(150, 'Raid rival en DIRECT !');
  };

  C.reset = function () {
    C.dirty = 0; C.heat = 0; C.rep = 0; C.reagent = 0;
    C.dealers = []; C.contract = null; C.convoy = null; C.laundered = 0;
    C.raid = null; C.raidT = 480; C.vegSold = 0;
    for (const n of G.npcs) if (n.obj.userData.fidele) n.obj.userData.fidele = false;
    C.fideles = [];
    for (const id in C.veg) C.veg[id].qty = 0;
    for (const id in C.products) { C.products[id].qty = 0; C.products[id].quality = 1; }
    for (const pid in C.props) { C.props[pid].owned = false; C.props[pid].pots = []; C.props[pid].batch = null; }
    for (const key in C.plantGroups) {
      for (const plant of C.plantGroups[key]) { plant.visible = false; plant.scale.setScalar(0.01); }
    }
  };

  C.serialize = function () {
    const props = {};
    for (const id in C.props) {
      props[id] = { owned: C.props[id].owned, pots: C.props[id].pots, batch: C.props[id].batch };
    }
    return {
      dirty: C.dirty, heat: C.heat, rep: C.rep, reagent: C.reagent,
      props, products: C.products, dealers: C.dealers, contract: C.contract,
      veg: C.veg, vegSold: C.vegSold
    };
  };

  C.deserialize = function (d) {
    if (!d) return;
    C.dirty = d.dirty || 0; C.heat = d.heat || 0; C.rep = d.rep || 0; C.reagent = d.reagent || 0;
    for (const id in (d.props || {})) {
      if (C.props[id]) { C.props[id].owned = d.props[id].owned; C.props[id].pots = d.props[id].pots || []; C.props[id].batch = d.props[id].batch || null; }
    }
    for (const id in (d.products || {})) if (C.products[id]) C.products[id] = d.products[id];
    C.dealers = d.dealers || [];
    C.contract = d.contract || null;
    for (const id in (d.veg || {})) if (C.veg[id]) C.veg[id].qty = d.veg[id].qty || 0;
    C.vegSold = d.vegSold || 0;
    for (const p of C.PROPERTIES) {
      if (p.type === 'grow' && C.props[p.id].owned && C.props[p.id].pots.length === 0) {
        for (let k = 0; k < p.pots; k++) C.props[p.id].pots.push({ seed: null, progress: 0, water: 1, quality: 1 });
      }
    }
  };

  C.ui = function () {
    const p = G.player;
    let html = `<div class="secTitle">💰 Propre : ${U.fmt(p.money)} • 🩸 Sale : ${U.fmt(C.dirty)} • 🔥 Heat : ${Math.floor(C.heat)}% • ⭐ Rép. : ${C.rep}</div>`;
    if (C.raid) html += `<div class="row"><div class="info"><div class="name">🚨 RAID RIVAL EN COURS</div><div class="desc">Défends ta grow house ! Temps restant : ${Math.ceil(C.raid.t)}s — ennemis : ${C.raid.npcs.filter(n => !n.dead).length}</div></div></div>`;

    html += '<div class="secTitle">Propriétés</div>';
    for (const pr of C.PROPERTIES) {
      const st = C.props[pr.id];
      if (st.owned) html += `<div class="row"><div class="info"><div class="name">✅ ${pr.name}</div><div class="desc">${pr.desc}</div></div></div>`;
      else html += `<div class="row"><div class="info"><div class="name">${pr.name}</div><div class="desc">${pr.desc}</div></div><button data-a="cx:buyprop:${pr.id}" class="gold">${U.fmt(pr.price)}</button></div>`;
    }

    html += '<div class="secTitle">Culture</div>';
    let growing = 0, ready = 0;
    for (const id in C.props) {
      for (const pot of C.props[id].pots) {
        if (!pot.seed) continue;
        growing++;
        if (pot.progress >= 1) ready++;
      }
    }
    html += `<div class="row"><div class="info"><div class="desc">En pousse : ${growing} • Prêtes : ${ready} • Stock : ${C.stored()}/${C.storageCap()} • Réactifs : ${C.reagent}</div></div></div>`;
    html += `<div class="row"><div class="info"><div class="name">💧 Arroser tous les pots</div><div class="desc">Sans eau : croissance ÷7 et qualité en chute</div></div><button data-a="cx:water" class="green">Arroser</button></div>`;
    html += `<div class="row"><div class="info"><div class="name">🌾 Récolter</div><div class="desc">Récupère les plants prêts</div></div><button data-a="cx:harvest" class="green">Récolter</button></div>`;
    for (const id in C.SEEDS) {
      const s = C.SEEDS[id];
      const lock = C.rep < s.rep;
      html += `<div class="row"><div class="info"><div class="name">${s.name}</div><div class="desc">${s.desc} — ${Math.round(s.growTime / 60)} min${lock ? ' • 🔒 Rép. ' + s.rep : ''}</div></div><button data-a="cx:seed:${id}" ${lock ? 'disabled' : ''}>${U.fmt(s.price)}</button></div>`;
    }

    html += '<div class="secTitle">Potager (légal — argent propre)</div>';
    if (!C.props.garden.owned) {
      html += `<div class="row"><div class="info"><div class="name">🥬 Potager — Green Heights</div><div class="desc">6 pots de légumes — revenus 100% légaux</div></div><button data-a="cx:buyprop:garden" class="gold">${U.fmt(15000)}</button></div>`;
    } else {
      html += `<div class="row"><div class="info"><div class="name">✅ Potager</div><div class="desc">Planter → attendre → récolter 3 légumes / pot${G.eco.equipped.includes('chronos') ? ' • ⏱ Chronos : +30% vitesse' : ''}</div></div><button data-a="cx:harvestveg" class="green">Récolter</button></div>`;
      for (const id in C.VEG) {
        const v = C.VEG[id];
        html += `<div class="row"><div class="info"><div class="name">${v.name}</div><div class="desc">Pousse en ${Math.round(v.time / 60)} min → vendu ~${U.fmt(v.sell)}/u • Stock : ${C.veg[id].qty}</div></div><button data-a="cx:veg:${id}">${U.fmt(v.seed)}</button></div>`;
        if (C.veg[id].qty > 0) html += `<div class="row"><div class="info"><div class="desc">Vendre ${C.veg[id].qty} × ${v.name}</div></div><button data-a="cx:sellveg:${id}" class="green">Vendre</button></div>`;
      }
    }

    html += '<div class="secTitle">Labo</div>';
    html += `<div class="row"><div class="info"><div class="name">🧪 Acheter réactifs (×3)</div><div class="desc">Nécessaire pour le labo</div></div><button data-a="cx:reagent" class="gold">${U.fmt(500)}</button></div>`;
    for (const id in C.RECIPES) {
      const r = C.RECIPES[id];
      const lock = C.rep < r.rep || !C.props.lab1.owned;
      const batch = C.props.lab1.batch;
      const busy = batch && batch.recipe === id;
      html += `<div class="row"><div class="info"><div class="name">${r.name}</div><div class="desc">${r.desc} — ${r.weedQty} × ${C.SEEDS[r.weed] ? C.SEEDS[r.weed].name : C.RECIPES[r.weed].name} + ${r.reagent} réactif → ${r.qty} u${lock ? (C.props.lab1.owned ? ' • 🔒 Rép. ' + r.rep : ' • 🔒 Labo requis') : ''}${busy ? ' — EN COURS ' + Math.floor(batch.progress * 100) + '%' : ''}</div></div><button data-a="cx:lab:${id}" ${lock || C.props.lab1.batch ? 'disabled' : ''} class="gold">Lancer</button></div>`;
    }

    html += '<div class="secTitle">Vente</div>';
    html += `<div class="row"><div class="info"><div class="name">🤫 Vendre au client proche</div><div class="desc">Approche un client (blip 💰 sur minimap) puis vends — prix × qualité × demande du quartier. Attention à la heat !</div></div><button data-a="cx:sell" class="green">Vendre</button></div>`;
    html += `<div class="row"><div class="info"><div class="name">📜 Contrat ${C.contract ? '(' + Math.floor((C.contract.deadline - C.contract.t) / 60) + ' min restantes)' : ''}</div><div class="desc">${C.contract ? C.contract.qty + ' × ' + (C.SEEDS[C.contract.product] || C.RECIPES[C.contract.product]).name + ' → ' + U.fmt(C.contract.reward) + ' (livré ' + C.contract.delivered + '/' + C.contract.qty + ')' : 'Un nouveau contrat arrive bientôt...'}</div></div><button data-a="cx:deliver" ${C.contract ? '' : 'disabled'} class="green">Livrer</button></div>`;
    html += `<div class="row"><div class="info"><div class="name">🚚 Lancer un convoi</div><div class="desc">Envoie 15 unités en ville → vente à +50% (risque de contrôle policier)</div></div><button data-a="cx:convoy" class="gold">Lancer</button></div>`;

    html += `<div class="row"><div class="info"><div class="desc">💜 Clients fidèles : ${C.fideles.length} — vends 3 fois au même client et il achètera tout seul à prix premium quand tu passes</div></div></div>`;

    html += '<div class="secTitle">Dealers (vente auto)</div>';
    for (const d of G.world.districts) {
      const mine = C.dealers.findIndex(x => x.district === d.id);
      if (mine >= 0) {
        const dl = C.dealers[mine].lvl || 1;
        html += `<div class="row"><div class="info"><div class="name">🕵️ Dealer — ${d.name}${dl > 1 ? ' (Niv. ' + dl + ')' : ''}</div><div class="desc">Stock : ${C.dealers[mine].stock} u — vend ${2 * dl} u/min (−15%)${dl < 3 ? ' — améliorable' : ' — NIVEAU MAX'}</div></div><div style="display:flex;gap:5px"><button data-a="cx:supply:${mine}" class="green">Fournir ×10</button>${dl < 3 ? `<button data-a="cx:updealer:${mine}" class="gold">${U.fmt(15000 * dl)}</button>` : ''}</div></div>`;
      } else {
        html += `<div class="row"><div class="info"><div class="name">${d.name}</div><div class="desc">Recrute un dealer sur ce territoire</div></div><button data-a="cx:hire:${d.id}">${U.fmt(8000)}</button></div>`;
      }
    }

    html += '<div class="secTitle">Blanchiment (via tes business)</div>';
    const ownedBiz = G.eco.businesses.filter(b => b.owned).length;
    html += `<div class="row"><div class="info"><div class="name">🧼 Blanchir 1 000$</div><div class="desc">85% récupérés en propre — capacité ${ownedBiz * 2000}$/min (${ownedBiz} business)</div></div><button data-a="cx:launder:1000" class="green">Blanchir</button></div>`;
    html += `<div class="row"><div class="info"><div class="name">🧼 Blanchir tout</div><div class="desc">Solde sale actuel : ${U.fmt(C.dirty)}</div></div><button data-a="cx:launder:all" class="green">Tout blanchir</button></div>`;
    return html;
  };

  C.action = function (cmd, arg) {
    switch (cmd) {
      case 'buyprop': C.buyProperty(arg); break;
      case 'seed': C.buySeed(arg); break;
      case 'water': C.waterAll(); break;
      case 'harvest': C.harvest(); break;
      case 'lab': C.startBatch(arg); break;
      case 'reagent': C.buyReagent(); break;
      case 'sell': C.sellNearby(); break;
      case 'deliver': C.deliverContract(); break;
      case 'convoy': C.launchConvoy(); break;
      case 'hire': C.hireDealer(arg); break;
      case 'supply': C.supplyDealer(parseInt(arg)); break;
      case 'updealer': C.upgradeDealer(parseInt(arg)); break;
      case 'launder': C.launder(arg === 'all' ? C.dirty : parseInt(arg)); break;
      case 'veg': C.buyVeg(arg); break;
      case 'harvestveg': C.harvestVeg(); break;
      case 'sellveg': C.sellVeg(arg); break;
    }
  };
})();
