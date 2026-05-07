import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../../lib/prisma';
import { bookRoom } from './allocation.service';
import bcrypt from 'bcryptjs';

describe('Allocation Service Race Condition Tests', () => {
  let windowId: string;
  let roomId: string;
  let hostelId: string;
  let studentIds: string[] = [];

  beforeAll(async () => {
    // 1. Create a hostel
    const hostel = await prisma.hostel.create({
      data: {
        name: 'Test Hostel Concurrent',
        gender: 'male',
        totalRooms: 1,
        address: 'Test Address'
      }
    });
    hostelId = hostel.id;

    // 2. Create an allocation window (opens in past, closes in future)
    const window = await prisma.allocationWindow.create({
      data: {
        name: 'Test Window Concurrent',
        gender: 'male',
        opensAt: new Date(Date.now() - 3600 * 1000), // 1 hour ago
        closesAt: new Date(Date.now() + 3600 * 1000), // 1 hour later
        isActive: true,
        allowedPrograms: [],
        allowedYears: [1, 2, 3, 4]
      }
    });
    windowId = window.id;

    // 3. Create restrictions
    await prisma.hostelRestriction.create({
      data: {
        hostelId,
        allowedYears: [1, 2, 3, 4],
        allowedGender: 'male',
        allowedPrograms: []
      }
    });

    // 4. Create a single room with capacity 1
    const room = await prisma.room.create({
      data: {
        hostelId,
        roomNumber: 'T1-100',
        capacity: 1
      }
    });
    roomId = room.id;

    // 5. Create 10 concurrent students
    const passwordHash = await bcrypt.hash('testpass', 10);
    for (let i = 0; i < 10; i++) {
      const p = await prisma.student.create({
        data: {
          rollNumber: `CTEST${i}`,
          name: `Concurrent Test Student ${i}`,
          email: `ctest${i}@example.com`,
          gender: 'male',
          year: 2,
          branch: 'CSE',
          program: 'btech',
          onboardingDone: true,
          mustChangePassword: false,
          passwordHash,
          priorityTier: 0,
        }
      });
      studentIds.push(p.id);
    }
  });

  afterAll(async () => {
    // Clean up created records
    await prisma.roomAssignment.deleteMany({
      where: { roomId }
    });
    await prisma.room.delete({ where: { id: roomId } });
    await prisma.student.deleteMany({
      where: { id: { in: studentIds } }
    });
    await prisma.hostelRestriction.deleteMany({
      where: { hostelId }
    });
    await prisma.hostel.delete({ where: { id: hostelId } });
    await prisma.allocationWindow.delete({ where: { id: windowId } });
  });

  it('should only allow 1 booking when 10 requests arrive simultaneously', async () => {
    // Create an array of pending promises
    const bookingPromises = studentIds.map(studentId => 
      bookRoom(studentId, roomId, windowId)
    );

    // Run them all at the exact same time
    const results = await Promise.allSettled(bookingPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');
    if (rejected.length > 0) {
      console.log('Sample rejection:', (rejected[0] as PromiseRejectedResult).reason.message);
    }

    // Exactly 1 should have succeeded since room capacity is 1
    expect(successful.length).toBe(1);
    
    // 9 should have failed
    expect(rejected.length).toBe(9);

    // Let's also check the actual db count just to be absolutely sure
    const count = await prisma.roomAssignment.count({
      where: { roomId, status: 'confirmed' }
    });
    expect(count).toBe(1);
  });
});
