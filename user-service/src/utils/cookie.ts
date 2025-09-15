import { Response } from 'express';

export function setAuthCookie(res: Response, token: string) {
  res.cookie(process.env.COOKIE_NAME || 'token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
} 