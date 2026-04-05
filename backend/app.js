require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes.route');
const userRoutes = require('./routes/userRoutes.route');
const recordRoutes = require('./routes/recordRoutes.route');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware.middleware');

// ─── Connect to MongoDB ────────────────────────────────────────────────────
connectDB();

const app = express();

// ─── Security Middleware ───────────────────────────────────────────────────
app.use(helmet()); // Sets secure HTTP headers

// ─── CORS ──────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────
// Prevents brute-force and DoS — allows 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ─── Body Parser ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Restrict body size
app.use(express.urlencoded({ extended: true }));

// ─── Request Logger ────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Health Check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Finance API is up and running 🚀',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/users',   userRoutes);
app.use('/api/records', recordRoutes);

// ─── 404 Handler ───────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ─── Centralized Error Handler ─────────────────────────────────────────────
// Must have 4 parameters — Express identifies it as error middleware
app.use(errorHandler);

module.exports = app;
