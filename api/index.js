/* Vercel serverless function — standalone Express app for API routes */
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Try to load dotenv (optional — Vercel uses env vars natively)
try { require('dotenv').config(); } catch (_) {}

const DATA_DIR = path.join(process.cwd(), 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || '60872711';
const NTFY_TOPIC = process.env.NTFY_TOPIC || 'ntfy-barbariq-BPcy5kKivoMXhRC8';

function ensureDir() { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); }
function readBookings() { ensureDir(); try { return JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf-8')); } catch { return []; } }
function writeBookings(d) { ensureDir(); fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(d, null, 2), 'utf-8'); }

// Rate limiter
const rateLimits = new Map();
function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (!entry || now > entry.resetAt) { rateLimits.set(key, { count: 1, resetAt: now + windowMs }); return true; }
  entry.count++;
  return entry.count <= max;
}

// Admin tokens
const adminTokens = new Map();
function genToken() { return crypto.randomBytes(32).toString('hex'); }
function requireAdmin(req, res, next) {
  const t = req.headers['x-admin-token'];
  if (!t || !adminTokens.has(t)) return res.status(401).json({ error: 'Unauthorized' });
  if (Date.now() - adminTokens.get(t) > 86400000) { adminTokens.delete(t); return res.status(401).json({ error: 'Token expired' }); }
  adminTokens.set(t, Date.now());
  next();
}

const app = express();
app.use(express.json({ limit: '16kb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.get('/api/health', (req, res) => res.json({ status: 'healthy' }));

app.post('/api/auth', (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!rateLimit('auth:' + ip, 5, 60000)) return res.status(429).json({ error: 'Too many attempts. Try again later.' });
  const { passcode } = req.body || {};
  if (!passcode || passcode !== ADMIN_PASSCODE) return res.status(401).json({ error: 'Invalid passcode' });
  const token = genToken();
  adminTokens.set(token, Date.now());
  res.json({ success: true, token, ntfyTopic: NTFY_TOPIC });
});

app.get('/api/bookings', (req, res) => res.json(readBookings()));

app.post('/api/bookings', (req, res) => {
  const body = req.body || {};
  const required = ['id', 'userName', 'userPhone', 'serviceId', 'serviceName', 'price', 'date', 'timeSlot', 'status', 'createdAt'];
  for (const f of required) { if (body[f] === undefined || body[f] === null) return res.status(400).json({ error: 'Missing required field: ' + f }); }
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!rateLimit('booking:' + ip, 10, 60000)) return res.status(429).json({ error: 'Too many bookings. Slow down.' });
  const bookings = readBookings();
  bookings.unshift(body);
  writeBookings(bookings);
  res.json({ success: true });
});

app.delete('/api/bookings/:id', requireAdmin, (req, res) => {
  const bookings = readBookings().filter(b => b.id !== req.params.id);
  writeBookings(bookings);
  res.json({ success: true });
});

module.exports = app;
