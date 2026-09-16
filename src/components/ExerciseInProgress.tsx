import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Check, Timer, Flame, Zap } from 'lucide-react';
import { haptic } from '../utils/haptics';

interface ExerciseInProgressProps {
  theme: 'dark' | 'light';
  exerciseName: string;
  exerciseNumber: number;
  totalExercises: number;
  onPrevious: () => void;
  onNext: () => void;
  onBack: () => void;
}

export const ExerciseInProgress: React.FC<ExerciseInProgressProps> = ({
  theme,
  exerciseName,
  exerciseNumber,
  totalExercises,
  onPrevious,
  onNext,
  onBack,
}) => {
  const isLight = theme === 'light';

  // Workout timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Set counter
  const [completedSets, setCompletedSets] = useState(0);
  const [totalSets] = useState(4);

  // Rest timer
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [restRemaining, setRestRemaining] = useState(0);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Motivational messages
  const [motivationIndex, setMotivationIndex] = useState(0);
  const motivations = [
    "Push through the burn!",
    "You're getting stronger!",
    "No pain, no gain!",
    "Focus on form!",
    "One more rep!",
    "You've got this!",
    "Stay consistent!",
    "Beast mode!",
  ];

  // Workout timer
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning]);

  // Rest timer
  useEffect(() => {
    if (restTimer !== null && restRemaining > 0) {
      restRef.current = setInterval(() => {
        setRestRemaining(prev => {
          if (prev <= 1) {
            if (restRef.current) clearInterval(restRef.current);
            setRestTimer(null);
            haptic.success();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (restRef.current) clearInterval(restRef.current); };
  }, [restTimer]);

  // Rotate motivation
  useEffect(() => {
    const interval = setInterval(() => {
      setMotivationIndex(prev => (prev + 1) % motivations.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRestTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleCompleteSet = useCallback(() => {
    haptic.success();
    setCompletedSets(prev => Math.min(prev + 1, totalSets));
    // Auto-start 60s rest timer
    setRestTimer(60);
    setRestRemaining(60);
  }, [totalSets]);

  const progress = (exerciseNumber / totalExercises) * 100;
  const setProgress = (completedSets / totalSets) * 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#c8ff00]/5 via-transparent to-[#c8ff00]/5" />

      {/* Header */}
      <div className="relative flex items-center justify-between p-4 pt-12">
        <button
          onClick={() => { haptic.lightTap(); onBack(); }}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            Exercise {exerciseNumber}/{totalExercises}
          </p>
        </div>
        <div className="w-10 h-10" />
      </div>

      {/* Exercise Progress Bar */}
      <div className="relative px-4">
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#c8ff00] to-[#b8f000]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6">
        {/* Workout Timer */}
        <motion.button
          onClick={() => { haptic.lightTap(); setIsRunning(!isRunning); }}
          className="mb-8"
          whileTap={{ scale: 0.95 }}
        >
          <div className={`text-6xl font-mono font-bold tracking-tighter ${
            isRunning ? 'text-[#c8ff00]' : 'text-white/30'
          }`}>
            {formatTime(elapsedSeconds)}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mt-1">
            {isRunning ? 'Tap to pause' : 'Tap to start timer'}
          </p>
        </motion.button>

        {/* Exercise Name */}
        <AnimatePresence mode="wait">
          <motion.h1
            key={exerciseName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-2xl sm:text-3xl font-bold text-white text-center mb-2"
          >
            {exerciseName}
          </motion.h1>
        </AnimatePresence>

        {/* Motivational message */}
        <AnimatePresence mode="wait">
          <motion.p
            key={motivationIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs text-[#c8ff00]/60 font-medium mb-8"
          >
            {motivations[motivationIndex]}
          </motion.p>
        </AnimatePresence>

        {/* Set Tracker */}
        <div className="w-full max-w-xs mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white/50">Sets</span>
            <span className="text-xs font-bold text-[#c8ff00]">{completedSets}/{totalSets}</span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: totalSets }).map((_, i) => (
              <motion.button
                key={i}
                onClick={() => {
                  haptic.lightTap();
                  if (i < completedSets) {
                    setCompletedSets(i);
                  } else if (i === completedSets) {
                    handleCompleteSet();
                  }
                }}
                className={`flex-1 h-10 rounded-xl font-bold text-sm transition-all ${
                  i < completedSets
                    ? 'bg-[#c8ff00] text-[#0a0a0a]'
                    : i === completedSets
                      ? 'bg-[#c8ff00]/20 text-[#c8ff00] border border-[#c8ff00]/30'
                      : 'bg-white/5 text-white/20'
                }`}
                whileTap={{ scale: 0.9 }}
              >
                {i < completedSets ? '✓' : i + 1}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Rest Timer Overlay */}
        <AnimatePresence>
          {restTimer !== null && restRemaining > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-xs p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-blue-400">Rest Timer</span>
                </div>
                <button
                  onClick={() => { if (restRef.current) clearInterval(restRef.current); setRestTimer(null); setRestRemaining(0); }}
                  className="text-[10px] text-blue-400/60"
                >
                  Skip
                </button>
              </div>
              <div className="text-center">
                <span className="text-4xl font-mono font-bold text-blue-400">
                  {formatRestTime(restRemaining)}
                </span>
              </div>
              <div className="h-1 rounded-full bg-blue-500/20 mt-3 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-blue-400"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: restTimer, ease: 'linear' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Rest Buttons (when no rest timer active) */}
        {restTimer === null && (
          <div className="flex gap-2 w-full max-w-xs mb-6">
            {[60, 90, 120].map(secs => (
              <button
                key={secs}
                onClick={() => { haptic.lightTap(); setRestTimer(secs); setRestRemaining(secs); }}
                className="flex-1 py-2 rounded-xl bg-white/5 text-white/40 text-[10px] font-bold hover:bg-white/10 transition-all"
              >
                {Math.floor(secs / 60)}:{(secs % 60).toString().padStart(2, '0')} rest
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="relative p-6 pb-12">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => { haptic.lightTap(); onPrevious(); }}
            disabled={exerciseNumber <= 1}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              exerciseNumber <= 1
                ? 'bg-white/5 text-white/15'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={() => { haptic.mediumClick(); onNext(); }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-[#c8ff00] to-[#b8f000] flex items-center justify-center text-[#0a0a0a] shadow-[0_0_30px_rgba(200,255,0,0.3)] active:scale-95 transition-all"
          >
            {exerciseNumber === totalExercises ? (
              <Check className="w-8 h-8" strokeWidth={3} />
            ) : (
              <ChevronRight className="w-8 h-8" />
            )}
          </button>

          <button
            onClick={() => { haptic.lightTap(); onPrevious(); }}
            disabled={exerciseNumber <= 1}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              exerciseNumber <= 1
                ? 'bg-white/5 text-white/15'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Exercise Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-6">
          {Array.from({ length: totalExercises }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i + 1 === exerciseNumber
                  ? 'w-6 bg-[#c8ff00]'
                  : i + 1 < exerciseNumber
                    ? 'w-1.5 bg-[#c8ff00]/50'
                    : 'w-1.5 bg-white/15'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
