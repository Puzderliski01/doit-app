import React from 'react';
import { ViewMode } from '../types';
import { t } from '../i18n';
import { 
  Home,
  UtensilsCrossed,
  Plus,
  BarChart3,
  Trophy,
} from 'lucide-react';
import { haptic } from '../utils/haptics';

interface MobileNavProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  theme: 'dark' | 'light';
}

const navItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
  { id: 'meal', label: 'Meal', icon: <UtensilsCrossed className="w-5 h-5" /> },
  { id: 'fitness', label: 'Statistics', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'rewards', label: 'Rewards', icon: <Trophy className="w-5 h-5" /> },
];

export const MobileNav: React.FC<MobileNavProps> = ({
  currentView,
  onViewChange,
  theme,
}) => {
  const isLight = theme === 'light';

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 safe-area-bottom">
      <div className="px-4 pb-3">
        <div className={`flex items-center justify-between rounded-[24px] px-3 py-2 transition-all ${
          isLight
            ? 'bg-white shadow-[0_4px_24px_rgba(0,0,0,0.1),0_1px_4px_rgba(0,0,0,0.06)] border border-black/[0.04]'
            : 'bg-[#1a1a1a]/95 backdrop-blur-3xl border border-white/[0.06] shadow-[0_-2px_20px_rgba(0,0,0,0.5)]'
        }`}>
          {navItems.slice(0, 2).map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  haptic.lightTap();
                  onViewChange(item.id);
                }}
                className={`flex flex-col items-center justify-center gap-1 min-w-[56px] h-12 rounded-[14px] transition-all duration-200 cursor-pointer ${
                  isActive
                    ? isLight
                      ? 'bg-neon-400/15 text-neon-600'
                      : 'text-neon-400 bg-neon-400/10'
                    : isLight
                      ? 'text-[#8a8a8a] hover:text-[#5a5a5a]'
                      : 'text-white/40 hover:text-white/70'
                }`}
              >
                {item.icon}
                <span className={`text-[9px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Center + Button */}
          <button
            onClick={() => {
              haptic.mediumClick();
              onViewChange('browse');
            }}
            className={`flex items-center justify-center w-14 h-14 rounded-full -mt-5 transition-all duration-200 cursor-pointer ${
              isLight
                ? 'bg-neon-400 text-[#0a0a0a] shadow-[0_4px_20px_rgba(200,255,0,0.3)]'
                : 'bg-neon-400 text-[#0a0a0a] shadow-[0_4px_20px_rgba(200,255,0,0.3)]'
            }`}
          >
            <Plus className="w-7 h-7" strokeWidth={2.5} />
          </button>

          {navItems.slice(2).map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  haptic.lightTap();
                  onViewChange(item.id);
                }}
                className={`flex flex-col items-center justify-center gap-1 min-w-[56px] h-12 rounded-[14px] transition-all duration-200 cursor-pointer ${
                  isActive
                    ? isLight
                      ? 'bg-neon-400/15 text-neon-600'
                      : 'text-neon-400 bg-neon-400/10'
                    : isLight
                      ? 'text-[#8a8a8a] hover:text-[#5a5a5a]'
                      : 'text-white/40 hover:text-white/70'
                }`}
              >
                {item.icon}
                <span className={`text-[9px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
