import React, { useState, useRef } from 'react';
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
  ListTodo,
  Star,
  Timer,
  GripVertical,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'motion/react';
import confetti from 'canvas-confetti';
import { haptic } from '../utils/haptics';
import { formatDeadlineRelative, formatDateTime, isOverdue } from '../utils/dateHelpers';
import { getRecurringLabel } from '../utils/recurring';

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
  onToggleImportant?: (taskId: string) => void;
  isSelected?: boolean;
  onSelectToggle?: (taskId: string) => void;
  bulkMode?: boolean;
}

const PRIORITY_STYLES: Record<Priority, { gradient: string; lightGradient: string; dot: string; label: string; lightLabel: string; bg: string; lightBg: string }> = {
  urgent: {
    gradient: 'from-red-500/80 to-red-600/40',
    lightGradient: 'from-red-500 to-red-400',
    dot: 'bg-red-500',
    label: 'text-red-400',
    lightLabel: 'text-red-500',
    bg: 'bg-red-500/10',
    lightBg: 'bg-red-50',
  },
  high: {
    gradient: 'from-orange-500/80 to-orange-600/40',
    lightGradient: 'from-orange-500 to-orange-400',
    dot: 'bg-orange-500',
    label: 'text-orange-400',
    lightLabel: 'text-orange-500',
    bg: 'bg-orange-500/10',
    lightBg: 'bg-orange-50',
  },
  medium: {
    gradient: 'from-blue-500/70 to-blue-600/30',
    lightGradient: 'from-blue-500 to-blue-400',
    dot: 'bg-blue-500',
    label: 'text-blue-400',
    lightLabel: 'text-blue-500',
    bg: 'bg-blue-500/10',
    lightBg: 'bg-blue-50',
  },
  low: {
    gradient: 'from-green-500/70 to-green-600/30',
    lightGradient: 'from-green-500 to-green-400',
    dot: 'bg-green-500',
    label: 'text-green-400',
    lightLabel: 'text-green-500',
    bg: 'bg-green-500/10',
    lightBg: 'bg-green-50',
  },
};

