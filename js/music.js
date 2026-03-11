// ─────────────────────────────────────────────────────────────
// CHIPTUNE ENGINE — 4 original tracks via Web Audio API
// All melodies composed fresh, no samples, no copyright
// ─────────────────────────────────────────────────────────────

let audioCtx  = null;
let musicOn   = false;
let loopId    = null;
let noteIdx   = 0;
let trackIdx  = 0;

// Note frequency table
const N = {
  // Octave 3
  C3:130.81, D3:146.83, E3:164.81, F3:174.61, G3:196.00, A3:220.00, B3:246.94,
  // Octave 4
  C4:261.63, D4:293.66, E4:329.63, F4:349.23, G4:392.00, A4:440.00, B4:493.88,
  Bb4:466.16, Eb4:311.13, Ab4:415.30,
  // Octave 5
  C5:523.25, D5:587.33, E5:659.25, F5:698.46, G5:783.99, A5:880.00,
  Bb5:932.33, Eb5:622.25,
  R: 0  // rest
};

// ── TRACK DEFINITIONS ─────────────────────────────────────
// Each entry: [frequency, duration_ms]
// R = rest

const TRACKS = [

  // ── Track 0: "Adventure" — bright G-major pentatonic ──
  {
    name: 'ADVENTURE',
    waveform: 'square',
    volume: 0.065,
    notes: [
      [N.G4,140],[N.A4,140],[N.B4,180],[N.R,80],
      [N.D5,160],[N.B4,140],[N.G4,200],[N.R,120],
      [N.A4,140],[N.G4,140],[N.E5,200],[N.R,80],
      [N.D5,160],[N.B4,160],[N.A4,220],[N.R,180],
      [N.G4,120],[N.B4,120],[N.D5,120],[N.E5,160],[N.R,80],
      [N.G5,280],[N.R,120],
      [N.E5,140],[N.D5,140],[N.B4,160],[N.R,80],
      [N.A4,160],[N.G4,260],[N.R,420],
    ]
  },

  // ── Track 1: "Boss Battle" — fast, intense D-minor ──
  {
    name: 'BOSS BATTLE',
    waveform: 'sawtooth',
    volume: 0.055,
    notes: [
      [N.D4,80],[N.R,30],[N.D4,80],[N.R,30],[N.F4,100],[N.R,30],
      [N.A4,80],[N.R,30],[N.G4,80],[N.R,30],[N.F4,80],[N.R,60],
      [N.E4,80],[N.R,30],[N.E4,80],[N.R,30],[N.G4,100],[N.R,30],
      [N.Bb4,80],[N.R,30],[N.A4,80],[N.R,30],[N.G4,80],[N.R,60],
      [N.D5,120],[N.R,40],[N.C5,120],[N.R,40],
      [N.Bb4,120],[N.R,40],[N.A4,180],[N.R,80],
      [N.G4,80],[N.A4,80],[N.Bb4,80],[N.A4,80],[N.G4,80],[N.F4,80],
      [N.D4,200],[N.R,300],
    ]
  },

  // ── Track 2: "Chill Town" — slow, warm C-major ──
  {
    name: 'CHILL TOWN',
    waveform: 'triangle',
    volume: 0.08,
    notes: [
      [N.C4,220],[N.E4,220],[N.G4,260],[N.R,120],
      [N.A4,220],[N.G4,180],[N.E4,280],[N.R,180],
      [N.F4,220],[N.A4,220],[N.C5,260],[N.R,120],
      [N.B4,180],[N.A4,180],[N.G4,320],[N.R,200],
      [N.G4,200],[N.A4,200],[N.C5,200],[N.E5,260],[N.R,120],
      [N.D5,200],[N.C5,200],[N.A4,300],[N.R,180],
      [N.G4,200],[N.E4,200],[N.C4,200],[N.G3,320],[N.R,500],
    ]
  },

  // ── Track 3: "Dungeon" — eerie A-minor, slow and dark ──
  {
    name: 'DUNGEON',
    waveform: 'square',
    volume: 0.055,
    notes: [
      [N.A3,260],[N.R,100],[N.C4,260],[N.R,100],
      [N.E4,300],[N.R,140],[N.Eb4,300],[N.R,220],
      [N.D4,240],[N.R,100],[N.C4,240],[N.R,100],
      [N.B3,340],[N.R,300],
      [N.A3,260],[N.R,100],[N.E4,260],[N.R,100],
      [N.G4,300],[N.R,140],[N.F4,300],[N.R,220],
      [N.E4,260],[N.D4,260],[N.C4,300],[N.R,160],
      [N.A3,400],[N.R,500],
    ]
  }

];

// ── Playback engine ───────────────────────────────────────

function ensureContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function chipNote(freq, durMs) {
  if (!audioCtx || !musicOn || freq === 0) return;
  const track  = TRACKS[trackIdx];
  const osc    = audioCtx.createOscillator();
  const env    = audioCtx.createGain();
  const master = audioCtx.createGain();

  master.gain.value = track.volume;
  osc.type = track.waveform;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  env.gain.setValueAtTime(0.85, audioCtx.currentTime);
  env.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + durMs / 1000 * 0.82);

  osc.connect(env);
  env.connect(master);
  master.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + durMs / 1000);
}

function playStep() {
  if (!musicOn) return;
  const notes  = TRACKS[trackIdx].notes;
  const [freq, dur] = notes[noteIdx % notes.length];
  chipNote(freq, dur);
  noteIdx++;
  loopId = setTimeout(playStep, dur + 20);
}

function stopPlayback() {
  musicOn = false;
  clearTimeout(loopId);
  loopId = null;
}

// ── Public API ────────────────────────────────────────────

function toggleMusic() {
  ensureContext();
  const btn    = document.getElementById('musicBtn');
  const textEl = document.getElementById('musicText');

  if (!musicOn) {
    musicOn = true;
    noteIdx = 0;
    if (btn) btn.classList.add('on');
    updateMusicLabel();
    playStep();
  } else {
    stopPlayback();
    if (btn) btn.classList.remove('on');
    if (textEl) textEl.textContent = ' BGM: OFF';
  }
}

function cycleTrack() {
  ensureContext();
  const wasOn = musicOn;
  if (wasOn) { stopPlayback(); }
  trackIdx = (trackIdx + 1) % TRACKS.length;
  noteIdx  = 0;
  if (wasOn) {
    musicOn = true;
    const btn = document.getElementById('musicBtn');
    if (btn) btn.classList.add('on');
    playStep();
  }
  updateMusicLabel();

  // Brief flash on the NEXT button so it acknowledges the tap, then clears.
  // On desktop CSS :hover handles feedback; on mobile :hover sticks forever.
  const trackBtn = document.querySelector('.track-btn');
  if (trackBtn) {
    trackBtn.classList.add('flash');
    clearTimeout(trackBtn._flashTimer);
    trackBtn._flashTimer = setTimeout(() => {
      trackBtn.classList.remove('flash');
    }, 1200);
  }
}

function updateMusicLabel() {
  const textEl = document.getElementById('musicText');
  if (textEl) {
    textEl.textContent = musicOn ? ` ${TRACKS[trackIdx].name}` : ' BGM: OFF';
  }
}