import type { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { registerSchema, loginSchema } from '../validators/auth.validators.js';
import { AppError } from '../middleware/errorHandler.js';
import { config } from '../config/index.js';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'strict' as const,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const authController = {
  async register(req: Request, res: Response) {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0].message, 400);
    }

    const result = await authService.registerAgency(parsed.data);

    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(201).json({
      user: result.user,
      agency: result.agency,
      token: result.token,
    });
  },

  async login(req: Request, res: Response) {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0].message, 400);
    }

    const { email, phone, password } = parsed.data;
    const result = await authService.login({ email, phone }, password);

    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    res.json({
      user: result.user,
      token: result.token,
    });
  },

  async refreshToken(req: Request, res: Response) {
    const token = req.cookies?.refreshToken as string | undefined;

    if (!token) {
      throw new AppError('Refresh token not found', 401);
    }

    const result = await authService.refreshToken(token);

    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    res.json({
      user: result.user,
      token: result.token,
    });
  },

  async getMe(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const user = await authService.getUserById(req.user.id);

    res.json({ user });
  },

  async logout(_req: Request, res: Response) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict' as const,
      path: '/api/auth',
    });

    res.json({ message: 'Logged out successfully' });
  },
};
