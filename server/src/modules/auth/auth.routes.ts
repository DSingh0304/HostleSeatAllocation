import { Router } from 'express';
import {
  studentLogin, adminLogin, teacherLogin,
  refresh, logout,
  completeOnboarding, changePassword, adminResetPassword
} from './auth.controller';
import { authRateLimiter } from '../../middleware/rateLimiter.middleware';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Public
router.post('/login',          authRateLimiter, studentLogin);
router.post('/admin/login',    authRateLimiter, adminLogin);
router.post('/teacher/login',  authRateLimiter, teacherLogin);
router.post('/refresh',        refresh);
router.post('/logout',         logout);

// Authenticated
router.post('/onboarding',        authenticate, completeOnboarding);  // first-login setup
router.post('/change-password',   authenticate, changePassword);       // self-service password change
router.post('/admin/reset-password', authenticate, adminResetPassword); // admin force-reset

export default router;
