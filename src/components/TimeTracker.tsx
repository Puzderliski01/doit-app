import React, { useState, useEffect, useRef } from 'react';
import { Task, TimeEntry } from '../types';
import { formatDuration, getTotalTrackedTime } from '../utils/taskHelpers';
import { Play, Pause, Square, Clock, Plus, Trash2, Edit3 } from 'lucide-react';

interface TimeTrackerProps {
  task: Task;
  theme: 'dark' | 'light';
  onStartTimer: (taskId: string) => void;
  onStopTimer: (taskId: string) => void;
  onAddTimeEntry: (taskId: string, entry: TimeEntry) => void;
  onDeleteTimeEntry: (taskId: string, entryId: string) => void;
}

export const TimeTracker: React.FC<TimeTrackerProps> = ({
  task,
  theme,
  onStartTimer,
  onStopTimer,
  onAddTimeEntry,
  onDeleteTimeEntry,
}) => {
  const isLight = theme === 'light';
  const [elapsed, setElapsed] = useState(0);
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualMinutes, setManualMinutes] = useState('');
  const [manualNote, setManualNote] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isRunning = !!task.timerStartedAt;
  const totalTime = getTotalTrackedTime(task);

  // Live timer
  useEffect(() => {
    if (isRunning && task.timerStartedAt) {
      const startTime = new Date(task.timerStartedAt).getTime();
      const updateElapsed = () => setElapsed(Date.now() - startTime);
      updateElapsed();
      intervalRef.current = setInterval(updateElapsed, 1000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    } else {
      setElapsed(0);
    }
  }, [isRunning, task.timerStartedAt]);

  const handleAddManual = () => {
    const minutes = parseInt(manualMinutes) || 0;
    if (minutes > 0) {
      const entry: TimeEntry = {
        id: `te-${Date.now()}`,
        start: new Date(Date.now() - minutes * 60000).toISOString(),
        end: new Date().toISOString(),
        durationMs: minutes * 60000,
        note: manualNote.trim() || undefined,
      };
      onAddTimeEntry(task.id, entry);
      setManualMinutes('');
      setManualNote('');
      setShowAddManual(false);
    }
  };

  return (
    <div className={`rounded-xl p-3 border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
            Time Tracking
          </span>
        </div>
        {task.estimatedMinutes && (
          <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
            Est: {task.estimatedMinutes}m
          </span>
        )}
      </div>

      {/* Timer Display */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex-1 text-center py-3 rounded-xl font-mono text-2xl font-bold tracking-wider ${
          isRunning
            ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400'
            : isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/5 text-white/70'
        }`}>
          {isRunning ? formatDuration(elapsed) : formatDuration(totalTime)}
        </div>
        
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => isRunning ? onStopTimer(task.id) : onStartTimer(task.id)}
            className={`p-2.5 rounded-xl transition-all ${
              isRunning
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
            }`}
          >
            {isRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowAddManual(!showAddManual)}
            className={`p-2.5 rounded-xl transition-all ${
              isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Estimated vs Actual */}
      {task.estimatedMinutes && totalTime > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Progress</span>
            <span className={`text-[10px] font-bold ${
              totalTime <= task.estimatedMinutes * 60000 ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {Math.round((totalTime / (task.estimatedMinutes * 60000)) * 100)}%
            </span>
          </div>
          <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (totalTime / (task.estimatedMinutes * 60000)) * 100)}%`,
                background: totalTime <= task.estimatedMinutes * 60000 ? '#22c55e' : '#f59e0b',
              }}
            />
          </div>
        </div>
      )}

      {/* Manual Entry Form */}
      {showAddManual && (
        <div className={`p-3 rounded-xl mb-3 space-y-2 ${isLight ? 'bg-white border border-slate-200' : 'bg-[#1a1a1f] border border-white/10'}`}>
          <input
            type="number"
            value={manualMinutes}
            onChange={(e) => setManualMinutes(e.target.value)}
            placeholder="Minutes"
            min="1"
            max="480"
            className={`w-full rounded-lg px-3 py-1.5 text-xs focus:outline-none ${
              isLight
                ? 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-blue-400'
                : 'bg-white/5 border border-white/10 text-white focus:border-blue-500'
            }`}
          />
          <input
            type="text"
            value={manualNote}
            onChange={(e) => setManualNote(e.target.value)}
            placeholder="Note (optional)"
            className={`w-full rounded-lg px-3 py-1.5 text-xs focus:outline-none ${
              isLight
                ? 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-blue-400'
                : 'bg-white/5 border border-white/10 text-white focus:border-blue-500'
            }`}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddManual(false)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium ${
                isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-white/50'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleAddManual}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-blue-500 text-white"
            >
              Add Time
            </button>
          </div>
        </div>
      )}

      {/* Time Entries List */}
      {task.timeEntries && task.timeEntries.length > 0 && (
        <div className="space-y-1.5 max-h-32 overflow-y-auto">
          {task.timeEntries.slice().reverse().map((entry) => (
            <div
              key={entry.id}
              className={`flex items-center justify-between p-2 rounded-lg ${isLight ? 'bg-white' : 'bg-white/[0.03]'}`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                  {formatDuration(entry.durationMs)}
                </span>
                {entry.note && (
                  <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                    {entry.note}
                  </span>
                )}
              </div>
              <button
                onClick={() => onDeleteTimeEntry(task.id, entry.id)}
                className={`p-1 rounded ${isLight ? 'text-slate-300 hover:text-red-500' : 'text-white/20 hover:text-red-400'}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
