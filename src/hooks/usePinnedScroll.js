import { useLayoutEffect, useRef } from 'react';

// Pins `sectionRef` to the viewport while vertical scroll drives
// `trackRef` sideways, then releases into normal document flow once
// the track finishes travelling. `progressRef`/`counterRef` are
// optional DOM nodes updated directly (no re-renders) each frame.
// Bails out entirely under prefers-reduced-motion — CSS falls back
// to a plain scroll-snap row in that case.
export default function usePinnedScroll() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const progressRef = useRef(null);
  const counterRef = useRef(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const cards = Array.from(track.children);
    let maxTranslate = 0;
    let sectionHeight = 0;
    let inView = false;
    let ticking = false;
    let resizeTimer;

    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

    function update() {
      const rect = section.getBoundingClientRect();
      const scrollable = sectionHeight - window.innerHeight;
      const progress = scrollable > 0 ? clamp(-rect.top / scrollable, 0, 1) : 0;

      track.style.transform = `translate3d(${-progress * maxTranslate}px,0,0)`;

      if (progressRef.current) {
        progressRef.current.style.width = `${progress * 100}%`;
      }
      if (counterRef.current) {
        const active = clamp(Math.round(progress * (cards.length - 1)), 0, cards.length - 1);
        counterRef.current.textContent = String(active + 1).padStart(2, '0');
      }

      const viewportCenter = window.innerWidth / 2;
      cards.forEach((card) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        card.classList.toggle('is-active', Math.abs(cardCenter - viewportCenter) < cardRect.width * 0.65);
      });

      ticking = false;
    }

    function onScroll() {
      if (!inView || ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    function measure() {
      maxTranslate = Math.max(0, track.scrollWidth - window.innerWidth);
      sectionHeight = window.innerHeight + maxTranslate;
      section.style.height = `${sectionHeight}px`;
      update();
    }

    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measure, 150);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) update();
      },
      { threshold: 0 }
    );
    io.observe(section);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    measure();

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      clearTimeout(resizeTimer);
      section.style.height = '';
    };
  }, []);

  return { sectionRef, trackRef, progressRef, counterRef };
}
