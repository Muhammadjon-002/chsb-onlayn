import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authenticate, safeUser, sendData } from '../middleware.js';
const router = Router();

router.post('/login', async (req, res) => {
  const parsed = z.object({ username: z.string().min(1), password: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Login va parolni kiriting.' });
  const user = await prisma.user.findFirst({ where: { OR: [{ username: parsed.data.username.trim() }, { studentCode: parsed.data.username.trim() }] }, include: { class: true, assignedClasses: true, assignedSubjects: { include: { subject: true } } } });
  if (!user || user.status !== 'active' || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return res.status(401).json({ success: false, message: 'Login yoki parol noto‘g‘ri.' });
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '12h' });
  return sendData(res, { token, user: safeUser(user) });
});

router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.authUser!.id }, include: { class: true, assignedClasses: true, assignedSubjects: { include: { subject: true } } } });
  if (!user) return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi.' });
  return sendData(res, safeUser(user));
});
router.post('/logout', (_req, res) => sendData(res, { loggedOut: true }));
export default router;
