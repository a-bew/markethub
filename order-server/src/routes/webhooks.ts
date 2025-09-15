import { Router, Request, Response } from "express";
import { getOrderByPaymentId, updateOrder } from "@/models/orders";

const router = Router();

router.post("/payment-status", async (req: Request, res: Response) => {

    try{
  
        const { eventType, data } = req.body;
        const { paymentId } = data;

        const [rows] = await getOrderByPaymentId(paymentId);
        const order: any = (rows as any[])[0];
        if (!order) return res.status(404).json({ error: "Order not found" });

        let newStatus = order.status;
        if (eventType === "payments.auth.approved") newStatus = "AUTHORIZED";
        else if (eventType === "vendor.capture.succeeded") newStatus = "PAID";
        else if (eventType === "payments.auth.declined") newStatus = "FAILED";

        await updateOrder(order.id, { status: newStatus });

        console.log(`Order ${order.id} updated to ${newStatus}`);
        res.status(200).json({ ok: true });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
