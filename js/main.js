// ── Project Detail Modal ──────────────────────────────────────
// Append this block to the bottom of js/main.js
// ─────────────────────────────────────────────────────────────

(function () {
  var overlay  = document.getElementById('projModal');
  var closeBtn = document.getElementById('projModalClose');
  if (!overlay || !closeBtn) return;

  function openProjModal(card) {
    var data      = card.querySelector('.proj-data');
    var icon      = data.querySelector('[data-icon]').dataset.icon;
    var title     = data.querySelector('[data-title]').dataset.title;
    var tech      = data.querySelector('[data-tech]').dataset.tech;
    var desc      = data.querySelector('[data-desc]').dataset.desc;
    var bullets   = data.querySelectorAll('ul li');
    var actionsEl = data.querySelector('[data-actions]');

    document.getElementById('projModalIcon').innerHTML    = icon;
    document.getElementById('projModalTitle').textContent = title;
    document.getElementById('projModalTech').textContent  = tech;
    document.getElementById('projModalDesc').textContent  = desc;
    document.getElementById('projWinLabel').textContent   = title + '.EXE';
    document.getElementById('projAddressBar').textContent =
      'portfolio://projects/' +
      title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    var bulletContainer = document.getElementById('projModalBullets');
    bulletContainer.innerHTML = '';
    bullets.forEach(function (li) {
      var newLi = document.createElement('li');
      newLi.innerHTML = li.innerHTML;
      bulletContainer.appendChild(newLi);
    });

    document.getElementById('projModalActions').innerHTML =
      actionsEl ? actionsEl.innerHTML : '';
    document.getElementById('projStatusCount').textContent = bullets.length;

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeProjModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Wire each card click
  document.querySelectorAll('.ach-card[data-project]').forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (e.target.closest('.ach-btn')) return; // let button links work normally
      openProjModal(card);
    });
  });

<<<<<<< Updated upstream
  // Tap outside collapses everything
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.ach-card') && !e.target.closest('.q-body')) {
      document.querySelectorAll('.ach-card.expanded, .q-body.expanded')
        .forEach(c => c.classList.remove('expanded'));
    }
=======
  // Close: X button
  closeBtn.addEventListener('click', closeProjModal);

  // Close: click the backdrop
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeProjModal();
  });

  // Close: Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeProjModal();
>>>>>>> Stashed changes
  });
})();