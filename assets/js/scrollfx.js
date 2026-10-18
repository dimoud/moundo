/* The Inward Lab — motion tied to scrolling (see css/scroll.css for the states).
   One passive scroll listener, one requestAnimationFrame per frame, only for elements that are on screen
   (IntersectionObserver). Each frame: all measurements first, then all writes (no forced layout).
   Writes are class toggles on changed elements only, plus one transform for the travelling phrase. */
(function () {
  'use strict';
  /* statement lines: one row each, as large as the widest line allows (max 92px). Runs with any motion setting. */
  (function fit() {
    var z = document.querySelector('.big.zip'); if (!z) return;
    function go() {
      var box = z.parentNode.clientWidth - parseFloat(getComputedStyle(z.parentNode).paddingLeft) * 2;
      z.style.fontSize = '100px'; var w = 0;
      [].forEach.call(z.querySelectorAll('.zl'), function (l) {
        var r = document.createRange(); r.selectNodeContents(l);
        w = Math.max(w, r.getBoundingClientRect().width + Math.abs(parseFloat(getComputedStyle(l).left) || 0) * 2);
      });
      z.style.fontSize = Math.max(18, Math.min(92, Math.floor(100 * box / w))) + 'px';
    }
    go(); if (document.fonts) document.fonts.ready.then(go);
    var t; addEventListener('resize', function () { clearTimeout(t); t = setTimeout(go, 120); }, { passive: true });
  })();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  var vh = window.innerHeight, items = [], active = new Set(), queued = false;
  var mobile = matchMedia('(max-width: 768px)').matches;

  function prog(r, a, b) { var p = (vh * a - r.top) / (vh * (a - b)); return p < 0 ? 0 : p > 1 ? 1 : p; }
  function ease(p) { return 1 - Math.pow(1 - p, 3); }

  /* split text nodes into spans, keeping inner markup (e.g. <em>, <br>) and the accessible name */
  function split(el, unit, cls) {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    var out = [];
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = unit === 'w' ? n.textContent.split(/(\s+)/) : Array.from(n.textContent), f = document.createDocumentFragment();
          parts.forEach(function (t) {
            if (!t) return;
            if (unit === 'w' && /^\s+$/.test(t)) { f.appendChild(document.createTextNode(t)); return; }
            var s = document.createElement('span'); s.className = cls; s.textContent = t; s.setAttribute('aria-hidden', 'true');
            f.appendChild(s); out.push(s);
          });
          node.replaceChild(f, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
    return out;
  }

  var make = {
    'em-from-right': function (el) {
      var em = el.querySelector('em'); if (!em) return null;
      el.classList.add('sfx-em');
      var last = -1;
      return { el: el, a: .95, b: .28, set: function (p) {
        var x = Math.round((1 - p * (2 - p)) * (mobile ? 0.55 : 0.6) * window.innerWidth);
        if (x !== last) { em.style.transform = 'translate3d(' + x + 'px,0,0)'; last = x; }
      } };
    },
    /* statement: each line slides in from alternate sides (left, right, left…) and locks to the centre
       like the teeth of a zipper; line i starts a little after line i-1. Scrolling back opens it again. */
    zip: function (el) {
      var ls = [].slice.call(el.querySelectorAll('.zl')); if (!ls.length) return null;
      el.classList.add('sfx-zip');
      var n = ls.length, lag = .6 / n, span = 1 - lag * (n - 1), last = [];
      return { el: el, a: 1.05, b: mobile ? .12 : .16, set: function (p) {
        var w = window.innerWidth * (mobile ? .9 : .6);
        for (var i = 0; i < n; i++) {
          var q = (p - i * lag) / span; q = q < 0 ? 0 : q > 1 ? 1 : q;
          var x = Math.round((i % 2 ? 1 : -1) * (1 - ease(q)) * w), o = Math.round((.15 + .85 * q) * 100) / 100;
          var key = x + '|' + o; if (key === last[i]) continue; last[i] = key;
          ls[i].style.transform = 'translate3d(' + x + 'px,0,0)'; ls[i].style.opacity = o;
        }
      } };
    },
    words: function (el) {
      var ws = split(el, 'w', 'w'); el.classList.add('sfx-words'); var n = -1;
      return { el: el, a: .88, b: .38, set: function (p) {
        var k = Math.round(p * ws.length); if (k === n) return;
        for (var i = 0; i < ws.length; i++) ws[i].classList.toggle('on', i < k); n = k;
      } };
    },
    type: function (el) {
      var cs = split(el, 'c', 'c'); el.classList.add('sfx-type'); var n = -1;
      return { el: el, a: .92, b: .5, set: function (p) {
        var k = Math.round(p * cs.length); if (k === n) return;
        var lo = Math.min(k, n < 0 ? 0 : n), hi = Math.max(k, n < 0 ? cs.length : n);
        for (var i = lo; i < hi; i++) cs[i].classList.toggle('on', i < k);
        if (n > 0 && cs[n - 1]) cs[n - 1].classList.remove('caret');
        if (k > 0) cs[k - 1].classList.add('caret');
        el.classList.toggle('done', k === cs.length); n = k;
      } };
    },
    method: function (el) {
      var sec = el.closest('.method'), fill = sec && sec.querySelector('.method-fill'), steps = [].slice.call(el.querySelectorAll('.step'));
      if (!fill || !steps.length) return null;
      el.classList.add('sfx-method'); fill.classList.add('sfx-fill');
      var lastF = -1, lastK = -1;
      return { el: el, a: .9, b: mobile ? .15 : .35, set: function (p) {
        var f = Math.round(p * 1000) / 1000;
        if (f !== lastF) { fill.style.transform = 'scaleX(' + f + ')'; lastF = f; }
        var k = Math.min(steps.length, Math.floor(p * steps.length + .5));
        if (k === lastK) return;
        steps.forEach(function (s, i) { s.classList.toggle('lit', i < k); s.classList.toggle('now', i === k - 1 && k < steps.length); });
        lastK = k;
      } };
    }
  };

  [].slice.call(document.querySelectorAll('[data-sfx]')).forEach(function (el) {
    var f = make[el.getAttribute('data-sfx')], it = f && f(el);
    if (it) { items.push(it); it.set(0); }
  });
  if (!items.length) return;

  function frame() {
    queued = false;
    var rs = [];
    active.forEach(function (it) { rs.push([it, it.el.getBoundingClientRect()]); });   // reads
    rs.forEach(function (x) { x[0].set(prog(x[1], x[0].a, x[0].b)); });                // writes
  }
  function req() { if (!queued) { queued = true; requestAnimationFrame(frame); } }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { var it = items.find(function (i) { return i.el === e.target; });
      if (!it) return;
      if (e.isIntersecting) active.add(it); else { it.set(e.boundingClientRect.top < 0 ? 1 : 0); active.delete(it); } });
    req();
  }, { rootMargin: '10% 0px 10% 0px' });
  items.forEach(function (it) { io.observe(it.el); });
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', function () { vh = window.innerHeight; req(); }, { passive: true });
})();
