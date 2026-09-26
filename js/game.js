'use strict';
/* GODZILLA – KAIJU RAMPAGE 3000 : Hauptspiel */
(function () {
  var W = 480, H = 270;
  var cv = document.getElementById('game'), ctx = cv.getContext('2d');
  var FONT = '"Press Start 2P", monospace';
  var SPR = null;
  var sh = Pix.shade;

  /* ================= Eingabe ================= */
  var keys = {}, pressed = {}, typed = '', seq = [];
  var KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  function keyName(e) { var k = (e.key || '').toLowerCase(); if (k === ' ') k = 'space'; return k; }
  window.addEventListener('keydown', function (e) {
    var k = keyName(e);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'space'].indexOf(k) >= 0) e.preventDefault();
    Sound.init();
    if (!keys[k]) pressed[k] = true;
    keys[k] = true;
    if (e.repeat) return;
    seq.push(k); if (seq.length > 10) seq.shift();
    if (seq.join(',') === KONAMI.join(',')) { seq = []; cheat('KONAMI'); }
    if (k.length === 1) {
      typed = (typed + k.toUpperCase()).slice(-12);
      ['1954', 'MINILLA', 'MOTHRA', 'TANZ', 'GOJIRA'].forEach(function (c) {
        if (typed.slice(-c.length) === c) { typed = ''; cheat(c); }
      });
    }
  });
  window.addEventListener('keyup', function (e) { keys[keyName(e)] = false; });
  window.addEventListener('blur', function () { keys = {}; });
  function hit(k) { return !!pressed[k]; }
  function down(k) { return !!keys[k]; }

  /* ================= Speicher ================= */
  var save = { unlocked: 1, island: false, hi: 0 };
  try { var sv = JSON.parse(localStorage.getItem('gz3000') || 'null'); if (sv) save = sv; } catch (e) { }
  function store() { try { localStorage.setItem('gz3000', JSON.stringify(save)); } catch (e) { } }

  /* ================= Level-Definitionen ================= */
  var LEVELS = [
    {
      id: 'tokyo', name: 'TOKIO', sub: 'HAFENVIERTEL BEI NACHT', boss: ['mecha'], music: 'stage',
      text: ['MECHAGODZILLA WURDE IN DER', 'BUCHT VON TOKIO GESICHTET.', '', 'ES KANN NUR EINEN KÖNIG', 'DER MONSTER GEBEN!']
    },
    {
      id: 'lake', name: 'ASHINO-SEE', sub: 'HAKONE IN DER ABENDDÄMMERUNG', boss: ['biolante'], music: 'stage',
      text: ['AUS GODZILLAS ZELLEN UND EINER', 'ROSE ENTSTAND EIN MONSTER.', '', 'BIOLANTE LAUERT IM SEE...']
    },
    {
      id: 'fuji', name: 'BERG FUJI', sub: 'DÖRFER AM HEILIGEN BERG', boss: ['ghidorah'], music: 'stage',
      text: ['EIN DREIKÖPFIGER DRACHE AUS', 'DEM ALL IST GELANDET.', '', 'KING GHIDORAH WILL DIE', 'ERDE UNTERWERFEN!']
    },
    {
      id: 'island', name: 'MONSTERINSEL', sub: 'GEHEIMLEVEL: BOSS-RUSH', boss: ['mecha', 'biolante', 'ghidorah'], music: 'island', secret: true,
      text: ['DU HAST DIE MONSTERINSEL', 'ENTDECKT!', '', 'BESIEGE ALLE DREI RIVALEN', 'HINTEREINANDER.']
    }
  ];
  var BOSSNAME = { mecha: 'MECHAGODZILLA', biolante: 'BIOLANTE', ghidorah: 'KING GHIDORAH' };

  /* ================= Zustand ================= */
  var G = { state: 'boot', t: 0, menu: 0, lvl: 0, score: 0, levelStartScore: 0, mini: false, film: false, msg: '', msgT: 0, sel: 0 };
  var L = null;
  var stars = [];
  for (var si = 0; si < 70; si++) stars.push([Math.random() * W, Math.random() * H, Math.random()]);

  /* ================= Hilfen ================= */
  function dist(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); }
  function segDist(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy, t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0;
    t = Math.max(0, Math.min(1, t));
    return dist(px, py, ax + dx * t, ay + dy * t);
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function text(s, x, y, col, align, size, shadow) {
    s = s.replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE');
    ctx.font = (size || 8) + 'px ' + FONT;
    ctx.textAlign = align || 'left'; ctx.textBaseline = 'top';
    if (shadow !== false) { ctx.fillStyle = '#000'; ctx.fillText(s, Math.round(x) + 1, Math.round(y) + 1); }
    ctx.fillStyle = col || '#fff'; ctx.fillText(s, Math.round(x), Math.round(y));
  }
  function toast(s, col, dur) { if (L) L.toasts.push({ s: s, c: col || '#ffe04a', t: dur || 3 }); }
  function flashMsg(s) { G.msg = s; G.msgT = 3; }

  /* ================= Cheats / Easter Eggs ================= */
  function cheat(c) {
    if (c === '1954') {
      G.film = !G.film; Sound.sfx('secret');
      cv.className = G.film ? 'film' : '';
      if (L && G.state === 'play') toast(G.film ? 'GOJIRA 1954 - SCHWARZWEISS-MODUS' : 'FARBE IST ZURÜCK', '#fff');
      else flashMsg(G.film ? 'SCHWARZWEISS-MODUS AN' : 'FARBMODUS');
    } else if (c === 'KONAMI') {
      if (G.state === 'title' || G.state === 'select') {
        save.island = true; store(); Sound.sfx('secret'); Sound.sfx('roar');
        flashMsg('MONSTERINSEL FREIGESCHALTET!');
        setTimeout(function () { startLevel(3); }, 1200);
      }
    } else if (c === 'MINILLA') {
      if (G.state === 'title' || G.state === 'select' || G.state === 'intro') {
        G.mini = !G.mini; Sound.sfx('secret');
        flashMsg(G.mini ? 'MINILLA-MODUS AKTIV!' : 'GODZILLA IST ZURÜCK');
      }
    } else if (c === 'MOTHRA') {
      if (G.state === 'play' && !L.mothraUsed) { L.mothraUsed = true; summonMothra(); }
    } else if (c === 'TANZ') {
      if (G.state === 'play' && !L.p.dead) {
        L.p.dance = 3; Sound.play('dance');
        if (!L.danced) { L.danced = true; G.score += 1965; toast('SHEH! DER SIEGESTANZ VON 1965! +1965', '#ff8ad0'); }
      }
    } else if (c === 'GOJIRA') {
      Sound.sfx('roar', 0.8); if (L && G.state === 'play') toast('GOJIRA!!!', '#ff5040');
    }
  }

  /* ================= Level starten ================= */
  function startLevel(i) {
    G.lvl = i; G.levelStartScore = G.score;
    var def = LEVELS[i], gen = World.gen[def.id](), m = gen.map;
    m.b.sort(function (a, b) { return (a.x + a.y) - (b.x + b.y) || a.x - b.x; });
    if (gen.island) {
      var v = { img: SPR.volcano, ax: 60, ay: 56, h: 56 };
      var vb = { x: 15.5, y: 15.5, spr: v, hp: 1e9, max: 1e9, score: 0, r: 1.8, dead: false, burn: 0, kind: 'deco', tall: 56, flash: 0 };
      m.b.push(vb); m.b.sort(function (a, b) { return (a.x + a.y) - (b.x + b.y) || a.x - b.x; });
    }
    var set = G.mini ? SPR.minilla : SPR.godzilla;
    L = {
      def: def, gen: gen, map: m, ground: World.renderGround(m), time: 0, destroyed: 0,
      p: { x: gen.start[0], y: gen.start[1], z: 0, dir: [0.7071, -0.7071], face: 1, r: G.mini ? 0.6 : 0.9, hp: 100, en: 100, anim: 0, atk: 0, atkCd: 0, breathing: false, btick: 0, roarCd: 0, roarT: 0, inv: 0, flash: 0, dead: false, deathT: 0, dance: 0, set: set, moving: false },
      boss: null, queue: def.boss.slice(), bossTimer: def.secret ? 4 : 22, warn: 0, nextBoss: 0,
      units: [], proj: [], fx: [], parts: [], marks: [], toasts: [],
      spawnT: 3, jetT: 8, shake: 0, camX: 0, camY: 0, sx: 0, sy: 0,
      llama: { x: gen.llama[0], y: gen.llama[1], hx: gen.llama[0], hy: gen.llama[1], t: 0, vx: 0, vy: 0, alive: true, face: 1 },
      mothra: null, mothraUsed: false, clearT: 0, hintT: 10, flyHint: false, towerDown: false
    };
    var gp = gpos(L.p.x, L.p.y); L.camX = gp[0]; L.camY = gp[1] - 30;
    G.state = 'intro'; G.t = 0;
    Sound.play('title');
  }

  function gpos(x, y) { return [(x - y) * 16 + L.ground.OX, (x + y) * 8 + L.ground.OY]; }
  function spos(x, y, z) {
    var g = gpos(x, y);
    return [Math.round(g[0] - L.camX + W / 2 + L.sx), Math.round(g[1] - (z || 0) - L.camY + H / 2 + L.sy)];
  }

  /* ================= Schaden & Effekte ================= */
  function particles(x, y, z, n, cols, spd, life, grav, size) {
    for (var i = 0; i < n && L.parts.length < 260; i++) {
      var a = Math.random() * 6.283, s = Math.random() * spd;
      L.parts.push({ x: x, y: y, z: z, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: rnd(0.3, 1) * spd * 14, life: life * rnd(0.6, 1.2), max: life, c: cols[i % cols.length], g: grav, s: size || 2 });
    }
  }
  function smoke(x, y, z, n) {
    for (var i = 0; i < n && L.parts.length < 260; i++)
      L.parts.push({ x: x + rnd(-0.3, 0.3), y: y + rnd(-0.3, 0.3), z: z, vx: rnd(-0.2, 0.2), vy: rnd(-0.2, 0.2), vz: rnd(8, 18), life: rnd(1, 2), max: 2, c: ['#6a6660', '#8a8680', '#4a4640'][i % 3], g: -2, s: 3 });
  }
  function explode(x, y, z, big) {
    particles(x, y, z, big ? 22 : 10, ['#ffe04a', '#ff8a1a', '#ff4a1a', '#ffffff'], big ? 2.4 : 1.4, 0.6, 40, big ? 3 : 2);
    smoke(x, y, z + 4, big ? 6 : 3);
    Sound.sfx('boom', big);
    L.shake = Math.max(L.shake, big ? 0.35 : 0.15);
  }

  function damageBuilding(b, dmg, byPlayer) {
    if (b.dead || b.hp > 1e8) return;
    b.hp -= dmg; b.flash = 0.08;
    if (b.hp <= 0) {
      b.dead = true;
      var big = b.tall > 30;
      explode(b.x, b.y, Math.min(40, b.tall * 0.6), big);
      particles(b.x, b.y, b.tall * 0.4, 8, ['#8a8478', '#5a5448', '#a8a090'], 1.6, 0.9, 60, 2);
      b.spr = Sprites.rubble((Math.floor(b.x * 7 + b.y * 13)) % 4, L.gen.night ? 'n' : 'd');
      b.tall = 6; b.burn = 5;
      if (byPlayer) {
        G.score += b.score; L.destroyed++;
        L.p.en = Math.min(100, L.p.en + 4);
        if (b.nuclear) { L.p.hp = Math.min(100, L.p.hp + 40); L.p.en = 100; toast('RADIOAKTIVE ENERGIE AUFGESAUGT! +40 HP', '#7aff7a'); Sound.sfx('pickup'); }
        if (b.egg === 'tower' && !L.towerDown) { L.towerDown = true; G.score += 3000; toast('SCHON WIEDER DER TOKYO TOWER... +3000', '#ff9a6a'); }
      }
    }
  }
  function buildingsNear(x, y, rad, fn) {
    var m = L.map, x0 = Math.floor(x - rad - 1), x1 = Math.floor(x + rad + 1), y0 = Math.floor(y - rad - 1), y1 = Math.floor(y + rad + 1);
    for (var j = y0; j <= y1; j++) for (var i = x0; i <= x1; i++) {
      var b = m.occ[i + ',' + j];
      if (b && !b.dead && dist(b.x, b.y, x, y) < rad + b.r) fn(b);
    }
  }
  function killUnit(u, silent) {
    if (!u.alive) return;
    u.alive = false; G.score += u.kind === 'jet' ? 250 : 100;
    explode(u.x, u.y, u.z || 2, false);
  }
  function hurtPlayer(dmg, kx, ky) {
    var p = L.p;
    if (p.inv > 0 || p.dead || p.dance > 0) return;
    p.hp -= dmg; p.inv = 0.35; p.flash = 0.15;
    Sound.sfx('hurt'); L.shake = Math.max(L.shake, 0.2);
    if (kx !== undefined) { p.x += kx; p.y += ky; clampPos(p); }
    if (p.hp <= 0) { p.hp = 0; p.dead = true; p.deathT = 0; p.breathing = false; Sound.breath(false); Sound.sfx('roar', 0.6); Sound.stop(); }
  }
  function damageBoss(bs, dmg) {
    if (!bs || bs.dead || bs.enter > 0) return;
    if (bs.shield > 0) { particles(bs.x, bs.y, 30, 2, ['#8af', '#fff'], 1, 0.3, 0, 1); return; }
    bs.hp -= dmg; bs.flash = 0.08;
    if (bs.hp <= 0) { bs.hp = 0; bs.dead = true; bs.deathT = 0; bs.act = null; G.score += 5000; Sound.sfx('roar', 0.7); toast(BOSSNAME[bs.type] + ' BESIEGT! +5000', '#7aff7a'); }
  }
  function clampPos(e) {
    var m = L.map;
    e.x = Math.max(0.5, Math.min(m.W - 0.5, e.x));
    e.y = Math.max(0.5, Math.min(m.H - 0.5, e.y));
  }

  /* ================= Spieler ================= */
  function updatePlayer(dt) {
    var p = L.p;
    p.flash = Math.max(0, p.flash - dt); p.inv = Math.max(0, p.inv - dt);
    p.atkCd -= dt; p.atk -= dt; p.roarCd -= dt; p.roarT -= dt;
    if (p.dead) { p.deathT += dt; p.z = -p.deathT * 12; return; }
    if (p.dance > 0) {
      p.dance -= dt; p.z = Math.abs(Math.sin(p.dance * 9)) * 10;
      p.face = Math.floor(p.dance * 4) % 2 ? 1 : -1;
      if (p.dance <= 0) p.z = 0;
      return;
    }
    var ix = (down('arrowright') || down('d') ? 1 : 0) - (down('arrowleft') || down('a') ? 1 : 0);
    var iy = (down('arrowdown') || down('s') ? 1 : 0) - (down('arrowup') || down('w') ? 1 : 0);
    var wx = ix + iy, wy = iy - ix, l = Math.sqrt(wx * wx + wy * wy);
    p.moving = l > 0;
    var sp = G.mini ? 2.9 : 2.4;
    if (p.breathing) sp *= 0.25;
    if (L.map.isWater(p.x, p.y)) sp *= 0.7;
    var crushing = false;
    buildingsNear(p.x, p.y, p.r * 0.7, function (b) { crushing = true; damageBuilding(b, (G.mini ? 70 : 130) * dt, true); });
    if (crushing) sp *= 0.6;
    if (l > 0) {
      wx /= l; wy /= l; p.dir = [wx, wy];
      p.x += wx * sp * dt; p.y += wy * sp * dt; clampPos(p);
      var ld = p.anim; p.anim += dt * 7;
      if (Math.floor(ld / 2) !== Math.floor(p.anim / 2) && !G.mini) { Sound.sfx('stomp'); L.shake = Math.max(L.shake, 0.06); }
      var sdx = wx - wy; if (Math.abs(sdx) > 0.1) p.face = sdx > 0 ? 1 : -1;
    }
    // Einheiten zertrampeln
    L.units.forEach(function (u) { if (u.alive && u.kind === 'tank' && dist(u.x, u.y, p.x, p.y) < p.r) killUnit(u); });
    // Nahkampf
    if ((hit('j') || hit('space')) && p.atkCd <= 0 && !p.breathing) {
      p.atk = 0.28; p.atkCd = 0.42; Sound.sfx('swing');
      var cx = p.x + p.dir[0] * 1.3, cy = p.y + p.dir[1] * 1.3, rad = G.mini ? 1.1 : 1.6;
      buildingsNear(cx, cy, rad, function (b) { damageBuilding(b, 75, true); });
      L.units.forEach(function (u) { if (u.alive && u.kind === 'tank' && dist(u.x, u.y, cx, cy) < rad + 0.3) killUnit(u); });
      var bs = L.boss;
      if (bs && !bs.dead && bs.z < 10 && dist(bs.x, bs.y, cx, cy) < rad + bs.r * 0.7) {
        damageBoss(bs, G.mini ? 6 : 12); Sound.sfx('hit');
        particles(bs.x, bs.y, 30, 6, ['#fff', '#ffe04a'], 1.2, 0.3, 20, 2);
        if (bs.type !== 'biolante') { bs.x += p.dir[0] * 0.5; bs.y += p.dir[1] * 0.5; clampPos(bs); }
      } else if (bs && !bs.dead && bs.z >= 10 && dist(bs.x, bs.y, cx, cy) < 3 && !L.flyHint) {
        L.flyHint = true; toast('ER FLIEGT! NUTZE DEN ATOMSTRAHL (K)', '#8fe8ff');
      }
    }
    // Atomstrahl / Rauchringe
    var want = down('k') && p.en > (p.breathing ? 0 : 12);
    if (G.mini) {
      p.breathing = false;
      p.btick -= dt;
      if (want && p.btick <= 0 && p.en >= 8) {
        p.btick = 0.35; p.en -= 8; Sound.sfx('shot');
        L.proj.push({ kind: 'ring', x: p.x + p.dir[0] * 0.8, y: p.y + p.dir[1] * 0.8, z: 22, vx: p.dir[0] * 6, vy: p.dir[1] * 6, life: 1.2, from: 'p', dmg: 8 });
      }
    } else {
      if (want) {
        if (!p.breathing) { p.breathing = true; p.btick = 0; Sound.breath(true); }
        p.en = Math.max(0, p.en - 32 * dt);
        var aim = p.dir, bs2 = L.boss;
        if (bs2 && !bs2.dead) {
          var bx = bs2.x - p.x, by = bs2.y - p.y, bd = Math.sqrt(bx * bx + by * by);
          if (bd < 10 && (bx * aim[0] + by * aim[1]) / bd > 0.8) aim = [bx / bd, by / bd];
        }
        p.aim = aim;
        p.btick -= dt;
        if (p.btick <= 0) {
          p.btick = 0.1;
          var ex = p.x + aim[0] * 7.5, ey = p.y + aim[1] * 7.5;
          for (var s = 1; s <= 15; s++) {
            var qx = p.x + aim[0] * s * 0.5, qy = p.y + aim[1] * s * 0.5;
            var b = L.map.occ[Math.floor(qx) + ',' + Math.floor(qy)];
            if (b && !b.dead) damageBuilding(b, 30, true);
          }
          L.units.forEach(function (u) { if (u.alive && segDist(u.x, u.y, p.x, p.y, ex, ey) < 0.8) killUnit(u); });
          if (bs2 && !bs2.dead && segDist(bs2.x, bs2.y, p.x, p.y, ex, ey) < bs2.r + 0.4) {
            damageBoss(bs2, 2.8);
            particles(bs2.x, bs2.y, 25 + bs2.z, 3, ['#8fe8ff', '#fff'], 1.2, 0.3, 10, 2);
          }
          if (L.llama.alive && segDist(L.llama.x, L.llama.y, p.x, p.y, ex, ey) < 0.6) llamaEgg();
          particles(ex, ey, 10, 2, ['#8fe8ff', '#3a8cff', '#fff'], 1.5, 0.4, 20, 2);
        }
      } else if (p.breathing) { p.breathing = false; Sound.breath(false); }
    }
    if (!p.breathing) p.en = Math.min(100, p.en + (G.mini ? 14 : 8) * dt);
    // Brüllen
    if (hit('l') && p.roarCd <= 0) {
      p.roarCd = 8; p.roarT = 1.2; Sound.sfx('roar', G.mini ? 1.6 : 1); L.shake = 0.6;
      var bb = L.boss;
      if (bb && !bb.dead && dist(bb.x, bb.y, p.x, p.y) < 8) { bb.stun = 1.6; bb.act = null; toast('EINGESCHÜCHTERT!', '#fff'); }
      L.units.forEach(function (u) { if (u.alive && u.kind === 'tank' && dist(u.x, u.y, p.x, p.y) < 5) killUnit(u); });
    }
    // Lama
    if (L.llama.alive && dist(L.llama.x, L.llama.y, p.x, p.y) < p.r + 0.3) llamaEgg();
  }

  function llamaEgg() {
    var ll = L.llama; ll.alive = false;
    G.score += 5000; Sound.sfx('secret');
    particles(ll.x, ll.y, 5, 16, ['#ffffff', '#ffe04a', '#ff8ad0'], 1.2, 1, 10, 2);
    toast('RETICULATING SPLINES... LAMA GEFUNDEN! +5000', '#ff8ad0', 4);
  }

  /* ================= Mothra ================= */
  function summonMothra() {
    var p = L.p;
    L.mothra = { x: p.x - 10, y: p.y + 10, z: 70, t: 0, ph: 'in', heal: 0 };
    toast('MOTHRA KOMMT ZU HILFE!', '#ffb84a', 4); Sound.sfx('secret');
  }
  function updateMothra(dt) {
    var mo = L.mothra; if (!mo) return;
    mo.t += dt; var p = L.p;
    if (mo.ph === 'in') {
      var dx = p.x - mo.x, dy = p.y - mo.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d < 0.5) { mo.ph = 'hover'; mo.t = 0; }
      else { mo.x += dx / d * 8 * dt; mo.y += dy / d * 8 * dt; }
      mo.z += (60 - mo.z) * dt;
    } else if (mo.ph === 'hover') {
      mo.x += (p.x - mo.x) * dt * 3; mo.y += (p.y - mo.y) * dt * 3;
      if (mo.heal < 45) { var h = 15 * dt; mo.heal += h; p.hp = Math.min(100, p.hp + h); }
      if (Math.random() < 0.6) L.parts.push({ x: mo.x + rnd(-1, 1), y: mo.y + rnd(-1, 1), z: mo.z, vx: 0, vy: 0, vz: -10, life: 1.2, max: 1.2, c: Math.random() < 0.5 ? '#ffe04a' : '#fff4c0', g: 0, s: 1 });
      if (L.boss && !L.boss.dead && mo.t > 1 && mo.t < 1 + dt * 1.5) { damageBoss(L.boss, 30); toast('MOTHRAS SCHUPPENSTAUB!', '#ffb84a'); }
      if (mo.t > 3.5) { mo.ph = 'out'; }
    } else {
      mo.x += 8 * dt; mo.y -= 8 * dt; mo.z += 20 * dt;
      if (mo.t > 8) L.mothra = null;
    }
  }

  /* ================= Bosse ================= */
  function makeBoss(type) {
    var g = L.gen, bx = g.bossAt[0] + 0.5, by = g.bossAt[1] + 0.5;
    if (L.def.secret) { bx = 15.5; by = 7.5; }
    var b = { type: type, x: bx, y: by, z: 0, face: -1, anim: 0, cd: 2.5, act: null, stun: 0, flash: 0, dead: false, deathT: 0, shield: 0, shieldCd: 10, enter: 2.5, phase: 'air', phaseT: 8, ang: 0 };
    if (type === 'mecha') { b.set = SPR.mecha; b.r = 1.0; b.max = b.hp = 300; b.speed = 1.5; }
    if (type === 'biolante') { b.set = SPR.biolante; b.r = 2.0; b.max = b.hp = 340; b.speed = 0.45; b.z = -60; b.home = g.lake ? [g.lake[0], g.lake[1], g.lake[2]] : [bx, by, 3]; if (L.def.secret) b.home = [15.5, 9.5, 4]; b.x = b.home[0]; b.y = b.home[1]; }
    if (type === 'ghidorah') { b.set = SPR.ghidorah; b.r = 1.5; b.max = b.hp = 380; b.speed = 2.6; b.z = 110; }
    if (type === 'mecha') { b.x = Math.min(L.map.W - 1.5, bx); b.y = Math.min(L.map.H - 1.5, by); }
    return b;
  }

  function updateBoss(dt) {
    var b = L.boss; if (!b) return;
    var p = L.p;
    b.flash = Math.max(0, b.flash - dt);
    if (b.dead) {
      b.deathT += dt;
      if (b.type === 'ghidorah' && b.z > 0) b.z = Math.max(0, b.z - 60 * dt);
      else b.z -= dt * 14;
      if (Math.random() < 0.3) explode(b.x + rnd(-1, 1), b.y + rnd(-1, 1), rnd(10, 40) + Math.max(0, b.z), Math.random() < 0.3);
      if (b.deathT > 3.5) {
        L.boss = null;
        if (L.queue.length) { L.nextBoss = 3; toast('ACHTUNG... DAS NÄCHSTE MONSTER NAHT!', '#ff5040'); }
        else { G.state = 'clear'; G.t = 0; Sound.breath(false); Sound.play('win'); unlockNext(); }
      }
      return;
    }
    if (b.enter > 0) {
      b.enter -= dt;
      if (b.type === 'biolante') b.z = Math.min(0, -60 * (b.enter / 2.5));
      if (b.type === 'ghidorah') b.z = 34 + 76 * (b.enter / 2.5);
      if (b.type === 'mecha') moveToward(b, p.x, p.y, b.speed * dt);
      if (Math.random() < 0.2) L.shake = Math.max(L.shake, 0.1);
      return;
    }
    if (b.shield > 0) b.shield -= dt;
    if (b.stun > 0) { b.stun -= dt; return; }
    var dx = p.x - b.x, dy = p.y - b.y, d = Math.sqrt(dx * dx + dy * dy) || 0.01;
    var sdx = dx - dy; if (Math.abs(sdx) > 0.2) b.face = sdx > 0 ? 1 : -1;
    // Überlappung auflösen
    if (b.z < 10 && d < b.r + p.r) {
      var push = (b.r + p.r - d);
      p.x += dx / d * push * 0.7; p.y += dy / d * push * 0.7; clampPos(p);
      if (b.type !== 'biolante') { b.x -= dx / d * push * 0.3; b.y -= dy / d * push * 0.3; }
    }
    if (b.z < 10) buildingsNear(b.x, b.y, b.r * 0.7, function (bl) { damageBuilding(bl, 150 * dt, false); });
    if (b.type === 'mecha') aiMecha(b, dt, d, dx, dy);
    else if (b.type === 'biolante') aiBiolante(b, dt, d, dx, dy);
    else aiGhidorah(b, dt, d, dx, dy);
    clampPos(b);
  }
  function moveToward(e, tx, ty, s) {
    var dx = tx - e.x, dy = ty - e.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d < 0.01) return;
    s = Math.min(s, d); e.x += dx / d * s; e.y += dy / d * s; e.anim += s * 3;
  }
  function startAct(b, name, dur, data) { b.act = { n: name, t: 0, dur: dur, d: data || {}, fired: 0 }; }

  function aiMecha(b, dt, d, dx, dy) {
    var p = L.p;
    if (b.hp < b.max / 2) {
      b.shieldCd -= dt;
      if (b.shieldCd <= 0) { b.shield = 3.5; b.shieldCd = 12; toast('MECHAGODZILLA: SPIEGELSCHILD AKTIV!', '#8fe8ff'); Sound.sfx('zap'); }
    }
    if (!b.act) {
      if (d > 2.2) moveToward(b, p.x, p.y, b.speed * dt);
      b.cd -= dt;
      if (b.cd <= 0) {
        var r = Math.random();
        if (d < 2.9) startAct(b, 'punch', 0.75);
        else if (d < 11 && r < 0.55) startAct(b, 'eye', 1.25, { tx: p.x + dx / d * 3, ty: p.y + dy / d * 3 });
        else startAct(b, 'missiles', 1.1);
        b.cd = (b.hp < b.max / 2 ? 0.8 : 1.3) + Math.random();
      }
      return;
    }
    var a = b.act; a.t += dt;
    if (a.n === 'punch') {
      if (a.t > 0.35 && !a.fired) { a.fired = 1; Sound.sfx('swing'); if (d < 3) { hurtPlayer(8, dx / d * 0.8, dy / d * 0.8); particles(p.x, p.y, 30, 6, ['#fff', '#ffe04a'], 1, 0.3, 20, 2); } }
    } else if (a.n === 'eye') {
      var ex = b.x + (a.d.tx - b.x) * 1.6, ey = b.y + (a.d.ty - b.y) * 1.6;
      if (a.t > 0.7 && !a.fired) {
        a.fired = 1; Sound.sfx('laser');
        L.fx.push({ k: 'eye', x0: b.x, y0: b.y, x1: ex, y1: ey, life: 0.4, max: 0.4, src: b });
        if (segDist(p.x, p.y, b.x, b.y, ex, ey) < 0.9) hurtPlayer(12);
        for (var s = 1; s < 12; s++) { var bl = L.map.occ[Math.floor(b.x + (ex - b.x) * s / 12) + ',' + Math.floor(b.y + (ey - b.y) * s / 12)]; if (bl) damageBuilding(bl, 60, false); }
      }
    } else if (a.n === 'missiles') {
      while (a.fired < 6 && a.t > a.fired * 0.15) {
        a.fired++; Sound.sfx('shot');
        var ang = Math.atan2(dy, dx) + rnd(-1.2, 1.2);
        L.proj.push({ kind: 'missile', x: b.x, y: b.y, z: 34, vx: Math.cos(ang) * 4, vy: Math.sin(ang) * 4, life: 3, from: 'e', dmg: 3 });
      }
    }
    if (a.t >= a.dur) b.act = null;
  }

  function aiBiolante(b, dt, d, dx, dy) {
    var p = L.p, h = b.home;
    b.anim += dt * 3;
    if (!b.act) {
      moveToward(b, p.x, p.y, b.speed * dt);
      var hd = dist(b.x, b.y, h[0], h[1]);
      if (hd > h[2]) { b.x = h[0] + (b.x - h[0]) / hd * h[2]; b.y = h[1] + (b.y - h[1]) / hd * h[2]; }
      b.cd -= dt;
      if (b.cd <= 0) {
        if (d < 4) startAct(b, 'bite', 0.9);
        else if (Math.random() < 0.55) {
          var ms = [];
          for (var i = 0; i < 3; i++) ms.push([p.x + (i ? rnd(-1.8, 1.8) : 0), p.y + (i ? rnd(-1.8, 1.8) : 0)]);
          ms.forEach(function (m) { L.marks.push({ x: m[0], y: m[1], r: 1.1, t: 0, dur: 0.9, kind: 'vine' }); });
          startAct(b, 'cast', 0.6);
        } else startAct(b, 'sap', 1.0);
        b.cd = 1.3 + Math.random() * (b.hp < b.max / 2 ? 0.6 : 1.2);
      }
      return;
    }
    var a = b.act; a.t += dt;
    if (a.n === 'bite') {
      if (a.t > 0.5 && !a.fired) { a.fired = 1; Sound.sfx('splat'); if (d < 4.4) hurtPlayer(12, dx / d * 1, dy / d * 1); }
    } else if (a.n === 'sap') {
      while (a.fired < 5 && a.t > a.fired * 0.12) {
        a.fired++; Sound.sfx('splat');
        L.proj.push({ kind: 'sap', sx: b.x, sy: b.y, x: b.x, y: b.y, z: 40, tx: p.x + rnd(-1.6, 1.6), ty: p.y + rnd(-1.6, 1.6), t: 0, dur: 1.1, from: 'e', dmg: 6, life: 2 });
      }
    }
    if (a.t >= a.dur) b.act = null;
  }

  function aiGhidorah(b, dt, d, dx, dy) {
    var p = L.p;
    b.anim += dt * 6;
    b.phaseT -= dt;
    if (b.phaseT <= 0 && !b.act) {
      b.phase = b.phase === 'air' ? 'ground' : 'air';
      b.phaseT = b.phase === 'air' ? 8 : 6;
      if (b.phase === 'ground') toast('GHIDORAH LANDET!', '#ffe04a');
    }
    var tz = b.phase === 'air' ? 34 : 0;
    b.z += (tz - b.z) * Math.min(1, dt * 2);
    if (!b.act) {
      if (b.phase === 'air') {
        b.ang += dt * 0.45;
        moveToward(b, p.x + Math.cos(b.ang) * 6, p.y + Math.sin(b.ang) * 6, b.speed * dt);
      } else if (d > 2.4) moveToward(b, p.x, p.y, 1.8 * dt);
      if (d < 10) b.cd -= dt;
      if (b.cd <= 0) {
        if (b.phase === 'ground' && d < 3.2) startAct(b, 'bite', 0.8);
        else if (b.phase === 'air' && Math.random() < 0.25 && d < 8) startAct(b, 'gust', 1.0);
        else {
          var tg = [];
          for (var i = 0; i < 3; i++) tg.push([p.x + (i ? rnd(-1.5, 1.5) : 0), p.y + (i ? rnd(-1.5, 1.5) : 0)]);
          startAct(b, 'gravity', 1.1, { tg: tg });
        }
        b.cd = 1.1 + Math.random() * (b.hp < b.max / 2 ? 0.5 : 1.1);
      }
      return;
    }
    var a = b.act; a.t += dt;
    if (a.n === 'bite') {
      if (a.t > 0.4 && !a.fired) { a.fired = 1; Sound.sfx('swing'); if (d < 3.4) hurtPlayer(10, dx / d, dy / d); }
    } else if (a.n === 'gust') {
      if (a.t < 0.8) { p.x += dx / d * 3 * dt; p.y += dy / d * 3 * dt; clampPos(p); if (Math.random() < 0.5) particles(p.x + rnd(-1, 1), p.y + rnd(-1, 1), 10, 1, ['#dde'], 2, 0.4, 0, 1); }
    } else if (a.n === 'gravity') {
      if (a.t > 0.5 && !a.fired) {
        a.fired = 1; Sound.sfx('zap');
        a.d.tg.forEach(function (t, i) {
          var ex = b.x + (t[0] - b.x) * 1.3, ey = b.y + (t[1] - b.y) * 1.3;
          L.fx.push({ k: 'grav', x0: b.x, y0: b.y, x1: ex, y1: ey, life: 0.55, max: 0.55, src: b, head: i });
          if (segDist(p.x, p.y, b.x, b.y, ex, ey) < 0.8) hurtPlayer(6);
          var bl = L.map.occ[Math.floor(ex) + ',' + Math.floor(ey)]; if (bl) damageBuilding(bl, 80, false);
          explode(ex, ey, 2, false);
        });
      }
    }
    if (a.t >= a.dur) b.act = null;
  }

  /* ================= Militär & Projektile ================= */
  function edgeSpawn() {
    var m = L.map;
    for (var tries = 0; tries < 12; tries++) {
      var side = Math.floor(Math.random() * 4), x, y;
      if (side === 0) { x = 0.5; y = rnd(1, m.H - 1); } else if (side === 1) { x = m.W - 0.5; y = rnd(1, m.H - 1); }
      else if (side === 2) { y = 0.5; x = rnd(1, m.W - 1); } else { y = m.H - 0.5; x = rnd(1, m.W - 1); }
      if (!m.isWater(x, y) && dist(x, y, L.p.x, L.p.y) > 8) return [x, y];
    }
    return null;
  }
  function updateUnits(dt) {
    var p = L.p;
    if (!L.def.secret && !p.dead) {
      L.spawnT -= dt; L.jetT -= dt;
      var tanks = L.units.filter(function (u) { return u.alive && u.kind === 'tank'; }).length;
      var cap = L.boss ? 3 : 6;
      if (L.spawnT <= 0 && tanks < cap) {
        L.spawnT = L.boss ? 6 : 3.5;
        var s = edgeSpawn();
        if (s) L.units.push({ kind: 'tank', x: s[0], y: s[1], z: 0, alive: true, cd: rnd(1, 3), face: 1 });
      }
      if (L.jetT <= 0) {
        L.jetT = L.boss ? 14 : 9;
        var ang = Math.random() * 6.283, cx = p.x, cy = p.y;
        L.units.push({ kind: 'jet', x: cx - Math.cos(ang) * 18, y: cy - Math.sin(ang) * 18, z: 50, vx: Math.cos(ang) * 7, vy: Math.sin(ang) * 7, alive: true, fired: false, life: 6, face: (Math.cos(ang) - Math.sin(ang)) > 0 ? 1 : -1 });
      }
    }
    L.units.forEach(function (u) {
      if (!u.alive) return;
      var dx = p.x - u.x, dy = p.y - u.y, d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      if (u.kind === 'tank') {
        if (d > 5) { u.x += dx / d * 1.2 * dt; u.y += dy / d * 1.2 * dt; }
        var sdx = dx - dy; u.face = sdx > 0 ? 1 : -1;
        u.cd -= dt;
        if (u.cd <= 0 && d < 9 && !p.dead) {
          u.cd = rnd(2, 3.5); Sound.sfx('shot');
          L.proj.push({ kind: 'shell', x: u.x, y: u.y, z: 4, vx: dx / d * 7, vy: dy / d * 7, life: 2, from: 'e', dmg: 1.5 });
          particles(u.x, u.y, 5, 2, ['#ffe04a'], 0.5, 0.2, 0, 1);
        }
      } else {
        u.x += u.vx * dt; u.y += u.vy * dt; u.life -= dt;
        if (!u.fired && d < 6) {
          u.fired = true; Sound.sfx('shot');
          for (var i = 0; i < 2; i++) L.proj.push({ kind: 'missile', x: u.x, y: u.y, z: 45, vx: dx / d * 6 + rnd(-1, 1), vy: dy / d * 6 + rnd(-1, 1), life: 2.5, from: 'e', dmg: 3, fall: true });
        }
        if (u.life <= 0) u.alive = false, u.gone = true;
      }
    });
    L.units = L.units.filter(function (u) { return u.alive; });
  }

  function updateProj(dt) {
    var p = L.p;
    L.proj.forEach(function (q) {
      q.life -= dt;
      if (q.kind === 'sap') {
        q.t += dt; var k = Math.min(1, q.t / q.dur);
        q.x = q.sx + (q.tx - q.sx) * k; q.y = q.sy + (q.ty - q.sy) * k; q.z = 40 * (1 - k) + Math.sin(Math.PI * k) * 40;
        if (k >= 1) {
          q.life = 0; particles(q.x, q.y, 2, 8, ['#ff9a2a', '#ffcc4a'], 1.2, 0.5, 30, 2);
          if (dist(q.x, q.y, p.x, p.y) < 1.1) hurtPlayer(q.dmg);
        }
        return;
      }
      if (q.kind === 'missile') {
        var dx = p.x - q.x, dy = p.y - q.y, d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        q.vx += dx / d * 5 * dt; q.vy += dy / d * 5 * dt;
        var v = Math.sqrt(q.vx * q.vx + q.vy * q.vy), mv = 5.5; if (v > mv) { q.vx *= mv / v; q.vy *= mv / v; }
        if (q.fall) q.z = Math.max(20, q.z - 12 * dt);
        if (Math.random() < 0.4) smoke(q.x, q.y, q.z, 1);
      }
      q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.from === 'e') {
        if (dist(q.x, q.y, p.x, p.y) < p.r * 0.9) { q.life = 0; hurtPlayer(q.dmg); explode(q.x, q.y, q.z, false); }
      } else {
        var bs = L.boss;
        if (bs && !bs.dead && dist(q.x, q.y, bs.x, bs.y) < bs.r + 0.3) { q.life = 0; damageBoss(bs, q.dmg); Sound.sfx('hit'); particles(q.x, q.y, 25, 5, ['#fff'], 1, 0.3, 0, 2); }
        var bl = L.map.occ[Math.floor(q.x) + ',' + Math.floor(q.y)];
        if (bl && !bl.dead) { damageBuilding(bl, 40, true); q.life -= 0.3; }
        L.units.forEach(function (u) { if (u.alive && dist(u.x, u.y, q.x, q.y) < 0.6) killUnit(u); });
      }
      if (q.x < -2 || q.y < -2 || q.x > L.map.W + 2 || q.y > L.map.H + 2) q.life = 0;
    });
    L.proj = L.proj.filter(function (q) { return q.life > 0; });

    L.marks.forEach(function (m) {
      m.t += dt;
      if (m.t >= m.dur && !m.done) {
        m.done = true;
        L.fx.push({ k: 'vine', x0: m.x, y0: m.y, life: 0.6, max: 0.6 });
        Sound.sfx('splat');
        if (dist(m.x, m.y, p.x, p.y) < m.r) hurtPlayer(9);
        var bl = L.map.occ[Math.floor(m.x) + ',' + Math.floor(m.y)]; if (bl) damageBuilding(bl, 60, false);
      }
    });
    L.marks = L.marks.filter(function (m) { return !m.done; });
    L.fx.forEach(function (f) { f.life -= dt; });
    L.fx = L.fx.filter(function (f) { return f.life > 0; });
  }

  function updateParticles(dt) {
    var ps = L.parts;
    for (var i = ps.length - 1; i >= 0; i--) {
      var q = ps[i];
      q.life -= dt;
      if (q.life <= 0 || q.z < -2) { ps.splice(i, 1); continue; }
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.vz -= q.g * dt;
    }
    // brennende Trümmer
    if (Math.random() < 0.5) {
      var bl = L.map.b[Math.floor(Math.random() * L.map.b.length)];
      if (bl && bl.dead && bl.burn > 0) smoke(bl.x, bl.y, 6, 1);
    }
    L.map.b.forEach(function (b) { if (b.burn > 0) b.burn -= dt; if (b.flash > 0) b.flash -= dt; });
  }

  function updateLlama(dt) {
    var l = L.llama; if (!l.alive) return;
    l.t -= dt;
    if (l.t <= 0) { l.t = rnd(1, 3); var a = Math.random() * 6.283, s = Math.random() < 0.3 ? 0 : 0.6; l.vx = Math.cos(a) * s; l.vy = Math.sin(a) * s; }
    l.x += l.vx * dt; l.y += l.vy * dt;
    if (dist(l.x, l.y, l.hx, l.hy) > 2.5) { l.vx = (l.hx - l.x) * 0.4; l.vy = (l.hy - l.y) * 0.4; }
    if (Math.abs(l.vx - l.vy) > 0.05) l.face = l.vx - l.vy > 0 ? 1 : -1;
  }

  function unlockNext() {
    if (G.lvl < 2) save.unlocked = Math.max(save.unlocked, G.lvl + 2);
    if (G.lvl === 2) { save.island = true; save.unlocked = 3; }
    save.hi = Math.max(save.hi, G.score); store();
  }

  /* ================= Update ================= */
  function updatePlay(dt) {
    L.time += dt;
    L.hintT -= dt;
    updatePlayer(dt);
    if (L.p.dead && L.p.deathT > 2.8) { G.state = 'over'; G.t = 0; Sound.play('over'); save.hi = Math.max(save.hi, G.score); store(); return; }
    // Boss-Ankunft
    if (!L.boss && L.queue.length) {
      if (L.nextBoss > 0) { L.nextBoss -= dt; if (L.nextBoss <= 0) spawnBoss(); }
      else if (!L.warn) {
        L.bossTimer -= dt;
        if (L.bossTimer <= 0 || L.destroyed >= 30) { L.warn = 3; Sound.sfx('alarm'); }
      } else {
        L.warn -= dt;
        if (L.warn <= 0) spawnBoss();
      }
    }
    updateBoss(dt);
    updateUnits(dt);
    updateProj(dt);
    updateParticles(dt);
    updateLlama(dt);
    updateMothra(dt);
    L.toasts.forEach(function (t) { t.t -= dt; });
    L.toasts = L.toasts.filter(function (t) { return t.t > 0; });
    // Kamera
    var gp = gpos(L.p.x, L.p.y);
    L.camX += (gp[0] - L.camX) * Math.min(1, dt * 5);
    L.camY += (gp[1] - 30 - L.camY) * Math.min(1, dt * 5);
    var gc = L.ground.cv;
    L.camX = Math.max(W / 2 - 40, Math.min(gc.width - W / 2 + 40, L.camX));
    L.camY = Math.max(H / 2 - 90, Math.min(gc.height - H / 2 + 30, L.camY));
    L.shake = Math.max(0, L.shake - dt);
  }
  function spawnBoss() {
    var t = L.queue.shift();
    L.boss = makeBoss(t); L.warn = 0;
    Sound.play('boss'); Sound.sfx('roar', t === 'mecha' ? 1.3 : t === 'ghidorah' ? 1.5 : 0.8);
    toast(BOSSNAME[t] + ' ERSCHEINT!', '#ff5040', 3);
  }

  /* ================= Zeichnen ================= */
  function drawSprite(set, key, idx, e, x, y) {
    var fr = idx === null ? set[key] : set[key][idx];
    var img = e.face < 0 ? fr.l : fr.r;
    var ax = e.face < 0 ? set.w - set.ax : set.ax;
    var z = e.z || 0, top = y - set.ay - z;
    if (z < 0) {
      var vis = Math.floor(set.ay + z);
      if (vis <= 0) return;
      ctx.drawImage(img, 0, 0, set.w, vis, x - ax, top, set.w, vis);
    } else ctx.drawImage(img, x - ax, top);
    if (e.flash > 0 && ctx.globalAlpha === 1) {
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.8;
      if (z < 0) { var v2 = Math.floor(set.ay + z); if (v2 > 0) ctx.drawImage(img, 0, 0, set.w, v2, x - ax, top, set.w, v2); }
      else ctx.drawImage(img, x - ax, top);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
  }
  function shadow(x, y, rx) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(x, y, rx, rx / 2, 0, 0, 6.283); ctx.fill();
  }

  function drawPlayer(e) {
    var p = L.p, s = spos(p.x, p.y, 0), set = p.set, key = 'stand', idx = null;
    if (p.breathing) key = 'breath';
    else if (p.atk > 0) key = 'attack';
    else if (p.roarT > 0) key = 'roar';
    else if (p.moving) { key = 'walk'; idx = Math.floor(p.anim) % 4; }
    if (p.inv > 0 && Math.floor(p.inv * 30) % 2) return;
    drawSprite(set, key, idx, p, s[0], s[1]);
  }
  function drawBoss(b) {
    var s = spos(b.x, b.y, 0), set = b.set, key = 'walk', idx = Math.floor(b.anim) % 4;
    var a = b.act;
    if (b.type === 'mecha') {
      if (a && a.n === 'punch') { key = 'attack'; idx = null; }
      else if (a && a.n === 'eye') { key = a.t > 0.5 ? 'breath' : 'stand'; idx = null; }
      else if (a) { key = 'roar'; idx = null; }
    } else if (a && (a.n === 'bite' || a.n === 'gravity' || a.n === 'sap' || a.n === 'cast')) { key = 'attack'; idx = null; }
    if (b.stun > 0 && b.type !== 'biolante') { key = 'walk'; idx = 0; }
    drawSprite(set, key, idx, b, s[0], s[1]);
    if (b.shield > 0) {
      ctx.strokeStyle = 'rgba(140,230,255,' + (0.5 + Math.sin(L.time * 20) * 0.3) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(s[0], s[1] - 26, 26, 30, 0, 0, 6.283); ctx.stroke();
    }
    if (b.stun > 0) for (var i = 0; i < 3; i++) {
      var an = L.time * 5 + i * 2.1;
      ctx.fillStyle = '#ffe04a'; ctx.fillRect(s[0] + Math.cos(an) * 12, s[1] - set.ay - b.z + 4 + Math.sin(an) * 3, 2, 2);
    }
  }

  function drawWorld() {
    var m = L.map, pal = m.pal;
    L.sx = L.shake > 0 ? Math.round(rnd(-3, 3) * L.shake * 3) : 0;
    L.sy = L.shake > 0 ? Math.round(rnd(-3, 3) * L.shake * 3) : 0;
    ctx.fillStyle = pal.sky; ctx.fillRect(0, 0, W, H);
    if (L.gen.night) { ctx.fillStyle = '#c8d0ff'; stars.forEach(function (s) { if (s[2] > 0.3 || Math.floor(L.time * 2 + s[2] * 10) % 3) ctx.fillRect(s[0], s[1] * 0.6, 1, 1); }); }
    var ox = Math.round(-L.camX + W / 2 + L.sx), oy = Math.round(-L.camY + H / 2 + L.sy);
    if (L.gen.bgFuji) ctx.drawImage(SPR.fuji, ox + L.ground.OX - 130, oy + L.ground.OY - 100);
    ctx.drawImage(L.ground.cv, ox, oy);
    // Schatten & Markierungen
    var p = L.p, s;
    L.marks.forEach(function (mk) {
      s = spos(mk.x, mk.y, 0);
      ctx.strokeStyle = Math.floor(mk.t * 12) % 2 ? '#ff3030' : '#ffe04a'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(s[0], s[1], 16 * mk.r, 8 * mk.r, 0, 0, 6.283); ctx.stroke();
    });
    if (!p.dead) { s = spos(p.x, p.y, 0); shadow(s[0], s[1], G.mini ? 9 : 15); }
    var b = L.boss;
    if (b && b.z > -5) { s = spos(b.x, b.y, 0); shadow(s[0], s[1], b.r * 13); }
    L.units.forEach(function (u) { if (u.kind === 'jet') { s = spos(u.x, u.y, 0); shadow(s[0], s[1], 5); } });
    if (L.mothra) { s = spos(L.mothra.x, L.mothra.y, 0); shadow(s[0], s[1], 10); }

    // dynamische Objekte
    var dyn = [{ d: p.x + p.y, f: drawPlayer }];
    if (b) dyn.push({ d: b.x + b.y + (b.z > 10 ? 3 : 0), f: drawBoss, e: b });
    L.units.forEach(function (u) { dyn.push({ d: u.x + u.y + (u.kind === 'jet' ? 50 : 0), f: drawUnit, e: u }); });
    if (L.llama.alive) dyn.push({ d: L.llama.x + L.llama.y, f: drawLlama });
    L.proj.forEach(function (q) { dyn.push({ d: q.x + q.y + 0.5, f: drawProj, e: q }); });
    dyn.sort(function (a, c) { return a.d - c.d; });

    var ps = spos(p.x, p.y, 0), pd = p.x + p.y;
    var foc = [[ps[0] - 16, ps[1] - 44 - p.z, 34, 44, pd]];
    if (b && !b.dead) { var bs0 = spos(b.x, b.y, b.z); foc.push([bs0[0] - b.set.ax * 0.8, bs0[1] - b.set.ay, b.set.w * 0.8, b.set.ay, b.x + b.y]); }
    var bl = m.b, di = 0;
    for (var i = 0; i < bl.length; i++) {
      var bb = bl[i], bd = bb.x + bb.y;
      while (di < dyn.length && dyn[di].d <= bd) { dyn[di].f(dyn[di].e); di++; }
      var sp = spos(bb.x, bb.y, 0), sprr = bb.spr;
      if (sp[0] < -50 || sp[0] > W + 50 || sp[1] < -12 || sp[1] - sprr.ay > H + 4) continue;
      var fade = false;
      if (!bb.dead && bb.tall > 10) {
        var rx = sp[0] - sprr.ax, ry = sp[1] - sprr.ay, rw = sprr.img.width, rh = sprr.ay;
        for (var fi = 0; fi < foc.length; fi++) {
          var f = foc[fi];
          if (bd > f[4] && rx < f[0] + f[2] && rx + rw > f[0] && ry < f[1] + f[3] && ry + rh > f[1]) { fade = true; break; }
        }
      }
      if (fade) ctx.globalAlpha = 0.35;
      ctx.drawImage(sprr.img, sp[0] - sprr.ax, sp[1] - sprr.ay);
      if (bb.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6; ctx.drawImage(sprr.img, sp[0] - sprr.ax, sp[1] - sprr.ay); ctx.globalCompositeOperation = 'source-over'; }
      ctx.globalAlpha = 1;
      if (!bb.dead && bb.hp < bb.max * 0.5 && bb.hp < 1e8 && Math.random() < 0.05) particles(bb.x, bb.y, bb.tall * 0.7, 1, ['#ff8a1a', '#ffe04a'], 0.3, 0.5, -10, 2);
    }
    while (di < dyn.length) { dyn[di].f(dyn[di].e); di++; }
    // Röntgen-Silhouette, damit Monster hinter Hochhäusern sichtbar bleiben
    ctx.globalAlpha = 0.3;
    if (!p.dead) drawPlayer();
    if (b && !b.dead) drawBoss(b);
    ctx.globalAlpha = 1;

    drawFx();
    if (L.mothra) { var mo = L.mothra; s = spos(mo.x, mo.y, mo.z + Math.sin(L.time * 4) * 3); var mi = SPR.mothra[Math.floor(L.time * 12) % 4]; ctx.drawImage(mi, s[0] - 23, s[1] - 15); }
    // Partikel
    L.parts.forEach(function (q) {
      var s2 = spos(q.x, q.y, q.z);
      ctx.globalAlpha = Math.min(1, q.life / q.max * 1.5);
      ctx.fillStyle = q.c; ctx.fillRect(s2[0], s2[1], q.s, q.s);
    });
    ctx.globalAlpha = 1;
  }

  function drawUnit(u) {
    var s = spos(u.x, u.y, u.z || 0);
    if (u.kind === 'tank') ctx.drawImage(u.face < 0 ? SPR.tank.l : SPR.tank.r, s[0] - 9, s[1] - 9);
    else ctx.drawImage(u.face < 0 ? SPR.jet.l : SPR.jet.r, s[0] - 11, s[1] - 6);
  }
  function drawLlama() {
    var l = L.llama, s = spos(l.x, l.y, 0);
    ctx.drawImage(l.face < 0 ? SPR.llama.l : SPR.llama.r, s[0] - 7, s[1] - 13);
  }
  function drawProj(q) {
    var s = spos(q.x, q.y, q.z);
    if (q.kind === 'shell') { ctx.fillStyle = '#ffe04a'; ctx.fillRect(s[0] - 1, s[1] - 1, 2, 2); }
    else if (q.kind === 'missile') { ctx.drawImage((q.vx - q.vy) > 0 ? SPR.missile.r : SPR.missile.l, s[0] - 4, s[1] - 2); }
    else if (q.kind === 'sap') { ctx.fillStyle = '#ff9a2a'; ctx.fillRect(s[0] - 2, s[1] - 2, 4, 4); ctx.fillStyle = '#ffe04a'; ctx.fillRect(s[0] - 1, s[1] - 1, 2, 2); var g = spos(q.x, q.y, 0); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(g[0] - 2, g[1] - 1, 4, 2); }
    else if (q.kind === 'ring') { ctx.strokeStyle = '#f4f4f4'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(s[0], s[1], 5, 3, 0, 0, 6.283); ctx.stroke(); }
  }

  function beamLine(pts, cols, widths) {
    for (var k = 0; k < cols.length; k++) {
      ctx.strokeStyle = cols[k]; ctx.lineWidth = widths[k];
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    }
  }
  function drawFx() {
    var p = L.p;
    ctx.lineCap = 'round';
    // Atomstrahl
    if (p.breathing && p.aim) {
      var set = p.set, s0 = spos(p.x, p.y, 0);
      var sx = s0[0] + set.mouth.x * p.face, sy = s0[1] + set.mouth.y - p.z;
      var e = spos(p.x + p.aim[0] * 7.5, p.y + p.aim[1] * 7.5, 16);
      var pts = [[sx, sy]];
      for (var i = 1; i <= 6; i++) { var t = i / 6; pts.push([sx + (e[0] - sx) * t + rnd(-1.5, 1.5), sy + (e[1] - sy) * t + rnd(-1.5, 1.5)]); }
      ctx.globalAlpha = 0.5; beamLine(pts, ['#2a6cff'], [7]); ctx.globalAlpha = 1;
      beamLine(pts, ['#6ad8ff', '#ffffff'], [4, 1.5]);
    }
    L.fx.forEach(function (f) {
      var k = f.life / f.max;
      if (f.k === 'eye') {
        var b = f.src, s = spos(b.x, b.y, 0), set = b.set;
        var ax = s[0] + (set.mouth.x - 2) * b.face, ay = s[1] - set.ay + 9 - b.z;
        var e = spos(f.x1, f.y1, 4);
        ctx.globalAlpha = k;
        beamLine([[ax, ay], e], ['#ff2a6a', '#ffe04a', '#ffffff'], [5, 3, 1]);
        ctx.globalAlpha = 1;
      } else if (f.k === 'grav') {
        var gb = f.src, gs = spos(gb.x, gb.y, 0), mh = gb.set.mouths[f.head];
        var hx = gs[0] + mh.x * gb.face, hy = gs[1] + mh.y - gb.z;
        var ge = spos(f.x1, f.y1, 0), pts2 = [[hx, hy]];
        for (var j = 1; j <= 8; j++) { var tt = j / 8; pts2.push([hx + (ge[0] - hx) * tt + rnd(-5, 5), hy + (ge[1] - hy) * tt + rnd(-5, 5)]); }
        pts2[8] = ge;
        ctx.globalAlpha = Math.min(1, k * 2);
        beamLine(pts2, ['#e0a020', '#fff6a0'], [3, 1]);
        ctx.globalAlpha = 1;
      } else if (f.k === 'vine') {
        var vs = spos(f.x0, f.y0, 0), hgt = Math.sin((1 - k) * Math.PI) * 26;
        for (var v = -2; v <= 2; v++) {
          ctx.strokeStyle = v % 2 ? '#2e6a2a' : '#5aa83a'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(vs[0] + v * 5, vs[1] + Math.abs(v)); ctx.lineTo(vs[0] + v * 3, vs[1] - hgt + Math.abs(v) * 4); ctx.stroke();
        }
      }
    });
    // Augen-Telegraph
    var b2 = L.boss;
    if (b2 && b2.act && !b2.dead) {
      var a = b2.act;
      if (a.n === 'eye' && a.t < 0.7 && Math.floor(a.t * 16) % 2) {
        var s1 = spos(b2.x, b2.y, 0), s2 = spos(b2.x + (a.d.tx - b2.x) * 1.6, b2.y + (a.d.ty - b2.y) * 1.6, 4);
        ctx.strokeStyle = 'rgba(255,60,60,.6)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(s1[0] + (b2.set.mouth.x - 2) * b2.face, s1[1] - b2.set.ay + 9); ctx.lineTo(s2[0], s2[1]); ctx.stroke();
      }
      if (a.n === 'gravity' && a.t < 0.5) {
        var gs2 = spos(b2.x, b2.y, 0);
        b2.set.mouths.forEach(function (mh) { ctx.fillStyle = Math.floor(a.t * 20) % 2 ? '#fff6a0' : '#e0a020'; ctx.fillRect(gs2[0] + mh.x * b2.face - 2, gs2[1] + mh.y - b2.z - 2, 4, 4); });
      }
    }
  }

  function bar(x, y, w, h, v, col, bg) {
    ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = bg || '#3a1a1a'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = col; ctx.fillRect(x, y, Math.max(0, Math.round(w * v)), h);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x, y, Math.max(0, Math.round(w * v)), 1);
  }
  function drawHUD() {
    var p = L.p;
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(4, 4, 124, 30);
    text(G.mini ? 'MINILLA' : 'GODZILLA', 8, 7, '#7aff7a');
    bar(8, 18, 116, 5, p.hp / 100, p.hp < 30 ? '#ff4040' : '#5ad850');
    bar(8, 26, 116, 4, p.en / 100, p.en > 12 ? '#4ac0ff' : '#2a4a6a', '#101a2a');
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(W - 150, 4, 146, 30);
    text('PUNKTE ' + ('0000000' + G.score).slice(-7), W - 8, 7, '#fff', 'right');
    text('ZERSTÖRT ' + L.destroyed, W - 8, 20, '#ffcc6a', 'right');
    if (p.roarCd > 0) text('BRÜLLEN ' + Math.ceil(p.roarCd), 8, 38, '#aaa');
    var b = L.boss;
    if (b) {
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(W / 2 - 110, H - 26, 220, 22);
      text(BOSSNAME[b.type], W / 2, H - 23, '#ff6a5a', 'center');
      bar(W / 2 - 100, H - 12, 200, 5, b.hp / b.max, '#ff4040');
    }
    if (L.warn > 0 && Math.floor(L.warn * 4) % 2) {
      ctx.fillStyle = 'rgba(160,0,0,.7)'; ctx.fillRect(0, H / 2 - 22, W, 34);
      text('!! WARNUNG !!', W / 2, H / 2 - 18, '#fff', 'center', 16);
      text(BOSSNAME[L.queue[0]] + ' NÄHERT SICH', W / 2, H / 2 + 2, '#ffe04a', 'center');
    }
    var ty = 46;
    L.toasts.forEach(function (t) {
      ctx.globalAlpha = Math.min(1, t.t * 2);
      text(t.s, W / 2, ty, t.c, 'center'); ty += 12;
    });
    ctx.globalAlpha = 1;
    if (L.hintT > 0 && !L.boss) {
      ctx.globalAlpha = Math.min(1, L.hintT);
      text('PFEILE/WASD LAUFEN  J SCHLAG  K STRAHL  L BRÜLLEN', W / 2, H - 14, '#ddd', 'center');
      ctx.globalAlpha = 1;
    }
    if (!L.boss && L.queue.length && !L.warn && !L.nextBoss) text('ZERSTÖRE DIE STADT!', 8, 38 + (p.roarCd > 0 ? 10 : 0), '#ffcc6a');
  }

  function filmOverlay() {
    if (!G.film) return;
    ctx.fillStyle = 'rgba(255,255,255,.06)';
    for (var i = 0; i < 40; i++) ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    if (Math.random() < 0.3) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(Math.random() * W, 0, 1, H); }
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(0, 0, W, 3); ctx.fillRect(0, H - 3, W, 3);
  }

  /* ================= Bildschirme ================= */
  var skyline = null;
  function makeSkyline() {
    var c = document.createElement('canvas'); c.width = W; c.height = 90;
    var g = c.getContext('2d'), R = World.rng(3000), x = 0;
    while (x < W) {
      var w = 12 + Math.floor(R() * 26), h = 20 + Math.floor(R() * 60);
      g.fillStyle = '#141a30'; g.fillRect(x, 90 - h, w, h);
      g.fillStyle = '#ffd860';
      for (var yy = 90 - h + 4; yy < 86; yy += 5) for (var xx = x + 2; xx < x + w - 2; xx += 4) if (R() < 0.3) g.fillRect(xx, yy, 2, 2);
      x += w + Math.floor(R() * 3);
    }
    return c;
  }
  function drawTitle() {
    ctx.fillStyle = '#070b1e'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#c8d0ff'; stars.forEach(function (s) { ctx.fillRect(s[0], s[1] * 0.55, 1, 1); });
    ctx.fillStyle = '#e8e0c0'; ctx.beginPath(); ctx.arc(390, 50, 20, 0, 6.283); ctx.fill();
    // Godzilla-Silhouette groß
    var set = G.mini ? SPR.minilla : SPR.godzilla, fr = Math.floor(G.t * 2) % 2 ? set.roar.r : set.stand.r;
    var sc = G.mini ? 4 : 3;
    ctx.drawImage(fr, 300, H - 40 - set.h * sc + 30, set.w * sc, set.h * sc);
    ctx.drawImage(skyline, 0, H - 90);
    ctx.fillStyle = '#0a0e18'; ctx.fillRect(0, H - 8, W, 8);
    // Logo
    var ly = 22 + Math.sin(G.t * 2) * 2;
    ctx.font = '32px ' + FONT; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#000'; ctx.fillText('GODZILLA', 22, ly + 3);
    ctx.fillStyle = '#8a1010'; ctx.fillText('GODZILLA', 21, ly + 1);
    ctx.fillStyle = '#ff4a2a'; ctx.fillText('GODZILLA', 20, ly);
    text('KAIJU RAMPAGE 3000', 22, ly + 40, '#8fe8ff', 'left', 8);
    var items = menuItems();
    items.forEach(function (it, i) {
      var sel = i === G.menu;
      text((sel ? '> ' : '  ') + it.label, 30, 110 + i * 16, sel ? '#ffe04a' : '#bbb');
    });
    if (Math.floor(G.t * 2) % 2) text('ENTER DRÜCKEN', 30, 110 + items.length * 16 + 8, '#fff');
    text('HIGHSCORE ' + save.hi, 30, H - 22, '#888');
    if (G.msgT > 0) text(G.msg, W / 2, 92, '#ff8ad0', 'center');
  }
  function menuItems() {
    var it = [{ label: 'SPIEL STARTEN', a: function () { G.score = 0; startLevel(0); } }];
    if (save.unlocked > 1 || save.island) it.push({ label: 'LEVEL WÄHLEN', a: function () { G.state = 'select'; G.sel = 0; } });
    it.push({ label: 'STEUERUNG', a: function () { G.state = 'help'; } });
    return it;
  }
  function selectable() {
    var l = [];
    for (var i = 0; i < Math.min(3, save.unlocked); i++) l.push(i);
    if (save.island) l.push(3);
    return l;
  }
  function drawSelect() {
    ctx.fillStyle = '#0a0e1e'; ctx.fillRect(0, 0, W, H);
    text('LEVEL WÄHLEN', W / 2, 24, '#ffe04a', 'center', 16);
    selectable().forEach(function (li, i) {
      var sel = i === G.sel, d = LEVELS[li];
      text((sel ? '> ' : '  ') + (li + 1) + '. ' + d.name, 60, 70 + i * 26, sel ? '#fff' : '#999');
      text('    ' + d.sub, 60, 82 + i * 26, sel ? '#8fe8ff' : '#556');
    });
    text('ENTER = START   ESC = ZURÜCK', W / 2, H - 20, '#888', 'center');
    if (G.msgT > 0) text(G.msg, W / 2, H - 40, '#ff8ad0', 'center');
  }
  function drawHelp() {
    ctx.fillStyle = '#0a0e1e'; ctx.fillRect(0, 0, W, H);
    text('STEUERUNG', W / 2, 18, '#ffe04a', 'center', 16);
    var l = [
      ['PFEILE / WASD', 'LAUFEN (DURCH HÄUSER!)'],
      ['J ODER LEERTASTE', 'SCHWANZ- & KLAUENSCHLAG'],
      ['K (HALTEN)', 'ATOMSTRAHL (BLAUE LEISTE)'],
      ['L', 'BRÜLLEN - BETÄUBT GEGNER'],
      ['P / ESC', 'PAUSE'],
      ['M', 'TON AN/AUS']
    ];
    l.forEach(function (r, i) { text(r[0], 40, 52 + i * 18, '#8fe8ff'); text(r[1], 200, 52 + i * 18, '#ddd'); });
    text('TIPPS:', 40, 170, '#ffe04a');
    text('- ZERSTÖRTE GEBÄUDE LADEN DEN STRAHL AUF.', 40, 184, '#bbb');
    text('- ATOMKRAFTWERKE HEILEN GODZILLA!', 40, 196, '#bbb');
    text('- ES GIBT GEHEIMNISSE... VIELE GEHEIMNISSE.', 40, 208, '#bbb');
    text('ESC / ENTER = ZURÜCK', W / 2, H - 20, '#888', 'center');
  }
  function drawIntro() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    var d = LEVELS[G.lvl];
    text(d.secret ? 'GEHEIMLEVEL' : 'LEVEL ' + (G.lvl + 1), 24, 20, '#888');
    text(d.name, 24, 34, '#ff4a2a', 'left', 16);
    text(d.sub, 24, 56, '#8fe8ff');
    d.text.forEach(function (l, i) { text(l, 24, 90 + i * 13, '#ddd'); });
    var bt = d.boss[0], set = SPR[bt], sc = 2;
    var img = Math.floor(G.t * 3) % 2 ? set.attack.l : set.stand.l;
    ctx.drawImage(img, W - 40 - set.w * sc, H - 60 - set.h * sc, set.w * sc, set.h * sc);
    text('GEGNER: ' + d.boss.map(function (b) { return BOSSNAME[b]; }).join(', '), 24, H - 46, '#ff6a5a');
    if (Math.floor(G.t * 2) % 2) text('ENTER = LOS!', 24, H - 26, '#ffe04a');
    if (G.mini) text('MINILLA-MODUS', W - 12, 12, '#7aff7a', 'right');
  }
  function drawClear() {
    drawWorld(); drawHUD();
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(60, 60, W - 120, 150);
    text(G.lvl === 3 ? 'KÖNIG DER MONSTER!' : 'SIEG!', W / 2, 74, '#ffe04a', 'center', 16);
    text(LEVELS[G.lvl].name + ' LIEGT IN TRÜMMERN.', W / 2, 104, '#fff', 'center');
    text('ZERSTÖRTE GEBÄUDE: ' + L.destroyed, W / 2, 124, '#ffcc6a', 'center');
    text('ZEIT: ' + Math.floor(L.time) + ' SEK', W / 2, 138, '#ffcc6a', 'center');
    text('PUNKTE: ' + G.score, W / 2, 152, '#fff', 'center');
    if (G.t > 1.5 && Math.floor(G.t * 2) % 2) text('ENTER = WEITER', W / 2, 186, '#8fe8ff', 'center');
  }
  function drawOver() {
    drawWorld();
    ctx.fillStyle = 'rgba(40,0,0,.65)'; ctx.fillRect(0, 0, W, H);
    text('GAME OVER', W / 2, 90, '#ff4a2a', 'center', 24);
    text('GODZILLA VERSINKT IM MEER...', W / 2, 130, '#ddd', 'center');
    if (G.t > 1.5 && Math.floor(G.t * 2) % 2) text('ENTER = NOCHMAL   ESC = TITEL', W / 2, 170, '#ffe04a', 'center');
  }
  var ENDING = ['GHIDORAH IST BESIEGT.', '', 'GODZILLA STAPFT ZURÜCK INS MEER.', 'DIE MENSCHHEIT BLEIBT VERSCHONT...', '...VORERST.', '', '', 'ENDE?', '', '', 'EIN GERÜCHT BESAGT, DASS AUF DER', 'MONSTERINSEL NOCH MEHR WARTET.', '(JETZT IM LEVEL-MENÜ)', '', '', 'IDEE, CODE, PIXEL & CHIPTUNES:', 'CLAUDE ALS GAME-DEVELOPER', 'FÜR ALPREUSS-SVG', '', 'EINE FAN-HOMMAGE AN DIE', 'SHOWA- & HEISEI-KAIJU-FILME.', '', 'DANKE FÜRS SPIELEN!'];
  function drawEnding() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    var y0 = H - G.t * 18;
    ENDING.forEach(function (l, i) { var y = y0 + i * 16; if (y > -10 && y < H) text(l, W / 2, y, i === 7 ? '#ff4a2a' : '#ddd', 'center'); });
    var set = SPR.godzilla; ctx.drawImage(set.walk[Math.floor(G.t * 4) % 4].l, W - 70 - (G.t * 6) % 60, H - 60);
    if (G.t > 4) text('ENTER', W - 8, H - 12, '#555', 'right');
  }

  /* ================= Hauptschleife ================= */
  function update(dt) {
    G.t += dt; G.msgT -= dt;
    if (hit('m')) { var mu = Sound.toggleMute(); if (L && G.state === 'play') toast(mu ? 'TON AUS' : 'TON AN', '#fff', 1.5); else flashMsg(mu ? 'TON AUS' : 'TON AN'); }
    var enter = hit('enter');
    switch (G.state) {
      case 'title':
        Sound.play('title');
        var items = menuItems();
        if (hit('arrowup') || hit('w')) { G.menu = (G.menu + items.length - 1) % items.length; Sound.sfx('select'); }
        if (hit('arrowdown') || hit('s')) { G.menu = (G.menu + 1) % items.length; Sound.sfx('select'); }
        G.menu = Math.min(G.menu, items.length - 1);
        if (enter || hit('space')) { Sound.sfx('select'); items[G.menu].a(); }
        break;
      case 'select':
        var sl = selectable();
        if (hit('arrowup')) G.sel = (G.sel + sl.length - 1) % sl.length;
        if (hit('arrowdown')) G.sel = (G.sel + 1) % sl.length;
        if (hit('escape')) G.state = 'title';
        if (enter) { G.score = 0; startLevel(sl[G.sel]); }
        break;
      case 'help':
        if (enter || hit('escape')) G.state = 'title';
        break;
      case 'intro':
        if ((enter || hit('space')) && G.t > 0.3) {
          if (G.mini !== (L.p.set === SPR.minilla)) { var sc = G.score; startLevel(G.lvl); G.score = sc; }
          G.state = 'play'; G.t = 0; Sound.play(LEVELS[G.lvl].music); Sound.sfx('roar', G.mini ? 1.6 : 1);
        }
        break;
      case 'play':
        if (hit('p') || hit('escape')) { G.state = 'pause'; Sound.breath(false); L.p.breathing = false; break; }
        updatePlay(dt);
        break;
      case 'pause':
        if (hit('p') || hit('escape') || enter) G.state = 'play';
        if (hit('q')) { G.state = 'title'; L = null; }
        break;
      case 'clear':
        L.toasts.forEach(function (t) { t.t -= dt; });
        updateParticles(dt);
        if (enter && G.t > 1.5) {
          if (G.lvl === 2) { G.state = 'ending'; G.t = 0; Sound.play('title'); }
          else if (G.lvl === 3) { G.state = 'title'; L = null; }
          else startLevel(G.lvl + 1);
        }
        break;
      case 'over':
        if (enter && G.t > 1.5) { G.score = G.levelStartScore; startLevel(G.lvl); }
        if (hit('escape')) { G.state = 'title'; L = null; }
        break;
      case 'ending':
        if ((enter && G.t > 4) || G.t > ENDING.length * 16 / 18 + 18) { G.state = 'title'; L = null; }
        break;
    }
    pressed = {};
  }
  function draw() {
    switch (G.state) {
      case 'boot': ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); text('LADE...', W / 2, H / 2, '#fff', 'center'); break;
      case 'title': drawTitle(); break;
      case 'select': drawSelect(); break;
      case 'help': drawHelp(); break;
      case 'intro': drawIntro(); break;
      case 'play': drawWorld(); drawHUD(); break;
      case 'pause':
        drawWorld(); drawHUD();
        ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, W, H);
        text('PAUSE', W / 2, 100, '#fff', 'center', 16);
        text('P = WEITER   Q = ZUM TITEL', W / 2, 130, '#aaa', 'center');
        break;
      case 'clear': drawClear(); break;
      case 'over': drawOver(); break;
      case 'ending': drawEnding(); break;
    }
    filmOverlay();
  }

  var last = 0, acc = 0;
  function frame(ts) {
    var dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    try { update(dt); draw(); } catch (e) { console.error(e); }
    requestAnimationFrame(frame);
  }

  function resize() {
    var s = Math.min(window.innerWidth / W, (window.innerHeight - 4) / H);
    if (s >= 2) s = Math.floor(s);
    s = Math.max(1, s);
    cv.style.width = Math.floor(W * s) + 'px'; cv.style.height = Math.floor(H * s) + 'px';
  }
  window.addEventListener('resize', resize);

  function boot() {
    resize();
    ctx.imageSmoothingEnabled = false;
    SPR = Sprites.init();
    skyline = makeSkyline();
    G.state = 'title'; G.t = 0;
    window.__GZ = {
      G: G, get L() { return L; }, SPR: SPR, startLevel: startLevel,
      step: function (n, hold) { for (var i = 0; i < n; i++) { if (hold) hold.forEach(function (k) { keys[k] = true; }); update(1 / 30); } if (hold) hold.forEach(function (k) { keys[k] = false; }); draw(); },
      press: function (k) { pressed[k] = true; }
    };
  }
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  requestAnimationFrame(frame);
  var fontReady = document.fonts && document.fonts.load ? document.fonts.load('8px "Press Start 2P"') : Promise.resolve();
  var done = false;
  function go() { if (!done) { done = true; boot(); } }
  fontReady.then(go, go);
  setTimeout(go, 2500);
})();
