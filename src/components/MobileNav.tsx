import React from 'react';
import { ViewMode } from '../types';
import { 
  CheckSquare, 
  LayoutGrid, 
  Calendar, 
  BarChart3, 
  BookOpen 
} from 'lucide-react';
import { haptic } from '../utils/haptics';

interface MobileNavProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  theme: 'dark' | 'light';
}

const navItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: 'list', label: 'Tasks', icon: <CheckSquare className="w-5 h-5" /> },
  { id: 'matrix', label: 'Matrix', icon: <LayoutGrid className="w-5 h-5" /> },
  { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-5 h-5" /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'docs', label: 'Docs', icon: <BookOpen className="w-5 h-5" /> },
];

export const MobileNav: React.FC<MobileNavProps> = ({
  currentView,
  onViewChange,
  theme
}) => {
  const isLight = theme === 'light';

  return (
    <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t safe-area-bottom ${
      isLight
        ? 'bg-white/95 border-slate-200 backdrop-blur-xl'
        : 'bg-black/90 border-white/10 backdrop-blur-xl'
    }`}>
      <div className="flex items-center justify-around px-1 py-1">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                haptic.lightTap();
                onViewChange(item.id);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[52px] h-14 rounded-xl transition-all duration-150 cursor-pointer ${
                isActive
                  ? isLight
                    ? 'text-orange-600'
                    : 'text-orange-400'
                  : isLight
                    ? 'text-slate-400 active:text-slate-700'
                    : 'text-white/40 active:text-white/70'
              }`}
            >
              <div className="relative">
                {item.icon}
                {isActive && (
                  <div className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                    isLight ? 'bg-orange-600' : 'bg-orange-400'
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
