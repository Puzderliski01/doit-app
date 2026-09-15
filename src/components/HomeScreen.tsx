import React from 'react';
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
import { Task } from '../types';
import { haptic } from '../utils/haptics';

interface HomeScreenProps {
  theme: 'dark' | 'light';
  userName?: string;
  tasks: Task[];
  totalWorkoutsLogged: number;
  onSelectWorkout: (workoutId: string) => void;
  onNavigateToView: (view: 'tasks' | 'fitness') => void;
  onNewTask: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  theme, 
  userName = 'there',
  tasks,
  totalWorkoutsLogged,
  onSelectWorkout,
  onNavigateToView,
  onNewTask,
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

  const statCards = [
    {
      label: 'Pending',
      value: pendingTasks.length,
      icon: <Clock className="w-4 h-4" />,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Due Today',
      value: todayTasks.length,
      icon: <Target className="w-4 h-4" />,
      color: 'text-neon-400',
      bg: 'bg-neon-400/10',
    },
    {
      label: 'Overdue',
      value: overdueTasks.length,
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
    },
    {
      label: 'Done Today',
      value: completedToday.length,
      icon: <CheckSquare className="w-4 h-4" />,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
  ];

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
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
            isLight
              ? 'bg-orange-500 text-white shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:bg-orange-600'
              : 'bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.15)]'
          }`}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          New Task
        </button>
        <button
          onClick={() => { haptic.mediumClick(); onNavigateToView('fitness'); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
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
              onClick={() => { haptic.lightTap(); onNavigateToView('tasks'); }}
              className={`p-4 rounded-[20px] border cursor-pointer transition-all hover:scale-[1.02] ${
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

      {/* Fitness Summary */}
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
          {/* Activity Ring - empty state */}
          <div className="relative w-20 h-20 shrink-0">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" strokeWidth="6" 
                className={isLight ? 'stroke-[#f0f0f0]' : 'stroke-[#2a2a2a]'} />
              <circle cx="40" cy="40" r="26" fill="none" strokeWidth="6" 
                className={isLight ? 'stroke-[#f0f0f0]' : 'stroke-[#2a2a2a]'} />
              <circle cx="40" cy="40" r="18" fill="none" strokeWidth="6" 
                className={isLight ? 'stroke-[#f0f0f0]' : 'stroke-[#2a2a2a]'} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Flame className={`w-5 h-5 ${isLight ? 'text-slate-300' : 'text-white/20'}`} />
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
              <span className={`text-[11px] font-semibold ${isLight ? 'text-[#888]' : 'text-white/50'}`}>Steps</span>
              <span className={`text-xs font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                0
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold ${isLight ? 'text-[#888]' : 'text-white/50'}`}>Calories</span>
              <span className={`text-xs font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                0
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Motivational / Getting Started */}
      {tasks.length === 0 && (
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
          <p className={`text-xs mb-4 ${isLight ? 'text-[#888]' : 'text-white/50'}`}>
            Create your first task and begin your productivity journey
          </p>
          <button
            onClick={() => { haptic.mediumClick(); onNewTask(); }}
            className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-500/25 hover:bg-orange-600 active:scale-95 transition-all cursor-pointer"
          >
            Create First Task
          </button>
        </div>
      )}
    </div>
  );
};
