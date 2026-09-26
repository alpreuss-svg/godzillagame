'use strict';
/* Prozedurale Pixel-Art für alle Monster, Fahrzeuge und Gebäude. */
var Sprites = (function () {
  var R = Pix.Raster, sh = Pix.shade, hash = Pix.hash;
  var OUT = '#101410';

  function pair(r) { return { r: r.toCanvas(false), l: r.toCanvas(true) }; }
  function tex(o) { var t = {}; for (var k in o) t[k] = o[k]; return t; }
  // Rückenplatte in Ahornblatt-Form (3 Spitzen)
  function leaf(r, x, y, s, nx, ny, dx, dy, c) {
    function p(a, b) { return [x + nx * a + dx * b, y + ny * a + dy * b]; }
    r.poly([p(0, -s * 0.65), p(s * 0.95, -s * 0.55), p(s * 0.75, -s * 0.22), p(s * 1.7, 0), p(s * 0.75, s * 0.22), p(s * 0.95, s * 0.55), p(0, s * 0.65)], c);
  }
  function mkSet(fn, ax, ay, extra) {
    var S = { walk: [] };
    for (var i = 0; i < 4; i++) S.walk.push(pair(fn({ phase: i })));
    S.stand = pair(fn({ stand: true }));
    S.attack = pair(fn({ stand: true, atk: true }));
    S.w = S.stand.r.width; S.h = S.stand.r.height; S.ax = ax; S.ay = ay;
    for (var k in extra) S[k] = extra[k];
    return S;
  }

  /* ================= Godzilla / Mechagodzilla / Minilla ================= */
  var GZP = {
    godzilla: { body: '#465f49', dark: '#2b3c2f', belly: '#7f8e69', bellyD: '#65734f', plate: '#d6d4bc', plateD: '#a6a48e', glow: '#9ef4ff', glowD: '#48c4ff', eye: '#ffe04a', mouth: '#8c1c1c', claw: '#ece8d8' },
    mecha: { body: '#8f9dae', dark: '#58677a', belly: '#abb7c5', bellyD: '#7b8b9d', plate: '#c4d0dc', plateD: '#8a98a8', glow: '#ffffff', glowD: '#ffd24a', eye: '#ffe04a', mouth: '#2a2a3a', claw: '#dde4ee', accent: '#c83232' },
    minilla: { body: '#6f9a5e', dark: '#4e7444', belly: '#b8c49a', bellyD: '#98a47c', plate: '#e4e4cc', plateD: '#c0c0a8', glow: '#b8ffff', glowD: '#80e0ff', eye: '#1a1a1a', mouth: '#b04040', claw: '#f0f0e0' }
  };
  function gz(style, f) {
    var P = GZP[style], mini = style === 'minilla', mecha = style === 'mecha', k = mini ? 0.6 : 1;
    var r = new R(94 * k + 3, 77 * k + 3); r.k = k; r.ox = 1; r.oy = 1;
    var ph = f.phase || 0, pose = f.pose || '', st = f.stand || !!pose;
    var la = st ? 0 : [-3, 0, 3, 0][ph], lb = st ? 0 : [3, 0, -3, 0][ph];
    var lA = st ? 0 : [0, 3, 0, 0][ph], lB = st ? 0 : [0, 0, 0, 3][ph];
    var b = st ? 0 : [0, -1, 0, -1][ph], sw = st ? 0 : [0, 1.5, 0, -1.5][ph];
    var hx = pose === 'claw2' ? 2 : 0, hy = (pose === 'roar' ? -3 : 0) + b;
    var mouth = pose === 'breath' || pose === 'roar', m2 = pose === 'roar' ? 2 : 0;
    var glow = pose === 'breath';
    var plate = glow ? P.glow : P.plate, plateD = glow ? P.glowD : P.plateD;

    r.layer = 0;
    if (pose !== 'tail') r.curve(46, 53, 26, 71 + sw, mini ? 20 : 3, 66 + sw * 1.5, mini ? 7 : 10, 2, P.body);
    // hinteres Bein, hinterer Arm
    r.ell(59, 56, 7, 8, P.dark); r.ell(61 + lb, 63 - lB, 5.5, 7, P.dark); r.ell(64 + lb, 69.5 - lB, 7.5, 2.6, P.dark);
    r.ell(68, 39 + b, 3.5, 2.6, P.dark);
    // Rückenplatten (zwei Reihen)
    var x0 = 58, y0 = 13 + b, x1 = 40, y1 = 50, dx = x1 - x0, dy = y1 - y0, dl = Math.sqrt(dx * dx + dy * dy);
    dx /= dl; dy /= dl;
    var nx = -dy, ny = dx; if (nx > 0) { nx = -nx; ny = -ny; }
    var np = mini ? 4 : 7, i, t;
    for (var row = 0; row < 2; row++) for (i = 0; i < np; i++) {
      t = (i + 0.5) / np;
      var px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t;
      var s = (mini ? 2.5 : 3.5) + (mini ? 1.5 : 5.5) * Math.sin(Math.PI * (0.12 + 0.8 * t));
      if (mecha) { s *= 0.55; r.poly([[px - dx * s, py - dy * s], [px + dx * s, py + dy * s], [px + nx * s * 2, py + ny * s * 2]], row ? plate : plateD); continue; }
      if (row === 0) leaf(r, px + nx * 1.2 + dx * 2.2, py + ny * 1.2 + dy * 2.2, s * 0.85, nx, ny, dx, dy, plateD);
      else leaf(r, px, py, s, nx, ny, dx, dy, plate);
    }
    if (pose !== 'tail' && !mini) [0.12, 0.26, 0.4, 0.54].forEach(function (tt, j) {
      var u = 1 - tt, tx = u * u * 46 + 2 * u * tt * 26 + tt * tt * 3, ty = u * u * 53 + 2 * u * tt * (71 + sw) + tt * tt * (66 + sw * 1.5);
      var rr = 10 - 8 * tt, ss = rr * 0.55;
      r.poly([[tx - ss, ty - rr * 0.7], [tx + ss, ty - rr * 0.7], [tx - ss * 0.2, ty - rr * 0.7 - ss * 1.7]], mecha ? P.plate : plate);
    });
    // Körper
    r.layer = 1;
    r.ell(51, 45 + b, 12.5, 17, P.body); r.ell(57, 35 + b, 10, 10, P.body); r.ell(61, 26 + b, 7, 8, P.body);
    var H = function (x, y) { return [x + hx, y + hy]; };
    if (mini) {
      r.ell(64 + hx, 18 + hy, 10, 9, P.body); r.ell(73 + hx, 21 + hy, 4.5, 3.5, P.body);
      if (mouth) r.poly([H(66, 22), H(76, 21), H(75, 26), H(67, 26)], P.mouth);
    } else if (mecha) {
      r.poly([H(58, 12), H(66, 9), H(78, 14), H(78, 19), H(66, 23), H(59, 21)], P.body);
      if (mouth) { r.poly([H(62, 21), H(77, 20), H(76, 25), H(62, 24)], P.body); r.poly([H(65, 20.5), H(77, 19.8), H(77, 21.8), H(65, 22)], P.mouth); }
    } else {
      r.ell(65 + hx, 17 + hy, 7, 6, P.body);
      r.poly([H(63, 12), H(76, 15), H(78, 18), H(77, 21), H(64, 23)], P.body);
      if (mouth) {
        r.poly([H(63, 21), H(76, 22), H(75, 26 + m2), H(63, 25)], P.body);
        r.poly([H(66, 20.6), H(77.4, 21), H(76.4, 23.2 + m2 * 0.6), H(66, 23)], P.mouth);
      }
    }
    // Bauch
    r.layer = 2;
    r.ell(58, 43 + b, 6, 14, P.belly);
    r.recolor(P.belly, P.bellyD, function (x, y) { return y % Math.round(3 / k * k + (mini ? 0 : 0)) === 0; });
    if (mecha) {
      r.recolor(P.body, P.dark, function (x, y) { return y % 6 === 0; });
      r.rect(55, 31 + b, 7, 6, P.accent);
    }
    // vorderes Bein
    r.layer = 3;
    r.ell(47, 54, 10, 10, P.body); r.ell(49 + la, 62 - lA, 7, 8, P.body); r.ell(52 + la, 69 - lA, 9.5, 3, P.body);
    if (mecha) r.rect(50 + la, 58 - lA, 6, 3, P.plate);
    // vorderer Arm
    r.layer = 4;
    var claws;
    if (pose === 'claw1') { r.ell(62, 33, 5, 3.6, P.body); r.line(63, 32, 71, 19, P.body, 2.6); claws = [[71.5, 16], [73.6, 17], [69.4, 16.3]]; }
    else if (pose === 'claw2') { r.ell(63, 38, 4.5, 3.4, P.body); r.line(65, 39, 78, 41, P.body, 2.3); claws = [[80.6, 40], [80.6, 41.8], [79.6, 43.5]]; }
    else { r.ell(62, 38 + b, 4.5, 3.4, P.body); r.line(64, 39 + b, 70, 42 + b, P.body, 2.2); claws = [[72.2, 41.5 + b], [72.6, 43 + b], [71.6, 44.6 + b]]; }
    if (pose === 'tail') { r.layer = 5; r.curve(46, 57, 66, 77, 89, 63, 9, 2, P.body); }

    var tx0 = {}; tx0[P.body] = 0.16; tx0[P.dark] = 0.12;
    var sk = {}; if (glow) { sk[P.glow] = 1; }
    r.shade2({ tex: tx0, skip: sk, seed: style.length });
    // Details
    if (mecha) {
      for (var vx = 64; vx <= 75; vx++) r.dot(vx + hx, 15.5 + hy, glow ? '#ffffff' : P.eye);
      r.dot(56, 33 + b, '#ff8a8a'); r.dot(60, 33 + b, '#ff8a8a');
    } else if (mini) {
      r.dot(66 + hx, 15 + hy, P.eye); r.dot(67 + hx, 15 + hy, P.eye); r.dot(66 + hx, 16 + hy, P.eye);
    } else {
      r.line(64 + hx, 13 + hy, 71 + hx, 13.6 + hy, sh(P.body, -0.5));
      r.dot(68 + hx, 15 + hy, P.eye); r.dot(69 + hx, 15 + hy, '#221a08');
      r.dot(76 + hx, 17 + hy, '#141a12');
      if (mouth) for (var tt2 = 67; tt2 <= 76; tt2 += 2) { r.dot(tt2 + hx, 21 + hy, '#ffffff'); r.dot(tt2 + 1 + hx, 22.6 + m2 + hy, '#f0f0e0'); }
    }
    claws.forEach(function (c) { r.dot(c[0], c[1], P.claw); });
    if (pose !== 'tail' || true) { r.dot(59 + la, 70.8 - lA, P.claw); r.dot(61 + la, 70.4 - lA, P.claw); r.dot(57 + la, 71.1 - lA, P.claw); }
    r.outline(OUT);
    return r;
  }
  function gzSet(style) {
    var k = style === 'minilla' ? 0.6 : 1;
    var S = { walk: [] };
    for (var i = 0; i < 4; i++) S.walk.push(pair(gz(style, { phase: i })));
    ['stand', 'claw1', 'claw2', 'tail', 'breath', 'roar'].forEach(function (p) { S[p] = pair(gz(style, p === 'stand' ? { stand: true } : { pose: p })); });
    S.attack = S.claw2;
    S.w = S.stand.r.width; S.h = S.stand.r.height;
    S.ax = 50 * k + 1; S.ay = 71.5 * k + 1;
    S.mouth = { x: 77 * k + 1 - S.ax, y: 21.5 * k + 1 - S.ay };
    return S;
  }

  /* ================= King Ghidorah ================= */
  var GP = { body: '#dcaa2e', dark: '#9c7418', wing: '#e6b83a', wingD: '#a8801e', belly: '#f0d27a', horn: '#fff1c0', eye: '#ff3a2a', mouth: '#7a1010' };
  var GK = 1.35;
  function ghidorah(f) {
    var r = new R(74 * GK, 64 * GK); r.k = GK; r.ox = 2; r.oy = 1;
    var fl = f.stand ? 0 : f.phase || 0, mouth = f.atk;
    var ff = [0, 0.4, 1, 0.4][fl], sw = [0, 1, 0, -1][fl];
    r.layer = 0;
    r.poly([[30, 30], [22, 24], [8, 2 + ff * 24], [0, 8 + ff * 26], [4, 20 + ff * 16], [10, 25 + ff * 10], [17, 30 + ff * 5], [26, 36]], GP.wingD);
    r.curve(24, 46, 12, 44 + sw, 2, 52, 4, 1, GP.body);
    r.curve(26, 49, 14, 54 - sw, 4, 60, 4, 1, GP.dark);
    r.ell(34, 52, 4, 6, GP.dark); r.ell(36, 58, 5, 2, GP.dark);
    r.layer = 1;
    r.ell(30, 42, 11, 12, GP.body);
    r.ell(34, 44, 6, 9, GP.belly);
    r.recolor(GP.belly, sh(GP.belly, -0.15), function (x, y) { return y % 4 === 0; });
    r.layer = 2;
    r.poly([[28, 32], [24, 26], [16, 0 + ff * 26], [8, 6 + ff * 26], [12, 18 + ff * 16], [18, 24 + ff * 8], [24, 34]], GP.wing);
    var heads = [[24, 9 + sw], [44, 5 - sw], [60, 17 + sw]], bases = [[30, 33], [34, 32], [37, 35]], ctrls = [[22, 26], [40, 18], [52, 34]];
    if (mouth) heads = [[28, 11], [48, 7], [62, 19]];
    for (var i = 0; i < 3; i++) {
      r.layer = 3 + (i === 0 ? 0 : 1);
      var h = heads[i], bs = bases[i], c = ctrls[i], col = i === 0 ? GP.dark : GP.body;
      r.curve(bs[0], bs[1], c[0], c[1], h[0] - 3, h[1] + 1, 3.4, 2.6, col);
      var hx = h[0], hy = h[1];
      r.line(hx - 2, hy - 2, hx - 9, hy - 7, GP.horn, 0.8);
      r.line(hx - 1, hy - 2, hx - 7, hy - 9, GP.horn, 0.8);
      r.ell(hx, hy, 4.5, 3.4, col);
      r.poly([[hx, hy - 3], [hx + 8, hy - 1], [hx + 8, hy + 1.5], [hx, hy + 3]], col);
      if (mouth) {
        r.poly([[hx + 1, hy + 1], [hx + 8, hy + 2], [hx + 7, hy + 5], [hx, hy + 3.5]], col);
        r.poly([[hx + 2, hy + 1], [hx + 8, hy + 1], [hx + 8, hy + 2.6], [hx + 2, hy + 2.6]], GP.mouth);
      }
    }
    r.layer = 5;
    r.ell(26, 51, 5, 7, GP.body); r.ell(28, 58, 6, 2.2, GP.body);
    var tx = {}; tx[GP.body] = 0.22; tx[GP.dark] = 0.2; tx[GP.wing] = 0.08;
    r.shade2({ tex: tx, seed: 11 });
    for (i = 0; i < 3; i++) r.dot(heads[i][0] + 1, heads[i][1] - 1.5, GP.eye);
    r.line(28, 32, 16, 1 + ff * 26, sh(GP.wing, -0.3));
    r.line(28, 32, 9, 7 + ff * 26, sh(GP.wing, -0.3));
    r.outline(OUT);
    return r;
  }
  function ghidorahSet() {
    var S = mkSet(ghidorah, 32 * GK + 2, 60 * GK + 1);
    S.mouths = [[32, 11], [52, 7], [68, 19]].map(function (m) { return { x: m[0] * GK + 2 - S.ax, y: m[1] * GK + 1 - S.ay }; });
    S.mouth = S.mouths[1];
    return S;
  }

  /* ================= Biolante ================= */
  var BP = { body: '#3f7a34', dark: '#28522a', light: '#6aa84a', sap: '#ff9a2a', mouth: '#b02828', tooth: '#f4f0d8', eye: '#ffe23a' };
  var BK = 1.35;
  function biolante(f) {
    var r = new R(80 * BK, 66 * BK); r.k = BK; r.ox = 2; r.oy = 1;
    var s = f.stand ? 0 : [0, 2, 0, -2][f.phase || 0], mouth = f.atk;
    r.layer = 0;
    r.curve(16, 46, 4, 36, 4, 20 + s, 2.6, 1.6, BP.dark);
    r.curve(58, 46, 72, 40, 76, 28 - s, 2.6, 1.6, BP.dark);
    r.ell(4, 19 + s, 3, 2.5, BP.light); r.ell(76, 27 - s, 3, 2.5, BP.light);
    r.layer = 1;
    r.ell(38, 55, 32, 10, BP.dark);
    r.ell(28, 48, 18, 12, BP.body);
    r.ell(48, 50, 17, 10, BP.body);
    r.ell(38, 38, 10, 12, BP.body);
    for (var i = 0; i < 60; i++) {
      var x = 12 + hash(i, 1, 7) * 56, y = 36 + hash(i, 2, 7) * 26;
      if (r.get(Math.floor(r.tx(x)), Math.floor(r.ty(y))) === BP.body) r.line(x, y, x + 3, y + 1.5, BP.dark);
    }
    r.layer = 2;
    r.curve(40, 34, 44, 22, 52, 16, 5.5, 4.2, BP.body);
    r.ell(54, 13, 7, 5, BP.body);
    r.poly([[54, 8], [71, 11], [71, 14.5], [54, 15]], BP.body);
    if (mouth) {
      r.poly([[54, 15], [69, 18], [68, 22], [54, 19.5]], BP.body);
      r.poly([[57, 14.6], [70, 14.6], [69, 18], [57, 17.8]], BP.mouth);
    }
    r.layer = 3;
    r.curve(22, 50, 10, 46, 12, 30 - s, 2.4, 1.4, BP.body);
    r.curve(52, 52, 66, 54, 72, 46 + s, 2.4, 1.4, BP.body);
    r.ell(12, 29 - s, 3, 2.5, BP.light); r.ell(72, 45 + s, 3, 2.5, BP.light);
    var tx = {}; tx[BP.body] = 0.2; tx[BP.dark] = 0.15;
    r.shade2({ tex: tx, seed: 5 });
    [[30, 44], [44, 47], [36, 52], [24, 50], [50, 44]].forEach(function (p) { r.ell(p[0], p[1], 0.8, 0.8, BP.sap); });
    r.dot(4, 18 + s, BP.mouth); r.dot(76, 26 - s, BP.mouth); r.dot(12, 28 - s, BP.mouth); r.dot(72, 44 + s, BP.mouth);
    r.dot(57, 10.5, BP.eye); r.dot(58, 10.5, BP.eye);
    for (var t = 58; t <= 70; t += 2) { r.dot(t, 14.8, BP.tooth); if (mouth) r.dot(t - 1, 17.6, BP.tooth); }
    r.outline(OUT);
    return r;
  }
  function biolanteSet() { var S = mkSet(biolante, 40 * BK + 2, 60 * BK + 1); S.mouth = { x: 70 * BK + 2 - S.ax, y: 17 * BK + 1 - S.ay }; return S; }

  /* ================= Kamacuras (Riesen-Gottesanbeterin) ================= */
  function kamacuras(f) {
    var r = new R(68, 60); r.ox = 1; r.oy = 1;
    var C = { g: '#72ac4c', d: '#44783a', w: '#b4d894', e: '#f0e050', sc: '#e4eec0' };
    var ph = f.phase || 0, s = f.stand ? 0 : [-2, 0, 2, 0][ph], lift = f.stand ? 0 : [0, 2, 0, 0][ph], lift2 = f.stand ? 0 : [0, 0, 0, 2][ph];
    r.layer = 0;
    r.line(31, 36, 24, 44, C.d, 1.1); r.line(24, 44, 21 - s, 55 - lift2, C.d, 0.9);
    r.line(26, 36, 16, 43, C.d, 1.1); r.line(16, 43, 9 - s, 55 - lift2, C.d, 0.9);
    r.line(40, 20, 44, 27, C.d, 1.3); r.line(44, 27, 40, 16, C.d, 1);
    r.layer = 1;
    r.curve(31, 34, 18, 33, 4, 42, 6.5, 3, C.g);
    r.recolor(C.g, C.d, function (x, y) { return x < 29 && x % 4 === 0; });
    r.poly([[30, 28], [5, 35], [4, 40], [29, 33]], C.w);
    r.layer = 2;
    r.curve(30, 33, 34, 26, 40, 16, 4, 3, C.g);
    r.poly([[36, 9], [49, 10], [45, 18], [40, 17]], C.g);
    r.ell(38.5, 11, 3, 3, C.g); r.ell(47, 11.5, 2.8, 2.8, C.g);
    r.line(41, 9, 34, 0, C.d); r.line(44, 9, 52, 1, C.d);
    r.layer = 3;
    r.line(33, 36, 37, 45, C.g, 1.3); r.line(37, 45, 41 + s, 56 - lift, C.g, 1.1);
    r.line(28, 37, 23, 46, C.g, 1.3); r.line(23, 46, 18 + s, 56 - lift, C.g, 1.1);
    r.layer = 4;
    var blade;
    if (f.atk) { r.line(40, 20, 52, 14, C.g, 1.7); blade = [52, 14, 64, 25]; }
    else { r.line(40, 20, 46, 28, C.g, 1.7); blade = [46, 28, 41, 14]; }
    r.line(blade[0], blade[1], blade[2], blade[3], C.sc, 1.3);
    var tx = {}; tx[C.g] = 0.12;
    r.shade2({ tex: tx, seed: 3 });
    for (var i = 1; i < 5; i++) r.dot(blade[0] + (blade[2] - blade[0]) * i / 5 + 1, blade[1] + (blade[3] - blade[1]) * i / 5 + 1, '#ffffff');
    r.dot(38, 10.5, C.e); r.dot(39, 10.5, C.e); r.dot(47, 11, C.e); r.dot(38, 11.5, '#a09010');
    r.outline(OUT);
    return r;
  }

  /* ================= Anguirus ================= */
  function anguirus(f) {
    var r = new R(86, 58); r.ox = 1; r.oy = 1;
    var C = { b: '#8c7250', d: '#5c4832', sh: '#6e5638', sp: '#ece0c4', be: '#b49c72', e: '#ffe040', m: '#8c1c1c' };
    var ph = f.phase || 0, st = f.stand;
    var la = st ? 0 : [-3, 0, 3, 0][ph], lb = -la, lA = st ? 0 : [0, 2, 0, 0][ph], lB = st ? 0 : [0, 0, 0, 2][ph], sw = st ? 0 : [0, 1, 0, -1][ph];
    r.layer = 0;
    r.ell(60 + lb, 44 - lB, 4.5, 7, C.d); r.ell(62 + lb, 50.5 - lB, 5, 2, C.d);
    r.ell(30 + la, 44 - lA, 4.5, 7, C.d); r.ell(32 + la, 50.5 - lA, 5, 2, C.d);
    r.curve(22, 36, 10, 36 + sw, 2, 46, 6.5, 2, C.b);
    [0.2, 0.45, 0.7].forEach(function (t) { var x = 22 - t * 18, y = 36 + t * 8; r.poly([[x - 2, y - 3], [x + 2, y - 3], [x - 1, y - 8]], C.sp); });
    r.layer = 1;
    r.ell(42, 34, 22, 11, C.b); r.ell(44, 41, 16, 3.5, C.be);
    r.ell(40, 29, 20, 9, C.sh);
    for (var row = 0; row < 2; row++) for (var a = 1.08; a < 1.97; a += row ? 0.14 : 0.1) {
      var A = a * Math.PI, rx = row ? 12 : 20, ry = row ? 5.5 : 9, px = 40 + Math.cos(A) * rx, py = (row ? 27 : 29) + Math.sin(A) * ry;
      var nx = Math.cos(A), ny = Math.sin(A), l = Math.sqrt(nx * nx + ny * ny); nx /= l; ny /= l;
      var len = (row ? 4 : 6) + hash(Math.round(a * 100), row, 4) * 2;
      r.poly([[px - ny * 2.2, py + nx * 2.2], [px + ny * 2.2, py - nx * 2.2], [px + nx * len, py + ny * len]], C.sp);
    }
    r.layer = 2;
    r.ell(62, 33, 7, 6, C.b);
    r.poly([[62, 27], [74, 29], [79, 33], [76, 37], [64, 38]], C.b);
    r.poly([[75, 29], [80, 21], [78, 30]], C.sp);
    r.poly([[64, 28], [60, 20], [67, 27]], C.sp);
    if (f.atk) { r.poly([[64, 36], [78, 35], [76, 42], [64, 40]], C.b); r.poly([[66, 35.5], [78, 34.5], [77, 37], [66, 37.5]], C.m); }
    r.layer = 3;
    r.ell(62 + la, 45 - lA, 5.5, 7, C.b); r.ell(64 + la, 51 - lA, 6, 2.2, C.b);
    r.ell(28 + lb, 45 - lB, 6, 7.5, C.b); r.ell(30 + lb, 51 - lB, 6.5, 2.2, C.b);
    var tx = {}; tx[C.b] = 0.2; tx[C.sh] = 0.25;
    r.shade2({ tex: tx, seed: 9 });
    r.dot(72, 31, C.e); r.dot(73, 31, '#302010'); r.dot(78, 32, '#201810');
    r.outline(OUT);
    return r;
  }

  /* ================= Kumonga (Riesenspinne) ================= */
  function kumonga(f) {
    var r = new R(92, 58); r.ox = 1; r.oy = 1;
    var C = { b: '#5c4a38', st: '#dcb040', l: '#6c5a44', ld: '#46382a', e: '#ff3030', f: '#f0e8d0' };
    var ph = f.phase || 0, s = f.stand ? 0 : [-3, 0, 3, 0][ph], lf = f.stand ? 0 : [0, 3, 0, 0][ph];
    var far = { b: [[36, 30], [40, 29], [48, 29], [52, 30]], k: [[20, 12], [30, 8], [58, 8], [70, 12]], f: [[8, 52], [22, 52], [64, 52], [82, 52]] };
    var near = { b: [[38, 34], [42, 34], [48, 34], [52, 34]], k: [[14, 16], [26, 12], [60, 12], [74, 16]], f: [[4, 54], [18, 54], [68, 54], [88, 54]] };
    function legs(L, col, w, flip) {
      for (var i = 0; i < 4; i++) {
        var o = ((i + flip) % 2 ? s : -s), up = ((i + flip) % 2 ? lf : 0);
        r.line(L.b[i][0], L.b[i][1], L.k[i][0] + o * 0.5, L.k[i][1] - up, col, w);
        r.line(L.k[i][0] + o * 0.5, L.k[i][1] - up, L.f[i][0] + o, L.f[i][1] - up, col, w * 0.75);
      }
    }
    r.layer = 0; legs(far, C.ld, 1.3, 1);
    r.layer = 1;
    r.ell(26, 32, 17, 12, C.b);
    r.recolor(C.b, C.st, function (x, y) { return x < 40 && ((x + Math.abs(y - 33) * 1.2) % 9) < 1.5; });
    r.ell(52, 33, 11, 8, C.b); r.ell(62, 34, 6, 5, C.b);
    r.layer = 2; legs(near, C.l, 1.6, 0);
    r.layer = 3;
    if (f.atk) { r.line(64, 37, 70, 42, C.f, 0.8); r.line(61, 38, 64, 45, C.f, 0.8); }
    else { r.line(64, 37, 66, 43, C.f, 0.8); r.line(61, 38, 62, 44, C.f, 0.8); }
    var tx = {}; tx[C.b] = 0.22; tx[C.l] = 0.1;
    r.shade2({ tex: tx, seed: 13 });
    [[63, 31], [65, 31.5], [64, 29.5], [61, 30.5], [66, 33]].forEach(function (p) { r.dot(p[0], p[1], C.e); });
    r.outline(OUT);
    return r;
  }

  /* ================= Rodan ================= */
  function rodan(f) {
    var r = new R(98, 50); r.ox = 1; r.oy = 1;
    var C = { b: '#8c4c2c', d: '#5c2e1a', w: '#a4643c', wd: '#6c3820', be: '#e8963e', bk: '#dcb070', e: '#ffe040' };
    var ff = f.atk ? 0.15 : [0, 0.45, 1, 0.45][f.stand ? 0 : f.phase || 0];
    r.layer = 0;
    r.poly([[48, 22], [30, 16], [10, 2 + ff * 26], [4, 6 + ff * 28], [18, 24 + ff * 8], [34, 30]], C.wd);
    r.layer = 1;
    r.ell(50, 27, 15, 7, C.b); r.ell(52, 30, 11, 4, C.be);
    r.poly([[37, 25], [27, 28], [37, 30]], C.b);
    r.line(46, 33, 44, 42, C.d, 1); r.line(51, 33, 50, 42, C.d, 1);
    r.layer = 2;
    r.ell(64, 22, 5, 4.5, C.b); r.ell(69, 20, 5, 4, C.b);
    r.poly([[66, 17], [53, 8], [64, 19]], C.d); r.poly([[67, 17], [60, 5], [68, 18]], C.d);
    r.poly([[70, 17.5], [93, 21], [71, 23.5]], C.bk);
    if (f.atk) r.poly([[71, 22], [90, 25], [71, 26]], C.bk);
    r.layer = 3;
    r.poly([[52, 22], [36, 14], [14, ff * 32], [6, 4 + ff * 32], [20, 26 + ff * 10], [36, 34], [52, 30]], C.w);
    var tx = {}; tx[C.b] = 0.15; tx[C.w] = 0.06;
    r.shade2({ tex: tx, seed: 21 });
    r.line(50, 22, 14, ff * 32 + 1, sh(C.w, -0.3)); r.line(50, 23, 20, 26 + ff * 10, sh(C.w, -0.3));
    r.dot(71, 19, C.e); r.dot(43, 42, '#e8e0c8'); r.dot(49, 42, '#e8e0c8');
    r.outline(OUT);
    return r;
  }

  /* ================= Gigan ================= */
  function gigan(f) {
    var r = new R(80, 78); r.ox = 1; r.oy = 1;
    var C = { b: '#2c8c7c', d: '#1c5c52', g: '#d8b030', gd: '#a8801c', h: '#c8ccd8', v: '#ff2a2a', s: '#b8bcc8' };
    var ph = f.phase || 0, st = f.stand;
    var la = st ? 0 : [-3, 0, 3, 0][ph], lb = -la, lA = st ? 0 : [0, 3, 0, 0][ph], lB = st ? 0 : [0, 0, 0, 3][ph], sw = st ? 0 : [0, 1.5, 0, -1.5][ph];
    r.layer = 0;
    r.curve(34, 58, 18, 74 + sw, 4, 70 + sw, 7, 2, C.b);
    r.ell(46, 58, 6, 7, C.d); r.ell(47 + lb, 65 - lB, 4.5, 6, C.d); r.ell(50 + lb, 71 - lB, 6, 2.4, C.d);
    r.line(50, 34, 53, 42, C.d, 2); r.curve(53, 42, 61, 40, 59, 49, 1.5, 1.2, sh(C.h, -0.3));
    for (var i = 0; i < 5; i++) {
      var t = (i + 0.5) / 5, px = 40 - 8 * t, py = 18 + 30 * t;
      leaf(r, px, py, 3 + 3 * Math.sin(Math.PI * t), -0.96, -0.26, -0.26, 0.96, C.g);
    }
    r.layer = 1;
    r.ell(40, 46, 10, 15, C.b); r.ell(44, 36, 8, 8, C.b); r.ell(46, 26, 5, 6, C.b);
    r.ell(48, 19, 6, 5.5, C.b);
    r.poly([[50, 16], [61, 21], [51, 25]], C.gd);
    r.poly([[44, 14], [39, 1], [48, 14]], C.g); r.poly([[47, 14], [46, 6], [51, 15]], C.g);
    r.layer = 2;
    r.ell(45, 47, 5, 12, C.g);
    r.rect(47, 33, 4, 24, C.s);
    for (var y = 34; y < 56; y += 3) r.poly([[51, y], [54.5, y + 1.5], [51, y + 3]], C.s);
    r.layer = 3;
    r.ell(38, 57, 8, 8, C.b); r.ell(39 + la, 65 - lA, 5.5, 6.5, C.b); r.ell(42 + la, 71.5 - lA, 7, 2.6, C.b);
    r.layer = 4;
    r.ell(46, 34, 4, 3.5, C.b);
    if (f.atk) { r.line(47, 33, 53, 22, C.b, 2.2); r.curve(53, 22, 68, 15, 67, 31, 1.8, 1.4, C.h); }
    else { r.line(47, 36, 54, 43, C.b, 2.2); r.curve(54, 43, 69, 40, 64, 53, 1.8, 1.4, C.h); }
    var tx = {}; tx[C.b] = 0.14; tx[C.g] = 0.3;
    r.shade2({ tex: tx, seed: 17 });
    r.line(47, 17.5, 55, 19, C.v); r.dot(52, 18, '#ffffff');
    r.dot(40 + la, 73 - lA, '#e8e8e8'); r.dot(44 + la, 72.8 - lA, '#e8e8e8');
    r.outline(OUT);
    return r;
  }

  /* ================= Hedorah ================= */
  function hedorah(f) {
    var r = new R(78, 80); r.ox = 1; r.oy = 1;
    var C = { b: '#4c544a', d: '#30362f', l: '#6c7a5c', e: '#e83020', er: '#ffe040', dr: '#8c9a6c' };
    var wob = f.stand ? 0 : [0, 1, 0, -1][f.phase || 0];
    r.layer = 0;
    r.ell(22, 40, 8, 10, C.d); r.ell(54, 34, 7, 9, C.d);
    r.layer = 1;
    r.ell(38, 66, 26, 11 + wob * 0.5, C.b); r.ell(38, 46, 18, 20 - wob, C.b); r.ell(40, 24 - wob, 13, 15 + wob, C.b);
    if (f.atk) r.ell(60, 32, 7, 4.5, C.b); else r.ell(58, 44, 7, 4.5, C.b);
    r.ell(18, 46, 6, 4, C.b);
    r.layer = 2;
    for (var i = 0; i < 16; i++) {
      var x = 18 + hash(i, 3, 5) * 42, y = 14 + hash(i, 4, 5) * 58;
      if (r.get(Math.floor(r.tx(x)), Math.floor(r.ty(y))) === C.b) r.ell(x, y, 1.5 + hash(i, 5, 5) * 2.5, 1.2 + hash(i, 6, 5) * 2, C.l);
    }
    var tx = {}; tx[C.b] = 0.25; tx[C.l] = 0.2;
    r.shade2({ tex: tx, seed: 19 });
    for (i = 0; i < 8; i++) { var dx = 16 + i * 6 + hash(i, 1, 1) * 3; r.line(dx, 70 + hash(i, 2, 2) * 3, dx, 75 + hash(i, 3, 3) * 3, C.dr); }
    [[38, 20], [47, 21]].forEach(function (p) { r.ell(p[0], p[1] - wob, 2.2, 5, C.er); r.ell(p[0], p[1] - wob, 1.1, 3.8, C.e); });
    r.outline(OUT);
    return r;
  }

  /* ================= Destoroyah ================= */
  function destoroyah(f) {
    var r = new R(94, 86); r.ox = 1; r.oy = 1;
    var C = { b: '#b8322a', d: '#76201a', c: '#e8b030', w: '#8e1e1e', wd: '#5c1010', h: '#ece0c8', e: '#ffe040', m: '#40080a' };
    var ph = f.phase || 0, st = f.stand;
    var ff = [0, 0.4, 1, 0.4][st ? 0 : ph];
    var la = st ? 0 : [-3, 0, 3, 0][ph], lA = st ? 0 : [0, 3, 0, 0][ph], sw = st ? 0 : [0, 1.5, 0, -1.5][ph];
    r.layer = 0;
    r.poly([[40, 34], [30, 24], [18, 2 + ff * 20], [6, 8 + ff * 24], [10, 24 + ff * 12], [22, 34 + ff * 6], [32, 42]], C.wd);
    r.curve(34, 62, 16, 80 + sw, 2, 72 + sw, 7, 2, C.b);
    [0.2, 0.4, 0.6].forEach(function (t) { var u = 1 - t, x = u * u * 34 + 2 * u * t * 16 + t * t * 2, y = u * u * 62 + 2 * u * t * (80 + sw) + t * t * (72 + sw); r.poly([[x - 2, y - 4], [x + 2, y - 4], [x - 2, y - 9]], C.h); });
    r.ell(52, 62, 7, 8, C.d); r.ell(54 - la, 70, 5, 6, C.d); r.ell(57 - la, 77, 7, 2.4, C.d);
    r.ell(58, 44, 3.5, 2.6, C.d);
    r.layer = 1;
    r.ell(46, 50, 13, 17, C.b); r.ell(51, 45, 7, 10, C.c);
    r.recolor(C.c, sh(C.c, -0.2), function (x, y) { return y % 3 === 0; });
    [[38, 34], [44, 31], [36, 40]].forEach(function (p) { r.poly([[p[0] - 2, p[1] + 2], [p[0] + 2, p[1] + 2], [p[0] - 3, p[1] - 5]], C.h); });
    r.ell(52, 32, 6, 7, C.b); r.ell(57, 25, 8, 6, C.b);
    r.poly([[58, 21], [70, 24], [70, 28], [58, 30]], C.b);
    r.poly([[57, 20], [61, 5], [67, 0], [64, 8], [63, 21]], C.h);
    if (f.atk) { r.poly([[58, 28], [70, 29], [69, 34], [58, 32]], C.b); r.poly([[60, 27.6], [70, 28], [69.5, 30], [60, 29.6]], C.m); }
    r.layer = 2;
    r.poly([[42, 34], [36, 22], [30, 0 + ff * 22], [20, 2 + ff * 26], [22, 18 + ff * 14], [30, 30 + ff * 6], [38, 42]], C.w);
    r.layer = 3;
    r.ell(42, 62, 9, 9, C.b); r.ell(44 + la, 70 - lA, 6, 7, C.b); r.ell(47 + la, 77 - lA, 8, 2.6, C.b);
    r.layer = 4;
    r.ell(56, 42, 4, 3, C.b);
    if (f.atk) r.line(58, 41, 68, 34, C.b, 2); else r.line(58, 43, 64, 48, C.b, 2);
    var tx = {}; tx[C.b] = 0.16; tx[C.c] = 0.2;
    r.shade2({ tex: tx, seed: 23 });
    r.line(40, 34, 30, 1 + ff * 22, sh(C.w, -0.35)); r.line(40, 35, 21, 4 + ff * 26, sh(C.w, -0.35));
    r.dot(61, 23, C.e); r.dot(62, 23, C.e);
    if (f.atk) { r.dot(68, 36, C.h); r.dot(69, 34, C.h); } else { r.dot(65, 49, C.h); r.dot(64, 50, C.h); }
    r.outline(OUT);
    return r;
  }

  /* ================= Mothra ================= */
  function mothra(fl) {
    var r = new R(58, 38); r.k = 1.25; r.ox = 0; r.oy = 0;
    var sp = [1, 0.65, 0.3][fl], cx = 23;
    function wing(side) {
      var m = function (x) { return cx + side * x * sp; };
      r.poly([[m(1), 12], [m(20), 2], [m(22), 10], [m(4), 17]], '#e89a2a');
      r.poly([[m(1), 16], [m(16), 22], [m(12), 28], [m(2), 21]], '#d07a1a');
      r.ell(m(14), 8, 3 * sp + 0.6, 2.4, '#5a3014');
      r.ell(m(14), 8, 1.5 * sp + 0.4, 1.2, '#ffe04a');
      r.ell(m(9), 21, 2 * sp + 0.5, 1.8, '#3a7ac8');
    }
    wing(-1); wing(1);
    r.layer = 1;
    r.ell(cx, 15, 2.6, 9, '#6a4020'); r.ell(cx, 7, 2.6, 2.4, '#f0e8d0');
    r.shade2();
    r.dot(cx - 1, 6, '#3ac8ff'); r.dot(cx + 1, 6, '#3ac8ff');
    r.line(cx - 1, 5, cx - 4, 1, '#f0e8d0'); r.line(cx + 1, 5, cx + 4, 1, '#f0e8d0');
    r.outline(OUT);
    return r.toCanvas();
  }

  /* ================= Fahrzeuge & Kleinkram ================= */
  function isoBox(r, cx, cy, lx, ly, z0, h, top, left, right) {
    function P(wx, wy, z) { return [cx + (wx - wy) * 16, cy + (wx + wy) * 8 - z]; }
    r.poly([P(-lx, ly, z0), P(lx, ly, z0), P(lx, ly, z0 + h), P(-lx, ly, z0 + h)], left);
    r.poly([P(lx, -ly, z0), P(lx, ly, z0), P(lx, ly, z0 + h), P(lx, -ly, z0 + h)], right);
    r.poly([P(-lx, -ly, z0 + h), P(lx, -ly, z0 + h), P(lx, ly, z0 + h), P(-lx, ly, z0 + h)], top);
  }
  function car(col, axis) {
    var r = new R(22, 16), lx = axis ? 0.13 : 0.3, ly = axis ? 0.3 : 0.13;
    isoBox(r, 11, 9, lx, ly, 0, 3, col, sh(col, -0.3), sh(col, -0.45));
    isoBox(r, 11, 9, lx * 0.55, ly * 0.55, 3, 2, '#a8d0ec', '#3a4a5a', '#2a3440');
    r.outline('#101010');
    return r.toCanvas();
  }
  function tank() {
    var r = new R(18, 12);
    r.poly([[1, 7], [9, 3], [17, 7], [9, 11]], '#556238');
    r.poly([[1, 7], [9, 11], [17, 7], [17, 8.5], [9, 12], [1, 8.5]], '#2e3620');
    r.ell(9, 6, 3.5, 2, '#6c7c46');
    r.line(10, 5.5, 16, 3, '#2e3620');
    r.shade(); r.outline(OUT);
    return pair(r);
  }
  function jet() {
    var r = new R(22, 12);
    r.line(2, 6, 19, 6, '#9aa4b0', 1.2);
    r.poly([[8, 6], [13, 6], [9, 11], [6, 11]], '#7c8694');
    r.poly([[2, 6], [5, 6], [3, 1], [1, 1]], '#7c8694');
    r.dot(17, 5, '#6ad0ff');
    r.shade(); r.outline(OUT);
    return pair(r);
  }
  function llama() {
    var r = new R(14, 14);
    r.ell(6, 8, 4, 2.6, '#f2e8d4');
    r.rect(8.5, 2, 2, 6, '#f2e8d4');
    r.ell(10.5, 2.6, 2.2, 1.4, '#f2e8d4');
    r.line(3, 10, 3, 13, '#d8ccb4'); r.line(5, 10, 5, 13, '#d8ccb4'); r.line(7, 10, 7, 13, '#d8ccb4'); r.line(9, 10, 9, 13, '#d8ccb4');
    r.dot(9, 0.6, '#f2e8d4'); r.dot(10, 0.6, '#f2e8d4');
    r.shade(); r.dot(11, 2, '#202020'); r.outline(OUT);
    return pair(r);
  }
  function missile() {
    var r = new R(8, 4);
    r.line(0.5, 2, 6.5, 2, '#d0d4dc', 0.9); r.dot(7, 2, '#ff4030');
    r.outline(OUT);
    return pair(r);
  }
  function barrel() {
    var r = new R(10, 13);
    r.rect(1, 2, 8, 9, '#e8c020'); r.ell(5, 11, 4, 1.5, '#e8c020'); r.ell(5, 2, 4, 1.5, '#fff080');
    r.shade(); r.dot(4, 6, '#202020'); r.dot(6, 6, '#202020'); r.dot(5, 8, '#202020'); r.dot(5, 6.8, '#202020');
    r.outline(OUT);
    return r.toCanvas();
  }

  /* ================= Gebäude ================= */
  var bcache = {};
  function prism(o) {
    var key = JSON.stringify(o);
    if (bcache[key]) return bcache[key];
    var a = o.a, hh = a / 2, h = o.h, W = 2 * a, H = h + a + 2 + (o.ant ? 8 : 0);
    var top = o.ant ? 8 : 0;
    var r = new R(W, H);
    for (var py = 0; py < H; py++) for (var px = 0; px < W; px++) {
      var yy = py - top;
      var ddx = Math.abs(px + 0.5 - a) / a, ddy = Math.abs(yy + 0.5 - hh) / hh;
      if (ddx + ddy <= 1) { r.set(px, py, ddx + ddy > 0.84 ? sh(o.roof, 0.2) : o.roof); continue; }
      var left = px < a;
      var yt = left ? hh + (px + 0.5) / 2 : hh + (W - px - 0.5) / 2;
      if (yy >= yt && yy < yt + h) {
        var v = yy - yt, u = left ? px : W - 1 - px, c = left ? o.wl : o.wr;
        if ((left && px === a - 1) || (!left && px === a)) c = sh(c, 0.12);
        if (o.win && v > 2 && v < h - 3 && u % 4 !== 0 && u % 4 !== 3 && u > 1 && Math.floor(v) % 5 > 1 && Math.floor(v) % 5 < 4) {
          var lit = hash(Math.floor(u / 4) + (left ? 0 : 50), Math.floor(v / 5), o.seed || 1) < (o.lit || 0);
          c = lit ? o.winLit : o.win;
        }
        if (o.band && Math.floor(v) % o.band === 0) c = sh(c, -0.15);
        if (v >= h - 1) c = sh(c, -0.35);
        r.set(px, py, c);
      }
    }
    if (o.ant) { for (var y = 0; y < top + hh; y++) r.set(a, y, '#b0b0b8'); r.set(a, 0, '#ff3030'); }
    var res = { img: r.toCanvas(), ax: a, ay: top + hh + h + hh, h: h };
    bcache[key] = res;
    return res;
  }

  function special(kind) {
    if (bcache[kind]) return bcache[kind];
    var r, ax, ay, i, y, x;
    if (kind === 'tower') {
      r = new R(30, 86);
      r.poly([[3, 85], [13, 14], [17, 14], [27, 85]], '#e04a24');
      r.poly([[9, 85], [14, 38], [16, 38], [21, 85]], null);
      r.recolor('#e04a24', '#f2f2ec', function (x, y) { return Math.floor(y / 7) % 2 === 1; });
      for (y = 16; y < 84; y += 3) for (x = 0; x < 30; x++) if (r.get(x, y) && (x + y) % 4 === 0) r.set(x, y, '#8a2a14');
      r.rect(7, 50, 16, 3, '#f2f2ec'); r.rect(10, 30, 10, 3, '#e04a24');
      r.line(15, 0, 15, 14, '#c0c0c8'); r.dot(15, 0, '#ff3030');
      r.outline(OUT); ax = 15; ay = 84;
    } else if (kind === 'pagoda') {
      r = new R(30, 50);
      for (i = 0; i < 4; i++) {
        var yb = 46 - i * 10, wd = 9 - i * 1.5;
        r.rect(15 - wd, yb - 7, wd * 2, 7, '#b83a26');
        r.poly([[15 - wd - 5, yb - 7], [15 + wd + 5, yb - 7], [15 + wd + 1, yb - 10], [15 - wd - 1, yb - 10]], '#3a3a44');
      }
      r.line(15, 2, 15, 8, '#c8a040'); r.shade(); r.outline(OUT); ax = 15; ay = 46;
    } else if (kind === 'castle') {
      r = new R(40, 56);
      r.poly([[2, 54], [8, 40], [32, 40], [38, 54]], '#7c7c80');
      for (i = 0; i < 3; i++) {
        var yy = 40 - i * 11, w2 = 13 - i * 3;
        r.rect(20 - w2, yy - 8, w2 * 2, 8, '#f0eee4');
        r.poly([[20 - w2 - 4, yy - 8], [20 + w2 + 4, yy - 8], [20 + w2, yy - 12], [20 - w2, yy - 12]], '#3c4a52');
      }
      r.poly([[14, 7], [26, 7], [20, 2]], '#3c4a52'); r.dot(16, 3, '#e0b030'); r.dot(24, 3, '#e0b030');
      r.shade(); r.outline(OUT); ax = 20; ay = 52;
    } else if (kind === 'reactor') {
      r = new R(36, 40);
      r.poly([[2, 30], [18, 22], [34, 30], [18, 38]], '#9aa0a8');
      r.ell(14, 24, 8, 8, '#d8dce0'); r.rect(6, 24, 16, 6, '#d8dce0');
      r.rect(24, 8, 5, 20, '#c0c4c8'); r.recolor('#c0c4c8', '#d84030', function (x, y) { return y < 12; });
      r.shade();
      r.dot(13, 22, '#ffe030'); r.dot(14, 21, '#ffe030'); r.dot(15, 22, '#ffe030'); r.dot(14, 23, '#202020');
      r.outline(OUT); ax = 18; ay = 32;
    } else if (kind === 'factory') {
      r = new R(34, 48);
      isoBox(r, 17, 38, 0.42, 0.42, 0, 10, '#8a8478', '#6c665c', '#565048');
      r.rect(22, 6, 5, 26, '#c8c4bc');
      r.recolor('#c8c4bc', '#c83a2a', function (x, y) { return Math.floor(y / 5) % 2 === 0; });
      r.shade(); r.outline(OUT); ax = 17; ay = 38;
    } else if (kind === 'crane') {
      r = new R(44, 60);
      r.line(14, 58, 14, 8, '#e8a020', 1.2); r.line(18, 58, 18, 8, '#e8a020', 1.2);
      for (y = 12; y < 58; y += 6) r.line(14, y, 18, y + 6, '#c88010');
      r.line(4, 8, 42, 8, '#e8a020', 1); r.line(16, 2, 4, 8, '#c88010'); r.line(16, 2, 42, 8, '#c88010');
      r.line(36, 8, 36, 30, '#303030'); r.rect(33, 30, 6, 4, '#3a6ac8');
      r.outline(OUT); ax = 16; ay = 58;
    } else if (kind === 'pine') {
      r = new R(14, 24);
      r.rect(6, 18, 2, 5, '#5a3a20');
      for (i = 0; i < 3; i++) r.poly([[7, 2 + i * 5], [13, 11 + i * 4], [1, 11 + i * 4]], '#1f5a2c');
      r.shade(); r.outline(OUT); ax = 7; ay = 22;
    } else if (kind === 'tree') {
      r = new R(16, 18);
      r.rect(7, 12, 2, 5, '#5a3a20');
      r.ell(8, 8, 6.5, 5.5, '#3a7a30'); r.ell(5, 10, 4, 3, '#3a7a30'); r.ell(11, 10, 4, 3, '#3a7a30');
      r.shade(); r.outline(OUT); ax = 8; ay = 16;
    } else if (kind === 'palm') {
      r = new R(20, 26);
      r.curve(10, 25, 8, 16, 11, 8, 1.2, 0.9, '#8a6030');
      r.curve(11, 8, 4, 4, 1, 10, 1.4, 0.6, '#2c8a38'); r.curve(11, 8, 18, 4, 19, 11, 1.4, 0.6, '#2c8a38');
      r.curve(11, 8, 9, 1, 4, 2, 1.2, 0.6, '#2c8a38'); r.curve(11, 8, 14, 1, 17, 3, 1.2, 0.6, '#2c8a38');
      r.shade(); r.outline(OUT); ax = 10; ay = 24;
    } else if (kind === 'pylon') {
      r = new R(16, 44);
      r.poly([[2, 43], [7, 4], [9, 4], [14, 43]], '#9aa0a8'); r.poly([[5, 43], [8, 12], [11, 43]], null);
      r.rect(1, 10, 14, 1.4, '#9aa0a8'); r.rect(3, 18, 10, 1.4, '#9aa0a8');
      r.outline('#3a3e44'); ax = 8; ay = 42;
    } else if (kind === 'torii') {
      r = new R(24, 22);
      r.rect(4, 5, 2.4, 16, '#d83a1e'); r.rect(17.6, 5, 2.4, 16, '#d83a1e');
      r.poly([[0, 3], [24, 3], [22, 5.5], [2, 5.5]], '#2a2a2a'); r.rect(2, 8, 20, 1.8, '#d83a1e');
      r.shade(); r.outline(OUT); ax = 12; ay = 20;
    } else if (kind === 'oiltank') {
      r = new R(24, 22);
      r.rect(2, 7, 20, 12, '#c8ccd0'); r.ell(12, 19, 10, 3, '#c8ccd0'); r.ell(12, 7, 10, 3, '#e8ecf0');
      r.recolor('#c8ccd0', '#d84030', function (x, y) { return y === 12 || y === 13; });
      r.outline(OUT); ax = 12; ay = 19;
    } else if (kind === 'rock') {
      r = new R(22, 16);
      r.ell(11, 10, 10, 5.5, '#6c6458'); r.ell(8, 8, 5, 4, '#7c7466');
      r.shade(); r.outline(OUT); ax = 11; ay = 13;
    }
    var res = { img: r.toCanvas(), ax: ax, ay: ay, h: ay, chimney: kind === 'factory' ? [24, 6] : null };
    bcache[kind] = res;
    return res;
  }

  function rubble(seed, pal) {
    var key = 'rub' + seed + pal;
    if (bcache[key]) return bcache[key];
    var cols = pal === 'n' ? ['#4a4640', '#5c564c', '#38342e', '#6a6254'] : ['#7a7064', '#8e8474', '#5a5248', '#9a9080'];
    var r = new R(30, 18);
    for (var i = 0; i < 14; i++) {
      var x = 5 + hash(i, seed, 3) * 20, y = 7 + hash(seed, i, 5) * 7;
      r.ell(x, y, 2 + hash(i, i, seed) * 3, 1.5 + hash(seed, seed, i) * 2, cols[i % 4]);
    }
    r.shade(); r.outline('#1a1814');
    var res = { img: r.toCanvas(), ax: 15, ay: 13, h: 6 };
    bcache[key] = res;
    return res;
  }

  function fuji() {
    var r = new R(260, 110);
    r.poly([[0, 110], [104, 14], [120, 10], [140, 12], [156, 16], [260, 110]], '#5a6a8c');
    r.poly([[84, 34], [104, 14], [120, 10], [140, 12], [156, 16], [176, 34], [160, 30], [150, 40], [136, 31], [124, 42], [112, 32], [100, 40]], '#f4f6fa');
    r.poly([[0, 110], [40, 80], [70, 95], [110, 76], [150, 96], [200, 78], [260, 110]], '#3e5a44');
    return r.toCanvas();
  }
  function volcano() {
    var r = new R(120, 60);
    r.poly([[0, 60], [48, 8], [72, 8], [120, 60]], '#4a3e36');
    r.poly([[48, 8], [72, 8], [66, 14], [54, 14]], '#ff6a1a');
    for (var i = 0; i < 6; i++) r.line(56 + i * 2, 12, 50 + i * 4 - 8, 30 + hash(i, 1, 1) * 20, '#e8501a');
    r.shade(); r.outline(OUT);
    return r.toCanvas();
  }

  function init() {
    var S = {};
    S.godzilla = gzSet('godzilla');
    S.mecha = gzSet('mecha');
    S.minilla = gzSet('minilla');
    S.ghidorah = ghidorahSet();
    S.biolante = biolanteSet();
    S.kamacuras = mkSet(kamacuras, 32, 56, { mouth: { x: 16, y: -44 } });
    S.anguirus = mkSet(anguirus, 45, 53, { mouth: { x: 34, y: -19 } });
    S.kumonga = mkSet(kumonga, 47, 55, { mouth: { x: 20, y: -16 } });
    S.rodan = mkSet(rodan, 51, 44, { mouth: { x: 40, y: -21 } });
    S.gigan = mkSet(gigan, 41, 74, { mouth: { x: 14, y: -55 } });
    S.hedorah = mkSet(hedorah, 39, 77, { mouth: { x: 4, y: -56 } });
    S.destoroyah = mkSet(destoroyah, 47, 80, { mouth: { x: 24, y: -53 } });
    S.mothra = [mothra(0), mothra(1), mothra(2), mothra(1)];
    S.tank = tank(); S.jet = jet(); S.llama = llama(); S.missile = missile(); S.barrel = barrel();
    var cc = ['#c83a2a', '#2a6ac8', '#e8e8e8', '#e0b020', '#3a3a3a', '#3a9a4a'];
    S.cars = cc.map(function (c) { return [car(c, 0), car(c, 1)]; });
    S.fuji = fuji(); S.volcano = volcano();
    return S;
  }

  return { init: init, prism: prism, special: special, rubble: rubble };
})();
