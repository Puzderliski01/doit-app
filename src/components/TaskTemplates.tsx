import React, { useState } from 'react';
import { TaskTemplate, Category } from '../types';
import { DEFAULT_TASK_TEMPLATES, createTaskFromTemplate } from '../utils/taskHelpers';
import { Plus, X, Sparkles, ChevronRight } from 'lucide-react';

interface TaskTemplatesProps {
  theme: 'dark' | 'light';
  categories: Category[];
  onUseTemplate: (task: ReturnType<typeof createTaskFromTemplate>) => void;
  onClose: () => void;
}

export const TaskTemplates: React.FC<TaskTemplatesProps> = ({
  theme,
  categories,
  onUseTemplate,
  onClose,
}) => {
  const isLight = theme === 'light';
  const [customTemplates, setCustomTemplates] = useState<TaskTemplate[]>([]);
  const allTemplates = [...DEFAULT_TASK_TEMPLATES, ...customTemplates];

  const handleUseTemplate = (template: TaskTemplate) => {
    const task = createTaskFromTemplate(template);
    onUseTemplate(task);
    onClose();
  };

  return (
    <div className={`rounded-2xl border p-4 ${isLight ? 'bg-white border-slate-200' : 'bg-[#1a1a1f] border-white/10'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Task Templates
          </h3>
        </div>
        <button
          onClick={onClose}
          className={`p-1.5 rounded-lg transition-colors ${
            isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/30 hover:text-white/60'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {allTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => handleUseTemplate(template)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
              isLight
                ? 'bg-slate-50 hover:bg-slate-100 border border-slate-100'
                : 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/5'
            }`}
          >
            <span className="text-xl">{template.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-white/90'}`}>
                {template.name}
              </p>
              <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                {template.description}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {template.estimatedMinutes && (
                  <span className={`text-[9px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                    {template.estimatedMinutes}m
                  </span>
                )}
                {template.subtasks.length > 0 && (
                  <span className={`text-[9px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                    {template.subtasks.length} subtasks
                  </span>
                )}
                {template.recurring.type !== 'none' && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {template.recurring.type}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 shrink-0 ${isLight ? 'text-slate-300' : 'text-white/20'}`} />
          </button>
        ))}
      </div>
    </div>
  );
};
