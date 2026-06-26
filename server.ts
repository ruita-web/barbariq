/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const DATA_DIR = path.join(process.cwd(), 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readBookings(): any[] {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(BOOKINGS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeBookings(data: any[]) {
  ensureDataDir();
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', database: 'local_state' });
  });

  // Bookings API — shared JSON file for cross-device sync
  app.get('/api/bookings', (req, res) => {
    res.json(readBookings());
  });

  app.post('/api/bookings', (req, res) => {
    const bookings = readBookings();
    bookings.unshift(req.body);
    writeBookings(bookings);
    res.json({ success: true });
  });

  app.delete('/api/bookings/:id', (req, res) => {
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production static bundle from:', distPath);
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
