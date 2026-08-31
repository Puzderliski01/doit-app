import React, { useState, useMemo } from 'react';
import { MealEntry, FoodItem, DailyNutritionTarget, MealType } from '../types';
import { Apple, Plus, Trash2, Sparkles, ChevronDown, ChevronUp, Utensils, Coffee, Sun, Moon } from 'lucide-react';
import { haptic } from '../utils/haptics';
import { aiGenerateMealPlan, isAIConfigured, GeneratedMealPlan } from '../utils/ai';

interface MealPlanProps {
  theme: 'dark' | 'light';
  entries: MealEntry[];
  dailyTarget: DailyNutritionTarget;
  onAddEntry: (entry: Omit<MealEntry, 'id' | 'createdAt'>) => void;
  onDeleteEntry: (id: string) => void;
  onUpdateTarget: (target: DailyNutritionTarget) => void;
}

const MEAL_TYPES: { type: MealType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'breakfast', label: 'Breakfast', icon: <Coffee className="w-4 h-4" />, color: '#f59e0b' },
  { type: 'lunch', label: 'Lunch', icon: <Sun className="w-4 h-4" />, color: '#3b82f6' },
  { type: 'dinner', label: 'Dinner', icon: <Moon className="w-4 h-4" />, color: '#8b5cf6' },
  { type: 'snack', label: 'Snacks', icon: <Apple className="w-4 h-4" />, color: '#22c55e' },
];

