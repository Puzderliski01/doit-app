import { RecurringConfig } from '../types';

export function calculateNextDueDate(baseDateStr: string, config: RecurringConfig): string {
  const current = baseDateStr ? new Date(baseDateStr) : new Date();
  if (isNaN(current.getTime())) {
    return new Date().toISOString();
  }

  const next = new Date(current.getTime());

  switch (config.type) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;

    case 'weekdays': {
      // Advance to next Mon-Fri
      do {
        next.setDate(next.getDate() + 1);
      } while (next.getDay() === 0 || next.getDay() === 6);
      break;
    }

    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;

    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;

    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;

    case 'custom': {
      const days = config.customDays && config.customDays > 0 ? config.customDays : 1;
      next.setDate(next.getDate() + days);
      break;
    }

    case 'none':
    default:
      return baseDateStr;
  }

  // Format as YYYY-MM-DDTHH:mm
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = next.getFullYear();
  const month = pad(next.getMonth() + 1);
  const day = pad(next.getDate());
  const hours = pad(next.getHours());
  const minutes = pad(next.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function getRecurringLabel(config: RecurringConfig): string {
  switch (config.type) {
    case 'daily':
      return 'Repeats Daily';
    case 'weekdays':
      return 'Repeats Weekdays';
    case 'weekly':
      return 'Repeats Weekly';
    case 'biweekly':
      return 'Repeats Every 2 Weeks';
    case 'monthly':
      return 'Repeats Monthly';
    case 'custom':
      return `Repeats Every ${config.customDays || 1} Days`;
    default:
      return '';
  }
}
