<!-- uses:
- mention: @feature-history-agent
- mention: /add-diagnose
- mention: /add-hotfix
- mention: /add-new
- mention: done.cjs
-->

<!-- section:prune -->

### STEP docs-pruning.prune-post-merge Prune Post-Merge Scaffolding (docs-pruning)

Delete the feature-directory files that **no command reads after the merge**. Their purpose expired when the branch did: `discovery.md` is an explicitly-cached pre-build analysis, `tasks.md` is a build checklist, `epic.md` is convergence state, and `review-NNN.md` is a gate record whose gate has passed.

The feature directory lives in the docs worktree (`.codeadd/docs/`, the `codeadd-docs` branch). Deletions stay in that worktree; `done.cjs --merge` (STEP add-done.merge) commits and pushes `codeadd-docs` with everything else STEP add-done.document produced.

**Delete exactly these, and nothing else:**

| Delete | Keep — and why |
|---|---|
| `${DIR}/discovery.md` | `about.md` — eleven readers, including `/add-diagnose` and `/add-hotfix` |
| `${DIR}/tasks.md` | `plan.md` — `@feature-history-agent`'s named input, and the basis of `/add-diagnose`'s doc-code drift check |
| `${DIR}/epic.md` | `iterations.*` — `/add-new`'s Past Features Discovery reads it to avoid re-work |
| `${DIR}/review-*.md` | `changelog.md` — read by five commands after the merge |
| | `decisions.jsonl` — the "why", which the index deliberately does not carry |
| | `design.md` — no post-merge reader today, but a live UI contract for as long as the UI exists. A deliberate exception; do not "fix" it |

**The list is the output of a rule, not the rule.** The rule is: *a file may be pruned if and only if no command reads it after the merge.* Re-derive the list whenever a command gains a read — a hardcoded list becomes wrong the first time someone teaches `/add-diagnose` to read `tasks.md`.

**Never delete the feature directory itself.** Deleting the whole folder was considered and rejected: `about.md` is the evidence the wiki's incremental update path runs on.

#### Two refusals, both hard

```
IF NO DELIVERY INDEX ENTRY WAS WRITTEN THIS RUN:
  ⛔ DO NOT: Delete any file
  ✅ DO: Skip STEP docs-pruning.prune-post-merge entirely and say why

IF A FILE TO PRUNE IS NOT TRACKED BY GIT:
  ⛔ DO NOT: Delete that file
  ✅ DO: Leave it, print a notice naming it, and continue with the tracked ones
```

The first covers a failed write, a delivery on a documentation-type branch, and an operator who enabled this before the index carried anything. **Deleting the scaffolding before the record exists inverts the whole design** — the index is what makes the absence unremarkable, so no entry means no pruning.

The second is what makes "it's all in git anyway" true instead of a slogan. For an untracked file it is simply false: deletion is unrecoverable.

Check tracking before deleting, per file — in the docs worktree, which is its own repository, not in the code checkout:

```bash
git -C .codeadd/docs ls-files --error-unmatch "${FILE#.codeadd/docs/}" >/dev/null 2>&1
```

#### Interrupted between STEP add-done.document and STEP add-done.merge

Recoverable, and worth saying because pruning borrows its commit path from artefacts that lose nothing when interrupted. A changelog or wiki edit left uncommitted costs nothing; deleted files left uncommitted look like data loss and are not:

```bash
git -C .codeadd/docs checkout -- <paths>
```

That works **because** of the first refusal above — nothing untracked is ever deleted. Do not read a half-finished run as destruction.

#### What this does not solve

"No command reads it after the merge" speaks for commands, not for people. A human doing archaeology on a shipped feature years later may well want a `discovery.md` or a `review-NNN.md`, and no command speaks for them. That is accepted rather than solved: git retains every pruned file, and this feature is off by default. A project that values manual archaeology over a tidy tree leaves `docs-pruning` disabled.

⛔ DO NOT USE: Bash for git add/commit/push here, in the code checkout or in the docs worktree. `done.cjs --merge` remains the sole owner of the commit and the push; the two read-only `git -C .codeadd/docs` calls above are the only git this step makes.

<!-- /section:prune -->
