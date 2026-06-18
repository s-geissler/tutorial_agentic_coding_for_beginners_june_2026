---
name: deck-authoring
description: Create and edit slide decks built with deck.js — the project's HTML presentation tool. Use when the user asks to make a new deck, add, remove, or reorder slides, edit slide content or visuals, fix a broken slide, or rebuild a deck for distribution.
---

# Deck Authoring

A workflow for `deck.js`. The tool is one Node file (`deck.js`) with no dependencies. Decks live in folders with `deck.json` + `slides/<NN-name>/` + `template/` + `theme/` + `assets/`.

If `DESIGN.md` exists at the project root, it is the slide design authority. Treat its principles as constraints on every slide you author.

## Phase 0 — Absorb the design language

Before authoring anything, read the design authority so your slides match the rest of the deck:

1. **Read `DESIGN.md`** at the project root. It defines typography, layout, color, density, alignment, and slide-type rules.
2. **Read 2–3 existing slides** in the deck's `slides/` directory. Note the `data-*` attributes on the `<section>`, the `.slide-header` / `.slide-body` structure, and how the design principles are applied in practice.
3. **Skim the active theme** (`theme/tokens.css` and `theme/base.css`) for the design tokens and component classes available.
4. **If the deck doesn't exist yet**, read `templates/default/scaffolds/<name>/` for canonical patterns.
5. **If `DESIGN.md` is silent** on a design question, ask the user. Don't invent rules.
6. **If a design rule was established** in conversation but isn't in `DESIGN.md`, add it. The design authority is a living document.

This phase is the difference between a deck that fits and one that looks grafted on.

## Phase 1 — Plan

One `title` cover, one `section` per major part, a few `default` content slides per section, a `picture` where a diagram beats prose. Leave gaps in the prefix (`05-`, `10-`) so inserts don't force a renumber. State the plan in 2–3 lines to the user before generating.

## Phase 2 — Scaffold

```bash
node deck.js new my-talk                       # vendors the default template + theme
cd my-talk
node ../deck.js add 01-title      --scaffold=title
node ../deck.js add 02-overview   --scaffold=default
node ../deck.js add 03-section-a  --scaffold=section
node ../deck.js add 04-point-1    --scaffold=default
```

If the deck already exists, drop the `new` step. To insert a slide mid-deck without renumbering, use a fractional prefix (`04.5-extra`) and run `node deck.js clean-prefixes` to normalize.

## Phase 3 — Author

A slide's `index.html` is a complete HTML document so the author can preview it standalone. The build only extracts the `<section class="slide">...</section>` and inlines it. Rules:

- **One `<section class="slide">` per file.**
- **Set `data-section`, `data-section-label`, `data-title`, `data-toc`** on the section. `data-toc` populates the table of contents; `data-section-label` groups slides under a part in the nav.
- **Include the `.slide-header` div** with `.section` and `.number` spans — the template's nav fills them in.
- **Wrap content in `.slide-body`.** The body is centered as a block; left-align content inside it (see `DESIGN.md` §3).
- **Reference slide-local media as `assets/...`.** The build rewrites the path.
- **One-off layout goes in `style.css`; one-off behavior goes in `script.js`.** Both are auto-injected into the section by the build.
- **Don't put `<link rel="stylesheet" href="style.css">` or `<script src="script.js">` inside the section.** The build injects them. Leave them in `<head>` / at the end of `<body>` so the slide previews standalone.
- **Prefer the theme's component classes** (`.cards.cols-2`, `.steps`, etc.) over custom CSS.

## Phase 4 — Build and verify

```bash
node deck.js build               # from the deck root
node deck.js build --deck <path> # from anywhere
node deck.js build --debug       # verbose
```

Open `<deck>/dist/index.html` in a browser. Check: title is top-left; footer is intact; slide looks the same bundled as standalone; no broken images, console errors, or 404s; TOC reflects the new slide.

If a slide looks wrong only in the bundled output, the build's path-rewrite or injection is at fault — read `deck.js` (single ~1000-line file).

## Subcommands

| Subcommand | What it does |
|---|---|
| `new <deck-path>` | Create a deck. Vendors template + theme, writes `deck.json` + `.gitignore`. |
| `add <NN-name> [--scaffold=<name>]` | Create a slide folder from a scaffold. Names must start with `NN-` or `NN.N-`. |
| `delete <NN-name> [--force]` | Remove a slide folder. TTY prompt unless `--force`. |
| `clean-prefixes [--dry-run]` | Normalize prefixes to `01-`, `02-`, ... in current sort order. Cleans stale temp dirs first. |
| `build [--deck <path>] [--debug]` | Produce `dist/index.html` + assets. Tree copy + path rewrite + template substitution. No CSS/JS inlining. |

All accept `--deck <path>` to override the working deck. `build` also accepts `--debug`. With no flag, the tool looks for `deck.json` in the current directory.

For the full flag list and per-subcommand details, run `node deck.js <subcommand> --help` (or just `node deck.js --help`). The tool's own help is the authoritative reference for flags and argument syntax.

## Canonical examples (read these, don't duplicate)

- Scaffold templates: `templates/default/scaffolds/{default,title,section,picture}/`.
- The default template shell: `templates/default/_template.html`, `nav.js`, `widgets.js`.
- The default theme: `themes/default/{tokens,base,widgets,print}.css`.
- The `deck.json` manifest schema: any deck's `deck.json`.

## Pitfalls

- **Don't hand-edit numeric prefixes to insert a slide.** Use a fractional prefix + `clean-prefixes`; manual renames are how collisions and stale temp dirs happen.
- **Don't skip Phase 0.** A deck that "looks fine" in isolation looks out of place next to existing slides if it doesn't follow the same patterns.
- **Don't put local file paths in slide content** — only external URLs (`https://...`) survive the build.
- **Don't add a `<base>` tag in slide HTML.** The build relies on document-relative paths.
- **Don't write into `dist/`.** It's regenerated every build. Author in `slides/`.
- **Don't make the cover slide the same as a content slide.** Use the `title` scaffold for covers; the content layout looks wrong on a full-bleed cover.
- **Don't put shared styles in a slide's `style.css`.** If two slides need the same CSS, it belongs in the theme.
