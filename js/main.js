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
  { max: 40, label: 'FAMILIAR', pct: 22 },
  { max: 60, label: 'PROFICIENT', pct: 46 },
  { max: 75, label: 'ADVANCED', pct: 68 },
  { max: 88, label: 'EXPERT', pct: 85 },
  { max: 100, label: 'MASTER', pct: 97 },
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
      const raw = parseInt(fill.dataset.raw, 10);
      const tier = getTier(raw);
      setTimeout(() => {
        fill.style.width = tier.pct + '%';
        const row = fill.closest('.skill-row');
        const badge = row && row.querySelector('.skill-tier');
        if (badge) badge.textContent = tier.label;
      }, i * 65);
    });
  }
}, { threshold: 0.15 });

if (skillGrid) skillObs.observe(skillGrid);

// ── Video modal ───────────────────────────────────────────
let lastFocusedVideoEl = null;

function openVideo() {
  lastFocusedVideoEl = document.activeElement;
  document.getElementById('youtubeFrame').src =
    'https://www.youtube.com/embed/DsuzHmdVO_s?autoplay=1';
  document.getElementById('videoModal').classList.add('open');
  document.querySelector('#videoModal .modal-close')?.focus();
}

function closeVideo() {
  document.getElementById('youtubeFrame').src = '';
  document.getElementById('videoModal').classList.remove('open');
  if (lastFocusedVideoEl) { lastFocusedVideoEl.focus(); lastFocusedVideoEl = null; }
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
  const nav = document.getElementById('main-nav');
  const links = document.getElementById('navLinks');
  const btn = document.getElementById('burgerBtn');
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
  const btn = document.getElementById('burgerBtn');
  if (!links) return;
  links.classList.remove('open');
  if (btn) { btn.classList.remove('open'); btn.innerHTML = '&#9776;'; }
}

document.addEventListener('click', e => {
  const nav = document.getElementById('main-nav');
  if (nav && !nav.contains(e.target)) closeBurger();
});

