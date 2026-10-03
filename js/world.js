'use strict';
/* Isometrische Welt: Kacheln, Level-Generatoren und gecachter Boden. */
var World = (function () {
  var TW = 32, TH = 16;
  var T = { GRASS: 0, ROADX: 1, ROADY: 2, CROSS: 3, WATER: 4, SAND: 5, CONCRETE: 6, PARK: 7, FIELD: 8, ROCK: 9, SNOW: 10, DIRT: 11, LAVA: 12, DEEP: 13, RAIL: 14 };
  var hash = Pix.hash, sh = Pix.shade;

  function rng(seed) { var s = seed >>> 0; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

  /* ---------- Kachel-Bilder (pixelgenau, pro Palette gecacht) ---------- */
  function tileImage(type, pal, variant) {
    var cv = document.createElement('canvas'); cv.width = TW; cv.height = TH;
    var g = cv.getContext('2d'), im = g.createImageData(TW, TH), d = im.data;
    for (var py = 0; py < TH; py++) {
      var hw = (py < 8 ? py + 1 : 16 - py) * 2;
      for (var px = 16 - hw; px < 16 + hw; px++) {
        var sx = px + 0.5 - 16, sy = py + 0.5;
        var u = (sx / 16 + sy / 8) / 2, v = (sy / 8 - sx / 16) / 2; // lokale Weltkoordinaten 0..1
        var n = hash(px, py, variant * 31 + type);
        var c = pal.grass;
        switch (type) {
          case T.GRASS: c = n < 0.15 ? sh(pal.grass, 0.08) : n > 0.9 ? sh(pal.grass, -0.1) : pal.grass; break;
          case T.PARK: c = n < 0.2 ? sh(pal.park, 0.1) : pal.park; if (n > 0.97) c = '#e8d040'; break;
          case T.WATER: case T.DEEP:
            c = type === T.DEEP ? pal.deep : pal.water;
            if (Math.floor((u * 3 + v * 7 + variant) * 3) % 7 === 0 && n > 0.4) c = sh(c, 0.18); break;
          case T.SAND: c = n < 0.3 ? sh(pal.sand, -0.06) : pal.sand; break;
          case T.CONCRETE: c = pal.concrete; if (u < 0.04 || v < 0.04) c = sh(pal.concrete, 0.12); else if (n > 0.93) c = sh(pal.concrete, -0.08); break;
          case T.FIELD: c = Math.floor(v * 8) % 2 ? pal.field : sh(pal.field, -0.15); if (n > 0.8) c = sh(c, 0.1); break;
          case T.ROCK: c = n < 0.3 ? sh(pal.rock, -0.12) : n > 0.85 ? sh(pal.rock, 0.12) : pal.rock; break;
          case T.SNOW: c = n < 0.2 ? '#dce4ee' : '#f4f8fc'; break;
          case T.DIRT: c = n < 0.3 ? sh(pal.dirt, -0.1) : pal.dirt; break;
          case T.LAVA: c = n < 0.4 ? '#ff7a1a' : n < 0.7 ? '#e0401a' : '#ffc040'; break;
          case T.RAIL: // Gleisbett entlang x mit Schwellen und zwei Schienen
            c = n < 0.4 ? '#6e6a62' : '#7c776c';
            if (Math.floor(u * 8) % 2 === 0 && v > 0.22 && v < 0.78) c = '#5a3e26';
            if (Math.abs(v - 0.36) < 0.035 || Math.abs(v - 0.64) < 0.035) c = '#c8ccd2';
            break;
          case T.ROADX: case T.ROADY: case T.CROSS:
            c = pal.road;
            var a = type === T.ROADY ? u : v, b = type === T.ROADY ? v : u;
            if (type !== T.CROSS) {
              if (a < 0.12 || a > 0.88) c = pal.walk;
              else if (Math.abs(a - 0.5) < 0.045 && Math.floor(b * 4) % 2 === 0) c = pal.line;
            } else {
              if ((u < 0.12 || u > 0.88) && (v < 0.12 || v > 0.88)) c = pal.walk;
              else if ((u < 0.2 || u > 0.8) && Math.floor(v * 10) % 2 === 0 && v > 0.15 && v < 0.85) c = sh(pal.road, 0.25);
            }
            if (n > 0.95) c = sh(c, -0.08);
            break;
        }
        var p = (py * TW + px) * 4, col = Pix.rgb(c);
        d[p] = col[0]; d[p + 1] = col[1]; d[p + 2] = col[2]; d[p + 3] = 255;
      }
    }
    g.putImageData(im, 0, 0);
    return cv;
  }

  /* ---------- Karte ---------- */
  function Map(W, H, pal) {
    this.W = W; this.H = H; this.pal = pal;
    this.t = new Uint8Array(W * H);
    this.b = [];      // Gebäude
    this.occ = {};    // Kachel -> Gebäude
  }
  Map.prototype.T = function (x, y) { if (x < 0 || y < 0 || x >= this.W || y >= this.H) return -1; return this.t[y * this.W + x]; };
  Map.prototype.S = function (x, y, v) { if (x < 0 || y < 0 || x >= this.W || y >= this.H) return; this.t[y * this.W + x] = v; };
  Map.prototype.at = function (x, y) { return this.T(Math.floor(x), Math.floor(y)); };
  Map.prototype.isWater = function (x, y) { var t = this.at(x, y); return t === T.WATER || t === T.DEEP; };
  Map.prototype.add = function (i, j, spr, o) {
    var k = i + ',' + j;
    if (this.occ[k] || i < 0 || j < 0 || i >= this.W || j >= this.H) return null;
    var b = {
      x: i + 0.5, y: j + 0.5, spr: spr, hp: o.hp || 60, max: o.hp || 60, score: o.score || 50,
      r: o.r || 0.5, dead: false, burn: 0, kind: o.kind || 'bld', tall: spr.h, flash: 0, nuclear: !!o.nuclear, egg: o.egg || null
    };
    this.b.push(b); this.occ[k] = b;
    return b;
  };

  // Standard-Hochhaus
  function office(m, i, j, R, h, night, style) {
    var s = officeSprite(R, h, night, m.pal === PAL.snow, (i * 7 + j) % 6, style);
    return m.add(i, j, s, { hp: 40 + s.tall * 2, score: 50 + s.tall * 3 });
  }
  function officeSprite(R, h, night, snow, seed, style) {
    var styles = night ? ['glass', 'office', 'dark', 'brown', 'teal', 'white'] : ['glass', 'office', 'white', 'brown', 'teal', 'gold'];
    var sty = style !== undefined ? styles[style % styles.length] : styles[Math.floor(R() * styles.length)];
    h = Math.round(h / 4) * 4 + 8;
    var secs;
    if (h > 52 && R() < 0.65) {
      var h1 = Math.round(h * 0.6 / 4) * 4;
      secs = [{ a: 14, h: h1 }, { a: 10.5, h: h - h1 }];
      if (h > 80 && R() < 0.5) secs.push({ a: 6.5, h: 8 });
    } else secs = [{ a: 14, h: h }];
    var roofs = h > 70 ? ['ant', 'ant', 'heli', 'ac'] : ['ant', 'tank', 'tank', 'ac', 'ac', null];
    var tspr = Sprites.tower({
      secs: secs, st: sty, night: !!night, lit: night ? 0.45 : 0, seed: seed, shop: h < 60 || R() < 0.6,
      awn: ['#b03a2a', '#2a6a3a', '#2a4a8a', '#c8a020'][Math.floor(R() * 4)], roof: roofs[Math.floor(R() * roofs.length)], shadow: !night, snow: !!snow
    });
    return tspr;
  }
  function house(m, i, j, R, night) {
    var roofs = ['#a83a28', '#34507c', '#44444c', '#7c5028'];
    var roof = roofs[Math.floor(R() * roofs.length)];
    var wl = '#dcd4c0', wr = '#b0a894';
    if (night) { roof = sh(roof, -0.4); wl = sh(wl, -0.45); wr = sh(wr, -0.5); }
    var spr = Sprites.prism({ a: 11, h: 8 + Math.floor(R() * 2) * 5, wl: wl, wr: wr, roof: roof, win: '#3a3a36', winLit: '#ffd860', lit: night ? 0.6 : 0, seed: 3, tiles: 1 });
    return m.add(i, j, spr, { hp: 30, score: 30 });
  }
  function special(m, i, j, kind, o) { return m.add(i, j, Sprites.special(kind), o || {}); }

  /* ---------- Paletten ---------- */
  var PAL = {
    night: { grass: '#1e3a28', park: '#24482c', water: '#10284c', deep: '#0a1c3a', sand: '#6c6448', concrete: '#44485a', road: '#2c303c', walk: '#555a68', line: '#b8a040', field: '#3c4a28', rock: '#403c3c', dirt: '#4a3c2c', sky: '#070b1e', edge: '#2a2018' },
    dusk: { grass: '#5c7a3c', park: '#4c6c34', water: '#2c5a80', deep: '#1c4468', sand: '#c8b080', concrete: '#9a8c80', road: '#5c5450', walk: '#a09080', line: '#e8d070', field: '#8a9a44', rock: '#7a6a5a', dirt: '#8a6a44', sky: '#3a1c2c', edge: '#5a3c24' },
    day: { grass: '#6c9c44', park: '#5a8c3c', water: '#3c7cbc', deep: '#2c64a0', sand: '#dcc890', concrete: '#a8a8a0', road: '#6a6a70', walk: '#b8b8b0', line: '#f0f0e8', field: '#9cb04c', rock: '#8a8278', dirt: '#9c7a4c', sky: '#8cc4ec', edge: '#6a4a2c' },
    smog: { grass: '#4c5a3a', park: '#44523a', water: '#3a4a44', deep: '#2c3a36', sand: '#8a8468', concrete: '#7a766c', road: '#4a4844', walk: '#8a867c', line: '#c8b870', field: '#6a7040', rock: '#5a544c', dirt: '#6a5a44', sky: '#4a4436', edge: '#3a2e20' },
    red: { grass: '#2a3424', park: '#2c3a26', water: '#1c2440', deep: '#141a30', sand: '#5c5040', concrete: '#4c4448', road: '#302a2e', walk: '#5c5258', line: '#d0a040', field: '#3c4028', rock: '#403838', dirt: '#4a3a2c', sky: '#2a0a10', edge: '#2a1810' },
    snow: { grass: '#e6ecf2', park: '#d8e2ea', water: '#3a5a7a', deep: '#2a4a6a', sand: '#cfd4d8', concrete: '#bcc2ca', road: '#6e737c', walk: '#d2d8de', line: '#e8e8f0', field: '#dfe6ec', rock: '#8a8e96', dirt: '#a0a4aa', sky: '#8eaac4', edge: '#5a5048' },
    tropic: { grass: '#4c9a3c', park: '#3c8a34', water: '#2a9ab8', deep: '#1a74a0', sand: '#ecd8a0', concrete: '#b0aca0', road: '#6a6a70', walk: '#c8c4b8', line: '#f0f0e8', field: '#8ab04c', rock: '#6a6058', dirt: '#8a6a44', sky: '#7ad0f0', edge: '#6a4a2c' },
    island: { grass: '#3c8a3c', park: '#2c7a34', water: '#2c8cb0', deep: '#1c6c94', sand: '#e8d49c', concrete: '#8a8a80', road: '#6a6a70', walk: '#b8b8b0', line: '#f0f0e8', field: '#7aa04c', rock: '#5a5048', dirt: '#7a5a3c', sky: '#f0a868', edge: '#5a3c24' }
  };

  /* ---------- Level-Generatoren ---------- */
  function genTokyo(seed) {
    var W = 36, H = 36, m = new Map(W, H, PAL.night), R = rng(seed || 1954), i, j;
    for (j = 0; j < H; j++) for (i = 0; i < W; i++) {
      var t = T.CONCRETE;
      if (i < 6) t = T.DEEP; else if (i < 8) t = T.WATER; else if (i === 8) t = T.SAND;
      m.S(i, j, t);
    }
    var rx = [11, 17, 23, 29, 35], ry = [3, 9, 15, 21, 27, 33];
    for (j = 0; j < H; j++) for (i = 9; i < W; i++) {
      var onX = ry.indexOf(j) >= 0, onY = rx.indexOf(i) >= 0;
      if (onX && onY) m.S(i, j, T.CROSS); else if (onX) m.S(i, j, T.ROADX); else if (onY) m.S(i, j, T.ROADY);
    }
    // Hafen
    for (j = 0; j < H; j += 1) if (R() < 0.35 && m.T(9, j) === T.CONCRETE) {
      var cc = ['#c83a2a', '#2a6ac8', '#e0a020', '#3a9a4a'][Math.floor(R() * 4)];
      m.add(9, j, Sprites.prism({ a: 9, h: 6, wl: sh(cc, -0.4), wr: sh(cc, -0.55), roof: sh(cc, -0.3), band: 2 }), { hp: 20, score: 20 });
    }
    special(m, 10, 30, 'oiltank', { hp: 30, score: 150 }); special(m, 10, 31, 'oiltank', { hp: 30, score: 150 });
    special(m, 10, 7, 'reactor', { hp: 90, score: 500, nuclear: true });
    special(m, 20, 12, 'tower', { hp: 140, score: 1000, egg: 'tower' });
    for (j = 0; j < H; j++) for (i = 10; i < W; i++) {
      if (m.T(i, j) !== T.CONCRETE) continue;
      var dc = Math.sqrt((i - 24) * (i - 24) + (j - 18) * (j - 18));
      var close = Math.max(0, 1 - dc / 20);
      if (R() < 0.12) { m.S(i, j, T.PARK); if (R() < 0.6) special(m, i, j, 'tree', { hp: 10, score: 10 }); continue; }
      if (R() < 0.62) office(m, i, j, R, 12 + R() * 22 + close * 70 * R(), true);
    }
    return {
      map: m, start: [3.5, 18.5], llama: [15.5, 5.5], bossAt: [33, 33], night: true, seaStart: true,
      bg: null
    };
  }

  // Straßenraster: Straße alle 6 Kacheln
  function grid(m, x0, y0, x1, y1, step) {
    for (var j = y0; j < y1; j++) for (var i = x0; i < x1; i++) {
      var t = m.T(i, j);
      if (t === T.WATER || t === T.DEEP || t === T.SAND) continue;
      var onX = (j - y0) % step === 0, onY = (i - x0) % step === 0;
      if (onX && onY) m.S(i, j, T.CROSS); else if (onX) m.S(i, j, T.ROADX); else if (onY) m.S(i, j, T.ROADY);
    }
  }

  function genOsaka(pal, seed, kyoto) {
    var W = 36, H = 36, m = new Map(W, H, pal || PAL.day), R = rng(seed || 1955), i, j;
    for (j = 0; j < H; j++) for (i = 0; i < W; i++) m.S(i, j, T.CONCRETE);
    // Fluss Yodo diagonal
    for (i = 0; i < W; i++) { var ry = 24 + Math.round(Math.sin(i / 5) * 2); for (j = ry; j < ry + 3; j++) m.S(i, j, T.WATER); }
    grid(m, 2, 2, W, H, 6);
    // Burgpark
    for (j = 6; j < 13; j++) for (i = 20; i < 28; i++) m.S(i, j, T.PARK);
    for (j = 6; j < 13; j++) { m.S(19, j, T.WATER); m.S(28, j, T.WATER); }
    special(m, 24, 9, kyoto ? 'pagoda' : 'castle', { hp: 150, score: 1500, r: 0.7, egg: kyoto ? null : 'castle' });
    for (j = 6; j < 13; j++) for (i = 20; i < 28; i++) if (!(i === 24 && j === 9) && R() < 0.35) special(m, i, j, 'tree', { hp: 10, score: 10 });
    special(m, 4, 31, 'reactor', { hp: 90, score: 500, nuclear: true });
    if (kyoto) { special(m, 14, 20, 'pagoda', { hp: 60, score: 300 }); special(m, 22, 13, 'torii', { hp: 20, score: 100 }); special(m, 26, 13, 'torii', { hp: 20, score: 100 }); }
    else special(m, 14, 20, 'tower', { hp: 140, score: 1000 });
    for (j = 0; j < H; j++) for (i = 0; i < W; i++) {
      if (m.T(i, j) !== T.CONCRETE) continue;
      var dc = Math.sqrt((i - 12) * (i - 12) + (j - 14) * (j - 14)), close = Math.max(0, 1 - dc / 18);
      if (R() < 0.08) { m.S(i, j, T.PARK); if (R() < 0.6) special(m, i, j, 'tree', { hp: 10, score: 10 }); continue; }
      if (R() < 0.3 && dc > 14) house(m, i, j, R, false);
      else if (R() < 0.6) office(m, i, j, R, 12 + R() * 20 + close * 64 * R(), false);
    }
    return { map: m, start: [33.5, 32.5], llama: [23.5, 11.5], bossAt: [5, 5] };
  }

  function genYokohama() {
    var W = 36, H = 36, m = new Map(W, H, PAL.smog), R = rng(1971), i, j;
    for (j = 0; j < H; j++) for (i = 0; i < W; i++) {
      var t = T.CONCRETE;
      if (j > 28) t = j > 30 ? T.DEEP : T.WATER;
      m.S(i, j, t);
    }
    // Hafenbecken
    for (j = 20; j < 29; j++) for (i = 14; i < 19; i++) m.S(i, j, T.WATER);
    grid(m, 1, 1, W, 29, 7);
    for (i = 0; i < W; i++) if (m.T(i, 28) === T.CONCRETE && R() < 0.5) {
      var cc = ['#c83a2a', '#2a6ac8', '#e0a020', '#3a9a4a'][Math.floor(R() * 4)];
      m.add(i, 27, Sprites.prism({ a: 9, h: 6, wl: sh(cc, -0.4), wr: sh(cc, -0.55), roof: sh(cc, -0.3), band: 2 }), { hp: 20, score: 20 });
    }
    for (i = 3; i < W; i += 6) special(m, i, 28, 'crane', { hp: 50, score: 200 });
    special(m, 30, 4, 'reactor', { hp: 90, score: 500, nuclear: true });
    for (j = 0; j < 28; j++) for (i = 0; i < W; i++) {
      if (m.T(i, j) !== T.CONCRETE) continue;
      var r = R();
      if (j > 12 && r < 0.18) special(m, i, j, 'factory', { hp: 60, score: 250 });
      else if (j > 12 && r < 0.3) special(m, i, j, 'oiltank', { hp: 30, score: 150 });
      else if (r < 0.62) office(m, i, j, R, 10 + R() * 34, false);
    }
    return { map: m, start: [18.5, 34.5], llama: [2.5, 3.5], bossAt: [17, 6], smog: true, seaStart: true };
  }

  function genShinjuku() {
    var W = 36, H = 36, m = new Map(W, H, PAL.red), R = rng(1995), i, j;
    for (j = 0; j < H; j++) for (i = 0; i < W; i++) m.S(i, j, T.CONCRETE);
    grid(m, 0, 0, W, H, 5);
    for (j = 16; j < 21; j++) for (i = 16; i < 21; i++) if (m.T(i, j) === T.CONCRETE) m.S(i, j, T.PARK);
    special(m, 18, 18, 'pagoda', { hp: 60, score: 300 });
    special(m, 33, 2, 'reactor', { hp: 90, score: 500, nuclear: true });
    special(m, 2, 33, 'reactor', { hp: 90, score: 500, nuclear: true });
    for (j = 0; j < H; j++) for (i = 0; i < W; i++) {
      if (m.T(i, j) !== T.CONCRETE) continue;
      var dc = Math.sqrt((i - 18) * (i - 18) + (j - 18) * (j - 18)), close = Math.max(0, 1 - dc / 22);
      if (R() < 0.1) { m.S(i, j, T.PARK); continue; }
      if (R() < 0.55) office(m, i, j, R, 20 + R() * 30 + close * 70 * R(), true);
    }
    return { map: m, start: [3.5, 3.5], llama: [18.5, 16.5], bossAt: [30, 30], night: true, red: true };
  }

  function cityFill(m, R, night, x0, y0, x1, y1, hBase, hRand, hClose, cx, cy, dens) {
    for (var j = y0; j < y1; j++) for (var i = x0; i < x1; i++) {
      if (m.T(i, j) !== T.CONCRETE || m.occ[i + ',' + j]) continue;
      var dc = Math.sqrt((i - cx) * (i - cx) + (j - cy) * (j - cy)), close = Math.max(0, 1 - dc / 18);
      if (R() < 0.08) { m.S(i, j, T.PARK); if (R() < 0.6) special(m, i, j, m.pal === PAL.snow ? 'snowpine' : 'tree', { hp: 10, score: 10 }); continue; }
      if (R() < (dens || 0.6)) office(m, i, j, R, hBase + R() * hRand + close * hClose * R(), night);
    }
  }

  function genAtoll() {
    var W = 34, H = 34, m = new Map(W, H, PAL.tropic), R = rng(1966), i, j;
    for (j = 0; j < H; j++) for (i = 0; i < W; i++) {
      var dx = (i + 0.5 - 17) / 11, dy = (j + 0.5 - 17) / 10, d = Math.sqrt(dx * dx + dy * dy) + (hash(i, j, 4) - 0.5) * 0.1;
      var t = d > 1.15 ? T.DEEP : d > 1 ? T.WATER : d > 0.86 ? T.SAND : T.GRASS;
      m.S(i, j, t);
    }
    // kleine Nebeninsel
    for (j = 26; j < 31; j++) for (i = 26; i < 31; i++) m.S(i, j, (i === 26 || i === 30 || j === 26 || j === 30) ? T.SAND : T.GRASS);
    // Fischerdorf (West) & Hafen
    for (j = 12; j < 22; j++) for (i = 8; i < 14; i++) if (m.T(i, j) === T.GRASS) m.S(i, j, (j === 15 || j === 19) ? T.ROADX : (i === 11 ? T.ROADY : T.CONCRETE));
    for (i = 4; i < 9; i++) m.S(i, 17, T.CONCRETE);
    for (j = 12; j < 22; j++) for (i = 8; i < 14; i++) if (m.T(i, j) === T.CONCRETE && R() < 0.65) house(m, i, j, R, false);
    // Hotelanlage (Ost)
    for (j = 13; j < 21; j++) for (i = 20; i < 26; i++) if (m.T(i, j) === T.GRASS) m.S(i, j, (i === 23 || j === 17) ? (i === 23 && j === 17 ? T.CROSS : i === 23 ? T.ROADY : T.ROADX) : T.CONCRETE);
    for (j = 13; j < 21; j++) for (i = 20; i < 26; i++) if (m.T(i, j) === T.CONCRETE && R() < 0.75) office(m, i, j, R, 16 + R() * 40, false, 2);
    special(m, 16, 9, 'reactor', { hp: 90, score: 500, nuclear: true });
    special(m, 15, 24, 'torii', { hp: 20, score: 100 });
    for (j = 0; j < H; j++) for (i = 0; i < W; i++) {
      var tt = m.T(i, j);
      if (tt === T.GRASS && R() < 0.28) special(m, i, j, R() < 0.7 ? 'palm' : 'tree', { hp: 10, score: 10 });
      else if (tt === T.SAND && R() < 0.07) special(m, i, j, 'palm', { hp: 10, score: 10 });
    }
    return { map: m, start: [3.5, 25.5], llama: [28.5, 28.5], bossAt: [26, 8], seaStart: true };
  }

  function genNagoya() {
    var W = 36, H = 36, m = new Map(W, H, PAL.dusk), R = rng(1992), i, j;
    for (j = 0; j < H; j++) for (i = 0; i < W; i++) m.S(i, j, i > 31 ? (i > 33 ? T.DEEP : T.WATER) : T.CONCRETE);
    grid(m, 1, 1, 31, H, 6);
    for (j = 4; j < 11; j++) for (i = 4; i < 11; i++) if (m.T(i, j) === T.CONCRETE) m.S(i, j, T.PARK);
    for (j = 4; j < 11; j++) { m.S(3, j, T.WATER); m.S(11, j, T.WATER); }
    special(m, 7, 7, 'castle', { hp: 150, score: 1500, r: 0.7, egg: 'nagoya' });
    for (j = 4; j < 11; j++) for (i = 4; i < 11; i++) if (m.T(i, j) === T.PARK && !m.occ[i + ',' + j] && R() < 0.3) special(m, i, j, 'tree', { hp: 10, score: 10 });
    special(m, 19, 15, 'tower', { hp: 140, score: 1000 });
    special(m, 28, 30, 'reactor', { hp: 90, score: 500, nuclear: true });
    cityFill(m, R, false, 0, 0, 31, H, 12, 22, 60, 20, 18, 0.62);
    return { map: m, start: [27.5, 32.5], llama: [6.5, 9.5], bossAt: [8, 18] };
  }

  function genFukuoka() {
    var W = 36, H = 36, m = new Map(W, H, PAL.night), R = rng(1994), i, j;
    for (j = 0; j < H; j++) for (i = 0; i < W; i++) m.S(i, j, i < 6 ? (i < 3 ? T.DEEP : T.WATER) : i === 6 ? T.SAND : T.CONCRETE);
    grid(m, 8, 1, W, H, 6);
    special(m, 8, 16, 'ftower', { hp: 160, score: 1200, egg: 'ftower' });
    special(m, 30, 4, 'reactor', { hp: 90, score: 500, nuclear: true });
    for (j = 0; j < H; j += 2) if (m.T(7, j) === T.CONCRETE && R() < 0.5) special(m, 7, j, 'oiltank', { hp: 30, score: 150 });
    cityFill(m, R, true, 7, 0, W, H, 14, 26, 64, 22, 20, 0.6);
    return { map: m, start: [1.5, 20.5], llama: [33.5, 33.5], bossAt: [26, 8], crystals: true, seaStart: true };
  }

  function genSapporo() {
    var W = 36, H = 36, m = new Map(W, H, PAL.snow), R = rng(1972), i, j;
    for (j = 0; j < H; j++) for (i = 0; i < W; i++) m.S(i, j, T.CONCRETE);
    grid(m, 0, 0, W, H, 6);
    // Odori-Park (Schneefestival) quer durch die Stadt
    for (i = 0; i < W; i++) for (j = 15; j < 18; j++) if (m.T(i, j) === T.CONCRETE) m.S(i, j, T.PARK);
    special(m, 3, 16, 'tower', { hp: 140, score: 1000 });
    for (i = 6; i < W; i += 3) if (!m.occ[i + ',16'] && m.T(i, 16) === T.PARK) special(m, i, 16, 'snowpine', { hp: 10, score: 10 });
    special(m, 32, 32, 'reactor', { hp: 90, score: 500, nuclear: true });
    for (j = 24; j < H; j++) for (i = 0; i < 14; i++) if (m.T(i, j) === T.CONCRETE && R() < 0.6) house(m, i, j, R, false);
    cityFill(m, R, false, 0, 0, W, H, 10, 22, 50, 22, 10, 0.6);
    return { map: m, start: [4.5, 32.5], llama: [20.5, 16.5], bossAt: [30, 5], snow: true };
  }

  function genLake() {
    var W = 36, H = 36, m = new Map(W, H, PAL.dusk), R = rng(1989), i, j;
    var cx = 20, cy = 17;
    for (j = 0; j < H; j++) for (i = 0; i < W; i++) {
      var dx = (i + 0.5 - cx) / 8.5, dy = (j + 0.5 - cy) / 7.5, d = Math.sqrt(dx * dx + dy * dy);
      var t = T.GRASS;
      if (d < 0.6) t = T.DEEP; else if (d < 1) t = T.WATER; else if (d < 1.15) t = T.SAND;
      else if (R() < 0.04) t = T.PARK;
      m.S(i, j, t);
    }
    // Reisfelder
    for (j = 3; j < 10; j++) for (i = 26; i < 34; i++) m.S(i, j, T.FIELD);
    for (j = 27; j < 33; j++) for (i = 22; i < 32; i++) m.S(i, j, T.FIELD);
    // Stadt Hakone (unten links)
    for (j = 22; j < 35; j++) for (i = 1; i < 16; i++) {
      if (j === 25 || j === 30) m.S(i, j, i === 6 || i === 11 ? T.CROSS : T.ROADX);
      else if (i === 6 || i === 11) m.S(i, j, T.ROADY);
      else m.S(i, j, T.CONCRETE);
    }
    for (j = 22; j < 35; j++) for (i = 1; i < 16; i++) {
      if (m.T(i, j) !== T.CONCRETE) continue;
      if (R() < 0.55) house(m, i, j, R, false);
      else if (R() < 0.6) office(m, i, j, R, 8 + R() * 20, false, 2 + Math.floor(R() * 2));
    }
    // Straße zum See
    for (i = 0; i < W; i++) if (m.T(i, 20) === T.GRASS || m.T(i, 20) === T.PARK) m.S(i, 20, T.ROADX);
    special(m, 9, 12, 'pagoda', { hp: 60, score: 300 });
    special(m, 12, 14, 'torii', { hp: 20, score: 100 }); special(m, 28, 14, 'torii', { hp: 20, score: 100 });
    special(m, 31, 22, 'reactor', { hp: 90, score: 500, nuclear: true });
    special(m, 32, 24, 'oiltank', { hp: 30, score: 150 });
    for (j = 0; j < H; j++) for (i = 0; i < W; i++) {
      var tt = m.T(i, j);
      if ((tt === T.GRASS || tt === T.PARK) && R() < 0.3) special(m, i, j, R() < 0.5 ? 'pine' : 'tree', { hp: 10, score: 10 });
      else if (tt === T.FIELD && R() < 0.06) house(m, i, j, R, false);
    }
    return { map: m, start: [3.5, 3.5], llama: [30.5, 6.5], bossAt: [cx, cy], lake: [cx, cy, 6.5] };
  }

  function genFuji() {
    var W = 36, H = 36, m = new Map(W, H, PAL.day), R = rng(1964), i, j;
    for (j = 0; j < H; j++) for (i = 0; i < W; i++) {
      var t = T.GRASS, dd = i + j;
      if (dd < 7) t = T.SNOW; else if (dd < 12) t = T.ROCK; else if (dd < 14) t = T.DIRT;
      else if (R() < 0.03) t = T.PARK;
      m.S(i, j, t);
    }
    for (j = 20; j < 30; j++) for (i = 2; i < 10; i++) m.S(i, j, T.FIELD);
    for (j = 4; j < 12; j++) for (i = 22; i < 30; i++) m.S(i, j, T.FIELD);
    // Autobahn & Fluss
    for (i = 0; i < W; i++) m.S(i, 19, T.ROADX);
    for (j = 0; j < H; j++) m.S(17, j, j === 19 ? T.CROSS : T.ROADY);
    for (j = 0; j < H; j++) { var rxw = 30 + Math.round(Math.sin(j / 4) * 1.5); m.S(rxw, j, T.WATER); m.S(rxw + 1, j, T.WATER); }
    // Dörfer
    function village(x0, y0, w, h) {
      for (var jj = y0; jj < y0 + h; jj++) for (var ii = x0; ii < x0 + w; ii++) {
        if (m.T(ii, jj) === T.WATER || m.T(ii, jj) === T.ROADX || m.T(ii, jj) === T.ROADY) continue;
        m.S(ii, jj, T.CONCRETE);
        if (R() < 0.7) house(m, ii, jj, R, false);
      }
    }
    village(19, 21, 7, 6); village(10, 12, 5, 5); village(20, 29, 8, 5);
    special(m, 25, 10, 'castle', { hp: 150, score: 1200, r: 0.7 });
    special(m, 14, 26, 'pagoda', { hp: 60, score: 300 });
    special(m, 27, 32, 'reactor', { hp: 90, score: 500, nuclear: true });
    for (i = 4; i < 34; i += 5) special(m, i, 17, 'pylon', { hp: 25, score: 60 });
    for (j = 0; j < H; j++) for (i = 0; i < W; i++) {
      var tt = m.T(i, j);
      if ((tt === T.GRASS || tt === T.PARK) && R() < 0.28) special(m, i, j, 'pine', { hp: 10, score: 10 });
      else if (tt === T.ROCK && R() < 0.1) special(m, i, j, 'rock', { hp: 40, score: 20 });
    }
    return { map: m, start: [18.5, 33.5], llama: [4.5, 24.5], bossAt: [6, 8], fly: true, bgFuji: true };
  }

  function genIsland() {
    var W = 30, H = 30, m = new Map(W, H, PAL.island), R = rng(1968), i, j;
    for (j = 0; j < H; j++) for (i = 0; i < W; i++) {
      var dx = (i + 0.5 - 15) / 13, dy = (j + 0.5 - 15) / 13, d = Math.sqrt(dx * dx + dy * dy) + (hash(i, j, 9) - 0.5) * 0.08;
      var t = T.GRASS;
      if (d > 1) t = T.DEEP; else if (d > 0.9) t = T.WATER; else if (d > 0.78) t = T.SAND;
      else if (d < 0.12) t = T.LAVA; else if (d < 0.26) t = T.ROCK; else if (R() < 0.08) t = T.DIRT;
      m.S(i, j, t);
    }
    for (j = 0; j < H; j++) for (i = 0; i < W; i++) {
      var tt = m.T(i, j);
      if (tt === T.GRASS && R() < 0.22) special(m, i, j, R() < 0.6 ? 'palm' : 'tree', { hp: 10, score: 10 });
      else if (tt === T.SAND && R() < 0.05) special(m, i, j, 'palm', { hp: 10, score: 10 });
      else if (tt === T.ROCK && R() < 0.3) special(m, i, j, 'rock', { hp: 40, score: 20 });
    }
    special(m, 8, 20, 'reactor', { hp: 90, score: 500, nuclear: true });
    return { map: m, start: [15.5, 24.5], llama: [22.5, 9.5], bossAt: [15, 6], island: true };
  }

  /* ---------- Boden vorrendern (einmal pro Level) ---------- */
  /* ---------- Gelände außerhalb des Spielfelds (Kulisse) ---------- */
  var MARGIN = 10;
  // Kachel außerhalb: Randkachel fortsetzen, Straßen laufen geradeaus weiter
  function extTile(m, i, j) {
    var ci = Math.max(0, Math.min(m.W - 1, i)), cj = Math.max(0, Math.min(m.H - 1, j));
    var t = m.T(ci, cj), ox = ci !== i, oy = cj !== j;
    if (!ox && !oy) return t;
    if (t === T.CROSS) t = ox && oy ? T.CONCRETE : ox ? T.ROADX : T.ROADY;
    else if (t === T.ROADX && (oy)) t = T.CONCRETE;
    else if (t === T.ROADY && (ox)) t = T.CONCRETE;
    else if (t === T.RAIL && oy) t = T.CONCRETE;
    // in der Ferne gelegentlich neue Querstraßen
    if (t === T.CONCRETE && ((ox && (i % 6 === 0)) || (oy && (j % 6 === 0)))) t = ox ? T.ROADY : T.ROADX;
    return t;
  }
  function hexA(h, a) { var c = Pix.rgb(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function fogged(spr, col) {
    if (spr.fog) return spr.fog;
    var c = document.createElement('canvas'); c.width = spr.img.width; c.height = spr.img.height;
    var g = c.getContext('2d'); g.drawImage(spr.img, 0, 0);
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = hexA(col, 0.38); g.fillRect(0, 0, c.width, c.height);
    spr.fog = { img: c, ax: spr.ax, ay: spr.ay, h: spr.h, tall: spr.tall, a: spr.a };
    return spr.fog;
  }
  // nicht zerstörbare Kulissen-Gebäude und Bäume rund um das Spielfeld
  function decorate(m) {
    var out = [], R = rng(4242 + m.W * 7), M = MARGIN, night = m.pal === PAL.night || m.pal === PAL.red;
    var tree = m.pal === PAL.snow ? 'snowpine' : (m.pal === PAL.tropic || m.pal === PAL.island) ? 'palm' : 'tree';
    for (var j = -M; j < m.H + M; j++) for (var i = -M; i < m.W + M; i++) {
      if (i >= 0 && j >= 0 && i < m.W && j < m.H) continue;
      var t = extTile(m, i, j), r = R(), spr = null;
      if (t === T.CONCRETE && r < 0.6) spr = officeSprite(R, 12 + R() * 40, night, m.pal === PAL.snow, (i * 7 + j) % 6);
      else if ((t === T.GRASS || t === T.PARK) && r < 0.22) spr = Sprites.special(tree);
      else if (t === T.SAND && tree === 'palm' && r < 0.08) spr = Sprites.special('palm');
      if (spr) {
        var f = fogged(spr, m.pal.sky);
        out.push({ x: i + 0.5, y: j + 0.5, spr: f, hp: 1e9, max: 1e9, score: 0, r: 0.5, dead: false, burn: 0, kind: 'deco', tall: f.tall || f.h, flash: 0, deco: true });
      }
    }
    return out;
  }

  /* ---------- Boden vorrendern (einmal pro Level), inkl. Kulisse ---------- */
  function renderGround(m) {
    var W = m.W, H = m.H, M = MARGIN, OX = (H + 2 * M) * 16, OY = 2 * M * 8 + 4;
    var cv = document.createElement('canvas');
    cv.width = (W + H + 4 * M) * 16; cv.height = (W + H + 4 * M) * 8 + OY;
    var g = cv.getContext('2d'), cache = {};
    for (var j = -M; j < H + M; j++) for (var i = -M; i < W + M; i++) {
      var t = extTile(m, i, j), v = ((i + 99) * 3 + (j + 99) * 5) % 3, key = t + '_' + v;
      var img = cache[key] || (cache[key] = tileImage(t, m.pal, v));
      g.drawImage(img, (i - j) * 16 + OX - 16, (i + j) * 8 + OY);
    }
    // Dunst über der Kulisse (nah leicht, fern stärker)
    function P(i, j) { return [(i - j) * 16 + OX, (i + j) * 8 + OY]; }
    function ring(a, b) {
      g.beginPath();
      [P(-b, -b), P(W + b, -b), P(W + b, H + b), P(-b, H + b)].forEach(function (p, k) { k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); });
      g.closePath();
      [P(-a, -a), P(W + a, -a), P(W + a, H + a), P(-a, H + a)].forEach(function (p, k) { k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); });
      g.closePath();
    }
    g.fillStyle = hexA(m.pal.sky, 0.22); ring(0, M); g.fill('evenodd');
    g.fillStyle = hexA(m.pal.sky, 0.28); ring(4, M); g.fill('evenodd');
    g.fillStyle = hexA(m.pal.sky, 0.35); ring(7, M); g.fill('evenodd');
    return { cv: cv, OX: OX, OY: OY, M: M };
  }

  return { T: T, TW: TW, TH: TH, gen: { okinawa: function () { var g = genOsaka(PAL.tropic, 1974); g.start = [33.5, 32.5]; return g; }, kyoto: function () { return genOsaka(PAL.dusk, 1993, true); }, sollgel: function () { var g = genIsland(); g.island = true; return g; }, tokyo: function () { return genTokyo(1954); }, tokyo84: function () { var g = genTokyo(1984); g.llama = [30.5, 8.5]; g.bossAt = [30, 6]; return g; }, osaka: function () { return genOsaka(); }, lake: genLake, atoll: genAtoll, yokohama: genYokohama, nagoya: genNagoya, fuji: genFuji, fukuoka: genFukuoka, sapporo: genSapporo, shinjuku: genShinjuku, island: genIsland }, renderGround: renderGround, decorate: decorate, PAL: PAL, rng: rng };
})();
