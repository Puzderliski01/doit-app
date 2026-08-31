import React, { useMemo } from 'react';
import { Task, UserProfile } from '../types';
import { Sun, CloudSun, Moon, Coffee, AlertTriangle, CheckCircle, Clock, Flame, Target, Sparkles } from 'lucide-react';
import { isOverdue, isDueToday, isDueThisWeek } from '../utils/dateHelpers';

interface DailyBriefingProps {
  theme: 'dark' | 'light';
  tasks: Task[];
  userProfile: UserProfile;
}

interface BriefingItem {
  icon: React.ReactNode;
  text: string;
  color: string;
}

export const DailyBriefing: React.FC<DailyBriefingProps> = ({
  theme,
  tasks,
  userProfile,
}) => {
  const isLight = theme === 'light';

  const briefing = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const items: BriefingItem[] = [];

    // Greeting
    if (hour < 12) {
      items.push({ icon: <Sun className="w-4 h-4" />, text: 'Good morning! Here\'s your day at a glance.', color: '#f59e0b' });
    } else if (hour < 17) {
      items.push({ icon: <CloudSun className="w-4 h-4" />, text: 'Good afternoon! Here\'s where you stand.', color: '#f97316' });
    } else {
      items.push({ icon: <Moon className="w-4 h-4" />, text: 'Good evening! Let\'s wrap up strong.', color: '#6366f1' });
    }

    const pending = tasks.filter((t) => !t.completed);
    const overdue = tasks.filter((t) => isOverdue(t.dueDate, t.completed));
    const dueToday = tasks.filter((t) => isDueToday(t.dueDate) && !t.completed);
    const dueThisWeek = tasks.filter((t) => isDueThisWeek(t.dueDate) && !t.completed);

    if (overdue.length > 0) {
      items.push({ icon: <AlertTriangle className="w-4 h-4" />, text: `${overdue.length} overdue task${overdue.length !== 1 ? 's' : ''} need your attention!`, color: '#ef4444' });
    }

    if (dueToday.length > 0) {
      const urgentToday = dueToday.filter((t) => t.priority === 'urgent' || t.priority === 'high');
      if (urgentToday.length > 0) {
        items.push({ icon: <Flame className="w-4 h-4" />, text: `${urgentToday.length} high-priority task${urgentToday.length !== 1 ? 's' : ''} due today.`, color: '#f97316' });
      } else {
        items.push({ icon: <Clock className="w-4 h-4" />, text: `${dueToday.length} task${dueToday.length !== 1 ? 's' : ''} due today.`, color: '#3b82f6' });
      }
    } else if (overdue.length === 0) {
      items.push({ icon: <CheckCircle className="w-4 h-4" />, text: 'No tasks due today. Great planning!', color: '#22c55e' });
    }

    if (dueThisWeek.length > 0 && dueToday.length > 0) {
      items.push({ icon: <Target className="w-4 h-4" />, text: `${dueThisWeek.length} task${dueThisWeek.length !== 1 ? 's' : ''} due this week in total.`, color: '#8b5cf6' });
    }

    // Productivity tip
    const completedToday = tasks.filter((t) => t.completed && t.completedAt && new Date(t.completedAt).toDateString() === now.toDateString());
    if (completedToday.length >= 5) {
      items.push({ icon: <Sparkles className="w-4 h-4" />, text: `Amazing! You've already completed ${completedToday.length} tasks today.`, color: '#22c55e' });
    } else if (completedToday.length > 0) {
      items.push({ icon: <Coffee className="w-4 h-4" />, text: `${completedToday.length} task${completedToday.length !== 1 ? 's' : ''} done today. Keep the momentum!`, color: '#3b82f6' });
    }

    // Streak
    if (userProfile.fitnessStats?.currentStreak && userProfile.fitnessStats.currentStreak > 1) {
      items.push({ icon: <Flame className="w-4 h-4" />, text: `${userProfile.fitnessStats.currentStreak}-day fitness streak. Don't break it!`, color: '#f59e0b' });
    }

    if (items.length === 1) {
      items.push({ icon: <Coffee className="w-4 h-4" />, text: 'All clear! Time to tackle new challenges.', color: '#22c55e' });
    }

    return items;
  }, [tasks, userProfile]);

  return (
    <div className={`rounded-2xl border overflow-hidden liquid-glass-card ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
      <div className={`px-4 py-3 border-b flex items-center gap-2 ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
        <Sparkles className={`w-4 h-4 ${isLight ? 'text-amber-500' : 'text-amber-400'}`} />
        <h3 className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
          Daily Briefing
        </h3>
      </div>
      <div className="p-4 space-y-3">
        {briefing.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0" style={{ color: item.color }}>
              {item.icon}
            </div>
            <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
