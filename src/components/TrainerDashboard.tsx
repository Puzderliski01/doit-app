import React, { useState, useMemo } from 'react';
import {
  WeeklyPlan, PlannedWorkout, WeakPoint, RecoveryStatus,
  TrainerSuggestion, UserProfile, TrainingGoal, TrainingDays,
  SplitType, MuscleGroup
} from '../types';
import {
  detectWeakPoints, getRecoveryStatus, generateWeeklyPlan,
  getTrainerSuggestions
} from '../utils/trainer';
import { getRankInfo, RANKS, ALL_EXERCISES, MUSCLE_ENGAGEMENT, getProgressToNextRank } from '../utils/fitness';
import {
  Dumbbell, Target, AlertTriangle, TrendingUp, Clock, CheckCircle2,
  Zap, ChevronDown, ChevronUp, Sparkles, RotateCcw, Calendar,
  Shield, Flame, Trophy, Info, Play, Pause, Eye, EyeOff
} from 'lucide-react';
import { haptic } from '../utils/haptics';

interface TrainerDashboardProps {
  theme: 'dark' | 'light';
  userProfile: UserProfile;
  fitnessEntries: any[];
  onLogExercise?: (exerciseId: string, exerciseName: string, muscleGroup: MuscleGroup) => void;
}

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders', biceps: 'Biceps',
  triceps: 'Triceps', legs: 'Legs', glutes: 'Glutes', core: 'Core',
  cardio: 'Cardio', full_body: 'Full Body'
};

const MUSCLE_ICONS: Record<MuscleGroup, string> = {
  chest: '💪', back: '🔙', shoulders: '🏋️', biceps: '💪',
  triceps: '💪', legs: '🦵', glutes: '🍑', core: '🎯',
  cardio: '❤️', full_body: '⚡'
};

const GOAL_OPTIONS: { value: TrainingGoal; label: string; icon: string; desc: string }[] = [
  { value: 'strength', label: 'Strength', icon: '🏋️', desc: '1-6 reps, heavy loads, long rest' },
  { value: 'hypertrophy', label: 'Hypertrophy', icon: '💪', desc: '8-12 reps, moderate weight, volume' },
  { value: 'endurance', label: 'Endurance', icon: '🏃', desc: '15-25 reps, light weight, short rest' },
  { value: 'fat_loss', label: 'Fat Loss', icon: '🔥', desc: '10-15 reps, circuits, minimal rest' },
  { value: 'general_fitness', label: 'General Fitness', icon: '⭐', desc: '8-12 reps, balanced approach' },
];

const SPLIT_OPTIONS: { value: SplitType; label: string; desc: string; days: number[] }[] = [
  { value: 'push_pull_legs', label: 'Push / Pull / Legs', desc: 'Classic 3-day split, repeat', days: [3, 4, 5, 6] },
  { value: 'upper_lower', label: 'Upper / Lower', desc: '4-day upper-lower alternation', days: [4] },
  { value: 'full_body', label: 'Full Body', desc: 'Hit all muscles each session', days: [3, 4, 5] },
  { value: 'bro_split', label: 'Bro Split', desc: 'One muscle group per day', days: [4, 5, 6] },
];

