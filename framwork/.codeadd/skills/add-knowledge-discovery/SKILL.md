---
name: add-knowledge-discovery
description: Use at the context/discovery step of add.plan, add.hotfix, add.new, add.diagnose, add.review — consult the project wiki (and code knowledge graph) for minimal token cost before dispatching agents.
---

# Knowledge Discovery — Wiki Consumption Procedure

## Overview

Defines the ONE procedure for consulting `{{addpath:wiki/}}` at a command's existing context step. Five commands load this skill: `add.plan`, `add.hotfix`, `add.new`, `add.diagnose`, `add.review`. Loading happens where the command already gathers context — never a new preamble.

## When to Use

- `add.plan` after status.sh, alongside recent-context load
- `add.hotfix` at "Consult Knowledge Base" (former "Check Project Patterns")
- `add.new` at Deep Discovery, beside the Codebase Discovery agent
- `add.diagnose` at Load Context
- `add.review` at Bootstrap Context, Gate 2 "Knowledge base" row

## When NOT to Use

- `add.build`, `add.autopilot`, `add.test` — these read `{{addpath:wiki/index.md}}` + the already-known `domains/<area>.md` directly (pages were selected upstream by `add.plan`); do not load this full skill, it duplicates SELECT work already done
- Bug-cause investigation in `add.hotfix` STEPs 4-6 — diagnosis stays history/code-driven and wiki-blind; this skill enters only at fix time
- No wiki exists → this skill still runs (PRESENCE handles absence); do not skip the command's context step waiting for a wiki

## The 7-Step Procedure

### 1. PRESENCE

Read the WIKI fields from `status.sh`, which the command already ran for context: `WIKI:present`/`WIKI:absent`, `WIKI_COMMIT`, `WIKI_STALE_COUNT`, `WIKI_HINT`.

- `WIKI:absent` → note ONCE: "knowledge base unavailable — /add.wiki generates it", then proceed with code-first discovery (grep/glob/read). Do not repeat the note within the same run.
- `WIKI:present` → continue to ENTRY. `WIKI_STALE_COUNT` (if >0) primes suspicion for STEP 4, it does not block anything here.

**Exception — `add.new`:** it never runs the full context mapper (only `status.sh next-id`, which emits no WIKI fields). Check presence directly:
```bash
test -f .codeadd/wiki/index.md
```

### 2. ENTRY

Read `{{addpath:wiki/index.md}}` — the hub, ≤150 lines, cheap. This is the ONLY entrypoint. Never grep the wiki directory before reading the hub.

### 3. SELECT

Match the task against the hub's per-link descriptions + Terminology section. Pick the MINIMAL page set — typically 1-3 pages:

- The task's domain page: `{{addpath:wiki/domains/<area>.md}}`
- Plus the spine page matching the question kind:

| Question kind | Spine page |
|---|---|
| Established patterns | `{{addpath:wiki/domains/<area>.md}}` |
| "How do we..." (dev workflow, gates, release) | `{{addpath:wiki/workflows.md}}` |
| Rule / convention / naming / error-handling | `{{addpath:wiki/conventions.md}}` |
| "Why is it built this way" | `{{addpath:wiki/architecture.md}}` |

**Fallback** when hub descriptions don't match the task: `grep -ril "<term>" .codeadd/wiki/`.

### 4. FRESHNESS

For each selected page, read its frontmatter `commit` + `sources`:
```bash
git diff --name-only <page.commit>..HEAD -- <page.sources>
```
- Empty → trust the page.
- Non-empty → the page is a MAP, not truth: verify load-bearing claims against current code before relying on them.

`status.sh` `WIKI_STALE_COUNT` primes suspicion (repo-wide signal) but this per-page check is authoritative — a nonzero repo count doesn't mean every selected page is stale, and a zero count doesn't skip this check.

### 5. STRUCTURE

Structural questions — callers, blast radius, dependency chains, execution flows — are NEVER answered from wiki pages. Derive from the code knowledge graph when available, else from the code directly. Pages point; they don't enumerate. (Tool-neutral: no hard reference to any specific graph plugin — mastery of a specific tool arrives via its own plugin injection, independent of this skill.)

### 6. HANDOFF

When dispatching subagents, pass lightweight identifiers — NOT content:
- Selected page path(s)
- One line each on why it's relevant
- The freshness verdict (trusted / stale-verify)

Subagents read the pages themselves (JIT). NEVER inline page content into a dispatch prompt — that multiplies every dispatch by hundreds of lines and defeats the purpose of SELECT.

### 7. CONFLICT

Wiki contradicts code → CODE WINS. Report the contradiction in the command's user-facing output — it becomes evidence for the next `{{skill:add-wiki-maintenance/SKILL.md}}` run.

## Common Rationalizations (BLOCKED)

| Excuse | Reality |
|---|---|
| "I'll just read all wiki pages to be thorough" | 1-3 pages is the contract. Hub descriptions exist precisely so you don't need to read everything. |
| "Grepping the whole repo is easier than the hub" | Hub-first is cheaper AND the compliant path — the economical route and the correct route are the same route. |
| "The page is probably fine, skip the freshness check" | One `git diff --name-only` command. Skipping it turns a map into an unverified guess. |
| "I'll inline the page content into the dispatch prompt to save the subagent a read" | Handoff is paths + reasons + freshness verdict only. Inlining multiplies tokens across every dispatch. |
| "The wiki is wrong here, I'll just quietly work around it" | Report the contradiction — code wins locally, but the report is what fixes the wiki for next time. |
| "add.new can wait for status.sh to give me WIKI fields" | add.new never runs the full context mapper — check `.codeadd/wiki/index.md` existence directly. |
