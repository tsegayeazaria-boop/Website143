/* ============================================================================
   viz/2-8.js — the pictures beside §2.8's derivations.

   One opening, and every point of it a source. The pairing argument and the
   arc-and-chord argument reach the same minima from opposite directions, so
   both are drawn and the last picture puts their answers on the same axis.
   ========================================================================= */
(function (A) {
  'use strict';
  var V = A.viz, P = A.phys, M = A.math;
  var AW = 0.78;                                   /* the opening, in half-screens */

  function slit(w) { return [{ key: 'a', y: 0, w: w == null ? AW : w }]; }
  function pattern(aOverLam, n) {
    var pts = [];
    for (var i = 0; i <= (n || 80); i++) {
      var sinT = (1 - 2 * i / (n || 80)) * 0.55;
      pts.push(P.singleSlit(sinT, aOverLam));
    }
    return pts;
  }
  function paint(aOverLam, n) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var y0 = 1 - 2 * i / n, y1 = 1 - 2 * (i + 1) / n;
      out.push({ y0: y0, y1: y1, i: P.singleSlit((y0 + y1) / 2 * 0.55, aOverLam), tone: 'wave' });
    }
    return out;
  }

  /* ------------------------------------------------------- pairing off ---- */
  A.viz('ss-minima', function (root) {
    var panes = V.split(root, 2, [1, 0.6]);
    var ap = V.aperture(panes[0], {
      label: 'Every source in the top half paired with one exactly half a slit below it.',
      w: 320, h: 142
    });
    var pc = V.plane(panes[1], {
      label: 'Each pair, as two arrows pointing opposite ways.',
      w: 320, h: 92, unit: 30, cx: 160, cy: 46, axes: false
    });
    var N = 5;
    function pairs(k, op) {
      /* One bracket joins a source in the top half to its partner a/2 below. */
      var out = [];
      for (var i = 0; i < N; i++) {
        var yTop = AW / 2 * (1 - i / N) - 0.02;
        var lit = i <= k ? 1 : 0.18;
        out.push({ key: 'p' + i, kind: 'seg', dash: false, x0: -0.02, y0: yTop,
                   x1: -0.02, y1: yTop - AW / 2, tone: 'prob', op: op * lit });
      }
      return out;
    }
    var states = [
      { pair: 1, k: 0, arrows: 0, band: 0, quarters: 0, label: 'top source and the middle one' },
      { pair: 1, k: 0, arrows: 1, band: 0, quarters: 0, label: 'half a wavelength apart: they cancel' },
      { pair: 1, k: 4, arrows: 1, band: 0, quarters: 0, label: 'and so does every other pair' },
      { pair: 0.5, k: 4, arrows: 0.3, band: 1, quarters: 0, label: 'a sin θ = λ: the first dark direction' },
      { pair: 0.3, k: 4, arrows: 0.2, band: 1, quarters: 1, label: 'four strips give the next one' }
    ];
    return {
      update: function (kk, f) {
        var s = V.at(states, kk, f);
        var idx = M.clamp(f > 0.5 ? kk + 1 : kk, 0, 4);
        ap.set({
          slits: slit(),
          rays: [
            { key: 'a', y0: AW / 2 - 0.02, y1: 0.72, tone: 'wave', op: s.pair },
            { key: 'b', y0: 0, y1: 0.72, tone: 'quantum', op: s.pair }
          ],
          marks: pairs(states[idx].k, s.pair),
          pattern: paint(2.6, 40), paintOp: s.band, paintW: 12,
          curves: [{ key: 'i', pts: pattern(states[idx].quarters ? 4.2 : 2.6), tone: 'wave',
                     scale: 22, op: s.band }],
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
        /* The pair's two arrows: equal length, exactly opposite. */
        var arr = [];
        for (var i = 0; i < N; i++) {
          var lit = i <= states[idx].k ? 1 : 0.15;
          var x = -1.9 + i * 0.95;
          arr.push({ key: 'u' + i, ox: x, oy: 0, x: x, y: 0.62, tone: 'wave',
                     width: 2.2, op: s.arrows * lit });
          arr.push({ key: 'd' + i, ox: x + 0.14, oy: 0, x: x + 0.14, y: -0.62, tone: 'quantum',
                     width: 2.2, op: s.arrows * lit });
        }
        pc.set({ grid: false, arrows: arr,
                 notes: [{ key: 'n', px: 160, py: 88,
                           text: s.arrows > 0.5 ? 'every pair sums to nothing' : '', tone: 'prob',
                           op: s.arrows }] });
      }
    };
  });

  /* ------------------------------------------ narrower slit, wider band --- */
  A.viz('ss-width', function (root) {
    var ap = V.aperture(root, {
      label: 'The central band, from the first dark direction on one side to the other.'
    });
    function st(a, fanOp, calOp, label) {
      var aOverLam = a / 0.3;
      var sin1 = Math.min(0.95, 1 / aOverLam);
      return {
        slits: slit(a),
        fan: fanOp ? [{ key: 'f', from: 0, y0: sin1 / 0.55, y1: -sin1 / 0.55,
                        tone: 'wave', op: 0.16 * fanOp }] : [],
        rays: [
          { key: 'u', y0: 0, y1: sin1 / 0.55, tone: 'quantum', op: fanOp },
          { key: 'd', y0: 0, y1: -sin1 / 0.55, tone: 'quantum', op: fanOp }
        ],
        marks: [{ key: 'w', kind: 'vcaliper', x: 0.94, y0: sin1 / 0.55, y1: -sin1 / 0.55,
                  tone: 'prob', op: calOp }],
        pattern: paint(aOverLam, 40), paintOp: 1, paintW: 12,
        curves: [{ key: 'i', pts: pattern(aOverLam), tone: 'wave', scale: 22 }],
        notes: [
          { key: 'w', x: 0.86, y: 0, text: calOp ? '2λL/a' : '', tone: 'prob', op: calOp, anchor: 'end' },
          { key: 'l', cap: true, text: label, tone: 'ghost' }
        ]
      };
    }
    var states = [st(0.78, 1, 0, 'out to the first minimum each way'),
                  st(0.78, 1, 1, 'at small angles, sin θ ≈ θ'),
                  st(0.34, 1, 1, 'narrower slit, wider band')];
    return { update: function (k, f) { ap.set(V.at(states, k, f)); } };
  });

  A.viz('ss-limit', function (root) {
    var ap = V.aperture(root, {
      label: 'The first dark direction swinging out to the side as the slit narrows.'
    });
    function st(a, arcOp, wideOp, label) {
      var aOverLam = Math.max(1.02, a / 0.3);
      var sin1 = Math.min(0.999, 1 / aOverLam);
      var ang = Math.asin(sin1);
      return {
        slits: slit(a),
        rays: [{ key: 'u', y0: 0, y1: Math.tan(Math.min(ang, 1.35)) * 1.6, tone: 'quantum' }],
        marks: [{ key: 'arc', kind: 'arc', x: 0, y: 0, r: 46, a0: 0, a1: ang, tone: 'prob', op: arcOp }],
        fan: wideOp ? [{ key: 'f', from: 0, y0: 1, y1: -1, tone: 'wave', op: 0.2 * wideOp }] : [],
        pattern: paint(aOverLam, 40), paintOp: 1 - wideOp * 0.4, paintW: 12,
        curves: [{ key: 'i', pts: pattern(aOverLam), tone: 'wave', scale: 22 }],
        notes: [{ key: 'l', cap: true, text: label, tone: 'ghost' }]
      };
    }
    var states = [
      st(0.9, 1, 0, 'the first minimum, at λ/a'),
      st(0.5, 1, 0, 'narrower: it swings out'),
      st(0.31, 1, 0, 'at a = λ it reaches ninety degrees'),
      st(0.3, 0.3, 1, 'no dark direction left: the whole half-space')
    ];
    return { update: function (k, f) { ap.set(V.at(states, k, f)); } };
  });

  /* ------------------------------------------------- the arc and chord ---- */
  /* The strips' arrows, chained. As the angle grows the chain curls up; when
     it closes into a full circle the chord is zero, which is the first minimum
     the pairing argument found from the other side. */
  A.viz('ss-integral', function (root) {
    var panes = V.split(root, 2, [1, 0.5]);
    var pl = V.plane(panes[0], {
      label: 'Every strip an arrow, chained tip to tail; the chord across them is the amplitude.',
      w: 320, h: 150, unit: 30, cx: 34, cy: 104, axes: false
    });
    var cu = V.curves(panes[1], {
      label: 'The chord, plotted against β.', w: 320, h: 92,
      x0: -9, x1: 9, ranges: [[-0.35, 1.15]], xLabel: 'β'
    });
    var N = 16;
    function chain(beta) {
      var legs = [], x = 0, y = 0, i;
      var step = beta * 2 / N;
      for (i = 0; i < N; i++) {
        var ang = -beta + step * (i + 0.5);
        /* Fixed total arc length: as the spread of angles grows the chain
           curls into a tighter circle and the chord across it shortens. */
        var dx = Math.cos(ang) * 8 / N, dy = Math.sin(ang) * 8 / N;
        legs.push({ key: 'a' + i, x0: x, y0: y, x1: x + dx, y1: y + dy,
                    tone: 'wave', solid: true });
        x += dx; y += dy;
      }
      return { legs: legs, end: [x, y] };
    }
    function st(beta, chordOp, label) {
      var c = chain(beta);
      return {
        pl: {
          grid: false,
          legs: c.legs,
          arrows: [{ key: 'ch', ox: 0, oy: 0, x: c.end[0], y: c.end[1], tone: 'prob',
                     width: 2.8, op: chordOp }],
          notes: [
            { key: 'c', x: c.end[0] * 0.5 + 0.1, y: c.end[1] * 0.5 - 0.6,
              text: chordOp ? 'chord' : '', tone: 'prob', op: chordOp },
            { key: 'l', cap: true, text: label, tone: 'ghost' }
          ]
        },
        beta: beta
      };
    }
    var SINC = V.samp(function (b) { return Math.abs(M.sinc(b)); }, -9, 9);
    var states = [
      st(0.05, 0, 'one strip, then all of them'),
      st(1.1, 1, 'the chain curls up'),
      st(Math.PI - 0.02, 1, 'a closed circle: chord zero'),
      st(2.1, 1, 'the chord against β is a sinc')
    ];
    return {
      update: function (k, f) {
        var s = V.at(states, k, f);
        pl.set(s.pl);
        cu.set({
          curves: [{ key: 's', pts: SINC, tone: 'wave', width: 2.2 }],
          marks: [{ key: 'b', kind: 'dot', x: s.beta, y: Math.abs(M.sinc(s.beta)), tone: 'prob', r: 4 }],
          notes: [{ key: 'z', x: Math.PI, y: 0, dy: 14, text: 'β = π', tone: 'ghost' }]
        });
      }
    };
  });

  A.viz('ss-intensity', function (root) {
    var panes = V.split(root, 2, [1, 0.72]);
    var ap = V.aperture(panes[0], { label: 'The pattern on the screen.', w: 320, h: 130 });
    var cu = V.curves(panes[1], {
      label: 'The curve, with the pairing argument’s minima dropped onto the same axis.',
      w: 320, h: 104, x0: -9, x1: 9, ranges: [[-0.22, 1.15]], xLabel: 'β'
    });
    var I = V.samp(function (b) { return Math.pow(M.sinc(b), 2); }, -9, 9);
    var states = [
      { ticks: 0, pair: 0, centre: 0, label: 'brightness is the square' },
      { ticks: 1, pair: 0, centre: 0, label: 'zeros where sin β does' },
      { ticks: 1, pair: 1, centre: 0, label: 'the pairing minima land on them' },
      { ticks: 1, pair: 1, centre: 1, label: 'and at β = 0 the ratio is one' }
    ];
    return {
      update: function (k, f) {
        var s = V.at(states, k, f);
        var marks = [];
        [1, 2].forEach(function (n) {
          [1, -1].forEach(function (sg) {
            marks.push({ key: 't' + n + sg, kind: 'dot', x: sg * n * Math.PI, y: 0,
                         tone: 'quantum', r: 3.4, op: s.ticks });
            marks.push({ key: 'p' + n + sg, kind: 'dot', x: sg * n * Math.PI, y: -0.13,
                         tone: 'prob', r: 3.4, op: s.pair });
          });
        });
        marks.push({ key: 'c', kind: 'dot', x: 0, y: 1, tone: 'ink', r: 4, op: s.centre });
        ap.set({
          slits: slit(),
          pattern: paint(2.6, 40), paintOp: 1, paintW: 12,
          curves: [{ key: 'i', pts: pattern(2.6), tone: 'wave', scale: 22 }],
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
        cu.set({
          curves: [{ key: 'I', pts: I, tone: 'wave', width: 2.2 }],
          marks: marks,
          notes: [
            { key: 'p', x: -4.6, y: -0.13, dy: 12, text: s.pair ? 'from pairing' : '', tone: 'prob', op: s.pair },
            { key: 'c', x: 1.4, y: 1, text: s.centre ? 'twice as wide' : '', tone: 'ink',
              op: s.centre, anchor: 'start' }
          ]
        });
      }
    };
  });

  A.viz('ss-transform', function (root) {
    var panes = V.split(root, 2, [1, 1]);
    var ap = V.curves(panes[0], {
      label: 'The aperture, as a function that is one where light gets through.',
      w: 320, h: 110, x0: -2.4, x1: 2.4, ranges: [[-0.2, 1.25]], xLabel: 'x'
    });
    var pt = V.curves(panes[1], {
      label: 'Its transform, which is the pattern.', w: 320, h: 110,
      x0: -9, x1: 9, ranges: [[-0.35, 1.15]], xLabel: 'k sin θ'
    });
    function rect(a) { return function (x) { return Math.abs(x) < a / 2 ? 1 : 0; }; }
    function two(a, d) {
      return function (x) {
        return (Math.abs(x - d) < a / 2 || Math.abs(x + d) < a / 2) ? 1 : 0;
      };
    }
    var states = [
      { f: rect(1.6), t: function (b) { return M.sinc(b * 0.8); }, label: '1 inside, 0 outside' },
      { f: rect(1.6), t: function (b) { return M.sinc(b * 0.8); }, label: 'the axis is a direction' },
      { f: two(0.5, 0.9), t: function (b) { return M.sinc(b * 0.25) * Math.cos(b * 0.9); },
        label: 'two slits: fringes under a sinc' }
    ];
    return {
      update: function (k, f) {
        var s = V.at(states, k, f);
        var idx = M.clamp(f > 0.5 ? k + 1 : k, 0, 2);
        var F = V.samp(states[idx].f, -2.4, 2.4);
        var T = V.samp(states[idx].t, -9, 9);
        ap.set({
          curves: [{ key: 'f', pts: F, tone: 'ink', width: 2.2 }],
          fills: [{ key: 'f', pts: F, tone: 'wave', op: 0.22 }],
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
        pt.set({
          curves: [{ key: 't', pts: T, tone: 'wave', width: 2.2 }],
          marks: [{ key: 'z', kind: 'hline', y: 0, tone: 'ghost' }]
        });
      }
    };
  });

  A.viz('ss-uncertainty', function (root) {
    var panes = V.split(root, 2, [1, 0.4]);
    var ap = V.aperture(panes[0], {
      label: 'The slit as a position measurement, and the spread of directions it forces.',
      w: 320, h: 150
    });
    var bar = V.curves(panes[1], {
      label: 'The product, which does not move.', w: 320, h: 82,
      x0: 0.4, x1: 3.6, ranges: [[0, 1.35]], xLabel: ''
    });
    function st(a, unitsOp, label) {
      var aOverLam = Math.max(1.05, a / 0.3);
      var sin1 = Math.min(0.95, 1 / aOverLam);
      return {
        ap: {
          slits: slit(a),
          fan: [{ key: 'f', from: 0, y0: sin1 / 0.55, y1: -sin1 / 0.55, tone: 'wave', op: 0.16 }],
          marks: [
            { key: 'x', kind: 'vcaliper', x: -0.06, y0: a / 2, y1: -a / 2, tone: 'quantum' },
            { key: 'k', kind: 'vcaliper', x: 0.94, y0: sin1 / 0.55, y1: -sin1 / 0.55, tone: 'prob' }
          ],
          pattern: paint(aOverLam, 40), paintOp: 1, paintW: 10,
          curves: [{ key: 'i', pts: pattern(aOverLam), tone: 'wave', scale: 20 }],
          notes: [
            { key: 'x', x: -0.14, y: 0, text: 'Δx', tone: 'quantum', anchor: 'end' },
            { key: 'k', x: 0.86, y: 0, text: unitsOp > 0.5 ? 'Δp/ℏ' : 'Δk', tone: 'prob', anchor: 'end' },
            { key: 'l', cap: true, text: label, tone: 'ghost' }
          ]
        },
        a: a, unitsOp: unitsOp
      };
    }
    var states = [
      st(0.9, 0, 'it was somewhere inside the slit'),
      st(0.55, 0, 'and its sideways spread is λ/a'),
      st(0.34, 0, 'the slit width cancels'),
      st(0.34, 1, 'ΔxΔp ≈ h')
    ];
    return {
      update: function (k, f) {
        var s = V.at(states, k, f);
        ap.set(s.ap);
        bar.set({
          bars: [
            { key: 'x', x: 1, y: s.a, w: 0.4, tone: 'quantum', op: 0.55 },
            { key: 'k', x: 2, y: 0.32 / s.a, w: 0.4, tone: 'prob', op: 0.55 },
            { key: 'p', x: 3, y: 0.32, w: 0.4, tone: 'wave', op: 0.6 }
          ],
          marks: [{ key: 'l', kind: 'hline', y: 0.32, tone: 'wave', op: 0.5 }],
          notes: [
            { key: 'a', x: 1, y: 0, dy: 14, text: 'Δx', tone: 'quantum' },
            { key: 'b', x: 2, y: 0, dy: 14, text: s.unitsOp > 0.5 ? 'Δp' : 'Δk', tone: 'prob' },
            { key: 'c', x: 3, y: 0, dy: 14, text: 'product', tone: 'wave' }
          ]
        });
      }
    };
  });
})(window.A = window.A || {});
