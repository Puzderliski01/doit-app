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
  Group,
  Exercise,
  GroupTask,
  MealEntry,
  DailyNutritionTarget,
} from './types';
import { storage } from './utils/storage';
import { haptic } from './utils/haptics';
import { isOverdue, isDueToday, isDueThisWeek, formatDeadlineRelative } from './utils/dateHelpers';
import { groupTasksBySection } from './utils/taskHelpers';
import { calculateNextDueDate, getRecurringLabel } from './utils/recurring';
import { notificationEngine } from './utils/notificationEngine';
import { DEFAULT_USER_PROFILE, DEFAULT_FITNESS_STATS, updateFitnessStats, ALL_EXERCISES } from './utils/fitness';
import { setLanguage, t } from './i18n';
import { initPushNotifications, requestPermission as requestPushPermission, showLocalNotification, isPushSupported } from './utils/pushNotifications';
import { startBackgroundPoller, stopBackgroundPoller, requestPushToFirestore } from './utils/backgroundNotifier';
import { exportTasksPDF, exportFitnessPDF } from './utils/pdfExport';
import { syncAllTasks } from './utils/calendarSync';

import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { TaskCard } from './components/TaskCard';
import { QuickAddBar } from './components/QuickAddBar';
import { NotificationToastContainer } from './components/NotificationToastContainer';
import { LoginPage } from './components/LoginPage';
import { OfflineIndicator } from './components/OfflineIndicator';
import { BrowseScreen } from './components/BrowseScreen';
import { HomeScreen } from './components/HomeScreen';
import { GetReadyScreen } from './components/GetReadyScreen';
import { CongratulationScreen } from './components/CongratulationScreen';
import { WorkoutDetail } from './components/WorkoutDetail';
import { ExerciseInProgress } from './components/ExerciseInProgress';
import { TrainerProfile } from './components/TrainerProfile';
import { ExercisePickerScreen } from './components/ExercisePickerScreen';

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
const GroupsManager = lazy(() => import('./components/GroupsManager').then(m => ({ default: m.GroupsManager })));
const GroupTasksView = lazy(() => import('./components/GroupTasksView').then(m => ({ default: m.GroupTasksView })));
const AchievementTree = lazy(() => import('./components/AchievementTree').then(m => ({ default: m.AchievementTree })));
const DailyBriefing = lazy(() => import('./components/DailyBriefing').then(m => ({ default: m.DailyBriefing })));
const WeeklyReport = lazy(() => import('./components/WeeklyReport').then(m => ({ default: m.WeeklyReport })));
const DeadlinePredictor = lazy(() => import('./components/DeadlinePredictor').then(m => ({ default: m.DeadlinePredictor })));
const MealPlanView = lazy(() => import('./components/MealPlanView').then(m => ({ default: m.MealPlanView })));
const QuickCaptureBar = lazy(() => import('./components/QuickCaptureBar').then(m => ({ default: m.QuickCaptureBar })));
const SyncStatus = lazy(() => import('./components/SyncStatus').then(m => ({ default: m.SyncStatus })));
const TaskBreakdownModal = lazy(() => import('./components/TaskBreakdownModal').then(m => ({ default: m.TaskBreakdownModal })));
const KanbanBoard = lazy(() => import('./components/KanbanBoard').then(m => ({ default: m.KanbanBoard })));
const FullCalendar = lazy(() => import('./components/FullCalendar').then(m => ({ default: m.FullCalendar })));
const TaskStats = lazy(() => import('./components/TaskStats').then(m => ({ default: m.TaskStats })));
const TaskTemplates = lazy(() => import('./components/TaskTemplates').then(m => ({ default: m.TaskTemplates })));
const TimeTracker = lazy(() => import('./components/TimeTracker').then(m => ({ default: m.TimeTracker })));

