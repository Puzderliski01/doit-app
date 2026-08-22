import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  theme: 'dark' | 'light';
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ isOnline, theme }) => {
  const isLight = theme === 'light';

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full border backdrop-blur-xl shadow-2xl ${
            isLight
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            <WifiOff className="w-4 h-4 animate-pulse" />
            <span className="text-xs font-semibold">Offline Mode • Changes will sync when reconnected</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
