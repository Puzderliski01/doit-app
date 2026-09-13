import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
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
  const [count, setCount] = useState(10);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning && count > 0) {
      interval = setInterval(() => {
        setCount((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, count]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=1200&fit=crop"
          alt="Exercise"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>

      {/* Back button */}
      <button
        onClick={() => { haptic.lightTap(); onBack(); }}
        className="absolute top-12 left-4 z-10 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>

      {/* Large number overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <motion.div
          key={count}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <span className="text-[180px] font-bold text-neon-400 leading-none drop-shadow-2xl neon-text">
            {count}
          </span>
        </motion.div>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 pb-12">
        {/* Exercise name */}
        <div className="text-center mb-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-white"
          >
            {exerciseName}
          </motion.h2>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => { haptic.lightTap(); onPrevious(); }}
            disabled={exerciseNumber <= 1}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-semibold disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            onClick={() => { haptic.mediumClick(); setIsRunning(!isRunning); }}
            className="w-16 h-16 rounded-full bg-neon-400 flex items-center justify-center cursor-pointer"
          >
            {isRunning ? (
              <Pause className="w-8 h-8 text-[#0a0a0a]" fill="currentColor" />
            ) : (
              <Play className="w-8 h-8 text-[#0a0a0a] ml-1" fill="currentColor" />
            )}
          </button>

          <button
            onClick={() => { haptic.lightTap(); onNext(); }}
            disabled={exerciseNumber >= totalExercises}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-neon-400 text-[#0a0a0a] text-sm font-semibold disabled:opacity-30 cursor-pointer"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* See all link */}
        <div className="text-center">
          <button className={`text-xs font-semibold ${isLight ? 'text-white/70' : 'text-white/70'}`}>
            See all
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {Array.from({ length: totalExercises }, (_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i + 1 === exerciseNumber
                  ? 'w-6 bg-neon-400'
                  : i + 1 < exerciseNumber
                  ? 'w-1 bg-neon-400/50'
                  : 'w-1 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