import { 
  auth,
  subscribeToUserTasks,
  saveUserTaskToFirestore,
  deleteUserTaskFromFirestore,
  deleteUserAccount,
  batchUpdateTasksOrderInFirestore,
  fetchUserTasks,
  fetchUserCategories,
  saveUserCategoryToFirestore,
  fetchUserNotifications,
  saveUserNotificationToFirestore,
  markAllNotificationsReadInFirestore,
  clearAllNotificationsInFirestore,
  deleteSingleNotificationFromFirestore,
  syncUserProfile,
  getLocalAuthSession,
  resolveGoogleRedirectResult,
  fetchUserFitness,
  saveFitnessEntryToFirestore,
  saveUserProfileToFirestore,
  fetchUserProfile,
  saveLocalAuthSession,
  clearLocalAuthSession,
  subscribeToUserGroups,
  subscribeToGroupTasks,
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
  LayoutGrid,
  Trash2,
  TrendingUp,
  Target,
  Zap,
  ChevronRight,
  Users,
  Apple,
  AlertTriangle,
  Calendar,
  BarChart3,
  Sparkles,
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
      if (saved === 'groups') return 'groups';
    } catch { /* ignore */ }
    return 'home';
  });

  // Sub-views within grouped views
  const [taskSubView, setTaskSubView] = useState<'list' | 'matrix' | 'groups' | 'kanban' | 'calendar'>('list');
  const [fitnessSubView, setFitnessSubView] = useState<'dashboard' | 'trainer' | 'nutrition'>('dashboard');
  
  // Sub-screen navigation for fitness app screens
  const [showGetReady, setShowGetReady] = useState(false);
  const [showCongratulation, setShowCongratulation] = useState(false);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [showWorkoutDetail, setShowWorkoutDetail] = useState(false);
  const [showExerciseInProgress, setShowExerciseInProgress] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const [showTrainerProfile, setShowTrainerProfile] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [preSelectedExercise, setPreSelectedExercise] = useState<Exercise | null>(null);

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

  // Request browser notification permission and initialize push on mount
  useEffect(() => {
    notificationEngine.requestPermission();
    initPushNotifications();
  }, []);

  // Start/stop background notification poller based on user login state
  useEffect(() => {
    if (currentUser && !(currentUser as AuthUser).isGuest && !(currentUser as AuthUser).isLocal) {
      startBackgroundPoller(currentUser.uid);
    }
    return () => stopBackgroundPoller();
  }, [currentUser?.uid]);

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
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

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

  // Groups State
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [allGroupTasks, setAllGroupTasks] = useState<GroupTask[]>([]);

  // Nutrition State
  const [mealEntries, setMealEntries] = useState<MealEntry[]>(() => {
    try {
      const stored = localStorage.getItem('doit_meal_entries');
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return [];
  });
  const [nutritionTarget, setNutritionTarget] = useState<DailyNutritionTarget>(() => {
    try {
      const stored = localStorage.getItem('doit_nutrition_target');
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return { calories: 2000, protein: 150, carbs: 250, fat: 65 };
  });
  const [isTaskBreakdownOpen, setIsTaskBreakdownOpen] = useState(false);
  const [breakdownTaskTitle, setBreakdownTaskTitle] = useState('');
  const [breakdownTaskDesc, setBreakdownTaskDesc] = useState('');

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
    const anyModalOpen = isTaskModalOpen || isNotifModalOpen || isDocsModalOpen || isAuthModalOpen || isExerciseLogModalOpen || isFitnessOnboardingOpen || isTaskBreakdownOpen;
    if (anyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isTaskModalOpen, isNotifModalOpen, isDocsModalOpen, isAuthModalOpen, isExerciseLogModalOpen, isFitnessOnboardingOpen, isTaskBreakdownOpen]);

  // Firebase Auth State Listener with device session retention
  useEffect(() => {
    // Resolve any pending Google Sign-In redirect (started when a popup was blocked).
    // This must run before/alongside onAuthStateChanged so the redirect flow completes.
    resolveGoogleRedirectResult().catch(() => {});
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
  const pendingFitnessWritesRef = useRef<Map<string, FitnessEntry>>(new Map());
  const pendingFitnessDeletesRef = useRef<Set<string>>(new Set());

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
            // No pending writes — use Firestore data directly
            // But also include any local-only tasks (created while offline)
            const firestoreIds = new Set(userTasks.map(t => t.id));
            const localOnly = prev.filter(t => !firestoreIds.has(t.id));
            const merged = [...userTasks, ...localOnly];
            storage.saveTasks(merged, currentUser.uid);
            setLastSyncTime(new Date().toISOString());
            return merged;
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

    // One-shot fetch for non-critical data (saves Firestore quota)
    const loadNonCritical = async () => {
      const [cats, notifs, fitness, profile] = await Promise.all([
        fetchUserCategories(currentUser!.uid),
        fetchUserNotifications(currentUser!.uid),
        fetchUserFitness(currentUser!.uid),
        fetchUserProfile(currentUser!.uid),
      ]);
      if (cats.length > 0) setCategories(cats);
      if (notifs.length > 0) setAppNotifications(notifs);
      if (fitness.length > 0) {
        setFitnessEntries(prev => {
          const pending = pendingFitnessWritesRef.current;
          const deletes = pendingFitnessDeletesRef.current;
          const firestoreIds = new Set(fitness.map(e => e.id));
          const localOnly = prev.filter(e => !firestoreIds.has(e.id) && !deletes.has(e.id));
          const firestoreMap = new Map(fitness.filter(e => !deletes.has(e.id)).map(e => [e.id, e]));
          for (const [id, localEntry] of pending) {
            firestoreMap.set(id, localEntry);
          }
          const merged = [...firestoreMap.values(), ...localOnly];
          storage.saveFitnessEntries(merged, currentUser!.uid);
          return merged;
        });
      }
      if (profile) {
        setUserProfile(prev => {
          const merged = { ...prev, ...profile };
          if (profile.fitnessStats?.muscleRanks && Object.keys(profile.fitnessStats.muscleRanks).length > 0) {
            merged.fitnessStats = { ...prev.fitnessStats, ...profile.fitnessStats };
          }
          return merged;
        });
      }
    };

    loadNonCritical().catch(console.error);

    // Refresh non-critical data every 5 minutes
    const nonCriticalInterval = setInterval(loadNonCritical, 300000);

    // Subscribe to user groups
    const unsubscribeGroups = subscribeToUserGroups(currentUser.uid, setUserGroups);

    return () => {
      unsubscribeTasks();
      unsubscribeGroups();
      clearInterval(nonCriticalInterval);
    };
  }, [currentUser?.uid]);

  // Subscribe to group tasks for all user's groups
  useEffect(() => {
    if (!userGroups.length) {
      setAllGroupTasks([]);
      return;
    }
    const unsubscribers: (() => void)[] = [];
    for (const group of userGroups) {
      const unsub = subscribeToGroupTasks(group.id, (groupTasks) => {
        setAllGroupTasks(prev => {
          const others = prev.filter(t => t.groupId !== group.id);
          return [...others, ...groupTasks];
        });
      });
      if (typeof unsub === 'function') unsubscribers.push(unsub);
    }
    return () => { unsubscribers.forEach(u => u()); };
  }, [userGroups.map(g => g.id).join(',')]);

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

  // One-time migration: push local tasks to Firestore on first login
  useEffect(() => {
    if (!currentUser || (currentUser as AuthUser).isGuest || (currentUser as AuthUser).isLocal) return;
    const migratedKey = `doit_tasks_migrated_${currentUser.uid}`;
    if (localStorage.getItem(migratedKey)) return;

    const localTasks = storage.getTasks(currentUser.uid);
    if (localTasks.length > 0) {
      console.log('[Migration] Pushing', localTasks.length, 'local tasks to Firestore');
      localTasks.forEach((task) => {
        saveUserTaskToFirestore(currentUser.uid, task).catch(console.error);
      });
    }
    localStorage.setItem(migratedKey, '1');
  }, [currentUser?.uid]);

  // Polling fallback: fetch tasks from Firestore every 15s as backup for onSnapshot
  useEffect(() => {
    if (!currentUser?.uid || (currentUser as AuthUser).isGuest || (currentUser as AuthUser).isLocal) return;

    const poll = async () => {
      try {
        const firestoreTasks = await fetchUserTasks(currentUser!.uid);
        if (firestoreTasks.length === 0) return; // Don't overwrite local data with empty

        setTasks(prev => {
          const pending = pendingWritesRef.current;
          const deletes = pendingDeletesRef.current;
          const firestoreIds = new Set(firestoreTasks.map(t => t.id));
          const localOnly = prev.filter(t => !firestoreIds.has(t.id) && !deletes.has(t.id));
          const firestoreMap = new Map(firestoreTasks.filter(t => !deletes.has(t.id)).map(t => [t.id, t]));
          // Overlay pending writes (unconfirmed local changes)
          for (const [id, localTask] of pending) {
            firestoreMap.set(id, localTask);
          }
          const merged = [...firestoreMap.values(), ...localOnly];
          // Only update if something actually changed
          if (merged.length !== prev.length || merged.some((t, i) => t.id !== prev[i]?.id)) {
            storage.saveTasks(merged, currentUser!.uid);
            return merged;
          }
          return prev;
        });
      } catch (err) {
        console.warn('[Polling] Failed:', err);
      }
    };

    // Initial poll after 5 seconds
    const initialTimeout = setTimeout(poll, 5000);
    // Then every 5 minutes (reduced from 60s to save Firestore quota)
    const interval = setInterval(poll, 300000);
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
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

  // Fitness persistence — localStorage + Firestore
  useEffect(() => {
    localStorage.setItem('doit_user_profile', JSON.stringify(userProfile));
    if (currentUser?.uid && !(currentUser as AuthUser).isGuest) {
      saveUserProfileToFirestore(currentUser.uid, userProfile).catch(console.error);
    }
  }, [userProfile, currentUser?.uid]);

  useEffect(() => {
    localStorage.setItem('doit_fitness_entries', JSON.stringify(fitnessEntries));
    if (currentUser?.uid && !(currentUser as AuthUser).isGuest && !(currentUser as AuthUser).isLocal) {
      // Sync to Firestore for non-guest users
      fitnessEntries.forEach(entry => {
        if (!pendingFitnessWritesRef.current.has(entry.id)) {
          saveFitnessEntryToFirestore(currentUser.uid, entry).catch(console.error);
        }
      });
    }
  }, [fitnessEntries, currentUser?.uid]);

  useEffect(() => {
    localStorage.setItem('doit_meal_entries', JSON.stringify(mealEntries));
  }, [mealEntries]);

  useEffect(() => {
    localStorage.setItem('doit_nutrition_target', JSON.stringify(nutritionTarget));
  }, [nutritionTarget]);

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

      // Write push request for background notification (native wrapper / screen off)
      const isUrgent = created.type === 'urgent_priority' || created.type === 'overdue' || created.type === 'deadline';
      if (isUrgent) {
        requestPushToFirestore(currentUser.uid, {
          title: created.title,
          body: created.message,
          tag: created.type,
          taskId: created.taskId,
          requireInteraction: created.type === 'urgent_priority' || created.type === 'overdue',
        }).catch(console.error);
      }
    }

    // Send push notification (system notification, works even when app is in background)
    if (isPushSupported() && Notification.permission === 'granted') {
      showLocalNotification({
        title: created.title,
        body: created.message,
        tag: created.type,
        taskId: created.taskId,
        requireInteraction: created.type === 'urgent_priority' || created.type === 'overdue',
      });
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
    pendingWritesRef.current.delete(taskId);
    if (canSyncToFirestore) {
      pendingDeletesRef.current.add(taskId);
      deleteUserTaskFromFirestore(currentUser!.uid, taskId)
        .then(() => { pendingDeletesRef.current.delete(taskId); })
        .catch(console.error);
    }
  };

  const handleClearCompleted = () => {
    const completedIds = tasks.filter(t => t.completed).map(t => t.id);
    if (completedIds.length === 0) return;
    haptic.deleteAction();
    setTasks(prev => prev.filter(t => !t.completed));
    completedIds.forEach(id => pendingWritesRef.current.delete(id));
    if (canSyncToFirestore) {
      completedIds.forEach(id => {
        pendingDeletesRef.current.add(id);
        deleteUserTaskFromFirestore(currentUser!.uid, id)
          .then(() => { pendingDeletesRef.current.delete(id); })
          .catch(console.error);
      });
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
  };

  const handleTriggerTestEmail = (task: Task, email: string) => {
    notificationEngine.dispatchEmailReminder(task, email).then(log => {
      setNotificationLogs(prev => [log, ...prev]);
    });
  };

  // Kanban: Move task to different column
  const handleMoveTask = (taskId: string, column: string) => {
    let updatedTask: Task | null = null;
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        updatedTask = { ...t, kanbanColumn: column as any, completed: column === 'done' };
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

  // Time Tracking: Start timer
  const handleStartTimer = (taskId: string) => {
    let updatedTask: Task | null = null;
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        updatedTask = { ...t, timerStartedAt: new Date().toISOString() };
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

  // Time Tracking: Stop timer
  const handleStopTimer = (taskId: string) => {
    let updatedTask: Task | null = null;
    setTasks(prev => prev.map(t => {
      if (t.id === taskId && t.timerStartedAt) {
        const startMs = new Date(t.timerStartedAt).getTime();
        const durationMs = Date.now() - startMs;
        const entry = {
          id: `te-${Date.now()}`,
          start: t.timerStartedAt,
          end: new Date().toISOString(),
          durationMs,
        };
        updatedTask = {
          ...t,
          timerStartedAt: undefined,
          timeEntries: [...(t.timeEntries || []), entry],
          actualMinutes: ((t.actualMinutes || 0) * 60000 + durationMs) / 60000,
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

  // Time Tracking: Add manual entry
  const handleAddTimeEntry = (taskId: string, entry: any) => {
    let updatedTask: Task | null = null;
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        updatedTask = {
          ...t,
          timeEntries: [...(t.timeEntries || []), entry],
          actualMinutes: ((t.actualMinutes || 0) * 60000 + entry.durationMs) / 60000,
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

  // Time Tracking: Delete entry
  const handleDeleteTimeEntry = (taskId: string, entryId: string) => {
    let updatedTask: Task | null = null;
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const entries = (t.timeEntries || []).filter(e => e.id !== entryId);
        updatedTask = { ...t, timeEntries: entries };
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

  // Templates: Use template to create task
  const handleUseTemplate = (taskData: Partial<Task>) => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
    // Pre-fill the modal - we'll call handleSaveTask directly
    handleSaveTask(taskData);
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
    // Sync to Firestore with pending writes tracking
    if (currentUser?.uid && !(currentUser as AuthUser).isGuest) {
      pendingFitnessWritesRef.current.set(entry.id, entry);
      saveFitnessEntryToFirestore(currentUser.uid, entry)
        .then(() => { pendingFitnessWritesRef.current.delete(entry.id); })
        .catch(console.error);
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

  const handleSelectExercise = (exerciseId: string) => {
    const exercise = ALL_EXERCISES.find(e => e.id === exerciseId);
    if (exercise) {
      setPreSelectedExercise(exercise);
    }
    setIsExerciseLogModalOpen(true);
  };

  // Merge group tasks into personal tasks when user has the setting enabled
  const mergedTasks = useMemo(() => {
    const showInList = userProfile.showGroupTasksInList !== false;
    if (!showInList || allGroupTasks.length === 0) return tasks;
    const groupAsTasks: Task[] = allGroupTasks.map(gt => ({
      id: gt.id,
      title: gt.title,
      description: gt.description || '',
      priority: gt.priority,
      categoryId: gt.categoryId || '',
      completed: gt.completed,
      completedAt: gt.completedAt,
      createdAt: gt.createdAt,
      dueDate: gt.dueDate,
      estimatedMinutes: gt.estimatedMinutes || 30,
      recurring: gt.recurring || { type: 'none' },
      subtasks: gt.subtasks || [],
      tags: gt.tags || [],
      reminderEmail: '',
      reminderMinutesBefore: 30,
      reminderSent: false,
      isImportant: gt.isUrgent || gt.priority === 'urgent' || gt.priority === 'high',
      isUrgent: gt.isUrgent || gt.priority === 'urgent',
      order: gt.order || 0,
      groupId: gt.groupId,
      groupName: userGroups.find(g => g.id === gt.groupId)?.name || 'Group',
      groupColor: userGroups.find(g => g.id === gt.groupId)?.color || '#f97316',
      createdByName: gt.createdByName,
    }));
    return [...tasks, ...groupAsTasks];
  }, [tasks, allGroupTasks, userProfile.showGroupTasksInList, userGroups]);

  // Home tasks: merged for home screen when enabled
  const homeTasks = useMemo(() => {
    const showOnHome = userProfile.showGroupTasksOnHome !== false;
    if (!showOnHome || allGroupTasks.length === 0) return tasks;
    const groupAsTasks: Task[] = allGroupTasks.map(gt => ({
      id: gt.id,
      title: gt.title,
      description: gt.description || '',
      priority: gt.priority,
      categoryId: gt.categoryId || '',
      completed: gt.completed,
      completedAt: gt.completedAt,
      createdAt: gt.createdAt,
      dueDate: gt.dueDate,
      estimatedMinutes: gt.estimatedMinutes || 30,
      recurring: gt.recurring || { type: 'none' },
      subtasks: gt.subtasks || [],
      tags: gt.tags || [],
      reminderEmail: '',
      reminderMinutesBefore: 30,
      reminderSent: false,
      isImportant: gt.isUrgent || gt.priority === 'urgent' || gt.priority === 'high',
      isUrgent: gt.isUrgent || gt.priority === 'urgent',
      order: gt.order || 0,
      groupId: gt.groupId,
      groupName: userGroups.find(g => g.id === gt.groupId)?.name || 'Group',
      groupColor: userGroups.find(g => g.id === gt.groupId)?.color || '#f97316',
      createdByName: gt.createdByName,
    }));
    return [...tasks, ...groupAsTasks];
  }, [tasks, allGroupTasks, userProfile.showGroupTasksOnHome, userGroups]);

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    return mergedTasks.filter((task) => {
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
  }, [mergedTasks, searchQuery, priorityFilter, categoryFilter, statusFilter, sortBy, sortOrder]);

  const groupedTasks = useMemo(() => groupTasksBySection(filteredTasks), [filteredTasks]);

  const categoriesMap = useMemo(() => {
    return new Map(categories.map(c => [c.id, c]));
  }, [categories]);

  const pendingCount = homeTasks.filter(t => !t.completed).length;
  const overdueCount = homeTasks.filter(t => isOverdue(t.dueDate, t.completed)).length;
  const todayCount = homeTasks.filter(t => isDueToday(t.dueDate) && !t.completed).length;

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

  const [calendarSyncing, setCalendarSyncing] = useState(false);

  const handleExportTasksPDF = () => {
    haptic.mediumClick();
    exportTasksPDF(mergedTasks, categories);
  };

  const handleExportFitnessPDF = () => {
    haptic.mediumClick();
    exportFitnessPDF(fitnessEntries, userProfile);
  };

  const handleSyncToCalendar = async () => {
    if (!currentUser) return;
    setCalendarSyncing(true);
    try {
      const pendingTasks = mergedTasks.filter(t => !t.completed && t.dueDate);
      const result = await syncAllTasks(pendingTasks, categories, new Map());
      alert(`Calendar sync complete!\nSynced: ${result.synced}\nErrors: ${result.errors}`);
    } catch (err: any) {
      alert(`Calendar sync failed: ${err.message}`);
    } finally {
      setCalendarSyncing(false);
    }
  };

  const handleImportData = async (backupData: any) => {
    if (!currentUser?.uid) { alert('Please sign in first.'); return; }
    const uid = currentUser.uid;

    // Import categories
    if (backupData.categories?.length) {
      for (const cat of backupData.categories) {
        await saveUserCategoryToFirestore(uid, { ...cat });
      }
    }

    // Import tasks
    if (backupData.tasks?.length) {
      for (const task of backupData.tasks) {
        await saveUserTaskToFirestore(uid, { ...task });
      }
    }

    // Import fitness entries
    if (backupData.fitnessEntries?.length) {
      for (const entry of backupData.fitnessEntries) {
        await saveFitnessEntryToFirestore(uid, { ...entry, userId: uid });
      }
    }

    // Import profile
    if (backupData.userProfile) {
      const { id: _, ...profileData } = backupData.userProfile;
      await saveUserProfileToFirestore(uid, profileData as any);
    }

    alert('Import successful! All data restored.');
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

  const handleDeleteAccount = async () => {
    if (!currentUser?.uid || (currentUser as AuthUser).isGuest || (currentUser as AuthUser).isLocal) return;
    try {
      // Delete from Firestore
      await deleteUserAccount(currentUser.uid);
      // Clear local storage
      handleClearData();
      // Sign out
      await handleLogout();
    } catch (err) {
      console.error('[Account] Delete failed:', err);
    }
  };

  // If restoring existing device session, show sleek obsidian loader
  if (authLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 selection:bg-neon-400/30">
        <div className="w-16 h-16 rounded-3xl bg-neon-400/10 border border-neon-400/20 flex items-center justify-center text-neon-400 mb-5 shadow-[0_0_35px_rgba(200,255,0,0.15)] animate-pulse">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="text-sm font-semibold tracking-tight text-white/90">Loading...</div>
        <div className="text-xs text-white/40 mt-1">Preparing your workspace</div>
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
    <div className={`min-h-screen text-white selection:bg-neon-400/30 selection:text-white transition-colors duration-200 relative overflow-x-hidden ${
      theme === 'light' ? 'bg-white' : 'bg-[#0a0a0a]'
    }`}>

      {/* Offline Indicator */}
      <OfflineIndicator isOnline={isOnline} theme={theme} />

      {/* Background ambient lighting */}
      {theme === 'dark' && (
        <>
          <div className="fixed top-0 left-1/4 w-96 h-96 bg-neon-400/5 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="fixed bottom-10 right-1/4 w-[30rem] h-[30rem] bg-neon-400/3 rounded-full blur-3xl pointer-events-none -z-10" />
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
          onLogWorkout={() => setShowExercisePicker(true)}
          onOpenNotifications={() => setIsNotifModalOpen(true)}
          onOpenDocs={() => setIsDocsModalOpen(true)}
          unreadNotifsCount={appNotifications.filter(n => !n.read).length}
          lastSyncTime={lastSyncTime}
          isOnline={isOnline}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />

        {/* Guest User Workspace Notice Banner */}
        {(currentUser as AuthUser)?.isGuest && (
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
          
              {/* HOME VIEW - New Fitness App Design */}
          {currentView === 'home' && !showWorkoutDetail && !showTrainerProfile && (
            <HomeScreen
              theme={theme}
              userName={currentUser?.displayName || 'there'}
              tasks={tasks}
              fitnessEntries={fitnessEntries}
              totalWorkoutsLogged={fitnessEntries.length}
              userProfile={userProfile}
              onSelectWorkout={(id) => {
                setSelectedWorkoutId(id);
                setShowWorkoutDetail(true);
              }}
              onNavigateToView={(view, filter) => {
                setCurrentView(view);
                if (filter) setStatusFilter(filter);
              }}
              onNewTask={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              onLogWorkout={() => setShowExercisePicker(true)}
            />
          )}

          {/* BROWSE VIEW - Workout/Trainer Cards */}
          {currentView === 'browse' && !showWorkoutDetail && !showTrainerProfile && (
            <BrowseScreen
              theme={theme}
              onSelectWorkout={(id) => {
                setSelectedWorkoutId(id);
                setShowWorkoutDetail(true);
              }}
              onSelectTrainer={(id) => {
                setSelectedTrainerId(id);
                setShowTrainerProfile(true);
              }}
            />
          )}

          {/* WORKOUT DETAIL VIEW */}
          {showWorkoutDetail && selectedWorkoutId && (
            <WorkoutDetail
              theme={theme}
              workoutId={selectedWorkoutId}
              onBack={() => {
                setShowWorkoutDetail(false);
                setSelectedWorkoutId(null);
              }}
              onStartWorkout={() => {
                setShowWorkoutDetail(false);
                setShowGetReady(true);
                setTimeout(() => {
                  setShowGetReady(false);
                  setShowExerciseInProgress(true);
                  setCurrentExerciseIndex(0);
                }, 2000);
              }}
              onSelectTrainer={(id) => {
                setSelectedTrainerId(id);
                setShowTrainerProfile(true);
              }}
            />
          )}

          {/* TRAINER PROFILE VIEW */}
          {showTrainerProfile && selectedTrainerId && (
            <TrainerProfile
              theme={theme}
              trainerId={selectedTrainerId}
              onBack={() => {
                setShowTrainerProfile(false);
                setSelectedTrainerId(null);
              }}
            />
          )}

          {/* TASKS VIEW - List + Matrix */}
          {currentView === 'tasks' && !showWorkoutDetail && !showTrainerProfile && (
            <div className="space-y-5">
              {/* Sub-view Toggle */}
              <div className="tab-group">
                {[
                  { id: 'list' as const, label: t('tasks.taskList'), icon: <CheckSquare className="w-3.5 h-3.5" /> },
                  { id: 'kanban' as const, label: 'Board', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
                  { id: 'calendar' as const, label: 'Calendar', icon: <Calendar className="w-3.5 h-3.5" /> },
                  { id: 'matrix' as const, label: t('tasks.priorityMatrix'), icon: <LayoutGrid className="w-3.5 h-3.5" /> },
                  { id: 'groups' as const, label: t('nav.groups'), icon: <Users className="w-3.5 h-3.5" /> },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { haptic.lightTap(); setTaskSubView(tab.id); }}
                    className={`tab-item ${taskSubView === tab.id ? 'active' : ''}`}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
                {/* Stats & Templates buttons */}
                <button
                  onClick={() => { haptic.lightTap(); setIsStatsOpen(!isStatsOpen); }}
                  className={`p-2 rounded-lg transition-all ${
                    isStatsOpen
                      ? isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'
                      : isLight ? 'text-gray-400 hover:text-blue-500' : 'text-white/30 hover:text-blue-400'
                  }`}
                  title="Task Statistics"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { haptic.lightTap(); setIsTemplatesOpen(!isTemplatesOpen); }}
                  className={`p-2 rounded-lg transition-all ${
                    isTemplatesOpen
                      ? isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400'
                      : isLight ? 'text-gray-400 hover:text-amber-500' : 'text-white/30 hover:text-amber-400'
                  }`}
                  title="Task Templates"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* List View */}
              {taskSubView === 'list' && (
                <div className="space-y-5">
                  {/* Hero Stats */}
                  <div className={`flex gap-2 overflow-x-auto pb-1 ${isLight ? 'bg-gray-50/80' : 'bg-white/[0.02]'} rounded-2xl px-2 py-1`}>
                    {[
                      { value: tasks.length, label: 'Total', color: isLight ? 'text-gray-900' : 'text-white' },
                      { value: pendingCount, label: 'Pending', color: isLight ? 'text-amber-600' : 'text-amber-400' },
                      { value: todayCount, label: 'Today', color: isLight ? 'text-blue-600' : 'text-blue-400' },
                      { value: overdueCount, label: 'Overdue', color: isLight ? 'text-red-600' : 'text-red-400' },
                      { value: tasks.filter(t => t.completed).length, label: 'Done', color: isLight ? 'text-green-600' : 'text-green-400' },
                    ].map((stat) => (
                      <div key={stat.label} className="hero-stat shrink-0">
                        <span className={`hero-stat-value ${stat.color}`}>{stat.value}</span>
                        <span className={`hero-stat-label ${isLight ? 'text-gray-500' : 'text-white/40'}`}>{stat.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Search & Filter Row */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="relative flex-1 max-w-md">
                        <Search className={`w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 ${isLight ? 'text-gray-400' : 'text-white/40'}`} />
                        <input
                          id="main-search-input"
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={t('tasks.searchPlaceholder')}
                          className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium focus:outline-none transition-all ${isLight ? 'input-light' : 'input-dark'}`}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={sortBy}
                          onChange={(e) => { haptic.lightTap(); setSortBy(e.target.value as 'dueDate' | 'priority' | 'createdAt' | 'title'); }}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer ${isLight ? 'input-light' : 'input-dark'}`}
                        >
                          <option value="dueDate">{t('tasks.deadline')}</option>
                          <option value="priority">{t('tasks.priority')}</option>
                          <option value="createdAt">{t('tasks.created')}</option>
                        </select>
                        <select
                          value={priorityFilter}
                          onChange={(e) => { haptic.lightTap(); setPriorityFilter(e.target.value as Priority | 'all'); }}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer ${isLight ? 'input-light' : 'input-dark'}`}
                        >
                          <option value="all">All Priorities</option>
                          <option value="urgent">Urgent</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                    </div>

                    {/* Filter Chips */}
                    <div className="flex flex-wrap items-center gap-1.5">
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
                          className={`chip ${isLight ? 'chip-light' : 'chip-dark'} ${statusFilter === item.id ? 'active' : ''}`}
                        >
                          {item.label}
                          <span className={`text-[10px] ${statusFilter === item.id ? 'opacity-70' : 'opacity-50'}`}>{item.count}</span>
                        </button>
                      ))}
                      {tasks.filter(t => t.completed).length > 0 && (
                        <button
                          onClick={handleClearCompleted}
                          className={`ml-auto chip ${isLight ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
                        >
                          <Trash2 className="w-3 h-3" />
                          Clear Done ({tasks.filter(t => t.completed).length})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Grouped Task List */}
                  <div className="space-y-5 stagger-children">
                    {filteredTasks.length === 0 ? (
                      <div className={`p-12 text-center rounded-2xl ${isLight ? 'bg-gray-50' : 'bg-white/[0.02]'}`}>
                        <Inbox className={`w-12 h-12 mx-auto mb-3 ${isLight ? 'text-gray-300' : 'text-white/15'}`} />
                        <p className={`text-sm font-medium ${isLight ? 'text-gray-500' : 'text-white/40'}`}>{t('tasks.noTasks')}</p>
                      </div>
                    ) : (
                      groupedTasks.map((group) => (
                        <div key={group.id} className="space-y-2">
                          <div className="task-section-header">
                            <span className={`task-section-dot`} style={{
                              backgroundColor: group.color === 'red' ? (isLight ? '#ef4444' : '#f87171')
                                : group.color === 'amber' ? (isLight ? '#f59e0b' : '#fbbf24')
                                : group.color === 'blue' ? (isLight ? '#3b82f6' : '#60a5fa')
                                : group.color === 'green' ? (isLight ? '#22c55e' : '#4ade80')
                                : (isLight ? '#9ca3af' : '#6b7280')
                            }} />
                            <span className={isLight ? 'text-gray-600' : 'text-white/50'}>{group.label}</span>
                            <span className={`task-section-count ${isLight ? 'text-gray-400' : 'text-white/30'}`}>{group.tasks.length}</span>
                          </div>
                          <div className="space-y-2">
                            <AnimatePresence mode="popLayout">
                              {group.tasks.map((task) => (
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
                                  onAIBreakdown={(t) => { setEditingTask(t); setBreakdownTaskTitle(t.title); setBreakdownTaskDesc(t.description || ''); setIsTaskBreakdownOpen(true); }}
                                />
                              ))}
                            </AnimatePresence>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Kanban View */}
              {taskSubView === 'kanban' && (
                <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="text-sm text-neutral-400 dark:text-neutral-500">Loading...</div></div>}>
                  <KanbanBoard
                    tasks={tasks}
                    categories={categories}
                    theme={theme}
                    onToggleComplete={(id) => {
                      const task = tasks.find(t => t.id === id);
                      if (task) handleToggleComplete(task);
                    }}
                    onEditTask={(t) => { setEditingTask(t); setIsTaskModalOpen(true); }}
                    onMoveTask={handleMoveTask}
                  />
                </Suspense>
              )}

              {/* Calendar View */}
              {taskSubView === 'calendar' && (
                <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="text-sm text-neutral-400 dark:text-neutral-500">Loading...</div></div>}>
                  <FullCalendar
                    tasks={tasks}
                    categories={categories}
                    theme={theme}
                    onEditTask={(t) => { setEditingTask(t); setIsTaskModalOpen(true); }}
                    onToggleComplete={(id) => {
                      const task = tasks.find(t => t.id === id);
                      if (task) handleToggleComplete(task);
                    }}
                  />
                </Suspense>
              )}

              {/* Stats Panel */}
              {isStatsOpen && (
                <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="text-sm text-neutral-400 dark:text-neutral-500">Loading...</div></div>}>
                  <TaskStats tasks={tasks} theme={theme} />
                </Suspense>
              )}

              {/* Templates Panel */}
              {isTemplatesOpen && (
                <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="text-sm text-neutral-400 dark:text-neutral-500">Loading...</div></div>}>
                  <TaskTemplates
                    theme={theme}
                    categories={categories}
                    onUseTemplate={handleUseTemplate}
                    onClose={() => setIsTemplatesOpen(false)}
                  />
                </Suspense>
              )}

              {/* Matrix View */}
              {taskSubView === 'matrix' && (
                <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="text-sm text-neutral-400 dark:text-neutral-500">Loading...</div></div>}>
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

              {/* Groups View */}
              {taskSubView === 'groups' && (
                <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="text-sm text-neutral-400 dark:text-neutral-500">Loading...</div></div>}>
                  {!currentUser || (currentUser as AuthUser).isGuest ? (
                    <div className={`text-center py-16 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                      <Users className={`w-16 h-16 mx-auto mb-4 ${theme === 'light' ? 'text-slate-300' : 'text-white/20'}`} />
                      <h2 className={`text-xl font-bold mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Groups</h2>
                      <p className={`text-sm mb-4 ${theme === 'light' ? 'text-slate-500' : 'text-white/50'}`}>Sign in to create and join groups</p>
                      <button
                        onClick={() => setIsAuthModalOpen(true)}
                        className="px-6 py-3 rounded-xl bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-500/25 hover:bg-orange-600 active:scale-95 transition-all cursor-pointer"
                      >
                        Sign In
                      </button>
                    </div>
                  ) : selectedGroup ? (
                    <GroupTasksView
                      theme={theme}
                      group={selectedGroup}
                      currentUser={currentUser as AuthUser}
                      onBack={() => setSelectedGroup(null)}
                    />
                  ) : (
                    <GroupsManager
                      theme={theme}
                      currentUser={currentUser as AuthUser}
                      groups={userGroups}
                      onSelectGroup={setSelectedGroup}
                    />
                  )}
                </Suspense>
              )}
            </div>
          )}

          {/* GROUPS are now a sub-tab within Tasks view */}

          {/* FITNESS VIEW - Dashboard + Trainer + Ranks */}
          {currentView === 'fitness' && (
            <div className="space-y-5">
              {/* Sub-view Tabs */}
              <div className="tab-group">
                {[
                  { id: 'dashboard' as const, label: t('fitness.dashboard'), icon: <Dumbbell className="w-3.5 h-3.5" /> },
                  { id: 'trainer' as const, label: t('fitness.trainer'), icon: <Sparkles className="w-3.5 h-3.5" /> },
                  { id: 'nutrition' as const, label: t('fitness.nutrition'), icon: <Apple className="w-3.5 h-3.5" /> },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { haptic.lightTap(); setFitnessSubView(tab.id); }}
                    className={`tab-item ${fitnessSubView === tab.id ? 'active' : ''}`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Fitness Dashboard */}
              {fitnessSubView === 'dashboard' && (
                <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="text-sm text-neutral-400 dark:text-neutral-500">Loading...</div></div>}>
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
                <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="text-sm text-neutral-400 dark:text-neutral-500">Loading...</div></div>}>
                  <TrainerDashboard
                    theme={theme}
                    userProfile={userProfile}
                    fitnessEntries={fitnessEntries}
                    onLogExercise={(exerciseId, exerciseName, muscleGroup) => {
                      const exercise = ALL_EXERCISES.find(e => e.id === exerciseId);
                      if (exercise) {
                        setPreSelectedExercise(exercise);
                      } else if (exerciseName) {
                        setPreSelectedExercise({ id: exerciseId, name: exerciseName, muscleGroup: muscleGroup as any, type: 'strength', isCustom: false });
                      }
                      setIsExerciseLogModalOpen(true);
                    }}
                  />
                </Suspense>
              )}

              {/* Nutrition View */}
              {fitnessSubView === 'nutrition' && (
                <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="text-sm text-neutral-400 dark:text-neutral-500">Loading...</div></div>}>
                  <MealPlanView
                    theme={theme}
                    entries={mealEntries}
                    dailyTarget={nutritionTarget}
                    onAddEntry={(entry) => setMealEntries(prev => [...prev, { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, createdAt: new Date().toISOString() }])}
                    onDeleteEntry={(id) => setMealEntries(prev => prev.filter(e => e.id !== id))}
                    onUpdateTarget={setNutritionTarget}
                  />
                </Suspense>
              )}

              {/* Ranks / Leaderboard - deactivated */}
            </div>
          )}

          {/* MEAL VIEW */}
          {currentView === 'meal' && !showWorkoutDetail && !showTrainerProfile && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h1 className={`text-2xl font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                  Meal Plan
                </h1>
              </div>
              <Suspense fallback={null}>
                <MealPlanView
                  theme={theme}
                  entries={mealEntries}
                  dailyTarget={nutritionTarget}
                  onAddEntry={() => {}}
                  onDeleteEntry={() => {}}
                  onUpdateTarget={setNutritionTarget}
                />
              </Suspense>
            </div>
          )}

          {/* REWARDS VIEW */}
          {currentView === 'rewards' && !showWorkoutDetail && !showTrainerProfile && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h1 className={`text-2xl font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                  Rewards
                </h1>
              </div>
              <Suspense fallback={null}>
                <Leaderboard
                  theme={theme}
                  userProfile={userProfile}
                />
              </Suspense>
            </div>
          )}

          {/* SETTINGS VIEW */}
          {currentView === 'settings' && (
            <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="text-sm text-neutral-400 dark:text-neutral-500">Loading...</div></div>}>
              <div className="space-y-4">
                {/* Sync Status Panel */}
                <SyncStatus
                  theme={theme}
                  currentUser={currentUser}
                  tasks={tasks}
                  fitnessEntries={fitnessEntries}
                  categories={categories}
                  userProfile={userProfile}
                  canSync={!!canSyncToFirestore}
                  lastSyncTime={lastSyncTime}
                  isLight={isLight}
                />
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
                onExportTasksPDF={handleExportTasksPDF}
                onExportFitnessPDF={handleExportFitnessPDF}
                onSyncToCalendar={handleSyncToCalendar}
                calendarSyncing={calendarSyncing}
                onImportData={handleImportData}
                onClearData={handleClearData}
                onDeleteAccount={handleDeleteAccount}
              />
              </div>
            </Suspense>
          )}

          {/* GET READY OVERLAY */}
          {showGetReady && (
            <GetReadyScreen theme={theme} />
          )}

          {/* EXERCISE IN PROGRESS OVERLAY */}
          {showExerciseInProgress && (
            <ExerciseInProgress
              theme={theme}
              exerciseName="Explosive neg. Push Ups"
              exerciseNumber={currentExerciseIndex + 1}
              totalExercises={3}
              onPrevious={() => {
                if (currentExerciseIndex > 0) {
                  setCurrentExerciseIndex(prev => prev - 1);
                }
              }}
              onNext={() => {
                if (currentExerciseIndex < 2) {
                  setCurrentExerciseIndex(prev => prev + 1);
                } else {
                  setShowExerciseInProgress(false);
                  setShowCongratulation(true);
                }
              }}
              onBack={() => {
                setShowExerciseInProgress(false);
              }}
            />
          )}

          {/* CONGRATULATION OVERLAY */}
          {showCongratulation && (
            <CongratulationScreen
              theme={theme}
              onClose={() => {
                setShowCongratulation(false);
              }}
            />
          )}

          {/* EXERCISE PICKER FULL SCREEN */}
          {showExercisePicker && (
            <ExercisePickerScreen
              theme={theme}
              onSelectExercise={(exercise) => {
                setPreSelectedExercise(exercise);
                setShowExercisePicker(false);
                setIsExerciseLogModalOpen(true);
              }}
              onBack={() => setShowExercisePicker(false)}
            />
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
            onClose={() => {
              setIsExerciseLogModalOpen(false);
              setPreSelectedExercise(null);
            }}
            onSave={handleSaveFitnessEntry}
            theme={theme}
            defaultWeightUnit={userProfile.weightUnit}
            preSelectedExercise={preSelectedExercise}
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

        {/* AI Task Breakdown Modal */}
        <Suspense fallback={null}>
          <TaskBreakdownModal
            isOpen={isTaskBreakdownOpen}
            onClose={() => setIsTaskBreakdownOpen(false)}
            theme={theme}
            taskTitle={breakdownTaskTitle}
            taskDescription={breakdownTaskDesc}
            onApply={(subtasks) => {
              if (editingTask) {
                const updated = subtasks.map((s, i) => ({
                  id: `bd-${Date.now()}-${i}`,
                  title: s.title,
                  completed: false,
                }));
                const newTask = { ...editingTask, subtasks: [...(editingTask.subtasks || []), ...updated] };
                setTasks(prev => prev.map(t => t.id === editingTask.id ? newTask : t));
                if (currentUser?.uid && !(currentUser as AuthUser).isGuest) {
                  saveUserTaskToFirestore(currentUser.uid, newTask).catch(console.error);
                }
              }
            }}
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
          onNewTask={() => {
            setEditingTask(null);
            setIsTaskModalOpen(true);
          }}
          onLogWorkout={() => setShowExercisePicker(true)}
          theme={theme}
        />

      </div>
  );
}
