/**
 * Date and deadline helper utilities
 */

export function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

export function isValidDate(d: Date): boolean {
  return d instanceof Date && !isNaN(d.getTime());
}

export function isOverdue(dueDateStr: string, completed: boolean): boolean {
  if (completed || !dueDateStr) return false;
  const due = new Date(dueDateStr).getTime();
  const now = Date.now();
  return due < now;
}

export function isDueToday(dueDateStr: string): boolean {
  if (!dueDateStr) return false;
  const due = new Date(dueDateStr);
  const now = new Date();
  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  );
}

export function isDueThisWeek(dueDateStr: string): boolean {
  if (!dueDateStr) return false;
  const due = new Date(dueDateStr);
  const now = new Date();
  const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
}

export function formatDeadlineRelative(dueDateStr: string, completed: boolean): { text: string; status: 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'completed' } {
  if (completed) {
    return { text: 'Completed', status: 'completed' };
  }
  if (!dueDateStr) {
    return { text: 'No deadline', status: 'upcoming' };
  }

  const due = new Date(dueDateStr);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    const absHours = Math.abs(diffHours);
    if (absHours < 24) {
      return { text: `Overdue by ${absHours}h`, status: 'overdue' };
    }
    const absDays = Math.abs(diffDays);
    return { text: `Overdue by ${absDays}d`, status: 'overdue' };
  }

  if (diffHours < 1) {
    const diffMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
    return { text: `Due in ${diffMinutes}m`, status: 'today' };
  }

  if (diffHours < 24 && isDueToday(dueDateStr)) {
    return { text: `Due today in ${diffHours}h`, status: 'today' };
  }

  if (diffDays === 1 || (diffHours >= 24 && diffHours < 48)) {
    return { text: `Tomorrow at ${due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, status: 'tomorrow' };
  }

  if (diffDays <= 7) {
    const dayName = due.toLocaleDateString([], { weekday: 'short' });
    return { text: `${dayName} at ${due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, status: 'upcoming' };
  }

  return {
    text: due.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    status: 'upcoming'
  };
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (!isValidDate(date)) return '';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatISODateInput(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
