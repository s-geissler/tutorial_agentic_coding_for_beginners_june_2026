# Slide Design Guidelines

This project uses a slide design based on the corporate design of the
University of Würzburg. The goal is a clean, readable lecture deck that works
well at one fixed presentation zoom level.

## Core principles

### 1. University identity

- Use the University of Würzburg blue as the primary accent color.
- Cover slides use the university header image, expected at `<deck>/assets/header.png`
  (vendored to `dist/assets/brand/header.png` on build).
- Content slides use the compact brand mark, expected at `<deck>/assets/brand.png`
  (vendored to `dist/assets/brand/brand.png` on build).
- Prefer white backgrounds, light gray content panels, and blue separators.
- Avoid decorative gradients or unrelated accent colors unless they communicate
  semantic state, such as success, warning, or danger.

### 2. Fixed title position

- Every content slide keeps its title in the top-left corner.
- The title is the main navigational anchor of the slide and should not move
  even when the slide body is sparse.
- Subtitles or lead paragraphs may sit below the title, but should remain
  visually connected to the content area.

### 3. Center the content block, not every element

- Sparse slides should not leave content squished against the top, bottom, or
  one side.
- The slide body should be vertically centered in the remaining space below the
  title region.
- The entire content container should be horizontally centered.
- Elements inside that container should normally remain left-aligned.
- Avoid independently centering each paragraph, step, code block, or card unless
  the slide is intentionally a centered statement or cover slide.

Good:

```text
Title stays top-left

              ┌─────────────────────────────┐
              │ left-aligned content line    │
              │ left-aligned card/code block │
              │ left-aligned next step       │
              └─────────────────────────────┘
```

Avoid:

```text
Title stays top-left

     short element centered by itself
                  another element centered differently
  wide code block centered with unrelated left edge
```

### 4. Consistent readable font scale

- All presentation content must be readable at the same zoom level.
- Headings and important callouts can be larger, but body text, cards, widgets,
  captions, code, and table text should remain in the same general range.
- Avoid tiny metadata-style text inside main slide content.
- The footer and navigation controls may be smaller because they are peripheral,
  not presentation content.
- If a slide needs tiny text to fit, simplify the slide before shrinking the
  font.

### 5. Use space deliberately

- Dense slides may naturally fill more vertical space.
- Sparse slides should breathe and be centered within the available slide body.
- Keep generous margins around content and avoid edge-to-edge layouts except for
  intentional structural elements such as the footer or cover header.
- Prefer fewer, clearer elements over many small elements.

### 6. Reusable component styling

- Cards, steps, tables, diagrams, widgets, and code blocks should all feel like
  members of the same visual system.
- Use blue top or left rules to structure content.
- Use light gray panels for grouping.
- Avoid heavy shadows, rounded “app UI” styling, or dark theme visuals outside
  code blocks.
- Code blocks may remain dark for contrast, but should use readable font sizes.

## Slide types

### Cover slide

- Uses `<deck>/assets/header.png` (the university header image) across the top.
- Main title is centered and large.
- Supporting text is centered below the title.
- No footer is shown.

### Content slides

- Title remains top-left.
- Footer contains the university brand mark, deck title, and slide number.
- Main content is centered as a block below the title area.
- Internal content alignment is normally left-oriented.

### Widget-heavy slides

- Interactive widgets should follow the same spacing and font scale as static
  slide content.
- Widget labels, captions, buttons, and metadata should remain readable.
- If a widget becomes too dense, reduce content complexity before reducing font
  size.

### Image-heavy slides

- Images should be constrained to the available content area.
- Captions should be readable and visually subordinate, not tiny.
- Avoid images touching the footer or slide edges.

## Implementation notes

- Global visual rules live in the deck's `theme/` folder (built-in default:
  `themes/default/`, with `tokens.css` for design tokens, `base.css` for
  typography and the slide shell, `widgets.css` for widget look, `print.css`
  for print rules).
- Deck navigation, table-of-contents, and the cover-slide style live in the
  deck's `template/` folder (built-in default: `templates/default/`, with
  `_template.html` for the HTML shell and `nav.js` for the nav UI).
- Individual slides live in `<deck>/slides/<NN-name>/`. Each slide is a
  folder with `index.html`, `style.css`, `script.js`, and an optional
  `assets/` subfolder for slide-local media.
- The build tool is `deck.js` at the repo root. Generated output is
  `<deck>/dist/index.html` (with assets alongside). Rebuild it with:

```bash
node deck.js build
# or, from anywhere:
node deck.js build --deck <deck-path>
# verbose:
node deck.js build --debug
```

- The build is a tree copy + path rewrite + template substitution. It does
  not inline CSS or JS. All assets sit next to `index.html` in
  `dist/assets/...` and the deck opens over `file://` with no server.
- When changing the design, rebuild `unit0-mini/dist/index.html` and verify
  the example deck still renders. The example deck at `unit0-mini/`
  exercises every major widget and is the regression check.

## Design review checklist

Before considering a design change complete, check:

- [ ] Does every content slide keep the title top-left?
- [ ] Is sparse content centered as one coherent block?
- [ ] Are internal elements left-aligned unless intentionally centered?
- [ ] Are all main-content fonts readable at the same zoom level?
- [ ] Are widgets, captions, code, and tables not noticeably too small?
- [ ] Does the footer avoid competing with slide content?
- [ ] Does the deck still work after rebuilding `<deck>/dist/index.html`?
