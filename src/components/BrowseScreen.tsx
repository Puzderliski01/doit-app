import React, { useState } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Play,
  Clock,
  Flame,
  ChevronRight,
  User,
  Star,
  Filter,
} from 'lucide-react';
import { haptic } from '../utils/haptics';

interface BrowseScreenProps {
  theme: 'dark' | 'light';
  onSelectWorkout: (workoutId: string) => void;
  onSelectTrainer: (trainerId: string) => void;
}

const workoutTabs = ['Workouts', 'Fitness', 'Plans', 'Trainers'];

const WORKOUTS = [
  {
    id: 'w1',
    title: 'Home Chest Workout',
    subtitle: '(No Equipment)',
    duration: '45 min',
    difficulty: 'AAA Hard',
    calories: 381,
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop',
  },
  {
    id: 'w2',
    title: 'Complete Home Leg Workout Without',
    subtitle: 'Equipment',
    duration: '45 min',
    difficulty: 'AA Middle',
    calories: 320,
    image: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&h=300&fit=crop',
  },
  {
    id: 'w3',
    title: 'Total Body Strength Burnout',
    subtitle: '(No Weights)',
    duration: '55 min',
    difficulty: 'AAA Hard',
    calories: 420,
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop',
  },
  {
    id: 'w4',
    title: 'Perfect Home Shoulder Workout',
    subtitle: '',
    duration: '15 min',
    difficulty: 'A Easy',
    calories: 120,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
  },
];

const TRAINERS = [
  {
    id: 't1',
    name: 'Richard Smith',
    specialty: 'High Intensity Training',
    experience: '5 years experience',
    rating: 4.8,
    avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop',
  },
  {
    id: 't2',
    name: 'Kasandra Lilo',
    specialty: 'High Intensity Training',
    experience: '5 years experience',
    rating: 4.8,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  },
  {
    id: 't3',
    name: 'Chris Heria',
    specialty: 'High Intensity Fitness Trainer',
    experience: '7 years experience',
    rating: 4.6,
    avatar: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=100&h=100&fit=crop',
  },
  {
    id: 't4',
    name: 'Ronald Chief',
    specialty: 'High Intensity Training',
    experience: '9 years experience',
    rating: 4.2,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
  },
];

export const BrowseScreen: React.FC<BrowseScreenProps> = ({ 
  theme, 
  onSelectWorkout,
  onSelectTrainer,
}) => {
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState('Workouts');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-4">
        <h1 className={`text-2xl font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
          Browse
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {workoutTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => { haptic.lightTap(); setActiveTab(tab); }}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab
                ? isLight
                  ? 'bg-[#1a1a1a] text-white'
                  : 'bg-neon-400 text-[#0a0a0a]'
                : isLight
                  ? 'bg-[#f0f0f0] text-[#666] hover:bg-[#e5e5e5]'
                  : 'bg-[#1a1a1a] text-white/60 hover:bg-[#252525]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-3">
        <button className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold ${
          isLight ? 'bg-[#f0f0f0] text-[#333]' : 'bg-[#1a1a1a] text-white/70'
        }`}>
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
        </button>
        <button className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold ${
          isLight ? 'bg-[#f0f0f0] text-[#333]' : 'bg-[#1a1a1a] text-white/70'
        }`}>
          <ArrowUpDown className="w-3.5 h-3.5" />
          Sorting
        </button>
        <button className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold ${
          isLight ? 'bg-[#f0f0f0] text-[#333]' : 'bg-[#1a1a1a] text-white/70'
        }`}>
          <Search className="w-3.5 h-3.5" />
          Search
        </button>
      </div>

      {/* Content */}
      {activeTab === 'Workouts' && (
        <div className="grid grid-cols-2 gap-3">
          {WORKOUTS.map((workout) => (
            <button
              key={workout.id}
              onClick={() => { haptic.lightTap(); onSelectWorkout(workout.id); }}
              className={`relative overflow-hidden rounded-[16px] text-left transition-all cursor-pointer ${
                isLight ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-black/[0.04]' : 'bg-[#1a1a1a] border border-white/[0.06]'
              }`}
            >
              {/* Image */}
              <div className="relative h-32 overflow-hidden">
                <img 
                  src={workout.image} 
                  alt={workout.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* Bookmark */}
                <div className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center ${
                  isLight ? 'bg-white/90' : 'bg-black/40 backdrop-blur-sm'
                }`}>
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>

                {/* Difficulty badge */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded-full bg-neon-400 text-[#0a0a0a] text-[10px] font-bold">
                    {workout.difficulty}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className={`text-xs font-bold leading-tight ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                  {workout.title}
                </h3>
                {workout.subtitle && (
                  <p className={`text-[10px] mt-0.5 ${isLight ? 'text-[#888]' : 'text-white/50'}`}>
                    {workout.subtitle}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className={`flex items-center gap-1 text-[10px] font-semibold ${isLight ? 'text-[#666]' : 'text-white/50'}`}>
                    <Play className="w-3 h-3" fill="currentColor" />
                    {workout.duration}
                  </span>
                  <span className={`flex items-center gap-1 text-[10px] font-semibold ${isLight ? 'text-[#666]' : 'text-white/50'}`}>
                    <Flame className="w-3 h-3" />
                    {workout.calories} Cal
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {activeTab === 'Trainers' && (
        <div className="space-y-3">
          {TRAINERS.map((trainer) => (
            <button
              key={trainer.id}
              onClick={() => { haptic.lightTap(); onSelectTrainer(trainer.id); }}
              className={`w-full flex items-center gap-3 p-3 rounded-[16px] text-left transition-all cursor-pointer ${
                isLight ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-black/[0.04]' : 'bg-[#1a1a1a] border border-white/[0.06]'
              }`}
            >
              <img 
                src={trainer.avatar}
                alt={trainer.name}
                className="w-14 h-14 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                  {trainer.name}
                </h3>
                <p className={`text-[11px] ${isLight ? 'text-[#888]' : 'text-white/50'}`}>
                  {trainer.specialty}
                </p>
                <p className={`text-[10px] font-semibold mt-0.5 ${isLight ? 'text-neon-600' : 'text-neon-400'}`}>
                  {trainer.experience}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-neon-400 fill-neon-400" />
                <span className={`text-xs font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                  {trainer.rating}
                </span>
              </div>
              <ChevronRight className={`w-4 h-4 ${isLight ? 'text-[#ccc]' : 'text-white/30'}`} />
            </button>
          ))}
        </div>
      )}

      {activeTab === 'Fitness' && (
        <div className={`p-8 rounded-[16px] text-center ${isLight ? 'bg-[#f5f5f5]' : 'bg-[#1a1a1a]'}`}>
          <p className={`text-sm ${isLight ? 'text-[#888]' : 'text-white/50'}`}>Fitness content coming soon</p>
        </div>
      )}

      {activeTab === 'Plans' && (
        <div className={`p-8 rounded-[16px] text-center ${isLight ? 'bg-[#f5f5f5]' : 'bg-[#1a1a1a]'}`}>
          <p className={`text-sm ${isLight ? 'text-[#888]' : 'text-white/50'}`}>Plans content coming soon</p>
        </div>
      )}
    </div>
  );
};
