# Backward Tracing (Phase 1)

> Adapted from [obra/superpowers `systematic-debugging/root-cause-tracing.md`](https://github.com/obra/superpowers/blob/main/skills/systematic-debugging/root-cause-tracing.md) by Jesse Vincent (MIT). Credit where due.

## Goal

Walk backward from the observable symptom to its origin. Most "mysterious" bugs look mysterious only because we are looking at the WRONG layer.

The cheap and effective move: start at the symptom, ask "what called this?", keep climbing until you find the origin.

## The Walk

```
Symptom (what user sees)
  ↑ what rendered this?
Immediate output (component / API response / log line)
  ↑ what computed this?
Source of the value (function / hook / selector)
  ↑ what produced the input?
Upstream producer (service / repository / fetcher)
  ↑ what called the producer?
Caller (handler / action / event)
  ↑ what triggered the caller?
Origin (user action / cron / webhook / initial load)
```

At EACH level, ask:
1. What is the value at this point? (read it — do not assume)
2. Is it what I expected? (if yes, move up; if no, STOP — you found the layer)
3. What called this?

## The Critical Rule

**Do not assume any layer is correct. READ the value at each level.**

The single most common debugging failure is assuming "layer X is fine, it must be layer Y". That assumption is how bugs hide — usually IN layer X.

## Instrumentation for Multi-Layer Systems

When the symptom crosses boundaries (UI → API → DB, or service → service), instrument EVERY boundary first. Do not try to guess which boundary leaks.

```
boundary 1: log input + output
boundary 2: log input + output
boundary 3: log input + output
boundary 4: log input + output
```

Run once. Now you know WHERE the value becomes wrong. Only then ask WHY.

Instrumentation techniques:
- Console/server log at each layer's entry and exit
- `new Error().stack` to see the call chain at a suspicious point
- Request tracing ID propagated through layers
- Git-blame each layer to see recent changes

## Example (from obra, simplified)

```
Symptom: `git init` ran in source tree instead of project dir
  ↑
Immediate cause: shell command executed with cwd=source tree
  ↑
Source: cwd value came from `projectDir` variable
  ↑
Upstream: `projectDir` was empty string ""
  ↑
Producer: `buildProjectDir(config)` returned "" when config.name was undefined
  ↑
Caller: project setup called buildProjectDir(config) before config was loaded
  ↑
Origin: setup flow ran buildProjectDir in constructor, but config loads async in onMount
```

Root cause: initialization order bug. Found by walking 6 layers backward, reading the value at each.

## When to Use Backward vs Forward Tracing

| Technique | When |
|---|---|
| **Backward (this)** | You have a clear symptom, unclear cause |
| **Forward** | You have a clear trigger, unclear effect (rare in bug-hunting) |

For ambiguous-symptom investigation, backward is almost always right.

## Anti-patterns

- Jumping straight to "let me add a fix" at the first suspicious line
- Assuming upstream layers are correct without reading the value
- Instrumenting only the layer you think is broken
- Walking forward from a trigger when you have a symptom
