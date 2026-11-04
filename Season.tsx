import { Fragment, useLayoutEffect, useRef, type CSSProperties } from 'react';
import type { CalendarEvent, ISODate } from '../domain/types';
import { MONTH_NAMES, diffDays, durationDays, formatRange, monthOf, pluralDays, weekdayLong } from '../domain/calendar';
import { mediaFor } from '../data/media';
import { FEATURES, SITE } from '../config';
import { Photo } from './Photo';
import { PhotoBand } from './PhotoBand';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../motion/smooth';

interface Props {
  events: CalendarEvent[];
  today: ISODate;
  onSelect: (id: string) => void;
  onOpenMonth: (m: number) => void;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const short = (iso: string) => weekdayLong(iso).replace('-feira', '');

function countdown(ev: CalendarEvent, today: ISODate) {
  if (today > ev.end) return 'Realizado';
  if (today >= ev.start) return 'Acontecendo agora';
  const n = diffDays(today, ev.start);
  return n === 1 ? 'Começa amanhã' : `Faltam ${n} dias`;
}

/**
 * Eventos do ano: no computador, os eventos passam na horizontal enquanto a
 * página rola; no celular, ficam empilhados e aparecem conforme a rolagem.
 */
export function Season({ events, today, onSelect, onOpenMonth }: Props) {
  const root = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!root.current || !track.current || !pin.current || prefersReducedMotion()) return;
    const mm = gsap.matchMedia();

    mm.add('(min-width: 900px)', () => {
      const t = track.current!;
      const distance = () => t.scrollWidth - window.innerWidth;
      const navH = () => document.querySelector('.site-nav')?.getBoundingClientRect().height ?? 0;
      const horizontal = gsap.to(t, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: pin.current,
          start: () => `top ${navH()}px`,
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (bar.current) bar.current.style.transform = `scaleX(${self.progress})`;
          },
        },
      });

      gsap.utils.toArray<HTMLElement>('.panel').forEach((panel) => {
        const img = panel.querySelector('.panel__frame');
        if (img) {
          gsap.fromTo(
            img,
            { xPercent: -9 },
            {
              xPercent: 9,
              ease: 'none',
              scrollTrigger: { trigger: panel, containerAnimation: horizontal, start: 'left right', end: 'right left', scrub: true },
            },
          );
        }
        gsap.from(panel.querySelectorAll('.panel__acronym .char'), {
          yPercent: 110,
          stagger: 0.04,
          ease: 'power3.out',
          scrollTrigger: { trigger: panel, containerAnimation: horizontal, start: 'left 85%', end: 'left 35%', scrub: 0.6 },
        });
        gsap.from(panel.querySelector('.panel__media'), {
          clipPath: 'inset(0 0 0 100%)',
          ease: 'power2.out',
          scrollTrigger: { trigger: panel, containerAnimation: horizontal, start: 'left 95%', end: 'left 30%', scrub: 0.6 },
        });
      });
      gsap.utils.toArray<HTMLElement>('.gap').forEach((gap) => {
        gsap.from(gap.querySelector('.gap__line'), {
          scaleX: 0,
          ease: 'none',
          scrollTrigger: { trigger: gap, containerAnimation: horizontal, start: 'left 90%', end: 'right 40%', scrub: true },
        });
      });
    });

    mm.add('(max-width: 899px)', () => {
      gsap.utils.toArray<HTMLElement>('.panel').forEach((panel) => {
        gsap.from(panel.querySelector('.panel__media'), {
          clipPath: 'inset(100% 0 0 0)',
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: panel, start: 'top 85%' },
        });
        gsap.from(panel.querySelectorAll('.panel__acronym .char'), {
          yPercent: 110,
          duration: 0.9,
          stagger: 0.04,
          ease: 'power3.out',
          scrollTrigger: { trigger: panel, start: 'top 70%' },
        });
      });
    });

    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    return () => mm.revert();
  }, [events]);

  return (
    <section ref={root} id="eventos" className="season" aria-labelledby="season-title">
      <div className="season__intro">
        <h2 id="season-title" className="season__title">
          Eventos de {SITE.year}
        </h2>
        <p className="season__lead">
          Os oito encontros do ano, na ordem do calendário. As fotos são das edições anteriores.
        </p>
      </div>

      <PhotoBand />

      <div ref={pin} className="season__pin">
        <div ref={track} className="season__track">
          {events.map((ev, i) => {
            const media = mediaFor(ev.id);
            const next = events[i + 1];
            const gap = next ? diffDays(ev.end, next.start) - 1 : null;
            return (
              <Fragment key={ev.id}>
                <article className="panel" style={{ '--ev': ev.color } as CSSProperties} aria-label={`${ev.acronym}, ${formatRange(ev)}`}>
                  <div className="panel__text">
                    <p className="panel__index">
                      <span className="panel__num">{String(i + 1).padStart(2, '0')}</span>
                      <span className="panel__month">{MONTH_NAMES[monthOf(ev.start)]}</span>
                    </p>
                    <h3 className={`panel__acronym${ev.acronym.length > 6 ? ' is-long' : ''}`} aria-label={ev.acronym}>
                      {ev.acronym.split(' ').map((w, wi) => (
                        <span key={wi} className="word" aria-hidden="true">
                          {Array.from(w).map((ch, ci) => (
                            <span key={ci} className="char">
                              {ch}
                            </span>
                          ))}
                        </span>
                      ))}
                    </h3>
                    <p className="panel__name">{ev.name}</p>
                    <dl className="panel__facts">
                      <div>
                        <dt>Data</dt>
                        <dd>{cap(formatRange(ev))}</dd>
                      </div>
                      <div>
                        <dt>Dias</dt>
                        <dd>
                          {ev.start === ev.end ? cap(weekdayLong(ev.start)) : `${cap(short(ev.start))} a ${short(ev.end)}`},{' '}
                          {pluralDays(durationDays(ev))}
                        </dd>
                      </div>
                      <div>
                        <dt>Contagem</dt>
                        <dd>{countdown(ev, today)}</dd>
                      </div>
                    </dl>
                    <div className="panel__actions">
                      <button type="button" className="btn-solid" onClick={() => onSelect(ev.id)}>
                        Ver detalhes
                      </button>
                      <button type="button" className="btn-line" onClick={() => onOpenMonth(monthOf(ev.start))}>
                        Ver no calendário
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="panel__media"
                    onClick={() => onSelect(ev.id)}
                    data-cursor="Ver detalhes"
                    aria-label={`Ver detalhes de ${ev.acronym}`}
                  >
                    <span className="panel__frame">
                      <span className="panel__fallback" aria-hidden="true">
                        <span>{ev.acronym}</span>
                      </span>
                      {media && <Photo eventId={ev.id} index={0} src={media.photos[0]} />}
                    </span>
                    {media && FEATURES.remotePhotos && <span className="panel__credit">{media.edition}</span>}
                  </button>
                </article>

                {next && gap !== null && (
                  <div className="gap" style={{ '--ev': next.color } as CSSProperties} aria-hidden="true">
                    <span className="gap__num">{gap}</span>
                    <span className="gap__label">
                      {gap === 1 ? 'dia' : 'dias'} até {next.acronym}
                    </span>
                    <span className="gap__line" />
                  </div>
                )}
              </Fragment>
            );
          })}
          <div className="season__end">
            <p>Todas as datas também estão no calendário completo e na agenda.</p>
            <a className="btn-solid" href="#calendario">
              Abrir o calendário
            </a>
          </div>
        </div>
        <span className="season__progress" aria-hidden="true">
          <span ref={bar} />
        </span>
      </div>
    </section>
  );
}
