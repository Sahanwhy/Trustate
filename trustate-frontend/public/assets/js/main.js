/* ================================================================
   Trustate — main.js
   All interactivity + backend-ready API hooks
   ================================================================ */

/* ----------------------------------------------------------------
   CONFIG — swap BASE_URL for your real API endpoint
   ---------------------------------------------------------------- */
const API = {
  BASE_URL: 'http://127.0.0.1:5000/api/v1',
  LISTINGS: '/listings',
  SEARCH:   '/listings/search',
};

/**
 * AUTO-LOAD GRIDS
 * Find all .listings-grid elements and fetch their data using their data-api-endpoint attribute.
 */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.listings-grid').forEach(grid => {
    const endpoint = grid.dataset.apiEndpoint;
    if (!endpoint) return;

    // Show loading state
    grid.innerHTML = '<div class="listings-empty">Loading properties...</div>';

    // Parse params from endpoint (e.g. /api/v1/listings?category=residential)
    let params = {};
    try {
        const url = new URL(endpoint, window.location.origin);
        params = Object.fromEntries(url.searchParams.entries());
    } catch (e) {
        // Fallback for relative paths without origin
        const queryString = endpoint.split('?')[1];
        if (queryString) {
            params = Object.fromEntries(new URLSearchParams(queryString).entries());
        }
    }

    console.log(`[Trustate] Loading ${params.category || 'listings'} for grid:`, grid.id);

    fetchListings(params)
      .then(data => {
        console.log(`[Trustate] Received ${data.length} items for ${params.category}`);
        renderCards(grid, data);
      })
      .catch(err => {
        console.error('Failed to load listings for grid:', grid.id, err);
        grid.innerHTML = '<div class="listings-empty">Failed to load listings. Please try again.</div>';
      });
  });
});

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

const SUBTYPES = {
    residential: [
        { val: 'apartment', lbl: '🏢 Apartment / Flat' },
        { val: 'house-villa', lbl: '🏡 House / Villa' },
        { val: 'builder-floor', lbl: '🏗 Builder Floor' },
        { val: 'studio-1rk', lbl: '🛋 Studio / 1RK' },
        { val: 'penthouse', lbl: '🌆 Penthouse' },
        { val: 'plot-land', lbl: '📐 Plot / Land' }
    ],
    commercial: [
        { val: 'office-space', lbl: '🏢 Office Space' },
        { val: 'retail-shop', lbl: '🛒 Retail Shop' },
        { val: 'warehouse', lbl: '🏭 Warehouse' },
        { val: 'industrial', lbl: '⚙️ Industrial' },
        { val: 'hotel-guest-house', lbl: '🏨 Hotel / Guest House' },
        { val: 'restaurant', lbl: '🍽️ Restaurant' },
        { val: 'commercial-land', lbl: '🗺 Commercial Land' }
    ],
    agri: [
        { val: 'farmland', lbl: '🌾 Farmland' },
        { val: 'plantation-land', lbl: '🌳 Plantation Land' },
        { val: 'farmhouse-estate', lbl: '🏡 Farmhouse / Estate' },
        { val: 'livestock-farm', lbl: '🐄 Livestock Farm' },
        { val: 'unused-barren', lbl: '🏜️ Unused / Barren' }
    ],
    undeveloped: [
        { val: 'vacant-plot', lbl: '📍 Vacant Plot' },
        { val: 'raw-land', lbl: '🏔 Raw Land' },
        { val: 'waterfront', lbl: '🌊 Waterfront Land' },
        { val: 'corner-piece', lbl: '📐 Corner Piece' }
    ]
};

(function initSearch() {
  const tabs = document.querySelectorAll('.search-tab');
  const subtypeSelect = document.getElementById('search-subtype');

  function updateSubtypes(cat) {
    if (!subtypeSelect) return;
    const options = SUBTYPES[cat] || [];
    subtypeSelect.innerHTML = '<option value="">All Types</option>' + 
      options.map(opt => `<option value="${opt.val}">${opt.lbl}</option>`).join('');
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      updateSubtypes(tab.dataset.tab);
    });
  });

  // Initial population
  updateSubtypes('residential');

  // Search form submit
  const searchBtn = document.querySelector('.search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', handleSearch);
  }
})();

