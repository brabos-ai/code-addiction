# Hero Sections

Seções de hero para landing pages SaaS. Mobile-first, copy-paste ready.

---

## 1. Centered Hero (Padrão)

O mais versátil. Título centralizado + CTA + screenshot abaixo.

```tsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play } from "lucide-react";

export function HeroCentered() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:14px_24px]" />

      <div className="relative container px-4 pt-20 pb-12 md:pt-32 md:pb-20">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Badge */}
          <Badge variant="outline" className="px-4 py-1.5 text-sm">
            <span className="mr-2">🚀</span>
            Novo: Integração com WhatsApp
          </Badge>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight max-w-4xl">
            Gerencie seu negócio{" "}
            <span className="text-primary">sem complicação</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
            Automatize processos, acompanhe métricas e escale sua operação.
            Tudo em uma plataforma simples que sua equipe vai adorar usar.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="text-lg px-8 h-12">
              Começar grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 h-12">
              <Play className="mr-2 h-5 w-5" />
              Ver demo
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>✓ Grátis por 14 dias</span>
            <span>✓ Sem cartão de crédito</span>
            <span>✓ Setup em 5 minutos</span>
          </div>
        </div>

        {/* Screenshot/Demo */}
        <div className="mt-12 md:mt-20 relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl blur-2xl" />
          <div className="relative rounded-xl border bg-background/50 backdrop-blur shadow-2xl overflow-hidden">
            <img
              src="/dashboard-screenshot.png"
              alt="Dashboard do produto"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
```

**Quando usar:** Produto visual (dashboard, app), quer mostrar screenshot.

---

## 2. Split Hero (Texto + Imagem)

Texto à esquerda, imagem/demo à direita. Bom para mostrar interface.

