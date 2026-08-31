import React, { useMemo } from 'react';
import { Task } from '../types';
import { AlertTriangle, Clock, TrendingDown, AlertCircle } from 'lucide-react';
import { isOverdue, isDueToday, formatDeadlineRelative } from '../utils/dateHelpers';

interface DeadlinePredictorProps {
  theme: 'dark' | 'light';
  tasks: Task[];
}

interface Prediction {
  task: Task;
  risk: 'high' | 'medium' | 'low';
  reason: string;
  daysUntilDue: number;
}

export const DeadlinePredictor: React.FC<DeadlinePredictorProps> = ({
  theme,
  tasks,
}) => {
  const isLight = theme === 'light';

  const predictions = useMemo(() => {
    const now = new Date();
    const pending = tasks.filter((t) => !t.completed && t.dueDate);
    const preds: Prediction[] = [];

    for (const task of pending) {
      const due = new Date(task.dueDate);
      const diffMs = due.getTime() - now.getTime();
      const daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let risk: 'high' | 'medium' | 'low' = 'low';
      let reason = '';

      // Already overdue
      if (daysUntilDue < 0) {
        risk = 'high';
        reason = `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''} overdue`;
      }
      // Due today with no subtasks done
      else if (daysUntilDue === 0) {
        const completedSubs = task.subtasks?.filter((s) => s.completed).length || 0;
        const totalSubs = task.subtasks?.length || 0;
        if (totalSubs > 0 && completedSubs < totalSubs * 0.5) {
          risk = 'high';
          reason = `Due today, only ${completedSubs}/${totalSubs} subtasks done`;
        } else if (task.estimatedMinutes && task.estimatedMinutes > 60) {
          risk = 'medium';
          reason = 'Due today, needs significant time';
        } else {
          risk = 'medium';
          reason = 'Due today';
        }
      }
      // Due tomorrow
      else if (daysUntilDue === 1) {
        if (task.priority === 'urgent' || task.priority === 'high') {
          const completedSubs = task.subtasks?.filter((s) => s.completed).length || 0;
          const totalSubs = task.subtasks?.length || 0;
          if (totalSubs > 0 && completedSubs === 0) {
            risk = 'high';
            reason = 'Due tomorrow, no subtasks started';
          } else {
            risk = 'medium';
            reason = 'Due tomorrow, high priority';
          }
        } else {
          risk = 'low';
          reason = 'Due tomorrow';
        }
      }
      // Due in 2-3 days
      else if (daysUntilDue <= 3) {
        if (task.priority === 'urgent') {
          risk = 'medium';
          reason = `Due in ${daysUntilDue} days, urgent priority`;
        } else if (task.estimatedMinutes && task.estimatedMinutes > 120) {
          risk = 'medium';
          reason = `Due in ${daysUntilDue} days, needs ${Math.round(task.estimatedMinutes / 60)}h+ of work`;
        }
      }
      // Due in 4-7 days with high priority
      else if (daysUntilDue <= 7 && (task.priority === 'urgent' || task.priority === 'high')) {
        const completedSubs = task.subtasks?.filter((s) => s.completed).length || 0;
        const totalSubs = task.subtasks?.length || 0;
        if (totalSubs > 0 && completedSubs === 0) {
          risk = 'low';
          reason = `Due in ${daysUntilDue} days, subtasks not started`;
        }
      }

      if (risk !== 'low' || daysUntilDue <= 3) {
        preds.push({ task, risk, reason, daysUntilDue });
      }
    }

    return preds.sort((a, b) => {
      const riskOrder = { high: 0, medium: 1, low: 2 };
      if (riskOrder[a.risk] !== riskOrder[b.risk]) return riskOrder[a.risk] - riskOrder[b.risk];
      return a.daysUntilDue - b.daysUntilDue;
    });
  }, [tasks]);

  if (predictions.length === 0) return null;

  const riskColors = {
    high: { bg: isLight ? 'bg-red-50' : 'bg-red-500/10', text: isLight ? 'text-red-600' : 'text-red-400', border: 'border-red-500/30' },
    medium: { bg: isLight ? 'bg-amber-50' : 'bg-amber-500/10', text: isLight ? 'text-amber-600' : 'text-amber-400', border: 'border-amber-500/30' },
    low: { bg: isLight ? 'bg-blue-50' : 'bg-blue-500/10', text: isLight ? 'text-blue-600' : 'text-blue-400', border: 'border-blue-500/30' },
  };

  const riskIcons = {
    high: <AlertTriangle className="w-3.5 h-3.5" />,
    medium: <Clock className="w-3.5 h-3.5" />,
    low: <TrendingDown className="w-3.5 h-3.5" />,
  };

  return (
    <div className={`rounded-2xl border overflow-hidden liquid-glass-card ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
      <div className={`px-4 py-3 border-b flex items-center gap-2 ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
        <AlertCircle className={`w-4 h-4 ${isLight ? 'text-amber-500' : 'text-amber-400'}`} />
        <h3 className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
          Deadline Predictions
        </h3>
      </div>
      <div className="p-3 space-y-2">
        {predictions.map((pred) => {
          const colors = riskColors[pred.risk];
          return (
            <div
              key={pred.task.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${colors.bg} ${colors.border}`}
            >
              <div className={colors.text}>
                {riskIcons[pred.risk]}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate ${colors.text}`}>
                  {pred.task.title}
                </p>
                <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                  {pred.reason}
                </p>
              </div>
              <div className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${colors.text} ${colors.bg}`}>
                {pred.risk}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
