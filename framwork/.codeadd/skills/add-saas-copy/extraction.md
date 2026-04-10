# Context Extraction

How to extract project information to generate copy.

---

## Data Sources

### 1. README.md (Primary)

**Read first.** Usually contains:

| Section | What to extract |
|---------|----------------|
| Title/Badge | Product name |
| Initial description | Value proposition |
| Features/Highlights | Main features |
| Getting Started | Setup complexity |
| Screenshots | Interface type |

**Extraction example:**

```markdown
# EasyFlow

> Process management for SMBs without complexity

## Features
- Visual Kanban
- No-code automations
- Real-time reports

## Getting Started
npm install && npm start
```

**Extracted:**
- Name: EasyFlow
- Proposition: Process management for SMBs without complexity
- Features: Kanban, automations, reports
- Setup: Simple (1 command)

---

### 2. docs/product.md (If exists)

**Prioritize over README** — usually more complete.

| Field | Where to find |
|-------|--------------|
| Product vision | "Vision" or "About" section |
| Target audience | "Target" or "Users" section |
| Problem it solves | "Problem" section |
| Differentials | "Differentiators" section |

---

### 3. docs/features/ or features/

**Read about.md files for each feature.**

| Extract | Purpose |
|---------|---------|
| Feature name | Features list |
| Problem it solves | Audience pains |
| Main benefit | Sales arguments |

---

### 4. package.json

**Structured data:**

```json
{
  "name": "easyflow",
  "description": "Process management for SMBs",
  "keywords": ["workflow", "automation", "kanban"]
}
```

| Field | What to extract |
|-------|----------------|
| name | Technical name |
| description | Short description |
| keywords | Categories/tags |
| dependencies | Stack (React, NestJS, etc) |

---

## Fallback Questionnaire

**IF project poorly documented (< 3 fields extracted):**

```markdown
## Required Information

I couldn't extract enough context from the project. I need:

1. **Product name:**
   > What is the product called?

2. **What it does (1 sentence):**
   > What is the main problem it solves?

3. **For whom:**
   > Who is the ideal customer? (role, company, situation)

4. **3 main features:**
   > What can the user do with the product?

5. **Why different:**
   > What makes it unique vs alternatives?
```

---

## Feature → Benefit Mapping

**Technical features need to become sales benefits.**

| Technical Feature | Benefit (for copy) |
|------------------|--------------------|
| "RESTful API" | "Integrates with your tools" |
| "Real-time dashboard" | "See everything happening live" |
| "Configurable automations" | "Automate without programming" |
| "Multi-tenant" | "Each client isolated with security" |
| "SSO/SAML" | "Single login for the whole company" |
| "Webhooks" | "Receive alerts wherever you prefer" |
| "Role-based access" | "Control who sees what" |

---

## Extraction Checklist

```markdown
## Required
- [ ] Product name
- [ ] Description (1-2 sentences)
- [ ] 3+ features
- [ ] Inferred audience

## Desirable
- [ ] Tech stack
- [ ] Setup complexity
- [ ] Interface type (web, mobile, CLI)
- [ ] Business model (SaaS, self-hosted)

## If not found
- [ ] Use fallback questionnaire
- [ ] Mark fields as "to validate"
```
