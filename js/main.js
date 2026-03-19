// ─────────────────────────────────────────────────────────────
// MAIN.JS — scroll reveal, skill bars, modal, nav
// ─────────────────────────────────────────────────────────────

// ── Scroll reveal ─────────────────────────────────────────
const revealEls = document.querySelectorAll('.reveal');
const revObs = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('vis'), i * 80);
    }
  });
}, { threshold: 0.07 });
revealEls.forEach(el => revObs.observe(el));

// ── Skill bar animation ───────────────────────────────────
// Maps numeric values to proficiency tiers (bars are decorative
// but anchored to real tiers, not arbitrary percentages)
const TIER_MAP = [
  { max: 40,  label: 'FAMILIAR',   pct: 22  },
  { max: 60,  label: 'PROFICIENT', pct: 46  },
  { max: 75,  label: 'ADVANCED',   pct: 68  },
  { max: 88,  label: 'EXPERT',     pct: 85  },
  { max: 100, label: 'MASTER',     pct: 97  },
];

function getTier(val) {
  return TIER_MAP.find(t => val <= t.max) || TIER_MAP[TIER_MAP.length - 1];
}

const skillGrid = document.getElementById('skillsGrid');
let skillsAnimated = false;

const skillObs = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting && !skillsAnimated) {
    skillsAnimated = true;
    document.querySelectorAll('.skill-fill').forEach((fill, i) => {
      const raw   = parseInt(fill.dataset.raw, 10);
      const tier  = getTier(raw);
      // Animate bar to tier's display percentage
      setTimeout(() => {
        fill.style.width = tier.pct + '%';
        // Update the label if present
        const row   = fill.closest('.skill-row');
        const badge = row && row.querySelector('.skill-tier');
        if (badge) badge.textContent = tier.label;
      }, i * 65);
    });
  }
}, { threshold: 0.15 });

if (skillGrid) skillObs.observe(skillGrid);

// ── Video modal ───────────────────────────────────────────
function openVideo() {
  document.getElementById('youtubeFrame').src =
    'https://www.youtube.com/embed/DsuzHmdVO_s?autoplay=1';
  document.getElementById('videoModal').classList.add('open');
}

function closeVideo() {
  document.getElementById('youtubeFrame').src = '';
  document.getElementById('videoModal').classList.remove('open');
}

// Close modal on overlay click
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('videoModal');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeVideo();
    });
  }
});

// ── Nav scroll opacity ────────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.getElementById('main-nav');
  if (nav) {
    nav.style.background = window.scrollY > 60
      ? 'rgba(5,5,16,0.97)'
      : 'rgba(5,5,16,0.88)';
  }
});

// ── Burger menu ───────────────────────────────────────────
function toggleBurger() {
  const nav   = document.getElementById('main-nav');
  const links = document.getElementById('navLinks');
  const btn   = document.getElementById('burgerBtn');
  if (!links || !btn) return;

  const isOpen = links.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
  btn.innerHTML = isOpen ? '&#10005;' : '&#9776;';

  // Position dropdown exactly below the nav bar
  if (isOpen && nav) {
    document.documentElement.style.setProperty('--burger-top', nav.offsetHeight + 'px');
  }
}

function closeBurger() {
  const links = document.getElementById('navLinks');
  const btn   = document.getElementById('burgerBtn');
  if (!links) return;
  links.classList.remove('open');
  if (btn) { btn.classList.remove('open'); btn.innerHTML = '&#9776;'; }
}

// Close burger when tapping anywhere outside the nav
document.addEventListener('click', e => {
  const nav = document.getElementById('main-nav');
  if (nav && !nav.contains(e.target)) closeBurger();
});

// ── card touch/click expand ─────────────────────
(function () {
  // Covers both project cards and quest cards
  const toggleTargets = [
    { selector: '.ach-card',  ignore: '.ach-btn' },
    { selector: '.q-body',    ignore: null        }
  ];

  toggleTargets.forEach(({ selector, ignore }) => {
    document.querySelectorAll(selector).forEach(card => {
      card.addEventListener('click', function (e) {
        if (ignore && e.target.closest(ignore)) return;

        const isExpanded = card.classList.contains('expanded');

        // Collapse siblings of same type
        document.querySelectorAll(selector + '.expanded').forEach(c => {
          if (c !== card) c.classList.remove('expanded');
        });

        card.classList.toggle('expanded', !isExpanded);
      });
    });
  });

  // Tap outside collapses everything
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.ach-card') && !e.target.closest('.q-body')) {
      document.querySelectorAll('.ach-card.expanded, .q-body.expanded')
        .forEach(c => c.classList.remove('expanded'));
    }
  });
})();

// ── Equalize project card base heights per row ───────────
function equalizeAchCards() {
  const cards = [...document.querySelectorAll('.ach-card')];
  cards.forEach(c => c.style.minHeight = '');

  const rows = new Map();
  cards.forEach(card => {
    const key = Math.round(card.getBoundingClientRect().top);
    if (!rows.has(key)) rows.set(key, []);
    rows.get(key).push(card);
  });

  rows.forEach(row => {
    const maxH = Math.max(...row.map(c => c.offsetHeight));
    row.forEach(c => c.style.minHeight = maxH + 'px');
  });
}

window.addEventListener('load', equalizeAchCards);
window.addEventListener('resize', equalizeAchCards);