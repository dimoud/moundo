/* ═══════════════════════════════════════════════════════════════════════════
   xoro.js — μηχανή χορογραφίας (βιβλιοθήκη #32) · από expertease.eu/webdesign (wd-xoro.js) και moudiotis.gr (16/10/2026)
   Μεταφορά της μηχανής wd-xoro.js (expertease.eu/webdesign, δεξιότητα kinisi Ροή Β).
   Κάθε σκηνή (.wdx) ανοίγει ΜΙΑ φορά όταν η κορυφή της περάσει το 78 % της οθόνης· η κίνηση ζει στο xoro.css.
   Εδώ: ο διακόπτης των σκηνών, ο ΚΑΝΟΝΑΣ ΟΡΑΤΟΤΗΤΑΣ (ΜΗ-47: κάθε στοιχείο παίζει μόνο όταν το ίδιο φαίνεται,
   ό,τι προσπεράστηκε τελειώνει αθόρυβα, κρυμμένη καρτέλα = παύση), οι μετρητές (10+, 300+ …) και οι
   αριθμοί ομάδων (--j) για την κλιμάκωση. Η πρώτη οθόνη ΔΕΝ είναι σκηνή: έχει δική της χρονογραμμή σε CSS.
   Χωρίς JS: οι κλάσεις wdx-js / wdx-fail της <head> αφήνουν το τελικό καρέ.
═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('wdx-ok');
  var REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var scenes = [].slice.call(document.querySelectorAll('.wdx'));
  if (!scenes.length) return;

  /* ── μετρητές: <b data-count="300" data-suffix="+" data-delay="600">300+</b> ── */
  function count(el, elapsed) {
    var end = parseInt(el.getAttribute('data-count'), 10), suf = el.getAttribute('data-suffix') || '';
    var delay = Math.max(0, parseInt(el.getAttribute('data-delay') || '0', 10) - (elapsed || 0));
    var k = matchMedia('(max-width: 768px), (hover: none)').matches ? 0.78 : 1;
    var fin = function () { el.textContent = String(end) + suf; };
    if (REDUCED || !window.requestAnimationFrame) { fin(); return; }
    el.textContent = '0' + suf;
    var t0 = performance.now() + delay * k, D = 1100 * k, done = false;
    (function tick(now) {
      if (document.hidden) { requestAnimationFrame(tick); return; }
      var p = Math.max(0, Math.min(1, (now - t0) / D)), e = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(end * e)) + suf;
      if (p < 1) requestAnimationFrame(tick); else { done = true; fin(); }
    })(performance.now());
    setTimeout(function () { if (!done) fin(); }, delay * k + D + 800);
  }

  var GATE = false;
  function go(s) {
    if (s.classList.contains('wdx-go')) return;
    s._wx0 = performance.now();
    s.classList.add('wdx-go');
    if (GATE) (s._wxi || []).forEach(function (el) { if (el._wxv) fire(el); });
    else [].forEach.call(s.querySelectorAll('[data-count]'), function (el) { count(el, 0); });
  }

  /* «φαίνεται» = ζώνη 5 %–92 % του ύψους της οθόνης, ορατό τμήμα ≥ 35 % του ύψους του (ή ≥ 28 % της οθόνης) */
  function qualifies(r) {
    var vh = innerHeight, h = r.height;
    if (r.right < 0 || r.left > innerWidth) return false;
    // v2.20 (mundo 17/10): starts as the element comes into view (bottom zone 98 %, ≥ 26 % of it or 21 % of the screen),
    // so nothing "appears out of nowhere" on an already empty area; still inside the visibility rule (ΜΗ-47, KN11)
    if (h < 2) return r.top > vh * 0.03 && r.top < vh * 0.98;
    var vis = Math.min(r.bottom, vh * 0.98) - Math.max(r.top, vh * 0.03);
    return vis >= Math.min(h * 0.26, vh * 0.21);
  }
  function restsInView(r, vh) {
    if (r.right < 0 || r.left > innerWidth) return false;
    var vis = Math.min(r.bottom, vh) - Math.max(r.top, 0);
    return vis > 0 && vis >= Math.min(r.height * 0.3, vh * 0.2);
  }
  function anchorOf(el) { var p = el.parentElement; return p && p.classList.contains('wdm') ? p : el; }
  function anims(el) { return el.getAnimations ? el.getAnimations().filter(function (a) { return a.effect && a.effect.target === el; }) : []; }
  function fire(el) {
    if (el._wxf) return; el._wxf = 1;
    var s = el._wxs, elapsed = performance.now() - (s._wx0 || performance.now());
    el.classList.add('wdx-seen');
    if (el.hasAttribute('data-count')) count(el, elapsed);
    if (elapsed > 60) anims(el).forEach(function (a) { try { a.currentTime = Math.min(elapsed, (a.effect.getTiming().delay) || 0); } catch (e) {} });
  }
  function release(el) {
    if (el._wxf) return; el._wxf = 1;
    el.classList.add('wdx-seen');
    if (el.hasAttribute('data-count')) el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || '');
    anims(el).forEach(function (a) { try { a.finish(); } catch (e) {} });
  }

  /* αριθμοί ομάδων --j: κλιμάκωση μέσα στην ίδια ομάδα — οι ομάδες δηλώνονται με [data-xo-group] (ή γράψε εδώ τους επιλογείς του ιστότοπου) */
  [].forEach.call(document.querySelectorAll('.wdx [data-xo-group]'), function (ul) {
    [].forEach.call(ul.children, function (li, j) { li.style.setProperty('--j', j); });
  });
  [].forEach.call(document.querySelectorAll('.wdx .form-fields'), function (f) {
    [].forEach.call(f.querySelectorAll('.field'), function (el, j) { el.style.setProperty('--j', j); el.style.setProperty('--c0', j % 2 ? 'inset(0 0 0 100% round 4px)' : 'inset(0 100% 0 0 round 4px)'); });
  });

  if (REDUCED || !('IntersectionObserver' in window)) {
    if (!REDUCED) root.classList.add('wdx-fail');
    scenes.forEach(function (s) { s.classList.add('wdx-go'); });
    return;
  }

  /* ── διακόπτης ορατότητας ανά στοιχείο ── */
  GATE = true;
  root.classList.add('wdx-gate');
  var items = [], byAnchor = new Map();
  scenes.forEach(function (s) {
    s._wxi = [].slice.call(s.querySelectorAll('[data-v], [data-count]'));
    s._wxi.forEach(function (el) {
      el._wxs = s; items.push(el);
      var a = anchorOf(el); if (!byAnchor.has(a)) byAnchor.set(a, []);
      byAnchor.get(a).push(el);
    });
  });
  var vio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!qualifies(e.boundingClientRect)) return;
      (byAnchor.get(e.target) || []).forEach(function (el) { el._wxv = 1; if (el._wxs.classList.contains('wdx-go')) fire(el); });
    });
  }, { rootMargin: '-5% 0px -8% 0px', threshold: [0, 0.1, 0.2, 0.35, 0.5, 0.75, 1] });
  byAnchor.forEach(function (v, a) { vio.observe(a); });
  /* δίχτυ ασφαλείας ανά 400 ms (ο IO δεν βλέπει ό,τι κόβεται από γονέα με overflow) */
  setInterval(function () {
    if (document.hidden) return;
    var vh = innerHeight, end = (innerHeight + (window.pageYOffset || 0)) >= document.documentElement.scrollHeight - 2;
    items.forEach(function (el) {
      if (el._wxf || !el._wxs.classList.contains('wdx-go')) return;
      if (!el.getClientRects().length) { release(el); return; }
      var r = anchorOf(el).getBoundingClientRect();
      if (r.bottom < -40) release(el);
      else if (qualifies(r) || (end && r.bottom > 0 && r.top < vh)) { el._wxv = 1; fire(el); }
      else if ((r.right < 0 || r.left > innerWidth) && r.bottom > 0 && r.top < vh) release(el);
      else if (restsInView(r, vh)) { if (!el._wxd) el._wxd = 1; else { el._wxv = 1; fire(el); } }
      else el._wxd = 0;
    });
  }, 400);
  var bg = function () { root.classList.toggle('wdx-bg', document.hidden); };
  document.addEventListener('visibilitychange', bg); bg();
  var off = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle('wdx-off', !e.isIntersecting); });
  }, { rootMargin: '0px', threshold: 0 });
  scenes.forEach(function (n) { off.observe(n); });

  /* ── διακόπτης σκηνών ── */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); go(e.target); } });
  }, { rootMargin: '0px 0px -22% 0px', threshold: 0 });
  scenes.forEach(function (s) { io.observe(s); });
})();
