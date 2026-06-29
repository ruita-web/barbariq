/* Vercel serverless function */
const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BOOKINGS_FILE = '/tmp/bookings.json';
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || '60872711';
const NTFY_TOPIC = process.env.NTFY_TOPIC || 'ntfy-barbariq-BPcy5kKivoMXhRC8';

function readBookings() {
  try { return JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf-8')); } catch { return []; }
}
function writeBookings(d) {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(d, null, 2), 'utf-8');
}

const tokens = new Map();
function genToken() { return crypto.randomBytes(32).toString('hex'); }

const app = express();
app.use(express.json());

app.post('/api/auth', (req, res) => {
  const { passcode } = req.body || {};
  if (!passcode || passcode !== ADMIN_PASSCODE) {
    console.log('Auth failed: entered="' + passcode + '", expected="' + ADMIN_PASSCODE + '"');
    return res.status(401).json({ error: 'Invalid passcode' });
  }
  const token = genToken();
  tokens.set(token, Date.now());
  res.json({ success: true, token, ntfyTopic: NTFY_TOPIC });
});

app.get('/api/bookings', (req, res) => res.json(readBookings()));

app.post('/api/bookings', (req, res) => {
  const body = req.body || {};
  const required = ['id', 'userName', 'userPhone', 'serviceId', 'serviceName', 'price', 'date', 'timeSlot', 'status', 'createdAt'];
  for (const f of required) { if (body[f] == null) return res.status(400).json({ error: 'Missing: ' + f }); }
  const b = readBookings();
  b.unshift(body);
  writeBookings(b);
  res.json({ success: true });
});

app.delete('/api/bookings/:id', (req, res) => {
  const t = req.headers['x-admin-token'];
  if (!t || !tokens.has(t)) return res.status(401).json({ error: 'Unauthorized' });
  const b = readBookings().filter(x => x.id !== req.params.id);
  writeBookings(b);
  res.json({ success: true });
});

module.exports = app;
