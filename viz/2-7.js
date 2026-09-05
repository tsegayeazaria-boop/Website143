/* ============================================================================
   viz/2-7.js — the pictures beside §2.7's derivations.

   Two slits, two routes, and the whole page turns on the difference between
   their lengths. So the bench draws that difference: the perpendicular foot
   that isolates it, the right triangle it sits in, and the pattern it paints
   on the screen. Every brightness comes from A.phys.doubleSlit.
   ========================================================================= */
(function (A) {
  'use strict';
  var V = A.viz, P = A.phys;
  var TAU = Math.PI * 2;
  var D = 0.34;                      /* half the slit separation, in half-screens */

  function slits() { return [{ key: 'a', y: D, w: 0.08 }, { key: 'b', y: -D, w: 0.08 }]; }

  /* The screen, painted with what a detector would register there. */
  function paint(dOverLam, n) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var y0 = 1 - 2 * i / n, y1 = 1 - 2 * (i + 1) / n;
      var sinT = (y0 + y1) / 2 * 0.28;                 /* small-angle screen scale */
      out.push({ y0: y0, y1: y1, i: P.doubleSlit(sinT, 0.7, dOverLam), tone: 'wave' });
    }
    return out;
  }
  function pattern(dOverLam) {
    var pts = [];
    for (var i = 0; i <= 80; i++) {
      var sinT = (1 - 2 * i / 80) * 0.28;
      pts.push(P.doubleSlit(sinT, 0.7, dOverLam));
    }
    return pts;
  }

  /* ------------------------------------------------- the extra distance --- */
  A.viz('ds-path', function (root) {
    var ap = V.aperture(root, {
      label: 'Two routes to one point, and the extra distance one of them travels.'
    });
    function st(spread, footOp, triOp, label, py) {
      /* At small screen distance the two rays clearly diverge; as the screen
         goes back they close on parallel, which is the far-field condition. */
      var ang = 0.42 * py;
      var y = py;
      return {
        slits: slits(),
        rays: [
          { key: 'a', y0: D, y1: y, tone: 'wave' },
          { key: 'b', y0: -D, y1: y - spread * 0.22, tone: 'quantum' }
        ],
        marks: [
          /* The foot: beyond it the two paths are the same length. */
          { key: 'foot', kind: 'seg', dash: false, x0: 0, y0: D, x1: 0.11, y1: -D + 0.06,
            tone: 'prob', op: footOp },
          { key: 'tri', kind: 'seg', x0: 0, y0: D, x1: 0, y1: -D, tone: 'ghost', op: triOp }
        ],
        dots: [{ key: 'p', x: 1, y: y, tone: 'ink', r: 3.6 }],
        notes: [
          { key: 'd', x: 0.06, y: 0, text: triOp ? 'd' : '', tone: 'ghost', op: triOp, anchor: 'start' },
          { key: 'x', x: 0.15, y: -D - 0.12, text: footOp ? 'd sin θ' : '', tone: 'prob',
            op: footOp, anchor: 'start' },
          { key: 'l', cap: true, text: label, tone: 'ghost' }
        ]
      };
    }
    var states = [
      st(1, 0, 0, 'a near screen: the rays diverge', 0.55),
      st(0.12, 0, 0, 'far away, they are parallel', 0.55),
      st(0.05, 1, 0, 'beyond the foot the paths are equal', 0.55),
      st(0.05, 1, 1, 'a right triangle: hypotenuse d, angle θ', 0.55)
    ];
    return { update: function (k, f) { ap.set(V.at(states, k, f)); } };
  });

  A.viz('ds-conditions', function (root) {
    var ap = V.aperture(root, {
      label: 'Bright where the extra path is a whole number of wavelengths, dark at the halves.'
    });
    var DL = 8;
    var states = [
      { y: 0.0, paint: 0.35, label: 'straight ahead: equal paths' },
      { y: 0.62, paint: 1, label: 'half a wavelength more: dark' },
      { y: 1.0, paint: 1, label: 'orders m = 0, ±1, ±2' }
    ];
    return {
      update: function (k, f) {
        var s = V.at(states, k, f);
        ap.set({
          slits: slits(),
          rays: [
            { key: 'a', y0: D, y1: s.y, tone: 'wave' },
            { key: 'b', y0: -D, y1: s.y, tone: 'quantum' }
          ],
          pattern: paint(DL, 44), paintOp: s.paint, paintW: 12,
          curves: [{ key: 'i', pts: pattern(DL), tone: 'wave', scale: 22, op: s.paint }],
          dots: [{ key: 'p', x: 1, y: s.y, tone: 'ink', r: 3.6 }],
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
      }
    };
  });

  A.viz('ds-small-angle', function (root) {
    var panes = V.split(root, 2, [1, 0.42]);
    var ap = V.aperture(panes[0], {
      label: 'The angle converted to a distance up the screen.', w: 320, h: 148
    });
    var cmp = V.curves(panes[1], {
      label: 'Where the small-angle step stops being true.', w: 320, h: 84,
      x0: 0, x1: 1.1, ranges: [[0, 1.35]], xLabel: 'θ'
    });
    var DL = 8;
    var states = [
      { tri: 1, cmp: 0, fr: 0, label: 'tan θ = y / L' },
      { tri: 1, cmp: 1, fr: 0, label: 'at small θ, sine and tangent agree' },
      { tri: 0.4, cmp: 1, fr: 0, label: 'substitute' },
      { tri: 0.4, cmp: 0.4, fr: 1, label: 'the m-th fringe' },
      { tri: 0.4, cmp: 0.4, fr: 1, label: 'spacing λL/d — the same for every m' }
    ];
    return {
      update: function (k, f) {
        var s = V.at(states, k, f);
        ap.set({
          slits: slits(),
          rays: [
            { key: 'a', y0: 0, y1: 0.62, tone: 'wave' },
            { key: 'r', y0: 0, y1: 0, tone: 'ghost', dash: true, op: s.tri }
          ],
          marks: [{ key: 'y', kind: 'vcaliper', x: 0.96, y0: 0, y1: 0.62, tone: 'prob', op: s.tri }],
          pattern: paint(DL, 44), paintOp: s.fr, paintW: 12,
          curves: [{ key: 'i', pts: pattern(DL), tone: 'wave', scale: 22, op: s.fr }],
          notes: [
            { key: 'y', x: 0.9, y: 0.31, text: s.tri > 0.5 ? 'y' : '', tone: 'prob',
              op: s.tri, anchor: 'end' },
            { key: 'L', x: 0.5, y: -0.06, dy: 12, text: s.tri > 0.5 ? 'L' : '', tone: 'ghost', op: s.tri },
            { key: 'l', cap: true, text: s.label, tone: 'ghost' }
          ]
        });
        cmp.set({
          curves: [
            { key: 's', tone: 'wave', width: 2.2, op: s.cmp,
              pts: V.samp(function (th) { return Math.sin(th); }, 0, 1.1) },
            { key: 't', tone: 'quantum', width: 1.8, dash: true, op: s.cmp,
              pts: V.samp(function (th) { return Math.min(1.35, Math.tan(th)); }, 0, 1.1) }
          ],
          notes: [{ key: 'n', cap: true, text: s.cmp ? 'sin θ and tan θ' : '', tone: 'ghost', op: s.cmp }]
        });
      }
    };
  });

  A.viz('ds-phase', function (root) {
    var panes = V.split(root, 2, [1, 0.55]);
    var ap = V.aperture(panes[0], {
      label: 'The extra path, ruled in wavelengths.', w: 320, h: 138
    });
    var pl = V.plane(panes[1], {
      label: 'A dial that turns once per wavelength of extra path.',
      w: 320, h: 96, unit: 32, cx: 160, cy: 48, xLabel: '', yLabel: ''
    });
    var states = [
      { turns: 1, label: 'one wavelength = one whole turn' },
      { turns: 1.6, label: 'δ = (2π/λ) × extra path' },
      { turns: 1.6, label: 'and 2π/λ is k' }
    ];
    return {
      update: function (k, f) {
        var s = V.at(states, k, f);
        var ang = s.turns * TAU;
        ap.set({
          slits: slits(),
          rays: [
            { key: 'a', y0: D, y1: 0.5, tone: 'wave' },
            { key: 'b', y0: -D, y1: 0.5, tone: 'quantum' }
          ],
          marks: [{ key: 'x', kind: 'seg', dash: false, x0: 0, y0: D, x1: 0.11, y1: -D + 0.06,
                    tone: 'prob' }],
          notes: [
            { key: 'x', x: 0.22, y: -D + 0.02, text: 'd sin θ', tone: 'prob', anchor: 'start' },
            { key: 'l', cap: true, text: s.label, tone: 'ghost' }
          ]
        });
        pl.set({
          grid: false, circle: 1, circleOp: 0.55,
          arrows: [{ key: 'p', ox: 0, oy: 0, x: Math.cos(ang), y: Math.sin(ang),
                     tone: 'quantum', width: 2.4 }],
          arcs: [{ key: 'a', r: 0.55, a0: 0, a1: ang, tone: 'prob' }],
          notes: [{ key: 'n', px: 160, py: 90, text: 'δ', tone: 'prob' }]
        });
      }
    };
  });

  A.viz('ds-add-fields', function (root) {
    var pl = V.plane(root, {
      label: 'The two arrivals as equal arrows, added tip to tail.',
      unit: 58, cx: 92, cy: 126, xLabel: '', yLabel: ''
    });
    function st(delta, resOp, label) {
      var a1 = -delta / 2, a2 = delta / 2;
      var v1 = [Math.cos(a1), Math.sin(a1)], v2 = [Math.cos(a2), Math.sin(a2)];
      return {
        grid: false, circle: 1, circleOp: 0.35,
        arrows: [
          { key: 'a', ox: 0, oy: 0, x: v1[0], y: v1[1], tone: 'wave', width: 2.6 },
          { key: 'b', ox: v1[0], oy: v1[1], x: v1[0] + v2[0], y: v1[1] + v2[1],
            tone: 'quantum', width: 2.6 },
          { key: 'r', ox: 0, oy: 0, x: v1[0] + v2[0], y: v1[1] + v2[1], tone: 'prob',
            width: 3, op: resOp }
        ],
        arcs: [{ key: 'd', r: 0.42, a0: a1, a1: a2, tone: 'ghost' }],
        notes: [
          { key: 'd', x: 0.62, y: 0, text: 'δ', tone: 'ghost' },
          { key: 'r', x: (v1[0] + v2[0]) * 0.55, y: (v1[1] + v2[1]) * 0.55 + 0.3,
            text: resOp ? '2E₀cos(δ/2)' : '', tone: 'prob', op: resOp },
          { key: 'l', cap: true, text: label, tone: 'ghost' }
        ]
      };
    }
    var states = [st(1.0, 0, 'two equal arrivals, δ apart'),
                  st(1.0, 1, 'the sum bisects them'),
                  st(Math.PI - 0.02, 1, 'δ = π: nothing left')];
    return { update: function (k, f) { pl.set(V.at(states, k, f)); } };
  });

  A.viz('ds-intensity', function (root) {
    var panes = V.split(root, 2, [1, 1]);
    var cu = V.curves(panes[0], {
      label: 'The field, its square, and the slow average a detector actually reports.',
      rows: 2, w: 320, h: 132, x0: 0, x1: 6 * TAU,
      ranges: [[-1.25, 1.25], [-0.2, 1.25]], xLabel: 't'
    });
    var ap = V.aperture(panes[1], { label: 'And the screen it paints.', w: 320, h: 106 });
    var DL = 8;
    var states = [
      { sq: 1, mean: 0, paint: 0, label: 'intensity is the average of E²' },
      { sq: 1, mean: 1, paint: 0, label: 'a constant plus a double-frequency wiggle' },
      { sq: 1, mean: 1, paint: 0, label: 'the wiggle averages away' },
      { sq: 0.4, mean: 1, paint: 1, label: 'so I goes as amplitude squared' },
      { sq: 0.4, mean: 1, paint: 1, label: 'peak 4I₀ straight ahead' }
    ];
    var TT = 6 * TAU;
    return {
      update: function (k, f) {
        var s = V.at(states, k, f);
        cu.set({
          curves: [
            { key: 'E', tone: 'wave', width: 2, pts: V.samp(function (u) { return Math.cos(u); }, 0, TT) },
            { key: 'E2', row: 1, tone: 'quantum', width: 2, op: s.sq,
              pts: V.samp(function (u) { return Math.cos(u) * Math.cos(u); }, 0, TT) },
            { key: 'm', row: 1, tone: 'prob', width: 1.8, dash: true, op: s.mean,
              pts: V.samp(function () { return 0.5; }, 0, TT) }
          ],
          fills: [{ key: 'E2', row: 1, tone: 'quantum', op: 0.18 * s.sq,
                    pts: V.samp(function (u) { return Math.cos(u) * Math.cos(u); }, 0, TT) }],
          notes: [
            { key: 'm', x: TT * 0.86, row: 1, y: 0.5, dy: -7, text: s.mean ? 'mean ½' : '',
              tone: 'prob', op: s.mean },
            { key: 'l', cap: true, text: s.label, tone: 'ghost' }
          ]
        });
        ap.set({
          slits: slits(),
          pattern: paint(DL, 40), paintOp: s.paint, paintW: 12,
          curves: [{ key: 'i', pts: pattern(DL), tone: 'wave', scale: 20, op: s.paint }],
          notes: [{ key: 'n', cap: true, text: s.paint ? 'I = 4I₀cos²(δ/2)' : '', tone: 'wave',
                    op: s.paint }]
        });
      }
    };
  });
})(window.A = window.A || {});
