import { useCallback, useEffect, useState } from 'react';

/**
 * Rotas por âncora, compatíveis com GitHub Pages (sem servidor):
 *   #ano          visão anual
 *   #mes-03       visão mensal de março
 *   #evento-rpd   abre os detalhes do evento "rpd"
 */
export type Route =
  | { kind: 'ano' }
  | { kind: 'mes'; month: number }
  | { kind: 'evento'; id: string }
  | { kind: 'none' };

export function parseHash(hash: string): Route {
  const h = hash.replace(/^#/, '');
  if (h === 'ano') return { kind: 'ano' };
  const mes = /^mes-(\d{2})$/.exec(h);
  if (mes) {
    const m = Number(mes[1]) - 1;
    if (m >= 0 && m < 12) return { kind: 'mes', month: m };
  }
  const ev = /^evento-([a-z0-9-]+)$/.exec(h);
  if (ev) return { kind: 'evento', id: ev[1] };
  return { kind: 'none' };
}

export const hashFor = {
  ano: () => '#ano',
  mes: (m: number) => `#mes-${String(m + 1).padStart(2, '0')}`,
  evento: (id: string) => `#evento-${id}`,
};

export function useHashRoute(): [Route, (hash: string, mode?: 'push' | 'replace') => void] {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((hash: string, mode: 'push' | 'replace' = 'replace') => {
    if (window.location.hash === hash) return;
    try {
      if (mode === 'push') window.location.hash = hash;
      else history.replaceState(null, '', hash);
    } catch {
      /* alguns ambientes incorporados bloqueiam o histórico; a navegação interna segue funcionando */
    }
    setRoute(parseHash(hash));
  }, []);

  return [route, navigate];
}
