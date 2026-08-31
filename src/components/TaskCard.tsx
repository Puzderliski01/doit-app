import React, { useState } from 'react';
import { Task, Category, Priority } from '../types';
import { 
  Check, 
  Clock, 
  Repeat, 
  Flame, 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  MoreVertical, 
  Trash2, 
  Copy, 
  Edit3, 
  Mail, 
  X,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Sparkles,
  ListTodo
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { haptic } from '../utils/haptics';
import { formatDeadlineRelative, formatDateTime, isOverdue } from '../utils/dateHelpers';
import { getRecurringLabel } from '../utils/recurring';
import { RadialProgressRing } from './RadialProgressRing';

interface TaskCardProps {
  task: Task;
  category?: Category;
  theme: 'dark' | 'light';
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (task: Task) => void;
  onChangePriority: (taskId: string, priority: Priority) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onTriggerEmailReminder: (task: Task) => void;
  onAIBreakdown?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  category,
  theme,
  onToggleComplete,
  onEdit,
  onDelete,
  onDuplicate,
  onChangePriority,
  onToggleSubtask,
  onTriggerEmailReminder,
  onAIBreakdown,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const completedSubtasksCount = task.subtasks.filter(s => s.completed).length;
  const totalSubtasksCount = task.subtasks.length;
  const subtasksProgress = totalSubtasksCount > 0 ? (completedSubtasksCount / totalSubtasksCount) * 100 : 0;

  const deadlineInfo = formatDeadlineRelative(task.dueDate, task.completed);
  const overdue = isOverdue(task.dueDate, task.completed);

  const isLight = theme === 'light';

  const priorityStyles: Record<Priority, { label: string; bg: string; text: string; ring: string; dot: string; glow: string; borderColor: string }> = {
    urgent: {
      label: 'Urgent Priority',
      bg: isLight ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-500/10 text-red-400 border-red-500/20',
      text: isLight ? 'text-red-700' : 'text-red-400',
      ring: isLight ? 'border-red-200' : 'border-red-500/20',
      dot: 'bg-red-500',
      glow: isLight ? 'shadow-[0_2px_8px_rgba(239,68,68,0.25)]' : 'shadow-[5px_0_15px_rgba(239,68,68,0.4)]',
      borderColor: isLight ? '#fca5a5' : 'rgba(239,68,68,0.5)'
    },
    high: {
      label: 'High Priority',
      bg: isLight ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      text: isLight ? 'text-orange-700' : 'text-orange-400',
      ring: isLight ? 'border-orange-200' : 'border-orange-500/20',
      dot: 'bg-orange-500',
      glow: isLight ? 'shadow-[0_2px_8px_rgba(249,115,22,0.25)]' : 'shadow-[5px_0_15px_rgba(249,115,22,0.4)]',
      borderColor: isLight ? '#fdba74' : 'rgba(249,115,22,0.5)'
    },
    medium: {
      label: 'Standard Priority',
      bg: isLight ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      text: isLight ? 'text-sky-700' : 'text-sky-400',
      ring: isLight ? 'border-sky-200' : 'border-sky-500/20',
      dot: 'bg-sky-500',
      glow: isLight ? 'shadow-[0_2px_8px_rgba(14,165,233,0.2)]' : 'shadow-[5px_0_15px_rgba(14,165,233,0.3)]',
      borderColor: isLight ? '#bae6fd' : 'rgba(14,165,233,0.4)'
    },
    low: {
      label: 'Low Priority',
      bg: isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      text: isLight ? 'text-emerald-700' : 'text-emerald-400',
      ring: isLight ? 'border-emerald-200' : 'border-emerald-500/20',
      dot: 'bg-emerald-500',
      glow: isLight ? 'shadow-[0_2px_8px_rgba(16,185,129,0.2)]' : 'shadow-[5px_0_15px_rgba(16,185,129,0.3)]',
      borderColor: isLight ? '#a7f3d0' : 'rgba(16,185,129,0.4)'
    }
  };

  const currentPriorityStyle = priorityStyles[task.priority];

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.completed) {
      haptic.success();
      // Trigger confetti burst
      try {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { x, y },
          colors: ['#f59e0b', '#10b981', '#6366f1', '#f97316', '#ffffff']
        });
      } catch {}
    } else {
      haptic.lightTap();
    }
    onToggleComplete(task);
  };

  const handleSubtaskToggleInternal = (subId: string) => {
    haptic.lightTap();
    const currentSub = task.subtasks.find(s => s.id === subId);
    const willBeCompleted = !currentSub?.completed;
    
    // Check if this action completes all subtasks
    const otherCompletedCount = task.subtasks.filter(s => s.id !== subId && s.completed).length;
    const isNowAllDone = willBeCompleted && (otherCompletedCount + 1 === task.subtasks.length);

    if (isNowAllDone) {
      haptic.success();
      try {
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.7 },
          colors: ['#34d399', '#10b981', '#f59e0b', '#ffffff']
        });
      } catch {}
    }

    onToggleSubtask(task.id, subId);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`group relative p-5 sm:p-6 rounded-3xl transition-all duration-200 border-2 ${
        isLight
          ? 'bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-2xl'
          : 'bg-gradient-to-r from-white/[0.1] to-white/[0.03] backdrop-blur-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_20px_rgba(0,0,0,0.2)]'
      } ${task.completed ? (isLight ? 'opacity-60 bg-white/40' : 'opacity-55') : ''}`}
      style={{ borderColor: currentPriorityStyle.borderColor, borderRadius: '1.5rem' }}
    >
      {/* Priority accent side glow indicator — now a subtle inner glow instead of line */}
      {!task.completed && (task.priority === 'urgent' || task.priority === 'high') && (
        <div 
          className={`absolute inset-0 rounded-3xl pointer-events-none transition-all ${
            isLight ? 'shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]' : 'shadow-[inset_0_0_20px_rgba(249,115,22,0.08)]'
          }`} 
        />
      )}

      <div className="flex items-start justify-between gap-4">
          
          {/* Checkbox and Title Area */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            
            {/* Custom Interactive Circular Checkbox */}
            <button
              id={`task-check-${task.id}`}
              onClick={handleCheckboxClick}
              className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 ${
                task.completed
                  ? 'bg-emerald-500 border-2 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : task.priority === 'urgent' || task.priority === 'high'
                  ? isLight
                    ? 'border-2 border-orange-500 hover:bg-orange-50 text-orange-500'
                    : 'border-2 border-orange-500 hover:bg-orange-500/20 text-orange-400'
                  : isLight
                    ? 'border-2 border-slate-300 hover:border-slate-500 text-slate-400'
                    : 'border-2 border-white/20 hover:border-white/50 text-white/40'
              }`}
            >
              {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
            </button>

            {/* Task Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                
                {/* Title */}
                <h3 className={`font-medium text-base sm:text-xl leading-snug break-words tracking-tight ${
                  task.completed 
                    ? isLight ? 'line-through text-slate-400' : 'line-through text-white/40' 
                    : isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  {task.title}
                </h3>

                {/* Recurring indicator */}
                {task.recurring.type !== 'none' && (
                  <span 
                    title={getRecurringLabel(task.recurring)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      isLight 
                        ? 'bg-slate-100 border-slate-200 text-slate-600' 
                        : 'bg-white/5 border-white/10 text-white/50'
                    }`}
                  >
                    <Repeat className="w-3 h-3 text-orange-500" />
                    <span>{task.recurring.type}</span>
                  </span>
                )}
              </div>

              {/* Description */}
              {task.description && (
                <p className={`text-xs sm:text-sm line-clamp-2 mb-3 ${
                  isLight ? 'text-slate-600' : 'text-white/50'
                }`}>
                  {task.description}
                </p>
              )}

              {/* Badges and Metadata in Pill formatting */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1">
                
                {/* Priority Chip */}
                <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-bold text-[9px] sm:text-[10px] uppercase tracking-wider border ${currentPriorityStyle.bg} ${currentPriorityStyle.text} ${currentPriorityStyle.ring}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${currentPriorityStyle.dot}`} />
                  {currentPriorityStyle.label}
                </span>

                {/* Category Chip */}
                {category && (
                  <span 
                    className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-bold text-[9px] sm:text-[10px] uppercase tracking-wider border ${
                      isLight 
                        ? 'bg-slate-100 text-slate-700 border-slate-200' 
                        : 'bg-white/5 text-white/60 border border-white/10'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }} />
                    {category.name}
                  </span>
                )}

                {/* Deadline Tracking Badge */}
                {task.dueDate && (
                  <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-bold text-[9px] sm:text-[10px] uppercase tracking-wider border ${
                    overdue 
                      ? isLight ? 'bg-red-50 text-red-600 border-red-200 animate-pulse font-extrabold' : 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse'
                      : deadlineInfo.status === 'today'
                      ? isLight ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      : isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white/5 text-white/40 border border-white/10'
                  }`}>
                    <Clock className="w-3 h-3" />
                    <span>{deadlineInfo.text}</span>
                  </span>
                )}

                {/* Radial Progress Mini Badge (for quick scan) */}
                {totalSubtasksCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      haptic.lightTap();
                      setIsExpanded(!isExpanded);
                    }}
                    className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full border text-[9px] sm:text-[10px] font-bold transition-all cursor-pointer ${
                      isLight 
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' 
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
                    }`}
                    title="Click to toggle subtasks"
                  >
                    <RadialProgressRing 
                      completed={completedSubtasksCount} 
                      total={totalSubtasksCount} 
                      size={20} 
                      strokeWidth={2.5} 
                      showText={false}
                      isTaskCompleted={task.completed}
                      theme={theme}
                    />
                    <span>{completedSubtasksCount}/{totalSubtasksCount}</span>
                  </button>
                )}

                {/* Tags */}
                {task.tags.slice(0, 3).map((tag) => (
                  <span 
                    key={tag} 
                    className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono border ${
                      isLight 
                        ? 'text-slate-500 bg-slate-100 border-slate-200' 
                        : 'text-white/40 bg-white/5 border-white/5'
                    }`}
                  >
                    #{tag}
                  </span>
                ))}
                {task.tags.length > 3 && (
                  <span className={`text-[9px] sm:text-[10px] font-mono ${
                    isLight ? 'text-slate-400' : 'text-white/30'
                  }`}>
                    +{task.tags.length - 3}
                  </span>
                )}
              </div>

              {/* Subtasks Progress with Radial Ring */}
              {totalSubtasksCount > 0 && (
                <div className={`mt-4 pt-3.5 border-t ${isLight ? 'border-slate-100' : 'border-white/10'}`}>
                  <div className="flex items-center justify-between gap-3">
                    
                    {/* Left: Interactive Toggle Header with Radial Ring */}
                    <button
                      onClick={() => {
                        haptic.lightTap();
                        setIsExpanded(!isExpanded);
                      }}
                      className={`flex items-center gap-3 text-xs font-semibold transition-colors cursor-pointer group/subhead ${
                        isLight ? 'text-slate-800 hover:text-slate-950' : 'text-white/80 hover:text-white'
                      }`}
                    >
                      <RadialProgressRing
                        completed={completedSubtasksCount}
                        total={totalSubtasksCount}
                        size={38}
                        strokeWidth={3.5}
                        isTaskCompleted={task.completed}
                        theme={theme}
                        className="transition-transform group-hover/subhead:scale-105"
                      />
                      
                      <div className="text-left">
                        <div className={`flex items-center gap-1.5 text-xs font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          <span>Subtasks Progress</span>
                          <span className={`text-[10px] font-mono font-normal ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                            ({completedSubtasksCount} of {totalSubtasksCount})
                          </span>
                        </div>
                        <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                          {Math.round(subtasksProgress)}% completed · Click to {isExpanded ? 'collapse' : 'expand'}
                        </div>
                      </div>
                    </button>

                    {/* Right: Expand / Collapse chevron button */}
                    <button
                      onClick={() => {
                        haptic.lightTap();
                        setIsExpanded(!isExpanded);
                      }}
                      className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                        isLight 
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' 
                          : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white'
                      }`}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Expanded Subtasks List */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3.5 space-y-2 overflow-hidden"
                      >
                        {task.subtasks.map((sub) => (
                          <div 
                            key={sub.id}
                            onClick={() => handleSubtaskToggleInternal(sub.id)}
                            className={`flex items-center gap-3 p-3 px-3.5 rounded-2xl cursor-pointer transition-colors border ${
                              isLight 
                                ? 'bg-slate-50 hover:bg-slate-100/90 border-slate-200/80 text-slate-800' 
                                : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/5'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center border text-xs transition-all shrink-0 ${
                              sub.completed 
                                ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                                : isLight ? 'border-slate-300 bg-white' : 'border-white/30 bg-transparent'
                            }`}>
                              {sub.completed && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className={`text-xs select-none ${
                              sub.completed 
                                ? isLight ? 'line-through text-slate-400' : 'line-through text-white/30' 
                                : isLight ? 'text-slate-800' : 'text-white/80'
                            }`}>
                              {sub.title}
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

            </div>
          </div>

          {/* Card Right: Prominent Radial Ring & Actions Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {totalSubtasksCount > 0 && !isExpanded && (
              <RadialProgressRing
                completed={completedSubtasksCount}
                total={totalSubtasksCount}
                size={34}
                strokeWidth={3}
                isTaskCompleted={task.completed}
                theme={theme}
                onClick={(e) => {
                  e.stopPropagation();
                  haptic.lightTap();
                  setIsExpanded(true);
                }}
                className="hidden sm:inline-flex cursor-pointer"
              />
            )}

            <button
              onClick={() => { haptic.lightTap(); setShowMenu(!showMenu); }}
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all cursor-pointer ${
                showMenu
                  ? isLight ? 'bg-orange-100 text-orange-600' : 'bg-orange-500/15 text-orange-400'
                  : isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              {showMenu ? <X className="w-4 h-4" /> : <MoreVertical className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Inline Action Bar — appears below the card content when toggled */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className={`flex flex-wrap gap-2 pt-3 mt-3 border-t ${
                isLight ? 'border-slate-100' : 'border-white/10'
              }`}>
                <button
                  onClick={() => { setShowMenu(false); haptic.mediumClick(); onEdit(task); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isLight ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>

                <button
                  onClick={() => { setShowMenu(false); onTriggerEmailReminder(task); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isLight ? 'bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100' : 'bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </button>

                <button
                  onClick={() => { setShowMenu(false); haptic.lightTap(); onDuplicate(task); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isLight ? 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100' : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  Duplicate
                </button>

                {/* Priority quick-set */}
                {(['urgent', 'high', 'medium', 'low'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => { setShowMenu(false); haptic.lightTap(); onChangePriority(task.id, p); }}
                    className={`px-2.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                      task.priority === p
                        ? p === 'urgent' ? 'bg-red-500 text-white border-red-400'
                          : p === 'high' ? 'bg-orange-500 text-black border-orange-400'
                          : p === 'medium' ? 'bg-sky-500 text-white border-sky-400'
                          : 'bg-emerald-500 text-black border-emerald-400'
                        : isLight ? 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-900' : 'bg-white/5 text-white/40 border-white/10 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => { setShowMenu(false); haptic.deleteAction(); onDelete(task.id); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 dark:hover:bg-red-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>

                {onAIBreakdown && (
                  <button
                    onClick={() => { setShowMenu(false); haptic.mediumClick(); onAIBreakdown(task); }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isLight ? 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Breakdown
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </motion.div>
  );
};
