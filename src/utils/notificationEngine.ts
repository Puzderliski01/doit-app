import { AppNotification, NotificationLog, Task, NotificationType } from '../types';
import { haptic } from './haptics';
import { formatDateTime } from './dateHelpers';

const NOTIFICATIONS_STORAGE_KEY = 'doit_notification_logs_v2';
const APP_NOTIFICATIONS_STORAGE_KEY = 'doit_app_notifications_v1';

// Subtle Web Audio API chime generator for pleasant native-feeling sounds
const playNotificationSound = (type: NotificationType) => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    
    if (type === 'urgent_priority' || type === 'overdue') {
      // Alert chime (double high pulse)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(660, now + 0.1);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'subtask_complete' || type === 'achievement') {
      // Harmonic major chord chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else {
      // Subtle gentle bell chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch {}
};

export const notificationEngine = {
  // In-App Notifications
  getAppNotifications(): AppNotification[] {
    try {
      const data = localStorage.getItem(APP_NOTIFICATIONS_STORAGE_KEY);
      if (!data) {
        return [];
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveAppNotifications(notifications: AppNotification[]) {
    try {
      localStorage.setItem(APP_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    } catch {}
  },

  deleteAppNotification(id: string): AppNotification[] {
    const current = this.getAppNotifications();
    const updated = current.filter(n => n.id !== id);
    this.saveAppNotifications(updated);
    return updated;
  },

  pushAppNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): AppNotification {
    const newNotif: AppNotification = {
      ...notification,
      id: 'app-notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      read: false
    };

    // Play feedback sound and haptic
    playNotificationSound(newNotif.type);
    if (newNotif.type === 'overdue' || newNotif.type === 'urgent_priority') {
      haptic.priorityAlert();
    } else if (newNotif.type === 'subtask_complete' || newNotif.type === 'achievement') {
      haptic.success();
    } else {
      haptic.lightTap();
    }

    // Send native browser notification as well
    this.sendBrowserNotification(newNotif.title, newNotif.message);

    const current = this.getAppNotifications();
    const updated = [newNotif, ...current].slice(0, 50);
    this.saveAppNotifications(updated);
    return newNotif;
  },

  markAllAsRead(): AppNotification[] {
    const current = this.getAppNotifications();
    const updated = current.map(n => ({ ...n, read: true }));
    this.saveAppNotifications(updated);
    return updated;
  },

  clearAppNotifications(): AppNotification[] {
    this.saveAppNotifications([]);
    return [];
  },

  // Email Logs
  getLogs(): NotificationLog[] {
    try {
      const data = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveLogs(logs: NotificationLog[]) {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(logs));
    } catch {}
  },

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  },

  hasPermission(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    return Notification.permission === 'granted';
  },

  sendBrowserNotification(title: string, body: string) {
    if (this.hasPermission()) {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
      } catch {}
    }
  },

  /**
   * Generates a simulated dispatch of an email reminder
   */
  dispatchEmailReminder(task: Task, recipientEmail: string): NotificationLog {
    haptic.priorityAlert();

    const dueFormatted = formatDateTime(task.dueDate);
    const title = `🚨 Due Date Alert: "${task.title}"`;
    const snippet = `Your task "${task.title}" is due soon (${dueFormatted}). Priority: ${task.priority.toUpperCase()}. Estimated time: ${task.estimatedMinutes || 30} mins.`;

    this.sendBrowserNotification(title, snippet);

    const log: NotificationLog = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      taskId: task.id,
      taskTitle: task.title,
      dueTimestamp: task.dueDate,
      scheduledFor: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      recipientEmail: recipientEmail || task.reminderEmail || 's.puzderliski@gmail.com',
      status: 'delivered',
      previewSnippet: snippet
    };

    const current = this.getLogs();
    const updated = [log, ...current].slice(0, 50); // keep last 50
    this.saveLogs(updated);

    // Also push to in-app notifications
    this.pushAppNotification({
      type: 'deadline',
      title: `⏰ Upcoming Deadline: "${task.title}"`,
      message: `Due at ${dueFormatted} (${task.priority.toUpperCase()} priority)`,
      taskId: task.id,
      actionLabel: 'View Task',
      actionType: 'view_task'
    });

    return log;
  },

  generateHtmlEmailTemplate(task: Task, recipientEmail: string): string {
    const dueFormatted = formatDateTime(task.dueDate);
    const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
      urgent: { bg: '#450a0a', text: '#f87171', border: '#ef4444' },
      high: { bg: '#451a03', text: '#fb923c', border: '#f97316' },
      medium: { bg: '#172554', text: '#60a5fa', border: '#3b82f6' },
      low: { bg: '#14532d', text: '#4ade80', border: '#22c55e' }
    };

    const color = priorityColors[task.priority] || priorityColors.medium;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 24px; }
    .email-container { max-width: 580px; margin: 0 auto; background: #18181b; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; }
    .header { padding: 28px 32px; background: linear-gradient(180deg, #27272a 0%, #18181b 100%); border-bottom: 1px solid rgba(255,255,255,0.06); }
    .logo { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .content { padding: 32px; }
    .task-title { font-size: 20px; font-weight: 700; margin: 16px 0 8px 0; color: #ffffff; }
    .task-desc { font-size: 14px; line-height: 1.6; color: #a1a1aa; margin-bottom: 24px; }
    .meta-grid { background: #09090b; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 18px; margin-bottom: 24px; }
    .meta-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .meta-label { color: #71717a; }
    .meta-value { color: #e4e4e7; font-weight: 600; }
    .cta-button { display: inline-block; background: #f59e0b; color: #000000; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none; }
    .footer { padding: 20px 32px; font-size: 12px; color: #52525b; border-top: 1px solid rgba(255,255,255,0.05); text-align: center; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="logo">⚡ DoIT <span style="font-weight: 400; font-size: 14px; color: #a1a1aa;">Suite</span></span>
        <span class="badge" style="background: ${color.bg}; color: ${color.text}; border: 1px solid ${color.border};">
          ${task.priority.toUpperCase()} PRIORITY
        </span>
      </div>
    </div>
    <div class="content">
      <div style="font-size: 13px; color: #f59e0b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Upcoming Deadline Reminder</div>
      <div class="task-title">${task.title}</div>
      <div class="task-desc">${task.description || 'No additional notes provided for this task.'}</div>
      
      <div class="meta-grid">
        <div class="meta-row">
          <span class="meta-label">Target Deadline:</span>
          <span class="meta-value" style="color: #fca5a5;">${dueFormatted}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Estimated Effort:</span>
          <span class="meta-value">${task.estimatedMinutes ? task.estimatedMinutes + ' minutes' : '30 minutes'}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Subtasks:</span>
          <span class="meta-value">${task.subtasks.filter(s => s.completed).length} of ${task.subtasks.length} Completed</span>
        </div>
        ${task.recurring.type !== 'none' ? `
        <div class="meta-row">
          <span class="meta-label">Recurrence Schedule:</span>
          <span class="meta-value" style="color: #67e8f9;">Repeats ${task.recurring.type}</span>
        </div>
        ` : ''}
      </div>

      <div style="text-align: center; margin: 28px 0 10px 0;">
        <a href="#" class="cta-button">Open & Complete in DoIT</a>
      </div>
    </div>
    <div class="footer">
      This notification was generated for ${recipientEmail} by DoIT Automated Sync & Reminder Service.
    </div>
  </div>
</body>
</html>
    `.trim();
  }
};
