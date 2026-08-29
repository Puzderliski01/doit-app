import {
  Rank,
  RankInfo,
  FitnessStats,
  FitnessEntry,
  Exercise,
  MuscleGroup,
  ExerciseSet,
  UserProfile,
} from '../types';

export const RANKS: RankInfo[] = [
  { rank: 'Unranked', minXP: 0, color: '#6b7280', icon: '?', label: 'Unranked' },
  { rank: 'Novice', minXP: 50, color: '#9ca3af', icon: 'I', label: 'Novice' },
  { rank: 'Beginner', minXP: 200, color: '#22c55e', icon: 'II', label: 'Beginner' },
  { rank: 'Intermediate', minXP: 500, color: '#3b82f6', icon: 'III', label: 'Intermediate' },
  { rank: 'Advanced', minXP: 1200, color: '#a855f7', icon: 'IV', label: 'Advanced' },
  { rank: 'Elite', minXP: 3000, color: '#f59e0b', icon: 'V', label: 'Elite' },
  { rank: 'Legend', minXP: 7000, color: '#ef4444', icon: 'VI', label: 'Legend' },
  { rank: 'Godlike', minXP: 15000, color: '#f97316', icon: 'VII', label: 'Godlike' },
];

export const DEFAULT_FITNESS_STATS: FitnessStats = {
  totalWorkouts: 0,
  totalSets: 0,
  totalVolume: 0,
  totalVolumeUnit: 'kg',
  currentStreak: 0,
  bestStreak: 0,
  lastWorkoutDate: null,
  xp: 0,
  rank: 'Unranked',
  personalRecords: {},
  muscleGroupFrequency: {
    chest: 0,
    back: 0,
    shoulders: 0,
    biceps: 0,
    triceps: 0,
    legs: 0,
    glutes: 0,
    core: 0,
    cardio: 0,
    full_body: 0,
  },
  weeklyVolume: [],
  exerciseHistory: {},
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  fitnessMode: false,
  fitnessStats: DEFAULT_FITNESS_STATS,
  weightUnit: 'kg',
  onboardingCompleted: false,
};

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  legs: 'Legs',
  glutes: 'Glutes',
  core: 'Core',
  cardio: 'Cardio',
  full_body: 'Full Body',
};

export const MUSCLE_GROUP_COLORS: Record<MuscleGroup, string> = {
  chest: '#ef4444',
  back: '#3b82f6',
  shoulders: '#f59e0b',
  biceps: '#ec4899',
  triceps: '#8b5cf6',
  legs: '#22c55e',
  glutes: '#f97316',
  core: '#06b6d4',
  cardio: '#ef4444',
  full_body: '#6366f1',
};

export const MUSCLE_GROUP_ICONS: Record<MuscleGroup, string> = {
  chest: '💪',
  back: '🔙',
  shoulders: '🎯',
  biceps: '💪',
  triceps: '🦾',
  legs: '🦵',
  glutes: '🍑',
  core: '🔥',
  cardio: '❤️',
  full_body: '⚡',
};

export const BODYWEIGHT_EXERCISES: Exercise[] = [
  { id: 'pushup', name: 'Push-ups', muscleGroup: 'chest', type: 'bodyweight', isCustom: false },
  { id: 'pullup', name: 'Pull-ups', muscleGroup: 'back', type: 'bodyweight', isCustom: false },
  { id: 'chinup', name: 'Chin-ups', muscleGroup: 'biceps', type: 'bodyweight', isCustom: false },
  { id: 'dip', name: 'Dips', muscleGroup: 'triceps', type: 'bodyweight', isCustom: false },
  { id: 'squat_bw', name: 'Bodyweight Squats', muscleGroup: 'legs', type: 'bodyweight', isCustom: false },
  { id: 'lunge', name: 'Lunges', muscleGroup: 'legs', type: 'bodyweight', isCustom: false },
  { id: 'plank', name: 'Plank', muscleGroup: 'core', type: 'bodyweight', isCustom: false },
  { id: 'crunch', name: 'Crunches', muscleGroup: 'core', type: 'bodyweight', isCustom: false },
  { id: 'russian_twist', name: 'Russian Twists', muscleGroup: 'core', type: 'bodyweight', isCustom: false },
  { id: 'burpee', name: 'Burpees', muscleGroup: 'full_body', type: 'bodyweight', isCustom: false },
  { id: 'mountain_climber', name: 'Mountain Climbers', muscleGroup: 'full_body', type: 'bodyweight', isCustom: false },
  { id: 'jumping_jack', name: 'Jumping Jacks', muscleGroup: 'cardio', type: 'cardio', isCustom: false },
  { id: 'calf_raise', name: 'Calf Raises', muscleGroup: 'legs', type: 'bodyweight', isCustom: false },
  { id: 'glute_bridge', name: 'Glute Bridge', muscleGroup: 'glutes', type: 'bodyweight', isCustom: false },
  { id: 'pike_pushup', name: 'Pike Push-ups', muscleGroup: 'shoulders', type: 'bodyweight', isCustom: false },
  { id: 'inverted_row', name: 'Inverted Rows', muscleGroup: 'back', type: 'bodyweight', isCustom: false },
  { id: 'leg_raise', name: 'Hanging Leg Raises', muscleGroup: 'core', type: 'bodyweight', isCustom: false },
  { id: 'muscle_up', name: 'Muscle-ups', muscleGroup: 'full_body', type: 'bodyweight', isCustom: false },
];

