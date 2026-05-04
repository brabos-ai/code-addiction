# Hero Sections

Hero sections for SaaS landing pages. Mobile-first, copy-paste ready.

---

## 1. Centered Hero (Default)

The most versatile. Centered headline + CTA + screenshot below.

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
            New: WhatsApp Integration
          </Badge>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight max-w-4xl">
            Manage your business{" "}
            <span className="text-primary">without the complexity</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
            Automate processes, track metrics and scale your operation.
            All in a simple platform your team will love using.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="text-lg px-8 h-12">
              Start for free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 h-12">
              <Play className="mr-2 h-5 w-5" />
              See demo
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>✓ Free for 14 days</span>
            <span>✓ No credit card</span>
            <span>✓ Setup in 5 minutes</span>
          </div>
        </div>

        {/* Screenshot/Demo */}
        <div className="mt-12 md:mt-20 relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl blur-2xl" />
          <div className="relative rounded-xl border bg-background/50 backdrop-blur shadow-2xl overflow-hidden">
            <img
              src="/dashboard-screenshot.png"
              alt="Product dashboard"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
```

**When to use:** Visual product (dashboard, app), want to show screenshot.

---

## 2. Split Hero (Text + Image)

Text on the left, image/demo on the right. Good for showing the interface.

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
              More than 500 companies already use it
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              The CRM your team{" "}
              <span className="text-primary">will actually use</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg">
              Simplify sales, automate follow-ups and close more deals.
              Without complexity, without extensive training.
            </p>

            {/* Feature list */}
            <ul className="space-y-3">
              {[
                "Visual drag-and-drop pipeline",
                "No-code automations",
                "Real-time reports",
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
                Try for free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="ghost" className="text-lg">
                Talk to sales
              </Button>
            </div>
          </div>

          {/* Right: Image/Demo */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-primary/10 rounded-2xl blur-3xl opacity-50" />
            <div className="relative rounded-2xl border shadow-2xl overflow-hidden">
              <img
                src="/app-screenshot.png"
                alt="CRM interface"
                className="w-full"
              />
            </div>

            {/* Floating stats card */}
            <div className="absolute -bottom-6 -left-6 bg-background border rounded-xl p-4 shadow-lg">
              <div className="text-2xl font-bold text-primary">+47%</div>
              <div className="text-sm text-muted-foreground">sales conversion</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

**When to use:** Want to highlight features with bullets, B2B product.

---

## 3. Hero with Video Background

Impactful, good for visual or creative products.

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
          Turn data into decisions
        </h1>

        <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
          Real-time analytics for companies that need to act fast.
          Visualize, analyze and decide with confidence.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="text-lg px-8 bg-white text-black hover:bg-white/90">
            Get started now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8 border-white text-white hover:bg-white/10">
            See a demo
          </Button>
        </div>
      </div>
    </section>
  );
}
```

**When to use:** Visual product, want to create emotional impact.

---

## 4. Minimalist Hero

Clean, straight to the point. Good for developer tools or B2B enterprise.

```tsx
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function HeroMinimal() {
  return (
    <section className="min-h-[80vh] flex items-center">
      <div className="container px-4 py-20">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Payment APIs for developers
          </h1>

          <p className="mt-6 text-lg md:text-xl text-muted-foreground">
            Integrate payments in minutes, not weeks.
            SDKs in 7 languages, complete documentation, 24/7 support.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="text-lg">
              View documentation
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg">
              Create account
            </Button>
          </div>

          {/* Code snippet preview */}
          <div className="mt-12 rounded-lg bg-zinc-950 p-4 font-mono text-sm text-zinc-300 overflow-x-auto">
            <pre>{`curl -X POST https://api.example.com/v1/payments \\
  -H "Authorization: Bearer sk_live_xxx" \\
  -d amount=1000 \\
  -d currency=usd`}</pre>
          </div>
        </div>
      </div>
    </section>
  );
}
```

**When to use:** Technical product, developer audience, API/infra.

---

## 5. Hero with Animated Gradient

Modern, eye-catching. Stripe/Linear style.

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
          <span className="font-medium">New</span>
          <span className="mx-2 h-1 w-1 rounded-full bg-foreground" />
          <span className="text-muted-foreground">We just launched Slack integration</span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-5xl mx-auto bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">
          The next generation of{" "}
          <span className="bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent">
            team collaboration
          </span>
        </h1>

        <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Projects, documents and communication in one place.
          Built for teams that move fast and think big.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600">
            Start for free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8">
            Schedule a demo
          </Button>
        </div>

        {/* Logos */}
        <div className="mt-16">
          <p className="text-sm text-muted-foreground mb-6">
            Trusted by innovative companies
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

**When to use:** Modern product, want to appear innovative, young/tech audience.

---

## Quick Variations

### Badge Styles
```tsx
// Announcement
<Badge variant="outline" className="gap-2">
  <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
  New
</Badge>

// Product Hunt
<Badge className="bg-[#ff6154] hover:bg-[#ff6154]/90">
  #1 on Product Hunt
</Badge>

// Version
<Badge variant="secondary">v2.0 available</Badge>
```

### CTA Variations
```tsx
// Primary + Ghost
<div className="flex gap-4">
  <Button size="lg">Start for free</Button>
  <Button size="lg" variant="ghost">Learn more →</Button>
</div>

// With subtext
<div className="text-center">
  <Button size="lg" className="mb-2">Create account</Button>
  <p className="text-sm text-muted-foreground">
    Free forever. No card needed.
  </p>
</div>

// Email capture
<div className="flex gap-2 max-w-md mx-auto">
  <Input placeholder="you@email.com" className="flex-1" />
  <Button>Get started</Button>
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
    <Users className="h-4 w-4" /> 10k+ users
  </span>
  <span className="flex items-center gap-1">
    <Star className="h-4 w-4" /> 4.9 on G2
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
    +2,000 companies already use it
  </span>
</div>
```
