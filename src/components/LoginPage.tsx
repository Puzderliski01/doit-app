import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckSquare, 
  LogIn, 
  UserPlus, 
  Sparkles, 
  ShieldCheck, 
  User as UserIcon, 
  Mail, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  HardDrive,
  CloudOff,
  Zap,
  LayoutGrid,
  Calendar,
  PieChart
} from 'lucide-react';
import { 
  signInWithGoogle, 
  loginWithEmail, 
  registerWithEmail, 
  saveLocalAuthSession 
} from '../firebase';
import { AuthUser } from '../types';
import { haptic } from '../utils/haptics';

interface LoginPageProps {
  onAuthSuccess: (user: AuthUser) => void;
  onContinueGuest: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onAuthSuccess,
  onContinueGuest
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
        isGuest: false
      };
      setSuccessMsg(`Welcome, ${user.displayName || user.email}!`);
      saveLocalAuthSession(authUser);
      setTimeout(() => {
        onAuthSuccess(authUser);
      }, 500);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is not enabled yet in the Firebase Console. You can use 1-Click Workspace or Guest Mode below.');
      } else {
        setError(err.message || 'Google Sign-In was cancelled or failed. You can use 1-Click Workspace or Guest Mode below.');
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
          isGuest: false
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
          isGuest: false
        };
        setSuccessMsg(`Account created! Welcome, ${authUser.displayName}!`);
      }

      saveLocalAuthSession(authUser);
      setTimeout(() => {
        onAuthSuccess(authUser);
      }, 500);
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email sign-in is disabled in Firebase console. Click "1-Click Launch Workspace" or "Guest Mode" below.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Invalid credentials. If you do not have an account, switch to "Sign Up".');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please switch to "Sign In".');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.');
      } else {
        setError(err.message || 'Authentication error. You can continue via 1-Click Workspace or Guest Mode.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInstantWorkspace = (targetEmail = 's.puzderliski@gmail.com', name = 'S. Puzderliski') => {
    haptic.mediumClick();
    const cleanUid = 'user-' + targetEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const localUser: AuthUser = {
      uid: cleanUid,
      email: targetEmail,
      displayName: name,
      photoURL: null,
      isLocal: true,
      isGuest: false
    };
    saveLocalAuthSession(localUser);
    setSuccessMsg(`Launching workspace for ${targetEmail}...`);
    setTimeout(() => {
      onAuthSuccess(localUser);
    }, 400);
  };

  const handleGuestEntry = () => {
    haptic.lightTap();
    const guestUser: AuthUser = {
      uid: 'guest_user',
      email: null,
      displayName: 'Guest',
      photoURL: null,
      isLocal: true,
      isGuest: true
    };
    saveLocalAuthSession(guestUser);
    onContinueGuest();
  };

  return (
    <div className="min-h-screen w-full bg-[#090a0f] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md z-10 space-y-5 my-auto"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-2.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-mono tracking-wider uppercase text-amber-300 font-semibold">
              Obsidian Task Engine
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 pt-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-black shadow-lg shadow-amber-500/25">
              <CheckSquare className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white font-mono">
              Do<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">IT</span>
            </h1>
          </div>

          <p className="text-xs text-white/50 max-w-xs mx-auto leading-relaxed">
            Minimalist task mastery, radial subtask progress rings, and multi-device sync.
          </p>
        </div>

        {/* Primary Auth Card */}
        <div className="bg-[#12141c]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/60 space-y-4">
          
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-black/40 rounded-2xl border border-white/5">
            <button
              type="button"
              onClick={() => { haptic.lightTap(); setMode('signin'); setError(null); }}
              className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { haptic.lightTap(); setMode('signup'); setError(null); }}
              className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            id="btn-login-google"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white hover:bg-white/95 text-black font-semibold text-sm transition-all shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[11px] uppercase tracking-wider text-white/35 font-mono">or email credentials</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 space-y-2 overflow-hidden"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
                
                <div className="pt-2 border-t border-red-500/20 flex flex-col gap-1.5">
                  <p className="text-[11px] text-white/70">
                    Bypass and enter directly with personal cloud sync:
                  </p>
                  <button
                    type="button"
                    onClick={() => handleInstantWorkspace(email || 's.puzderliski@gmail.com', displayName)}
                    className="w-full py-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Launch Workspace ({email || 's.puzderliski@gmail.com'})</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Message */}
          <AnimatePresence>
            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. S. Puzderliski"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="s.puzderliski@gmail.com"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
            >
              {mode === 'signin' ? <LogIn className="w-4 h-4 stroke-[2.5]" /> : <UserPlus className="w-4 h-4 stroke-[2.5]" />}
              <span>{loading ? 'Authenticating...' : (mode === 'signin' ? 'Sign In & Sync' : 'Create Cloud Account')}</span>
            </button>
          </form>

          {/* Quick Instant Launcher */}
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={() => handleInstantWorkspace('s.puzderliski@gmail.com', 'S. Puzderliski')}
              className="text-[11px] text-amber-400/80 hover:text-amber-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>1-Click Launch Personal Workspace (s.puzderliski@gmail.com)</span>
            </button>
          </div>

        </div>

        {/* GUEST MODE CARD (Local Only, No Cloud Sync) */}
        <div className="bg-[#12141c]/70 backdrop-blur-md border border-white/10 rounded-3xl p-4 sm:p-5 hover:border-amber-500/30 transition-all space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
                <CloudOff className="w-4 h-4 text-amber-400/90" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Guest Mode</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-mono">Offline / Local</span>
                </h3>
                <p className="text-[11px] text-white/50">
                  Try all features locally on this device. Nothing is synced to cloud without login.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            id="btn-guest-mode"
            onClick={handleGuestEntry}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.99] text-white font-semibold text-xs transition-all border border-white/10 cursor-pointer"
          >
            <span>Continue as Guest</span>
            <ArrowRight className="w-3.5 h-3.5 text-white/60" />
          </button>
        </div>

        {/* Feature Highlights Footer */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-center text-white/40 text-[10px]">
          <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center gap-1">
            <PieChart className="w-3.5 h-3.5 text-amber-400/70" />
            <span>Radial Rings</span>
          </div>
          <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center gap-1">
            <LayoutGrid className="w-3.5 h-3.5 text-amber-400/70" />
            <span>Matrix Prioritizer</span>
          </div>
          <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-400/70" />
            <span>Interactive Calendar</span>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
