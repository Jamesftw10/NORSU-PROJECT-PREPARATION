import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import db from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/sets - list user's sets + public sets
router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  const { search, mine } = req.query as { search?: string; mine?: string };
  
  let query: string;
  let params: unknown[];

  if (mine === 'true') {
    query = `
      SELECT fs.*, u.username as author_name,
        (SELECT COUNT(*) FROM flashcards WHERE set_id = fs.id) as card_count
      FROM flashcard_sets fs
      JOIN users u ON fs.user_id = u.id
      WHERE fs.user_id = ?
      ORDER BY fs.updated_at DESC
    `;
    params = [req.user!.id];
  } else {
    query = `
      SELECT fs.*, u.username as author_name,
        (SELECT COUNT(*) FROM flashcards WHERE set_id = fs.id) as card_count
      FROM flashcard_sets fs
      JOIN users u ON fs.user_id = u.id
      WHERE (fs.user_id = ? OR fs.is_public = 1)
      ${search ? "AND (fs.title LIKE ? OR fs.subject LIKE ? OR fs.description LIKE ?)" : ""}
      ORDER BY fs.updated_at DESC
    `;
    params = search
      ? [req.user!.id, `%${search}%`, `%${search}%`, `%${search}%`]
      : [req.user!.id];
  }

  const sets = db.prepare(query).all(...params);
  return res.json(sets);
});

// POST /api/sets - create a new set
router.post(
  '/',
  authenticate,
  [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required'),
    body('cards').isArray({ min: 1 }).withMessage('At least one card is required'),
    body('cards.*.question').trim().notEmpty().withMessage('Card question is required'),
    body('cards.*.answer').trim().notEmpty().withMessage('Card answer is required'),
  ],
  (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, subject, is_public, cards } = req.body as {
      title: string;
      description?: string;
      subject?: string;
      is_public?: boolean;
      cards: Array<{ question: string; answer: string; hint?: string }>;
    };

    const setId = uuidv4();
    const insertSet = db.prepare(`
      INSERT INTO flashcard_sets (id, user_id, title, description, subject, is_public, card_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertCard = db.prepare(`
      INSERT INTO flashcards (id, set_id, question, answer, hint, order_index)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const createSet = db.transaction(() => {
      insertSet.run(setId, req.user!.id, title, description || null, subject || null, is_public ? 1 : 0, cards.length);
      for (let i = 0; i < cards.length; i++) {
        insertCard.run(uuidv4(), setId, cards[i].question, cards[i].answer, cards[i].hint || null, i);
      }
    });

    createSet();

    // Award XP for creating a set
    awardXP(req.user!.id, 15);
    checkAchievements(req.user!.id, 'sets_created');

    const created = db.prepare('SELECT * FROM flashcard_sets WHERE id = ?').get(setId);
    const createdCards = db.prepare('SELECT * FROM flashcards WHERE set_id = ? ORDER BY order_index').all(setId);
    return res.status(201).json({ ...created as object, cards: createdCards });
  }
);

// GET /api/sets/:id
router.get('/:id', authenticate, (req: AuthRequest, res: Response) => {
  const set = db.prepare(`
    SELECT fs.*, u.username as author_name
    FROM flashcard_sets fs
    JOIN users u ON fs.user_id = u.id
    WHERE fs.id = ? AND (fs.user_id = ? OR fs.is_public = 1)
  `).get(req.params.id, req.user!.id) as Record<string, unknown> | undefined;

  if (!set) {
    return res.status(404).json({ error: 'Set not found' });
  }

  const cards = db.prepare('SELECT * FROM flashcards WHERE set_id = ? ORDER BY order_index').all(req.params.id);
  return res.json({ ...set, cards });
});

