/**
 * Rolagem suave (Lenis) sincronizada com as animações de rolagem (GSAP ScrollTrigger).
 * Desligada quando o sistema pede movimento reduzido.
 */
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Página aberta dentro de outra (pré-visualizações, incorporações): a rolagem suave trava a roda do mouse. */
const isFramed = () => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

export function startSmoothScroll(): () => void {
  if (lenis || prefersReducedMotion() || isFramed()) return () => undefined;
  lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95 });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(tick);
    lenis?.destroy();
    lenis = null;
  };
}

/** Rola até uma seção, descontando a barra fixa do topo. */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = -(document.querySelector('.site-nav')?.getBoundingClientRect().height ?? 0);
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.4 });
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

export { gsap, ScrollTrigger };
