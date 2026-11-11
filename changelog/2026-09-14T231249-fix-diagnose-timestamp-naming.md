# add.diagnose's report path, one shape instead of two

`/add.diagnose` told the user its report would land at `docs/diagnose/[NNNN]-[slug].md` (STEP 7.1)
and then wrote `docs/diagnose/<slug>.md` instead (STEP 8.3) — two different promises for the same
file, inside the same command. Neither form matched the framework's own `YYYY-MM-DDTHHMMSS-<slug>.md`
convention, already used by `docs/plans/` and `docs/brainstorming/` for the same kind of local,
possibly-repeated document.

## What changed

STEP 7.1's stated destination, STEP 8.3's write target, and the `diagnose-report` schema's own stated
destination (`add-doc-schemas/references/review.md:44`) all now read
`docs/diagnose/YYYY-MM-DDTHHMMSS-<slug>.md`. Three places, one string. The `id: DIAG-<slug>`
frontmatter convention is untouched — it identifies content, not the file path, and the two stay
independent as they already are for every other timestamped doc type.

## Also fixed

The build's adversarial review pass (`@prompt-review-agent`, full ruler tick against the whole
artefact, since nothing had audited it before) found two more defects in `add.diagnose.md`, pre-existing
and unrelated to the path fix, both mechanical:

- STEP 6.2 restated add-ecosystem's own route-to-command mapping in a local `Routes:` list, one
  sentence after saying "the mapping is NOT hardcoded here." The list is gone; the three possible next
  commands are named inline instead, just enough to keep the `uses:` block's `/add.hotfix` and
  `/add.plan` edges grounded in prose.
- `## Rules` was a `Requirement | Checkpoint | Rationale` table instead of the mandated
  `ALWAYS:`/`NEVER:` markdown. Reformatted; all 14 rules kept their content.

## Not covered

Two further findings from the same pass are real but need a person, not a mechanical fix, and are
left open:

- STEP 1.4 sends "Knowledge base pages" to `@feature-history-agent` and `@git-history-agent` for
  reading, against both agents' own `docs/`-only / diff-file-only contracts.
- STEP 3.2 makes Phase-0 user confirmation conditional; STEP 4 dispatches unconditionally, against
  `add-investigation`'s own mandatory-stop language.

Both predate this delivery, touch artefacts this plan never named (`add-investigation`, the two
agents), and each has two possible resolutions with different consequences — not something to invent
an answer for in passing. They need their own plan.

Also surfaced, out of scope for this layer: the root `.gitignore`'s unanchored `.codeadd/` rule (line
178) also matches `framwork/.codeadd/` — the product layer's actual source of truth — so any
gitignore-respecting recursive search silently skips that whole tree unless re-rooted inside it.
Already-tracked files are unaffected (confirmed: both edits here staged and committed normally), and
`scripts/build.js` reads via `fs.readdirSync`, so the build itself is unaffected — but a *new* file
created directly under `framwork/.codeadd/` would need `git add -f`. Worth anchoring the rule to
`/.codeadd/` in a follow-up.
