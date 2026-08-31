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

export type ViewMode = 'home' | 'tasks' | 'fitness' | 'settings' | 'groups';

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
  status: 'delivered' | 'pending' | 'simulated' | 'failed';
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
  weightUnit: 'kg' | 'lbs';
  notes?: string;
  createdAt: string;
}

export type Rank =
  | 'Beginner'
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
  language: string;
  bodyWeight?: number;
  heightCm?: number;
  dateOfBirth?: string;
  goals?: ('lose_weight' | 'gain_muscle' | 'maintain' | 'strength' | 'endurance')[];
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  onboardingCompleted: boolean;
  leaderboardPublic: boolean;
  displayName?: string;
}

// Personal Trainer Types
export type TrainingGoal = 'strength' | 'hypertrophy' | 'endurance' | 'fat_loss' | 'general_fitness';
export type TrainingDays = 3 | 4 | 5 | 6;
export type SplitType = 'push_pull_legs' | 'upper_lower' | 'full_body' | 'bro_split' | 'custom';

export interface PlannedExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  weight?: number;
  weightUnit?: 'kg' | 'lbs';
  notes?: string;
}

export interface PlannedWorkout {
  id: string;
  dayName: string;
  dayIndex: number;
  splitName: string;
  targetMuscles: MuscleGroup[];
  exercises: PlannedExercise[];
  estimatedMinutes: number;
  completed: boolean;
}

export interface WeeklyPlan {
  id: string;
  name: string;
  goal: TrainingGoal;
  splitType: SplitType;
  trainingDays: TrainingDays;
  workouts: PlannedWorkout[];
  createdAt: string;
  weekStart: string;
  isActive: boolean;
}

export interface WeakPoint {
  muscleGroup: MuscleGroup;
  currentXp: number;
  currentRank: Rank;
  frequency: number;
  avgWeeklyFrequency: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface RecoveryStatus {
  muscleGroup: MuscleGroup;
  lastTrained: string | null;
  daysSinceLast: number;
  recoveryPercent: number;
  isRecovered: boolean;
  daysNeeded: number;
}

export interface TrainerSuggestion {
  type: 'weak_point' | 'recovery' | 'progressive_overload' | 'deload' | 'milestone';
  title: string;
  description: string;
  muscleGroup?: MuscleGroup;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
}

// Group Types
export interface GroupMember {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  joinCode: string;
  createdBy: string;
  members: GroupMember[];
  createdAt: string;
  color?: string;
}

export interface GroupTask extends Task {
  groupId: string;
  createdBy: string;
  createdByName: string;
  assignedTo?: string;
  assignedToName?: string;
  comments: GroupTaskComment[];
}

export interface GroupTaskComment {
  id: string;
  uid: string;
  displayName: string;
  text: string;
  createdAt: string;
}

// Nutrition & Meal Plan Types
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number; // grams
  carbs: number;
  fat: number;
  fiber?: number;
  servingSize: string;
  servingUnit: string;
}

export interface MealEntry {
  id: string;
  foodItem: FoodItem;
  quantity: number;
  mealType: MealType;
  date: string;
  createdAt: string;
}

export interface DailyNutritionTarget {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealPlan {
  id: string;
  name: string;
  target: DailyNutritionTarget;
  meals: {
    mealType: MealType;
    foods: { foodItem: FoodItem; quantity: number }[];
    notes?: string;
  }[];
  generatedByAI: boolean;
  createdAt: string;
}

export interface NutritionLog {
  date: string;
  entries: MealEntry[];
  totals: DailyNutritionTarget;
  target: DailyNutritionTarget;
}

export interface NutritionProfile {
  dailyTarget: DailyNutritionTarget;
  weightKg?: number;
  heightCm?: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose_weight' | 'maintain' | 'gain_weight' | 'gain_muscle';
  dietaryRestrictions: string[];
  mealPlans: MealPlan[];
}
