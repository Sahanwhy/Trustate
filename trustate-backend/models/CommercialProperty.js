const mongoose = require('mongoose');

const commercialPropertySchema = new mongoose.Schema({
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
        default: 'commercial'
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
    
    // Commercial specific
    office_type: String,
    retail_type: String,
    furnishing: String,
    super_area: Number,
    carpet_area: Number,
    floor_num: Number,
    total_floors: Number,
    parking: String,
    backup_internet: String,
    frontage: Number,
    footfall: String,
    land_area: Number,
    capacity: String,
    ceiling_height: Number,
    truck_access: String,
    industry_type: String,
    power_capacity: Number,
    rooms_count: Number,
    occupancy: Number,
    hotel_features: String,
    seating: Number,
    kitchen_setup: String,
    gas_provision: String,
    location_type: String,
    listing_type: String,
    maintenance: Number,
    plot_size: Number,
    area_unit: String,
    road_access: String,

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
}, { collection: 'Commercial_property' });

module.exports = mongoose.model('CommercialProperty', commercialPropertySchema);
