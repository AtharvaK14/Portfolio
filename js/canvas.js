// ─────────────────────────────────────────────────────────────
// CANVAS BACKGROUND — scrolling starfield + pixel city
// 100% custom code, no external assets, no copyright concerns
// ─────────────────────────────────────────────────────────────

const canvas = document.getElementById('bg-canvas');
const ctx    = canvas.getContext('2d');

let W = canvas.width  = window.innerWidth;
let H = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  buildCity();
});

// ── Stars ──────────────────────────────────────────────────
const NUM_STARS = 150;
const stars = Array.from({ length: NUM_STARS }, () => ({
  x:     Math.random() * window.innerWidth,
  y:     Math.random() * window.innerHeight,
  r:     Math.random() * 1.8 + 0.4,
  spd:   Math.random() * 0.38 + 0.05,
  phase: Math.random() * Math.PI * 2
}));

// ── Pixel city silhouette ──────────────────────────────────
const PX = 4;
let buildings = [];

function buildCity() {
  buildings = [];
  let x = -120;
  while (x < W + 320) {
    const cols = Math.floor(Math.random() * 7) + 4;
    const rows = Math.floor(Math.random() * 14) + 5;
    const bw   = cols * PX * 2;
    const bh   = rows * PX * 2;
    const by   = H - bh;
    const wins = [];
    for (let wc = 1; wc < cols - 1; wc += 2) {
      for (let wr = 1; wr < rows - 1; wr += 2) {
        if (Math.random() > 0.42) {
          wins.push({ wx: wc * PX * 2, wy: wr * PX * 2, lit: Math.random() > 0.3 });
        }
      }
    }
    buildings.push({ x, y: by, w: bw, h: bh, wins });
    x += bw + Math.floor(Math.random() * 5) * PX;
  }
}
buildCity();

// ── Grid ───────────────────────────────────────────────────
function drawGrid() {
  ctx.strokeStyle = 'rgba(0,255,159,0.03)';
  ctx.lineWidth = 1;
  const STEP = 44;
  for (let gx = 0; gx < W; gx += STEP) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
  }
  for (let gy = 0; gy < H; gy += STEP) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
  }
}

// ── City ───────────────────────────────────────────────────
let scrollOff = 0;

function drawCity() {
  const cityW = W + 320;
  buildings.forEach(b => {
    const bx = ((b.x - scrollOff) % cityW + cityW) % cityW - 120;
    ctx.fillStyle = 'rgba(8,8,28,0.9)';
    ctx.fillRect(bx, b.y, b.w, b.h);
    ctx.strokeStyle = 'rgba(0,200,255,0.06)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, b.y, b.w, b.h);
    b.wins.forEach(w => {
      ctx.fillStyle = w.lit
        ? 'rgba(255,215,0,0.22)'
        : 'rgba(0,200,255,0.09)';
      ctx.fillRect(bx + w.wx, b.y + w.wy, PX, PX);
    });
  });
}

// ── Main loop ─────────────────────────────────────────────
let frame = 0;

function animateBg() {
  ctx.clearRect(0, 0, W, H);

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0,   '#050510');
  bg.addColorStop(0.65,'#0a0a20');
  bg.addColorStop(1,   '#040412');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  drawGrid();

  // Stars
  stars.forEach(s => {
    const tw = Math.sin(frame * 0.016 + s.phase) * 0.35 + 0.65;
    ctx.globalAlpha = tw * 0.8;
    ctx.fillStyle = '#dde8ff';
    const sr = Math.ceil(s.r);
    ctx.fillRect(Math.round(s.x), Math.round(s.y), sr, sr);
    s.x -= s.spd;
    if (s.x < -2) { s.x = W + 2; s.y = Math.random() * H * 0.72; }
  });
  ctx.globalAlpha = 1;

  // Horizon aurora
  const aur = ctx.createLinearGradient(0, H * 0.6, 0, H);
  aur.addColorStop(0,   'rgba(0,255,159,0)');
  aur.addColorStop(0.5, 'rgba(0,200,255,0.022)');
  aur.addColorStop(1,   'rgba(255,45,120,0.04)');
  ctx.fillStyle = aur;
  ctx.fillRect(0, H * 0.6, W, H * 0.4);

  drawCity();

  scrollOff += 0.45;
  frame++;
  requestAnimationFrame(animateBg);
}

animateBg();
