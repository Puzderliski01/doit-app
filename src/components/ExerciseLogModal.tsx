import React, { useState } from 'react';
import {
  Exercise,
  ExerciseSet,
  FitnessEntry,
  MuscleGroup,
} from '../types';
import {
  searchExercises,
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
  ChevronUp,
  Dumbbell,
  Zap,
  List,
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

interface ExerciseSlot {
  exercise: Exercise;
  sets: ExerciseSet[];
  notes: string;
}

interface ExerciseLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: FitnessEntry) => void;
  theme: 'dark' | 'light';
  defaultWeightUnit: 'kg' | 'lbs';
}

export const ExerciseLogModal: React.FC<ExerciseLogModalProps> = ({
  isOpen,
  onClose,
  onSave,
  theme,
  defaultWeightUnit,
}) => {
  const isLight = theme === 'light';
  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showExerciseList, setShowExerciseList] = useState(true);

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [sets, setSets] = useState<ExerciseSet[]>(getDefaultSets(defaultWeightUnit));
  const [notes, setNotes] = useState('');

  const [exerciseSlots, setExerciseSlots] = useState<ExerciseSlot[]>([]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);

  const searchResults = searchExercises(searchQuery);

  if (!isOpen) return null;

  const resetState = () => {
    setSelectedExercise(null);
    setSets(getDefaultSets(defaultWeightUnit));
    setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
    setShowExerciseList(true);
    setExerciseSlots([]);
    setActiveSlotIndex(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const buildEntry = (exercise: Exercise, exSets: ExerciseSet[], exNotes: string): FitnessEntry => {
    const completed = exSets.filter((s) => s.completed);
    const totalVol = calculateTotalVolume(exSets);
    const maxW = completed.length > 0 ? Math.max(...completed.map((s) => s.weight)) : 0;
    const maxR = completed.length > 0 ? Math.max(...completed.filter((s) => s.weight === maxW).map((s) => s.reps)) : 0;
    return {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      muscleGroup: exercise.muscleGroup,
      date,
      sets: exSets.map((s) => ({ ...s, weightUnit: defaultWeightUnit })),
      totalVolume: totalVol,
      estimatedOneRepMax: calculateOneRepMax(maxW, maxR),
      weightUnit: defaultWeightUnit,
      notes: exNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
  };

  const handleSaveSingle = () => {
    if (!selectedExercise) return;
    const completedSets = sets.filter((s) => s.completed);
    if (completedSets.length === 0) return;
    onSave(buildEntry(selectedExercise, sets, notes));
    resetState();
    onClose();
  };

  const handleSaveMulti = () => {
    const validSlots = exerciseSlots.filter((slot) =>
      slot.sets.some((s) => s.completed)
    );
    if (validSlots.length === 0) return;
    validSlots.forEach((slot) => {
      onSave(buildEntry(slot.exercise, slot.sets, slot.notes));
    });
    resetState();
    onClose();
  };

  const handleSelectExerciseSingle = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowExerciseList(false);
    setSets(getDefaultSets(defaultWeightUnit));
  };

  const handleAddExerciseMulti = (exercise: Exercise) => {
    const newSlot: ExerciseSlot = {
      exercise,
      sets: getDefaultSets(defaultWeightUnit),
      notes: '',
    };
    setExerciseSlots([...exerciseSlots, newSlot]);
    setActiveSlotIndex(exerciseSlots.length);
    setShowExerciseList(false);
  };

  const handleRemoveSlot = (index: number) => {
    const updated = exerciseSlots.filter((_, i) => i !== index);
    setExerciseSlots(updated);
    if (activeSlotIndex === index) {
      setActiveSlotIndex(updated.length > 0 ? 0 : null);
    } else if (activeSlotIndex !== null && activeSlotIndex > index) {
      setActiveSlotIndex(activeSlotIndex - 1);
    }
  };

  const handleUpdateSlotSets = (slotIdx: number, sets: ExerciseSet[]) => {
    const updated = [...exerciseSlots];
    updated[slotIdx] = { ...updated[slotIdx], sets };
    setExerciseSlots(updated);
  };

  const handleUpdateSlotNotes = (slotIdx: number, notes: string) => {
    const updated = [...exerciseSlots];
    updated[slotIdx] = { ...updated[slotIdx], notes };
    setExerciseSlots(updated);
  };

  const currentSlot = activeSlotIndex !== null ? exerciseSlots[activeSlotIndex] : null;

  const totalXP = mode === 'multi'
    ? exerciseSlots.reduce((sum, slot) => {
        if (!slot.sets.some((s) => s.completed)) return sum;
        return sum + calculateXPForWorkout({
          ...({} as FitnessEntry),
          exerciseId: slot.exercise.id,
          weightUnit: defaultWeightUnit,
          sets: slot.sets,
          totalVolume: calculateTotalVolume(slot.sets),
          estimatedOneRepMax: calculateOneRepMax(
            Math.max(...slot.sets.filter((s) => s.completed).map((s) => s.weight), 0),
            Math.max(...slot.sets.filter((s) => s.completed).map((s) => s.reps), 0)
          ),
        });
      }, 0)
    : selectedExercise
    ? calculateXPForWorkout({
        ...({} as FitnessEntry),
        exerciseId: selectedExercise.id,
        weightUnit: defaultWeightUnit,
        sets,
        totalVolume: calculateTotalVolume(sets),
        estimatedOneRepMax: calculateOneRepMax(
          Math.max(...sets.filter((s) => s.completed).map((s) => s.weight), 0),
          Math.max(...sets.filter((s) => s.completed).map((s) => s.reps), 0)
        ),
      })
    : 0;

  const totalCompletedSets = mode === 'multi'
    ? exerciseSlots.reduce((sum, slot) => sum + slot.sets.filter((s) => s.completed).length, 0)
    : sets.filter((s) => s.completed).length;

  const hasCompleted = mode === 'multi'
    ? exerciseSlots.some((slot) => slot.sets.some((s) => s.completed))
    : sets.some((s) => s.completed);

  const renderSetsUI = (
    exercise: Exercise,
    exSets: ExerciseSet[],
    onUpdateSet: (index: number, field: keyof ExerciseSet, value: string | boolean) => void,
    onAddSet: () => void,
    onRemoveSet: (index: number) => void,
  ) => {
    const isBW = isBodyweightExercise(exercise.id);
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            Sets
          </label>
          <button
            onClick={onAddSet}
            className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Set
          </button>
        </div>
        {isBW && (
          <p className={`text-[11px] px-1 mb-1 ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
            Bodyweight — weight optional (weighted vest, etc.)
          </p>
        )}
        <div className="space-y-2">
          {exSets.map((set, index) => (
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
                onChange={(e) => onUpdateSet(index, 'reps', e.target.value)}
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
                onChange={(e) => onUpdateSet(index, 'weight', e.target.value)}
                placeholder={isBW ? 'Wt (opt)' : 'Wt'}
                className={`w-16 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none ${
                  isLight
                    ? 'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400'
                    : 'bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-amber-500'
                }`}
              />
              <span className={`text-[10px] w-6 font-bold ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                {defaultWeightUnit}
              </span>
              <button
                onClick={() => onUpdateSet(index, 'completed', !set.completed)}
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
              {exSets.length > 1 && (
                <button
                  onClick={() => onRemoveSet(index)}
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
    );
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-md ${
      isLight ? 'bg-black/40' : 'bg-black/75'
    }`}>
      <div className={`w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col ${
        isLight
          ? 'bg-white/80 border border-white/40 text-slate-900 backdrop-blur-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_8px_40px_rgba(0,0,0,0.12)]'
          : 'bg-[#121215]/80 border border-white/15 text-white backdrop-blur-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_40px_rgba(0,0,0,0.5)]'
      }`}>
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between shrink-0 backdrop-blur-2xl"
          style={{ borderColor: isLight ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Log Workout
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                {mode === 'single'
                  ? (selectedExercise ? selectedExercise.name : 'Select an exercise')
                  : `${exerciseSlots.length} exercise${exerciseSlots.length !== 1 ? 's' : ''} added`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMode(mode === 'single' ? 'multi' : 'single');
                resetState();
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'multi'
                  ? 'bg-amber-500 text-black'
                  : isLight
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              {mode === 'single' ? 'Full Workout' : 'Single'}
            </button>
            <button onClick={handleClose}
              className={`p-2 rounded-xl transition-colors ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-400' : 'bg-white/5 hover:bg-white/10 text-white/60'
              }`}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
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
                      ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-40'
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
                        onClick={() => mode === 'single'
                          ? handleSelectExerciseSingle(exercise)
                          : handleAddExerciseMulti(exercise)
                        }
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

              {mode === 'multi' && exerciseSlots.length > 0 && (
                <button
                  onClick={() => setShowExerciseList(false)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-sm shadow-lg shadow-amber-500/25 active:scale-[0.99] transition-all"
                >
                  Done Adding ({exerciseSlots.length} exercises)
                </button>
              )}
            </>
          ) : mode === 'single' ? (
            /* SINGLE EXERCISE MODE */
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

              {selectedExercise && renderSetsUI(
                selectedExercise,
                sets,
                (i, field, val) => {
                  const updated = [...sets];
                  if (field === 'reps' || field === 'weight') {
                    updated[i] = { ...updated[i], [field]: Math.max(0, parseInt(val as string) || 0) };
                  } else {
                    updated[i] = { ...updated[i], [field]: val };
                  }
                  setSets(updated);
                },
                () => {
                  const last = sets[sets.length - 1];
                  setSets([...sets, { reps: last?.reps || 0, weight: last?.weight || 0, weightUnit: defaultWeightUnit, completed: false }]);
                },
                (i) => { if (sets.length > 1) setSets(sets.filter((_, idx) => idx !== i)); },
              )}

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
                      Volume: {isBodyweightExercise(selectedExercise?.id || '') && calculateTotalVolume(sets) === 0
                        ? `${sets.filter((s) => s.completed).reduce((sum, s) => sum + s.reps, 0)} reps`
                        : `${calculateTotalVolume(sets)} ${defaultWeightUnit}`}
                    </p>
                    <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                      {totalCompletedSets} sets completed
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    <Zap className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">+{totalXP} XP</span>
                  </div>
                </div>
                {selectedExercise && (
                  <MuscleEngagementPreview exerciseId={selectedExercise.id} isLight={isLight} />
                )}
              </div>
            </>
          ) : (
            /* MULTI EXERCISE (FULL WORKOUT) MODE */
            <>
              <button
                onClick={() => setShowExerciseList(true)}
                className={`text-xs font-medium flex items-center gap-1 ${
                  isLight ? 'text-amber-600 hover:text-amber-700' : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <Plus className="w-3 h-3" />
                Add Exercise
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

              <div className="space-y-3">
                {exerciseSlots.map((slot, idx) => {
                  const isOpen = activeSlotIndex === idx;
                  const completedInSlot = slot.sets.filter((s) => s.completed).length;
                  return (
                    <div key={idx} className={`rounded-xl border overflow-hidden ${
                      isLight ? 'border-slate-200' : 'border-white/10'
                    }`}>
                      <button
                        onClick={() => setActiveSlotIndex(isOpen ? null : idx)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium ${
                          isLight ? 'bg-slate-50 text-slate-800' : 'bg-white/5 text-white/80'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                            {idx + 1}.
                          </span>
                          <span>{slot.exercise.name}</span>
                          {completedInSlot > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                              {completedInSlot} done
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveSlot(idx); }}
                            className={`p-1 rounded-lg transition-colors ${
                              isLight ? 'text-slate-400 hover:text-red-500' : 'text-white/30 hover:text-red-400'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>
                      {isOpen && (
                        <div className={`p-3 space-y-3 ${isLight ? 'bg-white' : 'bg-[#121215]'}`}>
                          {renderSetsUI(
                            slot.exercise,
                            slot.sets,
                            (i, field, val) => {
                              const updated = [...slot.sets];
                              if (field === 'reps' || field === 'weight') {
                                updated[i] = { ...updated[i], [field]: Math.max(0, parseInt(val as string) || 0) };
                              } else {
                                updated[i] = { ...updated[i], [field]: val };
                              }
                              handleUpdateSlotSets(idx, updated);
                            },
                            () => {
                              const last = slot.sets[slot.sets.length - 1];
                              handleUpdateSlotSets(idx, [...slot.sets, { reps: last?.reps || 0, weight: last?.weight || 0, weightUnit: defaultWeightUnit, completed: false }]);
                            },
                            (i) => { if (slot.sets.length > 1) handleUpdateSlotSets(idx, slot.sets.filter((_, j) => j !== i)); },
                          )}
                          <div>
                            <input
                              type="text"
                              value={slot.notes}
                              onChange={(e) => handleUpdateSlotNotes(idx, e.target.value)}
                              placeholder="Notes (optional)"
                              className={`w-full rounded-lg px-3 py-1.5 text-xs focus:outline-none ${
                                isLight
                                  ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400'
                                  : 'bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-amber-500'
                              }`}
                            />
                          </div>
                          <MuscleEngagementPreview exerciseId={slot.exercise.id} isLight={isLight} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {exerciseSlots.length === 0 && (
                <div className={`text-center py-8 rounded-xl ${isLight ? 'bg-slate-50' : 'bg-white/5'}`}>
                  <Dumbbell className={`w-8 h-8 mx-auto mb-2 ${isLight ? 'text-slate-300' : 'text-white/20'}`} />
                  <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                    Tap "Add Exercise" to start building your workout
                  </p>
                </div>
              )}

              <div className={`p-3 rounded-xl space-y-2 ${
                isLight ? 'bg-amber-50 border border-amber-200' : 'bg-amber-500/10 border border-amber-500/20'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                      {exerciseSlots.length} exercise{exerciseSlots.length !== 1 ? 's' : ''} · {totalCompletedSets} sets
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    <Zap className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">+{totalXP} XP</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {((!showExerciseList && mode === 'single') || (mode === 'multi' && exerciseSlots.length > 0)) && (
          <div className="p-5 border-t shrink-0"
            style={{ borderColor: isLight ? 'rgb(226 232 240)' : 'rgba(255,255,255,0.1)' }}>
            <button
              onClick={mode === 'single' ? handleSaveSingle : handleSaveMulti}
              disabled={!hasCompleted}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-sm shadow-lg shadow-amber-500/25 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {mode === 'single' ? 'Save Workout' : `Save Workout (${exerciseSlots.filter((s) => s.sets.some((s) => s.completed)).length} exercises)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
