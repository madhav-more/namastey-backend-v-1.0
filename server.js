const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Connect to database then start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Namastey Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to database:', err.message);
    process.exit(1);
  });
