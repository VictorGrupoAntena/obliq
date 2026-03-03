import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Check if user prefers reduced motion */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface FadeInOptions {
  stagger?: number;
  y?: number;
  duration?: number;
  start?: string;
}

/** Scroll fade-in animation for a set of elements */
export function initScrollFadeIn(
  selector: string,
  triggerSelector?: string,
  options?: FadeInOptions,
) {
  if (prefersReducedMotion()) return;

  const elements = document.querySelectorAll(selector);
  if (!elements.length) return;

  const trigger = triggerSelector
    ? document.querySelector(triggerSelector)
    : elements[0];

  gsap.from(elements, {
    opacity: 0,
    y: options?.y ?? 30,
    duration: options?.duration ?? 0.4,
    ease: 'power2.out',
    stagger: options?.stagger ?? 0.1,
    scrollTrigger: {
      trigger: trigger as Element,
      start: options?.start ?? 'top 85%',
      toggleActions: 'play none none none',
    },
  });
}

/** Batch init scroll fade-in for multiple selectors */
export function initScrollFadeInAll(selectors: Array<string | [string, string?, FadeInOptions?]>) {
  if (prefersReducedMotion()) return;
  for (const entry of selectors) {
    if (typeof entry === 'string') {
      initScrollFadeIn(entry);
    } else {
      initScrollFadeIn(entry[0], entry[1], entry[2]);
    }
  }
}

/** Text reveal animation — free alternative to SplitText using clip-path */
export function initTextReveal(selector: string) {
  if (prefersReducedMotion()) return;

  const elements = document.querySelectorAll(selector);
  if (!elements.length) return;

  elements.forEach((el) => {
    gsap.from(el, {
      clipPath: 'inset(100% 0% 0% 0%)',
      opacity: 0,
      y: 20,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 90%',
        toggleActions: 'play none none none',
      },
    });
  });
}

/** Kill all GSAP animations and ScrollTriggers — for page transitions */
export function killAllAnimations() {
  ScrollTrigger.getAll().forEach((st) => st.kill());
  gsap.killTweensOf('*');
}

export { gsap, ScrollTrigger };
