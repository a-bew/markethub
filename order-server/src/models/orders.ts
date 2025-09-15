import { query } from "@/shared/db";
import { randomId } from "@/utils/randomId";

export type Order = {
  id: string;
  customer_id: string;
  merchant_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_id: string;
};

export async function ensureTables() {
  await query(`CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(32) PRIMARY KEY,
    customer_id VARCHAR(64),
    merchant_id VARCHAR(64),
    amount INT,
    currency VARCHAR(8),
    status VARCHAR(32),
    payment_id VARCHAR(32)
  )`);
}

export async function createOrder(customerId: string, merchantId: string, amount: number, currency: string) {
  const orderId = randomId("order");
  await query(
    "INSERT INTO orders (id, customer_id, merchant_id, amount, currency, status) VALUES (?, ?, ?, ?, ?, ?)",
    [orderId, customerId, merchantId, amount, currency, "PENDING_PAYMENT"]
  );
  return orderId;
}

export async function getOrderById(orderId: string) {
  const [rows] = await query("SELECT * FROM orders WHERE id = ?", [orderId]);
  return (rows as any[])[0];
}

export async function getOrderByPaymentId(paymentId: string) {
  const [rows] = await query("SELECT * FROM orders WHERE payment_id = ?", [paymentId]);
  return (rows as any[])[0];
}

export async function updateOrderStatus( paymentId: string,  status: string, orderId: string) {
  await query("UPDATE orders SET payment_id = ?, status = ? WHERE id = ?", [paymentId,
    status,
    orderId]);
}

  export const updateOrder  = async (id: string, order: Partial<Order>): Promise<void> => {
    const fields = Object.keys(order)
      .filter(key => !["id", "customer_id", "merchant_id"].includes(key))  // Exclude id, customer_id, merchant_id
      .map(key => `${key} = ?`)
      .join(', ');

    const values = Object.values(order).filter((_, index) => !["id", "customer_id", "merchant_id"].includes(Object.keys(order)[index]));

    await query(`UPDATE orders SET ${fields} WHERE id = ?`, [...values, id]);
  };
