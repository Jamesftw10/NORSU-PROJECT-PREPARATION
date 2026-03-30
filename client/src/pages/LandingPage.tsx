
import { Link } from 'react-router-dom';
import {
  GraduationCap, Zap, Brain, Trophy, BarChart3, Users,
  ArrowRight, BookOpen, Star, CheckCircle, Flame
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'Spaced Repetition',
    desc: 'Smart algorithm surfaces cards you need to review most, maximizing retention.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Zap,
    title: 'Multiple Quiz Modes',
    desc: 'Test yourself with multiple choice, fill-in-the-blank, and Q&A formats.',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: Trophy,
    title: 'Gamified Learning',
    desc: 'Earn XP, maintain streaks, unlock achievements and climb the leaderboard.',
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    icon: BarChart3,
    title: 'Progress Analytics',
    desc: 'Detailed insights into your study habits, accuracy, and improvement over time.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: Users,
    title: 'Shared Sets',
    desc: 'Share study sets with classmates or browse sets created by other NORSU students.',
    color: 'bg-pink-100 text-pink-600',
  },
  {
    icon: BookOpen,
    title: 'Rich Flashcards',
    desc: 'Create cards with hints, images, and organize them by subject.',
    color: 'bg-indigo-100 text-indigo-600',
  },
];

const stats = [
  { label: 'Active Students', value: '2,400+' },
  { label: 'Study Sets Created', value: '18,500+' },
  { label: 'Cards Studied', value: '1.2M+' },
  { label: 'Avg. Score Improvement', value: '34%' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-lg">NORSU</span>
              <span className="text-slate-400 text-sm ml-1.5">Study Platform</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20 pb-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-100 opacity-50 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-100 opacity-50 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
            <Flame className="w-4 h-4 text-orange-500" />
            Built for NORSU Students
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
            Study Smarter.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Score Higher.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            The AI-powered study platform designed for NORSU students. Master your subjects with
            spaced repetition, gamified quizzes, and progress analytics.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 text-base"
            >
              Start Studying Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all border border-slate-200 shadow-sm text-base"
            >
              Sign In with LRN
            </Link>
          </div>

          {/* Mock card preview */}
          <div className="mt-16 max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200 border border-slate-100 p-8 text-center transform hover:-rotate-1 transition-transform duration-300">
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">Biology · Chapter 4</div>
              <p className="text-xl font-semibold text-slate-800 mb-6">
                What is the powerhouse of the cell?
              </p>
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                <span>Tap to flip</span>
                <span className="w-4 h-4 rounded-full border-2 border-slate-300 flex items-center justify-center">↩</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-extrabold text-white mb-1">{s.value}</div>
                <div className="text-blue-200 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Ace Your Exams
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Powerful tools built around proven learning science to help NORSU students study efficiently.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300 group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-800 text-lg mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Get Started in Minutes
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Register with LRN', desc: 'Sign up using your 12-digit Learner Reference Number.' },
              { step: '02', title: 'Create or Browse Sets', desc: 'Build your own flashcard sets or explore sets from classmates.' },
              { step: '03', title: 'Study & Track Progress', desc: 'Use spaced repetition and quizzes. Watch your scores improve.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                  {item.step}
                </div>
                <h3 className="font-semibold text-slate-800 text-lg mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-yellow-300 fill-yellow-300" />
            ))}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Join Thousands of NORSU Students
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Start your free account today and transform how you study.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-xl text-base"
          >
            Create Free Account
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="mt-6 flex items-center justify-center gap-2 text-blue-200 text-sm">
            <CheckCircle className="w-4 h-4" />
            No credit card required · Free forever for students
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-900 text-slate-400 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <GraduationCap className="w-4 h-4 text-blue-400" />
          <span className="text-slate-300 font-semibold">NORSU Study Platform</span>
        </div>
        <p>© {new Date().getFullYear()} Norsu. Built for NORSU students.</p>
      </footer>
    </div>
  );
}
