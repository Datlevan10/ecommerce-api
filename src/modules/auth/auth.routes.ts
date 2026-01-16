import { Router } from 'express';
import authController from './auth.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { body } from 'express-validator';
import { validateRequest } from '../../middlewares/validation.middleware.js';

const router = Router();

// Register
router.post(
  '/register',
  [
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().isMobilePhone('any'),
    validateRequest
  ],
  authController.register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest
  ],
  authController.login
);

// Verify email
router.post(
  '/verify-email',
  [
    body('token').notEmpty().withMessage('Verification token is required'),
    validateRequest
  ],
  authController.verifyEmail
);

// Forgot password
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    validateRequest
  ],
  authController.forgotPassword
);

// Reset password
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validateRequest
  ],
  authController.resetPassword
);

// Refresh token
router.post(
  '/refresh-token',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    validateRequest
  ],
  authController.refreshToken
);

// Logout (requires auth)
router.post('/logout', authMiddleware, authController.logout);

export default router;