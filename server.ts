import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { config as dotenvConfig } from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenvConfig();

const DATA_DIR = path.join(process.cwd(), 'data');
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

// Simple in-memory rate limiter
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

// Token store — maps token -> { createdAt }
const adminTokens = new Map<string, number>();
const TOKEN_TTL = 24 * 60 * 60 * 1000; // 24h

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
  // Refresh TTL on use
  adminTokens.set(token, Date.now());
  next();
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

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

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy' });
  });

  // Admin authentication
  app.post('/api/auth', (req, res) => {
    // Rate limit: 5 attempts per IP per minute
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

  // Public bookings — anyone can view and create bookings
  app.get('/api/bookings', (req, res) => {
    res.json(readBookings());
  });

  app.post('/api/bookings', (req, res) => {
    const body = req.body || {};
    // Validate required fields
    const required = ['id', 'userName', 'userPhone', 'serviceId', 'serviceName', 'price', 'date', 'timeSlot', 'status', 'createdAt'];
    for (const field of required) {
      if (body[field] === undefined || body[field] === null) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }
    // Rate limit: 10 bookings per IP per minute
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (!rateLimit(`booking:${ip}`, 10, 60000)) {
      return res.status(429).json({ error: 'Too many bookings. Slow down.' });
    }
    const bookings = readBookings();
    bookings.unshift(body);
    writeBookings(bookings);
    res.json({ success: true });
  });

  // Admin-only: delete a booking
  app.delete('/api/bookings/:id', requireAdmin, (req, res) => {
    const bookings = readBookings().filter((b: any) => b.id !== req.params.id);
    writeBookings(bookings);
    res.json({ success: true });
  });

  // Vite integration
  if (process.env.NODE_ENV === 'development') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware loaded in Development Mode.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA fallback — serve index.html for non-API routes
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  function tryListen(port: number) {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`Barbariq Server running on http://localhost:${port}`);
    });
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE' && port < PORT + 10) {
        console.log(`Port ${port} in use, trying ${port + 1}...`);
        tryListen(port + 1);
      } else {
        console.error('Server error:', err.message);
        process.exit(1);
      }
    });
  }

  tryListen(PORT);
}

startServer();
