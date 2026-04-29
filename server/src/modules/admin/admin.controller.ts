import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import { parse } from 'csv-parse';
import fs from 'fs';
import { Parser } from 'json2csv';
import { z } from 'zod';
import { handleError } from '../../middleware/errorHandler.middleware';

// ─── helpers ─────────────────────────────────────────────────────────────────
const s = (v: unknown): string => String(v ?? '');
const n = (v: unknown): number => Number(v);

type Actor = { id: string; name: string };

const audit = (actor: Actor, action: string, entityType: string, entityId: string, metadata?: object) =>
  prisma.auditLog.create({
    data: { actorId: actor.id, actorName: actor.name, actorType: 'admin', action, entityType, entityId, metadata: metadata as object }
  }).catch(() => {});

const actor = (req: Request): Actor => ({ id: s((req as any).user?.id), name: s((req as any).user?.name) });

// ─── Admin setup ──────────────────────────────────────────────────────────────
export const setupInitialAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string };
    const count = await prisma.admin.count();
    if (count > 0) return res.status(400).json({ message: 'Admin already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.create({ data: { name, email, passwordHash, role: 'superadmin' } });
    res.status(201).json({ id: admin.id, name: admin.name, email: admin.email });
  } catch (error: any) { handleError(error, req, res); }
};

// ─── Warden management ────────────────────────────────────────────────────────
export const createWarden = async (req: Request, res: Response) => {
  try {
    const { name, email, password, hostelId } = req.body as { name: string; email: string; password: string; hostelId?: string };
    if (!name || !email || !password) return res.status(400).json({ message: 'name, email, and password are required' });
    const passwordHash = await bcrypt.hash(password, 10);
    const warden = await prisma.admin.create({ data: { name, email, passwordHash, role: 'warden', hostelId: hostelId ?? null } });
    audit(actor(req), 'CREATE_WARDEN', 'Admin', warden.id);
    res.status(201).json({ id: warden.id, name: warden.name, email: warden.email, role: warden.role });
  } catch (error: any) { handleError(error, req, res); }
};

export const getWardens = async (req: Request, res: Response) => {
  const wardens = await prisma.admin.findMany({ where: { role: 'warden' }, include: { hostel: { select: { id: true, name: true } } } });
  res.json(wardens);
};

export const deleteWarden = async (req: Request, res: Response) => {
  try {
    await prisma.admin.delete({ where: { id: s(req.params.id) } });
    res.json({ message: 'Warden deleted' });
  } catch (error: any) { handleError(error, req, res); }
};

// ─── Hostel CRUD ──────────────────────────────────────────────────────────────
const hostelSchema = z.object({
  name: z.string().min(1),
  gender: z.enum(['male', 'female', 'mixed']),
  totalRooms: z.number().int().positive(),
  address: z.string().optional(),
});

