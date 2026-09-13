import { auth } from '../firebase';
import { Task, Category } from '../types';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

function getAccessToken(): string | null {
  const user = auth.currentUser;
  if (!user) return null;
  // Firebase stores the OAuth access token internally
  // We need to get it from the provider data or use getIdToken
  return (user as any).accessToken || null;
}

async function getValidToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  
  // Try to get the access token from the user's provider data
  const providerData = user.providerData;
  for (const provider of providerData) {
    if (provider.providerId === 'google.com') {
      // Get a fresh ID token which includes the calendar scope
      const idToken = await user.getIdToken(true);
      return idToken;
    }
  }
  
  throw new Error('Google account not connected');
}

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  colorId?: string;
  reminders?: { useDefault: boolean; overrides?: { method: string; minutes: number }[] };
}

// Map task priority to Google Calendar color IDs
const PRIORITY_COLORS: Record<string, string> = {
  urgent: '11',  // Red
  high: '6',     // Orange
  medium: '7',   // Cyan
  low: '2',      // Green
};

export async function syncTaskToCalendar(
  task: Task,
  category?: Category
): Promise<string | null> {
  try {
    const token = await getValidToken();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const startDate = new Date(task.dueDate);
    const endDate = new Date(startDate.getTime() + (task.estimatedMinutes || 30) * 60000);
    
    const description = [
      task.description || '',
      task.priority !== 'medium' ? `Priority: ${task.priority.toUpperCase()}` : '',
      category ? `Category: ${category.name}` : '',
      task.subtasks.length > 0 ? `\nSubtasks:\n${task.subtasks.map(s => `${s.completed ? '✓' : '○'} ${s.title}`).join('\n')}` : '',
      task.tags.length > 0 ? `Tags: ${task.tags.join(', ')}` : '',
    ].filter(Boolean).join('\n');

    const event = {
      summary: task.title,
      description,
      start: { dateTime: startDate.toISOString(), timeZone },
      end: { dateTime: endDate.toISOString(), timeZone },
      colorId: PRIORITY_COLORS[task.priority] || '7',
      reminders: {
        useDefault: true,
      },
    };

    const response = await fetch(
      `${CALENDAR_API_BASE}/calendars/primary/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      console.error('[Calendar] Failed to create event:', err);
      throw new Error(err.error?.message || 'Failed to create calendar event');
    }

    const created = await response.json();
    return created.id;
  } catch (err) {
    console.error('[Calendar] Sync error:', err);
    throw err;
  }
}

export async function updateCalendarEvent(
  eventId: string,
  task: Task,
  category?: Category
): Promise<void> {
  try {
    const token = await getValidToken();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const startDate = new Date(task.dueDate);
    const endDate = new Date(startDate.getTime() + (task.estimatedMinutes || 30) * 60000);
    
    const description = [
      task.description || '',
      task.priority !== 'medium' ? `Priority: ${task.priority.toUpperCase()}` : '',
      category ? `Category: ${category.name}` : '',
      task.subtasks.length > 0 ? `\nSubtasks:\n${task.subtasks.map(s => `${s.completed ? '✓' : '○'} ${s.title}`).join('\n')}` : '',
      task.tags.length > 0 ? `Tags: ${task.tags.join(', ')}` : '',
    ].filter(Boolean).join('\n');

    const event = {
      summary: task.title,
      description,
      start: { dateTime: startDate.toISOString(), timeZone },
      end: { dateTime: endDate.toISOString(), timeZone },
      colorId: PRIORITY_COLORS[task.priority] || '7',
    };

    const response = await fetch(
      `${CALENDAR_API_BASE}/calendars/primary/events/${eventId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      console.error('[Calendar] Failed to update event:', err);
    }
  } catch (err) {
    console.error('[Calendar] Update error:', err);
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  try {
    const token = await getValidToken();
    await fetch(
      `${CALENDAR_API_BASE}/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );
  } catch (err) {
    console.error('[Calendar] Delete error:', err);
  }
}

export async function syncAllTasks(
  tasks: Task[],
  categories: Category[],
  existingEventIds: Map<string, string>
): Promise<{ synced: number; errors: number }> {
  let synced = 0;
  let errors = 0;

  for (const task of tasks) {
    if (task.completed) continue;
    const category = categories.find(c => c.id === task.categoryId);
    
    try {
      if (existingEventIds.has(task.id)) {
        await updateCalendarEvent(existingEventIds.get(task.id)!, task, category);
      } else {
        const eventId = await syncTaskToCalendar(task, category);
        if (eventId) {
          existingEventIds.set(task.id, eventId);
        }
      }
      synced++;
    } catch {
      errors++;
    }
  }

  return { synced, errors };
}
