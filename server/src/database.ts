import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'norsu.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase(): void {
  db.exec(`
    -- Users table (students + admins)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      lrn TEXT UNIQUE,
      email TEXT UNIQUE,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student', 'admin')),
      avatar_url TEXT,
      streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      last_study_date TEXT,
      total_xp INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Flashcard sets (decks)
    CREATE TABLE IF NOT EXISTS flashcard_sets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      subject TEXT,
      is_public INTEGER NOT NULL DEFAULT 0,
      card_count INTEGER NOT NULL DEFAULT 0,
      study_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Flashcards
    CREATE TABLE IF NOT EXISTS flashcards (
      id TEXT PRIMARY KEY,
      set_id TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      hint TEXT,
      image_url TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (set_id) REFERENCES flashcard_sets(id) ON DELETE CASCADE
    );

    -- Spaced repetition progress per card per user
    CREATE TABLE IF NOT EXISTS card_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      card_id TEXT NOT NULL,
      ease_factor REAL NOT NULL DEFAULT 2.5,
      interval INTEGER NOT NULL DEFAULT 1,
      repetitions INTEGER NOT NULL DEFAULT 0,
      next_review TEXT NOT NULL DEFAULT (datetime('now')),
      last_reviewed TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, card_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (card_id) REFERENCES flashcards(id) ON DELETE CASCADE
    );

    -- Quizzes
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      set_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      quiz_type TEXT NOT NULL DEFAULT 'mixed' CHECK(quiz_type IN ('multiple_choice', 'fill_blank', 'qa', 'mixed')),
      time_limit INTEGER,
      question_count INTEGER NOT NULL DEFAULT 10,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (set_id) REFERENCES flashcard_sets(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Quiz questions
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL,
      card_id TEXT,
      question_type TEXT NOT NULL CHECK(question_type IN ('multiple_choice', 'fill_blank', 'qa')),
      question TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      choices TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
      FOREIGN KEY (card_id) REFERENCES flashcards(id) ON DELETE SET NULL
    );

    -- Quiz attempts / results
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      total_questions INTEGER NOT NULL,
      time_taken INTEGER,
      answers TEXT NOT NULL DEFAULT '[]',
      completed_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Study sessions
    CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      set_id TEXT NOT NULL,
      cards_studied INTEGER NOT NULL DEFAULT 0,
      cards_correct INTEGER NOT NULL DEFAULT 0,
      duration INTEGER NOT NULL DEFAULT 0,
      xp_earned INTEGER NOT NULL DEFAULT 0,
      studied_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (set_id) REFERENCES flashcard_sets(id) ON DELETE CASCADE
    );

    -- Achievements
    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      xp_reward INTEGER NOT NULL DEFAULT 0,
      condition_type TEXT NOT NULL,
      condition_value INTEGER NOT NULL
    );

    -- User achievements
    CREATE TABLE IF NOT EXISTS user_achievements (
      user_id TEXT NOT NULL,
      achievement_id TEXT NOT NULL,
      earned_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, achievement_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_flashcard_sets_user ON flashcard_sets(user_id);
    CREATE INDEX IF NOT EXISTS idx_flashcards_set ON flashcards(set_id);
    CREATE INDEX IF NOT EXISTS idx_card_progress_user ON card_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_card_progress_next_review ON card_progress(next_review);
    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
    CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id);
  `);

  seedAchievements();
  seedAdmin();
}

function seedAchievements(): void {
  const count = (db.prepare('SELECT COUNT(*) as c FROM achievements').get() as { c: number }).c;
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO achievements (id, name, description, icon, xp_reward, condition_type, condition_value)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const achievements = [
    ['ach-1', 'First Steps', 'Complete your first study session', '🎯', 10, 'sessions', 1],
    ['ach-2', 'Flashcard Creator', 'Create your first flashcard set', '📚', 15, 'sets_created', 1],
    ['ach-3', 'Quiz Taker', 'Complete your first quiz', '📝', 20, 'quizzes', 1],
    ['ach-4', 'Hot Streak', 'Maintain a 3-day study streak', '🔥', 30, 'streak', 3],
    ['ach-5', 'Week Warrior', 'Maintain a 7-day study streak', '⚔️', 75, 'streak', 7],
    ['ach-6', 'Scholar', 'Earn 500 XP', '🎓', 50, 'xp', 500],
    ['ach-7', 'Master Learner', 'Earn 2000 XP', '🏆', 100, 'xp', 2000],
    ['ach-8', 'Card Collector', 'Create 50 flashcards', '🗂️', 40, 'cards_created', 50],
    ['ach-9', 'Perfect Score', 'Get 100% on a quiz', '💯', 50, 'perfect_quiz', 1],
    ['ach-10', 'Study Marathon', 'Study for 60 minutes in one session', '⏱️', 60, 'session_duration', 60],
  ];

  const insertMany = db.transaction(() => {
    for (const a of achievements) {
      insert.run(...(a as Parameters<typeof insert.run>));
    }
  });
  insertMany();
}

function seedAdmin(): void {
  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');

  const existing = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (existing) return;

  const passwordHash = bcrypt.hashSync('admin123', 12);
  db.prepare(`
    INSERT INTO users (id, email, username, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(uuidv4(), 'admin@norsu.edu.ph', 'Admin', passwordHash, 'admin');
}

export default db;
