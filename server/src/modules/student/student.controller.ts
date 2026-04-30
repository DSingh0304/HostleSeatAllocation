import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import prisma from '../../lib/prisma';
import redis from '../../lib/redis';
import { handleError } from '../../middleware/errorHandler.middleware';

const s = (v: unknown): string => String(v ?? '');
const n = (v: unknown): number => Number(v);

//  Profile 
export const getProfile = async (req: AuthRequest, res: Response) => {
  const studentId = req.user!.id;
  const student = await prisma.student.findUnique({ 
    where: { id: studentId }, 
    include: { 
      assignment: { 
        include: { 
          room: { 
            include: { 
              hostel: true,
              assignments: { 
                where: { status: 'confirmed' }, 
                include: { student: { select: { name: true, rollNumber: true, id: true } } } 
              } 
            } 
          } 
        } 
      } 
    } 
  });
  if (!student) return res.status(404).json({ message: 'Student not found' });
  const { passwordHash, ...safe } = student as any;
  res.json(safe);
};

//  Hostels & Rooms ─
export const getEligibleHostels = async (req: AuthRequest, res: Response) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.user!.id } });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const activeWindow = await prisma.allocationWindow.findFirst({ where: { isActive: true } });
    if (!activeWindow) return res.json([]);

    // Window-level eligibility: gender, program, year
    const windowAllowsGender = activeWindow.gender === 'mixed' || activeWindow.gender === student.gender;
    const windowAllowsProgram = activeWindow.allowedPrograms.length === 0 || activeWindow.allowedPrograms.includes(student.program);
    const windowAllowsYear = activeWindow.allowedYears.length === 0 || activeWindow.allowedYears.includes(student.year);
    if (!windowAllowsGender || !windowAllowsProgram || !windowAllowsYear) return res.json([]);

    // Build hostel WHERE  only hostels whose gender matches the student
    const genderCondition = student.gender
      ? { OR: [{ gender: student.gender }, { gender: 'mixed' }] }
      : {};

    // If window is locked to a specific hostel, only check that one
    const hostelWhere: any = activeWindow.hostelId
      ? { id: activeWindow.hostelId, ...genderCondition }
      : genderCondition;

    // Fetch all gender-compatible hostels with their restrictions
    const hostels = await prisma.hostel.findMany({
      where: hostelWhere,
      include: { _count: { select: { rooms: true } }, restrictions: true },
    });

    // Keep hostels that have NO restrictions (open to all) OR at least one restriction that matches
    const eligible = hostels.filter(hostel => {
      if (hostel.restrictions.length === 0) return true; // no rules = open to all
      return hostel.restrictions.some(r => {
        const yearOk    = r.allowedYears.length    === 0 || r.allowedYears.includes(student.year);
        const programOk = r.allowedPrograms.length === 0 || r.allowedPrograms.includes(student.program);
        const genderOk  = !r.allowedGender          || r.allowedGender === student.gender;
        return yearOk && programOk && genderOk;
      });
    });

    // Strip the internal restrictions array before sending to client
    res.json(eligible.map(({ restrictions, ...h }) => h));
  } catch (e: any) { handleError(e, req, res); }
};


export const getHostelRooms = async (req: AuthRequest, res: Response) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.user!.id } });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    const genderFilter = student.gender
      ? { OR: [{ allowedGender: student.gender }, { allowedGender: null as string | null }] } as any
      : {};

    const rooms = await prisma.room.findMany({
      where: { 
        hostelId: s(req.params.id), 
        status: 'available', 
        ...genderFilter,
        OR: [
          { isPublic: true },
          { privateUntil: { gt: new Date() } }, // Still in private window
          { assignments: { none: { status: 'confirmed' } } }
        ]
      },
      include: { 
        assignments: { where: { status: 'confirmed' } },
        _count: { select: { assignments: { where: { status: 'confirmed' } } } }
      },
      orderBy: [{ roomNumber: 'asc' }]
    });
    res.json(rooms);
  } catch (e: any) { handleError(e, req, res); }
};

