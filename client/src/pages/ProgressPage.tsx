import { useEffect, useState } from 'react';
import { TrendingUp, Flame, Star, Target, BookOpen, Award, BarChart2 } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

interface ProgressSummary {
  total_sessions: number;
  total_cards_studied: number;
  correct_rate: number;
  current_streak: number;
  longest_streak: number;
  xp: number;
  total_sets: number;
  weekly_sessions: number[];
  recent_sessions: Array<{
    id: number;
    set_title: string;
    cards_studied: number;
    cards_correct: number;
    duration: number;
    created_at: string;
  }>;
  achievements?: Array<{
    id: number;
    name: string;
    description: string;
    icon: string;
    earned_at?: string;
  }>;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const defaultAchievements = [
  { id: 1, name: 'First Study', description: 'Complete your first study session', icon: '📚', earned: true },
  { id: 2, name: '3-Day Streak', description: 'Study 3 days in a row', icon: '🔥', earned: false },
  { id: 3, name: 'Perfect Score', description: 'Get 100% on a quiz', icon: '⭐', earned: false },
  { id: 4, name: '100 Cards', description: 'Study 100 cards total', icon: '🎯', earned: false },
  { id: 5, name: 'Set Creator', description: 'Create 5 study sets', icon: '✏️', earned: false },
  { id: 6, name: 'Top 10', description: 'Reach top 10 on leaderboard', icon: '🏆', earned: false },
];

export default function ProgressPage() {
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/progress/summary')
      .then((res) => setSummary(res.data))
      .catch(() => toast.error('Failed to load progress'))
      .finally(() => setLoading(false));
  }, []);

  const weeklyData = summary?.weekly_sessions ?? [0, 2, 1, 3, 0, 4, 2];
  const maxSessions = Math.max(...weeklyData, 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Your Progress</h1>
        <p className="text-slate-500 text-sm mt-0.5">Track your learning journey</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Flame, label: 'Current Streak', value: `${summary?.current_streak ?? 0} days`, color: 'bg-orange-100 text-orange-600', iconColor: 'text-orange-500' },
          { icon: Star, label: 'Total XP', value: (summary?.xp ?? 0).toLocaleString(), color: 'bg-yellow-100 text-yellow-600', iconColor: 'text-yellow-500' },
          { icon: Target, label: 'Accuracy', value: `${Math.round(summary?.correct_rate ?? 0)}%`, color: 'bg-green-100 text-green-600', iconColor: 'text-green-500' },
          { icon: BookOpen, label: 'Cards Studied', value: (summary?.total_cards_studied ?? 0).toLocaleString(), color: 'bg-blue-100 text-blue-600', iconColor: 'text-blue-500' },
        ].map(({ icon: Icon, label, value, color, iconColor }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Weekly activity chart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-800">Weekly Activity</h2>
          </div>
          <div className="flex items-end justify-between gap-2 h-32">
            {weeklyData.map((count, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div className="w-full flex items-end justify-center" style={{ height: '100px' }}>
                  <div
                    className="w-full rounded-t-md bg-blue-500 transition-all duration-500 min-h-1"
                    style={{
                      height: `${Math.max(4, (count / maxSessions) * 100)}px`,
                      opacity: count > 0 ? 1 : 0.3,
                    }}
                  />
                </div>
                <span className="text-xs text-slate-400">{DAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Streak info */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Flame className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-slate-800">Streak Stats</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="font-semibold text-slate-800">Current Streak</p>
                  <p className="text-xs text-slate-500">Keep studying daily!</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-orange-500">{summary?.current_streak ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="font-semibold text-slate-800">Longest Streak</p>
                  <p className="text-xs text-slate-500">Your personal best</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-purple-600">{summary?.longest_streak ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-semibold text-slate-800">Total Sessions</p>
                  <p className="text-xs text-slate-500">All-time study sessions</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-green-600">{summary?.total_sessions ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Award className="w-5 h-5 text-yellow-500" />
          <h2 className="font-semibold text-slate-800">Achievements</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {defaultAchievements.map((ach) => (
            <div
              key={ach.id}
              className={`rounded-xl p-3 text-center border transition-all ${
                ach.earned
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-slate-100 bg-slate-50 opacity-50 grayscale'
              }`}
            >
              <div className="text-2xl mb-1.5">{ach.icon}</div>
              <p className={`text-xs font-semibold ${ach.earned ? 'text-slate-800' : 'text-slate-500'}`}>
                {ach.name}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 leading-tight">{ach.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent sessions */}
      {summary?.recent_sessions && summary.recent_sessions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-800">Recent Sessions</h2>
          </div>
          <div className="space-y-3">
            {summary.recent_sessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
              >
                <div>
                  <p className="font-medium text-slate-800 text-sm">{session.set_title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(session.created_at).toLocaleDateString()} ·{' '}
                    {Math.round(session.duration / 60)}m
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm text-slate-800">
                    {session.cards_correct}/{session.cards_studied}
                  </p>
                  <p className={`text-xs font-medium ${
                    (session.cards_correct / session.cards_studied) >= 0.8
                      ? 'text-green-600' : 'text-orange-500'
                  }`}>
                    {Math.round((session.cards_correct / session.cards_studied) * 100)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
