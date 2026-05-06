/**
 * Trustate — admin_dashboard.js
 * Premium interactivity for the admin panel.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ─── Elements ───
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburger');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const topbarTitle = document.getElementById('topbarTitle');

    // Section Switchers
    const swProp = document.getElementById('swProp');
    const swRent = document.getElementById('swRent');
    const sectionProp = document.getElementById('sectionProp');
    const sectionRent = document.getElementById('sectionRent');

    // Feedback Modal
    const feedbackFab = document.getElementById('feedbackFab');
    const feedbackModal = document.getElementById('feedbackModal');
    const modalClose = document.getElementById('modalClose');
    const modalCancel = document.getElementById('modalCancel');
    const modalSubmit = document.getElementById('modalSubmit');
    const starRow = document.getElementById('starRow');

    // Drawer
    const drawerOverlay = document.getElementById('drawerOverlay');
    const drawer = document.getElementById('drawer');
    const drawerClose = document.getElementById('drawerClose');

    // Toast
    const toast = document.getElementById('toast');

    // ─── State ───
    let activeSection = 'prop'; // 'prop' or 'rent'
    let activeTabs = {
        prop: 'pending',
        rent: 'pending'
    };

    // ─── Initialization ───
    init();

    function init() {
        setupEventListeners();
        renderCounts();
        loadMockData();
    }

    // ─── Event Listeners ───
    function setupEventListeners() {
        // Sidebar Mobile Toggle
        hamburger?.addEventListener('click', () => {
            sidebar?.classList.add('mob-open');
            sidebarOverlay?.classList.add('active');
        });

        sidebarOverlay?.addEventListener('click', () => {
            sidebar?.classList.remove('mob-open');
            sidebarOverlay?.classList.remove('active');
        });

        // Section Switching (Main Switcher)
        swProp?.addEventListener('click', () => switchSection('prop'));
        swRent?.addEventListener('click', () => switchSection('rent'));

        // Sidebar Nav Items (Proxy to section/tab)
        document.querySelectorAll('.adm-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-goto');
                const tab = item.getAttribute('data-tab');
                
                if (section) switchSection(section);
                if (tab) switchTab(section, tab);

                // Close sidebar on mobile
                sidebar?.classList.remove('mob-open');
                sidebarOverlay?.classList.remove('active');
            });
        });

        // Tab Switching within sections
        document.querySelectorAll('.adm-tab').forEach(tabBtn => {
            tabBtn.addEventListener('click', () => {
                const section = tabBtn.getAttribute('data-section');
                const tab = tabBtn.getAttribute('data-tab');
                switchTab(section, tab);
            });
        });

        // Feedback Modal
        feedbackFab?.addEventListener('click', () => {
            feedbackModal?.classList.add('active');
        });

        [modalClose, modalCancel].forEach(btn => {
            btn?.addEventListener('click', () => {
                feedbackModal?.classList.remove('active');
            });
        });

        modalSubmit?.addEventListener('click', () => {
            showToast('Thank you for your feedback! 🚀');
            feedbackModal?.classList.remove('active');
        });

        // Star Rating
        starRow?.querySelectorAll('.star-btn').forEach(star => {
            star.addEventListener('click', () => {
                const rating = star.getAttribute('data-s');
                starRow.querySelectorAll('.star-btn').forEach(s => {
                    const sRating = s.getAttribute('data-s');
                    s.classList.toggle('active', sRating <= rating);
                });
            });
        });

        // Drawer Close
        drawerClose?.addEventListener('click', closeDrawer);
        drawerOverlay?.addEventListener('click', closeDrawer);
    }

    // ─── Navigation Logic ───
    function switchSection(section) {
        activeSection = section;

        // Update Switcher Buttons
        swProp?.classList.toggle('active', section === 'prop');
        swRent?.classList.toggle('active', section === 'rent');

        // Update Section Visibility
        if (sectionProp) sectionProp.style.display = section === 'prop' ? 'block' : 'none';
        if (sectionRent) sectionRent.style.display = section === 'rent' ? 'block' : 'none';

        // Update Topbar Title
        const sectionLabel = section === 'prop' ? 'Properties' : 'Rent Listings';
        const tabLabel = activeTabs[section].charAt(0).toUpperCase() + activeTabs[section].slice(1);
        if (topbarTitle) topbarTitle.innerHTML = `${sectionLabel} <span>/ ${tabLabel}</span>`;

        // Update Sidebar Active Item
        document.querySelectorAll('.adm-nav-item').forEach(item => {
            const itemSection = item.getAttribute('data-goto');
            const itemTab = item.getAttribute('data-tab');
            const isActive = (itemSection === section && !itemTab);
            item.classList.toggle('active', isActive);
        });
    }

    function switchTab(section, tab) {
        activeTabs[section] = tab;

        // Update Tab Buttons UI
        document.querySelectorAll(`.adm-tab[data-section="${section}"]`).forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
        });

        // Update Panels UI
        document.querySelectorAll(`#section${section.charAt(0).toUpperCase() + section.slice(1)} .adm-panel`).forEach(panel => {
            const panelId = `${section}-panel-${tab}`;
            panel.classList.toggle('active', panel.id === panelId);
        });

        // Update Topbar Title
        const sectionLabel = section === 'prop' ? 'Properties' : 'Rent Listings';
        const tabLabel = tab.charAt(0).toUpperCase() + tab.slice(1);
        if (topbarTitle) topbarTitle.innerHTML = `${sectionLabel} <span>/ ${tabLabel}</span>`;
    }

    // ─── UI Rendering ───
    function renderCounts() {
        // Mock counts
        const counts = {
            'sb-prop-pending': 12,
            'sb-rent-pending': 5,
            'sw-prop-count': 48,
            'sw-rent-count': 22,
            'prop-pending-count': 12,
            'prop-approved-count': 32,
            'prop-rejected-count': 4,
            'prop-sold-count': 10,
            'prop-users-count': 124,
            'prop-inq-count': 18,
            'rent-pending-count': 5,
            'rent-approved-count': 15,
            'rent-rejected-count': 2,
            'rent-sold-count': 5,
            'rent-users-count': 88,
            'rent-inq-count': 12
        };

        for (const [id, count] of Object.entries(counts)) {
            const el = document.getElementById(id);
            if (el) el.textContent = count;
        }
    }

    function loadMockData() {
        const propPendingBody = document.getElementById('prop-pending-body');
        if (!propPendingBody) return;

        const mockProps = [
            { id: 1, name: 'Skyline Luxury Apartment', type: 'Residential', loc: 'Mumbai, MH', price: '₹2.4 Cr', date: '2 hours ago' },
            { id: 2, name: 'Green Valley Plot', type: 'Undeveloped', loc: 'Pune, MH', price: '₹85 L', date: '5 hours ago' },
            { id: 3, name: 'Modern Office Space', type: 'Commercial', loc: 'Bangalore, KA', price: '₹4.2 Cr', date: 'Yesterday' },
            { id: 4, name: 'Palm Villa', type: 'Residential', loc: 'Goa, GA', price: '₹3.1 Cr', date: '2 days ago' }
        ];

        propPendingBody.innerHTML = mockProps.map(p => `
            <tr>
                <td>
                    <div class="prop-cell">
                        <div class="prop-thumb">🏢</div>
                        <div>
                            <div class="prop-name">${p.name}</div>
                            <div class="prop-meta">ID: #LNF-${1000 + p.id}</div>
                        </div>
                    </div>
                </td>
                <td><span class="badge badge-inactive">${p.type}</span></td>
                <td>${p.loc}</td>
                <td><strong>${p.price}</strong></td>
                <td style="color:var(--adm-muted)">${p.date}</td>
                <td>
                    <div class="tbl-acts">
                        <button class="act-btn" onclick="viewProperty(${p.id})" title="View Details">👁️</button>
                        <button class="act-btn approve" onclick="approveItem(${p.id})" title="Approve">✓</button>
                        <button class="act-btn reject" onclick="rejectItem(${p.id})" title="Reject">✕</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // ─── Utility Functions ───
    window.viewProperty = (id) => {
        const drawerBody = document.getElementById('drawerBody');
        const drawerTitle = document.getElementById('drawerTitle');
        if (drawerTitle) drawerTitle.textContent = `Property Details #LNF-${1000 + id}`;
        
        if (drawerBody) {
            drawerBody.innerHTML = `
                <div style="padding:1.5rem; display:flex; flex-direction:column; gap:1.2rem">
                    <div style="width:100%; height:200px; background:var(--adm-lg); border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:3rem">
                        🏠
                    </div>
                    <div>
                        <h3 style="margin-bottom:.5rem">Skyline Luxury Apartment</h3>
                        <p style="color:var(--adm-muted); font-size:.9rem">Premium 3BHK with sea view, high-end amenities, and prime location.</p>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; font-size:.85rem">
                        <div>
                            <div style="color:var(--adm-muted)">Price</div>
                            <div style="font-weight:700">₹2.4 Cr</div>
                        </div>
                        <div>
                            <div style="color:var(--adm-muted)">Area</div>
                            <div style="font-weight:700">1850 sq.ft</div>
                        </div>
                        <div>
                            <div style="color:var(--adm-muted)">Seller</div>
                            <div style="font-weight:700; color:var(--adm-blue-mid)">Rajesh Kumar</div>
                        </div>
                        <div>
                            <div style="color:var(--adm-muted)">Posted</div>
                            <div style="font-weight:700">May 05, 2026</div>
                        </div>
                    </div>
                    <div style="padding:1rem; background:var(--adm-off); border-radius:8px; border:1px solid var(--adm-lg)">
                        <div style="font-weight:700; margin-bottom:.5rem; font-size:.85rem">Verification Documents</div>
                        <div style="display:flex; gap:.5rem; flex-wrap:wrap">
                            <span style="padding:.3rem .6rem; background:#fff; border:1px solid var(--adm-mg); border-radius:4px; font-size:.7rem">📄 Sale_Deed.pdf</span>
                            <span style="padding:.3rem .6rem; background:#fff; border:1px solid var(--adm-mg); border-radius:4px; font-size:.7rem">📄 Tax_Receipt.pdf</span>
                        </div>
                    </div>
                </div>
            `;
        }

        drawerOverlay?.classList.add('active');
        drawer?.classList.add('active');
    };

    window.approveItem = (id) => {
        showToast(`Property #LNF-${1000+id} has been approved. ✅`);
        closeDrawer();
    };

    window.rejectItem = (id) => {
        showToast(`Property #LNF-${1000+id} has been rejected. ✕`, 'error');
        closeDrawer();
    };

    function closeDrawer() {
        drawerOverlay?.classList.remove('active');
        drawer?.classList.remove('active');
    }

    function showToast(msg, type = 'success') {
        if (!toast) return;
        toast.textContent = msg;
        toast.className = `adm-toast active ${type}`;
        
        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    }
});