export const getActiveWindow = async (_req: Request, res: Response) => {
  const now = new Date();
  // Return window only if it's active AND within its open/close time range
  const win = await prisma.allocationWindow.findFirst({
    where: { isActive: true, opensAt: { lte: now }, closesAt: { gte: now } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(win ?? null);
};

//  Notifications 
export const getNotifications = async (req: AuthRequest, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { studentId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  res.json(notifications);
};

export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  const studentId = req.user!.id;
  const notif = await prisma.notification.findFirst({ where: { id: s(req.params.id), studentId } });
  if (!notif) return res.status(404).json({ message: 'Notification not found' });
  await prisma.notification.update({ where: { id: s(req.params.id) }, data: { isRead: true } });
  res.json({ message: 'Marked as read' });
};

export const markAllNotificationsRead = async (req: AuthRequest, res: Response) => {
  await prisma.notification.updateMany({ where: { studentId: req.user!.id, isRead: false }, data: { isRead: true } });
  res.json({ message: 'All notifications marked as read' });
};

//  Notices 
export const getNotices = async (req: AuthRequest, res: Response) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.user!.id }, include: { assignment: { include: { room: true } } } });
    const hostelId = student?.assignment?.room?.hostelId ?? null;
    const notices = await prisma.notice.findMany({
      where: {
        expiresAt: { gt: new Date() },
        OR: hostelId ? [{ hostelId: null }, { hostelId }] : [{ hostelId: null }]
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
    });
    res.json(notices);
  } catch (e: any) { handleError(e, req, res); }
};

//  Room Preferences 
export const getPreferences = async (req: AuthRequest, res: Response) => {
  const preference = await prisma.roomPreference.findUnique({ where: { studentId: req.user!.id } });
  res.json(preference);
};

export const setPreferences = async (req: AuthRequest, res: Response) => {
  const studentId = req.user!.id;
  const { windowId, seaterPref } = req.body as { windowId: string; seaterPref?: number };
  const preference = await prisma.roomPreference.upsert({
    where: { studentId },
    create: { studentId, windowId, seaterPref: seaterPref ? n(seaterPref) : null },
    update: { windowId, seaterPref: seaterPref ? n(seaterPref) : null }
  });
  res.json(preference);
};

