import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  LogIn, 
  UserPlus, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  LogOut,
  Zap,
  KeyRound
} from 'lucide-react';
import { 
  signInWithGoogle, 
  loginWithEmail, 
  registerWithEmail, 
  signInAnonymouslyUser,
  saveLocalAuthSession,
  logoutUser 
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

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onLogout,
  theme
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConsoleConfigError, setIsConsoleConfigError] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isLight = theme === 'light';

  const handleInstantWorkspaceLogin = (customEmail?: string, customName?: string) => {
    const chosenEmail = customEmail || email || 's.puzderliski@gmail.com';
    const chosenName = customName || displayName || chosenEmail.split('@')[0];
    const localUid = 'user-' + chosenEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    const localUser: AuthUser = {
      uid: localUid,
      email: chosenEmail,
      displayName: chosenName,
      photoURL: null,
      isLocal: true
    };
    
    saveLocalAuthSession(localUser);
    setSuccessMsg(`Welcome to your private workspace, ${chosenName}!`);
    if (onAuthSuccess) onAuthSuccess(localUser);
    setTimeout(() => {
      onClose();
      setSuccessMsg(null);
      setError(null);
      setIsConsoleConfigError(false);
    }, 1000);
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsConsoleConfigError(false);
      haptic.mediumClick();
      const user = await signInWithGoogle();
      const authUser: AuthUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isLocal: false
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
        setIsConsoleConfigError(true);
        setError('Google Sign-In is not currently enabled in the Firebase Console for this project.');
      } else {
        setError(err.message || 'Failed to sign in with Google. You can use the Instant Workspace button below.');
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
      setIsConsoleConfigError(false);
      haptic.mediumClick();

      let user: User;
      if (mode === 'signin') {
        user = await loginWithEmail(email, password);
        setSuccessMsg(`Welcome back, ${user.displayName || user.email}!`);
      } else {
        user = await registerWithEmail(email, password, displayName || undefined);
        setSuccessMsg(`Account created successfully! Welcome, ${displayName || user.email}!`);
      }
      
      const authUser: AuthUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || displayName || email.split('@')[0],
        photoURL: user.photoURL,
        isLocal: false
      };

      if (onAuthSuccess) onAuthSuccess(authUser);
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      console.error('Auth Error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setIsConsoleConfigError(true);
        setError('Email/Password sign-in method is currently disabled in your Firebase project console.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. If you do not have an account, click "Sign Up".');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please switch to "Sign In".');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Authentication error. You can continue via Instant Workspace below.');
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
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-md ${
      isLight ? 'bg-black/40' : 'bg-black/75'
    }`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden ${
          isLight
            ? 'bg-white border border-slate-200 text-slate-900 shadow-[0_8px_40px_rgba(0,0,0,0.12)]'
            : 'bg-[#121215] border border-white/15 text-white'
        }`}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center -mt-2 mb-2">
          <div className={`w-10 h-1 rounded-full ${isLight ? 'bg-slate-300' : 'bg-white/20'}`} />
        </div>

        {/* Glow accent */}
        <div className={`absolute -top-24 -left-24 w-52 h-52 rounded-full blur-3xl pointer-events-none ${
          isLight ? 'bg-amber-200/30' : 'bg-amber-500/20'
        }`} />
        <div className={`absolute -bottom-24 -right-24 w-52 h-52 rounded-full blur-3xl pointer-events-none ${
          isLight ? 'bg-orange-200/30' : 'bg-orange-500/20'
        }`} />

        {/* Close Button */}
        <button
          onClick={() => { haptic.lightTap(); onClose(); }}
          className={`absolute top-5 right-5 p-2 rounded-full transition-colors ${
            isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700' : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
          }`}
          title="Close Dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
            isLight ? 'bg-gradient-to-tr from-amber-500 to-orange-500 shadow-amber-500/20' : 'bg-gradient-to-tr from-amber-500 to-orange-500 shadow-amber-500/30'
          }`}>
            <ShieldCheck className={`w-5 h-5 stroke-[2.5] ${isLight ? 'text-white' : 'text-black'}`} />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {currentUser ? 'Your Personal Account' : (mode === 'signin' ? 'Sign In to Your Workspace' : 'Create Personal Account')}
            </h2>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              {currentUser 
                ? 'Only you can view and modify your private tasks.' 
                : 'Log in so you only see your personal tasks in real-time.'}
            </p>
          </div>
        </div>

        {/* Already Logged In View */}
        {currentUser && !currentUser.isGuest ? (
          <div className="space-y-6">
            <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
            }`}>
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.displayName || 'User'} 
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full border-2 border-amber-500/40 object-cover" 
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-lg">
                  {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {currentUser.displayName || 'Authenticated User'}
                </p>
                <p className={`text-xs truncate font-mono ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                  {currentUser.email || 'Private Account'}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Personal cloud sync active</span>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
              isLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-500/10 border-amber-500/20 text-amber-200/90'
            }`}>
              🔒 <strong>Personal Workspace Protection:</strong> Your tasks, categories, and subtasks are tied directly to your unique ID (<code>{currentUser.uid.slice(0, 14)}...</code>). All devices signed in with this account sync in real-time.
            </div>

            <button
              onClick={handleLogout}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 ${
                isLight ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
              }`}
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out & Back to Login Page</span>
            </button>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <div className="space-y-4">
            {currentUser?.isGuest && (
              <div className={`p-3 rounded-2xl border flex items-center gap-2.5 text-xs ${
                isLight ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
              }`}>
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>You are in <strong>Guest Mode</strong>. Sign in below to sync your tasks to the cloud across all devices.</span>
              </div>
            )}
            
            {/* Google One-Click Button */}
            <button
              type="button"
              id="btn-google-auth"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl font-semibold text-sm transition-all shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-50 ${
                isLight ? 'bg-white hover:bg-white/95 text-black border border-slate-200' : 'bg-white hover:bg-white/90 text-black'
              }`}
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

            <div className="flex items-center gap-3 my-2">
              <div className={`flex-1 h-px ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />
              <span className={`text-[11px] uppercase tracking-wider font-mono ${isLight ? 'text-slate-400' : 'text-white/40'}`}>or email login</span>
              <div className={`flex-1 h-px ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />
            </div>

            {/* Notifications / Errors */}
            {error && (
              <div className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                isLight ? 'bg-red-50 border-red-200 text-red-700' : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
                
                {/* Direct 1-Click bypass fallback */}
                <div className={`pt-2 border-t flex flex-col gap-1.5 ${
                  isLight ? 'border-red-200' : 'border-red-500/20'
                }`}>
                  <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                    Bypass provider settings and enter your personal workspace immediately:
                  </p>
                  <button
                    type="button"
                    onClick={() => handleInstantWorkspaceLogin(email || 's.puzderliski@gmail.com', displayName)}
                    className="w-full py-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Enter Personal Workspace as {email || 's.puzderliski@gmail.com'}</span>
                  </button>
                </div>
              </div>
            )}

            {successMsg && (
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>Your Full Name</label>
                  <div className="relative">
                    <UserIcon className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. S. Puzderliski"
                      className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-colors ${
                        isLight ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400' : 'bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-amber-500'
                      }`}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className={`block text-xs font-medium mb-1 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>Email Address</label>
                <div className="relative">
                  <Mail className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="s.puzderliski@gmail.com"
                    className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-colors ${
                      isLight ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400' : 'bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-amber-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>Password</label>
                <div className="relative">
                  <Lock className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-colors ${
                      isLight ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400' : 'bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-amber-500'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-sm shadow-lg shadow-amber-500/25 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
              >
                {mode === 'signin' ? <LogIn className="w-4 h-4 stroke-[2.5]" /> : <UserPlus className="w-4 h-4 stroke-[2.5]" />}
                <span>{loading ? 'Authenticating...' : (mode === 'signin' ? 'Sign In to My Tasks' : 'Create Account & Open Workspace')}</span>
              </button>
            </form>

            <div className="pt-2 flex flex-col items-center gap-2">
              {mode === 'signin' ? (
                <button
                  type="button"
                  onClick={() => { haptic.lightTap(); setMode('signup'); setError(null); }}
                  className={`text-xs transition-colors cursor-pointer ${
                    isLight ? 'text-amber-600 hover:text-amber-700' : 'text-amber-400/90 hover:text-amber-300'
                  }`}
                >
                  Don't have an account yet? <span className="underline font-semibold">Sign Up</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { haptic.lightTap(); setMode('signin'); setError(null); }}
                  className={`text-xs transition-colors cursor-pointer ${
                    isLight ? 'text-amber-600 hover:text-amber-700' : 'text-amber-400/90 hover:text-amber-300'
                  }`}
                >
                  Already registered? <span className="underline font-semibold">Sign In</span>
                </button>
              )}

              {/* Instant One-Click Workspace Button */}
              <button
                type="button"
                onClick={() => handleInstantWorkspaceLogin('s.puzderliski@gmail.com', 'S. Puzderliski')}
                className={`text-[11px] transition-colors flex items-center gap-1.5 mt-1 cursor-pointer ${
                  isLight ? 'text-slate-400 hover:text-slate-700' : 'text-white/40 hover:text-white/80'
                }`}
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>1-Click Launch Personal Workspace (s.puzderliski@gmail.com)</span>
              </button>
            </div>

          </div>
        )}

      </motion.div>
    </div>
  );
};
