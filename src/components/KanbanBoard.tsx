import React from 'react';
import { Task, Category, KanbanColumn } from '../types';
import { KANBAN_COLUMNS, getTaskKanbanColumn, formatDuration, getTotalTrackedTime } from '../utils/taskHelpers';
import { Clock, Calendar, Tag, GripVertical, CheckCircle2, Circle, AlertTriangle } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  categories: Category[];
  theme: 'dark' | 'light';
  onToggleComplete: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onMoveTask: (taskId: string, column: KanbanColumn) => void;
}

const PRIORITY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  urgent: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-500' },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-500' },
  medium: { bg: 'bg-sky-500/10', text: 'text-sky-400', dot: 'bg-sky-500' },
  low: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500' },
};

const PRIORITY_COLORS_LIGHT: Record<string, { bg: string; text: string; dot: string }> = {
  urgent: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
  high: { bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-500' },
  medium: { bg: 'bg-sky-50', text: 'text-sky-600', dot: 'bg-sky-500' },
  low: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  categories,
  theme,
  onToggleComplete,
  onEditTask,
  onMoveTask,
}) => {
  const isLight = theme === 'light';
  const taskGroups = KANBAN_COLUMNS.map(col => ({
    ...col,
    tasks: tasks.filter(t => getTaskKanbanColumn(t) === col.id),
  }));

  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  }, {} as Record<string, Category>);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e: React.DragEvent, columnId: KanbanColumn) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onMoveTask(taskId, columnId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getRelativeDate = (dateStr: string) => {
    const now = new Date();
    const due = new Date(dateStr);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, color: 'text-red-400' };
    if (diffDays === 0) return { text: 'Today', color: 'text-amber-400' };
    if (diffDays === 1) return { text: 'Tomorrow', color: 'text-sky-400' };
    if (diffDays <= 7) return { text: `${diffDays}d`, color: isLight ? 'text-slate-500' : 'text-white/40' };
    return { text: due.toLocaleDateString('en', { month: 'short', day: 'numeric' }), color: isLight ? 'text-slate-500' : 'text-white/40' };
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 snap-x snap-mandatory">
      {taskGroups.map((column) => {
        const colDef = KANBAN_COLUMNS.find(c => c.id === column.id)!;
        return (
          <div
            key={column.id}
            className={`flex-shrink-0 w-72 snap-start rounded-2xl border flex flex-col max-h-[calc(100vh-220px)] ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
            }`}
            onDrop={(e) => handleDrop(e, column.id)}
            onDragOver={handleDragOver}
          >
            {/* Column Header */}
            <div className={`flex items-center justify-between px-3 py-2.5 border-b ${
              isLight ? 'border-slate-200' : 'border-white/10'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-sm">{colDef.icon}</span>
                <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                  {colDef.label}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                isLight ? 'bg-slate-200 text-slate-600' : 'bg-white/10 text-white/50'
              }`}>
                {column.tasks.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]">
              {column.tasks.length === 0 && (
                <div className={`text-center py-8 rounded-xl border border-dashed ${
                  isLight ? 'border-slate-300 text-slate-400' : 'border-white/10 text-white/20'
                }`}>
                  <p className="text-[11px]">Drop tasks here</p>
                </div>
              )}
              {column.tasks.map((task) => {
                const pColors = isLight ? PRIORITY_COLORS_LIGHT[task.priority] : PRIORITY_COLORS[task.priority];
                const category = task.categoryId ? categoryMap[task.categoryId] : null;
                const dateInfo = getRelativeDate(task.dueDate);
                const trackedTime = getTotalTrackedTime(task);
                const subtaskCount = task.subtasks.length;
                const subtaskDone = task.subtasks.filter(s => s.completed).length;
                const isOverdue = !task.completed && new Date(task.dueDate) < new Date();
                
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => onEditTask(task)}
                    className={`rounded-xl p-3 cursor-pointer transition-all active:scale-[0.98] ${
                      isLight
                        ? 'bg-white border border-slate-200 hover:border-amber-300 shadow-sm'
                        : 'bg-[#1a1a1f] border border-white/5 hover:border-amber-500/30'
                    } ${task.completed ? 'opacity-50' : ''}`}
                  >
                    {/* Priority + Category */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${pColors.dot}`} />
                      <span className={`text-[9px] font-semibold uppercase ${pColors.text}`}>
                        {task.priority}
                      </span>
                      {category && (
                        <>
                          <span className={`text-[9px] ${isLight ? 'text-slate-300' : 'text-white/20'}`}>·</span>
                          <span className="text-[9px]" style={{ color: category.color }}>
                            {category.name}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Title */}
                    <p className={`text-xs font-medium leading-relaxed mb-2 ${
                      task.completed
                        ? 'line-through opacity-50'
                        : isLight ? 'text-slate-800' : 'text-white/90'
                    }`}>
                      {task.title}
                    </p>

                    {/* Tags */}
                    {task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {task.tags.slice(0, 2).map(tag => (
                          <span key={tag} className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                            isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-white/50'
                          }`}>
                            {tag}
                          </span>
                        ))}
                        {task.tags.length > 2 && (
                          <span className={`text-[8px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                            +{task.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Subtasks */}
                    {subtaskCount > 0 && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className={`flex-1 h-1 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${(subtaskDone / subtaskCount) * 100}%` }}
                          />
                        </div>
                        <span className={`text-[9px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                          {subtaskDone}/{subtaskCount}
                        </span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* Due Date */}
                        <span className={`flex items-center gap-0.5 text-[9px] ${dateInfo.color}`}>
                          {isOverdue && <AlertTriangle className="w-2.5 h-2.5" />}
                          <Calendar className="w-2.5 h-2.5" />
                          {dateInfo.text}
                        </span>
                        
                        {/* Time Tracked */}
                        {trackedTime > 0 && (
                          <span className={`flex items-center gap-0.5 text-[9px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                            <Clock className="w-2.5 h-2.5" />
                            {formatDuration(trackedTime)}
                          </span>
                        )}
                      </div>

                      {/* Complete Button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleComplete(task.id); }}
                        className={`p-1 rounded-full transition-colors ${
                          task.completed
                            ? 'text-emerald-400'
                            : isLight ? 'text-slate-300 hover:text-emerald-500' : 'text-white/20 hover:text-emerald-400'
                        }`}
                      >
                        {task.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
