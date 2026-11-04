import { describe, expect, it } from 'vitest';
import {
  daysInMonth, durationDays, formatBR, formatRange, monthMatrix, mondayIndex, monthsTouched, todayISO, weekdayLong,
} from './calendar';
import { computeStats, findProximities } from './stats';
import { applyFilters, EMPTY_FILTERS } from './filters';
import { validateEvent } from './validation';
import { EVENTS_2027 } from '../data/events.2027';

const byId = (id: string) => EVENTS_2027.find((e) => e.id === id)!;

describe('Ano de 2027', () => {
  it('1º de janeiro de 2027 é sexta-feira', () => {
    expect(weekdayLong('2027-01-01')).toBe('sexta-feira');
    expect(mondayIndex('2027-01-01')).toBe(4);
  });

  it('tem 365 dias e fevereiro com 28', () => {
    const total = Array.from({ length: 12 }, (_, m) => daysInMonth(2027, m)).reduce((a, b) => a + b, 0);
    expect(total).toBe(365);
    expect(daysInMonth(2027, 1)).toBe(28);
  });

  it('cada grade mensal começa na segunda e contém todos os dias do mês', () => {
    for (let m = 0; m < 12; m++) {
      const weeks = monthMatrix(2027, m);
      const inMonth = weeks.flat().filter((c) => c.inMonth);
      expect(inMonth.length).toBe(daysInMonth(2027, m));
      expect(weeks.every((w) => w.length === 7)).toBe(true);
      expect(mondayIndex(weeks[0][0].iso)).toBe(0);
    }
  });
});

describe('Eventos oficiais', () => {
  it('estão todos cadastrados e válidos', () => {
    expect(EVENTS_2027).toHaveLength(8);
    for (const ev of EVENTS_2027) expect(validateEvent(ev)).toEqual([]);
  });

  it.each([
    ['rpd', '2027-03-18', '2027-03-21', 4, 'quinta-feira', 'domingo'],
    ['cm-co-norte', '2027-05-13', '2027-05-20', 8, 'quinta-feira', 'quinta-feira'],
    ['cmne', '2027-07-14', '2027-07-17', 4, 'quarta-feira', 'sábado'],
    ['jpn', '2027-07-22', '2027-07-25', 4, 'quinta-feira', 'domingo'],
    ['cmse', '2027-09-10', '2027-09-13', 4, 'sexta-feira', 'segunda-feira'],
    ['cm-sul', '2027-09-16', '2027-09-18', 3, 'quinta-feira', 'sábado'],
    ['chm', '2027-10-14', '2027-10-17', 4, 'quinta-feira', 'domingo'],
    ['formatura', '2027-12-04', '2027-12-04', 1, 'sábado', 'sábado'],
  ])('%s: %s a %s', (id, start, end, days, wStart, wEnd) => {
    const ev = byId(id);
    expect(ev.start).toBe(start);
    expect(ev.end).toBe(end);
    expect(durationDays(ev)).toBe(days);
    expect(weekdayLong(ev.start)).toBe(wStart);
    expect(weekdayLong(ev.end)).toBe(wEnd);
  });

  it('formata datas no padrão brasileiro', () => {
    expect(formatBR('2027-03-18')).toBe('18/03/2027');
    expect(formatRange(byId('rpd'))).toBe('18 a 21 de março');
    expect(formatRange(byId('formatura'), true)).toBe('4 de dezembro de 2027');
    expect(formatRange({ start: '2027-04-28', end: '2027-05-02' })).toBe('28 de abril a 2 de maio');
  });

  it('identifica meses atravessados', () => {
    expect(monthsTouched({ start: '2027-04-28', end: '2027-05-02' })).toEqual([3, 4]);
  });
});

describe('Indicadores', () => {
  const stats = computeStats(EVENTS_2027, '2026-11-03');

  it('calcula total, meses e mês mais movimentado', () => {
    expect(stats.total).toBe(8);
    expect(stats.monthsWithEvents).toBe(6);
    expect(stats.busiest).toEqual({ months: [6, 8], count: 2 });
    expect(stats.eventDays).toBe(32);
  });

  it('próximo evento a partir de hoje', () => {
    expect(stats.next?.event.id).toBe('rpd');
    expect(stats.next?.daysUntil).toBe(135);
    const during = computeStats(EVENTS_2027, '2027-05-15');
    expect(during.next?.event.id).toBe('cm-co-norte');
    expect(during.next?.ongoing).toBe(true);
    expect(computeStats(EVENTS_2027, '2028-01-01').next).toBeNull();
  });

  it('detecta eventos próximos', () => {
    const near = findProximities(EVENTS_2027, byId('cmse'));
    expect(near.map((p) => [p.other.id, p.gap])).toEqual([['cm-sul', 2]]);
  });

  it('data de hoje no fuso de Brasília', () => {
    expect(todayISO(new Date('2027-01-01T02:00:00Z'))).toBe('2026-12-31');
  });
});

describe('Filtros e pesquisa', () => {
  it('pesquisa por sigla, nome e sem acento', () => {
    const q = (query: string) => applyFilters(EVENTS_2027, { ...EMPTY_FILTERS, query }).map((e) => e.id);
    expect(q('cmsul')).toEqual(['cm-sul']);
    expect(q('nordeste')).toEqual(['cmne']);
    expect(q('conferencia de homens')).toEqual(['chm']);
    expect(q('co/norte')).toEqual(['cm-co-norte']);
  });

  it('filtra por mês, tipo e legenda', () => {
    expect(applyFilters(EVENTS_2027, { ...EMPTY_FILTERS, month: 6 }).map((e) => e.id)).toEqual(['cmne', 'jpn']);
    expect(applyFilters(EVENTS_2027, { ...EMPTY_FILTERS, type: 'conferencia-ministros' })).toHaveLength(4);
    expect(applyFilters(EVENTS_2027, { ...EMPTY_FILTERS, hidden: ['rpd'] })).toHaveLength(7);
  });
});
