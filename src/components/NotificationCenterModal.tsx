import React, { useState } from 'react';
import { AppNotification, NotificationLog, Task, NotificationType } from '../types';
import { 
  X, 
  Bell, 
  Mail, 
  Send, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Eye, 
  Trash2, 
  Volume2, 
  Smartphone,
  AlertTriangle,
  Flame,
  Wifi,
  CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { haptic } from '../utils/haptics';
import { notificationEngine } from '../utils/notificationEngine';
import { formatDateTime } from '../utils/dateHelpers';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: NotificationLog[];
  appNotifications: AppNotification[];
  tasks: Task[];
  userEmail: string;
  onUpdateEmail: (email: string) => void;
  onClearLogs: () => void;
  onClearAppNotifications: () => void;
  onDeleteNotification?: (id: string) => void;
  onMarkAllRead: () => void;
  onSendTestReminder: (task: Task, email: string) => void;
  onTriggerAppNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  theme: 'dark' | 'light';
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  logs,
  appNotifications,
  tasks,
  userEmail,
  onUpdateEmail,
  onClearLogs,
  onClearAppNotifications,
  onDeleteNotification,
  onMarkAllRead,
  onSendTestReminder,
  onTriggerAppNotification,
  theme
}) => {
  const [activeTab, setActiveTab] = useState<'app_alerts' | 'logs' | 'preview' | 'settings'>('app_alerts');
  const [selectedTaskForPreview, setSelectedTaskForPreview] = useState<Task>(tasks[0] || null);
  const [emailInput, setEmailInput] = useState(userEmail);
  const [selectedTaskToTrigger, setSelectedTaskToTrigger] = useState<string>(tasks[0]?.id || '');
  const [pushStatus, setPushStatus] = useState(notificationEngine.hasPermission());
  const [notifFilter, setNotifFilter] = useState<'all' | NotificationType>('all');

  if (!isOpen) return null;

  const handleRequestPush = async () => {
    haptic.lightTap();
    const granted = await notificationEngine.requestPermission();
    setPushStatus(granted);
    if (granted) {
      notificationEngine.sendBrowserNotification('DoIT Notification Active', 'Instant deadline reminders are now enabled.');
      haptic.success();
    }
  };

  const handleTriggerEmail = () => {
    const task = tasks.find(t => t.id === selectedTaskToTrigger);
    if (task) {
      haptic.priorityAlert();
      onSendTestReminder(task, emailInput);
      setActiveTab('logs');
    }
  };

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    haptic.success();
    onUpdateEmail(emailInput);
  };

  const filteredAppNotifications = notifFilter === 'all' 
    ? appNotifications 
    : appNotifications.filter(n => n.type === notifFilter);

  const unreadCount = appNotifications.filter(n => !n.read).length;

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'overdue':
      case 'urgent_priority':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'subtask_complete':
      case 'achievement':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'deadline':
        return <Clock className="w-4 h-4 text-orange-400" />;
      case 'sync':
        return <Wifi className="w-4 h-4 text-cyan-400" />;
      case 'daily_briefing':
        return <Flame className="w-4 h-4 text-orange-400" />;
      default:
        return <Bell className="w-4 h-4 text-white/80" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto bg-black/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full sm:max-w-3xl sm:rounded-3xl rounded-t-3xl border border-white/10 shadow-2xl overflow-hidden mb-0 sm:my-8 bg-[#0a0a0c]/95 backdrop-blur-2xl text-white"
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">System Intelligence</div>
              <h2 className="font-light text-lg sm:text-xl text-white tracking-tight">Notification Center & Telemetry</h2>
            </div>
          </div>
          <button
            onClick={() => { haptic.lightTap(); onClose(); }}
            className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-white/[0.01] px-6 sm:px-8 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => { haptic.lightTap(); setActiveTab('app_alerts'); }}
            className={`px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-2 rounded-t-xl cursor-pointer whitespace-nowrap ${
              activeTab === 'app_alerts'
                ? 'bg-white/10 text-orange-400 border-b-2 border-orange-400'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>App Alerts ({appNotifications.length})</span>
            {unreadCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-orange-500 text-black text-[9px] font-black flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { haptic.lightTap(); setActiveTab('logs'); }}
            className={`px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-2 rounded-t-xl cursor-pointer whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-white/10 text-orange-400 border-b-2 border-orange-400'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Logs ({logs.length})</span>
          </button>
          
          <button
            onClick={() => { haptic.lightTap(); setActiveTab('preview'); }}
            className={`px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-2 rounded-t-xl cursor-pointer whitespace-nowrap ${
              activeTab === 'preview'
                ? 'bg-white/10 text-orange-400 border-b-2 border-orange-400'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>HTML Email Template</span>
          </button>

          <button
            onClick={() => { haptic.lightTap(); setActiveTab('settings'); }}
            className={`px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-2 rounded-t-xl cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-white/10 text-orange-400 border-b-2 border-orange-400'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Simulation & Tests</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 max-h-[65vh] overflow-y-auto">
          
          {/* TAB 0: IN-APP ALERTS FEED */}
          {activeTab === 'app_alerts' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50">Filter:</span>
                  {(['all', 'deadline', 'overdue', 'subtask_complete', 'sync'] as const).map(filter => (
                    <button
                      key={filter}
                      onClick={() => {
                        haptic.lightTap();
                        setNotifFilter(filter);
                      }}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        notifFilter === filter
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                          : 'bg-white/5 text-white/40 hover:text-white border border-white/5'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        haptic.lightTap();
                        onMarkAllRead();
                      }}
                      className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Mark all read</span>
                    </button>
                  )}
                  {appNotifications.length > 0 && (
                    <button
                      onClick={() => {
                        haptic.deleteAction();
                        onClearAppNotifications();
                      }}
                      className="flex items-center gap-1 text-xs text-red-400 hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear feed</span>
                    </button>
                  )}
                </div>
              </div>

              {filteredAppNotifications.length === 0 ? (
                <div className="p-10 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                  <Bell className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white/60">No notifications in feed</p>
                  <p className="text-xs text-white/40 mt-1">
                    Notifications appear automatically when tasks complete, deadlines hit, or subtasks finish.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredAppNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                        notif.read 
                          ? 'bg-white/[0.02] border-white/5 opacity-70' 
                          : 'bg-white/[0.05] border-white/15 shadow-lg'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                        {getIconForType(notif.type)}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-white truncate">
                            {notif.title}
                          </h4>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-white/40 font-mono">
                              {formatDateTime(notif.timestamp)}
                            </span>
                            {onDeleteNotification && (
                              <button
                                onClick={() => {
                                  haptic.deleteAction();
                                  onDeleteNotification(notif.id);
                                }}
                                title="Delete notification"
                                className="p-1 rounded-md text-white/30 hover:text-red-400 hover:bg-white/10 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 1: EMAIL DISPATCH LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/50">
                  Real-time record of automated due-date alerts dispatched to your inbox.
                </p>
                {logs.length > 0 && (
                  <button
                    onClick={() => { haptic.deleteAction(); onClearLogs(); }}
                    className="flex items-center gap-1 text-xs text-red-400 hover:underline cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear history</span>
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="p-10 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                  <Mail className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white/60">No email logs dispatched yet</p>
                  <p className="text-xs text-white/40 mt-1">
                    Dispatches automatically when task deadlines approach, or trigger manually from the Simulation tab.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                            DELIVERED
                          </span>
                          <h4 className="text-xs font-bold text-white truncate">
                            {log.taskTitle}
                          </h4>
                        </div>
                        <p className="text-xs text-white/50 line-clamp-2">
                          {log.previewSnippet}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
                          <span>To: {log.recipientEmail}</span>
                          &middot;
                          <span>Sent: {formatDateTime(log.sentAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIVE HTML EMAIL PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                    Select Task for Live Template Rendering:
                  </span>
                </div>
                <select
                  value={selectedTaskForPreview?.id || ''}
                  onChange={(e) => {
                    haptic.lightTap();
                    const t = tasks.find(item => item.id === e.target.value);
                    if (t) setSelectedTaskForPreview(t);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white cursor-pointer"
                >
                  {tasks.map(t => (
                    <option key={t.id} value={t.id} className="bg-[#121216]">{t.title}</option>
                  ))}
                </select>
              </div>

              {selectedTaskForPreview && (
                <div className="border border-white/10 rounded-2xl overflow-hidden shadow-2xl bg-black">
                  <div className="bg-white/5 px-4 py-2 text-[10px] font-mono text-white/50 flex items-center justify-between border-b border-white/10">
                    <span>From: notifications@doit-suite.io</span>
                    <span>To: {userEmail}</span>
                  </div>
                  <div 
                    className="p-4 overflow-x-auto text-zinc-100"
                    dangerouslySetInnerHTML={{
                      __html: notificationEngine.generateHtmlEmailTemplate(selectedTaskForPreview, userEmail)
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRIGGER SIMULATION & CONFIG */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              
              {/* Quick Multi-Trigger Test Bar */}
              <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Interactive Alert Test Suite</span>
                </h4>
                <p className="text-xs text-white/50">
                  Simulate various system alerts to test chimes, haptics, and floating toast notifications:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => {
                      onTriggerAppNotification({
                        type: 'deadline',
                        title: '⏰ Deadline Warning: "Product Launch"',
                        message: 'Due in 25 minutes. High priority action required.',
                        actionLabel: 'View Task'
                      });
                    }}
                    className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-2 transition-colors cursor-pointer text-left"
                  >
                    <Clock className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Deadline Alert</span>
                  </button>

                  <button
                    onClick={() => {
                      onTriggerAppNotification({
                        type: 'subtask_complete',
                        title: '✨ Subtasks 100% Completed!',
                        message: 'All 4 subtasks for "UI Refresh" are finished.',
                        actionLabel: 'Complete Task'
                      });
                    }}
                    className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-2 transition-colors cursor-pointer text-left"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Subtask Done</span>
                  </button>

                  <button
                    onClick={() => {
                      onTriggerAppNotification({
                        type: 'overdue',
                        title: '⚠️ Overdue Task Alert',
                        message: '"Q3 Financial Audit" was due 2 hours ago!',
                        actionLabel: 'Reschedule'
                      });
                    }}
                    className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-2 transition-colors cursor-pointer text-left"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Overdue Warning</span>
                  </button>

                  <button
                    onClick={() => {
                      onTriggerAppNotification({
                        type: 'achievement',
                        title: '🔥 Daily Streak Active!',
                        message: 'You have completed 6 tasks today. Top productivity score!',
                        actionLabel: 'See Analytics'
                      });
                    }}
                    className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-2 transition-colors cursor-pointer text-left"
                  >
                    <Flame className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Streak Milestone</span>
                  </button>

                  <button
                    onClick={() => {
                      onTriggerAppNotification({
                        type: 'sync',
                        title: '🌐 Multi-Device Sync Completed',
                        message: '14 tasks synchronized with Cloud Firestore database.',
                      });
                    }}
                    className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-2 transition-colors cursor-pointer text-left"
                  >
                    <Wifi className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Cloud Sync</span>
                  </button>

                  <button
                    onClick={() => {
                      onTriggerAppNotification({
                        type: 'urgent_priority',
                        title: '🚨 Urgent Priority Task',
                        message: '"Hotfix production security patch" is pending.',
                        actionLabel: 'Open Matrix'
                      });
                    }}
                    className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-2 transition-colors cursor-pointer text-left"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Urgent Alert</span>
                  </button>
                </div>
              </div>

              {/* Email Trigger test */}
              <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/70 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-orange-400" />
                  <span>Send Immediate Test Email Reminder</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <select
                      value={selectedTaskToTrigger}
                      onChange={(e) => setSelectedTaskToTrigger(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold text-white cursor-pointer"
                    >
                      {tasks.map(t => (
                        <option key={t.id} value={t.id} className="bg-[#121216]">
                          [{t.priority.toUpperCase()}] {t.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleTriggerEmail}
                    className="px-5 py-2.5 rounded-2xl bg-white text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-white/90 active:scale-95 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Email</span>
                  </button>
                </div>
              </div>

              {/* Email Config */}
              <form onSubmit={handleSaveEmail} className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/60">
                  Default Target Email Address
                </h4>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs cursor-pointer transition-colors"
                  >
                    Save Email
                  </button>
                </div>
              </form>

              {/* Browser Push Permission Toggle */}
              <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white">Native Browser Push Notifications</h4>
                  <p className="text-xs text-white/40 mt-0.5">Receive popup banners even when tab is backgrounded</p>
                </div>
                <button
                  onClick={handleRequestPush}
                  className={`px-4 py-2 rounded-full font-bold text-xs transition-colors cursor-pointer ${
                    pushStatus 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white text-black hover:bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                  }`}
                >
                  {pushStatus ? 'Permission Granted' : 'Enable Push Alerts'}
                </button>
              </div>

            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};
