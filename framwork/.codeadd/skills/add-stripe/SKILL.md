---
name: add-stripe
description: Use when user mentions Stripe, billing, subscriptions, plans, or payments - provides patterns for Stripe integration with price versioning and grandfathering (project)
---

# Stripe Integration

## Overview

Integração Stripe para SaaS. Consulta `stripe-doc.md` via Grep para exemplos de código.

**Princípio:** Nunca editar preço existente. Criar novo e manter clientes antigos no preço anterior (grandfathering).

## Database Schema

**Migration:** `libs/app-database/migrations/20250101001_create_initial_schema.js`

```
plans → plan_prices → subscriptions → payment_history
```

## Quick Reference

{"api":{"createPlan":"stripe.products.create()","createPrice":"stripe.prices.create()","deactivatePrice":"stripe.prices.update({active:false})","createSub":"stripe.subscriptions.create()","cancelSub":"stripe.subscriptions.cancel()"}}

## Consultando Documentação

```bash
Grep pattern="subscription" path="{{skill:add-stripe/stripe-doc.md}}"
Grep pattern="price" path="{{skill:add-stripe/stripe-doc.md}}"
```

## Fluxos Essenciais

### Criar Plano + Preço

```typescript
// 1. Product (plano)
const product = await stripe.products.create({
  name: 'Pro',
  metadata: { plan_code: 'pro' }
});

// 2. Price (valor)
const price = await stripe.prices.create({
  product: product.id,
  unit_amount: 9900, // R$ 99,00
  currency: 'brl',
  recurring: { interval: 'month' }
});

// 3. Salvar local
await db.insertInto('plans').values({ stripe_product_id: product.id, code: 'pro', name: 'Pro' });
await db.insertInto('plan_prices').values({ plan_id, stripe_price_id: price.id, amount: 9900, is_current: true });
```

### Reajustar Preço (Grandfathering)

```typescript
// 1. NOVO price (nunca editar)
const newPrice = await stripe.prices.create({
  product: productId,
  unit_amount: 11900,
  currency: 'brl',
  recurring: { interval: 'month' }
});

// 2. Desativar antigo para NOVAS assinaturas
await stripe.prices.update(oldPriceId, { active: false });

// 3. Atualizar local
await db.updateTable('plan_prices').set({ is_current: false }).where('stripe_price_id', '=', oldPriceId);
await db.insertInto('plan_prices').values({ plan_id, stripe_price_id: newPrice.id, amount: 11900, is_current: true });
// Clientes existentes MANTÊM preço antigo automaticamente!
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

{"mistakes":[{"err":"Editar price existente","fix":"Criar novo price, desativar antigo"},{"err":"Não validar webhook","fix":"Usar stripe.webhooks.constructEvent()"},{"err":"Confiar só na Stripe","fix":"Sincronizar via webhooks para banco local"}]}
