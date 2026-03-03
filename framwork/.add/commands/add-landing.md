# Landing Page Builder

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English. Documents in user's language.

> **OUTPUT:** Production-ready code, not documentation.

Specialized builder for high-conversion SaaS landing pages. Creates responsive, mobile-first landing pages using templates, copy patterns, and aesthetic frameworks.

---

## Spec

```json
{"gates":["skill_loaded","context_collected","sections_selected","aesthetic_selected"],"order":["load_skill","collect_context","load_templates","generate_code","validate_mobile","output"],"outputs":{"landing_page":"apps/frontend/src/pages/landing.tsx"},"shortcuts":{"minimal":"tech_minimal","tech":"tech_dark","enterprise":"tech_enterprise","bold":"tech_bold","url":"analyze_existing"}}
```

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Load skill                → EXECUTE FIRST
STEP 2: Collect context           → IF insufficient: ASK user
STEP 3: Load templates            → BASED ON selected sections
STEP 4: Generate code             → APPLY aesthetic + copy patterns
STEP 5: Validate mobile-first     → VERIFY responsive checklist
STEP 6: Output                    → DELIVER complete code
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF SKILL NOT LOADED:
  ⛔ DO NOT USE: Write to create landing page
  ⛔ DO NOT: Generate code without skill reference
  ⛔ DO: Execute cat .add/skills/landing-page-saas/SKILL.md FIRST

IF CONTEXT INCOMPLETE:
  ⛔ DO NOT USE: Write without product/audience info
  ⛔ DO NOT: Generate generic placeholder code
  ⛔ DO: Collect required information from user

IF TEMPLATES NOT LOADED:
  ⛔ DO NOT USE: Write code without section templates
  ⛔ DO: Load templates for selected sections from .add/skills/landing-page-saas/sections/

IF AESTHETIC NOT SELECTED:
  ⛔ DO NOT: Mix multiple aesthetics in same page
  ⛔ DO: Apply single consistent aesthetic (Minimal/Tech/Enterprise/Bold)

ALWAYS:
  ⛔ DO NOT: Generate documentation or specifications
  ⛔ DO NOT: Create non-responsive code
  ⛔ DO: Generate production-ready TSX code
  ⛔ DO: Apply mobile-first principles
```

---

## STEP 1: Load Skill Reference (EXECUTE FIRST)

**Load the landing page skill:**

```bash
cat .add/skills/landing-page-saas/SKILL.md
```

**This skill contains:**
- Prompt framework
- Section vocabulary (Hero, Features, Pricing, etc.)
- Copy patterns (headlines, CTAs)
- Conversion checklist
- Template variations

**⛔ IF SKILL FILE MISSING:** Stop and inform user that skill reference is required.

---

## STEP 2: Collect Context (IF insufficient)

**IF user provided complete context:** Skip to STEP 3.

**IF context incomplete, collect information:**

```markdown
## Let's build your landing page!

Need the following information:

1. **Product:** Name and value proposition in 1 line
   → Example: "EasyFlow - Process management for SMBs"

2. **Audience:** Who buys? (role, company, main pain point)
   → Example: "SMB owners who waste time on spreadsheets"

3. **Sections:** Which to include?
   - [ ] Hero
   - [ ] Logo Cloud (clients)
   - [ ] Features
   - [ ] Social Proof (testimonials/stats)
   - [ ] Pricing
   - [ ] FAQ
   - [ ] Final CTA

4. **Aesthetic:** Which visual direction?
   - **Minimal** (Notion, Linear) - Clean, professional
   - **Tech** (Vercel, Supabase) - Dark mode, gradients
   - **Enterprise** (Salesforce) - Trustworthy blue, structured
   - **Bold** (Stripe, Figma) - Strong gradients, memorable

5. **Differentiator:** What makes it unique vs competitors?
```

**⛔ DO NOT proceed without:**
- Product name + value proposition
- Target audience
- Selected sections (minimum: Hero + CTA)
- Chosen aesthetic

---

## STEP 3: Load Templates (BASED ON selected sections)

**For EACH selected section, load the corresponding template:**

```bash
# Hero
cat .add/skills/landing-page-saas/sections/hero.md

# Features
cat .add/skills/landing-page-saas/sections/features.md

# Pricing
cat .add/skills/landing-page-saas/sections/pricing.md

# Social Proof
cat .add/skills/landing-page-saas/sections/social-proof.md

# CTA
cat .add/skills/landing-page-saas/sections/cta.md

# Selected aesthetic
cat .add/skills/landing-page-saas/aesthetics.md
```

**Extract from templates:**
- Section variations available
- Copy patterns for each variation
- Component structure
- Styling guidelines

---

## STEP 4: Generate Code (APPLY aesthetic + copy patterns)

### 4.1 File Structure

**Create landing page file:**

```
apps/frontend/src/pages/landing.tsx
```

**OR if separate from main app:**

```
apps/frontend/src/pages/home.tsx
```

### 4.2 Code Generation Process

**For EACH selected section:**

1. **Select variation** most suitable from template
2. **Adapt copy** using patterns from skill
3. **Apply aesthetic** (colors, fonts, spacing)
4. **Generate code** complete and functional

### 4.3 Component Structure

```tsx
// apps/frontend/src/pages/landing.tsx

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
// ... other imports

