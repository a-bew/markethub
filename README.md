
# Full Flow with cURL Commands

MarketHub is a Shopify-like marketplace where merchants sell products to customers. It handles orders and integrates with payment-system-v2 (the payment aggregator) for:

**User Payments:** Customers pay for orders using credit cards via Stripe.
**Revenue Distribution:** Payments are split (e.g., 10% platform fee to MarketHub, 90% to the merchant) using ledger-service.
**Payment Status Notifications:** MarketHub receives updates via webhooks from webhook-service.

## Setup

### Start payment-system-v2
```bash
git clone https://github.com/a-bew/payment-aggregator.git
cd payment-system-v2
# payment-system-v2/README.md
```

### Start MarketHub
1. Create `markethub_db` in MySQL.
2. Run MarketHub:
   ```bash
    node index.js # or
    ts-node src/index.ts
   ```

---

## Step 1: Create an Order

**cURL Command:**
```bash
curl -X POST http://localhost:3000/orders \
-H "Content-Type: application/json" \
-d '{
  "customerId": "cust_123",
  "merchantId": "merch_abc",
  "items": [
    {"productId": "prod_1", "quantity": 2, "price": 50}
  ],
  "totalAmount": 100,
  "currency": "USD"
}'
```

**Request Payload:**
```json
{
  "customerId": "cust_123",
  "merchantId": "merch_abc",
  "items": [
    {
      "productId": "prod_1",
      "quantity": 2,
      "price": 50
    }
  ],
  "totalAmount": 100,
  "currency": "USD"
}
```

**Response:**
```json
{
  "orderId": "order_xyz123",
  "status": "PENDING_PAYMENT"
}
```

**What Happens:**
- MarketHub stores the order in `orders` table with status: `PENDING_PAYMENT`.

---

## Step 2: Add or Reference Credit Card Details

### Option 1: Reference Existing Card
Use Stripe’s test PaymentMethod ID (`pm_card_visa` for Visa `4242 4242 4242 4242`).

### Option 2: Create PaymentMethod

**cURL Command:**
```bash
curl -X POST http://localhost:3000/payment-methods \
-H "Content-Type: application/json" \
-d '{
  "cardNumber": "4242424242424242",
  "expMonth": 12,
  "expYear": 2026,
  "cvc": "123"
}'
```

**Request Payload:**
```json
{
  "cardNumber": "4242424242424242",
  "expMonth": 12,
  "expYear": 2026,
  "cvc": "123"
}
```

**Response:**
```json
{
  "paymentMethodId": "pm_1ABC..."
}
```

> **Note:** In production, use **Stripe Elements** to collect card details securely on the frontend.

---

## Step 3: Pay for the Order

Use the `paymentMethodId` (e.g., `pm_card_visa` or `pm_1ABC...`).

**cURL Command:**
```bash
curl -X POST http://localhost:3000/orders/order_xyz123/pay \
-H "Content-Type: application/json" \
-d '{
  "paymentMethodToken": "pm_card_visa"
}'
```

**Request Payload:**
```json
{
  "paymentMethodToken": "pm_card_visa"
}
```

**Response:**
```json
{
  "paymentId": "pi_123456",
  "status": "PROCESSING"
}
```

**What Happens:**
1. MarketHub validates the order (`PENDING_PAYMENT`).
2. Calls **api-gateway** (`POST /payment_intents`) with:
   ```json
   {
     "merchantId": "merch_abc",
     "amount": 100,
     "currency": "USD",
     "customerId": "cust_123",
     "paymentMethodToken": "pm_card_visa"
   }
   ```
   Header: `Idempotency-Key: pay_order_xyz123` ensures no duplicates.
3. api-gateway forwards to **payment-intent-service**, which creates a payment intent (`pi_123456`, `REQUIRES_CONFIRMATION`) and publishes `payments.intent.created`.
4. MarketHub calls `POST /payment_intents/pi_123456/confirm`, updating to `PROCESSING` and publishing `payments.intent.confirmed`.
5. MarketHub updates orders with `payment_id: pi_123456`, status: `PROCESSING`.

---

## Step 4: Payment Processing in payment-system-v2

### Payments Orchestrator
- Consumes `payments.intent.confirmed`.
- Stores in `orchestrations` table (status: `ROUTED`, current_vendor: stripe).
- Publishes `payments.route.selected` and `vendor.auth.requested` (x-vendor: stripe).

### Vendor Stripe Adapter
- Consumes `vendor.auth.requested`.
- Creates Stripe `PaymentIntent` (amount: 10000 cents, currency: USD, payment_method: pm_card_visa).
- Publishes `payments.auth.approved` (with `authCode: pi_stripe_123`) or `payments.auth.declined`.

### Payments Orchestrator
- On `payments.auth.approved`: updates to `APPROVED`, publishes `vendor.capture.requested`.
- On `payments.auth.declined`: updates to `DECLINED`.

### Vendor Stripe Adapter
- Consumes `vendor.capture.requested`.
- Calls `stripe.paymentIntents.capture("pi_stripe_123")`.
- Publishes `vendor.capture.succeeded`.

### Ledger Service
- Consumes `vendor.capture.succeeded`.
- Records double-entry:
  - Debit: platform_cash $100.
  - Credit: platform_fee $10.
  - Credit: merchant_payable $90.

### Webhook Service
- Consumes `vendor.capture.succeeded`.
- Sends POST to `http://localhost:3000/webhooks/payment-status`:
  ```json
  {
    "eventType": "vendor.capture.succeeded",
    "data": { "paymentId": "pi_123456", "capturedAt": "2025-08-25T23:21:00Z" }
  }
  ```

---

## Step 5: MarketHub Updates Order

- MarketHub receives the webhook, updates `orders` table: status: `PAID` for `order_xyz123`.

**Optional: Check Order Status**
```ts
app.get("/orders/:orderId", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM orders WHERE id = ?", [req.params.orderId]);
  res.json(rows[0] || { error: "Not found" });
});
```

**cURL:**
```bash
curl http://localhost:3000/orders/order_xyz123
```

**Response:**
```json
{
  "id": "order_xyz123",
  "customer_id": "cust_123",
  "merchant_id": "merch_abc",
  "amount": 100,
  "currency": "USD",
  "status": "PAID",
  "payment_id": "pi_123456"
}
```

---

## Summary
- **Order Creation**: MarketHub creates `order_xyz123` (`PENDING_PAYMENT`).
- **Card Details**: Use test `pm_card_visa` or create a PaymentMethod with Stripe’s test card `4242 4242 4242 4242`.
- **Payment**: MarketHub calls payment-system-v2 to create/confirm a payment intent, which processes via Stripe.
- **Revenue Split**: ledger-service splits $100 into $10 (platform) and $90 (merchant).
- **Notifications**: webhook-service notifies MarketHub, updating the order to `PAID`.

This flow shows **payment-system-v2** as a payment aggregator serving **MarketHub**, handling secure payments, revenue distribution, and status updates.

> ⚠️ For production, add authentication, error handling, and secure card collection via **Stripe Elements**.

# markethub
