import { Request, Response } from 'express';
import logger from '../lib/logger';

export const handleError = (err: any, req: Request, res: Response) => {
  logger.error({ stack: err.stack }, `${req.method} ${req.originalUrl} - ${err.message}`);

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    return res.status(409).json({ message: 'A record with this data already exists.' });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Record not found.' });
  }

  // Other Prisma errors
  if (err.code && err.code.startsWith('P')) {
    return res.status(400).json({ message: 'Database validation or constraint error.' });
  }

  // Generic fallback
  res.status(500).json({ message: 'An internal server error occurred.' });
};