export const BARBELL_EXERCISES: Exercise[] = [
  { id: 'bench_press', name: 'Bench Press', muscleGroup: 'chest', type: 'strength', isCustom: false },
  { id: 'incline_bench', name: 'Incline Bench Press', muscleGroup: 'chest', type: 'strength', isCustom: false },
  { id: 'decline_bench', name: 'Decline Bench Press', muscleGroup: 'chest', type: 'strength', isCustom: false },
  { id: 'squat', name: 'Barbell Squat', muscleGroup: 'legs', type: 'strength', isCustom: false },
  { id: 'front_squat', name: 'Front Squat', muscleGroup: 'legs', type: 'strength', isCustom: false },
  { id: 'deadlift', name: 'Deadlift', muscleGroup: 'back', type: 'strength', isCustom: false },
  { id: 'romanian_deadlift', name: 'Romanian Deadlift', muscleGroup: 'legs', type: 'strength', isCustom: false },
  { id: 'overhead_press', name: 'Overhead Press', muscleGroup: 'shoulders', type: 'strength', isCustom: false },
  { id: 'barbell_row', name: 'Barbell Row', muscleGroup: 'back', type: 'strength', isCustom: false },
  { id: 'barbell_curl', name: 'Barbell Curl', muscleGroup: 'biceps', type: 'strength', isCustom: false },
  { id: 'skull_crusher', name: 'Skull Crushers', muscleGroup: 'triceps', type: 'strength', isCustom: false },
  { id: 'hip_thrust', name: 'Barbell Hip Thrust', muscleGroup: 'glutes', type: 'strength', isCustom: false },
  { id: 'shrug', name: 'Barbell Shrugs', muscleGroup: 'shoulders', type: 'strength', isCustom: false },
  { id: 'pendlay_row', name: 'Pendlay Row', muscleGroup: 'back', type: 'strength', isCustom: false },
];

export const DUMBBELL_EXERCISES: Exercise[] = [
  { id: 'db_bench', name: 'Dumbbell Bench Press', muscleGroup: 'chest', type: 'strength', isCustom: false },
  { id: 'db_incline', name: 'Incline DB Press', muscleGroup: 'chest', type: 'strength', isCustom: false },
  { id: 'db_fly', name: 'Dumbbell Flyes', muscleGroup: 'chest', type: 'strength', isCustom: false },
  { id: 'db_shoulder_press', name: 'DB Shoulder Press', muscleGroup: 'shoulders', type: 'strength', isCustom: false },
  { id: 'db_lateral_raise', name: 'Lateral Raises', muscleGroup: 'shoulders', type: 'strength', isCustom: false },
  { id: 'db_front_raise', name: 'Front Raises', muscleGroup: 'shoulders', type: 'strength', isCustom: false },
  { id: 'db_row', name: 'Dumbbell Row', muscleGroup: 'back', type: 'strength', isCustom: false },
  { id: 'db_curl', name: 'Dumbbell Curl', muscleGroup: 'biceps', type: 'strength', isCustom: false },
  { id: 'db_hammer_curl', name: 'Hammer Curl', muscleGroup: 'biceps', type: 'strength', isCustom: false },
  { id: 'db_tricep_ext', name: 'Tricep Extension', muscleGroup: 'triceps', type: 'strength', isCustom: false },
  { id: 'db_lunge', name: 'DB Lunges', muscleGroup: 'legs', type: 'strength', isCustom: false },
  { id: 'db_squat', name: 'Goblet Squat', muscleGroup: 'legs', type: 'strength', isCustom: false },
  { id: 'db_rdl', name: 'DB Romanian Deadlift', muscleGroup: 'legs', type: 'strength', isCustom: false },
  { id: 'db_shrug', name: 'DB Shrugs', muscleGroup: 'shoulders', type: 'strength', isCustom: false },
];

