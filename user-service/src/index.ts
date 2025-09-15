import dotenv from 'dotenv';
dotenv.config();
// Enables alias for production runtime
import 'module-alias/register';
import express from 'express';
import cors from 'cors';
import authRoutes from '@/routes/auth';
import { logger } from '@/utils/logger';
import { authenticate } from '@/middlewares/auth.middleware';
import prodctedRoute from '@/routes/protected.route';
import userModel from '@/models/user.model';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
  credentials: true,
  origin: 'http://localhost:3002',
}));

app.use(express.json());
// app.use(cookieParser(process.env.COOKIE_SECRET)); // optional if signing
app.use(cookieParser()); // <--- must come before routes

app.use('/api/auth', authRoutes);
app.use('/api/user', authenticate, prodctedRoute);

const PORT = process.env.PORT || 4000;


/** ---------- Boot ---------- **/
(async () => {
  await userModel.createUsersTable();
  app.listen(PORT, () =>
  logger.info(`Auth service running on port ${PORT}`)
  );
})();