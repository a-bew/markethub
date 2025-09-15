import Stripe from "stripe";
import { config } from "@/utils/config";

export const stripe = new Stripe(config.stripeSecretKey, { apiVersion: "2022-11-15" });

export async function createPaymentMethod(cardNumber: string, expMonth: number, expYear: number, cvc: string) {
  return stripe.paymentMethods.create({
    type: "card",
    card: { number: cardNumber, exp_month: expMonth, exp_year: expYear, cvc },
  });
}
