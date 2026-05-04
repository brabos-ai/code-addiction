# Pricing Sections

Pricing tables that convert. Mobile-first, copy-paste ready.

---

## 1. 3-Tier Cards (SaaS Default)

The most common and effective layout. Middle plan highlighted.

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    description: "To get started",
    price: { monthly: 0, yearly: 0 },
    features: [
      "Up to 3 users",
      "1 workspace",
      "1,000 records/month",
      "Basic integrations",
      "Email support",
    ],
    cta: "Start for free",
    highlighted: false,
  },
  {
    name: "Pro",
    description: "For growing teams",
    price: { monthly: 97, yearly: 79 },
    features: [
      "Up to 10 users",
      "Unlimited workspaces",
      "50,000 records/month",
      "All integrations",
      "Advanced automations",
      "Custom reports",
      "Priority support",
    ],
    cta: "Try free for 14 days",
    highlighted: true,
  },
  {
    name: "Enterprise",
    description: "For large operations",
    price: { monthly: null, yearly: null },
    features: [
      "Unlimited users",
      "Unlimited volume",
      "SSO/SAML",
      "Dedicated API",
      "99.9% SLA",
      "Success manager",
      "Dedicated onboarding",
    ],
    cta: "Talk to sales",
    highlighted: false,
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section className="container px-4 py-16 md:py-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">
          Simple and transparent pricing
        </h2>
        <p className="mt-4 text-muted-foreground">
          Start free, scale when you need
        </p>

        {/* Monthly/annual toggle */}
        <div className="mt-8 inline-flex items-center gap-4 rounded-full border p-1">
          <button
            onClick={() => setAnnual(false)}
            className={cn(
              "px-4 py-2 rounded-full text-sm transition-colors",
              !annual ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={cn(
              "px-4 py-2 rounded-full text-sm transition-colors",
              annual ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            Annual
            <Badge variant="secondary" className="ml-2">
              -20%
            </Badge>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "relative flex flex-col",
              plan.highlighted && "border-primary shadow-lg scale-105"
            )}
          >
            {plan.highlighted && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Most popular
              </Badge>
            )}

            <CardHeader>
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </CardHeader>

            <CardContent className="flex-1">
              {/* Price */}
              <div className="mb-6">
                {plan.price.monthly === null ? (
                  <div className="text-3xl font-bold">Custom</div>
                ) : plan.price.monthly === 0 ? (
                  <div className="text-4xl font-bold">Free</div>
                ) : (
                  <>
                    <span className="text-4xl font-bold">
                      ${annual ? plan.price.yearly : plan.price.monthly}
                    </span>
                    <span className="text-muted-foreground">/mo</span>
                    {annual && plan.price.yearly > 0 && (
                      <p className="text-sm text-muted-foreground">
                        billed annually
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                variant={plan.highlighted ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
```

**When to use:** Default for any SaaS. Always works.

---

## 2. Comparison Table (Feature Matrix)

Detailed comparison table. Good when there are many features per plan.

```tsx
import { Button } from "@/components/ui/button";
import { Check, Minus } from "lucide-react";

const features = [
  {
    category: "Core features",
    items: [
      { name: "Users", starter: "3", pro: "10", enterprise: "Unlimited" },
      { name: "Workspaces", starter: "1", pro: "Unlimited", enterprise: "Unlimited" },
      { name: "Storage", starter: "1 GB", pro: "10 GB", enterprise: "Unlimited" },
    ],
  },
  {
    category: "Automations",
    items: [
      { name: "Workflows", starter: false, pro: true, enterprise: true },
      { name: "Custom triggers", starter: false, pro: true, enterprise: true },
      { name: "Webhooks", starter: false, pro: "10/mo", enterprise: "Unlimited" },
    ],
  },
  {
    category: "Integrations",
    items: [
      { name: "Slack/Teams", starter: true, pro: true, enterprise: true },
      { name: "Zapier", starter: false, pro: true, enterprise: true },
      { name: "REST API", starter: false, pro: true, enterprise: true },
      { name: "SSO/SAML", starter: false, pro: false, enterprise: true },
    ],
  },
  {
    category: "Support",
    items: [
      { name: "Documentation", starter: true, pro: true, enterprise: true },
      { name: "Email", starter: true, pro: true, enterprise: true },
      { name: "Live chat", starter: false, pro: true, enterprise: true },
      { name: "Dedicated manager", starter: false, pro: false, enterprise: true },
      { name: "SLA", starter: false, pro: "99%", enterprise: "99.9%" },
    ],
  },
];

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="h-5 w-5 text-primary mx-auto" />
    ) : (
      <Minus className="h-5 w-5 text-muted-foreground mx-auto" />
    );
  }
  return <span className="text-sm">{value}</span>;
}

export function PricingComparison() {
  return (
    <section className="container px-4 py-16 md:py-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">Compare plans</h2>
        <p className="mt-4 text-muted-foreground">
          Find the right plan for your needs
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          {/* Header */}
          <thead>
            <tr className="border-b">
              <th className="text-left py-4 pr-4"></th>
              <th className="px-4 py-4 text-center">
                <div className="font-bold">Starter</div>
                <div className="text-2xl font-bold mt-2">Free</div>
                <Button variant="outline" className="mt-4 w-full">
                  Get started
                </Button>
              </th>
              <th className="px-4 py-4 text-center bg-primary/5 rounded-t-lg">
                <div className="font-bold text-primary">Pro</div>
                <div className="text-2xl font-bold mt-2">$97/mo</div>
                <Button className="mt-4 w-full">Try for free</Button>
              </th>
              <th className="px-4 py-4 text-center">
                <div className="font-bold">Enterprise</div>
                <div className="text-2xl font-bold mt-2">Custom</div>
                <Button variant="outline" className="mt-4 w-full">
                  Talk to sales
                </Button>
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {features.map((category) => (
              <>
                <tr key={category.category} className="bg-muted/30">
                  <td
                    colSpan={4}
                    className="py-3 px-4 font-semibold text-sm text-muted-foreground"
                  >
                    {category.category}
                  </td>
                </tr>
                {category.items.map((item) => (
                  <tr key={item.name} className="border-b">
                    <td className="py-3 pr-4 text-sm">{item.name}</td>
                    <td className="px-4 py-3 text-center">
                      <FeatureValue value={item.starter} />
                    </td>
                    <td className="px-4 py-3 text-center bg-primary/5">
                      <FeatureValue value={item.pro} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <FeatureValue value={item.enterprise} />
                    </td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

**When to use:** Many features, complex decision, B2B enterprise.

---

## 3. Simple Pricing (Single Tier)

For simple products or when you want to highlight a single plan.

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Check } from "lucide-react";

export function PricingSimple() {
  return (
    <section className="container px-4 py-16 md:py-24">
      <div className="max-w-xl mx-auto">
        <Card className="relative overflow-hidden">
          {/* Background accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary to-primary/50" />

          <CardHeader className="text-center pt-8">
            <h2 className="text-2xl font-bold">Everything you need</h2>
            <p className="text-muted-foreground">One price, no surprises</p>
          </CardHeader>

          <CardContent className="text-center">
            <div className="mb-8">
              <span className="text-5xl font-bold">$47</span>
              <span className="text-muted-foreground">/mo per user</span>
            </div>

            <ul className="space-y-4 text-left max-w-sm mx-auto">
              {[
                "Unlimited users",
                "All features",
                "Integrations included",
                "Priority support",
                "Free updates",
                "No usage limits",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button size="lg" className="w-full">
              Get started now
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              14 days free. Cancel anytime.
            </p>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
```

**When to use:** Simple product, single tier, early stage.

---

## 4. Horizontal Pricing (Compact)

Compact horizontal layout. Good for smaller sections or as a "sticky".

```tsx
import { Button } from "@/components/ui/button";

export function PricingHorizontal() {
  return (
    <section className="container px-4 py-16">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 rounded-2xl bg-muted/50 border">
        <div>
          <h2 className="text-2xl font-bold">Ready to get started?</h2>
          <p className="text-muted-foreground mt-1">
            Free trial for 14 days, no credit card required
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="text-center sm:text-right">
            <div className="text-sm text-muted-foreground">Starting from</div>
            <div className="text-3xl font-bold">
              $97<span className="text-lg font-normal">/mo</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">View plans</Button>
            <Button>Start for free</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
```

**When to use:** CTA section, sticky footer, reminder.

---

## Pricing FAQ

Always include a FAQ below pricing. Reduces objections.

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Can I cancel at any time?",
    answer:
      "Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees.",
  },
  {
    question: "How does the trial period work?",
    answer:
      "You have 14 days to try all Pro plan features for free. We don't ask for a credit card to get started.",
  },
  {
    question: "Can I change plans later?",
    answer:
      "Yes! You can upgrade or downgrade your plan at any time. The difference is calculated proportionally.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept credit cards (Visa, Mastercard, Amex) and bank transfers for annual plans.",
  },
  {
    question: "Do you offer discounts for startups?",
    answer:
      "Yes! Early-stage startups can apply to our program with 50% off the first year. Get in touch.",
  },
];

export function PricingFAQ() {
  return (
    <section className="container px-4 py-16 md:py-24">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">
          Frequently asked questions
        </h2>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
```

---

## Conversion Elements

### Guarantee
```tsx
<div className="text-center mt-8 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
  <p className="text-sm">
    <span className="font-semibold text-green-600">30-day guarantee</span>
    {" "}— Not satisfied? We'll refund you, no questions asked.
  </p>
</div>
```

### Urgency (use sparingly)
```tsx
<div className="text-center">
  <Badge variant="destructive" className="mb-4">
    Offer ends in 3 days
  </Badge>
  <div className="text-sm text-muted-foreground">
    <span className="line-through">$197</span>
    <span className="text-2xl font-bold text-primary ml-2">$97</span>
  </div>
</div>
```

### Trust signals
```tsx
<div className="flex justify-center gap-8 mt-8 text-sm text-muted-foreground">
  <span className="flex items-center gap-2">
    <CreditCard className="h-4 w-4" /> Secure payment
  </span>
  <span className="flex items-center gap-2">
    <Shield className="h-4 w-4" /> GDPR compliant
  </span>
  <span className="flex items-center gap-2">
    <RefreshCw className="h-4 w-4" /> Cancel anytime
  </span>
</div>
```
