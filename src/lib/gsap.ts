import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Check if user prefers reduced motion */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Scroll fade-in animation for a set of elements */
export function initScrollFadeIn(
  selector: string,
  triggerSelector?: string,
  options?: { stagger?: number; y?: number; duration?: number },
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
      start: 'top 80%',
      end: 'bottom 20%',
      toggleActions: 'play none none reverse',
    },
  });
}

/** Kill all GSAP animations and ScrollTriggers — for page transitions */
export function killAllAnimations() {
  ScrollTrigger.getAll().forEach((st) => st.kill());
  gsap.killTweensOf('*');
}

export { gsap, ScrollTrigger };
