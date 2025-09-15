// src/types/express.d.ts
import { User } from '@/types/user';

export {};

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

