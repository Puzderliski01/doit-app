import React from 'react';
import { Task, Category, Priority } from '../types';
import { 
  Flame, 
  CalendarClock, 
  Users, 
  Coffee, 
  Plus, 
  Check, 
  Clock, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { haptic } from '../utils/haptics';
import { formatDeadlineRelative } from '../utils/dateHelpers';

interface EisenhowerMatrixProps {
  tasks: Task[];
  categories: Category[];
  theme: 'dark' | 'light';
  onToggleComplete: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onMoveQuadrant: (task: Task, isUrgent: boolean, isImportant: boolean, priority: Priority) => void;
  onOpenNewTask: () => void;
}

export const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({
  tasks,
  categories,
  theme,
  onToggleComplete,
  onEditTask,
  onMoveQuadrant,
  onOpenNewTask
}) => {
  const pendingTasks = tasks.filter(t => !t.completed);

  // Quadrant 1: Urgent & Important (Do First)
  const q1Tasks = pendingTasks.filter(t => t.priority === 'urgent' || (t.isUrgent && t.isImportant));
  
  // Quadrant 2: Important, Not Urgent (Schedule)
  const q2Tasks = pendingTasks.filter(t => (t.priority === 'high' || t.isImportant) && !q1Tasks.includes(t));
  
  // Quadrant 3: Urgent, Not Important (Delegate)
  const q3Tasks = pendingTasks.filter(t => (t.priority === 'medium' || t.isUrgent) && !q1Tasks.includes(t) && !q2Tasks.includes(t));
  
  // Quadrant 4: Not Urgent & Not Important (Eliminate / Backlog)
  const q4Tasks = pendingTasks.filter(t => !q1Tasks.includes(t) && !q2Tasks.includes(t) && !q3Tasks.includes(t));

  const isLight = theme === 'light';

  const quadrants = [
    {
      id: 'q1',
      title: 'Do First (Urgent & Important)',
      subtitle: 'Immediate critical deadlines & crisis mitigation',
      icon: <Flame className="w-5 h-5 text-red-500" />,
      tasks: q1Tasks,
      borderClass: isLight ? 'border-red-200 bg-red-50/40' : 'border-red-500/20 bg-gradient-to-b from-white/[0.05] to-white/[0.02]',
      badgeClass: isLight ? 'bg-red-100 text-red-700 border-red-200' : 'bg-red-500/10 text-red-400 border-red-500/30',
      isUrgent: true,
      isImportant: true,
      defaultPriority: 'urgent' as Priority
    },
    {
      id: 'q2',
      title: 'Schedule (Important & Not Urgent)',
      subtitle: 'Strategic architecture, deep work & personal goals',
      icon: <CalendarClock className="w-5 h-5 text-amber-500" />,
      tasks: q2Tasks,
      borderClass: isLight ? 'border-amber-200 bg-amber-50/40' : 'border-amber-500/20 bg-gradient-to-b from-white/[0.05] to-white/[0.02]',
      badgeClass: isLight ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      isUrgent: false,
      isImportant: true,
      defaultPriority: 'high' as Priority
    },
    {
      id: 'q3',
      title: 'Delegate (Urgent & Not Important)',
      subtitle: 'Quick operational tasks, requests & interruptions',
      icon: <Users className="w-5 h-5 text-sky-500" />,
      tasks: q3Tasks,
      borderClass: isLight ? 'border-sky-200 bg-sky-50/40' : 'border-sky-500/20 bg-gradient-to-b from-white/[0.05] to-white/[0.02]',
      badgeClass: isLight ? 'bg-sky-100 text-sky-700 border-sky-200' : 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      isUrgent: true,
      isImportant: false,
      defaultPriority: 'medium' as Priority
    },
    {
      id: 'q4',
      title: 'Backlog / Relax (Not Urgent & Low Priority)',
      subtitle: 'Routine errands, low-impact chores & leisure',
      icon: <Coffee className="w-5 h-5 text-emerald-500" />,
      tasks: q4Tasks,
      borderClass: isLight ? 'border-emerald-200 bg-emerald-50/40' : 'border-emerald-500/20 bg-gradient-to-b from-white/[0.05] to-white/[0.02]',
      badgeClass: isLight ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      isUrgent: false,
      isImportant: false,
      defaultPriority: 'low' as Priority
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border transition-all ${
        isLight 
          ? 'bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.04)]' 
          : 'bg-gradient-to-r from-white/[0.08] to-white/[0.02] border-white/10 backdrop-blur-xl shadow-2xl'
      }`}>
        <div>
          <div className={`text-[11px] uppercase tracking-[0.2em] font-bold mb-1 ${
            isLight ? 'text-slate-400' : 'text-white/40'
          }`}>Strategic Framework</div>
          <h2 className={`text-xl sm:text-2xl font-light tracking-tight flex items-center gap-2 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            <span>Eisenhower Decision</span>
            <span className="font-semibold text-orange-500">Matrix</span>
          </h2>
          <p className={`text-xs sm:text-sm mt-1 max-w-xl ${
            isLight ? 'text-slate-600' : 'text-white/50'
          }`}>
            Categorize cognitive load by urgency and strategic impact to unlock high-leverage flow states.
          </p>
        </div>
        <button
          onClick={() => { haptic.mediumClick(); onOpenNewTask(); }}
          className={`self-start sm:self-auto flex items-center gap-2 px-6 py-2.5 font-bold rounded-full text-xs sm:text-sm active:scale-95 transition-all cursor-pointer ${
            isLight 
              ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-[0_4px_14px_rgba(249,115,22,0.3)]' 
              : 'bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
          }`}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Matrix Task</span>
        </button>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {quadrants.map((quad) => (
          <div
            key={quad.id}
            className={`rounded-3xl border p-6 flex flex-col min-h-[340px] transition-all liquid-glass-card ${
              isLight 
                ? `${quad.borderClass}` 
                : `${quad.borderClass}`
            }`}
          >
            {/* Quadrant Header */}
            <div className={`flex items-start justify-between gap-3 mb-4 pb-3.5 border-b ${
              isLight ? 'border-slate-200/80' : 'border-white/10'
            }`}>
              <div className="flex items-center gap-3.5">
                <div className={`p-2.5 rounded-2xl border shadow-sm ${
                  isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
                }`}>
                  {quad.icon}
                </div>
                <div>
                  <h3 className={`font-semibold text-sm sm:text-base tracking-tight ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>{quad.title}</h3>
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{quad.subtitle}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${quad.badgeClass}`}>
                {quad.tasks.length}
              </span>
            </div>

            {/* Tasks in Quadrant */}
            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-96 pr-1">
              {quad.tasks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                  <div className={`w-10 h-10 rounded-full border flex items-center justify-center mb-2 ${
                    isLight ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-white/5 border-white/10 text-white/30'
                  }`}>
                    <Check className="w-5 h-5" />
                  </div>
                  <p className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-white/60'}`}>Quadrant Clear</p>
                  <p className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>No pending missions in this sector</p>
                </div>
              ) : (
                quad.tasks.map((task) => {
                  const deadline = formatDeadlineRelative(task.dueDate, task.completed);
                  return (
                    <motion.div
                      layout
                      key={task.id}
                      className={`p-4 rounded-2xl border transition-all liquid-glass-subtle`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <button
                            onClick={() => onToggleComplete(task)}
                            className={`mt-0.5 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs transition-colors shrink-0 cursor-pointer ${
                              isLight ? 'border-slate-300 hover:border-orange-500' : 'border-white/20 hover:border-orange-400'
                            }`}
                          >
                            {task.completed && <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />}
                          </button>
                          <div className="flex-1 min-w-0" onClick={() => onEditTask(task)}>
                            <h4 className={`text-xs sm:text-sm font-medium truncate cursor-pointer transition-colors ${
                              isLight ? 'text-slate-900 hover:text-orange-600' : 'text-white hover:text-orange-400'
                            }`}>
                              {task.title}
                            </h4>
                            <div className={`flex flex-wrap items-center gap-2 mt-1.5 text-[10px] font-mono uppercase tracking-wider ${
                              isLight ? 'text-slate-400' : 'text-white/40'
                            }`}>
                              {task.dueDate && (
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {deadline.text}
                                </span>
                              )}
                              {task.subtasks.length > 0 && (
                                <span>
                                  {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Move Quick Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            title="Promote / Shift quadrant"
                            onClick={() => {
                              haptic.lightTap();
                              if (quad.id === 'q1') onMoveQuadrant(task, false, true, 'high');
                              else if (quad.id === 'q2') onMoveQuadrant(task, true, false, 'medium');
                              else if (quad.id === 'q3') onMoveQuadrant(task, false, false, 'low');
                              else onMoveQuadrant(task, true, true, 'urgent');
                            }}
                            className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                              isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'text-white/30 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};
