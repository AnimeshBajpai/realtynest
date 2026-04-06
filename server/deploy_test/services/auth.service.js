import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { config } from '../config/index.js';
import { AppError } from '../middleware/errorHandler.js';
const userSelectWithoutPassword = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    phone: true,
    avatarUrl: true,
    role: true,
    agencyId: true,
    isActive: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
};
export const authService = {
    async registerAgency(data) {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            throw new AppError('Email already registered', 409);
        }
        const passwordHash = await bcrypt.hash(data.password, 10);
        const result = await prisma.$transaction(async (tx) => {
            const agency = await tx.agency.create({
                data: { name: data.agencyName },
            });
            const user = await tx.user.create({
                data: {
                    email: data.email,
                    passwordHash,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    role: 'AGENCY_ADMIN',
                    agencyId: agency.id,
                },
                select: userSelectWithoutPassword,
            });
            return { user, agency };
        });
        const token = this.generateToken(result.user);
        const refreshToken = this.generateRefreshToken(result.user);
        return {
            user: result.user,
            agency: result.agency,
            token,
            refreshToken,
        };
    },
    async login(email, password) {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new AppError('Invalid email or password', 401);
        }
        if (!user.isActive) {
            throw new AppError('Account is deactivated', 403);
        }
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            throw new AppError('Invalid email or password', 401);
        }
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const { passwordHash: _, ...userWithoutPassword } = user;
        const token = this.generateToken(userWithoutPassword);
        const refreshToken = this.generateRefreshToken(userWithoutPassword);
        return {
            user: userWithoutPassword,
            token,
            refreshToken,
        };
    },
    generateToken(user) {
        return jwt.sign({ id: user.id, email: user.email, role: user.role, agencyId: user.agencyId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    },
    generateRefreshToken(user) {
        return jwt.sign({ id: user.id }, config.jwtSecret, { expiresIn: config.jwtRefreshExpiresIn });
    },
    async refreshToken(token) {
        try {
            const decoded = jwt.verify(token, config.jwtSecret);
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: userSelectWithoutPassword,
            });
            if (!user) {
                throw new AppError('User not found', 401);
            }
            if (!user.isActive) {
                throw new AppError('Account is deactivated', 403);
            }
            const newToken = this.generateToken(user);
            const newRefreshToken = this.generateRefreshToken(user);
            return { user, token: newToken, refreshToken: newRefreshToken };
        }
        catch (err) {
            if (err instanceof AppError)
                throw err;
            throw new AppError('Invalid or expired refresh token', 401);
        }
    },
    async getUserById(id) {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                ...userSelectWithoutPassword,
                agency: true,
            },
        });
        if (!user) {
            throw new AppError('User not found', 404);
        }
        return user;
    },
};
