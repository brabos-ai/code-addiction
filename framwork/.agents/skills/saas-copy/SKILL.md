<!-- AUTO-GENERATED - DO NOT EDIT. Source: framwork/.codeadd/skills/saas-copy/SKILL.md -->
---
name: saas-copy
description: Frameworks e templates de copy para landing pages SaaS - PAS, BAB, 4Us, F→B→O + templates de brief e copy sugerida
---

# SaaS Copy

Skill de **conhecimento de copywriting** para landing pages SaaS. Contém frameworks, templates e exemplos para transformar documentação técnica em argumentos de venda.

**Use para:** Referência de frameworks e templates de copy
**Não use para:** Executar workflow (use comando `/add-copy`)

**Relação:**
- `saas-copy` (skill) = Conhecimento, frameworks, templates
- `/add-copy` (comando) = Execução do workflow + geração de arquivos
- `landing-page-saas` (skill) = Aplicação visual da copy

---

## When to Use

- Consultar frameworks de copy (PAS, BAB, 4Us, F→B→O)
- Ver templates de Copy Brief e Copy Sugerida
- Entender como transformar features em benefícios
- Referência para validação de copy (morna vs afiada)

## When NOT to Use

- Para executar workflow completo → use `/add-copy`
- Para gerar seções visuais → use `landing-page-saas`
- Para email marketing ou ads (escopo diferente)

---

## Frameworks de Copy

| Framework | Uso | Estrutura |
|-----------|-----|-----------|
| **PAS** | Headlines | Problem → Agitate → Solution |
| **BAB** | Storytelling | Before → After → Bridge |
| **4Us** | Validação | Urgent, Unique, Ultra-specific, Useful |
| **F→B→O** | Features | Feature → Benefit → Outcome |

**Detalhes completos:** [formulas.md](formulas.md)

---

## Copy Morna vs Afiada

| Morna | Afiada | Técnica |
|-------|--------|---------|
| "Gerencie seus projetos" | "Pare de perder deadlines" | Dor > funcionalidade |
| "Software completo" | "Tudo que precisa, nada que não" | Especificidade |
| "Fácil de usar" | "Setup em 5 min, sem treinamento" | Prova concreta |
| "Qualidade garantida" | "99.9% uptime ou $100 de crédito" | Garantia com risco |
| "Atendimento 24/7" | "Resposta em 2h ou escala automática" | Compromisso mensurável |

**Mais exemplos:** [examples.md](examples.md)

---

## Template: Copy Brief

```markdown
## Copy Brief - [Nome do Produto]

### Proposta de Valor
[1 frase que resume o que entrega de único]

### Público-Alvo
- **Comprador:** [quem decide a compra]
- **Usuário:** [quem usa no dia a dia]
- **Empresa:** [porte, segmento]

### Dores (Antes)
1. [Dor específica com consequência]
2. [Dor específica com consequência]
3. [Dor específica com consequência]

### Benefícios (Depois)
1. [Transformação, não feature]
2. [Transformação, não feature]
3. [Transformação, não feature]

### Diferenciais
- vs [Alternativa 1]: [o que você tem que eles não]
- vs [Alternativa 2]: [o que você tem que eles não]
- vs "Fazer nada": [custo de não resolver]

### Objeções Mapeadas
| Objeção | Resposta |
|---------|----------|
| "[objeção comum]" | [resposta que remove fricção] |

### Prova Social
- Stats: [números reais]
- Clientes: [logos ou nomes]
- Resultados: [caso de sucesso]
```

---

## Template: Copy Sugerida

```markdown
## Copy Sugerida

### Headlines (escolha 1)
1. **[PAS]** "[Dor] está custando [consequência]. [Produto] resolve em [tempo]."
2. **[BAB]** "De [antes] para [depois]. [Produto] é a ponte."
3. **[Direto]** "[Benefício principal] sem [objeção principal]."

### Subtitles
1. "[Produto] ajuda [público] a [benefício] usando [método]."
2. "[Benefício 1], [benefício 2] e [benefício 3] — tudo em um lugar."
3. "Sem [objeção 1]. Sem [objeção 2]. Apenas [resultado]."

### CTAs
- **Primário:** "[Ação] grátis" / "Testar por [dias] dias"
- **Secundário:** "Ver como funciona" / "Falar com vendas"

### Stats (se disponíveis)
- [Número]+ [métrica] (ex: "10k+ usuários ativos")
- [Percentual]% [resultado] (ex: "99.9% uptime")
- [Tempo] [ação] (ex: "Setup em 5 min")

### Testimonial Framework
> "[Resultado específico com número] depois de usar [Produto]. [Benefício emocional]."
> — [Nome], [Cargo] na [Empresa]
```

---

## Fontes de Extração

O comando `/add-copy` usa estas fontes para análise automática:

| Fonte | O que extrair |
|-------|---------------|
| `README.md` | Nome, descrição, proposta de valor |
| `docs/product.md` | Visão do produto, público-alvo (priorizar) |
| `docs/features/` | Funcionalidades, benefícios |
| `package.json` | Nome, descrição, keywords |

**Detalhes:** [extraction.md](extraction.md)

---

## Perguntas de Validação

Perguntas que o comando `/add-copy` faz ao usuário:

1. **Dores do público:**
   > "O que dói no seu cliente ANTES de usar seu produto?"

2. **Diferenciais reais:**
   > "Por que escolheriam VOCÊ e não o concorrente?"

3. **Objeções comuns:**
   > "O que impede a pessoa de comprar?"

4. **Prova social:**
   > "Que números/resultados você tem?"

---

## Integração com Ecossistema

```
/add-copy [objetivo]
    ↓
docs/copy/CXXXX-[objetivo]/
    brief.md
    copy.md
    ↓
/add-landing (consome o brief)
    ↓
Landing page com copy afiada
```

---

## Arquivos de Referência

| Arquivo | Conteúdo |
|---------|----------|
| [extraction.md](extraction.md) | Como extrair contexto do projeto |
| [formulas.md](formulas.md) | PAS, BAB, 4Us, Feature→Benefit |
| [examples.md](examples.md) | Copy morna vs afiada, antes/depois |
