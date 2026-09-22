/* SVG construction helpers. Scenes build real SVG nodes; nothing here writes
   markup strings, so there is no escaping hazard and nodes stay addressable. */
(function (A) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var S = A.svg = {};

  S.el = function (tag, attrs, kids) {
    var n = document.createElementNS(NS, tag), k;
    if (attrs) for (k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (kids) for (var i = 0; i < kids.length; i++) if (kids[i]) n.appendChild(kids[i]);
    return n;
  };
  S.root = function (w, h, label) {
    var s = S.el('svg', {
      viewBox: '0 0 ' + w + ' ' + h,
      preserveAspectRatio: 'xMidYMid meet',
      role: 'img',
      'aria-label': label || ''
    });
    s.dataset.w = w; s.dataset.h = h;
    return s;
  };
  S.g = function (attrs, kids) { return S.el('g', attrs, kids); };

  S.text = function (x, y, str, cls, anchor) {
    var t = S.el('text', { x: x, y: y, class: cls || 's-lbl', 'text-anchor': anchor || 'start' });
    t.textContent = str;
    return t;
  };
  S.line = function (x1, y1, x2, y2, cls) {
    return S.el('line', { x1: x1, y1: y1, x2: x2, y2: y2, class: cls || 's-axis' });
  };
  S.path = function (d, cls) { return S.el('path', { d: d, class: cls || 's-wave' }); };
  S.circle = function (cx, cy, r, cls) {
    return S.el('circle', { cx: cx, cy: cy, r: r, class: cls || 's-fill-w' });
  };
  S.rect = function (x, y, w, h, cls) {
    return S.el('rect', { x: x, y: y, width: Math.max(0, w), height: Math.max(0, h), class: cls });
  };

  /* Polyline through [x,y] pairs, emitted as a path so it accepts dash arrays. */
  S.poly = function (pts, cls) {
    if (!pts.length) return S.path('', cls);
    var d = 'M' + pts[0][0].toFixed(2) + ' ' + pts[0][1].toFixed(2);
    for (var i = 1; i < pts.length; i++) d += 'L' + pts[i][0].toFixed(2) + ' ' + pts[i][1].toFixed(2);
    return S.path(d, cls);
  };
  S.polyD = function (pts) {
    if (!pts.length) return '';
    var d = 'M' + pts[0][0].toFixed(2) + ' ' + pts[0][1].toFixed(2);
    for (var i = 1; i < pts.length; i++) d += 'L' + pts[i][0].toFixed(2) + ' ' + pts[i][1].toFixed(2);
    return d;
  };
  /* Closed area between a curve and a baseline — for filled spectral densities. */
  S.areaD = function (pts, baseY) {
    if (!pts.length) return '';
    return S.polyD(pts) + 'L' + pts[pts.length - 1][0].toFixed(2) + ' ' + baseY +
           'L' + pts[0][0].toFixed(2) + ' ' + baseY + 'Z';
  };

  /* Sample y = f(x) across a pixel range. Returns [px, py] pairs. */
  S.sample = function (n, x0, x1, fn) {
    var pts = [], i, t, x;
    for (i = 0; i <= n; i++) { t = i / n; x = x0 + (x1 - x0) * t; pts.push(fn(x, t)); }
    return pts;
  };

  /* One arrow marker definition per colour class, referenced fragment-internally. */
  var markerSeq = 0;
  S.defsArrows = function (svg) {
    var uid = 'ar' + (++markerSeq);
    var defs = S.el('defs');
    [['w', 'var(--wave)'], ['q', 'var(--quantum)'], ['f', 'var(--fail)'],
     ['i', 'var(--ink-bright)'], ['m', 'var(--muted)'], ['p', 'var(--probability)']
    ].forEach(function (pair) {
      var m = S.el('marker', {
        id: uid + '-' + pair[0], viewBox: '0 0 10 10', refX: '9', refY: '5',
        markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse'
      }, [S.el('path', { d: 'M0 0L10 5L0 10Z', fill: pair[1] })]);
      defs.appendChild(m);
    });
    svg.appendChild(defs);
    svg.dataset.arrows = uid;
    return uid;
  };
  S.arrow = function (svg, x1, y1, x2, y2, tone, cls) {
    var uid = svg.dataset.arrows || S.defsArrows(svg);
    return S.el('line', {
      x1: x1, y1: y1, x2: x2, y2: y2,
      class: cls || ('s-' + ({ w: 'wave', q: 'quantum', f: 'fail', i: 'axis', m: 'ghost', p: 'prob' }[tone] || 'axis')),
      'marker-end': 'url(#' + uid + '-' + tone + ')'
    });
  };

  /* A labelled axis pair. Returns the group; scenes place curves in their own g. */
  S.axes = function (x0, y0, x1, y1, xLabel, yLabel) {
    var g = S.g({});
    g.appendChild(S.line(x0, y1, x1, y1, 's-axis'));
    g.appendChild(S.line(x0, y0, x0, y1, 's-axis'));
    if (xLabel) g.appendChild(S.text(x1, y1 + 20, xLabel, 's-lbl', 'end'));
    if (yLabel) g.appendChild(S.text(x0 - 6, y0 + 4, yLabel, 's-lbl', 'end'));
    return g;
  };
  S.gridLines = function (x0, y0, x1, y1, nx, ny) {
    var g = S.g({}), i, x, y;
    for (i = 1; i < nx; i++) { x = x0 + (x1 - x0) * i / nx; g.appendChild(S.line(x, y0, x, y1, 's-grid')); }
    for (i = 1; i < ny; i++) { y = y0 + (y1 - y0) * i / ny; g.appendChild(S.line(x0, y, x1, y, 's-grid')); }
    return g;
  };

  /* Reveal a path by animating its dash offset from a 0..1 progress value. */
  S.draw = function (pathEl, p) {
    var len = pathEl.getTotalLength ? pathEl.getTotalLength() : 0;
    if (!len) return;
    pathEl.style.strokeDasharray = len;
    pathEl.style.strokeDashoffset = len * (1 - A.math.clamp(p, 0, 1));
  };
  S.setD = function (pathEl, d) { pathEl.setAttribute('d', d); };
  S.op = function (node, v) { node.style.opacity = A.math.clamp(v, 0, 1); };

  /* Brace spanning a horizontal interval, for "this piece is that quantity". */
  S.braceD = function (x1, x2, y, depth) {
    var mid = (x1 + x2) / 2, d = depth || 8;
    return 'M' + x1 + ' ' + y + 'q0 ' + d + ' ' + d + ' ' + d +
           'L' + (mid - d) + ' ' + (y + d) + 'q' + d + ' 0 ' + d + ' ' + d +
           'q0 -' + d + ' ' + d + ' -' + d +
           'L' + (x2 - d) + ' ' + (y + d) + 'q' + d + ' 0 ' + d + ' -' + d;
  };

  /* Canvas sized to its container in device pixels; returns {ctx, w, h}. */
  S.fitCanvas = function (cv, maxDpr) {
    var r = cv.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, maxDpr || 2);
    var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (cv.width !== w * dpr || cv.height !== h * dpr) {
      cv.width = w * dpr; cv.height = h * dpr;
    }
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  };
  S.cssVar = function (name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  };

  /* Interpolate two hex colours. Every colour on the lattice page is either a
     token or a mix of two tokens, so the token block stays the only source. */
  S.mixHex = function (a, b, t) {
    var pa = parseInt(a.replace('#', ''), 16), pb = parseInt(b.replace('#', ''), 16);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    var r = Math.round(((pa >> 16) & 255) + (((pb >> 16) & 255) - ((pa >> 16) & 255)) * t);
    var g = Math.round(((pa >> 8) & 255) + (((pb >> 8) & 255) - ((pa >> 8) & 255)) * t);
    var bl = Math.round((pa & 255) + ((pb & 255) - (pa & 255)) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  };

  /* A three-stop ramp through a middle colour, for the hot amplitude sequence
     and the diverging imbalance scale. */
  S.ramp3 = function (lo, mid, hi, t) {
    return t <= 0.5 ? S.mixHex(lo, mid, t * 2) : S.mixHex(mid, hi, (t - 0.5) * 2);
  };

  /* Camera rig. One composited transform on a wrapper div: translate plus
     scale, driven by scroll progress.

     The SVG's own coordinate system never moves. That keeps the camera on the
     GPU, and it means getBBox() is unaffected by the camera, so flying into the
     lattice can never push a label outside its viewBox. Targets are given in
     SVG user units; pixels-per-unit is measured once and refreshed on resize. */
  S.camera = function (host) {
    var rig = document.createElement('div');
    rig.className = 'cam-rig';
    host.appendChild(rig);
    var svg = null, ppu = 1, cx = 0, cy = 0;
    var cam = {
      el: rig,
      mount: function (node) { svg = node; rig.appendChild(node); cam.measure(); return node; },
      measure: function () {
        if (!svg) return;
        var r = svg.getBoundingClientRect();
        var w = +svg.dataset.w || 1, h = +svg.dataset.h || 1;
        ppu = Math.min(r.width / w, r.height / h) || 1;
        cx = w / 2; cy = h / 2;
      },
      lookAt: function (ux, uy, zoom) {
        var dx = -(ux - cx) * ppu * zoom, dy = -(uy - cy) * ppu * zoom;
        rig.style.transform = 'translate(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) +
                              'px) scale(' + zoom.toFixed(4) + ')';
      }
    };
    return cam;
  };
})(window.A = window.A || {});
