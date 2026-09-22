# Physics 143a Derivation Atlas — build system

Build tooling and scroll engine for single-page, scroll-driven physics
explainers. Three documents walk through Physics 143a (Quantum Mechanics I)
Lecture 1, deriving every equation step by step and giving every step its own
animated diagram. A fourth, `linbo3`, is unrelated to the course: it is a visual
argument about lattice anisotropy on lithium niobate.

## What is here, and what is not

This repository contains the **machinery**: the build script, the verification
harness, the scroll runtime, and the scene modules that draw the physics.

It does **not** contain `content/`, which holds the prose, the equation source,
the exercise statements and the worked solutions for the three course documents.
That material derives from a course handout marked *"Unauthorized posting or
distribution outside Harvard prohibited"*, so it is gitignored and stays out of a
public repository. The finished site is published privately instead.

`node build.mjs` exits with an explanatory message if `content/` is absent.

The lithium niobate page carries no course material, so its content module is
committed, under `content-open/`. It builds and verifies from a clean clone.

## Layout

```
build.mjs           prerender TeX -> inline SVG, inline CSS/JS, emit dist/index.html
verify.mjs          Playwright harness: scroll the page, screenshot it, assert invariants
src/style.css       design tokens and components; dark default, full light theme
src/engine/
  math.js           numerics: Newton solver, Planck/Rayleigh-Jeans, sinc^2, PRNG, constants
  svg.js            SVG construction helpers, arrow markers, sampling, canvas fitting
  scroll.js         one rAF loop; hands every visible scene a 0 -> 1 progress value
  lattice.js        honeycomb tight binding: bands, Dirac points, the gap
src/scenes/*.js     one file per group of scenes; each registers via A.scene(id, fn)
content/            gitignored; see above
content-open/       content that is redistributable, so it is committed
```

## Documents

| name | output | content | scene prefix |
|---|---|---|---|
| `atlas` | `index.html` | `content/index.js` | `00-hero`, `1*` |
| `math` | `math.html` | `content/math/index.js` | `m*` |
| `pre2` | `pre2.html` | `content/pre2/index.js` | `p*` |
| `linbo3` | `linbo3.html` | `content-open/linbo3/index.js` | `ln*` |

A document is declared in the `DOCS` map in `build.mjs` and named again in the
one in `verify.mjs`. Scene files are assigned to a document by a regex on their
filename, so a new document needs a prefix no other document claims.

`linbo3` sets three keys the course pages do not. `chrome: false` drops the
toolbar and the progress rail, which between them would put more words on screen
than that piece is allowed. `wordCap` fails the build if the text over its
figures exceeds its budget. `doc` puts a `data-doc` attribute on the root
element, which is what scopes that page's own colour tokens; the course pages
emit byte-identical output to before it existed.

## Build

```sh
npm install
node build.mjs           # -> dist/index.html   (single self-contained file)
node verify.mjs          # -> .verify/*.png plus pass/fail checks

node build.mjs linbo3 && node verify.mjs linbo3
```

Both scripts take a document name and default to `atlas`.

### The lattice page

`linbo3` argues one thing: a honeycomb lattice of resonant pillars needs its
three bond directions to be equivalent, and lithium niobate will not let them
be. Ten scenes, almost no words, and the text budget enforced at build time.

Its mathematics lives in `src/engine/lattice.js` and is exact rather than
illustrative. A Dirac point exists where three coupling phasors close into a
triangle, so it exists exactly when no coupling exceeds the other two together;
past that the gap is twice the shortfall. Both the stick that fails to close and
the gap in the cone are driven by the one `diracMargin` value per frame, so they
cannot disagree, and `build.mjs` checks the closed forms for the gap width and
the Dirac point positions against a brute-force minimum of `|h(k)|` over the
zone.

One correction worth recording: the closure condition is a triangle inequality
on the coupling **magnitudes**. Sorting signed values gets every case with a
negative coupling wrong, which is exactly the triaxial pattern in the last
scene, where the lines along which couplings change sign are what cut out the
zigzag-terminated triangle.

The page claims no result. The threshold is exact and the in-plane anisotropy of
128 degree Y-cut lithium niobate is large and documented, but where that cut
sits relative to the threshold has not been measured, and the page says so.

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
