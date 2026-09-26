/**
 * Local Data Store mimicking SQLite tables:
 * - users
 * - persons
 * - face_encodings
 * - attendance
 */

import { AttendanceRecord, DashboardStats, FaceEncoding, Person, User } from '../types';
import { extract128dEmbedding } from '../utils/faceMatching';

import avatarSarah from '../assets/images/avatar_sarah_student_1790355826992.jpg';
import avatarDavid from '../assets/images/avatar_david_student_1790355843755.jpg';
import avatarElena from '../assets/images/avatar_elena_student_1790355855451.jpg';
import avatarMarcus from '../assets/images/avatar_marcus_student_1790355868065.jpg';
import avatarAmina from '../assets/images/avatar_amina_student_1790355878248.jpg';

const STORAGE_KEYS = {
  USERS: 'face_tracker_users_v2',
  PERSONS: 'face_tracker_persons_v2',
  ENCODINGS: 'face_tracker_encodings_v2',
  ATTENDANCE: 'face_tracker_attendance_v2',
  ADMIN_SESSION: 'face_tracker_session_v2',
};

// Initial Seed Data with diverse departments and realistic records
const DEFAULT_PERSONS: Person[] = [
  {
    id: 1,
    name: 'Sarah Connor',
    rollNumber: 'CS2026-001',
    department: 'Computer Science',
    email: 'sarah.connor@university.edu',
    photoUrl: avatarSarah,
    createdAt: '2026-09-01T08:30:00Z',
  },
  {
    id: 2,
    name: 'David Miller',
    rollNumber: 'AI2026-015',
    department: 'Artificial Intelligence',
    email: 'david.miller@university.edu',
    photoUrl: avatarDavid,
    createdAt: '2026-09-01T09:00:00Z',
  },
  {
    id: 3,
    name: 'Elena Rostova',
    rollNumber: 'IT2026-088',
    department: 'Information Technology',
    email: 'elena.r@university.edu',
    photoUrl: avatarElena,
    createdAt: '2026-09-02T10:15:00Z',
  },
  {
    id: 4,
    name: 'Marcus Vance',
    rollNumber: 'EC2026-042',
    department: 'Electronics & Comm.',
    email: 'm.vance@university.edu',
    photoUrl: avatarMarcus,
    createdAt: '2026-09-02T11:20:00Z',
  },
  {
    id: 5,
    name: 'Amina Al-Mansoor',
    rollNumber: 'ME2026-019',
    department: 'Mechanical Engineering',
    email: 'amina.m@university.edu',
    photoUrl: avatarAmina,
    createdAt: '2026-09-03T09:45:00Z',
  },
];

function generateSeedEncodings(persons: Person[]): FaceEncoding[] {
  const dummyCanvas = document.createElement('canvas');
  dummyCanvas.width = 160;
  dummyCanvas.height = 160;

  return persons.map((p) => ({
    id: p.id,
    personId: p.id,
    encoding: extract128dEmbedding(dummyCanvas, p.rollNumber + '_' + p.name),
    createdAt: p.createdAt,
  }));
}

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function initializeDataStore() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const defaultUser: User = {
      id: 1,
      username: 'admin',
      fullName: 'System Administrator',
      role: 'Super Admin',
    };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([defaultUser]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.PERSONS)) {
    localStorage.setItem(STORAGE_KEYS.PERSONS, JSON.stringify(DEFAULT_PERSONS));
  }

  if (!localStorage.getItem(STORAGE_KEYS.ENCODINGS)) {
    const encodings = generateSeedEncodings(DEFAULT_PERSONS);
    localStorage.setItem(STORAGE_KEYS.ENCODINGS, JSON.stringify(encodings));
  }

  if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
    const today = getTodayString();
    // Seed initial attendance for Sarah & David today
    const seedLogs: AttendanceRecord[] = [
      {
        id: 1,
        personId: 1,
        name: 'Sarah Connor',
        rollNumber: 'CS2026-001',
        department: 'Computer Science',
        email: 'sarah.connor@university.edu',
        date: today,
        time: '08:45:12 AM',
        status: 'Present',
        method: 'Face Recognition',
      },
      {
        id: 2,
        personId: 2,
        name: 'David Miller',
        rollNumber: 'AI2026-015',
        department: 'Artificial Intelligence',
        email: 'david.miller@university.edu',
        date: today,
        time: '09:12:44 AM',
        status: 'Present',
        method: 'Face Recognition',
      },
      {
        id: 3,
        personId: 3,
        name: 'Elena Rostova',
        rollNumber: 'IT2026-088',
        department: 'Information Technology',
        email: 'elena.r@university.edu',
        date: '2026-09-24',
        time: '08:55:00 AM',
        status: 'Present',
        method: 'Face Recognition',
      },
    ];
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(seedLogs));
  }
}

