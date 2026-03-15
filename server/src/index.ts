import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cron from 'node-cron';
import { authRouter } from './routes/auth';
import { alarmRouter } from './routes/alarms';
import { snoozeRouter } from './routes/snooze';
import { walletRouter } from './routes/wallet';
import { statsRouter } from './routes/stats';
import { friendRouter } from './routes/friends';
import { charityRouter } from './routes/charities';
import { battleRouter } from './routes/battles';
import { groupRouter } from './routes/groups';
import { feedRouter } from './routes/feed';
import { errorHandler } from './middleware/errorHandler';
import { setupSnoozeAlerts } from './websocket/snoozeAlerts';
import { resolveBattles } from './jobs/battleResolution';
import { checkStreaks } from './jobs/streakCheck';

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
app.use('/api/friends', friendRouter);
app.use('/api/charities', charityRouter);
app.use('/api/battles', battleRouter);
app.use('/api/groups', groupRouter);
app.use('/api/feed', feedRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Socket.io + real-time snooze alerts
const broadcastSnooze = setupSnoozeAlerts(io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-group', (groupId: string) => {
    socket.join(`group:${groupId}`);
  });

  socket.on('join-battle', (battleId: string) => {
    socket.join(`battle:${battleId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

export { io, broadcastSnooze };

// Cron jobs
cron.schedule('0 0 * * 1', () => {
  console.log('Running battle resolution...');
  resolveBattles().catch(console.error);
});

cron.schedule('59 23 * * *', () => {
  console.log('Running streak check...');
  checkStreaks().catch(console.error);
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`SnoozeStake server running on port ${PORT}`);
});
