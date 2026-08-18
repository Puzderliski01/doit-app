import React from 'react';
import { DeviceMode } from '../types';
import { Wifi, Battery, Sparkles, X } from 'lucide-react';
import { haptic } from '../utils/haptics';

interface MobileDeviceFrameProps {
  deviceMode: DeviceMode;
  onExitMobile: () => void;
  children: React.ReactNode;
}

export const MobileDeviceFrame: React.FC<MobileDeviceFrameProps> = ({
  deviceMode,
  onExitMobile,
  children
}) => {
  if (deviceMode === 'desktop') {
    return <>{children}</>;
  }

  const isIOS = deviceMode === 'mobile-ios';

  return (
    <div className="min-h-screen bg-zinc-950 py-6 px-4 flex flex-col items-center justify-center">
      
      {/* Floating control bar */}
      <div className="mb-4 flex items-center gap-3 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 shadow-xl text-xs">
        <span className="flex items-center gap-1.5 font-bold text-amber-400">
          <Sparkles className="w-3.5 h-3.5" />
          {isIOS ? 'Apple iPhone 16 Pro Native Simulator' : 'Samsung Galaxy S24 Ultra Android Shell'}
        </span>
        <button
          onClick={() => { haptic.lightTap(); onExitMobile(); }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          <span>Exit Frame (Full Web Mode)</span>
        </button>
      </div>

      {/* Phone Hardware Mockup */}
      <div className={`relative w-full max-w-[420px] h-[850px] rounded-[52px] p-3 shadow-2xl transition-all duration-300 ${
        isIOS
          ? 'bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 border-4 border-zinc-600 shadow-amber-500/10'
          : 'bg-gradient-to-b from-zinc-800 via-zinc-900 to-black border-4 border-zinc-700 shadow-sky-500/10'
      }`}>
        
        {/* Inner Phone Screen */}
        <div className="w-full h-full rounded-[42px] bg-zinc-950 overflow-hidden flex flex-col relative border border-zinc-800/80">
          
          {/* iOS Dynamic Island / Android Punch Hole */}
          <div className="w-full h-11 bg-zinc-950 shrink-0 flex items-center justify-between px-6 z-30 select-none">
            <span className="text-xs font-bold text-zinc-100">9:41</span>
            
            {isIOS ? (
              <div className="w-24 h-6 bg-black rounded-full flex items-center justify-end px-2 gap-1 border border-zinc-800/50">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 animate-pulse" />
              </div>
            ) : (
              <div className="w-3.5 h-3.5 bg-black rounded-full border border-zinc-800" />
            )}

            <div className="flex items-center gap-1.5 text-zinc-300">
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-4 h-4" />
            </div>
          </div>

          {/* Actual App Content inside Phone Scroll Container */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
            {children}
          </div>

          {/* iOS Home Indicator Bar */}
          <div className="w-full h-6 bg-zinc-950 shrink-0 flex items-center justify-center select-none">
            <div className="w-32 h-1 bg-zinc-600 rounded-full" />
          </div>

        </div>

      </div>

    </div>
  );
};
