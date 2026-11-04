import { useEffect, useState } from 'react';
import type { CalendarEvent } from '../domain/types';
import { sortByStart } from '../domain/calendar';
import { eventRepository } from '../services/eventRepository';

interface State {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
}

/** Carrega os eventos do repositório (hoje estático; amanhã uma API). */
export function useEvents(year: number): State {
  const [state, setState] = useState<State>({ events: [], loading: true, error: null });

  useEffect(() => {
    let alive = true;
    eventRepository
      .list(year)
      .then((list) => alive && setState({ events: sortByStart(list), loading: false, error: null }))
      .catch((err: unknown) =>
        alive && setState({ events: [], loading: false, error: err instanceof Error ? err.message : 'Falha ao carregar os eventos.' }),
      );
    return () => {
      alive = false;
    };
  }, [year]);

  return state;
}
