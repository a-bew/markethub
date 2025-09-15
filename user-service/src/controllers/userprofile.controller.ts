import { Request, Response } from 'express';

export async function userProfile(req: Request, res: Response) {
    try {
        const user = (req as any).user;
        console.log(user);
        res.status(200).json({ user });        
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function userLogout(req: Request, res: Response) {
    try {
        res.clearCookie('token');
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}   