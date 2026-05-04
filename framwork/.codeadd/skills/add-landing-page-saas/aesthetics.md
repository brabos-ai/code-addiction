# Aesthetics - Palettes for SaaS

Complete aesthetic directions for SaaS landing pages. Choose one and stay consistent.

---

## Minimal (Notion, Linear, Raycast)

**Vibe:** Clean, professional, sophisticated. "Less is more."

### Colors
```css
:root {
  /* Light mode */
  --background: 0 0% 100%;
  --foreground: 0 0% 9%;
  --muted: 0 0% 96%;
  --muted-foreground: 0 0% 45%;
  --primary: 0 0% 9%;           /* Black as primary */
  --primary-foreground: 0 0% 100%;
  --accent: 0 0% 96%;
  --border: 0 0% 90%;
}
```

### Tailwind Config
```js
theme: {
  extend: {
    colors: {
      primary: '#171717',
      accent: '#f5f5f5',
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
    },
  },
}
```

### Characteristics
```markdown
- Background: Pure white (#FFFFFF)
- Text: Black/dark gray, no vibrant colors
- Accent: Only 1 color (usually black or gray)
- Borders: Subtle, 1px, light gray
- Shadows: Minimal or none
- Spacing: Generous (py-24, gap-8)
- Typography: Single font only (Inter, SF Pro)
- Animations: None or subtle fade
```

### Code Patterns
```tsx
// Buttons
<Button className="bg-black text-white hover:bg-black/90">
<Button variant="outline" className="border-gray-200">

// Cards
<Card className="border border-gray-100 shadow-none">

// Sections
<section className="py-24 md:py-32">

// Headlines
<h1 className="text-4xl md:text-5xl font-medium tracking-tight">

// Body
<p className="text-gray-600 text-lg leading-relaxed">
```

### Hero Example
```tsx
<section className="min-h-screen flex items-center">
  <div className="container px-4 py-24">
    <h1 className="text-5xl md:text-6xl font-medium tracking-tight max-w-3xl">
      Manage projects with clarity
    </h1>
    <p className="mt-6 text-xl text-gray-600 max-w-xl">
      A simple tool for teams that value focus.
    </p>
    <Button className="mt-10 bg-black text-white px-8 h-12">
      Start for free
    </Button>
  </div>
</section>
```

**Use for:** Productivity tools, dev tools, B2B enterprise.

---

## Tech (Vercel, Supabase, Railway)

**Vibe:** Modern, dark mode, subtle gradients. "Built for developers."

### Colors
```css
:root {
  /* Dark mode */
  --background: 0 0% 4%;          /* Deep black */
  --foreground: 0 0% 98%;
  --muted: 0 0% 10%;
  --muted-foreground: 0 0% 60%;
  --primary: 142 76% 36%;         /* Vercel-like green */
  --primary-foreground: 0 0% 100%;
  --accent: 217 91% 60%;          /* Blue accent */
  --border: 0 0% 15%;
}
```

### Tailwind Config
```js
theme: {
  extend: {
    colors: {
      primary: '#22c55e',
      accent: '#3b82f6',
      background: '#0a0a0a',
    },
    fontFamily: {
      sans: ['Geist', 'Inter', 'system-ui'],
      mono: ['Geist Mono', 'monospace'],
    },
  },
}
```

### Characteristics
```markdown
- Background: Deep black (#0A0A0A, #000)
- Text: White/light gray
- Primary: Vibrant green (#22C55E) or Blue (#3B82F6)
- Gradients: Subtle, mesh gradients
- Glow effects: Blur on highlighted elements
- Grid patterns: Background with subtle lines
- Code snippets: Visual highlight
- Animations: Smooth, microinteractions
```

### Code Patterns
```tsx
// Background pattern
<div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />

// Glow effect
<div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg blur-xl opacity-50" />

// Gradient text
<span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">

// Buttons
<Button className="bg-white text-black hover:bg-white/90">
<Button variant="outline" className="border-white/20 text-white hover:bg-white/10">

// Cards
<Card className="bg-white/5 border-white/10 backdrop-blur">

// Code block
<pre className="bg-zinc-950 rounded-lg p-4 text-sm text-zinc-300 font-mono">
```

