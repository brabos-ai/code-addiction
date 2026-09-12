# Roadmap

Items are listed in execution order — the number **is** the priority. An item may only start once
every item above it is done. Scope lives with each item, not with this document — an item names
the layer(s) it touches.

---

## 1. Delivered-work relationships

### 1.1 — Relationship index/graph in delivered documents

**Scope:** both
**TLDR:** Changelogs and deliveries carry a relationship index/graph so add.brainstorm, add.new, add.plan and add.hotfix can find related delivered work when opening a feature, investigating a hotfix or drafting a technical plan.

- Builds on what already exists: the `related:` frontmatter across the add-doc-schemas, the `## Relations` section every work item now carries, and the `CHG[NNNN]` changelog add.done closes with `related:` pointing at the closed `[NNNN]F`/`[NNNN]H`. **`templates/related.md` is gone and the `hotfix-related` schema is retired** — the document format that replaced them is what this item now builds on.
- Adjust how documents are saved and related (changelog, deliveries archiving) so the index becomes the base for the next phase, not a one-off annotation.
- Prepare the ground for vector search over delivered docs — the planned next step, which reaches documents the index alone does not surface.
- **Done when:** an add.new or add.plan run reaches a previous delivery's related docs through the index (not only text search), and a new hotfix records its cause as a typed `caused_by` relation in its own about.md.

  > **Revised on delivery, 2026-09-12.** The original criterion said the hotfix must cross-update the `related.md` of every feature it impacts. Under a graph that is writing one fact twice: a `caused_by` declared on the hotfix already yields the inbound edge on the feature, and `related.md` is no longer written by anything. The outcome the criterion wanted — a hotfix's connections being findable from the feature — is delivered by the edge, not by the second write.

### 1.2 — Migration command: initial relationship graph for old installs

**Scope:** product
**TLDR:** An opt-in command that builds an initial relationship structure over features delivered before the new format existed, grouped by app/group/category as a tree or graph, so the agent can find correlated features and know what to search.

- Depends on 1.1 — migrating existing projects into the format only makes sense once 1.1 defines it.
- Scan past deliveries (docs/features, changelogs) and group them — by app, group or category, tree or graph: the shape is still open.
- Ships as an enabled feature, not part of the default flow.
- When the gitnexus plugin is enabled, the graph also points at what to search in gitnexus per group.
- **Done when:** running the command on a project with pre-format deliveries produces the initial grouped structure with relationships filled, and add.new/add.plan/add.hotfix use it as the investigation entry point.

## 2. Obsolescence and backward compatibility

### 2.1 — Treat obsolete code and backward compatibility as first-class concerns

**Scope:** product
**TLDR:** /add.build and /add.hotfix explicitly ask whether the work must preserve backward compatibility; when it does not, they guide the author to propose a migration or cleanup script. /add.done surfaces any dead code the feature left behind before merging.

- Add a backward-compatibility question to `/add.build` (around STEP 6/8) and `/add.hotfix` (around STEP 7/8), and record the answer in `plan.md` / `about.md` / hotfix `about.md`.
- When backward compatibility is **not** required, require a migration or data-cleanup artifact (script, SQL, worker, or explicit manual steps) before the feature/hotfix can be considered complete.
- Add a dead-code detection pass to `/add.done` (before merge) that lists unused files, unreachable routes, orphaned exports, or tables/columns left behind by the delivery.
- Extend the relevant `add-doc-schemas` (`feature-plan`, `hotfix-about`, `changelog`) to carry the compatibility decision and any attached migration/cleanup artifact.
- **Done when:** a feature that rewrites an existing model produces a `plan.md` entry stating `backward compatibility: no` plus a migration script path, and `/add.done` reports either `dead code: none` or a concrete cleanup candidate list.

