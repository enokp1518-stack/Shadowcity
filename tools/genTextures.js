'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function writePNG(file, w, h, rgb) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    rgb.copy ? rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3)
      : Buffer.from(rgb.buffer, y * w * 3, w * 3).copy(raw, y * (w * 3 + 1) + 1);
  }
  const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
  fs.writeFileSync(file, png);
  console.log('wrote', file, (png.length / 1024).toFixed(0) + 'KB');
}

function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNoise(S, cells, seed) {
  const rnd = mulberry(seed);
  const g = new Float32Array(cells * cells);
  for (let i = 0; i < g.length; i++) g[i] = rnd();
  return (x, y) => {
    const fx = (x / S) * cells, fy = (y / S) * cells;
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const tx = fx - x0, ty = fy - y0;
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const i00 = (y0 % cells) * cells + (x0 % cells);
    const i10 = (y0 % cells) * cells + ((x0 + 1) % cells);
    const i01 = ((y0 + 1) % cells) * cells + (x0 % cells);
    const i11 = ((y0 + 1) % cells) * cells + ((x0 + 1) % cells);
    const a = g[i00] + (g[i10] - g[i00]) * sx;
    const b = g[i01] + (g[i11] - g[i01]) * sx;
    return a + (b - a) * sy;
  };
}

function hash2(r, c, seed) {
  let h = (r * 374761393 + c * 668265263 + seed * 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function normalFromHeight(S, height, strength) {
  const rgb = Buffer.alloc(S * S * 3);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const xl = height[y * S + ((x - 1 + S) % S)], xr = height[y * S + ((x + 1) % S)];
      const yu = height[((y - 1 + S) % S) * S + x], yd = height[((y + 1) % S) * S + x];
      let nx = (xl - xr) * strength, ny = (yu - yd) * strength, nz = 1;
      const l = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const i = (y * S + x) * 3;
      rgb[i] = Math.round((nx / l * 0.5 + 0.5) * 255);
      rgb[i + 1] = Math.round((ny / l * 0.5 + 0.5) * 255);
      rgb[i + 2] = Math.round((nz / l * 0.5 + 0.5) * 255);
    }
  }
  return rgb;
}

function genBrick(S, outDir) {
  const bh = 64, bw = 128, mo = 8;
  const palette = [[156, 74, 50], [138, 63, 44], [163, 84, 58], [124, 56, 38], [148, 70, 47], [112, 50, 36]];
  const patina = makeNoise(S, 3, 11);
  const patina2 = makeNoise(S, 6, 12);
  const mossN = makeNoise(S, 8, 13);
  const mossN2 = makeNoise(S, 16, 14);
  const grain = makeNoise(S, 64, 15);
  const rgb = Buffer.alloc(S * S * 3);
  const height = new Float32Array(S * S);
  for (let y = 0; y < S; y++) {
    const row = Math.floor(y / bh);
    const yy = y - row * bh;
    const inH = yy >= mo && yy < bh - mo;
    const edgeH = Math.min(yy, bh - yy) / mo;
    for (let x = 0; x < S; x++) {
      const xo = (row % 2) * (bw / 2);
      const xx = ((x + xo) % S + S) % S;
      const col = Math.floor(xx / bw);
      const xxx = xx - col * bw;
      const inV = xxx >= mo && xxx < bw - mo;
      const edgeV = Math.min(xxx, bw - xxx) / mo;
      const brick = inH && inV;
      const i = (y * S + x) * 3;
      let r, g, b, hgt;
      if (brick) {
        const hv = hash2(row, col, 7);
        const p = palette[Math.floor(hv * palette.length)];
        const bright = 0.85 + hv * 0.3 + (grain(x, y) - 0.5) * 0.22;
        r = p[0] * bright; g = p[1] * bright; b = p[2] * bright;
        const pat = patina(x, y) * 0.6 + patina2(x, y) * 0.4;
        if (pat > 0.58) {
          const f = 1 - Math.min(1, (pat - 0.58) * 2.2) * 0.45;
          r *= f; g *= f; b *= f * 1.05;
        }
        hgt = 0.75 + (grain(x, y) - 0.5) * 0.15;
        const edge = Math.min(edgeH, edgeV);
        const moss = Math.max(0, mossN(x, y) * 0.65 + mossN2(x, y) * 0.35 - 0.52) * 3.2;
        const m = Math.min(1, moss * (0.35 + 0.65 * (1 - Math.min(1, edge))));
        if (m > 0) {
          const mv = 0.8 + (grain(x, y) - 0.5) * 0.4;
          r = r * (1 - m) + 74 * mv * m;
          g = g * (1 - m) + 107 * mv * m;
          b = b * (1 - m) + 58 * mv * m;
          hgt += m * 0.1;
        }
      } else {
        const mv = 150 + (grain(x, y) - 0.5) * 26 + (patina2(x, y) - 0.5) * 18;
        r = mv; g = mv * 0.97; b = mv * 0.9;
        hgt = 0.3;
      }
      rgb[i] = Math.max(0, Math.min(255, Math.round(r)));
      rgb[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
      rgb[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
      height[y * S + x] = hgt;
    }
  }
  writePNG(path.join(outDir, 'brick_diffuse.png'), S, S, rgb);
  writePNG(path.join(outDir, 'brick_normal.png'), S, S, normalFromHeight(S, height, 5));
}

function genConcrete(S, outDir) {
  const n1 = makeNoise(S, 4, 21);
  const n2 = makeNoise(S, 12, 22);
  const n3 = makeNoise(S, 32, 23);
  const n4 = makeNoise(S, 96, 24);
  const stains = makeNoise(S, 2, 25);
  const rgb = Buffer.alloc(S * S * 3);
  const height = new Float32Array(S * S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let v = 46 + (n1(x, y) - 0.5) * 16 + (n2(x, y) - 0.5) * 12 + (n3(x, y) - 0.5) * 8 + (n4(x, y) - 0.5) * 5;
      const st = stains(x, y);
      if (st > 0.6) v -= Math.min(1, (st - 0.6) * 3) * 10;
      const pore = n4((x * 7.3) % S, (y * 7.3) % S);
      if (pore > 0.8) v -= 16;
      const i = (y * S + x) * 3;
      rgb[i] = Math.max(0, Math.min(255, Math.round(v)));
      rgb[i + 1] = Math.max(0, Math.min(255, Math.round(v * 1.02)));
      rgb[i + 2] = Math.max(0, Math.min(255, Math.round(v * 1.08)));
      height[y * S + x] = (n1(x, y) * 0.4 + n2(x, y) * 0.3 + n3(x, y) * 0.2 + n4(x, y) * 0.1) - (pore > 0.8 ? 0.15 : 0);
    }
  }
  writePNG(path.join(outDir, 'concrete_diffuse.png'), S, S, rgb);
  writePNG(path.join(outDir, 'concrete_normal.png'), S, S, normalFromHeight(S, height, 3.5));
}

const outDir = path.join(__dirname, '..', 'textures');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
genBrick(1024, outDir);
genConcrete(1024, outDir);
console.log('done');
