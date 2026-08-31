import { useState, useEffect, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      setError(event.error || new Error(event.message));
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      setError(new Error(String(event.reason)));
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-[#090a0f] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-sm text-white/50 mb-6">
            An unexpected error occurred. Your data is safe. Try refreshing or clearing the cache.
          </p>
          <div className="mb-6 p-3 rounded-xl bg-white/5 border border-white/10 text-left">
            <p className="text-[11px] font-mono text-red-400 break-all">
              {error.message}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setError(null); window.location.reload(); }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-sm font-bold hover:bg-white/15 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={() => { try { localStorage.clear(); } catch {} window.location.reload(); }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all cursor-pointer"
            >
              Clear Cache & Reload
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
