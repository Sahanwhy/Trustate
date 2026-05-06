const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/properties', require('./routes/property'));
app.use('/api/admin/auth', require('./routes/adminAuth'));
app.use('/api/admin', require('./routes/admin'));

// Basic Route
app.get('/', (req, res) => {
    res.send('Trustate Backend API is running...');
});

// Database Connection
const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error('❌ MONGODB_URI is not defined in .env file');
    process.exit(1);
}

mongoose.connect(uri)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    res.status(500).json({
        message: 'Something went wrong!',
        error: err.message
    });
});
