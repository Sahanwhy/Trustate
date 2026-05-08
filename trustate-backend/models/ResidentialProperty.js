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
        default: 'residential'
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
    
    // Residential specific
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
    road_access: String,
    facing: String,

    price: {
        type: Number,
        required: true
    },
    negotiable: {
        type: String,
        default: 'No'
    },
    ownership_type: String,
    
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
}, { collection: 'Residential_property' });

module.exports = mongoose.model('ResidentialProperty', residentialPropertySchema);
