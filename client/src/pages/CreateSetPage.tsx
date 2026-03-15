import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, GripVertical, Lightbulb } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

interface Card {
  id?: number;
  question: string;
  answer: string;
  hint?: string;
}

interface SetForm {
  title: string;
  description: string;
  subject: string;
  is_public: boolean;
}

const emptyCard = (): Card => ({ question: '', answer: '', hint: '' });

const SUBJECTS = [
  'Mathematics', 'Science', 'English', 'Filipino', 'History',
  'Geography', 'Physics', 'Chemistry', 'Biology', 'Technology',
  'Arts', 'Music', 'P.E.', 'Other',
];

export default function CreateSetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<SetForm>({
    title: '',
    description: '',
    subject: '',
    is_public: false,
  });
  const [cards, setCards] = useState<Card[]>([emptyCard(), emptyCard()]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit || !id) return;
    api.get(`/sets/${id}`).then((res) => {
      const set = res.data.set ?? res.data;
      setForm({
        title: set.title ?? '',
        description: set.description ?? '',
        subject: set.subject ?? '',
        is_public: set.is_public ?? false,
      });
      const fetchedCards = (set.cards ?? []).map((c: Card) => ({
        id: c.id,
        question: c.question,
        answer: c.answer,
        hint: c.hint ?? '',
      }));
      setCards(fetchedCards.length > 0 ? fetchedCards : [emptyCard(), emptyCard()]);
    }).catch(() => {
      toast.error('Failed to load set');
      navigate('/sets');
    }).finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  const updateForm = (field: keyof SetForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = field === 'is_public'
      ? (e.target as HTMLInputElement).checked
      : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateCard = (index: number, field: keyof Card) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setCards((prev) => prev.map((c, i) => i === index ? { ...c, [field]: e.target.value } : c));
  };

  const addCard = () => setCards((prev) => [...prev, emptyCard()]);

  const removeCard = (index: number) => {
    if (cards.length <= 2) {
      toast.error('A set must have at least 2 cards.');
      return;
    }
    setCards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Please enter a title.'); return; }
    const validCards = cards.filter((c) => c.question.trim() && c.answer.trim());
    if (validCards.length < 2) { toast.error('You need at least 2 complete cards.'); return; }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        subject: form.subject,
        is_public: form.is_public,
        cards: validCards.map((c) => ({
          ...(c.id ? { id: c.id } : {}),
          question: c.question.trim(),
          answer: c.answer.trim(),
          hint: c.hint?.trim() || undefined,
        })),
      };

      if (isEdit) {
        await api.put(`/sets/${id}`, payload);
        toast.success('Set updated!');
        navigate('/sets');
      } else {
        const res = await api.post('/sets', payload);
        toast.success('Set created!');
        navigate(`/sets/${res.data.set?.id ?? res.data.id}/study`);
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save set.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEdit ? 'Edit Set' : 'Create New Set'}
          </h1>
          <p className="text-slate-500 text-sm">
            {isEdit ? 'Update your flashcard set' : 'Build a new flashcard set to study'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Set details */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-slate-800 mb-4">Set Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={updateForm('title')}
                placeholder="e.g. Biology Chapter 4 - Cells"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={updateForm('description')}
                placeholder="What will you learn from this set?"
                rows={2}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
              <select
                value={form.subject}
                onChange={updateForm('subject')}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              >
                <option value="">Select subject...</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_public}
                  onChange={updateForm('is_public')}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {form.is_public ? 'Public' : 'Private'}
                </p>
                <p className="text-xs text-slate-400">
                  {form.is_public ? 'Visible to all students' : 'Only visible to you'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">
              Cards <span className="text-slate-400 font-normal text-sm">({cards.length})</span>
            </h2>
          </div>

          {cards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-slate-300" />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Card {index + 1}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeCard(index)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
                    Question / Term
                  </label>
                  <textarea
                    value={card.question}
                    onChange={updateCard(index, 'question')}
                    placeholder="Enter question or term..."
                    rows={3}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
                    Answer / Definition
                  </label>
                  <textarea
                    value={card.answer}
                    onChange={updateCard(index, 'answer')}
                    placeholder="Enter answer or definition..."
                    rows={3}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-1 text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
                    <Lightbulb className="w-3 h-3 text-yellow-500" />
                    Hint (optional)
                  </label>
                  <input
                    type="text"
                    value={card.hint ?? ''}
                    onChange={updateCard(index, 'hint')}
                    placeholder="Add a hint to help remember..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addCard}
            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Card
          </button>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between sticky bottom-4">
          <p className="text-sm text-slate-500">
            {cards.filter((c) => c.question.trim() && c.answer.trim()).length} complete card
            {cards.filter((c) => c.question.trim() && c.answer.trim()).length !== 1 ? 's' : ''}
          </p>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEdit ? 'Save Changes' : 'Create Set'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
