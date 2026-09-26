'use strict';
/* Prozedurale Pixel-Art für alle Monster, Fahrzeuge und Gebäude. */
var Sprites = (function () {
  var R = Pix.Raster, sh = Pix.shade, hash = Pix.hash;
  var OUT = '#12160f';

  function pair(r) { return { r: r.toCanvas(false), l: r.toCanvas(true) }; }

  /* ---------------- Godzilla / Mechagodzilla / Minilla ---------------- */
  var KPAL = {
    godzilla: { body: '#4c6e47', dark: '#324c36', belly: '#9aa87a', bellyD: '#7d8c62', plate: '#dcdcc4', glow: '#a8f6ff', eye: '#ffe04a', mouth: '#8c1c1c' },
    mecha: { body: '#8e9cab', dark: '#5b6878', belly: '#b4c0cc', bellyD: '#76889a', plate: '#c8d4e0', glow: '#ffd24a', eye: '#ffe04a', mouth: '#2a2a3a', accent: '#c83232' },
    minilla: { body: '#6f9a5e', dark: '#4e7444', belly: '#b8c49a', bellyD: '#98a47c', plate: '#e4e4cc', glow: '#b8ffff', eye: '#1a1a1a', mouth: '#b04040' }
  };

  function kaiju(style, f) {
    var P = KPAL[style], mini = style === 'minilla', mecha = style === 'mecha';
    var k = mini ? 0.62 : 1;
    var r = new R(50 * k + 3, 50 * k + 3);
    r.k = k; r.ox = 1; r.oy = 1;
    var ph = f.phase || 0;
    var la = [-2, 0, 2, 0][ph], lb = [2, 0, -2, 0][ph], liA = [0, 2, 0, 0][ph], liB = [0, 0, 0, 2][ph];
    var b = [0, -1, 0, -1][ph], sway = [0, 1, 0, -1][ph];
    if (f.stand) { la = lb = liA = liB = 0; b = 0; sway = 0; }
    if (f.attack) { sway = 2.6; }
    var plate = f.glow ? P.glow : P.plate;

    // hinteres Bein
    r.ell(27 + lb, 38 - liB, 4.5, 7, P.dark);
    r.ell(29 + lb, 45.5 - liB, 5.5, 2.4, P.dark);
    // Schwanz
    var tail = [];
    for (var i = 0; i <= 10; i++) {
      var t = i / 10;
      var tx = 17 - t * 16, ty = 34 + t * 10 - Math.sin(t * 2.6) * sway * 2.2 * t;
      var rr = 6.5 - t * 5;
      tail.push([tx, ty, rr]);
      r.ell(tx, ty, rr, rr * 0.8, P.body);
    }
    // Rückenplatten
    var dx = -10, dy = 22, dl = Math.sqrt(dx * dx + dy * dy); dx /= dl; dy /= dl;
    var nx = -dy, ny = dx; // zeigt nach links-oben
    if (nx > 0) { nx = -nx; ny = -ny; }
    var np = mini ? 4 : 6;
    for (i = 0; i < np; i++) {
      t = i / (np - 1);
      var px = 21 - 10 * t, py = 9 + b + 22 * t;
      var s = (mecha ? 1.6 : 3) + (mecha ? 1.2 : 3.4) * Math.sin(Math.PI * (0.15 + 0.8 * t));
      r.poly([[px + dx * s * 0.75, py + dy * s * 0.75], [px - dx * s * 0.75, py - dy * s * 0.75],
        [px + nx * s * 1.5 - dx * s * 0.3, py + ny * s * 1.5 - dy * s * 0.3]], plate);
    }
    [0.2, 0.4, 0.6].forEach(function (tt) {
      var q = tail[Math.round(tt * 10)], s2 = q[2] * 0.7;
      r.poly([[q[0] - s2, q[1] - q[2] * 0.6], [q[0] + s2, q[1] - q[2] * 0.6], [q[0] - s2 * 0.3, q[1] - q[2] * 0.6 - s2 * 1.6]], plate);
    });
    // Körper
    r.ell(21, 27 + b, 9.5, 13, P.body);
    r.ell(24, 20 + b, 7, 7.5, P.body);
    r.ell(26, 14 + b, 5, 6, P.body);
    // Kopf
    if (mini) {
      r.ell(29, 10 + b, 8, 7, P.body);
      r.ell(35, 12 + b, 4, 3, P.body);
    } else if (mecha) {
      r.poly([[23, 7 + b], [32, 5 + b], [39, 8 + b], [39, 12 + b], [30, 14 + b], [24, 13 + b]], P.body);
    } else {
      r.ell(29, 10 + b, 6, 4.5, P.body);
      r.poly([[29, 6.5 + b], [38, 8.5 + b], [39, 11 + b], [29, 12.5 + b]], P.body);
    }
    if (f.mouth) {
      var mb = mini ? 2 : 0;
      r.poly([[28, 12 + b + mb], [38, 13 + b + mb], [37, 16 + b + mb], [28, 15.5 + b + mb]], P.body);
      r.poly([[31, 11.6 + b + mb], [38.4, 11.6 + b + mb], [38.4, 13.4 + b + mb], [31, 13.4 + b + mb]], P.mouth);
    }
    // vorderes Bein
    r.ell(18, 33, 6.5, 6.5, P.body);
    r.ell(19 + la, 39 - liA, 5.5, 7.5, P.body);
    r.ell(21 + la, 45.5 - liA, 6.5, 2.4, P.body);
    // Bauch
    r.ell(25, 28 + b, 4.5, 10.5, P.belly);
    r.recolor(P.belly, P.bellyD, function (x, y) { return y % 3 === 0; });
    if (mecha) {
      r.recolor(P.body, P.dark, function (x, y) { return y % 5 === 0; });
      r.rect(22, 18 + b, 5, 4, P.accent);
    }
    // Arm
    var ax = f.attack ? 34 : 31;
    r.ell(ax, 22 + b, 4, 2.2, P.body);

    r.shade(mecha ? null : { });
    // Details nach dem Shading
    if (mecha) {
      for (var vx = 29; vx <= 36; vx++) r.dot(vx, 8.5 + b, f.glow ? '#ffffff' : P.eye);
    } else {
      r.dot(mini ? 31 : 32, (mini ? 8 : 8.6) + b, P.eye);
      if (mini) r.dot(32, 8 + b, P.eye);
    }
    if (f.mouth && !mecha) for (var tx2 = 32; tx2 <= 37; tx2 += 2) r.dot(tx2, 11.8 + b + (mini ? 2 : 0), '#ffffff');
    r.dot(ax + 4, 22 + b, '#f0f0e0'); r.dot(ax + 4, 23 + b, '#f0f0e0');
    r.dot(26 + la, 46.5 - liA, '#f0f0e0'); r.dot(27 + la, 46.5 - liA, '#f0f0e0');
    r.outline(OUT);
    return r;
  }

  function kaijuSet(style) {
    var S = { walk: [] };
    for (var i = 0; i < 4; i++) S.walk.push(pair(kaiju(style, { phase: i })));
    S.stand = pair(kaiju(style, { stand: true }));
    S.attack = pair(kaiju(style, { stand: true, attack: true }));
    S.breath = pair(kaiju(style, { stand: true, mouth: true, glow: true }));
    S.roar = pair(kaiju(style, { stand: true, mouth: true }));
    var k = style === 'minilla' ? 0.62 : 1;
    S.w = S.stand.r.width; S.h = S.stand.r.height;
    S.ax = 22 * k + 1; S.ay = 47.5 * k + 1;
    S.mouth = { x: 38 * k + 1 - S.ax, y: 12 * k + 1 - S.ay };
    return S;
  }

  /* ---------------- King Ghidorah ---------------- */
  var GP = { body: '#dcaa2e', dark: '#9c7418', wing: '#e6b83a', wingD: '#a8801e', belly: '#f0d27a', horn: '#fff1c0', eye: '#ff3a2a', mouth: '#7a1010' };
  function ghidorah(flap, mouth) {
    var r = new R(74, 64); r.ox = 2; r.oy = 1;
    var f = [0, 0.4, 1, 0.4][flap], sw = [0, 1, 0, -1][flap];
    // hinterer Flügel
    r.poly([[30, 30], [22, 24], [8, 2 + f * 24], [0, 8 + f * 26], [4, 20 + f * 16], [10, 25 + f * 10], [17, 30 + f * 5], [26, 36]], GP.wingD);
    // zwei Schwänze
    r.curve(24, 46, 12, 44 + sw, 2, 52, 4, 1, GP.body);
    r.curve(26, 49, 14, 54 - sw, 4, 60, 4, 1, GP.dark);
    // hinteres Bein
    r.ell(34, 52, 4, 6, GP.dark); r.ell(36, 58, 5, 2, GP.dark);
    // Körper
    r.ell(30, 42, 11, 12, GP.body);
    r.ell(34, 44, 6, 9, GP.belly);
    // vorderer Flügel
    r.poly([[28, 32], [24, 26], [16, 0 + f * 26], [8, 6 + f * 26], [12, 18 + f * 16], [18, 24 + f * 8], [24, 34]], GP.wing);
    // Hälse + Köpfe
    var heads = [[24, 9 + sw], [44, 5 - sw], [60, 17 + sw]];
    var bases = [[30, 33], [34, 32], [37, 35]];
    var ctrls = [[22, 26], [40, 18], [52, 34]];
    for (var i = 0; i < 3; i++) {
      var h = heads[i], bs = bases[i], c = ctrls[i];
      r.curve(bs[0], bs[1], c[0], c[1], h[0] - 3, h[1] + 1, 3.4, 2.6, i === 0 ? GP.dark : GP.body);
    }
    for (i = 0; i < 3; i++) {
      var hx = heads[i][0], hy = heads[i][1], col = i === 0 ? GP.dark : GP.body;
      r.line(hx - 2, hy - 2, hx - 9, hy - 7, GP.horn, 0.8);
      r.line(hx - 1, hy - 2, hx - 7, hy - 9, GP.horn, 0.8);
      r.ell(hx, hy, 4.5, 3.4, col);
      r.poly([[hx, hy - 3], [hx + 8, hy - 1], [hx + 8, hy + 1.5], [hx, hy + 3]], col);
      if (mouth) {
        r.poly([[hx + 1, hy + 1], [hx + 8, hy + 2], [hx + 7, hy + 5], [hx, hy + 3.5]], col);
        r.poly([[hx + 2, hy + 1], [hx + 8, hy + 1], [hx + 8, hy + 2.6], [hx + 2, hy + 2.6]], GP.mouth);
      }
    }
    // vorderes Bein
    r.ell(26, 51, 5, 7, GP.body); r.ell(28, 58, 6, 2.2, GP.body);
    r.recolor(GP.belly, sh(GP.belly, -0.15), function (x, y) { return y % 3 === 0; });
    r.shade();
    for (i = 0; i < 3; i++) r.dot(heads[i][0] + 1, heads[i][1] - 1.5, GP.eye);
    // Flügelmembran-Linien
    r.line(28, 32, 16, 1 + f * 26, sh(GP.wing, -0.25));
    r.line(28, 32, 9, 7 + f * 26, sh(GP.wing, -0.25));
    r.outline(OUT);
    return r;
  }
  function ghidorahSet() {
    var S = { walk: [] };
    for (var i = 0; i < 4; i++) S.walk.push(pair(ghidorah(i, false)));
    S.attack = pair(ghidorah(2, true));
    S.stand = S.walk[0];
    S.w = S.stand.r.width; S.h = S.stand.r.height; S.ax = 32; S.ay = 60;
    S.mouths = [{ x: 32 - S.ax, y: 11 - S.ay }, { x: 52 - S.ax, y: 7 - S.ay }, { x: 68 - S.ax, y: 19 - S.ay }];
    return S;
  }

  /* ---------------- Biolante ---------------- */
  var BP = { body: '#3f7a34', dark: '#28522a', light: '#6aa84a', sap: '#ff9a2a', mouth: '#b02828', tooth: '#f4f0d8', eye: '#ffe23a' };
  function biolante(sw, mouth) {
    var r = new R(80, 66); r.ox = 2; r.oy = 1;
    var s = [0, 2, 0, -2][sw];
    // Ranken hinten
    r.curve(16, 46, 4, 36, 4, 20 + s, 2.6, 1.6, BP.dark);
    r.curve(58, 46, 72, 40, 76, 28 - s, 2.6, 1.6, BP.dark);
    r.ell(4, 19 + s, 3, 2.5, BP.light); r.ell(76, 27 - s, 3, 2.5, BP.light);
    // Hügel
    r.ell(38, 55, 32, 10, BP.dark);
    r.ell(28, 48, 18, 12, BP.body);
    r.ell(48, 50, 17, 10, BP.body);
    r.ell(38, 38, 10, 12, BP.body);
    // Hals & Kopf
    r.curve(40, 34, 44, 22, 52, 16, 5.5, 4.2, BP.body);
    r.ell(54, 13, 7, 5, BP.body);
    r.poly([[54, 8], [71, 11], [71, 14.5], [54, 15]], BP.body);
    if (mouth) {
      r.poly([[54, 15], [69, 18], [68, 22], [54, 19.5]], BP.body);
      r.poly([[57, 14.6], [70, 14.6], [69, 18], [57, 17.8]], BP.mouth);
    }
    // Ranken vorne
    r.curve(22, 50, 10, 46, 12, 30 - s, 2.4, 1.4, BP.body);
    r.curve(52, 52, 66, 54, 72, 46 + s, 2.4, 1.4, BP.body);
    r.ell(12, 29 - s, 3, 2.5, BP.light); r.ell(72, 45 + s, 3, 2.5, BP.light);
    // Rankenstruktur
    for (var i = 0; i < 60; i++) {
      var x = 12 + hash(i, 1, 7) * 56, y = 36 + hash(i, 2, 7) * 26;
      if (r.get(Math.floor(r.tx(x)), Math.floor(r.ty(y))) === BP.body) r.line(x, y, x + 3, y + 1.5, BP.dark);
    }
    r.shade();
    [[30, 44], [44, 47], [36, 52], [24, 50], [50, 44]].forEach(function (p, j) { r.dot(p[0], p[1], BP.sap); if (j % 2) r.dot(p[0] + 1, p[1], BP.sap); });
    r.dot(4, 18 + s, BP.mouth); r.dot(76, 26 - s, BP.mouth); r.dot(12, 28 - s, BP.mouth); r.dot(72, 44 + s, BP.mouth);
    r.dot(57, 10.5, BP.eye); r.dot(58, 10.5, BP.eye);
    for (var t = 58; t <= 70; t += 2) { r.dot(t, 14.8, BP.tooth); if (mouth) r.dot(t - 1, 17.6, BP.tooth); }
    r.outline(OUT);
    return r;
  }
  function biolanteSet() {
    var S = { walk: [] };
    for (var i = 0; i < 4; i++) S.walk.push(pair(biolante(i, false)));
    S.attack = pair(biolante(1, true));
    S.stand = S.walk[0];
    S.w = S.stand.r.width; S.h = S.stand.r.height; S.ax = 40; S.ay = 60;
    S.mouth = { x: 70 - S.ax, y: 17 - S.ay };
    return S;
  }

  /* ---------------- Mothra ---------------- */
  function mothra(fl) {
    var r = new R(46, 30);
    var sp = [1, 0.65, 0.3][fl];
    var cx = 23;
    function wing(side) {
      var m = function (x) { return cx + side * x * sp; };
      r.poly([[m(1), 12], [m(20), 2], [m(22), 10], [m(4), 17]], '#e89a2a');
      r.poly([[m(1), 16], [m(16), 22], [m(12), 28], [m(2), 21]], '#d07a1a');
      r.ell(m(14), 8, 3 * sp + 0.6, 2.4, '#5a3014');
      r.ell(m(14), 8, 1.5 * sp + 0.4, 1.2, '#ffe04a');
      r.ell(m(9), 21, 2 * sp + 0.5, 1.8, '#3a7ac8');
    }
    wing(-1); wing(1);
    r.ell(cx, 15, 2.6, 9, '#6a4020');
    r.ell(cx, 7, 2.6, 2.4, '#f0e8d0');
    r.shade();
    r.dot(cx - 1, 6, '#3ac8ff'); r.dot(cx + 1, 6, '#3ac8ff');
    r.line(cx - 1, 5, cx - 4, 1, '#f0e8d0'); r.line(cx + 1, 5, cx + 4, 1, '#f0e8d0');
    r.outline(OUT);
    return r.toCanvas();
  }

  /* ---------------- kleine Einheiten ---------------- */
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

  /* ---------------- Gebäude ---------------- */
  var bcache = {};
  // Iso-Prisma mit Fenstern, pixelgenau (kein Anti-Aliasing)
  function prism(o) {
    var key = JSON.stringify(o);
    if (bcache[key]) return bcache[key];
    var a = o.a, hh = a / 2, h = o.h, W = 2 * a, H = h + a + 2 + (o.ant ? 8 : 0);
    var top = o.ant ? 8 : 0;
    var r = new R(W, H);
    for (var py = 0; py < H; py++) for (var px = 0; px < W; px++) {
      var yy = py - top;
      var ddx = Math.abs(px + 0.5 - a) / a, ddy = Math.abs(yy + 0.5 - hh) / hh;
      if (ddx + ddy <= 1) {
        var edge = ddx + ddy > 0.84;
        r.set(px, py, edge ? sh(o.roof, 0.2) : o.roof);
        continue;
      }
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
    var cv = r.toCanvas();
    var res = { img: cv, ax: a, ay: top + hh + h + hh, h: h };
    bcache[key] = res;
    return res;
  }

  function special(kind) {
    if (bcache[kind]) return bcache[kind];
    var r, ax, ay;
    if (kind === 'tower') { // Fernsehturm in Rot-Weiß
      r = new R(30, 86);
      r.poly([[3, 85], [13, 14], [17, 14], [27, 85]], '#e04a24');
      r.poly([[9, 85], [14, 38], [16, 38], [21, 85]], null);
      r.recolor('#e04a24', '#f2f2ec', function (x, y) { return Math.floor(y / 7) % 2 === 1; });
      for (var y = 16; y < 84; y += 3) for (var x = 0; x < 30; x++) if (r.get(x, y) && (x + y) % 4 === 0) r.set(x, y, '#8a2a14');
      r.rect(7, 50, 16, 3, '#f2f2ec'); r.rect(10, 30, 10, 3, '#e04a24');
      r.line(15, 0, 15, 14, '#c0c0c8'); r.dot(15, 0, '#ff3030');
      r.outline(OUT); ax = 15; ay = 84;
    } else if (kind === 'pagoda') {
      r = new R(30, 50);
      for (var i = 0; i < 4; i++) {
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
    } else if (kind === 'pine') {
      r = new R(14, 24);
      r.rect(6, 18, 2, 5, '#5a3a20');
      for (i = 0; i < 3; i++) r.poly([[7, 2 + i * 5], [13 - i * 0, 11 + i * 4], [1 + i * 0, 11 + i * 4]], '#1f5a2c');
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
    var res = { img: r.toCanvas(), ax: ax, ay: ay, h: ay };
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

  /* Fuji-Hintergrund */
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
    S.godzilla = kaijuSet('godzilla');
    S.mecha = kaijuSet('mecha');
    S.minilla = kaijuSet('minilla');
    S.ghidorah = ghidorahSet();
    S.biolante = biolanteSet();
    S.mothra = [mothra(0), mothra(1), mothra(2), mothra(1)];
    S.tank = tank(); S.jet = jet(); S.llama = llama(); S.missile = missile();
    S.fuji = fuji(); S.volcano = volcano();
    return S;
  }

  return { init: init, prism: prism, special: special, rubble: rubble };
})();
