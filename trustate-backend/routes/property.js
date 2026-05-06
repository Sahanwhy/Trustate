const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const ResidentialProperty = require('../models/ResidentialProperty');

// @route   POST api/properties/residential
// @desc    Add a new residential property with images
// @access  Private
router.post('/residential', auth, upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'documents', maxCount: 5 }
]), async (req, res) => {
    console.log('Received property submission request');
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    try {
        const imageUrls = req.files['images'] ? req.files['images'].map(file => file.path) : [];
        const docUrls = req.files['documents'] ? req.files['documents'].map(file => file.path) : [];

        const propertyData = {
            ...req.body,
            images: imageUrls,
            documents: docUrls,
            sellerId: req.user.userId
        };

        const newProperty = new ResidentialProperty(propertyData);
        const property = await newProperty.save();

        res.status(201).json({
            message: 'Property listing submitted successfully and is pending approval.',
            property
        });
    } catch (error) {
        console.error('Error saving residential property:', error);
        res.status(500).json({ message: 'Server error while saving property' });
    }
});

// @route   GET api/properties/my-listings
// @desc    Get all listings by the logged-in user
// @access  Private
router.get('/my-listings', auth, async (req, res) => {
    try {
        const listings = await ResidentialProperty.find({ sellerId: req.user.userId }).sort({ createdAt: -1 });
        res.json(listings);
    } catch (error) {
        console.error('Error fetching user listings:', error);
        res.status(500).json({ message: 'Server error while fetching listings' });
    }
});

// @route   DELETE api/properties/:id
// @desc    Delete a listing
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const property = await ResidentialProperty.findById(req.params.id);

        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        // Check user ownership
        if (property.sellerId.toString() !== req.user.userId) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await property.deleteOne();
        res.json({ message: 'Property removed' });
    } catch (error) {
        console.error('Error deleting property:', error);
        res.status(500).json({ message: 'Server error while deleting property' });
    }
});

module.exports = router;
