import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all notifications for user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            imageUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
router.put('/:id/read', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { 
        id,
        userId: req.user!.id 
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark all notifications as read
router.put('/read-all', async (req: AuthRequest, res) => {
  try {
    await prisma.notification.updateMany({
      where: { 
        userId: req.user!.id,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete notification
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { 
        id,
        userId: req.user!.id 
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread notification count
router.get('/unread-count', async (req: AuthRequest, res) => {
  try {
    const count = await prisma.notification.count({
      where: { 
        userId: req.user!.id,
        isRead: false
      }
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
