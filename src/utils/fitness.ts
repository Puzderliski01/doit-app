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

// 30 ranks with differentiated badges
// Within a tier (I/II/III): badge varies slightly (outline → filled → bold)
export const RANKS: RankInfo[] = [
  { rank: 'Beginner', minXP: 0, color: '#78716c', icon: '💀', label: 'Beginner' },
  { rank: 'Weak Rookie I', minXP: 500, color: '#a8a29e', icon: '🦴', label: 'Weak Rookie I' },
  { rank: 'Weak Rookie II', minXP: 1200, color: '#b0afa9', icon: '🩹', label: 'Weak Rookie II' },
  { rank: 'Weak Rookie III', minXP: 2200, color: '#d6d3d1', icon: '🤕', label: 'Weak Rookie III' },
  { rank: 'Rookie I', minXP: 3500, color: '#86efac', icon: '🌱', label: 'Rookie I' },
  { rank: 'Rookie II', minXP: 5200, color: '#6ee7b7', icon: '🌿', label: 'Rookie II' },
  { rank: 'Rookie III', minXP: 7500, color: '#34d399', icon: '🍀', label: 'Rookie III' },
  { rank: 'Amateur I', minXP: 10500, color: '#67e8f9', icon: '🥉', label: 'Amateur I' },
  { rank: 'Amateur II', minXP: 14500, color: '#22d3ee', icon: '🏅', label: 'Amateur II' },
  { rank: 'Amateur III', minXP: 20000, color: '#06b6d4', icon: '🏆', label: 'Amateur III' },
  { rank: 'Semi Soldier I', minXP: 27000, color: '#93c5fd', icon: '⚔️', label: 'Semi Soldier I' },
  { rank: 'Semi Soldier II', minXP: 35000, color: '#60a5fa', icon: '🗡️', label: 'Semi Soldier II' },
  { rank: 'Semi Soldier III', minXP: 45000, color: '#3b82f6', icon: '🛡️', label: 'Semi Soldier III' },
  { rank: 'Soldier I', minXP: 58000, color: '#c084fc', icon: '🎖️', label: 'Soldier I' },
  { rank: 'Soldier II', minXP: 73000, color: '#a855f7', icon: '⚜️', label: 'Soldier II' },
  { rank: 'Soldier III', minXP: 92000, color: '#9333ea', icon: '🔱', label: 'Soldier III' },
  { rank: 'Elite Soldier I', minXP: 115000, color: '#fca5a5', icon: '🔥', label: 'Elite Soldier I' },
  { rank: 'Elite Soldier II', minXP: 142000, color: '#f87171', icon: '💥', label: 'Elite Soldier II' },
  { rank: 'Elite Soldier III', minXP: 175000, color: '#ef4444', icon: '⚡', label: 'Elite Soldier III' },
  { rank: 'Master I', minXP: 215000, color: '#fcd34d', icon: '👑', label: 'Master I' },
  { rank: 'Master II', minXP: 265000, color: '#fbbf24', icon: '💎', label: 'Master II' },
  { rank: 'Master III', minXP: 325000, color: '#f59e0b', icon: '⚜️', label: 'Master III' },
  { rank: 'Apex I', minXP: 400000, color: '#fb923c', icon: '🐉', label: 'Apex I' },
  { rank: 'Apex II', minXP: 490000, color: '#f97316', icon: '🦅', label: 'Apex II' },
  { rank: 'Apex III', minXP: 600000, color: '#ea580c', icon: '🦁', label: 'Apex III' },
  { rank: 'Titan I', minXP: 730000, color: '#d946ef', icon: '🗿', label: 'Titan I' },
  { rank: 'Titan II', minXP: 890000, color: '#c026d3', icon: '🪐', label: 'Titan II' },
  { rank: 'Titan III', minXP: 1080000, color: '#a21caf', icon: '🌋', label: 'Titan III' },
  { rank: 'Spartan', minXP: 1300000, color: '#dc2626', icon: '⚔️', label: 'Spartan' },
  { rank: 'God of Physic', minXP: 1600000, color: '#ffd700', icon: '🔱', label: 'God of Physic' },
];

