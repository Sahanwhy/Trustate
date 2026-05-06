/* ================================================================
   Trustate — main.js
   All interactivity + backend-ready API hooks
   ================================================================ */

/* ----------------------------------------------------------------
   CONFIG — swap BASE_URL for your real API endpoint
   ---------------------------------------------------------------- */
const API = {
  BASE_URL: '/api/v1',          // <-- change to your backend URL
  LISTINGS: '/listings',
  SEARCH:   '/listings/search',
};

/* ----------------------------------------------------------------
   NAVBAR — scroll effect + hamburger
   ---------------------------------------------------------------- */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileClose = document.getElementById('mobileClose');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });

  hamburger.addEventListener('click', () => mobileMenu.classList.add('open'));
  mobileClose.addEventListener('click', () => mobileMenu.classList.remove('open'));
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });
})();

/* ----------------------------------------------------------------
   SEARCH BAR — tab switching
   ---------------------------------------------------------------- */
(function initSearch() {
  const tabs = document.querySelectorAll('.search-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update category select based on tab
      const catSelect = document.querySelector('.search-field select[data-field="category"]');
      if (catSelect) {
        catSelect.value = tab.dataset.tab || '';
      }
    });
  });

  // Search form submit
  const searchBtn = document.querySelector('.search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', handleSearch);
  }
})();

/**
 * handleSearch — builds query params and can call your API
 * Replace the console.log with an actual fetch() call
 */
function handleSearch() {
  const location = document.querySelector('.search-field input[data-field="location"]')?.value || '';
  const category  = document.querySelector('.search-field select[data-field="category"]')?.value || '';
  const price     = document.querySelector('.search-field select[data-field="price"]')?.value || '';
  const size      = document.querySelector('.search-field select[data-field="size"]')?.value || '';

  const params = new URLSearchParams({ location, category, price, size });

  // ── Backend hook ──
  // fetch(`${API.BASE_URL}${API.SEARCH}?${params}`)
  //   .then(r => r.json())
  //   .then(data => renderSearchResults(data))
  //   .catch(err => console.error('Search failed', err));

  console.log('[Trustate] Search params:', Object.fromEntries(params));
  // Placeholder: scroll to listings
  document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth' });
}

/* ----------------------------------------------------------------
   SUBTYPE FILTER PILLS
   Each section has its own set of pills + grid.
   Clicking a pill filters cards by data-subtype attribute.
   ---------------------------------------------------------------- */
(function initSubtypeFilters() {
  document.querySelectorAll('.subtype-filters').forEach(filterRow => {
    const section  = filterRow.closest('.prop-section');
    const grid     = section?.querySelector('.listings-grid');
    if (!grid) return;

    filterRow.querySelectorAll('.subtype-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        // Update active state
        filterRow.querySelectorAll('.subtype-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        const selected = pill.dataset.subtype; // 'all' or specific subtype key

        // Filter cards
        grid.querySelectorAll('.prop-card').forEach(card => {
          const matches = selected === 'all' || card.dataset.subtype === selected;
          card.style.display = matches ? '' : 'none';
        });

        // ── Backend hook ──
        // If you want server-side filtering, call your API here:
        // fetchListings({ category: section.dataset.category, subtype: selected })
        //   .then(data => renderCards(grid, data));

        checkEmpty(grid);
      });
    });
  });
})();

/* ----------------------------------------------------------------
   SCROLL REVEAL
   ---------------------------------------------------------------- */
