import { useState, KeyboardEvent } from 'react';
import { Send, ChevronDown } from 'lucide-react';
import { Category } from '../types';
import { t } from '../i18n';

interface QuickCaptureBarProps {
  theme: 'light' | 'dark';
  categories: Category[];
  isLight: boolean;
  onAddTask: (title: string, categoryId?: string, priority?: string) => void;
}

export function QuickCaptureBar({ theme, categories, isLight, onAddTask }: QuickCaptureBarProps) {
  const [title, setTitle] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState('medium');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAddTask(title.trim(), categoryId || undefined, priority);
    setTitle('');
    setExpanded(false);
    setCategoryId('');
    setPriority('medium');
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const priorities = [
    { id: 'low', color: 'bg-emerald-500', label: t('tasks.low') },
    { id: 'medium', color: 'bg-sky-500', label: t('tasks.medium') },
    { id: 'high', color: 'bg-orange-500', label: t('tasks.high') },
    { id: 'urgent', color: 'bg-red-500', label: t('tasks.urgent') },
  ];

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
      isLight
        ? 'bg-white/80 border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.04)] backdrop-blur-xl'
        : 'bg-white/[0.06] border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.15)] backdrop-blur-xl'
    }`}>
      {/* Input row */}
      <div className="flex items-center gap-2 p-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
          isLight ? 'bg-orange-100' : 'bg-orange-500/15'
        }`}>
          <Send className={`w-4 h-4 ${isLight ? 'text-orange-500' : 'text-orange-400'}`} />
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setExpanded(true)}
          onKeyDown={handleKeyDown}
          placeholder={t('tasks.newTask')}
          className={`flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}
        />
        {title.trim() && (
          <button
            onClick={handleSubmit}
            className="p-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-all cursor-pointer shadow-[0_2px_8px_rgba(249,115,22,0.3)]"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
        {!title.trim() && (
          <button
            onClick={() => setExpanded(!expanded)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Expanded options */}
      {expanded && (
        <div className={`px-3 pb-3 pt-0 border-t ${
          isLight ? 'border-slate-100' : 'border-white/5'
        }`}>
          <div className="flex items-center gap-2 mt-2.5">
            {/* Category select */}
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={`flex-1 text-xs font-medium px-3 py-2 rounded-xl border outline-none transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-orange-300'
                  : 'bg-white/5 border-white/10 text-white/70 hover:border-orange-500/30'
              }`}
            >
              <option value="">{t('tasks.selectCategory')}</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Priority pills */}
            <div className="flex gap-1">
              {priorities.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPriority(p.id)}
                  className={`w-6 h-6 rounded-full ${p.color} transition-all cursor-pointer ${
                    priority === p.id
                      ? 'ring-2 ring-white scale-110'
                      : 'opacity-40 hover:opacity-70'
                  }`}
                  title={p.label}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