export const MACHINE_EXERCISES: Exercise[] = [
  { id: 'cable_fly', name: 'Cable Flyes', muscleGroup: 'chest', type: 'strength', isCustom: false },
  { id: 'lat_pulldown', name: 'Lat Pulldown', muscleGroup: 'back', type: 'strength', isCustom: false },
  { id: 'cable_row', name: 'Cable Row', muscleGroup: 'back', type: 'strength', isCustom: false },
  { id: 'leg_press', name: 'Leg Press', muscleGroup: 'legs', type: 'strength', isCustom: false },
  { id: 'leg_extension', name: 'Leg Extension', muscleGroup: 'legs', type: 'strength', isCustom: false },
  { id: 'leg_curl', name: 'Leg Curl', muscleGroup: 'legs', type: 'strength', isCustom: false },
  { id: 'pec_deck', name: 'Pec Deck', muscleGroup: 'chest', type: 'strength', isCustom: false },
  { id: 'shoulder_press_machine', name: 'Shoulder Press Machine', muscleGroup: 'shoulders', type: 'strength', isCustom: false },
  { id: 'tricep_pushdown', name: 'Tricep Pushdown', muscleGroup: 'triceps', type: 'strength', isCustom: false },
  { id: 'bicep_curl_machine', name: 'Bicep Curl Machine', muscleGroup: 'biceps', type: 'strength', isCustom: false },
  { id: 'ab_crunch_machine', name: 'Ab Crunch Machine', muscleGroup: 'core', type: 'strength', isCustom: false },
  { id: 'calf_raise_machine', name: 'Calf Raise Machine', muscleGroup: 'legs', type: 'strength', isCustom: false },
  { id: 'glute_kickback', name: 'Glute Kickback Machine', muscleGroup: 'glutes', type: 'strength', isCustom: false },
];

export const ALL_EXERCISES: Exercise[] = [
  ...BODYWEIGHT_EXERCISES,
  ...BARBELL_EXERCISES,
  ...DUMBBELL_EXERCISES,
  ...MACHINE_EXERCISES,
];

export function getRankInfo(rank: Rank): RankInfo {
  return RANKS.find((r) => r.rank === rank) || RANKS[0];
}

export function calculateRank(xp: number): Rank {
  let rank: Rank = 'Unranked';
  for (const r of RANKS) {
    if (xp >= r.minXP) rank = r.rank;
  }
  return rank;
}

export function calculateXPForWorkout(entry: FitnessEntry): number {
  let xp = 0;
  const completedSets = entry.sets.filter((s) => s.completed);
  const setCount = completedSets.length;
  xp += setCount * 5;
  const volume = entry.totalVolume;
  xp += Math.floor(volume / 100);
  if (entry.estimatedOneRepMax > 0) {
    xp += Math.floor(entry.estimatedOneRepMax / 10);
  }
  if (setCount >= 5) xp += 10;
  if (setCount >= 10) xp += 15;
  return Math.max(xp, 5);
}

export function calculateStreak(lastWorkoutDate: string | null): number {
  if (!lastWorkoutDate) return 0;
  const last = new Date(lastWorkoutDate);
  const now = new Date();
  const diffMs = now.getTime() - last.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return 1;
  return 0;
}

export function calculateOneRepMax(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps === 0) return 0;
  return Math.round(weight * (1 + reps / 30));
}

export function calculateTotalVolume(sets: ExerciseSet[]): number {
  return sets
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + s.weight * s.reps, 0);
}

export function getDefaultSets(): ExerciseSet[] {
  return [
    { reps: 0, weight: 0, weightUnit: 'kg', completed: false },
    { reps: 0, weight: 0, weightUnit: 'kg', completed: false },
    { reps: 0, weight: 0, weightUnit: 'kg', completed: false },
  ];
}

