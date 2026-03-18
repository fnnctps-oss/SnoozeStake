import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { paramStr } from '../utils/params';

export const alarmRouter = Router();

alarmRouter.use(requireAuth);

const createAlarmSchema = z.object({
  label: z.string().min(1).max(100),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  daysOfWeek: z.array(z.number().min(0).max(6)),
  snoozeBasePenalty: z.number().min(1).max(100).optional(),
  useEscalatingPenalty: z.boolean().optional(),
  maxSnoozes: z.number().min(1).max(10).optional(),
  snoozeDurationMinutes: z.number().min(1).max(30).optional(),
  wakeUpTaskType: z.enum(['NONE', 'MATH', 'QR_SCAN', 'PHOTO_SUNLIGHT', 'WALK_STEPS', 'SHAKE_PHONE', 'BARCODE_SCAN', 'TYPING_TEST']).optional(),
  wakeUpTaskDifficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  penaltyDestination: z.enum(['SAVINGS', 'CHARITY', 'FRIEND']).optional(),
  charityId: z.string().uuid().optional(),
  friendRecipientId: z.string().uuid().optional(),
  noEscapeMode: z.boolean().optional(),
  soundUrl: z.string().optional(),
});

// GET /api/alarms
alarmRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const alarms = await prisma.alarm.findMany({
      where: { userId: req.userId! },
      orderBy: { time: 'asc' },
    });
    res.json({ alarms });
  } catch (err) {
    next(err);
  }
});

// POST /api/alarms
alarmRouter.post('/', async (req: AuthRequest, res, next) => {
  try {
    const body = createAlarmSchema.parse(req.body);
    const alarm = await prisma.alarm.create({
      data: {
        userId: req.userId!,
        ...body,
      },
    });
    res.status(201).json({ alarm });
  } catch (err) {
    next(err);
  }
});

// PUT /api/alarms/:id
alarmRouter.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const alarm = await prisma.alarm.findFirst({
      where: { id: paramStr(req.params.id), userId: req.userId! },
    });
    if (!alarm) throw new AppError(404, 'Alarm not found');

    const body = createAlarmSchema.partial().parse(req.body);
    const updated = await prisma.alarm.update({
      where: { id: paramStr(req.params.id) },
      data: body,
    });
    res.json({ alarm: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/alarms/:id
alarmRouter.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const alarm = await prisma.alarm.findFirst({
      where: { id: paramStr(req.params.id), userId: req.userId! },
    });
    if (!alarm) throw new AppError(404, 'Alarm not found');

    await prisma.alarm.delete({ where: { id: paramStr(req.params.id) } });
    res.json({ message: 'Alarm deleted' });
  } catch (err) {
    next(err);
  }
});

// POST /api/alarms/:id/toggle
alarmRouter.post('/:id/toggle', async (req: AuthRequest, res, next) => {
  try {
    const alarm = await prisma.alarm.findFirst({
      where: { id: paramStr(req.params.id), userId: req.userId! },
    });
    if (!alarm) throw new AppError(404, 'Alarm not found');

    const updated = await prisma.alarm.update({
      where: { id: paramStr(req.params.id) },
      data: { isEnabled: !alarm.isEnabled },
    });
    res.json({ alarm: updated });
  } catch (err) {
    next(err);
  }
});