### Hero Example
```tsx
<section className="relative min-h-screen flex items-center bg-black overflow-hidden">
  {/* Grid pattern */}
  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:32px_32px]" />

  {/* Gradient orb */}
  <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-r from-green-500/30 to-blue-500/30 rounded-full blur-3xl" />

  <div className="relative container px-4 text-center text-white">
    <Badge className="bg-white/10 text-white border-white/20 mb-8">
      v2.0 Released
    </Badge>
    <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
      Deploy in{" "}
      <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
        seconds
      </span>
    </h1>
    <p className="mt-6 text-xl text-zinc-400 max-w-2xl mx-auto">
      Push to git. We handle the rest. Zero config deployments.
    </p>
    <div className="mt-10 flex gap-4 justify-center">
      <Button className="bg-white text-black hover:bg-white/90 px-8">
        Start Building
      </Button>
      <Button variant="outline" className="border-white/20 text-white">
        View Docs
      </Button>
    </div>
  </div>
</section>
```

**Use for:** Dev tools, infrastructure, APIs, technical products.

---

## Enterprise (Salesforce, HubSpot, Zendesk)

**Vibe:** Reliable, professional, structured. "Trusted by Fortune 500."

### Colors
```css
:root {
  --background: 210 40% 98%;      /* Bluish off-white */
  --foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --primary: 221 83% 53%;         /* Trustworthy blue */
  --primary-foreground: 0 0% 100%;
  --accent: 210 40% 94%;
  --border: 214 32% 91%;
}
```

### Tailwind Config
```js
theme: {
  extend: {
    colors: {
      primary: '#2563eb',         // Blue-600
      secondary: '#7c3aed',       // Violet para accent
      success: '#16a34a',
    },
    fontFamily: {
      sans: ['SF Pro Display', 'Inter', 'system-ui'],
    },
  },
}
```

### Characteristics
```markdown
- Background: Off-white or very light gray
- Primary: Blue (#2563EB, #1D4ED8)
- Accent: Green for success, red for alerts
- Shadows: Soft, defined layers
- Borders: Visible, clear structure
- Icons: Outlined, consistent
- Forms: Well-defined, clear labels
- Trust signals: Badges, certifications, logos
```

### Code Patterns
```tsx
// Background
<div className="bg-slate-50">

// Cards com shadow
<Card className="bg-white shadow-sm border">

// Buttons
<Button className="bg-blue-600 hover:bg-blue-700">
<Button variant="outline" className="border-blue-600 text-blue-600">

// Headers
<h1 className="text-4xl font-semibold text-slate-900">

// Sections
<section className="bg-white py-16 border-y">
<section className="bg-slate-50 py-16">

// Feature cards
<div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
```

### Hero Example
```tsx
<section className="bg-gradient-to-b from-blue-50 to-white">
  <div className="container px-4 py-20 md:py-28">
    <div className="max-w-3xl">
      <Badge className="bg-blue-100 text-blue-700 mb-6">
        #1 CRM in the market
      </Badge>
      <h1 className="text-4xl md:text-5xl font-semibold text-slate-900">
        The CRM that grows with your company
      </h1>
      <p className="mt-6 text-xl text-slate-600">
        Manage sales, marketing and support in a single platform.
        Trusted by more than 10,000 companies.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
          Start for free
        </Button>
        <Button size="lg" variant="outline">
          Talk to sales
        </Button>
      </div>
      {/* Trust logos */}
      <div className="mt-12 flex items-center gap-8 opacity-60">
        <img src="/logos/itau.svg" className="h-8" />
        <img src="/logos/natura.svg" className="h-8" />
        <img src="/logos/magazine.svg" className="h-8" />
      </div>
    </div>
  </div>
</section>
```

**Use for:** CRM, ERP, B2B enterprise, corporate tools.

---

## Bold (Stripe, Figma, Loom)

**Vibe:** Bold, strong gradients, memorable. "Stand out."

