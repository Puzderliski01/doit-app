import React, { useMemo } from 'react';
import { Task, UserProfile } from '../types';
import { BarChart3, TrendingUp, CheckCircle, Clock, AlertTriangle, Flame, Target } from 'lucide-react';
import { isOverdue, isDueToday } from '../utils/dateHelpers';

interface WeeklyReportProps {
  theme: 'dark' | 'light';
  tasks: Task[];
  userProfile: UserProfile;
}

export const WeeklyReport: React.FC<WeeklyReportProps> = ({
  theme,
  tasks,
  userProfile,
}) => {
  const isLight = theme === 'light';

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const completedThisWeek = tasks.filter((t) =>
      t.completed && t.completedAt && new Date(t.completedAt) >= weekAgo
    );

    const createdThisWeek = tasks.filter((t) =>
      new Date(t.createdAt) >= weekAgo
    );

    const pending = tasks.filter((t) => !t.completed);
    const overdue = tasks.filter((t) => isOverdue(t.dueDate, t.completed));

    // Tasks per day (last 7 days)
    const dailyData = Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      const dayStr = day.toDateString();
      const completed = completedThisWeek.filter((t) =>
        t.completedAt && new Date(t.completedAt).toDateString() === dayStr
      ).length;
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return { day: dayNames[day.getDay()], completed };
    });

    const maxDaily = Math.max(...dailyData.map((d) => d.completed), 1);

    // Priority breakdown
    const urgentPending = pending.filter((t) => t.priority === 'urgent').length;
    const highPending = pending.filter((t) => t.priority === 'high').length;

    // Completion rate
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      completedThisWeek: completedThisWeek.length,
      createdThisWeek: createdThisWeek.length,
      pending: pending.length,
      overdue: overdue.length,
      dailyData,
      maxDaily,
      urgentPending,
      highPending,
      completionRate,
      streak: userProfile.fitnessStats?.currentStreak || 0,
    };
  }, [tasks, userProfile]);

  return (
    <div className={`rounded-2xl border overflow-hidden liquid-glass-card ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
      <div className={`px-4 py-3 border-b flex items-center gap-2 ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
        <BarChart3 className={`w-4 h-4 ${isLight ? 'text-blue-500' : 'text-blue-400'}`} />
        <h3 className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
          Weekly Report
        </h3>
      </div>

      <div className="p-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className={`p-3 rounded-xl text-center ${isLight ? 'bg-emerald-50' : 'bg-emerald-500/10'}`}>
            <CheckCircle className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
            <p className={`text-lg font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              {stats.completedThisWeek}
            </p>
            <p className={`text-[10px] ${isLight ? 'text-emerald-600/60' : 'text-emerald-400/60'}`}>Completed</p>
          </div>
          <div className={`p-3 rounded-xl text-center ${isLight ? 'bg-blue-50' : 'bg-blue-500/10'}`}>
            <Target className="w-4 h-4 mx-auto mb-1 text-blue-500" />
            <p className={`text-lg font-bold ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>
              {stats.createdThisWeek}
            </p>
            <p className={`text-[10px] ${isLight ? 'text-blue-600/60' : 'text-blue-400/60'}`}>Created</p>
          </div>
          <div className={`p-3 rounded-xl text-center ${isLight ? 'bg-amber-50' : 'bg-amber-500/10'}`}>
            <Flame className="w-4 h-4 mx-auto mb-1 text-amber-500" />
            <p className={`text-lg font-bold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
              {stats.streak}d
            </p>
            <p className={`text-[10px] ${isLight ? 'text-amber-600/60' : 'text-amber-400/60'}`}>Streak</p>
          </div>
        </div>

        {/* Bar Chart */}
        <div className={`p-3 rounded-xl mb-4 ${isLight ? 'bg-slate-50' : 'bg-white/5'}`}>
          <p className={`text-[10px] font-semibold mb-2 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
            Tasks Completed (Last 7 days)
          </p>
          <div className="flex items-end gap-1.5 h-16">
            {stats.dailyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t transition-all duration-500"
                  style={{
                    height: `${(d.completed / stats.maxDaily) * 100}%`,
                    minHeight: d.completed > 0 ? '4px' : '1px',
                    background: isLight ? '#3b82f6' : '#60a5fa',
                    opacity: 0.3 + (d.completed / stats.maxDaily) * 0.7,
                  }}
                />
                <span className={`text-[8px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                  {d.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Warnings */}
        {stats.overdue > 0 && (
          <div className={`flex items-center gap-2 p-3 rounded-xl mb-3 ${isLight ? 'bg-red-50' : 'bg-red-500/10'}`}>
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <p className={`text-xs ${isLight ? 'text-red-600' : 'text-red-400'}`}>
              {stats.overdue} overdue task{stats.overdue !== 1 ? 's' : ''} need attention
            </p>
          </div>
        )}

        {stats.urgentPending > 0 && (
          <div className={`flex items-center gap-2 p-3 rounded-xl ${isLight ? 'bg-orange-50' : 'bg-orange-500/10'}`}>
            <Clock className="w-4 h-4 text-orange-500 shrink-0" />
            <p className={`text-xs ${isLight ? 'text-orange-600' : 'text-orange-400'}`}>
              {stats.urgentPending} urgent + {stats.highPending} high priority pending
            </p>
          </div>
        )}

        {/* Completion Rate */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Overall Completion</span>
            <span className={`text-[10px] font-bold ${isLight ? 'text-slate-700' : 'text-white/70'}`}>{stats.completionRate}%</span>
          </div>
          <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-700"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
