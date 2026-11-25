// ─────────────────────────────────────────────────────────────
// MAIN.JS — navigation, experience timeline + journal tabs,
//           project codex, contact choices, keyboard shortcuts,
//           demo video modal, music switch, toast.
// ─────────────────────────────────────────────────────────────
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = () => matchMedia('(max-width: 760px)').matches;

  // ── Load sequence (class is added by the inline script in <head>) ──
  setTimeout(() => document.documentElement.classList.remove('boot'), 1400);

  // ── Toast ──
  let toastT = 0;
  function toast(msg) {
    const t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1300);
  }
  window.toast = toast;

  // ── Flicker on a selection change (the one deliberate glitch) ──
  function flick(el) {
    if (RM || !el) return;
    el.classList.remove('flick'); void el.offsetWidth; el.classList.add('flick');
  }

  // ── Copyright year ──
  const yr = $('#copyYear'); if (yr) yr.textContent = new Date().getFullYear();

  // ── Tab bar follows the section in view ──
  const tabLinks = $$('#tabs a');
  if ('IntersectionObserver' in window) {
    const ids = tabLinks.map(a => a.getAttribute('href').slice(1));
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      const id = en.target.id;
      tabLinks.forEach(a => {
        const on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('on', on);
        on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current');
      });
    }), { rootMargin: '-45% 0px -50% 0px' });
    ids.forEach(id => { const s = document.getElementById(id); if (s) io.observe(s); });
    const hero = $('#home');
    if (hero) new IntersectionObserver(([en]) => {
      if (en.isIntersecting) tabLinks.forEach(a => { a.classList.remove('on'); a.removeAttribute('aria-current'); });
    }, { rootMargin: '-45% 0px -50% 0px' }).observe(hero);
  }

  // ── Experience: timeline (drawn from the tiles' dates) + journal tabs ──
  const tiles = $$('#tiles .tile');
  const ym = s => { const [y, m] = s.split('-').map(Number); return y * 12 + (m - 1); };
  const now = new Date();
  const NOW = now.getFullYear() * 12 + now.getMonth();
  const START = ym('2019-10');
  const SPAN = NOW - START + 1;
  const pct = v => (Math.max(0, Math.min(SPAN, v)) / SPAN * 100).toFixed(2) + '%';

  function drawAxis() {
    const axis = $('#axis'); if (!axis || !tiles.length) return;
    const rows = [1, 2, 2, 1, 2], ends = [false, false, false, true, true];
    const work = tiles.map((t, i) => {
      const s = ym(t.dataset.s), e = t.dataset.e === 'now' ? NOW + 1 : ym(t.dataset.e) + 1;
      return `<button type="button" class="bar${t.dataset.e === 'now' ? ' now' : ''}" data-i="${i}" tabindex="-1" aria-pressed="false" style="left:${pct(s - START)};width:${pct(e - s)}"><em class="${rows[i] === 2 ? 'r2' : ''} ${ends[i] ? 'end' : ''}">${t.dataset.short}</em></button>`;
    }).join('');
    const study = [['2020-06', '2023-05', 'B.Tech · Pune'], ['2023-08', '2025-04', 'M.S. · Michigan Tech']].map(([a, b, l]) =>
      `<span class="bar study" style="left:${pct(ym(a) - START)};width:${pct(ym(b) + 1 - ym(a))}"><em>${l}</em></span>`).join('');
    const years = [];
    for (let y = 2020; y <= now.getFullYear(); y++) years.push(`<span style="left:${pct(ym(y + '-01') - START)}">${y}</span>`);
    axis.innerHTML = `<div class="axis-h">Timeline<span>Oct 2019 – now · click a role</span></div>
      <div class="lane"><span class="lane-l">Work</span><div class="track">${work}</div></div>
      <div class="lane"><span class="lane-l">Study</span><div class="track">${study}</div></div>
      <div class="years"><i></i><div>${years.join('')}</div></div>`;
    axis.addEventListener('click', e => { const b = e.target.closest('.bar[data-i]'); if (b) selectRole(+b.dataset.i, true); });
  }

  function placeRail(i) {
    const mark = $('#railmark'), t = tiles[i];
    if (mark && t) { mark.style.left = t.offsetLeft + 'px'; mark.style.width = t.offsetWidth + 'px'; }
  }
  function selectRole(i, fx) {
    tiles.forEach((t, j) => {
      const on = j === i;
      t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      const p = document.getElementById(t.getAttribute('aria-controls')); if (p) p.hidden = !on;
    });
    $$('#axis .bar[data-i]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.i === i)));
    placeRail(i);
    if (fx) flick(document.getElementById(tiles[i].getAttribute('aria-controls')));
  }
  if (tiles.length) {
    drawAxis();
    const tl = $('#tiles');
    tl.addEventListener('click', e => { const t = e.target.closest('.tile'); if (t) selectRole(tiles.indexOf(t), true); });
    tl.addEventListener('keydown', e => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const cur = tiles.findIndex(t => t.getAttribute('aria-selected') === 'true');
      const n = e.key === 'Home' ? 0 : e.key === 'End' ? tiles.length - 1 : (cur + (e.key === 'ArrowRight' ? 1 : -1) + tiles.length) % tiles.length;
      selectRole(n, true); tiles[n].focus();
    });
    const start = Math.max(0, tiles.findIndex(t => t.getAttribute('aria-selected') === 'true'));
    selectRole(start, false);
    addEventListener('resize', () => placeRail(tiles.findIndex(t => t.getAttribute('aria-selected') === 'true')));
    if (document.fonts) document.fonts.ready.then(() => placeRail(tiles.findIndex(t => t.getAttribute('aria-selected') === 'true')));
  }

  // ── Projects: filter + codex list/detail ──
  const items = $$('#plist .pi');
  function counts() {
    const c = { all: 0, qa: 0, swe: 0 };
    $$('#plist li[data-cat]:not(.pg)').forEach(li => { c[li.dataset.cat]++; c.all++; });
    $$('[data-count]').forEach(el => { el.textContent = c[el.dataset.count]; });
  }
  function showProject(id, fx) {
    items.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.p === id)));
    $$('#pd-wrap .pd').forEach(p => { p.hidden = p.id !== 'pd-' + id; });
    const pd = document.getElementById('pd-' + id);
    if (fx) {
      flick(pd);
      if (narrow() && pd) pd.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
    }
  }
  if (items.length) {
    counts();
    $('#plist').addEventListener('click', e => { const b = e.target.closest('.pi'); if (b) showProject(b.dataset.p, true); });
    $('#filters').addEventListener('click', e => {
      const b = e.target.closest('.f'); if (!b) return;
      const f = b.dataset.f;
      $$('#filters .f').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      $$('#plist li[data-cat]').forEach(li => { li.hidden = f !== 'all' && li.dataset.cat !== f; });
      const cur = items.find(x => x.getAttribute('aria-pressed') === 'true');
      if (!cur || cur.closest('li').hidden) {
        const first = items.find(x => !x.closest('li').hidden);
        if (first) showProject(first.dataset.p, true);
      }
    });
  }

  // ── Skill meters (five segments, built from data-l) ──
  const TIER = ['', 'Familiar', 'Proficient', 'Advanced', 'Expert', 'Master'];
  $$('.seg[data-l]').forEach(seg => {
    const l = +seg.dataset.l;
    seg.innerHTML = [1, 2, 3, 4, 5].map(k => `<i class="${k <= l ? 'on' : ''}"></i>`).join('');
    if (seg.closest('.sk')) {
      seg.setAttribute('role', 'img'); seg.setAttribute('aria-label', `${TIER[l]}, ${l} of 5`);
      seg.insertAdjacentHTML('afterend', `<span class="t" aria-hidden="true">${TIER[l]}</span>`);
    }
  });

  // ── Contact: dialogue choices (gold selection follows hover/focus) ──
  const chs = $$('#choices .choice');
  chs.forEach(a => {
    const sel = () => chs.forEach(x => x.classList.toggle('is-sel', x === a));
    a.addEventListener('mouseenter', sel); a.addEventListener('focus', sel);
  });
  const choicesEl = $('#choices');
  if (choicesEl) choicesEl.addEventListener('keydown', e => {
    if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;
    const i = chs.indexOf(document.activeElement); if (i < 0) return;
    e.preventDefault();
    chs[(i + (e.key === 'ArrowDown' ? 1 : -1) + chs.length) % chs.length].focus();
  });

  // ── Demo video modal ──
  let vPrev = null;
  function openVideo(id) {
    const m = $('#vmodal'); if (!m) return;
    vPrev = document.activeElement;
    $('#vframe').src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    m.hidden = false; document.documentElement.style.overflow = 'hidden';
    $('#vclose').focus();
  }
  function closeVideo() {
    const m = $('#vmodal'); if (!m || m.hidden) return;
    $('#vframe').src = 'about:blank';
    m.hidden = true; document.documentElement.style.overflow = '';
    if (vPrev) vPrev.focus();
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-video]'); if (b) openVideo(b.dataset.video); });
  const vm = $('#vmodal');
  if (vm) {
    $('#vclose').addEventListener('click', closeVideo);
    vm.addEventListener('click', e => { if (e.target === vm) closeVideo(); });
    vm.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); closeVideo(); }
      if (e.key === 'Tab') { e.preventDefault(); $('#vclose').focus(); }
    });
  }

  // ── Music switch (engine lives in music.js; off by default) ──
  const mBtn = $('#musicBtn'), tBtn = $('#trackBtn');
  if (mBtn && typeof window.toggleMusic === 'function') {
    mBtn.addEventListener('click', () => { window.toggleMusic(); mBtn.setAttribute('aria-pressed', String(mBtn.classList.contains('on'))); });
    tBtn.addEventListener('click', () => window.cycleTrack());
  } else if (mBtn) { mBtn.closest('.bgm').hidden = true; }

  // ── Keyboard shortcuts (single keys, with an off switch per WCAG 2.1.4) ──
  const kb = $('#kb');
  let kbOn = true;
  try { kbOn = localStorage.getItem('shortcuts') !== 'off'; } catch (e) { /* storage blocked */ }
  const paintKb = () => { if (!kb) return; kb.setAttribute('aria-pressed', String(kbOn)); $('b', kb).textContent = kbOn ? 'On' : 'Off'; };
  paintKb();
  if (kb) kb.addEventListener('click', () => {
    kbOn = !kbOn; paintKb(); toast(kbOn ? 'Shortcuts on' : 'Shortcuts off');
    try { localStorage.setItem('shortcuts', kbOn ? 'on' : 'off'); } catch (e) { /* ignore */ }
  });
  const ORDER = ['home', 'about', 'experience', 'projects', 'skills', 'game', 'contact'];
  const go = id => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); };
  const currentIdx = () => { let best = 0; ORDER.forEach((id, i) => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top < innerHeight * 0.4) best = i; }); return best; };
  document.addEventListener('keydown', e => {
    if (!kbOn || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    const t = e.target;
    if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
    if (!$('#gdx').hidden || !$('#vmodal').hidden) return;
    const k = e.key.toLowerCase();
    if (k === 'q' || k === 'e') { const n = Math.max(0, Math.min(ORDER.length - 1, currentIdx() + (k === 'e' ? 1 : -1))); go(ORDER[n]); toast(k === 'e' ? 'Next section' : 'Previous section'); }
    else if (k === 'p') { go('projects'); toast('Projects'); }
    else if (k === 'b') { go('home'); toast('Back to top'); }
    else if (k === 'r') { const a = $('[data-resume]'); if (a) a.click(); toast('Opening résumé'); }
    else if (k === 'g') { const a = $('[data-github]'); if (a) a.click(); toast('Opening GitHub'); }
    else if (k === 'j') { if (window.Gate) { toast('Jacking in'); window.Gate.open(); } }
    else return;
    e.preventDefault();
  });
})();
