/**
 * DoIT — Obsidian Task & Deadline Suite
 * Ultra-luxurious, high-performance task management application.
 */

import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import {
  Task,
  Category,
  Priority,
  ViewMode,
  FilterStatus,
  NotificationLog,
  AppNotification,
  RecurringType,
  AuthUser,
  FitnessEntry,
  UserProfile,
} from './types';
import { storage } from './utils/storage';
import { haptic } from './utils/haptics';
import { isOverdue, isDueToday, isDueThisWeek } from './utils/dateHelpers';
import { calculateNextDueDate, getRecurringLabel } from './utils/recurring';
import { notificationEngine } from './utils/notificationEngine';
import { DEFAULT_USER_PROFILE, DEFAULT_FITNESS_STATS, updateFitnessStats } from './utils/fitness';

import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { TaskCard } from './components/TaskCard';
import { QuickAddBar } from './components/QuickAddBar';
import { NotificationToastContainer } from './components/NotificationToastContainer';
import { LoginPage } from './components/LoginPage';
import { OfflineIndicator } from './components/OfflineIndicator';

// Lazy load heavy components that aren't immediately visible
const TaskFormModal = lazy(() => import('./components/TaskFormModal').then(m => ({ default: m.TaskFormModal })));
const EisenhowerMatrix = lazy(() => import('./components/EisenhowerMatrix').then(m => ({ default: m.EisenhowerMatrix })));
const CalendarTimeline = lazy(() => import('./components/CalendarTimeline').then(m => ({ default: m.CalendarTimeline })));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const NotificationCenterModal = lazy(() => import('./components/NotificationCenterModal').then(m => ({ default: m.NotificationCenterModal })));
const DeploymentDocsModal = lazy(() => import('./components/DeploymentDocsModal').then(m => ({ default: m.DeploymentDocsModal })));
const AuthModal = lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const FitnessDashboard = lazy(() => import('./components/FitnessDashboard').then(m => ({ default: m.FitnessDashboard })));
const ExerciseLogModal = lazy(() => import('./components/ExerciseLogModal').then(m => ({ default: m.ExerciseLogModal })));
const FitnessOnboarding = lazy(() => import('./components/FitnessOnboarding').then(m => ({ default: m.FitnessOnboarding })));

