import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Task, Category, FitnessEntry, UserProfile } from '../types';

// Extend jsPDF with autotable types
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'URGENT',
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
};

const PRIORITY_COLORS: Record<string, [number, number, number]> = {
  urgent: [220, 53, 69],
  high: [255, 152, 0],
  medium: [33, 150, 243],
  low: [76, 175, 80],
};

const MUSCLE_GROUP_LABELS: Record<string, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs',
  obliques: 'Obliques',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  traps: 'Traps',
  lats: 'Lats',
  full_body: 'Full Body',
};

export function exportTasksPDF(tasks: Task[], categories: Category[]): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(26, 35, 50);
  doc.text('DoIT Tasks Report', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(138, 150, 168);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, 28, { align: 'center' });
  
  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const overdueTasks = tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date()).length;
  
  doc.setFontSize(11);
  doc.setTextColor(60, 70, 88);
  doc.text(`Total: ${totalTasks}  |  Completed: ${completedTasks}  |  Pending: ${pendingTasks}  |  Overdue: ${overdueTasks}`, pageWidth / 2, 38, { align: 'center' });

  // Separator
  doc.setDrawColor(238, 242, 246);
  doc.line(14, 42, pageWidth - 14, 42);

  // Pending Tasks Table
  const pendingTasksList = tasks.filter(t => !t.completed);
  if (pendingTasksList.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(26, 35, 50);
    doc.text('Pending Tasks', 14, 52);

    const pendingData = pendingTasksList
      .sort((a, b) => {
        const po = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (po[a.priority] ?? 3) - (po[b.priority] ?? 3);
      })
      .map(task => {
        const cat = categories.find(c => c.id === task.categoryId);
        const due = new Date(task.dueDate);
        const isOverdue = due < new Date();
        return [
          task.title.slice(0, 40),
          PRIORITY_LABELS[task.priority] || task.priority,
          cat?.name || '-',
          due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          isOverdue ? 'OVERDUE' : '',
          task.subtasks.length > 0 ? `${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length}` : '-',
        ];
      });

    doc.autoTable({
      startY: 56,
      head: [['Task', 'Priority', 'Category', 'Due', 'Status', 'Subtasks']],
      body: pendingData,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [61, 165, 120], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 250, 245] },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        5: { cellWidth: 18, halign: 'center' },
      },
    });
  }

  // Completed Tasks Table
  const completedTasksList = tasks.filter(t => t.completed);
  if (completedTasksList.length > 0) {
    const startY = (doc as any).lastAutoTable?.finalY || 56;
    
    if (startY > 240) {
      doc.addPage();
    }
    
    const actualStart = (doc as any).lastAutoTable?.finalY ? Math.min((doc as any).lastAutoTable.finalY + 10, 260) : 56;
    
    doc.setFontSize(14);
    doc.setTextColor(26, 35, 50);
    doc.text('Completed Tasks', 14, actualStart);

    const completedData = completedTasksList.map(task => {
      const cat = categories.find(c => c.id === task.categoryId);
      return [
        task.title.slice(0, 40),
        PRIORITY_LABELS[task.priority] || task.priority,
        cat?.name || '-',
        task.completedAt ? new Date(task.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-',
        task.subtasks.length > 0 ? `${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length}` : '-',
      ];
    });

    doc.autoTable({
      startY: actualStart + 4,
      head: [['Task', 'Priority', 'Category', 'Completed', 'Subtasks']],
      body: completedData,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [138, 150, 168], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 248, 252] },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
      },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(176, 188, 200);
    doc.text(
      `DoIT Task Management · Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`doit-tasks-${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportFitnessPDF(
  entries: FitnessEntry[],
  profile: UserProfile
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(26, 35, 50);
  doc.text('DoIT Fitness Report', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(138, 150, 168);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, 28, { align: 'center' });

  // Stats summary
  const stats = profile.fitnessStats;
  if (stats) {
    doc.setFontSize(12);
    doc.setTextColor(60, 70, 88);
    const statY = 40;
    
    doc.setFont(undefined, 'bold');
    doc.text('Fitness Overview', 14, statY);
    doc.setFont(undefined, 'normal');
    
    doc.setFontSize(10);
    const statLines = [
      `Level: ${stats.rank || 'N/A'}`,
      `XP: ${stats.xp || 0}`,
      `Total Workouts: ${stats.totalWorkouts || 0}`,
      `Current Streak: ${stats.currentStreak || 0} days`,
      `Best Streak: ${stats.bestStreak || 0} days`,
      `Total Volume: ${((stats.totalVolume || 0) / 1000).toFixed(1)}t`,
    ];
    
    statLines.forEach((line, i) => {
      doc.text(line, 14, statY + 6 + (i * 5.5));
    });

    // Separator
    doc.setDrawColor(238, 242, 246);
    doc.line(14, statY + 6 + (statLines.length * 5.5) + 4, pageWidth - 14, statY + 6 + (statLines.length * 5.5) + 4);
  }

  // Workout History Table
  if (entries.length > 0) {
    const tableStartY = stats ? 40 + 6 + 6 * 5.5 + 12 : 40;
    
    doc.setFontSize(14);
    doc.setTextColor(26, 35, 50);
    doc.text('Workout History', 14, tableStartY);

    const tableData = entries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 50) // Last 50 workouts
      .map(entry => [
        new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        entry.exerciseName,
        MUSCLE_GROUP_LABELS[entry.muscleGroup] || entry.muscleGroup,
        `${entry.sets.length} sets`,
        `${entry.totalVolume.toLocaleString()} ${entry.weightUnit}`,
        entry.durationMinutes ? `${entry.durationMinutes}min` : '-',
        entry.mood || '-',
      ]);

    doc.autoTable({
      startY: tableStartY + 4,
      head: [['Date', 'Exercise', 'Muscle Group', 'Sets', 'Volume', 'Duration', 'Mood']],
      body: tableData,
      styles: { fontSize: 7.5, cellPadding: 2.5 },
      headStyles: { fillColor: [245, 144, 96], textColor: 255 },
      alternateRowStyles: { fillColor: [255, 245, 239] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 24, halign: 'right' },
        5: { cellWidth: 16, halign: 'center' },
        6: { cellWidth: 18, halign: 'center' },
      },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(176, 188, 200);
    doc.text(
      `DoIT Fitness Tracking · Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`doit-fitness-${new Date().toISOString().split('T')[0]}.pdf`);
}
