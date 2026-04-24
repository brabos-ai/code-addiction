# Technical Voice & Notation

Voice, notation, and anti-patterns for technical docs: implementation plans, changelogs, architecture notes, configs.

> **Structure is defined by the schemas in `{{skill:add-doc-schemas/SKILL.md}}`** (`feature-plan`, `changelog`, `audit-report`, `diagnose-report`). This file covers only *how to write* the content those schemas require — JSON-for-data discipline, path notation, task shape, and anti-patterns. It does NOT prescribe section lists; those live in the schema registry.

**Use when:** writing or reviewing plan.md, changelog entries, architecture or config docs.

---

## Principle

Maximum information density with zero loss. JSON for structured lookups (paths, deps, configs). Markdown prose only where a human needs to read it — rationale, risks, validation steps.

**JSON = DATA. Markdown = INSTRUCTIONS.** Do not invert. Rules, rationale, and guidance belong in tables or prose; path lists and dep maps belong in minified JSON.

Density is not the same as brevity. A task without an acceptance signal is not shorter — it is incomplete.

---

## Data Notation (JSON)

Minified, one line per logical object. Never pretty-printed in docs — pretty JSON wastes grep and review surface.

### Paths

```
{"files":{"create":["path/a.ts","path/b.ts"],"modify":["path/existing.ts"]}}
```

Always absolute-from-repo-root. Never project-relative unless the root is unambiguous from context.

### Dependencies

```
{"deps":{"npm":["package@version"],"internal":["@add/domain","@add/database"]}}
```

Pin versions. `^` and `~` belong in `package.json`, not in planning docs — plans describe what will be installed, not a range.

### Config / Environment

```
{"config":{"env":["VAR_NAME","OTHER_VAR"],"files":["path/config.ts"]}}
```

Never inline secret values. Names only.

### Feature / Branch Context

```
{"feature":"0012F","branch":"feature/0012F-user-notifications","deps":["firebase-admin@12.0"]}
```

---

## Task Notation

Every task carries: area, action, and acceptance signal. A task without a signal is a wish.

### Inline form (default, in a bulleted list)

```
- [ ] backend: create NotificationEntity — signal: migration runs green + unit test covers required fields
- [ ] api: POST /notifications/:id/read — signal: 200 on valid id, 404 on missing, optimistic client update works
```

### JSON form (when tasks are referenced by ID elsewhere)

```
[{"id":1,"area":"backend","task":"create NotificationEntity","signal":"migration + unit test","estimate":"S"},
 {"id":2,"area":"api","task":"POST /notifications/:id/read","signal":"status codes + optimistic update","estimate":"M"}]
```

Estimates use S/M/L. Avoid hour estimates in plans — they rot faster than the code.

---

## Flow Notation

Sequential steps as arrow chains. Branches as sub-lines.

```
request → validate → enqueue job → FCM send → update status → webhook callback
          └ invalid → 400 + error payload
```

Keep flows under ~7 steps per line. If longer, split by sub-heading or promote the middle to its own flow.

---

## Rationale & Risks (markdown, not JSON)

Architecture decisions, risks, and validation checks are **instructions**, not data. They live in tables or prose.

```markdown
### Architecture Decisions
| Decision | Rationale | Alternative rejected | Triggering constraint |
|---|---|---|---|
| Job queue via BullMQ | Already in stack, Redis available | Direct API call — FCM rate limits | Must batch sends to stay within quota |

### Risks
| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| FCM rate limit | Medium | Delayed delivery | Batch sender + backoff |
```

Do NOT put this content in JSON. A table row is searchable, diff-able, and readable; a JSON object of prose is none of those.

---

## Changelog Voice

Conventional-Commit-style bullets. Granular enough to point at the change that landed, not the theme of the release.

```markdown
## Changes
- feat(notifications): add in-app notification center — {{doc:F0012}}
- fix(api): handle missing read receipts on legacy rows — {{doc:H0013}}
- refactor(domain): extract NotificationPolicy from service

## Breaking
- `POST /notifications` now requires `channel` field (was optional). Migration: default existing clients to `channel=in-app`.

## Migration
1. Update clients to send `channel` in every POST.
2. Run `yarn migrate 20260424_notification_channel.ts`.
3. Rollback: revert migration; `channel` returns to optional.
```

Breaking changes are never omitted to make the release look smoother. If unsure whether a change is breaking, list it and mark `impact: unclear`.

---

## Anti-Patterns

| Wrong | Right |
|---|---|
| "Several files will be created" | `{"create":["path/a.ts","path/b.ts"]}` |
| "Configure environment variables" | `{"env":["FCM_KEY","FCM_PROJECT_ID"]}` |
| Paragraphs describing structure | JSON with explicit paths |
| Tasks without estimates or signals | `task — signal — estimate` |
| Pretty-printed JSON spanning 20 lines | Minified, one line per object |
| Rules or rationale inside a JSON object | Markdown table or prose |
| Version ranges (`^1.2.0`) in plans | Pinned versions (`1.2.0`) |
| Hour estimates | S/M/L |
| Breaking changes tucked into "Changes" | Explicit `## Breaking` section |

---

## Checklist

- [ ] Paths listed as minified JSON under `create` / `modify`
- [ ] Dependencies pinned, split `npm` vs `internal`
- [ ] Every task has area, action, and acceptance signal
- [ ] Decisions carry rejected alternative and triggering constraint
- [ ] Risks carry probability, impact, mitigation
- [ ] Rationale and risks in markdown, not JSON
- [ ] Flow steps under ~7 per line
- [ ] Changelog breaking section present (or explicit `none`)
- [ ] No pretty-printed JSON; no version ranges; no hour estimates
