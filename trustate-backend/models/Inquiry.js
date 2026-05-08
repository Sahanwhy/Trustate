const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    propertyId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    propertyType: {
        type: String,
        enum: ['residential', 'commercial', 'agri', 'undeveloped'],
        required: true
    },
    propertyTitle: String, // Store title for quick display
    status: {
        type: String,
        enum: ['new', 'contacted', 'closed'],
        default: 'new'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Inquiry', inquirySchema);
