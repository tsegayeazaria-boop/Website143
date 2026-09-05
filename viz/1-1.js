/* ============================================================================
   viz/1-1.js — the pictures beside §1.1's derivations.

   Complex numbers are arrows, so this page is almost all plane: arrows from a
   shared tail or chained tip-to-tail, the arcs between them, and the shadow
   one casts on the real axis when it turns.
   ========================================================================= */
(function (A) {
  'use strict';
  var V = A.viz, M = A.math;
  var TAU = Math.PI * 2;

  /* ------------------------------------------- a number times its mirror --- */
  A.viz('cx-modulus', function (root) {
    var z = [1.5, 1.05];
    var r = M.hypot(z[0], z[1]);
    var p = V.plane(root, {
      label: 'A number, its mirror image, and the two squares that add to give its length squared.',
      unit: 44, cx: 44, cy: 118, xLabel: 're', yLabel: 'im'
    });
    /* The squares are drawn clear of the arrows: a square laid over the
       triangle it belongs to is unreadable at this size. */
    function sq(key, x, y, side, tone, op) {
      return { key: key, tone: tone, op: op,
               pts: [[x, y], [x + side, y], [x + side, y + side], [x, y + side]] };
    }
    function st(sqOp, merged, label) {
      var K = 0.72;                                   /* squares drawn to scale, at 72% */
      var s1 = (merged ? r : z[0]) * K, s2 = (merged ? 0 : z[1]) * K;
      var x1 = 2.55, x2 = merged ? 2.55 : 2.55 + z[0] * K + 0.16, y0 = -1.25;
      return {
        grid: false,
        arrows: [
          { key: 'z', ox: 0, oy: 0, x: z[0], y: z[1], tone: 'wave', width: 2.8 },
          { key: 'zc', ox: 0, oy: 0, x: z[0], y: -z[1], tone: 'quantum', width: 2.4 }
        ],
        legs: [
          { key: 'x', x0: 0, y0: 0, x1: z[0], y1: 0, tone: 'ghost' },
          { key: 'y', x0: z[0], y0: 0, x1: z[0], y1: z[1], tone: 'ghost' }
        ],
        shade: [sq('s1', x1, y0, s1, 'wave', sqOp), sq('s2', x2, y0, s2, 'quantum', sqOp)],
        notes: [
          { key: 'z', x: z[0] * 0.55 - 0.3, y: z[1] * 0.55 + 0.2, text: 'z', tone: 'wave' },
          { key: 'zc', x: z[0] * 0.55 + 0.35, y: -z[1] * 0.55 - 0.1, text: 'z*', tone: 'quantum' },
          { key: 'x', x: z[0] / 2, y: 0, dy: 14, text: 'x', tone: 'ghost' },
          { key: 'y', x: z[0] + 0.14, y: z[1] / 2, text: 'y', tone: 'ghost', anchor: 'start' },
          { key: 'l1', x: x1 + s1 / 2, y: y0 + s1 / 2, text: label, tone: 'ink', op: sqOp },
          { key: 'l2', x: x2 + s2 / 2, y: y0 + s2 / 2, text: merged ? '' : 'y²',
            tone: 'ink', op: sqOp }
        ]
      };
    }
    var states = [st(0, false, 'x²'), st(1, false, 'x²'), st(1, true, '|z|²'), st(1, true, '|z|²')];
    void r;
    return { update: function (k, f) { p.set(V.at(states, k, f)); } };
  });

  /* --------------------------------------------- multiplying adds angles --- */
  A.viz('cx-product-angles', function (root) {
    var r1 = 1.15, t1 = 0.5, r2 = 1.0, t2 = 0.75;
    var p = V.plane(root, {
      label: 'Two arrows, and the product whose angle is their two angles stacked.',
      unit: 84, cx: 90, cy: 178, xLabel: 're', yLabel: 'im'
    });
    function arrow(key, r, t, tone, w) {
      return { key: key, ox: 0, oy: 0, x: r * Math.cos(t), y: r * Math.sin(t), tone: tone, width: w || 2.6 };
    }
    function st(stack, prodOp) {
      /* Stacking is the whole content: the second angle is redrawn starting
         where the first one finished. */
      var a2from = stack ? t1 : 0, a2to = stack ? t1 + t2 : t2;
      return {
        grid: false, circle: 1, circleOp: 0.5,
        arrows: [
          arrow('z1', r1, t1, 'wave'),
          arrow('z2', r2, t2, 'quantum'),
          { key: 'zp', ox: 0, oy: 0, x: r1 * r2 * Math.cos(t1 + t2), y: r1 * r2 * Math.sin(t1 + t2),
            tone: 'prob', width: 3, op: prodOp }
        ],
        arcs: [
          { key: 'a1', r: 0.5, a0: 0, a1: t1, tone: 'wave' },
          { key: 'a2', r: 0.68, a0: a2from, a1: a2to, tone: 'quantum' }
        ],
        notes: [
          { key: 'z1', x: r1 * Math.cos(t1) + 0.18, y: r1 * Math.sin(t1), text: 'z₁', tone: 'wave', anchor: 'start' },
          { key: 'z2', x: r2 * Math.cos(t2) - 0.1, y: r2 * Math.sin(t2) + 0.2, text: 'z₂', tone: 'quantum' },
          { key: 'zp', x: r1 * r2 * Math.cos(t1 + t2) + 0.2, y: r1 * r2 * Math.sin(t1 + t2) + 0.12,
            text: 'z₁z₂', tone: 'prob', op: prodOp, anchor: 'start' },
          { key: 'th', cap: true, text: stack ? 'θ₁ + θ₂' : 'θ₁ and θ₂', tone: 'ghost' }
        ]
      };
    }
    var states = [st(false, 0), st(false, 0), st(false, 0), st(true, 0), st(true, 1)];
    return { update: function (k, f) { p.set(V.at(states, k, f)); } };
  });

  /* --------------------------------------------- Euler, from the series --- */
  A.viz('cx-euler-series', function (root) {
    var th = 1.0, N = 6;
    var p = V.plane(root, {
      label: 'The terms of the series laid tip to tail, before and after the powers of i turn them.',
      unit: 74, cx: 42, cy: 190, xLabel: 're', yLabel: 'im'
    });
    var mag = [], i, fact = 1;
    for (i = 0; i < N; i++) { if (i) fact *= i; mag.push(Math.pow(th, i) / fact); }

    /* Straightened: every term along the real axis, which is the series for
       e^θ. Turned: each term rotated by its own power of i, which is the same
       series with u = iθ. Same lengths, different directions. */
    function chain(turned, splitOp) {
      var legs = [], x = 0, y = 0, ex = 0, ey = 0;
      for (var n = 0; n < N; n++) {
        var ang = turned ? n * Math.PI / 2 : 0;
        var dx = mag[n] * Math.cos(ang), dy = mag[n] * Math.sin(ang);
        legs.push({ key: 't' + n, x0: x, y0: y, x1: x + dx, y1: y + dy,
                    tone: (n % 2) ? 'quantum' : 'wave', solid: true });
        x += dx; y += dy;
        if (n % 2) ey += dy; else ex += dx;
      }
      return { legs: legs, end: [x, y], ex: ex, ey: ey, splitOp: splitOp };
    }
    function st(turned, splitOp, circleOp) {
      var c = chain(turned, splitOp);
      return {
        grid: false, circle: 1, circleOp: circleOp,
        legs: c.legs.concat(splitOp ? [
          { key: 'cx', x0: 0, y0: -0.22, x1: c.ex, y1: -0.22, tone: 'wave', op: splitOp },
          { key: 'cy', x0: c.ex + 0.22, y0: 0, x1: c.ex + 0.22, y1: c.ey, tone: 'quantum', op: splitOp }
        ] : []),
        arrows: [{ key: 'e', ox: 0, oy: 0, x: c.end[0], y: c.end[1], tone: 'ink', width: 2.4,
                   op: turned ? 1 : 0.35 }],
        notes: [
          { key: 'c', x: c.ex / 2, y: -0.22, dy: 14, text: splitOp ? 'cos θ' : '', tone: 'wave', op: splitOp },
          { key: 's', x: c.ex + 0.34, y: c.ey / 2, text: splitOp ? 'sin θ' : '', tone: 'quantum',
            op: splitOp, anchor: 'start' },
          { key: 'lab', cap: true, text: turned ? '' : 'the same lengths, all one way', tone: 'ghost' }
        ]
      };
    }
    var states = [st(false, 0, 0.25), st(true, 0, 0.7), st(true, 1, 0.7), st(true, 1, 1)];
    return { update: function (k, f) { p.set(V.at(states, k, f)); } };
  });

  /* -------------------------------------- Euler, from a derivative -------- */
  A.viz('cx-euler-ode', function (root) {
    var p = V.plane(root, {
      label: 'A point on the circle whose velocity is always at right angles to it.',
      unit: 66, cx: 160, cy: 120, xLabel: 're', yLabel: 'im'
    });
    function st(velOp, compOp, rightOp, spin) {
      return { velOp: velOp, compOp: compOp, rightOp: rightOp, spin: spin };
    }
    var states = [st(0, 0, 0, 0), st(1, 1, 0, 0), st(1, 0.3, 1, 0), st(1, 0, 1, 1)];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        /* The last step is the claim in motion: both arrows sweep once round
           and the right angle between them never changes. */
        var th = 0.72 + s.spin * (t % TAU) * 0.7;
        var c = Math.cos(th), sn = Math.sin(th);
        p.set({
          grid: false, circle: 1, circleOp: 0.8,
          arrows: [
            { key: 'f', ox: 0, oy: 0, x: c, y: sn, tone: 'wave', width: 3 },
            { key: 'fp', ox: c, oy: sn, x: c - sn * 0.85, y: sn + c * 0.85, tone: 'quantum',
              width: 2.6, op: s.velOp }
          ],
          legs: [
            { key: 'vx', x0: c, y0: sn, x1: c - sn * 0.85, y1: sn, tone: 'quantum', op: s.compOp },
            { key: 'vy', x0: c - sn * 0.85, y0: sn, x1: c - sn * 0.85, y1: sn + c * 0.85,
              tone: 'quantum', op: s.compOp }
          ],
          marks: [{ key: 'ra', kind: 'right', x: c, y: sn, a0: th, a1: th + Math.PI / 2,
                    s: 9, tone: 'prob', op: s.rightOp }],
          dots: [{ key: 'one', x: 1, y: 0, tone: 'ink', r: 3, op: 0.8 }],
          notes: [
            { key: 'f', x: c * 0.5 - 0.2, y: sn * 0.5 + 0.16, text: 'f(θ)', tone: 'wave' },
            { key: 'fp', x: c - sn * 0.5 + 0.1, y: sn + c * 0.5 + 0.2, text: "f '(θ)",
              tone: 'quantum', op: s.velOp },
            { key: 'one', x: 1.02, y: -0.02, dy: 15, text: 'f(0) = 1', tone: 'ink', op: 0.8 }
          ]
        });
      }
    };
  });

  /* ------------------------------------ cosine and sine as exponentials --- */
  A.viz('cx-cos-sin', function (root) {
    var th = 0.85;
    var p = V.plane(root, {
      label: 'A conjugate pair added and subtracted: once the sines cancel, once the cosines do.',
      unit: 70, cx: 84, cy: 120, xLabel: 're', yLabel: 'im'
    });
    var c = Math.cos(th), s = Math.sin(th);
    function st(mode, resOp, label) {
      /* mode 0: from a shared tail. 1: chained, sines cancelling.
         2: the second one flipped, so the cosines cancel instead. */
      var chained = mode > 0, flip = mode === 2;
      var b = flip ? [-c, -s] : [c, -s];
      var end = chained ? [c + b[0], s + b[1]] : b;
      return {
        grid: false, circle: 1, circleOp: 0.6,
        arrows: [
          { key: 'p', ox: 0, oy: 0, x: c, y: s, tone: 'wave', width: 2.6 },
          { key: 'm', ox: chained ? c : 0, oy: chained ? s : 0,
            x: chained ? c + b[0] : b[0], y: chained ? s + b[1] : b[1], tone: 'quantum', width: 2.6 },
          { key: 'r', ox: 0, oy: 0, x: end[0], y: end[1], tone: 'prob', width: 3, op: resOp }
        ],
        legs: chained ? [] : [
          { key: 'up', x0: c, y0: 0, x1: c, y1: s, tone: 'wave' },
          { key: 'dn', x0: c, y0: 0, x1: c, y1: -s, tone: 'quantum' }
        ],
        notes: [
          { key: 'p', x: c * 0.55 - 0.3, y: s * 0.55 + 0.2, text: '+θ', tone: 'wave' },
          { key: 'm', x: chained ? c + b[0] * 0.5 + 0.36 : b[0] * 0.55 + 0.3,
            y: chained ? s + b[1] * 0.5 : b[1] * 0.55 - 0.2, text: '−θ', tone: 'quantum' },
          { key: 'lab', cap: true, text: label, tone: 'prob', op: resOp }
        ]
      };
    }
    var states = [
      st(0, 0, ''),
      st(1, 1, 'sines cancel: 2 cos θ'),
      st(2, 1, 'cosines cancel: 2i sin θ'),
      st(2, 1, 'divide by 2 and by 2i')
    ];
    return { update: function (k, f) { p.set(V.at(states, k, f)); } };
  });

  /* ---------------------------- what a derivative does to a rotating arrow -- */
  A.viz('cx-derivative', function (root, api) {
    var panes = V.split(root, 3, [1, 0.42, 0.8]);
    var pl = V.plane(panes[0], {
      label: 'A rotating arrow, and what each time derivative does to it.',
      w: 320, h: 112, unit: 34, cx: 160, cy: 56, xLabel: '', yLabel: ''
    });
    /* The object the arrow is standing for: the arrow's shadow is where the
       mass is, so the two move together and neither is a metaphor. */
    var bn = V.bench(panes[1], {
      label: 'The mass whose position is that shadow.', w: 320, h: 48, box: 13
    });
    var cu = V.curves(panes[2], {
      label: 'The shadow each arrow casts on the real axis, against time.',
      w: 320, h: 88, x0: 0, x1: 3 * TAU, ranges: [[-1.35, 1.35]], xLabel: 't'
    });
    var w = 1.25;
    function st(dOp, ddOp, label) { return { dOp: dOp, ddOp: ddOp, label: label }; }
    var states = [st(0, 0, ''), st(1, 0, 'one quarter turn, times ω'),
                  st(1, 1, 'twice: a half turn'), st(1, 1, 'so × (−ω²)')];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        var ph = t * 0.8;
        var c = Math.cos(ph), sn = Math.sin(ph);
        var lit = V.lit(api.hl(f > 0.5 ? k + 1 : k));
        pl.set({
          grid: false, circle: 1, circleOp: 0.55,
          arrows: [
            { key: 'z', ox: 0, oy: 0, x: c, y: sn, tone: 'wave', width: 3 },
            /* i is a quarter turn and ω a stretch, so the derivative is the
               same arrow, turned and lengthened. */
            { key: 'dz', ox: 0, oy: 0, x: -sn * w, y: c * w,
              tone: lit('iw') ? 'quantum' : 'quantum', width: 2.6, op: s.dOp },
            { key: 'ddz', ox: 0, oy: 0, x: -c * w * w, y: -sn * w * w,
              tone: 'prob', width: 2.4, op: s.ddOp }
          ],
          notes: [
            { key: 'z', x: c * 0.55, y: sn * 0.55, dy: -8, text: 'z', tone: 'wave' },
            { key: 'd', x: -sn * w * 0.6, y: c * w * 0.6, dy: -8, text: 'ż', tone: 'quantum', op: s.dOp },
            { key: 'dd', x: -c * w * w * 0.62, y: -sn * w * w * 0.62, dy: 12, text: 'z̈',
              tone: 'prob', op: s.ddOp },
            { key: 'l', cap: true, text: s.label, tone: 'ghost' }
          ]
        });
        bn.set({
          x: [c * 1.6],
          arrows: [{ key: 'v', on: 0, dx: -sn * w * 1.1, tone: 'quantum', above: true, op: s.dOp }]
        });
        cu.set({
          curves: [
            { key: 'z', pts: V.samp(function (x) { return Math.cos(x + ph); }, 0, 3 * TAU), tone: 'wave', width: 2 },
            { key: 'dz', pts: V.samp(function (x) { return -w * Math.sin(x + ph); }, 0, 3 * TAU),
              tone: 'quantum', width: 1.8, op: s.dOp },
            { key: 'ddz', pts: V.samp(function (x) { return -w * w * Math.cos(x + ph); }, 0, 3 * TAU),
              tone: 'prob', width: 1.8, op: s.ddOp }
          ]
        });
      }
    };
  });

  /* ------------------------------------- why taking the real part is safe -- */
  A.viz('cx-real-part', function (root) {
    var panes = V.split(root, 2, [1.2, 1]);
    var pl = V.plane(panes[0], {
      label: 'A complex solution orbiting, and the two real shadows it casts.',
      w: 320, h: 130, unit: 56, cx: 160, cy: 66, xLabel: 're', yLabel: 'im'
    });
    var cu = V.curves(panes[1], {
      label: 'Each shadow, against time; each solves the same equation on its own.',
      w: 320, h: 104, x0: 0, x1: 3 * TAU, ranges: [[-1.35, 1.35]], xLabel: 't'
    });
    var states = [
      { u: 1, v: 0, drop: 0 },     /* 0 — one complex trajectory */
      { u: 1, v: 1, drop: 1 },     /* 1 — split into real and imaginary parts */
      { u: 1, v: 1, drop: 1 },     /* 2 — both brackets are real, both vanish */
      { u: 1, v: 0.12, drop: 0.5 } /* 3 — keep the real one; nothing was lost */
    ];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        var ph = t * 0.8, c = Math.cos(ph), sn = Math.sin(ph);
        pl.set({
          grid: false, circle: 1, circleOp: 0.5,
          arrows: [{ key: 'z', ox: 0, oy: 0, x: c, y: sn, tone: 'ink', width: 2.6 }],
          legs: [
            { key: 'du', x0: c, y0: sn, x1: c, y1: 0, tone: 'wave', op: s.drop },
            { key: 'dv', x0: c, y0: sn, x1: 0, y1: sn, tone: 'quantum', op: s.drop * s.v }
          ],
          dots: [
            { key: 'u', x: c, y: 0, tone: 'wave', r: 3.6, op: s.u },
            { key: 'v', x: 0, y: sn, tone: 'quantum', r: 3.6, op: s.v }
          ],
          notes: [
            { key: 'z', x: c * 0.55, y: sn * 0.55, dy: -8, text: 'z', tone: 'ink' },
            { key: 'u', x: c, y: 0, dy: 16, text: 'u', tone: 'wave', op: s.u },
            { key: 'v', x: -0.14, y: sn, text: 'v', tone: 'quantum', op: s.v, anchor: 'end' }
          ]
        });
        cu.set({
          curves: [
            { key: 'u', pts: V.samp(function (x) { return Math.cos(x + ph); }, 0, 3 * TAU),
              tone: 'wave', width: 2.2, op: s.u },
            { key: 'v', pts: V.samp(function (x) { return Math.sin(x + ph); }, 0, 3 * TAU),
              tone: 'quantum', width: 2, op: s.v }
          ],
          notes: [{ key: 'l', cap: true, text: 'both solve it', tone: 'ghost', op: s.v }]
        });
      }
    };
  });

  /* ------------------------------------------------ two equal waves added -- */
  A.viz('cx-phasor-sum', function (root) {
    var p = V.plane(root, {
      label: 'Two equal arrows a phase apart, added tip to tail along their bisector.',
      unit: 66, cx: 78, cy: 126, xLabel: 're', yLabel: 'im'
    });
    var E = 1.15;
    function frame(base, delta, chained, resOp, bisOp, label) {
      var a1 = base, a2 = base + delta;
      var v1 = [E * Math.cos(a1), E * Math.sin(a1)];
      var v2 = [E * Math.cos(a2), E * Math.sin(a2)];
      var end = chained ? [v1[0] + v2[0], v1[1] + v2[1]] : v2;
      return {
        grid: false, circle: E, circleOp: 0.35,
        arrows: [
          { key: 'a', ox: 0, oy: 0, x: v1[0], y: v1[1], tone: 'wave', width: 2.6 },
          { key: 'b', ox: chained ? v1[0] : 0, oy: chained ? v1[1] : 0,
            x: chained ? v1[0] + v2[0] : v2[0], y: chained ? v1[1] + v2[1] : v2[1],
            tone: 'quantum', width: 2.6 },
          { key: 'r', ox: 0, oy: 0, x: end[0], y: end[1], tone: 'prob', width: 3, op: resOp }
        ],
        arcs: [{ key: 'd', r: 0.5, a0: a1, a1: a2, tone: 'ghost' }],
        rays: bisOp ? [{ key: 'bi', x: Math.cos(base + delta / 2), y: Math.sin(base + delta / 2),
                         tone: 'prob', op: bisOp * 0.32 }] : [],
        notes: [
          { key: 'd', x: Math.cos(base + delta / 2) * 0.78, y: Math.sin(base + delta / 2) * 0.78,
            text: 'δ', tone: 'ghost' },
          { key: 'l', cap: true, text: label, tone: 'prob', op: resOp }
        ]
      };
    }
    var D = 1.0;
    var states = [
      frame(0.35, D, false, 0, 0, ''),                 /* 0 — two arrows, δ apart */
      frame(0.95, D, false, 0, 0, ''),                 /* 1 — the common factor is a rigid turn */
      frame(-D / 2, D, false, 0, 1, ''),               /* 2 — turned back, symmetric about the axis */
      frame(-D / 2, D, true, 1, 1, '2E₀cos(δ/2)'),     /* 3 — the sum lies along the bisector */
      frame(-Math.PI / 2, Math.PI, true, 1, 1, 'δ = π: nothing left')
    ];
    return { update: function (k, f) { p.set(V.at(states, k, f)); } };
  });
})(window.A = window.A || {});
