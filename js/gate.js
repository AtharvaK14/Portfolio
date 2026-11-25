// ─────────────────────────────────────────────────────────────
// GATE.JS — "Gate Decode": an original code-matrix puzzle opened from
// the access point. Same row/column picking mechanic as Cyberpunk 2077's
// hacking minigame, with its own name, look and theme.
// Exposes window.Gate.open() / window.Gate.close().
// ─────────────────────────────────────────────────────────────
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ov = $('#gdx');
  if (!ov) return;

  const CODES = ['3A', '7F', 'C4', 'E2', '0B', '9D'];
  const N = 5, BUF = 6, TIME = 40;
  const CHECKS = [['Smoke suite', [0, 2]], ['Regression', [2, 5]], ['Contract tests', [4, 6]]];
  const G = { grid: [], seqs: [], used: new Set(), picks: [], cells: [], mode: 'row', idx: 0, over: false, reason: '', passed: new Set(), t0: 0, raf: 0, timerOn: !RM, bootT: 0 };
  const rnd = n => Math.floor(Math.random() * n);

  // Every matrix is built around a valid 6-pick path, so it can always be solved.
  function build() {
    let path = null;
    for (let t = 0; t < 80 && !path; t++) {
      const p = [[0, rnd(N)]]; let ok = true;
      for (let k = 1; k < BUF && ok; k++) {
        const [lr, lc] = p[k - 1], opts = [];
        for (let i = 0; i < N; i++) {
          const cell = k % 2 ? [i, lc] : [lr, i];
          if (!p.some(q => q[0] === cell[0] && q[1] === cell[1])) opts.push(cell);
        }
        opts.length ? p.push(opts[rnd(opts.length)]) : ok = false;
      }
      if (ok) path = p;
    }
    G.grid = Array.from({ length: N }, () => Array.from({ length: N }, () => CODES[rnd(CODES.length)]));
    const codes = path.map(() => CODES[rnd(CODES.length)]);
    path.forEach(([r, c], k) => { G.grid[r][c] = codes[k]; });
    G.seqs = CHECKS.map(([name, [a, b]]) => ({ name, codes: codes.slice(a, b) }));
  }
  const has = (buf, seq) => { for (let i = 0; i + seq.length <= buf.length; i++) if (seq.every((s, j) => buf[i + j] === s)) return true; return false; };
  const prog = (buf, seq) => { if (has(buf, seq)) return seq.length; for (let k = Math.min(seq.length - 1, buf.length); k > 0; k--) if (seq.slice(0, k).every((s, j) => buf[buf.length - k + j] === s)) return k; return 0; };
  const avail = (r, c) => !G.over && !G.used.has(r + ',' + c) && (G.mode === 'row' ? r === G.idx : c === G.idx);

  // ── timer ──
  function timerUI(left) {
    $('#gd-tfill').style.transform = `scaleX(${Math.max(0, left / TIME)})`;
    $('#gd-tnum').textContent = Math.max(0, left).toFixed(1);
    const t = $('#gd-timer'); t.classList.toggle('idle', !G.t0); t.classList.toggle('low', !!G.t0 && left < 10);
  }
  function tick() {
    const left = TIME - (performance.now() - G.t0) / 1000;
    if (left <= 0) { timerUI(0); end('time'); return; }
    timerUI(left); G.raf = requestAnimationFrame(tick);
  }

  // ── rendering ──
  function band() {
    const b = $('#gd-band'), g = $('#gd-grid'), cells = $$('.gd-c', g);
    if (G.over || !cells.length) { b.classList.add('off'); return; }
    b.classList.remove('off');
    const a = G.mode === 'row' ? cells[G.idx * N] : cells[G.idx];
    const z = G.mode === 'row' ? cells[G.idx * N + N - 1] : cells[(N - 1) * N + G.idx];
    const gw = g.parentElement.getBoundingClientRect(), ra = a.getBoundingClientRect(), rz = z.getBoundingClientRect();
    Object.assign(b.style, { left: (ra.left - gw.left - 3) + 'px', top: (ra.top - gw.top - 3) + 'px', width: (rz.right - ra.left + 6) + 'px', height: (rz.bottom - ra.top + 6) + 'px' });
  }
  function render(o = {}) {
    const g = $('#gd-grid'); let html = '';
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const used = G.used.has(r + ',' + c), ok = avail(r, c), cls = ['gd-c'];
      if (!G.over && (G.mode === 'row' ? r === G.idx : c === G.idx)) cls.push('band');
      if (used) cls.push('used');
      if (G.over && G.reason === 'win' && G.cells.some(p => p[0] === r && p[1] === c)) cls.push('win');
      if (o.zap && o.zap[0] === r && o.zap[1] === c) cls.push('zap');
      html += `<button type="button" class="${cls.join(' ')}" style="--d:${(r + c) * 45 + 120}" data-r="${r}" data-c="${c}"${ok ? '' : ' disabled'} aria-label="Row ${r + 1}, column ${c + 1}: ${G.grid[r][c]}${used ? ', used' : ''}">${G.grid[r][c]}</button>`;
    }
    g.innerHTML = html;
    g.classList.toggle('over', G.over);
    if (o.cascade && !RM) { g.classList.add('cascade'); setTimeout(() => g.classList.remove('cascade'), 950); }
    $('#gd-slots').innerHTML = Array.from({ length: BUF }, (_, i) => `<li class="${G.picks[i] ? 'f' : ''}${o.slotIn === i ? ' in' : ''}">${G.picks[i] || ''}</li>`).join('');
    $('#gd-count').textContent = `${G.picks.length} / ${BUF}`;
    $('#gd-seqs').innerHTML = G.seqs.map((s, i) => {
      const done = has(G.picks, s.codes), p = prog(G.picks, s.codes), fresh = done && !G.passed.has(i);
      if (done) G.passed.add(i);
      return `<li class="${done ? 'passed' : ''}"><div><span class="gd-name">${s.name}</span><span class="gd-codes">${s.codes.map((c, j) => `<i class="${j < p ? 'm' : ''}${o.picked && j === p - 1 ? ' new' : ''}">${c}</i>`).join('')}</span></div><span class="gd-st ${done ? 'pass' : G.over ? 'fail' : ''}${fresh ? ' new' : ''}">${done ? 'Pass' : G.over ? 'Fail' : 'Pending'}</span></li>`;
    }).join('');
    $('#gd-hint').textContent = G.over ? 'Run finished' : G.picks.length === 0 ? 'Pick any code in the top row' : G.mode === 'col' ? `Pick from column ${G.idx + 1}` : `Pick from row ${G.idx + 1}`;
    band();
    if (o.focus) { const f = $('.gd-c:not(:disabled)', g); if (f) f.focus({ preventScroll: true }); }
  }
  function start(cascade) {
    cancelAnimationFrame(G.raf);
    Object.assign(G, { used: new Set(), picks: [], cells: [], mode: 'row', idx: 0, over: false, reason: '', passed: new Set(), t0: 0 });
    const bn = $('#gd-banner'); bn.hidden = true; bn.className = 'gd-banner';
    $('#gd-out').textContent = '';
    timerUI(TIME);
    render({ cascade, focus: !ov.hidden });
  }

  // a picked code flies from its cell to its buffer slot
  function fly(from, slot, code) {
    const to = $$('#gd-slots li')[slot]; if (!to) return;
    const hr = ov.getBoundingClientRect(), tr = to.getBoundingClientRect();
    const gh = document.createElement('div'); gh.className = 'gd-ghost'; gh.textContent = code;
    Object.assign(gh.style, { left: (from.left - hr.left + ov.scrollLeft) + 'px', top: (from.top - hr.top + ov.scrollTop) + 'px', width: from.width + 'px', height: from.height + 'px' });
    ov.appendChild(gh);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      gh.style.transform = `translate(${tr.left - from.left}px,${tr.top - from.top}px) scale(${tr.width / from.width},${tr.height / from.height})`;
      gh.style.opacity = '.8';
    }));
    setTimeout(() => gh.remove(), 380);
  }
  function pick(r, c) {
    if (!avail(r, c)) return;
    const from = $(`#gd-grid .gd-c[data-r="${r}"][data-c="${c}"]`).getBoundingClientRect();
    if (!G.t0 && G.timerOn) { G.t0 = performance.now(); G.raf = requestAnimationFrame(tick); }
    G.used.add(r + ',' + c); G.picks.push(G.grid[r][c]); G.cells.push([r, c]);
    if (G.mode === 'row') { G.mode = 'col'; G.idx = c; } else { G.mode = 'row'; G.idx = r; }
    let left = false;
    for (let i = 0; i < N; i++) { const [rr, cc] = G.mode === 'row' ? [G.idx, i] : [i, G.idx]; if (!G.used.has(rr + ',' + cc)) left = true; }
    const reason = G.seqs.every(s => has(G.picks, s.codes)) ? 'win' : G.picks.length >= BUF ? 'full' : !left ? 'stuck' : '';
    if (reason) { G.over = true; G.reason = reason; cancelAnimationFrame(G.raf); }
    const slot = G.picks.length - 1;
    render({ zap: [r, c], slotIn: RM ? -1 : slot, picked: true, focus: !reason });
    if (!RM) fly(from, slot, G.grid[r][c]);
    if (reason) end(reason, true);
  }
  function end(reason, rendered) {
    G.over = true; G.reason = reason; cancelAnimationFrame(G.raf);
    if (G.t0 && reason !== 'time') timerUI(TIME - (performance.now() - G.t0) / 1000);
    if (!rendered) render({});
    const passed = G.seqs.filter(s => has(G.picks, s.codes)).length;
    const head = reason === 'win' ? 'Gate open' : reason === 'time' ? 'Time out' : reason === 'stuck' ? 'No moves left' : 'Buffer full';
    const body = reason === 'win'
      ? 'All 3 checks passed and build 2026.11 shipped. Real quality gates are my day job, so <a href="mailto:kadam.atharva14@gmail.com">email me</a> if you need one built.'
      : `${passed} of 3 checks passed. Restart this matrix or try a new one.`;
    $('#gd-out').textContent = `${head}. ${passed} of 3 checks passed.`;
    setTimeout(() => {
      const bn = $('#gd-banner');
      $('#gd-bn-h').textContent = head; $('#gd-bn-p').innerHTML = body;
      bn.className = 'gd-banner ' + (reason === 'win' ? 'win' : 'lose') + (RM ? '' : ' show'); bn.hidden = false;
      $('#gd-new').focus({ preventScroll: true });
    }, RM ? 0 : 480);
  }

  // ── jack-in overlay ──
  let prev = null;
  const page = () => [$('#top'), $('#main'), $('.foot')].filter(Boolean);
  function open() {
    if (!ov.hidden) return;
    prev = document.activeElement;
    ov.hidden = false; ov.scrollTop = 0;
    document.documentElement.style.overflow = 'hidden';
    page().forEach(el => { el.inert = true; });
    build();
    if (RM) { ov.className = 'gdx'; start(false); return; }
    ov.className = 'gdx opening booting';
    $('#gdx-x').focus({ preventScroll: true });
    clearTimeout(G.bootT);
    G.bootT = setTimeout(() => {
      ov.classList.remove('booting', 'opening');
      const body = $('#gdx-body'); body.classList.add('enter'); setTimeout(() => body.classList.remove('enter'), 600);
      start(true);
    }, 1600);
  }
  function close() {
    if (ov.hidden) return;
    clearTimeout(G.bootT); cancelAnimationFrame(G.raf);
    const done = () => {
      ov.hidden = true; ov.className = 'gdx';
      document.documentElement.style.overflow = '';
      page().forEach(el => { el.inert = false; });
      (prev && document.contains(prev) ? prev : $('#ap-jack')).focus({ preventScroll: true });
    };
    if (RM) return done();
    ov.classList.add('closing'); setTimeout(done, 230);
  }

  // ── wiring ──
  const g = $('#gd-grid'), tm = $('#gdx-tm');
  $$('.gdx-bar i').forEach((i, k) => { i.style.animationDelay = (0.8 + k * 0.032) + 's'; });
  const paintTimer = () => { ov.dataset.timer = G.timerOn ? 'on' : 'off'; tm.setAttribute('aria-pressed', String(G.timerOn)); $('b', tm).textContent = G.timerOn ? '40s' : 'Off'; };
  paintTimer();
  tm.addEventListener('click', () => {
    G.timerOn = !G.timerOn; paintTimer(); cancelAnimationFrame(G.raf);
    if (G.timerOn && G.picks.length && !G.over) { G.t0 = performance.now(); G.raf = requestAnimationFrame(tick); }
    else if (!G.timerOn) { G.t0 = 0; timerUI(TIME); }
  });
  $('#ap-jack').addEventListener('click', open);
  $('#gdx-x').addEventListener('click', close);
  ov.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    const f = $$('button:not(:disabled), a[href]', ov).filter(x => x.offsetParent !== null);
    if (!f.length) return;
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  });
  g.addEventListener('click', e => { const b = e.target.closest('.gd-c'); if (b) pick(+b.dataset.r, +b.dataset.c); });
  g.addEventListener('mouseover', e => {
    const b = e.target.closest('.gd-c:not(:disabled)');
    $$('.gd-c.peek', g).forEach(x => x.classList.remove('peek'));
    if (!b) return;
    const r = +b.dataset.r, c = +b.dataset.c;
    $$('.gd-c', g).forEach(x => { if (G.mode === 'row' ? +x.dataset.c === c : +x.dataset.r === r) x.classList.add('peek'); });
  });
  g.addEventListener('mouseleave', () => $$('.gd-c.peek', g).forEach(x => x.classList.remove('peek')));
  g.addEventListener('keydown', e => {
    const keys = G.mode === 'row' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const av = $$('.gd-c:not(:disabled)', g); if (!av.length) return;
    const i = av.indexOf(document.activeElement);
    av[(i + (e.key === keys[1] ? 1 : -1) + av.length) % av.length].focus();
  });
  $('#gd-new').addEventListener('click', () => { build(); start(true); });
  $('#gd-reset').addEventListener('click', () => start(true));
  addEventListener('resize', () => { if (!ov.hidden) band(); });

  build(); start(false);
  window.Gate = { open, close };
})();
