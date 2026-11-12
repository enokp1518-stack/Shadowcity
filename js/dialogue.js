'use strict';
(function () {
  const PITCH = { ped: 460, cop: 250, gang: 330, creature: 120, boss: 80, dealer: 380 };
  const LINES = {
    ped: {
      idle: ['Belle journ\u00e9e \u00e0 Shadow City...', 'J\u2019ai encore entendu des coups de feu hier...', 'Cette ville change trop vite...', 'Tu as vu la nouvelle supercar ?', 'Les taxis conduisent comme des fous ici !'],
      scared: ['Au secours !', 'Il a une arme !!', 'Je ne t\u2019ai rien fait !', 'Aaaah !', 'Laisse-moi partir !'],
      happy: ['Super concert hier !', 'J\u2019adore cette ville !', 'Passe une bonne journ\u00e9e !']
    },
    cop: {
      idle: ['Rien \u00e0 signaler...', 'Circulez, il n\u2019y a rien \u00e0 voir.', 'Reste tranquille, citoyen.'],
      angry: ['HALTE ! Police !', 'Ne bouge plus !', 'Tu finis en menottes !', 'R\u00e9siste pas !']
    },
    gang: {
      idle: ['Ce territoire est \u00e0 nous...', 'Casse-toi d\u2019ici, gamin.', 'Tu cherches la guerre ?'],
      angry: ['Tu vas le payer !', 'Personne ne nous manque de respect !', 'Pr\u00e9pare-toi \u00e0 mourir !']
    },
    creature: { idle: ['Grrrrr...', '*grognement sourd*'], angry: ['GRRAAAHH !'] },
    boss: { idle: ['Tu oses me d\u00e9fier, mortel ?'], angry: ['TU VAS TOMBER !'] }
  };

  let box = null;
  function ensureBox() {
    if (box || !document.body || !document.body.appendChild) return;
    box = document.createElement('div');
    box.id = 'bubbles';
    document.body.appendChild(box);
  }

  G.dialogue = {
    t: 0, scanT: 0, talkers: [],
    say(npc, text, mood) {
      if (!npc || npc.dead || !text) return;
      npc.talk = { text, t: 0, dur: Math.max(1.6, text.length * 0.06), flapT: 0, open: false };
      if (mood) G.setFace(npc.obj, mood);
      ensureBox();
      if (box) {
        if (!npc.bubbleEl) {
          const el = document.createElement('div');
          el.className = 'bubble';
          box.appendChild(el);
          npc.bubbleEl = el;
        }
        npc.bubbleEl.textContent = text;
      }
      if (!this.talkers.includes(npc)) this.talkers.push(npc);
    },
    update(dt) {
      this.scanT -= dt;
      const p = G.player;
      if (this.scanT <= 0) {
        this.scanT = 0.6;
        if (p && G.state.screen === 'play') {
          const wanted = G.player.wanted || 0;
          for (const n of G.npcs) {
            if (n.dead || n.talk || !n.type) continue;
            const d = Math.sqrt(U.d2(n.obj.position.x, n.obj.position.z, p.pos.x, p.pos.z));
            if (d > 16) continue;
            const bank = LINES[n.type];
            if (!bank) continue;
            if (n.type === 'ped') {
              if (n.state === 'flee' && Math.random() < 0.5) this.say(n, U.pick(bank.scared), 'scared');
              else if (Math.random() < 0.12) this.say(n, U.pick(Math.random() < 0.5 ? bank.idle : bank.happy));
            } else if (n.type === 'cop') {
              if (wanted > 0 && Math.random() < 0.4) this.say(n, U.pick(bank.angry), 'angry');
              else if (Math.random() < 0.08) this.say(n, U.pick(bank.idle));
            } else if (n.type === 'gang') {
              if ((n.aggro || (G.modes.war.active && n.warTag)) && Math.random() < 0.4) this.say(n, U.pick(bank.angry), 'angry');
              else if (Math.random() < 0.1) this.say(n, U.pick(bank.idle));
            } else if (Math.random() < 0.2) this.say(n, U.pick(bank.idle));
          }
        }
      }
      for (let i = this.talkers.length - 1; i >= 0; i--) {
        const n = this.talkers[i];
        const tk = n.talk;
        if (!tk || n.dead) {
          if (n.bubbleEl && n.bubbleEl.remove) n.bubbleEl.remove();
          n.bubbleEl = null; n.talk = null;
          this.talkers.splice(i, 1);
          continue;
        }
        tk.t += dt; tk.flapT -= dt;
        if (tk.flapT <= 0) {
          tk.flapT = U.rand(0.07, 0.13);
          tk.open = !tk.open;
          G.setFaceOpen(n.obj, tk.open);
          G.sfx.voice((PITCH[n.type] || 400) * U.rand(0.9, 1.15));
        }
        if (n.bubbleEl && G.camera) {
          const v = G.V3(n.obj.position.x, n.obj.position.y + 2.6 * (n.obj.scale.y || 1), n.obj.position.z);
          v.project(G.camera);
          if (v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1) {
            n.bubbleEl.style.display = 'block';
            n.bubbleEl.style.left = ((v.x * 0.5 + 0.5) * 100) + '%';
            n.bubbleEl.style.top = ((-v.y * 0.5 + 0.5) * 100) + '%';
          } else n.bubbleEl.style.display = 'none';
        }
        if (tk.t >= tk.dur) {
          G.setFaceOpen(n.obj, false);
          if (n.bubbleEl && n.bubbleEl.remove) n.bubbleEl.remove();
          n.bubbleEl = null; n.talk = null;
          this.talkers.splice(i, 1);
        }
      }
    }
  };
})();
