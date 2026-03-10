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
