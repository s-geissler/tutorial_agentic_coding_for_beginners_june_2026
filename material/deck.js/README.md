# deck.js

`deck.js` is a small, dependency-free tool for building HTML slide decks from
folder-based slide sources. It was extracted from the original teaching-unit
repository so it can be reused as a standalone deck generator.

This repository now contains the generator, reusable templates/themes, and
authoring support files. It does **not** contain the old lesson deck or sample
app that originally motivated the tool.

## What's in this repository

```
.
├── deck.js                         ← CLI tool; Node built-ins only
├── templates/
│   ├── default/                    ← default navigation/template shell
├── themes/
│   ├── default/                    ← default design tokens and CSS
├── DESIGN.md                       ← project-local design notes
└── .opencode/                      ← optional agent/skill helpers
```

## Requirements

- Node.js
- No npm install step; `deck.js` uses only Node's built-in modules.

## Quick start

Create a new deck:

```bash
node deck.js new my-talk
cd my-talk
```

Edit `deck.json` to set the title, author, and description. Then add slides:

```bash
node ../deck.js add 01-title --scaffold=title
node ../deck.js add 02-overview --scaffold=default
node ../deck.js add 03-section --scaffold=section
node ../deck.js add 04-picture --scaffold=picture
```

Build the deck:

```bash
node ../deck.js build
```

Open `dist/index.html` in a browser.

## Deck structure

A generated deck looks like this:

```
my-talk/
├── deck.json
├── slides/
│   ├── 01-title/
│   │   ├── index.html
│   │   ├── style.css
│   │   └── script.js
│   └── 02-overview/
│       └── index.html
├── assets/                         ← deck-level assets
├── template/                       ← vendored template copy
├── theme/                          ← vendored theme copy
└── dist/                           ← generated output
```

Each slide is a folder under `slides/`. The folder prefix controls ordering, so
`01-title` appears before `02-overview`. A slide's `index.html` must contain a
`<section class="slide">...</section>` block. Optional per-slide `style.css`,
`script.js`, images, and other assets live beside it.

The build writes `dist/index.html` and copies referenced files into `dist/assets/`.
Relative `href`, `src`, `poster`, and `srcset` paths in slide sections are
rewritten to point at their generated locations.

## CLI

```bash
node deck.js help
```

Subcommands:

| Command | Purpose |
|---------|---------|
| `new <deck-path>` | Create a deck with vendored template/theme, starter `deck.json`, `slides/`, and `assets/`. |
| `add <NN-name> [--scaffold=<name>] [--deck <path>]` | Add a slide folder from a scaffold. |
| `delete <NN-name> [--force] [--deck <path>]` | Delete a slide folder, prompting unless `--force` is used. |
| `clean-prefixes [--dry-run] [--deck <path>]` | Normalize slide prefixes to `01-`, `02-`, ... while preserving order. |
| `build [--deck <path>] [--debug]` | Build the deck into `<deck>/<output>/index.html`. |

Run `node deck.js <command> --help` for command-specific options.

## Templates and themes

`node deck.js new` copies a template and theme into the deck. This makes each
deck self-contained and safe to customize without changing this tool repository.

Use a different built-in or custom pair with:

```bash
node deck.js new my-talk \
  --template=templates/default \
  --theme=themes/default
```

Templates provide the HTML shell, navigation, and slide scaffolds. Themes provide
design tokens, base styles, widget styles, and print styles.

## Authoring notes

- Use one slide folder per slide.
- Use numeric prefixes for order: `01-intro`, `02-problem`, `02.5-detail`.
- Use `clean-prefixes` when you want to normalize fractional insertions.
- Put deck-wide assets in `assets/`.
- Put slide-local assets in the slide folder.
- Keep slide-specific JavaScript and CSS local to the slide when possible.
- The build refuses to write outside the deck root and wipes the configured
  output directory before rebuilding.

## License

MIT. See [LICENSE](LICENSE).
