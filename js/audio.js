'use strict';
/* 4-Kanal-Chiptune-Synth im Game-Boy-Stil (2x Puls, Dreieck, Rauschen).
   Alle Stücke sind Eigenkompositionen für dieses Spiel -> komplett lizenzfrei. */
var Sound = (function () {
  var ctx = null, master, music, sfx, noiseBuf, waves = {}, muted = false;
  var song = null, songEvents = null, step = 0, nextTime = 0, timer = null, songName = '';
  var breathNode = null;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(ctx.destination);
    music = ctx.createGain(); music.gain.value = 0.32; music.connect(master);
    sfx = ctx.createGain(); sfx.gain.value = 0.55; sfx.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0), lfsr = 1;
    for (var i = 0; i < d.length; i++) { // Game-Boy-artiges LFSR-Rauschen
      var bit = (lfsr ^ (lfsr >> 1)) & 1; lfsr = (lfsr >> 1) | (bit << 14);
      d[i] = (lfsr & 1) ? 0.8 : -0.8;
    }
    waves.p25 = pulse(0.25); waves.p125 = pulse(0.125); waves.p50 = pulse(0.5);
  }
  function pulse(duty) {
    var n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (var i = 1; i < n; i++) re[i] = 2 * Math.sin(i * Math.PI * duty) / (i * Math.PI);
    return ctx.createPeriodicWave(re, im);
  }

  var NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function freq(tok) {
    var m = /^([A-G])([#b]?)(-?\d)$/.exec(tok);
    if (!m) return 0;
    var n = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3], 10) + 1) * 12;
    return 440 * Math.pow(2, (n - 69) / 12);
  }

  function tone(wave, f, t, dur, vol, dest) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    if (wave === 'tri') o.type = 'triangle'; else o.setPeriodicWave(waves[wave]);
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.linearRampToValueAtTime(vol * 0.7, t + Math.min(dur * 0.5, 0.15));
    g.gain.setValueAtTime(vol * 0.7, t + dur * 0.85);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || music);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function drum(kind, t, dest) {
    dest = dest || music;
    if (kind === 'k') {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.16);
      return;
    }
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g2 = ctx.createGain();
    s.buffer = noiseBuf;
    f.type = 'highpass'; f.frequency.value = kind === 'h' ? 7000 : 1200;
    var len = kind === 'h' ? 0.04 : 0.13;
    g2.gain.setValueAtTime(kind === 'h' ? 0.25 : 0.5, t); g2.gain.exponentialRampToValueAtTime(0.001, t + len);
    s.connect(f); f.connect(g2); g2.connect(dest);
    s.start(t, Math.random() * 0.5); s.stop(t + len + 0.01);
  }

  /* ---------- Songs ---------- */
  function R(s, n) { var o = []; for (var i = 0; i < n; i++) o.push(s); return o.join(' '); }
  function bass8(root) { var lo = root + '2', hi = root + '3'; return R(lo + ' . ' + hi + ' .', 4); }
  function arp(a, b, c) { return R(a + ' ' + b + ' ' + c + ' ' + b, 4); }

  var SONGS = {
    title: {
      bpm: 92, loop: true,
      p1: 'D5 - - - - - - - A4 - - - C5 - D5 - ' + 'F5 - - - E5 - - - D5 - - - C5 - A4 - ' +
        'D5 - - - - - - - A4 - - - C5 - D5 - ' + 'E5 - - - - - F5 - E5 - D5 - C#5 - - - ' +
        'D5 - - - - - - - F5 - - - G5 - A5 - ' + 'Bb5 - - - A5 - - - G5 - - - F5 - E5 - ' +
        'F5 - - - D5 - - - E5 - - - C#5 - A4 - ' + 'D5 - - - - - - - . . . . . . . .',
      p2: 'F4 - - - - - - - - - - - - - - - ' + 'A4 - - - - - - - G4 - - - - - - - ' +
        'F4 - - - - - - - - - - - - - - - ' + 'C#4 - - - - - - - E4 - - - - - - - ' +
        'F4 - - - - - - - - - - - - - - - ' + 'D4 - - - - - - - Bb3 - - - - - - - ' +
        'A3 - - - - - - - C#4 - - - - - - - ' + 'F4 - - - - - - - . . . . . . . .',
      tri: R('D3 . D3 . A2 . D3 . D3 . D3 . A2 . C3 .', 3) + ' A2 . A2 . E2 . A2 . A2 . C#3 . E3 . A2 . ' +
        R('D3 . D3 . A2 . D3 . D3 . D3 . A2 . C3 .', 1) + ' Bb2 . Bb2 . F2 . Bb2 . G2 . G2 . D3 . G2 . ' +
        'A2 . A2 . E2 . A2 . A2 . C#3 . E3 . A2 . ' + 'D3 . D3 . A2 . D3 . D3 - - - . . . .',
      dr: R('k . . . s . . . k . k . s . . .', 8)
    },
    stage: {
      bpm: 138, loop: true,
      p1: 'A4 - . A4 C5 - . A4 E5 - - - D5 - C5 - ' + 'B4 - . G4 A4 - - - . . . . E4 - G4 - ' +
        'A4 - . A4 C5 - . A4 F5 - - - E5 - C5 - ' + 'D5 - - - B4 - G4 - D5 - - - E5 - D5 - ' +
        'C5 - - - A4 - - - E5 - - - A5 - - - ' + 'G5 - F5 - E5 - D5 - C5 - B4 - C5 - D5 - ' +
        'C5 - - - A4 - - - F5 - - - E5 - D5 - ' + 'E5 - - - - - - - G#4 - - - B4 - - -',
      p2: arp('A3', 'C4', 'E4') + ' ' + arp('A3', 'C4', 'E4') + ' ' + arp('F3', 'A3', 'C4') + ' ' + arp('G3', 'B3', 'D4') + ' ' +
        arp('A3', 'C4', 'E4') + ' ' + arp('A3', 'C4', 'E4') + ' ' + arp('F3', 'A3', 'C4') + ' ' + arp('E3', 'G#3', 'B3'),
      tri: bass8('A') + ' ' + bass8('A') + ' ' + bass8('F') + ' ' + bass8('G') + ' ' + bass8('A') + ' ' + bass8('A') + ' ' + bass8('F') + ' ' + bass8('E'),
      dr: R('k . h . s . h . k k h . s . h h', 8)
    },
    boss: {
      bpm: 160, loop: true,
      p1: 'E5 - - - B4 - - - E5 - F5 - E5 - D#5 - ' + 'E5 - - - - - - - B4 - C5 - B4 - A4 - ' +
        'G4 - - - C5 - - - E5 - - - G5 - F#5 - ' + 'F#5 - - - D#5 - - - B4 - - - F#5 - - - ' +
        'E5 - G5 - E5 - B4 - E5 - G5 - B5 - - - ' + 'A5 - G5 - F#5 - E5 - D#5 - E5 - F#5 - - - ' +
        'G5 - - - E5 - - - C5 - - - E5 - G5 - ' + 'F#5 - - - - - - - D#5 - - - B4 - - -',
      p2: R('. E4 . G4', 8) + ' ' + R('. E4 . G4', 4) + ' ' + R('. D#4 . F#4', 4) + ' ' +
        R('. E4 . G4', 8) + ' ' + R('. E4 . G4', 4) + ' ' + R('. D#4 . F#4', 4),
      tri: R('E2 E2 E3 E2', 8) + ' ' + R('C3 C3 C2 C3', 4) + ' ' + R('B2 B2 B1 B2', 4) + ' ' +
        R('E2 E2 E3 E2', 8) + ' ' + R('C3 C3 C2 C3', 4) + ' ' + R('B2 B2 B1 B2', 4),
      dr: R('k . h k s . h . k . h k s . h s', 8)
    },
    island: {
      bpm: 120, loop: true,
      p1: 'G4 - B4 - D5 - - - E5 - D5 - B4 - - - ' + 'C5 - - - A4 - - - G4 - - - - - - - ' +
        'G4 - B4 - D5 - - - G5 - F#5 - E5 - - - ' + 'D5 - - - C5 - B4 - A4 - - - - - - -',
      p2: arp('G3', 'B3', 'D4') + ' ' + arp('C4', 'E4', 'G4') + ' ' + arp('E3', 'G3', 'B3') + ' ' + arp('D3', 'F#3', 'A3'),
      tri: bass8('G') + ' ' + bass8('C') + ' ' + bass8('E') + ' ' + bass8('D'),
      dr: R('k . h . s h h . k . h k s . h .', 4)
    },
    win: {
      bpm: 150, loop: false,
      p1: 'C5 - E5 - G5 - C6 - - - G5 - C6 - - - - - - - . . . . . . . .',
      p2: 'E4 - G4 - C5 - E5 - - - C5 - E5 - - - - - - - . . . . . . . .',
      tri: 'C3 - - - G2 - - - C3 - - - G2 - C2 - - - - - - - . . . . . . . .',
      dr: 'k . . . s . . . k . s . k s s s k . . . . . . . . . . . . . . .'
    },
    over: {
      bpm: 90, loop: false,
      p1: 'A4 - - - G#4 - - - G4 - - - F#4 - - - - - - - - - - - . . . .',
      p2: 'C4 - - - B3 - - - Bb3 - - - A3 - - - - - - - - - - - . . . .',
      tri: 'A2 - - - G#2 - - - G2 - - - F#2 - - - - - - - - - - - . . . .',
      dr: 'k . . . . . . . k . . . . . . . k . . . . . . . . . . .'
    },
    dance: {
      bpm: 170, loop: false,
      p1: 'C5 C5 . C5 . A4 C5 . D5 . C5 . A4 . G4 . C5 C5 . C5 . A4 C5 . F5 - - - E5 - - -',
      p2: '. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .',
      tri: 'F2 . C3 . F2 . C3 . G2 . D3 . G2 . D3 . F2 . C3 . F2 . C3 . C3 - - - C2 - - -',
      dr: 'k . s . k . s . k . s . k s s s k . s . k . s . k . s . k s s s'
    }
  };

  function compile(s) {
    var ev = {}, len = 0;
    ['p1', 'p2', 'tri', 'dr'].forEach(function (ch) {
      var toks = s[ch].trim().split(/\s+/), list = [];
      for (var i = 0; i < toks.length; i++) {
        var t = toks[i];
        if (t === '.' || t === '-') continue;
        if (ch === 'dr') { list[i] = { d: t }; continue; }
        var n = 1; while (toks[i + n] === '-') n++;
        list[i] = { f: freq(t), n: n };
      }
      ev[ch] = { list: list, len: toks.length };
      len = Math.max(len, toks.length);
    });
    return { ev: ev, len: len };
  }

  function tick() {
    if (!ctx || !song) return;
    var sd = 60 / song.bpm / 4;
    while (nextTime < ctx.currentTime + 0.15) {
      if (!song.loop && step >= songEvents.len) { song = null; return; }
      var chans = songEvents.ev;
      for (var ch in chans) {
        var c = chans[ch], e = c.list[step % c.len];
        if (!e) continue;
        if (ch === 'dr') drum(e.d, nextTime);
        else if (ch === 'tri') tone('tri', e.f, nextTime, e.n * sd * 0.95, 0.5);
        else if (ch === 'p1') tone('p25', e.f, nextTime, e.n * sd * 0.92, 0.2);
        else tone('p125', e.f, nextTime, e.n * sd * 0.9, 0.11);
      }
      step++;
      nextTime += sd;
    }
  }

  function play(name) {
    if (!ctx) return;
    if (songName === name && song) return;
    songName = name;
    song = SONGS[name]; songEvents = compile(song); step = 0; nextTime = ctx.currentTime + 0.06;
    if (!timer) timer = setInterval(tick, 30);
  }
  function stopMusic() { song = null; songName = ''; }

  /* ---------- Effekte ---------- */
  function noise(t, dur, type, f0, f1, vol, q) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true;
    f.type = type; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    if (q) f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(sfx);
    s.start(t); s.stop(t + dur + 0.02);
  }
  function sweep(wave, t, dur, f0, f1, vol) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    if (wave === 'saw' || wave === 'square' || wave === 'triangle') o.type = wave === 'saw' ? 'sawtooth' : wave; else o.setPeriodicWave(waves[wave]);
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(sfx); o.start(t); o.stop(t + dur + 0.02);
  }

  var fx = {
    roar: function (pitch) {
      var t = ctx.currentTime, p = pitch || 1;
      [0, 7].forEach(function (det) {
        var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        o.type = 'sawtooth'; f.type = 'lowpass'; f.frequency.value = 1800; f.Q.value = 6;
        o.frequency.setValueAtTime(260 * p + det, t);
        o.frequency.linearRampToValueAtTime(520 * p + det, t + 0.35);
        o.frequency.linearRampToValueAtTime(420 * p + det, t + 0.9);
        o.frequency.linearRampToValueAtTime(180 * p + det, t + 1.5);
        g.gain.setValueAtTime(0.001, t); g.gain.linearRampToValueAtTime(0.28, t + 0.1);
        g.gain.setValueAtTime(0.28, t + 1.1); g.gain.linearRampToValueAtTime(0.001, t + 1.6);
        o.connect(f); f.connect(g); g.connect(sfx); o.start(t); o.stop(t + 1.7);
      });
      noise(t, 1.5, 'bandpass', 900 * p, 400 * p, 0.35, 3);
    },
    boom: function (big) {
      var t = ctx.currentTime;
      noise(t, big ? 0.9 : 0.4, 'lowpass', big ? 1500 : 2500, 80, big ? 0.9 : 0.5);
      sweep('triangle', t, big ? 0.5 : 0.25, 120, 30, big ? 0.7 : 0.4);
    },
    hit: function () { var t = ctx.currentTime; sweep('p50', t, 0.12, 300, 80, 0.35); noise(t, 0.1, 'highpass', 2000, 800, 0.25); },
    hurt: function () { var t = ctx.currentTime; sweep('p25', t, 0.25, 220, 60, 0.4); },
    swing: function () { var t = ctx.currentTime; noise(t, 0.18, 'bandpass', 600, 2400, 0.35, 2); },
    stomp: function () { var t = ctx.currentTime; sweep('triangle', t, 0.18, 90, 35, 0.6); },
    laser: function () { var t = ctx.currentTime; sweep('p125', t, 0.35, 1800, 300, 0.25); },
    zap: function () { var t = ctx.currentTime; sweep('p50', t, 0.4, 900, 1200, 0.18); noise(t, 0.4, 'bandpass', 3000, 1500, 0.2, 4); },
    shot: function () { var t = ctx.currentTime; noise(t, 0.08, 'bandpass', 1500, 500, 0.2, 1); },
    pickup: function () { var t = ctx.currentTime; tone('p25', 660, t, 0.08, 0.3, sfx); tone('p25', 990, t + 0.08, 0.14, 0.3, sfx); },
    select: function () { var t = ctx.currentTime; tone('p50', 880, t, 0.06, 0.25, sfx); },
    secret: function () {
      var t = ctx.currentTime;
      ['C5', 'E5', 'G5', 'C6', 'E6', 'G6'].forEach(function (n, i) { tone('p25', freq(n), t + i * 0.07, 0.1, 0.25, sfx); });
    },
    alarm: function () { var t = ctx.currentTime; for (var i = 0; i < 3; i++) { tone('p50', 880, t + i * 0.4, 0.18, 0.2, sfx); tone('p50', 660, t + i * 0.4 + 0.2, 0.18, 0.2, sfx); } },
    splat: function () { var t = ctx.currentTime; noise(t, 0.3, 'lowpass', 900, 150, 0.4); }
  };

  function sfxPlay(name, a) { if (!ctx || muted) return; try { fx[name](a); } catch (e) { } }

  function breath(on) {
    if (!ctx) return;
    if (on && !breathNode && !muted) {
      var t = ctx.currentTime;
      var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), o = ctx.createOscillator(), og = ctx.createGain();
      s.buffer = noiseBuf; s.loop = true; f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 1.5;
      g.gain.setValueAtTime(0.001, t); g.gain.linearRampToValueAtTime(0.35, t + 0.15);
      o.setPeriodicWave(waves.p125); o.frequency.setValueAtTime(110, t); o.frequency.linearRampToValueAtTime(220, t + 0.4);
      og.gain.value = 0.08;
      s.connect(f); f.connect(g); g.connect(sfx); o.connect(og); og.connect(sfx);
      s.start(t); o.start(t);
      breathNode = { s: s, o: o, g: g, og: og };
    } else if (!on && breathNode) {
      var n = breathNode, t2 = ctx.currentTime;
      n.g.gain.setTargetAtTime(0, t2, 0.05); n.og.gain.setTargetAtTime(0, t2, 0.05);
      n.s.stop(t2 + 0.3); n.o.stop(t2 + 0.3);
      breathNode = null;
    }
  }

  function toggleMute() {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : 0.5;
    if (muted) breath(false);
    return muted;
  }

  return { songs: SONGS, init: init, play: play, stop: stopMusic, sfx: sfxPlay, breath: breath, toggleMute: toggleMute, isMuted: function () { return muted; } };
})();
