const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const ResidentialProperty = require('../models/ResidentialProperty');

// @route   GET api/admin/properties
// @desc    Get all properties for admin management
// @access  Private (Admin)
router.get('/properties', adminAuth, async (req, res) => {
    try {
        const properties = await ResidentialProperty.find().sort({ createdAt: -1 });
        res.json(properties);
    } catch (err) {
        console.error('Admin Fetch Properties Error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/admin/properties/:id/status
// @desc    Update property status (approve/reject)
// @access  Private (Admin)
router.put('/properties/:id/status', adminAuth, async (req, res) => {
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        let property = await ResidentialProperty.findById(req.params.id);
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