export const createHostel = async (req: Request, res: Response) => {
  try {
    const body = { ...req.body, totalRooms: n(req.body.totalRooms) };
    const parsed = hostelSchema.safeParse(body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
    const hostel = await prisma.hostel.create({ data: parsed.data });
    audit(actor(req), 'CREATE_HOSTEL', 'Hostel', hostel.id);
    res.status(201).json(hostel);
  } catch (error: any) { handleError(error, req, res); }
};

export const editHostel = async (req: Request, res: Response) => {
  try {
    const { name, gender, totalRooms, address } = req.body as { name?: string; gender?: string; totalRooms?: number; address?: string };
    const hostel = await prisma.hostel.update({ where: { id: s(req.params.id) }, data: { name, address, ...(gender ? { gender } : {}), ...(totalRooms != null ? { totalRooms: n(totalRooms) } : {}) } });
    res.json(hostel);
  } catch (error: any) { handleError(error, req, res); }
};

export const deleteHostel = async (req: Request, res: Response) => {
  try {
    await prisma.hostel.delete({ where: { id: s(req.params.id) } });
    res.json({ message: 'Hostel deleted' });
  } catch (error: any) { handleError(error, req, res); }
};

export const getHostels = async (req: Request, res: Response) => {
  try {
    const hostels = await prisma.hostel.findMany({ include: { _count: { select: { rooms: true } }, restrictions: true } });
    res.json(hostels);
  } catch (error: any) { handleError(error, req, res); }
};

// ─── Room CRUD ────────────────────────────────────────────────────────────────
export const createRooms = async (req: Request, res: Response) => {
  try {
    const { hostelId, rooms } = req.body as { hostelId: string; rooms: any[] };
    const created = await prisma.room.createMany({ data: rooms.map((r: any) => ({ ...r, hostelId })) });
    res.status(201).json(created);
  } catch (error: any) { handleError(error, req, res); }
};

export const batchCreateRooms = async (req: Request, res: Response) => {
  try {
    const { hostelId, prefix, from, to, capacity, allowedGender } = req.body as {
      hostelId: string; prefix?: string; from: string; to: string;
      capacity: string; allowedGender?: string;
    };
    if (!hostelId || !from || !to || !capacity)
      return res.status(400).json({ message: 'hostelId, from, to, capacity are required' });
    const rooms: any[] = [];
    for (let i = n(from); i <= n(to); i++) {
      rooms.push({ hostelId, roomNumber: prefix ? `${prefix}${i}` : String(i), capacity: n(capacity), allowedGender: allowedGender || null });
    }
    const created = await prisma.room.createMany({ data: rooms, skipDuplicates: true });
    audit(actor(req), 'BATCH_CREATE_ROOMS', 'Hostel', hostelId, { count: created.count });
    res.status(201).json({ message: `Created ${created.count} rooms`, count: created.count });
  } catch (error: any) { handleError(error, req, res); }
};

export const updateRoom = async (req: Request, res: Response) => {
  try {
    const { status, allowedGender, capacity } = req.body as { status?: string; allowedGender?: string | null; capacity?: number };
    const room = await prisma.room.update({
      where: { id: s(req.params.id) },
      data: { ...(status ? { status } : {}), ...(allowedGender !== undefined ? { allowedGender } : {}), ...(capacity != null ? { capacity: n(capacity) } : {}) }
    });
    res.json(room);
  } catch (error: any) { handleError(error, req, res); }
};

export const deleteRoom = async (req: Request, res: Response) => {
  try {
    await prisma.room.delete({ where: { id: s(req.params.id) } });
    res.json({ message: 'Room deleted' });
  } catch (error: any) { handleError(error, req, res); }
};

export const deleteHostelRooms = async (req: Request, res: Response) => {
  try {
    const hostelId = s(req.params.hostelId);
    const deleted = await prisma.room.deleteMany({ where: { hostelId } });
    audit(actor(req), 'DELETE_HOSTEL_ROOMS', 'Hostel', hostelId, { count: deleted.count });
    res.json({ message: `Deleted ${deleted.count} rooms` });
  } catch (error: any) { handleError(error, req, res); }
};

export const getHostelRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { hostelId: s(req.params.hostelId) },
      include: { assignments: { where: { status: 'confirmed' }, select: { id: true } } },
      orderBy: [{ roomNumber: 'asc' }]
    });
    res.json(rooms.map(r => ({
      ...r,
      _count: { assignments: r.assignments.length },
      assignments: undefined
    })));
  } catch (error: any) { handleError(error, req, res); }
};

export const bulkUploadRooms = async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const hostelId = s(req.body.hostelId);
  if (!hostelId) return res.status(400).json({ message: 'Hostel ID is required' });
  const rooms: any[] = [];
  const errors: { row: number; error: string }[] = [];
  let rowIndex = 0;
  const filePath = req.file.path;
  fs.createReadStream(filePath)
    .pipe(parse({ columns: true, skip_empty_lines: true }))
    .on('data', (row: any) => {
      rowIndex++;
      if (!row.roomNumber || !row.capacity) {
        errors.push({ row: rowIndex, error: 'Missing required field(s): roomNumber, capacity' }); return;
      }
      rooms.push({ hostelId, roomNumber: s(row.roomNumber), capacity: n(row.capacity), allowedGender: row.allowedGender || null });
    })
    .on('end', async () => {
      try {
        const created = await prisma.room.createMany({ data: rooms, skipDuplicates: true });
        fs.unlinkSync(filePath);
        res.status(201).json({ message: `Uploaded ${created.count} rooms`, count: created.count, errors });
      } catch (e: any) { fs.unlinkSync(filePath); handleError(e, req, res); }
    })
    .on('error', (err: any) => { fs.unlinkSync(filePath); res.status(400).json({ message: 'CSV error', error: err.message }); });
};

