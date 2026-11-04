import type { EventType } from '../domain/types';

export const EVENT_TYPES: EventType[] = [
  { id: 'reuniao', label: 'Reunião de liderança' },
  { id: 'conferencia-ministros', label: 'Conferência de Ministros' },
  { id: 'conferencia', label: 'Conferência' },
  { id: 'evento-geral', label: 'Evento geral' },
  { id: 'formatura', label: 'Formatura' },
];

export const eventTypeLabel = (id: string): string =>
  EVENT_TYPES.find((t) => t.id === id)?.label ?? 'Evento';
