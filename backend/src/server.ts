import http from 'http';
import os from 'os';
import { app } from './app';
import { env } from './config/env';
import { initSocket } from './socket';
import { startScheduler } from './services/scheduler';

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Listen on all network interfaces for LAN/mobile access
server.listen(env.port, '0.0.0.0', () => {
  console.log(`\nHotel API running on port ${env.port}`);

  console.log('Use one of these addresses as EXPO_PUBLIC_API_URL in mobile/.env:');

  for (const list of Object.values(os.networkInterfaces())) {
    for (const i of list ?? []) {
      if (i.family === 'IPv4' && !i.internal) {
        console.log(`  http://${i.address}:${env.port}`);
      }
    }
  }

  console.log('');

  // Start scheduled tasks
  startScheduler();
});
