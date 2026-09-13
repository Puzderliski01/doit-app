import React from 'react';
import { motion } from 'motion/react';

interface GetReadyScreenProps {
  theme: 'dark' | 'light';
  onReady?: () => void;
}

export const GetReadyScreen: React.FC<GetReadyScreenProps> = ({ 
  theme,
  onReady,
}) => {
  const isLight = theme === 'light';

  return (
    <div className={`fixed inset-0 flex flex-col items-center justify-center z-50 ${
      isLight ? 'bg-neon-400' : 'bg-[#0a0a0a]'
    }`}>
      {/* Neon green background for dark mode */}
      {!isLight && (
        <div className="absolute inset-0 bg-neon-400" />
      )}
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center"
      >
        <h1 className={`text-4xl font-bold ${
          isLight ? 'text-[#1a1a1a]' : 'text-[#0a0a0a]'
        }`}>
          Get ready
        </h1>
      </motion.div>

      {/* Animated dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex gap-2 mt-8"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
            className={`w-2 h-2 rounded-full ${
              isLight ? 'bg-[#1a1a1a]/30' : 'bg-[#0a0a0a]/30'
            }`}
          />
        ))}
      </motion.div>
    </div>
  );
};
