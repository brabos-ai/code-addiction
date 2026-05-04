# Social Proof Sections

Social proof that builds trust and converts. Essential for SaaS.

---

## 1. Logo Cloud (Clients)

Show who already uses it. Instant credibility.

```tsx
export function LogoCloud() {
  const logos = [
    { name: "Nubank", src: "/logos/nubank.svg" },
    { name: "iFood", src: "/logos/ifood.svg" },
    { name: "Stone", src: "/logos/stone.svg" },
    { name: "Loft", src: "/logos/loft.svg" },
    { name: "Creditas", src: "/logos/creditas.svg" },
    { name: "QuintoAndar", src: "/logos/quintoandar.svg" },
  ];

  return (
    <section className="py-12 border-y bg-muted/30">
      <div className="container px-4">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Used by companies you know
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {logos.map((logo) => (
            <img
              key={logo.name}
              src={logo.src}
              alt={logo.name}
              className="h-8 md:h-10 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

### Variation: Logo Marquee (Animated)
```tsx
import { motion } from "framer-motion";

export function LogoMarquee() {
  const logos = [/* ... */];

  return (
    <section className="py-12 overflow-hidden">
      <p className="text-center text-sm text-muted-foreground mb-8">
        +500 companies trust us
      </p>
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />

        <motion.div
          className="flex gap-12"
          animate={{ x: [0, -1000] }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {[...logos, ...logos].map((logo, i) => (
            <img
              key={i}
              src={logo.src}
              alt={logo.name}
              className="h-8 flex-shrink-0 opacity-50"
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

**When to use:** Have well-known clients, B2B, want quick credibility.

---

## 2. Testimonials Grid

Testimonials in cards. The most versatile.

```tsx
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Ana Silva",
    role: "CEO, TechStart",
    image: "/avatars/ana.jpg",
    content:
      "We rolled it out in a week and the team was already using it. I've never seen such fast adoption.",
    rating: 5,
  },
  {
    name: "Carlos Santos",
    role: "Head of Operations, ScaleUp",
    image: "/avatars/carlos.jpg",
    content:
      "We cut 40% of manual process time. The ROI was immediate.",
    rating: 5,
  },
  {
    name: "Marina Costa",
    role: "Founder, GrowthLab",
    image: "/avatars/marina.jpg",
    content:
      "The support is incredible. They respond fast and actually solve the problems.",
    rating: 5,
  },
];

export function TestimonialsGrid() {
  return (
    <section className="container px-4 py-16 md:py-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">
          What our customers say
        </h2>
        <p className="mt-4 text-muted-foreground">
          +2,000 companies have already transformed their operations
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial) => (
          <Card key={testimonial.name} className="bg-muted/30">
            <CardContent className="pt-6">
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground mb-6">"{testimonial.content}"</p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
```

**When to use:** Have real testimonials, want to show diversity of customers.

---

## 3. Featured Testimonial (Highlight)

One large, impactful testimonial. Good for a strong quote.

```tsx
export function TestimonialFeatured() {
  return (
    <section className="container px-4 py-16 md:py-24">
      <div className="max-w-4xl mx-auto text-center">
        {/* Client logo */}
        <img
          src="/logos/nubank.svg"
          alt="Nubank"
          className="h-10 mx-auto mb-8 opacity-60"
        />

        {/* Quote */}
        <blockquote className="text-2xl md:text-3xl lg:text-4xl font-medium leading-relaxed">
          "We tried several solutions before. This was the only one the team
          actually adopted. In 3 months,{" "}
          <span className="text-primary">
            we doubled our productivity
          </span>
          ."
        </blockquote>

        {/* Author */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <img
            src="/avatars/ceo.jpg"
            alt="João Mendes"
            className="h-14 w-14 rounded-full object-cover"
          />
          <div className="text-left">
            <div className="font-semibold">João Mendes</div>
            <div className="text-muted-foreground">VP of Product, Nubank</div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

**When to use:** Have a high-profile client, a very strong quote.

---

## 4. Stats Section

Impressive numbers. Quantitative social proof.

```tsx
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const stats = [
  { value: "10k+", label: "Active users" },
  { value: "500+", label: "Companies" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9", label: "G2 Rating" },
];

export function Stats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="py-16 bg-muted/30">
      <div className="container px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-4xl md:text-5xl font-bold text-primary">
                {stat.value}
              </div>
              <div className="mt-2 text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### Variation: Stats with icons
```tsx
import { Users, Building2, Clock, Star } from "lucide-react";

const stats = [
  { icon: Users, value: "10k+", label: "Users" },
  { icon: Building2, value: "500+", label: "Companies" },
  { icon: Clock, value: "99.9%", label: "Uptime" },
  { icon: Star, value: "4.9", label: "Rating" },
];

export function StatsWithIcons() {
  return (
    <section className="container px-4 py-16">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <stat.icon className="h-6 w-6 text-primary" />
            </div>
            <div className="text-3xl font-bold">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

**When to use:** Have impressive numbers, want quick social proof.

---

## 5. Review Badges

Badges from review platforms. Instant trust.

```tsx
export function ReviewBadges() {
  return (
    <section className="py-8">
      <div className="container px-4">
        <div className="flex flex-wrap justify-center items-center gap-8">
          {/* G2 */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
            <img src="/badges/g2.svg" alt="G2" className="h-8" />
            <div className="text-sm">
              <div className="font-semibold">4.9/5</div>
              <div className="text-muted-foreground">G2 Crowd</div>
            </div>
          </div>

          {/* Capterra */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
            <img src="/badges/capterra.svg" alt="Capterra" className="h-8" />
            <div className="text-sm">
              <div className="font-semibold">4.8/5</div>
              <div className="text-muted-foreground">Capterra</div>
            </div>
          </div>

          {/* Product Hunt */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
            <img src="/badges/ph.svg" alt="Product Hunt" className="h-8" />
            <div className="text-sm">
              <div className="font-semibold">#1 Product</div>
              <div className="text-muted-foreground">of the Day</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

**When to use:** Have reviews on platforms, B2B SaaS.

---

## 6. Case Study Teaser

Preview of a case study. Links to the full page.

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

const cases = [
  {
    company: "TechStart",
    logo: "/logos/techstart.svg",
    metric: "+47%",
    description: "increase in productivity",
    image: "/cases/techstart.jpg",
  },
  {
    company: "ScaleUp",
    logo: "/logos/scaleup.svg",
    metric: "3x",
    description: "more qualified leads",
    image: "/cases/scaleup.jpg",
  },
];

export function CaseStudyTeaser() {
  return (
    <section className="container px-4 py-16 md:py-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold">Success stories</h2>
          <p className="mt-2 text-muted-foreground">
            See how real companies are growing
          </p>
        </div>
        <Button variant="outline">
          View all cases
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {cases.map((item) => (
          <Card
            key={item.company}
            className="group overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
          >
            <CardContent className="p-0">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.company}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                <img
                  src={item.logo}
                  alt={item.company}
                  className="absolute bottom-4 left-4 h-8"
                />
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-primary">
                  {item.metric}
                </div>
                <div className="text-muted-foreground">{item.description}</div>
                <Button variant="link" className="mt-4 p-0">
                  Read full case study
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
```

**When to use:** Have documented case studies, want to generate qualified leads.

---

## Recommended Combinations

### For Early Stage (few clients)
```
Stats (usage numbers) → Testimonials (2-3 quotes)
```

### For Growth Stage
```
Logo Cloud → Stats → Testimonials Grid → Review Badges
```

### For Enterprise
```
Featured Testimonial → Case Study Teasers → Logo Cloud (enterprises)
```
