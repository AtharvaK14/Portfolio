// ─────────────────────────────────────────────────────────────────────────────
// JET.JS — Player-controlled pixel jet for portfolio navigation
// Arrow keys move the jet; vertical edge zones scroll the page.
// When the jet enters the rift portal, the mini-game starts.
// Touch devices: jet is hidden; the rift portal shows a TAP button instead.
// ─────────────────────────────────────────────────────────────────────────────
(function () {
  'use strict';

  // ── Touch guard ──────────────────────────────────────────────────────────
  const IS_TOUCH = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Always add body class so CSS can show/hide elements per device type
  if (IS_TOUCH) document.body.classList.add('touch-device');

  // Expose the sprite draw function for game.js regardless of device
  // (game.js uses it to render the player ship)

  // ── Pixel art jet sprite ─────────────────────────────────────────────────
  // 0 = transparent  1 = hull (steel)  2 = cockpit (blue)  3 = engine (orange)
  const JET_PIX = [
    [0, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 1, 2, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0, 0],
    [0, 1, 0, 0, 1, 0, 0, 1, 0],
    [0, 0, 0, 0, 3, 0, 0, 0, 0],
  ];
  const COLS_JET = JET_PIX[0].length;
  const ROWS_JET = JET_PIX.length;

  /**
   * Shared draw function — used by jet.js (navigation) and game.js (player ship).
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x  centre x
   * @param {number} y  centre y
   * @param {number} angle  banking angle in radians
   * @param {number} scale  pixels per sprite cell
   */
  window.drawJetAt = function (ctx, x, y, angle, scale) {
    const s = scale || 3;
    const ox = Math.floor(COLS_JET / 2) * s;
    const oy = Math.floor(ROWS_JET / 2) * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle || 0);
    JET_PIX.forEach((row, ry) => {
      row.forEach((cell, cx) => {
        if (!cell) return;
        if      (cell === 2) ctx.fillStyle = '#00c8ff';
        else if (cell === 3) ctx.fillStyle = `hsl(${20 + Math.sin(Date.now() * 0.012) * 18},100%,55%)`;
        else                 ctx.fillStyle = '#b8cce4';
        ctx.fillRect(cx * s - ox, ry * s - oy, s, s);
      });
    });
    ctx.restore();
  };

  // On touch devices the jet is not active — stop here
  if (IS_TOUCH) return;

  // ── Canvas setup ─────────────────────────────────────────────────────────
  const cvs = document.createElement('canvas');
  cvs.id = 'jet-canvas';
  Object.assign(cvs.style, {
    position: 'fixed', inset: '0',
    width: '100%', height: '100%',
    zIndex: '500',
    pointerEvents: 'none',   // clicks pass through to page content
  });
  document.body.appendChild(cvs);
  const ctx = cvs.getContext('2d');

  let W = (cvs.width  = window.innerWidth);
  let H = (cvs.height = window.innerHeight);
  window.addEventListener('resize', () => {
    W = cvs.width  = window.innerWidth;
    H = cvs.height = window.innerHeight;
  });

  // ── Jet state ─────────────────────────────────────────────────────────
  const jet = {
    x: W * 0.5, y: H * 0.5,
    vx: 0, vy: 0,
    angle: 0,       // banking tilt (radians)
    particles: [],
    visible: true,
  };

  window.hideJet = () => { jet.visible = false; };
  window.showJet = () => {
    jet.visible = true;
    jet.x = W * 0.5;
    jet.y = H * 0.5;
    jet.vx = jet.vy = 0;
  };

  // ── Input ────────────────────────────────────────────────────────────
  const keys = {};
  const ARROWS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

  document.addEventListener('keydown', e => {
    if (window.gameActive) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (ARROWS.includes(e.key)) {
      e.preventDefault();   // stop browser from scrolling with arrow keys
      keys[e.key] = true;
    }
  });
  document.addEventListener('keyup', e => { keys[e.key] = false; });

  // ── Thrust particles ──────────────────────────────────────────────────
  function addParticle() {
    const spread = 0.55;
    const ang = jet.angle + Math.PI + (Math.random() - 0.5) * spread;
    const spd = Math.random() * 3.5 + 1.5;
    jet.particles.push({
      x: jet.x,
      y: jet.y,
      vx: Math.sin(ang) * spd,
      vy: -Math.cos(ang) * spd,
      life: 1,
      decay: Math.random() * 0.05 + 0.04,
      sz: Math.random() * 3.5 + 1,
    });
  }

  // ── Warp / rift entry effect ──────────────────────────────────────────
  let riftCooldown = 0;

  function warpAndStart() {
    if (typeof window.startGame !== 'function') return;
    riftCooldown = 180;
    let alpha = 0, direction = 1, pulses = 0;
    (function flash() {
      if (!jet.visible) return;               // aborted
      ctx.clearRect(0, 0, W, H);
      // Render jet with flash overlay
      ctx.save();
      ctx.shadowColor = '#00ff9f';
      ctx.shadowBlur = 20 + alpha * 40;
      window.drawJetAt(ctx, jet.x | 0, jet.y | 0, jet.angle, 3);
      ctx.restore();
      ctx.fillStyle = `rgba(0,255,159,${alpha * 0.55})`;
      ctx.fillRect(0, 0, W, H);

      alpha += direction * 0.07;
      if (alpha >= 1) { direction = -1; }
      if (alpha < 0 && direction === -1) {
        pulses++;
        if (pulses < 2) { direction = 1; requestAnimationFrame(flash); }
        else { window.startGame(); }
        return;
      }
      requestAnimationFrame(flash);
    })();
  }

  function checkRift() {
    if (riftCooldown > 0) { riftCooldown--; return; }
    const rift = document.getElementById('rift-gate');
    if (!rift) return;
    const r = rift.getBoundingClientRect();
    if (jet.x > r.left && jet.x < r.right &&
        jet.y > r.top  && jet.y < r.bottom) {
      warpAndStart();
    }
  }

  // ── Physics update ────────────────────────────────────────────────────
  const ACCEL      = 0.55;
  const FRICTION   = 0.83;
  const MAX_SPEED  = 8;
  const SCROLL_SPD = 10;

  function update() {
    if (!jet.visible || window.gameActive) return;

    let thrusting = false;

    if (keys['ArrowUp'])    { jet.vy -= ACCEL; thrusting = true; }
    if (keys['ArrowDown'])  { jet.vy += ACCEL; thrusting = true; }
    if (keys['ArrowLeft'])  { jet.vx -= ACCEL; thrusting = true; }
    if (keys['ArrowRight']) { jet.vx += ACCEL; thrusting = true; }

    jet.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, jet.vx)) * FRICTION;
    jet.vy = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, jet.vy)) * FRICTION;

    jet.x += jet.vx;
    jet.y += jet.vy;

    // Smooth banking based on horizontal velocity
    const targetAngle = jet.vx * 0.09;
    jet.angle += (targetAngle - jet.angle) * 0.14;

    // Edge-triggered page scroll
    if (jet.y < H * 0.22 && keys['ArrowUp'])   window.scrollBy({ top: -SCROLL_SPD, behavior: 'auto' });
    if (jet.y > H * 0.78 && keys['ArrowDown'])  window.scrollBy({ top:  SCROLL_SPD, behavior: 'auto' });

    // Clamp to viewport
    jet.x = Math.max(26, Math.min(W - 26, jet.x));
    jet.y = Math.max(26, Math.min(H - 26, jet.y));

    // Particles
    if (thrusting || Math.abs(jet.vx) + Math.abs(jet.vy) > 0.6) addParticle();
    jet.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life -= p.decay;
    });
    jet.particles = jet.particles.filter(p => p.life > 0);

    checkRift();
  }

  // ── Hint text ─────────────────────────────────────────────────────────
  let hintAlpha   = 1;
  let hintFading  = false;
  setTimeout(() => { hintFading = true; }, 5500);
  document.addEventListener('keydown', e => {
    if (ARROWS.includes(e.key)) { hintFading = true; }
  });

  // ── Render ────────────────────────────────────────────────────────────
  function render() {
    ctx.clearRect(0, 0, W, H);
    if (!jet.visible || window.gameActive) return;

    // Thrust trail
    jet.particles.forEach(p => {
      ctx.globalAlpha = p.life * 0.88;
      ctx.fillStyle   = p.life > 0.55 ? '#ff7a00' : '#ff2d78';
      ctx.fillRect(p.x | 0, p.y | 0, p.sz | 0, p.sz | 0);
    });
    ctx.globalAlpha = 1;

    // Jet with glow
    ctx.save();
    ctx.shadowColor = '#00c8ff';
    ctx.shadowBlur  = 16;
    window.drawJetAt(ctx, jet.x | 0, jet.y | 0, jet.angle, 3);
    ctx.restore();

    // Control hint
    if (hintFading) hintAlpha = Math.max(0, hintAlpha - 0.007);
    if (hintAlpha > 0) {
      ctx.save();
      ctx.globalAlpha  = hintAlpha * 0.75;
      ctx.fillStyle    = '#00ff9f';
      ctx.font         = '10px "Press Start 2P"';
      ctx.textAlign    = 'center';
      ctx.shadowColor  = '#00ff9f';
      ctx.shadowBlur   = 8;
      ctx.fillText('ARROW KEYS TO FLY YOUR JET', W * 0.5, H - 36);
      ctx.restore();
    }
  }

  // ── Main loop ─────────────────────────────────────────────────────────
  (function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  })();

})();