export const TrainerDashboard: React.FC<TrainerDashboardProps> = ({
  theme,
  userProfile,
  fitnessEntries,
  onLogExercise,
}) => {
  const isLight = theme === 'light';
  const stats = userProfile.fitnessStats;

  const [activeTab, setActiveTab] = useState<'overview' | 'plan' | 'weakpoints' | 'recovery'>('overview');
  const [showPlanBuilder, setShowPlanBuilder] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<TrainingGoal>((userProfile.goals?.[0] as TrainingGoal) || 'hypertrophy');
  const [selectedSplit, setSelectedSplit] = useState<SplitType>('push_pull_legs');
  const [selectedDays, setSelectedDays] = useState<TrainingDays>(4);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);

  const weakPoints = useMemo(() => detectWeakPoints(stats), [stats]);
  const recovery = useMemo(() => getRecoveryStatus(stats, new Date().toISOString()), [stats]);
  const suggestions = useMemo(() => getTrainerSuggestions(stats, weakPoints, recovery, null), [stats, weakPoints, recovery]);

  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);

  const handleGeneratePlan = () => {
    haptic.mediumClick();
    const plan = generateWeeklyPlan(selectedGoal, selectedSplit, selectedDays, userProfile.experienceLevel || 'beginner', weakPoints, recovery, stats);
    setWeeklyPlan(plan);
    setShowPlanBuilder(false);
  };

  const formatXp = (xp: number) => {
    if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
    if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
    return xp.toString();
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'plan' as const, label: 'Plan', icon: <Calendar className="w-4 h-4" /> },
    { id: 'weakpoints' as const, label: 'Weak Points', icon: <Target className="w-4 h-4" /> },
    { id: 'recovery' as const, label: 'Recovery', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Personal Trainer
        </h1>
        <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
          Your AI-powered training assistant
        </p>
      </div>

      {/* Tab Navigation */}
      <div className={`flex gap-1 p-1 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'}`}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { haptic.lightTap(); setActiveTab(tab.id); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex-1 cursor-pointer ${
              activeTab === tab.id
                ? isLight
                  ? 'bg-white text-slate-900 border border-slate-300 shadow-sm'
                  : 'bg-white/10 text-white border border-white/15 shadow-sm'
                : isLight
                  ? 'text-slate-500 hover:text-slate-700'
                  : 'text-white/50 hover:text-white/70'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              {suggestions.slice(0, 3).map((s, i) => (
                <div key={i} className={`p-4 rounded-xl border flex items-start gap-3 ${
                  s.priority === 'high'
                    ? isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'
                    : s.priority === 'medium'
                    ? isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-500/20'
                    : isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                }`}>
                  <div className={`mt-0.5 ${
                    s.priority === 'high' ? 'text-amber-500' : s.priority === 'medium' ? 'text-blue-500' : 'text-slate-400'
                  }`}>
                    {s.type === 'weak_point' && <AlertTriangle className="w-4 h-4" />}
                    {s.type === 'recovery' && <RotateCcw className="w-4 h-4" />}
                    {s.type === 'progressive_overload' && <TrendingUp className="w-4 h-4" />}
                    {s.type === 'deload' && <Pause className="w-4 h-4" />}
                    {s.type === 'milestone' && <Trophy className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{s.title}</p>
                    <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
              <p className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Weak Points</p>
              <p className={`text-2xl font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {weakPoints.filter(w => w.priority === 'high').length}
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
              <p className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Recovered</p>
              <p className={`text-2xl font-bold mt-1 text-emerald-500`}>
                {recovery.filter(r => r.isRecovered).length}/{recovery.filter(r => r.muscleGroup !== 'cardio' && r.muscleGroup !== 'full_body').length}
              </p>
            </div>
          </div>

          {/* Muscle Group Overview */}
          <div className={`rounded-xl border p-4 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
            <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              Muscle Group Status
            </h3>
            <div className="space-y-2">
              {(['chest', 'back', 'shoulders', 'legs', 'biceps', 'triceps', 'glutes', 'core'] as MuscleGroup[]).map(muscle => {
                const rankData = stats.muscleRanks[muscle];
                const xp = rankData?.xp || 0;
                const rank = rankData?.rank || 'Beginner';
                const rankInfo = getRankInfo(rank);
                const progress = getProgressToNextRank(xp);
                const isWeak = weakPoints.some(w => w.muscleGroup === muscle && w.priority === 'high');
                const isRecovered = recovery.find(r => r.muscleGroup === muscle)?.isRecovered ?? true;

                return (
                  <div key={muscle} className={`flex items-center gap-3 p-2 rounded-lg ${
                    isWeak ? (isLight ? 'bg-amber-50' : 'bg-amber-500/5') : ''
                  }`}>
                    <span className="text-lg w-8 text-center">{MUSCLE_ICONS[muscle]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white/90'}`}>
                          {MUSCLE_LABELS[muscle]}
                        </span>
                        {isWeak && <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">WEAK</span>}
                        {isRecovered && <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">READY</span>}
                      </div>
                      <div className={`h-1.5 rounded-full mt-1 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${progress.percent}%`, background: rankInfo.color }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs" style={{ color: rankInfo.color }}>{rankInfo.icon}</span>
                      <p className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                        {formatXp(xp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generate Plan Button */}
          {!weeklyPlan && (
            <button
              onClick={() => { haptic.mediumClick(); setShowPlanBuilder(true); }}
              className={`w-full p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                isLight
                  ? 'border-orange-300 text-orange-600 hover:bg-orange-50'
                  : 'border-orange-500/30 text-orange-400 hover:bg-orange-500/10'
              }`}
            >
              <Sparkles className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-bold">Generate Weekly Plan</p>
              <p className={`text-xs mt-1 ${isLight ? 'text-orange-500/70' : 'text-orange-400/70'}`}>
                AI-powered plan based on your goals, recovery, and weak points
              </p>
            </button>
          )}
        </div>
      )}

      {/* Plan Tab */}
      {activeTab === 'plan' && (
        <div className="space-y-4">
          {!weeklyPlan ? (
            <div className={`text-center py-12 rounded-xl border ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <Calendar className={`w-12 h-12 mx-auto mb-3 ${isLight ? 'text-slate-300' : 'text-white/20'}`} />
              <p className={`text-sm font-bold ${isLight ? 'text-slate-600' : 'text-white/60'}`}>No plan generated yet</p>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                Go to Overview and generate your first plan
              </p>
              <button
                onClick={() => { haptic.lightTap(); setShowPlanBuilder(true); }}
                className="mt-4 px-4 py-2 rounded-full bg-orange-500 text-white text-xs font-bold cursor-pointer"
              >
                Create Plan
              </button>
            </div>
          ) : (
            <>
              {/* Plan Header */}
              <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {weeklyPlan.name}
                  </h3>
                  <button
                    onClick={() => { haptic.lightTap(); setWeeklyPlan(null); }}
                    className={`text-xs font-semibold cursor-pointer ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/40 hover:text-white/60'}`}
                  >
                    Reset
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    isLight ? 'bg-orange-100 text-orange-700' : 'bg-orange-500/20 text-orange-300'
                  }`}>
                    {weeklyPlan.goal.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    {weeklyPlan.trainingDays} days/week
                  </span>
                </div>
              </div>

              {/* Workouts */}
              {weeklyPlan.workouts.map(workout => (
                <div key={workout.id} className={`rounded-xl border overflow-hidden ${
                  isLight ? 'border-slate-200' : 'border-white/10'
                }`}>
                  <button
                    onClick={() => {
                      haptic.lightTap();
                      setExpandedWorkout(expandedWorkout === workout.id ? null : workout.id);
                    }}
                    className={`w-full p-4 flex items-center gap-3 cursor-pointer ${
                      isLight ? 'bg-white hover:bg-slate-50' : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                      workout.completed
                        ? 'bg-emerald-500 text-white'
                        : isLight ? 'bg-orange-100 text-orange-600' : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {workout.completed ? <CheckCircle2 className="w-5 h-5" /> : workout.dayName.slice(0, 2)}
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {workout.splitName}
                      </p>
                      <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                        {workout.exercises.length} exercises · ~{workout.estimatedMinutes} min
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 max-w-[120px]">
                      {workout.targetMuscles.slice(0, 3).map(m => (
                        <span key={m} className="text-sm">{MUSCLE_ICONS[m]}</span>
                      ))}
                    </div>
                    {expandedWorkout === workout.id
                      ? <ChevronUp className="w-4 h-4 text-slate-400" />
                      : <ChevronDown className="w-4 h-4 text-slate-400" />
                    }
                  </button>

                  {expandedWorkout === workout.id && (
                    <div className={`border-t divide-y ${isLight ? 'border-slate-200 divide-slate-100' : 'border-white/10 divide-white/5'}`}>
                      {workout.exercises.map((ex, i) => (
                        <div key={i} className={`px-4 py-3 flex items-center gap-3 ${
                          isLight ? 'bg-slate-50/50' : 'bg-white/[0.02]'
                        }`}>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white/90'}`}>
                              {ex.exerciseName}
                            </p>
                            <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                              {ex.sets} sets × {ex.repsMin}-{ex.repsMax} reps · {ex.restSeconds}s rest
                            </p>
                            {ex.notes && (
                              <p className="text-[10px] text-amber-500 font-semibold mt-0.5">
                                ⚠️ {ex.notes}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              haptic.mediumClick();
                              onLogExercise?.(ex.exerciseId, ex.exerciseName, ex.muscleGroup);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                              isLight
                                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                : 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30'
                            }`}
                          >
                            Log
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Weak Points Tab */}
      {activeTab === 'weakpoints' && (
        <div className="space-y-4">
          {weakPoints.length === 0 ? (
            <div className={`text-center py-12 rounded-xl border ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <Target className={`w-12 h-12 mx-auto mb-3 ${isLight ? 'text-slate-300' : 'text-white/20'}`} />
              <p className={`text-sm font-bold ${isLight ? 'text-slate-600' : 'text-white/60'}`}>No weak points detected</p>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                Keep training to build more data
              </p>
            </div>
          ) : (
            weakPoints.map(wp => {
              const rankInfo = getRankInfo(wp.currentRank);
              const progress = getProgressToNextRank(wp.currentXp);
              return (
                <div key={wp.muscleGroup} className={`p-4 rounded-xl border ${
                  wp.priority === 'high'
                    ? isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'
                    : isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{MUSCLE_ICONS[wp.muscleGroup]}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {MUSCLE_LABELS[wp.muscleGroup]}
                        </p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          wp.priority === 'high' ? 'bg-amber-500/20 text-amber-500'
                          : 'bg-blue-500/20 text-blue-500'
                        }`}>
                          {wp.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                        {wp.reason}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg" style={{ color: rankInfo.color }}>{rankInfo.icon}</span>
                      <p className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                        {formatXp(wp.currentXp)} XP
                      </p>
                    </div>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progress.percent}%`, background: rankInfo.color }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                      {rankInfo.label}
                    </span>
                    <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                      {wp.avgWeeklyFrequency}x/week avg
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Recovery Tab */}
      {activeTab === 'recovery' && (
        <div className="space-y-4">
          <div className={`rounded-xl border p-4 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
            <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              Muscle Recovery Status
            </h3>
            <div className="space-y-2">
              {recovery.filter(r => r.muscleGroup !== 'cardio' && r.muscleGroup !== 'full_body').map(r => (
                <div key={r.muscleGroup} className="flex items-center gap-3">
                  <span className="text-lg w-8 text-center">{MUSCLE_ICONS[r.muscleGroup]}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white/90'}`}>
                        {MUSCLE_LABELS[r.muscleGroup]}
                      </span>
                      <span className={`text-[10px] font-semibold ${
                        r.isRecovered ? 'text-emerald-500' : r.recoveryPercent > 50 ? 'text-amber-500' : 'text-red-500'
                      }`}>
                        {r.isRecovered ? 'Recovered' : `${r.daysSinceLast}/${r.daysNeeded} days`}
                      </span>
                    </div>
                    <div className={`h-1.5 rounded-full mt-1 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${r.recoveryPercent}%`,
                          background: r.isRecovered ? '#10b981' : r.recoveryPercent > 50 ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-500/20'}`}>
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <p className={`text-xs ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>
                Muscles need 48-72 hours to recover after training. The plan generator uses this data to avoid training the same muscles on consecutive days.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plan Builder Modal */}
      {showPlanBuilder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-xl">
          <div className={`w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl border shadow-2xl overflow-hidden ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0a0a0c] border-white/10'
          }`}>
            {/* Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <h3 className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Generate Plan</h3>
              <button
                onClick={() => { haptic.lightTap(); setShowPlanBuilder(false); }}
                className={`p-1 rounded-full cursor-pointer ${isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-white/40 hover:bg-white/10'}`}
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Goal */}
              <div>
                <label className={`text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                  Training Goal
                </label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {GOAL_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { haptic.lightTap(); setSelectedGoal(opt.value); }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedGoal === opt.value
                          ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/20'
                          : isLight ? 'border-slate-200 hover:bg-slate-50' : 'border-white/10 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-lg">{opt.icon}</span>
                      <p className={`text-xs font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{opt.label}</p>
                      <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Split */}
              <div>
                <label className={`text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                  Split Type
                </label>
                <div className="space-y-2 mt-2">
                  {SPLIT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        haptic.lightTap();
                        setSelectedSplit(opt.value);
                        if (!opt.days.includes(selectedDays)) {
                          setSelectedDays(opt.days[0] as TrainingDays);
                        }
                      }}
                      className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        selectedSplit === opt.value
                          ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/20'
                          : isLight ? 'border-slate-200 hover:bg-slate-50' : 'border-white/10 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex-1">
                        <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{opt.label}</p>
                        <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{opt.desc}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-white/50'
                      }`}>
                        {opt.days.join('-')} days
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Training Days */}
              <div>
                <label className={`text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                  Training Days per Week
                </label>
                <div className="flex gap-2 mt-2">
                  {SPLIT_OPTIONS.find(s => s.value === selectedSplit)?.days.map(d => (
                    <button
                      key={d}
                      onClick={() => { haptic.lightTap(); setSelectedDays(d as TrainingDays); }}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                        selectedDays === d
                          ? 'border-orange-500 bg-orange-500 text-white'
                          : isLight ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-white/10 text-white/60 hover:bg-white/5'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGeneratePlan}
                className="w-full py-3 rounded-xl bg-orange-500 text-white font-bold text-sm shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:bg-orange-600 active:scale-95 transition-all cursor-pointer"
              >
                Generate Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
