import React, { useState, useEffect } from 'react';
import { Priority, RecurringType, Category } from '../types';
import { 
  Plus, 
  Sparkles, 
  Calendar, 
  Repeat, 
  Flag, 
  Folder, 
  Mail, 
  Clock, 
  ArrowRight,
  Zap
} from 'lucide-react';
import { haptic } from '../utils/haptics';
import { formatISODateInput } from '../utils/dateHelpers';

interface QuickAddBarProps {
  categories: Category[];
  theme: 'dark' | 'light';
  onAddTask: (data: {
    title: string;
    priority: Priority;
    categoryId: string;
    dueDate: string;
    recurringType: RecurringType;
    reminderEmail?: string;
  }) => void;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({
  categories,
  theme,
  onAddTask
}) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('high');
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || 'cat-work');
  const [recurringType, setRecurringType] = useState<RecurringType>('none');
  const [dueOption, setDueOption] = useState<'today' | 'tomorrow' | 'nextWeek' | 'custom'>('today');
  const [customDate, setCustomDate] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync categoryId when categories prop changes (e.g., from Firestore)
  useEffect(() => {
    if (categories.length > 0 && !categories.find(c => c.id === categoryId)) {
      setCategoryId(categories[0].id);
    }
  }, [categories]);

  const getComputedDueDate = (): string => {
    const now = new Date();
    if (dueOption === 'today') {
      now.setHours(18, 0, 0, 0); // 6 PM today
      return formatISODateInput(now);
    } else if (dueOption === 'tomorrow') {
      now.setDate(now.getDate() + 1);
      now.setHours(12, 0, 0, 0); // 12 PM tomorrow
      return formatISODateInput(now);
    } else if (dueOption === 'nextWeek') {
      now.setDate(now.getDate() + 7);
      now.setHours(9, 0, 0, 0);
      return formatISODateInput(now);
    } else if (dueOption === 'custom' && customDate) {
      return customDate;
    }
    return formatISODateInput(now);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    haptic.mediumClick();
    onAddTask({
      title: title.trim(),
      priority,
      categoryId,
      dueDate: getComputedDueDate(),
      recurringType
    });

    setTitle('');
    setIsExpanded(false);
  };

  const isLight = theme === 'light';

  return (
    <div className={`w-full rounded-3xl border transition-all overflow-hidden liquid-glass-card ${
      isLight 
        ? 'hover:border-orange-300' 
        : 'hover:border-white/20'
    }`}>
      <form onSubmit={handleSubmit} className="p-4 sm:p-5">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <Zap className="w-4 h-4" />
          </div>

          <input
            id="quick-add-input"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!isExpanded && e.target.value.length > 0) {
                setIsExpanded(true);
              }
            }}
            onFocus={() => setIsExpanded(true)}
            placeholder="Quick capture mission or task... (e.g. 'Review security audit tomorrow 5pm')"
            className={`flex-1 min-w-0 bg-transparent text-sm sm:text-base font-medium focus:outline-none ${
              isLight 
                ? 'text-slate-900 placeholder:text-slate-400' 
                : 'text-white placeholder:text-white/30'
            }`}
          />

          <button
            id="btn-quick-add-submit"
            type="submit"
            disabled={!title.trim()}
            className="shrink-0 min-h-[44px] px-4 sm:px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_2px_12px_rgba(245,158,11,0.35)] active:scale-95 transition-all cursor-pointer"
          >
            <span>Capture</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>

        {/* Quick controls expansion bar */}
        {isExpanded && (
            <div className={`mt-3.5 pt-3.5 border-t space-y-3 animate-in fade-in slide-in-from-top-1 duration-150 ${
            isLight ? 'border-white/30' : 'border-white/10'
          }`}>
            
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 text-xs">
              
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
                
                {/* Due Date Shortcut Selector */}
                <div className={`flex items-center gap-1 p-1 rounded-full px-2 border liquid-glass-pill ${
                  isLight ? '' : ''
                }`}>
                  <Clock className={`w-3.5 h-3.5 ml-1 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
                  <button
                    type="button"
                    onClick={() => { haptic.lightTap(); setDueOption('today'); }}
                    className={`flex-1 sm:flex-none px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      dueOption === 'today' 
                        ? 'bg-orange-500 text-white shadow-sm font-black' 
                        : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => { haptic.lightTap(); setDueOption('tomorrow'); }}
                    className={`flex-1 sm:flex-none px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      dueOption === 'tomorrow' 
                        ? 'bg-orange-500 text-white shadow-sm font-black' 
                        : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => { haptic.lightTap(); setDueOption('nextWeek'); }}
                    className={`flex-1 sm:flex-none px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      dueOption === 'nextWeek' 
                        ? 'bg-orange-500 text-white shadow-sm font-black' 
                        : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Next Week
                  </button>
                </div>

                {/* Priority Chips */}
                <div className={`flex items-center gap-1 p-1 rounded-full px-2 border liquid-glass-pill`}>
                  <Flag className={`w-3.5 h-3.5 ml-1 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
                  {(['urgent', 'high', 'medium', 'low'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { haptic.lightTap(); setPriority(p); }}
                      className={`flex-1 sm:flex-none px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider capitalize transition-colors cursor-pointer ${
                        priority === p 
                          ? 'bg-orange-500 text-white shadow-sm' 
                          : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-white/40 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Recurring Selector */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border liquid-glass-pill`}>
                  <Repeat className="w-3.5 h-3.5 text-orange-500" />
                  <select
                    value={recurringType}
                    onChange={(e) => {
                      haptic.lightTap();
                      setRecurringType(e.target.value as RecurringType);
                    }}
                    className={`bg-transparent text-[11px] font-bold uppercase tracking-wider focus:outline-none pr-1 cursor-pointer ${
                      isLight ? 'text-slate-700' : 'text-white/80'
                    }`}
                  >
                    <option value="none" className={isLight ? "bg-white text-slate-900" : "bg-[#111] text-white"}>No Repeat</option>
                    <option value="daily" className={isLight ? "bg-white text-slate-900" : "bg-[#111] text-white"}>Daily</option>
                    <option value="weekdays" className={isLight ? "bg-white text-slate-900" : "bg-[#111] text-white"}>Weekdays (Mon-Fri)</option>
                    <option value="weekly" className={isLight ? "bg-white text-slate-900" : "bg-[#111] text-white"}>Weekly</option>
                    <option value="monthly" className={isLight ? "bg-white text-slate-900" : "bg-[#111] text-white"}>Monthly</option>
                  </select>
                </div>

                {/* Category Selector */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border liquid-glass-pill`}>
                  <Folder className={`w-3.5 h-3.5 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
                  <select
                    value={categoryId}
                    onChange={(e) => {
                      haptic.lightTap();
                      setCategoryId(e.target.value);
                    }}
                    className={`bg-transparent text-[11px] font-bold uppercase tracking-wider focus:outline-none pr-1 cursor-pointer ${
                      isLight ? 'text-slate-700' : 'text-white/80'
                    }`}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className={isLight ? "bg-white text-slate-900" : "bg-[#111] text-white"}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className={`text-[11px] underline cursor-pointer self-end ${
                  isLight ? 'text-slate-400 hover:text-slate-700' : 'text-white/40 hover:text-white'
                }`}
              >
                Hide options
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
