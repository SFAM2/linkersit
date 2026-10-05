if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('js-reveal');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
}
document.querySelectorAll('[data-service]').forEach(card => {
  card.addEventListener('click', () => {
    const selected = [...document.querySelectorAll('input[name="service"]')].find(input => input.value === card.dataset.service);
    if (selected) selected.checked = true;
  });
});

function openEmail(subject, body) {
  window.location.href = `mailto:contact@linkersit.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

document.querySelector('#updates-form').addEventListener('submit', event => {
  event.preventDefault();
  const email = new FormData(event.currentTarget).get('email');
  openEmail('Request for LinkersIT news and updates', `Hello LinkersIT,\n\nI would like to receive your news and updates at ${email}.\n\nThank you.`);
  document.querySelector('#updates-status').textContent = 'Send the request from your email app to ask for updates. If it did not open, email contact@linkersit.com.';
});


// Gentle perspective follows the pointer while the inner artwork floats independently.
const globe = document.querySelector('.about-art');
const globeTilt = globe.querySelector('.globe-tilt');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const heroArt = document.querySelector('.hero-art');
globe.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' || motionPreference.matches || document.documentElement.classList.contains('motion-paused')) return;
  const bounds = globe.getBoundingClientRect();
  globeTilt.style.setProperty('--tilt-x', `${(0.5 - (event.clientY - bounds.top) / bounds.height) * 10}deg`);
  globeTilt.style.setProperty('--tilt-y', `${((event.clientX - bounds.left) / bounds.width - 0.5) * 14}deg`);
});
function resetGlobeTilt() { globeTilt.style.removeProperty('--tilt-x'); globeTilt.style.removeProperty('--tilt-y'); }
globe.addEventListener('pointerleave', resetGlobeTilt);
motionPreference.addEventListener('change', resetGlobeTilt);

if ('IntersectionObserver' in window) {
  const motionObserver = new IntersectionObserver(entries => {
    for (const entry of entries) entry.target.classList.toggle('motion-off', !entry.isIntersecting);
  });
  [globe, heroArt, document.querySelector('.values-strip')].forEach(element => motionObserver.observe(element));
}
