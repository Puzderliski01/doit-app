import { Task, TaskTemplate, KanbanColumn, Priority, SubTask } from '../types';

// Default task templates
export const DEFAULT_TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'tpl-daily-standup',
    name: 'Daily Standup',
    icon: '🔄',
    title: 'Daily Standup Meeting',
    description: 'Quick sync with team',
    priority: 'medium',
    categoryId: '',
    estimatedMinutes: 15,
    recurring: { type: 'weekdays' },
    subtasks: [{ title: 'Prepare yesterday updates' }, { title: 'Share today plan' }],
    tags: ['meeting', 'daily'],
  },
  {
    id: 'tpl-code-review',
    name: 'Code Review',
    icon: '🔍',
    title: 'Review Pull Request',
    description: 'Review code changes and provide feedback',
    priority: 'high',
    categoryId: '',
    estimatedMinutes: 60,
    recurring: { type: 'none' },
    subtasks: [{ title: 'Check functionality' }, { title: 'Review code quality' }, { title: 'Test edge cases' }],
    tags: ['development', 'review'],
  },
  {
    id: 'tpl-gym-workout',
    name: 'Gym Workout',
    icon: '💪',
    title: 'Gym Workout Session',
    description: 'Complete planned workout routine',
    priority: 'medium',
    categoryId: '',
    estimatedMinutes: 90,
    recurring: { type: 'custom', customDays: 2 },
    subtasks: [{ title: 'Warm up' }, { title: 'Main lifts' }, { title: 'Accessories' }, { title: 'Cool down' }],
    tags: ['fitness', 'health'],
  },
  {
    id: 'tpl-weekly-review',
    name: 'Weekly Review',
    icon: '📋',
    title: 'Weekly Review & Planning',
    description: 'Review past week and plan next week',
    priority: 'high',
    categoryId: '',
    estimatedMinutes: 45,
    recurring: { type: 'weekly' },
    subtasks: [{ title: 'Review completed tasks' }, { title: 'Identify blockers' }, { title: 'Plan next week priorities' }],
    tags: ['planning', 'review'],
  },
  {
    id: 'tpl-grocery',
    name: 'Grocery Shopping',
    icon: '🛒',
    title: 'Grocery Shopping',
    description: 'Weekly grocery run',
    priority: 'medium',
    categoryId: '',
    estimatedMinutes: 60,
    recurring: { type: 'weekly' },
    subtasks: [{ title: 'Check fridge' }, { title: 'Make list' }, { title: 'Go shopping' }],
    tags: ['shopping', 'personal'],
  },
];

// Kanban column definitions
export const KANBAN_COLUMNS: { id: KanbanColumn; label: string; color: string; icon: string }[] = [
  { id: 'backlog', label: 'Backlog', color: '#6b7280', icon: '📥' },
  { id: 'todo', label: 'To Do', color: '#3b82f6', icon: '📋' },
  { id: 'in_progress', label: 'In Progress', color: '#f59e0b', icon: '⚡' },
  { id: 'review', label: 'Review', color: '#8b5cf6', icon: '🔍' },
  { id: 'done', label: 'Done', color: '#22c55e', icon: '✅' },
];

// Get kanban column for a task (default to 'todo' if not set)
export function getTaskKanbanColumn(task: Task): KanbanColumn {
  if (task.completed) return 'done';
  return task.kanbanColumn || 'todo';
}

// Group tasks by kanban column
export function groupTasksByColumn(tasks: Task[]): Record<KanbanColumn, Task[]> {
  const groups: Record<KanbanColumn, Task[]> = {
    backlog: [],
    todo: [],
    in_progress: [],
    review: [],
    done: [],
  };
  
  tasks.forEach(task => {
    const column = getTaskKanbanColumn(task);
    groups[column].push(task);
  });
  
  return groups;
}

// Calculate total tracked time for a task
export function getTotalTrackedTime(task: Task): number {
  if (!task.timeEntries || task.timeEntries.length === 0) return 0;
  return task.timeEntries.reduce((sum, entry) => sum + entry.durationMs, 0);
}

// Format milliseconds to human readable
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

// Quick reschedule: push deadline by N days
export function rescheduleTask(task: Task, days: number): Task {
  const currentDue = new Date(task.dueDate);
  currentDue.setDate(currentDue.getDate() + days);
  
  // If pushing to weekend, move to Monday
  const dayOfWeek = currentDue.getDay();
  if (dayOfWeek === 0) currentDue.setDate(currentDue.getDate() + 1);
  if (dayOfWeek === 6) currentDue.setDate(currentDue.getDate() + 2);
  
  return {
    ...task,
    dueDate: currentDue.toISOString().slice(0, 16),
    reminderSent: false,
  };
}

