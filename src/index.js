const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes      = require('./routes/auth');
const cardsRoutes     = require('./routes/cards');
const collectedRoutes = require('./routes/collected');

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────
app.use('/auth',      authRoutes);
app.use('/cards',     cardsRoutes);
app.use('/collected', collectedRoutes);

// ─── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Carded API', version: '1.0.0', db: 'PostgreSQL (Neon)' });
});

// ─── 404 ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Start (local dev only — Vercel uses module.exports) ──────
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🃏 Carded API running on http://localhost:${PORT}`);
    console.log(`   Health → http://localhost:${PORT}/health`);
  });
}

// Required for Vercel serverless
module.exports = app;
