/* ============================================================================
   viz/lib/kit.js — what every companion picture is built out of.

   A picture beside a derivation is driven by two numbers: which step is
   showing, and how far it has morphed toward the next one. Everything else is
   this file's job — turning a table of per-step states into a drawing that
   moves between them, and drawing the marks (calipers, arcs, brackets) that
   say what is being measured.

   The centre of it is tween(): given the state at step k, the state at k+1 and
   a fraction, it walks the two structures together and interpolates every
   number it finds. That is what keeps the per-derivation tables small — an
   author writes what the picture *is* at each step, never how it gets there.
   ========================================================================= */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;
  var V = A.viz;

  /* ------------------------------------------------------------- tween ---- */

  /* Interpolate two states. Numbers are eased between; arrays of objects are
     matched by their `key` so an item that only exists on one side fades
     rather than jumping; everything else switches at the midpoint. An item
     carries `_in` (0 while absent, 1 while present) so a drawing can fade it
     without the state table ever mentioning opacity. */
  function tween(a, b, f) {
    if (f <= 0 || b === undefined) return mark(a, 1);
    if (f >= 1 || a === undefined) return mark(b, 1);
    return blend(a, b, f);
  }

  function mark(v, live) {
    if (Array.isArray(v)) return v.map(function (x) { return mark(x, live); });
    if (v && typeof v === 'object') {
      var o = {}, k;
      for (k in v) if (Object.prototype.hasOwnProperty.call(v, k)) o[k] = mark(v[k], live);
      o._in = live;
      return o;
    }
    return v;
  }

  function blend(a, b, f) {
    if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * f;
    if (Array.isArray(a) && Array.isArray(b)) return blendList(a, b, f);
    if (a && b && typeof a === 'object' && typeof b === 'object') {
      var o = {}, k;
      for (k in a) if (Object.prototype.hasOwnProperty.call(a, k)) {
        o[k] = Object.prototype.hasOwnProperty.call(b, k) ? blend(a[k], b[k], f) : a[k];
      }
      for (k in b) if (Object.prototype.hasOwnProperty.call(b, k) && !(k in o)) o[k] = b[k];
      o._in = 1;
      return o;
    }
    /* Strings, booleans, nulls: no meaningful midpoint, so switch once the
       morph is more than half done — the same instant the step counter flips. */
    return f < 0.5 ? a : b;
  }

  function blendList(a, b, f) {
    var keyed = a.length && a[0] && typeof a[0] === 'object' && 'key' in a[0];
    if (!keyed) {
      if (a.length === b.length) {
        return a.map(function (x, i) { return blend(x, b[i], f); });
      }
      return f < 0.5 ? mark(a, 1) : mark(b, 1);
    }
    var out = [], seen = {};
    a.forEach(function (x) {
      var m = null;
      for (var i = 0; i < b.length; i++) if (b[i].key === x.key) { m = b[i]; break; }
      if (m) { seen[x.key] = 1; out.push(blend(x, m, f)); }
      else { var o = mark(x, 1); o._in = 1 - f; out.push(o); }   /* leaving */
    });
    b.forEach(function (y) {
      if (seen[y.key]) return;
      var o = mark(y, 1); o._in = f; out.push(o);                /* arriving */
    });
    return out;
  }

  V.tween = tween;

  /* Pick the state for (k, f) out of a table, so every picture reads its
     table the same way and a HOLD step is simply two equal entries. */
  V.at = function (states, k, f) {
    var n = states.length;
    if (!n) return null;
    var i = M.clamp(k | 0, 0, n - 1);
    var j = Math.min(i + 1, n - 1);
    return tween(states[i], states[j], i === j ? 0 : f);
  };

  /* --------------------------------------------------------- the frame ---- */

  /* Companion pictures are small — around 300x225 at a comfortable width, less
     when the equation is wide — so they are drawn in a viewBox close to their
     rendered size. Text then lands near its nominal 11px instead of being
     scaled to illegibility, which is what happens if a demo's 880-wide
     viewBox is squeezed into a third of a column. */
  V.W = 320;
  V.H = 240;

  V.frame = function (root, label, w, h) {
    var svg = S.root(w || V.W, h || V.H, label || '');
    S.defsArrows(svg);
    root.appendChild(svg);
    return svg;
  };

  /* Some derivations genuinely need two pictures at once — a parabola beside
     the grid whose area it plots, a trajectory beside the traces it produces.
     Split the host and let each half hold its own primitive. */
  V.split = function (root, n, weights) {
    root.setAttribute('data-split', String(n));
    var out = [];
    for (var i = 0; i < n; i++) {
      var d = document.createElement('div');
      d.className = 'viz__pane';
      d.style.flex = (weights && weights[i] ? weights[i] : 1) + ' 1 0';
      root.appendChild(d);
      out.push(d);
    }
    return out;
  };

  /* Elements are made once and mutated after that: a picture that rebuilds its
     nodes every frame shows up in the derivation's own frame budget. A pool
     hands back the same node for the same key and hides the ones a step does
     not ask for. */
  V.pool = function (parent, make) {
    var held = {}, used = {};
    return {
      use: function (key) {
        if (!held[key]) { held[key] = make(key); parent.appendChild(held[key]); }
        used[key] = 1;
        held[key].removeAttribute('visibility');
        return held[key];
      },
      sweep: function () {
        for (var k in held) if (!used[k]) held[k].setAttribute('visibility', 'hidden');
        used = {};
      },
      all: held
    };
  };

  /* --------------------------------------------------------- annotation --- */
  /* The marks that say what is being measured. Fragments of these were written
     three times over in the demos; they live here now so a caliper looks like
     a caliper wherever it appears. */

  var An = V.marks = {};

  /* An arc between two angles, for "this angle here". Radius is in pixels. */
  An.arcD = function (cx, cy, r, a0, a1) {
    /* A full turn has no arc: start and end coincide and the path draws
       nothing, so close it as two halves instead. */
    if (Math.abs(a1 - a0) >= Math.PI * 2 - 1e-6) {
      return 'M' + (cx + r).toFixed(2) + ' ' + cy.toFixed(2) +
             'A' + r.toFixed(2) + ' ' + r.toFixed(2) + ' 0 1 0 ' + (cx - r).toFixed(2) + ' ' + cy.toFixed(2) +
             'A' + r.toFixed(2) + ' ' + r.toFixed(2) + ' 0 1 0 ' + (cx + r).toFixed(2) + ' ' + cy.toFixed(2);
    }
    var big = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
    var sweep = a1 > a0 ? 0 : 1;
    return 'M' + (cx + Math.cos(a0) * r).toFixed(2) + ' ' + (cy - Math.sin(a0) * r).toFixed(2) +
           'A' + r.toFixed(2) + ' ' + r.toFixed(2) + ' 0 ' + big + ' ' + sweep + ' ' +
           (cx + Math.cos(a1) * r).toFixed(2) + ' ' + (cy - Math.sin(a1) * r).toFixed(2);
  };

  /* A caliper: a bar with end ticks, spanning a distance that is the point.
     Horizontal by default; `up` puts the ticks above the bar. */
  An.caliperD = function (x0, x1, y, tick) {
    var t = tick == null ? 4 : tick;
    return 'M' + x0.toFixed(2) + ' ' + (y - t).toFixed(2) + 'L' + x0.toFixed(2) + ' ' + (y + t).toFixed(2) +
           'M' + x0.toFixed(2) + ' ' + y.toFixed(2) + 'L' + x1.toFixed(2) + ' ' + y.toFixed(2) +
           'M' + x1.toFixed(2) + ' ' + (y - t).toFixed(2) + 'L' + x1.toFixed(2) + ' ' + (y + t).toFixed(2);
  };

  An.vCaliperD = function (y0, y1, x, tick) {
    var t = tick == null ? 4 : tick;
    return 'M' + (x - t).toFixed(2) + ' ' + y0.toFixed(2) + 'L' + (x + t).toFixed(2) + ' ' + y0.toFixed(2) +
           'M' + x.toFixed(2) + ' ' + y0.toFixed(2) + 'L' + x.toFixed(2) + ' ' + y1.toFixed(2) +
           'M' + (x - t).toFixed(2) + ' ' + y1.toFixed(2) + 'L' + (x + t).toFixed(2) + ' ' + y1.toFixed(2);
  };

  /* The square corner that says "exactly ninety degrees". a0 is the direction
     of one arm, in maths convention (y up). */
  An.rightAngleD = function (cx, cy, a0, a1, s) {
    var u = [Math.cos(a0) * s, -Math.sin(a0) * s];
    var v = [Math.cos(a1) * s, -Math.sin(a1) * s];
    return 'M' + (cx + u[0]).toFixed(2) + ' ' + (cy + u[1]).toFixed(2) +
           'L' + (cx + u[0] + v[0]).toFixed(2) + ' ' + (cy + u[1] + v[1]).toFixed(2) +
           'L' + (cx + v[0]).toFixed(2) + ' ' + (cy + v[1]).toFixed(2);
  };

  /* A brace joining two things that belong together. */
  An.braceD = function (x0, x1, y, depth) {
    var mid = (x0 + x1) / 2, dp = depth == null ? 6 : depth;
    return 'M' + x0.toFixed(2) + ' ' + y.toFixed(2) +
           'q0 ' + dp + ' ' + ((mid - x0) / 2).toFixed(2) + ' ' + dp +
           'L' + (mid - 1).toFixed(2) + ' ' + (y + dp).toFixed(2) +
           'M' + x1.toFixed(2) + ' ' + y.toFixed(2) +
           'q0 ' + dp + ' ' + ((mid - x1) / 2).toFixed(2) + ' ' + dp +
           'L' + (mid + 1).toFixed(2) + ' ' + (y + dp).toFixed(2) +
           'M' + mid.toFixed(2) + ' ' + (y + dp).toFixed(2) + 'l0 ' + (dp * 0.7).toFixed(2);
  };

  /* Tone names, so a state table can say 'wave' rather than 'w'. */
  var TONE = { wave: 'w', quantum: 'q', fail: 'f', ink: 'i', ghost: 'm', prob: 'p' };
  V.tone = function (t) { return TONE[t] || t || 'i'; };
  V.strokeClass = function (t) {
    return { wave: 's-wave', quantum: 's-quantum', fail: 's-fail', prob: 's-prob',
             ghost: 's-ghost', ink: 's-ink' }[t] || 's-ghost';
  };
  V.labelClass = function (t) {
    return { wave: 's-lbl-w', quantum: 's-lbl-q', fail: 's-lbl-f', prob: 's-lbl-p',
             ink: 's-lbl-b', ghost: 's-lbl' }[t] || 's-lbl';
  };
  V.fillClass = function (t) {
    return { wave: 's-fill-w', quantum: 's-fill-q', fail: 's-fill-f', prob: 's-fill-p',
             ink: 's-fill-i', ghost: 's-fill-m' }[t] || 's-fill-i';
  };

  /* Highlighting. A step that is pure algebra holds its picture still and
     lights the part the terms belong to, so `hl` keys from the derivation
     reach the drawing as a set. */
  V.lit = function (keys) {
    var set = {};
    (keys || []).forEach(function (k) { set[k] = 1; });
    return function (k) { return !!set[k]; };
  };
})(window.A = window.A || {});
