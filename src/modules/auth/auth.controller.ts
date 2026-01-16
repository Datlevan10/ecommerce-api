import type { Request, Response } from 'express';
import authService from './auth.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

class AuthController {
  async register(req: Request, res: Response) {
    try {
      const result = await authService.register(req.body);
      sendSuccess(res, result, 'Registration successful', 201);
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 400);
      } else {
        sendError(res, 'Registration failed', 500);
      }
    }
  }

  async login(req: Request, res: Response) {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 401);
      } else {
        sendError(res, 'Login failed', 500);
      }
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.body;
      const result = await authService.verifyEmail(token);
      sendSuccess(res, result, 'Email verified successfully');
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 400);
      } else {
        sendError(res, 'Verification failed', 500);
      }
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, 'Request failed', 500);
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, password } = req.body;
      const result = await authService.resetPassword(token, password);
      sendSuccess(res, result);
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 400);
      } else {
        sendError(res, 'Password reset failed', 500);
      }
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken(refreshToken);
      sendSuccess(res, tokens, 'Token refreshed successfully');
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 401);
      } else {
        sendError(res, 'Token refresh failed', 500);
      }
    }
  }

  async logout(req: Request, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Not authenticated', 401);
      }
      const result = await authService.logout(req.user.id);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, 'Logout failed', 500);
    }
  }
}

export default new AuthController();