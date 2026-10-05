'use client';

import { useEffect } from 'react';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src; script.onload = resolve; script.onerror = reject;
    document.body.append(script);
  });
}

export default function SiteScripts() {
  useEffect(() => {
    // Standard anchors intentionally use full navigations, preserving the original
    // page lifecycle. The promise also prevents duplicate setup in React Strict Mode.
    window.__linkersitBoot ??= (async () => {
      await loadScript('/site.js');
      if (!document.querySelector('#link-sculpture')) return;
      await Promise.all([loadScript('/app.js'), loadScript('/contact.js')]);
      try {
        await loadScript('/assets/vendor/gsap.min.js');
        await import(/* webpackIgnore: true */ '/hero.js');
      } catch { document.querySelector('#link-sculpture')?.classList.add('is-fallback'); }
    })().catch(() => document.querySelector('#link-sculpture')?.classList.add('is-fallback'));
  }, []);
  return null;
}