// ─── Hostel Restrictions ──────────────────────────────────────────────────────
export const createRestriction = async (req: Request, res: Response) => {
  try {
    const { hostelId, allowedYears, allowedGender, allowedPrograms, priorityOnlyUntil, notes } = req.body as {
      hostelId: string; allowedYears: number[]; allowedGender?: string;
      allowedPrograms?: string[]; priorityOnlyUntil?: string; notes?: string;
    };
    const restriction = await prisma.hostelRestriction.create({
      data: { hostelId, allowedYears, allowedGender: allowedGender ?? null, allowedPrograms: allowedPrograms ?? [], priorityOnlyUntil: priorityOnlyUntil ? new Date(priorityOnlyUntil) : null, notes: notes ?? null }
    });
    res.status(201).json(restriction);
  } catch (error: any) { handleError(error, req, res); }
};

export const updateRestriction = async (req: Request, res: Response) => {
  try {
    const { allowedYears, allowedGender, allowedPrograms, priorityOnlyUntil, notes } = req.body as {
      allowedYears?: number[]; allowedGender?: string;
      allowedPrograms?: string[]; priorityOnlyUntil?: string; notes?: string;
    };
    const restriction = await prisma.hostelRestriction.update({
      where: { id: s(req.params.id) },
      data: { allowedYears, allowedGender: allowedGender ?? null, allowedPrograms, priorityOnlyUntil: priorityOnlyUntil ? new Date(priorityOnlyUntil) : null, notes: notes ?? null }
    });
    res.json(restriction);
  } catch (error: any) { handleError(error, req, res); }
};

export const deleteRestriction = async (req: Request, res: Response) => {
  try {
    await prisma.hostelRestriction.delete({ where: { id: s(req.params.id) } });
    res.json({ message: 'Restriction deleted' });
  } catch (error: any) { handleError(error, req, res); }
};

// ─── Allocation Windows ────────────────────────────────────────────────────────
export const createAllocationWindow = async (req: Request, res: Response) => {
  try {
    const { name, gender, hostelId, opensAt, closesAt, allowedPrograms = [], allowedYears = [] } = req.body as {
      name: string; gender: string; hostelId?: string;
      opensAt: string; closesAt: string;
      allowedPrograms?: string[]; allowedYears?: number[];
    };
    if (!name || !gender || !opensAt || !closesAt) return res.status(400).json({ message: 'name, gender, opensAt, closesAt are required' });
    if (!['male', 'female', 'mixed'].includes(gender)) return res.status(400).json({ message: 'gender must be male, female, or mixed' });
    if (new Date(opensAt) >= new Date(closesAt)) return res.status(400).json({ message: 'opensAt must be before closesAt' });
    const win = await prisma.allocationWindow.create({
      data: { name, gender, hostelId: hostelId || null, opensAt: new Date(opensAt), closesAt: new Date(closesAt), allowedPrograms, allowedYears, isActive: false }
    });
    res.status(201).json(win);
  } catch (error: any) { handleError(error, req, res); }
};

export const getAllWindows = async (req: Request, res: Response) => {
  try {
    const windows = await prisma.allocationWindow.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { assignments: true } }, hostel: { select: { id: true, name: true } } }
    });
    res.json(windows);
  } catch (error: any) { handleError(error, req, res); }
};

