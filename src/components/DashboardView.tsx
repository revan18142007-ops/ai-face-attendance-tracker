import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  ScanFace,
  UserPlus,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Building2,
  CalendarCheck,
  Sparkles,
  BarChart2,
  CheckCircle2,
} from 'lucide-react';
import { ActiveTab, DashboardStats } from '../types';
import { getAllPersons } from '../db/store';

interface DashboardViewProps {
  stats: DashboardStats;
  setActiveTab: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ stats, setActiveTab }) => {
  const persons = getAllPersons();
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  // Map persons by ID for easy avatar lookup
  const personMap = new Map(persons.map((p) => [p.id, p]));

  // Calculate department distribution
  const deptCounts: Record<string, { total: number; present: number }> = {};
  persons.forEach((p) => {
    if (!deptCounts[p.department]) {
      deptCounts[p.department] = { total: 0, present: 0 };
    }
    deptCounts[p.department].total += 1;
  });

  stats.recentLogs.forEach((l) => {
    if (deptCounts[l.department]) {
      deptCounts[l.department].present = Math.min(
        deptCounts[l.department].total,
        deptCounts[l.department].present + 1
      );
    }
  });

  // Weekly Trend Data for Campus Academic Days
  const weeklyTrends = [
    { day: 'Mon', date: 'Sep 21', rate: 92, count: 5, total: 5 },
    { day: 'Tue', date: 'Sep 22', rate: 85, count: 4, total: 5 },
    { day: 'Wed', date: 'Sep 23', rate: 100, count: 5, total: 5 },
    { day: 'Thu', date: 'Sep 24', rate: 80, count: 4, total: 5 },
    { day: 'Fri (Today)', date: 'Sep 25', rate: stats.attendancePercentage, count: stats.presentToday, total: stats.totalPersons },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Welcome & Live State Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl border border-slate-800 p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Biometric Recognition Engine Online</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>128-Dimensional Euclidean Vectors</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Institutional Attendance Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Automated facial verification system protecting academic credentials, preventing duplicate check-ins, and auditing campus attendance in real time.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => setActiveTab('attendance')}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <ScanFace className="w-4 h-4" />
              <span>Launch Live Camera Scanner</span>
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>Enrol Person</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Main Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Registered */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Enrolled
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono tabular-nums">
            {stats.totalPersons}
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            <span>Verified biometric profiles on file</span>
          </div>
        </div>

        {/* Card 2: Present Today */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Verified Present
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 tracking-tight font-mono tabular-nums">
            {stats.presentToday}
          </div>
          <div className="mt-2 text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Biometric Camera Checked In</span>
          </div>
        </div>

        {/* Card 3: Absent Today */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Check-In
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 tracking-tight font-mono tabular-nums">
            {stats.absentToday}
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            <span>Awaiting arrival verification</span>
          </div>
        </div>

        {/* Card 4: Attendance Percentage */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Compliance Rate
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-indigo-600 tracking-tight font-mono tabular-nums">
            {stats.attendancePercentage}%
          </div>
          <div className="mt-2">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats.attendancePercentage)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Weekly Attendance Trend Graph */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              <span>5-Day Campus Attendance Velocity</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily percentage of registered individuals completing facial authentication
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-blue-600" />
              <span>Daily Verified %</span>
            </div>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-slate-700 font-semibold">
              Weekly Avg: 88.4%
            </span>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="grid grid-cols-5 gap-3 sm:gap-6 pt-4 pb-2 border-b border-slate-100">
          {weeklyTrends.map((t) => {
            const isToday = t.day.includes('Today');
            return (
              <div
                key={t.day}
                onMouseEnter={() => setHoveredDay(t.day)}
                onMouseLeave={() => setHoveredDay(null)}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="relative w-full h-36 bg-slate-50 rounded-lg flex items-end justify-center p-1.5 overflow-hidden border border-slate-100 group-hover:border-blue-200 transition-all">
                  {/* Target line at 80% */}
                  <div className="absolute top-[20%] left-0 right-0 border-t border-dashed border-slate-200 pointer-events-none" />
                  
                  {/* Bar fill */}
                  <div
                    className={`w-full rounded-md transition-all duration-500 relative ${
                      isToday
                        ? 'bg-gradient-to-t from-blue-700 to-blue-500 shadow-md shadow-blue-500/20'
                        : 'bg-gradient-to-t from-slate-400 to-slate-300 group-hover:from-blue-600 group-hover:to-blue-400'
                    }`}
                    style={{ height: `${Math.max(12, t.rate)}%` }}
                  >
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] font-mono font-bold text-slate-700 group-hover:text-blue-600">
                      {t.rate}%
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <span className={`text-xs block font-bold ${isToday ? 'text-blue-700' : 'text-slate-700'}`}>
                    {t.day}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {t.date}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Attendance Logs (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-bold text-slate-900 text-sm">Today's Verified Check-Ins</h3>
            </div>
            <button
              onClick={() => setActiveTab('records')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {stats.recentLogs.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-4">Enrollee</th>
                    <th className="py-2.5 px-4">Roll / ID</th>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4">Time</th>
                    <th className="py-2.5 px-4">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recentLogs.map((log) => {
                    const personObj = personMap.get(log.personId);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2.5">
                          {personObj?.photoUrl ? (
                            <img
                              src={personObj.photoUrl}
                              alt={log.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                              {log.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="block leading-tight text-slate-900">{log.name}</span>
                            <span className="text-[11px] text-slate-400 font-normal">{log.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-700 font-semibold">
                          {log.rollNumber}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {log.department}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums font-medium text-slate-700">
                          {log.time}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Face ID Match</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-400">
                <ScanFace className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-sm font-medium">No attendance logged yet today</p>
                <p className="text-xs text-slate-400 mt-1">
                  Launch the biometric scanner to start recording punch-in events.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & Department Overview (1 Col) */}
        <div className="space-y-6">
          {/* Quick Action Tiles */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Quick Navigation</h3>
            <div className="space-y-2.5">
              <button
                onClick={() => setActiveTab('attendance')}
                className="w-full text-left p-3 rounded-lg border border-blue-100 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/30">
                    <ScanFace className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                      Live Face Scanner
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Recognize faces & mark attendance in real time
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => setActiveTab('register')}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-slate-50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                      Register Person
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Capture face photo and extract 128-d vector
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => setActiveTab('records')}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-slate-50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                      Audit Records & CSV
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Export attendance logs to Excel/CSV format
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Department Enrollment</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Academic Units</span>
            </div>

            <div className="space-y-3">
              {Object.entries(deptCounts).map(([dept, count]) => {
                const pct = Math.round((count.present / (count.total || 1)) * 100);
                return (
                  <div key={dept} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{dept}</span>
                      <span className="text-slate-500 font-semibold font-mono tabular-nums">
                        {count.present} / {count.total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