// ── Experience journey: click a level node, detail panel updates ──
// Replaces the old hover/tap accordion. Order is chronological
// (oldest -> newest), internships nested as sub-levels (2.1, 3.1)
// under the nearest preceding full-time role.
const EXPERIENCE_DATA = {

  expleo: {
    level: '1',
    now: false,
    title: 'QA Engineer',
    company: 'EXPLEO Group | Pune, India',
    date: 'OCT 2019 -- FEB 2020',
    summary: 'Mobile QA for a 100K+ user iOS app; 300+ test cases across 15+ devices.',
    context: 'Global quality engineering company for enterprise mobile applications serving 100K+ users',
    bullets: [
      'Designed and ran <b>300+ test cases</b> across <b>15+ iOS devices</b> via <b>Xcode</b> and <b>TestFlight</b>, reducing defect escape rate from <b>12%</b> to <b>3%</b> for an app serving 100K+ users',
      'Traced crash log stack traces in <b>Xcode</b> to root cause, delivering structured defect reports through <b>JIRA</b> and <b>TestRail</b> that cut bug resolution time by <b>25%</b>',
    ],
  },

  ubisoft: {
    level: '2',
    now: false,
    title: 'Software Development Engineer in Test',
    company: 'UBISOFT ENTERTAINMENT | Pune, India',
    date: 'MAR 2020 -- MAR 2021',
    summary: "SDET across 2 titles serving 40M+ users; built the team's Selenium/PyTest framework and BitBucket CI/CD gates.",
    context: 'Global video game publisher serving millions of players across PC, console, and mobile',
    bullets: [
      'Led <b>smoke testing</b> for the desktop platform across 2 titles serving <b>40M+</b> users, cutting execution time from <b>1 hour to 30 minutes</b> through test automation',
      "Wrote automated test scripts with <b>parameterized fixtures</b> and session-scoped state for the team's new <b>Selenium/PyTest</b> framework, raising test coverage from <b>60%</b> to <b>82%</b>",
      'Configured <b>Selenium</b> suites and smoke tests as quality gates in <b>BitBucket CI/CD pipelines</b>, reducing regression cycles from <b>10 to 8 days</b>',
      'Tested across desktop, console <b>(PS4/PS5 dev kits)</b>, and mobile, running <b>performance profiling</b>, platform compliance checks, and peripheral hardware validation (racing rigs), reducing inter-platform defects by <b>35%</b>',
      'Owned the full <b>defect lifecycle</b> in <b>JIRA</b>: triage, root cause analysis, and closure across platform teams under <b>Agile/Scrum</b>',
    ],
  },

  oasis: {
    level: '2.5',
    now: false,
    sub: true,
    title: 'Web Dev & Testing Intern',
    company: 'OASIS INFOBYTE | Pune, India',
    date: 'FEB 2022 -- MAR 2022',
    summary: 'Built web apps with Jest CI/CD automation, hitting 85% code coverage.',
    context: 'Digital solutions company specializing in web development and UI/UX for SMBs',
    bullets: [
      'Performed API testing using <b>Postman</b> and built <b>3+ web applications</b> with <b>85% code coverage</b> via Jest automation',
      'Implemented unit and integration testing within <b>GitHub Actions CI/CD pipelines</b>',
      'Documented the full technology stack, enabling faster onboarding and consistent build processes',
    ],
  },

  mtu: {
    level: '3',
    now: false,
    title: 'Research Assistant',
    company: 'Michigan Technological University | Houghton, MI',
    date: 'JUN 2025 -- JUN 2026',
    summary: 'Automated financial data pipelines and evaluation frameworks for research, cutting manual effort 40%.',
    context: '',
    bullets: [
      'Built and iterated AI/ML prototypes using Python, translating research ideas into working systems and validating real-world applicability across multiple experimental runs and datasets.',
      'Designed evaluation frameworks and KPI-driven benchmarks to measure model performance (accuracy, latency, reliability), improving experiment comparability and decision-making speed by 35%.',
      'Developed automated data pipelines for experimentation and analysis, reducing manual preprocessing and evaluation effort by 40% and accelerating iteration cycles.',
      'Collaborated with researchers and stakeholders to define problem statements, analyze large-scale datasets, and deliver insights that influenced research direction across multiple projects.',
    ],
  },

  infyra: {
    level: '3.5',
    now: true,
    sub: true,
    title: 'Software Developer Intern',
    company: 'Infyra LLC | Sheridan, WY',
    date: 'JUN 2026 -- PRESENT',
    summary: 'Backend REST APIs, ETL validation, and ML model validation checks in a production environment.',
    context: '',
    bullets: [
      'Developed backend <b>REST API endpoints</b> and automated <b>ETL validation</b> against <b>PostgreSQL</b> and <b>MongoDB</b>, adding schema checks that catch pipeline defects before release.',
      'Automated <b>KPI reporting</b> and <b>ML model validation</b> checks, standardizing how accuracy and latency regressions are surfaced.',
    ],
  },

};

let activeExpId = 'infyra';

function renderExperience(id) {
  const data = EXPERIENCE_DATA[id];
  const panel = document.getElementById('journeyDetail');
  if (!data || !panel) return;
  activeExpId = id;

  document.querySelectorAll('.journey-stop').forEach(el => {
    el.classList.toggle('active', el.dataset.exp === id);
  });

  const contextHtml = data.context
    ? `<div class="q-context">${data.context}</div>`
    : '';
  const bulletsHtml = data.bullets.map(b => `<li>${b}</li>`).join('');

  panel.style.opacity = '0';
  setTimeout(() => {
    panel.classList.toggle('now-active', !!data.now);
    panel.innerHTML = `
      <div class="q-head">
        <span class="q-title">${data.title}</span>
        <span class="q-date">${data.date}</span>
      </div>
      <div class="q-company">${data.company}</div>
      <p class="q-summary">${data.summary}</p>
      <div class="q-details-inner">
        ${contextHtml}
        <ul class="q-bullets">${bulletsHtml}</ul>
      </div>
    `;
    panel.style.opacity = '1';
  }, 120);
}

