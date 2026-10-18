/* Hero (18/10): two acts, then one quiet breath.
   Act 1 (CSS): portrait fades in · "Clarity isn't the goal." slides in left → right · 1 s of stillness ·
   "Movement" arrives as a mass on a spring (closed-form trajectory, zeta 0.5, settle 0.9 s, played with the
   Web Animations API on the compositor) · "is." settles.
   Act 2 (CSS): eyebrow → the line under the title → button → badge.
   Afterwards only the eyebrow breathes, every 6.47 s (2.47 s motion + 4.00 s rest, ratio φ).
   The visitor can drag "Movement"; on release it returns with the pointer's own velocity (Elatirio).
   Off screen, hidden tab or reduced motion = no breathing. */
(function () {
  'use strict';
  var hero = document.getElementById('top'), w = document.getElementById('moveWord');
  if (!hero || !w) return;
  var ZETA = .8, TS = 1.8, DELAY = 2700, LIMIT = 72;
  var entered = false;
  var k = matchMedia('(max-width: 768px), (hover: none)').matches ? .78 : 1;

  function entry() {
    hero.classList.add('hero-in');
    if (!w.animate || window.Elatirio.reduced()) { entered = true; return; }
    var x0 = -Math.min(90, hero.clientWidth * .12), wn = Elatirio.wn(ZETA, TS), T = TS * 1.1, frames = [];
    for (var t = 0; t < T; t += .02) frames.push({ transform: 'translateX(' + Elatirio.analytic(ZETA, wn, x0, 0, t).toFixed(2) + 'px)', offset: t / T });
    frames.push({ transform: 'translateX(0px)', offset: 1 });
    w.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: DELAY * k, fill: 'both', easing: 'ease-out' });
    var a = w.animate(frames, { duration: T * 1000, delay: DELAY * k, fill: 'both', easing: 'linear' });
    a.onfinish = function () { a.cancel(); entered = true; };
    a.oncancel = function () { entered = true; };
    setTimeout(startLife, 4900 * k);   // eyebrow has arrived (4000 + 900 ms)
  }

  var spring = Elatirio.create({ zeta: ZETA, ts: 1.2, value: 0, precision: .05,
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

  /* ---- the one living element: the eyebrow breathes ----
     Its rule draws in and out and the label dims and returns, together, over 2.47 s; then 4.00 s of rest. */
  var PHI = 1.618, ACTIVE = 2470, PERIOD = Math.round(ACTIVE * (1 + PHI)), lifeT = null, onScreen = true;
  var eye = hero.querySelector('.h-eye'), EASE = 'cubic-bezier(.45,0,.55,1)';
  function pulse() {
    if (!eye || !onScreen || document.hidden) return;
    eye.animate([{ opacity: 1 }, { opacity: .55 }, { opacity: 1 }], { duration: ACTIVE, easing: EASE });
    try {
      eye.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(.3)' }, { transform: 'scaleX(1)' }], { duration: ACTIVE, easing: EASE, pseudoElement: '::before' });
      eye.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(.3)' }, { transform: 'scaleX(1)' }], { duration: ACTIVE, easing: EASE, pseudoElement: '::after' });
    } catch (_) { /* older engines: no pseudo-element animation, the label still breathes */ }
  }
  function startLife() {
    if (lifeT || Elatirio.reduced()) return;
    lifeT = setTimeout(function () { pulse(); lifeT = setInterval(pulse, PERIOD); }, PERIOD - ACTIVE);
  }
  function stopAll() { if (eye && eye.getAnimations) eye.getAnimations({ subtree: true }).forEach(function (a) { if (!(a instanceof CSSAnimation)) a.cancel(); }); }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; if (!onScreen) stopAll(); }, { threshold: .3 }).observe(hero);
  document.addEventListener('visibilitychange', function () { if (document.hidden) stopAll(); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { requestAnimationFrame(entry); });
  else requestAnimationFrame(entry);
})();
