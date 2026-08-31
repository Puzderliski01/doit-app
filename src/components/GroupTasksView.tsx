import React, { useState, useEffect, useMemo } from 'react';
import { Group, GroupTask, AuthUser, Priority } from '../types';
import { subscribeToGroupTasks, addGroupTask, updateGroupTask, deleteGroupTask, addGroupTaskComment } from '../firebase';
import { ArrowLeft, Plus, Check, Clock, MessageCircle, Send, Trash2, Crown, ChevronDown, ChevronUp, X, AlertCircle } from 'lucide-react';
import { haptic } from '../utils/haptics';
import { formatDeadlineRelative, isOverdue } from '../utils/dateHelpers';

interface GroupTasksViewProps {
  theme: 'dark' | 'light';
  group: Group;
  currentUser: AuthUser;
  onBack: () => void;
}

export const GroupTasksView: React.FC<GroupTasksViewProps> = ({
  theme,
  group,
  currentUser,
  onBack,
}) => {
  const isLight = theme === 'light';
  const [tasks, setTasks] = useState<GroupTask[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    const unsub = subscribeToGroupTasks(group.id, setTasks);
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [group.id]);

  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    if (filter === 'pending') filtered = tasks.filter((t) => !t.completed);
    if (filter === 'completed') filtered = tasks.filter((t) => t.completed);
    return filtered.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
    });
  }, [tasks, filter]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    haptic.mediumClick();
    const now = new Date().toISOString();
    await addGroupTask(group.id, {
      title: newTaskTitle.trim(),
      description: '',
      priority: newTaskPriority,
      categoryId: '',
      completed: false,
      createdAt: now,
      dueDate: newTaskDue || new Date(Date.now() + 86400000).toISOString(),
      estimatedMinutes: 30,
      recurring: { type: 'none' },
      subtasks: [],
      tags: [],
      order: 0,
      groupId: group.id,
      createdBy: currentUser.uid,
      createdByName: currentUser.displayName || 'User',
      assignedTo: undefined,
      assignedToName: undefined,
    }, currentUser);
    setNewTaskTitle('');
    setNewTaskDue('');
    setShowAddTask(false);
  };

  const handleToggleComplete = async (task: GroupTask) => {
    haptic.lightTap();
    await updateGroupTask(group.id, task.id, {
      completed: !task.completed,
      completedAt: !task.completed ? new Date().toISOString() : undefined,
    });
  };

  const handleDelete = async (taskId: string) => {
    haptic.deleteAction();
    await deleteGroupTask(group.id, taskId);
  };

  const handleComment = async (taskId: string) => {
    if (!commentText.trim()) return;
    haptic.lightTap();
    await addGroupTaskComment(group.id, taskId, {
      uid: currentUser.uid,
      displayName: currentUser.displayName || 'User',
      text: commentText.trim(),
    });
    setCommentText('');
  };

  const priorityStyles: Record<Priority, string> = {
    urgent: '#ef4444',
    high: '#f97316',
    medium: '#3b82f6',
    low: '#22c55e',
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { haptic.lightTap(); onBack(); }}
          className={`p-2 rounded-xl ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-white/60'}`}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0"
          style={{ background: group.color || '#f97316' }}
        >
          {group.name[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className={`text-lg font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {group.name}
          </h1>
          <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
            {group.members.length} member{group.members.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { haptic.lightTap(); setShowAddTask(!showAddTask); }}
          className={`p-2 rounded-xl ${showAddTask ? 'bg-orange-500 text-white' : isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-white/60'}`}
        >
          {showAddTask ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {/* Filter Bar */}
      <div className={`flex gap-1 p-1 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
        {(['all', 'pending', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => { haptic.lightTap(); setFilter(f); }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer capitalize ${
              filter === f
                ? isLight ? 'bg-white text-slate-900 border border-slate-200 shadow-sm' : 'bg-white/10 text-white border border-white/10'
                : isLight ? 'text-slate-500' : 'text-white/40'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Add Task Form */}
      {showAddTask && (
        <div className={`rounded-2xl p-4 border liquid-glass-card ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Task title..."
            className={`w-full px-4 py-3 rounded-xl border text-sm mb-3 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'
            }`}
            autoFocus
          />
          <div className="flex gap-2 mb-3">
            {(['urgent', 'high', 'medium', 'low'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setNewTaskPriority(p)}
                className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer border ${
                  newTaskPriority === p ? 'text-white' : isLight ? 'text-slate-500 border-slate-200' : 'text-white/40 border-white/10'
                }`}
                style={newTaskPriority === p ? { background: priorityStyles[p], borderColor: priorityStyles[p] } : {}}
              >
                {p}
              </button>
            ))}
          </div>
          <input
            type="datetime-local"
            value={newTaskDue}
            onChange={(e) => setNewTaskDue(e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border text-xs mb-3 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'
            }`}
          />
          <button
            onClick={handleAddTask}
            disabled={!newTaskTitle.trim()}
            className="w-full py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
          >
            Add Task
          </button>
        </div>
      )}

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className={`text-center py-12 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
          <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
            {filter === 'all' ? 'No tasks yet. Add one!' : `No ${filter} tasks`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => {
            const deadline = formatDeadlineRelative(task.dueDate, task.completed);
            const overdue = isOverdue(task.dueDate, task.completed);
            const isExpanded = expandedTask === task.id;
            const creator = group.members.find((m) => m.uid === task.createdBy);
            return (
              <div
                key={task.id}
                className={`rounded-2xl border-2 overflow-hidden transition-all ${
                  isLight ? 'bg-white' : 'bg-[#111113]/90'
                }`}
                style={{ borderColor: task.completed ? (isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)') : priorityStyles[task.priority] + '60', borderRadius: '1.5rem' }}
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => handleToggleComplete(task)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      task.completed
                        ? 'bg-emerald-500 border-emerald-500'
                        : isLight ? 'border-slate-300' : 'border-white/30'
                    }`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${
                      task.completed
                        ? isLight ? 'text-slate-400 line-through' : 'text-white/30 line-through'
                        : isLight ? 'text-slate-800' : 'text-white/90'
                    }`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {creator && (
                        <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                          by {creator.displayName}
                        </span>
                      )}
                      {overdue && !task.completed && <AlertCircle className="w-3 h-3 text-red-500" />}
                      <span className={`text-[10px] ${overdue && !task.completed ? 'text-red-500' : isLight ? 'text-slate-400' : 'text-white/40'}`}>
                        {deadline.text}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => { haptic.lightTap(); setExpandedTask(isExpanded ? null : task.id); }}
                    className={`p-1.5 rounded-lg ${isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-white/40 hover:bg-white/5'}`}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expanded: Comments */}
                {isExpanded && (
                  <div className={`px-4 pb-4 border-t ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                    <div className="mt-3 space-y-2">
                      {task.comments?.map((c) => (
                        <div key={c.id} className={`px-3 py-2 rounded-xl text-xs ${isLight ? 'bg-slate-50' : 'bg-white/5'}`}>
                          <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white/70'}`}>{c.displayName}</span>
                          <span className={`ml-2 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{c.text}</span>
                        </div>
                      ))}
                      {(!task.comments || task.comments.length === 0) && (
                        <p className={`text-[10px] text-center py-2 ${isLight ? 'text-slate-300' : 'text-white/20'}`}>
                          No comments yet
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <input
                        type="text"
                        value={expandedTask === task.id ? commentText : ''}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleComment(task.id)}
                        placeholder="Add a comment..."
                        className={`flex-1 px-3 py-2 rounded-xl border text-xs ${
                          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'
                        }`}
                      />
                      <button
                        onClick={() => handleComment(task.id)}
                        disabled={!commentText.trim()}
                        className="p-2 rounded-xl bg-blue-500 text-white disabled:opacity-40 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {task.createdBy === currentUser.uid && (
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="mt-2 flex items-center gap-1 text-[10px] text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Delete task
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