// Snooze options
export const SNOOZE_OPTIONS = [
  { label: '1 hour', hours: 1 },
  { label: '3 hours', hours: 3 },
  { label: 'Tomorrow 9AM', hours: null, setToNextDay: true },
  { label: 'This Weekend', hours: null, setToWeekend: true },
  { label: 'Next Week', days: 7 },
  { label: 'Next Month', days: 30 },
];

// Get overdue tasks count
export function getOverdueTasks(tasks: Task[]): Task[] {
  const now = new Date();
  return tasks.filter(t => !t.completed && new Date(t.dueDate) < now);
}

// Get tasks due today
export function getTasksDueToday(tasks: Task[]): Task[] {
  const today = new Date().toISOString().slice(0, 10);
  return tasks.filter(t => !t.completed && t.dueDate.slice(0, 10) === today);
}

// Get tasks due this week
export function getTasksDueThisWeek(tasks: Task[]): Task[] {
  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
  
  return tasks.filter(t => {
    if (t.completed) return false;
    const due = new Date(t.dueDate);
    return due >= now && due <= endOfWeek;
  });
}

// Calculate task completion stats
export function getTaskStats(tasks: Task[]): {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  completionRate: number;
  avgCompletionTime: number; // in minutes
} {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  
  const completed = tasks.filter(t => t.completed);
  const pending = tasks.filter(t => !t.completed);
  const overdue = pending.filter(t => new Date(t.dueDate) < now);
  const dueToday = pending.filter(t => t.dueDate.slice(0, 10) === today);
  
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
  const dueThisWeek = pending.filter(t => {
    const due = new Date(t.dueDate);
    return due >= now && due <= endOfWeek;
  });
  
  // Average completion time
  const completionTimes = completed
    .filter(t => t.completedAt && t.createdAt)
    .map(t => {
      const created = new Date(t.createdAt).getTime();
      const completedAt = new Date(t.completedAt!).getTime();
      return (completedAt - created) / 60000; // minutes
    });
  
  const avgCompletionTime = completionTimes.length > 0
    ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
    : 0;
  
  return {
    total: tasks.length,
    completed: completed.length,
    pending: pending.length,
    overdue: overdue.length,
    dueToday: dueToday.length,
    dueThisWeek: dueThisWeek.length,
    completionRate: tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0,
    avgCompletionTime,
  };
}

// Get productivity by time of day
export function getProductivityByHour(tasks: Task[]): { hour: number; count: number; label: string }[] {
  const hourCounts: Record<number, number> = {};
  
  tasks.filter(t => t.completed && t.completedAt).forEach(t => {
    const hour = new Date(t.completedAt!).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  const hours = Array.from({ length: 24 }, (_, i) => i);
  return hours.map(h => ({
    hour: h,
    count: hourCounts[h] || 0,
    label: `${h.toString().padStart(2, '0')}:00`,
  }));
}

// Get tasks by priority distribution
export function getPriorityDistribution(tasks: Task[]): { priority: Priority; count: number; percent: number }[] {
  const priorities: Priority[] = ['urgent', 'high', 'medium', 'low'];
  const total = tasks.filter(t => !t.completed).length || 1;
  
  return priorities.map(p => ({
    priority: p,
    count: tasks.filter(t => t.priority === p && !t.completed).length,
    percent: Math.round((tasks.filter(t => t.priority === p && !t.completed).length / total) * 100),
  }));
}

// Generate tag colors from string hash
export function getTagColor(tag: string): string {
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
    '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
    '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
  ];
  
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// Get calendar grid data for a month
export function getMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay(); // 0=Sun
  const daysInMonth = lastDay.getDate();
  
  const grid: (Date | null)[] = [];
  
  // Padding for start of month
  for (let i = 0; i < startPadding; i++) {
    grid.push(null);
  }
  
  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    grid.push(new Date(year, month, d));
  }
  
  return grid;
}

// Get tasks for a specific date
export function getTasksForDate(tasks: Task[], date: Date): Task[] {
  const dateStr = date.toISOString().slice(0, 10);
  return tasks.filter(t => t.dueDate.slice(0, 10) === dateStr);
}

// Create a task from template
export function createTaskFromTemplate(template: TaskTemplate): Task {
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    title: template.title,
    description: template.description,
    priority: template.priority,
    categoryId: template.categoryId,
    completed: false,
    createdAt: new Date().toISOString(),
    dueDate: new Date().toISOString().slice(0, 16),
    estimatedMinutes: template.estimatedMinutes,
    recurring: { ...template.recurring },
    subtasks: template.subtasks.map((st, i) => ({
      id: `st-${Date.now()}-${i}`,
      title: st.title,
      completed: false,
    })),
    tags: [...template.tags],
    isImportant: template.isImportant,
    isUrgent: template.isUrgent,
    order: 0,
    kanbanColumn: 'todo',
  };
}
