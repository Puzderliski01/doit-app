import React, { useState, useEffect, useRef } from 'react';
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
  Zap,
  ChevronDown,
  X,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  onOpenFullModal?: () => void;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; ring: string; lightBg: string }> = {
  urgent: { label: 'Urgent', color: '#ef4444', ring: 'ring-red-500/40', lightBg: 'bg-red-50 text-red-600' },
  high: { label: 'High', color: '#f97316', ring: 'ring-orange-500/40', lightBg: 'bg-orange-50 text-orange-600' },
  medium: { label: 'Medium', color: '#3b82f6', ring: 'ring-blue-500/40', lightBg: 'bg-blue-50 text-blue-600' },
  low: { label: 'Low', color: '#22c55e', ring: 'ring-green-500/40', lightBg: 'bg-green-50 text-green-600' },
};

export const QuickAddBar: React.FC<QuickAddBarProps> = ({
  categories,
  theme,
  onAddTask,
  onOpenFullModal,
}) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('high');
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || 'cat-work');
  const [recurringType, setRecurringType] = useState<RecurringType>('none');
  const [dueOption, setDueOption] = useState<'today' | 'tomorrow' | 'nextWeek' | 'custom'>('today');
  const [customDate, setCustomDate] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (categories.length > 0 && !categories.find(c => c.id === categoryId)) {
      setCategoryId(categories[0].id);
    }
  }, [categories]);

  const getComputedDueDate = (): string => {
    const now = new Date();
    if (dueOption === 'today') {
      now.setHours(18, 0, 0, 0);
      return formatISODateInput(now);
    } else if (dueOption === 'tomorrow') {
      now.setDate(now.getDate() + 1);
      now.setHours(12, 0, 0, 0);
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
    <motion.div
      layout
      className={`w-full rounded-2xl border transition-all overflow-hidden ${
        isLight
          ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] border-gray-100'
          : 'bg-white/[0.04] border-white/[0.06] backdrop-blur-xl'
      }`}
    >
      <form onSubmit={handleSubmit} className="p-4">
        {/* Main Input Row */}
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
            isLight
              ? 'bg-[#c8ff00]/15 text-[#7da300]'
              : 'bg-[#c8ff00]/10 text-[#c8ff00] shadow-[0_0_12px_rgba(200,255,0,0.15)]'
          }`}>
            <Zap className="w-4 h-4" />
          </div>

          <input
            ref={inputRef}
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
            placeholder="Quick capture... (e.g. 'Review audit tomorrow 5pm')"
            className={`flex-1 min-w-0 bg-transparent text-sm font-medium focus:outline-none placeholder:font-normal ${
              isLight
                ? 'text-gray-900 placeholder:text-gray-400'
                : 'text-white placeholder:text-white/25'
            }`}
          />

          {/* Priority Indicator Circle */}
          {isExpanded && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              type="button"
              onClick={() => {
                haptic.lightTap();
                const priorities: Priority[] = ['urgent', 'high', 'medium', 'low'];
                const idx = priorities.indexOf(priority);
                setPriority(priorities[(idx + 1) % 4]);
              }}
              className="shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all active:scale-90"
              style={{ borderColor: PRIORITY_CONFIG[priority].color, backgroundColor: PRIORITY_CONFIG[priority].color + '15' }}
              title={`Priority: ${priority}`}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PRIORITY_CONFIG[priority].color }} />
            </motion.button>
          )}

          <button
            id="btn-quick-add-submit"
            type="submit"
            disabled={!title.trim()}
            className="shrink-0 h-9 px-4 rounded-xl bg-gradient-to-r from-[#c8ff00] to-[#b8f000] disabled:opacity-25 disabled:cursor-not-allowed text-[#0a0a0a] font-bold text-xs flex items-center gap-1.5 shadow-[0_2px_10px_rgba(200,255,0,0.25)] active:scale-95 transition-all cursor-pointer"
          >
            <span>Add</span>
            <ArrowRight className="w-3 h-3 stroke-[3]" />
          </button>
        </div>

        {/* Expanded Controls */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className={`mt-3.5 pt-3.5 border-t space-y-3 ${isLight ? 'border-gray-100' : 'border-white/[0.06]'}`}>
                {/* Due Date + Recurring Row */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Due Date Chips */}
                  <div className={`flex items-center gap-0.5 p-0.5 rounded-xl border ${isLight ? 'bg-gray-50 border-gray-100' : 'bg-white/[0.03] border-white/[0.06]'}`}>
                    <Clock className={`w-3 h-3 ml-1.5 ${isLight ? 'text-gray-400' : 'text-white/30'}`} />
                    {(['today', 'tomorrow', 'nextWeek'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { haptic.lightTap(); setDueOption(opt); }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          dueOption === opt
                            ? 'bg-[#c8ff00] text-[#0a0a0a] shadow-sm'
                            : isLight ? 'text-gray-500 hover:text-gray-700' : 'text-white/35 hover:text-white/60'
                        }`}
                      >
                        {opt === 'nextWeek' ? 'Next Wk' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Recurring */}
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-xl border ${isLight ? 'bg-gray-50 border-gray-100' : 'bg-white/[0.03] border-white/[0.06]'}`}>
                    <Repeat className="w-3 h-3 text-cyan-400" />
                    <select
                      value={recurringType}
                      onChange={(e) => { haptic.lightTap(); setRecurringType(e.target.value as RecurringType); }}
                      className={`bg-transparent text-[10px] font-bold uppercase tracking-wider focus:outline-none cursor-pointer ${
                        isLight ? 'text-gray-600' : 'text-white/60'
                      }`}
                    >
                      <option value="none" className={isLight ? 'bg-white text-gray-900' : 'bg-[#111] text-white'}>No Repeat</option>
                      <option value="daily" className={isLight ? 'bg-white text-gray-900' : 'bg-[#111] text-white'}>Daily</option>
                      <option value="weekdays" className={isLight ? 'bg-white text-gray-900' : 'bg-[#111] text-white'}>Weekdays</option>
                      <option value="weekly" className={isLight ? 'bg-white text-gray-900' : 'bg-[#111] text-white'}>Weekly</option>
                      <option value="monthly" className={isLight ? 'bg-white text-gray-900' : 'bg-[#111] text-white'}>Monthly</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-xl border ${isLight ? 'bg-gray-50 border-gray-100' : 'bg-white/[0.03] border-white/[0.06]'}`}>
                    <Folder className={`w-3 h-3 ${isLight ? 'text-gray-400' : 'text-white/30'}`} />
                    <select
                      value={categoryId}
                      onChange={(e) => { haptic.lightTap(); setCategoryId(e.target.value); }}
                      className={`bg-transparent text-[10px] font-bold uppercase tracking-wider focus:outline-none cursor-pointer max-w-[80px] ${
                        isLight ? 'text-gray-600' : 'text-white/60'
                      }`}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id} className={isLight ? 'bg-white text-gray-900' : 'bg-[#111] text-white'}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bottom Row: More Details + Collapse */}
                <div className="flex items-center justify-between">
                  {onOpenFullModal && (
                    <button
                      type="button"
                      onClick={() => { haptic.lightTap(); onOpenFullModal(); }}
                      className={`flex items-center gap-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                        isLight ? 'text-gray-400 hover:text-[#7da300]' : 'text-white/25 hover:text-[#c8ff00]'
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      More details
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className={`text-[11px] font-semibold transition-colors cursor-pointer ${
                      isLight ? 'text-gray-400 hover:text-gray-600' : 'text-white/25 hover:text-white/50'
                    }`}
                  >
                    Collapse
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
};
