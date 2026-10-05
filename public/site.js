document.documentElement.classList.add('js-enabled');
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#navigation');
function closeNavigation() { menu?.setAttribute('aria-expanded', 'false'); menu?.setAttribute('aria-label', 'Open menu'); nav?.classList.remove('open'); }
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); nav.classList.toggle('open', open);
});
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNavigation));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav?.classList.contains('open')) { closeNavigation(); menu.focus(); } });
document.addEventListener('click', event => { if (!event.target.closest('.nav')) closeNavigation(); });
matchMedia('(min-width:761px)').addEventListener('change', closeNavigation);
document.querySelectorAll('#year').forEach(element => element.textContent = new Date().getFullYear());



// An informational notice, not an opt-in to trackers: none are installed.
const noticeKey = 'linkersit-cookie-notice-v1';
const banner = document.createElement('aside');
banner.className = 'cookie-notice'; banner.setAttribute('aria-label', 'Privacy and cookies'); banner.hidden = true;
banner.innerHTML = `<div><strong>A little clarity on cookies.</strong><p>No site analytics or advertising tools. Contact verification loads Google reCAPTCHA only when you choose to enable it.</p></div><div class="cookie-actions"><button type="button" class="cookie-details">Details</button><button type="button" class="cookie-dismiss">Got it</button></div>`;
document.body.append(banner);
try { banner.hidden = localStorage.getItem(noticeKey) === 'dismissed'; } catch { banner.hidden = false; }
banner.querySelector('.cookie-dismiss').addEventListener('click', () => { try { localStorage.setItem(noticeKey, 'dismissed'); } catch {} banner.hidden = true; });
const dialog = document.createElement('dialog');
dialog.className = 'cookie-dialog'; dialog.setAttribute('aria-labelledby', 'cookie-dialog-title');
dialog.innerHTML = `<button class="dialog-close" aria-label="Close cookie information" type="button">×</button><p class="section-label">Your privacy</p><h2 id="cookie-dialog-title">Simple by design.</h2><p>This site has no analytics or advertising tools. Google reCAPTCHA loads only when you enable contact-form verification and may use cookies or process device information.</p><div class="cookie-status-row"><span>Google reCAPTCHA</span><strong>On request</strong></div><div class="cookie-status-row"><span>Notice preference</span><strong>Local storage only</strong></div><p>We remember when you dismiss this notice. When you enable the contact form, a session cookie helps protect your submission. These preferences contain no message content.</p><p>Your hosting provider may process request information to deliver the site. See our <a href="/privacy">privacy notice</a> and <a href="/cookies">cookie information</a>.</p><div class="dialog-actions"><button type="button" class="reset-notice">Reset notice preference</button><button type="button" class="dialog-done button button-light">Done</button></div><p class="cookie-feedback" role="status"></p>`;
document.body.append(dialog);
let previousFocus;
function openCookieInfo() { previousFocus = document.activeElement; dialog.showModal(); }
banner.querySelector('.cookie-details').addEventListener('click', openCookieInfo);
document.querySelectorAll('[data-cookie-settings]').forEach(button => button.addEventListener('click', openCookieInfo));
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.querySelector('.dialog-done').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => previousFocus?.focus());
dialog.querySelector('.reset-notice').addEventListener('click', () => {
  try { localStorage.removeItem(noticeKey); } catch {}
  banner.hidden = false; dialog.querySelector('.cookie-feedback').textContent = 'The notice preference has been cleared from this browser.';
});
