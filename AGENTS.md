# AGENTS.md

A short project entry point. For deck authoring, **load the `deck-authoring` skill** — it is self-contained and includes the subcommand reference, deck shape, scaffold catalog, build pipeline, and authoring workflow. This file is a one-screen overview, not the source of truth for deck work.

## Repo shape

- The repo holds a generic presentation tool plus the course content built on it.
- `deck.js` is the tool itself — a single Node file at the repo root, no npm dependencies.
- `templates/default/` is the built-in default template (HTML shell + nav UI + widget JS).
- `themes/default/` is the built-in default theme (design tokens + base styles + widget look).
- `unit0-mini/` is the example deck used to verify the tool.
- `sample-app/` is the deliberately imperfect FastAPI todo app used for hands-on exercises (unrelated to the tool).
- `lessons/` is the legacy single-purpose build of the original course content. It is no longer the live deck and is kept for reference. Do not modify unless explicitly asked.
- `DESIGN.md` is the slide design authority. Read it before authoring or editing slides.
- `skills/deck-authoring/` is a skill for agents that author or edit decks. Load it when the task involves creating, editing, reordering, or rebuilding slides. The skill is self-contained — you do not need to read this file to use it.

## Verification shortcuts (deck work)

- After changing a slide: re-run `node deck.js build` (or use `cd <deck> && node ../deck.js build`) and open `<deck>/dist/index.html` in a browser.
- After changing the tool: run the unit0-mini build and verify it still produces a working `dist/index.html`.
- After changing a template or theme: re-run the unit0-mini build to spot-check.
- There is no configured linter, formatter, type checker, or CI workflow at repo root.

## Sample app

- Work from `sample-app/` for the FastAPI app. Setup/run:
  `python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --reload`
- Tests are only storage-layer tests by design. Run all tests from `sample-app/` with `pytest`.
- The app stores live data in `sample-app/data/todos.json`; running the server or manual API calls can mutate this tracked fixture.
- Several bugs/gaps are intentional lecture material (see `sample-app/README.md`). Do not proactively clean up DELETE behavior, missing API tests, frontend delete support, or docs gaps unless the task asks for that exercise.
