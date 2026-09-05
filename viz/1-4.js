/* ============================================================================
   viz/1-4.js — the pictures beside §1.4's derivations.

   Fourier is about areas that cancel, so most of these are the product of two
   curves with its positive and negative parts shaded apart: when they match
   the shading goes all one colour and the total climbs, and when they do not
   it pairs up and dies. Everything numerical comes from A.phys, so the picture
   and the algebra are reading the same numbers.
   ========================================================================= */
(function (A) {
  'use strict';
  var V = A.viz, P = A.phys, M = A.math;
  var TAU = Math.PI * 2;

  function running(pts, span) {
    var out = [], acc = 0, n = pts.length - 1, dx = span / n;
    for (var i = 0; i <= n; i++) { if (i) acc += (pts[i] + pts[i - 1]) / 2 * dx; out.push(acc); }
    return out;
  }

  /* --------------------------------------------- the constant term ------- */
  A.viz('fs-a0', function (root, api) {
    var c = V.curves(root, {
      label: 'One period of a wave: every wiggle cancels, and the average is what is left.',
      rows: 2, x0: 0, x1: TAU, ranges: [[-0.55, 1.85], [-0.85, 1.0]], xLabel: 't'
    });
    var a0 = 0.62;
    function wave(t, harm) {
      var y = a0;
      /* Alternating phases, so the wiggles sit either side of the average
         rather than piling up on one side of it. */
      for (var n = 1; n <= 4; n++) y += harm * (0.42 / n) * Math.cos(n * t + (n % 2 ? 0 : Math.PI / 2));
      return y;
    }
    function st(harm, flatOp, label) {
      var F = V.samp(function (t) { return wave(t, harm); }, 0, TAU);
      var OSC = V.samp(function (t) { return wave(t, harm) - a0; }, 0, TAU);
      return {
        curves: [
          { key: 'f', pts: F, tone: 'ink', width: 2.4 },
          { key: 'm', pts: V.samp(function () { return a0; }, 0, TAU), tone: 'prob',
            width: 1.8, dash: true, op: flatOp }
        ],
        fills: [
          /* The oscillating part alone, so its cancelling can be seen. */
          { key: 'o', row: 1, pts: OSC, split: true, tone: 'wave', negTone: 'fail', op: 0.3 },
          { key: 'a', row: 1, pts: V.samp(function () { return a0; }, 0, TAU),
            tone: 'prob', op: 0.24 * flatOp }
        ],
        notes: [
          { key: 'l', cap: true, text: label, tone: 'ghost' },
          { key: 'm', x: TAU * 0.88, y: a0, dy: -7, text: flatOp ? 'a₀' : '', tone: 'prob', op: flatOp },
          { key: 'o', row: 1, x: TAU * 0.5, y: 0.78, text: 'the wiggles, alone', tone: 'ghost',
            op: 1 - flatOp },
          { key: 'ar', row: 1, x: TAU * 0.5, y: a0 * 0.5, text: flatOp ? 'a₀ T' : '',
            tone: 'ink', op: flatOp }
        ]
      };
    }
    var states = [st(1, 0, 'one period'), st(1, 0, 'each harmonic cancels'),
                  st(0.06, 1, 'the average is all that survives')];
    void api;
    return { update: function (k, f) { c.set(V.at(states, k, f)); } };
  });

  /* ------------------------------------------- one coefficient at a time -- */
  A.viz('fs-an-bn', function (root) {
    var panes = V.split(root, 2, [1.4, 1]);
    var cu = V.curves(panes[0], {
      label: 'The wave times one harmonic: every cross term cancels but one.',
      rows: 2, w: 320, h: 148, x0: 0, x1: TAU,
      ranges: [[-1.35, 1.35], [-0.75, 1.15]], xLabel: 't'
    });
    var sp = V.curves(panes[1], {
      label: 'The coefficient that survives.',
      w: 320, h: 84, x0: 0.4, x1: 5.6, ranges: [[0, 1.05]], xLabel: 'n'
    });
    var AMP = [0.85, 0.5, 0.62, 0.3, 0.42];
    var Mth = 2;                                    /* the harmonic being picked */
    function f(t, only) {
      var y = 0;
      for (var n = 1; n <= 5; n++) y += (only && n !== Mth ? 0 : AMP[n - 1]) * Math.cos(n * t);
      return y;
    }
    function st(only, meanOp, label) {
      var F = V.samp(function (t) { return f(t, only); }, 0, TAU);
      var G = V.samp(function (t) { return Math.cos(Mth * t); }, 0, TAU);
      var PR = V.samp(function (t) { return f(t, only) * Math.cos(Mth * t); }, 0, TAU);
      return {
        cu: {
          curves: [
            { key: 'f', pts: F, tone: 'ink', width: 2.2 },
            { key: 'g', pts: G, tone: 'quantum', width: 1.6, dash: true },
            { key: 'p', pts: PR, row: 1, tone: 'wave', width: 2 },
            { key: 'h', pts: V.samp(function () { return AMP[Mth - 1] / 2; }, 0, TAU),
              row: 1, tone: 'prob', width: 1.6, dash: true, op: meanOp }
          ],
          fills: [{ key: 'p', row: 1, pts: PR, split: true, tone: 'wave', negTone: 'fail', op: 0.3 }],
          notes: [
            { key: 'l', cap: true, text: label, tone: 'ghost' },
            { key: 'h', x: TAU * 0.86, y: AMP[Mth - 1] / 2, row: 1, dy: -7,
              text: meanOp ? 'mean ½aₘ' : '', tone: 'prob', op: meanOp }
          ]
        },
        sp: {
          bars: AMP.map(function (a, i) {
            return { key: 'b' + i, x: i + 1, y: a, w: 0.5,
                     tone: i + 1 === Mth ? 'quantum' : 'wave',
                     op: only && i + 1 !== Mth ? 0.12 : 0.55 };
          }),
          notes: [{ key: 'm', x: Mth + 0.55, y: AMP[Mth - 1] * 0.6, text: only ? 'aₘ' : '',
                    tone: 'quantum', op: only, anchor: 'start' }]
        }
      };
    }
    var states = [st(0, 0, 'f × cos mω₀t'), st(1, 0, 'only n = m survives'),
                  st(1, 1, 'cos² has mean ½'), st(1, 1, 'so aₘ falls out')];
    return { update: function (k, f) { var s = V.at(states, k, f); cu.set(s.cu); sp.set(s.sp); } };
  });

  /* ------------------------------------------------------- even and odd --- */
  A.viz('fs-even-odd', function (root) {
    var c = V.curves(root, {
      label: 'An even function against an odd one: the left half cancels the right.',
      rows: 2, x0: -Math.PI, x1: Math.PI,
      ranges: [[-1.25, 1.25], [-1.05, 1.05]], xLabel: 't'
    });
    function f(t) { return 0.55 + 0.5 * Math.cos(t) + 0.22 * Math.cos(2 * t); }
    var F = V.samp(f, -Math.PI, Math.PI);
    var G = V.samp(function (t) { return Math.sin(t); }, -Math.PI, Math.PI);
    var GM = V.samp(function (t) { return Math.sin(-t); }, -Math.PI, Math.PI);
    var PR = V.samp(function (t) { return f(t) * Math.sin(t); }, -Math.PI, Math.PI);
    function st(mirrorOp, barOp, label) {
      return {
        curves: [
          { key: 'f', pts: F, tone: 'ink', width: 2.4 },
          { key: 'g', pts: G, tone: 'quantum', width: 2 },
          /* The mirror image of the sine, which is the sine upside down. */
          { key: 'gm', pts: GM, tone: 'quantum', width: 1.4, dash: true, op: mirrorOp },
          { key: 'p', pts: PR, row: 1, tone: 'wave', width: 2 }
        ],
        fills: [{ key: 'p', row: 1, pts: PR, split: true, tone: 'wave', negTone: 'fail', op: 0.32 }],
        marks: [
          { key: 'z', kind: 'vline', x: 0, tone: 'ghost' },
          { key: 'lb', kind: 'caliper', row: 1, x0: -Math.PI, x1: 0, y: -0.85, tone: 'fail', op: barOp },
          { key: 'rb', kind: 'caliper', row: 1, x0: 0, x1: Math.PI, y: -0.85, tone: 'wave', op: barOp }
        ],
        notes: [
          { key: 'l', cap: true, text: label, tone: 'ghost' },
          { key: 'lb', row: 1, x: -Math.PI / 2, y: -0.85, dy: -6, text: barOp ? '−I' : '',
            tone: 'fail', op: barOp },
          { key: 'rb', row: 1, x: Math.PI / 2, y: -0.85, dy: -6, text: barOp ? '+I' : '',
            tone: 'wave', op: barOp }
        ]
      };
    }
    var states = [st(0, 0, 'f even, sine odd'), st(1, 0, 'reflect: the sine flips'),
                  st(1, 1, 'equal and opposite: zero')];
    return { update: function (k, f) { c.set(V.at(states, k, f)); } };
  });

  /* ----------------------------------------------- half-wave symmetry ----- */
  A.viz('fs-half-wave', function (root) {
    var panes = V.split(root, 2, [1.35, 1]);
    var cu = V.curves(panes[0], {
      label: 'The second half of the period, slid onto the first and compared with it.',
      w: 320, h: 142, x0: 0, x1: TAU, ranges: [[-1.35, 1.35]], xLabel: 't'
    });
    var sp = V.curves(panes[1], {
      label: 'Even harmonics cancel; odd ones add.',
      w: 320, h: 88, x0: 0.4, x1: 6.6, ranges: [[0, 1.35]], xLabel: 'n'
    });
    function sq(t) { return P.squareWave(t, TAU); }
    var FULL = V.samp(sq, 0, TAU);
    /* The second half brought back by T/2: for a half-wave symmetric shape it
       is the first half upside down. */
    var SHIFT = V.samp(function (t) { return sq(t + Math.PI); }, 0, TAU);
    function st(shiftOp, barsOp, label) {
      return {
        cu: {
          curves: [
            { key: 'f', pts: FULL, tone: 'ink', width: 2.4 },
            { key: 's', pts: SHIFT, tone: 'quantum', width: 2, dash: true, op: shiftOp }
          ],
          marks: [{ key: 'h', kind: 'vline', x: Math.PI, tone: 'ghost' }],
          notes: [
            { key: 'l', cap: true, text: label, tone: 'ghost' },
            { key: 's', x: TAU * 0.28, y: -1.1, text: shiftOp ? 'second half, slid back' : '',
              tone: 'quantum', op: shiftOp }
          ]
        },
        sp: {
          bars: [1, 2, 3, 4, 5, 6].map(function (n) {
            return { key: 'b' + n, x: n, y: Math.abs(P.squareCoeff(n)) * barsOp + 0.001,
                     w: 0.5, tone: (n % 2) ? 'wave' : 'ghost',
                     op: (n % 2) ? 0.6 : 0.18 };
          }),
          notes: [{ key: 'e', x: 4, y: 0.75, text: barsOp ? 'even: zero' : '', tone: 'ghost', op: barsOp }]
        }
      };
    }
    var states = [st(0, 0, 'split at T/2'), st(1, 0, 'shift the second half back'),
                  st(1, 0.5, 'even n cancel, odd n add'), st(1, 1, '')];
    return { update: function (k, f) { var s = V.at(states, k, f); cu.set(s.cu); sp.set(s.sp); } };
  });

  /* ------------------------------------------------------ the square wave -- */
  function squareViz(root, duty, label) {
    var panes = V.split(root, 2, [1.3, 1]);
    var cu = V.curves(panes[0], {
      label: label, w: 320, h: 140, x0: 0, x1: TAU, ranges: [[-1.45, 1.45]], xLabel: 't'
    });
    var sp = V.curves(panes[1], {
      label: 'The coefficients.', w: 320, h: 90, x0: 0.4, x1: 9.6,
      ranges: [[duty ? -0.35 : 0, 1.45]], xLabel: 'n'
    });
    return { cu: cu, sp: sp };
  }

  A.viz('fs-square50', function (root) {
    var q = squareViz(root, 0, 'The square wave, and the partial sum climbing towards it.');
    var TGT = V.samp(function (t) { return P.squareWave(t, TAU); }, 0, TAU);
    function partial(N) {
      return V.samp(function (t) {
        var y = 0;
        for (var n = 1; n <= N; n += 2) y += P.squareCoeff(n) * Math.sin(n * t);
        return y;
      }, 0, TAU);
    }
    function st(N, barsOp, splitOp, label) {
      return {
        cu: {
          curves: [
            { key: 't', pts: TGT, tone: 'ghost', width: 1.6, dash: true },
            { key: 'p', pts: partial(N), tone: 'wave', width: 2.4 }
          ],
          fills: [{ key: 'h', pts: TGT, split: true, tone: 'wave', negTone: 'fail', op: 0.16 * splitOp }],
          marks: [{ key: 'h', kind: 'vline', x: Math.PI, tone: 'ghost', op: splitOp }],
          notes: [{ key: 'l', cap: true, text: label, tone: 'ghost' }]
        },
        sp: {
          bars: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) {
            return { key: 'b' + n, x: n, y: P.squareCoeff(n) * barsOp + 0.001, w: 0.44,
                     tone: 'wave', op: (n % 2) ? 0.6 : 0.12 };
          })
        }
      };
    }
    var states = [st(1, 0, 1, 'two halves, ±1'), st(1, 0, 1, ''),
                  st(3, 0.5, 0.4, 'the halves add'), st(15, 1, 0, '4/nπ, odd n only')];
    return { update: function (k, f) { var s = V.at(states, k, f); q.cu.set(s.cu); q.sp.set(s.sp); } };
  });

  A.viz('fs-square25', function (root) {
    var q = squareViz(root, 1, 'A narrower pulse, and the spectrum it spreads into.');
    function pulse(t, d) {
      var u = ((t + Math.PI) % TAU + TAU) % TAU - Math.PI;
      return Math.abs(u) < Math.PI * d ? 1 : 0;
    }
    function st(d, barsOp, envOp, label) {
      var F = V.samp(function (t) { return pulse(t, d); }, 0, TAU);
      return {
        cu: {
          curves: [{ key: 'f', pts: F, tone: 'ink', width: 2.4 }],
          fills: [{ key: 'f', pts: F, tone: 'wave', op: 0.2 }],
          marks: [{ key: 'm', kind: 'hline', y: d, tone: 'prob', op: barsOp }],
          notes: [
            { key: 'l', cap: true, text: label, tone: 'ghost' },
            { key: 'm', x: TAU * 0.85, y: d, dy: -7, text: barsOp ? 'a₀ = d' : '', tone: 'prob', op: barsOp }
          ]
        },
        sp: {
          bars: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) {
            return { key: 'b' + n, x: n, y: P.pulseCoeff(n, d) * barsOp, w: 0.44, tone: 'wave', op: 0.6 };
          }),
          /* The bar tops trace a sinc, whose zeros move out as the pulse narrows. */
          curves: [{ key: 'env', tone: 'prob', width: 1.6, dash: true, op: envOp,
                     pts: V.samp(function (n) { return P.pulseCoeff(Math.max(n, 0.001), d); }, 0.4, 9.6) }],
          notes: [{ key: 'e', cap: true, text: envOp ? 'envelope: a sinc' : '', tone: 'prob', op: envOp }]
        }
      };
    }
    var states = [st(0.5, 0, 0, 'duty ½'), st(0.35, 1, 0, 'narrower'),
                  st(0.25, 1, 0, 'narrower still'), st(0.25, 1, 1, 'zeros at n = 1/d')];
    return { update: function (k, f) { var s = V.at(states, k, f); q.cu.set(s.cu); q.sp.set(s.sp); } };
  });

  /* ------------------------------------------- when the repetition goes --- */

  A.viz('ft-complex-series', function (root) {
    var panes = V.split(root, 2, [1, 1]);
    var pl = V.plane(panes[0], {
      label: 'One real harmonic as two arrows turning opposite ways.',
      w: 320, h: 116, unit: 38, cx: 160, cy: 58, xLabel: 're', yLabel: ''
    });
    var sp = V.curves(panes[1], {
      label: 'The same information, one-sided and then two-sided.',
      w: 320, h: 112, x0: -3.6, x1: 3.6, ranges: [[0, 1.15]], xLabel: 'n'
    });
    var AMP = [0.9, 0.55, 0.35];
    function st(twoSided, arrowOp, label) {
      var bars = [];
      for (var n = 1; n <= 3; n++) {
        bars.push({ key: 'p' + n, x: n, y: AMP[n - 1] * (twoSided ? 0.5 : 1), w: 0.42,
                    tone: 'wave', op: 0.6 });
        /* The mirror bars are the negative-frequency half: the same numbers,
           written where they belong. */
        bars.push({ key: 'm' + n, x: -n, y: AMP[n - 1] * 0.5, w: 0.42,
                    tone: 'quantum', op: 0.6 * twoSided });
      }
      return { twoSided: twoSided, arrowOp: arrowOp, label: label, bars: bars };
    }
    var states = [st(0, 0, 'one real harmonic'), st(0, 1, 'two counter-rotating arrows'),
                  st(1, 1, 'cₙ and c₋ₙ')];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        var ph = t * 0.7, c = Math.cos(ph), sn = Math.sin(ph);
        pl.set({
          grid: false, circle: 1, circleOp: 0.45,
          arrows: [
            { key: 'p', ox: 0, oy: 0, x: c, y: sn, tone: 'wave', width: 2.4, op: s.arrowOp },
            { key: 'm', ox: 0, oy: 0, x: c, y: -sn, tone: 'quantum', width: 2.4, op: s.arrowOp },
            { key: 's', ox: 0, oy: 0, x: 2 * c, y: 0, tone: 'ink', width: 2.8 }
          ],
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
        sp.set({ bars: s.bars, marks: [{ key: 'z', kind: 'vline', x: 0, tone: 'ghost' }] });
      }
    };
  });

  A.viz('ft-limit', function (root) {
    var c = V.curves(root, {
      label: 'A comb of allowed frequencies crowding together into a continuum.',
      x0: -3.4, x1: 3.4, ranges: [[0, 1.25]], xLabel: 'ω'
    });
    function env(w) { return Math.exp(-w * w * 0.55); }
    var ENV = V.samp(env, -3.4, 3.4);
    var FLAT = V.samp(function () { return 0; }, -3.4, 3.4);
    function st(N, wide, envOp, label) {
      var d = 6.8 / N, bars = [];
      for (var i = -Math.floor(N / 2); i <= Math.floor(N / 2); i++) {
        var w = i * d;
        /* Height times spacing is what stays put: as the comb crowds, the
           spikes shorten but the little rectangles keep their area. */
        bars.push({ key: 's' + i, x: w, y: env(w) * (wide ? 1 : d * 1.9), w: wide ? d : 0.055,
                    tone: 'wave', op: wide ? 0.4 : 0.85 });
      }
      return {
        bars: bars,
        curves: [{ key: 'e', pts: envOp ? ENV : FLAT, tone: 'prob', width: 2, op: envOp }],
        marks: [{ key: 'd', kind: 'caliper', x0: 0, x1: d, y: 1.1, tone: 'ghost' }],
        notes: [
          { key: 'd', x: d / 2, y: 1.1, dy: -6, text: 'Δω', tone: 'ghost' },
          { key: 'l', cap: true, text: label, tone: 'ghost' }
        ]
      };
    }
    var states = [st(9, 0, 0, 'spacing 2π/T'), st(9, 0, 1, 'rescaled: an envelope appears'),
                  st(17, 1, 1, 'value × spacing'), st(49, 1, 1, 'T → ∞: an integral')];
    return { update: function (k, f) { c.set(V.at(states, k, f)); } };
  });

  /* ------------------------------------------------- transform pairs ------ */
  function pairViz(root, label, kLabel) {
    var panes = V.split(root, 2, [1, 1]);
    var left = V.curves(panes[0], {
      label: label, w: 320, h: 114, x0: -4, x1: 4, ranges: [[-0.35, 1.2]], xLabel: 'x'
    });
    var right = V.curves(panes[1], {
      label: 'Its transform.', w: 320, h: 114, x0: -8, x1: 8,
      ranges: [[-0.42, 1.2]], xLabel: kLabel || 'k'
    });
    return { left: left, right: right };
  }

  A.viz('ft-rect', function (root) {
    var q = pairViz(root, 'A rectangle of width a.');
    function rect(x, a) { return Math.abs(x) < a / 2 ? 1 : 0; }
    function st(a, rightOp, zeroOp, label) {
      var F = V.samp(function (x) { return rect(x, a); }, -4, 4);
      var G = V.samp(function (k) { return M.sinc(k * a / 2); }, -8, 8);
      return {
        left: {
          curves: [{ key: 'f', pts: F, tone: 'ink', width: 2.4 }],
          fills: [{ key: 'f', pts: F, tone: 'wave', op: 0.22 }],
          marks: [{ key: 'w', kind: 'caliper', x0: -a / 2, x1: a / 2, y: -0.2, tone: 'prob' }],
          notes: [
            { key: 'w', x: 0, y: -0.2, dy: -6, text: 'a', tone: 'prob' },
            { key: 'l', cap: true, text: label, tone: 'ghost' }
          ]
        },
        right: {
          curves: [{ key: 'g', pts: G.map(function (y) { return y * rightOp; }), tone: 'wave', width: 2.2 }],
          marks: [
            { key: 'z1', kind: 'dot', x: TAU / a, y: 0, tone: 'quantum', op: zeroOp },
            { key: 'z2', kind: 'dot', x: -TAU / a, y: 0, tone: 'quantum', op: zeroOp }
          ],
          notes: [{ key: 'z', x: TAU / a, y: 0, dy: 15, text: zeroOp ? '2π/a' : '',
                    tone: 'quantum', op: zeroOp }]
        }
      };
    }
    var states = [st(2, 0, 0, 'zero outside'), st(2, 0.6, 0, ''),
                  st(2, 1, 1, 'a sinc'), st(1.1, 1, 1, 'narrower rect, wider sinc')];
    return { update: function (k, f) { var s = V.at(states, k, f); q.left.set(s.left); q.right.set(s.right); } };
  });

  A.viz('ft-gauss-ode', function (root) {
    var q = pairViz(root, 'A Gaussian, and the cosine it is weighed against.');
    var SIG = 1.1;
    function st(kernelOp, slopeOp, rightOp, label) {
      var kk = 1.6;
      var F = V.samp(function (x) { return P.gaussian(x, SIG); }, -4, 4);
      var KER = V.samp(function (x) { return P.gaussian(x, SIG) * Math.cos(kk * x); }, -4, 4);
      var G = V.samp(function (k) { return Math.exp(-SIG * SIG * k * k / 2); }, -8, 8);
      return {
        left: {
          curves: [
            { key: 'f', pts: F, tone: 'ink', width: 2.2 },
            { key: 'p', pts: KER, tone: 'wave', width: 2, op: kernelOp }
          ],
          fills: [{ key: 'p', pts: KER, split: true, tone: 'wave', negTone: 'fail',
                    op: 0.28 * kernelOp }],
          notes: [{ key: 'l', cap: true, text: label, tone: 'ghost' }]
        },
        right: {
          curves: [{ key: 'g', pts: G.map(function (y) { return y * rightOp; }), tone: 'wave', width: 2.2 }],
          /* The defining property, drawn: the slope at each k is −σ²k times
             the height there, which is what makes the answer a Gaussian. */
          marks: [
            { key: 'p', kind: 'dot', x: kk, y: Math.exp(-SIG * SIG * kk * kk / 2) * rightOp,
              tone: 'quantum', op: slopeOp },
            { key: 't', kind: 'seg', dash: false, tone: 'quantum', op: slopeOp,
              x0: kk - 1.6, x1: kk + 1.6,
              y0: Math.exp(-SIG * SIG * kk * kk / 2) * rightOp * (1 + SIG * SIG * kk * 1.6),
              y1: Math.exp(-SIG * SIG * kk * kk / 2) * rightOp * (1 - SIG * SIG * kk * 1.6) }
          ],
          notes: [{ key: 's', cap: true, text: slopeOp ? "F' = −σ²k F" : '', tone: 'quantum', op: slopeOp }]
        }
      };
    }
    var states = [st(1, 0, 0, 'only the cosine survives'), st(1, 0, 0.4, 'differentiate in k'),
                  st(0.5, 0, 0.7, 'integrate by parts'), st(0.25, 1, 1, 'the same F again'),
                  st(0.15, 1, 1, 'so F is a Gaussian')];
    return { update: function (k, f) { var s = V.at(states, k, f); q.left.set(s.left); q.right.set(s.right); } };
  });

  A.viz('ft-widths', function (root) {
    var q = pairViz(root, 'The pulse, with its width measured.');
    function st(sig, label) {
      var w = P.gaussianWidths(sig);
      var F = V.samp(function (x) { return P.gaussian(x, sig) * P.gaussian(x, sig); }, -4, 4);
      var G = V.samp(function (k) { return Math.exp(-sig * sig * k * k); }, -8, 8);
      return {
        left: {
          curves: [{ key: 'f', pts: F, tone: 'ink', width: 2.4 }],
          fills: [{ key: 'f', pts: F, tone: 'wave', op: 0.2 }],
          marks: [{ key: 'w', kind: 'caliper', x0: -w.dx, x1: w.dx, y: -0.2, tone: 'prob' }],
          notes: [
            { key: 'w', x: 0, y: -0.2, dy: -6, text: 'Δx', tone: 'prob' },
            { key: 'l', cap: true, text: label, tone: 'ghost' }
          ]
        },
        right: {
          curves: [{ key: 'g', pts: G, tone: 'wave', width: 2.4 }],
          fills: [{ key: 'g', pts: G, tone: 'quantum', op: 0.2 }],
          marks: [{ key: 'w', kind: 'caliper', x0: -w.dk, x1: w.dk, y: -0.24, tone: 'prob' }],
          notes: [
            { key: 'w', x: 0, y: -0.24, dy: -6, text: 'Δk', tone: 'prob' },
            { key: 'p', cap: true, text: 'Δx Δk = ' + w.product.toFixed(2), tone: 'prob' }
          ]
        }
      };
    }
    /* Sweep σ over a decade: the two brackets trade sizes and the product,
       printed on the right, does not move. */
    var states = [st(0.55, '|f|² has width σ/√2'), st(1.0, ''), st(1.7, ''),
                  st(2.4, 'the product never moves')];
    return { update: function (k, f) { var s = V.at(states, k, f); q.left.set(s.left); q.right.set(s.right); } };
  });

  /* ------------------------------------------- the area under a Gaussian -- */
  A.viz('ft-gauss-integral', function (root) {
    /* The only picture on the site that needs a field on the plane: the
       integrand depends on distance alone, which is what makes rings work. */
    var p = V.plane(root, {
      label: 'The bell surface cut into rings, one of them unrolled into a strip.',
      unit: 30, cx: 120, cy: 128, axes: false
    });
    var NR = 9;
    function rings(op, pick) {
      var out = [];
      for (var i = 1; i <= NR; i++) {
        var r = i * 0.42;
        out.push({ key: 'r' + i, r: r, a0: 0, a1: TAU, ox: 0, oy: 0,
                   tone: i === pick ? 'quantum' : 'wave',
                   op: op * (i === pick ? 1 : 0.16 + 0.7 * Math.exp(-r * r * 0.55)) });
      }
      return out;
    }
    /* A bell drawn along one axis, as a filled outline. */
    function bell(vertical) {
      var pts = [], n = 40, i, x, y;
      for (i = 0; i <= n; i++) {
        x = -3.6 + 7.2 * i / n;
        y = 1.5 * Math.exp(-x * x * 0.55);
        pts.push(vertical ? [y, x] : [x, y]);
      }
      pts.push(vertical ? [0, 3.6] : [3.6, 0]);
      pts.push(vertical ? [0, -3.6] : [-3.6, 0]);
      return pts;
    }
    function st(axesOp, fieldOp, pick, unroll, label, ansOp) {
      var r = pick * 0.42;
      ansOp = ansOp || 0;
      return {
        grid: false,
        arcs: rings(fieldOp, pick),
        legs: [
          { key: 'gx', x0: -3.6, y0: 0, x1: 3.6, y1: 0, tone: 'ghost', op: axesOp * 0.6, solid: true },
          { key: 'gy', x0: 0, y0: -3.6, x1: 0, y1: 3.6, tone: 'ghost', op: axesOp * 0.6, solid: true }
        ],
        /* The two one-dimensional bells the surface is the product of, drawn as
           filled shapes on their own axes; then one ring, straightened into a
           rectangle 2πr long; then the answer as a square of area π. */
        shade: [
          { key: 'bx', tone: 'wave', op: 0.3 * axesOp, pts: bell(false) },
          { key: 'by', tone: 'quantum', op: 0.3 * axesOp, pts: bell(true) },
          { key: 'strip', tone: 'quantum', op: 0.4 * unroll,
            pts: [[4.4, -1.7], [4.4 + 0.42, -1.7],
                  [4.4 + 0.42, -1.7 + TAU * r * 0.42], [4.4, -1.7 + TAU * r * 0.42]] },
          { key: 'ans', tone: 'prob', op: 0.32 * ansOp,
            pts: [[-0.885, -0.885], [0.885, -0.885], [0.885, 0.885], [-0.885, 0.885]] }
        ],
        notes: [
          { key: 'l', cap: true, text: label, tone: 'ghost' },
          { key: 's', x: 4.25, y: -1.7 + TAU * r * 0.21, text: unroll ? '2πr dr' : '',
            tone: 'quantum', op: unroll, anchor: 'end' },
          { key: 'a', x: 0, y: 0, text: ansOp ? 'area π' : '', tone: 'prob', op: ansOp }
        ]
      };
    }
    var states = [
      st(1, 0, 0, 0, 'two bells, one per axis', 0),
      st(0.4, 1, 0, 0, 'their product fills the plane', 0),
      st(0.15, 1, 4, 1, 'cut into rings', 0),
      st(0.15, 1, 4, 1, 'u = r² makes it elementary', 0),
      st(0, 0.25, 0, 0, 'I² = π, so I = √π', 1)
    ];
    return { update: function (k, f) { p.set(V.at(states, k, f)); } };
  });
})(window.A = window.A || {});
