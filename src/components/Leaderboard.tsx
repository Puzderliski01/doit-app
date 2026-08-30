import React, { useState, useEffect } from 'react';
import { FitnessStats, Rank, UserProfile } from '../types';
import { getRankInfo, RANKS } from '../utils/fitness';
import { Trophy, Eye, EyeOff, Crown, Medal, Users } from 'lucide-react';

interface LeaderboardProps {
  theme: 'dark' | 'light';
  userProfile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
}

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  xp: number;
  rank: Rank;
  totalWorkouts: number;
  isCurrentUser: boolean;
}

const MOCK_USERS: Omit<LeaderboardEntry, 'isCurrentUser'>[] = [
  { userId: 'mock1', displayName: 'Iron Mike', xp: 1600000, rank: 'God of Physic', totalWorkouts: 3200 },
  { userId: 'mock2', displayName: 'FitQueen', xp: 890000, rank: 'Titan II', totalWorkouts: 1800 },
  { userId: 'mock3', displayName: 'BeastMode', xp: 490000, rank: 'Apex II', totalWorkouts: 980 },
  { userId: 'mock4', displayName: 'RunnerX', xp: 325000, rank: 'Master III', totalWorkouts: 650 },
  { userId: 'mock5', displayName: 'GymRat99', xp: 215000, rank: 'Master I', totalWorkouts: 430 },
  { userId: 'mock6', displayName: 'PowerLifter', xp: 142000, rank: 'Elite Soldier II', totalWorkouts: 280 },
  { userId: 'mock7', displayName: 'CardioKing', xp: 92000, rank: 'Soldier III', totalWorkouts: 184 },
  { userId: 'mock8', displayName: 'Newbie2024', xp: 3500, rank: 'Rookie I', totalWorkouts: 15 },
];

export const Leaderboard: React.FC<LeaderboardProps> = ({
  theme,
  userProfile,
  onUpdateProfile,
}) => {
  const isLight = theme === 'light';
  const [showAll, setShowAll] = useState(false);

  const currentUser: LeaderboardEntry = {
    userId: 'current',
    displayName: userProfile.displayName || 'You',
    xp: userProfile.fitnessStats.xp,
    rank: userProfile.fitnessStats.rank,
    totalWorkouts: userProfile.fitnessStats.totalWorkouts,
    isCurrentUser: true,
  };

  const allEntries: LeaderboardEntry[] = [
    ...MOCK_USERS.map((u) => ({ ...u, isCurrentUser: false })),
    ...(userProfile.leaderboardPublic ? [currentUser] : []),
  ].sort((a, b) => b.xp - a.xp);

  const userRank = allEntries.findIndex((e) => e.isCurrentUser) + 1;
  const visibleEntries = showAll ? allEntries : allEntries.slice(0, 10);
  const currentUserInVisible = allEntries.find((e) => e.isCurrentUser);

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Leaderboard
          </h1>
          <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
            See how you stack up
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Users className={`w-5 h-5 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
          <span className={`text-sm font-medium ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
            {allEntries.length}
          </span>
        </div>
      </div>

      {/* Privacy Toggle */}
      <div className={`rounded-2xl p-4 border ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {userProfile.leaderboardPublic ? (
              <Eye className={`w-5 h-5 ${isLight ? 'text-green-500' : 'text-green-400'}`} />
            ) : (
              <EyeOff className={`w-5 h-5 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
            )}
            <div>
              <p className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-white/90'}`}>
                {userProfile.leaderboardPublic ? 'Score is Public' : 'Score is Private'}
              </p>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                {userProfile.leaderboardPublic
                  ? 'Others can see your rank and XP'
                  : 'Only you can see your rank'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onUpdateProfile({ leaderboardPublic: !userProfile.leaderboardPublic })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              userProfile.leaderboardPublic
                ? 'bg-green-500/20 text-green-400'
                : isLight
                ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {userProfile.leaderboardPublic ? 'Public' : 'Private'}
          </button>
        </div>
      </div>

      {/* Your Rank Card */}
      <div className={`rounded-2xl p-5 border relative overflow-hidden ${
        isLight
          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
          : 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20'
      }`}>
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-30"
          style={{ background: getRankInfo(currentUser.rank).color }} />
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg relative"
            style={{ background: `${getRankInfo(currentUser.rank).color}20`, border: `2px solid ${getRankInfo(currentUser.rank).color}40` }}>
            {getRankInfo(currentUser.rank).icon}
          </div>
          <div className="flex-1">
            <p className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              Your Rank
            </p>
            <p className="text-xl font-bold" style={{ color: getRankInfo(currentUser.rank).color }}>
              {currentUser.rank}
            </p>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
              {currentUser.xp.toLocaleString()} XP
            </p>
          </div>
          {userRank > 0 && (
            <div className="text-right">
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Position</p>
              <p className={`text-2xl font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                #{userRank}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className={`rounded-2xl border overflow-hidden ${
        isLight ? 'border-slate-200' : 'border-white/10'
      }`}>
        {visibleEntries.map((entry, index) => {
          const rankInfo = getRankInfo(entry.rank);
          const medals = ['🥇', '🥈', '🥉'];
          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-3 px-4 py-3 border-b last:border-b-0 ${
                entry.isCurrentUser
                  ? isLight
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-amber-500/5 border-amber-500/10'
                  : isLight
                  ? 'border-slate-100'
                  : 'border-white/5'
              }`}
            >
              <span className={`w-8 text-center font-bold text-sm ${
                index < 3 ? 'text-lg' : isLight ? 'text-slate-400' : 'text-white/30'
              }`}>
                {index < 3 ? medals[index] : `#${index + 1}`}
              </span>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: `${rankInfo.color}20` }}>
                {rankInfo.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${
                  entry.isCurrentUser
                    ? isLight ? 'text-amber-700' : 'text-amber-400'
                    : isLight ? 'text-slate-800' : 'text-white/90'
                }`}>
                  {entry.displayName} {entry.isCurrentUser && '(You)'}
                </p>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                  {entry.totalWorkouts} workouts
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold" style={{ color: rankInfo.color }}>
                  {entry.xp >= 1000000
                    ? `${(entry.xp / 1000000).toFixed(1)}M`
                    : entry.xp >= 1000
                    ? `${(entry.xp / 1000).toFixed(1)}k`
                    : entry.xp}
                </p>
                <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                  XP
                </p>
              </div>
            </div>
          );
        })}

        {allEntries.length > 10 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className={`w-full py-3 text-xs font-bold transition-colors ${
              isLight
                ? 'text-amber-600 hover:bg-slate-50'
                : 'text-amber-400 hover:bg-white/5'
            }`}
          >
            {showAll ? 'Show Less' : `Show All (${allEntries.length})`}
          </button>
        )}
      </div>

      {!userProfile.leaderboardPublic && (
        <p className={`text-center text-xs ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
          Enable public visibility to appear on the leaderboard
        </p>
      )}
    </div>
  );
};
