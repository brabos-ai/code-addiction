# Pricing Sections

Tabelas de preço que convertem. Mobile-first, copy-paste ready.

---

## 1. 3-Tier Cards (Padrão SaaS)

O layout mais comum e eficaz. Plano do meio destacado.

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    description: "Para começar",
    price: { monthly: 0, yearly: 0 },
    features: [
      "Até 3 usuários",
      "1 workspace",
      "1.000 registros/mês",
      "Integrações básicas",
      "Suporte por email",
    ],
    cta: "Começar grátis",
    highlighted: false,
  },
  {
    name: "Pro",
    description: "Para equipes em crescimento",
    price: { monthly: 97, yearly: 79 },
    features: [
      "Até 10 usuários",
      "Workspaces ilimitados",
      "50.000 registros/mês",
      "Todas integrações",
      "Automações avançadas",
      "Relatórios customizados",
      "Suporte prioritário",
    ],
    cta: "Testar 14 dias grátis",
    highlighted: true,
  },
  {
    name: "Enterprise",
    description: "Para grandes operações",
    price: { monthly: null, yearly: null },
    features: [
      "Usuários ilimitados",
      "Volume ilimitado",
      "SSO/SAML",
      "API dedicada",
      "SLA 99.9%",
      "Gerente de sucesso",
      "Onboarding dedicado",
    ],
    cta: "Falar com vendas",
    highlighted: false,
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section className="container px-4 py-16 md:py-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">
          Preços simples e transparentes
        </h2>
        <p className="mt-4 text-muted-foreground">
          Comece grátis, escale quando precisar
        </p>

        {/* Toggle mensal/anual */}
        <div className="mt-8 inline-flex items-center gap-4 rounded-full border p-1">
          <button
            onClick={() => setAnnual(false)}
            className={cn(
              "px-4 py-2 rounded-full text-sm transition-colors",
              !annual ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            Mensal
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={cn(
              "px-4 py-2 rounded-full text-sm transition-colors",
              annual ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            Anual
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
                Mais popular
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
                  <div className="text-3xl font-bold">Personalizado</div>
                ) : plan.price.monthly === 0 ? (
                  <div className="text-4xl font-bold">Grátis</div>
                ) : (
                  <>
                    <span className="text-4xl font-bold">
                      R${annual ? plan.price.yearly : plan.price.monthly}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                    {annual && plan.price.yearly > 0 && (
                      <p className="text-sm text-muted-foreground">
                        cobrado anualmente
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

**Quando usar:** Padrão para qualquer SaaS. Funciona sempre.

---

## 2. Comparison Table (Feature Matrix)

Tabela comparativa detalhada. Bom quando tem muitas features por plano.

```tsx
import { Button } from "@/components/ui/button";
import { Check, Minus } from "lucide-react";

const features = [
  {
    category: "Recursos básicos",
    items: [
      { name: "Usuários", starter: "3", pro: "10", enterprise: "Ilimitado" },
      { name: "Workspaces", starter: "1", pro: "Ilimitado", enterprise: "Ilimitado" },
      { name: "Armazenamento", starter: "1 GB", pro: "10 GB", enterprise: "Ilimitado" },
    ],
  },
  {
    category: "Automações",
    items: [
      { name: "Fluxos de trabalho", starter: false, pro: true, enterprise: true },
      { name: "Triggers customizados", starter: false, pro: true, enterprise: true },
      { name: "Webhooks", starter: false, pro: "10/mês", enterprise: "Ilimitado" },
    ],
  },
  {
    category: "Integrações",
    items: [
      { name: "Slack/Teams", starter: true, pro: true, enterprise: true },
      { name: "Zapier", starter: false, pro: true, enterprise: true },
      { name: "API REST", starter: false, pro: true, enterprise: true },
      { name: "SSO/SAML", starter: false, pro: false, enterprise: true },
    ],
  },
  {
    category: "Suporte",
    items: [
      { name: "Documentação", starter: true, pro: true, enterprise: true },
      { name: "Email", starter: true, pro: true, enterprise: true },
      { name: "Chat ao vivo", starter: false, pro: true, enterprise: true },
      { name: "Gerente dedicado", starter: false, pro: false, enterprise: true },
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
        <h2 className="text-3xl md:text-4xl font-bold">Compare os planos</h2>
        <p className="mt-4 text-muted-foreground">
          Encontre o plano ideal para sua necessidade
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
                <div className="text-2xl font-bold mt-2">Grátis</div>
                <Button variant="outline" className="mt-4 w-full">
                  Começar
                </Button>
              </th>
              <th className="px-4 py-4 text-center bg-primary/5 rounded-t-lg">
                <div className="font-bold text-primary">Pro</div>
                <div className="text-2xl font-bold mt-2">R$97/mês</div>
                <Button className="mt-4 w-full">Testar grátis</Button>
              </th>
              <th className="px-4 py-4 text-center">
                <div className="font-bold">Enterprise</div>
                <div className="text-2xl font-bold mt-2">Sob consulta</div>
                <Button variant="outline" className="mt-4 w-full">
                  Falar com vendas
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

**Quando usar:** Muitas features, decisão complexa, B2B enterprise.

---

## 3. Simple Pricing (Single Tier)

Para produtos simples ou quando quer destacar um único plano.

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
            <h2 className="text-2xl font-bold">Tudo que você precisa</h2>
            <p className="text-muted-foreground">Um preço, sem surpresas</p>
          </CardHeader>

          <CardContent className="text-center">
            <div className="mb-8">
              <span className="text-5xl font-bold">R$47</span>
              <span className="text-muted-foreground">/mês por usuário</span>
            </div>

            <ul className="space-y-4 text-left max-w-sm mx-auto">
              {[
                "Usuários ilimitados",
                "Todas as features",
                "Integrações incluídas",
                "Suporte prioritário",
                "Atualizações gratuitas",
                "Sem limite de uso",
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
              Começar agora
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              14 dias grátis. Cancele quando quiser.
            </p>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
```

**Quando usar:** Produto simples, um único tier, early stage.

---

## 4. Horizontal Pricing (Compact)

Layout compacto horizontal. Bom para seções menores ou como "sticky".

```tsx
import { Button } from "@/components/ui/button";

export function PricingHorizontal() {
  return (
    <section className="container px-4 py-16">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 rounded-2xl bg-muted/50 border">
        <div>
          <h2 className="text-2xl font-bold">Pronto para começar?</h2>
          <p className="text-muted-foreground mt-1">
            Teste grátis por 14 dias, sem cartão de crédito
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="text-center sm:text-right">
            <div className="text-sm text-muted-foreground">A partir de</div>
            <div className="text-3xl font-bold">
              R$97<span className="text-lg font-normal">/mês</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">Ver planos</Button>
            <Button>Começar grátis</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
```

**Quando usar:** CTA section, sticky footer, reminder.

---

## Pricing FAQ

Sempre inclua FAQ abaixo do pricing. Reduz objeções.

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Posso cancelar a qualquer momento?",
    answer:
      "Sim, você pode cancelar sua assinatura a qualquer momento. Não há contratos de longo prazo ou taxas de cancelamento.",
  },
  {
    question: "Como funciona o período de teste?",
    answer:
      "Você tem 14 dias para testar todas as funcionalidades do plano Pro gratuitamente. Não pedimos cartão de crédito para começar.",
  },
  {
    question: "Posso mudar de plano depois?",
    answer:
      "Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. A diferença é calculada proporcionalmente.",
  },
  {
    question: "Qual a forma de pagamento?",
    answer:
      "Aceitamos cartão de crédito (Visa, Mastercard, Amex), PIX e boleto bancário para planos anuais.",
  },
  {
    question: "Vocês oferecem desconto para startups?",
    answer:
      "Sim! Startups early-stage podem se candidatar ao nosso programa com 50% de desconto no primeiro ano. Entre em contato.",
  },
];

export function PricingFAQ() {
  return (
    <section className="container px-4 py-16 md:py-24">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">
          Perguntas frequentes
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

## Elementos de Conversão

### Garantia
```tsx
<div className="text-center mt-8 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
  <p className="text-sm">
    <span className="font-semibold text-green-600">Garantia de 30 dias</span>
    {" "}— Não gostou? Devolvemos seu dinheiro, sem perguntas.
  </p>
</div>
```

### Urgência (use com moderação)
```tsx
<div className="text-center">
  <Badge variant="destructive" className="mb-4">
    Oferta termina em 3 dias
  </Badge>
  <div className="text-sm text-muted-foreground">
    <span className="line-through">R$197</span>
    <span className="text-2xl font-bold text-primary ml-2">R$97</span>
  </div>
</div>
```

### Trust signals
```tsx
<div className="flex justify-center gap-8 mt-8 text-sm text-muted-foreground">
  <span className="flex items-center gap-2">
    <CreditCard className="h-4 w-4" /> Pagamento seguro
  </span>
  <span className="flex items-center gap-2">
    <Shield className="h-4 w-4" /> LGPD compliant
  </span>
  <span className="flex items-center gap-2">
    <RefreshCw className="h-4 w-4" /> Cancele quando quiser
  </span>
</div>
```
