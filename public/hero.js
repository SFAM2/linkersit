import * as THREE from './assets/vendor/three.module.min.js';

const host = document.querySelector('#link-sculpture');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
if (host) {
  try {
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.append(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, .1, 40);
    camera.position.set(0, 0, 9.3);

    // Local studio lighting: no external textures or image requests.
    const studio = document.createElement('canvas');
    studio.width = 1024; studio.height = 512;
    const ctx = studio.getContext('2d');
    ctx.fillStyle = '#242032'; ctx.fillRect(0, 0, 1024, 512);
    const wash = ctx.createLinearGradient(0, 0, 0, 512);
    wash.addColorStop(0, '#afa1db'); wash.addColorStop(.5, '#262035'); wash.addColorStop(1, '#090713');
    ctx.fillStyle = wash; ctx.fillRect(0, 0, 1024, 512);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(120, 80, 115, 280); ctx.fillRect(680, 100, 180, 160);
    ctx.fillStyle = '#8254ff'; ctx.fillRect(400, 150, 90, 280);
    const texture = new THREE.CanvasTexture(studio);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromEquirectangular(texture);
    scene.environment = environment.texture;
    texture.dispose(); pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xeee7ff, 0x171029, 2));
    const key = new THREE.DirectionalLight(0xffffff, 4); key.position.set(-3, 5, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0x8863ff, 5); rim.position.set(4, -1, -2); scene.add(rim);

    const sculpture = new THREE.Group(); scene.add(sculpture);
    const shape = new THREE.TorusGeometry(1.06, .29, 32, 128);
    const purple = new THREE.MeshPhysicalMaterial({ color: 0x6b36e8, metalness: .72, roughness: .2, clearcoat: 1, clearcoatRoughness: .13 });
    const silver = new THREE.MeshPhysicalMaterial({ color: 0xe5dbff, metalness: .88, roughness: .22, clearcoat: 1, clearcoatRoughness: .15 });
    const first = new THREE.Mesh(shape, purple); first.position.x = -.67; first.scale.y = 1.24;
    const second = new THREE.Mesh(shape, silver); second.position.x = .67; second.rotation.x = Math.PI / 2; second.scale.y = 1.24;
    sculpture.add(first, second);
    sculpture.rotation.set(.36, -.32, -.55);
    const target = { x: 0, y: 0 };
    let visible = true, frame = 0, previous = 0, elapsed = 0;
    const paused = () => document.documentElement.classList.contains('motion-paused');
    const animate = () => visible && !document.hidden && !reduced.matches && !paused();
    const render = () => renderer.render(scene, camera);
    function loop(timestamp) {
      frame = 0;
      const delta = previous ? Math.min((timestamp - previous) / 1000, .05) : 0;
      previous = timestamp; elapsed += delta;
      sculpture.rotation.x = .36 + Math.sin(elapsed * .3) * .12 + target.y;
      sculpture.rotation.y = -.32 + Math.sin(elapsed * .23) * .22 + target.x;
      sculpture.rotation.z = -.55 + Math.sin(elapsed * .2) * .045;
      sculpture.position.y = Math.sin(elapsed * .7) * .085;
      render();
      if (animate()) frame = requestAnimationFrame(loop);
    }
    function resume() {
      if (!animate()) { cancelAnimationFrame(frame); frame = 0; previous = 0; render(); }
      else if (!frame) frame = requestAnimationFrame(loop);
    }
    function resize() {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.position.z = camera.aspect < 1 ? 10 : 9.3;
      camera.updateProjectionMatrix(); render();
    }
    new ResizeObserver(resize).observe(host);
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; resume(); }).observe(host);
    new MutationObserver(resume).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('visibilitychange', resume);
    reduced.addEventListener('change', () => { target.x = target.y = 0; resume(); });
    host.addEventListener('pointermove', event => {
      if (!animate() || event.pointerType !== 'mouse') return;
      const bounds = host.getBoundingClientRect();
      const next = { x: ((event.clientX - bounds.left) / bounds.width - .5) * .5, y: ((event.clientY - bounds.top) / bounds.height - .5) * .3 };
      if (window.gsap) gsap.to(target, { ...next, duration: 1.1, overwrite: true, ease: 'power2.out' });
      else Object.assign(target, next);
    });
    host.addEventListener('pointerleave', () => {
      if (window.gsap && !reduced.matches) gsap.to(target, { x: 0, y: 0, duration: 1.3, overwrite: true });
      else target.x = target.y = 0;
    });
    renderer.domElement.addEventListener('webglcontextlost', event => {
      event.preventDefault(); visible = false; cancelAnimationFrame(frame); host.classList.remove('is-rendered'); host.classList.add('is-fallback');
    });
    renderer.domElement.addEventListener('webglcontextrestored', () => { visible = true; resize(); host.classList.remove('is-fallback'); host.classList.add('is-rendered'); resume(); });
    if (window.gsap && !reduced.matches) sculpture.scale.setScalar(.82);
    resize(); render(); host.classList.remove('is-fallback'); host.classList.add('is-rendered'); resume();
    if (window.gsap && !reduced.matches) {
      gsap.to(sculpture.scale, { x: 1, y: 1, z: 1, duration: 1.8, ease: 'power3.out' });
      gsap.from('.hero-art .sculpture-tag', { y: 16, opacity: 0, stagger: .15, duration: .9, delay: .3, ease: 'power2.out' });
    }
  } catch {
    // Show fallback only after a rendering failure, never during normal loading.
    host.classList.remove('is-rendered');
    host.classList.add('is-fallback');
  }
}
