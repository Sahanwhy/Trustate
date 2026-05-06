const mongoose = require('mongoose');

const residentialPropertySchema = new mongoose.Schema({
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
        required: true,
        enum: ['residential', 'commercial', 'agricultural', 'underdeveloped']
    },
    state: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: true
    },
    city_town_village: {
        type: String,
        required: true
    },
    locality: {
        type: String,
        required: true
    },
    location_link: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    subtype: {
        type: String,
        required: true,
        enum: ['apartment', 'house', 'builder-floor', 'studio', 'penthouse', 'plot']
    },
    // Dynamic fields based on subtype
    bhk: String,
    furnishing: String,
    super_area: Number,
    carpet_area: Number,
    floor_num: Number,
    total_floors: Number,
    plot_area: Number,
    built_up_area: Number,
    floors_count: Number,
    property_age: Number,
    parking: String,
    amenities: String,
    total_area: Number,
    ideal_for: String,
    private_terrace: String,
    luxury_amenities: String,
    plot_size: Number,
    area_unit: String,
    road_access: Number,
    facing: String,
    
    // Shared fields
    price: {
        type: Number,
        required: true
    },
    negotiable: {
        type: String,
        default: 'No'
    },
    ownership_type: String,
    
    // Media (Storing paths or URLs)
    images: [String],
    documents: [String],
    
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { collection: 'Residential_property' });

module.exports = mongoose.model('ResidentialProperty', residentialPropertySchema);
