import { z } from 'zod';

export const loginSchema = z.object({
  rollNumber: z.string().optional(), // for student
  email: z.string().email().optional(), // for admin
  password: z.string().min(6),
});

export const refreshSchema = z.object({
  refreshToken: z.string(),
});
