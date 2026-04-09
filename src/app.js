// Express app configuration — middleware, routes, and error handling

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import xssClean from 'xss-clean';

import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();


// ─── Security Middleware ──────────────────────────────────────────────────

// helmet: Sets various HTTP headers to protect against common attacks
// e.g., X-Frame-Options (clickjacking), X-XSS-Protection, etc.
app.use(helmet());

// cors: Controls which domains can call your API
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true, // Allow cookies to be sent cross-origin
}));

// Sanitize MongoDB queries — prevents NoSQL injection attacks
// e.g., { "email": { "$gt": "" } } → stripped of operators
app.use(mongoSanitize());

// Clean user input to prevent XSS — strips <script> tags etc.
app.use(xssClean());

// Apply general rate limit to all API routes
app.use('/api', apiLimiter);

// ─── General Middleware ───────────────────────────────────────────────────

app.use(express.json({ limit: '10kb' }));  // Parse JSON bodies; limit size to prevent DoS
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());                    // Parse cookies (needed for refresh tokens)

// HTTP request logging (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Routes ───────────────────────────────────────────────────────────────

app.use('/api/auth',  authRoutes);
app.use('/api/users', userRoutes);

// Health check — useful for deployment platforms
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler — for routes that don't exist
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────
// Must be defined last, after all routes
app.use(errorHandler);

export default app;