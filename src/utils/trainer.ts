import {
  MuscleGroup, FitnessStats, WeeklyPlan, PlannedWorkout, PlannedExercise,
  WeakPoint, RecoveryStatus, TrainerSuggestion, TrainingGoal, TrainingDays,
  SplitType, FitnessEntry, Rank
} from '../types';
import { ALL_EXERCISES, MUSCLE_ENGAGEMENT, getRankInfo, RANKS, getProgressToNextRank } from './fitness';
import { Exercise } from '../types';

const MUSCLE_GROUPS: MuscleGroup[] = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core', 'cardio', 'full_body'];

const RECOVERY_DAYS: Record<MuscleGroup, number> = {
  chest: 2, back: 2, shoulders: 2, biceps: 2, triceps: 2,
  legs: 3, glutes: 3, core: 1, cardio: 1, full_body: 3
};

// --- Weak Points Detection ---

export function detectWeakPoints(stats: FitnessStats): WeakPoint[] {
  const weakPoints: WeakPoint[] = [];
  const allMuscles = MUSCLE_GROUPS.filter(m => m !== 'cardio' && m !== 'full_body');

  for (const muscle of allMuscles) {
    const rankData = stats.muscleRanks[muscle];
    const xp = rankData?.xp || 0;
    const rank = rankData?.rank || 'Beginner';
    const frequency = stats.muscleGroupFrequency[muscle] || 0;
    const totalWorkouts = stats.totalWorkouts || 1;
    const avgWeeklyFrequency = Math.round((frequency / totalWorkouts) * 10) / 10;

    const rankInfo = getRankInfo(rank);
    const progress = getProgressToNextRank(xp);
    const rankIndex = RANKS.findIndex(r => r.rank === rank);
    const avgRankIndex = Math.floor(allMuscles.reduce((sum, m) => {
      const r = getRankInfo(stats.muscleRanks[m]?.rank || 'Beginner');
      return sum + RANKS.findIndex(ri => ri.rank === r.rank);
    }, 0) / allMuscles.length);

    let priority: 'high' | 'medium' | 'low' = 'low';
    let reason = '';

    if (rankIndex < avgRankIndex - 2) {
      priority = 'high';
      reason = `${rankInfo.label} is significantly behind average`;
    } else if (rankIndex < avgRankIndex) {
      priority = 'medium';
      reason = `${rankInfo.label} is below average`;
    } else if (avgWeeklyFrequency < 0.5 && frequency > 0) {
      priority = 'medium';
      reason = `Low training frequency (${avgWeeklyFrequency}x/week)`;
    } else if (avgWeeklyFrequency === 0 && stats.totalWorkouts > 3) {
      priority = 'high';
      reason = 'Never trained this muscle group';
    }

    if (priority !== 'low' || rankIndex < avgRankIndex) {
      weakPoints.push({
        muscleGroup: muscle,
        currentXp: xp,
        currentRank: rank,
        frequency,
        avgWeeklyFrequency,
        priority,
        reason
      });
    }
  }

  return weakPoints.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.currentXp - b.currentXp;
  });
}

// --- Recovery Status ---

