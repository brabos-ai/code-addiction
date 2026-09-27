# Design Direction Guide

Deep reference for the Design Thinking Phase of the UX Design skill.

---

## Purpose Definition

Before any interface, answer:

| Question | Why It Matters |
|----------|---------------|
| What action should this interface enable? | Drives layout hierarchy |
| Is it persuasive, functional, exploratory, or expressive? | Determines tone |
| What's the primary user emotion? | Shapes visual language |
| What's the one thing users must notice first? | Sets visual hierarchy |

---

## Tone Directory

### Available Tones (Choose ONE dominant, max TWO blended)

| Tone | Characteristics | Best For |
|------|----------------|----------|
| **Minimal Clean** | Whitespace, subtle borders, muted palette | Enterprise SaaS, productivity tools |
| **Editorial** | Strong typography, magazine layout, asymmetry | Content platforms, blogs, portfolios |
| **Luxury Refined** | Rich contrast, serif accents, generous spacing | Premium products, fintech |
| **Industrial Utilitarian** | Dense data, monospace accents, functional | Dev tools, analytics, monitoring |
| **Playful** | Rounded corners, vibrant accents, illustrations | Consumer apps, onboarding |
| **Data-Dense** | Compact spacing, small type, high info density | Dashboards, admin panels, trading |

### Tone Combinations That Work

| Primary | Secondary | Result |
|---------|-----------|--------|
| Minimal Clean | Data-Dense | Clean analytics dashboard |
| Luxury Refined | Editorial | Premium content platform |
| Industrial | Data-Dense | Developer monitoring tool |
| Playful | Minimal Clean | Friendly productivity app |

### Combinations That FAIL

- Playful + Industrial (conflicting intent)
- Luxury + Data-Dense (luxury needs breathing room)
- Editorial + Industrial (typography vs density clash)

---

## Differentiation Anchor

The anchor is the ONE visual element that makes your interface recognizable without branding.

### Examples

| Anchor Type | Implementation |
|-------------|---------------|
| **Color signature** | Unique accent color used consistently (not blue/purple) |
| **Typography rhythm** | Distinctive heading scale or font pairing |
| **Spatial pattern** | Signature use of asymmetry or negative space |
| **Interaction signature** | Distinctive hover/transition pattern |
| **Layout motif** | Recurring compositional element |

### How to Define

> "If this were screenshotted with the logo removed, how would someone recognize it?"

If you can't answer → your design is generic → rethink.

---

## Design Quality Score (DQS) — Detailed

### Scoring Each Dimension (1-5)

#### Aesthetic Impact
- 1: Default/template look
- 2: Minor customization (colors only)
- 3: Intentional but conventional
- 4: Distinctive, memorable
- 5: Would be featured in a design showcase

#### Context Fit
- 1: Completely wrong for audience
- 2: Technically fine but tonally off
- 3: Appropriate
- 4: Well-matched to product personality
- 5: Enhances brand perception

#### Implementation Feasibility
- 1: Requires custom rendering engine
- 2: Needs complex custom CSS hacks
- 3: Achievable with standard tools + effort
- 4: Clean implementation with existing libs
- 5: Leverages framework strengths perfectly

#### Performance Safety
- 1: Heavy animations, large assets, layout thrash
- 2: Some performance concerns
- 3: Acceptable with optimization
- 4: Lean and fast by default
- 5: Optimized for perceived + actual performance

#### Consistency Risk (SUBTRACTED)
- 1: Easy to maintain across 50+ screens
- 2: Mostly scalable with guidelines
- 3: Requires discipline to maintain
- 4: Hard to replicate consistently
- 5: One-off design, can't scale

### Formula

```
DQS = (Impact + Fit + Feasibility + Performance) − Consistency Risk
Range: -5 → +15
```

### Decision Matrix

| DQS | Verdict | Action |
|-----|---------|--------|
| **12-15** | Excellent | Execute fully, this will be memorable |
| **8-11** | Strong | Proceed with discipline, watch consistency |
| **4-7** | Risky | Reduce visual scope, simplify effects |
| **≤3** | Weak | STOP. Rethink aesthetic direction entirely |

---

## Aesthetic Execution Rules

### Typography (Non-Negotiable)

- NEVER use Inter, Roboto, Arial, or system fonts as display/heading fonts
- ALWAYS choose:
  - 1 expressive display font (personality)
  - 1 restrained body font (readability)
- Use typography structurally: scale, rhythm, contrast

**Recommended Pairings:**

| Display | Body | Tone |
|---------|------|------|
| Clash Display | DM Sans | Bold/Modern |
| Cabinet Grotesk | Source Sans Pro | Clean/Professional |
| Satoshi | DM Sans | Friendly/Modern |
| Plus Jakarta Sans | Inter | Neutral/Versatile |
| Space Grotesk | DM Sans | Tech/Industrial |

### Color Story

- Commit to ONE dominant color story via CSS variables
- Structure: 1 dominant tone + 1 accent + 1 neutral system
- NEVER use evenly-balanced palettes (one color must dominate)
- Test in both light and dark mode

### Spatial Composition

- White space is a design element, not absence
- Break the grid intentionally when the tone calls for it
- Use asymmetry, overlap, or controlled density as tools
- Consistent spacing scale: 4, 6, 8, 12, 16, 24, 32, 48

### Motion Philosophy

- Motion MUST be purposeful, sparse, and high-impact
- Prefer: one strong entrance + meaningful hover states
- AVOID: decorative micro-motion spam, gratuitous transitions
- Always respect `prefers-reduced-motion`

---

## Output Template

Every component/page MUST start with this comment block:

```tsx
/**
 * Design Direction: [Tone name]
 * DQS: [score]/15 (Impact:[n] Fit:[n] Feasibility:[n] Performance:[n] - Risk:[n])
 * Anchor: [What makes this distinctive]
 * Differentiation: "This avoids generic UI by [doing X instead of Y]"
 */
```

This forces intentionality and prevents template-driven output.
