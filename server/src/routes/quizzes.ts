import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { awardXP, checkAchievements } from './sets';

const router = Router();

// GET /api/quizzes - list quizzes for user's sets
router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  const quizzes = db.prepare(`
    SELECT q.*, fs.title as set_title, u.username as author_name,
      (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.user_id = ?) as attempt_count,
      (SELECT MAX(qa.score * 100.0 / qa.total_questions) FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.user_id = ?) as best_score
    FROM quizzes q
    JOIN flashcard_sets fs ON q.set_id = fs.id
    JOIN users u ON q.user_id = u.id
    WHERE q.user_id = ? OR fs.is_public = 1
    ORDER BY q.created_at DESC
  `).all(req.user!.id, req.user!.id, req.user!.id);
  return res.json(quizzes);
});

// POST /api/quizzes/generate - generate quiz from a flashcard set
router.post('/generate', authenticate, async (req: AuthRequest, res: Response) => {
  const { set_id, quiz_type, question_count, time_limit, use_ai } = req.body as {
    set_id: string;
    quiz_type: 'multiple_choice' | 'fill_blank' | 'qa' | 'mixed';
    question_count: number;
    time_limit?: number;
    use_ai?: boolean;
  };

  // Verify set access
  const set = db.prepare('SELECT * FROM flashcard_sets WHERE id = ? AND (user_id = ? OR is_public = 1)').get(set_id, req.user!.id) as Record<string, unknown> | undefined;
  if (!set) {
    return res.status(404).json({ error: 'Flashcard set not found' });
  }

  const cards = db.prepare('SELECT * FROM flashcards WHERE set_id = ? ORDER BY RANDOM() LIMIT ?').all(set_id, Math.min(question_count || 10, 50)) as Array<Record<string, unknown>>;
  if (cards.length === 0) {
    return res.status(400).json({ error: 'Set has no flashcards' });
  }

  let questions: Array<{
    id: string;
    question_type: string;
    question: string;
    correct_answer: string;
    choices?: string;
    card_id: string;
  }>;

  if (use_ai && process.env.OPENAI_API_KEY) {
    try {
      questions = await generateAIQuestions(cards, quiz_type, question_count);
    } catch {
      questions = generateLocalQuestions(cards, quiz_type);
    }
  } else {
    questions = generateLocalQuestions(cards, quiz_type);
  }

  // Save quiz
  const quizId = uuidv4();
  const insertQuiz = db.prepare(`
    INSERT INTO quizzes (id, set_id, user_id, title, quiz_type, time_limit, question_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertQuestion = db.prepare(`
    INSERT INTO quiz_questions (id, quiz_id, card_id, question_type, question, correct_answer, choices, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const saveQuiz = db.transaction(() => {
    insertQuiz.run(quizId, set_id, req.user!.id, `${set.title} Quiz`, quiz_type, time_limit || null, questions.length);
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      insertQuestion.run(uuidv4(), quizId, q.card_id, q.question_type, q.question, q.correct_answer, q.choices || null, i);
    }
  });

  saveQuiz();

  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(quizId);
  const savedQuestions = db.prepare('SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY order_index').all(quizId);
  return res.status(201).json({ ...quiz as object, questions: savedQuestions });
});

// GET /api/quizzes/:id - get quiz with questions
router.get('/:id', authenticate, (req: AuthRequest, res: Response) => {
  const quiz = db.prepare(`
    SELECT q.*, fs.title as set_title, fs.is_public
    FROM quizzes q
    JOIN flashcard_sets fs ON q.set_id = fs.id
    WHERE q.id = ? AND (q.user_id = ? OR fs.is_public = 1)
  `).get(req.params.id, req.user!.id) as Record<string, unknown> | undefined;

  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  const questions = db.prepare('SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY order_index').all(req.params.id);
  return res.json({ ...quiz, questions });
});

// POST /api/quizzes/:id/submit - submit quiz answers
router.post('/:id/submit', authenticate, (req: AuthRequest, res: Response) => {
  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  const { answers, time_taken } = req.body as {
    answers: Array<{ question_id: string; answer: string }>;
    time_taken?: number;
  };

  const questions = db.prepare('SELECT * FROM quiz_questions WHERE quiz_id = ?').all(req.params.id) as Array<Record<string, unknown>>;

  let score = 0;
  const results = answers.map(a => {
    const q = questions.find(q => q.id === a.question_id);
    if (!q) return { ...a, correct: false, correct_answer: '' };
    const isCorrect = a.answer.trim().toLowerCase() === (q.correct_answer as string).trim().toLowerCase();
    if (isCorrect) score++;
    return { ...a, correct: isCorrect, correct_answer: q.correct_answer };
  });

  const attemptId = uuidv4();
  db.prepare(`
    INSERT INTO quiz_attempts (id, quiz_id, user_id, score, total_questions, time_taken, answers)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(attemptId, req.params.id, req.user!.id, score, questions.length, time_taken || null, JSON.stringify(results));

  // XP for quiz completion
  const xp = 10 + Math.floor((score / questions.length) * 20);
  awardXP(req.user!.id, xp);
  checkAchievements(req.user!.id, 'quizzes');

  // Check perfect score
  if (score === questions.length) {
    checkAchievements(req.user!.id, 'perfect_quiz');
  }

  return res.json({
    attempt_id: attemptId,
    score,
    total: questions.length,
    percentage: Math.round((score / questions.length) * 100),
    xp_earned: xp,
    results,
  });
});

// GET /api/quizzes/:id/history - quiz attempt history
router.get('/:id/history', authenticate, (req: AuthRequest, res: Response) => {
  const attempts = db.prepare(`
    SELECT * FROM quiz_attempts
    WHERE quiz_id = ? AND user_id = ?
    ORDER BY completed_at DESC
    LIMIT 10
  `).all(req.params.id, req.user!.id);
  return res.json(attempts);
});

// Local quiz generation (no AI)
function generateLocalQuestions(
  cards: Array<Record<string, unknown>>,
  quizType: string
): Array<{ id: string; question_type: string; question: string; correct_answer: string; choices?: string; card_id: string }> {
  const allAnswers = cards.map(c => c.answer as string);
  
  return cards.map((card) => {
    let questionType: string;
    if (quizType === 'mixed') {
      const types = ['multiple_choice', 'fill_blank', 'qa'];
      questionType = types[Math.floor(Math.random() * types.length)];
    } else {
      questionType = quizType;
    }

    let choices: string | undefined;
    let question = card.question as string;
    const correctAnswer = card.answer as string;

    if (questionType === 'multiple_choice') {
      // Get 3 wrong answers
      const wrongAnswers = allAnswers
        .filter(a => a !== correctAnswer)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const allChoices = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
      choices = JSON.stringify(allChoices);
    } else if (questionType === 'fill_blank') {
      // Replace part of the answer with a blank
      question = `Fill in the blank: ${card.question} → ___________`;
    }

    return {
      id: uuidv4(),
      question_type: questionType,
      question,
      correct_answer: correctAnswer,
      choices,
      card_id: card.id as string,
    };
  });
}

// AI quiz generation using OpenAI
async function generateAIQuestions(
  cards: Array<Record<string, unknown>>,
  quizType: string,
  count: number
): Promise<Array<{ id: string; question_type: string; question: string; correct_answer: string; choices?: string; card_id: string }>> {
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const cardData = cards.slice(0, count).map(c => ({ q: c.question, a: c.answer }));
  
  const prompt = `Generate ${count} quiz questions from these flashcards. Type: ${quizType}.
Cards: ${JSON.stringify(cardData)}

Return JSON array: [{"question_type":"multiple_choice|fill_blank|qa","question":"...","correct_answer":"...","choices":["...","...","...","..."],"card_index":0}]`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 2000,
  });

  const content = response.choices[0].message.content || '{"questions":[]}';
  const parsed = JSON.parse(content) as { questions: Array<Record<string, unknown>> };
  const aiQuestions = parsed.questions || [];

  return aiQuestions.slice(0, count).map((q, i) => ({
    id: uuidv4(),
    question_type: q.question_type as string || 'qa',
    question: q.question as string,
    correct_answer: q.correct_answer as string,
    choices: q.choices ? JSON.stringify(q.choices) : undefined,
    card_id: cards[q.card_index as number || i % cards.length].id as string,
  }));
}

export default router;
