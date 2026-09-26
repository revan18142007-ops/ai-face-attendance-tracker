/**
 * Attendance Tracker
 * Full-featured interactive biometric attendance management system
 */

import React, { useEffect, useState } from 'react';
import { ActiveTab, DashboardStats, User } from './types';
import {
  initializeDataStore,
  getDashboardMetrics,
} from './db/store';

import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardView } from './components/DashboardView';
import { RegisterPersonView } from './components/RegisterPersonView';
import { LiveScannerView } from './components/LiveScannerView';
import { AttendanceRecordsView } from './components/AttendanceRecordsView';
import { ReportsView } from './components/ReportsView';
import { DatabaseView } from './components/DatabaseView';
import { LoginModal } from './components/LoginModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 1,
    username: 'admin',
    fullName: 'System Administrator',
    role: 'Super Admin',
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [stats, setStats] = useState<DashboardStats>(getDashboardMetrics());

  // Initialize Local SQLite-like data store on mount
  useEffect(() => {
    initializeDataStore();
    setStats(getDashboardMetrics());
  }, []);

  const refreshStats = () => {
    setStats(getDashboardMetrics());
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
    refreshStats();
  };

  // If user is logged out, show the Login Portal
  if (!currentUser) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 antialiased overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Topbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Viewport Content Area */}
        <main className="flex-1 overflow-y-auto px-3 py-4 pb-20 sm:p-5 sm:pb-20 lg:px-6 lg:py-6 lg:pb-6 xl:px-8">
          <div className="max-w-[1440px] mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView stats={stats} setActiveTab={setActiveTab} />
            )}

            {activeTab === 'attendance' && (
              <LiveScannerView onAttendanceUpdated={refreshStats} />
            )}

            {activeTab === 'register' && (
              <RegisterPersonView
                onPersonRegistered={refreshStats}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'records' && (
              <AttendanceRecordsView onRecordsChanged={refreshStats} />
            )}

            {activeTab === 'reports' && <ReportsView />}

            {activeTab === 'database' && (
              <DatabaseView onDataReset={refreshStats} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