const PRIORITY_CYCLE: Priority[] = ['low', 'medium', 'high', 'urgent'];

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
  onToggleImportant,
  isSelected = false,
  onSelectToggle,
  bulkMode = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [swipeState, setSwipeState] = useState<'none' | 'complete' | 'delete'>('none');
  const constraintRef = useRef<HTMLDivElement>(null);

  const completedSubtasksCount = task.subtasks.filter(s => s.completed).length;
  const totalSubtasksCount = task.subtasks.length;
  const subtasksProgress = totalSubtasksCount > 0 ? (completedSubtasksCount / totalSubtasksCount) * 100 : 0;

  const deadlineInfo = formatDeadlineRelative(task.dueDate, task.completed);
  const overdue = isOverdue(task.dueDate, task.completed);
  const isLight = theme === 'light';
  const ps = PRIORITY_STYLES[task.priority];

  // Task age (days since creation)
  const taskAge = Math.floor((Date.now() - new Date(task.createdAt).getTime()) / 86400000);

  // Estimated time display
  const estMinutes = task.estimatedMinutes || 30;

  // Swipe handling
  const x = useMotionValue(0);
  const completeOpacity = useTransform(x, [0, 80], [0, 1]);
  const deleteOpacity = useTransform(x, [-80, 0], [1, 0]);
  const completeScale = useTransform(x, [0, 80], [0.5, 1]);
  const deleteScale = useTransform(x, [-80, 0], [1, 0.5]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 80) {
      haptic.success();
      try {
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight },
          colors: ['#c8ff00', '#f59e0b', '#10b981', '#6366f1', '#ffffff']
        });
      } catch {}
      onToggleComplete(task);
    } else if (info.offset.x < -80) {
      haptic.deleteAction();
      onDelete(task.id);
    }
    setSwipeState('none');
  };

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 40) setSwipeState('complete');
    else if (info.offset.x < -40) setSwipeState('delete');
    else setSwipeState('none');
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.completed) {
      haptic.success();
      try {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight },
          colors: ['#c8ff00', '#f59e0b', '#10b981', '#6366f1', '#ffffff']
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
    const otherCompletedCount = task.subtasks.filter(s => s.id !== subId && s.completed).length;
    const isNowAllDone = willBeCompleted && (otherCompletedCount + 1 === task.subtasks.length);

    if (isNowAllDone) {
      haptic.success();
      try {
        confetti({ particleCount: 25, spread: 45, origin: { y: 0.7 }, colors: ['#c8ff00', '#10b981', '#f59e0b', '#ffffff'] });
      } catch {}
    }
    onToggleSubtask(task.id, subId);
  };

  const handlePriorityCycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.lightTap();
    const currentIndex = PRIORITY_CYCLE.indexOf(task.priority);
    const nextPriority = PRIORITY_CYCLE[(currentIndex + 1) % PRIORITY_CYCLE.length];
    onChangePriority(task.id, nextPriority);
  };

  return (
    <motion.div
      ref={constraintRef}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, x: -20 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden"
    >
      {/* Swipe Background Indicators */}
      <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
        <motion.div
          style={{ opacity: deleteOpacity, scale: deleteScale }}
          className="flex items-center gap-2 pl-4"
        >
          <Trash2 className="w-5 h-5 text-red-400" />
          <span className="text-xs font-bold text-red-400">Delete</span>
        </motion.div>
        <motion.div
          style={{ opacity: completeOpacity, scale: completeScale }}
          className="flex items-center gap-2 pr-4"
        >
          <span className="text-xs font-bold text-green-400">Complete</span>
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        </motion.div>
      </div>

      {/* Swipeable Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={`group relative rounded-2xl transition-all duration-200 sm:hover:shadow-lg touch-pan-y ${
          isLight
            ? `bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] ${task.completed ? 'opacity-50' : ''}`
            : `bg-gradient-to-r from-white/[0.05] to-white/[0.02] backdrop-blur-3xl shadow-[0_2px_8px_rgba(0,0,0,0.12)] sm:hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] ${task.completed ? 'opacity-50' : ''}`
        } ${isSelected ? 'ring-2 ring-[#c8ff00]/50' : ''}`}
      >
        {/* Gradient Left Border */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl bg-gradient-to-b ${ps.gradient}`}
          style={isLight ? { background: `linear-gradient(to bottom, ${task.priority === 'urgent' ? '#ef4444' : task.priority === 'high' ? '#f97316' : task.priority === 'medium' ? '#3b82f6' : '#22c55e'}, transparent)` } : undefined}
        />

        <div className="p-4 pl-5">
          <div className="flex items-start gap-3.5">
            {/* Checkbox / Bulk Select */}
            {bulkMode && onSelectToggle ? (
              <button
                onClick={(e) => { e.stopPropagation(); haptic.lightTap(); onSelectToggle(task.id); }}
                className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-[#c8ff00] text-[#0a0a0a] shadow-[0_0_8px_rgba(200,255,0,0.3)]'
                    : isLight ? 'border-2 border-gray-200 hover:border-[#c8ff00]' : 'border-2 border-white/15 hover:border-[#c8ff00]/50'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
            ) : (
              <button
                id={`task-check-${task.id}`}
                onClick={handleCheckboxClick}
                className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 ${
                  task.completed
                    ? 'bg-[#22c55e] border-2 border-[#22c55e] text-white shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                    : task.priority === 'urgent' || task.priority === 'high'
                      ? `border-2 ${isLight ? 'border-orange-300 hover:bg-orange-50 text-orange-400' : 'border-orange-500/30 hover:bg-orange-500/10 text-orange-400'}`
                      : isLight
                        ? 'border-2 border-gray-200 hover:border-[#22c55e] text-gray-300 hover:text-[#22c55e]'
                        : 'border-2 border-white/15 hover:border-[#22c55e]/50 text-white/30 hover:text-[#22c55e]'
                }`}
              >
                {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
            )}

            {/* Task Info */}
            <div className="flex-1 min-w-0">
              {/* Title + Badges Row */}
              <div className="flex items-start gap-2 mb-1">
                <h3 className={`text-[15px] font-bold leading-snug break-words tracking-tight flex-1 min-w-0 ${
                  task.completed
                    ? isLight ? 'line-through text-gray-300' : 'line-through text-white/25'
                    : isLight ? 'text-gray-900' : 'text-white'
                }`}>
                  {task.title}
                </h3>

                {/* Importance Star */}
                {onToggleImportant && (
                  <button
                    onClick={(e) => { e.stopPropagation(); haptic.lightTap(); onToggleImportant(task.id); }}
                    className={`min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg transition-all cursor-pointer shrink-0 ${
                      task.isImportant
                        ? 'text-amber-400'
                        : isLight ? 'text-gray-300 hover:text-amber-400' : 'text-white/20 hover:text-amber-400'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" fill={task.isImportant ? 'currentColor' : 'none'} />
                  </button>
                )}

                {/* Action Button */}
                <button
                  onClick={() => { haptic.lightTap(); setShowMenu(!showMenu); }}
                  className={`min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg transition-all cursor-pointer shrink-0 ${
                    showMenu
                      ? 'bg-[#c8ff00]/10 text-[#c8ff00]'
                      : isLight ? 'text-gray-300 hover:text-gray-500 hover:bg-gray-50' : 'text-white/25 hover:text-white/60 hover:bg-white/[0.06]'
                  }`}
                >
                  {showMenu ? <X className="w-3.5 h-3.5" /> : <MoreVertical className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Description */}
              {task.description && (
                <p className={`text-xs line-clamp-1 mb-2 ${isLight ? 'text-gray-400' : 'text-white/35'}`}>
                  {task.description}
                </p>
              )}

              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Priority (clickable to cycle) */}
                <button
                  onClick={handlePriorityCycle}
                  title="Click to change priority"
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer hover:scale-105 ${isLight ? ps.lightLabel : ps.label}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${ps.dot}`} />
                  {task.priority}
                </button>

                {/* Category */}
                {category && (
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${isLight ? 'text-gray-400' : 'text-white/35'}`}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: category.color }} />
                    {category.name}
                  </span>
                )}

                {/* Deadline */}
                {task.dueDate && (
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                    overdue
                      ? 'text-red-400 animate-pulse'
                      : deadlineInfo.status === 'today'
                        ? 'text-amber-400'
                        : isLight ? 'text-gray-400' : 'text-white/25'
                  }`}>
                    <Clock className="w-2.5 h-2.5" />
                    {deadlineInfo.text}
                  </span>
                )}

                {/* Time Estimate */}
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold ${isLight ? 'text-gray-400' : 'text-white/25'}`}>
                  <Timer className="w-2.5 h-2.5" />
                  {estMinutes}m
                </span>

                {/* Recurring */}
                {task.recurring.type !== 'none' && (
                  <span title={getRecurringLabel(task.recurring)} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${isLight ? 'text-teal-500' : 'text-teal-400'}`}>
                    <Repeat className="w-2.5 h-2.5" />
                    {task.recurring.type}
                  </span>
                )}

                {/* Tags */}
                {task.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className={`inline-flex px-1.5 py-0.5 rounded-md text-[9px] font-mono ${isLight ? 'text-gray-300' : 'text-white/20'}`}>
                    #{tag}
                  </span>
                ))}
                {task.tags.length > 2 && (
                  <span className={`text-[9px] font-mono ${isLight ? 'text-gray-300' : 'text-white/15'}`}>
                    +{task.tags.length - 2}
                  </span>
                )}

                {/* Task Age */}
                {taskAge > 0 && !task.completed && (
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold ${
                    taskAge > 7 ? 'text-red-400' : taskAge > 3 ? 'text-amber-400' : isLight ? 'text-gray-300' : 'text-white/15'
                  }`}>
                    {taskAge}d old
                  </span>
                )}
              </div>

              {/* Subtasks Progress */}
              {totalSubtasksCount > 0 && (
                <div className="mt-3">
                  <button
                    onClick={() => { haptic.lightTap(); setIsExpanded(!isExpanded); }}
                    className="w-full text-left cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <ListTodo className={`w-3 h-3 ${isLight ? 'text-gray-400' : 'text-white/30'}`} />
                        <span className={`text-[10px] font-semibold ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
                          {completedSubtasksCount}/{totalSubtasksCount} subtasks
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold ${isLight ? 'text-gray-500' : 'text-white/40'}`}>
                          {Math.round(subtasksProgress)}%
                        </span>
                        {isExpanded ? (
                          <ChevronUp className={`w-3 h-3 ${isLight ? 'text-gray-400' : 'text-white/30'}`} />
                        ) : (
                          <ChevronDown className={`w-3 h-3 ${isLight ? 'text-gray-400' : 'text-white/30'}`} />
                        )}
                      </div>
                    </div>
                    <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-gray-100' : 'bg-white/[0.06]'}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${subtasksProgress}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full rounded-full bg-gradient-to-r from-[#c8ff00] to-[#b8f000]"
                      />
                    </div>
                  </button>

                  {/* Expanded Subtasks */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 space-y-1"
                      >
                        {task.subtasks.map((sub) => (
                          <div
                            key={sub.id}
                            onClick={() => handleSubtaskToggleInternal(sub.id)}
                            className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                              isLight ? 'hover:bg-gray-50' : 'hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                              sub.completed
                                ? 'bg-[#22c55e] border-[#22c55e] text-white'
                                : isLight ? 'border-gray-200 bg-white' : 'border-white/20 bg-transparent'
                            }`}>
                              {sub.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <span className={`text-[11px] select-none flex-1 min-w-0 ${
                              sub.completed
                                ? isLight ? 'line-through text-gray-300' : 'line-through text-white/20'
                                : isLight ? 'text-gray-600' : 'text-white/70'
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

          {/* Inline Action Bar */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div className={`flex flex-wrap gap-1.5 pt-3 mt-3 border-t ${isLight ? 'border-gray-100' : 'border-white/[0.06]'}`}>
                  <button
                    onClick={() => { setShowMenu(false); haptic.mediumClick(); onEdit(task); }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                      isLight
                        ? 'bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100'
                        : 'bg-orange-500/10 text-orange-400 border border-orange-500/15 hover:bg-orange-500/15'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); onTriggerEmailReminder(task); }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                      isLight
                        ? 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/15 hover:bg-blue-500/15'
                    }`}
                  >
                    <Mail className="w-3 h-3" /> Email
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); haptic.lightTap(); onDuplicate(task); }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                      isLight
                        ? 'bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100'
                        : 'bg-white/[0.04] text-white/50 border border-white/[0.06] hover:bg-white/[0.08]'
                    }`}
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>

                  {/* Priority Quick-Set */}
                  {(['urgent', 'high', 'medium', 'low'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => { setShowMenu(false); haptic.lightTap(); onChangePriority(task.id, p); }}
                      className={`px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                        task.priority === p
                          ? p === 'urgent' ? 'bg-red-500 text-white border-red-400'
                            : p === 'high' ? 'bg-orange-500 text-white border-orange-400'
                            : p === 'medium' ? 'bg-blue-500 text-white border-blue-400'
                            : 'bg-green-500 text-white border-green-400'
                          : isLight ? 'bg-gray-50 text-gray-400 border-gray-100 hover:text-gray-600' : 'bg-white/[0.03] text-white/25 border-white/[0.06] hover:text-white/50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => { setShowMenu(false); haptic.deleteAction(); onDelete(task.id); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/15 dark:hover:bg-red-500/15"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>

                  {onAIBreakdown && (
                    <button
                      onClick={() => { setShowMenu(false); haptic.mediumClick(); onAIBreakdown(task); }}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                        isLight
                          ? 'bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/15 hover:bg-purple-500/15'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" /> AI
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};
