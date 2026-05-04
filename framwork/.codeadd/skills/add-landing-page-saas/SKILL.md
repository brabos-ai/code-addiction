---
name: add-landing-page-saas
description: Use when creating landing pages for SaaS products - provides high-conversion patterns, copy frameworks, and aesthetic guidelines
---

# Landing Page SaaS

Skill for building **high-conversion landing pages for SaaS products**.

**Use for:** Landing pages, product pages, pricing pages
**Do not use for:** Dashboards, internal apps (use `ux-design`)

**Preparation:** Use `saas-copy` BEFORE to extract context and generate structured copy

**Stack:** React + Tailwind v3 + shadcn/ui + Motion

---

## Prompt Framework

```
Product: [SaaS name + value proposition in 1 line]
Audience: [who buys - role/company/pain]
Sections: [Hero, Features, Pricing, Social, CTA]
Aesthetic: [Minimal | Tech | Enterprise | Bold]
Differentiator: [what makes it unique vs competitors]
```

### Real Example

```
Product: EasyFlow - Process management for SMBs without complexity
Audience: SMB owners who waste time with spreadsheets and WhatsApp
Sections: Hero, Features (bento), Pricing, Testimonials, CTA
Aesthetic: Tech
Differentiator: Setup in 5 minutes, no training required
```

---

## Available Sections

{"sections":{"Hero":{"variations":"Centered,Split,Video,Gradient","file":"sections/hero.md"},"Features":{"variations":"Bento,Grid,Showcase,Timeline","file":"sections/features.md"},"Pricing":{"variations":"3-Tier,Comparison,Simple","file":"sections/pricing.md"},"SocialProof":{"variations":"Logos,Testimonials,Stats,Marquee","file":"sections/social-proof.md"},"CTA":{"variations":"Simple,Newsletter,Trial","file":"sections/cta.md"}}}

---

## SaaS Landing Page Structure

```
┌─────────────────────────────────────┐
│ Nav: Logo + Links + CTA             │
├─────────────────────────────────────┤
│ Hero: Headline + Subheadline + CTA  │
│       + Screenshot/Demo             │
├─────────────────────────────────────┤
│ Logos: "Trusted by companies like…" │
├─────────────────────────────────────┤
│ Features: Bento/Grid of features    │
├─────────────────────────────────────┤
│ Social Proof: Testimonials + Stats  │
├─────────────────────────────────────┤
│ Pricing: Plans + Comparison         │
├─────────────────────────────────────┤
│ FAQ: Frequently asked questions     │
├─────────────────────────────────────┤
│ Final CTA: Last call to action      │
├─────────────────────────────────────┤
│ Footer: Links + Legal               │
└─────────────────────────────────────┘
```

---

## SaaS Aesthetics

{"aesthetics":{"Minimal":{"ref":"Notion,Linear","colors":"light bg, dark text, 1 accent","font":"Geometric (Inter,Satoshi)","spacing":"generous, whitespace","effects":"none or subtle"},"Tech":{"ref":"Vercel,Supabase","colors":"dark bg, gradients, vibrant accent","font":"Modern sans (Geist,Inter)","spacing":"moderate","effects":"gradients,glow,grid"},"Enterprise":{"ref":"Salesforce,HubSpot","colors":"blue, light bg","font":"Professional (SF Pro,Inter)","spacing":"structured","effects":"shadows,borders"},"Bold":{"ref":"Stripe,Figma","colors":"high contrast, bold gradients","font":"Display bold (Clash,Cabinet)","spacing":"dramatic","effects":"animations,3D,glassmorphism"}}}

**Detalhes completos:** [aesthetics.md](aesthetics.md)

---

## SaaS Copy

### Converting Headlines

```markdown
## Headline Patterns

# [Result] without [Pain]
→ "Manage projects without spreadsheets"

# [Verb] your [Object] in [Time]
→ "Launch your SaaS in weeks"

# The [Category] that [Differentiator]
→ "The CRM your team will actually use"

# [Number] [Benefit] with [Product]
→ "3x more leads with automation"

# Stop [Pain]. Start [Benefit].
→ "Stop losing customers. Start retaining them."
```

### Subheadlines

```markdown
## Subheadline Patterns

# [Product] helps [Audience] [Benefit] using [Method].
→ "EasyFlow helps SMBs organize processes using simple automation."

# [Benefit 1], [Benefit 2] and [Benefit 3] — all in one place.
→ "Tasks, projects and communication — all in one place."

# Without [Objection 1]. Without [Objection 2]. Just [Benefit].
→ "Without complex setup. Without training. Just results."
```

### CTAs That Work

```markdown
## Primary CTAs (High intent)
- "Start for free"
- "Try for 14 days"
- "Create free account"
- "See demo"

## Secondary CTAs (Low friction)
- "See how it works"
- "Explore features"
- "Talk to sales"
- "View pricing"
```

---

## Trust Elements

### Security Badges
```tsx
<div className="flex items-center gap-4 text-sm text-muted-foreground">
  <span className="flex items-center gap-1">
    <Shield className="h-4 w-4" /> SOC 2
  </span>
  <span className="flex items-center gap-1">
    <Lock className="h-4 w-4" /> LGPD
  </span>
  <span className="flex items-center gap-1">
    <Server className="h-4 w-4" /> 99.9% uptime
  </span>
</div>
```

### Social Proof Stats
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
  <div>
    <div className="text-4xl font-bold">10k+</div>
    <div className="text-muted-foreground">Active users</div>
  </div>
  <div>
    <div className="text-4xl font-bold">500+</div>
    <div className="text-muted-foreground">Companies</div>
  </div>
  <div>
    <div className="text-4xl font-bold">99.9%</div>
    <div className="text-muted-foreground">Uptime</div>
  </div>
  <div>
    <div className="text-4xl font-bold">4.9</div>
    <div className="text-muted-foreground">G2 Rating</div>
  </div>
</div>
```

---

## Workflow

1. **Define** product + audience + differentiator
2. **Choose** aesthetic (Minimal/Tech/Enterprise/Bold)
3. **Assemble** sections using the templates
4. **Adapt** copy for the context
5. **Review** mobile-first

---

## Conversion Checklist

```markdown
## Hero
- [ ] Headline communicates value in < 6 words
- [ ] Subheadline explains the "how"
- [ ] Primary CTA visible without scrolling
- [ ] Product screenshot/demo
- [ ] Quick social proof (logos or stats)

## Pricing
- [ ] 3 plans maximum
- [ ] Recommended plan highlighted
- [ ] Annual price with discount
- [ ] Feature list per plan
- [ ] FAQ below

## Trust
- [ ] Client logos
- [ ] Testimonials with photo + title
- [ ] Security badges
- [ ] Usage stats

## Mobile
- [ ] Touch targets 44px+
- [ ] Text readable without zoom
- [ ] Sticky CTA on mobile
- [ ] Optimized images
```

---

## Reference Files

{"files":{"sections/hero.md":"5 hero section variations","sections/features.md":"Bento, grid, showcase","sections/pricing.md":"Pricing tables","sections/social-proof.md":"Logos, testimonials, stats","sections/cta.md":"Final CTAs","aesthetics.md":"Complete palettes"}}
