import { Router, Request, Response } from "express";
import fetch from "node-fetch";
import { randomId } from "../utils/randomId";
import { config } from "@/utils/config";
import { createOrder, getOrderById, updateOrder } from "@/models/orders";

const router = Router();

// Create order
router.post("/", async (req: Request, res: Response) => {

  const { customerId, merchantId, totalAmount, currency } = req.body;

  try {
    
      const orderId = randomId("order");

      await createOrder(customerId, merchantId, totalAmount, currency);

      res.status(201).json({ orderId, status: "PENDING_PAYMENT" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }

});

// Pay order
router.post("/:orderId/pay", async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { paymentMethodToken } = req.body;

  try {
    
      const order = await getOrderById(orderId);

      if (!order || order.status !== "PENDING_PAYMENT") {
        return res.status(400).json({ error: "Invalid order" });
      }

      const createRes = await fetch(`${config.paymentGatewayUrl}/payment_intents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": `pay_${orderId}` },
        body: JSON.stringify({
          merchantId: order.merchant_id,
          amount: order.amount,
          currency: order.currency,
          customerId: order.customer_id,
          paymentMethodToken,
        }),
      });

      if (!createRes.ok) return res.status(createRes.status).json({ error: "Payment creation failed" });
      
      const { id: paymentId } = await createRes.json();

      const confirmRes = await fetch(`${config.paymentGatewayUrl}/payment_intents/${paymentId}/confirm`, {
        method: "POST",
      });
      
      if (!confirmRes.ok) return res.status(confirmRes.status).json({ error: "Payment confirmation failed" });

      await updateOrder(orderId, { payment_id: paymentId, status: "PROCESSING" });

      res.json({ paymentId, status: "PROCESSING" });

     } catch (error) {

      console.error(error);
      res.status(500).json({ error: "Internal server error" });

    }
});

export default router;
