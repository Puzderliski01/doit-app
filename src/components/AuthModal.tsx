import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  LogIn,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  LogOut,
  Dumbbell,
  ListChecks,
  Apple,
  Target,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import {
  signInWithGoogle,
  loginWithEmail,
  registerWithEmail,
  saveLocalAuthSession,
  logoutUser,
} from '../firebase';
import { User } from 'firebase/auth';
import { AuthUser } from '../types';
import { haptic } from '../utils/haptics';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | User | null;
  onAuthSuccess?: (user: AuthUser) => void;
  onLogout?: () => void;
  theme: 'dark' | 'light';
}

const features = [
  {
    icon: ListChecks,
    title: 'Smart Tasks',
    desc: 'Organize, prioritize & crush your goals',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-500',
  },
  {
    icon: Dumbbell,
    title: 'Track Workouts',
    desc: 'Log sets, reps & personal records',
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'bg-indigo-500/10',
    textColor: 'text-indigo-500',
  },
  {
    icon: Apple,
    title: 'Meal Planning',
    desc: 'AI-powered nutrition & meal ideas',
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-500',
  },
  {
    icon: Target,
    title: 'Level Up',
    desc: 'Ranks, streaks & achievements',
    color: 'from-rose-500 to-pink-500',
    bgColor: 'bg-rose-500/10',
    textColor: 'text-rose-500',
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onLogout,
  theme,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

  if (!isOpen) return null;

  const isLight = theme === 'light';

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      haptic.mediumClick();
      const user = await signInWithGoogle();
      const authUser: AuthUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isLocal: false,
      };
      setSuccessMsg(`Welcome, ${user.displayName || user.email}!`);
      if (onAuthSuccess) onAuthSuccess(authUser);
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1000);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is not enabled in Firebase Console. Try email sign-in below.');
      } else {
        setError(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      haptic.mediumClick();

      let user: User;
      if (mode === 'signin') {
        user = await loginWithEmail(email, password);
        setSuccessMsg(`Welcome back, ${user.displayName || user.email}!`);
      } else {
        user = await registerWithEmail(email, password, displayName || undefined);
        setSuccessMsg(`Account created! Welcome, ${displayName || user.email}!`);
      }

      const authUser: AuthUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || displayName || email.split('@')[0],
        photoURL: user.photoURL,
        isLocal: false,
      };

      if (onAuthSuccess) onAuthSuccess(authUser);
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      console.error('Auth Error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email sign-in is disabled in Firebase. Please enable it in the console.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try signing in.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      haptic.mediumClick();
      await logoutUser();
      setSuccessMsg('Logged out successfully.');
      if (onLogout) onLogout();
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Logout failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-xl ${
      isLight ? 'bg-black/30' : 'bg-black/60'
    }`}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={`w-full sm:max-w-[420px] max-h-[92vh] overflow-y-auto sm:rounded-[32px] rounded-t-[32px] shadow-2xl relative ${
          isLight
            ? 'bg-white text-slate-900'
            : 'bg-[#0a0a0c] text-white'
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => { haptic.lightTap(); onClose(); }}
          className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-colors ${
            isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-400' : 'bg-white/5 hover:bg-white/10 text-white/40'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top gradient glow */}
        <div className={`relative overflow-hidden ${
          isLight ? '' : ''
        }`}>
          <div className={`absolute inset-0 ${
            isLight
              ? 'bg-gradient-to-b from-amber-100/60 via-orange-50/30 to-transparent'
              : 'bg-gradient-to-b from-amber-500/15 via-orange-500/5 to-transparent'
          }`} />

          {/* Hero section */}
          <div className="relative pt-12 pb-6 px-8 text-center">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', damping: 20 }}
              className={`w-20 h-20 mx-auto mb-5 rounded-[22px] flex items-center justify-center shadow-xl ${
                isLight
                  ? 'bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 shadow-amber-500/30'
                  : 'bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 shadow-amber-500/40'
              }`}
            >
              <span className="text-4xl font-black text-white tracking-tighter" style={{ fontFamily: 'system-ui' }}>
                D
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`text-3xl font-black tracking-tight mb-2 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              DoIT
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className={`text-sm font-medium ${
                isLight ? 'text-slate-500' : 'text-white/50'
              }`}
            >
              Tasks. Fitness. Nutrition. All in one.
            </motion.p>
          </div>
        </div>

        {/* Already logged in */}
        {currentUser && !currentUser.isGuest ? (
          <div className="px-8 pb-10 space-y-5">
            <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
              isLight ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/10'
            }`}>
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-full border-2 border-amber-400/40 object-cover"
                />
              ) : (
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${
                  isLight ? 'bg-amber-100 text-amber-600' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {currentUser.displayName || 'Authenticated User'}
                </p>
                <p className={`text-xs truncate font-mono ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                  {currentUser.email}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-medium text-emerald-500">Sync active</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 ${
                isLight
                  ? 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'
              }`}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="px-8 pb-10 space-y-5">
            {/* Success message */}
            <AnimatePresence>
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
                    isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  {successMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                    isLight ? 'bg-red-50 border-red-200 text-red-600' : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl font-semibold text-sm transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50 ${
                isLight
                  ? 'bg-white hover:bg-white/95 text-black border border-slate-200 shadow-slate-200/50'
                  : 'bg-white hover:bg-white/90 text-black'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className={`flex-1 h-px ${isLight ? 'bg-slate-100' : 'bg-white/10'}`} />
              <span className={`text-[11px] uppercase tracking-widest font-semibold ${
                isLight ? 'text-slate-300' : 'text-white/30'
              }`}>
                or
              </span>
              <div className={`flex-1 h-px ${isLight ? 'bg-slate-100' : 'bg-white/10'}`} />
            </div>

            {/* Email form toggle or form */}
            {!showEmailForm ? (
              <button
                type="button"
                onClick={() => setShowEmailForm(true)}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border text-sm font-semibold transition-all cursor-pointer ${
                  isLight
                    ? 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'
                }`}
              >
                <Mail className="w-4 h-4" />
                Continue with Email
              </button>
            ) : (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={handleSubmit}
                className="space-y-3"
              >
                {mode === 'signup' && (
                  <div className="relative">
                    <UserIcon className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                      isLight ? 'text-slate-300' : 'text-white/30'
                    }`} />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-colors ${
                        isLight
                          ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-300 focus:border-amber-400'
                          : 'bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-amber-500'
                      }`}
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                    isLight ? 'text-slate-300' : 'text-white/30'
                  }`} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-300 focus:border-amber-400'
                        : 'bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-amber-500'
                    }`}
                  />
                </div>

                <div className="relative">
                  <Lock className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                    isLight ? 'text-slate-300' : 'text-white/30'
                  }`} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-300 focus:border-amber-400'
                        : 'bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-amber-500'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-sm shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <>
                      {mode === 'signin' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      {mode === 'signin' ? 'Sign In' : 'Create Account'}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
                  className={`w-full text-center text-xs font-medium transition-colors cursor-pointer ${
                    isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {mode === 'signin' ? (
                    <>Don't have an account? <span className="text-amber-500 font-semibold">Sign Up</span></>
                  ) : (
                    <>Already have an account? <span className="text-amber-500 font-semibold">Sign In</span></>
                  )}
                </button>
              </motion.form>
            )}

            {/* Feature highlights */}
            <div className="pt-2">
              <div className={`grid grid-cols-2 gap-2.5`}>
                {features.map((feat, i) => (
                  <motion.div
                    key={feat.title}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className={`p-3 rounded-xl border ${
                      isLight ? 'bg-white border-slate-100' : 'bg-white/[0.02] border-white/[0.06]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                      isLight ? feat.bgColor : feat.bgColor
                    }`}>
                      <feat.icon className={`w-4 h-4 ${feat.textColor}`} />
                    </div>
                    <p className={`text-xs font-bold mb-0.5 ${isLight ? 'text-slate-800' : 'text-white/90'}`}>
                      {feat.title}
                    </p>
                    <p className={`text-[10px] leading-tight ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                      {feat.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
