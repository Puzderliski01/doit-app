import React, { useState, useEffect } from 'react';
import { Task, Priority, RecurringType, Category, SubTask } from '../types';
import { 
  X, 
  Flag, 
  Calendar, 
  Clock, 
  Repeat, 
  Folder, 
  ListPlus, 
  Tag, 
  Mail, 
  Trash2, 
  Check, 
  Sparkles,
  Layers,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { haptic } from '../utils/haptics';
import { formatISODateInput } from '../utils/dateHelpers';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => void;
  categories: Category[];
  onCategoriesChange?: (cats: Category[]) => void;
  initialTask?: Task | null;
  theme: 'dark' | 'light';
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  onCategoriesChange,
  initialTask,
  theme
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('high');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-work');
  const [localCategories, setLocalCategories] = useState(categories);
  const [dueDate, setDueDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [recurringType, setRecurringType] = useState<RecurringType>('none');
  const [customDays, setCustomDays] = useState(3);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#f59e0b');
  const CATEGORY_COLORS = ['#f59e0b','#10b981','#ec4899','#38bdf8','#8b5cf6','#f97316','#06b6d4','#ef4444','#84cc16','#6366f1'];
  const [reminderEmail, setReminderEmail] = useState('');
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(30);
  const [isImportant, setIsImportant] = useState(true);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setPriority(initialTask.priority);
      setCategoryId(initialTask.categoryId);
      setDueDate(initialTask.dueDate || '');
      setEstimatedMinutes(initialTask.estimatedMinutes || 30);
      setRecurringType(initialTask.recurring?.type || 'none');
      setCustomDays(initialTask.recurring?.customDays || 3);
      setSubtasks(initialTask.subtasks || []);
      setTagsInput(initialTask.tags ? initialTask.tags.join(', ') : '');
      setReminderEmail(initialTask.reminderEmail || '');
      setReminderMinutesBefore(initialTask.reminderMinutesBefore || 30);
      setIsImportant(initialTask.isImportant ?? (initialTask.priority === 'urgent' || initialTask.priority === 'high'));
      setIsUrgent(initialTask.isUrgent ?? initialTask.priority === 'urgent');
    } else {
      // Default new task
      const defaultDue = new Date();
      defaultDue.setHours(defaultDue.getHours() + 4);
      setTitle('');
      setDescription('');
      setPriority('high');
      setCategoryId(categories[0]?.id || 'cat-work');
      setDueDate(formatISODateInput(defaultDue));
      setEstimatedMinutes(30);
      setRecurringType('none');
      setCustomDays(3);
      setSubtasks([]);
      setNewSubtaskTitle('');
      setTagsInput('');
      setReminderEmail('s.puzderliski@gmail.com');
      setReminderMinutesBefore(30);
      setIsImportant(true);
      setIsUrgent(false);
    }
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const isLight = theme === 'light';

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    haptic.lightTap();
    setSubtasks([
      ...subtasks,
      {
        id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        title: newSubtaskTitle.trim(),
        completed: false
      }
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    haptic.deleteAction();
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const handleToggleSubtask = (id: string) => {
    haptic.lightTap();
    setSubtasks(subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    haptic.success();

    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    onSave({
      title: title.trim(),
      description: description.trim(),
      priority,
      categoryId,
      dueDate,
      estimatedMinutes: Number(estimatedMinutes) || 30,
      recurring: {
        type: recurringType,
        customDays: recurringType === 'custom' ? Number(customDays) : undefined
      },
      subtasks,
      tags: parsedTags,
      reminderEmail: reminderEmail.trim(),
      reminderMinutesBefore: Number(reminderMinutesBefore) || 30,
      isImportant: priority === 'urgent' || priority === 'high' || isImportant,
      isUrgent: priority === 'urgent' || isUrgent
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl border shadow-2xl overflow-hidden mb-[env(safe-area-inset-bottom,0px)] sm:mb-8 backdrop-blur-2xl max-h-[85vh] sm:max-h-[85vh] flex flex-col ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-[0_8px_40px_rgba(0,0,0,0.12)]'
            : 'bg-[#0a0a0c]/95 border-white/10 text-white'
        }`}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className={`w-10 h-1 rounded-full ${isLight ? 'bg-slate-300' : 'bg-white/20'}`} />
        </div>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 sm:px-8 py-5 border-b backdrop-blur-xl ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.02]'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.25)] ${
              isLight ? 'bg-orange-50 border-orange-200 text-orange-500' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
            }`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-[10px] uppercase tracking-[0.2em] font-bold ${
                isLight ? 'text-slate-400' : 'text-white/40'
              }`}>Task Specification</div>
              <h2 className={`font-light text-lg sm:text-xl tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {initialTask ? 'Refine Objective' : 'Deploy New Task'}
              </h2>
            </div>
          </div>
          <button
            onClick={() => { haptic.lightTap(); onClose(); }}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-white/40 hover:text-white hover:bg-white/10'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className={`p-5 sm:p-8 space-y-5 flex-1 overflow-y-auto ${
          isLight ? 'bg-white' : ''
        }`}>
          
          {/* Title */}
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${
              isLight ? 'text-slate-500' : 'text-white/50'
            }`}>
              Task Directive <span className="text-orange-400">*</span>
            </label>
            <input
              id="input-task-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Finalize Multi-Cloud Synchronizer Architecture"
              className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all ${
                isLight
                  ? 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-orange-400'
                  : 'border-white/10 bg-white/5 text-white placeholder:text-white/30'
              }`}
            />
          </div>

          {/* Description */}
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${
              isLight ? 'text-slate-500' : 'text-white/50'
            }`}>
              Context & Documentation
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key deliverables, acceptance criteria, or technical constraints..."
              className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all resize-none ${
                isLight
                  ? 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-orange-400'
                  : 'border-white/10 bg-white/5 text-white placeholder:text-white/30'
              }`}
            />
          </div>

          {/* Priority & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority Picker */}
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${
                isLight ? 'text-slate-500' : 'text-white/50'
              }`}>
                Priority Tier
              </label>
              <div className={`grid grid-cols-4 gap-1.5 p-1 rounded-2xl border ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
              }`}>
                {(['urgent', 'high', 'medium', 'low'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => { haptic.lightTap(); setPriority(p); }}
                    className={`py-2 rounded-xl text-[11px] font-bold capitalize transition-all cursor-pointer ${
                      priority === p
                        ? p === 'urgent' ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                          : p === 'high' ? 'bg-orange-500 text-black shadow-[0_0_12px_rgba(249,115,22,0.5)]'
                          : p === 'medium' ? 'bg-sky-500 text-white shadow-[0_0_12px_rgba(14,165,233,0.5)]'
                          : 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                        : isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Picker */}
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${
                isLight ? 'text-slate-500' : 'text-white/50'
              }`}>
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {localCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { haptic.lightTap(); setCategoryId(c.id); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      categoryId === c.id
                        ? 'ring-2 ring-offset-1'
                        : isLight ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                    style={categoryId === c.id ? { backgroundColor: c.color + '20', borderColor: c.color, color: c.color, ringColor: c.color } : undefined}
                  >
                    {c.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => { haptic.lightTap(); setShowCategoryForm(!showCategoryForm); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border border-dashed transition-all cursor-pointer ${
                    isLight ? 'border-slate-300 text-slate-500 hover:bg-slate-100' : 'border-white/20 text-white/40 hover:bg-white/5'
                  }`}
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  Add
                </button>
              </div>
              {showCategoryForm && (
                <div className={`mt-3 p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                  <input
                    type="text"
                    placeholder="Category name..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/50 mb-2 ${
                      isLight ? 'border-slate-200 bg-white text-slate-900' : 'border-white/10 bg-white/5 text-white'
                    }`}
                  />
                  <div className="flex gap-1.5 mb-2">
                    {CATEGORY_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCategoryColor(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${newCategoryColor === color ? 'scale-110 border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!newCategoryName.trim()) return;
                        const id = 'cat-' + newCategoryName.trim().toLowerCase().replace(/\s+/g, '-');
                        const newCat: Category = { id, name: newCategoryName.trim(), color: newCategoryColor, iconName: 'Folder' };
                        const newCats = [...localCategories, newCat];
                        setLocalCategories(newCats);
                        onCategoriesChange?.(newCats);
                        setCategoryId(id);
                        setNewCategoryName('');
                        setShowCategoryForm(false);
                        haptic.mediumClick();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowCategoryForm(false); setNewCategoryName(''); }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${isLight ? 'border-slate-200 text-slate-600' : 'border-white/10 text-white/60'}`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Deadline & Estimated Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${
                isLight ? 'text-slate-500' : 'text-white/50'
              }`}>
                Target Deadline
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                    isLight
                      ? 'border-slate-200 bg-slate-50 text-slate-900 focus:border-orange-400'
                      : 'border-white/10 bg-white/5 text-white'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${
                isLight ? 'text-slate-500' : 'text-white/50'
              }`}>
                Estimated Focus (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={480}
                step={5}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className={`w-full px-4 py-2.5 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                  isLight
                    ? 'border-slate-200 bg-slate-50 text-slate-900 focus:border-orange-400'
                    : 'border-white/10 bg-white/5 text-white'
                }`}
              />
            </div>
          </div>

          {/* Recurring Schedule */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-cyan-400" />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${
                  isLight ? 'text-slate-500' : 'text-white/60'
                }`}>
                  Recurring Schedule Automation
                </span>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono">Auto-rolls on completion</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[
                { id: 'none', label: 'None' },
                { id: 'daily', label: 'Daily' },
                { id: 'weekdays', label: 'Weekdays' },
                { id: 'weekly', label: 'Weekly' },
                { id: 'monthly', label: 'Monthly' },
                { id: 'custom', label: 'Custom' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { haptic.lightTap(); setRecurringType(item.id as RecurringType); }}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    recurringType === item.id 
                      ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]' 
                      : isLight ? 'bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900' : 'bg-white/5 border border-white/10 text-white/40 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {recurringType === 'custom' && (
              <div className="flex items-center gap-2 text-xs pt-1">
                <span className={isLight ? 'text-slate-500' : 'text-white/50'}>Repeat every</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={customDays}
                  onChange={(e) => setCustomDays(Number(e.target.value))}
                  className={`w-16 px-2 py-1 rounded-xl border text-center text-xs font-bold text-cyan-400 ${
                    isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/10 border-white/20'
                  }`}
                />
                <span className={isLight ? 'text-slate-500' : 'text-white/50'}>days</span>
              </div>
            )}
          </div>

          {/* Email Notification & Reminder */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
          }`}>
            <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${
              isLight ? 'text-slate-500' : 'text-white/60'
            }`}>
              <Mail className="w-4 h-4 text-orange-400" />
              <span>Email Notification & Due Alert</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="email"
                  value={reminderEmail}
                  onChange={(e) => setReminderEmail(e.target.value)}
                  placeholder="Recipient (e.g., s.puzderliski@gmail.com)"
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                    isLight
                      ? 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-orange-400'
                      : 'border-white/10 bg-white/5 text-white placeholder:text-white/30'
                  }`}
                />
              </div>

              <div>
                <select
                  value={reminderMinutesBefore}
                  onChange={(e) => setReminderMinutesBefore(Number(e.target.value))}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                    isLight
                      ? 'border-slate-200 bg-slate-50 text-slate-900 focus:border-orange-400'
                      : 'border-white/10 bg-white/5 text-white'
                  }`}
                >
                  <option value={15} className={isLight ? 'bg-white text-slate-900' : 'bg-[#121216]'}>15 mins before</option>
                  <option value={30} className={isLight ? 'bg-white text-slate-900' : 'bg-[#121216]'}>30 mins before</option>
                  <option value={60} className={isLight ? 'bg-white text-slate-900' : 'bg-[#121216]'}>1 hour before</option>
                  <option value={120} className={isLight ? 'bg-white text-slate-900' : 'bg-[#121216]'}>2 hours before</option>
                  <option value={1440} className={isLight ? 'bg-white text-slate-900' : 'bg-[#121216]'}>1 day before</option>
                </select>
              </div>
            </div>
          </div>

          {/* Subtasks Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`block text-[10px] font-bold uppercase tracking-widest ${
                isLight ? 'text-slate-500' : 'text-white/50'
              }`}>
                Subtasks & Milestones ({subtasks.length})
              </label>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add checklist subtask..."
                className={`flex-1 px-4 py-2.5 rounded-2xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                  isLight
                    ? 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-orange-400'
                    : 'border-white/10 bg-white/5 text-white placeholder:text-white/30'
                }`}
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className={`px-4 py-2.5 rounded-2xl border font-bold text-xs cursor-pointer transition-colors ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                    : 'bg-white/10 hover:bg-white/20 border-white/10 text-white'
                }`}
              >
                Add
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className={`space-y-1.5 max-h-36 overflow-y-auto p-2 rounded-2xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/10'
              }`}>
                {subtasks.map((st) => (
                  <div key={st.id} className={`flex items-center justify-between gap-2 p-2 rounded-xl ${
                    isLight ? 'hover:bg-slate-100' : 'hover:bg-white/5'
                  }`}>
                    <button
                      type="button"
                      onClick={() => handleToggleSubtask(st.id)}
                      className="flex items-center gap-2.5 flex-1 text-left cursor-pointer"
                    >
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center border text-xs ${
                        st.completed ? 'bg-emerald-500 border-emerald-400 text-black' : isLight ? 'border-slate-300' : 'border-white/30'
                      }`}>
                        {st.completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className={`text-xs ${st.completed ? 'line-through' : ''} ${
                        st.completed
                          ? isLight ? 'text-slate-400' : 'text-white/30'
                          : isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        {st.title}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className={`p-1 cursor-pointer ${isLight ? 'text-slate-400 hover:text-red-500' : 'text-white/30 hover:text-red-400'}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${
              isLight ? 'text-slate-500' : 'text-white/50'
            }`}>
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. Mobile, Architecture, Release"
              className={`w-full px-4 py-2.5 rounded-2xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                isLight
                  ? 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-orange-400'
                  : 'border-white/10 bg-white/5 text-white placeholder:text-white/30'
              }`}
            />
          </div>

          {/* Action Buttons */}
          <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-5 border-t sticky bottom-0 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0a0a0c]/95 border-white/10'
          }`}>
            <button
              type="button"
              onClick={() => { haptic.lightTap(); onClose(); }}
              className={`px-5 py-3 sm:py-2.5 rounded-full border font-bold text-xs transition-colors cursor-pointer ${
                isLight
                  ? 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'border-white/10 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              Cancel
            </button>
            <button
              id="btn-save-task"
              type="submit"
              className={`px-6 py-3 sm:py-2.5 rounded-full font-bold text-xs shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isLight
                  ? 'bg-orange-500 text-white shadow-[0_4px_14px_rgba(249,115,22,0.35)]'
                  : 'bg-white text-black'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{initialTask ? 'Save Directive' : 'Deploy Task'}</span>
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
};
