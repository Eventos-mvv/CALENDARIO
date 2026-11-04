import type { CalendarEvent } from '../domain/types';

/**
 * Eventos oficiais do MVV em 2027.
 *
 * Fonte única dos dados nesta primeira versão. Para editar uma data, nome
 * ou cor, altere apenas este arquivo. Quando houver painel administrativo,
 * estes registros passam a vir do banco/API através de `eventRepository`.
 *
 * As cores foram validadas para daltonismo (pares vizinhos no calendário) e
 * para contraste com número branco por cima. Ao trocar uma cor, valide de novo.
 *
 * Campos como local, responsável, horários e descrição foram deixados em
 * branco de propósito: ainda não foram informados.
 */
export const EVENTS_2027: CalendarEvent[] = [
  {
    id: 'rpd',
    acronym: 'RPD',
    name: 'Reunião de Pastores e Diretorias',
    type: 'reuniao',
    start: '2027-03-18',
    end: '2027-03-21',
    color: '#2A6DD0',
    status: 'confirmado',
  },
  {
    id: 'cm-co-norte',
    acronym: 'CM CO/NORTE',
    name: 'Conferência de Ministros Centro-Oeste/Norte',
    type: 'conferencia-ministros',
    start: '2027-05-13',
    end: '2027-05-20',
    color: '#D4561C',
    status: 'confirmado',
  },
  {
    id: 'cmne',
    acronym: 'CMNE',
    name: 'Conferência de Ministros Nordeste',
    type: 'conferencia-ministros',
    start: '2027-07-14',
    end: '2027-07-17',
    color: '#0F8A6C',
    status: 'confirmado',
  },
  {
    id: 'jpn',
    acronym: 'JPN',
    name: 'JPN Global',
    type: 'evento-geral',
    start: '2027-07-22',
    end: '2027-07-25',
    color: '#A97300',
    status: 'confirmado',
  },
  {
    id: 'cmse',
    acronym: 'CMSE',
    name: 'Conferência de Ministros Sudeste',
    type: 'conferencia-ministros',
    start: '2027-09-10',
    end: '2027-09-13',
    color: '#CC4A86',
    status: 'confirmado',
  },
  {
    id: 'cm-sul',
    acronym: 'CM SUL',
    name: 'Conferência de Ministros Sul',
    type: 'conferencia-ministros',
    start: '2027-09-16',
    end: '2027-09-18',
    color: '#2D7E22',
    status: 'confirmado',
  },
  {
    id: 'chm',
    acronym: 'CHM',
    name: 'Conferência de Homens',
    type: 'conferencia',
    start: '2027-10-14',
    end: '2027-10-17',
    color: '#6652D6',
    status: 'confirmado',
  },
  {
    id: 'formatura',
    acronym: 'FORMATURA',
    name: 'Formatura',
    type: 'formatura',
    start: '2027-12-04',
    end: '2027-12-04',
    color: '#D23B3B',
    status: 'a-confirmar',
    pendingFields: ['Nome completo da formatura', 'Local', 'Horário'],
  },
];
