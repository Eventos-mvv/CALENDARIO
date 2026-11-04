import type { CalendarEvent, CalendarEventInput } from './types';
import { EVENT_TYPES } from '../data/eventTypes';

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function isRealDate(iso: string): boolean {
  if (!ISO_RE.test(iso)) return false;
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/**
 * Valida um evento antes de exibir ou salvar. Usado hoje no carregamento
 * dos dados e, futuramente, no formulário do painel administrativo.
 * Devolve a lista de problemas encontrados (vazia = válido).
 */
export function validateEvent(ev: CalendarEventInput): string[] {
  const errors: string[] = [];
  if (!ev.name?.trim()) errors.push('Informe o nome do evento.');
  if (!ev.acronym?.trim()) errors.push('Informe a sigla do evento.');
  if (!isRealDate(ev.start)) errors.push('Data de início inválida (use AAAA-MM-DD).');
  if (!isRealDate(ev.end)) errors.push('Data de término inválida (use AAAA-MM-DD).');
  if (isRealDate(ev.start) && isRealDate(ev.end) && ev.end < ev.start)
    errors.push('A data de término deve ser igual ou posterior ao início.');
  if (!HEX_RE.test(ev.color)) errors.push('Cor inválida (use o formato #RRGGBB).');
  if (!EVENT_TYPES.some((t) => t.id === ev.type)) errors.push('Tipo de evento desconhecido.');
  return errors;
}

/** Gera um id seguro para URL a partir da sigla. */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Mantém só registros válidos, avisando no console sobre os demais. */
export function sanitizeEvents(list: CalendarEvent[]): CalendarEvent[] {
  return list.filter((ev) => {
    const errs = validateEvent(ev);
    if (errs.length) console.warn(`Evento "${ev.acronym || ev.id}" ignorado:`, errs.join(' '));
    return errs.length === 0;
  });
}