const COMMON_FOODS: FoodItem[] = [
  { id: 'f1', name: 'Chicken Breast (grilled)', calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: '100', servingUnit: 'g' },
  { id: 'f2', name: 'Brown Rice', calories: 112, protein: 2.6, carbs: 24, fat: 0.9, servingSize: '100', servingUnit: 'g' },
  { id: 'f3', name: 'Broccoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, servingSize: '100', servingUnit: 'g' },
  { id: 'f4', name: 'Egg (whole)', calories: 78, protein: 6, carbs: 0.6, fat: 5, servingSize: '1', servingUnit: 'large' },
  { id: 'f5', name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, servingSize: '1', servingUnit: 'medium' },
  { id: 'f6', name: 'Oatmeal', calories: 68, protein: 2.4, carbs: 12, fat: 1.4, servingSize: '100', servingUnit: 'g' },
  { id: 'f7', name: 'Greek Yogurt', calories: 59, protein: 10, carbs: 3.6, fat: 0.7, servingSize: '100', servingUnit: 'g' },
  { id: 'f8', name: 'Salmon (baked)', calories: 208, protein: 20, carbs: 0, fat: 13, servingSize: '100', servingUnit: 'g' },
  { id: 'f9', name: 'Sweet Potato', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, servingSize: '100', servingUnit: 'g' },
  { id: 'f10', name: 'Almonds', calories: 579, protein: 21, carbs: 22, fat: 50, servingSize: '100', servingUnit: 'g' },
  { id: 'f11', name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, servingSize: '1', servingUnit: 'medium' },
  { id: 'f12', name: 'Whole Wheat Bread', calories: 247, protein: 13, carbs: 41, fat: 3.4, servingSize: '100', servingUnit: 'g' },
  { id: 'f13', name: 'Avocado', calories: 160, protein: 2, carbs: 9, fat: 15, servingSize: '100', servingUnit: 'g' },
  { id: 'f14', name: 'Tuna (canned)', calories: 116, protein: 26, carbs: 0, fat: 1, servingSize: '100', servingUnit: 'g' },
  { id: 'f15', name: 'Cottage Cheese', calories: 98, protein: 11, carbs: 3.4, fat: 4.3, servingSize: '100', servingUnit: 'g' },
];

export const MealPlanView: React.FC<MealPlanProps> = ({
  theme,
  entries,
  dailyTarget,
  onAddEntry,
  onDeleteEntry,
  onUpdateTarget,
}) => {
  const isLight = theme === 'light';
  const [showAdd, setShowAdd] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
  const [foodSearch, setFoodSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [expandedMeal, setExpandedMeal] = useState<MealType | null>(null);
  const [showTargetEdit, setShowTargetEdit] = useState(false);
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState<GeneratedMealPlan | null>(null);
  const [tempTarget, setTempTarget] = useState({ ...dailyTarget });

  const today = new Date().toISOString().split('T')[0];
  const todayEntries = useMemo(() => entries.filter((e) => e.date === today), [entries, today]);

  const totals = useMemo(() => {
    const t = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    todayEntries.forEach((e) => {
      t.calories += e.foodItem.calories * e.quantity;
      t.protein += e.foodItem.protein * e.quantity;
      t.carbs += e.foodItem.carbs * e.quantity;
      t.fat += e.foodItem.fat * e.quantity;
    });
    return t;
  }, [todayEntries]);

  const filteredFoods = COMMON_FOODS.filter((f) =>
    f.name.toLowerCase().includes(foodSearch.toLowerCase())
  );

  const handleAddFood = () => {
    if (!selectedFood) return;
    haptic.mediumClick();
    onAddEntry({
      foodItem: selectedFood,
      quantity: parseFloat(quantity) || 1,
      mealType: selectedMealType,
      date: today,
    });
    setSelectedFood(null);
    setFoodSearch('');
    setQuantity('1');
    setShowAdd(false);
  };

  const handleGenerateAI = async () => {
    if (!isAIConfigured()) return;
    setAiLoading(true);
    try {
      const plan = await aiGenerateMealPlan(dailyTarget, 'maintain', [], '');
      setAiPlan(plan);
    } catch (err) {
      console.warn('AI meal plan error:', err);
    }
    setAiLoading(false);
  };

  const handleApplyAIPlan = (plan: GeneratedMealPlan) => {
    plan.meals.forEach((meal) => {
      meal.foods.forEach((food) => {
        onAddEntry({
          foodItem: {
            id: `ai-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: food.name,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
            servingSize: food.amount,
            servingUnit: 'serving',
          },
          quantity: 1,
          mealType: meal.mealType,
          date: today,
        });
      });
    });
    setShowAIGenerate(false);
    setAiPlan(null);
  };

  const getPercent = (current: number, target: number) =>
    target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Nutrition</h1>
          <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Track your meals and macros</p>
        </div>
        <div className="flex gap-2">
          {isAIConfigured() && (
            <button
              onClick={() => { haptic.lightTap(); setShowAIGenerate(!showAIGenerate); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                showAIGenerate ? 'bg-purple-500 text-white border-purple-500' : isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-white/70'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> AI Plan
            </button>
          )}
          <button
            onClick={() => { haptic.lightTap(); setShowAdd(!showAdd); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              showAdd ? 'bg-orange-500 text-white border-orange-500' : isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-white/70'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Log Food
          </button>
        </div>
      </div>

      {/* Daily Progress */}
      <div className={`rounded-2xl p-5 border liquid-glass-card ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Today's Intake</h3>
          <button onClick={() => { haptic.lightTap(); setShowTargetEdit(!showTargetEdit); }} className={`text-[10px] font-semibold cursor-pointer ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
            {showTargetEdit ? 'Done' : 'Edit Target'}
          </button>
        </div>

        {/* Calories */}
        <div className="text-center mb-4">
          <div className="relative inline-block">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8" className={isLight ? 'stroke-slate-100' : 'stroke-white/[0.06]'} />
              <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8" strokeLinecap="round" stroke="#f97316" className="rotate-[-90deg] origin-center transition-all duration-700" strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - getPercent(totals.calories, dailyTarget.calories) / 100)}`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{Math.round(totals.calories)}</span>
              <span className={`text-[9px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>/ {dailyTarget.calories} kcal</span>
            </div>
          </div>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-3">
          {([
            { label: 'Protein', current: totals.protein, target: dailyTarget.protein, color: '#3b82f6', unit: 'g' },
            { label: 'Carbs', current: totals.carbs, target: dailyTarget.carbs, color: '#22c55e', unit: 'g' },
            { label: 'Fat', current: totals.fat, target: dailyTarget.fat, color: '#f59e0b', unit: 'g' },
          ]).map((macro) => (
            <div key={macro.label} className={`p-3 rounded-xl text-center ${isLight ? 'bg-slate-50' : 'bg-white/5'}`}>
              <p className={`text-[10px] font-semibold mb-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{macro.label}</p>
              <p className="text-sm font-bold" style={{ color: macro.color }}>{Math.round(macro.current)}{macro.unit}</p>
              <p className={`text-[9px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>/ {macro.target}{macro.unit}</p>
              <div className={`h-1 rounded-full mt-1.5 overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                <div className="h-full rounded-full transition-all" style={{ width: `${getPercent(macro.current, macro.target)}%`, background: macro.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Target Editor */}
        {showTargetEdit && (
          <div className={`mt-4 p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
            <div className="grid grid-cols-4 gap-2">
              {(['calories', 'protein', 'carbs', 'fat'] as const).map((key) => (
                <div key={key}>
                  <label className={`text-[10px] font-semibold capitalize ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{key}</label>
                  <input type="number" value={tempTarget[key]} onChange={(e) => setTempTarget({ ...tempTarget, [key]: Number(e.target.value) })} className={`w-full px-2 py-1.5 rounded-lg border text-xs text-center ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`} />
                </div>
              ))}
            </div>
            <button onClick={() => { onUpdateTarget(tempTarget); setShowTargetEdit(false); }} className="w-full mt-2 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold cursor-pointer">Save Target</button>
          </div>
        )}
      </div>

      {/* AI Meal Plan Generator */}
      {showAIGenerate && (
        <div className={`rounded-2xl p-4 border liquid-glass-card ${isLight ? 'border-purple-200' : 'border-purple-500/20'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <h3 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>AI Meal Plan Generator</h3>
          </div>
          {aiLoading ? (
            <div className="text-center py-6">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Generating your personalized meal plan...</p>
            </div>
          ) : aiPlan ? (
            <div className="space-y-3">
              <p className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{aiPlan.name}</p>
              {aiPlan.meals.map((meal, i) => (
                <div key={i} className={`p-3 rounded-xl ${isLight ? 'bg-slate-50' : 'bg-white/5'}`}>
                  <p className={`text-xs font-bold capitalize mb-1 ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                    {MEAL_TYPES.find((m) => m.type === meal.mealType)?.icon} {meal.mealType}: {meal.name}
                  </p>
                  <div className="space-y-1">
                    {meal.foods.map((food, j) => (
                      <p key={j} className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                        {food.name} ({food.amount}) — {food.calories} kcal, P:{food.protein}g C:{food.carbs}g F:{food.fat}g
                      </p>
                    ))}
                  </div>
                  <p className={`text-[10px] mt-1 font-semibold ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
                    Total: {meal.totalCalories} kcal | P: {meal.totalProtein}g | C: {meal.totalCarbs}g | F: {meal.totalFat}g
                  </p>
                </div>
              ))}
              <div className="flex gap-2">
                <button onClick={() => handleApplyAIPlan(aiPlan)} className="flex-1 py-2.5 rounded-xl bg-purple-500 text-white text-xs font-bold cursor-pointer">Apply Plan</button>
                <button onClick={() => setAiPlan(null)} className={`px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-white/60'}`}>Discard</button>
              </div>
            </div>
          ) : (
            <div>
              <p className={`text-xs mb-3 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Generate a personalized meal plan based on your targets.</p>
              <button onClick={handleGenerateAI} className="w-full py-2.5 rounded-xl bg-purple-500 text-white text-xs font-bold cursor-pointer">Generate AI Meal Plan</button>
            </div>
          )}
        </div>
      )}

      {/* Add Food Form */}
      {showAdd && (
        <div className={`rounded-2xl p-4 border liquid-glass-card ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
          <p className={`text-xs font-semibold mb-3 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>Log Food</p>
          {/* Meal Type Selector */}
          <div className="flex gap-2 mb-3">
            {MEAL_TYPES.map((mt) => (
              <button key={mt.type} onClick={() => setSelectedMealType(mt.type)} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-semibold transition-all cursor-pointer border ${
                selectedMealType === mt.type ? 'text-white border-transparent' : isLight ? 'text-slate-500 border-slate-200' : 'text-white/40 border-white/10'
              }`} style={selectedMealType === mt.type ? { background: mt.color, borderColor: mt.color } : {}}>
                {mt.icon} {mt.label}
              </button>
            ))}
          </div>
          {/* Search */}
          <input type="text" value={foodSearch} onChange={(e) => { setFoodSearch(e.target.value); setSelectedFood(null); }} placeholder="Search food..." className={`w-full px-4 py-2.5 rounded-xl border text-sm mb-2 ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'}`} />
          {/* Food List */}
          {!selectedFood && foodSearch && (
            <div className={`max-h-40 overflow-y-auto rounded-xl border ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              {filteredFoods.map((food) => (
                <button key={food.id} onClick={() => { setSelectedFood(food); setFoodSearch(food.name); }} className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between cursor-pointer ${isLight ? 'hover:bg-slate-50 border-b border-slate-100' : 'hover:bg-white/5 border-b border-white/5'}`}>
                  <span className={isLight ? 'text-slate-700' : 'text-white/70'}>{food.name}</span>
                  <span className={`font-mono ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{food.calories} kcal</span>
                </button>
              ))}
              {filteredFoods.length === 0 && <p className={`p-3 text-xs text-center ${isLight ? 'text-slate-400' : 'text-white/30'}`}>No foods found</p>}
            </div>
          )}
          {/* Quantity + Add */}
          {selectedFood && (
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className={`text-[10px] font-semibold ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Quantity (servings)</label>
                <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="0.1" step="0.1" className={`w-full px-3 py-2 rounded-xl border text-sm text-center ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'}`} />
              </div>
              <button onClick={handleAddFood} className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold cursor-pointer">Add</button>
            </div>
          )}
        </div>
      )}

      {/* Meals by Type */}
      {MEAL_TYPES.map((mt) => {
        const mealEntries = todayEntries.filter((e) => e.mealType === mt.type);
        const mealCalories = mealEntries.reduce((sum, e) => sum + e.foodItem.calories * e.quantity, 0);
        const isExpanded = expandedMeal === mt.type;
        if (mealEntries.length === 0 && !showAdd) return null;
        return (
          <div key={mt.type} className={`rounded-2xl border overflow-hidden liquid-glass-card ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
            <div onClick={() => { haptic.lightTap(); setExpandedMeal(isExpanded ? null : mt.type); }} className={`px-4 py-3 flex items-center gap-3 cursor-pointer ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${mt.color}20`, color: mt.color }}>
                {mt.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{mt.label}</p>
                <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{mealEntries.length} items · {Math.round(mealCalories)} kcal</p>
              </div>
              {isExpanded ? <ChevronUp className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-white/40'}`} /> : <ChevronDown className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />}
            </div>
            {isExpanded && (
              <div className={`px-4 pb-3 space-y-2 border-t ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                {mealEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${isLight ? 'text-slate-700' : 'text-white/70'}`}>{entry.foodItem.name}</p>
                      <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                        {entry.quantity}x · {Math.round(entry.foodItem.calories * entry.quantity)} kcal · P:{Math.round(entry.foodItem.protein * entry.quantity)}g
                      </p>
                    </div>
                    <button onClick={() => { haptic.deleteAction(); onDeleteEntry(entry.id); }} className="p-1 rounded-lg text-red-400 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
