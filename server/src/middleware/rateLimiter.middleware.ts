import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../lib/redis';

export const bookingRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 500, // Disabled for dev (was 5)
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-ignore
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  message: { message: 'Too many booking attempts.' }
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, // Disabled for dev (was 10)
  store: new RedisStore({
    // @ts-ignore
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  message: { message: 'Too many login attempts.' }
});