async function handleSearch() {
  const activeTab = document.querySelector('.search-tab.active');
  const category = activeTab?.dataset.tab || 'residential';
  const subtype  = document.querySelector('[data-field="subtype"]')?.value || '';
  const location = document.querySelector('[data-field="location"]')?.value || '';
  const price    = document.querySelector('[data-field="price"]')?.value || '';

  console.log('[Trustate] Executing Search:', { category, subtype, location, price });

  const searchBtn = document.querySelector('.search-btn');
  const originalText = searchBtn.innerHTML;
  searchBtn.innerHTML = 'Searching...';
  searchBtn.disabled = true;

  try {
    const params = { category };
    if (subtype) params.subtype = subtype;
    if (location) params.location = location;
    if (price) {
        const [min, max] = price.split('-');
        params.minPrice = min;
        if (max) params.maxPrice = max.replace('+', '');
    }

    const data = await fetchListings(params);
    
    // Find the appropriate grid to show results
    // For simplicity on index, we'll scroll to that category's section and update its grid
    const targetGridId = `grid-${category}`;
    const grid = document.getElementById(targetGridId);
    
    if (grid) {
        renderCards(grid, data);
        document.getElementById(`section-${category}`)?.scrollIntoView({ behavior: 'smooth' });
    } else {
        alert(`Search results for ${category} updated below.`);
    }

  } catch (err) {
    console.error('Search failed', err);
    alert('Search failed. Please try again.');
  } finally {
    searchBtn.innerHTML = originalText;
    searchBtn.disabled = false;
  }
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

        // ── Backend hook ──
        let category = '';
        try {
            const url = new URL(grid.dataset.apiEndpoint, window.location.origin);
            category = url.searchParams.get('category');
        } catch (e) {
            const queryString = grid.dataset.apiEndpoint.split('?')[1];
            if (queryString) {
                category = new URLSearchParams(queryString).get('category');
            }
        }
        
        fetchListings({ category, subtype: selected })
          .then(data => renderCards(grid, data))
          .catch(err => console.error('Filter failed', err));

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
  // Clear loading state / skeleton / old cards
  grid.innerHTML = '';

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

  const images = listing.images || [];
  let currentIdx = 0;

  card.innerHTML = `
    <div class="prop-card__img">
      <div class="prop-card__slider">
        <div class="prop-card__slider-inner">
          ${images.map(img => `<img src="${escHtml(img)}" alt="${escHtml(listing.title)}" loading="lazy">`).join('')}
        </div>
        ${images.length > 1 ? `
          <button class="slider-btn slider-btn--prev" aria-label="Previous image">‹</button>
          <button class="slider-btn slider-btn--next" aria-label="Next image">›</button>
          <div class="slider-dots">
            ${images.map((_, i) => `<span class="slider-dot ${i === 0 ? 'active' : ''}"></span>`).join('')}
          </div>
        ` : ''}
      </div>
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

  // Slider Logic
  if (images.length > 1) {
    const inner = card.querySelector('.prop-card__slider-inner');
    const dots = card.querySelectorAll('.slider-dot');
    const prev = card.querySelector('.slider-btn--prev');
    const next = card.querySelector('.slider-btn--next');

    const updateSlider = (idx) => {
      inner.style.transform = `translateX(-${idx * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    };

    prev.onclick = (e) => {
      e.stopPropagation();
      currentIdx = (currentIdx - 1 + images.length) % images.length;
      updateSlider(currentIdx);
    };

    next.onclick = (e) => {
      e.stopPropagation();
      currentIdx = (currentIdx + 1) % images.length;
      updateSlider(currentIdx);
    };
  }

  // Click → navigate to detail page
  card.addEventListener('click', () => {
    let viewPage = 'residential_view.html';
    if (listing.category === 'commercial') viewPage = 'commercial_view.html';
    if (listing.category === 'agri') viewPage = 'agricultural_view.html';
    if (listing.category === 'undeveloped') viewPage = 'underdeveloped_view.html';
    
    window.location.href = `property_view/${viewPage}?id=${listing.id}`;
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

