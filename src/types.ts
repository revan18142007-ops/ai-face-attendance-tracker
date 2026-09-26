export interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
}

export interface Person {
  id: number;
  name: string;
  rollNumber: string;
  department: string;
  email: string;
  photoUrl: string;
  createdAt: string;
}

export interface FaceEncoding {
  id: number;
  personId: number;
  encoding: number[]; // 128-dimensional vector
  createdAt: string;
}

export interface AttendanceRecord {
  id: number;
  personId: number;
  name: string;
  rollNumber: string;
  department: string;
  email: string;
  date: string; // YYYY-MM-DD
  time: string; // hh:mm:ss AM/PM
  status: 'Present' | 'Absent';
  method: string;
}

export interface DashboardStats {
  totalPersons: number;
  presentToday: number;
  absentToday: number;
  attendancePercentage: number;
  currentDate: string;
  recentLogs: AttendanceRecord[];
}

export type ActiveTab = 'dashboard' | 'attendance' | 'register' | 'records' | 'reports' | 'database';
