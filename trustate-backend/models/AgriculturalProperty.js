const mongoose = require('mongoose');

const agriculturalPropertySchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        default: 'agricultural'
    },
    subtype: {
        type: String,
        required: true
    },
    state: String,
    district: String,
    city_town_village: String,
    locality: String,
    location_link: String,
    description: String,
    
    // Agricultural specific
    soil_type: String,
    irrigation: String,
    crop_type: String,
    plantation_type: String,
    plantation_age: Number,
    yield: String,
    livestock_type: String,
    capacity: String,
    utilities: String,
    infrastructure: String,
    facilities: String,
    soil_potential: String,
    plot_size: Number,
    area_unit: String,
    total_area: Number,
    road_access: String,
    ownership: String,

    price: {
        type: Number,
        required: true
    },
    negotiable: {
        type: String,
        default: 'No'
    },
    
    images: [String],
    documents: [String],
    
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'sold'],
        default: 'pending'
    },
    approvedAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { collection: 'Agricultural_property' });

module.exports = mongoose.model('AgriculturalProperty', agriculturalPropertySchema);
