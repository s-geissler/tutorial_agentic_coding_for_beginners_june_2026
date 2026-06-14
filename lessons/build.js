#!/usr/bin/env node
/* ============================================================
   build.js
   ------------------------------------------------------------
   Bundles _template.html + shared/slide.css +
   shared/slide-widgets.js + slides/0001/*.html into the
   single self-contained 0001-agentic-coding-fundamentals.html
   the user opens in a browser. <img> references inside slides
   are resolved, the image files are copied next to the output
   deck, and the src is rewritten to a flat basename so the
   deck is fully self-contained (works under file://).

   Run after editing a slide (or any of the shared files):

       node lessons/build.js

   Both flags are required. Pass the slides directory and the
   output file as named flags (resolved relative to the current
   working directory; absolute paths also work). Both
   `--key value` and `--key=value` forms are accepted:

       node lessons/build.js --slides slides/0002 --output 0002-deck.html

   The output works with file:// (no server, no CORS) and
   contains everything inline.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT       = path.resolve(__dirname);
const TEMPLATE   = path.join(ROOT, '_template.html');
const SHARED_CSS = path.join(ROOT, 'shared', 'slide.css');
const WIDGETS_JS = path.join(ROOT, 'shared', 'slide-widgets.js');

// CLI: node build.js --slides <dir> --output <file>. Both flags
// are required. Paths are resolved relative to process.cwd()
// and may be absolute.
const KNOWN_FLAGS = new Set(['slides', 'output']);
const REQUIRED_FLAGS = ['slides', 'output'];

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) {
      throw new Error(`unexpected positional argument: ${a} (use --slides <dir> --output <file>)`);
    }
    const eq = a.indexOf('=');
    let key, value;
    if (eq !== -1) {
      key = a.slice(2, eq);
      value = a.slice(eq + 1);
    } else {
      key = a.slice(2);
      value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) {
        throw new Error(`flag --${key} requires a value`);
      }
      i++;
    }
    if (key in out) {
      throw new Error(`flag --${key} specified more than once`);
    }
    out[key] = value;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
for (const k of Object.keys(args)) {
  if (!KNOWN_FLAGS.has(k)) {
    throw new Error(`unknown flag --${k} (expected --slides or --output)`);
  }
}

const missing = REQUIRED_FLAGS.filter(k => !(k in args));
if (missing.length > 0) {
  throw new Error(
    `missing required flag(s): ${missing.map(f => '--' + f).join(', ')} ` +
    `(use --slides <dir> --output <file>)`
  );
}

const SLIDES_DIR = path.resolve(args.slides);
const OUTPUT     = path.resolve(args.output);

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

// Pull the <section class="slide" ...>...</section> block out
// of a slide file. We control the slide file format, so a
// greedy-to-</section> regex is reliable. Also collects any
// <img src="..."> references inside the section, resolves them
// against the slide's directory, and rewrites each src to a
// flat basename so the bundled deck can sit next to the image
// file (the caller is responsible for actually copying the
// images). Absolute URLs and data: URIs are left untouched.
function extractSection(slideHtml, slidePath) {
  const m = slideHtml.match(/<section class="slide"[\s\S]*?<\/section>/);
  if (!m) {
    throw new Error('no <section class="slide"> found in slide file');
  }
  const slideDir = path.dirname(slidePath);
  const images = [];
  const section = m[0].replace(
    /<img\b[^>]*?\bsrc=["']([^"']+)["'][^>]*>/g,
    (match, src) => {
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(src) || src.startsWith('data:')) {
        return match;
      }
      const abs = path.resolve(slideDir, src);
      if (!fs.existsSync(abs)) {
        throw new Error(`image not found: ${abs} (referenced in ${slidePath})`);
      }
      const basename = path.basename(abs);
      images.push({ src: abs, basename });
      return match.replace(/src=["'][^"']+["']/, `src="${basename}"`);
    }
  );
  return { section, images };
}

function build() {
  const template  = read(TEMPLATE);
  const sharedCss = read(SHARED_CSS);
  const widgetsJs = read(WIDGETS_JS);

  if (!template.includes('/* ===SHARED_CSS=== */')) {
    throw new Error('template is missing /* ===SHARED_CSS=== */ placeholder');
  }
  if (!template.includes('<!-- ===SLIDES=== -->')) {
    throw new Error('template is missing <!-- ===SLIDES=== --> placeholder');
  }
  if (!template.includes('/* ===WIDGETS_JS=== */')) {
    throw new Error('template is missing /* ===WIDGETS_JS=== */ placeholder');
  }

  if (!fs.existsSync(SLIDES_DIR) || !fs.statSync(SLIDES_DIR).isDirectory()) {
    throw new Error(`SLIDES_DIR does not exist or is not a directory: ${SLIDES_DIR}`);
  }

  // Read slides in lexicographic order: 01-..., 02-..., etc.
  // The user controls order via filename.
  const slideFiles = fs.readdirSync(SLIDES_DIR)
    .filter(f => f.endsWith('.html'))
    .sort();

  const slideBlocks = slideFiles.map(f => {
    const slidePath = path.join(SLIDES_DIR, f);
    const html = read(slidePath);
    return extractSection(html, slidePath);
  });

  const slidesBlock = slideBlocks
    .map(b => `\n    ${b.section}`)
    .join('\n');

  // Use replacement functions, not strings, so the inserted
  // content's $-patterns (e.g. `'$'` in a string literal) are
  // not interpreted as special replacement patterns.
  const output = template
    .replace('/* ===SHARED_CSS=== */', () => sharedCss)
    .replace('<!-- ===SLIDES=== -->', () => slidesBlock)
    .replace('/* ===WIDGETS_JS=== */', () => widgetsJs);

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, output);

  // Copy any images referenced by slides next to the output
  // deck, deduped by basename. The src in the inlined HTML was
  // already rewritten to that basename by extractSection.
  const outDir = path.dirname(OUTPUT);
  const seenImages = new Set();
  let imageCount = 0;
  for (const b of slideBlocks) {
    for (const img of b.images) {
      if (seenImages.has(img.basename)) continue;
      seenImages.add(img.basename);
      fs.copyFileSync(img.src, path.join(outDir, img.basename));
      imageCount++;
    }
  }

  const sizeKb = (fs.statSync(OUTPUT).size / 1024).toFixed(1);
  console.log(`Built ${path.relative(process.cwd(), OUTPUT)} (${sizeKb} KB) with ${slideFiles.length} slides${imageCount ? ' and ' + imageCount + ' image' + (imageCount === 1 ? '' : 's') : ''}`);
  if (slideFiles.length === 0) {
    console.warn('  WARNING: no slide files found in', SLIDES_DIR);
  }
}

build();
