/* ============================================================================
   viz/2-2.js — the pictures beside §2.2's derivations.

   Two masses and three springs, on every derivation on the page. The middle
   spring is the whole story: a term that cancels in the algebra is a spring
   that goes slack, and a term that doubles is a spring worked twice as hard.
   Where the algebra says κ(x₂ − x₁), the caliper on that spring reads it.
   ========================================================================= */
(function (A) {
  'use strict';
  var V = A.viz, P = A.phys, M = A.math;
  var TAU = Math.PI * 2, T1 = 3 * TAU;

  var k = 1, kap = 0.42, m = 1;
  var W1 = Math.sqrt(k / m), W2 = Math.sqrt((k + 2 * kap) / m);

  function benchOf(root, opts) {
    opts = opts || {};
    return V.bench(root, {
      label: opts.label || 'Two masses between two walls, joined by a third spring.',
      w: 320, h: opts.h || 92, n: 2, box: opts.box || 19, scale: opts.scale || 30,
      springs: true
    });
  }

  /* ------------------------------------------------------------- forces --- */
  /* The caliper on the middle spring reads x₂ − x₁ directly: slide both masses
     the same way and it stays at zero however far they go. */
  function forceViz(root, which) {
    var panes = V.split(root, 2, [1, 0.34]);
    var bn = benchOf(panes[0], { h: 148, box: 22, scale: 38 });
    var cu = V.curves(panes[1], {
      label: 'The stretch of the middle spring.', w: 320, h: 74,
      x0: -1.6, x1: 1.6, ranges: [[-0.2, 1.05]], xLabel: ''
    });
    void which;
    return { bn: bn, cu: cu };
  }

  function forceStates(mass) {
    /* mass 0 or 1: which block the arrows are drawn on. */
    var other = 1 - mass;
    return [
      { x: [0.55, -0.5], cal: 1, mid: 0, wall: 0, net: 0, together: 0,
        label: 'stretch = x₂ − x₁' },
      { x: [0.55, -0.5], cal: 1, mid: 1, wall: 0, net: 0, together: 0,
        label: 'the middle spring pulls' },
      { x: [0.55, -0.5], cal: 1, mid: 1, wall: 1, net: 0, together: 0,
        label: 'and the wall spring' },
      { x: [0.55, -0.5], cal: 0.4, mid: 0.3, wall: 0.3, net: 1, together: 0,
        label: 'their sum', mass: mass, other: other }
    ];
  }

  A.viz('cpl-forces-1', function (root) {
    var q = forceViz(root, 0);
    var states = forceStates(0);
    /* The first two steps let the reader see the difference doing its work:
       slide both masses together and the caliper stays shut. */
    states[0].drift = 1;
    return {
      animates: true,
      update: function (kk, f, t) {
        var s = V.at(states, kk, f);
        var d = (s.drift || 0) * Math.sin(t * 0.6) * 0.5;
        var x1 = s.x[0] + d, x2 = s.x[1] + d;
        var stretch = x2 - x1;
        q.bn.set({
          x: [x1, x2],
          calipers: [{ key: 'mid', from: 0, to: 1, tone: 'prob', op: s.cal }],
          arrows: [
            { key: 'k', on: 0, dx: kap * stretch * 2.4, tone: 'prob', above: true, op: s.mid },
            { key: 'w', on: 0, dx: -k * x1 * 2.4, tone: 'wave', above: false, op: s.wall },
            { key: 'n', on: 0, dx: (kap * stretch - k * x1) * 2.4, tone: 'fail', above: true, op: s.net }
          ],
          notes: [
            { key: 'c', i: 0.5, py: q.bn.calY - 6, text: s.cal > 0.6 ? 'x₂ − x₁' : '', tone: 'prob', op: s.cal },
            { key: 'l', cap: true, text: s.label, tone: 'ghost' }
          ]
        });
        q.cu.set({
          bars: [{ key: 's', x: 0, y: Math.abs(stretch), w: 0.5, tone: 'prob', op: 0.55 }],
          notes: [{ key: 'v', x: 0, y: Math.abs(stretch), dy: -7,
                    text: Math.abs(stretch) < 0.02 ? 'slack' : '', tone: 'prob' }]
        });
      }
    };
  });

  A.viz('cpl-forces-2', function (root) {
    var q = forceViz(root, 1);
    var states = [
      { x: [0.55, -0.5], pair: 1, wall: 0, net: 0, label: 'equal and opposite' },
      { x: [0.55, -0.5], pair: 1, wall: 1, net: 0, label: 'plus the right-hand wall' },
      { x: [0.55, -0.5], pair: 0.3, wall: 0.3, net: 1, label: 'the mirror of the first law' }
    ];
    return {
      animates: true,
      update: function (kk, f) {
        var s = V.at(states, kk, f);
        var x1 = s.x[0], x2 = s.x[1], stretch = x2 - x1;
        q.bn.set({
          x: [x1, x2],
          calipers: [{ key: 'mid', from: 0, to: 1, tone: 'prob', op: 0.5 }],
          arrows: [
            { key: 'p1', on: 0, dx: kap * stretch * 2.4, tone: 'prob', above: true, op: s.pair },
            { key: 'p2', on: 1, dx: -kap * stretch * 2.4, tone: 'prob', above: true, op: s.pair },
            { key: 'w', on: 1, dx: -k * x2 * 2.4, tone: 'wave', above: false, op: s.wall },
            { key: 'n', on: 1, dx: (-kap * stretch - k * x2) * 2.4, tone: 'fail', above: true, op: s.net }
          ],
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
        q.cu.set({ bars: [{ key: 's', x: 0, y: Math.abs(stretch), w: 0.5, tone: 'prob', op: 0.55 }] });
      }
    };
  });

  A.viz('cpl-eom', function (root) {
    var bn = benchOf(root, { h: 128, box: 24, scale: 44,
      label: 'Each acceleration depends on where the other mass is.' });
    var states = [
      { a1: 1, a2: 0, tie: 1, label: "m₁'s acceleration needs x₂" },
      { a1: 0.3, a2: 1, tie: 1, label: "and m₂'s needs x₁" },
      { a1: 1, a2: 1, tie: 1, label: 'neither can be solved alone' }
    ];
    return {
      animates: true,
      update: function (kk, f, t) {
        var s = V.at(states, kk, f);
        var x1 = 0.55 * Math.cos(t * 0.5), x2 = -0.45 * Math.cos(t * 0.72);
        var A1 = (-(k + kap) * x1 + kap * x2) / m, A2 = (kap * x1 - (k + kap) * x2) / m;
        bn.set({
          x: [x1, x2],
          calipers: [{ key: 'mid', from: 0, to: 1, tone: 'prob', op: s.tie * 0.7 }],
          arrows: [
            { key: 'a1', on: 0, dx: A1 * 2.2, tone: 'quantum', above: true, op: s.a1 },
            { key: 'a2', on: 1, dx: A2 * 2.2, tone: 'quantum', above: true, op: s.a2 }
          ],
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
      }
    };
  });

  /* ------------------------------------------------ the matrix, read off --- */
  A.viz('cpl-matrix-entries', function (root) {
    var panes = V.split(root, 2, [1, 0.85]);
    var bn = benchOf(panes[0], { h: 112, box: 20, scale: 32,
      label: 'Each matrix entry, and the springs it comes from.' });
    var tab = V.cells(panes[1], {
      label: 'The stiffness matrix.', w: 320, h: 104, cols: 2, rows: 2, padL: 74, padT: 20
    });
    var TXT = [['k + κ', '−κ'], ['−κ', 'k + κ']];
    function cells(pick) {
      var out = [];
      for (var r = 0; r < 2; r++) for (var c = 0; c < 2; c++) {
        var on = pick == null || (pick[0] === r && pick[1] === c);
        out.push({ key: r + '' + c, row: r, col: c, text: TXT[r][c],
                   tone: on ? 'quantum' : 'ghost', fill: on ? 0.3 : 0.06, op: on ? 1 : 0.4 });
      }
      return out;
    }
    var states = [
      { pick: null, lit: [], sign: 0, label: 'two rows, one per mass' },
      { pick: [0, 0], lit: [0, 1], sign: 0, label: "K₁₁: both of m₁'s springs" },
      { pick: [0, 1], lit: [1], sign: 1, label: 'K₁₂: the middle spring only' },
      { pick: [1, 0], lit: [1], sign: 1, label: 'K₁₂ = K₂₁ — one spring, both ends' }
    ];
    return {
      update: function (kk, f) {
        var s = V.at(states, kk, f);
        var pick = states[M.clamp(f > 0.5 ? kk + 1 : kk, 0, 3)].pick;
        var lit = states[M.clamp(f > 0.5 ? kk + 1 : kk, 0, 3)].lit;
        bn.set({
          x: [0.4, -0.3],
          /* Only the springs that entry depends on stay bright. */
          slack: [0, 1, 2].filter(function (j) { return lit.indexOf(j) === -1 && lit.length; }),
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
        tab.set({ cells: cells(pick) });
        void s;
      }
    };
  });

  /* ---------------------------------------------- one shared frequency ----- */
  A.viz('cpl-ansatz', function (root) {
    var panes = V.split(root, 2, [1, 0.62]);
    var bn = benchOf(panes[0], { h: 130, box: 21, scale: 34,
      label: 'Both masses on one clock, holding one fixed ratio.' });
    var pl = V.plane(panes[1], {
      label: 'The shared clock, which cancels out.',
      w: 320, h: 86, unit: 30, cx: 160, cy: 43, xLabel: '', yLabel: ''
    });
    var states = [
      { clock: 1, accel: 0, label: 'one clock, one shape' },
      { clock: 1, accel: 0, label: 'two derivatives: two quarter turns' },
      { clock: 1, accel: 1, label: '(iω)² = −ω²' },
      { clock: 1, accel: 1, label: 'both sides, on both masses' },
      { clock: 0.12, accel: 1, label: 'the clock cancels; the shape survives' },
      { clock: 0.12, accel: 1, label: 'and only the shape is left' }
    ];
    return {
      animates: true,
      update: function (kk, f, t) {
        var s = V.at(states, kk, f);
        var ph = t * 0.85, c = Math.cos(ph);
        var a1 = 1, a2 = 0.62;                    /* the fixed ratio */
        bn.set({
          x: [a1 * c * 0.7, a2 * c * 0.7],
          arrows: [
            { key: 'a1', on: 0, dx: -a1 * c * 1.4, tone: 'quantum', above: true, op: s.accel },
            { key: 'a2', on: 1, dx: -a2 * c * 1.4, tone: 'quantum', above: true, op: s.accel }
          ],
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
        pl.set({
          grid: false, circle: 1, circleOp: 0.5 * s.clock,
          arrows: [{ key: 'h', ox: 0, oy: 0, x: Math.cos(ph), y: Math.sin(ph),
                     tone: 'wave', width: 2.4, op: s.clock }],
          notes: [{ key: 'e', px: 160, py: 50, text: s.clock < 0.4 ? 'gone' : '', tone: 'ghost',
                    op: 1 - s.clock }]
        });
      }
    };
  });

  A.viz('cpl-is-eigen', function (root) {
    var panes = V.split(root, 2, [1, 0.55]);
    var pl = V.plane(panes[0], {
      label: 'The shape as a vector, and where the stiffness matrix sends it.',
      w: 320, h: 138, unit: 30, cx: 160, cy: 70
    });
    var bn = benchOf(panes[1], { h: 78, box: 17, scale: 26, label: 'The motion that shape means.' });
    var Km = [(k + kap) / m, -kap / m, -kap / m, (k + kap) / m];
    function st(ang, imageOp, raysOp, label) {
      var v = [Math.cos(ang) * 1.5, Math.sin(ang) * 1.5];
      var im = P.matVec(Km[0], Km[1], Km[2], Km[3], v);
      return {
        pl: {
          grid: true, map: [1, 0, 0, 1], circle: 1.5, circleOp: 0.35,
          rays: raysOp ? [
            { key: 'r1', x: 1, y: 1, tone: 'prob', op: raysOp * 0.6 },
            { key: 'r2', x: 1, y: -1, tone: 'prob', op: raysOp * 0.6 }
          ] : [],
          arrows: [
            { key: 'a', ox: 0, oy: 0, x: v[0], y: v[1], tone: 'wave', width: 2.8 },
            { key: 'Ka', ox: 0, oy: 0, x: im[0], y: im[1], tone: 'quantum', width: 2.2, op: imageOp }
          ],
          notes: [
            { key: 'a', x: v[0] * 0.6 - 0.3, y: v[1] * 0.6, text: 'a', tone: 'wave' },
            { key: 'l', cap: true, text: label, tone: 'ghost' }
          ]
        },
        shape: [Math.cos(ang), Math.sin(ang)]
      };
    }
    var states = [
      st(0.9, 0, 0, 'M = mI: a plain scaling'),
      st(0.9, 1, 0, 'input and image'),
      st(0.9, 1, 0, 'dividing by m shortens, does not turn'),
      st(Math.PI / 4, 1, 1, 'at (1,1) the image lies along the input')
    ];
    return {
      animates: true,
      update: function (kk, f, t) {
        var s = V.at(states, kk, f);
        pl.set(s.pl);
        var c = Math.cos(t * 0.9);
        bn.set({ x: [s.shape[0] * c * 0.9, s.shape[1] * c * 0.9] });
      }
    };
  });

  /* -------------------------------------------------- the two frequencies -- */
  function freqStrip(root, h) {
    return V.curves(root, {
      label: 'The frequencies this apparatus can ring at.',
      w: 320, h: h || 80, x0: 0.5, x1: 1.9, ranges: [[0, 1]], xLabel: 'ω'
    });
  }
  function freqMarks(showBoth, pick) {
    return {
      marks: [
        { key: 'w1', kind: 'dot', x: W1, y: 0.28, tone: pick === 1 ? 'quantum' : 'wave',
          r: pick === 1 ? 5 : 3.4, op: showBoth ? 1 : 0 },
        { key: 'w2', kind: 'dot', x: W2, y: 0.28, tone: pick === 2 ? 'quantum' : 'wave',
          r: pick === 2 ? 5 : 3.4, op: showBoth ? 1 : 0 }
      ],
      notes: [
        { key: 'w1', x: W1, y: 0.28, dy: -9, text: showBoth ? 'ω₁' : '', tone: 'wave', op: showBoth },
        { key: 'w2', x: W2, y: 0.28, dy: -9, text: showBoth ? 'ω₂' : '', tone: 'wave', op: showBoth }
      ]
    };
  }

  A.viz('cpl-char-eq', function (root) {
    var panes = V.split(root, 2, [1, 0.5]);
    var bn = benchOf(panes[0], { h: 130, box: 21, scale: 34,
      label: 'The apparatus running at whichever frequency is marked.' });
    var fr = freqStrip(panes[1], 78);
    var states = [
      { mode: 0, both: 0, pick: 0, label: 'k + κ − mω² on the diagonal' },
      { mode: 0, both: 0, pick: 0, label: 'a difference of two squares' },
      { mode: 0, both: 1, pick: 0, label: 'two roots' },
      { mode: 1, both: 1, pick: 1, label: 'upper sign: the κ terms cancel' },
      { mode: 2, both: 1, pick: 2, label: 'lower sign: they add' }
    ];
    return {
      animates: true,
      update: function (kk, f, t) {
        var s = V.at(states, kk, f);
        var mode = states[M.clamp(f > 0.5 ? kk + 1 : kk, 0, 4)].mode;
        var w = mode === 2 ? W2 : W1;
        var c = Math.cos(w * t * 1.4) * 0.75;
        var sign = mode === 2 ? -1 : 1;
        bn.set({
          x: mode ? [c, sign * c] : [0.45, -0.35],
          /* In the first mode the middle spring never changes length. */
          slack: mode === 1 ? [1] : [],
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
        var fm = freqMarks(s.both > 0.5, states[M.clamp(f > 0.5 ? kk + 1 : kk, 0, 4)].pick);
        fr.set(fm);
      }
    };
  });

  A.viz('cpl-mode-shapes', function (root) {
    var panes = V.split(root, 2, [1, 0.62]);
    var bn = benchOf(panes[0], { h: 130, box: 21, scale: 34,
      label: 'The shape each frequency forces.' });
    var pl = V.plane(panes[1], {
      label: 'The two shapes as vectors, at right angles.',
      w: 320, h: 86, unit: 24, cx: 160, cy: 43
    });
    var states = [
      { mode: 1, a: [0, 0], label: 'put ω₁ in' },
      { mode: 1, a: [1, 1], label: 'the top row: a₁ = a₂' },
      { mode: 1, a: [1, 1], label: 'together' },
      { mode: 2, a: [1, 1], label: 'now ω₂' },
      { mode: 2, a: [1, -1], label: 'equal and opposite' }
    ];
    return {
      animates: true,
      update: function (kk, f, t) {
        var s = V.at(states, kk, f);
        var idx = M.clamp(f > 0.5 ? kk + 1 : kk, 0, 4);
        var mode = states[idx].mode;
        var w = mode === 2 ? W2 : W1;
        var c = Math.cos(w * t * 1.4) * 0.75;
        bn.set({
          x: [c, (mode === 2 ? -1 : 1) * c],
          slack: mode === 1 ? [1] : [],
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
        pl.set({
          grid: true,
          arrows: [
            { key: 'v1', ox: 0, oy: 0, x: 1, y: 1, tone: 'wave', width: 2.6,
              op: idx >= 1 ? 1 : 0.15 },
            { key: 'v2', ox: 0, oy: 0, x: 1, y: -1, tone: 'quantum', width: 2.6,
              op: idx >= 4 ? 1 : 0.15 }
          ],
          marks: [{ key: 'r', kind: 'right', x: 0, y: 0, a0: Math.PI / 4, a1: -Math.PI / 4,
                    s: 9, tone: 'prob', op: idx >= 4 ? 1 : 0 }],
          notes: [
            { key: 'a', x: 1.6, y: 1.35, text: '(1, 1)', tone: 'wave', op: idx >= 1 ? 1 : 0 },
            { key: 'b', x: 1.7, y: -1.35, text: '(1, −1)', tone: 'quantum', op: idx >= 4 ? 1 : 0 }
          ]
        });
        void s;
      }
    };
  });

  /* This derivation owns the caliper: a term cancelling in the algebra is the
     middle spring never changing length, and a term doubling is that spring
     stretched twice as far as either mass moves. */
  A.viz('cpl-mode-physics', function (root) {
    var panes = V.split(root, 2, [1, 0.4]);
    var bn = benchOf(panes[0], { h: 150, box: 23, scale: 40,
      label: 'The middle spring: slack in one mode, worked double in the other.' });
    var cu = V.curves(panes[1], {
      label: 'How much stiffness mass 1 feels.', w: 320, h: 82,
      x0: 0.4, x1: 1.6, ranges: [[0, 2.4]], xLabel: ''
    });
    var states = [
      { mode: 1, mid: 1, cal: 1, stiff: k, one: 0, label: 'together: same distance along' },
      { mode: 1, mid: 0.15, cal: 1, stiff: k, one: 0, label: 'so it never stretches' },
      { mode: 1, mid: 0, cal: 0, stiff: k, one: 1, label: 'which is §2.1 again' },
      { mode: 2, mid: 1, cal: 1, stiff: k, one: 0, label: 'opposed: twice the stretch' },
      { mode: 2, mid: 1, cal: 1, stiff: k + 2 * kap, one: 0, label: 'k + 2κ' },
      { mode: 2, mid: 1, cal: 1, stiff: k + 2 * kap, one: 0, label: 'the same two frequencies' }
    ];
    return {
      animates: true,
      update: function (kk, f, t) {
        var s = V.at(states, kk, f);
        var idx = M.clamp(f > 0.5 ? kk + 1 : kk, 0, 5);
        var mode = states[idx].mode;
        var w = mode === 2 ? W2 : W1;
        var c = Math.cos(w * t * 1.4) * 0.8;
        var sgn = mode === 2 ? -1 : 1;
        bn.set({
          x: s.one > 0.5 ? [c, 0] : [c, sgn * c],
          slack: mode === 1 ? [1] : [],
          calipers: [{ key: 'mid', from: 0, to: 1, tone: 'prob', op: s.cal }],
          arrows: [{ key: 'k', on: 0, dx: kap * (sgn - 1) * c * 2.2, tone: 'prob',
                     above: true, op: s.mid }],
          notes: [
            { key: 'c', i: 0.5, py: bn.calY - 6,
              text: mode === 1 ? 'never changes' : 'twice as much', tone: 'prob', op: s.cal },
            { key: 'l', cap: true, text: s.label, tone: 'ghost' }
          ]
        });
        cu.set({
          bars: [{ key: 'st', x: 1, y: s.stiff, w: 0.42, tone: 'wave', op: 0.55 }],
          notes: [{ key: 'v', x: 1, y: s.stiff, dy: -8,
                    text: s.stiff > k * 1.2 ? 'k + 2κ' : 'k', tone: 'wave' }]
        });
      }
    };
  });

  /* -------------------------------------------------------- any motion ----- */

  A.viz('cpl-four-constants', function (root) {
    var panes = V.split(root, 2, [0.55, 1]);
    var bn = benchOf(panes[0], { h: 90, box: 18, scale: 28,
      label: 'A general start, resolved into how much of each mode it holds.' });
    var cu = V.curves(panes[1], {
      label: 'The two mode amplitudes, and the two starting positions they make.',
      w: 320, h: 138, x0: 0.4, x1: 2.6, ranges: [[-1.05, 1.05]], xLabel: ''
    });
    var X1 = 0.85, X2 = 0.15;
    var C1 = (X1 + X2) / 2, C3 = (X1 - X2) / 2;
    var states = [
      { modes: 0.2, sum: 1, split: 0, label: 'each mode with its own amplitude' },
      { modes: 1, sum: 1, split: 0, label: 'freeze at t = 0' },
      { modes: 1, sum: 1, split: 1, label: 'half the sum, half the difference' },
      { modes: 1, sum: 1, split: 1, label: 'and the same for the velocities' }
    ];
    return {
      animates: true,
      update: function (kk, f, t) {
        var s = V.at(states, kk, f);
        var frozen = M.clamp(f > 0.5 ? kk + 1 : kk, 0, 3) >= 1;
        var c = frozen ? 1 : Math.cos(t * 0.7);
        bn.set({
          x: [(C1 + C3) * c, (C1 - C3) * c],
          points: [{ key: 'mid', i: 0.5, x: C1 * c, tone: 'prob', op: s.split }],
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
        cu.set({
          bars: [
            { key: 'x1', x: 0.75, y: (C1 + C3) * c, w: 0.32, tone: 'wave', op: 0.5 },
            { key: 'x2', x: 1.2, y: (C1 - C3) * c, w: 0.32, tone: 'wave', op: 0.5 },
            { key: 'c1', x: 1.95, y: C1 * s.modes, w: 0.32, tone: 'prob', op: 0.55 * s.split + 0.1 },
            { key: 'c3', x: 2.4, y: C3 * s.modes, w: 0.32, tone: 'quantum', op: 0.55 * s.split + 0.1 }
          ],
          notes: [
            { key: 'a', x: 0.75, y: 0, dy: 14, text: 'x₁', tone: 'wave' },
            { key: 'b', x: 1.2, y: 0, dy: 14, text: 'x₂', tone: 'wave' },
            { key: 'c', x: 1.95, y: 0, dy: 14, text: 'C₁', tone: 'prob', op: s.split },
            { key: 'd', x: 2.4, y: 0, dy: 14, text: 'C₃', tone: 'quantum', op: s.split }
          ]
        });
      }
    };
  });

  A.viz('cpl-beats', function (root) {
    var panes = V.split(root, 2, [0.42, 1]);
    var bn = benchOf(panes[0], { h: 76, box: 17, scale: 26,
      label: 'One mass started alone; watch the other pick the motion up.' });
    var cu = V.curves(panes[1], {
      label: 'Each mass in turn, inside an envelope that hands the swing across.',
      rows: 2, w: 320, h: 150, x0: 0, x1: 34,
      ranges: [[-1.15, 1.15], [-1.15, 1.15]], xLabel: 't'
    });
    /* The two modes at their real frequencies: the beat is what their sum
       does, not something added on top. */
    function x1(u) { return 0.5 * (Math.cos(W1 * u) + Math.cos(W2 * u)); }
    function x2(u) { return 0.5 * (Math.cos(W1 * u) - Math.cos(W2 * u)); }
    var X1 = V.samp(x1, 0, 34), X2 = V.samp(x2, 0, 34);
    var M1 = V.samp(function (u) { return Math.cos((W2 - W1) / 2 * u); }, 0, 34);
    var M2 = V.samp(function (u) { return Math.sin((W2 - W1) / 2 * u); }, 0, 34);
    var C1 = V.samp(function (u) { return 0.5 * Math.cos(W1 * u); }, 0, 34);
    var C2 = V.samp(function (u) { return 0.5 * Math.cos(W2 * u); }, 0, 34);
    var FLAT = V.samp(function () { return 0; }, 0, 34);
    function st(compOp, envOp, secondOp, label) {
      return {
        curves: [
          { key: 'c1', pts: C1, tone: 'ghost', width: 1.4, op: compOp },
          { key: 'c2', pts: C2, tone: 'ghost', width: 1.4, op: compOp },
          { key: 'x1', pts: X1, tone: 'wave', width: 2 },
          { key: 'e1', pts: M1, tone: 'prob', width: 1.4, dash: true, op: envOp },
          { key: 'e1b', pts: M1.map(function (y) { return -y; }), tone: 'prob', width: 1.4,
            dash: true, op: envOp },
          { key: 'x2', pts: secondOp ? X2 : FLAT, row: 1, tone: 'quantum', width: 2, op: secondOp },
          { key: 'e2', pts: M2, row: 1, tone: 'prob', width: 1.4, dash: true, op: secondOp * envOp },
          { key: 'e2b', pts: M2.map(function (y) { return -y; }), row: 1, tone: 'prob',
            width: 1.4, dash: true, op: secondOp * envOp }
        ],
        marks: [{ key: 'beat', kind: 'caliper', row: 1, x0: 0, x1: TAU / (W2 - W1),
                  y: -0.95, tone: 'ghost', op: envOp }],
        notes: [
          { key: 'b', row: 1, x: TAU / (W2 - W1) / 2, y: -0.95, dy: -6,
            text: envOp ? 'beat period' : '', tone: 'ghost', op: envOp },
          { key: 'l', cap: true, text: label, tone: 'ghost' }
        ]
      };
    }
    var states = [
      st(1, 0, 0, 'released from rest'),
      st(1, 0, 0, 'two cosines, nearly in step'),
      st(0.3, 1, 0, 'a slow envelope on a fast wave'),
      st(0.15, 1, 1, 'when one is still the other swings')
    ];
    return {
      animates: true,
      update: function (kk, f, t) {
        cu.set(V.at(states, kk, f));
        var u = t * 1.6;
        bn.set({ x: [x1(u) * 1.35, x2(u) * 1.35] });
      }
    };
  });

  A.viz('cpl-normal-coords', function (root) {
    var panes = V.split(root, 2, [1, 0.55]);
    var bn = benchOf(panes[0], { h: 130, box: 21, scale: 34,
      label: 'The centre of the pair, and half their separation.' });
    var cu = V.curves(panes[1], {
      label: 'Each of those, on its own, is a plain oscillator.',
      w: 320, h: 92, x0: 0, x1: 26, ranges: [[-1.1, 1.1]], xLabel: 't'
    });
    var states = [
      { mid: 1, sep: 0, pair: 0, q1: 0, q2: 0, label: 'add the two equations' },
      { mid: 1, sep: 0, pair: 1, q1: 0, q2: 0, label: 'the middle spring cancels itself' },
      { mid: 1, sep: 0, pair: 0.3, q1: 1, q2: 0, label: 'q₁ alone, stiffness k' },
      { mid: 0.3, sep: 1, pair: 1, q1: 1, q2: 0, label: 'subtract instead: they reinforce' },
      { mid: 0.3, sep: 1, pair: 0.3, q1: 1, q2: 1, label: 'q₂ alone, stiffness k + 2κ' }
    ];
    function q1(u) { return 0.62 * Math.cos(W1 * u); }
    function q2(u) { return 0.45 * Math.cos(W2 * u + 0.8); }
    var Q1 = V.samp(q1, 0, 26), Q2 = V.samp(q2, 0, 26);
    var FLAT = V.samp(function () { return 0; }, 0, 26);
    return {
      animates: true,
      update: function (kk, f, t) {
        var s = V.at(states, kk, f);
        var u = t * 1.3, a = q1(u), b = q2(u);
        bn.set({
          x: [a + b, a - b],
          calipers: [{ key: 'sep', from: 0, to: 1, tone: 'quantum', op: s.sep }],
          points: [{ key: 'mid', i: 0.5, x: a, tone: 'prob', op: s.mid, r: 4.2 }],
          arrows: [
            { key: 'p1', on: 0, dx: -kap * (2 * b) * 2.4, tone: 'prob', above: true, op: s.pair },
            { key: 'p2', on: 1, dx: kap * (2 * b) * 2.4, tone: 'prob', above: true, op: s.pair }
          ],
          notes: [
            { key: 'm', i: 0.5, x: a, py: bn.calY - 6, text: s.mid > 0.6 ? 'q₁' : '', tone: 'prob', op: s.mid },
            { key: 'l', cap: true, text: s.label, tone: 'ghost' }
          ]
        });
        cu.set({
          curves: [
            { key: 'q1', pts: s.q1 ? Q1 : FLAT, tone: 'prob', width: 2.2, op: s.q1 },
            { key: 'q2', pts: s.q2 ? Q2 : FLAT, tone: 'quantum', width: 2.2, op: s.q2 }
          ],
          notes: [
            { key: 'a', x: 23, y: 0.8, text: s.q1 ? 'q₁' : '', tone: 'prob', op: s.q1 },
            { key: 'b', x: 23, y: -0.7, text: s.q2 ? 'q₂' : '', tone: 'quantum', op: s.q2 }
          ]
        });
      }
    };
  });

  A.viz('cpl-diagonalize', function (root) {
    var panes = V.split(root, 2, [1, 0.5]);
    var pl = V.plane(panes[0], {
      label: 'The state on the mass axes and on the mode axes, which are the same point twice.',
      w: 320, h: 146, unit: 34, cx: 160, cy: 73
    });
    var bn = benchOf(panes[1], { h: 74, box: 16, scale: 24, label: 'The motion itself.' });
    var Pm = [1, 1, 1, -1];
    var Km = [(k + kap), -kap, -kap, (k + kap)];
    var Dm = [k, 0, 0, k + 2 * kap];
    function st(map, ghost, ghostOp, axesOp, projOp, label, q) {
      return {
        pl: {
          grid: true, map: map, ghost: ghost, ghostOp: ghostOp,
          rays: axesOp ? [
            { key: 'm1', x: 1, y: 1, tone: 'prob', op: axesOp * 0.55 },
            { key: 'm2', x: 1, y: -1, tone: 'quantum', op: axesOp * 0.55 }
          ] : [],
          arrows: [
            { key: 'p1', ox: 0, oy: 0, x: 1, y: 1, tone: 'prob', width: 2.4, op: axesOp },
            { key: 'p2', ox: 0, oy: 0, x: 1, y: -1, tone: 'quantum', width: 2.4, op: axesOp }
          ],
          legs: projOp ? [
            { key: 'j1', x0: 0, y0: 0, x1: q[0], y1: q[0], tone: 'prob', op: projOp },
            { key: 'j2', x0: q[0], y0: q[0], x1: q[0] + q[1], y1: q[0] - q[1], tone: 'quantum', op: projOp }
          ] : [],
          notes: [{ key: 'l', cap: true, text: label, tone: 'ghost' }]
        },
        x: [q[0] + q[1], q[0] - q[1]]
      };
    }
    var EYE = [1, 0, 0, 1];
    var states = [
      st(EYE, EYE, 0, 1, 0, 'the columns of P are the modes', [0.5, 0.3]),
      st(EYE, EYE, 0, 1, 1, 'x = P q', [0.5, 0.3]),
      st(EYE, EYE, 0, 1, 1, 'and the inverse reads q off x', [0.5, 0.3]),
      st(EYE, EYE, 0, 1, 1, 'half the sum, half the difference', [0.5, 0.3]),
      /* On the mode axes the stiffness matrix is two stretches and no shear. */
      st(Km, EYE, 0.35, 1, 0, 'P⁻¹KP is diagonal', [0.5, 0.3])
    ];
    void Dm;
    return {
      animates: true,
      update: function (kk, f, t) {
        var s = V.at(states, kk, f);
        pl.set(s.pl);
        var a = 0.55 * Math.cos(W1 * t * 1.3), b = 0.4 * Math.cos(W2 * t * 1.3 + 0.8);
        bn.set({ x: [a + b, a - b] });
        void Pm;
      }
    };
  });

  A.viz('cpl-general-char', function (root) {
    var panes = V.split(root, 2, [1, 0.5]);
    var bn = V.bench(panes[0], {
      label: 'The same apparatus with unequal masses and unequal wall springs.',
      w: 320, h: 128, n: 2, box: 22, scale: 34
    });
    var fr = freqStrip(panes[1], 82);
    /* Real eigenvalues of K − ω²M for the unequal case, so the two marks move
       to where they actually belong. */
    function freqs(m1, m2, k1, k2) {
      var a = (k1 + kap) / m1, b = -kap / m1, c = -kap / m2, d = (k2 + kap) / m2;
      var e = P.eig2(a, b, c, d);
      return [Math.sqrt(Math.max(0.01, e.lambda[1])), Math.sqrt(Math.max(0.01, e.lambda[0]))];
    }
    var states = [
      { m1: 1, m2: 1, k1: k, k2: k, shape: 1, label: 'the determinant again' },
      { m1: 1, m2: 1, k1: k, k2: k, shape: 1, label: 'no longer a square' },
      { m1: 1.9, m2: 0.8, k1: k * 1.3, k2: k * 0.8, shape: 0.55,
        label: 'still two real roots; the shapes tilt' }
    ];
    return {
      animates: true,
      update: function (kk, f, t) {
        var s = V.at(states, kk, f);
        var w = freqs(s.m1, s.m2, s.k1, s.k2);
        var c = Math.cos(w[0] * t * 1.4) * 0.7;
        bn.set({
          x: [c, c * s.shape],
          size: [Math.sqrt(s.m1), Math.sqrt(s.m2)],
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
        fr.set({
          marks: [
            { key: 'w1', kind: 'dot', x: w[0], y: 0.28, tone: 'wave', r: 3.6 },
            { key: 'w2', kind: 'dot', x: w[1], y: 0.28, tone: 'wave', r: 3.6 }
          ],
          notes: [
            { key: 'a', x: w[0], y: 0.28, dy: -9, text: 'ω₁', tone: 'wave' },
            { key: 'b', x: w[1], y: 0.28, dy: -9, text: 'ω₂', tone: 'wave' }
          ]
        });
      }
    };
  });
})(window.A = window.A || {});