export const activateWindow = async (req: Request, res: Response) => {
  try {
    const { isActive } = req.body as { isActive: boolean };
    const win = await prisma.allocationWindow.update({ where: { id: s(req.params.id) }, data: { isActive } });
    audit(actor(req), isActive ? 'ACTIVATE_WINDOW' : 'DEACTIVATE_WINDOW', 'AllocationWindow', s(req.params.id));
    res.json(win);
  } catch (error: any) { handleError(error, req, res); }
};

export const lockWindow = async (req: Request, res: Response) => {
  try {
    const win = await prisma.allocationWindow.update({ where: { id: s(req.params.id) }, data: { lockedAt: new Date() } });
    audit(actor(req), 'LOCK_WINDOW', 'AllocationWindow', s(req.params.id));
    res.json({ ...win, message: 'Allocation window locked.' });
  } catch (error: any) { handleError(error, req, res); }
};

export const unlockWindow = async (req: Request, res: Response) => {
  try {
    const win = await prisma.allocationWindow.update({ where: { id: s(req.params.id) }, data: { lockedAt: null } });
    audit(actor(req), 'UNLOCK_WINDOW', 'AllocationWindow', s(req.params.id));
    res.json({ ...win, message: 'Allocation window unlocked.' });
  } catch (error: any) { handleError(error, req, res); }
};

export const deleteWindow = async (req: Request, res: Response) => {
  try {
    await prisma.allocationWindow.delete({ where: { id: s(req.params.id) } });
    audit(actor(req), 'DELETE_WINDOW', 'AllocationWindow', s(req.params.id));
    res.json({ message: 'Allocation window deleted.' });
  } catch (error: any) { handleError(error, req, res); }
};

// ─── Student CRUD ──────────────────────────────────────────────────────────────
export const getStudents = async (req: Request, res: Response) => {
  try {
    const search  = s(req.query.search  || '');
    const year    = s(req.query.year    || '');
    const branch  = s(req.query.branch  || '');
    const program = s(req.query.program || '');
    const page    = Math.max(1, n(req.query.page  || 1));
    const limit   = Math.max(1, n(req.query.limit || 50));

    const where: any = {};
    if (search)  where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { rollNumber: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }];
    if (year)    where.year = n(year);
    if (branch)  where.branch = branch;
    if (program) where.program = program;

    const [students, total] = await Promise.all([
      prisma.student.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { rollNumber: 'asc' }, include: { assignment: { include: { room: { include: { hostel: { select: { name: true } } } } } } } }),
      prisma.student.count({ where })
    ]);
    res.json({ 
      students: students.map(s => {
        const assignment = s.assignment?.status === 'confirmed' ? s.assignment : null;
        return { ...s, assignment };
      }), 
      total, 
      page, 
      limit 
    });
  } catch (error: any) { handleError(error, req, res); }
};

export const createStudent = async (req: Request, res: Response) => {
  try {
    const { rollNumber, name, email, year, branch, program = 'btech', gender, phone, priorityTier = 0 } = req.body as {
      rollNumber: string; name: string; email: string; year: number; branch: string;
      program?: string; gender?: string; phone?: string; priorityTier?: number;
    };
    if (!rollNumber || !name || !email || !year || !branch)
      return res.status(400).json({ message: 'rollNumber, name, email, year, and branch are required' });
    const passwordHash = await bcrypt.hash(`${rollNumber}@iiituna`, 10);
    const student = await prisma.student.create({ data: { rollNumber, name, email, year: n(year), branch, program, gender: gender ?? null, phone: phone ?? null, priorityTier: n(priorityTier), passwordHash, mustChangePassword: true, onboardingDone: false } });
    audit(actor(req), 'CREATE_STUDENT', 'Student', student.id, { rollNumber });
    res.status(201).json({ id: student.id, rollNumber: student.rollNumber, name: student.name, email: student.email });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ message: 'A student with this roll number or email already exists' });
    handleError(error, req, res);
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { name, email, year, branch, program, phone, priorityTier } = req.body as {
      name?: string; email?: string; year?: number; branch?: string; program?: string; phone?: string; priorityTier?: number;
    };
    const student = await prisma.student.update({ where: { id: s(req.params.id) }, data: { name, email, year: year ? n(year) : undefined, branch, program, phone, priorityTier: priorityTier != null ? n(priorityTier) : undefined } });
    res.json(student);
  } catch (error: any) { handleError(error, req, res); }
};