// Exercise difficulty multiplier — harder exercises give more XP per rep
// Scale: 0.4 (very easy) → 3.0 (extremely hard)
export const EXERCISE_DIFFICULTY: Record<string, number> = {
  // === BODYWEIGHT ===
  pushup: 2.0,
  pullup: 2.5,
  chinup: 2.0,
  dip: 1.8,
  squat_bw: 0.5,
  lunge: 0.9,
  plank: 0.5,
  crunch: 1.0,
  russian_twist: 1.5,
  burpee: 2.5,
  mountain_climber: 0.8,
  jumping_jack: 0.4,
  calf_raise: 1.0,
  glute_bridge: 0.5,
  pike_pushup: 2.5,
  inverted_row: 1.5,
  leg_raise: 1.5,
  muscle_up: 25.0,

  // === BARBELL ===
  bench_press: 1.0,
  incline_bench: 1.3,
  decline_bench: 1.2,
  squat: 2.0,
  front_squat: 1.7,
  deadlift: 2.5,
  romanian_deadlift: 2.6,
  overhead_press: 1.5,
  barbell_row: 1.3,
  barbell_curl: 1.0,
  skull_crusher: 1.5,
  hip_thrust: 1.2,
  shrug: 0.7,
  pendlay_row: 1.4,

  // === DUMBBELL ===
  db_bench: 1.1,
  db_incline: 1.2,
  db_fly: 0.9,
  db_shoulder_press: 1.2,
  db_lateral_raise: 0.8,
  db_front_raise: 0.7,
  db_row: 1.1,
  db_curl: 0.8,
  db_hammer_curl: 0.8,
  db_tricep_ext: 0.8,
  db_lunge: 1.0,
  db_squat: 1.0,
  db_rdl: 1.3,
  db_shrug: 0.6,

  // === MACHINE ===
  cable_fly: 0.8,
  lat_pulldown: 1.0,
  cable_row: 1.0,
  leg_press: 0.8,
  leg_extension: 0.6,
  leg_curl: 0.6,
  pec_deck: 0.7,
  shoulder_press_machine: 0.8,
  tricep_pushdown: 0.7,
  bicep_curl_machine: 0.6,
  ab_crunch_machine: 0.5,
  calf_raise_machine: 0.5,
  glute_kickback: 0.6,

  // === CARDIO ===
  running: 1.0,
  cycling: 0.8,
  rowing: 1.2,
  jump_rope: 1.1,
  swimming: 1.3,
  elliptical: 0.7,
  stairmaster: 1.1,
  hiking: 0.9,
  walking: 0.4,
  hiit: 1.5,
};

export function getExerciseDifficulty(exerciseId: string): number {
  return EXERCISE_DIFFICULTY[exerciseId] || 1.0;
}

