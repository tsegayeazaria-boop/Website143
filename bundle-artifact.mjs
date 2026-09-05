/* ============================================================================
   bundle-artifact.mjs — folds the whole site into one self-contained HTML file
   suitable for publishing as an Artifact.

   The artifact runs in a sandboxed iframe under a content security policy that
   blocks every external stylesheet, font and image. So nothing is fetched: the
   KaTeX runtime and its stylesheet are inlined, and its twenty font files are
   embedded as data URIs. The result has no network dependency at all.

   Fourteen separate pages become fourteen <section class="view"> elements in one
   document, only one of them visible. Every id inside a view is namespaced with
   its view, so ids that were unique per page stay unique in one document, and
   the links between pages become hash routes. Each view is typeset, its
   derivations built and its demonstrations mounted the first time it is opened —
   never while it is hidden, because a hidden element measures as zero and the
   derivation engine works entirely by measurement.

     node bundle-artifact.mjs            -> dist/artifact.html
   ========================================================================= */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const KATEX = join(ROOT, 'node_modules', 'katex', 'dist');
const OUT = join(ROOT, 'dist', 'artifact.html');

const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');

/* ------------------------------------------------------- the page list --- */
/* Read straight out of site.js so this file cannot drift from the site. */
function loadToc() {
  const g = {};
  new Function('window', 'document', 'globalThis', read('site.js'))(undefined, undefined, g);
  return g.A.toc;
}
const toc = loadToc();

/* ------------------------------------------------------------- KaTeX ----- */

function inlineKatexCss() {
  let css = readFileSync(join(KATEX, 'katex.min.css'), 'utf8');

  /* Embed the woff2 faces and drop the woff and ttf fallbacks: a relative url()
     would resolve against the artifact's own origin and fail silently, and every
     browser that can run this can read woff2. */
  const fonts = readdirSync(join(KATEX, 'fonts')).filter((f) => f.endsWith('.woff2'));
  let embedded = 0;
  for (const f of fonts) {
    const b64 = readFileSync(join(KATEX, 'fonts', f)).toString('base64');
    const before = css;
    css = css.split(`url(fonts/${f})`).join(`url(data:font/woff2;base64,${b64})`);
    if (css !== before) embedded++;
  }
  css = css.replace(/,\s*url\(fonts\/[^)]+\)\s*format\("(woff|truetype)"\)/g, '');

  const leftover = css.match(/url\(fonts\//g);
  if (leftover) throw new Error(`${leftover.length} KaTeX font reference(s) not embedded`);
  return { css, embedded };
}

/* A script's own text must not contain the sequence that would close its tag. */
function safeScript(js, what) {
  if (/<\/script/i.test(js)) {
    js = js.replace(/<\/script/gi, '<\\/script');
    console.log(`  note: escaped a literal </script inside ${what}`);
  }
  return js;
}

/* --------------------------------------------------------- page content -- */

/* Every id inside a view is prefixed with the view's own id, and every link is
   rewritten to the hash route that reaches it. */
function namespaceView(html, viewId) {
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

  let out = html.replace(/(\sid=")([^"]+)(")/g, (_, a, id, c) => `${a}${viewId}--${id}${c}`);

  /* Links within the page: #vectors -> #1-3/vectors */
  out = out.replace(/href="#([^"]+)"/g, (whole, frag) =>
    ids.has(frag) ? `href="#${viewId}/${frag}"` : whole);

  /* Links to another page: 2-2-coupled.html#eq-2-2-5 -> #2-2/eq-2-2-5 */
  out = out.replace(/href="(?:\.\.\/)?(?:sections\/)?([A-Za-z0-9._-]+\.html)(?:#([^"]*))?"/g,
    (whole, file, frag) => {
      const page = toc.pages.find((p) => basename(p.file) === file);
      if (!page) throw new Error(`link to unknown page ${file} in view ${viewId}`);
      return `href="#${page.id}${frag ? '/' + frag : ''}"`;
    });

  /* aria-controls and label-for follow their ids. */
  out = out.replace(/(\saria-labelledby=")([^"]+)(")/g, (_, a, id, c) =>
    ids.has(id) ? `${a}${viewId}--${id}${c}` : `${a}${id}${c}`);

  return out;
}

function extractMain(file, viewId) {
  const html = read(file);
  const m = html.match(/<main class="page">([\s\S]*?)<\/main>/);
  if (!m) throw new Error(`no <main class="page"> in ${file}`);
  return namespaceView(m[1], viewId);
}

/* --------------------------------------------------------------- build --- */

const { css: katexCss, embedded } = inlineKatexCss();
const siteCss = read('styles.css');

/* Styling the artifact adds nothing to the design: it only teaches the layout
   that a page is now a view, and that thirteen of them are put away. */
const artifactCss = `
/* ---------------------------------------------- single-document layout --- */
.view { display: block; }
.view[hidden] { display: none !important; }
/* The toolbar and sidebar are shared by every view, so they live outside them. */
.artifact-note {
  font-family: var(--mono);
  font-size: 0.6875rem;
  line-height: 1.8;
  color: var(--faint);
  border-top: 1px solid var(--hairline);
  margin-top: 2rem;
  padding-top: 1rem;
}
`;