function selectExperience(id, el) {
  renderExperience(id);
  if (el && el.scrollIntoView) {
    el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }
}

function scrollJourney(dir) {
  const strip = document.getElementById('journeyStrip');
  if (strip) strip.scrollBy({ left: dir * 260, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
  renderExperience(activeExpId);
  initProjectCounts();
  setCopyrightYear();
});

// ── Project data store ────────────────────────────────────
const PROJECT_DATA = {

  'dual-e2e': {
    icon: '&#9874;',
    title: 'DUAL-FRAMEWORK E2E TEST SUITE',
    tech: 'TypeScript · Playwright · Cypress · GitHub Actions · Node.js',
    url: 'portfolio://projects/dual-framework-e2e-test-suite',
    desc: 'Side-by-side Playwright and Cypress implementation of 22 identical E2E scenarios against SauceDemo with measured framework comparison.',
    bullets: [
      '<b>22 test scenarios</b> covering login, inventory, cart, and full checkout flows — implemented identically in both frameworks using TypeScript',
      '<b>Page Object Model</b> architecture with 4 POM classes per framework (Login, Inventory, Cart, Checkout), keeping test logic separate from page interaction code',
      'Playwright suite runs across <b>3 browser engines</b> (Chromium, Firefox, WebKit) for <b>66 total executions</b>; Cypress runs on Electron/Chrome with video recording',
      '<b>GitHub Actions</b> CI/CD pipeline runs both suites in parallel on every push with automated artifact uploads (HTML reports, screenshots, videos)',
      'Framework comparison document with <b>measured execution times</b>, setup effort, cross-browser support matrix, and evidence-based recommendations',
    ],
    actions: [
      { label: 'GITHUB', cls: 'ach-btn-github', href: 'https://github.com/AtharvaK14/Dual-Framework-E2E-Test-Suite-Playwright-Cypress' },
    ],
  },

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
      { label: 'GITHUB', cls: 'ach-btn-github', href: 'https://github.com/AtharvaK14/api-quality-gate' },
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
      { label: 'LIVE SITE', cls: 'ach-btn-website', href: 'https://college-erp-system-one.vercel.app/login' },
    ],
  },

  'watchtime': {
    icon: '&#128250;',
    title: 'WATCHTIME',
    tech: 'React · TypeScript · Vite · Dexie.js (IndexedDB) · Capacitor · Android',
    url: 'portfolio://projects/watchtime',
    desc: 'Local-first TV and movie tracker built as a replacement for TV Time after its July 2026 shutdown -- tracks episodes and movies entirely on-device, with a native Android app via Capacitor.',
    bullets: [
      '<b>Fully local-first</b> -- shows, movies, watch history, and API keys live only in <b>Dexie.js (IndexedDB)</b> on-device; no accounts, no backend server, no ads or tracking',
      '<b>Watch Next</b> surfaces the next unwatched, released episode per show, plus configurable "Haven\'t Watched For a While" and "Haven\'t Yet Started" views',
      'Rewatch tracking increments watch time and rewatch counts without inflating episode or progress totals',
      'Integrates <b>TMDB</b> (metadata/posters), <b>OMDb</b> (IMDb/Rotten Tomatoes ratings), and <b>TVmaze</b> (episode runtimes), each using the user\'s own free API key',
      '<b>TV Time migration</b> -- imports a user\'s full watch history from TV Time\'s GDPR CSV export or a third-party JSON export, with guided resolution of ambiguous title matches',
      'Shipped as a web app and, via <b>Capacitor</b>, a native <b>Android</b> app (min API 24) with full JSON backup/restore',
    ],
    actions: [
      { label: 'GITHUB', cls: 'ach-btn-github', href: 'https://github.com/AtharvaK14/WatchTime' },
    ],
  },

  'test-observability': {
    icon: '&#128269;',
    title: 'TEST OBSERVABILITY -- AI ROOT-CAUSE AGENT',
    tech: 'Python · FastAPI · SQLAlchemy · PostgreSQL · Claude (Anthropic API) · Docker · GitHub Actions',
    url: 'portfolio://projects/test-observability-ai-root-cause-agent',
    desc: 'AI agent that ingests test results from Playwright, Cypress, PyTest, and Selenium, then uses Claude to diagnose why each failure happened -- app bug, flaky test, environment, test data, infrastructure, or external dependency -- backed by measured evidence rather than the error string alone.',
    bullets: [
      '<b>167 tests, mypy --strict clean</b> -- verified end-to-end against real Playwright, Cypress, and PyTest output',
      'Builds real diagnostic evidence per failure -- <b>30-run pass/fail history</b>, commit-range check, cross-framework blast radius, duration-vs-baseline, and error-fingerprint clustering -- before the model forms an opinion',
      'Agent investigates with <b>5 retrieval tools</b> across up to 4 turns, then returns a <b>schema-validated verdict</b> via a strict tool call instead of parsed text',
      '<b>Two classifiers</b> scored against seeded ground truth -- a confidence-capped rule-based heuristic (the control group) and Claude -- so accuracy claims are falsifiable, not asserted',
      'Deterministic, LLM-free <b>hash-based clustering</b> collapses hundreds of red tests into the handful of real underlying problems, cutting analysis cost by orders of magnitude',
      'Backend and agent are complete and verified end-to-end; the <b>React dashboard is the next milestone</b>',
    ],
    actions: [
      { label: 'GITHUB', cls: 'ach-btn-github', href: 'https://github.com/AtharvaK14/Test-Observability-AI-Root-Cause-Agent' },
    ],
  },
};

