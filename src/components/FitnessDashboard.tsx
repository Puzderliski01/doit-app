import React from 'react';
import {
  FitnessStats,
  FitnessEntry,
  UserProfile,
  MuscleGroup,
  Rank,
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

      <div className={`rounded-2xl p-5 border relative overflow-hidden ${
        isLight
          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
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
                <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
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

      {Object.keys(stats.personalRecords).length > 0 && (
        <div className={`rounded-2xl p-4 border ${
          isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Personal Records
            </h3>
          </div>
          <div className="space-y-2">
            {(Object.entries(stats.personalRecords) as [string, { weight: number; reps: number; date: string }][])
              .slice(0, 5)
              .map(([exerciseId, pr]) => {
                const exercise = ALL_EXERCISES.find((e) => e.id === exerciseId);
                return (
                  <div key={exerciseId}
                    className={`flex items-center justify-between p-2.5 rounded-xl ${
                      isLight ? 'bg-slate-50' : 'bg-white/5'
                    }`}>
                    <span className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                      {exercise?.name || exerciseId}
                    </span>
                    <span className="text-xs font-bold text-amber-400">
                      {convertWeight(pr.weight, userProfile.weightUnit)} {userProfile.weightUnit} × {pr.reps}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {muscleStats.length > 0 && (
        <div className={`rounded-2xl p-4 border ${
          isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
        }`}>
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
                <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
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
      <div className={`rounded-2xl p-4 border ${
        isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
      }`}>
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
                  className={`p-2.5 rounded-xl ${isLight ? 'bg-slate-50' : 'bg-white/5'}`}>
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
                  <div className={`mt-1.5 h-1 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
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
            <div className={`p-2.5 rounded-xl border border-dashed ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                Train more muscles to unlock their ranks
              </p>
            </div>
          )}
        </div>
      </div>

      {weeklyData.length > 0 && (
        <div className={`rounded-2xl p-4 border ${
          isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
        }`}>
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
        <div className={`rounded-2xl p-4 border ${
          isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
        }`}>
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
                className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors text-left ${
                  isLight ? 'bg-slate-50 hover:bg-slate-100' : 'bg-white/5 hover:bg-white/10'
                }`}
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
        <div className={`rounded-2xl p-4 border ${
          isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-green-400" />
            <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Recent Workouts
            </h3>
          </div>
          <div className="space-y-2">
            {recentEntries.map((entry) => (
              <div key={entry.id}
                className={`p-3 rounded-xl ${isLight ? 'bg-slate-50' : 'bg-white/5'}`}>
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.totalWorkouts === 0 && (
        <div className={`text-center py-12 rounded-2xl border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
        }`}>
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
    <div className={`rounded-2xl p-3 border ${
      isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
    }`}>
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
