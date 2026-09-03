/* Maths companion, §M.4: integrating a field along a path and through a surface,
   the three equivalent ways of saying a force is conservative, and the theorem
   that turns a volume integral into a surface one. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg, F = A.field;

  /* ------------------------------------------------- line integrals --- */

  A.scene('line-integral', function (root) {
    var W = 1070, H = 580;
    var svg = S.root(W, H,
      'A path through a vector field, chopped into short steps. Each step contributes the ' +
      'field dotted with the step, and the line integral is the running total.');
    S.defsArrows(svg);
    root.appendChild(svg);

    /* A field with a clear along-path and across-path structure. */
    function fld(x, y) { return [0.8 + 0.35 * y, 0.55 * Math.sin(x * 1.1) + 0.25]; }

    var cx = 90, cy = 330, sc = 100;
    var PX = function (x) { return cx + x * sc; };
    var PY = function (y) { return cy - y * sc; };

    var gArr = S.g({});
    svg.appendChild(gArr);
    for (var i = 0; i < 16; i++) {
      for (var j = 0; j < 7; j++) {
        var ax = 0.15 + 5.5 * i / 15, ay = -0.9 + 2.6 * j / 6;
        var v = fld(ax, ay);
        var mag = Math.hypot(v[0], v[1]);
        var a = S.arrow(svg, PX(ax), PY(ay),
                        PX(ax) + v[0] / mag * 20, PY(ay) - v[1] / mag * 20, 'm');
        a.setAttribute('stroke-opacity', '0.3');
        gArr.appendChild(a);
      }
    }
    gArr.appendChild(S.text(70, 66, 'a vector field, and a path through it', 's-lbl', 'start'));

    /* The path. */
    function pathAt(u) {
      var x = 0.35 + u * 5.0;
      var y = 0.75 * Math.sin(u * 3.0) * (0.35 + 0.65 * u) - 0.15;
      return [x, y];
    }
    var pathEl = S.path('', 's-quantum');
    pathEl.setAttribute('stroke-width', '2.5');
    svg.appendChild(pathEl);
    S.setD(pathEl, S.polyD(S.sample(200, 0, 1, function (u) {
      var q = pathAt(u); return [PX(q[0]), PY(q[1])];
    })));

    var N = 22;
    var gSeg = S.g({});
    svg.appendChild(gSeg);
    var segs = [];
    for (i = 0; i < N; i++) {
      var g = S.g({});
      gSeg.appendChild(g);
      var stepArrow = S.arrow(svg, 0, 0, 0, 0, 'i');
      stepArrow.setAttribute('stroke-width', '2');
      var fieldArrow = S.arrow(svg, 0, 0, 0, 0, 'w');
      g.appendChild(fieldArrow); g.appendChild(stepArrow);
      segs.push({ g: g, step: stepArrow, field: fieldArrow });
    }

    var head = S.circle(0, 0, 6, 's-fill-q');
    svg.appendChild(head);

    /* Running total, drawn as a bar chart of contributions. */
    var bx0 = 120, bTop = 420, bBot = 500, bw = 30;
    svg.appendChild(S.line(bx0 - 10, bBot, bx0 + N * bw + 10, bBot, 's-axis'));
    svg.appendChild(S.text(bx0 - 16, bBot + 4, '0', 's-tick', 'end'));
    svg.appendChild(S.text(bx0, bTop - 12, 'each step’s contribution  A · Δr', 's-lbl', 'start'));
    var bars = [];
    for (i = 0; i < N; i++) {
      var r = S.rect(bx0 + i * bw, bBot, bw - 4, 0, 's-fill-w');
      r.setAttribute('opacity', '0.85');
      svg.appendChild(r);
      bars.push(r);
    }

    var total = S.text(bx0 + N * bw + 30, bBot - 30, '', 's-lbl-b', 'start');
    total.setAttribute('font-size', '15');
    svg.appendChild(total);
    var totalNote = S.text(bx0 + N * bw + 30, bBot - 6, '', 's-lbl', 'start');
    svg.appendChild(totalNote);

    var notes = [
      '∫ A · dr  =  add up (field) · (step) all along the path',
      'a step across the field contributes nothing; only the along-the-path part counts',
      'in §1.1 this integral, with A = F, is the definition of work'
    ].map(function (str, k) {
      var t = S.text(70, H - 66 + k * 22, str, k === 0 ? 's-lbl-b' : 's-lbl', 'start');
      t.setAttribute('font-size', k === 0 ? '13' : '11.5');
      svg.appendChild(t);
      return t;
    });

    /* Contributions computed once, so the bar heights and the total agree. */
    var contribs = [], scaleMax = 0;
    for (i = 0; i < N; i++) {
      var u0 = i / N, u1 = (i + 1) / N;
      var p0 = pathAt(u0), p1 = pathAt(u1);
      var dx = p1[0] - p0[0], dy = p1[1] - p0[1];
      var mid = pathAt((u0 + u1) / 2);
      var fv = fld(mid[0], mid[1]);
      var c = fv[0] * dx + fv[1] * dy;
      contribs.push({ c: c, p0: p0, p1: p1, mid: mid, fv: fv });
      if (Math.abs(c) > scaleMax) scaleMax = Math.abs(c);
    }

    return function (p) {
      var run = M.easeInOut(M.beat(p, 0.08, 0.92));
      var upTo = Math.floor(run * N);
      var sum = 0;
      for (var i2 = 0; i2 < N; i2++) {
        var on = i2 < upTo;
        var q = contribs[i2];
        if (on) sum += q.c;
        var h = on ? Math.abs(q.c) / scaleMax * (bBot - bTop) : 0;
        bars[i2].setAttribute('y', (q.c >= 0 ? bBot - h : bBot).toFixed(1));
        bars[i2].setAttribute('height', h.toFixed(1));
        bars[i2].setAttribute('class', q.c >= 0 ? 's-fill-w' : 's-fill-f');

        var sg = segs[i2];
        S.op(sg.g, on ? 1 : 0);
        if (!on) continue;
        sg.step.setAttribute('x1', PX(q.p0[0])); sg.step.setAttribute('y1', PY(q.p0[1]));
        sg.step.setAttribute('x2', PX(q.p1[0])); sg.step.setAttribute('y2', PY(q.p1[1]));
        var mg = Math.hypot(q.fv[0], q.fv[1]);
        sg.field.setAttribute('x1', PX(q.mid[0])); sg.field.setAttribute('y1', PY(q.mid[1]));
        sg.field.setAttribute('x2', (PX(q.mid[0]) + q.fv[0] / mg * 26).toFixed(1));
        sg.field.setAttribute('y2', (PY(q.mid[1]) - q.fv[1] / mg * 26).toFixed(1));
        sg.field.setAttribute('stroke-opacity', '0.7');
      }
      var hp = pathAt(M.clamp(run, 0, 1));
      head.setAttribute('cx', PX(hp[0]).toFixed(1));
      head.setAttribute('cy', PY(hp[1]).toFixed(1));

      total.textContent = 'running total = ' + sum.toFixed(3);
      totalNote.textContent = upTo >= N ? 'that number is the line integral' : '';
      S.op(totalNote, upTo >= N ? 1 : 0);
      notes.forEach(function (n, k) { S.op(n, M.beat(p, 0.45 + k * 0.13, 0.6 + k * 0.13)); });
    };
  });

  /* --------------------------- three ways of saying the same thing --- */

  A.scene('conservative-triangle', function (root) {
    var W = 980, H = 560;
    var svg = S.root(W, H,
      'Three equivalent statements about a force field: no work round a closed loop, it is ' +
      'the gradient of a potential, and its curl vanishes. Each implies the other two.');
    S.defsArrows(svg);
    root.appendChild(svg);

    function box(x, y, w, h, title, expr, note) {
      var g = S.g({});
      svg.appendChild(g);
      var r = S.rect(x, y, w, h, 's-ghost');
      r.setAttribute('fill', 'var(--surface)');
      r.setAttribute('rx', '2');
      r.setAttribute('stroke', 'var(--wave)');
      g.appendChild(r);
      g.appendChild(S.text(x + w / 2, y + 26, title, 's-lbl', 'middle'));
      var e = S.text(x + w / 2, y + 56, expr, 's-lbl-b', 'middle');
      e.setAttribute('font-size', '16');
      g.appendChild(e);
      g.appendChild(S.text(x + w / 2, y + 80, note, 's-lbl', 'middle'));
      return g;
    }

    var bw = 300, bh = 100;
    var top = box(W / 2 - bw / 2, 70, bw, bh,
      'no work round any closed loop', '∮ F · dr = 0', 'go out and come back for free');
    var left = box(60, 300, bw, bh,
      'it comes from a potential', 'F = −∇V', 'the potential is the work to get there');
    var right = box(W - 60 - bw, 300, bw, bh,
      'it has no curl anywhere', '∇ × F = 0', 'no paddlewheel turns');

    var edges = [
      { a: [W / 2 - 80, 170], b: [230, 300], lbl: 'define V as the work done', side: 'left' },
      { a: [W / 2 + 80, 170], b: [W - 230, 300], lbl: 'Stokes’ theorem', side: 'right' },
      { a: [360, 350], b: [W - 360, 350], lbl: 'curl of a gradient is zero', side: 'mid' }
    ].map(function (e) {
      var g = S.g({});
      svg.appendChild(g);
      var l = S.arrow(svg, e.a[0], e.a[1], e.b[0], e.b[1], 'q');
      l.setAttribute('stroke-width', '2');
      l.setAttribute('marker-start', l.getAttribute('marker-end'));
      g.appendChild(l);
      var mx = (e.a[0] + e.b[0]) / 2, my = (e.a[1] + e.b[1]) / 2;
      var t = S.text(mx, my + (e.side === 'mid' ? -14 : -10), e.lbl, 's-lbl-q',
                     e.side === 'mid' ? 'middle' : (e.side === 'left' ? 'end' : 'start'));
      t.setAttribute('font-size', '11');
      g.appendChild(t);
      return g;
    });

    /* Two paths, same work: the picture behind the top box. */
    var gPaths = S.g({});
    svg.appendChild(gPaths);
    var px0 = 330, py0 = 470, px1 = 650;
    gPaths.appendChild(S.circle(px0, py0, 5, 's-fill-i'));
    gPaths.appendChild(S.circle(px1, py0, 5, 's-fill-i'));
    gPaths.appendChild(S.text(px0 - 12, py0 + 5, 'r₁', 's-lbl-b', 'end'));
    gPaths.appendChild(S.text(px1 + 12, py0 + 5, 'r₂', 's-lbl-b', 'start'));
    var up = S.path('M' + px0 + ' ' + py0 + 'Q' + (px0 + px1) / 2 + ' ' + (py0 - 58) + ' ' + px1 + ' ' + py0, 's-wave');
    var dn = S.path('M' + px0 + ' ' + py0 + 'Q' + (px0 + px1) / 2 + ' ' + (py0 + 58) + ' ' + px1 + ' ' + py0, 's-quantum');
    gPaths.appendChild(up); gPaths.appendChild(dn);
    gPaths.appendChild(S.text((px0 + px1) / 2, py0 - 66, 'either route', 's-lbl-w', 'middle'));
    gPaths.appendChild(S.text((px0 + px1) / 2, py0 + 84, 'same work done', 's-lbl-q', 'middle'));

    var used = S.text(W / 2, H - 16,
      'this equivalence is what licenses the potential in (1.1.1) — without it, V would not be a function of position at all',
      's-lbl-b', 'middle');
    used.setAttribute('font-size', '12');
    svg.appendChild(used);

    return function (p) {
      S.op(top, M.beat(p, 0.02, 0.16));
      S.op(edges[0], M.beat(p, 0.16, 0.3));
      S.op(left, M.beat(p, 0.22, 0.36));
      S.op(edges[1], M.beat(p, 0.34, 0.48));
      S.op(right, M.beat(p, 0.4, 0.54));
      S.op(edges[2], M.beat(p, 0.52, 0.66));
      S.op(gPaths, M.beat(p, 0.62, 0.78));
      S.op(used, M.beat(p, 0.84, 0.96));
    };
  });

  /* --------------------------------------------------- flux --- */

  A.scene('flux-surface', function (root) {
    var W = 980, H = 520;
    var svg = S.root(W, H,
      'Flux through a closed curve in two fields. Where the field has a source inside, the net ' +
      'flow outward is positive; where it merely passes through, everything that enters leaves.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var panels = [
      { id: 'radial', title: 'a source inside', verdict: 'net outward flow' },
      { id: 'uniform', title: 'a field passing through', verdict: 'in on one side, out on the other' }
    ];

    var built = panels.map(function (pn, idx) {
      var f = F.byId(pn.id);
      var cx = 260 + idx * 460, cy = 240, sc = 82, R = 1.4;
      var PX = function (x) { return cx + x * sc; };
      var PY = function (y) { return cy - y * sc; };
      var g = S.g({});
      svg.appendChild(g);

      var nA = 9;
      for (var i = 0; i < nA; i++) {
        for (var j = 0; j < nA; j++) {
          var ax = -2.1 + 4.2 * (i + 0.5) / nA, ay = -2.1 + 4.2 * (j + 0.5) / nA;
          var v = f.fn(ax, ay);
          var mg = Math.hypot(v[0], v[1]);
          if (mg < 1e-5) continue;
          var a = S.arrow(svg, PX(ax), PY(ay),
                          PX(ax) + v[0] / mg * 18, PY(ay) - v[1] / mg * 18, 'm');
          a.setAttribute('stroke-opacity', '0.28');
          g.appendChild(a);
        }
      }

      g.appendChild(S.el('circle', { cx: cx, cy: cy, r: R * sc, class: 's-ghost' }));
      g.appendChild(S.text(cx, cy - R * sc - 42, pn.title, 's-lbl-b', 'middle'));
      g.appendChild(S.text(cx, cy - R * sc - 22, f.tex, 's-lbl-w', 'middle'));

      /* Outward normals with the flow through each one. */
      var nrm = [], total = 0, K = 16;
      for (i = 0; i < K; i++) {
        var th = i / K * M.TAU;
        var nx = Math.cos(th), ny = Math.sin(th);
        var v2 = f.fn(nx * R, ny * R);
        var out = v2[0] * nx + v2[1] * ny;
        total += out * (M.TAU * R / K);
        var L = M.clamp(out * 22, -34, 34);
        var a2 = S.arrow(svg,
          PX(nx * R), PY(ny * R),
          PX(nx * R) + nx * L, PY(ny * R) - ny * L,
          out >= 0 ? 'w' : 'f');
        a2.setAttribute('stroke-width', '2.2');
        g.appendChild(a2);
        nrm.push(a2);
      }

      var read = S.text(cx, cy + R * sc + 40,
        'net flow out = ' + (Math.abs(total) < 1e-6 ? '0' : total.toFixed(2)),
        Math.abs(total) < 1e-6 ? 's-lbl' : 's-lbl-w', 'middle');
      read.setAttribute('font-size', '15');
      g.appendChild(read);
      var verdict = S.text(cx, cy + R * sc + 64, pn.verdict, 's-lbl-q', 'middle');
      g.appendChild(verdict);
      return { g: g, nrm: nrm, read: read, verdict: verdict };
    });

    var moral = S.text(W / 2, H - 18,
      '∮ A · dA counts only what crosses the boundary — everything internal cancels in pairs',
      's-lbl-b', 'middle');
    svg.appendChild(moral);

    return function (p) {
      built.forEach(function (b, i) {
        S.op(b.g, M.beat(p, 0.02 + i * 0.14, 0.2 + i * 0.14));
        b.nrm.forEach(function (n, k) {
          S.op(n, M.beat(p, 0.2 + i * 0.1 + k * 0.012, 0.36 + i * 0.1 + k * 0.012));
        });
        S.op(b.read, M.beat(p, 0.52 + i * 0.08, 0.66 + i * 0.08));
        S.op(b.verdict, M.beat(p, 0.62 + i * 0.08, 0.76 + i * 0.08));
      });
      S.op(moral, M.beat(p, 0.84, 0.96));
    };
  });

  /* --------------------------------------- the divergence theorem --- */

  A.scene('divergence-theorem', function (root) {
    var W = 1040, H = 580;
    var svg = S.root(W, H,
      'A region cut into small boxes. Every internal face is shared by two boxes, and what ' +
      'leaves one enters the other, so all internal contributions cancel and only the outer ' +
      'skin survives.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var x0 = 70, y0 = 110, side = 360, n = 6, cell = side / n;

    var gBoxes = S.g({});
    svg.appendChild(gBoxes);
    for (var i = 0; i < n; i++) {
      for (var j = 0; j < n; j++) {
        var r = S.rect(x0 + i * cell, y0 + j * cell, cell, cell, 's-ghost');
        r.setAttribute('fill', 'none');
        gBoxes.appendChild(r);
      }
    }
    gBoxes.appendChild(S.text(x0, y0 - 34, 'chop the region into little boxes', 's-lbl-b', 'start'));
    gBoxes.appendChild(S.text(x0, y0 - 14,
      'each box contributes its own divergence, times its own volume', 's-lbl', 'start'));

    /* Internal face pairs, cancelling. */
    var gInt = S.g({});
    svg.appendChild(gInt);
    for (i = 1; i < n; i++) {
      for (j = 0; j < n; j++) {
        var fx = x0 + i * cell, fy = y0 + j * cell + cell / 2;
        var a1 = S.arrow(svg, fx - 3, fy, fx - 20, fy, 'w');
        var a2 = S.arrow(svg, fx + 3, fy, fx + 20, fy, 'f');
        a1.setAttribute('stroke-opacity', '0.55');
        a2.setAttribute('stroke-opacity', '0.55');
        gInt.appendChild(a1); gInt.appendChild(a2);
      }
    }
    var intLbl = S.text(x0 + side / 2, y0 + side + 30,
      'every internal face carries two equal and opposite contributions', 's-lbl-q', 'middle');
    svg.appendChild(intLbl);
    var intLbl2 = S.text(x0 + side / 2, y0 + side + 52,
      'so they all cancel, one against the next', 's-lbl-q', 'middle');
    svg.appendChild(intLbl2);

    /* Only the skin remains. */
    var gSkin = S.g({});
    svg.appendChild(gSkin);
    var outer = S.rect(x0, y0, side, side, 's-ghost');
    outer.setAttribute('stroke', 'var(--ink-bright)');
    outer.setAttribute('stroke-width', '3');
    outer.setAttribute('fill', 'none');
    gSkin.appendChild(outer);
    for (i = 0; i < n; i++) {
      var t = (i + 0.5) / n;
      [[x0 - 4, y0 + t * side, -1, 0], [x0 + side + 4, y0 + t * side, 1, 0],
       [x0 + t * side, y0 - 4, 0, -1], [x0 + t * side, y0 + side + 4, 0, 1]]
        .forEach(function (e) {
          var a = S.arrow(svg, e[0], e[1], e[0] + e[2] * 24, e[1] + e[3] * 24, 'i');
          a.setAttribute('stroke-width', '2');
          gSkin.appendChild(a);
        });
    }

    var eq = [
      '∫ (∇ · A) dV   =   ∮ A · dA',
      'the sum over every little box   =   the flow through the outer surface',
      '',
      'used in §1.7 like this:',
      'd/dt ∫ |ψ|² dV = − ∫ (∇ · J) dV = − ∮ J · dA',
      'and for a normalisable ψ, both ψ and ∇ψ die off at infinity,',
      'so J vanishes on that surface and the whole thing is zero'
    ].map(function (str, k) {
      var el = S.text(530, 150 + k * 44, str,
        k === 0 ? 's-lbl-b' : (k === 4 || k === 6 ? 's-lbl-w' : 's-lbl'), 'start');
      el.setAttribute('font-size', k === 0 ? '17' : '12');
      svg.appendChild(el);
      return el;
    });

    return function (p) {
      S.op(gBoxes, M.beat(p, 0.02, 0.16));
      S.op(gInt, M.beat(p, 0.16, 0.32));
      S.op(intLbl, M.beat(p, 0.28, 0.42));
      S.op(intLbl2, M.beat(p, 0.32, 0.46));
      var skin = M.beat(p, 0.44, 0.6);
      S.op(gSkin, skin);
      S.op(gInt, M.beat(p, 0.16, 0.32) * (1 - skin * 0.8));
      eq.forEach(function (e, k) { S.op(e, M.beat(p, 0.34 + k * 0.08, 0.5 + k * 0.08)); });
    };
  });
})(window.A = window.A || {});
