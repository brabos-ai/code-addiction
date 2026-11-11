---
path: bounded
topic: brainstorm-greenfield
doc: none
delivery: confirm
ticket: 0064B
---

## Decided

1. Problem: on a repo with no code and no `AGENTS.md`, nothing helps the user decide language, tenancy, layering, validation and ORM, and nothing records those decisions. `/add-brainstorm` reads `AGENTS.md` as its pattern source (`framwork/.codeadd/commands/add-brainstorm.md:23` and `:120`) and finds nothing. `/add-wiki` has no code to discover. There is a second gap: the first command of `/add-brainstorm` (`node .codeadd/scripts/status.cjs`, `:103`) fails on a fresh repo. I tested this on main `dfe98bb0` (v1.5.13). After `git init` with no commit it prints `ERROR:no main branch found` and exits 2 (`scripts/status.cjs:531`). Outside a git repo it prints `ERROR:not a git repository` and exits 1 (`:517`). With one commit it works and prints `WIKI:absent` and `REC:/add-new to start`.
2. Shape: a branch inside `/add-brainstorm`. No new command, no new top-level STEP, no scaffolding. It adds one sub-step, `### STEP add-brainstorm.greenfield-foundations`, inside STEP `add-brainstorm.explore`. The sub-step goes after `add-brainstorm.draft-objective-first` (`:224`) and before `add-brainstorm.sections-close` (`:241`). The explore line of the STEP index (`:37`) gains "(+ greenfield foundations when GREENFIELD=yes)".
3. Trigger, evaluated once in STEP `add-brainstorm.load-context` (`:100-139`): `GREENFIELD=yes` only when both of these hold. (a) There is no `AGENTS.md` at the project root. (b) There is no source file. To check (b), list tracked and untracked-not-ignored files (`git ls-files --cached --others --exclude-standard`, or a plain directory listing when the folder is not a git repo). Then drop dot-prefixed paths (`.codeadd/`, `.claude/`, `.cursor/`, `.agents/`, `.agent/`, `.codex/`, `.opencode/`, `.zcode/`, `.git*`, `.github/`), `docs/`, root `*.md` and `LICENSE*`. If nothing remains, (b) holds. The filter has the same shape as the FILES filter `status.cjs` already uses (`:789-790`). If either condition fails, the flow does not change at all. Code without `AGENTS.md` keeps the normal flow, and the existing `/add-wiki` hint covers it. `AGENTS.md` without code also keeps the normal flow, because the decisions already exist. The command checks this itself. `status.cjs` is not changed.
4. `status.cjs` failure is tolerated on greenfield only. When `GREENFIELD=yes`, exit 1 (`not a git repository`) and exit 2 (`no main branch found`) are not fatal. The step continues with BRANCH, WIKI and PROJECT_DOCS unknown and records "no git history yet". The final report then tells the user to run `git init` and make a first commit before `/add-new`, because `/add-new` runs `status.cjs` too. The brainstorm never runs git commands itself. Outside greenfield, a `status.cjs` failure is handled as it is today.
5. Path: greenfield is always `architectural`, because the classify rule (`:168`, `:199`) says that with no existing flow to modify, the work is architectural. The classify line reads `Path: architectural (greenfield): stack foundations first, then full exploration.` The approval, the brainstorm document, the self-review and the intent file keep their current rules.
6. Questions: one "foundations" question with five items. Each item carries a recommendation and a named precedent (the naming rule of STEP `add-brainstorm.bring-outside-in`, `:281-304`):
   1. Language/runtime and framework for each app (backend, frontend or both).
   2. Tenancy: single-tenant or multi-tenant. Multi-tenant also needs the key name (for example `account_id` or `tenant_id`) and how it is enforced (app-layer filter or database RLS).
   3. Layering/architecture style: the simplest style that fits, for example feature folders or vertical slices. DI container only when the framework provides one. Barrel files off by default.
   4. Validation library.
   5. Data access/ORM and database.

   <p>
   The items depend on each other (the ORM depends on the language), so they go out as one recommended stack pack. The user accepts it whole or changes single items, and it counts as one question under the human cadence (`fallbacks/agent-mode.add-brainstorm.cadence.md`, "ONE question"). A follow-up goes only to an item the user changed, still one per turn. In agent mode the five items go into the numbered batch with a RECOMMENDED line each (`fragments/agent-mode/add-brainstorm.md`, sections `cadence` and `structured-ask`). When the request already names a choice, that item is pre-filled and only confirmed. Stop kind: deciding.
   </p>