export const deleteStudent = async (req: Request, res: Response) => {
  try {
    await prisma.student.delete({ where: { id: s(req.params.id) } });
    res.json({ message: 'Student deleted' });
  } catch (error: any) { handleError(error, req, res); }
};

export const bulkImportStudents = async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const students: any[] = [];
  const errors: { row: number; error: string }[] = [];
  let rowIndex = 0;
  const filePath = req.file.path;
  fs.createReadStream(filePath)
    .pipe(parse({ columns: true, skip_empty_lines: true }))
    .on('data', (row: any) => {
      rowIndex++;
      if (!row.rollNumber || !row.name || !row.email || !row.year || !row.branch) {
        errors.push({ row: rowIndex, error: `Row ${rowIndex}: Missing required fields` }); return;
      }
      students.push({ rollNumber: s(row.rollNumber).trim(), name: s(row.name).trim(), email: s(row.email).trim(), year: n(row.year), branch: s(row.branch).trim(), program: s(row.program || 'btech').trim(), gender: row.gender ? s(row.gender).toLowerCase() : null, phone: row.phone ? s(row.phone).trim() : null, priorityTier: n(row.priorityTier || 0), passwordHash: '', mustChangePassword: true, onboardingDone: false });
    })
    .on('end', async () => {
      try {
        const hashed = await Promise.all(students.map(async st => ({ ...st, passwordHash: await bcrypt.hash(`${st.rollNumber}@iiituna`, 10) })));
        let created = 0; let skipped = 0;
        for (const st of hashed) {
          try { await prisma.student.create({ data: st }); created++; }
          catch (e: any) { errors.push({ row: hashed.indexOf(st) + 1, error: `${st.rollNumber}: ${e.code === 'P2002' ? 'Already exists' : e.message}` }); skipped++; }
        }
        fs.unlinkSync(filePath);
        res.status(201).json({ message: `Imported ${created} students, skipped ${skipped}`, created, skipped, errors });
      } catch (e: any) { fs.unlinkSync(filePath); handleError(e, req, res); }
    })
    .on('error', (err: any) => { fs.unlinkSync(filePath); res.status(400).json({ message: 'CSV parse error', error: err.message }); });
};

// ─── Teacher CRUD ─────────────────────────────────────────────────────────────
export const getTeachers = async (req: Request, res: Response) => {
  try {
    const teachers = await prisma.teacher.findMany({ orderBy: { employeeId: 'asc' }, include: { assignment: { include: { room: { include: { hostel: { select: { name: true } } } } } } } });
    res.json(teachers.map(t => {
      const assignment = t.assignment?.status === 'confirmed' ? t.assignment : null;
      return { ...t, assignment };
    }));
  } catch (error: any) { handleError(error, req, res); }
};

export const createTeacher = async (req: Request, res: Response) => {
  try {
    const { employeeId, name, email, gender, department, phone } = req.body as { employeeId: string; name: string; email: string; gender: string; department: string; phone?: string };
    if (!employeeId || !name || !email || !gender || !department) return res.status(400).json({ message: 'employeeId, name, email, gender, department are required' });
    const passwordHash = await bcrypt.hash(`${employeeId}@iiituna`, 10);
    const teacher = await prisma.teacher.create({ data: { employeeId, name, email, gender, department, phone: phone ?? null, passwordHash, mustChangePassword: true } });
    audit(actor(req), 'CREATE_TEACHER', 'Teacher', teacher.id, { employeeId });
    res.status(201).json({ id: teacher.id, employeeId: teacher.employeeId, name: teacher.name, email: teacher.email });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ message: 'Teacher with this employeeId or email already exists' });
    handleError(error, req, res);
  }
};

