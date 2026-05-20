import { faker } from '@faker-js/faker';

// ─── Constants ────────────────────────────────────────────────────────────────

export const PROGRAMS = ['btech', 'mtech', 'phd'] as const;
export const BRANCHES = ['CSE', 'ECE', 'ME', 'CE', 'EE', 'CH', 'BT', 'EP'] as const;
export const GENDERS = ['male', 'female'] as const;
export const YEARS = [1, 2, 3, 4] as const;

export const ADMIN_EMAIL = 'admin@iiituna.ac.in';
export const ADMIN_PASSWORD = 'password123';
// Default password pattern: {rollNumber}@iiituna or {employeeId}@iiituna
export const DEFAULT_STUDENT_PASSWORD = 'TEST00001@iiituna'; // Will be replaced per student
export const DEFAULT_TEACHER_PASSWORD = 'FAC0001@iiituna'; // Will be replaced per teacher

// Helper functions to get the actual password for a student/teacher
export const getStudentPassword = (rollNumber: string) => `${rollNumber}@iiituna`;
export const getTeacherPassword = (employeeId: string) => `${employeeId}@iiituna`;

// ─── Student Generator ────────────────────────────────────────────────────────

export interface TestStudent {
  rollNumber: string;
  name: string;
  email: string;
  year: number;
  branch: string;
  program: string;
  gender: 'male' | 'female';
  phone: string;
  priorityTier: number;
}

let rollCounter = Math.floor(Date.now() / 1000) % 100000;
const testRunState = (globalThis as any).__TEST_RUN_STATE__ ??= {
  studentSalt: Math.random().toString(36).slice(2, 8),
  teacherSalt: Math.random().toString(36).slice(2, 8),
  rollCounter,
  teacherCounter: Math.floor(Date.now() / 10000) % 10000,
};

export function generateStudent(overrides: Partial<TestStudent> = {}): TestStudent {
  const num = String(testRunState.rollCounter++).padStart(5, '0');
  const gender = overrides.gender ?? faker.helpers.arrayElement(GENDERS);
  const program = overrides.program ?? faker.helpers.arrayElement(PROGRAMS);
  const year = overrides.year ?? faker.helpers.arrayElement(YEARS);
  
  return {
    rollNumber: `TEST${testRunState.studentSalt}${num}${Math.floor(Math.random() * 1000000)}`,
    name: faker.person.fullName({ sex: gender as 'male' | 'female' }),
    email: `student.test${testRunState.studentSalt}${num}@residentiq.test`,
    year,
    branch: faker.helpers.arrayElement(BRANCHES),
    program,
    gender,
    phone: `98${faker.string.numeric(8)}`,
    priorityTier: faker.helpers.arrayElement([0, 1, 2]),
    ...overrides,
  };
}

export function generateStudents(count: number, overrides: Partial<TestStudent> = {}): TestStudent[] {
  return Array.from({ length: count }, () => generateStudent(overrides));
}

// Generate cohorts for realistic scenario
export function generateStudentCohorts(): {
  maleBtech: TestStudent[];
  femaleBtech: TestStudent[];
  maleMtech: TestStudent[];
  femaleMtech: TestStudent[];
  malePhd: TestStudent[];
  femalePhd: TestStudent[];
} {
  return {
    maleBtech:   generateStudents(350, { gender: 'male',   program: 'btech' }),
    femaleBtech: generateStudents(200, { gender: 'female', program: 'btech' }),
    maleMtech:   generateStudents(150, { gender: 'male',   program: 'mtech' }),
    femaleMtech: generateStudents(100, { gender: 'female', program: 'mtech' }),
    malePhd:     generateStudents(100, { gender: 'male',   program: 'phd'   }),
    femalePhd:   generateStudents(100, { gender: 'female', program: 'phd'   }),
  };
}

// ─── Teacher Generator ────────────────────────────────────────────────────────

export interface TestTeacher {
  employeeId: string;
  name: string;
  email: string;
  gender: 'male' | 'female';
  department: string;
  phone: string;
}

const DEPARTMENTS = ['CSE', 'ECE', 'ME', 'CE', 'EE', 'Mathematics', 'Physics', 'Chemistry'];

