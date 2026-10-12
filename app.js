const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const bookingRoutes = require('./src/routes/booking.routes');
const dataRoutes = require('./src/routes/data.routes');
const { errorHandler, notFound } = require('./src/middlewares/error.middleware');

const app = express();

// --- Security Middleware ---
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
}));

// --- Rate Limiting ---
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// --- Body Parsing ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Logging ---
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// --- Health Check ---
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Namastey API is running 🙏',
    timestamp: new Date().toISOString(),
  });
});

// --- Routes ---
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/data', dataRoutes);
app.use('/api/v1/admin/catalogue', require('./src/routes/catalogue.routes'));

// --- Error Handling ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
