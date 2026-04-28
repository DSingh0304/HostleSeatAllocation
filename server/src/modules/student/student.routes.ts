import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { bookingRateLimiter } from '../../middleware/rateLimiter.middleware';
import {
  getProfile,
  getEligibleHostels, getHostelRooms, getActiveWindow,
  getNotifications, markNotificationRead, markAllNotificationsRead,
  getNotices,
  getPreferences, setPreferences,
  sendInvite, getMyInvites, respondToInvite,
  openRoomToPublic, lockRoomForGroup,
} from './student.controller';

const router = Router();

// All student routes require authentication
router.use(authenticate);

// Profile
router.get('/profile', getProfile);
router.patch('/room/open', openRoomToPublic);
router.patch('/room/lock', lockRoomForGroup);

// Hostels & windows
router.get('/hostels',                   getEligibleHostels);
router.get('/hostels/:id/rooms',         getHostelRooms);
router.get('/active-window',             getActiveWindow);

// Notifications
router.get ('/notifications',            getNotifications);
router.patch('/notifications/read-all', markAllNotificationsRead);
router.patch('/notifications/:id/read', markNotificationRead);

// Notices
router.get('/notices', getNotices);

// Preferences
router.get ('/preferences', getPreferences);
router.post('/preferences', setPreferences);

// Roommate Invites
router.get ('/invites',              getMyInvites);
router.post('/invites',              bookingRateLimiter, sendInvite);
router.post('/invites/:id/respond',  respondToInvite);

export default router;
