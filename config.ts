/** Configurações gerais do site. Alterar o ano aqui prepara o calendário de outro ciclo. */
export const SITE = {
  year: 2027,
  organization: 'Ministério Verbo da Vida',
  department: 'Coordenação de Eventos',
  title: 'Calendário de Eventos',
  subtitle: 'Planejamento anual de eventos e conferências.',
  /** Dias livres entre eventos abaixo dos quais o calendário avisa que estão próximos. */
  proximityDays: 7,
} as const;

/**
 * Recursos que dependem do navegador do usuário (imprimir, baixar arquivo,
 * copiar link da própria página). Ficam desativados na pré-visualização
 * hospedada pelo Claude, onde o navegador bloqueia essas ações.
 */
export const FEATURES = {
  print: import.meta.env.VITE_EMBEDDED !== '1',
  download: import.meta.env.VITE_EMBEDDED !== '1',
  copyPageLink: import.meta.env.VITE_EMBEDDED !== '1',
  /** A pré-visualização bloqueia imagens de outros sites; lá ficam só os fundos de cor. */
  remotePhotos: import.meta.env.VITE_EMBEDDED !== '1',
};
