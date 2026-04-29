import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import {
  setupInitialAdmin,
  createWarden, getWardens, deleteWarden,
  createHostel, editHostel, deleteHostel, getHostels,
  createRooms, batchCreateRooms, updateRoom, deleteRoom, getHostelRooms, deleteHostelRooms, bulkUploadRooms,
  createRestriction, updateRestriction, deleteRestriction,
  createAllocationWindow, getAllWindows, activateWindow, lockWindow, unlockWindow, deleteWindow,
  getStudents, createStudent, updateStudent, deleteStudent, bulkImportStudents,
  getTeachers, createTeacher, deleteTeacher,
  manualOverride, unallocateRoom,
  getDashboardStats, getAllocations, getOccupancyReport,
  getAuditLogs, exportAllocations,
  createNotice, getNotices, deleteNotice,
} from './admin.controller';

const upload = multer({ dest: 'uploads/' });
const router = Router();

const SA = ['superadmin'];
const SW = ['superadmin', 'warden'];

// First-time setup (public)
router.post('/setup', setupInitialAdmin);

// Warden management (superadmin only)
router.post  ('/wardens',     authenticate, authorize(SA), createWarden);
router.get   ('/wardens',     authenticate, authorize(SA), getWardens);
router.delete('/wardens/:id', authenticate, authorize(SA), deleteWarden);

// Hostel CRUD
router.get   ('/hostels',     authenticate, authorize(SW), getHostels);
router.post  ('/hostels',     authenticate, authorize(SW), createHostel);
router.patch ('/hostels/:id', authenticate, authorize(SW), editHostel);
router.delete('/hostels/:id', authenticate, authorize(SA), deleteHostel);

// Room CRUD
router.get   ('/hostels/:hostelId/rooms', authenticate, authorize(SW), getHostelRooms);
router.post  ('/rooms',                   authenticate, authorize(SW), createRooms);
router.post  ('/rooms/batch',             authenticate, authorize(SW), batchCreateRooms);
router.post  ('/rooms/bulk',              authenticate, authorize(SW), upload.single('file'), bulkUploadRooms);
router.patch ('/rooms/:id',               authenticate, authorize(SW), updateRoom);
router.delete('/rooms/:id',               authenticate, authorize(SA), deleteRoom);
router.delete('/hostels/:hostelId/rooms', authenticate, authorize(SA), deleteHostelRooms);

// Restrictions
router.post  ('/restrictions',     authenticate, authorize(SA), createRestriction);
router.patch ('/restrictions/:id', authenticate, authorize(SA), updateRestriction);
router.delete('/restrictions/:id', authenticate, authorize(SA), deleteRestriction);

// Allocation Windows
router.post('/windows',              authenticate, authorize(SA), createAllocationWindow);
router.get ('/windows',              authenticate, authorize(SW), getAllWindows);
router.put ('/windows/:id/activate', authenticate, authorize(SA), activateWindow);
router.put ('/windows/:id/lock',     authenticate, authorize(SA), lockWindow);
router.put ('/windows/:id/unlock',   authenticate, authorize(SA), unlockWindow);
router.delete('/windows/:id',        authenticate, authorize(SA), deleteWindow);

// Student management
router.get   ('/students',                authenticate, authorize(SW), getStudents);
router.post  ('/students',                authenticate, authorize(SW), createStudent);
router.patch ('/students/:id',            authenticate, authorize(SW), updateStudent);
router.delete('/students/:id',            authenticate, authorize(SA), deleteStudent);
router.post  ('/students/bulk',           authenticate, authorize(SW), upload.single('file'), bulkImportStudents);

// Teacher management
router.get   ('/teachers',     authenticate, authorize(SW), getTeachers);
router.post  ('/teachers',     authenticate, authorize(SW), createTeacher);
router.delete('/teachers/:id', authenticate, authorize(SA), deleteTeacher);

// Allocation management
router.get   ('/allocations',             authenticate, authorize(SW), getAllocations);
router.post  ('/allocations/override',    authenticate, authorize(SW), manualOverride);
router.delete('/allocations/:id',         authenticate, authorize(SW), unallocateRoom);

// Reports
router.get('/dashboard/stats',      authenticate, authorize(SW), getDashboardStats);
router.get('/reports/occupancy',    authenticate, authorize(SW), getOccupancyReport);
router.get('/reports/export',       authenticate, authorize(SW), exportAllocations);
router.get('/audit-logs',           authenticate, authorize(SA), getAuditLogs);

// Notices
router.get   ('/notices',     authenticate, authorize(SW), getNotices);
router.post  ('/notices',     authenticate, authorize(SW), createNotice);
router.delete('/notices/:id', authenticate, authorize(SW), deleteNotice);

export default router;
