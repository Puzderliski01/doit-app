import React, { useState } from 'react';
import {
  Dumbbell,
  TrendingUp,
  Heart,
  Zap,
  ChevronRight,
  ChevronLeft,
  Check,
  Scale,
  Ruler,
  Calendar,
} from 'lucide-react';

interface FitnessOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (profile: {
    fitnessMode: boolean;
    weightUnit: 'kg' | 'lbs';
    bodyWeight?: number;
    heightCm?: number;
    goal?: 'lose_weight' | 'gain_muscle' | 'maintain' | 'strength' | 'endurance';
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  }) => void;
  theme: 'dark' | 'light';
}

const GOALS = [
  { id: 'gain_muscle' as const, label: 'Build Muscle', icon: '💪', desc: 'Hypertrophy & size' },
  { id: 'strength' as const, label: 'Get Stronger', icon: '🏋️', desc: 'Max strength & power' },
  { id: 'lose_weight' as const, label: 'Lose Weight', icon: '🔥', desc: 'Fat loss & conditioning' },
  { id: 'endurance' as const, label: 'Endurance', icon: '🏃', desc: 'Stamina & cardio' },
  { id: 'maintain' as const, label: 'Stay Fit', icon: '⚡', desc: 'General fitness' },
];

const EXPERIENCE = [
  { id: 'beginner' as const, label: 'Beginner', desc: '< 1 year training', color: '#22c55e' },
  { id: 'intermediate' as const, label: 'Intermediate', desc: '1-3 years training', color: '#3b82f6' },
  { id: 'advanced' as const, label: 'Advanced', desc: '3+ years training', color: '#a855f7' },
];

export const FitnessOnboarding: React.FC<FitnessOnboardingProps> = ({
  isOpen,
  onClose,
  onComplete,
  theme,
}) => {
  const isLight = theme === 'light';
  const [step, setStep] = useState(0);
  const [isFitness, setIsFitness] = useState<boolean | null>(null);
  const [goal, setGoal] = useState<string>('');
  const [experience, setExperience] = useState<string>('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [bodyWeight, setBodyWeight] = useState('');
  const [height, setHeight] = useState('');

  if (!isOpen) return null;

  const handleComplete = () => {
    onComplete({
      fitnessMode: isFitness === true,
      weightUnit,
      bodyWeight: bodyWeight ? parseFloat(bodyWeight) : undefined,
      heightCm: height ? parseFloat(height) : undefined,
      goal: goal as 'lose_weight' | 'gain_muscle' | 'maintain' | 'strength' | 'endurance' | undefined,
      experienceLevel: experience as 'beginner' | 'intermediate' | 'advanced' | undefined,
    });
  };

  const canProceed = () => {
    if (step === 0) return isFitness !== null;
    if (step === 1) return goal !== '';
    if (step === 2) return experience !== '';
    return true;
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-md ${
      isLight ? 'bg-black/40' : 'bg-black/75'
    }`}>
      <div className={`w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden ${
        isLight
          ? 'bg-white border border-slate-200 text-slate-900'
          : 'bg-[#121215] border border-white/15 text-white'
      }`}>
        <div className="p-6 text-center">
          <div className="flex justify-center gap-1.5 mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`h-1 rounded-full transition-all ${
                i <= step ? 'w-8 bg-amber-500' : `w-4 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`
              }`} />
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center">
                <Dumbbell className="w-8 h-8 text-black" />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Welcome to DoIT
                </h2>
                <p className={`text-sm mt-2 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                  How would you like to use the app?
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => setIsFitness(true)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    isFitness === true
                      ? 'border-amber-500 bg-amber-500/10'
                      : isLight
                      ? 'border-slate-200 hover:border-slate-300 bg-slate-50'
                      : 'border-white/10 hover:border-white/20 bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏋️</span>
                    <div>
                      <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        Fitness & Training
                      </p>
                      <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                        Track workouts, exercises, PRs & progress
                      </p>
                    </div>
                    {isFitness === true && <Check className="w-5 h-5 text-amber-400 ml-auto" />}
                  </div>
                </button>
                <button
                  onClick={() => setIsFitness(false)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    isFitness === false
                      ? 'border-amber-500 bg-amber-500/10'
                      : isLight
                      ? 'border-slate-200 hover:border-slate-300 bg-slate-50'
                      : 'border-white/10 hover:border-white/20 bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📋</span>
                    <div>
                      <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        Task Management
                      </p>
                      <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                        Productivity, tasks, calendar & analytics
                      </p>
                    </div>
                    {isFitness === false && <Check className="w-5 h-5 text-amber-400 ml-auto" />}
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  What's your goal?
                </h2>
                <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                  This helps us personalize your experience
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                      goal === g.id
                        ? 'border-amber-500 bg-amber-500/10'
                        : isLight
                        ? 'border-slate-200 hover:border-slate-300 bg-slate-50'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                  >
                    <span className="text-xl">{g.icon}</span>
                    <p className={`text-xs font-bold mt-1.5 ${isLight ? 'text-slate-800' : 'text-white/90'}`}>
                      {g.label}
                    </p>
                    <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                      {g.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Training experience?
                </h2>
                <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                  Be honest — it helps set the right expectations
                </p>
              </div>
              <div className="space-y-2.5">
                {EXPERIENCE.map((exp) => (
                  <button
                    key={exp.id}
                    onClick={() => setExperience(exp.id)}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${
                      experience === exp.id
                        ? 'border-amber-500 bg-amber-500/10'
                        : isLight
                        ? 'border-slate-200 hover:border-slate-300 bg-slate-50'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ background: exp.color }} />
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-white/90'}`}>
                        {exp.label}
                      </p>
                      <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                        {exp.desc}
                      </p>
                    </div>
                    {experience === exp.id && <Check className="w-5 h-5 text-amber-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Optional details
                </h2>
                <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                  For better progress tracking (you can skip this)
                </p>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                  Weight Unit
                </label>
                <div className="flex gap-2">
                  {(['kg', 'lbs'] as const).map((unit) => (
                    <button
                      key={unit}
                      onClick={() => setWeightUnit(unit)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        weightUnit === unit
                          ? 'bg-amber-500 text-black'
                          : isLight
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                    <Scale className="w-3 h-3 inline mr-1" />
                    Body Weight
                  </label>
                  <input
                    type="number"
                    value={bodyWeight}
                    onChange={(e) => setBodyWeight(e.target.value)}
                    placeholder={`e.g. 80`}
                    className={`w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none ${
                      isLight
                        ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400'
                        : 'bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-amber-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                    <Ruler className="w-3 h-3 inline mr-1" />
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="e.g. 180"
                    className={`w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none ${
                      isLight
                        ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400'
                        : 'bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-amber-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`p-5 border-t flex items-center gap-3 ${
          isLight ? 'border-slate-200' : 'border-white/10'
        }`}>
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isLight
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <ChevronLeft className="w-4 h-4 inline" />
              Back
            </button>
          )}
          <button
            onClick={() => {
              if (step < 3) {
                setStep(step + 1);
              } else {
                handleComplete();
              }
            }}
            disabled={!canProceed()}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-sm shadow-lg shadow-amber-500/25 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {step < 3 ? (
              <>
                Continue
                <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Get Started
                <Zap className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
