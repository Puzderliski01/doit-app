import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import {
  ChevronLeft, ChevronRight, Play, Pause, Check, Timer, Flame, Zap,
  Dumbbell, X, Plus, Trash2, RotateCcw, SkipForward, Volume2,
  Target, Star, Trophy, Heart, Sparkles, ArrowRight, Weight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { haptic } from '../utils/haptics';
import {
  Exercise, ExerciseSet, FitnessEntry, MuscleGroup, WorkoutMood
} from '../types';
import {
  ALL_EXERCISES, MUSCLE_GROUP_LABELS, MUSCLE_GROUP_ICONS, MUSCLE_GROUP_COLORS,
  getDefaultSets, calculateTotalVolume, calculateOneRepMax, calculateXPForWorkout,
  isBodyweightExercise, getMuscleEngagement, searchExercises
} from '../utils/fitness';

interface WorkoutModeProps {
  theme: 'dark' | 'light';
  defaultWeightUnit: 'kg' | 'lbs';
  onSaveEntry: (entry: FitnessEntry) => void;
  onClose: () => void;
}

type WorkoutPhase = 'select' | 'ready' | 'active' | 'rest' | 'summary';

interface WorkoutExercise {
  exercise: Exercise;
  sets: ExerciseSet[];
  notes: string;
  completedSets: number;
}

const MOTIVATIONAL_QUOTES = [
  "The only bad workout is the one that didn't happen.",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "Don't count the days. Make the days count.",
  "Strength doesn't come from what you can do. It comes from overcoming the things you once thought you couldn't.",
  "The harder you work, the luckier you get.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "The pain you feel today will be the strength you feel tomorrow.",
  "Your only limit is you.",
];

export const WorkoutMode: React.FC<WorkoutModeProps> = ({
  theme,
  defaultWeightUnit,
  onSaveEntry,
  onClose,
}) => {
  const isLight = theme === 'light';
  const [phase, setPhase] = useState<WorkoutPhase>('select');

  // Selection state
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | 'all'>('all');

  // Active workout state
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [restRemaining, setRestRemaining] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [totalXP, setTotalXP] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [completedExerciseCount, setCompletedExerciseCount] = useState(0);

  // Summary state
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [workoutMood, setWorkoutMood] = useState<WorkoutMood | undefined>(undefined);

  // Refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentExercise = selectedExercises[currentExerciseIndex];
  const currentSet = currentExercise?.sets[currentSetIndex];

  // Timer
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => setElapsedSeconds(p => p + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerRunning]);

  // Rest timer
  useEffect(() => {
    if (isResting && restRemaining > 0) {
      restRef.current = setInterval(() => {
        setRestRemaining(prev => {
          if (prev <= 1) {
            if (restRef.current) clearInterval(restRef.current);
            setIsResting(false);
            haptic.success();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (restRef.current) clearInterval(restRef.current); }
  }, [isResting]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const formatRestTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // Exercise selection
  const filteredExercises = useMemo(() => {
    let results = searchQuery ? searchExercises(searchQuery) : ALL_EXERCISES;
    if (muscleFilter !== 'all') {
      results = results.filter(e => e.muscleGroup === muscleFilter);
    }
    return results;
  }, [searchQuery, muscleFilter]);

  const addExercise = useCallback((exercise: Exercise) => {
    if (selectedExercises.find(e => e.exercise.id === exercise.id)) return;
    haptic.lightTap();
    setSelectedExercises(prev => [...prev, {
      exercise,
      sets: getDefaultSets(defaultWeightUnit),
      notes: '',
      completedSets: 0,
    }]);
  }, [selectedExercises, defaultWeightUnit]);

  const removeExercise = useCallback((index: number) => {
    haptic.lightTap();
    setSelectedExercises(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateSet = useCallback((exIndex: number, setIndex: number, field: keyof ExerciseSet, value: string | boolean) => {
    setSelectedExercises(prev => {
      const next = [...prev];
      const sets = [...next[exIndex].sets];
      if (field === 'reps' || field === 'weight') {
        sets[setIndex] = { ...sets[setIndex], [field]: Math.max(0, parseInt(value as string) || 0) };
      } else {
        sets[setIndex] = { ...sets[setIndex], [field]: value };
      }
      next[exIndex] = { ...next[exIndex], sets };
      return next;
    });
  }, []);

  const addSet = useCallback((exIndex: number) => {
    haptic.lightTap();
    setSelectedExercises(prev => {
      const next = [...prev];
      const lastSet = next[exIndex].sets[next[exIndex].sets.length - 1];
      next[exIndex] = {
        ...next[exIndex],
        sets: [...next[exIndex].sets, { reps: lastSet?.reps || 0, weight: lastSet?.weight || 0, weightUnit: defaultWeightUnit, completed: false }]
      };
      return next;
    });
  }, [defaultWeightUnit]);

  const removeSet = useCallback((exIndex: number, setIndex: number) => {
    haptic.lightTap();
    setSelectedExercises(prev => {
      const next = [...prev];
      next[exIndex] = {
        ...next[exIndex],
        sets: next[exIndex].sets.filter((_, i) => i !== setIndex)
      };
      return next;
    });
  }, []);

  // Start workout
  const startWorkout = useCallback(() => {
    if (selectedExercises.length === 0) return;
    haptic.mediumClick();
    setPhase('ready');
    setIsTimerRunning(true);
    setTimeout(() => {
      haptic.success();
      setPhase('active');
    }, 3000);
  }, [selectedExercises]);

  // Complete a set
  const completeSet = useCallback(() => {
    if (!currentExercise) return;
    haptic.success();

    // Mark set as completed
    setSelectedExercises(prev => {
      const next = [...prev];
      const ex = { ...next[currentExerciseIndex] };
      const sets = [...ex.sets];
      sets[currentSetIndex] = { ...sets[currentSetIndex], completed: true };
      ex.sets = sets;
      ex.completedSets = sets.filter(s => s.completed).length;
      next[currentExerciseIndex] = ex;
      return next;
    });

    // Update stats
    const set = currentExercise.sets[currentSetIndex];
    const setVol = set.weight * set.reps;
    setTotalVolume(prev => prev + setVol);
    setTotalXP(prev => prev + Math.round(setVol * 0.1 + set.reps * 2));

    // Start rest timer (auto 60s)
    setIsResting(true);
    setRestRemaining(60);

    // Check if all sets done for this exercise
    if (currentSetIndex >= currentExercise.sets.length - 1) {
      // Move to next exercise after short delay
      setTimeout(() => {
        if (currentExerciseIndex < selectedExercises.length - 1) {
          setCurrentExerciseIndex(prev => prev + 1);
          setCurrentSetIndex(0);
          setCompletedExerciseCount(prev => prev + 1);
        } else {
          // Workout complete!
          setWorkoutDuration(elapsedSeconds);
          setIsTimerRunning(false);
          setCompletedExerciseCount(selectedExercises.length);
          try {
            confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#c8ff00', '#f59e0b', '#10b981', '#6366f1'] });
          } catch {}
          setTimeout(() => setPhase('summary'), 500);
        }
      }, 700);
    }
  }, [currentExercise, currentExerciseIndex, currentSetIndex, selectedExercises, elapsedSeconds]);

  // Skip rest
  const skipRest = useCallback(() => {
    if (restRef.current) clearInterval(restRef.current);
    setIsResting(false);
    setRestRemaining(0);
    haptic.lightTap();
  }, []);

  // Next set (when rest is done)
  const nextSet = useCallback(() => {
    if (!currentExercise) return;
    haptic.lightTap();
    if (currentSetIndex < currentExercise.sets.length - 1) {
      setCurrentSetIndex(prev => prev + 1);
    }
  }, [currentExercise, currentSetIndex]);

  // Save workout
  const saveWorkout = useCallback(() => {
    selectedExercises.forEach(ex => {
      if (ex.sets.some(s => s.completed)) {
        const entry: FitnessEntry = {
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          exerciseId: ex.exercise.id,
          exerciseName: ex.exercise.name,
          muscleGroup: ex.exercise.muscleGroup,
          date: new Date().toISOString().slice(0, 10),
          sets: ex.sets.map(s => ({ ...s, weightUnit: defaultWeightUnit })),
          totalVolume: calculateTotalVolume(ex.sets),
          estimatedOneRepMax: calculateOneRepMax(
            Math.max(...ex.sets.filter(s => s.completed).map(s => s.weight), 0),
            Math.max(...ex.sets.filter(s => s.completed).map(s => s.reps), 0)
          ),
          weightUnit: defaultWeightUnit,
          notes: ex.notes || undefined,
          mood: workoutMood,
          durationMinutes: Math.round(workoutDuration / 60) || undefined,
          createdAt: new Date().toISOString(),
        };
        onSaveEntry(entry);
      }
    });
    haptic.success();
    onClose();
  }, [selectedExercises, defaultWeightUnit, workoutMood, workoutDuration, onSaveEntry, onClose]);

  // Muscle activation data
  const muscleActivation = useMemo(() => {
    const activation: Record<string, number> = {};
    selectedExercises.forEach(ex => {
      const engagement = getMuscleEngagement(ex.exercise.id);
      Object.entries(engagement).forEach(([muscle, pct]) => {
        activation[muscle] = (activation[muscle] || 0) + (pct || 0);
      });
    });
    const max = Math.max(...Object.values(activation), 1);
    return Object.entries(activation).map(([muscle, value]) => ({
      muscle: muscle as MuscleGroup,
      value: Math.round((value / max) * 100),
    })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [selectedExercises]);

  // XP for current exercise
  const currentExerciseXP = useMemo(() => {
    if (!currentExercise) return 0;
    return currentExercise.sets.filter(s => s.completed).reduce((sum, s) => sum + Math.round(s.weight * s.reps * 0.1 + s.reps * 2), 0);
  }, [currentExercise]);

  // ==================== SELECT PHASE ====================
  if (phase === 'select') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pt-12 border-b border-white/10">
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-white/60">
            <X className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-white">Workout Mode</h1>
            <p className="text-[10px] text-white/40">{selectedExercises.length} exercises selected</p>
          </div>
          <button
            onClick={startWorkout}
            disabled={selectedExercises.length === 0}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#c8ff00] to-[#b8f000] text-[#0a0a0a] font-bold text-xs disabled:opacity-30"
          >
            Start
          </button>
        </div>

        {/* Selected exercises */}
        {selectedExercises.length > 0 && (
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {selectedExercises.map((ex, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 shrink-0">
                  <span className="text-sm">{MUSCLE_GROUP_ICONS[ex.exercise.muscleGroup]}</span>
                  <span className="text-xs font-semibold text-white/70 whitespace-nowrap">{ex.exercise.name}</span>
                  <button onClick={() => removeExercise(i)} className="text-white/30 hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Muscle activation preview */}
        {selectedExercises.length > 0 && (
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">Muscle Activation</p>
            <div className="flex gap-1.5">
              {muscleActivation.map(m => (
                <div key={m.muscle} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full h-8 rounded-lg bg-white/5 overflow-hidden relative">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${m.value}%` }}
                      className="absolute bottom-0 w-full rounded-lg"
                      style={{ backgroundColor: MUSCLE_GROUP_COLORS[m.muscle] || '#c8ff00' }}
                    />
                  </div>
                  <span className="text-[8px] text-white/30">{MUSCLE_GROUP_ICONS[m.muscle]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exercise picker */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="relative mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercises..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#c8ff00]/50"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
            {(['all', 'chest', 'back', 'shoulders', 'legs', 'biceps', 'triceps', 'core'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMuscleFilter(m)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
                  muscleFilter === m
                    ? 'bg-[#c8ff00] text-[#0a0a0a]'
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                {m === 'all' ? 'All' : `${MUSCLE_GROUP_ICONS[m]} ${MUSCLE_GROUP_LABELS[m]}`}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            {filteredExercises.map(exercise => {
              const isSelected = selectedExercises.some(e => e.exercise.id === exercise.id);
              const engagement = getMuscleEngagement(exercise.id);
              const primaryMuscle = Object.entries(engagement).sort((a, b) => (b[1] || 0) - (a[1] || 0))[0];
              return (
                <button
                  key={exercise.id}
                  onClick={() => isSelected ? removeExercise(selectedExercises.findIndex(e => e.exercise.id === exercise.id)) : addExercise(exercise)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-[#c8ff00]/10 border border-[#c8ff00]/30'
                      : 'bg-white/[0.03] border border-transparent hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="text-lg">{MUSCLE_GROUP_ICONS[exercise.muscleGroup]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white/80">{exercise.name}</p>
                    <p className="text-[10px] text-white/30">
                      {MUSCLE_GROUP_LABELS[exercise.muscleGroup]} · {exercise.type}
                      {primaryMuscle && ` · ${primaryMuscle[1]}% primary`}
                    </p>
                  </div>
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-[#c8ff00] flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-[#0a0a0a]" />
                    </div>
                  ) : (
                    <Plus className="w-4 h-4 text-white/20" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==================== READY PHASE ====================
  if (phase === 'ready') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#c8ff00]/5 via-transparent to-[#c8ff00]/5" />

        {/* Pulse rings */}
        {[1, 2, 3].map(i => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-[#c8ff00]/10"
            initial={{ width: 100, height: 100, opacity: 0.5 }}
            animate={{ width: [100, 500], height: [100, 500], opacity: [0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
          />
        ))}

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="relative z-10 text-center"
        >
          <Dumbbell className="w-16 h-16 text-[#c8ff00] mx-auto mb-6" />
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-black text-white mb-2"
          >
            Get Ready
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-white/40"
          >
            {selectedExercises.length} exercises · {selectedExercises.reduce((sum, e) => sum + e.sets.length, 0)} sets
          </motion.p>

          {/* Exercise preview */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 px-6 py-4 rounded-2xl bg-white/5 border border-white/10"
          >
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1">First Exercise</p>
            <p className="text-lg font-bold text-white">{selectedExercises[0]?.exercise.name}</p>
            <p className="text-xs text-white/40">{selectedExercises[0]?.sets.length} sets</p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ==================== ACTIVE PHASE ====================
  if (phase === 'active' && currentExercise) {
    const exercise = currentExercise;
    const sets = exercise.sets;
    const completedSets = sets.filter(s => s.completed).length;
    const setProgress = (completedSets / sets.length) * 100;
    const exerciseProgress = ((currentExerciseIndex + (completedSets / sets.length)) / selectedExercises.length) * 100;
    const isBW = isBodyweightExercise(exercise.exercise.id);

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]">
        {/* Background gradient */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#c8ff00]/3 via-transparent to-[#c8ff00]/3" />
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#c8ff00]/5 to-transparent" />
        </div>

        {/* Top Bar */}
        <div className="relative flex items-center justify-between p-4 pt-10">
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-white/60">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[10px] font-bold text-orange-400">{totalXP} XP</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5">
              <Timer className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] font-bold text-blue-400 font-mono">{formatTime(elapsedSeconds)}</span>
            </div>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="relative px-4 mb-2">
          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#c8ff00] to-[#b8f000]"
              animate={{ width: `${exerciseProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-white/20">{currentExerciseIndex + 1}/{selectedExercises.length} exercises</span>
            <span className="text-[9px] text-white/20">{completedSets}/{sets.length} sets done</span>
          </div>
        </div>

        {/* Main Exercise Card */}
        <div className="relative flex-1 flex flex-col px-4 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={exercise.exercise.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 flex flex-col"
            >
              {/* Exercise Header */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 mb-3">
                  <span className="text-lg">{MUSCLE_GROUP_ICONS[exercise.exercise.muscleGroup]}</span>
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                    {MUSCLE_GROUP_LABELS[exercise.exercise.muscleGroup]}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {exercise.exercise.name}
                </h2>
                {isBW && (
                  <p className="text-[10px] text-[#c8ff00]/60 mt-1">Bodyweight Exercise</p>
                )}
              </div>

              {/* Current Set Indicator */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {sets.map((set, i) => (
                  <motion.div
                    key={i}
                    className={`h-2 rounded-full transition-all ${
                      set.completed
                        ? 'w-8 bg-[#c8ff00]'
                        : i === currentSetIndex
                          ? 'w-8 bg-[#c8ff00]/40'
                          : 'w-2 bg-white/10'
                    }`}
                    animate={i === currentSetIndex ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                ))}
              </div>

              {/* Set Editor */}
              <div className="flex-1 flex flex-col justify-center">
                {/* Big set number */}
                <div className="text-center mb-4">
                  <motion.span
                    key={currentSetIndex}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-6xl font-black text-white/10"
                  >
                    SET {currentSetIndex + 1}
                  </motion.span>
                </div>

                {/* Weight & Reps Inputs */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="text-center">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block mb-1">Weight</label>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          if (currentSet) {
                            const newWeight = Math.max(0, currentSet.weight - (isBW ? 0 : 2.5));
                            updateSet(currentExerciseIndex, currentSetIndex, 'weight', String(newWeight));
                          }
                        }}
                        className="w-10 h-10 rounded-xl bg-white/5 text-white/40 flex items-center justify-center text-lg font-bold active:scale-95"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={currentSet?.weight || ''}
                        onChange={(e) => updateSet(currentExerciseIndex, currentSetIndex, 'weight', e.target.value)}
                        className="w-20 h-12 rounded-xl bg-white/5 border border-white/10 text-white text-xl font-bold text-center focus:outline-none focus:border-[#c8ff00]/50"
                      />
                      <button
                        onClick={() => {
                          if (currentSet) {
                            const newWeight = currentSet.weight + (isBW ? 0 : 2.5);
                            updateSet(currentExerciseIndex, currentSetIndex, 'weight', String(newWeight));
                          }
                        }}
                        className="w-10 h-10 rounded-xl bg-white/5 text-white/40 flex items-center justify-center text-lg font-bold active:scale-95"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-[10px] text-white/20 mt-1 block">{defaultWeightUnit}</span>
                  </div>

                  <div className="text-2xl text-white/10 font-light">×</div>

                  <div className="text-center">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block mb-1">Reps</label>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          if (currentSet) {
                            updateSet(currentExerciseIndex, currentSetIndex, 'reps', String(Math.max(0, currentSet.reps - 1)));
                          }
                        }}
                        className="w-10 h-10 rounded-xl bg-white/5 text-white/40 flex items-center justify-center text-lg font-bold active:scale-95"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={currentSet?.reps || ''}
                        onChange={(e) => updateSet(currentExerciseIndex, currentSetIndex, 'reps', e.target.value)}
                        className="w-20 h-12 rounded-xl bg-white/5 border border-white/10 text-white text-xl font-bold text-center focus:outline-none focus:border-[#c8ff00]/50"
                      />
                      <button
                        onClick={() => {
                          if (currentSet) {
                            updateSet(currentExerciseIndex, currentSetIndex, 'reps', String(currentSet.reps + 1));
                          }
                        }}
                        className="w-10 h-10 rounded-xl bg-white/5 text-white/40 flex items-center justify-center text-lg font-bold active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick rep buttons */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  {[8, 10, 12, 15].map(reps => (
                    <button
                      key={reps}
                      onClick={() => updateSet(currentExerciseIndex, currentSetIndex, 'reps', String(reps))}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        currentSet?.reps === reps
                          ? 'bg-[#c8ff00] text-[#0a0a0a]'
                          : 'bg-white/5 text-white/30 hover:bg-white/10'
                      }`}
                    >
                      {reps}
                    </button>
                  ))}
                </div>
              </div>

              {/* Set Progress Bar */}
              <div className="mb-3">
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#c8ff00] to-[#b8f000]"
                    animate={{ width: `${setProgress}%` }}
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Rest Timer Overlay */}
          <AnimatePresence>
            {isResting && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute inset-x-4 bottom-20 p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Timer className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-bold text-blue-400">Rest Time</span>
                  </div>
                  <button onClick={skipRest} className="text-xs font-bold text-blue-400/60 hover:text-blue-400">
                    Skip →
                  </button>
                </div>
                <div className="text-center">
                  <span className="text-5xl font-mono font-black text-blue-400">
                    {formatRestTime(restRemaining)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-blue-500/20 mt-3 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-blue-400"
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: restRemaining, ease: 'linear' }}
                  />
                </div>
                {/* Next set preview */}
                {currentSetIndex < sets.length - 1 && (
                  <p className="text-center text-[10px] text-blue-300/50 mt-2">
                    Next: Set {currentSetIndex + 2} · {currentSet?.weight || 0}{defaultWeightUnit} × {currentSet?.reps || 0}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Controls */}
        <div className="relative p-4 pb-8">
          <div className="flex items-center gap-3">
            {/* Add set */}
            <button
              onClick={() => addSet(currentExerciseIndex)}
              className="w-12 h-12 rounded-xl bg-white/5 text-white/40 flex items-center justify-center"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Complete Set (main CTA) */}
            <motion.button
              onClick={completeSet}
              disabled={isResting}
              className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-[#c8ff00] to-[#b8f000] text-[#0a0a0a] font-black text-sm flex items-center justify-center gap-2 disabled:opacity-30 active:scale-[0.98]"
              whileTap={{ scale: 0.95 }}
            >
              <Check className="w-5 h-5" strokeWidth={3} />
              Complete Set {currentSetIndex + 1}/{sets.length}
            </motion.button>

            {/* Skip exercise */}
            <button
              onClick={() => {
                haptic.lightTap();
                if (currentExerciseIndex < selectedExercises.length - 1) {
                  setCurrentExerciseIndex(prev => prev + 1);
                  setCurrentSetIndex(0);
                } else {
                  setWorkoutDuration(elapsedSeconds);
                  setIsTimerRunning(false);
                  setPhase('summary');
                }
              }}
              className="w-12 h-12 rounded-xl bg-white/5 text-white/40 flex items-center justify-center"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Exercise dots */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {selectedExercises.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === currentExerciseIndex
                    ? 'w-6 bg-[#c8ff00]'
                    : i < currentExerciseIndex
                      ? 'w-1.5 bg-[#c8ff00]/50'
                      : 'w-1.5 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==================== SUMMARY PHASE ====================
  if (phase === 'summary') {
    const totalSetsDone = selectedExercises.reduce((sum, e) => sum + e.sets.filter(s => s.completed).length, 0);
    const totalSetsPlanned = selectedExercises.reduce((sum, e) => sum + e.sets.length, 0);
    const avgWeight = totalSetsDone > 0 ? Math.round(totalVolume / totalSetsDone) : 0;

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#c8ff00]/5 via-transparent to-transparent" />

        {/* Header */}
        <div className="relative flex items-center justify-between p-4 pt-12">
          <div className="w-10" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-center"
          >
            <Trophy className="w-12 h-12 text-[#c8ff00] mx-auto mb-2" />
            <h1 className="text-2xl font-black text-white">Workout Complete!</h1>
          </motion.div>
          <div className="w-10" />
        </div>

        {/* Stats */}
        <div className="relative flex-1 px-4 py-6 overflow-y-auto">
          {/* Duration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-6"
          >
            <span className="text-5xl font-black text-white font-mono">{formatTime(workoutDuration)}</span>
            <p className="text-xs text-white/30 mt-1">Total Duration</p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-3 mb-6"
          >
            <div className="text-center p-3 rounded-2xl bg-white/5">
              <Zap className="w-5 h-5 text-[#c8ff00] mx-auto mb-1" />
              <p className="text-xl font-black text-white">{totalXP}</p>
              <p className="text-[9px] text-white/30">XP Earned</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-white/5">
              <Dumbbell className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <p className="text-xl font-black text-white">{totalSetsDone}</p>
              <p className="text-[9px] text-white/30">Sets Done</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-white/5">
              <Target className="w-5 h-5 text-orange-400 mx-auto mb-1" />
              <p className="text-xl font-black text-white">{totalVolume.toLocaleString()}</p>
              <p className="text-[9px] text-white/30">Total Volume</p>
            </div>
          </motion.div>

          {/* Exercise Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2 mb-6"
          >
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Exercises</p>
            {selectedExercises.map((ex, i) => {
              const done = ex.sets.filter(s => s.completed).length;
              const vol = calculateTotalVolume(ex.sets);
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03]">
                  <span className="text-lg">{MUSCLE_GROUP_ICONS[ex.exercise.muscleGroup]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white/70 truncate">{ex.exercise.name}</p>
                    <p className="text-[10px] text-white/30">{done}/{ex.sets.length} sets · {vol.toLocaleString()} vol</p>
                  </div>
                  {done === ex.sets.length && <Check className="w-4 h-4 text-[#c8ff00]" />}
                </div>
              );
            })}
          </motion.div>

          {/* Mood Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-6"
          >
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">How did you feel?</p>
            <div className="flex gap-2">
              {([
                { value: 'energized' as WorkoutMood, emoji: '⚡', label: 'Energized' },
                { value: 'great' as WorkoutMood, emoji: '🔥', label: 'Great' },
                { value: 'good' as WorkoutMood, emoji: '👍', label: 'Good' },
                { value: 'tired' as WorkoutMood, emoji: '😅', label: 'Tired' },
                { value: 'exhausted' as WorkoutMood, emoji: '💀', label: 'Exhausted' },
              ]).map(m => (
                <button
                  key={m.value}
                  onClick={() => setWorkoutMood(workoutMood === m.value ? undefined : m.value)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${
                    workoutMood === m.value
                      ? 'bg-[#c8ff00]/15 border border-[#c8ff00]/30'
                      : 'bg-white/5 border border-transparent'
                  }`}
                >
                  <span className="text-xl">{m.emoji}</span>
                  <span className="text-[9px] text-white/30">{m.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Save Button */}
        <div className="relative p-4 pb-8">
          <button
            onClick={saveWorkout}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#c8ff00] to-[#b8f000] text-[#0a0a0a] font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Sparkles className="w-5 h-5" />
            Save Workout · +{totalXP} XP
          </button>
        </div>
      </div>
    );
  }

  return null;
};
