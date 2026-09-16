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
  Plus,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  startStep?: number;
}

const STEPS = [
  { id: 'details', label: 'Details', icon: <Zap className="w-3.5 h-3.5" /> },
  { id: 'priority', label: 'Priority', icon: <Flag className="w-3.5 h-3.5" /> },
  { id: 'schedule', label: 'Schedule', icon: <Calendar className="w-3.5 h-3.5" /> },
  { id: 'extras', label: 'Extras', icon: <ListPlus className="w-3.5 h-3.5" /> },
];

const PRIORITY_OPTIONS: { value: Priority; label: string; desc: string; color: string; glow: string }[] = [
  { value: 'urgent', label: 'Urgent', desc: 'Drop everything', color: '#ef4444', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]' },
  { value: 'high', label: 'High', desc: 'Important & time-sensitive', color: '#f97316', glow: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]' },
  { value: 'medium', label: 'Medium', desc: 'Standard importance', color: '#3b82f6', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]' },
  { value: 'low', label: 'Low', desc: 'Do when possible', color: '#22c55e', glow: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]' },
];

const CATEGORY_COLORS = ['#f59e0b','#10b981','#ec4899','#38bdf8','#8b5cf6','#f97316','#06b6d4','#ef4444','#84cc16','#6366f1'];

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  onCategoriesChange,
  initialTask,
  theme,
  startStep = 0,
}) => {
  const [step, setStep] = useState(startStep);
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
  const [reminderEmail, setReminderEmail] = useState('');
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(30);

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
    } else {
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
      setStep(startStep);
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
      isImportant: priority === 'urgent' || priority === 'high',
      isUrgent: priority === 'urgent'
    });

    onClose();
  };

  const canGoNext = () => {
    if (step === 0) return title.trim().length > 0;
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl border shadow-2xl overflow-hidden mb-[env(safe-area-inset-bottom,0px)] sm:mb-8 backdrop-blur-3xl max-h-[85vh] flex flex-col ${
          isLight
            ? 'bg-white/90 border-white/40 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_8px_40px_rgba(0,0,0,0.12)]'
            : 'bg-[#0a0a0c]/90 border-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_40px_rgba(0,0,0,0.5)]'
        }`}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className={`w-10 h-1 rounded-full ${isLight ? 'bg-slate-300' : 'bg-white/20'}`} />
        </div>

        {/* Header with Step Indicator */}
        <div className={`px-5 sm:px-6 py-4 border-b backdrop-blur-2xl ${
          isLight ? 'border-gray-100 bg-white/60' : 'border-white/[0.06] bg-white/[0.02]'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isLight
                  ? 'bg-[#c8ff00]/15 text-[#7da300]'
                  : 'bg-[#c8ff00]/10 text-[#c8ff00]'
              }`}>
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className={`text-base font-bold tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {initialTask ? 'Edit Task' : 'New Task'}
                </h2>
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
                  Step {step + 1} of {STEPS.length}: {STEPS[step].label}
                </p>
              </div>
            </div>
            <button
              onClick={() => { haptic.lightTap(); onClose(); }}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                isLight ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-100' : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step Progress Bar */}
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { if (i <= step || (i === step + 1 && canGoNext())) { haptic.lightTap(); setStep(i); } }}
                className={`flex-1 h-1.5 rounded-full transition-all cursor-pointer ${
                  i < step
                    ? 'bg-[#c8ff00]'
                    : i === step
                      ? 'bg-gradient-to-r from-[#c8ff00] to-[#c8ff00]/30'
                      : isLight ? 'bg-gray-100' : 'bg-white/[0.06]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Step 0: Details */}
            {step === 0 && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-5 sm:p-6 space-y-5"
              >
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isLight ? 'text-gray-400' : 'text-white/40'}`}>
                    Task Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="input-task-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    autoFocus
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#c8ff00]/30 transition-all ${
                      isLight
                        ? 'border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-[#c8ff00]/50'
                        : 'border-white/[0.08] bg-white/[0.03] text-white placeholder:text-white/25'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isLight ? 'text-gray-400' : 'text-white/40'}`}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add context, notes, or details..."
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#c8ff00]/30 transition-all resize-none ${
                      isLight
                        ? 'border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-[#c8ff00]/50'
                        : 'border-white/[0.08] bg-white/[0.03] text-white placeholder:text-white/25'
                    }`}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 1: Priority & Category */}
            {step === 1 && (
              <motion.div
                key="priority"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-5 sm:p-6 space-y-5"
              >
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-widest mb-3 ${isLight ? 'text-gray-400' : 'text-white/40'}`}>
                    Priority Level
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRIORITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { haptic.lightTap(); setPriority(opt.value); }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          priority === opt.value
                            ? `${opt.glow} border-transparent`
                            : isLight
                              ? 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                              : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                        }`}
                        style={priority === opt.value ? { backgroundColor: opt.color + '12', borderColor: opt.color + '40' } : undefined}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: opt.color, boxShadow: priority === opt.value ? `0 0 8px ${opt.color}60` : 'none' }}
                          />
                          <div>
                            <p className={`text-xs font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{opt.label}</p>
                            <p className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-white/30'}`}>{opt.desc}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-widest mb-3 ${isLight ? 'text-gray-400' : 'text-white/40'}`}>
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
                            : isLight ? 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100' : 'bg-white/[0.03] border-white/[0.06] text-white/50 hover:bg-white/[0.06]'
                        }`}
                        style={categoryId === c.id ? { backgroundColor: c.color + '18', borderColor: c.color + '60', color: c.color } : undefined}
                      >
                        {c.name}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => { haptic.lightTap(); setShowCategoryForm(!showCategoryForm); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border border-dashed transition-all cursor-pointer ${
                        isLight ? 'border-gray-200 text-gray-400 hover:bg-gray-50' : 'border-white/10 text-white/30 hover:bg-white/[0.03]'
                      }`}
                    >
                      <Plus className="w-3 h-3 inline mr-1" />
                      New
                    </button>
                  </div>
                  {showCategoryForm && (
                    <div className={`mt-3 p-3 rounded-xl border ${isLight ? 'bg-gray-50 border-gray-100' : 'bg-white/[0.03] border-white/[0.06]'}`}>
                      <input
                        type="text"
                        placeholder="Category name..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#c8ff00]/30 mb-2 ${
                          isLight ? 'border-gray-200 bg-white text-gray-900' : 'border-white/[0.08] bg-white/[0.03] text-white'
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
                          className="px-3 py-1.5 rounded-lg bg-[#c8ff00] text-[#0a0a0a] text-xs font-bold cursor-pointer"
                        >
                          Create
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowCategoryForm(false); setNewCategoryName(''); }}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${isLight ? 'border-gray-200 text-gray-500' : 'border-white/10 text-white/50'}`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2: Schedule */}
            {step === 2 && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-5 sm:p-6 space-y-5"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isLight ? 'text-gray-400' : 'text-white/40'}`}>
                      Deadline
                    </label>
                    <input
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#c8ff00]/30 ${
                        isLight
                          ? 'border-gray-200 bg-gray-50 text-gray-900 focus:border-[#c8ff00]/50'
                          : 'border-white/[0.08] bg-white/[0.03] text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isLight ? 'text-gray-400' : 'text-white/40'}`}>
                      Est. Focus
                    </label>
                    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${isLight ? 'border-gray-200 bg-gray-50' : 'border-white/[0.08] bg-white/[0.03]'}`}>
                      <input
                        type="number"
                        min={5}
                        max={480}
                        step={5}
                        value={estimatedMinutes}
                        onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                        className={`flex-1 bg-transparent text-xs font-semibold focus:outline-none ${isLight ? 'text-gray-900' : 'text-white'}`}
                      />
                      <span className={`text-[10px] font-semibold ${isLight ? 'text-gray-400' : 'text-white/30'}`}>min</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isLight ? 'text-gray-400' : 'text-white/40'}`}>
                    Recurring
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
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
                        className={`py-2 px-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                          recurringType === item.id
                            ? 'bg-[#c8ff00] text-[#0a0a0a] shadow-[0_0_10px_rgba(200,255,0,0.25)]'
                            : isLight ? 'bg-gray-50 border border-gray-100 text-gray-500 hover:bg-gray-100' : 'bg-white/[0.03] border border-white/[0.06] text-white/35 hover:text-white/60'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  {recurringType === 'custom' && (
                    <div className="flex items-center gap-2 text-xs mt-2">
                      <span className={isLight ? 'text-gray-400' : 'text-white/35'}>Every</span>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={customDays}
                        onChange={(e) => setCustomDays(Number(e.target.value))}
                        className={`w-14 px-2 py-1 rounded-lg border text-center text-xs font-bold text-[#c8ff00] ${
                          isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/[0.06] border-white/[0.1]'
                        }`}
                      />
                      <span className={isLight ? 'text-gray-400' : 'text-white/35'}>days</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 3: Extras */}
            {step === 3 && (
              <motion.div
                key="extras"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-5 sm:p-6 space-y-5"
              >
                {/* Subtasks */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isLight ? 'text-gray-400' : 'text-white/40'}`}>
                    Subtasks ({subtasks.length})
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                      placeholder="Add subtask..."
                      className={`flex-1 px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#c8ff00]/30 ${
                        isLight
                          ? 'border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-[#c8ff00]/50'
                          : 'border-white/[0.08] bg-white/[0.03] text-white placeholder:text-white/25'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleAddSubtask}
                      className={`px-3 py-2 rounded-xl border font-bold text-xs cursor-pointer transition-colors ${
                        isLight
                          ? 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-600'
                          : 'bg-white/[0.06] hover:bg-white/[0.1] border-white/[0.08] text-white'
                      }`}
                    >
                      Add
                    </button>
                  </div>
                  {subtasks.length > 0 && (
                    <div className={`space-y-1 max-h-32 overflow-y-auto p-2 rounded-xl border ${isLight ? 'bg-gray-50 border-gray-100' : 'bg-white/[0.02] border-white/[0.06]'}`}>
                      {subtasks.map((st) => (
                        <div key={st.id} className={`flex items-center justify-between gap-2 p-2 rounded-lg ${isLight ? 'hover:bg-gray-100' : 'hover:bg-white/[0.04]'}`}>
                          <button
                            type="button"
                            onClick={() => handleToggleSubtask(st.id)}
                            className="flex items-center gap-2 flex-1 text-left cursor-pointer"
                          >
                            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                              st.completed ? 'bg-[#22c55e] border-[#22c55e] text-white' : isLight ? 'border-gray-300' : 'border-white/20'
                            }`}>
                              {st.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <span className={`text-xs ${st.completed ? 'line-through' : ''} ${
                              st.completed
                                ? isLight ? 'text-gray-400' : 'text-white/25'
                                : isLight ? 'text-gray-700' : 'text-white/80'
                            }`}>{st.title}</span>
                          </button>
                          <button type="button" onClick={() => handleRemoveSubtask(st.id)} className={`p-0.5 cursor-pointer ${isLight ? 'text-gray-300 hover:text-red-400' : 'text-white/20 hover:text-red-400'}`}>
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isLight ? 'text-gray-400' : 'text-white/40'}`}>
                    Tags
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Comma separated (e.g. work, urgent, api)"
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#c8ff00]/30 ${
                      isLight
                        ? 'border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-[#c8ff00]/50'
                        : 'border-white/[0.08] bg-white/[0.03] text-white placeholder:text-white/25'
                    }`}
                  />
                </div>

                {/* Email Reminder */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isLight ? 'text-gray-400' : 'text-white/40'}`}>
                    Email Reminder
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={reminderEmail}
                      onChange={(e) => setReminderEmail(e.target.value)}
                      placeholder="Email address"
                      className={`flex-1 px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#c8ff00]/30 ${
                        isLight
                          ? 'border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-[#c8ff00]/50'
                          : 'border-white/[0.08] bg-white/[0.03] text-white placeholder:text-white/25'
                      }`}
                    />
                    <select
                      value={reminderMinutesBefore}
                      onChange={(e) => setReminderMinutesBefore(Number(e.target.value))}
                      className={`px-2 py-2 rounded-xl border text-[10px] font-semibold focus:outline-none ${
                        isLight ? 'border-gray-200 bg-gray-50 text-gray-700' : 'border-white/[0.08] bg-white/[0.03] text-white/60'
                      }`}
                    >
                      <option value={15}>15m</option>
                      <option value={30}>30m</option>
                      <option value={60}>1h</option>
                      <option value={120}>2h</option>
                      <option value={1440}>1d</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Navigation */}
          <div className={`px-5 sm:px-6 py-4 border-t flex items-center justify-between backdrop-blur-2xl ${
            isLight ? 'bg-white/80 border-gray-100' : 'bg-[#0a0a0c]/80 border-white/[0.06]'
          }`}>
            <button
              type="button"
              onClick={() => { haptic.lightTap(); if (step > 0) setStep(step - 1); else onClose(); }}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                isLight ? 'text-gray-500 hover:bg-gray-100' : 'text-white/50 hover:bg-white/[0.06]'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              {step > 0 ? 'Back' : 'Cancel'}
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => { if (canGoNext()) { haptic.lightTap(); setStep(step + 1); } }}
                disabled={!canGoNext()}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#c8ff00] text-[#0a0a0a] font-bold text-xs shadow-[0_2px_10px_rgba(200,255,0,0.25)] active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            ) : (
              <button
                id="btn-save-task"
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#c8ff00] to-[#b8f000] text-[#0a0a0a] font-bold text-xs shadow-[0_2px_12px_rgba(200,255,0,0.3)] active:scale-95 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                {initialTask ? 'Save Changes' : 'Create Task'}
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};
