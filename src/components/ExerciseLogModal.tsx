import React, { useState } from 'react';
import {
  Exercise,
  ExerciseSet,
  FitnessEntry,
  MuscleGroup,
} from '../types';
import {
  searchExercises,
  getExerciseById,
  getDefaultSets,
  calculateTotalVolume,
  calculateOneRepMax,
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUP_ICONS,
  calculateXPForWorkout,
  isBodyweightExercise,
  getMuscleEngagement,
} from '../utils/fitness';
import {
  X,
  Search,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  Dumbbell,
  Zap,
} from 'lucide-react';

function MuscleEngagementPreview({ exerciseId, isLight }: { exerciseId: string; isLight: boolean }) {
  const engagement = getMuscleEngagement(exerciseId);
  const entries = Object.entries(engagement) as [string, number][];
  if (entries.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
        Muscle XP Split
      </p>
      <div className="flex flex-wrap gap-1.5">
        {entries.map(([muscle, percent]) => (
          <span key={muscle} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
            isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-white/60'
          }`}>
            {MUSCLE_GROUP_ICONS[muscle as MuscleGroup]} {MUSCLE_GROUP_LABELS[muscle as MuscleGroup]} {percent}%
          </span>
        ))}
      </div>
    </div>
  );
}

interface ExerciseLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: FitnessEntry) => void;
  theme: 'dark' | 'light';
  weightUnit: 'kg' | 'lbs';
}

export const ExerciseLogModal: React.FC<ExerciseLogModalProps> = ({
  isOpen,
  onClose,
  onSave,
  theme,
  weightUnit,
}) => {
  const isLight = theme === 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [sets, setSets] = useState<ExerciseSet[]>(getDefaultSets());
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showExerciseList, setShowExerciseList] = useState(true);

  const searchResults = searchExercises(searchQuery);

  if (!isOpen) return null;

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowExerciseList(false);
    setSets(getDefaultSets());
  };

  const handleAddSet = () => {
    const lastSet = sets[sets.length - 1];
    setSets([
      ...sets,
      {
        reps: lastSet?.reps || 0,
        weight: lastSet?.weight || 0,
        weightUnit: weightUnit,
        completed: false,
      },
    ]);
  };

  const handleRemoveSet = (index: number) => {
    if (sets.length <= 1) return;
    setSets(sets.filter((_, i) => i !== index));
  };

  const handleUpdateSet = (index: number, field: keyof ExerciseSet, value: string | boolean) => {
    const updated = [...sets];
    if (field === 'reps' || field === 'weight') {
      updated[index] = { ...updated[index], [field]: Math.max(0, parseInt(value as string) || 0) };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setSets(updated);
  };

  const handleSave = () => {
    if (!selectedExercise) return;
    const completedSets = sets.filter((s) => s.completed);
    if (completedSets.length === 0) return;

    const maxWeight = Math.max(...completedSets.map((s) => s.weight));
    const maxReps = Math.max(...completedSets.filter((s) => s.weight === maxWeight).map((s) => s.reps));
    const estimatedOneRepMax = calculateOneRepMax(maxWeight, maxReps);

    const entry: FitnessEntry = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      exerciseId: selectedExercise.id,
      exerciseName: selectedExercise.name,
      muscleGroup: selectedExercise.muscleGroup,
      date,
      sets: sets.map((s) => ({ ...s, weightUnit })),
      totalVolume,
      estimatedOneRepMax,
      weightUnit,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onSave(entry);
    setSelectedExercise(null);
    setSets(getDefaultSets());
    setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
    setShowExerciseList(true);
    onClose();
  };

  const totalVolume = calculateTotalVolume(sets);
  const totalReps = sets.filter((s) => s.completed).reduce((sum, s) => sum + s.reps, 0);
  const isBodyweight = selectedExercise ? isBodyweightExercise(selectedExercise.id) : false;
  const displayVolume = isBodyweight && totalVolume === 0 ? totalReps : totalVolume;
  const volumeUnit = isBodyweight && totalVolume === 0 ? 'reps' : weightUnit;
  const completedCount = sets.filter((s) => s.completed).length;
  const xp = selectedExercise
    ? calculateXPForWorkout({
        ...({} as FitnessEntry),
        exerciseId: selectedExercise.id,
        weightUnit,
        sets,
        totalVolume,
        estimatedOneRepMax: calculateOneRepMax(
          Math.max(...sets.filter((s) => s.completed).map((s) => s.weight), 0),
          Math.max(...sets.filter((s) => s.completed).map((s) => s.reps), 0)
        ),
      })
    : 0;

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-md ${
      isLight ? 'bg-black/40' : 'bg-black/75'
    }`}>
      <div className={`w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col ${
        isLight
          ? 'bg-white border border-slate-200 text-slate-900'
          : 'bg-[#121215] border border-white/15 text-white'
      }`}>
        <div className="p-5 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: isLight ? 'rgb(226 232 240)' : 'rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Log Workout
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                {selectedExercise ? selectedExercise.name : 'Select an exercise'}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-400' : 'bg-white/5 hover:bg-white/10 text-white/60'
            }`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {showExerciseList ? (
            <>
              <div className="relative">
                <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                  isLight ? 'text-slate-400' : 'text-white/40'
                }`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search exercises..."
                  className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none ${
                    isLight
                      ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400'
                      : 'bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-amber-500'
                  }`}
                />
              </div>

              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {Object.entries(
                  searchResults.reduce(
                    (acc, ex) => {
                      const group = ex.muscleGroup;
                      if (!acc[group]) acc[group] = [];
                      acc[group].push(ex);
                      return acc;
                    },
                    {} as Record<MuscleGroup, Exercise[]>
                  )
                ).map(([group, exercises]) => (
                  <div key={group}>
                    <div className={`flex items-center gap-2 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider ${
                      isLight ? 'text-slate-400' : 'text-white/30'
                    }`}>
                      <span>{MUSCLE_GROUP_ICONS[group as MuscleGroup]}</span>
                      <span>{MUSCLE_GROUP_LABELS[group as MuscleGroup]}</span>
                    </div>
                    {exercises.map((exercise) => (
                      <button
                        key={exercise.id}
                        onClick={() => handleSelectExercise(exercise)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                          isLight
                            ? 'hover:bg-slate-50 text-slate-700'
                            : 'hover:bg-white/5 text-white/80'
                        }`}
                      >
                        {exercise.name}
                      </button>
                    ))}
                  </div>
                ))}
                {searchResults.length === 0 && (
                  <p className={`text-center py-8 text-sm ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                    No exercises found
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowExerciseList(true)}
                className={`text-xs font-medium flex items-center gap-1 ${
                  isLight ? 'text-amber-600 hover:text-amber-700' : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <ChevronDown className="w-3 h-3 rotate-90" />
                Change Exercise
              </button>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none ${
                    isLight
                      ? 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-amber-400'
                      : 'bg-white/5 border border-white/10 text-white focus:border-amber-500'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                    Sets
                  </label>
                  <button
                    onClick={handleAddSet}
                    className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Set
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedExercise && isBodyweightExercise(selectedExercise.id) && (
                    <p className={`text-[11px] px-1 ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                      Bodyweight exercise — weight is optional (add weighted vest, etc.)
                    </p>
                  )}
                  {sets.map((set, index) => (
                    <div key={index} className={`flex items-center gap-2 p-2.5 rounded-xl ${
                      isLight ? 'bg-slate-50' : 'bg-white/5'
                    }`}>
                      <span className={`text-xs font-bold w-6 text-center ${
                        set.completed ? 'text-green-400' : isLight ? 'text-slate-400' : 'text-white/30'
                      }`}>
                        {index + 1}
                      </span>
                      <input
                        type="number"
                        value={set.reps || ''}
                        onChange={(e) => handleUpdateSet(index, 'reps', e.target.value)}
                        placeholder="Reps"
                        className={`w-16 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none ${
                          isLight
                            ? 'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400'
                            : 'bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-amber-500'
                        }`}
                      />
                      <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>×</span>
                      <input
                        type="number"
                        value={set.weight || ''}
                        onChange={(e) => handleUpdateSet(index, 'weight', e.target.value)}
                        placeholder={selectedExercise && isBodyweightExercise(selectedExercise.id) ? 'Wt (opt)' : 'Wt'}
                        className={`w-16 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none ${
                          isLight
                            ? 'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400'
                            : 'bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-amber-500'
                        }`}
                      />
                      <span className={`text-[10px] w-5 ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                        {weightUnit}
                      </span>
                      <button
                        onClick={() => handleUpdateSet(index, 'completed', !set.completed)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          set.completed
                            ? 'bg-green-500 text-white'
                            : isLight
                            ? 'bg-slate-200 text-slate-400 hover:bg-slate-300'
                            : 'bg-white/10 text-white/30 hover:bg-white/20'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      {sets.length > 1 && (
                        <button
                          onClick={() => handleRemoveSet(index)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isLight ? 'text-slate-400 hover:text-red-500' : 'text-white/30 hover:text-red-400'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How did it feel? Any PRs?"
                  rows={2}
                  className={`w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none ${
                    isLight
                      ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400'
                      : 'bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-amber-500'
                  }`}
                />
              </div>

              <div className={`p-3 rounded-xl space-y-2 ${
                isLight ? 'bg-amber-50 border border-amber-200' : 'bg-amber-500/10 border border-amber-500/20'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                      Volume: {displayVolume} {volumeUnit}
                    </p>
                    <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                      {completedCount} sets completed
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    <Zap className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">+{xp} XP</span>
                  </div>
                </div>
                {selectedExercise && (
                  <MuscleEngagementPreview exerciseId={selectedExercise.id} isLight={isLight} />
                )}
              </div>
            </>
          )}
        </div>

        {!showExerciseList && (
          <div className="p-5 border-t shrink-0"
            style={{ borderColor: isLight ? 'rgb(226 232 240)' : 'rgba(255,255,255,0.1)' }}>
            <button
              onClick={handleSave}
              disabled={completedCount === 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-sm shadow-lg shadow-amber-500/25 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save Workout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
