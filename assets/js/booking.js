/* Booking REQUEST (not live availability). Collects focus, preferred days/time of day and contact
   details. Delivery: if data-endpoint on the form is set, it is POSTed there; otherwise a prepared
   email is opened (mailto:), so nothing is stored by this site. */
(function () {
  'use strict';
  var form = document.getElementById('bookForm');
  if (!form) return;
  var EMAIL = form.getAttribute('data-email') || '', ENDPOINT = form.getAttribute('data-endpoint') || '';
  var FOCUS = [
    ['Relationships & break-ups', 'Heartbreak, patterns, reconnecting'],
    ['Boundaries & self-worth', 'People-pleasing, burnout, saying no'],
    ['Life transitions', 'A career, move or new chapter'],
    ['Confidence & direction', 'Over-thinking, decisions, purpose'],
    ['Something else', 'I’ll explain on the call'],
    ['Not sure yet', 'That’s completely okay']
  ];
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  var TIMES = ['Morning (9–12)', 'Lunchtime (12–2)', 'Afternoon (2–5)', 'Evening (5–7)'];
  var TICK = '<svg viewBox="0 0 16 16" aria-hidden="true"><use href="#i-tick"/></svg>';

  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  document.getElementById('focusGrid').innerHTML = FOCUS.map(function (f, i) {
    return '<label class="opt"><input type="radio" name="focus" value="' + esc(f[0]) + '" id="focus-' + i + '"><span class="box"><span class="ot">' + esc(f[0]) + '<span class="tick">' + TICK + '</span></span><span class="od">' + esc(f[1]) + '</span></span></label>';
  }).join('');
  document.getElementById('dayRow').innerHTML = DAYS.map(function (d) {
    return '<label class="chip"><input type="checkbox" name="day" value="' + d + '"><span class="box">' + d + '</span></label>';
  }).join('');
  document.getElementById('timeRow').innerHTML = TIMES.map(function (t) {
    return '<label class="chip wide"><input type="checkbox" name="time" value="' + t + '"><span class="box">' + t + '</span></label>';
  }).join('');

  var panes = [].slice.call(form.querySelectorAll('.book-pane')), heads = [].slice.call(document.querySelectorAll('#bookSteps li'));
  var next = document.getElementById('bookNext'), back = document.getElementById('bookBack'), foot = document.getElementById('bookFoot'),
      status = document.getElementById('formStatus'), step = 0;
  var arrow = '<svg class="arr" aria-hidden="true"><use href="#i-arr"/></svg>';

  function vals(name) { return [].map.call(form.querySelectorAll('input[name="' + name + '"]:checked'), function (i) { return i.value; }); }
  function focusVal() { var r = form.querySelector('input[name="focus"]:checked'); return r ? r.value : ''; }
  function whenText() { var d = vals('day'), t = vals('time'); return d.length && t.length ? d.join(', ') + ' · ' + t.map(function (x) { return x.split(' (')[0]; }).join(', ') : '—'; }

  function canContinue() {
    if (step === 0) return !!focusVal();
    if (step === 1) return vals('day').length > 0 && vals('time').length > 0;
    return true;
  }
  function render(moveFocus) {
    panes.forEach(function (p, i) { p.hidden = i !== step; });
    heads.forEach(function (h, i) { h.classList.toggle('active', i === step); h.classList.toggle('done', i < step); });
    document.getElementById('sumFocus').textContent = focusVal() || '—';
    document.getElementById('sumWhen').textContent = whenText();
    foot.hidden = step === 3; back.hidden = step === 0;
    next.disabled = !canContinue();
    next.innerHTML = (step === 2 ? 'Send my request ' : 'Continue ') + arrow;
    status.textContent = '';
    if (moveFocus) { var l = panes[step].querySelector('legend, h3'); if (l) { l.setAttribute('tabindex', '-1'); l.focus({ preventScroll: true }); } }
  }
  form.addEventListener('change', function () { render(false); });

  function fieldErr(id, bad) { var f = document.getElementById(id).closest('.field'); f.classList.toggle('invalid', bad); document.getElementById(id).setAttribute('aria-invalid', bad ? 'true' : 'false'); return bad; }
  function validDetails() {
    var first = document.getElementById('f-first'), email = document.getElementById('f-email');
    var b1 = fieldErr('f-first', !first.value.trim()), b2 = fieldErr('f-email', !/^\S+@\S+\.\S+$/.test(email.value.trim()));
    if (b1) { first.focus(); return false; }
    if (b2) { email.focus(); return false; }
    return true;
  }
  function payload() {
    return { focus: focusVal(), days: vals('day'), times: vals('time'),
      first: form.first.value.trim(), last: form.last.value.trim(), email: form.email.value.trim(), note: form.note.value.trim(),
      page: location.href.split('#')[0] };
  }
  function mailto(p) {
    var body = 'Hello Alex,\n\nI’d like to book a free discovery call.\n\nFocus: ' + p.focus + '\nDays: ' + p.days.join(', ') + '\nTime of day: ' + p.times.join(', ') +
      '\n\nName: ' + p.first + ' ' + p.last + '\nEmail: ' + p.email + (p.note ? '\n\nNote: ' + p.note : '') + '\n';
    return 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Discovery call request: ' + p.focus) + '&body=' + encodeURIComponent(body);
  }
  function done(p, sent) {
    step = 3; render(true);
    var link = document.getElementById('doneMail');
    document.getElementById('doneTitle').textContent = sent ? 'Thank you, ' + p.first + '.' : 'Almost there, ' + p.first + '.';
    document.getElementById('doneText').textContent = sent
      ? 'Your request is with Alex. Expect an email at ' + p.email + ' within one working day to confirm a time.'
      : 'Your email app should have opened with the request ready to send. Press send there and Alex will confirm a time by email within one working day.';
    link.hidden = sent; if (!sent) link.href = mailto(p);
  }
  next.addEventListener('click', function () {
    if (!canContinue()) return;
    if (step < 2) { step++; render(true); return; }
    if (!validDetails()) return;
    var p = payload();
    if (ENDPOINT) {
      next.disabled = true; status.textContent = 'Sending…';
      fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(p) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); done(p, true); })
        .catch(function () { next.disabled = false; status.textContent = 'Sorry, that did not go through. Please email ' + EMAIL + ' directly.'; });
    } else { done(p, false); window.location.href = mailto(p); }
  });
  back.addEventListener('click', function () { if (step > 0) { step--; render(true); } });
  document.getElementById('bookAgain').addEventListener('click', function () { form.reset(); step = 0; render(true); });

  /* help cards pre-select their topic */
  document.addEventListener('click', function (e) {
    var c = e.target.closest('[data-focus]'); if (!c) return;
    var v = c.getAttribute('data-focus'), r = [].filter.call(form.querySelectorAll('input[name="focus"]'), function (i) { return i.value === v; })[0];
    if (r) { r.checked = true; step = 0; render(false); }
  });
  render(false);
})();
