'use strict';
/* Winziger Pixel-Rasterizer: alle Sprites werden beim Start prozedural erzeugt
   (keine Bilddateien, keine fremden Assets). */
var Pix = (function () {
  var shadeCache = {}, rgbCache = {};

  function clamp(v) { return v < 0 ? 0 : v > 255 ? 255 : v | 0; }
  function hex(r, g, b) { return '#' + ((1 << 24) | (clamp(r) << 16) | (clamp(g) << 8) | clamp(b)).toString(16).slice(1); }
  function rgb(h) {
    var c = rgbCache[h];
    if (c) return c;
    var n = parseInt(h.slice(1), 16);
    c = rgbCache[h] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    return c;
  }
  function shade(h, f) {
    var key = h + f;
    if (shadeCache[key]) return shadeCache[key];
    var c = rgb(h), o;
    if (f >= 0) o = hex(c[0] + (255 - c[0]) * f, c[1] + (255 - c[1]) * f, c[2] + (255 - c[2]) * f);
    else o = hex(c[0] * (1 + f), c[1] * (1 + f), c[2] * (1 + f));
    shadeCache[key] = o;
    return o;
  }
  function mix(a, b, t) {
    var x = rgb(a), y = rgb(b);
    return hex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t);
  }
  function hash(x, y, s) {
    var h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h = h ^ (h >>> 16);
    return (h >>> 0) / 4294967296;
  }

  function Raster(w, h) {
    this.w = Math.ceil(w); this.h = Math.ceil(h);
    this.d = new Array(this.w * this.h);
    this.ly = new Int8Array(this.w * this.h);
    this.layer = 0;
    this.k = 1; this.ox = 0; this.oy = 0;
  }
  var P = Raster.prototype;
  P.set = function (x, y, c) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    var i = y * this.w + x;
    this.d[i] = c; this.ly[i] = this.layer;
  };
  /* Volumen-Schattierung: Licht von links oben, Kernschatten rechts unten,
     innere Konturen zwischen Körperteilen und Hautstruktur. */
  P.shade2 = function (o) {
    o = o || {};
    var w = this.w, h = this.h, d = this.d, L = this.ly, out = d.slice();
    function E(x, y) { return x < 0 || y < 0 || x >= w || y >= h || !d[y * w + x]; }
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var i = y * w + x, c = d[i];
      if (!c || (o.skip && o.skip[c])) continue;
      var f = 0;
      if (E(x, y - 1) || E(x - 1, y - 1)) f += 0.3;
      else if (E(x, y - 2) || E(x - 2, y - 2) || E(x - 2, y)) f += 0.13;
      if (E(x, y + 1) || E(x + 1, y + 1)) f -= 0.36;
      else if (E(x, y + 2) || E(x + 2, y + 2) || E(x + 2, y)) f -= 0.2;
      else if (E(x + 3, y + 3) || E(x, y + 4)) f -= 0.09;
      var l = L[i];
      if ((x < w - 1 && d[i + 1] && L[i + 1] > l) || (y < h - 1 && d[i + w] && L[i + w] > l) ||
        (x > 0 && d[i - 1] && L[i - 1] > l) || (y > 0 && d[i - w] && L[i - w] > l)) f -= 0.42;
      if (o.tex && o.tex[c]) {
        var n = hash(x, y, o.seed || 7);
        if (n < o.tex[c]) f -= 0.13; else if (n > 1 - o.tex[c] * 0.5) f += 0.09;
      }
      if (f) out[i] = shade(c, Math.max(-0.62, Math.min(0.42, f)));
    }
    this.d = out;
  };
  P.get = function (x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return undefined;
    return this.d[y * this.w + x];
  };
  P.tx = function (x) { return x * this.k + this.ox; };
  P.ty = function (y) { return y * this.k + this.oy; };
  P.dot = function (x, y, c) { this.set(this.tx(x), this.ty(y), c); };
  P.ell = function (cx, cy, rx, ry, c) {
    cx = this.tx(cx); cy = this.ty(cy);
    rx = Math.max(0.55, rx * this.k); ry = Math.max(0.55, ry * this.k);
    var x0 = Math.floor(cx - rx), x1 = Math.ceil(cx + rx), y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry);
    for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
      var dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) this.set(x, y, c);
    }
  };
  P.poly = function (pts, c) {
    var q = [], i, x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (i = 0; i < pts.length; i++) {
      var px = this.tx(pts[i][0]), py = this.ty(pts[i][1]);
      q.push([px, py]);
      if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py;
    }
    for (var y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      for (var x = Math.floor(x0); x <= Math.ceil(x1); x++) {
        var tx = x + 0.5, ty = y + 0.5, inside = false;
        for (var a = 0, b = q.length - 1; a < q.length; b = a++) {
          if (((q[a][1] > ty) !== (q[b][1] > ty)) &&
            (tx < (q[b][0] - q[a][0]) * (ty - q[a][1]) / (q[b][1] - q[a][1]) + q[a][0])) inside = !inside;
        }
        if (inside) this.set(x, y, c);
      }
    }
  };
  P.rect = function (x, y, w, h, c) { this.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], c); };
  P.line = function (x0, y0, x1, y1, c, r) {
    var n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * this.k * 2) + 1;
    for (var i = 0; i <= n; i++) {
      var t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      if (r) this.ell(x, y, r, r, c); else this.dot(x, y, c);
    }
  };
  // quadratische Bezier-Kette aus Kreisen (Hälse, Schwänze, Ranken)
  P.curve = function (x0, y0, cx, cy, x1, y1, r0, r1, c) {
    var n = Math.ceil((Math.abs(x1 - x0) + Math.abs(y1 - y0)) * this.k) + 3;
    for (var i = 0; i <= n; i++) {
      var t = i / n, u = 1 - t;
      var x = u * u * x0 + 2 * u * t * cx + t * t * x1;
      var y = u * u * y0 + 2 * u * t * cy + t * t * y1;
      var r = r0 + (r1 - r0) * t;
      this.ell(x, y, r, r, c);
    }
  };
  P.shade = function (skip) {
    var w = this.w, h = this.h, d = this.d, o = d.slice();
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var i = y * w + x, c = d[i];
      if (!c || (skip && skip[c])) continue;
      var up = y > 0 ? d[i - w] : null, dn = y < h - 1 ? d[i + w] : null, lf = x > 0 ? d[i - 1] : null;
      if (!up) o[i] = shade(c, 0.3);
      else if (!dn) o[i] = shade(c, -0.32);
      else if (!lf) o[i] = shade(c, 0.14);
      else if (up !== c && dn === c && x > 0 && y > 1 && d[i - 2 * w] && !d[i - 2 * w - 1]) o[i] = shade(c, 0.1);
    }
    this.d = o;
  };
  P.outline = function (c) {
    var w = this.w, h = this.h, d = this.d, o = d.slice();
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var i = y * w + x;
      if (d[i]) continue;
      if ((x > 0 && d[i - 1]) || (x < w - 1 && d[i + 1]) || (y > 0 && d[i - w]) || (y < h - 1 && d[i + w])) o[i] = c;
    }
    this.d = o;
  };
  P.recolor = function (from, to, cond) {
    for (var y = 0; y < this.h; y++) for (var x = 0; x < this.w; x++) {
      var i = y * this.w + x;
      if (this.d[i] === from && (!cond || cond(x, y))) this.d[i] = to;
    }
  };
  P.toCanvas = function (flip) {
    var w = this.w, h = this.h;
    var cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    var g = cv.getContext('2d'), im = g.createImageData(w, h), a = im.data;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var c = this.d[y * w + x];
      if (!c) continue;
      var sx = flip ? w - 1 - x : x, p = (y * w + sx) * 4, col = rgb(c);
      a[p] = col[0]; a[p + 1] = col[1]; a[p + 2] = col[2]; a[p + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    return cv;
  };

  return { Raster: Raster, shade: shade, rgb: rgb, hex: hex, hash: hash, mix: mix };
})();
