import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/utils/jwt';

const COOKIE_NAME = process.env.COOKIE_NAME as string;

export function authenticate(req: Request, res: Response, next: NextFunction) {

  let token;
  if (COOKIE_NAME){
     token = req.cookies?.[COOKIE_NAME];
  } else {
    token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  }

  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    // const token = auth.split(' ')[1];
    const user = verifyToken(token);
    (req as any).user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}