// Muscle engagement per exercise: { muscleGroup: percent }
// Percentages represent how much XP goes to each muscle
// Primary muscle gets the biggest share, secondary muscles get smaller shares
export const MUSCLE_ENGAGEMENT: Record<string, Partial<Record<MuscleGroup, number>>> = {
  // Bodyweight
  pushup: { chest: 50, triceps: 30, shoulders: 20 },
  pullup: { back: 55, biceps: 25, core: 20 },
  chinup: { biceps: 45, back: 35, core: 20 },
  dip: { triceps: 45, chest: 35, shoulders: 20 },
  squat_bw: { legs: 60, glutes: 25, core: 15 },
  lunge: { legs: 50, glutes: 30, core: 20 },
  plank: { core: 80, shoulders: 10, legs: 10 },
  crunch: { core: 90, legs: 10 },
  russian_twist: { core: 85, legs: 15 },
  burpee: { full_body: 50, legs: 20, chest: 15, core: 15 },
  mountain_climber: { full_body: 40, core: 35, legs: 25 },
  jumping_jack: { cardio: 70, legs: 20, shoulders: 10 },
  calf_raise: { legs: 80, glutes: 20 },
  glute_bridge: { glutes: 70, legs: 20, core: 10 },
  pike_pushup: { shoulders: 55, triceps: 25, chest: 20 },
  inverted_row: { back: 55, biceps: 30, core: 15 },
  leg_raise: { core: 75, legs: 25 },
  muscle_up: { full_body: 40, back: 30, biceps: 15, core: 15 },
  // Barbell
  bench_press: { chest: 55, triceps: 25, shoulders: 20 },
  incline_bench: { chest: 55, shoulders: 25, triceps: 20 },
  decline_bench: { chest: 60, triceps: 25, shoulders: 15 },
  squat: { legs: 50, glutes: 25, core: 15, back: 10 },
  front_squat: { legs: 55, core: 20, glutes: 15, shoulders: 10 },
  deadlift: { back: 35, legs: 30, glutes: 20, core: 15 },
  romanian_deadlift: { legs: 45, glutes: 35, back: 20 },
  overhead_press: { shoulders: 55, triceps: 25, core: 20 },
  barbell_row: { back: 60, biceps: 25, core: 15 },
  barbell_curl: { biceps: 80, shoulders: 20 },
  skull_crusher: { triceps: 80, shoulders: 20 },
  hip_thrust: { glutes: 65, legs: 25, core: 10 },
  shrug: { shoulders: 70, back: 30 },
  pendlay_row: { back: 60, biceps: 25, core: 15 },
  // Dumbbell
  db_bench: { chest: 55, triceps: 25, shoulders: 20 },
  db_incline: { chest: 55, shoulders: 25, triceps: 20 },
  db_fly: { chest: 70, shoulders: 20, biceps: 10 },
  db_shoulder_press: { shoulders: 60, triceps: 25, core: 15 },
  db_lateral_raise: { shoulders: 80, core: 20 },
  db_front_raise: { shoulders: 75, core: 25 },
  db_row: { back: 55, biceps: 30, core: 15 },
  db_curl: { biceps: 85, shoulders: 15 },
  db_hammer_curl: { biceps: 75, shoulders: 25 },
  db_tricep_ext: { triceps: 85, shoulders: 15 },
  db_lunge: { legs: 50, glutes: 30, core: 20 },
  db_squat: { legs: 55, glutes: 25, core: 20 },
  db_rdl: { legs: 45, glutes: 35, back: 20 },
  db_shrug: { shoulders: 70, back: 30 },
  // Machine
  cable_fly: { chest: 75, shoulders: 15, triceps: 10 },
  lat_pulldown: { back: 60, biceps: 30, core: 10 },
  cable_row: { back: 55, biceps: 30, core: 15 },
  leg_press: { legs: 60, glutes: 30, core: 10 },
  leg_extension: { legs: 90, core: 10 },
  leg_curl: { legs: 90, glutes: 10 },
  pec_deck: { chest: 80, shoulders: 15, triceps: 5 },
  shoulder_press_machine: { shoulders: 60, triceps: 30, core: 10 },
  tricep_pushdown: { triceps: 85, shoulders: 15 },
  bicep_curl_machine: { biceps: 90, shoulders: 10 },
  ab_crunch_machine: { core: 85, legs: 15 },
  calf_raise_machine: { legs: 85, glutes: 15 },
  glute_kickback: { glutes: 80, legs: 20 },
};

const MUSCLE_GROUPS_LIST: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'legs', 'glutes', 'core', 'cardio', 'full_body',
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
  rank: 'Beginner',
  muscleRanks: Object.fromEntries(
    MUSCLE_GROUPS_LIST.map((g) => [g, { xp: 0, rank: 'Beginner' as Rank }])
  ) as Record<MuscleGroup, { xp: number; rank: Rank }>,
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
  language: 'en',
  onboardingCompleted: false,
  leaderboardPublic: false,
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
  let rank: Rank = 'Beginner';
  for (const r of RANKS) {
    if (xp >= r.minXP) rank = r.rank;
  }
  return rank;
}

export function getMuscleEngagement(exerciseId: string): Partial<Record<MuscleGroup, number>> {
  return MUSCLE_ENGAGEMENT[exerciseId] || {};
}

