import React from 'react';
import { Task, Category } from '../types';
import { 
  TrendingUp, 
  CheckCircle2, 
  Flame, 
  Clock, 
  AlertTriangle, 
  Award, 
  Repeat, 
  Sparkles, 
  Target,
  Zap,
  Activity
} from 'lucide-react';
import { isOverdue } from '../utils/dateHelpers';

interface AnalyticsDashboardProps {
  tasks: Task[];
  categories: Category[];
  theme: 'dark' | 'light';
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  tasks,
  categories,
  theme
}) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const overdueTasks = tasks.filter(t => isOverdue(t.dueDate, t.completed)).length;
  const recurringTasks = tasks.filter(t => t.recurring.type !== 'none').length;
  
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Calculate urgent & high count
  const urgentCount = tasks.filter(t => t.priority === 'urgent' && !t.completed).length;
  const highCount = tasks.filter(t => t.priority === 'high' && !t.completed).length;
  const mediumCount = tasks.filter(t => t.priority === 'medium' && !t.completed).length;
  const lowCount = tasks.filter(t => t.priority === 'low' && !t.completed).length;

  // Estimated focus time
  const totalEstimatedMinutes = tasks.reduce((acc, curr) => acc + (curr.estimatedMinutes || 30), 0);
  const completedMinutes = tasks.filter(t => t.completed).reduce((acc, curr) => acc + (curr.estimatedMinutes || 30), 0);
  const pendingMinutes = totalEstimatedMinutes - completedMinutes;

  // Calculate streak: consecutive days with at least 1 completed task
  const calculateStreak = (): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      const hasCompleted = tasks.some(t => t.completed && t.completedAt && t.completedAt.startsWith(dateStr));
      if (hasCompleted) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  };

  // Calculate velocity: tasks completed this week vs last week
  const calculateVelocity = (): { thisWeek: number; lastWeek: number; change: number } => {
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const thisWeekCount = tasks.filter(t => 
      t.completed && t.completedAt && new Date(t.completedAt) >= thisWeekStart
    ).length;
    
    const lastWeekCount = tasks.filter(t => 
      t.completed && t.completedAt && 
      new Date(t.completedAt) >= lastWeekStart && 
      new Date(t.completedAt) < thisWeekStart
    ).length;
    
    const change = lastWeekCount > 0 
      ? Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100)
      : thisWeekCount > 0 ? 100 : 0;
    
    return { thisWeek: thisWeekCount, lastWeek: lastWeekCount, change };
  };

  const streak = calculateStreak();
  const velocity = calculateVelocity();

  const isLight = theme === 'light';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-6 ${
        isLight
          ? 'bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.04)]'
          : 'bg-gradient-to-r from-white/[0.09] via-white/[0.04] to-transparent border-white/10 backdrop-blur-xl shadow-2xl'
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_#f59e0b]" />
            <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
              isLight ? 'text-slate-400' : 'text-white/50'
            }`}>
              System Telemetry & Performance
            </span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-light tracking-tight ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            Execution <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Velocity</span>
          </h2>
          <p className={`text-xs sm:text-sm mt-1 max-w-xl ${
            isLight ? 'text-slate-500' : 'text-white/50'
          }`}>
            Real-time milestone tracking, task velocity benchmarks, and workload distribution.
          </p>
        </div>

        {/* Streak & Health Indicator */}
        <div className={`flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-md ${
          isLight ? 'bg-orange-50 border-orange-200' : 'bg-white/5 border-white/10'
        }`}>
          <div className={`w-12 h-12 rounded-xl border text-orange-400 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)] ${
            isLight ? 'bg-orange-100 border-orange-300' : 'bg-orange-500/10 border-orange-500/30'
          }`}>
            <Flame className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className={`text-2xl font-semibold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {streak} Day{streak !== 1 ? 's' : ''}
            </div>
            <div className={`text-[10px] font-bold uppercase tracking-widest ${
              velocity.change >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {velocity.change >= 0 ? '+' : ''}{velocity.change}% vs last week
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Completion Rate */}
        <div className={`p-5 rounded-3xl border backdrop-blur-xl shadow-xl ${
          isLight ? 'bg-white border-slate-200' : 'bg-white/[0.04] border-white/10'
        }`}>
          <div className={`flex items-center justify-between mb-3 ${isLight ? 'text-slate-400' : 'text-white/50'}`}>
            <span className="text-[10px] font-bold uppercase tracking-widest">Efficiency</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-3xl sm:text-4xl font-light tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {completionRate}<span className={`text-xl font-normal ${isLight ? 'text-slate-400' : 'text-white/40'}`}>%</span>
          </div>
          <div className={`w-full h-1.5 rounded-full mt-3 overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-amber-300 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all duration-500" 
              style={{ width: `${completionRate}%` }} 
            />
          </div>
        </div>

        {/* Pending Load */}
        <div className={`p-5 rounded-3xl border backdrop-blur-xl shadow-xl ${
          isLight ? 'bg-white border-slate-200' : 'bg-white/[0.04] border-white/10'
        }`}>
          <div className={`flex items-center justify-between mb-3 ${isLight ? 'text-slate-400' : 'text-white/50'}`}>
            <span className="text-[10px] font-bold uppercase tracking-widest">Active Backlog</span>
            <Target className="w-4 h-4 text-sky-400" />
          </div>
          <div className={`text-3xl sm:text-4xl font-light tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>{pendingTasks}</div>
          <p className={`text-[10px] font-mono uppercase tracking-wider mt-2 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{urgentCount} critical urgency</p>
        </div>

        {/* Overdue Warnings */}
        <div className={`p-5 rounded-3xl border backdrop-blur-xl shadow-xl ${
          isLight ? 'bg-white border-slate-200' : 'bg-white/[0.04] border-white/10'
        }`}>
          <div className={`flex items-center justify-between mb-3 ${isLight ? 'text-slate-400' : 'text-white/50'}`}>
            <span className="text-[10px] font-bold uppercase tracking-widest">Deadline Risk</span>
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <div className={`text-3xl sm:text-4xl font-light tracking-tight ${overdueTasks > 0 ? 'text-red-400' : isLight ? 'text-slate-900' : 'text-white'}`}>
            {overdueTasks}
          </div>
          <p className={`text-[10px] font-mono uppercase tracking-wider mt-2 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
            {overdueTasks === 0 ? 'Optimal schedule pacing' : 'Rescheduling required'}
          </p>
        </div>

        {/* Focus Time */}
        <div className={`p-5 rounded-3xl border backdrop-blur-xl shadow-xl ${
          isLight ? 'bg-white border-slate-200' : 'bg-white/[0.04] border-white/10'
        }`}>
          <div className={`flex items-center justify-between mb-3 ${isLight ? 'text-slate-400' : 'text-white/50'}`}>
            <span className="text-[10px] font-bold uppercase tracking-widest">Pending Focus</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-3xl sm:text-4xl font-light tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {Math.round(pendingMinutes / 60 * 10) / 10}<span className={`text-xl font-normal ${isLight ? 'text-slate-400' : 'text-white/40'}`}>h</span>
          </div>
          <p className={`text-[10px] font-mono uppercase tracking-wider mt-2 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{completedMinutes}m completed</p>
        </div>

      </div>

      {/* Breakdown Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Priority Distribution */}
        <div className={`p-6 rounded-3xl border backdrop-blur-xl shadow-xl ${
          isLight ? 'bg-white border-slate-200' : 'bg-white/[0.04] border-white/10'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              Priority Spectrum Load
            </h3>
            <Activity className="w-4 h-4 text-orange-400" />
          </div>
          <div className="space-y-4">
            {[
              { label: 'Urgent Priority', count: urgentCount, color: 'bg-red-500', glow: 'shadow-[0_0_8px_rgba(239,68,68,0.5)]' },
              { label: 'High Priority', count: highCount, color: 'bg-orange-500', glow: 'shadow-[0_0_8px_rgba(249,115,22,0.5)]' },
              { label: 'Standard Priority', count: mediumCount, color: 'bg-sky-500', glow: 'shadow-[0_0_8px_rgba(14,165,233,0.5)]' },
              { label: 'Low Priority', count: lowCount, color: 'bg-emerald-500', glow: 'shadow-[0_0_8px_rgba(16,185,129,0.5)]' }
            ].map((p) => {
              const pct = pendingTasks > 0 ? (p.count / pendingTasks) * 100 : 0;
              return (
                <div key={p.label}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className={`font-medium ${isLight ? 'text-slate-700' : 'text-white/80'}`}>{p.label}</span>
                    <span className={`font-mono text-[11px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{p.count} tasks ({Math.round(pct)}%)</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                    <div className={`h-full ${p.color} ${p.glow} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className={`p-6 rounded-3xl border backdrop-blur-xl shadow-xl ${
          isLight ? 'bg-white border-slate-200' : 'bg-white/[0.04] border-white/10'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              List & Domain Allocation
            </h3>
            <Zap className="w-4 h-4 text-orange-400" />
          </div>
          <div className="space-y-3">
            {categories.map((cat) => {
              const count = tasks.filter(t => t.categoryId === cat.id).length;
              const catCompleted = tasks.filter(t => t.categoryId === cat.id && t.completed).length;
              const pct = count > 0 ? Math.round((catCompleted / count) * 100) : 0;
              return (
                <div key={cat.id} className={`p-3 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className={`font-medium flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </span>
                    <span className={`font-mono text-[11px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{catCompleted}/{count} done ({pct}%)</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                    <div 
                      className="h-full rounded-full transition-all duration-300" 
                      style={{ backgroundColor: cat.color, width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

