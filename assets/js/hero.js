/* Hero signature: "Movement" is a mass on a spring.
   Entry: trajectory computed once from the closed-form solution (zeta 0.5, settle 0.7 s) and played
   with the Web Animations API (compositor, no rAF on load). Afterwards: stillness, until the visitor
   drags the word; on release it returns with the pointer's own velocity (Elatirio). */
(function () {
  'use strict';
  var hero = document.getElementById('top'), w = document.getElementById('moveWord');
  if (!hero || !w) return;
  var ZETA = .5, TS = .7, DELAY = 680, LIMIT = 72;
  var entered = false;

  function entry() {
    hero.classList.add('hero-in');
    if (!w.animate || window.Elatirio.reduced()) { entered = true; return; }
    var k = matchMedia('(max-width: 768px), (hover: none)').matches ? .78 : 1, x0 = -Math.min(80, hero.clientWidth * .12), wn = Elatirio.wn(ZETA, TS), T = TS * 1.1, frames = [];
    for (var t = 0; t < T; t += .02) frames.push({ transform: 'translateX(' + Elatirio.analytic(ZETA, wn, x0, 0, t).toFixed(2) + 'px)', offset: t / T });
    frames.push({ transform: 'translateX(0px)', offset: 1 });
    w.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, delay: DELAY * k, fill: 'both', easing: 'ease-out' });
    var a = w.animate(frames, { duration: T * 1000, delay: DELAY * k, fill: 'both', easing: 'linear' });
    a.onfinish = function () { a.cancel(); entered = true; };
    a.oncancel = function () { entered = true; };
  }

  var spring = Elatirio.create({ zeta: ZETA, ts: TS, value: 0, precision: .05,
    onUpdate: function (x) { w.style.transform = 'translateX(' + x.toFixed(2) + 'px)'; } });
  var trk = Elatirio.tracker(), drag = false, sx = 0, bx = 0;
  function limited(v) { var a = Math.abs(v); return a <= LIMIT ? v : Math.sign(v) * (LIMIT + (a - LIMIT) * .35); }
  w.addEventListener('pointerdown', function (e) {
    if (!entered) return;
    drag = true; spring.stop(); sx = e.clientX; bx = spring.value;
    try { w.setPointerCapture(e.pointerId); } catch (_) {}
    w.classList.add('grabbing'); trk.reset(); trk.add(e.clientX, performance.now());
  });
  w.addEventListener('pointermove', function (e) {
    if (!drag) return;
    spring.jump(limited(bx + e.clientX - sx)); trk.add(e.clientX, performance.now());
  });
  function release() {
    if (!drag) return;
    drag = false; w.classList.remove('grabbing');
    spring.impulse(trk.velocity() * .5).set(0);
  }
  w.addEventListener('pointerup', release);
  w.addEventListener('pointercancel', release);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { requestAnimationFrame(entry); });
  else requestAnimationFrame(entry);
})();
