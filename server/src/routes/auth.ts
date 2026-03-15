import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import db from '../database';
import { generateToken, authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Validate LRN format: 12 digits
function isValidLRN(lrn: string): boolean {
  return /^\d{12}$/.test(lrn);
}

// POST /api/auth/register
router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 2, max: 50 }).withMessage('Username must be 2-50 characters'),
    body('lrn').trim().notEmpty().withMessage('LRN is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, lrn, password, email } = req.body as {
      username: string;
      lrn: string;
      password: string;
      email?: string;
    };

    if (!isValidLRN(lrn)) {
      return res.status(400).json({ error: 'LRN must be exactly 12 digits' });
    }

    // Check if LRN already exists
    const existingLRN = db.prepare('SELECT id FROM users WHERE lrn = ?').get(lrn);
    if (existingLRN) {
      return res.status(409).json({ error: 'LRN is already registered' });
    }

    // Check if email already exists (optional)
    if (email) {
      const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existingEmail) {
        return res.status(409).json({ error: 'Email is already registered' });
      }
    }

    const passwordHash = bcrypt.hashSync(password, 12);
    const id = uuidv4();

    db.prepare(`
      INSERT INTO users (id, lrn, email, username, password_hash, role)
      VALUES (?, ?, ?, ?, ?, 'student')
    `).run(id, lrn, email || null, username, passwordHash);

    const token = generateToken({ id, role: 'student', username });
    return res.status(201).json({
      token,
      user: { id, username, lrn, role: 'student', streak: 0, total_xp: 0 },
    });
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('password').notEmpty().withMessage('Password is required'),
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lrn, email, password } = req.body as {
      lrn?: string;
      email?: string;
      password: string;
    };

    if (!lrn && !email) {
      return res.status(400).json({ error: 'LRN or email is required' });
    }

    let user: Record<string, unknown> | undefined;
    if (lrn) {
      user = db.prepare('SELECT * FROM users WHERE lrn = ?').get(lrn) as Record<string, unknown> | undefined;
    } else {
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as Record<string, unknown> | undefined;
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash as string);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      id: user.id as string,
      role: user.role as string,
      username: user.username as string,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        lrn: user.lrn,
        email: user.email,
        role: user.role,
        streak: user.streak,
        total_xp: user.total_xp,
        avatar_url: user.avatar_url,
      },
    });
  }
);

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT id, lrn, email, username, role, streak, longest_streak, total_xp, avatar_url, created_at FROM users WHERE id = ?').get(req.user!.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json(user);
});

// PATCH /api/auth/me - update profile
router.patch('/me', authenticate, (req: AuthRequest, res: Response) => {
  const { username, avatar_url } = req.body as { username?: string; avatar_url?: string };
  if (username) {
    db.prepare('UPDATE users SET username = ?, updated_at = datetime(\'now\') WHERE id = ?').run(username, req.user!.id);
  }
  if (avatar_url !== undefined) {
    db.prepare('UPDATE users SET avatar_url = ?, updated_at = datetime(\'now\') WHERE id = ?').run(avatar_url, req.user!.id);
  }
  const updated = db.prepare('SELECT id, lrn, email, username, role, streak, longest_streak, total_xp, avatar_url FROM users WHERE id = ?').get(req.user!.id);
  return res.json(updated);
});

export default router;
