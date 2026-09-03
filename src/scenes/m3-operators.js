/* Maths companion, §M.3: the four derivative operators, built one at a time,
   with a sandbox you can poke and the two identities the lecture relies on.

   Every number printed anywhere in this file comes out of A.field, which
   differentiates the field function itself. Nothing is written in by hand. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg, F = A.field;

  /* --------------------------------------------------- gradient --- */

  A.scene('gradient-machine', function (root) {
    var W = 1120, H = 560;
    var svg = S.root(W, H,
      'A scalar field with its gradient drawn as arrows. Each arrow points the way the field ' +
      'rises fastest, and is longest where the field changes most steeply.');
    S.defsArrows(svg);
    root.appendChild(svg);

    function V(x, y) { return 0.5 * (x * x + 1.6 * y * y); }

    var cx = 330, cy = 290, sc = 92;
    var PX = function (x) { return cx + x * sc; };
    var PY = function (y) { return cy - y * sc; };

    /* Level curves: exact ellipses for this V, so nothing is approximated. */
    var gLev = S.g({});
    svg.appendChild(gLev);
    for (var k = 1; k <= 5; k++) {
      var c = k * 0.42;
      gLev.appendChild(S.el('ellipse', {
        cx: cx, cy: cy, rx: c * sc * Math.sqrt(2), ry: c * sc * Math.sqrt(2 / 1.6),
        class: 's-ghost'
      }));
    }
    gLev.appendChild(S.text(cx, cy + 16, 'lowest point', 's-lbl', 'middle'));
    gLev.appendChild(S.circle(cx, cy, 3, 's-fill-i'));
    gLev.appendChild(S.text(60, 70, 'curves of constant V, and the gradient at sample points', 's-lbl', 'start'));

    var gArr = S.g({});
    svg.appendChild(gArr);
    var samples = [];
    for (var i = -2; i <= 2; i++) {
      for (var j = -2; j <= 2; j++) {
        if (i === 0 && j === 0) continue;
        samples.push([i * 0.62, j * 0.62]);
      }
    }
    var arrows = samples.map(function (s) {
      var g = F.grad(V, s[0], s[1], 1e-4);
      var a = S.arrow(svg, PX(s[0]), PY(s[1]),
                      PX(s[0]) + g[0] * 46, PY(s[1]) - g[1] * 46, 'w');
      a.setAttribute('stroke-opacity', '0.8');
      gArr.appendChild(a);
      return a;
    });

    /* A marble released rolls the other way: down minus the gradient. */
    var gBall = S.g({});
    svg.appendChild(gBall);
    var trail = S.path('', 's-quantum');
    trail.setAttribute('stroke-dasharray', '3 4');
    gBall.appendChild(trail);
    var ball = S.circle(0, 0, 6, 's-fill-q');
    gBall.appendChild(ball);
    var ballLbl = S.text(0, 0, 'released here, it runs down −∇V', 's-lbl-q', 'start');
    gBall.appendChild(ballLbl);

    var start = [1.35, 1.05];
    var path = [start.slice()];
    var pos = start.slice();
    for (i = 0; i < 260; i++) {
      var gr = F.grad(V, pos[0], pos[1], 1e-4);
      pos[0] -= gr[0] * 0.02; pos[1] -= gr[1] * 0.02;
      path.push(pos.slice());
    }

    var worked = [
      'V(x, y) = ½(x² + 1.6y²)',
      '∇V = ( ∂V/∂x , ∂V/∂y ) = ( x , 1.6y )',
      'a scalar field went in; a vector field came out',
      'F = −∇V points the other way, which is why balls roll downhill'
    ].map(function (str, n) {
      var t = S.text(640, 150 + n * 44, str, n === 3 ? 's-lbl-b' : 's-lbl', 'start');
      t.setAttribute('font-size', n === 1 ? '14' : '12.5');
      svg.appendChild(t);
      return t;
    });

    return function (p) {
      S.op(gLev, M.beat(p, 0.02, 0.16));
      arrows.forEach(function (a, n) {
        S.op(a, M.beat(p, 0.14 + (n % 6) * 0.02, 0.3 + (n % 6) * 0.02) * 0.8);
      });
      worked.forEach(function (t, n) { S.op(t, M.beat(p, 0.3 + n * 0.1, 0.44 + n * 0.1)); });

      var run = M.easeInOut(M.beat(p, 0.6, 0.95));
      var upTo = Math.max(1, Math.floor(run * (path.length - 1)));
      var pts = [];
      for (var n2 = 0; n2 <= upTo; n2 += 4) pts.push([PX(path[n2][0]), PY(path[n2][1])]);
      S.setD(trail, S.polyD(pts));
      ball.setAttribute('cx', PX(path[upTo][0]).toFixed(1));
      ball.setAttribute('cy', PY(path[upTo][1]).toFixed(1));
      ballLbl.setAttribute('x', PX(start[0]) + 12);
      ballLbl.setAttribute('y', PY(start[1]) - 10);
      S.op(gBall, M.beat(p, 0.56, 0.68));
    };
  });

  /* --------------------------------------------------- divergence --- */

  A.scene('divergence-box', function (root) {
    var W = 1000, H = 560;
    var svg = S.root(W, H,
      'A small square placed in three different fields. The divergence is the net flow out ' +
      'through its sides, per unit area. A shear field moves everything and yet leaks nothing.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var panels = [
      { id: 'radial', title: 'a source', verdict: 'more leaves than enters' },
      { id: 'sink', title: 'a sink', verdict: 'more enters than leaves' },
      { id: 'shear', title: 'shear', verdict: 'everything moves, nothing leaks' }
    ];

    var side = 250, top = 110, boxHalf = 0.5;
    var built = panels.map(function (pn, idx) {
      var f = F.byId(pn.id);
      var x0 = 50 + idx * 320;
      var cx = x0 + side / 2, cy = top + side / 2, sc = side / 4;
      var PX = function (x) { return cx + x * sc; };
      var PY = function (y) { return cy - y * sc; };

      var g = S.g({});
      svg.appendChild(g);
      g.appendChild(S.rect(x0, top, side, side, 's-ghost'));
      g.appendChild(S.text(x0, top - 34, pn.title, 's-lbl-b', 'start'));
      var fx = S.text(x0, top - 14, f.tex, 's-lbl-w', 'start');
      g.appendChild(fx);

      /* Background field. */
      var nA = 9;
      for (var i = 0; i < nA; i++) {
        for (var j = 0; j < nA; j++) {
          var ax = -1.9 + 3.8 * (i + 0.5) / nA, ay = -1.9 + 3.8 * (j + 0.5) / nA;
          var v = f.fn(ax, ay);
          var mag = Math.hypot(v[0], v[1]);
          if (mag < 1e-4) continue;
          var L = Math.min(22, 8 + mag * 8);
          var a = S.arrow(svg, PX(ax), PY(ay),
                          PX(ax) + v[0] / mag * L, PY(ay) - v[1] / mag * L, 'm');
          a.setAttribute('stroke-opacity', '0.35');
          g.appendChild(a);
        }
      }

      /* The little box, and the flow through each of its four sides. */
      var box = S.rect(PX(-boxHalf), PY(boxHalf), boxHalf * 2 * sc, boxHalf * 2 * sc, 's-ghost');
      box.setAttribute('stroke', 'var(--ink-bright)');
      box.setAttribute('stroke-width', '2');
      box.setAttribute('fill', 'none');
      g.appendChild(box);

      var edges = [
        { nx: 1, ny: 0, px: boxHalf, py: 0 },
        { nx: -1, ny: 0, px: -boxHalf, py: 0 },
        { nx: 0, ny: 1, px: 0, py: boxHalf },
        { nx: 0, ny: -1, px: 0, py: -boxHalf }
      ].map(function (e) {
        var v = f.fn(e.px, e.py);
        var outward = v[0] * e.nx + v[1] * e.ny;
        var L = M.clamp(outward * 26, -40, 40);
        var a = S.arrow(svg,
          PX(e.px), PY(e.py),
          PX(e.px) + e.nx * L, PY(e.py) - e.ny * L,
          outward >= 0 ? 'w' : 'f');
        a.setAttribute('stroke-width', '2.5');
        g.appendChild(a);
        return a;
      });

      var flux = F.flux(f.fn, 0, 0, boxHalf);
      var area = 4 * boxHalf * boxHalf;
      var divNum = F.div(f.fn, 0, 0);

      var rows = [
        'net flow out = ' + flux.toFixed(3),
        'area = ' + area.toFixed(2),
        'flow out / area = ' + (flux / area).toFixed(3),
        '∇ · A = ' + divNum.toFixed(3)
      ].map(function (str, n) {
        var t = S.text(x0, top + side + 34 + n * 24, str,
                       n === 3 ? (Math.abs(divNum) < 1e-6 ? 's-lbl' : (divNum > 0 ? 's-lbl-w' : 's-lbl-f')) : 's-lbl',
                       'start');
        if (n === 3) t.setAttribute('font-size', '14');
        g.appendChild(t);
        return t;
      });
      var verdict = S.text(x0, top + side + 152, pn.verdict, 's-lbl-q', 'start');
      g.appendChild(verdict);

      return { g: g, edges: edges, rows: rows, verdict: verdict, box: box };
    });

    var moral = S.text(W / 2, H - 20,
      'divergence asks only one question: is stuff appearing here? Motion by itself is not enough.',
      's-lbl-b', 'middle');
    svg.appendChild(moral);

    return function (p) {
      built.forEach(function (b, i) {
        var f0 = M.beat(p, 0.02 + i * 0.1, 0.18 + i * 0.1);
        S.op(b.g, f0);
        b.edges.forEach(function (e, n) {
          S.op(e, M.beat(p, 0.2 + i * 0.08 + n * 0.02, 0.36 + i * 0.08 + n * 0.02));
        });
        b.rows.forEach(function (r, n) {
          S.op(r, M.beat(p, 0.36 + i * 0.06 + n * 0.05, 0.52 + i * 0.06 + n * 0.05));
        });
        S.op(b.verdict, M.beat(p, 0.66 + i * 0.05, 0.8 + i * 0.05));
      });
      S.op(moral, M.beat(p, 0.86, 0.97));
    };
  });

  /* ------------------------------------- curl, with a paddlewheel --- */

  A.scene('curl-paddlewheel', function (root, api) {
    var W = 1100, H = 580;
    var svg = S.root(W, H,
      'A paddlewheel dropped into four fields. It spins in the shear field, which has no ' +
      'obvious rotation, and sits still in the free vortex, which obviously circles. Curl is ' +
      'not the same as going round.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var panels = [
      { id: 'vortex', title: 'rigid rotation', at: [0.9, 0.4],
        note: 'turns like a solid disc' },
      { id: 'shear', title: 'shear', at: [0.6, 0.4],
        note: 'every arrow parallel — and it still spins' },
      { id: 'radial', title: 'radial outflow', at: [1.0, 0.5],
        note: 'plenty of motion, no spin at all' },
      { id: 'freevortex', title: 'free vortex', at: [1.2, 0.35],
        note: 'circles, yet does not spin' }
    ];

    var side = 205, top = 108;
    var built = panels.map(function (pn, idx) {
      var f = F.byId(pn.id);
      var x0 = 40 + idx * 245;
      var cx = x0 + side / 2, cy = top + side / 2, sc = side / 4;
      var PX = function (x) { return cx + x * sc; };
      var PY = function (y) { return cy - y * sc; };

      var g = S.g({});
      svg.appendChild(g);
      g.appendChild(S.rect(x0, top, side, side, 's-ghost'));
      g.appendChild(S.text(x0, top - 36, pn.title, 's-lbl-b', 'start'));
      g.appendChild(S.text(x0, top - 16, f.tex, 's-lbl-w', 'start'));

      var nA = 8;
      for (var i = 0; i < nA; i++) {
        for (var j = 0; j < nA; j++) {
          var ax = -1.85 + 3.7 * (i + 0.5) / nA, ay = -1.85 + 3.7 * (j + 0.5) / nA;
          var v = f.fn(ax, ay);
          var mag = Math.hypot(v[0], v[1]);
          if (mag < 1e-4) continue;
          var L = Math.min(19, 7 + mag * 6);
          var a = S.arrow(svg, PX(ax), PY(ay),
                          PX(ax) + v[0] / mag * L, PY(ay) - v[1] / mag * L, 'm');
          a.setAttribute('stroke-opacity', '0.32');
          g.appendChild(a);
        }
      }

      /* The paddlewheel: four blades that turn at half the curl, which is the
         actual angular velocity of a small floating wheel. */
      var wx = PX(pn.at[0]), wy = PY(pn.at[1]);
      var curl = F.curlZ(f.fn, pn.at[0], pn.at[1]);
      var wheel = S.g({});
      g.appendChild(wheel);
      var rad = 26;
      wheel.appendChild(S.el('circle', { cx: wx, cy: wy, r: rad, class: 's-ghost' }));
      var blades = [];
      for (i = 0; i < 4; i++) {
        var b = S.line(wx, wy, wx + rad, wy, 's-wave');
        b.setAttribute('stroke-width', '2.5');
        wheel.appendChild(b);
        blades.push(b);
      }
      wheel.appendChild(S.circle(wx, wy, 3, 's-fill-i'));

      var spinLbl = S.text(x0 + side / 2, top + side + 30,
        Math.abs(curl) < 1e-5 ? 'it does not turn' : 'it turns',
        Math.abs(curl) < 1e-5 ? 's-lbl' : 's-lbl-w', 'middle');
      g.appendChild(spinLbl);
      var curlLbl = S.text(x0 + side / 2, top + side + 56,
        '(∇ × A)_z = ' + (Math.abs(curl) < 1e-5 ? '0' : curl.toFixed(2)),
        Math.abs(curl) < 1e-5 ? 's-lbl' : 's-lbl-w', 'middle');
      curlLbl.setAttribute('font-size', '14');
      g.appendChild(curlLbl);
      var note = S.text(x0 + side / 2, top + side + 86, pn.note, 's-lbl-q', 'middle');
      note.setAttribute('font-size', '11');
      g.appendChild(note);

      return { g: g, blades: blades, wx: wx, wy: wy, rad: rad, curl: curl,
               spinLbl: spinLbl, curlLbl: curlLbl, note: note };
    });

    var moral1 = S.text(W / 2, H - 44,
      'a paddlewheel turns at half the curl — so curl measures local twisting, not global circling',
      's-lbl-b', 'middle');
    moral1.setAttribute('font-size', '13');
    svg.appendChild(moral1);
    var moral2 = S.text(W / 2, H - 20,
      'the shear case is the one worth remembering: the top of the wheel is pushed harder than the bottom',
      's-lbl-q', 'middle');
    svg.appendChild(moral2);

    return function (p, t) {
      var time = api.reduced ? 0.6 : t;
      built.forEach(function (b, i) {
        S.op(b.g, M.beat(p, 0.02 + i * 0.09, 0.2 + i * 0.09));
        var ang = -b.curl / 2 * time;
        b.blades.forEach(function (bl, n) {
          var a = ang + n * Math.PI / 2;
          bl.setAttribute('x2', (b.wx + Math.cos(a) * b.rad).toFixed(1));
          bl.setAttribute('y2', (b.wy + Math.sin(a) * b.rad).toFixed(1));
        });
        var lbl = M.beat(p, 0.34 + i * 0.07, 0.5 + i * 0.07);
        S.op(b.spinLbl, lbl); S.op(b.curlLbl, lbl);
        S.op(b.note, M.beat(p, 0.5 + i * 0.06, 0.66 + i * 0.06));
      });
      S.op(moral1, M.beat(p, 0.76, 0.9));
      S.op(moral2, M.beat(p, 0.84, 0.96));
    };
  });

  /* ----------------------- the component formula, worked on the plane wave --- */

  A.scene('curl-formula', function (root) {
    var W = 1000, H = 640;
    var svg = S.root(W, H,
      'The component formula for curl, and the same formula applied to the plane wave of ' +
      'section 1.1, which produces the magnetic field along z.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var gForm = S.g({});
    svg.appendChild(gForm);
    gForm.appendChild(S.text(50, 66, 'the formula, one component at a time', 's-lbl-b', 'start'));
    gForm.appendChild(S.line(50, 78, 470, 78, 's-axis'));
    var comps = [
      '(∇ × A)ₓ = ∂A_z/∂y − ∂A_y/∂z',
      '(∇ × A)_y = ∂Aₓ/∂z − ∂A_z/∂x',
      '(∇ × A)_z = ∂A_y/∂x − ∂Aₓ/∂y'
    ].map(function (str, i) {
      var t = S.text(50, 112 + i * 34, str, 's-lbl-w', 'start');
      t.setAttribute('font-size', '13.5');
      gForm.appendChild(t);
      return t;
    });

    /* The cyclic pattern, drawn as a ring so it can be remembered. */
    var gCyc = S.g({});
    svg.appendChild(gCyc);
    var ccx = 250, ccy = 300, cr = 62;
    ['x', 'y', 'z'].forEach(function (lab, i) {
      var a = -Math.PI / 2 + i * M.TAU / 3;
      var px = ccx + Math.cos(a) * cr, py = ccy + Math.sin(a) * cr;
      gCyc.appendChild(S.circle(px, py, 15, 's-fill-w'));
      var t = S.text(px, py + 5, lab, 's-lbl', 'middle');
      t.setAttribute('fill', 'var(--ground)');
      t.setAttribute('font-size', '13');
      gCyc.appendChild(t);
      var a2 = -Math.PI / 2 + (i + 1) * M.TAU / 3;
      var qx = ccx + Math.cos(a2) * cr, qy = ccy + Math.sin(a2) * cr;
      var dx = qx - px, dy = qy - py, len = Math.hypot(dx, dy);
      gCyc.appendChild(S.arrow(svg,
        px + dx / len * 18, py + dy / len * 18,
        qx - dx / len * 18, qy - dy / len * 18, 'q'));
    });
    gCyc.appendChild(S.text(ccx, ccy + cr + 46,
      'each line is the next one with x → y → z → x', 's-lbl-q', 'middle'));
    gCyc.appendChild(S.text(ccx, ccy + cr + 66,
      'so you only ever memorise one', 's-lbl', 'middle'));

    /* The worked case. */
    var gWork = S.g({});
    svg.appendChild(gWork);
    var wx = 520;
    gWork.appendChild(S.text(wx, 66, 'worked on the plane wave of §1.1', 's-lbl-b', 'start'));
    gWork.appendChild(S.line(wx, 78, W - 40, 78, 's-axis'));
    var steps = [
      ['E = ŷ E₀ cos(kx − ωt)', 'so Eₓ = 0, E_y = E₀cos(kx − ωt), E_z = 0'],
      ['(∇ × E)ₓ = ∂E_z/∂y − ∂E_y/∂z', 'both terms vanish: nothing depends on y or z'],
      ['(∇ × E)_y = ∂Eₓ/∂z − ∂E_z/∂x', 'both terms vanish: Eₓ and E_z are zero'],
      ['(∇ × E)_z = ∂E_y/∂x − ∂Eₓ/∂y', 'only the first term survives'],
      ['= ∂/∂x [ E₀cos(kx − ωt) ]', 'chain rule: pull down one k'],
      ['= −k E₀ sin(kx − ωt)', 'so ∇ × E points along ẑ, and only ẑ'],
      ['Faraday: ∇ × E = −∂B/∂t', 'so ∂B_z/∂t = +k E₀ sin(kx − ωt)'],
      ['integrate in time', 'B_z = (k/ω) E₀ cos(kx − ωt) = (E₀/c) cos(kx − ωt)']
    ].map(function (row, i) {
      var g = S.g({});
      gWork.appendChild(g);
      var y = 112 + i * 56;
      var a = S.text(wx, y, row[0], i === 7 ? 's-lbl-b' : 's-lbl-w', 'start');
      a.setAttribute('font-size', '12.5');
      g.appendChild(a);
      var b = S.text(wx + 12, y + 20, row[1], 's-lbl', 'start');
      b.setAttribute('font-size', '11');
      g.appendChild(b);
      return g;
    });

    var payoff = S.text(W / 2, H - 46,
      'that is where the atlas gets B ⊥ E, in step with it, and smaller by a factor of c',
      's-lbl-q', 'middle');
    payoff.setAttribute('font-size', '13');
    svg.appendChild(payoff);
    var payoff2 = S.text(W / 2, H - 22,
      'one curl, taken carefully, and the whole geometry of light falls out',
      's-lbl-b', 'middle');
    svg.appendChild(payoff2);

    return function (p) {
      S.op(gForm, M.beat(p, 0.02, 0.12));
      comps.forEach(function (c, i) { S.op(c, M.beat(p, 0.05 + i * 0.05, 0.18 + i * 0.05)); });
      S.op(gCyc, M.beat(p, 0.2, 0.34));
      S.op(gWork, M.beat(p, 0.3, 0.42));
      steps.forEach(function (g, i) { S.op(g, M.beat(p, 0.34 + i * 0.062, 0.48 + i * 0.062)); });
      S.op(payoff, M.beat(p, 0.86, 0.95));
      S.op(payoff2, M.beat(p, 0.9, 0.99));
    };
  });

  /* ------------------------------------------------------- Laplacian --- */

  A.scene('laplacian-neighbours', function (root) {
    var W = 1070, H = 560;
    var svg = S.root(W, H,
      'The Laplacian compares a point with the average of its neighbours. At the crest of a ' +
      'cosine the point sits above its neighbours, so the Laplacian is negative there.');
    S.defsArrows(svg);
    root.appendChild(svg);

    /* Left: the neighbour stencil on a grid. */
    var gSten = S.g({});
    svg.appendChild(gSten);
    var sx = 90, sy = 130, cell = 62;
    function g2(x, y) { return Math.exp(-((x - 0.2) * (x - 0.2) + y * y) * 0.7); }
    for (var i = -2; i <= 2; i++) {
      for (var j = -2; j <= 2; j++) {
        var r = S.rect(sx + (i + 2) * cell, sy + (j + 2) * cell, cell - 2, cell - 2, null);
        r.setAttribute('fill', 'var(--quantum)');
        r.setAttribute('opacity', (g2(i * 0.5, j * 0.5) * 0.7).toFixed(3));
        gSten.appendChild(r);
      }
    }
    var centreX = sx + 2 * cell + cell / 2, centreY = sy + 2 * cell + cell / 2;
    var hi = S.rect(sx + 2 * cell, sy + 2 * cell, cell - 2, cell - 2, 's-ghost');
    hi.setAttribute('stroke', 'var(--ink-bright)');
    hi.setAttribute('stroke-width', '2.5');
    hi.setAttribute('fill', 'none');
    gSten.appendChild(hi);
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
      var b = S.rect(sx + (d[0] + 2) * cell, sy + (d[1] + 2) * cell, cell - 2, cell - 2, 's-ghost');
      b.setAttribute('stroke', 'var(--wave)');
      b.setAttribute('fill', 'none');
      gSten.appendChild(b);
      gSten.appendChild(S.arrow(svg,
        centreX + d[0] * 20, centreY + d[1] * 20,
        centreX + d[0] * (cell - 22), centreY + d[1] * (cell - 22), 'w'));
    });
    gSten.appendChild(S.text(sx, sy - 34, 'the four neighbours', 's-lbl-b', 'start'));
    gSten.appendChild(S.text(sx, sy - 14,
      '∇²f  ≈  (average of the neighbours − the centre) × 4/h²', 's-lbl-w', 'start'));

    var gap = F.neighbourGap(g2, 0, 0, 0.5);
    var read = S.text(sx, sy + 5 * cell + 34,
      'here the centre is ' + (gap < 0 ? 'above' : 'below') + ' its neighbours by ' +
      Math.abs(gap).toFixed(3) + ', so ∇²f is ' + (gap < 0 ? 'negative' : 'positive'),
      gap < 0 ? 's-lbl-f' : 's-lbl-w', 'start');
    gSten.appendChild(read);

    /* Right: the same statement for a cosine, which is the case the lecture uses. */
    var gCos = S.g({});
    svg.appendChild(gCos);
    var cx0 = 560, cx1 = 940, ccy = 220, amp = 78;
    gCos.appendChild(S.line(cx0, ccy, cx1, ccy, 's-axis'));
    var curve = S.path('', 's-wave');
    gCos.appendChild(curve);
    S.setD(curve, S.polyD(S.sample(240, 0, 1, function (u) {
      return [M.lerp(cx0, cx1, u), ccy - Math.cos(u * 2 * M.TAU) * amp];
    })));
    gCos.appendChild(S.text(cx0, 66, 'and for a cosine', 's-lbl-b', 'start'));
    gCos.appendChild(S.text(cx0, 86, 'f = cos kx', 's-lbl-w', 'start'));

    /* Mark a crest and a trough with their neighbour stencils. */
    [[0.0, 'crest', 'var(--fail)'], [0.25, 'trough', 'var(--wave)']].forEach(function (mk) {
      var u = mk[0] + 0.0;
      var px = M.lerp(cx0, cx1, u === 0 ? 0.005 : u);
      var py = ccy - Math.cos((u === 0 ? 0.005 : u) * 2 * M.TAU) * amp;
      gCos.appendChild(S.circle(px, py, 5, mk[2] === 'var(--fail)' ? 's-fill-f' : 's-fill-w'));
      var hstep = (cx1 - cx0) * 0.055;
      [-1, 1].forEach(function (sgn) {
        var qu = (u === 0 ? 0.005 : u) + sgn * 0.055;
        var qx = M.lerp(cx0, cx1, qu);
        var qy = ccy - Math.cos(qu * 2 * M.TAU) * amp;
        gCos.appendChild(S.circle(qx, qy, 3, 's-fill-i'));
        var l = S.line(px, py, qx, qy, 's-axis s-dash');
        gCos.appendChild(l);
      });
      gCos.appendChild(S.text(px + 12, py + (mk[1] === 'crest' ? -14 : 20), mk[1],
        mk[1] === 'crest' ? 's-lbl-f' : 's-lbl-w', 'start'));
    });

    var algebra = [
      'f = cos kx',
      'df/dx = −k sin kx',
      'd²f/dx² = −k² cos kx = −k² f',
      'the curve is always bent back toward zero, in proportion to itself'
    ].map(function (str, n) {
      var t = S.text(cx0, 350 + n * 32, str, n === 2 ? 's-lbl-b' : 's-lbl', 'start');
      t.setAttribute('font-size', n === 2 ? '14' : '12.5');
      svg.appendChild(t);
      return t;
    });

    var use = S.text(cx0, 490,
      'in three dimensions the same thing gives ∇²ψ = −k²ψ,', 's-lbl-q', 'start');
    var use2 = S.text(cx0, 512,
      'which is the step that turns both wave equations into algebra', 's-lbl-q', 'start');
    svg.appendChild(use); svg.appendChild(use2);

    return function (p) {
      S.op(gSten, M.beat(p, 0.02, 0.18));
      S.op(read, M.beat(p, 0.2, 0.34));
      S.op(gCos, M.beat(p, 0.3, 0.46));
      algebra.forEach(function (t, n) { S.op(t, M.beat(p, 0.44 + n * 0.09, 0.58 + n * 0.09)); });
      S.op(use, M.beat(p, 0.8, 0.92));
      S.op(use2, M.beat(p, 0.84, 0.96));
    };
  });

  /* ------------------------------------------------ the sandbox --- */

  A.scene('field-sandbox', function (root, api) {
    var wrap = document.createElement('div');
    wrap.className = 'sandbox';
    root.appendChild(wrap);

    /* Controls. */
    var bar = document.createElement('div');
    bar.className = 'sandbox__bar';
    var selId = 'fs-' + Math.random().toString(36).slice(2, 8);
    var opts = F.catalogue.map(function (f) {
      return '<option value="' + f.id + '">' + f.name + '  —  ' + f.tex + '</option>';
    }).join('');
    bar.innerHTML =
      '<label for="' + selId + '">field</label>' +
      '<select id="' + selId + '">' + opts + '</select>' +
      '<button class="sandbox__toggle" type="button" data-role="wheel" aria-pressed="true">paddlewheel</button>' +
      '<button class="sandbox__toggle" type="button" data-role="box" aria-pressed="true">flux box</button>';
    wrap.appendChild(bar);

    var stage = document.createElement('div');
    stage.className = 'sandbox__stage';
    wrap.appendChild(stage);

    var W = 920, H = 500;
    var svg = S.root(W, H,
      'An interactive vector field. Move the pointer to read the divergence and curl at that ' +
      'point, computed from the field itself.');
    S.defsArrows(svg);
    stage.appendChild(svg);

    var readout = document.createElement('dl');
    readout.className = 'sandbox__readout';
    readout.innerHTML =
      '<div class="sandbox__cell"><dt>position</dt><dd data-k="pos">—</dd></div>' +
      '<div class="sandbox__cell"><dt>A at that point</dt><dd data-k="vec">—</dd></div>' +
      '<div class="sandbox__cell"><dt>divergence ∇ · A</dt><dd data-k="div">—</dd></div>' +
      '<div class="sandbox__cell"><dt>curl (∇ × A)_z</dt><dd data-k="curl">—</dd></div>' +
      '<div class="sandbox__cell"><dt>flux out of the box / area</dt><dd data-k="flux">—</dd></div>' +
      '<div class="sandbox__cell"><dt>circulation round it / area</dt><dd data-k="circ">—</dd></div>';
    wrap.appendChild(readout);

    var note = document.createElement('p');
    note.className = 'sandbox__note';
    wrap.appendChild(note);

    var cells = {};
    readout.querySelectorAll('[data-k]').forEach(function (el) { cells[el.getAttribute('data-k')] = el; });

    /* Geometry: field coordinates run -2..2 across the wider axis. */
    var cx = W / 2, cy = H / 2, sc = 104;
    var PX = function (x) { return cx + x * sc; };
    var PY = function (y) { return cy - y * sc; };
    var toField = function (px, py) { return [(px - cx) / sc, (cy - py) / sc]; };

    svg.appendChild(S.rect(1, 1, W - 2, H - 2, 's-ghost'));
    var gGrid = S.g({});
    svg.appendChild(gGrid);
    for (var gx = -2; gx <= 2; gx++) {
      gGrid.appendChild(S.line(PX(gx), 0, PX(gx), H, 's-grid'));
    }
    for (var gy = -2; gy <= 2; gy++) {
      gGrid.appendChild(S.line(0, PY(gy), W, PY(gy), 's-grid'));
    }
    gGrid.appendChild(S.line(0, PY(0), W, PY(0), 's-axis'));
    gGrid.appendChild(S.line(PX(0), 0, PX(0), H, 's-axis'));

    /* A reusable grid of arrows, repointed when the field changes. */
    var gArr = S.g({});
    svg.appendChild(gArr);
    var NX = 21, NY = 12, arrows = [];
    for (var i = 0; i < NX; i++) {
      for (var j = 0; j < NY; j++) {
        var a = S.arrow(svg, 0, 0, 0, 0, 'm');
        a.setAttribute('stroke-opacity', '0.4');
        gArr.appendChild(a);
        arrows.push({ el: a, fx: -4.2 + 8.4 * (i + 0.5) / NX, fy: -2.2 + 4.4 * (j + 0.5) / NY });
      }
    }

    /* Cursor furniture. */
    var gCur = S.g({});
    svg.appendChild(gCur);
    var fluxBox = S.rect(0, 0, 0, 0, 's-ghost');
    fluxBox.setAttribute('stroke', 'var(--ink-bright)');
    fluxBox.setAttribute('stroke-width', '2');
    fluxBox.setAttribute('fill', 'none');
    gCur.appendChild(fluxBox);
    var wheelG = S.g({});
    gCur.appendChild(wheelG);
    var wheelRing = S.el('circle', { r: 26, class: 's-ghost' });
    wheelG.appendChild(wheelRing);
    var blades = [];
    for (i = 0; i < 4; i++) {
      var b = S.line(0, 0, 0, 0, 's-wave');
      b.setAttribute('stroke-width', '2.5');
      wheelG.appendChild(b);
      blades.push(b);
    }
    var cursorVec = S.arrow(svg, 0, 0, 0, 0, 'q');
    cursorVec.setAttribute('stroke-width', '3');
    gCur.appendChild(cursorVec);
    var cursorDot = S.circle(0, 0, 4, 's-fill-i');
    gCur.appendChild(cursorDot);

    var hint = S.text(18, 26, 'move the pointer over the field', 's-lbl', 'start');
    svg.appendChild(hint);

    var current = F.catalogue[0];
    var at = [1.0, 0.6];
    var showWheel = true, showBox = true;
    var boxHalf = 0.34;

    function repointArrows() {
      arrows.forEach(function (a) {
        var v = current.fn(a.fx, a.fy);
        var mag = Math.hypot(v[0], v[1]);
        var px = PX(a.fx), py = PY(a.fy);
        if (mag < 1e-5) {
          a.el.setAttribute('x1', px); a.el.setAttribute('y1', py);
          a.el.setAttribute('x2', px); a.el.setAttribute('y2', py);
          return;
        }
        var L = Math.min(26, 9 + mag * 7);
        a.el.setAttribute('x1', px.toFixed(1));
        a.el.setAttribute('y1', py.toFixed(1));
        a.el.setAttribute('x2', (px + v[0] / mag * L).toFixed(1));
        a.el.setAttribute('y2', (py - v[1] / mag * L).toFixed(1));
      });
      note.textContent = current.note;
    }

    function setNum(cell, v, tol) {
      var t = tol == null ? 1e-4 : tol;
      cell.textContent = Math.abs(v) < t ? '0' : v.toFixed(3);
      cell.className = Math.abs(v) < t ? 'is-zero' : (v > 0 ? 'is-pos' : 'is-neg');
    }

    function update() {
      var x = at[0], y = at[1];
      var v = current.fn(x, y);
      var dv = F.div(current.fn, x, y);
      var cu = F.curlZ(current.fn, x, y);
      cells.pos.textContent = '(' + x.toFixed(2) + ', ' + y.toFixed(2) + ')';
      cells.pos.className = '';
      cells.vec.textContent = '(' + v[0].toFixed(2) + ', ' + v[1].toFixed(2) + ')';
      cells.vec.className = '';
      setNum(cells.div, dv);
      setNum(cells.curl, cu);
      var area = 4 * boxHalf * boxHalf;
      setNum(cells.flux, F.flux(current.fn, x, y, boxHalf) / area, 2e-3);
      setNum(cells.circ, F.circulation(current.fn, x, y, boxHalf) / area, 2e-3);
    }

    var sel = bar.querySelector('select');
    sel.addEventListener('change', function () {
      current = F.byId(sel.value);
      repointArrows();
      update();
    });
    bar.querySelectorAll('.sandbox__toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var on = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (btn.getAttribute('data-role') === 'wheel') showWheel = on; else showBox = on;
      });
    });

    function pointerAt(ev) {
      var r = svg.getBoundingClientRect();
      var px = (ev.clientX - r.left) / r.width * W;
      var py = (ev.clientY - r.top) / r.height * H;
      at = toField(px, py);
      S.op(hint, 0);
      update();
    }
    svg.addEventListener('pointermove', pointerAt);
    svg.addEventListener('pointerdown', pointerAt);

    repointArrows();
    update();

    /* Expose for the verification harness, which drives the sandbox and checks
       the readout against the analytic answer. */
    svg.__sandbox = {
      setField: function (id) { sel.value = id; sel.dispatchEvent(new Event('change')); },
      moveTo: function (x, y) { at = [x, y]; update(); },
      read: function () {
        return { div: cells.div.textContent, curl: cells.curl.textContent, field: current.id };
      }
    };

    return function (p, t) {
      var time = api.reduced ? 0.6 : t;
      var px = PX(at[0]), py = PY(at[1]);

      cursorDot.setAttribute('cx', px.toFixed(1));
      cursorDot.setAttribute('cy', py.toFixed(1));

      var v = current.fn(at[0], at[1]);
      var mag = Math.hypot(v[0], v[1]);
      var L = mag < 1e-5 ? 0 : Math.min(60, 16 + mag * 14);
      cursorVec.setAttribute('x1', px.toFixed(1));
      cursorVec.setAttribute('y1', py.toFixed(1));
      cursorVec.setAttribute('x2', (px + (mag ? v[0] / mag : 0) * L).toFixed(1));
      cursorVec.setAttribute('y2', (py - (mag ? v[1] / mag : 0) * L).toFixed(1));

      fluxBox.setAttribute('x', (px - boxHalf * sc).toFixed(1));
      fluxBox.setAttribute('y', (py - boxHalf * sc).toFixed(1));
      fluxBox.setAttribute('width', (2 * boxHalf * sc).toFixed(1));
      fluxBox.setAttribute('height', (2 * boxHalf * sc).toFixed(1));
      S.op(fluxBox, showBox ? 0.9 : 0);

      wheelRing.setAttribute('cx', px.toFixed(1));
      wheelRing.setAttribute('cy', py.toFixed(1));
      var curl = F.curlZ(current.fn, at[0], at[1]);
      var ang = -curl / 2 * time;
      blades.forEach(function (bl, n) {
        var a2 = ang + n * Math.PI / 2;
        bl.setAttribute('x1', px.toFixed(1));
        bl.setAttribute('y1', py.toFixed(1));
        bl.setAttribute('x2', (px + Math.cos(a2) * 26).toFixed(1));
        bl.setAttribute('y2', (py + Math.sin(a2) * 26).toFixed(1));
      });
      S.op(wheelG, showWheel ? 1 : 0);

      S.op(gArr, M.beat(p, 0.02, 0.2) * 0.4 + 0.6 * M.beat(p, 0.02, 0.2));
      S.op(gCur, M.beat(p, 0.08, 0.26));
    };
  });

  /* ------------------------------- the identity, verified not cited --- */

  A.scene('double-curl-identity', function (root) {
    var W = 1080, H = 620;
    var svg = S.root(W, H,
      'The x-component of curl of curl A worked out in full, with the term that is added and ' +
      'subtracted highlighted, giving the identity the wave equation derivation relies on.');
    root.appendChild(svg);

    var steps = [
      ['start from the definition, taking the x-component',
       '[∇ × (∇ × A)]ₓ = ∂_y (∇ × A)_z − ∂_z (∇ × A)_y', null],
      ['substitute the two components of the inner curl',
       '= ∂_y ( ∂ₓA_y − ∂_yAₓ ) − ∂_z ( ∂_zAₓ − ∂ₓA_z )', null],
      ['expand',
       '= ∂_y∂ₓA_y − ∂_y²Aₓ − ∂_z²Aₓ + ∂_z∂ₓA_z', null],
      ['now the trick: add and subtract the one term needed to complete both patterns',
       '= ∂_y∂ₓA_y + ∂_z∂ₓA_z + ∂ₓ²Aₓ − ∂ₓ²Aₓ − ∂_y²Aₓ − ∂_z²Aₓ', 'add'],
      ['the first three terms are ∂ₓ acting on the divergence',
       '= ∂ₓ( ∂ₓAₓ + ∂_yA_y + ∂_zA_z ) − ( ∂ₓ² + ∂_y² + ∂_z² )Aₓ', null],
      ['and those brackets have names',
       '= ∂ₓ(∇ · A) − ∇²Aₓ = [ ∇(∇ · A) − ∇²A ]ₓ', 'done'],
      ['the y and z components go the same way, by the x → y → z cycle',
       '∇ × (∇ × A) = ∇(∇ · A) − ∇²A', 'result']
    ];

    var built = steps.map(function (row, i) {
      var g = S.g({});
      svg.appendChild(g);
      var y = 70 + i * 78;
      var num = S.text(50, y + 4, String(i + 1).padStart(2, '0'), 's-lbl-w', 'start');
      num.setAttribute('font-size', '11');
      g.appendChild(num);
      var lab = S.text(84, y, row[0], 's-lbl', 'start');
      lab.setAttribute('font-size', '11.5');
      g.appendChild(lab);
      var eq = S.text(84, y + 28, row[1],
        row[2] === 'result' || row[2] === 'done' ? 's-lbl-b' : 's-lbl-w', 'start');
      eq.setAttribute('font-size', row[2] === 'result' ? '16' : '13');
      g.appendChild(eq);
      g.appendChild(S.line(50, y + 46, W - 50, y + 46, 's-grid'));
      return { g: g, kind: row[2] };
    });

    var aside = S.text(84, 70 + 3 * 78 + 62,
      'adding zero is the whole move: ∂ₓ²Aₓ − ∂ₓ²Aₓ changes nothing, but it completes a divergence in one group and a Laplacian in the other',
      's-lbl-q', 'start');
    aside.setAttribute('font-size', '11');
    svg.appendChild(aside);

    var closing = S.text(W / 2, H - 20,
      'no physics anywhere in this — it is true of any twice-differentiable vector field',
      's-lbl', 'middle');
    svg.appendChild(closing);

    return function (p) {
      built.forEach(function (b, i) { S.op(b.g, M.beat(p, 0.02 + i * 0.11, 0.18 + i * 0.11)); });
      S.op(aside, M.beat(p, 0.44, 0.6));
      S.op(closing, M.beat(p, 0.86, 0.97));
    };
  });

  /* ---------------------- curl of a gradient is always zero --- */

  A.scene('curl-grad-zero', function (root) {
    var W = 960, H = 480;
    var svg = S.root(W, H,
      'Two routes to the same corner of a small square give the two mixed second derivatives. ' +
      'Because they agree, the curl of any gradient vanishes.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var x0 = 130, y0 = 300, side = 190;
    var gSq = S.g({});
    svg.appendChild(gSq);
    gSq.appendChild(S.rect(x0, y0 - side, side, side, 's-ghost'));
    [[x0, y0, 'f'], [x0 + side, y0, '∂ₓ f'], [x0, y0 - side, '∂_y f'], [x0 + side, y0 - side, '∂ₓ∂_y f']]
      .forEach(function (c) {
        gSq.appendChild(S.circle(c[0], c[1], 5, 's-fill-i'));
        gSq.appendChild(S.text(c[0] + (c[0] > x0 ? 12 : -12), c[1] + (c[1] < y0 ? -12 : 20), c[2],
          's-lbl-b', c[0] > x0 ? 'start' : 'end'));
      });

    var routeA1 = S.arrow(svg, x0 + 14, y0, x0 + side - 14, y0, 'w');
    var routeA2 = S.arrow(svg, x0 + side, y0 - 14, x0 + side, y0 - side + 14, 'w');
    var routeB1 = S.arrow(svg, x0, y0 - 14, x0, y0 - side + 14, 'q');
    var routeB2 = S.arrow(svg, x0 + 14, y0 - side, x0 + side - 14, y0 - side, 'q');
    [routeA1, routeA2, routeB1, routeB2].forEach(function (a) {
      a.setAttribute('stroke-width', '2.5');
      svg.appendChild(a);
    });
    svg.appendChild(S.text(x0 + side / 2, y0 + 28, 'first x, then y', 's-lbl-w', 'middle'));
    svg.appendChild(S.text(x0 - 16, y0 - side / 2, 'first y,', 's-lbl-q', 'end'));
    svg.appendChild(S.text(x0 - 16, y0 - side / 2 + 18, 'then x', 's-lbl-q', 'end'));

    var lines = [
      '(∇ × ∇f)_z = ∂ₓ(∂_y f) − ∂_y(∂ₓ f)',
      'and mixed partial derivatives commute for any decent f',
      '∂ₓ∂_y f = ∂_y∂ₓ f',
      'so (∇ × ∇f)_z = 0, and the same for the other two components',
      '∇ × ∇f = 0   for every scalar field f'
    ].map(function (str, i) {
      var t = S.text(470, 130 + i * 46, str, i === 4 ? 's-lbl-b' : 's-lbl', 'start');
      t.setAttribute('font-size', i === 4 ? '15' : '12.5');
      svg.appendChild(t);
      return t;
    });

    var why = S.text(470, 372,
      'which is the reason a force that comes from a potential can never', 's-lbl-q', 'start');
    var why2 = S.text(470, 392,
      'circulate — the missing half of the argument in §1.1', 's-lbl-q', 'start');
    svg.appendChild(why); svg.appendChild(why2);

    return function (p) {
      S.op(gSq, M.beat(p, 0.02, 0.16));
      S.op(routeA1, M.beat(p, 0.14, 0.26));
      S.op(routeA2, M.beat(p, 0.2, 0.32));
      S.op(routeB1, M.beat(p, 0.28, 0.4));
      S.op(routeB2, M.beat(p, 0.34, 0.46));
      lines.forEach(function (l, i) { S.op(l, M.beat(p, 0.4 + i * 0.1, 0.54 + i * 0.1)); });
      S.op(why, M.beat(p, 0.86, 0.96));
      S.op(why2, M.beat(p, 0.88, 0.98));
    };
  });
})(window.A = window.A || {});
