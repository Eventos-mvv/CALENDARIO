/**
 * Desenho das folhas do calendário de mesa (canvas → textura).
 * Cada mês usa as datas reais de 2027 e pinta os dias de evento.
 */
import type { CalendarEvent } from '../domain/types';
import { MONTH_NAMES, WEEKDAYS_INITIAL, monthMatrix, monthsTouched } from '../domain/calendar';

export const PAGE_W = 1024;
export const PAGE_H = 1170;

export interface ArtOptions {
  year: number;
  events: CalendarEvent[];
  font: string;
  accent: string;
  ink: string;
  muted: string;
  organization: string;
}

type Ctx = CanvasRenderingContext2D;
type Stretch = CanvasRenderingContext2D['fontStretch'];

function canvas(): [HTMLCanvasElement, Ctx] {
  const c = document.createElement('canvas');
  c.width = PAGE_W;
  c.height = PAGE_H;
  return [c, c.getContext('2d') as Ctx];
}

function paper(ctx: Ctx, base: string) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  // fibras do papel
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = `rgba(60,40,40,${Math.random() * 0.035})`;
    ctx.fillRect(Math.random() * PAGE_W, Math.random() * PAGE_H, 1 + Math.random() * 2, 1);
  }
}

function holes(ctx: Ctx, count: number, color: string) {
  const gap = PAGE_W / (count + 1);
  for (let i = 1; i <= count; i++) {
    ctx.beginPath();
    ctx.arc(i * gap, 34, 11, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function setFont(ctx: Ctx, weight: number, size: number, family: string, stretch: Stretch = 'normal') {
  ctx.font = `${weight} ${size}px ${family}`;
  if ('fontStretch' in ctx) ctx.fontStretch = stretch;
}

export function drawCover(o: ArtOptions, rings: number): HTMLCanvasElement {
  const [c, ctx] = canvas();
  ctx.fillStyle = o.accent;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.06})`;
    ctx.fillRect(Math.random() * PAGE_W, Math.random() * PAGE_H, 2, 1);
  }
  holes(ctx, rings, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = '#fff';
  setFont(ctx, 700, 34, o.font, 'expanded');
  ctx.fillText(o.organization, 70, 150);
  ctx.fillRect(70, 178, PAGE_W - 140, 3);
  setFont(ctx, 800, 520, o.font, 'extra-condensed');
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(String(o.year), 52, 760);
  ctx.fillRect(70, 860, PAGE_W - 140, 3);
  setFont(ctx, 700, 74, o.font, 'semi-condensed');
  ctx.fillText('Calendário de Eventos', 70, 960);
  setFont(ctx, 400, 34, o.font);
  ctx.globalAlpha = 0.8;
  ctx.fillText('Coordenação de Eventos', 70, 1030);
  ctx.globalAlpha = 1;
  return c;
}

export function drawMonth(o: ArtOptions, month: number, rings: number): HTMLCanvasElement {
  const [c, ctx] = canvas();
  paper(ctx, '#fffefe');
  holes(ctx, rings, '#d9d4d6');

  const left = 70;
  const right = PAGE_W - 70;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = o.accent;
  setFont(ctx, 800, 190, o.font, 'extra-condensed');
  ctx.fillText(MONTH_NAMES[month], left - 4, 270);
  ctx.fillStyle = o.muted;
  setFont(ctx, 500, 44, o.font, 'expanded');
  ctx.textAlign = 'right';
  ctx.fillText(String(o.year), right, 262);
  ctx.textAlign = 'left';
  ctx.fillStyle = o.ink;
  ctx.fillRect(left, 300, right - left, 4);

  const cols = 7;
  const cw = (right - left) / cols;
  const top = 380;
  const rowH = 96;
  ctx.textAlign = 'center';
  setFont(ctx, 700, 30, o.font, 'expanded');
  WEEKDAYS_INITIAL.forEach((d, i) => {
    ctx.fillStyle = i >= 5 ? o.accent : o.muted;
    ctx.fillText(d, left + cw * i + cw / 2, 352);
  });

  const weeks = monthMatrix(o.year, month);
  const monthEvents = o.events.filter((e) => monthsTouched(e).includes(month));
  weeks.forEach((week, r) => {
    const cy = top + r * rowH + rowH / 2;
    // barras dos eventos
    for (const ev of monthEvents) {
      const idx = week.map((cell, i) => (cell.inMonth && cell.iso >= ev.start && cell.iso <= ev.end ? i : -1)).filter((i) => i >= 0);
      if (!idx.length) continue;
      const a = idx[0];
      const b = idx[idx.length - 1];
      const startsHere = week[a].iso === ev.start;
      const endsHere = week[b].iso === ev.end;
      const x0 = left + a * cw + (startsHere ? 10 : 0);
      const x1 = left + (b + 1) * cw - (endsHere ? 10 : 0);
      const h = 74;
      const rad = h / 2;
      ctx.fillStyle = ev.color;
      ctx.beginPath();
      ctx.roundRect(x0, cy - h / 2, x1 - x0, h, [startsHere ? rad : 0, endsHere ? rad : 0, endsHere ? rad : 0, startsHere ? rad : 0]);
      ctx.fill();
    }
    week.forEach((cell, i) => {
      if (!cell.inMonth) return;
      const busy = monthEvents.some((e) => cell.iso >= e.start && cell.iso <= e.end);
      ctx.fillStyle = busy ? '#fff' : i >= 5 ? o.muted : o.ink;
      setFont(ctx, busy ? 800 : 500, 46, o.font);
      ctx.fillText(String(cell.day), left + cw * i + cw / 2, cy + 16);
    });
  });

  // legenda dos eventos do mês
  ctx.textAlign = 'left';
  let y = top + weeks.length * rowH + 70;
  ctx.fillStyle = o.ink;
  ctx.fillRect(left, y - 46, right - left, 2);
  if (!monthEvents.length) {
    ctx.fillStyle = o.muted;
    setFont(ctx, 400, 32, o.font);
    ctx.fillText('Sem eventos neste mês', left, y + 4);
  }
  for (const ev of monthEvents.slice(0, 2)) {
    ctx.fillStyle = ev.color;
    ctx.fillRect(left, y - 26, 30, 30);
    ctx.fillStyle = o.ink;
    setFont(ctx, 800, 40, o.font, 'condensed');
    ctx.fillText(ev.acronym, left + 48, y + 2);
    const w = ctx.measureText(ev.acronym).width;
    ctx.fillStyle = o.muted;
    setFont(ctx, 400, 30, o.font);
    const s = Number(ev.start.slice(8));
    const e = Number(ev.end.slice(8));
    ctx.fillText(`${s === e ? s : `${s} a ${e}`}  ${ev.name}`, left + 48 + w + 18, y);
    y += 56;
  }
  return c;
}

export function drawBack(o: ArtOptions, rings: number): HTMLCanvasElement {
  const [c, ctx] = canvas();
  paper(ctx, '#f6f3f3');
  // o verso é visto espelhado; o desenho já sai invertido
  ctx.translate(PAGE_W, 0);
  ctx.scale(-1, 1);
  holes(ctx, rings, '#d9d4d6');
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  setFont(ctx, 700, 28, o.font, 'expanded');
  ctx.textAlign = 'center';
  ctx.fillText(`MVV ${o.year}`, PAGE_W / 2, PAGE_H - 60);
  return c;
}
