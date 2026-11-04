/**
 * Modelo de domínio do calendário.
 *
 * Datas são sempre strings ISO "AAAA-MM-DD" (sem horário e sem fuso),
 * o mesmo formato que um banco de dados ou API devolveria. Isso evita
 * deslocamentos de fuso horário ao converter para Date.
 */

export type ISODate = string;

/** Identificador estável do tipo de evento (usado em filtros e futuramente no banco). */
export type EventTypeId = 'reuniao' | 'conferencia-ministros' | 'conferencia' | 'evento-geral' | 'formatura';

export interface EventType {
  id: EventTypeId;
  label: string;
}

export type EventStatus = 'confirmado' | 'a-confirmar';

export interface CalendarEvent {
  /** Identificador estável, usado em links compartilháveis (#evento-<id>). */
  id: string;
  /** Sigla curta exibida no calendário. */
  acronym: string;
  /** Nome completo. */
  name: string;
  type: EventTypeId;
  start: ISODate;
  /** Para eventos de um dia, end === start. */
  end: ISODate;
  /** Cor de identificação em hexadecimal. */
  color: string;
  status: EventStatus;

  // Campos complementares — preenchidos pelo futuro painel administrativo.
  description?: string;
  location?: string;
  responsible?: string;
  schedule?: string;
  notes?: string;
  /** Lista de campos que ainda aguardam confirmação (exibidos como pendências). */
  pendingFields?: string[];
}

/** Dados de entrada do futuro painel administrativo (cadastro/edição). */
export type CalendarEventInput = Omit<CalendarEvent, 'id'> & { id?: string };
