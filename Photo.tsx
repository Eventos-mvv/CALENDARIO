import { useMemo, useState, type CSSProperties } from 'react';
import { photoCandidates } from '../data/media';
import { FEATURES } from '../config';

interface Props {
  eventId: string;
  index: number;
  src: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  eager?: boolean;
}

/**
 * Foto com fallback: tenta a cópia local, depois o endereço original.
 * Se nenhuma carregar, some — o fundo de cor do evento fica visível no lugar.
 */
export function Photo({ eventId, index, src, alt = '', className, style, eager }: Props) {
  const candidates = useMemo(() => photoCandidates(eventId, index, src), [eventId, index, src]);
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  if (!FEATURES.remotePhotos || attempt >= candidates.length) return null;
  return (
    <img
      src={candidates[attempt]}
      alt={alt}
      className={`${className ?? ''}${loaded ? ' is-loaded' : ''}`}
      style={style}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      draggable={false}
      onLoad={() => setLoaded(true)}
      onError={() => setAttempt((a) => a + 1)}
    />
  );
}
