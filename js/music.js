// ─────────────────────────────────────────────────────────────
// MUSIC.JS — calm ambient synth background music, generated live
// with the Web Audio API. Three original tracks, no samples, no files.
//
// Sound: slow detuned pads, a soft sine bass, a quiet plucked arpeggio
// through delay and reverb, the odd high chime, and a bed of filtered
// "rain" noise. Mixed quiet on purpose: it sits under the page.
//
// Public API (used by main.js): toggleMusic(), cycleTrack()
// Off by default; only starts from a click. Pauses when the tab is hidden.
// ─────────────────────────────────────────────────────────────

const BGM_TRACKS = [
  {
    name: 'NEON RAIN', bpm: 68, rain: 1, kick: false, hats: false,
    arpEvery: 2, arp: [0, 2, 1, 3, 2, 4, 3, 1],
    chords: [
      { bass: 45, notes: [57, 60, 64, 67, 71] },   // Am9
      { bass: 41, notes: [53, 57, 60, 64, 67] },   // Fmaj9
      { bass: 48, notes: [52, 55, 60, 62, 67] },   // Cadd9/E
      { bass: 43, notes: [55, 59, 62, 64, 69] },   // G6/9
    ],
  },
  {
    name: 'NIGHT SHIFT', bpm: 76, rain: 0.6, kick: true, hats: true,
    arpEvery: 2, arp: [0, 1, 2, 3, 4, 3, 2, 1],
    chords: [
      { bass: 38, notes: [50, 57, 60, 64, 65] },   // Dm9
      { bass: 46, notes: [53, 58, 62, 65, 69] },   // Bbmaj7
      { bass: 43, notes: [55, 58, 62, 65, 69] },   // Gm9
      { bass: 45, notes: [57, 62, 64, 67, 69] },   // A7sus4
    ],
  },
  {
    name: 'LOW ORBIT', bpm: 60, rain: 0.8, kick: false, hats: false,
    arpEvery: 4, arp: [0, 2, 4, 2],
    chords: [
      { bass: 40, notes: [52, 55, 59, 62, 66] },   // Em9
      { bass: 36, notes: [48, 52, 55, 59, 62] },   // Cmaj9
      { bass: 45, notes: [57, 60, 64, 67, 71] },   // Am9
      { bass: 47, notes: [54, 57, 59, 62, 64] },   // Bm11
    ],
  },
];

const BGM_LEVEL = 0.55;   // master level once faded in
const BAR = 16;           // steps (16th notes) per bar
const CHORD_STEPS = 32;   // two bars per chord

const hz = m => 440 * Math.pow(2, (m - 69) / 12);

// Builds the effect chain on any AudioContext (live or offline).
function bgmGraph(ctx) {
  const master = ctx.createGain(); master.gain.value = 0;
  const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 6000;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -20; comp.ratio.value = 3; comp.attack.value = 0.05; comp.release.value = 0.4;
  master.connect(tone); tone.connect(comp); comp.connect(ctx.destination);

  // reverb: generated impulse, 4.5s soft tail
  const verb = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * 4.5), imp = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = imp.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
  }
  verb.buffer = imp;
  const verbOut = ctx.createGain(); verbOut.gain.value = 0.55;
  verb.connect(verbOut); verbOut.connect(master);

  // echo for the arpeggio, darkened on every repeat
  const delay = ctx.createDelay(2), fb = ctx.createGain(), dTone = ctx.createBiquadFilter(), dOut = ctx.createGain();
  fb.gain.value = 0.34; dTone.type = 'lowpass'; dTone.frequency.value = 1800; dOut.gain.value = 0.3;
  delay.connect(dTone); dTone.connect(fb); fb.connect(delay); dTone.connect(dOut); dOut.connect(master); dOut.connect(verb);

  // shared white noise for rain and hats
  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const nd = noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  // rain bed: looping filtered noise with a slow swell
  const rain = ctx.createBufferSource(); rain.buffer = noise; rain.loop = true;
  const rHp = ctx.createBiquadFilter(); rHp.type = 'highpass'; rHp.frequency.value = 1800;
  const rLp = ctx.createBiquadFilter(); rLp.type = 'lowpass'; rLp.frequency.value = 7000;
  const rGain = ctx.createGain(); rGain.gain.value = 0;
  const lfo = ctx.createOscillator(), lfoAmt = ctx.createGain(); lfo.frequency.value = 0.07; lfoAmt.gain.value = 0.004;
  lfo.connect(lfoAmt); lfoAmt.connect(rGain.gain);
  rain.connect(rHp); rHp.connect(rLp); rLp.connect(rGain); rGain.connect(master); rGain.connect(verb);
  rain.start(); lfo.start();

  return { ctx, master, verb, delay, noise, rGain };
}

