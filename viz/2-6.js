/* ============================================================================
   viz/2-6.js — the pictures beside §2.6's derivations.

   A packet is a bundle of waves that agree in one place and disagree
   everywhere else. Every derivation on this page is about how fast that place
   of agreement moves, or how long it lasts, so the pictures are the packet
   with its envelope, and the dispersion curve whose slope decides both.
   ========================================================================= */
(function (A) {
  'use strict';
  var V = A.viz, P = A.phys;
  var X0 = -9, X1 = 9;
  function sm(fn) { return V.samp(fn, X0, X1); }

  /* ------------------------------------------------ two waves are enough -- */
  A.viz('wp-two-waves', function (root) {
    var cu = V.curves(root, {
      label: 'Two waves of nearly equal wavenumber, and the beat their sum makes.',
      rows: 2, x0: X0, x1: X1, ranges: [[-1.25, 1.25], [-2.4, 2.4]], xLabel: 'x'
    });
    var k1 = 2.6, k2 = 3.1, w1 = 2.6, w2 = 3.1;      /* non-dispersive to start */
    var states = [
      { comp: 1, env: 0, dots: 0, disp: 0, label: 'in step here, opposed there' },
      { comp: 1, env: 0, dots: 0, disp: 0, label: 'product to sum' },
      { comp: 0.35, env: 1, dots: 0, disp: 0, label: 'a slow envelope on a fast carrier' },
      { comp: 0.2, env: 1, dots: 1, disp: 1, label: 'with dispersion they separate' }
    ];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        /* Turning on dispersion makes the two ωs disagree, and then the crest
           and the envelope peak stop travelling together. */
        var W1 = w1 * (1 + 0.22 * s.disp), W2 = w2 * (1 - 0.16 * s.disp);
        var kc = (k1 + k2) / 2, kd = (k2 - k1) / 2;
        var wc = (W1 + W2) / 2, wd = (W2 - W1) / 2;
        var vp = wc / kc, vg = wd / kd;
        var crest = ((vp * t + 4.5) % 18) - 9;
        var peak = ((vg * t + 4.5) % 18) - 9;
        cu.set({
          curves: [
            { key: 'a', pts: sm(function (x) { return Math.cos(k1 * x - W1 * t); }),
              tone: 'quantum', width: 1.6, op: s.comp },
            { key: 'b', pts: sm(function (x) { return Math.cos(k2 * x - W2 * t); }),
              tone: 'prob', width: 1.6, op: s.comp },
            { key: 's', row: 1, tone: 'wave', width: 2.2,
              pts: sm(function (x) { return 2 * Math.cos(kd * x - wd * t) * Math.cos(kc * x - wc * t); }) },
            { key: 'e1', row: 1, tone: 'ghost', width: 1.4, dash: true, op: s.env,
              pts: sm(function (x) { return 2 * Math.cos(kd * x - wd * t); }) },
            { key: 'e2', row: 1, tone: 'ghost', width: 1.4, dash: true, op: s.env,
              pts: sm(function (x) { return -2 * Math.cos(kd * x - wd * t); }) }
          ],
          marks: [
            { key: 'c', row: 1, kind: 'dot', x: crest, y: 2 * Math.cos(kd * crest - wd * t), tone: 'quantum',
              r: 4, op: s.dots },
            { key: 'p', row: 1, kind: 'dot', x: peak, y: 2, tone: 'prob', r: 4, op: s.dots }
          ],
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
      }
    };
  });

  /* ------------------------------------------------ building the packet --- */
  A.viz('wp-gaussian-packet', function (root) {
    var panes = V.split(root, 2, [0.62, 1]);
    var sp = V.curves(panes[0], {
      label: 'A Gaussian bundle of wavenumbers.', w: 320, h: 92,
      x0: 0, x1: 7, ranges: [[-0.15, 1.15]], xLabel: 'k'
    });
    var cu = V.curves(panes[1], {
      label: 'Its components, and the lump where they agree.',
      w: 320, h: 146, x0: X0, x1: X1, ranges: [[-1.35, 1.35]], xLabel: 'x'
    });
    var k0 = 3.2;
    function packet(dk, N) {
      return function (x) {
        var y = 0, i;
        for (i = 0; i < N; i++) {
          var kk = k0 + dk * 2.2 * (i / (N - 1) - 0.5) * 2;
          y += Math.exp(-Math.pow((kk - k0) / dk, 2)) * Math.cos(kk * x);
        }
        return y / N * 2.4;
      };
    }
    var states = [
      { dk: 0.55, N: 5, few: 1, label: 'a handful of components' },
      { dk: 0.55, N: 13, few: 0.4, label: 'the carrier at k₀' },
      { dk: 0.55, N: 41, few: 0, label: 'they add in the middle, cancel outside' },
      { dk: 1.1, N: 41, few: 0, label: 'wider spectrum, narrower lump' }
    ];
    return {
      update: function (k, f) {
        var s = V.at(states, k, f);
        var N = Math.max(3, Math.round(s.N));
        sp.set({
          curves: [{ key: 'g', tone: 'wave', width: 2.2,
                     pts: V.samp(function (kk) { return Math.exp(-Math.pow((kk - k0) / s.dk, 2)); }, 0, 7) }],
          marks: [{ key: 'w', kind: 'caliper', x0: k0 - s.dk, x1: k0 + s.dk, y: -0.09, tone: 'prob' }],
          notes: [{ key: 'w', x: k0, y: -0.09, dy: -6, text: 'Δk', tone: 'prob' }]
        });
        cu.set({
          curves: [
            { key: 'c', tone: 'quantum', width: 1.2, op: 0.22,
              pts: sm(function (x) { return Math.cos(k0 * x); }) },
            { key: 'p', tone: 'wave', width: 2.4, pts: sm(packet(s.dk, N)) }
          ],
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
      }
    };
  });

  A.viz('wp-uncertainty', function (root) {
    var panes = V.split(root, 2, [1, 1]);
    var cu = V.curves(panes[0], {
      label: 'The packet, with its width measured.', w: 320, h: 114,
      x0: X0, x1: X1, ranges: [[-0.3, 1.15]], xLabel: 'x'
    });
    var sp = V.curves(panes[1], {
      label: 'Its spectrum, with the same measurement.', w: 320, h: 114,
      x0: -6, x1: 6, ranges: [[-0.34, 1.15]], xLabel: 'k' });
    var states = [
      { sig: 1.7, units: 0, label: 'ΔxΔk = ½, and no shape does better' },
      { sig: 1.0, units: 0, label: 'narrow it: the spread widens' },
      { sig: 0.62, units: 1, label: 'p = ℏk relabels the axis' },
      { sig: 0.62, units: 1, label: 'ΔxΔp = ℏ/2' }
    ];
    return {
      update: function (k, f) {
        var s = V.at(states, k, f);
        var w = P.gaussianWidths(s.sig);
        cu.set({
          curves: [{ key: 'f', tone: 'wave', width: 2.4,
                     pts: sm(function (x) { return P.gaussian(x, s.sig) * P.gaussian(x, s.sig); }) }],
          fills: [{ key: 'f', tone: 'wave', op: 0.2,
                    pts: sm(function (x) { return P.gaussian(x, s.sig) * P.gaussian(x, s.sig); }) }],
          marks: [{ key: 'w', kind: 'caliper', x0: -w.dx, x1: w.dx, y: -0.16, tone: 'prob' }],
          notes: [
            { key: 'w', x: 0, y: -0.16, dy: -6, text: 'Δx', tone: 'prob' },
            { key: 'l', cap: true, text: s.label, tone: 'ghost' }
          ]
        });
        sp.set({
          curves: [{ key: 'g', tone: 'quantum', width: 2.4,
                     pts: V.samp(function (kk) { return Math.exp(-s.sig * s.sig * kk * kk); }, -6, 6) }],
          fills: [{ key: 'g', tone: 'quantum', op: 0.2,
                    pts: V.samp(function (kk) { return Math.exp(-s.sig * s.sig * kk * kk); }, -6, 6) }],
          marks: [{ key: 'w', kind: 'caliper', x0: -w.dk, x1: w.dk, y: -0.18, tone: 'prob' }],
          notes: [
            { key: 'w', x: 0, y: -0.18, dy: -6, text: s.units > 0.5 ? 'Δp/ℏ' : 'Δk', tone: 'prob' },
            { key: 'p', cap: true, text: s.units > 0.5 ? 'Δx Δp = ℏ/2' : 'Δx Δk = 0.50', tone: 'prob' }
          ]
        });
      }
    };
  });

  /* ------------------------------------------------- how fast it travels -- */
  function dispViz(root, hCurve) {
    var panes = V.split(root, 2, [1, hCurve || 1]);
    var dp = V.curves(panes[0], {
      label: 'The dispersion curve, with the chord and the tangent at k₀.',
      w: 320, h: 118, x0: 0, x1: 5, ranges: [[0, 5]], xLabel: 'k'
    });
    var cu = V.curves(panes[1], {
      label: 'The packet the medium carries.', w: 320, h: 112,
      x0: X0, x1: X1, ranges: [[-1.35, 1.35]], xLabel: 'x'
    });
    return { dp: dp, cu: cu };
  }
  var MEDIA = {
    line:   { w: function (k) { return k; },                       name: 'ω = vk' },
    water:  { w: function (k) { return 1.9 * Math.sqrt(k); },      name: 'ω = √(gk)' },
    quantum:{ w: function (k) { return 0.42 * k * k; },            name: 'ω = ℏk²/2m' }
  };
  function dispState(med, k0, chordOp, tanOp, label) {
    var W = MEDIA[med].w;
    var w0 = W(k0), h = 0.01;
    var vg = (W(k0 + h) - W(k0 - h)) / (2 * h), vp = w0 / k0;
    return {
      dp: {
        curves: [{ key: 'w', tone: 'wave', width: 2.2, pts: V.samp(W, 0, 5) }],
        marks: [
          { key: 'ch', kind: 'seg', dash: false, x0: 0, y0: 0, x1: 5, y1: vp * 5,
            tone: 'quantum', op: chordOp },
          { key: 'tg', kind: 'seg', dash: false, x0: Math.max(0, k0 - 1.6), x1: Math.min(5, k0 + 1.6),
            y0: w0 - vg * Math.min(k0, 1.6), y1: w0 + vg * Math.min(5 - k0, 1.6),
            tone: 'prob', op: tanOp },
          { key: 'p', kind: 'dot', x: k0, y: w0, tone: 'ink', r: 4 }
        ],
        notes: [
          { key: 'a', x: 4.4, y: Math.min(4.7, vp * 4.4), dy: -6, text: chordOp ? 'v_p' : '',
            tone: 'quantum', op: chordOp },
          { key: 'b', x: Math.min(4.6, k0 + 1.5), y: Math.min(4.7, w0 + vg * 1.5), dy: 14,
            text: tanOp ? 'v_g' : '', tone: 'prob', op: tanOp },
          { key: 'l', cap: true, text: label, tone: 'ghost' }
        ]
      },
      vp: vp, vg: vg, k0: k0
    };
  }

  A.viz('wp-group-velocity', function (root) {
    var q = dispViz(root);
    var states = [
      dispState('water', 2.4, 0, 0, 'expand ω about k₀'),
      dispState('water', 2.4, 1, 0, 'the carrier: ω₀/k₀'),
      dispState('water', 2.4, 1, 0, 'factor it out'),
      dispState('water', 2.4, 0.4, 1, 'what is left depends on x − v_g t'),
      dispState('water', 2.4, 1, 1, 'chord for the crests, tangent for the lump')
    ];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        q.dp.set(s.dp);
        var env = ((s.vg * t + 9) % 18) - 9;
        q.cu.set({
          curves: [{ key: 'p', tone: 'wave', width: 2.2,
                     pts: sm(function (x) {
                       return Math.exp(-Math.pow((x - env) / 2.6, 2)) *
                              Math.cos(s.k0 * (x - s.vp * t));
                     }) },
                   { key: 'e', tone: 'ghost', width: 1.4, dash: true,
                     pts: sm(function (x) { return Math.exp(-Math.pow((x - env) / 2.6, 2)); }) }],
          marks: [{ key: 'm', kind: 'dot', x: env, y: 1, tone: 'prob', r: 4 }]
        });
      }
    };
  });

  A.viz('wp-examples', function (root) {
    var q = dispViz(root);
    var states = [
      dispState('line', 2.4, 1, 1, 'a string: tangent and chord coincide'),
      dispState('water', 2.4, 1, 1, 'deep water: tangent shallower'),
      dispState('quantum', 2.4, 1, 1, 'a free particle: tangent twice the chord'),
      dispState('quantum', 2.4, 1, 1, 'and that group velocity is p/m')
    ];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        q.dp.set(s.dp);
        var env = ((s.vg * t * 0.6 + 9) % 18) - 9;
        q.cu.set({
          curves: [{ key: 'p', tone: 'wave', width: 2.2,
                     pts: sm(function (x) {
                       return Math.exp(-Math.pow((x - env) / 2.6, 2)) *
                              Math.cos(s.k0 * (x - s.vp * t * 0.6));
                     }) },
                   { key: 'e', tone: 'ghost', width: 1.4, dash: true,
                     pts: sm(function (x) { return Math.exp(-Math.pow((x - env) / 2.6, 2)); }) }],
          marks: [{ key: 'm', kind: 'dot', x: env, y: 1, tone: 'prob', r: 4 }]
        });
      }
    };
  });

  A.viz('wp-spreading', function (root) {
    var q = dispViz(root);
    var states = [
      { curv: 0, wide: 1, edges: 0, label: 'keep one more term' },
      { curv: 1, wide: 1, edges: 0, label: 'the gap between curve and tangent' },
      { curv: 1, wide: 1.35, edges: 1, label: 'the edge components drift' },
      { curv: 1, wide: 2.1, edges: 1, label: 'and the packet has widened' }
    ];
    var base = dispState('quantum', 2.4, 0, 1, '');
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        var d = base.dp;
        q.dp.set({
          curves: d.curves,
          marks: d.marks.concat([
            { key: 'g', kind: 'seg', x0: 3.6, y0: MEDIA.quantum.w(3.6),
              x1: 3.6, y1: base.vg * (3.6 - 2.4) + MEDIA.quantum.w(2.4),
              tone: 'fail', dash: false, op: s.curv }
          ]),
          notes: [
            { key: 'c', x: 3.75, y: MEDIA.quantum.w(3.6) * 0.8, text: s.curv ? "ω''" : '',
              tone: 'fail', op: s.curv, anchor: 'start' },
            { key: 'l', cap: true, text: s.label, tone: 'ghost' }
          ]
        });
        var env = ((base.vg * t * 0.5 + 9) % 18) - 9;
        var wid = 1.9 * s.wide;
        q.cu.set({
          curves: [
            { key: 'p', tone: 'wave', width: 2.2,
              pts: sm(function (x) {
                return Math.exp(-Math.pow((x - env) / wid, 2)) * Math.cos(base.k0 * (x - base.vp * t * 0.5));
              }) },
            { key: 'e', tone: 'ghost', width: 1.4, dash: true,
              pts: sm(function (x) { return Math.exp(-Math.pow((x - env) / wid, 2)); }) }
          ],
          marks: [{ key: 'w', kind: 'caliper', x0: env - wid, x1: env + wid, y: -1.15, tone: 'prob',
                    op: s.edges }],
          notes: [{ key: 'w', x: env, y: -1.15, dy: -6, text: s.edges ? 'width' : '',
                    tone: 'prob', op: s.edges }]
        });
      }
    };
  });
})(window.A = window.A || {});
