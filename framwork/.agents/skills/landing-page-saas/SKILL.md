<!-- AUTO-GENERATED - DO NOT EDIT. Source: framwork/.codeadd/skills/landing-page-saas/SKILL.md -->
---
name: landing-page-saas
description: Use when creating landing pages for SaaS products - provides high-conversion patterns, copy frameworks, and aesthetic guidelines
---

# Landing Page SaaS

Skill para criar **landing pages de alta conversão para produtos SaaS**.

**Use para:** Landing pages, páginas de produto, páginas de preços
**Não use para:** Dashboards, apps internos (use `ux-design`)

**Preparacao:** Use `saas-copy` ANTES para extrair contexto e gerar copy estruturada

**Stack:** React + Tailwind v3 + shadcn/ui + Motion

---

## Prompt Framework

```
Produto: [nome do SaaS + proposta de valor em 1 linha]
Público: [quem compra - cargo/empresa/dor]
Seções: [Hero, Features, Pricing, Social, CTA]
Estética: [Minimal | Tech | Enterprise | Bold]
Diferencial: [o que torna único vs concorrentes]
```

### Exemplo Real

```
Produto: EasyFlow - Gestão de processos para PMEs sem complexidade
Público: Donos de PME que perdem tempo com planilhas e WhatsApp
Seções: Hero, Features (bento), Pricing, Testimonials, CTA
Estética: Tech
Diferencial: Setup em 5 minutos, sem treinamento
```

---

## Seções Disponíveis

{"sections":{"Hero":{"variations":"Centered,Split,Video,Gradient","file":"sections/hero.md"},"Features":{"variations":"Bento,Grid,Showcase,Timeline","file":"sections/features.md"},"Pricing":{"variations":"3-Tier,Comparison,Simple","file":"sections/pricing.md"},"SocialProof":{"variations":"Logos,Testimonials,Stats,Marquee","file":"sections/social-proof.md"},"CTA":{"variations":"Simple,Newsletter,Trial","file":"sections/cta.md"}}}

---

## Estrutura de Landing Page SaaS

```
┌─────────────────────────────────────┐
│ Nav: Logo + Links + CTA             │
├─────────────────────────────────────┤
│ Hero: Título + Subtítulo + CTA      │
│       + Screenshot/Demo             │
├─────────────────────────────────────┤
│ Logos: "Usado por empresas como..." │
├─────────────────────────────────────┤
│ Features: Bento/Grid de recursos    │
├─────────────────────────────────────┤
│ Social Proof: Testimonials + Stats  │
├─────────────────────────────────────┤
│ Pricing: Planos + Comparativo       │
├─────────────────────────────────────┤
│ FAQ: Perguntas frequentes           │
├─────────────────────────────────────┤
│ CTA Final: Última chamada           │
├─────────────────────────────────────┤
│ Footer: Links + Legal               │
└─────────────────────────────────────┘
```

---

## Estéticas para SaaS

{"aesthetics":{"Minimal":{"ref":"Notion,Linear","colors":"bg claro,texto escuro,1 accent","font":"Geométrica (Inter,Satoshi)","spacing":"generoso,whitespace","effects":"nenhum ou sutil"},"Tech":{"ref":"Vercel,Supabase","colors":"bg escuro,gradientes,accent vibrante","font":"Sans moderna (Geist,Inter)","spacing":"moderado","effects":"gradientes,glow,grid"},"Enterprise":{"ref":"Salesforce,HubSpot","colors":"azul,bg claro","font":"Profissional (SF Pro,Inter)","spacing":"estruturado","effects":"shadows,bordas"},"Bold":{"ref":"Stripe,Figma","colors":"contrastes,gradientes marcantes","font":"Display bold (Clash,Cabinet)","spacing":"dramático","effects":"animações,3D,glassmorphism"}}}

**Detalhes completos:** [aesthetics.md](aesthetics.md)

---

## Copy para SaaS

### Headlines que Convertem

```markdown
## Padrões de Título

# [Resultado] sem [Dor]
→ "Gerencie projetos sem planilhas"

# [Verbo] seu [Objeto] em [Tempo]
→ "Lance seu SaaS em semanas"

# O [Categoria] que [Diferencial]
→ "O CRM que sua equipe vai usar"

# [Número] [Benefício] com [Produto]
→ "3x mais leads com automação"

# Pare de [Dor]. Comece a [Benefício].
→ "Pare de perder clientes. Comece a reter."
```

### Subtítulos

```markdown
## Padrões de Subtítulo

# [Produto] ajuda [Público] a [Benefício] usando [Método].
→ "EasyFlow ajuda PMEs a organizar processos usando automação simples."

# [Benefício 1], [Benefício 2] e [Benefício 3] — tudo em um lugar.
→ "Tarefas, projetos e comunicação — tudo em um lugar."

# Sem [Objeção 1]. Sem [Objeção 2]. Apenas [Benefício].
→ "Sem setup complexo. Sem treinamento. Apenas resultados."
```

### CTAs que Funcionam

```markdown
## CTAs Primários (Alta intenção)
- "Começar grátis"
- "Testar por 14 dias"
- "Criar conta gratuita"
- "Ver demo"

## CTAs Secundários (Baixa fricção)
- "Ver como funciona"
- "Explorar recursos"
- "Falar com vendas"
- "Ver preços"
```

---

## Elementos de Confiança

### Badges de Segurança
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

### Stats de Prova Social
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
  <div>
    <div className="text-4xl font-bold">10k+</div>
    <div className="text-muted-foreground">Usuários ativos</div>
  </div>
  <div>
    <div className="text-4xl font-bold">500+</div>
    <div className="text-muted-foreground">Empresas</div>
  </div>
  <div>
    <div className="text-4xl font-bold">99.9%</div>
    <div className="text-muted-foreground">Uptime</div>
  </div>
  <div>
    <div className="text-4xl font-bold">4.9</div>
    <div className="text-muted-foreground">Rating G2</div>
  </div>
</div>
```

---

## Workflow

1. **Definir** produto + público + diferencial
2. **Escolher** estética (Minimal/Tech/Enterprise/Bold)
3. **Montar** seções usando os templates
4. **Adaptar** copy para o contexto
5. **Revisar** mobile-first

---

## Checklist de Conversão

```markdown
## Hero
- [ ] Título comunica valor em < 6 palavras
- [ ] Subtítulo explica o "como"
- [ ] CTA primário visível sem scroll
- [ ] Screenshot/demo do produto
- [ ] Social proof rápido (logos ou stats)

## Pricing
- [ ] 3 planos máximo
- [ ] Plano recomendado destacado
- [ ] Preço anual com desconto
- [ ] Lista de features por plano
- [ ] FAQ abaixo

## Trust
- [ ] Logos de clientes
- [ ] Testimonials com foto + cargo
- [ ] Badges de segurança
- [ ] Stats de uso

## Mobile
- [ ] Touch targets 44px+
- [ ] Texto legível sem zoom
- [ ] CTA sticky no mobile
- [ ] Imagens otimizadas
```

---

## Arquivos de Referência

{"files":{"sections/hero.md":"5 variações de hero section","sections/features.md":"Bento, grid, showcase","sections/pricing.md":"Tabelas de preço","sections/social-proof.md":"Logos, testimonials, stats","sections/cta.md":"CTAs finais","aesthetics.md":"Paletas completas"}}
