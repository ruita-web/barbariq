/* Vercel serverless function — zero dependencies, no Express */
const crypto = require('crypto');
const fs = require('fs');

const BOOKINGS_FILE = '/tmp/bookings.json';
const ADMIN_PASSCODE = '60872711';
const NTFY_TOPIC = 'ntfy-barbariq-BPcy5kKivoMXhRC8';

function readBookings() {
  try { return JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf-8')); } catch { return []; }
}
function writeBookings(d) {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(d, null, 2), 'utf-8');
}

const tokens = new Map();
function genToken() { return crypto.randomBytes(32).toString('hex'); }

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname;

  let body = {};
  if (['POST', 'DELETE', 'PATCH'].includes(req.method)) {
    try {
      const raw = await new Promise(resolve => {
        let d = '';
        req.on('data', c => d += c);
        req.on('end', () => resolve(d));
      });
      body = JSON.parse(raw);
    } catch {}
  }

  // POST /api/auth — admin login
  if (path === '/api/auth' && req.method === 'POST') {
    const entered = body.passcode;
    if (entered && entered === ADMIN_PASSCODE) {
      const token = genToken();
      tokens.set(token, Date.now());
      res.status(200).json({ success: true, token, ntfyTopic: NTFY_TOPIC });
    } else {
      res.status(401).json({
        error: 'Invalid passcode',
        debug: { entered, enteredType: typeof entered, expected: ADMIN_PASSCODE, rawBody: JSON.stringify(body) }
      });
    }
    return;
  }

  // GET /api/bookings
  if (path === '/api/bookings' && req.method === 'GET') {
    res.status(200).json(readBookings());
    return;
  }

  // POST /api/bookings — create booking
  if (path === '/api/bookings' && req.method === 'POST') {
    const required = ['id', 'userName', 'userPhone', 'serviceId', 'serviceName', 'price', 'date', 'timeSlot', 'status', 'createdAt'];
    for (const f of required) {
      if (body[f] == null) { res.status(400).json({ error: 'Missing: ' + f }); return; }
    }
    const b = readBookings();
    b.unshift(body);
    writeBookings(b);
    res.status(200).json({ success: true });
    return;
  }

  // DELETE /api/bookings/:id
  const delMatch = path.match(/^\/api\/bookings\/(.+)$/);
  if (delMatch && req.method === 'DELETE') {
    const t = req.headers['x-admin-token'];
    if (!t || !tokens.has(t)) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const b = readBookings().filter(x => x.id !== delMatch[1]);
    writeBookings(b);
    res.status(200).json({ success: true });
    return;
  }

  // health
  if (path === '/api/health') {
    return res.status(200).json({ status: 'healthy', passcode: ADMIN_PASSCODE });
  }

  // test — verify function works
  if (path === '/api/test-auth') {
    return res.status(200).json({
      method: req.method,
      url: req.url,
      body: 'use POST /api/auth with {"passcode":"60872711"}'
    });
  }

  res.status(404).json({ error: 'Not found' });
};
