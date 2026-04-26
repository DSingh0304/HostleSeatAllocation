import prisma from './lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const passwordHash = await bcrypt.hash('Test@123', 10);
  const adminPassword = await bcrypt.hash('password123', 10);

  // 1. Create Super Admin
  await prisma.admin.upsert({
    where: { email: 'admin@iiituna.ac.in' },
    update: {},
    create: {
      name: 'Chief Warden',
      email: 'admin@iiituna.ac.in',
      passwordHash: adminPassword,
      role: 'superadmin'
    }
  });

  // 2. Create Hostels
  const bh1 = await prisma.hostel.create({
    data: {
      name: 'Boys Hostel 1',
      gender: 'male',
      totalRooms: 50,
      address: 'Main Campus, Sector 5'
    }
  });

  const gh1 = await prisma.hostel.create({
    data: {
      name: 'Girls Hostel 1',
      gender: 'female',
      totalRooms: 30,
      address: 'Main Campus, Sector 4'
    }
  });

  // 3. Create Rooms
  const rooms = [];
  for (let i = 1; i <= 20; i++) {
    rooms.push({
      hostelId: bh1.id,
      roomNumber: `B1-${100 + i}`,
      capacity: 3,
    });
  }
  for (let i = 1; i <= 10; i++) {
    rooms.push({
      hostelId: gh1.id,
      roomNumber: `G1-${100 + i}`,
      capacity: 2,
    });
  }

  await prisma.room.createMany({ data: rooms });

  // 4. Create Allocation Window
  const window = await prisma.allocationWindow.create({
    data: {
      name: 'Phase 1 Allocation',
      opensAt: new Date(Date.now() - 1000 * 60 * 60), // Opened 1 hour ago
      closesAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
      gender: 'mixed',
      allowedPrograms: [],
      allowedYears: [1, 2, 3, 4]
    }
  });

  // 5. Create Restrictions
  await prisma.hostelRestriction.create({
    data: {
      hostelId: bh1.id,
      allowedYears: [1, 2, 3, 4],
      allowedGender: 'male',
      allowedPrograms: []
    }
  });

  // 6. Create Test Students
  const students = [
    { rollNumber: 'TEST1001', name: 'Test Student 1', email: 's1@example.com', gender: 'male', year: 2, branch: 'CSE', program: 'btech', onboardingDone: true },
    { rollNumber: 'TEST1002', name: 'Test Student 2', email: 's2@example.com', gender: 'male', year: 2, branch: 'CSE', program: 'btech', onboardingDone: true },
    { rollNumber: 'TEST1003', name: 'Test Student 3', email: 's3@example.com', gender: 'male', year: 2, branch: 'CSE', program: 'btech', onboardingDone: true },
    { rollNumber: 'GIRL1001', name: 'Girl student 1', email: 'g1@example.com', gender: 'female', year: 2, branch: 'ECE', program: 'btech', onboardingDone: true },
  ];

  for (const s of students) {
    await prisma.student.upsert({
      where: { rollNumber: s.rollNumber },
      update: {},
      create: { ...s, passwordHash }
    });
  }

  console.log('Seeding completed!');
  console.log('Admin login: admin@iiituna.ac.in / password123');
  console.log('Student login: TEST1001 / Test@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