const views = toc.pages.map((p) => ({
  id: p.id,
  title: p.title,
  html: extractMain(p.file, p.id)
}));

/* The router: the only code that exists solely for the artifact. */
const router = `
/* ============================================================================
   The router. On the site each section is its own page; here they are views in
   one document and the sidebar switches between them. A view is typeset, its
   derivations built and its demonstrations mounted the first time it is shown —
   doing any of that while it is hidden would measure everything as zero.
   ========================================================================= */
(function (A) {
  'use strict';
  var views = {};
  var ready = {};
  var current = null;

  [].slice.call(document.querySelectorAll('.view')).forEach(function (el) {
    views[el.getAttribute('data-view')] = el;
  });

  function parse() {
    var h = (location.hash || '').replace(/^#\\/?/, '');
    if (!h) return { view: 'index', anchor: null };
    var bits = h.split('/');
    var view = views[bits[0]] ? bits[0] : 'index';
    return { view: view, anchor: bits[1] || null };
  }

  /* The three seams site.js leaves for exactly this. */
  A.currentPage = function () { return current || parse().view; };
  A.href = function (p) { return '#' + p.id; };
  A.viewRoot = function () { return views[A.currentPage()] || document; };
  A.anchor = function (id) {
    var v = A.currentPage();
    return '#' + v + '/' + String(id).replace(v + '--', '');
  };

  function reveal(id, anchor, initial) {
    var el = views[id];
    if (!el) return;
    if (current === id) { scrollTo_(anchor); return; }

    Object.keys(views).forEach(function (k) { views[k].hidden = k !== id; });
    current = id;

    if (!ready[id]) {
      ready[id] = true;
      /* The view is on screen now, so everything below measures truthfully. */
      if (A.derive && A.derive.install) {
        try { A.derive.install(el); } catch (e) { console.error('[artifact] derivations:', e); }
      }
      A.renderMath(el);
      if (A.initReveal) A.initReveal();
      A.mountAll(el);
    }
    if (!initial) {
      A.buildNav();
      if (A.resizeAll) A.resizeAll();
    }
    var page = A.toc.byId(id);
    document.title = (page && page.num ? page.num + ' ' : '') +
                     (page ? page.title : '') + ' · Physics 143a';
    scrollTo_(anchor, initial);
  }

  function scrollTo_(anchor, initial) {
    if (!anchor) { if (!initial) window.scrollTo({ top: 0, behavior: 'instant' }); return; }
    var id = current + '--' + anchor;
    /* A freshly opened view settles from the top down: each derivation stage only
       claims its height once it has been measured, and it is only measured once it
       comes into view. So the target keeps moving while we chase it. Aim, look
       again, and stop when it has stopped moving rather than after a fixed wait. */
    var tries = 0, lastY = null;
    (function aim() {
      var t = document.getElementById(id);
      if (!t) return;
      /* Instant, not the page's smooth default: a view switch can move tens of
         thousands of pixels, and gliding through all of it is disorienting. */
      t.scrollIntoView({ block: 'start', behavior: 'instant' });
      var y = Math.round(window.scrollY);
      var settled = lastY !== null && Math.abs(y - lastY) < 2;
      lastY = y;
      if (!settled && ++tries < 14) {
        requestAnimationFrame(function () { setTimeout(aim, 60); });
      }
    })();
  }

  /* Reveal the first view before site.js boots, so its scope is a live element. */
  var first = parse();
  Object.keys(views).forEach(function (k) { views[k].hidden = k !== first.view; });
  current = first.view;

  window.addEventListener('hashchange', function () {
    var r = parse();
    reveal(r.view, r.anchor);
  });

  /* After boot, wire the initial anchor and take over subsequent navigation. */
  document.addEventListener('DOMContentLoaded', function () {
    if (first.anchor) scrollTo_(first.anchor, false);
    var page = A.toc.byId(first.view);
    document.title = (page && page.num ? page.num + ' ' : '') +
                     (page ? page.title : '') + ' · Physics 143a';
  });

  A.reveal = reveal;
})(window.A = window.A || {});
`;

const demos = readdirSync(join(ROOT, 'demos')).filter((f) => f.endsWith('.js')).sort();

