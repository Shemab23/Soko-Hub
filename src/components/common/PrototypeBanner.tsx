import React from 'react';
import { Terminal, RefreshCw } from 'lucide-react';
import { useMonitorStore } from '../../sim/monitorStore';
import { api } from '../../api/client';

export const PrototypeBanner: React.FC = () => {
  const { toggleOpen } = useMonitorStore();

  const handleReset = () => {
    if (window.confirm('Reset prototype data to original demo state? This will clear new orders and restore seed products.')) {
      api.resetDatabase();
      window.location.reload();
    }
  };

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs py-1.5 px-4 font-mono flex items-center justify-between select-none z-40">
      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
        <span className="font-semibold tracking-wider uppercase">PROTOTYPE:</span>
        <span>simulated data and payments. No real cards or money involved.</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleOpen}
          className="hover:underline flex items-center gap-1 text-blue-700 dark:text-blue-400 font-medium cursor-pointer"
          title="Press 'B' anytime to toggle developer monitor"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Backend Monitor (press <kbd className="px-1 py-0.5 rounded bg-amber-500/20 font-bold">B</kbd>)</span>
        </button>

        <span className="text-amber-500/40">|</span>

        <button
          onClick={handleReset}
          className="hover:underline flex items-center gap-1 text-slate-600 dark:text-slate-400 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset demo data</span>
        </button>
      </div>
    </div>
  );
};
