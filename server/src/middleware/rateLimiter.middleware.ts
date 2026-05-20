import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../lib/redis';

const isProd = process.env.NODE_ENV === 'production';
const isDisabled = process.env.DISABLE_RATE_LIMITERS === 'true';
const isTest = !isProd || isDisabled;
const bookingMax = Number(process.env.BOOKING_RATE_LIMIT_MAX ?? (isProd ? 30 : 500));
const authMax = Number(process.env.AUTH_RATE_LIMIT_MAX ?? (isProd ? 10 : 1000));

const passThrough = (_req: any, _res: any, next: any) => next();

export const bookingRateLimiter = isTest
  ? passThrough
  : rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: Number.isFinite(bookingMax) ? bookingMax : 30,
      standardHeaders: true,
      legacyHeaders: false,
      store: new RedisStore({
        // @ts-ignore
        sendCommand: (...args: string[]) => redis.call(...args),
      }),
      message: { message: 'Too many booking attempts.' },
    });

export const authRateLimiter = isTest
  ? passThrough
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: Number.isFinite(authMax) ? authMax : 10,
      store: new RedisStore({
        // @ts-ignore
        sendCommand: (...args: string[]) => redis.call(...args),
      }),
      message: { message: 'Too many login attempts.' },
    });
