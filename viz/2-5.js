/* ============================================================================
   viz/2-5.js — the pictures beside §2.5's derivations.

   A string with two ends. What the ends are is the whole content: a wall
   forces a node, a ring free to slide forces a flat arrival, and the two
   choices pick out different ladders of frequencies.
   ========================================================================= */
(function (A) {
  'use strict';
  var V = A.viz, M = A.math;
  var TAU = Math.PI * 2, L = 1;
  function sm(fn) { return V.samp(fn, 0, L); }

  /* ------------------------------------------- a wave that goes nowhere --- */
  A.viz('sw-sum', function (root) {
    var cu = V.curves(root, {
      label: 'Two waves running opposite ways, and the standing pattern they make.',
      rows: 2, x0: 0, x1: L, ranges: [[-1.25, 1.25], [-2.3, 2.3]], xLabel: 'x'
    });
    var k = 3 * Math.PI;
    var states = [
      { comp: 1, env: 0, nodes: 0, label: 'one each way' },
      { comp: 1, env: 0, nodes: 0, label: 'product to sum' },
      { comp: 0.4, env: 1, nodes: 1, label: 'nodes never move' },
      { comp: 0.25, env: 1, nodes: 1, label: 'it breathes in place' }
    ];
    return {
      animates: true,
      update: function (kk, f, t) {
        var s = V.at(states, kk, f);
        var w = 1.6;
        var nodes = [];
        for (var n = 0; n * Math.PI / k <= L + 1e-9; n++) {
          nodes.push({ key: 'n' + n, row: 1, kind: 'dot', x: n * Math.PI / k, y: 0,
                       tone: 'prob', r: 3.4, op: s.nodes });
        }
        cu.set({
          curves: [
            { key: 'r', pts: sm(function (x) { return Math.cos(k * x - w * t); }),
              tone: 'quantum', width: 1.8, op: s.comp },
            { key: 'l', pts: sm(function (x) { return Math.cos(k * x + w * t); }),
              tone: 'prob', width: 1.8, op: s.comp },
            { key: 's', row: 1, tone: 'wave', width: 2.4,
              pts: sm(function (x) { return 2 * Math.cos(k * x) * Math.cos(w * t); }) },
            { key: 'e1', row: 1, tone: 'ghost', width: 1.4, dash: true, op: s.env,
              pts: sm(function (x) { return 2 * Math.cos(k * x); }) },
            { key: 'e2', row: 1, tone: 'ghost', width: 1.4, dash: true, op: s.env,
              pts: sm(function (x) { return -2 * Math.cos(k * x); }) }
          ],
          marks: nodes,
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
      }
    };
  });

  /* ------------------------------------------------------ a fixed end ---- */
  A.viz('sw-sine-form', function (root) {
    var cu = V.curves(root, {
      label: 'A wall at one end: the reflection comes back inverted and the end never moves.',
      rows: 2, x0: 0, x1: L, ranges: [[-1.25, 1.25], [-2.3, 2.3]], xLabel: 'x'
    });
    var states = [
      { k: 3 * Math.PI, inv: 1, sweep: 0, label: 'the reflection is inverted' },
      { k: 3 * Math.PI, inv: 1, sweep: 0, label: 'cos P − cos Q' },
      { k: 3 * Math.PI, inv: 1, sweep: 0, label: 'sine is odd' },
      { k: 3.7 * Math.PI, inv: 1, sweep: 1, label: 'whatever k, that end stays put' }
    ];
    return {
      animates: true,
      update: function (kk, f, t) {
        var s = V.at(states, kk, f);
        var k = s.sweep ? (2.4 + 1.4 * (0.5 + 0.5 * Math.sin(t * 0.5))) * Math.PI : s.k;
        var w = 1.6;
        cu.set({
          curves: [
            { key: 'r', pts: sm(function (x) { return Math.cos(k * x - w * t); }),
              tone: 'quantum', width: 1.6, op: 0.5 },
            { key: 'l', pts: sm(function (x) { return -Math.cos(k * x + w * t); }),
              tone: 'fail', width: 1.6, op: 0.5 },
            { key: 's', row: 1, tone: 'wave', width: 2.4,
              pts: sm(function (x) { return 2 * Math.sin(k * x) * Math.sin(w * t); }) }
          ],
          hardware: [{ key: 'w', kind: 'wall', row: 1, x: 0, y: 0, tone: 'ink' }],
          marks: [{ key: 'z', row: 1, kind: 'dot', x: 0, y: 0, tone: 'prob', r: 4 }],
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
      }
    };
  });

  /* ------------------------------------------ both ends, and the ladder --- */
  function endsViz(root, label) {
    var panes = V.split(root, 2, [1, 0.55]);
    var cu = V.curves(panes[0], {
      label: label, w: 320, h: 142, x0: -0.05, x1: L + 0.05,
      ranges: [[-2.3, 2.3]], xLabel: 'x'
    });
    var lad = V.curves(panes[1], {
      label: 'The ladder of frequencies that fit.', w: 320, h: 92,
      x0: 0, x1: 5.4, ranges: [[0, 1]], xLabel: 'f / f₁'
    });
    return { cu: cu, lad: lad };
  }

  A.viz('sw-fixed-fixed', function (root) {
    var q = endsViz(root, 'Both ends held: only the k that put a node at the far end survive.');
    var states = [
      { k: 2.35 * Math.PI, fit: 0, arcs: 0, lad: 0, label: 'sweep k: the far end lifts off' },
      { k: 2.35 * Math.PI, fit: 0, arcs: 0, lad: 0, label: 'the time factor cannot vanish' },
      { k: 3 * Math.PI, fit: 1, arcs: 0, lad: 0, label: 'so sin kL = 0: k = nπ/L' },
      { k: 3 * Math.PI, fit: 1, arcs: 1, lad: 0, label: 'n half-wavelengths fit' },
      { k: 3 * Math.PI, fit: 1, arcs: 1, lad: 1, label: 'evenly spaced: every multiple of f₁' }
    ];
    return {
      animates: true,
      update: function (kk, f, t) {
        var s = V.at(states, kk, f);
        var k = s.k, w = 1.6;
        var n = Math.round(k * L / Math.PI);
        var arcs = [];
        for (var i = 0; i < n; i++) {
          arcs.push({ key: 'a' + i, kind: 'vline', x: (i + 1) / n * L, tone: 'prob', op: s.arcs * 0.7 });
        }
        q.cu.set({
          curves: [{ key: 's', tone: 'wave', width: 2.4,
                     pts: V.samp(function (x) { return 2 * Math.sin(k * x) * Math.sin(w * t); },
                                 -0.05, L + 0.05) }],
          hardware: [
            { key: 'w0', kind: 'wall', x: 0, y: 0, tone: 'ink' },
            { key: 'w1', kind: 'wall', x: L, y: 0, tone: 'ink' }
          ],
          marks: arcs.concat([
            { key: 'end', kind: 'dot', x: L, y: 2 * Math.sin(k * L) * Math.sin(w * t),
              tone: s.fit ? 'prob' : 'fail', r: 4.4 }
          ]),
          notes: [
            { key: 'n', x: L * 0.5, y: -2.18, text: s.arcs ? n + ' half-wavelengths' : '',
              tone: 'prob', op: s.arcs },
            { key: 'l', cap: true, text: s.label, tone: 'ghost' }
          ]
        });
        q.lad.set({
          bars: [1, 2, 3, 4, 5].map(function (i) {
            return { key: 'f' + i, x: i, y: 0.72, w: 0.1, tone: 'wave', op: 0.6 * s.lad };
          }),
          notes: [{ key: 'e', cap: true, text: s.lad ? 'f₁, 2f₁, 3f₁, …' : '', tone: 'wave', op: s.lad }]
        });
      }
    };
  });

  A.viz('sw-fixed-free', function (root) {
    var q = endsViz(root, 'A ring free to slide: the string must arrive flat, not still.');
    /* Odd quarter-wavelengths: k L = (2n−1)π/2. */
    function kOf(n) { return (2 * n - 1) * Math.PI / 2 / L; }
    var states = [
      { k: kOf(3), tan: 0, arcs: 0, lad: 0, label: 'still a sine at the held end' },
      { k: 1.7 * Math.PI, tan: 1, arcs: 0, lad: 0, label: 'a sloped ring would fly' },
      { k: kOf(3), tan: 1, arcs: 0, lad: 0, label: 'so cos kL = 0' },
      { k: kOf(3), tan: 1, arcs: 1, lad: 0, label: 'an odd number of quarters' },
      { k: kOf(3), tan: 1, arcs: 1, lad: 1, label: 'odd rungs only' }
    ];
    return {
      animates: true,
      update: function (kk, f, t) {
        var s = V.at(states, kk, f);
        var k = s.k, w = 1.6;
        var amp = Math.sin(w * t);
        var yEnd = 2 * Math.sin(k * L) * amp;
        var slope = 2 * k * Math.cos(k * L) * amp;
        var quarters = Math.round(k * L / (Math.PI / 2));
        q.cu.set({
          curves: [{ key: 's', tone: 'wave', width: 2.4,
                     pts: V.samp(function (x) { return 2 * Math.sin(k * x) * amp; },
                                 -0.05, L + 0.05) }],
          hardware: [
            { key: 'w0', kind: 'wall', x: 0, y: 0, tone: 'ink' },
            { key: 'ring', kind: 'ring', x: L, y: yEnd, tone: 'quantum' }
          ],
          marks: [{ key: 'tan', kind: 'seg', dash: false, tone: 'prob', op: s.tan,
                    x0: L - 0.22, y0: yEnd - slope * 0.22, x1: L + 0.05, y1: yEnd + slope * 0.05 }],
          notes: [
            { key: 'n', x: L * 0.5, y: -2.18, text: s.arcs ? quarters + ' quarter-wavelengths' : '',
              tone: 'prob', op: s.arcs },
            { key: 'l', cap: true, text: s.label, tone: 'ghost' }
          ]
        });
        q.lad.set({
          bars: [1, 2, 3, 4, 5].map(function (i) {
            return { key: 'f' + i, x: i, y: 0.72, w: 0.1,
                     tone: (i % 2) ? 'wave' : 'ghost', op: ((i % 2) ? 0.6 : 0.12) * s.lad };
          }),
          notes: [{ key: 'e', cap: true, text: s.lad ? 'even rungs missing' : '', tone: 'wave', op: s.lad }]
        });
      }
    };
  });
  void M; void TAU;
})(window.A = window.A || {});
