const form = document.querySelector('#contact-form');
if (form) {
  const status = document.querySelector('#form-status');
  const submit = form.querySelector('[type="submit"]');
  const enable = document.querySelector('#enable-captcha');
  let config, widget, captchaLoad;
  let submissionId = crypto.randomUUID();
  const say = text => { status.textContent = text; };
  const unavailable = 'The online form is not available yet. Please email contact@linkersit.com directly.';
  async function loadCaptcha() {
    if (window.grecaptcha?.render) return;
    if (!captchaLoad) captchaLoad = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timeout = setTimeout(() => { script.remove(); captchaLoad = null; reject(new Error('Verification took too long to load. Please try again.')); }, 15000);
      window.linkersitCaptchaReady = () => { clearTimeout(timeout); resolve(); };
      script.src = 'https://www.google.com/recaptcha/api.js?onload=linkersitCaptchaReady&render=explicit';
      script.async = true; script.defer = true;
      script.onerror = () => { clearTimeout(timeout); script.remove(); captchaLoad = null; reject(new Error('Verification could not load. Please check your connection or email us directly.')); };
      document.head.append(script);
    });
    await captchaLoad;
  }
  enable.addEventListener('click', async () => {
    enable.disabled = true; say('Loading verification…');
    try {
      const response = await fetch('/api/contact', { credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(12000) });
      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error(unavailable);
      config = await response.json();
      if (!response.ok || !config.ok || !config.siteKey || !config.csrf) throw new Error(config.message || unavailable);
      await loadCaptcha();
      widget = grecaptcha.render('captcha-widget', { sitekey: config.siteKey, theme: 'dark', size: 'compact', callback: () => say('Verification complete. You can send your enquiry.'), 'expired-callback': () => say('Verification expired. Please complete the checkbox again.'), 'error-callback': () => say('Verification failed to load. Please retry or email us directly.') });
      enable.hidden = true; say('Complete the verification, then send your enquiry.');
    } catch (error) { say(error.name === 'TimeoutError' ? 'The connection timed out. Please try again.' : error.message); enable.disabled = false; }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const token = widget !== undefined ? window.grecaptcha?.getResponse(widget) : '';
    if (!config || !token) { say('Please enable and complete the spam verification first.'); if (!enable.hidden) enable.focus(); return; }
    const values = Object.fromEntries(new FormData(form));
    submit.disabled = true; form.setAttribute('aria-busy', 'true'); say('Sending your enquiry…');
    try {
      const response = await fetch('/api/contact', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, csrf: config.csrf, captcha: token, submissionId }), signal: AbortSignal.timeout(20000) });
      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error(unavailable);
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || 'Your message could not be sent. Please try again.');
      form.reset(); submissionId = crypto.randomUUID(); say(result.message);
    } catch (error) { say(error.name === 'TimeoutError' ? 'The request timed out. Delivery is unconfirmed; please contact us before resending.' : error.message); }
    finally { submit.disabled = false; form.removeAttribute('aria-busy'); grecaptcha.reset(widget); }
  });
}
