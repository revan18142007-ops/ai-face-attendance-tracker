import React, { useState } from 'react';
import {
  Search,
  Calendar,
  Building2,
  Filter,
  Download,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { filterAttendanceRecords, getAllPersons } from '../db/store';
import { AttendanceRecord } from '../types';

interface AttendanceRecordsViewProps {
  onRecordsChanged: () => void;
}

const DEPARTMENTS = [
  'All',
  'Computer Science',
  'Artificial Intelligence',
  'Information Technology',
  'Electronics & Comm.',
  'Mechanical Engineering',
  'Administration & Staff',
];

export const AttendanceRecordsView: React.FC<AttendanceRecordsViewProps> = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const persons = getAllPersons();
  const personMap = new Map(persons.map((p) => [p.id, p]));

  // Query records
  const records = filterAttendanceRecords(
    selectedDate || undefined,
    selectedDept !== 'All' ? selectedDept : undefined,
    searchQuery || undefined,
    selectedStatus !== 'All' ? selectedStatus : undefined
  );

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDate('');
    setSelectedDept('All');
    setSelectedStatus('All');
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Roll Number', 'Department', 'Email', 'Date', 'Time', 'Status', 'Method'];
    const rows = records.map((r) => [
      r.id,
      `"${r.name}"`,
      `"${r.rollNumber}"`,
      `"${r.department}"`,
      `"${r.email || ''}"`,
      r.date,
      `"${r.time}"`,
      r.status,
      `"${r.method}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Filter and Search Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Search box */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name or roll ID..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Date filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs text-slate-700 focus:outline-none"
              />
            </div>

            {/* Department filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-transparent text-xs text-slate-700 focus:outline-none"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-xs text-slate-700 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present Only</option>
                <option value="Absent">Absent Only</option>
              </select>
            </div>

            {/* Reset */}
            {(searchQuery || selectedDate || selectedDept !== 'All' || selectedStatus !== 'All') && (
              <button
                onClick={resetFilters}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Reset filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {/* Export CSV button */}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Count summary bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
          <span>
            Showing <strong className="text-slate-900">{records.length}</strong> attendance entries
          </span>
          {selectedDate && (
            <span>
              Filtered for: <strong className="text-blue-600">{selectedDate}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Main Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4"># ID</th>
                <th className="py-3 px-4">Student / Employee</th>
                <th className="py-3 px-4">Roll / ID</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Verified Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Auth Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length > 0 ? (
                records.map((r, index) => {
                  const personObj = personMap.get(r.personId);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 font-medium">#{r.id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2.5">
                        {personObj?.photoUrl ? (
                          <img
                            src={personObj.photoUrl}
                            alt={r.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {r.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <span>{r.name}</span>
                          {r.email && (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {r.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono tabular-nums bg-slate-100 px-2 py-0.5 rounded text-slate-700 text-[11px] font-semibold">
                          {r.rollNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-medium">
                          {r.department}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{r.date}</td>
                      <td className="py-3 px-4 font-mono tabular-nums font-semibold text-slate-900">{r.time}</td>
                      <td className="py-3 px-4">
                        {r.status === 'Present' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Present</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700">
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                            <span>Absent</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">{r.method}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="font-semibold text-slate-700 text-sm">No records match the current filters</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try selecting a different date, department, or clearing your search term.
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
