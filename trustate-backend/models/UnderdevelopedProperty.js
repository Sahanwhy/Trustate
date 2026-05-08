const mongoose = require('mongoose');

const underdevelopedPropertySchema = new mongoose.Schema({
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
        default: 'underdeveloped'
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
    
    // Underdeveloped specific
    sub_category: String,
    total_area: Number,
    area_unit: String,
    plot_dimensions: String,
    title_type: String,
    land_classification: String,
    access_road: String,
    utilities_nearby: String,
    water_body_type: String,
    distance_from_water: Number,
    flood_risk: String,
    direct_access: String,
    corner_confirmed: String,
    road_width_1: Number,
    road_width_2: Number,
    facing: String,
    layout_approved: String,

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
}, { collection: 'Underdeveloped_land' });

module.exports = mongoose.model('UnderdevelopedProperty', underdevelopedPropertySchema);
