import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

// In-memory store for FCM tokens (use Redis/DB in production)
const fcmTokens = new Map<string, string>();

// POST /api/notifications/register — Register FCM token
notificationRouter.post('/register', async (req: AuthRequest, res, next) => {
  try {
    const { token } = z.object({ token: z.string().min(1) }).parse(req.body);
    fcmTokens.set(req.userId!, token);
    res.json({ message: 'Token registered' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/preferences — Update notification settings
notificationRouter.put('/preferences', async (req: AuthRequest, res, next) => {
  try {
    const prefs = z
      .object({
        morningReport: z.boolean().optional(),
        weeklyReport: z.boolean().optional(),
        battleUpdates: z.boolean().optional(),
        groupAlerts: z.boolean().optional(),
        friendActivity: z.boolean().optional(),
      })
      .parse(req.body);

    // Store in DB in production — for now, acknowledge
    res.json({ preferences: prefs });
  } catch (err) {
    next(err);
  }
});

export { fcmTokens };
