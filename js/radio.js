'use strict';
(function () {
  const R = {};
  G.radio = R;

  R.stations = [
    { name: '📻 Shadow FM', desc: 'Synthwave néon', bpm: 104, key: 220, scale: [0, 3, 5, 7, 10], bass: 'sawtooth', lead: 'square' },
    { name: '🎤 Boom Bap 103', desc: 'Hip-hop old school', bpm: 88, key: 165, scale: [0, 3, 5, 8, 10], bass: 'triangle', lead: 'sawtooth' },
    { name: '🌙 Nuit Étoilée', desc: 'Chill lo-fi', bpm: 72, key: 196, scale: [0, 2, 5, 7, 9], bass: 'sine', lead: 'triangle' },
    { name: '⚡ Voltage Rock', desc: 'Électro agressive', bpm: 132, key: 262, scale: [0, 2, 3, 7, 8], bass: 'sawtooth', lead: 'square' }
  ];

  R.station = -1;
  R.step = 0;
  R.nextT = 0;
  R.melody = 0;
  R.heard = 0;
  R.heardList = [];

  R.ison = () => R.station >= 0 && R.station < R.stations.length;

  R.resetHeard = function () { R.heardList = []; R.heard = 0; };

  R.next = function () {
    if (G.state.screen !== 'play') return;
    R.station++;
    if (R.station >= R.stations.length) {
      R.station = -1;
      G.ui.toast('📻 Radio coupée');
    } else {
      R.step = 0; R.nextT = 0; R.melody = 0;
      if (!R.heardList.includes(R.station)) { R.heardList.push(R.station); R.heard = R.heardList.length; }
      G.ui.toast(R.stations[R.station].name + ' — ' + R.stations[R.station].desc);
    }
    G.sfx.ui();
  };

  R.note = function (freq, dur, type, vol, when) {
    const c = G.sfx.ctx;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    o.connect(g); g.connect(G.sfx.master);
    o.start(when); o.stop(when + dur + 0.05);
  };

  R.drum = function (when, hat) {
    const c = G.sfx.ctx;
    const n = Math.floor(c.sampleRate * (hat ? 0.04 : 0.12));
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = hat ? 'highpass' : 'lowpass';
    f.frequency.value = hat ? 6000 : 200;
    const g = c.createGain(); g.gain.value = hat ? 0.06 : 0.25;
    s.connect(f); f.connect(g); g.connect(G.sfx.master);
    s.start(when);
  };

  R.update = function () {
    if (!R.ison() || !G.settings.sound) return;
    if (!G.player.inCar) return;
    const c = G.sfx.ctx;
    if (!c || c.state !== 'running') return;
    const st = R.stations[R.station];
    const spb = 60 / st.bpm / 2;
    if (c.currentTime < R.nextT) return;
    R.nextT = Math.max(R.nextT, c.currentTime) + spb;
    const when = R.nextT;
    const s = R.step++;
    const sc = st.scale;
    if (s % 4 === 0) R.drum(when, false);
    if (s % 2 === 1) R.drum(when, true);
    if (s % 2 === 0) {
      const deg = sc[(s / 2) % sc.length];
      R.note(st.key / 2 * Math.pow(2, deg / 12), spb * 1.8, st.bass, 0.08, when);
    }
    if (s % 8 === 0) R.melody = U.randi(0, sc.length - 1);
    if (s % 2 === 0 || Math.random() < 0.4) {
      R.melody = U.clamp(R.melody + U.pick([-1, 0, 0, 1]), 0, sc.length - 1);
      const oct = Math.random() < 0.3 ? 2 : 1;
      R.note(st.key * oct * Math.pow(2, sc[R.melody] / 12), spb * 0.9, st.lead, 0.045, when);
    }
  };
})();
