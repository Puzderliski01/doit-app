import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface AchievementTreeProps {
  theme: 'dark' | 'light';
  completedTasks: number;
  totalWorkouts: number;
  currentStreak: number;
  xp: number;
}

interface TreeStage {
  name: string;
  minTasks: number;
  trunkHeight: number;
  leaves: { x: number; y: number; size: number; color: string }[];
  fruits: number;
  glow: string;
}

const TREE_STAGES: TreeStage[] = [
  { name: 'Seed', minTasks: 0, trunkHeight: 0, leaves: [], fruits: 0, glow: '#a3a3a3' },
  { name: 'Sprout', minTasks: 5, trunkHeight: 30, leaves: [{ x: 0, y: -30, size: 8, color: '#4ade80' }], fruits: 0, glow: '#4ade80' },
  { name: 'Sapling', minTasks: 15, trunkHeight: 50, leaves: [{ x: -10, y: -45, size: 10, color: '#4ade80' }, { x: 10, y: -50, size: 10, color: '#22c55e' }, { x: 0, y: -55, size: 8, color: '#86efac' }], fruits: 0, glow: '#22c55e' },
  { name: 'Young Tree', minTasks: 30, trunkHeight: 70, leaves: [{ x: -15, y: -60, size: 12, color: '#4ade80' }, { x: 15, y: -65, size: 12, color: '#22c55e' }, { x: 0, y: -75, size: 14, color: '#16a34a' }, { x: -8, y: -70, size: 10, color: '#86efac' }, { x: 8, y: -55, size: 10, color: '#4ade80' }], fruits: 1, glow: '#16a34a' },
  { name: 'Mature Tree', minTasks: 60, trunkHeight: 85, leaves: [{ x: -20, y: -70, size: 14, color: '#4ade80' }, { x: 20, y: -75, size: 14, color: '#22c55e' }, { x: 0, y: -90, size: 16, color: '#16a34a' }, { x: -12, y: -85, size: 12, color: '#86efac' }, { x: 12, y: -65, size: 12, color: '#4ade80' }, { x: -8, y: -90, size: 10, color: '#22c55e' }, { x: 8, y: -80, size: 10, color: '#15803d' }], fruits: 3, glow: '#15803d' },
  { name: 'Great Tree', minTasks: 100, trunkHeight: 100, leaves: [{ x: -25, y: -85, size: 16, color: '#4ade80' }, { x: 25, y: -90, size: 16, color: '#22c55e' }, { x: 0, y: -105, size: 18, color: '#16a34a' }, { x: -18, y: -100, size: 14, color: '#86efac' }, { x: 18, y: -80, size: 14, color: '#4ade80' }, { x: -10, y: -105, size: 12, color: '#22c55e' }, { x: 10, y: -95, size: 12, color: '#15803d' }, { x: -22, y: -95, size: 10, color: '#4ade80' }, { x: 22, y: -100, size: 10, color: '#86efac' }], fruits: 5, glow: '#15803d' },
  { name: 'Ancient Tree', minTasks: 200, trunkHeight: 110, leaves: [{ x: -30, y: -95, size: 18, color: '#4ade80' }, { x: 30, y: -100, size: 18, color: '#22c55e' }, { x: 0, y: -120, size: 20, color: '#16a34a' }, { x: -22, y: -115, size: 16, color: '#86efac' }, { x: 22, y: -90, size: 16, color: '#4ade80' }, { x: -12, y: -120, size: 14, color: '#22c55e' }, { x: 12, y: -108, size: 14, color: '#15803d' }, { x: -28, y: -108, size: 12, color: '#4ade80' }, { x: 28, y: -112, size: 12, color: '#86efac' }, { x: -5, y: -118, size: 10, color: '#16a34a' }, { x: 5, y: -112, size: 10, color: '#22c55e' }], fruits: 8, glow: '#166534' },
];

