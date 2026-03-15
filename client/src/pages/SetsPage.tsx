import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Plus, BookOpen, Globe, Lock, MoreVertical,
  Edit, Trash2, Play, Zap
} from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

interface StudySet {
  id: number;
  title: string;
  description?: string;
  subject?: string;
  is_public: boolean;
  card_count: number;
  owner_username?: string;
  created_at: string;
}

type FilterMode = 'all' | 'mine' | 'public';

export default function SetsPage() {
  const [sets, setSets] = useState<StudySet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('mine');
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const fetchSets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === 'mine') params.set('mine', 'true');
      if (search.trim()) params.set('search', search.trim());
      const res = await api.get(`/sets?${params}`);
      setSets(res.data.sets ?? res.data ?? []);
    } catch {
      toast.error('Failed to load sets');
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    const timeout = setTimeout(fetchSets, search ? 400 : 0);
    return () => clearTimeout(timeout);
  }, [fetchSets, search]);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this set? This action cannot be undone.')) return;
    try {
      await api.delete(`/sets/${id}`);
      setSets((prev) => prev.filter((s) => s.id !== id));
      toast.success('Set deleted');
    } catch {
      toast.error('Failed to delete set');
    }
    setOpenMenu(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Study Sets</h1>
          <p className="text-slate-500 text-sm mt-0.5">Browse, create, and study your flashcard sets</p>
        </div>
        <Link
          to="/sets/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
        >
          <Plus className="w-4 h-4" />
          New Set
        </Link>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sets..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
          />
        </div>
        <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
          {(['mine', 'public', 'all'] as FilterMode[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors capitalize ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {f === 'mine' ? 'My Sets' : f === 'public' ? 'Public' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-500 mb-4">
        {loading ? 'Loading...' : `${sets.length} set${sets.length !== 1 ? 's' : ''} found`}
      </p>

      {/* Sets grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-full mb-4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : sets.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium mb-2">No sets found</p>
          <p className="text-slate-400 text-sm mb-6">
            {search ? 'Try a different search term.' : 'Create your first study set to get started.'}
          </p>
          <Link
            to="/sets/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Set
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sets.map((set) => (
            <div
              key={set.id}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all relative group"
            >
              {/* Menu button */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setOpenMenu(openMenu === set.id ? null : set.id)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4 text-slate-500" />
                </button>

                {openMenu === set.id && (
                  <div className="absolute right-0 top-8 bg-white rounded-xl shadow-xl border border-slate-100 z-10 py-1 w-44">
                    <Link
                      to={`/sets/${set.id}/edit`}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => setOpenMenu(null)}
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit Set
                    </Link>
                    <button
                      onClick={() => handleDelete(set.id)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Set
                    </button>
                  </div>
                )}
              </div>

              {/* Header */}
              <div className="flex items-start gap-2 mb-3 pr-6">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate text-sm">{set.title}</h3>
                  {set.owner_username && (
                    <p className="text-xs text-slate-400">by {set.owner_username}</p>
                  )}
                </div>
              </div>

              {set.description && (
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{set.description}</p>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {set.subject && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                    {set.subject}
                  </span>
                )}
                <span className="text-xs text-slate-500">{set.card_count} cards</span>
                {set.is_public ? (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <Globe className="w-3 h-3" /> Public
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Lock className="w-3 h-3" /> Private
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  to={`/sets/${set.id}/study`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  Study
                </Link>
                <Link
                  to={`/sets/${set.id}/quiz`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold hover:bg-purple-200 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Quiz
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Close menu on outside click */}
      {openMenu !== null && (
        <div className="fixed inset-0 z-0" onClick={() => setOpenMenu(null)} />
      )}
    </div>
  );
}
