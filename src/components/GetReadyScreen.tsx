import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { haptic } from '../utils/haptics';

interface GetReadyScreenProps {
  theme: 'dark' | 'light';
  onReady?: () => void;
}

export const GetReadyScreen: React.FC<GetReadyScreenProps> = ({
  theme,
  onReady,
}) => {
  const isLight = theme === 'light';
  const [count, setCount] = useState(3);
  const [showGo, setShowGo] = useState(false);

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => {
        haptic.lightTap();
        setCount(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Show "GO!" then navigate
      setShowGo(true);
      haptic.success();
      const timer = setTimeout(() => {
        onReady?.();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [count, onReady]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-[60] overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[#0a0a0a]">
        <motion.div
          className="absolute inset-0 bg-[#c8ff00]"
          initial={{ clipPath: 'circle(0% at 50% 50%)' }}
          animate={{ clipPath: 'circle(150% at 50% 50%)' }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        <AnimatePresence mode="wait">
          {showGo ? (
            <motion.div
              key="go"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              <h1 className="text-7xl sm:text-9xl font-black text-[#0a0a0a] tracking-tighter">
                GO!
              </h1>
            </motion.div>
          ) : count > 0 ? (
            <motion.div
              key={count}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              <h1 className="text-8xl sm:text-9xl font-black text-[#0a0a0a] tracking-tighter">
                {count}
              </h1>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-[#0a0a0a]/60 text-sm font-bold uppercase tracking-widest mt-4"
        >
          Get Ready
        </motion.p>
      </div>

      {/* Pulse rings */}
      {[1, 2, 3].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2 border-[#0a0a0a]/10"
          initial={{ width: 100, height: 100, opacity: 0.5 }}
          animate={{
            width: [100, 400],
            height: [100, 400],
            opacity: [0.3, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.6,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
};
