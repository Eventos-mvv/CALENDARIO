import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import type { CalendarEvent } from '../domain/types';
import { MONTH_SHORT, monthOf } from '../domain/calendar';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../motion/smooth';

/** Faixa corrida com os eventos do ano; acelera e muda de sentido com a rolagem. */
export function Marquee({ events }: { events: CalendarEvent[] }) {
  const track = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = track.current;
    if (!el || prefersReducedMotion()) return;
    const tween = gsap.to(el, { xPercent: -50, ease: 'none', duration: 48, repeat: -1 });
    let dir = 1;
    const st = ScrollTrigger.create({
      onUpdate: (self) => {
        const v = self.getVelocity();
        if (self.direction !== dir) dir = self.direction;
        const speed = Math.min(6, 1 + Math.abs(v) / 400) * dir;
        gsap.to(tween, {
          timeScale: speed,
          duration: 0.3,
          overwrite: true,
          onComplete: () => {
            gsap.to(tween, { timeScale: dir, duration: 1.4, ease: 'power2.out', overwrite: true });
          },
        });
      },
    });
    return () => {
      st.kill();
      tween.kill();
    };
  }, [events]);

  const items = events.map((ev) => {
    const s = ev.start.slice(8);
    const e = ev.end.slice(8);
    const mo = MONTH_SHORT[monthOf(ev.start)].toLowerCase();
    return (
      <span key={ev.id} className="marquee__item" style={{ '--ev': ev.color } as CSSProperties}>
        <span className="marquee__acr">{ev.acronym}</span>
        <span className="marquee__date">
          {s === e ? s : `${s}–${e}`} {mo}
        </span>
        <i aria-hidden="true" />
      </span>
    );
  });

  return (
    <div className="marquee" aria-hidden="true">
      <div ref={track} className="marquee__track">
        <div className="marquee__set">{items}</div>
        <div className="marquee__set">{items}</div>
      </div>
    </div>
  );
}
