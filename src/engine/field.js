/* Named vector fields, with divergence and curl evaluated by central finite
   differences from the field function itself.

   Nothing here hard-codes an answer. The numbers the sandbox prints are computed
   the same way you would compute them symbolically, and build.mjs checks them
   against fields whose div and curl are known in closed form — a page that
   teaches curl must not ship the wrong curl. */
(function (A) {
  'use strict';
  var F = A.field = {};

  var H = 1e-4;   /* step for the central difference, in field coordinates */

  /* A 2-D field is fn(x, y) -> [Ax, Ay]. Everything below treats the third
     component as zero and z-independent, which is true of every field on the
     page, so curl points purely along z and is reported as that one number. */

  F.div = function (fn, x, y, h) {
    h = h || H;
    var ax1 = fn(x + h, y)[0], ax0 = fn(x - h, y)[0];
    var ay1 = fn(x, y + h)[1], ay0 = fn(x, y - h)[1];
    return (ax1 - ax0) / (2 * h) + (ay1 - ay0) / (2 * h);
  };

  /* (curl A)_z = dAy/dx - dAx/dy */
  F.curlZ = function (fn, x, y, h) {
    h = h || H;
    var ay1 = fn(x + h, y)[1], ay0 = fn(x - h, y)[1];
    var ax1 = fn(x, y + h)[0], ax0 = fn(x, y - h)[0];
    return (ay1 - ay0) / (2 * h) - (ax1 - ax0) / (2 * h);
  };

  /* Gradient of a scalar field g(x, y), for the gradient scenes. */
  F.grad = function (g, x, y, h) {
    h = h || H;
    return [(g(x + h, y) - g(x - h, y)) / (2 * h),
            (g(x, y + h) - g(x, y - h)) / (2 * h)];
  };

  /* Laplacian of a scalar field: the second-difference stencil, which is
     literally "how far this point sits below the average of its neighbours". */
  F.laplacian = function (g, x, y, h) {
    h = h || 1e-3;
    var c = g(x, y);
    return (g(x + h, y) + g(x - h, y) + g(x, y + h) + g(x, y - h) - 4 * c) / (h * h);
  };

  /* The neighbour-average form of the same thing, used by the Laplacian scene:
     average of the four neighbours minus the centre, without the 1/h^2. */
  F.neighbourGap = function (g, x, y, h) {
    h = h || 0.25;
    return (g(x + h, y) + g(x - h, y) + g(x, y + h) + g(x, y - h)) / 4 - g(x, y);
  };

  /* ------------------------------------------------------------ the catalogue */
  /* Each entry: a formula string for the label, the field itself, and a short
     note naming what the reader should notice. `known` gives the closed-form
     div and curl where they are constant, for the build-time assertions. */

  F.catalogue = [
    {
      id: 'uniform',
      name: 'uniform flow',
      tex: 'A = (1, 0)',
      fn: function () { return [1, 0]; },
      note: 'nothing changes anywhere: no divergence, no curl',
      known: { div: 0, curl: 0 }
    },
    {
      id: 'radial',
      name: 'radial source',
      tex: 'A = (x, y)',
      fn: function (x, y) { return [x, y]; },
      note: 'everything flows outward — pure divergence, and no curl at all',
      known: { div: 2, curl: 0 }
    },
    {
      id: 'sink',
      name: 'radial sink',
      tex: 'A = (−x, −y)',
      fn: function (x, y) { return [-x, -y]; },
      note: 'the same field reversed: divergence is negative',
      known: { div: -2, curl: 0 }
    },
    {
      id: 'vortex',
      name: 'rigid rotation',
      tex: 'A = (−y, x)',
      fn: function (x, y) { return [-y, x]; },
      note: 'turns like a solid disc — pure curl, and no divergence',
      known: { div: 0, curl: 2 }
    },
    {
      id: 'shear',
      name: 'shear',
      tex: 'A = (y, 0)',
      fn: function (x, y) { return [y, 0]; },
      note: 'every arrow points the same way, yet the curl is not zero',
      known: { div: 0, curl: -1 }
    },
    {
      id: 'freevortex',
      name: 'free vortex',
      tex: 'A = (−y, x) / (x² + y²)',
      fn: function (x, y) {
        var r2 = x * x + y * y;
        if (r2 < 1e-6) return [0, 0];
        return [-y / r2, x / r2];
      },
      note: 'it circles the origin, yet the curl vanishes everywhere except there'
    },
    {
      id: 'saddle',
      name: 'saddle',
      tex: 'A = (x, −y)',
      fn: function (x, y) { return [x, -y]; },
      note: 'stretched one way, squeezed the other: the two contributions cancel',
      known: { div: 0, curl: 0 }
    },
    {
      id: 'planewaveE',
      name: 'the plane wave E of §1.1',
      tex: 'E = ŷ cos(kx)',
      fn: function (x) { return [0, Math.cos(1.4 * x)]; },
      note: 'divergence is zero everywhere — this is why light is transverse'
    },
    {
      id: 'gradfield',
      name: 'gradient of a bowl',
      tex: 'A = ∇(x² + y²)/2 = (x, y)',
      fn: function (x, y) { return [x, y]; },
      note: 'any field that is a gradient has zero curl, always'
    }
  ];

  F.byId = function (id) {
    for (var i = 0; i < F.catalogue.length; i++) {
      if (F.catalogue[i].id === id) return F.catalogue[i];
    }
    return F.catalogue[0];
  };

  /* Circulation of the field round a small square, which is what a paddlewheel
     responds to. Divided by the enclosed area it converges on the curl, which is
     the honest statement of "curl is circulation per unit area". */
  F.circulation = function (fn, x, y, s) {
    var n = 24, i, t, sum = 0;
    /* bottom edge, +x */
    for (i = 0; i < n; i++) { t = -s + 2 * s * (i + 0.5) / n; sum += fn(x + t, y - s)[0] * (2 * s / n); }
    /* right edge, +y */
    for (i = 0; i < n; i++) { t = -s + 2 * s * (i + 0.5) / n; sum += fn(x + s, y + t)[1] * (2 * s / n); }
    /* top edge, -x */
    for (i = 0; i < n; i++) { t = -s + 2 * s * (i + 0.5) / n; sum -= fn(x + t, y + s)[0] * (2 * s / n); }
    /* left edge, -y */
    for (i = 0; i < n; i++) { t = -s + 2 * s * (i + 0.5) / n; sum -= fn(x - s, y + t)[1] * (2 * s / n); }
    return sum;
  };

  /* Net outward flux through the same small square: the divergence's own
     definition, before any derivative is taken. */
  F.flux = function (fn, x, y, s) {
    var n = 24, i, t, sum = 0;
    for (i = 0; i < n; i++) { t = -s + 2 * s * (i + 0.5) / n; sum += fn(x + s, y + t)[0] * (2 * s / n); }
    for (i = 0; i < n; i++) { t = -s + 2 * s * (i + 0.5) / n; sum -= fn(x - s, y + t)[0] * (2 * s / n); }
    for (i = 0; i < n; i++) { t = -s + 2 * s * (i + 0.5) / n; sum += fn(x + t, y + s)[1] * (2 * s / n); }
    for (i = 0; i < n; i++) { t = -s + 2 * s * (i + 0.5) / n; sum -= fn(x + t, y - s)[1] * (2 * s / n); }
    return sum;
  };
})(window.A = window.A || {});
