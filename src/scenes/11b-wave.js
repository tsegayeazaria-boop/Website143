/* Section 1.1, wave half: how the two curl equations feed each other, the
   vector identity that turns them into one second-order equation, the plane
   wave that solves it, and the phasor behind writing that wave as e^(i theta). */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  /* ------------------------------------------- the two curl equations --- */

  A.scene('maxwell-curl', function (root) {
    var W = 880, H = 340;
    var svg = S.root(W, H,
      'A changing electric field is encircled by a magnetic field, and a changing ' +
      'magnetic field is encircled by an electric field. Each change is the other ' +
      'field’s circulation.');
    S.defsArrows(svg);
    root.appendChild(svg);

    function panel(cx, cy, coreTone, loopTone, coreLabel, loopLabel, law) {
      var g = S.g({});
      svg.appendChild(g);
      /* The changing field, drawn as a vertical arrow through the loop. */
      var core = S.arrow(svg, cx, cy + 88, cx, cy - 92, coreTone);
      core.setAttribute('stroke-width', '2.5');
      g.appendChild(core);
      g.appendChild(S.text(cx + 12, cy - 84, coreLabel, 's-lbl-' + (coreTone === 'w' ? 'w' : 'q'), 'start'));
      /* The circulation, drawn as an ellipse read as a loop in perspective. */
      var ring = S.el('ellipse', {
        cx: cx, cy: cy, rx: 74, ry: 26, class: 's-ghost'
      });
      ring.setAttribute('stroke', loopTone === 'q' ? 'var(--quantum)' : 'var(--wave)');
      ring.setAttribute('stroke-width', '2');
      g.appendChild(ring);
      var tip = S.arrow(svg, cx + 66, cy + 15, cx + 76, cy + 2, loopTone);
      tip.setAttribute('stroke-width', '2');
      g.appendChild(tip);
      g.appendChild(S.text(cx + 86, cy + 6, loopLabel, 's-lbl-' + (loopTone === 'q' ? 'q' : 'w'), 'start'));
      g.appendChild(S.text(cx, cy + 128, law, 's-lbl', 'middle'));
      return { g: g, ring: ring, core: core };
    }

    var left = panel(230, 150, 'w', 'q', 'E growing', 'B circulates',
      'Ampère–Maxwell:  ∇ × B = μ₀ε₀ ∂E/∂t');
    var right = panel(650, 150, 'q', 'w', 'B growing', 'E circulates',
      'Faraday:  ∇ × E = −∂B/∂t');

    var link = S.arrow(svg, 330, 150, 545, 150, 'i');
    link.setAttribute('class', 's-axis s-dash');
    svg.appendChild(link);
    var linkLbl = S.text(438, 138, 'feeds', 's-lbl', 'middle');
    svg.appendChild(linkLbl);

    return function (p, t) {
      S.op(left.g, M.beat(p, 0.05, 0.28));
      S.op(right.g, M.beat(p, 0.3, 0.55));
      S.op(link, M.beat(p, 0.55, 0.75));
      S.op(linkLbl, M.beat(p, 0.55, 0.75));
      var pulse = 0.6 + 0.4 * Math.sin(t * 1.6);
      left.core.setAttribute('stroke-width', (1.8 + pulse * 1.4).toFixed(2));
      right.core.setAttribute('stroke-width', (1.8 + (1 - pulse) * 1.4).toFixed(2));
    };
  });

  /* ----------------------------------- where the Laplacian comes from --- */

  A.scene('vector-identity', function (root) {
    var W = 880, H = 400;
    var svg = S.root(W, H,
      'The same quantity, curl of curl E, evaluated two ways: through the vector ' +
      'identity on the left and through the two curl equations on the right. ' +
      'Setting the results equal is the wave equation.');
    S.defsArrows(svg);
    root.appendChild(svg);

    function box(x, y, w, h, label, cls) {
      var g = S.g({});
      var r = S.rect(x, y, w, h, cls || 's-ghost');
      r.setAttribute('fill', 'none');
      r.setAttribute('rx', '2');
      g.appendChild(r);
      var t = S.text(x + w / 2, y + h / 2 + 4, label, 's-lbl-b', 'middle');
      g.appendChild(t);
      svg.appendChild(g);
      return { g: g, t: t, cx: x + w / 2, cy: y + h / 2, x: x, y: y, w: w, h: h };
    }

    var head = box(330, 30, 220, 46, '∇ × (∇ × E)');

    var idA = box(60, 150, 230, 46, '∇(∇ · E)');
    var idB = box(60, 232, 230, 46, '− ∇²E');
    var eqA = box(590, 150, 230, 46, '− ∂/∂t (∇ × B)');
    var eqB = box(590, 232, 230, 46, '− μ₀ε₀ ∂²E/∂t²');

    var zeroLbl = S.text(175, 210, '∇ · E = 0 in free space, so this term dies', 's-lbl-f', 'middle');
    svg.appendChild(zeroLbl);

    var arrows = [
      S.arrow(svg, 380, 76, 245, 146, 'm'),
      S.arrow(svg, 500, 76, 640, 146, 'm'),
      S.arrow(svg, 175, 196, 175, 228, 'm'),
      S.arrow(svg, 705, 196, 705, 228, 'm')
    ];
    arrows.forEach(function (a) { svg.appendChild(a); });

    var idLbl = S.text(175, 128, 'vector identity', 's-lbl', 'middle');
    var eqLbl = S.text(705, 128, 'Faraday, then Ampère–Maxwell', 's-lbl', 'middle');
    svg.appendChild(idLbl); svg.appendChild(eqLbl);

    var joinL = S.line(290, 255, 400, 255, 's-axis s-dash');
    var joinR = S.line(480, 255, 590, 255, 's-axis s-dash');
    var equals = S.text(440, 261, 'must be equal', 's-lbl-w', 'middle');
    svg.appendChild(joinL); svg.appendChild(joinR); svg.appendChild(equals);

    var result = S.text(W / 2, 348, '∇²E − (1/c²) ∂²E/∂t² = 0', 's-lbl-w', 'middle');
    result.setAttribute('font-size', '14');
    var cLbl = S.text(W / 2, 372, 'with  c = 1 / √(μ₀ε₀)', 's-lbl', 'middle');
    svg.appendChild(result); svg.appendChild(cLbl);

    return function (p) {
      S.op(head.g, M.beat(p, 0.02, 0.14));
      S.op(arrows[0], M.beat(p, 0.14, 0.24));
      S.op(arrows[1], M.beat(p, 0.14, 0.24));
      S.op(idA.g, M.beat(p, 0.2, 0.32));
      S.op(eqA.g, M.beat(p, 0.2, 0.32));
      S.op(idLbl, M.beat(p, 0.2, 0.32));
      S.op(eqLbl, M.beat(p, 0.2, 0.32));
      S.op(arrows[2], M.beat(p, 0.32, 0.42));
      S.op(arrows[3], M.beat(p, 0.32, 0.42));
      S.op(idB.g, M.beat(p, 0.38, 0.5));
      S.op(eqB.g, M.beat(p, 0.38, 0.5));
      var kill = M.beat(p, 0.46, 0.62);
      S.op(zeroLbl, kill);
      idA.g.style.opacity = M.clamp(M.beat(p, 0.2, 0.32) - kill * 0.65, 0, 1);
      S.op(joinL, M.beat(p, 0.62, 0.74));
      S.op(joinR, M.beat(p, 0.62, 0.74));
      S.op(equals, M.beat(p, 0.62, 0.74));
      S.op(result, M.beat(p, 0.74, 0.88));
      S.op(cLbl, M.beat(p, 0.82, 0.95));
    };
  });

  /* ----------------------------------------- the plane wave, in the round --- */

  A.scene('wave-em', function (root, api) {
    var W = 900, H = 620;
    var svg = S.root(W, H,
      'A monochromatic plane wave travelling along x. The electric field oscillates ' +
      'along y, the magnetic field along z, both in step, and the whole pattern slides ' +
      'along x at the speed of light.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var ox = 92, oy = 292;
    var xScale = 76;            /* screen px per unit of x */
    var amp = 120;
    /* Axonometric: z runs down and to the right so both fields stay readable. */
    function proj(x, y, z) {
      return [ox + x * xScale + z * 0.40 * amp, oy - y * amp + z * 0.30 * amp];
    }

    var xMax = 8.6;
    var axX = S.arrow(svg, ox, oy, proj(xMax, 0, 0)[0], oy, 'i');
    var axY = S.arrow(svg, ox, oy, proj(0, 1.6, 0)[0], proj(0, 1.6, 0)[1], 'i');
    var axZ = S.arrow(svg, ox, oy, proj(0, 0, 1.5)[0], proj(0, 0, 1.5)[1], 'i');
    [axX, axY, axZ].forEach(function (a) { svg.appendChild(a); });
    svg.appendChild(S.text(proj(xMax, 0, 0)[0] + 6, oy + 4, 'x', 's-lbl-b', 'start'));
    svg.appendChild(S.text(proj(0, 1.6, 0)[0] - 6, proj(0, 1.6, 0)[1] - 6, 'y', 's-lbl-b', 'end'));
    svg.appendChild(S.text(proj(0, 0, 1.5)[0] + 8, proj(0, 0, 1.5)[1] + 12, 'z', 's-lbl-b', 'start'));

    var gE = S.g({}), gB = S.g({}), gBars = S.g({});
    svg.appendChild(gBars); svg.appendChild(gE); svg.appendChild(gB);
    var eCurve = S.path('', 's-wave');
    var bCurve = S.path('', 's-quantum');
    gE.appendChild(eCurve); gB.appendChild(bCurve);
    var eLbl = S.text(0, 0, 'E along y', 's-lbl-w', 'start');
    var bLbl = S.text(0, 0, 'B along z', 's-lbl-q', 'start');
    gE.appendChild(eLbl); gB.appendChild(bLbl);

    var NB = 34;
    var eBars = [], bBars = [];
    for (var i = 0; i < NB; i++) {
      var eb = S.line(0, 0, 0, 0, 's-ghost');
      eb.setAttribute('stroke', 'var(--wave)');
      eb.setAttribute('stroke-opacity', '0.42');
      var bb = S.line(0, 0, 0, 0, 's-ghost');
      bb.setAttribute('stroke', 'var(--quantum)');
      bb.setAttribute('stroke-opacity', '0.42');
      gBars.appendChild(eb); gBars.appendChild(bb);
      eBars.push(eb); bBars.push(bb);
    }

    /* Wavelength bracket, drawn on the x axis between two crests. */
    var gLam = S.g({});
    svg.appendChild(gLam);
    var lamBrace = S.path('', 's-ghost');
    lamBrace.setAttribute('stroke', 'var(--ink-bright)');
    gLam.appendChild(lamBrace);
    var lamLbl = S.text(W / 2, 0, 'one wavelength   λ = 2π/k', 's-lbl-b', 'middle');
    gLam.appendChild(lamLbl);

    var gFront = S.g({});
    svg.appendChild(gFront);
    var fronts = [];
    for (var q = 0; q < 3; q++) {
      var pl = S.el('polygon', { class: 's-ghost', fill: 'var(--wave)', 'fill-opacity': '0.05' });
      gFront.appendChild(pl);
      fronts.push(pl);
    }
    var frontLbl = S.text(ox + 40, 64, 'planes of constant phase: the wavefronts', 's-lbl', 'start');
    gFront.appendChild(frontLbl);

    var speed = S.text(ox, H - 18, '', 's-lbl', 'start');
    svg.appendChild(speed);

    var k = 2.0;   /* radians per unit x, so lambda = pi units */

    return function (p, t) {
      var time = api.reduced ? 1.2 : (M.beat(p, 0.55, 1.0) * 7 + t * 0.55);
      var phase = k * 0 - time;

      var ePts = [], bPts = [], j;
      for (j = 0; j <= 200; j++) {
        var x = (j / 200) * xMax;
        var s = Math.sin(k * x - time);
        ePts.push(proj(x, s, 0));
        bPts.push(proj(x, 0, s));
      }
      S.setD(eCurve, S.polyD(ePts));
      S.setD(bCurve, S.polyD(bPts));

      for (j = 0; j < NB; j++) {
        var xb = (j / (NB - 1)) * xMax;
        var sb = Math.sin(k * xb - time);
        var base = proj(xb, 0, 0);
        var te = proj(xb, sb, 0), tb = proj(xb, 0, sb);
        eBars[j].setAttribute('x1', base[0]); eBars[j].setAttribute('y1', base[1]);
        eBars[j].setAttribute('x2', te[0]); eBars[j].setAttribute('y2', te[1]);
        bBars[j].setAttribute('x1', base[0]); bBars[j].setAttribute('y1', base[1]);
        bBars[j].setAttribute('x2', tb[0]); bBars[j].setAttribute('y2', tb[1]);
      }

      var eAt = proj(xMax * 0.5, 1.05, 0);
      eLbl.setAttribute('x', eAt[0]); eLbl.setAttribute('y', eAt[1] - 40);
      var bAt = proj(xMax * 0.78, 0, 1.15);
      bLbl.setAttribute('x', bAt[0] + 8); bLbl.setAttribute('y', bAt[1] + 4);

      S.op(gE, M.beat(p, 0.10, 0.30));
      S.op(gB, M.beat(p, 0.30, 0.48));
      S.op(gBars, M.beat(p, 0.18, 0.42) * 0.9);

      /* Bracket one wavelength: crests sit where k x - time = pi/2 mod 2 pi. */
      var lamP = M.beat(p, 0.48, 0.62);
      var firstCrest = ((Math.PI / 2 + time) / k);
      while (firstCrest < 0.4) firstCrest += M.TAU / k;
      var lam = M.TAU / k;
      var xa = firstCrest, xb2 = firstCrest + lam;
      if (xb2 < xMax) {
        var pa = proj(xa, 0, 0), pb = proj(xb2, 0, 0);
        S.setD(lamBrace, S.braceD(pa[0], pb[0], oy + 212, 7));
        lamLbl.setAttribute('x', (pa[0] + pb[0]) / 2);
        lamLbl.setAttribute('y', oy + 248);
      }
      S.op(gLam, lamP);

      var frontP = M.beat(p, 0.72, 0.9);
      for (q = 0; q < 3; q++) {
        var xf = firstCrest + q * lam * 0.5;
        if (xf > xMax) { S.op(fronts[q], 0); continue; }
        var c1 = proj(xf, 1.25, -0.5), c2 = proj(xf, 1.25, 1.5),
            c3 = proj(xf, -1.25, 1.5), c4 = proj(xf, -1.25, -0.5);
        fronts[q].setAttribute('points',
          c1[0].toFixed(1) + ',' + c1[1].toFixed(1) + ' ' +
          c2[0].toFixed(1) + ',' + c2[1].toFixed(1) + ' ' +
          c3[0].toFixed(1) + ',' + c3[1].toFixed(1) + ' ' +
          c4[0].toFixed(1) + ',' + c4[1].toFixed(1));
        S.op(fronts[q], frontP * (1 - q * 0.22));
      }
      S.op(frontLbl, frontP);

      speed.textContent = 'the pattern slides along x without changing shape, at speed c = omega / k';
      S.op(speed, M.beat(p, 0.62, 0.78));
    };
  });

  /* ------------------------------------- lambda and T are the same fact --- */

  A.scene('wave-anatomy', function (root) {
    var W = 880, H = 440;
    var svg = S.root(W, H,
      'The same wave read two ways: frozen in time it repeats every wavelength in ' +
      'space; watched at one point it repeats every period in time.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var x0 = 90, x1 = 800;
    var rows = [
      { y: 120, label: 'snapshot at fixed t  ·  repeats every λ in x', axis: 'x', mark: 'λ = 2π/k' },
      { y: 320, label: 'history at fixed x  ·  repeats every T in t', axis: 't', mark: 'T = 2π/ω' }
    ];
    var amp = 58, k = 3.4;

    var built = rows.map(function (r) {
      var g = S.g({});
      svg.appendChild(g);
      g.appendChild(S.line(x0, r.y, x1, r.y, 's-axis'));
      g.appendChild(S.text(x0, r.y - amp - 26, r.label, 's-lbl', 'start'));
      g.appendChild(S.text(x1 + 6, r.y + 4, r.axis, 's-lbl-b', 'start'));
      var pth = S.path('', 's-wave');
      g.appendChild(pth);
      var brace = S.path('', 's-ghost');
      brace.setAttribute('stroke', 'var(--quantum)');
      g.appendChild(brace);
      var lbl = S.text(W / 2, 0, r.mark, 's-lbl-q', 'middle');
      g.appendChild(lbl);
      return { g: g, path: pth, brace: brace, lbl: lbl, y: r.y };
    });

    var link = S.text(W / 2, H - 22, 'λ / T = ω / k = c', 's-lbl-w', 'middle');
    link.setAttribute('font-size', '13');
    svg.appendChild(link);

    return function (p) {
      built.forEach(function (b, i) {
        S.op(b.g, M.beat(p, i * 0.12, 0.25 + i * 0.12));
        var pts = S.sample(240, 0, 1, function (u) {
          return [M.lerp(x0, x1, u), b.y - Math.cos(k * u * M.TAU * 0.5 - (i ? Math.PI / 2 : 0)) * amp];
        });
        S.setD(b.path, S.polyD(pts));
        S.draw(b.path, M.easeOut(M.beat(p, 0.08 + i * 0.14, 0.45 + i * 0.14)));
        var period = (x1 - x0) / (k * 0.5 * 2);
        var a = x0 + period * 0.5, c = a + period;
        S.setD(b.brace, S.braceD(a, c, b.y + amp + 12, 7));
        b.lbl.setAttribute('x', (a + c) / 2);
        b.lbl.setAttribute('y', b.y + amp + 46);
        S.op(b.brace, M.beat(p, 0.45 + i * 0.08, 0.62 + i * 0.08));
        S.op(b.lbl, M.beat(p, 0.45 + i * 0.08, 0.62 + i * 0.08));
      });
      S.op(link, M.beat(p, 0.75, 0.92));
    };
  });

  /* ---------------------------------------- why the field is transverse --- */

  A.scene('transverse', function (root) {
    var W = 860, H = 360;
    var svg = S.root(W, H,
      'A wavefront plane with the propagation direction normal to it. Because the ' +
      'divergence of E must vanish, E has no component along the propagation direction.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var cx = 340, cy = 190;
    var plane = S.el('polygon', {
      points: [cx - 100, cy - 130, cx + 60, cy - 90, cx + 60, cy + 110, cx - 100, cy + 70].join(' '),
      class: 's-ghost', fill: 'var(--wave)', 'fill-opacity': '0.06'
    });
    svg.appendChild(plane);
    svg.appendChild(S.text(cx - 96, cy - 142, 'wavefront: E has the same value everywhere on this plane', 's-lbl', 'start'));

    var kArrow = S.arrow(svg, cx - 20, cy - 10, cx + 190, cy - 10, 'i');
    kArrow.setAttribute('stroke-width', '2.5');
    svg.appendChild(kArrow);
    svg.appendChild(S.text(cx + 196, cy - 6, 'k, the propagation direction', 's-lbl-b', 'start'));

    var eArrow = S.arrow(svg, cx - 20, cy - 10, cx - 20, cy - 110, 'w');
    eArrow.setAttribute('stroke-width', '2.5');
    svg.appendChild(eArrow);
    svg.appendChild(S.text(cx - 26, cy - 118, 'E lies in the plane', 's-lbl-w', 'end'));

    var bad = S.arrow(svg, cx - 20, cy - 10, cx + 96, cy - 10, 'f');
    bad.setAttribute('stroke-width', '3');
    svg.appendChild(bad);
    var badLbl = S.text(cx + 40, cy + 22, 'a component along k is forbidden', 's-lbl-f', 'middle');
    svg.appendChild(badLbl);
    var cross = S.g({});
    cross.appendChild(S.line(cx + 30, cy - 22, cx + 54, cy + 2, 's-fail'));
    cross.appendChild(S.line(cx + 54, cy - 22, cx + 30, cy + 2, 's-fail'));
    svg.appendChild(cross);

    var reason = S.text(W / 2, H - 26,
      '∇ · E = 0  becomes  i k · E = 0  for a plane wave, so k · E = 0', 's-lbl-w', 'middle');
    reason.setAttribute('font-size', '13');
    svg.appendChild(reason);

    return function (p) {
      S.op(plane, M.beat(p, 0.05, 0.25));
      S.op(kArrow, M.beat(p, 0.2, 0.38));
      S.op(eArrow, M.beat(p, 0.35, 0.55));
      var no = M.beat(p, 0.55, 0.72);
      S.op(bad, no * 0.85);
      S.op(badLbl, no);
      S.op(cross, M.beat(p, 0.66, 0.8));
      S.op(reason, M.beat(p, 0.78, 0.94));
    };
  });

  /* ---------------------------------- the phasor behind the exponential --- */

  A.scene('phasor', function (root, api) {
    var W = 960, H = 520;
    var svg = S.root(W, H,
      'A unit vector turning in the complex plane. Its shadow on the real axis traces ' +
      'a cosine, which is why a cosine wave can be carried by a complex exponential.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var cx = 200, cy = 250, R = 140;
    svg.appendChild(S.el('circle', { cx: cx, cy: cy, r: R, class: 's-ghost' }));
    var reAx = S.arrow(svg, cx - R - 34, cy, cx + R + 34, cy, 'i');
    var imAx = S.arrow(svg, cx, cy + R + 34, cx, cy - R - 34, 'i');
    svg.appendChild(reAx); svg.appendChild(imAx);
    svg.appendChild(S.text(cx + R + 40, cy + 4, 'Re', 's-lbl-b', 'start'));
    svg.appendChild(S.text(cx + 6, cy - R - 40, 'Im', 's-lbl-b', 'start'));

    var vec = S.arrow(svg, cx, cy, cx + R, cy, 'w');
    vec.setAttribute('stroke-width', '2.5');
    svg.appendChild(vec);
    var dot = S.circle(cx + R, cy, 6, 's-fill-w');
    svg.appendChild(dot);
    var angArc = S.path('', 's-ghost');
    angArc.setAttribute('stroke', 'var(--quantum)');
    svg.appendChild(angArc);
    var angLbl = S.text(cx + 46, cy - 12, 'θ = kx − ωt', 's-lbl-q', 'start');
    svg.appendChild(angLbl);

    var shadow = S.line(0, 0, 0, 0, 's-axis s-dash');
    svg.appendChild(shadow);
    var shadowDot = S.circle(cx + R, cy, 5, 's-fill-i');
    svg.appendChild(shadowDot);

    var px0 = 430, px1 = 910;
    svg.appendChild(S.line(px0, cy, px1, cy, 's-axis'));
    svg.appendChild(S.text(px1, cy + 22, 'theta', 's-lbl', 'end'));
    var trace = S.path('', 's-wave');
    svg.appendChild(trace);
    var carry = S.line(0, 0, 0, 0, 's-axis s-dash');
    svg.appendChild(carry);

    var caption = S.text(px0, cy - R - 46, 'the shadow on the real axis is cos θ', 's-lbl-w', 'start');
    svg.appendChild(caption);
    var note = S.text(px0, cy + R + 66,
      'E₀ cos(kx − ωt) = Re { E₀ e^{i(kx − ωt)} }', 's-lbl-b', 'start');
    note.setAttribute('font-size', '13');
    svg.appendChild(note);
    var note2 = S.text(px0, cy + R + 92,
      'the equation is linear with real coefficients, so the real', 's-lbl', 'start');
    var note3 = S.text(px0, cy + R + 112,
      'part of a solution is itself a solution', 's-lbl', 'start');
    svg.appendChild(note2); svg.appendChild(note3);

    return function (p, t) {
      var th = api.reduced ? 1.1 : (M.beat(p, 0.12, 1.0) * 3.4 * M.TAU + t * 0.9) % M.TAU;
      var vx = cx + Math.cos(th) * R, vy = cy - Math.sin(th) * R;
      vec.setAttribute('x2', vx.toFixed(1)); vec.setAttribute('y2', vy.toFixed(1));
      dot.setAttribute('cx', vx.toFixed(1)); dot.setAttribute('cy', vy.toFixed(1));

      var ar = 44;
      angArc.setAttribute('d',
        'M' + (cx + ar) + ' ' + cy +
        'A' + ar + ' ' + ar + ' 0 ' + (th > Math.PI ? 1 : 0) + ' 0 ' +
        (cx + Math.cos(th) * ar).toFixed(1) + ' ' + (cy - Math.sin(th) * ar).toFixed(1));

      var shx = cx + Math.cos(th) * R;
      shadow.setAttribute('x1', vx); shadow.setAttribute('y1', vy);
      shadow.setAttribute('x2', shx); shadow.setAttribute('y2', cy);
      shadowDot.setAttribute('cx', shx.toFixed(1));
      shadowDot.setAttribute('cy', cy);

      /* Trace cos over one turn, with the current angle marked. */
      var pts = S.sample(200, 0, M.TAU, function (a) {
        return [M.map(a, 0, M.TAU, px0, px1), cy - Math.cos(a) * R];
      });
      S.setD(trace, S.polyD(pts));
      S.draw(trace, M.beat(p, 0.2, 0.5));

      var tx = M.map(th, 0, M.TAU, px0, px1);
      var ty = cy - Math.cos(th) * R;
      carry.setAttribute('x1', shx); carry.setAttribute('y1', cy);
      carry.setAttribute('x2', tx); carry.setAttribute('y2', ty);
      S.op(carry, M.beat(p, 0.34, 0.5) * 0.7);

      S.op(angLbl, M.beat(p, 0.1, 0.24));
      S.op(caption, M.beat(p, 0.42, 0.58));
      S.op(note, M.beat(p, 0.6, 0.76));
      S.op(note2, M.beat(p, 0.74, 0.9));
      S.op(note3, M.beat(p, 0.78, 0.94));
    };
  });
})(window.A = window.A || {});
