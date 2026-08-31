import React, { useState } from 'react';
import { X, Sparkles, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { haptic } from '../utils/haptics';
import { aiBreakdownTask, isAIConfigured, TaskBreakdown } from '../utils/ai';

interface TaskBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  taskTitle: string;
  taskDescription?: string;
  onApply: (subtasks: { title: string; estimatedMinutes: number; priority: 'high' | 'medium' | 'low' }[]) => void;
}

export const TaskBreakdownModal: React.FC<TaskBreakdownModalProps> = ({
  isOpen,
  onClose,
  theme,
  taskTitle,
  taskDescription,
  onApply,
}) => {
  const isLight = theme === 'light';
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TaskBreakdown | null>(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!isAIConfigured()) {
      setError('AI not configured. Add VITE_GEMINI_API_KEY to .env');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const breakdown = await aiBreakdownTask(taskTitle, taskDescription);
      setResult(breakdown);
      setSelected(new Set(breakdown.subtasks.map((_, i) => i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate breakdown');
    }
    setLoading(false);
  };

  const handleApply = () => {
    if (!result) return;
    haptic.success();
    const selectedTasks = result.subtasks.filter((_, i) => selected.has(i));
    onApply(selectedTasks);
    onClose();
    setResult(null);
    setSelected(new Set());
  };

  const toggleSelect = (index: number) => {
    haptic.lightTap();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-3xl border shadow-2xl ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#1a1a1f] border-white/10'
        }`}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>AI Task Breakdown</h2>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl cursor-pointer ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-white/5 text-white/40'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Task Info */}
          <div className={`p-3 rounded-xl mb-4 ${isLight ? 'bg-slate-50' : 'bg-white/5'}`}>
            <p className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Task</p>
            <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{taskTitle}</p>
            {taskDescription && <p className={`text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{taskDescription}</p>}
          </div>

          {!isAIConfigured() && (
            <div className="text-center py-6">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 text-amber-500" />
              <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                Add <code className="px-1 py-0.5 rounded bg-purple-500/10 text-purple-500 text-xs">VITE_GEMINI_API_KEY</code> to your .env file
              </p>
            </div>
          )}

          {!result && isAIConfigured() && !loading && (
            <button onClick={handleGenerate} className="w-full py-3 rounded-xl bg-purple-500 text-white font-bold text-sm cursor-pointer">
              Generate Breakdown
            </button>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/50'}`}>AI is breaking down your task...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-4">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                  {result.subtasks.length} subtasks · ~{result.totalEstimatedMinutes} min total
                </p>
                <button onClick={() => setSelected(new Set(result.subtasks.map((_, i) => i)))} className={`text-[10px] font-semibold cursor-pointer ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                  Select All
                </button>
              </div>

              {result.subtasks.map((sub, i) => (
                <div
                  key={i}
                  onClick={() => toggleSelect(i)}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selected.has(i)
                      ? isLight ? 'bg-purple-50 border-purple-200' : 'bg-purple-500/10 border-purple-500/20'
                      : isLight ? 'bg-white border-slate-100 opacity-50' : 'bg-white/5 border-white/5 opacity-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    selected.has(i) ? 'bg-purple-500 border-purple-500' : isLight ? 'border-slate-300' : 'border-white/20'
                  }`}>
                    {selected.has(i) && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${isLight ? 'text-slate-800' : 'text-white/80'}`}>{sub.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] flex items-center gap-1 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                        <Clock className="w-3 h-3" /> {sub.estimatedMinutes}min
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        sub.priority === 'high' ? 'bg-red-500/10 text-red-500' : sub.priority === 'medium' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
                      }`}>
                        {sub.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Tips */}
              {result.tips.length > 0 && (
                <div className={`p-3 rounded-xl ${isLight ? 'bg-amber-50' : 'bg-amber-500/10'}`}>
                  <p className={`text-[10px] font-semibold mb-1 ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>Tips</p>
                  {result.tips.map((tip, i) => (
                    <p key={i} className={`text-[10px] ${isLight ? 'text-amber-600' : 'text-amber-300/70'}`}>• {tip}</p>
                  ))}
                </div>
              )}

              <button onClick={handleApply} disabled={selected.size === 0} className="w-full py-3 rounded-xl bg-purple-500 text-white font-bold text-sm disabled:opacity-40 cursor-pointer">
                Add {selected.size} Subtask{selected.size !== 1 ? 's' : ''}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
