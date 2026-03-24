# Landing Page Builder

> **OUTPUT:** Production-ready code, not documentation.

Specialized builder for high-conversion SaaS landing pages. Creates responsive, mobile-first landing pages using templates, copy patterns, and aesthetic frameworks.

---

## Spec

```json
{"outputs":{"landing_page":"apps/frontend/src/pages/landing.tsx"},"shortcuts":{"minimal":"tech_minimal","tech":"tech_dark","enterprise":"tech_enterprise","bold":"tech_bold","url":"analyze_existing"}}
```

---

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (iniciante → explain why; avancado → essentials only).

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
STEP 1: Load skill                → EXECUTE FIRST
STEP 2: Collect context           → IF insufficient: ASK user
STEP 3: Load templates            → BASED ON selected sections
STEP 4: Generate code             → APPLY aesthetic + copy patterns
STEP 5: Validate mobile-first     → VERIFY responsive checklist
STEP 6: Output                    → DELIVER complete code

**⛔ ABSOLUTE PROHIBITIONS:**

IF SKILL NOT LOADED:
  ⛔ DO NOT USE: Write to create landing page
  ⛔ DO NOT: Generate code without skill reference
  ✅ DO: Load skill add-landing-page-saas FIRST

IF CONTEXT INCOMPLETE:
  ⛔ DO NOT USE: Write without product/audience info
  ⛔ DO NOT: Generate generic placeholder code
  ✅ DO: Collect required information from user

IF TEMPLATES NOT LOADED:
  ⛔ DO NOT USE: Write code without section templates
  ✅ DO: Load templates for selected sections

IF AESTHETIC NOT SELECTED:
  ⛔ DO NOT: Mix multiple aesthetics in same page
  ✅ DO: Apply single consistent aesthetic

ALWAYS:
  ⛔ DO NOT: Generate documentation instead of code
  ⛔ DO NOT: Create non-responsive code
  ✅ DO: Generate production-ready TSX code
  ✅ DO: Apply mobile-first principles

---

## STEP 1: Load Skill Reference

Load skill `add-landing-page-saas`.

**This skill contains:**
- Prompt framework, section vocabulary (Hero, Features, Pricing, etc.)
- Copy patterns (headlines, CTAs), conversion checklist, template variations

**IF SKILL FILE MISSING:** Stop and inform user.

---

## STEP 2: Collect Context

**IF user provided complete context:** Skip to STEP 3.

**IF context incomplete, ask user for:**
- **Product:** Name and value proposition in 1 line
- **Audience:** Who buys? (role, company, main pain point)
- **Sections:** Hero, Logo Cloud, Features, Social Proof, Pricing, FAQ, Final CTA
- **Aesthetic:** Minimal (Notion, Linear) / Tech (Vercel, Supabase) / Enterprise (Salesforce) / Bold (Stripe, Figma)
- **Differentiator:** What makes it unique vs competitors?

**DO NOT proceed without:** Product name + value proposition, target audience, selected sections (minimum: Hero + CTA), chosen aesthetic.

---

## STEP 3: Load Templates

For EACH selected section, load the corresponding template from skill `add-landing-page-saas` (`sections/` directory) and the aesthetic reference from `aesthetics.md`.

**Extract from templates:**
- Section variations available
- Copy patterns for each variation
- Component structure
- Styling guidelines

---

## STEP 4: Generate Code

### 4.1 File Structure

Create landing page at `apps/frontend/src/pages/landing.tsx` (or `home.tsx` if separate from main app).

### 4.2 Code Generation Process

For EACH selected section:
1. **Select variation** most suitable from template
2. **Adapt copy** using patterns from skill
3. **Apply aesthetic** (colors, fonts, spacing)
4. **Generate code** complete and functional

### 4.3 Component Structure

Build `LandingPage` as a single-file page with internal section components (HeroSection, LogoCloud, FeaturesSection, TestimonialsSection, PricingSection, FAQSection, CTASection, Footer) composed inside a `min-h-screen` container.

### 4.4 Code Requirements

**MUST include:**
- Responsive layout (mobile-first)
- shadcn/ui components from `@/components/ui/`
- Consistent aesthetic (single theme)
- Clear placeholders marked with `{/* TODO: ... */}` comments
- Accessibility attributes
- Loading optimization (lazy loading images)

---

## STEP 5: Validate Mobile-First

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

**IF any checklist item fails:** Fix issues before proceeding to STEP 6.

---

## STEP 6: Output

Deliver the complete code. Summarize sections included, aesthetic applied, and list next steps (add route, replace placeholders, configure SEO/analytics).

**Next Steps:** Reference skill `add-ecosystem` Main Flows section for context-aware next command suggestion.

---

## Shortcuts

| Command | Action |
|---------|--------|
| `/landing minimal` | Create with Minimal aesthetic |
| `/landing tech` | Create with Tech aesthetic |
| `/landing enterprise` | Create with Enterprise aesthetic |
| `/landing bold` | Create with Bold aesthetic |
| `/landing [url]` | Analyze existing landing and suggest improvements |

**Execution:** Parse shortcut, skip aesthetic collection, proceed to STEP 2 with preset aesthetic.

---

## Usage Example

```
/landing tech

Create a landing page for MetricsPro - real-time analytics for dev teams.
Audience: CTOs and dev leads. Sections: Hero, Features, Pricing, CTA.
Focus on: real-time dashboards, API-first.
```

---

## Rules

ALWAYS:
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
- Generate code without sufficient context

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
