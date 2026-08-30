import React from 'react';
import { ViewMode } from '../types';
import { t } from '../i18n';
import { 
  CheckSquare, 
  LayoutGrid, 
  Calendar, 
  BarChart3, 
  BookOpen,
  Dumbbell,
  Trophy,
  Sparkles,
  Settings,
} from 'lucide-react';
import { haptic } from '../utils/haptics';

interface MobileNavProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  theme: 'dark' | 'light';
}

const navItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: t('nav.home'), icon: <Sparkles className="w-5 h-5" /> },
  { id: 'tasks', label: t('nav.tasks'), icon: <CheckSquare className="w-5 h-5" /> },
  { id: 'fitness', label: t('nav.fitness'), icon: <Dumbbell className="w-5 h-5" /> },
  { id: 'settings', label: t('nav.settings'), icon: <Settings className="w-5 h-5" /> },
];

export const MobileNav: React.FC<MobileNavProps> = ({
  currentView,
  onViewChange,
  theme
}) => {
  const isLight = theme === 'light';

  return (
    <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 safe-area-bottom transition-all duration-300 ${
      isLight
        ? 'bg-white/80 backdrop-blur-3xl border-t border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_-2px_10px_rgba(0,0,0,0.06)]'
        : 'bg-[#111113]/90 backdrop-blur-3xl border-t border-white/[0.15] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_-2px_10px_rgba(0,0,0,0.4)]'
    }`}>
      {/* Liquid glass gradient overlay */}
      <div className={`absolute inset-0 pointer-events-none ${
        isLight
          ? 'bg-gradient-to-t from-white/60 via-white/10 to-white/30'
          : 'bg-gradient-to-t from-black/20 via-white/[0.03] to-white/[0.06]'
      }`} />
      <div className="relative flex items-center justify-around px-1 py-1">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                haptic.lightTap();
                onViewChange(item.id);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[52px] h-14 rounded-2xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? isLight
                    ? 'text-orange-600 bg-orange-500/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]'
                    : 'text-orange-400 bg-orange-500/15 shadow-[0_0_12px_rgba(249,115,22,0.2)]'
                  : isLight
                    ? 'text-slate-400 active:text-slate-700'
                    : 'text-white/60 active:text-white/90'
              }`}
            >
              <div className="relative">
                {item.icon}
                {isActive && (
                  <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full ${
                    isLight ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]' : 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.4)]'
                  }`} />
                )}
              </div>
              <span className={`text-[10px] font-semibold tracking-tight ${
                isActive ? 'font-bold' : ''
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
