import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Clock, ChevronRight } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

interface QuizQuestion {
  id: number;
  question: string;
  type: 'multiple_choice' | 'fill_blank' | 'qa';
  options?: string[];
  correct_answer?: string;
}

interface Quiz {
  id: number;
  set_id: number;
  set_title: string;
  questions: QuizQuestion[];
  time_limit?: number;
}

interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  time_taken: number;
}

type QuizSetup = {
  quiz_type: 'multiple_choice' | 'fill_blank' | 'mixed';
  question_count: number;
};

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<'setup' | 'quiz' | 'result'>('setup');
  const [setup, setSetup] = useState<QuizSetup>({ quiz_type: 'multiple_choice', question_count: 10 });
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [setTitle, setSetTitle] = useState('');

  useEffect(() => {
    if (!id) return;
    api.get(`/sets/${id}`).then((res) => {
      const s = res.data.set ?? res.data;
      setSetTitle(s.title);
    });
  }, [id]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (phase === 'quiz') {
      interval = setInterval(() => setTimeElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    }
    return () => clearInterval(interval);
  }, [phase, startTime]);

  const handleGenerateQuiz = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.post('/quizzes/generate', {
        set_id: parseInt(id),
        quiz_type: setup.quiz_type,
        question_count: setup.question_count,
      });
      const quizId = res.data.quiz?.id ?? res.data.id;
      const quizRes = await api.get(`/quizzes/${quizId}`);
      setQuiz(quizRes.data.quiz ?? quizRes.data);
      setPhase('quiz');
      setStartTime(Date.now());
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to generate quiz';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (!quiz) return;
    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ((prev) => prev + 1);
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    setLoading(true);
    try {
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const submissionAnswers = quiz.questions.map((q) => ({
        question_id: q.id,
        answer: answers[q.id] ?? '',
      }));
      const res = await api.post(`/quizzes/${quiz.id}/submit`, {
        answers: submissionAnswers,
        time_taken: timeTaken,
      });
      const data = res.data;
      setResult({
        score: data.score ?? data.correct ?? 0,
        total: data.total ?? quiz.questions.length,
        percentage: data.percentage ?? Math.round(((data.score ?? 0) / quiz.questions.length) * 100),
        time_taken: timeTaken,
      });
      setPhase('result');
    } catch {
      toast.error('Failed to submit quiz');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  /* ---- SETUP PHASE ---- */
  if (phase === 'setup') {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Quiz Setup</h1>
            <p className="text-sm text-slate-500">{setTitle}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Quiz Type</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'multiple_choice', label: 'Multiple Choice' },
                { value: 'fill_blank', label: 'Fill Blank' },
                { value: 'mixed', label: 'Mixed' },
              ] as const).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSetup((p) => ({ ...p, quiz_type: value }))}
                  className={`py-3 px-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                    setup.quiz_type === value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Number of Questions: <span className="text-blue-600 font-bold">{setup.question_count}</span>
            </label>
            <input
              type="range"
              min={5}
              max={30}
              step={5}
              value={setup.question_count}
              onChange={(e) => setSetup((p) => ({ ...p, question_count: parseInt(e.target.value) }))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>5</span><span>10</span><span>15</span><span>20</span><span>25</span><span>30</span>
            </div>
          </div>

          <button
            onClick={handleGenerateQuiz}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200 disabled:opacity-60 text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Quiz...
              </span>
            ) : 'Start Quiz'}
          </button>
        </div>
      </div>
    );
  }

  /* ---- RESULT PHASE ---- */
  if (phase === 'result' && result) {
    const emoji = result.percentage >= 90 ? '🏆' : result.percentage >= 70 ? '🎉' : result.percentage >= 50 ? '👍' : '📚';
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">{emoji}</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Quiz Complete!</h2>
          <p className="text-slate-500 mb-8">{setTitle}</p>

          <div className="relative w-32 h-32 mx-auto mb-8">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke={result.percentage >= 70 ? '#16a34a' : result.percentage >= 50 ? '#ca8a04' : '#dc2626'}
                strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - result.percentage / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-800">{result.percentage}%</span>
              <span className="text-xs text-slate-500">score</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8 max-w-xs mx-auto">
            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
              <p className="text-xl font-bold text-green-600">{result.score}</p>
              <p className="text-xs text-slate-500">Correct</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
              <p className="text-xl font-bold text-red-500">{result.total - result.score}</p>
              <p className="text-xs text-slate-500">Wrong</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
              <p className="text-xl font-bold text-blue-600">{formatTime(result.time_taken)}</p>
              <p className="text-xs text-slate-500">Time</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => { setPhase('setup'); setAnswers({}); setCurrentQ(0); setResult(null); }}
              className="px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors"
            >
              Retake Quiz
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---- QUIZ PHASE ---- */
  if (!quiz) return null;
  const question = quiz.questions[currentQ];
  const totalQ = quiz.questions.length;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" /> Exit
        </button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{currentQ + 1} / {totalQ}</span>
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
            <Clock className="w-4 h-4" />
            {formatTime(timeElapsed)}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full h-2 bg-slate-200 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${((currentQ + 1) / totalQ) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            question.type === 'multiple_choice' ? 'bg-blue-100 text-blue-700' :
            question.type === 'fill_blank' ? 'bg-purple-100 text-purple-700' :
            'bg-green-100 text-green-700'
          }`}>
            {question.type === 'multiple_choice' ? 'Multiple Choice' :
             question.type === 'fill_blank' ? 'Fill in the Blank' : 'Q&A'}
          </span>
        </div>
        <p className="text-lg font-semibold text-slate-800 mb-6">{question.question}</p>

        {question.type === 'multiple_choice' && question.options ? (
          <div className="space-y-3">
            {question.options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(question.id, option)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  answers[question.id] === option
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <span className="w-6 h-6 inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-500 font-semibold text-xs mr-3">
                  {String.fromCharCode(65 + i)}
                </span>
                {option}
              </button>
            ))}
          </div>
        ) : (
          <textarea
            value={answers[question.id] ?? ''}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            placeholder="Type your answer here..."
            rows={4}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
          disabled={currentQ === 0}
          className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        <div className="flex gap-1.5">
          {quiz.questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentQ ? 'bg-blue-600 scale-110' :
                answers[quiz.questions[i].id] ? 'bg-green-400' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {currentQ < totalQ - 1 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm disabled:opacity-60"
          >
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
            Submit
          </button>
        )}
      </div>

      {/* Answered count */}
      <div className="mt-4 text-center text-xs text-slate-400">
        {Object.keys(answers).length} of {totalQ} answered
      </div>
    </div>
  );
}
