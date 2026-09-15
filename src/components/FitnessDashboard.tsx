import React from 'react';
import {
  FitnessStats,
  FitnessEntry,
  UserProfile,
  MuscleGroup,
  Rank,
  Achievement,
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
} from '../utils/fitness';
import {
  TrendingUp,
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
  Hash,
  Award,
  Activity,
  Brain,
  Sun,
  ArrowRight,
  Lightbulb,
  Timer,
  Star,
  ChevronRight,
} from 'lucide-react';

interface FitnessDashboardProps {
  theme: 'dark' | 'light';
  stats: FitnessStats;
  userProfile: UserProfile;
  entries: FitnessEntry[];
  onOpenLogModal: () => void;
  onSelectExercise: (exerciseId: string) => void;
}

export const FitnessDashboard: React.FC<FitnessDashboardProps> = ({
  theme,
  stats,
  userProfile,
  entries,
  onOpenLogModal,
  onSelectExercise,
}) => {
  const isLight = theme === 'light';

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

  // New computed data for enhanced features
  const heatmapData = getWorkoutHeatmapData(entries);
  const unlockedAchievements = getUnlockedAchievements(safeStats);
  const lockedAchievements = ACHIEVEMENTS.filter(a => !unlockedAchievements.find(u => u.id === a.id)).slice(0, 5);
  const muscleBalance = getMuscleBalanceScore(safeStats);
  const bestTimes = getBestTimeToTrain(entries);
  const fatigueScore = getFatigueScore(entries);
  const monthlySummary = getMonthlySummary(entries);

  // Muscle balance data for radar-style display
  const muscleGroups: MuscleGroup[] = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core'];
  const muscleRadarData = muscleGroups.map(m => {
    const rankData = safeStats.muscleRanks[m];
    const rankIdx = rankData ? RANKS.findIndex(r => r.rank === rankData.rank) : 0;
    return { muscle: m, label: MUSCLE_GROUP_LABELS[m], icon: MUSCLE_GROUP_ICONS[m], rankIdx, xp: rankData?.xp || 0 };
  });
  const maxRankIdx = Math.max(...muscleRadarData.map(m => m.rankIdx), 1);

  return (
    <div className="space-y-5 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Fitness Dashboard
          </h1>
          <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
            Track your training, grow your rank
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenLogModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-sm shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Log Workout</span>
          </button>
        </div>
      </div>

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
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<Dumbbell className="w-4.5 h-4.5" />}
          label="Workouts"
          value={stats.totalWorkouts.toString()}
          color="#f59e0b"
          isLight={isLight}
        />
        <StatCard
          icon={<Flame className="w-4.5 h-4.5" />}
          label="Streak"
          value={`${stats.currentStreak}d`}
          sub={stats.bestStreak > 0 ? `Best: ${stats.bestStreak}d` : undefined}
          color="#ef4444"
          isLight={isLight}
        />
        <StatCard
          icon={<TrendingUp className="w-4.5 h-4.5" />}
          label="Volume"
          value={getFormattedVolume(convertWeight(stats.totalVolume, stats.totalVolumeUnit), userProfile.weightUnit)}
          color="#3b82f6"
          isLight={isLight}
        />
        <StatCard
          icon={<Hash className="w-4.5 h-4.5" />}
          label="Total Sets"
          value={stats.totalSets.toString()}
          color="#22c55e"
          isLight={isLight}
        />
      </div>


      {muscleStats.length > 0 && (
        <div className={`rounded-2xl p-4 border liquid-glass-card`}>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-purple-400" />
            <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Muscle Group Distribution
            </h3>
          </div>
          <div className="space-y-2">
            {muscleStats.slice(0, 6).map(({ group, count, percent }) => (
              <div key={group} className="flex items-center gap-3">
                <span className="text-sm w-5">{MUSCLE_GROUP_ICONS[group]}</span>
                <span className={`text-xs w-20 ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                  {MUSCLE_GROUP_LABELS[group]}
                </span>
                <div className={`flex-1 h-1.5 rounded-full overflow-hidden liquid-glass-subtle`}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${percent}%`, background: MUSCLE_GROUP_COLORS[group] }} />
                </div>
                <span className={`text-[11px] w-8 text-right ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                  {percent}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-Muscle Ranks */}
      <div className={`rounded-2xl p-4 border liquid-glass-card`}>
        <div className="flex items-center gap-2 mb-3">
          <Medal className="w-4 h-4 text-amber-400" />
          <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Muscle Ranks
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
          {(Object.entries(safeStats.muscleRanks) as [MuscleGroup, { xp: number; rank: Rank }][])
            .filter(([, data]) => data.xp === 0).length > 0 && (
            <div className={`p-2.5 rounded-xl border border-dashed liquid-glass-subtle`}>
              <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                Train more muscles to unlock their ranks
              </p>
            </div>
          )}
        </div>
      </div>

      {weeklyData.length > 0 && (
        <div className={`rounded-2xl p-4 border liquid-glass-card`}>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Weekly Volume Trend
            </h3>
          </div>
          <div className="flex items-end gap-1.5 h-24">
            {weeklyData.map((week, i) => {
              const maxVol = Math.max(...weeklyData.map((w) => w.volume));
              const height = maxVol > 0 ? (week.volume / maxVol) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${Math.max(height, 4)}%`,
                      background: isLight
                        ? 'linear-gradient(to top, #f59e0b, #fb923c)'
                        : 'linear-gradient(to top, #f59e0b80, #fb923c80)',
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

      {topExercises.length > 0 && (
        <div className={`rounded-2xl p-4 border liquid-glass-card`}>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Most Trained
            </h3>
          </div>
          <div className="space-y-2">
            {topExercises.map(({ exercise, count }, i) => (
              <button
                key={i}
                onClick={() => exercise && onSelectExercise(exercise.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors text-left liquid-glass-subtle hover:bg-white/10 ${isLight ? 'hover:bg-white/70' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400 w-5">#{i + 1}</span>
                  <span className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                    {exercise?.name}
                  </span>
                </div>
                <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                  {count}x
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {recentEntries.length > 0 && (
        <div className={`rounded-2xl p-4 border liquid-glass-card`}>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-green-400" />
            <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Recent Workouts
            </h3>
          </div>
          <div className="space-y-2">
            {recentEntries.map((entry) => (
              <div key={entry.id}
                className={`p-3 rounded-xl liquid-glass-subtle`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-white/90'}`}>
                    {entry.exerciseName}
                  </span>
                  <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[11px] text-amber-400">
                    {entry.sets.filter((s) => s.completed).length} sets
                  </span>
                  <span className="text-[11px] text-blue-400">
                    {convertWeight(entry.totalVolume, entry.sets[0]?.weightUnit || 'kg')} {userProfile.weightUnit}
                  </span>
                  {entry.estimatedOneRepMax > 0 && (
                    <span className="text-[11px] text-purple-400">
                      1RM: {convertWeight(entry.estimatedOneRepMax, entry.sets[0]?.weightUnit || 'kg')} {userProfile.weightUnit}
                    </span>
                  )}
                  {entry.mood && (
                    <span className="text-[11px]">
                      {entry.mood === 'energized' ? '⚡' : entry.mood === 'great' ? '😊' : entry.mood === 'good' ? '👍' : entry.mood === 'tired' ? '😴' : '😫'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === NEW ENHANCED SECTIONS === */}

      {/* 1. Workout Calendar Heatmap */}
      {entries.length > 0 && (
        <div className={`rounded-2xl p-4 border liquid-glass-card`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Workout Calendar
              </h3>
            </div>
            <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
              Last 16 weeks
            </span>
          </div>
          <div className="flex gap-[3px] flex-wrap">
            {Array.from(heatmapData.entries()).reverse().slice(0, 112).map(([date, count], i) => {
              const intensity = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3;
              const colors = isLight
                ? ['bg-slate-100', 'bg-emerald-200', 'bg-emerald-400', 'bg-emerald-600']
                : ['bg-white/5', 'bg-emerald-500/20', 'bg-emerald-500/50', 'bg-emerald-500'];
              return (
                <div
                  key={date}
                  className={`w-3 h-3 rounded-[3px] ${colors[intensity]} transition-colors`}
                  title={`${date}: ${count} workout${count !== 1 ? 's' : ''}`}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[9px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>Less</span>
            {(isLight ? ['bg-slate-100', 'bg-emerald-200', 'bg-emerald-400', 'bg-emerald-600'] : ['bg-white/5', 'bg-emerald-500/20', 'bg-emerald-500/50', 'bg-emerald-500']).map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-[3px] ${c}`} />
            ))}
            <span className={`text-[9px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>More</span>
          </div>
        </div>
      )}

      {/* 2. Muscle Balance Radar + Fatigue Score */}
      <div className="grid grid-cols-2 gap-3">
        {/* Muscle Balance */}
        <div className={`rounded-2xl p-4 border liquid-glass-card`}>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Balance
            </h3>
          </div>
          {/* Circular balance indicator */}
          <div className="flex items-center justify-center mb-2">
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
          <div className="space-y-1">
            {muscleRadarData.slice(0, 4).map(m => (
              <div key={m.muscle} className="flex items-center gap-1.5">
                <span className="text-[10px] w-3">{m.icon}</span>
                <div className={`flex-1 h-1 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all"
                    style={{ width: `${(m.rankIdx / maxRankIdx) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fatigue Score */}
        <div className={`rounded-2xl p-4 border liquid-glass-card`}>
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-violet-400" />
            <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Recovery
            </h3>
          </div>
          <div className="flex items-center justify-center mb-2">
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" strokeWidth="6" className={isLight ? 'stroke-slate-100' : 'stroke-white/5'} />
                <circle
                  cx="50" cy="50" r="42" fill="none" strokeWidth="6" strokeLinecap="round"
                  stroke={fatigueScore <= 30 ? '#22c55e' : fatigueScore <= 60 ? '#f59e0b' : '#ef4444'}
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - fatigueScore / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{100 - fatigueScore}%</span>
                <span className={`text-[8px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>recovered</span>
              </div>
            </div>
          </div>
          <p className={`text-[10px] text-center ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
            {fatigueScore <= 20 ? 'Well rested — push hard!' :
             fatigueScore <= 50 ? 'Moderate load — stay balanced' :
             fatigueScore <= 75 ? 'High fatigue — consider rest' :
             'Overtrained — take a deload'}
          </p>
        </div>
      </div>

      {/* 3. Achievement Badges */}
      {unlockedAchievements.length > 0 && (
        <div className={`rounded-2xl p-4 border liquid-glass-card`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Achievements
              </h3>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400'
            }`}>
              {unlockedAchievements.length}/{ACHIEVEMENTS.length}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {unlockedAchievements.map(a => (
              <div key={a.id} className={`shrink-0 w-20 p-2.5 rounded-xl text-center ${
                isLight ? 'bg-amber-50 border border-amber-200/50' : 'bg-amber-500/10 border border-amber-500/20'
              }`}>
                <span className="text-xl">{a.icon}</span>
                <p className={`text-[9px] font-semibold mt-1 leading-tight ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
                  {a.name}
                </p>
              </div>
            ))}
          </div>
          {lockedAchievements.length > 0 && (
            <div className="mt-2 pt-2 border-t border-dashed">
              <p className={`text-[10px] mb-1.5 ${isLight ? 'text-slate-400' : 'text-white/30'}`}>Next up:</p>
              <div className="space-y-1">
                {lockedAchievements.slice(0, 3).map(a => (
                  <div key={a.id} className={`flex items-center gap-2 p-1.5 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-white/[0.03]'}`}>
                    <span className="text-sm opacity-40">{a.icon}</span>
                    <span className={`text-[10px] flex-1 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{a.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Best Time to Train */}
      {bestTimes.length > 0 && (
        <div className={`rounded-2xl p-4 border liquid-glass-card`}>
          <div className="flex items-center gap-2 mb-3">
            <Sun className="w-4 h-4 text-orange-400" />
            <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
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
            You train best at {bestTimes[0]?.label} — avg volume {getFormattedVolume(bestTimes[0]?.avgVolume || 0, userProfile.weightUnit)}
          </p>
        </div>
      )}

      {/* 5. Monthly Summary */}
      {monthlySummary.length > 0 && (
        <div className={`rounded-2xl p-4 border liquid-glass-card`}>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
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

      {/* 6. PR Timeline */}
      {Object.keys(stats.personalRecords).length > 0 && (
        <div className={`rounded-2xl p-4 border liquid-glass-card`}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              PR Timeline
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

      {/* 7. Exercise Substitutions */}
      {topExercises.length > 0 && topExercises[0].exercise && (
        <div className={`rounded-2xl p-4 border liquid-glass-card`}>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
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

      {/* 8. Training Load Monitor */}
      {entries.length > 5 && (
        <div className={`rounded-2xl p-4 border liquid-glass-card`}>
          <div className="flex items-center gap-2 mb-3">
            <Timer className="w-4 h-4 text-rose-400" />
            <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
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
            const thisWeekCount = new Set(last7.map(e => e.date.slice(0, 10))).size;
            const lastWeekCount = new Set(prev7.map(e => e.date.slice(0, 10))).size;
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
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Workout days</span>
                  <span className={`text-[11px] font-bold ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                    {thisWeekCount} this week · {lastWeekCount} last
                  </span>
                </div>
                <div className={`mt-1 p-2 rounded-lg text-[10px] text-center ${
                  volChange > 20 ? (isLight ? 'bg-red-50 text-red-600' : 'bg-red-500/10 text-red-400') :
                  volChange > 10 ? (isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400') :
                  volChange >= -10 ? (isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400') :
                  (isLight ? 'bg-slate-50 text-slate-500' : 'bg-white/5 text-white/40')
                }`}>
                  {volChange > 20 ? '⚠️ High volume spike — watch for overtraining' :
                   volChange > 10 ? '📈 Progressive overload — good progress' :
                   volChange >= -10 ? '✅ Consistent training — keep it up' :
                   '📉 Volume drop — consider increasing load'}
                </div>
              </div>
            );
          })()}
        </div>
      )}

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

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  isLight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
  isLight: boolean;
}) {
  return (
    <div className={`rounded-2xl p-3 border liquid-glass-card`}>
      <div className="flex items-center gap-1.5 mb-1.5" style={{ color }}>
        {icon}
        <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
          {label}
        </span>
      </div>
      <p className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
        {value}
      </p>
      {sub && (
        <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
          {sub}
        </p>
      )}
    </div>
  );
}
