import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

export function generateToken(payload: object, expiresIn = 24*60*60*1000) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}