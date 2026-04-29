import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { bookRoom, cancelBooking, ConflictError } from './allocation.service';
import { z } from 'zod';
import { handleError } from '../../middleware/errorHandler.middleware';

const bookSchema = z.object({
  roomId: z.string().uuid(),
  windowId: z.string().uuid(),
});

export const handleBookRoom = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const { roomId, windowId } = bookSchema.parse(req.body);

    const assignment = await bookRoom(studentId, roomId, windowId);
    res.status(201).json(assignment);
  } catch (error: any) {
    if (error instanceof ConflictError) {
      return res.status(409).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
};

export const handleCancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const id = req.params.id as string;

    await cancelBooking(studentId, id);
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
