// ─────────────────────────────────────────────────────────────────────────────
// GAME.JS — Space Invaders mini-game
// Triggered when the player's jet flies into the rift portal.
// Full-screen canvas overlay; same jet sprite used as the player ship.
// Exposes: window.startGame(), window.exitGame()
// ─────────────────────────────────────────────────────────────────────────────
(function () {
  'use strict';

  const IS_TOUCH = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // ── Canvas overlay ───────────────────────────────────────────────────────
  const cvs = document.createElement('canvas');
  cvs.id    = 'game-canvas';
  Object.assign(cvs.style, {
    position: 'fixed', inset: '0',
    width: '100%', height: '100%',
    zIndex: '8000',
    display: 'none',
    background: '#050510',
  });
  document.body.appendChild(cvs);
  const ctx = cvs.getContext('2d');

  function resize() {
    cvs.width  = window.innerWidth;
    cvs.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', () => { resize(); if (phase === 'playing') initPositions(); });

  const GW = () => cvs.width;
  const GH = () => cvs.height;

  // ── Layout constants ──────────────────────────────────────────────────────
  const HUD_H      = 58;   // pixels reserved for HUD at top
  const E_COLS     = 10;   // enemy columns
  const E_ROWS     = 4;    // enemy rows
  const E_SCALE    = 3;    // sprite pixels per cell
  const E_CW       = 46;   // enemy cell width  (sprite + horizontal padding)
  const E_CH       = 38;   // enemy cell height (sprite + vertical padding)
  const P_SCALE    = 3;    // player sprite scale
  const P_HALF     = 16;   // player bounding half-width for movement clamp
  const P_OFFSET_Y = 76;   // player Y from bottom of screen

  // ── Pixel art sprites ─────────────────────────────────────────────────────
  // Enemy Type A — top 2 rows — squid (30 pts)
  const EA_F1 = [
    [0, 0, 1, 0, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [1, 1, 0, 1, 0, 1, 1],
    [0, 1, 0, 0, 0, 1, 0],
  ];
  const EA_F2 = [
    [0, 0, 1, 0, 1, 0, 0],
    [1, 0, 0, 1, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [0, 1, 0, 1, 0, 1, 0],
    [1, 0, 1, 0, 1, 0, 1],
  ];
  // Enemy Type B — bottom 2 rows — crab (10 pts)
  const EB_F1 = [
    [0, 1, 0, 0, 0, 1, 0],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 0, 1, 1, 0],
    [0, 0, 1, 0, 1, 0, 0],
  ];
  const EB_F2 = [
    [0, 1, 0, 0, 0, 1, 0],
    [0, 0, 1, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 1, 0, 1, 1],
    [0, 0, 1, 0, 1, 0, 0],
  ];
  // UFO (100 pts)
  const UFO_PIX = [
    [0, 0, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [1, 0, 1, 0, 1, 0, 1],
    [0, 1, 1, 1, 1, 1, 0],
  ];

  /** Draw a pixel-art sprite centred at (x, y). */
  function drawSprite(sprite, x, y, scale, color) {
    const cols = sprite[0].length;
    const rows = sprite.length;
    const ox   = Math.floor(cols / 2) * scale;
    const oy   = Math.floor(rows / 2) * scale;
    ctx.fillStyle = color;
    sprite.forEach((row, ry) => {
      row.forEach((cell, cx) => {
        if (cell) ctx.fillRect(x + cx * scale - ox, y + ry * scale - oy, scale, scale);
      });
    });
  }

  // ── Game state ────────────────────────────────────────────────────────────
  let phase       = 'idle';  // idle | intro | playing | gameover | victory
  let score, lives, frameN, raf;
  let player, enemies, pBullets, eBullets, barriers, ufo;
  let enemyDX, enemyShootTimer, ufoTimer, explosions;
  let shootCD;
  let hitFlash;  // frames remaining for screen flash

  // ── Input ─────────────────────────────────────────────────────────────────
  const gKeys = {};
  document.addEventListener('keydown', e => {
    if (!window.gameActive) return;
    gKeys[e.key] = true;
    if ([' ', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
  });
  document.addEventListener('keyup', e => { gKeys[e.key] = false; });

  // Touch / click state
  const touch = { left: false, right: false, fire: false };

  cvs.addEventListener('click', handleClick);
  cvs.addEventListener('touchstart',  e => { e.preventDefault(); Array.from(e.changedTouches).forEach(t => handleTouchPt(t.clientX, t.clientY)); }, { passive: false });
  cvs.addEventListener('touchend',    e => { e.preventDefault(); touch.left = touch.right = touch.fire = false; }, { passive: false });
  cvs.addEventListener('touchmove',   e => {
    e.preventDefault();
    touch.left = touch.right = touch.fire = false;
    Array.from(e.changedTouches).forEach(t => handleTouchPt(t.clientX, t.clientY));
  }, { passive: false });

  function handleTouchPt(tx, ty) {
    const w = GW(), h = GH();
    // Exit button
    if (tx > w - 140 && ty < HUD_H) { window.exitGame(); return; }
    // Gameover / victory: tap to exit
    if (phase === 'gameover' || phase === 'victory') { window.exitGame(); return; }
    // Intro: tap to skip wait
    if (phase === 'intro') return;
    // Touch zones at bottom
    if (ty > h - 110) {
      const t3 = w / 3;
      if (tx < t3)          { touch.left  = true; }
      else if (tx > t3 * 2) { touch.right = true; }
      else                  { touch.fire  = true; }
    }
  }

  function handleClick(e) {
    const r  = cvs.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    if (mx > GW() - 140 && my < HUD_H) { window.exitGame(); return; }
    if (phase === 'gameover' || phase === 'victory') { window.exitGame(); }
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function initGame() {
    const w = GW(), h = GH();
    score   = 0;
    lives   = 3;
    frameN  = 0;
    shootCD = 0;
    enemyShootTimer = 60;
    ufoTimer = 900 + (Math.random() * 400) | 0;
    hitFlash = 0;
    explosions = [];

    // Player ship
    player = { x: w * 0.5, y: h - P_OFFSET_Y, invincible: 0 };

    initEnemies();

    // Bullets
    pBullets = [];
    eBullets = [];

    // Barriers — 3 shields evenly spaced
    barriers = [];
    const bYBase   = h - 160;
    const bCols    = 6;
    const bRows    = 3;
    const bStep    = 10;
    const bOffsets = [w * 0.22, w * 0.5, w * 0.78];
    bOffsets.forEach(bx => {
      const startX = bx - ((bCols - 1) * bStep) * 0.5;
      for (let br = 0; br < bRows; br++) {
        for (let bc = 0; bc < bCols; bc++) {
          barriers.push({ x: startX + bc * bStep, y: bYBase + br * bStep, hp: 3 });
        }
      }
    });

    // UFO
    ufo = { active: false, x: 0, y: HUD_H + 26, dir: 1 };

    enemyDX = 1;
    phase   = 'playing';
  }

  function initEnemies() {
    const w = GW();
    enemies = [];
    const startX = (w - E_COLS * E_CW) * 0.5 + E_CW * 0.5;
    const startY = HUD_H + 70;
    for (let r = 0; r < E_ROWS; r++) {
      for (let c = 0; c < E_COLS; c++) {
        enemies.push({
          x: startX + c * E_CW,
          y: startY + r * E_CH,
          type:  r < 2 ? 'A' : 'B',
          frame: 0,
          alive: true,
          pts:   r < 2 ? 30 : 10,
        });
      }
    }
  }

  function initPositions() {
    const w = GW(), h = GH();
    player.x = w * 0.5;
    player.y = h - P_OFFSET_Y;
    initEnemies();
    pBullets = [];
    eBullets = [];
  }

  // ── Update ────────────────────────────────────────────────────────────────
  function update() {
    if (phase !== 'playing') return;
    frameN++;

    const w = GW(), h = GH();
    const leftDown  = gKeys['ArrowLeft']  || gKeys['a'] || touch.left;
    const rightDown = gKeys['ArrowRight'] || gKeys['d'] || touch.right;
    const fireDown  = gKeys[' '] || gKeys['z'] || touch.fire;

    // Player movement
    if (leftDown)  player.x = Math.max(P_HALF + 8,     player.x - 5);
    if (rightDown) player.x = Math.min(w - P_HALF - 8, player.x + 5);

    // Fire — hold space for continuous fire, rate-limited by shootCD
    if (fireDown && shootCD <= 0 && pBullets.length < 3) {
      pBullets.push({ x: player.x, y: player.y - 22 });
      shootCD = 10;
    }
    if (shootCD > 0) shootCD--;
    if (player.invincible > 0) player.invincible--;
    if (hitFlash > 0) hitFlash--;

    // Bullets
    pBullets.forEach(b => { b.y -= 11; });
    pBullets = pBullets.filter(b => b.y > HUD_H);
    eBullets.forEach(b => { b.y += 5; });
    eBullets = eBullets.filter(b => b.y < h);

    // Enemies
    const alive = enemies.filter(e => e.alive);
    if (alive.length === 0) { phase = 'victory'; return; }

    // Speed ramps as enemies die
    const speed = 0.95 + (E_COLS * E_ROWS - alive.length) * 0.07;

    // Find horizontal extent
    let minX = Infinity, maxX = -Infinity;
    alive.forEach(e => { if (e.x < minX) minX = e.x; if (e.x > maxX) maxX = e.x; });

    const pad = E_CW * 0.5 + 12;
    let hitEdge = (enemyDX > 0 && maxX + E_CW * 0.5 + speed > w - pad) ||
                  (enemyDX < 0 && minX - E_CW * 0.5 - speed < pad);

    if (hitEdge) {
      enemyDX *= -1;
      enemies.forEach(e => { if (e.alive) e.y += 16; });
    } else {
      enemies.forEach(e => { if (e.alive) e.x += enemyDX * speed; });
    }

    // Animate enemy sprites every 22 frames
    if (frameN % 22 === 0) enemies.forEach(e => { if (e.alive) e.frame ^= 1; });

    // Enemy shooting
    enemyShootTimer--;
    if (enemyShootTimer <= 0) {
      const byCol = {};
      alive.forEach(e => {
        const col = Math.round(e.x);
        if (!byCol[col] || e.y > byCol[col].y) byCol[col] = e;
      });
      const shooters = Object.values(byCol);
      const s = shooters[(Math.random() * shooters.length) | 0];
      if (s) eBullets.push({ x: s.x, y: s.y + 14 });
      const interval = Math.max(25, 85 - alive.length * 1.8);
      enemyShootTimer = (interval + Math.random() * interval) | 0;
    }

    // UFO
    ufoTimer--;
    if (ufoTimer <= 0 && !ufo.active) {
      ufo.active = true;
      ufo.dir    = Math.random() > 0.5 ? 1 : -1;
      ufo.x      = ufo.dir > 0 ? -70 : w + 70;
    }
    if (ufo.active) {
      ufo.x += ufo.dir * 3.2;
      if (ufo.x < -90 || ufo.x > w + 90) {
        ufo.active = false;
        ufoTimer   = (1100 + Math.random() * 600) | 0;
      }
    }

    // Collisions: player bullets
    pBullets = pBullets.filter(b => {
      let hit = false;
      // vs enemies
      for (const e of enemies) {
        if (!e.alive) continue;
        if (Math.abs(b.x - e.x) < E_CW * 0.5 - 3 &&
            Math.abs(b.y - e.y) < E_CH * 0.5 - 2) {
          e.alive = false;
          score  += e.pts;
          hit     = true;
          spawnExplosion(e.x, e.y, '#00ff9f');
          break;
        }
      }
      // vs UFO
      if (!hit && ufo.active &&
          Math.abs(b.x - ufo.x) < 28 &&
          Math.abs(b.y - ufo.y) < 18) {
        ufo.active = false;
        ufoTimer   = 1300;
        score     += 100;
        hit        = true;
        spawnExplosion(ufo.x, ufo.y, '#ffd700');
      }
      // vs barriers
      if (!hit) {
        for (const br of barriers) {
          if (br.hp <= 0) continue;
          if (Math.abs(b.x - br.x) < 7 && Math.abs(b.y - br.y) < 7) {
            br.hp--; hit = true; break;
          }
        }
      }
      return !hit;
    });

    // Collisions: enemy bullets vs player
    if (player.invincible <= 0) {
      eBullets = eBullets.filter(b => {
        const hit = Math.abs(b.x - player.x) < 19 &&
                    Math.abs(b.y - player.y) < 19;
        if (hit) {
          lives--;
          hitFlash          = 28;
          player.invincible = 130;
          spawnExplosion(player.x, player.y, '#ff2d78');
          if (lives <= 0) { lives = 0; phase = 'gameover'; }
        }
        return !hit;
      });
    }

    // Collisions: enemy bullets vs barriers
    eBullets = eBullets.filter(b => {
      for (const br of barriers) {
        if (br.hp <= 0) continue;
        if (Math.abs(b.x - br.x) < 7 && Math.abs(b.y - br.y) < 7) {
          br.hp--;
          return false;
        }
      }
      return true;
    });

    // Enemy reaches player line
    const lowest = alive.reduce((m, e) => e.y > m.y ? e : m, { y: 0 });
    if (lowest.y >= player.y - 28) phase = 'gameover';

    // Explosions
    explosions.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life -= p.decay;
    });
    explosions = explosions.filter(p => p.life > 0);
  }

  // ── Explosions ────────────────────────────────────────────────────────────
  function spawnExplosion(x, y, color) {
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * 4 + 1;
      explosions.push({
        x, y,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: 1, decay: 0.035 + Math.random() * 0.04,
        sz: Math.random() * 4 + 2,
        color: Math.random() > 0.5 ? color : '#ffd700',
      });
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  function render() {
    const w = GW(), h = GH();

    // Background
    ctx.fillStyle = hitFlash > 0 ? 'rgba(255,45,120,0.12)' : '#050510';
    ctx.fillRect(0, 0, w, h);

    // Background grid
    ctx.strokeStyle = 'rgba(0,255,159,0.035)';
    ctx.lineWidth   = 1;
    for (let gx = 0; gx < w; gx += 44) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
    for (let gy = HUD_H; gy < h; gy += 44) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }

    // HUD separator
    ctx.strokeStyle = '#00ff9f';
    ctx.lineWidth   = 2;
    ctx.beginPath(); ctx.moveTo(0, HUD_H); ctx.lineTo(w, HUD_H); ctx.stroke();

    // Score
    ctx.fillStyle = '#00ff9f';
    ctx.font      = '11px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE: ' + String(score).padStart(5, '0'), 20, 38);

    // Lives
    ctx.font      = '13px "Press Start 2P"';
    ctx.textAlign = 'center';
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < lives ? '#ff2d78' : 'rgba(255,45,120,0.2)';
      ctx.fillText(i < lives ? '♥' : '♡', w * 0.5 - 30 + i * 34, 38);
    }

    // EXIT button
    const ebX = w - 138, ebY = 8, ebW = 124, ebH = 42;
    ctx.strokeStyle = '#ff2d78';
    ctx.lineWidth   = 1;
    ctx.strokeRect(ebX, ebY, ebW, ebH);
    ctx.fillStyle   = 'rgba(255,45,120,0.1)';
    ctx.fillRect(ebX, ebY, ebW, ebH);
    ctx.fillStyle   = '#ff2d78';
    ctx.font        = '8px "Press Start 2P"';
    ctx.textAlign   = 'center';
    ctx.fillText('EXIT GAME', ebX + ebW * 0.5, ebY + ebH * 0.5 + 4);

    if (phase === 'intro') { renderIntro(); return; }

    // ── Game elements ──────────────────────────────────────────────────────

    // Barriers
    barriers.forEach(br => {
      if (br.hp <= 0) return;
      ctx.fillStyle = `rgba(0,255,159,${0.3 + br.hp * 0.22})`;
      ctx.fillRect(br.x - 5, br.y - 5, 10, 10);
    });

    // Enemies
    enemies.forEach(e => {
      if (!e.alive) return;
      const spr   = e.type === 'A' ? (e.frame ? EA_F2 : EA_F1) : (e.frame ? EB_F2 : EB_F1);
      const color = e.type === 'A' ? '#00ff9f' : '#ff2d78';
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur  = 6;
      drawSprite(spr, e.x | 0, e.y | 0, E_SCALE, color);
      ctx.restore();
    });

    // UFO
    if (ufo.active) {
      ctx.save();
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur  = 14;
      drawSprite(UFO_PIX, ufo.x | 0, ufo.y, 4, '#ffd700');
      ctx.restore();
      ctx.fillStyle  = '#ffd700';
      ctx.font       = '7px "Press Start 2P"';
      ctx.textAlign  = 'center';
      ctx.fillText('?? PTS', ufo.x | 0, ufo.y + 22);
    }

    // Player (blink while invincible)
    const showPlayer = player.invincible <= 0 || Math.floor(player.invincible / 5) % 2 === 0;
    if (showPlayer) {
      ctx.save();
      ctx.shadowColor = '#00c8ff';
      ctx.shadowBlur  = 18;
      if (window.drawJetAt) {
        window.drawJetAt(ctx, player.x | 0, player.y | 0, 0, P_SCALE);
      } else {
        ctx.fillStyle = '#00c8ff';
        ctx.fillRect(player.x - 8, player.y - 12, 16, 24);
      }
      ctx.restore();
    }

    // Player bullets
    pBullets.forEach(b => {
      ctx.fillStyle = 'rgba(0,255,159,0.25)';
      ctx.fillRect(b.x - 3, b.y, 6, 14);
      ctx.fillStyle = '#00ff9f';
      ctx.fillRect(b.x - 1, b.y, 3, 14);
    });

    // Enemy bullets
    eBullets.forEach(b => {
      ctx.fillStyle = '#ff2d78';
      ctx.fillRect(b.x - 1, b.y, 3, 12);
    });

    // Explosions
    explosions.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle   = p.color;
      ctx.fillRect(p.x | 0, p.y | 0, p.sz | 0, p.sz | 0);
    });
    ctx.globalAlpha = 1;

    // Overlay screens
    if (phase === 'gameover') renderGameOver();
    if (phase === 'victory')  renderVictory();

    // Mobile on-screen controls
    if (IS_TOUCH && phase === 'playing') renderTouchControls();
  }

  function renderIntro() {
    const w = GW(), h = GH();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, HUD_H, w, h - HUD_H);
    ctx.save();
    ctx.shadowColor = '#00ff9f';
    ctx.shadowBlur  = 24;
    ctx.fillStyle   = '#00ff9f';
    ctx.font        = '18px "Press Start 2P"';
    ctx.textAlign   = 'center';
    ctx.fillText('ENTERING RIFT...', w * 0.5, h * 0.5 - 30);
    ctx.restore();
    ctx.fillStyle = 'rgba(0,200,255,0.7)';
    ctx.font      = '9px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(IS_TOUCH ? 'TAP CONTROLS TO MOVE & FIRE' : 'ARROWS TO MOVE  |  SPACE TO FIRE', w * 0.5, h * 0.5 + 16);
    ctx.fillStyle = 'rgba(232,232,255,0.3)';
    ctx.font      = '7px "Press Start 2P"';
    ctx.fillText('DESTROY ALL INVADERS  |  3 LIVES  |  AVOID ENEMY FIRE', w * 0.5, h * 0.5 + 46);
  }

  function renderGameOver() {
    const w = GW(), h = GH();
    ctx.fillStyle = 'rgba(5,5,16,0.78)';
    ctx.fillRect(0, HUD_H, w, h - HUD_H);
    ctx.save();
    ctx.shadowColor = '#ff2d78';
    ctx.shadowBlur  = 28;
    ctx.fillStyle   = '#ff2d78';
    ctx.font        = '22px "Press Start 2P"';
    ctx.textAlign   = 'center';
    ctx.fillText('GAME OVER', w * 0.5, h * 0.5 - 44);
    ctx.restore();
    ctx.fillStyle = '#ffd700';
    ctx.font      = '12px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('SCORE: ' + String(score).padStart(5, '0'), w * 0.5, h * 0.5 + 8);
    ctx.fillStyle = 'rgba(232,232,255,0.45)';
    ctx.font      = '8px "Press Start 2P"';
    ctx.fillText(IS_TOUCH ? 'TAP TO EXIT' : 'CLICK OR PRESS ESC TO EXIT', w * 0.5, h * 0.5 + 50);
  }

  function renderVictory() {
    const w = GW(), h = GH();
    ctx.fillStyle = 'rgba(5,5,16,0.78)';
    ctx.fillRect(0, HUD_H, w, h - HUD_H);
    ctx.save();
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur  = 28;
    ctx.fillStyle   = '#ffd700';
    ctx.font        = '18px "Press Start 2P"';
    ctx.textAlign   = 'center';
    ctx.fillText('SECTOR CLEARED!', w * 0.5, h * 0.5 - 44);
    ctx.restore();
    ctx.fillStyle = '#00ff9f';
    ctx.font      = '12px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('SCORE: ' + String(score).padStart(5, '0'), w * 0.5, h * 0.5 + 8);
    ctx.fillStyle = 'rgba(232,232,255,0.45)';
    ctx.font      = '8px "Press Start 2P"';
    ctx.fillText(IS_TOUCH ? 'TAP TO EXIT' : 'CLICK OR PRESS ESC TO EXIT', w * 0.5, h * 0.5 + 50);
  }

  function renderTouchControls() {
    const w = GW(), h = GH();
    const bH   = 100;
    const bY   = h - bH;
    const third = w / 3;
    const labels = ['◄', 'FIRE', '►'];
    const states = [touch.left, touch.fire, touch.right];
    const colors = ['#00c8ff', '#00ff9f', '#00c8ff'];
    labels.forEach((lbl, i) => {
      const bx = i * third;
      ctx.fillStyle   = states[i] ? `rgba(${i===1?'0,255,159':'0,200,255'},0.28)` : `rgba(${i===1?'0,255,159':'0,200,255'},0.09)`;
      ctx.fillRect(bx, bY, third, bH);
      ctx.strokeStyle = colors[i];
      ctx.lineWidth   = 1;
      ctx.strokeRect(bx, bY, third, bH);
      ctx.fillStyle   = colors[i];
      ctx.font        = i === 1 ? '9px "Press Start 2P"' : '18px "Press Start 2P"';
      ctx.textAlign   = 'center';
      ctx.fillText(lbl, bx + third * 0.5, bY + bH * 0.5 + (i === 1 ? 4 : 8));
    });
  }

  // ── ESC to exit ───────────────────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (!window.gameActive) return;
    if (e.key === 'Escape') { e.preventDefault(); window.exitGame(); }
  });

  // ── Game loop ─────────────────────────────────────────────────────────────
  function loop() {
    if (!window.gameActive) return;
    update();
    render();
    raf = requestAnimationFrame(loop);
  }

  // ── Public API ────────────────────────────────────────────────────────────
  window.startGame = function () {
    if (window.gameActive) return;
    window.gameActive = true;
    window.hideJet && window.hideJet();
    cvs.style.display = 'block';
    explosions = [];
    phase = 'intro';

    // Show intro for 2.8s then start gameplay
    raf = requestAnimationFrame(loop);
    setTimeout(() => {
      if (!window.gameActive) return;
      initGame();   // sets phase = 'playing'
    }, 2800);
  };

  window.exitGame = function () {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    gKeys[' '] = gKeys['ArrowLeft'] = gKeys['ArrowRight'] = false;
    touch.left = touch.right = touch.fire = false;
    window.gameActive = false;
    cvs.style.display = 'none';
    phase = 'idle';
    window.showJet && window.showJet();
  };

})();