export function getRecoveryStatus(stats: FitnessStats, entryDate: string): RecoveryStatus[] {
  const now = new Date();
  return MUSCLE_GROUPS.filter(m => m !== 'cardio' && m !== 'full_body').map(muscle => {
    const entries = Object.values(stats.exerciseHistory)
      .flat()
      .filter(e => {
        const engagement = MUSCLE_ENGAGEMENT[Object.keys(MUSCLE_ENGAGEMENT).find(k =>
          ALL_EXERCISES.find(ex => ex.id === k && ex.muscleGroup === muscle)
        ) || ''];
        return engagement && muscle in engagement;
      });

    const lastEntry = entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const lastTrained = lastEntry?.date || null;
    const daysSinceLast = lastTrained
      ? Math.floor((now.getTime() - new Date(lastTrained).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    const daysNeeded = RECOVERY_DAYS[muscle];
    const recoveryPercent = Math.min(100, Math.round((daysSinceLast / daysNeeded) * 100));

    return {
      muscleGroup: muscle,
      lastTrained,
      daysSinceLast,
      recoveryPercent,
      isRecovered: daysSinceLast >= daysNeeded,
      daysNeeded
    };
  });
}

// --- Exercise Selection ---

function getExercisesForMuscle(muscle: MuscleGroup, goal: TrainingGoal, experience: string): Exercise[] {
  const exercises = ALL_EXERCISES.filter(ex => {
    const engagement = MUSCLE_ENGAGEMENT[ex.id];
    if (!engagement || !(muscle in engagement)) return false;
    if (experience === 'beginner' && ex.type === 'strength') {
      return !['deadlift', 'front_squat', 'pendlay_row', 'muscle_up'].includes(ex.id);
    }
    return true;
  });

  const scored = exercises.map(ex => {
    const engagement = MUSCLE_ENGAGEMENT[ex.id]?.[muscle] || 0;
    let goalBonus = 0;
    if (goal === 'hypertrophy' && ex.type === 'strength') goalBonus = 20;
    if (goal === 'strength' && ex.type === 'strength') goalBonus = 30;
    if (goal === 'endurance' && ex.type === 'bodyweight') goalBonus = 20;
    if (goal === 'fat_loss' && (ex.type === 'bodyweight' || ex.type === 'cardio')) goalBonus = 25;
    return { exercise: ex, score: engagement + goalBonus };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map(s => s.exercise);
}

// --- Plan Generation ---

function getSetsRepsForGoal(goal: TrainingGoal, experience: string): { sets: number; repsMin: number; repsMax: number; restSeconds: number } {
  const configs: Record<TrainingGoal, Record<string, { sets: number; repsMin: number; repsMax: number; restSeconds: number }>> = {
    strength: {
      beginner: { sets: 3, repsMin: 5, repsMax: 8, restSeconds: 180 },
      intermediate: { sets: 4, repsMin: 3, repsMax: 6, restSeconds: 240 },
      advanced: { sets: 5, repsMin: 1, repsMax: 5, restSeconds: 300 },
    },
    hypertrophy: {
      beginner: { sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
      intermediate: { sets: 4, repsMin: 8, repsMax: 12, restSeconds: 90 },
      advanced: { sets: 4, repsMin: 6, repsMax: 12, restSeconds: 75 },
    },
    endurance: {
      beginner: { sets: 2, repsMin: 15, repsMax: 20, restSeconds: 45 },
      intermediate: { sets: 3, repsMin: 15, repsMax: 25, restSeconds: 30 },
      advanced: { sets: 3, repsMin: 20, repsMax: 30, restSeconds: 30 },
    },
    fat_loss: {
      beginner: { sets: 3, repsMin: 10, repsMax: 15, restSeconds: 45 },
      intermediate: { sets: 3, repsMin: 12, repsMax: 15, restSeconds: 30 },
      advanced: { sets: 4, repsMin: 12, repsMax: 20, restSeconds: 30 },
    },
    general_fitness: {
      beginner: { sets: 3, repsMin: 8, repsMax: 12, restSeconds: 60 },
      intermediate: { sets: 3, repsMin: 8, repsMax: 12, restSeconds: 60 },
      advanced: { sets: 4, repsMin: 8, repsMax: 12, restSeconds: 60 },
    },
  };
  return configs[goal]?.[experience] || configs.general_fitness.beginner;
}

function generateSplit(type: SplitType, trainingDays: TrainingDays): { dayName: string; splitName: string; muscles: MuscleGroup[] }[] {
  if (type === 'full_body') {
    const days = [
      { dayName: 'Monday', splitName: 'Full Body A', muscles: ['chest', 'back', 'legs', 'shoulders', 'core'] as MuscleGroup[] },
      { dayName: 'Wednesday', splitName: 'Full Body B', muscles: ['back', 'legs', 'biceps', 'triceps', 'glutes'] as MuscleGroup[] },
      { dayName: 'Friday', splitName: 'Full Body C', muscles: ['chest', 'shoulders', 'legs', 'core', 'triceps'] as MuscleGroup[] },
    ];
    return days.slice(0, trainingDays);
  }

  if (type === 'upper_lower') {
    const days = [
      { dayName: 'Monday', splitName: 'Upper Body', muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] as MuscleGroup[] },
      { dayName: 'Tuesday', splitName: 'Lower Body', muscles: ['legs', 'glutes', 'core'] as MuscleGroup[] },
      { dayName: 'Thursday', splitName: 'Upper Body', muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] as MuscleGroup[] },
      { dayName: 'Friday', splitName: 'Lower Body', muscles: ['legs', 'glutes', 'core'] as MuscleGroup[] },
    ];
    return days.slice(0, trainingDays);
  }

  if (type === 'push_pull_legs') {
    const days = [
      { dayName: 'Monday', splitName: 'Push', muscles: ['chest', 'shoulders', 'triceps'] as MuscleGroup[] },
      { dayName: 'Tuesday', splitName: 'Pull', muscles: ['back', 'biceps'] as MuscleGroup[] },
      { dayName: 'Wednesday', splitName: 'Legs', muscles: ['legs', 'glutes', 'core'] as MuscleGroup[] },
      { dayName: 'Friday', splitName: 'Push', muscles: ['chest', 'shoulders', 'triceps'] as MuscleGroup[] },
      { dayName: 'Saturday', splitName: 'Pull', muscles: ['back', 'biceps'] as MuscleGroup[] },
    ];
    return days.slice(0, trainingDays);
  }

  // bro_split
  const days = [
    { dayName: 'Monday', splitName: 'Chest', muscles: ['chest', 'triceps'] as MuscleGroup[] },
    { dayName: 'Tuesday', splitName: 'Back', muscles: ['back', 'biceps'] as MuscleGroup[] },
    { dayName: 'Wednesday', splitName: 'Shoulders', muscles: ['shoulders', 'triceps'] as MuscleGroup[] },
    { dayName: 'Thursday', splitName: 'Legs', muscles: ['legs', 'glutes', 'core'] as MuscleGroup[] },
    { dayName: 'Friday', splitName: 'Arms', muscles: ['biceps', 'triceps'] as MuscleGroup[] },
  ];
  return days.slice(0, trainingDays);
}

export function generateWeeklyPlan(
  goal: TrainingGoal,
  splitType: SplitType,
  trainingDays: TrainingDays,
  experience: string,
  weakPoints: WeakPoint[],
  recovery: RecoveryStatus[],
  stats: FitnessStats
): WeeklyPlan {
  const split = generateSplit(splitType, trainingDays);
  const config = getSetsRepsForGoal(goal, experience);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());

  const weakMuscles = new Set(weakPoints.filter(w => w.priority === 'high').map(w => w.muscleGroup));

  const workouts: PlannedWorkout[] = split.map((day, index) => {
    const exercises: PlannedExercise[] = [];

    for (const muscle of day.muscles) {
      const muscleExercises = getExercisesForMuscle(muscle, goal, experience);
      const priorityBoost = weakMuscles.has(muscle) ? 1 : 0;

      for (let i = 0; i < Math.min(2 + priorityBoost, muscleExercises.length); i++) {
        const ex = muscleExercises[i];
        const engagement = MUSCLE_ENGAGEMENT[ex.id]?.[muscle] || 50;
        const sets = engagement > 60 ? config.sets : Math.max(2, config.sets - 1);

        exercises.push({
          exerciseId: ex.id,
          exerciseName: ex.name,
          muscleGroup: ex.muscleGroup,
          sets,
          repsMin: config.repsMin,
          repsMax: config.repsMax,
          restSeconds: config.restSeconds,
          notes: weakMuscles.has(muscle) ? 'Weak point - focus on form' : undefined,
        });
      }
    }

    const targetMuscles = [...new Set(exercises.map(e => e.muscleGroup))];
    const estimatedMinutes = exercises.reduce((sum, ex) => sum + (ex.sets * 1.5 + ex.restSeconds / 60 * (ex.sets - 1)), 0) + 10;

    return {
      id: `workout-${index}`,
      dayName: day.dayName,
      dayIndex: index,
      splitName: day.splitName,
      targetMuscles,
      exercises,
      estimatedMinutes: Math.round(estimatedMinutes),
      completed: false,
    };
  });

  return {
    id: `plan-${Date.now()}`,
    name: `${splitType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - ${goal.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
    goal,
    splitType,
    trainingDays,
    workouts,
    createdAt: now.toISOString(),
    weekStart: weekStart.toISOString().split('T')[0],
    isActive: true,
  };
}

// --- Suggestions ---

export function getTrainerSuggestions(
  stats: FitnessStats,
  weakPoints: WeakPoint[],
  recovery: RecoveryStatus[],
  plan: WeeklyPlan | null
): TrainerSuggestion[] {
  const suggestions: TrainerSuggestion[] = [];

  // Weak point suggestions
  const highPriority = weakPoints.filter(w => w.priority === 'high');
  if (highPriority.length > 0) {
    suggestions.push({
      type: 'weak_point',
      title: `${highPriority.length} weak point${highPriority.length > 1 ? 's' : ''} detected`,
      description: `Focus on: ${highPriority.map(w => w.muscleGroup).join(', ')}. These are behind your average level.`,
      priority: 'high',
      actionable: true,
    });
  }

  // Recovery suggestions
  const recoveredCount = recovery.filter(r => r.isRecovered).length;
  const overdueMuscles = recovery.filter(r => r.daysSinceLast > r.daysNeeded + 1 && r.lastTrained);
  if (overdueMuscles.length > 0) {
    suggestions.push({
      type: 'recovery',
      title: `${overdueMuscles.length} muscle group${overdueMuscles.length > 1 ? 's' : ''} overdue`,
      description: `These haven't been trained in a while: ${overdueMuscles.map(r => r.muscleGroup).join(', ')}. Consider including them.`,
      priority: 'medium',
      actionable: true,
    });
  }

  // Progressive overload
  const rankProgress = getProgressToNextRank(stats.xp);
  if (rankProgress.percent > 80 && rankProgress.nextRank) {
    suggestions.push({
      type: 'progressive_overload',
      title: `Almost at ${rankProgress.nextRank.label}!`,
      description: `You're ${100 - rankProgress.percent}% away. Keep pushing with progressive overload.`,
      priority: 'medium',
      actionable: true,
    });
  }

  // Deload suggestion
  if (stats.totalWorkouts > 10) {
    const recentWorkouts = stats.weeklyVolume.slice(-2);
    if (recentWorkouts.length === 2 && recentWorkouts[1].volume > recentWorkouts[0].volume * 1.3) {
      suggestions.push({
        type: 'deload',
        title: 'Consider a deload week',
        description: 'Volume spiked significantly. A lighter week can help recovery and prevent overtraining.',
        priority: 'medium',
        actionable: false,
      });
    }
  }

  // Milestones
  const rankInfo = getRankInfo(stats.rank);
  const rankIndex = RANKS.findIndex(r => r.rank === stats.rank);
  if (stats.totalWorkouts === 10 || stats.totalWorkouts === 25 || stats.totalWorkouts === 50 || stats.totalWorkouts === 100) {
    suggestions.push({
      type: 'milestone',
      title: `${stats.totalWorkouts} workouts milestone!`,
      description: `You've completed ${stats.totalWorkouts} workouts. Your dedication is building results.`,
      priority: 'low',
      actionable: false,
    });
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
