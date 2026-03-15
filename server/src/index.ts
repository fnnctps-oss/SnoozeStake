import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { authRouter } from './routes/auth';
import { alarmRouter } from './routes/alarms';
import { snoozeRouter } from './routes/snooze';
import { walletRouter } from './routes/wallet';
import { statsRouter } from './routes/stats';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*' },
});

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/alarms', alarmRouter);
app.use('/api/snooze', snoozeRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/stats', statsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-group', (groupId: string) => {
    socket.join(`group:${groupId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

export { io };

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`SnoozeStake server running on port ${PORT}`);
});
