# NORSU AI Study Platform

An AI-powered learning platform inspired by Gizmo AI, built specifically for **NORSU (Negros Oriental State University)** students.

## 🎯 Features

### For Students
- **LRN-Based Registration** — Sign up using your 12-digit Learning Reference Number
- **Flashcard Sets** — Create, organize, and study with interactive flashcards
- **AI Quiz Generation** — Automatically generate multiple-choice, fill-in-the-blank, and Q&A quizzes
- **Spaced Repetition** — Smart review scheduling using the SM-2 algorithm
- **Gamified Learning** — Earn XP, maintain streaks 🔥, unlock achievements 🏆
- **Leaderboard** — Compete with fellow NORSUnians ranked by XP
- **Progress Tracking** — Detailed stats, activity history, and achievement badges

### For Administrators
- **User Management** — View, manage, and moderate student accounts
- **Platform Statistics** — Monitor active users, study sessions, and platform growth
- **Activity Tracking** — Track daily/weekly activity and top performers

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT (JSON Web Tokens) |
| AI (optional) | OpenAI API |

## 🚀 Getting Started

### Prerequisites
- Node.js v22+ 
- npm v9+

### Installation

```bash
# Install root dependencies
npm install

# Install server dependencies
npm install --workspace=server

# Install client dependencies
npm install --workspace=client --legacy-peer-deps
```

### Running in Development

```bash
# Terminal 1 - Start the backend server (port 3001)
cd server && npm run dev

# Terminal 2 - Start the frontend (port 5173)
cd client && npm run dev
```

### Building for Production

```bash
npm run build
npm run start
```

## 🔑 Default Admin Credentials

```
Email: admin@norsu.edu.ph
Password: admin123
```
> ⚠️ **Change these credentials immediately after deployment!**

## 🔧 Configuration

```bash
cp server/.env.example server/.env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `JWT_SECRET` | Secret key for JWT tokens | Change this! |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `OPENAI_API_KEY` | OpenAI API key for AI quiz generation | Optional |

## 📱 Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Login with LRN or email |
| `/register` | Register with 12-digit LRN |
| `/dashboard` | Student dashboard |
| `/sets` | Browse flashcard sets |
| `/sets/new` | Create flashcard set |
| `/sets/:id/study` | Flashcard study mode with spaced repetition |
| `/sets/:id/quiz` | Quiz mode (multiple choice, fill-blank, Q&A) |
| `/progress` | Learning progress and achievements |
| `/leaderboard` | Student rankings by XP |
| `/admin` | Admin panel (admin only) |

## 🎓 About

Built for NORSUnians who want to **study smarter** using AI-powered tools. The LRN (Learning Reference Number) system ensures that only registered NORSU students can create accounts.

> *"Study Smart, Not Hard"* — Made for NORSUnians 🎓
