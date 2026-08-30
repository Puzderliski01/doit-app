import React from 'react';
import { ViewMode, AuthUser } from '../types';
import { 
  CheckSquare, 
  LayoutGrid, 
  Calendar, 
  BarChart3, 
  BookOpen, 
  Sun, 
  Moon, 
  Bell, 
  Plus, 
  CloudCheck, 
  Sparkles, 
  Zap, 
  User as UserIcon, 
  LogIn, 
  ShieldCheck,
  Dumbbell,
  Trophy,
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
    { id: 'list', label: 'Focus View', icon: <CheckSquare className="w-3.5 h-3.5" /> },
    { id: 'matrix', label: 'Priority Matrix', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { id: 'fitness', label: 'Fitness', icon: <Dumbbell className="w-3.5 h-3.5" /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: 'calendar', label: 'Timeline', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'docs', label: 'Mobile & Store Docs', icon: <BookOpen className="w-3.5 h-3.5" /> },
  ];

  const isLight = theme === 'light';

  return (
    <header className={`sticky top-0 z-40 transition-colors duration-200 border-b backdrop-blur-xl safe-area-top ${
      isLight 
        ? 'bg-white/90 border-slate-200 text-slate-800 shadow-[0_2px_15px_rgba(0,0,0,0.04)]' 
        : 'bg-black/60 border-white/10 text-[#e0e0e0]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div 
            onClick={() => { haptic.lightTap(); onViewChange('list'); }}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-300 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-transform group-hover:scale-105">
              <div className="w-3.5 h-3.5 border-2 border-black rounded-sm"></div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`font-semibold tracking-tight text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>DoIT</span>
                <span className={`text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded border ${
                  isLight 
                    ? 'text-orange-600 bg-orange-50 border-orange-200' 
                    : 'text-white/60 bg-white/5 border-white/10'
                }`}>
                  PRO
                </span>
              </div>
            </div>
          </div>

          {/* Sync Status Badge */}
          <div className={`hidden lg:flex items-center gap-2 px-3 py-1 rounded-full text-xs border ${
            isLight ? 'bg-slate-100/80 border-slate-200' : 'bg-white/5 border-white/10'
          }`}>
            {currentUser?.isGuest ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
                <span className={`font-mono text-[11px] ${isLight ? 'text-amber-700 font-medium' : 'text-amber-300/90'}`}>
                  Guest Mode
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                <span className={`font-mono text-[11px] ${isLight ? 'text-slate-600' : 'text-white/80'}`}>
                  {isOnline ? 'Synced' : 'Offline'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Center View Navigation */}
        <nav className={`hidden lg:flex items-center gap-1 p-1 rounded-xl border backdrop-blur-md ${
          isLight ? 'bg-slate-100/90 border-slate-200' : 'bg-white/5 border-white/10'
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
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
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Notification Bell */}
          <button
            id="btn-notifications-center"
            onClick={() => {
              haptic.mediumClick();
              onOpenNotifications();
            }}
            className={`relative min-w-[40px] min-h-[40px] flex items-center justify-center border rounded-full transition-all cursor-pointer ${
              isLight 
                ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900' 
                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(249,115,22,0.6)]">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            id="btn-theme-toggle"
            onClick={() => {
              haptic.lightTap();
              onToggleTheme();
            }}
            className={`min-w-[40px] min-h-[40px] flex items-center justify-center border rounded-full transition-all cursor-pointer ${
              isLight 
                ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100 hover:text-amber-700' 
                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            {isLight ? (
              <Moon className="w-4 h-4 text-indigo-600" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* User Account */}
          {currentUser ? (
            currentUser.isGuest ? (
              <button
                id="btn-user-guest"
                onClick={() => {
                  haptic.mediumClick();
                  onOpenAuth();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                  isLight 
                    ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800' 
                    : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/35 text-amber-300'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold text-[10px]">
                  G
                </div>
                <span className="text-xs font-semibold hidden sm:inline">Guest</span>
              </button>
            ) : (
              <button
                id="btn-user-account"
                onClick={() => {
                  haptic.mediumClick();
                  onOpenAuth();
                }}
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
                <span className="text-xs font-semibold max-w-[80px] truncate hidden sm:inline">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
              </button>
            )
          ) : (
            <button
              id="btn-login-trigger"
              onClick={() => {
                haptic.mediumClick();
                onOpenAuth();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-semibold text-xs transition-all cursor-pointer ${
                isLight 
                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700' 
                  : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border-amber-500/40 text-amber-300'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Log In</span>
            </button>
          )}

          {/* New Task Button */}
          <button
            id="btn-header-new-task"
            onClick={() => {
              haptic.mediumClick();
              onOpenNewTask();
            }}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 font-bold rounded-full text-xs active:scale-95 transition-all cursor-pointer ${
              isLight 
                ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-[0_4px_14px_rgba(249,115,22,0.35)]' 
                : 'bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
            }`}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">New Task</span>
          </button>
        </div>

      </div>
    </header>
  );
};