//  Roommate Invites 
export const sendInvite = async (req: AuthRequest, res: Response) => {
  try {
    const senderId = req.user!.id;
    const { receiverRollNumber, roomId, windowId } = req.body as { receiverRollNumber: string; roomId: string; windowId: string };
    if (!receiverRollNumber || !roomId || !windowId) return res.status(400).json({ message: 'receiverRollNumber, roomId, and windowId are required' });

    const [sender, receiver] = await Promise.all([
      prisma.student.findUnique({ where: { id: senderId } }),
      prisma.student.findUnique({ where: { rollNumber: receiverRollNumber } }),
    ]);
    if (!receiver) return res.status(404).json({ message: 'No student found with that roll number' });
    if (receiver.id === senderId) return res.status(400).json({ message: 'You cannot invite yourself' });

    // Strict Gender check  can only invite same-gender students
    if (!sender?.gender || !receiver?.gender || sender.gender !== receiver.gender) {
      return res.status(400).json({ message: `Gender mismatch. You (${sender?.gender}) can only invite students of the same gender.` });
    }

    const receiverAssigned = await prisma.roomAssignment.findUnique({ where: { studentId: receiver.id } });
    if (receiverAssigned?.status === 'confirmed') return res.status(409).json({ message: `${receiver.name} is already allocated to a room` });

    const existing = await prisma.roommateInvite.findFirst({ where: { senderId, receiverId: receiver.id, roomId, status: 'pending' } });
    if (existing) return res.status(409).json({ message: 'You already have a pending invite to this student for this room' });

    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { hostel: { select: { name: true } } } });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const currentOccupants = await prisma.roomAssignment.count({ where: { roomId, status: 'confirmed' } });
    const pendingHolds = await redis.get(`invite_hold:${roomId}`).then(v => n(v ?? 0));
    // Find ANY existing assignment for the sender (confirmed, cancelled, etc.)
    const senderAssignment = await prisma.roomAssignment.findUnique({ where: { studentId: senderId } });
    const isSenderAlreadyInRoom = senderAssignment?.roomId === roomId && senderAssignment?.status === 'confirmed';
    
    // Check if adding one more invitee (and potentially the sender) exceeds capacity
    if (currentOccupants + pendingHolds + (isSenderAlreadyInRoom ? 0 : 1) >= room.capacity) {
      return res.status(409).json({ message: 'Room is full or has too many pending invites for its capacity' });
    }

    await redis.incr(`invite_hold:${roomId}`);
    await redis.expire(`invite_hold:${roomId}`, 30 * 60);

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const invite = await prisma.roommateInvite.create({ data: { senderId, receiverId: receiver.id, roomId, windowId, expiresAt } });

    await prisma.notification.create({ data: { studentId: receiver.id, type: 'invite_received', title: 'Roommate Invite Received', body: `${sender!.name} (${sender!.rollNumber}) invited you to share Room ${room.roomNumber} in ${room.hostel.name}. Respond within 30 minutes.`, metadata: { inviteId: invite.id, roomId, senderName: sender!.name } } }).catch(() => {});

    res.status(201).json({ invite, message: `Invite sent to ${receiver.name}. They have 30 minutes to accept.` });
  } catch (e: any) { handleError(e, req, res); }
};

export const getMyInvites = async (req: AuthRequest, res: Response) => {
  const studentId = req.user!.id;
  const [sent, received] = await Promise.all([
    prisma.roommateInvite.findMany({ where: { senderId: studentId }, include: { receiver: { select: { name: true, rollNumber: true } }, sender: { select: { name: true, rollNumber: true } } }, orderBy: { createdAt: 'desc' } }),
    prisma.roommateInvite.findMany({ where: { receiverId: studentId }, include: { sender: { select: { name: true, rollNumber: true } }, receiver: { select: { name: true, rollNumber: true } } }, orderBy: { createdAt: 'desc' } }),
  ]);
  res.json({ sent, received });
};

