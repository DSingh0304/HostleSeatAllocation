import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import logger from './lib/logger';

import authRoutes from './modules/auth/auth.routes';
import allocationRoutes from './modules/allocation/allocation.routes';
import adminRoutes from './modules/admin/admin.routes';
import studentRoutes from './modules/student/student.routes';
import { createServer } from 'http';
import { initSocket } from './lib/socket';
import { initEmailWorker } from './workers/email.worker';
import prisma from './lib/prisma';
import redis from './lib/redis';
import cron from 'node-cron';

dotenv.config();

const app = express();

// Cron job to auto-activate/deactivate allocation windows every minute
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();

    // Activate windows that should be open
    await prisma.allocationWindow.updateMany({
      where: {
        opensAt: { lte: now },
        closesAt: { gte: now },
        isActive: false
      },
      data: { isActive: true }
    });

    // Deactivate windows that should be closed
    await prisma.allocationWindow.updateMany({
      where: {
        OR: [
          { closesAt: { lt: now } },
          { opensAt: { gt: now } }
        ],
        isActive: true
      },
      data: { isActive: false }
    });
  } catch (err: any) {
    logger.error(`Window cron job failed: ${err.message}`);
  }
});

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/allocations', allocationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/student', studentRoutes);

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'ERROR', timestamp: new Date().toISOString() });
  }
});


// Port
const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);
initSocket(httpServer);
initEmailWorker();

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  httpServer.close(async () => {
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
