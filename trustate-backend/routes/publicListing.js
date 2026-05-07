const express = require('express');
const router = express.Router();
const ResidentialProperty = require('../models/ResidentialProperty');
const CommercialProperty = require('../models/CommercialProperty');
const AgriculturalProperty = require('../models/AgriculturalProperty');
const UnderdevelopedProperty = require('../models/UnderdevelopedProperty');

// @route   GET api/v1/listings
// @desc    Get all approved listings by category and optional subtype
// @access  Public
router.get('/listings', async (req, res) => {
    const { category, subtype } = req.query;

    try {
        let results = [];
        const filter = { status: 'approved' };
        if (subtype && subtype !== 'all') {
            filter.subtype = subtype;
        }

        if (category === 'residential') {
            results = await ResidentialProperty.find(filter).sort({ approvedAt: -1 });
        } else if (category === 'commercial') {
            results = await CommercialProperty.find(filter).sort({ approvedAt: -1 });
        } else if (category === 'agri') {
            results = await AgriculturalProperty.find(filter).sort({ approvedAt: -1 });
        } else if (category === 'undeveloped') {
            results = await UnderdevelopedProperty.find(filter).sort({ approvedAt: -1 });
        } else {
            // If no category, fetch some from all? Or just return empty.
            // For now, let's return empty if no valid category.
            return res.status(400).json({ message: 'Valid category is required' });
        }

        // Format for frontend (main.js renderCards expects a specific shape)
        const formatted = results.map(p => {
            // Map backend type to frontend shorthand if needed
            let cat = p.type;
            if (cat === 'agricultural') cat = 'agri';
            if (cat === 'underdeveloped') cat = 'undeveloped';

            return {
                id: p._id,
                title: p.title || 'Untitled Property',
                price: p.price ? `₹${p.price.toLocaleString('en-IN')}` : 'Price on Request',
                priceLabel: p.negotiable === 'Yes' ? ' (Negotiable)' : '',
                location: (p.city_town_village || p.district) ? `${p.city_town_village || ''}${p.city_town_village && p.state ? ', ' : ''}${p.state || ''}` : 'Location N/A',
                category: cat,
                subtype: p.subtype || 'other',
                subtypeLabel: (p.subtype || 'Property').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                images: (p.images && p.images.length > 0) 
                    ? p.images.map(img => {
                        if (img.startsWith('http')) return img;
                        return `http://127.0.0.1:5000/${img.replace(/\\/g, '/')}`;
                    })
                    : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80'],
                verified: p.status === 'approved',
                chips: [p.super_area ? `${p.super_area} sqm` : '', p.bhk ? `${p.bhk}` : ''].filter(Boolean)
            };
        });

        res.json(formatted);
    } catch (err) {
        console.error('Public Fetch Listings Error:', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
