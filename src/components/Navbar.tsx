import React, { useState } from 'react';
import { Home, ListTodo, Dumbbell, Settings, Plus, Moon, Sun, Bell, FileText, ChevronDown, X, Flame, Sparkles, LogOut, User } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenNewTask: () => void;
  onLogWorkout: () => void;
  onOpenNotifications: () => void;
  onOpenDocs: () => void;
  unreadNotifsCount: number;
  lastSyncTime: string | null;
  isOnline: boolean;
  currentUser: any;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  theme,
  onToggleTheme,
  onOpenNewTask,
  onLogWorkout,
  onOpenNotifications,
  onOpenDocs,
  unreadNotifsCount,
  lastSyncTime,
  isOnline,
  currentUser,
  onOpenAuth,
}) => {
  const isLight = theme === 'light';
  const [showActions, setShowActions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const tabs = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'tasks', label: 'Tasks', icon: <ListTodo className="w-4 h-4" /> },
    { id: 'fitness', label: 'Fitness', icon: <Dumbbell className="w-4 h-4" /> },
  ];

  const isGuest = currentUser?.isGuest || currentUser?.isLocal;

  return (
    <header
      className={`sticky top-0 z-40 hidden sm:block ${
        isLight ? 'bg-white/80' : 'bg-[#0a0a0a]/80'
      } backdrop-blur-2xl`}
      style={{
        boxShadow: isLight
          ? '0 1px 0 rgba(0,0,0,0.04)'
          : '0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#c8ff00] to-[#b8f000] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#0a0a0a]" />
            </div>
            <span className={`text-sm font-bold tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
              DoIT
            </span>
          </div>

          {/* Center Nav */}
          <nav className={`flex gap-1 p-1 rounded-xl ${isLight ? 'bg-gray-100' : 'bg-white/[0.04]'}`}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onViewChange(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  currentView === tab.id
                    ? isLight
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'bg-white/10 text-white'
                    : isLight
                      ? 'text-gray-500 hover:text-gray-700'
                      : 'text-white/40 hover:text-white/60'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button
              onClick={onOpenNotifications}
              className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                isLight
                  ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  : 'bg-white/5 text-white/40 hover:bg-white/10'
              }`}
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#c8ff00] text-[#0a0a0a] text-[9px] font-bold flex items-center justify-center">
                  {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Docs */}
            <button
              onClick={onOpenDocs}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                isLight
                  ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  : 'bg-white/5 text-white/40 hover:bg-white/10'
              }`}
            >
              <FileText className="w-4 h-4" />
            </button>

            {/* FAB */}
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#c8ff00] to-[#b8f000] flex items-center justify-center shadow-md hover:shadow-lg transition-all active:scale-95"
                style={{ boxShadow: '0 2px 12px rgba(200, 255, 0, 0.25)' }}
              >
                <Plus className={`w-4 h-4 text-[#0a0a0a] transition-transform ${showActions ? 'rotate-45' : ''}`} />
              </button>

              {/* Dropdown */}
              {showActions && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
                  <div className={`absolute right-0 top-12 z-50 w-48 py-2 rounded-xl border ${
                    isLight ? 'bg-white shadow-lg shadow-black/8 border-gray-100' : 'bg-[#18181b] border-white/5'
                  }`}>
                    <button
                      onClick={() => { onOpenNewTask(); setShowActions(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium ${
                        isLight ? 'text-gray-700 hover:bg-gray-50' : 'text-white/80 hover:bg-white/5'
                      }`}
                    >
                      <ListTodo className="w-4 h-4 text-[#c8ff00]" />
                      New Task
                    </button>
                    <button
                      onClick={() => { onLogWorkout(); setShowActions(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium ${
                        isLight ? 'text-gray-700 hover:bg-gray-50' : 'text-white/80 hover:bg-white/5'
                      }`}
                    >
                      <Flame className="w-4 h-4 text-orange-400" />
                      Log Workout
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                isLight
                  ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
              }`}
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* User */}
            {currentUser && !isGuest ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                    isLight ? 'bg-gray-100 text-gray-700' : 'bg-white/10 text-white/70'
                  }`}
                >
                  {currentUser.displayName?.[0]?.toUpperCase() || 'U'}
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className={`absolute right-0 top-12 z-50 w-56 py-2 rounded-xl border ${
                      isLight ? 'bg-white shadow-lg shadow-black/8 border-gray-100' : 'bg-[#18181b] border-white/5'
                    }`}>
                      <div className={`px-4 py-2 border-b ${isLight ? 'border-gray-100' : 'border-white/5'}`}>
                        <p className={`text-xs font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{currentUser.displayName || 'User'}</p>
                        <p className={`text-[10px] mt-0.5 ${isLight ? 'text-gray-400' : 'text-white/30'}`}>{currentUser.email}</p>
                      </div>
                      {isGuest && (
                        <button
                          onClick={() => { onOpenAuth(); setShowUserMenu(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium ${
                            isLight ? 'text-gray-700 hover:bg-gray-50' : 'text-white/80 hover:bg-white/5'
                          }`}
                        >
                          <User className="w-4 h-4 text-[#c8ff00]" />
                          Sign In / Sign Up
                        </button>
                      )}
                      <div className={`px-4 py-1.5 flex items-center gap-2 ${isLight ? 'text-gray-400' : 'text-white/20'}`}>
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></span>
                        <span className="text-[10px]">{isOnline ? 'Online' : 'Offline'}</span>
                        {lastSyncTime && <span className="text-[10px] ml-auto">Synced {lastSyncTime}</span>}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#c8ff00]/15 to-[#b8f000]/15 text-[#c8ff00] text-xs font-semibold hover:from-[#c8ff00]/25 hover:to-[#b8f000]/25 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
