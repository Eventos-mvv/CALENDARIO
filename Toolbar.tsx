import { FEATURES } from '../config';
import { Icon } from './Icon';

export type View = 'ano' | 'mes';

interface Props {
  view: View;
  onView: (v: View) => void;
  onPrint: () => void;
  onExportIcs: () => void;
}

export function Toolbar({ view, onView, onPrint, onExportIcs }: Props) {
  return (
    <div className="toolbar">
      <div className="segmented" role="tablist" aria-label="Forma de visualização">
        <button type="button" role="tab" aria-selected={view === 'ano'} className={view === 'ano' ? 'is-active' : ''} onClick={() => onView('ano')}>
          <Icon name="grid" size={16} /> Visão anual
        </button>
        <button type="button" role="tab" aria-selected={view === 'mes'} className={view === 'mes' ? 'is-active' : ''} onClick={() => onView('mes')}>
          <Icon name="month" size={16} /> Visão mensal
        </button>
      </div>
      <div className="toolbar__actions">
        <a className="btn btn--ghost btn--compact" href="#agenda">
          Agenda
        </a>
        {FEATURES.print && (
          <>
            <button type="button" className="btn btn--ghost btn--compact" onClick={onPrint} aria-label="Imprimir calendário">
              <Icon name="print" size={16} /> <span className="hide-sm">Imprimir</span>
            </button>
            <a
              className="btn btn--ghost btn--compact"
              href={`${import.meta.env.BASE_URL}calendario-mvv-2027.pdf`}
              download="Calendario-Eventos-MVV-2027.pdf"
              title="PDF em A4 paisagem: os 12 meses e a agenda"
            >
              <Icon name="file" size={16} /> <span className="hide-sm">Baixar</span> PDF
            </a>
          </>
        )}
        {FEATURES.download && (
          <button type="button" className="btn btn--ghost btn--compact" onClick={onExportIcs} title="Arquivo .ics para Google Agenda, Outlook ou iPhone">
            <Icon name="download" size={16} /> <span className="hide-sm">Agenda</span> .ics
          </button>
        )}
      </div>
    </div>
  );
}