(function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();

/* ----------------------------------------------------------------
   HELPER — show/hide empty state message in a grid
   ---------------------------------------------------------------- */
function checkEmpty(grid) {
  const visible = grid.querySelectorAll('.prop-card:not([style*="display: none"])').length;
  let emptyEl = grid.querySelector('.listings-empty');

  if (visible === 0) {
    if (!emptyEl) {
      emptyEl = document.createElement('div');
      emptyEl.className = 'listings-empty';
      emptyEl.textContent = 'No properties found for this filter. Check back soon.';
      grid.appendChild(emptyEl);
    }
  } else {
    emptyEl?.remove();
  }
}

/* ================================================================
   BACKEND INTEGRATION HOOKS
   These functions are ready to be wired to your real API.
   ================================================================ */

/**
 * fetchListings — call your backend and return listing data
 * @param {Object} params - { category, subtype, location, price, size, page }
 * @returns {Promise<Array>}
 */
async function fetchListings(params = {}) {
  const query = new URLSearchParams(params);
  const res   = await fetch(`${API.BASE_URL}${API.LISTINGS}?${query}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

/**
 * renderCards — inject API listing data into a grid
 * @param {HTMLElement} grid
 * @param {Array} listings - array of listing objects from your API
 *
 * Expected listing shape from your backend:
 * {
 *   id:           string,
 *   title:        string,
 *   price:        string,       // e.g. "₦18,500,000"
 *   priceLabel:   string,       // e.g. "" or "/ year"
 *   location:     string,
 *   category:     string,       // "residential" | "commercial" | "agri" | "undeveloped"
 *   subtype:      string,       // e.g. "apartment" | "office-space" | ...
 *   subtypeLabel: string,       // human-readable subtype
 *   image:        string,       // image URL
 *   verified:     boolean,
 *   chips:        string[],     // e.g. ["3 Beds", "2 Baths", "1,200 sqm"]
 * }
 */
function renderCards(grid, listings) {
  // Clear skeleton / old cards
  grid.querySelectorAll('.prop-card').forEach(c => c.remove());

  if (!listings || listings.length === 0) {
    checkEmpty(grid);
    return;
  }

  listings.forEach(listing => {
    const card = buildCard(listing);
    grid.appendChild(card);
  });
}

/**
 * buildCard — creates a .prop-card DOM element from listing data
 */
function buildCard(listing) {
  const card = document.createElement('article');
  card.className  = 'prop-card reveal';
  card.dataset.id      = listing.id;
  card.dataset.type    = listing.category;
  card.dataset.subtype = listing.subtype;

  card.innerHTML = `
    <div class="prop-card__img">
      <img src="${escHtml(listing.image)}" alt="${escHtml(listing.title)}" loading="lazy">
      <span class="prop-badge prop-badge--${escHtml(listing.category)}">${categoryLabel(listing.category)}</span>
      <span class="prop-subtype-badge">${escHtml(listing.subtypeLabel)}</span>
      ${listing.verified ? '<span class="badge-verified">✓ Verified</span>' : ''}
    </div>
    <div class="prop-card__body">
      <div class="prop-card__price">${escHtml(listing.price)}<span>${escHtml(listing.priceLabel || '')}</span></div>
      <div class="prop-card__title">${escHtml(listing.title)}</div>
      <div class="prop-card__location">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ${escHtml(listing.location)}
      </div>
      <div class="prop-card__meta">
        ${(listing.chips || []).map(c => `<span class="meta-chip">${escHtml(c)}</span>`).join('')}
      </div>
    </div>
  `;

  // Click → navigate to detail page
  card.addEventListener('click', () => {
    // ── Backend hook ──
    // window.location.href = `/property/${listing.id}`;
    console.log('[Trustate] Card clicked, id:', listing.id);
  });

  // Trigger reveal observer
  revealObserver.observe(card);

  return card;
}

// Shared observer used by dynamically added cards
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); } });
}, { threshold: 0.08 });

function categoryLabel(cat) {
  return { residential: 'Residential', commercial: 'Commercial', agri: 'Agricultural', undeveloped: 'Land' }[cat] || cat;
}

function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ================================================================
   STAT COUNTER ANIMATION
   ================================================================ */
(function initCounters() {
  const counters = document.querySelectorAll('.stat-card__num[data-target]');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el     = e.target;
      const target = parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || '';
      let current  = 0;
      const step   = Math.ceil(target / 60);
      const timer  = setInterval(() => {
        current = Math.min(current + step, target);
        el.innerHTML = current.toLocaleString() + suffix + (el.dataset.em ? `<em>${el.dataset.em}</em>` : '');
        if (current >= target) clearInterval(timer);
      }, 25);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => obs.observe(c));
})();

