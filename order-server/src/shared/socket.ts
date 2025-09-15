import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { RedisClient } from './redis';
import { Server as ServerType } from 'http';
import { User } from '@/types/user';

export interface AuthenticatedSocket extends Socket {
  decodedToken?: Omit<User, 'id' | 'email'>;
}

export async function createSocketServer(server: ServerType): Promise<Server> {
  const io = new Server(server, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Get the singleton Redis wrapper instance
  const redisWrapper = RedisClient.getInstance();

  // Get the pub client
  const pub = redisWrapper.getClient();
  await pub.connect();

  // Duplicate for sub client
  const sub = pub.duplicate();
  await sub.connect();

  // Pass raw Redis clients to the adapter
  io.adapter(createAdapter(pub, sub));

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`New connection from ${socket.id} on server ${process.env.SERVER_ID}`);

    socket.on('disconnect', () => {
      console.log(`Client ${socket.id} disconnected`);
    });

    socket.on('error', (err) => {
      console.error(`Socket error: ${err.message}`);
    });
  });

  return io;
}
