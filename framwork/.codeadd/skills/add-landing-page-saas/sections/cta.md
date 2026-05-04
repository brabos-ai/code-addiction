# CTA Sections

Final call-to-action. The last chance to convert.

---

## 1. Simple CTA (Default)

Straight to the point. Always works.

```tsx
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASimple() {
  return (
    <section className="container px-4 py-16 md:py-24">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold">
          Ready to transform your operation?
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Start free today. No credit card, no commitment.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="text-lg px-8">
            Start for free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8">
            Schedule a demo
          </Button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          ✓ 14 days free ✓ Setup in 5 minutes ✓ Cancel anytime
        </p>
      </div>
    </section>
  );
}
```

**When to use:** Always works. Safe default.

---

## 2. CTA with Gradient Background

More impactful. Stands out from the rest of the page.

```tsx
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTAGradient() {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative container px-4 py-16 md:py-24 text-center text-primary-foreground">
        <h2 className="text-3xl md:text-4xl font-bold">
          Join +2,000 companies
        </h2>
        <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
          Start automating your processes today and save hours every week.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-8 bg-white text-primary hover:bg-white/90"
          >
            Start for free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-lg px-8 border-white text-white hover:bg-white/10"
          >
            See demo
          </Button>
        </div>
      </div>
    </section>
  );
}
```

**When to use:** Want a strong highlight, impactful final section.

---

## 3. CTA with Email Capture

Captures email directly. Good for lead generation.

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

export function CTAEmailCapture() {
  return (
    <section className="container px-4 py-16 md:py-24">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold">
          Start for free now
        </h2>
        <p className="mt-4 text-muted-foreground">
          Enter your email and create your account in seconds
        </p>

        <form className="mt-8 flex flex-col sm:flex-row gap-3">
          <Input
            type="email"
            placeholder="you@email.com"
            className="flex-1 h-12 text-base"
          />
          <Button size="lg" className="h-12 px-8">
            Create account
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          Free forever on the Starter plan. No credit card required.
        </p>
      </div>
    </section>
  );
}
```

**When to use:** Want to capture leads quickly, simplified signup.

---

## 4. CTA with Image/Mockup

Shows the product alongside the CTA. Reinforces the value.

```tsx
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

export function CTAWithImage() {
  return (
    <section className="container px-4 py-16 md:py-24">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Content */}
        <div>
          <h2 className="text-3xl md:text-4xl font-bold">
            See how easy it is to get started
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Set up your workspace in minutes and start seeing results
            immediately.
          </p>

          <ul className="mt-6 space-y-3">
            {[
              "Import data from anywhere",
              "Set up automations without code",
              "Invite your team in clicks",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="text-lg">
              Start for free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg">
              <Play className="mr-2 h-5 w-5" />
              Watch demo (2 min)
            </Button>
          </div>
        </div>

        {/* Image */}
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl blur-2xl" />
          <img
            src="/dashboard-preview.png"
            alt="Dashboard preview"
            className="relative rounded-xl border shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}
```

**When to use:** Visual product, want to reinforce what the customer will get.

---

## 5. CTA Card (Compact)

Card format. Good for sidebar or smaller sections.

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export function CTACard() {
  return (
    <Card className="max-w-md mx-auto bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
      <CardHeader className="text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-bold">Ready to get started?</h3>
        <p className="text-sm text-muted-foreground">
          Free trial for 14 days
        </p>
      </CardHeader>
      <CardContent className="text-center">
        <div className="text-3xl font-bold">$0</div>
        <div className="text-sm text-muted-foreground">
          to get started, then $97/mo
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button className="w-full">Create free account</Button>
        <Button variant="ghost" className="w-full">
          Talk to sales
        </Button>
      </CardFooter>
    </Card>
  );
}
```

**When to use:** Sidebar, pop-up, compact section.

---

## 6. CTA Sticky (Mobile)

Fixed bar on mobile. Always visible.

```tsx
import { Button } from "@/components/ui/button";

export function CTASticky() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-background/95 backdrop-blur border-t p-4">
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1">
            See demo
          </Button>
          <Button className="flex-1">Start for free</Button>
        </div>
      </div>
    </div>
  );
}
```

**When to use:** Always on mobile. Significantly increases conversion.

---

## 7. Newsletter CTA

For capturing leads not yet ready to buy.

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";

export function CTANewsletter() {
  return (
    <section className="bg-muted/50">
      <div className="container px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold">
            Get productivity tips
          </h2>
          <p className="mt-3 text-muted-foreground">
            Weekly content on how to scale operations. No spam.
          </p>

          <form className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="you@email.com"
              className="flex-1"
            />
            <Button>Subscribe</Button>
          </form>

          <p className="mt-4 text-xs text-muted-foreground">
            +5,000 leaders already receive it. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
```

**When to use:** Top of funnel, marketing content, blog.

---

## Footer CTA (Final)

CTA inside the footer. Last chance before leaving.

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
  return (
    <footer className="border-t">
      {/* CTA Section */}
      <div className="container px-4 py-12 border-b">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-xl font-bold">Ready to get started?</h3>
            <p className="text-muted-foreground">
              Create your free account in seconds
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">Talk to sales</Button>
            <Button>Start for free</Button>
          </div>
        </div>
      </div>

      {/* Footer links */}
      <div className="container px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* ... footer links ... */}
        </div>
      </div>

      {/* Bottom */}
      <div className="container px-4 py-6 border-t">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 YourSaaS. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground">
              Privacy
            </a>
            <a href="/terms" className="hover:text-foreground">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

---

## CTA Copy

### Headlines
```markdown
- "Ready for [result]?"
- "Start [benefit] today"
- "Join [number] [companies/professionals]"
- "Transform your [area] in [time]"
- "Stop wasting time with [pain]"
```

### Sub-headlines
```markdown
- "Start free, scale when you need"
- "No credit card. No commitment."
- "Set up in 5 minutes. See results in 1 week."
- "Try all features for 14 days"
```

### Buttons
```markdown
# High intent
- "Start for free"
- "Create account"
- "Try now"
- "Try for free"

# Low friction
- "See demo"
- "Schedule a call"
- "Learn more"
- "Explore features"
```

### Trust elements
```markdown
- "✓ 14 days free"
- "✓ No credit card"
- "✓ Cancel anytime"
- "✓ Setup in 5 minutes"
- "✓ Support included"
- "✓ Data protected (GDPR)"
```