// One bus per track, so a track change can crossfade.
function bgmBus(g, track) {
  const bus = g.ctx.createGain(); bus.gain.value = 0;
  bus.connect(g.master);
  const send = g.ctx.createGain(); send.gain.value = 0.6; bus.connect(send); send.connect(g.verb);
  g.delay.delayTime.value = 3 * (60 / track.bpm / 4);   // dotted eighth
  return bus;
}

function bgmPad(g, bus, t, notes, dur) {
  const { ctx } = g;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 0.6;
  f.frequency.setValueAtTime(500, t); f.frequency.linearRampToValueAtTime(1300, t + dur * 0.5); f.frequency.linearRampToValueAtTime(600, t + dur);
  const v = ctx.createGain(), peak = 0.11 / notes.length;
  v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(peak, t + 2.4);
  v.gain.setValueAtTime(peak, t + dur - 0.3); v.gain.linearRampToValueAtTime(0, t + dur + 2.6);
  f.connect(v); v.connect(bus);
  notes.forEach(n => [-8, 7].forEach(det => {
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(n); o.detune.value = det;
    o.connect(f); o.start(t); o.stop(t + dur + 2.7);
  }));
}

function bgmBass(g, bus, t, note, dur) {
  const { ctx } = g, v = ctx.createGain();
  v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(0.16, t + 0.12);
  v.gain.exponentialRampToValueAtTime(0.07, t + dur * 0.7); v.gain.linearRampToValueAtTime(0, t + dur);
  v.connect(bus);
  [['sine', 0, 1], ['triangle', 12, 0.25]].forEach(([type, up, lvl]) => {
    const o = ctx.createOscillator(), og = ctx.createGain(); o.type = type; o.frequency.value = hz(note + up); og.gain.value = lvl;
    o.connect(og); og.connect(v); o.start(t); o.stop(t + dur + 0.05);
  });
}

function bgmPluck(g, bus, t, note, vel, toDelay) {
  const { ctx } = g, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), v = ctx.createGain();
  o.type = 'triangle'; o.frequency.value = hz(note);
  f.type = 'lowpass'; f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(700, t + 0.5);
  v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(0.045 * vel, t + 0.006); v.gain.exponentialRampToValueAtTime(0.0005, t + 0.9);
  o.connect(f); f.connect(v); v.connect(bus); if (toDelay) v.connect(g.delay);
  o.start(t); o.stop(t + 1);
}

function bgmChime(g, bus, t, note) {
  const { ctx } = g, o = ctx.createOscillator(), v = ctx.createGain();
  o.type = 'sine'; o.frequency.value = hz(note);
  v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(0.022, t + 0.01); v.gain.exponentialRampToValueAtTime(0.0003, t + 3.5);
  o.connect(v); v.connect(bus); v.connect(g.delay);
  o.start(t); o.stop(t + 3.6);
}

function bgmKick(g, bus, t) {
  const { ctx } = g, o = ctx.createOscillator(), v = ctx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(100, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
  v.gain.setValueAtTime(0.13, t); v.gain.exponentialRampToValueAtTime(0.0005, t + 0.45);
  o.connect(v); v.connect(bus); o.start(t); o.stop(t + 0.5);
}

function bgmHat(g, bus, t, vel) {
  const { ctx } = g, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), v = ctx.createGain();
  s.buffer = g.noise; f.type = 'highpass'; f.frequency.value = 7500;
  v.gain.setValueAtTime(0.009 * vel, t); v.gain.exponentialRampToValueAtTime(0.0002, t + 0.06);
  s.connect(f); f.connect(v); v.connect(bus); s.start(t, Math.random()); s.stop(t + 0.08);
}

// Schedules everything that happens on one 16th-note step.
function bgmStep(g, bus, track, step, t) {
  const sd = 60 / track.bpm / 4;
  const ci = Math.floor(step / CHORD_STEPS) % track.chords.length, chord = track.chords[ci], inChord = step % CHORD_STEPS;
  if (inChord === 0) bgmPad(g, bus, t, chord.notes, CHORD_STEPS * sd);
  if (inChord % BAR === 0) bgmBass(g, bus, t, chord.bass, (BAR - 1) * sd);
  if (step % track.arpEvery === 0) {
    const tones = chord.notes.map(n => n + 12), k = (step / track.arpEvery) % track.arp.length;
    const note = tones[track.arp[k] % tones.length];
    bgmPluck(g, bus, t, note, 0.65 + Math.random() * 0.35, k % 2 === 0);
  }
  if (inChord === 28 && Math.random() < 0.6) bgmChime(g, bus, t, chord.notes[1 + Math.floor(Math.random() * 3)] + 24);
  if (track.kick && step % 8 === 0) bgmKick(g, bus, t);
  if (track.hats && step % 4 === 2) bgmHat(g, bus, t, 0.7 + Math.random() * 0.3);
}