export const deleteTeacher = async (req: Request, res: Response) => {
  try {
    await prisma.teacher.delete({ where: { id: s(req.params.id) } });
    res.json({ message: 'Teacher deleted' });
  } catch (error: any) { handleError(error, req, res); }
};

// ─── Manual Override ──────────────────────────────────────────────────────────
export const manualOverride = async (req: Request, res: Response) => {
  try {
    const { studentId, teacherId, roomId, windowId, notes, force = false } = req.body as {
      studentId?: string; teacherId?: string; roomId: string; windowId: string; notes?: string; force?: boolean;
    };
    if (!roomId || !windowId || (!studentId && !teacherId)) return res.status(400).json({ message: 'roomId, windowId, and studentId or teacherId are required' });
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { hostel: true } });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.status === 'maintenance') return res.status(400).json({ message: 'Room is under maintenance' });
    const occupiedCount = await prisma.roomAssignment.count({ where: { roomId, status: 'confirmed' } });
    if (!force && occupiedCount >= room.capacity) return res.status(409).json({ message: `Room is at capacity (${room.capacity} seats). Pass force:true to override.`, canForce: true });
    if (studentId) await prisma.roomAssignment.updateMany({ where: { studentId, status: 'confirmed' }, data: { status: 'cancelled' } });
    if (teacherId) await prisma.roomAssignment.updateMany({ where: { teacherId, status: 'confirmed' }, data: { status: 'cancelled' } });
    const assignment = await prisma.roomAssignment.create({
      data: { ...(studentId ? { studentId } : {}), ...(teacherId ? { teacherId } : {}), roomId, windowId, status: 'confirmed', adminOverride: true, bookedAt: new Date(), notes: notes || 'Admin manual override' }
    });
    audit(actor(req), 'MANUAL_OVERRIDE', 'RoomAssignment', assignment.id, { studentId, teacherId, roomId, room: room.roomNumber, hostel: room.hostel.name });
    if (studentId) {
      await prisma.notification.create({ data: { studentId, type: 'booking_confirmed', title: 'Room Assigned by Admin', body: `Admin assigned you to Room ${room.roomNumber} in ${room.hostel.name}.`, metadata: { roomId, assignmentId: assignment.id } } }).catch(() => {});
    }
    res.status(201).json(assignment);
  } catch (error: any) { handleError(error, req, res); }
};

export const unallocateRoom = async (req: Request, res: Response) => {
  try {
    const assignment = await prisma.roomAssignment.findUnique({
      where: { id: s(req.params.id) },
      include: { room: { include: { hostel: true } } }
    });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    
    await prisma.roomAssignment.update({
      where: { id: assignment.id },
      data: { status: 'cancelled' }
    });
    
    audit(actor(req), 'UNALLOCATE_ROOM', 'RoomAssignment', assignment.id, { roomId: assignment.roomId, studentId: assignment.studentId, teacherId: assignment.teacherId });
    
    res.json({ message: 'Allocation cancelled successfully.' });
  } catch (error: any) { handleError(error, req, res); }
};

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [totalStudents, totalRoomsResult, occupiedSeats, totalHostels, totalTeachers] = await Promise.all([
      prisma.student.count(),
      prisma.room.aggregate({ _sum: { capacity: true } }),
      prisma.roomAssignment.count({ where: { status: 'confirmed' } }),
      prisma.hostel.count(),
      prisma.teacher.count(),
    ]);
    res.json({ totalStudents, totalCapacity: totalRoomsResult._sum.capacity ?? 0, occupiedSeats, totalHostels, totalTeachers });
  } catch (error: any) { handleError(error, req, res); }
};

