# Agentic Coding for Beginners

A 90-minute lecture for CS PhD students on the basics of agentic coding and
AI-driven generation of code, HTML slides, and scientific writing.

## Goal

Give attendees a working mental model of what an LLM, a harness, and an
agent skill are, and enough hands-on time to install a coding agent, run it
against a real (deliberately imperfect) project, and judge the results
critically.

## Contents

- `html_slides/` — the 28-slide deck, built with the local `deck.js`
  checkout in `material/deck.js`. Build artefacts land in `html_slides/dist`.
- `material/sample-app/` — a small FastAPI todo app used as the live
  hands-on target. It is intentionally rough; the exercises are about
  finding and fixing its flaws with an agent.
- `material/deck.js/` — local fork of [deck.js](https://github.com/s-geissler/deck.js)
  used to render the slides.
- `AGENTS.md` — orientation file for coding agents working in this repo.
