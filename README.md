# Physics 143a Derivation Atlas — build system

Build tooling and scroll engine for a single-page, scroll-driven walkthrough of
Physics 143a (Quantum Mechanics I) Lecture 1, in which every equation is derived
step by step and every step gets its own animated diagram.

## What is here, and what is not

This repository contains the **machinery**: the build script, the verification
harness, the scroll runtime, and the ~59 scene modules that draw the physics.

It does **not** contain `content/`, which holds the prose, the equation source,
the exercise statements and the worked solutions. That material derives from a
course handout marked *"Unauthorized posting or distribution outside Harvard
prohibited"*, so it is gitignored and stays out of a public repository. The
finished site is published privately instead.

`node build.mjs` exits with an explanatory message if `content/` is absent.

## Layout

```
build.mjs           prerender TeX -> inline SVG, inline CSS/JS, emit dist/index.html
verify.mjs          Playwright harness: scroll the page, screenshot it, assert invariants
src/style.css       design tokens and components; dark default, full light theme
src/engine/
  math.js           numerics: Newton solver, Planck/Rayleigh-Jeans, sinc^2, PRNG, constants
  svg.js            SVG construction helpers, arrow markers, sampling, canvas fitting
  scroll.js         one rAF loop; hands every visible scene a 0 -> 1 progress value
src/scenes/*.js     one file per group of scenes; each registers via A.scene(id, fn)
content/            gitignored; see above
```

## Build

```sh
npm install
node build.mjs      # -> dist/index.html   (single self-contained file)
node verify.mjs     # -> .verify/*.png plus pass/fail checks
```

### Why the maths is prerendered

Every equation is converted to inline SVG at build time by `mathjax-full`
(`fontCache: 'local'`). The published page therefore makes **no network request
for maths at all** — no CDN script, no web font, no flash of unstyled TeX. This
also sidesteps a hard constraint of the publishing target, whose content
security policy admits external stylesheets only from Google Fonts, which would
have ruled out KaTeX.

MathJax names its glyph paths `MJX-<n>-…` with a per-conversion counter, so a
cached rendering reused verbatim would put duplicate ids in one document and
`<use href="#id">` would resolve to the wrong glyph. `build.mjs` therefore
re-namespaces ids on every insertion, and fails the build if any duplicate id
survives.

## Writing a scene

A scene registers a mount function and returns an update function. The update
receives `p`, the scroll progress through the scene's own range, and `t`,
seconds since mount.

```js
A.scene('my-scene', function (root, api) {
  var svg = A.svg.root(900, 500, 'accessible description of what this shows');
  root.appendChild(svg);
  var curve = A.svg.path('', 's-wave');
  svg.appendChild(curve);

  return function (p, t) {
    A.svg.setD(curve, A.svg.polyD(A.svg.sample(200, 0, 1, function (u) {
      return [u * 900, 250 - Math.sin(u * 12) * 100 * A.math.beat(p, 0.1, 0.6)];
    })));
  };
});
```

Conventions worth keeping:

- **Compute, don't draw.** Trajectories are integrated from the equation of
  motion, spectra evaluated from the formula, diffraction patterns summed from
  the field. Nothing on the page is a traced illustration, and the verification
  step asserts the numbers.
- **Stage progress vs inline progress.** A scene inside a `.stage` gets `p = 0`
  when its sticky visual locks and `p = 1` when it releases. An inline figure
  ramps as it crosses the viewport. `A.math.beat(p, a, b)` carves a sub-range out
  of either.
- **Colours come from tokens.** Use the `s-wave` / `s-quantum` / `s-fail` /
  `s-prob` classes, or `A.svg.cssVar('--wave')` on canvas, so both themes work.
- **Respect `api.reduced`.** Under `prefers-reduced-motion` a scene should settle
  to a representative frame rather than animate.
- **Keep labels inside the viewBox.** `verify.mjs`'s companion scan catches text
  that spills; there is no clipping indicator otherwise.

## What verification checks

`node verify.mjs` drives the built file in headless Chromium and asserts:

- zero console errors and zero uncaught exceptions, in both themes;
- **zero external network requests**, proving the page is self-contained
  (the Google Fonts stylesheet is the one allowed exception, and is unreachable
  from a sandboxed runner, which is reported rather than failed);
- every registered scene mounts and reaches the end of its scroll range;
- no horizontal overflow at 390 px, 768 px and 1440 px;
- under `prefers-reduced-motion`, nothing on screen is left faded out.

Screenshots land in `.verify/` for both themes and are meant to be looked at, not
just counted.

---

# Problem Set 0 review site

A second, separate site lives in this repository: a self-study companion for the
waves and oscillations material behind Physics 143a Problem Set 0, together with
all the mathematics it rests on. It shares the atlas's design language and its
scroll runtime, but nothing else: it has **no build step**, and `index.html`
opens by double-clicking it.

```
index.html          contents, reading order, dependency map
styles.css          the design system (dark by default, full light theme)
site.js             numerics, physics, SVG helpers, controls, navigation, the rAF loop
derive.js           animated derivations
sections/*.html     one page per section
demos/*.js          one file per interactive demonstration
verify-site.mjs     the verification harness
```

