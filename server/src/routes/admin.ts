import { Router, Response } from 'express';
import db from '../database';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/admin/users - list all users
router.get('/users', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const { search, page = '1', limit = '20' } = req.query as { search?: string; page?: string; limit?: string };
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let users: unknown[];
  let total: number;

  if (search) {
    users = db.prepare(`
      SELECT id, lrn, email, username, role, streak, longest_streak, total_xp, created_at, last_study_date
      FROM users
      WHERE username LIKE ? OR lrn LIKE ? OR email LIKE ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(`%${search}%`, `%${search}%`, `%${search}%`, parseInt(limit), offset);
    total = (db.prepare(`SELECT COUNT(*) as c FROM users WHERE username LIKE ? OR lrn LIKE ? OR email LIKE ?`).get(`%${search}%`, `%${search}%`, `%${search}%`) as { c: number }).c;
  } else {
    users = db.prepare(`
      SELECT id, lrn, email, username, role, streak, longest_streak, total_xp, created_at, last_study_date
      FROM users
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(limit), offset);
    total = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  }

  return res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
});

// GET /api/admin/users/:id - get user details
router.get('/users/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const user = db.prepare(`
    SELECT id, lrn, email, username, role, streak, longest_streak, total_xp, avatar_url, created_at, last_study_date
    FROM users WHERE id = ?
  `).get(req.params.id) as Record<string, unknown> | undefined;
  
  if (!user) return res.status(404).json({ error: 'User not found' });

  const sets = db.prepare('SELECT id, title, subject, card_count, study_count, created_at FROM flashcard_sets WHERE user_id = ?').all(req.params.id);
  const recentSessions = db.prepare(`
    SELECT ss.*, fs.title as set_title 
    FROM study_sessions ss 
    JOIN flashcard_sets fs ON ss.set_id = fs.id 
    WHERE ss.user_id = ? 
    ORDER BY ss.studied_at DESC LIMIT 10
  `).all(req.params.id);
  const achievements = db.prepare(`
    SELECT a.*, ua.earned_at 
    FROM user_achievements ua 
    JOIN achievements a ON a.id = ua.achievement_id 
    WHERE ua.user_id = ?
  `).all(req.params.id);

  return res.json({ ...user, sets, recentSessions, achievements });
});

// DELETE /api/admin/users/:id - delete a user
router.delete('/users/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  if (req.params.id === req.user!.id) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }
  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  return res.json({ message: 'User deleted' });
});

// GET /api/admin/stats - platform statistics
router.get('/stats', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM users WHERE role = ?').get('student') as { c: number }).c;
  const totalSets = (db.prepare('SELECT COUNT(*) as c FROM flashcard_sets').get() as { c: number }).c;
  const totalCards = (db.prepare('SELECT COUNT(*) as c FROM flashcards').get() as { c: number }).c;
  const totalSessions = (db.prepare('SELECT COUNT(*) as c FROM study_sessions').get() as { c: number }).c;
  const totalQuizzes = (db.prepare('SELECT COUNT(*) as c FROM quiz_attempts').get() as { c: number }).c;
  const activeToday = (db.prepare(`SELECT COUNT(DISTINCT user_id) as c FROM study_sessions WHERE DATE(studied_at) = DATE('now')`).get() as { c: number }).c;
  const activeThisWeek = (db.prepare(`SELECT COUNT(DISTINCT user_id) as c FROM study_sessions WHERE studied_at >= datetime('now', '-7 days')`).get() as { c: number }).c;
  
  const topStudents = db.prepare(`
    SELECT id, username, lrn, total_xp, streak, longest_streak
    FROM users WHERE role = 'student'
    ORDER BY total_xp DESC LIMIT 10
  `).all();

  const recentRegistrations = db.prepare(`
    SELECT id, username, lrn, created_at FROM users WHERE role = 'student'
    ORDER BY created_at DESC LIMIT 10
  `).all();

  const dailyActivity = db.prepare(`
    SELECT DATE(studied_at) as date, COUNT(*) as sessions, COUNT(DISTINCT user_id) as users
    FROM study_sessions
    WHERE studied_at >= datetime('now', '-30 days')
    GROUP BY DATE(studied_at)
    ORDER BY date
  `).all();

  return res.json({
    totalUsers,
    totalSets,
    totalCards,
    totalSessions,
    totalQuizzes,
    activeToday,
    activeThisWeek,
    topStudents,
    recentRegistrations,
    dailyActivity,
  });
});

// PATCH /api/admin/users/:id/role - change user role
router.patch('/users/:id/role', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const { role } = req.body as { role: 'student' | 'admin' };
  if (!['student', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  return res.json({ message: 'Role updated' });
});

// GET /api/admin/leaderboard
router.get('/leaderboard', authenticate, (req: AuthRequest, res: Response) => {
  const leaderboard = db.prepare(`
    SELECT id, username, total_xp, streak, longest_streak,
      (SELECT COUNT(*) FROM flashcard_sets WHERE user_id = users.id) as sets_count,
      (SELECT COUNT(*) FROM study_sessions WHERE user_id = users.id) as sessions_count
    FROM users
    WHERE role = 'student'
    ORDER BY total_xp DESC
    LIMIT 50
  `).all();
  
  return res.json(leaderboard);
});

export default router;
