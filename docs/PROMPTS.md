# Working with AI on this project

This document captures *how* AI was used while building this app, not
just *that* it was used. Each entry shows the intent, the prompt
shape, and the engineering checks done against the AI output.

## Working agreement with the AI

1. **The human drives the test, the AI drives the implementation.**
   Failing tests are written first by hand (or co-written with a tight
   prompt). The AI is then asked to produce the minimal change to make
   the test pass. This keeps the contract human-defined.
2. **Every AI-produced diff is read before commit.** No "vibe-merge".
   If the diff is too large to scan in a minute, it's split.
3. **Architectural decisions are human calls.** The stack, the layer
   boundaries, the data model — all decided in `DECISIONS.md` before
   any code was generated.

## Prompts that shaped the design

### Discovery / framing
- *"Build a salary management tool for an HR manager of a 10K-employee
  org. What's the smallest user journey that proves the product is
  useful, and what would I cut to keep the build tight?"* — surfaced
  the read-vs-write asymmetry that justified RSC for lists, client
  components only for forms.

### Schema design
- *"Storing salary as INTEGER minor units vs NUMERIC(12,2) — what does
  each cost me on aggregates, on UI rendering, and on FX-normalization
  later?"* — fed into ADR-004.

### Test strategy
- *"I need a Postgres-compatible test runtime that doesn't require
  Docker. Compare pglite, pg-mem, testcontainers."* — fed into ADR-002.

## Pattern: extracting a typed validator

Rather than asking the AI to "write the API", the loop is:

1. I write a Zod schema by hand (or co-author it).
2. I write failing tests for the schema's edge cases.
3. I ask the AI to *refine the schema* until the tests pass, with the
   prompt: "Here are failing tests. Modify only this Zod schema so all
   tests pass. Do not edit the tests."

This keeps the AI on a tight leash and forces it to satisfy the
contract I wrote rather than inventing its own.

## What the AI was NOT used for

- Choosing the data model — done by hand against the brief.
- Deciding the test layers — done by hand against ADR-005.
- Authoring the failing tests in a TDD cycle — they encode intent and
  must stay human-driven.
- Writing the commit messages on architectural commits.

## What the AI WAS used for

- Drafting the seed data generator (statistically sensible salary
  distributions per country and per job title — researched, then
  trimmed).
- Boilerplate-heavy CRUD route handlers, once the validator + service
  were stable.
- shadcn/ui form wiring once react-hook-form was in place.
- Generating realistic-looking placeholder data for UI screenshots.