const html =
`<title>Physics 143a Companion</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
${siteCss}
${artifactCss}
/* ------------------------------------------- KaTeX, with its fonts inside --- */
${katexCss}
</style>

<div class="toolbar">
  <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="sidebar">Contents</button>
  <a class="toolbar__home" href="#index">Physics 143a · Pset 0</a>
  <span class="toolbar__spacer"></span>
  <span class="toolbar__now"></span>
  <button class="theme-toggle" type="button">Light</button>
</div>
<nav class="sidebar" id="sidebar" aria-label="Contents"><a href="#index">Contents</a></nav>
<div class="nav-backdrop"></div>
<div class="sidebar__fill"></div>

<main class="page">
${views.map((v) => `<section class="view" data-view="${v.id}" hidden>\n${v.html}\n</section>`).join('\n\n')}
</main>

<footer class="colophon">
  <div class="measure">
    <p><strong>Physics 143a · Problem Set 0 companion.</strong> A review of the waves and
    oscillations material from Physics 15c, with the mathematics it rests on.</p>
    <p>Every equation here is derived on the page it appears on. The derivations animate as you
    scroll: each term slides from where it was to where it goes. Every number in a demonstration is
    computed from the equation the page derives, never traced.</p>
    <p class="artifact-note">Self-contained: the typesetting engine, its stylesheet and its twenty
    fonts are all embedded, so nothing is loaded from the network and nothing leaves this page.</p>
  </div>
</footer>

<script>
${safeScript(readFileSync(join(KATEX, 'katex.min.js'), 'utf8'), 'katex')}
</script>
<script>
${safeScript(readFileSync(join(KATEX, 'contrib', 'auto-render.min.js'), 'utf8'), 'auto-render')}
</script>
<script>
${safeScript(read('site.js'), 'site.js')}
</script>
<script>
${safeScript(read('derive.js'), 'derive.js')}
</script>
${demos.map((f) => `<script>\n/* --- demos/${f} --- */\n` + safeScript(read('demos', f), f) + '\n</script>').join('\n')}
<script>
${router}
</script>
`;

if (!existsSync(join(ROOT, 'dist'))) mkdirSync(join(ROOT, 'dist'));
writeFileSync(OUT, html);

/* A second copy, wrapped the way the publisher wraps it. The file above is what
   gets published — it must NOT carry its own doctype or head — but that means it
   cannot be opened directly for testing: with no doctype the browser drops into
   quirks mode and KaTeX refuses to run. The preview reproduces the wrapper, reset
   and all, so the local checks see the same cascade a reader will. */
const PREVIEW = join(ROOT, 'dist', 'artifact.preview.html');
writeFileSync(PREVIEW,
`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root { color-scheme: light; }
  body { margin: 0; font: 14px system-ui, -apple-system, sans-serif; background: #fafaf9; }
  img { max-width: 100%; }
  [hidden] { display: none !important; }
</style>
</head>
<body>
${html}
</body>
</html>
`);

/* ------------------------------------------------------------- report ---- */

/* The markup alone. Script bodies are full of strings that look like markup —
   href concatenations, the selector derive.js uses to find its own blocks — and
   checking those would report failures that are not there. */
const markup = html.replace(/<script>[\s\S]*?<\/script>/g, '');

const kb = (n) => (n / 1024).toFixed(0) + ' KB';
const size = Buffer.byteLength(html);
console.log(`built dist/artifact.html  ${kb(size)}   (+ artifact.preview.html for local checks)`);
console.log(`  views ${views.length}   demos ${demos.length}   fonts embedded ${embedded}`);
console.log(`  derivations ${(markup.match(/type="text\/x-derive"/g) || []).length}`);

/* Guards. Every one of these fails silently in a sandboxed artifact, so it has
   to fail loudly here instead. */
const fails = [];
if (/url\(fonts\//.test(html)) fails.push('a KaTeX font is still a relative url()');
for (const l of markup.match(/<link\b[^>]*>/gi) || []) {
  if (!/fonts\.(googleapis|gstatic)\.com/.test(l)) {
    fails.push(`a stylesheet that is not Google Fonts survived and would be blocked: ${l.slice(0, 70)}`);
  }
}
if (/<script[^>]+src=/i.test(markup)) fails.push('an external script src survived');
if (/@import/i.test(html)) fails.push('an @import survived');
/* Anything the page would have to go to the network for. */
const remote = markup.match(/(?:src|srcset|poster)="(?!data:)[^"]*"/g);
if (remote) fails.push(`remote asset reference(s): ${[...new Set(remote)].slice(0, 3).join(', ')}`);

const stray = markup.match(/href="(?!#|https?:|mailto:)[^"]*"/g);
if (stray) fails.push(`links that do not resolve in one document: ${[...new Set(stray)].slice(0, 4).join(', ')}`);

const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const dupes = [...new Set(ids.filter((v, i) => ids.indexOf(v) !== i))];
if (dupes.length) fails.push(`duplicate ids: ${dupes.slice(0, 6).join(', ')}`);

/* Every hash link must name a view that exists, and an anchor that exists in it. */
const viewIds = new Set(views.map((v) => v.id));
const idSet = new Set(ids);
for (const m of markup.matchAll(/href="#([^"]+)"/g)) {
  const [v, a] = m[1].split('/');
  if (!viewIds.has(v)) { fails.push(`link to a view that does not exist: #${m[1]}`); continue; }
  if (a && !idSet.has(`${v}--${a}`)) fails.push(`link to an anchor that does not exist: #${m[1]}`);
}

if (size > 16 * 1024 * 1024) fails.push(`over the 16MB limit at ${kb(size)}`);

if (fails.length) {
  console.error('\n' + fails.map((f) => '  FAIL  ' + f).join('\n') + '\n');
  process.exit(1);
}
console.log('  self-contained, no duplicate ids, every link and anchor resolves');
