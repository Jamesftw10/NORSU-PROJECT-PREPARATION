import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Flame, Star, Clock, Plus, ArrowRight,
  Target, TrendingUp, Zap, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';

interface StudySet {
  id: number;
  title: string;
  subject?: string;
  card_count: number;
  last_studied?: string;
}

interface DueCard {
  id: number;
  set_id: number;
  set_title: string;
  question: string;
}

interface ProgressSummary {
  total_sets: number;
  total_cards_studied: number;
  correct_rate: number;
  current_streak: number;
  xp: number;
  due_cards: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [sets, setSets] = useState<StudySet[]>([]);
  const [dueCards] = useState<DueCard[]>([]);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [setsRes, progressRes] = await Promise.all([
          api.get('/sets?mine=true'),
          api.get('/progress/summary'),
        ]);
        setSets(setsRes.data.sets ?? setsRes.data ?? []);
        setSummary(progressRes.data);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const recentSets = sets.slice(0, 4);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {greeting}, {user?.username}! 👋
            </h1>
            <p className="text-slate-500 mt-1">
              {summary?.due_cards
                ? `You have ${summary.due_cards} cards due for review today.`
                : 'Keep up the great work!'}
            </p>
          </div>
          <Link
            to="/sets/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
          >
            <Plus className="w-4 h-4" />
            New Set
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{user?.streak ?? 0}</p>
          <p className="text-sm text-slate-500">Day Streak 🔥</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{user?.xp ?? 0}</p>
          <p className="text-sm text-slate-500">Total XP</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{sets.length}</p>
          <p className="text-sm text-slate-500">Study Sets</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {summary?.correct_rate ? `${Math.round(summary.correct_rate)}%` : '—'}
          </p>
          <p className="text-sm text-slate-500">Accuracy</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent sets */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Recent Sets</h2>
            <Link to="/sets" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : recentSets.length > 0 ? (
            <div className="space-y-3">
              {recentSets.map((set) => (
                <div
                  key={set.id}
                  className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                        {set.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        {set.subject && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{set.subject}</span>}
                        <span>{set.card_count} cards</span>
                        {set.last_studied && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(set.last_studied).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Link
                        to={`/sets/${set.id}/study`}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Study
                      </Link>
                      <Link
                        to={`/sets/${set.id}/quiz`}
                        className="px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        Quiz
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium mb-4">No study sets yet</p>
              <Link
                to="/sets/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Your First Set
              </Link>
            </div>
          )}
        </div>

        {/* Quick actions + stats */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-base font-bold text-slate-800 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                to="/sets/new"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Plus className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">Create New Set</span>
                <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
              </Link>
              <Link
                to="/sets"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-green-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <BookOpen className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">Browse Sets</span>
                <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
              </Link>
              <Link
                to="/progress"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">View Progress</span>
                <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
              </Link>
              <Link
                to="/leaderboard"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-yellow-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                  <Zap className="w-4 h-4 text-yellow-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">Leaderboard</span>
                <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
              </Link>
            </div>
          </div>

          {/* Study streak reminder */}
          {(user?.streak ?? 0) > 0 && (
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-5 text-white shadow-lg shadow-orange-200">
              <div className="text-3xl mb-2">🔥</div>
              <p className="font-bold text-lg">{user?.streak} Day Streak!</p>
              <p className="text-orange-100 text-sm mt-1">
                Keep it going! Study today to maintain your streak.
              </p>
            </div>
          )}

          {dueCards.length > 0 && (
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-200">
              <div className="text-3xl mb-2">📚</div>
              <p className="font-bold text-lg">{dueCards.length} Cards Due</p>
              <p className="text-blue-100 text-sm mt-1">
                Review your spaced repetition cards now.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
