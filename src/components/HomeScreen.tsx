import React, { useMemo } from 'react';
import { 
  Trophy, 
  ChevronRight, 
  CheckSquare, 
  Clock, 
  AlertTriangle,
  Plus,
  Dumbbell,
  Target,
  TrendingUp,
  User,
  Flame,
} from 'lucide-react';
import { Task, FitnessEntry, FilterStatus } from '../types';
import { haptic } from '../utils/haptics';
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_ICONS, MUSCLE_GROUP_COLORS } from '../utils/fitness';

interface HomeScreenProps {
  theme: 'dark' | 'light';
  userName?: string;
  tasks: Task[];
  fitnessEntries: FitnessEntry[];
  totalWorkoutsLogged: number;
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
  onSelectWorkout,
  onNavigateToView,
  onNewTask,
  onLogWorkout,
}) => {
  const isLight = theme === 'light';

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

  // Recent workouts (last 3)
  const recentWorkouts = useMemo(() => fitnessEntries.slice(-3).reverse(), [fitnessEntries]);

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

  // Activity ring progress (0-1)
  const ringProgress = useMemo(() => {
    if (totalWorkoutsLogged === 0) return 0;
    const target = 5;
    return Math.min(totalWorkoutsLogged / target, 1);
  }, [totalWorkoutsLogged]);

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
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
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

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => { haptic.mediumClick(); onNewTask(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] cursor-pointer ${
            isLight
              ? 'bg-orange-500 text-white shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:bg-orange-600'
              : 'bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.15)]'
          }`}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          New Task
        </button>
        <button
          onClick={() => { haptic.mediumClick(); onLogWorkout(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] cursor-pointer ${
            isLight
              ? 'bg-neon-400/15 text-neon-700 border border-neon-300 hover:bg-neon-400/25'
              : 'bg-neon-400/10 text-neon-400 border border-neon-400/20 hover:bg-neon-400/20'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          Log Workout
        </button>
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

      {/* Fitness Overview */}
      <div className={`p-4 rounded-[20px] border ${
        isLight ? 'bg-white border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.04)]' : 'bg-[#1a1a1a] border-white/[0.06]'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-sm font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>Fitness Overview</h2>
          <button 
            onClick={() => { haptic.lightTap(); onNavigateToView('fitness'); }}
            className={`text-xs font-semibold flex items-center gap-0.5 ${isLight ? 'text-neon-600' : 'text-neon-400'}`}
          >
            See all <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center gap-4">
          {/* Activity Ring - Dynamic */}
          <div className="relative w-20 h-20 shrink-0">
            <svg width="80" height="80" viewBox="0 0 80 80">
              {/* Background rings */}
              <circle cx="40" cy="40" r="34" fill="none" strokeWidth="6" 
                className={isLight ? 'stroke-[#f0f0f0]' : 'stroke-[#2a2a2a]'} />
              <circle cx="40" cy="40" r="26" fill="none" strokeWidth="6" 
                className={isLight ? 'stroke-[#f0f0f0]' : 'stroke-[#2a2a2a]'} />
              <circle cx="40" cy="40" r="18" fill="none" strokeWidth="6" 
                className={isLight ? 'stroke-[#f0f0f0]' : 'stroke-[#2a2a2a]'} />
              {/* Progress rings */}
              <circle cx="40" cy="40" r="34" fill="none" strokeWidth="6" strokeLinecap="round"
                stroke="#c8ff00"
                className="rotate-[-90deg] origin-center transition-all duration-700"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - ringProgress)}`} />
              <circle cx="40" cy="40" r="26" fill="none" strokeWidth="6" strokeLinecap="round"
                stroke="#22c55e"
                className="rotate-[-90deg] origin-center transition-all duration-700"
                strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={`${2 * Math.PI * 26 * (1 - Math.min(weekSessions / 3, 1))}`} />
              <circle cx="40" cy="40" r="18" fill="none" strokeWidth="6" strokeLinecap="round"
                stroke="#3b82f6"
                className="rotate-[-90deg] origin-center transition-all duration-700"
                strokeDasharray={`${2 * Math.PI * 18}`}
                strokeDashoffset={`${2 * Math.PI * 18 * (1 - Math.min(todayVolume / 5000, 1))}`} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Flame className={`w-5 h-5 ${totalWorkoutsLogged > 0 ? 'text-neon-400' : isLight ? 'text-slate-300' : 'text-white/20'}`} />
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold ${isLight ? 'text-[#888]' : 'text-white/50'}`}>Workouts</span>
              <span className={`text-xs font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                {totalWorkoutsLogged}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold ${isLight ? 'text-[#888]' : 'text-white/50'}`}>Today's Volume</span>
              <span className={`text-xs font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                {todayVolume > 0 ? `${todayVolume.toLocaleString()} kg` : '0 kg'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold ${isLight ? 'text-[#888]' : 'text-white/50'}`}>This Week</span>
              <span className={`text-xs font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                {weekSessions} sessions
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Workouts */}
      {recentWorkouts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className={`text-sm font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>Recent Workouts</h2>
            <button 
              onClick={() => { haptic.lightTap(); onNavigateToView('fitness'); }}
              className={`text-xs font-semibold flex items-center gap-0.5 ${isLight ? 'text-neon-600' : 'text-neon-400'}`}
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {recentWorkouts.map((workout) => (
              <button
                key={workout.id}
                onClick={() => { haptic.lightTap(); onSelectWorkout(workout.id); }}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all active:scale-[0.98] cursor-pointer ${
                  isLight
                    ? 'bg-white border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]'
                    : 'bg-[#1a1a1a] border border-white/[0.06] hover:border-white/[0.12]'
                }`}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: `${MUSCLE_GROUP_COLORS[workout.muscleGroup]}15` }}
                >
                  {MUSCLE_GROUP_ICONS[workout.muscleGroup]}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-bold truncate ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                    {workout.exerciseName}
                  </h4>
                  <p className={`text-xs ${isLight ? 'text-[#888]' : 'text-white/50'}`}>
                    {workout.sets.filter(s => s.completed).length} sets · {workout.totalVolume.toLocaleString()} kg
                  </p>
                </div>
                <div className={`text-xs shrink-0 ${isLight ? 'text-[#888]' : 'text-white/40'}`}>
                  {formatDate(workout.date)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

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
            Use the buttons above to create your first task or log a workout
          </p>
        </div>
      )}
    </div>
  );
};
