import { Router, Request, Response } from "express";
import { createPaymentMethod } from "@/services/stripeService";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const { cardNumber, expMonth, expYear, cvc } = req.body;
  try {
    const paymentMethod = await createPaymentMethod(cardNumber, expMonth, expYear, cvc);
    res.json({ paymentMethodId: paymentMethod.id });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

export default router;
