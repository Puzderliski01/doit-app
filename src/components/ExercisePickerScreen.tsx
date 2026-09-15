import React, { useState, useMemo } from 'react';
import { Exercise, MuscleGroup } from '../types';
import {
  ALL_EXERCISES,
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUP_COLORS,
  MUSCLE_GROUP_ICONS,
} from '../utils/fitness';
import { haptic } from '../utils/haptics';
import {
  ArrowLeft,
  Search,
  X,
  Dumbbell,
  Filter,
} from 'lucide-react';

interface ExercisePickerScreenProps {
  theme: 'dark' | 'light';
  onSelectExercise: (exercise: Exercise) => void;
  onBack: () => void;
}

const EQUIPMENT_TYPES = [
  { id: 'all', label: 'All', icon: '🏋️' },
  { id: 'bodyweight', label: 'Bodyweight', icon: '🏃' },
  { id: 'barbell', label: 'Barbell', icon: '🏋️' },
  { id: 'dumbbell', label: 'Dumbbell', icon: '💪' },
  { id: 'machine', label: 'Machine', icon: '⚙️' },
] as const;

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'legs', 'glutes', 'core', 'cardio', 'full_body',
];

export const ExercisePickerScreen: React.FC<ExercisePickerScreenProps> = ({
  theme,
  onSelectExercise,
  onBack,
}) => {
  const isLight = theme === 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');

  const filteredExercises = useMemo(() => {
    let exercises = ALL_EXERCISES;

    // Filter by muscle group
    if (selectedMuscle) {
      exercises = exercises.filter(e => e.muscleGroup === selectedMuscle);
    }

    // Filter by equipment type
    if (selectedEquipment !== 'all') {
      exercises = exercises.filter(e => e.type === selectedEquipment || 
        (selectedEquipment === 'bodyweight' && e.type === 'bodyweight') ||
        (selectedEquipment === 'cardio' && e.type === 'cardio')
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      exercises = exercises.filter(e => 
        e.name.toLowerCase().includes(q) ||
        MUSCLE_GROUP_LABELS[e.muscleGroup].toLowerCase().includes(q)
      );
    }

    return exercises;
  }, [searchQuery, selectedMuscle, selectedEquipment]);

  const groupedExercises = useMemo(() => {
    const groups: Record<string, Exercise[]> = {};
    filteredExercises.forEach(exercise => {
      const key = exercise.muscleGroup;
      if (!groups[key]) groups[key] = [];
      groups[key].push(exercise);
    });
    return groups;
  }, [filteredExercises]);

  const getExerciseEmoji = (exercise: Exercise): string => {
    const emojiMap: Record<string, string> = {
      // Chest
      pushup: '🏋️', bench_press: ' bench', incline_bench: '🏋️', decline_bench: '🏋️',
      db_bench: '🏋️', db_incline: '🏋️', db_fly: '🦅', cable_fly: '🦅', pec_deck: '🦅',
      // Back
      pullup: '💪', deadlift: '🏋️', barbell_row: '🚣', db_row: '🚣',
      lat_pulldown: '⬇️', cable_row: '🚣', pendlay_row: '🚣', inverted_row: '🚣',
      // Shoulders
      overhead_press: '⬆️', db_shoulder_press: '⬆️', db_lateral_raise: '🦅',
      db_front_raise: '⬆️', shoulder_press_machine: '⬆️', shrug: '🤷', db_shrug: '🤷',
      // Biceps
      chinup: '💪', barbell_curl: '💪', db_curl: '💪', db_hammer_curl: '💪',
      bicep_curl_machine: '💪',
      // Triceps
      dip: '🦾', skull_crusher: '💀', db_tricep_ext: '🦾', tricep_pushdown: '⬇️',
      // Legs
      squat: '🏋️', front_squat: '🏋️', squat_bw: '🦵', lunge: '🦵',
      db_lunge: '🦵', db_squat: '🏋️', leg_press: '🦵', leg_extension: '🦵',
      leg_curl: '🦵', calf_raise: '🦵', calf_raise_machine: '🦵', romanian_deadlift: '🏋️',
      db_rdl: '🏋️',
      // Glutes
      hip_thrust: '🍑', glute_bridge: '🍑', glute_kickback: '🍑',
      // Core
      plank: '🧘', crunch: '🔥', russian_twist: '🔄', leg_raise: '🦵',
      ab_crunch_machine: '🔥',
      // Cardio
      jumping_jack: '⭐', burpee: '🔥', mountain_climber: '⛰️',
      // Full Body
      muscle_up: '🏆',
    };
    return emojiMap[exercise.id] || '🏋️';
  };

  const getEquipmentType = (exercise: Exercise): string => {
    if (exercise.type === 'bodyweight') return 'bodyweight';
    if (exercise.type === 'cardio') return 'cardio';
    if (exercise.id.includes('cable') || exercise.id.includes('machine') || 
        exercise.id.includes('leg_press') || exercise.id.includes('pec_deck') ||
        exercise.id.includes('lat_pulldown')) return 'machine';
    if (exercise.id.includes('db_') || exercise.id.includes('dumbbell')) return 'dumbbell';
    return 'barbell';
  };

  return (
    <div className={`exercise-picker-fullscreen ${
      isLight ? 'bg-white' : 'bg-[#0a0a0a]'
    }`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 backdrop-blur-xl border-b ${
        isLight 
          ? 'bg-white/90 border-black/[0.04]' 
          : 'bg-[#0a0a0a]/90 border-white/[0.06]'
      }`}>
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => { haptic.lightTap(); onBack(); }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/10 text-white/70'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className={`text-lg font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
              Choose Exercise
            </h1>
            <p className={`text-xs ${isLight ? 'text-[#888]' : 'text-white/50'}`}>
              {filteredExercises.length} exercises available
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className={`relative flex items-center rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
          }`}>
            <Search className={`w-4 h-4 ml-3 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercises..."
              className={`flex-1 px-3 py-2.5 bg-transparent text-sm outline-none ${
                isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-white/30'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`mr-2 p-1 rounded-full ${isLight ? 'text-slate-400' : 'text-white/40'}`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Muscle Group Filter Chips */}
        <div className="px-4 pb-3 overflow-x-auto scrollbar-none">
          <div className="flex gap-2">
            <button
              onClick={() => { haptic.lightTap(); setSelectedMuscle(null); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                !selectedMuscle
                  ? 'bg-neon-400 text-[#0a0a0a]'
                  : isLight
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-white/10 text-white/60'
              }`}
            >
              All Muscles
            </button>
            {MUSCLE_GROUPS.map(muscle => (
              <button
                key={muscle}
                onClick={() => { haptic.lightTap(); setSelectedMuscle(selectedMuscle === muscle ? null : muscle); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                  selectedMuscle === muscle
                    ? 'text-white'
                    : isLight
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-white/10 text-white/60'
                }`}
                style={selectedMuscle === muscle ? { backgroundColor: MUSCLE_GROUP_COLORS[muscle] } : {}}
              >
                <span>{MUSCLE_GROUP_ICONS[muscle]}</span>
                <span>{MUSCLE_GROUP_LABELS[muscle]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Equipment Filter */}
        <div className="px-4 pb-3">
          <div className="flex gap-2">
            {EQUIPMENT_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => { haptic.lightTap(); setSelectedEquipment(type.id); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedEquipment === type.id
                    ? isLight
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-black'
                    : isLight
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-white/10 text-white/60'
                }`}
              >
                <span className="mr-1">{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Exercise List */}
      <div className="px-4 py-4 pb-24">
        {filteredExercises.length === 0 ? (
          <div className="text-center py-12">
            <Dumbbell className={`w-12 h-12 mx-auto mb-3 ${isLight ? 'text-slate-300' : 'text-white/20'}`} />
            <p className={`text-sm font-medium ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              No exercises found
            </p>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedExercises).map(([muscleGroup, exercises]) => (
              <div key={muscleGroup}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{MUSCLE_GROUP_ICONS[muscleGroup as MuscleGroup]}</span>
                  <h3 className={`text-sm font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                    {MUSCLE_GROUP_LABELS[muscleGroup as MuscleGroup]}
                  </h3>
                  <span className={`text-xs ${isLight ? 'text-[#888]' : 'text-white/40'}`}>
                    ({exercises.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {exercises.map(exercise => (
                    <button
                      key={exercise.id}
                      onClick={() => { haptic.mediumClick(); onSelectExercise(exercise); }}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all active:scale-[0.98] ${
                        isLight
                          ? 'bg-white border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]'
                          : 'bg-[#1a1a1a] border border-white/[0.06] hover:border-white/[0.12]'
                      }`}
                    >
                      {/* Exercise Visual */}
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
                        style={{ 
                          backgroundColor: `${MUSCLE_GROUP_COLORS[exercise.muscleGroup]}15`,
                        }}
                      >
                        {getExerciseEmoji(exercise)}
                      </div>
                      
                      {/* Exercise Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-bold truncate ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                          {exercise.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span 
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ 
                              backgroundColor: `${MUSCLE_GROUP_COLORS[exercise.muscleGroup]}20`,
                              color: MUSCLE_GROUP_COLORS[exercise.muscleGroup],
                            }}
                          >
                            {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
                          </span>
                          <span className={`text-[10px] font-medium ${isLight ? 'text-[#888]' : 'text-white/40'}`}>
                            {exercise.type === 'bodyweight' ? '🏃 Bodyweight' :
                             exercise.type === 'strength' ? '🏋️ Weight' :
                             exercise.type === 'cardio' ? '❤️ Cardio' : '🔄 Flex'}
                          </span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className={`shrink-0 ${isLight ? 'text-slate-300' : 'text-white/20'}`}>
                        →
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
