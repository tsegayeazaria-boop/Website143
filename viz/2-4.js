/* ============================================================================
   viz/2-4.js — the pictures beside §2.4's derivations.

   One bench: two strings of different weight, meeting at a knot. The heavier
   side is drawn heavier, the join is drawn as a join, and every coefficient on
   the page comes from A.phys.stringRT, so the picture and the algebra are
   reading the same numbers rather than agreeing by construction.
   ========================================================================= */
(function (A) {
  'use strict';
  var V = A.viz, P = A.phys, M = A.math;
  var X0 = -6, X1 = 6;
  function sm(fn) { return V.samp(fn, X0, X1); }
  var FLAT = sm(function () { return 0; });

  /* An asymmetric pulse: a shark fin, so the front-to-back reversal that
     §2.4's last derivations are about is something the reader can see. The
     symmetric Gaussian the demo uses cannot show it at all. */
  function fin(u) {
    if (u < -1.6 || u > 1.1) return 0;
    var s = (u + 1.6) / 2.7;
    return Math.pow(Math.sin(Math.PI * s), 1.6) * (0.45 + 0.55 * s);
  }
  function bump(u) { return Math.exp(-u * u * 1.6); }

  /* The three pieces of the picture, at one instant: what came in, what came
     back, and what went on. */
  function pieces(shape, mu2, t, amp) {
    var st = P.stringRT(1, mu2, 1);
    var v1 = st.v1, v2 = st.v2;
    return {
      st: st,
      inc: function (x) { return x <= 0 ? amp * shape(x - v1 * t + 3.2) : 0; },
      ref: function (x) { return x <= 0 ? amp * st.R * shape(-x - v1 * t + 3.2) : 0; },
      tra: function (x) { return x > 0 ? amp * st.T * shape(x * v1 / v2 - v1 * t + 3.2) : 0; }
    };
  }

  function stringViz(root, opts) {
    opts = opts || {};
    return V.curves(root, {
      label: opts.label || 'Two strings joined at a knot.',
      w: 320, h: opts.h || 140, rows: opts.rows || 1, x0: X0, x1: X1,
      ranges: opts.ranges || [[-1.25, 1.25]], xLabel: 'x'
    });
  }
  /* The two sides drawn at their own weight: thick for heavy, thin for light. */
  function strings(mu2, yFn, op) {
    return [
      { key: 'L', pts: sm(function (x) { return x <= 0 ? yFn(x) : 0; }),
        tone: 'wave', width: 2.4, op: op },
      { key: 'R', pts: sm(function (x) { return x > 0 ? yFn(x) : 0; }),
        tone: 'wave', width: 2.4 * Math.sqrt(mu2), op: op }
    ];
  }
  function joinMark(op) {
    return [{ key: 'j', kind: 'join', x: 0, y: 0, tone: 'ink', op: op == null ? 1 : op }];
  }

  /* -------------------------------------------- Newton for a short piece --- */
  A.viz('str-wave-eq', function (root) {
    var panes = V.split(root, 2, [1, 0.6]);
    var pl = V.plane(panes[0], {
      label: 'A magnified piece of string, pulled at both ends along its own direction.',
      w: 320, h: 138, unit: 52, cx: 160, cy: 92, axes: false
    });
    var cu = stringViz(panes[1], { h: 86, label: 'The whole string, and the pulse it carries.' });
    /* The piece, drawn as a curved segment with the tension tangent at each end. */
    var dx = 1.1;
    function seg(curv) {
      var pts = [], i, x;
      for (i = 0; i <= 14; i++) { x = -dx + 2 * dx * i / 14; pts.push([x, curv * (x * x - dx * dx) * 0.55]); }
      return pts;
    }
    function slopeAt(curv, x) { return curv * 2 * x * 0.55; }
    function st(curv, netOp, massOp, fineOp, label) {
      var sL = slopeAt(curv, -dx), sR = slopeAt(curv, dx);
      var pts = seg(curv);
      return {
        grid: false,
        legs: pts.slice(1).map(function (p, i) {
          return { key: 's' + i, x0: pts[i][0], y0: pts[i][1], x1: p[0], y1: p[1],
                   tone: 'wave', solid: true };
        }),
        arrows: [
          { key: 'tl', ox: -dx, oy: pts[0][1], x: -dx - 0.8, y: pts[0][1] - sL * 0.8,
            tone: 'quantum', width: 2.2 },
          { key: 'tr', ox: dx, oy: pts[14][1], x: dx + 0.8, y: pts[14][1] + sR * 0.8,
            tone: 'quantum', width: 2.2 },
          /* What is left over sideways once the two pulls are added. */
          { key: 'net', ox: 0, oy: pts[7][1], x: 0, y: pts[7][1] + (sR - sL) * 0.9,
            tone: 'fail', width: 2.6, op: netOp }
        ],
        marks: [{ key: 'dx', kind: 'caliper', x0: -dx, x1: dx, y: -0.95, tick: 4,
                  tone: 'ghost', op: massOp }],
        notes: [
          { key: 'dx', x: 0, y: -0.95, dy: -6, text: massOp ? 'Δx,  mass μΔx' : '',
            tone: 'ghost', op: massOp },
          { key: 'n', x: 0.42, y: pts[7][1] + (sR - sL) * 0.5, text: netOp ? 'net' : '',
            tone: 'fail', op: netOp, anchor: 'start' },
          { key: 'f', cap: true, text: label, tone: 'ghost' }
        ]
      };
    }
    var states = [
      st(0.9, 0, 0, 0, 'the two pulls differ because it is curved'),
      st(0.9, 1, 0, 0, 'the difference of slopes is the curvature'),
      st(0.9, 1, 1, 0, 'mass μΔx'),
      st(0.55, 1, 1, 1, 'chop it finer: the same answer'),
      st(0.55, 0.5, 0.4, 1, 'v = √(T/μ)')
    ];
    return {
      animates: true,
      update: function (k, f, t) {
        pl.set(V.at(states, k, f));
        var u = ((t * 1.1) % 9) - 4.5;
        cu.set({
          curves: [{ key: 'y', pts: sm(function (x) { return bump(x - u); }), tone: 'wave', width: 2.2 }]
        });
      }
    };
  });

  /* ----------------------------------------------- what the knot insists -- */
  /* Two derivations, one close-up: along the string for the tension, across it
     for the slope. In both the knot has no mass, so any leftover force would
     accelerate it without limit. */
  function knotViz(root, sideways) {
    var pl = V.plane(root, {
      label: sideways ? 'The knot, pulled sideways by the two slopes.'
                      : 'The knot, pulled lengthways by the two tensions.',
      unit: 58, cx: 160, cy: 120, axes: false
    });
    return pl;
  }

  A.viz('str-same-tension', function (root) {
    var pl = knotViz(root, false);
    function st(t1, t2, netOp, massOp, label) {
      return {
        grid: false,
        legs: [
          { key: 'l', x0: -2.2, y0: 0, x1: 0, y1: 0, tone: 'wave', solid: true },
          { key: 'r', x0: 0, y0: 0, x1: 2.2, y1: 0, tone: 'wave', solid: true }
        ],
        arrows: [
          { key: 'T1', ox: 0, oy: 0.3, x: -t1, y: 0.3, tone: 'quantum', width: 2.4 },
          { key: 'T2', ox: 0, oy: 0.3, x: t2, y: 0.3, tone: 'quantum', width: 2.4 },
          { key: 'net', ox: 0, oy: -0.45, x: t2 - t1, y: -0.45, tone: 'fail', width: 2.6, op: netOp }
        ],
        dots: [{ key: 'k', x: 0, y: 0, tone: 'ink', r: 5 }],
        notes: [
          { key: 'T1', x: -t1 * 0.6, y: 0.3, dy: -8, text: 'T₁', tone: 'quantum' },
          { key: 'T2', x: t2 * 0.6, y: 0.3, dy: -8, text: 'T₂', tone: 'quantum' },
          { key: 'm', x: 0, y: 0, dy: 24, text: massOp ? 'mass → 0' : '', tone: 'ink', op: massOp },
          { key: 'n', x: (t2 - t1) * 0.6, y: -0.45, dy: 14, text: netOp ? 'would run away' : '',
            tone: 'fail', op: netOp },
          { key: 'l', cap: true, text: label, tone: 'ghost' }
        ]
      };
    }
    var states = [
      st(1.5, 0.85, 1, 0, 'unequal pulls, and the knot accelerates'),
      st(1.5, 0.85, 1, 1, 'but it has no mass'),
      st(1.2, 1.2, 0, 1, 'so the two must be equal')
    ];
    return { update: function (k, f) { pl.set(V.at(states, k, f)); } };
  });

  A.viz('str-slope-continuous', function (root) {
    var pl = knotViz(root, true);
    function st(sL, sR, netOp, massOp, label) {
      return {
        grid: false,
        legs: [
          { key: 'l', x0: -2.2, y0: -sL * 2.2, x1: 0, y1: 0, tone: 'wave', solid: true },
          { key: 'r', x0: 0, y0: 0, x1: 2.2, y1: sR * 2.2, tone: 'wave', solid: true }
        ],
        arrows: [
          { key: 'fl', ox: -0.9, oy: -sL * 0.9, x: -0.9, y: -sL * 0.9 - 0.7 * sL, tone: 'quantum', width: 2 },
          { key: 'fr', ox: 0.9, oy: sR * 0.9, x: 0.9, y: sR * 0.9 + 0.7 * sR, tone: 'quantum', width: 2 },
          { key: 'net', ox: 0, oy: 0, x: 0, y: (sR - sL) * 1.4, tone: 'fail', width: 2.6, op: netOp }
        ],
        dots: [{ key: 'k', x: 0, y: 0, tone: 'ink', r: 5 }],
        notes: [
          { key: 'm', x: 0, y: 0, dy: 26, text: massOp ? 'no mass to accelerate' : '',
            tone: 'ink', op: massOp },
          { key: 'n', x: 0.5, y: (sR - sL) * 0.9, text: netOp ? 'runs away' : '',
            tone: 'fail', op: netOp, anchor: 'start' },
          { key: 'l', cap: true, text: label, tone: 'ghost' }
        ]
      };
    }
    var states = [
      st(0.62, -0.2, 1, 0, 'a kink: the two slopes differ'),
      st(0.62, -0.2, 1, 1, 'on a massless knot'),
      st(0.3, 0.3, 0, 1, 'so it straightens: same slope both sides')
    ];
    return { update: function (k, f) { pl.set(V.at(states, k, f)); } };
  });

  /* ------------------------------------------------- crossing the join ---- */
  A.viz('str-wavelength-ratio', function (root) {
    var cu = stringViz(root, { h: 220,
      label: 'One frequency, two wavelengths: the crests crowd on the heavy side.' });
    var MU = 3.1;
    var st2 = P.stringRT(1, MU, 1);
    var k1 = 1.5, k2 = k1 * st2.v1 / st2.v2;
    var states = [
      { ruler: 0, mu: MU, label: 'the knot drives both sides' },
      { ruler: 0, mu: MU, label: 'but the speeds differ' },
      { ruler: 1, mu: MU, label: 'so the wavelengths do' }
    ];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        var w = k1 * st2.v1;
        function y(x) {
          return 0.75 * (x <= 0 ? Math.cos(k1 * x - w * t) : Math.cos(k2 * x - w * t));
        }
        cu.set({
          curves: strings(s.mu, y, 1),
          hardware: joinMark(1),
          marks: [
            { key: 'r1', kind: 'caliper', x0: -5.2, x1: -5.2 + Math.PI * 2 / k1, y: -1.05,
              tone: 'prob', op: s.ruler },
            { key: 'r2', kind: 'caliper', x0: 0.6, x1: 0.6 + Math.PI * 2 / k2, y: -1.05,
              tone: 'prob', op: s.ruler },
            { key: 'kd', kind: 'dot', x: 0, y: y(0), tone: 'quantum', r: 4.2 }
          ],
          notes: [
            { key: 'r1', x: -5.2 + Math.PI / k1, y: -1.05, dy: -6, text: s.ruler ? 'λ₁' : '',
              tone: 'prob', op: s.ruler },
            { key: 'r2', x: 0.6 + Math.PI / k2, y: -1.05, dy: -6, text: s.ruler ? 'λ₂' : '',
              tone: 'prob', op: s.ruler },
            { key: 'l', cap: true, text: s.label, tone: 'ghost' }
          ]
        });
      }
    };
  });

  /* ------------------------------------------- the two boundary conditions - */
  function bcViz(root, label) {
    return stringViz(root, { h: 220, rows: 2, ranges: [[-1.15, 1.15], [-1.15, 1.15]], label: label });
  }
  function bcState(mu2, t, shape, showPieces, tangents, extra) {
    var p = pieces(shape, mu2, t, 0.8);
    var left = function (x) { return p.inc(x) + p.ref(x); };
    var total = function (x) { return x <= 0 ? left(x) : p.tra(x); };
    var out = {
      curves: strings(mu2, total, 1).concat([
        { key: 'i', row: 1, pts: sm(p.inc), tone: 'quantum', width: 1.6, dash: true, op: showPieces },
        { key: 'r', row: 1, pts: sm(p.ref), tone: 'fail', width: 1.6, dash: true, op: showPieces },
        { key: 't', row: 1, pts: sm(p.tra), tone: 'prob', width: 1.6, dash: true, op: showPieces }
      ]),
      hardware: joinMark(1).concat([{ key: 'j2', kind: 'join', row: 1, x: 0, y: 0, tone: 'ink', op: showPieces }]),
      marks: [{ key: 'd', kind: 'dot', x: 0, y: total(0), tone: 'ink', r: 4.4 }],
      notes: []
    };
    if (tangents) {
      var h = 0.28;
      var sl = (left(-0.001) - left(-0.6)) / 0.6, sr = (p.tra(0.6) - p.tra(0.001)) / 0.6;
      out.marks.push({ key: 'tl', kind: 'seg', dash: false, x0: -1.5, y0: total(0) - sl * 1.5,
                       x1: 0, y1: total(0), tone: 'quantum', op: tangents });
      out.marks.push({ key: 'tr', kind: 'seg', dash: false, x0: 0, y0: total(0),
                       x1: 1.5, y1: total(0) + sr * 1.5, tone: 'prob', op: tangents });
      void h;
    }
    if (extra) extra(out, p, total);
    return out;
  }

  A.viz('str-displacement-bc', function (root) {
    var cu = bcViz(root, 'The height at the join, counted from both sides.');
    var SHAPES = [bump, fin, function (u) { return bump(u - 0.7) + 0.8 * bump(u + 0.7); }];
    var states = [
      { pieces: 0, shape: 0, label: 'one height, two ways of writing it' },
      { pieces: 1, shape: 0, label: 'at x = 0 all three are the same instant of g' },
      { pieces: 1, shape: 2, label: 'and the shape cancels: any g will do' }
    ];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        var idx = M.clamp(f > 0.5 ? k + 1 : k, 0, 2);
        var out = bcState(3.1, (t * 0.55) % 9 - 2.5, SHAPES[states[idx].shape], s.pieces, 0);
        out.notes.push({ key: 'l', cap: true, text: s.label, tone: 'ghost' });
        cu.set(out);
      }
    };
  });

  A.viz('str-slope-bc', function (root) {
    var cu = bcViz(root, 'The slope at the join, from both sides.');
    var states = [
      { pieces: 1, tan: 0, label: 'three slopes' },
      { pieces: 1, tan: 1, label: 'the left two add to the right one' },
      { pieces: 0.35, tan: 1, label: 'no kink, whatever the shape' }
    ];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        var out = bcState(3.1, (t * 0.55) % 9 - 2.5, bump, s.pieces, s.tan);
        out.notes.push({ key: 'l', cap: true, text: s.label, tone: 'ghost' });
        cu.set(out);
      }
    };
  });

  A.viz('str-solve-RT', function (root) {
    var panes = V.split(root, 2, [1, 0.42]);
    var cu = stringViz(panes[0], { h: 150,
      label: 'The three cases: matched, into something heavier, into something lighter.' });
    var bar = V.curves(panes[1], {
      label: 'The two coefficients.', w: 320, h: 88, x0: 0.4, x1: 2.6,
      ranges: [[-1.15, 1.6]], xLabel: ''
    });
    var CASES = [1, 1, 1, 3.4, 0.28];
    var LAB = ['two equations, two unknowns', '', '', 'heavier: R negative, flipped',
               'lighter: R positive, upright'];
    return {
      animates: true,
      update: function (k, f, t) {
        var idx = M.clamp(f > 0.5 ? k + 1 : k, 0, 3);
        /* The last step runs the three cases in turn, so the reader sees the
           inversion happen rather than being told about it. */
        var mu = idx < 3 ? 3.1 : CASES[3 + (Math.floor(t / 3.2) % 2)];
        var st = P.stringRT(1, mu, 1);
        var p = pieces(bump, mu, (t * 0.55) % 9 - 2.5, 0.8);
        function total(x) { return x <= 0 ? p.inc(x) + p.ref(x) : p.tra(x); }
        cu.set({
          curves: strings(mu, total, 1),
          hardware: joinMark(1),
          notes: [{ key: 'l', cap: true, text: idx < 3 ? LAB[0] : (mu > 1 ? LAB[3] : LAB[4]),
                    tone: 'ghost' }]
        });
        bar.set({
          bars: [
            { key: 'R', x: 1, y: st.R, w: 0.42, tone: st.R < 0 ? 'fail' : 'wave', op: 0.6 },
            { key: 'T', x: 2, y: st.T, w: 0.42, tone: 'prob', op: 0.6 }
          ],
          marks: [{ key: 'z', kind: 'hline', y: 0, tone: 'ghost' }],
          notes: [
            { key: 'a', x: 1, y: 0, dy: 15, text: 'R', tone: 'ghost' },
            { key: 'b', x: 2, y: 0, dy: 15, text: '𝒯', tone: 'ghost' },
            { key: 'c', cap: true, text: '1 + R = 𝒯', tone: 'ghost' }
          ]
        });
      }
    };
  });

  /* ------------------------------------------------ impedance and power --- */
  A.viz('str-impedance', function (root) {
    var panes = V.split(root, 2, [1, 0.55]);
    var cu = stringViz(panes[0], { h: 132, label: 'The same join, read as two impedances.' });
    var bar = V.curves(panes[1], {
      label: 'How hard each side resists being shaken sideways.',
      w: 320, h: 100, x0: 0.4, x1: 2.6, ranges: [[0, 2.4]], xLabel: ''
    });
    var MU = 3.1, st = P.stringRT(1, MU, 1);
    var states = [
      { z: 1, r: 0, label: 'Z = √(Tμ)' },
      { z: 1, r: 0, label: 'a speed is a tension over an impedance' },
      { z: 1, r: 1, label: 'equal bars would mean no reflection' }
    ];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        var p = pieces(bump, MU, (t * 0.55) % 9 - 2.5, 0.8);
        function total(x) { return x <= 0 ? p.inc(x) + p.ref(x) : p.tra(x); }
        cu.set({
          curves: strings(MU, total, 1), hardware: joinMark(1),
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
        bar.set({
          bars: [
            { key: 'Z1', x: 1, y: st.Z1, w: 0.42, tone: 'wave', op: 0.55 },
            { key: 'Z2', x: 2, y: st.Z2, w: 0.42, tone: 'quantum', op: 0.55 }
          ],
          notes: [
            { key: 'a', x: 1, y: 0, dy: 15, text: 'Z₁', tone: 'wave' },
            { key: 'b', x: 2, y: 0, dy: 15, text: 'Z₂', tone: 'quantum' },
            { key: 'r', cap: true, text: s.r ? 'R = (Z₁ − Z₂)/(Z₁ + Z₂)' : '', tone: 'prob', op: s.r }
          ]
        });
      }
    };
  });

  A.viz('str-power', function (root) {
    var panes = V.split(root, 2, [1, 0.55]);
    var cu = stringViz(panes[0], { h: 132, label: 'The energy crossing the join.' });
    var bar = V.curves(panes[1], {
      label: 'Reflected plus transmitted equals incoming, at every ratio.',
      w: 320, h: 100, x0: 0.4, x1: 3.6, ranges: [[0, 1.25]], xLabel: ''
    });
    var states = [
      { mu: 3.1, split: 0, free: 0, label: 'power = force × sideways velocity' },
      { mu: 3.1, split: 0, free: 0, label: 'for a travelling wave, Z times speed squared' },
      { mu: 3.1, split: 1, free: 0, label: 'three bars' },
      { mu: 0.28, split: 1, free: 1, label: 'they always stack to one' }
    ];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        var st = P.stringRT(1, s.mu, 1);
        var p = pieces(bump, s.mu, (t * 0.55) % 9 - 2.5, 0.8);
        function total(x) { return x <= 0 ? p.inc(x) + p.ref(x) : p.tra(x); }
        cu.set({
          curves: strings(s.mu, total, 1), hardware: joinMark(1),
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
        bar.set({
          bars: [
            { key: 'in', x: 1, y: 1, w: 0.4, tone: 'wave', op: 0.55 },
            { key: 'rf', x: 2, y: st.powerR, w: 0.4, tone: 'fail', op: 0.55 * s.split },
            { key: 'tr', x: 3, y: st.powerT, w: 0.4, tone: 'prob', op: 0.55 * s.split },
            /* The two outgoing ones stacked, to be compared with the first. */
            { key: 'sum', x: 3.5, y: st.powerR + st.powerT, w: 0.16, tone: 'ink', op: 0.5 * s.split }
          ],
          marks: [{ key: 'one', kind: 'hline', y: 1, tone: 'ghost', op: s.split }],
          notes: [
            { key: 'a', x: 1, y: 0, dy: 15, text: 'in', tone: 'wave' },
            { key: 'b', x: 2, y: 0, dy: 15, text: 'reflected', tone: 'fail', op: s.split },
            { key: 'c', x: 3, y: 0, dy: 15, text: 'through', tone: 'prob', op: s.split }
          ]
        });
      }
    };
  });

  /* -------------------------------------------------- reading the answer -- */
  /* These two need the asymmetric pulse: with a symmetric bump neither the
     reversal nor the stretch can be seen at all. */
  A.viz('str-reversed', function (root) {
    var cu = stringViz(root, { h: 170,
      label: 'A lopsided pulse arriving, and coming back front to back.' });
    var MU = 1e4;                        /* effectively a fixed end: R → −1 */
    function marks(p, side, op) {
      /* Three tags along the pulse, so their order can be read off. */
      var out = [], TAG = ['1', '2', '3'];
      for (var i = 0; i < 3; i++) {
        var u = -0.9 + i * 0.85;
        var x = side > 0 ? u - 3.2 + 0 : 0;
        void x;
        out.push({ key: side + 'm' + i, kind: 'dot', x: 0, y: 0, tone: 'quantum', op: 0 });
        void TAG;
      }
      void p; void op;
      return out;
    }
    var states = [
      { tags: 0, label: 'a lopsided pulse' },
      { tags: 1, label: 'front, middle, back' },
      { tags: 1, label: 'after reflection the order is opposite' },
      { tags: 1, label: 'first to arrive, last to leave' }
    ];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        var u = (t * 0.55) % 9 - 1.2;
        var p = pieces(fin, MU, u, 0.8);
        function total(x) { return x <= 0 ? p.inc(x) + p.ref(x) : 0; }
        /* The tags ride the incoming pulse and the reflected one, so the
           reversal is watched rather than described. */
        var tags = [];
        [-0.9, 0, 0.75].forEach(function (o, i) {
          var xi = o + p.st.v1 * u - 3.2;
          var xr = -(o + p.st.v1 * u - 3.2);
          tags.push({ key: 'i' + i, kind: 'dot', x: M.clamp(xi, X0, 0), y: total(M.clamp(xi, X0, 0)),
                      tone: ['fail', 'quantum', 'prob'][i], r: 4, op: s.tags * (xi < -0.2 ? 1 : 0) });
          tags.push({ key: 'r' + i, kind: 'dot', x: M.clamp(xr, X0, 0), y: total(M.clamp(xr, X0, 0)),
                      tone: ['fail', 'quantum', 'prob'][i], r: 4, op: s.tags * (xr < -0.2 ? 1 : 0) });
        });
        cu.set({
          curves: [{ key: 'y', pts: sm(total), tone: 'wave', width: 2.4 }],
          hardware: [{ key: 'w', kind: 'wall', x: 0, y: 0, tone: 'ink' }],
          marks: tags,
          notes: [{ key: 'l', cap: true, text: s.label, tone: 'ghost' }]
        });
        void marks;
      }
    };
  });

  A.viz('str-stretch', function (root) {
    var cu = stringViz(root, { h: 170,
      label: 'The same wiggle handed through at the same rate, into a different speed.' });
    var states = [
      { mu: 3.1, cal: 0, label: 'it takes τ to pass the knot' },
      { mu: 3.1, cal: 1, label: 'length = v τ on the way in' },
      { mu: 3.1, cal: 1, label: 'and v₂ τ on the way out: squeezed' },
      { mu: 0.28, cal: 1, label: 'into a lighter string: stretched' }
    ];
    return {
      animates: true,
      update: function (k, f, t) {
        var s = V.at(states, k, f);
        var st = P.stringRT(1, s.mu, 1);
        var p = pieces(bump, s.mu, (t * 0.5) % 11 - 3, 0.75);
        function total(x) { return x <= 0 ? p.inc(x) + p.ref(x) : p.tra(x); }
        /* The two lengths are v₁τ and v₂τ with the same τ, so their ratio is
           the ratio of the speeds and nothing else. */
        var L1 = 1.5 * st.v1, L2 = 1.5 * st.v2;
        cu.set({
          curves: strings(s.mu, total, 1),
          hardware: joinMark(1),
          marks: [
            { key: 'c1', kind: 'caliper', x0: -1.2 - L1, x1: -1.2, y: -1.05, tone: 'quantum', op: s.cal },
            { key: 'c2', kind: 'caliper', x0: 1.2, x1: 1.2 + L2, y: -1.05, tone: 'prob', op: s.cal }
          ],
          notes: [
            { key: 'a', x: -1.2 - L1 / 2, y: -1.05, dy: -6, text: s.cal ? 'v₁τ' : '',
              tone: 'quantum', op: s.cal },
            { key: 'b', x: 1.2 + L2 / 2, y: -1.05, dy: -6, text: s.cal ? 'v₂τ' : '',
              tone: 'prob', op: s.cal },
            { key: 'l', cap: true, text: s.label, tone: 'ghost' }
          ]
        });
      }
    };
  });
})(window.A = window.A || {});
