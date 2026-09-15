import React from 'react';
import { Task, Category, FitnessEntry, UserProfile, FilterStatus } from '../types';
import {
  CheckSquare, Clock, AlertTriangle, ChevronRight, Flame, Calendar, Zap,
  Target, TrendingUp, Trophy, ArrowRight, Star
} from 'lucide-react';
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_ICONS, MUSCLE_GROUP_COLORS, getRankInfo } from '../utils/fitness';

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
  const upcomingTasks = pendingTasks
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

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

  // Streak
  const streak = userProfile.fitnessStats?.currentStreak || 0;

  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Greeting Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
            {getGreeting()}, {userName || 'there'}
          </h1>
          <p className={`text-sm mt-1 ${isLight ? 'text-gray-500' : 'text-white/40'}`}>
            {now.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {rankInfo && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: `${rankInfo.color}10` }}>
            <span className="text-lg">{rankInfo.icon}</span>
            <span className="text-xs font-bold" style={{ color: rankInfo.color }}>{rankInfo.rank}</span>
          </div>
        )}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Pending', value: pendingTasks.length, icon: <CheckSquare className="w-4 h-4" />, color: '#3b82f6' },
          { label: 'Today', value: dueTodayTasks.length, icon: <Calendar className="w-4 h-4" />, color: '#f59e0b' },
          { label: 'Overdue', value: overdueTasks.length, icon: <AlertTriangle className="w-4 h-4" />, color: '#ef4444' },
          { label: 'Done', value: doneToday.length, icon: <Zap className="w-4 h-4" />, color: '#22c55e' },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={() => onNavigateToView('tasks', stat.label === 'Pending' ? 'pending' : stat.label === 'Today' ? 'today' : stat.label === 'Overdue' ? 'overdue' : 'completed')}
            className={`p-3 rounded-2xl text-left transition-all active:scale-[0.97] ${isLight ? 'bg-white shadow-sm' : 'bg-white/[0.04]'}`}
          >
            <div className="mb-2" style={{ color: stat.color }}>{stat.icon}</div>
            <p className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{stat.value}</p>
            <p className={`text-[10px] font-medium ${isLight ? 'text-gray-400' : 'text-white/30'}`}>{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <div className={`rounded-2xl p-4 ${isLight ? 'bg-white shadow-sm' : 'bg-white/[0.04]'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <h3 className={`text-sm font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Upcoming Tasks
              </h3>
            </div>
            <button
              onClick={() => onNavigateToView('tasks')}
              className={`text-[10px] font-semibold ${isLight ? 'text-gray-400 hover:text-gray-600' : 'text-white/30 hover:text-white/50'}`}
            >
              View All →
            </button>
          </div>
          <div className="space-y-2">
            {upcomingTasks.map((task) => {
              const isOverdue = new Date(task.dueDate) < now;
              const isToday = task.dueDate.slice(0, 10) === today;
              const relativeDate = isOverdue ? 'Overdue' : isToday ? 'Today' : 
                task.dueDate.slice(0, 10) === new Date(now.getTime() + 86400000).toISOString().slice(0, 10) ? 'Tomorrow' :
                new Date(task.dueDate).toLocaleDateString('en', { weekday: 'short' });

              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isLight ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white/[0.02] hover:bg-white/[0.04]'}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    task.priority === 'urgent' ? 'bg-red-500' :
                    task.priority === 'high' ? 'bg-orange-500' :
                    task.priority === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${isLight ? 'text-gray-800' : 'text-white/80'}`}>
                      {task.title}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold shrink-0 ${
                    isOverdue ? 'text-red-400' : isToday ? 'text-amber-400' : isLight ? 'text-gray-400' : 'text-white/30'
                  }`}>
                    {relativeDate}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fitness Quick Card */}
      {fitnessEntries.length > 0 && (
        <div className={`rounded-2xl p-4 ${isLight ? 'bg-white shadow-sm' : 'bg-white/[0.04]'}`}>
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
            <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-gray-100' : 'bg-white/5'}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all"
                style={{ width: `${Math.min(100, (thisWeekWorkouts / weeklyGoal) * 100)}%` }}
              />
            </div>
          </div>

          {/* Last Workout */}
          {lastWorkout && (
            <div
              className={`flex items-center gap-3 p-3 rounded-xl ${isLight ? 'bg-gray-50' : 'bg-white/[0.02]'}`}
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
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {tasks.length === 0 && fitnessEntries.length === 0 && (
        <div className={`text-center py-16 rounded-2xl ${isLight ? 'bg-white shadow-sm' : 'bg-white/[0.04]'}`}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c8ff00]/20 to-[#b8f000]/10 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-[#c8ff00]" />
          </div>
          <p className={`text-sm font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
            Welcome to DoIT
          </p>
          <p className={`text-xs mt-1 ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
            Start by creating your first task or logging a workout
          </p>
        </div>
      )}
    </div>
  );
};
