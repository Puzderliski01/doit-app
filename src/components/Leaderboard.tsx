import React, { useState, useEffect } from 'react';
import { FitnessStats, Rank, UserProfile } from '../types';
import { getRankInfo, RANKS, getProgressToNextRank } from '../utils/fitness';
import { fetchPublicLeaderboard, LeaderboardUser } from '../firebase';
import { Trophy, Zap, Target, TrendingUp, Users, Eye, EyeOff, Crown } from 'lucide-react';
import { haptic } from '../utils/haptics';

interface LeaderboardProps {
  theme: 'dark' | 'light';
  userProfile: UserProfile;
  onProfileUpdate?: (updates: Partial<UserProfile>) => void;
  currentUserUid?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  theme,
  userProfile,
  onProfileUpdate,
  currentUserUid,
}) => {
  const isLight = theme === 'light';
  const stats = userProfile.fitnessStats;
  const rankInfo = getRankInfo(stats.rank);
  const progress = getProgressToNextRank(stats.xp);
  const currentRankIndex = RANKS.findIndex((r) => r.rank === stats.rank);

  const [publicUsers, setPublicUsers] = useState<LeaderboardUser[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const isPublic = userProfile.leaderboardPublic ?? true;

  useEffect(() => {
    setLoadingLeaderboard(true);
    fetchPublicLeaderboard().then((users) => {
      setPublicUsers(users);
      setLoadingLeaderboard(false);
    });
  }, []);

  const handleTogglePublic = () => {
    haptic.mediumClick();
    onProfileUpdate?.({ leaderboardPublic: !isPublic });
  };

  const formatXp = (xp: number) => {
    if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
    if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
    return xp.toString();
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Leaderboard
          </h1>
          <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
            Your rank and community standings
          </p>
        </div>
        <button
          onClick={handleTogglePublic}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            isPublic
              ? isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-white/60'
          }`}
        >
          {isPublic ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {isPublic ? 'Public' : 'Private'}
        </button>
      </div>

      {/* Current Rank Card */}
      <div className={`rounded-2xl p-5 border relative overflow-hidden ${
        isLight
          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
          : 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20'
      }`}>
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-30"
          style={{ background: rankInfo.color }} />
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
            style={{ background: `${rankInfo.color}20`, border: `2px solid ${rankInfo.color}40`, boxShadow: `0 0 20px ${rankInfo.color}30` }}>
            {rankInfo.icon}
          </div>
          <div>
            <p className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Current Rank</p>
            <p className="text-2xl font-bold" style={{ color: rankInfo.color }}>{stats.rank}</p>
          </div>
        </div>
        <div className={`rounded-xl p-3 ${isLight ? 'bg-white/50' : 'bg-white/5'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
              Progress to next rank
            </span>
            <span className="text-xs font-bold text-amber-400">
              {progress.percent}%
            </span>
          </div>
          <div className={`h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress.percent}%`, background: rankInfo.color }}
            />
          </div>
          <p className={`text-[10px] mt-1.5 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
            {progress.current} / {progress.needed} XP
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`p-4 rounded-2xl border text-center ${
          isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
        }`}>
          <Zap className="w-5 h-5 mx-auto mb-1 text-amber-400" />
          <p className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {formatXp(stats.xp)}
          </p>
          <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>Total XP</p>
        </div>
        <div className={`p-4 rounded-2xl border text-center ${
          isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
        }`}>
          <Target className="w-5 h-5 mx-auto mb-1 text-blue-400" />
          <p className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {stats.totalWorkouts}
          </p>
          <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>Workouts</p>
        </div>
        <div className={`p-4 rounded-2xl border text-center ${
          isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
        }`}>
          <TrendingUp className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
          <p className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {stats.currentStreak}
          </p>
          <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>Day Streak</p>
        </div>
      </div>

      {/* Public Leaderboard */}
      <div className={`rounded-2xl border overflow-hidden ${
        isLight ? 'border-slate-200' : 'border-white/10'
      }`}>
        <div className={`px-4 py-3 border-b flex items-center gap-2 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/5'}`}>
          <Users className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
          <h3 className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
            Community Leaderboard
          </h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {loadingLeaderboard ? (
            <div className="p-6 text-center">
              <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Loading leaderboard...</p>
            </div>
          ) : publicUsers.length === 0 ? (
            <div className="p-6 text-center">
              <Trophy className={`w-8 h-8 mx-auto mb-2 ${isLight ? 'text-slate-300' : 'text-white/20'}`} />
              <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-white/40'}`}>No public profiles yet. Be the first!</p>
              {!isPublic && (
                <button
                  onClick={handleTogglePublic}
                  className="mt-2 text-xs font-bold text-amber-500 hover:text-amber-600 cursor-pointer"
                >
                  Make your profile public →
                </button>
              )}
            </div>
          ) : (
            publicUsers.map((user, index) => {
              const isCurrentUser = user.uid === currentUserUid;
              const userRank = RANKS.find((r) => r.rank === user.rank);
              return (
                <div
                  key={user.uid}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    isCurrentUser
                      ? isLight
                        ? 'bg-amber-50 border-l-4 border-l-amber-500'
                        : 'bg-amber-500/10 border-l-4 border-l-amber-500'
                      : ''
                  }`}
                >
                  <span className={`w-8 text-center text-xs font-bold ${
                    index === 0 ? 'text-amber-500' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-orange-400'
                    : isLight ? 'text-slate-400' : 'text-white/40'
                  }`}>
                    {index < 3 ? ['🥇','🥈','🥉'][index] : `#${index + 1}`}
                  </span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-white/60'
                  }`}>
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      user.displayName[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${
                      isCurrentUser ? 'text-amber-500' : isLight ? 'text-slate-800' : 'text-white/90'
                    }`}>
                      {user.displayName} {isCurrentUser && <span className="text-[10px] opacity-60">(you)</span>}
                    </p>
                    <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                      {userRank?.icon} {user.rank} · {user.totalWorkouts} workouts · {user.currentStreak}d streak
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {formatXp(user.xp)}
                    </p>
                    <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>XP</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Full Rank Ladder */}
      <div className={`rounded-2xl border overflow-hidden ${
        isLight ? 'border-slate-200' : 'border-white/10'
      }`}>
        <div className={`px-4 py-3 border-b ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/5'}`}>
          <h3 className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
            All Ranks
          </h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {RANKS.map((rank, index) => {
            const isCurrentOrPast = index <= currentRankIndex;
            const isCurrent = rank.rank === stats.rank;
            return (
              <div
                key={rank.rank}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                  isCurrent
                    ? isLight
                      ? 'bg-amber-50 border-l-4 border-l-amber-500'
                      : 'bg-amber-500/10 border-l-4 border-l-amber-500'
                    : isCurrentOrPast
                    ? isLight
                      ? 'bg-slate-50/50'
                      : 'bg-white/[0.02]'
                    : ''
                }`}
              >
                <span className={`w-8 text-center text-xs font-bold ${
                  isCurrent
                    ? 'text-amber-500'
                    : isCurrentOrPast
                    ? isLight ? 'text-slate-600' : 'text-white/60'
                    : isLight ? 'text-slate-300' : 'text-white/20'
                }`}>
                  {index + 1}
                </span>
                <span className={`text-xl ${
                  isCurrentOrPast ? '' : 'grayscale opacity-40'
                }`}>
                  {rank.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${
                    isCurrent
                      ? 'text-amber-500'
                      : isCurrentOrPast
                      ? isLight ? 'text-slate-800' : 'text-white/90'
                      : isLight ? 'text-slate-400' : 'text-white/30'
                  }`}>
                    {rank.label}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-mono ${
                    isCurrentOrPast
                      ? isLight ? 'text-slate-600' : 'text-white/50'
                      : isLight ? 'text-slate-300' : 'text-white/20'
                  }`}>
                    {formatXp(rank.minXP)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
