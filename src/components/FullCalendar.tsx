import React, { useState } from 'react';
import { Task, Category } from '../types';
import { getMonthGrid, getTasksForDate } from '../utils/taskHelpers';
import { ChevronLeft, ChevronRight, Circle, CheckCircle2 } from 'lucide-react';

interface FullCalendarProps {
  tasks: Task[];
  categories: Category[];
  theme: 'dark' | 'light';
  onEditTask: (task: Task) => void;
  onToggleComplete: (taskId: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-sky-500',
  low: 'bg-emerald-500',
};

export const FullCalendar: React.FC<FullCalendarProps> = ({
  tasks,
  categories,
  theme,
  onEditTask,
  onToggleComplete,
}) => {
  const isLight = theme === 'light';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const grid = getMonthGrid(year, month);
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const monthName = currentDate.toLocaleDateString('en', { month: 'long', year: 'numeric' });

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const selectedTasks = selectedDate ? getTasksForDate(tasks, selectedDate) : [];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {monthName}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className={`text-[10px] px-2 py-1 rounded-lg font-medium ${
              isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            Today
          </button>
          <button
            onClick={goToPrevMonth}
            className={`p-1.5 rounded-lg ${isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-white/30 hover:bg-white/5'}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToNextMonth}
            className={`p-1.5 rounded-lg ${isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-white/30 hover:bg-white/5'}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map(day => (
          <div key={day} className={`text-center text-[10px] font-semibold py-1 ${
            isLight ? 'text-slate-400' : 'text-white/30'
          }`}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {grid.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;
          
          const dateStr = date.toISOString().slice(0, 10);
          const isToday = dateStr === todayStr;
          const isSelected = selectedDate?.toISOString().slice(0, 10) === dateStr;
          const dayTasks = getTasksForDate(tasks, date);
          const hasTasks = dayTasks.length > 0;
          const hasIncomplete = dayTasks.some(t => !t.completed);
          const isCurrentMonth = date.getMonth() === month;

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(date)}
              className={`relative flex flex-col items-center py-2 rounded-xl transition-all ${
                isSelected
                  ? 'bg-amber-500/20 ring-1 ring-amber-500'
                  : isToday
                  ? isLight ? 'bg-slate-100' : 'bg-white/5'
                  : isCurrentMonth
                  ? isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]'
                  : 'opacity-30'
              }`}
            >
              <span className={`text-xs font-semibold ${
                isToday ? 'text-amber-500' : isSelected ? 'text-amber-400' : isLight ? 'text-slate-700' : 'text-white/70'
              }`}>
                {date.getDate()}
              </span>
              
              {/* Task dots */}
              {hasTasks && (
                <div className="flex gap-0.5 mt-1">
                  {dayTasks.slice(0, 3).map((task, j) => (
                    <div
                      key={j}
                      className={`w-1 h-1 rounded-full ${task.completed ? 'bg-emerald-400' : PRIORITY_DOT[task.priority] || 'bg-slate-400'}`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Tasks */}
      {selectedDate && (
        <div className={`rounded-2xl border p-4 ${isLight ? 'bg-white border-slate-200' : 'bg-[#1a1a1f] border-white/10'}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
              {selectedDate.toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}
            </h4>
            <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
              {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''}
            </span>
          </div>

          {selectedTasks.length === 0 ? (
            <p className={`text-center py-4 text-[11px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
              No tasks scheduled
            </p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => onEditTask(task)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleComplete(task.id); }}
                    className="shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className={`w-4 h-4 ${isLight ? 'text-slate-300' : 'text-white/20'}`} />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${task.completed ? 'line-through opacity-50' : isLight ? 'text-slate-800' : 'text-white/90'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        task.priority === 'urgent' ? 'bg-red-500' :
                        task.priority === 'high' ? 'bg-orange-500' :
                        task.priority === 'medium' ? 'bg-sky-500' : 'bg-emerald-500'
                      }`} />
                      <span className={`text-[9px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
