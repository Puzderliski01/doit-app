import React from 'react';
import { ViewMode } from '../types';
import { t } from '../i18n';
import { 
  CheckSquare, 
  Dumbbell,
  Settings,
  Home,
} from 'lucide-react';
import { haptic } from '../utils/haptics';

interface MobileNavProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  theme: 'dark' | 'light';
}

const navItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: t('nav.home'), icon: <Home className="w-5 h-5" /> },
  { id: 'tasks', label: t('nav.tasks'), icon: <CheckSquare className="w-5 h-5" /> },
  { id: 'fitness', label: t('nav.fitness'), icon: <Dumbbell className="w-5 h-5" /> },
  { id: 'settings', label: t('nav.settings'), icon: <Settings className="w-5 h-5" /> },
];

export const MobileNav: React.FC<MobileNavProps> = ({
  currentView,
  onViewChange,
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 safe-area-bottom">
      <div className="mx-3 mb-3">
        <div className="flex items-center justify-around bg-white rounded-[20px] px-2 py-2 shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] border border-black/[0.04]">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  haptic.lightTap();
                  onViewChange(item.id);
                }}
                className={`flex flex-col items-center justify-center gap-1 min-w-[60px] h-12 rounded-[14px] transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-mint-50 text-mint-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]'
                    : 'text-[#8a96a8] hover:text-[#5a6678] hover:bg-cream-100'
                }`}
              >
                <div className="relative">
                  {item.icon}
                </div>
                <span className={`text-[10px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
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
