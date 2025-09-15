// src/types/user.ts
export interface User {
  id: number;
  email: string;
  userId: string;
  username: string;
  iat?: number; // added by JWT
  exp?: number; // added by JWT
}