7. Consulting: load `{{skill:add--backend-architecture/SKILL.md}}` and/or `{{skill:add--frontend-architecture/SKILL.md}}`, depending on the apps chosen in item 1, as consultants. Their over-engineering lists act as the gate on every recommendation: backend "Over-Engineering Signals" (`skills/add--backend-architecture/SKILL.md:63`) and frontend "Over-engineering signals" (`skills/add--frontend-architecture/SKILL.md:54`). Each recommendation is the simplest option the drafted objective needs, and no layer or pattern goes in without a present need. Both skills, plus `add--agents-md-style`, are declared `(conditional)` in the `<!-- uses: -->` block (`:3-15`).
8. Output 1, the decisions: `.codeadd/wiki/conventions.md`, section `## Stack Conventions`, in the exact format `wiki-stack-conventions` defines. Its items are tenancy, DI + registration, barrels, layers, validation, ORM and entity language. Every row carries `source: decided`, and its evidence is `BRN-<slug>` instead of `path:line`. If `wiki-stack-conventions` ships the format without a source marker, this card adds `source: detected | decided` to the section spec in `skills/add--architecture-discovery/spine-analyzer.md`, where that card puts the section. The page frontmatter follows the Wiki Page Contract (`skills/add--architecture-discovery/SKILL.md:191-203`):
   - `id: wiki/conventions`, `type: reference`, `area: conventions`.
   - `sources:` holds the globs of the planned source roots from item 1 (for example `src/**`, `apps/**`). Then `add--wiki-maintenance` STEP 3 (`skills/add--wiki-maintenance/SKILL.md:59-60`, "candidate iff changed files ∩ sources") selects the page as soon as code lands.
   - `commit:` is the current short sha, or `none` when there is no commit yet.
   - `generated:` is today's date.
9. Output 2, the wiki gate: readers only consult the wiki when `WIKI:present`, and `status.cjs` prints that only when `.codeadd/wiki/index.md` exists (`status.cjs:798-802`; readers include `add-build.md:680`, `add-review.md:321` and `add-hotfix.md:395`). Writing only `conventions.md` would leave it unread. So the branch also writes:
   - a minimal `.codeadd/wiki/index.md` in the hub format (`commands/add-wiki.md:509-525`), linking only `conventions.md`, with its description taken from the frontmatter;
   - `.codeadd/wiki/.meta.json` as `{"updatedAt":"<ISO>","command":"brainstorm-greenfield"}`, adding `gitHead` only when HEAD exists.

   <p>
   With no `gitHead`, `/add-wiki update` falls through to evidence tier 2, `--since updatedAt` (`add--wiki-maintenance/SKILL.md:48-50`), so every file committed later is evidence. `INSTRUCTIONS.md` is never written, because it is user-owned (`add--wiki-maintenance/SKILL.md:29`).
   </p>
10. Output 3: a minimal `AGENTS.md` per `{{skill:add--agents-md-style/SKILL.md}}`. First comes the skill's Migration (`node .codeadd/scripts/migrate-context-files.cjs`, skill section "Migration — Run It Before Any Write", `:32`). Then the file gets:
    - `## Architecture Contract`: the planned apps table and the layer rule from item 3.
    - `## Technical Spec`: compact JSON of the decided stack.
    - The multi-tenancy critical rule line, only when the project is multi-tenant (`:74`).
    - The three managed blocks, verbatim: `codeadd-wiki`, `codeadd-style` and `codeadd-shell`, with the text from `commands/add-wiki.md:619-627` (shell) and `:662-706` (wiki, style).

    <p>
    It stays within the skill's line budget. With these blocks in place, a later `/add-wiki` replaces or appends in place, and `add-wiki.verify` (`:756-761`) passes without rework.
    </p>
11. When the files are written: after the approval only, when the user picks either Approve option at STEP `add-brainstorm.approval` (`:449`). They are written in STEP `add-brainstorm.write-intent-file` (`:477`), before the intent file. "Keep discussing" writes nothing. The hard-gate table "Two files may be written, and only these two" (`:77-83`) gains a greenfield row naming these four files (`conventions.md`, `index.md`, `.meta.json`, `AGENTS.md`) and its title is reworded to match. The ban on application code (`:43-60`, `:550`) does not change: no source files, no `package.json`, no installs, no `git init`.
12. Existing wiki: if `.codeadd/wiki/conventions.md` already exists (for example, `/add-wiki` already ran on the empty repo), the branch writes or replaces only the `## Stack Conventions` section. It adds the `index.md` link only when it is missing and touches no other page. By trigger rule 3a, `AGENTS.md` cannot already exist.
13. Later check against code: in `/add-wiki update` (`add--wiki-maintenance` STEP 5, `SKILL.md:64-75`) and in full `/add-wiki` (spine-analyzer, conventions section), a `source: decided` row is handled in one of three ways:
    - Code confirms it: the row becomes `detected` with `path:line`.
    - Code contradicts it: the row stays, gets marked `drift: <path:line>`, and the run reports it. The user made that decision, so a run never overwrites it silently.
    - No code yet: the row stays as it is.

    <p>
    This adds one rule to each of those two files.
    </p>