// Sections as internal components or imported
function HeroSection() { /* ... */ }
function LogoCloud() { /* ... */ }
function FeaturesSection() { /* ... */ }
function TestimonialsSection() { /* ... */ }
function PricingSection() { /* ... */ }
function FAQSection() { /* ... */ }
function CTASection() { /* ... */ }
function Footer() { /* ... */ }

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <LogoCloud />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
```

### 4.4 Code Requirements

**MUST include:**
- Responsive layout (mobile-first)
- shadcn/ui components from `@/components/ui/`
- Consistent aesthetic (single theme)
- Clear placeholders for real content
- Accessibility attributes
- Loading optimization (lazy loading images)

**Example placeholder:**
```tsx
{/* TODO: Replace with real logo */}
<img src="/placeholder-logo.svg" alt="Logo" />
```

---

## STEP 5: Validate Mobile-First (VERIFY responsive checklist)

**Execute mobile-first checklist:**

```markdown
## Mobile-First Checklist

### Layout
- [ ] All sections have responsive padding (px-4 md:px-6 lg:px-8)
- [ ] Grids collapse correctly (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- [ ] Text is readable (text-base md:text-lg)
- [ ] Images are responsive (w-full, aspect-ratio)

### Touch
- [ ] Buttons have minimum height 44px (h-11 or h-12)
- [ ] Links have adequate touch area
- [ ] Inputs have font-size 16px+ (prevents iOS zoom)

### CTA
- [ ] Sticky CTA exists on mobile
- [ ] CTAs are visible without excessive scroll

### Performance
- [ ] Images have loading="lazy"
- [ ] Fonts are optimized for loading
- [ ] Animations respect prefers-reduced-motion
```

**⛔ IF any checklist item fails:**
- ⛔ DO NOT deliver code
- ⛔ DO: Fix issues before proceeding to STEP 6

---

## STEP 6: Output (DELIVER complete code)

**Deliver the complete code:**

```markdown
## ✅ Landing Page Created!

**File:** `apps/frontend/src/pages/landing.tsx`

**Sections included:**
- Hero (variation: [X])
- Features (variation: [X])
- Pricing (variation: [X])
- ...

**Aesthetic:** [Minimal/Tech/Enterprise/Bold]

**To use:**
1. Copy code to file
2. Add route in `routes.tsx`
3. Replace placeholder images with real ones
4. Adjust copy for your product

**Suggested next steps:**
- Add analytics (Google Analytics, Plausible)
- Configure meta tags for SEO
- Test on real devices
- Create A/B test version of hero
```

---

## Shortcuts

**Shortcut commands trigger preset configurations:**

| Command | Action |
|---------|--------|
| `/landing minimal` | Create with Minimal aesthetic |
| `/landing tech` | Create with Tech aesthetic |
| `/landing enterprise` | Create with Enterprise aesthetic |
| `/landing bold` | Create with Bold aesthetic |
| `/landing [url]` | Analyze existing landing and suggest improvements |

**Execution:**
- Parse shortcut
- Skip context collection for aesthetic
- Proceed to STEP 2 with preset aesthetic

---

## Usage Examples

### Basic Usage
```
/landing

> Product: TaskFlow - Task manager for remote teams
> Audience: Remote team managers
> Sections: Hero, Features, Pricing, CTA
> Aesthetic: Minimal
```

### With Context
```
/landing tech

Create a landing page for my analytics SaaS.
- Name: MetricsPro
- Audience: CTOs and dev leads
- Focus on: real-time dashboards, API-first
```

### Improve Existing
```
/landing

Analyze my current landing at apps/frontend/src/pages/home.tsx
and suggest conversion improvements.
```

---

## Rules

ALWAYS:
- Load skill reference BEFORE generating code
- Generate production-ready TSX code
- Apply mobile-first responsive design
- Use copy patterns from skill for headlines and CTAs
- Apply single consistent aesthetic throughout
- Use shadcn/ui components from @/components/ui/
- Mark placeholders clearly with TODO comments
- Validate mobile-first checklist before delivery

NEVER:
- Generate documentation or specifications instead of code
- Create non-responsive code
- Mix multiple aesthetics in same page
- Use generic placeholders without TODO markers
- Skip skill loading step
- Generate code without sufficient context
- Proceed without selected aesthetic
- Ignore mobile-first requirements

---

## Error Handling

| Error | Action |
|-------|--------|
| Skill file not found | Stop and inform user |
| Context incomplete | Collect missing information from user |
| Template file missing | Use fallback template or inform user |
| No sections selected | Default to Hero + Features + CTA |
| No aesthetic selected | Ask user to choose |
| Mobile checklist fails | Fix issues before delivery |
| Existing landing analysis | Read file, analyze structure, suggest improvements |
