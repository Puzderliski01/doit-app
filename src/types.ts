export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export type RecurringType = 'none' | 'daily' | 'weekdays' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

export interface RecurringConfig {
  type: RecurringType;
  customDays?: number;
  lastCompletedDate?: string;
  nextDueDate?: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  categoryId: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  dueDate: string; // ISO 8601 string: YYYY-MM-DDTHH:mm
  estimatedMinutes?: number;
  recurring: RecurringConfig;
  subtasks: SubTask[];
  tags: string[];
  reminderEmail?: string;
  reminderMinutesBefore?: number;
  reminderSent?: boolean;
  isImportant?: boolean; // For Eisenhower matrix
  isUrgent?: boolean; // For Eisenhower matrix
  order: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  iconName: string;
  description?: string;
}

export type ViewMode = 'list' | 'matrix' | 'calendar' | 'analytics' | 'docs' | 'fitness';

export type FilterStatus = 'all' | 'pending' | 'completed' | 'today' | 'upcoming' | 'overdue';

export interface FilterOptions {
  status: FilterStatus;
  priority: Priority | 'all';
  categoryId: string | 'all';
  tag: string | 'all';
  search: string;
  sortBy: 'dueDate' | 'priority' | 'createdAt' | 'title';
  sortOrder: 'asc' | 'desc';
}

export type NotificationType = 
  | 'deadline' 
  | 'overdue' 
  | 'achievement' 
  | 'subtask_complete' 
  | 'recurring' 
  | 'sync' 
  | 'urgent_priority'
  | 'daily_briefing';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  taskId?: string;
  actionLabel?: string;
  actionType?: 'view_task' | 'complete_task' | 'open_matrix' | 'open_calendar';
}

export interface NotificationLog {
  id: string;
  taskId: string;
  taskTitle: string;
  dueTimestamp: string;
  scheduledFor: string;
  sentAt: string;
  recipientEmail: string;
  status: 'delivered' | 'pending' | 'simulated';
  previewSnippet: string;
}

export type DeviceMode = 'desktop' | 'mobile-ios' | 'mobile-android';

export interface ProductivityStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  currentStreak: number;
  bestStreak: number;
  tasksCompletedToday: number;
  urgentPendingCount: number;
  highPriorityPendingCount: number;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isLocal?: boolean;
  isGuest?: boolean;
}

export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'legs' | 'glutes' | 'core' | 'cardio' | 'full_body';

export type ExerciseType = 'strength' | 'cardio' | 'bodyweight' | 'flexibility';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  type: ExerciseType;
  isCustom: boolean;
}

export interface ExerciseSet {
  reps: number;
  weight: number;
  weightUnit: 'kg' | 'lbs';
  completed: boolean;
}

export interface FitnessEntry {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  date: string;
  sets: ExerciseSet[];
  totalVolume: number;
  estimatedOneRepMax: number;
  notes?: string;
  createdAt: string;
}

export type Rank =
  | 'Loser'
  | 'Weak Rookie I' | 'Weak Rookie II' | 'Weak Rookie III'
  | 'Rookie I' | 'Rookie II' | 'Rookie III'
  | 'Amateur I' | 'Amateur II' | 'Amateur III'
  | 'Semi Soldier I' | 'Semi Soldier II' | 'Semi Soldier III'
  | 'Soldier I' | 'Soldier II' | 'Soldier III'
  | 'Elite Soldier I' | 'Elite Soldier II' | 'Elite Soldier III'
  | 'Master I' | 'Master II' | 'Master III'
  | 'Apex I' | 'Apex II' | 'Apex III'
  | 'Titan I' | 'Titan II' | 'Titan III'
  | 'Spartan'
  | 'God of Physic';

export interface RankInfo {
  rank: Rank;
  minXP: number;
  color: string;
  icon: string;
  label: string;
}

export interface FitnessStats {
  totalWorkouts: number;
  totalSets: number;
  totalVolume: number;
  totalVolumeUnit: 'kg' | 'lbs';
  currentStreak: number;
  bestStreak: number;
  lastWorkoutDate: string | null;
  xp: number;
  rank: Rank;
  muscleRanks: Record<MuscleGroup, { xp: number; rank: Rank }>;
  personalRecords: Record<string, { weight: number; reps: number; date: string }>;
  muscleGroupFrequency: Record<MuscleGroup, number>;
  weeklyVolume: { week: string; volume: number }[];
  exerciseHistory: Record<string, { date: string; volume: number; oneRepMax: number }[]>;
}

export interface UserProfile {
  fitnessMode: boolean;
  fitnessStats: FitnessStats;
  weightUnit: 'kg' | 'lbs';
  bodyWeight?: number;
  heightCm?: number;
  dateOfBirth?: string;
  goal?: 'lose_weight' | 'gain_muscle' | 'maintain' | 'strength' | 'endurance';
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  onboardingCompleted: boolean;
}
