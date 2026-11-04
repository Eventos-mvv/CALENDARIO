import raw from './media.json';

export interface EventMedia {
  edition: string;
  source: string;
  photos: string[];
}

const table = raw as unknown as Record<string, EventMedia | string>;

/** Fotos de edições anteriores de um evento (vazio se não houver). */
export function mediaFor(eventId: string): EventMedia | null {
  const m = table[eventId];
  return m && typeof m === 'object' && m.photos.length ? m : null;
}

/**
 * Com `npm run fotos`, as imagens são baixadas para public/fotos/<evento>/<n>.jpg
 * e VITE_LOCAL_PHOTOS=1 é gravado em .env.local. Assim o site não depende
 * do site da instituição continuar com os mesmos arquivos.
 */
const LOCAL = import.meta.env.VITE_LOCAL_PHOTOS === '1';

export function photoCandidates(eventId: string, index: number, remote: string): string[] {
  return LOCAL ? [`${import.meta.env.BASE_URL}fotos/${eventId}/${index + 1}.jpg`, remote] : [remote];
}
