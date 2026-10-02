'use strict';
/* GODZILLA – KAIJU RAMPAGE 3000 : Hauptspiel */
(function () {
  var W = 480, H = 270;
  var cv = document.getElementById('game'), ctx = cv.getContext('2d');
  var FONT = '"Press Start 2P", monospace';
  var SPR = null;
  var T = World.T;

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
  try { var sv = JSON.parse(localStorage.getItem('gz3000b') || 'null'); if (sv) save = sv; } catch (e) { }
  if (!save.opt) save.opt = { mus: 7, sfx: 8, q: 1, diff: 1 };
  function store() { try { localStorage.setItem('gz3000b', JSON.stringify(save)); } catch (e) { } }
  var DIFF = [{ n: 'LEICHT', dmg: 0.6, hp: 0.8 }, { n: 'NORMAL', dmg: 1, hp: 1 }, { n: 'SCHWER', dmg: 1.35, hp: 1.25 }];
  function Q() { return save.opt.q === 1; }
  function PCAP() { return Q() ? 300 : 110; }

  /* ================= Monster-Daten ================= */
  var MON = {
    kamacuras: {
      name: 'KAMACURAS', hp: 110, r: 0.9, speed: 2.3, pref: 2, cd: [0.8, 1.5], roar: ['rodan', 1.5], atk: [
        { t: 'melee', max: 2.8, w: 0.4, dur: 0.75, dmg: 6, kb: 0.6 },
        { t: 'charge', min: 3, max: 9, w: 0.6, dur: 1.1, spd: 8, dmg: 7 }]
    },
    anguirus: {
      name: 'ANGUIRUS', hp: 170, r: 1.3, speed: 1.9, pref: 2.4, cd: [1, 1.8], roar: ['godzilla', 0.8], atk: [
        { t: 'melee', max: 3.2, w: 0.45, dur: 0.8, dmg: 8, kb: 1 },
        { t: 'charge', min: 3, max: 11, w: 0.65, dur: 1.2, spd: 9, dmg: 10 }]
    },
    kumonga: {
      name: 'KUMONGA', hp: 160, r: 1.5, speed: 1.3, pref: 5, cd: [1, 1.8], roar: ['deep', 1.6], atk: [
        { t: 'melee', max: 3.4, w: 0.45, dur: 0.8, dmg: 8, kb: 0.6 },
        { t: 'volley', min: 2.5, max: 11, w: 0.5, dur: 1.0, n: 1, proj: 'web', dmg: 2, spd: 6 },
        { t: 'volley', min: 3, max: 11, w: 0.45, dur: 1.0, n: 3, proj: 'needle', dmg: 4, spd: 9 }]
    },
    rodan: {
      name: 'RODAN', hp: 160, r: 1.3, speed: 3, pref: 5, fly: 28, cd: [1.1, 1.9], roar: ['rodan', 1], atk: [
        { t: 'charge', min: 2, max: 12, w: 0.7, dur: 1.2, spd: 10, dmg: 9, swoop: true },
        { t: 'gust', min: 0, max: 8, w: 0.3, dur: 1.0 }]
    },
    gigan: {
      name: 'GIGAN', hp: 300, r: 1.2, speed: 1.9, pref: 2.4, cd: [1, 1.8], roar: ['mecha', 1.25], atk: [
        { t: 'melee', max: 3.2, w: 0.45, dur: 0.8, dmg: 10, kb: 1 },
        { t: 'charge', min: 3, max: 10, w: 0.65, dur: 1.1, spd: 8, dmg: 11 },
        { t: 'beam', min: 3, max: 11, w: 0.85, dur: 1.3, dmg: 10, beam: 'red' }]
    },
    mecha: {
      name: 'MECHAGODZILLA', hp: 320, r: 1.2, speed: 1.6, pref: 2.4, cd: [1.1, 2.1], roar: ['mecha', 1], shield: true, atk: [
        { t: 'melee', max: 3.2, w: 0.45, dur: 0.8, dmg: 9, kb: 1 },
        { t: 'beam', min: 3, max: 12, w: 0.85, dur: 1.3, dmg: 12, beam: 'eye' },
        { t: 'volley', min: 4, max: 14, w: 0.35, dur: 1.3, n: 6, proj: 'missile', dmg: 3, spd: 4 }]
    },
    biolante: {
      name: 'BIOLANTE', hp: 380, r: 2.6, speed: 0.45, pref: 0, home: true, emerge: true, cd: [1.2, 2.2], roar: ['deep', 0.8], atk: [
        { t: 'melee', max: 4.6, w: 0.55, dur: 0.9, dmg: 12, kb: 1.2 },
        { t: 'marks', min: 0, max: 14, w: 0.6, dur: 0.8, n: 3, mark: 'vine', dmg: 9 },
        { t: 'lob', min: 3, max: 13, w: 0.35, dur: 1.0, n: 5, proj: 'sap', dmg: 6 }]
    },
    hedorah: {
      name: 'HEDORAH', hp: 340, r: 1.7, speed: 0.9, pref: 4, emerge: true, cd: [1.1, 2], roar: ['deep', 0.6], atk: [
        { t: 'melee', max: 3.6, w: 0.55, dur: 0.9, dmg: 10, kb: 1 },
        { t: 'lob', min: 3, max: 12, w: 0.35, dur: 1.0, n: 4, proj: 'sludge', dmg: 6 },
        { t: 'beam', min: 3, max: 11, w: 0.85, dur: 1.3, dmg: 10, beam: 'acid' },
        { t: 'marks', min: 0, max: 12, w: 0.5, dur: 0.8, n: 3, mark: 'smog', dmg: 4 }]
    },
    ghidorah: {
      name: 'KING GHIDORAH', hp: 400, r: 1.6, speed: 2.6, pref: 6, phases: true, cd: [1.1, 2.1], roar: ['ghidorah', 1], atk: [
        { t: 'melee', max: 3.4, w: 0.45, dur: 0.8, dmg: 10, kb: 1, ground: true },
        { t: 'beam', min: 0, max: 11, w: 0.6, dur: 1.1, dmg: 6, beam: 'grav', heads: 3 },
        { t: 'gust', min: 0, max: 8, w: 0.3, dur: 1.0, air: true }]
    },
    destoroyah: {
      name: 'DESTOROYAH', hp: 480, r: 1.6, speed: 2.0, pref: 3, phases: true, cd: [1, 1.8], roar: ['godzilla', 0.7], atk: [
        { t: 'melee', max: 3.4, w: 0.5, dur: 0.85, dmg: 12, kb: 1.2, ground: true },
        { t: 'beam', min: 3, max: 12, w: 0.85, dur: 1.3, dmg: 13, beam: 'oxy' },
        { t: 'charge', min: 3, max: 10, w: 0.65, dur: 1.1, spd: 9, dmg: 11, ground: true },
        { t: 'marks', min: 0, max: 12, w: 0.5, dur: 0.8, n: 4, mark: 'oxy', dmg: 8 }]
    },
    mothraLarva: {
      name: 'MOTHRA (LARVE)', hp: 150, r: 1.3, speed: 1.3, pref: 3, cd: [1, 1.8], roar: ['rodan', 1.8], next: 'mothraCocoon', atk: [
        { t: 'melee', max: 3, w: 0.45, dur: 0.8, dmg: 7, kb: 0.8 },
        { t: 'volley', min: 2.5, max: 10, w: 0.5, dur: 1.1, n: 4, proj: 'silk', dmg: 2, spd: 6 }]
    },
    mothraCocoon: { name: 'MOTHRA (KOKON)', hp: 100, r: 1.3, speed: 0, pref: 0, cocoon: 5, next: 'mothraImago', cd: [99, 99], roar: ['rodan', 1.5], atk: [] },
    mothraImago: {
      name: 'MOTHRA', hp: 330, r: 1.7, speed: 2.6, pref: 5, fly: 30, cd: [1.1, 2], roar: ['rodan', 1.4], atk: [
        { t: 'beam', min: 0, max: 11, w: 0.75, dur: 1.2, dmg: 8, beam: 'prism', heads: 2 },
        { t: 'marks', min: 0, max: 12, w: 0.5, dur: 0.9, n: 4, mark: 'powder', dmg: 6 },
        { t: 'gust', min: 0, max: 8, w: 0.3, dur: 1.0 }]
    },
    battraLarva: {
      name: 'BATTRA (LARVE)', hp: 170, r: 1.4, speed: 1.6, pref: 3, cd: [1, 1.8], roar: ['deep', 1.3], next: 'battra', atk: [
        { t: 'charge', min: 2.5, max: 10, w: 0.6, dur: 1.1, spd: 8, dmg: 10 },
        { t: 'beam', min: 3, max: 11, w: 0.8, dur: 1.2, dmg: 9, beam: 'prism' }]
    },
    battra: {
      name: 'BATTRA', hp: 300, r: 1.7, speed: 2.8, pref: 5, fly: 30, cd: [1, 1.9], roar: ['rodan', 0.9], atk: [
        { t: 'beam', min: 0, max: 12, w: 0.75, dur: 1.2, dmg: 10, beam: 'prism', heads: 2 },
        { t: 'charge', min: 2, max: 12, w: 0.7, dur: 1.2, spd: 10, dmg: 10, swoop: true },
        { t: 'gust', min: 0, max: 8, w: 0.3, dur: 1.0 }]
    },
    ebirah: {
      name: 'EBIRAH', hp: 190, r: 1.4, speed: 1.7, pref: 2.4, cd: [0.9, 1.7], roar: ['deep', 1.2], atk: [
        { t: 'melee', max: 3.4, w: 0.5, dur: 0.85, dmg: 11, kb: 1.4 },
        { t: 'charge', min: 3, max: 9, w: 0.6, dur: 1.0, spd: 8, dmg: 9 },
        { t: 'lob', min: 3, max: 11, w: 0.35, dur: 1.0, n: 4, proj: 'water', dmg: 5 }]
    },
    megalon: {
      name: 'MEGALON', hp: 300, r: 1.3, speed: 1.9, pref: 2.6, cd: [1, 1.8], roar: ['mecha', 0.8], atk: [
        { t: 'melee', max: 3.3, w: 0.45, dur: 0.8, dmg: 10, kb: 1 },
        { t: 'beam', min: 3, max: 11, w: 0.8, dur: 1.2, dmg: 10, beam: 'elec' },
        { t: 'lob', min: 3, max: 12, w: 0.35, dur: 1.1, n: 5, proj: 'napalm', dmg: 6 },
        { t: 'charge', min: 3, max: 10, w: 0.6, dur: 1.1, spd: 9, dmg: 11 }]
    },
    moguera: {
      name: 'MOGUERA', hp: 240, r: 1.3, speed: 1.7, pref: 3, cd: [1, 1.8], roar: ['mecha', 1.1], atk: [
        { t: 'beam', min: 3, max: 12, w: 0.8, dur: 1.2, dmg: 9, beam: 'eye' },
        { t: 'volley', min: 4, max: 13, w: 0.35, dur: 1.2, n: 5, proj: 'missile', dmg: 3, spd: 4 },
        { t: 'charge', min: 3, max: 10, w: 0.6, dur: 1.1, spd: 9, dmg: 10 }]
    },
    titanosaurus: {
      name: 'TITANOSAURUS', hp: 240, r: 1.4, speed: 1.8, pref: 2.5, cd: [1, 1.8], roar: ['godzilla', 1.15], atk: [
        { t: 'melee', max: 3.4, w: 0.45, dur: 0.8, dmg: 10, kb: 1.3 },
        { t: 'gust', min: 0, max: 9, w: 0.4, dur: 1.2 },
        { t: 'charge', min: 3, max: 10, w: 0.6, dur: 1.1, spd: 8, dmg: 10 }]
    },
    spacegodzilla: {
      name: 'SPACEGODZILLA', hp: 540, r: 1.5, speed: 1.5, pref: 4, cd: [1, 1.8], roar: ['godzilla', 0.75], crystals: true, atk: [
        { t: 'melee', max: 3.4, w: 0.5, dur: 0.85, dmg: 12, kb: 1.2 },
        { t: 'beam', min: 3, max: 13, w: 0.9, dur: 1.4, dmg: 14, beam: 'corona' },
        { t: 'marks', min: 0, max: 13, w: 0.5, dur: 0.9, n: 4, mark: 'crystal', dmg: 9 }]
    },
    mkg: {
      name: 'MECHA-KING GHIDORAH', hp: 520, r: 1.7, speed: 2.4, pref: 6, phases: true, cd: [1, 1.9], roar: ['mecha', 0.7], atk: [
        { t: 'melee', max: 3.5, w: 0.45, dur: 0.8, dmg: 12, kb: 1.2, ground: true },
        { t: 'beam', min: 0, max: 12, w: 0.65, dur: 1.2, dmg: 7, beam: 'grav', heads: 2 },
        { t: 'beam', min: 3, max: 12, w: 0.85, dur: 1.2, dmg: 12, beam: 'laser' },
        { t: 'volley', min: 4, max: 14, w: 0.35, dur: 1.2, n: 6, proj: 'missile', dmg: 3, spd: 4 }]
    }
  };

  /* ================= Level ================= */
  var LEVELS = [
    { id: 'tokyo', name: 'TOKIO', sub: 'HAFENVIERTEL BEI NACHT', enc: [['kamacuras'], ['kamacuras', 'kamacuras'], ['mecha']], music: 'stage',
      text: ['MECHAGODZILLA WURDE IN DER', 'BUCHT VON TOKIO GESICHTET.', 'VORHER SCHWÄRMEN RIESIGE', 'GOTTESANBETERINNEN AUS...'] },
    { id: 'osaka', name: 'OSAKA', sub: 'MIT ANGUIRUS AN DEINER SEITE', enc: [['kamacuras', 'kamacuras'], ['gigan']], music: 'stage', ally: 'anguirus',
      text: ['DEIN ALTER FREUND ANGUIRUS', 'KÄMPFT MIT DIR GEGEN DEN', 'CYBORG GIGAN AUS DEM ALL.', 'VERBÜNDETE TRIFFST DU NIE!'] },
    { id: 'lake', name: 'ASHINO-SEE', sub: 'HAKONE IN DER ABENDDÄMMERUNG', enc: [['kumonga'], ['biolante']], music: 'stage',
      text: ['EINE RIESENSPINNE BEWACHT', 'DAS UFER. IM SEE LAUERT', 'BIOLANTE - GEBOREN AUS', 'GODZILLAS ZELLEN.'] },
    { id: 'atoll', name: 'LETCHI-ATOLL', sub: 'SÜDSEE, 1966', enc: [['ebirah'], ['ebirah', 'kamacuras'], ['megalon']], music: 'island',
      text: ['IM ATOLL LAUERT EBIRAH,', 'DER RIESENHUMMER.', 'AUS DEM UNTERWASSERREICH', 'SEATOPIA STEIGT MEGALON!'] },
    { id: 'yokohama', name: 'YOKOHAMA', sub: 'INDUSTRIEHAFEN IM SMOG', enc: [['kamacuras', 'kumonga'], ['hedorah']], music: 'stage',
      text: ['DER SMOG DER FABRIKEN HAT', 'EIN MONSTER GEBOREN:', 'HEDORAH, DAS SMOGMONSTER.', 'VORSICHT VOR GIFTWOLKEN!'] },
    { id: 'nagoya', name: 'NAGOYA', sub: 'MIT MOTHRA AN DEINER SEITE', enc: [['kumonga'], ['battraLarva']], music: 'stage', ally: 'mothraImago',
      text: ['MOTHRA, DIE SCHUTZGÖTTIN,', 'FLIEGT AN DEINER SEITE.', 'IHR SCHWARZER RIVALE BATTRA', 'WIRD SICH VERWANDELN!'] },
    { id: 'fuji', name: 'BERG FUJI', sub: 'DÖRFER AM HEILIGEN BERG', enc: [['rodan'], ['rodan', 'kamacuras'], ['ghidorah']], music: 'stage',
      text: ['RODAN KREIST ÜBER DEM FUJI.', 'DANACH LANDET DER', 'DREIKÖPFIGE DRACHE', 'KING GHIDORAH!'] },
    { id: 'fukuoka', name: 'FUKUOKA', sub: 'DIE KRISTALLSTADT', enc: [['moguera'], ['spacegodzilla']], music: 'stage',
      text: ['SPACEGODZILLA KOMMT AUS', 'DEM ALL. SEINE KRISTALL-', 'TÜRME GEBEN IHM ENERGIE -', 'ZERSTÖRE SIE ZUERST!'] },
    { id: 'sapporo', name: 'SAPPORO', sub: 'SCHNEEFESTIVAL IN GEFAHR', enc: [['titanosaurus'], ['battra', 'rodan'], ['mkg']], music: 'stage',
      text: ['AUS DEM JAHR 2204 KEHRT', 'GHIDORAH ZURÜCK - ALS', 'CYBORG: MECHA-KING', 'GHIDORAH!'] },
    { id: 'shinjuku', name: 'SHINJUKU', sub: 'DAS FINALE', enc: [['gigan', 'megalon'], ['destoroyah']], music: 'stage',
      text: ['DESTOROYAH, DER ZERSTÖRER,', 'IST AUS DEM MEERESGRUND', 'ERWACHT. DER LETZTE KAMPF', 'UM TOKIO BEGINNT!'] },
    { id: 'island', name: 'MONSTERINSEL', sub: 'GEHEIMLEVEL: BOSS-RUSH', enc: [['mecha'], ['biolante'], ['spacegodzilla'], ['mkg'], ['destoroyah']], music: 'island', secret: true,
      text: ['DU HAST DIE MONSTERINSEL', 'ENTDECKT! BESIEGE ALLE', 'FÜNF RIVALEN', 'HINTEREINANDER.'] }
  ];
  var LAST = 9, ISLAND = 10;
  // Gegner, in die sich ein Monster verwandeln kann (für das Vorladen der Sprites)
  function chainOf(t) { var o = [t]; while (MON[t].next) { t = MON[t].next; o.push(t); } return o; }

  /* ================= Zustand ================= */
  var G = { state: 'boot', t: 0, menu: 0, lvl: 0, score: 0, levelStartScore: 0, mini: false, film: false, msg: '', msgT: 0, sel: 0, hitstop: 0 };
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
    s = String(s).replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE');
    ctx.font = (size || 8) + 'px ' + FONT;
    ctx.textAlign = align || 'left'; ctx.textBaseline = 'top';
    if (shadow !== false) { ctx.fillStyle = '#000'; ctx.fillText(s, Math.round(x) + 1, Math.round(y) + 1); }
    ctx.fillStyle = col || '#fff'; ctx.fillText(s, Math.round(x), Math.round(y));
  }
  function toast(s, col, dur) { if (L) L.toasts.push({ s: s, c: col || '#ffe04a', t: dur || 3 }); }
  function flashMsg(s) { G.msg = s; G.msgT = 3; }
  function num(x, y, z, s, c) { if (L && L.nums.length < 40) L.nums.push({ x: x, y: y, z: z, s: s, c: c, t: 0.9 }); }

  /* ================= Cheats / Easter Eggs ================= */
  function cheat(c) {
    if (c === '1954') {
      G.film = !G.film; Sound.sfx('secret');
      cv.className = G.film ? 'film' : '';
      if (L && G.state === 'play') toast(G.film ? 'GOJIRA 1954 - SCHWARZWEISS-MODUS' : 'FARBE IST ZURÜCK', '#fff');
      else flashMsg(G.film ? 'SCHWARZWEISS-MODUS AN' : 'FARBMODUS');
    } else if (c === 'KONAMI') {
      if (G.state === 'title' || G.state === 'select') {
        save.island = true; store(); Sound.sfx('secret'); Sound.sfx('roar', { kind: 'godzilla' });
        flashMsg('MONSTERINSEL FREIGESCHALTET!');
        setTimeout(function () { G.score = 0; startLevel(ISLAND); }, 1200);
      }
    } else if (c === 'MINILLA') {
      if (G.state === 'title' || G.state === 'select' || G.state === 'intro') {
        G.mini = !G.mini; Sound.sfx('secret');
        flashMsg(G.mini ? 'MINILLA-MODUS AKTIV!' : 'GODZILLA IST ZURÜCK');
      }
    } else if (c === 'MOTHRA') {
      if (G.state === 'play' && !L.mothraUsed) {
        if (L.def.ally === 'mothraImago') toast('MOTHRA IST SCHON AN DEINER SEITE!', '#ffb84a');
        else { L.mothraUsed = true; summonMothra(); }
      }
    } else if (c === 'TANZ') {
      if (G.state === 'play' && !L.p.dead) {
        L.p.dance = 3; Sound.play('dance');
        if (!L.danced) { L.danced = true; G.score += 1965; toast('SHEH! DER SIEGESTANZ VON 1965! +1965', '#ff8ad0'); }
      }
    } else if (c === 'GOJIRA') {
      Sound.sfx('roar', { kind: 'godzilla', pitch: 0.85 }); if (L && G.state === 'play') toast('GOJIRA!!!', '#ff5040');
    }
  }

  /* ================= Level starten ================= */
  function sortB(m) { m.b.sort(function (a, b) { return (a.x + a.y) - (b.x + b.y) || a.x - b.x; }); }
  function startLevel(i) {
    G.lvl = i; G.levelStartScore = G.score;
    var def = LEVELS[i], gen = World.gen[def.id](), m = gen.map;
    if (gen.island) m.b.push({ x: 15.5, y: 15.5, spr: { img: SPR.volcano, ax: 60, ay: 56, h: 56 }, hp: 1e9, max: 1e9, score: 0, r: 1.8, dead: false, burn: 0, kind: 'deco', tall: 56, flash: 0 });
    m.b = m.b.concat(World.decorate(m)); // Kulisse rund um das Spielfeld
    sortB(m);
    if (def.ally) SPR[def.ally];
    // Sprites aller Gegner dieses Levels (inkl. Verwandlungen) jetzt erzeugen
    def.enc.forEach(function (e) { e.forEach(function (t) { chainOf(t).forEach(function (u) { return SPR[u]; }); }); });
    var set = G.mini ? SPR.minilla : SPR.godzilla;
    L = {
      def: def, gen: gen, map: m, ground: World.renderGround(m), time: 0, destroyed: 0,
      p: {
        x: gen.start[0], y: gen.start[1], z: 0, dir: [0.7071, -0.7071], face: 1, r: G.mini ? 0.6 : 0.95, hp: 100, en: 100, anim: 0,
        atk: 0, atkT: 0, atkKind: '', atkHit: true, atkCd: 0, combo: 0, comboT: 0, breathing: false, btick: 0, roarCd: 0, roarT: 0,
        inv: 0, flash: 0, dead: false, deathT: 0, dance: 0, set: set, moving: false, calm: 5, slow: 0, rage: 0, view: 'side', charge: null, emerge: gen.seaStart ? 58 : 0
      },
      mons: [], allies: [], allyDone: false, barrier: null, enc: def.enc.map(function (a) { return a.slice(); }), encIdx: 0, encTimer: def.secret ? 3 : 14, warn: 0,
      units: [], proj: [], fx: [], parts: [], marks: [], toasts: [], nums: [], items: [], cars: [], people: [],
      spawnT: 3, jetT: 9, carT: 2, shake: 0, hurtFlash: 0, camX: 0, camY: 0, sx: 0, sy: 0,
      llama: { x: gen.llama[0], y: gen.llama[1], hx: gen.llama[0], hy: gen.llama[1], t: 0, vx: 0, vy: 0, alive: true, face: 1 },
      mothra: null, mothraUsed: false, hintT: 10, flyHint: false, eggs: {}, snow: [], crystalsLeft: 0
    };
    initTraffic();
    if (gen.snow) for (var sn = 0; sn < (Q() ? 90 : 35); sn++) L.snow.push([Math.random() * W, Math.random() * H, rnd(0.5, 1.5)]);
    // Minikarte einmalig verkleinert vorrendern
    var c0 = gpos(0, 0), c1 = gpos(m.W, 0), c2 = gpos(m.W, m.H), c3 = gpos(0, m.H);
    L.bounds = { left: c3[0], right: c1[0], top: c0[1], bottom: c2[1] };
    L.mini = document.createElement('canvas'); L.mini.width = 92; L.mini.height = 48;
    var mg = L.mini.getContext('2d'), Bd = L.bounds;
    mg.drawImage(L.ground.cv, Bd.left, Bd.top, Bd.right - Bd.left, Bd.bottom - Bd.top, 0, 0, 92, 48);
    var gp = gpos(L.p.x, L.p.y); L.camX = gp[0]; L.camY = gp[1] - 30;
    G.state = 'intro'; G.t = 0;
    Sound.play('title');
  }

  function gpos(x, y) { return [(x - y) * 16 + L.ground.OX, (x + y) * 8 + L.ground.OY]; }
  function spos(x, y, z) {
    var g = gpos(x, y);
    return [Math.round(g[0] - L.camX + W / 2 + L.sx), Math.round(g[1] - (z || 0) - L.camY + H / 2 + L.sy)];
  }
  function onScreen(x, y, m) { var s = spos(x, y, 0); m = m || 40; return s[0] > -m && s[0] < W + m && s[1] > -m && s[1] < H + m * 2; }

  /* ================= Partikel & Effekte ================= */
  function particles(x, y, z, n, cols, spd, life, grav, size) {
    for (var i = 0; i < n && L.parts.length < PCAP(); i++) {
      var a = Math.random() * 6.283, s = Math.random() * spd;
      L.parts.push({ x: x, y: y, z: z, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: rnd(0.3, 1) * spd * 14, life: life * rnd(0.6, 1.2), max: life, c: cols[i % cols.length], g: grav, s: size || 2 });
    }
  }
  function smoke(x, y, z, n, dark) {
    for (var i = 0; i < n && L.parts.length < PCAP(); i++)
      L.parts.push({ x: x + rnd(-0.3, 0.3), y: y + rnd(-0.3, 0.3), z: z, vx: rnd(-0.2, 0.2), vy: rnd(-0.2, 0.2), vz: rnd(8, 18), life: rnd(1, 2), max: 2, c: dark ? ['#3a3a30', '#4a4a3c'][i % 2] : ['#6a6660', '#8a8680', '#4a4640'][i % 3], g: -2, s: 3, gr: 1.5 });
  }
  function dust(x, y, z, n, spread) {
    for (var i = 0; i < n && L.parts.length < PCAP(); i++) {
      var a = Math.random() * 6.283, s = rnd(0.4, 1.4) * (spread || 1);
      L.parts.push({ x: x + Math.cos(a) * 0.3, y: y + Math.sin(a) * 0.3, z: z, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: rnd(2, 8), life: rnd(1.2, 2.4), max: 2.4, c: ['#8e8678', '#a49c8c', '#6e685e', '#b8b0a0'][i % 4], g: -0.5, s: 3, gr: 4 });
    }
  }
  function explode(x, y, z, big) {
    particles(x, y, z, big ? 22 : 10, ['#ffe04a', '#ff8a1a', '#ff4a1a', '#ffffff'], big ? 2.4 : 1.4, 0.6, 40, big ? 3 : 2);
    smoke(x, y, z + 4, big ? 6 : 3);
    Sound.sfx('boom', big);
    L.shake = Math.max(L.shake, big ? 0.35 : 0.15);
    if (big && z < 20) decal(x, y, 'scorch');
  }
  // bleibende Spuren auf dem vorgerenderten Boden
  function decal(x, y, kind) {
    var g = L.ground.cv.getContext('2d'), gp = gpos(x, y);
    if (kind === 'foot') {
      g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(gp[0], gp[1], 4, 2, 0, 0, 6.283); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(Math.round(gp[0]) + 3, Math.round(gp[1]) - 1, 1, 1); g.fillRect(Math.round(gp[0]) + 4, Math.round(gp[1]), 1, 1);
    } else if (kind === 'scorch') {
      g.fillStyle = 'rgba(15,10,5,0.28)'; g.beginPath(); g.ellipse(gp[0], gp[1], 11, 5.5, 0, 0, 6.283); g.fill();
      g.fillStyle = 'rgba(10,6,2,0.3)'; g.beginPath(); g.ellipse(gp[0], gp[1], 6, 3, 0, 0, 6.283); g.fill();
    } else if (kind === 'burn') {
      g.fillStyle = 'rgba(20,20,40,0.25)'; g.beginPath(); g.ellipse(gp[0], gp[1], 4, 2, 0, 0, 6.283); g.fill();
    }
  }
  function spark(x, y, z, big) {
    L.fx.push({ k: 'spark', x0: x, y0: y, z: z, life: big ? 0.22 : 0.16, max: big ? 0.22 : 0.16, big: big });
    particles(x, y, z, big ? 10 : 6, ['#ffffff', '#ffe04a', '#ffb040'], big ? 2 : 1.4, 0.35, 30, 2);
  }

  /* ================= Gebäude ================= */
  function damageBuilding(b, dmg, byPlayer) {
    if (b.dead || b.hp > 1e8) return;
    b.hp -= dmg; b.flash = 0.08;
    if (b.hp <= 0) {
      b.dead = true;
      var big = b.tall > 30;
      // Einsturz: Gebäude sackt in sich zusammen und kippt vom Angreifer weg
      b.col = { t: 0, dur: 0.45 + Math.min(1.5, b.tall / 60), lean: ((b.x - L.p.x) - (b.y - L.p.y)) > 0 ? 1 : -1, orig: b.spr, tall: b.tall };
      b.rub = Sprites.rubble((Math.floor(b.x * 7 + b.y * 13)) % 5, L.gen.night ? 'n' : 'd', 0.8 + b.tall / 55);
      particles(b.x, b.y, b.tall * 0.5, big ? 10 : 5, ['#ffe04a', '#ff8a1a', '#ffffff'], 1.4, 0.5, 30, 2);
      Sound.sfx(big ? 'collapse' : 'boom', big ? b.tall : false);
      L.shake = Math.max(L.shake, big ? 0.3 : 0.12);
      if (b.crystal) {
        L.crystalsLeft = Math.max(0, L.crystalsLeft - 1);
        particles(b.x, b.y, 20, 16, ['#b8f0ff', '#e8b0ff', '#ffffff'], 2, 0.8, 30, 2);
        toast(L.crystalsLeft ? 'KRISTALL ZERSTÖRT! NOCH ' + L.crystalsLeft : 'ALLE KRISTALLE ZERSTÖRT!', '#8fe8ff', 2);
      }
      if (byPlayer) {
        G.score += b.score; L.destroyed++;
        var p = L.p;
        p.en = Math.min(100, p.en + 4); p.hp = Math.min(100, p.hp + 1); p.rage = Math.min(100, p.rage + 2.5);
        if (b.nuclear) { p.hp = Math.min(100, p.hp + 50); p.en = 100; toast('RADIOAKTIVE ENERGIE! +50 HP', '#7aff7a'); Sound.sfx('pickup'); num(b.x, b.y, 40, '+50', '#7aff7a'); }
        else if (Math.random() < 0.13) L.items.push({ x: b.x, y: b.y, t: 20 });
        if (b.egg === 'tower' && !L.eggs.tower) { L.eggs.tower = 1; G.score += 3000; toast('SCHON WIEDER DER TOKYO TOWER... +3000', '#ff9a6a'); }
        if (b.egg === 'castle' && !L.eggs.castle) { L.eggs.castle = 1; G.score += 1955; toast('DIE BURG VON OSAKA - WIE 1955! +1955', '#ff9a6a'); }
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
  function killUnit(u) {
    if (!u.alive) return;
    u.alive = false; G.score += u.kind === 'jet' ? 250 : 100;
    explode(u.x, u.y, u.z || 2, false);
  }

  /* ================= Spieler-Schaden ================= */
  function hurtPlayer(dmg, kx, ky) {
    var p = L.p;
    if (p.inv > 0 || p.dead || p.dance > 0) return;
    dmg *= DIFF[save.opt.diff].dmg;
    p.hp -= dmg; p.inv = 0.4; p.flash = 0.15; p.calm = 0; p.rage = Math.min(100, p.rage + dmg * 0.8);
    L.hurtFlash = 0.18;
    num(p.x, p.y, 50, '-' + Math.round(dmg), '#ff5050');
    Sound.sfx('hurt'); L.shake = Math.max(L.shake, 0.25);
    if (kx !== undefined) { p.x += kx; p.y += ky; clampPos(p); }
    if (p.hp <= 0) { p.hp = 0; p.dead = true; p.deathT = 0; p.breathing = false; Sound.breath(false); Sound.sfx('roar', { kind: 'godzilla', pitch: 0.6 }); Sound.stop(); }
  }
  function clampPos(e) {
    var m = L.map, x = e.x, y = e.y;
    e.x = Math.max(0.5, Math.min(m.W - 0.5, e.x));
    e.y = Math.max(0.5, Math.min(m.H - 0.5, e.y));
    // unsichtbare Wand: kurz aufschimmern lassen, wenn Godzilla dagegen läuft
    if (e === L.p && (x !== e.x || y !== e.y) && (!L.barrier || L.barrier.t < 0.3)) {
      L.barrier = { t: 0.6, x: e.x, y: e.y, ex: x !== e.x ? (x < e.x ? 0 : m.W) : null, ey: y !== e.y ? (y < e.y ? 0 : m.H) : null };
    }
  }

  /* ================= Monster ================= */
  function damageMon(m, dmg, big) {
    if (!m || m.dead || m.enter > 0) return false;
    if (m.shield > 0) { particles(m.x, m.y, 30 + m.z, 3, ['#8af', '#fff'], 1, 0.3, 0, 1); num(m.x, m.y, 60 + m.z, 'BLOCK', '#8fe8ff'); return false; }
    if (m.def.cocoon) { if (Math.random() < 0.3) num(m.x, m.y, 40, 'KOKON', '#f0e8c8'); return false; }
    m.hp -= dmg; m.flash = 0.1;
    if (L.p) L.p.rage = Math.min(100, L.p.rage + dmg * 0.5);
    num(m.x + rnd(-0.3, 0.3), m.y, 50 + m.z, '-' + Math.round(dmg), big ? '#ffe04a' : '#ffffff');
    if (m.hp <= 0 && m.def.next) { G.score += 800; morph(m, m.def.next); return true; }
    if (m.hp <= 0) {
      m.hp = 0; m.dead = true; m.deathT = 0; m.act = null;
      var pts = m.boss ? 5000 : 1500; G.score += pts;
      Sound.sfx('roar', { kind: m.def.roar[0], pitch: m.def.roar[1] * 0.8 });
      toast(m.def.name + ' BESIEGT! +' + pts, '#7aff7a');
    }
    return true;
  }
  function spawnPos(type, idx, n) {
    var g = L.gen, d = MON[type];
    if (d.home) {
      if (g.lake) return [g.lake[0], g.lake[1]];
      if (g.island) return [15.5, 9.5];
      return [g.bossAt[0] + 0.5, g.bossAt[1] + 0.5];
    }
    if (L.def.secret) return [15.5 + (idx - (n - 1) / 2) * 4, 7.5];
    var bx = g.bossAt[0] + 0.5 + (idx - (n - 1) / 2) * 4, by = g.bossAt[1] + 0.5 - (idx - (n - 1) / 2) * 2;
    if (dist(bx, by, L.p.x, L.p.y) < 8) { bx = L.map.W - bx; by = L.map.H - by; }
    return [Math.max(1.5, Math.min(L.map.W - 1.5, bx)), Math.max(1.5, Math.min(L.map.H - 1.5, by))];
  }
  function makeMon(type, boss, idx, n) {
    var d = MON[type], pos = spawnPos(type, idx, n);
    var m = {
      type: type, def: d, set: SPR[type], boss: boss, x: pos[0], y: pos[1], z: 0, face: -1, anim: 0, cd: 2 + idx * 0.7, act: null,
      stun: 0, flash: 0, dead: false, deathT: 0, shield: 0, shieldCd: 10, enter: 2.5, phase: 'air', phaseT: 8, ang: idx * 2,
      r: d.r, hp: d.hp * DIFF[save.opt.diff].hp, max: d.hp * DIFF[save.opt.diff].hp, step: 0, home: d.home ? [pos[0], pos[1], L.gen.lake ? L.gen.lake[2] : 3.5] : null
    };
    if (d.emerge) m.z = -80;
    if (d.fly || d.phases) m.z = 110;
    return m;
  }
  // Verwandlung: Larve -> Kokon -> Falter
  function morph(m, to) {
    var d = MON[to], hpm = DIFF[save.opt.diff].hp;
    m.type = to; m.def = d; m.set = SPR[to]; m.hp = m.max = d.hp * hpm; m.act = null; m.stun = 0; m.flash = 0.4;
    m.cocoonT = d.cocoon || 0; m.cd = 1.5; m.view = 'side';
    L.whiteFlash = 0.25; L.shake = 0.4;
    particles(m.x, m.y, 20, 24, d.cocoon ? ['#ffffff', '#f0e8c8'] : ['#ffe04a', '#ffffff', '#ff8ad0', '#8fe8ff'], 2.2, 1, 10, 2);
    Sound.sfx('secret'); Sound.sfx('roar', { kind: d.roar[0], pitch: d.roar[1] });
    toast(d.cocoon ? d.name.replace(' (KOKON)', '') + ' VERPUPPT SICH!' : d.name + ' IST GESCHLÜPFT!', '#ffb84a', 3);
  }
  function spawnCrystals() {
    var n = 0, m = L.map;
    for (var tries = 0; tries < 200 && n < 6; tries++) {
      var i = Math.floor(rnd(2, m.W - 2)), j = Math.floor(rnd(2, m.H - 2)), t = m.T(i, j);
      if (m.occ[i + ',' + j] || t === World.T.WATER || t === World.T.DEEP || dist(i, j, L.p.x, L.p.y) < 5) continue;
      var b = m.add(i, j, Sprites.special('crystal'), { hp: 120, score: 400, egg: 'crystal' });
      if (b) { b.crystal = true; n++; explode(i + 0.5, j + 0.5, 5, false); }
    }
    sortB(m);
    L.crystalsLeft = n;
    toast('KRISTALLTÜRME! SIE HEILEN SPACEGODZILLA - ZERSTÖRE SIE!', '#8fe8ff', 4);
  }
  function spawnEncounter() {
    var list = L.enc[L.encIdx], boss = L.encIdx === L.enc.length - 1;
    L.encIdx++; L.warn = 0;
    list.forEach(function (t, i) { L.mons.push(makeMon(t, boss, i, list.length)); });
    if (list.some(function (t) { return MON[t].crystals; })) spawnCrystals();
    Sound.play(boss ? 'boss' : 'mini');
    var d0 = MON[list[0]];
    Sound.sfx('roar', { kind: d0.roar[0], pitch: d0.roar[1] });
    toast(list.map(function (t) { return MON[t].name; }).join(' & ') + (list.length > 1 ? ' ERSCHEINEN!' : ' ERSCHEINT!'), '#ff5040', 3);
  }
  function moveToward(e, tx, ty, s) {
    var dx = tx - e.x, dy = ty - e.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d < 0.01) return;
    s = Math.min(s, d); e.x += dx / d * s; e.y += dy / d * s; e.anim += s * 3;
    if (e.def && e.z < 5) { e.step = (e.step || 0) + s; if (e.step > 1.1) { e.step = 0; decal(e.x + rnd(-0.4, 0.4), e.y + rnd(-0.4, 0.4), 'foot'); } }
  }
  function inAir(m) { return m.z > 10; }
  // Ansicht abhängig von der Bildschirm-Richtung: Seite, von vorne (nach unten) oder von hinten (nach oben)
  function updateView(e, dx, dy) {
    var sdx = dx - dy, sdy = dx + dy, ax = Math.abs(sdx), ay = Math.abs(sdy);
    if (ay > ax * 1.5) e.view = sdy > 0 ? 'front' : 'back';
    else if (ay < ax * 1.1) e.view = 'side';
    if (ax > 0.15) e.face = sdx > 0 ? 1 : -1;
  }

  /* ---------- Teams: Gegner greifen Godzilla & Verbündete an, Verbündete greifen Gegner an ---------- */
  function isAlly(m) { return m.team === 'ally'; }
  function foesOf(m) {
    if (isAlly(m)) return L.mons.filter(function (e) { return !e.dead && e.enter <= 0 && !e.def.cocoon; });
    var t = []; if (!L.p.dead) t.push(L.p);
    L.allies.forEach(function (a) { if (!a.dead && a.enter <= 0) t.push(a); });
    return t;
  }
  function pickTarget(m) {
    var best = null, bd = 1e9;
    foesOf(m).forEach(function (t) { var d = dist(t.x, t.y, m.x, m.y) * (t === L.p ? 0.8 : 1); if (d < bd) { bd = d; best = t; } });
    return best;
  }
  function hitTarget(m, T, dmg, kx, ky) {
    if (T === L.p) hurtPlayer(dmg, kx, ky);
    else if (isAlly(T)) hurtAlly(T, dmg);
    else damageMon(T, dmg);
  }
  function hurtAlly(a, dmg) {
    if (a.dead || a.inv > 0) return;
    dmg *= 0.7 * DIFF[save.opt.diff].dmg;
    a.inv = 0.3; a.hp -= dmg; a.flash = 0.12; a.calm = 0;
    num(a.x, a.y, 50 + a.z, '-' + Math.round(dmg), '#ffb0b0');
    if (a.hp <= 0) {
      a.hp = 0; a.dead = true; a.deathT = 0; a.act = null;
      toast(a.def.name + ' IST ERSCHÖPFT UND ZIEHT SICH ZURÜCK!', '#ffb84a', 3);
      Sound.sfx('roar', { kind: a.def.roar[0], pitch: a.def.roar[1] * 0.8 });
    }
  }
  function spawnAlly(type) {
    var p = L.p, d = MON[type];
    var a = makeMon(type, false, 0, 1);
    a.team = 'ally'; a.home = null; a.calm = 0;
    if (d.fly || d.phases) { a.x = Math.max(1, p.x - 4); a.y = Math.min(L.map.H - 1, p.y + 4); a.z = 110; }
    else { a.x = Math.max(1, Math.min(L.map.W - 1, p.x - 6)); a.y = Math.max(1, Math.min(L.map.H - 1, p.y + 3)); a.z = 0; a.enter = 1.5; }
    L.allies.push(a);
    Sound.sfx('roar', { kind: d.roar[0], pitch: d.roar[1] });
    toast(d.name + ' KÄMPFT AN DEINER SEITE!', '#7aff7a', 4);
  }

  function updateMon(m, dt) {
    var p = L.p, d = m.def, ally = isAlly(m);
    m.flash = Math.max(0, m.flash - dt);
    if (m.inv > 0) m.inv -= dt;
    if (m.dead) {
      m.deathT += dt;
      if (ally) { m.z += 45 * dt; if (!d.fly) m.x -= dt * 2; return; } // Verbündeter zieht sich zurück
      if ((d.fly || d.phases) && m.z > 0) m.z = Math.max(0, m.z - 70 * dt);
      else m.z -= dt * 16;
      if (Math.random() < 0.3) explode(m.x + rnd(-1, 1), m.y + rnd(-1, 1), rnd(10, 40) + Math.max(0, m.z), Math.random() < 0.3);
      return;
    }
    if (m.enter > 0) {
      m.enter -= dt;
      if (d.emerge) m.z = Math.min(0, -80 * (m.enter / 2.5));
      else if (d.fly || d.phases) m.z = (d.fly || 34) + (110 - (d.fly || 34)) * Math.max(0, m.enter / 2.5);
      else moveToward(m, p.x, p.y, d.speed * dt);
      if (Math.random() < 0.2) L.shake = Math.max(L.shake, 0.1);
      m.anim += dt * 4;
      return;
    }
    if (m.shield > 0) m.shield -= dt;
    if (ally) { m.calm = (m.calm || 0) + dt; if (m.calm > 4) m.hp = Math.min(m.max, m.hp + 2 * dt); }
    var T = pickTarget(m), idle = !T;
    if (idle) T = p;
    var dx = T.x - m.x, dy = T.y - m.y, dd = Math.sqrt(dx * dx + dy * dy) || 0.01;
    if (!m.act || m.act.a.t !== 'charge') updateView(m, dx, dy);
    if (d.cocoon) {
      m.cocoonT -= dt; m.anim = 0;
      if (Math.random() < 0.3) particles(m.x, m.y, 15, 1, ['#fff6c0', '#ffffff'], 0.4, 0.8, -5, 1);
      if (m.cocoonT <= 0) morph(m, d.next);
      return;
    }
    if (d.crystals && L.crystalsLeft > 0 && m.hp < m.max) m.hp = Math.min(m.max, m.hp + L.crystalsLeft * 1.6 * dt);
    if (m.act && m.act.a.t === 'charge' && m.act.t > m.act.a.w) { m.trail = m.trail || []; m.trail.unshift([m.x, m.y, m.z]); if (m.trail.length > 4) m.trail.pop(); } else m.trail = null;
    if (m.stun > 0) { m.stun -= dt; return; }
    if (d.phases) {
      m.phaseT -= dt;
      if (m.phaseT <= 0 && !m.act) {
        m.phase = m.phase === 'air' ? 'ground' : 'air'; m.phaseT = m.phase === 'air' ? 8 : 6;
        if (m.phase === 'ground' && !ally) toast(d.name + ' LANDET!', '#ffe04a');
      }
      var tz = m.phase === 'air' ? 34 : 0;
      m.z += (tz - m.z) * Math.min(1, dt * 2);
    } else if (d.fly) {
      var fz = (m.act && m.act.a.swoop && m.act.t > m.act.a.w) ? 6 : d.fly;
      m.z += (fz - m.z) * Math.min(1, dt * 4);
    }
    // nicht mit Godzilla überlappen (Verbündete weichen sanft aus)
    var pdx = p.x - m.x, pdy = p.y - m.y, pdd = Math.sqrt(pdx * pdx + pdy * pdy) || 0.01;
    if (!inAir(m) && pdd < m.r + p.r && !p.dead) {
      var push = (m.r + p.r - pdd);
      if (!ally) { p.x += pdx / pdd * push * 0.7; p.y += pdy / pdd * push * 0.7; clampPos(p); }
      if (!d.home) { m.x -= pdx / pdd * push * (ally ? 1 : 0.3); m.y -= pdy / pdd * push * (ally ? 1 : 0.3); }
    }
    if (!inAir(m)) buildingsNear(m.x, m.y, m.r * 0.7, function (bl) { damageBuilding(bl, 150 * dt, false); });
    if (d.shield && m.hp < m.max / 2) {
      m.shieldCd -= dt;
      if (m.shieldCd <= 0) { m.shield = 3.5; m.shieldCd = 12; toast(d.name + ': SPIEGELSCHILD!', '#8fe8ff'); Sound.sfx('zap'); }
    }
    if (!m.act) {
      if (idle) { // Verbündeter ohne Gegner: Godzilla begleiten
        if (dd > 4) moveToward(m, p.x - 2.5, p.y + 2.5, d.speed * dt); else m.anim += dt;
        clampPos(m); return;
      }
      if (d.phases && m.phase === 'air') {
        m.ang += dt * 0.45;
        moveToward(m, T.x + Math.cos(m.ang) * 6, T.y + Math.sin(m.ang) * 6, d.speed * dt);
      } else if (d.fly) {
        m.ang += dt * 0.6;
        moveToward(m, T.x + Math.cos(m.ang) * d.pref, T.y + Math.sin(m.ang) * d.pref, d.speed * dt);
      } else if (dd > d.pref) moveToward(m, T.x, T.y, (d.phases ? 1.8 : d.speed) * dt);
      else if (dd < d.pref - 1.5 && d.pref > 3) moveToward(m, m.x - dx, m.y - dy, d.speed * 0.6 * dt);
      else m.anim += dt * 1.5;
      if (m.home) {
        var hd = dist(m.x, m.y, m.home[0], m.home[1]);
        if (hd > m.home[2]) { m.x = m.home[0] + (m.x - m.home[0]) / hd * m.home[2]; m.y = m.home[1] + (m.y - m.home[1]) / hd * m.home[2]; }
      }
      if (dd < 12) m.cd -= dt * (m.hp < m.max / 2 ? 1.35 : 1) * (ally ? 1.15 : 1);
      if (m.cd <= 0) {
        var opts = d.atk.filter(function (a) {
          if (dd < (a.min || 0) || dd > a.max) return false;
          if (a.ground && inAir(m)) return false;
          if (a.air && !inAir(m)) return false;
          if (a.t === 'melee' && inAir(m)) return false;
          if (ally && a.t === 'gust') return false;
          return true;
        });
        if (opts.length) {
          var a = opts[Math.floor(Math.random() * opts.length)];
          m.act = { a: a, t: 0, fired: 0, T: T, tx: T.x, ty: T.y, dx: dx / dd, dy: dy / dd, hitDone: false };
          if (a.t === 'marks') {
            for (var i = 0; i < a.n; i++) L.marks.push({ x: T.x + (i ? rnd(-2, 2) : 0), y: T.y + (i ? rnd(-2, 2) : 0), r: a.mark === 'smog' ? 1.4 : a.mark === 'powder' ? 1.5 : 1.1, t: 0, dur: 1.0, kind: a.mark, dmg: a.dmg, team: m.team || 'enemy' });
          }
          m.cd = rnd(d.cd[0], d.cd[1]);
        } else m.cd = 0.3;
      }
    } else runAct(m, dt);
    clampPos(m);
  }

  function runAct(m, dt) {
    var A = m.act, a = A.a, ally = isAlly(m);
    if (!A.T || A.T.dead) A.T = pickTarget(m) || L.p;
    var T = A.T, dx = T.x - m.x, dy = T.y - m.y, dd = Math.sqrt(dx * dx + dy * dy) || 0.01;
    A.t += dt;
    var fire = A.t >= a.w && !A.fired;
    if (a.t === 'melee') {
      if (fire) {
        A.fired = 1; Sound.sfx('swing');
        L.fx.push({ k: 'swoosh', x0: m.x + A.dx * 1.2, y0: m.y + A.dy * 1.2, z: 30, dir: m.face, life: 0.18, max: 0.18, col: ally ? '#b0ffb0' : '#ffb0a0' });
        if (dd < a.max + 0.4) { hitTarget(m, T, a.dmg, dx / dd * a.kb, dy / dd * a.kb); spark(T.x, T.y, 35, true); if (T === L.p) G.hitstop = 0.06; }
      }
    } else if (a.t === 'charge') {
      if (A.t > a.w && A.t < a.dur) {
        if (!A.fired) { A.fired = 1; Sound.sfx('whip'); A.hit = []; }
        m.x += A.dx * a.spd * dt; m.y += A.dy * a.spd * dt; m.anim += dt * 12;
        if (Math.random() < 0.5) smoke(m.x, m.y, 2, 1);
        buildingsNear(m.x, m.y, m.r, function (bl) { damageBuilding(bl, 300 * dt, false); });
        foesOf(m).forEach(function (v) {
          if (A.hit.indexOf(v) < 0 && dist(m.x, m.y, v.x, v.y) < m.r + v.r + 0.2) {
            A.hit.push(v); hitTarget(m, v, a.dmg, A.dx * 1.4, A.dy * 1.4); spark(v.x, v.y, 30, true); Sound.sfx('heavy');
            if (v === L.p) G.hitstop = 0.07;
          }
        });
      }
    } else if (a.t === 'beam') {
      var tx = m.x + (A.tx - m.x) * 1.7, ty = m.y + (A.ty - m.y) * 1.7;
      if (fire) {
        A.fired = 1; Sound.sfx(a.beam === 'grav' ? 'zap' : 'laser');
        var heads = a.heads || 1, victims = foesOf(m);
        for (var h = 0; h < heads; h++) {
          var ox = h ? rnd(-1.8, 1.8) : 0, oy = h ? rnd(-1.8, 1.8) : 0, ex = tx + ox, ey = ty + oy;
          L.fx.push({ k: 'beam', style: a.beam, x0: m.x, y0: m.y, x1: ex, y1: ey, life: 0.45, max: 0.45, src: m, head: h });
          victims.forEach(function (v) { if (segDist(v.x, v.y, m.x, m.y, ex, ey) < 0.9 + (v.r || 0) * 0.3) hitTarget(m, v, a.dmg); });
          for (var s = 2; s <= 12; s++) { var bl = L.map.occ[Math.floor(m.x + (ex - m.x) * s / 12) + ',' + Math.floor(m.y + (ey - m.y) * s / 12)]; if (bl) damageBuilding(bl, 60, false); }
          if (a.beam === 'grav') explode(ex, ey, 2, false);
        }
      }
    } else if (a.t === 'volley' || a.t === 'lob') {
      while (A.t > a.w && A.fired < a.n && A.t > a.w + A.fired * 0.14) {
        A.fired++;
        Sound.sfx(a.t === 'lob' ? 'splat' : 'shot');
        var mo = m.set.mouth || { x: 0, y: -30 }, from = ally ? 'a' : 'e';
        if (a.t === 'lob') L.proj.push({ kind: a.proj, sx: m.x, sy: m.y, x: m.x, y: m.y, z: 40, tx: T.x + rnd(-1.6, 1.6), ty: T.y + rnd(-1.6, 1.6), t: 0, dur: 1.1, from: from, dmg: a.dmg, life: 2 });
        else {
          var ang = Math.atan2(dy, dx) + (a.n > 1 ? rnd(-0.5, 0.5) : 0) + (a.proj === 'missile' ? rnd(-0.8, 0.8) : 0);
          L.proj.push({ kind: a.proj, x: m.x, y: m.y, z: Math.max(20, -mo.y * 0.8) + Math.max(0, m.z), vx: Math.cos(ang) * a.spd, vy: Math.sin(ang) * a.spd, life: 3, from: from, dmg: a.dmg, tgt: T });
        }
      }
    } else if (a.t === 'gust') {
      if (A.t > a.w && T === L.p) {
        T.x += dx / dd * 3.2 * dt; T.y += dy / dd * 3.2 * dt; clampPos(T);
        if (Math.random() < 0.6) particles(T.x + rnd(-1, 1), T.y + rnd(-1, 1), 10, 1, ['#dde', '#fff'], 2, 0.4, 0, 1);
        if (!A.fired) { A.fired = 1; Sound.sfx('whip'); }
      }
    }
    if (A.t >= a.dur) m.act = null;
  }

  /* ================= Spieler ================= */
  function playerHitMonsters(cx, cy, rad, dmg, kb, big) {
    var any = false, p = L.p;
    L.mons.forEach(function (m) {
      if (m.dead || m.enter > 0) return;
      var dd = dist(m.x, m.y, cx, cy);
      if (inAir(m)) {
        if (dd < rad + 2 && !L.flyHint) { L.flyHint = true; toast('ER FLIEGT! NUTZE DEN ATOMSTRAHL (K)', '#8fe8ff'); }
        return;
      }
      if (dd < rad + m.r * 0.7) {
        if (damageMon(m, dmg, big)) {
          any = true;
          spark(m.x - (m.x - p.x) * 0.3, m.y - (m.y - p.y) * 0.3, 32, big);
          if (!m.def.home) { var ex = m.x - p.x, ey = m.y - p.y, el = Math.sqrt(ex * ex + ey * ey) || 1; m.x += ex / el * kb; m.y += ey / el * kb; clampPos(m); }
          if (m.act && m.act.a.t !== 'charge' && big) m.act = null; // Schwanzhieb unterbricht
        }
      }
    });
    if (any) { G.hitstop = big ? 0.1 : 0.06; Sound.sfx(big ? 'heavy' : 'hit'); L.shake = Math.max(L.shake, big ? 0.3 : 0.15); }
  }

  function updatePlayer(dt) {
    var p = L.p;
    p.flash = Math.max(0, p.flash - dt); p.inv = Math.max(0, p.inv - dt);
    p.atkCd -= dt; p.roarCd -= dt; p.roarT -= dt; p.comboT -= dt; p.slow -= dt;
    p.calm += dt;
    if (p.dead) { p.deathT += dt; p.z = -p.deathT * 12; return; }
    if (p.calm > 3 && p.hp < 100) p.hp = Math.min(100, p.hp + 2.5 * dt);
    if (p.dance > 0) {
      p.dance -= dt; p.z = Math.abs(Math.sin(p.dance * 9)) * 10;
      p.face = Math.floor(p.dance * 4) % 2 ? 1 : -1;
      if (p.dance <= 0) p.z = 0;
      return;
    }
    // Auftauchen aus dem Meer & Waten (nie wieder tief versinken)
    var wt = L.map.at(p.x, p.y), deepW = wt === T.DEEP, wet = deepW || wt === T.WATER;
    if (p.emerge > 0) {
      p.emerge = Math.max(0, p.emerge - dt * (p.moving ? 17 : 5));
      if (Math.random() < 0.6) particles(p.x + rnd(-0.6, 0.6), p.y + rnd(-0.6, 0.6), 2, 2, ['#e8f4ff', '#9ad0ff', '#ffffff'], 1.2, 0.6, 30, 2);
      if (p.emerge === 0) { Sound.sfx('roar', { kind: 'godzilla' }); L.shake = 0.5; toast('GODZILLA BETRITT DAS LAND!', '#9ef4ff', 2.5); }
    }
    p.wade = wet ? (deepW ? 9 : 4) : 0;
    p.z = -Math.max(p.emerge, p.wade * (G.mini ? 0.6 : 1));
    if (wet && p.moving && Math.random() < 0.5) particles(p.x + rnd(-0.5, 0.5), p.y + rnd(-0.5, 0.5), 1, 2, ['#e8f4ff', '#9ad0ff'], 1.4, 0.5, 40, 2);
    var ix = (down('arrowright') || down('d') ? 1 : 0) - (down('arrowleft') || down('a') ? 1 : 0);
    var iy = (down('arrowdown') || down('s') ? 1 : 0) - (down('arrowup') || down('w') ? 1 : 0);
    var wx = ix + iy, wy = iy - ix, l = Math.sqrt(wx * wx + wy * wy);
    var attacking = p.atk > 0;
    // Aufladen (tief einatmen, Rückenplatten leuchten vom Schwanz nach oben auf)
    if (p.charge) {
      var C = p.charge; C.t += dt;
      if (Math.random() < 0.7) {
        var tt = Math.min(1, C.t / C.dur), back = -0.6 - tt * 0.6;
        L.parts.length < PCAP() && L.parts.push({ x: p.x + p.dir[0] * back + rnd(-0.5, 0.5), y: p.y + p.dir[1] * back + rnd(-0.5, 0.5), z: 10 + tt * 50, vx: 0, vy: 0, vz: rnd(10, 30), life: 0.5, max: 0.5, c: Math.random() < 0.5 ? '#9ef4ff' : '#ffffff', g: 0, s: 2 });
      }
      if (C.kind === 'pulse' && C.t >= C.dur) { p.charge = null; nuclearPulse(); }
    }
    p.moving = l > 0 && !attacking && !p.charge;
    var sp = G.mini ? 2.9 : 2.4;
    if (p.charge) sp *= 0.1;
    if (p.breathing) sp *= 0.25;
    if (attacking) sp *= 0.3;
    if (p.slow > 0) sp *= 0.4;
    if (L.map.isWater(p.x, p.y)) sp *= 0.7;
    var crushing = false;
    buildingsNear(p.x, p.y, p.r * 0.7, function (b) { crushing = true; damageBuilding(b, (G.mini ? 70 : 130) * dt, true); });
    if (crushing) sp *= 0.6;
    if (l > 0) {
      wx /= l; wy /= l; p.dir = [wx, wy];
      p.x += wx * sp * dt; p.y += wy * sp * dt; clampPos(p);
      var ld = p.anim; p.anim += dt * 7;
      if (Math.floor(ld / 2) !== Math.floor(p.anim / 2)) {
        var side = Math.floor(p.anim / 2) % 2 ? 0.35 : -0.35;
        decal(p.x - wy * side, p.y + wx * side, 'foot');
        if (!G.mini) { Sound.sfx('stomp'); L.shake = Math.max(L.shake, 0.06); }
      }
      if (!attacking && !p.breathing && !p.charge) updateView(p, wx, wy);
    }
    L.units.forEach(function (u) { if (u.alive && u.kind === 'tank' && dist(u.x, u.y, p.x, p.y) < p.r) killUnit(u); });
    // Nahkampf-Kombo: Klaue, Klaue, Schwanzhieb
    if ((hit('j') || hit('space')) && p.atkCd <= 0 && !p.breathing && !p.charge) {
      p.combo = p.comboT > 0 ? (p.combo + 1) % 3 : 0;
      p.comboT = 1.0;
      p.atkKind = p.combo === 2 ? 'tail' : 'claw';
      p.atk = p.atkKind === 'tail' ? 0.45 : 0.3; p.atkT = 0; p.atkHit = false;
      p.atkCd = p.atkKind === 'tail' ? 0.55 : 0.28;
      Sound.sfx(p.atkKind === 'tail' ? 'whip' : 'swing');
      L.fx.push({ k: p.atkKind === 'tail' ? 'spin' : 'swoosh', x0: p.x + (p.atkKind === 'tail' ? 0 : p.dir[0] * 1.3), y0: p.y + (p.atkKind === 'tail' ? 0 : p.dir[1] * 1.3), z: 28, dir: p.face, life: 0.2, max: 0.2, col: '#ffffff', big: p.atkKind === 'tail' });
    }
    if (p.atk > 0) {
      p.atk -= dt; p.atkT += dt;
      if (!p.atkHit && p.atkT >= (p.atkKind === 'tail' ? 0.15 : 0.08)) {
        p.atkHit = true;
        var tail = p.atkKind === 'tail';
        var cx = tail ? p.x : p.x + p.dir[0] * 1.4, cy = tail ? p.y : p.y + p.dir[1] * 1.4, rad = tail ? (G.mini ? 1.8 : 2.8) : (G.mini ? 1.1 : 1.6);
        buildingsNear(cx, cy, rad, function (b) { damageBuilding(b, tail ? 90 : 70, true); });
        L.units.forEach(function (u) { if (u.alive && u.kind === 'tank' && dist(u.x, u.y, cx, cy) < rad + 0.3) killUnit(u); });
        L.cars.forEach(function (c) { if (c.alive && dist(c.x, c.y, cx, cy) < rad) crushCar(c, true); });
        playerHitMonsters(cx, cy, rad, tail ? (G.mini ? 8 : 16) : (G.mini ? 6 : 11), tail ? 1.2 : 0.5, tail);
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
    } else if (want && !attacking && (!p.charge || p.charge.kind === 'breath')) {
      var aim = p.dir, best = 0.8;
      L.mons.forEach(function (m) {
        if (m.dead) return;
        var bx = m.x - p.x, by = m.y - p.y, bd = Math.sqrt(bx * bx + by * by);
        var c = (bx * p.dir[0] + by * p.dir[1]) / bd;
        if (bd < 10 && c > best) { best = c; aim = [bx / bd, by / bd]; }
      });
      p.aim = aim;
      updateView(p, aim[0], aim[1]);
      if (!p.breathing) {
        if (!p.charge) { p.charge = { kind: 'breath', t: 0, dur: 0.6 }; Sound.sfx('charge', 0.6); }
        else if (p.charge.t >= p.charge.dur) {
          p.charge = null; p.breathing = true; p.btick = 0; Sound.breath(true);
          L.shake = Math.max(L.shake, 0.25); L.whiteFlash = 0.08;
        }
      }
      if (p.breathing) p.en = Math.max(0, p.en - 32 * dt);
      p.btick -= dt;
      if (p.breathing && p.btick <= 0) {
        p.btick = 0.1;
        var ex = p.x + aim[0] * 7.5, ey = p.y + aim[1] * 7.5;
        for (var s = 1; s <= 15; s++) {
          var b = L.map.occ[Math.floor(p.x + aim[0] * s * 0.5) + ',' + Math.floor(p.y + aim[1] * s * 0.5)];
          if (b && !b.dead) damageBuilding(b, 30, true);
        }
        L.units.forEach(function (u) { if (u.alive && segDist(u.x, u.y, p.x, p.y, ex, ey) < 0.8) killUnit(u); });
        L.cars.forEach(function (c) { if (c.alive && segDist(c.x, c.y, p.x, p.y, ex, ey) < 0.5) crushCar(c, true); });
        L.mons.forEach(function (m) {
          if (!m.dead && segDist(m.x, m.y, p.x, p.y, ex, ey) < m.r + 0.4) {
            if (damageMon(m, 2.8)) particles(m.x, m.y, 25 + m.z, 3, ['#8fe8ff', '#fff'], 1.2, 0.3, 10, 2);
          }
        });
        if (L.llama.alive && segDist(L.llama.x, L.llama.y, p.x, p.y, ex, ey) < 0.6) llamaEgg();
        particles(ex, ey, 10, 5, ['#8fe8ff', '#3a8cff', '#fff'], 2.2, 0.5, 20, 2);
        if (Math.random() < 0.3) decal(ex + rnd(-0.4, 0.4), ey + rnd(-0.4, 0.4), 'burn');
      }
    } else {
      if (p.charge && p.charge.kind === 'breath') p.charge = null; // losgelassen -> Aufladen abgebrochen
      if (p.breathing) { p.breathing = false; Sound.breath(false); }
    }
    if (!p.breathing) p.en = Math.min(100, p.en + (G.mini ? 14 : 9) * dt);
    // Brüllen
    if (hit('l') && p.roarCd <= 0) {
      p.roarCd = 8; p.roarT = 1.4; Sound.sfx('roar', { kind: 'godzilla', pitch: G.mini ? 1.7 : 1 }); L.shake = 0.6;
      L.mons.forEach(function (m) { if (!m.dead && dist(m.x, m.y, p.x, p.y) < 8) { m.stun = 1.6; m.act = null; num(m.x, m.y, 60, 'BETÄUBT', '#ffe04a'); } });
      L.units.forEach(function (u) { if (u.alive && u.kind === 'tank' && dist(u.x, u.y, p.x, p.y) < 5) killUnit(u); });
    }
    // Kernpuls (Wut-Leiste voll)
    if (hit('r') && p.rage >= 100 && !G.mini && !p.charge) {
      if (p.breathing) { p.breathing = false; Sound.breath(false); }
      p.charge = { kind: 'pulse', t: 0, dur: 1.2 }; p.inv = 1.4; Sound.sfx('charge', 1.2);
    }
    // Pickups
    L.items.forEach(function (it) {
      if (it.t > 0 && dist(it.x, it.y, p.x, p.y) < p.r + 0.3) {
        it.t = 0; p.hp = Math.min(100, p.hp + 15); p.en = Math.min(100, p.en + 20);
        Sound.sfx('pickup'); num(p.x, p.y, 55, '+15 HP', '#7aff7a');
      }
    });
    if (L.llama.alive && dist(L.llama.x, L.llama.y, p.x, p.y) < p.r + 0.3) llamaEgg();
  }

  function nuclearPulse() {
    var p = L.p;
    p.rage = 0; p.inv = 0.8;
    Sound.sfx('boom', true); Sound.sfx('collapse', 80); Sound.sfx('roar', { kind: 'godzilla', pitch: 0.9 });
    L.shake = 1; G.hitstop = 0.12; L.whiteFlash = 0.35;
    L.fx.push({ k: 'pulse', x0: p.x, y0: p.y, life: 0.8, max: 0.8 });
    buildingsNear(p.x, p.y, 5.5, function (b) { damageBuilding(b, 260, true); });
    L.units.forEach(function (u) { if (u.alive && dist(u.x, u.y, p.x, p.y) < 7) killUnit(u); });
    L.cars.forEach(function (c) { if (c.alive && dist(c.x, c.y, p.x, p.y) < 6) crushCar(c, true); });
    L.mons.forEach(function (m) {
      var d = dist(m.x, m.y, p.x, p.y);
      if (d < 7 && damageMon(m, 45, true)) {
        m.stun = 1; m.act = null;
        if (!m.def.home) { m.x += (m.x - p.x) / (d || 1) * 2; m.y += (m.y - p.y) / (d || 1) * 2; clampPos(m); }
      }
    });
    decal(p.x, p.y, 'scorch'); decal(p.x + 1, p.y, 'scorch'); decal(p.x, p.y + 1, 'scorch');
    particles(p.x, p.y, 20, 30, ['#9ef4ff', '#ffffff', '#48c4ff'], 3.5, 0.8, 10, 3);
    toast('KERNPULS!!!', '#9ef4ff', 2);
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
    L.mothra = { x: p.x - 10, y: p.y + 10, z: 70, t: 0, ph: 'in', heal: 0, hit: false };
    toast('MOTHRA KOMMT ZU HILFE!', '#ffb84a', 4); Sound.sfx('secret');
  }
  function updateMothra(dt) {
    var mo = L.mothra; if (!mo) return;
    mo.t += dt; var p = L.p;
    if (mo.ph === 'in') {
      var dx = p.x - mo.x, dy = p.y - mo.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d < 0.5) { mo.ph = 'hover'; mo.t = 0; } else { mo.x += dx / d * 8 * dt; mo.y += dy / d * 8 * dt; }
      mo.z += (60 - mo.z) * dt;
    } else if (mo.ph === 'hover') {
      mo.x += (p.x - mo.x) * dt * 3; mo.y += (p.y - mo.y) * dt * 3;
      if (mo.heal < 45) { var h = 15 * dt; mo.heal += h; p.hp = Math.min(100, p.hp + h); }
      if (Math.random() < 0.6) L.parts.push({ x: mo.x + rnd(-1, 1), y: mo.y + rnd(-1, 1), z: mo.z, vx: 0, vy: 0, vz: -10, life: 1.2, max: 1.2, c: Math.random() < 0.5 ? '#ffe04a' : '#fff4c0', g: 0, s: 1 });
      if (mo.t > 1 && !mo.hit) { mo.hit = true; L.mons.forEach(function (m) { damageMon(m, 25); }); if (L.mons.length) toast('MOTHRAS SCHUPPENSTAUB!', '#ffb84a'); }
      if (mo.t > 3.5) mo.ph = 'out';
    } else {
      mo.x += 8 * dt; mo.y -= 8 * dt; mo.z += 20 * dt;
      if (mo.t > 8) L.mothra = null;
    }
  }

  /* ================= Verkehr & Menschen ================= */
  function isRoad(t) { return t === T.ROADX || t === T.ROADY || t === T.CROSS; }
  function initTraffic() {
    var m = L.map, roads = [], ground = [];
    for (var j = 0; j < m.H; j++) for (var i = 0; i < m.W; i++) {
      var t = m.T(i, j);
      if (isRoad(t)) roads.push([i, j]);
      if (!m.occ[i + ',' + j] && t !== T.WATER && t !== T.DEEP && t !== T.LAVA && t !== T.ROCK && t !== T.SNOW) ground.push([i, j]);
    }
    L.roads = roads;
    L.carTarget = Math.min(24, Math.floor(roads.length / 7));
    for (var c = 0; c < L.carTarget; c++) spawnCar(true);
    var np = L.def.secret ? 0 : (Q() ? (L.gen.map.b.length > 300 ? 70 : 45) : 25);
    for (var k = 0; k < np && ground.length; k++) {
      var g = ground[Math.floor(Math.random() * ground.length)];
      L.people.push({ x: g[0] + Math.random(), y: g[1] + Math.random(), vx: 0, vy: 0, t: 0, col: ['#e84040', '#4070e8', '#f0f0f0', '#e8c040', '#40a060', '#c060c0'][k % 6], anim: Math.random() * 4, alive: true, flee: false });
    }
  }
  function spawnCar(any) {
    if (!L.roads.length) return;
    for (var tries = 0; tries < 10; tries++) {
      var r = L.roads[Math.floor(Math.random() * L.roads.length)];
      if (!any && dist(r[0], r[1], L.p.x, L.p.y) < 9) continue;
      var t = L.map.T(r[0], r[1]), dx = 0, dy = 0;
      if (t === T.ROADY) dy = Math.random() < 0.5 ? 1 : -1; else dx = Math.random() < 0.5 ? 1 : -1;
      L.cars.push({ x: r[0] + 0.5, y: r[1] + 0.5, dx: dx, dy: dy, spd: rnd(1.4, 2.4), col: Math.floor(Math.random() * SPR.cars.length), alive: true });
      return;
    }
  }
  function crushCar(c, byPlayer) {
    if (!c.alive) return;
    c.alive = false; explode(c.x, c.y, 3, false);
    if (byPlayer) G.score += 30;
  }
  function updateCars(dt) {
    var m = L.map, p = L.p;
    L.carT -= dt;
    if (L.carT <= 0) { L.carT = 2; if (L.cars.length < L.carTarget) spawnCar(false); }
    L.cars.forEach(function (c) {
      if (!c.alive) return;
      var panic = dist(c.x, c.y, p.x, p.y) < 7 ? 1.8 : 1;
      var ax = c.dx ? c.x : c.y, dir = c.dx || c.dy, before = ax - Math.floor(ax);
      var mv = c.spd * panic * dt;
      c.x += c.dx * mv; c.y += c.dy * mv;
      var ax2 = c.dx ? c.x : c.y, after = ax2 - Math.floor(ax2);
      var crossed = Math.floor(ax) === Math.floor(ax2) && ((dir > 0 && before < 0.5 && after >= 0.5) || (dir < 0 && before > 0.5 && after <= 0.5));
      if (crossed) {
        var ti = Math.floor(c.x), tj = Math.floor(c.y);
        c.x = ti + 0.5; c.y = tj + 0.5;
        var opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(function (d) {
          return !(d[0] === -c.dx && d[1] === -c.dy) && isRoad(m.T(ti + d[0], tj + d[1]));
        });
        var straight = opts.filter(function (d) { return d[0] === c.dx && d[1] === c.dy; });
        var pick = straight.length && Math.random() < 0.65 ? straight[0] : opts[Math.floor(Math.random() * opts.length)];
        if (!pick) { c.dx = -c.dx; c.dy = -c.dy; } else { c.dx = pick[0]; c.dy = pick[1]; }
      }
      if (c.x < 0 || c.y < 0 || c.x > m.W || c.y > m.H) c.alive = false;
      if (dist(c.x, c.y, p.x, p.y) < p.r * 0.8 && !p.dead) crushCar(c, true);
      L.mons.forEach(function (mo) { if (!mo.dead && !inAir(mo) && dist(c.x, c.y, mo.x, mo.y) < mo.r * 0.8) crushCar(c, false); });
    });
    L.cars = L.cars.filter(function (c) { return c.alive; });
  }
  function updatePeople(dt) {
    var m = L.map, p = L.p;
    L.people.forEach(function (h) {
      if (!h.alive) return;
      var tx = p.x, ty = p.y, td = dist(h.x, h.y, p.x, p.y);
      L.mons.forEach(function (mo) { var d2 = dist(h.x, h.y, mo.x, mo.y); if (d2 < td) { td = d2; tx = mo.x; ty = mo.y; } });
      h.t -= dt;
      if (td < 6) {
        var ex = h.x - tx, ey = h.y - ty, el = Math.sqrt(ex * ex + ey * ey) || 1;
        h.vx = ex / el * 1.5 + rnd(-0.3, 0.3); h.vy = ey / el * 1.5 + rnd(-0.3, 0.3); h.flee = true;
      } else if (h.t <= 0) {
        h.t = rnd(1, 3); h.flee = false;
        var a = Math.random() * 6.283, s = Math.random() < 0.4 ? 0 : 0.35;
        h.vx = Math.cos(a) * s; h.vy = Math.sin(a) * s;
      }
      var nx = h.x + h.vx * dt, ny = h.y + h.vy * dt;
      if (m.isWater(nx, ny)) { h.vx = -h.vx; h.vy = -h.vy; } else { h.x = nx; h.y = ny; }
      if (h.vx || h.vy) h.anim += dt * 10;
      if (h.x < 0.1 || h.y < 0.1 || h.x > m.W - 0.1 || h.y > m.H - 0.1) h.alive = false; // evakuiert
      if (td < 0.6) { var jx = h.x - tx, jy = h.y - ty, jl = Math.sqrt(jx * jx + jy * jy) || 1; h.x += jx / jl * 0.8; h.y += jy / jl * 0.8; }
    });
    L.people = L.people.filter(function (h) { return h.alive; });
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
      var cap = L.mons.length ? 2 : 5;
      if (L.spawnT <= 0 && tanks < cap) {
        L.spawnT = L.mons.length ? 7 : 4;
        var s = edgeSpawn();
        if (s) L.units.push({ kind: 'tank', x: s[0], y: s[1], z: 0, alive: true, cd: rnd(1, 3), face: 1 });
      }
      if (L.jetT <= 0) {
        L.jetT = L.mons.length ? 16 : 10;
        var ang = Math.random() * 6.283;
        L.units.push({ kind: 'jet', x: p.x - Math.cos(ang) * 18, y: p.y - Math.sin(ang) * 18, z: 50, vx: Math.cos(ang) * 7, vy: Math.sin(ang) * 7, alive: true, fired: false, life: 6, face: (Math.cos(ang) - Math.sin(ang)) > 0 ? 1 : -1 });
      }
    }
    L.units.forEach(function (u) {
      if (!u.alive) return;
      var dx = p.x - u.x, dy = p.y - u.y, d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      if (u.kind === 'tank') {
        if (d > 5) { u.x += dx / d * 1.2 * dt; u.y += dy / d * 1.2 * dt; }
        u.face = (dx - dy) > 0 ? 1 : -1;
        u.cd -= dt;
        if (u.cd <= 0 && d < 9 && !p.dead) {
          u.cd = rnd(2.2, 3.8); Sound.sfx('shot');
          L.proj.push({ kind: 'shell', x: u.x, y: u.y, z: 4, vx: dx / d * 7, vy: dy / d * 7, life: 2, from: 'e', dmg: 1.5 });
          particles(u.x, u.y, 5, 2, ['#ffe04a'], 0.5, 0.2, 0, 1);
        }
      } else {
        u.x += u.vx * dt; u.y += u.vy * dt; u.life -= dt;
        if (!u.fired && d < 6) {
          u.fired = true; Sound.sfx('shot');
          for (var i = 0; i < 2; i++) L.proj.push({ kind: 'missile', x: u.x, y: u.y, z: 45, vx: dx / d * 6 + rnd(-1, 1), vy: dy / d * 6 + rnd(-1, 1), life: 2.5, from: 'e', dmg: 3, fall: true });
        }
        if (u.life <= 0) u.alive = false;
      }
    });
    L.units = L.units.filter(function (u) { return u.alive; });
  }

  function updateProj(dt) {
    var p = L.p;
    L.proj.forEach(function (q) {
      q.life -= dt;
      if (q.kind === 'sap' || q.kind === 'sludge' || q.kind === 'water' || q.kind === 'napalm') {
        q.t += dt; var k = Math.min(1, q.t / q.dur);
        q.x = q.sx + (q.tx - q.sx) * k; q.y = q.sy + (q.ty - q.sy) * k; q.z = 40 * (1 - k) + Math.sin(Math.PI * k) * 40;
        if (k >= 1) {
          q.life = 0;
          particles(q.x, q.y, 2, 8, { sap: ['#ff9a2a', '#ffcc4a'], sludge: ['#4a5a3a', '#7a8a5a'], water: ['#6ab8ff', '#e0f4ff'], napalm: ['#ff5a1a', '#ffd040', '#ffffff'] }[q.kind], 1.2, 0.5, 30, 2);
          if (q.kind === 'napalm') { decal(q.x, q.y, 'scorch'); smoke(q.x, q.y, 3, 2); }
          if (q.from === 'a') L.mons.forEach(function (m) { if (!m.dead && dist(q.x, q.y, m.x, m.y) < m.r + 0.6) damageMon(m, q.dmg); });
          else {
            if (dist(q.x, q.y, p.x, p.y) < 1.1) hurtPlayer(q.dmg);
            L.allies.forEach(function (a) { if (!a.dead && dist(q.x, q.y, a.x, a.y) < a.r + 0.6) hurtAlly(a, q.dmg); });
          }
          if (q.kind === 'sludge') L.marks.push({ x: q.x, y: q.y, r: 1.0, t: 1, dur: 1, kind: 'smog', dmg: 3, done: false });
        }
        return;
      }
      if (q.kind === 'missile') {
        var hq = q.tgt && !q.tgt.dead ? q.tgt : p, dx = hq.x - q.x, dy = hq.y - q.y, d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        q.vx += dx / d * 5 * dt; q.vy += dy / d * 5 * dt;
        var v = Math.sqrt(q.vx * q.vx + q.vy * q.vy), mv = 5.5; if (v > mv) { q.vx *= mv / v; q.vy *= mv / v; }
        if (q.fall) q.z = Math.max(20, q.z - 12 * dt);
        if (Math.random() < 0.4) smoke(q.x, q.y, q.z, 1);
      }
      q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.from === 'e') {
        L.allies.forEach(function (a) { if (q.life > 0 && !a.dead && !inAir(a) && dist(q.x, q.y, a.x, a.y) < a.r + 0.2) { q.life = 0; hurtAlly(a, q.dmg); explode(q.x, q.y, q.z, false); } });
        if (q.life > 0 && dist(q.x, q.y, p.x, p.y) < p.r * 0.9) {
          q.life = 0; hurtPlayer(q.dmg);
          if (q.kind === 'web' || q.kind === 'silk') { p.slow = 2.5; toast('IM NETZ GEFANGEN!', '#ffffff', 1.5); particles(p.x, p.y, 20, 10, ['#ffffff', '#dddddd'], 1, 0.6, 10, 2); }
          else explode(q.x, q.y, q.z, false);
        }
      } else {
        L.mons.forEach(function (m) { if (q.life > 0 && !m.dead && dist(q.x, q.y, m.x, m.y) < m.r + 0.3) { q.life = 0; if (damageMon(m, q.dmg)) { Sound.sfx('hit'); spark(q.x, q.y, 25, false); } } });
        var bl = L.map.occ[Math.floor(q.x) + ',' + Math.floor(q.y)];
        if (bl && !bl.dead) { damageBuilding(bl, 40, true); q.life -= 0.3; }
        L.units.forEach(function (u) { if (u.alive && dist(u.x, u.y, q.x, q.y) < 0.6) killUnit(u); });
      }
      if (q.x < -2 || q.y < -2 || q.x > L.map.W + 2 || q.y > L.map.H + 2) q.life = 0;
    });
    L.proj = L.proj.filter(function (q) { return q.life > 0; });

    L.marks.forEach(function (m) {
      m.t += dt;
      if (m.kind === 'smog') {
        if (m.t >= m.dur) {
          if (Math.random() < 0.5) smoke(m.x + rnd(-m.r, m.r) * 0.7, m.y + rnd(-m.r, m.r) * 0.7, 2, 1, true);
          if (dist(m.x, m.y, p.x, p.y) < m.r) { hurtPlayerDot(m.dmg * dt); }
          if (m.t > m.dur + 3.5) m.done = true;
        }
        return;
      }
      if (m.t >= m.dur && !m.done) {
        m.done = true;
        L.fx.push({ k: m.kind === 'vine' || m.kind === 'crystal' || m.kind === 'powder' ? m.kind : 'erupt', x0: m.x, y0: m.y, life: m.kind === 'crystal' ? 1.2 : 0.6, max: m.kind === 'crystal' ? 1.2 : 0.6 });
        Sound.sfx(m.kind === 'vine' ? 'splat' : 'boom', false);
        if (m.team === 'ally') L.mons.forEach(function (e) { if (!e.dead && dist(m.x, m.y, e.x, e.y) < m.r + e.r * 0.5) damageMon(e, m.dmg); });
        else {
          if (dist(m.x, m.y, p.x, p.y) < m.r) { hurtPlayer(m.dmg); spark(p.x, p.y, 20, false); }
          L.allies.forEach(function (a) { if (!a.dead && dist(m.x, m.y, a.x, a.y) < m.r + a.r * 0.5) hurtAlly(a, m.dmg); });
        }
        var bl = L.map.occ[Math.floor(m.x) + ',' + Math.floor(m.y)]; if (bl) damageBuilding(bl, 60, false);
      }
    });
    L.marks = L.marks.filter(function (m) { return !m.done; });
    L.fx.forEach(function (f) { f.life -= dt; });
    L.fx = L.fx.filter(function (f) { return f.life > 0; });
  }
  function hurtPlayerDot(dmg) { // Gift-Schaden über Zeit (ohne Unverwundbarkeit)
    var p = L.p; if (p.dead || p.dance > 0) return;
    p.hp -= dmg * DIFF[save.opt.diff].dmg; p.calm = 0;
    if (Math.random() < 0.1) num(p.x, p.y, 50, 'GIFT', '#b0e040');
    if (p.hp <= 0) hurtPlayer(1);
  }

  function updateParticles(dt) {
    var ps = L.parts;
    for (var i = ps.length - 1; i >= 0; i--) {
      var q = ps[i];
      q.life -= dt;
      if (q.life <= 0 || q.z < -2) { ps.splice(i, 1); continue; }
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.vz -= q.g * dt;
      if (q.gr) { q.vx *= 1 - dt * 1.5; q.vy *= 1 - dt * 1.5; }
    }
    if (Math.random() < 0.5) {
      var bl = L.map.b[Math.floor(Math.random() * L.map.b.length)];
      if (bl && bl.dead && bl.burn > 0) smoke(bl.x, bl.y, 6, 1);
      else if (bl && !bl.dead && bl.spr.chimney && Math.random() < 0.5) L.parts.push({ x: bl.x, y: bl.y, z: 34, vx: rnd(0, 0.3), vy: rnd(-0.3, 0), vz: 10, life: 2.5, max: 2.5, c: '#5a5a50', g: -1, s: 3 });
    }
    L.map.b.forEach(function (b) {
      if (b.burn > 0) b.burn -= dt;
      if (b.flash > 0) b.flash -= dt;
      var c = b.col;
      if (c) {
        c.t += dt;
        var k = Math.min(1, c.t / c.dur);
        if (Math.random() < (Q() ? 0.9 : 0.35)) dust(b.x, b.y, 2, 1 + (c.tall > 40 ? 1 : 0), 0.8 + c.tall / 80);
        if (Math.random() < 0.5) L.parts.length < PCAP() && L.parts.push({ x: b.x + rnd(-0.4, 0.4), y: b.y + rnd(-0.4, 0.4), z: c.tall * (1 - k * k) * 0.9, vx: rnd(-0.6, 0.6), vy: rnd(-0.6, 0.6), vz: rnd(-5, 10), life: 1, max: 1, c: ['#7a746a', '#5a5650', '#9a948a'][Math.floor(Math.random() * 3)], g: 60, s: 2 });
        if (c.t >= c.dur) {
          b.col = null; b.spr = b.rub; b.tall = b.rub.tall; b.burn = 6;
          dust(b.x, b.y, 3, Q() ? 14 : 5, 1.2 + c.tall / 60);
          decal(b.x, b.y, 'scorch');
          L.shake = Math.max(L.shake, Math.min(0.5, c.tall / 150));
        }
      }
    });
    L.nums.forEach(function (n) { n.t -= dt; n.z += 22 * dt; });
    L.nums = L.nums.filter(function (n) { return n.t > 0; });
    L.items.forEach(function (it) { it.t -= dt; });
    L.items = L.items.filter(function (it) { return it.t > 0; });
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
    if (G.lvl < LAST) save.unlocked = Math.max(save.unlocked, G.lvl + 2);
    if (G.lvl === LAST) save.island = true;
    save.hi = Math.max(save.hi, G.score); store();
  }

  /* ================= Update ================= */
  function updatePlay(dt) {
    L.time += dt; L.hintT -= dt; L.hurtFlash -= dt; L.whiteFlash = (L.whiteFlash || 0) - dt;
    updatePlayer(dt);
    if (L.p.dead && L.p.deathT > 2.8) { G.state = 'over'; G.t = 0; Sound.play('over'); save.hi = Math.max(save.hi, G.score); store(); return; }
    // Begegnungen
    if (!L.mons.length) {
      if (L.encIdx < L.enc.length) {
        if (!L.warn) {
          L.encTimer -= dt;
          if (L.encTimer <= 0 || (L.encIdx === 0 && L.destroyed >= 18)) { L.warn = 3; Sound.sfx('alarm'); }
        } else { L.warn -= dt; if (L.warn <= 0) spawnEncounter(); }
      } else {
        G.state = 'clear'; G.t = 0; Sound.breath(false); Sound.play('win'); unlockNext(); return;
      }
    }
    // Verbündeter kommt nach kurzer Zeit dazu
    if (L.def.ally && !L.allyDone && L.time > 2.5) { L.allyDone = true; spawnAlly(L.def.ally); }
    L.mons.forEach(function (m) { updateMon(m, dt); });
    L.allies.forEach(function (m) { updateMon(m, dt); });
    L.allies = L.allies.filter(function (m) { return !(m.dead && m.deathT > 2.5); });
    // Monster voneinander trennen (Gegner und Verbündete)
    var all = L.mons.concat(L.allies);
    for (var i = 0; i < all.length; i++) for (var j = i + 1; j < all.length; j++) {
      var a = all[i], b = all[j], d = dist(a.x, a.y, b.x, b.y) || 0.01, mn = (a.r + b.r) * 0.8;
      if (d < mn && !inAir(a) && !inAir(b)) { var push = (mn - d) / 2, ux = (a.x - b.x) / d, uy = (a.y - b.y) / d; a.x += ux * push; a.y += uy * push; b.x -= ux * push; b.y -= uy * push; }
    }
    var before = L.mons.length;
    L.mons = L.mons.filter(function (m) { return !(m.dead && m.deathT > 3.2); });
    if (before && !L.mons.length) {
      if (L.encIdx < L.enc.length) { L.encTimer = 4; Sound.play(L.def.music); toast('ACHTUNG... DAS NÄCHSTE MONSTER NAHT!', '#ff5040'); }
    }
    updateUnits(dt);
    updateCars(dt);
    updatePeople(dt);
    updateProj(dt);
    updateParticles(dt);
    updateLlama(dt);
    updateMothra(dt);
    L.toasts.forEach(function (t) { t.t -= dt; });
    L.toasts = L.toasts.filter(function (t) { return t.t > 0; });
    var gp = gpos(L.p.x, L.p.y);
    L.camX += (gp[0] - L.camX) * Math.min(1, dt * 5);
    L.camY += (gp[1] - 30 - L.camY) * Math.min(1, dt * 5);
    // Kamera: Spielfeld plus etwas Kulisse
    var Bd = L.bounds, mx0 = Bd.left + W / 2 - 70, mx1 = Bd.right - W / 2 + 70, my0 = Bd.top + H / 2 - 110, my1 = Bd.bottom - H / 2 + 50;
    L.camX = mx0 > mx1 ? (mx0 + mx1) / 2 : Math.max(mx0, Math.min(mx1, L.camX));
    L.camY = my0 > my1 ? (my0 + my1) / 2 : Math.max(my0, Math.min(my1, L.camY));
    if (L.barrier) { L.barrier.t -= dt; if (L.barrier.t <= 0) L.barrier = null; }
    L.shake = Math.max(0, L.shake - dt);
  }

  /* ================= Zeichnen ================= */
  function viewSet(set, e) { return (e.view && e.view !== 'side' && set.v && set.v[e.view]) ? set.v[e.view] : set; }
  function mouthOf(e, head) {
    var vs = viewSet(e.set, e), mo = vs.mouths && head !== undefined ? vs.mouths[head % vs.mouths.length] : vs.mouth;
    mo = mo || { x: 0, y: -30 };
    var s = spos(e.x, e.y, 0);
    return [s[0] + mo.x * (e.face < 0 ? -1 : 1), s[1] + mo.y - (e.z || 0)];
  }
  function drawSprite(set, key, idx, e, x, y) {
    set = viewSet(set, e);
    var fr = idx === null ? set[key] : (set[key] ? set[key][idx] : null);
    if (!fr) fr = set.stand;
    var img = e.face < 0 ? fr.l : fr.r;
    var ax = e.face < 0 ? set.w - set.ax : set.ax;
    var z = e.z || 0, top = y - set.ay - z;
    var ga = ctx.globalAlpha;
    if (z < 0) {
      var vis = Math.floor(set.ay + z);
      if (vis <= 0) return;
      ctx.drawImage(img, 0, 0, set.w, vis, x - ax, top, set.w, vis);
    } else ctx.drawImage(img, x - ax, top);
    if (e.flash > 0 && ga === 1) {
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.85;
      if (z < 0) { var v2 = Math.floor(set.ay + z); if (v2 > 0) ctx.drawImage(img, 0, 0, set.w, v2, x - ax, top, set.w, v2); }
      else ctx.drawImage(img, x - ax, top);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = ga;
    }
  }
  function shadow(x, y, rx) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(x, y, rx, rx / 2, 0, 0, 6.283); ctx.fill();
  }

  function drawPlayer() {
    var p = L.p, s = spos(p.x, p.y, 0), set = p.set, key = 'stand', idx = null;
    if (p.breathing) key = 'breath';
    else if (p.charge && set.charge) { key = 'charge'; idx = Math.min(5, Math.floor(p.charge.t / Math.min(p.charge.dur, 0.6) * 6)); }
    else if (p.atk > 0) key = p.atkKind === 'tail' ? 'tail' : (p.atkT < 0.08 ? 'claw1' : 'claw2');
    else if (p.roarT > 0) key = 'roar';
    else if (p.moving) { key = 'walk'; idx = Math.floor(p.anim) % 4; }
    var solid = ctx.globalAlpha === 1;
    if (solid && p.breathing && p.view === 'back') drawBeam(); // Strahl hinter dem Körper
    if (p.inv > 0 && !p.charge && Math.floor(p.inv * 30) % 2 && solid) return;
    var ox = p.charge ? Math.round(Math.sin(L.time * 70) * (p.charge.kind === 'pulse' ? 1.5 : 0.8)) : 0;
    drawSprite(set, key, idx, p, s[0] + ox, s[1]);
    if (p.wade && solid && p.emerge <= 0) { ctx.strokeStyle = 'rgba(230,245,255,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(s[0], s[1], 16 + Math.sin(L.time * 6) * 2, 7, 0, 0, 6.283); ctx.stroke(); }
    // Kernpuls: ganzer Körper glüht zum Ende des Aufladens
    if (solid && p.charge && p.charge.kind === 'pulse' && p.charge.t > 0.6) {
      var vs = viewSet(set, p), fr = vs.breath, img = p.face < 0 ? fr.l : fr.r, ax = p.face < 0 ? vs.w - vs.ax : vs.ax;
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(0.9, (p.charge.t - 0.6) * 1.6) * (0.6 + 0.4 * Math.sin(L.time * 40));
      ctx.drawImage(img, s[0] + ox - ax, s[1] - vs.ay - p.z);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
  }
  var ORB = { eye: '#ff3a6a', red: '#ff2020', acid: '#c0e020', oxy: '#a020ff', grav: '#ffd040', prism: '#ff80ff', corona: '#8a6aff', elec: '#ffe040', laser: '#40c0ff' };
  function drawMon(m) {
    var s = spos(m.x, m.y, 0), set = m.set, key = 'walk', idx = Math.floor(m.anim) % 4;
    var A = m.act;
    var tele = A && A.t < A.a.w;
    if (A && (A.a.t === 'melee' || A.a.t === 'beam' || A.a.t === 'lob' || A.a.t === 'volley' || A.a.t === 'marks')) { key = 'attack'; idx = null; }
    if (A && A.a.t === 'charge' && tele) { key = 'attack'; idx = null; }
    if (m.def.cocoon) { key = Math.floor(L.time * 4) % 2 ? 'attack' : 'stand'; idx = null; }
    var ox = tele ? Math.round(Math.sin(L.time * 60)) : 0;
    var solid = ctx.globalAlpha === 1;
    // Nachbilder beim Sturmangriff
    if (solid && m.trail) {
      m.trail.forEach(function (tr, i) {
        var ts = spos(tr[0], tr[1], 0);
        ctx.globalAlpha = 0.28 - i * 0.06;
        drawSprite(set, key, idx, { face: m.face, view: m.view, z: tr[2], flash: 0 }, ts[0], ts[1]);
      });
      ctx.globalAlpha = 1;
    }
    // im Wasser waten Bodenmonster leicht ein
    var wd = 0;
    if (!inAir(m) && m.z >= 0 && !m.def.emerge && !m.dead && L.map.isWater(m.x, m.y)) wd = L.map.at(m.x, m.y) === T.DEEP ? 8 : 4;
    m.z -= wd;
    drawSprite(set, key, idx, m, s[0] + ox, s[1]);
    m.z += wd;
    if (wd && solid) { ctx.strokeStyle = 'rgba(230,245,255,0.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(s[0], s[1], m.r * 13 + Math.sin(L.time * 6) * 2, m.r * 6, 0, 0, 6.283); ctx.stroke(); }
    if (!solid) return;
    // glühender Kern (Biolante)
    if (set.core && !m.dead) {
      var cpx = s[0] + set.core.x * (m.face < 0 ? -1 : 1), cpy = s[1] + set.core.y - m.z, pr = (set.core.r || 16) + Math.sin(L.time * 2.5) * 3;
      ctx.globalCompositeOperation = 'lighter';
      var gcg = ctx.createRadialGradient(cpx, cpy, 0, cpx, cpy, pr);
      gcg.addColorStop(0, 'rgba(255,120,40,0.4)'); gcg.addColorStop(0.5, 'rgba(200,40,10,0.18)'); gcg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gcg; ctx.beginPath(); ctx.arc(cpx, cpy, pr, 0, 6.283); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    // Verbündete: grüne Markierung über dem Kopf
    if (isAlly(m) && !m.dead) {
      var vs0 = viewSet(set, m), hy0 = s[1] - vs0.ay - m.z - 8;
      ctx.fillStyle = '#40ffe0'; ctx.beginPath(); ctx.moveTo(s[0] - 4, hy0 - 5); ctx.lineTo(s[0] + 4, hy0 - 5); ctx.lineTo(s[0], hy0); ctx.fill();
    }
    // Energie sammelt sich am Maul/Auge, bevor ein Strahl oder Geschoss kommt
    if (tele && (A.a.t === 'beam' || A.a.t === 'volley' || A.a.t === 'lob')) {
      var k = A.t / A.a.w, col = A.a.t === 'beam' ? ORB[A.a.beam] || '#ffffff' : (A.a.t === 'lob' ? '#ff9a2a' : '#ffffff');
      var heads = A.a.heads || 1;
      ctx.globalCompositeOperation = 'lighter';
      for (var h = 0; h < heads; h++) {
        var mp = mouthOf(m, heads > 1 ? h : undefined), rr = 2 + k * 7 + Math.sin(L.time * 50) * 1.2;
        var g = ctx.createRadialGradient(mp[0], mp[1], 0, mp[0], mp[1], rr * 2);
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, col); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mp[0], mp[1], rr * 2, 0, 6.283); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    if (m.shield > 0) {
      ctx.strokeStyle = 'rgba(140,230,255,' + (0.5 + Math.sin(L.time * 20) * 0.3) + ')'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(s[0], s[1] - 34, 34, 40, 0, 0, 6.283); ctx.stroke();
    }
    if (tele && Math.floor(L.time * 10) % 2) text('!', s[0], s[1] - set.ay - m.z - 12, '#ff3030', 'center', 16);
    if (m.stun > 0) for (var i = 0; i < 3; i++) {
      var an = L.time * 5 + i * 2.1;
      ctx.fillStyle = '#ffe04a'; ctx.fillRect(s[0] + Math.cos(an) * 14, s[1] - set.ay - m.z + 4 + Math.sin(an) * 3, 2, 2);
    }
  }
  function drawUnit(u) {
    var s = spos(u.x, u.y, u.z || 0);
    if (u.kind === 'tank') ctx.drawImage(u.face < 0 ? SPR.tank.l : SPR.tank.r, s[0] - 9, s[1] - 9);
    else ctx.drawImage(u.face < 0 ? SPR.jet.l : SPR.jet.r, s[0] - 11, s[1] - 6);
  }
  function drawCar(c) {
    var ox = c.dx ? 0 : (c.dy > 0 ? -0.22 : 0.22), oy = c.dy ? 0 : (c.dx > 0 ? 0.22 : -0.22);
    var s = spos(c.x + ox, c.y + oy, 0);
    ctx.drawImage(SPR.cars[c.col][c.dx ? 0 : 1], s[0] - 11, s[1] - 10);
  }
  function drawPerson(h) {
    var s = spos(h.x, h.y, 0), step = Math.floor(h.anim) % 2;
    ctx.fillStyle = '#202020'; ctx.fillRect(s[0] - 1 + step, s[1] - 2, 1, 2); ctx.fillRect(s[0] - step, s[1] - 2, 1, 2);
    ctx.fillStyle = h.col; ctx.fillRect(s[0] - 1, s[1] - 5, 2, 3);
    ctx.fillStyle = '#f0c8a0'; ctx.fillRect(s[0] - 1, s[1] - 7, 2, 2);
    if (h.flee && Math.floor(L.time * 6) % 2) { ctx.fillStyle = '#f0c8a0'; ctx.fillRect(s[0] - 2, s[1] - 7, 1, 1); ctx.fillRect(s[0] + 1, s[1] - 7, 1, 1); }
  }
  function drawLlama() {
    var l = L.llama, s = spos(l.x, l.y, 0);
    ctx.drawImage(l.face < 0 ? SPR.llama.l : SPR.llama.r, s[0] - 7, s[1] - 13);
  }
  function drawItem(it) {
    if (it.t < 3 && Math.floor(it.t * 8) % 2) return;
    var s = spos(it.x, it.y, 0), bob = Math.round(Math.sin(L.time * 5) * 2);
    ctx.drawImage(SPR.barrel, s[0] - 5, s[1] - 13 + bob);
  }
  function drawProj(q) {
    var s = spos(q.x, q.y, q.z);
    if (q.kind === 'shell') { ctx.fillStyle = '#ffe04a'; ctx.fillRect(s[0] - 1, s[1] - 1, 2, 2); }
    else if (q.kind === 'missile') { ctx.drawImage((q.vx - q.vy) > 0 ? SPR.missile.r : SPR.missile.l, s[0] - 4, s[1] - 2); }
    else if (q.kind === 'silk') { ctx.strokeStyle = '#f4f0e0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(s[0] - 4, s[1] + 1); ctx.lineTo(s[0], s[1] - 1); ctx.lineTo(s[0] + 4, s[1] + 1); ctx.stroke(); }
    else if (q.kind === 'sap' || q.kind === 'sludge' || q.kind === 'water' || q.kind === 'napalm') {
      var c1 = { sap: '#ff9a2a', sludge: '#4a5a3a', water: '#3a8ae0', napalm: '#ff4a1a' }[q.kind], c2 = { sap: '#ffe04a', sludge: '#8a9a6a', water: '#e0f4ff', napalm: '#ffe040' }[q.kind];
      ctx.fillStyle = c1; ctx.fillRect(s[0] - 3, s[1] - 3, 6, 6); ctx.fillStyle = c2; ctx.fillRect(s[0] - 1, s[1] - 2, 2, 2);
      var g = spos(q.x, q.y, 0); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(g[0] - 3, g[1] - 1, 6, 2);
    }
    else if (q.kind === 'web') { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(s[0], s[1], 4, 0, 6.283); ctx.moveTo(s[0] - 4, s[1]); ctx.lineTo(s[0] + 4, s[1]); ctx.moveTo(s[0], s[1] - 4); ctx.lineTo(s[0], s[1] + 4); ctx.stroke(); }
    else if (q.kind === 'needle') { ctx.strokeStyle = '#e8e0c0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(s[0] - 3, s[1]); ctx.lineTo(s[0] + 3, s[1] - 1); ctx.stroke(); }
    else if (q.kind === 'ring') { ctx.strokeStyle = '#f4f4f4'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(s[0], s[1], 5, 3, 0, 0, 6.283); ctx.stroke(); }
  }

  function drawCollapse(b, sp) {
    var c = b.col, k = Math.min(1, c.t / c.dur), spr = Sprites.damaged(c.orig);
    var sink = k * k * c.tall * 0.97, lean = c.lean * k * k * 0.5;
    ctx.save();
    ctx.beginPath(); ctx.rect(sp[0] - 220, sp[1] - 400, 440, 400 + (spr.a || 12) * 0.5 + 1); ctx.clip();
    ctx.translate(sp[0] + (1 - k) * rnd(-1.5, 1.5), sp[1]);
    ctx.transform(1, 0, -lean, 1, 0, 0);
    ctx.drawImage(spr.img, -spr.ax, -spr.ay + sink);
    ctx.restore();
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
    var p = L.p, s;
    L.marks.forEach(function (mk) {
      s = spos(mk.x, mk.y, 0);
      if (mk.kind === 'smog' && mk.t >= mk.dur) { ctx.fillStyle = 'rgba(80,90,50,.45)'; ctx.beginPath(); ctx.ellipse(s[0], s[1], 16 * mk.r, 8 * mk.r, 0, 0, 6.283); ctx.fill(); return; }
      ctx.strokeStyle = Math.floor(mk.t * 12) % 2 ? '#ff3030' : '#ffe04a'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(s[0], s[1], 16 * mk.r, 8 * mk.r, 0, 0, 6.283); ctx.stroke();
    });
    if (!p.dead && p.z > -15) { s = spos(p.x, p.y, 0); shadow(s[0], s[1], G.mini ? 10 : 18); }
    L.allies.forEach(function (mo) { if (mo.z > -5) { s = spos(mo.x, mo.y, 0); shadow(s[0], s[1], mo.r * 13); } });
    L.mons.forEach(function (mo) {
      if (mo.z > -5) { s = spos(mo.x, mo.y, 0); shadow(s[0], s[1], mo.r * 13); }
      var A = mo.act;
      if (A && A.t < A.a.w && !mo.dead) {
        ctx.strokeStyle = 'rgba(255,40,40,' + (0.4 + 0.4 * Math.sin(L.time * 30)) + ')'; ctx.lineWidth = 1;
        s = spos(mo.x, mo.y, 0); ctx.beginPath(); ctx.ellipse(s[0], s[1], mo.r * 16 + 4, mo.r * 8 + 2, 0, 0, 6.283); ctx.stroke();
        if (A.a.t === 'charge') {
          var e = spos(mo.x + A.dx * 7, mo.y + A.dy * 7, 0);
          ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(e[0], e[1]); ctx.stroke(); ctx.setLineDash([]);
        }
        if (A.a.t === 'beam' && Math.floor(A.t * 16) % 2) {
          var t2 = spos(mo.x + (A.tx - mo.x) * 1.7, mo.y + (A.ty - mo.y) * 1.7, 0);
          ctx.strokeStyle = 'rgba(255,60,60,.5)'; ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(t2[0], t2[1]); ctx.stroke();
        }
      }
    });
    L.units.forEach(function (u) { if (u.kind === 'jet') { s = spos(u.x, u.y, 0); shadow(s[0], s[1], 5); } });
    if (L.mothra) { s = spos(L.mothra.x, L.mothra.y, 0); shadow(s[0], s[1], 12); }

    var dyn = [{ d: p.x + p.y, f: drawPlayer }];
    L.mons.concat(L.allies).forEach(function (mo) { dyn.push({ d: mo.x + mo.y + (inAir(mo) ? 3 : 0), f: drawMon, e: mo }); });
    L.units.forEach(function (u) { dyn.push({ d: u.x + u.y + (u.kind === 'jet' ? 50 : 0), f: drawUnit, e: u }); });
    L.cars.forEach(function (c) { if (onScreen(c.x, c.y, 20)) dyn.push({ d: c.x + c.y, f: drawCar, e: c }); });
    L.people.forEach(function (h) { if (onScreen(h.x, h.y, 10)) dyn.push({ d: h.x + h.y, f: drawPerson, e: h }); });
    L.items.forEach(function (it) { dyn.push({ d: it.x + it.y, f: drawItem, e: it }); });
    if (L.llama.alive) dyn.push({ d: L.llama.x + L.llama.y, f: drawLlama });
    L.proj.forEach(function (q) { dyn.push({ d: q.x + q.y + 0.5, f: drawProj, e: q }); });
    dyn.sort(function (a, c) { return a.d - c.d; });

    var ps = spos(p.x, p.y, 0), pd = p.x + p.y;
    var foc = [[ps[0] - 24, ps[1] - 88 - p.z, 52, 88, pd]];
    L.mons.concat(L.allies).forEach(function (mo) { if (!mo.dead) { var ms = spos(mo.x, mo.y, mo.z); foc.push([ms[0] - mo.set.ax * 0.8, ms[1] - mo.set.ay, mo.set.w * 0.8, mo.set.ay, mo.x + mo.y]); } });
    var bl = m.b, di = 0;
    for (var i = 0; i < bl.length; i++) {
      var bb = bl[i], bd = bb.x + bb.y;
      while (di < dyn.length && dyn[di].d <= bd) { dyn[di].f(dyn[di].e); di++; }
      var sp = spos(bb.x, bb.y, 0), sprr = bb.spr;
      if (sp[0] < -70 || sp[0] > W + 70 || sp[1] < -12 || sp[1] - sprr.ay > H + 4) continue;
      if (bb.col) { drawCollapse(bb, sp); continue; }
      if (!bb.dead && bb.hp < bb.max * 0.55 && bb.hp < 1e8) sprr = Sprites.damaged(bb.spr);
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
    // Röntgen-Silhouette
    if (Q()) {
      ctx.globalAlpha = 0.3;
      if (!p.dead) drawPlayer();
      L.mons.concat(L.allies).forEach(function (mo) { if (!mo.dead) drawMon(mo); });
      ctx.globalAlpha = 1;
    }

    drawFx();
    if (L.mothra) { var mo = L.mothra; s = spos(mo.x, mo.y, mo.z + Math.sin(L.time * 4) * 3); var ms2 = SPR.mothraImago, mf = ms2.walk[Math.floor(L.time * 10) % 4].r; ctx.drawImage(mf, s[0] - ms2.ax, s[1] - ms2.ay); }
    L.parts.forEach(function (q) {
      var s2 = spos(q.x, q.y, q.z), sz = q.gr ? q.s + (q.max - q.life) * q.gr : q.s;
      ctx.globalAlpha = Math.min(q.gr ? 0.75 : 1, q.life / q.max * 1.5);
      ctx.fillStyle = q.c; ctx.fillRect(s2[0] - (sz >> 1), s2[1] - (sz >> 1), sz, sz);
    });
    ctx.globalAlpha = 1;
    L.nums.forEach(function (n) { var s3 = spos(n.x, n.y, n.z); ctx.globalAlpha = Math.min(1, n.t * 2); text(n.s, s3[0], s3[1], n.c, 'center'); });
    ctx.globalAlpha = 1;
    if (L.gen.smog) { ctx.fillStyle = 'rgba(120,110,70,0.12)'; ctx.fillRect(0, 0, W, H); }
    if (L.gen.red) { ctx.fillStyle = 'rgba(255,40,20,0.06)'; ctx.fillRect(0, 0, W, H); }
    if (L.snow.length) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      L.snow.forEach(function (f) {
        f[1] += f[2] * 0.6; f[0] += Math.sin(L.time * 1.5 + f[2] * 9) * 0.3 - 0.15;
        if (f[1] > H) { f[1] = -2; f[0] = Math.random() * W; }
        if (f[0] < 0) f[0] += W;
        ctx.fillRect(f[0], f[1], f[2] > 1.1 ? 2 : 1, f[2] > 1.1 ? 2 : 1);
      });
      ctx.fillStyle = 'rgba(200,220,255,0.06)'; ctx.fillRect(0, 0, W, H);
    }
    if (L.hurtFlash > 0) { ctx.fillStyle = 'rgba(255,0,0,' + (L.hurtFlash * 1.4) + ')'; ctx.fillRect(0, 0, W, H); }
    if (L.whiteFlash > 0) { ctx.fillStyle = 'rgba(210,245,255,' + (L.whiteFlash * 2) + ')'; ctx.fillRect(0, 0, W, H); }
  }

  function beamLine(pts, cols, widths) {
    for (var k = 0; k < cols.length; k++) {
      ctx.strokeStyle = cols[k]; ctx.lineWidth = widths[k];
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    }
  }
  var BEAMCOL = {
    eye: ['rgba(255,40,100,0.3)', '#ff4a7a', '#ffe04a', '#ffffff'], red: ['rgba(255,20,20,0.3)', '#ff3030', '#ff9a9a', '#ffffff'],
    acid: ['rgba(160,220,20,0.3)', '#b0e020', '#f0ff80', '#ffffff'], oxy: ['rgba(150,20,255,0.35)', '#a030ff', '#e090ff', '#ffffff'],
    corona: ['rgba(110,80,255,0.35)', '#7a5aff', '#b8e8ff', '#ffffff'], laser: ['rgba(40,150,255,0.3)', '#40a0ff', '#c0f0ff', '#ffffff'],
    prism: null, grav: ['rgba(255,200,40,0.35)', '#ffd040', '#fff6c0'], elec: ['rgba(255,240,80,0.35)', '#ffe850', '#ffffff']
  };
  function radial(x, y, r, c0, c1) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, c0); g.addColorStop(0.35, c1); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
  }
  // breiter, leuchtender Strahl aus mehreren Schichten (Breite nimmt zum Ende zu)
  function glowBeam(sx, sy, ex, ey, cols, w0, w1, hue) {
    var dx = ex - sx, dy = ey - sy, len = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / len, ny = dx / len, N = 12;
    var mult = [2.6, 1.5, 0.8, 0.3];
    for (var li = 0; li < 4; li++) {
      for (var i = 0; i < N; i++) {
        var t0 = i / N, t1 = (i + 1) / N, w = (w0 + (w1 - w0) * t1) * mult[li] + Math.sin(L.time * 40 + i) * 0.6;
        var j = rnd(-1, 1) * (li < 2 ? 1.2 : 0.4);
        ctx.strokeStyle = hue ? 'hsla(' + ((L.time * 400 + i * 30) % 360) + ',100%,' + (li === 3 ? 95 : 65) + '%,' + (li === 0 ? 0.3 : 1) + ')' : cols[li];
        ctx.lineWidth = Math.max(1, w);
        ctx.beginPath(); ctx.moveTo(sx + dx * t0 + nx * j, sy + dy * t0 + ny * j); ctx.lineTo(sx + dx * t1 + nx * j, sy + dy * t1 + ny * j); ctx.stroke();
      }
    }
    return [nx, ny, dx, dy];
  }
  // Blitz mit Verästelungen
  function bolt(sx, sy, ex, ey, cols, zig) {
    var pts = [[sx, sy]], n = 10;
    for (var i = 1; i < n; i++) { var t = i / n; pts.push([sx + (ex - sx) * t + rnd(-zig, zig), sy + (ey - sy) * t + rnd(-zig, zig)]); }
    pts.push([ex, ey]);
    beamLine(pts, cols, [7, 3, 1.2]);
    for (var b = 0; b < 3; b++) {
      var k = 2 + Math.floor(Math.random() * (n - 3)), p0 = pts[k], bx = p0[0] + rnd(-14, 14), by = p0[1] + rnd(-14, 14);
      beamLine([p0, [(p0[0] + bx) / 2 + rnd(-3, 3), (p0[1] + by) / 2 + rnd(-3, 3)], [bx, by]], [cols[1], cols[2]], [2, 1]);
    }
  }
  // Atomstrahl
  function drawBeam() {
    var p = L.p; if (!p.breathing || !p.aim) return;
    var m0 = mouthOf(p), sx = m0[0], sy = m0[1];
    var e = spos(p.x + p.aim[0] * 7.5, p.y + p.aim[1] * 7.5, 14), T = L.time;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    var v = glowBeam(sx, sy, e[0], e[1], ['rgba(40,110,255,0.25)', 'rgba(70,180,255,0.55)', 'rgba(170,240,255,0.9)', '#ffffff'], 3, 9);
    for (var h = 0; h < 2; h++) {
      ctx.fillStyle = h ? '#c8fbff' : '#5ac8ff';
      for (var i = 0; i < 40; i++) {
        var t = i / 40, ph = T * 26 - t * 20 + h * Math.PI, amp = 3 + t * 9;
        ctx.fillRect(sx + v[2] * t + v[0] * Math.sin(ph) * amp - 1, sy + v[3] * t + v[1] * Math.sin(ph) * amp - 1, 2, 2);
      }
    }
    radial(sx, sy, 11 + Math.sin(T * 60) * 2.5, '#ffffff', 'rgba(120,220,255,0.8)');
    radial(e[0], e[1], 18 + Math.sin(T * 45) * 4, '#ffffff', 'rgba(80,170,255,0.7)');
    var g = spos(p.x + p.aim[0] * 7.5, p.y + p.aim[1] * 7.5, 0);
    ctx.strokeStyle = 'rgba(150,230,255,0.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(g[0], g[1], 14 + (T * 60 % 10), 6 + (T * 60 % 10) / 2, 0, 0, 6.283); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(60,140,255,0.07)'; ctx.fillRect(0, 0, W, H);
  }
  function drawFx() {
    var p = L.p;
    ctx.lineCap = 'round';
    // unsichtbare Wand schimmert kurz auf
    if (L.barrier) {
      var B = L.barrier, al = Math.min(1, B.t * 2.2), segs = [];
      if (B.ex !== null) segs.push([[B.ex, B.y - 3], [B.ex, B.y + 3]]);
      if (B.ey !== null) segs.push([[B.x - 3, B.ey], [B.x + 3, B.ey]]);
      segs.forEach(function (sg) {
        var a = spos(sg[0][0], sg[0][1], 0), b = spos(sg[1][0], sg[1][1], 0);
        var gr = ctx.createLinearGradient(0, a[1] - 70, 0, a[1]);
        gr.addColorStop(0, 'rgba(140,220,255,0)'); gr.addColorStop(1, 'rgba(140,220,255,' + (0.35 * al) + ')');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(b[0], b[1] - 70); ctx.lineTo(a[0], a[1] - 70); ctx.fill();
        ctx.strokeStyle = 'rgba(210,245,255,' + (0.5 * al) + ')'; ctx.lineWidth = 1;
        for (var k = 0; k <= 8; k++) {
          var t = k / 8, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 40 - Math.sin(L.time * 12 + k) * 12); ctx.stroke();
        }
      });
    }
    if (p.view !== 'back') drawBeam();
    L.fx.forEach(function (f) {
      var k = f.life / f.max;
      if (f.k === 'beam') {
        var m = f.src, mp = mouthOf(m, f.head), hx = mp[0], hy = mp[1];
        var ge = spos(f.x1, f.y1, 4), cols = BEAMCOL[f.style];
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, k * 2.5); ctx.lineCap = 'round';
        if (f.style === 'grav' || f.style === 'elec') bolt(hx, hy, ge[0], ge[1], cols, f.style === 'grav' ? 7 : 5);
        else {
          var vv = glowBeam(hx, hy, ge[0], ge[1], cols || [], 2, 5, f.style === 'prism');
          if (f.style === 'corona') {
            ctx.fillStyle = '#d0b0ff';
            for (var i = 0; i < 30; i++) { var t = i / 30, ph = L.time * 22 - t * 16; ctx.fillRect(hx + vv[2] * t + vv[0] * Math.sin(ph) * 7 - 1, hy + vv[3] * t + vv[1] * Math.sin(ph) * 7 - 1, 2, 2); }
          }
        }
        radial(hx, hy, 9, '#ffffff', ORB[f.style] || '#ffffff');
        radial(ge[0], ge[1], 14, '#ffffff', ORB[f.style] || '#ffffff');
        ctx.restore();
      } else if (f.k === 'crystal') {
        var cs = spos(f.x0, f.y0, 0), ch = Math.sin(Math.min(1, (1 - k) * 2) * Math.PI / 2) * 30 * (k > 0.3 ? 1 : k / 0.3);
        [[-6, 0.7], [0, 1], [6, 0.8], [-3, 0.5], [4, 0.55]].forEach(function (c, i) {
          var hh = ch * c[1];
          ctx.fillStyle = i % 2 ? '#c8a0ff' : '#8ae0ff';
          ctx.beginPath(); ctx.moveTo(cs[0] + c[0] - 3, cs[1]); ctx.lineTo(cs[0] + c[0], cs[1] - hh); ctx.lineTo(cs[0] + c[0] + 3, cs[1]); ctx.fill();
          ctx.fillStyle = '#ffffff'; ctx.fillRect(cs[0] + c[0], cs[1] - hh + 2, 1, hh * 0.5);
        });
      } else if (f.k === 'powder') {
        var pw = spos(f.x0, f.y0, 0);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        radial(pw[0], pw[1] - 8, 26 * (1.2 - k * 0.5), 'rgba(255,240,160,' + k + ')', 'rgba(255,200,60,' + k * 0.5 + ')');
        ctx.restore();
      } else if (f.k === 'vine' || f.k === 'erupt') {
        var vs = spos(f.x0, f.y0, 0), hgt = Math.sin((1 - k) * Math.PI) * 28;
        for (var v = -2; v <= 2; v++) {
          ctx.strokeStyle = f.k === 'vine' ? (v % 2 ? '#2e6a2a' : '#5aa83a') : (v % 2 ? '#a020ff' : '#e080ff'); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(vs[0] + v * 5, vs[1] + Math.abs(v)); ctx.lineTo(vs[0] + v * 3, vs[1] - hgt + Math.abs(v) * 4); ctx.stroke();
        }
      } else if (f.k === 'spark') {
        var ss = spos(f.x0, f.y0, f.z), r = (f.big ? 14 : 9) * (1.2 - k * 0.6);
        ctx.fillStyle = 'rgba(255,255,255,' + k + ')';
        ctx.beginPath();
        for (var a = 0; a < 16; a++) { var rr = a % 2 ? r * 0.35 : r; var an = a / 16 * 6.283 + f.life * 3; ctx.lineTo(ss[0] + Math.cos(an) * rr, ss[1] + Math.sin(an) * rr * 0.8); }
        ctx.fill();
        ctx.fillStyle = 'rgba(255,224,74,' + k + ')'; ctx.fillRect(ss[0] - 2, ss[1] - 2, 4, 4);
      } else if (f.k === 'pulse') {
        var ps2 = spos(f.x0, f.y0, 0), rad = (1 - k) * 110 + 10;
        ctx.globalAlpha = k * 0.35; ctx.fillStyle = '#9ef4ff';
        ctx.beginPath(); ctx.ellipse(ps2[0], ps2[1], rad, rad / 2, 0, 0, 6.283); ctx.fill();
        ctx.globalAlpha = k; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(ps2[0], ps2[1], rad, rad / 2, 0, 0, 6.283); ctx.stroke();
        ctx.strokeStyle = '#48c4ff'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(ps2[0], ps2[1] - 30, rad * 0.6, rad * 0.9, 0, 0, 6.283); ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (f.k === 'swoosh' || f.k === 'spin') {
        var sw = spos(f.x0, f.y0, f.z), prog = 1 - k;
        ctx.strokeStyle = f.col; ctx.globalAlpha = k;
        if (f.k === 'spin') {
          ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(sw[0], sw[1] + 16, 46, 20, 0, prog * 6.283 - 2.5, prog * 6.283); ctx.stroke();
          ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(sw[0], sw[1] + 16, 40, 16, 0, prog * 6.283 - 2, prog * 6.283); ctx.stroke();
        } else {
          for (var q = 0; q < 3; q++) {
            ctx.lineWidth = 2 - q * 0.5;
            ctx.beginPath(); ctx.arc(sw[0] - f.dir * 4, sw[1] - 6 + q * 5, 14 + q * 2, f.dir > 0 ? -1.2 + prog : 1.9 - prog, f.dir > 0 ? 0.4 + prog : 3.5 - prog); ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
      }
    });
  }

  function bar(x, y, w, h, v, col, bg) {
    ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = bg || '#3a1a1a'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = col; ctx.fillRect(x, y, Math.max(0, Math.round(w * v)), h);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x, y, Math.max(0, Math.round(w * v)), 1);
  }
  function drawHUD() {
    var p = L.p;
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(4, 4, 124, 38);
    text(G.mini ? 'MINILLA' : 'GODZILLA', 8, 7, '#7aff7a');
    if (p.calm > 3 && p.hp < 100 && Math.floor(L.time * 3) % 2) text('+', 118, 7, '#7aff7a');
    bar(8, 18, 116, 5, p.hp / 100, p.hp < 30 ? '#ff4040' : '#5ad850');
    bar(8, 26, 116, 4, p.en / 100, p.en > 12 ? '#4ac0ff' : '#2a4a6a', '#101a2a');
    var full = p.rage >= 100;
    bar(8, 33, 116, 4, p.rage / 100, full ? (Math.floor(L.time * 8) % 2 ? '#ffffff' : '#ff6a1a') : '#d8501a', '#2a1008');
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(W - 150, 4, 146, 34);
    text('PUNKTE ' + ('0000000' + G.score).slice(-7), W - 8, 7, '#fff', 'right');
    text('ZERSTÖRT ' + L.destroyed, W - 8, 19, '#ffcc6a', 'right');
    // Pause-Knopf (anklickbar)
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(W / 2 - 12, 3, 24, 16);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.strokeRect(W / 2 - 11.5, 3.5, 23, 15);
    ctx.fillStyle = '#fff'; ctx.fillRect(W / 2 - 5, 7, 3, 8); ctx.fillRect(W / 2 + 2, 7, 3, 8);
    // Minikarte
    var mx = W - 97, my = 41;
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(mx - 2, my - 2, 96, 52);
    ctx.globalAlpha = 0.85; ctx.drawImage(L.mini, mx, my); ctx.globalAlpha = 1;
    var Bd = L.bounds, kx = 92 / (Bd.right - Bd.left), ky = 48 / (Bd.bottom - Bd.top);
    function md(x, y, c, s) { var g = gpos(x, y); ctx.fillStyle = c; ctx.fillRect(Math.round(mx + (g[0] - Bd.left) * kx - s / 2), Math.round(my + (g[1] - Bd.top) * ky - s / 2), s, s); }
    ctx.save(); ctx.beginPath(); ctx.rect(mx, my, 92, 48); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(mx + (L.camX - W / 2 - Bd.left) * kx) + 0.5, Math.round(my + (L.camY - H / 2 - Bd.top) * ky) + 0.5, Math.round(W * kx), Math.round(H * ky));
    ctx.restore();
    L.allies.forEach(function (m) { if (!m.dead) md(m.x, m.y, '#40ffe0', 4); });
    L.units.forEach(function (u) { if (u.kind === 'tank') md(u.x, u.y, '#c8c8a0', 1); });
    L.items.forEach(function (it) { md(it.x, it.y, '#ffe040', 2); });
    L.mons.forEach(function (m) { if (!m.dead) md(m.x, m.y, Math.floor(L.time * 4) % 2 ? '#ff3030' : '#ff9090', 4); });
    md(p.x, p.y, '#5aff50', 3);
    var hy = 46;
    if (full && Math.floor(L.time * 3) % 2) { text('R = KERNPULS!', 8, hy, '#9ef4ff'); hy += 10; }
    if (p.roarCd > 0) { text('BRÜLLEN ' + Math.ceil(p.roarCd), 8, hy, '#aaa'); hy += 10; }
    if (p.comboT > 0 && p.combo > 0) { text('KOMBO ' + (p.combo + 1) + (p.combo === 1 ? ' > SCHWANZ!' : ''), 8, hy, '#ffe04a'); hy += 10; }
    L.allies.forEach(function (a, i) {
      if (a.dead) return;
      var y = H - 46 - i * 22;
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(4, y - 2, 124, 20);
      text('MIT DIR: ' + a.def.name.replace(' (LARVE)', ''), 8, y, '#40ffe0');
      bar(8, y + 11, 116, 4, a.hp / a.max, '#40e0c0', '#0a2a24');
    });
    var alive = L.mons.filter(function (m) { return !m.dead || m.deathT < 1; });
    alive.forEach(function (m, i) {
      var y = H - 24 - (alive.length - 1 - i) * 22;
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(W / 2 - 110, y - 2, 220, 21);
      text((m.boss ? 'BOSS: ' : '') + m.def.name, W / 2, y, m.boss ? '#ff6a5a' : '#ffb070', 'center');
      bar(W / 2 - 100, y + 11, 200, 5, m.hp / m.max, m.boss ? '#ff4040' : '#ff9a40');
    });
    if (L.warn > 0 && Math.floor(L.warn * 4) % 2) {
      var boss = L.encIdx === L.enc.length - 1;
      ctx.fillStyle = boss ? 'rgba(160,0,0,.75)' : 'rgba(140,80,0,.7)'; ctx.fillRect(0, H / 2 - 22, W, 34);
      text(boss ? '!! BOSS-ALARM !!' : '!! WARNUNG !!', W / 2, H / 2 - 18, '#fff', 'center', 16);
      text(L.enc[L.encIdx].map(function (t) { return MON[t].name; }).join(' & ') + ' NÄHERT SICH', W / 2, H / 2 + 2, '#ffe04a', 'center');
    }
    var ty = 46;
    L.toasts.forEach(function (t) { ctx.globalAlpha = Math.min(1, t.t * 2); text(t.s, W / 2, ty, t.c, 'center'); ty += 12; });
    ctx.globalAlpha = 1;
    if (L.hintT > 0 && !L.mons.length) {
      ctx.globalAlpha = Math.min(1, L.hintT);
      text('PFEILE LAUFEN  J KOMBO  K STRAHL  L BRÜLLEN', W / 2, H - 14, '#ddd', 'center');
      ctx.globalAlpha = 1;
    }
    if (!L.mons.length && L.encIdx === 0 && !L.warn) text('ZERSTÖRE DIE STADT!', 8, hy, '#ffcc6a');
    // Encounter-Fortschritt
    for (var e = 0; e < L.enc.length; e++) {
      ctx.fillStyle = e < L.encIdx ? (L.mons.length && e === L.encIdx - 1 ? '#ff5040' : '#5ad850') : '#444';
      ctx.fillRect(W - 146 + e * 9, 31, 7, 3);
    }
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
    ctx.fillStyle = '#e8e0c0'; ctx.beginPath(); ctx.arc(400, 46, 18, 0, 6.283); ctx.fill();
    var set = G.mini ? SPR.minilla : SPR.godzilla, fr = Math.floor(G.t * 1.5) % 3 === 2 ? set.roar.r : set.stand.r;
    var sc = G.mini ? 3 : 1.5;
    ctx.drawImage(fr, G.mini ? 250 : 170, H - 10 - set.h * sc, set.w * sc, set.h * sc);
    ctx.drawImage(skyline, 0, H - 90);
    ctx.fillStyle = '#0a0e18'; ctx.fillRect(0, H - 8, W, 8);
    var ly = 22 + Math.sin(G.t * 2) * 2;
    ctx.font = '32px ' + FONT; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#000'; ctx.fillText('GODZILLA', 22, ly + 3);
    ctx.fillStyle = '#8a1010'; ctx.fillText('GODZILLA', 21, ly + 1);
    ctx.fillStyle = '#ff4a2a'; ctx.fillText('GODZILLA', 20, ly);
    text('KAIJU RAMPAGE 3000', 22, ly + 40, '#8fe8ff', 'left', 8);
    var items = menuItems();
    items.forEach(function (it, i) { var sel = i === G.menu; text((sel ? '> ' : '  ') + it.label, 30, 110 + i * 16, sel ? '#ffe04a' : '#bbb'); });
    if (Math.floor(G.t * 2) % 2) text('ENTER DRÜCKEN', 30, 110 + items.length * 16 + 8, '#fff');
    text('HIGHSCORE ' + save.hi, 30, H - 22, '#888');
    if (G.msgT > 0) text(G.msg, W / 2, 92, '#ff8ad0', 'center');
  }
  function menuItems() {
    var it = [{ label: 'SPIEL STARTEN', a: function () { G.score = 0; startLevel(0); } }];
    if (save.unlocked > 1 || save.island) it.push({ label: 'LEVEL WÄHLEN', a: function () { G.state = 'select'; G.sel = 0; } });
    it.push({ label: 'OPTIONEN', a: function () { G.back = null; G.state = 'options'; G.osel = 0; } });
    it.push({ label: 'STEUERUNG', a: function () { G.back = null; G.state = 'help'; } });
    return it;
  }
  var OPTS = [
    { n: 'MUSIK', get: function () { return save.opt.mus * 10 + '%'; }, ch: function (d) { save.opt.mus = Math.max(0, Math.min(10, save.opt.mus + d)); } },
    { n: 'EFFEKTE', get: function () { return save.opt.sfx * 10 + '%'; }, ch: function (d) { save.opt.sfx = Math.max(0, Math.min(10, save.opt.sfx + d)); } },
    { n: 'GRAFIK', get: function () { return save.opt.q ? 'HOCH' : 'NIEDRIG (ALTE PCS)'; }, ch: function () { save.opt.q = save.opt.q ? 0 : 1; } },
    { n: 'SCHWIERIGKEIT', get: function () { return DIFF[save.opt.diff].n; }, ch: function (d) { save.opt.diff = (save.opt.diff + d + 3) % 3; } }
  ];
  var PMENU = [
    { label: 'WEITER', a: function () { G.state = 'play'; G.back = null; } },
    { label: 'OPTIONEN', a: function () { G.back = 'pause'; G.state = 'options'; G.osel = 0; } },
    { label: 'STEUERUNG', a: function () { G.back = 'pause'; G.state = 'help'; } },
    { label: 'LEVEL NEU STARTEN', a: function () { G.back = null; G.score = G.levelStartScore; startLevel(G.lvl); } },
    { label: 'ZUM TITEL', a: function () { G.back = null; G.state = 'title'; L = null; } }
  ];
  function pauseGame() {
    if (G.state !== 'play') return;
    G.state = 'pause'; G.psel = 0;
    Sound.breath(false);
    if (L) { L.p.breathing = false; if (L.p.charge && L.p.charge.kind === 'breath') L.p.charge = null; }
  }
  // Maus: Pause-Knopf im HUD und Klick auf Menüeinträge
  cv.addEventListener('mousedown', function (e) {
    Sound.init();
    var rc = cv.getBoundingClientRect(), x = (e.clientX - rc.left) * W / rc.width, y = (e.clientY - rc.top) * H / rc.height;
    if (G.state === 'play' && x > W / 2 - 14 && x < W / 2 + 14 && y < 22) G.clickPause = true;
    else if (G.state === 'pause') {
      for (var i = 0; i < PMENU.length; i++) if (y > 86 + i * 20 && y < 104 + i * 20 && x > W / 2 - 100 && x < W / 2 + 110) G.clickSel = i;
    }
  });
  // automatisch pausieren, wenn das Fenster in den Hintergrund geht
  window.addEventListener('blur', pauseGame);
  document.addEventListener('visibilitychange', function () { if (document.hidden) pauseGame(); });
  function applyOpts() { Sound.setVol(save.opt.mus / 10, save.opt.sfx / 10); store(); }
  function drawOptions() {
    ctx.fillStyle = '#0a0e1e'; ctx.fillRect(0, 0, W, H);
    text('OPTIONEN', W / 2, 20, '#ffe04a', 'center', 16);
    OPTS.forEach(function (o, i) {
      var sel = i === G.osel;
      text((sel ? '> ' : '  ') + o.n, 60, 70 + i * 26, sel ? '#fff' : '#999');
      text('< ' + o.get() + ' >', 420, 70 + i * 26, sel ? '#8fe8ff' : '#667', 'right');
    });
    text('PFEILE = ÄNDERN   ENTER/ESC = ZURÜCK', W / 2, H - 20, '#888', 'center');
  }
  function selectable() {
    var l = [];
    for (var i = 0; i <= Math.min(LAST, save.unlocked - 1); i++) l.push(i);
    if (save.island) l.push(ISLAND);
    return l;
  }
  function drawSelect() {
    ctx.fillStyle = '#0a0e1e'; ctx.fillRect(0, 0, W, H);
    text('LEVEL WÄHLEN', W / 2, 16, '#ffe04a', 'center', 16);
    var sl = selectable();
    sl.forEach(function (li, i) {
      var sel = i === G.sel, d = LEVELS[li];
      text((sel ? '> ' : '  ') + (d.secret ? ' ?' : ('0' + (li + 1)).slice(-2)) + '. ' + d.name, 40, 40 + i * 16, sel ? '#fff' : '#999');
      if (sel) text('BOSS: ' + d.enc[d.enc.length - 1].map(function (t) { return MON[t].name; }).join(' + '), 240, 40 + i * 16, '#ff8a6a');
    });
    var dsel = LEVELS[sl[G.sel] || 0];
    if (dsel) text(dsel.sub, W / 2, H - 30, '#8fe8ff', 'center');
    text('ENTER = START   ESC = ZURÜCK', W / 2, H - 14, '#888', 'center');
  }
  function drawHelp() {
    ctx.fillStyle = '#0a0e1e'; ctx.fillRect(0, 0, W, H);
    text('STEUERUNG', W / 2, 16, '#ffe04a', 'center', 16);
    var l = [
      ['PFEILE / WASD', 'LAUFEN (DURCH HÄUSER!)'],
      ['J / LEERTASTE', 'KOMBO: KLAUE, KLAUE, SCHWANZ'],
      ['K (HALTEN)', 'AUFLADEN, DANN ATOMSTRAHL'],
      ['L', 'BRÜLLEN - BETÄUBT MONSTER'],
      ['R', 'KERNPULS (ROTE WUT-LEISTE VOLL)'],
      ['P / ESC / II', 'PAUSE-MENÜ   M = TON'],
      ['GAMEPAD', 'A SCHLAG X STRAHL Y BRÜLL RB PULS']
    ];
    l.forEach(function (r, i) { text(r[0], 30, 42 + i * 15, '#8fe8ff'); text(r[1], 180, 42 + i * 15, '#ddd'); });
    text('TIPPS:', 30, 152, '#ffe04a');
    ['- DER 3. SCHLAG IST EIN SCHWANZHIEB RUNDUM.', '- ROTER KREIS + ! = GEGNER HOLT AUS. AUSWEICHEN!', '- OHNE TREFFER HEILT GODZILLA LANGSAM.', '- GELBE FÄSSER UND ATOMKRAFTWERKE HEILEN.', '- FLIEGENDE MONSTER: ATOMSTRAHL BENUTZEN.', '- LARVEN VERPUPPEN SICH... SEI BEREIT!']
      .forEach(function (s, i) { text(s, 30, 165 + i * 12, '#bbb'); });
    text('ESC / ENTER = ZURÜCK', W / 2, H - 14, '#888', 'center');
  }
  function drawIntro() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    var d = LEVELS[G.lvl];
    text(d.secret ? 'GEHEIMLEVEL' : 'LEVEL ' + (G.lvl + 1) + ' / ' + (LAST + 1), 24, 18, '#888');
    text(d.name, 24, 32, '#ff4a2a', 'left', 16);
    text(d.sub, 24, 54, '#8fe8ff');
    d.text.forEach(function (l, i) { text(l, 24, 80 + i * 13, '#ddd'); });
    var bt = d.enc[d.enc.length - 1][0], set = SPR[bt];
    var img = Math.floor(G.t * 2) % 2 ? set.attack.l : set.stand.l, sc = set.h > 80 ? 1.5 : 2;
    ctx.drawImage(img, W - 30 - set.w * sc, H - 50 - set.h * sc, set.w * sc, set.h * sc);
    var mini = d.enc.slice(0, -1).map(function (e) { return e.map(function (t) { return MON[t].name; }).join(' + '); });
    if (mini.length) text('ZWISCHENGEGNER: ' + mini.join(', '), 24, H - 60, '#ffb070');
    text('BOSS: ' + d.enc[d.enc.length - 1].map(function (t) { return MON[t].name; }).join(' + '), 24, H - 46, '#ff6a5a');
    if (Math.floor(G.t * 2) % 2) text('ENTER = LOS!', 24, H - 26, '#ffe04a');
    if (G.mini) text('MINILLA-MODUS', W - 12, 12, '#7aff7a', 'right');
  }
  function drawClear() {
    drawWorld(); drawHUD();
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(60, 60, W - 120, 150);
    text(G.lvl === ISLAND ? 'KÖNIG DER MONSTER!' : 'SIEG!', W / 2, 74, '#ffe04a', 'center', 16);
    text(LEVELS[G.lvl].name + ' LIEGT IN TRÜMMERN.', W / 2, 104, '#fff', 'center');
    text('ZERSTÖRTE GEBÄUDE: ' + L.destroyed, W / 2 - 30, 124, '#ffcc6a', 'center');
    text('ZEIT: ' + Math.floor(L.time) + ' SEK', W / 2 - 30, 138, '#ffcc6a', 'center');
    text('PUNKTE: ' + G.score, W / 2 - 30, 152, '#fff', 'center');
    var rating = L.p.hp * 0.35 + Math.min(40, L.destroyed * 0.6) + Math.max(0, 25 - L.time / 12);
    var grade = rating >= 80 ? 'S' : rating >= 62 ? 'A' : rating >= 45 ? 'B' : 'C';
    text('RANG', W - 110, 112, '#aaa', 'center');
    text(grade, W - 110, 126, { S: '#ffe04a', A: '#7aff7a', B: '#8fe8ff', C: '#ff9a6a' }[grade], 'center', 32);
    if (G.t > 1.5 && Math.floor(G.t * 2) % 2) text('ENTER = WEITER', W / 2, 186, '#8fe8ff', 'center');
  }
  function drawOver() {
    drawWorld();
    ctx.fillStyle = 'rgba(40,0,0,.65)'; ctx.fillRect(0, 0, W, H);
    text('GAME OVER', W / 2, 90, '#ff4a2a', 'center', 24);
    text('GODZILLA VERSINKT IM MEER...', W / 2, 130, '#ddd', 'center');
    if (G.t > 1.5 && Math.floor(G.t * 2) % 2) text('ENTER = NOCHMAL   ESC = TITEL', W / 2, 170, '#ffe04a', 'center');
  }
  var ENDING = ['DESTOROYAH IST BESIEGT.', '', 'GODZILLA STAPFT ZURÜCK INS MEER.', 'DIE MENSCHHEIT BLEIBT VERSCHONT...', '...VORERST.', '', '', 'ENDE?', '', '', 'EIN GERÜCHT BESAGT, DASS AUF DER', 'MONSTERINSEL NOCH MEHR WARTET.', '(JETZT IM LEVEL-MENÜ)', '', '', 'IDEE, CODE, PIXEL & MUSIK:', 'CLAUDE ALS GAME-DEVELOPER', 'FÜR ALPREUSS-SVG', '', 'EINE FAN-HOMMAGE AN DIE', 'SHOWA- & HEISEI-KAIJU-FILME.', '', 'DANKE FÜRS SPIELEN!'];
  function drawEnding() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    var y0 = H - G.t * 18;
    ENDING.forEach(function (l, i) { var y = y0 + i * 16; if (y > -10 && y < H) text(l, W / 2, y, i === 7 ? '#ff4a2a' : '#ddd', 'center'); });
    var set = SPR.godzilla; ctx.drawImage(set.walk[Math.floor(G.t * 4) % 4].l, W - 150 - (G.t * 6) % 60, H - set.h - 4);
    if (G.t > 4) text('ENTER', W - 8, H - 12, '#555', 'right');
  }

  /* ================= Hauptschleife ================= */
  function update(dt) {
    G.t += dt; G.msgT -= dt;
    if (hit('m')) { delete pressed.m; var mu = Sound.toggleMute(); if (L && G.state === 'play') toast(mu ? 'TON AUS' : 'TON AN', '#fff', 1.5); else flashMsg(mu ? 'TON AUS' : 'TON AN'); }
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
        if (enter || hit('escape')) G.state = G.back || 'title';
        break;
      case 'options':
        if (hit('arrowup') || hit('w')) G.osel = (G.osel + OPTS.length - 1) % OPTS.length;
        if (hit('arrowdown') || hit('s')) G.osel = (G.osel + 1) % OPTS.length;
        if (hit('arrowleft') || hit('a')) { OPTS[G.osel].ch(-1); applyOpts(); Sound.sfx('select'); }
        if (hit('arrowright') || hit('d')) { OPTS[G.osel].ch(1); applyOpts(); Sound.sfx('select'); }
        if (enter || hit('escape')) { applyOpts(); G.state = G.back || 'title'; }
        break;
      case 'intro':
        if ((enter || hit('space')) && G.t > 0.3) {
          if (G.mini !== (L.p.set === SPR.minilla)) { var sc = G.score; startLevel(G.lvl); G.score = sc; }
          G.state = 'play'; G.t = 0; Sound.play(LEVELS[G.lvl].music); Sound.sfx('roar', { kind: 'godzilla', pitch: G.mini ? 1.7 : 1 });
        }
        break;
      case 'play':
        if (hit('p') || hit('escape') || G.clickPause) { G.clickPause = false; pauseGame(); break; }
        if (G.hitstop > 0) { G.hitstop -= dt; L.shake = Math.max(0, L.shake - dt); return; } // Eingaben bleiben gepuffert
        updatePlay(dt);
        break;
      case 'pause':
        if (hit('arrowup') || hit('w')) { G.psel = (G.psel + PMENU.length - 1) % PMENU.length; Sound.sfx('select'); }
        if (hit('arrowdown') || hit('s')) { G.psel = (G.psel + 1) % PMENU.length; Sound.sfx('select'); }
        if (hit('p') || hit('escape')) { G.state = 'play'; G.back = null; }
        else if (enter || hit('space') || G.clickSel !== undefined) {
          if (G.clickSel !== undefined) G.psel = G.clickSel;
          G.clickSel = undefined; Sound.sfx('select'); PMENU[G.psel].a();
        }
        if (hit('q')) { G.state = 'title'; L = null; G.back = null; }
        break;
      case 'clear':
        L.toasts.forEach(function (t) { t.t -= dt; });
        updateParticles(dt);
        if (enter && G.t > 1.5) {
          if (G.lvl === LAST) { G.state = 'ending'; G.t = 0; Sound.play('title'); }
          else if (G.lvl === ISLAND) { G.state = 'title'; L = null; }
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
      case 'options': drawOptions(); break;
      case 'intro': drawIntro(); break;
      case 'play': drawWorld(); drawHUD(); break;
      case 'pause':
        drawWorld(); drawHUD();
        ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(0, 0, W, H);
        text('PAUSE', W / 2, 52, '#fff', 'center', 16);
        PMENU.forEach(function (it, i) { var sel = i === G.psel; text((sel ? '> ' : '  ') + it.label, W / 2 - 80, 90 + i * 20, sel ? '#ffe04a' : '#bbb'); });
        text('P/ESC = WEITER   PFEILE + ENTER ODER KLICKEN', W / 2, H - 24, '#888', 'center');
        break;
      case 'clear': drawClear(); break;
      case 'over': drawOver(); break;
      case 'ending': drawEnding(); break;
    }
    filmOverlay();
  }

  /* ================= Gamepad ================= */
  var padPrev = {};
  function pollPad() {
    if (!navigator.getGamepads) return;
    var pads = navigator.getGamepads(), gp = null;
    for (var i = 0; i < pads.length; i++) if (pads[i] && pads[i].connected) { gp = pads[i]; break; }
    if (!gp) return;
    var ax = gp.axes[0] || 0, ay = gp.axes[1] || 0, b = gp.buttons.map(function (x) { return x && x.pressed; });
    var playing = G.state === 'play';
    var st = {
      arrowleft: ax < -0.4 || b[14], arrowright: ax > 0.4 || b[15], arrowup: ay < -0.4 || b[12], arrowdown: ay > 0.4 || b[13],
      j: playing && b[0], k: playing && (b[2] || b[7]), l: playing && b[3], r: playing && (b[5] || b[1]),
      enter: !playing && (b[0] || b[9]), escape: !playing && b[1], p: playing && b[9]
    };
    for (var k in st) {
      if (st[k] && !padPrev[k]) { pressed[k] = true; Sound.init(); }
      if (st[k]) keys[k] = true; else if (padPrev[k]) keys[k] = false;
    }
    padPrev = st;
  }

  /* ================= Touch-Steuerung (Handy/Tablet) ================= */
  function setupTouch() {
    var tc = document.getElementById('touch');
    var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (!tc || !coarse || !('ontouchstart' in window || navigator.maxTouchPoints > 0)) return;
    tc.hidden = false;
    var stick = document.getElementById('stick'), knob = document.getElementById('knob'), sid = null;
    function setDir(dx, dy) {
      var l = Math.sqrt(dx * dx + dy * dy), dead = 12;
      keys.arrowleft = l > dead && dx < -l * 0.38; keys.arrowright = l > dead && dx > l * 0.38;
      keys.arrowup = l > dead && dy < -l * 0.38; keys.arrowdown = l > dead && dy > l * 0.38;
      var m = Math.min(l, 40) / (l || 1);
      knob.style.transform = 'translate(' + dx * m + 'px,' + dy * m + 'px)';
    }
    function moveStick(e) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i]; if (t.identifier !== sid) continue;
        var r = stick.getBoundingClientRect();
        setDir(t.clientX - r.left - r.width / 2, t.clientY - r.top - r.height / 2);
      }
      e.preventDefault();
    }
    stick.addEventListener('touchstart', function (e) {
      Sound.init(); sid = e.changedTouches[0].identifier; moveStick(e);
      if (G.state !== 'play') { var t = e.changedTouches[0], r = stick.getBoundingClientRect(), dy = t.clientY - r.top - r.height / 2, dx = t.clientX - r.left - r.width / 2; if (Math.abs(dy) > Math.abs(dx)) pressed[dy < 0 ? 'arrowup' : 'arrowdown'] = true; else pressed[dx < 0 ? 'arrowleft' : 'arrowright'] = true; }
    }, { passive: false });
    stick.addEventListener('touchmove', moveStick, { passive: false });
    stick.addEventListener('touchend', function (e) { sid = null; setDir(0, 0); e.preventDefault(); }, { passive: false });
    Array.prototype.forEach.call(tc.querySelectorAll('[data-k]'), function (bt) {
      var k = bt.getAttribute('data-k');
      bt.addEventListener('touchstart', function (e) {
        Sound.init();
        var kk = k;
        if (G.state !== 'play' && (k === 'j' || k === 'k')) kk = 'enter';
        if (G.state !== 'play' && k === 'l') kk = 'escape';
        pressed[kk] = true; keys[kk] = true; bt.classList.add('on'); e.preventDefault();
        bt._k = kk;
      }, { passive: false });
      bt.addEventListener('touchend', function (e) { keys[bt._k] = false; bt.classList.remove('on'); e.preventDefault(); }, { passive: false });
    });
    cv.addEventListener('touchstart', function (e) { Sound.init(); if (G.state !== 'play') pressed.enter = true; e.preventDefault(); }, { passive: false });
  }

  var last = 0;
  function frame(ts) {
    var dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    try { pollPad(); update(dt); draw(); } catch (e) { console.error(e); }
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
    applyOpts();
    setupTouch();
    G.state = 'title'; G.t = 0;
    window.__GZ = {
      G: G, get L() { return L; }, SPR: SPR, MON: MON, startLevel: startLevel,
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