// ── Live player ──────────────────────────────────────────────
let musicOn = false;
let trackIdx = 0;
let bgm = null, bus = null, timer = 0, nextTime = 0, step = 0, stopT = 0;

function bgmLoop() {
  const track = BGM_TRACKS[trackIdx], sd = 60 / track.bpm / 4;
  while (nextTime < bgm.ctx.currentTime + 0.3) {
    bgmStep(bgm, bus, track, step, nextTime);
    nextTime += sd; step++;
  }
}

function bgmStartTrack(fadeIn) {
  const { ctx } = bgm, t = ctx.currentTime, track = BGM_TRACKS[trackIdx];
  bus = bgmBus(bgm, track);
  bus.gain.setValueAtTime(0, t); bus.gain.linearRampToValueAtTime(1, t + fadeIn);
  bgm.rGain.gain.cancelScheduledValues(t);
  bgm.rGain.gain.setTargetAtTime(0.012 * track.rain, t, 1.5);
  step = 0; nextTime = t + 0.1;
  clearInterval(timer); timer = setInterval(bgmLoop, 40); bgmLoop();
}

function bgmFadeBus(b, secs) {
  if (!b) return;
  const t = bgm.ctx.currentTime;
  b.gain.cancelScheduledValues(t); b.gain.setValueAtTime(b.gain.value, t); b.gain.linearRampToValueAtTime(0, t + secs);
  setTimeout(() => b.disconnect(), (secs + 3) * 1000);
}

function updateMusicLabel() {
  const textEl = document.getElementById('musicText');
  if (textEl) textEl.textContent = musicOn ? ` ${BGM_TRACKS[trackIdx].name}` : ' BGM: OFF';
}

function toggleMusic() {
  const btn = document.getElementById('musicBtn');
  if (!musicOn) {
    if (!bgm) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      bgm = bgmGraph(new AC());
    }
    clearTimeout(stopT);
    bgm.ctx.resume();
    musicOn = true;
    const t = bgm.ctx.currentTime;
    bgm.master.gain.cancelScheduledValues(t); bgm.master.gain.setValueAtTime(bgm.master.gain.value, t);
    bgm.master.gain.linearRampToValueAtTime(BGM_LEVEL, t + 3);   // slow, gentle fade in
    bgmStartTrack(0.5);
    if (btn) btn.classList.add('on');
  } else {
    musicOn = false;
    const t = bgm.ctx.currentTime;
    bgm.master.gain.cancelScheduledValues(t); bgm.master.gain.setValueAtTime(bgm.master.gain.value, t);
    bgm.master.gain.linearRampToValueAtTime(0, t + 1.2);
    clearInterval(timer);
    stopT = setTimeout(() => { if (!musicOn) bgm.ctx.suspend(); }, 1400);
    if (btn) btn.classList.remove('on');
  }
  updateMusicLabel();
}

function cycleTrack() {
  trackIdx = (trackIdx + 1) % BGM_TRACKS.length;
  if (musicOn) { bgmFadeBus(bus, 2.5); bgmStartTrack(3); }   // crossfade
  updateMusicLabel();
  const trackBtn = document.querySelector('.track-btn');
  if (trackBtn) {
    trackBtn.classList.add('flash');
    clearTimeout(trackBtn._flashTimer);
    trackBtn._flashTimer = setTimeout(() => trackBtn.classList.remove('flash'), 1200);
  }
}

// Stay quiet while the tab is in the background.
document.addEventListener('visibilitychange', () => {
  if (!bgm || !musicOn) return;
  if (document.hidden) { clearInterval(timer); bgm.ctx.suspend(); }
  else { bgm.ctx.resume().then(() => { nextTime = Math.max(nextTime, bgm.ctx.currentTime + 0.1); timer = setInterval(bgmLoop, 40); }); }
});

// Offline render used to check levels: renders `secs` of a track and
// returns its peak and RMS in dBFS. Not used by the page itself.
async function bgmMeasure(index = 0, secs = 20) {
  const ctx = new OfflineAudioContext(2, Math.floor(44100 * secs), 44100);
  const g = bgmGraph(ctx), track = BGM_TRACKS[index];
  g.master.gain.value = BGM_LEVEL;
  g.rGain.gain.value = 0.012 * track.rain;
  const b = bgmBus(g, track); b.gain.value = 1;
  const sd = 60 / track.bpm / 4;
  for (let s = 0, t = 0; t < secs; s++, t += sd) bgmStep(g, b, track, s, t);
  const buf = await ctx.startRendering();
  let peak = 0, sum = 0, n = 0;
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = Math.floor(44100 * 4); i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; sum += d[i] * d[i]; n++; }
  }
  const db = x => Math.round(20 * Math.log10(x) * 10) / 10;
  return { track: track.name, peakDb: db(peak), rmsDb: db(Math.sqrt(sum / n)) };
}
