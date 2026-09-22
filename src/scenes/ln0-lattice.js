/* Scenes 1-3 of the lattice-anisotropy explainer: one pillar becomes a lattice,
   one bond carries a coupling, three bonds are alike.

   Nothing here is a traced illustration. Sites and bonds come from
   A.lattice.buildFlake, the energy traded across a bond is the two-level
   exchange cos^2 / sin^2, and the camera is one composited transform. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg, L = A.lattice;

  /* Shared by all three scene files. ln0 sorts first, so this exists by the
     time ln1 and ln2 are evaluated. */
  var ln = A.ln = {};

  ln.W = 1180;   /* two-panel scenes, laid out side by side */
  ln.WS = 860;   /* single-panel scenes: their content is a centred blob, and a
                    1180-wide box would be mostly empty side margin, which costs
                    scale on a narrow screen for nothing. */
  ln.H = 700;

  /* Every colour on the page resolves to one of the six page tokens or a mix of
     two of them, read back from the stylesheet rather than written here. */
  ln.pal = function () {
    return {
      vd: S.cssVar('--ln-void') || '#000000',
      amp: S.cssVar('--ln-amp') || '#FFF1DA',
      over: S.cssVar('--ln-over') || '#E2542B',
      under: S.cssVar('--ln-under') || '#4C93CC',
      bal: S.cssVar('--ln-balance') || '#9A9A9A',
      wafer: S.cssVar('--ln-wafer') || '#C9C0AE'
    };
  };

  /* Sublattice amplitude, hot to black: zero is fully black, peak near-white. */
  ln.hot = function (p, t) { return S.ramp3(p.vd, p.over, p.amp, M.clamp(t, 0, 1)); };
  /* Bond imbalance, diverging and signed, with a true neutral at balance. */
  ln.divg = function (p, t) { return S.ramp3(p.under, p.bal, p.over, M.clamp(t, 0, 1)); };

  /* svg.js defaults an element's class to the atlas tones when none is given,
     and a class rule beats a presentation attribute, so every colour set here
     would lose to --wave. These strip the class so the six page tokens are the
     only thing colouring this page. */
  ln.el = function (node) { node.removeAttribute('class'); return node; };
  ln.line = function (x1, y1, x2, y2) { return ln.el(S.line(x1, y1, x2, y2, null)); };
  ln.path = function (d) { return ln.el(S.path(d, null)); };
  ln.circle = function (cx, cy, r) { return ln.el(S.circle(cx, cy, r, null)); };

  /* A pillar seen from above: a dim disc with a brighter disc offset towards the
     light. Two plain circles rather than a gradient, so the page mints no ids
     and cannot trip the duplicate-id guard. */
  ln.pillar = function (cx, cy, r, p) {
    var g = S.g();
    var base = ln.circle(cx, cy, r, null);
    base.setAttribute('fill', S.mixHex(p.vd, p.bal, 0.5));
    var hi = ln.circle(cx - r * 0.3, cy - r * 0.32, r * 0.46, null);
    hi.setAttribute('fill', S.mixHex(p.vd, p.amp, 0.72));
    g.appendChild(base);
    g.appendChild(hi);
    return { g: g, base: base, hi: hi, r: r };
  };

  /* Neutral pillar shading, on the void-to-amplitude axis with no warmth in it.
     Used wherever a pillar is just a pillar, so the warm end of the diverging
     scale stays reserved for saying something about a coupling. */
  ln.setPillarLevel = function (pil, p, level) {
    pil.base.setAttribute('fill', S.mixHex(p.vd, p.bal, 0.28 + level * 0.55));
    pil.hi.setAttribute('fill', S.mixHex(p.vd, p.amp, 0.38 + level * 0.5));
  };

  /* Sublattice amplitude, hot to black. Only where amplitude is the subject. */
  ln.setPillarHot = function (pil, p, level) {
    pil.base.setAttribute('fill', ln.hot(p, level * 0.62));
    pil.hi.setAttribute('fill', ln.hot(p, 0.45 + level * 0.55));
  };

  /* Bucket nodes into concentric shells so a few hundred of them can be
     revealed by setting a handful of group opacities instead of one attribute
     per node per frame. */
  ln.shells = function (parent, items, radiusOf, n, maxR) {
    var groups = [], i;
    for (i = 0; i < n; i++) { groups.push({ g: S.g(), op: -1 }); parent.appendChild(groups[i].g); }
    items.forEach(function (it) {
      var k = M.clamp(Math.floor(radiusOf(it) / maxR * n), 0, n - 1);
      groups[k].g.appendChild(it.node);
      it.shell = k;
    });
    return {
      groups: groups,
      /* Reveal out to a radius, with a soft edge one shell wide. */
      revealTo: function (rad) {
        for (var j = 0; j < n; j++) {
          var rj = (j + 0.5) / n * maxR;
          var o = M.clamp(M.inv(rad - rj, -maxR / n * 1.6, maxR / n * 0.4), 0, 1);
          o = M.smooth(o);
          if (Math.abs(o - groups[j].op) > 0.01) {
            S.op(groups[j].g, o);
            groups[j].op = o;
          }
        }
      }
    };
  };

  /* ------------------------------------------------------ 1. one pillar --- */

  A.scene('ln-pillar', function (root, api) {
    var p = ln.pal();
    var cam = S.camera(root);
    var svg = cam.mount(S.root(ln.WS, ln.H,
      'A single resonant pillar seen from above, lit from one side. The camera ' +
      'pulls back and several hundred more pillars resolve out of the dark, ' +
      'standing on the vertices of a honeycomb lattice.'));
    api.onResize = cam.measure;
    api.onTheme = function () { p = ln.pal(); };

    var N = 8, SC = 26, MAXR = N * 1.5 * L.A;
    var flake = L.buildFlake(N);
    var cx = ln.WS / 2, cy = ln.H / 2;
    var X = function (u) { return cx + u * SC; };
    var Y = function (v) { return cy - v * SC; };

    var bondLayer = S.g(), siteLayer = S.g();
    svg.appendChild(bondLayer);
    svg.appendChild(siteLayer);

    var bondItems = flake.bonds.map(function (b) {
      var a = flake.sites[b.a], c = flake.sites[b.b];
      var el = ln.line(X(a.x), Y(a.y), X(c.x), Y(c.y), null);
      el.setAttribute('stroke', S.mixHex(p.vd, p.bal, 0.34));
      el.setAttribute('stroke-width', 1.6);
      el.setAttribute('stroke-linecap', 'round');
      var m = L.bondMidpoint(flake, b);
      return { node: el, r: Math.sqrt(m.x * m.x + m.y * m.y) };
    });
    var siteItems = flake.sites.map(function (s) {
      var pil = ln.pillar(X(s.x), Y(s.y), SC * 0.23, p);
      return { node: pil.g, r: Math.sqrt(s.x * s.x + s.y * s.y) };
    });

    var bondShells = ln.shells(bondLayer, bondItems, function (i) { return i.r; }, 18, MAXR);
    var siteShells = ln.shells(siteLayer, siteItems, function (i) { return i.r; }, 18, MAXR);

    return function (pr) {
      var q = api.reduced ? 1 : M.easeInOut(pr);
      /* Pull back from one pillar filling the frame to the whole flake. */
      var zoom = Math.exp(M.lerp(Math.log(34), Math.log(1), q));
      cam.lookAt(cx, cy, zoom);
      /* The lattice resolves outward as the camera retreats, so pillars arrive
         because there is room for them rather than because they fade in. */
      var reach = M.lerp(L.A * 0.6, MAXR * 1.12, M.easeOut(q));
      siteShells.revealTo(reach);
      bondShells.revealTo(M.lerp(-MAXR, MAXR * 1.12, M.easeOut(M.beat(q, 0.42, 1))));
    };
  });

  /* -------------------------------------------------------- 2. one bond --- */

  A.scene('ln-bond', function (root, api) {
    var p = ln.pal();
    var cam = S.camera(root);
    var svg = cam.mount(S.root(ln.WS, ln.H,
      'The camera dives into a single pair of neighbouring pillars. Energy ' +
      'crosses from one to the other and back, which is what the coupling on ' +
      'that bond measures.'));
    api.onResize = cam.measure;
    api.onTheme = function () { p = ln.pal(); };

    var N = 3, SC = 86;
    var flake = L.buildFlake(N);
    var cx = ln.WS / 2, cy = ln.H / 2;
    var X = function (u) { return cx + u * SC; };
    var Y = function (v) { return cy - v * SC; };

    /* The pair is the central A site and its neighbour along bond direction 0. */
    var ia = -1, ib = -1;
    flake.sites.forEach(function (s, i) {
      if (s.sub === 'A' && s.i === 0 && s.j === 0) ia = i;
      if (s.sub === 'B' && s.i === 0 && s.j === 0) ib = i;
    });
    var sa = flake.sites[ia], sb = flake.sites[ib];

    var ctx = S.g(), pairLayer = S.g();
    svg.appendChild(ctx);
    svg.appendChild(pairLayer);

    /* Everything that is not the pair, so it can fall away. */
    flake.bonds.forEach(function (b) {
      if (b.a === ia && b.b === ib) return;
      var a = flake.sites[b.a], c = flake.sites[b.b];
      var el = ln.line(X(a.x), Y(a.y), X(c.x), Y(c.y), null);
      el.setAttribute('stroke', S.mixHex(p.vd, p.bal, 0.3));
      el.setAttribute('stroke-width', 2);
      ctx.appendChild(el);
    });
    flake.sites.forEach(function (s, i) {
      if (i === ia || i === ib) return;
      ctx.appendChild(ln.pillar(X(s.x), Y(s.y), SC * 0.2, p).g);
    });

    var bond = ln.line(X(sa.x), Y(sa.y), X(sb.x), Y(sb.y), null);
    bond.setAttribute('stroke', p.bal);
    bond.setAttribute('stroke-width', 5);
    bond.setAttribute('stroke-linecap', 'round');
    pairLayer.appendChild(bond);

    var pa = ln.pillar(X(sa.x), Y(sa.y), SC * 0.24, p);
    var pb = ln.pillar(X(sb.x), Y(sb.y), SC * 0.24, p);
    pairLayer.appendChild(pa.g);
    pairLayer.appendChild(pb.g);

    var pulse = ln.circle(0, 0, SC * 0.085, null);
    pulse.setAttribute('fill', p.amp);
    pairLayer.appendChild(pulse);

    var mid = L.bondMidpoint(flake, { a: ia, b: ib });

    return function (pr) {
      var q = api.reduced ? 1 : pr;
      var zoom = M.lerp(1.0, 2.5, M.easeInOut(M.beat(q, 0, 0.55)));
      cam.lookAt(X(mid.x), Y(mid.y), zoom);
      S.op(ctx, 1 - M.smooth(M.beat(q, 0.05, 0.5)));

      /* Two coupled resonators trade energy: weight cos^2 on one site and
         sin^2 on the other. Ends with the energy on the far site, so the
         static frame is the informative one. */
      var th = M.beat(q, 0.1, 0.95) * Math.PI * 1.5;
      var wB = Math.sin(th) * Math.sin(th);
      ln.setPillarHot(pa, p, 1 - wB);
      ln.setPillarHot(pb, p, wB);
      pulse.setAttribute('cx', M.lerp(X(sa.x), X(sb.x), wB).toFixed(2));
      pulse.setAttribute('cy', M.lerp(Y(sa.y), Y(sb.y), wB).toFixed(2));
      S.op(pulse, M.smooth(M.beat(q, 0.08, 0.2)) * (0.45 + 0.55 * 4 * wB * (1 - wB)));
    };
  });

  /* ----------------------------------------------------- 3. three bonds --- */

  A.scene('ln-three', function (root, api) {
    var p = ln.pal();
    var cam = S.camera(root);
    var svg = cam.mount(S.root(ln.WS, ln.H,
      'One unit cell: an A site joined to three B sites along the three bond ' +
      'directions, a hundred and twenty degrees apart. The three bonds light in ' +
      'turn, all the same colour and all the same width.'));
    api.onResize = cam.measure;
    api.onTheme = function () { p = ln.pal(); };

    var SC = 150;
    var cx = ln.WS / 2, cy = ln.H / 2;
    var X = function (u) { return cx + u * SC; };
    var Y = function (v) { return cy - v * SC; };

    var bonds = [], ends = [], l;
    for (l = 0; l < 3; l++) {
      var r = L.RHO[l];
      var el = ln.line(X(0), Y(0), X(r.x), Y(r.y), null);
      el.setAttribute('stroke', p.bal);
      el.setAttribute('stroke-width', 5);
      el.setAttribute('stroke-linecap', 'round');
      svg.appendChild(el);
      bonds.push(el);
    }
    for (l = 0; l < 3; l++) {
      ends.push(ln.pillar(X(L.RHO[l].x), Y(L.RHO[l].y), SC * 0.16, p));
      svg.appendChild(ends[l].g);
    }
    var hub = ln.pillar(X(0), Y(0), SC * 0.16, p);
    svg.appendChild(hub.g);

    return function (pr) {
      var q = api.reduced ? 1 : pr;
      cam.lookAt(cx, cy, M.lerp(1.9, 1.0, M.easeInOut(M.beat(q, 0, 0.45))));
      ln.setPillarLevel(hub, p, 0.55);
      for (var l = 0; l < 3; l++) {
        /* Each direction lights in turn, then all three hold together: the
           point of the scene is that nothing distinguishes them. */
        var a = 0.3 + l * 0.17;
        var on = api.reduced ? 1 : M.smooth(M.beat(q, a, a + 0.16));
        S.op(bonds[l], 0.12 + 0.88 * on);
        ln.setPillarLevel(ends[l], p, 0.18 + 0.52 * on);
      }
    };
  });
})(window.A = window.A || {});
