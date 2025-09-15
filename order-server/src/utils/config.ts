import "dotenv/config";

export const config = {
  port: process.env.PORT || 3000,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "sk_test_...",
  paymentGatewayUrl: process.env.PAYMENT_GATEWAY_URL || "http://localhost:4000",
  db: {
        host: process.env.MYSQL_HOST  || "localhost",
        port: parseInt(process.env.MYSQL_PORT || "3306", 10),
        user: process.env.MYSQL_USER || "root",
        password: process.env.MYSQL_PASSWORD || "rootpass",
        database: process.env.MYSQL_DATABASE || "markethub_db",
        waitForConnections: true,
        connectionLimit: 10, // Adjust based on your needs
        queueLimit: 0,
    },
//   {
//     host: process.env.DB_HOST || "localhost",
//     port: parseInt(process.env.DB_PORT || "3306", 10),
//     user: process.env.DB_USER || "root",
//     password: process.env.DB_PASS || "rootpass",
//     database: process.env.DB_NAME || "markethub_db",
//   },
};