export const respondToInvite = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const { action } = req.body as { action: 'accept' | 'decline' };
    const inviteId = s(req.params.id);

    const invite = await prisma.roommateInvite.findFirst({ where: { id: inviteId, receiverId: studentId, status: 'pending' } });
    if (!invite) return res.status(404).json({ message: 'Invite not found or already responded to' });
    if (new Date() > invite.expiresAt) {
      await prisma.roommateInvite.update({ where: { id: inviteId }, data: { status: 'expired' } });
      await redis.decr(`invite_hold:${invite.roomId}`);
      return res.status(410).json({ message: 'This invite has expired' });
    }

    if (action === 'decline') {
      await prisma.roommateInvite.update({ where: { id: inviteId }, data: { status: 'declined' } });
      await redis.decr(`invite_hold:${invite.roomId}`);
      const receiver = await prisma.student.findUnique({ where: { id: studentId } });
      await prisma.notification.create({ data: { studentId: invite.senderId, type: 'invite_declined', title: 'Roommate Invite Declined', body: `${receiver!.name} declined your roommate invite.`, metadata: { inviteId } } }).catch(() => {});
      return res.json({ message: 'Invite declined' });
    }

    if (action === 'accept') {
      const room = await prisma.room.findUnique({ where: { id: invite.roomId }, include: { hostel: { select: { name: true } } } });
      if (!room) return res.status(404).json({ message: 'Room no longer exists' });
      const occupants = await prisma.roomAssignment.count({ where: { roomId: invite.roomId, status: 'confirmed' } });
      if (occupants >= room.capacity) return res.status(409).json({ message: 'Room is now full' });

      // 1. Assign the Receiver (acceptor)
      await prisma.roomAssignment.upsert({
        where: { studentId },
        create: { studentId, roomId: invite.roomId, windowId: invite.windowId, status: 'confirmed', bookedAt: new Date(), notes: `Joined via roommate invite` },
        update: { roomId: invite.roomId, windowId: invite.windowId, status: 'confirmed', bookedAt: new Date(), notes: `Joined via roommate invite` }
      });

      // 2. Automatically assign the Sender if they aren't already in this room
      const senderAssignment = await prisma.roomAssignment.findUnique({ where: { studentId: invite.senderId } });
      if (senderAssignment?.roomId !== invite.roomId || senderAssignment?.status !== 'confirmed') {
        await prisma.roomAssignment.upsert({
          where: { studentId: invite.senderId },
          create: { studentId: invite.senderId, roomId: invite.roomId, windowId: invite.windowId, status: 'confirmed', bookedAt: new Date(), notes: `Group leader - Joined after first acceptance` },
          update: { roomId: invite.roomId, windowId: invite.windowId, status: 'confirmed', bookedAt: new Date(), notes: `Group leader - Joined after first acceptance` }
        });
      }

      await prisma.roommateInvite.update({ where: { id: inviteId }, data: { status: 'accepted' } });
      await redis.decr(`invite_hold:${invite.roomId}`);

      const receiver = await prisma.student.findUnique({ where: { id: studentId } });
      await prisma.notification.create({ data: { studentId: invite.senderId, type: 'invite_accepted', title: 'Roommate Invite Accepted!', body: `${receiver!.name} accepted your invite and will share Room ${room.roomNumber} in ${room.hostel.name}!`, metadata: { inviteId } } }).catch(() => {});

      return res.json({ message: `Successfully joined Room ${room.roomNumber} in ${room.hostel.name}` });
    }
    return res.status(400).json({ message: 'action must be accept or decline' });
  } catch (e: any) { handleError(e, req, res); }
};

export const lockRoomForGroup = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const student = await prisma.student.findUnique({ where: { id: studentId }, include: { assignment: { include: { room: true } } } });
    if (!student?.assignment || student.assignment.status !== 'confirmed') {
      return res.status(403).json({ message: 'You do not have a confirmed room allocation' });
    }
    
    // Check if room is already locked
    const room = student.assignment.room;
    if (room && room.privateUntil && new Date(room.privateUntil) > new Date()) {
      return res.status(400).json({ message: 'Room is already locked for your group.' });
    }
    
    // Check if the 5-minute window from joining is still open
    const bookedAt = new Date(student.assignment.bookedAt).getTime();
    if (Date.now() - bookedAt > 5 * 60 * 1000) {
      return res.status(403).json({ message: 'The 5-minute group-lock option has expired. Room is now public.' });
    }

    await prisma.room.update({
      where: { id: student.assignment.roomId },
      data: { isPublic: false, privateUntil: new Date(Date.now() + 10 * 60 * 1000) } // extend to 10 mins
    });
    res.json({ message: 'Room locked for your group for 10 minutes.' });
  } catch (e: any) { handleError(e, req, res); }
};

export const openRoomToPublic = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const student = await prisma.student.findUnique({ where: { id: studentId }, include: { assignment: true } });
    if (!student?.assignment || student.assignment.status !== 'confirmed') {
      return res.status(403).json({ message: 'You do not have a confirmed room allocation' });
    }
    await prisma.room.update({
      where: { id: student.assignment.roomId },
      data: { isPublic: true, privateUntil: null }
    });
    res.json({ message: 'Room is now open for public booking' });
  } catch (e: any) { handleError(e, req, res); }
};
