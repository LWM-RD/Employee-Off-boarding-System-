import React from 'react';
import { ShieldAlert, LogOut, Lock, ExternalLink, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AccessDeniedProps {
  onOpenSettings: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ onOpenSettings }) => {
  const { currentUser, logout, companyDomain, loginDemo } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-rose-500/30">
      <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-6 shadow-inner">
            <ShieldAlert className="w-9 h-9" />
          </div>

          <span className="text-xs font-semibold tracking-wider uppercase text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 mb-3">
            Security Policy Violation
          </span>

          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Access Restricted
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            This internal portal manages sensitive Microsoft Entra ID identities, Intune hardware wipes, and employee offboarding data.
          </p>

          {/* Account Details Box */}
          <div className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-4 my-6 text-left space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-500" /> Current Identity
              </span>
              <span className="text-rose-400 font-mono text-[11px] bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
                Unauthorized
              </span>
            </div>
            <div className="font-mono text-sm text-slate-200 truncate font-semibold">
              {currentUser?.email || 'Unknown User'}
            </div>
            <div className="text-xs text-slate-500 border-t border-slate-800/80 pt-2 flex items-center justify-between">
              <span>Required Corporate Domain:</span>
              <span className="font-mono text-slate-300 font-medium">
                @{companyDomain}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="w-full space-y-3">
            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm transition-all shadow-lg shadow-rose-900/30 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out & Switch Account
            </button>

            <button
              onClick={() => loginDemo('admin', `it.admin@${companyDomain}`)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
            >
              Switch to Test IT Admin (@{companyDomain})
            </button>

            <button
              onClick={onOpenSettings}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              Change Authorized Domain in Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
