/* Maths companion, opening: an advected vector field for atmosphere, and the
   type table that says what each operator eats and what it hands back. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg, F = A.field;

  /* ------------------------------------------------- hero: a field, flowing --- */

  A.scene('m-hero-field', function (root, api) {
    var cv = document.createElement('canvas');
    root.appendChild(cv);

    var N = 900;
    var rnd = M.rng(31337);
    var pts = [];
    for (var i = 0; i < N; i++) {
      pts.push({ x: rnd(), y: rnd(), age: rnd(), life: 0.5 + rnd() * 0.9 });
    }

    /* A gentle swirl plus a saddle: enough structure that the eye sees both
       rotation and stretching, which is the whole subject of the page. */
    function flow(x, y) {
      var u = (x - 0.5) * 3, v = (y - 0.5) * 3;
      var r2 = u * u + v * v + 0.6;
      return [(-v / r2) * 0.9 + Math.sin(v * 1.3) * 0.14,
              (u / r2) * 0.9 + Math.sin(u * 1.1) * 0.14];
    }

    return function (p, t) {
      var f = S.fitCanvas(cv, 1.5);
      var ctx = f.ctx, w = f.w, h = f.h;
      ctx.clearRect(0, 0, w, h);

      var scrolled = (window.scrollY || 0) / Math.max(1, h);
      var vis = 1 - M.smooth(M.clamp(scrolled * 1.15, 0, 1));
      if (vis <= 0.002) return;

      var cool = S.cssVar('--wave') || '#4FD6E3';
      var warm = S.cssVar('--quantum') || '#F2A65A';
      var dt = api.reduced ? 0 : 0.0055;

      for (var i = 0; i < N; i++) {
        var q = pts[i];
        var d = flow(q.x, q.y);
        var px = q.x * w, py = q.y * h;
        q.x += d[0] * dt; q.y += d[1] * dt;
        q.age += dt * 0.9;
        if (q.age > q.life || q.x < -0.05 || q.x > 1.05 || q.y < -0.05 || q.y > 1.05) {
          q.x = 0.08 + rnd() * 0.84; q.y = 0.08 + rnd() * 0.84; q.age = 0;
        }
        var nx = q.x * w, ny = q.y * h;
        var fade = Math.sin(Math.min(1, q.age / q.life) * Math.PI);
        var speed = Math.hypot(d[0], d[1]);
        ctx.strokeStyle = speed > 0.75 ? warm : cool;
        ctx.globalAlpha = 0.30 * fade * vis;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py); ctx.lineTo(nx, ny);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
  });

  /* --------------------------------------- what each operator eats and returns --- */

  A.scene('symbol-types', function (root) {
    var rows = [
      { sym: '∂f/∂x', name: 'partial derivative', inn: 'scalar field', out: 'scalar field',
        note: 'one slope out of several' },
      { sym: '∇f', name: 'gradient', inn: 'scalar field', out: 'vector field',
        note: 'all the slopes at once, as one arrow' },
      { sym: '∇ · A', name: 'divergence', inn: 'vector field', out: 'scalar field',
        note: 'is this point a source?' },
      { sym: '∇ × A', name: 'curl', inn: 'vector field', out: 'vector field',
        note: 'does a paddlewheel spin here?' },
      { sym: '∇² f', name: 'Laplacian', inn: 'scalar field', out: 'scalar field',
        note: 'how far below its neighbours’ average' },
      { sym: 'a · b', name: 'dot product', inn: 'two vectors', out: 'number',
        note: 'how much of one lies along the other' },
      { sym: 'a × b', name: 'cross product', inn: 'two vectors', out: 'vector',
        note: 'perpendicular to both; length is the area' },
      { sym: '∫ A · dr', name: 'line integral', inn: 'field and a path', out: 'number',
        note: 'add up the along-the-path part' },
      { sym: '∮ A · dA', name: 'closed surface integral', inn: 'field and a surface', out: 'number',
        note: 'net amount leaking out' },
      { sym: '⟨ f ⟩', name: 'time average', inn: 'function of time', out: 'number',
        note: 'what a slow detector reads' },
      { sym: 'z*', name: 'complex conjugate', inn: 'complex number', out: 'complex number',
        note: 'reflect across the real axis' },
      { sym: '| z |²', name: 'modulus squared', inn: 'complex number', out: 'real number',
        note: 'length squared; the phase is destroyed' }
    ];

    var W = 1120, rowH = 42, top = 84;
    var H = top + rows.length * rowH + 56;
    var svg = S.root(W, H,
      'A table of every operator used in Lecture 1, showing what kind of object each one ' +
      'takes as input and what kind it returns.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var xSym = 40, xName = 190, xIn = 400, xArrow = 560, xOut = 620, xNote = 790;

    var head = S.g({});
    svg.appendChild(head);
    [[xSym, 'symbol'], [xName, 'name'], [xIn, 'takes'], [xOut, 'gives back'], [xNote, 'read it as']]
      .forEach(function (c) {
        head.appendChild(S.text(c[0], top - 26, c[1], 's-lbl', 'start'));
      });
    head.appendChild(S.line(xSym, top - 14, W - 30, top - 14, 's-axis'));

    /* Scalars amber, vectors cyan, plain numbers white: the colour is the type. */
    function typeClass(kind) {
      if (/vector/.test(kind) && !/two vectors/.test(kind)) return 's-lbl-w';
      if (/two vectors/.test(kind)) return 's-lbl-w';
      if (/scalar|complex/.test(kind)) return 's-lbl-q';
      return 's-lbl-b';
    }

    var built = rows.map(function (r, i) {
      var y = top + i * rowH + 20;
      var g = S.g({});
      svg.appendChild(g);
      var sym = S.text(xSym, y, r.sym, 's-lbl-b', 'start');
      sym.setAttribute('font-size', '15');
      g.appendChild(sym);
      g.appendChild(S.text(xName, y, r.name, 's-lbl', 'start'));
      g.appendChild(S.text(xIn, y, r.inn, typeClass(r.inn), 'start'));
      var a = S.arrow(svg, xArrow, y - 4, xArrow + 42, y - 4, 'm');
      a.setAttribute('stroke-opacity', '0.6');
      g.appendChild(a);
      g.appendChild(S.text(xOut, y, r.out, typeClass(r.out), 'start'));
      g.appendChild(S.text(xNote, y, r.note, 's-lbl', 'start'));
      g.appendChild(S.line(xSym, y + 13, W - 30, y + 13, 's-grid'));
      return g;
    });

    var key = S.g({});
    svg.appendChild(key);
    var ky = H - 22;
    key.appendChild(S.text(xSym, ky, 'colour is the type:', 's-lbl', 'start'));
    key.appendChild(S.text(xSym + 150, ky, 'scalar', 's-lbl-q', 'start'));
    key.appendChild(S.text(xSym + 215, ky, 'vector', 's-lbl-w', 'start'));
    key.appendChild(S.text(xSym + 282, ky, 'plain number', 's-lbl-b', 'start'));
    key.appendChild(S.text(W - 30, ky,
      'get the types right and half the algebra checks itself', 's-lbl', 'end'));

    return function (p) {
      S.op(head, M.beat(p, 0.01, 0.1));
      built.forEach(function (g, i) { S.op(g, M.beat(p, 0.05 + i * 0.045, 0.18 + i * 0.045)); });
      S.op(key, M.beat(p, 0.72, 0.9));
    };
  });
})(window.A = window.A || {});
