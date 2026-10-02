'use strict';
/* Godzilla-Familie und neue Monster – mit Seiten-, Front- und Rückenansicht.
   Wird nach sprites.js geladen und registriert seine Monster in der Lazy-Registry. */
(function () {
  var H = Sprites.H, R = H.R, sh = H.sh, hash = H.hash, pair = H.pair, plate = H.plate, OUT = H.OUT, bz = H.bz, MK = H.MK;

  function params(f) {
    var ph = f.phase || 0, pose = f.pose || '', st = f.stand || !!pose;
    return {
      ph: ph, pose: pose, st: st,
      la: st ? 0 : [-3, 0, 3, 0][ph], lb: st ? 0 : [3, 0, -3, 0][ph],
      lA: st ? 0 : [0, 3, 0, 0][ph], lB: st ? 0 : [0, 0, 0, 3][ph],
      b: st ? 0 : [0, -1, 0, -1][ph], sw: st ? 0 : [0, 2, 0, -2][ph],
      mouth: pose === 'breath' || pose === 'roar', m2: pose === 'roar' ? 2.5 : 0,
      glowT: pose === 'breath' ? 1.01 : (f.glowT || 0),
      hy: pose === 'roar' ? -3 : pose === 'inhale' ? -2.5 : 0,
      atk: !!f.atk
    };
  }

  /* ======================= Godzilla-Familie ======================= */
  var GZP = {
    godzilla: { body: '#3b483c', dark: '#232b24', belly: '#687055', bellyD: '#51583f', plate: '#c8c2a6', plateD: '#948e76', glow: '#c8fbff', glowD: '#48c4ff', eye: '#f2a82a', mouth: '#5c1010', claw: '#ddd8c4', brow: '#252e26' },
    mecha: { body: '#8a98a9', dark: '#56647a', belly: '#a6b2c0', bellyD: '#76869a', plate: '#c0ccd8', plateD: '#8894a4', glow: '#ffffff', glowD: '#ffd24a', eye: '#ffe04a', mouth: '#2a2a3a', claw: '#dde4ee', accent: '#b82c2c', brow: '#5a6878' },
    minilla: { body: '#6f9a5e', dark: '#4e7444', belly: '#b8c49a', bellyD: '#98a47c', plate: '#e4e4cc', plateD: '#c0c0a8', glow: '#e0ffff', glowD: '#80e0ff', eye: '#1a1a1a', mouth: '#b04040', claw: '#f0f0e0', brow: '#5a8450' },
    space: { body: '#2c3768', dark: '#1a2142', belly: '#5a6aa8', bellyD: '#46548a', plate: '#a8e4ff', plateD: '#6a8ed0', glow: '#ffffff', glowD: '#e0a8ff', eye: '#ffe04a', mouth: '#40105a', claw: '#e0e8ff', brow: '#1c2450', cr1: '#b8f0ff', cr2: '#d8a8ff' }
  };
  var GZK = { godzilla: 1.25, mecha: 1.2, minilla: 0.62, space: 1.3 };
  var TLx = { godzilla: 46, mecha: 30, minilla: 10, space: 46 };
  function pcol(P, Q, g, dark) { return g < Q.glowT ? (dark ? P.glowD : P.glow) : (dark ? P.plateD : P.plate); }
  function spike(r, x, y, s, nx, ny, dx, dy, c) { r.poly([[x - dx * s, y - dy * s], [x + dx * s, y + dy * s], [x + nx * s * 2.2, y + ny * s * 2.2]], c); }
  function skipGlow(P) { var s = {}; s[P.glow] = 1; s[P.glowD] = 1; return s; }

  function gzSide(style, f) {
    var P = GZP[style], mini = style === 'minilla', mecha = style === 'mecha', space = style === 'space';
    var k = GZK[style], TL = TLx[style], TR = 28, Q = params(f), pose = Q.pose;
    var r = new R((96 + TL + TR) * k + 3, 79 * k + 3); r.k = k; r.ox = 1 + TL * k; r.oy = 1;
    var la = Q.la, lb = Q.lb, lA = Q.lA, lB = Q.lB, b = Q.b, sw = Q.sw;
    var hx = pose === 'claw2' ? 2 : 0, hy = Q.hy + b;
    var segs;
    if (pose === 'tail') segs = [[46, 57, 70, 80, 96, 71, 10.5, 5], [96, 71, 112, 66, 120, 52, 5, 1.4]];
    else if (mini) segs = [[46, 53, 30, 68, 12, 67 + sw, 7, 2]];
    else if (mecha) segs = [[46, 52, 30, 70, 8, 69, 10, 5], [8, 69, -12, 69 + sw, -28, 63 + sw * 2, 5, 1.5]];
    else segs = [[46, 52, 30, 71, 4, 70, 11, 5.8], [4, 70, -22, 70 + sw, -44, 62 + sw * 2, 5.8, 1.2]];
    function tail() { segs.forEach(function (s) { r.curve(s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], P.body); }); }

    r.layer = 0;
    if (pose !== 'tail') tail();
    r.ell(59, 56, 7.5, 8.5, P.dark); r.ell(61 + lb, 63 - lB, 6, 7.5, P.dark); r.ell(64 + lb, 69.5 - lB, 8, 2.8, P.dark);
    r.ell(68, 39 + b, 4, 3, P.dark);
    var x0 = 58, y0 = 12 + b, x1 = 40, y1 = 50, dx = x1 - x0, dy = y1 - y0, dl = Math.sqrt(dx * dx + dy * dy);
    dx /= dl; dy /= dl;
    var nx = -dy, ny = dx; if (nx > 0) { nx = -nx; ny = -ny; }
    var np = mini ? 4 : 7, i;
    function bp(i) {
      var t = (i + 0.5) / np;
      return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, s: (mini ? 2.4 : 3.6) + (mini ? 1.4 : 6.8) * Math.sin(Math.PI * (0.12 + 0.8 * t)), g: 0.45 + 0.55 * (1 - t) };
    }
    for (i = 0; i < np; i++) {
      var q = bp(i);
      if (mecha) spike(r, q.x + nx + dx * 2, q.y + ny + dy * 2, q.s * 0.4, nx, ny, dx, dy, pcol(P, Q, q.g, true));
      else plate(r, q.x + nx * 1.2 + dx * 2.4, q.y + ny * 1.2 + dy * 2.4, q.s * 0.68, nx, ny, dx, dy, pcol(P, Q, q.g - 0.01, true));
    }
    for (i = 0; i < np; i++) {
      q = bp(i);
      if (mecha) spike(r, q.x, q.y, q.s * 0.5, nx, ny, dx, dy, pcol(P, Q, q.g, false));
      else plate(r, q.x, q.y, q.s, nx, ny, dx, dy, pcol(P, Q, q.g, false));
    }
    if (pose !== 'tail' && !mini) {
      [[0, 0.15], [0, 0.35], [0, 0.55], [0, 0.78], [1, 0.2], [1, 0.45], [1, 0.68]].forEach(function (tq) {
        var sg = segs[tq[0]]; if (!sg) return;
        var tx = bz(sg[0], sg[2], sg[4], tq[1]), ty = bz(sg[1], sg[3], sg[5], tq[1]), rr = sg[6] + (sg[7] - sg[6]) * tq[1];
        var g = 0.45 * (1 - (tq[0] * 0.5 + tq[1] * 0.5));
        if (mecha) spike(r, tx, ty - rr * 0.7, rr * 0.35, -0.25, -0.97, 0.97, -0.25, pcol(P, Q, g, false));
        else plate(r, tx, ty - rr * 0.6, rr * 0.55, -0.25, -0.97, 0.97, -0.25, pcol(P, Q, g, false));
      });
    }
    r.layer = 1;
    r.ell(51, 45 + b, 13, 17.5, P.body); r.ell(57, 35 + b, 10.5, 10.5, P.body); r.ell(61, 26 + b, 8, 9, P.body);
    if (space) { r.poly([[52, 31 + b], [45, 2 + b], [55, 10 + b], [61, 29 + b]], P.cr1); r.poly([[58, 30 + b], [62, 8 + b], [66, 15 + b], [65, 29 + b]], P.cr2); }
    if (!mecha) { r.layer = 2; for (i = 0; i < np; i++) { q = bp(i); plate(r, q.x - nx * 1.8 + dx, q.y - ny * 1.8 + dy, q.s * 0.52, nx, ny, dx, dy, pcol(P, Q, q.g + 0.01, false)); } }
    r.layer = 1;
    var Hh = function (x, y) { return [x + hx, y + hy]; };
    if (mini) {
      r.ell(64 + hx, 18 + hy, 10, 9, P.body); r.ell(73 + hx, 21 + hy, 4.5, 3.5, P.body);
      if (Q.mouth) r.poly([Hh(66, 22), Hh(76, 21), Hh(75, 26), Hh(67, 26)], P.mouth);
    } else if (mecha) {
      r.poly([Hh(57, 12), Hh(66, 9), Hh(79, 14), Hh(79, 19), Hh(66, 23), Hh(58, 21)], P.body);
      r.poly([Hh(60, 12), Hh(74, 12.5), Hh(73, 14.4), Hh(61, 14.2)], P.brow);
      if (Q.mouth) { r.poly([Hh(62, 21), Hh(78, 20), Hh(77, 25), Hh(62, 24)], P.body); r.poly([Hh(65, 20.5), Hh(78, 19.8), Hh(78, 21.8), Hh(65, 22)], P.mouth); }
    } else {
      r.ell(64 + hx, 18 + hy, 6, 5, P.body);
      r.poly([Hh(60, 13), Hh(70, 13.2), Hh(78, 16), Hh(79.5, 18.6), Hh(77.5, 20.6), Hh(63, 23)], P.body);
      if (Q.mouth) {
        r.poly([Hh(63, 21), Hh(77, 23), Hh(75, 28 + Q.m2), Hh(63, 26)], P.body);
        r.poly([Hh(65, 20.6), Hh(79, 20.2), Hh(76.5, 24.5 + Q.m2 * 0.5), Hh(65, 23.6)], P.mouth);
      } else r.poly([Hh(63, 21), Hh(77, 20.4), Hh(75.5, 23), Hh(64, 24.6)], P.body);
      r.poly([Hh(61, 12.4), Hh(72.5, 13), Hh(71.5, 15.3), Hh(62.5, 15)], P.brow);
      if (space) r.poly([Hh(62, 13), Hh(64, 3), Hh(67, 12.5)], P.cr1);
    }
    r.layer = 3;
    r.ell(58, 43 + b, 6.5, 14.5, P.belly);
    r.recolor(P.belly, P.bellyD, function (x, y) { return y % 3 === 0; });
    if (mecha) { r.recolor(P.body, P.dark, function (x, y) { return y % 6 === 0; }); r.rect(55, 31 + b, 7, 6, P.accent); }
    r.layer = 4;
    r.ell(47, 54, 11, 11, P.body); r.ell(49 + la, 62 - lA, 7.5, 8, P.body); r.ell(52 + la, 69 - lA, 10, 3, P.body);
    if (mecha) r.rect(50 + la, 58 - lA, 6, 3, P.plate);
    r.layer = 5;
    var claws;
    if (pose === 'claw1') { r.ell(62, 33, 5.5, 4, P.body); r.line(63, 32, 71, 19, P.body, 2.8); claws = [[71.5, 15.5], [73.8, 16.6], [69.3, 15.8], [75, 18.5]]; }
    else if (pose === 'claw2') { r.ell(63, 38, 5.5, 4, P.body); r.line(65, 39, 79, 41, P.body, 2.6); claws = [[81.8, 39.6], [82, 41.5], [81, 43.4], [79.6, 44.6]]; }
    else { r.ell(62, 38 + b, 5.5, 4, P.body); r.line(64, 39 + b, 71, 42.5 + b, P.body, 2.5); claws = [[73.4, 41.8 + b], [73.8, 43.4 + b], [72.8, 45 + b], [71.4, 46 + b]]; }
    if (pose === 'tail') { r.layer = 6; tail(); }
    var tx0 = {}; tx0[P.body] = mini ? 0.1 : 0.3; tx0[P.dark] = 0.26; tx0[P.belly] = 0.12;
    r.shade2({ tex: tx0, skip: skipGlow(P), seed: style.length, grad: mini ? 0 : 0.14 });
    if (mecha) {
      for (var vx = 64; vx <= 76; vx++) r.dot(vx + hx, 15.8 + hy, Q.glowT > 0.9 ? '#ffffff' : P.eye);
      r.dot(56, 33 + b, '#ff8a8a'); r.dot(60, 33 + b, '#ff8a8a');
    } else if (mini) {
      r.dot(66 + hx, 15 + hy, P.eye); r.dot(67 + hx, 15 + hy, P.eye); r.dot(66 + hx, 16 + hy, P.eye);
    } else {
      r.dot(69 + hx, 16.1 + hy, P.eye); r.dot(68 + hx, 16.1 + hy, '#140c04');
      r.dot(77.5 + hx, 17.4 + hy, '#0c100c');
      if (Q.mouth) for (var t2 = 66; t2 <= 77; t2 += 1.6) { r.dot(t2 + hx, 21.2 + hy, '#f4f0e0'); r.dot(t2 + 0.8 + hx, 23.8 + Q.m2 * 0.5 + hy, '#e4e0d0'); }
      else { r.line(65 + hx, 20.8 + hy, 77 + hx, 20.4 + hy, '#141410'); for (var t3 = 67; t3 <= 76; t3 += 2) r.dot(t3 + hx, 21.3 + hy, '#e8e4d4'); }
    }
    claws.forEach(function (c) { r.dot(c[0], c[1], P.claw); });
    [[59, 70.8], [61.4, 70.3], [57, 71.1], [63.2, 69.6]].forEach(function (c) { r.dot(c[0] + la, c[1] - lA, P.claw); });
    r.outline(OUT);
    return r;
  }

  // Kopf von vorne
  function gzHeadFront(r, P, style, cx, y0, Q) {
    var mini = style === 'minilla', mecha = style === 'mecha';
    if (mini) {
      r.ell(cx, 17 + y0, 10, 9, P.body); r.ell(cx, 22 + y0, 5, 3.5, P.body);
      if (Q.mouth) r.ell(cx, 24 + y0, 3, 1.8, P.mouth);
    } else if (mecha) {
      r.poly([[cx - 7, 10 + y0], [cx + 7, 10 + y0], [cx + 8.5, 17 + y0], [cx + 5, 25 + y0], [cx - 5, 25 + y0], [cx - 8.5, 17 + y0]], P.body);
      r.poly([[cx - 8, 13 + y0], [cx + 8, 13 + y0], [cx + 7, 15 + y0], [cx - 7, 15 + y0]], P.brow);
      if (Q.mouth) r.rect(cx - 3, 21.5 + y0, 6, 2.5, P.mouth);
    } else {
      r.ell(cx, 16 + y0, 7.5, 6.5, P.body);
      r.ell(cx, 21.5 + y0, 6.2, 4.4, P.body);
      if (Q.mouth) { r.ell(cx, 25.5 + y0 + Q.m2 * 0.3, 5, 2.4 + Q.m2 * 0.3, P.body); r.ell(cx, 24 + y0, 4.2, 1.6 + Q.m2 * 0.4, P.mouth); }
      r.poly([[cx - 8, 13.4 + y0], [cx + 8, 13.4 + y0], [cx + 7, 15.6 + y0], [cx - 7, 15.6 + y0]], P.brow);
      if (style === 'space') r.poly([[cx - 2, 11 + y0], [cx, 1 + y0], [cx + 2, 11 + y0]], P.cr1);
    }
  }
  function gzFrontBack(style, f, back) {
    var P = GZP[style], mini = style === 'minilla', mecha = style === 'mecha', space = style === 'space';
    var k = GZK[style], Q = params(f), pose = Q.pose, b = Q.b, sw = Q.sw, cx = 70;
    var r = new R(140 * k + 3, 82 * k + 3); r.k = k; r.ox = 1; r.oy = 1;
    var lL = Q.lA, lR = Q.lB, y0 = Q.hy + b, i, q;
    var np = mini ? 4 : 7;
    function bp(i, top, len) { var t = (i + 0.5) / np; return { t: t, y: top + t * len + b, s: (mini ? 2.4 : 3.6) + (mini ? 1.4 : 6.8) * Math.sin(Math.PI * (0.12 + 0.8 * t)), g: 0.45 + 0.55 * (1 - t) }; }
    function tailPlates(sg) {
      if (mini) return;
      [0.18, 0.38, 0.58, 0.78].forEach(function (t) {
        var tx = bz(sg[0], sg[2], sg[4], t), ty = bz(sg[1], sg[3], sg[5], t), rr = sg[6] + (sg[7] - sg[6]) * t;
        if (mecha) spike(r, tx, ty - rr * 0.7, rr * 0.35, 0, -1, 1, 0, pcol(P, Q, 0.45 * (1 - t), false));
        else plate(r, tx, ty - rr * 0.6, rr * 0.5, 0, -1, 1, 0, pcol(P, Q, 0.45 * (1 - t), false));
      });
    }
    function legs() {
      [[-1, lL], [1, lR]].forEach(function (s) {
        r.ell(cx + s[0] * 10, 56, 8.5, 10, P.body); r.ell(cx + s[0] * 10.5, 63 - s[1], 7, 7.5, P.body);
        r.ell(cx + s[0] * 11, 70 - s[1], back ? 7.5 : 8.5, back ? 2.8 : 3.2, P.body);
      });
    }
    function crystals() {
      if (!space) return;
      r.poly([[cx - 12, 32 + b], [cx - 23, 3 + b], [cx - 14, 12 + b], [cx - 6, 30 + b]], P.cr1);
      r.poly([[cx + 12, 32 + b], [cx + 23, 3 + b], [cx + 14, 12 + b], [cx + 6, 30 + b]], P.cr2);
    }
    var claws = [];
    function arms(behind) {
      [-1, 1].forEach(function (sd) {
        var raise = sd === 1 && pose === 'claw1', fwd = sd === 1 && pose === 'claw2';
        if (behind && !raise) { r.ell(cx + sd * 16, 37 + b, 4, 5.5, P.dark); return; }
        if (raise) { r.ell(cx + 15, 32, 4.4, 5, P.body); r.line(cx + 16, 30, cx + 19, 19, P.body, 2.8); claws.push([cx + 18, 16], [cx + 20, 16.5], [cx + 21.5, 18]); }
        else if (fwd) { r.ell(cx + 14, 37, 4.4, 5, P.body); r.line(cx + 13, 40, cx + 5, 47, P.body, 2.8); claws.push([cx + 3, 49], [cx + 5, 50], [cx + 7, 50]); }
        else { r.ell(cx + sd * 15, 36 + b, 4.4, 5, P.body); r.ell(cx + sd * 14.5, 43 + b, 3.4, 4.2, P.body); claws.push([cx + sd * 16, 47.6 + b], [cx + sd * 14.5, 48.2 + b], [cx + sd * 13, 47.6 + b]); }
      });
    }
    if (!back) {
      r.layer = 0;
      if (pose !== 'tail') { var tsg = [cx - 4, 60, cx - 28, 74, cx - 52 + sw * 2, 68, mini ? 6 : 9, 1.5]; r.curve.apply(r, tsg.concat([P.body])); tailPlates(tsg); }
      for (i = 0; i < np; i++) {
        q = bp(i, 13, 32);
        if (mecha) { spike(r, cx - 7, q.y, q.s * 0.4, -0.8, -0.6, -0.6, 0.8, pcol(P, Q, q.g, true)); spike(r, cx + 7, q.y, q.s * 0.4, 0.8, -0.6, 0.6, 0.8, pcol(P, Q, q.g, true)); continue; }
        plate(r, cx - 7, q.y, q.s * 0.72, -0.82, -0.57, -0.57, 0.82, pcol(P, Q, q.g, true));
        plate(r, cx + 7, q.y, q.s * 0.72, 0.82, -0.57, 0.57, 0.82, pcol(P, Q, q.g, true));
        plate(r, cx, q.y - 1, q.s * 0.9, 0, -1, 1, 0, pcol(P, Q, q.g, false));
      }
      r.layer = 1; legs();
      r.layer = 2;
      r.ell(cx, 44 + b, 15, 17, P.body); r.ell(cx, 33 + b, 14, 9.5, P.body); r.ell(cx, 24 + b, 8.5, 7, P.body);
      crystals();
      r.layer = 3;
      r.ell(cx, 46 + b, 9, 15, P.belly);
      r.recolor(P.belly, P.bellyD, function (x, y) { return y % 3 === 0; });
      if (mecha) { r.recolor(P.body, P.dark, function (x, y) { return y % 6 === 0; }); r.rect(cx - 3.5, 29 + b, 7, 5, P.accent); }
      r.layer = 4; gzHeadFront(r, P, style, cx, y0, Q);
      r.layer = 5; arms(false);
      if (pose === 'tail') { r.layer = 6; var ts2 = [cx + 4, 60, cx + 30, 78, cx + 52, 65, 9, 1.5]; r.curve.apply(r, ts2.concat([P.body])); }
    } else {
      r.layer = 0;
      if (mini) r.ell(cx, 17 + y0, 10, 9, P.body);
      else if (mecha) r.poly([[cx - 7, 10 + y0], [cx + 7, 10 + y0], [cx + 8.5, 17 + y0], [cx + 5, 25 + y0], [cx - 5, 25 + y0], [cx - 8.5, 17 + y0]], P.body);
      else { r.ell(cx, 16 + y0, 7.5, 6.5, P.body); if (space) r.poly([[cx - 2, 11 + y0], [cx, 1 + y0], [cx + 2, 11 + y0]], P.cr1); }
      arms(true);
      r.layer = 1; legs();
      r.layer = 2;
      r.ell(cx, 44 + b, 15, 17.5, P.body); r.ell(cx, 32 + b, 14.5, 9.5, P.body); r.ell(cx, 23 + b, 8.5, 7.5, P.body);
      if (mecha) r.recolor(P.body, P.dark, function (x, y) { return y % 6 === 0; });
      r.layer = 3;
      crystals();
      for (i = 0; i < np; i++) {
        q = bp(i, 14, 38);
        if (mecha) { spike(r, cx, q.y, q.s * 0.45, 0, -1, 1, 0, pcol(P, Q, q.g, false)); continue; }
        plate(r, cx - 2.6, q.y, q.s * 0.72, -0.95, -0.3, -0.3, 0.95, pcol(P, Q, q.g, true));
        plate(r, cx + 2.6, q.y, q.s * 0.72, 0.95, -0.3, 0.3, 0.95, pcol(P, Q, q.g, true));
        plate(r, cx, q.y, q.s * 0.6, 0, -1, 1, 0, pcol(P, Q, q.g, false));
      }
      r.layer = 4;
      var tb = pose === 'tail' ? [cx, 56, cx - 6, 78, cx - 40, 72, mini ? 7 : 10, 2] : [cx, 56, cx + 3, 78, cx + 34 + sw * 2, 76, mini ? 7 : 10, 2];
      r.curve.apply(r, tb.concat([P.body])); tailPlates(tb);
      if (pose === 'claw1') { r.layer = 5; arms(true); }
    }
    var tx0 = {}; tx0[P.body] = mini ? 0.1 : 0.3; tx0[P.dark] = 0.26; tx0[P.belly] = 0.12;
    r.shade2({ tex: tx0, skip: skipGlow(P), seed: style.length + (back ? 3 : 1), grad: mini ? 0 : 0.14 });
    if (!back) {
      if (mecha) { for (var vx = cx - 6; vx <= cx + 6; vx++) r.dot(vx, 16 + y0, Q.glowT > 0.9 ? '#ffffff' : P.eye); }
      else if (mini) { r.dot(cx - 4, 15 + y0, P.eye); r.dot(cx + 3, 15 + y0, P.eye); }
      else {
        r.dot(cx - 4.5, 17 + y0, P.eye); r.dot(cx + 3.5, 17 + y0, P.eye); r.dot(cx - 3.5, 17 + y0, '#140c04'); r.dot(cx + 2.5, 17 + y0, '#140c04');
        r.dot(cx - 2, 21.3 + y0, '#0c100c'); r.dot(cx + 1.5, 21.3 + y0, '#0c100c');
        if (Q.mouth) for (var t2 = cx - 3.5; t2 <= cx + 3.5; t2 += 1.4) { r.dot(t2, 22.7 + y0, '#f4f0e0'); r.dot(t2 + 0.7, 25.2 + y0 + Q.m2 * 0.4, '#e4e0d0'); }
        else { r.line(cx - 4.5, 24.4 + y0, cx + 4.5, 24.4 + y0, '#141410'); for (var t3 = cx - 4; t3 <= cx + 4; t3 += 2) r.dot(t3, 24.9 + y0, '#e8e4d4'); }
      }
      claws.forEach(function (c) { r.dot(c[0], c[1], P.claw); });
      [[-1, lL], [1, lR]].forEach(function (s) { [-3, 0, 3].forEach(function (o) { r.dot(cx + s[0] * 11 + o, 72.6 - s[1], P.claw); }); });
    }
    r.outline(OUT);
    return r;
  }

  function gzViews(style, player) {
    var k = GZK[style], TL = TLx[style];
    function mv(fn, ax, ay, mouth) {
      var V = { walk: [] }, i;
      for (i = 0; i < 4; i++) V.walk.push(pair(fn({ phase: i })));
      ['stand', 'claw1', 'claw2', 'tail', 'breath', 'roar'].forEach(function (p) { V[p] = pair(fn(p === 'stand' ? { stand: true } : { pose: p })); });
      V.attack = V.claw2;
      if (player) { V.charge = []; for (i = 0; i < 6; i++) V.charge.push(pair(fn({ pose: 'inhale', glowT: (i + 1) / 6 }))); }
      V.w = V.stand.r.width; V.h = V.stand.r.height; V.ax = ax; V.ay = ay; V.mouth = mouth;
      return V;
    }
    var S = mv(function (f) { return gzSide(style, f); }, (50 + TL) * k + 1, 71.5 * k + 1, { x: (78 - 50) * k, y: (21.5 - 71.5) * k });
    S.v = {
      front: mv(function (f) { return gzFrontBack(style, f, false); }, 70 * k + 1, 72.5 * k + 1, { x: 0, y: (24 - 72.5) * k }),
      back: mv(function (f) { return gzFrontBack(style, f, true); }, 70 * k + 1, 72.5 * k + 1, { x: 0, y: (11 - 72.5) * k })
    };
    return S;
  }
  Sprites.reg('godzilla', function () { return gzViews('godzilla', true); });
  Sprites.reg('minilla', function () { return gzViews('minilla', true); });
  Sprites.reg('mecha', function () { return gzViews('mecha', false); });
  Sprites.reg('spacegodzilla', function () { return gzViews('space', false); });

  /* ======================= Zweibeiner: Titanosaurus, Megalon, Moguera ======================= */
  var BPC = {
    titanosaurus: { body: '#8a4c30', dark: '#5a2e1c', belly: '#c88c5c', bellyD: '#a8704a', acc: '#e0a040', eye: '#ffe060', claw: '#e8e0c8' },
    megalon: { body: '#2e2e36', dark: '#18181e', belly: '#c8a030', bellyD: '#a07c1c', acc: '#d8b030', eye: '#ff3020', claw: '#c0c4cc', drill: '#b8bcc6' },
    moguera: { body: '#aab4c2', dark: '#68728a', belly: '#3a5a9a', bellyD: '#2a4478', acc: '#e0b030', eye: '#ff3030', claw: '#d0d8e4', drill: '#c8ccd4' }
  };
  var BK2 = 1.15;
  function bipSide(t, f) {
    var P = BPC[t], Q = params(f), b = Q.b, la = Q.la, lb = Q.lb, lA = Q.lA, lB = Q.lB, sw = Q.sw, atk = Q.atk;
    var TL = t === 'titanosaurus' ? 14 : 4, k = BK2;
    var r = new R((86 + TL) * k + 3, 80 * k + 3); r.k = k; r.ox = 1 + TL * k; r.oy = 1;
    r.layer = 0;
    if (t === 'titanosaurus') { r.curve(40, 52, 22, 70, 4, 64 + sw, 8, 3, P.body); r.poly([[6, 63 + sw], [-3, 45 + sw], [-12, 54 + sw], [-13, 70 + sw], [0, 76 + sw]], P.acc); }
    if (t === 'megalon') r.curve(40, 54, 30, 66, 22, 68, 6, 2, P.body);
    r.ell(54, 58, 6, 8, P.dark); r.ell(55 + lb, 65 - lB, 5, 6.5, P.dark); r.ell(58 + lb, 70.5 - lB, 7, 2.6, P.dark);
    r.ell(58, 37 + b, 3.5, 2.6, P.dark);
    if (t === 'megalon') r.poly([[40, 30 + b], [30, 18 + b], [34, 44 + b]], P.dark);
    r.layer = 1;
    r.ell(48, 44 + b, 11, 15, P.body); r.ell(52, 34 + b, 9, 9, P.body);
    if (t === 'titanosaurus') {
      r.curve(54, 30 + b, 60, 18 + b, 64, 12 + b, 5, 3.5, P.body);
      r.ell(67, 10 + b, 5, 3.6, P.body);
      r.poly([[68, 7.5 + b], [77, 9.5 + b], [76.5, 12.5 + b], [68, 13 + b]], P.body);
      r.poly([[62, 9 + b], [63, 0 + b], [68, 6 + b]], P.acc);
      if (atk) { r.poly([[68, 12 + b], [76, 13 + b], [75, 16 + b], [68, 15 + b]], P.body); r.poly([[69, 12.4 + b], [76.5, 12.6 + b], [76, 13.8 + b], [69, 13.8 + b]], '#5c1010'); }
    } else if (t === 'megalon') {
      r.ell(57, 22 + b, 6, 5.5, P.body);
      r.poly([[60, 24 + b], [66, 26 + b], [61, 28 + b]], P.dark);
      r.line(58, 17 + b, 63, 5 + b, P.acc, 1.2);
      r.poly([[63, 0 + b], [64, 2.5 + b], [67, 3 + b], [64, 4 + b], [63, 7 + b], [62, 4 + b], [59, 3 + b], [62, 2.5 + b]], P.acc);
    } else {
      r.poly([[50, 18 + b], [60, 15 + b], [64, 21 + b], [60, 28 + b], [50, 28 + b]], P.body);
      r.poly([[62, 19.5 + b], [77, 23 + b], [62, 26.5 + b]], P.drill);
      r.poly([[52, 18 + b], [49, 7 + b], [56, 17 + b]], P.acc);
    }
    r.layer = 2;
    r.ell(53, 44 + b, 5, 12, P.belly);
    r.recolor(P.belly, P.bellyD, function (x, y) { return y % 3 === 0; });
    if (t === 'megalon') r.recolor(P.body, P.dark, function (x, y) { return y % 5 === 0; });
    if (t === 'moguera') r.recolor(P.body, P.dark, function (x, y) { return y % 7 === 0; });
    r.layer = 3;
    r.ell(44, 57, 8, 9, P.body); r.ell(45 + la, 65 - lA, 6, 7, P.body); r.ell(48 + la, 71 - lA, 8, 2.8, P.body);
    r.layer = 4;
    if (t === 'titanosaurus') { r.ell(56, 37 + b, 3.6, 2.6, P.body); if (atk) r.line(56, 36, 64, 30, P.body, 2); else r.line(57, 38 + b, 61, 41 + b, P.body, 1.8); }
    else if (t === 'megalon') {
      r.ell(54, 36 + b, 4, 3.2, P.body);
      if (atk) r.poly([[56, 33], [75, 25], [57, 39]], P.drill); else r.poly([[55, 35 + b], [67, 49 + b], [52, 41 + b]], P.drill);
    } else {
      r.ell(55, 37 + b, 4, 3.2, P.body);
      if (atk) { r.line(55, 36, 67, 34, P.body, 2.5); r.poly([[67, 31.5], [76, 34], [67, 37]], P.drill); }
      else r.rect(55, 38 + b, 6, 5, P.dark);
    }
    var tx = {}; tx[P.body] = 0.24; tx[P.dark] = 0.2;
    r.shade2({ tex: tx, seed: t.length, grad: 0.12 });
    if (t === 'titanosaurus') { r.dot(70, 9 + b, P.eye); r.line(68, 8 + b, 71, 8.3 + b, '#2a1408'); }
    else if (t === 'megalon') { r.dot(60, 21 + b, P.eye); r.dot(61, 21 + b, P.eye); if (!atk) r.line(57, 40 + b, 63, 46 + b, sh(P.drill, -0.4)); }
    else { r.line(53, 21 + b, 60, 21 + b, P.eye); r.line(66, 22 + b, 69, 24 + b, sh(P.drill, -0.4)); }
    r.dot(51 + la, 72.5 - lA, P.claw); r.dot(53 + la, 72.2 - lA, P.claw);
    r.outline(OUT);
    return r;
  }
  function bipFB(t, f, back) {
    var P = BPC[t], Q = params(f), b = Q.b, k = BK2, cx = 60, atk = Q.atk;
    var r = new R(120 * k + 3, 84 * k + 3); r.k = k; r.ox = 1; r.oy = 1;
    function legs() { [[-1, Q.lA], [1, Q.lB]].forEach(function (s) { r.ell(cx + s[0] * 8, 57, 7, 9, P.body); r.ell(cx + s[0] * 8.5, 64 - s[1], 5.5, 7, P.body); r.ell(cx + s[0] * 9, 70.5 - s[1], 7, 2.8, P.body); }); }
    function head(face) {
      if (t === 'titanosaurus') {
        r.ell(cx, 26 + b, 4.5, 7, P.body); r.ell(cx, 15 + b, 5, 4.5, P.body);
        if (face) r.ell(cx, 18.5 + b, 3.4, 2.4, P.body);
        r.poly([[cx - 2, 12 + b], [cx, 2 + b], [cx + 2, 12 + b]], P.acc);
      } else if (t === 'megalon') {
        r.ell(cx, 24 + b, 7, 6, P.body);
        r.line(cx, 19 + b, cx, 7 + b, P.acc, 1.2);
        r.poly([[cx, 1 + b], [cx + 1, 3.5 + b], [cx + 4, 4 + b], [cx + 1, 5 + b], [cx, 8 + b], [cx - 1, 5 + b], [cx - 4, 4 + b], [cx - 1, 3.5 + b]], P.acc);
      } else {
        r.ell(cx, 23 + b, 7, 6.5, P.body);
        r.poly([[cx - 2, 18 + b], [cx, 8 + b], [cx + 2, 18 + b]], P.acc);
        if (face) r.ell(cx, 25 + b, 3.5, 3.5, P.drill);
      }
    }
    function arms() {
      [-1, 1].forEach(function (sd) {
        var up = atk && sd === 1;
        if (t === 'megalon') {
          r.ell(cx + sd * 14, 36 + b, 4, 4.5, P.body);
          if (up) r.poly([[cx + 12, 33], [cx + 18, 33], [cx + 17, 15]], P.drill);
          else r.poly([[cx + sd * 11.5, 39 + b], [cx + sd * 17, 39 + b], [cx + sd * 15, 55 + b]], P.drill);
        } else if (t === 'moguera') {
          r.ell(cx + sd * 14, 36 + b, 4, 4.5, P.body);
          if (up) r.rect(cx + 12, 22, 6, 12, P.dark); else r.rect(cx + sd * 14 - 3, 38 + b, 6, 9, P.dark);
        } else {
          r.ell(cx + sd * 12, 37 + b, 3, 4, P.body);
          if (up) r.line(cx + 12, 35, cx + 15, 27, P.body, 1.8);
        }
      });
    }
    r.layer = 0;
    if (!back) {
      if (t === 'titanosaurus') { r.curve(cx - 4, 60, cx - 24, 72, cx - 44 + Q.sw * 2, 66, 7, 2.5, P.body); r.poly([[cx - 44, 62], [cx - 56, 50], [cx - 58, 66], [cx - 50, 74]], P.acc); }
      if (t === 'megalon') r.poly([[cx - 8, 30 + b], [cx - 20, 14 + b], [cx - 14, 40 + b]], P.dark), r.poly([[cx + 8, 30 + b], [cx + 20, 14 + b], [cx + 14, 40 + b]], P.dark);
    } else head(false);
    r.layer = 1; legs();
    r.layer = 2; r.ell(cx, 44 + b, 13, 15, P.body); r.ell(cx, 34 + b, 12, 8.5, P.body);
    if (t === 'megalon') r.recolor(P.body, P.dark, function (x, y) { return y % 5 === 0; });
    if (!back) {
      r.layer = 3; r.ell(cx, 45 + b, 7, 12, P.belly); r.recolor(P.belly, P.bellyD, function (x, y) { return y % 3 === 0; });
      r.layer = 4; head(true);
    } else {
      r.layer = 3;
      if (t === 'titanosaurus') { r.curve(cx, 56, cx + 4, 76, cx + 28, 74, 8, 3, P.body); r.poly([[cx + 26, 70], [cx + 42, 60], [cx + 46, 76], [cx + 34, 82]], P.acc); }
      if (t === 'megalon') { r.poly([[cx - 4, 30 + b], [cx - 18, 14 + b], [cx - 12, 46 + b]], P.dark); r.poly([[cx + 4, 30 + b], [cx + 18, 14 + b], [cx + 12, 46 + b]], P.dark); }
    }
    r.layer = 5; arms();
    var tx = {}; tx[P.body] = 0.24; tx[P.dark] = 0.2;
    r.shade2({ tex: tx, seed: t.length + (back ? 5 : 2), grad: 0.12 });
    if (!back) {
      if (t === 'titanosaurus') { r.dot(cx - 2.5, 15 + b, P.eye); r.dot(cx + 2.5, 15 + b, P.eye); }
      else if (t === 'megalon') { r.dot(cx - 3, 23 + b, P.eye); r.dot(cx + 3, 23 + b, P.eye); }
      else { r.line(cx - 6, 21 + b, cx + 6, 21 + b, P.eye); r.ell(cx, 25 + b, 1.2, 1.2, sh(P.drill, -0.4)); }
    }
    r.outline(OUT);
    return r;
  }
  function bipViews(t) {
    var k = BK2, TL = t === 'titanosaurus' ? 14 : 4;
    function mv(fn, ax, mouth) {
      var V = { walk: [] };
      for (var i = 0; i < 4; i++) V.walk.push(pair(fn({ phase: i })));
      V.stand = pair(fn({ stand: true })); V.attack = pair(fn({ stand: true, atk: true }));
      V.w = V.stand.r.width; V.h = V.stand.r.height; V.ax = ax; V.ay = 72 * k + 1; V.mouth = mouth;
      return V;
    }
    var mo = { titanosaurus: [76, 11], megalon: [63, 4], moguera: [62, 21] }[t];
    var S = mv(function (f) { return bipSide(t, f); }, (48 + TL) * k + 1, { x: (mo[0] - 48) * k, y: (mo[1] - 72) * k });
    S.v = {
      front: mv(function (f) { return bipFB(t, f, false); }, 60 * k + 1, { x: 0, y: ({ titanosaurus: 17, megalon: 4, moguera: 25 }[t] - 72) * k }),
      back: mv(function (f) { return bipFB(t, f, true); }, 60 * k + 1, { x: 0, y: -52 * k })
    };
    return S;
  }
  ['titanosaurus', 'megalon', 'moguera'].forEach(function (t) { Sprites.reg(t, function () { return bipViews(t); }); });

  /* ======================= Ghidorah & Mecha-King Ghidorah (Front/Rücken) ======================= */
  function ghiFB(f, mkg, back) {
    var GP = Sprites.GP, K = Sprites.GK, cx = 40;
    var r = new R(80 * K, 66 * K); r.k = K; r.ox = 1; r.oy = 1;
    var fl = f.stand ? 0 : f.phase || 0, ff = [0, 0.4, 1, 0.4][fl], sw = [0, 1, 0, -1][fl], mouth = f.atk;
    var heads = [[cx - 15, 11 + sw], [cx, 5 - sw], [cx + 15, 11 + sw]];
    function wings(col) { [-1, 1].forEach(function (sd) { r.poly([[cx + sd * 5, 30], [cx + sd * 10, 22], [cx + sd * 33, 2 + ff * 22], [cx + sd * 39, 14 + ff * 20], [cx + sd * 31, 26 + ff * 8], [cx + sd * 20, 34]], col); }); }
    function necks(face) {
      var bases = [[cx - 5, 34], [cx, 32], [cx + 5, 34]], ctr = [[cx - 14, 25], [cx, 20], [cx + 14, 25]];
      heads.forEach(function (h, i) {
        var col = mkg && i === 1 ? GP.metal : GP.body;
        r.curve(bases[i][0], bases[i][1], ctr[i][0], ctr[i][1], h[0], h[1] + 3, 3.4, 2.8, col);
        r.line(h[0] - 2, h[1] - 2, h[0] - 6, h[1] - 9, GP.horn, 0.8); r.line(h[0] + 2, h[1] - 2, h[0] + 6, h[1] - 9, GP.horn, 0.8);
        r.ell(h[0], h[1], 4.2, 3.6, col);
        if (face) { r.ell(h[0], h[1] + 2.6, 3, 2.2, col); if (mouth) r.ell(h[0], h[1] + 4, 2.4, 1.6, GP.mouth); }
      });
    }
    function legs() { [-1, 1].forEach(function (sd) { r.ell(cx + sd * 6, 54, 4.5, 6, GP.body); r.ell(cx + sd * 6.5, 60, 5, 2, GP.body); }); }
    if (!back) {
      r.layer = 0; wings(GP.wingD);
      r.curve(cx - 3, 52, cx - 14, 56, cx - 26, 60 + sw, 3.5, 1, GP.dark); r.curve(cx + 3, 52, cx + 14, 56, cx + 26, 60 - sw, 3.5, 1, GP.dark);
      r.layer = 1; legs();
      r.layer = 2; r.ell(cx, 42, 12, 12, GP.body); r.ell(cx, 44, 7, 9, GP.belly);
      r.recolor(GP.belly, sh(GP.belly, -0.18), function (x, y) { return y % 4 === 0; });
      if (mkg) { r.poly([[cx - 7, 33], [cx + 7, 33], [cx + 8, 46], [cx, 50], [cx - 8, 46]], GP.metal); r.recolor(GP.metal, GP.metalD, function (x, y) { return y % 5 === 0; }); }
      r.layer = 3; necks(true);
    } else {
      r.layer = 0; necks(false);
      r.layer = 1; legs();
      r.layer = 2; r.ell(cx, 42, 12, 12, GP.body);
      r.layer = 3; wings(GP.wing);
      r.layer = 4; r.curve(cx - 3, 50, cx - 8, 62, cx - 24, 63 + sw, 4, 1, GP.body); r.curve(cx + 3, 50, cx + 8, 62, cx + 24, 63 - sw, 4, 1, GP.body);
    }
    var tx = {}; tx[GP.body] = 0.3; tx[GP.dark] = 0.25;
    r.shade2({ tex: tx, seed: 11 + (back ? 4 : 0), grad: 0.1 });
    if (!back) heads.forEach(function (h, i) {
      if (mkg && i === 1) { r.line(h[0] - 3, h[1], h[0] + 3, h[1], GP.visor); return; }
      r.dot(h[0] - 1.5, h[1] - 0.4, GP.eye); r.dot(h[0] + 1.5, h[1] - 0.4, GP.eye);
    });
    else [-1, 1].forEach(function (sd) { r.line(cx + sd * 6, 30, cx + sd * 33, 3 + ff * 22, sh(GP.wing, -0.35)); });
    r.outline(OUT);
    return r;
  }
  function ghiViews(mkg) {
    var K = Sprites.GK, GP = Sprites.GP;
    var S = H.mkSet(function (f) { return Sprites.ghidorah(f, mkg); }, 32 * K + 2, 60 * K + 1);
    S.mouths = [[32, 11], [52, 7], [68, 19]].map(function (m) { return { x: m[0] * K + 2 - S.ax, y: m[1] * K + 1 - S.ay }; });
    S.mouth = S.mouths[1];
    function mv(back) {
      var V = H.mkSet(function (f) { return ghiFB(f, mkg, back); }, 40 * K + 1, 60 * K + 1);
      V.mouths = [[25, 15], [40, 9], [55, 15]].map(function (m) { return { x: (m[0] - 40) * K, y: (m[1] - 60) * K }; });
      V.mouth = V.mouths[1];
      return V;
    }
    S.v = { front: mv(false), back: mv(true) };
    return S;
  }
  Sprites.reg('ghidorah', function () { return ghiViews(false); });
  Sprites.reg('mkg', function () { return ghiViews(true); });

  /* ======================= Mothra & Battra ======================= */
  function larva(f, battra) {
    var k = MK * 1.15, r = new R(80 * k + 3, 36 * k + 3); r.k = k; r.ox = 1; r.oy = 1;
    var C = battra ? { b: '#2e2428', u: '#5a3a3a', e: '#ff2a1a', sp: '#e86a1a', h: '#3a2c30' } : { b: '#7a5a3a', u: '#b8946a', e: '#4ab8ff', sp: '#e8c070', h: '#5a3c26' };
    var ph = f.stand ? 0 : f.phase || 0, n = 9, hyv = 22, i;
    for (i = 0; i < n; i++) {
      var t = i / (n - 1), x = 6 + t * 56, amp = f.stand ? 0 : Math.sin(ph * Math.PI / 2 + i * 0.9) * 1.6;
      var y = 22 - amp - (f.atk && i > 5 ? (i - 5) * 2.6 : 0), rad = 5 + Math.sin(t * Math.PI) * 3 + (t > 0.85 ? -0.5 : 0);
      r.layer = i;
      r.ell(x, y, rad * 0.95, rad, C.b);
      r.ell(x, y + rad * 0.55, rad * 0.8, rad * 0.38, C.u);
      if (battra) r.poly([[x - 2, y - rad + 1], [x + 2, y - rad + 1], [x - 1, y - rad - 4]], C.sp);
      if (i === n - 1) hyv = y;
    }
    r.layer = 10;
    r.ell(67, hyv, 6, 5.5, C.h);
    if (battra) r.poly([[67, hyv - 3], [80, hyv - 15], [71, hyv - 1]], C.sp);
    if (f.atk) r.ell(72, hyv + 2.5, 2.2, 1.6, '#401010');
    r.shade2({ tex: (function () { var o = {}; o[C.b] = 0.22; return o; })(), seed: battra ? 4 : 8 });
    r.ell(69, hyv - 1, 1.7, 1.7, C.e); r.dot(69.5, hyv - 1.5, '#ffffff');
    for (i = 0; i < 7; i++) r.dot(10 + i * 8, 29, '#201812');
    r.outline(OUT);
    return r;
  }
  function cocoon(f) {
    var k = MK * 1.1, r = new R(64 * k + 2, 40 * k + 2); r.k = k; r.ox = 1; r.oy = 1;
    r.ell(32, 25, 27, 12.5, '#ece6d4');
    for (var i = 0; i < 14; i++) { var x = 10 + hash(i, 1, 3) * 44; r.line(x, 14 + hash(i, 2, 3) * 4, x + 6 - hash(i, 3, 3) * 12, 34 - hash(i, 4, 3) * 4, '#cfc6ae'); }
    r.shade2({ grad: 0.1 });
    if (f.atk) r.ell(32, 25, 6, 3, '#fff6c0');
    r.outline('#5a5040');
    return r;
  }
  // weiche Flügelformen aus kubischen Bézier-Kurven
  function cub(s, n, out) {
    for (var i = 0; i <= n; i++) {
      var t = i / n, u = 1 - t;
      out.push([u * u * u * s[0][0] + 3 * u * u * t * s[1][0] + 3 * u * t * t * s[2][0] + t * t * t * s[3][0],
        u * u * u * s[0][1] + 3 * u * u * t * s[1][1] + 3 * u * t * t * s[2][1] + t * t * t * s[3][1]]);
    }
    return out;
  }
  function wingPts(segs, tf) { var p = []; segs.forEach(function (s) { cub(s, 12, p); }); return p.map(tf); }
  function inset(pts, k) {
    var cx = 0, cy = 0; pts.forEach(function (p) { cx += p[0]; cy += p[1]; }); cx /= pts.length; cy /= pts.length;
    return pts.map(function (p) { return [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]; });
  }
  var MOTH = {
    mothra: {
      fore: [[[1, 13], [8, 3], [20, -1], [29, 3]], [[29, 3], [34, 6], [33, 15], [27, 18]], [[27, 18], [19, 21], [9, 20], [2, 19]]],
      hind: [[[2, 19], [11, 19], [21, 22], [25, 28]], [[25, 28], [26, 35], [17, 40], [10, 37]], [[10, 37], [5, 34], [2, 28], [1, 21]]],
      border: '#4a2410', base: '#eaa232', base2: '#d4801e', body: '#7a4e28', fur: '#f2e8cc', head: '#f0e6d0', eye: '#3ac8ff'
    },
    battra: {
      fore: [[[1, 13], [8, 2], [22, -2], [32, 1]], [[32, 1], [30, 8], [31, 14], [24, 18]], [[24, 18], [17, 21], [9, 20], [2, 19]]],
      hind: [[[2, 19], [12, 19], [22, 22], [26, 30]], [[26, 30], [22, 34], [18, 42], [11, 38]], [[11, 38], [5, 34], [2, 28], [1, 21]]],
      border: '#0e0606', base: '#2e161a', base2: '#241014', body: '#1e1416', fur: '#3a2226', head: '#2a1a1c', eye: '#ff2a1a'
    }
  };
  function moth(f, battra) {
    var k = 2.0, r = new R(66 * k + 2, 46 * k + 2); r.k = k; r.ox = 1; r.oy = 1 + 2 * k;
    var C = battra ? MOTH.battra : MOTH.mothra;
    var fl = f.atk ? 0 : [0, 1, 2, 1][f.stand ? 0 : f.phase || 0], sp = [1, 0.7, 0.38][fl], lift = [0, 2.5, 5][fl], cx = 33;
    [-1, 1].forEach(function (s) {
      var tf = function (p) { return [cx + s * p[0] * sp, p[1] - lift * (p[0] / 30)]; };
      var P = function (x, y) { return tf([x, y]); };
      // Hinterflügel
      r.layer = 0;
      var hp = wingPts(C.hind, tf); r.poly(hp, C.border); r.poly(inset(hp, 0.8), C.base2);
      // Vorderflügel
      r.layer = 1;
      var fp = wingPts(C.fore, tf); r.poly(fp, C.border); r.poly(inset(fp, 0.82), C.base);
      if (battra) {
        var z = [P(4, 12), P(10, 7), P(14, 11), P(20, 5), P(24, 9), P(28, 4)];
        for (var i = 1; i < z.length; i++) r.line(z[i - 1][0], z[i - 1][1], z[i][0], z[i][1], '#ff7a1a', 0.9);
        r.ell(P(19, 14)[0], P(19, 14)[1], 2.2 * sp + 0.4, 1.6, '#d8301a');
        r.ell(P(14, 30)[0], P(14, 30)[1], 3 * sp + 0.5, 2.4, '#b02018');
        r.ell(P(14, 30)[0], P(14, 30)[1], 1.2 * sp + 0.3, 1, '#ffb030');
      } else {
        var e1 = P(19, 9); r.ell(e1[0], e1[1], 3.8 * sp + 0.5, 3, '#2a1408'); r.ell(e1[0], e1[1], 2.6 * sp + 0.4, 2, '#ffd84a'); r.ell(e1[0], e1[1], 1.1 * sp + 0.3, 0.9, '#3a7ac8');
        var e2 = P(15, 30); r.ell(e2[0], e2[1], 3 * sp + 0.5, 2.5, '#2a1408'); r.ell(e2[0], e2[1], 1.8 * sp + 0.3, 1.5, '#e86a2a');
        r.ell(P(8, 15)[0], P(8, 15)[1], 1.4 * sp + 0.3, 1.2, '#7a3a14');
      }
    });
    r.layer = 3;
    r.ell(cx, 25, 3.2, 11, C.body);
    r.recolor(C.body, sh(C.body, -0.25), function (x, y) { return y % Math.round(3 * k) === 0; });
    r.ell(cx, 12, 4.4, 4.2, C.fur);
    r.ell(cx, 6.5, 3, 2.6, C.head);
    if (battra) r.poly([[cx - 1.2, 5], [cx, -1.5], [cx + 1.2, 5]], '#e8a020');
    var tx = {}; tx[C.base] = 0.12; tx[C.base2] = 0.12; tx[C.fur] = 0.3; tx[C.body] = 0.25;
    r.shade2({ tex: tx, seed: battra ? 6 : 2 });
    // Adern
    [-1, 1].forEach(function (s) {
      function P2(x, y) { return [cx + s * x * sp, y - lift * (x / 30)]; }
      var a = P2(3, 14), b = P2(24, 6), c = P2(26, 15), d = P2(20, 30), vc = battra ? '#120808' : sh(C.base, -0.3);
      r.line(a[0], a[1], b[0], b[1], vc); r.line(a[0], a[1], c[0], c[1], vc); r.line(a[0], a[1] + 5, d[0], d[1], vc);
      if (!battra) for (var j = 0; j < 5; j++) { var w = P2(10 + j * 4.5, 1 + j * 0.4 + (j > 3 ? 2 : 0)); r.dot(w[0], w[1] + 0.8, '#fff6dc'); }
    });
    r.dot(cx - 1.4, 6.2, C.eye); r.dot(cx + 1.4, 6.2, C.eye);
    // gefiederte Fühler
    [-1, 1].forEach(function (s) {
      r.line(cx + s, 4.5, cx + s * 6, -1.5, battra ? '#5a3030' : '#f0e6d0');
      for (var q = 1; q < 4; q++) r.dot(cx + s * (1 + q * 1.4) - s * 0.6, 4 - q * 1.6 - 0.8, battra ? '#5a3030' : '#e0d4b8');
    });
    if (f.atk) { r.ell(cx - 6, -1.5, 1.4, 1.4, '#ffffff'); r.ell(cx + 6, -1.5, 1.4, 1.4, '#ffffff'); }
    r.outline(OUT);
    return r;
  }
  var K2 = 2.0, KL = MK * 1.15, KC = MK * 1.1;
  Sprites.reg('mothraLarva', function () { return H.mkSet(function (f) { return larva(f, false); }, 36 * KL + 1, 30 * KL + 1, { mouth: { x: 36 * KL, y: -10 * KL } }); });
  Sprites.reg('battraLarva', function () { return H.mkSet(function (f) { return larva(f, true); }, 36 * KL + 1, 30 * KL + 1, { mouth: { x: 40 * KL, y: -16 * KL } }); });
  Sprites.reg('mothraCocoon', function () { return H.mkSet(cocoon, 32 * KC + 1, 37 * KC + 1, { mouth: { x: 0, y: -12 * KC } }); });
  function mothSet(battra) {
    var S = H.mkSet(function (f) { return moth(f, battra); }, 33 * K2 + 1, 36 * K2 + 1);
    S.mouths = [{ x: -6 * K2, y: -37.5 * K2 }, { x: 6 * K2, y: -37.5 * K2 }];
    S.mouth = { x: 0, y: -30 * K2 };
    S.sym = true;
    return S;
  }
  Sprites.reg('mothraImago', function () { return mothSet(false); });
  Sprites.reg('battra', function () { return mothSet(true); });

  /* ======================= Biolante – Rosenform (erste Gestalt im Film) ======================= */
  var RP = { trunk: '#2c4428', dark: '#1a2a18', mid: '#3c5a34', leaf: '#2e5e2a', leafL: '#4c8a3c', vein: '#86b06a',
    petal: '#c8202a', petalD: '#7a0e16', petalL: '#ee5a5e', maw: '#3a0608', tooth: '#f2ecd8', trap: '#36583a', trapIn: '#a01828',
    glow: ['#ffd060', '#ffb030', '#ff8a20', '#ffe890'] };
  var RK = 1.5;
  function trapR(r, x, y, dx, dy, s, o, col) {
    var l = Math.sqrt(dx * dx + dy * dy) || 1; dx /= l; dy /= l;
    var nx = -dy, ny = dx;
    function P(a, b) { return [x + dx * a + nx * b, y + dy * a + ny * b]; }
    r.poly([P(-1, 0), P(s * 0.4, -s * 0.5 - o * s * 0.4), P(s * 1.4, -s * 0.35 - o * s * 0.85), P(s * 1.55, -o * s * 0.45), P(s * 0.4, -o * 0.3)], col);
    r.poly([P(-1, 0), P(s * 0.4, s * 0.5 + o * s * 0.4), P(s * 1.4, s * 0.35 + o * s * 0.85), P(s * 1.55, o * s * 0.45), P(s * 0.4, o * 0.3)], col);
    if (o > 0.2) r.poly([P(0.3, 0), P(s * 1.35, -o * s * 0.7), P(s * 1.45, o * s * 0.7)], RP.trapIn);
  }
  // gezacktes Blatt entlang einer Richtung
  function leafR(r, x, y, dx, dy, len, wid, col) {
    var l = Math.sqrt(dx * dx + dy * dy); dx /= l; dy /= l;
    var nx = -dy, ny = dx, L = [], Rr = [];
    for (var i = 0; i <= 12; i++) {
      var t = i / 12, w = wid * Math.sin(Math.PI * Math.min(1, t * 1.1)) * (i % 2 ? 1.12 : 0.88);
      var cx = x + dx * len * t, cy = y + dy * len * t;
      L.push([cx + nx * w, cy + ny * w]); Rr.push([cx - nx * w, cy - ny * w]);
    }
    r.poly(L.concat(Rr.reverse()), col);
    return [x, y, x + dx * len, y + dy * len];
  }
  function rose(f) {
    var r = new R(100 * RK + 4, 104 * RK + 4); r.k = RK; r.ox = 2; r.oy = 2;
    var ph = f.stand ? 0 : (f.phase || 0), s = [0, 1.5, 0, -1.5][ph], atk = f.atk;
    var A = atk ? 1 : f.stand ? 0.15 : [0.1, 0.45, 0.8, 0.45][ph];
    var traps = [], veins = [], i;
    function tent(x0, y0, x1, y1, x2, y2, col, sz) {
      r.curve(x0, y0, x1, y1, x2, y2, 2.6, 1.4, col);
      sz *= 1.3; var op = 0.4 + 0.5 * A;
      traps.push([x2, y2, x2 - x1, y2 - y1, sz, op]);
      trapR(r, x2, y2, x2 - x1, y2 - y1, sz, op, col === RP.dark ? RP.dark : RP.trap);
    }
    r.layer = 0;
    tent(40, 72, 14, 58 + s, 6, 36 + s, RP.dark, 3.4);
    tent(62, 70, 90, 60 - s, 96, 38 - s, RP.dark, 3.4);
    tent(46, 52, 22, 32, 14, 14 - s, RP.dark, 3);
    r.layer = 1;
    veins.push(leafR(r, 47, 34, -1, -0.45, 32, 8, RP.leaf));
    veins.push(leafR(r, 53, 34, 1, -0.5, 32, 8, RP.leaf));
    veins.push(leafR(r, 48, 26, -0.6, -1, 22, 6, RP.leaf));
    r.layer = 2;
    r.ell(50, 92, 26, 8, RP.dark);
    r.ell(50, 80, 21, 14, RP.trunk); r.ell(50, 62, 17, 16, RP.trunk); r.ell(50, 44, 12, 14, RP.trunk); r.ell(50, 31, 8, 8, RP.trunk);
    for (i = 0; i < 90; i++) {
      var x = 32 + hash(i, 4, 3) * 36, y = 26 + hash(i, 5, 3) * 66;
      var cur = r.get(Math.floor(r.tx(x)), Math.floor(r.ty(y)));
      if (cur === RP.trunk) r.line(x, y, x + (hash(i, 6, 3) - 0.5) * 2, y + 3 + hash(i, 7, 3) * 6, i % 2 ? RP.dark : RP.mid);
    }
    // glühende Kernbrust (wie Maiskörner)
    r.layer = 3;
    r.ell(53, 68, 8, 12, '#5a1a08');
    for (var cy = 58; cy <= 78; cy += 2.4) for (var cx = 47; cx <= 59; cx += 2.4) {
      var dx2 = (cx - 53) / 7, dy2 = (cy - 68) / 11;
      if (dx2 * dx2 + dy2 * dy2 < 1) r.ell(cx + ((cy * 5) % 2 ? 0.6 : 0), cy, 1.05, 1.05, RP.glow[Math.floor(hash(cx * 7, cy * 7, 3) * 4)]);
    }
    r.layer = 4;
    veins.push(leafR(r, 44, 48, -1, 0.15, 34, 9, RP.leafL));
    veins.push(leafR(r, 56, 46, 1, 0.05, 34, 9, RP.leafL));
    // Rosenblüte mit Zahnmaul
    r.layer = 5;
    var rx = 50, ry = 16;
    for (i = 0; i < 10; i++) { var a = i / 10 * 6.283; r.ell(rx + Math.cos(a) * 9, ry + Math.sin(a) * 6.5, 6, 4.5, i % 2 ? RP.petalD : RP.petal); }
    for (i = 0; i < 8; i++) { var a2 = i / 8 * 6.283 + 0.3; r.ell(rx + Math.cos(a2) * 5.5, ry + Math.sin(a2) * 4, 4.5, 3.4, i % 2 ? RP.petal : RP.petalL); }
    for (i = 0; i < 6; i++) { var a3 = i / 6 * 6.283 + 0.6; r.ell(rx + Math.cos(a3) * 2.8, ry + Math.sin(a3) * 2, 3, 2.4, i % 2 ? RP.petalL : RP.petal); }
    r.ell(rx, ry + 0.5, 4.2, 0.6 + 3.4 * A, RP.maw);
    // vordere Ranken
    r.layer = 6;
    tent(44, 84, 18, 92, 4, 76, RP.trap, 3.4);
    tent(58, 84, 86, 94, 98, 78, RP.trap, 3.4);
    var tx = {}; tx[RP.trunk] = 0.4; tx[RP.leaf] = 0.25; tx[RP.leafL] = 0.25; tx[RP.petal] = 0.15; tx[RP.trap] = 0.3;
    var sk = {}; RP.glow.forEach(function (c) { sk[c] = 1; }); sk[RP.maw] = 1; sk[RP.trapIn] = 1;
    r.shade2({ tex: tx, skip: sk, seed: 77, grad: 0.1 });
    veins.forEach(function (v) { r.line(v[0], v[1], v[0] + (v[2] - v[0]) * 0.9, v[1] + (v[3] - v[1]) * 0.9, RP.vein); });
    if (A > 0.2) for (i = 0; i < 10; i++) { var at = i / 10 * 6.283; r.dot(rx + Math.cos(at) * 3.6, ry + 0.5 + Math.sin(at) * (0.4 + 3 * A), RP.tooth); }
    traps.forEach(function (q) {
      var x = q[0], y = q[1], dx = q[2], dy = q[3], l = Math.sqrt(dx * dx + dy * dy) || 1; dx /= l; dy /= l;
      var nx = -dy, ny = dx, sz = q[4], op = q[5];
      for (var j = 1; j <= 4; j++) {
        var a = sz * (0.3 + j * 0.27), w = op * sz * 0.5 * (a / (sz * 1.4)) + 0.5;
        r.dot(x + dx * a - nx * w, y + dy * a - ny * w, RP.tooth); r.dot(x + dx * a + nx * w, y + dy * a + ny * w, RP.tooth);
      }
    });
    r.outline('soft');
    return r;
  }
  Sprites.reg('biolanteRose', function () {
    var S = H.mkSet(rose, 50 * RK + 2, 88 * RK + 2);
    S.mouth = { x: 0, y: (16 - 88) * RK };
    S.core = { x: (53 - 50) * RK, y: (68 - 88) * RK, r: 14 };
    S.sym = true;
    return S;
  });

  /* ======================= Super-X (1984) & Super-X2 (1989) ======================= */
  var XK = 1.35;
  function superx(f, two) {
    var r = new R(86 * XK + 4, 40 * XK + 4); r.k = XK; r.ox = 2; r.oy = 2;
    var fl = f.stand ? 0 : (f.phase || 0) % 2, atk = f.atk;
    var C = two ? { hull: '#3c4a5e', dark: '#232c3a', top: '#5a6a80', trim: '#8a9ab0', glass: '#6ad0ff', mir: atk ? '#ffe890' : '#b89a40', mirD: '#7a6020' }
      : { hull: '#5c646e', dark: '#363c44', top: '#7c848e', trim: '#a8b0b8', glass: '#6ac8ff' };
    r.layer = 0;
    // hintere Flosse & Triebwerke
    r.poly([[8, 16], [2, 4], [14, 8], [20, 16]], C.dark);
    r.layer = 1;
    if (two) r.poly([[6, 22], [18, 12], [52, 9], [72, 12], [84, 20], [80, 26], [62, 30], [16, 30]], C.hull);
    else r.poly([[4, 22], [20, 12], [62, 10], [78, 15], [82, 21], [66, 28], [16, 30]], C.hull);
    r.poly(two ? [[18, 12], [52, 9], [72, 12], [70, 16], [22, 17]] : [[20, 12], [62, 10], [78, 15], [74, 18], [24, 17]], C.top);
    r.rect(14, 26, 54, 3, C.dark);
    // Cockpit-Kuppel
    r.ell(two ? 46 : 50, 9.5, 7, 3.2, C.trim); r.ell(two ? 46 : 50, 9, 5, 2.2, C.glass);
    // Seitenflügel
    r.poly([[30, 24], [44, 24], [40, 36], [28, 34]], C.dark);
    if (two) {
      // Feuerspiegel an der Front
      r.layer = 2;
      r.ell(78, 20, 5.5, 7.5, C.mirD); r.ell(78.6, 20, 4.2, 6.2, C.mir);
    } else {
      // Raketenluken (beim Angriff offen)
      for (var i = 0; i < 4; i++) r.rect(28 + i * 8, 13.5, 4, 2, atk ? '#ff8a30' : C.dark);
    }
    r.shade2({ tex: (function () { var o = {}; o[C.hull] = 0.12; return o; })(), seed: two ? 9 : 4 });
    // Triebwerksglühen
    [[18, 31], [30, 31], [50, 31], [62, 30]].forEach(function (p, j) { r.ell(p[0], p[1] + 0.6, 1.8, 1, (fl + j) % 2 ? '#ffd060' : '#ff8a30'); });
    r.ell(3, 13, 1.6, 1.2, fl ? '#ffe090' : '#ff9a40');
    r.line(22, 20, 70, 19, two ? '#2a3446' : '#4a525c');
    if (two) { r.dot(76, 17, '#ffffff'); r.dot(77, 16, '#ffffff'); }
    r.outline('soft');
    return r;
  }
  function vehicleSet(two) {
    var S = H.mkSet(function (f) { return superx(f, two); }, 42 * XK + 2, 34 * XK + 2);
    S.mouth = { x: (80 - 42) * XK, y: (20 - 34) * XK };
    if (two) S.mirror = { x: (78 - 42) * XK, y: (20 - 34) * XK };
    return S;
  }
  Sprites.reg('superx', function () { return vehicleSet(false); });
  Sprites.reg('superx2', function () { return vehicleSet(true); });
  // Maser-Kanone (Typ 66) auf Lkw
  Sprites.maser = function () {
    var r = new R(24, 18);
    r.poly([[2, 12], [12, 7], [22, 12], [12, 17]], '#4a5a3a');
    r.poly([[2, 12], [12, 17], [22, 12], [22, 13.5], [12, 18], [2, 13.5]], '#2a3420');
    r.line(12, 11, 12, 6, '#6a6e72', 0.8);
    r.ell(13, 4.5, 4.5, 2.6, '#c8ccd2'); r.ell(13.5, 4.5, 2.6, 1.6, '#8a9098'); r.dot(16, 4.5, '#9af0ff');
    r.shade(); r.outline('soft');
    return { r: r.toCanvas(false), l: r.toCanvas(true) };
  };

  /* ======================= Ebirah ======================= */
  function ebirah(f) {
    var r = H.mk(92, 52);
    var C = { b: '#c23c22', d: '#7e1e12', l: '#e8704a', p: '#d84a2a' };
    var ph = f.phase || 0, s = f.stand ? 0 : [-2, 0, 2, 0][ph], i;
    r.layer = 0;
    for (i = 0; i < 4; i++) { r.line(42 + i * 5, 36, 38 + i * 6 - s, 48, C.d, 0.9); }
    r.line(60, 30, 72, 24, C.d, 1.3); r.ell(76, 22, 4, 2.6, C.d);
    for (i = 0; i < 6; i++) { var t = i / 5; r.ell(36 - t * 24, 30 + t * 3, 7 - t * 2.5, 6 - t * 2, C.b); }
    r.poly([[12, 32], [3, 24], [1, 34], [3, 44], [12, 36]], C.p);
    r.layer = 1;
    r.ell(48, 30, 14, 9, C.b); r.ell(50, 35, 11, 3.5, C.l);
    r.ell(63, 28, 6, 6, C.b);
    r.poly([[66, 24], [77, 21], [67, 27]], C.b);
    r.line(66, 24, 90, 4, C.d); r.line(67, 25, 88, 12, C.d);
    r.layer = 2;
    for (i = 0; i < 4; i++) { r.line(44 + i * 5, 37, 42 + i * 6 + s, 49, C.b, 1); }
    r.layer = 3;
    if (f.atk) { r.line(60, 32, 72, 18, C.b, 2.6); r.ell(78, 12, 7.5, 4.6, C.p); r.poly([[72, 16], [86, 18], [74, 20]], C.p); }
    else { r.line(60, 34, 72, 34, C.b, 2.6); r.ell(80, 30, 8.5, 5, C.p); r.poly([[73, 34], [88, 36], [75, 38]], C.p); }
    r.recolor(C.b, C.d, function (x, y) { return x < 60 * MK && x % 6 === 0; });
    r.shade2({ tex: (function () { var o = {}; o[C.b] = 0.25; o[C.p] = 0.2; return o; })(), seed: 31, grad: 0.08 });
    r.dot(65, 24, '#101010'); r.dot(64, 23, '#101010');
    r.outline(OUT);
    return r;
  }
  Sprites.reg('ebirah', function () { return H.mkSet(ebirah, H.A(47), H.A(46), { mouth: { x: H.M(32), y: H.M(-18) } }); });
})();
