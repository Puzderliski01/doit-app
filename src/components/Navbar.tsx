import React from 'react';
import { ViewMode, AuthUser } from '../types';
import { storage } from '../utils/storage';
import { t } from '../i18n';
import { 
  CheckSquare, 
  Sun, 
  Moon, 
  Plus, 
  Dumbbell,
  Settings as SettingsIcon,
  Home,
  User as UserIcon,
  LogIn,
} from 'lucide-react';
import { haptic } from '../utils/haptics';
import { User } from 'firebase/auth';

interface NavbarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenNewTask: () => void;
  onOpenNotifications: () => void;
  onOpenDocs: () => void;
  unreadNotifsCount: number;
  lastSyncTime: string;
  isOnline: boolean;
  currentUser: AuthUser | User | null;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  theme,
  onToggleTheme,
  onOpenNewTask,
  onOpenNotifications,
  onOpenDocs,
  unreadNotifsCount,
  lastSyncTime,
  isOnline,
  currentUser,
  onOpenAuth
}) => {
  const navItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: t('nav.home'), icon: <Home className="w-4 h-4" /> },
    { id: 'tasks', label: t('nav.tasks'), icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'fitness', label: t('nav.fitness'), icon: <Dumbbell className="w-4 h-4" /> },
    { id: 'settings', label: t('nav.settings'), icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  const isLight = theme === 'light';

  return (
    <header className={`hidden lg:block sticky top-0 z-40 relative transition-all duration-300 safe-area-top ${
      isLight
        ? 'bg-white/80 backdrop-blur-3xl border-b border-black/[0.04] text-[#1a1a1a]'
        : 'bg-[#0a0a0a]/90 backdrop-blur-3xl border-b border-white/[0.06] text-white'
    }`}>
      <div className="w-full px-6 h-14 flex items-center justify-between gap-4">
        
        {/* Brand Logo - Clickable */}
        <div 
          onClick={() => { haptic.lightTap(); onViewChange('home'); }}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-neon-400 flex items-center justify-center shadow-[0_0_15px_rgba(200,255,0,0.3)] transition-transform group-hover:scale-105">
            <div className="w-3.5 h-3.5 border-2 border-[#0a0a0a] rounded-sm"></div>
          </div>
          <span className={`font-semibold tracking-tight text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>DoIT</span>
        </div>

        {/* Center View Navigation */}
        <nav className={`flex items-center gap-1 p-1 rounded-2xl border backdrop-blur-2xl ${
          isLight ? 'bg-white/60 border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_2px_8px_rgba(0,0,0,0.06)]' : 'bg-[#111113]/80 border-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.3)]'
        }`}>
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => {
                  haptic.lightTap();
                  onViewChange(item.id);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? isLight
                      ? 'bg-white text-slate-900 border border-slate-300/80 shadow-sm font-semibold'
                      : 'bg-white/10 text-white border border-white/15 shadow-sm font-semibold'
                    : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Theme Toggle */}
          <button
            id="btn-theme-toggle"
            onClick={() => {
              haptic.lightTap();
              onToggleTheme();
              storage.saveTheme(isLight ? 'dark' : 'light');
            }}
            className={`w-9 h-9 flex items-center justify-center border rounded-full transition-all cursor-pointer ${
              isLight 
                ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100' 
                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
            }`}
          >
            {isLight ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* User Account */}
          {currentUser ? (
            <button
              id="btn-user-account"
              onClick={() => { haptic.mediumClick(); onOpenAuth(); }}
              className={`flex items-center gap-1.5 pl-1.5 pr-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800' 
                  : 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
              }`}
            >
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.displayName || 'User'} 
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full border border-amber-400/80 object-cover" 
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-black font-bold text-xs">
                  {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="text-xs font-semibold max-w-[80px] truncate">
                {currentUser.displayName || currentUser.email?.split('@')[0]}
              </span>
            </button>
          ) : (
            <button
              id="btn-login-trigger"
              onClick={() => { haptic.mediumClick(); onOpenAuth(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-semibold text-xs transition-all cursor-pointer ${
                isLight 
                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700' 
                  : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border-amber-500/40 text-amber-300'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-amber-500" />
              <span>Log In</span>
            </button>
          )}

          {/* New Task Button */}
          <button
            id="btn-header-new-task"
            onClick={() => { haptic.mediumClick(); onOpenNewTask(); }}
            className={`flex items-center gap-1.5 px-4 py-2 font-bold rounded-full text-xs active:scale-95 transition-all cursor-pointer ${
              isLight 
                ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-[0_4px_14px_rgba(249,115,22,0.35)]' 
                : 'bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
            }`}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Task</span>
          </button>
        </div>

      </div>
    </header>
  );
};
