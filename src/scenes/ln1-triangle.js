/* Scenes 4-8: the triangle closes, the substrate underneath, the bonds
   disagree, the triangle fails, and the whole field fails the same way.

   Scene 7 is the payload. The stick that cannot reach and the gap in the cone
   are driven by one number, A.lattice.diracMargin(kappa), computed once per
   frame and handed to both panels, so they cannot disagree. The gap width is
   2*max(0, -margin) exactly, and build.mjs checks that against a brute-force
   minimum of |h| over the zone. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg, L = A.lattice, ln = A.ln;

  /* The sweep runs along the fragile alignment: the crystal axis parallel to one
     bond, so that bond is the strong one and the other two are weak. That case
     reaches the merging threshold at half the anisotropy of the opposite
     alignment, and it is the classic merging geometry -- the two Dirac points
     travel along a zone edge and annihilate at its midpoint. */
  var TX = Math.PI / 2;
  var ETA_C = 0.5;          /* where diracMargin crosses zero, on this form */
  var ETA_MAX = 0.78;
  var ETA_DOC = 1 / 3;      /* the documented 2:1 ratio taken at face value */

  /* The point the two Dirac points merge at, found from the exact minimum of
     |h| at threshold rather than asserted. */
  var MERGE = (function () {
    var mp = L.minPoint(L.kappas({ eta: ETA_C, thetaX: TX }));
    return L.reduceK(mp.kx, mp.ky);
  })();

  ln.kappaSweep = function (eta) { return L.kappas({ eta: eta, thetaX: TX }); };

  /* --------------------------------------------------------- cone panel --- */
  /* E(k) = +/- |h(k)| drawn as an oblique surface: constant-energy contours,
     each traced by bisecting |h| along rays, floated at their own height. One
     object carries the whole argument. Equal couplings give circular rings and
     a circular cone; unequal ones give ellipses; past the threshold the low
     rings stop existing, which is the gap. */
  ln.conePanel = function (parent, pal) {
    /* Ring energies are fractions of the highest one that still closes into a
       loop around this Dirac point, found per frame. A fixed ladder does not
       work: near the merge the loops shrink to nothing, and near the van Hove
       saddle they stop being loops at all, so fixed energies either draw
       nothing or draw a curve that belongs to both cones at once. Measured up
       from the band edge rather than from zero, so the stack survives once a
       gap opens and what changes is the void beneath it. */
    var FRAC = [0.22, 0.52, 0.86];
    var NRAY = 60;
    var RMAX = 0.72;
    var g = S.g();
    parent.appendChild(g);

    /* The zone edge the two Dirac points travel along, and the midpoint they
       annihilate at. The whole Brillouin zone was drawn here at first; it forced
       the scale so wide that the cones became unreadable specks, so the view is
       framed on the pair instead and only their edge is kept for context. */
    var edge = ln.path('');
    edge.setAttribute('fill', 'none');
    edge.setAttribute('stroke', S.mixHex(pal.vd, pal.bal, 0.3));
    edge.setAttribute('stroke-width', 1.2);
    g.appendChild(edge);

    var rings = [], i, j, sgn;
    for (i = 0; i < FRAC.length; i++) {
      for (sgn = 0; sgn < 2; sgn++) {
        for (j = 0; j < 2; j++) {
          var r = ln.path('');
          r.setAttribute('fill', 'none');
          r.setAttribute('stroke-width', 1.8);
          r.setAttribute('stroke-linejoin', 'round');
          g.appendChild(r);
          rings.push({ el: r, li: i, sgn: sgn ? -1 : 1, pt: j });
        }
      }
    }
    var apex = [];
    for (j = 0; j < 2; j++) {
      var a = ln.circle(0, 0, 4.4, null);
      a.setAttribute('fill', pal.amp);
      g.appendChild(a);
      apex.push(a);
    }
    /* Marks the gap once one exists: its height is 2*max(0, -margin). */
    var gapBar = ln.path('', null);
    gapBar.setAttribute('stroke', pal.over);
    gapBar.setAttribute('stroke-width', 3);
    gapBar.setAttribute('stroke-linecap', 'round');
    gapBar.setAttribute('fill', 'none');
    g.appendChild(gapBar);

    var KS = 1, ES = 1, X0 = 0, Y0 = 0;
    var E1 = { x: 1, y: 0 }, E2 = { x: 0.44, y: -0.70 };

    function place(rect) {
      /* Framed on the pair of Dirac points at their widest separation, plus the
         radius of the largest ring. */
      var span = L.KR / 2 + 0.46;
      KS = rect.w * 0.44 / span;
      /* The energy axis is exaggerated by a constant factor. The rings have to
         stay near the Dirac point to be circular rather than trigonally warped,
         which makes them small, and at equal scales the cone would then be too
         shallow to read as one. The factor is the same in every scene, so what
         the reader compares between them -- round against elliptical, touching
         against gapped -- is unaffected. */
      ES = KS * 1.8;
      X0 = rect.x + rect.w / 2;
      Y0 = rect.y + rect.h * 0.5;
    }
    /* Oblique projection, with k measured from the point the two cones merge
       at, so the view stays centred while they travel. */
    function proj(kx, ky, E) {
      var dx = kx - MERGE.kx, dy = ky - MERGE.ky;
      return [
        X0 + (dx * E1.x + dy * E2.x) * KS,
        Y0 + (dx * E1.y + dy * E2.y) * KS - E * ES
      ];
    }

    return {
      g: g,
      place: place,
      /* kappa drives everything; reveal draws the surface in from the floor up.
         margin may be passed in so that a scene animating both this panel and
         the sticks beside it can hand the same number to both, rather than each
         recomputing it and being trusted to agree. */
      update: function (kappa, reveal, marginIn) {
        var margin = marginIn === undefined ? L.diracMargin(kappa) : marginIn;
        var gap = 2 * Math.max(0, -margin);
        var half = gap / 2;

        /* The zone edge through the merge point, drawn perpendicular to it. */
        var mr = Math.sqrt(MERGE.kx * MERGE.kx + MERGE.ky * MERGE.ky) || 1;
        var ex = -MERGE.ky / mr, ey = MERGE.kx / mr, eh = L.KR / 2;
        var e0 = proj(MERGE.kx - ex * eh, MERGE.ky - ey * eh, 0);
        var e1p = proj(MERGE.kx + ex * eh, MERGE.ky + ey * eh, 0);
        S.setD(edge, 'M' + e0[0].toFixed(1) + ' ' + e0[1].toFixed(1) +
                     'L' + e1p[0].toFixed(1) + ' ' + e1p[1].toFixed(1));
        S.op(edge, 0.5 * M.clamp(reveal * 3, 0, 1));

        var pair = L.diracPair(kappa, MERGE);
        var gapless = pair.length === 2;
        var centres = gapless ? pair : [L.reduceNear(L.minPoint(kappa).kx, L.minPoint(kappa).ky, MERGE.kx, MERGE.ky)];

        var k;
        for (k = 0; k < 2; k++) {
          if (gapless) {
            var pa = proj(centres[k].kx, centres[k].ky, 0);
            apex[k].setAttribute('cx', pa[0].toFixed(2));
            apex[k].setAttribute('cy', pa[1].toFixed(2));
            S.op(apex[k], M.clamp(reveal * 3 - 0.4, 0, 1));
          } else {
            S.op(apex[k], 0);
          }
        }

        /* One contour per level per cone. |h(-k)| = |h(k)| for real couplings,
           so the second cone is the first reflected through the merge point;
           tracing one and reflecting it is exact, not an approximation. */
        /* A ring belongs to this cone only for as long as it closes without
           reaching the other one. As the two Dirac points approach, a curve of
           constant energy around one of them stops being a loop around one cone
           and starts wrapping towards its partner, so both the reach and the
           energy spacing are tied to their separation: the cone shrinks into the
           merge, which is what actually happens, instead of the contour drawing
           a scribble across both points. */
        var sep = gapless
          ? Math.sqrt((pair[0].kx - pair[1].kx) * (pair[0].kx - pair[1].kx) +
                      (pair[0].ky - pair[1].ky) * (pair[0].ky - pair[1].ky))
          : Infinity;
        /* Stop a ray before it can reach the other cone, so a ring stays this
           cone's own. As the two points converge the window closes with them
           and the cone visibly collapses into the merge. */
        var reach = Math.max(0.10, Math.min(RMAX, 0.46 * sep));

        /* Largest energy above the band edge whose contour still closes, then
           held below the van Hove scale. Closing is not enough on its own: a
           curve near the saddle is still a loop but a trigonally warped one,
           and drawn as a cone ring it reads as a blob rather than as a cone. */
        var lo = 0, hi = 0.9, it;
        for (it = 0; it < 13; it++) {
          var mid = (lo + hi) / 2;
          if (L.contour(kappa, centres[0], half + mid, 24, reach)) lo = mid; else hi = mid;
        }
        var kmin = Math.min(Math.abs(kappa[0]), Math.abs(kappa[1]), Math.abs(kappa[2]));
        var top = Math.max(0.02, Math.min(lo, 0.34 * kmin));

        var traced = {}, levelOf = {};
        for (var li = 0; li < FRAC.length; li++) {
          var lev = half + top * FRAC[li];
          levelOf[li] = lev;
          traced[li] = L.contour(kappa, centres[0], lev, NRAY, reach);
        }

        rings.forEach(function (r) {
          var c = traced[r.li];
          if (!c) { S.op(r.el, 0); return; }
          var pts = c.map(function (q) {
            var kx = r.pt === 0 ? q.kx : 2 * MERGE.kx - q.kx;
            var ky = r.pt === 0 ? q.ky : 2 * MERGE.ky - q.ky;
            return proj(kx, ky, levelOf[r.li] * r.sgn);
          });
          S.setD(r.el, S.polyD(pts) + ' Z');
          /* Warm once the surface has been pushed up off zero by a gap, neutral
             while it still touches it. */
          var tone = gapless ? S.mixHex(pal.bal, pal.amp, 0.85 - r.li * 0.18)
                             : S.mixHex(pal.bal, pal.over, 0.7);
          r.el.setAttribute('stroke', tone);
          var band = M.clamp(reveal * 4 - r.li * 0.7, 0, 1);
          S.op(r.el, (0.5 + 0.4 * (1 - r.li / FRAC.length)) * band);
          if (!gapless && r.pt === 1) S.op(r.el, 0);
        });

        if (gap > 1e-6) {
          var t0 = proj(centres[0].kx, centres[0].ky, half);
          var b0 = proj(centres[0].kx, centres[0].ky, -half);
          S.setD(gapBar, 'M' + t0[0].toFixed(1) + ' ' + t0[1].toFixed(1) +
                         'L' + b0[0].toFixed(1) + ' ' + b0[1].toFixed(1));
          S.op(gapBar, 1);
        } else {
          S.op(gapBar, 0);
        }
        return { margin: margin, gap: gap };
      }
    };
  };

  /* ------------------------------------------------------ stick linkage --- */
  /* Three sticks whose lengths are the three couplings. Closed head to tail they
     are a triangle, which exists exactly when no stick is longer than the other
     two together. The closure directions are the Bloch phases at a Dirac point,
     so the two ways of closing the triangle are K and K prime. */
  ln.sticks = function (parent, pal) {
    var g = S.g();
    parent.appendChild(g);
    var bars = [], dots = [], i;
    for (i = 0; i < 3; i++) {
      var b = ln.line(0, 0, 0, 0, null);
      b.setAttribute('stroke-linecap', 'round');
      g.appendChild(b);
      bars.push(b);
    }
    for (i = 0; i < 4; i++) {
      var d = ln.circle(0, 0, 5, null);
      d.setAttribute('fill', pal.bal);
      g.appendChild(d);
      dots.push(d);
    }
    /* The arc the free end sweeps, and the shortfall when it cannot reach. */
    var arc = ln.path('', null);
    arc.setAttribute('fill', 'none');
    arc.setAttribute('stroke', S.mixHex(pal.vd, pal.bal, 0.34));
    arc.setAttribute('stroke-width', 1.1);
    arc.setAttribute('stroke-dasharray', '3 5');
    g.insertBefore(arc, bars[0]);
    var guide = ln.path('');
    guide.setAttribute('fill', 'none');
    guide.setAttribute('stroke', S.mixHex(pal.vd, pal.bal, 0.4));
    guide.setAttribute('stroke-width', 1);
    g.appendChild(guide);
    var miss = ln.line(0, 0, 0, 0, null);
    miss.setAttribute('stroke', pal.over);
    miss.setAttribute('stroke-width', 3);
    miss.setAttribute('stroke-linecap', 'round');
    g.appendChild(miss);

    return {
      g: g,
      arc: arc,
      miss: miss,
      guide: guide,
      bars: bars,
      dots: dots,
      /* Head-to-tail chain from `from`, with the given lengths and angles. */
      chain: function (from, lens, angs, scale, widths, tones) {
        var x = from.x, y = from.y, i2;
        for (i2 = 0; i2 < 3; i2++) {
          var nx = x + Math.cos(angs[i2]) * lens[i2] * scale;
          var ny = y - Math.sin(angs[i2]) * lens[i2] * scale;
          bars[i2].setAttribute('x1', x.toFixed(2));
          bars[i2].setAttribute('y1', y.toFixed(2));
          bars[i2].setAttribute('x2', nx.toFixed(2));
          bars[i2].setAttribute('y2', ny.toFixed(2));
          bars[i2].setAttribute('stroke-width', widths[i2].toFixed(2));
          bars[i2].setAttribute('stroke', tones[i2]);
          dots[i2].setAttribute('cx', x.toFixed(2));
          dots[i2].setAttribute('cy', y.toFixed(2));
          x = nx; y = ny;
        }
        dots[3].setAttribute('cx', x.toFixed(2));
        dots[3].setAttribute('cy', y.toFixed(2));
        return { x: x, y: y };
      }
    };
  };

  /* Two panels side by side, or stacked when there is not room beside. */
  ln.dual = function (svg, cam) {
    var st = { narrow: null };
    function compute() {
      if (st.narrow) {
        st.W = 780; st.H = 1300;
        st.left = { cx: 390, cy: 330, s: 150 };
        st.right = { x: 40, y: 660, w: 700, h: 600 };
      } else {
        st.W = ln.W; st.H = ln.H;
        st.left = { cx: 288, cy: 352, s: 132 };
        st.right = { x: 552, y: 58, w: 596, h: 584 };
      }
      svg.setAttribute('viewBox', '0 0 ' + st.W + ' ' + st.H);
      svg.dataset.w = st.W;
      svg.dataset.h = st.H;
      cam.measure();
    }
    st.sync = function () {
      var n = (window.innerWidth || 1280) < 760;
      if (n !== st.narrow) { st.narrow = n; compute(); return true; }
      cam.measure();
      return false;
    };
    st.sync();
    return st;
  };

  /* Unwrap an angle to the revolution nearest a reference. */
  function near(a, ref) {
    while (a - ref > Math.PI) a -= 2 * Math.PI;
    while (ref - a > Math.PI) a += 2 * Math.PI;
    return a;
  }

  /* The directions the three sticks point when the triangle is closed: the
     Bloch phases at a Dirac point. Picked as the solution that needs the least
     rotation from the bond directions, which for equal couplings turns out to be
     a rigid quarter turn of all three at once. */
  function closureAngles(kappa) {
    var dp = L.diracPoints(kappa);
    if (!dp.length) return null;
    var best = null, bestCost = Infinity;
    dp.forEach(function (d) {
      var angs = [], cost = 0, l;
      for (l = 0; l < 3; l++) {
        var phi = d.kx * L.RHO[l].x + d.ky * L.RHO[l].y;
        var a = near(phi, L.RHO[l].theta - Math.PI / 2);
        angs.push(a);
        cost += Math.abs(a - L.RHO[l].theta);
      }
      if (cost < bestCost) { bestCost = cost; best = angs; }
    });
    return best;
  }

  /* -------------------------------------------------- 4. triangle closes --- */

  A.scene('ln-close', function (root, api) {
    var pal = ln.pal();
    var cam = S.camera(root);
    var svg = cam.mount(S.root(ln.W, ln.H,
      'The three bonds detach and become three sticks of equal length. They ' +
      'rotate and close into a triangle. Beside them a Dirac cone draws itself ' +
      'out of the band structure: its constant-energy rings are circular and the ' +
      'two cone tips touch zero.'));
    var lay = ln.dual(svg, cam);
    api.onResize = function () { lay.sync(); };
    api.onTheme = function () { pal = ln.pal(); };

    var sticks = ln.sticks(svg, pal);
    var cone = ln.conePanel(svg, pal);
    var KAP = [1, 1, 1];
    var CLOSE = closureAngles(KAP);

    return function (p) {
      var q = api.reduced ? 1 : p;
      cone.place(lay.right);
      cam.lookAt(lay.W / 2, lay.H / 2, 1);

      /* Detach, rotate, close. Each stick's tail slides from the shared site to
         its place in the chain while its angle turns to the closure angle, so at
         t = 1 the three are laid head to tail and the figure shuts exactly
         rather than nearly: the closure angles are the Bloch phases at a Dirac
         point, and those phasors sum to zero by construction. */
      var t = M.easeInOut(M.beat(q, 0.06, 0.62));
      var angs = [], l;
      for (l = 0; l < 3; l++) angs.push(M.lerp(L.RHO[l].theta, CLOSE[l], t));

      var sc = lay.left.s;
      var O = { x: lay.left.cx, y: lay.left.cy };
      var cum = { x: 0, y: 0 }, tails = [], i;
      for (i = 0; i < 3; i++) {
        tails.push({ x: cum.x, y: cum.y });
        cum.x += Math.cos(angs[i]);
        cum.y -= Math.sin(angs[i]);
      }
      var mx = (tails[0].x + tails[1].x + tails[2].x) / 3;
      var my = (tails[0].y + tails[1].y + tails[2].y) / 3;
      for (i = 0; i < 3; i++) {
        var ax = O.x + (tails[i].x - mx) * sc * t;
        var ay = O.y + (tails[i].y - my) * sc * t;
        var bx = ax + Math.cos(angs[i]) * sc;
        var by = ay - Math.sin(angs[i]) * sc;
        sticks.bars[i].setAttribute('x1', ax.toFixed(2));
        sticks.bars[i].setAttribute('y1', ay.toFixed(2));
        sticks.bars[i].setAttribute('x2', bx.toFixed(2));
        sticks.bars[i].setAttribute('y2', by.toFixed(2));
        sticks.bars[i].setAttribute('stroke-width', 11);
        sticks.bars[i].setAttribute('stroke', pal.bal);
        sticks.dots[i].setAttribute('cx', ax.toFixed(2));
        sticks.dots[i].setAttribute('cy', ay.toFixed(2));
        sticks.dots[i].setAttribute('r', 7);
      }
      sticks.dots[3].setAttribute('cx', (O.x + (cum.x - mx) * sc * t).toFixed(2));
      sticks.dots[3].setAttribute('cy', (O.y + (cum.y - my) * sc * t).toFixed(2));
      sticks.dots[3].setAttribute('r', 7);
      S.op(sticks.arc, 0);
      S.op(sticks.miss, 0);
      S.op(sticks.guide, 0);
      sticks.dots.forEach(function (d) { S.op(d, 0.45 + 0.55 * t); });

      /* The cone draws itself once the triangle has shut. */
      cone.update(KAP, M.beat(q, 0.5, 0.96));
    };
  });

  /* ------------------------------------------------------ 5. substrate --- */

  A.scene('ln-substrate', function (root, api) {
    var pal = ln.pal();
    var cam = S.camera(root);
    var svg = cam.mount(S.root(ln.WS, ln.H,
      'The camera drops below the lattice and a wafer of lithium niobate ' +
      'appears underneath it, with its crystal axes drawn on the surface. The ' +
      'wafer turns once. A directional rose over it is long along the crystal X ' +
      'axis and short along Y: the substrate does not treat every in-plane ' +
      'direction alike, and the three bonds above it inherit that.'));
    api.onResize = cam.measure;
    api.onTheme = function () { pal = ln.pal(); };

    var cx = ln.WS / 2, cy = ln.H * 0.56, SC = 122;
    /* Axonometric floor: the wafer is a plane seen obliquely. */
    var e1 = { x: 1, y: 0 }, e2 = { x: 0.54, y: -0.34 };
    function fl(u, v, lift) {
      return [cx + (u * e1.x + v * e2.x) * SC,
              cy + (u * e1.y + v * e2.y) * SC - (lift || 0)];
    }

    var slab = ln.path('', null);
    slab.setAttribute('fill', S.mixHex(pal.vd, pal.wafer, 0.13));
    slab.setAttribute('stroke', S.mixHex(pal.vd, pal.wafer, 0.42));
    slab.setAttribute('stroke-width', 1.3);
    svg.appendChild(slab);
    var edge = ln.path('', null);
    edge.setAttribute('fill', S.mixHex(pal.vd, pal.wafer, 0.07));
    edge.setAttribute('stroke', 'none');
    svg.appendChild(edge);

    var axX = ln.line(0, 0, 0, 0, null);
    axX.setAttribute('stroke', S.mixHex(pal.vd, pal.wafer, 0.8));
    axX.setAttribute('stroke-width', 2);
    var axY = ln.line(0, 0, 0, 0, null);
    axY.setAttribute('stroke', S.mixHex(pal.vd, pal.wafer, 0.5));
    axY.setAttribute('stroke-width', 2);
    axY.setAttribute('stroke-dasharray', '5 4');
    svg.appendChild(axX);
    svg.appendChild(axY);

    var rose = ln.path('', null);
    rose.setAttribute('fill', 'none');
    rose.setAttribute('stroke', pal.over);
    rose.setAttribute('stroke-width', 2.2);
    svg.appendChild(rose);

    /* The three bond stubs, floating above the wafer, coloured by the rose at
       their own angle. Turning the crystal changes which bond is the odd one
       out, which is the whole reason orientation matters. */
    var stubs = [], l;
    for (l = 0; l < 3; l++) {
      var st = ln.line(0, 0, 0, 0, null);
      st.setAttribute('stroke-width', 5);
      st.setAttribute('stroke-linecap', 'round');
      svg.appendChild(st);
      stubs.push(st);
    }
    var LIFT = 196;

    return function (p) {
      var q = api.reduced ? 1 : p;
      cam.lookAt(ln.WS / 2, ln.H / 2, 1);

      var rise = M.smooth(M.beat(q, 0.02, 0.4));
      var R = 2.05;
      var quad = [fl(-R, -R), fl(R, -R), fl(R, R), fl(-R, R)];
      S.setD(slab, S.polyD(quad) + ' Z');
      S.op(slab, rise);
      /* Thickness on the near edge, the one between the two lower corners. */
      var th = 18;
      S.setD(edge, S.polyD([quad[0], quad[1], [quad[1][0], quad[1][1] + th],
                            [quad[0][0], quad[0][1] + th]]) + ' Z');
      S.op(edge, rise);

      /* One full turn of the crystal against the lattice. */
      var thetaX = TX + M.easeInOut(M.beat(q, 0.4, 0.95)) * Math.PI * 2;
      var ax = { x: Math.cos(thetaX), y: Math.sin(thetaX) };
      var ay = { x: -Math.sin(thetaX), y: Math.cos(thetaX) };
      var p1 = fl(-ax.x * 1.75, -ax.y * 1.75), p2 = fl(ax.x * 1.75, ax.y * 1.75);
      axX.setAttribute('x1', p1[0].toFixed(1)); axX.setAttribute('y1', p1[1].toFixed(1));
      axX.setAttribute('x2', p2[0].toFixed(1)); axX.setAttribute('y2', p2[1].toFixed(1));
      var p3 = fl(-ay.x * 1.5, -ay.y * 1.5), p4 = fl(ay.x * 1.5, ay.y * 1.5);
      axY.setAttribute('x1', p3[0].toFixed(1)); axY.setAttribute('y1', p3[1].toFixed(1));
      axY.setAttribute('x2', p4[0].toFixed(1)); axY.setAttribute('y2', p4[1].toFixed(1));
      S.op(axX, rise); S.op(axY, rise * 0.8);

      /* The rose is the coupling law itself, plotted in polar. Its long axis is
         exactly twice its short axis at this anisotropy, which is the documented
         ratio between surface displacement along X and along Y -- so it is drawn
         face on, not lying on the oblique wafer, because the foreshortening
         would turn any rose into the same ellipse and hide the one thing it is
         there to show. */
      var pts = [], i;
      for (i = 0; i <= 120; i++) {
        var a = i / 120 * Math.PI * 2;
        var r = L.rose(a, { eta: ETA_DOC, thetaX: thetaX }) * 0.74;
        pts.push([cx + Math.cos(a) * r * SC, cy - LIFT * rise - Math.sin(a) * r * SC]);
      }
      S.setD(rose, S.polyD(pts) + ' Z');
      S.op(rose, M.smooth(M.beat(q, 0.22, 0.55)) * 0.9);

      var kap = L.kappas({ eta: ETA_DOC, thetaX: thetaX });
      for (var l2 = 0; l2 < 3; l2++) {
        var rr = L.RHO[l2];
        var o = fl(0, 0, LIFT * rise);
        var e = fl(rr.x * 0.95, rr.y * 0.95, LIFT * rise);
        stubs[l2].setAttribute('x1', o[0].toFixed(1)); stubs[l2].setAttribute('y1', o[1].toFixed(1));
        stubs[l2].setAttribute('x2', e[0].toFixed(1)); stubs[l2].setAttribute('y2', e[1].toFixed(1));
        stubs[l2].setAttribute('stroke', ln.divg(pal, 0.5 + (kap[l2] - 1) / (2 * ETA_DOC) * 0.85));
        stubs[l2].setAttribute('stroke-width', (3 + 3.4 * kap[l2]).toFixed(2));
        S.op(stubs[l2], 0.35 + 0.65 * rise);
      }
    };
  });

  /* ------------------------------------------------ 6. the bonds disagree --- */

  A.scene('ln-disagree', function (root, api) {
    var pal = ln.pal();
    var cam = S.camera(root);
    var svg = cam.mount(S.root(ln.WS, ln.H,
      'Back at one unit cell. The three bonds re-render with different ' +
      'thicknesses and different colours: one over-coupled and warm, two ' +
      'under-coupled and cool. The imbalance is read off the same directional ' +
      'rose that the substrate produced.'));
    api.onResize = cam.measure;
    api.onTheme = function () { pal = ln.pal(); };

    var cx = ln.WS / 2, cy = ln.H / 2, SC = 158;
    var X = function (u) { return cx + u * SC; };
    var Y = function (v) { return cy - v * SC; };

    var rose = ln.path('', null);
    rose.setAttribute('fill', 'none');
    rose.setAttribute('stroke', S.mixHex(pal.vd, pal.over, 0.5));
    rose.setAttribute('stroke-width', 1.4);
    rose.setAttribute('stroke-dasharray', '4 5');
    svg.appendChild(rose);

    var bonds = [], ends = [], l;
    for (l = 0; l < 3; l++) {
      var b = ln.line(0, 0, 0, 0, null);
      b.setAttribute('stroke-linecap', 'round');
      svg.appendChild(b);
      bonds.push(b);
    }
    for (l = 0; l < 3; l++) {
      ends.push(ln.pillar(X(L.RHO[l].x), Y(L.RHO[l].y), SC * 0.15, pal));
      svg.appendChild(ends[l].g);
    }
    var hub = ln.pillar(X(0), Y(0), SC * 0.15, pal);
    svg.appendChild(hub.g);

    return function (p) {
      var q = api.reduced ? 1 : p;
      cam.lookAt(cx, cy, 1);
      var eta = M.lerp(0, ETA_DOC, M.easeInOut(M.beat(q, 0.08, 0.8)));
      var kap = L.kappas({ eta: eta, thetaX: TX });

      var pts = [], i;
      for (i = 0; i <= 96; i++) {
        var a = i / 96 * Math.PI * 2;
        var r = L.rose(a, { eta: eta, thetaX: TX });
        pts.push([X(Math.cos(a) * r), Y(Math.sin(a) * r)]);
      }
      S.setD(rose, S.polyD(pts) + ' Z');
      S.op(rose, 0.5 * M.smooth(M.beat(q, 0.15, 0.5)));

      ln.setPillarLevel(hub, pal, 0.55);
      for (var l2 = 0; l2 < 3; l2++) {
        var rr = L.RHO[l2];
        bonds[l2].setAttribute('x1', X(0)); bonds[l2].setAttribute('y1', Y(0));
        bonds[l2].setAttribute('x2', X(rr.x).toFixed(2));
        bonds[l2].setAttribute('y2', Y(rr.y).toFixed(2));
        /* Width is the coupling; colour is its signed departure from balance, so
           equal couplings render as one neutral grey and nothing else. */
        bonds[l2].setAttribute('stroke-width', (5 * kap[l2]).toFixed(2));
        bonds[l2].setAttribute('stroke', ln.divg(pal, 0.5 + (kap[l2] - 1) / (2 * ETA_DOC) * 0.9));
        ln.setPillarLevel(ends[l2], pal, 0.3 + 0.35 * kap[l2]);
      }
    };
  });

  /* -------------------------------------------------- 7. triangle fails --- */

  A.scene('ln-fail', function (root, api) {
    var pal = ln.pal();
    var cam = S.camera(root);
    var svg = cam.mount(S.root(ln.W, ln.H,
      'The three sticks try to close again, but one is now longer than the ' +
      'other two together. It swings, falls short of the corner it has to reach, ' +
      'and swings back; the shortfall is drawn. Beside it the cone deforms in ' +
      'step: the rings go from circular to elliptical, the two cone tips slide ' +
      'along a zone edge towards each other, merge, and then a gap opens between ' +
      'the upper and lower sheets. Both panels are driven by the same number.'));
    var lay = ln.dual(svg, cam);
    api.onResize = function () { lay.sync(); };
    api.onTheme = function () { pal = ln.pal(); };

    var sticks = ln.sticks(svg, pal);
    var cone = ln.conePanel(svg, pal);

    return function (p) {
      var q = api.reduced ? 1 : p;
      cone.place(lay.right);
      cam.lookAt(lay.W / 2, lay.H / 2, 1);

      /* One parameter, swept once, then held. The last quarter of the scroll is
         a plateau: the gap sits open and nothing moves, which is the two seconds
         of silence the storyboard asks for, with the reader holding the clock. */
      var sweep = M.clamp(M.inv(q, 0.04, 0.72), 0, 1);
      var eta = M.lerp(0, ETA_MAX, M.easeInOut(sweep));
      var kap = ln.kappaSweep(eta);

      /* THE shared number. Both panels below are driven by this one value:
         the sticks close only while it is non-negative, and the cone's gap is
         twice its shortfall when it is not. It is computed once and handed to
         both, so they cannot come apart. */
      var margin = L.diracMargin(kap);

      var mag = [Math.abs(kap[0]), Math.abs(kap[1]), Math.abs(kap[2])];
      var order = [0, 1, 2].sort(function (a, b) { return mag[b] - mag[a]; });
      var hi = order[0], mid = order[1], lo = order[2];
      var reach = mag[mid] + mag[lo];

      /* The long stick is pinned along the axis, from the corner it has to be
         closed back to. The two shorter ones are chained to its far end and have
         to get back to that corner: they can exactly when their combined length
         is at least the long one, which is the triangle inequality. */
      var sc = lay.left.s;
      var O = { x: lay.left.cx + sc * 0.74, y: lay.left.cy };
      var Apt = { x: O.x - mag[hi] * sc, y: O.y };

      var widths = [], tones = [], i;
      for (i = 0; i < 3; i++) {
        var li = [hi, mid, lo][i];
        widths.push(5 + 7 * mag[li]);
        tones.push(ln.divg(pal, 0.5 + (kap[li] - 1) / (2 * ETA_MAX) * 0.9));
      }

      var closed = margin >= 0;
      /* Once the chain cannot close, the two shorter sticks are drawn on their
         own line just above the long one. Only that vertical separation is a
         drawing choice: the lengths and the horizontal shortfall between the
         chain's end and the corner are exactly the couplings and exactly
         -margin. Laid on one line they would sit on top of the long stick,
         because closest approach is where all three are collinear. */
      var OFF = 36;
      if (closed) {
        /* Law of cosines for the angle at the far end: at the threshold it goes
           to zero and the triangle lies flat along the axis, which is the
           degeneracy the cone shows at the same instant. */
        var cA = (mag[hi] * mag[hi] + mag[mid] * mag[mid] - mag[lo] * mag[lo]) /
                 (2 * mag[hi] * mag[mid]);
        var turn = Math.acos(M.clamp(cA, -1, 1));
        var Tx = Apt.x + Math.cos(turn) * mag[mid] * sc;
        var Ty = Apt.y - Math.sin(turn) * mag[mid] * sc;
        sticks.chain(O, [mag[hi], mag[mid], mag[lo]],
          [Math.PI, turn, Math.atan2(-(O.y - Ty), O.x - Tx)], sc, widths, tones);
        S.op(sticks.miss, 0);
        S.op(sticks.guide, 0);
        S.op(sticks.arc, M.clamp(M.inv(margin, 0.45, 0.08), 0, 1) * 0.55);
      } else {
        /* Two full swings, settling at closest approach and holding there. */
        var osc = M.beat(q, 0.66, 0.9);
        var dir = api.reduced ? 0 : 0.66 * Math.sin(osc * Math.PI * 2) * (1 - osc);
        var Ay = O.y - OFF;
        /* Long stick, on its own line. */
        sticks.bars[0].setAttribute('x1', O.x.toFixed(2));
        sticks.bars[0].setAttribute('y1', O.y.toFixed(2));
        sticks.bars[0].setAttribute('x2', Apt.x.toFixed(2));
        sticks.bars[0].setAttribute('y2', O.y.toFixed(2));
        sticks.bars[0].setAttribute('stroke-width', widths[0].toFixed(2));
        sticks.bars[0].setAttribute('stroke', tones[0]);
        sticks.dots[0].setAttribute('cx', O.x.toFixed(2));
        sticks.dots[0].setAttribute('cy', O.y.toFixed(2));
        /* The two shorter ones, chained from the far end and swinging. */
        var px = Apt.x, py = Ay, bi;
        for (bi = 1; bi < 3; bi++) {
          var len = mag[bi === 1 ? mid : lo] * sc;
          var nx = px + Math.cos(dir) * len, ny = py - Math.sin(dir) * len;
          sticks.bars[bi].setAttribute('x1', px.toFixed(2));
          sticks.bars[bi].setAttribute('y1', py.toFixed(2));
          sticks.bars[bi].setAttribute('x2', nx.toFixed(2));
          sticks.bars[bi].setAttribute('y2', ny.toFixed(2));
          sticks.bars[bi].setAttribute('stroke-width', widths[bi].toFixed(2));
          sticks.bars[bi].setAttribute('stroke', tones[bi]);
          sticks.dots[bi].setAttribute('cx', px.toFixed(2));
          sticks.dots[bi].setAttribute('cy', py.toFixed(2));
          px = nx; py = ny;
        }
        sticks.dots[3].setAttribute('cx', px.toFixed(2));
        sticks.dots[3].setAttribute('cy', py.toFixed(2));
        /* The shortfall, drawn only as the chain comes back onto the axis,
           where the distance it still has to cover is exactly -margin. */
        sticks.miss.setAttribute('x1', px.toFixed(2));
        sticks.miss.setAttribute('y1', py.toFixed(2));
        sticks.miss.setAttribute('x2', O.x.toFixed(2));
        sticks.miss.setAttribute('y2', Ay.toFixed(2));
        sticks.miss.setAttribute('stroke-width', 4);
        S.op(sticks.miss, M.smooth(M.clamp(1 - Math.abs(dir) / 0.3, 0, 1)));
        S.setD(sticks.guide,
          'M' + O.x.toFixed(1) + ' ' + (O.y + 9).toFixed(1) + 'L' + O.x.toFixed(1) + ' ' + (Ay - 13).toFixed(1) +
          'M' + Apt.x.toFixed(1) + ' ' + (O.y + 9).toFixed(1) + 'L' + Apt.x.toFixed(1) + ' ' + (Ay - 13).toFixed(1));
        S.op(sticks.guide, 0.5);
        S.op(sticks.arc, 0.55);
      }
      /* The arc the free end can reach, centred on the far end of the long
         stick, so the reader can see that no angle gets it to the corner. */
      var apts = [], aj;
      for (aj = 0; aj <= 72; aj++) {
        var aa = -Math.PI * 0.8 + aj / 72 * Math.PI * 1.6;
        apts.push([Apt.x + Math.cos(aa) * reach * sc,
                   (closed ? O.y : O.y - OFF) - Math.sin(aa) * reach * sc]);
      }
      S.setD(sticks.arc, S.polyD(apts));
      sticks.dots.forEach(function (d) { d.setAttribute('r', 7); S.op(d, 0.85); });

      cone.update(kap, 1, margin);
    };
  });

  /* ---------------------------------------------------------- 8. scale --- */

  A.scene('ln-scale', function (root, api) {
    var pal = ln.pal();
    var cam = S.camera(root);
    var svg = cam.mount(S.root(ln.WS, ln.H,
      'The whole lattice, far out, every bond coloured by its own imbalance. ' +
      'The pattern is the same everywhere: one bond direction over-coupled, two ' +
      'under-coupled, identically in every cell. A uniform imbalance is a ' +
      'constant vector potential, and a constant vector potential has no curl, ' +
      'so it produces no pseudomagnetic field. It only corrupts the band ' +
      'structure that everything else is built on.'));
    api.onResize = cam.measure;
    api.onTheme = function () { pal = ln.pal(); };

    var N = 9, SC = 23;
    var flake = L.buildFlake(N);
    var cx = ln.WS / 2, cy = ln.H / 2;
    var X = function (u) { return cx + u * SC; };
    var Y = function (v) { return cy - v * SC; };

    /* Bond colour depends only on the bond direction, so the whole field
       recolours with three attribute writes instead of one per bond. */
    var layers = [S.g(), S.g(), S.g()];
    layers.forEach(function (g) { svg.appendChild(g); });
    flake.bonds.forEach(function (b) {
      var a = flake.sites[b.a], c = flake.sites[b.b];
      var el = ln.line(X(a.x), Y(a.y), X(c.x), Y(c.y), null);
      el.setAttribute('stroke-linecap', 'round');
      layers[b.l].appendChild(el);
    });
    var siteLayer = S.g();
    svg.appendChild(siteLayer);
    flake.sites.forEach(function (s) {
      var d = ln.circle(X(s.x), Y(s.y), SC * 0.17, null);
      d.setAttribute('fill', S.mixHex(pal.vd, pal.bal, 0.5));
      siteLayer.appendChild(d);
    });

    return function (p) {
      var q = api.reduced ? 1 : p;
      cam.lookAt(cx, cy, M.lerp(1.0, 1.1, M.easeInOut(q)));
      var kap = ln.kappaSweep(ETA_MAX);
      for (var l = 0; l < 3; l++) {
        layers[l].setAttribute('stroke', ln.divg(pal, 0.5 + (kap[l] - 1) / (2 * ETA_MAX) * 0.9));
        layers[l].setAttribute('stroke-width', (1.1 + 1.5 * Math.abs(kap[l])).toFixed(2));
        S.op(layers[l], M.clamp(M.inv(q, 0.0, 0.25), 0, 1));
      }
      S.op(siteLayer, 0.5 * M.clamp(M.inv(q, 0.05, 0.3), 0, 1));
    };
  });
})(window.A = window.A || {});
