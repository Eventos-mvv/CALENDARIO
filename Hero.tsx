import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { CalendarEvent, ISODate } from '../domain/types';
import type { CalendarStats } from '../domain/stats';
import { formatRange, monthOf } from '../domain/calendar';
import { SITE } from '../config';
import type { FlipHandle } from '../three/flipCalendar';
import { gsap, prefersReducedMotion } from '../motion/smooth';

interface Props {
  events: CalendarEvent[];
  stats: CalendarStats;
  today: ISODate;
  onSelect: (id: string) => void;
}

export function Hero({ events, stats, today, onSelect }: Props) {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [dial, setDial] = useState<'loading' | 'on' | 'off'>('loading');

  // Calendário de mesa 3D (carregado à parte para não atrasar o restante da página)
  useEffect(() => {
    if (!canvas.current || !events.length) return;
    let handle: FlipHandle | null = null;
    let cancelled = false;
    const css = getComputedStyle(document.documentElement);
    const color = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    const startMonth = today.startsWith(String(SITE.year))
      ? monthOf(today)
      : stats.next
        ? monthOf(stats.next.event.start)
        : 0;
    const fontReady = Promise.race([
      document.fonts?.ready.catch(() => undefined),
      new Promise((r) => setTimeout(r, 1500)),
    ]);

    Promise.all([import('../three/flipCalendar'), fontReady])
      .then(([mod]) => {
        if (cancelled || !canvas.current) return;
        handle = mod.mountFlipCalendar(canvas.current, {
          year: SITE.year,
          events,
          startMonth,
          reducedMotion: prefersReducedMotion(),
          font: getComputedStyle(document.body).fontFamily,
          palette: {
            accent: color('--navy', '#7a1c30'),
            ink: color('--ink', '#1b1518'),
            muted: color('--muted', '#6b5f63'),
            board: color('--ink-deep', '#4d0f1e'),
          },
          organization: SITE.organization,
        });
        setDial(handle ? 'on' : 'off');
      })
      .catch(() => setDial('off'));

    const onScroll = () => {
      const el = root.current;
      if (!el || !handle) return;
      const r = el.getBoundingClientRect();
      handle.setScroll(Math.max(0, -r.top) / r.height);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelled = true;
      window.removeEventListener('scroll', onScroll);
      handle?.dispose();
    };
  }, [events, today, stats.next]);

  // Entrada dos algarismos e afastamento ao rolar
  useLayoutEffect(() => {
    if (prefersReducedMotion() || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.hero__digit > span', { yPercent: 100, duration: 0.65, ease: 'power4.out', stagger: 0.04 });
      gsap.from('.hero__reveal', { y: 18, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.05, delay: 0.2 });
      const spread = [-1.5, -0.5, 0.5, 1.5];
      gsap.utils.toArray<HTMLElement>('.hero__digit').forEach((el, i) => {
        gsap.to(el, {
          xPercent: spread[i] * 22,
          yPercent: -18,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
        });
      });
      gsap.to('.hero__foot', {
        y: -60,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: '30% top', end: '80% top', scrub: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const next = stats.next;

  return (
    <header ref={root} id="topo" className={`hero hero--${dial}`}>
      <div className="hero__bar">
        <p className="hero__wordmark">{SITE.organization}</p>
        <p className="hero__dept">{SITE.department}</p>
      </div>

      <div className="hero__year" aria-hidden="true">
        {String(SITE.year)
          .split('')
          .map((d, i) => (
            <span key={i} className="hero__digit">
              <span>{d}</span>
            </span>
          ))}
      </div>

      <div className="hero__stage">
        <canvas ref={canvas} className="hero__dial" aria-hidden="true" />
        <div className="hero__fallback" aria-hidden="true" />
      </div>

      <div className="hero__foot">
        <div className="hero__copy">
          <h1 className="hero__title hero__reveal">
            {SITE.title} <span className="sr-only">{SITE.year}</span>
          </h1>
          <p className="hero__subtitle hero__reveal">{SITE.subtitle}</p>
          <div className="hero__actions hero__reveal">
            <a className="btn-solid" href="#eventos">
              Ver os eventos
            </a>
            <a className="btn-line" href="#calendario">
              Abrir o calendário
            </a>
          </div>
        </div>
        {next && (
          <button
            type="button"
            className="hero__next hero__reveal"
            style={{ '--ev': next.event.color } as CSSProperties}
            onClick={() => onSelect(next.event.id)}
            data-cursor="Detalhes"
          >
            <span className="hero__next-label">{next.ongoing ? 'Acontecendo agora' : 'Próximo evento'}</span>
            <span className="hero__next-name">{next.event.acronym}</span>
            <span className="hero__next-meta">
              {formatRange(next.event)}
              {!next.ongoing && (
                <>
                  <span className="hero__next-sep" aria-hidden="true" />
                  em <strong>{next.daysUntil}</strong> {next.daysUntil === 1 ? 'dia' : 'dias'}
                </>
              )}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}
