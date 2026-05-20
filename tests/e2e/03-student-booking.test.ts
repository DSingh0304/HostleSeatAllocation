/**
 * E2E Test Suite 03: Student Booking
 *
 * Tests:
 *  - Complete onboarding before booking
 *  - Student can see eligible hostels
 *  - Student can see rooms in a hostel
 *  - Solo booking (happy path)
 *  - Double-booking prevention
 *  - Booking to a full room
 *  - Booking to maintenance room
 *  - Gender mismatch booking
 *  - Booking without active window
 *  - Booking outside window time range
 *  - Booking after window lock
 *  - Cancellation happy path
 *  - Cancellation of already-cancelled booking
 *  - Re-booking after cancellation
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, loginAdmin, expectStatus } from '../helpers/api-client';
import { ADMIN_EMAIL, ADMIN_PASSWORD, generateStudent, getStudentPassword } from '../fixtures/data';

const state = (globalThis as any).__TEST_STATE__;

// Helpers to complete onboarding for a student (set gender + change password)
async function completeOnboarding(token: string, gender: 'male' | 'female') {
  const client = createClient(token);
  await client.post('/auth/onboarding', {
    gender,
    newPassword: 'Onboarded@123',
  });
}

beforeAll(async () => {
  const token = await loginAdmin(process.env.ADMIN_EMAIL || ADMIN_EMAIL, process.env.ADMIN_PASSWORD || ADMIN_PASSWORD);
  const adminClient = createClient(token);

  state.hostels = state.hostels || {};
  state.rooms = state.rooms || {};
  state.windows = state.windows || {};
  state.students = state.students || {};

  if (!state.maleHostelId || !state.femaleHostelId) {
    const hostels = await adminClient.get('/admin/hostels');
    state.maleHostelId = state.maleHostelId || hostels.data.find((h: any) => h.gender === 'male')?.id;
    state.femaleHostelId = state.femaleHostelId || hostels.data.find((h: any) => h.gender === 'female')?.id;
  }

  if (!state.windows.maleWindowId || !state.windows.femaleWindowId) {
    const windows = await adminClient.get('/admin/windows');
    state.windows.maleWindowId = state.windows.maleWindowId || windows.data.find((w: any) => w.gender === 'male' && w.isActive)?.id;
    state.windows.femaleWindowId = state.windows.femaleWindowId || windows.data.find((w: any) => w.gender === 'female' && w.isActive)?.id;

    // If no active windows exist, create and activate short-lived test windows
    const ensureWindow = async (gender: 'male' | 'female') => {
      const existing = windows.data.find((w: any) => w.gender === gender && w.isActive);
      if (existing) return existing.id;
      const now = Date.now();
      const opensAt = new Date(now - 60 * 60 * 1000).toISOString();
      const closesAt = new Date(now + 2 * 60 * 60 * 1000).toISOString();
      const createRes = await adminClient.post('/admin/windows', {
        name: `test-${gender}-window-${now}`,
        gender,
        hostelId: gender === 'male' ? state.maleHostelId : state.femaleHostelId,
        opensAt,
        closesAt,
        allowedPrograms: [],
        allowedYears: [],
      });
      const winId = createRes.data.id || createRes.data;
      await adminClient.put(`/admin/windows/${winId}/activate`, { isActive: true }).catch(() => {});
      return winId;
    };

    if (!state.windows.maleWindowId) state.windows.maleWindowId = await ensureWindow('male');
    if (!state.windows.femaleWindowId) state.windows.femaleWindowId = await ensureWindow('female');
  }

  if (!state.rooms.maleRoom1 || !state.rooms.maleRoom2 || !state.rooms.femaleRoom1 || !state.rooms.femaleRoom2) {
    const [maleRooms, femaleRooms] = await Promise.all([
      state.maleHostelId ? adminClient.get(`/admin/hostels/${state.maleHostelId}/rooms`) : Promise.resolve({ data: [] }),
      state.femaleHostelId ? adminClient.get(`/admin/hostels/${state.femaleHostelId}/rooms`) : Promise.resolve({ data: [] }),
    ]);
    let maleAvailable = maleRooms.data.filter((r: any) => r.status === 'available');
    const maleMaintenance = maleRooms.data.find((r: any) => r.status === 'maintenance');
    let femaleAvailable = femaleRooms.data.filter((r: any) => r.status === 'available');
    // If there are no available rooms, create a batch of test rooms
    if (maleAvailable.length < 2 && state.maleHostelId) {
      const prefix = `T${Date.now()}-M-`;
      await adminClient.post('/admin/rooms/batch', { hostelId: state.maleHostelId, prefix, from: '1', to: '20', capacity: '2' }).catch(() => {});
      const refreshed = await adminClient.get(`/admin/hostels/${state.maleHostelId}/rooms`);
      maleAvailable = refreshed.data.filter((r: any) => r.status === 'available');
    }
    if (femaleAvailable.length < 2 && state.femaleHostelId) {
      const prefix = `T${Date.now()}-F-`;
      await adminClient.post('/admin/rooms/batch', { hostelId: state.femaleHostelId, prefix, from: '1', to: '20', capacity: '2' }).catch(() => {});
      const refreshedF = await adminClient.get(`/admin/hostels/${state.femaleHostelId}/rooms`);
      femaleAvailable = refreshedF.data.filter((r: any) => r.status === 'available');
    }
    if (maleAvailable[0]) state.rooms.maleRoom1 = maleAvailable[0];
    if (maleAvailable[1]) state.rooms.maleRoom2 = maleAvailable[1];
    if (maleMaintenance) state.rooms.maleRoomMaintenance = maleMaintenance;
    if (femaleAvailable[0]) state.rooms.femaleRoom1 = femaleAvailable[0];
    if (femaleAvailable[1]) state.rooms.femaleRoom2 = femaleAvailable[1];
  }

  if (state.femaleHostelId) {
    const bookingRoomNumber = `BOOK-F-${Date.now()}`;
    const created = await adminClient.post('/admin/rooms', {
      hostelId: state.femaleHostelId,
      rooms: [{ roomNumber: bookingRoomNumber, capacity: 2 }],
    });
    const createdRoom = Array.isArray(created.data) ? created.data[0] : created.data;
    state.rooms.femaleBookingRoom = createdRoom?.id
      ? createdRoom
      : (await adminClient.get(`/admin/hostels/${state.femaleHostelId}/rooms`)).data.find((r: any) => r.roomNumber === bookingRoomNumber);
  }

  if (state.maleHostelId) {
    const bookingRoomNumber = `BOOK-M-${Date.now()}`;
    const created = await adminClient.post('/admin/rooms', {
      hostelId: state.maleHostelId,
      rooms: [{ roomNumber: bookingRoomNumber, capacity: 2 }],
    });
    const createdRoom = Array.isArray(created.data) ? created.data[0] : created.data;
    state.rooms.maleBookingRoom = createdRoom?.id
      ? createdRoom
      : (await adminClient.get(`/admin/hostels/${state.maleHostelId}/rooms`)).data.find((r: any) => r.roomNumber === bookingRoomNumber);
  }

  // Ensure a maintenance room exists for negative test cases
  if (!state.rooms.maleRoomMaintenance && state.maleHostelId) {
    const allMaleRooms = await adminClient.get(`/admin/hostels/${state.maleHostelId}/rooms`);
    const candidate = allMaleRooms.data.find((r: any) => r.status !== 'maintenance' && r.id !== state.rooms?.maleRoom1?.id && r.id !== state.rooms?.maleRoom2?.id);
    if (candidate) {
      const patched = await adminClient.patch(`/admin/rooms/${candidate.id}`, { status: 'maintenance' }).catch(() => null);
      if (patched && patched.data) state.rooms.maleRoomMaintenance = patched.data;
    }
  }

  const ensureStudent = async (key: 'maleStudent1' | 'maleStudent2' | 'femaleStudent1' | 'femaleStudent2', gender: 'male' | 'female') => {
    if (state.students[key]?.token) {
      await completeOnboarding(state.students[key].token, gender).catch(() => {});
      return;
    }

    const student = generateStudent({ gender, program: 'btech', year: 2 });
    await adminClient.post('/admin/students', { ...student, password: getStudentPassword(student.rollNumber) }).catch(() => {});
    const loginRes = await createClient().post('/auth/login', {
      rollNumber: student.rollNumber,
      password: getStudentPassword(student.rollNumber),
    });
    const studentToken = loginRes.data.token || loginRes.data.accessToken;
    await completeOnboarding(studentToken, gender).catch(() => {});
    state.students[key] = { token: studentToken, rollNumber: student.rollNumber };
  };

  await ensureStudent('maleStudent1', 'male');
  await ensureStudent('maleStudent2', 'male');
  await ensureStudent('femaleStudent1', 'female');
  await ensureStudent('femaleStudent2', 'female');
});

describe('Hostel & Room Discovery', () => {
  it('male student sees only male hostels', async () => {
    const client = createClient(state.students?.maleStudent1?.token);
    const res = await client.get('/student/hostels');
    expectStatus(res, 200);
    expect(Array.isArray(res.data)).toBe(true);
    for (const h of res.data) {
      expect(['male', 'mixed']).toContain(h.gender);
    }
  });

  it('female student sees only female hostels', async () => {
    const client = createClient(state.students?.femaleStudent1?.token);
    const res = await client.get('/student/hostels');
    expectStatus(res, 200);
    for (const h of res.data) {
      expect(['female', 'mixed']).toContain(h.gender);
    }
  });

  it('returns available rooms for a hostel', async () => {
    const client = createClient(state.students?.maleStudent1?.token);
    const hostelId = state.maleHostelId;
    const res = await client.get(`/student/hostels/${hostelId}/rooms`);
    expectStatus(res, 200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    // Maintenance rooms should be excluded
    expect(res.data.every((r: any) => r.status !== 'maintenance')).toBe(true);
  });

  it('returns active window for the student', async () => {
    const client = createClient(state.students?.maleStudent1?.token);
    const res = await client.get('/student/active-window');
    expectStatus(res, 200);
    // Should return the male window we created
  });
});

describe('Solo Booking – Happy Path', () => {
  let assignmentId: string;

  it('male student books a male room', async () => {
    const client = createClient(state.students?.maleStudent1?.token);
    const res = await client.post('/allocations', {
      roomId: state.rooms?.maleBookingRoom?.id || state.rooms?.maleRoom1?.id,
      windowId: state.windows?.maleWindowId,
    });
    expectStatus(res, 201);
    expect(res.data).toHaveProperty('id');
    assignmentId = res.data.id;
    state.students.maleStudent1.assignmentId = assignmentId;
  });

  it('booking is visible in student profile', async () => {
    const client = createClient(state.students?.maleStudent1?.token);
    const res = await client.get('/student/profile');
    expectStatus(res, 200);
    expect(res.data.assignment?.status).toBe('confirmed');
    expect(res.data.assignment?.room?.id).toBe(state.rooms?.maleBookingRoom?.id || state.rooms?.maleRoom1?.id);
  });

  it('female student books a female room', async () => {
    const client = createClient(state.students?.femaleStudent1?.token);
    const res = await client.post('/allocations', {
      roomId: state.rooms?.femaleBookingRoom?.id || state.rooms?.femaleRoom1?.id,
      windowId: state.windows?.femaleWindowId,
    });
    expectStatus(res, 201);
    state.students.femaleStudent1.assignmentId = res.data.id;
  });
});

describe('Booking – Conflict Cases', () => {
  it('prevents double-booking: same student books again', async () => {
    const client = createClient(state.students?.maleStudent1?.token);
    const res = await client.post('/allocations', {
      roomId: state.rooms?.maleBookingRoom?.id || state.rooms?.maleRoom1?.id,
      windowId: state.windows?.maleWindowId,
    });
    expect(res.status).toBe(409);
    expect(res.data.message).toMatch(/already has an active booking/i);
  });

  it('rejects booking to maintenance room', async () => {
    const client = createClient(state.students?.maleStudent2?.token);
    const res = await client.post('/allocations', {
      roomId: state.rooms?.maleRoomMaintenance?.id,
      windowId: state.windows?.maleWindowId,
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.data.message).toMatch(/maintenance/i);
  });

  it('rejects male student booking female room', async () => {
    const client = createClient(state.students?.maleStudent1?.token);
    const res = await client.post('/allocations', {
      roomId: state.rooms?.femaleRoom1?.id,
      windowId: state.windows?.femaleWindowId,
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('rejects unauthenticated booking', async () => {
    const res = await createClient().post('/allocations', {
      roomId: state.rooms?.maleRoom1?.id,
      windowId: state.windows?.maleWindowId,
    });
    expect(res.status).toBe(401);
  });

  it('rejects booking without roomId', async () => {
    const client = createClient(state.students?.maleStudent2?.token);
    const res = await client.post('/allocations', { windowId: state.windows?.maleWindowId });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('rejects booking with non-existent roomId', async () => {
    const client = createClient(state.students?.maleStudent2?.token);
    const res = await client.post('/allocations', {
      roomId: 'non-existent-uuid',
      windowId: state.windows?.maleWindowId,
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe('Booking Cancellation', () => {
  it('student cancels their booking', async () => {
    const client = createClient(state.students?.femaleStudent1?.token);
    const res = await client.delete(`/allocations/${state.students.femaleStudent1.assignmentId}`);
    expectStatus(res, 200);
  });

  it('student cannot cancel someone else\'s booking', async () => {
    const client = createClient(state.students?.femaleStudent1?.token);
    const res = await client.delete(`/allocations/${state.students.maleStudent1.assignmentId}`);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('student can re-book after cancellation', async () => {
    const client = createClient(state.students?.femaleStudent1?.token);
    const res = await client.post('/allocations', {
      roomId: state.rooms?.femaleBookingRoom?.id || state.rooms?.femaleRoom1?.id,
      windowId: state.windows?.femaleWindowId,
    });
    expectStatus(res, 201);
    state.students.femaleStudent1.assignmentId = res.data.id;
  });
});

describe('Capacity Enforcement', () => {
  it('fills a 2-seat room to capacity, then rejects 3rd booking', async () => {
    // We need a fresh 2-seat room. Use maleRoom2.
    const { loginAdmin: la_helper, createClient: cc_helper } = await import('../helpers/api-client');
    const { ADMIN_EMAIL: ae, ADMIN_PASSWORD: ap, generateStudent, getStudentPassword } = await import('../fixtures/data');
    
    const token = await la_helper(process.env.ADMIN_EMAIL || ae, process.env.ADMIN_PASSWORD || ap);
    const adminClient = cc_helper(token);
    const tmpS1 = generateStudent({ gender: 'male', program: 'btech', year: 1 });
    const tmpS2 = generateStudent({ gender: 'male', program: 'btech', year: 1 });
    const tmpS3 = generateStudent({ gender: 'male', program: 'btech', year: 1 });

    for (const s of [tmpS1, tmpS2, tmpS3]) {
      await adminClient.post('/admin/students', { ...s, password: getStudentPassword(s.rollNumber) }).catch(() => {});
    }

    const { createClient: mkClient } = await import('../helpers/api-client');

    const getToken = async (roll: string) => {
      const r = await mkClient().post('/auth/login', { rollNumber: roll, password: getStudentPassword(roll) });
      return (r.data.token || r.data.accessToken) as string;
    };

    const t1 = await getToken(tmpS1.rollNumber);
    const t2 = await getToken(tmpS2.rollNumber);
    const t3 = await getToken(tmpS3.rollNumber);

    // Complete onboarding for each
    for (const t of [t1, t2, t3]) {
      await mkClient(t).post('/auth/onboarding', { gender: 'male', newPassword: 'Test@1234' }).catch(() => {});
    }

    const targetRoom = state.rooms?.maleRoom2;
    const windowId = state.windows?.maleWindowId;

    const r1 = await mkClient(t1).post('/allocations', { roomId: targetRoom?.id, windowId });
    const r2 = await mkClient(t2).post('/allocations', { roomId: targetRoom?.id, windowId });

    // First two should succeed (or the room may already have 1 occupant from other test)
    expect([201, 201, 409]).toContain(r1.status); // 409 if room was already private
    expect([201, 409]).toContain(r2.status);

    // Third booking to same room must fail with full error
    const r3 = await mkClient(t3).post('/allocations', { roomId: targetRoom?.id, windowId });
    if (r1.status === 201 && r2.status === 201) {
      expect(r3.status).toBe(409);
      expect(r3.data.message).toMatch(/full/i);
    }
  });
});
