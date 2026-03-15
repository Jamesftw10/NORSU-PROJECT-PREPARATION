import { useEffect, useState } from 'react';
import { Trophy, Medal, Crown, Flame, Star, TrendingUp } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  xp: number;
  streak: number;
  total_sessions?: number;
  correct_rate?: number;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/progress/leaderboard')
      .then((res) => {
        const data = res.data.leaderboard ?? res.data ?? [];
        setEntries(data.map((e: LeaderboardEntry, i: number) => ({ ...e, rank: e.rank ?? i + 1 })));
      })
      .catch(() => toast.error('Failed to load leaderboard'))
      .finally(() => setLoading(false));
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-bold text-slate-500">#{rank}</span>;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200';
    if (rank === 2) return 'bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200';
    if (rank === 3) return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200';
    return 'bg-white border-slate-100';
  };

  const myEntry = entries.find((e) => e.user_id === user?.id);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-100 mb-4">
          <Trophy className="w-9 h-9 text-yellow-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Leaderboard</h1>
        <p className="text-slate-500 text-sm mt-1">Top NORSU students ranked by XP</p>
      </div>

      {/* My rank card */}
      {myEntry && (
        <div className="bg-blue-600 rounded-2xl p-4 mb-6 text-white shadow-lg shadow-blue-200">
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-2">Your Ranking</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                #{myEntry.rank}
              </div>
              <div>
                <p className="font-bold">{myEntry.username}</p>
                <div className="flex items-center gap-3 text-blue-100 text-xs mt-0.5">
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{myEntry.streak}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{myEntry.xp.toLocaleString()}</p>
              <p className="text-blue-200 text-xs">XP</p>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 podium */}
      {!loading && entries.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mb-8">
          {/* 2nd */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-200 border-4 border-slate-300 flex items-center justify-center font-bold text-slate-600 text-lg mb-2">
              {entries[1].username.charAt(0).toUpperCase()}
            </div>
            <div className="bg-slate-100 border-2 border-slate-300 rounded-t-xl w-20 h-16 flex flex-col items-center justify-center">
              <Medal className="w-5 h-5 text-slate-400 mb-1" />
              <p className="text-xs font-semibold text-slate-600 truncate px-1 max-w-full">{entries[1].username}</p>
              <p className="text-xs text-slate-500">{entries[1].xp.toLocaleString()}</p>
            </div>
          </div>
          {/* 1st */}
          <div className="flex flex-col items-center">
            <div className="text-yellow-400 text-xl mb-1">👑</div>
            <div className="w-14 h-14 rounded-full bg-yellow-200 border-4 border-yellow-400 flex items-center justify-center font-bold text-yellow-700 text-xl mb-2">
              {entries[0].username.charAt(0).toUpperCase()}
            </div>
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-t-xl w-20 h-24 flex flex-col items-center justify-center">
              <Crown className="w-5 h-5 text-yellow-500 mb-1" />
              <p className="text-xs font-bold text-slate-700 truncate px-1 max-w-full">{entries[0].username}</p>
              <p className="text-xs font-semibold text-yellow-600">{entries[0].xp.toLocaleString()}</p>
            </div>
          </div>
          {/* 3rd */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 border-4 border-amber-400 flex items-center justify-center font-bold text-amber-700 text-lg mb-2">
              {entries[2].username.charAt(0).toUpperCase()}
            </div>
            <div className="bg-amber-50 border-2 border-amber-300 rounded-t-xl w-20 h-12 flex flex-col items-center justify-center">
              <Medal className="w-5 h-5 text-amber-600 mb-1" />
              <p className="text-xs font-semibold text-slate-600 truncate px-1 max-w-full">{entries[2].username}</p>
              <p className="text-xs text-slate-500">{entries[2].xp.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Full list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-3 bg-slate-200 rounded w-1/3 mb-1.5" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No leaderboard data yet. Start studying!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.user_id}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${getRankStyle(entry.rank)} ${
                entry.user_id === user?.id ? 'ring-2 ring-blue-400 ring-offset-1' : ''
              }`}
            >
              <div className="w-8 flex items-center justify-center flex-shrink-0">
                {getRankIcon(entry.rank)}
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {entry.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm text-slate-800 ${entry.user_id === user?.id ? 'text-blue-700' : ''}`}>
                  {entry.username}
                  {entry.user_id === user?.id && <span className="ml-1 text-xs text-blue-500">(you)</span>}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  {entry.streak > 0 && (
                    <span className="flex items-center gap-1 text-xs text-orange-500">
                      <Flame className="w-3 h-3" />{entry.streak}
                    </span>
                  )}
                  {entry.correct_rate != null && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <TrendingUp className="w-3 h-3" />{Math.round(entry.correct_rate)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-yellow-600 font-bold text-sm flex-shrink-0">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {entry.xp.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
