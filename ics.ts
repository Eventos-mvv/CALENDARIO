import type { CalendarEvent } from '../domain/types';
import { parseISO } from '../domain/calendar';

const icsDate = (iso: string) => iso.replace(/-/g, '');

function nextDay(iso: string): string {
  const d = new Date(parseISO(iso).getTime() + 86_400_000);
  return d.toISOString().slice(0, 10);
}

const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** Gera um arquivo .ics (dia inteiro) para importar no Google Agenda, Outlook ou iPhone. */
export function buildICS(events: CalendarEvent[], organization: string): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${escape(organization)}//Calendario de Eventos//PT-BR`,
    'CALSCALE:GREGORIAN',
  ];
  for (const ev of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.id}-${ev.start}@mvv-calendario`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(ev.start)}`,
      `DTEND;VALUE=DATE:${icsDate(nextDay(ev.end))}`,
      `SUMMARY:${escape(`${ev.acronym} — ${ev.name}`)}`,
      ...(ev.location ? [`LOCATION:${escape(ev.location)}`] : []),
      ...(ev.description ? [`DESCRIPTION:${escape(ev.description)}`] : []),
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
