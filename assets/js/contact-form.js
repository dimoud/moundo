/**
 * contact-form.js — φόρμα προς Google Apps Script                       — v2
 * ──────────────────────────────────────────────────────────────────────────
 *   1. Ανάπτυξη του Apps Script ως Web App (Execute as: Me, Access: Anyone).
 *   2. Η διεύθυνση /exec στο GOOGLE_SCRIPT_URL παρακάτω.
 *   3. Η φόρμα: id="clientContactForm", κρυφά _to και _key, κουμπί submit,
 *      <p id="formStatus" role="status"> για τα μηνύματα.
 *
 * Επιτυχία δηλώνεται ΜΟΝΟ όταν το Apps Script απαντήσει {"result":"success"}.
 * v2: έλεγχος πεδίων πριν την αποστολή, όριο χρόνου 15″, μηνύματα στη
 *     γλώσσα της στιγμής (όχι της φόρτωσης), συμβάν GA4 generate_lead.
 * ────────────────────────────────────────────────────────────────────────── */
(function () {
  var GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzeuZEO1dd_Lbgi49wTM8xCKan1Fpy7blBko6NYmJ78i6OVG8lBAaIJ4Gjs_sjbjsmb/exec';
  var TIMEOUT_MS = 60000;   // το Apps Script στέλνει δύο email (γραφείο + αντίγραφο)· στην πρώτη κλήση μπορεί να θέλει 15–30″

  var MSG = {
    el: { sending: 'Αποστολή…', success: 'Ευχαριστούμε. Το μήνυμά σας στάλθηκε και ένα αντίγραφο έρχεται στο email σας.',
          error: 'Κάτι πήγε στραβά. Δοκιμάστε ξανά ή γράψτε στο inwardlab@gmail.com.', network: 'Σφάλμα δικτύου. Ελέγξτε τη σύνδεσή σας.',
          timeout: 'Η αποστολή άργησε πολύ. Δοκιμάστε ξανά ή γράψτε στο inwardlab@gmail.com.', invalid: 'Συμπληρώστε τα σημειωμένα πεδία.',
          notConfigured: 'Η φόρμα δεν έχει ρυθμιστεί ακόμα.' },
    en: { sending: 'Sending…', success: 'Thank you. Your message was sent and a copy is on its way to your inbox.',
          error: 'Something went wrong. Please try again or email inwardlab@gmail.com.', network: 'Network error. Check your connection.',
          timeout: 'Sending took too long. Please try again or email inwardlab@gmail.com.', invalid: 'Please complete the highlighted fields.',
          notConfigured: 'The form is not configured yet.' },
    es: { sending: 'Enviando…', success: 'Gracias. Tu mensaje se ha enviado y recibirás una copia en tu correo.',
          error: 'Algo ha fallado. Inténtalo de nuevo o escribe a inwardlab@gmail.com.', network: 'Error de red. Comprueba tu conexión.',
          timeout: 'El envío ha tardado demasiado. Inténtalo de nuevo o escribe a inwardlab@gmail.com.', invalid: 'Completa los campos marcados.',
          notConfigured: 'El formulario aún no está configurado.' }
  };
  function T(k) { var l = (document.documentElement.lang || 'en').slice(0, 2); return (MSG[l] || MSG.en)[k]; }

  function setStatus(el, msg, type) {
    if (!el) return;
    el.textContent = msg;
    el.className = type === 'success' ? 'status-success' : 'status-error';
    el.style.display = 'block';
  }

  function init() {
    var form   = document.getElementById('clientContactForm');
    var status = document.getElementById('formStatus');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (GOOGLE_SCRIPT_URL.indexOf('YOUR_') === 0) { setStatus(status, T('notConfigured'), 'error'); return; }
      if (form.checkValidity && !form.checkValidity()) {
        setStatus(status, T('invalid'), 'error');
        if (form.reportValidity) form.reportValidity();
        return;
      }

      var btn = form.querySelector('[type="submit"]');
      var label = btn ? btn.textContent : '';
      if (btn) { btn.textContent = T('sending'); btn.disabled = true; }
      if (status) { status.textContent = ''; status.style.display = 'none'; }

      var ctrl  = window.AbortController ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS) : null;
      function done() { if (timer) clearTimeout(timer); if (btn) { btn.textContent = label; btn.disabled = false; } }

      var fd = new FormData(form);
      fd.append('_lang', (document.documentElement.lang || 'en').slice(0, 2) === 'el' ? 'el' : 'en');   // the Apps Script writes the visitor's copy in el or en; es visitors get en   // γλώσσα του αντιγράφου προς τον πελάτη
      var sel = form.querySelector('select[name="subject"]');   // το κείμενο της επιλογής, όχι ο κωδικός (value="4")
      if (sel && sel.selectedIndex > 0) fd.set('subject', sel.options[sel.selectedIndex].text.trim());
      fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: fd, signal: ctrl ? ctrl.signal : undefined })
        .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
        .then(function (json) {
          if (!(json && json.result === 'success')) throw new Error((json && json.error) || 'unexpected response');
          setStatus(status, T('success'), 'success');
          form.reset();
          if (window.ccEvent) ccEvent('generate_lead', { form_id: 'clientContactForm' });
          done();
        })
        .catch(function (err) {
          var kind = err && err.name === 'AbortError' ? 'timeout' : (err instanceof TypeError ? 'network' : 'error');
          setStatus(status, T(kind), 'error');
          done();
        });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