export function generateTeacher(overrides: Partial<TestTeacher> = {}): TestTeacher {
  const num = String(testRunState.teacherCounter++).padStart(4, '0');
  const gender = overrides.gender ?? faker.helpers.arrayElement(GENDERS);
  return {
    employeeId: `FAC${testRunState.teacherSalt}${num}`,
    name: faker.person.fullName({ sex: gender as 'male' | 'female' }),
    email: `faculty.test${testRunState.teacherSalt}${num}@residentiq.test`,
    gender,
    department: faker.helpers.arrayElement(DEPARTMENTS),
    phone: `97${faker.string.numeric(8)}`,
    ...overrides,
  };
}

export function generateTeachers(count: number, overrides: Partial<TestTeacher> = {}): TestTeacher[] {
  return Array.from({ length: count }, () => generateTeacher(overrides));
}

// ─── Hostel Fixtures ──────────────────────────────────────────────────────────

export const HOSTEL_FIXTURES = [
  // Male hostels
  { name: 'Brahmaputra Hall',     gender: 'male',   totalRooms: 120, address: 'Block A, North Campus' },
  { name: 'Ganga Hall',           gender: 'male',   totalRooms: 100, address: 'Block B, North Campus' },
  { name: 'Godavari Hall',        gender: 'male',   totalRooms: 80,  address: 'Block C, North Campus' },
  // Female hostels
  { name: 'Kaveri Hall',          gender: 'female', totalRooms: 100, address: 'Block D, South Campus' },
  { name: 'Yamuna Hall',          gender: 'female', totalRooms: 80,  address: 'Block E, South Campus' },
  // Mixed (for faculty)
  { name: 'Faculty Residence',    gender: 'mixed',  totalRooms: 50,  address: 'Administrative Block' },
];

export interface RoomConfig {
  roomNumber: string;
  capacity: number;
  status?: 'available' | 'maintenance' | 'reserved';
}

/**
 * Generates room configs for a hostel.
 * Creates a mix of 2-seaters and 3-seaters.
 */
export function generateRoomsForHostel(
  count: number,
  options: { startFrom?: number; mix?: { two: number; three: number } } = {}
): RoomConfig[] {
  const { startFrom = 101, mix = { two: 70, three: 30 } } = options;
  const rooms: RoomConfig[] = [];
  
  let twoSeaterCount = Math.round((count * mix.two) / 100);
  let threeSeaterCount = count - twoSeaterCount;

  for (let i = 0; i < count; i++) {
    rooms.push({
      roomNumber: String(startFrom + i),
      capacity: twoSeaterCount-- > 0 ? 2 : 3,
      status: i === 0 ? 'maintenance' : 'available', // First room always under maintenance (edge case)
    });
  }
  
  return rooms;
}

// ─── Window Fixtures ──────────────────────────────────────────────────────────

export function makeWindowDates(
  openInMinutes: number,
  durationHours: number
): { opensAt: string; closesAt: string } {
  const now = new Date();
  const opensAt = new Date(now.getTime() + openInMinutes * 60 * 1000);
  const closesAt = new Date(opensAt.getTime() + durationHours * 60 * 60 * 1000);
  return {
    opensAt: opensAt.toISOString(),
    closesAt: closesAt.toISOString(),
  };
}

// Window that opens NOW and closes in 2 hours
export function makeActiveWindow(durationHours = 2) {
  return makeWindowDates(-1, durationHours);
}

// ─── Test Scenario IDs (set after seeding) ────────────────────────────────────

export interface TestState {
  adminToken: string;
  hostels: Record<string, { id: string; name: string; gender: string }>;
  windows: {
    maleWindow: { id: string };
    femaleWindow: { id: string };
    mixedWindow: { id: string };
  };
  students: {
    // sample tokens for test scenarios
    maleStudent1: { id: string; token: string; rollNumber: string };
    maleStudent2: { id: string; token: string; rollNumber: string };
    femaleStudent1: { id: string; token: string; rollNumber: string };
    femaleStudent2: { id: string; token: string; rollNumber: string };
    unregisteredStudent: { rollNumber: string; password: string };
    priorityStudent: { id: string; token: string };
  };
  teachers: {
    maleTeacher: { id: string; token: string; employeeId: string };
    femaleTeacher: { id: string; token: string; employeeId: string };
  };
  rooms: {
    maleRoom1: { id: string; capacity: number };
    maleRoom2: { id: string; capacity: number };
    maleRoomMaintenance: { id: string };
    femaleRoom1: { id: string; capacity: number };
    femaleRoom2: { id: string; capacity: number };
  };
}
