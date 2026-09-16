import React, { useMemo, useState, useCallback } from 'react';
import { Task, Category, FitnessEntry, UserProfile, FilterStatus } from '../types';
import {
  CheckSquare, Clock, AlertTriangle, ChevronRight, Flame, Calendar, Zap,
  Target, TrendingUp, Trophy, ArrowRight, Star, Play, Plus, Dumbbell,
  CheckCircle2, AlertCircle, Sparkles, Circle, BookOpen, Timer, Lightbulb,
  BarChart3, Coffee, Moon, Sun, Droplets, StickyNote, Rocket, Shield,
  Music, Focus, Repeat, Hash, Smile, Frown, Meh, ThumbsUp, Heart, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_ICONS, MUSCLE_GROUP_COLORS, getRankInfo } from '../utils/fitness';
import { isOverdue as checkOverdue, isDueToday, isDueThisWeek } from '../utils/dateHelpers';

interface HomeScreenProps {
  theme: 'dark' | 'light';
  userName: string;
  tasks: Task[];
  fitnessEntries: FitnessEntry[];
  totalWorkoutsLogged: number;
  userProfile: UserProfile;
  onSelectWorkout: (id: string) => void;
  onNavigateToView: (view: string, filter?: FilterStatus) => void;
  onNewTask: () => void;
  onLogWorkout: () => void;
}

const MOOD_EMOJI: Record<string, string> = {
  energized: '⚡', great: '🔥', good: '👍', tired: '😅', exhausted: '💀',
};

const MOTIVATIONAL_QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It's not about having time. It's about making time.", author: "Unknown" },
  { text: "Small daily improvements lead to stunning results.", author: "Robin Sharma" },
  { text: "Discipline is choosing what you want most over what you want now.", author: "Unknown" },
  { text: "Your body can stand almost anything. It's your mind you have to convince.", author: "Unknown" },
  { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { text: "Progress, not perfection.", author: "Unknown" },
  { text: "Don't count the days. Make the days count.", author: "Muhammad Ali" },
  { text: "Strength doesn't come from what you can do. It comes from overcoming the things you once thought you couldn't.", author: "Unknown" },
  { text: "The harder you work, the luckier you get.", author: "Gary Player" },
];

const DAILY_TIPS = [
  { icon: '🧠', title: 'Productivity', tip: 'Try the 2-minute rule: if it takes less than 2 minutes, do it now.' },
  { icon: '💪', title: 'Fitness', tip: 'Rest days are growth days. Your muscles rebuild during rest.' },
  { icon: '🎯', title: 'Focus', tip: 'Work in 25-minute focus blocks with 5-minute breaks (Pomodoro).' },
  { icon: '💤', title: 'Recovery', tip: 'Aim for 7-9 hours of sleep for optimal recovery and performance.' },
  { icon: '🥗', title: 'Nutrition', tip: 'Eat protein within 30 minutes after your workout for best results.' },
  { icon: '⏰', title: 'Timing', tip: 'Your brain is sharpest 2-4 hours after waking. Schedule deep work then.' },
  { icon: '🧘', title: 'Mindfulness', tip: 'Take 3 deep breaths before starting a task. It resets your focus.' },
  { icon: '💧', title: 'Hydration', tip: 'Drink water first thing in the morning. You wake up dehydrated.' },
];

const MOOD_OPTIONS = [
  { value: 'energized', emoji: '⚡', label: 'Energized' },
  { value: 'great', emoji: '🔥', label: 'Great' },
  { value: 'good', emoji: '👍', label: 'Good' },
  { value: 'tired', emoji: '😅', label: 'Tired' },
  { value: 'exhausted', emoji: '💀', label: 'Exhausted' },
];

const QUICK_SHORTCUTS = [
  { label: 'Tasks', icon: <CheckSquare className="w-4 h-4" />, view: 'tasks', color: '#3b82f6' },
  { label: 'Fitness', icon: <Dumbbell className="w-4 h-4" />, view: 'fitness', color: '#f97316' },
  { label: 'Today', icon: <Calendar className="w-4 h-4" />, view: 'tasks', filter: 'today' as const, color: '#22c55e' },
  { label: 'Overdue', icon: <AlertTriangle className="w-4 h-4" />, view: 'tasks', filter: 'overdue' as const, color: '#ef4444' },
  { label: 'Done', icon: <CheckCircle2 className="w-4 h-4" />, view: 'tasks', filter: 'completed' as const, color: '#8b5cf6' },
  { label: 'Stats', icon: <BarChart3 className="w-4 h-4" />, view: 'fitness', color: '#06b6d4' },
];

