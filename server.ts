import express from 'express';
import path from 'path';
import { config as dotenvConfig } from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { createApp } from './src/api-app';

dotenvConfig();

async function startServer() {
  const app = createApp();
  const PORT = parseInt(process.env.PORT || '3000', 10);

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