## Running it

Open `index.html`. Mathematics is typeset by KaTeX from a CDN; with no network
the equations fall back to LaTeX source and everything else, demonstrations
included, still works.

## Verifying it

```sh
npm install
node verify-site.mjs              # every page, both themes, three widths
node verify-site.mjs --page 2-2   # one page
node verify-site.mjs --quick      # dark theme only, fewer screenshots
```

The harness checks the physics in Node before it opens a browser: every formula
a demonstration draws with is compared against the closed form its page derives.
Then, per page, it asserts that KaTeX rendered, that no maths was left as source
in the prose, that every demonstration draws something and reacts to its
controls, that every derivation runs to its last step with its moving terms
landing within ¾ of a pixel of the glyphs they replace, that nothing overflows
sideways at 390, 768 and 1440 px, and that reduced motion and a missing network
both degrade to something readable. Screenshots land in `.verify/site/`.

## What is in it

14 pages, 112 animated derivations, 19 interactive demonstrations. Every equation
that appears is derived on the page it appears on; the only things taken as given
are Newton's laws, Hooke's law, and — where it is used — that a particle's
momentum is `p = hbar k`.

| Page | Derivations | Demonstrations |
|---|---|---|
| index | — | dependency map |
| 1.1 complex numbers and Euler's formula | 8 | complex multiplication, rotating phasor |
| 1.2 second-order linear equations | 10 | initial conditions |
| 1.3 linear algebra, from the beginning | 22 | two pictures of a vector, a matrix acting on a grid, eigen-directions, the inner product of two functions |
| 1.4 Fourier series and transforms | 12 | harmonic builder, a pulse beside its transform |
| 2.1 the simple harmonic oscillator | 6 | mass, spring, phasor and energy |
| 2.2 coupled oscillators and normal modes | 14 | free-body diagram, the motion decomposed into modes |
| 2.3 travelling and plane waves | 6 | a wave with one crest tracked |
| 2.4 waves on strings | 11 | a pulse meeting a join |
| 2.5 standing waves | 4 | a standing wave and its two travelling halves |
| 2.6 wave packets and group velocity | 6 | a packet under a dispersion relation you set |
| 2.7 double-slit interference | 6 | fringes on a screen |
| 2.8 single-slit diffraction | 7 | the pattern as the slit narrows |
| 3 quick reference | — | — |

## Writing a derivation

Derivations are written as a list of equation states and animate between them as
the reader scrolls: every term that survives a step slides from where it was to
where it goes.

```html
<script type="text/x-derive" data-id="power-rule" data-title="The power rule">
> Start with the function. The exponent is the number about to move.
! hl n
\k{f}{f}(x) = \k{x}{x}^{\k{n}{2}}
---
> The exponent comes down in front, and the power drops by one.
\k{f}{f'}(x) = \k{n}{2}\,\k{x}{x}^{\k{n}{2}\k{e}{-1}}
</script>
```

- `---` on its own separates steps.
- `>` lines are the note shown beside that step; `$…$` maths is allowed.
- `!` lines are directives: `! hl a,b` highlights those terms while the step
  holds, `! result` boxes the final equation, `! arc k` / `! noarc k` force or
  suppress the little hop a term makes when it slides a long way.
- `\k{key}{tex}` names a term. Terms with the same key in consecutive steps are
  the same term, and move between them; everything else is matched by what it
  says. Use a key for anything whose journey is the point.

Untagged glyphs match by their own text, so `=` and `+` take care of themselves.
A key that appears once on the left and twice on the right splits, and the term
is cloned to both destinations; twice on the left and once on the right merges.

## Publishing it as one file

```sh
node bundle-artifact.mjs     # -> dist/artifact.html  (+ artifact.preview.html)
node verify-artifact.mjs     # drives it with the network cut off
```

`bundle-artifact.mjs` folds the whole site into a single self-contained HTML file
for publishing as an Artifact. The artifact runs under a content security policy
that blocks external stylesheets, fonts and images, so nothing is fetched: the
KaTeX runtime and its stylesheet are inlined and its twenty font files are
embedded as data URIs. The only request the page makes is for its two typefaces
from Google Fonts, and it is designed to be right when that fails.

The fourteen pages become fourteen `<section class="view">` elements in one
document, one of them visible. Every id inside a view is namespaced with its
view, so ids that were unique per page stay unique in one document, and the links
between pages become hash routes — a reference-table link to `(2.2.5)` opens
section 2.2 and lands on the equation. A view is typeset, its derivations built
and its demonstrations mounted the first time it is opened, never while hidden:
the derivation engine works entirely by measurement, and a hidden element
measures as zero.

`site.js` and `derive.js` are shared by both builds unchanged. Three seams make
that possible — `A.currentPage()`, `A.href()` and `A.viewRoot()` — which the
multi-page site leaves at their defaults and the bundle overrides.

`verify-artifact.mjs` opens the bundle with every request blocked and walks all
fourteen views, asserting the same invariants as `verify-site.mjs` plus the ones
that only exist here: nothing but the typefaces is ever requested, the embedded
faces actually load, exactly one view is visible at a time, and a link from one
view to an equation in another arrives at that equation.
