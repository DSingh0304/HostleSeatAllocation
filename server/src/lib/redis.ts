import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
  lazyConnect: true,
  enableReadyCheck: true,
  connectTimeout: 10000,
});

redis.on('error', (err) => {
  // Only log non-connection errors to reduce noise
  if (!err.message.includes('EAI_AGAIN') && !err.message.includes('ECONNREFUSED')) {
    console.error('Redis error:', err);
  }
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('ready', () => {
  console.log('Redis is ready');
});

// Connect with retry
(async () => {
  let retries = 0;
  const maxRetries = 10;
  
  while (retries < maxRetries) {
    try {
      await redis.connect();
      break;
    } catch (err: any) {
      retries++;
      if (retries >= maxRetries) {
        console.error('Failed to connect to Redis after', maxRetries, 'attempts');
        process.exit(1);
      }
      console.log(`Redis connection attempt ${retries}/${maxRetries} failed, retrying in 2s...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
})();

export default redis;
