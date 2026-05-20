/**
 * Seed script: Creates 1000 students + 30 teachers via the Admin API.
 * Run with: npm run seed:test (after the server is running)
 *
 * This populates the DB with a realistic cohort for load testing.
 * Idempotent – re-running skips already-existing roll numbers.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { faker } from '@faker-js/faker';

// Minimal local copy of the fixtures helpers used by seed script
export const ADMIN_EMAIL = 'admin@iiituna.ac.in';
export const ADMIN_PASSWORD = 'password123';
export const DEFAULT_STUDENT_PASSWORD = 'TEST00001@iiituna';
export const DEFAULT_TEACHER_PASSWORD = 'FAC0001@iiituna';

const PROGRAMS = ['btech', 'mtech', 'phd'] as const;
const BRANCHES = ['CSE', 'ECE', 'ME', 'CE', 'EE', 'CH', 'BT', 'EP'] as const;
const GENDERS = ['male', 'female'] as const;
const YEARS = [1, 2, 3, 4] as const;

let rollCounter = Math.floor(Date.now() / 1000) % 100000;
const testRunState = (globalThis as any).__TEST_RUN_STATE__ ??= {
  studentSalt: Math.random().toString(36).slice(2, 8),
  teacherSalt: Math.random().toString(36).slice(2, 8),
  rollCounter,
  teacherCounter: Math.floor(Date.now() / 10000) % 10000,
};

export function generateStudent(overrides: any = {}) {
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

export function generateStudents(count: number, overrides: any = {}) {
  return Array.from({ length: count }, () => generateStudent(overrides));
}

export function generateStudentCohorts() {
  return {
    maleBtech:   generateStudents(350, { gender: 'male',   program: 'btech' }),
    femaleBtech: generateStudents(200, { gender: 'female', program: 'btech' }),
    maleMtech:   generateStudents(150, { gender: 'male',   program: 'mtech' }),
    femaleMtech: generateStudents(100, { gender: 'female', program: 'mtech' }),
    malePhd:     generateStudents(100, { gender: 'male',   program: 'phd'   }),
    femalePhd:   generateStudents(100, { gender: 'female', program: 'phd'   }),
  };
}

const DEPARTMENTS = ['CSE', 'ECE', 'ME', 'CE', 'EE', 'Mathematics', 'Physics', 'Chemistry'];
export function generateTeacher(overrides: any = {}) {
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

export function generateTeachers(count: number, overrides: any = {}) {
  return Array.from({ length: count }, () => generateTeacher(overrides));

}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const BASE = process.env.API_URL!;

async function main() {
  console.log('🌱 Starting ResidentIQ test-data seed...\n');

  // ── 1. Admin Login ──────────────────────────────────────────────────────────
  const loginRes = await axios.post(`${BASE}/auth/admin/login`, {
    email: process.env.ADMIN_EMAIL || ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD || ADMIN_PASSWORD,
  });
  if (loginRes.status !== 200) {
    console.error('❌ Admin login failed:', loginRes.data);
    process.exit(1);
  }
  const token = loginRes.data.token || loginRes.data.accessToken || loginRes.data.access_token;
  const headers = { Authorization: `Bearer ${token}` };
  console.log(`✅ Admin logged in: ${process.env.ADMIN_EMAIL || ADMIN_EMAIL}\n`);

  // ── 1.5 Create Hostels, Rooms and Windows ─────────────────────────────────
  console.log('🏗️  Ensuring hostels, rooms and allocation windows exist...');
  const createdHostels: any[] = [];
  // local copy of hostel fixtures (avoid import resolution issues when running via ts-node)
  const HOSTEL_FIXTURES = [
    { name: 'Brahmaputra Hall',     gender: 'male',   totalRooms: 120, address: 'Block A, North Campus' },
    { name: 'Ganga Hall',           gender: 'male',   totalRooms: 100, address: 'Block B, North Campus' },
    { name: 'Godavari Hall',        gender: 'male',   totalRooms: 80,  address: 'Block C, North Campus' },
    { name: 'Kaveri Hall',          gender: 'female', totalRooms: 100, address: 'Block D, South Campus' },
    { name: 'Yamuna Hall',          gender: 'female', totalRooms: 80,  address: 'Block E, South Campus' },
    { name: 'Faculty Residence',    gender: 'mixed',  totalRooms: 50,  address: 'Administrative Block' },
  ];

  function makeActiveWindow(durationHours = 2) {
    const now = new Date();
    const opensAt = new Date(now.getTime() - 60 * 1000); // already open
    const closesAt = new Date(opensAt.getTime() + durationHours * 60 * 60 * 1000);
    return { opensAt: opensAt.toISOString(), closesAt: closesAt.toISOString() };
  }

  for (const h of HOSTEL_FIXTURES) {
    try {
      const res = await axios.post(`${BASE}/admin/hostels`, h, { headers, validateStatus: () => true });
      if (res.status === 201) {
        createdHostels.push(res.data);
        console.log(`  ✅ Created hostel ${h.name}`);
      } else if (res.status === 409) {
        // find existing by name
        const existing = await axios.get(`${BASE}/admin/hostels`, { headers });
        const found = existing.data.find((x: any) => x.name === h.name);
        if (found) createdHostels.push(found);
        console.log(`  ℹ️  Hostel ${h.name} already exists`);
      } else {
        console.warn(`  ⚠ Failed to create hostel ${h.name}: ${res.data?.message}`);
      }
    } catch (e: any) {
      console.warn(`  ✗ ${h.name}: ${e.message}`);
    }
  }

  // Create rooms in batch for each hostel (createMany skipDuplicates)
  for (const hostel of createdHostels) {
    try {
      const total = hostel.totalRooms || 50;
      const prefix = `R-${hostel.name.replace(/\s+/g, '_').slice(0,10)}-`;
      const res = await axios.post(`${BASE}/admin/rooms/batch`, { hostelId: hostel.id, prefix, from: '1', to: String(Math.min(total, 200)), capacity: '2' }, { headers, validateStatus: () => true });
      if (res.status === 201) console.log(`  ✅ Batch created rooms for ${hostel.name} (${res.data.count})`);
    } catch (e: any) {
      console.warn(`  ⚠ Failed to batch create rooms for ${hostel.name}: ${e.message}`);
    }
  }

  // Create active allocation windows for male, female and mixed
  const makeWindow = (gender: string, hostelId?: string) => ({
    name: `Auto-${gender}-window-${Date.now()}`,
    gender,
    hostelId: hostelId || undefined,
    ...makeActiveWindow(2),
    allowedPrograms: [],
    allowedYears: [],
  });

  try {
    // male window
    await axios.post(`${BASE}/admin/windows`, makeWindow('male', createdHostels.find(h => h.gender === 'male')?.id), { headers, validateStatus: () => true });
    await axios.post(`${BASE}/admin/windows`, makeWindow('female', createdHostels.find(h => h.gender === 'female')?.id), { headers, validateStatus: () => true });
    await axios.post(`${BASE}/admin/windows`, makeWindow('mixed', createdHostels.find(h => h.gender === 'mixed')?.id), { headers, validateStatus: () => true });
    console.log('  ✅ Allocation windows created');
  } catch (e: any) {
    console.warn('  ⚠ Failed to create allocation windows:', e.message);
  }


  // ── 2. Seed Students ────────────────────────────────────────────────────────
  const cohorts = generateStudentCohorts();
  const allStudents = [
    ...cohorts.maleBtech,
    ...cohorts.femaleBtech,
    ...cohorts.maleMtech,
    ...cohorts.femaleMtech,
    ...cohorts.malePhd,
    ...cohorts.femalePhd,
  ];

  console.log(`📚 Seeding ${allStudents.length} students...`);
  let created = 0, skipped = 0, failed = 0;

  // Batch in chunks of 20 to avoid overwhelming the server
  const CHUNK = 20;
  for (let i = 0; i < allStudents.length; i += CHUNK) {
    const chunk = allStudents.slice(i, i + CHUNK);
    await Promise.all(chunk.map(async (student) => {
      try {
        const res = await axios.post(`${BASE}/admin/students`, {
          ...student,
          password: `${student.rollNumber}@iiituna`,
        }, { headers, validateStatus: () => true });

        if (res.status === 201) created++;
        else if (res.status === 409) skipped++; // already exists
        else { failed++; console.warn(`  ⚠ ${student.rollNumber}: ${res.data?.message}`); }
      } catch (e: any) {
        failed++;
        console.warn(`  ✗ ${student.rollNumber}: ${e.message}`);
      }
    }));

    process.stdout.write(`\r  Progress: ${Math.min(i + CHUNK, allStudents.length)}/${allStudents.length}`);
  }
  console.log(`\n  ✅ Students – created: ${created}, skipped: ${skipped}, failed: ${failed}`);

  // ── 3. Seed Teachers ────────────────────────────────────────────────────────
  const teachers = [
    ...generateTeachers(15, { gender: 'male' }),
    ...generateTeachers(15, { gender: 'female' }),
  ];

  console.log(`\n👩‍🏫 Seeding ${teachers.length} teachers...`);
  created = 0; skipped = 0; failed = 0;

  for (const teacher of teachers) {
    try {
      const res = await axios.post(`${BASE}/admin/teachers`, {
        ...teacher,
        password: `${teacher.employeeId}@iiituna`,
      }, { headers, validateStatus: () => true });

      if (res.status === 201) created++;
      else if (res.status === 409) skipped++;
      else { failed++; console.warn(`  ⚠ ${teacher.employeeId}: ${res.data?.message}`); }
    } catch (e: any) {
      failed++;
      console.warn(`  ✗ ${teacher.employeeId}: ${e.message}`);
    }
  }
  console.log(`  ✅ Teachers – created: ${created}, skipped: ${skipped}, failed: ${failed}`);

  // ── 4. Summary ──────────────────────────────────────────────────────────────
  console.log('\n✨ Seed complete!\n');
  console.log('Next: Run npm test to execute the full test suite.\n');
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
