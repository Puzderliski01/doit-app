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
import { setLanguage, t } from './i18n';

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
const Leaderboard = lazy(() => import('./components/Leaderboard').then(m => ({ default: m.Leaderboard })));
const TrainerDashboard = lazy(() => import('./components/TrainerDashboard').then(m => ({ default: m.TrainerDashboard })));
const Settings = lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));

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
  subscribeToUserFitness,
  saveFitnessEntryToFirestore,
  saveUserProfileToFirestore,
  subscribeToUserProfile,
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
  Lock,
  Trophy,
  CheckSquare,
  Dumbbell,
  LayoutGrid
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
    if (stored === 'dark' || stored === 'light') return stored;
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });
  const isLight = theme === 'light';

  // Listen for system theme changes and auto-switch if user hasn't manually set a preference
  useEffect(() => {
    const stored = storage.getTheme();
    if (stored) return; // User has a manual preference, don't override
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem('doit_current_view');
      if (saved === 'fitness') return 'fitness';
      if (saved === 'tasks') return 'tasks';
      if (saved === 'home') return 'home';
      if (saved === 'settings') return 'settings';
    } catch { /* ignore */ }
    return 'home';
  });

  // Sub-views within grouped views
  const [taskSubView, setTaskSubView] = useState<'list' | 'matrix'>('list');
  const [fitnessSubView, setFitnessSubView] = useState<'dashboard' | 'trainer' | 'ranks'>('dashboard');

  // Persist current view
  useEffect(() => {
    localStorage.setItem('doit_current_view', currentView);
  }, [currentView]);
  // Apply theme class to document (don't auto-save - only save on manual toggle)
  useEffect(() => {
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

  // Apply language from user profile
  useEffect(() => {
    if (userProfile.language) {
      setLanguage(userProfile.language as 'en' | 'sr' | 'de' | 'fr' | 'es' | 'pt' | 'ru' | 'zh' | 'ar' | 'tr');
    }
  }, [userProfile.language]);

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

    // Subscribe to fitness entries
    const unsubscribeFitness = subscribeToUserFitness(
      currentUser.uid,
      (userFitness) => {
        if (userFitness && userFitness.length > 0) {
          setFitnessEntries(userFitness);
        }
      }
    );

    // Subscribe to user profile
    const unsubscribeProfile = subscribeToUserProfile(
      currentUser.uid,
      (remoteProfile) => {
        if (remoteProfile) {
          setUserProfile(prev => {
            // Deep merge: keep local muscleRanks if remote doesn't have them
            const merged = { ...prev, ...remoteProfile };
            if (remoteProfile.fitnessStats?.muscleRanks && Object.keys(remoteProfile.fitnessStats.muscleRanks).length > 0) {
              merged.fitnessStats = { ...prev.fitnessStats, ...remoteProfile.fitnessStats };
            }
            return merged;
          });
        }
      }
    );

    return () => {
      unsubscribeTasks();
      unsubscribeCats();
      unsubscribeNotifs();
      unsubscribeFitness();
      unsubscribeProfile();
    };
  }, [currentUser?.uid]);

  // One-time migration: push local fitness data to Firestore on first login
  useEffect(() => {
    if (!currentUser?.uid || (currentUser as AuthUser).isGuest) return;
    const migratedKey = `doit_fitness_migrated_${currentUser.uid}`;
    if (localStorage.getItem(migratedKey)) return;

    // Check if we have local data to migrate
    const localEntries = JSON.parse(localStorage.getItem('doit_fitness_entries') || '[]');
    const localProfile = JSON.parse(localStorage.getItem('doit_user_profile') || 'null');

    if (localEntries.length > 0 || (localProfile && localProfile.fitnessStats?.xp > 0)) {
      // Push local entries to Firestore
      localEntries.forEach((entry: FitnessEntry) => {
        saveFitnessEntryToFirestore(currentUser.uid, entry).catch(console.error);
      });
      // Push profile to Firestore
      if (localProfile) {
        saveUserProfileToFirestore(currentUser.uid, localProfile).catch(console.error);
      }
    }

    localStorage.setItem(migratedKey, '1');
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

  // Fitness persistence — localStorage + Firestore
  useEffect(() => {
    localStorage.setItem('doit_user_profile', JSON.stringify(userProfile));
    if (currentUser?.uid && !(currentUser as AuthUser).isGuest) {
      saveUserProfileToFirestore(currentUser.uid, userProfile).catch(console.error);
    }
  }, [userProfile, currentUser?.uid]);

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
            notificationEngine.dispatchEmailReminder(task, userEmail).then(log => {
              setNotificationLogs(prev => [log, ...prev].slice(0, 50));
            });
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
    notificationEngine.dispatchEmailReminder(task, email).then(log => {
      setNotificationLogs(prev => [log, ...prev]);
    });
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
    // Sync to Firestore
    if (currentUser?.uid && !(currentUser as AuthUser).isGuest) {
      saveFitnessEntryToFirestore(currentUser.uid, entry).catch(console.error);
    }
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

  const handleExportData = () => {
    const data = {
      tasks,
      categories,
      userProfile,
      fitnessEntries,
      exportDate: new Date().toISOString(),
      version: '3.0.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doit-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    localStorage.removeItem('doit_tasks_v2');
    localStorage.removeItem('doit_categories_v2');
    localStorage.removeItem('doit_user_profile');
    localStorage.removeItem('doit_fitness_entries');
    localStorage.removeItem('doit_notification_logs_v2');
    localStorage.removeItem('doit_user_email_v2');
    localStorage.removeItem('doit_app_notifications_v1');
    localStorage.removeItem('doit_current_view');
    localStorage.removeItem('fitness-display-unit');
    setTasks([]);
    setCategories(storage.getCategories());
    setFitnessEntries([]);
    setAppNotifications([]);
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
          
          {/* HOME VIEW - Dashboard Overview */}
          {currentView === 'home' && (
            <div className="space-y-6">
              {/* Welcome Header */}
              <div className={`p-6 rounded-3xl border ${isLight ? 'bg-white border-slate-200' : 'bg-white/[0.03] border-white/10'}`}>
                <h1 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {currentUser ? `${t('home.welcome')}, ${currentUser.displayName || 'User'}` : 'Welcome to DoIT'}
                </h1>
                <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                  {new Date().toLocaleDateString(userProfile.language === 'sr' ? 'sr-Latn' : userProfile.language || 'en', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{t('home.pendingTasks')}</p>
                  <p className={`text-2xl font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{pendingCount}</p>
                </div>
                <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{t('home.dueToday')}</p>
                  <p className="text-2xl font-bold mt-1 text-orange-500">{todayCount}</p>
                </div>
                <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{t('home.overdue')}</p>
                  <p className={`text-2xl font-bold mt-1 ${overdueCount > 0 ? 'text-red-500' : isLight ? 'text-slate-900' : 'text-white'}`}>{overdueCount}</p>
                </div>
                <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{t('home.completed')}</p>
                  <p className="text-2xl font-bold mt-1 text-emerald-500">{tasks.filter(task => task.completed).length}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { haptic.mediumClick(); setCurrentView('tasks'); }}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${isLight ? 'bg-white border-slate-200 hover:border-orange-300' : 'bg-white/5 border-white/10 hover:border-orange-500/30'}`}
                >
                  <CheckSquare className={`w-6 h-6 mb-2 ${isLight ? 'text-slate-600' : 'text-white/60'}`} />
                  <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('home.viewTasks')}</p>
                  <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{tasks.length} {t('home.totalTasks')}</p>
                </button>
                <button
                  onClick={() => { haptic.mediumClick(); setCurrentView('fitness'); }}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${isLight ? 'bg-white border-slate-200 hover:border-orange-300' : 'bg-white/5 border-white/10 hover:border-orange-500/30'}`}
                >
                  <Dumbbell className={`w-6 h-6 mb-2 ${isLight ? 'text-slate-600' : 'text-white/60'}`} />
                  <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('home.fitness')}</p>
                  <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{fitnessEntries.length} {t('home.workoutsLogged')}</p>
                </button>
              </div>

              {/* Overdue Tasks Alert */}
              {overdueCount > 0 && (
                <div className={`p-4 rounded-2xl border ${isLight ? 'bg-red-50 border-red-200' : 'bg-red-500/10 border-red-500/20'}`}>
                  <p className={`text-xs font-bold ${isLight ? 'text-red-700' : 'text-red-400'}`}>
                    ⚠️ {overdueCount} {t('home.overdueAlert')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TASKS VIEW - List + Matrix */}
          {currentView === 'tasks' && (
            <div className="space-y-5">
              {/* Sub-view Toggle */}
              <div className={`flex gap-1 p-1 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                {[
                  { id: 'list' as const, label: t('tasks.taskList'), icon: <CheckSquare className="w-3.5 h-3.5" /> },
                  { id: 'matrix' as const, label: t('tasks.priorityMatrix'), icon: <LayoutGrid className="w-3.5 h-3.5" /> },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { haptic.lightTap(); setTaskSubView(tab.id); }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all flex-1 cursor-pointer ${
                      taskSubView === tab.id
                        ? isLight ? 'bg-white text-slate-900 border border-slate-300 shadow-sm' : 'bg-white/10 text-white border border-white/15 shadow-sm'
                        : isLight ? 'text-slate-500 hover:text-slate-700' : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* List View */}
              {taskSubView === 'list' && (
                <div className="space-y-6">
                  <QuickAddBar categories={categories} theme={theme} onAddTask={handleQuickAdd} />
                  <div className={`p-5 rounded-3xl border backdrop-blur-xl space-y-4 shadow-xl ${isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/[0.03]'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="relative flex-1 max-w-md">
                        <Search className={`w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
                        <input
                          id="main-search-input"
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={t('tasks.searchPlaceholder')}
                          className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all ${isLight ? 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400' : 'border-white/10 bg-white/5 text-white placeholder:text-white/30'}`}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={sortBy}
                          onChange={(e) => { haptic.lightTap(); setSortBy(e.target.value as 'dueDate' | 'priority' | 'createdAt' | 'title'); }}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none cursor-pointer ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-white/80'}`}
                        >
                          <option value="dueDate">{t('tasks.deadline')}</option>
                          <option value="priority">{t('tasks.priority')}</option>
                          <option value="createdAt">{t('tasks.created')}</option>
                        </select>
                        <select
                          value={priorityFilter}
                          onChange={(e) => { haptic.lightTap(); setPriorityFilter(e.target.value as Priority | 'all'); }}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none cursor-pointer ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-white/80'}`}
                        >
                          <option value="all">All Priorities</option>
                          <option value="urgent">Urgent</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                    </div>
                    <div className={`flex flex-wrap gap-1.5 pt-3 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                      {[
                        { id: 'all', label: t('tasks.allTasks'), count: tasks.length },
                        { id: 'pending', label: t('tasks.pending'), count: pendingCount },
                        { id: 'today', label: t('tasks.dueToday'), count: todayCount },
                        { id: 'overdue', label: t('home.overdue'), count: overdueCount },
                        { id: 'completed', label: t('tasks.done'), count: tasks.filter(task => task.completed).length }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => { haptic.lightTap(); setStatusFilter(item.id as FilterStatus); }}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            statusFilter === item.id
                              ? isLight ? 'bg-slate-900 text-white' : 'bg-white text-black'
                              : isLight ? 'bg-slate-100 text-slate-600 hover:text-slate-900' : 'bg-white/5 text-white/50 hover:text-white'
                          }`}
                        >
                          {item.label}
                          <span className={`text-[10px] ${statusFilter === item.id ? 'opacity-70' : 'opacity-50'}`}>{item.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {filteredTasks.length === 0 ? (
                      <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-dashed border-white/10">
                        <Inbox className="w-12 h-12 text-white/20 mx-auto mb-3" />
                        <p className="text-sm font-medium text-white/60">{t('tasks.noTasks')}</p>
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
                            onEdit={(t) => { setEditingTask(t); setIsTaskModalOpen(true); }}
                            onDelete={handleDeleteTask}
                            onDuplicate={handleDuplicateTask}
                            onChangePriority={handleChangePriority}
                            onToggleSubtask={handleToggleSubtask}
                            onTriggerEmailReminder={(t) => { handleTriggerTestEmail(t, userEmail); setIsNotifModalOpen(true); }}
                          />
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              )}

              {/* Matrix View */}
              {taskSubView === 'matrix' && (
                <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="text-sm text-white/40">Loading...</div></div>}>
                  <EisenhowerMatrix
                    tasks={tasks}
                    categories={categories}
                    theme={theme}
                    onToggleComplete={handleToggleComplete}
                    onEditTask={(t) => { setEditingTask(t); setIsTaskModalOpen(true); }}
                    onMoveQuadrant={handleMoveQuadrant}
                    onOpenNewTask={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
                  />
                </Suspense>
              )}
            </div>
          )}

          {/* FITNESS VIEW - Dashboard + Trainer + Ranks */}
          {currentView === 'fitness' && (
            <div className="space-y-5">
              {/* Sub-view Tabs */}
              <div className={`flex gap-1 p-1 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                {[
                  { id: 'dashboard' as const, label: t('fitness.dashboard'), icon: <Dumbbell className="w-3.5 h-3.5" /> },
                  { id: 'trainer' as const, label: t('fitness.trainer'), icon: <Sparkles className="w-3.5 h-3.5" /> },
                  { id: 'ranks' as const, label: t('fitness.ranks'), icon: <Trophy className="w-3.5 h-3.5" /> },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { haptic.lightTap(); setFitnessSubView(tab.id); }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex-1 cursor-pointer ${
                      fitnessSubView === tab.id
                        ? isLight ? 'bg-white text-slate-900 border border-slate-300 shadow-sm' : 'bg-white/10 text-white border border-white/15 shadow-sm'
                        : isLight ? 'text-slate-500 hover:text-slate-700' : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Fitness Dashboard */}
              {fitnessSubView === 'dashboard' && (
                <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="text-sm text-white/40">Loading...</div></div>}>
                  {!userProfile.onboardingCompleted ? (
                    <div className="text-center py-16">
                      <p className={`text-sm mb-4 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Set up your fitness profile to get started</p>
                      <button
                        onClick={() => setIsFitnessOnboardingOpen(true)}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-sm shadow-lg shadow-amber-500/25 active:scale-[0.99] transition-all"
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

              {/* Trainer */}
              {fitnessSubView === 'trainer' && (
                <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="text-sm text-white/40">Loading...</div></div>}>
                  <TrainerDashboard
                    theme={theme}
                    userProfile={userProfile}
                    fitnessEntries={fitnessEntries}
                    onLogExercise={() => setIsExerciseLogModalOpen(true)}
                  />
                </Suspense>
              )}

              {/* Ranks / Leaderboard */}
              {fitnessSubView === 'ranks' && (
                <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="text-sm text-white/40">Loading...</div></div>}>
                  {!currentUser || currentUser.isGuest ? (
                    <div className={`text-center py-16 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                      <Trophy className={`w-16 h-16 mx-auto mb-4 ${theme === 'light' ? 'text-slate-300' : 'text-white/20'}`} />
                      <h2 className={`text-xl font-bold mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Leaderboard</h2>
                      <p className={`text-sm mb-4 ${theme === 'light' ? 'text-slate-500' : 'text-white/50'}`}>Sign in to see how you rank</p>
                      <button
                        onClick={() => setIsAuthModalOpen(true)}
                        className="px-6 py-3 rounded-xl bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-500/25 hover:bg-orange-600 active:scale-95 transition-all cursor-pointer"
                      >
                        Sign In
                      </button>
                    </div>
                  ) : (
                    <Leaderboard
                      theme={theme}
                      userProfile={userProfile}
                      onProfileUpdate={(updates) => setUserProfile(prev => ({ ...prev, ...updates }))}
                      currentUserUid={currentUser?.uid}
                    />
                  )}
                </Suspense>
              )}
            </div>
          )}

          {/* SETTINGS VIEW */}
          {currentView === 'settings' && (
            <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="text-sm text-white/40">Loading...</div></div>}>
              <Settings
                theme={theme}
                onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                userProfile={userProfile}
                onProfileUpdate={(updates) => setUserProfile(prev => ({ ...prev, ...updates }))}
                currentUser={currentUser}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onSignOut={handleLogout}
                categories={categories}
                onCategoriesChange={setCategories}
                userEmail={userEmail}
                onUserEmailChange={setUserEmail}
                isOnline={isOnline}
                lastSyncTime={lastSyncTime}
                onOpenDocs={() => setIsDocsModalOpen(true)}
                onExportData={handleExportData}
                onClearData={handleClearData}
              />
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
            onCategoriesChange={setCategories}
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
            defaultWeightUnit={userProfile.weightUnit}
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
