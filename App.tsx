import { useCallback, useEffect, useMemo, useState } from 'react';
import { SITE } from './config';
import { useEvents } from './hooks/useEvents';
import { useMediaQuery } from './hooks/useMediaQuery';
import { hashFor, useHashRoute } from './hooks/useHashRoute';
import { monthOf, todayISO } from './domain/calendar';
import { computeStats } from './domain/stats';
import { applyFilters, EMPTY_FILTERS, type EventFilters } from './domain/filters';
import { buildICS, downloadFile } from './utils/ics';
import { Hero } from './components/Hero';
import { Season } from './components/Season';
import { Marquee } from './components/Marquee';
import { Cursor } from './components/Cursor';
import { ScrollTrigger, scrollToSection, startSmoothScroll } from './motion/smooth';
import { SiteNav } from './components/SiteNav';
import { YearRibbon } from './components/YearRibbon';
import { StatsBar } from './components/StatsBar';
import { Toolbar, type View } from './components/Toolbar';
import { Legend } from './components/Legend';
import { YearView } from './components/YearView';
import { MonthView } from './components/MonthView';
import { Agenda } from './components/Agenda';
import { EventModal } from './components/EventModal';
import { PrintSheet } from './components/PrintSheet';

const TODAY = import.meta.env.VITE_TODAY || todayISO();

