/* ============================================================================
   viz/2-3.js — the pictures beside §2.3's derivations.

   A wave repeats twice over: once along the string at one instant, and once at
   one place as time passes. Each derivation on this page is about one of those
   two readings, so each picture puts a ruler on the one being discussed.
   ========================================================================= */
(function (A) {
  'use strict';
  var V = A.viz, M = A.math;
  var TAU = Math.PI * 2;
  var XL = 3 * TAU;                       /* three wavelengths of string */

  /* ------------------------------------------------ repeating in space ---- */
  A.viz('tw-k', function (root) {
    var panes = V.split(root, 2, [1, 0.5]);
    var cu = V.curves(panes[0], {
      label: 'A photograph of the string: two points one wavelength apart are identical.',
      w: 320, h: 142, x0: 0, x1: XL, ranges: [[-1.3, 1.3]], xLabel: 'x'
    });
    var pl = V.plane(panes[1], {
      label: 'The phase, which advances one whole turn per wavelength.',
      w: 320, h: 84, unit: 28, cx: 160, cy: 42, xLabel: '', yLabel: ''
    });
    var Y = V.samp(function (x) { return Math.cos(x); }, 0, XL);
    var x0 = 1.1;
    function st(kk, dialTo, label) {
      var lam = TAU / kk;
      return {
        cu: {
          curves: [{ key: 'y', tone: 'wave', width: 2.2,
                     pts: V.samp(function (x) { return Math.cos(kk * x); }, 0, XL) }],
          marks: [
            { key: 'a', kind: 'dot', x: x0, y: Math.cos(kk * x0), tone: 'quantum', r: 4 },
            { key: 'b', kind: 'dot', x: x0 + lam, y: Math.cos(kk * (x0 + lam)), tone: 'quantum', r: 4 },
            { key: 'r', kind: 'caliper', x0: x0, x1: x0 + lam, y: -1.08, tone: 'prob' }
          ],
          notes: [
            { key: 'r', x: x0 + lam / 2, y: -1.08, dy: -6, text: 'λ', tone: 'prob' },
            { key: 'l', cap: true, text: label, tone: 'ghost' }
          ]
        },
        pl: {
          grid: false, circle: 1, circleOp: 0.6,
          arrows: [{ key: 'p', ox: 0, oy: 0, x: Math.cos(dialTo), y: Math.sin(dialTo),
                     tone: 'quantum', width: 2.4 }],
          arcs: [{ key: 'a', r: 0.55, a0: 0, a1: dialTo || 0.001, tone: 'prob' }],
          notes: [{ key: 'd', px: 160, py: 78, text: dialTo >= TAU - 0.01 ? 'one whole turn = kλ' : '',
                    tone: 'prob' }]
        }
      };
    }
    var states = [st(1, 0, 'same height and same slope'), st(1, 0, 'the whole argument is unchanged'),
                  st(1, TAU - 0.001, 'so kλ = 2π'), st(1.9, TAU - 0.001, 'shorter λ, larger k')];
    void Y;
    return { update: function (k, f) { var s = V.at(states, k, f); cu.set(s.cu); pl.set(s.pl); } };
  });

  /* ------------------------------------------------- repeating in time ---- */
  A.viz('tw-omega', function (root) {
    var panes = V.split(root, 2, [1, 1]);
    var cu = V.curves(panes[0], {
      label: 'One point of the string, bobbing.',
      w: 320, h: 112, x0: 0, x1: XL, ranges: [[-1.3, 1.3]], xLabel: 'x'
    });
    var tr = V.curves(panes[1], {
      label: 'Its height against time: the same repeat, now per second.',
      w: 320, h: 112, x0: 0, x1: XL, ranges: [[-1.3, 1.3]], xLabel: 't'
    });
    var probe = XL * 0.28;
    var states = [{ w: 1, mark: 0, label: 'watch one place' },
                  { w: 1, mark: 1, label: 'ωT = 2π' },
                  { w: 1.8, mark: 1, label: 'higher frequency, shorter T' }];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        var T = TAU / s.w;
        cu.set({
          curves: [{ key: 'y', tone: 'wave', width: 2.2,
                     pts: V.samp(function (x) { return Math.cos(x - s.w * t); }, 0, XL) }],
          marks: [
            { key: 'p', kind: 'vline', x: probe, tone: 'ghost' },
            { key: 'd', kind: 'dot', x: probe, y: Math.cos(probe - s.w * t), tone: 'quantum', r: 4.2 }
          ],
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
        tr.set({
          curves: [{ key: 'y', tone: 'quantum', width: 2.2,
                     pts: V.samp(function (u) { return Math.cos(probe - s.w * (u + t)); }, 0, XL) }],
          marks: [{ key: 'T', kind: 'caliper', x0: 0.4, x1: 0.4 + T, y: -1.08, tone: 'prob', op: s.mark }],
          notes: [{ key: 'T', x: 0.4 + T / 2, y: -1.08, dy: -6, text: s.mark ? 'T' : '',
                    tone: 'prob', op: s.mark }]
        });
      }
    };
  });

  /* ------------------------------------------------------- how fast ------- */
  A.viz('tw-speed', function (root) {
    var panes = V.split(root, 2, [1, 0.8]);
    var cu = V.curves(panes[0], {
      label: 'One crest, followed.', w: 320, h: 122, x0: 0, x1: XL,
      ranges: [[-1.3, 1.3]], xLabel: 'x'
    });
    var tr = V.curves(panes[1], {
      label: 'That crest’s position against time: a straight line whose slope is the speed.',
      w: 320, h: 104, x0: 0, x1: 6, ranges: [[0, XL]], xLabel: 't'
    });
    var states = [
      { dir: 1, trail: 0, slope: 0, label: 'ride with the crest' },
      { dir: 1, trail: 1, slope: 0, label: 'its position against time' },
      { dir: 1, trail: 1, slope: 1, label: 'slope = ω/k' },
      { dir: -1, trail: 1, slope: 1, label: 'flip the sign: it goes the other way' }
    ];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        var u = (t * 0.9) % 6;
        var cx = s.dir > 0 ? (u * 1.05) % XL : XL - (u * 1.05) % XL;
        cu.set({
          curves: [{ key: 'y', tone: 'wave', width: 2.2,
                     pts: V.samp(function (x) { return Math.cos(x - s.dir * t * 1.05); }, 0, XL) }],
          marks: [
            { key: 'c', kind: 'dot', x: cx, y: 1, tone: 'quantum', r: 4.4 },
            { key: 'v', kind: 'seg', x0: cx, y0: 1, x1: cx, y1: -1.2, tone: 'ghost' }
          ],
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
        tr.set({
          curves: [{ key: 'p', tone: 'quantum', width: 2, op: s.trail,
                     pts: V.samp(function (uu) {
                       return s.dir > 0 ? M.clamp(uu * 1.05, 0, XL) : M.clamp(XL - uu * 1.05, 0, XL);
                     }, 0, 6) }],
          marks: [{ key: 'now', kind: 'dot', x: u, y: cx, tone: 'quantum', r: 4, op: s.trail }],
          notes: [{ key: 's', cap: true, text: s.slope ? 'ω/k' : '', tone: 'prob', op: s.slope }]
        });
      }
    };
  });

  A.viz('tw-v-lambda-f', function (root) {
    var cu = V.curves(root, {
      label: 'One wavelength per period: the same statement, without the radians.',
      x0: 0, x1: XL, ranges: [[-1.35, 1.35]], xLabel: 'x'
    });
    var states = [
      { rad: 1, ruler: 0, step: 0, label: 'k and ω in full' },
      { rad: 0.15, ruler: 1, step: 0, label: 'the 2π s cancel' },
      { rad: 0, ruler: 1, step: 1, label: 'one wavelength per cycle' }
    ];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        var ph = (t * 0.8) % TAU;
        var cx = ph;
        cu.set({
          curves: [{ key: 'y', tone: 'wave', width: 2.2,
                     pts: V.samp(function (x) { return Math.cos(x - ph); }, 0, XL) }],
          marks: [
            { key: 'c', kind: 'dot', x: cx, y: 1, tone: 'quantum', r: 4.4 },
            { key: 'r', kind: 'caliper', x0: 0, x1: TAU, y: -1.15, tone: 'prob', op: s.ruler },
            { key: 'd', kind: 'dot', x: 0, y: 1, tone: 'ghost', r: 3.4, op: s.step },
            { key: 'e', kind: 'dot', x: TAU, y: 1, tone: 'ghost', r: 3.4, op: s.step }
          ],
          notes: [
            { key: 'r', x: Math.PI, y: -1.15, dy: -6, text: s.ruler ? 'λ' : '', tone: 'prob', op: s.ruler },
            { key: 'k', cap: true, text: s.label, tone: 'ghost' }
          ]
        });
      }
    };
  });

  /* ----------------------------------------------- crests as flat sheets -- */
  A.viz('tw-plane', function (root) {
    var p = V.plane(root, {
      label: 'Seen from above: the crests are lines perpendicular to k, and only the part of r along k matters.',
      unit: 40, cx: 60, cy: 176, xLabel: 'x', yLabel: 'y'
    });
    var ka = 0.62;                                     /* direction of k */
    var kx = Math.cos(ka), ky = Math.sin(ka);
    var r = [2.4, 1.9];
    var proj = r[0] * kx + r[1] * ky;
    function crest(i, op) {
      /* A crest is the whole line perpendicular to k at a fixed projection. */
      var d = 1.15 * i;
      return { key: 'c' + i, x0: kx * d - ky * 4, y0: ky * d + kx * 4,
               x1: kx * d + ky * 4, y1: ky * d - kx * 4, tone: 'ghost', op: op, solid: true };
    }
    function st(crestOp, footOp, lineOp, label) {
      var legs = [];
      for (var i = 0; i <= 3; i++) legs.push(crest(i, crestOp * (i ? 0.55 : 0.9)));
      if (footOp) {
        legs.push({ key: 'f', x0: r[0], y0: r[1], x1: kx * proj, y1: ky * proj,
                    tone: 'prob', op: footOp });
      }
      return {
        grid: false,
        legs: legs,
        rays: lineOp ? [{ key: 'perp', x: -ky, y: kx, tone: 'quantum', op: lineOp * 0.5 }] : [],
        arrows: [
          { key: 'k', ox: 0, oy: 0, x: kx * 1.6, y: ky * 1.6, tone: 'wave', width: 2.8 },
          { key: 'r', ox: 0, oy: 0, x: r[0], y: r[1], tone: 'ink', width: 2.2 },
          { key: 'pr', ox: 0, oy: 0, x: kx * proj, y: ky * proj, tone: 'prob', width: 2, op: footOp }
        ],
        marks: [{ key: 'ra', kind: 'right', x: kx * proj, y: ky * proj,
                  a0: ka, a1: ka + Math.PI / 2, s: 8, tone: 'prob', op: footOp }],
        notes: [
          { key: 'k', x: kx * 1.9, y: ky * 1.9, text: 'k', tone: 'wave' },
          { key: 'r', x: r[0] * 0.62 - 0.42, y: r[1] * 0.62 + 0.2, text: 'r', tone: 'ink' },
          { key: 'p', x: kx * proj * 0.55 + 0.55, y: ky * proj * 0.55 - 0.5,
            text: footOp ? 'k·r' : '', tone: 'prob', op: footOp },
          { key: 'l', cap: true, text: label, tone: 'ghost' }
        ]
      };
    }
    var states = [
      st(0, 0, 0, 'where is the phase fixed?'),
      st(0, 1, 0, 'only the part of r along k'),
      st(0, 1, 1, 'a whole line of points qualifies'),
      st(1, 0.4, 0.3, 'crests: flat sheets across k')
    ];
    return { update: function (k, f) { p.set(V.at(states, k, f)); } };
  });

  A.viz('tw-wave-equation', function (root) {
    var panes = V.split(root, 2, [1, 0.55]);
    var cu = V.curves(panes[0], {
      label: 'The wave, and its two second derivatives drawn over each other.',
      rows: 2, w: 320, h: 152, x0: 0, x1: XL,
      ranges: [[-1.3, 1.3], [-1.3, 1.3]], xLabel: 'x'
    });
    var dp = V.curves(panes[1], {
      label: 'The relation between ω and k the wave equation forces.',
      w: 320, h: 84, x0: 0, x1: 2.4, ranges: [[0, 2.4]], xLabel: 'k'
    });
    var states = [
      { tt: 1, xx: 0, mark: 1, line: 0, label: 'twice in time: −ω² times the wave' },
      { tt: 1, xx: 1, mark: 1, line: 0, label: 'twice in space: −k² times it' },
      { tt: 1, xx: 1, mark: 0, line: 0, label: 'the cosine is a common factor' },
      { tt: 1, xx: 1, mark: 0, line: 1, label: 'so ω = vk, at every k' }
    ];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        var ph = t * 0.9, mx = XL * 0.32;
        function y(x) { return Math.cos(x - ph); }
        cu.set({
          curves: [
            { key: 'y', pts: V.samp(y, 0, XL), tone: 'wave', width: 2.2 },
            /* Both are −(the wave), scaled: drawn one over the other, they are
               the same curve, which is the whole condition. */
            { key: 'tt', row: 1, pts: V.samp(function (x) { return -y(x); }, 0, XL),
              tone: 'quantum', width: 3.2, op: s.tt },
            { key: 'xx', row: 1, pts: V.samp(function (x) { return -y(x); }, 0, XL),
              tone: 'prob', width: 1.6, dash: true, op: s.xx }
          ],
          marks: [
            { key: 'v', kind: 'vline', x: mx, tone: 'ghost', op: s.mark },
            { key: 'd', kind: 'dot', x: mx, y: y(mx), tone: 'ink', r: 4, op: s.mark },
            { key: 'd2', kind: 'dot', row: 1, x: mx, y: -y(mx), tone: 'ink', r: 4, op: s.mark }
          ],
          notes: [
            { key: 'a', row: 1, x: XL * 0.86, y: 1.0, text: 'ÿ / ω²', tone: 'quantum', op: s.tt },
            { key: 'b', row: 1, x: XL * 0.86, y: -1.0, text: "y'' / k²", tone: 'prob', op: s.xx },
            { key: 'l', cap: true, text: s.label, tone: 'ghost' }
          ]
        });
        dp.set({
          curves: [{ key: 'w', tone: 'wave', width: 2.2, op: s.line,
                     pts: V.samp(function (kk) { return kk; }, 0, 2.4) }],
          notes: [{ key: 'n', cap: true, text: s.line ? 'ω = vk' : '', tone: 'wave', op: s.line }]
        });
      }
    };
  });
})(window.A = window.A || {});
