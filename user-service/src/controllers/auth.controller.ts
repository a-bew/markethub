import { Request, Response } from 'express';
import userService from '@/services/auth.service';
import { setAuthCookie } from '@/utils/cookie';

export async function signup(req: Request, res: Response) {
  try {
    const { token, user } = await userService.registerUser(req.body);
    setAuthCookie(res, token);
    res.json({ token, user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const {token, user} = await userService.loginUser(req.body);
    setAuthCookie(res, token);
    res.json({ token, user });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
}