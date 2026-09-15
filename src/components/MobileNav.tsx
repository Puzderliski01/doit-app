import React from 'react';
import { ViewMode } from '../types';
import { t } from '../i18n';
import { 
  Home,
  Dumbbell,
  CheckSquare,
  Settings as SettingsIcon,
} from 'lucide-react';
import { haptic } from '../utils/haptics';

interface MobileNavProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
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
  theme,
}) => {
  const isLight = theme === 'light';

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="px-3 pb-2">
        <div className={`flex items-center justify-around rounded-[20px] px-2 py-1.5 transition-all ${
          isLight
            ? 'bg-white/95 backdrop-blur-xl shadow-[0_-2px_20px_rgba(0,0,0,0.08)] border border-black/[0.04]'
            : 'bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/[0.06] shadow-[0_-2px_20px_rgba(0,0,0,0.5)]'
        }`}>
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  haptic.lightTap();
                  onViewChange(item.id);
                }}
                className={`flex flex-col items-center justify-center gap-0.5 w-16 h-12 rounded-[14px] transition-all duration-200 cursor-pointer ${
                  isActive
                    ? isLight
                      ? 'bg-neon-400/15 text-neon-600'
                      : 'text-neon-400 bg-neon-400/10'
                    : isLight
                      ? 'text-[#8a8a8a]'
                      : 'text-white/40'
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
  );
};
