import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from './db.js';

export type AuthUser = { id: string; role: 'admin' | 'teacher' | 'student' };
declare global { namespace Express { interface Request { authUser?: AuthUser } } }

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ success: false, message: 'Tizimga kiring.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
    const user = await prisma.user.findUnique({ where: { id: payload.id }, select: { id: true, role: true, status: true } });
    if (!user || user.status !== 'active') return res.status(401).json({ success: false, message: 'Hisob faol emas.' });
    req.authUser = { id: user.id, role: user.role };
    next();
  } catch { return res.status(401).json({ success: false, message: 'Sessiya yaroqsiz yoki muddati tugagan.' }); }
}

export function allow(...roles: Array<'admin' | 'teacher' | 'student'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.authUser || !roles.includes(req.authUser.role)) return res.status(403).json({ success: false, message: 'Bu amal uchun ruxsat yo‘q.' });
    next();
  };
}

export const safeUser = (u: any) => ({
  id: u.id, username: u.username, fullName: u.fullName, email: u.email, role: u.role,
  studentId: u.studentCode ?? undefined, classId: u.classId ?? undefined,
  className: u.class?.name ?? undefined,
  assignedClassIds: u.assignedClasses?.map((x: any) => x.classId),
  assignedSubjects: u.assignedSubjects?.map((x: any) => x.subject.name),
  status: u.status, createdAt: u.createdAt.toISOString()
});

export const sendData = (res: Response, data: unknown, status = 200) => res.status(status).json({ success: true, data });
