import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

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
              body: { ...req.body, password: '[REDACTED]', passwordHash: '[REDACTED]' },
              statusCode: res.statusCode
            }
          }
        }).catch((err: { message: any; }) => logger.error(`Audit log failed: ${err.message}`));
      }
    });

    next();
  };
};
