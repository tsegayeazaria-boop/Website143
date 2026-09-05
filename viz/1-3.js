/* ============================================================================
   viz/1-3.js — the pictures beside §1.3's derivations.

   Each entry is a table of states, one per step, and the engine morphs between
   them on the same scroll position and the same eased fraction that drive the
   equation. A step that is pure algebra repeats the state before it and lights
   the part of the picture the terms belong to, rather than inventing motion.
   ========================================================================= */
(function (A) {
  'use strict';
  var V = A.viz, M = A.math;

  /* ---------------------------------------------- vectors add separately --- */
  /* The right-hand side of step one, read left to right, is a chain of four
     terms; so the picture is those four legs laid tip-to-tail in that order,
     ending on the sum. Commuting the middle two terms then slides the legs
     into a new order without moving the endpoint, which is the claim. */
  A.viz('la-components-add', function (root, api) {
    var u = [1.55, 0.72], v = [0.85, 1.48];
    var sx = u[0] + v[0], sy = u[1] + v[1];
    var p = V.plane(root, {
      label: 'Two arrows added, first leg by leg in the order written, then regrouped.',
      unit: 84, cx: 44, cy: 222, xLabel: '', yLabel: ''
    });

    /* A leg of the chain, given where it starts and what it adds. Each carries
       its own name, so the reader watches v₁ slide from third place to second
       rather than being told that it did. */
    function leg(key, x0, y0, dx, dy, tone) {
      return { key: key, x0: x0, y0: y0, x1: x0 + dx, y1: y0 + dy, tone: tone };
    }
    var NAME = { e1: 'u\u2081', e2: 'u\u2082', e1b: 'v\u2081', e2b: 'v\u2082' };
    /* Once the pairs have fused, the surviving leg measures the bracket, not
       one term of it, so it says so. */
    var SUM = { e1: 'u\u2081+v\u2081', e2: 'u\u2082+v\u2082', e1b: '', e2b: '' };
    function tags(legs, name) {
      return legs.map(function (g) {
        var flat = Math.abs(g.y1 - g.y0) < 1e-6;
        return {
          key: g.key, tone: g.tone,
          x: (g.x0 + g.x1) / 2 + (flat ? 0 : 0.17),
          y: (g.y0 + g.y1) / 2,
          dy: flat ? 13 : 4,
          text: (name || NAME)[g.key],
          op: Math.abs(g.x1 - g.x0) + Math.abs(g.y1 - g.y0) < 0.04 ? 0 : 1
        };
      });
    }
    var U = 'wave', Vt = 'prob', LIT = 'quantum';

    /* Written order: u₁e₁, u₂e₂, v₁e₁, v₂e₂. */
    function written(t1, t2) {
      return [
        leg('e1', 0, 0, u[0], 0, t1),
        leg('e2', u[0], 0, 0, u[1], t2),
        leg('e1b', u[0], u[1], v[0], 0, t1),
        leg('e2b', sx, u[1], 0, v[1], t2)
      ];
    }
    /* Regrouped: the two e₁ legs adjacent, then the two e₂ legs. */
    function grouped(t1, t2) {
      return [
        leg('e1', 0, 0, u[0], 0, t1),
        leg('e1b', u[0], 0, v[0], 0, t1),
        leg('e2', sx, 0, 0, u[1], t2),
        leg('e2b', sx, u[1], 0, v[1], t2)
      ];
    }
    /* Fused: each pair has become one leg, so the second of each pair has
       nothing left to contribute and sits at zero length on the joint. */
    function fused(t1, t2) {
      return [
        leg('e1', 0, 0, sx, 0, t1),
        leg('e1b', sx, 0, 0, 0, t1),
        leg('e2', sx, 0, 0, sy, t2),
        leg('e2b', sx, sy, 0, 0, t2)
      ];
    }

    var chain = [
      { key: 'u', ox: 0, oy: 0, x: u[0], y: u[1], tone: U, width: 2.6 },
      { key: 'v', ox: u[0], oy: u[1], x: sx, y: sy, tone: Vt, width: 2.6 }
    ];
    var sum = { key: 's', ox: 0, oy: 0, x: sx, y: sy, tone: 'ink', width: 3, op: 1 };

    function names(on) {
      return [
        { key: 'u', x: u[0] * 0.5 - 0.12, y: u[1] * 0.5 + 0.14, text: 'u', tone: U },
        { key: 'v', x: (u[0] + sx) / 2 - 0.2, y: (u[1] + sy) / 2, text: 'v', tone: Vt },
        { key: 's', x: sx * 0.46, y: sy * 0.46 + 0.3, text: 'u + v', tone: 'ink', op: on }
      ];
    }

    function step(arrows, legs, showSum, name) {
      return { grid: true, arrows: arrows, legs: legs, notes: names(showSum).concat(tags(legs, name)) };
    }

    var states = [
      /* 0 — written in the order the equation writes them. */
      step(chain, written(U, Vt), 0),
      /* 1 — the commutation: the legs slide into pairs. Nothing else moves. */
      step(chain, grouped(LIT, LIT), 0),
      /* 2 — each pair fuses into one leg. */
      step(chain, fused(U, Vt), 0, SUM),
      /* 3 — one arrow, two legs: the components of the sum. */
      step(chain.concat([sum]), fused('ink', 'ink'), 1, SUM)
    ];

    return {
      update: function (k, f) {
        var st = V.at(states, k, f);
        /* The highlighted step lights the legs the highlighted terms name. */
        var lit = V.lit(api.hl(f > 0.5 ? k + 1 : k));
        st.legs.forEach(function (g) { if (lit(g.key)) g.tone = LIT; });
        st.notes.forEach(function (t) { if (lit(t.key)) t.tone = LIT; });
        p.set(st);
      }
    };
  });

  /* --------------------------------------------- a matrix is a function --- */
  /* One picture serves the whole run: the plane drawn twice, faintly where it
     started and brightly where the matrix has put it. The reader watches the
     same grid lines end up somewhere else, which is all "linear" means. */

  var A2 = [1.35, 0.75, 0.45, 1.15];        /* the worked matrix: a, b, c, d */
  function col1(m) { return [m[0], m[2]]; }
  function col2(m) { return [m[1], m[3]]; }
  function apply(m, v) { return A.phys.matVec(m[0], m[1], m[2], m[3], v); }
  function mul(m, n) {                       /* m after n */
    return [m[0] * n[0] + m[1] * n[2], m[0] * n[1] + m[1] * n[3],
            m[2] * n[0] + m[3] * n[2], m[2] * n[1] + m[3] * n[3]];
  }
  var EYE = [1, 0, 0, 1];

  function basisArrows(m, tone1, tone2) {
    var c1 = col1(m), c2 = col2(m);
    return [
      { key: 'e1', ox: 0, oy: 0, x: c1[0], y: c1[1], tone: tone1 || 'wave', width: 2.6 },
      { key: 'e2', ox: 0, oy: 0, x: c2[0], y: c2[1], tone: tone2 || 'quantum', width: 2.6 }
    ];
  }
  /* The unit square, carried wherever the map takes it: the area readout the
     determinant derivation later gives a number to. */
  function unitSquare(m, tone) {
    var c1 = col1(m), c2 = col2(m);
    return { key: 'sq', tone: tone || 'wave', op: 0.14,
             pts: [[0, 0], c1, [c1[0] + c2[0], c1[1] + c2[1]], c2] };
  }

  A.viz('la-linear-fixed-by-basis', function (root, api) {
    var v = [1.15, 0.95];
    var p = V.plane(root, {
      label: 'A vector built from the basis, and the same recipe applied after the map.',
      unit: 56, cx: 96, cy: 176
    });
    var lit = null;

    function state(m, showV, dimV) {
      var c1 = col1(m), c2 = col2(m);
      var a = [v[0] * c1[0], v[0] * c1[1]];               /* v₁ f(e₁) */
      var b = [a[0] + v[1] * c2[0], a[1] + v[1] * c2[1]]; /* + v₂ f(e₂) */
      return {
        grid: true, map: m, ghost: EYE, ghostOp: m === EYE ? 0 : 0.55,
        arrows: basisArrows(m).concat([
          { key: 'v', ox: 0, oy: 0, x: b[0], y: b[1], tone: 'ink', width: 3, op: showV }
        ]),
        legs: [
          { key: 'l1', x0: 0, y0: 0, x1: a[0], y1: a[1], tone: 'wave', op: dimV },
          { key: 'l2', x0: a[0], y0: a[1], x1: b[0], y1: b[1], tone: 'quantum', op: dimV }
        ],
        notes: [
          { key: 'n1', x: c1[0] * 0.6, y: c1[1] * 0.6, dy: 14, text: 'f(e₁)', tone: 'wave' },
          { key: 'n2', x: c2[0] * 0.6 - 0.3, y: c2[1] * 0.6, text: 'f(e₂)', tone: 'quantum' },
          { key: 'nv', x: b[0] * 0.52, y: b[1] * 0.52 + 0.28, text: 'f(v)', tone: 'ink', op: showV }
        ]
      };
    }

    var states = [
      state(EYE, 1, 1),      /* 0 — v built from the basis, nothing applied yet */
      state(A2, 1, 1),       /* 1 — f applied: the whole plane moves */
      state(A2, 1, 1),       /* 2 — the scalars come out front; the legs are those multiples */
      state(A2, 0.25, 0.3)   /* 3 — only the two images are left standing */
    ];
    return { update: function (k, f) {
      var st = V.at(states, k, f);
      lit = V.lit(api.hl(f > 0.5 ? k + 1 : k));
      if (lit('f')) st.arrows.forEach(function (a) { if (a.key !== 'v') a.tone = 'quantum'; });
      p.set(st);
    } };
  });

  A.viz('la-column-rule', function (root) {
    var v = [1.3, 0.85];
    var p = V.plane(root, {
      label: 'The two columns, each stretched by its own component, laid tip to tail.',
      unit: 66, cx: 40, cy: 214
    });
    var c1 = col1(A2), c2 = col2(A2);
    var a = [v[0] * c1[0], v[0] * c1[1]];
    var b = [a[0] + v[1] * c2[0], a[1] + v[1] * c2[1]];

    function st(stretch, chain, showSum) {
      var s1 = stretch ? a : c1;
      var s2end = chain ? b : [c2[0], c2[1]];
      return {
        grid: true, map: EYE,
        arrows: [
          { key: 'c1', ox: 0, oy: 0, x: s1[0], y: s1[1], tone: 'wave', width: 2.6 },
          { key: 'c2', ox: chain ? a[0] : 0, oy: chain ? a[1] : 0,
            x: chain ? b[0] : s2end[0] * (stretch ? v[1] : 1),
            y: chain ? b[1] : s2end[1] * (stretch ? v[1] : 1), tone: 'quantum', width: 2.6 },
          { key: 'r', ox: 0, oy: 0, x: b[0], y: b[1], tone: 'ink', width: 3, op: showSum }
        ],
        legs: showSum ? [
          { key: 'x', x0: 0, y0: 0, x1: b[0], y1: 0, tone: 'ink' },
          { key: 'y', x0: b[0], y0: 0, x1: b[0], y1: b[1], tone: 'ink' }
        ] : [],
        notes: [
          { key: 'a', x: s1[0] * 0.55, y: s1[1] * 0.55, dy: 15,
            text: stretch ? 'v₁ col₁' : 'col₁', tone: 'wave' },
          { key: 'b', x: (chain ? (a[0] + b[0]) / 2 : c2[0] * (stretch ? v[1] : 1) * 0.5),
            y: (chain ? (a[1] + b[1]) / 2 : c2[1] * (stretch ? v[1] : 1) * 0.5),
            dy: -8, anchor: 'end',
            text: stretch ? 'v₂ col₂' : 'col₂', tone: 'quantum' },
          { key: 'r', x: b[0] * 0.52 + 0.5, y: b[1] * 0.52 - 0.12, text: 'Av', tone: 'ink', op: showSum }
        ]
      };
    }
    var states = [st(false, false, 0), st(true, false, 0), st(true, true, 1)];
    return { update: function (k, f) { p.set(V.at(states, k, f)); } };
  });

  A.viz('la-compose', function (root) {
    var B2 = [0.9, -0.6, 0.5, 1.05];
    var BA = mul(B2, A2);
    var p = V.plane(root, {
      label: 'One basis arrow carried through two transformations in turn.',
      unit: 52, cx: 112, cy: 148
    });
    /* Each hop leaves the previous arrow behind, so the path is visible rather
       than only the destination. */
    function st(map, prev, label, show2, showPath) {
      var c1 = col1(map), pc1 = col1(prev);
      return {
        grid: true, map: map, ghost: prev, ghostOp: prev === map ? 0 : 0.7,
        arrows: [
          { key: 'e0', ox: 0, oy: 0, x: pc1[0], y: pc1[1], tone: 'ghost', width: 2.2, op: showPath * 0.9 },
          { key: 'e1', ox: 0, oy: 0, x: c1[0], y: c1[1], tone: 'wave', width: 3 },
          { key: 'e2', ox: 0, oy: 0, x: col2(map)[0], y: col2(map)[1], tone: 'quantum',
            width: 2.4, op: show2 }
        ],
        shade: [{ key: 'sq', tone: 'wave', op: 0.09,
                  pts: [[0, 0], c1, [c1[0] + col2(map)[0], c1[1] + col2(map)[1]], col2(map)] }],
        notes: [{ key: 'e1', x: c1[0] * 0.6, y: c1[1] * 0.6, dy: -9, text: label, tone: 'wave' }]
      };
    }
    var states = [
      st(EYE, EYE, 'e₁', 0.2, 0),        /* 0 — before anything */
      st(A2, EYE, 'A e₁', 0.2, 1),       /* 1 — A alone: e₁ is A's first column */
      st(BA, A2, 'B A e₁', 0.2, 1),      /* 2 — B acting on where A left it */
      st(BA, EYE, 'BA', 1, 0)            /* 3 — one hop that does both, both columns */
    ];
    return { update: function (k, f) { p.set(V.at(states, k, f)); } };
  });

  A.viz('la-rotation', function (root) {
    var th = 0.62;                                  /* about 35 degrees */
    var R = [Math.cos(th), -Math.sin(th), Math.sin(th), Math.cos(th)];
    var p = V.plane(root, {
      label: 'Each basis arrow turned, with its components read off the axes.',
      unit: 62, cx: 148, cy: 132
    });
    function arrowAt(key, ang, tone, w) {
      return { key: key, ox: 0, oy: 0, x: Math.cos(ang), y: Math.sin(ang), tone: tone, width: w || 2.6 };
    }
    function legsOf(ang, tone, on) {
      var x = Math.cos(ang), y = Math.sin(ang);
      return [
        { key: 'lx', x0: 0, y0: 0, x1: x, y1: 0, tone: tone, op: on },
        { key: 'ly', x0: x, y0: 0, x1: x, y1: y, tone: tone, op: on }
      ];
    }
    function st(a1, a2, gridMap, legAng, legTone, arcFrom, arcTo, xText, yText, legOp) {
      return {
        grid: true, map: gridMap, ghost: EYE, ghostOp: gridMap === EYE ? 0 : 0.5, circle: 1,
        arrows: [arrowAt('e1', a1, 'wave', 3), arrowAt('e2', a2, 'quantum', 2.6)],
        arcs: [{ key: 'a', r: 0.44, a0: arcFrom, a1: arcTo, tone: legTone }],
        legs: legsOf(legAng, legTone, legOp),
        notes: [
          { key: 'x', x: Math.cos(legAng) / 2, y: 0, dy: 15, text: xText, tone: legTone, op: legOp },
          { key: 'y', x: Math.cos(legAng) + (Math.cos(legAng) < 0 ? -0.06 : 0.06),
            y: Math.sin(legAng) / 2, text: yText, tone: legTone, op: legOp,
            anchor: Math.cos(legAng) < 0 ? 'end' : 'start' }
        ]
      };
    }
    var H = Math.PI / 2;
    var states = [
      /* 0 — e₁ where it starts: one unit along the axis, no turn yet. */
      st(0, H, EYE, 0, 'wave', 0, 0.001, '1', '0', 0),
      /* 1 — turned by θ: cosine across, sine up. That is what they mean. */
      st(th, H, EYE, th, 'wave', 0, th, 'cos θ', 'sin θ', 1),
      /* 2 — now the second arrow, still at a quarter turn. */
      st(th, H, EYE, H, 'quantum', 0, H, '', '1', 0.75),
      /* 3 — turned as well, so it lands past the vertical. */
      st(th, th + H, EYE, th + H, 'quantum', 0, th + H, '−sin θ', 'cos θ', 1),
      /* 4 — and the whole grid turns with them. */
      st(th, th + H, R, th + H, 'quantum', 0, th + H, '−sin θ', 'cos θ', 1)
    ];
    return { update: function (k, f) { p.set(V.at(states, k, f)); } };
  });

  /* --------------------------------------------- areas and independence --- */

  A.viz('la-dot-components', function (root, api) {
    var u = [1.95, 0.55], v = [0.7, 1.6];
    var p = V.plane(root, {
      label: 'The triangle the law of cosines is applied to, then the same triangle in coordinates.',
      unit: 46, cx: 34, cy: 196
    });
    var th0 = Math.atan2(u[1], u[0]), th1 = Math.atan2(v[1], v[0]);

    function st(grid, legs, tiles, arcOp) {
      return {
        grid: grid, map: EYE,
        arrows: [
          { key: 'u', ox: 0, oy: 0, x: u[0], y: u[1], tone: 'wave', width: 2.6 },
          { key: 'v', ox: 0, oy: 0, x: v[0], y: v[1], tone: 'quantum', width: 2.6 },
          { key: 'd', ox: v[0], oy: v[1], x: u[0], y: u[1], tone: 'ghost', width: 2 }
        ],
        arcs: [{ key: 'th', r: 0.5, a0: th0, a1: th1, tone: 'prob', op: arcOp }],
        legs: legs ? [
          { key: 'ux', x0: 0, y0: 0, x1: u[0], y1: 0, tone: 'wave' },
          { key: 'uy', x0: u[0], y0: 0, x1: u[0], y1: u[1], tone: 'wave' },
          { key: 'vx', x0: 0, y0: 0, x1: v[0], y1: 0, tone: 'quantum' },
          { key: 'vy', x0: v[0], y0: 0, x1: v[0], y1: v[1], tone: 'quantum' }
        ] : [],
        /* The two surviving products, drawn as the rectangles they are. */
        shade: tiles ? [
          { key: 't1', tone: 'wave', op: 0.3,
            pts: [[3.1, 0], [3.1 + u[0], 0], [3.1 + u[0], v[0]], [3.1, v[0]]] },
          { key: 't2', tone: 'quantum', op: 0.3,
            pts: [[3.1, v[0] + 0.22], [3.1 + u[1], v[0] + 0.22],
                  [3.1 + u[1], v[0] + 0.22 + v[1]], [3.1, v[0] + 0.22 + v[1]]] }
        ] : [],
        notes: [
          { key: 'u', x: u[0] * 0.55, y: u[1] * 0.55, dy: -8, text: 'u', tone: 'wave' },
          { key: 'v', x: v[0] * 0.5 - 0.22, y: v[1] * 0.5, text: 'v', tone: 'quantum' },
          { key: 'd', x: (u[0] + v[0]) / 2 + 0.15, y: (u[1] + v[1]) / 2 + 0.12, text: 'u−v', tone: 'ghost' },
          { key: 'th', x: Math.cos((th0 + th1) / 2) * 0.72, y: Math.sin((th0 + th1) / 2) * 0.72,
            text: 'θ', tone: 'prob', op: arcOp },
          { key: 'p1', x: 3.1 + u[0] / 2, y: v[0] / 2, text: 'u₁v₁', tone: 'wave', op: tiles ? 1 : 0 },
          { key: 'p2', x: 3.1 + u[1] / 2 + 0.35, y: v[0] + 0.22 + v[1] / 2, text: 'u₂v₂', tone: 'quantum', op: tiles ? 1 : 0 }
        ]
      };
    }
    var states = [
      st(false, false, false, 1),   /* 0 — pure geometry: three sides and the angle */
      st(false, false, false, 1),   /* 1 — the correction term renamed; the angle is the point */
      st(true, true, false, 0.4),   /* 2 — coordinates arrive */
      st(true, true, false, 0.2),   /* 3 — multiplied out */
      st(true, false, true, 0)      /* 4 — everything squared cancels; two products survive */
    ];
    return { update: function (k, f) {
      var st2 = V.at(states, k, f);
      var lit = V.lit(api.hl(f > 0.5 ? k + 1 : k));
      st2.arcs.forEach(function (a) { if (lit(a.key)) a.tone = 'quantum'; });
      p.set(st2);
    } };
  });

  A.viz('la-det-area', function (root) {
    var a = 1.75, c = 0.42, b = 0.55, d = 1.42;
    var p = V.plane(root, {
      label: 'The parallelogram cut out of the rectangle that encloses it.',
      unit: 74, cx: 44, cy: 216, axes: false
    });
    var W2 = a + b, H2 = c + d;
    /* Six pieces: two triangles of area ac/2, two of bd/2, two rectangles bc.
       Together they are exactly what the rectangle has that the parallelogram
       does not, which is why ad − bc is what is left. */
    function pieces(op) {
      return [
        { key: 'ac1', tone: 'wave', op: op, pts: [[0, 0], [a, 0], [a, c]] },
        { key: 'ac2', tone: 'wave', op: op, pts: [[b, d], [b, H2], [W2, H2]] },
        { key: 'bd1', tone: 'quantum', op: op, pts: [[0, 0], [0, d], [b, d]] },
        { key: 'bd2', tone: 'quantum', op: op, pts: [[a, c], [W2, c], [W2, H2]] },
        { key: 'bc1', tone: 'prob', op: op, pts: [[a, 0], [W2, 0], [W2, c], [a, c]] },
        { key: 'bc2', tone: 'prob', op: op, pts: [[0, d], [b, d], [b, H2], [0, H2]] }
      ];
    }
    var para = { key: 'par', tone: 'ink', op: 0.2, pts: [[0, 0], [a, c], [W2, H2], [b, d]] };
    var rect = { key: 'rect', x0: 0, y0: 0, x1: W2, y1: 0, tone: 'ghost' };
    function box(op) {
      return [
        { key: 'r1', x0: 0, y0: 0, x1: W2, y1: 0, tone: 'ghost', op: op },
        { key: 'r2', x0: W2, y0: 0, x1: W2, y1: H2, tone: 'ghost', op: op },
        { key: 'r3', x0: W2, y0: H2, x1: 0, y1: H2, tone: 'ghost', op: op },
        { key: 'r4', x0: 0, y0: H2, x1: 0, y1: 0, tone: 'ghost', op: op }
      ];
    }
    function st(pieceOp, paraOp, boxOp, label) {
      return {
        grid: false, map: EYE,
        shade: pieces(pieceOp).concat([{ key: 'par', tone: 'ink', op: paraOp, pts: para.pts }]),
        legs: box(boxOp),
        arrows: [
          { key: 'c1', ox: 0, oy: 0, x: a, y: c, tone: 'wave', width: 2.6 },
          { key: 'c2', ox: 0, oy: 0, x: b, y: d, tone: 'quantum', width: 2.6 }
        ],
        notes: [
          { key: 'w', x: W2 / 2, y: 0, dy: 15, text: 'a + b', tone: 'ghost', op: boxOp },
          { key: 'h', x: W2 + 0.08, y: H2 / 2, text: 'c + d', tone: 'ghost', op: boxOp, anchor: 'start' },
          { key: 'lab', x: (a + b) * 0.5, y: (c + d) * 0.52, text: label, tone: 'ink', op: paraOp > 0.15 ? 1 : 0 }
        ]
      };
    }
    var states = [
      st(0, 0.2, 1, ''),           /* 0 — the enclosing rectangle and what is inside it */
      st(0.26, 0.2, 1, ''),        /* 1 — the six leftover pieces, sorted by kind */
      st(0.26, 0.2, 1, ''),        /* 2 — multiplied out; nothing moves */
      st(0, 0.3, 0.25, 'ad − bc')  /* 3 — the pieces cancel; the parallelogram is what is left */
    ];
    void rect;
    return { update: function (k, f) { p.set(V.at(states, k, f)); } };
  });

  A.viz('la-independence', function (root) {
    var p = V.plane(root, {
      label: 'Two columns falling parallel, and the plane collapsing onto a line with them.',
      unit: 54, cx: 60, cy: 178
    });
    /* Independent to start, then swung parallel: the determinant runs to zero
       and takes the whole plane with it. */
    var M0 = [1.5, 0.55, 0.35, 1.35];
    var M1 = [1.5, 0.75, 0.35, 0.175];      /* second column parallel to the first */
    function st(m, comboOp, label) {
      var c1 = col1(m), c2 = col2(m);
      return {
        grid: true, map: m, ghost: EYE, ghostOp: 0.35,
        arrows: [
          { key: 'c1', ox: 0, oy: 0, x: c1[0], y: c1[1], tone: 'wave', width: 2.6 },
          { key: 'c2', ox: 0, oy: 0, x: c2[0], y: c2[1], tone: 'quantum', width: 2.6 },
          /* The combination that is trying to cancel: c₁ times one column plus
             c₂ times the other. When the columns are parallel it can reach the
             origin without both numbers being zero. */
          { key: 'k', ox: 0, oy: 0,
            x: 1.2 * c1[0] - 1.6 * c2[0], y: 1.2 * c1[1] - 1.6 * c2[1],
            tone: 'ink', width: 3, op: comboOp }
        ],
        shade: [unitSquare(m, 'prob')],
        notes: [
          { key: 'k', x: (1.2 * c1[0] - 1.6 * c2[0]) * 0.62 - 0.15,
            y: (1.2 * c1[1] - 1.6 * c2[1]) * 0.62 - 0.3, text: 'c₁col₁ + c₂col₂',
            tone: 'ink', op: comboOp },
          { key: 'd', x: 2.6, y: 1.6, text: label, tone: 'prob' }
        ]
      };
    }
    var states = [
      st(M0, 1, 'det ≠ 0'),
      st(M0, 1, 'det ≠ 0'),
      st(M0, 1, 'det ≠ 0'),
      st([1.5, 0.68, 0.35, 0.5], 1, 'det → 0'),
      st(M1, 1, 'det = 0')       /* 4 — parallel columns, flattened plane, zero area */
    ];
    return { update: function (k, f) { p.set(V.at(states, k, f)); } };
  });

  /* ------------------------------------------------- eigenvalues, found --- */

  var AS = [2, 1, 1, 2];                        /* the worked symmetric matrix */
  var EV = A.phys.eig2(AS[0], AS[1], AS[2], AS[3]);

  A.viz('la-eigen-check', function (root) {
    var panes = V.split(root, 2, [0.32, 1]);
    /* A look ahead to §2.2: these two directions are the two ways a pair of
       coupled masses can move, and the eigenvector is the shape of the motion.
       Drawn here so the reader meets the object before the algebra names it. */
    var bn = V.bench(panes[0], {
      label: 'The two masses whose modes these directions are.',
      w: 320, h: 62, n: 2, box: 15, scale: 26
    });
    var p = V.plane(panes[1], {
      label: 'Two directions this matrix only stretches, built one column at a time.',
      w: 320, h: 164, unit: 23, cx: 66, cy: 82
    });
    function build(v, chained, showImage, rays) {
      var c1 = col1(AS), c2 = col2(AS);
      var a = [v[0] * c1[0], v[0] * c1[1]];
      var im = apply(AS, v);
      return {
        grid: true, map: EYE, circle: 0,
        arrows: [
          { key: 'v', ox: 0, oy: 0, x: v[0], y: v[1], tone: 'wave', width: 3 },
          { key: 'p1', ox: 0, oy: 0, x: a[0], y: a[1], tone: 'quantum', width: 2, op: chained },
          { key: 'p2', ox: a[0], oy: a[1], x: im[0], y: im[1], tone: 'quantum', width: 2, op: chained },
          { key: 'im', ox: 0, oy: 0, x: im[0], y: im[1], tone: 'prob', width: 2.6, op: showImage }
        ],
        rays: rays ? [
          { key: 'r1', x: EV.vec[0][0], y: EV.vec[0][1], tone: 'prob', op: 0.55 },
          { key: 'r2', x: EV.vec[1][0], y: EV.vec[1][1], tone: 'prob', op: 0.55 }
        ] : [],
        notes: [
          { key: 'v', x: v[0] * 0.5 - 0.35, y: v[1] * 0.5, text: 'v', tone: 'wave' },
          { key: 'im', x: im[0] * 0.72 + 0.45, y: im[1] * 0.72, text: 'A v', tone: 'prob', op: showImage },
          { key: 'lab', x: 2.9, y: -2.35, text: showImage ? 'same direction' : '', tone: 'prob', op: showImage }
        ]
      };
    }
    var states = [
      build([1, 1], 1, 0, false),      /* 0 — one lot of each column, chained */
      build([1, 1], 0.35, 1, false),   /* 1 — lands at three times the arrow, no turn */
      build([1, -1], 1, 0, false),     /* 2 — now the other direction */
      build([1, -1], 0.35, 1, true)    /* 3 — unchanged; both directions marked */
    ];
    /* Which mode the bench runs is decided by the step: the first pair of
       steps is the (1,1) direction, the second pair the (1,−1) one. */
    var modes = [[1, 1], [1, 1], [1, -1], [1, -1]];
    return {
      animates: true,
      update: function (k, f, t) {
        p.set(V.at(states, k, f));
        var m = modes[M.clamp(f > 0.5 ? k + 1 : k, 0, 3)];
        var a = Math.cos(t * (m[1] > 0 ? 0.9 : 1.6));
        bn.set({
          x: [m[0] * a, m[1] * a],
          slack: m[1] > 0 ? [1] : [],
          notes: [{ key: 'l', cap: true, text: m[1] > 0 ? 'together' : 'opposed', tone: 'ghost' }]
        });
      }
    };
  });

  A.viz('la-shift', function (root) {
    var panes = V.split(root, 2, [1.05, 1]);
    var lam = 3, v = [1, 1];
    var pl = V.plane(panes[0], {
      label: 'The eigenvalue equation as a difference that has to reach the origin.',
      w: 320, h: 118, unit: 21, cx: 66, cy: 88
    });
    var pg = V.plane(panes[1], {
      label: 'The shifted matrix flattening the plane.',
      w: 320, h: 118, unit: 22, cx: 152, cy: 60
    });
    var im = apply(AS, v);
    function shifted(t) {
      var l = lam * t;
      return [AS[0] - l, AS[1], AS[2], AS[3] - l];
    }
    function left(flip, resid) {
      return {
        grid: false, map: EYE,
        arrows: [
          { key: 'av', ox: 0, oy: 0, x: im[0], y: im[1], tone: 'wave', width: 2.6 },
          { key: 'lv', ox: flip ? im[0] : 0, oy: flip ? im[1] : 0,
            x: flip ? im[0] - lam * v[0] : lam * v[0],
            y: flip ? im[1] - lam * v[1] : lam * v[1], tone: 'quantum', width: 2.6 },
          { key: 'r', ox: 0, oy: 0, x: im[0] - lam * v[0] * resid, y: im[1] - lam * v[1] * resid,
            tone: 'prob', width: 3, op: flip }
        ],
        notes: [
          { key: 'a', x: im[0] * 0.5 - 0.6, y: im[1] * 0.5 + 0.5, text: 'A v', tone: 'wave' },
          { key: 'l', x: flip ? im[0] - lam * v[0] * 0.5 + 0.7 : lam * v[0] * 0.5 + 0.8,
            y: flip ? im[1] - lam * v[1] * 0.5 : lam * v[1] * 0.5 - 0.6,
            text: 'λv', tone: 'quantum' }
        ]
      };
    }
    function right(t) {
      var m = shifted(t);
      return {
        grid: true, map: m, ghost: EYE, ghostOp: 0.3,
        shade: [unitSquare(m, 'prob')],
        arrows: [
          { key: 'c1', ox: 0, oy: 0, x: col1(m)[0], y: col1(m)[1], tone: 'wave', width: 2.2 },
          { key: 'c2', ox: 0, oy: 0, x: col2(m)[0], y: col2(m)[1], tone: 'quantum', width: 2.2 }
        ],
        notes: [{ key: 'l', x: 0, y: -2.1, text: t < 0.05 ? 'A' : 'A − λI', tone: 'ghost' }]
      };
    }
    var L = [left(0, 0), left(1, 0.5), left(1, 1), left(1, 1)];
    var R = [right(0), right(0), right(0.5), right(1)];
    return { update: function (k, f) { pl.set(V.at(L, k, f)); pg.set(V.at(R, k, f)); } };
  });

  /* The determinant of the shifted matrix, as a curve in λ. It is the same
     number the grid on the right is showing as an area, plotted against the
     shift — so the two zeros of the curve are the two flattenings. */
  function parabolaViz(root, opts) {
    var tr = opts.trace, de = opts.det;
    var l0 = opts.l0, l1 = opts.l1;
    var c = V.curves(root, {
      label: 'The determinant of the shifted matrix, plotted against the shift.',
      w: opts.w || 320, h: opts.h || 240, x0: l0, x1: l1,
      ranges: [opts.range || [-1.6, 3.2]], xLabel: 'λ'
    });
    function poly(x) { return x * x - tr * x + de; }
    var flat = V.samp(function () { return 0; }, l0, l1);
    var curve = V.samp(poly, l0, l1);
    function mix(t) { return curve.map(function (y, i) { return flat[i] + (y - flat[i]) * t; }); }
    return { c: c, poly: poly, mix: mix, curve: curve };
  }

  A.viz('la-char-poly', function (root) {
    var q = parabolaViz(root, { trace: 4, det: 3, l0: 0.15, l1: 3.85, range: [-1.15, 1.5] });
    var r1 = 1, r2 = 3;
    function st(t, roots, marks) {
      return {
        curves: [{ key: 'p', pts: q.mix(t), tone: 'wave', width: 2.2 }],
        marks: [
          { key: 'z', kind: 'hline', y: 0, tone: 'ghost' },
          { key: 'r1', kind: 'dot', x: r1, y: 0, tone: 'quantum', op: roots },
          { key: 'r2', kind: 'dot', x: r2, y: 0, tone: 'quantum', op: roots },
          { key: 'd0', kind: 'dot', x: 0, y: 3 * t, tone: 'prob', op: marks }
        ],
        notes: [
          { key: 'd', x: 0.28, y: 3 * t, dy: -8, text: 'det A', tone: 'prob', op: marks, anchor: 'start' },
          { key: 'r1', x: r1, y: 0, dy: 16, text: 'λ₁', tone: 'quantum', op: roots },
          { key: 'r2', x: r2, y: 0, dy: 16, text: 'λ₂', tone: 'quantum', op: roots }
        ]
      };
    }
    /* Steps 1 and 2 are pure algebra, so the curve holds: it draws itself as
       the determinant is taken, and only names its roots at the end. */
    var states = [st(0, 0, 0), st(0.55, 0, 0), st(1, 0, 0), st(1, 1, 1)];
    return { update: function (k, f) { q.c.set(V.at(states, k, f)); } };
  });

  A.viz('la-back-solve', function (root) {
    var panes = V.split(root, 2, [1, 1.15]);
    var q = parabolaViz(panes[0], { trace: 4, det: 3, l0: 0.2, l1: 3.8, w: 320, h: 112,
                                    range: [-1.15, 1.2] });
    var pg = V.plane(panes[1], {
      label: 'The shifted matrix crushing the plane onto the line its eigenvectors lie on.',
      w: 320, h: 118, unit: 26, cx: 158, cy: 58
    });
    function top(roots, pick) {
      return {
        curves: [{ key: 'p', pts: q.curve, tone: 'wave', width: 2.2 }],
        marks: [
          { key: 'z', kind: 'hline', y: 0, tone: 'ghost' },
          { key: 'r1', kind: 'dot', x: 1, y: 0, tone: 'quantum', op: roots },
          { key: 'r2', kind: 'dot', x: 3, y: 0, tone: 'quantum', op: roots, r: 3.2 + pick * 1.6 }
        ],
        notes: [
          { key: 'r1', x: 1, y: 0, dy: 15, text: 'λ = 1', tone: 'quantum', op: roots },
          { key: 'r2', x: 3, y: 0, dy: 15, text: 'λ = 3', tone: 'quantum', op: roots }
        ]
      };
    }
    function bottom(t, lineOp, dotOp) {
      var m = [AS[0] - 3 * t, AS[1], AS[2], AS[3] - 3 * t];
      return {
        grid: true, map: m, gridOp: 1 - 0.75 * lineOp, ghost: EYE, ghostOp: 0.28,
        rays: [{ key: 'sol', x: 1, y: 1, tone: 'prob', op: lineOp }],
        arrows: [{ key: 'v', ox: 0, oy: 0, x: 1, y: 1, tone: 'ink', width: 3, op: dotOp }],
        dots: [
          { key: 'd1', x: 0.45, y: 0.45, tone: 'prob', op: lineOp },
          { key: 'd2', x: 1.7, y: 1.7, tone: 'prob', op: lineOp }
        ],
        notes: [
          { key: 'eq', x: 3.1, y: -1.35, text: lineOp ? 'v₂ = v₁' : '', tone: 'prob', op: lineOp },
          { key: 'v', x: 1.55, y: 0.75, text: '(1, 1)', tone: 'ink', op: dotOp }
        ]
      };
    }
    var T = [top(0, 0), top(1, 0), top(1, 1), top(1, 1), top(1, 1)];
    var B = [bottom(0, 0, 0), bottom(0, 0, 0), bottom(1, 0, 0), bottom(1, 1, 0), bottom(1, 1, 1)];
    return { update: function (k, f) { q.c.set(V.at(T, k, f)); pg.set(V.at(B, k, f)); } };
  });

  /* ------------------------------------------------- symmetric matrices --- */

  A.viz('la-sym-real', function (root) {
    var panes = V.split(root, 2, [1, 1]);
    /* Top: the roots stay on the axis however the entries move. Bottom: why —
       the discriminant is a square plus a square, and neither can be negative. */
    var a = 2.2, d = 0.9, b = 0.85;
    var tr = a + d, de = a * d - b * b;
    var q = parabolaViz(panes[0], { trace: tr, det: de, l0: 0.05, l1: 3.3, w: 320, h: 112,
                                    range: [-1.0, 1.1] });
    var sq = V.plane(panes[1], {
      label: 'The discriminant as one square plus another, so it can never be negative.',
      w: 320, h: 118, unit: 30, cx: 28, cy: 100, axes: false
    });
    var disc = Math.sqrt(tr * tr - 4 * de);
    var s1 = Math.abs(a - d), s2 = 2 * b;

    function squares(split, label) {
      /* Before the rearrangement it is one lump; after it, two honest squares
         standing side by side. */
      var w0 = Math.sqrt(s1 * s1 + s2 * s2);
      var A1 = split ? s1 : w0, A2 = split ? s2 : 0;
      return {
        grid: false, map: EYE,
        shade: [
          { key: 'q1', tone: 'wave', op: 0.28, pts: [[0, 0], [A1, 0], [A1, A1], [0, A1]] },
          { key: 'q2', tone: 'quantum', op: 0.28,
            pts: [[A1 + 0.14, 0], [A1 + 0.14 + A2, 0], [A1 + 0.14 + A2, A2], [A1 + 0.14, A2]] }
        ],
        notes: [
          { key: 'l1', x: A1 / 2, y: A1 / 2, text: split ? '(a−d)²' : '', tone: 'wave' },
          { key: 'l2', x: A1 + 0.14 + A2 / 2, y: A2 / 2, text: split ? '(2b)²' : '', tone: 'quantum', op: split },
          { key: 'sum', cap: true, text: label, tone: 'ghost' }
        ]
      };
    }
    var T = [0, 1, 1, 1, 1].map(function (roots) {
      return {
        curves: [{ key: 'p', pts: q.curve, tone: 'wave', width: 2.2 }],
        marks: [
          { key: 'z', kind: 'hline', y: 0, tone: 'ghost' },
          { key: 'r1', kind: 'dot', x: (tr - disc) / 2, y: 0, tone: 'quantum', op: roots },
          { key: 'r2', kind: 'dot', x: (tr + disc) / 2, y: 0, tone: 'quantum', op: roots }
        ],
        notes: [{ key: 'r', cap: true, text: roots ? 'both roots real' : '',
                  tone: 'quantum', op: roots }]
      };
    });
    var B = [
      squares(0, ''), squares(0, 'discriminant'), squares(0, 'discriminant'),
      squares(1, ''), squares(1, 'a square plus a square')
    ];
    return { update: function (k, f) { q.c.set(V.at(T, k, f)); sq.set(V.at(B, k, f)); } };
  });

  A.viz('la-sym-swap', function (root) {
    /* Four tiles, one per term. The claim is that swapping which vector the
       matrix acts on leaves the same four tiles — and the only two that could
       tell them apart are the middle pair, which simply trade places. */
    var p = V.plane(root, {
      label: 'The four terms as tiles; the middle two trade places and nothing else changes.',
      unit: 62, cx: 30, cy: 200, axes: false
    });
    var w = 1.85, h = 0.95, gap = 0.2;
    var TXT = ['a u₁v₁', 'b u₁v₂', 'b u₂v₁', 'd u₂v₂'];
    var TONE = ['wave', 'quantum', 'prob', 'wave'];
    function tile(i, slot, op) {
      var col = slot % 2, row = slot > 1 ? 0 : 1;
      var x = col * (w + gap), y = row * (h + gap);
      return { key: 't' + i, tone: TONE[i], op: op == null ? 0.24 : op,
               pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]] };
    }
    function label(i, slot, op) {
      var col = slot % 2, row = slot > 1 ? 0 : 1;
      return { key: 'l' + i, tone: TONE[i], op: op == null ? 1 : op,
               x: col * (w + gap) + w / 2, y: row * (h + gap) + h / 2 - 0.06, text: TXT[i] };
    }
    function st(order, side, on) {
      var sh = [], no = [];
      order.forEach(function (tileIndex, slot) {
        sh.push(tile(tileIndex, slot, on * 0.24));
        no.push(label(tileIndex, slot, on));
      });
      no.push({ key: 'side', x: (w * 2 + gap) / 2, y: -0.38, text: side, tone: 'ink' });
      return { grid: false, map: EYE, shade: sh, notes: no };
    }
    var states = [
      st([0, 1, 2, 3], 'u · (A v)', 0.35),   /* 0 — written out, not yet multiplied */
      st([0, 1, 2, 3], 'u · (A v)', 1),      /* 1 — the four terms */
      st([0, 2, 1, 3], 'u · (A v)', 1),      /* 2 — the middle two trade places */
      st([0, 2, 1, 3], '(A u) · v', 1)       /* 3 — which is the matrix acting on the other one */
    ];
    return { update: function (k, f) { p.set(V.at(states, k, f)); } };
  });

  A.viz('la-sym-orthogonal', function (root) {
    var p = V.plane(root, {
      label: 'Two eigen-directions forced to a right angle.',
      unit: 40, cx: 152, cy: 118
    });
    var u = EV.vec[0], v = EV.vec[1];
    var l1 = EV.lambda[0], l2 = EV.lambda[1];
    function st(scaled, rightAngle, dotLabel) {
      return {
        grid: true, map: EYE,
        rays: [
          { key: 'r1', x: u[0], y: u[1], tone: 'ghost' },
          { key: 'r2', x: v[0], y: v[1], tone: 'ghost' }
        ],
        arrows: [
          { key: 'u', ox: 0, oy: 0, x: u[0] * 1.4, y: u[1] * 1.4, tone: 'wave', width: 2.6 },
          { key: 'v', ox: 0, oy: 0, x: v[0] * 1.4, y: v[1] * 1.4, tone: 'quantum', width: 2.6 },
          { key: 'Au', ox: 0, oy: 0, x: u[0] * 1.4 * (1 + (l1 - 1) * scaled),
            y: u[1] * 1.4 * (1 + (l1 - 1) * scaled), tone: 'prob', width: 2, op: scaled },
          { key: 'Av', ox: 0, oy: 0, x: v[0] * 1.4 * (1 + (l2 - 1) * scaled),
            y: v[1] * 1.4 * (1 + (l2 - 1) * scaled), tone: 'prob', width: 2, op: scaled }
        ],
        marks: [{ key: 'ra', kind: 'right', x: 0, y: 0,
                  a0: Math.atan2(u[1], u[0]), a1: Math.atan2(v[1], v[0]),
                  s: 11, tone: 'prob', op: rightAngle }],
        notes: [
          { key: 'u', x: u[0] * 2.1, y: u[1] * 2.1, text: 'u', tone: 'wave' },
          { key: 'v', x: v[0] * 2.1, y: v[1] * 2.1, text: 'v', tone: 'quantum' },
          { key: 'l1', x: u[0] * 1.4 * l1 + 0.55, y: u[1] * 1.4 * l1, text: 'λ₁u',
            tone: 'prob', op: scaled },
          { key: 'dot', x: 0, y: -2.3, text: dotLabel, tone: 'ink' }
        ]
      };
    }
    var states = [
      st(0, 0, 'u · v = ?'),
      st(1, 0, 'u · v = ?'),
      st(1, 0, 'λ₁ (u · v) = λ₂ (u · v)'),
      st(1, 0, '(λ₁ − λ₂)(u · v) = 0'),
      st(1, 1, 'u · v = 0')       /* 4 — different stretches, so the dot product dies */
    ];
    return { update: function (k, f) { p.set(V.at(states, k, f)); } };
  });

  /* --------------------------------------- working in the eigen-basis ----- */

  A.viz('la-AP-PD', function (root) {
    var p = V.plane(root, {
      label: 'The same matrix seen on its own eigenvector axes, where it is two stretches.',
      unit: 34, cx: 158, cy: 122
    });
    var u = EV.vec[0], v = EV.vec[1], l1 = EV.lambda[0], l2 = EV.lambda[1];
    var P = [u[0], v[0], u[1], v[1]];
    var AP = mul(AS, P);
    function st(map, stretched, bars) {
      return {
        grid: true, map: map, ghost: EYE, ghostOp: 0.3,
        rays: [
          { key: 'r1', x: u[0], y: u[1], tone: 'ghost' },
          { key: 'r2', x: v[0], y: v[1], tone: 'ghost' }
        ],
        arrows: [
          { key: 'p1', ox: 0, oy: 0, x: col1(map)[0], y: col1(map)[1], tone: 'wave', width: 2.8 },
          { key: 'p2', ox: 0, oy: 0, x: col2(map)[0], y: col2(map)[1], tone: 'quantum', width: 2.8 }
        ],
        notes: [
          { key: 'l1', x: col1(map)[0] * 0.62 + 0.5, y: col1(map)[1] * 0.62,
            text: stretched ? 'λ₁ = 3' : 'u', tone: 'wave' },
          { key: 'l2', x: col2(map)[0] * 0.62 - 0.5, y: col2(map)[1] * 0.62,
            text: stretched ? 'λ₂ = 1' : 'v', tone: 'quantum' },
          { key: 'd', x: 0, y: -2.5, text: bars ? 'two stretches, no turning' : '',
            tone: 'ghost', op: bars }
        ]
      };
    }
    void l1; void l2;
    var states = [st(P, 0, 0), st(AP, 1, 0), st(AP, 1, 1), st(AP, 1, 1)];
    return { update: function (k, f) { p.set(V.at(states, k, f)); } };
  });

  A.viz('la-inverse-2x2', function (root) {
    var p = V.plane(root, {
      label: 'A transformation and the one that puts the grid back.',
      unit: 44, cx: 150, cy: 128
    });
    var det = A.phys.det2(A2[0], A2[1], A2[2], A2[3]);
    var INV = [A2[3] / det, -A2[1] / det, -A2[2] / det, A2[0] / det];
    /* The candidate: swap the diagonal, negate the off-diagonal, divide by the
       determinant. Applied after A it should bring every line home. */
    function st(map, ghost, label, sq) {
      return {
        grid: true, map: map, ghost: ghost, ghostOp: ghost === map ? 0 : 0.4,
        shade: [unitSquare(map, sq)],
        arrows: [
          { key: 'c1', ox: 0, oy: 0, x: col1(map)[0], y: col1(map)[1], tone: 'wave', width: 2.6 },
          { key: 'c2', ox: 0, oy: 0, x: col2(map)[0], y: col2(map)[1], tone: 'quantum', width: 2.6 }
        ],
        notes: [{ key: 'l', x: 0, y: -2.35, text: label, tone: 'ghost' }]
      };
    }
    var states = [
      st(A2, EYE, 'A', 'wave'),
      st(A2, EYE, 'A', 'wave'),
      st(mul(INV, A2), A2, 'B A', 'prob'),
      st(EYE, EYE, 'B A = I — the grid is home', 'prob')
    ];
    return { update: function (k, f) { p.set(V.at(states, k, f)); } };
  });

  A.viz('la-diagonal-evolution', function (root) {
    var panes = V.split(root, 2, [1.15, 1]);
    var u = EV.vec[0], v = EV.vec[1];
    var pl = V.plane(panes[0], {
      label: 'A trajectory that is tangled on the ordinary axes and straight on the eigen-axes.',
      w: 320, h: 122, unit: 50, cx: 26, cy: 62
    });
    var cu = V.curves(panes[1], {
      label: 'The same motion in eigen-coordinates: two independent exponentials.',
      w: 320, h: 112, x0: 0, x1: 1, ranges: [[-0.12, 1.75]], xLabel: 't'
    });
    /* q₁ grows, q₂ decays: the two eigen-coordinates never mix, which is the
       whole point of changing basis. */
    var q1 = V.samp(function (t) { return 0.12 * Math.exp(2.4 * t); }, 0, 1);
    var q2 = V.samp(function (t) { return 1.6 * Math.exp(-2.6 * t); }, 0, 1);
    var flat = V.samp(function () { return 0; }, 0, 1);

    /* The path in the plane, from the same two coordinates. */
    var path = [];
    for (var i = 0; i <= 40; i++) {
      var t = i / 40;
      var a = 0.12 * Math.exp(2.4 * t), b = 1.6 * Math.exp(-2.6 * t);
      path.push([a * u[0] + b * v[0], a * u[1] + b * v[1]]);
    }
    function tail(n) { return path.slice(0, Math.max(2, n)); }

    function left(axesOn, n, coords) {
      var end = path[Math.max(1, n) - 1];
      return {
        grid: true, map: EYE,
        rays: axesOn ? [
          { key: 'r1', x: u[0], y: u[1], tone: 'prob' },
          { key: 'r2', x: v[0], y: v[1], tone: 'prob' }
        ] : [],
        shade: [{ key: 'path', tone: 'wave', op: 0 , pts: tail(n) }],
        legs: tail(n).slice(1).map(function (pt, j) {
          return { key: 'p' + j, x0: tail(n)[j][0], y0: tail(n)[j][1], x1: pt[0], y1: pt[1],
                   tone: 'wave', op: 1 };
        }).map(function (g) { g.tone = 'wave'; return g; }),
        arrows: coords ? [
          { key: 'q1', ox: 0, oy: 0, x: u[0] * 1.1, y: u[1] * 1.1, tone: 'quantum', width: 2 },
          { key: 'q2', ox: 0, oy: 0, x: v[0] * 0.8, y: v[1] * 0.8, tone: 'quantum', width: 2 }
        ] : [],
        dots: [{ key: 'now', x: end[0], y: end[1], tone: 'ink', r: 3.6 }],
        notes: [{ key: 'q', x: u[0] * 1.6, y: u[1] * 1.6 + 0.2, text: coords ? 'q₁' : '', tone: 'quantum', op: coords }]
      };
    }
    function right(on) {
      return {
        curves: [
          { key: 'q1', pts: flat.map(function (y, i) { return y + (q1[i] - y) * on; }), tone: 'wave', width: 2.2 },
          { key: 'q2', pts: flat.map(function (y, i) { return y + (q2[i] - y) * on; }), tone: 'quantum', width: 2.2 }
        ],
        notes: [
          { key: 'a', x: 0.88, y: 1.45, text: 'q₁', tone: 'wave', op: on },
          { key: 'b', x: 0.9, y: 0.16, text: 'q₂', tone: 'quantum', op: on }
        ]
      };
    }
    var L = [left(false, 40, 0), left(true, 40, 1), left(true, 40, 1), left(true, 40, 0), left(true, 40, 0)];
    var R = [right(0), right(0), right(0), right(0.55), right(1)];
    return { update: function (k, f) { pl.set(V.at(L, k, f)); cu.set(V.at(R, k, f)); } };
  });

  /* ------------------------------------------------- functions as vectors -- */

  A.viz('la-riemann-inner', function (root) {
    var TAU = Math.PI * 2;
    var c = V.curves(root, {
      label: 'Two functions sampled, multiplied entry by entry, and the sum turned into an area.',
      rows: 2, x0: 0, x1: TAU, ranges: [[-1.15, 1.15], [-1.15, 1.15]], xLabel: 'x'
    });
    function f(x) { return Math.sin(x); }
    function g(x) { return Math.sin(2 * x) * 0.9; }
    var F = V.samp(f, 0, TAU), G = V.samp(g, 0, TAU);
    var PROD = V.samp(function (x) { return f(x) * g(x); }, 0, TAU);

    /* Bars at N sample points: the dot product of two lists. Widening them to
       the spacing is the step that turns a sum into an area. */
    function bars(N, width, op) {
      var out = [];
      for (var i = 0; i < N; i++) {
        var x = TAU * (i + 0.5) / N;
        out.push({ key: 'b' + i, row: 1, x: x, y: f(x) * g(x), w: width * TAU / N,
                   tone: f(x) * g(x) >= 0 ? 'wave' : 'fail', op: op });
      }
      return out;
    }
    function st(N, width, barOp, areaOp, label) {
      return {
        curves: [
          { key: 'f', pts: F, tone: 'wave', width: 2 },
          { key: 'g', pts: G, tone: 'quantum', width: 2 },
          { key: 'p', pts: PROD, row: 1, tone: 'ink', width: 1.8, op: 0.8 }
        ],
        bars: bars(N, width, barOp),
        fills: areaOp ? [{ key: 'ar', row: 1, pts: PROD, split: true, tone: 'wave',
                           negTone: 'fail', op: areaOp * 0.3 }] : [],
        notes: [
          { key: 'f', x: 1.3, y: 0.92, text: 'f', tone: 'wave' },
          { key: 'g', x: 0.55, y: 0.86, text: 'g', tone: 'quantum' },
          { key: 'n', cap: true, text: label, tone: 'ghost' }
        ]
      };
    }
    var states = [
      st(8, 0.22, 1, 0, 'N terms, added'),
      st(20, 0.5, 1, 0, 'each times the spacing Δx'),
      st(48, 1, 0.35, 1, 'the area under f g')
    ];
    return { update: function (k, f2) { c.set(V.at(states, k, f2)); } };
  });

  /* Two sines multiplied. The positive and negative lobes are shaded apart and
     a running total is drawn, so the cancellation is watched rather than
     asserted — and when the two frequencies match, the shading goes all one
     colour and the total climbs instead. */
  function productViz(root, fA, fB, label) {
    var TAU = Math.PI * 2;
    var c = V.curves(root, {
      label: label, rows: 2, x0: 0, x1: TAU,
      ranges: [[-1.2, 1.2], [-1.15, 1.15]], xLabel: 'x'
    });
    function running(prod) {
      var out = [], acc = 0, n = prod.length - 1, dx = TAU / n;
      for (var i = 0; i <= n; i++) {
        if (i) acc += (prod[i] + prod[i - 1]) / 2 * dx;
        out.push(acc / Math.PI);
      }
      return out;
    }
    return { c: c, running: running, TAU: TAU,
             s: function (fn) { return V.samp(fn, 0, TAU); } };
  }

  A.viz('la-sin-sin', function (root) {
    var q = productViz(root, null, null, 'Two sines multiplied: the lobes cancel, unless the frequencies match.');
    var TAU = q.TAU;
    function pair(n, m) {
      var A1 = q.s(function (x) { return Math.sin(n * x); });
      var B1 = q.s(function (x) { return Math.sin(m * x); });
      var P1 = q.s(function (x) { return Math.sin(n * x) * Math.sin(m * x); });
      return { a: A1, b: B1, p: P1, r: q.running(P1) };
    }
    var diff = pair(2, 3), same = pair(2, 2);
    var half = q.s(function (x) { return 0.5 * Math.cos(1 * x); });
    var halfSum = q.s(function (x) { return -0.5 * Math.cos(5 * x); });

    function st(d, splitOp, runOp, label) {
      return {
        curves: [
          { key: 'a', pts: d.a, tone: 'wave', width: 3.2 },
          { key: 'b', pts: d.b, tone: 'quantum', width: 1.8, dash: true },
          { key: 'p', pts: d.p, row: 1, tone: 'ink', width: 1.8 },
          { key: 'c1', pts: half, row: 1, tone: 'wave', width: 1.4, dash: true, op: splitOp },
          { key: 'c2', pts: halfSum, row: 1, tone: 'quantum', width: 1.4, dash: true, op: splitOp },
          { key: 'r', pts: d.r, row: 1, tone: 'prob', width: 2, dash: true, op: runOp }
        ],
        fills: [{ key: 'lo', row: 1, pts: d.p, split: true, tone: 'wave', negTone: 'fail', op: 0.3 }],
        marks: [{ key: 'end', kind: 'dot', row: 1, x: TAU, y: d.r[d.r.length - 1],
                  tone: 'prob', op: runOp }],
        notes: [{ key: 'n', cap: true, text: label, tone: 'ghost' }]
      };
    }
    var states = [
      st(diff, 0, 0, 'n = 2, m = 3'),
      st(diff, 1, 0, 'product to sum: two cosines'),
      st(diff, 0.4, 1, 'running total ends at zero'),
      st(same, 0, 1, 'n = m: all one sign'),
      st(same, 0, 1, 'total climbs to π')
    ];
    return { update: function (k, f) { q.c.set(V.at(states, k, f)); } };
  });

  A.viz('la-sin-cos', function (root) {
    var q = productViz(root, null, null, 'A sine against a cosine: the lobes cancel whatever the frequencies.');
    var TAU = q.TAU;
    function pair(n, m) {
      var P1 = q.s(function (x) { return Math.sin(n * x) * Math.cos(m * x); });
      return {
        a: q.s(function (x) { return Math.sin(n * x); }),
        b: q.s(function (x) { return Math.cos(m * x); }),
        p: P1, r: q.running(P1)
      };
    }
    var d1 = pair(2, 3), d2 = pair(2, 2);
    function st(d, runOp, label) {
      return {
        curves: [
          { key: 'a', pts: d.a, tone: 'wave', width: 3.2 },
          { key: 'b', pts: d.b, tone: 'quantum', width: 1.8, dash: true },
          { key: 'p', pts: d.p, row: 1, tone: 'ink', width: 1.8 },
          { key: 'r', pts: d.r, row: 1, tone: 'prob', width: 2, dash: true, op: runOp }
        ],
        fills: [{ key: 'lo', row: 1, pts: d.p, split: true, tone: 'wave', negTone: 'fail', op: 0.3 }],
        marks: [{ key: 'end', kind: 'dot', row: 1, x: TAU, y: d.r[d.r.length - 1], tone: 'prob', op: runOp }],
        notes: [{ key: 'n', cap: true, text: label, tone: 'ghost' }]
      };
    }
    /* Even the n = m case, where the sine-sine integral did not vanish, still
       gives zero here — which is the whole difference. */
    return { update: function (k, f) {
      q.c.set(V.at([st(d1, 1, 'n = 2, m = 3 — total zero'),
                    st(d2, 1, 'n = m — still zero')], k, f));
    } };
  });

  A.viz('la-coeff-projection', function (root) {
    var panes = V.split(root, 2, [1, 1]);
    var N = 6;
    var tab = V.cells(panes[0], {
      label: 'The inner product of the test sine with every harmonic in the sum.',
      w: 320, h: 106, cols: N, rows: 1, padL: 8, padT: 26
    });
    var cu = V.curves(panes[1], {
      label: 'The amounts of each harmonic, with one left standing.',
      w: 320, h: 118, x0: 0.5, x1: N + 0.5, ranges: [[0, 1.05]], xLabel: 'harmonic'
    });
    var AMP = [0.9, 0.42, 0.66, 0.25, 0.5, 0.18];
    var PICK = 2;                                    /* the harmonic being pulled out */

    function cells(fill, only) {
      var out = [];
      for (var i = 0; i < N; i++) {
        var isPick = i === PICK;
        var live = only ? (isPick ? 1 : 0) : 1;
        out.push({
          key: 'c' + i, col: i, row: 0,
          tone: isPick ? 'quantum' : 'ghost',
          fill: fill * (isPick ? 0.42 : 0.16) * (only ? live : 1),
          text: fill < 0.05 ? '' : (isPick ? 'π' : '0'),
          op: fill < 0.05 ? 0 : (only && !isPick ? 0.25 : 1)
        });
      }
      return out;
    }
    function bars(only) {
      var out = [];
      for (var i = 0; i < N; i++) {
        out.push({ key: 'b' + i, x: i + 1, y: AMP[i], w: 0.52,
                   tone: i === PICK ? 'quantum' : 'wave',
                   op: only && i !== PICK ? 0.14 : 0.6 });
      }
      return out;
    }
    function st(fill, only, head) {
      return {
        table: { cells: cells(fill, only),
                 notes: [{ key: 'h', cap: true, text: head, tone: 'ghost' }] },
        chart: { bars: bars(only),
                 notes: [{ key: 'p', x: PICK + 1.55, y: AMP[PICK] * 0.55, dy: 0,
                           text: only ? 'bₙ' : '', tone: 'quantum', op: only }] }
      };
    }
    var states = [
      st(0, 0, 'a sum of sines'),
      st(1, 0, '⟨sin nx, sin mx⟩'),
      st(1, 1, 'every term but one is zero'),
      st(1, 1, 'divide by π')
    ];
    return { update: function (k, f) {
      var s = V.at(states, k, f);
      tab.set(s.table); cu.set(s.chart);
    } };
  });
})(window.A = window.A || {});