14. Brainstorm document and intent: the foundations go in as Key Decisions rows in the existing `Decision | Serves | Rationale` table of the `brainstorm` schema. The `brainstorm-intent` file carries them as decisions. No schema change. `/add-new` then reads them through `AGENTS.md` and the wiki like any other convention.
15. Agent mode: `framwork/.codeadd/agent-mode/result.schema.json` does not change. Its required keys (`v`, `status`, `stage`, `branch`, `commits`, `tests`, `pr`, `ci`, `ticket`, `next_step`, `needs_approval`, `reason`) do not list the files a run writes, and `branch` may be null. The foundations question is a deciding stop that ends as `needs-approval`, the same as any brainstorm question.
16. Listings: `skills/add--ecosystem/SKILL.md:130` (add-brainstorm row) gets the three conditional skills in its skills column, and its purpose gets ", decides stack foundations on an empty repo". `web/src/pages/docs.astro:215` ("Explore ideas (read-only)") gets the same short addition. `/add-help` reads the ecosystem map and needs no change.
17. Out of scope:
    - Scaffolding of any kind (`add--project-scaffolding` is removed by `remove-generic-skills`).
    - Changes to `status.cjs` (the empty-repo exit codes stay; this card only tolerates them).
    - A new command.
    - Planning the first feature (`/add-new` does that).
    - Any stack-specific default that `agnostic-dev-skills` removes.
18. Target: next release.
19. Acceptance criteria:
    - (a) On a temp repo with no code and no `AGENTS.md`, `/add-brainstorm` states `Path: architectural (greenfield)…`, asks the five-item foundations question with recommendations, and after approval writes `conventions.md` (with a `## Stack Conventions` section whose rows all say `source: decided`), `index.md`, `.meta.json`, `AGENTS.md` and the intent file. It writes nothing else.
    - (b) "Keep discussing" writes nothing.
    - (c) A repo with code, or with `AGENTS.md`, takes the unchanged flow.
    - (d) On a repo with `git init` and no commit, the brainstorm does not stop at `status.cjs` and the report tells the user to make a first commit.
    - (e) After greenfield, `status.cjs` prints `WIKI:present`.
    - (f) The `AGENTS.md` passes the managed-block checks in `add-wiki.md:756-761`.
    - (g) `add--wiki-maintenance` and `spine-analyzer` carry the decided-row rule from decision 13.
    - (h) `npm run build` and `npm run test:all` pass, including the artefact graph (`uses:` rows) and the slot fixtures; no slot is added.
20. Risks:
    - The stack pack may push users toward a default. Mitigation: every item names its precedent, every item can be edited, and the over-engineering gate applies.
    - A hand-written `index.md` may later disagree with a full `/add-wiki` hub. Accepted, because full generation rewrites the hub from frontmatter (`add-wiki.md:507`).
    - `decided` rows may go stale if the user never runs `/add-wiki`. Mitigation: `status.cjs` already prints `WIKI_STALE_COUNT:unknown` and the `/add-wiki update` hint when the wiki has no `gitHead` (`status.cjs:817-819`).
    - The branch depends on the `wiki-stack-conventions` format. Mitigation: decision 8 states the fallback.

## Open

None

## Card dependency

Depends on `wiki-stack-conventions` (section format and destination) and `agnostic-dev-skills` (the consulted skills are stack-neutral). `remove-generic-skills` removes `add--project-scaffolding`, which both architecture skills still mention (`add--backend-architecture/SKILL.md` and `add--frontend-architecture/SKILL.md`, `uses:` blocks). Blocks nothing.

## Board changes

- status: shaped
- title: Greenfield branch in /add-brainstorm (decide stack foundations on an empty repo)
- done_when: on a repo with no code and no AGENTS.md, /add-brainstorm takes the architectural path, asks one five-item foundations question (stack, tenancy, layering, validation, ORM) with recommendations backed by the architecture skills, and after approval writes .codeadd/wiki/conventions.md Stack Conventions (source: decided), a minimal wiki index.md + .meta.json and a minimal AGENTS.md with the managed blocks; Keep discussing writes nothing; non-greenfield repos are unchanged; an uncommitted fresh repo does not stop at status.cjs; /add-wiki update and full /add-wiki confirm or flag decided rows against code; build and test:all pass.
- paths: framwork/.codeadd/commands/add-brainstorm.md, framwork/.codeadd/skills/add--wiki-maintenance/SKILL.md, framwork/.codeadd/skills/add--architecture-discovery/spine-analyzer.md, framwork/.codeadd/skills/add--ecosystem/SKILL.md, web/src/pages/docs.astro
