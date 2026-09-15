import React from 'react';
import { Task } from '../types';
import { getTaskStats, getPriorityDistribution } from '../utils/taskHelpers';
import { BarChart3, CheckCircle2, Clock, AlertTriangle, TrendingUp, Target, Flame, Calendar } from 'lucide-react';

interface TaskStatsProps {
  tasks: Task[];
  theme: 'dark' | 'light';
}

export const TaskStats: React.FC<TaskStatsProps> = ({ tasks, theme }) => {
  const isLight = theme === 'light';
  const stats = getTaskStats(tasks);
  const priorityDist = getPriorityDistribution(tasks);

  const statCards = [
    { label: 'Total', value: stats.total, icon: <BarChart3 className="w-3.5 h-3.5" />, color: '#6366f1' },
    { label: 'Completed', value: stats.completed, icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: '#22c55e' },
    { label: 'Pending', value: stats.pending, icon: <Clock className="w-3.5 h-3.5" />, color: '#f59e0b' },
    { label: 'Overdue', value: stats.overdue, icon: <AlertTriangle className="w-3.5 h-3.5" />, color: '#ef4444' },
  ];

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-xl p-2.5 text-center ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-white/5 border border-white/10'}`}>
            <div className="flex items-center justify-center mb-1" style={{ color: card.color }}>
              {card.icon}
            </div>
            <p className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{card.value}</p>
            <p className={`text-[9px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>{card.label}</p>
          </div>
        ))}
      </div>

      {/* Completion Rate */}
      <div className={`rounded-xl p-3 ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-white/5 border border-white/10'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-white/80'}`}>Completion Rate</span>
          </div>
          <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{stats.completionRate}%</span>
        </div>
        <div className={`h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>
      </div>

      {/* Priority Distribution */}
      <div className={`rounded-xl p-3 ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-white/5 border border-white/10'}`}>
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-white/80'}`}>Priority Distribution</span>
        </div>
        <div className="space-y-2">
          {priorityDist.map(({ priority, count, percent }) => (
            <div key={priority} className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${
                priority === 'urgent' ? 'bg-red-500' :
                priority === 'high' ? 'bg-orange-500' :
                priority === 'medium' ? 'bg-sky-500' : 'bg-emerald-500'
              }`} />
              <span className={`text-[10px] w-12 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>{priority}</span>
              <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${percent}%`,
                    background: priority === 'urgent' ? '#ef4444' :
                      priority === 'high' ? '#f97316' :
                      priority === 'medium' ? '#0ea5e9' : '#22c55e',
                  }}
                />
              </div>
              <span className={`text-[10px] w-8 text-right ${isLight ? 'text-slate-400' : 'text-white/30'}`}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Summary */}
      <div className={`rounded-xl p-3 ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-white/5 border border-white/10'}`}>
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
          <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-white/80'}`}>Quick Summary</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Due Today</span>
            <span className={`text-[10px] font-bold ${stats.dueToday > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {stats.dueToday}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Due This Week</span>
            <span className={`text-[10px] font-bold ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
              {stats.dueThisWeek}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Avg Completion Time</span>
            <span className={`text-[10px] font-bold ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
              {stats.avgCompletionTime > 0 ? `${Math.round(stats.avgCompletionTime / 60)}h` : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
