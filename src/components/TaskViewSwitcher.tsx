import React from 'react';
import { TaskViewMode } from '../types';
import { List, LayoutGrid, Calendar, BarChart3, Sparkles } from 'lucide-react';

interface TaskViewSwitcherProps {
  view: TaskViewMode;
  onChange: (view: TaskViewMode) => void;
  theme: 'dark' | 'light';
  onShowStats: () => void;
  onShowTemplates: () => void;
}

const VIEW_OPTIONS: { id: TaskViewMode; label: string; icon: React.ReactNode }[] = [
  { id: 'list', label: 'List', icon: <List className="w-3.5 h-3.5" /> },
  { id: 'kanban', label: 'Board', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
  { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-3.5 h-3.5" /> },
];

export const TaskViewSwitcher: React.FC<TaskViewSwitcherProps> = ({
  view,
  onChange,
  theme,
  onShowStats,
  onShowTemplates,
}) => {
  const isLight = theme === 'light';

  return (
    <div className="flex items-center gap-2">
      {/* View Mode Tabs */}
      <div className={`flex gap-0.5 p-0.5 rounded-lg ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
        {VIEW_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all ${
              view === opt.id
                ? isLight
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'bg-white/10 text-amber-400'
                : isLight
                  ? 'text-slate-500 hover:text-slate-700'
                  : 'text-white/40 hover:text-white/60'
            }`}
          >
            {opt.icon}
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Stats Button */}
      <button
        onClick={onShowStats}
        className={`p-1.5 rounded-lg transition-colors ${
          isLight ? 'text-slate-400 hover:text-blue-500 hover:bg-blue-50' : 'text-white/30 hover:text-blue-400 hover:bg-blue-500/10'
        }`}
        title="Task Statistics"
      >
        <BarChart3 className="w-3.5 h-3.5" />
      </button>

      {/* Templates Button */}
      <button
        onClick={onShowTemplates}
        className={`p-1.5 rounded-lg transition-colors ${
          isLight ? 'text-slate-400 hover:text-amber-500 hover:bg-amber-50' : 'text-white/30 hover:text-amber-400 hover:bg-amber-500/10'
        }`}
        title="Task Templates"
      >
        <Sparkles className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
