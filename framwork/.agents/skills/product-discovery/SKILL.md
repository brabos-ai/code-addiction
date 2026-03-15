<!-- AUTO-GENERATED - DO NOT EDIT. Source: framwork/.codeadd/skills/product-discovery/SKILL.md -->
---
name: product-discovery
description: Use when starting new project - discovers founder profile and product blueprint through guided questionnaire, creates docs/owner.md and docs/product.md
---

# Product Discovery

Conduz discovery rápido do fundador e produto em 5-10 minutos, criando perfil de comunicação e blueprint de desenvolvimento.

**Princípio:** Speed over completeness. Inferir baseado em padrões de mercado. Simplificar para MVP. Não sobrecarregar.

---

## Spec

### WhenToUse
{"triggers":["starting new project","first time setup","need founder profile","need product blueprint","no docs/owner.md","no docs/product.md"],"auto-loaded-by":["/add when new project"],"creates":["docs/owner.md","docs/product.md"]}

### Phase1_FounderProfile
{"goal":"identify technical level + communication preferences","duration":"2-3 min","questions":["experiência com desenvolvimento (4 opções)","preferência de explicação (3 estilos)","papel no projeto (4 opções)"],"inference":{"leigo":"Q1=a AND Q3=a,b","básico":"Q1=b AND Q3=a,b","intermediário":"Q1=c AND Q3=a,b","técnico":"Q1=d OR Q3=c"},"style":{"simplificado":"Q2=a","balanceado":"Q2=b","técnico":"Q2=c"},"output":"docs/owner.md"}

### Phase2_ProductBlueprint
{"goal":"understand product idea and create MVP blueprint","duration":"5-10 min","opening":"single open question (what do you want to build?)","depth-eval":{"shallow":"<20 words → ask follow-up 3 questions","medium":"20-100 words → proceed with targeted questions","rich":"100+ words → proceed to inference"},"inference-based-on":["market patterns (how 80% similar products work)","MVP mentality (minimum to validate)","user context (what they emphasized)","common sense (first-time user expectations)"],"infer":["product description","target audience","main problem solved","MVP features (4-6 max)","cut features (for later)","user types (admin/client/team)","integrations needed (Stripe/Calendar/WhatsApp)","roadmap phases (core/essential/nice-to-have)"],"validate":"show inference, iterate until user approves","output":"docs/product.md"}

### MarketPatterns
{"agendamento":"2 users (admin+cliente), integração calendário","ecommerce":"2 users (admin+cliente), pagamentos obrigatório","saas-b2b":"multi-tenant, 3 users (owner,admin,member)","marketplace":"3 users (admin,vendedor,comprador), pagamentos","gestão-interna":"1-2 users (admin,equipe?), sem integração","cursos":"2-3 users (admin,instrutor?,aluno), pagamentos","delivery":"3 users (admin,entregador,cliente), geolocalização"}

### DocumentationFormat
{"pre-checkpoint":"load .codeadd/skills/documentation-style/SKILL.md","format":"hybrid (human-readable + token-efficient)","sections":{"owner.md":["identificação","nível técnico","preferências comunicação","contexto projeto"],"product.md":["o que é","para quem","problema que resolve","MVP features","cut features","user types","integrations","roadmap phases"]}}

### Commit
{"owner":"git commit -m 'docs: create founder profile...'","product":"git commit -m 'docs: create product blueprint for MVP...'"}

### NextSteps
{"guide":"suggest /brainstorm or /feature for first roadmap item"}

---

## Critical Rules

**DO:**
- Be QUICK (5-10 min total)
- INFER from market patterns
- ASK for more details if response shallow (<20 words)
- Simplify for MVP (max 6 features)
- Validate before documenting
- Use simple, non-technical language
- Load documentation-style skill before writing

**DO NOT:**
- Ask about tech/stack/architecture
- Include >6 features in MVP
- Create long question lists
- Document before user validates
- Use technical jargon
- Infer without enough context
- Make process feel like form

---

## Workflow

### Founder Profile (2-3 min)
1. Check if exists: Read docs/owner.md
2. If exists: ask to update or skip
3. If new: ask 3 questions
4. Infer technical level + communication style
5. Document in docs/owner.md
6. Commit

### Product Blueprint (5-10 min)
1. Check if exists: Read docs/product.md
2. If exists: ask to update or restart
3. Ask single open question: "o que você quer construir?"
4. Evaluate depth: shallow/medium/rich
5. If shallow: ask 3 follow-up questions
6. Infer EVERYTHING using market patterns
7. Present validation: product/audience/problem/features/users/integrations/roadmap
8. Iterate until user approves
9. Load documentation-style skill
10. Document in docs/product.md
11. Commit
12. Suggest next steps (/add-feature)

---

## Example Inference

User: "Quero um app para agendar horários de salão de beleza"

**Inferred:**
- Product: Sistema de agendamento para salões
- Audience: Donos de salão + clientes finais
- Problem: Perder clientes por desorganização, tempo em agendamentos manuais
- MVP Features: (1) Cadastro serviços/horários (2) Clientes agendam online (3) Notificações WhatsApp (4) Painel admin visualiza agenda
- Cut: Pagamento online, múltiplas unidades, relatórios avançados
- Users: 2 tipos (admin salão, cliente final)
- Integrations: WhatsApp (notificações), Google Calendar (opcional)
- Roadmap: Fase 1 (agenda básica), Fase 2 (notificações), Fase 3 (relatórios)

**Present for validation, iterate if needed.**
