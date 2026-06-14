<!-- section:graph-plan -->

**Graph available (GitNexus):** before dispatching planning subagents, use the code knowledge-graph to **establish blast-radius** — confirm callers, dependents, and dead-code for the entities and modules this plan touches — so the plan sizes the real change surface, not a grep approximation. Finding similar files to reuse as references → grep is fine; establishing what a change breaks (callers / dead-code / impact) → graph. If the graph is stale, re-analyze before relying on it. Mechanics: load skill `add-gitnexus`.

<!-- /section:graph-plan -->
