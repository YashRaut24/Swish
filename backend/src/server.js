import { createServer } from 'node:http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import app from './app.js';
import registerSockets from './socket/index.js';

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: 'https://swish-frontend.onrender.com',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
});

registerSockets(io);
app.set('io', io);

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    console.log('Database connection established');

    httpServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${PORT} is busy. Switching to a random available port...`);
        const randomServer = httpServer.listen(0, () => {
          const newPort = randomServer.address().port;
          console.log(`\n🚀 Server is running!`);
          console.log(`👉 URL: http://localhost:${newPort}`);
        });
      } else {
        console.error('❌ Server error:', err);
        process.exit(1);
      }
    });

    httpServer.listen(PORT, () => {
      console.log(`\nApplication server started`);
      console.log(`Access at: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Server startup failed:', err.message);
    process.exit(1);
  }
};

start();