export default function App() {
  const year = SITE.year;
  const { events, loading, error } = useEvents(year);
  const isMobile = useMediaQuery('(max-width: 719px)');
  const [route, navigate] = useHashRoute();

  const defaultMonth = useMemo(() => {
    if (TODAY.startsWith(String(year))) return monthOf(TODAY);
    const upcoming = events.find((e) => e.end >= TODAY) ?? events[0];
    return upcoming ? monthOf(upcoming.start) : 0;
  }, [events, year]);

  const [view, setView] = useState<View>(() =>
    route.kind === 'mes' ? 'mes' : route.kind === 'ano' ? 'ano' : isMobile ? 'mes' : 'ano',
  );
  const [month, setMonth] = useState<number | null>(route.kind === 'mes' ? route.month : null);
  const [filters, setFilters] = useState<EventFilters>(EMPTY_FILTERS);

  const currentMonth = month ?? defaultMonth;
  const selectedId = route.kind === 'evento' ? route.id : null;
  const selected = events.find((e) => e.id === selectedId) ?? null;

  // Mantém a tela em sincronia quando a âncora muda (links compartilhados, botão voltar).
  useEffect(() => {
    if (route.kind === 'mes') {
      setView('mes');
      setMonth(route.month);
    } else if (route.kind === 'ano') setView('ano');
  }, [route]);

  // Rolagem suave e atalhos internos (#eventos, #calendario, #agenda).
  useEffect(() => {
    const stop = startSmoothScroll();
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      const id = a?.getAttribute('href')?.slice(1);
      if (!id || !document.getElementById(id) || id.startsWith('evento-') || id.startsWith('mes-')) return;
      e.preventDefault();
      scrollToSection(id);
    };
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('click', onClick);
      stop();
    };
  }, []);

  // A altura da página muda ao trocar de visão; as animações recalculam posições.
  useEffect(() => {
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => window.clearTimeout(t);
  }, [view, currentMonth, filters, loading]);

  // Link direto para um evento: posiciona o mês do evento por trás do painel.
  useEffect(() => {
    if (selected && month === null) setMonth(monthOf(selected.start));
  }, [selected, month]);

  const viewHash = useCallback(
    (v: View, m: number) => (v === 'ano' ? hashFor.ano() : hashFor.mes(m)),
    [],
  );

  const changeView = (v: View) => {
    setView(v);
    navigate(viewHash(v, currentMonth));
  };
  const openMonth = (m: number) => {
    setMonth(m);
    setView('mes');
    navigate(hashFor.mes(m));
    requestAnimationFrame(() => scrollToSection('calendario'));
  };
  const changeMonth = (m: number) => {
    setMonth(m);
    navigate(hashFor.mes(m));
  };
  const openEvent = (id: string) => navigate(hashFor.evento(id), 'push');
  const closeEvent = useCallback(() => navigate(viewHash(view, currentMonth)), [navigate, viewHash, view, currentMonth]);

  const patchFilters = (patch: Partial<EventFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const toggleHidden = (id: string) =>
    setFilters((f) => ({ ...f, hidden: f.hidden.includes(id) ? f.hidden.filter((h) => h !== id) : [...f.hidden, id] }));

  const stats = useMemo(() => computeStats(events, TODAY), [events]);
  // O calendário respeita legenda, tipo e pesquisa; o filtro de mês vale só para a agenda.
  const calendarEvents = useMemo(() => applyFilters(events, { ...filters, month: -1 }), [events, filters]);
  const agendaEvents = useMemo(() => applyFilters(events, filters), [events, filters]);

  const print = () => window.print();

  if (error) {
    return (
      <main className="page">
        <p className="empty">Não foi possível carregar os eventos: {error} Recarregue a página para tentar novamente.</p>
      </main>
    );
  }

  return (
    <>
      <a className="skip-link" href="#calendario">
        Ir para o calendário
      </a>
      {!loading && events.length > 0 && (
        <>
          <Hero events={events} stats={stats} today={TODAY} onSelect={openEvent} />
          <SiteNav />
          <Marquee events={events} />
          <Season events={events} today={TODAY} onSelect={openEvent} onOpenMonth={openMonth} />
        </>
      )}
      <div className="page">
        {!loading && (
          <>
            <div className="page__intro">
              <h2 className="section-title">Planejamento do ano</h2>
              <p className="section-sub">Indicadores, calendário completo e agenda para consulta.</p>
            </div>
            <YearRibbon year={year} events={calendarEvents} today={TODAY} onSelect={openEvent} onMonth={openMonth} />
            <StatsBar stats={stats} onSelect={openEvent} onMonth={openMonth} />

            <main id="calendario" className="calendar-section" tabIndex={-1}>
              <Toolbar
                view={view}
                onView={changeView}
                onPrint={print}
                onExportIcs={() => downloadFile(`eventos-mvv-${year}.ics`, buildICS(events, SITE.organization), 'text/calendar;charset=utf-8')}
              />
              <Legend
                events={events}
                hidden={filters.hidden}
                onToggle={toggleHidden}
                onShowAll={() => patchFilters({ hidden: [] })}
              />
              {view === 'ano' ? (
                <YearView year={year} events={calendarEvents} today={TODAY} onSelect={openEvent} onOpenMonth={openMonth} />
              ) : (
                <MonthView
                  year={year}
                  month={currentMonth}
                  events={calendarEvents}
                  allEvents={events}
                  today={TODAY}
                  onMonth={changeMonth}
                  onSelect={openEvent}
                />
              )}
            </main>

            <Agenda
              events={agendaEvents}
              allEvents={events}
              filters={filters}
              onFilters={patchFilters}
              onReset={() => setFilters(EMPTY_FILTERS)}
              onOpen={openEvent}
            />

            <footer className="site-foot">
              <p>
                {SITE.organization}, {SITE.department}
              </p>
              <p>Datas sujeitas a atualização. Informações complementares serão incluídas conforme confirmação.</p>
            </footer>
          </>
        )}
      </div>

      {selected && (
        <EventModal
          event={selected}
          allEvents={events}
          today={TODAY}
          onClose={closeEvent}
          onSelect={(id) => navigate(hashFor.evento(id))}
          onOpenMonth={(m) => {
            setMonth(m);
            setView('mes');
            navigate(hashFor.mes(m));
          }}
        />
      )}

      {!loading && <PrintSheet events={events} />}
      <Cursor />
    </>
  );
}
