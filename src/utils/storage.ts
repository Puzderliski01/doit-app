import { Category, Task } from '../types';
import { formatISODateInput } from './dateHelpers';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-work', name: 'Executive & Strategy', color: '#f59e0b', iconName: 'Briefcase', description: 'High-leverage business objectives & leadership' },
  { id: 'cat-dev', name: 'Product & Code', color: '#6366f1', iconName: 'Code2', description: 'Engineering, architecture & deployments' },
  { id: 'cat-personal', name: 'Personal & Lifestyle', color: '#ec4899', iconName: 'Compass', description: 'Personal growth, errands & life admin' },
  { id: 'cat-health', name: 'Health & Wellness', color: '#10b981', iconName: 'HeartPulse', description: 'Fitness, mindfulness & nutrition' },
  { id: 'cat-finance', name: 'Finance & Ops', color: '#38bdf8', iconName: 'Coins', description: 'Investments, accounting & budgets' }
];

export function getInitialTasks(): Task[] {
  const now = new Date();

  // Task 1: Overdue or due very soon (Urgent + Important)
  const urgentDate = new Date(now.getTime() + 1000 * 60 * 60 * 2); // 2 hours from now
  
  // Task 2: Tomorrow morning (Important)
  const tomorrowDate = new Date(now.getTime() + 1000 * 60 * 60 * 24);
  tomorrowDate.setHours(9, 30, 0, 0);

  // Task 3: Recurring daily workout
  const dailyDate = new Date(now.getTime() + 1000 * 60 * 60 * 6);
  
  // Task 4: Weekly architecture review
  const weeklyDate = new Date(now.getTime() + 1000 * 60 * 60 * 48);

  // Task 5: End of week
  const weekendDate = new Date(now.getTime() + 1000 * 60 * 60 * 96);

  return [
    {
      id: 'task-1',
      title: 'Review Q3 Mobile App Store Release Candidate',
      description: 'Audit Android AAB bundle & iOS IPA test flight builds. Verify OAuth token exchange and Firestore security rules.',
      priority: 'urgent',
      categoryId: 'cat-dev',
      completed: false,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 12).toISOString(),
      dueDate: formatISODateInput(urgentDate),
      estimatedMinutes: 45,
      recurring: { type: 'none' },
      isUrgent: true,
      isImportant: true,
      tags: ['Release', 'Mobile', 'Security'],
      reminderEmail: '',
      reminderMinutesBefore: 30,
      reminderSent: false,
      order: 1,
      subtasks: [
        { id: 'sub-1', title: 'Verify Google Play signing key certificate SHA-256', completed: true },
        { id: 'sub-2', title: 'Test offline queue synchronization on poor network', completed: false },
        { id: 'sub-3', title: 'App Store review metadata & privacy checklist', completed: false }
      ]
    },
    {
      id: 'task-2',
      title: 'Finalize Architecture Roadmap for Cross-Platform Sync',
      description: 'Prepare executive deck on local SQLite/IndexedDB caching with real-time Firebase conflict resolution.',
      priority: 'high',
      categoryId: 'cat-work',
      completed: false,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
      dueDate: formatISODateInput(tomorrowDate),
      estimatedMinutes: 60,
      recurring: { type: 'weekly' },
      isUrgent: false,
      isImportant: true,
      tags: ['Strategy', 'Architecture'],
      reminderEmail: 's.puzderliski@gmail.com',
      reminderMinutesBefore: 60,
      reminderSent: false,
      order: 2,
      subtasks: [
        { id: 'sub-4', title: 'Draft sequence diagram for offline mutate-and-replay', completed: true },
        { id: 'sub-5', title: 'Benchmark latency differences across regions', completed: false }
      ]
    },
    {
      id: 'task-3',
      title: 'Daily High-Intensity Calisthenics & Core Routine',
      description: 'Maintain athletic streak: 20m interval training, mobility stretches, and hydration tracking.',
      priority: 'medium',
      categoryId: 'cat-health',
      completed: false,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 5).toISOString(),
      dueDate: formatISODateInput(dailyDate),
      estimatedMinutes: 30,
      recurring: { type: 'daily' },
      isUrgent: true,
      isImportant: false,
      tags: ['Fitness', 'Streak'],
      reminderEmail: 's.puzderliski@gmail.com',
      reminderMinutesBefore: 15,
      reminderSent: false,
      order: 3,
      subtasks: [
        { id: 'sub-6', title: '3 Sets of 20 pushups + pullups', completed: false },
        { id: 'sub-7', title: '10 min deep hip and thoracic mobility', completed: false }
      ]
    },
    {
      id: 'task-4',
      title: 'Quarterly Investment Portfolio Balancing & Budget Audit',
      description: 'Review asset allocation, dividends reinvestment, and operational SaaS subscriptions.',
      priority: 'low',
      categoryId: 'cat-finance',
      completed: false,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString(),
      dueDate: formatISODateInput(weekendDate),
      estimatedMinutes: 90,
      recurring: { type: 'monthly' },
      isUrgent: false,
      isImportant: false,
      tags: ['Finance', 'Audit'],
      reminderEmail: 's.puzderliski@gmail.com',
      reminderMinutesBefore: 120,
      reminderSent: false,
      order: 4,
      subtasks: [
        { id: 'sub-8', title: 'Download bank CSV statements for July-August', completed: false },
        { id: 'sub-9', title: 'Prune unused cloud server subscriptions', completed: false }
      ]
    },
    {
      id: 'task-5',
      title: 'Deploy DoIT Web App & Configure PWA Manifest',
      description: 'Complete production bundling with Tailwind CSS, service worker offline caching, and responsive viewport testing.',
      priority: 'high',
      categoryId: 'cat-dev',
      completed: true,
      completedAt: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 8).toISOString(),
      dueDate: formatISODateInput(now),
      estimatedMinutes: 30,
      recurring: { type: 'none' },
      isUrgent: true,
      isImportant: true,
      tags: ['DevOps', 'Vite'],
      order: 5,
      subtasks: [
        { id: 'sub-10', title: 'Setup dark mode theme variables', completed: true },
        { id: 'sub-11', title: 'Verify Web Audio haptics on mobile browser', completed: true }
      ]
    }
  ];
}

