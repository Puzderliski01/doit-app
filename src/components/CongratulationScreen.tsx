import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface CongratulationScreenProps {
  theme: 'dark' | 'light';
  onClose: () => void;
}

export const CongratulationScreen: React.FC<CongratulationScreenProps> = ({ 
  theme,
  onClose,
}) => {
  const isLight = theme === 'light';

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[60] p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-full max-w-sm rounded-[28px] overflow-hidden ${
          isLight ? 'bg-white' : 'bg-[#1a1a1a]'
        }`}
      >
        {/* Top neon section */}
        <div className={`relative h-48 flex items-center justify-center ${
          isLight ? 'bg-neon-400' : 'bg-neon-400'
        }`}>
          {/* Checkmark */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-[#0a0a0a]/20 flex items-center justify-center"
          >
            <motion.div
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Check className="w-10 h-10 text-[#0a0a0a]" strokeWidth={3} />
            </motion.div>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`text-xl font-bold mb-3 ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}
          >
            Workout Complete!
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={`text-sm leading-relaxed mb-6 ${isLight ? 'text-[#888]' : 'text-white/50'}`}
          >
            Amazing effort! You've crushed your workout. Keep up the momentum and stay consistent — every rep counts.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={onClose}
            className={`w-full py-4 rounded-[16px] font-bold text-sm transition-all cursor-pointer ${
              isLight 
                ? 'bg-[#1a1a1a] text-white hover:bg-[#333]' 
                : 'bg-white text-[#0a0a0a] hover:bg-white/90'
            }`}
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
