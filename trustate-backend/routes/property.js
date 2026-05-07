const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const ResidentialProperty = require('../models/ResidentialProperty');
const CommercialProperty = require('../models/CommercialProperty');
const AgriculturalProperty = require('../models/AgriculturalProperty');
const UnderdevelopedProperty = require('../models/UnderdevelopedProperty');

// Helper to get correct model
const getModel = (type) => {
    switch (type) {
        case 'residential': return ResidentialProperty;
        case 'commercial': return CommercialProperty;
        case 'agricultural': return AgriculturalProperty;
        case 'underdeveloped': return UnderdevelopedProperty;
        default: return ResidentialProperty;
    }
};

// @route   POST api/properties/submit
// @desc    Add a new property to its specific collection
// @access  Private
router.post('/submit', auth, upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'documents', maxCount: 5 }
]), async (req, res) => {
    try {
        const imageUrls = req.files['images'] ? req.files['images'].map(file => file.path) : [];
        const docUrls = req.files['documents'] ? req.files['documents'].map(file => file.path) : [];

        const propertyData = {
            ...req.body,
            images: imageUrls,
            documents: docUrls,
            sellerId: req.user.userId,
            status: 'pending'
        };

        const PropertyModel = getModel(req.body.type);
        const newProperty = new PropertyModel(propertyData);
        const property = await newProperty.save();

        res.status(201).json({
            message: 'Property listing submitted successfully and is pending approval.',
            property
        });
    } catch (error) {
        console.error('Error saving property:', error);
        res.status(500).json({ message: 'Server error while saving property', error: error.message });
    }
});

// @route   POST api/properties/residential
// @desc    Legacy route
router.post('/residential', auth, upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'documents', maxCount: 5 }
]), async (req, res) => {
    try {
        const imageUrls = req.files['images'] ? req.files['images'].map(file => file.path) : [];
        const docUrls = req.files['documents'] ? req.files['documents'].map(file => file.path) : [];

        const propertyData = {
            ...req.body,
            images: imageUrls,
            documents: docUrls,
            sellerId: req.user.userId,
            status: 'pending'
        };

        const newProperty = new ResidentialProperty(propertyData);
        const property = await newProperty.save();

        res.status(201).json({
            message: 'Property listing submitted successfully and is pending approval.',
            property
        });
    } catch (error) {
        console.error('Error saving property:', error);
        res.status(500).json({ message: 'Server error while saving property' });
    }
});

// @route   GET api/properties/my-listings
// @desc    Get all listings by the logged-in user from ALL collections
// @access  Private
router.get('/my-listings', auth, async (req, res) => {
    try {
        const [resList, comList, agrList, undList] = await Promise.all([
            ResidentialProperty.find({ sellerId: req.user.userId }),
            CommercialProperty.find({ sellerId: req.user.userId }),
            AgriculturalProperty.find({ sellerId: req.user.userId }),
            UnderdevelopedProperty.find({ sellerId: req.user.userId })
        ]);

        const allListings = [...resList, ...comList, ...agrList, ...undList].sort((a, b) => b.createdAt - a.createdAt);
        res.json(allListings);
    } catch (error) {
        console.error('Error fetching user listings:', error);
        res.status(500).json({ message: 'Server error while fetching listings' });
    }
});

// @route   DELETE api/properties/:id
// @desc    Delete a listing (checks all collections)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        let property = null;
        let ModelFound = null;

        const models = [ResidentialProperty, CommercialProperty, AgriculturalProperty, UnderdevelopedProperty];
        
        for (let M of models) {
            property = await M.findById(req.params.id);
            if (property) {
                ModelFound = M;
                break;
            }
        }

        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

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
