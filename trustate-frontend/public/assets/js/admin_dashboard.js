/**
 * Trustate — admin_dashboard.js
 * Real-time data integration for the admin panel.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ─── Elements ───
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburger');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const topbarTitle = document.getElementById('topbarTitle');

    // ─── Data State ───
    let properties = [];

    async function fetchAllData() {
        const adminData = JSON.parse(localStorage.getItem('adminUser'));
        
        if (!adminData || !adminData.token) {
            console.error('No admin session found');
            window.location.href = '../auth/admin_login.html';
            return;
        }

        const adminToken = adminData.token;

        // Update UI with admin info
        if (adminData.admin) {
            document.querySelector('.adm-name').textContent = adminData.admin.fullName;
            document.querySelector('.adm-avatar').textContent = adminData.admin.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        }

        try {
            const response = await fetch('http://localhost:5000/api/admin/properties', {
                headers: {
                    'x-auth-token': adminToken
                }
            });

            if (!response.ok) throw new Error('Failed to fetch properties');

            properties = await response.json();
            renderAll();
        } catch (err) {
            console.error('Fetch Error:', err);
            showToast('Error loading properties');
        }
    }

    function renderAll() {
        renderTable('pending');
        renderTable('approved');
        renderTable('rejected');
        updateStats();
    }

    function renderTable(status) {
        const tbody = document.getElementById(`prop-${status}-body`);
        if (!tbody) return;

        const filtered = properties.filter(p => (p.status || 'pending') === status);
        tbody.innerHTML = '';

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:rgba(255,255,255,0.3)">No ${status} properties found.</td></tr>`;
            return;
        }

        filtered.forEach(p => {
            const tr = document.createElement('tr');
            const date = new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
            
            tr.innerHTML = `
                <td>
                    <div class="adm-prop-cell">
                        <img src="${p.images?.[0] || '../assets/img/placeholder-prop.jpg'}" class="adm-prop-thumb">
                        <div>
                            <div class="adm-prop-name">${p.title}</div>
                            <div class="adm-prop-id">ID: ${p._id.substring(18)}</div>
                        </div>
                    </div>
                </td>
                <td><span class="adm-type-badge">${p.type || 'Residential'}</span></td>
                <td><div class="adm-prop-loc">${p.city_town_village}, ${p.district}</div></td>
                <td><div class="adm-prop-price">₹${parseFloat(p.price).toLocaleString('en-IN')}</div></td>
                <td><div class="adm-prop-date">${date}</div></td>
                <td>
                    <button class="adm-act-btn" onclick="openDrawer('${p._id}')">View Details</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Update counts in tabs
        const countEl = document.getElementById(`prop-${status}-count`);
        if (countEl) countEl.textContent = filtered.length;
        
        if (status === 'pending') {
            const sbCount = document.getElementById('sb-prop-pending');
            if (sbCount) sbCount.textContent = filtered.length;
        }
    }

    function updateStats() {
        const total = properties.length;
        const pending = properties.filter(p => p.status === 'pending').length;
        const approved = properties.filter(p => p.status === 'approved').length;
        
        const statCards = document.querySelectorAll('.adm-stat-val');
        if (statCards.length >= 3) {
            statCards[0].textContent = total;
            statCards[1].textContent = pending;
            statCards[2].textContent = approved;
        }

        const swCount = document.getElementById('sw-prop-count');
        if (swCount) swCount.textContent = total;
    }

    window.openDrawer = function(id) {
        const p = properties.find(x => x._id === id);
        if (!p) return;

        const drawer = document.getElementById('drawer');
        const drawerOverlay = document.getElementById('drawerOverlay');
        const body = document.getElementById('drawerBody');

        body.innerHTML = `
            <div class="dr-section">
                <div class="dr-label">Property Title</div>
                <div class="dr-val" style="font-size:1.2rem;font-weight:600">${p.title}</div>
            </div>
            <div class="dr-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1.5rem 0;">
                <div class="dr-section">
                    <div class="dr-label">Price</div>
                    <div class="dr-val">₹${parseFloat(p.price).toLocaleString('en-IN')}</div>
                </div>
                <div class="dr-section">
                    <div class="dr-label">Type</div>
                    <div class="dr-val" style="text-transform:capitalize">${p.type}</div>
                </div>
            </div>
            <div class="dr-section" style="margin-bottom:1.5rem">
                <div class="dr-label">Location</div>
                <div class="dr-val">${p.locality ? p.locality + ', ' : ''}${p.city_town_village}, ${p.district}, ${p.state}</div>
            </div>
            <div class="dr-section" style="margin-bottom:1.5rem">
                <div class="dr-label">Description</div>
                <div class="dr-val" style="line-height:1.6; color:rgba(255,255,255,0.7)">${p.description || 'No description provided.'}</div>
            </div>
            <div class="dr-section">
                <div class="dr-label">Property Images</div>
                <div class="dr-img-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.75rem; margin-top: 0.5rem;">
                    ${p.images.map(img => `<img src="${img}" class="dr-img" style="width:100%; height:80px; object-fit:cover; border-radius:8px; cursor:pointer" onclick="window.open('${img}')">`).join('')}
                </div>
            </div>
        `;

        // Action buttons
        document.getElementById('drawerApprove').onclick = () => updateStatus(p._id, 'approved');
        document.getElementById('drawerReject').onclick = () => updateStatus(p._id, 'rejected');

        // Hide/Show action buttons based on current status
        const foot = document.getElementById('drawerFoot');
        if (p.status === 'pending') {
            foot.style.display = 'grid';
        } else {
            foot.style.display = 'none';
        }

        drawer.classList.add('open');
        drawerOverlay.classList.add('open');
    };

    async function updateStatus(id, newStatus) {
        const adminToken = JSON.parse(localStorage.getItem('adminUser'))?.token;
        if (!adminToken) return;

        const btn = newStatus === 'approved' ? document.getElementById('drawerApprove') : document.getElementById('drawerReject');
        const originalText = btn.textContent;
        btn.textContent = 'Processing...';
        btn.disabled = true;

        try {
            const response = await fetch(`http://localhost:5000/api/admin/properties/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': adminToken
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) throw new Error('Failed to update status');

            showToast(`Property ${newStatus} successfully`, 'success');
            closeDrawer();
            fetchAllData(); 
        } catch (err) {
            console.error('Update Error:', err);
            showToast('Error updating status');
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }

    function closeDrawer() {
        document.getElementById('drawer').classList.remove('open');
        document.getElementById('drawerOverlay').classList.remove('open');
    }

    document.getElementById('drawerClose').onclick = closeDrawer;
    document.getElementById('drawerOverlay').onclick = closeDrawer;

    function showToast(msg, type = 'error') {
        const t = document.getElementById('toast');
        t.textContent = msg;
        t.style.background = type === 'success' ? '#00C47A' : '#FF4D4D';
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    }

    // Tab Navigation
    document.querySelectorAll('.adm-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const section = tab.dataset.section;
            const targetTab = tab.dataset.tab;

            document.querySelectorAll(`.adm-tab[data-section="${section}"]`).forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            document.querySelectorAll(`.adm-panel[id^="${section}-panel-"]`).forEach(p => p.classList.remove('active'));
            const panel = document.getElementById(`${section}-panel-${targetTab}`);
            if (panel) panel.classList.add('active');
        });
    });

    // Sidebar Links
    document.querySelectorAll('.adm-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const goto = item.dataset.goto;
            if (goto === 'prop') {
                document.getElementById('sectionProp').style.display = 'block';
                document.getElementById('sectionRent').style.display = 'none';
                document.getElementById('swProp').classList.add('active');
                document.getElementById('swRent').classList.remove('active');
            } else if (goto === 'rent') {
                document.getElementById('sectionProp').style.display = 'none';
                document.getElementById('sectionRent').style.display = 'block';
                document.getElementById('swProp').classList.remove('active');
                document.getElementById('swRent').classList.add('active');
            }
        });
    });

    // Section Buttons
    document.getElementById('swProp').onclick = () => {
        document.getElementById('sectionProp').style.display = 'block';
        document.getElementById('sectionRent').style.display = 'none';
        document.getElementById('swProp').classList.add('active');
        document.getElementById('swRent').classList.remove('active');
    };
    document.getElementById('swRent').onclick = () => {
        document.getElementById('sectionProp').style.display = 'none';
        document.getElementById('sectionRent').style.display = 'block';
        document.getElementById('swProp').classList.remove('active');
        document.getElementById('swRent').classList.add('active');
    };

    // Logout
    document.querySelector('.adm-logout a').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('adminUser');
        window.location.href = '../auth/admin_login.html';
    });

    // Mobile Sidebar
    hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('open');
    });
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('open');
    });

    // Initial Load
    fetchAllData();
});
