import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export const DATA_DIR = path.join(process.cwd(), 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || '60872711';
const NTFY_TOPIC = process.env.NTFY_TOPIC || 'ntfy-barbariq-BPcy5kKivoMXhRC8';

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readBookings(): any[] {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeBookings(data: any[]) {
  ensureDataDir();
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

const rateLimits = new Map<string, { count: number; resetAt: number }>();
function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= max;
}

const adminTokens = new Map<string, number>();
const TOKEN_TTL = 24 * 60 * 60 * 1000;

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers['x-admin-token'] as string;
  if (!token || !adminTokens.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const createdAt = adminTokens.get(token)!;
  if (Date.now() - createdAt > TOKEN_TTL) {
    adminTokens.delete(token);
    return res.status(401).json({ error: 'Token expired' });
  }
  adminTokens.set(token, Date.now());
  next();
}

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '16kb' }));

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  // Health
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy' });
  });

  // Admin auth
  app.post('/api/auth', (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (!rateLimit(`auth:${ip}`, 5, 60000)) {
      return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    }
    const { passcode } = req.body || {};
    if (!passcode || passcode !== ADMIN_PASSCODE) {
      return res.status(401).json({ error: 'Invalid passcode' });
    }
    const token = generateToken();
    adminTokens.set(token, Date.now());
    res.json({ success: true, token, ntfyTopic: NTFY_TOPIC });
  });

  // Bookings
  app.get('/api/bookings', (req, res) => {
    res.json(readBookings());
  });

  app.post('/api/bookings', (req, res) => {
    const body = req.body || {};
    const required = ['id', 'userName', 'userPhone', 'serviceId', 'serviceName', 'price', 'date', 'timeSlot', 'status', 'createdAt'];
    for (const field of required) {
      if (body[field] === undefined || body[field] === null) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (!rateLimit(`booking:${ip}`, 10, 60000)) {
      return res.status(429).json({ error: 'Too many bookings. Slow down.' });
    }
    const bookings = readBookings();
    bookings.unshift(body);
    writeBookings(bookings);
    res.json({ success: true });
  });

  app.delete('/api/bookings/:id', requireAdmin, (req, res) => {
    const bookings = readBookings().filter((b: any) => b.id !== req.params.id);
    writeBookings(bookings);
    res.json({ success: true });
  });

  return app;
}
