import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AppError } from './errorHandler.js';
export const authenticateToken = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const cookieToken = req.cookies?.accessToken;
    const finalToken = token || cookieToken;
    if (!finalToken) {
        throw new AppError('Authentication required', 401);
    }
    try {
        const decoded = jwt.verify(finalToken, config.jwtSecret);
        req.user = decoded;
        next();
    }
    catch {
        throw new AppError('Invalid or expired token', 401);
    }
};
export const authorizeRoles = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            throw new AppError('Authentication required', 401);
        }
        if (!roles.includes(req.user.role)) {
            throw new AppError('Insufficient permissions', 403);
        }
        next();
    };
};
