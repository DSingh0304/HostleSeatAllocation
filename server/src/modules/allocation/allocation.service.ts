import prisma from '../../lib/prisma';
import redis from '../../lib/redis';
import logger from '../../lib/logger';
import { emailQueue } from '../../lib/bullmq';

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export const bookRoom = async (studentId: string, roomId: string, windowId: string) => {
  // 1. Verify window is active and NOT locked
  const window = await prisma.allocationWindow.findUnique({ where: { id: windowId } });
  if (!window || !window.isActive) {
    throw new Error('Allocation window is not active');
  }

  const now = new Date();
  if (now < window.opensAt || now > window.closesAt) {
    throw new Error('Allocation window is closed');
  }

  // 1.a Allocation Lock: admin has explicitly locked this window  no self-service changes
  if (window.lockedAt && now > window.lockedAt) {
    throw new Error('This allocation window has been locked. Contact your warden for changes.');
  }

  // 1.5 Priority Window Check
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new Error('Student not found');

  // Must complete onboarding (gender + password set) before booking
  if (!student.onboardingDone) {
    throw new Error('Please complete your profile setup before booking a room');
  }
  if (!student.gender) {
    throw new Error('Gender not set. Please complete your profile first');
  }



  // 2. Verify student hasn't already booked
  const existingAssignment = await prisma.roomAssignment.findUnique({
    where: { studentId },
  });
  if (existingAssignment && existingAssignment.status === 'confirmed') {
    throw new ConflictError('Student already has an active booking');
  }

  // 2.5 Verify room eligibility
  const room = await prisma.room.findUnique({ 
    where: { id: roomId },
    include: { hostel: { include: { restrictions: true } } }
  });
  if (!room) throw new Error('Room not found');
  if (room.status === 'maintenance') throw new Error('This room is under maintenance');

  // Hostel-level gender check
  if (room.hostel.gender !== 'mixed' && room.hostel.gender !== student.gender) {
    throw new Error(`This hostel is for ${room.hostel.gender}s only`);
  }

  // Room-level gender check (overrides hostel for mixed hostels)
  if (room.allowedGender && room.allowedGender !== student.gender) {
    throw new Error(`This room is restricted to ${room.allowedGender}s only`);
  }

  // Program/Year restriction check - only if restrictions exist
  if (room.hostel.restrictions.length > 0) {
    const hasMatchingRestriction = room.hostel.restrictions.some(r => {
      const yearOk = r.allowedYears.length === 0 || r.allowedYears.includes(student.year);
      const programOk = r.allowedPrograms.length === 0 || r.allowedPrograms.includes(student.program);
      const genderOk = !r.allowedGender || r.allowedGender === student.gender;
      return yearOk && programOk && genderOk;
    });

    if (!hasMatchingRestriction) {
      throw new Error('You are not eligible to book a room in this hostel');
    }
  }
  // If no restrictions exist, hostel is open to all (only gender check applies)


  // 3. Acquire Redis distributed lock
  const lockKey = `lock:room:${roomId}`;
  const lockAcquired = await redis.set(lockKey, studentId, 'PX', 5000, 'NX');
  if (!lockAcquired) {
    throw new ConflictError('Room is being processed, please try again in a moment');
  }

  try {
    // 4. PostgreSQL transaction with row lock
    const assignment = await prisma.$transaction(async (tx) => {
      // Lock the room row to prevent concurrent modifications
      await tx.$queryRaw`SELECT id FROM "Room" WHERE id = ${roomId} FOR UPDATE`;
      
      const count = await tx.roomAssignment.count({
        where: { roomId, status: 'confirmed' }
      });

      // Check if room is full
      if (count >= room.capacity) {
        throw new ConflictError('Room is already full');
      }

      // Check if room is locked for a private group
      const now = new Date();
      const isRoomPrivate = !room.isPublic && (!room.privateUntil || room.privateUntil > now);
      
      if (count > 0 && isRoomPrivate) {
        throw new ConflictError('This room is in private group mode. You need an invite from the current occupants.');
      }

      // If this is the first person booking, set room to private for 5 minutes to allow group formation
      if (count === 0) {
        await tx.room.update({
          where: { id: roomId },
          data: { 
            isPublic: false,
            privateUntil: new Date(Date.now() + 5 * 60 * 1000) 
          }
        });
      }

      // Create or update assignment (upsert to handle existing cancelled assignments)
      const newAssignment = await tx.roomAssignment.upsert({
        where: { studentId },
        create: {
          studentId,
          roomId,
          windowId,
          bookedAt: new Date(),
          status: 'confirmed',
        },
        update: {
          roomId,
          windowId,
          bookedAt: new Date(),
          status: 'confirmed',
          notes: 'Re-booked after cancellation',
        },
        include: {
          room: {
            include: {
              hostel: true,
            },
          },
        },
      });

      return newAssignment;
    });

    // 5. Publish update to Redis for WebSockets
    const updatedCount = await prisma.roomAssignment.count({
      where: { roomId, status: 'confirmed' }
    });
    // const room = await prisma.room.findUnique({ where: { id: roomId } });
    
    await redis.publish(`hostel_updates:${assignment.room.hostelId}`, JSON.stringify({
      type: 'ROOM_UPDATE',
      roomId,
      availableSeats: room!.capacity - updatedCount,
    }));

    // 6. Enqueue email notification
    const studentWithEmail = await prisma.student.findUnique({ where: { id: studentId } });
    if (studentWithEmail) {
      await emailQueue.add('booking_confirmation', {
        to: studentWithEmail.email,
        subject: 'Hostel Room Booking Confirmed',
        body: `Congratulations ${studentWithEmail.name}! Your booking for room ${assignment.room.roomNumber} in ${assignment.room.hostel.name} is confirmed.`
      });
    }

    return assignment;
  } finally {
    // Always release the lock
    await redis.del(lockKey);
  }
};

export const cancelBooking = async (studentId: string, assignmentId: string) => {
  const assignment = await prisma.roomAssignment.findUnique({
    where: { id: assignmentId },
    include: { room: { include: { hostel: true } } }
  });

  if (!assignment || assignment.studentId !== studentId) {
    throw new Error('Assignment not found or not owned by student');
  }

  // Enforce window lock  students cannot cancel if admin has locked the window
  const window = await prisma.allocationWindow.findUnique({ where: { id: assignment.windowId } });
  if (window?.lockedAt && new Date() > window.lockedAt) {
    throw new Error('Allocations are locked. Contact your warden to make changes.');
  }

  const updatedAssignment = await prisma.roomAssignment.update({
    where: { id: assignmentId },
    data: { status: 'cancelled' }
  });

  // Publish update
  const updatedCount = await prisma.roomAssignment.count({
    where: { roomId: assignment.roomId, status: 'confirmed' }
  });
  
  await redis.publish(`hostel_updates:${assignment.room.hostelId}`, JSON.stringify({
    type: 'ROOM_UPDATE',
    roomId: assignment.roomId,
    availableSeats: assignment.room.capacity - updatedCount,
  }));

  // Enqueue cancellation email
  const studentWithEmail = await prisma.student.findUnique({ where: { id: studentId } });
  if (studentWithEmail) {
    await emailQueue.add('booking_cancellation', {
      to: studentWithEmail.email,
      subject: 'Hostel Room Booking Cancelled',
      body: `Hello ${studentWithEmail.name}, your booking for room ${assignment.room.roomNumber} in ${assignment.room.hostel.name} has been cancelled.`
    });
  }

  return updatedAssignment;
};
