# Aesthetics - Paletas para SaaS

Direções estéticas completas para landing pages SaaS. Escolha uma e seja consistente.

---

## Minimal (Notion, Linear, Raycast)

**Vibe:** Limpo, profissional, sofisticado. "Less is more."

### Cores
```css
:root {
  /* Light mode */
  --background: 0 0% 100%;
  --foreground: 0 0% 9%;
  --muted: 0 0% 96%;
  --muted-foreground: 0 0% 45%;
  --primary: 0 0% 9%;           /* Preto como primary */
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

### Características
```markdown
- Background: Branco puro (#FFFFFF)
- Texto: Preto/cinza escuro, sem cores vibrantes
- Accent: Apenas 1 cor (geralmente preto ou cinza)
- Bordas: Sutis, 1px, cinza claro
- Shadows: Mínimas ou nenhuma
- Spacing: Generoso (py-24, gap-8)
- Typography: Uma fonte apenas (Inter, SF Pro)
- Animations: Nenhuma ou fade sutil
```

### Padrões de Código
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

### Exemplo de Hero
```tsx
<section className="min-h-screen flex items-center">
  <div className="container px-4 py-24">
    <h1 className="text-5xl md:text-6xl font-medium tracking-tight max-w-3xl">
      Gerencie projetos com clareza
    </h1>
    <p className="mt-6 text-xl text-gray-600 max-w-xl">
      Uma ferramenta simples para equipes que valorizam foco.
    </p>
    <Button className="mt-10 bg-black text-white px-8 h-12">
      Começar grátis
    </Button>
  </div>
</section>
```

**Use para:** Ferramentas de produtividade, dev tools, B2B enterprise.

---

## Tech (Vercel, Supabase, Railway)

**Vibe:** Moderno, dark mode, gradientes sutis. "Built for developers."

### Cores
```css
:root {
  /* Dark mode */
  --background: 0 0% 4%;          /* Preto profundo */
  --foreground: 0 0% 98%;
  --muted: 0 0% 10%;
  --muted-foreground: 0 0% 60%;
  --primary: 142 76% 36%;         /* Verde Vercel-like */
  --primary-foreground: 0 0% 100%;
  --accent: 217 91% 60%;          /* Azul accent */
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

### Características
```markdown
- Background: Preto profundo (#0A0A0A, #000)
- Texto: Branco/cinza claro
- Primary: Verde vibrante (#22C55E) ou Azul (#3B82F6)
- Gradients: Sutis, mesh gradients
- Glow effects: Blur em elementos destacados
- Grid patterns: Background com linhas sutis
- Code snippets: Destaque visual
- Animations: Suaves, microinteractions
```

### Padrões de Código
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

### Exemplo de Hero
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

**Use para:** Dev tools, infrastructure, APIs, technical products.

---

## Enterprise (Salesforce, HubSpot, Zendesk)

**Vibe:** Confiável, profissional, estruturado. "Trusted by Fortune 500."

### Cores
```css
:root {
  --background: 210 40% 98%;      /* Off-white azulado */
  --foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --primary: 221 83% 53%;         /* Azul confiável */
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

### Características
```markdown
- Background: Off-white ou cinza muito claro
- Primary: Azul (#2563EB, #1D4ED8)
- Accent: Verde para success, vermelho para alerts
- Shadows: Suaves, layers definidos
- Borders: Visíveis, estrutura clara
- Icons: Outlined, consistentes
- Forms: Bem definidos, labels claros
- Trust signals: Badges, certificações, logos
```

### Padrões de Código
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

### Exemplo de Hero
```tsx
<section className="bg-gradient-to-b from-blue-50 to-white">
  <div className="container px-4 py-20 md:py-28">
    <div className="max-w-3xl">
      <Badge className="bg-blue-100 text-blue-700 mb-6">
        #1 em CRM no Brasil
      </Badge>
      <h1 className="text-4xl md:text-5xl font-semibold text-slate-900">
        O CRM que cresce com sua empresa
      </h1>
      <p className="mt-6 text-xl text-slate-600">
        Gerencie vendas, marketing e suporte em uma única plataforma.
        Usado por mais de 10.000 empresas.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
          Começar grátis
        </Button>
        <Button size="lg" variant="outline">
          Falar com vendas
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

**Use para:** CRM, ERP, B2B enterprise, ferramentas corporativas.

---

## Bold (Stripe, Figma, Loom)

**Vibe:** Marcante, gradientes fortes, memorável. "Stand out."

### Cores
```css
:root {
  --background: 0 0% 100%;
  --foreground: 224 71% 4%;
  --muted: 220 14% 96%;
  --muted-foreground: 220 9% 46%;
  --primary: 262 83% 58%;         /* Roxo vibrante */
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

### Características
```markdown
- Gradients: Fortes, multi-color (purple → pink → orange)
- Typography: Display fonts bold para headlines
- Colors: Vibrantes, contrastantes
- Illustrations: 3D, isometric, caracterescos
- Animations: Bouncy, spring physics
- Glassmorphism: Blur + transparência
- Shadows: Coloridas (shadow-primary/20)
```

### Padrões de Código
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

### Exemplo de Hero
```tsx
<section className="relative min-h-screen flex items-center overflow-hidden">
  {/* Animated gradient background */}
  <div className="absolute inset-0 bg-gradient-to-br from-violet-100 via-pink-50 to-orange-50" />

  {/* Floating shapes */}
  <div className="absolute top-20 left-20 w-72 h-72 bg-violet-400/30 rounded-full blur-3xl animate-pulse" />
  <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-400/30 rounded-full blur-3xl animate-pulse delay-1000" />

  <div className="relative container px-4 text-center">
    <Badge className="bg-gradient-to-r from-violet-500 to-pink-500 text-white mb-8">
      Novo design colaborativo
    </Badge>
    <h1 className="text-5xl md:text-7xl font-display font-bold">
      Design que{" "}
      <span className="bg-gradient-to-r from-violet-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">
        inspira
      </span>
    </h1>
    <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
      Crie interfaces incríveis com sua equipe. Em tempo real,
      de qualquer lugar.
    </p>
    <div className="mt-10 flex gap-4 justify-center">
      <Button
        size="lg"
        className="bg-gradient-to-r from-violet-500 to-pink-500 text-white px-8 shadow-lg shadow-violet-500/25"
      >
        Começar grátis
      </Button>
      <Button size="lg" variant="outline" className="px-8">
        Ver templates
      </Button>
    </div>
  </div>
</section>
```

**Use para:** Design tools, creative tools, produtos consumer, startups D2C.

---

## Escolhendo a Estética

| Seu Produto | Público | Estética |
|-------------|---------|----------|
| Dev tool, API, infra | Developers | **Tech** |
| Produtividade, notes, tasks | Profissionais | **Minimal** |
| CRM, ERP, B2B complex | Enterprise | **Enterprise** |
| Design, creative, consumer | Criadores, startups | **Bold** |

---

## Fonts Recomendadas

### Display (Headlines)
```markdown
- Clash Display - Geométrica, moderna
- Cabinet Grotesk - Bold, característica
- Satoshi - Limpa, versátil
- Plus Jakarta Sans - Friendly, profissional
```

### Body (Texto)
```markdown
- Inter - Neutra, legível
- DM Sans - Moderna, limpa
- Geist - Técnica, Vercel-style
- Source Sans Pro - Clássica, profissional
```

### Mono (Code)
```markdown
- JetBrains Mono - Ligatures, dev-friendly
- Geist Mono - Moderna, Vercel-style
- Fira Code - Popular, ligatures
```

### Como Carregar (Next.js/Vite)
```tsx
// Google Fonts via link
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

// ou Fontsource (npm)
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
```
