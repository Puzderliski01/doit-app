import React, { useState } from 'react';
import { UserProfile, Category, AuthUser } from '../types';
import { storage } from '../utils/storage';
import { getEmailJSConfig, saveEmailJSConfig, EmailJSConfig } from '../utils/notificationEngine';
import { t, LANGUAGES, Language, setLanguage } from '../i18n';
import {
  Settings as SettingsIcon, Moon, Sun, Volume2, VolumeX, Vibrate, VibrateOff,
  Bell, BellOff, Mail, Download, Trash2, ChevronRight, User, Palette,
  Dumbbell, Cloud, CloudOff, Shield, Info, FileText, LogOut, Eye, EyeOff,
  Smartphone, Globe, Database, RefreshCw, AlertTriangle, Check, Send, Upload
} from 'lucide-react';
import { haptic } from '../utils/haptics';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  userProfile: UserProfile;
  onProfileUpdate: (updates: Partial<UserProfile>) => void;
  currentUser: { uid: string; email?: string; displayName?: string; photoURL?: string; isGuest?: boolean } | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  categories: Category[];
  onCategoriesChange: (cats: Category[]) => void;
  userEmail: string;
  onUserEmailChange: (email: string) => void;
  isOnline: boolean;
  lastSyncTime: string | null;
  onOpenDocs: () => void;
  onExportData: () => void;
  onImportData: (data: unknown) => void;
  onClearData: () => void;
  onDeleteAccount: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  theme,
  onToggleTheme,
  userProfile,
  onProfileUpdate,
  currentUser,
  onOpenAuth,
  onSignOut,
  categories,
  onCategoriesChange,
  userEmail,
  onUserEmailChange,
  isOnline,
  lastSyncTime,
  onOpenDocs,
  onExportData,
  onImportData,
  onClearData,
  onDeleteAccount,
}) => {
  const isLight = theme === 'light';
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('doit_sound_enabled') !== 'false';
  });
  const [hapticEnabled, setHapticEnabled] = useState(() => {
    return localStorage.getItem('doit_haptic_enabled') !== 'false';
  });
  const [pushEnabled, setPushEnabled] = useState(() => {
    try {
      return typeof Notification !== 'undefined' && Notification.permission === 'granted';
    } catch {
      return false;
    }
  });
  const [emailjsConfig, setEmailjsConfig] = useState<EmailJSConfig>(() => getEmailJSConfig());
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#f59e0b');
  const CATEGORY_COLORS = ['#f59e0b','#10b981','#ec4899','#38bdf8','#8b5cf6','#f97316','#06b6d4','#ef4444','#84cc16','#6366f1'];

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem('doit_sound_enabled', String(newVal));
    haptic.lightTap();
  };

  const toggleHaptic = () => {
    const newVal = !hapticEnabled;
    setHapticEnabled(newVal);
    localStorage.setItem('doit_haptic_enabled', String(newVal));
  };

  const togglePush = async () => {
    if (pushEnabled) {
      setPushEnabled(false);
    } else {
      try {
        if (typeof Notification === 'undefined') {
          setPushEnabled(false);
          return;
        }
        const result = await Notification.requestPermission();
        if (result === 'granted') {
          // Also subscribe to push for background notifications
          const { subscribeToPush } = await import('../utils/pushNotifications');
          await subscribeToPush();
        }
        setPushEnabled(result === 'granted');
      } catch {
        setPushEnabled(false);
      }
    }
    haptic.lightTap();
  };

  const handleDeleteCategory = (catId: string) => {
    const newCats = categories.filter(c => c.id !== catId);
    onCategoriesChange(newCats);
    haptic.mediumClick();
  };

  const Section = ({ id, title, icon, children }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode }) => {
    const isExpanded = expandedSection === id;
    return (
      <div className={`rounded-2xl border overflow-hidden liquid-glass-card`}>
        <button
          onClick={() => { haptic.lightTap(); setExpandedSection(isExpanded ? null : id); }}
          className={`w-full flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer ${
            isLight ? 'hover:bg-white/60' : 'hover:bg-white/[0.06]'
          }`}
        >
          <span className={`${isLight ? 'text-slate-500' : 'text-white/50'}`}>{icon}</span>
          <span className={`flex-1 text-left text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{title}</span>
          <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''} ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className={`px-4 py-3 border-t space-y-3 backdrop-blur-xl ${isLight ? 'bg-white/40 border-white/30' : 'bg-white/[0.02] border-white/10'}`}>
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const ToggleRow = ({ label, description, enabled, onToggle }: { label: string; description?: string; enabled: boolean; onToggle: () => void }) => (
    <div className="flex items-center justify-between">
      <div>
        <p className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-white/90'}`}>{label}</p>
        {description && <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{description}</p>}
      </div>
      <button
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
          enabled ? 'bg-orange-500' : isLight ? 'bg-slate-300' : 'bg-white/20'
        }`}
      >
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-5.5' : 'translate-x-0.5'
        }`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {t('settings.title')}
        </h1>
        <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Account Section */}
      <Section id="account" title={t('settings.account')} icon={<User className="w-4 h-4" />}>
        {currentUser ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-black font-bold text-sm">
                  {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {currentUser.displayName || 'User'}
                </p>
                <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                  {currentUser.email || 'Guest Account'}
                </p>
              </div>
            </div>
            {currentUser.isGuest && (
              <button
                onClick={() => { haptic.mediumClick(); onOpenAuth(); }}
                className="w-full py-2 rounded-xl bg-orange-500 text-white text-xs font-bold cursor-pointer"
              >
                {t('settings.signInToSync')}
              </button>
            )}
            {!currentUser.isGuest && (
              <button
                onClick={() => { haptic.mediumClick(); onSignOut(); }}
                className={`w-full py-2 rounded-xl border text-xs font-bold cursor-pointer flex items-center justify-center gap-2 ${
                  isLight ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-red-500/20 text-red-400 hover:bg-red-500/10'
                }`}
              >
                <LogOut className="w-3.5 h-3.5" />
                {t('settings.signOutOfAccount')}
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => { haptic.mediumClick(); onOpenAuth(); }}
            className="w-full py-2 rounded-xl bg-orange-500 text-white text-xs font-bold cursor-pointer"
          >
            {t('common.signIn')}
          </button>
        )}
      </Section>

      {/* Appearance */}
      <Section id="appearance" title={t('settings.appearance')} icon={<Palette className="w-4 h-4" />}>
        <ToggleRow
          label={t('settings.darkMode')}
          description={isLight ? t('settings.darkModeDesc') : t('settings.lightModeDesc')}
          enabled={!isLight}
          onToggle={() => {
            haptic.lightTap();
            onToggleTheme();
            // Save preference so system auto-switch is disabled
            storage.saveTheme(theme === 'dark' ? 'light' : 'dark');
          }}
        />
        <div>
          <p className={`text-xs font-semibold mb-2 ${isLight ? 'text-slate-800' : 'text-white/90'}`}>{t('settings.weightUnit')}</p>
          <div className="flex gap-2">
            {(['kg', 'lbs'] as const).map(unit => (
              <button
                key={unit}
                onClick={() => { haptic.lightTap(); onProfileUpdate({ weightUnit: unit }); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  userProfile.weightUnit === unit
                    ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                    : isLight ? 'border-slate-200 text-slate-600' : 'border-white/10 text-white/60'
                }`}
              >
                {unit.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className={`text-xs font-semibold mb-2 ${isLight ? 'text-slate-800' : 'text-white/90'}`}>{t('settings.language')}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {LANGUAGES.map(lang => (
              <button
                key={lang.id}
                onClick={() => {
                  haptic.lightTap();
                  setLanguage(lang.id);
                  onProfileUpdate({ language: lang.id });
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-left ${
                  (userProfile.language || 'en') === lang.id
                    ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                    : isLight ? 'border-slate-200 text-slate-600 hover:border-slate-300' : 'border-white/10 text-white/60 hover:border-white/20'
                }`}
              >
                <span className="font-bold">{lang.nativeName}</span>
                <span className={`ml-1 text-[10px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>({lang.name})</span>
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Sound & Haptics */}
      <Section id="sound" title={t('settings.soundHaptics')} icon={<Volume2 className="w-4 h-4" />}>
        <ToggleRow
          label={t('settings.notifSounds')}
          description={t('settings.notifSoundsDesc')}
          enabled={soundEnabled}
          onToggle={toggleSound}
        />
        <ToggleRow
          label={t('settings.hapticFeedback')}
          description={t('settings.hapticFeedbackDesc')}
          enabled={hapticEnabled}
          onToggle={toggleHaptic}
        />
      </Section>

      {/* Notifications */}
      <Section id="notifications" title={t('settings.notifications')} icon={<Bell className="w-4 h-4" />}>
        <ToggleRow
          label={t('settings.pushNotif')}
          description={t('settings.pushNotifDesc')}
          enabled={pushEnabled}
          onToggle={togglePush}
        />
        <div>
          <p className={`text-xs font-semibold mb-1 ${isLight ? 'text-slate-800' : 'text-white/90'}`}>{t('settings.reminderEmail')}</p>
          <input
            type="email"
            value={userEmail}
            onChange={(e) => onUserEmailChange(e.target.value)}
            placeholder="your@email.com"
            className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
              isLight ? 'border-slate-200 bg-white text-slate-900' : 'border-white/10 bg-white/5 text-white'
            }`}
          />
        </div>

        {/* EmailJS Configuration */}
        <div className={`p-3 rounded-xl border liquid-glass-subtle`}>
          <div className="flex items-center gap-2 mb-3">
            <Send className="w-4 h-4 text-orange-500" />
            <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('settings.emailReminders')}</p>
          </div>
          <ToggleRow
            label={t('settings.emailReminders')}
            description={t('settings.emailRemindersDesc')}
            enabled={emailjsConfig.enabled}
            onToggle={() => {
              haptic.lightTap();
              const newConfig = { ...emailjsConfig, enabled: !emailjsConfig.enabled };
              setEmailjsConfig(newConfig);
              saveEmailJSConfig(newConfig);
            }}
          />
          {emailjsConfig.enabled && (
            <div className="space-y-2 mt-3">
              <div>
                <p className={`text-[10px] font-semibold mb-1 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{t('settings.serviceId')}</p>
                <input
                  type="text"
                  value={emailjsConfig.serviceId}
                  onChange={(e) => {
                    const newConfig = { ...emailjsConfig, serviceId: e.target.value };
                    setEmailjsConfig(newConfig);
                    saveEmailJSConfig(newConfig);
                  }}
                  placeholder="e.g. service_xyz123"
                  className={`w-full px-3 py-1.5 rounded-lg border text-[11px] focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                    isLight ? 'border-slate-200 bg-slate-50 text-slate-900' : 'border-white/10 bg-white/5 text-white'
                  }`}
                />
              </div>
              <div>
                <p className={`text-[10px] font-semibold mb-1 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{t('settings.templateId')}</p>
                <input
                  type="text"
                  value={emailjsConfig.templateId}
                  onChange={(e) => {
                    const newConfig = { ...emailjsConfig, templateId: e.target.value };
                    setEmailjsConfig(newConfig);
                    saveEmailJSConfig(newConfig);
                  }}
                  placeholder="e.g. template_abc456"
                  className={`w-full px-3 py-1.5 rounded-lg border text-[11px] focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                    isLight ? 'border-slate-200 bg-slate-50 text-slate-900' : 'border-white/10 bg-white/5 text-white'
                  }`}
                />
              </div>
              <div>
                <p className={`text-[10px] font-semibold mb-1 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{t('settings.publicKey')}</p>
                <input
                  type="text"
                  value={emailjsConfig.publicKey}
                  onChange={(e) => {
                    const newConfig = { ...emailjsConfig, publicKey: e.target.value };
                    setEmailjsConfig(newConfig);
                    saveEmailJSConfig(newConfig);
                  }}
                  placeholder="e.g. user_XXXXXXX"
                  className={`w-full px-3 py-1.5 rounded-lg border text-[11px] focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                    isLight ? 'border-slate-200 bg-slate-50 text-slate-900' : 'border-white/10 bg-white/5 text-white'
                  }`}
                />
              </div>
              <div className={`p-2 rounded-lg ${isLight ? 'bg-blue-50' : 'bg-blue-500/10'}`}>
                <p className={`text-[10px] ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>
                  {t('settings.emailjsInfo')}
                </p>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Fitness Profile */}
      <Section id="fitness" title={t('settings.fitnessProfile')} icon={<Dumbbell className="w-4 h-4" />}>
        <div>
          <p className={`text-xs font-semibold mb-2 ${isLight ? 'text-slate-800' : 'text-white/90'}`}>{t('settings.goals')}</p>
          <div className="flex flex-wrap gap-1.5">
            {(['lose_weight', 'gain_muscle', 'maintain', 'strength', 'endurance'] as const).map(goal => (
              <button
                key={goal}
                onClick={() => {
                  haptic.lightTap();
                  const goals = userProfile.goals || [];
                  const newGoals = goals.includes(goal) ? goals.filter(g => g !== goal) : [...goals, goal];
                  onProfileUpdate({ goals: newGoals });
                }}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                  userProfile.goals?.includes(goal)
                    ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                    : isLight ? 'border-slate-200 text-slate-600' : 'border-white/10 text-white/60'
                }`}
              >
                {goal.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className={`text-xs font-semibold mb-2 ${isLight ? 'text-slate-800' : 'text-white/90'}`}>{t('settings.experienceLevel')}</p>
          <div className="flex gap-2">
            {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
              <button
                key={level}
                onClick={() => { haptic.lightTap(); onProfileUpdate({ experienceLevel: level }); }}
                className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                  userProfile.experienceLevel === level
                    ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                    : isLight ? 'border-slate-200 text-slate-600' : 'border-white/10 text-white/60'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        <ToggleRow
          label={t('settings.publicLeaderboard')}
          description="Show your profile on the leaderboard"
          enabled={userProfile.leaderboardPublic}
          onToggle={() => { haptic.lightTap(); onProfileUpdate({ leaderboardPublic: !userProfile.leaderboardPublic }); }}
        />
      </Section>

      {/* Categories */}
      <Section id="categories" title={t('settings.categories')} icon={<Database className="w-4 h-4" />}>
        <div className="space-y-1.5">
          {categories.map(cat => (
            <div key={cat.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg liquid-glass-subtle`}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className={`flex-1 text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-white/90'}`}>{cat.name}</span>
              <button
                onClick={() => handleDeleteCategory(cat.id)}
                className={`p-1 rounded cursor-pointer ${isLight ? 'text-slate-400 hover:text-red-500' : 'text-white/30 hover:text-red-400'}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <div className={`p-3 rounded-xl border liquid-glass-subtle`}>
          <input
            type="text"
            placeholder={t('settings.newCategoryPlaceholder')}
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50 mb-2 ${
              isLight ? 'border-slate-200 bg-slate-50 text-slate-900' : 'border-white/10 bg-white/5 text-white'
            }`}
          />
          <div className="flex gap-1.5 mb-2">
            {CATEGORY_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setNewCategoryColor(color)}
                className={`w-5 h-5 rounded-full border-2 cursor-pointer ${newCategoryColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <button
            onClick={() => {
              if (!newCategoryName.trim()) return;
              const id = 'cat-' + newCategoryName.trim().toLowerCase().replace(/\s+/g, '-');
              onCategoriesChange([...categories, { id, name: newCategoryName.trim(), color: newCategoryColor, iconName: 'Folder' }]);
              setNewCategoryName('');
              haptic.mediumClick();
            }}
            className="w-full py-2 rounded-lg bg-orange-500 text-white text-xs font-bold cursor-pointer"
          >
            {t('settings.addCategory')}
          </button>
        </div>
      </Section>

      {/* Sync Status */}
      <Section id="sync" title={t('settings.cloudSync')} icon={<Cloud className="w-4 h-4" />}>
        <div className={`flex items-center gap-3 p-3 rounded-xl liquid-glass-subtle`}>
          {currentUser?.isGuest ? (
            <CloudOff className="w-5 h-5 text-amber-500" />
          ) : isOnline ? (
            <Cloud className="w-5 h-5 text-emerald-500" />
          ) : (
            <CloudOff className="w-5 h-5 text-amber-500" />
          )}
          <div>
            <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {currentUser?.isGuest ? t('settings.guestMode') : isOnline ? t('settings.connected') : t('settings.offlineMode')}
            </p>
            <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
              {currentUser?.isGuest
                ? t('settings.signInToSync')
                : lastSyncTime ? `${t('settings.lastSync')} ${new Date(lastSyncTime).toLocaleString()}` : t('settings.notSyncedYet')
              }
            </p>
          </div>
        </div>
        {!currentUser?.isGuest && (
          <div className={`text-[10px] space-y-1 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
            <p className="font-semibold">{t('settings.syncedData')}</p>
            <div className="flex flex-wrap gap-1.5">
              {[t('settings.tasks'), t('settings.categories'), t('settings.fitnessEntries'), t('settings.profile'), t('settings.notifications2')].map(item => (
                <span key={item} className={`px-2 py-0.5 rounded-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>{item}</span>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Data Management */}
      <Section id="data" title={t('settings.dataManagement')} icon={<Database className="w-4 h-4" />}>
        <button
          onClick={() => { haptic.mediumClick(); onExportData(); }}
          className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
            isLight ? 'border-slate-200 text-slate-700 hover:bg-slate-50' : 'border-white/10 text-white/70 hover:bg-white/5'
          }`}
        >
          <Download className="w-4 h-4" />
          {t('settings.exportData')}
        </button>
        <label className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
          isLight ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
        }`}>
          <Upload className="w-4 h-4" />
          Import from JSON Backup
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                haptic.mediumClick();
                const reader = new FileReader();
                reader.onload = (ev) => {
                  try {
                    const data = JSON.parse(ev.target?.result as string);
                    onImportData(data);
                  } catch {
                    alert('Invalid JSON file');
                  }
                };
                reader.readAsText(file);
              }
            }}
            className="hidden"
          />
        </label>
        {!showClearConfirm ? (
          <button
            onClick={() => setShowClearConfirm(true)}
            className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
              isLight ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-red-500/20 text-red-400 hover:bg-red-500/10'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            {t('settings.clearData')}
          </button>
        ) : (
          <div className={`p-3 rounded-xl border ${isLight ? 'bg-red-50 border-red-200' : 'bg-red-500/10 border-red-500/20'}`}>
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className={`text-xs ${isLight ? 'text-red-700' : 'text-red-300'}`}>
                {t('settings.clearDataConfirm')}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { haptic.mediumClick(); onClearData(); setShowClearConfirm(false); }}
                className="flex-1 py-2 rounded-lg bg-red-500 text-white text-xs font-bold cursor-pointer"
              >
                Yes, Clear
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className={`flex-1 py-2 rounded-lg border text-xs font-bold cursor-pointer ${
                  isLight ? 'border-slate-200 text-slate-600' : 'border-white/10 text-white/60'
                }`}
              >
                {t('settings.cancel')}
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* Docs */}
      <Section id="docs" title={t('settings.documentation')} icon={<FileText className="w-4 h-4" />}>
        <button
          onClick={() => { haptic.mediumClick(); onOpenDocs(); }}
          className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
            isLight ? 'border-slate-200 text-slate-700 hover:bg-slate-50' : 'border-white/10 text-white/70 hover:bg-white/5'
          }`}
        >
          <FileText className="w-4 h-4" />
          {t('settings.viewDocs')}
          <ChevronRight className="w-3.5 h-3.5 ml-auto" />
        </button>
      </Section>

      {/* Danger Zone - Delete Account */}
      {!currentUser?.isGuest && !(currentUser as AuthUser)?.isLocal && (
        <Section id="danger" title="Danger Zone" icon={<AlertTriangle className="w-4 h-4" />}>
          <div className={`p-3 rounded-xl border ${isLight ? 'bg-red-50/50 border-red-200/40' : 'bg-red-500/5 border-red-500/15'}`}>
            <p className={`text-[11px] mb-3 ${isLight ? 'text-red-600' : 'text-red-400'}`}>
              This will permanently delete your account and all associated data from our servers. This action cannot be undone.
            </p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold cursor-pointer hover:bg-red-600"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account & All Data
              </button>
            ) : (
              <div>
                <p className={`text-[11px] font-bold mb-2 ${isLight ? 'text-red-700' : 'text-red-300'}`}>
                  Are you absolutely sure? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { haptic.mediumClick(); onDeleteAccount(); setShowDeleteConfirm(false); }}
                    className="flex-1 py-2 rounded-lg bg-red-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Yes, Delete Forever
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className={`flex-1 py-2 rounded-lg border text-xs font-bold cursor-pointer ${
                      isLight ? 'border-slate-200 text-slate-600' : 'border-white/10 text-white/60'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* About */}
      <Section id="about" title={t('settings.about')} icon={<Info className="w-4 h-4" />}>
        <div className={`text-center py-4 ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
          <p className="text-2xl font-bold mb-1" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            DoIT PRO
          </p>
          <p className="text-[10px] font-mono">{t('settings.version')}</p>
          <p className="text-[10px] mt-1">{t('settings.taskManagement')}</p>
        </div>
      </Section>
    </div>
  );
};
