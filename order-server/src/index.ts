import express from 'express';
import http from 'http';
import cors from 'cors';
import { createSocketServer } from '@/shared/socket';
import { authMiddleware, expressAuthMiddleware } from '@/middleware/auth';
import cookieParser from 'cookie-parser';
import { ensureTables } from "@/models/orders";
import ordersRoutes from "@/routes/orders";
import paymentMethodsRoutes from "@/routes/paymentMethods";
import webhooksRoutes from "@/routes/webhooks";

class ChatServer {
  private app: express.Application;
  private server: http.Server;
  private port: number | string;

  constructor() {
    this.app = express();
    this.app.use(cookieParser());
    this.server = http.createServer(this.app);
    this.port = process.env.PORT || 3000;
    
    this.configureMiddleware();
    this.configureRoutes();
    this.configurePrivateRoutes();
    this.configureSocket();
    this.configureCatchAll()
  }

  private configureCatchAll(): void {
      this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
        console.error(err.stack)
        res.status(err.status, 500).send(err.message || 'Something broke!')
      })
  }
  private configureMiddleware(): void {
    this.app.use(cors({ origin: true, credentials: true }));
    this.app.use(express.json());
  }

  private configureRoutes(): void {
    this.app.get('/health', (req: express.Request, res: express.Response) => {
      res.status(200).send('OK');
    });
  }

  private async configureSocket(): Promise<void> {
    const io = await createSocketServer(this.server);
    io.use(authMiddleware);
    // await initializeRooms(io);
  }

  private async configurePrivateRoutes(): Promise<void> {
    // Add your routes here
    // routes
    this.app.use(expressAuthMiddleware);
    this.app.use("/orders", ordersRoutes);
    this.app.use("/payment-methods", paymentMethodsRoutes);
    this.app.use("/webhooks", webhooksRoutes);
  }

  public async start(): Promise<void> {
    await ensureTables();

    this.server.listen(this.port, () => {
      console.log(`Server ${process.env.SERVER_ID} listening on port ${this.port}`);
    });
  }

}

const chatServer = new ChatServer();
chatServer.start().catch(err => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});;