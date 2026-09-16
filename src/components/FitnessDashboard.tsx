import React, { useState, useMemo } from 'react';
import {
  FitnessStats,
  FitnessEntry,
  UserProfile,
  MuscleGroup,
  Rank,
  WorkoutMood,
} from '../types';
import {
  getRankInfo,
  getProgressToNextRank,
  getFormattedVolume,
  getMuscleGroupStats,
  getWeeklyVolumeData,
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUP_COLORS,
  MUSCLE_GROUP_ICONS,
  ALL_EXERCISES,
  getWorkoutHeatmapData,
  getUnlockedAchievements,
  getMuscleBalanceScore,
  getBestTimeToTrain,
  getFatigueScore,
  getMonthlySummary,
  getExerciseSubstitutions,
  ACHIEVEMENTS,
  RANKS,
  getWeeklyGoalProgress,
  getTodaysFocus,
  getTrainingConsistency,
  getMuscleImbalances,
  getVolumeMilestones,
  getAverageWorkoutDuration,
  getWeeklyComparison,
  getMoodTrend,
  getActiveDaysData,
  calculateTotalVolume,
} from '../utils/fitness';
import {
  Flame,
  Trophy,
  Target,
  Zap,
  Calendar,
  Dumbbell,
  Plus,
  BarChart3,
  Medal,
  Clock,
  Award,
  Activity,
  Brain,
  Sun,
  ArrowRight,
  Lightbulb,
  Timer,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Hash,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { haptic } from '../utils/haptics';

interface FitnessDashboardProps {
  theme: 'dark' | 'light';
  stats: FitnessStats;
  userProfile: UserProfile;
  entries: FitnessEntry[];
  onOpenLogModal: () => void;
  onSelectExercise: (exerciseId: string) => void;
  onDeleteEntry?: (entryId: string) => void;
}

type DashboardTab = 'overview' | 'progress' | 'achievements' | 'insights';

const TABS: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
  { id: 'progress', label: 'Progress', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'achievements', label: 'Awards', icon: <Award className="w-4 h-4" /> },
  { id: 'insights', label: 'Insights', icon: <Brain className="w-4 h-4" /> },
];

const MOOD_EMOJI: Record<WorkoutMood, string> = {
  energized: '⚡',
  great: '🔥',
  good: '👍',
  tired: '😅',
  exhausted: '💀',
};

