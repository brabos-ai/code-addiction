# Feature Sections

Feature sections for SaaS landing pages. Show the value of your product.

---

## 1. Bento Grid (Apple/Linear Style)

Asymmetric layout with varied card sizes. Modern and visual.

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Zap,
  Shield,
  BarChart3,
  Users,
  Globe,
  Smartphone,
} from "lucide-react";

export function FeaturesBento() {
  return (
    <section className="container px-4 py-16 md:py-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">
          Everything you need to scale
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Features designed for companies that want to grow without complexity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Large card - featured */}
        <Card className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
          <CardHeader>
            <Zap className="h-10 w-10 text-primary mb-4" />
            <CardTitle className="text-2xl">Smart automations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Build workflows that save hours every week.
              No code, no complexity.
            </p>
            <div className="rounded-lg bg-muted/50 p-4">
              <img
                src="/automation-preview.png"
                alt="Automation preview"
                className="rounded"
              />
            </div>
          </CardContent>
        </Card>

        {/* Small cards */}
        <Card className="group hover:border-primary/50 transition-colors">
          <CardHeader>
            <Shield className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
            <CardTitle>Enterprise security</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              SOC 2, GDPR, end-to-end encryption.
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:border-primary/50 transition-colors">
          <CardHeader>
            <BarChart3 className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
            <CardTitle>Real-time analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Customizable dashboards and automated reports.
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:border-primary/50 transition-colors">
          <CardHeader>
            <Users className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
            <CardTitle>Collaboration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Work as a team with granular permissions.
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:border-primary/50 transition-colors">
          <CardHeader>
            <Globe className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
            <CardTitle>Full API</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Integrate with any system via REST or webhooks.
            </p>
          </CardContent>
        </Card>

        {/* Wide card */}
        <Card className="md:col-span-2 bg-muted/50">
          <CardHeader className="flex-row items-center gap-4">
            <Smartphone className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Native mobile apps</CardTitle>
              <p className="text-sm text-muted-foreground">
                iOS and Android with real-time sync
              </p>
            </div>
          </CardHeader>
        </Card>
      </div>
    </section>
  );
}
```

**When to use:** Many features, want a modern visual, one main feature.

---

## 2. Feature Grid (Classic)

Simple, organized grid. Works for any type of SaaS.

```tsx
import { Zap, Shield, BarChart3, Users, Globe, Clock } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Fast to set up",
    description: "Setup in less than 5 minutes. Import data from anywhere.",
  },
  {
    icon: Shield,
    title: "Secure by default",
    description: "Encryption, automatic backups and GDPR compliance.",
  },
  {
    icon: BarChart3,
    title: "Detailed reports",
    description: "Metrics that matter, updated in real time.",
  },
  {
    icon: Users,
    title: "Team collaboration",
    description: "Invite your team with custom permissions.",
  },
  {
    icon: Globe,
    title: "Integrations",
    description: "Connect with Slack, Zapier, Google and 50+ apps.",
  },
  {
    icon: Clock,
    title: "24/7 support",
    description: "Team ready to help whenever you need.",
  },
];

