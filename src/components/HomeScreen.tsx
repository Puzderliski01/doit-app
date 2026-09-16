import React, { useMemo } from 'react';
import { Task, Category, FitnessEntry, UserProfile, FilterStatus } from '../types';
import {
  CheckSquare, Clock, AlertTriangle, ChevronRight, Flame, Calendar, Zap,
  Target, TrendingUp, Trophy, ArrowRight, Star, Play, Plus, Dumbbell,
  CheckCircle2, AlertCircle, Sparkles, Circle
} from 'lucide-react';
import { motion } from 'motion/react';
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

  // Task stats
  const pendingTasks = tasks.filter(t => !t.completed);
  const overdueTasks = pendingTasks.filter(t => new Date(t.dueDate) < now);
  const dueTodayTasks = pendingTasks.filter(t => t.dueDate.slice(0, 10) === today);
  const doneToday = tasks.filter(t => t.completed && t.completedAt?.slice(0, 10) === today);
  const completedTasks = tasks.filter(t => t.completed);

  // Focus task: highest priority non-completed task due today or overdue
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
    const totalDone = completedTasks.length;
    return Math.round((totalDone / tasks.length) * 100);
  }, [tasks, completedTasks]);

  // Focus time (estimated minutes for today's tasks)
  const focusMinutes = useMemo(() => {
    return [...dueTodayTasks, ...overdueTasks].reduce((sum, t) => sum + (t.estimatedMinutes || 30), 0);
  }, [dueTodayTasks, overdueTasks]);

  // Fitness stats
  const lastWorkout = fitnessEntries[0];
  const rankInfo = userProfile.fitnessStats ? getRankInfo(userProfile.fitnessStats.rank) : null;
  const weeklyGoal = userProfile.goals?.includes('endurance') ? 5 : 4;
  const thisWeekWorkouts = fitnessEntries.filter(e => {
    const d = new Date(e.date);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    return d >= startOfWeek;
  }).length;
  const streak = userProfile.fitnessStats?.currentStreak || 0;

  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getMotivationalLine = () => {
    if (overdueTasks.length > 0) return `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} need your attention`;
    if (dueTodayTasks.length > 0) return `You have ${dueTodayTasks.length} task${dueTodayTasks.length > 1 ? 's' : ''} to crush today`;
    if (pendingTasks.length === 0 && completedTasks.length > 0) return "All tasks done! You're on fire";
    if (pendingTasks.length === 0) return "Start by creating your first task";
    return `${pendingTasks.length} task${pendingTasks.length > 1 ? 's' : ''} waiting for you`;
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Hero Greeting Header with Logo */}
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
        {/* Subtle background glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#c8ff00]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-[#c8ff00]/3 rounded-full blur-2xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <img
                src="/logo1.jpg"
                alt="DoIT"
                className="w-10 h-10 rounded-xl object-cover shadow-md"
              />
              <div>
                <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {getGreeting()}, {userName || 'there'}
                </h1>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-gray-400' : 'text-white/35'}`}>
                  {now.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <p className={`text-sm font-medium ${isLight ? 'text-gray-500' : 'text-white/45'}`}>
              {getMotivationalLine()}
            </p>
          </div>

          {rankInfo && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl shrink-0 ${isLight ? 'bg-white shadow-sm' : 'bg-white/[0.06]'}`}>
              <span className="text-base">{rankInfo.icon}</span>
              <span className="text-[10px] font-bold" style={{ color: rankInfo.color }}>{rankInfo.rank}</span>
            </div>
          )}
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
            transition={{ duration: 0.3, delay: i * 0.05 }}
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

      {/* Focus Now Card */}
      {focusTask && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
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
        transition={{ duration: 0.4, delay: 0.2 }}
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
          {weeklyDots.map((dot, i) => {
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
                <span className={`text-[9px] font-semibold ${dot.isLight ? (isLight ? 'text-gray-900' : 'text-white') : isLight ? 'text-gray-400' : 'text-white/25'}`}>
                  {dot.label}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
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

      {/* Quick Workout Capture */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        onClick={onLogWorkout}
        className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all active:scale-[0.98] ${
          isLight
            ? 'bg-orange-50 border border-orange-100 hover:bg-orange-100'
            : 'bg-orange-500/[0.06] border border-orange-500/10 hover:bg-orange-500/10'
        }`}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          isLight ? 'bg-orange-100 text-orange-600' : 'bg-orange-500/15 text-orange-400'
        }`}>
          <Dumbbell className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold ${isLight ? 'text-gray-700' : 'text-white/70'}`}>
            Log a workout
          </p>
          <p className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-white/25'}`}>
            Tap to open exercise picker
          </p>
        </div>
        <ChevronRight className={`w-4 h-4 shrink-0 ${isLight ? 'text-orange-300' : 'text-orange-400/40'}`} />
      </motion.div>

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

          {/* Weekly Goal Progress */}
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

          {/* Last Workout */}
          {lastWorkout && (
            <div
              onClick={() => onSelectWorkout(lastWorkout.id)}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                isLight ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-xl">{MUSCLE_GROUP_ICONS[lastWorkout.muscleGroup]}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${isLight ? 'text-gray-800' : 'text-white/80'}`}>
                  {lastWorkout.exerciseName}
                </p>
                <p className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
                  {lastWorkout.sets.filter(s => s.completed).length} sets · {new Date(lastWorkout.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                </p>
              </div>
              {lastWorkout.mood && (
                <span className="text-lg">{MOOD_EMOJI[lastWorkout.mood]}</span>
              )}
              <ChevronRight className={`w-4 h-4 ${isLight ? 'text-gray-300' : 'text-white/20'}`} />
            </div>
          )}
        </motion.div>
      )}

      {/* Recent Activity */}
      {recentCompleted.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
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

      {/* Empty State */}
      {tasks.length === 0 && fitnessEntries.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className={`text-center py-16 rounded-3xl ${isLight ? 'bg-white shadow-sm' : 'bg-white/[0.04]'}`}
        >
          <img
            src="/logo1.jpg"
            alt="DoIT"
            className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4 shadow-lg"
          />
          <p className={`text-base font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
            Welcome to DoIT
          </p>
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
