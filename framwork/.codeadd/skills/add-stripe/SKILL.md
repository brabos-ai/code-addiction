---
name: add-stripe
description: Use when user mentions Stripe, billing, subscriptions, plans, or payments - provides patterns for Stripe integration with price versioning and grandfathering (project)
---

# Stripe Integration

## Overview

Stripe integration for SaaS. Query `stripe-doc.md` via Grep for code examples.

**Principle:** Never edit an existing price. Create a new one and keep existing customers on the previous price (grandfathering).

## Database Schema

**Migration:** `libs/app-database/migrations/20250101001_create_initial_schema.js`

```
plans → plan_prices → subscriptions → payment_history
```

## Quick Reference

{"api":{"createPlan":"stripe.products.create()","createPrice":"stripe.prices.create()","deactivatePrice":"stripe.prices.update({active:false})","createSub":"stripe.subscriptions.create()","cancelSub":"stripe.subscriptions.cancel()"}}

## Querying Documentation

```bash
Grep pattern="subscription" path="{{skill:add-stripe/stripe-doc.md}}"
Grep pattern="price" path="{{skill:add-stripe/stripe-doc.md}}"
```

## Essential Flows

### Create Plan + Price

```typescript
// 1. Product (plan)
const product = await stripe.products.create({
  name: 'Pro',
  metadata: { plan_code: 'pro' }
});

// 2. Price (amount)
const price = await stripe.prices.create({
  product: product.id,
  unit_amount: 9900, // $99.00
  currency: 'usd',
  recurring: { interval: 'month' }
});

// 3. Save locally
await db.insertInto('plans').values({ stripe_product_id: product.id, code: 'pro', name: 'Pro' });
await db.insertInto('plan_prices').values({ plan_id, stripe_price_id: price.id, amount: 9900, is_current: true });
```

### Adjust Price (Grandfathering)

```typescript
// 1. NEW price (never edit existing)
const newPrice = await stripe.prices.create({
  product: productId,
  unit_amount: 11900,
  currency: 'usd',
  recurring: { interval: 'month' }
});

// 2. Deactivate old price for NEW subscriptions
await stripe.prices.update(oldPriceId, { active: false });

// 3. Update locally
await db.updateTable('plan_prices').set({ is_current: false }).where('stripe_price_id', '=', oldPriceId);
await db.insertInto('plan_prices').values({ plan_id, stripe_price_id: newPrice.id, amount: 11900, is_current: true });
// Existing customers KEEP the old price automatically!
```

### Webhook Handler

```typescript
async function handleWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'invoice.paid':
      await savePaymentHistory(event.data.object);
      break;
    case 'customer.subscription.updated':
      await syncSubscription(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await cancelSubscription(event.data.object);
      break;
  }
}
```

## Environment Variables

```bash
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

## Common Mistakes

{"mistakes":[{"err":"Edit existing price","fix":"Create new price, deactivate old one"},{"err":"Not validating webhook","fix":"Use stripe.webhooks.constructEvent()"},{"err":"Trusting Stripe alone","fix":"Sync via webhooks to local database"}]}