const STORAGE_KEYS = {
  TASKS: 'doit_tasks_v2',
  CATEGORIES: 'doit_categories_v2',
  THEME: 'doit_theme_v2',
  NOTIFICATIONS: 'doit_notification_logs_v2',
  USER_EMAIL: 'doit_user_email_v2',
  LAST_SYNC: 'doit_last_sync_v2'
};

export const storage = {
  getTasks(userId?: string): Task[] {
    try {
      const key = userId ? `${STORAGE_KEYS.TASKS}_${userId}` : STORAGE_KEYS.TASKS;
      const data = localStorage.getItem(key);
      if (!data) {
        return [];
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveTasks(tasks: Task[], userId?: string) {
    try {
      const key = userId ? `${STORAGE_KEYS.TASKS}_${userId}` : STORAGE_KEYS.TASKS;
      localStorage.setItem(key, JSON.stringify(tasks));
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (e) {
      console.error('Failed to persist tasks to local storage:', e);
    }
  },

  getCategories(userId?: string): Category[] {
    try {
      const key = userId ? `${STORAGE_KEYS.CATEGORIES}_${userId}` : STORAGE_KEYS.CATEGORIES;
      const data = localStorage.getItem(key);
      if (!data) {
        return INITIAL_CATEGORIES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_CATEGORIES;
    }
  },

  saveCategories(categories: Category[], userId?: string) {
    try {
      const key = userId ? `${STORAGE_KEYS.CATEGORIES}_${userId}` : STORAGE_KEYS.CATEGORIES;
      localStorage.setItem(key, JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories:', e);
    }
  },

  getUserEmail(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.USER_EMAIL) || '';
    } catch {
      return '';
    }
  },

  saveUserEmail(email: string) {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
    } catch {}
  },

  getTheme(): 'dark' | 'light' {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.THEME);
      if (stored === 'light' || stored === 'dark') return stored;
      return 'dark';
    } catch {
      return 'dark';
    }
  },

  saveTheme(theme: 'dark' | 'light') {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {}
  },

  getLastSyncTime(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || new Date().toISOString();
    } catch {
      return new Date().toISOString();
    }
  }
};
