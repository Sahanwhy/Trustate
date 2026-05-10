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
    let inquiries = [];

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
            // Fetch Properties
            const propRes = await fetch('http://127.0.0.1:5000/api/admin/properties', {
                headers: { 'x-auth-token': adminToken }
            });
            if (propRes.ok) properties = await propRes.json();

            // Fetch Inquiries
            const inqRes = await fetch('http://127.0.0.1:5000/api/admin/inquiries', {
                headers: { 'x-auth-token': adminToken }
            });
            if (inqRes.ok) inquiries = await inqRes.json();

            renderAll();
        } catch (err) {
            console.error('Fetch Error:', err);
            showToast('Error loading dashboard data');
        }
    }

    function renderAll() {
        renderTable('pending');
        renderTable('approved');
        renderTable('rejected');
        renderTable('sold');
        renderInquiries();
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
            
            // Map types to pretty labels and classes
            const typeLabels = {
                'residential': { text: 'Residential', class: 'type-res' },
                'commercial': { text: 'Commercial', class: 'type-com' },
                'agricultural': { text: 'Agricultural', class: 'type-agr' },
                'underdeveloped': { text: 'Undeveloped', class: 'type-und' }
            };
            const tCfg = typeLabels[p.type] || { text: p.type, class: '' };

            const seller = p.sellerId || {};
            const sellerHtml = `
                <div class="adm-seller-info">
                    <div style="font-weight:700;color:var(--adm-navy);font-size:0.75rem">${seller.fullName || 'Unknown'}</div>
                    <div style="font-size:0.68rem;color:var(--adm-muted)">${seller.email || 'No Email'}</div>
                    <div style="font-size:0.68rem;color:var(--adm-blue-mid);font-weight:600">${seller.phoneNumber || 'No Phone'}</div>
                </div>
            `;

            tr.innerHTML = `
                <td>
                    <div class="adm-prop-cell">
                        <div>
                            <div class="adm-prop-name">${p.title}</div>
                            <div class="adm-prop-id">ID: ${p._id.substring(18)}</div>
                        </div>
                    </div>
                </td>
                <td><span class="adm-type-badge ${tCfg.class}">${tCfg.text}</span></td>
                <td><div class="adm-prop-loc">${p.city_town_village}, ${p.district}</div></td>
                <td><div class="adm-prop-price">₹${parseFloat(p.price).toLocaleString('en-IN')}</div></td>
                <td>${sellerHtml}</td>
                <td><div class="adm-prop-date">${date}</div></td>
                <td>
                    <div style="display:flex;gap:0.4rem">
                        <button class="adm-act-btn" onclick="openDrawer('${p._id}')">View</button>
                        <button class="adm-act-btn" style="background:var(--adm-blue-mid);color:white" onclick="openEditDrawer('${p._id}')">Edit</button>
                        ${status === 'approved' ? `
                            <button class="adm-act-btn" style="background:#00C47A;color:white" onclick="updateStatus('${p._id}', 'sold')" title="Mark as Sold">
                                ✓ Sold
                            </button>
                            <button class="adm-act-btn" style="background:#f6ad55;color:white" onclick="updateStatus('${p._id}', 'pending')" title="Move back to Pending">
                                ↩ Reverse
                            </button>
                        ` : ''}
                        ${status === 'rejected' ? `
                            <button class="adm-act-btn" style="background:#f6ad55;color:white" onclick="updateStatus('${p._id}', 'pending')" title="Move back to Pending">
                                ↩ Reverse
                            </button>
                            <button class="adm-act-btn" style="background:#FC8181;color:white" onclick="deleteProperty('${p._id}')" title="Delete Listing">
                                🗑 Delete
                            </button>
                        ` : ''}
                        ${status === 'sold' ? `
                            <button class="adm-act-btn" style="background:#f6ad55;color:white" onclick="updateStatus('${p._id}', 'pending')" title="Move back to Pending">
                                ↩ Reverse
                            </button>
                        ` : ''}
                    </div>
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

    function renderInquiries() {
        const list = document.getElementById('prop-inq-list');
        if (!list) return;

        list.innerHTML = '';
        if (inquiries.length === 0) {
            list.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--adm-muted)">No inquiries received yet.</div>';
            return;
        }

        inquiries.forEach(inq => {
            const date = new Date(inq.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
            
            const div = document.createElement('div');
            div.className = 'inq-item';
            
            // Map internal category to filename
            let page = 'residential_view.html';
            if (inq.propertyType === 'commercial') page = 'commercial_view.html';
            if (inq.propertyType === 'agri') page = 'agricultural_view.html';
            if (inq.propertyType === 'undeveloped') page = 'underdeveloped_view.html';

            div.innerHTML = `
                <div class="inq-left">
                    <div class="inq-header">
                        <span class="inq-from">${inq.name}</span>
                        <span class="inq-for">interested in</span>
                        <strong style="color:var(--adm-navy)">${inq.propertyTitle || 'Property'}</strong>
                    </div>
                    <div class="inq-msg" style="margin: 0.5rem 0">
                        📧 ${inq.email} | 📞 ${inq.phoneNumber}
                    </div>
                    <div class="inq-time">${date}</div>
                </div>
                <div class="inq-acts">
                    <a href="../property_view/${page}?id=${inq.propertyId}" target="_blank" class="inq-btn" style="text-decoration:none">
                        🏢 View Listing
                    </a>
                    <button class="inq-btn reply" onclick="window.location.href='mailto:${inq.email}'">Reply via Email</button>
                </div>
            `;
            list.appendChild(div);
        });

        // Update counts
        const countEl = document.getElementById('prop-inq-count');
        if (countEl) countEl.textContent = inquiries.length;
    }

    function updateStats() {
        const total = properties.length;
        const pending = properties.filter(p => p.status === 'pending').length;
        const approved = properties.filter(p => p.status === 'approved').length;
        const inqCount = inquiries.length;
        
        const statCards = document.querySelectorAll('.adm-stat-val');
        if (statCards.length >= 4) {
            statCards[0].textContent = total;
            statCards[1].textContent = pending;
            statCards[2].textContent = approved;
            statCards[3].textContent = inqCount;
        }

        const swCount = document.getElementById('sw-prop-count');
        if (swCount) swCount.textContent = total;

        const sbInq = document.getElementById('sb-inq-count');
        if (sbInq) sbInq.textContent = inqCount;
    }

    window.openDrawer = function(id) {
        const p = properties.find(x => x._id === id);
        if (!p) return;

        const drawer = document.getElementById('drawer');
        const drawerOverlay = document.getElementById('drawerOverlay');
        const body = document.getElementById('drawerBody');

        // Helper to render type-specific fields
        let extraFields = '';
        if (p.type === 'residential') {
            extraFields = `
                <div class="dr-section">
                    <div class="dr-label">BHK & Area</div>
                    <div class="dr-val">${p.bhk || 'N/A'} • ${p.super_area || p.total_area || 'N/A'} sq ft</div>
                </div>
                <div class="dr-section">
                    <div class="dr-label">Furnishing</div>
                    <div class="dr-val">${p.furnishing || 'N/A'}</div>
                </div>
            `;
        } else if (p.type === 'commercial') {
            extraFields = `
                <div class="dr-section">
                    <div class="dr-label">Type & Listing</div>
                    <div class="dr-val" style="text-transform:capitalize">${p.subtype || 'N/A'} (${p.listing_type || 'Sale'})</div>
                </div>
                <div class="dr-section">
                    <div class="dr-label">Areas</div>
                    <div class="dr-val">Super: ${p.super_area || 'N/A'} • Carpet: ${p.carpet_area || 'N/A'} sq ft</div>
                </div>
                <div class="dr-section">
                    <div class="dr-label">Building Details</div>
                    <div class="dr-val">Floor: ${p.floor_num || 'N/A'} of ${p.total_floors || 'N/A'} • Parking: ${p.parking || 'N/A'}</div>
                </div>
                <div class="dr-section">
                    <div class="dr-label">Business Specifics</div>
                    <div class="dr-val">${p.rooms_count ? `Rooms: ${p.rooms_count} • ` : ''}${p.seating ? `Seating: ${p.seating} • ` : ''}${p.occupancy ? `Occupancy: ${p.occupancy}%` : ''}</div>
                </div>
            `;
        } else if (p.type === 'agricultural') {
            extraFields = `
                <div class="dr-section">
                    <div class="dr-label">Land Usage & Soil</div>
                    <div class="dr-val">${p.subtype || 'N/A'} • ${p.soil_type || 'N/A'} Soil</div>
                </div>
                <div class="dr-section">
                    <div class="dr-label">Irrigation & Crop</div>
                    <div class="dr-val">${p.irrigation || 'N/A'} • ${p.crop_type || 'N/A'}</div>
                </div>
                <div class="dr-section">
                    <div class="dr-label">Area & Yield</div>
                    <div class="dr-val">${p.plot_size || p.total_area || 'N/A'} ${p.area_unit || 'Acres'} • Yield: ${p.yield || 'N/A'}</div>
                </div>
            `;
        } else if (p.type === 'underdeveloped') {
            extraFields = `
                <div class="dr-section">
                    <div class="dr-label">Classification & Use</div>
                    <div class="dr-val">${p.subtype || 'N/A'} • ${p.sub_category || 'N/A'}</div>
                </div>
                <div class="dr-section">
                    <div class="dr-label">Dimensions & Area</div>
                    <div class="dr-val">${p.plot_dimensions || 'N/A'} • ${p.total_area || 'N/A'} ${p.area_unit || 'sq ft'}</div>
                </div>
                <div class="dr-section">
                    <div class="dr-label">Features</div>
                    <div class="dr-val">${p.water_body_type ? `Near ${p.water_body_type} • ` : ''}${p.corner_confirmed === 'Yes' ? 'Corner Plot' : ''}</div>
                </div>
            `;
        }

        body.innerHTML = `
            <div class="dr-section" style="background:var(--adm-off);padding:1rem;border-radius:12px;margin-bottom:1.5rem;border:1px solid var(--adm-lg)">
                <div class="dr-label" style="margin-bottom:0.5rem">Seller Profile</div>
                <div style="display:flex;align-items:center;gap:0.75rem">
                    <div class="adm-avatar" style="width:40px;height:40px;font-size:0.9rem">${(p.sellerId?.fullName || 'U').charAt(0)}</div>
                    <div>
                        <div style="font-weight:700;color:var(--adm-navy)">${p.sellerId?.fullName || 'Unknown Seller'}</div>
                        <div style="font-size:0.75rem;color:var(--adm-muted)">${p.sellerId?.email || 'N/A'} • ${p.sellerId?.phoneNumber || 'N/A'}</div>
                    </div>
                </div>
            </div>
            <div class="dr-section">
                <div class="dr-label">Property Title</div>
                <div class="dr-val" style="font-size:1.2rem;font-weight:600">${p.title}</div>
            </div>
            <div class="dr-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1.5rem 0;">
                <div class="dr-section">
                    <div class="dr-label">Price</div>
                    <div class="dr-val">₹${parseFloat(p.price).toLocaleString('en-IN')} ${p.negotiable === 'Yes' ? '<span style="font-size:0.7rem;color:var(--lf-accent)">(Neg)</span>' : ''}</div>
                </div>
                <div class="dr-section">
                    <div class="dr-label">Category</div>
                    <div class="dr-val" style="text-transform:capitalize">${p.type}</div>
                </div>
                ${extraFields}
            </div>
            <div class="dr-section" style="margin-bottom:1.5rem">
                <div class="dr-label">Location</div>
                <div class="dr-val">${p.locality ? p.locality + ', ' : ''}${p.city_town_village}, ${p.district}, ${p.state}</div>
                ${p.location_link ? `<a href="${p.location_link}" target="_blank" style="font-size:0.8rem;color:var(--lf-accent);text-decoration:none;display:block;margin-top:0.4rem">📍 View on Google Maps</a>` : ''}
            </div>
            <div class="dr-section" style="margin-bottom:1.5rem">
                <div class="dr-label">Description</div>
                <div class="dr-val" style="line-height:1.6; color:rgba(255,255,255,0.7)">${p.description || 'No description provided.'}</div>
            </div>
            <div class="dr-section">
                <div class="dr-label">Property Images</div>
                <div class="dr-img-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.75rem; margin-top: 0.5rem;">
                    ${p.images && p.images.length > 0 
                        ? p.images.map(img => `<img src="${img}" class="dr-img" style="width:100%; height:80px; object-fit:cover; border-radius:8px; cursor:pointer" onclick="window.open('${img}')">`).join('')
                        : '<div style="color:rgba(255,255,255,0.3)">No images uploaded.</div>'
                    }
                </div>
            </div>
            ${p.documents && p.documents.length > 0 ? `
            <div class="dr-section" style="margin-top:1.5rem">
                <div class="dr-label">Documents</div>
                <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.5rem">
                    ${p.documents.map((doc, idx) => `<a href="${doc}" target="_blank" style="padding:0.4rem 0.8rem;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:white;text-decoration:none;font-size:0.8rem">Doc ${idx+1} ↗</a>`).join('')}
                </div>
            </div>` : ''}
        `;

        // Action buttons
        const foot = document.getElementById('drawerFoot');
        foot.innerHTML = `
            <button id="drawerApprove" class="drawer-act-btn approve" onclick="updateStatus('${p._id}', 'approved')">Approve Property</button>
            <button id="drawerReject" class="drawer-act-btn reject" onclick="updateStatus('${p._id}', 'rejected')">Reject Listing</button>
        `;

        // Hide/Show action buttons based on current status
        if (p.status === 'pending') {
            foot.style.display = 'grid';
        } else {
            foot.style.display = 'none';
        }

        drawer.classList.add('open');
        drawerOverlay.classList.add('open');
    };

    window.openEditDrawer = function(id) {
        const p = properties.find(x => x._id === id);
        if (!p) return;

        const drawer = document.getElementById('drawer');
        const drawerOverlay = document.getElementById('drawerOverlay');
        const body = document.getElementById('drawerBody');

        // Dynamically build extra fields for editing
        let extraFieldsHtml = '';
        if (p.type === 'residential') {
            extraFieldsHtml = `
                <div class="dr-section"><label class="dr-label">BHK</label><input type="text" id="edit-bhk" class="adm-filter-sel" style="width:100%" value="${p.bhk || ''}"></div>
                <div class="dr-section"><label class="dr-label">Furnishing</label><input type="text" id="edit-furnishing" class="adm-filter-sel" style="width:100%" value="${p.furnishing || ''}"></div>
                <div class="dr-section"><label class="dr-label">Super Area</label><input type="number" id="edit-super_area" class="adm-filter-sel" style="width:100%" value="${p.super_area || ''}"></div>
                <div class="dr-section"><label class="dr-label">Floor No.</label><input type="number" id="edit-floor_num" class="adm-filter-sel" style="width:100%" value="${p.floor_num || ''}"></div>
            `;
        } else if (p.type === 'commercial') {
            extraFieldsHtml = `
                <div class="dr-section"><label class="dr-label">Subtype</label><input type="text" id="edit-subtype" class="adm-filter-sel" style="width:100%" value="${p.subtype || ''}"></div>
                <div class="dr-section"><label class="dr-label">Super Area</label><input type="number" id="edit-super_area" class="adm-filter-sel" style="width:100%" value="${p.super_area || ''}"></div>
                <div class="dr-section"><label class="dr-label">Carpet Area</label><input type="number" id="edit-carpet_area" class="adm-filter-sel" style="width:100%" value="${p.carpet_area || ''}"></div>
                <div class="dr-section"><label class="dr-label">Floor No.</label><input type="number" id="edit-floor_num" class="adm-filter-sel" style="width:100%" value="${p.floor_num || ''}"></div>
                <div class="dr-section"><label class="dr-label">Total Floors</label><input type="number" id="edit-total_floors" class="adm-filter-sel" style="width:100%" value="${p.total_floors || ''}"></div>
            `;
        } else if (p.type === 'agricultural') {
            extraFieldsHtml = `
                <div class="dr-section"><label class="dr-label">Subtype</label><input type="text" id="edit-subtype" class="adm-filter-sel" style="width:100%" value="${p.subtype || ''}"></div>
                <div class="dr-section"><label class="dr-label">Soil Type</label><input type="text" id="edit-soil_type" class="adm-filter-sel" style="width:100%" value="${p.soil_type || ''}"></div>
                <div class="dr-section"><label class="dr-label">Irrigation</label><input type="text" id="edit-irrigation" class="adm-filter-sel" style="width:100%" value="${p.irrigation || ''}"></div>
                <div class="dr-section"><label class="dr-label">Crop Type</label><input type="text" id="edit-crop_type" class="adm-filter-sel" style="width:100%" value="${p.crop_type || ''}"></div>
                <div class="dr-section"><label class="dr-label">Yield</label><input type="text" id="edit-yield" class="adm-filter-sel" style="width:100%" value="${p.yield || ''}"></div>
            `;
        } else if (p.type === 'underdeveloped') {
            extraFieldsHtml = `
                <div class="dr-section"><label class="dr-label">Subtype</label><input type="text" id="edit-subtype" class="adm-filter-sel" style="width:100%" value="${p.subtype || ''}"></div>
                <div class="dr-section"><label class="dr-label">Planned Use</label><input type="text" id="edit-sub_category" class="adm-filter-sel" style="width:100%" value="${p.sub_category || ''}"></div>
                <div class="dr-section"><label class="dr-label">Dimensions</label><input type="text" id="edit-plot_dimensions" class="adm-filter-sel" style="width:100%" value="${p.plot_dimensions || ''}"></div>
                <div class="dr-section"><label class="dr-label">Total Area</label><input type="number" id="edit-total_area" class="adm-filter-sel" style="width:100%" value="${p.total_area || ''}"></div>
            `;
        }

        body.innerHTML = `
            <div class="dr-section">
                <label class="dr-label">Property Title</label>
                <input type="text" id="edit-title" class="adm-filter-sel" style="width:100%;margin-top:0.5rem" value="${p.title}">
            </div>
            <div class="dr-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1.5rem 0;">
                <div class="dr-section"><label class="dr-label">Price (₹)</label><input type="number" id="edit-price" class="adm-filter-sel" style="width:100%" value="${p.price}"></div>
                <div class="dr-section"><label class="dr-label">Category</label><div class="dr-val" style="text-transform:capitalize;margin-top:0.3rem">${p.type}</div></div>
                ${extraFieldsHtml}
            </div>
            <div class="dr-section" style="margin-bottom:1.5rem">
                <label class="dr-label">Location Details</label>
                <div class="dr-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-top:0.5rem">
                    <input type="text" id="edit-locality" placeholder="Locality" class="adm-filter-sel" value="${p.locality || ''}">
                    <input type="text" id="edit-city" placeholder="City/Town" class="adm-filter-sel" value="${p.city_town_village || ''}">
                    <input type="text" id="edit-district" placeholder="District" class="adm-filter-sel" value="${p.district || ''}">
                    <input type="text" id="edit-state" placeholder="State" class="adm-filter-sel" value="${p.state || ''}">
                </div>
            </div>
            <div class="dr-section" style="margin-bottom:1.5rem">
                <label class="dr-label">Description</label>
                <textarea id="edit-desc" class="adm-filter-sel" style="width:100%;margin-top:0.5rem;height:100px;resize:none;padding:0.8rem">${p.description || ''}</textarea>
            </div>
            <div class="dr-section">
                <div class="dr-label">Manage Images <span style="font-size:0.6rem;color:var(--adm-muted)">(Click red X to remove)</span></div>
                <div id="edit-img-grid" class="dr-img-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.75rem; margin-top: 0.5rem;">
                    ${p.images && p.images.length > 0 
                        ? p.images.map((img, idx) => `
                            <div class="edit-img-wrap" style="position:relative">
                                <img src="${img}" class="dr-img" style="width:100%; height:80px; object-fit:cover; border-radius:8px;">
                                <button onclick="removeImage('${p._id}', ${idx})" style="position:absolute;top:-5px;right:-5px;background:#FC8181;color:white;border-radius:50%;width:20px;height:20px;font-size:12px;display:flex;align-items:center;justify-content:center;border:2px solid white">×</button>
                            </div>
                        `).join('')
                        : '<div style="color:rgba(255,255,255,0.3)">No images uploaded.</div>'
                    }
                </div>
            </div>
        `;

        const foot = document.getElementById('drawerFoot');
        foot.innerHTML = `
            <button class="drawer-act-btn" style="background:var(--adm-navy);color:white" onclick="saveProperty('${p._id}')">Save Changes</button>
            <button class="drawer-act-btn" style="background:var(--adm-lg);color:var(--adm-text)" onclick="closeDrawer()">Cancel</button>
        `;
        foot.style.display = 'grid';

        drawer.classList.add('open');
        drawerOverlay.classList.add('open');
    };

    window.removeImage = function(propId, imgIdx) {
        const p = properties.find(x => x._id === propId);
        if (!p) return;
        
        if (confirm('Remove this image?')) {
            p.images.splice(imgIdx, 1);
            openEditDrawer(propId); // Refresh drawer
        }
    };

    window.saveProperty = async function(id) {
        const p = properties.find(x => x._id === id);
        if (!p) return;

        const updateData = {
            title: document.getElementById('edit-title').value,
            price: document.getElementById('edit-price').value,
            description: document.getElementById('edit-desc').value,
            locality: document.getElementById('edit-locality').value,
            city_town_village: document.getElementById('edit-city').value,
            district: document.getElementById('edit-district').value,
            state: document.getElementById('edit-state').value,
            images: p.images
        };

        // Add type-specific fields
        if (p.type === 'residential') {
            updateData.bhk = document.getElementById('edit-bhk').value;
            updateData.furnishing = document.getElementById('edit-furnishing').value;
            updateData.super_area = document.getElementById('edit-super_area').value;
            updateData.floor_num = document.getElementById('edit-floor_num').value;
        } else if (p.type === 'commercial') {
            updateData.subtype = document.getElementById('edit-subtype').value;
            updateData.super_area = document.getElementById('edit-super_area').value;
            updateData.carpet_area = document.getElementById('edit-carpet_area').value;
            updateData.floor_num = document.getElementById('edit-floor_num').value;
            updateData.total_floors = document.getElementById('edit-total_floors').value;
        } else if (p.type === 'agricultural') {
            updateData.subtype = document.getElementById('edit-subtype').value;
            updateData.soil_type = document.getElementById('edit-soil_type').value;
            updateData.irrigation = document.getElementById('edit-irrigation').value;
            updateData.crop_type = document.getElementById('edit-crop_type').value;
            updateData.yield = document.getElementById('edit-yield').value;
        } else if (p.type === 'underdeveloped') {
            updateData.subtype = document.getElementById('edit-subtype').value;
            updateData.sub_category = document.getElementById('edit-sub_category').value;
            updateData.plot_dimensions = document.getElementById('edit-plot_dimensions').value;
            updateData.total_area = document.getElementById('edit-total_area').value;
        }

        const adminData = JSON.parse(localStorage.getItem('adminUser'));
        const adminToken = adminData ? adminData.token : null;

        try {
            const response = await fetch(`http://127.0.0.1:5000/api/admin/properties/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': adminToken
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();
            if (response.ok) {
                showToast('Property updated successfully!', 'success');
                // Update local properties array
                const idx = properties.findIndex(x => x._id === id);
                properties[idx] = data.property;
                
                renderTable('pending');
                renderTable('approved');
                renderTable('rejected');
                renderTable('sold');
                closeDrawer();
            } else {
                alert(data.message || 'Update failed');
            }
        } catch (err) {
            console.error('Update Error:', err);
            alert('Server error while updating');
        }
    };

    window.updateStatus = async function(id, newStatus) {
        const adminToken = JSON.parse(localStorage.getItem('adminUser'))?.token;
        if (!adminToken) return;

        const btn = newStatus === 'approved' ? document.getElementById('drawerApprove') : 
                    newStatus === 'rejected' ? document.getElementById('drawerReject') : null;
        
        let originalText = '';
        if (btn) {
            originalText = btn.textContent;
            btn.textContent = 'Processing...';
            btn.disabled = true;
        }

        try {
            const response = await fetch(`http://127.0.0.1:5000/api/admin/properties/${id}/status`, {
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
            if (btn) {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        }
    }

    window.deleteProperty = async function(id) {
        if (!confirm('Are you sure you want to PERMANENTLY DELETE this listing? This action cannot be undone.')) return;

        const adminToken = JSON.parse(localStorage.getItem('adminUser'))?.token;
        if (!adminToken) return;

        try {
            const response = await fetch(`http://127.0.0.1:5000/api/admin/properties/${id}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-token': adminToken
                }
            });

            if (!response.ok) throw new Error('Failed to delete property');

            showToast('Property deleted successfully', 'success');
            fetchAllData();
        } catch (err) {
            console.error('Delete Error:', err);
            showToast('Error deleting property');
        }
    }

    function closeDrawer() {
        document.getElementById('drawer').classList.remove('open');
        document.getElementById('drawerOverlay').classList.remove('open');
    }

    document.getElementById('drawerClose').onclick = closeDrawer;
    document.getElementById('drawerOverlay').onclick = closeDrawer;
    
    // Prevent drawer from closing when clicking inside it
    document.getElementById('drawer').onclick = (e) => {
        e.stopPropagation();
    };

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