### Colors
```css
:root {
  --background: 0 0% 100%;
  --foreground: 224 71% 4%;
  --muted: 220 14% 96%;
  --muted-foreground: 220 9% 46%;
  --primary: 262 83% 58%;         /* Vibrant purple */
  --primary-foreground: 0 0% 100%;
  --accent: 174 72% 56%;          /* Teal accent */
  --border: 220 13% 91%;
}
```

### Tailwind Config
```js
theme: {
  extend: {
    colors: {
      primary: '#8b5cf6',
      secondary: '#ec4899',
      accent: '#06b6d4',
    },
    fontFamily: {
      display: ['Clash Display', 'Cabinet Grotesk', 'sans-serif'],
      sans: ['Inter', 'system-ui'],
    },
    backgroundImage: {
      'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      'stripe-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
  },
}
```

### Characteristics
```markdown
- Gradients: Strong, multi-color (purple → pink → orange)
- Typography: Bold display fonts for headlines
- Colors: Vibrant, high-contrast
- Illustrations: 3D, isometric, expressive characters
- Animations: Bouncy, spring physics
- Glassmorphism: Blur + transparency
- Shadows: Colored (shadow-primary/20)
```

### Code Patterns
```tsx
// Gradient backgrounds
<div className="bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500">
<div className="bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-yellow-500 via-purple-500 to-blue-500">

// Gradient text
<h1 className="bg-gradient-to-r from-violet-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">

// Glassmorphism cards
<Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-xl">

// Colored shadows
<div className="shadow-xl shadow-primary/20">

// Buttons
<Button className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600">

// Animated elements
<motion.div
  whileHover={{ scale: 1.05, rotate: 2 }}
  transition={{ type: "spring", stiffness: 300 }}
>
```

### Hero Example
```tsx
<section className="relative min-h-screen flex items-center overflow-hidden">
  {/* Animated gradient background */}
  <div className="absolute inset-0 bg-gradient-to-br from-violet-100 via-pink-50 to-orange-50" />

  {/* Floating shapes */}
  <div className="absolute top-20 left-20 w-72 h-72 bg-violet-400/30 rounded-full blur-3xl animate-pulse" />
  <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-400/30 rounded-full blur-3xl animate-pulse delay-1000" />

  <div className="relative container px-4 text-center">
    <Badge className="bg-gradient-to-r from-violet-500 to-pink-500 text-white mb-8">
      New collaborative design
    </Badge>
    <h1 className="text-5xl md:text-7xl font-display font-bold">
      Design that{" "}
      <span className="bg-gradient-to-r from-violet-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">
        inspires
      </span>
    </h1>
    <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
      Create amazing interfaces with your team. In real time,
      from anywhere.
    </p>
    <div className="mt-10 flex gap-4 justify-center">
      <Button
        size="lg"
        className="bg-gradient-to-r from-violet-500 to-pink-500 text-white px-8 shadow-lg shadow-violet-500/25"
      >
        Start for free
      </Button>
      <Button size="lg" variant="outline" className="px-8">
        View templates
      </Button>
    </div>
  </div>
</section>
```

**Use for:** Design tools, creative tools, consumer products, D2C startups.

---

## Choosing an Aesthetic

| Your Product | Audience | Aesthetic |
|-------------|---------|----------|
| Dev tool, API, infra | Developers | **Tech** |
| Productivity, notes, tasks | Professionals | **Minimal** |
| CRM, ERP, B2B complex | Enterprise | **Enterprise** |
| Design, creative, consumer | Creators, startups | **Bold** |

---

## Recommended Fonts

### Display (Headlines)
```markdown
- Clash Display - Geometric, modern
- Cabinet Grotesk - Bold, distinctive
- Satoshi - Clean, versatile
- Plus Jakarta Sans - Friendly, professional
```

### Body (Text)
```markdown
- Inter - Neutral, readable
- DM Sans - Modern, clean
- Geist - Technical, Vercel-style
- Source Sans Pro - Classic, professional
```

### Mono (Code)
```markdown
- JetBrains Mono - Ligatures, dev-friendly
- Geist Mono - Modern, Vercel-style
- Fira Code - Popular, ligatures
```

### How to Load (Next.js/Vite)
```tsx
// Google Fonts via link
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

// ou Fontsource (npm)
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
```
