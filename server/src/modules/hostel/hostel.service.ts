import prisma from "../../lib/prisma";

export const getAllHostels = async (gender?: string) => {
  return prisma.hostel.findMany({
    where: gender ? { gender } : {},
    include: {
      _count: {
        select: { rooms: true },
      },
    },
  });
};

export const createHostel = async (data: any) => {
  return prisma.hostel.create({ data });
};

export const getEligibleHostels = async (studentId: string) => {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new Error("Student not found");

  // Logic to filter by HostelRestriction
  const restrictions = await prisma.hostelRestriction.findMany({
    where: {
      allowedGender: student.gender,
      allowedYears: { has: student.year },
    },
    include: { hostel: true },
  });

  return restrictions.map((r) => r.hostel);
};