export function calculateXPForWorkout(entry: FitnessEntry): number {
  let xp = 0;
  const completedSets = entry.sets.filter((s) => s.completed);
  const setCount = completedSets.length;

  if (setCount === 0) return 0;

  const isBodyweight = isBodyweightExercise(entry.exerciseId);
  const hasWeight = completedSets.some((s) => s.weight > 0);

  if (isBodyweight && !hasWeight) {
    // PURE BODYWEIGHT: XP from reps only
    for (const set of completedSets) {
      if (set.reps <= 0) continue;
      const repXP = (set.reps * (set.reps + 1)) / 2;
      xp += Math.floor(repXP);
    }
    const totalReps = completedSets.reduce((sum, s) => sum + s.reps, 0);
    if (totalReps >= 50) xp += 10;
    if (totalReps >= 100) xp += 25;
    if (totalReps >= 200) xp += 50;
  } else if (hasWeight) {
    // kg gives 2.2x more XP per unit than lbs (1 kg = 2.2 lbs)
    const weightMultiplier = entry.weightUnit === 'kg' ? 2.2 : 1;
    for (const set of completedSets) {
      if (set.reps <= 0) continue;
      if (set.weight > 0) {
        const effectiveWeight = set.weight * weightMultiplier;
        const volumeXP = Math.floor(effectiveWeight * set.reps * (1 + effectiveWeight / 440));
        const set1RM = calculateOneRepMax(set.weight, set.reps);
        const effective1RM = set1RM * weightMultiplier;
        const oneRMXP = Math.floor(effective1RM / 5);
        xp += volumeXP + oneRMXP;
      } else if (!isBodyweight) {
        xp += 0;
      }
    }
    const volume = entry.totalVolume * weightMultiplier;
    if (volume >= 1000) xp += 20;
    if (volume >= 5000) xp += 50;
    if (volume >= 10000) xp += 100;
    if (volume >= 25000) xp += 200;
  } else {
    xp = 0;
  }

  if (setCount >= 5) xp += 10;
  if (setCount >= 8) xp += 25;

  // Apply exercise difficulty multiplier
  const difficulty = getExerciseDifficulty(entry.exerciseId);
  xp = Math.floor(xp * difficulty);

  return Math.max(xp, 0);
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

export function getDefaultSets(unit: 'kg' | 'lbs' = 'kg'): ExerciseSet[] {
  return [
    { reps: 0, weight: 0, weightUnit: unit, completed: false },
    { reps: 0, weight: 0, weightUnit: unit, completed: false },
    { reps: 0, weight: 0, weightUnit: unit, completed: false },
  ];
}

export function updateFitnessStats(
  stats: FitnessStats,
  entry: FitnessEntry,
): FitnessStats {
  const newStats = { ...stats };
  newStats.totalWorkouts += 1;
  newStats.totalSets += entry.sets.filter((s) => s.completed).length;
  newStats.totalVolume += entry.totalVolume;
  newStats.totalVolumeUnit = entry.weightUnit;
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

  // Calculate total XP from workout
  const totalXP = calculateXPForWorkout(entry);
  const streakBonus = newStats.currentStreak >= 7 ? 50 : newStats.currentStreak >= 3 ? 20 : 0;
  const finalXP = totalXP + streakBonus;

  // Distribute XP to global rank
  newStats.xp = stats.xp + finalXP;
  newStats.rank = calculateRank(newStats.xp);

  // Distribute XP to per-muscle ranks based on muscle engagement
  const engagement = getMuscleEngagement(entry.exerciseId);
  newStats.muscleRanks = { ...stats.muscleRanks };

  if (Object.keys(engagement).length > 0) {
    // Split XP by engagement percentages
    for (const [muscle, percent] of Object.entries(engagement)) {
      const muscleKey = muscle as MuscleGroup;
      const muscleXP = Math.round((finalXP * (percent as number)) / 100);
      const currentMuscleData = newStats.muscleRanks[muscleKey] || { xp: 0, rank: 'Beginner' as Rank };
      const newMuscleXP = currentMuscleData.xp + muscleXP;
      newStats.muscleRanks[muscleKey] = {
        xp: newMuscleXP,
        rank: calculateRank(newMuscleXP),
      };
    }
  } else {
    // Fallback: give all XP to the primary muscle group
    const primaryMuscle = entry.muscleGroup;
    const currentMuscleData = newStats.muscleRanks[primaryMuscle] || { xp: 0, rank: 'Beginner' as Rank };
    newStats.muscleRanks[primaryMuscle] = {
      xp: currentMuscleData.xp + finalXP,
      rank: calculateRank(currentMuscleData.xp + finalXP),
    };
  }

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

export function isBodyweightExercise(exerciseId: string): boolean {
  const exercise = ALL_EXERCISES.find((e) => e.id === exerciseId);
  return exercise?.type === 'bodyweight';
}
