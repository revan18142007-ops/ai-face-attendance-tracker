import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  Building2,
  User,
  Download,
  CheckCircle2,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { getAllPersons, getAllAttendance } from '../db/store';
import { AttendanceRecord, Person } from '../types';

export const ReportsView: React.FC = () => {
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'individual'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [selectedPersonId, setSelectedPersonId] = useState<number>(1);

  const persons = getAllPersons();
  const allLogs = getAllAttendance();

  // Filter records based on report tab
  let filteredLogs: AttendanceRecord[] = [];
  if (reportType === 'daily') {
    filteredLogs = allLogs.filter((l) => l.date === selectedDate);
  } else if (reportType === 'monthly') {
    filteredLogs = allLogs.filter((l) => l.date.startsWith(selectedMonth));
  } else if (reportType === 'individual') {
    filteredLogs = allLogs.filter((l) => l.personId === selectedPersonId);
  }

  // Selected individual person object
  const currentIndividual: Person | undefined = persons.find((p) => p.id === selectedPersonId);

  // Individual statistics
  const totalSchoolDays = 22; // Typical academic days per month
  const individualPresentDays = filteredLogs.filter((l) => l.status === 'Present').length;
  const individualRate = Math.round((individualPresentDays / totalSchoolDays) * 100);

  // Overall report stats
  const totalVerified = filteredLogs.length;
  const attendanceRate =
    persons.length > 0 ? Math.round((totalVerified / persons.length) * 100) : 0;

  // Export report CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Roll Number', 'Department', 'Email', 'Date', 'Time', 'Status'];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${l.name}"`,
      `"${l.rollNumber}"`,
      `"${l.department}"`,
      `"${l.email}"`,
      l.date,
      `"${l.time}"`,
      l.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const uri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = uri;
    link.download = `attendance_report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Report Type Selector Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-full md:w-auto">
          <button
            onClick={() => setReportType('daily')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all ${
              reportType === 'daily'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily Report
          </button>
          <button
            onClick={() => setReportType('monthly')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all ${
              reportType === 'monthly'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Report
          </button>
          <button
            onClick={() => setReportType('individual')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all ${
              reportType === 'individual'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Individual Student Report
          </button>
        </div>

        {/* Dynamic Controls based on report type */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
          {reportType === 'daily' && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
              <Calendar className="w-4 h-4 text-blue-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none"
              />
            </div>
          )}

          {reportType === 'monthly' && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
              <Calendar className="w-4 h-4 text-blue-600" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none"
              />
            </div>
          )}

          {reportType === 'individual' && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
              <User className="w-4 h-4 text-blue-600" />
              <select
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(Number(e.target.value))}
                className="bg-transparent font-medium text-slate-800 focus:outline-none"
              >
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.rollNumber})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-2">
            <span>Audit Scope</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 truncate">
            {reportType === 'daily'
              ? selectedDate
              : reportType === 'monthly'
              ? selectedMonth
              : currentIndividual?.name || 'Selected'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {reportType === 'individual'
              ? `${currentIndividual?.rollNumber} • ${currentIndividual?.department}`
              : 'Target period audit'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-2">
            <span>Verified Attendances</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {filteredLogs.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Biometrically logged check-ins</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-2">
            <span>Compliance Rate</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-600">
            {reportType === 'individual' ? `${individualRate}%` : `${attendanceRate}%`}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-indigo-600 h-1.5 rounded-full"
              style={{
                width: `${Math.min(100, reportType === 'individual' ? individualRate : attendanceRate)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Audit Entries ({filteredLogs.length})</span>
          </h3>
          <span className="text-xs text-slate-400">Official Institutional Record</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Roll / ID</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Verification Time</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, index) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">{index + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{log.name}</td>
                    <td className="py-3 px-4 font-mono">{log.rollNumber}</td>
                    <td className="py-3 px-4">{log.department}</td>
                    <td className="py-3 px-4 text-slate-600">{log.date}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">{log.time}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Present</span>
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <p className="font-semibold text-slate-700 text-sm">No records logged for this criteria</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Check your date selection or ensure attendees have verified via webcam.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
