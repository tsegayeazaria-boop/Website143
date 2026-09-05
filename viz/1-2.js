/* ============================================================================
   viz/1-2.js — the pictures beside §1.2's derivations.

   Second-order equations, so almost everything here is a curve against time,
   with a residual strip underneath that says whether the equation is actually
   satisfied. The strip is the honest part: superposition works when it stays
   flat on zero and fails when it does not, and the reader watches which.
   ========================================================================= */
(function (A) {
  'use strict';
  var V = A.viz, M = A.math;
  var TAU = Math.PI * 2;
  var T1 = 3 * TAU;

  function samp(fn) { return V.samp(fn, 0, T1); }

  /* -------------------------------------------------- linear means adding -- */
  /* One picture, one flag: the same two curves added, with a residual strip
     that stays on zero for the linear equation and lifts off it for the
     non-linear one. */
  function superposeViz(root, square, bench) {
    var panes = bench ? V.split(root, 2, [0.42, 1]) : [null, root];
    var bn = bench ? V.bench(panes[0], {
      label: 'The mass these two solutions describe, at the summed position.',
      w: 320, h: 78, box: 17
    }) : null;
    var c = V.curves(bench ? panes[1] : root, {
      label: square ? 'Two solutions added, and the residual that refuses to vanish.'
                    : 'Two solutions added, and a residual that stays on zero.',
      rows: 2, x0: 0, x1: T1, w: 320, h: bench ? 152 : 240,
      ranges: [[-2.1, 2.1], [-1.15, 1.15]], xLabel: 't'
    });
    var w = 1;
    function x1(t) { return 0.9 * Math.cos(w * t); }
    function x2(t) { return 0.7 * Math.sin(w * t + 0.6); }
    var X1 = samp(x1), X2 = samp(x2), SUM = samp(function (t) { return x1(t) + x2(t); });
    var ZERO = samp(function () { return 0; });
    /* For ẍ + x² the leftover is the cross term, and nothing makes it vanish. */
    var CROSS = samp(function (t) { return 2 * x1(t) * x2(t) * 0.55; });
    return { c: c, bn: bn, x1: x1, x2: x2, X1: X1, X2: X2, SUM: SUM, ZERO: ZERO, CROSS: CROSS };
  }

  A.viz('ode-superpose', function (root) {
    var q = superposeViz(root, false, true);
    function st(sumOp, splitOp, label) {
      return {
        curves: [
          { key: 'a', pts: q.X1, tone: 'wave', width: 1.8, dash: true },
          { key: 'b', pts: q.X2, tone: 'quantum', width: 1.8, dash: true },
          { key: 's', pts: q.SUM, tone: 'ink', width: 2.6, op: sumOp },
          { key: 'r', pts: q.ZERO, row: 1, tone: 'prob', width: 2.4 },
          { key: 'r1', pts: q.ZERO, row: 1, tone: 'wave', width: 1.6, dash: true, op: splitOp },
          { key: 'r2', pts: q.ZERO, row: 1, tone: 'quantum', width: 1.6, dash: true, op: splitOp }
        ],
        notes: [
          { key: 'l', cap: true, text: label, tone: 'ghost' },
          { key: 'z', row: 1, x: T1 * 0.5, y: 0.82, text: 'residual ẍ + ω²x', tone: 'ghost' }
        ]
      };
    }
    var states = [st(0.35, 0, ''), st(1, 0, ''), st(1, 1, 'one residual each'),
                  st(1, 1, 'both flat: the sum solves it')];
    return {
      animates: true,
      update: function (k, f, t) {
        q.c.set(V.at(states, k, f));
        /* The bench shows the sum: the same mass, doing both motions at once. */
        var u = t * 0.9, dt = 0.02;
        /* The arrow is the velocity, not the displacement: the mass's own
           position already says where it is. */
        var here = q.x1(u) + q.x2(u), next = q.x1(u + dt) + q.x2(u + dt);
        q.bn.set({
          x: [here * 0.85],
          arrows: [{ key: 'v', on: 0, dx: (next - here) / dt * 0.32, tone: 'prob', above: true, op: 0.85 }],
          notes: [{ key: 'l', cap: true, text: 'x₁ + x₂', tone: 'ghost' }]
        });
      }
    };
  });

  A.viz('ode-nonlinear-fails', function (root) {
    var q = superposeViz(root, true);
    function st(sumOp, bandOp, crossOp, label) {
      /* The residual is built up out of the three pieces the square produces;
         the two that belong to one solution each cancel, and the cross term
         does not. */
      return {
        curves: [
          { key: 'a', pts: q.X1, tone: 'wave', width: 1.8, dash: true },
          { key: 'b', pts: q.X2, tone: 'quantum', width: 1.8, dash: true },
          { key: 's', pts: q.SUM, tone: 'ink', width: 2.6, op: sumOp },
          { key: 'r', pts: q.CROSS.map(function (y) { return y * crossOp; }),
            row: 1, tone: 'fail', width: 2.4 },
          { key: 'b1', pts: q.ZERO, row: 1, tone: 'wave', width: 1.6, dash: true, op: bandOp },
          { key: 'b2', pts: q.ZERO, row: 1, tone: 'quantum', width: 1.6, dash: true, op: bandOp }
        ],
        fills: [{ key: 'x', row: 1, pts: q.CROSS.map(function (y) { return y * crossOp; }),
                  split: true, tone: 'fail', negTone: 'fail', op: 0.28 * crossOp }],
        notes: [
          { key: 'l', cap: true, text: label, tone: 'ghost' },
          { key: 'z', row: 1, x: T1 * 0.5, y: 0.92, text: 'residual ẍ + x²', tone: 'ghost' }
        ]
      };
    }
    var states = [st(0.35, 0, 0, ''), st(1, 0, 0.5, ''), st(1, 1, 1, 'three pieces'),
                  st(1, 0.35, 1, 'two of them cancel'), st(1, 0, 1, 'the cross term is left')];
    return { update: function (k, f) { q.c.set(V.at(states, k, f)); } };
  });

  /* ---------------------------------------- two integrations, two constants -- */
  A.viz('ode-order-constants', function (root) {
    var panes = V.split(root, 2, [0.36, 1]);
    var bn = V.bench(panes[0], {
      label: 'A mass with no force on it: it keeps whatever velocity it was given.',
      w: 320, h: 66, box: 16, walls: false, springs: false, scale: 44
    });
    var c = V.curves(panes[1], {
      label: 'A family of straight world-lines, narrowed by one constant and then the other.',
      w: 320, h: 162, x0: 0, x1: 1, ranges: [[-1.25, 1.25]], xLabel: 't'
    });
    var N = 7;
    function fan(slopeSpread, offSpread, pickOp) {
      var out = [];
      for (var i = 0; i < N; i++) {
        var u = (i / (N - 1)) * 2 - 1;
        var sl = 0.75 + u * slopeSpread, off = u * offSpread;
        out.push({ key: 'f' + i, tone: 'ghost', width: 1.4,
                   op: 0.5 * (1 - pickOp * 0.75),
                   pts: V.samp(function (t) { return off + sl * (t - 0.5); }, 0, 1) });
      }
      out.push({ key: 'pick', tone: 'wave', width: 2.6, op: pickOp,
                 pts: V.samp(function (t) { return 0.28 + 0.75 * (t - 0.5); }, 0, 1) });
      return out;
    }
    function st(slopeSpread, offSpread, pickOp, label) {
      return {
        curves: fan(slopeSpread, offSpread, pickOp),
        marks: [
          { key: 'v', kind: 'vline', x: 0.5, tone: 'ghost', op: pickOp },
          { key: 'd', kind: 'dot', x: 0.5, y: 0.28, tone: 'wave', op: pickOp }
        ],
        notes: [
          { key: 'l', cap: true, text: label, tone: 'ghost' },
          { key: 'x0', x: 0.44, y: 0.28, text: pickOp ? 'x(0)' : '', tone: 'wave',
            op: pickOp, anchor: 'end' },
          { key: 'v0', x: 0.86, y: 0.62, text: pickOp ? 'slope ẋ(0)' : '', tone: 'wave', op: pickOp }
        ]
      };
    }
    var states = [
      st(0, 0, 0, 'ẍ = 0'),
      st(0, 0.75, 0, 'one constant: the intercept'),
      st(0.8, 0.75, 0, 'and the slope'),
      st(0.8, 0.75, 1, 'two numbers pick one line')
    ];
    return {
      animates: true,
      update: function (k, f, t) {
        c.set(V.at(states, k, f));
        var u = (t * 0.35) % 2 - 1;
        bn.set({
          x: [u * 1.5], rest: false,
          arrows: [{ key: 'v', on: 0, dx: 0.9, tone: 'prob', above: true }],
          notes: [{ key: 'l', cap: true, text: 'constant velocity', tone: 'ghost' }]
        });
      }
    };
  });

  /* ------------------------------------------------ the characteristic root -- */
  /* Where the roots sit in the r-plane and what the motion does are the same
     fact twice, so they are drawn side by side and move together. */
  function rootViz(root, label) {
    var panes = V.split(root, 3, [1, 0.42, 0.95]);
    var pl = V.plane(panes[0], {
      label: 'The roots of the characteristic equation, in the plane of r.',
      w: 320, h: 104, unit: 30, cx: 160, cy: 52, xLabel: 're r', yLabel: ''
    });
    /* The object those roots are about. A root on the imaginary axis is a mass
       that keeps swinging; one with a negative real part is a mass dying away. */
    var bn = V.bench(panes[1], {
      label: 'The mass those roots describe.', w: 320, h: 46, box: 13
    });
    var cu = V.curves(panes[2], {
      label: label, w: 320, h: 100, x0: 0, x1: T1, ranges: [[-1.25, 1.25]], xLabel: 't'
    });
    return { pl: pl, bn: bn, cu: cu };
  }

  A.viz('ode-ansatz', function (root) {
    var q = rootViz(root, 'The motion those roots describe.');
    var w = 1;
    function st(rootOp, motionOp, label) {
      return {
        motion: motionOp,
        pl: {
          grid: false,
          dots: [
            { key: 'p', x: 0, y: w, tone: 'quantum', r: 4, op: rootOp },
            { key: 'm', x: 0, y: -w, tone: 'quantum', r: 4, op: rootOp }
          ],
          notes: [
            { key: 'p', x: 0.3, y: w, text: rootOp ? '+iω' : '', tone: 'quantum', op: rootOp, anchor: 'start' },
            { key: 'm', x: 0.3, y: -w, text: rootOp ? '−iω' : '', tone: 'quantum', op: rootOp, anchor: 'start' },
            { key: 'l', cap: true, text: label, tone: 'ghost' }
          ]
        },
        cu: {
          curves: [{ key: 'x', tone: 'wave', width: 2.2,
                     pts: samp(function (t) { return motionOp * Math.cos(w * t); }) }]
        }
      };
    }
    var states = [st(0, 0, ''), st(0, 0, ''), st(0, 0, 'the exponential divides out'),
                  st(1, 1, 'imaginary roots: oscillation')];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        q.pl.set(s.pl); q.cu.set(s.cu);
        /* Nothing to draw until the roots are found; then the mass swings. */
        q.bn.set({ x: [1.5 * s.motion * Math.cos(w * t)] });
      }
    };
  });

  A.viz('ode-char-general', function (root) {
    var q = rootViz(root, 'The motion, with the envelope the real part sets.');
    var w = 1;
    function st(b, envOp, label) {
      var g = b / 2, wd = Math.sqrt(Math.max(0.04, w * w - g * g));
      return {
        pl: {
          grid: false,
          rays: [],
          dots: [
            { key: 'p', x: -g, y: wd, tone: 'quantum', r: 4 },
            { key: 'm', x: -g, y: -wd, tone: 'quantum', r: 4 }
          ],
          legs: [{ key: 'v', x0: -g, y0: -2, x1: -g, y1: 2, tone: 'prob', op: envOp }],
          notes: [
            { key: 'v', x: -g - 0.2, y: 1.5, text: envOp ? '−b/2' : '', tone: 'prob',
              op: envOp, anchor: 'end' },
            { key: 'l', cap: true, text: label, tone: 'ghost' }
          ]
        },
        cu: {
          curves: [
            { key: 'x', tone: 'wave', width: 2.2,
              pts: samp(function (t) { return Math.exp(-g * t) * Math.cos(wd * t); }) },
            { key: 'e1', tone: 'prob', width: 1.4, dash: true, op: envOp,
              pts: samp(function (t) { return Math.exp(-g * t); }) },
            { key: 'e2', tone: 'prob', width: 1.4, dash: true, op: envOp,
              pts: samp(function (t) { return -Math.exp(-g * t); }) }
          ]
        }
      };
    }
    var states = [st(0, 0, 'b = 0'), st(0, 0, ''), st(0.35, 0, 'b turned up'),
                  st(0.35, 1, 'a decaying oscillation')];
    var damp = [0, 0, 0.35, 0.35];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        q.pl.set(s.pl); q.cu.set(s.cu);
        /* The bench dies away exactly as fast as the envelope in the trace,
           because both use the same b. */
        var g = damp[M.clamp(f > 0.5 ? k + 1 : k, 0, 3)] / 2;
        var u = t % 9;
        q.bn.set({ x: [1.5 * Math.exp(-g * u) * Math.cos(Math.sqrt(Math.max(0.04, 1 - g * g)) * u)] });
      }
    };
  });

  A.viz('ode-real-solutions', function (root) {
    var panes = V.split(root, 3, [1, 0.9, 0.42]);
    var pl = V.plane(panes[0], {
      label: 'Two counter-rotating arrows whose sum stays on the real axis.',
      w: 320, h: 104, unit: 34, cx: 160, cy: 52, xLabel: 're', yLabel: ''
    });
    var cu = V.curves(panes[1], {
      label: 'The two real functions they build.',
      w: 320, h: 96, x0: 0, x1: T1, ranges: [[-1.25, 1.25]], xLabel: 't'
    });
    var bn = V.bench(panes[2], {
      label: 'The mass either of them describes.', w: 320, h: 46, box: 13
    });
    var states = [
      { sum: 0, dif: 0, cos: 0, sin: 0, label: '' },
      { sum: 1, dif: 0, cos: 1, sin: 0, label: 'sum: real' },
      { sum: 1, dif: 1, cos: 1, sin: 1, label: 'difference: imaginary' }
    ];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        var ph = t * 0.75, c = Math.cos(ph), sn = Math.sin(ph);
        pl.set({
          grid: false, circle: 1, circleOp: 0.5,
          arrows: [
            { key: 'p', ox: 0, oy: 0, x: c, y: sn, tone: 'wave', width: 2.4 },
            { key: 'm', ox: 0, oy: 0, x: c, y: -sn, tone: 'quantum', width: 2.4 },
            { key: 's', ox: 0, oy: 0, x: 2 * c, y: 0, tone: 'prob', width: 2.8, op: s.sum },
            { key: 'd', ox: 0, oy: 0, x: 0, y: 2 * sn, tone: 'ink', width: 2.2, op: s.dif }
          ],
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
        cu.set({
          curves: [
            { key: 'c', tone: 'prob', width: 2.2, op: s.cos,
              pts: samp(function (x) { return Math.cos(x + ph); }) },
            { key: 's', tone: 'ink', width: 2, op: s.sin,
              pts: samp(function (x) { return Math.sin(x + ph); }) }
          ]
        });
        bn.set({ x: [1.5 * c] });
      }
    };
  });

  /* ------------------------------------------- the same solution, three ways -- */

  var AMP = 1.0, PHI = 0.7, W = 1;
  var C1 = AMP * Math.cos(PHI), C2 = -AMP * Math.sin(PHI);

  A.viz('ode-A-to-C', function (root) {
    var panes = V.split(root, 2, [0.36, 1]);
    var bn = V.bench(panes[0], {
      label: 'The mass whose single motion is being written two ways.',
      w: 320, h: 66, box: 16
    });
    var c = V.curves(panes[1], {
      label: 'One shifted cosine, split into an unshifted cosine and a sine.',
      rows: 2, w: 320, h: 162, x0: 0, x1: T1,
      ranges: [[-1.25, 1.25], [-1.25, 1.25]], xLabel: 't'
    });
    var FULL = samp(function (t) { return AMP * Math.cos(W * t + PHI); });
    var COS = samp(function (t) { return C1 * Math.cos(W * t); });
    var SIN = samp(function (t) { return -C2 * Math.sin(W * t); });
    function st(splitOp, barOp, label) {
      return {
        curves: [
          { key: 'f', pts: FULL, tone: 'ink', width: 2.6 },
          { key: 'c', pts: COS, row: 1, tone: 'wave', width: 2, op: splitOp },
          { key: 's', pts: SIN, row: 1, tone: 'quantum', width: 2, op: splitOp }
        ],
        marks: [
          /* The shift, measured where it can be seen: peak to peak. */
          { key: 'sh', kind: 'caliper', x0: 0, x1: PHI / W, y: 0.55, tone: 'prob' },
          { key: 'c1', kind: 'vcaliper', row: 1, x: 0.16, y0: 0, y1: C1, tone: 'wave', op: barOp },
          { key: 'c2', kind: 'vcaliper', row: 1, x: TAU / 4 + 0.16, y0: 0, y1: -C2, tone: 'quantum', op: barOp }
        ],
        notes: [
          { key: 'sh', x: PHI / W / 2, y: 0.55, dy: -7, text: 'φ/ω', tone: 'prob' },
          { key: 'c1', row: 1, x: 0.55, y: C1 * 0.5, text: barOp ? 'A cos φ' : '', tone: 'wave', op: barOp, anchor: 'start' },
          { key: 'c2', row: 1, x: TAU / 4 + 0.55, y: -C2 * 0.5 - 0.42, text: barOp ? '−A sin φ' : '', tone: 'quantum', op: barOp, anchor: 'start' },
          { key: 'l', cap: true, text: label, tone: 'ghost' }
        ]
      };
    }
    var states = [st(0, 0, 'one shifted cosine'), st(1, 0, 'two pieces'),
                  st(1, 0, ''), st(1, 1, 'their heights are the constants')];
    return {
      animates: true,
      update: function (k, f, t) {
        c.set(V.at(states, k, f));
        var u = t * 0.9;
        bn.set({ x: [AMP * Math.cos(W * u + PHI) * 1.5],
                 notes: [{ key: 'l', cap: true, text: 'one motion', tone: 'ghost' }] });
      }
    };
  });

  A.viz('ode-C-to-A', function (root) {
    var panes = V.split(root, 2, [1, 0.34]);
    var p = V.plane(panes[0], {
      label: 'The two constants as the legs of a right triangle whose hypotenuse is the amplitude.',
      w: 320, h: 172, unit: 50, cx: 40, cy: 140, xLabel: 'C₁', yLabel: '−C₂'
    });
    var bn = V.bench(panes[1], {
      label: 'The oscillator whose amplitude that hypotenuse is.', w: 320, h: 58, box: 15
    });
    var a = C1, b = -C2, hyp = M.hypot(a, b);
    var K = 0.78;
    function sq(key, x, y, side, tone, op) {
      return { key: key, tone: tone, op: op,
               pts: [[x, y], [x + side, y], [x + side, y + side], [x, y + side]] };
    }
    function st(sqOp, merged, arcOp, label) {
      var s1 = (merged ? hyp : a) * K, s2 = (merged ? 0 : b) * K;
      var x1 = 1.85, x2 = merged ? 1.85 : 1.85 + a * K + 0.14;
      return {
        grid: true,
        arrows: [{ key: 'A', ox: 0, oy: 0, x: a, y: b, tone: 'ink', width: 2.8 }],
        legs: [
          { key: 'c1', x0: 0, y0: 0, x1: a, y1: 0, tone: 'wave' },
          { key: 'c2', x0: a, y0: 0, x1: a, y1: b, tone: 'quantum' }
        ],
        arcs: [{ key: 'ph', r: 0.42, a0: 0, a1: Math.atan2(b, a), tone: 'prob', op: arcOp }],
        shade: [sq('s1', x1, -0.55, s1, 'wave', sqOp), sq('s2', x2, -0.55, s2, 'quantum', sqOp)],
        notes: [
          { key: 'a', x: a * 0.5, y: 0, dy: 14, text: 'C₁', tone: 'wave' },
          { key: 'b', x: a + 0.1, y: b * 0.5, text: '−C₂', tone: 'quantum', anchor: 'start' },
          { key: 'h', x: a * 0.45 - 0.12, y: b * 0.45 + 0.16, text: 'A', tone: 'ink' },
          { key: 'ph', x: 0.62, y: 0.16, text: arcOp ? 'φ' : '', tone: 'prob', op: arcOp },
          { key: 's', x: x1 + s1 / 2, y: -0.55 + s1 / 2, text: merged ? 'A²' : 'C₁²', tone: 'ink', op: sqOp },
          { key: 's2', x: x2 + s2 / 2, y: -0.55 + s2 / 2, text: merged ? '' : 'C₂²', tone: 'ink', op: sqOp },
          { key: 'l', cap: true, text: label, tone: 'ghost' }
        ]
      };
    }
    var states = [st(1, false, 0, 'square each'), st(1, true, 0, 'and add'),
                  st(0.6, true, 1, 'divide instead'), st(0.6, true, 1, 'length and angle')];
    return {
      animates: true,
      update: function (k, f, t) {
        p.set(V.at(states, k, f));
        bn.set({
          x: [hyp * 1.35 * Math.cos(W * t + PHI)],
          marks: [],
          notes: [{ key: 'a', cap: true, text: 'amplitude A', tone: 'ghost' }]
        });
      }
    };
  });

  A.viz('ode-complex-form', function (root) {
    var panes = V.split(root, 3, [1, 0.9, 0.42]);
    var pl = V.plane(panes[0], {
      label: 'A complex constant, set turning; its shadow on the real axis is the solution.',
      w: 320, h: 104, unit: 38, cx: 118, cy: 52, xLabel: 're', yLabel: ''
    });
    var cu = V.curves(panes[1], {
      label: 'That shadow, against time.',
      w: 320, h: 96, x0: 0, x1: T1, ranges: [[-1.25, 1.25]], xLabel: 't'
    });
    var bn = V.bench(panes[2], {
      label: 'And the mass sitting at it.', w: 320, h: 46, box: 13
    });
    var states = [
      { spin: 0, im: 0, re: 0.3, label: 'c = C₁ − iC₂' },
      { spin: 1, im: 1, re: 1, label: 'set turning' },
      { spin: 1, im: 0.12, re: 1, label: 'keep the real part' }
    ];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        var ph = s.spin * t * 0.75;
        var x = AMP * Math.cos(ph + PHI), y = AMP * Math.sin(ph + PHI);
        pl.set({
          grid: false, circle: AMP, circleOp: 0.45 * s.spin,
          arrows: [{ key: 'c', ox: 0, oy: 0, x: x, y: y, tone: 'ink', width: 2.8 }],
          legs: [
            { key: 'dr', x0: x, y0: y, x1: x, y1: 0, tone: 'wave', op: s.re },
            { key: 'di', x0: x, y0: y, x1: 0, y1: y, tone: 'quantum', op: s.im }
          ],
          dots: [
            { key: 'r', x: x, y: 0, tone: 'wave', r: 3.6, op: s.re },
            { key: 'i', x: 0, y: y, tone: 'quantum', r: 3.6, op: s.im }
          ],
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
        cu.set({
          curves: [
            { key: 're', tone: 'wave', width: 2.4, op: s.re,
              pts: samp(function (u) { return AMP * Math.cos(u + ph + PHI); }) },
            { key: 'im', tone: 'quantum', width: 1.8, op: s.im,
              pts: samp(function (u) { return AMP * Math.sin(u + ph + PHI); }) }
          ]
        });
        bn.set({ x: [x * 1.5] });
      }
    };
  });

  A.viz('ode-ic', function (root) {
    var T2 = 2 * TAU, L0 = -0.9;
    var panes = V.split(root, 2, [0.36, 1]);
    var bn = V.bench(panes[0], {
      label: 'The mass at the moment it is let go: one position and one velocity.',
      w: 320, h: 66, box: 16
    });
    var c = V.curves(panes[1], {
      label: 'The solution pinned at t = 0 by its height and its slope.',
      w: 320, h: 162, x0: L0, x1: T2, ranges: [[-1.35, 1.35]], xLabel: 't'
    });
    function sm(fn) { return V.samp(fn, L0, T2); }
    var X = sm(function (t) { return AMP * Math.cos(W * t + PHI); });
    var COS = sm(function (t) { return C1 * Math.cos(W * t); });
    var SIN = sm(function (t) { return -C2 * Math.sin(W * t); });
    var DX = sm(function (t) { return -AMP * W * Math.sin(W * t + PHI) * 0.6; });
    var x0 = AMP * Math.cos(PHI), v0 = -AMP * W * Math.sin(PHI);

    function st(pieceOp, derOp, pinOp, label) {
      return {
        curves: [
          { key: 'x', pts: X, tone: 'ink', width: 2.6 },
          { key: 'c', pts: COS, tone: 'wave', width: 1.6, dash: true, op: pieceOp },
          { key: 's', pts: SIN, tone: 'quantum', width: 1.6, dash: true, op: pieceOp },
          { key: 'd', pts: DX, tone: 'prob', width: 1.6, dash: true, op: derOp }
        ],
        marks: [
          { key: 'z', kind: 'vline', x: 0, tone: 'ghost' },
          /* The tangent at the start: a short segment, so its slope can be
             compared with the curve rather than swamping it. */
          { key: 't', kind: 'seg', dash: false, x0: -0.9, y0: x0 - v0 * 0.9,
            x1: 1.5, y1: x0 + v0 * 1.5, tone: 'prob', op: pinOp },
          { key: 'h', kind: 'vcaliper', x: -0.42, y0: 0, y1: x0, tone: 'wave', op: pinOp },
          { key: 'p', kind: 'dot', x: 0, y: x0, tone: 'ink', r: 3.6, op: pinOp }
        ],
        notes: [
          { key: 'h', x: -0.52, y: x0 * 0.55, text: pinOp ? 'x(0)' : '', tone: 'wave',
            op: pinOp, anchor: 'end' },
          { key: 'v', x: 1.62, y: x0 + v0 * 1.5, text: pinOp ? 'slope ẋ(0)' : '', tone: 'prob',
            op: pinOp, anchor: 'start' },
          { key: 'l', cap: true, text: label, tone: 'ghost' }
        ]
      };
    }
    var states = [
      st(1, 0, 0, 'two pieces'),
      st(1, 1, 0, 'and its derivative'),
      st(0.3, 0.2, 1, 'at t = 0 only two numbers matter'),
      st(0.55, 0, 1, 'which fixes both constants')
    ];
    /* The bench holds still at t = 0 once the derivation gets there: the point
       of the last two steps is that only that instant matters. */
    var hold = [0, 0, 1, 1];
    return {
      animates: true,
      update: function (k, f, t) {
        c.set(V.at(states, k, f));
        var pin = V.at(hold.map(function (h) { return { h: h }; }), k, f).h;
        var u = t * 0.9 * (1 - pin);
        bn.set({
          x: [AMP * Math.cos(W * u + PHI) * 1.5],
          arrows: [{ key: 'v', on: 0, dx: -AMP * W * Math.sin(W * u + PHI) * 1.2,
                     tone: 'prob', above: true }],
          notes: [
            { key: 'x', on: 0, dy: 26, text: pin > 0.5 ? 'x(0)' : '', tone: 'wave', op: pin },
            { key: 'l', cap: true, text: pin > 0.5 ? 'held at t = 0' : '', tone: 'ghost', op: pin }
          ]
        });
      }
    };
  });
})(window.A = window.A || {});
