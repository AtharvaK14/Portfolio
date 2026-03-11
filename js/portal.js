// ─────────────────────────────────────────────────────────────────────────────
// PORTAL.JS — Animated pixel-art rift gate drawn on the #rift-gate canvas.
// Procedurally generated — no external assets, no copyright concerns.
// Style: vertical eye / diamond shape with rotating blue pixel rings and sparks.
// ─────────────────────────────────────────────────────────────────────────────
(function () {
  'use strict';

  const canvas = document.getElementById('rift-gate');
  if (!canvas || canvas.tagName !== 'CANVAS') return;

  const ctx = canvas.getContext('2d');

  // ── Grid setup ────────────────────────────────────────────────────────────
  const PX = 4;                       // physical pixels per grid cell
  const GW = canvas.width  / PX;     // grid columns (32)
  const GH = canvas.height / PX;     // grid rows   (44)
  const CX = (GW - 1) / 2;           // 15.5
  const CY = (GH - 1) / 2;           // 21.5

  // Ellipse radii in grid cells — tall narrow eye matching the gif reference
  const RX = GW * 0.40;
  const RY = GH * 0.44;

  // ── Precompute per-cell geometry ──────────────────────────────────────────
  const cells = [];
  for (let gy = 0; gy < GH; gy++) {
    for (let gx = 0; gx < GW; gx++) {
      const dx   = (gx - CX) / RX;
      const dy   = (gy - CY) / RY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ang  = Math.atan2(gy - CY, gx - CX); // -π to π
      cells.push({ gx, gy, dist, ang });
    }
  }

  // ── Stable outer sparks ───────────────────────────────────────────────────
  // Pre-select a fixed subset of cells just outside the portal rim for sparks.
  // Using a hash so they don't flicker randomly every frame.
  function hash(a, b) { return ((a * 2654435761) ^ (b * 2246822519)) >>> 0; }

  const sparkCells = cells.filter(c => {
    if (c.dist < 1.05 || c.dist > 1.45) return false;
    return (hash(c.gx, c.gy) % 100) < 22; // ~22% of rim cells become spark sites
  });

  // ── Color palette ─────────────────────────────────────────────────────────
  const C = {
    void0:  '#000610',
    void1:  '#000e20',
    inner0: '#001438',
    inner1: '#001d50',
    mid0:   '#003080',
    mid1:   '#0044aa',
    rim0:   '#0066cc',
    rim1:   '#00aaee',
    rim2:   '#44ccff',
    spark0: '#88ddff',
    spark1: '#ccf0ff',
  };

  // ── Draw ──────────────────────────────────────────────────────────────────
  let frame = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const t = frame * 0.055;

    cells.forEach(({ gx, gy, dist, ang }) => {
      if (dist > 1.05) return; // handled separately by sparkCells

      let color;

      if (dist > 0.88) {
        // ── Outer spinning rim ────────────────────────────────────────────
        // Two counter-rotating sine waves create a swirling bright-dark pattern.
        const w1 = Math.sin(ang * 2 - t * 2.1) * 0.5 + 0.5;
        const w2 = Math.sin(ang * 3 + t * 1.6) * 0.5 + 0.5;
        if      (w1 > 0.70 || w2 > 0.80) color = C.rim2;
        else if (w1 > 0.45 || w2 > 0.55) color = C.rim1;
        else if (w1 > 0.20)               color = C.rim0;
        else                              color = C.mid1;

      } else if (dist > 0.66) {
        // ── Mid ring ──────────────────────────────────────────────────────
        const w = Math.sin(ang * 2 + t * 1.3) * 0.5 + 0.5;
        color = w > 0.55 ? C.mid1 : C.mid0;

      } else if (dist > 0.38) {
        // ── Inner ring — subtle reverse spin ──────────────────────────────
        const w = Math.sin(ang * 3 - t * 1.8) * 0.5 + 0.5;
        color = w > 0.72 ? C.inner1 : C.inner0;

      } else {
        // ── Center void — very occasional glint ───────────────────────────
        const h = hash(gx + (frame >> 4), gy + 7) % 100;
        color = h < 8 ? C.inner0 : C.void0;
      }

      ctx.fillStyle = color;
      ctx.fillRect(gx * PX, gy * PX, PX, PX);
    });

    // ── Animated outer sparks ────────────────────────────────────────────────
    sparkCells.forEach(({ gx, gy, ang }) => {
      // Each spark site has a phase offset derived from its position.
      // It pulses on/off so sparks appear to travel around the rim.
      const phase  = hash(gx, gy) % 628 / 100; // 0 to 2π spread
      const bright = Math.sin(ang * 2 - t * 2.4 + phase) * 0.5 + 0.5;
      if (bright > 0.65) {
        ctx.fillStyle = bright > 0.85 ? C.spark1 : C.spark0;
        ctx.fillRect(gx * PX, gy * PX, PX, PX);
      }
    });

    frame++;
    requestAnimationFrame(draw);
  }

  draw();
})();
