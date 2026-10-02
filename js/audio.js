'use strict';
/* Orchester-Synth im Stil der Kaiju-Filmmusik der 50er/60er
   (Blechbläser, Streicher, Kontrabass-Ostinato, Pauken, Militärtrommel).
   Alle Stücke sind Eigenkompositionen -> komplett lizenzfrei, nichts wird geladen. */
var Sound = (function () {
  var ctx = null, master, music, sfx, verb, noiseBuf, muted = false;
  var song = null, songEvents = null, step = 0, nextTime = 0, timer = null, songName = '';
  var breathNode = null, volM = 0.7, volS = 0.8;
  function setVol(m, s) {
    volM = m; volS = s;
    if (music) music.gain.value = 0.72 * m;
    if (sfx) sfx.gain.value = 0.9 * s;
  }

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.8;
    comp.connect(master); master.connect(ctx.destination);
    music = ctx.createGain(); music.connect(comp);
    sfx = ctx.createGain(); sfx.connect(comp);
    setVol(volM, volS);
    // Hall (künstliche Impulsantwort)
    verb = ctx.createConvolver();
    var len = ctx.sampleRate * 2.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) { var d = ir.getChannelData(c); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    verb.buffer = ir;
    var vg = ctx.createGain(); vg.gain.value = 0.35; verb.connect(vg); vg.connect(comp);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var nd = noiseBuf.getChannelData(0);
    for (i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  }
  function out(node, wet) {
    node.connect(music);
    if (wet) { var g = ctx.createGain(); g.gain.value = wet; node.connect(g); g.connect(verb); }
  }

  var NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function freq(tok) {
    var m = /^([A-G])([#b]?)(-?\d)$/.exec(tok);
    if (!m) return 0;
    var n = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3], 10) + 1) * 12;
    return 440 * Math.pow(2, (n - 69) / 12);
  }

  /* ---------- Instrumente ---------- */
  function brass(f, t, dur, vol) {
    var g = ctx.createGain(), fl = ctx.createBiquadFilter();
    fl.type = 'lowpass'; fl.Q.value = 2;
    fl.frequency.setValueAtTime(350, t); fl.frequency.linearRampToValueAtTime(2600, t + 0.07); fl.frequency.linearRampToValueAtTime(1500, t + 0.3);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.05);
    g.gain.setValueAtTime(vol * 0.85, t + Math.max(0.06, dur - 0.08)); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.12);
    [-5, 5].forEach(function (cents) {
      var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = cents;
      if (dur > 0.4) { var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.006, t + 0.4); lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur + 0.2); }
      o.connect(fl); o.start(t); o.stop(t + dur + 0.2);
    });
    fl.connect(g); out(g, 0.5);
  }
  function strings(fs, t, dur, vol) {
    var g = ctx.createGain(), fl = ctx.createBiquadFilter();
    fl.type = 'lowpass'; fl.frequency.value = 2200;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.18);
    g.gain.setValueAtTime(vol, t + Math.max(0.2, dur - 0.1)); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.35);
    var lfo = ctx.createOscillator(); lfo.frequency.value = 5.6; lfo.start(t); lfo.stop(t + dur + 0.4);
    fs.forEach(function (f) {
      [-9, 0, 9].forEach(function (cents) {
        var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = cents;
        var lg = ctx.createGain(); lg.gain.value = f * 0.004; lfo.connect(lg); lg.connect(o.frequency);
        o.connect(fl); o.start(t); o.stop(t + dur + 0.4);
      });
    });
    fl.connect(g); out(g, 0.7);
  }
  function low(f, t, dur, vol) { // Kontrabass/Klavier-Ostinato
    var g = ctx.createGain(), fl = ctx.createBiquadFilter();
    fl.type = 'lowpass'; fl.frequency.setValueAtTime(1400, t); fl.frequency.exponentialRampToValueAtTime(380, t + 0.25);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(vol * 0.35, t + Math.min(dur, 0.4)); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.05);
    var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
    var o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f / 2;
    o.connect(fl); o2.connect(fl); fl.connect(g); out(g, 0.2);
    o.start(t); o2.start(t); o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1);
  }
  function timp(f, t, vol) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f * 1.06, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.08);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 1.3);
    o.connect(g); out(g, 0.6); o.start(t); o.stop(t + 1.4);
    var o2 = ctx.createOscillator(), g2 = ctx.createGain(); o2.type = 'sine'; o2.frequency.value = f * 1.5;
    g2.gain.setValueAtTime(vol * 0.3, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o2.connect(g2); out(g2, 0.4); o2.start(t); o2.stop(t + 0.6);
    noiseHit(t, 0.08, 'lowpass', 400, vol * 0.6, music);
  }
  function noiseHit(t, len, type, fr, vol, dest, wet) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.value = fr;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
    s.connect(f); f.connect(g);
    if (dest === music) out(g, wet || 0.3); else g.connect(dest);
    s.start(t, Math.random() * 0.5); s.stop(t + len + 0.02);
  }
  function perc(k, t) {
    if (k === 'k') { var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.2); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35); o.connect(g); out(g, 0.3); o.start(t); o.stop(t + 0.4); }
    else if (k === 's') { noiseHit(t, 0.16, 'bandpass', 1900, 0.45, music, 0.4); }
    else if (k === 'r') { for (var i = 0; i < 4; i++) noiseHit(t + i * 0.03, 0.05, 'bandpass', 2100, 0.22, music, 0.4); }
    else if (k === 'c') { noiseHit(t, 1.4, 'highpass', 5000, 0.28, music, 0.8); }
  }

  /* ---------- Stücke (16 Schritte = 1 Takt) ---------- */
  function R(s, n) { var o = []; for (var i = 0; i < n; i++) o.push(s); return o.join(' '); }
  function bar(ch) { return ch + R(' -', 15); }
  function ost(r1, r2) { return R(r1 + ' ' + r1 + ' ' + r2 + ' ' + r1, 4); }
  function pad(list) { return list.map(bar).join(' '); }

  var SONGS = {
    title: {
      bpm: 76, loop: true,
      brass: 'D4 - - - - - - - A4 - - - - - - - ' + 'G4 - - - F4 - - - E4 - - - F4 - D4 - ' +
        'F4 - - - - - - - D5 - - - - - C5 - ' + 'C#5 - - - - - - - A4 - - - - - - - ' +
        'D5 - - - - - - - F5 - - - - - E5 - ' + 'D5 - - - - - Bb4 - G4 - - - - - A4 - ' +
        'E5 - - - - - D5 - C#5 - - - - - E4 - ' + 'D4 - - - - - - - - - - - . . . .',
      str: pad(['D3+F3+A3', 'D3+F3+A3', 'Bb2+D3+F3', 'A2+C#3+E3', 'D3+F3+A3', 'G2+Bb2+D3', 'A2+C#3+E3', 'D3+F3+A3']),
      low: R('D2 - . D2 D2 - . D2 D2 - . D2 C#2 - D2 -', 2) + ' Bb1 - . Bb1 Bb1 - . Bb1 Bb1 - . Bb1 A1 - Bb1 - ' +
        'A1 - . A1 A1 - . A1 A1 - . A1 G#1 - A1 - ' + 'D2 - . D2 D2 - . D2 D2 - . D2 C#2 - D2 - ' +
        'G1 - . G1 G1 - . G1 G1 - . G1 F#1 - G1 - ' + 'A1 - . A1 A1 - . A1 A1 - . A1 G#1 - A1 - ' + 'D2 - . D2 D2 - . D2 D2 - - - . . . .',
      timp: R('D2 . . . . . . . A1 . . . . . . .', 3) + ' A1 . . . . . . . A1 . . . A1 . A1 . ' + R('D2 . . . . . . . A1 . . . . . . .', 2) + ' A1 . . . A1 . . . A1 . A1 . A1 A1 A1 A1 D2 . . . . . . . . . . . . . . .',
      perc: 'c . . . . . . . s . . . . . . . ' + R('k . . . . . . . s . . . . . . .', 6) + ' k . . . . . . . r r r r r r r r'
    },
    stage: {
      bpm: 132, loop: true,
      brass: 'A4 - . A4 C5 - . A4 E5 - - - D5 - C5 - ' + 'B4 - . G4 A4 - - - . . . . E4 - G4 - ' +
        'A4 - . A4 C5 - . A4 F5 - - - E5 - C5 - ' + 'D5 - - - B4 - G4 - D5 - - - E5 - D5 - ' +
        'C5 - - - A4 - - - E5 - - - A5 - - - ' + 'G5 - F5 - E5 - D5 - C5 - B4 - C5 - D5 - ' +
        'C5 - - - A4 - - - F5 - - - E5 - D5 - ' + 'E5 - - - - - - - G#4 - - - B4 - - -',
      str: pad(['A3+C4+E4', 'A3+C4+E4', 'F3+A3+C4', 'G3+B3+D4', 'A3+C4+E4', 'A3+C4+E4', 'F3+A3+C4', 'E3+G#3+B3']),
      low: [ost('A1', 'A2'), ost('A1', 'A2'), ost('F1', 'F2'), ost('G1', 'G2'), ost('A1', 'A2'), ost('A1', 'A2'), ost('F1', 'F2'), ost('E1', 'E2')].join(' '),
      timp: R('A1 . . . . . . . E1 . . . . . . .', 2) + ' F1 . . . . . . . C2 . . . . . . . G1 . . . . . . . D2 . . . . . . . ' + R('A1 . . . . . . . E1 . . . . . . .', 2) + ' F1 . . . . . . . C2 . . . . . . . E1 . . . E1 . . . E1 . E1 . E1 E1 E1 E1',
      perc: 'c . s . k . s . k . s . k k s . ' + R('k . s . k . s . k . s . k k s s', 6) + ' k . s . k . s . r r r r r r r r'
    },
    mini: {
      bpm: 144, loop: true,
      brass: 'C5 - - - G4 - - - C5 - Eb5 - D5 - C5 - ' + 'G4 - - - - - - - . . . . G4 - Ab4 - ' +
        'Ab4 - - - C5 - - - Eb5 - - - D5 - C5 - ' + 'B4 - - - - - - - D5 - - - G4 - - -',
      str: pad(['C3+Eb3+G3', 'C3+Eb3+G3', 'Ab2+C3+Eb3', 'G2+B2+D3']),
      low: [ost('C2', 'C3'), ost('C2', 'C3'), ost('Ab1', 'Ab2'), ost('G1', 'G2')].join(' '),
      timp: R('C2 . . . C2 . . . G1 . . . C2 . G1 .', 3) + ' G1 . G1 . G1 . G1 . G1 G1 G1 G1 G1 G1 G1 G1',
      perc: 'c . s . k . s k k . s . k s s s ' + R('k . s . k . s k k . s . k s s s', 3)
    },
    boss: {
      bpm: 150, loop: true,
      brass: 'E4 - - - B3 - - - E4 - F4 - E4 - D#4 - ' + 'E4 - - - - - - - B3 - C4 - B3 - A3 - ' +
        'G3 - - - C4 - - - E4 - - - G4 - F#4 - ' + 'F#4 - - - D#4 - - - B3 - - - F#4 - - - ' +
        'E5 - G5 - E5 - B4 - E5 - G5 - B5 - - - ' + 'A5 - G5 - F#5 - E5 - D#5 - E5 - F#5 - - - ' +
        'G5 - - - E5 - - - C5 - - - E5 - G5 - ' + 'F#5 - - - - - - - D#5 - - - B4 - - -',
      str: pad(['E3+G3+B3', 'E3+G3+B3', 'C3+E3+G3', 'B2+D#3+F#3', 'E4+G4+B4', 'E4+G4+B4', 'C4+E4+G4', 'B3+D#4+F#4']),
      low: R('E1 E1 E2 E1', 8) + ' ' + R('C2 C2 C3 C2', 4) + ' ' + R('B1 B1 B2 B1', 4) + ' ' + R('E1 E1 E2 E1', 8) + ' ' + R('C2 C2 C3 C2', 4) + ' ' + R('B1 B1 B2 B1', 4),
      timp: R('E2 . . . E2 . . . E2 . . . E2 . B1 .', 8),
      perc: 'c . s k k . s . k . s k k s s s ' + R('k . s k k . s . k . s k k s s s', 3) + ' c . s k k . s . k . s k k s s s ' + R('k . s k k . s . k . s k k s s s', 2) + ' k . s k k . s . r r r r r r r r'
    },
    island: {
      bpm: 112, loop: true,
      brass: 'G4 - B4 - D5 - - - E5 - D5 - B4 - - - ' + 'C5 - - - A4 - - - G4 - - - - - - - ' +
        'G4 - B4 - D5 - - - G5 - F#5 - E5 - - - ' + 'D5 - - - C5 - B4 - A4 - - - - - - -',
      str: pad(['G3+B3+D4', 'C3+E3+G3', 'E3+G3+B3', 'D3+F#3+A3']),
      low: [ost('G1', 'G2'), ost('C2', 'C3'), ost('E1', 'E2'), ost('D1', 'D2')].join(' '),
      timp: R('G1 . . . . . . . D2 . . . . . . .', 4),
      perc: R('k . s . k . s . k . s . k k s .', 4)
    },
    win: {
      bpm: 120, loop: false,
      brass: 'C4 - G4 - C5 - E5 - - - D5 - E5 - - - G5 - - - - - - - - - - - . . . .',
      str: 'C3+E3+G3' + R(' -', 15) + ' G3+C4+E4' + R(' -', 11) + ' . . . .',
      low: 'C2 - - - G1 - - - C2 - - - G1 - - - C2 - - - - - - - - - - - . . . .',
      timp: 'C2 . . . G1 . . . C2 . . . G1 . G1 G1 C2 . . . . . . . . . . . . . . .',
      perc: 'c . . . s . . . k . s . k s s s c . . . . . . . . . . . . . . .'
    },
    over: {
      bpm: 70, loop: false,
      brass: 'A3 - - - G#3 - - - G3 - - - F#3 - - - F3 - - - - - - - - - - - . . . .',
      str: 'A2+C3+E3' + R(' -', 7) + ' F2+A2+C3' + R(' -', 7) + ' D2+F2+A2' + R(' -', 11) + ' . . . .',
      low: 'A1 - - - - - - - F1 - - - - - - - D1 - - - - - - - - - - - . . . .',
      timp: 'A1 . . . . . . . . . . . . . . . D2 . . . . . . . . . . . . . . .',
      perc: 'k . . . . . . . k . . . . . . . r r r r c . . . . . . . . . . .'
    },
    dance: {
      bpm: 170, loop: false,
      brass: 'C5 C5 . C5 . A4 C5 . D5 . C5 . A4 . G4 . C5 C5 . C5 . A4 C5 . F5 - - - E5 - - -',
      str: '. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .',
      low: 'F2 . C3 . F2 . C3 . G2 . D3 . G2 . D3 . F2 . C3 . F2 . C3 . C3 - - - C2 - - -',
      timp: '. . . . . . . . . . . . . . . . . . . . . . . . C2 . . . C2 . . .',
      perc: 'k . s . k . s . k . s . k s s s k . s . k . s . k . s . k s s s'
    }
  };
  var CH = ['brass', 'str', 'low', 'timp', 'perc'];

  function compile(s) {
    var ev = {}, len = 0;
    CH.forEach(function (ch) {
      var toks = (s[ch] || '.').trim().split(/\s+/), list = [];
      for (var i = 0; i < toks.length; i++) {
        var t = toks[i];
        if (t === '.' || t === '-') continue;
        if (ch === 'perc') { list[i] = { d: t }; continue; }
        var n = 1; while (toks[i + n] === '-') n++;
        list[i] = { f: t.split('+').map(freq), n: n };
      }
      ev[ch] = { list: list, len: toks.length };
      len = Math.max(len, toks.length);
    });
    return { ev: ev, len: len };
  }

  function tick() {
    if (!ctx || !song) return;
    var sd = 60 / song.bpm / 4;
    while (nextTime < ctx.currentTime + 0.2) {
      if (!song.loop && step >= songEvents.len) { song = null; return; }
      var chans = songEvents.ev;
      for (var ch in chans) {
        var c = chans[ch], e = c.list[step % c.len];
        if (!e) continue;
        var dur = e.n * sd;
        if (ch === 'perc') perc(e.d, nextTime);
        else if (ch === 'brass') brass(e.f[0], nextTime, dur * 0.95, 0.15);
        else if (ch === 'str') strings(e.f, nextTime, dur, 0.035);
        else if (ch === 'low') low(e.f[0], nextTime, Math.min(dur, 0.5), 0.3);
        else if (ch === 'timp') timp(e.f[0], nextTime, 0.55);
      }
      step++;
      nextTime += sd;
    }
  }

  function play(name) {
    if (!ctx) return;
    if (songName === name && song) return;
    songName = name;
    song = SONGS[name]; songEvents = compile(song); step = 0; nextTime = ctx.currentTime + 0.08;
    if (!timer) timer = setInterval(tick, 40);
  }
  function stopMusic() { song = null; songName = ''; }

  /* ---------- Effekte ---------- */
  function noise(t, dur, type, f0, f1, vol, q, wet) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true;
    f.type = type; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    if (q) f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(sfx);
    if (wet) { var w = ctx.createGain(); w.gain.value = wet; g.connect(w); w.connect(verb); }
    s.start(t); s.stop(t + dur + 0.02);
  }
  function sweep(type, t, dur, f0, f1, vol) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(sfx); o.start(t); o.stop(t + dur + 0.02);
  }
  var curveCache = null;
  function distCurve() {
    if (curveCache) return curveCache;
    var n = 1024, c = new Float32Array(n);
    for (var i = 0; i < n; i++) { var x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(x * 3.2); }
    return (curveCache = c);
  }

  /* Kaiju-Schrei: "gestrichene Saite" mit Stick-Slip-Rauheit, Formanten, Verzerrung und Hall.
     Typen: godzilla, mecha (metallisch), rodan (schrill), ghidorah (Triller), deep (tief/gurgelnd) */
  function roar(kind, pitch) {
    var t = ctx.currentTime, p = pitch || 1;
    var cfg = {
      godzilla: { pts: [[0, 230], [0.14, 470], [0.55, 560], [0.95, 520], [1.12, 420], [1.35, 480], [2.5, 250]], len: 2.6, am: 34, rough: 30 },
      mecha: { pts: [[0, 300], [0.2, 620], [1.0, 560], [1.8, 300]], len: 1.9, am: 70, rough: 12, ring: 140 },
      rodan: { pts: [[0, 600], [0.12, 1150], [0.7, 980], [1.2, 700]], len: 1.3, am: 45, rough: 40 },
      ghidorah: { pts: [[0, 700], [0.1, 1300], [1.2, 1100], [1.6, 800]], len: 1.7, am: 16, rough: 20, trill: true },
      deep: { pts: [[0, 110], [0.3, 190], [1.2, 160], [2.0, 80]], len: 2.1, am: 22, rough: 18 }
    }[kind || 'godzilla'];
    var len = cfg.len;
    var mix = ctx.createGain(), am = ctx.createGain();
    var o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), o3 = ctx.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'square'; o3.type = 'sawtooth';
    [o1, o2, o3].forEach(function (o, i) {
      var mul = [1, 1.008, 0.5][i];
      cfg.pts.forEach(function (pt, j) {
        var f = pt[1] * p * mul;
        if (j === 0) o.frequency.setValueAtTime(f, t); else o.frequency.linearRampToValueAtTime(f, t + pt[0]);
      });
    });
    // Stick-Slip-Rauheit: Rauschen moduliert die Tonhöhe
    var ns = ctx.createBufferSource(); ns.buffer = noiseBuf; ns.loop = true;
    var nf = ctx.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 90;
    var ng = ctx.createGain(); ng.gain.value = cfg.rough * p;
    ns.connect(nf); nf.connect(ng); ng.connect(o1.frequency); ng.connect(o2.frequency);
    // Amplitudenrattern
    var lfo = ctx.createOscillator(); lfo.type = cfg.trill ? 'square' : 'triangle'; lfo.frequency.value = cfg.am;
    var lg = ctx.createGain(); lg.gain.value = cfg.trill ? 0.5 : 0.3;
    am.gain.value = 0.7; lfo.connect(lg); lg.connect(am.gain);
    o1.connect(mix); o2.connect(mix); var g3 = ctx.createGain(); g3.gain.value = 0.5; o3.connect(g3); g3.connect(mix);
    var node = mix;
    if (cfg.ring) {
      var rm = ctx.createGain(); rm.gain.value = 0; var ro = ctx.createOscillator(); ro.frequency.value = cfg.ring;
      ro.connect(rm.gain); mix.connect(rm); node = rm; ro.start(t); ro.stop(t + len + 0.1);
    }
    var ws = ctx.createWaveShaper(); ws.curve = distCurve(); ws.oversample = '2x';
    node.connect(am); am.connect(ws);
    // Formanten (Rachenraum)
    var env = ctx.createGain();
    [[650, 5, 0.9], [1250, 6, 0.7], [2700, 7, 0.35]].forEach(function (fm) {
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fm[0] * (0.7 + 0.3 * p); bp.Q.value = fm[1];
      var bg = ctx.createGain(); bg.gain.value = fm[2] * 2.2; ws.connect(bp); bp.connect(bg); bg.connect(env);
    });
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; var lpg = ctx.createGain(); lpg.gain.value = 0.35;
    ws.connect(lp); lp.connect(lpg); lpg.connect(env);
    env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(0.5, t + 0.1);
    env.gain.setValueAtTime(0.5, t + len * 0.4); env.gain.linearRampToValueAtTime(0.3, t + len * 0.44);
    env.gain.linearRampToValueAtTime(0.45, t + len * 0.52); env.gain.linearRampToValueAtTime(0.0001, t + len);
    env.connect(sfx);
    var wg = ctx.createGain(); wg.gain.value = 0.6; env.connect(wg); wg.connect(verb);
    [o1, o2, o3, ns, lfo].forEach(function (o) { o.start(t); o.stop(t + len + 0.1); });
    noise(t, len * 0.9, 'bandpass', 1600 * p, 700 * p, 0.12, 1.2, 0.3); // Atemgeräusch
  }

  var fx = {
    roar: function (a) { roar(a && a.kind, a && a.pitch); },
    boom: function (big) {
      var t = ctx.currentTime;
      noise(t, big ? 1.1 : 0.5, 'lowpass', big ? 1800 : 2600, 60, big ? 0.9 : 0.5, 0, 0.4);
      sweep('sine', t, big ? 0.6 : 0.3, 110, 30, big ? 0.9 : 0.5);
    },
    hit: function () { var t = ctx.currentTime; sweep('sine', t, 0.18, 160, 45, 0.8); noise(t, 0.14, 'bandpass', 1400, 500, 0.5, 1.5); },
    // tiefes Einatmen + ansteigendes Atom-Summen
    charge: function (dur) {
      var t = ctx.currentTime, d = dur || 0.6;
      noise(t, d * 0.9, 'bandpass', 350, 1800, 0.4, 1.5, 0.3);
      var o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = 'sawtooth'; o2.type = 'square';
      o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(420, t + d);
      o2.frequency.setValueAtTime(140, t); o2.frequency.exponentialRampToValueAtTime(840, t + d);
      f.type = 'lowpass'; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(3000, t + d);
      g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.18, t + d * 0.95); g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.1);
      o.connect(f); o2.connect(f); f.connect(g); g.connect(sfx);
      var w = ctx.createGain(); w.gain.value = 0.4; g.connect(w); w.connect(verb);
      o.start(t); o2.start(t); o.stop(t + d + 0.15); o2.stop(t + d + 0.15);
    },
    collapse: function (tall) {
      var t = ctx.currentTime, len = 1 + Math.min(1.8, (tall || 40) / 50);
      noise(t, len, 'lowpass', 700, 60, 0.9, 0, 0.5);
      sweep('sine', t, len * 0.8, 70, 25, 0.8);
      for (var i = 0; i < 6; i++) noise(t + Math.random() * len * 0.7, 0.12, 'bandpass', 1500 + Math.random() * 2000, 600, 0.25, 2);
    },
    heavy: function () { var t = ctx.currentTime; sweep('sine', t, 0.35, 120, 30, 1); noise(t, 0.3, 'lowpass', 1200, 100, 0.7, 0, 0.3); },
    hurt: function () { var t = ctx.currentTime; sweep('sawtooth', t, 0.25, 180, 60, 0.35); noise(t, 0.2, 'bandpass', 900, 300, 0.4, 2); },
    swing: function () { var t = ctx.currentTime; noise(t, 0.22, 'bandpass', 500, 2600, 0.45, 2.5); },
    whip: function () { var t = ctx.currentTime; noise(t, 0.4, 'bandpass', 300, 1800, 0.6, 2); },
    stomp: function () { var t = ctx.currentTime; sweep('sine', t, 0.22, 70, 28, 0.7); },
    laser: function () { var t = ctx.currentTime; sweep('square', t, 0.4, 1600, 250, 0.12); noise(t, 0.3, 'highpass', 3000, 1500, 0.15); },
    zap: function () { var t = ctx.currentTime; sweep('sawtooth', t, 0.45, 900, 1300, 0.12); noise(t, 0.45, 'bandpass', 3000, 1500, 0.25, 4); },
    shot: function () { var t = ctx.currentTime; noise(t, 0.12, 'bandpass', 1300, 400, 0.3, 1); },
    pickup: function () { var t = ctx.currentTime; [660, 880, 1320].forEach(function (f, i) { sweep('triangle', t + i * 0.07, 0.15, f, f, 0.3); }); },
    select: function () { var t = ctx.currentTime; sweep('triangle', t, 0.08, 880, 880, 0.25); },
    secret: function () { var t = ctx.currentTime; ['C5', 'E5', 'G5', 'C6', 'E6', 'G6'].forEach(function (n, i) { sweep('triangle', t + i * 0.07, 0.14, freq(n), freq(n), 0.25); }); },
    alarm: function () { var t = ctx.currentTime; for (var i = 0; i < 3; i++) { sweep('square', t + i * 0.5, 0.25, 880, 880, 0.08); sweep('square', t + i * 0.5 + 0.25, 0.25, 660, 660, 0.08); } },
    splat: function () { var t = ctx.currentTime; noise(t, 0.35, 'lowpass', 900, 150, 0.5); },
    honk: function () { var t = ctx.currentTime; sweep('square', t, 0.18, 440, 430, 0.05); }
  };

  function sfxPlay(name, a) { if (!ctx || muted) return; try { fx[name](a); } catch (e) { console.warn('sfx', name, e); } }

  function breath(on) {
    if (!ctx) return;
    if (on && !breathNode && !muted) {
      var t = ctx.currentTime;
      var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), o = ctx.createOscillator(), og = ctx.createGain();
      s.buffer = noiseBuf; s.loop = true; f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 1.2;
      g.gain.setValueAtTime(0.001, t); g.gain.linearRampToValueAtTime(0.45, t + 0.2);
      o.type = 'sawtooth'; o.frequency.setValueAtTime(90, t); o.frequency.linearRampToValueAtTime(160, t + 0.5);
      og.gain.value = 0.07;
      s.connect(f); f.connect(g); g.connect(sfx); o.connect(og); og.connect(sfx);
      var w = ctx.createGain(); w.gain.value = 0.3; g.connect(w); w.connect(verb);
      s.start(t); o.start(t);
      breathNode = { s: s, o: o, g: g, og: og };
    } else if (!on && breathNode) {
      var n = breathNode, t2 = ctx.currentTime;
      n.g.gain.setTargetAtTime(0, t2, 0.06); n.og.gain.setTargetAtTime(0, t2, 0.06);
      n.s.stop(t2 + 0.4); n.o.stop(t2 + 0.4);
      breathNode = null;
    }
  }

  function toggleMute() {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : 0.8;
    if (muted) breath(false);
    return muted;
  }

  return { songs: SONGS, setVol: setVol, init: init, play: play, stop: stopMusic, sfx: sfxPlay, breath: breath, toggleMute: toggleMute, isMuted: function () { return muted; } };
})();
