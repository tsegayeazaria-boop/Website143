/* ============================================================================
   viz/2-1.js — the pictures beside §2.1's derivations.

   One mass, one spring, and the same object under every derivation on the
   page: the equation of motion, the check that a cosine solves it, the two
   starting numbers, and the energy trading back and forth while its total
   sits still.
   ========================================================================= */
(function (A) {
  'use strict';
  var V = A.viz, P = A.phys, M = A.math;
  var TAU = Math.PI * 2, T1 = 3 * TAU;
  function samp(fn) { return V.samp(fn, 0, T1); }

  /* --------------------------------------------------- where it comes from -- */
  A.viz('sho-eom', function (root, api) {
    var panes = V.split(root, 2, [0.55, 1]);
    var bn = V.bench(panes[0], {
      label: 'The spring force, always back towards the rest position.',
      w: 320, h: 96, box: 22
    });
    var cu = V.curves(panes[1], {
      label: 'One period, and how it shortens with a stiffer spring.',
      w: 320, h: 130, x0: 0, x1: T1, ranges: [[-1.3, 1.3]], xLabel: 't'
    });
    /* The picture is driven by real numbers: ω comes from k and m, and the
       period bar is 2π/ω, so a stiffer spring really does shorten it. */
    var states = [
      { k: 1, m: 1, run: 0, force: 1, accel: 0, label: 'F = −kx' },
      { k: 1, m: 1, run: 0, force: 0.35, accel: 1, label: 'a = −(k/m) x' },
      { k: 2.6, m: 1, run: 0, force: 0.35, accel: 1, label: 'stiffer: ω² = k/m' },
      { k: 2.6, m: 1, run: 1, force: 0.35, accel: 1, label: 'released' }
    ];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        var w = Math.sqrt(s.k / s.m);
        var x = s.run ? Math.cos(w * t) : 0.78;
        var lit = V.lit(api.hl(f > 0.5 ? k + 1 : k));
        bn.set({
          x: [x * 1.5],
          arrows: [
            { key: 'F', on: 0, dx: -s.k * x * 1.1, tone: lit('km') ? 'quantum' : 'fail',
              above: false, op: s.force },
            { key: 'a', on: 0, dx: -s.k / s.m * x * 1.1, tone: 'quantum', above: true, op: s.accel }
          ],
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
        cu.set({
          curves: [{ key: 'x', tone: 'wave', width: 2.2,
                     pts: samp(function (u) { return Math.cos(w * u); }) }],
          marks: [{ key: 'T', kind: 'caliper', x0: 0, x1: TAU / w, y: -0.72, tone: 'prob' }],
          notes: [{ key: 'T', x: TAU / w / 2, y: -0.72, dy: -7, text: 'T = 2π/ω', tone: 'prob' }]
        });
      }
    };
  });

  /* ------------------------------------------------- checking the solution -- */
  A.viz('sho-verify', function (root) {
    var panes = V.split(root, 2, [0.42, 1]);
    var bn = V.bench(panes[0], {
      label: 'The mass, with its velocity and its acceleration.', w: 320, h: 76, box: 18
    });
    var cu = V.curves(panes[1], {
      label: 'Position, velocity and acceleration on one time axis.',
      w: 320, h: 152, x0: 0, x1: T1, ranges: [[-1.35, 1.35]], xLabel: 't'
    });
    var states = [
      { v: 0, a: 0, cmp: 0, label: 'x = A cos(ωt + φ)' },
      { v: 1, a: 0, cmp: 0, label: 'ẋ: a quarter cycle ahead' },
      { v: 1, a: 1, cmp: 0, label: 'ẍ: half a cycle ahead' },
      { v: 0.4, a: 1, cmp: 1, label: 'ẍ lies on −ω²x' },
      { v: 0.4, a: 1, cmp: 1, label: 'so ẍ + ω²x = 0' }
    ];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        var x = Math.cos(t), v = -Math.sin(t), a = -Math.cos(t);
        bn.set({
          x: [x * 1.45],
          arrows: [
            { key: 'v', on: 0, dx: v * 1.2, tone: 'quantum', above: true, op: s.v },
            { key: 'a', on: 0, dx: a * 1.2, tone: 'prob', above: false, op: s.a }
          ],
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
        cu.set({
          curves: [
            { key: 'x', tone: 'wave', width: 2.4, pts: samp(function (u) { return Math.cos(u + t); }) },
            { key: 'v', tone: 'quantum', width: 1.8, op: s.v,
              pts: samp(function (u) { return -Math.sin(u + t); }) },
            { key: 'a', tone: 'prob', width: 1.8, op: s.a,
              pts: samp(function (u) { return -Math.cos(u + t); }) },
            /* −ω²x drawn over ẍ: if the two coincide the equation holds. */
            { key: 'c', tone: 'ink', width: 3.2, dash: true, op: s.cmp,
              pts: samp(function (u) { return -Math.cos(u + t); }) }
          ],
          notes: [{ key: 'c', cap: true, text: s.cmp ? '−ω²x lies on ẍ' : '', tone: 'ink', op: s.cmp }]
        });
      }
    };
  });

  A.viz('sho-complex-check', function (root) {
    var panes = V.split(root, 2, [1, 0.5]);
    var pl = V.plane(panes[0], {
      label: 'The complex amplitude turning, and the two derivatives it produces.',
      w: 320, h: 150, unit: 44, cx: 160, cy: 74, xLabel: 're', yLabel: ''
    });
    var bn = V.bench(panes[1], {
      label: 'The mass its real part describes.', w: 320, h: 80, box: 18
    });
    var states = [
      { d2: 0, sum: 0, label: 'x = Re(c e^iωt)' },
      { d2: 1, sum: 0, label: 'two quarter turns: ×(−ω²)' },
      { d2: 1, sum: 1, label: 'the two cancel' },
      { d2: 1, sum: 1, label: '|c| = A,  arg c = −φ' }
    ];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        var ph = t * 0.85, c = Math.cos(ph), sn = Math.sin(ph);
        pl.set({
          grid: false, circle: 1, circleOp: 0.5,
          arrows: [
            { key: 'z', ox: 0, oy: 0, x: c, y: sn, tone: 'wave', width: 3 },
            { key: 'dd', ox: 0, oy: 0, x: -c, y: -sn, tone: 'prob', width: 2.4, op: s.d2 },
            /* ω²x drawn from the tip of ẍ: together they close on the origin. */
            { key: 'w2', ox: -c, oy: -sn, x: 0, y: 0, tone: 'quantum', width: 2, op: s.sum }
          ],
          notes: [
            { key: 'z', x: c * 0.55, y: sn * 0.55, dy: -8, text: 'c e^iωt', tone: 'wave' },
            { key: 'l', cap: true, text: s.label, tone: 'ghost' }
          ]
        });
        bn.set({ x: [c * 1.45] });
      }
    };
  });

  A.viz('sho-ic', function (root) {
    var panes = V.split(root, 2, [0.52, 1]);
    var bn = V.bench(panes[0], {
      label: 'The two numbers you are given: where it starts and how fast.',
      w: 320, h: 90, box: 20
    });
    var pl = V.plane(panes[1], {
      label: 'Those two numbers as the legs of a right triangle whose hypotenuse is the amplitude.',
      w: 320, h: 138, unit: 52, cx: 52, cy: 118, xLabel: 'x₀', yLabel: 'v₀/ω'
    });
    var x0 = 1.05, vw = 0.78;                         /* x(0) and v(0)/ω */
    function st(legOp, hypOp, arcOp, label) {
      return {
        grid: true,
        arrows: [{ key: 'A', ox: 0, oy: 0, x: x0, y: vw, tone: 'ink', width: 2.8, op: hypOp }],
        legs: [
          { key: 'x', x0: 0, y0: 0, x1: x0, y1: 0, tone: 'wave', op: legOp },
          { key: 'v', x0: x0, y0: 0, x1: x0, y1: vw, tone: 'quantum', op: legOp }
        ],
        marks: [{ key: 'r', kind: 'right', x: x0, y: 0, a0: Math.PI, a1: Math.PI / 2, s: 8,
                  tone: 'ghost', op: legOp }],
        arcs: [{ key: 'p', r: 0.4, a0: 0, a1: Math.atan2(vw, x0), tone: 'prob', op: arcOp }],
        notes: [
          { key: 'x', x: x0 / 2, y: 0, dy: 15, text: 'x₀', tone: 'wave', op: legOp },
          { key: 'v', x: x0 + 0.1, y: vw / 2, text: 'v₀/ω', tone: 'quantum', op: legOp, anchor: 'start' },
          { key: 'A', x: x0 * 0.45 - 0.1, y: vw * 0.45 + 0.2, text: 'A', tone: 'ink', op: hypOp },
          { key: 'ph', x: 0.62, y: 0.14, text: arcOp ? '−φ' : '', tone: 'prob', op: arcOp },
          { key: 'l', cap: true, text: label, tone: 'ghost' }
        ]
      };
    }
    var states = [st(1, 0, 0, 'C₁ = x₀,  C₂ = v₀/ω'), st(1, 1, 0, 'A = √(C₁² + C₂²)'),
                  st(1, 1, 1, 'and the angle is the phase')];
    return {
      animates: true,
      update: function (k, f) {
        pl.set(V.at(states, k, f));
        bn.set({
          x: [x0 * 1.35],
          arrows: [{ key: 'v', on: 0, dx: vw * 1.35, tone: 'quantum', above: true }],
          notes: [
            { key: 'x', on: 0, dy: 28, text: 'x₀', tone: 'wave' },
            { key: 'v', i: 0, x: x0 * 1.35 + vw * 0.7, py: 20, text: 'v₀', tone: 'quantum' }
          ]
        });
      }
    };
  });

  /* ------------------------------------------------------------- energy ---- */
  /* Two bars trading while a third stands still. The heights come from the
     same solution the algebra uses, so the total's flatness is a result and
     not a promise. */
  function energyViz(root, label) {
    var panes = V.split(root, 2, [0.42, 1]);
    var bn = V.bench(panes[0], { label: 'The mass, running.', w: 320, h: 76, box: 18 });
    var cu = V.curves(panes[1], {
      label: label, w: 320, h: 152, x0: 0.3, x1: 3.7, ranges: [[0, 1.28]], xLabel: ''
    });
    return { bn: bn, cu: cu };
  }

  A.viz('sho-energy-const', function (root) {
    var q = energyViz(root, 'Kinetic and spring energy trading, with the total across the top.');
    var states = [
      { rate: 0, total: 0, mark: 0, label: 'E = ½mẋ² + ½kx²' },
      { rate: 1, total: 0, mark: 0, label: 'one grows as fast as the other shrinks' },
      { rate: 1, total: 0, mark: 1, label: 'at the turning points both stop' },
      { rate: 0.3, total: 1, mark: 0, label: 'the total never moves' }
    ];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        var x = Math.cos(t), v = -Math.sin(t);
        var KE = 0.5 * v * v, PE = 0.5 * x * x;
        var turning = Math.abs(v) < 0.12;
        q.bn.set({
          x: [x * 1.45],
          arrows: [{ key: 'v', on: 0, dx: v * 1.2, tone: 'quantum', above: true }],
          notes: [{ key: 'l', cap: true, text: turning && s.mark ? 'both stop' : '', tone: 'prob',
                    op: s.mark }]
        });
        q.cu.set({
          bars: [
            { key: 'ke', x: 1, y: KE * 2, w: 0.5, tone: 'quantum', op: 0.6 },
            { key: 'pe', x: 2, y: PE * 2, w: 0.5, tone: 'wave', op: 0.6 },
            { key: 'tot', x: 3, y: (KE + PE) * 2, w: 0.5, tone: 'prob', op: 0.5 * s.total + 0.2 }
          ],
          marks: [
            { key: 'top', kind: 'hline', y: 1, tone: 'prob', op: s.total },
            { key: 'r1', kind: 'seg', dash: false, x0: 1, y0: KE * 2, x1: 1, y1: KE * 2 + v * x * 0.9,
              tone: 'prob', op: s.rate },
            { key: 'r2', kind: 'seg', dash: false, x0: 2, y0: PE * 2, x1: 2, y1: PE * 2 - v * x * 0.9,
              tone: 'prob', op: s.rate }
          ],
          notes: [
            { key: 'a', x: 1, y: 0, dy: 14, text: 'kinetic', tone: 'quantum' },
            { key: 'b', x: 2, y: 0, dy: 14, text: 'spring', tone: 'wave' },
            { key: 'c', x: 3, y: 0, dy: 14, text: 'total', tone: 'prob' },
            { key: 'l', cap: true, text: s.label, tone: 'ghost' }
          ]
        });
      }
    };
  });

  A.viz('sho-energy-value', function (root) {
    var q = energyViz(root, 'Both bars reach the same ceiling, and their sum is fixed by the amplitude.');
    var states = [
      { A: 1, ceil: 0, stack: 0, label: 'substitute the solution' },
      { A: 1, ceil: 0, stack: 0, label: 'squaring loses the sign' },
      { A: 1, ceil: 1, stack: 0, label: 'mω² = k: the same ceiling' },
      { A: 0.66, ceil: 1, stack: 1, label: 'E = ½kA², whatever A' }
    ];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        var x = s.A * Math.cos(t), v = -s.A * Math.sin(t);
        var KE = 0.5 * v * v, PE = 0.5 * x * x;
        q.bn.set({ x: [x * 1.45] });
        q.cu.set({
          bars: [
            { key: 'ke', x: 1, y: KE * 2, w: 0.5, tone: 'quantum', op: 0.6 },
            { key: 'pe', x: 2, y: PE * 2, w: 0.5, tone: 'wave', op: 0.6 },
            { key: 'tot', x: 3, y: (KE + PE) * 2, w: 0.5, tone: 'prob', op: 0.2 + 0.4 * s.stack }
          ],
          marks: [{ key: 'ceil', kind: 'hline', y: s.A * s.A, tone: 'prob', op: s.ceil }],
          notes: [
            { key: 'a', x: 1, y: 0, dy: 14, text: '½mẋ²', tone: 'quantum' },
            { key: 'b', x: 2, y: 0, dy: 14, text: '½kx²', tone: 'wave' },
            { key: 'c', x: 3, y: 0, dy: 14, text: 'E', tone: 'prob' },
            { key: 'ceil', x: 3.4, y: s.A * s.A, dy: -7, text: s.ceil ? '½kA²' : '', tone: 'prob',
              op: s.ceil, anchor: 'end' },
            { key: 'l', cap: true, text: s.label, tone: 'ghost' }
          ]
        });
      }
    };
  });
  void P; void M;
})(window.A = window.A || {});
