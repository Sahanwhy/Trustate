/* ================================================================
   Trustate — property_view.js
   Logic for fetching and displaying property details
   ================================================================ */

const BASE_URL = 'http://127.0.0.1:5000/api/v1';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    // Determine category from the filename
    const filename = window.location.pathname.split('/').pop();
    let category = 'residential';
    if (filename.includes('commercial')) category = 'commercial';
    if (filename.includes('agricultural')) category = 'agri';
    if (filename.includes('underdeveloped')) category = 'undeveloped';

    if (!id) {
        alert('Property ID not found.');
        window.location.href = '../index.html';
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/property/${category}/${id}`);
        if (!response.ok) throw new Error('Property not found');
        const property = await response.json();
        
        renderPropertyDetails(property, category);
    } catch (error) {
        console.error('Error fetching property:', error);
        document.getElementById('propertyTitle').innerText = 'Property not found';
    }
});

function renderPropertyDetails(p, category) {
    // Basic Info
    document.getElementById('propertyTitle').innerText = p.title;
    document.getElementById('propertyLocation').innerText = `${p.city_town_village || ''}, ${p.district || ''}, ${p.state || ''}`.replace(/^, /, '');
    document.getElementById('propertyPrice').innerText = `₹${(p.price || 0).toLocaleString('en-IN')}`;
    document.getElementById('propertyDescription').innerText = p.description || 'No description provided.';
    document.getElementById('priceMeta').innerText = `Negotiable: ${p.negotiable} | Ownership: ${p.ownership_type || 'N/A'}`;

    // Images
    const mainImg = document.getElementById('mainImage');
    const sideImages = document.getElementById('sideImages');
    
    if (p.images && p.images.length > 0) {
        const fullImages = p.images.map(img => img.startsWith('http') ? img : `http://127.0.0.1:5000/${img.replace(/\\/g, '/')}`);
        mainImg.src = fullImages[0];
        
        sideImages.innerHTML = fullImages.slice(1, 3).map(img => `
            <div class="side-img-wrap">
                <img src="${img}" alt="Property" class="side-img" onclick="swapImage(this)">
            </div>
        `).join('');
    }

    // Features Grid
    const featuresGrid = document.getElementById('featuresGrid');
    let features = [];

    if (category === 'residential') {
        features = [
            { label: 'BHK', value: p.bhk },
            { label: 'Area', value: p.super_area ? `${p.super_area} ${p.area_unit || 'sqft'}` : null },
            { label: 'Furnishing', value: p.furnishing },
            { label: 'Floor', value: p.floor_num ? `${p.floor_num} of ${p.total_floors}` : null },
            { label: 'Age', value: p.property_age ? `${p.property_age} Years` : null },
            { label: 'Facing', value: p.facing }
        ];
    } else if (category === 'commercial') {
        features = [
            { label: 'Subtype', value: p.subtype },
            { label: 'Area', value: p.total_area ? `${p.total_area} ${p.area_unit || 'sqft'}` : null },
            { label: 'Floors', value: p.floors_count },
            { label: 'Ideal For', value: p.ideal_for },
            { label: 'Parking', value: p.parking_ratio }
        ];
    } else if (category === 'agri') {
        features = [
            { label: 'Total Area', value: p.total_area ? `${p.total_area} ${p.area_unit || 'Acres'}` : null },
            { label: 'Soil Type', value: p.soil_type },
            { label: 'Irrigation', value: p.irrigation },
            { label: 'Road Access', value: p.road_access }
        ];
    } else {
        features = [
            { label: 'Total Area', value: p.total_area ? `${p.total_area} ${p.area_unit || 'sqft'}` : null },
            { label: 'Classification', value: p.land_classification },
            { label: 'Road Access', value: p.access_road },
            { label: 'Facing', value: p.facing }
        ];
    }

    featuresGrid.innerHTML = features.filter(f => f.value).map(f => `
        <div class="feature-item">
            <span class="feature-label">${f.label}</span>
            <span class="feature-value">${f.value}</span>
        </div>
    `).join('');

    // Amenities
    const amenitiesList = document.getElementById('amenitiesList');
    const ams = (p.amenities || p.infrastructure || '').split(',').filter(Boolean);
    if (ams.length > 0) {
        amenitiesList.innerHTML = ams.map(a => `
            <div class="amenity-item">
                <span class="amenity-icon">✓</span>
                <span>${a.trim()}</span>
            </div>
        `).join('');
    } else {
        amenitiesList.innerHTML = '<p>No specific amenities listed.</p>';
    }
}

function swapImage(el) {
    const mainImg = document.getElementById('mainImage');
    const oldMain = mainImg.src;
    mainImg.src = el.src;
    el.src = oldMain;
}

document.getElementById('inquireBtn').addEventListener('click', () => {
    alert('Thank you for your interest! A Trustate admin will contact you shortly to coordinate the next steps.');
});
