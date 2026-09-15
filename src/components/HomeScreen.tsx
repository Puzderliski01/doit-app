import React, { useMemo } from 'react';
import { 
  Trophy, 
  ChevronRight, 
  CheckSquare, 
  Clock, 
  AlertTriangle,
  Target,
  TrendingUp,
  User,
  Flame,
  Calendar,
  Zap,
  Star,
  ArrowRight,
} from 'lucide-react';
import { Task, FitnessEntry, FilterStatus } from '../types';
import { haptic } from '../utils/haptics';
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_ICONS, MUSCLE_GROUP_COLORS, getRankInfo } from '../utils/fitness';

interface HomeScreenProps {
  theme: 'dark' | 'light';
  userName?: string;
  tasks: Task[];
  fitnessEntries: FitnessEntry[];
  totalWorkoutsLogged: number;
  userProfile: { fitnessStats: { xp: number; currentStreak: number; bestStreak: number } };
  onSelectWorkout: (workoutId: string) => void;
  onNavigateToView: (view: 'tasks' | 'fitness', filter?: FilterStatus) => void;
  onNewTask: () => void;
  onLogWorkout: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  theme, 
  userName = 'there',
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

  // Task computations
  const pendingTasks = tasks.filter(t => !t.completed);
  const overdueTasks = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date());
  const todayTasks = tasks.filter(t => {
    if (t.completed || !t.dueDate) return false;
    const d = new Date(t.dueDate);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  });
  const completedToday = tasks.filter(t => {
    if (!t.completedAt) return false;
    const d = new Date(t.completedAt);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  });

  // Upcoming tasks (next 5 with deadlines, not completed, sorted by due date)
  const upcomingTasks = useMemo(() => {
    const now = new Date();
    return tasks
      .filter(t => !t.completed && t.dueDate && new Date(t.dueDate) >= now)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5);
  }, [tasks]);

  // Today's volume
  const todayVolume = useMemo(() => fitnessEntries
    .filter(e => {
      const d = new Date(e.date);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    })
    .reduce((sum, e) => sum + e.totalVolume, 0),
  [fitnessEntries]);

  // This week's sessions (Monday-Sunday)
  const weekSessions = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    return fitnessEntries.filter(e => new Date(e.date) >= monday).length;
  }, [fitnessEntries]);

  // Weekly activity data (last 7 days)
  const weeklyActivity = useMemo(() => {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      const count = fitnessEntries.filter(e => {
        const ed = new Date(e.date);
        return ed >= d && ed < nextDay;
      }).length;
      days.push({
        name: dayNames[d.getDay()],
        count,
        isToday: i === 0,
      });
    }
    return days;
  }, [fitnessEntries]);

  const maxWeekly = Math.max(...weeklyActivity.map(d => d.count), 1);

  // Activity ring progress (0-1)
  const ringProgress = useMemo(() => {
    if (totalWorkoutsLogged === 0) return 0;
    return Math.min(totalWorkoutsLogged / 5, 1);
  }, [totalWorkoutsLogged]);

  // Rank info
  const rankInfo = getRankInfo(userProfile.fitnessStats.xp);

  const statCards = [
    {
      label: 'Pending',
      value: pendingTasks.length,
      icon: <Clock className="w-4 h-4" />,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      filter: 'pending' as FilterStatus,
    },
    {
      label: 'Due Today',
      value: todayTasks.length,
      icon: <Target className="w-4 h-4" />,
      color: 'text-neon-400',
      bg: 'bg-neon-400/10',
      filter: 'today' as FilterStatus,
    },
    {
      label: 'Overdue',
      value: overdueTasks.length,
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      filter: 'overdue' as FilterStatus,
    },
    {
      label: 'Done Today',
      value: completedToday.length,
      icon: <CheckSquare className="w-4 h-4" />,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      filter: 'completed' as FilterStatus,
    },
  ];

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const now = new Date();
      const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 0) return 'Today';
      if (diff === 1) return 'Tomorrow';
      if (diff < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header with Avatar and Greeting */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
          }`}>
            <User className={`w-6 h-6 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
          </div>
          <div>
            <h1 className={`text-lg font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
              Hello {userName}!
            </h1>
            <p className={`text-xs ${isLight ? 'text-[#888]' : 'text-white/50'}`}>
              Let's crush it today
            </p>
          </div>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isLight ? 'bg-neon-400/15' : 'bg-neon-400/10'
        }`}>
          <Trophy className={`w-5 h-5 ${isLight ? 'text-neon-600' : 'text-neon-400'}`} />
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className={`flex items-center gap-3 p-3 rounded-[20px] border ${
        isLight ? 'bg-white border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.04)]' : 'bg-[#1a1a1a] border-white/[0.06]'
      }`}>
        <div className="flex-1 text-center">
          <span className={`text-lg font-bold block ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
            {userProfile.fitnessStats.currentStreak}
          </span>
          <span className={`text-[10px] font-semibold ${isLight ? 'text-[#888]' : 'text-white/50'}`}>
            🔥 Streak
          </span>
        </div>
        <div className={`w-px h-8 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />
        <div className="flex-1 text-center">
          <span className={`text-lg font-bold block ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
            {totalWorkoutsLogged}
          </span>
          <span className={`text-[10px] font-semibold ${isLight ? 'text-[#888]' : 'text-white/50'}`}>
            💪 Workouts
          </span>
        </div>
        <div className={`w-px h-8 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />
        <div className="flex-1 text-center">
          <span className={`text-lg font-bold block ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
            {tasks.filter(t => !t.completed).length}
          </span>
          <span className={`text-[10px] font-semibold ${isLight ? 'text-[#888]' : 'text-white/50'}`}>
            📋 Tasks
          </span>
        </div>
        <div className={`w-px h-8 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />
        <div className="flex-1 text-center">
          <span className={`text-lg font-bold block ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
            {weekSessions}
          </span>
          <span className={`text-[10px] font-semibold ${isLight ? 'text-[#888]' : 'text-white/50'}`}>
            📅 This Week
          </span>
        </div>
      </div>

      {/* Task Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-sm font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>Your Tasks</h2>
          <button 
            onClick={() => { haptic.lightTap(); onNavigateToView('tasks'); }}
            className={`text-xs font-semibold flex items-center gap-0.5 ${isLight ? 'text-neon-600' : 'text-neon-400'}`}
          >
            View all <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((card) => (
            <div 
              key={card.label}
              onClick={() => { haptic.lightTap(); onNavigateToView('tasks', card.filter); }}
              className={`p-4 rounded-[20px] border cursor-pointer transition-all active:scale-[0.98] ${
                isLight 
                  ? 'bg-white border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.04)]' 
                  : 'bg-[#1a1a1a] border-white/[0.06]'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${card.bg}`}>
                <span className={card.color}>{card.icon}</span>
              </div>
              <span className={`text-2xl font-bold block ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                {card.value}
              </span>
              <span className={`text-[11px] font-semibold ${isLight ? 'text-[#888]' : 'text-white/50'}`}>
                {card.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className={`text-sm font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>Upcoming</h2>
            <button 
              onClick={() => { haptic.lightTap(); onNavigateToView('tasks'); }}
              className={`text-xs font-semibold flex items-center gap-0.5 ${isLight ? 'text-neon-600' : 'text-neon-400'}`}
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className={`rounded-[20px] border overflow-hidden ${
            isLight ? 'bg-white border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.04)]' : 'bg-[#1a1a1a] border-white/[0.06]'
          }`}>
            {upcomingTasks.map((task, i) => (
              <button
                key={task.id}
                onClick={() => { haptic.lightTap(); onNavigateToView('tasks'); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all active:scale-[0.98] cursor-pointer ${
                  i !== upcomingTasks.length - 1 ? (isLight ? 'border-b border-black/[0.04]' : 'border-b border-white/[0.06]') : ''
                }`}
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${getPriorityColor(task.priority)}`} />
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-semibold truncate ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                    {task.title}
                  </h4>
                  {task.dueDate && (
                    <p className={`text-[11px] ${isLight ? 'text-[#888]' : 'text-white/50'}`}>
                      {formatDate(task.dueDate)}
                    </p>
                  )}
                </div>
                <ArrowRight className={`w-4 h-4 shrink-0 ${isLight ? 'text-slate-300' : 'text-white/20'}`} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fitness Overview + Weekly Activity */}
      <div className={`p-4 rounded-[20px] border ${
        isLight ? 'bg-white border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.04)]' : 'bg-[#1a1a1a] border-white/[0.06]'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-sm font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>This Week</h2>
          <button 
            onClick={() => { haptic.lightTap(); onNavigateToView('fitness'); }}
            className={`text-xs font-semibold flex items-center gap-0.5 ${isLight ? 'text-neon-600' : 'text-neon-400'}`}
          >
            See all <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Weekly Bar Chart */}
        <div className="flex items-end justify-between gap-1.5 mb-4">
          {weeklyActivity.map((day) => (
            <div key={day.name} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full rounded-md transition-all duration-500 ${
                day.count > 0
                  ? day.isToday
                    ? 'bg-neon-400'
                    : isLight ? 'bg-neon-400/40' : 'bg-neon-400/30'
                  : isLight ? 'bg-slate-100' : 'bg-white/5'
              }`} style={{ height: `${Math.max(day.count / maxWeekly * 48, 4)}px` }} />
              <span className={`text-[9px] font-medium ${
                day.isToday 
                  ? isLight ? 'text-neon-600 font-bold' : 'text-neon-400 font-bold'
                  : isLight ? 'text-[#888]' : 'text-white/40'
              }`}>
                {day.name}
              </span>
            </div>
          ))}
        </div>

        {/* Fitness Stats Row */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2">
            <div className="relative w-14 h-14 shrink-0">
              <svg width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" strokeWidth="4" 
                  className={isLight ? 'stroke-[#f0f0f0]' : 'stroke-[#2a2a2a]'} />
                <circle cx="28" cy="28" r="24" fill="none" strokeWidth="4" strokeLinecap="round"
                  stroke="#c8ff00"
                  className="rotate-[-90deg] origin-center transition-all duration-700"
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  strokeDashoffset={`${2 * Math.PI * 24 * (1 - ringProgress)}`} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Flame className={`w-4 h-4 ${totalWorkoutsLogged > 0 ? 'text-neon-400' : isLight ? 'text-slate-300' : 'text-white/20'}`} />
              </div>
            </div>
            <div>
              <span className={`text-xs font-bold block ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                {totalWorkoutsLogged} / 5
              </span>
              <span className={`text-[10px] ${isLight ? 'text-[#888]' : 'text-white/50'}`}>
                weekly goal
              </span>
            </div>
          </div>
          <div className={`w-px h-10 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />
          <div className="flex-1">
            <span className={`text-xs font-bold block ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
              {todayVolume > 0 ? `${todayVolume.toLocaleString()} kg` : '0 kg'}
            </span>
            <span className={`text-[10px] ${isLight ? 'text-[#888]' : 'text-white/50'}`}>
              today's volume
            </span>
          </div>
          <div className={`w-px h-10 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="text-sm">{rankInfo.icon}</span>
              <span className={`text-xs font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                {rankInfo.label}
              </span>
            </div>
            <span className={`text-[10px] ${isLight ? 'text-[#888]' : 'text-white/50'}`}>
              rank
            </span>
          </div>
        </div>
      </div>

      {/* Empty State - only when no tasks AND no workouts */}
      {tasks.length === 0 && fitnessEntries.length === 0 && (
        <div className={`p-6 rounded-[20px] border text-center ${
          isLight ? 'bg-white border-black/[0.04]' : 'bg-[#1a1a1a] border-white/[0.06]'
        }`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
            isLight ? 'bg-neon-400/15' : 'bg-neon-400/10'
          }`}>
            <TrendingUp className={`w-7 h-7 ${isLight ? 'text-neon-600' : 'text-neon-400'}`} />
          </div>
          <h3 className={`text-sm font-bold mb-1 ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
            Ready to get started?
          </h3>
          <p className={`text-xs ${isLight ? 'text-[#888]' : 'text-white/50'}`}>
            Tap the + button below to create your first task or log a workout
          </p>
        </div>
      )}
    </div>
  );
};
