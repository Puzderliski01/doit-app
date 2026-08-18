import React from 'react';
import { AppNotification } from '../types';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  Wifi, 
  WifiOff, 
  Flame, 
  X,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { haptic } from '../utils/haptics';

interface NotificationToastContainerProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
  onAction?: (notification: AppNotification) => void;
}

export const NotificationToastContainer: React.FC<NotificationToastContainerProps> = ({
  notifications,
  onDismiss,
  onAction
}) => {
  // Only display up to the 3 most recent unread or active toast notifications
  const visibleToasts = notifications.slice(0, 3);

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'overdue':
      case 'urgent_priority':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'subtask_complete':
      case 'achievement':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'deadline':
        return <Clock className="w-4 h-4 text-orange-400" />;
      case 'sync':
        return <Wifi className="w-4 h-4 text-cyan-400" />;
      case 'daily_briefing':
        return <Flame className="w-4 h-4 text-orange-400" />;
      default:
        return <Bell className="w-4 h-4 text-white/80" />;
    }
  };

  const getBorderColor = (type: AppNotification['type']) => {
    switch (type) {
      case 'overdue':
      case 'urgent_priority':
        return 'border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.2)] bg-[#180909]/90';
      case 'subtask_complete':
      case 'achievement':
        return 'border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-[#181208]/90';
      case 'deadline':
        return 'border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.2)] bg-[#180f08]/90';
      case 'sync':
        return 'border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.2)] bg-[#08151a]/90';
      default:
        return 'border-white/15 shadow-2xl bg-[#0e0e12]/90';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
            className={`pointer-events-auto p-4 rounded-3xl border backdrop-blur-2xl text-white ${getBorderColor(toast.type)} transition-all`}
          >
            <div className="flex items-start gap-3">
              
              {/* Icon Bubble */}
              <div className="w-8 h-8 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                {getIcon(toast.type)}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h4 className="font-semibold text-xs tracking-tight text-white line-clamp-1">
                    {toast.title}
                  </h4>
                  <button
                    onClick={() => {
                      haptic.lightTap();
                      onDismiss(toast.id);
                    }}
                    className="p-1 rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-white/60 leading-relaxed mb-2 line-clamp-2">
                  {toast.message}
                </p>

                {/* Optional Action Button */}
                {toast.actionLabel && onAction && (
                  <button
                    onClick={() => {
                      haptic.mediumClick();
                      onAction(toast);
                      onDismiss(toast.id);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-black font-bold text-[10px] hover:bg-white/90 active:scale-95 transition-all cursor-pointer shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                  >
                    <span>{toast.actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