// -------------------------------------------------------------
// Getters and Mutators
// -------------------------------------------------------------
export function getAllPersons(): Person[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PERSONS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getAllEncodings(): FaceEncoding[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ENCODINGS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getAllAttendance(): AttendanceRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function registerNewPerson(
  personData: Omit<Person, 'id' | 'createdAt'>,
  encodingVector: number[]
): { success: boolean; message: string; person?: Person } {
  const persons = getAllPersons();

  // Check roll number uniqueness
  const exists = persons.some(
    (p) => p.rollNumber.toLowerCase() === personData.rollNumber.trim().toLowerCase()
  );
  if (exists) {
    return {
      success: false,
      message: `ID / Roll Number '${personData.rollNumber}' is already registered in the system.`,
    };
  }

  const newId = persons.length > 0 ? Math.max(...persons.map((p) => p.id)) + 1 : 1;
  const newPerson: Person = {
    ...personData,
    id: newId,
    name: personData.name.trim(),
    rollNumber: personData.rollNumber.trim().toUpperCase(),
    department: personData.department.trim(),
    email: personData.email.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
  };

  const encodings = getAllEncodings();
  const newEncoding: FaceEncoding = {
    id: encodings.length > 0 ? Math.max(...encodings.map((e) => e.id)) + 1 : 1,
    personId: newId,
    encoding: encodingVector,
    createdAt: new Date().toISOString(),
  };

  persons.unshift(newPerson);
  encodings.push(newEncoding);

  localStorage.setItem(STORAGE_KEYS.PERSONS, JSON.stringify(persons));
  localStorage.setItem(STORAGE_KEYS.ENCODINGS, JSON.stringify(encodings));

  return {
    success: true,
    message: `Registered ${newPerson.name} successfully!`,
    person: newPerson,
  };
}

export interface MarkAttendanceResult {
  status: 'marked' | 'already_marked' | 'error';
  time: string;
  date: string;
  record?: AttendanceRecord;
}

/**
 * Marks attendance for a person on today's date.
 * Strictly prevents duplicates on the same day!
 */
export function markPersonAttendance(personId: number): MarkAttendanceResult {
  const persons = getAllPersons();
  const person = persons.find((p) => p.id === personId);
  if (!person) {
    return { status: 'error', time: '', date: '', record: undefined };
  }

  const today = getTodayString();
  const allLogs = getAllAttendance();

  // Check duplicate attendance for today
  const existing = allLogs.find(
    (log) => log.personId === personId && log.date === today
  );

  if (existing) {
    return {
      status: 'already_marked',
      time: existing.time,
      date: existing.date,
      record: existing,
    };
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const newRecord: AttendanceRecord = {
    id: allLogs.length > 0 ? Math.max(...allLogs.map((l) => l.id)) + 1 : 1,
    personId: person.id,
    name: person.name,
    rollNumber: person.rollNumber,
    department: person.department,
    email: person.email,
    date: today,
    time: timeStr,
    status: 'Present',
    method: 'Face Recognition',
  };

  allLogs.unshift(newRecord);
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(allLogs));

  return {
    status: 'marked',
    time: timeStr,
    date: today,
    record: newRecord,
  };
}

export function getDashboardMetrics(): DashboardStats {
  const persons = getAllPersons();
  const logs = getAllAttendance();
  const today = getTodayString();

  const presentTodaySet = new Set(
    logs.filter((l) => l.date === today && l.status === 'Present').map((l) => l.personId)
  );

  const totalPersons = persons.length;
  const presentToday = presentTodaySet.size;
  const absentToday = Math.max(0, totalPersons - presentToday);
  const attendancePercentage =
    totalPersons > 0 ? Number(((presentToday / totalPersons) * 100).toFixed(1)) : 0;

  const recentLogs = logs.slice(0, 6);

  const now = new Date();
  const currentDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return {
    totalPersons,
    presentToday,
    absentToday,
    attendancePercentage,
    currentDate,
    recentLogs,
  };
}

export function filterAttendanceRecords(
  dateFilter?: string,
  departmentFilter?: string,
  searchQuery?: string,
  statusFilter?: string
): AttendanceRecord[] {
  let logs = getAllAttendance();

  if (dateFilter) {
    logs = logs.filter((l) => l.date === dateFilter);
  }

  if (departmentFilter && departmentFilter !== 'All') {
    logs = logs.filter((l) => l.department === departmentFilter);
  }

  if (statusFilter && statusFilter !== 'All') {
    logs = logs.filter((l) => l.status === statusFilter);
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    logs = logs.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.rollNumber.toLowerCase().includes(q) ||
        l.department.toLowerCase().includes(q)
    );
  }

  return logs;
}

export function resetToDefaults() {
  localStorage.removeItem(STORAGE_KEYS.USERS);
  localStorage.removeItem(STORAGE_KEYS.PERSONS);
  localStorage.removeItem(STORAGE_KEYS.ENCODINGS);
  localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
  initializeDataStore();
}
