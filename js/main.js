// Tavlo — reveal ved scroll + scroll-zoom i "Saadan virker det".
// Ingen afhaengigheder. Alt nedgraderer til en fuldt brugbar side uden JS.

// Reveal: fade elementer ind naar de rammer viewporten.
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }
}, { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// Scroll-zoom: bind --p (0..1) til hvor langt man er scrollet gennem sporet.
function zoomProgress(trackTop, span) {
  return span > 0 ? Math.min(1, Math.max(0, -trackTop / span)) : 0;
}

const stage = document.querySelector('[data-zoom]');
const track = document.querySelector('[data-zoom-track]');
if (stage && track && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('zoom-on');
  let ticking = false;
  const update = () => {
    ticking = false;
    const r = track.getBoundingClientRect();
    stage.style.setProperty('--p', zoomProgress(r.top, r.height - window.innerHeight).toFixed(4));
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  addEventListener('resize', update);
  update();
}

// Selvtjek: aabn siden med #selftest i URL'en.
if (location.hash === '#selftest') {
  console.assert(zoomProgress(0, 100) === 0, 'start = 0');
  console.assert(zoomProgress(-100, 100) === 1, 'slut = 1');
  console.assert(zoomProgress(-50, 100) === 0.5, 'midt = 0.5');
  console.assert(zoomProgress(200, 100) === 0, 'over sporet = 0');
  console.assert(zoomProgress(-10, 0) === 0, 'intet spor = 0');
  console.log('zoomProgress ok');
}
