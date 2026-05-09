const express = require('express');
const router = express.Router();
const ResidentialProperty = require('../models/ResidentialProperty');
const CommercialProperty = require('../models/CommercialProperty');
const AgriculturalProperty = require('../models/AgriculturalProperty');
const UnderdevelopedProperty = require('../models/UnderdevelopedProperty');
const Inquiry = require('../models/Inquiry');

// @route   POST api/v1/inquiry
// @desc    Submit a property inquiry
// @access  Public
router.post('/inquiry', async (req, res) => {
    const { name, phoneNumber, email, propertyId, propertyType, propertyTitle } = req.body;

    try {
        const newInquiry = new Inquiry({
            name,
            phoneNumber,
            email,
            propertyId,
            propertyType,
            propertyTitle
        });

        await newInquiry.save();
        res.status(201).json({ message: 'Inquiry submitted successfully' });
    } catch (err) {
        console.error('Inquiry Submission Error:', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;

// @route   GET api/v1/listings
// @desc    Get all approved listings by category and optional subtype
// @access  Public
router.get('/listings', async (req, res) => {
    const { category, subtype, location, minPrice, maxPrice } = req.query;

    try {
        let results = [];
        const filter = { status: 'approved' };
        
        if (subtype && subtype !== 'all') {
            // Normalization: map filter-pill keys to all known DB variants
            // so both old (short) and new (canonical) subtypes match.
            const SUBTYPE_ALIASES = {
                // Commercial
                'office-space': ['office-space', 'office'],
                'retail-shop': ['retail-shop', 'retail'],
                'hotel-guest-house': ['hotel-guest-house', 'hotel'],
                'commercial-land': ['commercial-land', 'com-land'],
                // Residential
                'house-villa': ['house-villa', 'house'],
                'studio-1rk': ['studio-1rk', 'studio'],
                'plot-land': ['plot-land', 'plot'],
                // Agricultural
                'plantation-land': ['plantation-land', 'plantation'],
                'farmhouse-estate': ['farmhouse-estate', 'farmhouse'],
                'livestock-farm': ['livestock-farm', 'livestock'],
                'unused-barren': ['unused-barren', 'barren'],
            };

            const aliases = SUBTYPE_ALIASES[subtype];
            if (aliases) {
                filter.subtype = { $in: aliases };
            } else {
                filter.subtype = subtype;
            }
        }

        if (location) {
            filter.$or = [
                { title: { $regex: location, $options: 'i' } },
                { city_town_village: { $regex: location, $options: 'i' } },
                { district: { $regex: location, $options: 'i' } },
                { state: { $regex: location, $options: 'i' } },
                { locality: { $regex: location, $options: 'i' } },
                { description: { $regex: location, $options: 'i' } }
            ];
        }

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
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

// @route   GET api/v1/property/:category/:id
// @desc    Get single property details (Public view)
// @access  Public
router.get('/property/:category/:id', async (req, res) => {
    const { category, id } = req.params;

    try {
        let property;
        if (category === 'residential') {
            property = await ResidentialProperty.findById(id);
        } else if (category === 'commercial') {
            property = await CommercialProperty.findById(id);
        } else if (category === 'agri') {
            property = await AgriculturalProperty.findById(id);
        } else if (category === 'undeveloped') {
            property = await UnderdevelopedProperty.findById(id);
        } else {
            return res.status(400).json({ message: 'Invalid category' });
        }

        if (!property || property.status !== 'approved') {
            return res.status(404).json({ message: 'Property not found' });
        }

        // Convert to object and remove sellerId / sensitive fields
        const p = property.toObject();
        delete p.sellerId;
        delete p.documents; // Documents are for admin only
        
        res.json(p);
    } catch (err) {
        console.error('Fetch Single Property Error:', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