import { 
  auth,
  subscribeToUserTasks,
  saveUserTaskToFirestore,
  deleteUserTaskFromFirestore,
  batchUpdateTasksOrderInFirestore,
  subscribeToUserCategories,
  saveUserCategoryToFirestore,
  subscribeToUserNotifications,
  saveUserNotificationToFirestore,
  markAllNotificationsReadInFirestore,
  clearAllNotificationsInFirestore,
  deleteSingleNotificationFromFirestore,
  syncUserProfile,
  getLocalAuthSession,
  saveLocalAuthSession,
  clearLocalAuthSession
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Plus, 
  CheckCircle, 
  Sparkles, 
  Inbox, 
  Clock, 
  Flame, 
  Tag, 
  ArrowUpDown,
  BookOpen,
  LogIn,
  ShieldCheck,
  UserCheck,
  Lock
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | User | null>(() => getLocalAuthSession());
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Persistence & Global State
  const [tasks, setTasks] = useState<Task[]>(() => {
    const localUser = getLocalAuthSession();
    return localUser ? storage.getTasks(localUser.uid) : [];
  });
  const [categories, setCategories] = useState<Category[]>(() => storage.getCategories());
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = storage.getTheme();
    // If no stored preference, detect system preference
    if (!stored || stored === 'dark') {
      if (typeof window !== 'undefined' && window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
      }
    }
    return stored;
  });
  const isLight = theme === 'light';
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem('doit_current_view');
      if (saved === 'fitness') return 'fitness';
    } catch { /* ignore */ }
    return 'list';
  });

  // Persist current view (only fitness sticks across refresh)
  useEffect(() => {
    if (currentView === 'fitness') {
      localStorage.setItem('doit_current_view', 'fitness');
    } else {
      localStorage.removeItem('doit_current_view');
    }
  }, [currentView]);
  // Persist theme and apply light class to document
  useEffect(() => {
    storage.saveTheme(theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.body.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.body.classList.remove('light');
    }
  }, [theme]);

  // Request browser notification permission on mount
  useEffect(() => {
    notificationEngine.requestPermission();
  }, []);

  const [userEmail, setUserEmail] = useState<string>(() => {
    const localUser = getLocalAuthSession();
    return localUser?.email || storage.getUserEmail();
  });
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(() => notificationEngine.getLogs());
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>(() => notificationEngine.getAppNotifications());
  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => storage.getLastSyncTime());

  // Modal Dialog States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);

  // Fitness State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem('doit_user_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        const merged = { ...DEFAULT_USER_PROFILE, ...parsed };
        merged.fitnessStats = { ...DEFAULT_FITNESS_STATS, ...parsed.fitnessStats };
        if (!merged.fitnessStats.muscleRanks) {
          merged.fitnessStats.muscleRanks = { ...DEFAULT_FITNESS_STATS.muscleRanks };
        }
        return merged;
      }
    } catch { /* ignore */ }
    return DEFAULT_USER_PROFILE;
  });
  const [fitnessEntries, setFitnessEntries] = useState<FitnessEntry[]>(() => {
    try {
      const stored = localStorage.getItem('doit_fitness_entries');
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return [];
  });
  const [isExerciseLogModalOpen, setIsExerciseLogModalOpen] = useState(false);
  const [isFitnessOnboardingOpen, setIsFitnessOnboardingOpen] = useState(false);

  // Filters and Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt' | 'title'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [recurringBanner, setRecurringBanner] = useState<string | null>(null);

  // Lock body scroll when any modal is open
  useEffect(() => {
    const anyModalOpen = isTaskModalOpen || isNotifModalOpen || isDocsModalOpen || isAuthModalOpen || isExerciseLogModalOpen || isFitnessOnboardingOpen;
    if (anyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isTaskModalOpen, isNotifModalOpen, isDocsModalOpen, isAuthModalOpen, isExerciseLogModalOpen, isFitnessOnboardingOpen]);

  // Firebase Auth State Listener with device session retention
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const authUser: AuthUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          isLocal: false,
          isGuest: false
        };
        saveLocalAuthSession(authUser);
        setCurrentUser(authUser);
        if (user.email) {
          setUserEmail(user.email);
        }
        syncUserProfile(authUser).catch(console.error);
      } else {
        const localSession = getLocalAuthSession();
        if (localSession) {
          setCurrentUser(localSession);
          if (localSession.email) setUserEmail(localSession.email);
        } else {
          setCurrentUser(null);
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // Whether the current user can sync to Firestore (only real Firebase-authenticated users)
  const canSyncToFirestore = currentUser && !(currentUser as AuthUser).isGuest && !(currentUser as AuthUser).isLocal;

  // Track pending local writes that haven't been confirmed by Firestore yet
  const pendingWritesRef = useRef<Map<string, Task>>(new Map());
  const pendingDeletesRef = useRef<Set<string>>(new Set());

  // Real-time Firestore Sync for Authenticated User (Disabled in Guest & Local Mode)
  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      return;
    }

    const isGuest = (currentUser as AuthUser).isGuest ?? false;
    const isLocal = (currentUser as AuthUser).isLocal ?? false;

    // In Guest Mode or Local Mode, load only from local storage
    if (isGuest || isLocal) {
      const userTasks = storage.getTasks(currentUser.uid);
      setTasks(userTasks);
      return;
    }

    // Authenticated User: first load cached tasks for this user
    const cached = storage.getTasks(currentUser.uid);
    if (cached && cached.length > 0) {
      setTasks(cached);
    }

    const unsubscribeTasks = subscribeToUserTasks(
      currentUser.uid,
      (userTasks) => {
        setTasks(prev => {
          const pending = pendingWritesRef.current;
          const deletes = pendingDeletesRef.current;
          if (pending.size === 0 && deletes.size === 0) {
            storage.saveTasks(userTasks, currentUser.uid);
            setLastSyncTime(new Date().toISOString());
            return userTasks;
          }
          // Start with Firestore data, excluding any pending deletes
          const firestoreMap = new Map(userTasks.filter(t => !deletes.has(t.id)).map(t => [t.id, t]));
          // Overlay pending writes (new + edited tasks)
          for (const [id, localTask] of pending) {
            firestoreMap.set(id, localTask);
          }
          const merged = Array.from(firestoreMap.values());
          storage.saveTasks(merged, currentUser.uid);
          setLastSyncTime(new Date().toISOString());
          return merged;
        });
      },
      (err) => {
        console.warn('Firestore user tasks subscription note:', err);
      }
    );

    const unsubscribeCats = subscribeToUserCategories(
      currentUser.uid,
      (userCats) => {
        if (userCats && userCats.length > 0) {
          setCategories(userCats);
        }
      }
    );

    const unsubscribeNotifs = subscribeToUserNotifications(
      currentUser.uid,
      (userNotifs) => {
        if (userNotifs) {
          setAppNotifications(userNotifs);
        }
      }
    );

    return () => {
      unsubscribeTasks();
      unsubscribeCats();
      unsubscribeNotifs();
    };
  }, [currentUser?.uid]);

  // Sync to localStorage as offline cache for current user / guest
  useEffect(() => {
    if (currentUser?.uid) {
      storage.saveTasks(tasks, currentUser.uid);
    }
    setLastSyncTime(new Date().toISOString());
  }, [tasks, currentUser?.uid]);

  useEffect(() => {
    storage.saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    storage.saveUserEmail(userEmail);
  }, [userEmail]);

  // Fitness persistence
  useEffect(() => {
    localStorage.setItem('doit_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('doit_fitness_entries', JSON.stringify(fitnessEntries));
  }, [fitnessEntries]);

  const triggerAppNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const created = notificationEngine.pushAppNotification(notif);
    setAppNotifications(prev => [created, ...prev.filter(n => n.id !== created.id)].slice(0, 50));
    setActiveToasts(prev => [created, ...prev.filter(t => t.id !== created.id)].slice(0, 3));
    
    // Auto-dismiss live toast after 4.5 seconds
    setTimeout(() => {
      setActiveToasts(prev => prev.filter(t => t.id !== created.id));
    }, 4500);

    if (currentUser && !(currentUser as AuthUser).isGuest) {
      saveUserNotificationToFirestore(currentUser.uid, created).catch(console.error);
    }
  };

  const handleDismissToast = (id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
    setAppNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (currentUser && !(currentUser as AuthUser).isGuest) {
      markAllNotificationsReadInFirestore(currentUser.uid, [id]).catch(console.error);
    }
  };

  const handleDeleteNotification = (id: string) => {
    notificationEngine.deleteAppNotification(id);
    setAppNotifications(prev => prev.filter(n => n.id !== id));
    setActiveToasts(prev => prev.filter(t => t.id !== id));
    if (currentUser && !(currentUser as AuthUser).isGuest) {
      deleteSingleNotificationFromFirestore(currentUser.uid, id).catch(console.error);
    }
  };

  const handleClearAllAppNotifications = () => {
    const ids = appNotifications.map(n => n.id);
    notificationEngine.saveAppNotifications([]);
    setAppNotifications([]);
    setActiveToasts([]);
    if (currentUser && !(currentUser as AuthUser).isGuest && ids.length > 0) {
      clearAllNotificationsInFirestore(currentUser.uid, ids).catch(console.error);
    }
  };

  const handleMarkAllRead = () => {
    const ids = appNotifications.map(n => n.id);
    notificationEngine.markAllAsRead();
    setAppNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (currentUser && !(currentUser as AuthUser).isGuest && ids.length > 0) {
      markAllNotificationsReadInFirestore(currentUser.uid, ids).catch(console.error);
    }
  };

  const handleToastAction = (notif: AppNotification) => {
    if (notif.actionType === 'open_matrix') {
      setCurrentView('matrix');
    } else if (notif.actionType === 'open_calendar') {
      setCurrentView('calendar');
    } else if (notif.taskId) {
      const target = tasks.find(t => t.id === notif.taskId);
      if (target) {
        setEditingTask(target);
        setIsTaskModalOpen(true);
      }
    }
  };

  // Online / Offline Detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerAppNotification({
        type: 'sync',
        title: '🌐 Online Connection Restored',
        message: 'Synchronized offline queue with cloud database.',
      });
    };
    const handleOffline = () => {
      setIsOnline(false);
      triggerAppNotification({
        type: 'sync',
        title: '⚡ Offline Mode Active',
        message: 'All changes are cached securely in local storage and will sync automatically.',
      });
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Keyboard Shortcuts Listener (N for new task, / for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        haptic.mediumClick();
        setEditingTask(null);
        setIsTaskModalOpen(true);
      }
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('main-search-input');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Background Deadline & Reminder Checker Engine (every 25 seconds)
  useEffect(() => {
    const checkReminders = () => {
      const now = Date.now();
      tasks.forEach((task) => {
        if (!task.completed && task.dueDate && !task.reminderSent) {
          const dueTime = new Date(task.dueDate).getTime();
          const minutesBefore = task.reminderMinutesBefore || 30;
          const triggerWindowMs = minutesBefore * 60 * 1000;
          const diff = dueTime - now;

          // If due within the trigger window or slightly past
          if (diff <= triggerWindowMs && diff > -1000 * 60 * 60) {
            const log = notificationEngine.dispatchEmailReminder(task, userEmail);
            setNotificationLogs(prev => [log, ...prev].slice(0, 50));
            // Mark reminderSent on task
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, reminderSent: true } : t));
          }
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 25000);
    return () => clearInterval(interval);
  }, [tasks, userEmail]);

  // Handlers for Task CRUD & Recurrence
  const handleToggleComplete = (task: Task) => {
    const isNowCompleted = !task.completed;
    let updatedTask: Task;

    if (isNowCompleted && task.recurring && task.recurring.type !== 'none') {
      // Recurring task completed!
      const nextDue = calculateNextDueDate(task.dueDate, task.recurring);
      
      // Update original or advance to next iteration
      updatedTask = {
        ...task,
        completed: false, // Reset completion for next cycle
        dueDate: nextDue,
        reminderSent: false,
        createdAt: new Date().toISOString(),
        subtasks: task.subtasks.map(st => ({ ...st, completed: false })) // Reset subtasks for next round
      };

      const bannerMsg = `"${task.title}" marked complete! Next cycle scheduled for ${new Date(nextDue).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} (${getRecurringLabel(task.recurring)}).`;
      setRecurringBanner(bannerMsg);
      setTimeout(() => setRecurringBanner(null), 6000);

      triggerAppNotification({
        type: 'recurring',
        title: '🔁 Recurring Cycle Advanced',
        message: `"${task.title}" rescheduled for next cycle (${getRecurringLabel(task.recurring)}).`
      });

    } else {
      updatedTask = {
        ...task,
        completed: isNowCompleted,
        completedAt: isNowCompleted ? new Date().toISOString() : undefined
      };

      if (isNowCompleted) {
        triggerAppNotification({
          type: 'achievement',
          title: '🎉 Task Completed!',
          message: `Great job! "${task.title}" has been marked complete.`,
          actionLabel: 'Analytics'
        });
      }
    }

    setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
    if (canSyncToFirestore) {
      pendingWritesRef.current.set(updatedTask.id, updatedTask);
      saveUserTaskToFirestore(currentUser!.uid, updatedTask)
        .then(() => { pendingWritesRef.current.delete(updatedTask.id); })
        .catch(console.error);
    }
  };

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      // Update existing
      const updated: Task = { ...editingTask, ...taskData } as Task;
      setTasks(prev => prev.map(t => t.id === editingTask.id ? updated : t));
      if (canSyncToFirestore) {
        pendingWritesRef.current.set(updated.id, updated);
        saveUserTaskToFirestore(currentUser!.uid, updated)
          .then(() => { pendingWritesRef.current.delete(updated.id); })
          .catch(console.error);
      }
    } else {
      // Create new
      const newTask: Task = {
        id: 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        title: taskData.title || 'Untitled Task',
        description: taskData.description || '',
        priority: taskData.priority || 'high',
        categoryId: taskData.categoryId || categories[0]?.id || 'cat-work',
        completed: false,
        createdAt: new Date().toISOString(),
        dueDate: taskData.dueDate || new Date().toISOString(),
        estimatedMinutes: taskData.estimatedMinutes || 30,
        recurring: taskData.recurring || { type: 'none' },
        subtasks: taskData.subtasks || [],
        tags: taskData.tags || [],
        reminderEmail: taskData.reminderEmail || userEmail,
        reminderMinutesBefore: taskData.reminderMinutesBefore || 30,
        reminderSent: false,
        isImportant: taskData.isImportant ?? true,
        isUrgent: taskData.isUrgent ?? false,
        order: tasks.length + 1
      };
      setTasks(prev => [newTask, ...prev]);

      if (canSyncToFirestore) {
        pendingWritesRef.current.set(newTask.id, newTask);
        saveUserTaskToFirestore(currentUser!.uid, newTask)
          .then(() => { pendingWritesRef.current.delete(newTask.id); })
          .catch(console.error);
      }

      if (newTask.priority === 'urgent') {
        triggerAppNotification({
          type: 'urgent_priority',
          title: '🚨 Urgent Priority Task Added',
          message: `"${newTask.title}" requires immediate focus.`,
          actionLabel: 'View Task',
          actionType: 'view_task',
          taskId: newTask.id
        });
      }
    }
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (canSyncToFirestore) {
      pendingDeletesRef.current.add(taskId);
      deleteUserTaskFromFirestore(currentUser!.uid, taskId)
        .then(() => { pendingDeletesRef.current.delete(taskId); })
        .catch(console.error);
    }
  };

  const handleDuplicateTask = (task: Task) => {
    const duplicated: Task = {
      ...task,
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title: `${task.title} (Copy)`,
      completed: false,
      completedAt: undefined,
      createdAt: new Date().toISOString(),
      reminderSent: false,
      subtasks: task.subtasks.map(s => ({ ...s, id: 'sub-' + Math.random().toString(36).substring(2, 6), completed: false }))
    };
    setTasks(prev => [duplicated, ...prev]);
    if (canSyncToFirestore) {
      pendingWritesRef.current.set(duplicated.id, duplicated);
      saveUserTaskToFirestore(currentUser!.uid, duplicated)
        .then(() => { pendingWritesRef.current.delete(duplicated.id); })
        .catch(console.error);
    }
  };

  const handleChangePriority = (taskId: string, priority: Priority) => {
    let updatedTask: Task | null = null;
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        updatedTask = {
          ...t,
          priority,
          isUrgent: priority === 'urgent',
          isImportant: priority === 'urgent' || priority === 'high'
        };
        return updatedTask;
      }
      return t;
    }));
    if (canSyncToFirestore && updatedTask) {
      pendingWritesRef.current.set(updatedTask.id, updatedTask);
      saveUserTaskToFirestore(currentUser!.uid, updatedTask)
        .then(() => { pendingWritesRef.current.delete(updatedTask.id); })
        .catch(console.error);
    }
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    let updatedTask: Task | null = null;
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        let isNowAllComplete = false;
        const updatedSubtasks = t.subtasks.map(st => {
          if (st.id === subtaskId) {
            const nextCompleted = !st.completed;
            return { ...st, completed: nextCompleted };
          }
          return st;
        });

        const completedCount = updatedSubtasks.filter(s => s.completed).length;
        if (completedCount === updatedSubtasks.length && updatedSubtasks.length > 0) {
          isNowAllComplete = true;
        }

        if (isNowAllComplete) {
          triggerAppNotification({
            type: 'subtask_complete',
            title: '✨ Subtasks 100% Complete!',
            message: `All subtasks for "${t.title}" are finished! Ready to complete task.`,
            taskId: t.id,
            actionLabel: 'View Task',
            actionType: 'view_task'
          });
        }

        updatedTask = { ...t, subtasks: updatedSubtasks };
        return updatedTask;
      }
      return t;
    }));

    if (canSyncToFirestore && updatedTask) {
      pendingWritesRef.current.set(updatedTask.id, updatedTask);
      saveUserTaskToFirestore(currentUser!.uid, updatedTask)
        .then(() => { pendingWritesRef.current.delete(updatedTask.id); })
        .catch(console.error);
    }
  };

  const handleMoveQuadrant = (task: Task, isUrgent: boolean, isImportant: boolean, priority: Priority) => {
    const updated = { ...task, isUrgent, isImportant, priority };
    setTasks(prev => prev.map(t => {
      if (t.id === task.id) {
        return updated;
      }
      return t;
    }));
    if (canSyncToFirestore) {
      pendingWritesRef.current.set(updated.id, updated);
      saveUserTaskToFirestore(currentUser!.uid, updated)
        .then(() => { pendingWritesRef.current.delete(updated.id); })
        .catch(console.error);
    }
  };

  const handleQuickAdd = (data: {
    title: string;
    priority: Priority;
    categoryId: string;
    dueDate: string;
    recurringType: RecurringType;
  }) => {
    const newTask: Task = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title: data.title,
      description: '',
      priority: data.priority,
      categoryId: data.categoryId,
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: data.dueDate,
      estimatedMinutes: 30,
      recurring: { type: data.recurringType },
      subtasks: [],
      tags: [],
      reminderEmail: userEmail,
      reminderMinutesBefore: 30,
      reminderSent: false,
      isImportant: data.priority === 'urgent' || data.priority === 'high',
      isUrgent: data.priority === 'urgent',
      order: 1
    };
    setTasks(prev => [newTask, ...prev]);
    if (canSyncToFirestore) {
      pendingWritesRef.current.set(newTask.id, newTask);
      saveUserTaskToFirestore(currentUser!.uid, newTask)
        .then(() => { pendingWritesRef.current.delete(newTask.id); })
        .catch(console.error);
    }
  };

  const handleTriggerTestEmail = (task: Task, email: string) => {
    const log = notificationEngine.dispatchEmailReminder(task, email);
    setNotificationLogs(prev => [log, ...prev]);
  };

  // Fitness Handlers
  const handleSaveFitnessEntry = (entry: FitnessEntry) => {
    setFitnessEntries(prev => [entry, ...prev]);
    setUserProfile(prev => ({
      ...prev,
      fitnessStats: updateFitnessStats(prev.fitnessStats, entry),
    }));
    triggerAppNotification({
      type: 'achievement',
      title: '🏋️ Workout Logged!',
      message: `${entry.exerciseName}: ${entry.sets.filter(s => s.completed).length} sets, ${entry.totalVolume} ${entry.sets[0]?.weightUnit || 'kg'}`,
    });
  };

  const handleFitnessOnboardingComplete = (data: {
    fitnessMode: boolean;
    weightUnit: 'kg' | 'lbs';
    bodyWeight?: number;
    heightCm?: number;
    goals?: ('lose_weight' | 'gain_muscle' | 'maintain' | 'strength' | 'endurance')[];
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  }) => {
    setUserProfile(prev => ({
      ...prev,
      ...data,
      onboardingCompleted: true,
    }));
    setIsFitnessOnboardingOpen(false);
    if (data.fitnessMode) {
      setCurrentView('fitness');
    }
  };

  const handleSelectExercise = (_exerciseId: string) => {
    setIsExerciseLogModalOpen(true);
  };

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = (task.description || '').toLowerCase().includes(q);
        const matchesTag = task.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesTag) return false;
      }

      // Priority
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      // Category
      if (categoryFilter !== 'all' && task.categoryId !== categoryFilter) {
        return false;
      }

      // Status
      if (statusFilter === 'pending' && task.completed) return false;
      if (statusFilter === 'completed' && !task.completed) return false;
      if (statusFilter === 'today' && (!isDueToday(task.dueDate) || task.completed)) return false;
      if (statusFilter === 'upcoming' && (!isDueThisWeek(task.dueDate) || task.completed)) return false;
      if (statusFilter === 'overdue' && !isOverdue(task.dueDate, task.completed)) return false;

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'dueDate') {
        comparison = new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
      } else if (sortBy === 'priority') {
        const rank: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
        comparison = rank[b.priority] - rank[a.priority];
      } else if (sortBy === 'createdAt') {
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [tasks, searchQuery, priorityFilter, categoryFilter, statusFilter, sortBy, sortOrder]);

  const categoriesMap = useMemo(() => {
    return new Map(categories.map(c => [c.id, c]));
  }, [categories]);

  const pendingCount = tasks.filter(t => !t.completed).length;
  const overdueCount = tasks.filter(t => isOverdue(t.dueDate, t.completed)).length;
  const todayCount = tasks.filter(t => isDueToday(t.dueDate) && !t.completed).length;

  const handleLogout = async () => {
    clearLocalAuthSession();
    setCurrentUser(null);
    setTasks([]);
    setAppNotifications([]);
    setActiveToasts([]);
    setIsAuthModalOpen(false);
  };

  // If restoring existing device session, show sleek obsidian loader
  if (authLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center p-6 selection:bg-orange-500/30">
        <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-orange-400 mb-5 shadow-[0_0_35px_rgba(245,158,11,0.15)] animate-pulse">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="text-sm font-semibold tracking-tight text-white/90">Restoring Obsidian Workspace...</div>
        <div className="text-xs text-white/40 mt-1">Reconnecting secure device session</div>
      </div>
    );
  }

  // First Screen: Show Login Page if no user is signed in and no guest session active
  if (!currentUser) {
    return (
      <LoginPage
        onAuthSuccess={(user) => {
          saveLocalAuthSession(user);
          setCurrentUser(user);
          if (user.email) setUserEmail(user.email);
        }}
        onContinueGuest={() => {
          const guestUser: AuthUser = {
            uid: 'guest_user',
            email: null,
            displayName: 'Guest',
            photoURL: null,
            isLocal: true,
            isGuest: true
          };
          saveLocalAuthSession(guestUser);
          setCurrentUser(guestUser);
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen text-white selection:bg-orange-500/30 selection:text-white transition-colors duration-200 relative overflow-x-hidden ${
      theme === 'light' ? 'bg-[#f8fafc]' : 'bg-[#050508]'
    }`}>

      {/* Offline Indicator */}
      <OfflineIndicator isOnline={isOnline} theme={theme} />

      {/* Background ambient lighting */}
      {theme === 'dark' && (
        <>
          <div className="fixed top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="fixed bottom-10 right-1/4 w-[30rem] h-[30rem] bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
        </>
      )}

      {/* Main Header Navigation */}
        <Navbar
          currentView={currentView}
          onViewChange={setCurrentView}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onOpenNewTask={() => {
            setEditingTask(null);
            setIsTaskModalOpen(true);
          }}
          onOpenNotifications={() => setIsNotifModalOpen(true)}
          onOpenDocs={() => setIsDocsModalOpen(true)}
          unreadNotifsCount={appNotifications.filter(n => !n.read).length}
          lastSyncTime={lastSyncTime}
          isOnline={isOnline}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />

        {/* Guest User Workspace Notice Banner */}
        {currentUser?.isGuest && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-200">
                    Guest Mode Active • Local Storage Only (No Cloud Sync)
                  </p>
                  <p className="text-[11px] text-white/50">
                    You can create and manage tasks on this device. Sign in to automatically sync and access your tasks across all your phones, tablets, and computers.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] active:scale-95 cursor-pointer shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In to Sync</span>
              </button>
            </div>
          </div>
        )}

        {/* Recurring Task Auto-Schedule Toast Banner */}
        <AnimatePresence>
          {recurringBanner && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4"
            >
              <div className="p-4 rounded-3xl bg-cyan-950/60 border border-cyan-500/30 backdrop-blur-xl text-cyan-300 text-xs font-semibold flex items-center justify-between shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{recurringBanner}</span>
                </div>
                <button
                  onClick={() => setRecurringBanner(null)}
                  className="text-cyan-400 hover:text-cyan-200 ml-3 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Workspace */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mobile-nav-spacer">
          
          {/* VIEW 1: ALL TASKS / LIST VIEW */}
          {currentView === 'list' && (
            <div className="space-y-6">
              
              {/* Quick Add Bar */}
              <QuickAddBar
                categories={categories}
                theme={theme}
                onAddTask={handleQuickAdd}
              />

              {/* Filter & Toolbar Area */}
              <div className={`p-5 rounded-3xl border backdrop-blur-xl space-y-4 shadow-xl ${isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/[0.03]'}`}>
                
                {/* Top Row: Search & Sort */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Search input */}
                  <div className="relative flex-1 max-w-md">
                    <Search className={`w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
                    <input
                      id="main-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tasks, notes, or tags... (Press '/' to focus)"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all ${isLight ? 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400' : 'border-white/10 bg-white/5 text-white placeholder:text-white/30'}`}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-xs cursor-pointer ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-white/40 hover:text-white'}`}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Right: Sort options */}
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                      <ArrowUpDown className={`w-3.5 h-3.5 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
                      <span className={`${isLight ? 'text-slate-400' : 'text-white/40'} text-[10px] font-bold uppercase tracking-wider`}>Sort:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => {
                          haptic.lightTap();
                          setSortBy(e.target.value as 'dueDate' | 'priority' | 'createdAt' | 'title');
                        }}
                        className={`bg-transparent text-xs font-semibold focus:outline-none cursor-pointer ${isLight ? 'text-slate-700' : 'text-white'}`}
                      >
                        <option value="dueDate" className={isLight ? "bg-white text-slate-900" : "bg-[#121216] text-white"}>Deadline</option>
                        <option value="priority" className={isLight ? "bg-white text-slate-900" : "bg-[#121216] text-white"}>Priority</option>
                        <option value="createdAt" className={isLight ? "bg-white text-slate-900" : "bg-[#121216] text-white"}>Created</option>
                        <option value="title" className={isLight ? "bg-white text-slate-900" : "bg-[#121216] text-white"}>Alphabetical</option>
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        haptic.lightTap();
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                      className={`p-2.5 rounded-2xl border text-xs font-bold transition-colors cursor-pointer ${isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white'}`}
                      title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>

                </div>

                {/* Bottom Row: Status Filter Chips & Priority Filters */}
                <div className={`flex flex-wrap items-center justify-between gap-3 pt-3 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                  
                  {/* Status pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'all', label: 'All Tasks', count: tasks.length },
                      { id: 'pending', label: 'Pending', count: pendingCount },
                      { id: 'today', label: 'Due Today', count: todayCount },
                      { id: 'overdue', label: 'Overdue', count: overdueCount },
                      { id: 'completed', label: 'Completed', count: tasks.filter(t => t.completed).length }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          haptic.lightTap();
                          setStatusFilter(item.id as FilterStatus);
                        }}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                          statusFilter === item.id
                            ? isLight
                              ? 'bg-slate-900 text-white font-bold shadow-[0_0_15px_rgba(0,0,0,0.15)]'
                              : 'bg-white text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                            : isLight
                              ? 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900'
                              : 'bg-white/5 border border-white/10 text-white/50 hover:text-white'
                        }`}
                      >
                        <span>{item.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          statusFilter === item.id
                            ? isLight
                              ? 'bg-white text-slate-900 font-black'
                              : 'bg-black text-white font-black'
                            : isLight
                              ? 'bg-slate-200 text-slate-600'
                              : 'bg-white/10 text-white/60'
                        }`}>
                          {item.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Priority & Category Dropdowns */}
                  <div className="flex items-center gap-2">
                    
                    {/* Priority Selector */}
                    <select
                      value={priorityFilter}
                      onChange={(e) => {
                        haptic.lightTap();
                        setPriorityFilter(e.target.value as Priority | 'all');
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none cursor-pointer ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-white/80'}`}
                    >
                      <option value="all" className={isLight ? "bg-white text-slate-900" : "bg-[#121216] text-white"}>All Priorities</option>
                      <option value="urgent" className={isLight ? "bg-white text-slate-900" : "bg-[#121216] text-white"}>Urgent Priority</option>
                      <option value="high" className={isLight ? "bg-white text-slate-900" : "bg-[#121216] text-white"}>High Priority</option>
                      <option value="medium" className={isLight ? "bg-white text-slate-900" : "bg-[#121216] text-white"}>Medium Priority</option>
                      <option value="low" className={isLight ? "bg-white text-slate-900" : "bg-[#121216] text-white"}>Low Priority</option>
                    </select>

                    {/* Category Selector */}
                    <select
                      value={categoryFilter}
                      onChange={(e) => {
                        haptic.lightTap();
                        setCategoryFilter(e.target.value);
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none cursor-pointer ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-white/80'}`}
                    >
                      <option value="all" className={isLight ? "bg-white text-slate-900" : "bg-[#121216] text-white"}>All Domains</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id} className={isLight ? "bg-white text-slate-900" : "bg-[#121216] text-white"}>{c.name}</option>
                      ))}
                    </select>

                  </div>

                </div>

              </div>

              {/* Task Cards List */}
              <div className="space-y-3">
                {filteredTasks.length === 0 ? (
                  <div className="p-12 sm:p-16 text-center rounded-3xl bg-white/[0.02] border border-dashed border-white/10 backdrop-blur-md">
                    <Inbox className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <h3 className="text-base font-medium text-white">
                      {currentUser ? 'Your personal workspace is clear' : 'No tasks in current view'}
                    </h3>
                    <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto leading-relaxed">
                      {currentUser 
                        ? 'All tasks shown here are private to your authenticated account. Ready to schedule your next objective?'
                        : 'Sign in to access and synchronize your personal tasks securely, or deploy a new task now.'}
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      {!currentUser && (
                        <button
                          onClick={() => {
                            haptic.mediumClick();
                            setIsAuthModalOpen(true);
                          }}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95 transition-all cursor-pointer"
                        >
                          <LogIn className="w-4 h-4" />
                          <span>Sign In to My Tasks</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          haptic.mediumClick();
                          setEditingTask(null);
                          setIsTaskModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-white/90 active:scale-95 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Deploy New Task</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {filteredTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        category={categoriesMap.get(task.categoryId)}
                        theme={theme}
                        onToggleComplete={handleToggleComplete}
                        onEdit={(t) => {
                          setEditingTask(t);
                          setIsTaskModalOpen(true);
                        }}
                        onDelete={handleDeleteTask}
                        onDuplicate={handleDuplicateTask}
                        onChangePriority={handleChangePriority}
                        onToggleSubtask={handleToggleSubtask}
                        onTriggerEmailReminder={(t) => {
                          handleTriggerTestEmail(t, userEmail);
                          setIsNotifModalOpen(true);
                        }}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>

            </div>
          )}

          {/* VIEW 2: EISENHOWER DECISION MATRIX */}
          {currentView === 'matrix' && (
            <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="text-sm text-white/40">Loading...</div></div>}>
              <EisenhowerMatrix
                tasks={tasks}
                categories={categories}
                theme={theme}
                onToggleComplete={handleToggleComplete}
                onEditTask={(t) => {
                  setEditingTask(t);
                  setIsTaskModalOpen(true);
                }}
                onMoveQuadrant={handleMoveQuadrant}
                onOpenNewTask={() => {
                  setEditingTask(null);
                  setIsTaskModalOpen(true);
                }}
              />
            </Suspense>
          )}

          {/* VIEW 3: TIMELINE & CALENDAR */}
          {currentView === 'calendar' && (
            <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="text-sm text-white/40">Loading...</div></div>}>
              <CalendarTimeline
                tasks={tasks}
                categories={categories}
                theme={theme}
                onToggleComplete={handleToggleComplete}
                onEditTask={(t) => {
                  setEditingTask(t);
                  setIsTaskModalOpen(true);
                }}
                onOpenNewTask={() => {
                  setEditingTask(null);
                  setIsTaskModalOpen(true);
                }}
              />
            </Suspense>
          )}

          {/* VIEW 4: INSIGHTS & ANALYTICS */}
          {currentView === 'analytics' && (
            <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="text-sm text-white/40">Loading...</div></div>}>
              <AnalyticsDashboard
                tasks={tasks}
                categories={categories}
                theme={theme}
              />
            </Suspense>
          )}

          {/* VIEW 5: BUILD & NATIVE APP STORE DOCS */}
          {currentView === 'docs' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-5 h-5 text-orange-400" />
                    <h2 className="text-lg font-light text-white tracking-tight">
                      Cross-Platform Build & Mobile Architecture Documentation
                    </h2>
                  </div>
                  <p className="text-xs text-white/50">
                    Comprehensive setup guides for React Native (iOS & Android), Firebase sync, and store deployments.
                  </p>
                </div>
                <button
                  onClick={() => setIsDocsModalOpen(true)}
                  className="px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-white/90 active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
                >
                  Open Full Guide
                </button>
              </div>

              {/* Inline preview of setup docs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
                  <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest">
                    Target Project Path
                  </h3>
                  <code className="block p-3.5 rounded-2xl bg-black/60 text-xs font-mono text-white/80 border border-white/10">
                    C:\Users\spuzd\OneDrive\Documents\VS Code\DoIT
                  </code>
                  <p className="text-xs text-white/50">
                    Run <code className="text-orange-400 font-mono">npm run dev</code> for web, or <code className="text-cyan-400 font-mono">npx expo start</code> for simultaneous iOS & Android testing.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
                  <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                    Simultaneous Store Releases
                  </h3>
                  <p className="text-xs text-white/50">
                    Use EAS Build to compile Google Play Store <code className="text-white font-mono">.aab</code> and Apple App Store <code className="text-white font-mono">.ipa</code> binaries simultaneously with automated signing keys.
                  </p>
                  <button
                    onClick={() => setIsDocsModalOpen(true)}
                    className="text-xs font-bold text-orange-400 hover:underline cursor-pointer"
                  >
                    View EAS CLI Commands →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 6: FITNESS DASHBOARD */}
          {currentView === 'fitness' && (
            <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="text-sm text-white/40">Loading...</div></div>}>
              {!userProfile.onboardingCompleted ? (
                <div className="text-center py-16">
                  <p className={`text-sm mb-4 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                    Set up your fitness profile to get started
                  </p>
                  <button
                    onClick={() => setIsFitnessOnboardingOpen(true)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-sm shadow-lg shadow-amber-500/25 active:scale-[0.99] transition-all"
                  >
                    Start Onboarding
                  </button>
                </div>
              ) : (
                <FitnessDashboard
                  theme={theme}
                  stats={userProfile.fitnessStats}
                  userProfile={userProfile}
                  entries={fitnessEntries}
                  onOpenLogModal={() => setIsExerciseLogModalOpen(true)}
                  onSelectExercise={handleSelectExercise}
                />
              )}
            </Suspense>
          )}

        </main>

        {/* Task Creation & Editing Modal */}
        <Suspense fallback={null}>
          <TaskFormModal
            isOpen={isTaskModalOpen}
            onClose={() => {
              setIsTaskModalOpen(false);
              setEditingTask(null);
            }}
            onSave={handleSaveTask}
            categories={categories}
            initialTask={editingTask}
            theme={theme}
          />
        </Suspense>

        {/* Notification & Email Dispatch Center Modal */}
        <Suspense fallback={null}>
          <NotificationCenterModal
            isOpen={isNotifModalOpen}
            onClose={() => setIsNotifModalOpen(false)}
            logs={notificationLogs}
            tasks={tasks}
            appNotifications={appNotifications}
            userEmail={userEmail}
            onUpdateEmail={setUserEmail}
            onClearLogs={() => {
              notificationEngine.saveLogs([]);
              setNotificationLogs([]);
            }}
            onClearAppNotifications={handleClearAllAppNotifications}
            onDeleteNotification={handleDeleteNotification}
            onMarkAllRead={handleMarkAllRead}
            onTriggerAppNotification={triggerAppNotification}
            onSendTestReminder={handleTriggerTestEmail}
            theme={theme}
          />
        </Suspense>

        {/* Build & Store Deployment Documentation Modal */}
        <Suspense fallback={null}>
          <DeploymentDocsModal
            isOpen={isDocsModalOpen}
            onClose={() => setIsDocsModalOpen(false)}
            theme={theme}
          />
        </Suspense>

        {/* Firebase Authentication Modal (Google / Email Login & Signup) */}
        <Suspense fallback={null}>
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            currentUser={currentUser}
            onLogout={handleLogout}
            theme={theme}
            onAuthSuccess={(user) => {
              if ((currentUser as AuthUser)?.isGuest && tasks.length > 0) {
                // Seamlessly upload local guest tasks to the user's new Firestore account
                tasks.forEach((task) => {
                  saveUserTaskToFirestore(user.uid, task).catch(console.error);
                });
                storage.saveTasks(tasks, user.uid);
              }
              saveLocalAuthSession(user);
              setCurrentUser(user);
              if (user.email) setUserEmail(user.email);
              setIsAuthModalOpen(false);
            }}
          />
        </Suspense>

        {/* Exercise Log Modal */}
        <Suspense fallback={null}>
          <ExerciseLogModal
            isOpen={isExerciseLogModalOpen}
            onClose={() => setIsExerciseLogModalOpen(false)}
            onSave={handleSaveFitnessEntry}
            theme={theme}
            weightUnit={userProfile.weightUnit}
          />
        </Suspense>

        {/* Fitness Onboarding Modal */}
        <Suspense fallback={null}>
          <FitnessOnboarding
            isOpen={isFitnessOnboardingOpen}
            onClose={() => setIsFitnessOnboardingOpen(false)}
            onComplete={handleFitnessOnboardingComplete}
            theme={theme}
          />
        </Suspense>

        {/* In-App Floating Toast Notifications (Live alerts only, never historical unread spam) */}
        <NotificationToastContainer
          notifications={activeToasts}
          onDismiss={handleDismissToast}
          onAction={handleToastAction}
          theme={theme}
        />

        {/* Bottom Mobile Navigation */}
        <MobileNav
          currentView={currentView}
          onViewChange={setCurrentView}
          theme={theme}
        />

      </div>
  );
}
