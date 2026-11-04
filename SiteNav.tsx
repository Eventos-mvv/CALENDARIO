import { SITE } from '../config';

/** Barra fixa com atalhos para as seções da página. */
export function SiteNav() {
  return (
    <nav className="site-nav" aria-label="Seções">
      <div className="site-nav__inner">
        <a className="site-nav__brand" href="#topo">
          MVV <span>{SITE.year}</span>
        </a>
        <div className="site-nav__links">
          <a href="#eventos">Eventos</a>
          <a href="#calendario">Calendário</a>
          <a href="#agenda">Agenda</a>
        </div>
      </div>
    </nav>
  );
}
