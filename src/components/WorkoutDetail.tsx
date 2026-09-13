import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play,
  Clock,
  Flame,
  Star,
  MessageSquare,
  Dumbbell,
} from 'lucide-react';
import { haptic } from '../utils/haptics';

interface WorkoutDetailProps {
  theme: 'dark' | 'light';
  workoutId: string;
  onBack: () => void;
  onStartWorkout: () => void;
  onSelectTrainer: (trainerId: string) => void;
}

const WORKOUT_DATA: Record<string, any> = {
  w1: {
    title: 'Home Chest Workout\n(No Equipment)',
    duration: '45 min',
    calories: 381,
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=500&fit=crop',
    about: 'Building chest muscles doesn\'t have to be complicated, these 8 bodyweight exercises that will give you excellent results at home. No equipment',
    level: 'AAA Hard',
    progress: '0%',
    focusArea: 'Chest',
    trainer: {
      id: 't3',
      name: 'Chris Heria',
      title: 'High Intensity Fitness Trainer',
      experience: '7 years experience',
      rating: 4.6,
      avatar: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=100&h=100&fit=crop',
    },
    review: {
      name: 'David Lewis',
      time: '3d ago',
      rating: 4.8,
      text: 'I had such an amazing session with Chris, he instantly picked up on the level of my fitness and adjusted the workout to suit me whilst also pushing me to my limits.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    },
    exercises: [
      { name: 'Push Ups', reps: '20 reps', icon: '💪' },
      { name: "90'' Hold", reps: "20 sec", icon: '⏱️' },
      { name: 'Push Ups in a Circle', reps: '8 reps both directions', icon: '🔄' },
    ],
  },
  default: {
    title: 'Workout',
    duration: '30 min',
    calories: 250,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=500&fit=crop',
    about: 'A great workout to improve your fitness.',
    level: 'Medium',
    progress: '0%',
    focusArea: 'Full Body',
    trainer: {
      id: 't3',
      name: 'Chris Heria',
      title: 'High Intensity Fitness Trainer',
      experience: '7 years experience',
      rating: 4.6,
      avatar: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=100&h=100&fit=crop',
    },
    review: null,
    exercises: [
      { name: 'Push Ups', reps: '15 reps', icon: '💪' },
      { name: 'Squats', reps: '20 reps', icon: '🦵' },
    ],
  },
};

export const WorkoutDetail: React.FC<WorkoutDetailProps> = ({
  theme,
  workoutId,
  onBack,
  onStartWorkout,
  onSelectTrainer,
}) => {
  const isLight = theme === 'light';
  const workout = WORKOUT_DATA[workoutId] || WORKOUT_DATA.default;

  return (
    <div className="space-y-0">
      {/* Hero Image */}
      <div className="relative h-64 -mx-4 -mt-4 overflow-hidden">
        <img 
          src={workout.image}
          alt={workout.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Back button */}
        <button
          onClick={() => { haptic.lightTap(); onBack(); }}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        {/* Title on image */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-xl font-bold text-white whitespace-pre-line leading-tight">
            {workout.title}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-white/80">
              <Play className="w-3.5 h-3.5" fill="currentColor" />
              {workout.duration}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-white/80">
              <Flame className="w-3.5 h-3.5" />
              {workout.calories} Cal
            </span>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="py-5">
        <h2 className={`text-sm font-bold mb-2 ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>About</h2>
        <p className={`text-sm leading-relaxed ${isLight ? 'text-[#666]' : 'text-white/50'}`}>
          {workout.about}
        </p>
      </div>

      {/* Stats Row */}
      <div className={`flex items-center gap-4 py-4 border-t ${
        isLight ? 'border-[#f0f0f0]' : 'border-white/[0.06]'
      }`}>
        <div className="flex-1">
          <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${isLight ? 'text-[#aaa]' : 'text-white/40'}`}>
            Level
          </p>
          <p className={`text-xs font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
            {workout.level}
          </p>
        </div>
        <div className="flex-1">
          <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${isLight ? 'text-[#aaa]' : 'text-white/40'}`}>
            Progress
          </p>
          <p className={`text-xs font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
            {workout.progress}
          </p>
        </div>
        <div className="flex-1">
          <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${isLight ? 'text-[#aaa]' : 'text-white/40'}`}>
            Focus Area
          </p>
          <p className={`text-xs font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
            {workout.focusArea}
          </p>
        </div>
      </div>

      {/* Sound & Music */}
      <button className={`w-full flex items-center justify-between py-4 border-t cursor-pointer ${
        isLight ? 'border-[#f0f0f0]' : 'border-white/[0.06]'
      }`}>
        <span className={`text-sm font-semibold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
          Sound & Music
        </span>
        <ChevronRight className={`w-4 h-4 ${isLight ? 'text-[#ccc]' : 'text-white/30'}`} />
      </button>

      {/* Guide */}
      <button className={`w-full flex items-center justify-between py-4 border-t cursor-pointer ${
        isLight ? 'border-[#f0f0f0]' : 'border-white/[0.06]'
      }`}>
        <span className={`text-sm font-semibold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
          Guide
        </span>
        <ChevronRight className={`w-4 h-4 ${isLight ? 'text-[#ccc]' : 'text-white/30'}`} />
      </button>

      {/* Trainer Section */}
      <div className="py-5 border-t ${isLight ? 'border-[#f0f0f0]' : 'border-white/[0.06]'}">
        <h2 className={`text-sm font-bold mb-3 ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>Trainer</h2>
        <button
          onClick={() => { haptic.lightTap(); onSelectTrainer(workout.trainer.id); }}
          className={`w-full flex items-center gap-3 p-3 rounded-[16px] text-left cursor-pointer ${
            isLight ? 'bg-[#f8f8f8]' : 'bg-[#222]'
          }`}
        >
          <img 
            src={workout.trainer.avatar}
            alt={workout.trainer.name}
            className="w-14 h-14 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
              {workout.trainer.name}
            </h3>
            <p className={`text-[11px] ${isLight ? 'text-[#888]' : 'text-white/50'}`}>
              {workout.trainer.title}
            </p>
            <p className={`text-[10px] font-semibold mt-0.5 ${isLight ? 'text-neon-600' : 'text-neon-400'}`}>
              {workout.trainer.experience}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-neon-400 fill-neon-400" />
            <span className={`text-xs font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
              {workout.trainer.rating}
            </span>
          </div>
        </button>
      </div>

      {/* Reviews Section */}
      {workout.review && (
        <div className="py-5 border-t ${isLight ? 'border-[#f0f0f0]' : 'border-white/[0.06]'}">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>4.6</span>
              <div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`w-3 h-3 ${star <= 4 ? 'text-neon-400 fill-neon-400' : 'text-[#333]'}`} />
                  ))}
                </div>
                <p className={`text-[10px] ${isLight ? 'text-[#aaa]' : 'text-white/40'}`}>174 Ratings</p>
              </div>
            </div>
            <button className={`text-xs font-semibold ${isLight ? 'text-neon-600' : 'text-neon-400'}`}>
              See all
            </button>
          </div>

          {/* Review Card */}
          <div className={`p-3 rounded-[16px] ${isLight ? 'bg-[#f8f8f8]' : 'bg-[#222]'}`}>
            <div className="flex items-center gap-3 mb-2">
              <img 
                src={workout.review.avatar}
                alt={workout.review.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={`text-xs font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                    {workout.review.name}
                  </h4>
                  <span className={`text-[10px] ${isLight ? 'text-[#aaa]' : 'text-white/40'}`}>
                    {workout.review.time}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-neon-400 fill-neon-400" />
                  <span className={`text-[10px] font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                    {workout.review.rating}
                  </span>
                </div>
              </div>
            </div>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-[#666]' : 'text-white/50'}`}>
              {workout.review.text}
            </p>
          </div>
        </div>
      )}

      {/* Exercises Section */}
      <div className="py-5 border-t ${isLight ? 'border-[#f0f0f0]' : 'border-white/[0.06]'}">
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-sm font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>Exercises</h2>
          <span className={`text-[11px] font-semibold ${isLight ? 'text-[#aaa]' : 'text-white/40'}`}>
            {workout.exercises.length} STEPS · 3 SETS
          </span>
        </div>

        <div className="space-y-3">
          {workout.exercises.map((exercise: any, index: number) => (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 rounded-[16px] ${
                isLight ? 'bg-[#f8f8f8]' : 'bg-[#222]'
              }`}
            >
              <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center text-xl ${
                isLight ? 'bg-[#f0f0f0]' : 'bg-[#2a2a2a]'
              }`}>
                {exercise.icon}
              </div>
              <div className="flex-1">
                <h4 className={`text-sm font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                  {exercise.name}
                </h4>
                <p className={`text-[11px] ${isLight ? 'text-[#888]' : 'text-white/50'}`}>
                  {exercise.reps}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Start Workout Button */}
      <div className="py-6">
        <button
          onClick={() => { haptic.mediumClick(); onStartWorkout(); }}
          className="w-full py-4 rounded-[16px] bg-neon-400 text-[#0a0a0a] font-bold text-sm flex items-center justify-center gap-2 neon-glow cursor-pointer"
        >
          <Play className="w-5 h-5" fill="currentColor" />
          Start Workout
        </button>
      </div>
    </div>
  );
};
