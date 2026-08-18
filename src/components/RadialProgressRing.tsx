import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface RadialProgressRingProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  showText?: boolean;
  isTaskCompleted?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export const RadialProgressRing: React.FC<RadialProgressRingProps> = ({
  completed,
  total,
  size = 40,
  strokeWidth = 3.5,
  showText = true,
  isTaskCompleted = false,
  onClick,
  className = ''
}) => {
  if (total <= 0) return null;

  const percentage = Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
  const isAllComplete = completed === total && total > 0;
  
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const uniqueGradientId = `progress-grad-${size}-${Math.random().toString(36).substring(2, 6)}`;

  return (
    <div 
      onClick={onClick}
      className={`relative inline-flex items-center justify-center select-none ${onClick ? 'cursor-pointer group/ring' : ''} ${className}`}
      style={{ width: size, height: size }}
      title={`${completed} of ${total} subtasks completed (${percentage}%)`}
    >
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`} 
        className="rotate-[-90deg] transform"
      >
        <defs>
          <linearGradient id={uniqueGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            {isAllComplete || isTaskCompleted ? (
              <>
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#10b981" />
              </>
            ) : percentage > 50 ? (
              <>
                <stop offset="0%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#f59e0b" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#fbbf24" />
              </>
            )}
          </linearGradient>
          
          {/* Subtle glow filter */}
          <filter id={`glow-${uniqueGradientId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
        />

        {/* Animated Progress Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${uniqueGradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ 
            type: "spring", 
            stiffness: 70, 
            damping: 15,
            mass: 0.8
          }}
          style={{
            filter: percentage > 0 ? `drop-shadow(0 0 3px ${isAllComplete ? 'rgba(16,185,129,0.5)' : 'rgba(245,158,11,0.5)'})` : 'none'
          }}
        />
      </svg>

      {/* Center Label / Fraction */}
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center text-center">
          {isAllComplete || isTaskCompleted ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
            </motion.div>
          ) : (
            <motion.span 
              key={`${completed}-${total}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-[10px] font-bold font-mono tracking-tighter text-white/90 group-hover/ring:text-orange-400 transition-colors"
            >
              {completed}/{total}
            </motion.span>
          )}
        </div>
      )}
    </div>
  );
};
