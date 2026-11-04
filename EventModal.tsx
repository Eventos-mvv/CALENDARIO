import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { CalendarEvent, ISODate } from '../domain/types';
import { diffDays, durationDays, formatLong, formatRange, monthOf, pluralDays, weekdayLong } from '../domain/calendar';
import { findProximities } from '../domain/stats';
import { eventTypeLabel } from '../data/eventTypes';
import { FEATURES, SITE } from '../config';
import { buildICS, downloadFile } from '../utils/ics';
import { Icon, type IconName } from './Icon';
import { Photo } from './Photo';
import { mediaFor } from '../data/media';

interface Props {
  event: CalendarEvent;
  allEvents: CalendarEvent[];
  today: ISODate;
  onClose: () => void;
  onSelect: (id: string) => void;
  onOpenMonth: (m: number) => void;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function countdown(ev: CalendarEvent, today: ISODate): string {
  if (today > ev.end) return 'Evento realizado';
  if (today >= ev.start) return 'Em andamento';
  const n = diffDays(today, ev.start);
  return n === 1 ? 'Começa amanhã' : `Faltam ${n} dias`;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function EventModal({ event: ev, allEvents, today, onClose, onSelect, onOpenMonth }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const [toast, setToast] = useState('');
  const [fallback, setFallback] = useState('');

  const idx = allEvents.findIndex((e) => e.id === ev.id);
  const prev = allEvents[idx - 1];
  const next = allEvents[idx + 1];
  const near = findProximities(allEvents, ev, SITE.proximityDays);

  // Foco inicial, Esc para fechar, Tab preso dentro do painel e foco devolvido ao sair.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && panel.current) {
        const items = panel.current.querySelectorAll<HTMLElement>('button, [href], textarea, input, select');
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
      previous?.focus?.();
    };
  }, [onClose]);

  const media = mediaFor(ev.id);
  const [shot, setShot] = useState(0);

  useEffect(() => {
    setToast('');
    setFallback('');
    setShot(0);
  }, [ev.id]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2600);
  };

  const summary = `${ev.acronym} — ${ev.name}\n${cap(formatRange(ev, true))} (${pluralDays(durationDays(ev))})\n${SITE.organization} · ${SITE.title} ${SITE.year}`;

  const copyLink = async () => {
    const url = `${window.location.href.split('#')[0]}#evento-${ev.id}`;
    if (await copyText(url)) flash('Link copiado');
    else setFallback(url);
  };
  const copySummary = async () => {
    if (await copyText(summary)) flash('Resumo copiado');
    else setFallback(summary);
  };

  const info: { icon: IconName; label: string; value?: string }[] = [
    { icon: 'pin', label: 'Local', value: ev.location },
    { icon: 'user', label: 'Responsável', value: ev.responsible },
    { icon: 'clock', label: 'Horários', value: ev.schedule },
    { icon: 'note', label: 'Descrição', value: ev.description },
    { icon: 'flag', label: 'Observações', value: ev.notes },
  ];

  return (
    <div className="overlay" data-lenis-prevent onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panel}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        style={{ '--ev': ev.color } as CSSProperties}
      >
        <div className="sheet__bar">
          <div className="sheet__nav">
            <button type="button" className="icon-btn" disabled={!prev} onClick={() => prev && onSelect(prev.id)} aria-label={prev ? `Evento anterior: ${prev.acronym}` : 'Sem evento anterior'}>
              <Icon name="chevronLeft" />
            </button>
            <span className="sheet__count">
              {idx + 1} de {allEvents.length}
            </span>
            <button type="button" className="icon-btn" disabled={!next} onClick={() => next && onSelect(next.id)} aria-label={next ? `Próximo evento: ${next.acronym}` : 'Sem próximo evento'}>
              <Icon name="chevronRight" />
            </button>
          </div>
          <button ref={closeBtn} type="button" className="icon-btn" onClick={onClose} aria-label="Fechar detalhes">
            <Icon name="close" />
          </button>
        </div>

        <div className="sheet__scroll">
          {media && FEATURES.remotePhotos && (
            <div className="sheet__media">
              <div className="sheet__photo" key={`${ev.id}-${shot}`}>
                <Photo eventId={ev.id} index={shot} src={media.photos[shot]} eager alt={`${media.edition}, foto ${shot + 1}`} />
              </div>
              <div className="sheet__thumbs" role="group" aria-label="Fotos da edição anterior">
                {media.photos.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    className={i === shot ? 'is-active' : undefined}
                    aria-label={`Ver foto ${i + 1}`}
                    aria-pressed={i === shot}
                    onClick={() => setShot(i)}
                  >
                    <Photo eventId={ev.id} index={i} src={src} />
                  </button>
                ))}
              </div>
              <a className="sheet__credit" href={media.source} target="_blank" rel="noopener noreferrer">
                Fotos: {media.edition}
              </a>
            </div>
          )}
          <div className="sheet__hero">
            <div className="sheet__tags">
              <span className="acronym acronym--solid">{ev.acronym}</span>
              <span className="type-tag">{eventTypeLabel(ev.type)}</span>
              {ev.status === 'a-confirmar' && <span className="status-tag">Informações a confirmar</span>}
            </div>
            <h2 id="sheet-title" className="sheet__title">{ev.name}</h2>
            <p className="sheet__range">{cap(formatRange(ev, true))}</p>
          </div>

          <dl className="sheet__dates">
            <div>
              <dt>Início</dt>
              <dd>
                <strong>{formatLong(ev.start)}</strong>
                <span>{cap(weekdayLong(ev.start))}</span>
              </dd>
            </div>
            <div>
              <dt>Término</dt>
              <dd>
                <strong>{formatLong(ev.end)}</strong>
                <span>{cap(weekdayLong(ev.end))}</span>
              </dd>
            </div>
            <div>
              <dt>Duração</dt>
              <dd>
                <strong>{pluralDays(durationDays(ev))}</strong>
                <span>{countdown(ev, today)}</span>
              </dd>
            </div>
          </dl>

          {near.length > 0 && (
            <div className="sheet__block">
              <h3>Eventos próximos</h3>
              <ul className="near-list">
                {near.map((p) => (
                  <li key={p.other.id}>
                    <button type="button" onClick={() => onSelect(p.other.id)} style={{ '--ev': p.other.color } as CSSProperties}>
                      <span className="swatch" aria-hidden="true" />
                      <strong>{p.other.acronym}</strong>
                      <span>{formatRange(p.other)}</span>
                      <em>
                        {p.overlap
                          ? 'Simultâneo'
                          : p.gap === 0
                            ? 'Em sequência'
                            : `${pluralDays(p.gap)} livres ${p.other.start > ev.end ? 'depois' : 'antes'}`}
                      </em>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="sheet__block">
            <h3>Informações complementares</h3>
            {ev.pendingFields?.length ? (
              <p className="pending">Aguardando confirmação: {ev.pendingFields.join(', ').toLowerCase()}.</p>
            ) : null}
            <dl className="info-list">
              {info.map((row) => (
                <div key={row.label} className={row.value ? undefined : 'is-empty'}>
                  <dt>
                    <Icon name={row.icon} size={16} /> {row.label}
                  </dt>
                  <dd>{row.value ?? 'A definir'}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="sheet__actions">
          <button type="button" className="btn btn--primary" onClick={() => onOpenMonth(monthOf(ev.start))}>
            <Icon name="month" size={16} /> Ver no mês
          </button>
          {FEATURES.copyPageLink ? (
            <button type="button" className="btn btn--ghost" onClick={copyLink}>
              <Icon name="link" size={16} /> Copiar link
            </button>
          ) : (
            <button type="button" className="btn btn--ghost" onClick={copySummary}>
              <Icon name="copy" size={16} /> Copiar resumo
            </button>
          )}
          {FEATURES.download && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => downloadFile(`${ev.id}-${SITE.year}.ics`, buildICS([ev], SITE.organization), 'text/calendar;charset=utf-8')}
            >
              <Icon name="download" size={16} /> Adicionar à agenda
            </button>
          )}
          <span className="toast" role="status" aria-live="polite">
            {toast}
          </span>
        </div>
        {fallback && (
          <div className="fallback">
            <label htmlFor="copy-fallback">Selecione e copie:</label>
            <textarea id="copy-fallback" readOnly value={fallback} rows={3} onFocus={(e) => e.currentTarget.select()} autoFocus />
          </div>
        )}
      </div>
    </div>
  );
}