export const FitnessDashboard: React.FC<FitnessDashboardProps> = ({
  theme,
  stats,
  userProfile,
  entries,
  onOpenLogModal,
  onSelectExercise,
  onDeleteEntry,
}) => {
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  const convertWeight = (weight: number, fromUnit: 'kg' | 'lbs'): number => {
    if (fromUnit === userProfile.weightUnit) return weight;
    if (fromUnit === 'kg' && userProfile.weightUnit === 'lbs') return Math.round(weight * 2.205);
    if (fromUnit === 'lbs' && userProfile.weightUnit === 'kg') return Math.round(weight / 2.205);
    return weight;
  };

  const safeStats = {
    ...stats,
    muscleRanks: stats.muscleRanks || {} as Record<MuscleGroup, { xp: number; rank: Rank }>,
  };
  const rankInfo = getRankInfo(safeStats.rank);
  const progress = getProgressToNextRank(safeStats.xp);
  const muscleStats = getMuscleGroupStats(safeStats);
  const weeklyData = getWeeklyVolumeData(safeStats);

  const recentEntries = [...entries]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const topExercises = (Object.entries(stats.exerciseHistory) as [string, { date: string; volume: number; oneRepMax: number }[]][])
    .map(([id, history]) => ({
      exercise: ALL_EXERCISES.find((e) => e.id === id),
      count: history.length,
      lastDate: history[history.length - 1]?.date,
    }))
    .filter((e) => e.exercise)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Computed data for new features
  const heatmapData = getWorkoutHeatmapData(entries);
  const unlockedAchievements = getUnlockedAchievements(safeStats);
  const lockedAchievements = ACHIEVEMENTS.filter(a => !unlockedAchievements.find(u => u.id === a.id));
  const muscleBalance = getMuscleBalanceScore(safeStats);
  const bestTimes = getBestTimeToTrain(entries);
  const fatigueScore = getFatigueScore(entries);
  const monthlySummary = getMonthlySummary(entries);
  const weeklyGoal = getWeeklyGoalProgress(entries, userProfile.goals?.includes('endurance') ? 5 : 4);
  const todaysFocus = getTodaysFocus(entries);
  const consistency = getTrainingConsistency(entries);
  const imbalances = getMuscleImbalances(safeStats);
  const volumeMilestones = getVolumeMilestones(stats.totalVolume);
  const avgDuration = getAverageWorkoutDuration(entries);
  const weeklyComparison = getWeeklyComparison(entries);
  const moodTrend = getMoodTrend(entries);
  const activeDays = getActiveDaysData(entries);

  // Muscle data for balance visualization
  const allMuscles: MuscleGroup[] = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core'];
  const muscleRadarData = allMuscles.map(m => {
    const rankData = safeStats.muscleRanks[m];
    const rankIdx = rankData ? RANKS.findIndex(r => r.rank === rankData.rank) : 0;
    return { muscle: m, label: MUSCLE_GROUP_LABELS[m], icon: MUSCLE_GROUP_ICONS[m], rankIdx, xp: rankData?.xp || 0 };
  });
  const maxRankIdx = Math.max(...muscleRadarData.map(m => m.rankIdx), 1);

  return (
    <div className="space-y-4 pb-24">
      {/* Hero Rank Card */}
      <div className={`rounded-2xl p-5 border relative overflow-hidden liquid-glass-card ${
        isLight
          ? 'bg-gradient-to-br from-amber-50/80 to-orange-50/80 border-amber-200/50'
          : 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20'
      }`}>
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-30"
          style={{ background: rankInfo.color }} />
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg relative"
            style={{ background: `${rankInfo.color}20`, border: `2px solid ${rankInfo.color}40`, boxShadow: `0 0 20px ${rankInfo.color}30` }}>
            <span className="drop-shadow-lg">{rankInfo.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold uppercase tracking-wider truncate"
                style={{ color: rankInfo.color }}>
                {rankInfo.rank}
              </span>
              <Medal className="w-3.5 h-3.5 shrink-0" style={{ color: rankInfo.color }} />
            </div>
            <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
              {stats.xp} XP Total
            </p>
            {progress.nextRank && (
              <div className="mt-2">
                <div className={`h-1.5 rounded-full overflow-hidden liquid-glass-subtle`}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress.percent}%`, background: rankInfo.color }} />
                </div>
                <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                  {progress.current}/{progress.needed} XP to {progress.nextRank.rank}
                </p>
              </div>
            )}
          </div>
        </div>
        {/* Quick Log CTA */}
        <button
          onClick={onOpenLogModal}
          className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-sm shadow-lg shadow-amber-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Log Workout
        </button>
      </div>

      {/* Tab Navigation */}
      <div className={`flex gap-1 p-1 rounded-xl ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { haptic.lightTap(); setActiveTab(tab.id); }}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id
                ? isLight
                  ? 'text-amber-600'
                  : 'text-amber-400'
                : isLight
                  ? 'text-slate-500 hover:text-slate-700'
                  : 'text-white/50 hover:text-white/70'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeFitnessTab"
                className={`absolute inset-0 rounded-lg ${isLight ? 'bg-white shadow-sm' : 'bg-white/10'}`}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {tab.icon}
              <span>{tab.label}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Weekly Goal Ring + Today's Focus */}
          <div className="grid grid-cols-2 gap-3">
            {/* Weekly Goal */}
            <div className={`rounded-2xl p-4 border liquid-glass-card`}>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-emerald-400" />
                <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Weekly Goal
                </h3>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" strokeWidth="6" className={isLight ? 'stroke-slate-100' : 'stroke-white/5'} />
                    <circle
                      cx="50" cy="50" r="42" fill="none" strokeWidth="6" strokeLinecap="round"
                      stroke={weeklyGoal.percent >= 100 ? '#22c55e' : weeklyGoal.percent >= 50 ? '#f59e0b' : '#3b82f6'}
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - weeklyGoal.percent / 100)}`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{weeklyGoal.completed}</span>
                    <span className={`text-[9px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>/ {weeklyGoal.goal} days</span>
                  </div>
                </div>
              </div>
              <p className={`text-[10px] text-center mt-2 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                {weeklyGoal.percent >= 100 ? 'Goal reached!' : `${weeklyGoal.goal - weeklyGoal.completed} more to go`}
              </p>
            </div>

            {/* Today's Focus */}
            <div className={`rounded-2xl p-4 border liquid-glass-card`}>
              <div className="flex items-center gap-2 mb-3">
                <Sun className="w-4 h-4 text-orange-400" />
                <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Today's Focus
                </h3>
              </div>
              {todaysFocus ? (
                <div className="text-center">
                  <span className="text-3xl">{todaysFocus.icon}</span>
                  <p className={`text-sm font-bold mt-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {todaysFocus.label}
                  </p>
                  <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                    {todaysFocus.reason}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Dumbbell className={`w-8 h-8 mx-auto ${isLight ? 'text-slate-300' : 'text-white/20'}`} />
                  <p className={`text-[10px] mt-2 ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                    Log workouts to get suggestions
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2">
            <QuickStat
              icon={<Dumbbell className="w-3.5 h-3.5" />}
              value={stats.totalWorkouts.toString()}
              label="Workouts"
              color="#f59e0b"
              isLight={isLight}
            />
            <QuickStat
              icon={<Flame className="w-3.5 h-3.5" />}
              value={`${stats.currentStreak}d`}
              label="Streak"
              color="#ef4444"
              isLight={isLight}
            />
            <QuickStat
              icon={<TrendingUp className="w-3.5 h-3.5" />}
              value={getFormattedVolume(convertWeight(stats.totalVolume, stats.totalVolumeUnit), userProfile.weightUnit)}
              label="Volume"
              color="#3b82f6"
              isLight={isLight}
            />
            <QuickStat
              icon={<Timer className="w-3.5 h-3.5" />}
              value={avgDuration > 0 ? `${avgDuration}m` : '-'}
              label="Avg Time"
              color="#22c55e"
              isLight={isLight}
            />
          </div>

          {/* Weekly Comparison */}
          <div className={`rounded-2xl p-4 border liquid-glass-card`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  This Week vs Last
                </h3>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <CompareItem
                label="Volume"
                thisWeek={getFormattedVolume(weeklyComparison.thisWeek.volume, userProfile.weightUnit)}
                change={weeklyComparison.changes.volume}
                isLight={isLight}
              />
              <CompareItem
                label="Workouts"
                thisWeek={weeklyComparison.thisWeek.workouts.toString()}
                change={weeklyComparison.changes.workouts}
                isLight={isLight}
              />
              <CompareItem
                label="Sets"
                thisWeek={weeklyComparison.thisWeek.sets.toString()}
                change={weeklyComparison.changes.sets}
                isLight={isLight}
              />
            </div>
          </div>

          {/* Active Days Heatmap (Last 30 Days) */}
          <div className={`rounded-2xl p-4 border liquid-glass-card`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Last 30 Days
                </h3>
              </div>
              <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                {activeDays.filter(d => d.count > 0).length} active days
              </span>
            </div>
            <div className="flex gap-[3px] flex-wrap">
              {activeDays.map((day) => {
                const intensity = day.count === 0 ? 0 : day.count === 1 ? 1 : 2;
                const colors = isLight
                  ? ['bg-slate-100', 'bg-emerald-200', 'bg-emerald-500']
                  : ['bg-white/5', 'bg-emerald-500/30', 'bg-emerald-500'];
                return (
                  <div
                    key={day.date}
                    className={`w-3 h-3 rounded-[3px] ${colors[intensity]} transition-colors`}
                    title={`${day.date}: ${day.count} workout${day.count !== 1 ? 's' : ''}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Consistency Score */}
          <div className={`rounded-2xl p-4 border liquid-glass-card`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Training Consistency
                </h3>
              </div>
              <span className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {consistency}%
              </span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${consistency}%`,
                  background: consistency >= 80 ? '#22c55e' : consistency >= 50 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
            <p className={`text-[10px] mt-2 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
              {consistency >= 80 ? 'Excellent consistency!' : consistency >= 50 ? 'Good, keep it up' : 'Try to train more regularly'}
            </p>
          </div>

          {/* Quick Exercise Shortcuts */}
          {topExercises.length > 0 && (
            <div className={`rounded-2xl p-4 border liquid-glass-card`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Quick Log
                  </h3>
                </div>
                <button
                  onClick={onOpenLogModal}
                  className={`text-[10px] font-semibold ${isLight ? 'text-amber-600 hover:text-amber-700' : 'text-amber-400 hover:text-amber-300'}`}
                >
                  View All →
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {topExercises.slice(0, 4).map(({ exercise, count, lastDate }, i) => (
                  <button
                    key={i}
                    onClick={() => exercise && onSelectExercise(exercise.id)}
                    className={`flex flex-col p-3 rounded-xl text-left transition-all active:scale-[0.97] ${
                      isLight
                        ? 'bg-gradient-to-br from-slate-50 to-white border border-slate-100 hover:shadow-md'
                        : 'bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/[0.06] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-lg">{MUSCLE_GROUP_ICONS[exercise?.muscleGroup || 'chest']}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        isLight ? 'bg-amber-100 text-amber-600' : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        #{i + 1}
                      </span>
                    </div>
                    <span className={`text-xs font-semibold truncate ${isLight ? 'text-slate-800' : 'text-white/80'}`}>
                      {exercise?.name}
                    </span>
                    <span className={`text-[9px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                      {count}x logged
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {recentEntries.length > 0 && (
            <div className={`rounded-2xl p-4 border liquid-glass-card`}>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-green-400" />
                <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Recent Activity
                </h3>
              </div>
              <div className="space-y-2">
                {recentEntries.map((entry) => {
                  const entryVolume = calculateTotalVolume(entry.sets);
                  const completedSets = entry.sets.filter(s => s.completed).length;
                  return (
                    <div key={entry.id}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                        isLight ? 'bg-slate-50 hover:bg-slate-100' : 'bg-white/5 hover:bg-white/[0.07]'
                      }`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isLight ? 'bg-white shadow-sm' : 'bg-white/[0.06]'
                        }`}>
                          <span className="text-sm">{MUSCLE_GROUP_ICONS[entry.muscleGroup]}</span>
                        </div>
                        <div className="min-w-0">
                          <span className={`text-xs font-semibold block truncate ${isLight ? 'text-slate-800' : 'text-white/80'}`}>
                            {entry.exerciseName}
                          </span>
                          <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                            {completedSets} sets · {entryVolume > 0 ? `${entryVolume.toLocaleString()} ${entry.weightUnit || 'kg'}` : 'BW'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {entry.mood && <span className="text-xs">{MOOD_EMOJI[entry.mood]}</span>}
                        <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                          {new Date(entry.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                        </span>
                        {onDeleteEntry && (
                          <button
                            onClick={() => onDeleteEntry(entry.id)}
                            className={`p-1 rounded-lg cursor-pointer ${isLight ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-white/20 hover:text-red-400 hover:bg-red-500/10'}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Muscle Group Radar Chart */}
          <div className={`rounded-2xl p-4 border liquid-glass-card`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" />
                <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Muscle Balance
                </h3>
              </div>
              <span className={`text-[10px] font-bold ${muscleBalance >= 80 ? 'text-green-400' : muscleBalance >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                {muscleBalance}%
              </span>
            </div>
            {/* Spider/Radar Chart */}
            <div className="flex items-center justify-center py-2">
              <svg viewBox="0 0 200 200" className="w-40 h-40">
                {[1, 0.75, 0.5, 0.25].map(scale => (
                  <circle key={scale} cx="100" cy="100" r={80 * scale} fill="none"
                    stroke={isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)'} strokeWidth="1" />
                ))}
                {muscleRadarData.map((_, i) => {
                  const angle = (i * 2 * Math.PI / muscleRadarData.length) - Math.PI / 2;
                  return (
                    <line key={i} x1="100" y1="100"
                      x2={100 + 80 * Math.cos(angle)} y2={100 + 80 * Math.sin(angle)}
                      stroke={isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)'} strokeWidth="1" />
                  );
                })}
                <polygon
                  points={muscleRadarData.map((m, i) => {
                    const angle = (i * 2 * Math.PI / muscleRadarData.length) - Math.PI / 2;
                    const r = (m.rankIdx / maxRankIdx) * 80;
                    return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
                  }).join(' ')}
                  fill="rgba(200,255,0,0.15)" stroke="#c8ff00" strokeWidth="2"
                />
                {muscleRadarData.map((m, i) => {
                  const angle = (i * 2 * Math.PI / muscleRadarData.length) - Math.PI / 2;
                  const r = (m.rankIdx / maxRankIdx) * 80;
                  return (
                    <circle key={i} cx={100 + r * Math.cos(angle)} cy={100 + r * Math.sin(angle)}
                      r="4" fill="#c8ff00" stroke={isLight ? '#fff' : '#121215'} strokeWidth="2" />
                  );
                })}
                {muscleRadarData.map((m, i) => {
                  const angle = (i * 2 * Math.PI / muscleRadarData.length) - Math.PI / 2;
                  return (
                    <text key={i} x={100 + 95 * Math.cos(angle)} y={100 + 95 * Math.sin(angle)}
                      textAnchor="middle" dominantBaseline="middle"
                      className={`text-[8px] font-semibold ${isLight ? 'fill-slate-500' : 'fill-white/40'}`}>
                      {m.icon}
                    </text>
                  );
                })}
              </svg>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {muscleRadarData.slice(0, 6).map((m) => (
                <span key={m.muscle} className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                  isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-white/60'
                }`}>
                  {m.icon} {m.label} Lv.{m.rankIdx}
                </span>
              ))}
            </div>
          </div>

          {/* Personal Record Celebrations */}
          {Object.keys(stats.personalRecords).length > 0 && (
            <div className={`rounded-2xl p-4 border liquid-glass-card`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Personal Records
                  </h3>
                </div>
                <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                  {Object.keys(stats.personalRecords).length} PRs
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(stats.personalRecords).slice(0, 4).map(([exerciseId, pr]) => {
                  const exercise = ALL_EXERCISES.find(e => e.id === exerciseId);
                  const isRecentPR = new Date(pr.date).getTime() > Date.now() - 7 * 86400000;
                  return (
                    <div key={exerciseId}
                      className={`relative p-2.5 rounded-xl overflow-hidden ${
                        isRecentPR
                          ? isLight ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200' : 'bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/20'
                          : isLight ? 'bg-slate-50' : 'bg-white/5'
                      }`}
                    >
                      {isRecentPR && <span className="absolute top-1 right-1 text-[8px]">🏆</span>}
                      <p className={`text-[10px] font-semibold truncate ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                        {exercise?.name || exerciseId}
                      </p>
                      <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {pr.weight} {userProfile.weightUnit} × {pr.reps}
                      </p>
                      <p className={`text-[9px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                        {new Date(pr.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Workout Streak Calendar */}
          <div className={`rounded-2xl p-4 border liquid-glass-card`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Streak Calendar
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {stats.currentStreak > 0 && (
                  <span className="text-[10px] font-bold text-orange-400">🔥 {stats.currentStreak}d</span>
                )}
                {stats.bestStreak > 0 && (
                  <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                    Best: {stats.bestStreak}d
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-[3px] flex-wrap">
              {Array.from({ length: 84 }).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (83 - i));
                const dateStr = d.toISOString().slice(0, 10);
                const count = entries.filter(e => e.date === dateStr).length;
                const intensity = count === 0 ? 0 : count === 1 ? 1 : 2;
                const colors = isLight
                  ? ['bg-slate-100', 'bg-orange-200', 'bg-orange-500']
                  : ['bg-white/5', 'bg-orange-500/30', 'bg-orange-500'];
                return (
                  <div key={i} className={`w-2.5 h-2.5 rounded-[3px] ${colors[intensity]}`}
                    title={`${dateStr}: ${count} workout${count !== 1 ? 's' : ''}`} />
                );
              })}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[9px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>Less</span>
              {(isLight ? ['bg-slate-100', 'bg-orange-200', 'bg-orange-500'] : ['bg-white/5', 'bg-orange-500/30', 'bg-orange-500']).map((c, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-[3px] ${c}`} />
              ))}
              <span className={`text-[9px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>More</span>
            </div>
          </div>

          {/* Progressive Overload Tracker */}
          {topExercises.length > 0 && (
            <div className={`rounded-2xl p-4 border liquid-glass-card`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Progressive Overload
                  </h3>
                </div>
              </div>
              <div className="space-y-2.5">
                {topExercises.slice(0, 3).map(({ exercise }) => {
                  if (!exercise) return null;
                  const history = stats.exerciseHistory[exercise.id] || [];
                  if (history.length < 2) return null;
                  const recent = history.slice(-3);
                  const latestVol = recent[recent.length - 1]?.volume || 0;
                  const prevVol = recent.length > 1 ? recent[recent.length - 2]?.volume : latestVol;
                  const change = prevVol > 0 ? ((latestVol - prevVol) / prevVol * 100) : 0;
                  const isUp = change > 0;
                  return (
                    <div key={exercise.id} className={`flex items-center gap-3 p-2.5 rounded-xl ${isLight ? 'bg-slate-50' : 'bg-white/5'}`}>
                      <span className="text-lg">{MUSCLE_GROUP_ICONS[exercise.muscleGroup]}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${isLight ? 'text-slate-800' : 'text-white/80'}`}>
                          {exercise.name}
                        </p>
                        <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                          {latestVol.toLocaleString()} vol
                        </p>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${
                        change === 0
                          ? isLight ? 'bg-gray-100 text-gray-500' : 'bg-white/5 text-white/30'
                          : isUp ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {change === 0 ? '—' : isUp ? '↑' : '↓'} {Math.abs(change).toFixed(0)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'progress' && (
        <div className="space-y-4">
          {/* Volume Trend */}
          {weeklyData.length > 0 && (
            <div className={`rounded-2xl p-4 border liquid-glass-card`}>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Volume Trend
                </h3>
              </div>
              <div className="flex items-end gap-1.5 h-28">
                {weeklyData.map((week, i) => {
                  const maxVol = Math.max(...weeklyData.map((w) => w.volume));
                  const height = maxVol > 0 ? (week.volume / maxVol) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className={`text-[8px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                        {getFormattedVolume(week.volume, userProfile.weightUnit)}
                      </span>
                      <div className="w-full rounded-t-md transition-all"
                        style={{
                          height: `${Math.max(height, 4)}%`,
                          background: isLight
                            ? 'linear-gradient(to top, #3b82f6, #60a5fa)'
                            : 'linear-gradient(to top, #3b82f680, #60a5fa80)',
                        }} />
                      <span className={`text-[9px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                        {week.week.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Muscle Distribution */}
          {muscleStats.length > 0 && (
            <div className={`rounded-2xl p-4 border liquid-glass-card`}>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-purple-400" />
                <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Muscle Distribution
                </h3>
              </div>
              <div className="space-y-2.5">
                {muscleStats.slice(0, 8).map(({ group, count, percent }) => (
                  <div key={group} className="flex items-center gap-3">
                    <span className="text-sm w-5">{MUSCLE_GROUP_ICONS[group]}</span>
                    <span className={`text-[11px] w-16 ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                      {MUSCLE_GROUP_LABELS[group]}
                    </span>
                    <div className={`flex-1 h-1.5 rounded-full overflow-hidden liquid-glass-subtle`}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${percent}%`, background: MUSCLE_GROUP_COLORS[group] }} />
                    </div>
                    <span className={`text-[10px] w-8 text-right ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                      {percent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Muscle Ranks */}
          <div className={`rounded-2xl p-4 border liquid-glass-card`}>
            <div className="flex items-center gap-2 mb-3">
              <Medal className="w-4 h-4 text-amber-400" />
              <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Muscle Ranks
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(safeStats.muscleRanks) as [MuscleGroup, { xp: number; rank: Rank }][])
                .filter(([, data]) => data.xp > 0)
                .sort(([, a], [, b]) => b.xp - a.xp)
                .map(([group, data]) => {
                  const muscleRankInfo = getRankInfo(data.rank);
                  const muscleProgress = getProgressToNextRank(data.xp);
                  return (
                    <div key={group}
                      className={`p-2.5 rounded-xl liquid-glass-subtle`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm">{MUSCLE_GROUP_ICONS[group]}</span>
                        <span className={`text-[10px] font-semibold truncate ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                          {MUSCLE_GROUP_LABELS[group]}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{muscleRankInfo.icon}</span>
                        <span className="text-[10px] font-bold truncate" style={{ color: muscleRankInfo.color }}>
                          {muscleRankInfo.rank}
                        </span>
                      </div>
                      <div className={`mt-1.5 h-1 rounded-full overflow-hidden liquid-glass-subtle`}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${muscleProgress.percent}%`, background: muscleRankInfo.color }} />
                      </div>
                      <p className={`text-[9px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                        {data.xp} XP
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* PR Timeline */}
          {Object.keys(stats.personalRecords).length > 0 && (
            <div className={`rounded-2xl p-4 border liquid-glass-card`}>
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Personal Records
                </h3>
              </div>
              <div className="relative pl-4 space-y-3">
                <div className={`absolute left-1.5 top-1 bottom-1 w-0.5 rounded-full ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />
                {(Object.entries(stats.personalRecords) as [string, { weight: number; reps: number; date: string }][])
                  .sort(([, a], [, b]) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5)
                  .map(([exerciseId, pr], i) => {
                    const exercise = ALL_EXERCISES.find(e => e.id === exerciseId);
                    return (
                      <div key={exerciseId} className="relative flex items-start gap-3">
                        <div className={`absolute -left-3 w-3 h-3 rounded-full border-2 ${
                          i === 0 ? 'bg-emerald-500 border-emerald-400' : isLight ? 'bg-white border-slate-300' : 'bg-[#121215] border-white/20'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{exercise?.name || exerciseId}</span>
                            {i === 0 && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-bold text-emerald-400">
                              {convertWeight(pr.weight, userProfile.weightUnit)} {userProfile.weightUnit} × {pr.reps}
                            </span>
                            <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                              {new Date(pr.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Monthly Summary */}
          {monthlySummary.length > 0 && (
            <div className={`rounded-2xl p-4 border liquid-glass-card`}>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Monthly Summary
                </h3>
              </div>
              <div className="space-y-2">
                {monthlySummary.slice(0, 4).map((month, i) => (
                  <div key={month.month} className={`flex items-center gap-3 p-2.5 rounded-xl ${i === 0 ? (isLight ? 'bg-blue-50' : 'bg-blue-500/10') : (isLight ? 'bg-slate-50' : 'bg-white/[0.03]')}`}>
                    <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 ${i === 0 ? 'bg-blue-500' : isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                      <span className={`text-[10px] font-bold ${i === 0 ? 'text-white' : isLight ? 'text-slate-600' : 'text-white/70'}`}>
                        {new Date(month.month + '-01').toLocaleDateString('en', { month: 'short' })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{month.workouts} workouts</span>
                        <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{getFormattedVolume(month.volume, userProfile.weightUnit)}</span>
                      </div>
                      <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>Top: {month.topExercise}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Volume Milestones */}
          <div className={`rounded-2xl p-4 border liquid-glass-card`}>
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-purple-400" />
              <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Volume Milestones
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {volumeMilestones.map((milestone) => (
                <div
                  key={milestone.threshold}
                  className={`p-2 rounded-xl text-center ${
                    milestone.achieved
                      ? isLight ? 'bg-purple-50 border border-purple-200' : 'bg-purple-500/10 border border-purple-500/20'
                      : isLight ? 'bg-slate-50 border border-slate-200 opacity-50' : 'bg-white/5 border border-white/10 opacity-50'
                  }`}
                >
                  <span className={`text-lg ${milestone.achieved ? '' : 'grayscale opacity-50'}`}>
                    {milestone.achieved ? '🏆' : '🔒'}
                  </span>
                  <p className={`text-[9px] font-semibold mt-1 ${milestone.achieved ? (isLight ? 'text-purple-700' : 'text-purple-300') : (isLight ? 'text-slate-400' : 'text-white/30')}`}>
                    {milestone.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Body Metrics Section */}
          <div className={`rounded-2xl p-4 border liquid-glass-card`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400" />
                <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Body Stats
                </h3>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-xl ${isLight ? 'bg-slate-50' : 'bg-white/5'}`}>
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                  Body Weight
                </p>
                <p className={`text-lg font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {userProfile.bodyWeight || '—'} <span className={`text-xs font-normal ${isLight ? 'text-slate-400' : 'text-white/30'}`}>{userProfile.weightUnit}</span>
                </p>
              </div>
              <div className={`p-3 rounded-xl ${isLight ? 'bg-slate-50' : 'bg-white/5'}`}>
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                  Height
                </p>
                <p className={`text-lg font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {userProfile.heightCm || '—'} <span className={`text-xs font-normal ${isLight ? 'text-slate-400' : 'text-white/30'}`}>cm</span>
                </p>
              </div>
              <div className={`p-3 rounded-xl ${isLight ? 'bg-slate-50' : 'bg-white/5'}`}>
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                  Total Volume
                </p>
                <p className={`text-lg font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {getFormattedVolume(convertWeight(stats.totalVolume, stats.totalVolumeUnit), userProfile.weightUnit)}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${isLight ? 'bg-slate-50' : 'bg-white/5'}`}>
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                  Est. 1RM Best
                </p>
                <p className={`text-lg font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {Object.values(stats.personalRecords).length > 0
                    ? Math.max(...Object.values(stats.personalRecords).map(pr => {
                        const w = convertWeight(pr.weight, stats.totalVolumeUnit);
                        return Math.round(w * (1 + pr.reps / 30));
                      }))
                    : '—'
                  } <span className={`text-xs font-normal ${isLight ? 'text-slate-400' : 'text-white/30'}`}>{userProfile.weightUnit}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Workout Frequency by Day */}
          <div className={`rounded-2xl p-4 border liquid-glass-card`}>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Workout Days
              </h3>
            </div>
            <div className="flex items-end justify-between gap-1 h-20">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                const dayEntries = entries.filter(e => {
                  const d = new Date(e.date);
                  return d.getDay() === (i + 1) % 7;
                });
                const maxDay = Math.max(...['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((_, j) =>
                  entries.filter(e => new Date(e.date).getDay() === (j + 1) % 7).length
                ), 1);
                const height = (dayEntries.length / maxDay) * 100;
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    <span className={`text-[8px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                      {dayEntries.length}
                    </span>
                    <div className={`w-full rounded-t-md ${isLight ? 'bg-emerald-400' : 'bg-emerald-500/60'}`}
                      style={{ height: `${Math.max(height, 8)}%` }} />
                    <span className={`text-[8px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>{day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exercise Variety Score */}
          <div className={`rounded-2xl p-4 border liquid-glass-card`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-cyan-400" />
                <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Exercise Variety
                </h3>
              </div>
              <span className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {Object.keys(stats.exerciseHistory).length}
              </span>
            </div>
            <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
              Different exercises logged out of {59} available
            </p>
            <div className={`h-1.5 rounded-full mt-2 overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-400"
                style={{ width: `${(Object.keys(stats.exerciseHistory).length / 59) * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="space-y-4">
          {/* Achievement Progress */}
          <div className={`rounded-2xl p-4 border liquid-glass-card`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Achievements
                </h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {unlockedAchievements.length}/{ACHIEVEMENTS.length}
              </span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden mb-4 ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000"
                style={{ width: `${(unlockedAchievements.length / ACHIEVEMENTS.length) * 100}%` }}
              />
            </div>

            {/* Unlocked */}
            {unlockedAchievements.length > 0 && (
              <div className="mb-4">
                <p className={`text-[10px] font-medium mb-2 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>UNLOCKED</p>
                <div className="grid grid-cols-3 gap-2">
                  {unlockedAchievements.map(a => (
                    <div key={a.id} className={`p-3 rounded-xl text-center ${
                      isLight ? 'bg-amber-50 border border-amber-200/50' : 'bg-amber-500/10 border border-amber-500/20'
                    }`}>
                      <span className="text-2xl">{a.icon}</span>
                      <p className={`text-[10px] font-semibold mt-1 leading-tight ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
                        {a.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Locked */}
            {lockedAchievements.length > 0 && (
              <div>
                <p className={`text-[10px] font-medium mb-2 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>LOCKED</p>
                <div className="space-y-2">
                  {lockedAchievements.slice(0, 8).map(a => (
                    <div key={a.id} className={`flex items-center gap-3 p-2.5 rounded-xl ${isLight ? 'bg-slate-50' : 'bg-white/[0.03]'}`}>
                      <span className="text-lg grayscale opacity-40">{a.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] font-semibold ${isLight ? 'text-slate-700' : 'text-white/70'}`}>{a.name}</p>
                        <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>{a.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rank Badges */}
          <div className={`rounded-2xl p-4 border liquid-glass-card`}>
            <div className="flex items-center gap-2 mb-3">
              <Medal className="w-4 h-4 text-amber-400" />
              <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Rank Progress
              </h3>
            </div>
            <div className="space-y-1.5">
              {RANKS.filter(r => r.minXP <= stats.xp + 5000).slice(-8).map((rank, i) => {
                const isCurrent = rank.rank === safeStats.rank;
                const isAchieved = stats.xp >= rank.minXP;
                return (
                  <div
                    key={rank.rank}
                    className={`flex items-center gap-3 p-2 rounded-xl ${
                      isCurrent
                        ? isLight ? 'bg-amber-50 border border-amber-200' : 'bg-amber-500/10 border border-amber-500/20'
                        : isLight ? 'bg-slate-50' : 'bg-white/[0.03]'
                    }`}
                  >
                    <span className="text-lg">{rank.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-semibold ${isCurrent ? 'text-amber-500' : isAchieved ? (isLight ? 'text-slate-700' : 'text-white/70') : (isLight ? 'text-slate-400' : 'text-white/30')}`}>
                        {rank.rank}
                      </p>
                    </div>
                    <span className={`text-[10px] ${isAchieved ? 'text-emerald-400' : (isLight ? 'text-slate-400' : 'text-white/30')}`}>
                      {isAchieved ? '✓' : `${rank.minXP} XP`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-4">
          {/* Recovery + Balance */}
          <div className="grid grid-cols-2 gap-3">
            {/* Recovery Score */}
            <div className={`rounded-2xl p-4 border liquid-glass-card`}>
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-violet-400" />
                <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Recovery
                </h3>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-20 h-20">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" strokeWidth="6" className={isLight ? 'stroke-slate-100' : 'stroke-white/5'} />
                    <circle
                      cx="50" cy="50" r="42" fill="none" strokeWidth="6" strokeLinecap="round"
                      stroke={fatigueScore <= 30 ? '#22c55e' : fatigueScore <= 60 ? '#f59e0b' : '#ef4444'}
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - (100 - fatigueScore) / 100)}`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{100 - fatigueScore}%</span>
                    <span className={`text-[8px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>recovered</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Muscle Balance */}
            <div className={`rounded-2xl p-4 border liquid-glass-card`}>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Balance
                </h3>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-20 h-20">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" strokeWidth="6" className={isLight ? 'stroke-slate-100' : 'stroke-white/5'} />
                    <circle
                      cx="50" cy="50" r="42" fill="none" strokeWidth="6" strokeLinecap="round"
                      stroke={muscleBalance >= 80 ? '#22c55e' : muscleBalance >= 60 ? '#f59e0b' : '#ef4444'}
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - muscleBalance / 100)}`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{muscleBalance}%</span>
                    <span className={`text-[8px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>balance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Muscle Imbalances */}
          {imbalances.length > 0 && (
            <div className={`rounded-2xl p-4 border liquid-glass-card`}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Muscle Imbalances
                </h3>
              </div>
              <div className="space-y-2">
                {imbalances.map((imb) => (
                  <div key={imb.muscle} className={`flex items-center gap-3 p-2 rounded-xl ${isLight ? 'bg-amber-50' : 'bg-amber-500/10'}`}>
                    <span className="text-sm">{imb.icon}</span>
                    <span className={`text-xs font-medium flex-1 ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                      {imb.label}
                    </span>
                    <span className={`text-[10px] font-bold ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
                      -{imb.gap} ranks behind
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best Time to Train */}
          {bestTimes.length > 0 && (
            <div className={`rounded-2xl p-4 border liquid-glass-card`}>
              <div className="flex items-center gap-2 mb-3">
                <Sun className="w-4 h-4 text-orange-400" />
                <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Best Time to Train
                </h3>
              </div>
              <div className="flex items-end gap-1.5 h-16">
                {bestTimes.map((slot, i) => {
                  const maxVol = Math.max(...bestTimes.map(s => s.avgVolume));
                  const height = maxVol > 0 ? (slot.avgVolume / maxVol) * 100 : 0;
                  const isTop = i === 0;
                  return (
                    <div key={slot.slot} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`w-full rounded-t-md transition-all ${isTop ? 'bg-gradient-to-t from-orange-500 to-amber-400' : isLight ? 'bg-slate-200' : 'bg-white/10'}`}
                        style={{ height: `${Math.max(height, 8)}%` }} />
                      <span className={`text-[8px] text-center leading-tight ${isTop ? (isLight ? 'text-orange-600 font-bold' : 'text-orange-400 font-bold') : (isLight ? 'text-slate-400' : 'text-white/30')}`}>
                        {slot.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className={`text-[10px] text-center mt-2 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                Peak performance at {bestTimes[0]?.label}
              </p>
            </div>
          )}

          {/* Mood Trend */}
          {moodTrend.length > 0 && (
            <div className={`rounded-2xl p-4 border liquid-glass-card`}>
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-pink-400" />
                <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Mood Trend
                </h3>
              </div>
              <div className="space-y-2">
                {moodTrend.map((m) => (
                  <div key={m.mood} className="flex items-center gap-3">
                    <span className="text-sm w-6">{MOOD_EMOJI[m.mood]}</span>
                    <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all"
                        style={{ width: `${m.percent}%` }}
                      />
                    </div>
                    <span className={`text-[10px] w-8 text-right ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                      {m.percent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Training Load */}
          {entries.length > 5 && (
            <div className={`rounded-2xl p-4 border liquid-glass-card`}>
              <div className="flex items-center gap-2 mb-3">
                <Timer className="w-4 h-4 text-rose-400" />
                <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Training Load
                </h3>
              </div>
              {(() => {
                const last7 = entries.filter(e => (Date.now() - new Date(e.date).getTime()) < 7 * 86400000);
                const prev7 = entries.filter(e => {
                  const d = new Date(e.date).getTime();
                  return d >= Date.now() - 14 * 86400000 && d < Date.now() - 7 * 86400000;
                });
                const thisWeekVol = last7.reduce((s, e) => s + e.totalVolume, 0);
                const lastWeekVol = prev7.reduce((s, e) => s + e.totalVolume, 0);
                const volChange = lastWeekVol > 0 ? Math.round(((thisWeekVol - lastWeekVol) / lastWeekVol) * 100) : 0;
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>This week volume</span>
                      <span className={`text-[11px] font-bold ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                        {getFormattedVolume(thisWeekVol, userProfile.weightUnit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>vs last week</span>
                      <span className={`text-[11px] font-bold ${volChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {volChange >= 0 ? '+' : ''}{volChange}%
                      </span>
                    </div>
                    <div className={`mt-1 p-2 rounded-lg text-[10px] text-center ${
                      volChange > 20 ? (isLight ? 'bg-red-50 text-red-600' : 'bg-red-500/10 text-red-400') :
                      volChange > 10 ? (isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400') :
                      volChange >= -10 ? (isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400') :
                      (isLight ? 'bg-slate-50 text-slate-500' : 'bg-white/5 text-white/40')
                    }`}>
                      {volChange > 20 ? 'High volume spike — watch for overtraining' :
                       volChange > 10 ? 'Progressive overload — good progress' :
                       volChange >= -10 ? 'Consistent training — keep it up' :
                       'Volume drop — consider increasing load'}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Exercise Substitutions */}
          {topExercises.length > 0 && topExercises[0].exercise && (
            <div className={`rounded-2xl p-4 border liquid-glass-card`}>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Try These Instead
                </h3>
              </div>
              <p className={`text-[10px] mb-2 ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                Alternatives for {topExercises[0].exercise.name}:
              </p>
              <div className="space-y-1.5">
                {getExerciseSubstitutions(topExercises[0].exercise.id).map((sub, i) => (
                  <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-white/[0.03]'}`}>
                    <ArrowRight className="w-3 h-3 text-yellow-400 shrink-0" />
                    <div className="flex-1">
                      <span className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-white/70'}`}>{sub.name}</span>
                      <span className={`text-[10px] ml-1.5 ${isLight ? 'text-slate-400' : 'text-white/30'}`}>{sub.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workout Split Suggestion */}
          <div className={`rounded-2xl p-4 border liquid-glass-card`}>
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-indigo-400" />
              <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Suggested Split
              </h3>
            </div>
            <div className="space-y-2">
              {[
                { day: 'Push', muscles: 'Chest, Shoulders, Triceps', icon: '💪', color: 'text-red-400' },
                { day: 'Pull', muscles: 'Back, Biceps', icon: '🦾', color: 'text-blue-400' },
                { day: 'Legs', muscles: 'Quads, Hamstrings, Glutes', icon: '🦵', color: 'text-green-400' },
              ].map((split) => (
                <div key={split.day} className={`flex items-center gap-3 p-2.5 rounded-xl ${isLight ? 'bg-slate-50' : 'bg-white/5'}`}>
                  <span className="text-lg">{split.icon}</span>
                  <div className="flex-1">
                    <p className={`text-xs font-bold ${split.color}`}>{split.day}</p>
                    <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>{split.muscles}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className={`text-[10px] mt-2 ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
              Based on your training frequency and muscle balance
            </p>
          </div>

          {/* Weekly Summary Card */}
          <div className={`rounded-2xl p-4 border liquid-glass-card bg-gradient-to-br ${isLight ? 'from-blue-50/50 to-indigo-50/50 border-blue-200/50' : 'from-blue-500/5 to-indigo-500/5 border-blue-500/10'}`}>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                This Week's Summary
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {weeklyComparison.thisWeek.workouts}
                </p>
                <p className={`text-[9px] font-semibold ${isLight ? 'text-slate-400' : 'text-white/30'}`}>Workouts</p>
                {weeklyComparison.changes.workouts !== 0 && (
                  <span className={`text-[9px] font-bold ${weeklyComparison.changes.workouts > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {weeklyComparison.changes.workouts > 0 ? '+' : ''}{weeklyComparison.changes.workouts}%
                  </span>
                )}
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {weeklyComparison.thisWeek.sets}
                </p>
                <p className={`text-[9px] font-semibold ${isLight ? 'text-slate-400' : 'text-white/30'}`}>Sets</p>
                {weeklyComparison.changes.sets !== 0 && (
                  <span className={`text-[9px] font-bold ${weeklyComparison.changes.sets > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {weeklyComparison.changes.sets > 0 ? '+' : ''}{weeklyComparison.changes.sets}%
                  </span>
                )}
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {getFormattedVolume(weeklyComparison.thisWeek.volume, userProfile.weightUnit)}
                </p>
                <p className={`text-[9px] font-semibold ${isLight ? 'text-slate-400' : 'text-white/30'}`}>Volume</p>
                {weeklyComparison.changes.volume !== 0 && (
                  <span className={`text-[9px] font-bold ${weeklyComparison.changes.volume > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {weeklyComparison.changes.volume > 0 ? '+' : ''}{weeklyComparison.changes.volume}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Recovery Tips */}
          <div className={`rounded-2xl p-4 border liquid-glass-card`}>
            <div className="flex items-center gap-2 mb-3">
              <Sun className="w-4 h-4 text-amber-400" />
              <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Recovery Tips
              </h3>
            </div>
            <div className="space-y-2">
              {fatigueScore > 70 && (
                <div className={`flex items-start gap-2 p-2.5 rounded-xl ${isLight ? 'bg-red-50' : 'bg-red-500/5'}`}>
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                  <p className={`text-[11px] ${isLight ? 'text-red-600' : 'text-red-300'}`}>
                    High fatigue detected. Consider a deload day or lighter session.
                  </p>
                </div>
              )}
              {fatigueScore < 30 && (
                <div className={`flex items-start gap-2 p-2.5 rounded-xl ${isLight ? 'bg-green-50' : 'bg-green-500/5'}`}>
                  <Zap className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                  <p className={`text-[11px] ${isLight ? 'text-green-600' : 'text-green-300'}`}>
                    You're well recovered! Great time for an intense session.
                  </p>
                </div>
              )}
              <div className={`flex items-start gap-2 p-2.5 rounded-xl ${isLight ? 'bg-blue-50' : 'bg-blue-500/5'}`}>
                <Timer className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                <p className={`text-[11px] ${isLight ? 'text-blue-600' : 'text-blue-300'}`}>
                  Aim for 7-9 hours of sleep for optimal muscle recovery.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.totalWorkouts === 0 && (
        <div className={`text-center py-12 rounded-2xl border liquid-glass-card`}>
          <Dumbbell className={`w-12 h-12 mx-auto mb-3 ${isLight ? 'text-slate-300' : 'text-white/20'}`} />
          <p className={`text-sm font-medium ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
            No workouts logged yet
          </p>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
            Tap "Log Workout" to start tracking your training
          </p>
        </div>
      )}
    </div>
  );
};

// Mini stat component for quick stats row
function QuickStat({
  icon,
  value,
  label,
  color,
  isLight,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
  isLight: boolean;
}) {
  return (
    <div className={`rounded-xl p-2.5 border liquid-glass-card text-center`}>
      <div className="flex items-center justify-center mb-1" style={{ color }}>
        {icon}
      </div>
      <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
        {value}
      </p>
      <p className={`text-[9px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
        {label}
      </p>
    </div>
  );
}

// Weekly comparison item
function CompareItem({
  label,
  thisWeek,
  change,
  isLight,
}: {
  label: string;
  thisWeek: string;
  change: number;
  isLight: boolean;
}) {
  return (
    <div className={`p-2.5 rounded-xl ${isLight ? 'bg-slate-50' : 'bg-white/5'}`}>
      <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{label}</p>
      <p className={`text-sm font-bold mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>{thisWeek}</p>
      <div className="flex items-center gap-0.5 mt-0.5">
        {change > 0 ? (
          <TrendingUp className="w-3 h-3 text-emerald-400" />
        ) : change < 0 ? (
          <TrendingDown className="w-3 h-3 text-red-400" />
        ) : (
          <Minus className="w-3 h-3 text-slate-400" />
        )}
        <span className={`text-[10px] font-bold ${change > 0 ? 'text-emerald-400' : change < 0 ? 'text-red-400' : 'text-slate-400'}`}>
          {change > 0 ? '+' : ''}{change}%
        </span>
      </div>
    </div>
  );
}
