import React, { useState } from 'react';
import { ViewMode } from '../types';
import { t } from '../i18n';
import { 
  Home,
  Dumbbell,
  CheckSquare,
  Settings as SettingsIcon,
  Plus,
  X,
  ListTodo,
  Flame,
} from 'lucide-react';
import { haptic } from '../utils/haptics';

interface MobileNavProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onNewTask: () => void;
  onLogWorkout: () => void;
  theme: 'dark' | 'light';
}

const navItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: t('nav.home'), icon: <Home className="w-5 h-5" /> },
  { id: 'fitness', label: t('nav.fitness'), icon: <Dumbbell className="w-5 h-5" /> },
  { id: 'tasks', label: t('nav.tasks'), icon: <CheckSquare className="w-5 h-5" /> },
  { id: 'settings', label: t('nav.settings'), icon: <SettingsIcon className="w-5 h-5" /> },
];

export const MobileNav: React.FC<MobileNavProps> = ({
  currentView,
  onViewChange,
  onNewTask,
  onLogWorkout,
  theme,
}) => {
  const isLight = theme === 'light';
  const [showActions, setShowActions] = useState(false);

  return (
    <>
      {/* Action sheet overlay */}
      {showActions && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowActions(false)}
        >
          <div 
            className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { haptic.mediumClick(); setShowActions(false); onLogWorkout(); }}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-bold text-sm shadow-lg transition-all active:scale-95 ${
                isLight
                  ? 'bg-neon-400 text-[#0a0a0a] shadow-neon-400/30'
                  : 'bg-neon-400 text-[#0a0a0a] shadow-neon-400/30'
              }`}
            >
              <Flame className="w-5 h-5" />
              Log Workout
            </button>
            <button
              onClick={() => { haptic.mediumClick(); setShowActions(false); onNewTask(); }}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-bold text-sm shadow-lg transition-all active:scale-95 ${
                isLight
                  ? 'bg-orange-500 text-white shadow-orange-500/30'
                  : 'bg-white text-black shadow-white/20'
              }`}
            >
              <ListTodo className="w-5 h-5" />
              New Task
            </button>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 safe-area-bottom">
        <div className="px-3 pb-2">
          <div className={`flex items-center rounded-[20px] px-2 py-1.5 transition-all ${
            isLight
              ? 'bg-white/95 backdrop-blur-xl shadow-[0_-2px_20px_rgba(0,0,0,0.08)] border border-black/[0.04]'
              : 'bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/[0.06] shadow-[0_-2px_20px_rgba(0,0,0,0.5)]'
          }`}>
            {/* Left 2 tabs */}
            {navItems.slice(0, 2).map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { haptic.lightTap(); onViewChange(item.id); }}
                  className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-12 rounded-[14px] transition-all duration-200 cursor-pointer ${
                    isActive
                      ? isLight ? 'bg-neon-400/15 text-neon-600' : 'text-neon-400 bg-neon-400/10'
                      : isLight ? 'text-[#8a8a8a]' : 'text-white/40'
                  }`}
                >
                  <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                    {item.icon}
                  </span>
                  <span className={`text-[9px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}

            {/* Center FAB Button */}
            <button
              onClick={() => { haptic.mediumClick(); setShowActions(!showActions); }}
              className={`flex items-center justify-center w-14 h-14 rounded-full -mt-6 transition-all duration-200 cursor-pointer shadow-lg ${
                showActions
                  ? 'bg-orange-500 text-white shadow-orange-500/40 rotate-45'
                  : 'bg-orange-500 text-white shadow-orange-500/40'
              }`}
            >
              {showActions ? <X className="w-6 h-6" /> : <Plus className="w-7 h-7" strokeWidth={2.5} />}
            </button>

            {/* Right 2 tabs */}
            {navItems.slice(2).map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { haptic.lightTap(); onViewChange(item.id); }}
                  className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-12 rounded-[14px] transition-all duration-200 cursor-pointer ${
                    isActive
                      ? isLight ? 'bg-neon-400/15 text-neon-600' : 'text-neon-400 bg-neon-400/10'
                      : isLight ? 'text-[#8a8a8a]' : 'text-white/40'
                  }`}
                >
                  <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                    {item.icon}
                  </span>
                  <span className={`text-[9px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
};
