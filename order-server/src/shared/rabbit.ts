// emitter-service/src/rabbit.ts
import amqp from 'amqplib/callback_api';
import { logger } from '@/utils/logger';

const exchange = 'notifications';
let connection: amqp.Connection;
let channel: amqp.Channel;

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

export async function connectRabbit(): Promise<amqp.Channel> {
  if (channel) return channel;

  return new Promise((resolve, reject) => {
    amqp.connect(RABBITMQ_URL, { heartbeat: 10 }, (err, conn) => {
      if (err) {
        logger.error('Failed to connect to RabbitMQ:', err);
        return reject(err);
      }

      connection = conn;
      
      connection.on('error', (err) => {
        logger.error('RabbitMQ connection error:', err);
      });

      connection.on('close', () => {
        logger.warn('RabbitMQ connection closed.');
        process.exit(1);
      });

      connection.createChannel((err, ch) => {
        if (err) {
          logger.error('Failed to create channel:', err);
          return reject(err);
        }

        channel = ch;
        channel.assertExchange(exchange, 'topic', { durable: true }, (err) => {
          if (err) {
            logger.error('Failed to assert exchange:', err);
            return reject(err);
          }

          logger.info('Connected to RabbitMQ');
          resolve(channel);
        });
      });
    });
  });
}

export async function closeRabbitConnection() {
  try {
    if (channel) await channel.close((e) => {
      if (e) logger.error('Error closing RabbitMQ channel:', e);
    });
    if (connection) await connection.close();
  } catch (err) {
    logger.error('Error closing RabbitMQ connection:', err);
  }
}

export interface NotificationPayload {
    
  userId?: string;
  title: string;
  body: string;
    type: string;
    userIds?: string[]; // NEW

  channel?: string;
  data?: any;
  service?: string;
}

export async function emitNotification(payload: NotificationPayload): Promise<void>  {
    const ch = await connectRabbit();
    //   const routingKey = `notify.user.${payload.userId}`;
    const routingKey = payload.userId
        ? `notify.user.${payload.userId}`
        : payload.channel
        ? `notify.channel.${payload.channel}`
        : 'notify.broadcast';

    const msg = Buffer.from(JSON.stringify(payload));

     if (payload.userIds?.length) {
        for (const userId of payload.userIds) {
        channel.publish(exchange, `notify.user.${userId}`, Buffer.from(JSON.stringify({
            ...payload,
            userId,
        })));
        }
    } else {
        ch.publish(exchange, routingKey, msg, {
            //  contentType: 'application/json',
            persistent: true,
        });  // 📨 topic routing
    }

    logger.info(`📬 Sent notification to ${routingKey}`);
}

// Example usage

// emitNotification({
//   type: 'PAYMENT_FAILED',
//   userId: '123',
//   title: 'Payment Failed',
//   body: 'Your payment could not be processed.',
//   service: 'payment-service'
// });

// await sendNotification({
//   type: 'ORDER_CONFIRMED',
//   userId: '123',
//   title: 'Order Confirmed',
//   body: 'Your order #456 has been confirmed.',
//   service: 'order-service',
//   data: { orderId: '456' }
// });


// curl -X POST http://localhost:4002/notify \
//   -H "Content-Type: application/json" \
//   -d '{
//     "userId": "123",
//     "title": "Testing Notification",
//     "body": "This is a test from order-service",
//     "type": "TEST"
//   }'
