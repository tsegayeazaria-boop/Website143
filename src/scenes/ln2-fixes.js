/* Scenes 9 and 10: the fix the field uses, the fix nobody has tried, and a coda
   on why equalising the bonds is worth the trouble.

   The two measured figures quoted in scene 9 are not captions sitting next to a
   drawing, they are what the drawing is made of: the second wafer's rose is the
   first one's with its anisotropy cut by 66.5% and its coupling raised by 37.0%.

   Scene 10 relaxes this page's "compute, don't draw" rule in one place, and
   says so: the zeroth-level sublattice polarisation is drawn from the known
   result rather than from a diagonalisation, because the near-zero manifold of
   a finite flake is degenerate and picking the polarised basis out of it is a
   research step, not a twelve-second coda. Everything else here is computed --
   the coupling field, and the triangle the sign-change lines cut out. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg, L = A.lattice, ln = A.ln;

  var TX = Math.PI / 2;
  var ETA_DOC = 1 / 3;
  /* From the 152 degree cut paper: 66.5% better in-plane isotropy and 37.0%
     better average electromechanical coupling than 128YX. */
  var ISO_GAIN = 0.665;
  var COUP_GAIN = 0.370;

  /* Face on, never laid on the oblique wafer: the foreshortening of that plane
     turns every rose into the same ellipse, and the whole point of drawing two
     of them is that one is rounder than the other. */
  function rosePath(ox, oy, sc, eta, thetaX, k0) {
    var pts = [], i;
    for (i = 0; i <= 120; i++) {
      var a = i / 120 * Math.PI * 2;
      var r = L.rose(a, { eta: eta, thetaX: thetaX, kappa0: k0 }) * sc;
      pts.push([ox + Math.cos(a) * r, oy - Math.sin(a) * r]);
    }
    return S.polyD(pts) + ' Z';
  }

  /* ------------------------------------------------------- 9. two fixes --- */

  A.scene('ln-fixes', function (root, api) {
    var pal = ln.pal();
    var cam = S.camera(root);
    var svg = cam.mount(S.root(ln.W, ln.H,
      'Two ways out, side by side. On the left the wafer itself is replaced: a ' +
      'cut designed to be more nearly isotropic in plane slides in over the ' +
      'standard one, and its directional rose is much rounder. On the right the ' +
      'standard wafer stays and the pillars are graded instead: the ones on the ' +
      'weakly coupled bond directions are made larger until the three couplings ' +
      'match, and the cone goes from elliptical back to circular.'));

    var lay = { narrow: null };
    function compute() {
      if (lay.narrow) {
        lay.W = 700; lay.H = 1412;
        lay.left = { cx: 350, cy: 250, s: 124 };
        lay.cell = { cx: 350, cy: 760, s: 112 };
        lay.cone = { x: 16, y: 918, w: 668, h: 400 };
        lay.div = null;
      } else {
        lay.W = ln.W; lay.H = ln.H;
        lay.left = { cx: 300, cy: 318, s: 150 };
        lay.cell = { cx: 880, cy: 210, s: 112 };
        lay.cone = { x: 600, y: 320, w: 556, h: 340 };
        lay.div = 590;
      }
      svg.setAttribute('viewBox', '0 0 ' + lay.W + ' ' + lay.H);
      svg.dataset.w = lay.W;
      svg.dataset.h = lay.H;
      cam.measure();
    }
    lay.sync = function () {
      var n = (window.innerWidth || 1280) < 760;
      if (n !== lay.narrow) { lay.narrow = n; compute(); return true; }
      cam.measure();
    };
    lay.sync();
    api.onResize = function () { lay.sync(); };
    api.onTheme = function () { pal = ln.pal(); };

    var divider = ln.line(0, 0, 0, 0, null);
    divider.setAttribute('stroke', S.mixHex(pal.vd, pal.bal, 0.22));
    divider.setAttribute('stroke-width', 1);
    svg.appendChild(divider);

    /* Left: two wafers and their roses. */
    function slab() {
      var el = ln.path('', null);
      el.setAttribute('stroke-width', 1.3);
      svg.appendChild(el);
      return el;
    }
    var slabA = slab(), slabB = slab();
    slabA.setAttribute('fill', S.mixHex(pal.vd, pal.wafer, 0.12));
    slabA.setAttribute('stroke', S.mixHex(pal.vd, pal.wafer, 0.4));
    slabB.setAttribute('fill', S.mixHex(pal.vd, pal.wafer, 0.17));
    slabB.setAttribute('stroke', S.mixHex(pal.vd, pal.wafer, 0.62));

    var roseA = ln.path('', null);
    roseA.setAttribute('fill', 'none');
    roseA.setAttribute('stroke', S.mixHex(pal.vd, pal.over, 0.75));
    roseA.setAttribute('stroke-width', 2);
    svg.appendChild(roseA);
    var roseB = ln.path('', null);
    roseB.setAttribute('fill', 'none');
    roseB.setAttribute('stroke', pal.bal);
    roseB.setAttribute('stroke-width', 2.2);
    svg.appendChild(roseB);

    /* Right: one unit cell whose pillars are graded, and a cone. */
    var bonds = [], ends = [], l;
    for (l = 0; l < 3; l++) {
      var b = ln.line(0, 0, 0, 0, null);
      b.setAttribute('stroke-linecap', 'round');
      svg.appendChild(b);
      bonds.push(b);
    }
    for (l = 0; l < 3; l++) {
      ends.push(ln.pillar(0, 0, 10, pal));
      svg.appendChild(ends[l].g);
    }
    var hub = ln.pillar(0, 0, 10, pal);
    svg.appendChild(hub.g);
    var cone = ln.conePanel(svg, pal);

    var e1 = { x: 1, y: 0 }, e2 = { x: 0.54, y: -0.34 };

    return function (p) {
      var q = api.reduced ? 1 : p;
      cam.lookAt(lay.W / 2, lay.H / 2, 1);

      if (lay.div) {
        divider.setAttribute('x1', lay.div); divider.setAttribute('y1', 70);
        divider.setAttribute('x2', lay.div); divider.setAttribute('y2', lay.H - 120);
        S.op(divider, 0.8);
      } else {
        S.op(divider, 0);
      }

      /* ---- left: buy a different crystal ---- */
      var slide = M.smooth(M.beat(q, 0.12, 0.62));
      var LC = lay.left, LS = LC.s;
      function flA(u, v) {
        return [LC.cx + (u * e1.x + v * e2.x) * LS,
                LC.cy + (u * e1.y + v * e2.y) * LS + slide * 210];
      }
      function flB(u, v) {
        return [LC.cx + (u * e1.x + v * e2.x) * LS,
                LC.cy + (u * e1.y + v * e2.y) * LS + (1 - slide) * -230];
      }
      var R = 1.7;
      S.setD(slabA, S.polyD([flA(-R, -R), flA(R, -R), flA(R, R), flA(-R, R)]) + ' Z');
      S.setD(slabB, S.polyD([flB(-R, -R), flB(R, -R), flB(R, R), flB(-R, R)]) + ' Z');
      S.op(slabA, (1 - slide) * 0.85);
      S.op(slabB, slide);
      /* Both roses share one centre and one scale, so the only difference the
         reader sees is their shape. The standard cut's rose stays behind as a
         dim reference instead of leaving with its wafer, which is what makes
         the comparison survive as a single static frame. */
      var rsc = LS * 0.56, rx = LC.cx, ry = LC.cy - 104;
      S.setD(roseA, rosePath(rx, ry, rsc, ETA_DOC, TX, 1));
      roseA.setAttribute('stroke-dasharray', slide > 0.5 ? '4 5' : 'none');
      S.op(roseA, 0.9 - slide * 0.58);
      /* The replacement cut, built from the two measured gains: its anisotropy
         is the first one's cut by 66.5% and its coupling raised by 37.0%. */
      S.setD(roseB, rosePath(rx, ry - (1 - slide) * 240, rsc,
                             ETA_DOC * (1 - ISO_GAIN), TX, 1 + COUP_GAIN));
      S.op(roseB, slide * 0.95);

      /* ---- right: keep the wafer, grade the pillars ---- */
      var fix = M.smooth(M.beat(q, 0.3, 0.86));
      var kapRaw = L.kappas({ eta: ETA_DOC, thetaX: TX });
      /* Grading targets the strongest bond, so no coupling has to be reduced. */
      var target = Math.max(kapRaw[0], kapRaw[1], kapRaw[2]);
      var CC = lay.cell, CS = CC.s;
      var X = function (u) { return CC.cx + u * CS; };
      var Y = function (v) { return CC.cy - v * CS; };
      var kapNow = [0, 0, 0];
      for (var l2 = 0; l2 < 3; l2++) {
        kapNow[l2] = M.lerp(kapRaw[l2], target, fix);
        /* compensate() returns a LENGTH offset in units of the lattice constant,
           so it says how much closer a pillar on this direction has to sit. */
        var dL = L.compensate(kapNow[l2], l2, { eta: ETA_DOC, thetaX: TX });
        var span = 1 + dL;
        /* The radius change is a second, separate knob, and the gain here is
           illustrative: the real pillar-geometry-to-coupling law has to be
           measured before a radius can be quoted. The ratio it is driven by is
           exact -- it is how much more coupling this direction needs. */
        var ratio = kapNow[l2] / L.kappaAnisotropic(l2, { eta: ETA_DOC, thetaX: TX });
        var rr = L.RHO[l2];
        bonds[l2].setAttribute('x1', X(0)); bonds[l2].setAttribute('y1', Y(0));
        bonds[l2].setAttribute('x2', X(rr.x * span).toFixed(2));
        bonds[l2].setAttribute('y2', Y(rr.y * span).toFixed(2));
        bonds[l2].setAttribute('stroke-width', (4.4 * kapNow[l2]).toFixed(2));
        bonds[l2].setAttribute('stroke', ln.divg(pal, 0.5 + (kapNow[l2] - target) / (2 * ETA_DOC) * 0.9));
        var rad = CS * 0.12 * (1 + 0.85 * (ratio - 1));
        var cxp = X(rr.x * span), cyp = Y(rr.y * span);
        ends[l2].base.setAttribute('cx', cxp.toFixed(2));
        ends[l2].base.setAttribute('cy', cyp.toFixed(2));
        ends[l2].base.setAttribute('r', rad.toFixed(2));
        ends[l2].hi.setAttribute('cx', (cxp - rad * 0.3).toFixed(2));
        ends[l2].hi.setAttribute('cy', (cyp - rad * 0.32).toFixed(2));
        ends[l2].hi.setAttribute('r', (rad * 0.46).toFixed(2));
        ln.setPillarLevel(ends[l2], pal, 0.3 + 0.4 * kapNow[l2]);
      }
      hub.base.setAttribute('cx', X(0)); hub.base.setAttribute('cy', Y(0));
      hub.base.setAttribute('r', (CS * 0.13).toFixed(2));
      hub.hi.setAttribute('cx', (X(0) - CS * 0.039).toFixed(2));
      hub.hi.setAttribute('cy', (Y(0) - CS * 0.042).toFixed(2));
      hub.hi.setAttribute('r', (CS * 0.06).toFixed(2));
      ln.setPillarLevel(hub, pal, 0.55);

      cone.place(lay.cone);
      cone.update(kapNow, M.clamp(M.inv(q, 0.2, 0.45), 0, 1));
    };
  });

  /* ------------------------------------------------------------ 10. coda --- */

  A.scene('ln-coda', function (root, api) {
    var pal = ln.pal();
    var cam = S.camera(root);
    var svg = cam.mount(S.root(ln.WS, ln.H,
      'With the three bonds equalised, the imbalance can be put back on purpose ' +
      'and made to vary across the lattice instead of being the same everywhere. ' +
      'Now it has a curl, so there is a real pseudomagnetic field. The lines ' +
      'where the couplings change sign cut out a triangle with zigzag edges, ' +
      'which is the geometry that fully realises the sublattice polarisation of ' +
      'the zeroth Landau level; the levels ladder up as the square root of the ' +
      'level index. Amplitude collects on one sublattice and the other goes ' +
      'dark, then the page ends on black.'));
    api.onResize = cam.measure;
    api.onTheme = function () { pal = ln.pal(); };

    var N = 9, SC = 25, CMAX = 0.178;
    var flake = L.buildFlake(N);
    var cx = ln.WS * 0.40, cy = ln.H * 0.455;
    var X = function (u) { return cx + u * SC; };
    var Y = function (v) { return cy - v * SC; };

    var bondLayer = S.g();
    svg.appendChild(bondLayer);
    var bondEls = flake.bonds.map(function (b) {
      var a = flake.sites[b.a], c = flake.sites[b.b];
      var el = ln.line(X(a.x), Y(a.y), X(c.x), Y(c.y), null);
      el.setAttribute('stroke-linecap', 'round');
      bondLayer.appendChild(el);
      var m = L.bondMidpoint(flake, b);
      return { el: el, l: b.l, mx: m.x, my: m.y };
    });

    /* Zigzag triangle, from the three lines where the couplings change sign. */
    var tri = ln.path('', null);
    tri.setAttribute('fill', 'none');
    tri.setAttribute('stroke', pal.amp);
    tri.setAttribute('stroke-width', 2.2);
    svg.appendChild(tri);

    /* Two sublattice groups, so the polarisation is two attribute writes. */
    var subA = S.g(), subB = S.g();
    svg.appendChild(subA);
    svg.appendChild(subB);
    flake.sites.forEach(function (s) {
      var d = ln.circle(X(s.x), Y(s.y), SC * 0.19, null);
      (s.sub === 'A' ? subA : subB).appendChild(d);
    });

    /* The Landau ladder: energies go as the signed square root of the index. */
    var rungs = [], i;
    var levels = L.landauLevels(4, 1);
    for (i = 0; i < levels.length; i++) {
      var r = ln.line(0, 0, 0, 0, null);
      r.setAttribute('stroke-linecap', 'round');
      svg.appendChild(r);
      rungs.push({ el: r, n: levels[i].n, E: levels[i].E });
    }

    return function (p) {
      var q = api.reduced ? 1 : p;
      var grow = M.easeInOut(M.beat(q, 0.05, 0.52));
      var C = CMAX * grow;
      cam.lookAt(cx, cy, M.lerp(1.16, 1.0, grow));

      /* The coupling now varies in space, so the imbalance has a curl. */
      for (var j = 0; j < bondEls.length; j++) {
        var be = bondEls[j];
        var k = C > 1e-6 ? L.kappaTriaxial(be.mx, be.my, be.l, C) : 1;
        be.el.setAttribute('stroke', ln.divg(pal, 0.5 + (k - 1) * 0.62));
        be.el.setAttribute('stroke-width', (0.9 + 1.5 * Math.min(Math.abs(k), 2)).toFixed(2));
      }
      S.op(bondLayer, 0.95);

      if (C > 0.02) {
        var v = L.signTriangle(C);
        S.setD(tri, S.polyD(v.map(function (pt) { return [X(pt.x), Y(pt.y)]; })) + ' Z');
        S.op(tri, M.clamp(M.inv(q, 0.3, 0.5), 0, 1) * 0.95);
      } else {
        S.op(tri, 0);
      }

      /* Sublattice polarisation: amplitude collects on A and B goes to black. */
      var pol = M.smooth(M.beat(q, 0.56, 0.84));
      subA.setAttribute('fill', ln.hot(pal, M.lerp(0.42, 1, pol)));
      subB.setAttribute('fill', ln.hot(pal, M.lerp(0.42, 0, pol)));
      S.op(subA, 1);
      S.op(subB, 1);

      /* Levels ladder up beside it. */
      var lx = ln.WS * 0.87, ly = cy, lh = ln.H * 0.3;
      for (var r2 = 0; r2 < rungs.length; r2++) {
        var ru = rungs[r2];
        var yy = ly - ru.E / 2 * lh;
        var half = ru.n === 0 ? 52 : 34;
        ru.el.setAttribute('x1', (lx - half).toFixed(1));
        ru.el.setAttribute('x2', (lx + half).toFixed(1));
        ru.el.setAttribute('y1', yy.toFixed(1));
        ru.el.setAttribute('y2', yy.toFixed(1));
        ru.el.setAttribute('stroke', ru.n === 0 ? pal.amp : S.mixHex(pal.vd, pal.bal, 0.75));
        ru.el.setAttribute('stroke-width', ru.n === 0 ? 3 : 1.8);
        var app = M.clamp(M.inv(q, 0.42 + Math.abs(ru.n) * 0.045, 0.52 + Math.abs(ru.n) * 0.045), 0, 1);
        S.op(ru.el, app * (ru.n === 0 ? 1 : 0.7));
      }

      /* End on black. */
      var out = api.reduced ? 0 : M.smooth(M.beat(q, 0.9, 1));
      S.op(svg, 1 - out);
    };
  });
})(window.A = window.A || {});
