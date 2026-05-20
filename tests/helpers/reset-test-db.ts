/**
 * Database Reset Utility
 * 
 * Cleans up test data from the database.
 * Run with: npm run reset:test
 * 
 * WARNING: This will delete ALL data from the test database!
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const BASE = process.env.API_URL!;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'superadmin@residentiq.test';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';

async function main() {
  console.log('🗑️  Starting database cleanup...\n');

  try {
    // Login as admin
    const loginRes = await axios.post(`${BASE}/auth/admin/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (loginRes.status !== 200) {
      console.error('❌ Admin login failed');
      process.exit(1);
    }

    const token = loginRes.data.token || loginRes.data.accessToken;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('✅ Admin logged in\n');

    // Get all data counts before deletion
    const [students, teachers, hostels, windows] = await Promise.all([
      axios.get(`${BASE}/admin/students?limit=1`, { headers }),
      axios.get(`${BASE}/admin/teachers`, { headers }),
      axios.get(`${BASE}/admin/hostels`, { headers }),
      axios.get(`${BASE}/admin/windows`, { headers }),
    ]);

    console.log('📊 Current database state:');
    console.log(`   Students: ${students.data.total || students.data.length}`);
    console.log(`   Teachers: ${teachers.data.length}`);
    console.log(`   Hostels: ${hostels.data.length}`);
    console.log(`   Windows: ${windows.data.length}\n`);

    const skipConfirm = process.argv.includes('--yes') || process.env.FORCE === '1' || process.env.CI === 'true';
    if (!skipConfirm) {
      console.log('❌ Aborted: pass --yes, FORCE=1, or CI=true to run non-interactively.');
      process.exit(0);
    }

    console.log('\n🗑️  Deleting data...\n');

    // Delete in order to respect foreign key constraints

    // 1. Delete all allocation windows (cascades to assignments and invites)
    console.log('Deleting allocation windows...');
    for (const window of windows.data) {
      try {
        await axios.delete(`${BASE}/admin/windows/${window.id}`, { headers, validateStatus: () => true });
      } catch (e) {
        console.warn(`  ⚠ Failed to delete window ${window.id}`);
      }
    }

    // 2. Delete all students (cascades to assignments, invites, notifications)
    console.log('Deleting students...');
    const allStudents = await axios.get(`${BASE}/admin/students?limit=10000`, { headers });
    let deletedStudents = 0;
    for (const student of allStudents.data.students) {
      try {
        await axios.delete(`${BASE}/admin/students/${student.id}`, { headers, validateStatus: () => true });
        deletedStudents++;
      } catch (e) {
        console.warn(`  ⚠ Failed to delete student ${student.rollNumber}`);
      }
    }
    console.log(`  ✅ Deleted ${deletedStudents} students`);

    // 3. Delete all teachers
    console.log('Deleting teachers...');
    let deletedTeachers = 0;
    for (const teacher of teachers.data) {
      try {
        await axios.delete(`${BASE}/admin/teachers/${teacher.id}`, { headers, validateStatus: () => true });
        deletedTeachers++;
      } catch (e) {
        console.warn(`  ⚠ Failed to delete teacher ${teacher.employeeId}`);
      }
    }
    console.log(`  ✅ Deleted ${deletedTeachers} teachers`);

    // 4. Delete all hostels (cascades to rooms, restrictions, notices)
    console.log('Deleting hostels...');
    let deletedHostels = 0;
    for (const hostel of hostels.data) {
      try {
        await axios.delete(`${BASE}/admin/hostels/${hostel.id}`, { headers, validateStatus: () => true });
        deletedHostels++;
      } catch (e) {
        console.warn(`  ⚠ Failed to delete hostel ${hostel.name}`);
      }
    }
    console.log(`  ✅ Deleted ${deletedHostels} hostels`);

    console.log('\n✨ Database cleanup complete!\n');
    console.log('💡 You can now run the seed script to populate fresh test data.\n');

  } catch (error: any) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

main();