export const getAllocations = async (req: Request, res: Response) => {
  try {
    const page   = Math.max(1, n(req.query.page  || 1));
    const limit  = Math.max(1, n(req.query.limit || 50));
    const search = s(req.query.search || '');
    const where: any = { status: 'confirmed' };
    if (search) where.student = { OR: [{ name: { contains: search, mode: 'insensitive' } }, { rollNumber: { contains: search, mode: 'insensitive' } }] };
    const [allocations, total] = await Promise.all([
      prisma.roomAssignment.findMany({ where, include: { student: { select: { name: true, rollNumber: true, year: true, branch: true, program: true } }, teacher: { select: { name: true, employeeId: true, department: true } }, room: { include: { hostel: { select: { name: true } } } } }, orderBy: { bookedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.roomAssignment.count({ where })
    ]);
    res.json({ allocations, total });
  } catch (error: any) { handleError(error, req, res); }
};

// ─── Occupancy Report ─────────────────────────────────────────────────────────
export const getOccupancyReport = async (req: Request, res: Response) => {
  try {
    const hostels = await prisma.hostel.findMany({
      include: {
        rooms: {
          include: { assignments: { where: { status: 'confirmed' }, select: { id: true } } }
        }
      }
    });
    const report = hostels.map(h => {
      const totalCapacity = h.rooms.reduce((acc, r) => acc + r.capacity, 0);
      const occupied = h.rooms.reduce((acc, r) => acc + r.assignments.length, 0);
      return {
        id: h.id,
        name: h.name,
        gender: h.gender,
        totalCapacity,
        occupied,
        available: totalCapacity - occupied,
        occupancyPct: totalCapacity > 0 ? Math.round((occupied / totalCapacity) * 100) : 0,
        rooms: h.rooms.map(r => ({
          roomNumber: r.roomNumber,
          capacity: r.capacity,
          occupied: r.assignments.length,
          available: r.capacity - r.assignments.length,
          status: r.status,
          allowedGender: r.allowedGender
        }))
      };
    });
    res.json(report);
  } catch (error: any) { handleError(error, req, res); }
};

export const getAuditLogs = async (req: Request, res: Response) => {
  const page = Math.max(1, n(req.query.page || 1));
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50, skip: (page - 1) * 50 });
  res.json(logs);
};

export const exportAllocations = async (req: Request, res: Response) => {
  const allocations = await prisma.roomAssignment.findMany({ where: { status: 'confirmed' }, include: { student: true, teacher: true, room: { include: { hostel: true } } } });
  const rows = allocations.map(a => ({
    name: a.student?.name ?? a.teacher?.name ?? 'N/A', id: a.student?.rollNumber ?? a.teacher?.employeeId ?? 'N/A',
    type: a.student ? 'Student' : 'Teacher', year: a.student?.year ?? '-', branch: a.student?.branch ?? a.teacher?.department ?? '-',
    hostel: a.room.hostel.name, room: a.room.roomNumber, bookedAt: new Date(a.bookedAt).toLocaleString(), adminOverride: a.adminOverride ? 'Yes' : 'No',
  }));
  const fields = ['name', 'id', 'type', 'year', 'branch', 'hostel', 'room', 'bookedAt', 'adminOverride'];
  const parser = new Parser({ fields });
  res.header('Content-Type', 'text/csv').attachment('allocations_report.csv').send(parser.parse(rows));
};

// ─── Notice management ────────────────────────────────────────────────────────
export const createNotice = async (req: Request, res: Response) => {
  try {
    const { title, body, priority = 'info', hostelId, expiresAt } = req.body as { title: string; body: string; priority?: string; hostelId?: string; expiresAt: string };
    if (!title || !body || !expiresAt) return res.status(400).json({ message: 'title, body, expiresAt are required' });
    const notice = await prisma.notice.create({ data: { title, body, priority, hostelId: hostelId ?? null, expiresAt: new Date(expiresAt) } });
    res.status(201).json(notice);
  } catch (error: any) { handleError(error, req, res); }
};

export const getNotices = async (req: Request, res: Response) => {
  try {
    const notices = await prisma.notice.findMany({ orderBy: { createdAt: 'desc' }, include: { hostel: { select: { name: true } } } });
    res.json(notices);
  } catch (error: any) { handleError(error, req, res); }
};

export const deleteNotice = async (req: Request, res: Response) => {
  try {
    await prisma.notice.delete({ where: { id: s(req.params.id) } });
    res.json({ message: 'Notice deleted' });
  } catch (error: any) { handleError(error, req, res); }
};
