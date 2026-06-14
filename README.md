# Agentic Coding for Beginners

A 90-minute teaching unit introducing CS PhD students to agentic coding
tools. Theory (≈30 min) + hands-on (≈60 min) on a real, imperfect
sample app, using [opencode](https://opencode.ai) and Matt Pocock's
[skills](https://github.com/mattpocock/skills) collection.

## What's in this directory

```
.
├── README.md                                    ← you are here
├── MISSION.md                                   ← the why of this unit
├── RESOURCES.md                                 ← cited sources
├── lessons/
│   ├── 0001-agentic-coding-fundamentals.html    ← the deck (open this in a browser; built from the parts below)
│   ├── _template.html                           ← the source template; the build inlines everything into the deck
│   ├── build.js                                 ← rebuilds the deck from the source parts (see "Editing slides" below)
│   ├── shared/
│   │   ├── slide.css                            ← slide styles (design tokens, widgets, layout)
│   │   └── slide-widgets.js                     ← widget initializers (tokenizer, context window, etc.)
│   └── slides/
│       └── 0001/                                ← one HTML file per slide
│           ├── 01-title.html
│           ├── 02-what-this-is.html
│           └── ... 26 files total
└── sample-app/                                  ← the FastAPI todo app for the hands-on
    ├── app/
    ├── static/
    ├── tests/
    ├── data/
    ├── requirements.txt
    └── README.md
```

The deck is a single self-contained HTML. The source is split: the
slides live as separate files under `slides/`, the shared styles and
widget code live under `shared/`, and `build.js` inlines everything
into the output file when you run it.

## How to run it

### 1. Open the deck

Double-click `lessons/0001-agentic-coding-fundamentals.html` in any
modern browser. That's it. No install, no internet, no server.

**Editing slides:** change the file in `slides/0001/`, then run

```bash
node lessons/build.js --slides lessons/slides/0001 --output lessons/0001-agentic-coding-fundamentals.html
```

to regenerate the deck. Reopen the deck in the browser. That's the
whole loop.

**Adding a new slide:** copy any existing file in `slides/0001/`,
change its content and the `data-section` / `data-toc` attributes,
and pick a filename that sorts into the position you want (e.g.
`04.5-new-topic.html` to slot between 4 and 5). Then rebuild with

```bash
node lessons/build.js --slides lessons/slides/0001 --output lessons/0001-agentic-coding-fundamentals.html
```

Nothing in `_template.html` or `shared/` needs to change.

**Adding a new section:** pick a `data-section` number that isn't
already used, set `data-section-label` on the slide, and the central
nav UI will pick it up automatically. No central file change.

**Navigation**

| Key                 | Action                   |
|---------------------|--------------------------|
| `→` / `Space` / `PgDn` | Next slide               |
| `←` / `PgUp`        | Previous slide            |
| `Home` / `End`      | First / last slide        |
| `Esc` / `?`         | Open the table of contents |
| `T`                 | Toggle light / dark theme |
| Click left / right thirds | Previous / next slide |

The four interactive widgets — the **tokenizer**, the **context window
visualizer**, the **skills card grid**, and the **Ralph loop animation** —
are all inline in the deck. No CDN, no external requests.

### 2. Run the sample app (for the hands-on)

```bash
cd sample-app
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open <http://localhost:8000/>. The app is a small FastAPI todo list
with a vanilla-JS frontend and JSON file storage. **It is deliberately
imperfect** — the imperfections are what the hands-on exercises find
and fix. See `sample-app/README.md` for the list.

### 3. Run the tests (5/5 should pass)

```bash
pytest
```

Only the storage layer is tested. The API endpoints and the frontend
are not — by design.

## Lecture flow (90 min)

| Time        | Section              | What happens                                |
|-------------|----------------------|---------------------------------------------|
| 00:00–00:03 | Welcome              | Why this talk, what it isn't                |
| 00:03–00:13 | LLM basics           | Tokens (interactive), context window (interactive) |
| 00:13–00:23 | The harness          | Model vs harness, why it matters            |
| 00:23–00:33 | Context              | What goes into context, why for code |
| 00:33–00:38 | Skills & agents      | Skills (interactive), agents, subagents     |
| 00:38–00:43 | Why opencode         | Harness landscape, why this one             |
| 00:43–00:45 | mattpocock/skills    | The four failure modes                      |
| 00:45–01:30 | Hands-on             | 10 steps; see lessons/0001-…html for detail |
| 01:30–01:35 | Wrap-up              | What to try next, resources                 |

## Adapting it for your own audience

- **More / less theory**: slides are modular. Drop a section by editing
  the slide metadata, or skip live by pressing `→` past it.
- **Different model / harness**: every command in the hands-on is
  copy-pasteable. The only thing that changes is the install line
  (curl / npm / brew) and the provider setup in step 1.
- **Different sample app**: any small, imperfect codebase works. The
  point is that the agent has *something* to chew on, with real
  imperfections for the skills to find.

## License

The teaching unit and sample app are MIT. Matt Pocock's skills are MIT
too — see <https://github.com/mattpocock/skills/blob/main/LICENSE>.
