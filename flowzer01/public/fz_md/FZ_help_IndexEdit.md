# FlowSet Editor — What is a FlowSet?

## A FlowSet is always three files

Every person, place, or entity in FlowZero is represented as a **FlowSet** — three linked files that travel together:

| File | Contains | Purpose |
|------|----------|---------|
| `fzXXXX.json` | **Profile** — label/value pairs | Stable facts: name, constraints, preferences, background |
| `fzXXXX_token.json` | **Flexicon** — local meaning handles | Personal vocabulary: `[Mitch]`, `[Leo206]`, `[Wednesday mode]` |
| `fzXXXX_sticky.json` | **Sticky** — runtime modifiers | What is different *right now*: situation, flags, active incidents |

These three are the **three primitives** of FlowZero context. They are always created together because they are meaningless in isolation — a Profile without Stickies is a CV, not a Gestalt.

## The FlowSet → Gestalt chain

```
FlowSet → Gestalt → Prune → PUCK → Prime → Prompt → Loop
```

A **FlowSet** is the stored unit. A **Gestalt** is what you get when you compile a FlowSet at a chosen visibility level — the full rendered context field. The **Show Gestalt** button does exactly this.

## What FlowSet Index does

- **[Create FlowSet]** — generates the next available profile number and writes all three blank files directly to `Gestalt/`. The index is updated immediately. No staging, no publish step.
- **Save Changes** — persists edits to `realName`, `description`, and `tag` fields in the index.

## FlowSet numbering

- `fz0000–fz0099` — person profiles (real people)
- `fz9999` — system/loop/AI entity
- `fz10000+` — places, objects, environments, non-person entities

## After creating a FlowSet

Open **Profile Edit**, **Flexicon Edit**, and **Sticky Edit** to populate the three files. Each editor saves independently with timestamped backups. The new FlowSet is immediately available in all dropdowns — no restart needed.
