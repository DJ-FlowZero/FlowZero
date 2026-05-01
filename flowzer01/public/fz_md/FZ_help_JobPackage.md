# Compose Job Package

> A **Job Package** is a composite PUCK — multiple people's context combined with a task brief, ready to hand to any AI or executor.

Use this when a task involves more than one person's constraints, or when you want to attach a standing brief to a set of PUCKs before sending them upstream.

---

## Workflow

**1. Write a Job Brief** *(optional)*
Free text — the task, the context, the ask. This sits at the top of the composite file.

Examples:
- *"Plan a surprise birthday dinner for Mitch. He's vegetarian and dislikes loud venues."*
- *"Draft a project proposal for the Leo apartment job. Budget-conscious, timeline is flexible."*
- *"Prep a team brief for the Monday planning session — include CHRIS and fz0001."*

**2. Select PUCKs**
Check one or more PUCKs from the library. Each selected PUCK's content is included as a named block.

**3. Generate Composite**
Downloads a single `.txt` file structured as:

```
=== COMPOSITE PUCK ===
Generated: YYYY-MM-DD

--- JOB BRIEF ---
[your brief]

--- PUCK: Name ---
[PUCK content]

--- PUCK: Name ---
[PUCK content]
```

---

## Tips

- The composite is plain text — paste it directly into any AI chat as the opening context block.
- Order matters if the AI will read top-to-bottom: put the most important constraints first.
- PUCKs are additive — if two people have conflicting constraints, note the priority in the Job Brief.
- You can generate multiple composites for the same task at different visibility levels (public brief vs. private brief).
