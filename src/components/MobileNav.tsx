import React, { useState } from 'react';
import { Home, ListTodo, Dumbbell, Settings, Plus, X, Sparkles, Flame } from 'lucide-react';

interface MobileNavProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onNewTask: () => void;
  onLogWorkout: () => void;
  theme: 'dark' | 'light';
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentView,
  onViewChange,
  onNewTask,
  onLogWorkout,
  theme,
}) => {
  const isLight = theme === 'light';
  const [showActions, setShowActions] = useState(false);

  const tabs = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'tasks', label: 'Tasks', icon: <ListTodo className="w-5 h-5" /> },
    { id: 'fab', label: '', icon: <Plus className="w-6 h-6" /> },
    { id: 'fitness', label: 'Fitness', icon: <Dumbbell className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const actions = [
    {
      label: 'New Task',
      icon: <ListTodo className="w-4 h-4" />,
      color: 'bg-[#c8ff00] text-[#0a0a0a]',
      onClick: () => { onNewTask(); setShowActions(false); },
    },
    {
      label: 'Workout Mode',
      icon: <Flame className="w-4 h-4" />,
      color: 'bg-orange-500 text-white',
      onClick: () => { onLogWorkout(); setShowActions(false); },
    },
  ];

  return (
    <>
      {/* Action Overlay */}
      {showActions && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden"
          onClick={() => setShowActions(false)}
        />
      )}

      {/* Action Buttons */}
      {showActions && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex gap-3 sm:hidden">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm shadow-lg active:scale-95 transition-all ${action.color}`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Nav */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 sm:hidden safe-area-bottom ${
          isLight ? 'bg-white/95' : 'bg-[#111113]/95'
        } backdrop-blur-xl`}
        style={{
          boxShadow: isLight
            ? '0 -1px 0 rgba(0,0,0,0.04)'
            : '0 -1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {tabs.map((tab) => {
            if (tab.id === 'fab') {
              return (
                <button
                  key={tab.id}
                  onClick={() => setShowActions(!showActions)}
                  className="relative -mt-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c8ff00] to-[#b8f000] flex items-center justify-center shadow-lg active:scale-95 transition-all"
                  style={{
                    boxShadow: '0 4px 20px rgba(200, 255, 0, 0.3)',
                  }}
                >
                  <div className={`transition-transform duration-200 ${showActions ? 'rotate-45' : ''}`}>
                    {showActions ? <X className="w-6 h-6 text-[#0a0a0a]" /> : tab.icon}
                  </div>
                </button>
              );
            }

            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onViewChange(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[52px] transition-all ${
                  isActive
                    ? isLight
                      ? 'text-[#c8ff00]'
                      : 'text-[#c8ff00]'
                    : isLight
                      ? 'text-gray-400'
                      : 'text-white/30'
                }`}
              >
                <div className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                  {tab.icon}
                </div>
                <span className="text-[10px] font-medium">{tab.label}</span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-[#c8ff00] mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
