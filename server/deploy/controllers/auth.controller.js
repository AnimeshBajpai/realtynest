import { authService } from '../services/auth.service.js';
import { registerSchema, loginSchema } from '../validators/auth.validators.js';
import { AppError } from '../middleware/errorHandler.js';
import { config } from '../config/index.js';
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
export const authController = {
    async register(req, res) {
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
    async login(req, res) {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new AppError(parsed.error.issues[0].message, 400);
        }
        const result = await authService.login(parsed.data.email, parsed.data.password);
        res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
        res.json({
            user: result.user,
            token: result.token,
        });
    },
    async refreshToken(req, res) {
        const token = req.cookies?.refreshToken;
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
    async getMe(req, res) {
        if (!req.user) {
            throw new AppError('Authentication required', 401);
        }
        const user = await authService.getUserById(req.user.id);
        res.json({ user });
    },
    async logout(_req, res) {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: config.nodeEnv === 'production',
            sameSite: 'strict',
            path: '/api/auth',
        });
        res.json({ message: 'Logged out successfully' });
    },
};
