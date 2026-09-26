import React, { useState } from 'react';
import {
  Database,
  Table,
  Users,
  Key,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  getAllPersons,
  getAllAttendance,
  getAllEncodings,
  resetToDefaults,
} from '../db/store';

export const DatabaseView: React.FC<{ onDataReset: () => void }> = ({ onDataReset }) => {
  const [activeTable, setActiveTable] = useState<'users' | 'persons' | 'face_encodings' | 'attendance'>('persons');
  const [notice, setNotice] = useState<string | null>(null);

  const persons = getAllPersons();
  const attendance = getAllAttendance();
  const encodings = getAllEncodings();

  const handleReset = () => {
    if (window.confirm('Reset SQLite tables and restore default sample enrollees and logs?')) {
      resetToDefaults();
      onDataReset();
      setNotice('Database successfully re-seeded with initial sample records.');
      setTimeout(() => setNotice(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Database Schema Overview Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              SQLite Database Inspector (`attendance.db`)
            </h3>
            <p className="text-xs text-slate-500">
              Relational architecture with primary keys, unique roll numbers, and 128-d biometric embeddings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset & Re-seed Sample Data</span>
          </button>
        </div>
      </div>

      {/* Table Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTable('persons')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTable === 'persons'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-xs font-bold text-slate-900">persons</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-xl font-extrabold text-blue-700">{persons.length}</span>
          <span className="text-[11px] text-slate-500 block">Enrolled individuals</span>
        </button>

        <button
          onClick={() => setActiveTable('attendance')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTable === 'attendance'
              ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-xs font-bold text-slate-900">attendance</span>
            <Table className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-xl font-extrabold text-emerald-700">{attendance.length}</span>
          <span className="text-[11px] text-slate-500 block">Audit punch logs</span>
        </button>

        <button
          onClick={() => setActiveTable('face_encodings')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTable === 'face_encodings'
              ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-xs font-bold text-slate-900">face_encodings</span>
            <Key className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-xl font-extrabold text-indigo-700">{encodings.length}</span>
          <span className="text-[11px] text-slate-500 block">128-d vectors</span>
        </button>

        <button
          onClick={() => setActiveTable('users')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTable === 'users'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-500/20'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-xs font-bold text-slate-900">users</span>
            <ShieldCheck className="w-4 h-4 text-slate-700" />
          </div>
          <span className="text-xl font-extrabold text-slate-800">1</span>
          <span className="text-[11px] text-slate-500 block">Admin accounts</span>
        </button>
      </div>

      {/* Table Content & Schema Inspector */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header Details */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h4 className="font-mono font-bold text-slate-900 text-sm">
              TABLE: {activeTable}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {activeTable === 'persons' &&
                'Primary table storing student/employee records. Unique constraint on roll_number.'}
              {activeTable === 'attendance' &&
                'Audit records of each verification. Unique composite index on (person_id, date) prevents duplicates.'}
              {activeTable === 'face_encodings' &&
                'Foreign key references persons(id). Holds 128-dimensional floating point vectors.'}
              {activeTable === 'users' &&
                'System credentials with hashed passwords for administrative login.'}
            </p>
          </div>
        </div>

        {/* Dynamic Table Rows */}
        <div className="overflow-x-auto">
          {activeTable === 'persons' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase border-b border-slate-200/80">
                <tr>
                  <th className="py-2.5 px-4">id (PK)</th>
                  <th className="py-2.5 px-4">name</th>
                  <th className="py-2.5 px-4">roll_number (UNIQUE)</th>
                  <th className="py-2.5 px-4">department</th>
                  <th className="py-2.5 px-4">email</th>
                  <th className="py-2.5 px-4">photo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {persons.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-400">#{p.id}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-2.5 px-4 font-mono text-blue-700 font-semibold">
                      {p.rollNumber}
                    </td>
                    <td className="py-2.5 px-4">{p.department}</td>
                    <td className="py-2.5 px-4 text-slate-500">{p.email}</td>
                    <td className="py-2.5 px-4">
                      <img
                        src={p.photoUrl}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTable === 'attendance' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase border-b border-slate-200/80">
                <tr>
                  <th className="py-2.5 px-4">id (PK)</th>
                  <th className="py-2.5 px-4">person_id (FK)</th>
                  <th className="py-2.5 px-4">name</th>
                  <th className="py-2.5 px-4">date (UNIQUE with person_id)</th>
                  <th className="py-2.5 px-4">time</th>
                  <th className="py-2.5 px-4">status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-400">#{a.id}</td>
                    <td className="py-2.5 px-4 font-mono text-blue-600">Person #{a.personId}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{a.name}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-700">{a.date}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-900">{a.time}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTable === 'face_encodings' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase border-b border-slate-200/80">
                <tr>
                  <th className="py-2.5 px-4">id (PK)</th>
                  <th className="py-2.5 px-4">person_id (FK)</th>
                  <th className="py-2.5 px-4">128-d Float Vector Preview</th>
                  <th className="py-2.5 px-4">vector_length</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {encodings.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-400">#{e.id}</td>
                    <td className="py-2.5 px-4 font-mono text-indigo-700 font-semibold">
                      Person #{e.personId}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600 max-w-md truncate">
                      [{e.encoding.slice(0, 8).join(', ')}, ...]
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                        128 elements
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTable === 'users' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase border-b border-slate-200/80">
                <tr>
                  <th className="py-2.5 px-4">id (PK)</th>
                  <th className="py-2.5 px-4">username (UNIQUE)</th>
                  <th className="py-2.5 px-4">password_hash</th>
                  <th className="py-2.5 px-4">full_name</th>
                  <th className="py-2.5 px-4">role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 px-4 font-mono text-slate-400">#1</td>
                  <td className="py-2.5 px-4 font-mono font-bold text-blue-700">admin</td>
                  <td className="py-2.5 px-4 font-mono text-slate-400 text-[11px]">
                    sha256$8f4a9b... (admin123)
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">
                    System Administrator
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                      admin
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
