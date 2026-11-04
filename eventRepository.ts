/**
 * Camada de acesso aos dados.
 *
 * A interface usa somente `EventRepository`. Hoje a implementação lê a
 * lista estática de `data/events.2027.ts`. Para ligar a um banco de dados
 * ou API (Firebase, Supabase, REST próprio), crie outra classe que
 * implemente a mesma interface e troque a instância exportada no final
 * do arquivo — nenhum componente precisa mudar.
 */
import type { CalendarEvent, CalendarEventInput } from '../domain/types';
import { sanitizeEvents, slugify, validateEvent } from '../domain/validation';
import { EVENTS_2027 } from '../data/events.2027';

export interface EventRepository {
  list(year: number): Promise<CalendarEvent[]>;
  // Operações do futuro painel administrativo:
  create(input: CalendarEventInput): Promise<CalendarEvent>;
  update(id: string, patch: Partial<CalendarEventInput>): Promise<CalendarEvent>;
  remove(id: string): Promise<void>;
}

export class StaticEventRepository implements EventRepository {
  private events: CalendarEvent[];

  constructor(seed: CalendarEvent[]) {
    this.events = sanitizeEvents(seed);
  }

  async list(year: number): Promise<CalendarEvent[]> {
    const y = String(year);
    return this.events.filter((ev) => ev.start.startsWith(y) || ev.end.startsWith(y));
  }

  async create(input: CalendarEventInput): Promise<CalendarEvent> {
    const errors = validateEvent(input);
    if (errors.length) throw new Error(errors.join(' '));
    let id = input.id || slugify(input.acronym);
    while (this.events.some((e) => e.id === id)) id = `${id}-2`;
    const ev: CalendarEvent = { ...input, id };
    this.events = [...this.events, ev];
    return ev;
  }

  async update(id: string, patch: Partial<CalendarEventInput>): Promise<CalendarEvent> {
    const current = this.events.find((e) => e.id === id);
    if (!current) throw new Error(`Evento "${id}" não encontrado.`);
    const next: CalendarEvent = { ...current, ...patch, id };
    const errors = validateEvent(next);
    if (errors.length) throw new Error(errors.join(' '));
    this.events = this.events.map((e) => (e.id === id ? next : e));
    return next;
  }

  async remove(id: string): Promise<void> {
    this.events = this.events.filter((e) => e.id !== id);
  }
}

export const eventRepository: EventRepository = new StaticEventRepository(EVENTS_2027);
