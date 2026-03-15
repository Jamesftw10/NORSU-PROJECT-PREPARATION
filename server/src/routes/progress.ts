import { Router, Response } from 'express';
import db from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/progress/summary
router.get('/summary', authenticate, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const user = db.prepare('SELECT streak, longest_streak, total_xp, last_study_date FROM users WHERE id = ?').get(userId) as Record<string, unknown> | undefined;
  if (!user) return res.status(404).json({ error: 'User not found' });

  const totalSessions = (db.prepare('SELECT COUNT(*) as c FROM study_sessions WHERE user_id = ?').get(userId) as { c: number }).c;
  const totalCardsStudied = (db.prepare('SELECT SUM(cards_studied) as s FROM study_sessions WHERE user_id = ?').get(userId) as { s: number | null }).s || 0;
  const totalTimeMinutes = (db.prepare('SELECT SUM(duration) as s FROM study_sessions WHERE user_id = ?').get(userId) as { s: number | null }).s || 0;
  const quizzesCompleted = (db.prepare('SELECT COUNT(*) as c FROM quiz_attempts WHERE user_id = ?').get(userId) as { c: number }).c;
  const avgQuizScore = (db.prepare('SELECT AVG(score * 100.0 / total_questions) as a FROM quiz_attempts WHERE user_id = ?').get(userId) as { a: number | null }).a || 0;
  
  const achievements = db.prepare(`
    SELECT a.*, ua.earned_at 
    FROM user_achievements ua 
    JOIN achievements a ON a.id = ua.achievement_id 
    WHERE ua.user_id = ?
    ORDER BY ua.earned_at DESC
  `).all(userId);

  const weeklyActivity = db.prepare(`
    SELECT DATE(studied_at) as date, 
      SUM(cards_studied) as cards_studied,
      SUM(duration) as duration,
      SUM(xp_earned) as xp
    FROM study_sessions
    WHERE user_id = ? AND studied_at >= datetime('now', '-7 days')
    GROUP BY DATE(studied_at)
    ORDER BY date
  `).all(userId);

  const monthlyActivity = db.prepare(`
    SELECT DATE(studied_at) as date, 
      SUM(cards_studied) as cards_studied,
      SUM(xp_earned) as xp
    FROM study_sessions
    WHERE user_id = ? AND studied_at >= datetime('now', '-30 days')
    GROUP BY DATE(studied_at)
    ORDER BY date
  `).all(userId);

  const rank = (db.prepare(`
    SELECT COUNT(*) + 1 as rank 
    FROM users 
    WHERE role = 'student' AND total_xp > ? AND id != ?
  `).get(user.total_xp, userId) as { rank: number }).rank;

  return res.json({
    streak: user.streak,
    longest_streak: user.longest_streak,
    total_xp: user.total_xp,
    rank,
    totalSessions,
    totalCardsStudied,
    totalTimeMinutes: Math.floor(totalTimeMinutes / 60),
    quizzesCompleted,
    avgQuizScore: Math.round(avgQuizScore),
    achievements,
    weeklyActivity,
    monthlyActivity,
  });
});

// GET /api/progress/leaderboard
router.get('/leaderboard', authenticate, (req: AuthRequest, res: Response) => {
  const leaderboard = db.prepare(`
    SELECT 
      ROW_NUMBER() OVER (ORDER BY total_xp DESC) as rank,
      id, username, total_xp, streak, longest_streak,
      (SELECT COUNT(*) FROM study_sessions WHERE user_id = users.id) as sessions_count
    FROM users
    WHERE role = 'student'
    ORDER BY total_xp DESC
    LIMIT 50
  `).all();
  
  return res.json(leaderboard);
});

// GET /api/progress/due-today - total cards due across all sets
router.get('/due-today', authenticate, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  
  const dueCounts = db.prepare(`
    SELECT fs.id, fs.title, COUNT(*) as due_count
    FROM flashcard_sets fs
    JOIN flashcards f ON f.set_id = fs.id
    LEFT JOIN card_progress cp ON cp.card_id = f.id AND cp.user_id = ?
    WHERE (fs.user_id = ? OR fs.is_public = 1)
    AND (cp.next_review IS NULL OR cp.next_review <= datetime('now'))
    GROUP BY fs.id
    HAVING due_count > 0
    ORDER BY due_count DESC
  `).all(userId, userId);

  return res.json(dueCounts);
});

export default router;
