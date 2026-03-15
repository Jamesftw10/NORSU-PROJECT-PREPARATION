import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, ChevronLeft, ChevronRight, Star, Check, X } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

interface Card {
  id: number;
  question: string;
  answer: string;
  hint?: string;
}

interface StudySet {
  id: number;
  title: string;
  subject?: string;
  cards: Card[];
}

interface CardResult {
  card_id: number;
  quality: number;
}

export default function StudyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [set, setSet] = useState<StudySet | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardResults, setCardResults] = useState<CardResult[]>([]);
  const [sessionDone, setSessionDone] = useState(false);
  const [startTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/sets/${id}`)
      .then((res) => setSet(res.data.set ?? res.data))
      .catch(() => { toast.error('Failed to load set'); navigate('/sets'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const currentCard = set?.cards[currentIndex];
  const totalCards = set?.cards.length ?? 0;
  const progress = totalCards > 0 ? ((currentIndex) / totalCards) * 100 : 0;

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleQuality = (quality: number) => {
    if (!currentCard) return;
    setCardResults((prev) => {
      const existing = prev.findIndex((r) => r.card_id === currentCard.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { card_id: currentCard.id, quality };
        return updated;
      }
      return [...prev, { card_id: currentCard.id, quality }];
    });

    if (currentIndex < totalCards - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setSessionDone(true);
    }
  };

  const handleSubmitSession = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      const duration = Math.round((Date.now() - startTime) / 1000);
      const cardsCorrect = cardResults.filter((r) => r.quality >= 3).length;
      await api.post(`/sets/${id}/study`, {
        cards_studied: cardResults.length,
        cards_correct: cardsCorrect,
        duration,
        card_results: cardResults,
      });
      toast.success('Study session saved! 🎉');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to save session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCardResults([]);
    setSessionDone(false);
  };

  const qualityLabels = [
    { q: 1, label: 'Again', color: 'bg-red-500 hover:bg-red-600', textColor: 'text-red-700 bg-red-50 border-red-200' },
    { q: 2, label: 'Hard', color: 'bg-orange-500 hover:bg-orange-600', textColor: 'text-orange-700 bg-orange-50 border-orange-200' },
    { q: 3, label: 'Good', color: 'bg-yellow-500 hover:bg-yellow-600', textColor: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
    { q: 4, label: 'Easy', color: 'bg-green-500 hover:bg-green-600', textColor: 'text-green-700 bg-green-50 border-green-200' },
    { q: 5, label: 'Perfect', color: 'bg-blue-600 hover:bg-blue-700', textColor: 'text-blue-700 bg-blue-50 border-blue-200' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!set) return null;

  if (sessionDone) {
    const correct = cardResults.filter((r) => r.quality >= 3).length;
    const pct = Math.round((correct / cardResults.length) * 100);

    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '📚'}</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Session Complete!</h2>
          <p className="text-slate-500 mb-8">
            You rated {correct}/{cardResults.length} cards as Good or better
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8 max-w-sm mx-auto">
            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
              <p className="text-2xl font-bold text-blue-600">{totalCards}</p>
              <p className="text-xs text-slate-500">Cards Studied</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
              <p className="text-2xl font-bold text-green-600">{pct}%</p>
              <p className="text-xs text-slate-500">Accuracy</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
              <p className="text-2xl font-bold text-purple-600">
                {Math.round((Date.now() - startTime) / 60000)}m
              </p>
              <p className="text-xs text-slate-500">Duration</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Study Again
            </button>
            <button
              onClick={handleSubmitSession}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-200 disabled:opacity-60"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : <Check className="w-4 h-4" />}
              Save & Finish
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="text-center">
          <h1 className="font-semibold text-slate-800 text-sm">{set.title}</h1>
          <p className="text-xs text-slate-500">{currentIndex + 1} / {totalCards}</p>
        </div>
        <button
          onClick={handleRestart}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          title="Restart"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-200 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Card */}
      {currentCard && (
        <div
          className="card-flip cursor-pointer mb-8"
          style={{ height: '280px' }}
          onClick={handleFlip}
        >
          <div className={`card-flip-inner ${isFlipped ? 'flipped' : ''}`}>
            {/* Front */}
            <div className="card-front bg-white rounded-2xl border border-slate-200 shadow-lg p-8 flex flex-col items-center justify-center">
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-4">Question</div>
              <p className="text-xl font-semibold text-slate-800 text-center leading-relaxed">
                {currentCard.question}
              </p>
              {currentCard.hint && (
                <p className="mt-4 text-sm text-slate-400 italic">Hint: {currentCard.hint}</p>
              )}
              <div className="mt-6 flex items-center gap-2 text-slate-300 text-xs">
                <span>Click to reveal answer</span>
              </div>
            </div>
            {/* Back */}
            <div className="card-back bg-blue-600 rounded-2xl border border-blue-500 shadow-lg p-8 flex flex-col items-center justify-center">
              <div className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-4">Answer</div>
              <p className="text-xl font-semibold text-white text-center leading-relaxed">
                {currentCard.answer}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation hint */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => { setCurrentIndex((p) => Math.max(0, p - 1)); setIsFlipped(false); }}
          disabled={currentIndex === 0}
          className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex gap-1.5">
          {set.cards.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentIndex(i); setIsFlipped(false); }}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex ? 'bg-blue-600 w-4' :
                cardResults.find((r) => r.card_id === set.cards[i].id) ? 'bg-green-400' :
                'bg-slate-200'
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => { setCurrentIndex((p) => Math.min(totalCards - 1, p + 1)); setIsFlipped(false); }}
          disabled={currentIndex === totalCards - 1}
          className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Quality rating (shown after flip) */}
      {isFlipped && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-slate-700 text-center mb-4">
            How well did you know this?
          </p>
          <div className="grid grid-cols-5 gap-2">
            {qualityLabels.map(({ q, label, color }) => (
              <button
                key={q}
                onClick={() => handleQuality(q)}
                className={`py-2 px-2 rounded-xl text-white text-xs font-bold transition-all ${color} hover:scale-105 active:scale-95 shadow-sm`}
              >
                <div className="text-base font-bold">{q}</div>
                <div className="text-xs opacity-90">{label}</div>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-center gap-3 mt-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><X className="w-3 h-3 text-red-400" /> 1-2: Incorrect</span>
            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" /> 3: Struggled</span>
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> 4-5: Correct</span>
          </div>
        </div>
      )}

      {!isFlipped && (
        <div className="text-center">
          <button
            onClick={handleFlip}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200 text-sm"
          >
            Reveal Answer
          </button>
        </div>
      )}
    </div>
  );
}
