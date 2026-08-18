import React, { useState } from 'react';
import { Task, Category } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Check, 
  AlertCircle, 
  Plus 
} from 'lucide-react';
import { haptic } from '../utils/haptics';
import { formatDateTime, isOverdue } from '../utils/dateHelpers';

interface CalendarTimelineProps {
  tasks: Task[];
  categories: Category[];
  theme: 'dark' | 'light';
  onToggleComplete: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onOpenNewTask: () => void;
}

export const CalendarTimeline: React.FC<CalendarTimelineProps> = ({
  tasks,
  categories,
  theme,
  onToggleComplete,
  onEditTask,
  onOpenNewTask
}) => {
  const [selectedOffsetDays, setSelectedOffsetDays] = useState(0);

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + selectedOffsetDays);

  // Generate 7 days strip
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + selectedOffsetDays - 3 + i);
    return d;
  });

  const activeDate = days[3]; // Center date

  // Filter tasks for active date
  const activeDateTasks = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const taskDate = new Date(t.dueDate);
    return (
      taskDate.getFullYear() === activeDate.getFullYear() &&
      taskDate.getMonth() === activeDate.getMonth() &&
      taskDate.getDate() === activeDate.getDate()
    );
  });

  // Overdue tasks
  const overdueTasks = tasks.filter((t) => isOverdue(t.dueDate, t.completed));

  const isLight = theme === 'light';

  return (
    <div className="space-y-6">
      {/* Header Navigation */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border transition-all ${
        isLight 
          ? 'bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.04)]' 
          : 'bg-gradient-to-r from-white/[0.08] to-white/[0.02] border-white/10 backdrop-blur-xl shadow-2xl'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl border shadow-[0_0_15px_rgba(245,158,11,0.3)] ${
            isLight ? 'bg-orange-50 border-orange-200 text-orange-500' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
          }`}>
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className={`text-[10px] uppercase tracking-[0.2em] font-bold mb-0.5 ${
              isLight ? 'text-slate-400' : 'text-white/40'
            }`}>Timeline Pacing</div>
            <h2 className={`text-xl sm:text-2xl font-light tracking-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {activeDate.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              {activeDate.toLocaleDateString([], { weekday: 'long' })} &middot; {activeDateTasks.length} task{activeDateTasks.length === 1 ? '' : 's'} scheduled
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { haptic.lightTap(); setSelectedOffsetDays(0); }}
            className={`px-4 py-2 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
            }`}
          >
            Today
          </button>
          <div className={`flex items-center gap-1 p-1 rounded-full border ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
          }`}>
            <button
              onClick={() => { haptic.lightTap(); setSelectedOffsetDays(prev => prev - 1); }}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-200' : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => { haptic.lightTap(); setSelectedOffsetDays(prev => prev + 1); }}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-200' : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => { haptic.mediumClick(); onOpenNewTask(); }}
            className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-xs shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:opacity-90 active:scale-95 transition-all cursor-pointer ${
              isLight
                ? 'bg-orange-500 text-white shadow-[0_4px_14px_rgba(249,115,22,0.35)]'
                : 'bg-white text-black'
            }`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Schedule Task</span>
          </button>
        </div>
      </div>

      {/* 7-Day Interactive Horizon Strip */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((d, index) => {
          const isSelected = index === 3;
          const isToday = new Date().toDateString() === d.toDateString();
          const dayTasksCount = tasks.filter((t) => {
            if (!t.dueDate) return false;
            const taskDate = new Date(t.dueDate);
            return (
              taskDate.getFullYear() === d.getFullYear() &&
              taskDate.getMonth() === d.getMonth() &&
              taskDate.getDate() === d.getDate() &&
              !t.completed
            );
          }).length;

          return (
            <button
              key={index}
              onClick={() => {
                haptic.lightTap();
                setSelectedOffsetDays(prev => prev + (index - 3));
              }}
              className={`min-h-[72px] p-3 sm:p-4 rounded-3xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-tr from-orange-500 to-amber-300 border-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-[1.03] font-bold'
                  : isLight
                    ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
                    : 'bg-white/[0.03] border-white/5 text-white/80 hover:bg-white/[0.06] hover:border-white/10 backdrop-blur-sm'
              }`}
            >
              <span className={`text-[10px] uppercase tracking-widest ${isSelected ? 'text-black font-black' : isLight ? 'text-slate-400' : 'text-white/40'}`}>
                {d.toLocaleDateString([], { weekday: 'short' })}
              </span>
              <span className="text-xl font-bold my-1 tracking-tight">
                {d.getDate()}
              </span>
              {dayTasksCount > 0 && (
                <span className={`mt-1 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isSelected ? 'bg-black text-amber-400' : isLight ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                }`}>
                  {dayTasksCount}
                </span>
              )}
              {isToday && !isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_6px_#f59e0b] mt-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Timeline Scheduled Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`text-xs font-bold uppercase tracking-widest ${
              isLight ? 'text-slate-500' : 'text-white/50'
            }`}>
              Schedule For {activeDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </h3>
            <span className={`text-xs font-mono ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{activeDateTasks.length} items</span>
          </div>

          {activeDateTasks.length === 0 ? (
            <div className={`p-10 rounded-3xl border border-dashed text-center ${
              isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.02]'
            }`}>
              <CalendarIcon className={`w-8 h-8 mx-auto mb-2.5 ${isLight ? 'text-slate-300' : 'text-white/20'}`} />
              <p className={`text-sm font-semibold ${isLight ? 'text-slate-600' : 'text-white/60'}`}>No deadlines scheduled on this day</p>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Capture upcoming milestones to visualize your roadmap</p>
              <button
                onClick={() => { haptic.mediumClick(); onOpenNewTask(); }}
                className={`mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full border font-bold text-xs cursor-pointer transition-colors ${
                  isLight
                    ? 'border-orange-200 text-orange-600 hover:bg-orange-50'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-orange-400'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule New Task</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeDateTasks.map((task) => {
                const dueTime = new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <div
                    key={task.id}
                    className={`p-5 rounded-3xl border flex items-center justify-between gap-4 transition-all ${
                      isLight
                        ? 'border-slate-200 bg-white hover:bg-slate-50 shadow-sm hover:shadow-md'
                        : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.06] backdrop-blur-md'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <button
                        onClick={() => onToggleComplete(task)}
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs cursor-pointer transition-colors ${
                          task.completed
                            ? 'bg-emerald-500 border-emerald-400 text-black'
                            : isLight ? 'border-slate-300 hover:border-orange-500' : 'border-white/30 hover:border-orange-400'
                        }`}
                      >
                        {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                      <div onClick={() => onEditTask(task)} className="cursor-pointer">
                        <h4 className={`text-sm sm:text-base font-medium ${task.completed ? 'line-through' : ''} ${
                          task.completed
                            ? isLight ? 'text-slate-400' : 'text-white/40'
                            : isLight ? 'text-slate-900' : 'text-white'
                        }`}>
                          {task.title}
                        </h4>
                        <p className={`text-xs flex items-center gap-1.5 mt-1 font-mono ${
                          isLight ? 'text-slate-400' : 'text-white/40'
                        }`}>
                          <Clock className="w-3 h-3 text-orange-400" />
                          <span>{dueTime}</span>
                          &middot;
                          <span className={`capitalize ${isLight ? 'text-slate-500' : 'text-white/60'}`}>{task.priority} Priority</span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Overdue Attention Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>Overdue Deadlines ({overdueTasks.length})</span>
            </h3>
          </div>

          {overdueTasks.length === 0 ? (
            <div className={`p-6 rounded-3xl border text-center ${
              isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-white/[0.03] border-white/5'
            }`}>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">All Deadlines Synchronized</p>
              <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Zero overdue missions pending action</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {overdueTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onEditTask(t)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-colors ${
                    isLight
                      ? 'bg-red-50 border-red-200 hover:border-red-300'
                      : 'bg-red-500/10 border-red-500/20 hover:border-red-500/40'
                  }`}
                >
                  <h5 className={`text-xs font-semibold truncate ${isLight ? 'text-red-700' : 'text-red-300'}`}>{t.title}</h5>
                  <p className={`text-[10px] mt-1 font-mono ${isLight ? 'text-red-500' : 'text-red-400/80'}`}>
                    Deadline was: {formatDateTime(t.dueDate)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
