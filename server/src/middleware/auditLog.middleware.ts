import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'oldPassword',
  'newPassword',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
]);

const redact = (value: any): any => {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [
        key,
        SENSITIVE_KEYS.has(key) ? '[REDACTED]' : redact(val),
      ]),
    );
  }
  return value;
};

export const auditLogMiddleware = (action: string, entityType?: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Listen for the 'finish' event which is emitted when the response has been sent
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const actorId = req.user?.id;
        const actorType = req.user?.role === 'student' ? 'student' : 'admin';
        
        prisma.auditLog.create({
          data: {
            actorId,
            actorType,
            action,
            entityType,
            metadata: {
              ip: req.ip,
              method: req.method,
              url: req.originalUrl,
              body: redact(req.body),
              statusCode: res.statusCode
            }
          }
        }).catch((err: { message: any; }) => logger.error(`Audit log failed: ${err.message}`));
      }
    });

    next();
  };
};
