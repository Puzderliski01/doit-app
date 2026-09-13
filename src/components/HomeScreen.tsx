import React from 'react';
import { 
  Trophy, 
  ChevronRight, 
  Footprints, 
  Flame, 
  Droplets,
  TrendingUp,
  Play,
  Calendar,
} from 'lucide-react';
import { haptic } from '../utils/haptics';

interface HomeScreenProps {
  theme: 'dark' | 'light';
  userName?: string;
  onSelectWorkout: (workoutId: string) => void;
}

const DAILY_WORKOUTS = [
  {
    id: 'dw1',
    name: 'Indoor Walk',
    distance: '2.44 km',
    day: 'Today',
  },
  {
    id: 'dw2',
    name: 'Morning Running',
    distance: '3.88 km',
    day: 'Today',
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  theme, 
  userName = 'Lester',
  onSelectWorkout,
}) => {
  const isLight = theme === 'light';

  return (
    <div className="space-y-5">
      {/* Header with Avatar and Greeting */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
            alt="Profile"
            className="w-12 h-12 rounded-full object-cover border-2 border-neon-400"
          />
          <div>
            <h1 className={`text-lg font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
              Hello {userName}!
            </h1>
            <p className={`text-xs ${isLight ? 'text-[#888]' : 'text-white/50'}`}>
              Let's start your day
            </p>
          </div>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isLight ? 'bg-neon-400/15' : 'bg-neon-400/10'
        }`}>
          <Trophy className={`w-5 h-5 ${isLight ? 'text-neon-600' : 'text-neon-400'}`} />
        </div>
      </div>

      {/* Steps Card */}
      <div className={`p-4 rounded-[20px] border ${
        isLight ? 'bg-white border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.04)]' : 'bg-[#1a1a1a] border-white/[0.06]'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-sm font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>Steps</h2>
          <span className={`text-xs font-semibold ${isLight ? 'text-[#888]' : 'text-white/50'}`}>68%</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <span className={`text-3xl font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>11 000</span>
            <span className={`text-sm font-medium ${isLight ? 'text-[#aaa]' : 'text-white/40'}`}>/ 16 000</span>
          </div>
          {/* Progress ring */}
          <svg width="48" height="48" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="none" strokeWidth="4" 
              className={isLight ? 'stroke-[#f0f0f0]' : 'stroke-[#2a2a2a]'} />
            <circle cx="24" cy="24" r="20" fill="none" strokeWidth="4" strokeLinecap="round"
              stroke="url(#steps-grad)"
              className="rotate-[-90deg] origin-center"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - 0.68)}`} />
            <defs>
              <linearGradient id="steps-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#c8ff00" />
                <stop offset="100%" stopColor="#a8e600" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Daily Activity Card */}
      <div className={`p-4 rounded-[20px] border ${
        isLight ? 'bg-white border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.04)]' : 'bg-[#1a1a1a] border-white/[0.06]'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-sm font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>Daily Activity</h2>
          <button className={`text-xs font-semibold flex items-center gap-0.5 ${isLight ? 'text-neon-600' : 'text-neon-400'}`}>
            See all <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Activity Ring */}
          <div className="relative w-20 h-20 shrink-0">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" strokeWidth="6" 
                className={isLight ? 'stroke-[#f0f0f0]' : 'stroke-[#2a2a2a]'} />
              <circle cx="40" cy="40" r="34" fill="none" strokeWidth="6" strokeLinecap="round"
                stroke="#c8ff00"
                className="rotate-[-90deg] origin-center"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - 0.7)}`} />
              <circle cx="40" cy="40" r="26" fill="none" strokeWidth="6" 
                className={isLight ? 'stroke-[#f0f0f0]' : 'stroke-[#2a2a2a]'} />
              <circle cx="40" cy="40" r="26" fill="none" strokeWidth="6" strokeLinecap="round"
                stroke="#666"
                className="rotate-[-90deg] origin-center"
                strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={`${2 * Math.PI * 26 * (1 - 0.5)}`} />
              <circle cx="40" cy="40" r="18" fill="none" strokeWidth="6" 
                className={isLight ? 'stroke-[#f0f0f0]' : 'stroke-[#2a2a2a]'} />
              <circle cx="40" cy="40" r="18" fill="none" strokeWidth="6" strokeLinecap="round"
                stroke="#333"
                className="rotate-[-90deg] origin-center"
                strokeDasharray={`${2 * Math.PI * 18}`}
                strokeDashoffset={`${2 * Math.PI * 18 * (1 - 0.4)}`} />
            </svg>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold ${isLight ? 'text-[#888]' : 'text-white/50'}`}>Steps</span>
              <span className={`text-xs font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                11 000 <span className={isLight ? 'text-[#aaa]' : 'text-white/40'}>/ 16 000</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold ${isLight ? 'text-[#888]' : 'text-white/50'}`}>Calories</span>
              <span className={`text-xs font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                440 <span className={isLight ? 'text-[#aaa]' : 'text-white/40'}>/ 680 Cal</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold ${isLight ? 'text-[#888]' : 'text-white/50'}`}>Water</span>
              <span className={`text-xs font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                1,8 <span className={isLight ? 'text-[#aaa]' : 'text-white/40'}>/ 2,5 L</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Workouts Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-sm font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>Workouts</h2>
          <button className={`text-xs font-semibold flex items-center gap-0.5 ${isLight ? 'text-neon-600' : 'text-neon-400'}`}>
            See all <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-3">
          {DAILY_WORKOUTS.map((workout) => (
            <button
              key={workout.id}
              onClick={() => { haptic.lightTap(); onSelectWorkout(workout.id); }}
              className={`w-full flex items-center gap-3 p-3 rounded-[16px] text-left transition-all cursor-pointer ${
                isLight ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-black/[0.04]' : 'bg-[#1a1a1a] border border-white/[0.06]'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isLight ? 'bg-neon-400/15' : 'bg-neon-400/10'
              }`}>
                <Play className={`w-4 h-4 ml-0.5 ${isLight ? 'text-neon-600' : 'text-neon-400'}`} fill="currentColor" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                  {workout.name}
                </h3>
                <p className={`text-xs font-semibold ${isLight ? 'text-[#888]' : 'text-white/50'}`}>
                  {workout.distance}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-[11px] font-semibold ${isLight ? 'text-[#aaa]' : 'text-white/40'}`}>
                  {workout.day}
                </p>
                <ChevronRight className={`w-4 h-4 ml-auto ${isLight ? 'text-[#ccc]' : 'text-white/30'}`} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