export function updateFitnessStats(
  stats: FitnessStats,
  entry: FitnessEntry,
  weightUnit: 'kg' | 'lbs'
): FitnessStats {
  const newStats = { ...stats };
  newStats.totalWorkouts += 1;
  newStats.totalSets += entry.sets.filter((s) => s.completed).length;
  newStats.totalVolume += entry.totalVolume;
  newStats.totalVolumeUnit = weightUnit;
  newStats.lastWorkoutDate = entry.date;

  const today = new Date(entry.date).toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  if (stats.lastWorkoutDate) {
    const lastDate = new Date(stats.lastWorkoutDate).toDateString();
    if (lastDate === yesterdayStr) {
      newStats.currentStreak = stats.currentStreak + 1;
    } else if (lastDate !== today) {
      newStats.currentStreak = 1;
    }
  } else {
    newStats.currentStreak = 1;
  }

  if (newStats.currentStreak > newStats.bestStreak) {
    newStats.bestStreak = newStats.currentStreak;
  }

  const prKey = entry.exerciseId;
  const existingPR = stats.personalRecords[prKey];
  if (!existingPR || entry.estimatedOneRepMax > existingPR.weight) {
    newStats.personalRecords = {
      ...newStats.personalRecords,
      [prKey]: {
        weight: entry.estimatedOneRepMax,
        reps: entry.sets.find((s) => s.completed)?.reps || 0,
        date: entry.date,
      },
    };
  }

  newStats.muscleGroupFrequency = { ...stats.muscleGroupFrequency };
  newStats.muscleGroupFrequency[entry.muscleGroup] =
    (newStats.muscleGroupFrequency[entry.muscleGroup] || 0) + 1;

  const weekKey = getWeekKey(new Date(entry.date));
  const existingWeek = newStats.weeklyVolume.find((w) => w.week === weekKey);
  if (existingWeek) {
    existingWeek.volume += entry.totalVolume;
  } else {
    newStats.weeklyVolume.push({ week: weekKey, volume: entry.totalVolume });
  }
  if (newStats.weeklyVolume.length > 12) {
    newStats.weeklyVolume = newStats.weeklyVolume.slice(-12);
  }

  newStats.exerciseHistory = { ...stats.exerciseHistory };
  if (!newStats.exerciseHistory[entry.exerciseId]) {
    newStats.exerciseHistory[entry.exerciseId] = [];
  }
  newStats.exerciseHistory[entry.exerciseId].push({
    date: entry.date,
    volume: entry.totalVolume,
    oneRepMax: entry.estimatedOneRepMax,
  });

  const xpFromWorkout = calculateXPForWorkout(entry);
  const streakBonus = newStats.currentStreak >= 7 ? 50 : newStats.currentStreak >= 3 ? 20 : 0;
  newStats.xp = stats.xp + xpFromWorkout + streakBonus;
  newStats.rank = calculateRank(newStats.xp);

  return newStats;
}

function getWeekKey(date: Date): string {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return start.toISOString().split('T')[0];
}

export function getFormattedVolume(volume: number, unit: 'kg' | 'lbs'): string {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M ${unit}`;
  }
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k ${unit}`;
  }
  return `${volume} ${unit}`;
}

export function getProgressToNextRank(
  xp: number
): { current: number; needed: number; percent: number; nextRank: RankInfo | null } {
  const currentRankInfo = getRankInfo(calculateRank(xp));
  const currentRankIndex = RANKS.findIndex((r) => r.rank === currentRankInfo.rank);
  if (currentRankIndex >= RANKS.length - 1) {
    return { current: xp, needed: xp, percent: 100, nextRank: null };
  }
  const nextRank = RANKS[currentRankIndex + 1];
  const currentMin = currentRankInfo.minXP;
  const needed = nextRank.minXP - currentMin;
  const progress = xp - currentMin;
  const percent = Math.min(100, Math.round((progress / needed) * 100));
  return { current: progress, needed, percent, nextRank };
}

export function searchExercises(query: string): Exercise[] {
  if (!query.trim()) return ALL_EXERCISES;
  const lower = query.toLowerCase();
  return ALL_EXERCISES.filter(
    (e) =>
      e.name.toLowerCase().includes(lower) ||
      e.muscleGroup.toLowerCase().includes(lower) ||
      e.type.toLowerCase().includes(lower)
  );
}

export function getExercisesByMuscleGroup(group: MuscleGroup): Exercise[] {
  return ALL_EXERCISES.filter((e) => e.muscleGroup === group);
}

export function getExerciseById(id: string): Exercise | undefined {
  return ALL_EXERCISES.find((e) => e.id === id);
}

export function getMuscleGroupStats(
  stats: FitnessStats
): { group: MuscleGroup; count: number; percent: number }[] {
  const total = Object.values(stats.muscleGroupFrequency).reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  return Object.entries(stats.muscleGroupFrequency)
    .map(([group, count]) => ({
      group: group as MuscleGroup,
      count,
      percent: Math.round((count / total) * 100),
    }))
    .filter((g) => g.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function getWeeklyVolumeData(stats: FitnessStats): { week: string; volume: number }[] {
  return stats.weeklyVolume.slice(-8);
}
