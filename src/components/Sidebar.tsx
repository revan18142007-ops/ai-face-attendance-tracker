import React from 'react';
import {
  LayoutDashboard,
  UserPlus,
  ScanFace,
  CalendarCheck,
  FileSpreadsheet,
  BarChart3,
  Database,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { ActiveTab, User } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
}) => {
  const menuItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'attendance', label: 'Live Scanner', icon: <ScanFace className="w-5 h-5" />, badge: 'LIVE' },
    { id: 'register', label: 'Register Person', icon: <UserPlus className="w-5 h-5" /> },
    { id: 'records', label: 'Attendance Records', icon: <FileSpreadsheet className="w-5 h-5" /> },
    { id: 'reports', label: 'Analytics & Reports', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'database', label: 'SQLite Database', icon: <Database className="w-5 h-5" /> },
  ];

  return (
    <aside className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-slate-900 text-slate-300 flex flex-row border-t border-slate-800 select-none md:static md:h-auto md:w-64 md:flex-col md:border-t-0 md:border-r">
      {/* Brand Header */}
      <div className="hidden p-5 border-b border-slate-800/80 items-center gap-3 md:flex">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
          <CalendarCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-tight text-base leading-tight">
            Attendance Tracker
          </h1>
          <span className="text-[11px] text-blue-400 font-medium uppercase tracking-wider">
            Biometric Suite
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex flex-1 items-stretch gap-1 overflow-x-auto p-1.5 md:block md:space-y-1 md:overflow-y-auto md:overflow-x-hidden md:p-3">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={item.label}
              className={`min-w-[52px] flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-all sm:min-w-[76px] md:w-full md:min-w-0 md:flex-row md:justify-between md:px-3.5 md:py-2.5 md:text-sm ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/25'
                  : 'hover:bg-slate-800/70 hover:text-white text-slate-400'
              }`}
            >
              <div className="flex flex-col items-center gap-0.5 md:flex-row md:gap-3">
                {item.icon}
                <span className="hidden max-w-[76px] truncate sm:inline md:max-w-none">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`hidden text-[10px] font-bold px-1.5 py-0.5 rounded md:inline-block ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.badge === 'LIVE'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Admin Profile & Logout */}
      <div className="hidden p-3 border-t border-slate-800/80 bg-slate-950/40 md:block">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-xs shrink-0">
              AD
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate flex items-center gap-1">
                {currentUser?.fullName || 'Admin User'}
                <ShieldCheck className="w-3 h-3 text-emerald-400 inline shrink-0" />
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {currentUser?.role || 'Super Admin'}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
