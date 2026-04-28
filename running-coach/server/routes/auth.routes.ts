import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../../server/src/config/database.js';
import { authenticateRunner } from '../middleware/runnerAuth.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signToken(runner: { id: string; email: string }): string {
  return jwt.sign({ id: runner.id, email: runner.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

// POST /register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.runnerProfile.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const runner = await prisma.runnerProfile.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
      },
    });

    const token = signToken(runner);

    res.status(201).json({
      token,
      runner: {
        id: runner.id,
        email: runner.email,
        name: runner.name,
        level: runner.level,
        xpPoints: runner.xpPoints,
        onboardingCompleted: runner.onboardingCompleted,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const runner = await prisma.runnerProfile.findUnique({
      where: { email: data.email },
    });
    if (!runner) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const valid = await bcrypt.compare(data.password, runner.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = signToken(runner);

    res.json({
      token,
      runner: {
        id: runner.id,
        email: runner.email,
        name: runner.name,
        level: runner.level,
        xpPoints: runner.xpPoints,
        onboardingCompleted: runner.onboardingCompleted,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /me
router.get('/me', authenticateRunner, async (req: Request, res: Response) => {
  try {
    const runner = await prisma.runnerProfile.findUnique({
      where: { id: req.runner!.id },
      include: {
        goals: { where: { status: 'ACTIVE' } },
        badges: { include: { badge: true } },
      },
    });

    if (!runner) {
      res.status(404).json({ error: 'Runner not found' });
      return;
    }

    const { passwordHash: _, ...profile } = runner;
    res.json(profile);
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
