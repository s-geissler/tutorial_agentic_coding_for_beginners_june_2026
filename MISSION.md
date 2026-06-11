# Mission: Agentic Coding for Beginners

## Why

Introduce CS PhD students to agentic coding tools so they can decide
deliberately which parts of their research and engineering work to
delegate to an LLM-backed agent, and which parts to keep human-in-the-loop.
The field is moving fast, the vocabulary is unstable, and the productivity
gap between "uses ChatGPT" and "uses a harness + skills in a loop" is large
enough that not knowing the second mode is a real competitive disadvantage
in industry research labs and a missed leverage point in academic ones.

## Success looks like

- A participant can install opencode, run a multi-turn agentic session on
  a real codebase, and explain what context the model is seeing.
- A participant can articulate the model-vs-harness distinction, the
  skills/agents/subagents vocabulary, and use those terms correctly
  when describing their work.
- A participant has personally run `/grill-me`, `/tdd`, `/to-prd`, and
  `/to-issues` from Matt Pocock's skills repo on a small sample app, and
  can decide which of those skills belongs in their own workflow.
- A participant can wire up a "Ralph loop" (an agent iterating over an
  issue queue until empty) and reason about when that pattern is and
  isn't appropriate.

## Constraints

- Single 90-minute slot, lecture + hands-on hybrid.
- Audience: CS PhD students. Knows Python, terminal, git. Does not know
  tokens, temperature, the harness concept, or any agentic coding tool.
- Output: a single self-contained `index.html` (vanilla HTML/CSS/JS, no
  CDN) plus a small sample FastAPI app for the hands-on. Must work
  offline. Must be projectable.
- Hands-on tool: opencode (already installed on participant machines,
  install command included anyway).
- Skills source: https://github.com/mattpocock/skills
- Visual style: modern technical (Stripe-docs meets Linear), light +
  dark mode, subtle micro-animations. No SaaS-landingspage energy.

## Out of scope

- Fine-tuning, RLHF, or any model-training topic.
- Comparison shopping between commercial LLM providers.
- Multi-session progression, learning records, or spaced repetition —
  this is a single 90-minute unit, not a course.
- Speaker notes / lecturer script — slides are self-explanatory.
- Framework-heavy frontend (React/Vue/Tailwind) — must stay vanilla.
- Anything that requires an internet connection at runtime.
