import { createHash, randomBytes } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';

const BOOKINGS_FILE = '/tmp/bookings.json';
const ADMIN_PASSCODE = '60872711';
const NTFY_TOPIC = 'ntfy-barbariq-BPcy5kKivoMXhRC8';

function readBookings() {
  try { return JSON.parse(readFileSync(BOOKINGS_FILE, 'utf-8')); } catch { return []; }
}
function writeBookings(d) {
  writeFileSync(BOOKINGS_FILE, JSON.stringify(d, null, 2), 'utf-8');
}

const tokens = new Map();
function genToken() { return randomBytes(32).toString('hex'); }

function json(res, code, data) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export default function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;

  if (path === '/api/health') return json(res, 200, { ok: true, passcode: ADMIN_PASSCODE });

  if (path === '/api/auth' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { passcode } = JSON.parse(body);
        if (passcode === ADMIN_PASSCODE) {
          const token = genToken();
          tokens.set(token, Date.now());
          json(res, 200, { success: true, token, ntfyTopic: NTFY_TOPIC });
        } else {
          json(res, 401, { error: 'Invalid passcode' });
        }
      } catch { json(res, 400, { error: 'Bad request' }); }
    });
    return;
  }

  json(res, 404, { error: 'Not found' });
};