export const AchievementTree: React.FC<AchievementTreeProps> = ({
  theme,
  completedTasks,
  totalWorkouts,
  currentStreak,
  xp,
}) => {
  const isLight = theme === 'light';
  const totalProgress = completedTasks + totalWorkouts * 3;

  const currentStage = useMemo(() => {
    let stage = TREE_STAGES[0];
    for (const s of TREE_STAGES) {
      if (totalProgress >= s.minTasks) stage = s;
    }
    return stage;
  }, [totalProgress]);

  const nextStage = useMemo(() => {
    const idx = TREE_STAGES.indexOf(currentStage);
    return idx < TREE_STAGES.length - 1 ? TREE_STAGES[idx + 1] : null;
  }, [currentStage]);

  const progressToNext = useMemo(() => {
    if (!nextStage) return 100;
    const currentMin = currentStage.minTasks;
    const range = nextStage.minTasks - currentMin;
    return Math.min(100, Math.round(((totalProgress - currentMin) / range) * 100));
  }, [currentStage, nextStage, totalProgress]);

  const stageIndex = TREE_STAGES.indexOf(currentStage);

  return (
    <div className={`rounded-2xl border p-5 liquid-glass-card ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Your Achievement Tree
          </h3>
          <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
            {currentStage.name} · {completedTasks} tasks · {totalWorkouts} workouts
          </p>
        </div>
        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${isLight ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-500/10 text-emerald-400'}`}>
          Lv.{stageIndex}
        </div>
      </div>

      {/* Tree SVG */}
      <div className="flex justify-center py-4">
        <svg width="160" height="160" viewBox="-80 -130 160 170">
          {/* Ground */}
          <ellipse cx="0" cy="35" rx="40" ry="8" fill={isLight ? '#d4c4a0' : '#3d3222'} opacity="0.6" />
          
          {/* Trunk */}
          {currentStage.trunkHeight > 0 && (
            <motion.rect
              initial={{ height: 0 }}
              animate={{ height: currentStage.trunkHeight }}
              transition={{ duration: 1, ease: 'easeOut' }}
              x="-5"
              y={35 - currentStage.trunkHeight}
              width="10"
              rx="3"
              fill={isLight ? '#92400e' : '#78350f'}
            />
          )}

          {/* Seed (stage 0) */}
          {stageIndex === 0 && (
            <motion.ellipse
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              cx="0" cy="28" rx="6" ry="4"
              fill={isLight ? '#a16207' : '#ca8a04'}
            />
          )}

          {/* Leaves */}
          {currentStage.leaves.map((leaf, i) => (
            <motion.circle
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.9 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
              cx={leaf.x}
              cy={35 - currentStage.trunkHeight + leaf.y + currentStage.trunkHeight}
              r={leaf.size / 2}
              fill={leaf.color}
            />
          ))}

          {/* Fruits */}
          {Array.from({ length: currentStage.fruits }).map((_, i) => {
            const angle = (i / currentStage.fruits) * Math.PI * 2;
            const radius = 15 + (i % 3) * 5;
            const fx = Math.cos(angle) * radius;
            const fy = 35 - currentStage.trunkHeight - 10 + Math.sin(angle) * 8;
            return (
              <motion.circle
                key={`fruit-${i}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 1 + i * 0.1 }}
                cx={fx}
                cy={fy}
                r="3"
                fill="#ef4444"
              />
            );
          })}

          {/* Glow effect for mature trees */}
          {stageIndex >= 3 && (
            <motion.circle
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 3, repeat: Infinity }}
              cx="0"
              cy={35 - currentStage.trunkHeight / 2}
              r="40"
              fill={currentStage.glow}
              filter="url(#glow)"
            />
          )}

          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </div>

      {/* Progress to next stage */}
      {nextStage && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              Next: {nextStage.name}
            </span>
            <span className={`text-[10px] font-bold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
              {totalProgress}/{nextStage.minTasks}
            </span>
          </div>
          <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
            <motion.div
              className="h-full rounded-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressToNext}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {stageIndex >= 3 && (
        <p className={`text-center text-[10px] mt-3 italic ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
          Your tree is thriving! Keep growing it.
        </p>
      )}
    </div>
  );
};
