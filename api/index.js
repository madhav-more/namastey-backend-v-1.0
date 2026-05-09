const app = require('../app');
const connectDB = require('../src/config/db');

// Connect to MongoDB
connectDB();

module.exports = app;