// PUT /api/sets/:id - update a set
router.put('/:id', authenticate, (req: AuthRequest, res: Response) => {
  const set = db.prepare('SELECT * FROM flashcard_sets WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id);
  if (!set) {
    return res.status(404).json({ error: 'Set not found or unauthorized' });
  }

  const { title, description, subject, is_public, cards } = req.body as {
    title?: string;
    description?: string;
    subject?: string;
    is_public?: boolean;
    cards?: Array<{ id?: string; question: string; answer: string; hint?: string }>;
  };

  const updateSet = db.transaction(() => {
    if (title || description !== undefined || subject !== undefined || is_public !== undefined) {
      db.prepare(`
        UPDATE flashcard_sets 
        SET title = COALESCE(?, title),
            description = COALESCE(?, description),
            subject = COALESCE(?, subject),
            is_public = COALESCE(?, is_public),
            updated_at = datetime('now')
        WHERE id = ?
      `).run(title || null, description !== undefined ? description : null, subject !== undefined ? subject : null, is_public !== undefined ? (is_public ? 1 : 0) : null, req.params.id);
    }

    if (cards && cards.length > 0) {
      db.prepare('DELETE FROM flashcards WHERE set_id = ?').run(req.params.id);
      for (let i = 0; i < cards.length; i++) {
        db.prepare(`
          INSERT INTO flashcards (id, set_id, question, answer, hint, order_index)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(cards[i].id || uuidv4(), req.params.id, cards[i].question, cards[i].answer, cards[i].hint || null, i);
      }
      db.prepare('UPDATE flashcard_sets SET card_count = ? WHERE id = ?').run(cards.length, req.params.id);
    }
  });

  updateSet();

  const updated = db.prepare('SELECT * FROM flashcard_sets WHERE id = ?').get(req.params.id);
  const updatedCards = db.prepare('SELECT * FROM flashcards WHERE set_id = ? ORDER BY order_index').all(req.params.id);
  return res.json({ ...updated as object, cards: updatedCards });
});

// DELETE /api/sets/:id
router.delete('/:id', authenticate, (req: AuthRequest, res: Response) => {
  const set = db.prepare('SELECT * FROM flashcard_sets WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id);
  if (!set) {
    return res.status(404).json({ error: 'Set not found or unauthorized' });
  }
  db.prepare('DELETE FROM flashcard_sets WHERE id = ?').run(req.params.id);
  return res.json({ message: 'Set deleted' });
});

// POST /api/sets/:id/study - record a study session
router.post('/:id/study', authenticate, (req: AuthRequest, res: Response) => {
  const set = db.prepare('SELECT * FROM flashcard_sets WHERE id = ? AND (user_id = ? OR is_public = 1)').get(req.params.id, req.user!.id);
  if (!set) {
    return res.status(404).json({ error: 'Set not found' });
  }

  const { cards_studied, cards_correct, duration, card_results } = req.body as {
    cards_studied: number;
    cards_correct: number;
    duration: number;
    card_results?: Array<{ card_id: string; quality: number }>;
  };

  const xpEarned = Math.floor((cards_correct / Math.max(cards_studied, 1)) * 20) + Math.floor(cards_studied * 2);
  
  // Record session
  db.prepare(`
    INSERT INTO study_sessions (id, user_id, set_id, cards_studied, cards_correct, duration, xp_earned)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), req.user!.id, req.params.id, cards_studied, cards_correct, duration, xpEarned);

  // Update study count on set
  db.prepare('UPDATE flashcard_sets SET study_count = study_count + 1 WHERE id = ?').run(req.params.id);

  // Apply spaced repetition if card results provided
  if (card_results && card_results.length > 0) {
    updateSpacedRepetition(req.user!.id, card_results);
  }

  // Update streak and XP
  updateStreak(req.user!.id);
  awardXP(req.user!.id, xpEarned);

  // Check achievements
  checkAchievements(req.user!.id, 'sessions');
  if (duration >= 60) checkAchievements(req.user!.id, 'session_duration');

  const user = db.prepare('SELECT streak, longest_streak, total_xp FROM users WHERE id = ?').get(req.user!.id);
  return res.json({ xp_earned: xpEarned, user });
});

// GET /api/sets/:id/due-cards - get cards due for review (spaced repetition)
router.get('/:id/due-cards', authenticate, (req: AuthRequest, res: Response) => {
  const cards = db.prepare(`
    SELECT f.*, cp.ease_factor, cp.interval, cp.repetitions, cp.next_review, cp.last_reviewed
    FROM flashcards f
    LEFT JOIN card_progress cp ON cp.card_id = f.id AND cp.user_id = ?
    WHERE f.set_id = ?
    AND (cp.next_review IS NULL OR cp.next_review <= datetime('now'))
    ORDER BY COALESCE(cp.next_review, '1970-01-01'), f.order_index
    LIMIT 20
  `).all(req.user!.id, req.params.id);
  return res.json(cards);
});

// Helper: spaced repetition SM-2 algorithm
function updateSpacedRepetition(
  userId: string,
  cardResults: Array<{ card_id: string; quality: number }>
): void {
  for (const result of cardResults) {
    const { card_id, quality } = result; // quality: 0-5
    const existing = db.prepare('SELECT * FROM card_progress WHERE user_id = ? AND card_id = ?').get(userId, card_id) as Record<string, unknown> | undefined;

    let easeFactor = existing ? (existing.ease_factor as number) : 2.5;
    let interval = existing ? (existing.interval as number) : 1;
    let repetitions = existing ? (existing.repetitions as number) : 0;

    if (quality >= 3) {
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 6;
      else interval = Math.round(interval * easeFactor);
      repetitions++;
    } else {
      repetitions = 0;
      interval = 1;
    }

    easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    const nextReview = new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString();

    if (existing) {
      db.prepare(`
        UPDATE card_progress 
        SET ease_factor = ?, interval = ?, repetitions = ?, next_review = ?, last_reviewed = datetime('now'), updated_at = datetime('now')
        WHERE user_id = ? AND card_id = ?
      `).run(easeFactor, interval, repetitions, nextReview, userId, card_id);
    } else {
      db.prepare(`
        INSERT INTO card_progress (id, user_id, card_id, ease_factor, interval, repetitions, next_review, last_reviewed)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(uuidv4(), userId, card_id, easeFactor, interval, repetitions, nextReview);
    }
  }
}

// Helper: update user streak
function updateStreak(userId: string): void {
  const user = db.prepare('SELECT streak, longest_streak, last_study_date FROM users WHERE id = ?').get(userId) as Record<string, unknown> | undefined;
  if (!user) return;

  const today = new Date().toISOString().split('T')[0];
  const lastStudy = user.last_study_date as string | null;

  let newStreak = user.streak as number;

  if (!lastStudy) {
    newStreak = 1;
  } else {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (lastStudy === today) {
      // Already studied today, no change
      return;
    } else if (lastStudy === yesterday) {
      newStreak = (user.streak as number) + 1;
    } else {
      newStreak = 1;
    }
  }

  const longestStreak = Math.max(newStreak, user.longest_streak as number);
  db.prepare(`
    UPDATE users SET streak = ?, longest_streak = ?, last_study_date = ?, updated_at = datetime('now') WHERE id = ?
  `).run(newStreak, longestStreak, today, userId);

  checkAchievements(userId, 'streak');
}

// Helper: award XP
function awardXP(userId: string, xp: number): void {
  db.prepare('UPDATE users SET total_xp = total_xp + ?, updated_at = datetime(\'now\') WHERE id = ?').run(xp, userId);
  checkAchievements(userId, 'xp');
}

// Helper: check and award achievements
function checkAchievements(userId: string, conditionType: string): void {
  const user = db.prepare('SELECT streak, total_xp FROM users WHERE id = ?').get(userId) as Record<string, unknown> | undefined;
  if (!user) return;

  let conditionValue = 0;
  if (conditionType === 'streak') conditionValue = user.streak as number;
  if (conditionType === 'xp') conditionValue = user.total_xp as number;
  if (conditionType === 'sessions') {
    const r = db.prepare('SELECT COUNT(*) as c FROM study_sessions WHERE user_id = ?').get(userId) as { c: number };
    conditionValue = r.c;
  }
  if (conditionType === 'sets_created') {
    const r = db.prepare('SELECT COUNT(*) as c FROM flashcard_sets WHERE user_id = ?').get(userId) as { c: number };
    conditionValue = r.c;
  }
  if (conditionType === 'quizzes') {
    const r = db.prepare('SELECT COUNT(*) as c FROM quiz_attempts WHERE user_id = ?').get(userId) as { c: number };
    conditionValue = r.c;
  }
  if (conditionType === 'session_duration') {
    const r = db.prepare('SELECT MAX(duration) as m FROM study_sessions WHERE user_id = ?').get(userId) as { m: number };
    conditionValue = Math.floor((r.m || 0) / 60);
  }

  const eligible = db.prepare(`
    SELECT a.* FROM achievements a
    WHERE a.condition_type = ? AND a.condition_value <= ?
    AND NOT EXISTS (
      SELECT 1 FROM user_achievements ua WHERE ua.user_id = ? AND ua.achievement_id = a.id
    )
  `).all(conditionType, conditionValue, userId) as Array<Record<string, unknown>>;

  for (const ach of eligible) {
    db.prepare('INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)').run(userId, ach.id);
    db.prepare('UPDATE users SET total_xp = total_xp + ? WHERE id = ?').run(ach.xp_reward, userId);
  }
}

export { updateSpacedRepetition, updateStreak, awardXP, checkAchievements };
export default router;
