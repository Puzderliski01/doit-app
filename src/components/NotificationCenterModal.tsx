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
  CheckCheck,
  RefreshCw
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

  const isLight = theme === 'light';

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
        return <AlertTriangle className={`w-4 h-4 ${isLight ? 'text-red-500' : 'text-red-400'}`} />;
      case 'subtask_complete':
      case 'achievement':
        return <Sparkles className={`w-4 h-4 ${isLight ? 'text-amber-500' : 'text-amber-400'}`} />;
      case 'deadline':
        return <Clock className={`w-4 h-4 ${isLight ? 'text-orange-500' : 'text-orange-400'}`} />;
      case 'sync':
        return <Wifi className={`w-4 h-4 ${isLight ? 'text-cyan-500' : 'text-cyan-400'}`} />;
      case 'daily_briefing':
        return <Flame className={`w-4 h-4 ${isLight ? 'text-orange-500' : 'text-orange-400'}`} />;
      case 'recurring':
        return <RefreshCw className={`w-4 h-4 ${isLight ? 'text-purple-500' : 'text-purple-400'}`} />;
      default:
        return <Bell className={`w-4 h-4 ${isLight ? 'text-slate-600' : 'text-white/80'}`} />;
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto backdrop-blur-xl ${
      isLight ? 'bg-black/40' : 'bg-black/80'
    }`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`w-full sm:max-w-3xl sm:rounded-3xl rounded-t-3xl border shadow-2xl overflow-hidden mb-0 sm:my-8 backdrop-blur-2xl ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-[0_8px_40px_rgba(0,0,0,0.12)]'
            : 'bg-[#0a0a0c]/95 border-white/10 text-white'
        }`}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className={`w-10 h-1 rounded-full ${isLight ? 'bg-slate-300' : 'bg-white/20'}`} />
        </div>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 sm:px-8 py-5 border-b backdrop-blur-xl ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.02]'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.25)] ${
              isLight ? 'bg-orange-50 border-orange-200 text-orange-500' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
            }`}>
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-[10px] uppercase tracking-[0.2em] font-bold ${
                isLight ? 'text-slate-400' : 'text-white/40'
              }`}>System Intelligence</div>
              <h2 className={`font-light text-lg sm:text-xl tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>Notification Center & Telemetry</h2>
            </div>
          </div>
          <button
            onClick={() => { haptic.lightTap(); onClose(); }}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-white/40 hover:text-white hover:bg-white/10'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex border-b px-6 sm:px-8 pt-3 gap-2 overflow-x-auto ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.01]'
        }`}>
          <button
            onClick={() => { haptic.lightTap(); setActiveTab('app_alerts'); }}
            className={`px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-2 rounded-t-xl cursor-pointer whitespace-nowrap ${
              activeTab === 'app_alerts'
                ? isLight ? 'bg-slate-200 text-orange-600 border-b-2 border-orange-500' : 'bg-white/10 text-orange-400 border-b-2 border-orange-400'
                : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-white/40 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>App Alerts ({appNotifications.length})</span>
            {unreadCount > 0 && (
              <span className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${
                isLight ? 'bg-orange-500 text-white' : 'bg-orange-500 text-black'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { haptic.lightTap(); setActiveTab('logs'); }}
            className={`px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-2 rounded-t-xl cursor-pointer whitespace-nowrap ${
              activeTab === 'logs'
                ? isLight ? 'bg-slate-200 text-orange-600 border-b-2 border-orange-500' : 'bg-white/10 text-orange-400 border-b-2 border-orange-400'
                : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-white/40 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Logs ({logs.length})</span>
          </button>
          
          <button
            onClick={() => { haptic.lightTap(); setActiveTab('preview'); }}
            className={`px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-2 rounded-t-xl cursor-pointer whitespace-nowrap ${
              activeTab === 'preview'
                ? isLight ? 'bg-slate-200 text-orange-600 border-b-2 border-orange-500' : 'bg-white/10 text-orange-400 border-b-2 border-orange-400'
                : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-white/40 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>HTML Email Template</span>
          </button>

          <button
            onClick={() => { haptic.lightTap(); setActiveTab('settings'); }}
            className={`px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-2 rounded-t-xl cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? isLight ? 'bg-slate-200 text-orange-600 border-b-2 border-orange-500' : 'bg-white/10 text-orange-400 border-b-2 border-orange-400'
                : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-white/40 hover:text-white'
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
                  <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Filter:</span>
                  {(['all', 'deadline', 'overdue', 'subtask_complete', 'sync'] as const).map(filter => (
                    <button
                      key={filter}
                      onClick={() => {
                        haptic.lightTap();
                        setNotifFilter(filter);
                      }}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        notifFilter === filter
                          ? isLight ? 'bg-orange-100 text-orange-600 border border-orange-300' : 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                          : isLight ? 'bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200' : 'bg-white/5 text-white/40 hover:text-white border border-white/5'
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
                      className={`flex items-center gap-1.5 text-xs cursor-pointer ${
                        isLight ? 'text-slate-500 hover:text-slate-900' : 'text-white/60 hover:text-white'
                      }`}
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
                <div className={`p-10 text-center border border-dashed rounded-3xl ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/10'
                }`}>
                  <Bell className={`w-8 h-8 mx-auto mb-2 ${isLight ? 'text-slate-300' : 'text-white/20'}`} />
                  <p className={`text-sm font-semibold ${isLight ? 'text-slate-500' : 'text-white/60'}`}>No notifications in feed</p>
                  <p className={`text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
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
                          ? isLight ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white/[0.02] border-white/5 opacity-70'
                          : isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/[0.05] border-white/15 shadow-lg'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${
                        isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
                      }`}>
                        {getIconForType(notif.type)}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`text-xs font-bold truncate ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}>
                            {notif.title}
                          </h4>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] font-mono ${
                              isLight ? 'text-slate-400' : 'text-white/40'
                            }`}>
                              {formatDateTime(notif.timestamp)}
                            </span>
                            {onDeleteNotification && (
                              <button
                                onClick={() => {
                                  haptic.deleteAction();
                                  onDeleteNotification(notif.id);
                                }}
                                title="Delete notification"
                                className={`p-1 rounded-md transition-colors cursor-pointer ${
                                  isLight ? 'text-slate-400 hover:text-red-500 hover:bg-slate-100' : 'text-white/30 hover:text-red-400 hover:bg-white/10'
                                }`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className={`text-xs leading-relaxed ${
                          isLight ? 'text-slate-600' : 'text-white/60'
                        }`}>
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
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
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
                <div className={`p-10 text-center border border-dashed rounded-3xl ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/10'
                }`}>
                  <Mail className={`w-8 h-8 mx-auto mb-2 ${isLight ? 'text-slate-300' : 'text-white/20'}`} />
                  <p className={`text-sm font-semibold ${isLight ? 'text-slate-500' : 'text-white/60'}`}>No email logs dispatched yet</p>
                  <p className={`text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                    Dispatches automatically when task deadlines approach, or trigger manually from the Simulation tab.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
                      }`}
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                            log.status === 'delivered'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : log.status === 'failed'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {log.status.toUpperCase()}
                          </span>
                          <h4 className={`text-xs font-bold truncate ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}>
                            {log.taskTitle}
                          </h4>
                        </div>
                        <p className={`text-xs line-clamp-2 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                          {log.previewSnippet}
                        </p>
                        <div className={`flex items-center gap-2 text-[10px] font-mono ${
                          isLight ? 'text-slate-400' : 'text-white/40'
                        }`}>
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
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
                isLight ? 'border-slate-200' : 'border-white/10'
              }`}>
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    isLight ? 'text-slate-400' : 'text-white/50'
                  }`}>
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
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-white/5 border border-white/10 text-white'
                  }`}
                >
                  {tasks.map(t => (
                    <option key={t.id} value={t.id} className={isLight ? 'bg-white text-slate-900' : 'bg-[#121216]'}>{t.title}</option>
                  ))}
                </select>
              </div>

              {selectedTaskForPreview && (
                <div className={`border rounded-2xl overflow-hidden shadow-2xl ${
                  isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-black'
                }`}>
                  <div className={`px-4 py-2 text-[10px] font-mono flex items-center justify-between border-b ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white/5 border-white/10 text-white/50'
                  }`}>
                    <span>From: notifications@doit-suite.io</span>
                    <span>To: {userEmail}</span>
                  </div>
                  <div 
                    className={`p-4 overflow-x-auto ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}
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
              <div className={`p-5 rounded-3xl border space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
              }`}>
                <h4 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                  isLight ? 'text-orange-600' : 'text-orange-400'
                }`}>
                  <Sparkles className="w-4 h-4" />
                  <span>Interactive Alert Test Suite</span>
                </h4>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
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
                    className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer text-left ${
                      isLight ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                    }`}
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
                    className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer text-left ${
                      isLight ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                    }`}
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
                    className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer text-left ${
                      isLight ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                    }`}
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
                    className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer text-left ${
                      isLight ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                    }`}
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
                    className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer text-left ${
                      isLight ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                    }`}
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
                    className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer text-left ${
                      isLight ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Urgent Alert</span>
                  </button>
                </div>
              </div>

              {/* Email Trigger test */}
              <div className={`p-5 rounded-3xl border space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
              }`}>
                <h4 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                  isLight ? 'text-slate-700' : 'text-white/70'
                }`}>
                  <Mail className="w-4 h-4 text-orange-400" />
                  <span>Send Immediate Test Email Reminder</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <select
                      value={selectedTaskToTrigger}
                      onChange={(e) => setSelectedTaskToTrigger(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-semibold cursor-pointer ${
                        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'
                      }`}
                    >
                      {tasks.map(t => (
                        <option key={t.id} value={t.id} className={isLight ? 'bg-white text-slate-900' : 'bg-[#121216]'}>
                          [{t.priority.toUpperCase()}] {t.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleTriggerEmail}
                    className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:opacity-90 active:scale-95 transition-all cursor-pointer ${
                      isLight ? 'bg-orange-500 text-white shadow-[0_4px_14px_rgba(249,115,22,0.35)]' : 'bg-white text-black'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Email</span>
                  </button>
                </div>
              </div>

              {/* Email Config */}
              <form onSubmit={handleSaveEmail} className={`p-5 rounded-3xl border space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
              }`}>
                <h4 className={`text-xs font-bold uppercase tracking-widest ${
                  isLight ? 'text-slate-500' : 'text-white/60'
                }`}>
                  Default Target Email Address
                </h4>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    className={`flex-1 px-4 py-2.5 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'
                    }`}
                  />
                  <button
                    type="submit"
                    className={`px-5 py-2.5 rounded-2xl border font-bold text-xs cursor-pointer transition-colors ${
                      isLight ? 'bg-slate-200 hover:bg-slate-300 border-slate-300 text-slate-900' : 'bg-white/10 hover:bg-white/20 border-white/10 text-white'
                    }`}
                  >
                    Save Email
                  </button>
                </div>
              </form>

              {/* Browser Push Permission Toggle */}
              <div className={`p-5 rounded-3xl border flex items-center justify-between gap-4 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
              }`}>
                <div>
                  <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Native Browser Push Notifications</h4>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Receive popup banners even when tab is backgrounded</p>
                </div>
                <button
                  onClick={handleRequestPush}
                  className={`px-4 py-2 rounded-full font-bold text-xs transition-colors cursor-pointer ${
                    pushStatus 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isLight ? 'bg-orange-500 text-white shadow-[0_4px_14px_rgba(249,115,22,0.35)]' : 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]'
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
