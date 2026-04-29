import { Router } from 'express';
import { handleBookRoom, handleCancelBooking } from './allocation.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { auditLogMiddleware } from '../../middleware/auditLog.middleware';
import { bookingRateLimiter } from '../../middleware/rateLimiter.middleware';

const router = Router();

router.post('/', authenticate, authorize(['student']), bookingRateLimiter, auditLogMiddleware('BOOK_ROOM', 'RoomAssignment'), handleBookRoom);
router.delete('/:id', authenticate, authorize(['student']), auditLogMiddleware('CANCEL_BOOKING', 'RoomAssignment'), handleCancelBooking);

export default router;
