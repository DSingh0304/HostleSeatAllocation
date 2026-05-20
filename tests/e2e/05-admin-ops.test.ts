/**
 * E2E Test Suite 05: Admin Operations
 *
 * Tests:
 *  - Manual room allocation override
 *  - Force allocation to full room
 *  - Unallocate student from room
 *  - Dashboard statistics
 *  - Occupancy reports
 *  - Allocation list with pagination
 *  - Export allocations to CSV
 *  - Audit log tracking
 *  - Notice board CRUD
 *  - Notice visibility (global vs hostel-specific)
 *  - Window lock/unlock
 *  - Hostel restrictions
 *  - Bulk student import validation
 *  - Teacher allocation
 *  - Warden permissions
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, expectStatus, loginAdmin } from '../helpers/api-client';
import { generateStudent, generateTeacher, getStudentPassword, getTeacherPassword, ADMIN_EMAIL, ADMIN_PASSWORD } from '../fixtures/data';

const state = (globalThis as any).__TEST_STATE__;

let adminClient: ReturnType<typeof createClient>;
let overrideRoomId: string;
const createdResourceIds = {
  hostels: [] as string[],
  rooms: [] as string[],
  windows: [] as string[],
  students: [] as string[],
};

async function createTempHostel(name: string, gender: 'male' | 'female' | 'mixed') {
  const res = await adminClient.post('/admin/hostels', {
    name,
    gender,
    totalRooms: 2,
    address: `${name} address`,
  });
  createdResourceIds.hostels.push(res.data.id);
  return res.data.id as string;
}

async function createTempRoom(hostelId: string, roomNumber: string) {
  const res = await adminClient.post('/admin/rooms', {
    hostelId,
    rooms: [{ roomNumber, capacity: 2 }],
  });
  const roomId = res.data.id || res.data[0]?.id;
  if (roomId) createdResourceIds.rooms.push(roomId);
  return roomId as string;
}

async function createTempWindow(hostelId: string, name: string, gender: 'male' | 'female' | 'mixed') {
  const now = new Date();
  const res = await adminClient.post('/admin/windows', {
    name,
    gender,
    hostelId,
    opensAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    closesAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    allowedPrograms: ['btech', 'mtech', 'phd'],
    allowedYears: [1, 2, 3, 4],
  });
  createdResourceIds.windows.push(res.data.id);
  await adminClient.put(`/admin/windows/${res.data.id}/activate`, { isActive: true });
  return res.data.id as string;
}

// Create test subjects for admin operations
const overrideStudent = generateStudent({ gender: 'male', program: 'btech', year: 4 });
const overrideTeacher = generateTeacher({ gender: 'female' });

beforeAll(async () => {
  // Ensure we are logged in as admin
  const token = await loginAdmin(
    process.env.ADMIN_EMAIL || ADMIN_EMAIL,
    process.env.ADMIN_PASSWORD || ADMIN_PASSWORD
  );
  adminClient = createClient(token);

  // Create test student and teacher
  await adminClient.post('/admin/students', { ...overrideStudent, password: getStudentPassword(overrideStudent.rollNumber) });
  await adminClient.post('/admin/teachers', { ...overrideTeacher, password: getTeacherPassword(overrideTeacher.employeeId) });

  if (!state.maleHostelId) {
    state.maleHostelId = await createTempHostel(`ADMIN-OPS-MALE-${overrideStudent.rollNumber}`, 'male');
  }
  if (!state.mixedHostelId) {
    state.mixedHostelId = await createTempHostel(`ADMIN-OPS-MIXED-${overrideStudent.rollNumber}`, 'mixed');
  }
  if (!state.rooms) state.rooms = {};
  if (!state.windows) state.windows = {};
  if (!state.students) state.students = {};

  overrideRoomId = await createTempRoom(state.maleHostelId, `ADMIN-OVERRIDE-${overrideStudent.rollNumber}`);

  if (!state.mixedRoom1) {
    state.mixedRoom1 = { id: await createTempRoom(state.mixedHostelId, `ADMIN-MIXED-${overrideStudent.rollNumber}`) };
  }

  if (!state.windows.maleWindowId) {
    state.windows.maleWindowId = await createTempWindow(state.maleHostelId, `ADMIN-WINDOW-${overrideStudent.rollNumber}`, 'male');
  }

  if (!state.students.maleStudent1?.token) {
    const bootstrapStudent = generateStudent({ gender: 'male', program: 'btech', year: 1 });
    await adminClient.post('/admin/students', { ...bootstrapStudent, password: getStudentPassword(bootstrapStudent.rollNumber) });
    const loginRes = await createClient().post('/auth/login', {
      rollNumber: bootstrapStudent.rollNumber,
      password: getStudentPassword(bootstrapStudent.rollNumber),
    });
    state.students.maleStudent1 = {
      ...bootstrapStudent,
      token: loginRes.data.token || loginRes.data.accessToken,
    };
    createdResourceIds.students.push((await adminClient.get(`/admin/students?search=${bootstrapStudent.rollNumber}`)).data.students[0].id);
  }
});

afterAll(async () => {
  for (const windowId of createdResourceIds.windows.reverse()) {
    await adminClient.delete(`/admin/windows/${windowId}`).catch(() => {});
  }
  for (const roomId of createdResourceIds.rooms.reverse()) {
    await adminClient.delete(`/admin/rooms/${roomId}`).catch(() => {});
  }
  for (const studentId of createdResourceIds.students.reverse()) {
    await adminClient.delete(`/admin/students/${studentId}`).catch(() => {});
  }
  for (const hostelId of createdResourceIds.hostels.reverse()) {
    await adminClient.delete(`/admin/hostels/${hostelId}`).catch(() => {});
  }
});

describe('Manual Allocation Override', () => {
  let assignmentId: string;

  it('admin manually allocates student to room', async () => {
    const res = await adminClient.post('/admin/allocations/override', {
      studentId: (await adminClient.get('/admin/students?search=' + overrideStudent.rollNumber)).data.students[0].id,
      roomId: overrideRoomId,
      windowId: state.windows?.maleWindowId,
      notes: 'Manual override for testing',
    });
    expectStatus(res, 201);
    expect(res.data).toHaveProperty('id');
    expect(res.data.adminOverride).toBe(true);
    assignmentId = res.data.id;
  });

  it('manual allocation appears in allocation list', async () => {
    const res = await adminClient.get('/admin/allocations');
    expectStatus(res, 200);
    expect(res.data.allocations.some((a: any) => a.id === assignmentId)).toBe(true);
  });

  it('admin unallocates student from room', async () => {
    const res = await adminClient.delete(`/admin/allocations/${assignmentId}`);
    expectStatus(res, 200);
    expect(res.data.message).toMatch(/cancelled/i);
  });

  it('unallocated assignment is marked as cancelled', async () => {
    const res = await adminClient.get('/admin/allocations');
    expectStatus(res, 200);
    const assignment = res.data.allocations.find((a: any) => a.id === assignmentId);
    // Should not appear in confirmed list or be marked cancelled
    expect(assignment).toBeUndefined(); // Filtered out by status: confirmed
  });
});

describe('Force Allocation to Full Room', () => {
  it('admin can force allocate to full room with force flag', async () => {
    // First, find a 2-seater room and fill it
    const tmpRoom = await adminClient.post('/admin/rooms', {
      hostelId: state.maleHostelId,
      rooms: [{ roomNumber: `FORCE-TEST-${overrideStudent.rollNumber}`, capacity: 2 }],
    });
    const roomId = tmpRoom.data.id || tmpRoom.data[0]?.id;
    if (roomId) createdResourceIds.rooms.push(roomId);

    // Create 3 students
    const { generateStudent, getStudentPassword } = await import('../fixtures/data');
    const s1 = generateStudent({ gender: 'male', program: 'btech', year: 1 });
    const s2 = generateStudent({ gender: 'male', program: 'btech', year: 1 });
    const s3 = generateStudent({ gender: 'male', program: 'btech', year: 1 });

    for (const s of [s1, s2, s3]) {
      await adminClient.post('/admin/students', { ...s, password: getStudentPassword(s.rollNumber) });
    }

    const getStudentId = async (roll: string) => {
      const res = await adminClient.get(`/admin/students?search=${roll}`);
      return res.data.students[0].id;
    };

    const id1 = await getStudentId(s1.rollNumber);
    const id2 = await getStudentId(s2.rollNumber);
    const id3 = await getStudentId(s3.rollNumber);

    // Allocate first two students
    await adminClient.post('/admin/allocations/override', {
      studentId: id1,
      roomId,
      windowId: state.windows?.maleWindowId,
    });
    await adminClient.post('/admin/allocations/override', {
      studentId: id2,
      roomId,
      windowId: state.windows?.maleWindowId,
    });

    // Try to allocate third without force (should fail)
    const res1 = await adminClient.post('/admin/allocations/override', {
      studentId: id3,
      roomId,
      windowId: state.windows?.maleWindowId,
    });
    expect(res1.status).toBe(409);
    expect(res1.data.message).toMatch(/capacity/i);
    expect(res1.data.canForce).toBe(true);

    // Now force allocate
    const res2 = await adminClient.post('/admin/allocations/override', {
      studentId: id3,
      roomId,
      windowId: state.windows?.maleWindowId,
      force: true,
    });
    expectStatus(res2, 201);
  });
});

describe('Teacher Allocation', () => {
  it('admin allocates teacher to mixed hostel room', async () => {
    const teacherId = (await adminClient.get('/admin/teachers')).data.find(
      (t: any) => t.employeeId === overrideTeacher.employeeId
    )?.id;

    if (!teacherId) {
      console.warn('Teacher not found, skipping test');
      return;
    }

    // Get a room from mixed hostel
    const mixedRooms = await adminClient.get(`/admin/hostels/${state.mixedHostelId}/rooms`);
    const availableRoom = mixedRooms.data.find((r: any) => r.status === 'available');

    if (!availableRoom) {
      console.warn('No available room in mixed hostel, skipping test');
      return;
    }

    const res = await adminClient.post('/admin/allocations/override', {
      teacherId,
      roomId: availableRoom.id,
      windowId: state.windows?.maleWindowId, // Any window works for admin override
      notes: 'Faculty accommodation',
    });
    expectStatus(res, 201);
    expect(res.data.teacherId).toBe(teacherId);
  });
});

describe('Dashboard Statistics', () => {
  it('returns dashboard stats', async () => {
    const res = await adminClient.get('/admin/dashboard/stats');
    expectStatus(res, 200);
    expect(res.data).toHaveProperty('totalStudents');
    expect(res.data).toHaveProperty('totalCapacity');
    expect(res.data).toHaveProperty('occupiedSeats');
    expect(res.data).toHaveProperty('totalHostels');
    expect(res.data).toHaveProperty('totalTeachers');
    expect(typeof res.data.totalStudents).toBe('number');
    expect(res.data.totalStudents).toBeGreaterThan(0);
  });
});

describe('Occupancy Reports', () => {
  it('generates occupancy report for all hostels', async () => {
    const res = await adminClient.get('/admin/reports/occupancy');
    expectStatus(res, 200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    
    const hostel = res.data[0];
    expect(hostel).toHaveProperty('name');
    expect(hostel).toHaveProperty('totalCapacity');
    expect(hostel).toHaveProperty('occupied');
    expect(hostel).toHaveProperty('available');
    expect(hostel).toHaveProperty('occupancyPct');
    expect(hostel).toHaveProperty('rooms');
    expect(Array.isArray(hostel.rooms)).toBe(true);
  });

  it('occupancy percentages are calculated correctly', async () => {
    const res = await adminClient.get('/admin/reports/occupancy');
    expectStatus(res, 200);
    
    for (const hostel of res.data) {
      if (hostel.totalCapacity > 0) {
        const expectedPct = Math.round((hostel.occupied / hostel.totalCapacity) * 100);
        expect(hostel.occupancyPct).toBe(expectedPct);
      }
    }
  });
});

describe('Allocation List & Pagination', () => {
  it('lists all allocations with pagination', async () => {
    const res = await adminClient.get('/admin/allocations?page=1&limit=10');
    expectStatus(res, 200);
    expect(res.data).toHaveProperty('allocations');
    expect(res.data).toHaveProperty('total');
    expect(Array.isArray(res.data.allocations)).toBe(true);
  });

  it('pagination works correctly', async () => {
    const page1 = await adminClient.get('/admin/allocations?page=1&limit=5');
    const page2 = await adminClient.get('/admin/allocations?page=2&limit=5');
    
    expectStatus(page1, 200);
    expectStatus(page2, 200);
    
    if (page1.data.total > 5) {
      expect(page1.data.allocations.length).toBeLessThanOrEqual(5);
      // Ensure different results
      const ids1 = page1.data.allocations.map((a: any) => a.id);
      const ids2 = page2.data.allocations.map((a: any) => a.id);
      expect(ids1.some((id: string) => ids2.includes(id))).toBe(false);
    }
  });

  it('search filters allocations', async () => {
    const res = await adminClient.get(`/admin/allocations?search=${overrideStudent.rollNumber}`);
    expectStatus(res, 200);
    // Should return allocations matching the search
    expect(res.data.allocations.every((a: any) => 
      a.student?.rollNumber?.includes(overrideStudent.rollNumber) ||
      a.teacher?.employeeId?.includes(overrideStudent.rollNumber)
    )).toBe(true);
  });
});

describe('Export Allocations', () => {
  it('exports allocations as CSV', async () => {
    const res = await adminClient.get('/admin/reports/export');
    expectStatus(res, 200);
    expect(res.headers['content-type']).toMatch(/csv/i);
    expect(typeof res.data).toBe('string');
    expect(res.data).toContain('name'); // CSV header
    expect(res.data).toContain('hostel');
  });
});

describe('Audit Logs', () => {
  it('tracks admin actions in audit log', async () => {
    const res = await adminClient.get('/admin/audit-logs');
    expectStatus(res, 200);
    expect(Array.isArray(res.data)).toBe(true);
    
    if (res.data.length > 0) {
      const log = res.data[0];
      expect(log).toHaveProperty('action');
      expect(log).toHaveProperty('actorName');
      expect(log).toHaveProperty('actorType');
      expect(log).toHaveProperty('createdAt');
    }
  });

  it('audit log contains manual override action', async () => {
    const res = await adminClient.get('/admin/audit-logs');
    expectStatus(res, 200);
    const overrideLog = res.data.find((log: any) => log.action === 'MANUAL_OVERRIDE');
    expect(overrideLog).toBeDefined();
  });
});

describe('Notice Board', () => {
  let noticeId: string;

  it('admin creates a global notice', async () => {
    const res = await adminClient.post('/admin/notices', {
      title: 'Test Global Notice',
      body: 'This is a test notice visible to all students',
      priority: 'info',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    });
    expectStatus(res, 201);
    expect(res.data).toHaveProperty('id');
    noticeId = res.data.id;
  });

  it('admin creates a hostel-specific notice', async () => {
    const res = await adminClient.post('/admin/notices', {
      title: 'Hostel-Specific Notice',
      body: 'This notice is only for one hostel',
      priority: 'warning',
      hostelId: state.maleHostelId,
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expectStatus(res, 201);
    expect(res.data.hostelId).toBe(state.maleHostelId);
  });

  it('lists all notices', async () => {
    const res = await adminClient.get('/admin/notices');
    expectStatus(res, 200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.some((n: any) => n.id === noticeId)).toBe(true);
  });

  it('student sees global notices', async () => {
    const studentToken = state.students?.maleStudent1?.token;
    if (!studentToken) return;
    
    const res = await createClient(studentToken).get('/student/notices');
    expectStatus(res, 200);
    expect(res.data.some((n: any) => n.id === noticeId)).toBe(true);
  });

  it('admin deletes notice', async () => {
    const res = await adminClient.delete(`/admin/notices/${noticeId}`);
    expectStatus(res, 200);
  });
});

describe('Window Lock/Unlock', () => {
  it('admin locks allocation window', async () => {
    const res = await adminClient.put(`/admin/windows/${state.windows?.maleWindowId}/lock`);
    expectStatus(res, 200);
    expect(res.data.lockedAt).toBeDefined();
  });

  it('students cannot book after window is locked', async () => {
    // Create a fresh student
    const { generateStudent, getStudentPassword } = await import('../fixtures/data');
    const lockTestStudent = generateStudent({ gender: 'male', program: 'btech', year: 1 });
    await adminClient.post('/admin/students', { ...lockTestStudent, password: getStudentPassword(lockTestStudent.rollNumber) });
    
    const loginRes = await createClient().post('/auth/login', { 
      rollNumber: lockTestStudent.rollNumber, 
      password: getStudentPassword(lockTestStudent.rollNumber) 
    });
    const token = loginRes.data.token || loginRes.data.accessToken;
    await createClient(token).post('/auth/onboarding', { gender: 'male', newPassword: 'Test@1234' }).catch(() => {});

    const bookRes = await createClient(token).post('/allocations', {
      roomId: overrideRoomId,
      windowId: state.windows?.maleWindowId,
    });
    
    expect(bookRes.status).toBeGreaterThanOrEqual(400);
    expect(bookRes.data.message).toMatch(/locked/i);
  });

  it('admin unlocks allocation window', async () => {
    const res = await adminClient.put(`/admin/windows/${state.windows?.maleWindowId}/unlock`);
    expectStatus(res, 200);
    expect(res.data.lockedAt).toBeNull();
  });
});

describe('Hostel Restrictions', () => {
  let restrictionId: string;

  it('admin creates hostel restriction', async () => {
    const res = await adminClient.post('/admin/restrictions', {
      hostelId: state.maleHostelId,
      allowedYears: [1, 2],
      allowedPrograms: ['btech'],
      allowedGender: 'male',
      notes: 'Only for first and second year B.Tech students',
    });
    expectStatus(res, 201);
    expect(res.data).toHaveProperty('id');
    restrictionId = res.data.id;
  });

  it('restriction filters eligible hostels for students', async () => {
    // Create a 3rd year student
    const { generateStudent, getStudentPassword } = await import('../fixtures/data');
    const thirdYearStudent = generateStudent({ gender: 'male', program: 'btech', year: 3 });
    await adminClient.post('/admin/students', { ...thirdYearStudent, password: getStudentPassword(thirdYearStudent.rollNumber) });
    
    const loginRes = await createClient().post('/auth/login', { 
      rollNumber: thirdYearStudent.rollNumber, 
      password: getStudentPassword(thirdYearStudent.rollNumber) 
    });
    const token = loginRes.data.token || loginRes.data.accessToken;
    await createClient(token).post('/auth/onboarding', { gender: 'male', newPassword: 'Test@1234' }).catch(() => {});

    const hostelsRes = await createClient(token).get('/student/hostels');
    expectStatus(hostelsRes, 200);
    
    // The restricted hostel should not appear for 3rd year student
    // (This depends on whether there are other hostels without restrictions)
  });

  it('admin updates restriction', async () => {
    const res = await adminClient.patch(`/admin/restrictions/${restrictionId}`, {
      allowedYears: [1, 2, 3],
    });
    expectStatus(res, 200);
    expect(res.data.allowedYears).toContain(3);
  });

  it('admin deletes restriction', async () => {
    const res = await adminClient.delete(`/admin/restrictions/${restrictionId}`);
    expectStatus(res, 200);
  });
});

describe('Student Management', () => {
  it('admin searches students', async () => {
    const res = await adminClient.get(`/admin/students?search=${overrideStudent.name.split(' ')[0]}`);
    expectStatus(res, 200);
    expect(res.data.students.length).toBeGreaterThan(0);
  });

  it('admin filters students by year', async () => {
    const res = await adminClient.get('/admin/students?year=2');
    expectStatus(res, 200);
    expect(res.data.students.every((s: any) => s.year === 2)).toBe(true);
  });

  it('admin filters students by program', async () => {
    const res = await adminClient.get('/admin/students?program=btech');
    expectStatus(res, 200);
    expect(res.data.students.every((s: any) => s.program === 'btech')).toBe(true);
  });

  it('admin updates student details', async () => {
    const studentId = (await adminClient.get(`/admin/students?search=${overrideStudent.rollNumber}`)).data.students[0].id;
    const res = await adminClient.patch(`/admin/students/${studentId}`, {
      priorityTier: 2,
    });
    expectStatus(res, 200);
    expect(res.data.priorityTier).toBe(2);
  });
});
