import React, { useState } from 'react';
import { ShieldCheck, Info, Sparkles, AlertCircle, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SignInProps {
  onOpenSettings: () => void;
}

export const SignIn: React.FC<SignInProps> = ({ onOpenSettings }) => {
  const { loginMicrosoft, loginGoogle, loginDemo, companyDomain, isFirebaseLive } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMicrosoftLogin = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await loginMicrosoft();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate via Microsoft Entra ID');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await loginGoogle();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate via Google');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-indigo-500/30">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative">
        {/* Glow */}
        <div className="absolute -top-20 -left-20 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center">
          {/* Logo badge */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mb-5 shadow-lg shadow-blue-500/25">
            <ShieldCheck className="w-9 h-9" />
          </div>

          <span className="text-[11px] font-semibold tracking-wider uppercase text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 mb-2">
            IT Operations & Security
          </span>

          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Employee Offboarding Tracker
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 max-w-xs">
            Microsoft Entra ID, Intune Device Wipes, M365 Mailboxes & SaaS Perimeter Deprovisioning
          </p>

          {/* Status banner */}
          <div className="w-full my-5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-left flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-slate-300 leading-relaxed">
              Domain Gate Active: Only accounts with{' '}
              <span className="font-mono text-blue-300 font-semibold bg-blue-950/60 px-1 py-0.5 rounded">
                @{companyDomain}
              </span>{' '}
              are authorized.
            </div>
          </div>

          {errorMsg && (
            <div className="w-full mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login actions */}
          <div className="w-full space-y-3">
            {/* Microsoft Entra ID Button */}
            <button
              onClick={handleMicrosoftLogin}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-[#2f2f2f] hover:bg-[#3b3b3b] text-white font-medium text-sm border border-slate-700 transition cursor-pointer shadow-md disabled:opacity-50"
            >
              {/* Microsoft 4-square logo */}
              <svg className="w-4 h-4" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
              Sign in with Microsoft (Entra ID)
            </button>

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-100 font-medium text-sm border border-slate-700 transition cursor-pointer shadow-md disabled:opacity-50"
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
              Sign in with Google Workspace
            </button>
          </div>

          {/* Quick Demo Mode Login */}
          <div className="w-full mt-6 pt-5 border-t border-slate-800 text-left">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
              <span className="flex items-center gap-1 font-semibold text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Quick Test-Drive Roles
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {isFirebaseLive ? 'Firebase Active' : 'Sandbox Mode'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => loginDemo('admin')}
                className="py-2 px-3 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/40 text-blue-200 text-xs font-medium text-center transition cursor-pointer"
              >
                Lead IT Admin
                <span className="block text-[10px] text-blue-400/80">@{companyDomain}</span>
              </button>

              <button
                onClick={() => loginDemo('it_staff')}
                className="py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium text-center transition cursor-pointer"
              >
                IT Support Tech
                <span className="block text-[10px] text-slate-400">@{companyDomain}</span>
              </button>
            </div>

            {/* Test Access Denied simulator */}
            <button
              onClick={() => loginDemo('it_staff', 'external.contractor@otherdomain.com')}
              className="w-full mt-2 py-1.5 px-3 rounded-lg bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/40 text-rose-300 text-[11px] font-medium text-center transition cursor-pointer"
            >
              Simulate Non-Company Login (@otherdomain.com) → Test Access Denied
            </button>
          </div>

          {/* Firebase Settings modal toggle */}
          <div className="w-full mt-4 flex items-center justify-center">
            <button
              onClick={onOpenSettings}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition cursor-pointer py-1"
            >
              <Settings className="w-3.5 h-3.5" />
              Firebase Credentials & Setup Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
