/**
 * AI Service - Google Gemini API Integration
 * Free tier: 15 RPM, 1M tokens/day (Gemini 1.5 Flash)
 */

import { Task, DailyNutritionTarget, MealType, UserProfile, FitnessStats } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.');
  }

  const response = await fetch(`${GEMINI_BASE_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function extractJSON(text: string): any {
  // Try to find JSON in the response
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    } catch {
      // If direct parse fails, try to clean the string
      const cleaned = (jsonMatch[1] || jsonMatch[0]).replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    }
  }
  throw new Error('No JSON found in AI response');
}

// ===== AI TASK BREAKDOWN =====
export interface TaskBreakdown {
  subtasks: { title: string; estimatedMinutes: number; priority: 'high' | 'medium' | 'low' }[];
  totalEstimatedMinutes: number;
  tips: string[];
}

export async function aiBreakdownTask(taskTitle: string, taskDescription?: string): Promise<TaskBreakdown> {
  const prompt = `You are a productivity expert. Break down this task into smaller, actionable subtasks.

Task: "${taskTitle}"
${taskDescription ? `Description: "${taskDescription}"` : ''}

Return ONLY valid JSON (no markdown, no explanation):
{
  "subtasks": [
    { "title": "subtask description", "estimatedMinutes": 15, "priority": "high" | "medium" | "low" }
  ],
  "totalEstimatedMinutes": 60,
  "tips": ["helpful tip 1", "helpful tip 2"]
}

Rules:
- Create 3-8 subtasks
- Each subtask should be completable in 5-60 minutes
- Assign priorities based on importance
- Total should be realistic
- Tips should be actionable`;

  const response = await callGemini(prompt);
  return extractJSON(response);
}

// ===== AI DEADLINE PREDICTOR =====
export interface DeadlinePrediction {
  taskId: string;
  risk: 'high' | 'medium' | 'low';
  probability: number; // 0-100
  reason: string;
  suggestion: string;
}

export async function aiPredictDeadlines(tasks: Task[]): Promise<DeadlinePrediction[]> {
  const taskList = tasks.filter(t => !t.completed && t.dueDate).slice(0, 20).map(t => {
    const daysUntilDue = Math.ceil((new Date(t.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return `ID:${t.id} | "${t.title}" | Priority:${t.priority} | Due in ${daysUntilDue} days | Subtasks:${t.subtasks?.length || 0} completed:${t.subtasks?.filter(s => s.completed).length || 0}`;
  }).join('\n');

  const prompt = `You are a productivity analyst. Predict which tasks are at risk of missing their deadline.

Tasks:
${taskList}

Return ONLY valid JSON (no markdown):
[
  {
    "taskId": "task id",
    "risk": "high" | "medium" | "low",
    "probability": 85,
    "reason": "why this task is at risk",
    "suggestion": "what to do about it"
  }
]

Rules:
- Only include tasks at medium or high risk
- Probability: likelihood of completing on time (lower = more risk)
- Be specific with reasons based on the data
- Give actionable suggestions`;

  const response = await callGemini(prompt);
  return extractJSON(response);
}

// ===== AI DAILY BRIEFING =====
export interface DailyBriefing {
  summary: string;
  priorities: string[];
  tips: string[];
  motivationalMessage: string;
  focusSuggestion: string;
}

export async function aiGenerateBriefing(
  tasks: Task[],
  fitnessStats: FitnessStats,
  language: string
): Promise<DailyBriefing> {
  const now = new Date();
  const pending = tasks.filter(t => !t.completed);
  const overdue = pending.filter(t => new Date(t.dueDate) < now);
  const dueToday = pending.filter(t => {
    const d = new Date(t.dueDate);
    return d.toDateString() === now.toDateString();
  });

  const taskSummary = `Total: ${tasks.length}, Pending: ${pending.length}, Overdue: ${overdue.length}, Due today: ${dueToday.length}
Overdue: ${overdue.map(t => `"${t.title}" (${t.priority})`).join(', ') || 'none'}
Due today: ${dueToday.map(t => `"${t.title}" (${t.priority})`).join(', ') || 'none'}
Fitness streak: ${fitnessStats.currentStreak} days, Total workouts: ${fitnessStats.totalWorkouts}`;

  const prompt = `You are a personal productivity coach. Generate a daily briefing for the user.

Current time: ${now.toLocaleTimeString()}
Day: ${now.toLocaleDateString('en-US', { weekday: 'long' })}

Task Data:
${taskSummary}

Respond in ${language === 'sr' ? 'Serbian' : language === 'de' ? 'German' : language === 'fr' ? 'French' : 'English'}.

Return ONLY valid JSON (no markdown):
{
  "summary": "brief 2-3 sentence overview of the day",
  "priorities": ["top priority task 1", "top priority task 2", "top priority task 3"],
  "tips": ["actionable tip 1", "actionable tip 2"],
  "motivationalMessage": "short motivational quote or message",
  "focusSuggestion": "what to focus on first and why"
}

Rules:
- Be concise and actionable
- Prioritize overdue tasks first
- Reference specific tasks by name
- Keep it encouraging but realistic`;

  const response = await callGemini(prompt);
  return extractJSON(response);
}

// ===== AI WORKOUT SUGGESTIONS =====
export interface WorkoutSuggestion {
  name: string;
  exercises: { name: string; sets: number; reps: string; rest: string; notes?: string }[];
  estimatedMinutes: number;
  targetMuscles: string[];
  reason: string;
}

export async function aiSuggestWorkout(
  fitnessStats: FitnessStats,
  goals: string[],
  experienceLevel: string,
  availableTime: number
): Promise<WorkoutSuggestion[]> {
  const muscleRanks = Object.entries(fitnessStats.muscleRanks)
    .map(([muscle, data]) => `${muscle}: ${data.rank} (${data.xp} XP)`)
    .join(', ');

  const prompt = `You are a personal trainer. Suggest workouts based on the user's profile.

Fitness Stats:
- Rank: ${fitnessStats.rank}
- XP: ${fitnessStats.xp}
- Workouts: ${fitnessStats.totalWorkouts}
- Streak: ${fitnessStats.currentStreak} days
- Muscle Ranks: ${muscleRanks}

Goals: ${goals.join(', ')}
Experience: ${experienceLevel}
Available time: ${availableTime} minutes

Return ONLY valid JSON (no markdown):
[
  {
    "name": "Workout Name",
    "exercises": [
      { "name": "Exercise Name", "sets": 3, "reps": "8-12", "rest": "90s", "notes": "optional tip" }
    ],
    "estimatedMinutes": 45,
    "targetMuscles": ["chest", "triceps"],
    "reason": "why this workout is recommended"
  }
]

Rules:
- Suggest 1-3 workouts
- Focus on weaker muscle groups (lower rank)
- Match experience level
- Include progressive overload tips
- Be specific with sets/reps`;

  const response = await callGemini(prompt);
  return extractJSON(response);
}

// ===== AI MEAL PLAN GENERATOR =====
export interface GeneratedMealPlan {
  name: string;
  dailyTarget: DailyNutritionTarget;
  meals: {
    mealType: MealType;
    name: string;
    foods: { name: string; amount: string; calories: number; protein: number; carbs: number; fat: number }[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
  }[];
  tips: string[];
}

export async function aiGenerateMealPlan(
  target: DailyNutritionTarget,
  goal: string,
  restrictions: string[],
  preferences: string
): Promise<GeneratedMealPlan> {
  const prompt = `You are a nutrition expert. Generate a detailed meal plan.

Daily Targets:
- Calories: ${target.calories} kcal
- Protein: ${target.protein}g
- Carbs: ${target.carbs}g
- Fat: ${target.fat}g

Goal: ${goal}
Dietary restrictions: ${restrictions.join(', ') || 'none'}
Preferences: ${preferences || 'none'}

Return ONLY valid JSON (no markdown):
{
  "name": "Meal Plan Name",
  "dailyTarget": { "calories": ${target.calories}, "protein": ${target.protein}, "carbs": ${target.carbs}, "fat": ${target.fat} },
  "meals": [
    {
      "mealType": "breakfast" | "lunch" | "dinner" | "snack",
      "name": "Meal Name",
      "foods": [
        { "name": "Food Name", "amount": "100g", "calories": 200, "protein": 20, "carbs": 10, "fat": 5 }
      ],
      "totalCalories": 400,
      "totalProtein": 30,
      "totalCarbs": 40,
      "totalFat": 15
    }
  ],
  "tips": ["nutrition tip 1", "nutrition tip 2"]
}

Rules:
- Include breakfast, lunch, dinner, and 1-2 snacks
- Foods should be simple and widely available
- Totals should match the daily targets closely (within 10%)
- Give practical, easy-to-prepare meals
- Include variety across meals`;

  const response = await callGemini(prompt);
  return extractJSON(response);
}

// ===== AI FOOD SEARCH (estimated nutrition) =====
export interface FoodEstimate {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

export async function aiEstimateFood(foodName: string, amount: string): Promise<FoodEstimate> {
  const prompt = `Estimate the nutritional content of this food.

Food: ${foodName}
Amount: ${amount}

Return ONLY valid JSON (no markdown):
{
  "name": "Standard food name",
  "calories": 250,
  "protein": 20,
  "carbs": 30,
  "fat": 8,
  "servingSize": "1 serving (200g)"
}

Rules:
- Use standard USDA nutritional data
- Be accurate with common portion sizes
- Round to whole numbers`;

  const response = await callGemini(prompt);
  return extractJSON(response);
}

export function isAIConfigured(): boolean {
  return !!GEMINI_API_KEY;
}