export function FeaturesGrid() {
  return (
    <section className="container px-4 py-16 md:py-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">
          Why choose us?
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Simple to use, genuinely powerful.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature) => (
          <div key={feature.title} className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg">{feature.title}</h3>
              <p className="mt-1 text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

**When to use:** Balanced features, no specific highlight, classic B2B.

---

## 3. Feature Showcase (Alternating)

One feature per block, alternating text/image. Good for explaining in detail.

```tsx
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const showcases = [
  {
    title: "Visual sales pipeline",
    description:
      "Drag and drop deals between stages. See your sales funnel in real time and never miss a follow-up.",
    features: [
      "Customizable Kanban",
      "Follow-up automation",
      "Revenue forecasting",
    ],
    image: "/feature-pipeline.png",
    cta: "See how it works",
  },
  {
    title: "Reports that make sense",
    description:
      "Ready-to-use dashboards. Sales metrics, team performance and forecasts — all in one place.",
    features: [
      "Ready-made templates",
      "Advanced filters",
      "Export to PDF/Excel",
    ],
    image: "/feature-reports.png",
    cta: "Explore reports",
  },
  {
    title: "Native integrations",
    description:
      "Connect your favorite tools in clicks. WhatsApp, email, calendar and 50+ integrations.",
    features: [
      "Two-way sync",
      "Custom webhooks",
      "Full REST API",
    ],
    image: "/feature-integrations.png",
    cta: "View integrations",
  },
];

export function FeaturesShowcase() {
  return (
    <section className="py-16 md:py-24">
      {showcases.map((item, index) => (
        <div
          key={item.title}
          className={`container px-4 py-12 md:py-20 ${
            index % 2 === 1 ? "bg-muted/30" : ""
          }`}
        >
          <div
            className={`grid lg:grid-cols-2 gap-12 items-center ${
              index % 2 === 1 ? "lg:flex-row-reverse" : ""
            }`}
          >
            {/* Text */}
            <div className={index % 2 === 1 ? "lg:order-2" : ""}>
              <h2 className="text-3xl md:text-4xl font-bold">{item.title}</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {item.description}
              </p>
              <ul className="mt-6 space-y-3">
                {item.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-8" variant="outline">
                {item.cta}
              </Button>
            </div>

            {/* Image */}
            <div className={index % 2 === 1 ? "lg:order-1" : ""}>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl blur-2xl" />
                <img
                  src={item.image}
                  alt={item.title}
                  className="relative rounded-xl border shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
```

**Quando usar:** Poucas features principais, quer explicar cada uma em detalhes.

---

## 4. Feature Cards com Hover

Cards interativos com preview on hover. Moderno e engajante.

```tsx
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Zap, Shield, BarChart3, Users } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Automações",
    description: "Fluxos de trabalho que economizam horas",
    preview: "/preview-automations.png",
    color: "from-yellow-500/20",
  },
  {
    icon: Shield,
    title: "Segurança",
    description: "Enterprise-grade, LGPD compliant",
    preview: "/preview-security.png",
    color: "from-green-500/20",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Métricas em tempo real",
    preview: "/preview-analytics.png",
    color: "from-blue-500/20",
  },
  {
    icon: Users,
    title: "Colaboração",
    description: "Trabalhe em equipe sem fricção",
    preview: "/preview-collab.png",
    color: "from-purple-500/20",
  },
];

export function FeaturesHover() {
  return (
    <section className="container px-4 py-16 md:py-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">Recursos poderosos</h2>
        <p className="mt-4 text-muted-foreground">
          Passe o mouse para ver em ação
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature) => (
          <motion.div
            key={feature.title}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="group relative overflow-hidden h-64 cursor-pointer">
              {/* Background gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.color} to-transparent opacity-50`}
              />

              {/* Content - visible by default */}
              <CardContent className="relative h-full flex flex-col justify-end p-6 transition-opacity group-hover:opacity-0">
                <feature.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>

              {/* Preview - visible on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <img
                  src={feature.preview}
                  alt={feature.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
```

**Quando usar:** Produto visual, quer mostrar previews, audience tech-savvy.

---

## 5. Features Timeline (Processo)

Mostra features como etapas de um processo. Bom para onboarding/workflow.

```tsx
import { CheckCircle } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Conecte suas fontes",
    description:
      "Importe dados de planilhas, CRMs ou conecte via API em segundos.",
  },
  {
    step: "02",
    title: "Configure automações",
    description:
      "Use nossos templates prontos ou crie fluxos customizados sem código.",
  },
  {
    step: "03",
    title: "Monitore resultados",
    description:
      "Acompanhe métricas em dashboards atualizados em tempo real.",
  },
  {
    step: "04",
    title: "Escale sem limites",
    description: "Convide sua equipe e cresça sem se preocupar com infraestrutura.",
  },
];

export function FeaturesTimeline() {
  return (
    <section className="container px-4 py-16 md:py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold">Como funciona</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Do zero ao resultado em 4 passos simples
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        {steps.map((item, index) => (
          <div key={item.step} className="relative pl-8 pb-12 last:pb-0">
            {/* Line */}
            {index < steps.length - 1 && (
              <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
            )}

            {/* Dot */}
            <div className="absolute left-0 top-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              {item.step}
            </div>

            {/* Content */}
            <div className="ml-6">
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-muted-foreground">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

**Quando usar:** Explicar processo, onboarding, "how it works".

---

## Integrações Section

Mostre com quem você integra. Essencial para SaaS B2B.

```tsx
const integrations = [
  { name: "Slack", logo: "/logos/slack.svg" },
  { name: "Google", logo: "/logos/google.svg" },
  { name: "Salesforce", logo: "/logos/salesforce.svg" },
  { name: "HubSpot", logo: "/logos/hubspot.svg" },
  { name: "Zapier", logo: "/logos/zapier.svg" },
  { name: "WhatsApp", logo: "/logos/whatsapp.svg" },
];

export function Integrations() {
  return (
    <section className="container px-4 py-16 md:py-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">
          Integra com suas ferramentas favoritas
        </h2>
        <p className="mt-4 text-muted-foreground">
          +50 integrações nativas. Ou crie a sua via API.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
        {integrations.map((item) => (
          <div
            key={item.name}
            className="flex flex-col items-center gap-3 p-6 rounded-lg border bg-card hover:border-primary/50 transition-colors"
          >
            <img
              src={item.logo}
              alt={item.name}
              className="h-12 w-12 object-contain"
            />
            <span className="text-sm font-medium">{item.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
```
