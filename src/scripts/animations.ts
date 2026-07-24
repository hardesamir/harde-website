/**
 * Cinematic animation layer for hardesamir.com
 * Lenis smooth scroll + GSAP (ScrollTrigger, SplitText).
 * Everything motion-related is gated behind prefers-reduced-motion.
 * Astro View Transitions lifecycle: init on astro:page-load, teardown on astro:before-swap.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

let lenis: Lenis | null = null;
let mm: gsap.MatchMedia | null = null;
let cleanups: Array<() => void> = [];
let tickerFn: ((time: number) => void) | null = null;

const PRELOADER_KEY = 'hs-preloader-seen';

/* ---------------- smooth scroll ---------------- */

function initLenis() {
  lenis = new Lenis({ autoRaf: false, lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  tickerFn = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(tickerFn);
  gsap.ticker.lagSmoothing(0);

  // anchor links must go through Lenis, not native jumps
  document.querySelectorAll<HTMLAnchorElement>('a[href^="/#"], a[href^="#"]').forEach((a) => {
    const onClick = (e: MouseEvent) => {
      const hash = a.hash;
      if (!hash || a.pathname !== location.pathname) return;
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      lenis?.scrollTo(target as HTMLElement, { offset: -70 });
    };
    a.addEventListener('click', onClick);
    cleanups.push(() => a.removeEventListener('click', onClick));
  });
}

/* ---------------- preloader + hero intro ---------------- */

function playHeroIntro() {
  const name = document.querySelector('[data-hero-name]');
  if (!name) return;

  const split = SplitText.create(name, { type: 'chars,words', mask: 'chars' });
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

  tl.from(split.chars, {
    yPercent: 115,
    duration: 1.1,
    stagger: 0.028,
  })
    .from('[data-hero-slate]', { autoAlpha: 0, y: -14, duration: 0.7 }, '-=0.7')
    .from('[data-hero-sub] > *', { autoAlpha: 0, y: 28, duration: 0.8, stagger: 0.12 }, '-=0.5')
    .from('[data-hero-scroll]', { autoAlpha: 0, duration: 0.6 }, '-=0.4');
}

function initPreloader() {
  const preloader = document.querySelector<HTMLElement>('[data-preloader]');
  const isHome = !!document.querySelector('[data-hero]');

  if (!preloader || !isHome || sessionStorage.getItem(PRELOADER_KEY)) {
    preloader?.remove();
    if (isHome) playHeroIntro();
    return;
  }

  sessionStorage.setItem(PRELOADER_KEY, '1');
  preloader.classList.add('is-active');

  const count = preloader.querySelector('[data-preloader-count]');
  const counter = { value: 0 };

  const tl = gsap.timeline({
    onComplete: () => {
      preloader.remove();
      playHeroIntro();
    },
  });

  tl.from('[data-preloader-name]', { autoAlpha: 0, letterSpacing: '0.6em', duration: 0.9, ease: 'power3.out' })
    .from('.preloader-sub', { autoAlpha: 0, duration: 0.5 }, '-=0.4')
    .to(
      counter,
      {
        value: 100,
        duration: 1.1,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (count) count.textContent = String(Math.round(counter.value)).padStart(2, '0');
        },
      },
      '<'
    )
    .to(preloader, { clipPath: 'inset(0 0 100% 0)', duration: 0.8, ease: 'power4.inOut' }, '+=0.15');

  const skip = () => tl.progress(1);
  preloader.addEventListener('click', skip, { once: true });
}

/* ---------------- hero ken burns + parallax ---------------- */

function initHero() {
  const bg = document.querySelector('[data-hero-bg] img');
  const hero = document.querySelector('[data-hero]');
  if (!bg || !hero) return;

  gsap.to(bg, {
    scale: 1.09,
    duration: 20,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
  });

  gsap.to('[data-hero-bg]', {
    yPercent: 22,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
  });

  gsap.to('[data-hero] .hero-content', {
    yPercent: -8,
    autoAlpha: 0.25,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 25%', scrub: true },
  });
}

/* ---------------- shared reveal conventions ---------------- */

function initReveals() {
  // masked line-rise for big headings
  document.querySelectorAll('[data-split]').forEach((el) => {
    const split = SplitText.create(el, { type: 'lines', mask: 'lines' });
    gsap.from(split.lines, {
      yPercent: 110,
      duration: 1,
      ease: 'power4.out',
      stagger: 0.09,
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  document.querySelectorAll('[data-reveal="rise"], [data-reveal=""], [data-reveal="true"]').forEach((el) => {
    gsap.to(el, {
      autoAlpha: 1,
      y: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  document.querySelectorAll('[data-reveal="wipe"]').forEach((el) => {
    gsap.to(el, {
      clipPath: 'inset(0% 0 0 0)',
      duration: 1.15,
      ease: 'power4.inOut',
      scrollTrigger: { trigger: el, start: 'top 82%' },
    });
  });
}

/* ---------------- letterbox scale moments ---------------- */

function initLetterbox() {
  document.querySelectorAll('[data-letterbox]').forEach((box) => {
    const img = box.querySelector('[data-letterbox-img]');
    if (!img) return;
    gsap.fromTo(
      img,
      { scale: 1.15 },
      {
        scale: 1,
        ease: 'none',
        scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true },
      }
    );
  });
}

/* ---------------- horizontal film reel ---------------- */

function formatTimecode(progress: number) {
  const total = Math.round(progress * 84); // pretend the reel runs 1:24
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function initFilmReel(isDesktop: boolean) {
  const section = document.querySelector<HTMLElement>('[data-reel]');
  const viewport = document.querySelector<HTMLElement>('[data-reel-viewport]');
  const track = document.querySelector<HTMLElement>('[data-reel-track]');
  const bar = document.querySelector<HTMLElement>('[data-reel-progress]');
  const timecode = document.querySelector<HTMLElement>('[data-reel-timecode]');
  if (!section || !viewport || !track) return;

  const setProgress = (p: number) => {
    if (bar) bar.style.transform = `scaleX(${p})`;
    if (timecode) timecode.textContent = formatTimecode(p);
  };

  if (isDesktop) {
    // pinned cinematic scroll: page scroll drives the reel horizontally
    viewport.style.overflowX = 'visible';
    const distance = () => track.scrollWidth - viewport.clientWidth;

    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => setProgress(self.progress),
      },
    });
  } else {
    // native swipe with scroll-snap; progress bar mirrors scrollLeft
    const onScroll = () => {
      const max = viewport.scrollWidth - viewport.clientWidth;
      setProgress(max > 0 ? viewport.scrollLeft / max : 0);
    };
    viewport.addEventListener('scroll', onScroll, { passive: true });
    cleanups.push(() => viewport.removeEventListener('scroll', onScroll));
    onScroll();
  }
}

/* ---------------- gallery column parallax ---------------- */

function initGalleryParallax() {
  document.querySelectorAll<HTMLElement>('[data-gallery-col]').forEach((col) => {
    const speed = Number(col.dataset.speed ?? 0);
    if (!speed) return;
    gsap.to(col, {
      y: speed,
      ease: 'none',
      scrollTrigger: {
        trigger: '[data-gallery]',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  });
}

/* ---------------- custom cursor ---------------- */

function initCursor() {
  const dot = document.querySelector<HTMLElement>('.cursor-dot');
  const ring = document.querySelector<HTMLElement>('.cursor-ring');
  if (!dot || !ring || !window.matchMedia('(pointer: fine)').matches) return;

  const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power2.out' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power2.out' });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.32, ease: 'power2.out' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.32, ease: 'power2.out' });

  const onMove = (e: MouseEvent) => {
    dotX(e.clientX);
    dotY(e.clientY);
    ringX(e.clientX);
    ringY(e.clientY);
  };

  const onOver = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    ring.classList.toggle('is-view', !!target.closest('[data-cursor="view"]'));
  };

  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('mouseover', onOver, { passive: true });
  cleanups.push(() => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseover', onOver);
  });
}

/* ---------------- lifecycle ---------------- */

function init() {
  mm = gsap.matchMedia();

  mm.add(
    {
      motionOk: '(prefers-reduced-motion: no-preference)',
      desktop: '(min-width: 769px)',
    },
    (context) => {
      const { motionOk, desktop } = context.conditions as { motionOk: boolean; desktop: boolean };
      if (!motionOk) {
        // static experience: remove the preloader, show everything
        document.querySelector('[data-preloader]')?.remove();
        return;
      }

      initLenis();
      initPreloader();
      initHero();
      initReveals();
      initLetterbox();
      initFilmReel(desktop);
      initGalleryParallax();
      initCursor();

      // recalc pinned distances once webfonts/images settle layout
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    }
  );
}

function destroy() {
  cleanups.forEach((fn) => fn());
  cleanups = [];
  mm?.revert();
  mm = null;
  ScrollTrigger.getAll().forEach((st) => st.kill());
  if (tickerFn) gsap.ticker.remove(tickerFn);
  tickerFn = null;
  lenis?.destroy();
  lenis = null;
}

// astro:page-load fires on the initial load too when ClientRouter is active
document.addEventListener('astro:page-load', () => {
  destroy();
  init();
});
document.addEventListener('astro:before-swap', destroy);
