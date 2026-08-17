import http from 'http';
import app from './app';
import { config } from './config/env';
import { testConnection } from './config/database';
import { initSocket } from './config/socket';

const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    await testConnection();

    // Create HTTP server
    const httpServer = http.createServer(app);

    // Initialize Socket.io
    initSocket(httpServer);
    console.log('✓ Socket.io initialized');

    // Start server
    httpServer.listen(config.port, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🍜 WARUNG MIE BALAP API SERVER                             ║
║                                                               ║
║   Server:     http://localhost:${config.port}                    ║
║   Socket.io:  Ready ✓                                        ║
║   Environment: ${config.nodeEnv.padEnd(44)}║
║   Database:   Connected ✓                                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();
