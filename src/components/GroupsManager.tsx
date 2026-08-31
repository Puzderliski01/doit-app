import React, { useState } from 'react';
import { Group, AuthUser } from '../types';
import { createGroup, joinGroup, leaveGroup, deleteGroup, refreshGroupJoinCode } from '../firebase';
import { Users, Plus, LogOut, Copy, RefreshCw, Trash2, Crown, UserPlus, X, Check, ChevronRight } from 'lucide-react';
import { haptic } from '../utils/haptics';

interface GroupsManagerProps {
  theme: 'dark' | 'light';
  currentUser: AuthUser;
  groups: Group[];
  onSelectGroup: (group: Group) => void;
}

export const GroupsManager: React.FC<GroupsManagerProps> = ({
  theme,
  currentUser,
  groups,
  onSelectGroup,
}) => {
  const isLight = theme === 'light';
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!newGroupName.trim()) return;
    setLoading(true);
    setError('');
    try {
      await createGroup(newGroupName.trim(), newGroupDesc.trim(), currentUser);
      setNewGroupName('');
      setNewGroupDesc('');
      setShowCreate(false);
    } catch {
      setError('Failed to create group');
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await joinGroup(joinCode.trim().toUpperCase(), currentUser);
      if (result) {
        setJoinCode('');
        setShowJoin(false);
      } else {
        setError('Invalid join code');
      }
    } catch {
      setError('Failed to join group');
    }
    setLoading(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    haptic.lightTap();
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRefreshCode = async (groupId: string) => {
    haptic.mediumClick();
    await refreshGroupJoinCode(groupId);
  };

  const handleLeave = async (groupId: string) => {
    haptic.deleteAction();
    await leaveGroup(groupId, currentUser.uid);
  };

  const handleDelete = async (groupId: string) => {
    haptic.deleteAction();
    await deleteGroup(groupId);
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Groups
          </h1>
          <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
            Collaborate and share tasks with others
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { haptic.lightTap(); setShowJoin(!showJoin); setShowCreate(false); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              showJoin
                ? 'bg-blue-500 text-white border-blue-500'
                : isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-white/70'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Join
          </button>
          <button
            onClick={() => { haptic.lightTap(); setShowCreate(!showCreate); setShowJoin(false); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              showCreate
                ? 'bg-orange-500 text-white border-orange-500'
                : isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-white/70'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Create
          </button>
        </div>
      </div>

      {/* Join Form */}
      {showJoin && (
        <div className={`rounded-2xl p-4 border liquid-glass-card ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
          <p className={`text-xs font-semibold mb-3 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            Enter a 6-digit join code
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className={`flex-1 px-4 py-3 rounded-xl border text-center text-lg font-mono font-bold tracking-[0.3em] ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'
              }`}
            />
            <button
              onClick={handleJoin}
              disabled={loading || joinCode.length < 6}
              className="px-5 py-3 rounded-xl bg-blue-500 text-white font-bold text-sm disabled:opacity-40 cursor-pointer"
            >
              {loading ? '...' : 'Join'}
            </button>
          </div>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <div className={`rounded-2xl p-4 border liquid-glass-card ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
          <p className={`text-xs font-semibold mb-3 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            Create a new group
          </p>
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name"
            className={`w-full px-4 py-3 rounded-xl border text-sm mb-2 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'
            }`}
          />
          <input
            type="text"
            value={newGroupDesc}
            onChange={(e) => setNewGroupDesc(e.target.value)}
            placeholder="Description (optional)"
            className={`w-full px-4 py-3 rounded-xl border text-sm mb-3 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'
            }`}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className={`flex-1 px-4 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                isLight ? 'border-slate-200 text-slate-600' : 'border-white/10 text-white/60'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading || !newGroupName.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
            >
              {loading ? '...' : 'Create Group'}
            </button>
          </div>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
      )}

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className={`text-center py-16 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
          <Users className={`w-12 h-12 mx-auto mb-3 ${isLight ? 'text-slate-300' : 'text-white/20'}`} />
          <p className={`text-sm font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
            No groups yet
          </p>
          <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
            Create a group or join one with a code
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const isAdmin = group.members.find((m) => m.uid === currentUser.uid)?.role === 'admin';
            return (
              <div
                key={group.id}
                className={`rounded-2xl border overflow-hidden liquid-glass-card ${
                  isLight ? 'border-slate-200' : 'border-white/10'
                }`}
              >
                {/* Group Header */}
                <div
                  className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
                    isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'
                  }`}
                  onClick={() => { haptic.lightTap(); onSelectGroup(group); }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0"
                    style={{ background: group.color || '#f97316' }}
                  >
                    {group.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {group.name}
                    </p>
                    <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                      {group.members.length} member{group.members.length !== 1 ? 's' : ''} · {group.description || 'No description'}
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 ${isLight ? 'text-slate-300' : 'text-white/30'}`} />
                </div>

                {/* Join Code + Members */}
                <div className={`px-4 py-3 border-t ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                      Join Code
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleRefreshCode(group.id)}
                        className={`text-[10px] flex items-center gap-1 cursor-pointer ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/40 hover:text-white/60'}`}
                      >
                        <RefreshCw className="w-3 h-3" /> Refresh
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <code className={`flex-1 text-center py-2 rounded-lg text-lg font-mono font-bold tracking-[0.2em] ${
                      isLight ? 'bg-slate-100 text-slate-800' : 'bg-white/5 text-white'
                    }`}>
                      {group.joinCode}
                    </code>
                    <button
                      onClick={() => handleCopyCode(group.joinCode)}
                      className="p-2 rounded-lg bg-blue-500/10 text-blue-500 cursor-pointer"
                    >
                      {copied === group.joinCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Members */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {group.members.map((m) => (
                      <div
                        key={m.uid}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium ${
                          isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-white/60'
                        }`}
                        title={m.email}
                      >
                        {m.photoURL ? (
                          <img src={m.photoURL} alt="" className="w-4 h-4 rounded-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-slate-300 dark:bg-white/20 flex items-center justify-center text-[8px]">
                            {m.displayName[0]?.toUpperCase()}
                          </span>
                        )}
                        {m.displayName}
                        {m.role === 'admin' && <Crown className="w-3 h-3 text-amber-400" />}
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => onSelectGroup(group)}
                      className="flex-1 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Open Tasks
                    </button>
                    {isAdmin ? (
                      <button
                        onClick={() => handleDelete(group.id)}
                        className="p-2 rounded-xl bg-red-500/10 text-red-500 cursor-pointer"
                        title="Delete group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLeave(group.id)}
                        className="p-2 rounded-xl bg-red-500/10 text-red-500 cursor-pointer"
                        title="Leave group"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
