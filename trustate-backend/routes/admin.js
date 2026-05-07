const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const ResidentialProperty = require('../models/ResidentialProperty');
const CommercialProperty = require('../models/CommercialProperty');
const AgriculturalProperty = require('../models/AgriculturalProperty');
const UnderdevelopedProperty = require('../models/UnderdevelopedProperty');

// @route   GET api/admin/properties
// @desc    Get all properties from ALL collections for admin management
// @access  Private (Admin)
router.get('/properties', adminAuth, async (req, res) => {
    try {
        const [resList, comList, agrList, undList] = await Promise.all([
            ResidentialProperty.find().sort({ createdAt: -1 }),
            CommercialProperty.find().sort({ createdAt: -1 }),
            AgriculturalProperty.find().sort({ createdAt: -1 }),
            UnderdevelopedProperty.find().sort({ createdAt: -1 })
        ]);

        const allProperties = [...resList, ...comList, ...agrList, ...undList].sort((a, b) => b.createdAt - a.createdAt);
        res.json(allProperties);
    } catch (err) {
        console.error('Admin Fetch Properties Error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/admin/properties/:id/status
// @desc    Update property status (approve/reject) across all collections
// @access  Private (Admin)
router.put('/properties/:id/status', adminAuth, async (req, res) => {
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        let property = null;
        let ModelUsed = null;
        const models = [ResidentialProperty, CommercialProperty, AgriculturalProperty, UnderdevelopedProperty];

        for (let M of models) {
            property = await M.findById(req.params.id);
            if (property) {
                ModelUsed = M;
                break;
            }
        }

        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        property.status = status;
        if (status === 'approved') {
            property.approvedAt = Date.now();
        }

        await property.save();
        res.json({ message: `Property ${status} successfully`, property });
    } catch (err) {
        console.error('Admin Update Status Error:', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
