import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedSocket } from '@/shared/socket';
import { User } from '@/types/user';
import * as cookie from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET as string;
const COOKIE_NAME = 'COOKIE_NAME';

// ---- Helpers ----
function verifyToken(token: string): User {
  return jwt.verify(token, JWT_SECRET) as User;
}

function extractTokenFromCookie(cookieHeader?: string): string | null {
  if (!cookieHeader) return null;
  const cookies = cookie.parse(cookieHeader);
  return cookies[COOKIE_NAME] || null;
}

function extractTokenFromAuthHeader(authHeader?: string): string | null {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

function getToken(
  cookieHeader?: string,
  authHeader?: string,
  expressCookie?: string
): string | null {
  return (
    expressCookie ||
    extractTokenFromCookie(cookieHeader) ||
    extractTokenFromAuthHeader(authHeader) ||
    null
  );
}

// ---- WebSocket Middleware ----
export function authMiddleware(
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
): void {
  try {
    const token = getToken(
      socket.handshake.headers.cookie,
      socket.handshake.headers.authorization
    );
    if (!token) throw new Error('No token provided');

    socket.decodedToken = verifyToken(token);
    next();
  } catch (err) {
    console.error('WS Auth failed:', err);
    next(new Error('Authentication error'));
  }
}

// ---- Express Middleware ----
export function expressAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = getToken(
      req.headers.cookie,
      req.headers.authorization,
      req.cookies?.[COOKIE_NAME]
    );
    if (!token) throw new Error('No token provided');

    req.user = verifyToken(token);
    next();
  } catch (err) {
    console.error('HTTP Auth failed:', err);
    res.status(401).json({ error: 'Authentication failed' });
  }
}
