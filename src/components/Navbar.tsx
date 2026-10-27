import React from 'react';
import {
  ShieldCheck,
  PlusCircle,
  LayoutDashboard,
  FileEdit,
  Sliders,
  LogOut,
  Sun,
  Moon,
  Cloud,
  CheckCircle,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeView: 'dashboard' | 'template' | 'detail';
  onNavigate: (view: 'dashboard' | 'template') => void;
  onOpenNewModal: () => void;
  onOpenSettings: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onNavigate,
  onOpenNewModal,
  onOpenSettings,
  darkMode,
  onToggleDarkMode,
}) => {
  const { currentUser, isFirebaseLive } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 tracking-tight">
                    Offboarding Tracker
                  </span>
                  <span className="hidden md:inline-flex items-center text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
                    Entra ID &bull; Intune
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    IT Identity & Asset Deprovisioning
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {isFirebaseLive ? 'Live Firestore' : 'Workstation PC Mode'}
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Navigation items */}
          <div className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeView === 'dashboard'
                  ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </button>

            <button
              onClick={() => onNavigate('template')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeView === 'template'
                  ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5" />
              Edit Template
            </button>

            <button
              onClick={onOpenSettings}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              Firebase Config & Rules
            </button>
          </div>

          {/* Actions & User Profile */}
          <div className="flex items-center gap-2.5">
            {/* New Offboarding button */}
            <button
              onClick={onOpenNewModal}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm hover:shadow-blue-500/20 transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Offboarding</span>
              <span className="sm:hidden">New</span>
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Clean IT Admin Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700">
              <UserCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>IT Admin</span>
            </div>
          </div>
        </div>

        {/* Mobile secondary navigation */}
        <div className="lg:hidden flex items-center gap-2 py-2 border-t border-slate-100 dark:border-slate-800/60 overflow-x-auto">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer ${
              activeView === 'dashboard'
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigate('template')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer ${
              activeView === 'template'
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Edit Template
          </button>
          <button
            onClick={onOpenSettings}
            className="px-3 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap cursor-pointer"
          >
            Firebase Setup Guide
          </button>
        </div>
      </div>
    </header>
  );
};
