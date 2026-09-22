/* Honeycomb tight-binding for a lattice of resonant pillars on a piezoelectric
   substrate. Two sublattices, three bond directions, one coupling per direction.

   Everything a scene draws comes from here. The band structure is the exact
   nearest-neighbour result, the Dirac points are solved in closed form rather
   than hunted for on a grid, and the gap follows from a triangle inequality on
   the three couplings. build.mjs checks all three against a Brillouin-zone grid
   minimum, because a page about a gap opening must not ship the wrong gap. */
(function (A) {
  'use strict';
  var L = A.lattice = {};

  /* Lattice constant is the bond length. Bonds leave an A site at 90, 210 and
     330 degrees, so one bond points along +y and the crystal X axis of a
     Y-rotated cut can be swept against them by rotating thetaX. */
  var A0 = 1.0;
  L.A = A0;

  var RHO = [];
  (function () {
    for (var l = 0; l < 3; l++) {
      var th = Math.PI / 2 + l * 2 * Math.PI / 3;
      RHO.push({ x: A0 * Math.cos(th), y: A0 * Math.sin(th), theta: th, l: l });
    }
  })();
  L.RHO = RHO;

  /* Primitive vectors of the underlying triangular lattice. */
  L.A1 = { x: RHO[0].x - RHO[1].x, y: RHO[0].y - RHO[1].y };
  L.A2 = { x: RHO[0].x - RHO[2].x, y: RHO[0].y - RHO[2].y };

  /* ------------------------------------------------------------- flake --- */

  L.buildFlake = function (N) {
    var sites = [], bonds = [], index = {}, i, j, s, l;
    var key = function (i, j, s) { return i + ',' + j + ',' + s; };
    var subs = ['A', 'B'];
    for (i = -N; i <= N; i++) {
      for (j = -N; j <= N; j++) {
        var ox = i * L.A1.x + j * L.A2.x, oy = i * L.A1.y + j * L.A2.y;
        if (Math.sqrt(ox * ox + oy * oy) > N * 1.5 * A0) continue;
        for (s = 0; s < 2; s++) {
          var px = subs[s] === 'A' ? ox : ox + RHO[0].x;
          var py = subs[s] === 'A' ? oy : oy + RHO[0].y;
          index[key(i, j, subs[s])] = sites.length;
          sites.push({ x: px, y: py, sub: subs[s], i: i, j: j });
        }
      }
    }
    /* Each A site bonds to three B sites, one per bond direction l. */
    var offsets = [[0, 0], [0, -1], [-1, 0]];
    for (var k in index) {
      if (!Object.prototype.hasOwnProperty.call(index, k)) continue;
      var parts = k.split(',');
      if (parts[2] !== 'A') continue;
      var ia = index[k];
      for (l = 0; l < 3; l++) {
        var ib = index[key(+parts[0] + offsets[l][0], +parts[1] + offsets[l][1], 'B')];
        if (ib !== undefined) bonds.push({ a: ia, b: ib, l: l });
      }
    }
    return { sites: sites, bonds: bonds };
  };

  /* -------------------------------------------------------- anisotropy --- */
  /* PLACEHOLDER until kappa is extracted numerically for 128YX LiNbO3. The
     two-fold in-plane form is mirror-symmetric about X, which is the right
     symmetry class for a Y-rotated cut. eta = 0 is isotropic.

     The same function is plotted in polar as the directional rose, so the rose
     and the bond widths are one curve sampled twice, not two decisions. */
  L.kappaAnisotropic = function (l, opts) {
    opts = opts || {};
    var k0 = opts.kappa0 === undefined ? 1 : opts.kappa0;
    var eta = opts.eta || 0;
    var thetaX = opts.thetaX || 0;
    return k0 * (1 + eta * Math.cos(2 * (RHO[l].theta - thetaX)));
  };

  L.kappas = function (opts) {
    return [L.kappaAnisotropic(0, opts), L.kappaAnisotropic(1, opts), L.kappaAnisotropic(2, opts)];
  };

  /* The rose: kappaAnisotropic as a function of angle rather than bond index. */
  L.rose = function (theta, opts) {
    opts = opts || {};
    var k0 = opts.kappa0 === undefined ? 1 : opts.kappa0;
    return k0 * (1 + (opts.eta || 0) * Math.cos(2 * (theta - (opts.thetaX || 0))));
  };

  /* ---------------------------------------------------- band structure --- */
  /* h(k) = sum_l kappa_l exp(i k . rho_l);  E(k) = +/- |h(k)|. Exact for three
     nearest neighbours. */
  L.h = function (kx, ky, kappa) {
    var re = 0, im = 0;
    for (var l = 0; l < 3; l++) {
      var ph = kx * RHO[l].x + ky * RHO[l].y;
      re += kappa[l] * Math.cos(ph);
      im += kappa[l] * Math.sin(ph);
    }
    return { re: re, im: im };
  };

  L.energy = function (kx, ky, kappa) {
    var c = L.h(kx, ky, kappa);
    return Math.sqrt(c.re * c.re + c.im * c.im);
  };

  /* The triangle inequality, and the whole argument of the piece.

     A Dirac point is a k where the three phasors close into a triangle, which
     they can do exactly when no side exceeds the sum of the other two. Only the
     MAGNITUDES enter: a negative coupling is a positive length carrying a pi
     phase, and the Bloch phases absorb it. Sorting signed values instead gives
     the wrong answer everywhere a coupling changes sign, which is precisely the
     triaxial pattern in the coda.

       margin > 0  : two Dirac points
       margin == 0 : the two points merge
       margin < 0  : gap of 2*|margin| */
  L.diracMargin = function (kappa) {
    var m = [Math.abs(kappa[0]), Math.abs(kappa[1]), Math.abs(kappa[2])];
    m.sort(function (a, b) { return a - b; });
    return m[0] + m[1] - m[2];
  };

  /* Gap width, exact. Not a grid search and not eyeballed: min|h| over the zone
     is max(0, -margin), so the gap is twice that. */
  L.gap = function (kappa) {
    var m = L.diracMargin(kappa);
    return 2 * Math.max(0, -m);
  };

  /* Closed-form Dirac points. Returns [] when the lattice is gapped.

     Law of cosines fixes the phase differences that close the triangle; the
     constraint sum(k . rho_l) = 0 fixes the overall phase, because the three
     bond vectors sum to zero. The two solutions are the two opposite sign
     choices, K and K', and they merge exactly when the triangle degenerates. */
  L.diracPoints = function (kappa) {
    var k1 = Math.abs(kappa[0]), k2 = Math.abs(kappa[1]), k3 = Math.abs(kappa[2]);
    if (k1 === 0 || k2 === 0 || k3 === 0) return [];
    var c12 = (k3 * k3 - k1 * k1 - k2 * k2) / (2 * k1 * k2);
    var c13 = (k2 * k2 - k1 * k1 - k3 * k3) / (2 * k1 * k3);
    if (Math.abs(c12) > 1 || Math.abs(c13) > 1) return [];

    /* A negative coupling shifts its phasor by pi, so the phases that close the
       magnitude triangle sum to pi times the number of negative couplings. */
    var flip = [kappa[0] < 0 ? 1 : 0, kappa[1] < 0 ? 1 : 0, kappa[2] < 0 ? 1 : 0];
    var PHI = Math.PI * (flip[0] + flip[1] + flip[2]);

    var a = Math.acos(c12), b = Math.acos(c13), out = [], si;
    var r0 = RHO[0], r1 = RHO[1];
    var det = r0.x * r1.y - r0.y * r1.x;
    for (si = 0; si < 2; si++) {
      var s = si === 0 ? 1 : -1;
      var d12 = s * a, d13 = -s * b;
      var psi1 = (PHI + d12 + d13) / 3;
      var p1 = psi1 - Math.PI * flip[0];
      var p2 = psi1 - d12 - Math.PI * flip[1];
      out.push({
        kx: (p1 * r1.y - r0.y * p2) / det,
        ky: (r0.x * p2 - p1 * r1.x) / det
      });
    }
    return out;
  };

  /* Where |h(k)| is smallest, in either regime. Gapless, that is a Dirac point.
     Gapped, the two shorter phasors both turn to oppose the longest one, and the
     constraint that the three phases sum to zero fixes the rest, so the point is
     still closed-form and |h| there is exactly half the gap. */
  L.minPoint = function (kappa) {
    var dp = L.diracPoints(kappa);
    if (dp.length) return dp[0];

    var mag = [Math.abs(kappa[0]), Math.abs(kappa[1]), Math.abs(kappa[2])];
    var hi = 0;
    if (mag[1] > mag[hi]) hi = 1;
    if (mag[2] > mag[hi]) hi = 2;

    var flip = [kappa[0] < 0 ? 1 : 0, kappa[1] < 0 ? 1 : 0, kappa[2] < 0 ? 1 : 0];
    var PHI = Math.PI * (flip[0] + flip[1] + flip[2]);
    var psiHi = (PHI - 2 * Math.PI) / 3;

    var phi = [0, 0, 0], l;
    for (l = 0; l < 3; l++) {
      phi[l] = (l === hi ? psiHi : psiHi + Math.PI) - Math.PI * flip[l];
    }
    var r0 = RHO[0], r1 = RHO[1];
    var det = r0.x * r1.y - r0.y * r1.x;
    return {
      kx: (phi[0] * r1.y - r0.y * phi[1]) / det,
      ky: (r0.x * phi[1] - phi[0] * r1.x) / det
    };
  };

  /* A constant-energy contour around a Dirac point, traced ray by ray.

     The trace follows the curve: each ray looks for its crossing next to the
     previous ray's, and only falls back to a full outward march when that
     window holds none. Starting every ray at the centre instead would let the
     trace hop onto a different branch, because on the way towards the
     neighbouring Dirac point |h| dips again, and the first crossing found there
     belongs to that cone rather than this one -- which drew a kink.

     Returns null when no closed loop exists at this level, which is how a gap
     shows up: below the band edge there is simply nothing to trace. */
  L.contour = function (kappa, centre, level, nRay, rMax) {
    if (L.energy(centre.kx, centre.ky, kappa) > level) return null;

    var at = function (r, cx, cy) {
      return L.energy(centre.kx + r * cx, centre.ky + r * cy, kappa);
    };

    /* Bisect a bracket known to straddle the level. -1 when it does not. */
    var cross = function (cx, cy, lo, hi) {
      if ((at(lo, cx, cy) < level) === (at(hi, cx, cy) < level)) return -1;
      for (var k = 0; k < 24; k++) {
        var mid = (lo + hi) / 2;
        if (at(mid, cx, cy) < level) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    };

    /* First crossing going out from the centre. */
    var scan = function (cx, cy) {
      var prev = 0, STEPS = 64, k;
      for (k = 1; k <= STEPS; k++) {
        var rr = rMax * k / STEPS;
        if (at(rr, cx, cy) >= level) return cross(cx, cy, prev, rr);
        prev = rr;
      }
      return -1;
    };

    var pts = [], last = -1, i;
    for (i = 0; i < nRay; i++) {
      var th = i / nRay * Math.PI * 2;
      var cx = Math.cos(th), cy = Math.sin(th), r = -1;
      if (last > 0) {
        r = cross(cx, cy, Math.max(1e-5, last * 0.55), Math.min(rMax, last * 1.7));
      }
      if (r < 0) r = scan(cx, cy);
      if (r < 0) return null;
      last = r;
      pts.push({ kx: centre.kx + r * cx, ky: centre.ky + r * cy, r: r, theta: th });
    }
    /* A loop has to come back to where it started. */
    if (Math.abs(pts[0].r - last) > 0.5 * Math.max(pts[0].r, last)) return null;
    return pts;
  };

  /* Reciprocal lattice, the Brillouin zone and its high-symmetry points, all
     derived from the primitive vectors rather than written down. */
  L.B1 = null;
  L.B2 = null;
  (function () {
    var a1 = L.A1, a2 = L.A2;
    var cross = a1.x * a2.y - a1.y * a2.x;
    var f = 2 * Math.PI / cross;
    L.B1 = { x: f * a2.y, y: -f * a2.x };
    L.B2 = { x: -f * a1.y, y: f * a1.x };
  })();

  /* Zone corners K sit at |b|/sqrt(3), edge midpoints M at |b|/2. */
  L.KR = Math.sqrt(L.B1.x * L.B1.x + L.B1.y * L.B1.y) / Math.sqrt(3);
  L.MR = Math.sqrt(L.B1.x * L.B1.x + L.B1.y * L.B1.y) / 2;

  L.bzHex = function () {
    var out = [], i;
    /* The corner nearest the +kx axis, then every sixty degrees. */
    var th0 = Math.atan2(L.B1.y, L.B1.x) - Math.PI / 6;
    for (i = 0; i < 6; i++) {
      var th = th0 + i * Math.PI / 3;
      out.push({ kx: L.KR * Math.cos(th), ky: L.KR * Math.sin(th) });
    }
    return out;
  };

  L.mPoints = function () {
    var out = [], i;
    var th0 = Math.atan2(L.B1.y, L.B1.x);
    for (i = 0; i < 6; i++) {
      var th = th0 + i * Math.PI / 3;
      out.push({ kx: L.MR * Math.cos(th), ky: L.MR * Math.sin(th) });
    }
    return out;
  };

  /* Fold a wavevector into the first Brillouin zone, so a Dirac point that has
     wandered into a neighbouring zone is drawn where it belongs. */
  L.reduceK = function (kx, ky) {
    var best = { kx: kx, ky: ky }, bd = kx * kx + ky * ky, i, j;
    for (i = -2; i <= 2; i++) {
      for (j = -2; j <= 2; j++) {
        var px = kx - i * L.B1.x - j * L.B2.x;
        var py = ky - i * L.B1.y - j * L.B2.y;
        var d = px * px + py * py;
        if (d < bd - 1e-12) { bd = d; best = { kx: px, ky: py }; }
      }
    }
    return best;
  };

  /* Fold to the zone image nearest a reference point, so a point tracked across
     a sweep stays on one branch instead of jumping between equivalent images. */
  L.reduceNear = function (kx, ky, rx, ry) {
    var best = null, bd = Infinity, i, j;
    for (i = -3; i <= 3; i++) {
      for (j = -3; j <= 3; j++) {
        var px = kx - i * L.B1.x - j * L.B2.x;
        var py = ky - i * L.B1.y - j * L.B2.y;
        var d = (px - rx) * (px - rx) + (py - ry) * (py - ry);
        if (d < bd) { bd = d; best = { kx: px, ky: py }; }
      }
    }
    return best;
  };

  /* The pair of Dirac points as they should be drawn: folded onto one zone edge
     and placed symmetrically about the point they will merge at. The second is
     the time-reversal partner of the first, k -> -k, folded back, which is why
     reflecting through the merge point gives it exactly. */
  L.diracPair = function (kappa, ref) {
    var dp = L.diracPoints(kappa);
    if (!dp.length) return [];
    var a = L.reduceNear(dp[0].kx, dp[0].ky, ref.kx, ref.ky);
    /* Reflecting through the merge point says which zone image the partner
       belongs in; the point returned is still the solved one, so both are zeros
       of |h| to machine precision rather than to the precision of the
       reflection. */
    var b = L.reduceNear(dp[1].kx, dp[1].ky, 2 * ref.kx - a.kx, 2 * ref.ky - a.ky);
    return [a, b];
  };

  /* ----------------------------------------------------- compensation --- */
  /* Invert the geometry -> kappa law per bond direction so all three match.
     The exponential form is the WKB relation this project uses; substitute the
     measured pillar-geometry law once it exists. Returns a dimensionless offset
     in units of the lattice constant. */
  L.compensate = function (kappaTarget, l, opts, o) {
    o = o || {};
    var beta = o.beta === undefined ? 3 : o.beta;
    var k = L.kappaAnisotropic(l, opts);
    return -Math.log(kappaTarget / k) / beta;
  };

  /* -------------------------------------------------------- triaxial ---- */
  /* A uniform imbalance is a constant vector potential: it moves the Dirac
     point and, having no curl, produces no pseudomagnetic field. Grading it in
     space is the useful thing. Here kappa_l varies linearly along its own bond
     direction, so the locus where kappa_l changes sign is a straight line whose
     normal is rho_l -- perpendicular to the bond, which is the zigzag
     direction. The three lines cut out a zigzag-terminated triangle. */
  L.kappaTriaxial = function (x, y, l, C) {
    return 1 + C * (x * RHO[l].x + y * RHO[l].y);
  };

  L.bondMidpoint = function (flake, bond) {
    var a = flake.sites[bond.a], b = flake.sites[bond.b];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  };

  /* Vertices of the triangle cut out by the three sign-change lines. */
  L.signTriangle = function (C) {
    var d = -1 / C, out = [], pairs = [[0, 1], [1, 2], [2, 0]], n;
    for (n = 0; n < 3; n++) {
      var a = RHO[pairs[n][0]], b = RHO[pairs[n][1]];
      var det = a.x * b.y - a.y * b.x;
      out.push({ x: d * (b.y - a.y) / det, y: d * (a.x - b.x) / det });
    }
    return out;
  };

  /* Pseudo-Landau levels of a uniform pseudomagnetic field: E_n goes as the
     signed square root of the level index, with the zeroth level at zero. */
  L.landauLevels = function (nMax, scale) {
    var out = [], n;
    for (n = -nMax; n <= nMax; n++) {
      out.push({ n: n, E: (n < 0 ? -1 : 1) * Math.sqrt(Math.abs(n)) * scale });
    }
    return out;
  };
})(window.A = window.A || {});