// ── Project modal open / close ────────────────────────────
let lastFocusedProjEl = null;

function openProjectModal(id) {
  const data = PROJECT_DATA[id];
  if (!data) return;
  lastFocusedProjEl = document.activeElement;

  // Populate title bar
  document.getElementById('projModalTitle').textContent = data.title;
  document.getElementById('projModalUrl').textContent = data.url;

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
  document.querySelector('.proj-modal-close')?.focus();
}

function closeProjectModal() {
  document.getElementById('projectModal').classList.remove('open');
  document.body.style.overflow = '';
  if (lastFocusedProjEl) { lastFocusedProjEl.focus(); lastFocusedProjEl = null; }
}

// Close on backdrop click (not on the window itself)
function handleProjOverlayClick(e) {
  if (e.target === document.getElementById('projectModal')) {
    closeProjectModal();
  }
}

// ── Project category filter ───────────────────────────────
function filterProjects(category, btn) {
  document.querySelectorAll('.proj-filter-btn').forEach(b => {
    const isActive = b === btn;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-pressed', String(isActive));
  });

  document.querySelectorAll('.proj-group').forEach(group => {
    const show = category === 'all' || group.dataset.group === category;
    if (show) {
      group.hidden = false;
      requestAnimationFrame(() => group.classList.remove('proj-group-out'));
    } else {
      group.classList.add('proj-group-out');
      setTimeout(() => {
        if (group.classList.contains('proj-group-out')) group.hidden = true;
      }, 220);
    }
  });
}

// Counts are derived from the DOM so they can never drift from the actual cards
function initProjectCounts() {
  const counts = { all: 0 };
  document.querySelectorAll('.proj-group').forEach(group => {
    const n = group.querySelectorAll('.ach-card').length;
    counts[group.dataset.group] = n;
    counts.all += n;
    const header = group.querySelector('.proj-group-count');
    if (header) header.textContent = '×' + n;
  });
  document.querySelectorAll('.proj-filter-count').forEach(el => {
    el.textContent = '(' + (counts[el.dataset.countFor] || 0) + ')';
  });
}

// Escape key closes the project modal, video modal, and mobile nav
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeProjectModal();
    closeVideo();
    closeBurger();
  }
});

// ── Copyright year: stays correct without a yearly edit ────
function setCopyrightYear() {
  const el = document.getElementById('copyYear');
  if (el) el.textContent = new Date().getFullYear();
}