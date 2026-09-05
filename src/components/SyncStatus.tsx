import { useState, useEffect } from 'react';
import { RefreshCw, Cloud, CloudOff, CheckCircle, AlertTriangle, Wifi, WifiOff, Dumbbell } from 'lucide-react';
import { Task, AuthUser, FitnessEntry } from '../types';
import { saveUserTaskToFirestore, saveFitnessEntryToFirestore } from '../firebase';
import { haptic } from '../utils/haptics';

interface SyncStatusProps {
  theme: 'light' | 'dark';
  currentUser: AuthUser | null;
  tasks: Task[];
  fitnessEntries: FitnessEntry[];
  canSync: boolean;
  lastSyncTime: string;
  isLight: boolean;
}

export function SyncStatus({ theme, currentUser, tasks, fitnessEntries, canSync, lastSyncTime, isLight }: SyncStatusProps) {
  const [isPushing, setIsPushing] = useState(false);
  const [pushResult, setPushResult] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleForceSync = async () => {
    if (!currentUser || !canSync) return;
    haptic.mediumClick();
    setIsPushing(true);
    setPushResult(null);

    let taskSuccess = 0;
    let taskFail = 0;
    let fitnessSuccess = 0;
    let fitnessFail = 0;

    // Push tasks
    for (const task of tasks) {
      try {
        await saveUserTaskToFirestore(currentUser.uid, task);
        taskSuccess++;
      } catch {
        taskFail++;
      }
    }

    // Push fitness entries
    for (const entry of fitnessEntries) {
      try {
        await saveFitnessEntryToFirestore(currentUser.uid, entry);
        fitnessSuccess++;
      } catch {
        fitnessFail++;
      }
    }

    setIsPushing(false);
    const parts: string[] = [];
    if (tasks.length > 0) parts.push(`${taskSuccess}/${tasks.length} tasks`);
    if (fitnessEntries.length > 0) parts.push(`${fitnessSuccess}/${fitnessEntries.length} workouts`);
    const totalFail = taskFail + fitnessFail;
    setPushResult(`Synced ${parts.join(' + ')}${totalFail > 0 ? ` (${totalFail} failed)` : ''}`);

    setTimeout(() => setPushResult(null), 5000);
  };

  const uid = currentUser?.uid ? `${currentUser.uid.substring(0, 8)}...` : 'N/A';

  return (
    <div className={`rounded-2xl border overflow-hidden ${
      isLight
        ? 'bg-white/80 border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.04)] backdrop-blur-xl'
        : 'bg-white/[0.06] border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.15)] backdrop-blur-xl'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${
        isLight ? 'border-slate-100' : 'border-white/5'
      }`}>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className={`w-4 h-4 ${isLight ? 'text-emerald-500' : 'text-emerald-400'}`} />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
            Cloud Sync
          </span>
        </div>
        {canSync ? (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle className="w-3 h-3" /> Active
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
            <AlertTriangle className="w-3 h-3" /> {currentUser?.isGuest ? 'Guest Mode' : 'Offline Only'}
          </span>
        )}
      </div>

      {/* Status Details */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>User ID</span>
          <span className={`text-[11px] font-mono ${isLight ? 'text-slate-700' : 'text-white/70'}`}>{uid}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Local Tasks</span>
          <span className={`text-[11px] font-bold ${isLight ? 'text-slate-700' : 'text-white/70'}`}>{tasks.length}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-[11px] flex items-center gap-1 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
            <Dumbbell className="w-3 h-3" /> Workouts
          </span>
          <span className={`text-[11px] font-bold ${isLight ? 'text-slate-700' : 'text-white/70'}`}>{fitnessEntries.length}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Last Sync</span>
          <span className={`text-[11px] ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
            {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Never'}
          </span>
        </div>

        {/* Force Sync Button */}
        {canSync && (tasks.length > 0 || fitnessEntries.length > 0) && (
          <button
            onClick={handleForceSync}
            disabled={isPushing}
            className={`w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isPushing
                ? 'bg-orange-500/20 text-orange-400 cursor-wait'
                : isLight
                  ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-[0_2px_8px_rgba(249,115,22,0.3)]'
                  : 'bg-orange-500 text-white hover:bg-orange-600 shadow-[0_2px_8px_rgba(249,115,22,0.3)]'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPushing ? 'animate-spin' : ''}`} />
            {isPushing ? 'Syncing...' : 'Force Push All Data to Cloud'}
          </button>
        )}

        {/* Push Result */}
        {pushResult && (
          <div className={`text-[11px] text-center font-medium py-1.5 rounded-lg ${
            pushResult.includes('failed')
              ? 'bg-red-500/10 text-red-400'
              : 'bg-emerald-500/10 text-emerald-400'
          }`}>
            {pushResult}
          </div>
        )}

        {!canSync && currentUser?.isGuest && (
          <div className={`text-[10px] text-center py-2 rounded-lg ${
            isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400'
          }`}>
            Sign in to enable cloud sync. Tasks are stored locally only.
          </div>
        )}
      </div>
    </div>
  );
}
