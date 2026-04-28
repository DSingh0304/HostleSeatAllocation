import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../../lib/prisma';
import redis from '../../lib/redis';
import { randomUUID } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey123';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'anotherrefreshsecretkey456';

interface TokenPayload {
  id: string;
  role: string;
  name?: string;
  email?: string;
  mustChangePassword?: boolean;
  onboardingDone?: boolean;
}

export const generateTokens = async (payload: TokenPayload) => {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = randomUUID();

  // Store refresh token in Redis with 7 days expiry
  await redis.set(
    `refresh_token:${refreshToken}`,
    JSON.stringify({ userId: payload.id, role: payload.role }),
    'EX',
    7 * 24 * 60 * 60
  );

  return { token, refreshToken };
};

export const verifyRefreshToken = async (refreshToken: string) => {
  const data = await redis.get(`refresh_token:${refreshToken}`);
  if (!data) return null;
  return JSON.parse(data) as { userId: string; role: string };
};

export const revokeRefreshToken = async (refreshToken: string) => {
  await redis.del(`refresh_token:${refreshToken}`);
};

export const hashPassword = (plain: string) => bcrypt.hash(plain, 12);
export const comparePassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);
