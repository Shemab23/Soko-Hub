import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ShieldAlert, Settings, ArrowLeft, Lock } from 'lucide-react';

interface ModuleNotEnabledProps {
  moduleName: string;
  moduleId: string;
}

export const ModuleNotEnabled: React.FC<ModuleNotEnabledProps> = ({ moduleName, moduleId }) => {
  const { shopSlug } = useParams<{ shopSlug: string }>();

  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
        <Lock className="w-8 h-8" />
      </div>

      <div className="inline-block px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-mono font-bold mb-3 border border-rose-500/20">
        403 FORBIDDEN • module_not_enabled
      </div>

      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
        This module is not enabled for your shop
      </h1>

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed max-w-lg mx-auto">
        Your shop configuration does not currently include the <strong>{moduleName}</strong> ({moduleId}) module.
        The simulated backend strictly refuses this endpoint to protect tenant isolation.
      </p>

      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-300 mb-8 max-w-md mx-auto text-left">
        <div className="text-[10px] text-slate-400 uppercase font-bold">Simulated Server Response:</div>
        <div>Status: <span className="text-rose-500 font-bold">403 Forbidden</span></div>
        <div>Error: <span className="text-amber-600 dark:text-amber-400">&ldquo;This module &apos;{moduleId}&apos; is not enabled for your shop.&rdquo;</span></div>
        <div>Code: <span className="text-blue-500 font-bold">module_not_enabled</span></div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Link
          to={`/t/${shopSlug}/admin`}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <Link
          to={`/t/${shopSlug}/admin/settings`}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
        >
          <Settings className="w-4 h-4" />
          <span>Enable Module in Settings</span>
        </Link>
      </div>
    </div>
  );
};
