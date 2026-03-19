// ─────────────────────────────────────────────────────────────
// MAIN.JS — scroll reveal, skill bars, modal, nav, quest toggle,
//           project detail modal
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
      const raw  = parseInt(fill.dataset.raw, 10);
      const tier = getTier(raw);
      setTimeout(() => {
        fill.style.width = tier.pct + '%';
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

document.addEventListener('click', e => {
  const nav = document.getElementById('main-nav');
  if (nav && !nav.contains(e.target)) closeBurger();
});

// ── Quest expand / collapse ───────────────────────────────
// Desktop: CSS :hover handles it. JS .expanded class handles
// touch taps (and also desktop clicks as a convenience toggle).
function toggleQuest(qBody) {
  // If the click came from a link inside the body, don't toggle
  if (!qBody || qBody.tagName !== 'DIV') return;
  qBody.classList.toggle('expanded');
}

// ── Project data store ────────────────────────────────────
const PROJECT_DATA = {
  'api-framework': {
    icon: '&#9881;',
    title: 'API TEST AUTOMATION FRAMEWORK',
    tech: 'Python · PyTest · Pydantic v2 · GitHub Actions · Allure',
    url: 'portfolio://projects/api-test-automation-framework',
    desc: 'Production-grade API test framework targeting the GitHub REST API with contract validation, SLA enforcement, and live report deployment.',
    bullets: [
      '<b>53 test cases</b> across functional, error handling, and performance with modular fixture architecture and centralized test data',
      '<b>Pydantic v2 schema validation</b> and per-endpoint SLAs (800ms / 1200ms) via custom <b>perf_timer</b> fixture — beyond status code checks',
      'Adversarial coverage: <b>404, 401</b>, and auth contrast tests confirming authenticated vs. anonymous client behavior',
      'Two-stage <b>GitHub Actions</b> pipeline (smoke on push, parallel regression nightly via pytest-xdist) with Allure reports on <b>GitHub Pages</b>',
    ],
    actions: [
      { label: 'GITHUB', cls: 'ach-btn-github', href: 'https://github.com/AtharvaK14/API-Test-Automation-Framework' },
    ],
  },

  'vr-carnival': {
    icon: '&#127918;',
    title: 'VR CARNIVAL EXPERIENCE',
    tech: 'Unreal Engine 5 · Blueprint · C++',
    url: 'portfolio://projects/vr-carnival-experience',
    desc: 'Immersive VR carnival with interactive mini-games using physics-based mechanics and Blueprint scripting.',
    bullets: [
      'Led development of immersive VR environment with physics-based gameplay, collision detection, and spatial audio',
      'Implemented 2 interactive mini-games with real-time score tracking; <b>95% user engagement</b>',
      'Created Blueprint scripting for game logic and player movement, reducing development time by <b>40%</b>',
      'Identified and resolved stability issues through structured gameplay and performance testing',
    ],
    actions: [
      { label: 'WATCH DEMO', cls: 'ach-btn-video', onclick: 'openVideo()' },
    ],
  },

  'rubber-ducky': {
    icon: '&#129414;',
    title: 'DEBUGGING ASSISTANT CHATBOT',
    tech: 'Python · JavaScript · Node.js',
    url: 'portfolio://projects/rubber-ducky-chatbot',
    desc: 'Interactive chatbot helping programmers debug code with a conversational AI and duck-themed personality.',
    bullets: [
      'Built a regex-based rule engine with <b>100+ debugging rules</b> across Python, JavaScript/Node.js, and C/C++',
      'Deployed as both web app and Node.js CLI sharing one rule file — updates propagate instantly with no duplication',
      'Automated testing achieves <b>90% success rate</b> in error detection across 50+ error types',
    ],
    actions: [
      { label: 'GITHUB', cls: 'ach-btn-github', href: 'https://github.com/AtharvaK14/Rubber-Ducky-Chatbot' },
      { label: 'LIVE SITE', cls: 'ach-btn-website', href: 'https://atharvak14.github.io/Rubber-Ducky-Chatbot/' },
    ],
  },

  'post-fire': {
    icon: '&#128293;',
    title: 'POST-FIRE ASSESSMENT APP',
    tech: 'HTML · CSS · JavaScript',
    url: 'portfolio://projects/post-fire-assessment-app',
    desc: 'Mobile web app helping field teams log wildfire ash data with real-time storage for scientific assessments.',
    bullets: [
      'Built responsive web app for real-time wildfire environmental data capture by field teams',
      'Designed UI with form validation and local storage, improving data accuracy by <b>60%</b>',
      'Implemented JSON parsing and offline persistence via browser storage APIs',
    ],
    actions: [
      { label: 'GITHUB', cls: 'ach-btn-github', href: 'https://github.com/AtharvaK14/Post-Fire-Assessment-App' },
    ],
  },

  'pneumonia': {
    icon: '&#129753;',
    title: 'PNEUMONIA DETECTION -- CNN + TRANSFER LEARNING',
    tech: 'Python · TensorFlow · Keras',
    url: 'portfolio://projects/pneumonia-detection-cnn',
    desc: 'Deep learning model detecting pneumonia in chest X-ray images to aid early clinical diagnosis.',
    bullets: [
      'Trained CNN with batch normalization, ReLU activation, and max pooling on chest X-ray datasets',
      'Applied transfer learning with pre-trained models to improve performance on limited medical data',
      'Designed to reduce diagnostic workload and improve early detection accuracy for clinicians',
    ],
    actions: [
      { label: 'GITHUB', cls: 'ach-btn-github', href: 'https://github.com/AtharvaK14/Pneumonia-Detection-using-CNN-and-Transfer-Learning' },
    ],
  },

  'college-erp': {
    icon: '&#127979;',
    title: 'COLLEGE ERP SYSTEM',
    tech: 'FastAPI · Next.js 14 · PostgreSQL · Docker',
    url: 'portfolio://projects/college-erp-system',
    desc: 'Full-stack ERP with role-based portals for Admins, Teachers, and Students across 57 REST API endpoints.',
    bullets: [
      'Built role-based portals with <b>JWT auth, OAuth2 refresh tokens</b>, bcrypt hashing, and CORS-protected API',
      'Implemented attendance calendar, CIE/SEE marks entry, and <b>automated CGPA</b> with 75% threshold alerts',
      'Deployed on <b>Vercel + Render + Neon PostgreSQL</b> with Docker Compose and async SQLAlchemy',
    ],
    actions: [
      { label: 'GITHUB', cls: 'ach-btn-github', href: 'https://github.com/AtharvaK14/College-ERP-System' },
    ],
  },
};

// ── Project modal open / close ────────────────────────────
function openProjectModal(id) {
  const data = PROJECT_DATA[id];
  if (!data) return;

  // Populate title bar
  document.getElementById('projModalTitle').textContent = data.title;
  document.getElementById('projModalUrl').textContent   = data.url;

  // Build content HTML
  const bulletsHtml = data.bullets
    .map(b => `<li>${b}</li>`)
    .join('');

  const actionsHtml = data.actions
    .map(a => {
      if (a.href) {
        return `<a class="ach-btn ${a.cls}" href="${a.href}" target="_blank">${a.label}</a>`;
      }
      return `<button class="ach-btn ${a.cls}" onclick="${a.onclick}">${a.label}</button>`;
    })
    .join('');

  document.getElementById('projModalContent').innerHTML = `
    <div class="pmod-header">
      <span class="pmod-icon">${data.icon}</span>
      <div class="pmod-header-text">
        <div class="pmod-title">${data.title}</div>
        <div class="pmod-tech">${data.tech}</div>
      </div>
    </div>
    <hr class="pmod-divider">
    <p class="pmod-desc">${data.desc}</p>
    <div class="pmod-actions">${actionsHtml}</div>
    <hr class="pmod-divider">
    <span class="pmod-bullets-label">// DETAILS</span>
    <ul class="pmod-bullets">${bulletsHtml}</ul>
  `;

  // Open overlay (CSS transition handles the window animation)
  document.getElementById('projectModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
  document.getElementById('projectModal').classList.remove('open');
  document.body.style.overflow = '';
}

// Close on backdrop click (not on the window itself)
function handleProjOverlayClick(e) {
  if (e.target === document.getElementById('projectModal')) {
    closeProjectModal();
  }
}

// Escape key closes the project modal (and video modal)
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeProjectModal();
    closeVideo();
  }
});