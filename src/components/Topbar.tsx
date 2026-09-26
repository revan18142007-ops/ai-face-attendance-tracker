import React, { useEffect, useState } from 'react';
import { Clock, Camera, Calendar } from 'lucide-react';
import { ActiveTab } from '../types';

interface TopbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const TAB_TITLES: Record<ActiveTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Executive Dashboard',
    subtitle: 'Real-time overview of campus/office attendance, analytics, and metrics',
  },
  attendance: {
    title: 'Live Biometric Attendance Scanner',
    subtitle: 'Instant neural face matching, automated logging, and duplicate prevention',
  },
  register: {
    title: 'Enrol Student / Employee',
    subtitle: 'Capture facial biometric representation and store in SQLite database',
  },
  records: {
    title: 'Attendance Records Log',
    subtitle: 'Search, filter, and audit verified daily check-in histories',
  },
  reports: {
    title: 'Analytics & Compliance Reports',
    subtitle: 'Generate daily, monthly, and departmental summaries with CSV export',
  },
  database: {
    title: 'SQLite Database Tables',
    subtitle: 'Inspect relational schema: users, persons, face_encodings, attendance',
  },
};

export const Topbar: React.FC<TopbarProps> = ({ activeTab, setActiveTab }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const meta = TAB_TITLES[activeTab] || {
    title: 'Attendance Tracker',
    subtitle: 'Biometric Attendance Management',
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{meta.title}</h2>
        <p className="text-xs text-slate-500 font-medium">{meta.subtitle}</p>
      </div>

      <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
        {/* Real-time Clock */}
        <div className="flex items-center gap-2 bg-slate-100/80 border border-slate-200/80 px-3 py-1.5 rounded-lg text-slate-700 text-xs font-semibold">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>
            {currentTime.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span className="text-slate-300">|</span>
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-mono text-slate-900 font-bold">
            {currentTime.toLocaleTimeString('en-US', { hour12: true })}
          </span>
        </div>

        {activeTab !== 'attendance' && (
          <button
            onClick={() => setActiveTab('attendance')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Open Scanner</span>
          </button>
        )}
      </div>
    </header>
  );
};
