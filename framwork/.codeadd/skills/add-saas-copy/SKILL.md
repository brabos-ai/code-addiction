---
name: add-saas-copy
description: Copywriting frameworks and templates for SaaS landing pages - PAS, BAB, 4Us, F→B→O + brief and suggested copy templates
---

# SaaS Copy

**Copywriting knowledge** skill for SaaS landing pages. Contains frameworks, templates and examples to transform technical documentation into sales arguments.

**Use for:** Reference of copy frameworks and templates
**Do NOT use for:** Executing workflow (use command `/add-copy`)

**Relationship:**
- `saas-copy` (skill) = Knowledge, frameworks, templates
- `/add-copy` (command) = Workflow execution + file generation
- `landing-page-saas` (skill) = Visual application of copy

---

## When to Use

- Consulting copy frameworks (PAS, BAB, 4Us, F→B→O)
- Viewing Copy Brief and Suggested Copy templates
- Understanding how to transform features into benefits
- Reference for copy validation (lukewarm vs sharp)

## When NOT to Use

- To execute complete workflow → use `/add-copy`
- To generate visual sections → use `landing-page-saas`
- For email marketing or ads (different scope)

---

## Copy Frameworks

| Framework | Use | Structure |
|-----------|-----|-----------|
| **PAS** | Headlines | Problem → Agitate → Solution |
| **BAB** | Storytelling | Before → After → Bridge |
| **4Us** | Validation | Urgent, Unique, Ultra-specific, Useful |
| **F→B→O** | Features | Feature → Benefit → Outcome |

**Full details:** [formulas.md](formulas.md)

---

## Lukewarm vs Sharp Copy

| Lukewarm | Sharp | Technique |
|----------|-------|-----------|
| "Manage your projects" | "Stop missing deadlines" | Pain > functionality |
| "Complete software" | "Everything you need, nothing you don't" | Specificity |
| "Easy to use" | "Setup in 5 min, no training" | Concrete proof |
| "Guaranteed quality" | "99.9% uptime or $100 credit" | Risk-backed guarantee |
| "24/7 support" | "Response in 2h or auto-escalation" | Measurable commitment |

**More examples:** [examples.md](examples.md)

---

## Template: Copy Brief

```markdown
## Copy Brief - [Product Name]

### Value Proposition
[1 sentence summarizing what is uniquely delivered]

### Target Audience
- **Buyer:** [who decides the purchase]
- **User:** [who uses it daily]
- **Company:** [size, segment]

### Pains (Before)
1. [Specific pain with consequence]
2. [Specific pain with consequence]
3. [Specific pain with consequence]

### Benefits (After)
1. [Transformation, not feature]
2. [Transformation, not feature]
3. [Transformation, not feature]

### Differentials
- vs [Alternative 1]: [what you have that they don't]
- vs [Alternative 2]: [what you have that they don't]
- vs "Do nothing": [cost of not solving]

### Mapped Objections
| Objection | Response |
|-----------|----------|
| "[common objection]" | [response that removes friction] |

### Social Proof
- Stats: [real numbers]
- Clients: [logos or names]
- Results: [success case]
```

---

## Template: Suggested Copy

```markdown
## Suggested Copy

### Headlines (choose 1)
1. **[PAS]** "[Pain] is costing you [consequence]. [Product] solves it in [time]."
2. **[BAB]** "From [before] to [after]. [Product] is the bridge."
3. **[Direct]** "[Main benefit] without [main objection]."

### Subtitles
1. "[Product] helps [audience] to [benefit] using [method]."
2. "[Benefit 1], [benefit 2] and [benefit 3] — all in one place."
3. "No [objection 1]. No [objection 2]. Just [result]."

### CTAs
- **Primary:** "[Action] for free" / "Try for [days] days"
- **Secondary:** "See how it works" / "Talk to sales"

### Stats (if available)
- [Number]+ [metric] (e.g., "10k+ active users")
- [Percentage]% [result] (e.g., "99.9% uptime")
- [Time] [action] (e.g., "Setup in 5 min")

### Testimonial Framework
> "[Specific result with number] after using [Product]. [Emotional benefit]."
> — [Name], [Role] at [Company]
```

---

## Extraction Sources

The `/add-copy` command uses these sources for automatic analysis:

| Source | What to extract |
|--------|----------------|
| `README.md` | Name, description, value proposition |
| `docs/product.md` | Product vision, target audience (prioritize) |
| `docs/features/` | Features, benefits |
| `package.json` | Name, description, keywords |

**Details:** [extraction.md](extraction.md)

---

## Validation Questions

Questions the `/add-copy` command asks the user:

1. **Audience pains:**
   > "What hurts your customer BEFORE using your product?"

2. **Real differentials:**
   > "Why would they choose YOU and not the competitor?"

3. **Common objections:**
   > "What prevents people from buying?"

4. **Social proof:**
   > "What numbers/results do you have?"

---

## Ecosystem Integration

```
/add-copy [objective]
    ↓
docs/copy/CXXXX-[objective]/
    brief.md
    copy.md
    ↓
/add-landing (consumes the brief)
    ↓
Landing page with sharp copy
```

---

## Reference Files

| File | Content |
|------|---------|
| [extraction.md](extraction.md) | How to extract project context |
| [formulas.md](formulas.md) | PAS, BAB, 4Us, Feature→Benefit |
| [examples.md](examples.md) | Lukewarm vs sharp copy, before/after |
