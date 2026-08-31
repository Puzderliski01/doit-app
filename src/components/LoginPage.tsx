import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LogIn,
  UserPlus,
  Sparkles,
  User as UserIcon,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  CloudOff,
  Dumbbell,
  ListChecks,
  Apple,
  Target,
  Zap,
  Trophy,
  Flame,
} from 'lucide-react';
import {
  signInWithGoogle,
  loginWithEmail,
  registerWithEmail,
  saveLocalAuthSession,
} from '../firebase';
import { AuthUser } from '../types';
import { haptic } from '../utils/haptics';

interface LoginPageProps {
  onAuthSuccess: (user: AuthUser) => void;
  onContinueGuest: () => void;
}

const features = [
  { icon: ListChecks, label: 'Smart Tasks', color: 'text-amber-400' },
  { icon: Dumbbell, label: 'Track Workouts', color: 'text-indigo-400' },
  { icon: Apple, label: 'Meal Plans', color: 'text-emerald-400' },
  { icon: Trophy, label: 'Leaderboards', color: 'text-rose-400' },
];

export const LoginPage: React.FC<LoginPageProps> = ({
  onAuthSuccess,
  onContinueGuest,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

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
        isGuest: false,
      };
      setSuccessMsg(`Welcome, ${user.displayName || user.email}!`);
      saveLocalAuthSession(authUser);
      setTimeout(() => onAuthSuccess(authUser), 500);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is not enabled in Firebase Console. Try email sign-in.');
      } else {
        setError(err.message || 'Google Sign-In was cancelled or failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      haptic.mediumClick();

      let authUser: AuthUser;
      if (mode === 'signin') {
        const user = await loginWithEmail(email, password);
        authUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || email.split('@')[0],
          photoURL: user.photoURL,
          isLocal: false,
          isGuest: false,
        };
        setSuccessMsg(`Welcome back, ${authUser.displayName}!`);
      } else {
        const user = await registerWithEmail(email, password, displayName);
        authUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || displayName || email.split('@')[0],
          photoURL: user.photoURL,
          isLocal: false,
          isGuest: false,
        };
        setSuccessMsg(`Account created! Welcome, ${authUser.displayName}!`);
      }

      saveLocalAuthSession(authUser);
      setTimeout(() => onAuthSuccess(authUser), 500);
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email sign-in is disabled in Firebase Console.');
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

  const handleGuestEntry = () => {
    haptic.lightTap();
    const guestUser: AuthUser = {
      uid: 'guest_user',
      email: null,
      displayName: 'Guest',
      photoURL: null,
      isLocal: true,
      isGuest: true,
    };
    saveLocalAuthSession(guestUser);
    onContinueGuest();
  };

  return (
    <div className="min-h-screen w-full bg-[#090a0f] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/8 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-600/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-[350px] h-[350px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[400px] z-10 space-y-4 my-auto"
      >
        {/* Hero */}
        <div className="text-center space-y-4 pt-4">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', damping: 18 }}
            className="w-24 h-24 mx-auto rounded-[28px] bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 flex items-center justify-center shadow-2xl shadow-amber-500/30"
          >
            <span className="text-5xl font-black text-white tracking-tighter" style={{ fontFamily: 'system-ui' }}>
              D
            </span>
          </motion.div>

          <div>
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-black tracking-tight"
            >
              Do<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">IT</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-white/45 mt-1 font-medium"
            >
              Tasks. Fitness. Nutrition. All in one.
            </motion.p>
          </div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex items-center justify-center gap-2 flex-wrap"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.06 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]"
              >
                <f.icon className={`w-3 h-3 ${f.color}`} />
                <span className="text-[10px] text-white/50 font-medium">{f.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-[#12141c]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 shadow-2xl shadow-black/60 space-y-4"
        >
          {/* Success */}
          <AnimatePresence>
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300"
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
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white hover:bg-white/95 text-black font-semibold text-sm transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50"
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
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[11px] uppercase tracking-widest text-white/25 font-semibold">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Email toggle */}
          {!showEmailForm ? (
            <button
              type="button"
              onClick={() => setShowEmailForm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white/60 text-sm font-semibold transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              Continue with Email
            </button>
          ) : (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handleEmailAuth}
              className="space-y-3"
            >
              {/* Mode switcher */}
              <div className="grid grid-cols-2 p-1 bg-black/40 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => { haptic.lightTap(); setMode('signin'); setError(null); }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { haptic.lightTap(); setMode('signup'); setError(null); }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {mode === 'signup' && (
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-amber-500/60 transition-colors"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-amber-500/60 transition-colors"
                />
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-amber-500/60 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-sm shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                className="w-full text-center text-[11px] text-white/35 hover:text-white/60 transition-colors cursor-pointer"
              >
                {mode === 'signin' ? (
                  <>Don't have an account? <span className="text-amber-400 font-semibold">Sign Up</span></>
                ) : (
                  <>Already have an account? <span className="text-amber-400 font-semibold">Sign In</span></>
                )}
              </button>
            </motion.form>
          )}
        </motion.div>

        {/* Guest Mode */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-[#12141c]/60 backdrop-blur-md border border-white/[0.06] rounded-3xl p-4 sm:p-5 hover:border-amber-500/20 transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <CloudOff className="w-4 h-4 text-amber-400/70" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Guest Mode
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/50 font-mono">Local</span>
              </h3>
              <p className="text-[11px] text-white/40">
                Try everything offline. No cloud sync.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGuestEntry}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] active:scale-[0.99] text-white/70 font-semibold text-xs transition-all border border-white/[0.06] cursor-pointer"
          >
            Continue as Guest
            <ArrowRight className="w-3.5 h-3.5 text-white/40" />
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};