const PRIORITY_COLORS = {
  urgent: { bg: 'bg-red-500', text: 'text-red-400', light: 'bg-red-50 text-red-600', border: 'border-red-500/20' },
  high: { bg: 'bg-orange-500', text: 'text-orange-400', light: 'bg-orange-50 text-orange-600', border: 'border-orange-500/20' },
  medium: { bg: 'bg-blue-500', text: 'text-blue-400', light: 'bg-blue-50 text-blue-600', border: 'border-blue-500/20' },
  low: { bg: 'bg-green-500', text: 'text-green-400', light: 'bg-green-50 text-green-600', border: 'border-green-500/20' },
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  theme,
  userName,
  tasks,
  fitnessEntries,
  totalWorkoutsLogged,
  userProfile,
  onSelectWorkout,
  onNavigateToView,
  onNewTask,
  onLogWorkout,
}) => {
  const isLight = theme === 'light';
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const [moodToday, setMoodToday] = useState<string | null>(() => {
    try { return localStorage.getItem(`doit-mood-${today}`); } catch { return null; }
  });
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [waterCount, setWaterCount] = useState<number>(() => {
    try { return parseInt(localStorage.getItem(`doit-water-${today}`) || '0', 10); } catch { return 0; }
  });
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [quickNoteText, setQuickNoteText] = useState('');
  const [celebrateTask, setCelebrateTask] = useState<string | null>(null);

  // Task stats
  const pendingTasks = tasks.filter(t => !t.completed);
  const overdueTasks = pendingTasks.filter(t => new Date(t.dueDate) < now);
  const dueTodayTasks = pendingTasks.filter(t => t.dueDate.slice(0, 10) === today);
  const doneToday = tasks.filter(t => t.completed && t.completedAt?.slice(0, 10) === today);
  const completedTasks = tasks.filter(t => t.completed);

  // Focus task
  const focusTask = useMemo(() => {
    const urgentOverdue = overdueTasks.filter(t => t.priority === 'urgent');
    if (urgentOverdue.length > 0) return urgentOverdue[0];
    const highOverdue = overdueTasks.filter(t => t.priority === 'high');
    if (highOverdue.length > 0) return highOverdue[0];
    if (overdueTasks.length > 0) return overdueTasks[0];
    const urgentToday = dueTodayTasks.filter(t => t.priority === 'urgent');
    if (urgentToday.length > 0) return urgentToday[0];
    const highToday = dueTodayTasks.filter(t => t.priority === 'high');
    if (highToday.length > 0) return highToday[0];
    if (dueTodayTasks.length > 0) return dueTodayTasks[0];
    return pendingTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0] || null;
  }, [overdueTasks, dueTodayTasks, pendingTasks]);

  // Upcoming tasks (next 5)
  const upcomingTasks = useMemo(() => {
    return pendingTasks
      .filter(t => !checkOverdue(t.dueDate, t.completed))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [pendingTasks]);

  // Recently completed (last 5)
  const recentCompleted = useMemo(() => {
    return completedTasks
      .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())
      .slice(0, 5);
  }, [completedTasks]);

  // Weekly dots (last 7 days)
  const weeklyDots = useMemo(() => {
    const dots = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayCompleted = tasks.filter(t => t.completed && t.completedAt?.slice(0, 10) === dateStr).length;
      const dayLabel = d.toLocaleDateString('en', { weekday: 'short' });
      dots.push({ date: dateStr, count: dayCompleted, label: dayLabel, isToday: i === 0 });
    }
    return dots;
  }, [tasks, now]);

  // Productivity score
  const productivityScore = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((completedTasks.length / tasks.length) * 100);
  }, [tasks, completedTasks]);

  // Focus time
  const focusMinutes = useMemo(() => {
    return [...dueTodayTasks, ...overdueTasks].reduce((sum, t) => sum + (t.estimatedMinutes || 30), 0);
  }, [dueTodayTasks, overdueTasks]);

  // Streak
  const streak = userProfile.fitnessStats?.currentStreak || 0;
  const weeklyGoal = userProfile.goals?.includes('endurance') ? 5 : 4;
  const thisWeekWorkouts = fitnessEntries.filter(e => {
    const d = new Date(e.date);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    return d >= startOfWeek;
  }).length;

  // Daily quote (deterministic by date)
  const dailyQuote = useMemo(() => {
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
  }, [now]);

  // Daily tip (deterministic by date)
  const dailyTip = useMemo(() => {
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
  }, [now]);

  // Water goal
  const waterGoal = 8;
  const saveWater = useCallback((count: number) => {
    try { localStorage.setItem(`doit-water-${today}`, String(count)); } catch {}
  }, [today]);

  const saveMood = useCallback((mood: string) => {
    try { localStorage.setItem(`doit-mood-${today}`, mood); } catch {}
    setMoodToday(mood);
    setShowMoodPicker(false);
  }, [today]);

  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getTimeIcon = () => {
    const hour = now.getHours();
    if (hour < 12) return <Sun className="w-4 h-4 text-amber-400" />;
    if (hour < 18) return <Sun className="w-4 h-4 text-orange-400" />;
    return <Moon className="w-4 h-4 text-indigo-400" />;
  };

  const getMotivationalLine = () => {
    if (overdueTasks.length > 0) return `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} need your attention`;
    if (dueTodayTasks.length > 0) return `You have ${dueTodayTasks.length} task${dueTodayTasks.length > 1 ? 's' : ''} to crush today`;
    if (pendingTasks.length === 0 && completedTasks.length > 0) return "All tasks done! You're on fire";
    if (pendingTasks.length === 0) return "Start by creating your first task";
    return `${pendingTasks.length} task${pendingTasks.length > 1 ? 's' : ''} waiting for you`;
  };

  // Task completion celebration
  const triggerCelebration = useCallback((taskTitle: string) => {
    setCelebrateTask(taskTitle);
    setTimeout(() => setCelebrateTask(null), 2000);
  }, []);

  // Smart scheduling suggestion
  const schedulingSuggestion = useMemo(() => {
    if (overdueTasks.length >= 3) return { text: 'You have many overdue tasks. Consider rescheduling some.', icon: '📅', action: () => onNavigateToView('tasks', 'overdue') };
    if (dueTodayTasks.length >= 5) return { text: 'Heavy day! Focus on high-priority tasks first.', icon: '🎯', action: () => onNavigateToView('tasks', 'today') };
    if (doneToday.length >= 3 && dueTodayTasks.length <= 1) return { text: 'Great progress! Time for a workout?', icon: '💪', action: onLogWorkout };
    return null;
  }, [overdueTasks, dueTodayTasks, doneToday, onNavigateToView, onLogWorkout]);

  // Upcoming deadline urgency
  const urgentDeadline = useMemo(() => {
    const nextTask = upcomingTasks[0];
    if (!nextTask) return null;
    const diff = new Date(nextTask.dueDate).getTime() - now.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 2) return { task: nextTask, urgency: 'critical' as const, text: `${hours}h left!` };
    if (hours < 24) return { task: nextTask, urgency: 'soon' as const, text: `${hours}h left` };
    return null;
  }, [upcomingTasks, now]);

  return (
    <div className="space-y-4 pb-24">
      {/* Hero Greeting Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`relative rounded-3xl p-5 sm:p-6 overflow-hidden ${
          isLight
            ? 'bg-gradient-to-br from-white via-white to-gray-50 shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
            : 'bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent border border-white/[0.04]'
        }`}
      >
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#c8ff00]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-[#c8ff00]/3 rounded-full blur-2xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <img src="/logo1.jpg" alt="DoIT" className="w-10 h-10 rounded-xl object-cover shadow-md" />
              <div>
                <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {getGreeting()}, {userName || 'there'}
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {getTimeIcon()}
                  <p className={`text-xs ${isLight ? 'text-gray-400' : 'text-white/35'}`}>
                    {now.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
            <p className={`text-sm font-medium ${isLight ? 'text-gray-500' : 'text-white/45'}`}>
              {getMotivationalLine()}
            </p>
          </div>

          {userProfile.fitnessStats && (() => {
            const rankInfo = getRankInfo(userProfile.fitnessStats.rank);
            return rankInfo ? (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl shrink-0 ${isLight ? 'bg-white shadow-sm' : 'bg-white/[0.06]'}`}>
                <span className="text-base">{rankInfo.icon}</span>
                <span className="text-[10px] font-bold" style={{ color: rankInfo.color }}>{rankInfo.rank}</span>
              </div>
            ) : null;
          })()}
        </div>
      </motion.div>

      {/* Daily Quote */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className={`rounded-2xl p-4 ${isLight ? 'bg-white shadow-sm' : 'bg-white/[0.04]'}`}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#c8ff00]/10 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-[#c8ff00]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-medium italic leading-relaxed ${isLight ? 'text-gray-600' : 'text-white/50'}`}>
              "{dailyQuote.text}"
            </p>
            <p className={`text-[10px] mt-1 ${isLight ? 'text-gray-400' : 'text-white/25'}`}>
              — {dailyQuote.author}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Side-by-Side Quick Captures */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="grid grid-cols-2 gap-3"
      >
        {/* Quick Task Capture */}
        <button
          onClick={onNewTask}
          className={`flex items-center gap-2.5 p-3.5 rounded-2xl transition-all active:scale-[0.97] ${
            isLight
              ? 'bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 hover:shadow-md'
              : 'bg-gradient-to-br from-blue-500/[0.08] to-sky-500/[0.04] border border-blue-500/10 hover:border-blue-500/20'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/15 text-blue-400'
          }`}>
            <Plus className="w-4 h-4" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className={`text-xs font-semibold ${isLight ? 'text-gray-700' : 'text-white/70'}`}>New Task</p>
            <p className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-white/25'}`}>Quick add</p>
          </div>
        </button>

        {/* Quick Workout Capture */}
        <button
          onClick={onLogWorkout}
          className={`flex items-center gap-2.5 p-3.5 rounded-2xl transition-all active:scale-[0.97] ${
            isLight
              ? 'bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 hover:shadow-md'
              : 'bg-gradient-to-br from-orange-500/[0.08] to-amber-500/[0.04] border border-orange-500/10 hover:border-orange-500/20'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isLight ? 'bg-orange-100 text-orange-600' : 'bg-orange-500/15 text-orange-400'
          }`}>
            <Dumbbell className="w-4 h-4" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className={`text-xs font-semibold ${isLight ? 'text-gray-700' : 'text-white/70'}`}>Log Workout</p>
            <p className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-white/25'}`}>Track sets</p>
          </div>
        </button>
      </motion.div>

      {/* Quick Shortcuts Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={`rounded-2xl p-3 ${isLight ? 'bg-white shadow-sm' : 'bg-white/[0.04]'}`}
      >
        <div className="grid grid-cols-6 gap-2">
          {QUICK_SHORTCUTS.map((shortcut, i) => (
            <motion.button
              key={shortcut.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.1 + i * 0.03 }}
              onClick={() => onNavigateToView(shortcut.view, shortcut.filter)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all active:scale-95 hover:bg-white/[0.06]"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${shortcut.color}15`, color: shortcut.color }}
              >
                {shortcut.icon}
              </div>
              <span className={`text-[10px] font-semibold ${isLight ? 'text-gray-500' : 'text-white/40'}`}>
                {shortcut.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Mood Check-in */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
        className={`rounded-2xl p-4 ${isLight ? 'bg-white shadow-sm' : 'bg-white/[0.04]'}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Smile className="w-4 h-4 text-yellow-400" />
            <h3 className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-gray-500' : 'text-white/40'}`}>
              How are you feeling?
            </h3>
          </div>
          {moodToday && (
            <span className={`text-[10px] font-semibold ${isLight ? 'text-gray-400' : 'text-white/25'}`}>
              Logged ✓
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m.value}
              onClick={() => saveMood(m.value)}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl flex-1 transition-all active:scale-95 ${
                moodToday === m.value
                  ? 'bg-[#c8ff00]/10 border border-[#c8ff00]/30 shadow-sm'
                  : isLight ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white/[0.03] hover:bg-white/[0.06]'
              }`}
            >
              <span className="text-xl">{m.emoji}</span>
              <span className={`text-[9px] font-semibold ${isLight ? 'text-gray-500' : 'text-white/35'}`}>
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Smart Stats Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Productivity',
            value: `${productivityScore}%`,
            sub: `${completedTasks.length}/${tasks.length}`,
            icon: <TrendingUp className="w-4 h-4" />,
            color: productivityScore >= 70 ? '#22c55e' : productivityScore >= 40 ? '#f59e0b' : '#ef4444',
            gradient: productivityScore >= 70
              ? 'from-green-500/10 to-emerald-500/5'
              : productivityScore >= 40
                ? 'from-amber-500/10 to-yellow-500/5'
                : 'from-red-500/10 to-rose-500/5',
            lightGradient: productivityScore >= 70
              ? 'from-green-50 to-emerald-50/50'
              : productivityScore >= 40
                ? 'from-amber-50 to-yellow-50/50'
                : 'from-red-50 to-rose-50/50',
            filter: 'completed' as const,
          },
          {
            label: 'Today',
            value: dueTodayTasks.length,
            sub: `${focusMinutes}min focus`,
            icon: <Calendar className="w-4 h-4" />,
            color: '#3b82f6',
            gradient: 'from-blue-500/10 to-sky-500/5',
            lightGradient: 'from-blue-50 to-sky-50/50',
            filter: 'today' as const,
          },
          {
            label: 'Overdue',
            value: overdueTasks.length,
            sub: overdueTasks.length > 0 ? 'Needs action' : 'All clear',
            icon: <AlertTriangle className="w-4 h-4" />,
            color: '#ef4444',
            gradient: 'from-red-500/10 to-rose-500/5',
            lightGradient: 'from-red-50 to-rose-50/50',
            filter: 'overdue' as const,
          },
          {
            label: 'Done Today',
            value: doneToday.length,
            sub: doneToday.length > 0 ? 'Keep going!' : 'Start strong',
            icon: <Zap className="w-4 h-4" />,
            color: '#22c55e',
            gradient: 'from-green-500/10 to-emerald-500/5',
            lightGradient: 'from-green-50 to-emerald-50/50',
            filter: 'completed' as const,
          },
        ].map((stat, i) => (
          <motion.button
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
            onClick={() => onNavigateToView('tasks', stat.filter)}
            className={`relative p-3 sm:p-4 rounded-2xl text-left transition-all active:scale-[0.97] overflow-hidden ${
              isLight
                ? `bg-gradient-to-br ${stat.lightGradient} shadow-sm hover:shadow-md`
                : `bg-gradient-to-br ${stat.gradient} border border-white/[0.04] hover:border-white/[0.08]`
            }`}
          >
            <div className="mb-2.5" style={{ color: stat.color }}>{stat.icon}</div>
            <p className={`text-2xl sm:text-3xl font-bold tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
              {stat.value}
            </p>
            <p className={`text-[10px] font-semibold uppercase tracking-wider mt-1 ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
              {stat.label}
            </p>
            <p className={`text-[10px] mt-0.5 ${isLight ? 'text-gray-400/70' : 'text-white/20'}`}>
              {stat.sub}
            </p>
          </motion.button>
        ))}
      </div>

      {/* Upcoming Deadline Alert */}
      {urgentDeadline && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={`rounded-2xl p-3 flex items-center gap-3 ${
            urgentDeadline.urgency === 'critical'
              ? 'bg-red-500/10 border border-red-500/20'
              : 'bg-amber-500/10 border border-amber-500/20'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            urgentDeadline.urgency === 'critical' ? 'bg-red-500/20' : 'bg-amber-500/20'
          }`}>
            <Timer className={`w-4 h-4 ${urgentDeadline.urgency === 'critical' ? 'text-red-400' : 'text-amber-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold truncate ${isLight ? 'text-gray-700' : 'text-white/70'}`}>
              {urgentDeadline.task.title}
            </p>
            <p className={`text-[10px] font-bold ${urgentDeadline.urgency === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
              {urgentDeadline.text}
            </p>
          </div>
          <ChevronRight className={`w-4 h-4 shrink-0 ${isLight ? 'text-gray-300' : 'text-white/20'}`} />
        </motion.div>
      )}

      {/* Smart Suggestion */}
      {schedulingSuggestion && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          onClick={schedulingSuggestion.action}
          className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all active:scale-[0.98] ${
            isLight
              ? 'bg-gradient-to-r from-[#c8ff00]/10 to-[#b8f000]/5 border border-[#c8ff00]/20'
              : 'bg-gradient-to-r from-[#c8ff00]/8 to-[#b8f000]/4 border border-[#c8ff00]/15'
          }`}
        >
          <span className="text-xl">{schedulingSuggestion.icon}</span>
          <p className={`text-xs font-semibold flex-1 text-left ${isLight ? 'text-gray-700' : 'text-white/60'}`}>
            {schedulingSuggestion.text}
          </p>
          <ArrowRight className={`w-4 h-4 shrink-0 ${isLight ? 'text-gray-400' : 'text-white/30'}`} />
        </motion.button>
      )}

      {/* Water Intake Tracker */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.22 }}
        className={`rounded-2xl p-4 ${isLight ? 'bg-white shadow-sm' : 'bg-white/[0.04]'}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-400" />
            <h3 className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-gray-500' : 'text-white/40'}`}>
              Water Intake
            </h3>
          </div>
          <span className={`text-[10px] font-semibold ${isLight ? 'text-gray-400' : 'text-white/25'}`}>
            {waterCount}/{waterGoal} glasses
          </span>
        </div>
        <div className="flex items-center gap-1.5 mb-3">
          {Array.from({ length: waterGoal }).map((_, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{ scale: i < waterCount ? 1.1 : 1 }}
              className={`h-2.5 flex-1 rounded-full transition-all ${
                i < waterCount
                  ? 'bg-gradient-to-r from-blue-400 to-cyan-400'
                  : isLight ? 'bg-gray-100' : 'bg-white/[0.06]'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { const c = Math.max(0, waterCount - 1); setWaterCount(c); saveWater(c); }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
              isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.1]'
            }`}
          >
            −
          </button>
          <button
            onClick={() => { const c = Math.min(waterGoal, waterCount + 1); setWaterCount(c); saveWater(c); }}
            className="flex-1 py-2 rounded-xl text-xs font-bold bg-blue-500 text-white hover:bg-blue-600 transition-all active:scale-95"
          >
            + Add Glass
          </button>
        </div>
      </motion.div>

      {/* Focus Now Card */}
      {focusTask && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className={`rounded-3xl p-4 sm:p-5 overflow-hidden relative ${
            isLight
              ? 'bg-gradient-to-br from-[#c8ff00]/10 via-white to-white shadow-sm border border-[#c8ff00]/20'
              : 'bg-gradient-to-br from-[#c8ff00]/8 via-white/[0.04] to-white/[0.02] border border-[#c8ff00]/15'
          }`}
        >
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#c8ff00]/8 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-[#c8ff00]/15 flex items-center justify-center">
                <Target className="w-3.5 h-3.5 text-[#c8ff00]" />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${isLight ? 'text-gray-500' : 'text-white/40'}`}>
                Focus Now
              </span>
              {checkOverdue(focusTask.dueDate, focusTask.completed) && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[9px] font-bold uppercase">
                  Overdue
                </span>
              )}
            </div>

            <div className="flex items-start gap-3">
              <div className={`w-1 h-full min-h-[40px] rounded-full shrink-0 ${PRIORITY_COLORS[focusTask.priority].bg}`} />
              <div className="flex-1 min-w-0">
                <h3 className={`text-base sm:text-lg font-bold tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {focusTask.title}
                </h3>
                {focusTask.description && (
                  <p className={`text-xs mt-1 line-clamp-1 ${isLight ? 'text-gray-400' : 'text-white/35'}`}>
                    {focusTask.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[10px] font-semibold ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
                    {focusTask.estimatedMinutes || 30}min
                  </span>
                  {focusTask.subtasks.length > 0 && (
                    <span className={`text-[10px] font-semibold ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
                      {focusTask.subtasks.filter(s => s.completed).length}/{focusTask.subtasks.length} subtasks
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onNavigateToView('tasks')}
                className="shrink-0 w-10 h-10 rounded-xl bg-[#c8ff00] flex items-center justify-center text-[#0a0a0a] shadow-[0_2px_12px_rgba(200,255,0,0.3)] active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Weekly Progress Dots */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.28 }}
        className={`rounded-2xl p-4 ${isLight ? 'bg-white shadow-sm' : 'bg-white/[0.04]'}`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-gray-500' : 'text-white/40'}`}>
            This Week
          </h3>
          <span className={`text-[10px] font-semibold ${isLight ? 'text-gray-400' : 'text-white/25'}`}>
            {weeklyDots.filter(d => d.count > 0).length}/7 active days
          </span>
        </div>
        <div className="flex items-end justify-between gap-2">
          {weeklyDots.map((dot) => {
            const maxCount = Math.max(...weeklyDots.map(d => d.count), 1);
            const height = dot.count > 0 ? Math.max(20, (dot.count / maxCount) * 48) : 6;
            return (
              <div key={dot.date} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`w-full max-w-[24px] rounded-full transition-all ${
                    dot.count > 0
                      ? 'bg-gradient-to-t from-[#c8ff00] to-[#b8f000]'
                      : isLight ? 'bg-gray-100' : 'bg-white/[0.06]'
                  } ${dot.isToday ? 'ring-2 ring-[#c8ff00]/30' : ''}`}
                  style={{ height: `${height}px` }}
                />
                <span className={`text-[9px] font-semibold ${dot.isToday ? (isLight ? 'text-gray-900' : 'text-white') : isLight ? 'text-gray-400' : 'text-white/25'}`}>
                  {dot.label}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Daily Tip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className={`rounded-2xl p-4 ${isLight ? 'bg-white shadow-sm' : 'bg-white/[0.04]'}`}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
              {dailyTip.icon} {dailyTip.title}
            </p>
            <p className={`text-xs font-medium mt-1 leading-relaxed ${isLight ? 'text-gray-600' : 'text-white/50'}`}>
              {dailyTip.tip}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.32 }}
          className={`rounded-2xl p-4 ${isLight ? 'bg-white shadow-sm' : 'bg-white/[0.04]'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <h3 className={`text-sm font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Upcoming
              </h3>
            </div>
            <button
              onClick={() => onNavigateToView('tasks')}
              className={`text-[10px] font-semibold ${isLight ? 'text-gray-400 hover:text-gray-600' : 'text-white/30 hover:text-white/50'}`}
            >
              View All →
            </button>
          </div>
          <div className="space-y-1.5">
            {upcomingTasks.map((task) => {
              const isToday = task.dueDate.slice(0, 10) === today;
              const isTomorrow = task.dueDate.slice(0, 10) === new Date(now.getTime() + 86400000).toISOString().slice(0, 10);
              const relativeDate = isToday ? 'Today' : isTomorrow ? 'Tomorrow' :
                new Date(task.dueDate).toLocaleDateString('en', { weekday: 'short' });
              const pc = PRIORITY_COLORS[task.priority];

              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-all group ${
                    isLight ? 'hover:bg-gray-50' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${pc.bg}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${isLight ? 'text-gray-800' : 'text-white/80'}`}>
                      {task.title}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold shrink-0 ${
                    isToday ? 'text-amber-400' : isLight ? 'text-gray-400' : 'text-white/25'
                  }`}>
                    {relativeDate}
                  </span>
                  <ChevronRight className={`w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${isLight ? 'text-gray-300' : 'text-white/20'}`} />
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Fitness Quick Card */}
      {fitnessEntries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className={`rounded-2xl p-4 ${isLight ? 'bg-white shadow-sm' : 'bg-white/[0.04]'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <h3 className={`text-sm font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Fitness
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {streak > 0 && (
                <span className="text-[10px] font-bold text-orange-400">🔥 {streak}d streak</span>
              )}
              <span className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
                {thisWeekWorkouts}/{weeklyGoal} this week
              </span>
            </div>
          </div>

          <div className="mb-3">
            <div className={`h-2 rounded-full overflow-hidden ${isLight ? 'bg-gray-100' : 'bg-white/5'}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (thisWeekWorkouts / weeklyGoal) * 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
              />
            </div>
          </div>

          {fitnessEntries[0] && (
            <div
              onClick={() => onSelectWorkout(fitnessEntries[0].id)}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                isLight ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-xl">{MUSCLE_GROUP_ICONS[fitnessEntries[0].muscleGroup]}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${isLight ? 'text-gray-800' : 'text-white/80'}`}>
                  {fitnessEntries[0].exerciseName}
                </p>
                <p className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
                  {fitnessEntries[0].sets.filter(s => s.completed).length} sets · {new Date(fitnessEntries[0].date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                </p>
              </div>
              {fitnessEntries[0].mood && (
                <span className="text-lg">{MOOD_EMOJI[fitnessEntries[0].mood]}</span>
              )}
              <ChevronRight className={`w-4 h-4 ${isLight ? 'text-gray-300' : 'text-white/20'}`} />
            </div>
          )}
        </motion.div>
      )}

      {/* Task Completion Celebration Toast */}
      <AnimatePresence>
        {celebrateTask && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-sm shadow-lg shadow-green-500/30 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Task completed! 🎉
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Note (FAB) */}
      <div className="fixed bottom-24 right-5 z-40 sm:hidden">
        <button
          onClick={() => setShowQuickNote(!showQuickNote)}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${
            showQuickNote
              ? 'bg-red-500 text-white'
              : 'bg-[#c8ff00] text-[#0a0a0a] shadow-[0_2px_16px_rgba(200,255,0,0.4)]'
          }`}
        >
          {showQuickNote ? <X className="w-5 h-5" /> : <StickyNote className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {showQuickNote && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-38 right-5 left-5 z-40 p-4 rounded-2xl shadow-xl sm:hidden ${
              isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-white/10'
            }`}
          >
            <p className={`text-xs font-bold mb-2 ${isLight ? 'text-gray-700' : 'text-white/70'}`}>Quick Note</p>
            <textarea
              value={quickNoteText}
              onChange={(e) => setQuickNoteText(e.target.value)}
              placeholder="Jot something down..."
              rows={3}
              className={`w-full text-xs p-2.5 rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-[#c8ff00]/30 ${
                isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-white/5 border-white/10 text-white'
              }`}
            />
            <button
              onClick={() => {
                if (quickNoteText.trim()) {
                  try {
                    const notes = JSON.parse(localStorage.getItem('doit-quick-notes') || '[]');
                    notes.push({ text: quickNoteText, date: new Date().toISOString() });
                    localStorage.setItem('doit-quick-notes', JSON.stringify(notes.slice(-50)));
                  } catch {}
                  setQuickNoteText('');
                  setShowQuickNote(false);
                }
              }}
              className="mt-2 w-full py-2 rounded-xl bg-[#c8ff00] text-[#0a0a0a] text-xs font-bold active:scale-95 transition-all"
            >
              Save Note
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Activity */}
      {recentCompleted.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.38 }}
          className={`rounded-2xl p-4 ${isLight ? 'bg-white shadow-sm' : 'bg-white/[0.04]'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <h3 className={`text-sm font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Recently Done
              </h3>
            </div>
          </div>
          <div className="space-y-1.5">
            {recentCompleted.map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 p-2 rounded-xl ${isLight ? 'bg-green-50/50' : 'bg-green-500/[0.03]'}`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                <p className={`text-xs font-medium flex-1 truncate line-through ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
                  {task.title}
                </p>
                <span className={`text-[9px] font-semibold shrink-0 ${isLight ? 'text-gray-300' : 'text-white/15'}`}>
                  {task.completedAt ? new Date(task.completedAt).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' }) : ''}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Streak & Achievements Summary */}
      {completedTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className={`rounded-2xl p-4 ${isLight ? 'bg-white shadow-sm' : 'bg-white/[0.04]'}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <h3 className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-gray-500' : 'text-white/40'}`}>
              Your Stats
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className={`text-center p-2.5 rounded-xl ${isLight ? 'bg-gray-50' : 'bg-white/[0.03]'}`}>
              <p className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{completedTasks.length}</p>
              <p className={`text-[9px] font-semibold ${isLight ? 'text-gray-400' : 'text-white/30'}`}>Total Done</p>
            </div>
            <div className={`text-center p-2.5 rounded-xl ${isLight ? 'bg-gray-50' : 'bg-white/[0.03]'}`}>
              <p className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{streak}</p>
              <p className={`text-[9px] font-semibold ${isLight ? 'text-gray-400' : 'text-white/30'}`}>Day Streak</p>
            </div>
            <div className={`text-center p-2.5 rounded-xl ${isLight ? 'bg-gray-50' : 'bg-white/[0.03]'}`}>
              <p className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{totalWorkoutsLogged}</p>
              <p className={`text-[9px] font-semibold ${isLight ? 'text-gray-400' : 'text-white/30'}`}>Workouts</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {tasks.length === 0 && fitnessEntries.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className={`text-center py-16 rounded-3xl ${isLight ? 'bg-white shadow-sm' : 'bg-white/[0.04]'}`}
        >
          <img src="/logo1.jpg" alt="DoIT" className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4 shadow-lg" />
          <p className={`text-base font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Welcome to DoIT</p>
          <p className={`text-xs mt-1.5 max-w-[240px] mx-auto ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
            Your personal task & fitness command center. Start by creating your first task.
          </p>
          <button
            onClick={onNewTask}
            className="mt-5 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#c8ff00] to-[#b8f000] text-[#0a0a0a] font-bold text-xs shadow-[0_2px_12px_rgba(200,255,0,0.3)] active:scale-95 transition-all"
          >
            Create First Task
          </button>
        </motion.div>
      )}
    </div>
  );
};
