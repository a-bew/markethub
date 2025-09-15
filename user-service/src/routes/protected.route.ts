import { Router } from 'express';
import { userProfile, userLogout } from '@/controllers/userprofile.controller';
const router = Router();

router.get('/me', userProfile);
router.get('/logout', userLogout);

export default router;