```tsx
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

export function HeroSplit() {
  return (
    <section className="min-h-screen flex items-center">
      <div className="container px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2" />
              Mais de 500 empresas já usam
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              O CRM que sua equipe{" "}
              <span className="text-primary">vai realmente usar</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg">
              Simplifique vendas, automatize follow-ups e feche mais negócios.
              Sem complexidade, sem treinamento extensivo.
            </p>

            {/* Feature list */}
            <ul className="space-y-3">
              {[
                "Pipeline visual drag-and-drop",
                "Automações sem código",
                "Relatórios em tempo real",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-lg px-8">
                Testar grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="ghost" className="text-lg">
                Falar com vendas
              </Button>
            </div>
          </div>

          {/* Right: Image/Demo */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-primary/10 rounded-2xl blur-3xl opacity-50" />
            <div className="relative rounded-2xl border shadow-2xl overflow-hidden">
              <img
                src="/app-screenshot.png"
                alt="Interface do CRM"
                className="w-full"
              />
            </div>

            {/* Floating stats card */}
            <div className="absolute -bottom-6 -left-6 bg-background border rounded-xl p-4 shadow-lg">
              <div className="text-2xl font-bold text-primary">+47%</div>
              <div className="text-sm text-muted-foreground">conversão em vendas</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

**Quando usar:** Quer destacar features com bullets, produto B2B.

---

## 3. Hero com Video Background

Impactante, bom para produtos visuais ou criativos.

```tsx
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function HeroVideo() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/hero-video.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative container px-4 text-center text-white">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl mx-auto">
          Transforme dados em decisões
        </h1>

        <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
          Analytics em tempo real para empresas que precisam agir rápido.
          Visualize, analise e decida com confiança.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="text-lg px-8 bg-white text-black hover:bg-white/90">
            Começar agora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8 border-white text-white hover:bg-white/10">
            Ver demonstração
          </Button>
        </div>
      </div>
    </section>
  );
}
```

**Quando usar:** Produto visual, quer causar impacto emocional.

---

## 4. Hero Minimalista

Clean, direto ao ponto. Bom para ferramentas developer ou B2B enterprise.

```tsx
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function HeroMinimal() {
  return (
    <section className="min-h-[80vh] flex items-center">
      <div className="container px-4 py-20">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            APIs de pagamento para desenvolvedores
          </h1>

          <p className="mt-6 text-lg md:text-xl text-muted-foreground">
            Integre pagamentos em minutos, não semanas.
            SDKs em 7 linguagens, documentação completa, suporte 24/7.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="text-lg">
              Ver documentação
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg">
              Criar conta
            </Button>
          </div>

          {/* Code snippet preview */}
          <div className="mt-12 rounded-lg bg-zinc-950 p-4 font-mono text-sm text-zinc-300 overflow-x-auto">
            <pre>{`curl -X POST https://api.exemplo.com/v1/payments \\
  -H "Authorization: Bearer sk_live_xxx" \\
  -d amount=1000 \\
  -d currency=brl`}</pre>
          </div>
        </div>
      </div>
    </section>
  );
}
```

**Quando usar:** Produto técnico, audience developer, API/infra.

---

## 5. Hero com Animated Gradient

Moderno, eye-catching. Estilo Stripe/Linear.

```tsx
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function HeroGradient() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-background to-cyan-500/20" />

      {/* Animated blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Content */}
      <div className="relative container px-4 text-center">
        <div className="inline-flex items-center rounded-full bg-muted px-4 py-1.5 text-sm mb-8">
          <span className="font-medium">Novo</span>
          <span className="mx-2 h-1 w-1 rounded-full bg-foreground" />
          <span className="text-muted-foreground">Lançamos integração com Slack</span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-5xl mx-auto bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">
          A próxima geração de{" "}
          <span className="bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent">
            colaboração em equipe
          </span>
        </h1>

        <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Projetos, documentos e comunicação em um só lugar.
          Feito para equipes que movem rápido e pensam grande.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600">
            Começar grátis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8">
            Agendar demo
          </Button>
        </div>

        {/* Logos */}
        <div className="mt-16">
          <p className="text-sm text-muted-foreground mb-6">
            Confiado por empresas inovadoras
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {/* Placeholder logos */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 w-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
```

**Quando usar:** Produto moderno, quer parecer inovador, audience jovem/tech.

---

## Variações Rápidas

### Badge Styles
```tsx
// Announcement
<Badge variant="outline" className="gap-2">
  <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
  Novidade
</Badge>

// Product Hunt
<Badge className="bg-[#ff6154] hover:bg-[#ff6154]/90">
  #1 no Product Hunt
</Badge>

// Version
<Badge variant="secondary">v2.0 disponível</Badge>
```

### CTA Variations
```tsx
// Primary + Ghost
<div className="flex gap-4">
  <Button size="lg">Começar grátis</Button>
  <Button size="lg" variant="ghost">Saiba mais →</Button>
</div>

// With subtext
<div className="text-center">
  <Button size="lg" className="mb-2">Criar conta</Button>
  <p className="text-sm text-muted-foreground">
    Grátis para sempre. Sem cartão.
  </p>
</div>

// Email capture
<div className="flex gap-2 max-w-md mx-auto">
  <Input placeholder="seu@email.com" className="flex-1" />
  <Button>Começar</Button>
</div>
```

### Trust Signals
```tsx
// Inline badges
<div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
  <span className="flex items-center gap-1">
    <Shield className="h-4 w-4" /> SOC 2
  </span>
  <span className="flex items-center gap-1">
    <Users className="h-4 w-4" /> 10k+ usuários
  </span>
  <span className="flex items-center gap-1">
    <Star className="h-4 w-4" /> 4.9 no G2
  </span>
</div>

// Avatar stack
<div className="flex items-center gap-3">
  <div className="flex -space-x-2">
    {avatars.map((a, i) => (
      <img key={i} src={a} className="h-8 w-8 rounded-full border-2 border-background" />
    ))}
  </div>
  <span className="text-sm text-muted-foreground">
    +2.000 empresas já usam
  </span>
</div>
```
